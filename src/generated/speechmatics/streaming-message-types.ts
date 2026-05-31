/**
 * Speechmatics Streaming Message Types
 * AUTO-GENERATED from AsyncAPI spec - DO NOT EDIT MANUALLY
 *
 * @source specs/speechmatics-asyncapi.yml
 * @version 2.0.0
 * @see https://docs.speechmatics.com/rt-api-ref
 *
 * Regenerate with: pnpm openapi:sync-speechmatics-streaming
 */

import type { RecognitionResult } from "./schema/recognitionResult"

// ── Enum Types ──────────────────────────────────────────────────────────────

/** The following are the possible info types: */
export type InfoType =
  | "recognition_quality"
  | "concurrent_session_usage"

/** The following are the possible warning types: */
export type WarningType =
  | "duration_limit_exceeded"
  | "unsupported_translation_pair"
  | "idle_timeout"
  | "session_timeout"
  | "empty_translation_target_list"
  | "add_audio_after_eos"
  | "speaker_id"

/** The following are the possible error types: */
export type ErrorType =
  | "invalid_message"
  | "invalid_model"
  | "invalid_language"
  | "invalid_config"
  | "invalid_audio_type"
  | "invalid_output_format"
  | "not_authorised"
  | "not_allowed"
  | "job_error"
  | "protocol_error"
  | "quota_exceeded"
  | "timelimit_exceeded"
  | "idle_timeout"
  | "session_timeout"
  | "unknown_error"

/** The direction that words in the language should be written and read in. */
export type WritingDirection =
  | "left-to-right"
  | "right-to-left"

// ── Helper Interfaces ───────────────────────────────────────────────────────

/** Properties of the language pack. */
export interface LanguagePackInfo {
  /** Full descriptive name of the language, e.g. 'Japanese'. */
  language_description?: string
  /** The character to use to separate words. */
  word_delimiter: string
  writing_direction?: WritingDirection
  /** Whether or not ITN (inverse text normalization) is available for the language pack. */
  itn?: boolean
  /** Whether or not language model adaptation has been applied to the language pack. */
  adapted?: boolean
}

export interface RecognitionMetadata {
  start_time: number
  end_time: number
  /** The entire transcript contained in the segment in text format. Providing the entire transcript here is designed for ease of consumption; we have taken care of all the necessary formatting required to concatenate the transcription results into a block of text. This transcript lacks the detailed information however which is contained in the `results` field of the message - such as the timings and confidences for each word. */
  transcript: string
}

export interface EndOfUtteranceMetadata {
  /** The time (in seconds) that the end of utterance was detected. */
  start_time?: number
  /** The time (in seconds) that the end of utterance was detected. */
  end_time?: number
}

export interface TranslatedSentence {
  content: string
  /** The start time (in seconds) of the original transcribed audio segment */
  start_time: number
  /** The end time (in seconds) of the original transcribed audio segment */
  end_time: number
  /** The speaker that uttered the speech if speaker diarization is enabled */
  speaker?: string
}

export interface AudioEventStartData {
  type: string
  /** The time (in seconds) of the audio corresponding to the beginning of the audio event. */
  start_time: number
  /** A confidence score assigned to the audio event. Ranges from 0.0 (least confident) to 1.0 (most confident). */
  confidence: number
}

export interface AudioEventEndData {
  type: string
  end_time: number
}

// ── Server → Client Messages ────────────────────────────────────────────────

export interface RecognitionStarted {
  message: "RecognitionStarted"
  orchestrator_version?: string
  id?: string
  language_pack_info?: LanguagePackInfo
  channel_ids?: string[]
}

export interface AudioAdded {
  message: "AudioAdded"
  seq_no: number
}

export interface ChannelAudioAdded {
  message: "ChannelAudioAdded"
  seq_no: number
  channel: string
}

export interface AddPartialTranscript {
  message: "AddPartialTranscript"
  /** Speechmatics JSON output format version number. */
  format?: string
  metadata: RecognitionMetadata
  results: RecognitionResult[]
  /** The channel identifier to which the audio belongs. This field is only seen in multichannel. */
  channel?: string
}

export interface AddTranscript {
  message: "AddTranscript"
  /** Speechmatics JSON output format version number. */
  format?: string
  metadata: RecognitionMetadata
  results: RecognitionResult[]
  /** The channel identifier to which the audio belongs. This field is only seen in multichannel. */
  channel?: string
}

export interface EndOfUtterance {
  message: "EndOfUtterance"
  metadata: EndOfUtteranceMetadata
  /** The channel identifier to which the EndOfUtterance message belongs. This field is only seen in multichannel. */
  channel?: string
}

export interface EndOfTranscript {
  message: "EndOfTranscript"
}

export interface AudioEventStarted {
  message: "AudioEventStarted"
  event: AudioEventStartData
  /** The channel identifier to which the audio belongs. This field is only seen in multichannel. */
  channel?: string
}

export interface AudioEventEnded {
  message: "AudioEventEnded"
  event: AudioEventEndData
  /** The channel identifier to which the audio belongs. This field is only seen in multichannel. */
  channel?: string
}

export interface Info {
  message: "Info"
  type: InfoType
  reason: string
  code?: number
  seq_no?: number
  /** Only set when `type` is `recognition_quality`. Quality-based model name. It is one of "telephony", "broadcast". The model is selected automatically, for high-quality audio (12kHz+) the broadcast model is used, for lower quality audio the telephony model is used. */
  quality?: string
  /** Only set when `type` is `concurrent_session_usage`. Indicates the current usage (number of active concurrent sessions). */
  usage?: number
  /** Only set when `type` is `concurrent_session_usage`. Indicates the current quota (maximum number of concurrent sessions allowed). */
  quota?: number
  /** Only set when `type` is `concurrent_session_usage`. Indicates the timestamp of the most recent usage update, in the format `YYYY-MM-DDTHH:MM:SSZ` (UTC). This value is updated even when usage exceeds the quota, as it represents the most recent known data. In some cases, it may be empty or outdated due to internal errors preventing successful update. */
  last_updated?: string
}

export interface Warning {
  message: "Warning"
  type: WarningType
  reason: string
  code?: number
  seq_no?: number
  /** Only set when `type` is `duration_limit_exceeded`. Indicates the limit that was exceeded (in seconds). */
  duration_limit?: number
}

export interface Error {
  message: "Error"
  type: ErrorType
  reason: string
  code?: number
  seq_no?: number
}

export interface AddPartialTranslation {
  message: "AddPartialTranslation"
  /** Speechmatics JSON output format version number. */
  format?: string
  /** Language translation relates to given as an ISO language code. */
  language: string
  results: TranslatedSentence[]
}

export interface AddTranslation {
  message: "AddTranslation"
  /** Speechmatics JSON output format version number. */
  format?: string
  /** Language translation relates to given as an ISO language code. */
  language: string
  results: TranslatedSentence[]
}

// ── Convenience Aliases ─────────────────────────────────────────────────────

/** Combined transcript message (partial + final) */
export type SpeechmaticsTranscriptMessage = AddPartialTranscript | AddTranscript

/** Error message alias for adapter compatibility */
export type SpeechmaticsErrorMessage = Error

/** Discriminated union of all server→client messages */
export type SpeechmaticsRealtimeMessage =
  | RecognitionStarted
  | AudioAdded
  | ChannelAudioAdded
  | AddPartialTranscript
  | AddTranscript
  | EndOfUtterance
  | EndOfTranscript
  | AudioEventStarted
  | AudioEventEnded
  | Info
  | Warning
  | Error
  | AddPartialTranslation
  | AddTranslation
