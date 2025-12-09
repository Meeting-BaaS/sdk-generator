/**
 * Gladia transcription provider adapter
 * Documentation: https://docs.gladia.io/
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
  UnifiedTranscriptResponse
} from "../router/types"
import { BaseAdapter, type ProviderConfig } from "./base-adapter"

// Import Gladia generated types
import type { InitPreRecordedTranscriptionResponse } from "../generated/gladia/schema/initPreRecordedTranscriptionResponse"
import type { InitStreamingResponse } from "../generated/gladia/schema/initStreamingResponse"
import type { InitTranscriptionRequest } from "../generated/gladia/schema/initTranscriptionRequest"
import type { PreRecordedResponse } from "../generated/gladia/schema/preRecordedResponse"
import type { StreamingRequest } from "../generated/gladia/schema/streamingRequest"
import type { TranscriptionDTO } from "../generated/gladia/schema/transcriptionDTO"
import type { UtteranceDTO } from "../generated/gladia/schema/utteranceDTO"
import type { WordDTO } from "../generated/gladia/schema/wordDTO"

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

  private client?: AxiosInstance
  private baseUrl = "https://api.gladia.io/v2"

  initialize(config: ProviderConfig): void {
    super.initialize(config)

    this.client = axios.create({
      baseURL: config.baseUrl || this.baseUrl,
      timeout: config.timeout || 60000,
      headers: {
        "x-gladia-key": config.apiKey,
        "Content-Type": "application/json",
        ...config.headers
      }
    })
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
      // Prepare the request payload
      const payload = this.buildTranscriptionRequest(audio, options)

      // Submit transcription job
      const response = await this.client!.post<InitPreRecordedTranscriptionResponse>(
        "/transcription",
        payload
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
      const response = await this.client!.get<PreRecordedResponse>(`/transcription/${transcriptId}`)

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
          languages: options.language ? ([options.language] as any) : undefined,
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
          vocabulary: options.customVocabulary as any
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
    // Map Gladia status to unified status
    let status: "queued" | "processing" | "completed" | "error"
    switch (response.status) {
      case "queued":
        status = "queued"
        break
      case "processing":
        status = "processing"
        break
      case "done":
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
          code: response.error_code?.toString() || "TRANSCRIPTION_ERROR",
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
    if (!transcription?.utterances) {
      return undefined
    }

    // Gladia stores speakers in utterances - extract unique speakers
    const speakerSet = new Set<number>()
    transcription.utterances.forEach((utterance: UtteranceDTO) => {
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
   * Extract word timestamps from Gladia response
   */
  private extractWords(transcription: TranscriptionDTO | undefined) {
    if (!transcription?.utterances) {
      return undefined
    }

    // Flatten all words from all utterances
    const allWords = transcription.utterances.flatMap((utterance: UtteranceDTO) =>
      utterance.words.map((word: WordDTO) => ({
        text: word.word,
        start: word.start,
        end: word.end,
        confidence: word.confidence,
        speaker: utterance.speaker?.toString()
      }))
    )

    return allWords.length > 0 ? allWords : undefined
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
   * Poll for transcription completion
   */
  private async pollForCompletion(
    jobId: string,
    maxAttempts = 60,
    intervalMs = 2000
  ): Promise<UnifiedTranscriptResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.getTranscript(jobId)

      if (!result.success) {
        return result
      }

      const status = result.data?.status
      if (status === "completed") {
        return result
      }

      if (status === "error") {
        return {
          success: false,
          provider: this.name,
          error: {
            code: "TRANSCRIPTION_ERROR",
            message: "Transcription failed"
          },
          raw: result.raw
        }
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }

    // Timeout
    return {
      success: false,
      provider: this.name,
      error: {
        code: "POLLING_TIMEOUT",
        message: `Transcription did not complete after ${maxAttempts} attempts`
      }
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

    // Step 1: Initialize streaming session via REST API
    const streamingRequest: Partial<StreamingRequest> = {
      encoding: options?.encoding as any,
      sample_rate: options?.sampleRate as any,
      channels: options?.channels,
      endpointing: options?.endpointing
    }

    if (options?.language) {
      streamingRequest.language_config = {
        languages: [options.language as any]
      }
    }

    const initResponse = await this.client!.post<InitStreamingResponse>(
      "/streaming/init",
      streamingRequest
    )

    const { id, url: wsUrl } = initResponse.data

    // Step 2: Connect to WebSocket
    const ws = new WebSocket(wsUrl)

    let sessionStatus: "connecting" | "open" | "closing" | "closed" = "connecting"

    // Handle WebSocket events
    ws.on("open", () => {
      sessionStatus = "open"
      callbacks?.onOpen?.()
    })

    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString())

        // Handle different message types from Gladia
        if (message.type === "transcript") {
          // Transcript event
          callbacks?.onTranscript?.({
            type: "transcript",
            text: message.text || "",
            isFinal: message.is_final === true,
            confidence: message.confidence,
            words: message.words?.map((word: any) => ({
              text: word.word || word.text,
              start: word.start,
              end: word.end,
              confidence: word.confidence
            })),
            data: message
          })
        } else if (message.type === "utterance") {
          // Utterance completed
          const utterance = {
            text: message.text || "",
            start: message.start || 0,
            end: message.end || 0,
            speaker: message.speaker?.toString(),
            confidence: message.confidence,
            words: message.words?.map((word: any) => ({
              text: word.word || word.text,
              start: word.start,
              end: word.end,
              confidence: word.confidence
            }))
          }
          callbacks?.onUtterance?.(utterance)
        } else if (message.type === "metadata") {
          callbacks?.onMetadata?.(message)
        }
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
      id,
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
}

/**
 * Factory function to create a Gladia adapter
 */
export function createGladiaAdapter(config: ProviderConfig): GladiaAdapter {
  const adapter = new GladiaAdapter()
  adapter.initialize(config)
  return adapter
}
