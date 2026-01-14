/**
 * Lightweight Field Metadata - Pre-computed from Zod schemas
 *
 * AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Regenerate with: pnpm openapi:generate-field-metadata
 *
 * This module provides field metadata without the heavy Zod schema types.
 * Use this for UI rendering, form generation, and field introspection
 * when you don't need runtime Zod validation.
 *
 * Import: `import { GLADIA_FIELDS, GladiaTranscriptionFieldName } from 'voice-router-dev/field-metadata'`
 *
 * For full Zod schemas with runtime validation, use 'voice-router-dev/field-configs' instead.
 *
 * @packageDocumentation
 */

/**
 * Field type for UI rendering
 */
export type FieldType = "string" | "number" | "boolean" | "select" | "multiselect" | "array" | "object"

/**
 * Lightweight field configuration (no Zod dependency)
 */
export interface FieldMetadata {
  /** Field name (from schema key) */
  name: string
  /** Field type for UI rendering */
  type: FieldType
  /** Whether field is required */
  required: boolean
  /** Description from OpenAPI spec */
  description?: string
  /** Default value */
  default?: unknown
  /** Enum options for select types */
  options?: readonly (string | number)[]
  /** Minimum value for numbers */
  min?: number
  /** Maximum value for numbers */
  max?: number
  /** Input format hint (e.g., "comma-separated" for arrays) */
  inputFormat?: "comma-separated" | "json"
}

// ─────────────────────────────────────────────────────────────────────────────
// Gladia
// ─────────────────────────────────────────────────────────────────────────────

/** Gladia transcription field metadata (35 fields) */
export const GLADIA_TRANSCRIPTION_FIELDS = [
  {
    name: "context_prompt",
    type: "string",
    required: false,
    description: "**[Deprecated]** Context to feed the transcription model with for possible better accuracy"
  },
  {
    name: "custom_vocabulary",
    type: "boolean",
    required: false,
    description: "**[Beta]** Can be either boolean to enable custom_vocabulary for this audio or an array with specific vocabulary list to feed the transcription model with"
  },
  {
    name: "custom_vocabulary_config",
    type: "object",
    required: false,
    description: "**[Beta]** Custom vocabulary configuration, if `custom_vocabulary` is enabled"
  },
  {
    name: "detect_language",
    type: "boolean",
    required: true,
    description: "**[Deprecated]** Use `language_config` instead. Detect the language from the given audio",
    default: true
  },
  {
    name: "enable_code_switching",
    type: "boolean",
    required: false,
    description: "**[Deprecated]** Use `language_config` instead.Detect multiple languages in the given audio"
  },
  {
    name: "code_switching_config",
    type: "object",
    required: false,
    description: "**[Deprecated]** Use `language_config` instead. Specify the configuration for code switching"
  },
  {
    name: "language",
    type: "select",
    required: false,
    description: "**[Deprecated]** Use `language_config` instead. Set the spoken language for the given audio (ISO 639 standard)",
    options: [
      "af",
      "am",
      "ar",
      "as",
      "az",
      "ba",
      "be",
      "bg",
      "bn",
      "bo",
      "br",
      "bs",
      "ca",
      "cs",
      "cy",
      "da",
      "de",
      "el",
      "en",
      "es",
      "et",
      "eu",
      "fa",
      "fi",
      "fo",
      "fr",
      "gl",
      "gu",
      "ha",
      "haw",
      "he",
      "hi",
      "hr",
      "ht",
      "hu",
      "hy",
      "id",
      "is",
      "it",
      "ja",
      "jw",
      "ka",
      "kk",
      "km",
      "kn",
      "ko",
      "la",
      "lb",
      "ln",
      "lo",
      "lt",
      "lv",
      "mg",
      "mi",
      "mk",
      "ml",
      "mn",
      "mr",
      "ms",
      "mt",
      "my",
      "ne",
      "nl",
      "nn",
      "no",
      "oc",
      "pa",
      "pl",
      "ps",
      "pt",
      "ro",
      "ru",
      "sa",
      "sd",
      "si",
      "sk",
      "sl",
      "sn",
      "so",
      "sq",
      "sr",
      "su",
      "sv",
      "sw",
      "ta",
      "te",
      "tg",
      "th",
      "tk",
      "tl",
      "tr",
      "tt",
      "uk",
      "ur",
      "uz",
      "vi",
      "yi",
      "yo",
      "zh"
    ]
  },
  {
    name: "callback_url",
    type: "string",
    required: false,
    description: "**[Deprecated]** Use `callback`/`callback_config` instead. Callback URL we will do a `POST` request to with the result of the transcription"
  },
  {
    name: "callback",
    type: "boolean",
    required: false,
    description: "Enable callback for this transcription. If true, the `callback_config` property will be used to customize the callback behaviour"
  },
  {
    name: "callback_config",
    type: "object",
    required: false,
    description: "Customize the callback behaviour (url and http method)"
  },
  {
    name: "subtitles",
    type: "boolean",
    required: false,
    description: "Enable subtitles generation for this transcription"
  },
  {
    name: "subtitles_config",
    type: "object",
    required: false,
    description: "Configuration for subtitles generation if `subtitles` is enabled"
  },
  {
    name: "diarization",
    type: "boolean",
    required: false,
    description: "Enable speaker recognition (diarization) for this audio"
  },
  {
    name: "diarization_config",
    type: "object",
    required: false,
    description: "Speaker recognition configuration, if `diarization` is enabled"
  },
  {
    name: "translation",
    type: "boolean",
    required: false,
    description: "**[Beta]** Enable translation for this audio"
  },
  {
    name: "translation_config",
    type: "object",
    required: false,
    description: "**[Beta]** Translation configuration, if `translation` is enabled"
  },
  {
    name: "summarization",
    type: "boolean",
    required: false,
    description: "**[Beta]** Enable summarization for this audio"
  },
  {
    name: "summarization_config",
    type: "object",
    required: false,
    description: "**[Beta]** Summarization configuration, if `summarization` is enabled"
  },
  {
    name: "moderation",
    type: "boolean",
    required: false,
    description: "**[Alpha]** Enable moderation for this audio"
  },
  {
    name: "named_entity_recognition",
    type: "boolean",
    required: false,
    description: "**[Alpha]** Enable named entity recognition for this audio"
  },
  {
    name: "chapterization",
    type: "boolean",
    required: false,
    description: "**[Alpha]** Enable chapterization for this audio"
  },
  {
    name: "name_consistency",
    type: "boolean",
    required: false,
    description: "**[Alpha]** Enable names consistency for this audio"
  },
  {
    name: "custom_spelling",
    type: "boolean",
    required: false,
    description: "**[Alpha]** Enable custom spelling for this audio"
  },
  {
    name: "custom_spelling_config",
    type: "object",
    required: false,
    description: "**[Alpha]** Custom spelling configuration, if `custom_spelling` is enabled"
  },
  {
    name: "structured_data_extraction",
    type: "boolean",
    required: false,
    description: "**[Alpha]** Enable structured data extraction for this audio"
  },
  {
    name: "structured_data_extraction_config",
    type: "object",
    required: false,
    description: "**[Alpha]** Structured data extraction configuration, if `structured_data_extraction` is enabled"
  },
  {
    name: "sentiment_analysis",
    type: "boolean",
    required: false,
    description: "Enable sentiment analysis for this audio"
  },
  {
    name: "audio_to_llm",
    type: "boolean",
    required: false,
    description: "**[Alpha]** Enable audio to llm processing for this audio"
  },
  {
    name: "audio_to_llm_config",
    type: "object",
    required: false,
    description: "**[Alpha]** Audio to llm configuration, if `audio_to_llm` is enabled"
  },
  {
    name: "custom_metadata",
    type: "string",
    required: false,
    description: "Custom metadata you can attach to this transcription"
  },
  {
    name: "sentences",
    type: "boolean",
    required: false,
    description: "Enable sentences for this audio"
  },
  {
    name: "display_mode",
    type: "boolean",
    required: false,
    description: "**[Alpha]** Allows to change the output display_mode for this audio. The output will be reordered, creating new utterances when speakers overlapped"
  },
  {
    name: "punctuation_enhanced",
    type: "boolean",
    required: false,
    description: "**[Alpha]** Use enhanced punctuation for this audio"
  },
  {
    name: "language_config",
    type: "object",
    required: false,
    description: "Specify the language configuration"
  },
  {
    name: "audio_url",
    type: "string",
    required: true,
    description: "URL to a Gladia file or to an external audio or video file"
  }
] as const
/** Field names for GladiaTranscription */
export type GladiaTranscriptionFieldName = (typeof GLADIA_TRANSCRIPTION_FIELDS)[number]["name"]

/** Gladia streaming field metadata (15 fields) */
export const GLADIA_STREAMING_FIELDS = [
  {
    name: "encoding",
    type: "select",
    required: true,
    description: "The encoding format of the audio stream. Supported formats: \n- PCM: 8, 16, 24, and 32 bits \n- A-law: 8 bits \n- μ-law: 8 bits \n\nNote: No need to add WAV headers to raw audio as the API supports both formats.",
    default: "wav/pcm",
    options: ["wav/pcm", "wav/alaw", "wav/ulaw"]
  },
  {
    name: "bit_depth",
    type: "string",
    required: true,
    description: "The bit depth of the audio stream",
    default: 16
  },
  {
    name: "sample_rate",
    type: "string",
    required: true,
    description: "The sample rate of the audio stream",
    default: 16000
  },
  {
    name: "channels",
    type: "number",
    required: true,
    description: "The number of channels of the audio stream",
    default: 1,
    min: 1,
    max: 8
  },
  {
    name: "custom_metadata",
    type: "string",
    required: false,
    description: "Custom metadata you can attach to this live transcription"
  },
  {
    name: "model",
    type: "select",
    required: true,
    description: "The model used to process the audio. \"solaria-1\" is used by default.",
    default: "solaria-1",
    options: ["solaria-1"]
  },
  {
    name: "endpointing",
    type: "number",
    required: true,
    description: "The endpointing duration in seconds. Endpointing is the duration of silence which will cause an utterance to be considered as finished",
    default: 0.05,
    min: 0.01,
    max: 10
  },
  {
    name: "maximum_duration_without_endpointing",
    type: "number",
    required: true,
    description: "The maximum duration in seconds without endpointing. If endpointing is not detected after this duration, current utterance will be considered as finished",
    default: 5,
    min: 5,
    max: 60
  },
  {
    name: "language_config",
    type: "object",
    required: false,
    description: "Specify the language configuration"
  },
  {
    name: "pre_processing",
    type: "object",
    required: false,
    description: "Specify the pre-processing configuration"
  },
  {
    name: "realtime_processing",
    type: "object",
    required: false,
    description: "Specify the realtime processing configuration"
  },
  {
    name: "post_processing",
    type: "object",
    required: false,
    description: "Specify the post-processing configuration"
  },
  {
    name: "messages_config",
    type: "object",
    required: false,
    description: "Specify the websocket messages configuration"
  },
  {
    name: "callback",
    type: "boolean",
    required: false,
    description: "If true, messages will be sent to configured url."
  },
  {
    name: "callback_config",
    type: "object",
    required: false,
    description: "Specify the callback configuration"
  }
] as const
/** Field names for GladiaStreaming */
export type GladiaStreamingFieldName = (typeof GLADIA_STREAMING_FIELDS)[number]["name"]

/** Gladia list filter field metadata (8 fields) */
export const GLADIA_LIST_FILTER_FIELDS = [
  {
    name: "offset",
    type: "number",
    required: false,
    description: "The starting point for pagination. A value of 0 starts from the first item.",
    min: 0
  },
  {
    name: "limit",
    type: "number",
    required: true,
    description: "The maximum number of items to return. Useful for pagination and controlling data payload size.",
    default: 20,
    min: 1
  },
  {
    name: "date",
    type: "string",
    required: false,
    description: "Filter items relevant to a specific date in ISO format (YYYY-MM-DD)."
  },
  {
    name: "before_date",
    type: "string",
    required: false,
    description: "Include items that occurred before the specified date in ISO format."
  },
  {
    name: "after_date",
    type: "string",
    required: false,
    description: "Filter for items after the specified date. Use with `before_date` for a range. Date in ISO format."
  },
  {
    name: "status",
    type: "multiselect",
    required: false,
    description: "Filter the list based on item status. Accepts multiple values from the predefined list.",
    options: ["queued", "processing", "done", "error"],
    inputFormat: "comma-separated"
  },
  {
    name: "custom_metadata",
    type: "string",
    required: false
  },
  {
    name: "kind",
    type: "multiselect",
    required: false,
    description: "Filter the list based on the item type. Supports multiple values from the predefined list.",
    options: ["pre-recorded", "live"],
    inputFormat: "comma-separated"
  }
] as const
/** Field names for GladiaListFilter */
export type GladiaListFilterFieldName = (typeof GLADIA_LIST_FILTER_FIELDS)[number]["name"]

// ─────────────────────────────────────────────────────────────────────────────
// Deepgram
// ─────────────────────────────────────────────────────────────────────────────

/** Deepgram transcription field metadata (36 fields) */
export const DEEPGRAM_TRANSCRIPTION_FIELDS = [
  {
    name: "callback",
    type: "string",
    required: false,
    description: "URL to which we'll make the callback request"
  },
  {
    name: "callback_method",
    type: "select",
    required: true,
    description: "HTTP method by which the callback request will be made",
    default: "POST",
    options: ["POST", "PUT"]
  },
  {
    name: "extra",
    type: "string",
    required: false,
    description: "Arbitrary key-value pairs that are attached to the API response for usage in downstream processing"
  },
  {
    name: "sentiment",
    type: "boolean",
    required: false,
    description: "Recognizes the sentiment throughout a transcript or text"
  },
  {
    name: "summarize",
    type: "string",
    required: false,
    description: "Summarize content. For Listen API, supports string version option. For Read API, accepts boolean only."
  },
  {
    name: "tag",
    type: "string",
    required: false,
    description: "Label your requests for the purpose of identification during usage reporting"
  },
  {
    name: "topics",
    type: "boolean",
    required: false,
    description: "Detect topics throughout a transcript or text"
  },
  {
    name: "custom_topic",
    type: "string",
    required: false,
    description: "Custom topics you want the model to detect within your input audio or text if present Submit up to `100`."
  },
  {
    name: "custom_topic_mode",
    type: "select",
    required: true,
    description: "Sets how the model will interpret strings submitted to the `custom_topic` param. When `strict`, the model will only return topics submitted using the `custom_topic` param. When `extended`, the model will return its own detected topics in addition to those submitted using the `custom_topic` param",
    default: "extended",
    options: ["extended", "strict"]
  },
  {
    name: "intents",
    type: "boolean",
    required: false,
    description: "Recognizes speaker intent throughout a transcript or text"
  },
  {
    name: "custom_intent",
    type: "string",
    required: false,
    description: "Custom intents you want the model to detect within your input audio if present"
  },
  {
    name: "custom_intent_mode",
    type: "select",
    required: true,
    description: "Sets how the model will interpret intents submitted to the `custom_intent` param. When `strict`, the model will only return intents submitted using the `custom_intent` param. When `extended`, the model will return its own detected intents in the `custom_intent` param.",
    default: "extended",
    options: ["extended", "strict"]
  },
  {
    name: "detect_entities",
    type: "boolean",
    required: false,
    description: "Identifies and extracts key entities from content in submitted audio"
  },
  {
    name: "detect_language",
    type: "string",
    required: false,
    description: "Identifies the dominant language spoken in submitted audio"
  },
  {
    name: "diarize",
    type: "boolean",
    required: false,
    description: "Recognize speaker changes. Each word in the transcript will be assigned a speaker number starting at 0"
  },
  {
    name: "dictation",
    type: "boolean",
    required: false,
    description: "Dictation mode for controlling formatting with dictated speech"
  },
  {
    name: "encoding",
    type: "select",
    required: false,
    description: "Specify the expected encoding of your submitted audio",
    options: ["linear16", "flac", "mulaw", "amr-nb", "amr-wb", "opus", "speex", "g729"]
  },
  {
    name: "filler_words",
    type: "boolean",
    required: false,
    description: "Filler Words can help transcribe interruptions in your audio, like \"uh\" and \"um\""
  },
  {
    name: "keyterm",
    type: "array",
    required: false,
    description: "Key term prompting can boost or suppress specialized terminology and brands. Only compatible with Nova-3",
    inputFormat: "comma-separated"
  },
  {
    name: "keywords",
    type: "string",
    required: false,
    description: "Keywords can boost or suppress specialized terminology and brands"
  },
  {
    name: "language",
    type: "string",
    required: true,
    description: "The [BCP-47 language tag](https://tools.ietf.org/html/bcp47) that hints at the primary spoken language. Depending on the Model and API endpoint you choose only certain languages are available",
    default: "en"
  },
  {
    name: "measurements",
    type: "boolean",
    required: false,
    description: "Spoken measurements will be converted to their corresponding abbreviations"
  },
  {
    name: "model",
    type: "string",
    required: true,
    description: "AI model used to process submitted audio",
    default: "base-general"
  },
  {
    name: "multichannel",
    type: "boolean",
    required: false,
    description: "Transcribe each audio channel independently"
  },
  {
    name: "numerals",
    type: "boolean",
    required: false,
    description: "Numerals converts numbers from written format to numerical format"
  },
  {
    name: "paragraphs",
    type: "boolean",
    required: false,
    description: "Splits audio into paragraphs to improve transcript readability"
  },
  {
    name: "profanity_filter",
    type: "boolean",
    required: false,
    description: "Profanity Filter looks for recognized profanity and converts it to the nearest recognized non-profane word or removes it from the transcript completely"
  },
  {
    name: "punctuate",
    type: "boolean",
    required: false,
    description: "Add punctuation and capitalization to the transcript"
  },
  {
    name: "redact",
    type: "string",
    required: false,
    description: "Redaction removes sensitive information from your transcripts"
  },
  {
    name: "replace",
    type: "string",
    required: false,
    description: "Search for terms or phrases in submitted audio and replaces them"
  },
  {
    name: "search",
    type: "string",
    required: false,
    description: "Search for terms or phrases in submitted audio"
  },
  {
    name: "smart_format",
    type: "boolean",
    required: false,
    description: "Apply formatting to transcript output. When set to true, additional formatting will be applied to transcripts to improve readability"
  },
  {
    name: "utterances",
    type: "boolean",
    required: false,
    description: "Segments speech into meaningful semantic units"
  },
  {
    name: "utt_split",
    type: "number",
    required: true,
    description: "Seconds to wait before detecting a pause between words in submitted audio",
    default: 0.8
  },
  {
    name: "version",
    type: "string",
    required: true,
    description: "Version of an AI model to use",
    default: "latest"
  },
  {
    name: "mip_opt_out",
    type: "boolean",
    required: false,
    description: "Opts out requests from the Deepgram Model Improvement Program. Refer to our Docs for pricing impacts before setting this to true. https://dpgr.am/deepgram-mip"
  }
] as const
/** Field names for DeepgramTranscription */
export type DeepgramTranscriptionFieldName = (typeof DEEPGRAM_TRANSCRIPTION_FIELDS)[number]["name"]

/** Deepgram streaming field metadata (44 fields) */
export const DEEPGRAM_STREAMING_FIELDS = [
  {
    name: "callback",
    type: "string",
    required: false,
    description: "URL to which we'll make the callback request"
  },
  {
    name: "callback_method",
    type: "select",
    required: true,
    description: "HTTP method by which the callback request will be made",
    default: "POST",
    options: ["POST", "PUT"]
  },
  {
    name: "extra",
    type: "string",
    required: false,
    description: "Arbitrary key-value pairs that are attached to the API response for usage in downstream processing"
  },
  {
    name: "sentiment",
    type: "boolean",
    required: false,
    description: "Recognizes the sentiment throughout a transcript or text"
  },
  {
    name: "summarize",
    type: "string",
    required: false,
    description: "Summarize content. For Listen API, supports string version option. For Read API, accepts boolean only."
  },
  {
    name: "tag",
    type: "string",
    required: false,
    description: "Label your requests for the purpose of identification during usage reporting"
  },
  {
    name: "topics",
    type: "boolean",
    required: false,
    description: "Detect topics throughout a transcript or text"
  },
  {
    name: "custom_topic",
    type: "string",
    required: false,
    description: "Custom topics you want the model to detect within your input audio or text if present Submit up to `100`."
  },
  {
    name: "custom_topic_mode",
    type: "select",
    required: true,
    description: "Sets how the model will interpret strings submitted to the `custom_topic` param. When `strict`, the model will only return topics submitted using the `custom_topic` param. When `extended`, the model will return its own detected topics in addition to those submitted using the `custom_topic` param",
    default: "extended",
    options: ["extended", "strict"]
  },
  {
    name: "intents",
    type: "boolean",
    required: false,
    description: "Recognizes speaker intent throughout a transcript or text"
  },
  {
    name: "custom_intent",
    type: "string",
    required: false,
    description: "Custom intents you want the model to detect within your input audio if present"
  },
  {
    name: "custom_intent_mode",
    type: "select",
    required: true,
    description: "Sets how the model will interpret intents submitted to the `custom_intent` param. When `strict`, the model will only return intents submitted using the `custom_intent` param. When `extended`, the model will return its own detected intents in the `custom_intent` param.",
    default: "extended",
    options: ["extended", "strict"]
  },
  {
    name: "detect_entities",
    type: "boolean",
    required: false,
    description: "Identifies and extracts key entities from content in submitted audio"
  },
  {
    name: "detect_language",
    type: "string",
    required: false,
    description: "Identifies the dominant language spoken in submitted audio"
  },
  {
    name: "diarize",
    type: "boolean",
    required: false,
    description: "Recognize speaker changes. Each word in the transcript will be assigned a speaker number starting at 0"
  },
  {
    name: "dictation",
    type: "boolean",
    required: false,
    description: "Dictation mode for controlling formatting with dictated speech"
  },
  {
    name: "encoding",
    type: "select",
    required: false,
    description: "Specify the expected encoding of your submitted audio",
    options: ["linear16", "flac", "mulaw", "amr-nb", "amr-wb", "opus", "speex", "g729"]
  },
  {
    name: "filler_words",
    type: "boolean",
    required: false,
    description: "Filler Words can help transcribe interruptions in your audio, like \"uh\" and \"um\""
  },
  {
    name: "keyterm",
    type: "array",
    required: false,
    description: "Key term prompting can boost or suppress specialized terminology and brands. Only compatible with Nova-3",
    inputFormat: "comma-separated"
  },
  {
    name: "keywords",
    type: "string",
    required: false,
    description: "Keywords can boost or suppress specialized terminology and brands"
  },
  {
    name: "language",
    type: "string",
    required: true,
    description: "The [BCP-47 language tag](https://tools.ietf.org/html/bcp47) that hints at the primary spoken language. Depending on the Model and API endpoint you choose only certain languages are available",
    default: "en"
  },
  {
    name: "measurements",
    type: "boolean",
    required: false,
    description: "Spoken measurements will be converted to their corresponding abbreviations"
  },
  {
    name: "model",
    type: "string",
    required: true,
    description: "AI model used to process submitted audio",
    default: "base-general"
  },
  {
    name: "multichannel",
    type: "boolean",
    required: false,
    description: "Transcribe each audio channel independently"
  },
  {
    name: "numerals",
    type: "boolean",
    required: false,
    description: "Numerals converts numbers from written format to numerical format"
  },
  {
    name: "paragraphs",
    type: "boolean",
    required: false,
    description: "Splits audio into paragraphs to improve transcript readability"
  },
  {
    name: "profanity_filter",
    type: "boolean",
    required: false,
    description: "Profanity Filter looks for recognized profanity and converts it to the nearest recognized non-profane word or removes it from the transcript completely"
  },
  {
    name: "punctuate",
    type: "boolean",
    required: false,
    description: "Add punctuation and capitalization to the transcript"
  },
  {
    name: "redact",
    type: "string",
    required: false,
    description: "Redaction removes sensitive information from your transcripts"
  },
  {
    name: "replace",
    type: "string",
    required: false,
    description: "Search for terms or phrases in submitted audio and replaces them"
  },
  {
    name: "search",
    type: "string",
    required: false,
    description: "Search for terms or phrases in submitted audio"
  },
  {
    name: "smart_format",
    type: "boolean",
    required: false,
    description: "Apply formatting to transcript output. When set to true, additional formatting will be applied to transcripts to improve readability"
  },
  {
    name: "utterances",
    type: "boolean",
    required: false,
    description: "Segments speech into meaningful semantic units"
  },
  {
    name: "utt_split",
    type: "number",
    required: true,
    description: "Seconds to wait before detecting a pause between words in submitted audio",
    default: 0.8
  },
  {
    name: "version",
    type: "string",
    required: true,
    description: "Version of an AI model to use",
    default: "latest"
  },
  {
    name: "mip_opt_out",
    type: "boolean",
    required: false,
    description: "Opts out requests from the Deepgram Model Improvement Program. Refer to our Docs for pricing impacts before setting this to true. https://dpgr.am/deepgram-mip"
  },
  {
    name: "channels",
    type: "number",
    required: false,
    description: "channels - see https://developers.deepgram.com/docs/channels"
  },
  {
    name: "encoding",
    type: "string",
    required: false,
    description: "encoding - see https://developers.deepgram.com/docs/encoding"
  },
  {
    name: "sample_rate",
    type: "number",
    required: false,
    description: "sample rate - see https://developers.deepgram.com/docs/sample-rate"
  },
  {
    name: "endpointing",
    type: "string",
    required: false,
    description: "endpointing - see https://developers.deepgram.com/docs/endpointing"
  },
  {
    name: "interim_results",
    type: "boolean",
    required: false,
    description: "interim results - see https://developers.deepgram.com/docs/interim-results"
  },
  {
    name: "no_delay",
    type: "boolean",
    required: false,
    description: "smart format#using no delay - see https://developers.deepgram.com/docs/smart-format#using-no-delay"
  },
  {
    name: "utterance_end_ms",
    type: "number",
    required: false,
    description: "understanding end of speech detection - see https://developers.deepgram.com/docs/understanding-end-of-speech-detection"
  },
  {
    name: "vad_events",
    type: "boolean",
    required: false,
    description: "start of speech detection - see https://developers.deepgram.com/docs/start-of-speech-detection"
  }
] as const
/** Field names for DeepgramStreaming */
export type DeepgramStreamingFieldName = (typeof DEEPGRAM_STREAMING_FIELDS)[number]["name"]

/** Deepgram list filter field metadata (10 fields) */
export const DEEPGRAM_LIST_FILTER_FIELDS = [
  {
    name: "start",
    type: "string",
    required: false,
    description: "Start date of the requested date range. Formats accepted are YYYY-MM-DD, YYYY-MM-DDTHH:MM:SS, or YYYY-MM-DDTHH:MM:SS+HH:MM"
  },
  {
    name: "end",
    type: "string",
    required: false,
    description: "End date of the requested date range. Formats accepted are YYYY-MM-DD, YYYY-MM-DDTHH:MM:SS, or YYYY-MM-DDTHH:MM:SS+HH:MM"
  },
  {
    name: "limit",
    type: "number",
    required: true,
    description: "Number of results to return per page. Default 10. Range [1,1000]",
    default: 10,
    min: 1,
    max: 1000
  },
  {
    name: "page",
    type: "number",
    required: false,
    description: "Navigate and return the results to retrieve specific portions of information of the response"
  },
  {
    name: "accessor",
    type: "string",
    required: false,
    description: "Filter for requests where a specific accessor was used"
  },
  {
    name: "request_id",
    type: "string",
    required: false,
    description: "Filter for a specific request id"
  },
  {
    name: "deployment",
    type: "select",
    required: false,
    description: "Filter for requests where a specific deployment was used",
    options: ["hosted", "beta", "self-hosted"]
  },
  {
    name: "endpoint",
    type: "select",
    required: false,
    description: "Filter for requests where a specific endpoint was used",
    options: ["listen", "read", "speak", "agent"]
  },
  {
    name: "method",
    type: "select",
    required: false,
    description: "Filter for requests where a specific method was used",
    options: ["sync", "async", "streaming"]
  },
  {
    name: "status",
    type: "select",
    required: false,
    description: "Filter for requests that succeeded (status code < 300) or failed (status code >=400)",
    options: ["succeeded", "failed"]
  }
] as const
/** Field names for DeepgramListFilter */
export type DeepgramListFilterFieldName = (typeof DEEPGRAM_LIST_FILTER_FIELDS)[number]["name"]

// ─────────────────────────────────────────────────────────────────────────────
// AssemblyAI
// ─────────────────────────────────────────────────────────────────────────────

/** AssemblyAI transcription field metadata (40 fields) */
export const ASSEMBLYAI_TRANSCRIPTION_FIELDS = [
  {
    name: "audio_url",
    type: "string",
    required: true,
    description: "The URL of the audio or video file to transcribe."
  },
  {
    name: "language_code",
    type: "string",
    required: true,
    description: "The language of your audio file. Possible values are found in [Supported Languages](https://www.assemblyai.com/docs/concepts/supported-languages).\nThe default value is 'en_us'.\n",
    default: "en_us"
  },
  {
    name: "language_detection",
    type: "boolean",
    required: false,
    description: "Enable [Automatic language detection](https://www.assemblyai.com/docs/models/speech-recognition#automatic-language-detection), either true or false."
  },
  {
    name: "language_confidence_threshold",
    type: "number",
    required: false,
    description: "The confidence threshold for the automatically detected language.\nAn error will be returned if the language confidence is below this threshold.\nDefaults to 0.\n",
    min: 0,
    max: 1
  },
  {
    name: "speech_model",
    type: "string",
    required: true,
    description: "The speech model to use for the transcription. When `null`, the \"best\" model is used.",
    default: "best"
  },
  {
    name: "punctuate",
    type: "boolean",
    required: true,
    description: "Enable Automatic Punctuation, can be true or false",
    default: true
  },
  {
    name: "format_text",
    type: "boolean",
    required: true,
    description: "Enable Text Formatting, can be true or false",
    default: true
  },
  {
    name: "disfluencies",
    type: "boolean",
    required: false,
    description: "Transcribe Filler Words, like \"umm\", in your media file; can be true or false"
  },
  {
    name: "multichannel",
    type: "boolean",
    required: false,
    description: "Enable [Multichannel](https://www.assemblyai.com/docs/models/speech-recognition#multichannel-transcription) transcription, can be true or false."
  },
  {
    name: "webhook_url",
    type: "string",
    required: false,
    description: "The URL to which we send webhook requests.\nWe sends two different types of webhook requests.\nOne request when a transcript is completed or failed, and one request when the redacted audio is ready if redact_pii_audio is enabled.\n"
  },
  {
    name: "webhook_auth_header_name",
    type: "string",
    required: false,
    description: "The header name to be sent with the transcript completed or failed webhook requests"
  },
  {
    name: "webhook_auth_header_value",
    type: "string",
    required: false,
    description: "The header value to send back with the transcript completed or failed webhook requests for added security"
  },
  {
    name: "auto_highlights",
    type: "boolean",
    required: false,
    description: "Enable Key Phrases, either true or false"
  },
  {
    name: "audio_start_from",
    type: "number",
    required: false,
    description: "The point in time, in milliseconds, to begin transcribing in your media file"
  },
  {
    name: "audio_end_at",
    type: "number",
    required: false,
    description: "The point in time, in milliseconds, to stop transcribing in your media file"
  },
  {
    name: "word_boost",
    type: "array",
    required: false,
    description: "The list of custom vocabulary to boost transcription probability for",
    inputFormat: "comma-separated"
  },
  {
    name: "boost_param",
    type: "select",
    required: false,
    description: "How much to boost specified words",
    options: ["low", "default", "high"]
  },
  {
    name: "filter_profanity",
    type: "boolean",
    required: false,
    description: "Filter profanity from the transcribed text, can be true or false"
  },
  {
    name: "redact_pii",
    type: "boolean",
    required: false,
    description: "Redact PII from the transcribed text using the Redact PII model, can be true or false"
  },
  {
    name: "redact_pii_audio",
    type: "boolean",
    required: false,
    description: "Generate a copy of the original media file with spoken PII \"beeped\" out, can be true or false. See [PII redaction](https://www.assemblyai.com/docs/models/pii-redaction) for more details."
  },
  {
    name: "redact_pii_audio_quality",
    type: "select",
    required: false,
    description: "Controls the filetype of the audio created by redact_pii_audio. Currently supports mp3 (default) and wav. See [PII redaction](https://www.assemblyai.com/docs/models/pii-redaction) for more details.",
    options: ["mp3", "wav"]
  },
  {
    name: "redact_pii_policies",
    type: "multiselect",
    required: false,
    description: "The list of PII Redaction policies to enable. See [PII redaction](https://www.assemblyai.com/docs/models/pii-redaction) for more details.",
    options: [
      "account_number",
      "banking_information",
      "blood_type",
      "credit_card_cvv",
      "credit_card_expiration",
      "credit_card_number",
      "date",
      "date_interval",
      "date_of_birth",
      "drivers_license",
      "drug",
      "duration",
      "email_address",
      "event",
      "filename",
      "gender_sexuality",
      "healthcare_number",
      "injury",
      "ip_address",
      "language",
      "location",
      "marital_status",
      "medical_condition",
      "medical_process",
      "money_amount",
      "nationality",
      "number_sequence",
      "occupation",
      "organization",
      "passport_number",
      "password",
      "person_age",
      "person_name",
      "phone_number",
      "physical_attribute",
      "political_affiliation",
      "religion",
      "statistics",
      "time",
      "url",
      "us_social_security_number",
      "username",
      "vehicle_id",
      "zodiac_sign"
    ],
    inputFormat: "comma-separated"
  },
  {
    name: "redact_pii_sub",
    type: "string",
    required: true,
    description: "The replacement logic for detected PII, can be \"entity_type\" or \"hash\". See [PII redaction](https://www.assemblyai.com/docs/models/pii-redaction) for more details.",
    default: "hash"
  },
  {
    name: "speaker_labels",
    type: "boolean",
    required: false,
    description: "Enable [Speaker diarization](https://www.assemblyai.com/docs/models/speaker-diarization), can be true or false"
  },
  {
    name: "speakers_expected",
    type: "number",
    required: false,
    description: "Tells the speaker label model how many speakers it should attempt to identify. See [Speaker diarization](https://www.assemblyai.com/docs/models/speaker-diarization) for more details."
  },
  {
    name: "content_safety",
    type: "boolean",
    required: false,
    description: "Enable [Content Moderation](https://www.assemblyai.com/docs/models/content-moderation), can be true or false"
  },
  {
    name: "content_safety_confidence",
    type: "number",
    required: true,
    description: "The confidence threshold for the Content Moderation model. Values must be between 25 and 100.",
    default: 50,
    min: 25,
    max: 100
  },
  {
    name: "iab_categories",
    type: "boolean",
    required: false,
    description: "Enable [Topic Detection](https://www.assemblyai.com/docs/models/topic-detection), can be true or false"
  },
  {
    name: "custom_spelling",
    type: "array",
    required: false,
    description: "Customize how words are spelled and formatted using to and from values",
    inputFormat: "comma-separated"
  },
  {
    name: "keyterms_prompt",
    type: "array",
    required: false,
    description: "<Warning>`keyterms_prompt` is only supported when the `speech_model` is specified as `slam-1`</Warning>\nImprove accuracy with up to 1000 domain-specific words or phrases (maximum 6 words per phrase).\n",
    inputFormat: "comma-separated"
  },
  {
    name: "prompt",
    type: "string",
    required: false,
    description: "This parameter does not currently have any functionality attached to it."
  },
  {
    name: "sentiment_analysis",
    type: "boolean",
    required: false,
    description: "Enable [Sentiment Analysis](https://www.assemblyai.com/docs/models/sentiment-analysis), can be true or false"
  },
  {
    name: "auto_chapters",
    type: "boolean",
    required: false,
    description: "Enable [Auto Chapters](https://www.assemblyai.com/docs/models/auto-chapters), can be true or false"
  },
  {
    name: "entity_detection",
    type: "boolean",
    required: false,
    description: "Enable [Entity Detection](https://www.assemblyai.com/docs/models/entity-detection), can be true or false"
  },
  {
    name: "speech_threshold",
    type: "number",
    required: false,
    description: "Reject audio files that contain less than this fraction of speech.\nValid values are in the range [0, 1] inclusive.\n",
    min: 0,
    max: 1
  },
  {
    name: "summarization",
    type: "boolean",
    required: false,
    description: "Enable [Summarization](https://www.assemblyai.com/docs/models/summarization), can be true or false"
  },
  {
    name: "summary_model",
    type: "select",
    required: false,
    description: "The model to summarize the transcript",
    options: ["informative", "conversational", "catchy"]
  },
  {
    name: "summary_type",
    type: "select",
    required: false,
    description: "The type of summary",
    options: ["bullets", "bullets_verbose", "gist", "headline", "paragraph"]
  },
  {
    name: "custom_topics",
    type: "boolean",
    required: false,
    description: "Enable custom topics, either true or false"
  },
  {
    name: "topics",
    type: "array",
    required: false,
    description: "The list of custom topics",
    inputFormat: "comma-separated"
  }
] as const
/** Field names for AssemblyAITranscription */
export type AssemblyAITranscriptionFieldName = (typeof ASSEMBLYAI_TRANSCRIPTION_FIELDS)[number]["name"]

/** AssemblyAI streaming field metadata (16 fields) */
export const ASSEMBLYAI_STREAMING_FIELDS = [
  {
    name: "sampleRate",
    type: "number",
    required: true,
    description: "The sample rate of the streamed audio"
  },
  {
    name: "wordBoost",
    type: "string",
    required: false,
    description: "Add up to 2500 characters of custom vocabulary. The parameter value must be a JSON encoded array of strings. The JSON must be URL encoded like other query string parameters."
  },
  {
    name: "encoding",
    type: "select",
    required: false,
    description: "The encoding of the audio data",
    options: ["pcm_s16le", "pcm_mulaw"]
  },
  {
    name: "disablePartialTranscripts",
    type: "boolean",
    required: false,
    description: "Set to true to not receive partial transcripts. Defaults to false."
  },
  {
    name: "enableExtraSessionInformation",
    type: "boolean",
    required: false,
    description: "Set to true to receive the SessionInformation message before the session ends. Defaults to false."
  },
  {
    name: "endOfTurnConfidenceThreshold",
    type: "number",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "minEndOfTurnSilenceWhenConfident",
    type: "number",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "maxTurnSilence",
    type: "number",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "vadThreshold",
    type: "number",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "formatTurns",
    type: "boolean",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "filterProfanity",
    type: "boolean",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "keyterms",
    type: "array",
    required: false,
    description: "From SDK v3",
    inputFormat: "comma-separated"
  },
  {
    name: "keytermsPrompt",
    type: "array",
    required: false,
    description: "From SDK v3",
    inputFormat: "comma-separated"
  },
  {
    name: "speechModel",
    type: "select",
    required: false,
    description: "From SDK v3",
    options: ["universal-streaming-english", "universal-streaming-multilingual"]
  },
  {
    name: "languageDetection",
    type: "boolean",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "inactivityTimeout",
    type: "number",
    required: false,
    description: "From SDK v3"
  }
] as const
/** Field names for AssemblyAIStreaming */
export type AssemblyAIStreamingFieldName = (typeof ASSEMBLYAI_STREAMING_FIELDS)[number]["name"]

/** AssemblyAI streaming update field metadata (6 fields) */
export const ASSEMBLYAI_STREAMING_UPDATE_FIELDS = [
  {
    name: "end_utterance_silence_threshold",
    type: "number",
    required: false,
    description: "The duration threshold in milliseconds",
    min: 0,
    max: 20000
  },
  {
    name: "end_of_turn_confidence_threshold",
    type: "number",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "min_end_of_turn_silence_when_confident",
    type: "number",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "max_turn_silence",
    type: "number",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "vad_threshold",
    type: "number",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "format_turns",
    type: "boolean",
    required: false,
    description: "From SDK v3"
  }
] as const
/** Field names for AssemblyAIStreamingUpdate */
export type AssemblyAIStreamingUpdateFieldName = (typeof ASSEMBLYAI_STREAMING_UPDATE_FIELDS)[number]["name"]

/** AssemblyAI list filter field metadata (6 fields) */
export const ASSEMBLYAI_LIST_FILTER_FIELDS = [
  {
    name: "limit",
    type: "number",
    required: true,
    description: "Maximum amount of transcripts to retrieve",
    default: 10,
    min: 1,
    max: 200
  },
  {
    name: "status",
    type: "select",
    required: false,
    description: "Filter by transcript status",
    options: ["queued", "processing", "completed", "error"]
  },
  {
    name: "created_on",
    type: "string",
    required: false,
    description: "Only get transcripts created on this date"
  },
  {
    name: "before_id",
    type: "string",
    required: false,
    description: "Get transcripts that were created before this transcript ID"
  },
  {
    name: "after_id",
    type: "string",
    required: false,
    description: "Get transcripts that were created after this transcript ID"
  },
  {
    name: "throttled_only",
    type: "boolean",
    required: false,
    description: "Only get throttled transcripts, overrides the status filter"
  }
] as const
/** Field names for AssemblyAIListFilter */
export type AssemblyAIListFilterFieldName = (typeof ASSEMBLYAI_LIST_FILTER_FIELDS)[number]["name"]

// ─────────────────────────────────────────────────────────────────────────────
// OpenAI
// ─────────────────────────────────────────────────────────────────────────────

/** OpenAI transcription field metadata (12 fields) */
export const OPENAI_TRANSCRIPTION_FIELDS = [
  {
    name: "file",
    type: "string",
    required: true,
    description: "The audio file object (not file name) to transcribe, in one of these formats: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, or webm.\n"
  },
  {
    name: "model",
    type: "string",
    required: true,
    description: "ID of the model to use. The options are `gpt-4o-transcribe`, `gpt-4o-mini-transcribe`, `gpt-4o-mini-transcribe-2025-12-15`, `whisper-1` (which is powered by our open source Whisper V2 model), and `gpt-4o-transcribe-diarize`.\n"
  },
  {
    name: "language",
    type: "string",
    required: false,
    description: "The language of the input audio. Supplying the input language in [ISO-639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) (e.g. `en`) format will improve accuracy and latency.\n"
  },
  {
    name: "prompt",
    type: "string",
    required: false,
    description: "An optional text to guide the model's style or continue a previous audio segment. The [prompt](https://platform.openai.com/docs/guides/speech-to-text#prompting) should match the audio language. This field is not supported when using `gpt-4o-transcribe-diarize`.\n"
  },
  {
    name: "response_format",
    type: "select",
    required: true,
    description: "The format of the output, in one of these options: `json`, `text`, `srt`, `verbose_json`, `vtt`, or `diarized_json`. For `gpt-4o-transcribe` and `gpt-4o-mini-transcribe`, the only supported format is `json`. For `gpt-4o-transcribe-diarize`, the supported formats are `json`, `text`, and `diarized_json`, with `diarized_json` required to receive speaker annotations.\n",
    default: "json",
    options: ["json", "text", "srt", "verbose_json", "vtt", "diarized_json"]
  },
  {
    name: "temperature",
    type: "number",
    required: false,
    description: "The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use [log probability](https://en.wikipedia.org/wiki/Log_probability) to automatically increase the temperature until certain thresholds are hit.\n"
  },
  {
    name: "include",
    type: "multiselect",
    required: false,
    description: "Additional information to include in the transcription response.\n`logprobs` will return the log probabilities of the tokens in the\nresponse to understand the model's confidence in the transcription.\n`logprobs` only works with response_format set to `json` and only with\nthe models `gpt-4o-transcribe`, `gpt-4o-mini-transcribe`, and `gpt-4o-mini-transcribe-2025-12-15`. This field is not supported when using `gpt-4o-transcribe-diarize`.\n",
    options: ["logprobs"],
    inputFormat: "comma-separated"
  },
  {
    name: "timestamp_granularities",
    type: "multiselect",
    required: true,
    description: "The timestamp granularities to populate for this transcription. `response_format` must be set `verbose_json` to use timestamp granularities. Either or both of these options are supported: `word`, or `segment`. Note: There is no additional latency for segment timestamps, but generating word timestamps incurs additional latency.\nThis option is not available for `gpt-4o-transcribe-diarize`.\n",
    default: ["segment"],
    options: ["word", "segment"],
    inputFormat: "comma-separated"
  },
  {
    name: "stream",
    type: "string",
    required: false,
    description: "If set to true, the model response data will be streamed to the client\nas it is generated using [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format).\nSee the [Streaming section of the Speech-to-Text guide](https://platform.openai.com/docs/guides/speech-to-text?lang=curl#streaming-transcriptions)\nfor more information.\n\nNote: Streaming is not supported for the `whisper-1` model and will be ignored.\n"
  },
  {
    name: "chunking_strategy",
    type: "string",
    required: false,
    description: "Controls how the audio is cut into chunks. When set to `\"auto\"`, the server first normalizes loudness and then uses voice activity detection (VAD) to choose boundaries. `server_vad` object can be provided to tweak VAD detection parameters manually. If unset, the audio is transcribed as a single block. Required when using `gpt-4o-transcribe-diarize` for inputs longer than 30 seconds. "
  },
  {
    name: "known_speaker_names",
    type: "array",
    required: false,
    description: "Optional list of speaker names that correspond to the audio samples provided in `known_speaker_references[]`. Each entry should be a short identifier (for example `customer` or `agent`). Up to 4 speakers are supported.\n",
    inputFormat: "comma-separated"
  },
  {
    name: "known_speaker_references",
    type: "array",
    required: false,
    description: "Optional list of audio samples (as [data URLs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs)) that contain known speaker references matching `known_speaker_names[]`. Each sample must be between 2 and 10 seconds, and can use any of the same input audio formats supported by `file`.\n",
    inputFormat: "comma-separated"
  }
] as const
/** Field names for OpenAITranscription */
export type OpenAITranscriptionFieldName = (typeof OPENAI_TRANSCRIPTION_FIELDS)[number]["name"]

// ─────────────────────────────────────────────────────────────────────────────
// Azure
// ─────────────────────────────────────────────────────────────────────────────

/** Azure transcription field metadata (10 fields) */
export const AZURE_TRANSCRIPTION_FIELDS = [
  {
    name: "properties",
    type: "object",
    required: false
  },
  {
    name: "model",
    type: "object",
    required: false
  },
  {
    name: "dataset",
    type: "object",
    required: false
  },
  {
    name: "contentUrls",
    type: "array",
    required: false,
    description: "A list of content urls to get audio files to transcribe. Up to 1000 urls are allowed.\r\nThis property will not be returned in a response.",
    inputFormat: "comma-separated"
  },
  {
    name: "contentContainerUrl",
    type: "string",
    required: false,
    description: "A URL for an Azure blob container that contains the audio files. A container is allowed to have a maximum size of 5GB and a maximum number of 10000 blobs.\r\nThe maximum size for a blob is 2.5GB.\r\nContainer SAS should contain 'r' (read) and 'l' (list) permissions.\r\nThis property will not be returned in a response."
  },
  {
    name: "locale",
    type: "string",
    required: true,
    description: "The locale of the contained data. If Language Identification is used, this locale is used to transcribe speech for which no language could be detected."
  },
  {
    name: "displayName",
    type: "string",
    required: true,
    description: "The display name of the object."
  },
  {
    name: "description",
    type: "string",
    required: false,
    description: "The description of the object."
  },
  {
    name: "customProperties",
    type: "string",
    required: false,
    description: "The custom properties of this entity. The maximum allowed key length is 64 characters, the maximum\r\nallowed value length is 256 characters and the count of allowed entries is 10."
  },
  {
    name: "project",
    type: "object",
    required: false
  }
] as const
/** Field names for AzureTranscription */
export type AzureTranscriptionFieldName = (typeof AZURE_TRANSCRIPTION_FIELDS)[number]["name"]

/** Azure list filter field metadata (3 fields) */
export const AZURE_LIST_FILTER_FIELDS = [
  {
    name: "skip",
    type: "number",
    required: false,
    description: "Number of datasets that will be skipped."
  },
  {
    name: "top",
    type: "number",
    required: false,
    description: "Number of datasets that will be included after skipping."
  },
  {
    name: "filter",
    type: "string",
    required: false,
    description: "A filtering expression for selecting a subset of the available transcriptions.\r\n            - Supported properties: displayName, description, createdDateTime, lastActionDateTime, status, locale.\r\n            - Operators:\r\n              - eq, ne are supported for all properties.\r\n              - gt, ge, lt, le are supported for createdDateTime and lastActionDateTime.\r\n              - and, or, not are supported.\r\n            - Example:\r\n              filter=createdDateTime gt 2022-02-01T11:00:00Z"
  }
] as const
/** Field names for AzureListFilter */
export type AzureListFilterFieldName = (typeof AZURE_LIST_FILTER_FIELDS)[number]["name"]

// ─────────────────────────────────────────────────────────────────────────────
// Speechmatics
// ─────────────────────────────────────────────────────────────────────────────

/** Speechmatics transcription field metadata (7 fields) */
export const SPEECHMATICS_TRANSCRIPTION_FIELDS = [
  {
    name: "language",
    type: "string",
    required: true,
    description: "Language model to process the audio input, normally specified as an ISO language code"
  },
  {
    name: "domain",
    type: "string",
    required: false,
    description: "Request a specialized model based on \"language\" but optimized for a particular field"
  },
  {
    name: "output_locale",
    type: "string",
    required: false,
    description: "Language locale to be used when generating the transcription output"
  },
  {
    name: "operating_point",
    type: "select",
    required: false,
    description: "Transcription operating point - standard or enhanced accuracy",
    options: ["standard", "enhanced"]
  },
  {
    name: "diarization",
    type: "select",
    required: false,
    description: "Specify whether speaker or channel labels are added to the transcript",
    options: ["none", "speaker", "channel"]
  },
  {
    name: "enable_entities",
    type: "boolean",
    required: false,
    description: "Include additional entity objects in the transcription results (dates, numbers, etc)"
  },
  {
    name: "max_delay_mode",
    type: "select",
    required: false,
    description: "Whether to enable flexible endpointing for entities",
    options: ["fixed", "flexible"]
  }
] as const
/** Field names for SpeechmaticsTranscription */
export type SpeechmaticsTranscriptionFieldName = (typeof SPEECHMATICS_TRANSCRIPTION_FIELDS)[number]["name"]

/** Speechmatics streaming field metadata (9 fields) */
export const SPEECHMATICS_STREAMING_FIELDS = [
  {
    name: "encoding",
    type: "select",
    required: false,
    description: "Audio encoding format",
    options: ["pcm_f32le", "pcm_s16le", "mulaw"]
  },
  {
    name: "sample_rate",
    type: "number",
    required: false,
    description: "Audio sample rate in Hz"
  },
  {
    name: "language",
    type: "string",
    required: true,
    description: "Language model to process the audio input, normally specified as an ISO language code. The value must be consistent with the language code used in the API endpoint URL."
  },
  {
    name: "domain",
    type: "string",
    required: false,
    description: "Request a specialized model based on 'language' but optimized for a particular field, e.g. `finance` or `medical`."
  },
  {
    name: "max_delay",
    type: "number",
    required: false,
    description: "This is the delay in seconds between the end of a spoken word and returning the Final transcript results. See [Latency](https://docs.speechmatics.com/speech-to-text/realtime/output#latency) for more details",
    min: 0.7,
    max: 4
  },
  {
    name: "max_delay_mode",
    type: "select",
    required: false,
    options: ["flexible", "fixed"]
  },
  {
    name: "enable_partials",
    type: "boolean",
    required: false,
    description: "Whether or not to send Partials (i.e. `AddPartialTranslation` messages) as well as Finals (i.e. `AddTranslation` messages) See [Partial transcripts](https://docs.speechmatics.com/speech-to-text/realtime/output#partial-transcripts)."
  },
  {
    name: "enable_entities",
    type: "boolean",
    required: false
  },
  {
    name: "operating_point",
    type: "select",
    required: false,
    options: ["standard", "enhanced"]
  }
] as const
/** Field names for SpeechmaticsStreaming */
export type SpeechmaticsStreamingFieldName = (typeof SPEECHMATICS_STREAMING_FIELDS)[number]["name"]

/** Speechmatics streaming update field metadata (4 fields) */
export const SPEECHMATICS_STREAMING_UPDATE_FIELDS = [
  {
    name: "language",
    type: "string",
    required: false,
    description: "Language model to process the audio input, normally specified as an ISO language code. The value must be consistent with the language code used in the API endpoint URL."
  },
  {
    name: "max_delay",
    type: "number",
    required: false,
    description: "This is the delay in seconds between the end of a spoken word and returning the Final transcript results. See [Latency](https://docs.speechmatics.com/speech-to-text/realtime/output#latency) for more details",
    min: 0.7,
    max: 4
  },
  {
    name: "max_delay_mode",
    type: "select",
    required: false,
    options: ["flexible", "fixed"]
  },
  {
    name: "enable_partials",
    type: "boolean",
    required: false,
    description: "Whether or not to send Partials (i.e. `AddPartialTranslation` messages) as well as Finals (i.e. `AddTranslation` messages) See [Partial transcripts](https://docs.speechmatics.com/speech-to-text/realtime/output#partial-transcripts)."
  }
] as const
/** Field names for SpeechmaticsStreamingUpdate */
export type SpeechmaticsStreamingUpdateFieldName = (typeof SPEECHMATICS_STREAMING_UPDATE_FIELDS)[number]["name"]

/** Speechmatics list filter field metadata (3 fields) */
export const SPEECHMATICS_LIST_FILTER_FIELDS = [
  {
    name: "created_before",
    type: "string",
    required: false,
    description: "UTC Timestamp cursor for paginating request response"
  },
  {
    name: "limit",
    type: "number",
    required: false,
    description: "Limit for paginating the request response. Defaults to 100.",
    min: 1,
    max: 100
  },
  {
    name: "include_deleted",
    type: "boolean",
    required: false,
    description: "Specifies whether deleted jobs should be included in the response"
  }
] as const
/** Field names for SpeechmaticsListFilter */
export type SpeechmaticsListFilterFieldName = (typeof SPEECHMATICS_LIST_FILTER_FIELDS)[number]["name"]

// ─────────────────────────────────────────────────────────────────────────────
// Soniox
// ─────────────────────────────────────────────────────────────────────────────

/** Soniox transcription field metadata (13 fields) */
export const SONIOX_TRANSCRIPTION_FIELDS = [
  {
    name: "model",
    type: "string",
    required: true,
    description: "Speech-to-text model to use for the transcription."
  },
  {
    name: "audio_url",
    type: "string",
    required: false,
    description: "URL of the audio file to transcribe. Cannot be specified if `file_id` is specified."
  },
  {
    name: "file_id",
    type: "string",
    required: false,
    description: "ID of the uploaded file to transcribe. Cannot be specified if `audio_url` is specified."
  },
  {
    name: "language_hints",
    type: "array",
    required: false,
    description: "Expected languages in the audio. If not specified, languages are automatically detected.",
    inputFormat: "comma-separated"
  },
  {
    name: "language_hints_strict",
    type: "string",
    required: false,
    description: "When `true`, the model will rely more on language hints."
  },
  {
    name: "enable_speaker_diarization",
    type: "string",
    required: false,
    description: "When `true`, speakers are identified and separated in the transcription output."
  },
  {
    name: "enable_language_identification",
    type: "string",
    required: false,
    description: "When `true`, language is detected for each part of the transcription."
  },
  {
    name: "translation",
    type: "string",
    required: false,
    description: "Translation configuration."
  },
  {
    name: "context",
    type: "string",
    required: false,
    description: "Additional context to improve transcription accuracy and formatting of specialized terms."
  },
  {
    name: "webhook_url",
    type: "string",
    required: false,
    description: "URL to receive webhook notifications when transcription is completed or fails."
  },
  {
    name: "webhook_auth_header_name",
    type: "string",
    required: false,
    description: "Name of the authentication header sent with webhook notifications."
  },
  {
    name: "webhook_auth_header_value",
    type: "string",
    required: false,
    description: "Authentication header value sent with webhook notifications."
  },
  {
    name: "client_reference_id",
    type: "string",
    required: false,
    description: "Optional tracking identifier string. Does not need to be unique."
  }
] as const
/** Field names for SonioxTranscription */
export type SonioxTranscriptionFieldName = (typeof SONIOX_TRANSCRIPTION_FIELDS)[number]["name"]

/** Soniox streaming field metadata (11 fields) */
export const SONIOX_STREAMING_FIELDS = [
  {
    name: "model",
    type: "string",
    required: true,
    description: "Real-time model to use (e.g., 'stt-rt-preview', 'stt-rt-v3')"
  },
  {
    name: "audioFormat",
    type: "string",
    required: false,
    description: "Audio format specification. Use 'auto' for automatic detection"
  },
  {
    name: "sampleRate",
    type: "number",
    required: false,
    description: "Sample rate in Hz (required for raw PCM formats)"
  },
  {
    name: "numChannels",
    type: "number",
    required: false,
    description: "Number of audio channels (1 for mono, 2 for stereo) - required for raw PCM formats",
    min: 1,
    max: 2
  },
  {
    name: "languageHints",
    type: "array",
    required: false,
    description: "Expected languages in the audio (ISO language codes)",
    inputFormat: "comma-separated"
  },
  {
    name: "context",
    type: "string",
    required: false,
    description: "Additional context to improve transcription accuracy"
  },
  {
    name: "enableSpeakerDiarization",
    type: "boolean",
    required: false,
    description: "Enable speaker diarization - each token will include a speaker field"
  },
  {
    name: "enableLanguageIdentification",
    type: "boolean",
    required: false,
    description: "Enable language identification - each token will include a language field"
  },
  {
    name: "enableEndpointDetection",
    type: "boolean",
    required: false,
    description: "Enable endpoint detection to detect when a speaker has finished talking"
  },
  {
    name: "translation",
    type: "string",
    required: false,
    description: "Translation configuration"
  },
  {
    name: "clientReferenceId",
    type: "string",
    required: false,
    description: "Optional tracking identifier (client-defined)"
  }
] as const
/** Field names for SonioxStreaming */
export type SonioxStreamingFieldName = (typeof SONIOX_STREAMING_FIELDS)[number]["name"]

/** Soniox list filter field metadata (2 fields) */
export const SONIOX_LIST_FILTER_FIELDS = [
  {
    name: "limit",
    type: "number",
    required: true,
    description: "Maximum number of transcriptions to return.",
    default: 1000,
    min: 1,
    max: 1000
  },
  {
    name: "cursor",
    type: "string",
    required: false,
    description: "Pagination cursor for the next page of results."
  }
] as const
/** Field names for SonioxListFilter */
export type SonioxListFilterFieldName = (typeof SONIOX_LIST_FILTER_FIELDS)[number]["name"]

// ─────────────────────────────────────────────────────────────────────────────
// Convenience exports
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All providers with their field metadata
 */
export const PROVIDER_FIELDS = {
  gladia: {
    transcription: GLADIA_TRANSCRIPTION_FIELDS,
    streaming: GLADIA_STREAMING_FIELDS,
    listFilters: GLADIA_LIST_FILTER_FIELDS,
  },
  deepgram: {
    transcription: DEEPGRAM_TRANSCRIPTION_FIELDS,
    streaming: DEEPGRAM_STREAMING_FIELDS,
    listFilters: DEEPGRAM_LIST_FILTER_FIELDS,
  },
  assemblyai: {
    transcription: ASSEMBLYAI_TRANSCRIPTION_FIELDS,
    streaming: ASSEMBLYAI_STREAMING_FIELDS,
    streamingUpdate: ASSEMBLYAI_STREAMING_UPDATE_FIELDS,
    listFilters: ASSEMBLYAI_LIST_FILTER_FIELDS,
  },
  openai: {
    transcription: OPENAI_TRANSCRIPTION_FIELDS,
  },
  azure: {
    transcription: AZURE_TRANSCRIPTION_FIELDS,
    listFilters: AZURE_LIST_FILTER_FIELDS,
  },
  speechmatics: {
    transcription: SPEECHMATICS_TRANSCRIPTION_FIELDS,
    streaming: SPEECHMATICS_STREAMING_FIELDS,
    streamingUpdate: SPEECHMATICS_STREAMING_UPDATE_FIELDS,
    listFilters: SPEECHMATICS_LIST_FILTER_FIELDS,
  },
  soniox: {
    transcription: SONIOX_TRANSCRIPTION_FIELDS,
    streaming: SONIOX_STREAMING_FIELDS,
    listFilters: SONIOX_LIST_FILTER_FIELDS,
  },
} as const

export type FieldMetadataProvider = keyof typeof PROVIDER_FIELDS
