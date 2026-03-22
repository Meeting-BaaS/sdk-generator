/**
 * AssemblyAI API mappers: unified types ↔ AssemblyAI API types
 */

import type {
  StreamingCallbacks,
  StreamingOptions,
  TranscribeOptions,
  UnifiedTranscriptResponse
} from "../../router/types"
import type { ProviderCapabilities } from "../../router/types"
import { mapEncodingToProvider } from "../../router/audio-encoding-types"

import type { Transcript } from "../../generated/assemblyai/schema/transcript"
import type { TranscriptParams } from "../../generated/assemblyai/schema/transcriptParams"
import type { TranscriptListItem } from "../../generated/assemblyai/schema/transcriptListItem"
import type { TranscriptWord } from "../../generated/assemblyai/schema/transcriptWord"
import type { TranscriptUtterance } from "../../generated/assemblyai/schema/transcriptUtterance"
import type { TranscriptOptionalParamsSpeechModel } from "../../generated/assemblyai/schema/transcriptOptionalParamsSpeechModel"
import type {
  BeginEvent,
  TurnEvent,
  TerminationEvent,
  ErrorEvent,
  StreamingEventMessage,
  StreamingWord
} from "../../generated/assemblyai/streaming-types"

export function mapToTranscribeRequest(
  audioUrl: string,
  options?: TranscribeOptions
): TranscriptParams {
  const request: TranscriptParams = {
    ...options?.assemblyai,
    audio_url: audioUrl,
    punctuate: options?.assemblyai?.punctuate ?? true,
    format_text: options?.assemblyai?.format_text ?? true
  }

  if (!options) return request

  if (options.model) {
    request.speech_model = options.model as TranscriptOptionalParamsSpeechModel
  }
  if (options.language) {
    const languageCode = options.language.includes("_")
      ? options.language
      : `${options.language}_us`
    request.language_code = languageCode
  }
  if (options.languageDetection) request.language_detection = true
  if (options.diarization) {
    request.speaker_labels = true
    if (options.speakersExpected) request.speakers_expected = options.speakersExpected
  }
  if (options.customVocabulary && options.customVocabulary.length > 0) {
    request.word_boost = options.customVocabulary
    request.boost_param = request.boost_param ?? "high"
  }
  if (options.summarization) {
    request.summarization = true
    request.summary_model = request.summary_model ?? "informative"
    request.summary_type = request.summary_type ?? "bullets"
  }
  if (options.sentimentAnalysis) request.sentiment_analysis = true
  if (options.entityDetection) request.entity_detection = true
  if (options.piiRedaction) request.redact_pii = true
  if (options.webhookUrl) request.webhook_url = options.webhookUrl

  return request
}

function extractSpeakers(transcript: Transcript) {
  if (!transcript.utterances || transcript.utterances.length === 0) return undefined
  const speakerSet = new Set<string>()
  transcript.utterances.forEach((u: TranscriptUtterance) => {
    if (u.speaker) speakerSet.add(u.speaker)
  })
  if (speakerSet.size === 0) return undefined
  return Array.from(speakerSet).map((id) => ({ id, label: id }))
}

function extractWords(transcript: Transcript) {
  if (!transcript.words || transcript.words.length === 0) return undefined
  return transcript.words.map((w: TranscriptWord) => ({
    word: w.text,
    start: w.start / 1000,
    end: w.end / 1000,
    confidence: w.confidence,
    speaker: w.speaker || undefined
  }))
}

function extractUtterances(transcript: Transcript) {
  if (!transcript.utterances || transcript.utterances.length === 0) return undefined
  return transcript.utterances.map((u: TranscriptUtterance) => ({
    text: u.text,
    start: u.start / 1000,
    end: u.end / 1000,
    speaker: u.speaker || undefined,
    confidence: u.confidence,
    words: u.words.map((w: TranscriptWord) => ({
      word: w.text,
      start: w.start / 1000,
      end: w.end / 1000,
      confidence: w.confidence
    }))
  }))
}

export function mapFromAssemblyAIResponse(
  response: Transcript,
  provider: "assemblyai",
  capabilities: ProviderCapabilities
): UnifiedTranscriptResponse<"assemblyai"> {
  let status: "queued" | "processing" | "completed" | "error"
  switch (response.status) {
    case "queued":
      status = "queued"
      break
    case "processing":
      status = "processing"
      break
    case "completed":
      status = "completed"
      break
    case "error":
      status = "error"
      break
    default:
      status = "queued"
  }

  if (response.status === "error") {
    return {
      success: false,
      provider,
      error: {
        code: "TRANSCRIPTION_ERROR",
        message: response.error || "Transcription failed"
      },
      raw: response
    }
  }

  return {
    success: true,
    provider,
    data: {
      id: response.id,
      text: response.text || "",
      confidence: response.confidence !== null ? response.confidence : undefined,
      status,
      language: response.language_code,
      duration: response.audio_duration ? response.audio_duration / 1000 : undefined,
      speakers: extractSpeakers(response),
      words: extractWords(response),
      utterances: extractUtterances(response),
      summary: response.summary || undefined,
      metadata: {
        sourceAudioUrl: response.audio_url,
        audioFileAvailable: capabilities.getAudioFile ?? false
      }
    },
    extended: {
      chapters: response.chapters || undefined,
      entities: response.entities || undefined,
      sentimentResults: response.sentiment_analysis_results || undefined,
      highlights: response.auto_highlights_result || undefined,
      contentSafety: response.content_safety_labels || undefined,
      topics: response.iab_categories_result || undefined,
      languageConfidence: response.language_confidence ?? undefined,
      throttled: response.throttled ?? undefined
    },
    tracking: { requestId: response.id },
    raw: response
  }
}

export function mapFromAssemblyAIListItem(
  item: TranscriptListItem,
  provider: "assemblyai",
  capabilities: ProviderCapabilities
): UnifiedTranscriptResponse {
  return {
    success: item.status !== "error",
    provider,
    data: {
      id: item.id,
      text: "",
      status: item.status as "queued" | "processing" | "completed" | "error",
      metadata: {
        sourceAudioUrl: item.audio_url,
        audioFileAvailable: capabilities.getAudioFile ?? false,
        createdAt: item.created,
        completedAt: item.completed || undefined,
        resourceUrl: item.resource_url
      }
    },
    error: item.error
      ? { code: "TRANSCRIPTION_ERROR", message: item.error }
      : undefined,
    raw: item
  }
}

export function buildAssemblyAIStreamingUrl(
  wsBaseUrl: string,
  options?: StreamingOptions
): string {
  const params = new URLSearchParams()
  const aaiOpts = options?.assemblyaiStreaming || {}

  const sampleRate = options?.sampleRate || aaiOpts.sampleRate || 16000
  params.append("sample_rate", String(sampleRate))

  const encoding = options?.encoding
    ? mapEncodingToProvider(options.encoding, "assemblyai")
    : aaiOpts.encoding || "pcm_s16le"
  params.append("encoding", encoding)

  if (aaiOpts.speechModel) params.append("speech_model", aaiOpts.speechModel)
  if (aaiOpts.languageDetection) params.append("language_detection", "true")
  if (aaiOpts.endOfTurnConfidenceThreshold !== undefined) {
    params.append("end_of_turn_confidence_threshold", String(aaiOpts.endOfTurnConfidenceThreshold))
  }
  if (aaiOpts.minEndOfTurnSilenceWhenConfident !== undefined) {
    params.append(
      "min_end_of_turn_silence_when_confident",
      String(aaiOpts.minEndOfTurnSilenceWhenConfident)
    )
  }
  if (aaiOpts.maxTurnSilence !== undefined) {
    params.append("max_turn_silence", String(aaiOpts.maxTurnSilence))
  }
  if (aaiOpts.vadThreshold !== undefined) {
    params.append("vad_threshold", String(aaiOpts.vadThreshold))
  }
  if (aaiOpts.formatTurns !== undefined) {
    params.append("format_turns", String(aaiOpts.formatTurns))
  }
  if (aaiOpts.filterProfanity) params.append("filter_profanity", "true")

  const keyterms = options?.customVocabulary || aaiOpts.keyterms
  if (keyterms?.length) keyterms.forEach((t) => params.append("keyterms", t))
  if (aaiOpts.keytermsPrompt?.length) {
    aaiOpts.keytermsPrompt.forEach((p) => params.append("keyterms_prompt", p))
  }
  if (aaiOpts.inactivityTimeout !== undefined) {
    params.append("inactivity_timeout", String(aaiOpts.inactivityTimeout))
  }

  return `${wsBaseUrl}?${params.toString()}`
}

export function handleAssemblyAIWebSocketMessage(
  message: StreamingEventMessage,
  callbacks?: StreamingCallbacks
): void {
  if ("error" in message) {
    callbacks?.onError?.({
      code: "API_ERROR",
      message: (message as ErrorEvent).error
    })
    return
  }

  const typedMessage = message as BeginEvent | TurnEvent | TerminationEvent

  switch (typedMessage.type) {
    case "Begin": {
      const beginMsg = typedMessage as BeginEvent
      callbacks?.onMetadata?.({
        type: "begin",
        sessionId: beginMsg.id,
        expiresAt: new Date(beginMsg.expires_at).toISOString()
      })
      break
    }
    case "Turn": {
      const turnMsg = typedMessage as TurnEvent
      callbacks?.onTranscript?.({
        type: "transcript",
        text: turnMsg.transcript,
        isFinal: turnMsg.end_of_turn,
        confidence: turnMsg.end_of_turn_confidence,
        language: turnMsg.language_code,
        words: turnMsg.words.map((w: StreamingWord) => ({
          word: w.text,
          start: w.start / 1000,
          end: w.end / 1000,
          confidence: w.confidence
        })),
        data: turnMsg
      })
      if (turnMsg.end_of_turn) {
        const words = turnMsg.words
        const start = words.length > 0 ? words[0].start / 1000 : 0
        const end = words.length > 0 ? words[words.length - 1].end / 1000 : 0
        callbacks?.onUtterance?.({
          text: turnMsg.transcript,
          start,
          end,
          confidence: turnMsg.end_of_turn_confidence,
          words: turnMsg.words.map((w: StreamingWord) => ({
            word: w.text,
            start: w.start / 1000,
            end: w.end / 1000,
            confidence: w.confidence
          }))
        })
      }
      break
    }
    case "Termination": {
      const termMsg = typedMessage as TerminationEvent
      callbacks?.onMetadata?.({
        type: "termination",
        audioDurationSeconds: termMsg.audio_duration_seconds,
        sessionDurationSeconds: termMsg.session_duration_seconds
      })
      break
    }
    default:
      callbacks?.onMetadata?.(message as unknown as Record<string, unknown>)
  }
}
