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
  // Deepgram streaming
  DeepgramEncoding,
  DeepgramLanguage,
  DeepgramRedact,
  DeepgramTopicMode,
  DeepgramModel,
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
  // Speechmatics
  SpeechmaticsRegion,
  // Types
  type DeepgramLanguageType,
  type DeepgramModelType,
  type DeepgramRedactType,
  type DeepgramTopicModeType,
  type AssemblyAIEncodingType,
  type AssemblyAISpeechModelType,
  type AssemblyAISampleRateType,
  type AssemblyAITranscriptionModelType,
  type AssemblyAILanguageType
} from "../constants"
