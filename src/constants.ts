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

import { ListenV1EncodingParameter } from "./generated/deepgram/schema/listenV1EncodingParameter"
import { ListenV1RedactParameterOneOfItem } from "./generated/deepgram/schema/listenV1RedactParameterOneOfItem"
import { SharedCallbackMethodParameter } from "./generated/deepgram/schema/sharedCallbackMethodParameter"
import { SharedCustomIntentModeParameter } from "./generated/deepgram/schema/sharedCustomIntentModeParameter"
import { SharedCustomTopicModeParameter } from "./generated/deepgram/schema/sharedCustomTopicModeParameter"

/**
 * Deepgram audio encoding formats
 *
 * Values: `linear16`, `flac`, `mulaw`, `amr-nb`, `amr-wb`, `opus`, `speex`, `g729`, `mp3`, `vorbis`, `webm`, `mp4`, `m4a`, `aac`, `wav`, `aiff`, `mpeg`
 *
 * @example
 * ```typescript
 * import { DeepgramEncoding } from 'voice-router-dev/constants'
 *
 * { encoding: DeepgramEncoding.linear16 }
 * { encoding: DeepgramEncoding.opus }
 * ```
 */
export const DeepgramEncoding = ListenV1EncodingParameter

/**
 * Deepgram redaction options for PII removal
 *
 * Values: `pci`, `numbers`, `ssn`, `pii`
 *
 * @example
 * ```typescript
 * import { DeepgramRedact } from 'voice-router-dev/constants'
 *
 * { redact: [DeepgramRedact.pii, DeepgramRedact.ssn] }
 * ```
 */
export const DeepgramRedact = ListenV1RedactParameterOneOfItem

/**
 * Deepgram topic detection modes
 *
 * Values: `extended`, `strict`
 *
 * @example
 * ```typescript
 * import { DeepgramTopicMode } from 'voice-router-dev/constants'
 *
 * { customTopicMode: DeepgramTopicMode.extended }
 * ```
 */
export const DeepgramTopicMode = SharedCustomTopicModeParameter

/**
 * Deepgram intent detection modes
 *
 * Values: `extended`, `strict`
 *
 * @example
 * ```typescript
 * import { DeepgramIntentMode } from 'voice-router-dev/constants'
 *
 * { customIntentMode: DeepgramIntentMode.extended }
 * ```
 */
export const DeepgramIntentMode = SharedCustomIntentModeParameter

/**
 * Deepgram callback HTTP methods for async transcription
 *
 * Values: `POST`, `PUT`
 *
 * @example
 * ```typescript
 * import { DeepgramCallbackMethod } from 'voice-router-dev/constants'
 *
 * { callbackMethod: DeepgramCallbackMethod.POST }
 * ```
 */
export const DeepgramCallbackMethod = SharedCallbackMethodParameter

/**
 * Deepgram supported sample rates (Hz)
 *
 * **Note:** This const is NOT type-checked against a generated type.
 * Deepgram's OpenAPI spec accepts any `number` for sampleRate.
 * These values are from Deepgram documentation for convenience.
 *
 * Values: `8000`, `16000`, `32000`, `44100`, `48000`
 *
 * @example
 * ```typescript
 * import { DeepgramSampleRate } from 'voice-router-dev/constants'
 *
 * { sampleRate: DeepgramSampleRate.NUMBER_16000 }
 * ```
 */
export const DeepgramSampleRate = {
  NUMBER_8000: 8000,
  NUMBER_16000: 16000,
  NUMBER_32000: 32000,
  NUMBER_44100: 44100,
  NUMBER_48000: 48000
} as const

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

// Re-export auto-generated Deepgram language constants
// Generated from https://api.deepgram.com/v1/models by scripts/generate-deepgram-languages.js
export {
  DeepgramLanguage,
  DeepgramLanguageCodes,
  DeepgramArchitectures,
  DeepgramArchitectureLanguages,
  DeepgramMultilingualArchitectures
} from "./generated/deepgram/languages"
export type {
  DeepgramLanguageCode,
  DeepgramArchitecture,
  DeepgramMultilingualArchitecture
} from "./generated/deepgram/languages"

// Re-export auto-generated Soniox language constants
// Generated from Soniox OpenAPI spec by scripts/generate-soniox-languages.js
import {
  SonioxLanguage as _SonioxLanguage,
  SonioxLanguageCodes as _SonioxLanguageCodes,
  SonioxLanguageLabels as _SonioxLanguageLabels,
  SonioxLanguages as _SonioxLanguages
} from "./generated/soniox/languages"
export {
  _SonioxLanguage as SonioxLanguage,
  _SonioxLanguageCodes as SonioxLanguageCodes,
  _SonioxLanguageLabels as SonioxLanguageLabels,
  _SonioxLanguages as SonioxLanguages
}
export type { SonioxLanguageCode } from "./generated/soniox/languages"

// Re-export auto-generated Soniox model constants
// Generated from Soniox OpenAPI spec by scripts/generate-soniox-models.js
import {
  SonioxModel as _SonioxModel,
  SonioxModelCodes as _SonioxModelCodes,
  SonioxModelLabels as _SonioxModelLabels,
  SonioxModels as _SonioxModels,
  SonioxRealtimeModel as _SonioxRealtimeModel,
  SonioxRealtimeModelCodes as _SonioxRealtimeModelCodes,
  SonioxAsyncModel as _SonioxAsyncModel,
  SonioxAsyncModelCodes as _SonioxAsyncModelCodes
} from "./generated/soniox/models"
export {
  _SonioxModel as SonioxModel,
  _SonioxModelCodes as SonioxModelCodes,
  _SonioxModelLabels as SonioxModelLabels,
  _SonioxModels as SonioxModels,
  _SonioxRealtimeModel as SonioxRealtimeModel,
  _SonioxRealtimeModelCodes as SonioxRealtimeModelCodes,
  _SonioxAsyncModel as SonioxAsyncModel,
  _SonioxAsyncModelCodes as SonioxAsyncModelCodes
}
export type {
  SonioxModelCode,
  SonioxRealtimeModelCode,
  SonioxAsyncModelCode
} from "./generated/soniox/models"

// Re-export auto-generated Speechmatics language constants
// Generated from Speechmatics documentation by scripts/generate-speechmatics-languages.js
import {
  SpeechmaticsLanguage as _SpeechmaticsLanguage,
  SpeechmaticsLanguageCodes as _SpeechmaticsLanguageCodes,
  SpeechmaticsLanguageLabels as _SpeechmaticsLanguageLabels,
  SpeechmaticsLanguages as _SpeechmaticsLanguages
} from "./generated/speechmatics/languages"
export {
  _SpeechmaticsLanguage as SpeechmaticsLanguage,
  _SpeechmaticsLanguageCodes as SpeechmaticsLanguageCodes,
  _SpeechmaticsLanguageLabels as SpeechmaticsLanguageLabels,
  _SpeechmaticsLanguages as SpeechmaticsLanguages
}
export type { SpeechmaticsLanguageCode } from "./generated/speechmatics/languages"

// Re-export Speechmatics operating point (model quality tier)
import { OperatingPoint as _SpeechmaticsOperatingPoint } from "./generated/speechmatics/schema/operatingPoint"

/**
 * Speechmatics operating point (model quality tier)
 *
 * Values: `standard`, `enhanced`
 *
 * - `standard`: Faster processing, good accuracy
 * - `enhanced`: Higher accuracy, slightly slower
 *
 * @example
 * ```typescript
 * import { SpeechmaticsOperatingPoint } from 'voice-router-dev/constants'
 *
 * await router.transcribe('speechmatics', audioUrl, {
 *   model: SpeechmaticsOperatingPoint.enhanced
 * })
 * ```
 */
export const SpeechmaticsOperatingPoint = _SpeechmaticsOperatingPoint
export type SpeechmaticsOperatingPointType =
  (typeof SpeechmaticsOperatingPoint)[keyof typeof SpeechmaticsOperatingPoint]

// Re-export auto-generated Azure locale constants
// Generated from Azure documentation by scripts/generate-azure-locales.js
import {
  AzureLocale as _AzureLocale,
  AzureLocaleCodes as _AzureLocaleCodes,
  AzureLocaleLabels as _AzureLocaleLabels,
  AzureLocales as _AzureLocales
} from "./generated/azure/locales"
export {
  _AzureLocale as AzureLocale,
  _AzureLocaleCodes as AzureLocaleCodes,
  _AzureLocaleLabels as AzureLocaleLabels,
  _AzureLocales as AzureLocales
}
export type { AzureLocaleCode } from "./generated/azure/locales"

// ─────────────────────────────────────────────────────────────────────────────
// Gladia Constants
// ─────────────────────────────────────────────────────────────────────────────

import { StreamingSupportedBitDepthEnum } from "./generated/gladia/schema/streamingSupportedBitDepthEnum"
import { StreamingSupportedEncodingEnum } from "./generated/gladia/schema/streamingSupportedEncodingEnum"
import { StreamingSupportedModels } from "./generated/gladia/schema/streamingSupportedModels"
import { StreamingSupportedRegions } from "./generated/gladia/schema/streamingSupportedRegions"
import { StreamingSupportedSampleRateEnum } from "./generated/gladia/schema/streamingSupportedSampleRateEnum"
import { TranscriptionLanguageCodeEnum } from "./generated/gladia/schema/transcriptionLanguageCodeEnum"
import { TranslationLanguageCodeEnum } from "./generated/gladia/schema/translationLanguageCodeEnum"

/**
 * Gladia audio encoding formats for streaming
 *
 * Values: `wav/pcm`, `wav/alaw`, `wav/ulaw`
 *
 * @example
 * ```typescript
 * import { GladiaEncoding } from 'voice-router-dev/constants'
 *
 * { encoding: GladiaEncoding["wav/pcm"] }
 * ```
 */
export const GladiaEncoding = StreamingSupportedEncodingEnum

/**
 * Gladia supported sample rates (Hz)
 *
 * Values: `8000`, `16000`, `32000`, `44100`, `48000`
 *
 * @example
 * ```typescript
 * import { GladiaSampleRate } from 'voice-router-dev/constants'
 *
 * { sampleRate: GladiaSampleRate.NUMBER_16000 }
 * ```
 */
export const GladiaSampleRate = StreamingSupportedSampleRateEnum

/**
 * Gladia supported bit depths
 *
 * Values: `8`, `16`, `24`, `32`
 *
 * @example
 * ```typescript
 * import { GladiaBitDepth } from 'voice-router-dev/constants'
 *
 * { bitDepth: GladiaBitDepth.NUMBER_16 }
 * ```
 */
export const GladiaBitDepth = StreamingSupportedBitDepthEnum

/**
 * Gladia transcription models
 *
 * Values: `fast`, `accurate`
 *
 * @example
 * ```typescript
 * import { GladiaModel } from 'voice-router-dev/constants'
 *
 * { model: GladiaModel.accurate }
 * ```
 */
export const GladiaModel = StreamingSupportedModels

/**
 * Gladia transcription language codes (100+ languages)
 *
 * Common values: `en`, `es`, `fr`, `de`, `it`, `pt`, `nl`, `ja`, `ko`, `zh`, `ar`, `hi`, `ru`
 *
 * @example
 * ```typescript
 * import { GladiaLanguage } from 'voice-router-dev/constants'
 *
 * { language: GladiaLanguage.en }
 * { language: GladiaLanguage.es }
 * ```
 */
export const GladiaLanguage = TranscriptionLanguageCodeEnum

/**
 * Gladia translation target language codes
 *
 * Common values: `en`, `es`, `fr`, `de`, `it`, `pt`, `nl`, `ja`, `ko`, `zh`, `ar`, `hi`, `ru`
 *
 * @example
 * ```typescript
 * import { GladiaTranslationLanguage } from 'voice-router-dev/constants'
 *
 * { targetLanguages: [GladiaTranslationLanguage.fr, GladiaTranslationLanguage.es] }
 * ```
 */
export const GladiaTranslationLanguage = TranslationLanguageCodeEnum

/**
 * Gladia streaming regions for low-latency processing
 *
 * Values: `us-west`, `eu-west`
 *
 * Use the region closest to your users for optimal latency.
 * Region selection is only available for streaming transcription.
 *
 * @example
 * ```typescript
 * import { GladiaRegion } from 'voice-router-dev/constants'
 *
 * await adapter.transcribeStream({
 *   region: GladiaRegion["us-west"]
 * })
 * ```
 */
export const GladiaRegion = StreamingSupportedRegions

// ─────────────────────────────────────────────────────────────────────────────
// AssemblyAI Constants
// ─────────────────────────────────────────────────────────────────────────────

import { SpeechModel } from "./generated/assemblyai/schema/speechModel"
import { TranscriptLanguageCode } from "./generated/assemblyai/schema/transcriptLanguageCode"

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
 * AssemblyAI batch transcription models
 *
 * Values: `best`, `slam-1`, `universal`
 *
 * - `best`: Highest accuracy, best for most use cases (default)
 * - `slam-1`: Speech-Language Aligned Model, optimized for specific domains
 * - `universal`: General-purpose model with broad language support
 *
 * @example
 * ```typescript
 * import { AssemblyAITranscriptionModel } from 'voice-router-dev/constants'
 *
 * await router.transcribe('assemblyai', audioUrl, {
 *   speechModel: AssemblyAITranscriptionModel.best
 * })
 * ```
 */
export const AssemblyAITranscriptionModel = SpeechModel

/**
 * AssemblyAI language codes for transcription
 *
 * Common values: `en`, `en_us`, `en_uk`, `es`, `fr`, `de`, `it`, `pt`, `nl`, `ja`, `ko`, `zh`
 *
 * Default: `en_us`
 *
 * Full list at: https://www.assemblyai.com/docs/concepts/supported-languages
 *
 * @example
 * ```typescript
 * import { AssemblyAILanguage } from 'voice-router-dev/constants'
 *
 * await router.transcribe('assemblyai', audioUrl, {
 *   languageCode: AssemblyAILanguage.en_us
 * })
 * await router.transcribe('assemblyai', audioUrl, {
 *   languageCode: AssemblyAILanguage.es
 * })
 * ```
 */
export const AssemblyAILanguage = TranscriptLanguageCode

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

import { TranscriptStatus } from "./generated/assemblyai/schema/transcriptStatus"
import { Status } from "./generated/azure/schema/status"
import { ManageV1FilterStatusParameter } from "./generated/deepgram/schema/manageV1FilterStatusParameter"
import { TranscriptionControllerListV2StatusItem } from "./generated/gladia/schema/transcriptionControllerListV2StatusItem"

/**
 * AssemblyAI transcript status values for filtering
 *
 * Values: `queued`, `processing`, `completed`, `error`
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
export const AssemblyAIStatus = TranscriptStatus

/**
 * Gladia job status values for filtering
 *
 * Values: `queued`, `processing`, `done`, `error`
 *
 * Note: Gladia uses `done` instead of `completed`
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
export const GladiaStatus = TranscriptionControllerListV2StatusItem

/**
 * Azure Speech-to-Text transcription status values for filtering
 *
 * Values: `NotStarted`, `Running`, `Succeeded`, `Failed`
 *
 * Note: Azure uses different naming than other providers
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
export const AzureStatus = Status

/**
 * Deepgram request history status values for filtering
 *
 * Values: `succeeded`, `failed`
 *
 * Note: Deepgram only stores request metadata, not transcript content.
 * Requires `projectId` to be set during adapter initialization.
 *
 * @example
 * ```typescript
 * import { DeepgramStatus } from 'voice-router-dev/constants'
 *
 * await router.listTranscripts('deepgram', {
 *   status: DeepgramStatus.succeeded
 * })
 * ```
 */
export const DeepgramStatus = ManageV1FilterStatusParameter

// ─────────────────────────────────────────────────────────────────────────────
// Type exports
// ─────────────────────────────────────────────────────────────────────────────

/** Deepgram encoding type derived from const object */
export type DeepgramEncodingType = (typeof DeepgramEncoding)[keyof typeof DeepgramEncoding]

/** Deepgram redaction type derived from const object */
export type DeepgramRedactType = (typeof DeepgramRedact)[keyof typeof DeepgramRedact]

/** Deepgram topic mode type derived from const object */
export type DeepgramTopicModeType = (typeof DeepgramTopicMode)[keyof typeof DeepgramTopicMode]

/** Deepgram intent mode type derived from const object */
export type DeepgramIntentModeType = (typeof DeepgramIntentMode)[keyof typeof DeepgramIntentMode]

/** Deepgram callback method type derived from const object */
export type DeepgramCallbackMethodType =
  (typeof DeepgramCallbackMethod)[keyof typeof DeepgramCallbackMethod]

/** Deepgram sample rate type derived from const object */
export type DeepgramSampleRateType = (typeof DeepgramSampleRate)[keyof typeof DeepgramSampleRate]

/** Deepgram model type derived from const object */
export type DeepgramModelType = (typeof DeepgramModel)[keyof typeof DeepgramModel]

/** Deepgram language type (alias for DeepgramLanguageCode) */
export type { DeepgramLanguageCode as DeepgramLanguageType } from "./generated/deepgram/languages"

/** Gladia encoding type derived from const object */
export type GladiaEncodingType = (typeof GladiaEncoding)[keyof typeof GladiaEncoding]

/** Gladia sample rate type derived from const object */
export type GladiaSampleRateType = (typeof GladiaSampleRate)[keyof typeof GladiaSampleRate]

/** Gladia bit depth type derived from const object */
export type GladiaBitDepthType = (typeof GladiaBitDepth)[keyof typeof GladiaBitDepth]

/** Gladia model type derived from const object */
export type GladiaModelType = (typeof GladiaModel)[keyof typeof GladiaModel]

/** Gladia language type derived from const object */
export type GladiaLanguageType = (typeof GladiaLanguage)[keyof typeof GladiaLanguage]

/** Gladia translation language type derived from const object */
export type GladiaTranslationLanguageType =
  (typeof GladiaTranslationLanguage)[keyof typeof GladiaTranslationLanguage]

/** Gladia region type derived from const object */
export type GladiaRegionType = (typeof GladiaRegion)[keyof typeof GladiaRegion]

/** AssemblyAI encoding type derived from const object */
export type AssemblyAIEncodingType = (typeof AssemblyAIEncoding)[keyof typeof AssemblyAIEncoding]

/** AssemblyAI batch transcription model type derived from const object */
export type AssemblyAITranscriptionModelType =
  (typeof AssemblyAITranscriptionModel)[keyof typeof AssemblyAITranscriptionModel]

/** AssemblyAI language code type derived from const object */
export type AssemblyAILanguageType = (typeof AssemblyAILanguage)[keyof typeof AssemblyAILanguage]

/** AssemblyAI streaming speech model type derived from const object */
export type AssemblyAISpeechModelType =
  (typeof AssemblyAISpeechModel)[keyof typeof AssemblyAISpeechModel]

/** AssemblyAI sample rate type derived from const object */
export type AssemblyAISampleRateType =
  (typeof AssemblyAISampleRate)[keyof typeof AssemblyAISampleRate]

/** AssemblyAI status type derived from const object */
export type AssemblyAIStatusType = (typeof AssemblyAIStatus)[keyof typeof AssemblyAIStatus]

/** Gladia status type derived from const object */
export type GladiaStatusType = (typeof GladiaStatus)[keyof typeof GladiaStatus]

/** Azure status type derived from const object */
export type AzureStatusType = (typeof AzureStatus)[keyof typeof AzureStatus]

/** Deepgram status type derived from const object */
export type DeepgramStatusType = (typeof DeepgramStatus)[keyof typeof DeepgramStatus]

/** Soniox language type (alias for SonioxLanguageCode) */
export type SonioxLanguageType = (typeof _SonioxLanguage)[keyof typeof _SonioxLanguage]

/** Speechmatics language type (alias for SpeechmaticsLanguageCode) */
export type SpeechmaticsLanguageType =
  (typeof _SpeechmaticsLanguage)[keyof typeof _SpeechmaticsLanguage]

/** Azure locale type (alias for AzureLocaleCode) */
export type AzureLocaleType = (typeof _AzureLocale)[keyof typeof _AzureLocale]

// ─────────────────────────────────────────────────────────────────────────────
// Region Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Speechmatics regional endpoints
 *
 * Speechmatics offers multiple regional endpoints for data residency and latency optimization.
 * EU2 and US2 are enterprise-only for high availability and failover.
 *
 * | Region | Endpoint | Availability |
 * |--------|----------|--------------|
 * | EU1 | eu1.asr.api.speechmatics.com | All customers |
 * | EU2 | eu2.asr.api.speechmatics.com | Enterprise only |
 * | US1 | us1.asr.api.speechmatics.com | All customers |
 * | US2 | us2.asr.api.speechmatics.com | Enterprise only |
 * | AU1 | au1.asr.api.speechmatics.com | All customers |
 *
 * @example
 * ```typescript
 * import { SpeechmaticsRegion } from 'voice-router-dev/constants'
 *
 * const adapter = new SpeechmaticsAdapter()
 * adapter.initialize({
 *   apiKey: process.env.SPEECHMATICS_API_KEY,
 *   region: SpeechmaticsRegion.eu1
 * })
 * ```
 *
 * @see https://docs.speechmatics.com/get-started/authentication#supported-endpoints
 */
export const SpeechmaticsRegion = {
  /** Europe (default, all customers) */
  eu1: "eu1",
  /** Europe (enterprise only - HA/failover) */
  eu2: "eu2",
  /** USA (all customers) */
  us1: "us1",
  /** USA (enterprise only - HA/failover) */
  us2: "us2",
  /** Australia (all customers) */
  au1: "au1"
} as const

/**
 * Deepgram regional endpoints
 *
 * Deepgram offers regional endpoints for EU data residency.
 * The EU endpoint keeps all processing within the European Union.
 *
 * | Region | API Endpoint | WebSocket Endpoint |
 * |--------|--------------|-------------------|
 * | Global | api.deepgram.com | wss://api.deepgram.com |
 * | EU | api.eu.deepgram.com | wss://api.eu.deepgram.com |
 *
 * **Note:** Deepgram also supports Dedicated endpoints (`{SHORT_UID}.{REGION}.api.deepgram.com`)
 * and self-hosted deployments. Use `baseUrl` in config for custom endpoints.
 *
 * @example
 * ```typescript
 * import { DeepgramRegion } from 'voice-router-dev/constants'
 *
 * const adapter = new DeepgramAdapter()
 * adapter.initialize({
 *   apiKey: process.env.DEEPGRAM_API_KEY,
 *   region: DeepgramRegion.eu
 * })
 * ```
 *
 * @see https://developers.deepgram.com/reference/custom-endpoints - Official custom endpoints docs
 */
export const DeepgramRegion = {
  /** Global endpoint (default) */
  global: "global",
  /** European Union endpoint */
  eu: "eu"
} as const

/**
 * Soniox regional endpoints (Sovereign Cloud)
 *
 * Soniox offers regional endpoints for data residency compliance.
 * All audio, transcripts, and logs stay fully in-region.
 *
 * | Region | REST API | WebSocket (Real-time) |
 * |--------|----------|----------------------|
 * | US (default) | api.soniox.com | stt-rt.soniox.com |
 * | EU | api.eu.soniox.com | stt-rt.eu.soniox.com |
 * | Japan | api.jp.soniox.com | stt-rt.jp.soniox.com |
 *
 * **Coming soon:** Korea, Australia, India, Canada, Saudi Arabia, UK, Brazil
 *
 * @example
 * ```typescript
 * import { SonioxRegion } from 'voice-router-dev/constants'
 *
 * const adapter = createSonioxAdapter({
 *   apiKey: process.env.SONIOX_API_KEY,
 *   region: SonioxRegion.eu
 * })
 * ```
 *
 * @see https://soniox.com/docs/stt/data-residency - Official data residency docs
 */
export const SonioxRegion = {
  /** United States (default) */
  us: "us",
  /** European Union */
  eu: "eu",
  /** Japan */
  jp: "jp"
} as const

/** Speechmatics region type derived from const object */
export type SpeechmaticsRegionType = (typeof SpeechmaticsRegion)[keyof typeof SpeechmaticsRegion]

/** Deepgram region type derived from const object */
export type DeepgramRegionType = (typeof DeepgramRegion)[keyof typeof DeepgramRegion]

/** Soniox region type derived from const object */
export type SonioxRegionType = (typeof SonioxRegion)[keyof typeof SonioxRegion]

// ─────────────────────────────────────────────────────────────────────────────
// Deepgram TTS (Text-to-Speech) Constants
// ─────────────────────────────────────────────────────────────────────────────

import { SpeakV1ContainerParameter } from "./generated/deepgram/schema/speakV1ContainerParameter"
import { SpeakV1EncodingParameter } from "./generated/deepgram/schema/speakV1EncodingParameter"
import { SpeakV1ModelParameter } from "./generated/deepgram/schema/speakV1ModelParameter"
import { SpeakV1SampleRateParameter } from "./generated/deepgram/schema/speakV1SampleRateParameter"

/**
 * Deepgram TTS voice models
 *
 * Aura 2 voices offer improved quality with support for English and Spanish.
 * Use the voice name to select a specific voice persona.
 *
 * @example
 * ```typescript
 * import { DeepgramTTSModel } from 'voice-router-dev/constants'
 *
 * { model: DeepgramTTSModel["aura-2-athena-en"] }
 * { model: DeepgramTTSModel["aura-2-sirio-es"] }
 * ```
 */
export const DeepgramTTSModel = SpeakV1ModelParameter

/**
 * Deepgram TTS audio encoding formats
 *
 * Values: `linear16`, `aac`, `opus`, `mp3`, `flac`, `mulaw`, `alaw`
 *
 * @example
 * ```typescript
 * import { DeepgramTTSEncoding } from 'voice-router-dev/constants'
 *
 * { encoding: DeepgramTTSEncoding.mp3 }
 * { encoding: DeepgramTTSEncoding.opus }
 * ```
 */
export const DeepgramTTSEncoding = SpeakV1EncodingParameter

/**
 * Deepgram TTS audio container formats
 *
 * Values: `none`, `wav`, `ogg`
 *
 * @example
 * ```typescript
 * import { DeepgramTTSContainer } from 'voice-router-dev/constants'
 *
 * { container: DeepgramTTSContainer.wav }
 * ```
 */
export const DeepgramTTSContainer = SpeakV1ContainerParameter

/**
 * Deepgram TTS sample rates (Hz)
 *
 * Values: `8000`, `16000`, `22050`, `24000`, `32000`, `48000`
 *
 * @example
 * ```typescript
 * import { DeepgramTTSSampleRate } from 'voice-router-dev/constants'
 *
 * { sampleRate: DeepgramTTSSampleRate.NUMBER_24000 }
 * ```
 */
export const DeepgramTTSSampleRate = SpeakV1SampleRateParameter

/** Deepgram TTS model type derived from const object */
export type DeepgramTTSModelType = (typeof DeepgramTTSModel)[keyof typeof DeepgramTTSModel]

/** Deepgram TTS encoding type derived from const object */
export type DeepgramTTSEncodingType = (typeof DeepgramTTSEncoding)[keyof typeof DeepgramTTSEncoding]

/** Deepgram TTS container type derived from const object */
export type DeepgramTTSContainerType =
  (typeof DeepgramTTSContainer)[keyof typeof DeepgramTTSContainer]

/** Deepgram TTS sample rate type derived from const object */
export type DeepgramTTSSampleRateType =
  (typeof DeepgramTTSSampleRate)[keyof typeof DeepgramTTSSampleRate]

// ─────────────────────────────────────────────────────────────────────────────
// OpenAI Constants
// ─────────────────────────────────────────────────────────────────────────────

import { AudioResponseFormat } from "./generated/openai/schema/audioResponseFormat"
import type { CreateTranscriptionRequestModel } from "./generated/openai/schema/createTranscriptionRequestModel"
import { RealtimeTranscriptionSessionCreateRequestInputAudioFormat } from "./generated/openai/schema/realtimeTranscriptionSessionCreateRequestInputAudioFormat"
import { RealtimeTranscriptionSessionCreateRequestTurnDetectionType } from "./generated/openai/schema/realtimeTranscriptionSessionCreateRequestTurnDetectionType"
import type { RealtimeSessionCreateRequestGAModel } from "./generated/openai/schema/realtimeSessionCreateRequestGAModel"
import type { AudioTranscriptionModel } from "./generated/openai/schema/audioTranscriptionModel"

/**
 * OpenAI Whisper transcription models
 *
 * Values from official spec (auto-synced from Stainless):
 * - `whisper-1`: Open source Whisper V2 model
 * - `gpt-4o-transcribe`: GPT-4o based transcription (more accurate)
 * - `gpt-4o-mini-transcribe`: Faster, cost-effective GPT-4o mini
 * - `gpt-4o-mini-transcribe-2025-12-15`: Dated version of GPT-4o mini
 * - `gpt-4o-transcribe-diarize`: GPT-4o with speaker diarization
 *
 * @example
 * ```typescript
 * import { OpenAIModel } from 'voice-router-dev/constants'
 *
 * { model: OpenAIModel["whisper-1"] }
 * { model: OpenAIModel["gpt-4o-transcribe"] }
 * { model: OpenAIModel["gpt-4o-transcribe-diarize"] }
 * ```
 */
export const OpenAIModel = {
  "whisper-1": "whisper-1",
  "gpt-4o-transcribe": "gpt-4o-transcribe",
  "gpt-4o-mini-transcribe": "gpt-4o-mini-transcribe",
  "gpt-4o-mini-transcribe-2025-12-15": "gpt-4o-mini-transcribe-2025-12-15",
  "gpt-4o-transcribe-diarize": "gpt-4o-transcribe-diarize"
} as const satisfies Record<string, CreateTranscriptionRequestModel>

/**
 * OpenAI transcription response formats
 *
 * Values from official spec (auto-synced from Stainless):
 * - `json`: Basic JSON response
 * - `text`: Plain text
 * - `srt`: SRT subtitle format
 * - `verbose_json`: Detailed JSON with timestamps
 * - `vtt`: VTT subtitle format
 * - `diarized_json`: JSON with speaker annotations (gpt-4o-transcribe-diarize only)
 *
 * Note: GPT-4o transcribe models only support `json` format.
 * For diarization, use `diarized_json` with `gpt-4o-transcribe-diarize` model.
 *
 * @example
 * ```typescript
 * import { OpenAIResponseFormat } from 'voice-router-dev/constants'
 *
 * { responseFormat: OpenAIResponseFormat.verbose_json }
 * { responseFormat: OpenAIResponseFormat.diarized_json }
 * ```
 */
export const OpenAIResponseFormat = AudioResponseFormat

/** OpenAI model type derived from const object */
export type OpenAIModelType = (typeof OpenAIModel)[keyof typeof OpenAIModel]

/** OpenAI response format type derived from const object */
export type OpenAIResponseFormatType =
  (typeof OpenAIResponseFormat)[keyof typeof OpenAIResponseFormat]

/**
 * OpenAI Realtime API models for streaming transcription
 *
 * Values from official spec (auto-synced from Stainless):
 * - `gpt-4o-realtime-preview`: Latest GPT-4o realtime preview
 * - `gpt-4o-realtime-preview-2024-10-01`: October 2024 version
 * - `gpt-4o-realtime-preview-2024-12-17`: December 2024 version
 * - `gpt-4o-realtime-preview-2025-06-03`: June 2025 version
 * - `gpt-4o-mini-realtime-preview`: GPT-4o mini realtime
 * - `gpt-4o-mini-realtime-preview-2024-12-17`: December 2024 mini version
 *
 * @example
 * ```typescript
 * import { OpenAIRealtimeModel } from 'voice-router-dev/constants'
 *
 * await adapter.transcribeStream({
 *   openaiStreaming: {
 *     model: OpenAIRealtimeModel["gpt-4o-realtime-preview"]
 *   }
 * })
 * ```
 */
export const OpenAIRealtimeModel = {
  "gpt-4o-realtime-preview": "gpt-4o-realtime-preview",
  "gpt-4o-realtime-preview-2024-10-01": "gpt-4o-realtime-preview-2024-10-01",
  "gpt-4o-realtime-preview-2024-12-17": "gpt-4o-realtime-preview-2024-12-17",
  "gpt-4o-realtime-preview-2025-06-03": "gpt-4o-realtime-preview-2025-06-03",
  "gpt-4o-mini-realtime-preview": "gpt-4o-mini-realtime-preview",
  "gpt-4o-mini-realtime-preview-2024-12-17": "gpt-4o-mini-realtime-preview-2024-12-17"
} as const satisfies Record<string, RealtimeSessionCreateRequestGAModel>

/**
 * OpenAI Realtime audio input formats
 *
 * Values from official spec:
 * - `pcm16`: 16-bit PCM at 24kHz sample rate, mono, little-endian
 * - `g711_ulaw`: μ-law telephony codec
 * - `g711_alaw`: A-law telephony codec
 *
 * @example
 * ```typescript
 * import { OpenAIRealtimeAudioFormat } from 'voice-router-dev/constants'
 *
 * await adapter.transcribeStream({
 *   openaiStreaming: {
 *     inputAudioFormat: OpenAIRealtimeAudioFormat.pcm16
 *   }
 * })
 * ```
 */
export const OpenAIRealtimeAudioFormat = RealtimeTranscriptionSessionCreateRequestInputAudioFormat

/**
 * OpenAI Realtime turn detection type
 *
 * Currently only `server_vad` is supported for transcription sessions.
 *
 * @example
 * ```typescript
 * import { OpenAIRealtimeTurnDetection } from 'voice-router-dev/constants'
 *
 * await adapter.transcribeStream({
 *   openaiStreaming: {
 *     turnDetection: {
 *       type: OpenAIRealtimeTurnDetection.server_vad
 *     }
 *   }
 * })
 * ```
 */
export const OpenAIRealtimeTurnDetection =
  RealtimeTranscriptionSessionCreateRequestTurnDetectionType

/**
 * OpenAI Realtime input transcription models
 *
 * Models available for input audio transcription in Realtime sessions.
 *
 * @example
 * ```typescript
 * import { OpenAIRealtimeTranscriptionModel } from 'voice-router-dev/constants'
 *
 * // whisper-1 is the standard transcription model
 * ```
 */
export const OpenAIRealtimeTranscriptionModel = {
  "whisper-1": "whisper-1",
  "gpt-4o-transcribe": "gpt-4o-transcribe",
  "gpt-4o-mini-transcribe": "gpt-4o-mini-transcribe",
  "gpt-4o-mini-transcribe-2025-12-15": "gpt-4o-mini-transcribe-2025-12-15",
  "gpt-4o-transcribe-diarize": "gpt-4o-transcribe-diarize"
} as const satisfies Record<string, AudioTranscriptionModel>

/** OpenAI Realtime model type */
export type OpenAIRealtimeModelType = (typeof OpenAIRealtimeModel)[keyof typeof OpenAIRealtimeModel]

/** OpenAI Realtime audio format type */
export type OpenAIRealtimeAudioFormatType =
  (typeof OpenAIRealtimeAudioFormat)[keyof typeof OpenAIRealtimeAudioFormat]

/** OpenAI Realtime turn detection type */
export type OpenAIRealtimeTurnDetectionType =
  (typeof OpenAIRealtimeTurnDetection)[keyof typeof OpenAIRealtimeTurnDetection]

/** OpenAI Realtime transcription model type */
export type OpenAIRealtimeTranscriptionModelType =
  (typeof OpenAIRealtimeTranscriptionModel)[keyof typeof OpenAIRealtimeTranscriptionModel]

/**
 * OpenAI Whisper supported language codes
 *
 * ISO 639-1 language codes supported by Whisper models.
 * Not exhaustive - Whisper supports 99+ languages but these are the most common.
 *
 * @example
 * ```typescript
 * import { OpenAILanguageCodes, OpenAILanguage } from 'voice-router-dev/constants'
 *
 * { language: OpenAILanguage.en }
 * { language: OpenAILanguage.es }
 * ```
 */
export const OpenAILanguageCodes = [
  "en",
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "nl",
  "ru",
  "zh",
  "ja",
  "ko",
  "ar",
  "hi",
  "pl",
  "uk",
  "cs",
  "ro",
  "hu",
  "el",
  "tr",
  "fi",
  "sv",
  "da",
  "no",
  "th",
  "vi",
  "id",
  "ms",
  "he",
  "fa"
] as const

/**
 * OpenAI language constant object for autocomplete
 *
 * @example
 * ```typescript
 * import { OpenAILanguage } from 'voice-router-dev/constants'
 *
 * { language: OpenAILanguage.en }
 * { language: OpenAILanguage.es }
 * ```
 */
export const OpenAILanguage = {
  en: "en",
  es: "es",
  fr: "fr",
  de: "de",
  it: "it",
  pt: "pt",
  nl: "nl",
  ru: "ru",
  zh: "zh",
  ja: "ja",
  ko: "ko",
  ar: "ar",
  hi: "hi",
  pl: "pl",
  uk: "uk",
  cs: "cs",
  ro: "ro",
  hu: "hu",
  el: "el",
  tr: "tr",
  fi: "fi",
  sv: "sv",
  da: "da",
  no: "no",
  th: "th",
  vi: "vi",
  id: "id",
  ms: "ms",
  he: "he",
  fa: "fa"
} as const satisfies Record<string, (typeof OpenAILanguageCodes)[number]>

/** OpenAI language type */
export type OpenAILanguageType = (typeof OpenAILanguageCodes)[number]
