/**
 * Azure Speech-to-Text transcription provider adapter
 * Documentation: https://learn.microsoft.com/azure/cognitive-services/speech-service/
 */

import axios from "axios"
import type {
  AudioInput,
  ListTranscriptsOptions,
  ProviderCapabilities,
  TranscribeOptions,
  UnifiedTranscriptResponse
} from "../../router/types"
import { BaseAdapter, type ProviderConfig } from "../base-adapter"
import { getProviderEndpoints } from "../provider-endpoints"
import {
  mapToTranscriptionRequest,
  mapFromAzureResponse,
  mapFromAzureListItem,
  mapStatusToAzure,
  normalizeAzureStatus
} from "./mappers"
import {
  transcriptionsCreate,
  transcriptionsDelete,
  transcriptionsGet,
  transcriptionsList,
  transcriptionsListFiles,
  webHooksCreate,
  webHooksDelete,
  webHooksList
} from "../../generated/azure/api/speechServicesAPIVersion32"
import type { TranscriptionsListParams } from "../../generated/azure/schema/transcriptionsListParams"
import type { Transcription } from "../../generated/azure/schema/transcription"
import type { WebHook } from "../../generated/azure/schema/webHook"
import type { WebHookEvents } from "../../generated/azure/schema/webHookEvents"

export class AzureSTTAdapter extends BaseAdapter {
  readonly name = "azure-stt" as const
  readonly capabilities: ProviderCapabilities = {
    streaming: false,
    diarization: true,
    wordTimestamps: true,
    languageDetection: true,
    customVocabulary: false,
    summarization: false,
    sentimentAnalysis: false,
    entityDetection: false,
    piiRedaction: false,
    listTranscripts: true,
    deleteTranscript: true
  }

  private region?: string
  protected baseUrl: string

  constructor() {
    super()
    const defaults = getProviderEndpoints("azure-stt")
    this.baseUrl = defaults.api
  }

  initialize(config: ProviderConfig & { region?: string }): void {
    super.initialize(config)

    this.region = config.region || "eastus"
    const endpoints = config.baseUrl
      ? { api: config.baseUrl }
      : getProviderEndpoints("azure-stt", this.region, {
          baseUrl: config.baseUrl
        })
    this.baseUrl = endpoints.api
  }

  protected getAxiosConfig() {
    return super.getAxiosConfig("Ocp-Apim-Subscription-Key")
  }

  async transcribe(
    audio: AudioInput,
    options?: TranscribeOptions
  ): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    if (audio.type !== "url") {
      return {
        success: false,
        provider: this.name,
        error: {
          code: "INVALID_INPUT",
          message: "Azure Speech-to-Text batch transcription only supports URL input"
        }
      }
    }

    try {
      const transcriptionRequest = mapToTranscriptionRequest(audio.url, options)
      const response = await transcriptionsCreate(
        transcriptionRequest as Transcription,
        this.getAxiosConfig()
      )

      const transcription = response.data
      const transcriptId = transcription.self?.split("/").pop() || ""
      return await this.pollForCompletion(transcriptId)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  async getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      const statusResponse = await transcriptionsGet(transcriptId, this.getAxiosConfig())
      const transcription = statusResponse.data
      const status = normalizeAzureStatus(transcription.status)

      if (status !== "completed") {
        return {
          success: true,
          provider: this.name,
          data: {
            id: transcriptId,
            text: "",
            status,
            language: transcription.locale,
            createdAt: transcription.createdDateTime
          },
          raw: transcription
        }
      }

      if (!transcription.links?.files) {
        return {
          success: false,
          provider: this.name,
          error: {
            code: "NO_RESULTS",
            message: "Transcription completed but no result files available"
          },
          raw: transcription
        }
      }

      const filesResponse = await transcriptionsListFiles(
        transcriptId,
        undefined,
        this.getAxiosConfig()
      )
      const files = filesResponse.data?.values || []
      const resultFile = files.find((file: any) => file.kind === "Transcription")

      if (!resultFile?.links?.contentUrl) {
        return {
          success: false,
          provider: this.name,
          error: {
            code: "NO_RESULTS",
            message: "Transcription result file not found"
          },
          raw: transcription
        }
      }

      const contentResponse = await axios.get(resultFile.links.contentUrl, {
        timeout: this.config?.timeout || 120000
      })
      return mapFromAzureResponse(transcription, contentResponse.data, this.name)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  async deleteTranscript(transcriptId: string): Promise<{ success: boolean }> {
    this.validateConfig()

    try {
      await transcriptionsDelete(transcriptId, this.getAxiosConfig())
      return { success: true }
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
      const params: TranscriptionsListParams = {}
      if (options?.limit) {
        params.top = options.limit
      }
      if (options?.offset) {
        params.skip = options.offset
      }
      if (options?.status) {
        const azureStatus = mapStatusToAzure(options.status)
        params.filter = `status eq '${azureStatus}'`
      }

      const response = await transcriptionsList(params, this.getAxiosConfig())
      const transcripts: UnifiedTranscriptResponse[] = (response.data.values || []).map(
        (item: Transcription) => mapFromAzureListItem(item, this.name, this.capabilities)
      )

      return {
        transcripts,
        hasMore: response.data["@nextLink"] !== undefined
      }
    } catch (error) {
      return {
        transcripts: [this.createErrorResponse(error)],
        hasMore: false
      }
    }
  }

  async registerWebhook(url: string, options?: {
    displayName?: string
    events?: Partial<WebHookEvents>
  }): Promise<WebHook> {
    this.validateConfig()
    const webhook: Partial<WebHook> = {
      webUrl: url,
      displayName: options?.displayName || "SDK Webhook",
      events: options?.events || {
        transcriptionCreation: true,
        transcriptionProcessing: true,
        transcriptionCompletion: true
      }
    }
    const response = await webHooksCreate(webhook as WebHook, this.getAxiosConfig())
    return response.data
  }

  async unregisterWebhook(webhookId: string): Promise<void> {
    this.validateConfig()
    await webHooksDelete(webhookId, this.getAxiosConfig())
  }

  async listWebhooks(): Promise<WebHook[]> {
    this.validateConfig()
    const response = await webHooksList(undefined, this.getAxiosConfig())
    return [...(response.data.values || [])]
  }
}

export function createAzureSTTAdapter(
  config: ProviderConfig & { region?: string }
): AzureSTTAdapter {
  const adapter = new AzureSTTAdapter()
  adapter.initialize(config)
  return adapter
}
