/**
 * Provider-specific streaming enums for type-safe autocomplete
 *
 * These const objects provide IDE autocomplete and compile-time validation
 * for streaming options. Use these instead of raw strings for better DX.
 *
 * @example
 * ```typescript
 * import { DeepgramEncoding, GladiaEncoding, DeepgramModel } from '@meeting-baas/sdk'
 *
 * await adapter.transcribeStream({
 *   deepgramStreaming: {
 *     encoding: DeepgramEncoding.linear16,
 *     model: DeepgramModel.nova3,
 *     language: DeepgramLanguage.en
 *   }
 * })
 * ```
 */

// ─────────────────────────────────────────────────────────────────────────────
// Deepgram Streaming Enums
// ─────────────────────────────────────────────────────────────────────────────

// Re-export generated const objects with friendly names
export { ListenV1EncodingParameter as DeepgramEncoding } from "../generated/deepgram/schema/listenV1EncodingParameter"
export { ListenV1RedactParameterOneOfItem as DeepgramRedact } from "../generated/deepgram/schema/listenV1RedactParameterOneOfItem"

/**
 * Deepgram transcription models
 *
 * Derived from `ListenV1ModelParameter` in the OpenAPI spec.
 * Values are kept in sync with the generated type union.
 *
 * @see {@link ListenV1ModelParameter} for the underlying type
 * @example
 * ```typescript
 * import { DeepgramModel } from 'voice-router-dev'
 *
 * { model: DeepgramModel["nova-3"] }
 * { model: DeepgramModel["nova-2-medical"] }
 * ```
 */
export const DeepgramModel = {
  // Nova 3 models (latest)
  "nova-3": "nova-3",
  "nova-3-general": "nova-3-general",
  "nova-3-medical": "nova-3-medical",

  // Nova 2 models
  "nova-2": "nova-2",
  "nova-2-general": "nova-2-general",
  "nova-2-meeting": "nova-2-meeting",
  "nova-2-finance": "nova-2-finance",
  "nova-2-conversationalai": "nova-2-conversationalai",
  "nova-2-voicemail": "nova-2-voicemail",
  "nova-2-video": "nova-2-video",
  "nova-2-medical": "nova-2-medical",
  "nova-2-drivethru": "nova-2-drivethru",
  "nova-2-automotive": "nova-2-automotive",

  // Nova 1 models
  nova: "nova",
  "nova-general": "nova-general",
  "nova-phonecall": "nova-phonecall",
  "nova-medical": "nova-medical",

  // Enhanced models
  enhanced: "enhanced",
  "enhanced-general": "enhanced-general",
  "enhanced-meeting": "enhanced-meeting",
  "enhanced-phonecall": "enhanced-phonecall",
  "enhanced-finance": "enhanced-finance",

  // Base models
  base: "base",
  meeting: "meeting",
  phonecall: "phonecall",
  finance: "finance",
  conversationalai: "conversationalai",
  voicemail: "voicemail",
  video: "video"
} as const satisfies Record<string, import("../generated/deepgram/schema/listenV1ModelParameter").ListenV1ModelParameter>

// Re-export topic/intent mode from generated types
export { SharedCustomTopicModeParameter as DeepgramTopicMode } from "../generated/deepgram/schema/sharedCustomTopicModeParameter"

// ─────────────────────────────────────────────────────────────────────────────
// Gladia Streaming Enums
// ─────────────────────────────────────────────────────────────────────────────

// Re-export generated const objects with friendly names
export { StreamingSupportedEncodingEnum as GladiaEncoding } from "../generated/gladia/schema/streamingSupportedEncodingEnum"
export { StreamingSupportedSampleRateEnum as GladiaSampleRate } from "../generated/gladia/schema/streamingSupportedSampleRateEnum"
export { StreamingSupportedBitDepthEnum as GladiaBitDepth } from "../generated/gladia/schema/streamingSupportedBitDepthEnum"
export { StreamingSupportedModels as GladiaModel } from "../generated/gladia/schema/streamingSupportedModels"
export { TranscriptionLanguageCodeEnum as GladiaLanguage } from "../generated/gladia/schema/transcriptionLanguageCodeEnum"
export { TranslationLanguageCodeEnum as GladiaTranslationLanguage } from "../generated/gladia/schema/translationLanguageCodeEnum"

// ─────────────────────────────────────────────────────────────────────────────
// AssemblyAI Streaming Enums
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AssemblyAI audio encoding formats
 *
 * Derived from `AudioEncoding` type in the auto-synced streaming types.
 *
 * @example
 * ```typescript
 * import { AssemblyAIEncoding } from 'voice-router-dev'
 *
 * { encoding: AssemblyAIEncoding.pcmS16le }
 * ```
 */
export const AssemblyAIEncoding = {
  /** PCM signed 16-bit little-endian (recommended) */
  pcmS16le: "pcm_s16le",
  /** μ-law (telephony) */
  pcmMulaw: "pcm_mulaw"
} as const satisfies Record<string, import("../generated/assemblyai/streaming-types").AudioEncoding>

/**
 * AssemblyAI streaming speech models
 *
 * Derived from `StreamingSpeechModel` type in the auto-synced streaming types.
 *
 * @example
 * ```typescript
 * import { AssemblyAISpeechModel } from 'voice-router-dev'
 *
 * { speechModel: AssemblyAISpeechModel.english }
 * { speechModel: AssemblyAISpeechModel.multilingual }
 * ```
 */
export const AssemblyAISpeechModel = {
  /** Optimized for English */
  english: "universal-streaming-english",
  /** Supports 20+ languages */
  multilingual: "universal-streaming-multilingual"
} as const satisfies Record<string, import("../generated/assemblyai/streaming-types").StreamingSpeechModel>

/**
 * AssemblyAI supported sample rates
 *
 * @example
 * ```typescript
 * import { AssemblyAISampleRate } from '@meeting-baas/sdk'
 *
 * { sampleRate: AssemblyAISampleRate.rate16000 }
 * ```
 */
export const AssemblyAISampleRate = {
  rate8000: 8000,
  rate16000: 16000,
  rate22050: 22050,
  rate44100: 44100,
  rate48000: 48000
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Type exports for the const objects
// ─────────────────────────────────────────────────────────────────────────────

/** Deepgram model type derived from const object */
export type DeepgramModelType = (typeof DeepgramModel)[keyof typeof DeepgramModel]

/** Deepgram redaction type - re-exported from OpenAPI generated types */
export type { ListenV1RedactParameterOneOfItem as DeepgramRedactType } from "../generated/deepgram/schema/listenV1RedactParameterOneOfItem"

/** Deepgram topic mode type - re-exported from OpenAPI generated types */
export type { SharedCustomTopicModeParameter as DeepgramTopicModeType } from "../generated/deepgram/schema/sharedCustomTopicModeParameter"

/** AssemblyAI encoding type derived from const object */
export type AssemblyAIEncodingType = (typeof AssemblyAIEncoding)[keyof typeof AssemblyAIEncoding]

/** AssemblyAI speech model type derived from const object */
export type AssemblyAISpeechModelType =
  (typeof AssemblyAISpeechModel)[keyof typeof AssemblyAISpeechModel]

/** AssemblyAI sample rate type derived from const object */
export type AssemblyAISampleRateType =
  (typeof AssemblyAISampleRate)[keyof typeof AssemblyAISampleRate]
