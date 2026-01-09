/**
 * Provider metadata - Static runtime data for UI rendering
 *
 * All data is derived from OpenAPI specs and adapter definitions.
 * Use these exports to build dynamic UIs without manual maintenance.
 *
 * @example
 * ```typescript
 * import {
 *   ProviderCapabilitiesMap,
 *   LanguageLabels,
 *   AllLanguageCodes
 * } from 'voice-router-dev'
 *
 * // Check if provider supports a feature
 * if (ProviderCapabilitiesMap.gladia.streaming) {
 *   showStreamingUI()
 * }
 *
 * // Get human-readable language name
 * const label = LanguageLabels.en // "English"
 *
 * // Get all languages for a provider
 * const gladiaLangs = AllLanguageCodes.gladia // ["en", "fr", "de", ...]
 * ```
 *
 * @packageDocumentation
 */

import type { ProviderCapabilities, TranscriptionProvider } from "./router/types"

// Import language enums from generated types
import { TranscriptionLanguageCodeEnum } from "./generated/gladia/schema/transcriptionLanguageCodeEnum"
import { TranscriptLanguageCode } from "./generated/assemblyai/schema/transcriptLanguageCode"

// ─────────────────────────────────────────────────────────────────────────────
// Provider Capabilities (Runtime)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gladia provider capabilities
 */
export const GladiaCapabilities: ProviderCapabilities = {
  streaming: true,
  diarization: true,
  wordTimestamps: true,
  languageDetection: true,
  customVocabulary: true,
  summarization: true,
  sentimentAnalysis: true,
  entityDetection: true,
  piiRedaction: false,
  listTranscripts: true,
  deleteTranscript: true,
  getAudioFile: true
} as const

/**
 * AssemblyAI provider capabilities
 */
export const AssemblyAICapabilities: ProviderCapabilities = {
  streaming: true,
  diarization: true,
  wordTimestamps: true,
  languageDetection: true,
  customVocabulary: true,
  summarization: true,
  sentimentAnalysis: true,
  entityDetection: true,
  piiRedaction: true,
  listTranscripts: true,
  deleteTranscript: true
} as const

/**
 * Deepgram provider capabilities
 */
export const DeepgramCapabilities: ProviderCapabilities = {
  streaming: true,
  diarization: true,
  wordTimestamps: true,
  languageDetection: true,
  customVocabulary: true,
  summarization: true,
  sentimentAnalysis: true,
  entityDetection: true,
  piiRedaction: true,
  listTranscripts: true,
  deleteTranscript: false
} as const

/**
 * OpenAI Whisper provider capabilities
 */
export const OpenAICapabilities: ProviderCapabilities = {
  streaming: false,
  diarization: true,
  wordTimestamps: true,
  languageDetection: false,
  customVocabulary: false,
  summarization: false,
  sentimentAnalysis: false,
  entityDetection: false,
  piiRedaction: false,
  listTranscripts: false,
  deleteTranscript: false
} as const

/**
 * Azure Speech-to-Text provider capabilities
 */
export const AzureCapabilities: ProviderCapabilities = {
  streaming: false,
  diarization: true,
  wordTimestamps: true,
  languageDetection: false,
  customVocabulary: true,
  summarization: false,
  sentimentAnalysis: false,
  entityDetection: false,
  piiRedaction: false,
  listTranscripts: true,
  deleteTranscript: true
} as const

/**
 * Speechmatics provider capabilities
 */
export const SpeechmaticsCapabilities: ProviderCapabilities = {
  streaming: false,
  diarization: true,
  wordTimestamps: true,
  languageDetection: false,
  customVocabulary: true,
  summarization: true,
  sentimentAnalysis: true,
  entityDetection: true,
  piiRedaction: false,
  listTranscripts: true,
  deleteTranscript: true
} as const

/**
 * All provider capabilities in a single map
 *
 * @example
 * ```typescript
 * import { ProviderCapabilitiesMap } from 'voice-router-dev'
 *
 * // Check feature support
 * const provider = 'gladia'
 * if (ProviderCapabilitiesMap[provider].streaming) {
 *   enableStreamingMode()
 * }
 *
 * // Filter providers by capability
 * const streamingProviders = Object.entries(ProviderCapabilitiesMap)
 *   .filter(([_, caps]) => caps.streaming)
 *   .map(([name]) => name)
 * // ['gladia', 'assemblyai', 'deepgram']
 * ```
 */
export const ProviderCapabilitiesMap: Record<TranscriptionProvider, ProviderCapabilities> = {
  gladia: GladiaCapabilities,
  assemblyai: AssemblyAICapabilities,
  deepgram: DeepgramCapabilities,
  "openai-whisper": OpenAICapabilities,
  "azure-stt": AzureCapabilities,
  speechmatics: SpeechmaticsCapabilities
} as const

/**
 * List of capability keys for iteration
 */
export const CapabilityKeys = [
  "streaming",
  "diarization",
  "wordTimestamps",
  "languageDetection",
  "customVocabulary",
  "summarization",
  "sentimentAnalysis",
  "entityDetection",
  "piiRedaction",
  "listTranscripts",
  "deleteTranscript",
  "getAudioFile"
] as const satisfies readonly (keyof ProviderCapabilities)[]

/**
 * Human-readable capability labels for UI
 */
export const CapabilityLabels: Record<keyof ProviderCapabilities, string> = {
  streaming: "Real-time Streaming",
  diarization: "Speaker Diarization",
  wordTimestamps: "Word Timestamps",
  languageDetection: "Language Detection",
  customVocabulary: "Custom Vocabulary",
  summarization: "Summarization",
  sentimentAnalysis: "Sentiment Analysis",
  entityDetection: "Entity Detection",
  piiRedaction: "PII Redaction",
  listTranscripts: "List Transcripts",
  deleteTranscript: "Delete Transcripts",
  getAudioFile: "Download Audio"
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Language Labels (ISO 639-1 codes to human-readable names)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Human-readable labels for ISO 639-1 language codes
 *
 * Covers all languages supported by Gladia and AssemblyAI.
 *
 * @example
 * ```typescript
 * import { LanguageLabels } from 'voice-router-dev'
 *
 * // Get display name for language code
 * const label = LanguageLabels.en // "English"
 * const french = LanguageLabels.fr // "French"
 *
 * // Build a language selector
 * const options = Object.entries(LanguageLabels).map(([code, label]) => ({
 *   value: code,
 *   label: label
 * }))
 * ```
 */
export const LanguageLabels = {
  // Major languages
  en: "English",
  en_us: "English (US)",
  en_uk: "English (UK)",
  en_au: "English (Australia)",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
  ru: "Russian",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  ar: "Arabic",
  hi: "Hindi",

  // European languages
  pl: "Polish",
  uk: "Ukrainian",
  cs: "Czech",
  sk: "Slovak",
  hu: "Hungarian",
  ro: "Romanian",
  bg: "Bulgarian",
  hr: "Croatian",
  sr: "Serbian",
  sl: "Slovenian",
  bs: "Bosnian",
  mk: "Macedonian",
  sq: "Albanian",
  el: "Greek",
  tr: "Turkish",
  fi: "Finnish",
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian",
  nn: "Norwegian Nynorsk",
  is: "Icelandic",
  et: "Estonian",
  lv: "Latvian",
  lt: "Lithuanian",
  mt: "Maltese",
  cy: "Welsh",
  ga: "Irish",
  gl: "Galician",
  ca: "Catalan",
  eu: "Basque",
  lb: "Luxembourgish",

  // Asian languages
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  ms: "Malay",
  tl: "Tagalog",
  my: "Burmese",
  km: "Khmer",
  lo: "Lao",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  ml: "Malayalam",
  kn: "Kannada",
  mr: "Marathi",
  gu: "Gujarati",
  pa: "Punjabi",
  ur: "Urdu",
  ne: "Nepali",
  si: "Sinhala",
  as: "Assamese",
  mn: "Mongolian",
  bo: "Tibetan",
  ka: "Georgian",
  hy: "Armenian",
  az: "Azerbaijani",
  kk: "Kazakh",
  uz: "Uzbek",
  tg: "Tajik",
  tk: "Turkmen",
  tt: "Tatar",
  ba: "Bashkir",

  // African languages
  sw: "Swahili",
  af: "Afrikaans",
  am: "Amharic",
  ha: "Hausa",
  yo: "Yoruba",
  sn: "Shona",
  so: "Somali",
  mg: "Malagasy",
  ln: "Lingala",

  // Middle Eastern languages
  fa: "Persian",
  he: "Hebrew",
  ps: "Pashto",
  sd: "Sindhi",

  // Other languages
  la: "Latin",
  sa: "Sanskrit",
  oc: "Occitan",
  br: "Breton",
  fo: "Faroese",
  ht: "Haitian Creole",
  haw: "Hawaiian",
  mi: "Maori",
  jw: "Javanese",
  su: "Sundanese",
  yi: "Yiddish",
  be: "Belarusian"
} as const

/** Type for language code keys */
export type LanguageCode = keyof typeof LanguageLabels

// ─────────────────────────────────────────────────────────────────────────────
// Provider Language Support
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gladia supported language codes (from OpenAPI spec)
 */
export const GladiaLanguageCodes = Object.values(TranscriptionLanguageCodeEnum)

/**
 * AssemblyAI supported language codes (from OpenAPI spec)
 */
export const AssemblyAILanguageCodes = Object.values(TranscriptLanguageCode)

/**
 * Deepgram supported language codes
 * Note: Deepgram accepts BCP-47 tags, these are the most common
 */
export const DeepgramLanguageCodes = [
  "en",
  "en-US",
  "en-GB",
  "en-AU",
  "en-IN",
  "es",
  "es-419",
  "fr",
  "fr-CA",
  "de",
  "it",
  "pt",
  "pt-BR",
  "nl",
  "ru",
  "uk",
  "pl",
  "cs",
  "sk",
  "hu",
  "ro",
  "bg",
  "hr",
  "sl",
  "el",
  "tr",
  "fi",
  "sv",
  "da",
  "no",
  "et",
  "lv",
  "lt",
  "zh",
  "zh-CN",
  "zh-TW",
  "ja",
  "ko",
  "th",
  "vi",
  "id",
  "ms",
  "tl",
  "hi",
  "ta",
  "te",
  "bn",
  "ar"
] as const

/**
 * OpenAI Whisper supported language codes
 * Whisper supports ISO 639-1 codes
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
 * All language codes per provider
 *
 * @example
 * ```typescript
 * import { AllLanguageCodes } from 'voice-router-dev'
 *
 * // Get languages for a specific provider
 * const gladiaLangs = AllLanguageCodes.gladia
 *
 * // Build provider-specific language selector
 * function getLanguageOptions(provider: string) {
 *   const codes = AllLanguageCodes[provider] || []
 *   return codes.map(code => ({
 *     value: code,
 *     label: LanguageLabels[code] || code
 *   }))
 * }
 * ```
 */
export const AllLanguageCodes = {
  gladia: GladiaLanguageCodes,
  assemblyai: AssemblyAILanguageCodes,
  deepgram: DeepgramLanguageCodes,
  "openai-whisper": OpenAILanguageCodes,
  "azure-stt": [] as readonly string[], // Azure uses locale codes, configured per region
  speechmatics: [] as readonly string[] // Speechmatics uses different config
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Provider Display Names
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Human-readable provider names for UI display
 */
export const ProviderDisplayNames: Record<TranscriptionProvider, string> = {
  gladia: "Gladia",
  assemblyai: "AssemblyAI",
  deepgram: "Deepgram",
  "openai-whisper": "OpenAI Whisper",
  "azure-stt": "Azure Speech",
  speechmatics: "Speechmatics"
} as const

/**
 * Provider website URLs
 */
export const ProviderWebsites: Record<TranscriptionProvider, string> = {
  gladia: "https://gladia.io",
  assemblyai: "https://assemblyai.com",
  deepgram: "https://deepgram.com",
  "openai-whisper": "https://openai.com",
  "azure-stt": "https://azure.microsoft.com/services/cognitive-services/speech-to-text/",
  speechmatics: "https://speechmatics.com"
} as const

/**
 * Provider documentation URLs
 */
export const ProviderDocs: Record<TranscriptionProvider, string> = {
  gladia: "https://docs.gladia.io",
  assemblyai: "https://www.assemblyai.com/docs",
  deepgram: "https://developers.deepgram.com/docs",
  "openai-whisper": "https://platform.openai.com/docs/guides/speech-to-text",
  "azure-stt": "https://learn.microsoft.com/azure/cognitive-services/speech-service/",
  speechmatics: "https://docs.speechmatics.com"
} as const

// ─────────────────────────────────────────────────────────────────────────────
// All Providers List
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List of all supported providers
 */
export const AllProviders: readonly TranscriptionProvider[] = [
  "gladia",
  "assemblyai",
  "deepgram",
  "openai-whisper",
  "azure-stt",
  "speechmatics"
] as const

/**
 * Providers that support streaming transcription
 */
export const StreamingProviders = AllProviders.filter(
  (p) => ProviderCapabilitiesMap[p].streaming
) as readonly TranscriptionProvider[]

/**
 * Providers that support batch/async transcription only
 */
export const BatchOnlyProviders = AllProviders.filter(
  (p) => !ProviderCapabilitiesMap[p].streaming
) as readonly TranscriptionProvider[]
