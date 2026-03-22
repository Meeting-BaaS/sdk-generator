/**
 * Speechmatics API mappers: unified types ↔ Speechmatics API types
 */

import type { TranscribeOptions, UnifiedTranscriptResponse } from "../../router/types"
import {
  buildUtterancesFromWords,
  buildTextFromSpeechmaticsResults
} from "../../utils/transcription-helpers"
import type { JobConfig } from "../../generated/speechmatics/schema/jobConfig"
import type { RetrieveTranscriptResponse } from "../../generated/speechmatics/schema/retrieveTranscriptResponse"
import { NotificationConfigContentsItem } from "../../generated/speechmatics/schema/notificationConfigContentsItem"
import { OperatingPoint } from "../../generated/speechmatics/schema/operatingPoint"
import { TranscriptionConfigDiarization } from "../../generated/speechmatics/schema/transcriptionConfigDiarization"
import { SummarizationConfigSummaryType } from "../../generated/speechmatics/schema/summarizationConfigSummaryType"
import { SummarizationConfigSummaryLength } from "../../generated/speechmatics/schema/summarizationConfigSummaryLength"
import { JobDetailsStatus } from "../../generated/speechmatics/schema/jobDetailsStatus"

export function normalizeSpeechmaticsStatus(
  status: string
): "queued" | "processing" | "completed" | "error" {
  switch (status) {
    case JobDetailsStatus.running:
      return "processing"
    case JobDetailsStatus.done:
      return "completed"
    case JobDetailsStatus.rejected:
    case JobDetailsStatus.expired:
    case JobDetailsStatus.deleted:
      return "error"
    default:
      return "queued"
  }
}

export function mapToJobConfig(options?: TranscribeOptions): JobConfig {
  const operatingPoint = (options?.model as OperatingPoint) || OperatingPoint.standard

  const jobConfig: JobConfig = {
    type: "transcription",
    transcription_config: {
      language: options?.language || "en",
      operating_point: operatingPoint
    }
  }

  if (options?.diarization) {
    jobConfig.transcription_config!.diarization = TranscriptionConfigDiarization.speaker
    if (options.speakersExpected) {
      jobConfig.transcription_config!.speaker_diarization_config = {
        speaker_sensitivity: Math.min(1, options.speakersExpected / 10)
      }
    }
  }

  if (options?.sentimentAnalysis) {
    jobConfig.sentiment_analysis_config = {}
  }

  if (options?.summarization) {
    jobConfig.summarization_config = {
      summary_type: SummarizationConfigSummaryType.bullets,
      summary_length: SummarizationConfigSummaryLength.brief
    }
  }

  if (options?.customVocabulary && options.customVocabulary.length > 0) {
    jobConfig.transcription_config!.additional_vocab = options.customVocabulary.map((word) => ({
      content: word
    }))
  }

  if (options?.webhookUrl) {
    jobConfig.notification_config = [{
      url: options.webhookUrl,
      contents: [NotificationConfigContentsItem.transcript]
    }]
  }

  return jobConfig
}

export function mapFromSpeechmaticsResponse(
  response: RetrieveTranscriptResponse,
  provider: "speechmatics"
): UnifiedTranscriptResponse {
  const text = buildTextFromSpeechmaticsResults(response.results)

  const words = response.results
    .filter((r) => r.type === "word" && r.start_time !== undefined && r.end_time !== undefined)
    .map((result) => ({
      word: result.alternatives?.[0]?.content || "",
      start: result.start_time!,
      end: result.end_time!,
      confidence: result.alternatives?.[0]?.confidence,
      speaker: result.alternatives?.[0]?.speaker
    }))

  const speakerSet = new Set<string>()
  words.forEach((w) => {
    if (w.speaker) speakerSet.add(w.speaker)
  })

  const speakers =
    speakerSet.size > 0
      ? Array.from(speakerSet).map((id) => ({
          id,
          label: `Speaker ${id}`
        }))
      : undefined

  const utterances = buildUtterancesFromWords(words)

  return {
    success: true,
    provider,
    data: {
      id: response.job.id,
      text,
      status: "completed",
      language: response.metadata.transcription_config?.language,
      duration: response.job.duration,
      speakers,
      words: words.length > 0 ? words : undefined,
      utterances: utterances.length > 0 ? utterances : undefined,
      summary: response.summary?.content,
      createdAt: response.job.created_at
    },
    extended: {},
    tracking: { requestId: response.job.id },
    raw: response
  }
}
