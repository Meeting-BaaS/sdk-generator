export * from "./deepgram"
/**
 * Deepgram transcription provider adapter
 * Documentation: https://developers.deepgram.com/
 */

import type { AxiosInstance } from "axios"
import type {
  AudioChunk,
  AudioInput,
  ProviderCapabilities,
  StreamingCallbacks,
  StreamingOptions,
  StreamingSession,
  TranscribeOptions,
  UnifiedTranscriptResponse,
  RawWebSocketMessage
} from "../router/types"
import { BaseAdapter, type ProviderConfig } from "./base-adapter"
import type {
  ProviderConfigWithRegion,
  RegionalEndpoints,
  SessionStatus
} from "./shared-types"
import type { DeepgramRegionType } from "../constants"

/**
 * Deepgram-specific configuration options
 *
 * @see https://developers.deepgram.com/reference/custom-endpoints - Official custom endpoints documentation
 */
export interface DeepgramConfig extends ProviderConfigWithRegion<DeepgramRegionType> {
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

import { getProviderEndpoints } from "./provider-endpoints"
import {
  mapToTranscriptionParams,
  mapFromDeepgramResponse,
  mapFromDeepgramRequestItem
} from "./mappers/deepgram-mappers"
import {
  buildDeepgramListParams,
  createDeepgramClient,
  createDeepgramProjectIdError,
  createDeepgramStreamingSession,
  submitDeepgramTranscription
} from "./helpers/deepgram-helpers"

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
  protected baseUrl: string
  private wsBaseUrl: string
  private projectId?: string

  constructor() {
    super()
    const defaults = getProviderEndpoints("deepgram")
    this.baseUrl = defaults.api
    this.wsBaseUrl = defaults.websocket!
  }

  initialize(config: DeepgramConfig): void {
    super.initialize(config)
    this.projectId = config.projectId

    const endpoints = config.baseUrl
      ? {
          api: config.baseUrl,
          websocket:
            config.wsBaseUrl ?? `${this.deriveWsUrl(config.baseUrl)}/listen`
        }
      : getProviderEndpoints("deepgram", config.region, {
          baseUrl: config.baseUrl,
          wsBaseUrl: config.wsBaseUrl
        })

    this.baseUrl = endpoints.api
    this.wsBaseUrl = endpoints.websocket!
    this.client = createDeepgramClient(this.baseUrl, config)
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

    if (!this.config!.baseUrl) {
      const endpoints = getProviderEndpoints("deepgram", region)
      this.baseUrl = endpoints.api
      if (!this.config!.wsBaseUrl) {
        this.wsBaseUrl = endpoints.websocket!
      }
    }

    this.client = createDeepgramClient(this.baseUrl, this.config!)
  }

  /**
   * Get the current regional endpoints being used
   *
   * @returns Object with REST API and WebSocket URLs
   */
  getRegion(): RegionalEndpoints {
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
      const params = mapToTranscriptionParams(options)
      const response = await submitDeepgramTranscription(this.client!, audio, params)
      return mapFromDeepgramResponse(response, this.name)
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
      return createDeepgramProjectIdError(this.name, "getTranscript")
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
        return mapFromDeepgramRequestItem(request, this.name, this.capabilities)
      }

      return mapFromDeepgramResponse(transcriptResponse, this.name)
    } catch (error) {
      return this.createErrorResponse(error)
    }
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
    return await createDeepgramStreamingSession({
      apiKey: this.config!.apiKey,
      provider: this.name,
      wsBaseUrl: this.wsBaseUrl,
      options,
      callbacks
    })
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
        transcripts: [createDeepgramProjectIdError(this.name, "listTranscripts")],
        hasMore: false
      }
    }

    try {
      const params = buildDeepgramListParams(options)
      const response = await this.client!.get<ListProjectRequestsV1Response>(
        `/projects/${this.projectId}/requests`,
        { params }
      )

      const data = response.data

      const transcripts: UnifiedTranscriptResponse[] = (data.requests || []).map(
        (item: ProjectRequestResponse) =>
          mapFromDeepgramRequestItem(item, this.name, this.capabilities)
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
