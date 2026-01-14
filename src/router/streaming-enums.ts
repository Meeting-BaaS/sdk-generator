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
  // Deepgram
  DeepgramEncoding,
  DeepgramRedact,
  DeepgramTopicMode,
  DeepgramModel,
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
  AssemblyAISampleRate,
  AssemblyAITranscriptionModel,
  AssemblyAILanguage,
  // Types
  type DeepgramModelType,
  type DeepgramRedactType,
  type DeepgramTopicModeType,
  type AssemblyAIEncodingType,
  type AssemblyAISpeechModelType,
  type AssemblyAISampleRateType,
  type AssemblyAITranscriptionModelType,
  type AssemblyAILanguageType
} from "../constants"
