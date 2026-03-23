/**
 * Azure Speech-to-Text API mappers: unified types ↔ Azure API types
 */

import type {
  ProviderCapabilities,
  TranscribeOptions,
  UnifiedTranscriptResponse
} from "../../router/types"
import type { Transcription } from "../../generated/azure/schema/transcription"
import type { TranscriptionProperties } from "../../generated/azure/schema/transcriptionProperties"
import { PunctuationMode } from "../../generated/azure/schema/punctuationMode"
import { ProfanityFilterMode } from "../../generated/azure/schema/profanityFilterMode"
import { Status as AzureStatus } from "../../generated/azure/schema/status"
import { normalizeStatus } from "../../utils/transcription-helpers"

export function normalizeAzureStatus(
  status: unknown
): "queued" | "processing" | "completed" | "error" {
  return normalizeStatus(status?.toString(), "azure")
}

export function mapStatusToAzure(status: string): AzureStatus {
  const statusMap: Record<string, AzureStatus> = {
    completed: AzureStatus.Succeeded,
    succeeded: AzureStatus.Succeeded,
    processing: AzureStatus.Running,
    running: AzureStatus.Running,
    queued: AzureStatus.NotStarted,
    notstarted: AzureStatus.NotStarted,
    error: AzureStatus.Failed,
    failed: AzureStatus.Failed
  }
  return statusMap[status.toLowerCase()] ?? (status as AzureStatus)
}

export function mapToTranscriptionProperties(options?: TranscribeOptions): TranscriptionProperties {
  const properties: TranscriptionProperties = {
    wordLevelTimestampsEnabled: options?.wordTimestamps ?? true,
    punctuationMode: PunctuationMode.DictatedAndAutomatic,
    profanityFilterMode: ProfanityFilterMode.Masked
  }

  if (options?.diarization) {
    properties.diarizationEnabled = true
    if (options.speakersExpected) {
      properties.diarization = {
        speakers: {
          minCount: 1,
          maxCount: options.speakersExpected
        }
      }
    }
  }

  return properties
}

export function mapToTranscriptionRequest(
  audioUrl: string,
  options?: TranscribeOptions
): Partial<Transcription> {
  return {
    displayName: "SDK Transcription",
    description: "",
    locale: options?.language || "en-US",
    contentUrls: [audioUrl],
    properties: mapToTranscriptionProperties(options)
  }
}

export function mapFromAzureResponse(
  transcription: Transcription,
  transcriptionData: {
    combinedRecognizedPhrases?: Array<{ display?: string; lexical?: string }>
    recognizedPhrases?: Array<{
      speaker?: number
      nBest?: Array<{
        confidence?: number
        words?: Array<{
          word: string
          offsetInTicks: number
          durationInTicks: number
          confidence?: number
        }>
      }>
    }>
    duration?: number
  },
  provider: "azure-stt"
): UnifiedTranscriptResponse {
  const combinedPhrases = transcriptionData.combinedRecognizedPhrases || []
  const recognizedPhrases = transcriptionData.recognizedPhrases || []

  const fullText =
    combinedPhrases.map((phrase) => phrase.display || phrase.lexical).join(" ") || ""

  const words = recognizedPhrases.flatMap((phrase) =>
    (phrase.nBest?.[0]?.words || []).map((w) => ({
      word: w.word,
      start: w.offsetInTicks / 10000000,
      end: (w.offsetInTicks + w.durationInTicks) / 10000000,
      confidence: w.confidence,
      speaker: phrase.speaker !== undefined ? phrase.speaker.toString() : undefined
    }))
  )

  const speakers =
    recognizedPhrases.length > 0 && recognizedPhrases[0].speaker !== undefined
      ? Array.from(
          new Set(
            recognizedPhrases.map((p) => p.speaker).filter((s) => s !== undefined)
          )
        ).map((speakerId) => ({
          id: String(speakerId),
          label: `Speaker ${speakerId}`
        }))
      : undefined

  const transcriptionId = transcription.self?.split("/").pop() || ""

  return {
    success: true,
    provider,
    data: {
      id: transcriptionId,
      text: fullText,
      confidence: recognizedPhrases[0]?.nBest?.[0]?.confidence,
      status: "completed" as const,
      language: transcription.locale,
      duration: transcriptionData.duration ? transcriptionData.duration / 10000000 : undefined,
      speakers,
      words: words.length > 0 ? words : undefined,
      createdAt: transcription.createdDateTime,
      completedAt: transcription.lastActionDateTime
    },
    extended: {},
    tracking: { requestId: transcriptionId },
    raw: { transcription, transcriptionData }
  }
}

export function mapFromAzureListItem(
  item: Transcription,
  provider: "azure-stt",
  capabilities: ProviderCapabilities
): UnifiedTranscriptResponse {
  const id = item.self?.split("/").pop() || ""
  const status = normalizeAzureStatus(item.status)

  return {
    success: status !== "error",
    provider,
    data: {
      id,
      text: "",
      status,
      language: item.locale,
      metadata: {
        audioFileAvailable: capabilities.getAudioFile ?? false,
        displayName: item.displayName,
        description: item.description || undefined,
        createdAt: item.createdDateTime,
        lastActionAt: item.lastActionDateTime,
        filesUrl: item.links?.files
      }
    },
    error:
      status === "error"
        ? {
            code: "TRANSCRIPTION_ERROR",
            message: item.properties?.error?.message || "Transcription failed"
          }
        : undefined,
    raw: item
  }
}
