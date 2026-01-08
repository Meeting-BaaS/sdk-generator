/**
 * Browser-safe constants for speech-to-text providers
 *
 * This module exports only plain const objects - no Node.js dependencies.
 * Safe to use in browsers, Cloudflare Workers, and other edge environments.
 *
 * @example
 * ```typescript
 * // Browser-safe import (no node:crypto or other Node.js deps)
 * import { DeepgramModel, GladiaEncoding } from 'voice-router-dev/constants'
 *
 * const model = DeepgramModel["nova-3"]
 * const encoding = GladiaEncoding["wav/pcm"]
 * ```
 *
 * @packageDocumentation
 */

// ─────────────────────────────────────────────────────────────────────────────
// Deepgram Constants
// ─────────────────────────────────────────────────────────────────────────────

export { ListenV1EncodingParameter as DeepgramEncoding } from "./generated/deepgram/schema/listenV1EncodingParameter"
export { ListenV1RedactParameterOneOfItem as DeepgramRedact } from "./generated/deepgram/schema/listenV1RedactParameterOneOfItem"
export { SharedCustomTopicModeParameter as DeepgramTopicMode } from "./generated/deepgram/schema/sharedCustomTopicModeParameter"

/**
 * Deepgram transcription models
 *
 * @example
 * ```typescript
 * import { DeepgramModel } from 'voice-router-dev/constants'
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
} as const satisfies Record<
  string,
  import("./generated/deepgram/schema/listenV1ModelParameter").ListenV1ModelParameter
>

// ─────────────────────────────────────────────────────────────────────────────
// Gladia Constants
// ─────────────────────────────────────────────────────────────────────────────

export { StreamingSupportedEncodingEnum as GladiaEncoding } from "./generated/gladia/schema/streamingSupportedEncodingEnum"
export { StreamingSupportedSampleRateEnum as GladiaSampleRate } from "./generated/gladia/schema/streamingSupportedSampleRateEnum"
export { StreamingSupportedBitDepthEnum as GladiaBitDepth } from "./generated/gladia/schema/streamingSupportedBitDepthEnum"
export { StreamingSupportedModels as GladiaModel } from "./generated/gladia/schema/streamingSupportedModels"
export { TranscriptionLanguageCodeEnum as GladiaLanguage } from "./generated/gladia/schema/transcriptionLanguageCodeEnum"
export { TranslationLanguageCodeEnum as GladiaTranslationLanguage } from "./generated/gladia/schema/translationLanguageCodeEnum"

// ─────────────────────────────────────────────────────────────────────────────
// AssemblyAI Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AssemblyAI audio encoding formats
 *
 * @example
 * ```typescript
 * import { AssemblyAIEncoding } from 'voice-router-dev/constants'
 *
 * { encoding: AssemblyAIEncoding.pcmS16le }
 * ```
 */
export const AssemblyAIEncoding = {
  /** PCM signed 16-bit little-endian (recommended) */
  pcmS16le: "pcm_s16le",
  /** μ-law (telephony) */
  pcmMulaw: "pcm_mulaw"
} as const satisfies Record<string, import("./generated/assemblyai/streaming-types").AudioEncoding>

/**
 * AssemblyAI streaming speech models
 *
 * @example
 * ```typescript
 * import { AssemblyAISpeechModel } from 'voice-router-dev/constants'
 *
 * { speechModel: AssemblyAISpeechModel.multilingual }
 * ```
 */
export const AssemblyAISpeechModel = {
  /** Optimized for English */
  english: "universal-streaming-english",
  /** Supports 20+ languages */
  multilingual: "universal-streaming-multilingual"
} as const satisfies Record<
  string,
  import("./generated/assemblyai/streaming-types").StreamingSpeechModel
>

/**
 * AssemblyAI supported sample rates
 *
 * **Note:** This const is NOT type-checked against a generated type.
 * AssemblyAI's SDK accepts any `number` for sampleRate.
 * These values are from AssemblyAI documentation for convenience.
 *
 * @example
 * ```typescript
 * import { AssemblyAISampleRate } from 'voice-router-dev/constants'
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
// Transcript Status Constants (for listTranscripts filtering)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AssemblyAI transcript status values
 *
 * @example
 * ```typescript
 * import { AssemblyAIStatus } from 'voice-router-dev/constants'
 *
 * await router.listTranscripts('assemblyai', {
 *   status: AssemblyAIStatus.completed
 * })
 * ```
 */
export { TranscriptStatus as AssemblyAIStatus } from "./generated/assemblyai/schema/transcriptStatus"

/**
 * Gladia job status values
 *
 * Note: Gladia uses "done" instead of "completed"
 *
 * @example
 * ```typescript
 * import { GladiaStatus } from 'voice-router-dev/constants'
 *
 * await router.listTranscripts('gladia', {
 *   status: GladiaStatus.done
 * })
 * ```
 */
export { TranscriptionControllerListV2StatusItem as GladiaStatus } from "./generated/gladia/schema/transcriptionControllerListV2StatusItem"

/**
 * Azure Speech-to-Text transcription status values
 *
 * Note: Azure uses different names (NotStarted, Running, Succeeded, Failed)
 *
 * @example
 * ```typescript
 * import { AzureStatus } from 'voice-router-dev/constants'
 *
 * await router.listTranscripts('azure-stt', {
 *   status: AzureStatus.Succeeded
 * })
 * ```
 */
export { Status as AzureStatus } from "./generated/azure/schema/status"

// ─────────────────────────────────────────────────────────────────────────────
// Type exports
// ─────────────────────────────────────────────────────────────────────────────

/** Deepgram model type derived from const object */
export type DeepgramModelType = (typeof DeepgramModel)[keyof typeof DeepgramModel]

/** Deepgram redaction type - re-exported from OpenAPI generated types */
export type { ListenV1RedactParameterOneOfItem as DeepgramRedactType } from "./generated/deepgram/schema/listenV1RedactParameterOneOfItem"

/** Deepgram topic mode type - re-exported from OpenAPI generated types */
export type { SharedCustomTopicModeParameter as DeepgramTopicModeType } from "./generated/deepgram/schema/sharedCustomTopicModeParameter"

/** AssemblyAI encoding type derived from const object */
export type AssemblyAIEncodingType = (typeof AssemblyAIEncoding)[keyof typeof AssemblyAIEncoding]

/** AssemblyAI speech model type derived from const object */
export type AssemblyAISpeechModelType =
  (typeof AssemblyAISpeechModel)[keyof typeof AssemblyAISpeechModel]

/** AssemblyAI sample rate type derived from const object */
export type AssemblyAISampleRateType =
  (typeof AssemblyAISampleRate)[keyof typeof AssemblyAISampleRate]

/** AssemblyAI status type - re-exported from OpenAPI generated types */
export type { TranscriptStatus as AssemblyAIStatusType } from "./generated/assemblyai/schema/transcriptStatus"

/** Gladia status type - re-exported from OpenAPI generated types */
export type { TranscriptionControllerListV2StatusItem as GladiaStatusType } from "./generated/gladia/schema/transcriptionControllerListV2StatusItem"

/** Azure status type - re-exported from OpenAPI generated types */
export type { Status as AzureStatusType } from "./generated/azure/schema/status"
