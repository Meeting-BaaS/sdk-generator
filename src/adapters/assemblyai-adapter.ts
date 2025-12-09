/**
 * AssemblyAI transcription provider adapter
 * Documentation: https://www.assemblyai.com/docs
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

// Import AssemblyAI generated types
import type { Transcript } from "../generated/assemblyai/schema/transcript"
import type { TranscriptParams } from "../generated/assemblyai/schema/transcriptParams"
import type { TranscriptStatus } from "../generated/assemblyai/schema/transcriptStatus"
import type { TranscriptWord } from "../generated/assemblyai/schema/transcriptWord"
import type { TranscriptUtterance } from "../generated/assemblyai/schema/transcriptUtterance"

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
    piiRedaction: true
  }

  private client?: AxiosInstance
  private baseUrl = "https://api.assemblyai.com/v2"
  private wsBaseUrl = "wss://api.assemblyai.com/v2/realtime/ws"

  initialize(config: ProviderConfig): void {
    super.initialize(config)

    this.client = axios.create({
      baseURL: config.baseUrl || this.baseUrl,
      timeout: config.timeout || 60000,
      headers: {
        authorization: config.apiKey,
        "Content-Type": "application/json",
        ...config.headers
      }
    })
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
      // Prepare the request payload
      const payload = this.buildTranscriptionRequest(audio, options)

      // Submit transcription job
      const response = await this.client!.post<Transcript>("/transcript", payload)

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
      const response = await this.client!.get<Transcript>(`/transcript/${transcriptId}`)

      return this.normalizeResponse(response.data)
    } catch (error) {
      return this.createErrorResponse(error)
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

    const request: TranscriptParams = {
      audio_url: audioUrl
    }

    // Map options to AssemblyAI format
    if (options) {
      // Language configuration
      if (options.language) {
        // Convert ISO codes to AssemblyAI format (e.g., 'en' -> 'en_us')
        const languageCode = options.language.includes("_")
          ? options.language
          : `${options.language}_us`
        request.language_code = languageCode as any
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
        request.boost_param = "high" // default to high boost
      }

      // Summarization
      if (options.summarization) {
        request.summarization = true
        request.summary_model = "informative"
        request.summary_type = "bullets"
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

      // Enable word timestamps by default (AssemblyAI includes them automatically)
      // Enable punctuation and formatting for better results
      request.punctuate = true
      request.format_text = true
    }

    return request
  }

  /**
   * Normalize AssemblyAI response to unified format
   */
  private normalizeResponse(response: Transcript): UnifiedTranscriptResponse {
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
        duration: response.audio_duration ? response.audio_duration / 1000 : undefined, // Convert ms to seconds
        speakers: this.extractSpeakers(response),
        words: this.extractWords(response),
        utterances: this.extractUtterances(response),
        summary: response.summary || undefined,
        metadata: {
          audioUrl: response.audio_url,
          entities: response.entities,
          sentimentAnalysis: response.sentiment_analysis_results,
          contentModeration: response.content_safety_labels
        }
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

    return transcript.words.map((word: TranscriptWord) => ({
      text: word.text,
      start: word.start / 1000, // Convert ms to seconds
      end: word.end / 1000, // Convert ms to seconds
      confidence: word.confidence,
      speaker: word.speaker || undefined
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
      words: utterance.words.map((word: TranscriptWord) => ({
        text: word.text,
        start: word.start / 1000,
        end: word.end / 1000,
        confidence: word.confidence
      }))
    }))
  }

  /**
   * Poll for transcription completion
   */
  private async pollForCompletion(
    transcriptId: string,
    maxAttempts = 60,
    intervalMs = 3000
  ): Promise<UnifiedTranscriptResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.getTranscript(transcriptId)

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
   * Creates a WebSocket connection to AssemblyAI for streaming transcription.
   * First obtains a temporary token, then connects and streams audio chunks.
   *
   * @param options - Streaming configuration options
   * @param callbacks - Event callbacks for transcription results
   * @returns Promise that resolves with a StreamingSession
   *
   * @example Real-time streaming
   * ```typescript
   * const session = await adapter.transcribeStream({
   *   encoding: 'pcm_s16le',
   *   sampleRate: 16000,
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

    // Step 1: Get temporary token for real-time API
    const tokenResponse = await this.client!.post("/realtime/token", {
      expires_in: 3600 // Token expires in 1 hour
    })

    const token = tokenResponse.data.token

    // Step 2: Build WebSocket URL with token
    const wsUrl = `${this.wsBaseUrl}?sample_rate=${options?.sampleRate || 16000}&token=${token}`

    // Step 3: Create WebSocket connection
    const ws = new WebSocket(wsUrl)

    let sessionStatus: "connecting" | "open" | "closing" | "closed" = "connecting"
    const sessionId = `assemblyai-${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Handle WebSocket events
    ws.on("open", () => {
      sessionStatus = "open"
      callbacks?.onOpen?.()
    })

    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString())

        // Handle different message types from AssemblyAI
        if (message.message_type === "SessionBegins") {
          // Session started
          callbacks?.onMetadata?.({
            sessionId: message.session_id,
            expiresAt: message.expires_at
          })
        } else if (message.message_type === "PartialTranscript") {
          // Interim result
          callbacks?.onTranscript?.({
            type: "transcript",
            text: message.text || "",
            isFinal: false,
            confidence: message.confidence,
            words: message.words?.map((word: any) => ({
              text: word.text,
              start: word.start / 1000,
              end: word.end / 1000,
              confidence: word.confidence
            })),
            data: message
          })
        } else if (message.message_type === "FinalTranscript") {
          // Final result
          callbacks?.onTranscript?.({
            type: "transcript",
            text: message.text || "",
            isFinal: true,
            confidence: message.confidence,
            words: message.words?.map((word: any) => ({
              text: word.text,
              start: word.start / 1000,
              end: word.end / 1000,
              confidence: word.confidence
            })),
            data: message
          })
        } else if (message.message_type === "SessionTerminated") {
          // Session ended by server
          callbacks?.onMetadata?.({ terminated: true })
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

        // AssemblyAI expects base64-encoded audio data
        const base64Audio = chunk.data.toString("base64")

        // Send audio data as JSON message
        ws.send(
          JSON.stringify({
            audio_data: base64Audio
          })
        )

        // Send termination message if this is the last chunk
        if (chunk.isLast) {
          ws.send(
            JSON.stringify({
              terminate_session: true
            })
          )
        }
      },
      close: async () => {
        if (sessionStatus === "closed" || sessionStatus === "closing") {
          return
        }

        sessionStatus = "closing"

        // Send termination message before closing
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              terminate_session: true
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
 * Factory function to create an AssemblyAI adapter
 */
export function createAssemblyAIAdapter(config: ProviderConfig): AssemblyAIAdapter {
  const adapter = new AssemblyAIAdapter()
  adapter.initialize(config)
  return adapter
}
