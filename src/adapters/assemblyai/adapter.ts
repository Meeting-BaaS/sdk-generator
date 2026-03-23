/**
 * AssemblyAI transcription provider adapter
 * Documentation: https://www.assemblyai.com/docs
 */

import type {
  AudioInput,
  ListTranscriptsOptions,
  ProviderCapabilities,
  StreamingCallbacks,
  StreamingOptions,
  StreamingSession,
  TranscribeOptions,
  UnifiedTranscriptResponse
} from "../../router/types"
import { BaseAdapter } from "../base-adapter"
import type { ProviderConfigWithRegion, RegionalEndpoints } from "../shared-types"
import type { AssemblyAIRegionType } from "../../constants"
import { getProviderEndpoints } from "../provider-endpoints"
import {
  mapToTranscribeRequest,
  mapFromAssemblyAIResponse,
  buildAssemblyAIStreamingUrl,
  mapFromAssemblyAIListItem
} from "./mappers"
import {
  buildAssemblyAIListParams,
  createAssemblyAIQueuedResponse,
  createAssemblyAIStreamingSession
} from "./helpers"

import {
  createTranscript,
  getTranscript as getTranscriptAPI,
  deleteTranscript as deleteTranscriptAPI,
  listTranscripts as listTranscriptsAPI
} from "../../generated/assemblyai/api/assemblyAIAPI"
import type { TranscriptListItem } from "../../generated/assemblyai/schema/transcriptListItem"
import type {
  StreamingUpdateConfiguration,
  StreamingForceEndpoint
} from "../../generated/assemblyai/streaming-types"

export interface AssemblyAIConfig extends ProviderConfigWithRegion<AssemblyAIRegionType> {
  /**
   * Regional endpoint for data residency
   *
   * Available regions:
   * - `us` - United States (default): api.assemblyai.com
   * - `eu` - European Union: api.eu.assemblyai.com
   *
   * The EU endpoint guarantees audio and transcription data never leaves the EU.
   *
   * @see https://www.assemblyai.com/docs/getting-started/cloud-endpoints
   */
  region?: AssemblyAIRegionType
}

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
    piiRedaction: true,
    listTranscripts: true,
    deleteTranscript: true
  }

  protected baseUrl: string
  private wsBaseUrl: string

  constructor() {
    super()
    const defaults = getProviderEndpoints("assemblyai")
    this.baseUrl = defaults.api
    this.wsBaseUrl = defaults.websocket!
  }

  initialize(config: AssemblyAIConfig): void {
    super.initialize(config)

    const endpoints = config.baseUrl
      ? {
          api: config.baseUrl,
          websocket:
            config.wsBaseUrl ?? `${this.deriveWsUrl(config.baseUrl)}/v3/ws`
        }
      : getProviderEndpoints("assemblyai", config.region, {
          baseUrl: config.baseUrl,
          wsBaseUrl: config.wsBaseUrl
        })

    this.baseUrl = endpoints.api
    this.wsBaseUrl = endpoints.websocket!
  }

  setRegion(region: AssemblyAIRegionType): void {
    this.validateConfig()

    if (!this.config!.baseUrl) {
      const endpoints = getProviderEndpoints("assemblyai", region)
      this.baseUrl = endpoints.api
      if (!this.config!.wsBaseUrl) {
        this.wsBaseUrl = endpoints.websocket!
      }
    }
  }

  getRegion(): RegionalEndpoints {
    return {
      api: this.baseUrl,
      websocket: this.wsBaseUrl
    }
  }

  protected getAxiosConfig() {
    return super.getAxiosConfig("authorization")
  }

  async transcribe(
    audio: AudioInput,
    options?: TranscribeOptions
  ): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      if (audio.type !== "url") {
        throw new Error(
          "AssemblyAI adapter currently only supports URL-based audio input. Use audio.type='url'"
        )
      }
      const request = mapToTranscribeRequest(audio.url, options)
      const response = await createTranscript(request, this.getAxiosConfig())
      const transcriptId = response.data.id

      if (options?.webhookUrl) {
        return createAssemblyAIQueuedResponse(transcriptId, this.name, response.data)
      }

      return await this.pollForCompletion(transcriptId)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  async getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      const response = await getTranscriptAPI(transcriptId, this.getAxiosConfig())
      return mapFromAssemblyAIResponse(response.data, this.name, this.capabilities)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  async deleteTranscript(transcriptId: string): Promise<{ success: boolean }> {
    this.validateConfig()

    try {
      const response = await deleteTranscriptAPI(transcriptId, this.getAxiosConfig())
      return {
        success: response.data.status === "completed" || response.status === 200
      }
    } catch (error) {
      const err = error as { response?: { status?: number } }
      if (err.response?.status === 404) {
        return { success: true }
      }
      throw error
    }
  }

  async listTranscripts(options?: ListTranscriptsOptions): Promise<{
    transcripts: UnifiedTranscriptResponse[]
    total?: number
    hasMore?: boolean
  }> {
    this.validateConfig()

    try {
      const params = buildAssemblyAIListParams(options)
      const response = await listTranscriptsAPI(params, this.getAxiosConfig())

      const transcripts: UnifiedTranscriptResponse[] = response.data.transcripts.map(
        (item: TranscriptListItem) =>
          mapFromAssemblyAIListItem(item, this.name, this.capabilities)
      )

      return {
        transcripts,
        hasMore: response.data.page_details.next_url !== null
      }
    } catch (error) {
      return {
        transcripts: [this.createErrorResponse(error)],
        hasMore: false
      }
    }
  }

  async transcribeStream(
    options?: StreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<
    StreamingSession & {
      updateConfiguration?: (config: Partial<Omit<StreamingUpdateConfiguration, "type">>) => void
      forceEndpoint?: () => void
    }
  > {
    this.validateConfig()

    if (!this.config?.apiKey) {
      throw new Error("API key is required for streaming")
    }

    const wsUrl = buildAssemblyAIStreamingUrl(this.wsBaseUrl, options)
    return await createAssemblyAIStreamingSession({
      apiKey: this.config.apiKey,
      provider: this.name,
      wsUrl,
      callbacks
    })
  }
}

export function createAssemblyAIAdapter(config: AssemblyAIConfig): AssemblyAIAdapter {
  const adapter = new AssemblyAIAdapter()
  adapter.initialize(config)
  return adapter
}
