/**
 * Deepgram API mappers: unified types ↔ Deepgram API types
 *
 * Pure mapping functions. Adapters call these to convert between our SDK
 * interface and Deepgram's API request/response shapes.
 */

import type {
  SpeechEvent,
  StreamingCallbacks,
  StreamingOptions,
  TranscribeOptions,
  UnifiedTranscriptResponse
} from "../../router/types"
import type { ListenV1Response } from "../../generated/deepgram/schema/listenV1Response"
import type { ListenV1MediaTranscribeParams } from "../../generated/deepgram/schema/listenV1MediaTranscribeParams"
import type { ListenV1ResponseResultsChannelsItemAlternativesItem } from "../../generated/deepgram/schema/listenV1ResponseResultsChannelsItemAlternativesItem"
import type { ListenV1ResponseResultsChannelsItemAlternativesItemWordsItem } from "../../generated/deepgram/schema/listenV1ResponseResultsChannelsItemAlternativesItemWordsItem"
import type { ListenV1ResponseResultsUtterancesItem } from "../../generated/deepgram/schema/listenV1ResponseResultsUtterancesItem"
import type { ProjectRequestResponse } from "../../generated/deepgram/schema/projectRequestResponse"
import type { ProviderCapabilities } from "../../router/types"

interface DeepgramResultsMessage {
  type: "Results"
  channel_index: [number, number]
  duration: number
  start: number
  is_final: boolean
  speech_final: boolean
  from_finalize?: boolean
  channel: {
    alternatives: Array<{
      transcript: string
      confidence: number
      words?: Array<{
        word: string
        start: number
        end: number
        confidence: number
        punctuated_word?: string
        speaker?: number
      }>
    }>
    detected_language?: string
  }
}

interface DeepgramUtteranceEndMessage {
  type: "UtteranceEnd"
  channel: [number, number]
  last_word_end: number
}

interface DeepgramSpeechStartedMessage {
  type: "SpeechStarted"
  channel: [number, number]
  timestamp: number
}

interface DeepgramMetadataMessage {
  type: "Metadata"
  [key: string]: unknown
}

interface DeepgramCloseStreamMessage {
  type: "CloseStream"
}

interface DeepgramErrorMessage {
  type: "Error"
  description?: string
  message?: string
  variant?: string
}

export type DeepgramRealtimeMessage =
  | DeepgramResultsMessage
  | DeepgramUtteranceEndMessage
  | DeepgramSpeechStartedMessage
  | DeepgramMetadataMessage
  | DeepgramCloseStreamMessage
  | DeepgramErrorMessage

export function mapToTranscriptionParams(
  options?: TranscribeOptions
): ListenV1MediaTranscribeParams {
  if (!options) {
    return {
      punctuate: true,
      utterances: true,
      smart_format: true
    }
  }

  const params: ListenV1MediaTranscribeParams = {
    ...options.deepgram,
    punctuate: options.deepgram?.punctuate ?? true,
    utterances: options.deepgram?.utterances ?? true,
    smart_format: options.deepgram?.smart_format ?? true
  }

  if (options.model) params.model = options.model
  if (options.language) params.language = options.language
  if (options.languageDetection) params.detect_language = true
  if (options.diarization) params.diarize = true
  if (options.customVocabulary?.length) params.keywords = options.customVocabulary
  if (options.summarization) params.summarize = true
  if (options.sentimentAnalysis) params.sentiment = true
  if (options.entityDetection) params.detect_entities = true
  if (options.piiRedaction) params.redact = ["pci", "pii"]
  if (options.webhookUrl) params.callback = options.webhookUrl

  return params
}

function extractSpeakers(response: ListenV1Response) {
  const utterances = response.results.utterances
  if (!utterances?.length) return undefined

  const speakerSet = new Set<number>()
  utterances.forEach((u: ListenV1ResponseResultsUtterancesItem) => {
    if (u.speaker !== undefined) speakerSet.add(u.speaker)
  })
  if (speakerSet.size === 0) return undefined

  return Array.from(speakerSet).map((id) => ({
    id: id.toString(),
    label: `Speaker ${id}`
  }))
}

function extractWords(alternative: ListenV1ResponseResultsChannelsItemAlternativesItem) {
  if (!alternative.words?.length) return undefined
  return alternative.words.map(
    (w: ListenV1ResponseResultsChannelsItemAlternativesItemWordsItem) => ({
      word: w.word || "",
      start: w.start || 0,
      end: w.end || 0,
      confidence: w.confidence,
      speaker: undefined
    })
  )
}

function extractUtterances(response: ListenV1Response) {
  const utterances = response.results.utterances
  if (!utterances?.length) return undefined

  return utterances.map((u: ListenV1ResponseResultsUtterancesItem) => ({
    text: u.transcript || "",
    start: u.start || 0,
    end: u.end || 0,
    speaker: u.speaker?.toString(),
    confidence: u.confidence,
    words:
      u.words?.map((w) => ({
        word: w.word || "",
        start: w.start || 0,
        end: w.end || 0,
        confidence: w.confidence
      })) ?? []
  }))
}

function extractSummary(
  alternative: ListenV1ResponseResultsChannelsItemAlternativesItem
): string | undefined {
  if (!alternative.summaries?.length) return undefined
  return alternative.summaries
    .map((s) => s.summary)
    .filter(Boolean)
    .join(" ")
}

export function mapFromDeepgramResponse(
  response: ListenV1Response,
  provider: "deepgram"
): UnifiedTranscriptResponse<"deepgram"> {
  const channel = response.results.channels?.[0]
  const alternative = channel?.alternatives?.[0]

  if (!alternative) {
    return {
      success: false,
      provider,
      error: {
        code: "NO_RESULTS",
        message: "No transcription results returned by Deepgram"
      },
      raw: response
    }
  }

  return {
    success: true,
    provider,
    data: {
      id: response.metadata?.request_id || "",
      text: alternative.transcript || "",
      confidence: alternative.confidence,
      status: "completed",
      language: channel?.detected_language || undefined,
      duration: response.metadata?.duration,
      speakers: extractSpeakers(response),
      words: extractWords(alternative),
      utterances: extractUtterances(response),
      summary: extractSummary(alternative)
    },
    extended: {
      metadata: response.metadata,
      requestId: response.metadata?.request_id,
      sha256: response.metadata?.sha256,
      modelInfo: response.metadata?.model_info,
      tags: response.metadata?.tags
    },
    tracking: {
      requestId: response.metadata?.request_id,
      audioHash: response.metadata?.sha256
    },
    raw: response
  }
}

export function mapFromDeepgramRequestItem(
  item: ProjectRequestResponse,
  provider: "deepgram",
  capabilities: ProviderCapabilities
): UnifiedTranscriptResponse {
  const isSuccess = (item.code || 0) < 400

  return {
    success: isSuccess,
    provider,
    data: {
      id: item.request_id || "",
      text: "",
      status: isSuccess ? "completed" : "error",
      metadata: {
        audioFileAvailable: capabilities.getAudioFile ?? false,
        createdAt: item.created,
        apiPath: item.path,
        apiKeyId: item.api_key_id,
        deployment: item.deployment,
        callbackUrl: item.callback,
        responseCode: item.code
      }
    },
    error: !isSuccess
      ? {
          code: "REQUEST_FAILED",
          message: `Request failed with status code ${item.code}`
        }
      : undefined,
    raw: item
  }
}

export function buildDeepgramStreamingUrl(
  wsBaseUrl: string,
  options?: StreamingOptions
): string {
  const params = new URLSearchParams()
  const dgOpts = options?.deepgramStreaming || {}

  if (options?.encoding || dgOpts.encoding) {
    params.append("encoding", (options?.encoding || dgOpts.encoding) as string)
  }
  if (options?.sampleRate || dgOpts.sampleRate) {
    params.append("sample_rate", String(options?.sampleRate || dgOpts.sampleRate))
  }
  if (options?.channels || dgOpts.channels) {
    params.append("channels", String(options?.channels || dgOpts.channels))
  }
  if (options?.language || dgOpts.language) {
    params.append("language", (options?.language || dgOpts.language) as string)
  }
  if (options?.model || dgOpts.model) {
    params.append("model", (options?.model || dgOpts.model) as string)
  }
  if (dgOpts.version) params.append("version", dgOpts.version as string)
  if (options?.languageDetection || dgOpts.languageDetection) {
    params.append("detect_language", "true")
  }
  if (options?.diarization || dgOpts.diarization) params.append("diarize", "true")
  if (options?.interimResults || dgOpts.interimResults) {
    params.append("interim_results", "true")
  }
  if (dgOpts.punctuate !== undefined) params.append("punctuate", String(dgOpts.punctuate))
  if (dgOpts.smartFormat !== undefined) params.append("smart_format", String(dgOpts.smartFormat))
  if (dgOpts.fillerWords) params.append("filler_words", "true")
  if (dgOpts.numerals) params.append("numerals", "true")
  if (dgOpts.measurements) params.append("measurements", "true")
  if (dgOpts.paragraphs) params.append("paragraphs", "true")
  if (dgOpts.profanityFilter) params.append("profanity_filter", "true")
  if (dgOpts.dictation) params.append("dictation", "true")
  if (dgOpts.utteranceSplit) params.append("utt_split", String(dgOpts.utteranceSplit))
  if (options?.summarization || dgOpts.summarize) params.append("summarize", "true")
  if (options?.sentimentAnalysis || dgOpts.sentiment) params.append("sentiment", "true")
  if (options?.entityDetection || dgOpts.detectEntities) params.append("detect_entities", "true")
  if (dgOpts.topics) params.append("topics", "true")
  if (dgOpts.customTopic?.length) dgOpts.customTopic.forEach((t) => params.append("custom_topic", t))
  if (dgOpts.customTopicMode) params.append("custom_topic_mode", dgOpts.customTopicMode)
  if (dgOpts.intents) params.append("intents", "true")
  if (dgOpts.customIntent?.length) {
    dgOpts.customIntent.forEach((i) => params.append("custom_intent", i))
  }
  if (dgOpts.customIntentMode) params.append("custom_intent_mode", dgOpts.customIntentMode)

  const keywords = options?.customVocabulary || dgOpts.keywords
  if (keywords) {
    const list = Array.isArray(keywords) ? keywords : [keywords]
    list.forEach((kw) => params.append("keywords", kw))
  }
  if (dgOpts.keyterm?.length) dgOpts.keyterm.forEach((t) => params.append("keyterm", t))

  if (options?.piiRedaction || dgOpts.redact) {
    if (Array.isArray(dgOpts.redact)) dgOpts.redact.forEach((r) => params.append("redact", r))
    else {
      params.append("redact", "pii")
      params.append("redact", "pci")
    }
  }

  if (dgOpts.callback) params.append("callback", dgOpts.callback)
  if (dgOpts.tag?.length) dgOpts.tag.forEach((t) => params.append("tag", t))
  if (dgOpts.extra) params.append("extra", JSON.stringify(dgOpts.extra))

  if (options?.endpointing !== undefined || dgOpts.endpointing !== undefined) {
    const ep = options?.endpointing ?? dgOpts.endpointing
    if (ep === false) params.append("endpointing", "false")
    else if (typeof ep === "number") params.append("endpointing", String(ep))
  }
  if (dgOpts.vadThreshold !== undefined) params.append("vad_events", "true")

  return `${wsBaseUrl}?${params.toString()}`
}

export function handleDeepgramWebSocketMessage(
  message: DeepgramRealtimeMessage,
  callbacks?: StreamingCallbacks
): void {
  switch (message.type) {
    case "Results": {
      const channel = message.channel.alternatives[0]
      if (channel && channel.transcript) {
        callbacks?.onTranscript?.({
          type: "transcript",
          text: channel.transcript,
          isFinal: message.is_final,
          confidence: channel.confidence,
          language: message.channel.detected_language,
          words: channel.words?.map((w) => ({
            word: w.punctuated_word || w.word,
            start: w.start,
            end: w.end,
            confidence: w.confidence,
            speaker: w.speaker?.toString()
          })),
          data: message
        })
      }
      if (message.speech_final && channel && channel.transcript) {
        callbacks?.onUtterance?.({
          text: channel.transcript,
          start: message.start,
          end: message.start + message.duration,
          confidence: channel.confidence,
          words:
            channel.words?.map((w) => ({
              word: w.punctuated_word || w.word,
              start: w.start,
              end: w.end,
              confidence: w.confidence
            })) ?? []
        })
      }
      break
    }
    case "SpeechStarted":
      callbacks?.onSpeechStart?.({
        type: "speech_start",
        timestamp: message.timestamp,
        channel: message.channel[0]
      } as SpeechEvent)
      break
    case "UtteranceEnd":
      callbacks?.onSpeechEnd?.({
        type: "speech_end",
        timestamp: message.last_word_end,
        channel: message.channel[0]
      } as SpeechEvent)
      break
    case "Metadata":
      callbacks?.onMetadata?.(message as Record<string, unknown>)
      break
    case "Error":
      callbacks?.onError?.({
        code: message.variant || "DEEPGRAM_ERROR",
        message: message.message || message.description || "Unknown error",
        details: message
      })
      break
    case "CloseStream":
      break
    default:
      callbacks?.onMetadata?.(message as Record<string, unknown>)
  }
}
