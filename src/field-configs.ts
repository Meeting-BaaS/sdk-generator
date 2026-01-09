/**
 * Field configuration types for UI rendering
 *
 * These types and static configs enable downstream consumers to build forms
 * and UIs dynamically without manually maintaining field definitions.
 *
 * Generated from OpenAPI specs at build time.
 *
 * @example
 * ```typescript
 * import { GladiaFieldConfigs, FieldConfig } from 'voice-router-dev'
 *
 * // Render a form dynamically
 * GladiaFieldConfigs.forEach(field => {
 *   if (field.type === 'boolean') {
 *     renderCheckbox(field.name, field.description, field.default)
 *   } else if (field.type === 'select') {
 *     renderSelect(field.name, field.options, field.default)
 *   }
 * })
 * ```
 *
 * @packageDocumentation
 */

// ─────────────────────────────────────────────────────────────────────────────
// Field Configuration Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Field type for UI rendering
 */
export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "select" // Single selection from options
  | "multiselect" // Multiple selection from options
  | "array" // Array of strings/numbers
  | "object" // Nested configuration object

/**
 * Field configuration for UI rendering
 *
 * Contains all metadata needed to render a form field:
 * - Type determines the input component
 * - Options provides choices for select/multiselect
 * - Default provides initial value
 * - Description provides help text
 * - Nested fields for complex configs
 */
export interface FieldConfig {
  /** Field name (API parameter name) */
  name: string
  /** Field type for UI rendering */
  type: FieldType
  /** Human-readable description */
  description: string
  /** Default value if any */
  default?: string | number | boolean | string[]
  /** Whether field is required */
  required?: boolean
  /** Whether field is deprecated */
  deprecated?: boolean
  /** Available options for select/multiselect types */
  options?: readonly string[] | readonly number[]
  /** Nested field configurations for object types */
  nestedFields?: readonly FieldConfig[]
  /** Beta/Alpha feature flag */
  stability?: "stable" | "beta" | "alpha"
  /** Example value for documentation */
  example?: string | number | boolean
  /** Minimum value for numbers */
  min?: number
  /** Maximum value for numbers */
  max?: number
  /** Format hint (e.g., 'uri', 'date-time') */
  format?: string
}

/**
 * Provider field configuration map
 */
export interface ProviderFieldConfigs {
  /** Provider name */
  provider: string
  /** Transcription request fields */
  transcription: readonly FieldConfig[]
  /** Streaming request fields (if supported) */
  streaming?: readonly FieldConfig[]
  /** List transcripts filter fields */
  listFilters?: readonly FieldConfig[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Gladia Field Configurations
// ─────────────────────────────────────────────────────────────────────────────

import { TranscriptionLanguageCodeEnum } from "./generated/gladia/schema/transcriptionLanguageCodeEnum"
import { TranslationLanguageCodeEnum } from "./generated/gladia/schema/translationLanguageCodeEnum"
import { StreamingSupportedModels } from "./generated/gladia/schema/streamingSupportedModels"
import { StreamingSupportedEncodingEnum } from "./generated/gladia/schema/streamingSupportedEncodingEnum"
import { StreamingSupportedSampleRateEnum } from "./generated/gladia/schema/streamingSupportedSampleRateEnum"
import { StreamingSupportedBitDepthEnum } from "./generated/gladia/schema/streamingSupportedBitDepthEnum"
import { StreamingSupportedRegions } from "./generated/gladia/schema/streamingSupportedRegions"
import { TranscriptionControllerListV2StatusItem } from "./generated/gladia/schema/transcriptionControllerListV2StatusItem"

/**
 * Gladia transcription field configurations
 *
 * Generated from Gladia OpenAPI spec InitTranscriptionRequest schema
 */
export const GladiaTranscriptionFields = [
  {
    name: "diarization",
    type: "boolean",
    description: "Enable speaker recognition (diarization) for this audio",
    default: false,
    stability: "stable"
  },
  {
    name: "subtitles",
    type: "boolean",
    description: "Enable subtitles generation for this transcription",
    default: false,
    stability: "stable"
  },
  {
    name: "translation",
    type: "boolean",
    description: "Enable translation for this audio",
    default: false,
    stability: "beta"
  },
  {
    name: "translation_target_languages",
    type: "multiselect",
    description: "Target languages for translation (when translation is enabled)",
    options: Object.values(TranslationLanguageCodeEnum),
    stability: "beta"
  },
  {
    name: "summarization",
    type: "boolean",
    description: "Enable summarization for this audio",
    default: false,
    stability: "beta"
  },
  {
    name: "moderation",
    type: "boolean",
    description: "Enable moderation for this audio",
    default: false,
    stability: "alpha"
  },
  {
    name: "named_entity_recognition",
    type: "boolean",
    description: "Enable named entity recognition for this audio",
    default: false,
    stability: "alpha"
  },
  {
    name: "chapterization",
    type: "boolean",
    description: "Enable chapterization for this audio",
    default: false,
    stability: "alpha"
  },
  {
    name: "sentiment_analysis",
    type: "boolean",
    description: "Enable sentiment analysis for this audio",
    default: false,
    stability: "alpha"
  },
  {
    name: "custom_vocabulary",
    type: "boolean",
    description: "Enable custom vocabulary for this audio",
    default: false,
    stability: "beta"
  },
  {
    name: "language",
    type: "select",
    description: "Set the spoken language for the given audio (ISO 639 standard)",
    options: Object.values(TranscriptionLanguageCodeEnum),
    example: "en",
    stability: "stable"
  },
  {
    name: "callback",
    type: "boolean",
    description:
      "Enable callback for this transcription. If true, the callback_config property will be used",
    default: false,
    stability: "stable"
  }
] as const satisfies readonly FieldConfig[]

/**
 * Gladia streaming field configurations
 *
 * Generated from Gladia OpenAPI spec StreamingRequest schema
 */
export const GladiaStreamingFields = [
  {
    name: "model",
    type: "select",
    description: "Transcription model to use",
    options: Object.values(StreamingSupportedModels),
    default: "solaria-1",
    stability: "stable"
  },
  {
    name: "encoding",
    type: "select",
    description: "Audio encoding format",
    options: Object.values(StreamingSupportedEncodingEnum),
    default: "wav/pcm",
    stability: "stable"
  },
  {
    name: "sample_rate",
    type: "select",
    description: "Audio sample rate in Hz",
    options: Object.values(StreamingSupportedSampleRateEnum),
    default: 16000,
    stability: "stable"
  },
  {
    name: "bit_depth",
    type: "select",
    description: "Audio bit depth",
    options: Object.values(StreamingSupportedBitDepthEnum),
    default: 16,
    stability: "stable"
  },
  {
    name: "channels",
    type: "number",
    description: "Number of audio channels",
    default: 1,
    min: 1,
    max: 8,
    stability: "stable"
  },
  {
    name: "region",
    type: "select",
    description: "Regional endpoint for lower latency",
    options: Object.values(StreamingSupportedRegions),
    stability: "stable"
  },
  {
    name: "language",
    type: "select",
    description: "Spoken language (ISO 639 standard)",
    options: Object.values(TranscriptionLanguageCodeEnum),
    example: "en",
    stability: "stable"
  }
] as const satisfies readonly FieldConfig[]

/**
 * Gladia list filters field configurations
 */
export const GladiaListFilterFields = [
  {
    name: "status",
    type: "multiselect",
    description: "Filter by transcription status",
    options: Object.values(TranscriptionControllerListV2StatusItem),
    stability: "stable"
  },
  {
    name: "limit",
    type: "number",
    description: "Maximum number of items to return",
    default: 20,
    min: 1,
    stability: "stable"
  },
  {
    name: "offset",
    type: "number",
    description: "Pagination offset",
    default: 0,
    min: 0,
    stability: "stable"
  },
  {
    name: "date",
    type: "string",
    description: "Filter by specific date (ISO format YYYY-MM-DD)",
    format: "date",
    stability: "stable"
  },
  {
    name: "before_date",
    type: "string",
    description: "Filter for items before this date (ISO format)",
    format: "date-time",
    stability: "stable"
  },
  {
    name: "after_date",
    type: "string",
    description: "Filter for items after this date (ISO format)",
    format: "date-time",
    stability: "stable"
  }
] as const satisfies readonly FieldConfig[]

/**
 * Complete Gladia field configurations
 */
export const GladiaFieldConfigs: ProviderFieldConfigs = {
  provider: "gladia",
  transcription: GladiaTranscriptionFields,
  streaming: GladiaStreamingFields,
  listFilters: GladiaListFilterFields
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Deepgram Field Configurations
// ─────────────────────────────────────────────────────────────────────────────

import { ListenV1EncodingParameter } from "./generated/deepgram/schema/listenV1EncodingParameter"
import { ListenV1RedactParameterOneOfItem } from "./generated/deepgram/schema/listenV1RedactParameterOneOfItem"
import { SharedCustomTopicModeParameter } from "./generated/deepgram/schema/sharedCustomTopicModeParameter"
import { SharedCustomIntentModeParameter } from "./generated/deepgram/schema/sharedCustomIntentModeParameter"
import { ManageV1FilterStatusParameter } from "./generated/deepgram/schema/manageV1FilterStatusParameter"
import { ManageV1FilterEndpointParameter } from "./generated/deepgram/schema/manageV1FilterEndpointParameter"
import { DeepgramModel } from "./constants"

/**
 * Deepgram transcription field configurations
 *
 * Generated from Deepgram OpenAPI spec ListenV1MediaTranscribeParams schema
 */
export const DeepgramTranscriptionFields = [
  {
    name: "model",
    type: "select",
    description: "AI model used to process submitted audio",
    options: Object.values(DeepgramModel),
    default: "nova-3",
    stability: "stable"
  },
  {
    name: "language",
    type: "string",
    description: "BCP-47 language tag for the primary spoken language",
    example: "en",
    stability: "stable"
  },
  {
    name: "detect_language",
    type: "boolean",
    description: "Enable automatic language detection",
    default: false,
    stability: "stable"
  },
  {
    name: "punctuate",
    type: "boolean",
    description: "Add punctuation and capitalization to the transcript",
    default: true,
    stability: "stable"
  },
  {
    name: "diarize",
    type: "boolean",
    description: "Recognize speaker changes and assign a speaker to each word",
    default: false,
    stability: "stable"
  },
  {
    name: "diarize_version",
    type: "string",
    description: "Version of the diarization feature",
    example: "2021-07-14.0",
    stability: "stable"
  },
  {
    name: "smart_format",
    type: "boolean",
    description: "Apply formatting for readability (dates, times, numbers, etc.)",
    default: true,
    stability: "stable"
  },
  {
    name: "filler_words",
    type: "boolean",
    description: "Include filler words (uh, um) in the transcript",
    default: false,
    stability: "stable"
  },
  {
    name: "numerals",
    type: "boolean",
    description: "Convert numbers from written to numerical format",
    default: false,
    stability: "stable"
  },
  {
    name: "paragraphs",
    type: "boolean",
    description: "Split audio into paragraphs",
    default: false,
    stability: "stable"
  },
  {
    name: "utterances",
    type: "boolean",
    description: "Segment speech into utterances",
    default: false,
    stability: "stable"
  },
  {
    name: "utt_split",
    type: "number",
    description: "Silence threshold (seconds) for utterance splitting",
    default: 0.8,
    min: 0,
    stability: "stable"
  },
  {
    name: "summarize",
    type: "boolean",
    description: "Enable summarization",
    default: false,
    stability: "stable"
  },
  {
    name: "topics",
    type: "boolean",
    description: "Enable topic detection",
    default: false,
    stability: "stable"
  },
  {
    name: "custom_topic_mode",
    type: "select",
    description: "Topic detection mode",
    options: Object.values(SharedCustomTopicModeParameter),
    stability: "stable"
  },
  {
    name: "intents",
    type: "boolean",
    description: "Enable intent detection",
    default: false,
    stability: "stable"
  },
  {
    name: "custom_intent_mode",
    type: "select",
    description: "Intent detection mode",
    options: Object.values(SharedCustomIntentModeParameter),
    stability: "stable"
  },
  {
    name: "sentiment",
    type: "boolean",
    description: "Enable sentiment analysis",
    default: false,
    stability: "stable"
  },
  {
    name: "detect_entities",
    type: "boolean",
    description: "Enable entity detection",
    default: false,
    stability: "stable"
  },
  {
    name: "redact",
    type: "multiselect",
    description: "Redact sensitive information from transcripts",
    options: Object.values(ListenV1RedactParameterOneOfItem),
    stability: "stable"
  },
  {
    name: "encoding",
    type: "select",
    description: "Audio encoding format",
    options: Object.values(ListenV1EncodingParameter),
    stability: "stable"
  },
  {
    name: "sample_rate",
    type: "number",
    description: "Audio sample rate in Hz",
    example: 16000,
    stability: "stable"
  },
  {
    name: "channels",
    type: "number",
    description: "Number of audio channels",
    default: 1,
    stability: "stable"
  },
  {
    name: "multichannel",
    type: "boolean",
    description: "Transcribe each channel independently",
    default: false,
    stability: "stable"
  },
  {
    name: "keywords",
    type: "array",
    description: "Keywords to boost in transcription (format: word:intensifier)",
    stability: "stable"
  },
  {
    name: "search",
    type: "array",
    description: "Terms to search for in the transcript",
    stability: "stable"
  },
  {
    name: "replace",
    type: "array",
    description: "Terms to replace in the transcript (format: old:new)",
    stability: "stable"
  },
  {
    name: "profanity_filter",
    type: "boolean",
    description: "Remove profanity from the transcript",
    default: false,
    stability: "stable"
  },
  {
    name: "callback",
    type: "string",
    description: "Callback URL for async results",
    format: "uri",
    stability: "stable"
  }
] as const satisfies readonly FieldConfig[]

/**
 * Deepgram list filters field configurations
 */
export const DeepgramListFilterFields = [
  {
    name: "status",
    type: "select",
    description: "Filter by request status",
    options: Object.values(ManageV1FilterStatusParameter),
    stability: "stable"
  },
  {
    name: "endpoint",
    type: "select",
    description: "Filter by API endpoint used",
    options: Object.values(ManageV1FilterEndpointParameter),
    stability: "stable"
  },
  {
    name: "start",
    type: "string",
    description: "Start date for filtering (ISO format)",
    format: "date-time",
    stability: "stable"
  },
  {
    name: "end",
    type: "string",
    description: "End date for filtering (ISO format)",
    format: "date-time",
    stability: "stable"
  },
  {
    name: "limit",
    type: "number",
    description: "Maximum number of items to return",
    default: 100,
    min: 1,
    max: 1000,
    stability: "stable"
  },
  {
    name: "page",
    type: "number",
    description: "Page number for pagination",
    default: 0,
    min: 0,
    stability: "stable"
  }
] as const satisfies readonly FieldConfig[]

// Import schema-derived streaming fields (single source of truth)
import {
  DeepgramStreamingFields,
  AssemblyAIStreamingFields
} from "./streaming-field-schemas"

// Re-export for convenience
export { DeepgramStreamingFields, AssemblyAIStreamingFields }

/**
 * Complete Deepgram field configurations
 */
export const DeepgramFieldConfigs: ProviderFieldConfigs = {
  provider: "deepgram",
  transcription: DeepgramTranscriptionFields,
  streaming: DeepgramStreamingFields,
  listFilters: DeepgramListFilterFields
} as const

// ─────────────────────────────────────────────────────────────────────────────
// AssemblyAI Field Configurations
// ─────────────────────────────────────────────────────────────────────────────

import { TranscriptStatus } from "./generated/assemblyai/schema/transcriptStatus"
import { SpeechModel } from "./generated/assemblyai/schema/speechModel"
import { TranscriptLanguageCode } from "./generated/assemblyai/schema/transcriptLanguageCode"
import { RedactPiiAudioQuality } from "./generated/assemblyai/schema/redactPiiAudioQuality"
import { SubstitutionPolicy } from "./generated/assemblyai/schema/substitutionPolicy"
import { SummaryModel } from "./generated/assemblyai/schema/summaryModel"
import { SummaryType } from "./generated/assemblyai/schema/summaryType"

/**
 * AssemblyAI transcription field configurations
 *
 * Generated from AssemblyAI OpenAPI spec TranscriptOptionalParams schema
 */
export const AssemblyAITranscriptionFields = [
  {
    name: "speech_model",
    type: "select",
    description: "The speech model to use for transcription",
    options: Object.values(SpeechModel),
    default: "best",
    stability: "stable"
  },
  {
    name: "language_code",
    type: "select",
    description: "Language code for the audio",
    options: Object.values(TranscriptLanguageCode),
    example: "en",
    stability: "stable"
  },
  {
    name: "language_detection",
    type: "boolean",
    description: "Enable automatic language detection",
    default: false,
    stability: "stable"
  },
  {
    name: "language_confidence_threshold",
    type: "number",
    description: "Minimum confidence threshold for language detection (0-1)",
    default: 0.0,
    min: 0,
    max: 1,
    stability: "stable"
  },
  {
    name: "punctuate",
    type: "boolean",
    description: "Enable automatic punctuation",
    default: true,
    stability: "stable"
  },
  {
    name: "format_text",
    type: "boolean",
    description: "Enable text formatting",
    default: true,
    stability: "stable"
  },
  {
    name: "disfluencies",
    type: "boolean",
    description: "Include disfluencies (uh, um) in the transcript",
    default: false,
    stability: "stable"
  },
  {
    name: "speaker_labels",
    type: "boolean",
    description: "Enable speaker diarization",
    default: false,
    stability: "stable"
  },
  {
    name: "speakers_expected",
    type: "number",
    description: "Expected number of speakers",
    min: 1,
    stability: "stable"
  },
  {
    name: "auto_chapters",
    type: "boolean",
    description: "Enable auto chapters",
    default: false,
    stability: "stable"
  },
  {
    name: "entity_detection",
    type: "boolean",
    description: "Enable entity detection",
    default: false,
    stability: "stable"
  },
  {
    name: "sentiment_analysis",
    type: "boolean",
    description: "Enable sentiment analysis",
    default: false,
    stability: "stable"
  },
  {
    name: "auto_highlights",
    type: "boolean",
    description: "Enable auto highlights (key phrases)",
    default: false,
    stability: "stable"
  },
  {
    name: "content_safety",
    type: "boolean",
    description: "Enable content safety detection",
    default: false,
    stability: "stable"
  },
  {
    name: "iab_categories",
    type: "boolean",
    description: "Enable IAB category detection",
    default: false,
    stability: "stable"
  },
  {
    name: "summarization",
    type: "boolean",
    description: "Enable summarization",
    default: false,
    stability: "stable"
  },
  {
    name: "summary_model",
    type: "select",
    description: "Model to use for summarization",
    options: Object.values(SummaryModel),
    stability: "stable"
  },
  {
    name: "summary_type",
    type: "select",
    description: "Type of summary to generate",
    options: Object.values(SummaryType),
    stability: "stable"
  },
  {
    name: "redact_pii",
    type: "boolean",
    description: "Enable PII redaction",
    default: false,
    stability: "stable"
  },
  {
    name: "redact_pii_audio",
    type: "boolean",
    description: "Redact PII from audio as well",
    default: false,
    stability: "stable"
  },
  {
    name: "redact_pii_audio_quality",
    type: "select",
    description: "Quality of PII-redacted audio",
    options: Object.values(RedactPiiAudioQuality),
    stability: "stable"
  },
  {
    name: "redact_pii_sub",
    type: "select",
    description: "Substitution policy for redacted PII",
    options: Object.values(SubstitutionPolicy),
    stability: "stable"
  },
  {
    name: "word_boost",
    type: "array",
    description: "Words to boost in transcription",
    stability: "stable"
  },
  {
    name: "boost_param",
    type: "select",
    description: "How much to boost the words",
    options: ["low", "default", "high"],
    stability: "stable"
  },
  {
    name: "filter_profanity",
    type: "boolean",
    description: "Filter profanity from transcript",
    default: false,
    stability: "stable"
  },
  {
    name: "webhook_url",
    type: "string",
    description: "Webhook URL for async results",
    format: "uri",
    stability: "stable"
  }
] as const satisfies readonly FieldConfig[]

/**
 * AssemblyAI list filters field configurations
 */
export const AssemblyAIListFilterFields = [
  {
    name: "status",
    type: "select",
    description: "Filter by transcript status",
    options: Object.values(TranscriptStatus),
    stability: "stable"
  },
  {
    name: "limit",
    type: "number",
    description: "Maximum number of transcripts to return",
    default: 20,
    min: 1,
    max: 200,
    stability: "stable"
  },
  {
    name: "created_on",
    type: "string",
    description: "Filter by creation date",
    format: "date",
    stability: "stable"
  },
  {
    name: "throttled_only",
    type: "boolean",
    description: "Only return throttled transcripts",
    default: false,
    stability: "stable"
  }
] as const satisfies readonly FieldConfig[]

/**
 * Complete AssemblyAI field configurations
 */
export const AssemblyAIFieldConfigs: ProviderFieldConfigs = {
  provider: "assemblyai",
  transcription: AssemblyAITranscriptionFields,
  streaming: AssemblyAIStreamingFields,
  listFilters: AssemblyAIListFilterFields
} as const

// ─────────────────────────────────────────────────────────────────────────────
// OpenAI Whisper Field Configurations
// ─────────────────────────────────────────────────────────────────────────────

import { AudioTranscriptionModel } from "./generated/openai/schema/audioTranscriptionModel"
import { AudioResponseFormat } from "./generated/openai/schema/audioResponseFormat"

/**
 * OpenAI Whisper transcription field configurations
 *
 * Generated from OpenAI OpenAPI spec CreateTranscriptionRequest schema
 */
export const OpenAITranscriptionFields = [
  {
    name: "model",
    type: "select",
    description: "ID of the model to use for transcription",
    options: Object.values(AudioTranscriptionModel),
    default: "gpt-4o-transcribe",
    stability: "stable"
  },
  {
    name: "language",
    type: "string",
    description: "Language of the input audio (ISO-639-1 format)",
    example: "en",
    stability: "stable"
  },
  {
    name: "prompt",
    type: "string",
    description: "Optional text to guide the model's style or continue a previous segment",
    stability: "stable"
  },
  {
    name: "response_format",
    type: "select",
    description: "Format of the transcript output",
    options: Object.values(AudioResponseFormat),
    default: "json",
    stability: "stable"
  },
  {
    name: "temperature",
    type: "number",
    description: "Sampling temperature (0-1). Lower is more deterministic.",
    default: 0,
    min: 0,
    max: 1,
    stability: "stable"
  }
] as const satisfies readonly FieldConfig[]

/**
 * Complete OpenAI Whisper field configurations
 */
export const OpenAIFieldConfigs: ProviderFieldConfigs = {
  provider: "openai-whisper",
  transcription: OpenAITranscriptionFields
} as const

// ─────────────────────────────────────────────────────────────────────────────
// All Provider Field Configurations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All provider field configurations in a single map
 *
 * @example
 * ```typescript
 * import { AllFieldConfigs } from 'voice-router-dev'
 *
 * // Get fields for a specific provider
 * const gladiaFields = AllFieldConfigs.gladia.transcription
 * const deepgramFields = AllFieldConfigs.deepgram.transcription
 * ```
 */
export const AllFieldConfigs = {
  gladia: GladiaFieldConfigs,
  deepgram: DeepgramFieldConfigs,
  assemblyai: AssemblyAIFieldConfigs,
  "openai-whisper": OpenAIFieldConfigs
} as const

/**
 * Type for all provider names with field configs
 */
export type FieldConfigProvider = keyof typeof AllFieldConfigs
