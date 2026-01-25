/**
 * Voice Router - Unified transcription interface
 */

export * from "./types"
export * from "./voice-router"
export * from "./provider-streaming-types"

// ─────────────────────────────────────────────────────────────────────────────
// Streaming Enums - User-Friendly Const Objects for Autocomplete
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Provider-specific streaming enums for type-safe autocomplete
 *
 * These const objects provide IDE autocomplete and compile-time validation.
 *
 * @example Deepgram streaming with autocomplete
 * ```typescript
 * import { DeepgramEncoding, DeepgramModel } from '@meeting-baas/sdk'
 *
 * await adapter.transcribeStream({
 *   deepgramStreaming: {
 *     encoding: DeepgramEncoding.linear16,   // ✅ Autocomplete!
 *     model: DeepgramModel.nova3,            // ✅ Autocomplete!
 *   }
 * })
 * ```
 *
 * @example Gladia streaming with autocomplete
 * ```typescript
 * import { GladiaEncoding, GladiaSampleRate, GladiaLanguage } from '@meeting-baas/sdk'
 *
 * await adapter.transcribeStream({
 *   encoding: GladiaEncoding['wav/pcm'],     // ✅ Autocomplete!
 *   sampleRate: GladiaSampleRate.NUMBER_16000,
 *   language: GladiaLanguage.en
 * })
 * ```
 *
 * @example AssemblyAI streaming with autocomplete
 * ```typescript
 * import { AssemblyAIEncoding, AssemblyAISpeechModel } from '@meeting-baas/sdk'
 *
 * await adapter.transcribeStream({
 *   assemblyaiStreaming: {
 *     encoding: AssemblyAIEncoding.pcmS16le,           // ✅ Autocomplete!
 *     speechModel: AssemblyAISpeechModel.multilingual  // ✅ Autocomplete!
 *   }
 * })
 * ```
 */
export {
  // Deepgram streaming
  DeepgramEncoding,
  DeepgramLanguage,
  DeepgramModel,
  DeepgramRedact,
  DeepgramTopicMode,
  // Deepgram batch
  DeepgramCallbackMethod,
  DeepgramIntentMode,
  DeepgramRegion,
  DeepgramSampleRate,
  DeepgramStatus,
  // Deepgram TTS
  DeepgramTTSContainer,
  DeepgramTTSEncoding,
  DeepgramTTSModel,
  DeepgramTTSSampleRate,
  // Gladia
  GladiaEncoding,
  GladiaSampleRate,
  GladiaBitDepth,
  GladiaModel,
  GladiaLanguage,
  GladiaTranslationLanguage,
  GladiaRegion,
  GladiaStatus,
  // AssemblyAI
  AssemblyAIEncoding,
  AssemblyAISpeechModel,
  AssemblyAISampleRate,
  AssemblyAITranscriptionModel,
  AssemblyAILanguage,
  AssemblyAIStatus,
  // OpenAI Whisper batch
  OpenAIModel,
  OpenAIResponseFormat,
  // OpenAI Realtime streaming
  OpenAIRealtimeAudioFormat,
  OpenAIRealtimeModel,
  OpenAIRealtimeTranscriptionModel,
  OpenAIRealtimeTurnDetection,
  // Soniox
  SonioxRegion,
  SonioxLanguage,
  SonioxLanguageCodes,
  SonioxLanguageLabels,
  SonioxLanguages,
  SonioxModel,
  SonioxModelCodes,
  SonioxModelLabels,
  SonioxModels,
  SonioxRealtimeModel,
  SonioxAsyncModel,
  // Speechmatics
  SpeechmaticsRegion,
  SpeechmaticsLanguage,
  SpeechmaticsLanguageCodes,
  SpeechmaticsLanguageLabels,
  SpeechmaticsLanguages,
  // Azure
  AzureLocale,
  AzureLocaleCodes,
  AzureLocaleLabels,
  AzureLocales
} from "./streaming-enums"

// Re-export types for the enums
export type {
  DeepgramLanguageType,
  DeepgramModelType,
  DeepgramRedactType,
  DeepgramTopicModeType,
  AssemblyAIEncodingType,
  AssemblyAISpeechModelType,
  AssemblyAISampleRateType,
  AssemblyAITranscriptionModelType,
  AssemblyAILanguageType,
  SonioxLanguageCode,
  SonioxLanguageType,
  SonioxModelCode,
  SonioxRealtimeModelCode,
  SonioxAsyncModelCode,
  SpeechmaticsLanguageCode,
  SpeechmaticsLanguageType,
  AzureLocaleCode,
  AzureLocaleType
} from "./streaming-enums"

// ─────────────────────────────────────────────────────────────────────────────
// Raw Generated Enums (for advanced usage / backward compatibility)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deepgram Raw Parameter Enums (from OpenAPI spec)
 * @deprecated Use DeepgramEncoding, DeepgramModel etc. for better autocomplete
 */
export { ListenV1EncodingParameter } from "../generated/deepgram/schema/listenV1EncodingParameter"
export { ListenV1LanguageParameter } from "../generated/deepgram/schema/listenV1LanguageParameter"
export { ListenV1ModelParameter } from "../generated/deepgram/schema/listenV1ModelParameter"
export { ListenV1VersionParameter } from "../generated/deepgram/schema/listenV1VersionParameter"
export { SpeakV1EncodingParameter } from "../generated/deepgram/schema/speakV1EncodingParameter"
export { SpeakV1ContainerParameter } from "../generated/deepgram/schema/speakV1ContainerParameter"
export { SpeakV1SampleRateParameter } from "../generated/deepgram/schema/speakV1SampleRateParameter"

/**
 * Gladia Raw Parameter Enums (from OpenAPI spec)
 * @deprecated Use GladiaEncoding, GladiaSampleRate, GladiaBitDepth for better autocomplete
 */
export { StreamingSupportedEncodingEnum } from "../generated/gladia/schema/streamingSupportedEncodingEnum"
export { StreamingSupportedSampleRateEnum } from "../generated/gladia/schema/streamingSupportedSampleRateEnum"
export { StreamingSupportedBitDepthEnum } from "../generated/gladia/schema/streamingSupportedBitDepthEnum"

/**
 * OpenAI Whisper Types
 * Type-safe types for OpenAI Whisper API
 */
export type { CreateTranscriptionRequestModel } from "../generated/openai/schema/createTranscriptionRequestModel"
export type { AudioResponseFormat } from "../generated/openai/schema/audioResponseFormat"
