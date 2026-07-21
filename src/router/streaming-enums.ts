/**
 * Provider-specific streaming enums for type-safe autocomplete
 *
 * Re-exports from the browser-safe constants module.
 * Import directly from 'voice-router-dev/constants' for browser environments.
 *
 * @example
 * ```typescript
 * import { DeepgramEncoding, GladiaEncoding, DeepgramModel } from 'voice-router-dev'
 *
 * await adapter.transcribeStream({
 *   deepgramStreaming: {
 *     encoding: DeepgramEncoding.linear16,
 *     model: DeepgramModel["nova-3"],
 *   }
 * })
 * ```
 */

// Re-export everything from the browser-safe constants module
export {
  // AssemblyAI
  AssemblyAIEncoding,
  type AssemblyAIEncodingType,
  AssemblyAILanguage,
  type AssemblyAILanguageType,
  AssemblyAIRegion,
  type AssemblyAIRegionType,
  AssemblyAISampleRate,
  type AssemblyAISampleRateType,
  AssemblyAISpeechModel,
  type AssemblyAISpeechModelType,
  AssemblyAIStatus,
  type AssemblyAIStatusType,
  AssemblyAITranscriptionModel,
  type AssemblyAITranscriptionModelType,
  // Azure
  AzureLocale,
  type AzureLocaleCode,
  AzureLocaleCodes,
  AzureLocaleLabels,
  AzureLocales,
  type AzureLocaleType,
  type AzureStatusType,
  // Deepgram batch
  DeepgramCallbackMethod,
  type DeepgramCallbackMethodType,
  // Deepgram streaming
  DeepgramEncoding,
  type DeepgramEncodingType,
  DeepgramIntentMode,
  type DeepgramIntentModeType,
  DeepgramLanguage,
  // Types
  type DeepgramLanguageType,
  DeepgramModel,
  type DeepgramModelType,
  DeepgramRedact,
  type DeepgramRedactType,
  DeepgramRegion,
  type DeepgramRegionType,
  DeepgramSampleRate,
  type DeepgramSampleRateType,
  DeepgramStatus,
  type DeepgramStatusType,
  DeepgramTopicMode,
  type DeepgramTopicModeType,
  // Deepgram TTS
  DeepgramTTSContainer,
  type DeepgramTTSContainerType,
  DeepgramTTSEncoding,
  type DeepgramTTSEncodingType,
  DeepgramTTSModel,
  type DeepgramTTSModelType,
  DeepgramTTSSampleRate,
  type DeepgramTTSSampleRateType,
  // ElevenLabs
  ElevenLabsAudioFormat,
  type ElevenLabsAudioFormatType,
  ElevenLabsRegion,
  type ElevenLabsRegionType,
  GladiaBitDepth,
  type GladiaBitDepthType,
  // Gladia
  GladiaEncoding,
  type GladiaEncodingType,
  GladiaLanguage,
  type GladiaLanguageType,
  GladiaModel,
  type GladiaModelType,
  GladiaRegion,
  type GladiaRegionType,
  GladiaSampleRate,
  type GladiaSampleRateType,
  GladiaStatus,
  type GladiaStatusType,
  GladiaTranslationLanguage,
  type GladiaTranslationLanguageType,
  // OpenAI Whisper batch
  OpenAIModel,
  type OpenAIModelType,
  // OpenAI Realtime streaming
  OpenAIRealtimeAudioFormat,
  type OpenAIRealtimeAudioFormatType,
  OpenAIRealtimeModel,
  type OpenAIRealtimeModelType,
  OpenAIRealtimeTranscriptionModel,
  type OpenAIRealtimeTranscriptionModelType,
  OpenAIRealtimeTurnDetection,
  type OpenAIRealtimeTurnDetectionType,
  OpenAIResponseFormat,
  type OpenAIResponseFormatType,
  SonioxAsyncModel,
  type SonioxAsyncModelCode,
  SonioxLanguage,
  type SonioxLanguageCode,
  SonioxLanguageCodes,
  SonioxLanguageLabels,
  SonioxLanguages,
  type SonioxLanguageType,
  SonioxModel,
  type SonioxModelCode,
  SonioxModelCodes,
  SonioxModelLabels,
  SonioxModels,
  SonioxRealtimeModel,
  type SonioxRealtimeModelCode,
  // Soniox
  SonioxRegion,
  type SonioxRegionType,
  SpeechmaticsLanguage,
  type SpeechmaticsLanguageCode,
  SpeechmaticsLanguageCodes,
  SpeechmaticsLanguageLabels,
  SpeechmaticsLanguages,
  type SpeechmaticsLanguageType,
  SpeechmaticsModel,
  type SpeechmaticsModelType,
  SpeechmaticsOperatingPoint,
  type SpeechmaticsOperatingPointType,
  // Speechmatics
  SpeechmaticsRegion,
  type SpeechmaticsRegionType
} from "../constants"
