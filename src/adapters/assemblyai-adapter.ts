/**
 * AssemblyAI transcription provider adapter
 * Documentation: https://www.assemblyai.com/docs
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
  UnifiedTranscriptResponse
} from "../router/types"
import { BaseAdapter, type ProviderConfig } from "./base-adapter"
import { mapEncodingToProvider } from "../router/audio-encoding-types"

// Import generated API client functions - FULL TYPE SAFETY!
import {
  createTranscript,
  getTranscript as getTranscriptAPI,
  deleteTranscript as deleteTranscriptAPI,
  listTranscripts as listTranscriptsAPI,
  createTemporaryToken
} from "../generated/assemblyai/api/assemblyAIAPI"

// Import AssemblyAI generated types
import type { Transcript } from "../generated/assemblyai/schema/transcript"
import type { TranscriptParams } from "../generated/assemblyai/schema/transcriptParams"
import type { TranscriptStatus } from "../generated/assemblyai/schema/transcriptStatus"
import type { TranscriptListItem } from "../generated/assemblyai/schema/transcriptListItem"
import type { ListTranscriptsParams } from "../generated/assemblyai/schema/listTranscriptsParams"
import type { TranscriptWord } from "../generated/assemblyai/schema/transcriptWord"
import type { TranscriptUtterance } from "../generated/assemblyai/schema/transcriptUtterance"
import type { TranscriptOptionalParamsSpeechModel } from "../generated/assemblyai/schema/transcriptOptionalParamsSpeechModel"

// Import AssemblyAI v3 Streaming types (auto-synced from SDK)
import type {
  BeginEvent,
  TurnEvent,
  TerminationEvent,
  ErrorEvent,
  StreamingEventMessage,
  StreamingWord,
  StreamingUpdateConfiguration,
  StreamingForceEndpoint
} from "../generated/assemblyai/streaming-types"

// Import provider-specific streaming options
import type { AssemblyAIStreamingOptions } from "../router/provider-streaming-types"

/**
 * AssemblyAI transcription provider adapter
 *
 * Implements transcription for the AssemblyAI API with support for:
 * - Synchronous and asynchronous transcription
 * - Speaker diarization (speaker labels)
 * - Multi-language detection and transcription
 * - Summarization and sentiment analysis
 * - Entity detection and content moderation
 * - Custom vocabulary and spelling
 * - Word-level timestamps
 * - PII redaction
 *
 * @see https://www.assemblyai.com/docs AssemblyAI API Documentation
 *
 * @example Basic transcription
 * ```typescript
 * import { AssemblyAIAdapter } from '@meeting-baas/sdk';
 *
 * const adapter = new AssemblyAIAdapter();
 * adapter.initialize({
 *   apiKey: process.env.ASSEMBLYAI_API_KEY
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
 * @example With advanced features
 * ```typescript
 * const result = await adapter.transcribe(audio, {
 *   language: 'en_us',
 *   diarization: true,
 *   summarization: true,
 *   sentimentAnalysis: true,
 *   entityDetection: true,
 *   piiRedaction: true
 * });
 *
 * console.log('Summary:', result.data.summary);
 * console.log('Entities:', result.data.metadata?.entities);
 * ```
 */
export class AssemblyAIAdapter extends BaseAdapter {
  readonly name = "assemblyai" as const
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
    listTranscripts: true,
    deleteTranscript: true
  }

  protected baseUrl = "https://api.assemblyai.com" // Generated functions already include /v2 path
  private wsBaseUrl = "wss://streaming.assemblyai.com/v3/ws" // v3 Universal Streaming endpoint

  /**
   * Get axios config for generated API client functions
   * Configures headers and base URL using authorization header
   */
  protected getAxiosConfig() {
    return super.getAxiosConfig("authorization")
  }

  /**
   * Submit audio for transcription
   *
   * Sends audio to AssemblyAI API for transcription. If a webhook URL is provided,
   * returns immediately with the job ID. Otherwise, polls until completion.
   *
   * @param audio - Audio input (currently only URL type supported)
   * @param options - Transcription options
   * @param options.language - Language code (e.g., 'en', 'en_us', 'es', 'fr')
   * @param options.languageDetection - Enable automatic language detection
   * @param options.diarization - Enable speaker identification (speaker_labels)
   * @param options.speakersExpected - Number of expected speakers
   * @param options.summarization - Generate text summary
   * @param options.sentimentAnalysis - Analyze sentiment of transcription
   * @param options.entityDetection - Detect named entities (people, places, etc.)
   * @param options.piiRedaction - Redact personally identifiable information
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
   *   language: 'en_us',
   *   diarization: true,
   *   speakersExpected: 3,
   *   summarization: true,
   *   sentimentAnalysis: true,
   *   entityDetection: true,
   *   customVocabulary: ['API', 'TypeScript', 'JavaScript']
   * });
   * ```
   *
   * @example With webhook (returns transcript ID immediately for polling)
   * ```typescript
   * // Submit transcription with webhook
   * const result = await adapter.transcribe({
   *   type: 'url',
   *   url: 'https://example.com/meeting.mp3'
   * }, {
   *   webhookUrl: 'https://myapp.com/webhook/transcription',
   *   language: 'en_us'
   * });
   *
   * // Get transcript ID for polling
   * const transcriptId = result.data?.id;
   * console.log('Transcript ID:', transcriptId); // Use this to poll for status
   *
   * // Later: Poll for completion (if webhook fails or you want to check)
   * const status = await adapter.getTranscript(transcriptId);
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
      const response = await createTranscript(request, this.getAxiosConfig())

      const transcriptId = response.data.id

      // If webhook is provided, return immediately with job ID
      if (options?.webhookUrl) {
        return {
          success: true,
          provider: this.name,
          data: {
            id: transcriptId,
            text: "",
            status: "queued"
          },
          raw: response.data
        }
      }

      // Otherwise, poll for results
      return await this.pollForCompletion(transcriptId)
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
      const response = await getTranscriptAPI(transcriptId, this.getAxiosConfig())

      return this.normalizeResponse(response.data)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  /**
   * Delete a transcription and its associated data
   *
   * Removes the transcription data from AssemblyAI's servers. This action
   * is irreversible. The transcript will be marked as deleted and its
   * content will no longer be accessible.
   *
   * @param transcriptId - The ID of the transcript to delete
   * @returns Promise with success status
   *
   * @example Delete a transcript
   * ```typescript
   * const result = await adapter.deleteTranscript('abc123');
   * if (result.success) {
   *   console.log('Transcript deleted successfully');
   * }
   * ```
   *
   * @see https://www.assemblyai.com/docs/api-reference/transcripts/delete
   */
  async deleteTranscript(transcriptId: string): Promise<{ success: boolean }> {
    this.validateConfig()

    try {
      // Use generated API client function - FULLY TYPED!
      // AssemblyAI returns the transcript with status marked as deleted
      const response = await deleteTranscriptAPI(transcriptId, this.getAxiosConfig())

      // AssemblyAI marks the transcript as deleted rather than truly removing it
      // Check if the response indicates successful deletion
      return {
        success: response.data.status === "completed" || response.status === 200
      }
    } catch (error) {
      // If transcript not found, consider it already deleted
      const err = error as { response?: { status?: number } }
      if (err.response?.status === 404) {
        return { success: true }
      }
      throw error
    }
  }

  /**
   * List recent transcriptions with filtering
   *
   * Retrieves a list of transcripts with optional filtering by status and date.
   * Transcripts are sorted from newest to oldest and can be retrieved for the
   * last 90 days of usage.
   *
   * @param options - Filtering and pagination options
   * @param options.limit - Maximum number of transcripts (max 200)
   * @param options.status - Filter by status (queued, processing, completed, error)
   * @param options.date - Filter by exact date (ISO format YYYY-MM-DD)
   * @param options.assemblyai - Full AssemblyAI-specific options (before_id, after_id, etc.)
   * @returns List of transcripts with pagination info
   *
   * @example List recent transcripts
   * ```typescript
   * const { transcripts, hasMore } = await adapter.listTranscripts({
   *   limit: 50,
   *   status: 'completed'
   * })
   * ```
   *
   * @example Filter by date
   * ```typescript
   * const { transcripts } = await adapter.listTranscripts({
   *   date: '2026-01-07',
   *   limit: 100
   * })
   * ```
   *
   * @example Use cursor pagination
   * ```typescript
   * const { transcripts } = await adapter.listTranscripts({
   *   assemblyai: {
   *     after_id: 'abc123',  // Get transcripts after this ID
   *     limit: 50
   *   }
   * })
   * ```
   *
   * @see https://www.assemblyai.com/docs/api-reference/transcripts/list
   */
  async listTranscripts(options?: ListTranscriptsOptions): Promise<{
    transcripts: UnifiedTranscriptResponse[]
    total?: number
    hasMore?: boolean
  }> {
    this.validateConfig()

    try {
      // Build params from unified options + provider-specific passthrough
      const params: ListTranscriptsParams = {
        ...options?.assemblyai
      }

      // Map unified options to AssemblyAI params
      if (options?.limit) {
        params.limit = options.limit
      }
      if (options?.status) {
        params.status = options.status as TranscriptStatus
      }
      if (options?.date) {
        params.created_on = options.date
      }

      // Use generated API client function - FULLY TYPED!
      const response = await listTranscriptsAPI(params, this.getAxiosConfig())

      // Map list items to unified response format
      const transcripts: UnifiedTranscriptResponse[] = response.data.transcripts.map(
        (item: TranscriptListItem) => this.normalizeListItem(item)
      )

      return {
        transcripts,
        hasMore: response.data.page_details.next_url !== null
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
  private normalizeListItem(item: TranscriptListItem): UnifiedTranscriptResponse {
    return {
      success: item.status !== "error",
      provider: this.name,
      data: {
        id: item.id,
        text: "", // List items don't include full text
        status: item.status as "queued" | "processing" | "completed" | "error",
        metadata: {
          audioUrl: item.audio_url,
          createdAt: item.created,
          completedAt: item.completed || undefined,
          resourceUrl: item.resource_url
        }
      },
      error: item.error
        ? {
            code: "TRANSCRIPTION_ERROR",
            message: item.error
          }
        : undefined
    }
  }

  /**
   * Build AssemblyAI transcription request from unified options
   */
  private buildTranscriptionRequest(
    audio: AudioInput,
    options?: TranscribeOptions
  ): TranscriptParams {
    // Get audio URL
    let audioUrl: string
    if (audio.type === "url") {
      audioUrl = audio.url
    } else {
      throw new Error(
        "AssemblyAI adapter currently only supports URL-based audio input. Use audio.type='url'"
      )
    }

    // Start with provider-specific options (fully typed from OpenAPI)
    const request: TranscriptParams = {
      ...options?.assemblyai,
      audio_url: audioUrl,
      // Enable punctuation and formatting by default
      punctuate: options?.assemblyai?.punctuate ?? true,
      format_text: options?.assemblyai?.format_text ?? true
    }

    // Map normalized options (take precedence over assemblyai-specific)
    if (options) {
      // Model selection (best, slam-1, universal)
      // TranscriptionModel includes AssemblyAI's SpeechModel type
      if (options.model) {
        request.speech_model = options.model as TranscriptOptionalParamsSpeechModel
      }

      // Language configuration
      if (options.language) {
        // Convert ISO codes to AssemblyAI format (e.g., 'en' -> 'en_us')
        const languageCode = options.language.includes("_")
          ? options.language
          : `${options.language}_us`
        request.language_code = languageCode
      }

      if (options.languageDetection) {
        request.language_detection = true
      }

      // Speaker diarization
      if (options.diarization) {
        request.speaker_labels = true
        if (options.speakersExpected) {
          request.speakers_expected = options.speakersExpected
        }
      }

      // Custom vocabulary (word boost)
      if (options.customVocabulary && options.customVocabulary.length > 0) {
        request.word_boost = options.customVocabulary
        request.boost_param = request.boost_param ?? "high" // default to high boost
      }

      // Summarization
      if (options.summarization) {
        request.summarization = true
        request.summary_model = request.summary_model ?? "informative"
        request.summary_type = request.summary_type ?? "bullets"
      }

      // Sentiment analysis
      if (options.sentimentAnalysis) {
        request.sentiment_analysis = true
      }

      // Entity detection
      if (options.entityDetection) {
        request.entity_detection = true
      }

      // PII redaction
      if (options.piiRedaction) {
        request.redact_pii = true
      }

      // Webhook callback
      if (options.webhookUrl) {
        request.webhook_url = options.webhookUrl
      }
    }

    return request
  }

  /**
   * Normalize AssemblyAI response to unified format
   */
  private normalizeResponse(response: Transcript): UnifiedTranscriptResponse<"assemblyai"> {
    // Map AssemblyAI status to unified status
    let status: "queued" | "processing" | "completed" | "error"
    switch (response.status) {
      case "queued":
        status = "queued"
        break
      case "processing":
        status = "processing"
        break
      case "completed":
        status = "completed"
        break
      case "error":
        status = "error"
        break
      default:
        status = "queued"
    }

    // Handle error state
    if (response.status === "error") {
      return {
        success: false,
        provider: this.name,
        error: {
          code: "TRANSCRIPTION_ERROR",
          message: response.error || "Transcription failed"
        },
        raw: response
      }
    }

    return {
      success: true,
      provider: this.name,
      data: {
        id: response.id,
        text: response.text || "",
        confidence: response.confidence !== null ? response.confidence : undefined,
        status,
        language: response.language_code,
        duration: response.audio_duration ? response.audio_duration / 1000 : undefined,
        speakers: this.extractSpeakers(response),
        words: this.extractWords(response),
        utterances: this.extractUtterances(response),
        summary: response.summary || undefined,
        metadata: {
          audioUrl: response.audio_url
        }
      },
      // Extended data - fully typed from OpenAPI specs
      extended: {
        chapters: response.chapters || undefined,
        entities: response.entities || undefined,
        sentimentResults: response.sentiment_analysis_results || undefined,
        highlights: response.auto_highlights_result || undefined,
        contentSafety: response.content_safety_labels || undefined,
        topics: response.iab_categories_result || undefined,
        languageConfidence: response.language_confidence ?? undefined,
        throttled: response.throttled ?? undefined
      },
      // Request tracking
      tracking: {
        requestId: response.id
      },
      raw: response
    }
  }

  /**
   * Extract speaker information from AssemblyAI response
   */
  private extractSpeakers(transcript: Transcript) {
    if (!transcript.utterances || transcript.utterances.length === 0) {
      return undefined
    }

    // Extract unique speakers from utterances
    const speakerSet = new Set<string>()
    transcript.utterances.forEach((utterance: TranscriptUtterance) => {
      if (utterance.speaker) {
        speakerSet.add(utterance.speaker)
      }
    })

    if (speakerSet.size === 0) {
      return undefined
    }

    return Array.from(speakerSet).map((speakerId) => ({
      id: speakerId,
      label: speakerId // AssemblyAI uses format like "A", "B", "C"
    }))
  }

  /**
   * Extract word timestamps from AssemblyAI response
   */
  private extractWords(transcript: Transcript) {
    if (!transcript.words || transcript.words.length === 0) {
      return undefined
    }

    return transcript.words.map((w: TranscriptWord) => ({
      word: w.text,
      start: w.start / 1000, // Convert ms to seconds
      end: w.end / 1000, // Convert ms to seconds
      confidence: w.confidence,
      speaker: w.speaker || undefined
    }))
  }

  /**
   * Extract utterances from AssemblyAI response
   */
  private extractUtterances(transcript: Transcript) {
    if (!transcript.utterances || transcript.utterances.length === 0) {
      return undefined
    }

    return transcript.utterances.map((utterance: TranscriptUtterance) => ({
      text: utterance.text,
      start: utterance.start / 1000, // Convert ms to seconds
      end: utterance.end / 1000, // Convert ms to seconds
      speaker: utterance.speaker || undefined,
      confidence: utterance.confidence,
      words: utterance.words.map((w: TranscriptWord) => ({
        word: w.text,
        start: w.start / 1000,
        end: w.end / 1000,
        confidence: w.confidence
      }))
    }))
  }

  /**
   * Stream audio for real-time transcription
   *
   * Creates a WebSocket connection to AssemblyAI for streaming transcription.
   * Uses the v3 Universal Streaming API with full support for all parameters.
   *
   * Supports all AssemblyAI streaming features:
   * - Real-time transcription with interim/final results (Turn events)
   * - End-of-turn detection tuning (confidence threshold, silence duration)
   * - Voice Activity Detection (VAD) threshold tuning
   * - Real-time text formatting
   * - Profanity filtering
   * - Custom vocabulary (keyterms)
   * - Language detection
   * - Model selection (English or Multilingual)
   * - Dynamic configuration updates mid-stream
   * - Force endpoint command
   *
   * @param options - Streaming configuration options
   * @param options.sampleRate - Sample rate (8000, 16000, 22050, 44100, 48000)
   * @param options.encoding - Audio encoding (pcm_s16le, pcm_mulaw)
   * @param options.assemblyaiStreaming - All AssemblyAI-specific streaming options
   * @param callbacks - Event callbacks for transcription results
   * @param callbacks.onTranscript - Interim/final transcript received (Turn event)
   * @param callbacks.onUtterance - Complete utterance (Turn with end_of_turn=true)
   * @param callbacks.onMetadata - Session metadata (Begin, Termination events)
   * @param callbacks.onError - Error occurred
   * @param callbacks.onClose - Connection closed
   * @returns Promise that resolves with an extended StreamingSession
   *
   * @example Basic real-time streaming
   * ```typescript
   * const session = await adapter.transcribeStream({
   *   sampleRate: 16000,
   *   encoding: 'pcm_s16le'
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
   *   sampleRate: 16000,
   *   assemblyaiStreaming: {
   *     speechModel: 'universal-streaming-multilingual',
   *     languageDetection: true,
   *     endOfTurnConfidenceThreshold: 0.7,
   *     minEndOfTurnSilenceWhenConfident: 500,
   *     maxTurnSilence: 15000,
   *     vadThreshold: 0.3,
   *     formatTurns: true,
   *     filterProfanity: true,
   *     keyterms: ['TypeScript', 'JavaScript', 'API'],
   *     inactivityTimeout: 60000
   *   }
   * }, {
   *   onTranscript: (e) => console.log('Transcript:', e.text),
   *   onMetadata: (m) => console.log('Metadata:', m)
   * });
   *
   * // Update configuration mid-stream
   * session.updateConfiguration?.({
   *   end_of_turn_confidence_threshold: 0.5,
   *   vad_threshold: 0.2
   * });
   *
   * // Force endpoint detection
   * session.forceEndpoint?.();
   * ```
   */
  async transcribeStream(
    options?: StreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<
    StreamingSession & {
      updateConfiguration?: (config: Partial<Omit<StreamingUpdateConfiguration, "type">>) => void
      forceEndpoint?: () => void
    }
  > {
    this.validateConfig()

    if (!this.config?.apiKey) {
      throw new Error("API key is required for streaming")
    }

    // Build WebSocket URL with all parameters
    const wsUrl = this.buildStreamingUrl(options)

    // Create WebSocket connection with API key in headers
    const ws = new WebSocket(wsUrl, {
      headers: {
        Authorization: this.config.apiKey
      }
    })

    let sessionStatus: "connecting" | "open" | "closing" | "closed" = "connecting"
    const sessionId = `assemblyai-${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Audio buffering for AssemblyAI's 50-1000ms chunk requirement
    // At 16kHz, 16-bit mono: 32,000 bytes/sec
    // Minimum: 1,600 bytes (50ms), Maximum: 32,000 bytes (1000ms)
    let audioBuffer = Buffer.alloc(0)
    const MIN_CHUNK_SIZE = 1600 // 50ms at 16kHz 16-bit mono
    const MAX_CHUNK_SIZE = 32000 // 1000ms at 16kHz 16-bit mono

    const flushAudioBuffer = () => {
      if (audioBuffer.length > 0 && ws.readyState === WebSocket.OPEN) {
        ws.send(audioBuffer)
        audioBuffer = Buffer.alloc(0)
      }
    }

    // Handle WebSocket events
    ws.on("open", () => {
      sessionStatus = "open"
      callbacks?.onOpen?.()
    })

    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as StreamingEventMessage
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

    // Return extended StreamingSession interface with AssemblyAI-specific methods
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

        // AssemblyAI v3 requires chunks between 50-1000ms
        // Buffer audio until we have enough to send
        audioBuffer = Buffer.concat([audioBuffer, chunk.data])

        // Send buffer if it meets minimum size or exceeds maximum
        if (audioBuffer.length >= MIN_CHUNK_SIZE || audioBuffer.length >= MAX_CHUNK_SIZE) {
          ws.send(audioBuffer)
          audioBuffer = Buffer.alloc(0)
        }

        // Flush remaining buffer and send termination message if this is the last chunk
        if (chunk.isLast) {
          flushAudioBuffer()
          ws.send(JSON.stringify({ type: "Terminate" }))
        }
      },

      close: async () => {
        if (sessionStatus === "closed" || sessionStatus === "closing") {
          return
        }

        sessionStatus = "closing"

        // Flush any remaining buffered audio before closing
        flushAudioBuffer()

        // Send termination message before closing
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "Terminate" }))
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
      },

      /**
       * Update streaming configuration mid-session
       *
       * Allows changing VAD, end-of-turn, and formatting settings
       * without restarting the stream.
       *
       * @param config - Configuration parameters to update
       */
      updateConfiguration: (config: Partial<Omit<StreamingUpdateConfiguration, "type">>) => {
        if (ws.readyState !== WebSocket.OPEN) {
          throw new Error("Cannot update configuration: WebSocket is not open")
        }

        const updateMsg: StreamingUpdateConfiguration = {
          type: "UpdateConfiguration",
          ...config
        }
        ws.send(JSON.stringify(updateMsg))
      },

      /**
       * Force endpoint detection
       *
       * Immediately triggers end-of-turn, useful for manual control
       * of turn boundaries (e.g., when user presses a button).
       */
      forceEndpoint: () => {
        if (ws.readyState !== WebSocket.OPEN) {
          throw new Error("Cannot force endpoint: WebSocket is not open")
        }

        const forceMsg: StreamingForceEndpoint = {
          type: "ForceEndpoint"
        }
        ws.send(JSON.stringify(forceMsg))
      }
    }
  }

  /**
   * Build WebSocket URL with all streaming parameters
   */
  private buildStreamingUrl(options?: StreamingOptions): string {
    const params = new URLSearchParams()
    const aaiOpts = options?.assemblyaiStreaming || {}

    // ─────────────────────────────────────────────────────────────────
    // Audio format parameters (required)
    // ─────────────────────────────────────────────────────────────────
    const sampleRate = options?.sampleRate || aaiOpts.sampleRate || 16000
    params.append("sample_rate", String(sampleRate))

    const encoding = options?.encoding
      ? mapEncodingToProvider(options.encoding, "assemblyai")
      : aaiOpts.encoding || "pcm_s16le"
    params.append("encoding", encoding)

    // ─────────────────────────────────────────────────────────────────
    // Model and language parameters
    // ─────────────────────────────────────────────────────────────────
    if (aaiOpts.speechModel) {
      params.append("speech_model", aaiOpts.speechModel)
    }
    if (aaiOpts.languageDetection) {
      params.append("language_detection", "true")
    }

    // ─────────────────────────────────────────────────────────────────
    // End-of-turn detection parameters
    // ─────────────────────────────────────────────────────────────────
    if (aaiOpts.endOfTurnConfidenceThreshold !== undefined) {
      params.append(
        "end_of_turn_confidence_threshold",
        String(aaiOpts.endOfTurnConfidenceThreshold)
      )
    }
    if (aaiOpts.minEndOfTurnSilenceWhenConfident !== undefined) {
      params.append(
        "min_end_of_turn_silence_when_confident",
        String(aaiOpts.minEndOfTurnSilenceWhenConfident)
      )
    }
    if (aaiOpts.maxTurnSilence !== undefined) {
      params.append("max_turn_silence", String(aaiOpts.maxTurnSilence))
    }

    // ─────────────────────────────────────────────────────────────────
    // VAD parameters
    // ─────────────────────────────────────────────────────────────────
    if (aaiOpts.vadThreshold !== undefined) {
      params.append("vad_threshold", String(aaiOpts.vadThreshold))
    }

    // ─────────────────────────────────────────────────────────────────
    // Transcription processing parameters
    // ─────────────────────────────────────────────────────────────────
    if (aaiOpts.formatTurns !== undefined) {
      params.append("format_turns", String(aaiOpts.formatTurns))
    }
    if (aaiOpts.filterProfanity) {
      params.append("filter_profanity", "true")
    }

    // ─────────────────────────────────────────────────────────────────
    // Custom vocabulary parameters
    // ─────────────────────────────────────────────────────────────────
    const keyterms = options?.customVocabulary || aaiOpts.keyterms
    if (keyterms && keyterms.length > 0) {
      keyterms.forEach((term) => params.append("keyterms", term))
    }
    if (aaiOpts.keytermsPrompt && aaiOpts.keytermsPrompt.length > 0) {
      aaiOpts.keytermsPrompt.forEach((prompt) => params.append("keyterms_prompt", prompt))
    }

    // ─────────────────────────────────────────────────────────────────
    // Session configuration
    // ─────────────────────────────────────────────────────────────────
    if (aaiOpts.inactivityTimeout !== undefined) {
      params.append("inactivity_timeout", String(aaiOpts.inactivityTimeout))
    }

    return `${this.wsBaseUrl}?${params.toString()}`
  }

  /**
   * Handle all WebSocket message types from AssemblyAI streaming
   */
  private handleWebSocketMessage(
    message: StreamingEventMessage,
    callbacks?: StreamingCallbacks
  ): void {
    // Check for error first (it doesn't have a 'type' field)
    if ("error" in message) {
      callbacks?.onError?.({
        code: "API_ERROR",
        message: (message as ErrorEvent).error
      })
      return
    }

    // Handle typed messages
    const typedMessage = message as BeginEvent | TurnEvent | TerminationEvent

    switch (typedMessage.type) {
      case "Begin": {
        const beginMsg = typedMessage as BeginEvent
        callbacks?.onMetadata?.({
          type: "begin",
          sessionId: beginMsg.id,
          expiresAt: new Date(beginMsg.expires_at).toISOString()
        })
        break
      }

      case "Turn": {
        const turnMsg = typedMessage as TurnEvent

        // Always send transcript event
        callbacks?.onTranscript?.({
          type: "transcript",
          text: turnMsg.transcript,
          isFinal: turnMsg.end_of_turn,
          confidence: turnMsg.end_of_turn_confidence,
          language: turnMsg.language_code,
          words: turnMsg.words.map((w: StreamingWord) => ({
            word: w.text,
            start: w.start / 1000, // Convert ms to seconds
            end: w.end / 1000,
            confidence: w.confidence
          })),
          data: turnMsg
        })

        // If end_of_turn, also send utterance event
        if (turnMsg.end_of_turn) {
          const words = turnMsg.words
          const start = words.length > 0 ? words[0].start / 1000 : 0
          const end = words.length > 0 ? words[words.length - 1].end / 1000 : 0

          callbacks?.onUtterance?.({
            text: turnMsg.transcript,
            start,
            end,
            confidence: turnMsg.end_of_turn_confidence,
            words: turnMsg.words.map((w: StreamingWord) => ({
              word: w.text,
              start: w.start / 1000,
              end: w.end / 1000,
              confidence: w.confidence
            }))
          })
        }
        break
      }

      case "Termination": {
        const termMsg = typedMessage as TerminationEvent
        callbacks?.onMetadata?.({
          type: "termination",
          audioDurationSeconds: termMsg.audio_duration_seconds,
          sessionDurationSeconds: termMsg.session_duration_seconds
        })
        break
      }

      default:
        // Unknown message type
        callbacks?.onMetadata?.(message as unknown as Record<string, unknown>)
        break
    }
  }
}

/**
 * Factory function to create an AssemblyAI adapter
 */
export function createAssemblyAIAdapter(config: ProviderConfig): AssemblyAIAdapter {
  const adapter = new AssemblyAIAdapter()
  adapter.initialize(config)
  return adapter
}
