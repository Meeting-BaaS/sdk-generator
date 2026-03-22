/**
 * OpenAI Whisper API mappers: unified types ↔ OpenAI API types
 */

import type { TranscribeOptions, UnifiedTranscriptResponse } from "../../router/types"
import type { CreateTranscriptionRequest } from "../../generated/openai/schema/createTranscriptionRequest"
import type { CreateTranscriptionRequestModel } from "../../generated/openai/schema/createTranscriptionRequestModel"
import { CreateTranscriptionRequestTimestampGranularitiesItem } from "../../generated/openai/schema/createTranscriptionRequestTimestampGranularitiesItem"
import type { CreateTranscriptionResponseDiarizedJson } from "../../generated/openai/schema/createTranscriptionResponseDiarizedJson"
import type { CreateTranscriptionResponseVerboseJson } from "../../generated/openai/schema/createTranscriptionResponseVerboseJson"
import { OpenAIModel, OpenAIResponseFormat } from "../../constants"

function generateRequestId(): string {
  return `openai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function selectOpenAIModel(options?: TranscribeOptions): CreateTranscriptionRequestModel {
  if (options?.model) {
    return options.model as CreateTranscriptionRequestModel
  }
  if (options?.diarization) {
    return OpenAIModel["gpt-4o-transcribe-diarize"]
  }
  return OpenAIModel["gpt-4o-transcribe"]
}

export function mapToTranscriptionRequest(
  file: Buffer | Blob,
  options: TranscribeOptions | undefined,
  model: CreateTranscriptionRequestModel
): CreateTranscriptionRequest {
  const isDiarization = model === OpenAIModel["gpt-4o-transcribe-diarize"]
  const needsWords = options?.wordTimestamps === true

  const request: CreateTranscriptionRequest = {
    ...options?.openai,
    file: file as Blob,
    model
  }

  if (options?.language) {
    request.language = options.language
  }

  if (isDiarization) {
    request.response_format = OpenAIResponseFormat.verbose_json
  } else if (needsWords) {
    // options.diarization is already handled above via isDiarization + model selection
    request.response_format = OpenAIResponseFormat.verbose_json
    if (needsWords) {
      request.timestamp_granularities = [
        CreateTranscriptionRequestTimestampGranularitiesItem.word,
        CreateTranscriptionRequestTimestampGranularitiesItem.segment
      ]
    }
  } else {
    request.response_format = OpenAIResponseFormat.json
  }

  return request
}

export function mapFromOpenAIResponse(
  response:
    | CreateTranscriptionResponseVerboseJson
    | CreateTranscriptionResponseDiarizedJson
    | { text: string },
  model: CreateTranscriptionRequestModel,
  isDiarization: boolean,
  provider: "openai-whisper"
): UnifiedTranscriptResponse {
  if (
    "text" in response &&
    typeof response.text === "string" &&
    !("duration" in response) &&
    !("segments" in response) &&
    !("language" in response)
  ) {
    const requestId = generateRequestId()
    return {
      success: true,
      provider,
      data: {
        id: requestId,
        text: response.text,
        status: "completed",
        language: undefined,
        confidence: undefined
      },
      extended: {},
      tracking: { requestId },
      raw: response
    }
  }

  if (isDiarization && "segments" in response) {
    const diarizedResponse = response as CreateTranscriptionResponseDiarizedJson
    const speakerSet = new Set(diarizedResponse.segments.map((seg) => seg.speaker))
    const speakers = Array.from(speakerSet).map((speaker) => ({
      id: speaker,
      label: speaker
    }))
    const utterances = diarizedResponse.segments.map((segment) => ({
      speaker: segment.speaker,
      text: segment.text,
      start: segment.start,
      end: segment.end,
      confidence: undefined,
      words: [] as import("../../router/types").Word[]
    }))
    const requestId = generateRequestId()
    return {
      success: true,
      provider,
      data: {
        id: requestId,
        text: diarizedResponse.text,
        status: "completed",
        language: undefined,
        duration: diarizedResponse.duration,
        speakers,
        utterances
      },
      extended: {},
      tracking: { requestId },
      raw: response
    }
  }

  if ("duration" in response && "language" in response) {
    const verboseResponse = response as CreateTranscriptionResponseVerboseJson
    const words = verboseResponse.words?.map((w) => ({
      word: w.word,
      start: w.start,
      end: w.end,
      confidence: undefined
    }))
    const requestId = generateRequestId()
    return {
      success: true,
      provider,
      data: {
        id: requestId,
        text: verboseResponse.text,
        status: "completed",
        language: verboseResponse.language,
        duration: verboseResponse.duration,
        words
      },
      extended: {},
      tracking: { requestId },
      raw: response
    }
  }

  const requestId = `openai-${Date.now()}`
  return {
    success: true,
    provider,
    data: {
      id: requestId,
      text: "text" in response ? response.text : "",
      status: "completed"
    },
    extended: {},
    tracking: { requestId },
    raw: response
  }
}
