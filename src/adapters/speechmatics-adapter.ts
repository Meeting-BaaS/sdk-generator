/**
 * Speechmatics transcription provider adapter
 * Documentation: https://docs.speechmatics.com/
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
  RawWebSocketMessage,
  Word
} from "../router/types"
import { BaseAdapter, type ProviderConfig } from "./base-adapter"
import {
  buildUtterancesFromWords,
  buildTextFromSpeechmaticsResults
} from "../utils/transcription-helpers"
import type { SpeechmaticsRegionType } from "../constants"
import type { RecognitionResult } from "../generated/speechmatics/schema/recognitionResult"

/**
 * Speechmatics-specific configuration options
 */
export interface SpeechmaticsConfig extends ProviderConfig {
  /**
   * Regional endpoint for data residency and latency optimization
   *
   * Available regions:
   * - `eu1` - Europe (default, all customers)
   * - `eu2` - Europe (enterprise only - HA/failover)
   * - `us1` - USA (all customers)
   * - `us2` - USA (enterprise only - HA/failover)
   * - `au1` - Australia (all customers)
   *
   * @see https://docs.speechmatics.com/get-started/authentication#supported-endpoints
   */
  region?: SpeechmaticsRegionType
}

// Import Speechmatics types from generated schema
import type { JobConfig } from "../generated/speechmatics/schema/jobConfig"
import type { CreateJobResponse } from "../generated/speechmatics/schema/createJobResponse"
import type { RetrieveJobResponse } from "../generated/speechmatics/schema/retrieveJobResponse"
import type { RetrieveTranscriptResponse } from "../generated/speechmatics/schema/retrieveTranscriptResponse"
import { NotificationConfigContentsItem } from "../generated/speechmatics/schema/notificationConfigContentsItem"
// Import generated enums/constants (avoid hardcoding values)
import { OperatingPoint } from "../generated/speechmatics/schema/operatingPoint"
import { TranscriptionConfigDiarization } from "../generated/speechmatics/schema/transcriptionConfigDiarization"
import { SummarizationConfigSummaryType } from "../generated/speechmatics/schema/summarizationConfigSummaryType"
import { SummarizationConfigSummaryLength } from "../generated/speechmatics/schema/summarizationConfigSummaryLength"
import { JobDetailsStatus } from "../generated/speechmatics/schema/jobDetailsStatus"

/**
 * Speechmatics transcription provider adapter
 *
 * Implements transcription for Speechmatics API with support for:
 * - Batch transcription (async processing)
 * - Speaker diarization
 * - Enhanced accuracy models
 * - Multi-language support
 * - Sentiment analysis
 * - Summarization
 * - Custom vocabulary
 *
 * Types are generated from the Speechmatics SDK batch spec.
 * @see src/generated/speechmatics/schema for type definitions
 *
 * @see https://docs.speechmatics.com/ Speechmatics Documentation
 * @see https://docs.speechmatics.com/introduction/batch-guide Batch API Guide
 *
 * @example Basic transcription
 * ```typescript
 * import { SpeechmaticsAdapter } from '@meeting-baas/sdk';
 *
 * const adapter = new SpeechmaticsAdapter();
 * adapter.initialize({
 *   apiKey: process.env.SPEECHMATICS_API_KEY
 * });
 *
 * const result = await adapter.transcribe({
 *   type: 'url',
 *   url: 'https://example.com/audio.mp3'
 * }, {
 *   language: 'en'
 * });
 *
 * console.log(result.data.text);
 * ```
 *
 * @example With regional endpoint (US)
 * ```typescript
 * import { SpeechmaticsAdapter, SpeechmaticsRegion } from '@meeting-baas/sdk';
 *
 * const adapter = new SpeechmaticsAdapter();
 * adapter.initialize({
 *   apiKey: process.env.SPEECHMATICS_API_KEY,
 *   region: SpeechmaticsRegion.us1  // USA endpoint
 * });
 * ```
 *
 * @example With enhanced accuracy and diarization
 * ```typescript
 * const result = await adapter.transcribe({
 *   type: 'url',
 *   url: 'https://example.com/meeting.mp3'
 * }, {
 *   language: 'en',
 *   diarization: true,
 *   metadata: {
 *     operating_point: 'enhanced'  // Higher accuracy model
 *   }
 * });
 *
 * console.log('Speakers:', result.data.speakers);
 * console.log('Utterances:', result.data.utterances);
 * ```
 *
 * @example Async with polling
 * ```typescript
 * // Submit transcription
 * const submission = await adapter.transcribe({
 *   type: 'url',
 *   url: 'https://example.com/audio.mp3'
 * }, {
 *   language: 'en',
 *   summarization: true
 * });
 *
 * const jobId = submission.data?.id;
 * console.log('Job ID:', jobId);
 *
 * // Poll for completion
 * const poll = async () => {
 *   const status = await adapter.getTranscript(jobId);
 *   if (status.data?.status === 'completed') {
 *     console.log('Transcript:', status.data.text);
 *     console.log('Summary:', status.data.summary);
 *   } else if (status.data?.status === 'processing') {
 *     setTimeout(poll, 3000);
 *   }
 * };
 * await poll();
 * ```
 */
export class SpeechmaticsAdapter extends BaseAdapter {
  readonly name = "speechmatics" as const
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    diarization: true,
    wordTimestamps: true,
    languageDetection: false,
    customVocabulary: true,
    summarization: true,
    sentimentAnalysis: true,
    entityDetection: true,
    piiRedaction: false,
    listTranscripts: true,
    deleteTranscript: true
  }

  private client?: AxiosInstance
  protected baseUrl = "https://eu1.asr.api.speechmatics.com/v2"

  /**
   * Build base URL from region
   *
   * @param region - Regional endpoint identifier
   * @returns Full base URL for the API
   */
  private getRegionalBaseUrl(region?: SpeechmaticsRegionType): string {
    // Default to eu1 if no region specified
    const regionPrefix = region || "eu1"
    return `https://${regionPrefix}.asr.api.speechmatics.com/v2`
  }

  initialize(config: SpeechmaticsConfig): void {
    super.initialize(config)

    // Use explicit baseUrl if provided, otherwise derive from region
    this.baseUrl = config.baseUrl || this.getRegionalBaseUrl(config.region)

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 120000,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        ...config.headers
      }
    })
  }

  /**
   * Change the regional endpoint dynamically
   *
   * Useful for testing different regions or switching based on user location.
   * Preserves all other configuration (apiKey, timeout, headers).
   *
   * @param region - New regional endpoint to use
   *
   * @example Switch to US region
   * ```typescript
   * import { SpeechmaticsRegion } from 'voice-router-dev/constants'
   *
   * // Test EU endpoint
   * adapter.setRegion(SpeechmaticsRegion.eu1)
   * await adapter.transcribe(audio)
   *
   * // Switch to US for comparison
   * adapter.setRegion(SpeechmaticsRegion.us1)
   * await adapter.transcribe(audio)
   * ```
   */
  setRegion(region: SpeechmaticsRegionType): void {
    this.validateConfig()

    this.baseUrl = this.getRegionalBaseUrl(region)

    // Recreate client with new base URL but preserve existing config
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.config!.timeout || 120000,
      headers: {
        Authorization: `Bearer ${this.config!.apiKey}`,
        ...this.config!.headers
      }
    })
  }

  /**
   * Get the current regional endpoint being used
   *
   * @returns The current base URL
   */
  getRegion(): string {
    return this.baseUrl
  }

  /**
   * Submit audio for transcription
   *
   * Speechmatics uses async batch processing. Returns a job ID immediately.
   * Poll getTranscript() to retrieve results.
   *
   * @param audio - Audio input (URL or file)
   * @param options - Transcription options
   * @returns Job submission response with ID for polling
   */
  async transcribe(
    audio: AudioInput,
    options?: TranscribeOptions
  ): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      // Build job config
      // Model maps to operating_point from generated OperatingPoint enum
      const operatingPoint = (options?.model as OperatingPoint) || OperatingPoint.standard

      const jobConfig: JobConfig = {
        type: "transcription",
        transcription_config: {
          language: options?.language || "en",
          operating_point: operatingPoint
        }
      }

      // Add diarization if requested
      if (options?.diarization) {
        jobConfig.transcription_config!.diarization = TranscriptionConfigDiarization.speaker
        // Speaker sensitivity can be set via metadata if needed
        if (options.speakersExpected) {
          jobConfig.transcription_config!.speaker_diarization_config = {
            // Higher sensitivity = more speakers detected
            speaker_sensitivity: Math.min(1, options.speakersExpected / 10)
          }
        }
      }

      // Add sentiment analysis (at job level, not transcription_config)
      if (options?.sentimentAnalysis) {
        jobConfig.sentiment_analysis_config = {}
      }

      // Add summarization (at job level, not transcription_config)
      if (options?.summarization) {
        jobConfig.summarization_config = {
          summary_type: SummarizationConfigSummaryType.bullets,
          summary_length: SummarizationConfigSummaryLength.brief
        }
      }

      // Add custom vocabulary
      if (options?.customVocabulary && options.customVocabulary.length > 0) {
        // Convert string array to TranscriptionConfigAdditionalVocabItem format
        jobConfig.transcription_config!.additional_vocab = options.customVocabulary.map((word) => ({
          content: word
        }))
      }

      // Wire webhook callback (per-job notification)
      if (options?.webhookUrl) {
        jobConfig.notification_config = [
          {
            url: options.webhookUrl,
            contents: [NotificationConfigContentsItem.transcript]
          }
        ]
      }

      // Handle audio input
      let requestBody: FormData | Record<string, any>
      let headers: Record<string, string> = {}

      if (audio.type === "url") {
        // Use fetch_data for URL input — still requires multipart/form-data
        jobConfig.fetch_data = {
          url: audio.url
        }
        const formData = new FormData()
        formData.append("config", JSON.stringify(jobConfig))
        requestBody = formData
        headers = { "Content-Type": "multipart/form-data" }
      } else if (audio.type === "file") {
        // Upload file directly with multipart form
        const formData = new FormData()
        formData.append("config", JSON.stringify(jobConfig))
        const audioBlob =
          audio.file instanceof Blob
            ? audio.file
            : new Blob([audio.file], { type: audio.mimeType || "audio/wav" })
        formData.append("data_file", audioBlob, audio.filename || "audio.wav")
        requestBody = formData
        headers = { "Content-Type": "multipart/form-data" }
      } else {
        return {
          success: false,
          provider: this.name,
          error: {
            code: "INVALID_INPUT",
            message: "Speechmatics only supports URL and File audio input"
          }
        }
      }

      // Submit job
      const response = await this.client!.post<CreateJobResponse>("/jobs", requestBody, { headers })

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
   * Get transcription result by job ID
   *
   * Poll this method to check job status and retrieve completed transcription.
   *
   * @param transcriptId - Job ID from Speechmatics
   * @returns Transcription response with status and results
   */
  async getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      // Check job status first
      const statusResponse = await this.client!.get<RetrieveJobResponse>(`/jobs/${transcriptId}`)

      const status = this.normalizeStatus(statusResponse.data.job.status)

      if (status !== "completed") {
        return {
          success: true,
          provider: this.name,
          data: {
            id: transcriptId,
            text: "",
            status,
            createdAt: statusResponse.data.job.created_at
          },
          raw: statusResponse.data
        }
      }

      // Get transcript if completed
      const transcriptResponse = await this.client!.get<RetrieveTranscriptResponse>(
        `/jobs/${transcriptId}/transcript`
      )

      return this.normalizeResponse(transcriptResponse.data)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  /**
   * Delete a transcription job and its associated data
   *
   * Removes the job and all associated resources from Speechmatics' servers.
   * This action is irreversible.
   *
   * @param transcriptId - The job ID to delete
   * @param force - Force delete even if job is still running (default: false)
   * @returns Promise with success status
   *
   * @example Delete a completed job
   * ```typescript
   * const result = await adapter.deleteTranscript('job-abc123');
   * if (result.success) {
   *   console.log('Job deleted successfully');
   * }
   * ```
   *
   * @example Force delete a running job
   * ```typescript
   * const result = await adapter.deleteTranscript('job-abc123', true);
   * ```
   *
   * @see https://docs.speechmatics.com/
   */
  async deleteTranscript(
    transcriptId: string,
    force: boolean = false
  ): Promise<{ success: boolean }> {
    this.validateConfig()

    try {
      // Speechmatics DELETE /jobs/{jobid} with optional force parameter
      await this.client!.delete(`/jobs/${transcriptId}`, {
        params: force ? { force: true } : undefined
      })

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
   * Build WebSocket URL for real-time streaming
   *
   * Note: Real-time API uses a different host from the batch API:
   * - Batch: {region}.asr.api.speechmatics.com
   * - Real-time: {region}.rt.speechmatics.com
   *
   * @param region - Regional endpoint identifier
   * @returns WebSocket URL for real-time API
   */
  private getRegionalWsUrl(region?: SpeechmaticsRegionType): string {
    // Allow wsBaseUrl override from config
    if (this.config?.wsBaseUrl) {
      return this.config.wsBaseUrl
    }
    const regionPrefix = region || "eu1"
    return `wss://${regionPrefix}.rt.speechmatics.com/v2`
  }

  /**
   * Stream audio for real-time transcription via WebSocket
   *
   * Connects to Speechmatics' real-time API and sends audio chunks
   * for transcription with results returned via callbacks.
   *
   * @param options - Streaming configuration options
   * @param callbacks - Event callbacks for transcription results
   * @returns Promise that resolves with a StreamingSession
   *
   * @example Basic streaming
   * ```typescript
   * const session = await adapter.transcribeStream({
   *   language: 'en',
   *   speechmaticsStreaming: {
   *     enablePartials: true,
   *     operatingPoint: 'enhanced'
   *   }
   * }, {
   *   onTranscript: (event) => console.log(event.text),
   *   onUtterance: (utt) => console.log(`[${utt.speaker}]: ${utt.text}`),
   *   onError: (error) => console.error(error)
   * });
   *
   * await session.sendAudio({ data: audioBuffer });
   * await session.close();
   * ```
   */
  async transcribeStream(
    options?: StreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession> {
    this.validateConfig()

    const smOpts = options?.speechmaticsStreaming || {}
    const region = smOpts.region || (this.config as SpeechmaticsConfig)?.region
    const wsUrl = this.getRegionalWsUrl(region)

    // Create WebSocket connection with auth header
    const ws = new WebSocket(wsUrl, {
      headers: {
        Authorization: `Bearer ${this.config!.apiKey}`
      }
    })

    let sessionStatus: "connecting" | "open" | "closing" | "closed" = "connecting"
    const sessionId = `speechmatics-${Date.now()}-${Math.random().toString(36).substring(7)}`
    let seqNo = 0

    // Accumulate final transcript results between EndOfUtterance boundaries
    let utteranceResults: RecognitionResult[] = []

    // Wait for both WebSocket open AND RecognitionStarted before resolving
    const sessionReady = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("WebSocket connection timeout"))
      }, 10000)

      let wsOpen = false

      ws.once("error", (error) => {
        clearTimeout(timeout)
        reject(error)
      })

      ws.once("open", () => {
        wsOpen = true

        // Send StartRecognition message
        const encoding = smOpts.encoding || options?.encoding || "pcm_s16le"
        const sampleRate = smOpts.sampleRate || options?.sampleRate || 16000

        const startMsg: Record<string, unknown> = {
          message: "StartRecognition",
          audio_format: {
            type: "raw",
            encoding,
            sample_rate: sampleRate
          },
          transcription_config: {
            language: smOpts.language || (options?.language as string) || "en",
            enable_partials: smOpts.enablePartials ?? options?.interimResults ?? true
          }
        }

        const txConfig = startMsg.transcription_config as Record<string, unknown>

        // Optional transcription config fields
        if (smOpts.domain) txConfig.domain = smOpts.domain
        if (smOpts.operatingPoint) txConfig.operating_point = smOpts.operatingPoint
        if (smOpts.maxDelay !== undefined) txConfig.max_delay = smOpts.maxDelay
        if (smOpts.maxDelayMode) txConfig.max_delay_mode = smOpts.maxDelayMode
        if (smOpts.enableEntities !== undefined) txConfig.enable_entities = smOpts.enableEntities

        // Diarization
        if (smOpts.diarization === "speaker" || options?.diarization) {
          txConfig.diarization = "speaker"
          if (smOpts.maxSpeakers) {
            txConfig.speaker_diarization_config = {
              max_speakers: smOpts.maxSpeakers
            }
          } else if (options?.speakersExpected) {
            txConfig.speaker_diarization_config = {
              max_speakers: options.speakersExpected
            }
          }
        }

        // Custom vocabulary
        if (smOpts.additionalVocab && smOpts.additionalVocab.length > 0) {
          txConfig.additional_vocab = smOpts.additionalVocab.map((word) => ({
            content: word
          }))
        } else if (options?.customVocabulary && options.customVocabulary.length > 0) {
          txConfig.additional_vocab = options.customVocabulary.map((word) => ({
            content: word
          }))
        }

        // Conversation config (VAD/end-of-utterance)
        if (smOpts.conversationConfig) {
          txConfig.conversation_config = {
            end_of_utterance_silence_trigger:
              smOpts.conversationConfig.endOfUtteranceSilenceTrigger
          }
        }

        const startPayload = JSON.stringify(startMsg)

        // Capture outgoing StartRecognition
        if (callbacks?.onRawMessage) {
          callbacks.onRawMessage({
            provider: "speechmatics",
            direction: "outgoing",
            timestamp: Date.now(),
            payload: startPayload,
            messageType: "StartRecognition"
          })
        }

        ws.send(startPayload)
      })

      // Listen for all messages to find RecognitionStarted
      const onMessage = (data: Buffer) => {
        const rawPayload = data.toString()
        try {
          const msg = JSON.parse(rawPayload)
          if (msg.message === "RecognitionStarted") {
            clearTimeout(timeout)
            // Remove this temp listener — the main handler takes over
            ws.removeListener("message", onMessage)
            // Re-emit so the main handler also sees it
            ws.emit("message", data)
            resolve()
          } else if (msg.message === "Error") {
            clearTimeout(timeout)
            ws.removeListener("message", onMessage)
            reject(new Error(msg.reason || "Recognition failed to start"))
          }
        } catch {
          // Ignore parse errors during handshake
        }
      }
      ws.on("message", onMessage)
    })

    // Set up main message handler
    ws.on("message", (data: Buffer) => {
      const rawPayload = data.toString()

      try {
        const message = JSON.parse(rawPayload) as SpeechmaticsRealtimeMessage

        // Capture raw message
        if (callbacks?.onRawMessage) {
          callbacks.onRawMessage({
            provider: "speechmatics",
            direction: "incoming",
            timestamp: Date.now(),
            payload: rawPayload,
            messageType: message.message
          })
        }

        this.handleStreamingMessage(message, callbacks, utteranceResults)
      } catch (error) {
        if (callbacks?.onRawMessage) {
          callbacks.onRawMessage({
            provider: "speechmatics",
            direction: "incoming",
            timestamp: Date.now(),
            payload: rawPayload,
            messageType: "parse_error"
          })
        }

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

    // Wait for RecognitionStarted
    await sessionReady

    sessionStatus = "open"
    callbacks?.onOpen?.()

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

        // Capture outgoing audio
        if (callbacks?.onRawMessage) {
          const audioPayload =
            chunk.data instanceof ArrayBuffer
              ? chunk.data
              : (chunk.data.buffer.slice(
                  chunk.data.byteOffset,
                  chunk.data.byteOffset + chunk.data.byteLength
                ) as ArrayBuffer)
          callbacks.onRawMessage({
            provider: this.name,
            direction: "outgoing",
            timestamp: Date.now(),
            payload: audioPayload,
            messageType: "audio"
          })
        }

        // Send binary audio data
        ws.send(chunk.data)
        seqNo++

        // If last chunk, send EndOfStream
        if (chunk.isLast) {
          const endMsg = JSON.stringify({
            message: "EndOfStream",
            last_seq_no: seqNo
          })

          if (callbacks?.onRawMessage) {
            callbacks.onRawMessage({
              provider: this.name,
              direction: "outgoing",
              timestamp: Date.now(),
              payload: endMsg,
              messageType: "EndOfStream"
            })
          }

          ws.send(endMsg)
        }
      },
      close: async () => {
        if (sessionStatus === "closed" || sessionStatus === "closing") {
          return
        }

        sessionStatus = "closing"

        // Send EndOfStream if connection is still open
        if (ws.readyState === WebSocket.OPEN) {
          seqNo++
          ws.send(
            JSON.stringify({
              message: "EndOfStream",
              last_seq_no: seqNo
            })
          )
        }

        // Wait for EndOfTranscript or timeout
        return new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            ws.terminate()
            sessionStatus = "closed"
            resolve()
          }, 5000)

          // Listen for EndOfTranscript before closing
          const onMsg = (data: Buffer) => {
            try {
              const msg = JSON.parse(data.toString())
              if (msg.message === "EndOfTranscript") {
                ws.removeListener("message", onMsg)
                clearTimeout(timeout)
                ws.close()
              }
            } catch {
              // Ignore parse errors during close
            }
          }
          ws.on("message", onMsg)

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
   * Handle incoming Speechmatics real-time WebSocket messages
   */
  private handleStreamingMessage(
    message: SpeechmaticsRealtimeMessage,
    callbacks?: StreamingCallbacks,
    utteranceResults?: RecognitionResult[]
  ): void {
    switch (message.message) {
      case "RecognitionStarted": {
        // Already handled during session setup — no additional action
        break
      }

      case "AddPartialTranscript": {
        const results = (message as SpeechmaticsTranscriptMessage).results || []
        const text = buildTextFromSpeechmaticsResults(results)

        if (text) {
          callbacks?.onTranscript?.({
            type: "transcript",
            text,
            isFinal: false,
            words: this.extractWordsFromResults(results),
            data: message
          })
        }
        break
      }

      case "AddTranscript": {
        const results = (message as SpeechmaticsTranscriptMessage).results || []
        const text = buildTextFromSpeechmaticsResults(results)

        // Accumulate final results for utterance assembly
        if (utteranceResults) {
          utteranceResults.push(...results)
        }

        if (text) {
          callbacks?.onTranscript?.({
            type: "transcript",
            text,
            isFinal: true,
            words: this.extractWordsFromResults(results),
            data: message
          })
        }
        break
      }

      case "EndOfUtterance": {
        // Build utterance from accumulated final results
        if (utteranceResults && utteranceResults.length > 0) {
          const text = buildTextFromSpeechmaticsResults(utteranceResults)
          const words = this.extractWordsFromResults(utteranceResults)
          const utterances = buildUtterancesFromWords(words)

          if (utterances.length > 0) {
            for (const utt of utterances) {
              callbacks?.onUtterance?.(utt)
            }
          } else if (text) {
            // No speaker info — emit as single utterance
            callbacks?.onUtterance?.({
              text,
              start: words.length > 0 ? words[0].start : 0,
              end: words.length > 0 ? words[words.length - 1].end : 0,
              words
            })
          }

          // Reset accumulator
          utteranceResults.length = 0
        }
        break
      }

      case "AudioAdded": {
        // Internal bookkeeping — no user callback needed
        break
      }

      case "EndOfTranscript": {
        // Session ending — handled by close() logic
        break
      }

      case "Info":
      case "Warning": {
        callbacks?.onMetadata?.(message as unknown as Record<string, unknown>)
        break
      }

      case "Error": {
        const errMsg = message as SpeechmaticsErrorMessage
        callbacks?.onError?.({
          code: errMsg.type || "SPEECHMATICS_ERROR",
          message: errMsg.reason || "Unknown error",
          details: message
        })
        break
      }

      default: {
        // Unknown message type — pass to metadata handler
        callbacks?.onMetadata?.(message as unknown as Record<string, unknown>)
        break
      }
    }
  }

  /**
   * Extract unified Word[] from Speechmatics recognition results
   */
  private extractWordsFromResults(results: RecognitionResult[]): Word[] {
    return results
      .filter((r) => r.type === "word" && r.start_time !== undefined && r.end_time !== undefined)
      .map((result) => ({
        word: result.alternatives?.[0]?.content || "",
        start: result.start_time!,
        end: result.end_time!,
        confidence: result.alternatives?.[0]?.confidence,
        speaker: result.alternatives?.[0]?.speaker
      }))
  }

  /**
   * Normalize Speechmatics status to unified status
   * Uses generated JobDetailsStatus enum values
   */
  private normalizeStatus(status: string): "queued" | "processing" | "completed" | "error" {
    switch (status) {
      case JobDetailsStatus.running:
        return "processing"
      case JobDetailsStatus.done:
        return "completed"
      case JobDetailsStatus.rejected:
      case JobDetailsStatus.expired:
      case JobDetailsStatus.deleted:
        return "error"
      default:
        return "queued"
    }
  }

  /**
   * Normalize Speechmatics response to unified format
   */
  private normalizeResponse(response: RetrieveTranscriptResponse): UnifiedTranscriptResponse {
    // Build text preserving punctuation positions
    const text = buildTextFromSpeechmaticsResults(response.results)

    // Extract words with timestamps (filter out items without required timestamps)
    const words = response.results
      .filter((r) => r.type === "word" && r.start_time !== undefined && r.end_time !== undefined)
      .map((result) => ({
        word: result.alternatives?.[0]?.content || "",
        start: result.start_time!,
        end: result.end_time!,
        confidence: result.alternatives?.[0]?.confidence,
        speaker: result.alternatives?.[0]?.speaker
      }))

    // Extract speakers if diarization was enabled (from word results only)
    const speakerSet = new Set<string>()
    words.forEach((w) => {
      if (w.speaker) speakerSet.add(w.speaker)
    })

    const speakers =
      speakerSet.size > 0
        ? Array.from(speakerSet).map((id) => ({
            id,
            label: `Speaker ${id}`
          }))
        : undefined

    // Build utterances from speaker changes
    const utterances = buildUtterancesFromWords(words)

    return {
      success: true,
      provider: this.name,
      data: {
        id: response.job.id,
        text,
        status: "completed",
        language: response.metadata.transcription_config?.language,
        duration: response.job.duration,
        speakers,
        words: words.length > 0 ? words : undefined,
        utterances: utterances.length > 0 ? utterances : undefined,
        summary: response.summary?.content,
        createdAt: response.job.created_at
      },
      extended: {},
      tracking: {
        requestId: response.job.id
      },
      raw: response
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Speechmatics Real-time WebSocket Message Types
// ─────────────────────────────────────────────────────────────────────────────

/** Base message with message field */
interface SpeechmaticsBaseMessage {
  message: string
}

/** RecognitionStarted response */
interface SpeechmaticsRecognitionStartedMessage extends SpeechmaticsBaseMessage {
  message: "RecognitionStarted"
  id?: string
}

/** AddPartialTranscript / AddTranscript messages */
interface SpeechmaticsTranscriptMessage extends SpeechmaticsBaseMessage {
  message: "AddPartialTranscript" | "AddTranscript"
  results: RecognitionResult[]
  metadata?: {
    start_time?: number
    end_time?: number
    transcript?: string
  }
}

/** EndOfUtterance boundary marker */
interface SpeechmaticsEndOfUtteranceMessage extends SpeechmaticsBaseMessage {
  message: "EndOfUtterance"
}

/** AudioAdded acknowledgment */
interface SpeechmaticsAudioAddedMessage extends SpeechmaticsBaseMessage {
  message: "AudioAdded"
  seq_no?: number
}

/** EndOfTranscript (session complete) */
interface SpeechmaticsEndOfTranscriptMessage extends SpeechmaticsBaseMessage {
  message: "EndOfTranscript"
}

/** Info/Warning messages */
interface SpeechmaticsInfoMessage extends SpeechmaticsBaseMessage {
  message: "Info" | "Warning"
  type?: string
  reason?: string
  quality?: string
}

/** Error message */
interface SpeechmaticsErrorMessage extends SpeechmaticsBaseMessage {
  message: "Error"
  type?: string
  reason?: string
}

/** Union of all Speechmatics real-time messages */
type SpeechmaticsRealtimeMessage =
  | SpeechmaticsRecognitionStartedMessage
  | SpeechmaticsTranscriptMessage
  | SpeechmaticsEndOfUtteranceMessage
  | SpeechmaticsAudioAddedMessage
  | SpeechmaticsEndOfTranscriptMessage
  | SpeechmaticsInfoMessage
  | SpeechmaticsErrorMessage

/**
 * Factory function to create a Speechmatics adapter
 *
 * @example With region
 * ```typescript
 * import { createSpeechmaticsAdapter, SpeechmaticsRegion } from 'voice-router-dev'
 *
 * const adapter = createSpeechmaticsAdapter({
 *   apiKey: process.env.SPEECHMATICS_API_KEY,
 *   region: SpeechmaticsRegion.us1
 * })
 * ```
 */
export function createSpeechmaticsAdapter(config: SpeechmaticsConfig): SpeechmaticsAdapter {
  const adapter = new SpeechmaticsAdapter()
  adapter.initialize(config)
  return adapter
}
