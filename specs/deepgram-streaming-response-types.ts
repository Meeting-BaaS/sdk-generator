/**
 * Deepgram WebSocket Streaming Response Types
 * EXTRACTED FROM OFFICIAL SDK - DO NOT EDIT MANUALLY
 *
 * @source https://github.com/deepgram/deepgram-js-sdk
 * @path src/api/resources/listen/resources/v1/types/
 * @sdk @deepgram/sdk (Fern-generated)
 *
 * These types define the server→client WebSocket message protocol for
 * Deepgram's Listen V1 real-time streaming API.
 *
 * The connection params (LiveSchema) are in specs/deepgram-streaming-sdk.ts.
 * Batch REST types are generated via Orval from the OpenAPI spec.
 *
 * Regenerate with: pnpm openapi:sync-deepgram-streaming
 */

// =============================================================================
// Results — real-time transcription results
// =============================================================================

export interface DeepgramResults {
  /** Message type identifier */
  type: "Results"
  /** The index of the channel */
  channel_index: number[]
  /** The duration of the transcription */
  duration: number
  /** The start time of the transcription */
  start: number
  /** Whether the transcription is final */
  is_final?: boolean
  /** Whether the transcription is speech final */
  speech_final?: boolean
  channel: DeepgramResults.Channel
  metadata: DeepgramResults.Metadata
  /** Whether the transcription is from a finalize message */
  from_finalize?: boolean
  /** Extracted entities from the audio when detect_entities is enabled */
  entities?: DeepgramResults.Entity[]
}

export namespace DeepgramResults {
  export interface Channel {
    alternatives: Alternative[]
    detected_language?: string
  }

  export interface Alternative {
    /** The transcript of the transcription */
    transcript: string
    /** The confidence of the transcription */
    confidence: number
    languages?: string[]
    words: Word[]
  }

  export interface Word {
    /** The word of the transcription */
    word: string
    /** The start time of the word */
    start: number
    /** The end time of the word */
    end: number
    /** The confidence of the word */
    confidence: number
    /** The language of the word */
    language?: string
    /** The punctuated word */
    punctuated_word?: string
    /** The speaker of the word */
    speaker?: number
  }

  export interface Metadata {
    /** The request ID */
    request_id: string
    model_info: ModelInfo
    /** The model UUID */
    model_uuid: string
  }

  export interface ModelInfo {
    /** The name of the model */
    name: string
    /** The version of the model */
    version: string
    /** The arch of the model */
    arch: string
  }

  export interface Entity {
    /** The type/category of the entity */
    label: string
    /** The formatted text representation of the entity */
    value: string
    /** The original spoken text of the entity */
    raw_value: string
    /** The confidence score of the entity detection */
    confidence: number
    /** The index of the first word (inclusive) */
    start_word: number
    /** The index of the last word (exclusive) */
    end_word: number
  }
}

// =============================================================================
// Metadata — stream-level metadata (sent once at connection start)
// =============================================================================

export interface DeepgramMetadata {
  /** Message type identifier */
  type: "Metadata"
  /** The transaction key */
  transaction_key: string
  /** The request ID */
  request_id: string
  /** The sha256 */
  sha256: string
  /** The created timestamp */
  created: string
  /** The duration */
  duration: number
  /** The number of channels */
  channels: number
}

// =============================================================================
// UtteranceEnd — signals end of an utterance (VAD boundary)
// =============================================================================

export interface DeepgramUtteranceEnd {
  /** Message type identifier */
  type: "UtteranceEnd"
  /** The channel */
  channel: number[]
  /** The last word end time */
  last_word_end: number
}

// =============================================================================
// SpeechStarted — voice activity detection start event
// =============================================================================

export interface DeepgramSpeechStarted {
  /** Message type identifier */
  type: "SpeechStarted"
  /** The channel */
  channel: number[]
  /** The timestamp */
  timestamp: number
}

// =============================================================================
// CloseStream — server acknowledges stream lifecycle messages
// =============================================================================

export interface DeepgramCloseStream {
  /**
   * Message type identifier.
   * The SDK's ListenV1CloseStream is a client→server type with Finalize/CloseStream/KeepAlive,
   * but the server only echoes back "CloseStream" as an acknowledgment.
   */
  type: "CloseStream"
}

// =============================================================================
// Error — WebSocket error message (not in official SDK V1Socket.Response,
// but observed in production — server sends JSON error before closing)
// =============================================================================

export interface DeepgramError {
  type: "Error"
  description?: string
  message?: string
  variant?: string
}

// =============================================================================
// Union type for all server→client WebSocket messages
// =============================================================================

/**
 * All possible real-time WebSocket messages from Deepgram.
 *
 * The official SDK V1Socket.Response only includes Results | Metadata |
 * UtteranceEnd | SpeechStarted. We add CloseStream and Error which are
 * observed in production but not typed in the SDK.
 */
export type DeepgramRealtimeMessage =
  | DeepgramResults
  | DeepgramMetadata
  | DeepgramUtteranceEnd
  | DeepgramSpeechStarted
  | DeepgramCloseStream
  | DeepgramError
