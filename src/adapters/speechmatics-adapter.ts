/**
 * Speechmatics transcription provider adapter
 * Documentation: https://docs.speechmatics.com/
 */

import axios, { type AxiosInstance } from "axios"
import type {
  AudioInput,
  ProviderCapabilities,
  TranscribeOptions,
  UnifiedTranscriptResponse,
  StreamingOptions,
  StreamingCallbacks,
  StreamingSession,
  StreamEvent,
  Word,
  Utterance
} from "../router/types"
import { BaseAdapter, type ProviderConfig } from "./base-adapter"
import {
  buildUtterancesFromWords,
  buildTextFromSpeechmaticsResults
} from "../utils/transcription-helpers"
import type { SpeechmaticsRegionType } from "../constants"
import type {
  SpeechmaticsRealtimeMessage,
  AddPartialTranscript,
  AddTranscript,
  RecognitionStarted,
  Warning as SpeechmaticsWarning,
  Error as SpeechmaticsError
} from "../generated/speechmatics/streaming-message-types"
import type { RecognitionResult } from "../generated/speechmatics/schema/recognitionResult"
import type { TranscriptionConfig } from "../generated/speechmatics/schema/transcriptionConfig"
import type { TranscriptionConfigMaxDelayMode } from "../generated/speechmatics/schema/transcriptionConfigMaxDelayMode"

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
import type { PostJobsBody } from "../generated/speechmatics/schema/postJobsBody"

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
      let requestBody: PostJobsBody
      let headers: Record<string, string> = {}

      if (audio.type === "url") {
        // Use fetch_data for URL input (JSON request)
        jobConfig.fetch_data = {
          url: audio.url
        }
        requestBody = { config: JSON.stringify(jobConfig) }
        headers = { "Content-Type": "application/json" }
      } else if (audio.type === "file") {
        // Upload file directly with multipart form
        requestBody = {
          config: JSON.stringify(jobConfig),
          data_file: audio.file as Blob
        }
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
   * Get the regional WebSocket host for real-time streaming
   *
   * Speechmatics RT uses a different host pattern: {region}.rt.speechmatics.com
   */
  private getRegionalWsHost(region?: SpeechmaticsRegionType): string {
    const regionPrefix = region || "eu1"
    return `${regionPrefix}.rt.speechmatics.com`
  }

  /**
   * Stream audio for real-time transcription
   *
   * Creates a WebSocket connection to the Speechmatics Real-Time API.
   * Protocol: send StartRecognition config, then AddAudio binary frames,
   * receive AddPartialTranscript/AddTranscript/EndOfUtterance messages.
   *
   * @param options - Streaming configuration
   * @param callbacks - Event callbacks
   * @returns StreamingSession for sending audio and closing
   *
   * @see https://docs.speechmatics.com/rt-api-ref
   */
  async transcribeStream(
    options?: StreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession> {
    this.validateConfig()

    const sessionId = `speechmatics_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const createdAt = new Date()

    const smOpts = options?.speechmaticsStreaming
    const region = smOpts?.region || (this.config as SpeechmaticsConfig)?.region

    // Build WebSocket URL
    const wsBase =
      this.config?.wsBaseUrl ||
      (this.config?.baseUrl
        ? this.deriveWsUrl(this.config.baseUrl)
        : `wss://${this.getRegionalWsHost(region)}`)
    const wsUrl = `${wsBase}/v2`

    let status: "connecting" | "open" | "closing" | "closed" = "connecting"
    let recognitionStarted = false

    // Create WebSocket connection
    const WebSocketImpl = typeof WebSocket !== "undefined" ? WebSocket : require("ws")
    const ws: WebSocket = new WebSocketImpl(wsUrl)

    // Build typed StartRecognition message using generated TranscriptionConfig.
    // RT transcription_config extends batch TranscriptionConfig with enable_partials
    // and a wider speaker_diarization_config (includes max_speakers, RT-only field).
    const language = smOpts?.language || (options?.language as string) || "en"

    const transcriptionConfig: TranscriptionConfig & {
      enable_partials?: boolean
      speaker_diarization_config?: TranscriptionConfig["speaker_diarization_config"] & {
        max_speakers?: number
      }
    } = {
      language,
      enable_entities: smOpts?.enableEntities ?? options?.entityDetection ?? false,
      enable_partials: smOpts?.enablePartials ?? options?.interimResults !== false,
      operating_point: (smOpts?.operatingPoint as OperatingPoint) || OperatingPoint.enhanced,
      ...(smOpts?.maxDelay !== undefined && { max_delay: smOpts.maxDelay }),
      ...(smOpts?.maxDelayMode && {
        max_delay_mode: smOpts.maxDelayMode as TranscriptionConfigMaxDelayMode
      }),
      ...(smOpts?.domain && { domain: smOpts.domain }),
      ...((options?.diarization ||
        smOpts?.diarization === TranscriptionConfigDiarization.speaker) && {
        diarization: TranscriptionConfigDiarization.speaker,
        ...(smOpts?.maxSpeakers !== undefined && {
          speaker_diarization_config: { max_speakers: smOpts.maxSpeakers }
        })
      }),
      ...((options?.customVocabulary?.length || smOpts?.additionalVocab?.length) && {
        additional_vocab: (smOpts?.additionalVocab || options?.customVocabulary || []).map(
          (term) => ({ content: term })
        )
      })
    }

    const startRecognition = {
      message: "StartRecognition" as const,
      audio_format: {
        type: "raw" as const,
        encoding: smOpts?.encoding || ("pcm_s16le" as const),
        sample_rate: smOpts?.sampleRate || options?.sampleRate || 16000
      },
      transcription_config: transcriptionConfig,
      ...(smOpts?.conversationConfig && {
        conversation_config: {
          end_of_utterance_silence_trigger: smOpts.conversationConfig.endOfUtteranceSilenceTrigger
        }
      })
    }

    ws.onopen = () => {
      status = "open"
      // Send StartRecognition immediately on connect
      const msg = JSON.stringify(startRecognition)

      if (callbacks?.onRawMessage) {
        callbacks.onRawMessage({
          provider: this.name,
          direction: "outgoing",
          timestamp: Date.now(),
          payload: msg,
          messageType: "StartRecognition"
        })
      }

      ws.send(msg)
    }

    ws.onmessage = (event: MessageEvent) => {
      const rawPayload = typeof event.data === "string" ? event.data : event.data.toString()

      try {
        const data = JSON.parse(rawPayload) as SpeechmaticsRealtimeMessage
        const messageType = data.message

        // Raw message callback
        if (callbacks?.onRawMessage) {
          callbacks.onRawMessage({
            provider: this.name,
            direction: "incoming",
            timestamp: Date.now(),
            payload: rawPayload,
            messageType
          })
        }

        switch (messageType) {
          case "RecognitionStarted": {
            recognitionStarted = true
            callbacks?.onOpen?.()
            callbacks?.onMetadata?.({
              id: (data as RecognitionStarted).id,
              languagePackInfo: (data as RecognitionStarted).language_pack_info
            })
            break
          }

          case "AddPartialTranscript": {
            const partial = data as AddPartialTranscript
            const words = this.resultsToWords(partial.results)
            callbacks?.onTranscript?.({
              type: "transcript",
              text: partial.metadata.transcript,
              isFinal: false,
              words,
              speaker: words[0]?.speaker,
              confidence: partial.results[0]?.alternatives?.[0]?.confidence,
              channel: partial.channel ? parseInt(partial.channel) : undefined
            })
            break
          }

          case "AddTranscript": {
            const final = data as AddTranscript
            const words = this.resultsToWords(final.results)

            callbacks?.onTranscript?.({
              type: "transcript",
              text: final.metadata.transcript,
              isFinal: true,
              words,
              speaker: words[0]?.speaker,
              confidence: final.results[0]?.alternatives?.[0]?.confidence,
              channel: final.channel ? parseInt(final.channel) : undefined
            })

            // Build utterances from final transcript words
            if (options?.diarization || smOpts?.diarization === "speaker") {
              const utterances = buildUtterancesFromWords(words)
              for (const utterance of utterances) {
                callbacks?.onUtterance?.(utterance)
              }
            }
            break
          }

          case "EndOfUtterance": {
            // Speechmatics signals end-of-utterance separately
            // Already handled via AddTranscript isFinal=true above
            break
          }

          case "EndOfTranscript": {
            callbacks?.onClose?.(1000, "Transcription complete")
            break
          }

          case "Error": {
            const err = data as SpeechmaticsError
            callbacks?.onError?.({
              code: err.type || "SPEECHMATICS_ERROR",
              message: err.reason || "Unknown error"
            })
            break
          }

          case "Warning": {
            const warn = data as SpeechmaticsWarning
            callbacks?.onMetadata?.({
              warning: warn.type,
              reason: warn.reason
            })
            break
          }

          case "Info": {
            callbacks?.onMetadata?.(data as unknown as Record<string, unknown>)
            break
          }

          case "AudioAdded":
          case "ChannelAudioAdded":
            // Acknowledgments — no action needed
            break

          default:
            // Unknown message type — pass to metadata
            callbacks?.onMetadata?.(data as unknown as Record<string, unknown>)
            break
        }
      } catch (error) {
        callbacks?.onError?.({
          code: "PARSE_ERROR",
          message: `Failed to parse message: ${error}`
        })
      }
    }

    ws.onerror = () => {
      callbacks?.onError?.({
        code: "WEBSOCKET_ERROR",
        message: "WebSocket error occurred"
      })
    }

    ws.onclose = (event: CloseEvent) => {
      status = "closed"
      callbacks?.onClose?.(event.code, event.reason)
    }

    // Wait for WebSocket open + RecognitionStarted
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("WebSocket connection timeout"))
      }, 10000)

      const checkReady = () => {
        if (recognitionStarted) {
          clearTimeout(timeout)
          resolve()
        } else if (status === "closed") {
          clearTimeout(timeout)
          reject(new Error("WebSocket connection failed"))
        } else {
          setTimeout(checkReady, 100)
        }
      }
      checkReady()
    })

    return {
      id: sessionId,
      provider: this.name,
      createdAt,
      getStatus: () => status,
      sendAudio: async (chunk) => {
        if (status !== "open") {
          throw new Error("Session is not open")
        }

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

        ws.send(chunk.data)
      },
      close: async () => {
        if (status === "open") {
          status = "closing"
          const endMsg = JSON.stringify({ message: "EndOfStream", last_seq_no: 0 })

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
          // Don't close WebSocket immediately — wait for EndOfTranscript
          // The server will close the connection after sending EndOfTranscript
        }
      }
    }
  }

  /**
   * Convert Speechmatics RecognitionResult[] to unified Word[]
   */
  private resultsToWords(results: RecognitionResult[]): Word[] {
    return results
      .filter((r) => r.type === "word")
      .map((r) => ({
        word: r.alternatives?.[0]?.content || "",
        start: r.start_time,
        end: r.end_time,
        confidence: r.alternatives?.[0]?.confidence,
        speaker: r.alternatives?.[0]?.speaker
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
