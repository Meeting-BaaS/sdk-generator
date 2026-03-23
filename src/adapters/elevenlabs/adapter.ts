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
import { ElevenLabsRegion, type ElevenLabsRegionType } from "../../constants"
import type { ProviderConfigWithRegion } from "../shared-types"
import { getProviderEndpoints } from "../provider-endpoints"
import { mapFromElevenLabsResponse } from "./mappers"
import {
  buildElevenLabsStreamingUrl,
  buildElevenLabsTranscriptionFormData,
  createElevenLabsClient,
  createElevenLabsStreamingSession
} from "./helpers"
import type { ElevenLabsModelCode } from "../../generated/elevenlabs/models"

export interface ElevenLabsConfig extends ProviderConfigWithRegion<ElevenLabsRegionType> {
  model?: ElevenLabsModelCode
  region?: ElevenLabsRegionType
}

export class ElevenLabsAdapter extends BaseAdapter {
  readonly name = "elevenlabs" as const
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    diarization: true,
    wordTimestamps: true,
    languageDetection: true,
    customVocabulary: true,
    summarization: false,
    sentimentAnalysis: false,
    entityDetection: true,
    piiRedaction: true,
    listTranscripts: false,
    deleteTranscript: false
  }

  private client?: AxiosInstance
  private region: ElevenLabsRegionType = ElevenLabsRegion.global
  private defaultModel: ElevenLabsModelCode = "scribe_v2"
  protected baseUrl: string

  constructor() {
    super()
    const defaults = getProviderEndpoints("elevenlabs")
    this.baseUrl = defaults.api
  }

  initialize(config: ElevenLabsConfig): void {
    super.initialize(config)

    if (config.region) {
      this.region = config.region
    }
    if (config.model) {
      this.defaultModel = config.model
    }

    const endpoints = config.baseUrl
      ? { api: config.baseUrl, websocket: config.wsBaseUrl }
      : getProviderEndpoints("elevenlabs", config.region, {
          baseUrl: config.baseUrl,
          wsBaseUrl: config.wsBaseUrl
        })
    this.baseUrl = endpoints.api
    this.client = createElevenLabsClient(this.baseUrl, config)
  }

  getRegion(): ElevenLabsRegionType {
    return this.region
  }

  setRegion(region: ElevenLabsRegionType): void {
    this.region = region
    if (!this.config?.baseUrl) {
      const endpoints = getProviderEndpoints("elevenlabs", region)
      this.baseUrl = endpoints.api
    }
    if (this.config?.apiKey) {
      this.client = createElevenLabsClient(this.baseUrl, this.config)
    }
  }

  async transcribe(
    audio: AudioInput,
    options?: TranscribeOptions
  ): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      const formData = buildElevenLabsTranscriptionFormData(audio, options, this.defaultModel)
      const response = await this.client!.post("/v1/speech-to-text", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })

      return mapFromElevenLabsResponse(response.data, this.name)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  async getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      const response = await this.client!.get(`/v1/speech-to-text/transcripts/${transcriptId}`)
      return mapFromElevenLabsResponse(response.data, this.name)
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
        : getProviderEndpoints("elevenlabs", this.region, { wsBaseUrl: this.config?.wsBaseUrl })
    const wsBase = endpoints.websocket ?? this.deriveWsUrl(this.baseUrl)
    const streaming = buildElevenLabsStreamingUrl(wsBase, options)
    return await createElevenLabsStreamingSession({
      apiKey: this.config!.apiKey,
      provider: this.name,
      region: this.region,
      modelId: streaming.modelId,
      wsUrl: streaming.url,
      options,
      callbacks
    })
  }
}

export function createElevenLabsAdapter(config: ElevenLabsConfig): ElevenLabsAdapter {
  const adapter = new ElevenLabsAdapter()
  adapter.initialize(config)
  return adapter
}
