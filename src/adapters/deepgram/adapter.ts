import type { AxiosInstance } from "axios"
import type {
  AudioInput,
  ProviderCapabilities,
  StreamingCallbacks,
  StreamingOptions,
  StreamingSession,
  TranscribeOptions,
  UnifiedTranscriptResponse,
  ListTranscriptsOptions
} from "../../router/types"
import { BaseAdapter } from "../base-adapter"
import type {
  ProviderConfigWithRegion,
  RegionalEndpoints
} from "../shared-types"
import type { DeepgramRegionType } from "../../constants"
import { getProviderEndpoints } from "../provider-endpoints"
import {
  mapToTranscriptionParams,
  mapFromDeepgramResponse,
  mapFromDeepgramRequestItem
} from "./mappers"
import {
  buildDeepgramListParams,
  createDeepgramClient,
  createDeepgramProjectIdError,
  createDeepgramStreamingSession,
  submitDeepgramTranscription
} from "./helpers"
import type { ListenV1Response } from "../../generated/deepgram/schema/listenV1Response"
import type { ListProjectRequestsV1Response } from "../../generated/deepgram/schema/listProjectRequestsV1Response"
import type { ProjectRequestResponse } from "../../generated/deepgram/schema/projectRequestResponse"
import type { GetProjectRequestV1Response } from "../../generated/deepgram/schema/getProjectRequestV1Response"

export interface DeepgramConfig extends ProviderConfigWithRegion<DeepgramRegionType> {
  projectId?: string
  region?: DeepgramRegionType
}

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
    piiRedaction: true,
    listTranscripts: true,
    deleteTranscript: false
  }

  private client?: AxiosInstance
  protected baseUrl: string
  private wsBaseUrl: string
  private projectId?: string

  constructor() {
    super()
    const defaults = getProviderEndpoints("deepgram")
    this.baseUrl = defaults.api
    this.wsBaseUrl = defaults.websocket!
  }

  initialize(config: DeepgramConfig): void {
    super.initialize(config)
    this.projectId = config.projectId

    const endpoints = config.baseUrl
      ? {
          api: config.baseUrl,
          websocket: config.wsBaseUrl ?? `${this.deriveWsUrl(config.baseUrl)}/listen`
        }
      : getProviderEndpoints("deepgram", config.region, {
          baseUrl: config.baseUrl,
          wsBaseUrl: config.wsBaseUrl
        })

    this.baseUrl = endpoints.api
    this.wsBaseUrl = endpoints.websocket!
    this.client = createDeepgramClient(this.baseUrl, config)
  }

  setRegion(region: DeepgramRegionType): void {
    this.validateConfig()

    if (!this.config!.baseUrl) {
      const endpoints = getProviderEndpoints("deepgram", region)
      this.baseUrl = endpoints.api
      if (!this.config!.wsBaseUrl) {
        this.wsBaseUrl = endpoints.websocket!
      }
    }

    this.client = createDeepgramClient(this.baseUrl, this.config!)
  }

  getRegion(): RegionalEndpoints {
    return {
      api: this.baseUrl,
      websocket: this.wsBaseUrl
    }
  }

  async transcribe(
    audio: AudioInput,
    options?: TranscribeOptions
  ): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      const params = mapToTranscriptionParams(options)
      const response = await submitDeepgramTranscription(this.client!, audio, params)
      return mapFromDeepgramResponse(response, this.name)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  async getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    if (!this.projectId) {
      return createDeepgramProjectIdError(this.name, "getTranscript")
    }

    try {
      const response = await this.client!.get<GetProjectRequestV1Response>(
        `/projects/${this.projectId}/requests/${transcriptId}`
      )

      const request = response.data.request
      if (!request) {
        return {
          success: false,
          provider: this.name,
          error: {
            code: "NOT_FOUND",
            message: `Request ${transcriptId} not found`
          }
        }
      }

      const transcriptResponse = request.response as ListenV1Response | undefined
      if (!transcriptResponse) {
        return mapFromDeepgramRequestItem(request, this.name, this.capabilities)
      }

      return mapFromDeepgramResponse(transcriptResponse, this.name)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  async transcribeStream(
    options?: StreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession> {
    this.validateConfig()
    return await createDeepgramStreamingSession({
      apiKey: this.config!.apiKey,
      provider: this.name,
      wsBaseUrl: this.wsBaseUrl,
      options,
      callbacks
    })
  }

  async listTranscripts(options?: ListTranscriptsOptions): Promise<{
    transcripts: UnifiedTranscriptResponse[]
    total?: number
    hasMore?: boolean
  }> {
    this.validateConfig()

    if (!this.projectId) {
      return {
        transcripts: [createDeepgramProjectIdError(this.name, "listTranscripts")],
        hasMore: false
      }
    }

    try {
      const params = buildDeepgramListParams(options)
      const response = await this.client!.get<ListProjectRequestsV1Response>(
        `/projects/${this.projectId}/requests`,
        { params }
      )
      const data = response.data

      const transcripts: UnifiedTranscriptResponse[] = (data.requests || []).map(
        (item: ProjectRequestResponse) =>
          mapFromDeepgramRequestItem(item, this.name, this.capabilities)
      )

      return {
        transcripts,
        hasMore: (data.page || 1) * (data.limit || 10) < (data.requests?.length || 0)
      }
    } catch (error) {
      return {
        transcripts: [this.createErrorResponse(error)],
        hasMore: false
      }
    }
  }
}

export function createDeepgramAdapter(config: DeepgramConfig): DeepgramAdapter {
  const adapter = new DeepgramAdapter()
  adapter.initialize(config)
  return adapter
}
