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
import { SharedCustomTopicModeParameter } from "./generated/deepgram/schema/sharedCustomTopicModeParameter"
import { SharedCustomIntentModeParameter } from "./generated/deepgram/schema/sharedCustomIntentModeParameter"
import { SharedCallbackMethodParameter } from "./generated/deepgram/schema/sharedCallbackMethodParameter"

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

// ─────────────────────────────────────────────────────────────────────────────
// Gladia Constants
// ─────────────────────────────────────────────────────────────────────────────

import { StreamingSupportedEncodingEnum } from "./generated/gladia/schema/streamingSupportedEncodingEnum"
import { StreamingSupportedSampleRateEnum } from "./generated/gladia/schema/streamingSupportedSampleRateEnum"
import { StreamingSupportedBitDepthEnum } from "./generated/gladia/schema/streamingSupportedBitDepthEnum"
import { StreamingSupportedModels } from "./generated/gladia/schema/streamingSupportedModels"
import { StreamingSupportedRegions } from "./generated/gladia/schema/streamingSupportedRegions"
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

import { TranscriptStatus } from "./generated/assemblyai/schema/transcriptStatus"
import { TranscriptionControllerListV2StatusItem } from "./generated/gladia/schema/transcriptionControllerListV2StatusItem"
import { Status } from "./generated/azure/schema/status"
import { ManageV1FilterStatusParameter } from "./generated/deepgram/schema/manageV1FilterStatusParameter"

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

/** AssemblyAI speech model type derived from const object */
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

/** Speechmatics region type derived from const object */
export type SpeechmaticsRegionType = (typeof SpeechmaticsRegion)[keyof typeof SpeechmaticsRegion]

/** Deepgram region type derived from const object */
export type DeepgramRegionType = (typeof DeepgramRegion)[keyof typeof DeepgramRegion]
