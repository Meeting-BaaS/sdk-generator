/**
 * Soniox transcription provider adapter
 * Documentation: https://soniox.com/docs/stt/
 */

import axios, { type AxiosInstance } from "axios"
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
  Word
} from "../router/types"
import { BaseAdapter, type ProviderConfig } from "./base-adapter"
import { SonioxRegion, type SonioxRegionType } from "../constants"

// Import generated Soniox types
import { TranscriptionStatus as SonioxTranscriptionStatus } from "../generated/soniox/schema/transcriptionStatus"
import type { Model as SonioxModel } from "../generated/soniox/schema/model"
import type { Language as SonioxLanguage } from "../generated/soniox/schema/language"

/**
 * Soniox-specific configuration options
 */
export interface SonioxConfig extends ProviderConfig {
  /**
   * Model to use for transcription
   *
   * Available models:
   * - `stt-async-preview` - Async/batch transcription (default)
   * - `stt-rt-preview` - Real-time streaming
   * - `stt-rt-v3` - Real-time streaming v3
   *
   * @default "stt-async-preview"
   */
  model?: string

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
 * - Batch transcription (async processing)
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

  private client?: AxiosInstance
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
   * Get the base URL for API requests
   */
  protected get baseUrl(): string {
    return `https://${this.getRegionalHost()}/v1`
  }

  initialize(config: SonioxConfig): void {
    super.initialize(config)

    if (config.region) {
      this.region = config.region
    }

    if (config.model) {
      this.defaultModel = config.model
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 120000,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...config.headers
      }
    })
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
    // Recreate client with new base URL
    if (this.config?.apiKey) {
      this.client = axios.create({
        baseURL: this.baseUrl,
        timeout: this.config.timeout || 120000,
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
          ...this.config.headers
        }
      })
    }
  }

  /**
   * Submit audio for transcription
   *
   * Soniox uses async batch processing. The transcribe method submits audio
   * and waits for completion (or use getTranscript for polling).
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
      // Build request body
      const requestBody: Record<string, unknown> = {
        model: options?.model || this.defaultModel
      }

      // Handle audio input
      if (audio.type === "url") {
        requestBody.audio_url = audio.url
      } else if (audio.type === "file") {
        // For file uploads, we need to use multipart form data
        const formData = new FormData()
        // Convert Buffer to Blob if needed
        const audioBlob =
          audio.file instanceof Blob
            ? audio.file
            : new Blob([audio.file], { type: audio.mimeType || "audio/wav" })
        formData.append("audio", audioBlob, audio.filename || "audio.wav")
        formData.append("model", requestBody.model as string)

        if (options?.language) {
          formData.append("language_hints", JSON.stringify([options.language]))
        }
        if (options?.diarization) {
          formData.append("enable_speaker_diarization", "true")
        }
        if (options?.languageDetection) {
          formData.append("enable_language_identification", "true")
        }
        if (options?.customVocabulary) {
          formData.append("context", JSON.stringify({ terms: options.customVocabulary }))
        }

        const response = await this.client!.post("/speech/transcribe", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        })

        return this.normalizeResponse(response.data)
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

      // Add language hints
      if (options?.language) {
        requestBody.language_hints = [options.language]
      }

      // Add diarization
      if (options?.diarization) {
        requestBody.enable_speaker_diarization = true
      }

      // Add language detection
      if (options?.languageDetection) {
        requestBody.enable_language_identification = true
      }

      // Add custom vocabulary via context
      if (options?.customVocabulary && options.customVocabulary.length > 0) {
        requestBody.context = {
          terms: options.customVocabulary
        }
      }

      // Submit transcription job
      const response = await this.client!.post("/speech/transcribe", requestBody)

      return this.normalizeResponse(response.data)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  /**
   * Get transcription result by ID
   *
   * Soniox batch transcription is synchronous (returns immediately),
   * but this method can be used for consistency with other providers.
   *
   * @param transcriptId - Transcript ID
   * @returns Transcription response
   */
  async getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      const response = await this.client!.get(`/speech/transcripts/${transcriptId}`)
      return this.normalizeResponse(response.data)
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
    const wsUrl = new URL(`wss://${this.getRegionalWsHost()}/transcribe-websocket`)
    wsUrl.searchParams.set("api_key", this.config!.apiKey)
    wsUrl.searchParams.set("model", options?.model?.toString() || "stt-rt-preview")

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

    if (options?.language) {
      wsUrl.searchParams.set("language_hints", JSON.stringify([options.language]))
    }

    if (options?.diarization) {
      wsUrl.searchParams.set("enable_speaker_diarization", "true")
    }

    if (options?.languageDetection) {
      wsUrl.searchParams.set("enable_language_identification", "true")
    }

    if (options?.interimResults !== false) {
      // Soniox returns partial results by default
    }

    // Handle Soniox-specific streaming options
    const sonioxOpts = options?.sonioxStreaming
    if (sonioxOpts) {
      if (sonioxOpts.enableEndpointDetection) {
        wsUrl.searchParams.set("enable_endpoint_detection", "true")
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

    let status: "connecting" | "open" | "closing" | "closed" = "connecting"

    // Create WebSocket connection
    const WebSocketImpl = typeof WebSocket !== "undefined" ? WebSocket : require("ws")
    const ws: WebSocket = new WebSocketImpl(wsUrl.toString())

    ws.onopen = () => {
      status = "open"
      callbacks?.onOpen?.()
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data.toString())

        // Handle different message types
        if (data.error) {
          callbacks?.onError?.({
            code: data.error_code?.toString() || "STREAM_ERROR",
            message: data.error
          })
          return
        }

        if (data.finished) {
          callbacks?.onClose?.(1000, "Transcription complete")
          return
        }

        // Build transcript event from tokens
        if (data.tokens && data.tokens.length > 0) {
          const words: Word[] = data.tokens.map((token: any) => ({
            word: token.text,
            start: token.start_ms ? token.start_ms / 1000 : 0,
            end: token.end_ms ? token.end_ms / 1000 : 0,
            confidence: token.confidence,
            speaker: token.speaker
          }))

          const text = data.text || data.tokens.map((t: any) => t.text).join("")
          const isFinal = data.tokens.every((t: any) => t.is_final)

          const event: StreamEvent = {
            type: "transcript",
            text,
            isFinal,
            words,
            speaker: data.tokens[0]?.speaker,
            language: data.tokens[0]?.language,
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
  async getModels(): Promise<SonioxModel[]> {
    this.validateConfig()

    try {
      const response = await this.client!.get("/models")
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
  async getLanguagesForModel(modelId: string): Promise<SonioxLanguage[]> {
    const models = await this.getModels()
    const model = models.find((m) => m.id === modelId)
    return model?.languages || []
  }

  /**
   * Build utterances from tokens based on speaker changes
   */
  private buildUtterancesFromTokens(tokens: any[]): Utterance[] {
    const utterances: Utterance[] = []
    let currentSpeaker: string | undefined
    let currentWords: Word[] = []
    let utteranceStart = 0

    for (const token of tokens) {
      const word: Word = {
        word: token.text,
        start: token.start_ms ? token.start_ms / 1000 : 0,
        end: token.end_ms ? token.end_ms / 1000 : 0,
        confidence: token.confidence,
        speaker: token.speaker
      }

      if (token.speaker !== currentSpeaker) {
        // Speaker changed - save previous utterance
        if (currentSpeaker && currentWords.length > 0) {
          utterances.push({
            text: currentWords.map((w) => w.word).join(" "),
            start: utteranceStart,
            end: currentWords[currentWords.length - 1].end,
            speaker: currentSpeaker,
            words: currentWords
          })
        }

        // Start new utterance
        currentSpeaker = token.speaker
        currentWords = [word]
        utteranceStart = word.start
      } else {
        currentWords.push(word)
      }
    }

    // Add final utterance
    if (currentSpeaker && currentWords.length > 0) {
      utterances.push({
        text: currentWords.map((w) => w.word).join(" "),
        start: utteranceStart,
        end: currentWords[currentWords.length - 1].end,
        speaker: currentSpeaker,
        words: currentWords
      })
    }

    return utterances
  }

  /**
   * Normalize Soniox response to unified format
   */
  private normalizeResponse(response: any): UnifiedTranscriptResponse {
    // Extract full text from tokens
    const text =
      response.text ||
      (response.tokens
        ? response.tokens
            .filter((t: any) => t.is_final)
            .map((t: any) => t.text)
            .join("")
        : "")

    // Extract words with timestamps
    const words: Word[] = response.tokens
      ? response.tokens
          .filter((t: any) => t.is_final && t.start_ms !== undefined && t.end_ms !== undefined)
          .map((token: any) => ({
            word: token.text,
            start: token.start_ms / 1000,
            end: token.end_ms / 1000,
            confidence: token.confidence,
            speaker: token.speaker
          }))
      : []

    // Extract speakers if diarization was enabled
    const speakerSet = new Set<string>()
    if (response.tokens) {
      response.tokens.forEach((t: any) => {
        if (t.speaker) speakerSet.add(t.speaker)
      })
    }

    const speakers =
      speakerSet.size > 0
        ? Array.from(speakerSet).map((id) => ({
            id,
            label: `Speaker ${id}`
          }))
        : undefined

    // Build utterances from speaker changes
    const utterances = response.tokens ? this.buildUtterancesFromTokens(response.tokens) : []

    // Detect language from tokens
    const language = response.tokens?.find((t: any) => t.language)?.language

    return {
      success: true,
      provider: this.name,
      data: {
        id: response.id || `soniox_${Date.now()}`,
        text,
        status: SonioxTranscriptionStatus.completed,
        language,
        duration: response.total_audio_proc_ms ? response.total_audio_proc_ms / 1000 : undefined,
        speakers,
        words: words.length > 0 ? words : undefined,
        utterances: utterances.length > 0 ? utterances : undefined
      },
      tracking: {
        requestId: response.id,
        processingTimeMs: response.total_audio_proc_ms
      },
      raw: response
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
