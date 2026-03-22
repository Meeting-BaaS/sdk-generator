/**
 * Gladia API mappers: unified types ↔ Gladia API types
 */

import type {
  StreamingCallbacks,
  StreamingOptions,
  TranscribeOptions,
  UnifiedTranscriptResponse
} from "../../router/types"
import type { ProviderCapabilities } from "../../router/types"
import { mapEncodingToProvider } from "../../router/audio-encoding-types"
import { ERROR_CODES } from "../../utils/errors"
import {
  extractSpeakersFromUtterances,
  extractWords as extractWordsUtil,
  normalizeStatus
} from "../../utils/transcription-helpers"
import { validateEnumValue } from "../../utils/validation"

import type { InitTranscriptionRequest } from "../../generated/gladia/schema/initTranscriptionRequest"
import type { PreRecordedResponse } from "../../generated/gladia/schema/preRecordedResponse"
import type { StreamingRequest } from "../../generated/gladia/schema/streamingRequest"
import type { ListTranscriptionResponseItemsItem } from "../../generated/gladia/schema/listTranscriptionResponseItemsItem"
import type { TranscriptionDTO } from "../../generated/gladia/schema/transcriptionDTO"
import type { UtteranceDTO } from "../../generated/gladia/schema/utteranceDTO"
import type { WordDTO } from "../../generated/gladia/schema/wordDTO"
import type { StreamingResponse } from "../../generated/gladia/schema/streamingResponse"
import { StreamingSupportedSampleRateEnum } from "../../generated/gladia/schema/streamingSupportedSampleRateEnum"
import { StreamingSupportedBitDepthEnum } from "../../generated/gladia/schema/streamingSupportedBitDepthEnum"
import type { StreamingSupportedEncodingEnum } from "../../generated/gladia/schema/streamingSupportedEncodingEnum"
import type { StreamingSupportedModels } from "../../generated/gladia/schema/streamingSupportedModels"
import type { TranscriptionLanguageCodeEnum } from "../../generated/gladia/schema/transcriptionLanguageCodeEnum"

import type { TranscriptMessage } from "../../generated/gladia/schema/transcriptMessage"
import type { SpeechStartMessage } from "../../generated/gladia/schema/speechStartMessage"
import type { SpeechEndMessage } from "../../generated/gladia/schema/speechEndMessage"
import type { TranslationMessage } from "../../generated/gladia/schema/translationMessage"
import type { SentimentAnalysisMessage } from "../../generated/gladia/schema/sentimentAnalysisMessage"
import type { NamedEntityRecognitionMessage } from "../../generated/gladia/schema/namedEntityRecognitionMessage"
import type { PostSummarizationMessage } from "../../generated/gladia/schema/postSummarizationMessage"
import type { PostChapterizationMessage } from "../../generated/gladia/schema/postChapterizationMessage"
import type { AudioChunkAckMessage } from "../../generated/gladia/schema/audioChunkAckMessage"
import type { StartSessionMessage } from "../../generated/gladia/schema/startSessionMessage"
import type { StartRecordingMessage } from "../../generated/gladia/schema/startRecordingMessage"
import type { StopRecordingAckMessage } from "../../generated/gladia/schema/stopRecordingAckMessage"
import type { EndRecordingMessage } from "../../generated/gladia/schema/endRecordingMessage"
import type { EndSessionMessage } from "../../generated/gladia/schema/endSessionMessage"
import type { PostTranscriptMessage } from "../../generated/gladia/schema/postTranscriptMessage"
import type { PostFinalTranscriptMessage } from "../../generated/gladia/schema/postFinalTranscriptMessage"

export function mapToTranscribeRequest(
  audioUrl: string,
  options?: TranscribeOptions
): InitTranscriptionRequest {
  const request: InitTranscriptionRequest = {
    ...options?.gladia,
    audio_url: audioUrl
  }

  if (!options) return request

  if (options.language || options.codeSwitching || options.codeSwitchingConfig) {
    request.language_config = {
      ...options.codeSwitchingConfig,
      languages: options.language
        ? [options.language as TranscriptionLanguageCodeEnum]
        : request.language_config?.languages,
      code_switching: options.codeSwitching ?? request.language_config?.code_switching
    }
  }

  if (options.diarization) {
    request.diarization = true
    if (options.speakersExpected) {
      request.diarization_config = {
        ...request.diarization_config,
        number_of_speakers: options.speakersExpected
      }
    }
  }

  if (options.customVocabulary?.length) {
    request.custom_vocabulary = true
    request.custom_vocabulary_config = {
      ...request.custom_vocabulary_config,
      vocabulary: options.customVocabulary
    }
  }

  if (options.summarization) request.summarization = true
  if (options.sentimentAnalysis) request.sentiment_analysis = true
  if (options.entityDetection) request.named_entity_recognition = true

  if (options.webhookUrl) {
    request.callback = true
    request.callback_config = {
      ...request.callback_config,
      url: options.webhookUrl
    }
  }

  if (options.audioToLlm) {
    request.audio_to_llm = true
    request.audio_to_llm_config = options.audioToLlm
  }

  return request
}

function extractSpeakers(transcription: TranscriptionDTO | undefined) {
  return extractSpeakersFromUtterances(
    transcription?.utterances,
    (u: UtteranceDTO) => u.speaker,
    (id) => `Speaker ${id}`
  )
}

function extractWords(transcription: TranscriptionDTO | undefined) {
  if (!transcription?.utterances) return undefined
  const allWords = transcription.utterances.flatMap((u: UtteranceDTO) =>
    u.words.map((word: WordDTO) => ({ word, speaker: u.speaker }))
  )
  return extractWordsUtil(allWords, (item) => ({
    word: item.word.word,
    start: item.word.start,
    end: item.word.end,
    confidence: item.word.confidence,
    speaker: item.speaker?.toString()
  }))
}

function extractUtterances(transcription: TranscriptionDTO | undefined) {
  if (!transcription?.utterances) return undefined
  return transcription.utterances.map((u: UtteranceDTO) => ({
    text: u.text,
    start: u.start,
    end: u.end,
    speaker: u.speaker?.toString(),
    confidence: u.confidence,
    words: u.words.map((w: WordDTO) => ({
      word: w.word,
      start: w.start,
      end: w.end,
      confidence: w.confidence
    }))
  }))
}

export function mapFromGladiaResponse(
  response: PreRecordedResponse,
  provider: "gladia",
  capabilities: ProviderCapabilities
): UnifiedTranscriptResponse<"gladia"> {
  const status = normalizeStatus(response.status, "gladia")

  if (response.status === "error") {
    return {
      success: false,
      provider,
      error: {
        code: response.error_code?.toString() || ERROR_CODES.TRANSCRIPTION_ERROR,
        message: "Transcription failed",
        statusCode: response.error_code || undefined
      },
      raw: response
    }
  }

  const result = response.result
  const transcription = result?.transcription

  return {
    success: true,
    provider,
    data: {
      id: response.id,
      text: transcription?.full_transcript || "",
      confidence: undefined,
      status,
      language: transcription?.languages?.[0],
      duration: undefined,
      speakers: extractSpeakers(transcription),
      words: extractWords(transcription),
      utterances: extractUtterances(transcription),
      summary: result?.summarization?.results || undefined,
      metadata: {
        sourceAudioUrl: response.file?.source ?? undefined,
        audioFileAvailable: capabilities.getAudioFile ?? false,
        filename: response.file?.filename ?? undefined,
        audioDuration: response.file?.audio_duration ?? undefined,
        requestParams: response.request_params
      },
      createdAt: response.created_at,
      completedAt: response.completed_at || undefined
    },
    extended: {
      translation: result?.translation || undefined,
      moderation: result?.moderation || undefined,
      entities: result?.named_entity_recognition || undefined,
      sentiment: result?.sentiment_analysis || undefined,
      audioToLlm: result?.audio_to_llm || undefined,
      chapters: result?.chapterization || undefined,
      speakerReidentification: result?.speaker_reidentification || undefined,
      structuredData: result?.structured_data_extraction || undefined,
      customMetadata: response.custom_metadata || undefined
    },
    tracking: { requestId: response.request_id },
    raw: response
  }
}

export function mapFromGladiaListItem(
  item: ListTranscriptionResponseItemsItem,
  provider: "gladia",
  capabilities: ProviderCapabilities
): UnifiedTranscriptResponse {
  const preRecorded = item as PreRecordedResponse
  const streaming = item as StreamingResponse
  const isLive = "kind" in item && item.kind === "live"
  const id = preRecorded.id || streaming.id
  const status = normalizeStatus(preRecorded.status || streaming.status, "gladia")
  const text = preRecorded.result?.transcription?.full_transcript || ""
  const file = preRecorded.file

  return {
    success: status !== "error",
    provider,
    data: {
      id,
      text,
      status,
      duration: file?.audio_duration ?? undefined,
      metadata: {
        sourceAudioUrl: file?.source ?? undefined,
        audioFileAvailable: capabilities.getAudioFile ?? false,
        filename: file?.filename ?? undefined,
        audioDuration: file?.audio_duration ?? undefined,
        numberOfChannels: file?.number_of_channels ?? undefined,
        createdAt: preRecorded.created_at || streaming.created_at,
        completedAt: preRecorded.completed_at || streaming.completed_at || undefined,
        kind: isLive ? "live" : "pre-recorded",
        customMetadata: preRecorded.custom_metadata || streaming.custom_metadata
      }
    },
    error:
      preRecorded.error_code || streaming.error_code
        ? {
            code: (preRecorded.error_code || streaming.error_code)?.toString() || "ERROR",
            message: "Transcription failed"
          }
        : undefined,
    raw: item
  }
}

export function mapToStreamingRequest(options?: StreamingOptions): StreamingRequest {
  const gladiaOpts = options?.gladiaStreaming || {}

  const validatedSampleRate = options?.sampleRate
    ? validateEnumValue(
        options.sampleRate,
        StreamingSupportedSampleRateEnum,
        "sample rate",
        "Gladia"
      )
    : undefined

  const validatedBitDepth = options?.bitDepth
    ? validateEnumValue(
        options.bitDepth,
        StreamingSupportedBitDepthEnum,
        "bit depth",
        "Gladia"
      )
    : undefined

  const streamingRequest: StreamingRequest = {
    ...gladiaOpts,
    encoding: options?.encoding
      ? (mapEncodingToProvider(options.encoding, "gladia") as StreamingSupportedEncodingEnum)
      : undefined,
    sample_rate: validatedSampleRate,
    bit_depth: validatedBitDepth,
    channels: options?.channels,
    model: (options?.model as StreamingSupportedModels) ?? gladiaOpts.model,
    endpointing: options?.endpointing ?? gladiaOpts.endpointing,
    maximum_duration_without_endpointing:
      options?.maxSilence ?? gladiaOpts.maximum_duration_without_endpointing
  }

  if (options?.language || options?.codeSwitching || gladiaOpts.language_config) {
    streamingRequest.language_config = {
      ...gladiaOpts.language_config,
      languages: options?.language
        ? [options.language as TranscriptionLanguageCodeEnum]
        : gladiaOpts.language_config?.languages,
      code_switching: options?.codeSwitching ?? gladiaOpts.language_config?.code_switching
    }
  }

  if (gladiaOpts.pre_processing) {
    streamingRequest.pre_processing = gladiaOpts.pre_processing
  }

  const realtimeProcessing = gladiaOpts.realtime_processing || {}
  const hasRealtimeOptions =
    options?.customVocabulary ||
    options?.sentimentAnalysis ||
    options?.entityDetection ||
    realtimeProcessing.translation ||
    realtimeProcessing.custom_vocabulary ||
    realtimeProcessing.custom_spelling ||
    realtimeProcessing.named_entity_recognition ||
    realtimeProcessing.sentiment_analysis

  if (hasRealtimeOptions) {
    streamingRequest.realtime_processing = {
      ...realtimeProcessing,
      custom_vocabulary:
        (options?.customVocabulary && options.customVocabulary.length > 0) ||
        realtimeProcessing.custom_vocabulary,
      custom_vocabulary_config:
        options?.customVocabulary && options.customVocabulary.length > 0
          ? {
              ...realtimeProcessing.custom_vocabulary_config,
              vocabulary: options.customVocabulary
            }
          : realtimeProcessing.custom_vocabulary_config,
      sentiment_analysis: options?.sentimentAnalysis ?? realtimeProcessing.sentiment_analysis,
      named_entity_recognition:
        options?.entityDetection ?? realtimeProcessing.named_entity_recognition
    }
  }

  const postProcessing = gladiaOpts.post_processing || {}
  if (options?.summarization || postProcessing.summarization || postProcessing.chapterization) {
    streamingRequest.post_processing = {
      ...postProcessing,
      summarization: options?.summarization ?? postProcessing.summarization
    }
  }

  if (gladiaOpts.messages_config) {
    streamingRequest.messages_config = gladiaOpts.messages_config
  } else if (options?.interimResults !== undefined) {
    streamingRequest.messages_config = {
      receive_partial_transcripts: options.interimResults,
      receive_final_transcripts: true
    }
  }

  if (gladiaOpts.callback || gladiaOpts.callback_config) {
    streamingRequest.callback = gladiaOpts.callback
    streamingRequest.callback_config = gladiaOpts.callback_config
  }

  if (gladiaOpts.custom_metadata) {
    streamingRequest.custom_metadata = gladiaOpts.custom_metadata
  }

  return streamingRequest
}

export function handleGladiaWebSocketMessage(
  message: unknown,
  callbacks?: StreamingCallbacks
): void {
  const msg = message as Record<string, unknown>
  const messageType = msg.type as string

  switch (messageType) {
    case "transcript": {
      const tm = message as TranscriptMessage
      const data = tm.data
      const utterance = data.utterance
      callbacks?.onTranscript?.({
        type: "transcript",
        text: utterance.text,
        isFinal: data.is_final,
        confidence: utterance.confidence,
        language: utterance.language,
        channel: utterance.channel,
        speaker: utterance.speaker?.toString(),
        words: utterance.words.map((w) => ({
          word: w.word,
          start: w.start,
          end: w.end,
          confidence: w.confidence
        })),
        data: message
      })
      break
    }
    case "utterance": {
      const tm = message as TranscriptMessage
      const utterance = tm.data.utterance
      callbacks?.onUtterance?.({
        text: utterance.text,
        start: utterance.start,
        end: utterance.end,
        speaker: utterance.speaker?.toString(),
        confidence: utterance.confidence,
        words: utterance.words.map((w) => ({
          word: w.word,
          start: w.start,
          end: w.end,
          confidence: w.confidence
        }))
      })
      break
    }
    case "post_transcript": {
      const pt = message as PostTranscriptMessage
      callbacks?.onTranscript?.({
        type: "transcript",
        text: pt.data?.full_transcript || "",
        isFinal: true,
        data: message
      })
      break
    }
    case "post_final_transcript": {
      const pft = message as PostFinalTranscriptMessage
      callbacks?.onTranscript?.({
        type: "transcript",
        text: pft.data?.transcription?.full_transcript || "",
        isFinal: true,
        data: message
      })
      break
    }
    case "speech_start": {
      const ss = message as SpeechStartMessage
      callbacks?.onSpeechStart?.({
        type: "speech_start",
        timestamp: ss.data.time,
        channel: ss.data.channel,
        sessionId: ss.session_id
      })
      break
    }
    case "speech_end": {
      const se = message as SpeechEndMessage
      callbacks?.onSpeechEnd?.({
        type: "speech_end",
        timestamp: se.data.time,
        channel: se.data.channel,
        sessionId: se.session_id
      })
      break
    }
    case "translation": {
      const tr = message as TranslationMessage
      if (tr.error) {
        callbacks?.onError?.({
          code: ERROR_CODES.TRANSCRIPTION_ERROR,
          message: "Translation failed",
          details: tr.error
        })
      } else if (tr.data) {
        callbacks?.onTranslation?.({
          utteranceId: tr.data.utterance_id,
          original: tr.data.utterance.text,
          targetLanguage: tr.data.target_language,
          translatedText: tr.data.translated_utterance.text,
          isFinal: true
        })
      }
      break
    }
    case "sentiment_analysis": {
      const sa = message as SentimentAnalysisMessage
      if (sa.error) {
        callbacks?.onError?.({
          code: ERROR_CODES.TRANSCRIPTION_ERROR,
          message: "Sentiment analysis failed",
          details: sa.error
        })
      } else if (sa.data) {
        for (const result of sa.data.results) {
          callbacks?.onSentiment?.({
            utteranceId: sa.data.utterance_id,
            sentiment: result.sentiment,
            confidence: undefined
          })
        }
      }
      break
    }
    case "named_entity_recognition": {
      const ner = message as NamedEntityRecognitionMessage
      if (ner.error) {
        callbacks?.onError?.({
          code: ERROR_CODES.TRANSCRIPTION_ERROR,
          message: "Named entity recognition failed",
          details: ner.error
        })
      } else if (ner.data) {
        for (const entity of ner.data.results) {
          callbacks?.onEntity?.({
            utteranceId: ner.data.utterance_id,
            text: entity.text,
            type: entity.entity_type,
            start: entity.start,
            end: entity.end
          })
        }
      }
      break
    }
    case "post_summarization": {
      const ps = message as PostSummarizationMessage
      if (ps.error) {
        callbacks?.onSummarization?.({
          summary: "",
          error: typeof ps.error === "string" ? ps.error : "Summarization failed"
        })
      } else if (ps.data) {
        callbacks?.onSummarization?.({ summary: ps.data.results })
      }
      break
    }
    case "post_chapterization": {
      const pc = message as PostChapterizationMessage
      if (pc.error) {
        callbacks?.onChapterization?.({
          chapters: [],
          error: typeof pc.error === "string" ? pc.error : "Chapterization failed"
        })
      } else if (pc.data) {
        callbacks?.onChapterization?.({
          chapters: pc.data.results.map((ch) => ({
            headline: ch.headline,
            summary: ch.summary || ch.abstractive_summary || ch.extractive_summary || "",
            start: ch.start,
            end: ch.end
          }))
        })
      }
      break
    }
    case "audio_chunk_ack": {
      const aca = message as AudioChunkAckMessage
      if (aca.error) {
        callbacks?.onError?.({
          code: ERROR_CODES.TRANSCRIPTION_ERROR,
          message: "Audio chunk not acknowledged",
          details: aca.error
        })
      } else if (aca.data) {
        callbacks?.onAudioAck?.({
          byteRange: aca.data.byte_range as [number, number],
          timeRange: aca.data.time_range as [number, number],
          timestamp: aca.created_at
        })
      }
      break
    }
    case "stop_recording_ack": {
      const sra = message as StopRecordingAckMessage
      if (sra.error) {
        callbacks?.onError?.({
          code: ERROR_CODES.TRANSCRIPTION_ERROR,
          message: "Stop recording not acknowledged",
          details: sra.error
        })
      }
      break
    }
    case "start_session": {
      const ss = message as StartSessionMessage
      callbacks?.onLifecycle?.({
        eventType: "start_session",
        timestamp: ss.created_at,
        sessionId: ss.session_id
      })
      break
    }
    case "start_recording": {
      const sr = message as StartRecordingMessage
      callbacks?.onLifecycle?.({
        eventType: "start_recording",
        timestamp: sr.created_at,
        sessionId: sr.session_id
      })
      break
    }
    case "end_recording": {
      const er = message as EndRecordingMessage
      callbacks?.onLifecycle?.({
        eventType: "end_recording",
        timestamp: er.created_at,
        sessionId: er.session_id
      })
      break
    }
    case "end_session": {
      const es = message as EndSessionMessage
      callbacks?.onLifecycle?.({
        eventType: "end_session",
        timestamp: es.created_at,
        sessionId: es.session_id
      })
      break
    }
    case "metadata":
      callbacks?.onMetadata?.(msg)
      break
    case "error": {
      const em = msg as { error?: { code?: string; message?: string } }
      callbacks?.onError?.({
        code: em.error?.code || ERROR_CODES.TRANSCRIPTION_ERROR,
        message: em.error?.message || "Unknown streaming error",
        details: msg
      })
      break
    }
    default:
      callbacks?.onMetadata?.(msg)
  }
}
