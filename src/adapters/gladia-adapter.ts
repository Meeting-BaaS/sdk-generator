export * from "./gladia"
/**
 * Gladia transcription provider adapter
 * Documentation: https://docs.gladia.io/
 */

import type {
  AudioInput,
  ListTranscriptsOptions,
  ProviderCapabilities,
  StreamingCallbacks,
  StreamingOptions,
  StreamingSession,
  TranscribeOptions,
  UnifiedTranscriptResponse
} from "../router/types"
import { BaseAdapter, type ProviderConfig } from "./base-adapter"
import type { TranscriptJobType } from "./shared-types"
import { getProviderEndpoints } from "./provider-endpoints"
import {
  mapToTranscribeRequest,
  mapFromGladiaResponse,
  mapFromGladiaListItem,
  mapToStreamingRequest,
  handleGladiaWebSocketMessage
} from "./mappers/gladia-mappers"
import {
  buildGladiaListParams,
  createGladiaStreamingSession,
  createQueuedTranscriptResponse,
  deleteGladiaJob,
  downloadGladiaAudio
} from "./helpers/gladia-helpers"

// Import generated API client functions - FULL TYPE SAFETY!
import {
  preRecordedControllerInitPreRecordedJobV2,
  preRecordedControllerGetPreRecordedJobV2,
  preRecordedControllerDeletePreRecordedJobV2,
  preRecordedControllerGetAudioV2,
  transcriptionControllerListV2,
  streamingControllerInitStreamingSessionV2,
  streamingControllerDeleteStreamingJobV2,
  streamingControllerGetAudioV2
} from "../generated/gladia/api/gladiaControlAPI"

// Import Gladia generated types
import type { InitTranscriptionRequest } from "../generated/gladia/schema/initTranscriptionRequest"
import type { PreRecordedResponse } from "../generated/gladia/schema/preRecordedResponse"
import type { StreamingResponse } from "../generated/gladia/schema/streamingResponse"
import type { StreamingRequest } from "../generated/gladia/schema/streamingRequest"
import type { TranscriptionControllerListV2Params } from "../generated/gladia/schema/transcriptionControllerListV2Params"
import { TranscriptionControllerListV2StatusItem } from "../generated/gladia/schema/transcriptionControllerListV2StatusItem"
import type { ListTranscriptionResponseItemsItem } from "../generated/gladia/schema/listTranscriptionResponseItemsItem"
import type { TranscriptionDTO } from "../generated/gladia/schema/transcriptionDTO"
import type { UtteranceDTO } from "../generated/gladia/schema/utteranceDTO"
import type { WordDTO } from "../generated/gladia/schema/wordDTO"
// WebSocket message types for type-safe parsing
import type { TranscriptMessage } from "../generated/gladia/schema/transcriptMessage"
// Import Gladia's supported values from OpenAPI-generated schema (type safety!)
import { StreamingSupportedSampleRateEnum } from "../generated/gladia/schema/streamingSupportedSampleRateEnum"
import { StreamingSupportedBitDepthEnum } from "../generated/gladia/schema/streamingSupportedBitDepthEnum"
import type { StreamingSupportedEncodingEnum } from "../generated/gladia/schema/streamingSupportedEncodingEnum"
import type { StreamingSupportedModels } from "../generated/gladia/schema/streamingSupportedModels"
import type { TranscriptionLanguageCodeEnum } from "../generated/gladia/schema/transcriptionLanguageCodeEnum"

// Import all streaming WebSocket message types for comprehensive handling
import type { SpeechStartMessage } from "../generated/gladia/schema/speechStartMessage"
import type { SpeechEndMessage } from "../generated/gladia/schema/speechEndMessage"
import type { TranslationMessage } from "../generated/gladia/schema/translationMessage"
import type { SentimentAnalysisMessage } from "../generated/gladia/schema/sentimentAnalysisMessage"
import type { NamedEntityRecognitionMessage } from "../generated/gladia/schema/namedEntityRecognitionMessage"
import type { PostSummarizationMessage } from "../generated/gladia/schema/postSummarizationMessage"
import type { PostChapterizationMessage } from "../generated/gladia/schema/postChapterizationMessage"
import type { AudioChunkAckMessage } from "../generated/gladia/schema/audioChunkAckMessage"
import type { StartSessionMessage } from "../generated/gladia/schema/startSessionMessage"
import type { StartRecordingMessage } from "../generated/gladia/schema/startRecordingMessage"
import type { StopRecordingAckMessage } from "../generated/gladia/schema/stopRecordingAckMessage"
import type { EndRecordingMessage } from "../generated/gladia/schema/endRecordingMessage"
import type { EndSessionMessage } from "../generated/gladia/schema/endSessionMessage"
import type { PostTranscriptMessage } from "../generated/gladia/schema/postTranscriptMessage"
import type { PostFinalTranscriptMessage } from "../generated/gladia/schema/postFinalTranscriptMessage"

/**
 * Gladia transcription provider adapter
 *
 * Implements transcription for the Gladia API with support for:
 * - Synchronous and asynchronous transcription
 * - Speaker diarization (identifying different speakers)
 * - Multi-language detection and transcription
 * - Summarization and sentiment analysis
 * - Custom vocabulary boosting
 * - Word-level timestamps
 *
 * @see https://docs.gladia.io/ Gladia API Documentation
 *
 * @example Basic transcription
 * ```typescript
 * import { GladiaAdapter } from '@meeting-baas/sdk';
 *
 * const adapter = new GladiaAdapter();
 * adapter.initialize({
 *   apiKey: process.env.GLADIA_API_KEY
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
 * @example With summarization
 * ```typescript
 * const result = await adapter.transcribe(audio, {
 *   language: 'en',
 *   summarization: true,
 *   sentimentAnalysis: true
 * });
 *
 * console.log('Summary:', result.data.summary);
 * ```
 */
export class GladiaAdapter extends BaseAdapter {
  readonly name = "gladia" as const
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    diarization: true,
    wordTimestamps: true,
    languageDetection: true,
    customVocabulary: true,
    summarization: true,
    sentimentAnalysis: true,
    entityDetection: true,
    piiRedaction: false, // Gladia doesn't have PII redaction in their API
    listTranscripts: true,
    deleteTranscript: true,
    getAudioFile: true // Gladia stores and allows downloading original audio files
  }

  protected baseUrl: string

  constructor() {
    super()
    this.baseUrl = getProviderEndpoints("gladia").api
  }

  initialize(config: ProviderConfig): void {
    super.initialize(config)
    if (config.baseUrl) this.baseUrl = config.baseUrl
  }

  /**
   * Get axios config for generated API client functions
   * Configures headers and base URL using Gladia's x-gladia-key header
   */
  protected getAxiosConfig() {
    return super.getAxiosConfig("x-gladia-key")
  }

  /**
   * Submit audio for transcription
   *
   * Sends audio to Gladia API for transcription. If a webhook URL is provided,
   * returns immediately with the job ID. Otherwise, polls until completion.
   *
   * @param audio - Audio input (currently only URL type supported)
   * @param options - Transcription options
   * @param options.language - Language code (e.g., 'en', 'es', 'fr')
   * @param options.languageDetection - Enable automatic language detection
   * @param options.diarization - Enable speaker identification
   * @param options.speakersExpected - Number of expected speakers (for diarization)
   * @param options.summarization - Generate text summary
   * @param options.sentimentAnalysis - Analyze sentiment of transcription
   * @param options.customVocabulary - Words to boost in recognition
   * @param options.webhookUrl - Callback URL for async results
   * @returns Normalized transcription response
   * @throws {Error} If audio type is not 'url' (file/stream not yet supported)
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
   *   speakersExpected: 3,
   *   summarization: true,
   *   customVocabulary: ['API', 'TypeScript', 'JavaScript']
   * });
   * ```
   *
   * @example With webhook (returns job ID immediately for polling)
   * ```typescript
   * // Submit transcription with webhook
   * const result = await adapter.transcribe({
   *   type: 'url',
   *   url: 'https://example.com/meeting.mp3'
   * }, {
   *   webhookUrl: 'https://myapp.com/webhook/transcription',
   *   language: 'en'
   * });
   *
   * // Get job ID for polling
   * const jobId = result.data?.id;
   * console.log('Job ID:', jobId); // Use this to poll for status
   *
   * // Later: Poll for completion (if webhook fails or you want to check)
   * const status = await adapter.getTranscript(jobId);
   * if (status.data?.status === 'completed') {
   *   console.log('Transcript:', status.data.text);
   * }
   * ```
   */
  async transcribe(
    audio: AudioInput,
    options?: TranscribeOptions
  ): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      if (audio.type !== "url") {
        throw new Error(
          "Gladia adapter currently only supports URL-based audio input. Use audio.type='url'"
        )
      }
      const request = mapToTranscribeRequest(audio.url, options)

      // Use generated API client function - FULLY TYPED!
      const response = await preRecordedControllerInitPreRecordedJobV2(
        request,
        this.getAxiosConfig()
      )

      const jobId = response.data.id

      // If webhook is provided, return immediately with job ID
      if (options?.webhookUrl) {
        return createQueuedTranscriptResponse(this.name, jobId, response.data)
      }

      // Otherwise, poll for results
      return await this.pollForCompletion(jobId)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  /**
   * Get transcription result by ID
   */
  async getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      // Use generated API client function - FULLY TYPED!
      const response = await preRecordedControllerGetPreRecordedJobV2(
        transcriptId,
        this.getAxiosConfig()
      )

      return mapFromGladiaResponse(response.data, this.name, this.capabilities)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  /**
   * Delete a transcription job and its associated data
   *
   * Removes the transcription data from Gladia's servers. This action is
   * irreversible. Supports both pre-recorded and streaming job IDs.
   *
   * @param transcriptId - The ID of the transcript/job to delete
   * @param jobType - Type of job: 'pre-recorded' or 'streaming' (defaults to 'pre-recorded')
   * @returns Promise with success status
   *
   * @example Delete a pre-recorded transcript
   * ```typescript
   * const result = await adapter.deleteTranscript('abc123');
   * if (result.success) {
   *   console.log('Transcript deleted successfully');
   * }
   * ```
   *
   * @example Delete a streaming job
   * ```typescript
   * const result = await adapter.deleteTranscript('stream-456', 'streaming');
   * ```
   *
   * @see https://docs.gladia.io/
   */
  async deleteTranscript(
    transcriptId: string,
    jobType: TranscriptJobType = "pre-recorded"
  ): Promise<{ success: boolean }> {
    this.validateConfig()

    try {
      await deleteGladiaJob(transcriptId, jobType, this.getAxiosConfig())
      return { success: true }
    } catch (error) {
      // If job not found, consider it already deleted
      const err = error as { response?: { status?: number } }
      if (err.response?.status === 404) {
        return { success: true }
      }
      throw error
    }
  }

  /**
   * Download the original audio file from a transcription
   *
   * Gladia stores the audio files used for transcription and allows downloading them.
   * This works for both pre-recorded and streaming (live) transcriptions.
   *
   * Returns ArrayBuffer for cross-platform compatibility (Node.js and browser).
   *
   * @param transcriptId - The ID of the transcript/job
   * @param jobType - Type of job: 'pre-recorded' or 'streaming' (defaults to 'pre-recorded')
   * @returns Promise with the audio file as ArrayBuffer, or error
   *
   * @example Download and save audio (Node.js)
   * ```typescript
   * const result = await adapter.getAudioFile('abc123');
   * if (result.success && result.data) {
   *   const buffer = Buffer.from(result.data);
   *   fs.writeFileSync('audio.mp3', buffer);
   * }
   * ```
   *
   * @example Download and create URL (Browser)
   * ```typescript
   * const result = await adapter.getAudioFile('abc123');
   * if (result.success && result.data) {
   *   const blob = new Blob([result.data], { type: 'audio/mpeg' });
   *   const url = URL.createObjectURL(blob);
   *   audioElement.src = url;
   * }
   * ```
   *
   * @example Download audio from a live/streaming session
   * ```typescript
   * const result = await adapter.getAudioFile('stream-456', 'streaming');
   * if (result.success && result.data) {
   *   console.log('Audio file size:', result.data.byteLength, 'bytes');
   * }
   * ```
   *
   * @see https://docs.gladia.io/
   */
  async getAudioFile(
    transcriptId: string,
    jobType: TranscriptJobType = "pre-recorded"
  ): Promise<{
    success: boolean
    data?: ArrayBuffer
    contentType?: string
    error?: { code: string; message: string }
  }> {
    this.validateConfig()

    try {
      const config = {
        ...this.getAxiosConfig(),
        responseType: "arraybuffer" as const
      }
      const response = await downloadGladiaAudio(transcriptId, jobType, config)

      return {
        success: true,
        data: response.data,
        contentType: response.headers?.["content-type"]
      }
    } catch (error) {
      const err = error as { response?: { status?: number }; message?: string }

      if (err.response?.status === 404) {
        return {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Audio file not found for transcript ${transcriptId}`
          }
        }
      }

      return {
        success: false,
        error: {
          code: "DOWNLOAD_ERROR",
          message: err.message || "Failed to download audio file"
        }
      }
    }
  }

  /**
   * List recent transcriptions with filtering
   *
   * Retrieves a list of transcription jobs (both pre-recorded and streaming)
   * with optional filtering by status, date, and custom metadata.
   *
   * @param options - Filtering and pagination options
   * @param options.limit - Maximum number of transcripts to return
   * @param options.offset - Pagination offset (skip N results)
   * @param options.status - Filter by status (queued, processing, done, error)
   * @param options.date - Filter by exact date (ISO format YYYY-MM-DD)
   * @param options.beforeDate - Filter for transcripts before this date
   * @param options.afterDate - Filter for transcripts after this date
   * @param options.gladia - Full Gladia-specific options (custom_metadata, kind, etc.)
   * @returns List of transcripts with pagination info
   *
   * @example List recent transcripts
   * ```typescript
   * const { transcripts, hasMore } = await adapter.listTranscripts({
   *   limit: 50,
   *   status: 'done'
   * })
   * ```
   *
   * @example Filter by date range
   * ```typescript
   * const { transcripts } = await adapter.listTranscripts({
   *   afterDate: '2026-01-01',
   *   beforeDate: '2026-01-31',
   *   limit: 100
   * })
   * ```
   *
   * @example Filter by custom metadata
   * ```typescript
   * const { transcripts } = await adapter.listTranscripts({
   *   gladia: {
   *     custom_metadata: { project: 'my-project' }
   *   }
   * })
   * ```
   *
   * @see https://docs.gladia.io/
   */
  async listTranscripts(options?: ListTranscriptsOptions): Promise<{
    transcripts: UnifiedTranscriptResponse[]
    total?: number
    hasMore?: boolean
  }> {
    this.validateConfig()

    try {
      const params = buildGladiaListParams(options)
      const response = await transcriptionControllerListV2(params, this.getAxiosConfig())

      const transcripts: UnifiedTranscriptResponse[] = response.data.items.map(
        (item: ListTranscriptionResponseItemsItem) =>
          mapFromGladiaListItem(item, this.name, this.capabilities)
      )

      return {
        transcripts,
        hasMore: response.data.next !== null
      }
    } catch (error) {
      return {
        transcripts: [this.createErrorResponse(error)],
        hasMore: false
      }
    }
  }

  /**
   * Stream audio for real-time transcription
   *
   * Creates a WebSocket connection to Gladia for streaming transcription.
   * First initializes a session via REST API, then connects to WebSocket.
   *
   * Supports all Gladia streaming features:
   * - Real-time transcription with interim/final results
   * - Speech detection events (speech_start, speech_end)
   * - Real-time translation to other languages
   * - Real-time sentiment analysis
   * - Real-time named entity recognition
   * - Post-processing summarization and chapterization
   * - Audio preprocessing (audio enhancement, speech threshold)
   * - Custom vocabulary and spelling
   * - Multi-language code switching
   *
   * @param options - Streaming configuration options
   * @param options.encoding - Audio encoding in unified format (linear16, mulaw, alaw) - mapped to Gladia's wav/pcm, wav/ulaw, wav/alaw
   * @param options.sampleRate - Sample rate (8000, 16000, 32000, 44100, 48000)
   * @param options.bitDepth - Bit depth (8, 16, 24, 32)
   * @param options.channels - Number of channels (1-8)
   * @param options.language - Language code for transcription
   * @param options.interimResults - Enable partial/interim transcripts
   * @param options.endpointing - Silence duration to end utterance (0.01-10 seconds)
   * @param options.maxSilence - Max duration without endpointing (5-60 seconds)
   * @param options.customVocabulary - Words to boost in recognition
   * @param options.sentimentAnalysis - Enable real-time sentiment analysis
   * @param options.entityDetection - Enable named entity recognition
   * @param options.summarization - Enable post-processing summarization
   * @param options.gladiaStreaming - Full Gladia streaming options (pre_processing, realtime_processing, post_processing, messages_config)
   * @param callbacks - Event callbacks for transcription results
   * @param callbacks.onTranscript - Interim/final transcript received
   * @param callbacks.onUtterance - Complete utterance detected
   * @param callbacks.onSpeechStart - Speech detected (requires messages_config.receive_speech_events)
   * @param callbacks.onSpeechEnd - Speech ended (requires messages_config.receive_speech_events)
   * @param callbacks.onTranslation - Translation result (requires translation enabled)
   * @param callbacks.onSentiment - Sentiment analysis result
   * @param callbacks.onEntity - Named entity detected
   * @param callbacks.onSummarization - Summarization completed
   * @param callbacks.onChapterization - Chapterization completed
   * @param callbacks.onAudioAck - Audio chunk acknowledged
   * @param callbacks.onLifecycle - Session lifecycle events
   * @returns Promise that resolves with a StreamingSession
   *
   * @example Basic real-time streaming
   * ```typescript
   * const session = await adapter.transcribeStream({
   *   encoding: 'linear16', // Unified format - mapped to Gladia's 'wav/pcm'
   *   sampleRate: 16000,
   *   channels: 1,
   *   language: 'en',
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
   *   encoding: 'linear16', // Use unified format
   *   sampleRate: 16000,
   *   language: 'en',
   *   sentimentAnalysis: true,
   *   entityDetection: true,
   *   summarization: true,
   *   gladiaStreaming: {
   *     pre_processing: {
   *       audio_enhancer: true,
   *       speech_threshold: 0.5
   *     },
   *     realtime_processing: {
   *       translation: true,
   *       translation_config: { target_languages: ['fr', 'es'] }
   *     },
   *     post_processing: {
   *       chapterization: true
   *     },
   *     messages_config: {
   *       receive_speech_events: true,
   *       receive_acknowledgments: true,
   *       receive_lifecycle_events: true
   *     }
   *   }
   * }, {
   *   onTranscript: (e) => console.log('Transcript:', e.text),
   *   onSpeechStart: (e) => console.log('Speech started at:', e.timestamp),
   *   onSpeechEnd: (e) => console.log('Speech ended at:', e.timestamp),
   *   onTranslation: (e) => console.log(`${e.targetLanguage}: ${e.translatedText}`),
   *   onSentiment: (e) => console.log('Sentiment:', e.sentiment),
   *   onEntity: (e) => console.log(`Entity: ${e.type} - ${e.text}`),
   *   onSummarization: (e) => console.log('Summary:', e.summary),
   *   onChapterization: (e) => console.log('Chapters:', e.chapters),
   *   onAudioAck: (e) => console.log('Audio ack:', e.byteRange),
   *   onLifecycle: (e) => console.log('Lifecycle:', e.eventType)
   * });
   * ```
   */
  async transcribeStream(
    options?: StreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession> {
    this.validateConfig()

    const streamingRequest = mapToStreamingRequest(options)

    // Use generated API client function - FULLY TYPED!
    // Pass region as query parameter if provided
    const initResponse = await streamingControllerInitStreamingSessionV2(
      streamingRequest,
      options?.region ? { region: options.region } : undefined,
      this.getAxiosConfig()
    )

    const { id, url: apiWsUrl } = initResponse.data
    const wsUrl = this.config?.wsBaseUrl || apiWsUrl

    return await createGladiaStreamingSession({
      provider: this.name,
      sessionId: id,
      wsUrl,
      callbacks
    })
  }
}

/**
 * Factory function to create a Gladia adapter
 */
export function createGladiaAdapter(config: ProviderConfig): GladiaAdapter {
  const adapter = new GladiaAdapter()
  adapter.initialize(config)
  return adapter
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-export generated types for direct SDK access
// ─────────────────────────────────────────────────────────────────────────────

// API client functions - for advanced direct API usage
export {
  preRecordedControllerInitPreRecordedJobV2,
  preRecordedControllerGetPreRecordedJobV2,
  preRecordedControllerDeletePreRecordedJobV2,
  preRecordedControllerGetAudioV2,
  transcriptionControllerListV2,
  streamingControllerInitStreamingSessionV2,
  streamingControllerDeleteStreamingJobV2,
  streamingControllerGetAudioV2
} from "../generated/gladia/api/gladiaControlAPI"

// Request/Response types
export type {
  InitTranscriptionRequest,
  PreRecordedResponse,
  StreamingResponse,
  StreamingRequest,
  TranscriptionControllerListV2Params,
  ListTranscriptionResponseItemsItem,
  TranscriptionDTO,
  UtteranceDTO,
  WordDTO
}

// WebSocket message types - for custom message handling
export type {
  TranscriptMessage,
  SpeechStartMessage,
  SpeechEndMessage,
  TranslationMessage,
  SentimentAnalysisMessage,
  NamedEntityRecognitionMessage,
  PostSummarizationMessage,
  PostChapterizationMessage,
  AudioChunkAckMessage,
  StartSessionMessage,
  StartRecordingMessage,
  StopRecordingAckMessage,
  EndRecordingMessage,
  EndSessionMessage,
  PostTranscriptMessage,
  PostFinalTranscriptMessage
}

// Enum constants for validation
export { TranscriptionControllerListV2StatusItem }
export { StreamingSupportedSampleRateEnum, StreamingSupportedBitDepthEnum }
export type {
  StreamingSupportedEncodingEnum,
  StreamingSupportedModels,
  TranscriptionLanguageCodeEnum
}
