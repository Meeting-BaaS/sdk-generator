/**
 * Soniox transcription provider adapter
 * Documentation: https://soniox.com/docs/stt/
 */

import type {
  AudioInput,
  ProviderCapabilities,
  TranscribeOptions,
  UnifiedTranscriptResponse,
  StreamingOptions,
  StreamingCallbacks,
  StreamingSession,
  StreamEvent,
  Utterance,
  Word,
  RawWebSocketMessage
} from "../router/types"
import { BaseAdapter, type ProviderConfig } from "./base-adapter"
import { buildUtterancesFromWords } from "../utils/transcription-helpers"
import { SonioxRegion, type SonioxRegionType } from "../constants"

// Import generated Soniox types
import { TranscriptionStatus as SonioxTranscriptionStatus } from "../generated/soniox/schema/transcriptionStatus"
import type { Model as SonioxModelInfo } from "../generated/soniox/schema/model"
import type { Language as SonioxLanguageInfo } from "../generated/soniox/schema/language"
import type { SonioxModelCode } from "../generated/soniox/models"
import type { CreateTranscriptionPayload } from "../generated/soniox/schema/createTranscriptionPayload"
import type { TranscriptionTranscript } from "../generated/soniox/schema/transcriptionTranscript"
import type { TranscriptionTranscriptToken } from "../generated/soniox/schema/transcriptionTranscriptToken"

// Import generated API functions
import {
  createTranscription,
  getTranscription,
  getTranscriptionTranscript,
  uploadFile,
  getModels as getGeneratedModels
} from "../generated/soniox/api/sonioxPublicAPI"
import type { Transcription as SonioxTranscription } from "../generated/soniox/schema/transcription"
import type { UploadFileBody } from "../generated/soniox/schema/uploadFileBody"

// WebSocket streaming types extracted from official @soniox/speech-to-text-web SDK
import type {
  Token as SonioxStreamingToken,
  StreamingResponse as SonioxStreamingResponse
} from "../generated/soniox/streaming-response-types"

/**
 * Soniox-specific configuration options
 */
export interface SonioxConfig extends ProviderConfig {
  /**
   * Model to use for transcription
   *
   * Use `SonioxModel` constant for type-safe autocomplete:
   * @example
   * ```typescript
   * import { SonioxModel } from 'voice-router-dev/constants'
   * { model: SonioxModel.stt_async_v3 }       // Async/batch
   * { model: SonioxModel.stt_rt_preview }    // Real-time streaming
   * { model: SonioxModel.stt_rt_v3 }         // Real-time v3
   * ```
   *
   * @default "stt-async-preview"
   */
  model?: SonioxModelCode

  /**
   * Regional endpoint for data residency (Sovereign Cloud)
   *
   * Available regions:
   * - `us` - United States (default)
   * - `eu` - European Union
   * - `jp` - Japan
   *
   * All audio, transcripts, and logs stay fully in-region.
   *
   * **IMPORTANT:** Soniox API keys are region-specific. Each project is created
   * with a specific region, and the API key only works with that region's endpoint.
   * The `region` config must match the region of your project's API key.
   *
   * To use a different region, create a new project in that region via the
   * Soniox dashboard and use its API key.
   *
   * @default "us"
   * @see https://soniox.com/docs/stt/data-residency
   */
  region?: SonioxRegionType
}

/**
 * Soniox transcription provider adapter
 *
 * Implements transcription for Soniox API with support for:
 * - Batch transcription (async processing via v1 API)
 * - Real-time streaming (WebSocket)
 * - Speaker diarization
 * - Language identification
 * - Multi-language support
 * - Real-time translation
 * - Endpoint detection
 *
 * @see https://soniox.com/docs/stt/ Soniox Documentation
 * @see https://soniox.com/docs/stt/SDKs/web-sdk Web SDK Reference
 *
 * @example Basic transcription
 * ```typescript
 * import { SonioxAdapter } from '@meeting-baas/sdk';
 *
 * const adapter = new SonioxAdapter();
 * adapter.initialize({
 *   apiKey: process.env.SONIOX_API_KEY
 * });
 *
 * const result = await adapter.transcribe({
 *   type: 'url',
 *   url: 'https://example.com/audio.mp3'
 * }, {
 *   language: 'en'
 * });
 *
 * console.log(result.data.text);
 * ```
 *
 * @example With speaker diarization and language identification
 * ```typescript
 * const result = await adapter.transcribe({
 *   type: 'url',
 *   url: 'https://example.com/meeting.mp3'
 * }, {
 *   diarization: true,
 *   languageDetection: true,
 *   soniox: {
 *     enableEndpointDetection: true
 *   }
 * });
 *
 * console.log('Speakers:', result.data.speakers);
 * console.log('Detected language:', result.data.language);
 * ```
 *
 * @example Real-time streaming transcription
 * ```typescript
 * const session = await adapter.transcribeStream({
 *   encoding: 'linear16',
 *   sampleRate: 16000,
 *   language: 'en',
 *   diarization: true,
 *   sonioxStreaming: {
 *     enableEndpointDetection: true,
 *     enableLanguageIdentification: true
 *   }
 * }, {
 *   onTranscript: (event) => console.log(event.text),
 *   onError: (error) => console.error(error)
 * });
 *
 * // Send audio chunks
 * await session.sendAudio({ data: audioBuffer });
 *
 * // Close when done
 * await session.close();
 * ```
 */
export class SonioxAdapter extends BaseAdapter {
  readonly name = "soniox" as const
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    diarization: true,
    wordTimestamps: true,
    languageDetection: true,
    customVocabulary: true, // Via context parameter
    summarization: false,
    sentimentAnalysis: false,
    entityDetection: false,
    piiRedaction: false,
    listTranscripts: false,
    deleteTranscript: false
  }

  private region: SonioxRegionType = SonioxRegion.us

  /**
   * Default model for batch transcription
   */
  private defaultModel = "stt-async-preview"

  /**
   * Get regional API host based on configured region
   */
  private getRegionalHost(): string {
    switch (this.region) {
      case SonioxRegion.eu:
        return "api.eu.soniox.com"
      case SonioxRegion.jp:
        return "api.jp.soniox.com"
      case SonioxRegion.us:
      default:
        return "api.soniox.com"
    }
  }

  /**
   * Get regional WebSocket host for real-time streaming
   */
  private getRegionalWsHost(): string {
    switch (this.region) {
      case SonioxRegion.eu:
        return "stt-rt.eu.soniox.com"
      case SonioxRegion.jp:
        return "stt-rt.jp.soniox.com"
      case SonioxRegion.us:
      default:
        return "stt-rt.soniox.com"
    }
  }

  /**
   * Get the base URL for API requests (no /v1 suffix — generated functions include /v1 in paths)
   */
  protected get baseUrl(): string {
    if (this.config?.baseUrl) return this.config.baseUrl
    return `https://${this.getRegionalHost()}`
  }

  /**
   * Build axios config with Soniox Bearer auth
   */
  protected getAxiosConfig() {
    return super.getAxiosConfig("Authorization", (key) => `Bearer ${key}`)
  }

  initialize(config: SonioxConfig): void {
    super.initialize(config)

    if (config.region) {
      this.region = config.region
    }

    if (config.model) {
      this.defaultModel = config.model
    }
  }

  /**
   * Get current region
   *
   * @returns Current regional endpoint
   */
  getRegion(): SonioxRegionType {
    return this.region
  }

  /**
   * Set regional endpoint
   *
   * **Note:** Soniox API keys are region-specific. Changing the region
   * requires an API key from a project created in that region.
   * This method updates the endpoint but you must also update the API key.
   *
   * @param region - Regional endpoint to use
   *
   * @example
   * ```typescript
   * // Switch to EU (requires EU project API key)
   * adapter.initialize({
   *   apiKey: process.env.SONIOX_EU_API_KEY,
   *   region: SonioxRegion.eu
   * })
   * ```
   */
  setRegion(region: SonioxRegionType): void {
    this.region = region
  }

  /**
   * Submit audio for transcription
   *
   * Uses the async v1 API: createTranscription returns status `queued`,
   * then polls until completed (or returns immediately if webhook is set).
   *
   * @param audio - Audio input (URL or file)
   * @param options - Transcription options
   * @returns Transcription result
   */
  async transcribe(
    audio: AudioInput,
    options?: TranscribeOptions
  ): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      const sonioxOpts = options?.soniox

      if (audio.type === "file") {
        // File flow: upload first, then create transcription with file_id
        const audioBlob =
          audio.file instanceof Blob
            ? audio.file
            : new Blob([audio.file], { type: audio.mimeType || "audio/wav" })
        const uploadBody: UploadFileBody = { file: audioBlob }
        const fileResp = await uploadFile(uploadBody, this.getAxiosConfig())

        const payload: CreateTranscriptionPayload = {
          ...sonioxOpts,
          model: options?.model || this.defaultModel,
          file_id: fileResp.data.id,
          language_hints: options?.language ? [options.language] : sonioxOpts?.language_hints,
          enable_speaker_diarization:
            options?.diarization || sonioxOpts?.enable_speaker_diarization,
          enable_language_identification:
            options?.languageDetection || sonioxOpts?.enable_language_identification,
          context: options?.customVocabulary?.length
            ? { terms: options.customVocabulary }
            : sonioxOpts?.context,
          webhook_url: options?.webhookUrl || sonioxOpts?.webhook_url
        }

        const createResp = await createTranscription(payload, this.getAxiosConfig())
        const meta = createResp.data

        if (options?.webhookUrl || sonioxOpts?.webhook_url) {
          return this.normalizeTranscription(meta)
        }

        return this.pollForCompletion(meta.id)
      } else if (audio.type === "url") {
        // URL flow: create transcription directly with audio_url
        const payload: CreateTranscriptionPayload = {
          ...sonioxOpts,
          model: options?.model || this.defaultModel,
          audio_url: audio.url,
          language_hints: options?.language ? [options.language] : sonioxOpts?.language_hints,
          enable_speaker_diarization:
            options?.diarization || sonioxOpts?.enable_speaker_diarization,
          enable_language_identification:
            options?.languageDetection || sonioxOpts?.enable_language_identification,
          context: options?.customVocabulary?.length
            ? { terms: options.customVocabulary }
            : sonioxOpts?.context,
          webhook_url: options?.webhookUrl || sonioxOpts?.webhook_url
        }

        const createResp = await createTranscription(payload, this.getAxiosConfig())
        const meta = createResp.data

        if (options?.webhookUrl || sonioxOpts?.webhook_url) {
          return this.normalizeTranscription(meta)
        }

        return this.pollForCompletion(meta.id)
      } else {
        return {
          success: false,
          provider: this.name,
          error: {
            code: "INVALID_INPUT",
            message: "Soniox only supports URL and File audio input"
          }
        }
      }
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  /**
   * Get transcription result by ID
   *
   * Fetches transcription metadata and, if completed, the transcript text/tokens.
   * Used by pollForCompletion() for async polling.
   *
   * @param transcriptId - Transcript ID
   * @returns Transcription response
   */
  async getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      const metaResp = await getTranscription(transcriptId, this.getAxiosConfig())
      const meta = metaResp.data

      if (meta.status === SonioxTranscriptionStatus.completed) {
        try {
          const transcriptResp = await getTranscriptionTranscript(
            transcriptId,
            this.getAxiosConfig()
          )
          return this.normalizeTranscription(meta, transcriptResp.data)
        } catch (transcriptError) {
          return this.createErrorResponse(transcriptError)
        }
      }

      // Still processing, queued, or error — normalizeTranscription handles all states
      return this.normalizeTranscription(meta)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  /**
   * Stream audio for real-time transcription
   *
   * Creates a WebSocket connection for real-time transcription with
   * speaker diarization, language identification, and translation support.
   *
   * @param options - Streaming configuration options
   * @param callbacks - Event callbacks for transcription results
   * @returns Promise that resolves with a StreamingSession
   */
  async transcribeStream(
    options?: StreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession> {
    this.validateConfig()

    const sessionId = `soniox_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const createdAt = new Date()

    // Build WebSocket URL with query parameters (using regional WebSocket host)
    // Respect wsBaseUrl > baseUrl > regional default
    const wsBase =
      this.config?.wsBaseUrl ||
      (this.config?.baseUrl
        ? this.deriveWsUrl(this.config.baseUrl)
        : `wss://${this.getRegionalWsHost()}`)
    const wsUrl = new URL(`${wsBase}/transcribe-websocket`)
    wsUrl.searchParams.set("api_key", this.config!.apiKey)
    // Prefer sonioxStreaming.model over generic model option
    const modelId = options?.sonioxStreaming?.model || options?.model || "stt-rt-preview"
    wsUrl.searchParams.set("model", modelId)

    if (options?.encoding) {
      // Map common encoding names to Soniox format
      const encodingMap: Record<string, string> = {
        linear16: "pcm_s16le",
        pcm: "pcm_s16le",
        mulaw: "mulaw",
        alaw: "alaw"
      }
      wsUrl.searchParams.set("audio_format", encodingMap[options.encoding] || options.encoding)
    }

    if (options?.sampleRate) {
      wsUrl.searchParams.set("sample_rate", options.sampleRate.toString())
    }

    if (options?.channels) {
      wsUrl.searchParams.set("num_channels", options.channels.toString())
    }

    // Handle Soniox-specific streaming options first (has strict types)
    const sonioxOpts = options?.sonioxStreaming
    if (sonioxOpts) {
      // Prefer strictly typed languageHints from sonioxStreaming
      if (sonioxOpts.languageHints && sonioxOpts.languageHints.length > 0) {
        wsUrl.searchParams.set("language_hints", JSON.stringify(sonioxOpts.languageHints))
      }
      if (sonioxOpts.enableLanguageIdentification) {
        wsUrl.searchParams.set("enable_language_identification", "true")
      }
      if (sonioxOpts.enableEndpointDetection) {
        wsUrl.searchParams.set("enable_endpoint_detection", "true")
      }
      if (sonioxOpts.enableSpeakerDiarization) {
        wsUrl.searchParams.set("enable_speaker_diarization", "true")
      }
      if (sonioxOpts.context) {
        wsUrl.searchParams.set(
          "context",
          typeof sonioxOpts.context === "string"
            ? sonioxOpts.context
            : JSON.stringify(sonioxOpts.context)
        )
      }
      if (sonioxOpts.translation) {
        wsUrl.searchParams.set("translation", JSON.stringify(sonioxOpts.translation))
      }
      if (sonioxOpts.clientReferenceId) {
        wsUrl.searchParams.set("client_reference_id", sonioxOpts.clientReferenceId)
      }
    }

    // Fallback to generic options if sonioxStreaming not provided
    if (!sonioxOpts?.languageHints && options?.language) {
      // Warn about Deepgram-specific language values
      if (options.language === "multi") {
        console.warn(
          '[Soniox] Warning: language="multi" is Deepgram-specific and not supported by Soniox. ' +
            "For automatic language detection, use languageDetection: true instead, or specify a language code like 'en'."
        )
      }
      wsUrl.searchParams.set("language_hints", JSON.stringify([options.language]))
    }

    if (!sonioxOpts?.enableSpeakerDiarization && options?.diarization) {
      wsUrl.searchParams.set("enable_speaker_diarization", "true")
    }

    if (!sonioxOpts?.enableLanguageIdentification && options?.languageDetection) {
      wsUrl.searchParams.set("enable_language_identification", "true")
    }

    if (options?.interimResults !== false) {
      // Soniox returns partial results by default
    }

    let status: "connecting" | "open" | "closing" | "closed" = "connecting"
    let openedAt: number | null = null
    let receivedData = false

    // Create WebSocket connection
    const WebSocketImpl = typeof WebSocket !== "undefined" ? WebSocket : require("ws")
    const ws: WebSocket = new WebSocketImpl(wsUrl.toString())

    ws.onopen = () => {
      status = "open"
      openedAt = Date.now()
      callbacks?.onOpen?.()
    }

    ws.onmessage = (event: MessageEvent) => {
      receivedData = true

      // Capture raw message BEFORE any parsing/processing
      const rawPayload = typeof event.data === "string" ? event.data : event.data.toString()
      let messageType: string | undefined

      try {
        const data = JSON.parse(rawPayload) as SonioxStreamingResponse

        const errorMessage = data.error_message

        // Derive message type for raw message callback
        if (errorMessage) {
          messageType = "error"
        } else if (data.finished) {
          messageType = "finished"
        } else if (data.tokens) {
          messageType = data.tokens.every((t) => t.is_final) ? "final_tokens" : "partial_tokens"
        }

        // Invoke raw message callback with original payload
        if (callbacks?.onRawMessage) {
          callbacks.onRawMessage({
            provider: this.name,
            direction: "incoming",
            timestamp: Date.now(),
            payload: rawPayload,
            messageType
          })
        }

        // Handle different message types
        if (errorMessage) {
          callbacks?.onError?.({
            code: data.error_code?.toString() || "STREAM_ERROR",
            message: errorMessage
          })
          return
        }

        if (data.finished) {
          callbacks?.onClose?.(1000, "Transcription complete")
          return
        }

        // Build transcript event from tokens
        if (data.tokens && data.tokens.length > 0) {
          const words: Word[] = data.tokens.map((token) => ({
            word: token.text,
            start: token.start_ms ? token.start_ms / 1000 : 0,
            end: token.end_ms ? token.end_ms / 1000 : 0,
            confidence: token.confidence,
            speaker: token.speaker ?? undefined
          }))

          const text = data.text || data.tokens.map((t) => t.text).join("")
          const isFinal = data.tokens.every((t) => t.is_final)

          const event: StreamEvent = {
            type: "transcript",
            text,
            isFinal,
            words,
            speaker: data.tokens[0]?.speaker ?? undefined,
            language: data.tokens[0]?.language ?? undefined,
            confidence: data.tokens[0]?.confidence
          }

          callbacks?.onTranscript?.(event)

          // Build utterances from speaker changes
          if (isFinal && options?.diarization) {
            const utterances = this.buildUtterancesFromTokens(data.tokens)
            for (const utterance of utterances) {
              callbacks?.onUtterance?.(utterance)
            }
          }
        }
      } catch (error) {
        callbacks?.onError?.({
          code: "PARSE_ERROR",
          message: `Failed to parse message: ${error}`
        })
      }
    }

    ws.onerror = (event: Event) => {
      callbacks?.onError?.({
        code: "WEBSOCKET_ERROR",
        message: "WebSocket error occurred"
      })
    }

    ws.onclose = (event: CloseEvent) => {
      status = "closed"

      // Detect immediate close after open (likely auth/config rejection)
      const timeSinceOpen = openedAt ? Date.now() - openedAt : null
      const isImmediateClose = timeSinceOpen !== null && timeSinceOpen < 1000 && !receivedData

      if (isImmediateClose && event.code === 1000) {
        // Soniox accepted WebSocket but rejected config - surface as error
        const errorMessage = [
          "Soniox closed connection immediately after opening.",
          `Current config: region=${this.region}, model=${modelId}`,
          "Likely causes:",
          "  - Invalid API key or region mismatch (keys are region-specific, current: " +
            this.region +
            ")",
          "  - Invalid language value (e.g., 'multi' is Deepgram-only, use 'en' for Soniox)",
          "  - Unsupported audio format or sample rate for the model",
          "  - Model not available for your account",
          event.reason ? `Server reason: ${event.reason}` : null
        ]
          .filter(Boolean)
          .join("\n")

        callbacks?.onError?.({
          code: "SONIOX_CONFIG_REJECTED",
          message: errorMessage
        })
      }

      callbacks?.onClose?.(event.code, event.reason)
    }

    // Wait for connection to open
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("WebSocket connection timeout"))
      }, 10000)

      const checkOpen = () => {
        if (status === "open") {
          clearTimeout(timeout)
          resolve()
        } else if (status === "closed") {
          clearTimeout(timeout)
          reject(new Error("WebSocket connection failed"))
        } else {
          setTimeout(checkOpen, 100)
        }
      }
      checkOpen()
    })

    return {
      id: sessionId,
      provider: this.name,
      createdAt,
      getStatus: () => status,
      sendAudio: async (chunk) => {
        if (status !== "open") {
          throw new Error("Session is not open")
        }

        // Capture outgoing raw message (convert Buffer/Uint8Array to ArrayBuffer)
        if (callbacks?.onRawMessage) {
          const audioPayload =
            chunk.data instanceof ArrayBuffer
              ? chunk.data
              : (chunk.data.buffer.slice(
                  chunk.data.byteOffset,
                  chunk.data.byteOffset + chunk.data.byteLength
                ) as ArrayBuffer)
          callbacks.onRawMessage({
            provider: this.name,
            direction: "outgoing",
            timestamp: Date.now(),
            payload: audioPayload,
            messageType: "audio"
          })
        }

        ws.send(chunk.data)
      },
      close: async () => {
        if (status === "open") {
          status = "closing"
          ws.close(1000, "Client requested close")
        }
      }
    }
  }

  /**
   * Get available models and their supported languages
   *
   * Fetches the list of available models from the Soniox API.
   * Each model includes its supported languages, translation capabilities, and features.
   *
   * @returns Promise with array of available models
   *
   * @example
   * ```typescript
   * const models = await adapter.getModels();
   * console.log('Available models:', models.map(m => m.id));
   *
   * // Get supported languages for a specific model
   * const rtModel = models.find(m => m.id === 'stt-rt-preview');
   * console.log('Languages:', rtModel?.languages.map(l => l.code));
   * ```
   */
  async getModels(): Promise<SonioxModelInfo[]> {
    this.validateConfig()

    try {
      const response = await getGeneratedModels(this.getAxiosConfig())
      return response.data.models || []
    } catch (error) {
      console.error("Failed to fetch Soniox models:", error)
      return []
    }
  }

  /**
   * Get supported languages for a specific model
   *
   * @param modelId - The model ID (e.g., 'stt-rt-preview', 'stt-async-preview')
   * @returns Array of supported language objects with code and name
   */
  async getLanguagesForModel(modelId: SonioxModelCode): Promise<SonioxLanguageInfo[]> {
    const models = await this.getModels()
    const model = models.find((m) => m.id === modelId)
    return model?.languages || []
  }

  /**
   * Build utterances from tokens based on speaker changes
   */
  private buildUtterancesFromTokens(
    tokens: (SonioxStreamingToken | TranscriptionTranscriptToken)[]
  ): Utterance[] {
    const words: Word[] = tokens.map((token) => ({
      word: token.text,
      start: token.start_ms ? token.start_ms / 1000 : 0,
      end: token.end_ms ? token.end_ms / 1000 : 0,
      confidence: token.confidence,
      speaker: token.speaker ?? undefined
    }))

    return buildUtterancesFromWords(words)
  }

  /**
   * Normalize v1 API response to unified format
   *
   * @param meta - Transcription metadata from getTranscription/createTranscription
   * @param transcript - Transcript data (text/tokens), only present when status is completed
   */
  private normalizeTranscription(
    meta: SonioxTranscription,
    transcript?: TranscriptionTranscript
  ): UnifiedTranscriptResponse {
    // Handle error status
    if (meta.status === SonioxTranscriptionStatus.error) {
      return {
        success: false,
        provider: this.name,
        data: {
          id: meta.id,
          text: "",
          status: "error"
        },
        error: {
          code: meta.error_type || "TRANSCRIPTION_ERROR",
          message: meta.error_message || "Transcription failed"
        },
        raw: { meta, transcript }
      }
    }

    // When transcript is not yet available (queued/processing)
    if (!transcript) {
      return {
        success: true,
        provider: this.name,
        data: {
          id: meta.id,
          text: "",
          status: meta.status as "queued" | "processing" | "completed" | "error",
          duration: meta.audio_duration_ms ? meta.audio_duration_ms / 1000 : undefined
        },
        raw: { meta }
      }
    }

    // Completed with transcript data
    const tokens = transcript.tokens || []
    const text = transcript.text || tokens.map((t) => t.text).join("")

    // Extract words with timestamps
    const words: Word[] = tokens
      .filter((t) => t.start_ms !== undefined && t.end_ms !== undefined)
      .map((token) => ({
        word: token.text,
        start: token.start_ms / 1000,
        end: token.end_ms / 1000,
        confidence: token.confidence,
        speaker: token.speaker ?? undefined
      }))

    // Extract speakers if diarization was enabled
    const speakerSet = new Set<string>()
    tokens.forEach((t) => {
      if (t.speaker) speakerSet.add(String(t.speaker))
    })

    const speakers =
      speakerSet.size > 0
        ? Array.from(speakerSet).map((id) => ({
            id,
            label: `Speaker ${id}`
          }))
        : undefined

    // Build utterances from speaker changes
    const utterances = this.buildUtterancesFromTokens(tokens)

    // Detect language from tokens
    const language = (tokens.find((t) => t.language)?.language ?? undefined) as string | undefined

    return {
      success: true,
      provider: this.name,
      data: {
        id: meta.id,
        text,
        status: SonioxTranscriptionStatus.completed,
        language,
        duration: meta.audio_duration_ms ? meta.audio_duration_ms / 1000 : undefined,
        speakers,
        words: words.length > 0 ? words : undefined,
        utterances: utterances.length > 0 ? utterances : undefined
      },
      tracking: {
        requestId: meta.id
      },
      raw: { meta, transcript }
    }
  }
}

/**
 * Factory function to create a Soniox adapter
 *
 * @example Basic usage
 * ```typescript
 * import { createSonioxAdapter } from 'voice-router-dev'
 *
 * const adapter = createSonioxAdapter({
 *   apiKey: process.env.SONIOX_API_KEY
 * })
 * ```
 *
 * @example With model selection
 * ```typescript
 * const adapter = createSonioxAdapter({
 *   apiKey: process.env.SONIOX_API_KEY,
 *   model: 'stt-rt-preview' // Real-time model
 * })
 * ```
 */
export function createSonioxAdapter(config: SonioxConfig): SonioxAdapter {
  const adapter = new SonioxAdapter()
  adapter.initialize(config)
  return adapter
}
