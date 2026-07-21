/**
 * Voice Router - Unified transcription interface
 */

export * from "./audio-encoding-types"
export * from "./provider-streaming-types"
export * from "./streaming-enums"
export * from "./types"
export * from "./voice-router"

// ─────────────────────────────────────────────────────────────────────────────
// Streaming Enums - User-Friendly Const Objects for Autocomplete
// ─────────────────────────────────────────────────────────────────────────────

// Re-export types for the enums
export type {
  AssemblyAIEncodingType,
  AssemblyAILanguageType,
  AssemblyAIRegionType,
  AssemblyAISampleRateType,
  AssemblyAISpeechModelType,
  AssemblyAITranscriptionModelType,
  AzureLocaleCode,
  AzureLocaleType,
  DeepgramLanguageType,
  DeepgramModelType,
  DeepgramRedactType,
  DeepgramTopicModeType,
  ElevenLabsRegionType,
  SonioxAsyncModelCode,
  SonioxLanguageCode,
  SonioxLanguageType,
  SonioxModelCode,
  SonioxRealtimeModelCode,
  SpeechmaticsLanguageCode,
  SpeechmaticsLanguageType,
  SpeechmaticsModelType,
  SpeechmaticsOperatingPointType
} from "./streaming-enums"
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
  // AssemblyAI
  AssemblyAIEncoding,
  AssemblyAILanguage,
  AssemblyAIRegion,
  AssemblyAISampleRate,
  AssemblyAISpeechModel,
  AssemblyAIStatus,
  AssemblyAITranscriptionModel,
  // Azure
  AzureLocale,
  AzureLocaleCodes,
  AzureLocaleLabels,
  AzureLocales,
  // Deepgram batch
  DeepgramCallbackMethod,
  // Deepgram streaming
  DeepgramEncoding,
  DeepgramIntentMode,
  DeepgramLanguage,
  DeepgramModel,
  DeepgramRedact,
  DeepgramRegion,
  DeepgramSampleRate,
  DeepgramStatus,
  DeepgramTopicMode,
  // Deepgram TTS
  DeepgramTTSContainer,
  DeepgramTTSEncoding,
  DeepgramTTSModel,
  DeepgramTTSSampleRate,
  // ElevenLabs
  ElevenLabsRegion,
  GladiaBitDepth,
  // Gladia
  GladiaEncoding,
  GladiaLanguage,
  GladiaModel,
  GladiaRegion,
  GladiaSampleRate,
  GladiaStatus,
  GladiaTranslationLanguage,
  // OpenAI Whisper batch
  OpenAIModel,
  // OpenAI Realtime streaming
  OpenAIRealtimeAudioFormat,
  OpenAIRealtimeModel,
  OpenAIRealtimeTranscriptionModel,
  OpenAIRealtimeTurnDetection,
  OpenAIResponseFormat,
  SonioxAsyncModel,
  SonioxLanguage,
  SonioxLanguageCodes,
  SonioxLanguageLabels,
  SonioxLanguages,
  SonioxModel,
  SonioxModelCodes,
  SonioxModelLabels,
  SonioxModels,
  SonioxRealtimeModel,
  // Soniox
  SonioxRegion,
  SpeechmaticsLanguage,
  SpeechmaticsLanguageCodes,
  SpeechmaticsLanguageLabels,
  SpeechmaticsLanguages,
  SpeechmaticsModel,
  SpeechmaticsOperatingPoint,
  // Speechmatics
  SpeechmaticsRegion
} from "./streaming-enums"

// ─────────────────────────────────────────────────────────────────────────────
// Raw Generated Enums (for advanced usage / backward compatibility)
// ─────────────────────────────────────────────────────────────────────────────

export { SpeakV1ContainerParameter } from "../generated/deepgram/schema/speakV1ContainerParameter"
export { SpeakV1EncodingParameter } from "../generated/deepgram/schema/speakV1EncodingParameter"
export { SpeakV1SampleRateParameter } from "../generated/deepgram/schema/speakV1SampleRateParameter"
/**
 * Deepgram Raw Parameter Enums (from OpenAPI spec)
 * @deprecated Use DeepgramEncoding, DeepgramModel etc. for better autocomplete
 */
export { V1ListenPostParametersEncoding } from "../generated/deepgram/schema/v1ListenPostParametersEncoding"
export { V1ListenPostParametersModel } from "../generated/deepgram/schema/v1ListenPostParametersModel"
export { V1ListenPostParametersVersion } from "../generated/deepgram/schema/v1ListenPostParametersVersion"
export { StreamingSupportedBitDepthEnum } from "../generated/gladia/schema/streamingSupportedBitDepthEnum"
/**
 * Gladia Raw Parameter Enums (from OpenAPI spec)
 * @deprecated Use GladiaEncoding, GladiaSampleRate, GladiaBitDepth for better autocomplete
 */
export { StreamingSupportedEncodingEnum } from "../generated/gladia/schema/streamingSupportedEncodingEnum"
export { StreamingSupportedSampleRateEnum } from "../generated/gladia/schema/streamingSupportedSampleRateEnum"
export type { AudioResponseFormat } from "../generated/openai/schema/audioResponseFormat"
/**
 * OpenAI Whisper Types
 * Type-safe types for OpenAI Whisper API
 */
export type { CreateTranscriptionRequestModel } from "../generated/openai/schema/createTranscriptionRequestModel"
