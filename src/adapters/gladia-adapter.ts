/**
 * Gladia transcription provider adapter
 * Documentation: https://docs.gladia.io/
 */

import axios from "axios"
import WebSocket from "ws"
import type {
  AudioChunk,
  AudioInput,
  ListTranscriptsOptions,
  ProviderCapabilities,
  StreamingCallbacks,
  StreamingOptions,
  StreamingSession,
  TranscribeOptions,
  UnifiedTranscriptResponse,
  SpeechEvent,
  TranslationEvent,
  SentimentEvent,
  EntityEvent,
  SummarizationEvent,
  ChapterizationEvent,
  AudioAckEvent,
  LifecycleEvent
} from "../router/types"
import { mapEncodingToProvider } from "../router/audio-encoding-types"
import { BaseAdapter, type ProviderConfig } from "./base-adapter"

// Import utilities
import { ERROR_CODES } from "../utils/errors"
import {
  waitForWebSocketOpen,
  closeWebSocket,
  setupWebSocketHandlers,
  validateSessionForAudio
} from "../utils/websocket-helpers"
import { validateEnumValue } from "../utils/validation"
import {
  extractSpeakersFromUtterances,
  extractWords as extractWordsUtil,
  normalizeStatus
} from "../utils/transcription-helpers"
import type { SessionStatus } from "../router/types"

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

  protected baseUrl = "https://api.gladia.io"

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
      // Build typed request using generated types
      const request = this.buildTranscriptionRequest(audio, options)

      // Use generated API client function - FULLY TYPED!
      const response = await preRecordedControllerInitPreRecordedJobV2(
        request,
        this.getAxiosConfig()
      )

      const jobId = response.data.id

      // If webhook is provided, return immediately with job ID
      if (options?.webhookUrl) {
        return {
          success: true,
          provider: this.name,
          data: {
            id: jobId,
            text: "",
            status: "queued"
          },
          raw: response.data
        }
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

      return this.normalizeResponse(response.data)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  /**
   * Build Gladia transcription request from unified options
   */
  private buildTranscriptionRequest(
    audio: AudioInput,
    options?: TranscribeOptions
  ): InitTranscriptionRequest {
    // Get audio URL
    let audioUrl: string
    if (audio.type === "url") {
      audioUrl = audio.url
    } else {
      throw new Error(
        "Gladia adapter currently only supports URL-based audio input. Use audio.type='url'"
      )
    }

    // Start with provider-specific options (fully typed from OpenAPI)
    const request: InitTranscriptionRequest = {
      ...options?.gladia,
      audio_url: audioUrl
    }

    // Map normalized options (take precedence over gladia-specific)
    if (options) {
      // Language configuration
      // Note: codeSwitching is DIFFERENT from languageDetection
      // - codeSwitching: detect multiple languages in same audio (Gladia feature)
      // - languageDetection: auto-detect the primary language
      if (options.language || options.codeSwitching || options.codeSwitchingConfig) {
        request.language_config = {
          ...options.codeSwitchingConfig,
          languages: options.language
            ? [options.language as TranscriptionLanguageCodeEnum]
            : request.language_config?.languages,
          code_switching: options.codeSwitching ?? request.language_config?.code_switching
        }
      }

      // Diarization (speaker recognition)
      if (options.diarization) {
        request.diarization = true
        if (options.speakersExpected) {
          request.diarization_config = {
            ...request.diarization_config,
            number_of_speakers: options.speakersExpected
          }
        }
      }

      // Custom vocabulary
      if (options.customVocabulary && options.customVocabulary.length > 0) {
        request.custom_vocabulary = true
        request.custom_vocabulary_config = {
          ...request.custom_vocabulary_config,
          vocabulary: options.customVocabulary
        }
      }

      // Summarization
      if (options.summarization) {
        request.summarization = true
      }

      // Sentiment analysis
      if (options.sentimentAnalysis) {
        request.sentiment_analysis = true
      }

      // Named entity recognition (entity detection)
      if (options.entityDetection) {
        request.named_entity_recognition = true
      }

      // Webhook callback
      if (options.webhookUrl) {
        request.callback = true
        request.callback_config = {
          ...request.callback_config,
          url: options.webhookUrl
        }
      }

      // Audio-to-LLM configuration (Gladia-specific feature)
      if (options.audioToLlm) {
        request.audio_to_llm = true
        request.audio_to_llm_config = options.audioToLlm
      }
    }

    return request
  }

  /**
   * Normalize Gladia response to unified format
   */
  private normalizeResponse(response: PreRecordedResponse): UnifiedTranscriptResponse<"gladia"> {
    // Use utility to normalize status
    const status = normalizeStatus(response.status, "gladia")

    // Handle error state
    if (response.status === "error") {
      return {
        success: false,
        provider: this.name,
        error: {
          code: response.error_code?.toString() || ERROR_CODES.TRANSCRIPTION_ERROR,
          message: "Transcription failed",
          statusCode: response.error_code || undefined
        },
        raw: response
      }
    }

    // Extract transcription result
    const result = response.result
    const transcription = result?.transcription

    return {
      success: true,
      provider: this.name,
      data: {
        id: response.id,
        text: transcription?.full_transcript || "",
        confidence: undefined, // Gladia doesn't provide overall confidence
        status,
        language: transcription?.languages?.[0], // Use first detected language
        duration: undefined, // Not directly available in Gladia response
        speakers: this.extractSpeakers(transcription),
        words: this.extractWords(transcription),
        utterances: this.extractUtterances(transcription),
        summary: result?.summarization?.results || undefined,
        metadata: {
          sourceAudioUrl: response.file?.source ?? undefined,
          audioFileAvailable: this.capabilities.getAudioFile ?? false,
          filename: response.file?.filename ?? undefined,
          audioDuration: response.file?.audio_duration ?? undefined,
          requestParams: response.request_params
        },
        createdAt: response.created_at,
        completedAt: response.completed_at || undefined
      },
      // Extended data - fully typed from OpenAPI specs
      extended: {
        translation: result?.translation || undefined,
        moderation: result?.moderation || undefined,
        entities: result?.named_entity_recognition || undefined,
        sentiment: result?.sentiment_analysis || undefined,
        audioToLlm: result?.audio_to_llm || undefined,
        chapters: result?.chapterization || undefined,
        speakerReidentification: result?.speaker_reidentification || undefined,
        structuredData: result?.structured_data_extraction || undefined,
        customMetadata: response.custom_metadata || undefined
      },
      // Request tracking
      tracking: {
        requestId: response.request_id
      },
      raw: response
    }
  }

  /**
   * Extract speaker information from Gladia response
   */
  private extractSpeakers(transcription: TranscriptionDTO | undefined) {
    return extractSpeakersFromUtterances(
      transcription?.utterances,
      (utterance: UtteranceDTO) => utterance.speaker,
      (id) => `Speaker ${id}`
    )
  }

  /**
   * Extract word timestamps from Gladia response
   */
  private extractWords(transcription: TranscriptionDTO | undefined) {
    if (!transcription?.utterances) {
      return undefined
    }

    // Flatten all words from all utterances
    const allWords = transcription.utterances.flatMap((utterance: UtteranceDTO) =>
      utterance.words.map((word: WordDTO) => ({
        word,
        speaker: utterance.speaker
      }))
    )

    return extractWordsUtil(allWords, (item) => ({
      word: item.word.word,
      start: item.word.start,
      end: item.word.end,
      confidence: item.word.confidence,
      speaker: item.speaker?.toString()
    }))
  }

  /**
   * Extract utterances from Gladia response
   */
  private extractUtterances(transcription: TranscriptionDTO | undefined) {
    if (!transcription?.utterances) {
      return undefined
    }

    return transcription.utterances.map((utterance: UtteranceDTO) => ({
      text: utterance.text,
      start: utterance.start,
      end: utterance.end,
      speaker: utterance.speaker?.toString(),
      confidence: utterance.confidence,
      words: utterance.words.map((w: WordDTO) => ({
        word: w.word,
        start: w.start,
        end: w.end,
        confidence: w.confidence
      }))
    }))
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
    jobType: "pre-recorded" | "streaming" = "pre-recorded"
  ): Promise<{ success: boolean }> {
    this.validateConfig()

    try {
      if (jobType === "streaming") {
        // Use generated API client function for streaming jobs - FULLY TYPED!
        await streamingControllerDeleteStreamingJobV2(transcriptId, this.getAxiosConfig())
      } else {
        // Use generated API client function for pre-recorded jobs - FULLY TYPED!
        await preRecordedControllerDeletePreRecordedJobV2(transcriptId, this.getAxiosConfig())
      }

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
    jobType: "pre-recorded" | "streaming" = "pre-recorded"
  ): Promise<{
    success: boolean
    data?: ArrayBuffer
    contentType?: string
    error?: { code: string; message: string }
  }> {
    this.validateConfig()

    try {
      // Configure axios to return ArrayBuffer for cross-platform compatibility
      const config = {
        ...this.getAxiosConfig(),
        responseType: "arraybuffer" as const
      }

      let response: { data: ArrayBuffer; headers?: Record<string, string> }

      if (jobType === "streaming") {
        // Download audio from live/streaming job
        response = await streamingControllerGetAudioV2(transcriptId, config)
      } else {
        // Download audio from pre-recorded job
        response = await preRecordedControllerGetAudioV2(transcriptId, config)
      }

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
      // Build params from unified options + provider-specific passthrough
      const params: TranscriptionControllerListV2Params = {
        ...options?.gladia
      }

      // Map unified options to Gladia params
      if (options?.limit) {
        params.limit = options.limit
      }
      if (options?.offset) {
        params.offset = options.offset
      }
      if (options?.status) {
        // Gladia uses array of statuses - map to generated enum
        const statusMap: Record<string, TranscriptionControllerListV2StatusItem> = {
          queued: TranscriptionControllerListV2StatusItem.queued,
          processing: TranscriptionControllerListV2StatusItem.processing,
          completed: TranscriptionControllerListV2StatusItem.done, // Gladia uses 'done' not 'completed'
          done: TranscriptionControllerListV2StatusItem.done,
          error: TranscriptionControllerListV2StatusItem.error
        }
        const mappedStatus = statusMap[options.status.toLowerCase()]
        if (mappedStatus) {
          params.status = [mappedStatus]
        }
      }
      if (options?.date) {
        params.date = options.date
      }
      if (options?.beforeDate) {
        params.before_date = options.beforeDate
      }
      if (options?.afterDate) {
        params.after_date = options.afterDate
      }

      // Use generated API client function - FULLY TYPED!
      const response = await transcriptionControllerListV2(params, this.getAxiosConfig())

      // Map list items to unified response format
      const transcripts: UnifiedTranscriptResponse[] = response.data.items.map(
        (item: ListTranscriptionResponseItemsItem) => this.normalizeListItem(item)
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
   * Normalize a transcript list item to unified format
   */
  private normalizeListItem(item: ListTranscriptionResponseItemsItem): UnifiedTranscriptResponse {
    // Item can be PreRecordedResponse or StreamingResponse
    const preRecorded = item as PreRecordedResponse
    const streaming = item as StreamingResponse

    // Determine type and extract common fields
    // Gladia uses "live" for streaming jobs, "pre-recorded" for batch jobs
    const isLive = "kind" in item && item.kind === "live"
    const id = preRecorded.id || streaming.id
    const status = normalizeStatus(preRecorded.status || streaming.status, "gladia")

    // Extract text if available (pre-recorded has full result)
    const text = preRecorded.result?.transcription?.full_transcript || ""

    // Extract file data (source URL, duration) from pre-recorded responses
    const file = preRecorded.file

    return {
      success: status !== "error",
      provider: this.name,
      data: {
        id,
        text,
        status,
        duration: file?.audio_duration ?? undefined,
        metadata: {
          sourceAudioUrl: file?.source ?? undefined,
          audioFileAvailable: this.capabilities.getAudioFile ?? false,
          filename: file?.filename ?? undefined,
          audioDuration: file?.audio_duration ?? undefined,
          numberOfChannels: file?.number_of_channels ?? undefined,
          createdAt: preRecorded.created_at || streaming.created_at,
          completedAt: preRecorded.completed_at || streaming.completed_at || undefined,
          kind: isLive ? "live" : "pre-recorded",
          customMetadata: preRecorded.custom_metadata || streaming.custom_metadata
        }
      },
      error:
        preRecorded.error_code || streaming.error_code
          ? {
              code: (preRecorded.error_code || streaming.error_code)?.toString() || "ERROR",
              message: "Transcription failed"
            }
          : undefined,
      raw: item
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
   * @param options.encoding - Audio encoding (wav/pcm, wav/alaw, wav/ulaw)
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
   *   encoding: 'wav/pcm',
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
   *   encoding: 'wav/pcm',
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

    // Build streaming request with full type safety
    const streamingRequest = this.buildStreamingRequest(options)

    // Use generated API client function - FULLY TYPED!
    // Pass region as query parameter if provided
    const initResponse = await streamingControllerInitStreamingSessionV2(
      streamingRequest,
      options?.region ? { region: options.region } : undefined,
      this.getAxiosConfig()
    )

    const { id, url: wsUrl } = initResponse.data

    // Step 2: Connect to WebSocket
    const ws = new WebSocket(wsUrl)

    let sessionStatus: SessionStatus = "connecting"

    // Setup standard WebSocket event handlers
    setupWebSocketHandlers(ws, callbacks, (status) => {
      sessionStatus = status
    })

    // Handle all WebSocket message types from Gladia
    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString())
        this.handleWebSocketMessage(message, callbacks)
      } catch (error) {
        callbacks?.onError?.({
          code: ERROR_CODES.PARSE_ERROR,
          message: "Failed to parse WebSocket message",
          details: error
        })
      }
    })

    // Wait for WebSocket connection to open
    await waitForWebSocketOpen(ws)

    // Return StreamingSession interface
    return {
      id,
      provider: this.name,
      createdAt: new Date(),
      getStatus: () => sessionStatus,
      sendAudio: async (chunk: AudioChunk) => {
        // Validate session is ready
        validateSessionForAudio(sessionStatus, ws.readyState, WebSocket.OPEN)

        // Send raw audio data
        ws.send(chunk.data)

        // Send stop recording message if this is the last chunk
        if (chunk.isLast) {
          ws.send(
            JSON.stringify({
              type: "stop_recording"
            })
          )
        }
      },
      close: async () => {
        if (sessionStatus === "closed" || sessionStatus === "closing") {
          return
        }

        sessionStatus = "closing"

        // Send stop recording message before closing
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "stop_recording"
            })
          )
        }

        // Close WebSocket with utility
        await closeWebSocket(ws)
        sessionStatus = "closed"
      }
    }
  }

  /**
   * Build streaming request with full type safety from OpenAPI specs
   *
   * Maps normalized options to Gladia streaming request format,
   * including all advanced features like pre-processing, real-time
   * processing, post-processing, and message configuration.
   */
  private buildStreamingRequest(options?: StreamingOptions): StreamingRequest {
    // Start with provider-specific options (fully typed from OpenAPI)
    const gladiaOpts = options?.gladiaStreaming || {}

    // Validate sample rate against OpenAPI-generated enum
    let validatedSampleRate: StreamingSupportedSampleRateEnum | undefined
    if (options?.sampleRate) {
      validatedSampleRate = validateEnumValue(
        options.sampleRate,
        StreamingSupportedSampleRateEnum,
        "sample rate",
        "Gladia"
      )
    }

    // Validate bit depth against OpenAPI-generated enum
    let validatedBitDepth: StreamingSupportedBitDepthEnum | undefined
    if (options?.bitDepth) {
      validatedBitDepth = validateEnumValue(
        options.bitDepth,
        StreamingSupportedBitDepthEnum,
        "bit depth",
        "Gladia"
      )
    }

    // Build the base request
    const streamingRequest: StreamingRequest = {
      // Spread any direct Gladia streaming options first
      ...gladiaOpts,

      // Audio format configuration (these are excluded from gladiaStreaming to avoid conflicts)
      encoding: options?.encoding
        ? (mapEncodingToProvider(options.encoding, "gladia") as StreamingSupportedEncodingEnum)
        : undefined,
      sample_rate: validatedSampleRate,
      bit_depth: validatedBitDepth,
      channels: options?.channels,

      // Model and processing
      model: (options?.model as StreamingSupportedModels) ?? gladiaOpts.model,
      endpointing: options?.endpointing ?? gladiaOpts.endpointing,
      maximum_duration_without_endpointing:
        options?.maxSilence ?? gladiaOpts.maximum_duration_without_endpointing
    }

    // Language configuration
    if (options?.language || options?.codeSwitching || gladiaOpts.language_config) {
      streamingRequest.language_config = {
        ...gladiaOpts.language_config,
        languages: options?.language
          ? [options.language as TranscriptionLanguageCodeEnum]
          : gladiaOpts.language_config?.languages,
        code_switching: options?.codeSwitching ?? gladiaOpts.language_config?.code_switching
      }
    }

    // Pre-processing configuration (audio enhancement, speech threshold)
    if (gladiaOpts.pre_processing) {
      streamingRequest.pre_processing = gladiaOpts.pre_processing
    }

    // Real-time processing configuration
    const realtimeProcessing = gladiaOpts.realtime_processing || {}
    const hasRealtimeOptions =
      options?.customVocabulary ||
      options?.sentimentAnalysis ||
      options?.entityDetection ||
      realtimeProcessing.translation ||
      realtimeProcessing.custom_vocabulary ||
      realtimeProcessing.custom_spelling ||
      realtimeProcessing.named_entity_recognition ||
      realtimeProcessing.sentiment_analysis

    if (hasRealtimeOptions) {
      streamingRequest.realtime_processing = {
        ...realtimeProcessing,
        // Custom vocabulary
        custom_vocabulary:
          (options?.customVocabulary && options.customVocabulary.length > 0) ||
          realtimeProcessing.custom_vocabulary,
        custom_vocabulary_config:
          options?.customVocabulary && options.customVocabulary.length > 0
            ? {
                ...realtimeProcessing.custom_vocabulary_config,
                vocabulary: options.customVocabulary
              }
            : realtimeProcessing.custom_vocabulary_config,
        // Sentiment analysis
        sentiment_analysis: options?.sentimentAnalysis ?? realtimeProcessing.sentiment_analysis,
        // Named entity recognition
        named_entity_recognition:
          options?.entityDetection ?? realtimeProcessing.named_entity_recognition
      }
    }

    // Post-processing configuration (summarization, chapterization)
    const postProcessing = gladiaOpts.post_processing || {}
    if (options?.summarization || postProcessing.summarization || postProcessing.chapterization) {
      streamingRequest.post_processing = {
        ...postProcessing,
        summarization: options?.summarization ?? postProcessing.summarization
      }
    }

    // Messages configuration (controls which WebSocket events to receive)
    if (gladiaOpts.messages_config) {
      streamingRequest.messages_config = gladiaOpts.messages_config
    } else if (options?.interimResults !== undefined) {
      // If interimResults specified, configure message types accordingly
      streamingRequest.messages_config = {
        receive_partial_transcripts: options.interimResults,
        receive_final_transcripts: true
      }
    }

    // Callback configuration (for HTTP callbacks alongside WebSocket)
    if (gladiaOpts.callback || gladiaOpts.callback_config) {
      streamingRequest.callback = gladiaOpts.callback
      streamingRequest.callback_config = gladiaOpts.callback_config
    }

    // Custom metadata
    if (gladiaOpts.custom_metadata) {
      streamingRequest.custom_metadata = gladiaOpts.custom_metadata
    }

    return streamingRequest
  }

  /**
   * Handle all WebSocket message types from Gladia streaming
   *
   * Processes transcript, utterance, speech events, real-time processing
   * results (translation, sentiment, NER), post-processing results
   * (summarization, chapterization), acknowledgments, and lifecycle events.
   */
  private handleWebSocketMessage(message: unknown, callbacks?: StreamingCallbacks): void {
    const msg = message as Record<string, unknown>
    const messageType = msg.type as string

    switch (messageType) {
      // ─────────────────────────────────────────────────────────────────
      // Transcript events
      // ─────────────────────────────────────────────────────────────────

      case "transcript": {
        const transcriptMessage = message as TranscriptMessage
        const messageData = transcriptMessage.data
        const utterance = messageData.utterance

        callbacks?.onTranscript?.({
          type: "transcript",
          text: utterance.text,
          isFinal: messageData.is_final,
          confidence: utterance.confidence,
          language: utterance.language,
          channel: utterance.channel,
          speaker: utterance.speaker?.toString(),
          words: utterance.words.map((w) => ({
            word: w.word,
            start: w.start,
            end: w.end,
            confidence: w.confidence
          })),
          data: message
        })
        break
      }

      case "utterance": {
        const transcriptMessage = message as TranscriptMessage
        const messageData = transcriptMessage.data
        const utterance = messageData.utterance

        callbacks?.onUtterance?.({
          text: utterance.text,
          start: utterance.start,
          end: utterance.end,
          speaker: utterance.speaker?.toString(),
          confidence: utterance.confidence,
          words: utterance.words.map((w) => ({
            word: w.word,
            start: w.start,
            end: w.end,
            confidence: w.confidence
          }))
        })
        break
      }

      // Post-processing transcripts (final accumulated transcript)
      case "post_transcript": {
        const postTranscript = message as PostTranscriptMessage
        callbacks?.onTranscript?.({
          type: "transcript",
          text: postTranscript.data?.full_transcript || "",
          isFinal: true,
          data: message
        })
        break
      }

      case "post_final_transcript": {
        const postFinal = message as PostFinalTranscriptMessage
        callbacks?.onTranscript?.({
          type: "transcript",
          text: postFinal.data?.transcription?.full_transcript || "",
          isFinal: true,
          data: message
        })
        break
      }

      // ─────────────────────────────────────────────────────────────────
      // Speech detection events
      // ─────────────────────────────────────────────────────────────────

      case "speech_start": {
        const speechStart = message as SpeechStartMessage
        const event: SpeechEvent = {
          type: "speech_start",
          timestamp: speechStart.data.time,
          channel: speechStart.data.channel,
          sessionId: speechStart.session_id
        }
        callbacks?.onSpeechStart?.(event)
        break
      }

      case "speech_end": {
        const speechEnd = message as SpeechEndMessage
        const event: SpeechEvent = {
          type: "speech_end",
          timestamp: speechEnd.data.time,
          channel: speechEnd.data.channel,
          sessionId: speechEnd.session_id
        }
        callbacks?.onSpeechEnd?.(event)
        break
      }

      // ─────────────────────────────────────────────────────────────────
      // Real-time processing events
      // ─────────────────────────────────────────────────────────────────

      case "translation": {
        const translationMsg = message as TranslationMessage
        if (translationMsg.error) {
          callbacks?.onError?.({
            code: ERROR_CODES.TRANSCRIPTION_ERROR,
            message: "Translation failed",
            details: translationMsg.error
          })
        } else if (translationMsg.data) {
          const event: TranslationEvent = {
            utteranceId: translationMsg.data.utterance_id,
            original: translationMsg.data.utterance.text,
            targetLanguage: translationMsg.data.target_language,
            translatedText: translationMsg.data.translated_utterance.text,
            isFinal: true
          }
          callbacks?.onTranslation?.(event)
        }
        break
      }

      case "sentiment_analysis": {
        const sentimentMsg = message as SentimentAnalysisMessage
        if (sentimentMsg.error) {
          callbacks?.onError?.({
            code: ERROR_CODES.TRANSCRIPTION_ERROR,
            message: "Sentiment analysis failed",
            details: sentimentMsg.error
          })
        } else if (sentimentMsg.data) {
          // Send one event per sentiment result
          for (const result of sentimentMsg.data.results) {
            const event: SentimentEvent = {
              utteranceId: sentimentMsg.data.utterance_id,
              sentiment: result.sentiment,
              confidence: undefined // Gladia doesn't provide confidence for sentiment
            }
            callbacks?.onSentiment?.(event)
          }
        }
        break
      }

      case "named_entity_recognition": {
        const nerMsg = message as NamedEntityRecognitionMessage
        if (nerMsg.error) {
          callbacks?.onError?.({
            code: ERROR_CODES.TRANSCRIPTION_ERROR,
            message: "Named entity recognition failed",
            details: nerMsg.error
          })
        } else if (nerMsg.data) {
          // Send one event per entity
          for (const entity of nerMsg.data.results) {
            const event: EntityEvent = {
              utteranceId: nerMsg.data.utterance_id,
              text: entity.text,
              type: entity.entity_type,
              start: entity.start,
              end: entity.end
            }
            callbacks?.onEntity?.(event)
          }
        }
        break
      }

      // ─────────────────────────────────────────────────────────────────
      // Post-processing events
      // ─────────────────────────────────────────────────────────────────

      case "post_summarization": {
        const summaryMsg = message as PostSummarizationMessage
        if (summaryMsg.error) {
          callbacks?.onSummarization?.({
            summary: "",
            error: typeof summaryMsg.error === "string" ? summaryMsg.error : "Summarization failed"
          })
        } else if (summaryMsg.data) {
          callbacks?.onSummarization?.({
            summary: summaryMsg.data.results
          })
        }
        break
      }

      case "post_chapterization": {
        const chapterMsg = message as PostChapterizationMessage
        if (chapterMsg.error) {
          callbacks?.onChapterization?.({
            chapters: [],
            error: typeof chapterMsg.error === "string" ? chapterMsg.error : "Chapterization failed"
          })
        } else if (chapterMsg.data) {
          callbacks?.onChapterization?.({
            chapters: chapterMsg.data.results.map((ch) => ({
              headline: ch.headline,
              summary: ch.summary || ch.abstractive_summary || ch.extractive_summary || "",
              start: ch.start,
              end: ch.end
            }))
          })
        }
        break
      }

      // ─────────────────────────────────────────────────────────────────
      // Acknowledgment events
      // ─────────────────────────────────────────────────────────────────

      case "audio_chunk_ack": {
        const ackMsg = message as AudioChunkAckMessage
        if (ackMsg.error) {
          callbacks?.onError?.({
            code: ERROR_CODES.TRANSCRIPTION_ERROR,
            message: "Audio chunk not acknowledged",
            details: ackMsg.error
          })
        } else if (ackMsg.data) {
          const event: AudioAckEvent = {
            byteRange: ackMsg.data.byte_range as [number, number],
            timeRange: ackMsg.data.time_range as [number, number],
            timestamp: ackMsg.created_at
          }
          callbacks?.onAudioAck?.(event)
        }
        break
      }

      case "stop_recording_ack": {
        const stopAck = message as StopRecordingAckMessage
        if (stopAck.error) {
          callbacks?.onError?.({
            code: ERROR_CODES.TRANSCRIPTION_ERROR,
            message: "Stop recording not acknowledged",
            details: stopAck.error
          })
        }
        // No specific callback for stop_recording_ack, handled as lifecycle
        break
      }

      // ─────────────────────────────────────────────────────────────────
      // Lifecycle events
      // ─────────────────────────────────────────────────────────────────

      case "start_session": {
        const startSession = message as StartSessionMessage
        const event: LifecycleEvent = {
          eventType: "start_session",
          timestamp: startSession.created_at,
          sessionId: startSession.session_id
        }
        callbacks?.onLifecycle?.(event)
        break
      }

      case "start_recording": {
        const startRecording = message as StartRecordingMessage
        const event: LifecycleEvent = {
          eventType: "start_recording",
          timestamp: startRecording.created_at,
          sessionId: startRecording.session_id
        }
        callbacks?.onLifecycle?.(event)
        break
      }

      case "end_recording": {
        const endRecording = message as EndRecordingMessage
        const event: LifecycleEvent = {
          eventType: "end_recording",
          timestamp: endRecording.created_at,
          sessionId: endRecording.session_id
        }
        callbacks?.onLifecycle?.(event)
        break
      }

      case "end_session": {
        const endSession = message as EndSessionMessage
        const event: LifecycleEvent = {
          eventType: "end_session",
          timestamp: endSession.created_at,
          sessionId: endSession.session_id
        }
        callbacks?.onLifecycle?.(event)
        break
      }

      // ─────────────────────────────────────────────────────────────────
      // Metadata and other events
      // ─────────────────────────────────────────────────────────────────

      case "metadata":
        callbacks?.onMetadata?.(msg)
        break

      case "error": {
        const errorMsg = msg as { error?: { code?: string; message?: string } }
        callbacks?.onError?.({
          code: errorMsg.error?.code || ERROR_CODES.TRANSCRIPTION_ERROR,
          message: errorMsg.error?.message || "Unknown streaming error",
          details: msg
        })
        break
      }

      default:
        // Unknown message type - pass to metadata handler for extensibility
        callbacks?.onMetadata?.(msg)
        break
    }
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
