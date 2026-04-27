/**
 * ElevenLabs WebSocket Realtime STT Types (Wire Format)
 * EXTRACTED FROM OFFICIAL SDK - DO NOT EDIT MANUALLY
 *
 * @source https://github.com/elevenlabs/elevenlabs-js
 * @path src/serialization/types/ (Raw wire format interfaces)
 * @sdk elevenlabs (Fern-generated)
 *
 * These types define the JSON wire format for ElevenLabs' v1 Speech-to-Text
 * Realtime WebSocket API. Field names use snake_case matching the actual
 * JSON messages (the SDK's camelCase types go through a Fern deserialization
 * layer we don't use — we parse raw JSON directly).
 *
 * Batch REST types are generated via Orval from the OpenAPI spec.
 *
 * Regenerate with: pnpm openapi:sync-elevenlabs-streaming
 */

// =============================================================================
// Word-level types
// =============================================================================

/** The type of word */
export type TranscriptionWordType = "word" | "spacing"

/** Word-level transcription data with timing information (wire format) */
export interface TranscriptionWord {
  /** The transcribed word */
  text?: string
  /** Start time in seconds */
  start?: number
  /** End time in seconds */
  end?: number
  /** The type of word */
  type?: TranscriptionWordType
  /** The ID of the speaker if available */
  speaker_id?: string
  /** Confidence score for this word (log probability) */
  logprob?: number
  /** The characters in the word */
  characters?: string[]
}

// =============================================================================
// Server → Client message payloads (wire format)
// =============================================================================

/** Payload sent when the transcription session is successfully started */
export interface SessionStartedPayload {
  /** The message type identifier */
  message_type: "session_started"
  /** Unique identifier for the session */
  session_id: string
  /** Configuration for the transcription session */
  config: Record<string, unknown>
}

/** Payload for partial transcription results that may change */
export interface PartialTranscriptPayload {
  /** The message type identifier */
  message_type: "partial_transcript"
  /** Partial transcription text */
  text: string
}

/** Payload for committed transcription results */
export interface CommittedTranscriptPayload {
  /** The message type identifier */
  message_type: "committed_transcript"
  /** Committed transcription text */
  text: string
}

/** Payload for committed transcription results with word-level timestamps */
export interface CommittedTranscriptWithTimestampsPayload {
  /** The message type identifier */
  message_type: "committed_transcript_with_timestamps"
  /** Committed transcription text */
  text: string
  /** Detected or specified language code */
  language_code?: string
  /** Word-level information with timestamps */
  words?: TranscriptionWord[]
}

/** Payload for generic error events during transcription */
export interface ScribeErrorPayload {
  /** The message type identifier */
  message_type: "error"
  /** Error message describing what went wrong */
  error: string
}

/** Payload for authentication errors */
export interface ScribeAuthErrorPayload {
  /** The message type identifier */
  message_type: "auth_error"
  /** Authentication error details */
  error: string
}

/** Payload for quota exceeded errors */
export interface ScribeQuotaExceededErrorPayload {
  /** The message type identifier */
  message_type: "quota_exceeded"
  /** Quota exceeded error details */
  error: string
}

/** Payload for throttled errors */
export interface ScribeThrottledErrorPayload {
  /** The message type identifier */
  message_type: "commit_throttled"
  /** Throttled error details */
  error: string
}

/** Payload for unaccepted terms errors */
export interface ScribeUnacceptedTermsErrorPayload {
  /** The message type identifier */
  message_type: "unaccepted_terms"
  /** Unaccepted terms error details */
  error: string
}

/** Payload for rate limited errors */
export interface ScribeRateLimitedErrorPayload {
  /** The message type identifier */
  message_type: "rate_limited"
  /** Rate limited error details */
  error: string
}

/** Payload for queue overflow errors */
export interface ScribeQueueOverflowErrorPayload {
  /** The message type identifier */
  message_type: "queue_overflow"
  /** Queue overflow error details */
  error: string
}

/** Payload for resource exhausted errors */
export interface ScribeResourceExhaustedErrorPayload {
  /** The message type identifier */
  message_type: "resource_exhausted"
  /** Resource exhausted error details */
  error: string
}

/** Payload for session time limit exceeded errors */
export interface ScribeSessionTimeLimitExceededErrorPayload {
  /** The message type identifier */
  message_type: "session_time_limit_exceeded"
  /** Session time limit exceeded error details */
  error: string
}

/** Payload for input errors */
export interface ScribeInputErrorPayload {
  /** The message type identifier */
  message_type: "input_error"
  /** Input error details */
  error: string
}

/** Payload for chunk size exceeded errors */
export interface ScribeChunkSizeExceededErrorPayload {
  /** The message type identifier */
  message_type: "chunk_size_exceeded"
  /** Chunk size exceeded error details */
  error: string
}

/** Payload for insufficient audio activity errors */
export interface ScribeInsufficientAudioActivityErrorPayload {
  /** The message type identifier */
  message_type: "insufficient_audio_activity"
  /** Insufficient audio activity error details */
  error: string
}

/** Payload for transcriber errors */
export interface ScribeTranscriberErrorPayload {
  /** The message type identifier */
  message_type: "transcriber_error"
  /** Transcriber error details */
  error: string
}

// =============================================================================
// Client → Server message payloads (wire format)
// =============================================================================

/** Payload for sending audio chunks from client to server */
export interface InputAudioChunkPayload {
  /** The message type identifier */
  message_type: "input_audio_chunk"
  /** Base64-encoded audio data */
  audio_base_64: string
}

/** End of stream signal */
export interface EndOfStreamPayload {
  /** The message type identifier */
  message_type: "end_of_stream"
}

// =============================================================================
// Union types
// =============================================================================

/** All error payloads (all have `error` field + typed message_type) */
export type ElevenLabsScribeError =
  | ScribeErrorPayload
  | ScribeAuthErrorPayload
  | ScribeQuotaExceededErrorPayload
  | ScribeThrottledErrorPayload
  | ScribeUnacceptedTermsErrorPayload
  | ScribeRateLimitedErrorPayload
  | ScribeQueueOverflowErrorPayload
  | ScribeResourceExhaustedErrorPayload
  | ScribeSessionTimeLimitExceededErrorPayload
  | ScribeInputErrorPayload
  | ScribeChunkSizeExceededErrorPayload
  | ScribeInsufficientAudioActivityErrorPayload
  | ScribeTranscriberErrorPayload

/**
 * All possible server→client WebSocket messages.
 * Matches the SDK's ReceiveTranscription union type (wire format).
 */
export type ElevenLabsRealtimeMessage =
  | SessionStartedPayload
  | PartialTranscriptPayload
  | CommittedTranscriptPayload
  | CommittedTranscriptWithTimestampsPayload
  | ElevenLabsScribeError

/** All possible client→server WebSocket messages */
export type ElevenLabsSendMessage =
  | InputAudioChunkPayload
  | EndOfStreamPayload
