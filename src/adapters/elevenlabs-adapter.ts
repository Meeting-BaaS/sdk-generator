/**
 * ElevenLabs transcription provider adapter
 * Documentation: https://elevenlabs.io/docs/capabilities/speech-to-text
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
  Word,
  ElevenLabsExtendedData
} from "../router/types"
import { BaseAdapter, type ProviderConfig } from "./base-adapter"
import { buildUtterancesFromWords } from "../utils/transcription-helpers"
import { ElevenLabsRegion, type ElevenLabsRegionType } from "../constants"

// Import generated ElevenLabs types
import type { BodySpeechToTextV1SpeechToTextPost } from "../generated/elevenlabs/schema/bodySpeechToTextV1SpeechToTextPost"
import type { SpeechToTextChunkResponseModel } from "../generated/elevenlabs/schema/speechToTextChunkResponseModel"
import type { SpeechToTextWordResponseModel } from "../generated/elevenlabs/schema/speechToTextWordResponseModel"
import type { ElevenLabsModelCode } from "../generated/elevenlabs/models"

/**
 * ElevenLabs-specific configuration options
 */
export interface ElevenLabsConfig extends ProviderConfig {
  /**
   * Model to use for batch transcription
   *
   * Use `ElevenLabsModel` constant for type-safe autocomplete:
   * @example
   * ```typescript
   * import { ElevenLabsModel } from 'voice-router-dev/constants'
   * { model: ElevenLabsModel.scribe_v2 }
   * ```
   *
   * @default "scribe_v2"
   */
  model?: ElevenLabsModelCode

  /**
   * Regional endpoint for data residency
   *
   * Available regions:
   * - `global` - Default (api.elevenlabs.io)
   * - `us` - United States (api.us.elevenlabs.io)
   * - `eu` - European Union (api.eu.residency.elevenlabs.io)
   * - `in` - India (api.in.residency.elevenlabs.io)
   *
   * @default "global"
   */
  region?: ElevenLabsRegionType
}

/**
 * ElevenLabs transcription provider adapter
 *
 * Implements transcription for ElevenLabs ScribeV2 API with support for:
 * - Batch transcription (synchronous POST)
 * - Real-time streaming (WebSocket)
 * - Speaker diarization
 * - Word-level timestamps
 * - Entity detection (PII, PHI, PCI)
 * - Custom vocabulary (keyterms)
 * - Audio event tagging
 *
 * @see https://elevenlabs.io/docs/capabilities/speech-to-text
 *
 * @example Basic transcription
 * ```typescript
 * import { ElevenLabsAdapter } from 'voice-router-dev'
 *
 * const adapter = new ElevenLabsAdapter()
 * adapter.initialize({
 *   apiKey: process.env.ELEVENLABS_API_KEY
 * })
 *
 * const result = await adapter.transcribe({
 *   type: 'url',
 *   url: 'https://example.com/audio.mp3'
 * }, {
 *   language: 'en',
 *   diarization: true
 * })
 *
 * console.log(result.data.text)
 * ```
 */
export class ElevenLabsAdapter extends BaseAdapter {
  readonly name = "elevenlabs" as const
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    diarization: true,
    wordTimestamps: true,
    languageDetection: true,
    customVocabulary: true,
    summarization: false,
    sentimentAnalysis: false,
    entityDetection: true,
    piiRedaction: true,
    listTranscripts: false,
    deleteTranscript: false
  }

  private client?: AxiosInstance
  private region: ElevenLabsRegionType = ElevenLabsRegion.global
  private defaultModel: ElevenLabsModelCode = "scribe_v2"

  /**
   * Get regional API host based on configured region
   */
  private getRegionalHost(): string {
    switch (this.region) {
      case ElevenLabsRegion.us:
        return "api.us.elevenlabs.io"
      case ElevenLabsRegion.eu:
        return "api.eu.residency.elevenlabs.io"
      case ElevenLabsRegion.in:
        return "api.in.residency.elevenlabs.io"
      case ElevenLabsRegion.global:
      default:
        return "api.elevenlabs.io"
    }
  }

  /**
   * Get the base URL for API requests
   */
  protected get baseUrl(): string {
    if (this.config?.baseUrl) return this.config.baseUrl
    return `https://${this.getRegionalHost()}`
  }

  initialize(config: ElevenLabsConfig): void {
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
        "xi-api-key": config.apiKey,
        ...config.headers
      }
    })
  }

  /**
   * Get current region
   */
  getRegion(): ElevenLabsRegionType {
    return this.region
  }

  /**
   * Set regional endpoint
   */
  setRegion(region: ElevenLabsRegionType): void {
    this.region = region
    if (this.config?.apiKey) {
      this.client = axios.create({
        baseURL: this.baseUrl,
        timeout: this.config.timeout || 120000,
        headers: {
          "xi-api-key": this.config.apiKey,
          ...this.config.headers
        }
      })
    }
  }

  /**
   * Submit audio for transcription
   *
   * ElevenLabs batch is synchronous - the API returns the result directly.
   */
  async transcribe(
    audio: AudioInput,
    options?: TranscribeOptions
  ): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      const formData = new FormData()

      // Model ID
      const modelId = (options?.model as ElevenLabsModelCode) || this.defaultModel
      formData.append("model_id", modelId)

      // Handle audio input
      if (audio.type === "url") {
        formData.append("cloud_storage_url", audio.url)
      } else if (audio.type === "file") {
        const audioBlob =
          audio.file instanceof Blob
            ? audio.file
            : new Blob([audio.file], { type: audio.mimeType || "audio/wav" })
        formData.append("file", audioBlob, audio.filename || "audio.wav")
      } else {
        return {
          success: false,
          provider: this.name,
          error: {
            code: "INVALID_INPUT",
            message: "ElevenLabs only supports URL and File audio input"
          }
        }
      }

      // Map unified options
      if (options?.language) {
        formData.append("language_code", options.language)
      }

      if (options?.diarization) {
        formData.append("diarize", "true")
      }

      // Always request word timestamps for the unified response
      formData.append("timestamps_granularity", "word")

      // Number of speakers
      if (options?.speakersExpected) {
        formData.append("num_speakers", String(options.speakersExpected))
      }

      // Custom vocabulary via keyterms
      if (options?.customVocabulary && options.customVocabulary.length > 0) {
        for (const term of options.customVocabulary) {
          formData.append("keyterms", term)
        }
      }

      // Unified entity detection boolean
      if (options?.entityDetection) {
        formData.append("entity_detection", "all")
      }

      // Provider-specific ElevenLabs options passthrough
      // Apply all remaining provider-specific options from the typed passthrough
      const elevenlabsOpts = options?.elevenlabs
      if (elevenlabsOpts) {
        for (const [key, value] of Object.entries(elevenlabsOpts)) {
          if (value === undefined || value === null) continue
          // Skip fields already handled above
          if (formData.has(key)) continue
          if (typeof value === "boolean") {
            formData.append(key, String(value))
          } else if (Array.isArray(value)) {
            for (const item of value) {
              formData.append(key, typeof item === "object" ? JSON.stringify(item) : String(item))
            }
          } else if (typeof value === "object") {
            formData.append(key, JSON.stringify(value))
          } else {
            formData.append(key, String(value))
          }
        }
      }

      const response = await this.client!.post("/v1/speech-to-text", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })

      return this.normalizeResponse(response.data)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  /**
   * Get transcription result by ID
   *
   * ElevenLabs batch is synchronous, but supports transcript retrieval.
   */
  async getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      const response = await this.client!.get(`/v1/speech-to-text/transcripts/${transcriptId}`)
      return this.normalizeResponse(response.data)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  /**
   * Stream audio for real-time transcription
   *
   * Creates a WebSocket connection to ElevenLabs realtime STT endpoint.
   * Audio is sent as base64-encoded JSON messages.
   */
  async transcribeStream(
    options?: StreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession> {
    this.validateConfig()

    const sessionId = `elevenlabs_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const createdAt = new Date()

    // Build WebSocket URL
    const wsBase =
      this.config?.wsBaseUrl ||
      (this.config?.baseUrl
        ? this.deriveWsUrl(this.config.baseUrl)
        : `wss://${this.getRegionalHost()}`)
    const wsUrl = new URL(`${wsBase}/v1/speech-to-text/realtime`)

    // Add query parameters
    const elOpts = options?.elevenlabsStreaming
    const modelId = elOpts?.model || "scribe_v2_realtime"
    wsUrl.searchParams.set("model_id", modelId)

    // Audio format
    const audioFormat = elOpts?.audioFormat || "pcm_16000"
    wsUrl.searchParams.set("audio_format", audioFormat)

    // Language
    const langCode = elOpts?.languageCode || options?.language
    if (langCode) {
      wsUrl.searchParams.set("language_code", langCode)
    }

    // Timestamps
    if (elOpts?.includeTimestamps !== undefined) {
      wsUrl.searchParams.set("include_timestamps", String(elOpts.includeTimestamps))
    }

    // Language detection
    if (elOpts?.includeLanguageDetection || options?.languageDetection) {
      wsUrl.searchParams.set("include_language_detection", "true")
    }

    // Commit strategy and VAD params
    if (elOpts?.commitStrategy) {
      wsUrl.searchParams.set("commit_strategy", elOpts.commitStrategy)
    }
    if (elOpts?.vadSilenceThresholdSecs !== undefined) {
      wsUrl.searchParams.set("vad_silence_threshold_secs", String(elOpts.vadSilenceThresholdSecs))
    }
    if (elOpts?.vadThreshold !== undefined) {
      wsUrl.searchParams.set("vad_threshold", String(elOpts.vadThreshold))
    }
    if (elOpts?.minSpeechDurationMs !== undefined) {
      wsUrl.searchParams.set("min_speech_duration_ms", String(elOpts.minSpeechDurationMs))
    }
    if (elOpts?.minSilenceDurationMs !== undefined) {
      wsUrl.searchParams.set("min_silence_duration_ms", String(elOpts.minSilenceDurationMs))
    }
    if (elOpts?.previousText) {
      wsUrl.searchParams.set("previous_text", elOpts.previousText)
    }

    // Fallback encoding from unified options
    if (!elOpts?.audioFormat && options?.encoding) {
      const encodingMap: Record<string, string> = {
        linear16: "pcm_16000",
        pcm: "pcm_16000",
        mulaw: "ulaw_8000"
      }
      const mappedFormat = encodingMap[options.encoding]
      if (mappedFormat) {
        wsUrl.searchParams.set("audio_format", mappedFormat)
      }
    }

    let status: "connecting" | "open" | "closing" | "closed" = "connecting"
    let openedAt: number | null = null
    let receivedData = false

    const WebSocketImpl = typeof WebSocket !== "undefined" ? WebSocket : require("ws")
    const ws: WebSocket = new WebSocketImpl(wsUrl.toString(), {
      headers: {
        "xi-api-key": this.config!.apiKey
      }
    })

    ws.onopen = () => {
      status = "open"
      openedAt = Date.now()
      callbacks?.onOpen?.()
    }

    ws.onmessage = (event: MessageEvent) => {
      receivedData = true

      const rawPayload = typeof event.data === "string" ? event.data : event.data.toString()
      let messageType: string | undefined

      try {
        const data = JSON.parse(rawPayload)

        // Derive message type
        if (data.error) {
          messageType = "error"
        } else if (data.message_type === "session_started") {
          messageType = "session_started"
        } else if (data.message_type === "partial_transcript") {
          messageType = "partial_transcript"
        } else if (data.message_type === "committed_transcript") {
          messageType = "committed_transcript"
        } else if (data.message_type === "committed_transcript_with_timestamps") {
          messageType = "committed_transcript_with_timestamps"
        }

        // Raw message callback
        if (callbacks?.onRawMessage) {
          callbacks.onRawMessage({
            provider: this.name,
            direction: "incoming",
            timestamp: Date.now(),
            payload: rawPayload,
            messageType
          })
        }

        // Handle errors
        if (data.error) {
          callbacks?.onError?.({
            code: data.error_code?.toString() || "STREAM_ERROR",
            message: data.error
          })
          return
        }

        // Session started
        if (data.message_type === "session_started") {
          // Session established, nothing to emit
          return
        }

        // Partial transcript (interim results)
        if (data.message_type === "partial_transcript") {
          const streamEvent: StreamEvent = {
            type: "transcript",
            text: data.text || "",
            isFinal: false,
            confidence: undefined,
            language: data.language_code
          }
          callbacks?.onTranscript?.(streamEvent)
          return
        }

        // Committed transcript (final results)
        if (
          data.message_type === "committed_transcript" ||
          data.message_type === "committed_transcript_with_timestamps"
        ) {
          const words: Word[] = data.words
            ? data.words.map((w: any) => ({
                word: w.text || "",
                start: w.start || 0,
                end: w.end || 0,
                confidence: w.logprob !== undefined ? Math.exp(w.logprob) : undefined,
                speaker: w.speaker_id
              }))
            : []

          const streamEvent: StreamEvent = {
            type: "transcript",
            text: data.text || "",
            isFinal: true,
            words: words.length > 0 ? words : undefined,
            speaker: words[0]?.speaker,
            language: data.language_code,
            confidence: undefined
          }

          callbacks?.onTranscript?.(streamEvent)

          // Build utterances from speaker changes for diarization
          if (options?.diarization && words.length > 0) {
            const utterances = buildUtterancesFromWords(words)
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

    ws.onerror = () => {
      callbacks?.onError?.({
        code: "WEBSOCKET_ERROR",
        message: "WebSocket error occurred"
      })
    }

    ws.onclose = (event: CloseEvent) => {
      status = "closed"

      const timeSinceOpen = openedAt ? Date.now() - openedAt : null
      const isImmediateClose = timeSinceOpen !== null && timeSinceOpen < 1000 && !receivedData

      if (isImmediateClose && event.code === 1000) {
        callbacks?.onError?.({
          code: "ELEVENLABS_CONFIG_REJECTED",
          message: [
            "ElevenLabs closed connection immediately after opening.",
            `Current config: region=${this.region}, model=${modelId}`,
            "Likely causes:",
            "  - Invalid API key",
            "  - Unsupported audio format or model",
            event.reason ? `Server reason: ${event.reason}` : null
          ]
            .filter(Boolean)
            .join("\n")
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

        // ElevenLabs expects audio as base64-encoded JSON
        let base64Audio: string
        if (chunk.data instanceof ArrayBuffer) {
          base64Audio = Buffer.from(chunk.data).toString("base64")
        } else if (chunk.data instanceof Uint8Array) {
          base64Audio = Buffer.from(
            chunk.data.buffer,
            chunk.data.byteOffset,
            chunk.data.byteLength
          ).toString("base64")
        } else {
          base64Audio = Buffer.from(chunk.data as Buffer).toString("base64")
        }

        const message = JSON.stringify({
          message_type: "input_audio_chunk",
          audio_base_64: base64Audio
        })

        // Capture outgoing raw message
        if (callbacks?.onRawMessage) {
          callbacks.onRawMessage({
            provider: this.name,
            direction: "outgoing",
            timestamp: Date.now(),
            payload: message,
            messageType: "audio"
          })
        }

        ws.send(message)
      },
      close: async () => {
        if (status === "open") {
          status = "closing"
          // Send EOS message
          ws.send(JSON.stringify({ message_type: "end_of_stream" }))
          ws.close(1000, "Client requested close")
        }
      }
    }
  }

  /**
   * Normalize ElevenLabs response to unified format
   *
   * ElevenLabs returns either:
   * - Single channel: `SpeechToTextChunkResponseModel` directly (text, words, etc.)
   * - Multi-channel: `MultichannelSpeechToTextResponseModel` with `transcripts[]`
   */
  private normalizeResponse(response: any): UnifiedTranscriptResponse {
    // Determine chunks: multichannel has `transcripts`, single channel is the response itself
    const chunks: SpeechToTextChunkResponseModel[] = response.transcripts
      ? (response.transcripts as SpeechToTextChunkResponseModel[])
      : [response as SpeechToTextChunkResponseModel]

    // Build full text from chunks
    const text = chunks.map((c) => c.text).join(" ")

    // Build words from all chunks
    const words: Word[] = []
    const speakerSet = new Set<string>()
    const audioEvents: ElevenLabsExtendedData["audioEvents"] = []

    for (const chunk of chunks) {
      if (!chunk.words) continue

      for (const w of chunk.words) {
        if (w.type === "audio_event") {
          audioEvents.push({
            text: w.text,
            start: typeof w.start === "number" ? w.start : 0,
            end: typeof w.end === "number" ? w.end : 0
          })
          continue
        }

        const speakerId = w.speaker_id ?? undefined
        const word: Word = {
          word: w.text,
          start: typeof w.start === "number" ? w.start : 0,
          end: typeof w.end === "number" ? w.end : 0,
          confidence: w.logprob !== undefined ? Math.exp(w.logprob) : undefined,
          speaker: speakerId ?? undefined
        }
        words.push(word)

        if (speakerId) {
          speakerSet.add(speakerId)
        }
      }
    }

    // Build speakers
    const speakers =
      speakerSet.size > 0
        ? Array.from(speakerSet).map((id) => ({
            id,
            label: `Speaker ${id}`
          }))
        : undefined

    // Build utterances from words
    const utterances = words.length > 0 ? buildUtterancesFromWords(words) : []

    // Extract language info
    const language = chunks[0]?.language_code
    const languageProbability = chunks[0]?.language_probability

    // Extract entities from chunks (uses DetectedEntity shape: entity_type, start_char, end_char)
    const entities: ElevenLabsExtendedData["entities"] = []
    for (const chunk of chunks) {
      if (chunk.entities && Array.isArray(chunk.entities)) {
        for (const entity of chunk.entities as Array<{
          text: string
          entity_type: string
          start_char: number
          end_char: number
        }>) {
          entities.push({
            text: entity.text,
            entity_type: entity.entity_type,
            start_char: entity.start_char,
            end_char: entity.end_char
          })
        }
      }
    }

    // Get transcript ID if available
    const transcriptionId =
      response.transcription_id || chunks[0]?.transcription_id || `elevenlabs_${Date.now()}`

    return {
      success: true,
      provider: this.name,
      data: {
        id: transcriptionId,
        text,
        status: "completed",
        language,
        speakers,
        words: words.length > 0 ? words : undefined,
        utterances: utterances.length > 0 ? utterances : undefined
      },
      extended: {
        entities: entities.length > 0 ? entities : undefined,
        audioEvents: audioEvents.length > 0 ? audioEvents : undefined,
        languageProbability
      } as ElevenLabsExtendedData,
      tracking: {
        requestId: transcriptionId
      },
      raw: response
    }
  }
}

/**
 * Factory function to create an ElevenLabs adapter
 *
 * @example Basic usage
 * ```typescript
 * import { createElevenLabsAdapter } from 'voice-router-dev'
 *
 * const adapter = createElevenLabsAdapter({
 *   apiKey: process.env.ELEVENLABS_API_KEY
 * })
 * ```
 *
 * @example With region
 * ```typescript
 * import { createElevenLabsAdapter, ElevenLabsRegion } from 'voice-router-dev'
 *
 * const adapter = createElevenLabsAdapter({
 *   apiKey: process.env.ELEVENLABS_API_KEY,
 *   region: ElevenLabsRegion.eu
 * })
 * ```
 */
export function createElevenLabsAdapter(config: ElevenLabsConfig): ElevenLabsAdapter {
  const adapter = new ElevenLabsAdapter()
  adapter.initialize(config)
  return adapter
}
