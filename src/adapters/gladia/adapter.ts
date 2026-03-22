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
import { BaseAdapter, type ProviderConfig } from "../base-adapter"
import type { TranscriptJobType } from "../shared-types"
import { getProviderEndpoints } from "../provider-endpoints"
import {
  mapToTranscribeRequest,
  mapFromGladiaResponse,
  mapFromGladiaListItem,
  mapToStreamingRequest
} from "./mappers"
import {
  buildGladiaListParams,
  createGladiaStreamingSession,
  createQueuedTranscriptResponse,
  deleteGladiaJob,
  downloadGladiaAudio
} from "./helpers"
import {
  preRecordedControllerInitPreRecordedJobV2,
  preRecordedControllerGetPreRecordedJobV2,
  transcriptionControllerListV2,
  streamingControllerInitStreamingSessionV2
} from "../../generated/gladia/api/gladiaControlAPI"
import type { ListTranscriptionResponseItemsItem } from "../../generated/gladia/schema/listTranscriptionResponseItemsItem"

export class GladiaAdapter extends BaseAdapter {
  readonly name = "gladia" as const
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    diarization: true,
    wordTimestamps: true,
    languageDetection: true,
    customVocabulary: true,
    summarization: true,
    sentimentAnalysis: true,
    entityDetection: true,
    piiRedaction: false,
    listTranscripts: true,
    deleteTranscript: true,
    getAudioFile: true
  }

  protected baseUrl: string

  constructor() {
    super()
    this.baseUrl = getProviderEndpoints("gladia").api
  }

  initialize(config: ProviderConfig): void {
    super.initialize(config)
    if (config.baseUrl) this.baseUrl = config.baseUrl
  }

  protected getAxiosConfig() {
    return super.getAxiosConfig("x-gladia-key")
  }

  async transcribe(
    audio: AudioInput,
    options?: TranscribeOptions
  ): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      if (audio.type !== "url") {
        throw new Error(
          "Gladia adapter currently only supports URL-based audio input. Use audio.type='url'"
        )
      }
      const request = mapToTranscribeRequest(audio.url, options)
      const response = await preRecordedControllerInitPreRecordedJobV2(
        request,
        this.getAxiosConfig()
      )
      const jobId = response.data.id

      if (options?.webhookUrl) {
        return createQueuedTranscriptResponse(this.name, jobId, response.data)
      }

      return await this.pollForCompletion(jobId)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  async getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      const response = await preRecordedControllerGetPreRecordedJobV2(
        transcriptId,
        this.getAxiosConfig()
      )
      return mapFromGladiaResponse(response.data, this.name, this.capabilities)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  async deleteTranscript(
    transcriptId: string,
    jobType: TranscriptJobType = "pre-recorded"
  ): Promise<{ success: boolean }> {
    this.validateConfig()

    try {
      await deleteGladiaJob(transcriptId, jobType, this.getAxiosConfig())
      return { success: true }
    } catch (error) {
      const err = error as { response?: { status?: number } }
      if (err.response?.status === 404) {
        return { success: true }
      }
      throw error
    }
  }

  async getAudioFile(
    transcriptId: string,
    jobType: TranscriptJobType = "pre-recorded"
  ): Promise<{
    success: boolean
    data?: ArrayBuffer
    contentType?: string
    error?: { code: string; message: string }
  }> {
    this.validateConfig()

    try {
      const config = {
        ...this.getAxiosConfig(),
        responseType: "arraybuffer" as const
      }
      const response = await downloadGladiaAudio(transcriptId, jobType, config)
      return {
        success: true,
        data: response.data,
        contentType: response.headers?.["content-type"]
      }
    } catch (error) {
      const err = error as { response?: { status?: number }; message?: string }
      if (err.response?.status === 404) {
        return {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Audio file not found for transcript ${transcriptId}`
          }
        }
      }

      return {
        success: false,
        error: {
          code: "DOWNLOAD_ERROR",
          message: err.message || "Failed to download audio file"
        }
      }
    }
  }

  async listTranscripts(options?: ListTranscriptsOptions): Promise<{
    transcripts: UnifiedTranscriptResponse[]
    total?: number
    hasMore?: boolean
  }> {
    this.validateConfig()

    try {
      const params = buildGladiaListParams(options)
      const response = await transcriptionControllerListV2(params, this.getAxiosConfig())

      const transcripts: UnifiedTranscriptResponse[] = response.data.items.map(
        (item: ListTranscriptionResponseItemsItem) =>
          mapFromGladiaListItem(item, this.name, this.capabilities)
      )

      return {
        transcripts,
        hasMore: response.data.next !== null
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
  ): Promise<StreamingSession> {
    this.validateConfig()

    const streamingRequest = mapToStreamingRequest(options)
    const initResponse = await streamingControllerInitStreamingSessionV2(
      streamingRequest,
      options?.region ? { region: options.region } : undefined,
      this.getAxiosConfig()
    )

    const { id, url: apiWsUrl } = initResponse.data
    const wsUrl = this.config?.wsBaseUrl || apiWsUrl

    return await createGladiaStreamingSession({
      provider: this.name,
      sessionId: id,
      wsUrl,
      callbacks
    })
  }
}

export function createGladiaAdapter(config: ProviderConfig): GladiaAdapter {
  const adapter = new GladiaAdapter()
  adapter.initialize(config)
  return adapter
}
