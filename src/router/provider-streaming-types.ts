/**
 * Provider-specific streaming option types using OpenAPI-generated schemas
 *
 * These types provide compile-time safety by restricting options to what
 * each provider actually supports according to their OpenAPI specifications.
 *
 * For autocomplete-friendly const objects, import from './streaming-enums':
 * @example
 * ```typescript
 * import { DeepgramEncoding, DeepgramModel, GladiaEncoding } from './streaming-enums'
 * ```
 */

// Gladia types - from OpenAPI-generated schema
import type { StreamingRequest } from "../generated/gladia/schema/streamingRequest"
import type { StreamingSupportedEncodingEnum } from "../generated/gladia/schema/streamingSupportedEncodingEnum"
import type { StreamingSupportedSampleRateEnum } from "../generated/gladia/schema/streamingSupportedSampleRateEnum"
import type { StreamingSupportedBitDepthEnum } from "../generated/gladia/schema/streamingSupportedBitDepthEnum"
import type { LanguageConfig } from "../generated/gladia/schema/languageConfig"

// Deepgram types - from OpenAPI-generated schema
import type { ListenV1EncodingParameter } from "../generated/deepgram/schema/listenV1EncodingParameter"
import type { ListenV1LanguageParameter } from "../generated/deepgram/schema/listenV1LanguageParameter"
import type { ListenV1VersionParameter } from "../generated/deepgram/schema/listenV1VersionParameter"

// New typed enums for better autocomplete
import type {
  DeepgramModelType,
  DeepgramRedactType,
  DeepgramTopicModeType,
  AssemblyAIEncodingType,
  AssemblyAISpeechModelType,
  AssemblyAISampleRateType
} from "./streaming-enums"

// Common callback types
import type { StreamingCallbacks, StreamingProvider } from "./types"

// OpenAI Realtime types - from OpenAPI-generated schema
import type { RealtimeSessionCreateRequestGAModel } from "../generated/openai/schema/realtimeSessionCreateRequestGAModel"
import type { RealtimeTranscriptionSessionCreateRequestInputAudioFormat } from "../generated/openai/schema/realtimeTranscriptionSessionCreateRequestInputAudioFormat"
import type { RealtimeTranscriptionSessionCreateRequestTurnDetectionType } from "../generated/openai/schema/realtimeTranscriptionSessionCreateRequestTurnDetectionType"

// Gladia model type from generated schema
import type { StreamingSupportedModels } from "../generated/gladia/schema/streamingSupportedModels"
import type { StreamingSupportedRegions } from "../generated/gladia/schema/streamingSupportedRegions"
import type { MessagesConfig } from "../generated/gladia/schema/messagesConfig"
import type { PreProcessingConfig } from "../generated/gladia/schema/preProcessingConfig"
import type { RealtimeProcessingConfig } from "../generated/gladia/schema/realtimeProcessingConfig"
import type { PostProcessingConfig } from "../generated/gladia/schema/postProcessingConfig"

/**
 * Gladia streaming options (from OpenAPI spec)
 *
 * Based on the generated `StreamingRequest` type from Gladia's OpenAPI spec.
 * All supported encodings, sample rates, and bit depths are from the spec.
 */
export interface GladiaStreamingOptions {
  /** Transcription model to use */
  model?: StreamingSupportedModels
  /** Audio encoding format - only Gladia-supported formats (type-safe enum) */
  encoding?: StreamingSupportedEncodingEnum
  /** Sample rate - only Gladia-supported rates (type-safe enum) */
  sampleRate?: StreamingSupportedSampleRateEnum
  /** Bit depth - only Gladia-supported depths (type-safe enum) */
  bitDepth?: StreamingSupportedBitDepthEnum
  /** Number of audio channels (1-8) */
  channels?: number
  /** Regional endpoint for lower latency */
  region?: StreamingSupportedRegions
  /** Endpointing duration in seconds (0.01-10) */
  endpointing?: number
  /** Maximum duration without endpointing in seconds (5-60) */
  maximumDurationWithoutEndpointing?: number
  /** Language configuration */
  languageConfig?: LanguageConfig
  /** Interim/partial results */
  interimResults?: boolean
  /** Pre-processing configuration */
  preProcessing?: PreProcessingConfig
  /** Realtime processing configuration */
  realtimeProcessing?: RealtimeProcessingConfig
  /** Post-processing configuration */
  postProcessing?: PostProcessingConfig
  /** WebSocket messages configuration */
  messagesConfig?: MessagesConfig
}

/**
 * Deepgram streaming options (from OpenAPI spec)
 *
 * Based on the generated `ListenV1MediaTranscribeParams` type from Deepgram's OpenAPI spec.
 * All supported options come directly from the spec. Now using properly typed parameter enums!
 *
 * @see https://developers.deepgram.com/docs/streaming
 */
export interface DeepgramStreamingOptions {
  // ─────────────────────────────────────────────────────────────────
  // Audio Format Options
  // ─────────────────────────────────────────────────────────────────

  /**
   * Audio encoding format
   * Use `DeepgramEncoding` const for autocomplete:
   * @example
   * ```typescript
   * import { DeepgramEncoding } from '@meeting-baas/sdk'
   * { encoding: DeepgramEncoding.linear16 }
   * ```
   */
  encoding?: (typeof ListenV1EncodingParameter)[keyof typeof ListenV1EncodingParameter]

  /** Sample rate in Hz */
  sampleRate?: number

  /** Number of audio channels */
  channels?: number

  // ─────────────────────────────────────────────────────────────────
  // Model & Language Options
  // ─────────────────────────────────────────────────────────────────

  /** Language code (BCP-47 format, e.g., 'en', 'en-US', 'es') */
  language?: ListenV1LanguageParameter

  /**
   * Model to use for transcription
   *
   * Strict union type - only accepts valid Deepgram models.
   * Use `DeepgramModel` const for autocomplete:
   * @example
   * ```typescript
   * import { DeepgramModel } from 'voice-router-dev'
   * { model: DeepgramModel["nova-3"] }
   * { model: DeepgramModel["nova-2-medical"] }
   * // Or use string literals directly:
   * { model: "nova-3" }
   * ```
   */
  model?: DeepgramModelType

  /** Model version (e.g., 'latest') */
  version?: ListenV1VersionParameter

  /** Enable language detection */
  languageDetection?: boolean

  // ─────────────────────────────────────────────────────────────────
  // Transcription Processing Options
  // ─────────────────────────────────────────────────────────────────

  /** Enable speaker diarization */
  diarization?: boolean

  /** Enable punctuation */
  punctuate?: boolean

  /** Enable smart formatting (dates, numbers, etc.) */
  smartFormat?: boolean

  /** Enable interim results (partial transcripts) */
  interimResults?: boolean

  /** Enable filler words detection ("uh", "um") */
  fillerWords?: boolean

  /** Convert written numbers to digits ("twenty" -> "20") */
  numerals?: boolean

  /** Convert measurements to abbreviations ("five meters" -> "5m") */
  measurements?: boolean

  /** Enable paragraph formatting */
  paragraphs?: boolean

  /** Enable profanity filtering */
  profanityFilter?: boolean

  /** Enable dictation mode (optimized for dictation) */
  dictation?: boolean

  /** Utterance split duration threshold in milliseconds */
  utteranceSplit?: number

  // ─────────────────────────────────────────────────────────────────
  // Advanced Analysis Options
  // ─────────────────────────────────────────────────────────────────

  /** Enable real-time sentiment analysis */
  sentiment?: boolean

  /** Enable entity detection */
  detectEntities?: boolean

  /** Enable topic detection */
  topics?: boolean

  /** Custom topic definitions */
  customTopic?: string[]

  /**
   * Custom topic detection mode
   * Use `DeepgramTopicMode` const for autocomplete
   */
  customTopicMode?: DeepgramTopicModeType

  /** Enable intent recognition */
  intents?: boolean

  /** Custom intent definitions */
  customIntent?: string[]

  /**
   * Custom intent detection mode
   * Use `DeepgramTopicMode` const for autocomplete
   */
  customIntentMode?: DeepgramTopicModeType

  /** Enable summarization */
  summarize?: boolean

  // ─────────────────────────────────────────────────────────────────
  // Vocabulary & Redaction Options
  // ─────────────────────────────────────────────────────────────────

  /** Custom vocabulary/keywords for boosting */
  keywords?: string | string[]

  /**
   * Key term prompting (Nova-3 only)
   * More powerful than keywords - provides context about terms
   */
  keyterm?: string[]

  /**
   * Enable PII redaction
   * Use `DeepgramRedact` const for autocomplete:
   * @example
   * ```typescript
   * import { DeepgramRedact } from '@meeting-baas/sdk'
   * { redact: [DeepgramRedact.pii, DeepgramRedact.pci] }
   * ```
   */
  redact?: boolean | DeepgramRedactType[]

  // ─────────────────────────────────────────────────────────────────
  // Callback & Metadata Options
  // ─────────────────────────────────────────────────────────────────

  /** Callback URL for webhooks */
  callback?: string

  /** Extra metadata to include in response */
  extra?: Record<string, unknown>

  /** Tags to include in response */
  tag?: string[]

  // ─────────────────────────────────────────────────────────────────
  // Endpoint Configuration
  // ─────────────────────────────────────────────────────────────────

  /**
   * Endpointing mode for VAD
   * - number: silence duration in ms to trigger endpoint
   * - false: disable VAD endpointing
   */
  endpointing?: number | false

  /** Voice activity detection threshold (0-1) */
  vadThreshold?: number
}

// AssemblyAI streaming types - from auto-synced SDK types
import type { StreamingUpdateConfiguration } from "../generated/assemblyai/streaming-types"

/**
 * AssemblyAI streaming options
 *
 * Based on the v3 Universal Streaming API parameters from the AssemblyAI SDK.
 * Supports advanced features like VAD tuning, end-of-turn detection, and profanity filtering.
 *
 * @see https://www.assemblyai.com/docs/speech-to-text/streaming
 */
export interface AssemblyAIStreamingOptions {
  // ─────────────────────────────────────────────────────────────────
  // Audio Format Options
  // ─────────────────────────────────────────────────────────────────

  /**
   * Sample rate in Hz
   * Use `AssemblyAISampleRate` const for autocomplete:
   * @example
   * ```typescript
   * import { AssemblyAISampleRate } from '@meeting-baas/sdk'
   * { sampleRate: AssemblyAISampleRate.rate16000 }
   * ```
   */
  sampleRate?: AssemblyAISampleRateType

  /**
   * Audio encoding format
   * Use `AssemblyAIEncoding` const for autocomplete:
   * @example
   * ```typescript
   * import { AssemblyAIEncoding } from '@meeting-baas/sdk'
   * { encoding: AssemblyAIEncoding.pcmS16le }
   * ```
   */
  encoding?: AssemblyAIEncodingType

  // ─────────────────────────────────────────────────────────────────
  // Model & Language Options
  // ─────────────────────────────────────────────────────────────────

  /**
   * Speech model to use
   *
   * Strict union type - only accepts valid AssemblyAI streaming models.
   * Use `AssemblyAISpeechModel` const for autocomplete:
   * @example
   * ```typescript
   * import { AssemblyAISpeechModel } from 'voice-router-dev'
   * { speechModel: AssemblyAISpeechModel.english }
   * { speechModel: AssemblyAISpeechModel.multilingual }
   * // Or use string literals directly:
   * { speechModel: "universal-streaming-english" }
   * ```
   */
  speechModel?: AssemblyAISpeechModelType

  /** Enable automatic language detection */
  languageDetection?: boolean

  // ─────────────────────────────────────────────────────────────────
  // End-of-Turn Detection Options
  // ─────────────────────────────────────────────────────────────────

  /**
   * Confidence threshold for end-of-turn detection (0-1)
   * Higher values require more confidence before ending a turn
   * @default 0.5
   */
  endOfTurnConfidenceThreshold?: number

  /**
   * Minimum silence duration (ms) to trigger end-of-turn when confident
   * Only applies when confidence is above threshold
   * @default 1000
   */
  minEndOfTurnSilenceWhenConfident?: number

  /**
   * Maximum silence duration (ms) before forcing end-of-turn
   * Regardless of confidence level
   * @default 20000
   */
  maxTurnSilence?: number

  // ─────────────────────────────────────────────────────────────────
  // Voice Activity Detection Options
  // ─────────────────────────────────────────────────────────────────

  /**
   * VAD sensitivity threshold (0-1)
   * Lower values are more sensitive to quiet speech
   */
  vadThreshold?: number

  // ─────────────────────────────────────────────────────────────────
  // Transcription Processing Options
  // ─────────────────────────────────────────────────────────────────

  /**
   * Enable real-time text formatting of turns
   * Applies punctuation, capitalization, and formatting
   */
  formatTurns?: boolean

  /** Filter profanity in real-time transcription */
  filterProfanity?: boolean

  // ─────────────────────────────────────────────────────────────────
  // Custom Vocabulary Options
  // ─────────────────────────────────────────────────────────────────

  /**
   * Key terms to boost in recognition
   * Increases recognition accuracy for specific words/phrases
   */
  keyterms?: string[]

  /**
   * Key term prompting for context
   * Provides additional context about the terms to improve recognition
   */
  keytermsPrompt?: string[]

  // ─────────────────────────────────────────────────────────────────
  // Session Configuration
  // ─────────────────────────────────────────────────────────────────

  /**
   * Inactivity timeout in milliseconds
   * Session will close if no audio is received for this duration
   */
  inactivityTimeout?: number

  /**
   * Use token-based authentication
   * If true, will create a temporary token before connecting
   */
  useToken?: boolean

  /**
   * Token expiration time in seconds (minimum 60)
   * Only used if useToken is true
   * @default 3600
   */
  tokenExpiresIn?: number
}

/**
 * AssemblyAI dynamic configuration update
 * Can be sent mid-stream to adjust parameters
 */
export type AssemblyAIUpdateConfiguration = Omit<StreamingUpdateConfiguration, "type">

/**
 * OpenAI Realtime API streaming options
 *
 * Based on the OpenAI Realtime WebSocket API for audio transcription.
 * Uses server-side VAD for automatic turn detection.
 *
 * @see https://platform.openai.com/docs/guides/realtime
 */
export interface OpenAIStreamingOptions {
  // ─────────────────────────────────────────────────────────────────
  // Model Options
  // ─────────────────────────────────────────────────────────────────

  /**
   * Realtime model to use (from OpenAPI-generated schema)
   * @default "gpt-4o-realtime-preview"
   * @see RealtimeSessionCreateRequestGAModel
   */
  model?: RealtimeSessionCreateRequestGAModel

  // ─────────────────────────────────────────────────────────────────
  // Audio Format Options
  // ─────────────────────────────────────────────────────────────────

  /**
   * Input audio format (from OpenAPI-generated schema)
   * - pcm16: 16-bit PCM at 24kHz, mono, little-endian
   * - g711_ulaw: μ-law telephony codec
   * - g711_alaw: A-law telephony codec
   * @default "pcm16"
   * @see RealtimeTranscriptionSessionCreateRequestInputAudioFormat
   */
  inputAudioFormat?: RealtimeTranscriptionSessionCreateRequestInputAudioFormat

  // ─────────────────────────────────────────────────────────────────
  // Voice Activity Detection (Turn Detection)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Turn detection configuration
   * Controls when the model considers a turn complete
   */
  turnDetection?: {
    /**
     * Type of turn detection (from OpenAPI-generated schema)
     * Currently only "server_vad" is supported for transcription sessions
     * @default "server_vad"
     * @see RealtimeTranscriptionSessionCreateRequestTurnDetectionType
     */
    type: RealtimeTranscriptionSessionCreateRequestTurnDetectionType
    /**
     * VAD activation threshold (0.0-1.0)
     * Higher values require louder audio to trigger
     * @default 0.5
     */
    threshold?: number
    /**
     * Audio padding before speech (ms)
     * @default 300
     */
    prefixPaddingMs?: number
    /**
     * Silence duration to end turn (ms)
     * @default 500
     */
    silenceDurationMs?: number
  }

  // ─────────────────────────────────────────────────────────────────
  // Session Options (for transcription-only mode)
  // ─────────────────────────────────────────────────────────────────

  /**
   * System instructions for the session
   * For transcription-only, can be left empty or provide context
   */
  instructions?: string

  /**
   * Enable noise reduction on input audio
   * @default true
   */
  inputAudioNoiseReduction?: boolean
}

/**
 * Union of all provider-specific streaming options
 */
export type ProviderStreamingOptions =
  | ({ provider: "gladia" } & GladiaStreamingOptions)
  | ({ provider: "deepgram" } & DeepgramStreamingOptions)
  | ({ provider: "assemblyai" } & AssemblyAIStreamingOptions)
  | ({ provider: "openai-whisper" } & OpenAIStreamingOptions)

/**
 * Type-safe streaming options for a specific provider
 */
export type StreamingOptionsForProvider<P extends StreamingProvider> = P extends "gladia"
  ? GladiaStreamingOptions
  : P extends "deepgram"
    ? DeepgramStreamingOptions
    : P extends "assemblyai"
      ? AssemblyAIStreamingOptions
      : P extends "openai-whisper"
        ? OpenAIStreamingOptions
        : never

/**
 * Type-safe transcribeStream parameters for a specific provider
 */
export interface TranscribeStreamParams<P extends StreamingProvider> {
  /** Streaming options specific to this provider */
  options?: StreamingOptionsForProvider<P> & { provider: P }
  /** Event callbacks */
  callbacks?: StreamingCallbacks
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-export streaming enums for convenience
// ─────────────────────────────────────────────────────────────────────────────

export {
  // Deepgram
  DeepgramEncoding,
  DeepgramModel,
  DeepgramRedact,
  DeepgramTopicMode,
  // Gladia
  GladiaEncoding,
  GladiaSampleRate,
  GladiaBitDepth,
  GladiaModel,
  GladiaLanguage,
  GladiaTranslationLanguage,
  // AssemblyAI
  AssemblyAIEncoding,
  AssemblyAISpeechModel,
  AssemblyAISampleRate
} from "./streaming-enums"

// Re-export types
export type {
  DeepgramModelType,
  DeepgramRedactType,
  DeepgramTopicModeType,
  AssemblyAIEncodingType,
  AssemblyAISpeechModelType,
  AssemblyAISampleRateType
} from "./streaming-enums"
