/**
 * Gladia transcription provider adapter
 * Documentation: https://docs.gladia.io/
 */

import axios from "axios"
import WebSocket from "ws"
import type {
  AudioChunk,
  AudioInput,
  ProviderCapabilities,
  StreamingCallbacks,
  StreamingOptions,
  StreamingSession,
  TranscribeOptions,
  UnifiedTranscriptResponse
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
  streamingControllerInitStreamingSessionV2,
  streamingControllerDeleteStreamingJobV2
} from "../generated/gladia/api/gladiaControlAPI"

// Import Gladia generated types
import type { InitTranscriptionRequest } from "../generated/gladia/schema/initTranscriptionRequest"
import type { PreRecordedResponse } from "../generated/gladia/schema/preRecordedResponse"
import type { StreamingRequest } from "../generated/gladia/schema/streamingRequest"
import type { TranscriptionDTO } from "../generated/gladia/schema/transcriptionDTO"
import type { UtteranceDTO } from "../generated/gladia/schema/utteranceDTO"
import type { WordDTO } from "../generated/gladia/schema/wordDTO"
// WebSocket message types for type-safe parsing
import type { TranscriptMessage } from "../generated/gladia/schema/transcriptMessage"
// Import Gladia's supported values from OpenAPI-generated schema (type safety!)
import { StreamingSupportedSampleRateEnum } from "../generated/gladia/schema/streamingSupportedSampleRateEnum"
import type { StreamingSupportedEncodingEnum } from "../generated/gladia/schema/streamingSupportedEncodingEnum"
import type { StreamingSupportedModels } from "../generated/gladia/schema/streamingSupportedModels"
import type { TranscriptionLanguageCodeEnum } from "../generated/gladia/schema/transcriptionLanguageCodeEnum"

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
    piiRedaction: false // Gladia doesn't have PII redaction in their API
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

    const request: InitTranscriptionRequest = {
      audio_url: audioUrl
    }

    // Map options to Gladia format
    if (options) {
      // Language configuration
      if (options.language || options.languageDetection) {
        request.language_config = {
          languages: options.language
            ? [options.language as TranscriptionLanguageCodeEnum]
            : undefined,
          code_switching: options.languageDetection
        }
      }

      // Diarization (speaker recognition)
      if (options.diarization) {
        request.diarization = true
        if (options.speakersExpected) {
          request.diarization_config = {
            number_of_speakers: options.speakersExpected
          }
        }
      }

      // Custom vocabulary
      if (options.customVocabulary && options.customVocabulary.length > 0) {
        request.custom_vocabulary = true
        request.custom_vocabulary_config = {
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
          url: options.webhookUrl
        }
      }

      // Custom metadata
      if (options.metadata) {
        request.custom_metadata = options.metadata
      }
    }

    return request
  }

  /**
   * Normalize Gladia response to unified format
   */
  private normalizeResponse(response: PreRecordedResponse): UnifiedTranscriptResponse {
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
          requestParams: response.request_params,
          customMetadata: response.custom_metadata
        },
        createdAt: response.created_at,
        completedAt: response.completed_at || undefined
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
      text: item.word.word,
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
      words: utterance.words.map((word: WordDTO) => ({
        text: word.word,
        start: word.start,
        end: word.end,
        confidence: word.confidence
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
   * Stream audio for real-time transcription
   *
   * Creates a WebSocket connection to Gladia for streaming transcription.
   * First initializes a session via REST API, then connects to WebSocket.
   *
   * @param options - Streaming configuration options
   * @param callbacks - Event callbacks for transcription results
   * @returns Promise that resolves with a StreamingSession
   *
   * @example Real-time streaming
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
   * const audioChunk = getAudioChunk(); // Your audio source
   * await session.sendAudio({ data: audioChunk });
   *
   * // Close when done
   * await session.close();
   * ```
   */
  async transcribeStream(
    options?: StreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession> {
    this.validateConfig()

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

    // Build typed streaming request using OpenAPI-generated types
    const streamingRequest: Partial<StreamingRequest> = {
      encoding: options?.encoding
        ? (mapEncodingToProvider(options.encoding, "gladia") as StreamingSupportedEncodingEnum)
        : undefined,
      sample_rate: validatedSampleRate,
      channels: options?.channels,
      endpointing: options?.endpointing,
      model: options?.model as StreamingSupportedModels
    }

    if (options?.language) {
      streamingRequest.language_config = {
        languages: [options.language as TranscriptionLanguageCodeEnum]
      }
    }

    // Use generated API client function - FULLY TYPED!
    const initResponse = await streamingControllerInitStreamingSessionV2(
      streamingRequest as StreamingRequest,
      undefined, // no params
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

    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString())

        // Handle different message types from Gladia
        if (message.type === "transcript") {
          // Type-safe: cast to TranscriptMessage after checking type
          const transcriptMessage = message as TranscriptMessage
          const messageData = transcriptMessage.data
          const utterance = messageData.utterance

          callbacks?.onTranscript?.({
            type: "transcript",
            text: utterance.text,
            isFinal: messageData.is_final,
            confidence: utterance.confidence,
            words: utterance.words.map((word) => ({
              text: word.word,
              start: word.start,
              end: word.end,
              confidence: word.confidence
            })),
            data: message
          })
        } else if (message.type === "utterance") {
          // Utterance completed - extract from nested data.utterance structure
          const transcriptMessage = message as TranscriptMessage
          const messageData = transcriptMessage.data
          const utterance = messageData.utterance

          const utteranceData = {
            text: utterance.text,
            start: utterance.start,
            end: utterance.end,
            speaker: utterance.speaker?.toString(),
            confidence: utterance.confidence,
            words: utterance.words.map((word) => ({
              text: word.word,
              start: word.start,
              end: word.end,
              confidence: word.confidence
            }))
          }
          callbacks?.onUtterance?.(utteranceData)
        } else if (message.type === "metadata") {
          callbacks?.onMetadata?.(message)
        }
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
}

/**
 * Factory function to create a Gladia adapter
 */
export function createGladiaAdapter(config: ProviderConfig): GladiaAdapter {
  const adapter = new GladiaAdapter()
  adapter.initialize(config)
  return adapter
}
