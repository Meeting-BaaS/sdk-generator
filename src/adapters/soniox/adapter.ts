import type { AxiosInstance } from "axios"
import type {
  AudioInput,
  ProviderCapabilities,
  TranscribeOptions,
  UnifiedTranscriptResponse,
  StreamingOptions,
  StreamingCallbacks,
  StreamingSession
} from "../../router/types"
import { BaseAdapter } from "../base-adapter"
import { SonioxRegion, type SonioxRegionType } from "../../constants"
import type { ProviderConfigWithRegion } from "../shared-types"
import { getProviderEndpoints } from "../provider-endpoints"
import { mapFromSonioxResponse } from "./mappers"
import {
  buildSonioxBatchRequest,
  buildSonioxStreamingUrl,
  createSonioxClient,
  createSonioxStreamingSession
} from "./helpers"
import { TranscriptionStatus as SonioxTranscriptionStatus } from "../../generated/soniox/schema/transcriptionStatus"
import type { Model as SonioxModelInfo } from "../../generated/soniox/schema/model"
import type { Language as SonioxLanguageInfo } from "../../generated/soniox/schema/language"
import type { SonioxModelCode } from "../../generated/soniox/models"

export interface SonioxConfig extends ProviderConfigWithRegion<SonioxRegionType> {
  model?: SonioxModelCode
  region?: SonioxRegionType
}

export class SonioxAdapter extends BaseAdapter {
  readonly name = "soniox" as const
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    diarization: true,
    wordTimestamps: true,
    languageDetection: true,
    customVocabulary: true,
    summarization: false,
    sentimentAnalysis: false,
    entityDetection: false,
    piiRedaction: false,
    listTranscripts: false,
    deleteTranscript: false
  }

  private client?: AxiosInstance
  private region: SonioxRegionType = SonioxRegion.us
  protected baseUrl: string
  private defaultModel = "stt-async-preview"

  constructor() {
    super()
    const defaults = getProviderEndpoints("soniox")
    this.baseUrl = defaults.api
  }

  initialize(config: SonioxConfig): void {
    super.initialize(config)

    if (config.region) {
      this.region = config.region
    }
    if (config.model) {
      this.defaultModel = config.model
    }

    const endpoints = config.baseUrl
      ? { api: config.baseUrl, websocket: config.wsBaseUrl }
      : getProviderEndpoints("soniox", config.region, {
          baseUrl: config.baseUrl,
          wsBaseUrl: config.wsBaseUrl
        })
    this.baseUrl = endpoints.api
    this.client = createSonioxClient(this.baseUrl, config)
  }

  getRegion(): SonioxRegionType {
    return this.region
  }

  setRegion(region: SonioxRegionType): void {
    this.region = region
    if (!this.config?.baseUrl) {
      const endpoints = getProviderEndpoints("soniox", region)
      this.baseUrl = endpoints.api
    }
    if (this.config?.apiKey) {
      this.client = createSonioxClient(this.baseUrl, this.config)
    }
  }

  async transcribe(
    audio: AudioInput,
    options?: TranscribeOptions
  ): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      const request = buildSonioxBatchRequest(audio, options, this.defaultModel)
      const response = request.formData
        ? await this.client!.post("/speech/transcribe", request.formData, {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          })
        : await this.client!.post("/speech/transcribe", request.body)

      return mapFromSonioxResponse(response.data, this.name)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  async getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      const response = await this.client!.get(`/speech/transcripts/${transcriptId}`)
      return mapFromSonioxResponse(response.data, this.name)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  async transcribeStream(
    options?: StreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession> {
    this.validateConfig()

    const endpoints =
      this.config?.baseUrl
        ? { websocket: this.config.wsBaseUrl ?? this.deriveWsUrl(this.config.baseUrl) }
        : getProviderEndpoints("soniox", this.region, { wsBaseUrl: this.config?.wsBaseUrl })
    const streaming = buildSonioxStreamingUrl(endpoints.websocket!, options)
    return await createSonioxStreamingSession({
      apiKey: this.config!.apiKey,
      provider: this.name,
      region: this.region,
      modelId: streaming.modelId,
      wsUrl: streaming.url,
      options,
      callbacks
    })
  }

  async getModels(): Promise<SonioxModelInfo[]> {
    this.validateConfig()

    const response = await this.client!.get("/models")
    return response.data.models || []
  }

  async getLanguagesForModel(modelId: SonioxModelCode): Promise<SonioxLanguageInfo[]> {
    const models = await this.getModels()
    const model = models.find((m) => m.id === modelId)
    return model?.languages || []
  }
}

export function createSonioxAdapter(config: SonioxConfig): SonioxAdapter {
  const adapter = new SonioxAdapter()
  adapter.initialize(config)
  return adapter
}
