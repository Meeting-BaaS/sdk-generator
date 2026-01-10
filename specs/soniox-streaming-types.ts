/**
 * Soniox Streaming Types
 * MANUAL SPEC - Extracted from @soniox/speech-to-text-web SDK
 *
 * @source https://www.npmjs.com/package/@soniox/speech-to-text-web
 * @version 1.0.0
 * @see https://soniox.com/docs/stt/SDKs/web-sdk
 *
 * Since Soniox doesn't publish an official AsyncAPI spec for their WebSocket API,
 * these types are manually extracted from the official SDK TypeScript definitions.
 */

// =============================================================================
// Audio Format Types
// =============================================================================

/**
 * Supported audio formats for auto-detection
 * Set audio_format to "auto" for automatic detection
 */
export type AutoDetectedAudioFormat =
  | "auto"
  | "aac"
  | "aiff"
  | "amr"
  | "asf"
  | "flac"
  | "mp3"
  | "ogg"
  | "wav"
  | "webm"

/**
 * PCM audio encodings (raw audio formats)
 * Requires sample_rate and num_channels to be specified
 */
export type PcmAudioEncoding =
  // Signed PCM
  | "pcm_s8"
  | "pcm_s16le"
  | "pcm_s16be"
  | "pcm_s24le"
  | "pcm_s24be"
  | "pcm_s32le"
  | "pcm_s32be"
  // Unsigned PCM
  | "pcm_u8"
  | "pcm_u16le"
  | "pcm_u16be"
  | "pcm_u24le"
  | "pcm_u24be"
  | "pcm_u32le"
  | "pcm_u32be"
  // Float PCM
  | "pcm_f32le"
  | "pcm_f32be"
  | "pcm_f64le"
  | "pcm_f64be"
  // Companded
  | "mulaw"
  | "alaw"

/**
 * All supported audio formats
 */
export type AudioFormat = AutoDetectedAudioFormat | PcmAudioEncoding

// =============================================================================
// Translation Configuration Types
// =============================================================================

/**
 * One-way translation: translate all spoken languages into a single target language
 */
export interface OneWayTranslation {
  type: "one_way"
  target_language: string
}

/**
 * Two-way translation: translate back and forth between two specified languages
 */
export interface TwoWayTranslation {
  type: "two_way"
  language_a: string
  language_b: string
}

/**
 * Translation configuration
 */
export type TranslationConfig = OneWayTranslation | TwoWayTranslation

// =============================================================================
// Context Configuration Types
// =============================================================================

/**
 * General context item for key-value pairs
 */
export interface ContextGeneralItem {
  key: string
  value: string
}

/**
 * Translation term mapping
 */
export interface TranslationTerm {
  source: string
  target: string
}

/**
 * Structured context for improving transcription accuracy
 */
export interface StructuredContext {
  /** General context items (key-value pairs) */
  general?: ContextGeneralItem[]
  /** Text context */
  text?: string
  /** Terms that might occur in speech */
  terms?: string[]
  /** Hints how to translate specific terms (ignored if translation is not enabled) */
  translation_terms?: TranslationTerm[]
}

/**
 * Context can be either a structured object or a plain string
 */
export type Context = StructuredContext | string

// =============================================================================
// WebSocket API Request Types
// =============================================================================

/**
 * Parameters for initiating a real-time transcription session
 * @source SpeechToTextAPIRequest from @soniox/speech-to-text-web SDK
 */
export interface StreamingTranscriberParams {
  /** Real-time model to use (e.g., "stt-rt-preview", "stt-rt-v3") */
  model: string

  /** Audio format specification */
  audioFormat?: AudioFormat

  /** Sample rate in Hz (required for raw PCM formats) */
  sampleRate?: number

  /** Number of audio channels (1 for mono, 2 for stereo) - required for raw PCM formats */
  numChannels?: number

  /** Expected languages in the audio (ISO language codes) */
  languageHints?: string[]

  /** Additional context to improve transcription accuracy */
  context?: Context

  /** Enable speaker diarization - each token will include a speaker field */
  enableSpeakerDiarization?: boolean

  /** Enable language identification - each token will include a language field */
  enableLanguageIdentification?: boolean

  /** Enable endpoint detection to detect when a speaker has finished talking */
  enableEndpointDetection?: boolean

  /** Translation configuration */
  translation?: TranslationConfig

  /** Optional tracking identifier (client-defined) */
  clientReferenceId?: string
}

// =============================================================================
// WebSocket API Response Types
// =============================================================================

/**
 * Translation status for tokens
 */
export type TranslationStatus = "none" | "original" | "translation"

/**
 * Individual token in a transcription result
 */
export interface Token {
  /** Token text content (subword, word, or space) */
  text: string

  /** Start time of the token in milliseconds */
  start_ms?: number

  /** End time of the token in milliseconds */
  end_ms?: number

  /** Confidence score between 0.0 and 1.0 */
  confidence?: number

  /** Whether this token is final (confirmed) or provisional */
  is_final: boolean

  /** Speaker identifier (only present when speaker diarization is enabled) */
  speaker?: string

  /** Detected language code (only present when language identification is enabled) */
  language?: string

  /** Original language code for translated tokens */
  source_language?: string

  /** Translation status: "none", "original", or "translation" */
  translation_status?: TranslationStatus
}

/**
 * Real-time transcription response
 * @source SpeechToTextAPIResponse from @soniox/speech-to-text-web SDK
 */
export interface StreamingResponse {
  /** Complete transcribed text */
  text?: string

  /** List of recognized tokens */
  tokens: Token[]

  /** Milliseconds of audio processed into final tokens */
  final_audio_proc_ms?: number

  /** Milliseconds of audio processed (final + non-final) */
  total_audio_proc_ms?: number

  /** Whether the transcription is complete */
  finished?: boolean

  /** Error message if an error occurred */
  error?: string

  /** Error code if an error occurred */
  error_code?: number
}

// =============================================================================
// Client State Types
// =============================================================================

/**
 * Recorder/client states
 */
export type RecorderState =
  | "Init"
  | "RequestingMedia"
  | "OpeningWebSocket"
  | "Running"
  | "FinishingProcessing"
  | "Finished"
  | "Error"
  | "Canceled"

/**
 * Inactive states (not recording)
 */
export type InactiveState = "Init" | "Finished" | "Error" | "Canceled"

/**
 * Active states (recording in progress)
 */
export type ActiveState = "RequestingMedia" | "OpeningWebSocket" | "Running" | "FinishingProcessing"

/**
 * Error status types
 */
export type ErrorStatus =
  | "get_user_media_failed"
  | "api_key_fetch_failed"
  | "queue_limit_exceeded"
  | "media_recorder_error"
  | "api_error"
  | "websocket_error"

// =============================================================================
// WebSocket Message Types (for manual finalization)
// =============================================================================

/**
 * Finalize message - triggers manual finalization of non-final tokens
 */
export interface FinalizeMessage {
  type: "finalize"
}

/**
 * All WebSocket client-to-server message types
 */
export type ClientMessage = FinalizeMessage
