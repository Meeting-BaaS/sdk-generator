/**
 * OpenAI Whisper transcription provider adapter
 * Documentation: https://platform.openai.com/docs/guides/speech-to-text
 */

import type {
  AudioInput,
  ProviderCapabilities,
  StreamingCallbacks,
  StreamingOptions,
  StreamingSession,
  TranscribeOptions,
  UnifiedTranscriptResponse
} from "../../router/types"
import { BaseAdapter, type ProviderConfig } from "../base-adapter"
import { getProviderEndpoints } from "../provider-endpoints"
import {
  selectOpenAIModel,
  mapToTranscriptionRequest,
  mapFromOpenAIResponse
} from "./mappers"
import { createTranscription } from "../../generated/openai/api/openAIAudioRealtimeAPI"
import type {
  CreateTranscriptionRequestModel
} from "../../generated/openai/schema/createTranscriptionRequestModel"
import { OpenAIModel } from "../../constants"
import {
  createOpenAIRealtimeSession,
  loadOpenAIAudioInput
} from "./helpers"

export class OpenAIWhisperAdapter extends BaseAdapter {
  readonly name = "openai-whisper" as const
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    diarization: true,
    wordTimestamps: true,
    languageDetection: true,
    customVocabulary: false,
    summarization: false,
    sentimentAnalysis: false,
    entityDetection: false,
    piiRedaction: false,
    listTranscripts: false,
    deleteTranscript: false
  }

  protected baseUrl: string

  constructor() {
    super()
    const defaults = getProviderEndpoints("openai-whisper")
    this.baseUrl = defaults.api
  }

  protected getAxiosConfig() {
    return super.getAxiosConfig("Authorization", (apiKey) => `Bearer ${apiKey}`)
  }

  async transcribe(
    audio: AudioInput,
    options?: TranscribeOptions
  ): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      const audioData = await loadOpenAIAudioInput(audio)
      const model = selectOpenAIModel(options)
      const isDiarization = model === OpenAIModel["gpt-4o-transcribe-diarize"]
      const request = mapToTranscriptionRequest(
        audioData as Buffer,
        options,
        model as CreateTranscriptionRequestModel
      )

      const response = await createTranscription(request, this.getAxiosConfig())

      return mapFromOpenAIResponse(
        response.data as any,
        model as CreateTranscriptionRequestModel,
        isDiarization,
        this.name
      )
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  async getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse> {
    return {
      success: false,
      provider: this.name,
      error: {
        code: "NOT_SUPPORTED",
        message:
          "OpenAI Whisper processes transcriptions synchronously. Use transcribe() method directly."
      }
    }
  }

  async transcribeStream(
    options?: StreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession> {
    this.validateConfig()
    return await createOpenAIRealtimeSession({
      apiKey: this.config!.apiKey,
      provider: this.name,
      options,
      callbacks
    })
  }
}

export function createOpenAIWhisperAdapter(config: ProviderConfig): OpenAIWhisperAdapter {
  const adapter = new OpenAIWhisperAdapter()
  adapter.initialize(config)
  return adapter
}
