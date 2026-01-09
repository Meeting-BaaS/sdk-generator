/**
 * Deepgram transcription provider adapter
 * Documentation: https://developers.deepgram.com/
 */

import axios, { type AxiosInstance } from "axios"
import WebSocket from "ws"
import type {
  AudioChunk,
  AudioInput,
  ProviderCapabilities,
  StreamingCallbacks,
  StreamingOptions,
  StreamingSession,
  TranscribeOptions,
  UnifiedTranscriptResponse,
  SpeechEvent
} from "../router/types"
import { BaseAdapter, type ProviderConfig } from "./base-adapter"
import type { DeepgramRegionType } from "../constants"

/**
 * Deepgram-specific configuration options
 *
 * @see https://developers.deepgram.com/reference/custom-endpoints - Official custom endpoints documentation
 */
export interface DeepgramConfig extends ProviderConfig {
  /**
   * Project ID for accessing request history via listTranscripts/getTranscript
   */
  projectId?: string

  /**
   * Regional endpoint for EU data residency
   *
   * Available regions:
   * - `global` - Global endpoint (default): api.deepgram.com
   * - `eu` - European Union endpoint: api.eu.deepgram.com
   *
   * The EU endpoint keeps all processing within the European Union.
   *
   * For Dedicated endpoints (`{SHORT_UID}.{REGION}.api.deepgram.com`) or
   * self-hosted deployments, use `baseUrl` instead.
   *
   * @see https://developers.deepgram.com/reference/custom-endpoints
   */
  region?: DeepgramRegionType
}

// Import Deepgram generated types
import type { ListenV1Response } from "../generated/deepgram/schema/listenV1Response"
import type { ListenV1MediaTranscribeParams } from "../generated/deepgram/schema/listenV1MediaTranscribeParams"
import type { ListenV1ResponseResultsChannelsItemAlternativesItem } from "../generated/deepgram/schema/listenV1ResponseResultsChannelsItemAlternativesItem"
import type { ListenV1ResponseResultsChannelsItemAlternativesItemWordsItem } from "../generated/deepgram/schema/listenV1ResponseResultsChannelsItemAlternativesItemWordsItem"
import type { ListenV1ResponseResultsUtterancesItem } from "../generated/deepgram/schema/listenV1ResponseResultsUtterancesItem"

// Import Deepgram request history types for listTranscripts
import type { ListProjectRequestsV1Response } from "../generated/deepgram/schema/listProjectRequestsV1Response"
import type { ManageV1ProjectsRequestsListParams } from "../generated/deepgram/schema/manageV1ProjectsRequestsListParams"
import type { ProjectRequestResponse } from "../generated/deepgram/schema/projectRequestResponse"
import type { GetProjectRequestV1Response } from "../generated/deepgram/schema/getProjectRequestV1Response"
import { ManageV1FilterStatusParameter } from "../generated/deepgram/schema/manageV1FilterStatusParameter"
import { ManageV1FilterEndpointParameter } from "../generated/deepgram/schema/manageV1FilterEndpointParameter"

// Import ListTranscriptsOptions for Deepgram-specific params
import type { ListTranscriptsOptions } from "../router/types"

// WebSocket message types (not in OpenAPI spec, manually defined from Deepgram docs)
interface DeepgramResultsMessage {
  type: "Results"
  channel_index: [number, number]
  duration: number
  start: number
  is_final: boolean
  speech_final: boolean
  from_finalize?: boolean
  channel: {
    alternatives: Array<{
      transcript: string
      confidence: number
      words?: Array<{
        word: string
        start: number
        end: number
        confidence: number
        punctuated_word?: string
        speaker?: number
      }>
    }>
    detected_language?: string
  }
  metadata?: {
    request_id?: string
    model_info?: {
      name?: string
      version?: string
      arch?: string
    }
  }
}

interface DeepgramUtteranceEndMessage {
  type: "UtteranceEnd"
  channel: [number, number]
  last_word_end: number
}

interface DeepgramSpeechStartedMessage {
  type: "SpeechStarted"
  channel: [number, number]
  timestamp: number
}

interface DeepgramMetadataMessage {
  type: "Metadata"
  transaction_key?: string
  request_id?: string
  sha256?: string
  created?: string
  duration?: number
  channels?: number
  models?: string[]
  model_info?: Record<string, { name: string; version: string; arch: string }>
}

interface DeepgramCloseStreamMessage {
  type: "CloseStream"
}

interface DeepgramErrorMessage {
  type: "Error"
  description?: string
  message?: string
  variant?: string
}

type DeepgramRealtimeMessage =
  | DeepgramResultsMessage
  | DeepgramUtteranceEndMessage
  | DeepgramSpeechStartedMessage
  | DeepgramMetadataMessage
  | DeepgramCloseStreamMessage
  | DeepgramErrorMessage

/**
 * Deepgram transcription provider adapter
 *
 * Implements transcription for the Deepgram API with support for:
 * - Synchronous pre-recorded transcription
 * - Real-time streaming transcription (WebSocket)
 * - Speaker diarization (identifying different speakers)
 * - Multi-language detection and transcription
 * - Summarization and sentiment analysis
 * - Entity detection and intent recognition
 * - Custom vocabulary (keywords)
 * - Word-level timestamps with high precision
 * - PII redaction
 *
 * @see https://developers.deepgram.com/ Deepgram API Documentation
 *
 * @example Basic transcription
 * ```typescript
 * import { DeepgramAdapter } from '@meeting-baas/sdk';
 *
 * const adapter = new DeepgramAdapter();
 * adapter.initialize({
 *   apiKey: process.env.DEEPGRAM_API_KEY
 * });
 *
 * const result = await adapter.transcribe({
 *   type: 'url',
 *   url: 'https://example.com/audio.mp3'
 * }, {
 *   language: 'en',
 *   diarization: true
 * });
 *
 * console.log(result.data.text);
 * console.log(result.data.speakers);
 * ```
 *
 * @example With EU region (data residency)
 * ```typescript
 * import { DeepgramAdapter, DeepgramRegion } from '@meeting-baas/sdk';
 *
 * const adapter = new DeepgramAdapter();
 * adapter.initialize({
 *   apiKey: process.env.DEEPGRAM_API_KEY,
 *   region: DeepgramRegion.eu  // EU endpoint for data residency
 * });
 * ```
 *
 * @example With advanced features
 * ```typescript
 * const result = await adapter.transcribe(audio, {
 *   language: 'en',
 *   diarization: true,
 *   summarization: true,
 *   sentimentAnalysis: true,
 *   entityDetection: true,
 *   customVocabulary: ['TypeScript', 'JavaScript', 'API']
 * });
 *
 * console.log('Summary:', result.data.summary);
 * console.log('Sentiment:', result.data.metadata?.sentiment);
 * ```
 */
export class DeepgramAdapter extends BaseAdapter {
  readonly name = "deepgram" as const
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    diarization: true,
    wordTimestamps: true,
    languageDetection: true,
    customVocabulary: true,
    summarization: true,
    sentimentAnalysis: true,
    entityDetection: true,
    piiRedaction: true,
    listTranscripts: true, // Via request history API (requires projectId)
    deleteTranscript: false
  }

  private client?: AxiosInstance
  protected baseUrl = "https://api.deepgram.com/v1"
  private wsBaseUrl = "wss://api.deepgram.com/v1/listen"
  private projectId?: string

  /**
   * Get API host based on region
   *
   * @param region - Regional endpoint identifier
   * @returns API host (without protocol or path)
   */
  private getRegionalHost(region?: DeepgramRegionType): string {
    if (region === "eu") {
      return "api.eu.deepgram.com"
    }
    return "api.deepgram.com"
  }

  initialize(config: DeepgramConfig): void {
    super.initialize(config)
    this.projectId = config.projectId

    // Set URLs based on region (unless explicit baseUrl is provided)
    const host = this.getRegionalHost(config.region)
    this.baseUrl = config.baseUrl || `https://${host}/v1`
    this.wsBaseUrl = `wss://${host}/v1/listen`

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 60000,
      headers: {
        Authorization: `Token ${config.apiKey}`,
        "Content-Type": "application/json",
        ...config.headers
      }
    })
  }

  /**
   * Change the regional endpoint dynamically
   *
   * Useful for testing different regions or switching based on user location.
   * Preserves all other configuration (apiKey, projectId, timeout, headers).
   * Affects both REST API and WebSocket streaming endpoints.
   *
   * @param region - New regional endpoint to use (`global` or `eu`)
   *
   * @example Switch to EU region
   * ```typescript
   * import { DeepgramRegion } from 'voice-router-dev/constants'
   *
   * // Test global endpoint
   * adapter.setRegion(DeepgramRegion.global)
   * await adapter.transcribe(audio)
   *
   * // Switch to EU for data residency testing
   * adapter.setRegion(DeepgramRegion.eu)
   * await adapter.transcribe(audio)
   * ```
   */
  setRegion(region: DeepgramRegionType): void {
    this.validateConfig()

    const host = this.getRegionalHost(region)
    this.baseUrl = `https://${host}/v1`
    this.wsBaseUrl = `wss://${host}/v1/listen`

    // Recreate client with new base URL but preserve existing config
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.config!.timeout || 60000,
      headers: {
        Authorization: `Token ${this.config!.apiKey}`,
        "Content-Type": "application/json",
        ...this.config!.headers
      }
    })
  }

  /**
   * Get the current regional endpoints being used
   *
   * @returns Object with REST API and WebSocket URLs
   */
  getRegion(): { api: string; websocket: string } {
    return {
      api: this.baseUrl,
      websocket: this.wsBaseUrl
    }
  }

  /**
   * Submit audio for transcription
   *
   * Sends audio to Deepgram API for transcription. Deepgram processes
   * synchronously and returns results immediately (no polling required).
   *
   * @param audio - Audio input (URL or file buffer)
   * @param options - Transcription options
   * @param options.language - Language code (e.g., 'en', 'es', 'fr')
   * @param options.languageDetection - Enable automatic language detection
   * @param options.diarization - Enable speaker identification (diarize)
   * @param options.speakersExpected - Expected number of speakers
   * @param options.summarization - Generate text summary
   * @param options.sentimentAnalysis - Analyze sentiment
   * @param options.entityDetection - Detect named entities
   * @param options.piiRedaction - Redact personally identifiable information
   * @param options.customVocabulary - Keywords to boost in recognition
   * @param options.webhookUrl - Callback URL for async processing
   * @returns Normalized transcription response
   *
   * @example Simple transcription
   * ```typescript
   * const result = await adapter.transcribe({
   *   type: 'url',
   *   url: 'https://example.com/meeting.mp3'
   * });
   * ```
   *
   * @example With advanced features
   * ```typescript
   * const result = await adapter.transcribe({
   *   type: 'url',
   *   url: 'https://example.com/meeting.mp3'
   * }, {
   *   language: 'en',
   *   diarization: true,
   *   summarization: true,
   *   sentimentAnalysis: true,
   *   entityDetection: true,
   *   customVocabulary: ['API', 'TypeScript', 'JavaScript']
   * });
   * ```
   */
  async transcribe(
    audio: AudioInput,
    options?: TranscribeOptions
  ): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      // Build query parameters from options
      const params = this.buildTranscriptionParams(options)

      let response: ListenV1Response

      if (audio.type === "url") {
        // URL-based transcription
        response = await this.client!.post<ListenV1Response>(
          "/listen",
          { url: audio.url },
          { params }
        ).then((res) => res.data)
      } else if (audio.type === "file") {
        // File-based transcription
        response = await this.client!.post<ListenV1Response>("/listen", audio.file, {
          params,
          headers: {
            "Content-Type": "audio/*"
          }
        }).then((res) => res.data)
      } else {
        throw new Error(
          "Deepgram adapter does not support stream type for pre-recorded transcription. Use transcribeStream() for real-time streaming."
        )
      }

      // Deepgram returns results immediately (synchronous)
      return this.normalizeResponse(response)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  /**
   * Get transcription result by ID
   *
   * Retrieves a previous transcription from Deepgram's request history.
   *
   * Unlike the list endpoint, getting a single request DOES include the full
   * transcript response. Requires `projectId` to be set during initialization.
   *
   * @param transcriptId - Request ID from a previous transcription
   * @returns Full transcript response including text, words, and metadata
   *
   * @example Get a transcript by request ID
   * ```typescript
   * const adapter = new DeepgramAdapter()
   * adapter.initialize({
   *   apiKey: process.env.DEEPGRAM_API_KEY,
   *   projectId: process.env.DEEPGRAM_PROJECT_ID
   * })
   *
   * const result = await adapter.getTranscript('abc123-request-id')
   * if (result.success) {
   *   console.log(result.data?.text)
   *   console.log(result.data?.words)
   * }
   * ```
   *
   * @see https://developers.deepgram.com/reference/get-request
   */
  async getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    if (!this.projectId) {
      return {
        success: false,
        provider: this.name,
        error: {
          code: "MISSING_PROJECT_ID",
          message:
            "Deepgram getTranscript requires projectId. Initialize with: { apiKey, projectId }"
        }
      }
    }

    try {
      // Fetch specific request with full response data
      const response = await this.client!.get<GetProjectRequestV1Response>(
        `/projects/${this.projectId}/requests/${transcriptId}`
      )

      const request = response.data.request
      if (!request) {
        return {
          success: false,
          provider: this.name,
          error: {
            code: "NOT_FOUND",
            message: `Request ${transcriptId} not found`
          }
        }
      }

      // The response field contains the full transcription response
      const transcriptResponse = request.response as ListenV1Response | undefined

      if (!transcriptResponse) {
        return this.normalizeRequestItem(request)
      }

      // Use existing normalizeResponse to get full transcript data
      return this.normalizeResponse(transcriptResponse)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  /**
   * Build Deepgram transcription parameters from unified options
   */
  private buildTranscriptionParams(options?: TranscribeOptions): ListenV1MediaTranscribeParams {
    if (!options) {
      return {
        punctuate: true,
        utterances: true,
        smart_format: true
      }
    }

    // Start with provider-specific options (fully typed from OpenAPI)
    const params: ListenV1MediaTranscribeParams = {
      ...options.deepgram,
      // Enable features for better results (can be overridden by deepgram options)
      punctuate: options.deepgram?.punctuate ?? true,
      utterances: options.deepgram?.utterances ?? true,
      smart_format: options.deepgram?.smart_format ?? true
    }

    // Map normalized options to Deepgram params
    // These take precedence over deepgram-specific options if both are set
    if (options.model) {
      params.model = options.model
    }

    if (options.language) {
      params.language = options.language
    }

    if (options.languageDetection) {
      params.detect_language = true
    }

    if (options.diarization) {
      params.diarize = true
    }

    if (options.customVocabulary && options.customVocabulary.length > 0) {
      params.keywords = options.customVocabulary
    }

    if (options.summarization) {
      params.summarize = true
    }

    if (options.sentimentAnalysis) {
      params.sentiment = true
    }

    if (options.entityDetection) {
      params.detect_entities = true
    }

    if (options.piiRedaction) {
      params.redact = ["pci", "pii"]
    }

    if (options.webhookUrl) {
      params.callback = options.webhookUrl
    }

    return params
  }

  /**
   * Normalize Deepgram response to unified format
   */
  private normalizeResponse(response: ListenV1Response): UnifiedTranscriptResponse<"deepgram"> {
    // Deepgram returns results immediately
    const channel = response.results.channels?.[0]
    const alternative = channel?.alternatives?.[0]

    if (!alternative) {
      return {
        success: false,
        provider: this.name,
        error: {
          code: "NO_RESULTS",
          message: "No transcription results returned by Deepgram"
        },
        raw: response
      }
    }

    return {
      success: true,
      provider: this.name,
      data: {
        id: response.metadata?.request_id || "",
        text: alternative.transcript || "",
        confidence: alternative.confidence,
        status: "completed", // Deepgram returns completed results immediately
        language: channel?.detected_language || undefined,
        duration: response.metadata?.duration,
        speakers: this.extractSpeakers(response),
        words: this.extractWords(alternative),
        utterances: this.extractUtterances(response),
        summary: this.extractSummary(alternative)
      },
      // Extended data - fully typed from OpenAPI specs
      extended: {
        metadata: response.metadata,
        requestId: response.metadata?.request_id,
        sha256: response.metadata?.sha256,
        modelInfo: response.metadata?.model_info,
        tags: response.metadata?.tags
      },
      // Request tracking
      tracking: {
        requestId: response.metadata?.request_id,
        audioHash: response.metadata?.sha256
      },
      raw: response
    }
  }

  /**
   * Extract speaker information from Deepgram response
   */
  private extractSpeakers(response: ListenV1Response) {
    const utterances = response.results.utterances

    if (!utterances || utterances.length === 0) {
      return undefined
    }

    // Extract unique speakers from utterances
    const speakerSet = new Set<number>()
    utterances.forEach((utterance: ListenV1ResponseResultsUtterancesItem) => {
      if (utterance.speaker !== undefined) {
        speakerSet.add(utterance.speaker)
      }
    })

    if (speakerSet.size === 0) {
      return undefined
    }

    return Array.from(speakerSet).map((speakerId) => ({
      id: speakerId.toString(),
      label: `Speaker ${speakerId}`
    }))
  }

  /**
   * Extract word timestamps from Deepgram response
   */
  private extractWords(alternative: ListenV1ResponseResultsChannelsItemAlternativesItem) {
    if (!alternative.words || alternative.words.length === 0) {
      return undefined
    }

    return alternative.words.map(
      (w: ListenV1ResponseResultsChannelsItemAlternativesItemWordsItem) => ({
        word: w.word || "",
        start: w.start || 0,
        end: w.end || 0,
        confidence: w.confidence,
        speaker: undefined // Speaker info is at utterance level, not word level
      })
    )
  }

  /**
   * Extract utterances from Deepgram response
   */
  private extractUtterances(response: ListenV1Response) {
    const utterances = response.results.utterances

    if (!utterances || utterances.length === 0) {
      return undefined
    }

    return utterances.map((utterance: ListenV1ResponseResultsUtterancesItem) => ({
      text: utterance.transcript || "",
      start: utterance.start || 0,
      end: utterance.end || 0,
      speaker: utterance.speaker?.toString(),
      confidence: utterance.confidence,
      words: utterance.words?.map((w) => ({
        word: w.word || "",
        start: w.start || 0,
        end: w.end || 0,
        confidence: w.confidence
      }))
    }))
  }

  /**
   * Extract summary from Deepgram response
   */
  private extractSummary(
    alternative: ListenV1ResponseResultsChannelsItemAlternativesItem
  ): string | undefined {
    if (!alternative.summaries || alternative.summaries.length === 0) {
      return undefined
    }

    // Combine all summaries into one
    return alternative.summaries
      .map((summary) => summary.summary)
      .filter(Boolean)
      .join(" ")
  }

  /**
   * Stream audio for real-time transcription
   *
   * Creates a WebSocket connection to Deepgram for streaming transcription.
   * Send audio chunks via session.sendAudio() and receive results via callbacks.
   *
   * Supports all Deepgram streaming features:
   * - Real-time transcription with interim/final results
   * - Speech detection events (SpeechStarted, UtteranceEnd)
   * - Speaker diarization
   * - Language detection
   * - Real-time sentiment, entity detection, topics, intents
   * - Custom vocabulary (keywords, keyterms)
   * - PII redaction
   * - Filler words, numerals, measurements, paragraphs
   * - Profanity filtering
   * - Dictation mode
   *
   * @param options - Streaming configuration options
   * @param options.encoding - Audio encoding (linear16, flac, mulaw, opus, speex, g729)
   * @param options.sampleRate - Sample rate in Hz
   * @param options.channels - Number of audio channels
   * @param options.language - Language code for transcription
   * @param options.model - Model to use (nova-2, nova-3, base, enhanced, etc.)
   * @param options.diarization - Enable speaker identification
   * @param options.languageDetection - Auto-detect language
   * @param options.interimResults - Enable partial transcripts
   * @param options.summarization - Enable summarization
   * @param options.sentimentAnalysis - Enable sentiment analysis
   * @param options.entityDetection - Enable entity detection
   * @param options.piiRedaction - Enable PII redaction
   * @param options.customVocabulary - Keywords to boost recognition
   * @param options.deepgramStreaming - All Deepgram-specific streaming options
   * @param callbacks - Event callbacks for transcription results
   * @param callbacks.onTranscript - Interim/final transcript received
   * @param callbacks.onUtterance - Complete utterance detected
   * @param callbacks.onSpeechStart - Speech detected (Deepgram SpeechStarted)
   * @param callbacks.onSpeechEnd - Speech ended (Deepgram UtteranceEnd)
   * @param callbacks.onMetadata - Metadata received
   * @param callbacks.onError - Error occurred
   * @param callbacks.onClose - Connection closed
   * @returns Promise that resolves with a StreamingSession
   *
   * @example Basic real-time streaming
   * ```typescript
   * const session = await adapter.transcribeStream({
   *   encoding: 'linear16',
   *   sampleRate: 16000,
   *   channels: 1,
   *   language: 'en',
   *   diarization: true,
   *   interimResults: true
   * }, {
   *   onOpen: () => console.log('Connected'),
   *   onTranscript: (event) => {
   *     if (event.isFinal) {
   *       console.log('Final:', event.text);
   *     } else {
   *       console.log('Interim:', event.text);
   *     }
   *   },
   *   onError: (error) => console.error('Error:', error),
   *   onClose: () => console.log('Disconnected')
   * });
   *
   * // Send audio chunks
   * const audioChunk = getAudioChunk();
   * await session.sendAudio({ data: audioChunk });
   *
   * // Close when done
   * await session.close();
   * ```
   *
   * @example Advanced streaming with all features
   * ```typescript
   * const session = await adapter.transcribeStream({
   *   encoding: 'linear16',
   *   sampleRate: 16000,
   *   language: 'en',
   *   model: 'nova-3',
   *   diarization: true,
   *   sentimentAnalysis: true,
   *   entityDetection: true,
   *   deepgramStreaming: {
   *     fillerWords: true,
   *     numerals: true,
   *     profanityFilter: true,
   *     topics: true,
   *     intents: true,
   *     customTopic: ['sales', 'support'],
   *     customIntent: ['purchase', 'complaint'],
   *     keyterm: ['TypeScript', 'JavaScript'],
   *     utteranceSplit: 800,
   *     punctuate: true,
   *     smartFormat: true
   *   }
   * }, {
   *   onTranscript: (e) => console.log('Transcript:', e.text),
   *   onSpeechStart: (e) => console.log('Speech started at:', e.timestamp),
   *   onSpeechEnd: (e) => console.log('Utterance ended'),
   *   onMetadata: (m) => console.log('Metadata:', m)
   * });
   * ```
   */
  async transcribeStream(
    options?: StreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession> {
    this.validateConfig()

    // Build WebSocket URL with all streaming parameters
    const wsUrl = this.buildStreamingUrl(options)

    // Create WebSocket connection
    const ws = new WebSocket(wsUrl, {
      headers: {
        Authorization: `Token ${this.config!.apiKey}`
      }
    })

    let sessionStatus: "connecting" | "open" | "closing" | "closed" = "connecting"
    const sessionId = `deepgram-${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Handle WebSocket events
    ws.on("open", () => {
      sessionStatus = "open"
      callbacks?.onOpen?.()
    })

    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as DeepgramRealtimeMessage
        this.handleWebSocketMessage(message, callbacks)
      } catch (error) {
        callbacks?.onError?.({
          code: "PARSE_ERROR",
          message: "Failed to parse WebSocket message",
          details: error
        })
      }
    })

    ws.on("error", (error: Error) => {
      callbacks?.onError?.({
        code: "WEBSOCKET_ERROR",
        message: error.message,
        details: error
      })
    })

    ws.on("close", (code: number, reason: Buffer) => {
      sessionStatus = "closed"
      callbacks?.onClose?.(code, reason.toString())
    })

    // Wait for connection to open
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("WebSocket connection timeout"))
      }, 10000)

      ws.once("open", () => {
        clearTimeout(timeout)
        resolve()
      })

      ws.once("error", (error) => {
        clearTimeout(timeout)
        reject(error)
      })
    })

    // Return StreamingSession interface
    return {
      id: sessionId,
      provider: this.name,
      createdAt: new Date(),
      getStatus: () => sessionStatus,
      sendAudio: async (chunk: AudioChunk) => {
        if (sessionStatus !== "open") {
          throw new Error(`Cannot send audio: session is ${sessionStatus}`)
        }

        if (ws.readyState !== WebSocket.OPEN) {
          throw new Error("WebSocket is not open")
        }

        // Send audio data
        ws.send(chunk.data)

        // Send close message if this is the last chunk
        if (chunk.isLast) {
          ws.send(JSON.stringify({ type: "CloseStream" }))
        }
      },
      close: async () => {
        if (sessionStatus === "closed" || sessionStatus === "closing") {
          return
        }

        sessionStatus = "closing"

        // Send CloseStream message before closing
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "CloseStream" }))
        }

        // Close WebSocket
        return new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            ws.terminate()
            resolve()
          }, 5000)

          ws.close()

          ws.once("close", () => {
            clearTimeout(timeout)
            sessionStatus = "closed"
            resolve()
          })
        })
      }
    }
  }

  /**
   * Build WebSocket URL with all streaming parameters
   */
  private buildStreamingUrl(options?: StreamingOptions): string {
    const params = new URLSearchParams()
    const dgOpts = options?.deepgramStreaming || {}

    // ─────────────────────────────────────────────────────────────────
    // Audio format parameters
    // ─────────────────────────────────────────────────────────────────
    if (options?.encoding || dgOpts.encoding) {
      params.append("encoding", (options?.encoding || dgOpts.encoding) as string)
    }
    if (options?.sampleRate || dgOpts.sampleRate) {
      params.append("sample_rate", String(options?.sampleRate || dgOpts.sampleRate))
    }
    if (options?.channels || dgOpts.channels) {
      params.append("channels", String(options?.channels || dgOpts.channels))
    }

    // ─────────────────────────────────────────────────────────────────
    // Model and language parameters
    // ─────────────────────────────────────────────────────────────────
    if (options?.language || dgOpts.language) {
      params.append("language", (options?.language || dgOpts.language) as string)
    }
    if (options?.model || dgOpts.model) {
      params.append("model", (options?.model || dgOpts.model) as string)
    }
    if (dgOpts.version) {
      params.append("version", dgOpts.version as string)
    }
    if (options?.languageDetection || dgOpts.languageDetection) {
      params.append("detect_language", "true")
    }

    // ─────────────────────────────────────────────────────────────────
    // Transcription processing parameters
    // ─────────────────────────────────────────────────────────────────
    if (options?.diarization || dgOpts.diarization) {
      params.append("diarize", "true")
    }
    if (options?.interimResults || dgOpts.interimResults) {
      params.append("interim_results", "true")
    }
    if (dgOpts.punctuate !== undefined) {
      params.append("punctuate", String(dgOpts.punctuate))
    }
    if (dgOpts.smartFormat !== undefined) {
      params.append("smart_format", String(dgOpts.smartFormat))
    }
    if (dgOpts.fillerWords) {
      params.append("filler_words", "true")
    }
    if (dgOpts.numerals) {
      params.append("numerals", "true")
    }
    if (dgOpts.measurements) {
      params.append("measurements", "true")
    }
    if (dgOpts.paragraphs) {
      params.append("paragraphs", "true")
    }
    if (dgOpts.profanityFilter) {
      params.append("profanity_filter", "true")
    }
    if (dgOpts.dictation) {
      params.append("dictation", "true")
    }
    if (dgOpts.utteranceSplit) {
      params.append("utt_split", String(dgOpts.utteranceSplit))
    }

    // ─────────────────────────────────────────────────────────────────
    // Advanced analysis parameters
    // ─────────────────────────────────────────────────────────────────
    if (options?.summarization || dgOpts.summarize) {
      params.append("summarize", "true")
    }
    if (options?.sentimentAnalysis || dgOpts.sentiment) {
      params.append("sentiment", "true")
    }
    if (options?.entityDetection || dgOpts.detectEntities) {
      params.append("detect_entities", "true")
    }
    if (dgOpts.topics) {
      params.append("topics", "true")
    }
    if (dgOpts.customTopic && dgOpts.customTopic.length > 0) {
      dgOpts.customTopic.forEach((topic) => params.append("custom_topic", topic))
    }
    if (dgOpts.customTopicMode) {
      params.append("custom_topic_mode", dgOpts.customTopicMode)
    }
    if (dgOpts.intents) {
      params.append("intents", "true")
    }
    if (dgOpts.customIntent && dgOpts.customIntent.length > 0) {
      dgOpts.customIntent.forEach((intent) => params.append("custom_intent", intent))
    }
    if (dgOpts.customIntentMode) {
      params.append("custom_intent_mode", dgOpts.customIntentMode)
    }

    // ─────────────────────────────────────────────────────────────────
    // Vocabulary and redaction parameters
    // ─────────────────────────────────────────────────────────────────
    const keywords = options?.customVocabulary || dgOpts.keywords
    if (keywords) {
      const keywordList = Array.isArray(keywords) ? keywords : [keywords]
      keywordList.forEach((kw) => params.append("keywords", kw))
    }
    if (dgOpts.keyterm && dgOpts.keyterm.length > 0) {
      dgOpts.keyterm.forEach((term) => params.append("keyterm", term))
    }

    // Handle redaction
    if (options?.piiRedaction || dgOpts.redact) {
      if (Array.isArray(dgOpts.redact)) {
        dgOpts.redact.forEach((r) => params.append("redact", r))
      } else if (dgOpts.redact === true || options?.piiRedaction) {
        params.append("redact", "pii")
        params.append("redact", "pci")
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // Callback and metadata parameters
    // ─────────────────────────────────────────────────────────────────
    if (dgOpts.callback) {
      params.append("callback", dgOpts.callback)
    }
    if (dgOpts.tag && dgOpts.tag.length > 0) {
      dgOpts.tag.forEach((t) => params.append("tag", t))
    }
    if (dgOpts.extra) {
      params.append("extra", JSON.stringify(dgOpts.extra))
    }

    // ─────────────────────────────────────────────────────────────────
    // Endpointing and VAD parameters
    // ─────────────────────────────────────────────────────────────────
    if (options?.endpointing !== undefined || dgOpts.endpointing !== undefined) {
      const ep = options?.endpointing ?? dgOpts.endpointing
      if (ep === false) {
        params.append("endpointing", "false")
      } else if (typeof ep === "number") {
        params.append("endpointing", String(ep))
      }
    }
    if (dgOpts.vadThreshold !== undefined) {
      params.append("vad_events", "true")
    }

    return `${this.wsBaseUrl}?${params.toString()}`
  }

  /**
   * Handle all WebSocket message types from Deepgram streaming
   */
  private handleWebSocketMessage(
    message: DeepgramRealtimeMessage,
    callbacks?: StreamingCallbacks
  ): void {
    switch (message.type) {
      case "Results": {
        const channel = message.channel.alternatives[0]

        if (channel && channel.transcript) {
          callbacks?.onTranscript?.({
            type: "transcript",
            text: channel.transcript,
            isFinal: message.is_final,
            confidence: channel.confidence,
            language: message.channel.detected_language,
            words: channel.words?.map((w) => ({
              word: w.punctuated_word || w.word,
              start: w.start,
              end: w.end,
              confidence: w.confidence,
              speaker: w.speaker?.toString()
            })),
            data: message
          })
        }

        // If speech_final is true, this is an utterance boundary
        if (message.speech_final && channel && channel.transcript) {
          callbacks?.onUtterance?.({
            text: channel.transcript,
            start: message.start,
            end: message.start + message.duration,
            confidence: channel.confidence,
            words: channel.words?.map((w) => ({
              word: w.punctuated_word || w.word,
              start: w.start,
              end: w.end,
              confidence: w.confidence
            }))
          })
        }
        break
      }

      case "SpeechStarted": {
        const event: SpeechEvent = {
          type: "speech_start",
          timestamp: message.timestamp,
          channel: message.channel[0]
        }
        callbacks?.onSpeechStart?.(event)
        break
      }

      case "UtteranceEnd": {
        const event: SpeechEvent = {
          type: "speech_end",
          timestamp: message.last_word_end,
          channel: message.channel[0]
        }
        callbacks?.onSpeechEnd?.(event)
        break
      }

      case "Metadata": {
        callbacks?.onMetadata?.(message as unknown as Record<string, unknown>)
        break
      }

      case "Error": {
        callbacks?.onError?.({
          code: message.variant || "DEEPGRAM_ERROR",
          message: message.message || message.description || "Unknown error",
          details: message
        })
        break
      }

      case "CloseStream": {
        // Server acknowledged close - no action needed
        break
      }

      default: {
        // Unknown message type - pass to metadata handler
        callbacks?.onMetadata?.(message as unknown as Record<string, unknown>)
        break
      }
    }
  }

  /**
   * List recent transcription requests from Deepgram's request history
   *
   * **Important:** Deepgram processes synchronously and doesn't store transcript content.
   * This method returns request metadata (IDs, timestamps, status) but NOT the actual
   * transcript text. Use this for auditing, billing analysis, or request tracking.
   *
   * Requires `projectId` to be set during initialization.
   *
   * @param options - Filtering and pagination options
   * @param options.limit - Maximum number of requests (default 10, max 1000)
   * @param options.status - Filter by status: 'succeeded' or 'failed'
   * @param options.afterDate - Start date (YYYY-MM-DD or ISO 8601)
   * @param options.beforeDate - End date (YYYY-MM-DD or ISO 8601)
   * @param options.deepgram - Provider-specific params (page, request_id, etc.)
   * @returns List of transcription request metadata
   *
   * @example List recent transcription requests
   * ```typescript
   * const adapter = new DeepgramAdapter()
   * adapter.initialize({
   *   apiKey: process.env.DEEPGRAM_API_KEY,
   *   projectId: process.env.DEEPGRAM_PROJECT_ID
   * })
   *
   * const { transcripts, hasMore } = await adapter.listTranscripts({
   *   limit: 50,
   *   status: 'succeeded'
   * })
   *
   * transcripts.forEach(t => {
   *   console.log(t.data?.id, t.data?.metadata?.createdAt)
   * })
   * ```
   *
   * @see https://developers.deepgram.com/reference/get-all-requests
   */
  async listTranscripts(options?: ListTranscriptsOptions): Promise<{
    transcripts: UnifiedTranscriptResponse[]
    total?: number
    hasMore?: boolean
  }> {
    this.validateConfig()

    if (!this.projectId) {
      return {
        transcripts: [
          {
            success: false,
            provider: this.name,
            error: {
              code: "MISSING_PROJECT_ID",
              message:
                "Deepgram listTranscripts requires projectId. Initialize with: { apiKey, projectId }"
            }
          }
        ],
        hasMore: false
      }
    }

    try {
      // Build params from unified options using generated types
      const params: ManageV1ProjectsRequestsListParams = {
        // Filter to only transcription requests (listen endpoint)
        endpoint: ManageV1FilterEndpointParameter.listen,
        ...options?.deepgram
      }

      // Map unified options
      if (options?.limit) {
        params.limit = options.limit
      }
      if (options?.afterDate) {
        params.start = options.afterDate
      }
      if (options?.beforeDate) {
        params.end = options.beforeDate
      }
      if (options?.status) {
        // Map unified status to Deepgram status
        const statusMap: Record<string, ManageV1FilterStatusParameter> = {
          completed: ManageV1FilterStatusParameter.succeeded,
          succeeded: ManageV1FilterStatusParameter.succeeded,
          error: ManageV1FilterStatusParameter.failed,
          failed: ManageV1FilterStatusParameter.failed
        }
        params.status = statusMap[options.status.toLowerCase()]
      }

      // Call Deepgram request history API
      const response = await this.client!.get<ListProjectRequestsV1Response>(
        `/projects/${this.projectId}/requests`,
        { params }
      )

      const data = response.data

      // Map request items to unified response format
      const transcripts: UnifiedTranscriptResponse[] = (data.requests || []).map(
        (item: ProjectRequestResponse) => this.normalizeRequestItem(item)
      )

      return {
        transcripts,
        hasMore: (data.page || 1) * (data.limit || 10) < (data.requests?.length || 0)
      }
    } catch (error) {
      return {
        transcripts: [this.createErrorResponse(error)],
        hasMore: false
      }
    }
  }

  /**
   * Normalize a Deepgram request history item to unified format
   */
  private normalizeRequestItem(item: ProjectRequestResponse): UnifiedTranscriptResponse {
    const isSuccess = (item.code || 0) < 400

    return {
      success: isSuccess,
      provider: this.name,
      data: {
        id: item.request_id || "",
        text: "", // Deepgram doesn't store transcript content in request history
        status: isSuccess ? "completed" : "error",
        metadata: {
          audioFileAvailable: this.capabilities.getAudioFile ?? false,
          createdAt: item.created,
          apiPath: item.path,
          apiKeyId: item.api_key_id,
          deployment: item.deployment,
          callbackUrl: item.callback,
          responseCode: item.code
        }
      },
      error: !isSuccess
        ? {
            code: "REQUEST_FAILED",
            message: `Request failed with status code ${item.code}`
          }
        : undefined,
      raw: item
    }
  }
}

/**
 * Factory function to create a Deepgram adapter
 *
 * @example Basic usage
 * ```typescript
 * import { createDeepgramAdapter } from 'voice-router-dev'
 *
 * const adapter = createDeepgramAdapter({
 *   apiKey: process.env.DEEPGRAM_API_KEY
 * })
 * ```
 *
 * @example With EU region
 * ```typescript
 * import { createDeepgramAdapter, DeepgramRegion } from 'voice-router-dev'
 *
 * const adapter = createDeepgramAdapter({
 *   apiKey: process.env.DEEPGRAM_API_KEY,
 *   region: DeepgramRegion.eu,
 *   projectId: process.env.DEEPGRAM_PROJECT_ID  // Optional, for listTranscripts
 * })
 * ```
 */
export function createDeepgramAdapter(config: DeepgramConfig): DeepgramAdapter {
  const adapter = new DeepgramAdapter()
  adapter.initialize(config)
  return adapter
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-export generated types for direct SDK access
// ─────────────────────────────────────────────────────────────────────────────

// Response types
export type {
  ListenV1Response,
  ListenV1MediaTranscribeParams,
  ListenV1ResponseResultsChannelsItemAlternativesItem,
  ListenV1ResponseResultsChannelsItemAlternativesItemWordsItem,
  ListenV1ResponseResultsUtterancesItem
}

// Request history types (for listTranscripts)
export type {
  ListProjectRequestsV1Response,
  ManageV1ProjectsRequestsListParams,
  ProjectRequestResponse,
  GetProjectRequestV1Response
}

// Enum constants for filtering
export { ManageV1FilterStatusParameter, ManageV1FilterEndpointParameter }
