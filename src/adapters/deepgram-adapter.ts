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
  UnifiedTranscriptResponse
} from "../router/types"
import { BaseAdapter, type ProviderConfig } from "./base-adapter"

// Import Deepgram generated types
import type { ListenV1Response } from "../generated/deepgram/schema/listenV1Response"
import type { ListenV1MediaTranscribeParams } from "../generated/deepgram/schema/listenV1MediaTranscribeParams"
import type { ListenV1ResponseResultsChannelsItemAlternativesItem } from "../generated/deepgram/schema/listenV1ResponseResultsChannelsItemAlternativesItem"
import type { ListenV1ResponseResultsChannelsItemAlternativesItemWordsItem } from "../generated/deepgram/schema/listenV1ResponseResultsChannelsItemAlternativesItemWordsItem"
import type { ListenV1ResponseResultsUtterancesItem } from "../generated/deepgram/schema/listenV1ResponseResultsUtterancesItem"

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
    piiRedaction: true
  }

  private client?: AxiosInstance
  private baseUrl = "https://api.deepgram.com/v1"
  private wsBaseUrl = "wss://api.deepgram.com/v1/listen"

  initialize(config: ProviderConfig): void {
    super.initialize(config)

    this.client = axios.create({
      baseURL: config.baseUrl || this.baseUrl,
      timeout: config.timeout || 60000,
      headers: {
        Authorization: `Token ${config.apiKey}`,
        "Content-Type": "application/json",
        ...config.headers
      }
    })
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
   * Note: Deepgram processes synchronously, so this method is primarily
   * for retrieving cached results if you've stored the request ID.
   * The initial transcribe() call already returns complete results.
   *
   * @param transcriptId - Request ID from Deepgram
   * @returns Normalized transcription response
   */
  async getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    // Deepgram doesn't have a "get by ID" endpoint for pre-recorded audio
    // Results are returned immediately on transcription
    return {
      success: false,
      provider: this.name,
      error: {
        code: "NOT_SUPPORTED",
        message:
          "Deepgram returns transcription results immediately. Store the response from transcribe() instead of using getTranscript()."
      }
    }
  }

  /**
   * Build Deepgram transcription parameters from unified options
   */
  private buildTranscriptionParams(options?: TranscribeOptions): ListenV1MediaTranscribeParams {
    const params: ListenV1MediaTranscribeParams = {}

    if (!options) {
      return params
    }

    // Language configuration
    if (options.language) {
      params.language = options.language as any
    }

    if (options.languageDetection) {
      params.detect_language = true
    }

    // Speaker diarization
    if (options.diarization) {
      params.diarize = true
    }

    // Custom vocabulary (keywords in Deepgram)
    if (options.customVocabulary && options.customVocabulary.length > 0) {
      params.keywords = options.customVocabulary as any
    }

    // Summarization
    if (options.summarization) {
      params.summarize = true as any
    }

    // Sentiment analysis
    if (options.sentimentAnalysis) {
      params.sentiment = true
    }

    // Entity detection
    if (options.entityDetection) {
      params.detect_entities = true
    }

    // PII redaction
    if (options.piiRedaction) {
      params.redact = true as any
    }

    // Webhook callback
    if (options.webhookUrl) {
      params.callback = options.webhookUrl
    }

    // Enable features for better results
    params.punctuate = true // Add punctuation
    params.utterances = true // Enable utterances for speaker diarization
    params.smart_format = true as any // Smart formatting

    return params
  }

  /**
   * Normalize Deepgram response to unified format
   */
  private normalizeResponse(response: ListenV1Response): UnifiedTranscriptResponse {
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
        summary: this.extractSummary(alternative),
        metadata: {
          modelInfo: response.metadata?.model_info,
          channels: response.metadata?.channels,
          sentiment: response.results.sentiments,
          intents: response.results.intents,
          topics: response.results.topics
        }
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
      (word: ListenV1ResponseResultsChannelsItemAlternativesItemWordsItem) => ({
        text: word.word || "",
        start: word.start || 0,
        end: word.end || 0,
        confidence: word.confidence,
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
      words: utterance.words?.map((word) => ({
        text: word.word || "",
        start: word.start || 0,
        end: word.end || 0,
        confidence: word.confidence
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
   * @param options - Streaming configuration options
   * @param callbacks - Event callbacks for transcription results
   * @returns Promise that resolves with a StreamingSession
   *
   * @example Real-time streaming
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

    // Build query parameters for WebSocket URL
    const params = new URLSearchParams()

    if (options?.encoding) params.append("encoding", options.encoding)
    if (options?.sampleRate) params.append("sample_rate", options.sampleRate.toString())
    if (options?.channels) params.append("channels", options.channels.toString())
    if (options?.language) params.append("language", options.language)
    if (options?.languageDetection) params.append("detect_language", "true")
    if (options?.diarization) params.append("diarize", "true")
    if (options?.interimResults) params.append("interim_results", "true")
    if (options?.summarization) params.append("summarize", "true")
    if (options?.sentimentAnalysis) params.append("sentiment", "true")
    if (options?.entityDetection) params.append("detect_entities", "true")
    if (options?.piiRedaction) params.append("redact", "pii")
    if (options?.customVocabulary && options.customVocabulary.length > 0) {
      params.append("keywords", options.customVocabulary.join(","))
    }

    const wsUrl = `${this.wsBaseUrl}?${params.toString()}`

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
        const message = JSON.parse(data.toString())

        // Handle different message types from Deepgram
        if (message.type === "Results") {
          const result = message
          const channel = result.channel?.alternatives?.[0]

          if (channel) {
            const transcript = channel.transcript || ""
            const isFinal = message.is_final === true
            const words = channel.words?.map((word: any) => ({
              text: word.word || "",
              start: word.start || 0,
              end: word.end || 0,
              confidence: word.confidence
            }))

            callbacks?.onTranscript?.({
              type: "transcript",
              text: transcript,
              isFinal,
              words,
              confidence: channel.confidence,
              data: result
            })
          }
        } else if (message.type === "UtteranceEnd") {
          // Utterance completed
          callbacks?.onMetadata?.(message)
        } else if (message.type === "Metadata") {
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
}

/**
 * Factory function to create a Deepgram adapter
 */
export function createDeepgramAdapter(config: ProviderConfig): DeepgramAdapter {
  const adapter = new DeepgramAdapter()
  adapter.initialize(config)
  return adapter
}
