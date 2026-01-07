/**
 * Speechmatics transcription provider adapter
 * Documentation: https://docs.speechmatics.com/
 */

import axios, { type AxiosInstance } from "axios"
import type {
  AudioInput,
  ProviderCapabilities,
  TranscribeOptions,
  UnifiedTranscriptResponse
} from "../router/types"
import { BaseAdapter, type ProviderConfig } from "./base-adapter"

// Import Speechmatics types (manual definitions - OpenAPI spec doesn't match actual API)
import type {
  JobConfig,
  JobSubmitResponse,
  JobDetailsResponse,
  TranscriptionResponse
} from "../types/speechmatics"

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
 * Note: Types are manually defined due to validation errors in the official OpenAPI spec.
 * See src/generated/speechmatics/schema/index.ts for type definitions.
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
    streaming: false, // Batch only (streaming available via separate WebSocket API)
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
  protected baseUrl = "https://asr.api.speechmatics.com/v2"

  initialize(config: ProviderConfig): void {
    super.initialize(config)

    this.baseUrl = config.baseUrl || this.baseUrl

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
      // Model maps to operating_point: 'standard' or 'enhanced'
      // SpeechmaticsOperatingPoint is part of TranscriptionModel union
      const operatingPoint: "standard" | "enhanced" =
        (options?.model as "standard" | "enhanced") || "standard"

      const jobConfig: JobConfig = {
        type: "transcription",
        transcription_config: {
          language: options?.language || "en",
          operating_point: operatingPoint
        }
      }

      // Add diarization if requested
      if (options?.diarization) {
        if (!jobConfig.transcription_config) {
          jobConfig.transcription_config = {}
        }
        jobConfig.transcription_config.diarization = "speaker"
        if (options.speakersExpected) {
          jobConfig.transcription_config.speaker_diarization_config = {
            max_speakers: options.speakersExpected
          }
        }
      }

      // Add sentiment analysis
      if (options?.sentimentAnalysis) {
        if (!jobConfig.transcription_config) {
          jobConfig.transcription_config = {}
        }
        jobConfig.transcription_config.enable_sentiment_analysis = true
      }

      // Add summarization (defaults to bullets/medium when enabled)
      if (options?.summarization) {
        if (!jobConfig.transcription_config) {
          jobConfig.transcription_config = {}
        }
        jobConfig.transcription_config.summarization_config = {
          type: "bullets",
          length: "medium"
        }
      }

      // Add custom vocabulary
      if (options?.customVocabulary && options.customVocabulary.length > 0) {
        if (!jobConfig.transcription_config) {
          jobConfig.transcription_config = {}
        }
        jobConfig.transcription_config.additional_vocab = options.customVocabulary
      }

      // Handle audio input
      let requestBody: FormData | Record<string, any>
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
          data_file: audio.file
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
      const response = await this.client!.post<JobSubmitResponse>("/jobs", requestBody, { headers })

      return {
        success: true,
        provider: this.name,
        data: {
          id: response.data.id,
          text: "",
          status: "queued",
          createdAt: response.data.created_at
        },
        raw: response.data
      }
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
      const statusResponse = await this.client!.get<JobDetailsResponse>(`/jobs/${transcriptId}`)

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
      const transcriptResponse = await this.client!.get<TranscriptionResponse>(
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
   * Normalize Speechmatics status to unified status
   */
  private normalizeStatus(status: string): "queued" | "processing" | "completed" | "error" {
    switch (status) {
      case "running":
        return "processing"
      case "done":
        return "completed"
      case "rejected":
      case "expired":
        return "error"
      default:
        return "queued"
    }
  }

  /**
   * Normalize Speechmatics response to unified format
   */
  private normalizeResponse(response: TranscriptionResponse): UnifiedTranscriptResponse {
    // Extract full text from results
    const text = response.results
      .filter((r) => r.type === "word" && r.alternatives)
      .map((r) => r.alternatives![0]?.content || "")
      .join(" ")

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

    // Extract speakers if diarization was enabled
    const speakerSet = new Set<string>()
    response.results.forEach((r) => {
      if (r.alternatives) {
        const speaker = r.alternatives[0]?.speaker
        if (speaker) speakerSet.add(speaker)
      }
    })

    const speakers =
      speakerSet.size > 0
        ? Array.from(speakerSet).map((id) => ({
            id,
            label: `Speaker ${id}`
          }))
        : undefined

    // Build utterances from speaker changes
    const utterances: Array<{
      speaker: string
      text: string
      start: number
      end: number
    }> = []

    if (speakers) {
      let currentSpeaker: string | undefined
      let currentUtterance: string[] = []
      let utteranceStart = 0

      response.results
        .filter((r) => r.type === "word" && r.alternatives)
        .forEach((result, idx) => {
          const speaker = result.alternatives![0]?.speaker
          const word = result.alternatives![0]?.content || ""

          if (speaker !== currentSpeaker) {
            // Speaker changed - save previous utterance
            if (currentSpeaker && currentUtterance.length > 0) {
              const prevResult = response.results.filter((r) => r.type === "word")[idx - 1]
              utterances.push({
                speaker: currentSpeaker,
                text: currentUtterance.join(" "),
                start: utteranceStart || 0,
                end: prevResult?.end_time || result.start_time || 0
              })
            }

            // Start new utterance
            currentSpeaker = speaker
            currentUtterance = [word]
            utteranceStart = result.start_time || 0
          } else {
            currentUtterance.push(word)
          }
        })

      // Add final utterance
      if (currentSpeaker && currentUtterance.length > 0) {
        const lastWord = response.results.filter((r) => r.type === "word").pop()
        utterances.push({
          speaker: currentSpeaker,
          text: currentUtterance.join(" "),
          start: utteranceStart,
          end: lastWord?.end_time || utteranceStart
        })
      }
    }

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
 */
export function createSpeechmaticsAdapter(config: ProviderConfig): SpeechmaticsAdapter {
  const adapter = new SpeechmaticsAdapter()
  adapter.initialize(config)
  return adapter
}
