import axios, { type AxiosInstance } from "axios"
import type {
  AudioInput,
  ProviderCapabilities,
  TranscribeOptions,
  UnifiedTranscriptResponse
} from "../../router/types"
import { BaseAdapter } from "../base-adapter"
import type { ProviderConfigWithRegion } from "../shared-types"
import type { SpeechmaticsRegionType } from "../../constants"
import { getProviderEndpoints } from "../provider-endpoints"
import {
  mapToJobConfig,
  mapFromSpeechmaticsResponse,
  normalizeSpeechmaticsStatus
} from "./mappers"
import type { CreateJobResponse } from "../../generated/speechmatics/schema/createJobResponse"
import type { RetrieveJobResponse } from "../../generated/speechmatics/schema/retrieveJobResponse"
import type { RetrieveTranscriptResponse } from "../../generated/speechmatics/schema/retrieveTranscriptResponse"

export interface SpeechmaticsConfig extends ProviderConfigWithRegion<SpeechmaticsRegionType> {
  region?: SpeechmaticsRegionType
}

export class SpeechmaticsAdapter extends BaseAdapter {
  readonly name = "speechmatics" as const
  readonly capabilities: ProviderCapabilities = {
    streaming: false,
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
  protected baseUrl: string

  constructor() {
    super()
    const defaults = getProviderEndpoints("speechmatics")
    this.baseUrl = defaults.api
  }

  initialize(config: SpeechmaticsConfig): void {
    super.initialize(config)

    const endpoints = config.baseUrl
      ? { api: config.baseUrl }
      : getProviderEndpoints("speechmatics", config.region, { baseUrl: config.baseUrl })
    this.baseUrl = endpoints.api

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 120000,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        ...config.headers
      }
    })
  }

  setRegion(region: SpeechmaticsRegionType): void {
    this.validateConfig()

    const endpoints = getProviderEndpoints("speechmatics", region)
    this.baseUrl = endpoints.api
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.config!.timeout || 120000,
      headers: {
        Authorization: `Bearer ${this.config!.apiKey}`,
        ...this.config!.headers
      }
    })
  }

  getRegion(): string {
    return this.baseUrl
  }

  async transcribe(
    audio: AudioInput,
    options?: TranscribeOptions
  ): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      const jobConfig = mapToJobConfig(options)
      let requestBody: FormData

      if (audio.type === "url") {
        jobConfig.fetch_data = {
          url: audio.url
        }
        const formData = new FormData()
        formData.append("config", JSON.stringify(jobConfig))
        requestBody = formData
      } else if (audio.type === "file") {
        const formData = new FormData()
        formData.append("config", JSON.stringify(jobConfig))
        const audioBlob =
          audio.file instanceof Blob
            ? audio.file
            : new Blob([audio.file], { type: audio.mimeType || "audio/wav" })
        formData.append("data_file", audioBlob, audio.filename || "audio.wav")
        requestBody = formData
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

      const response = await this.client!.post<CreateJobResponse>("/jobs", requestBody)
      const jobId = response.data.id

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

      return await this.pollForCompletion(jobId)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  async getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      const statusResponse = await this.client!.get<RetrieveJobResponse>(`/jobs/${transcriptId}`)
      const status = normalizeSpeechmaticsStatus(statusResponse.data.job.status)

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

      const transcriptResponse = await this.client!.get<RetrieveTranscriptResponse>(
        `/jobs/${transcriptId}/transcript`
      )

      return mapFromSpeechmaticsResponse(transcriptResponse.data, this.name)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  async deleteTranscript(
    transcriptId: string,
    force: boolean = false
  ): Promise<{ success: boolean }> {
    this.validateConfig()

    try {
      await this.client!.delete(`/jobs/${transcriptId}`, {
        params: force ? { force: true } : undefined
      })
      return { success: true }
    } catch (error) {
      const err = error as { response?: { status?: number } }
      if (err.response?.status === 404) {
        return { success: true }
      }
      throw error
    }
  }
}

export function createSpeechmaticsAdapter(config: SpeechmaticsConfig): SpeechmaticsAdapter {
  const adapter = new SpeechmaticsAdapter()
  adapter.initialize(config)
  return adapter
}
