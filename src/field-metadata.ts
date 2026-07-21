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
export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "select"
  | "multiselect"
  | "array"
  | "object"

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
  /** Nested fields for object types */
  nestedFields?: FieldMetadata[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Gladia
// ─────────────────────────────────────────────────────────────────────────────

/** Gladia transcription field metadata (26 fields) */
export const GLADIA_TRANSCRIPTION_FIELDS = [
  {
    name: "custom_vocabulary",
    type: "boolean",
    required: true,
    description:
      "**[Beta]** Can be either boolean to enable custom_vocabulary for this audio or an array with specific vocabulary list to feed the transcription model with",
    default: false
  },
  {
    name: "custom_vocabulary_config",
    type: "object",
    required: false,
    description: "**[Beta]** Custom vocabulary configuration, if `custom_vocabulary` is enabled",
    nestedFields: [
      {
        name: "vocabulary",
        type: "array",
        required: true,
        description:
          "Specific vocabulary list to feed the transcription model with. Each item can be a string or an object with the following properties: value, intensity, pronunciations, language.",
        inputFormat: "comma-separated"
      },
      {
        name: "default_intensity",
        type: "number",
        required: false,
        description: "Default intensity for the custom vocabulary",
        min: 0,
        max: 1
      }
    ]
  },
  {
    name: "callback_url",
    type: "string",
    required: false,
    description:
      "**[Deprecated]** Use `callback`/`callback_config` instead. Callback URL we will do a `POST` request to with the result of the transcription"
  },
  {
    name: "callback",
    type: "boolean",
    required: true,
    description:
      "Enable callback for this transcription. If true, the `callback_config` property will be used to customize the callback behaviour",
    default: false
  },
  {
    name: "callback_config",
    type: "object",
    required: false,
    description: "Customize the callback behaviour (url and http method)",
    nestedFields: [
      {
        name: "url",
        type: "string",
        required: true,
        description: "The URL to be called with the result of the transcription"
      },
      {
        name: "method",
        type: "select",
        required: true,
        description:
          "The HTTP method to be used. Allowed values are `POST` or `PUT` (default: `POST`)",
        default: "POST",
        options: ["POST", "PUT"]
      }
    ]
  },
  {
    name: "subtitles",
    type: "boolean",
    required: true,
    description: "Enable subtitles generation for this transcription",
    default: false
  },
  {
    name: "subtitles_config",
    type: "object",
    required: false,
    description: "Configuration for subtitles generation if `subtitles` is enabled",
    nestedFields: [
      {
        name: "formats",
        type: "multiselect",
        required: true,
        description: "Subtitles formats you want your transcription to be formatted to",
        default: ["srt"],
        options: ["srt", "vtt"],
        inputFormat: "comma-separated"
      },
      {
        name: "minimum_duration",
        type: "number",
        required: false,
        description: "Minimum duration of a subtitle in seconds",
        min: 0
      },
      {
        name: "maximum_duration",
        type: "number",
        required: false,
        description: "Maximum duration of a subtitle in seconds",
        min: 1,
        max: 30
      },
      {
        name: "maximum_characters_per_row",
        type: "number",
        required: false,
        description: "Maximum number of characters per row in a subtitle",
        min: 1
      },
      {
        name: "maximum_rows_per_caption",
        type: "number",
        required: false,
        description: "Maximum number of rows per caption",
        min: 1,
        max: 5
      },
      {
        name: "style",
        type: "select",
        required: true,
        description:
          "Style of the subtitles. Compliance mode refers to : https://loc.gov/preservation/digital/formats//fdd/fdd000569.shtml#:~:text=SRT%20files%20are%20basic%20text,alongside%2C%20example%3A%20%22MyVideo123",
        default: "default",
        options: ["default", "compliance"]
      }
    ]
  },
  {
    name: "diarization",
    type: "boolean",
    required: true,
    description: "Enable speaker recognition (diarization) for this audio",
    default: false
  },
  {
    name: "diarization_config",
    type: "object",
    required: false,
    description: "Speaker recognition configuration, if `diarization` is enabled",
    nestedFields: [
      {
        name: "number_of_speakers",
        type: "number",
        required: false,
        description: "Exact number of speakers in the audio",
        min: 1
      },
      {
        name: "min_speakers",
        type: "number",
        required: false,
        description: "Minimum number of speakers in the audio",
        min: 0
      },
      {
        name: "max_speakers",
        type: "number",
        required: false,
        description: "Maximum number of speakers in the audio",
        min: 0
      }
    ]
  },
  {
    name: "translation",
    type: "boolean",
    required: true,
    description: "**[Beta]** Enable translation for this audio",
    default: false
  },
  {
    name: "translation_config",
    type: "object",
    required: false,
    description: "**[Beta]** Translation configuration, if `translation` is enabled",
    nestedFields: [
      {
        name: "target_languages",
        type: "multiselect",
        required: true,
        description:
          "Target language in `iso639-1` format you want the transcription translated to",
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
          "wo",
          "yi",
          "yo",
          "zh"
        ],
        inputFormat: "comma-separated"
      },
      {
        name: "model",
        type: "select",
        required: true,
        description: "Model you want the translation model to use to translate",
        default: "base",
        options: ["base", "enhanced"]
      },
      {
        name: "match_original_utterances",
        type: "boolean",
        required: true,
        description: "Align translated utterances with the original ones",
        default: true
      },
      {
        name: "lipsync",
        type: "boolean",
        required: true,
        description: "Whether to apply lipsync to the translated transcription. ",
        default: true
      },
      {
        name: "context_adaptation",
        type: "boolean",
        required: true,
        description:
          "Enables or disables context-aware translation features that allow the model to adapt translations based on provided context.",
        default: true
      },
      {
        name: "context",
        type: "string",
        required: false,
        description: "Context information to improve translation accuracy"
      },
      {
        name: "informal",
        type: "boolean",
        required: true,
        description:
          "Forces the translation to use informal language forms when available in the target language.",
        default: false
      }
    ]
  },
  {
    name: "summarization",
    type: "boolean",
    required: true,
    description: "Enable summarization for this audio",
    default: false
  },
  {
    name: "summarization_config",
    type: "object",
    required: false,
    description: "Summarization configuration, if `summarization` is enabled",
    nestedFields: [
      {
        name: "type",
        type: "select",
        required: true,
        description: "The type of summarization to apply",
        default: "general",
        options: ["general", "bullet_points", "concise"]
      }
    ]
  },
  {
    name: "named_entity_recognition",
    type: "boolean",
    required: true,
    description: "**[Alpha]** Enable named entity recognition for this audio",
    default: false
  },
  {
    name: "custom_spelling",
    type: "boolean",
    required: true,
    description: "**[Alpha]** Enable custom spelling for this audio",
    default: false
  },
  {
    name: "custom_spelling_config",
    type: "object",
    required: false,
    description: "**[Alpha]** Custom spelling configuration, if `custom_spelling` is enabled",
    nestedFields: [
      {
        name: "spelling_dictionary",
        type: "object",
        required: true,
        description: "The list of spelling applied on the audio transcription",
        inputFormat: "json"
      }
    ]
  },
  {
    name: "sentiment_analysis",
    type: "boolean",
    required: true,
    description: "Enable sentiment analysis for this audio",
    default: false
  },
  {
    name: "audio_to_llm",
    type: "boolean",
    required: true,
    description: "Enable audio to LLM processing for this audio",
    default: false
  },
  {
    name: "audio_to_llm_config",
    type: "object",
    required: false,
    description: "Audio to LLM configuration, if `audio_to_llm` is enabled",
    nestedFields: [
      {
        name: "prompts",
        type: "array",
        required: true,
        description: "The list of prompts applied on the audio transcription",
        inputFormat: "comma-separated"
      },
      {
        name: "model",
        type: "string",
        required: true,
        description:
          "The model to use for the prompt execution. You can find the list of supported models [here](https://openrouter.ai/models).",
        default: "openai/gpt-5.4-nano"
      }
    ]
  },
  {
    name: "pii_redaction",
    type: "boolean",
    required: true,
    description: "Enable PII redaction for this audio",
    default: false
  },
  {
    name: "pii_redaction_config",
    type: "object",
    required: false,
    description: "PII redaction configuration, if `pii_redaction` is enabled",
    nestedFields: [
      {
        name: "entity_types",
        type: "select",
        required: false,
        description: "The entity types to redact",
        options: [
          "APPI",
          "APPI_SENSITIVE",
          "CCI",
          "CORE_ENTITIES",
          "CPRA",
          "GDPR",
          "GDPR_SENSITIVE",
          "HEALTH_INFORMATION",
          "HIPAA_SAFE_HARBOR",
          "LIDI",
          "NUMERICAL_EXCL_PCI",
          "PCI",
          "QUEBEC_PRIVACY_ACT",
          "ACCOUNT_NUMBER",
          "AGE",
          "DATE",
          "DATE_INTERVAL",
          "DOB",
          "DRIVER_LICENSE",
          "DURATION",
          "EMAIL_ADDRESS",
          "EVENT",
          "FILENAME",
          "GENDER",
          "HEALTHCARE_NUMBER",
          "IP_ADDRESS",
          "LANGUAGE",
          "LOCATION",
          "LOCATION_ADDRESS",
          "LOCATION_ADDRESS_STREET",
          "LOCATION_CITY",
          "LOCATION_COORDINATE",
          "LOCATION_COUNTRY",
          "LOCATION_STATE",
          "LOCATION_ZIP",
          "MARITAL_STATUS",
          "MONEY",
          "NAME",
          "NAME_FAMILY",
          "NAME_GIVEN",
          "NAME_MEDICAL_PROFESSIONAL",
          "NUMERICAL_PII",
          "OCCUPATION",
          "ORGANIZATION",
          "ORGANIZATION_MEDICAL_FACILITY",
          "ORIGIN",
          "PASSPORT_NUMBER",
          "PASSWORD",
          "PHONE_NUMBER",
          "PHYSICAL_ATTRIBUTE",
          "POLITICAL_AFFILIATION",
          "RELIGION",
          "SEXUALITY",
          "SSN",
          "TIME",
          "URL",
          "USERNAME",
          "VEHICLE_ID",
          "ZODIAC_SIGN",
          "BLOOD_TYPE",
          "CONDITION",
          "DOSE",
          "DRUG",
          "INJURY",
          "MEDICAL_PROCESS",
          "STATISTICS",
          "BANK_ACCOUNT",
          "CREDIT_CARD",
          "CREDIT_CARD_EXPIRATION",
          "CVV",
          "ROUTING_NUMBER",
          "CORPORATE_ACTION",
          "DAY",
          "EFFECT",
          "FINANCIAL_METRIC",
          "MEDICAL_CODE",
          "MONTH",
          "ORGANIZATION_ID",
          "PRODUCT",
          "PROJECT",
          "TREND",
          "YEAR"
        ]
      },
      {
        name: "processed_text_type",
        type: "select",
        required: false,
        description: "The type of processed text to return (marker or mask)",
        options: ["MARKER", "MASK"]
      }
    ]
  },
  {
    name: "custom_metadata",
    type: "object",
    required: false,
    description: "Custom metadata you can attach to this transcription",
    inputFormat: "json"
  },
  {
    name: "sentences",
    type: "boolean",
    required: true,
    description: "Enable sentences for this audio",
    default: false
  },
  {
    name: "punctuation_enhanced",
    type: "boolean",
    required: true,
    description: "**[Alpha]** Use enhanced punctuation for this audio",
    default: false
  },
  {
    name: "language_config",
    type: "object",
    required: false,
    description: "Specify the language configuration",
    nestedFields: [
      {
        name: "languages",
        type: "multiselect",
        required: true,
        description:
          "If one language is set, it will be used for the transcription. Otherwise, language will be auto-detected by the model.",
        default: [],
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
        ],
        inputFormat: "comma-separated"
      },
      {
        name: "code_switching",
        type: "boolean",
        required: true,
        description:
          "If true, language will be auto-detected on each utterance. Otherwise, language will be auto-detected on first utterance and then used for the rest of the transcription. If one language is set, this option will be ignored.",
        default: false
      }
    ]
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
    description:
      "The encoding format of the audio stream. Supported formats: \n- PCM: 8, 16, 24, and 32 bits \n- A-law: 8 bits \n- μ-law: 8 bits \n\nNote: No need to add WAV headers to raw audio as the API supports both formats.",
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
    type: "object",
    required: false,
    description: "Custom metadata you can attach to this live transcription",
    inputFormat: "json"
  },
  {
    name: "model",
    type: "select",
    required: true,
    description: 'The model used to process the audio. "solaria-1" is used by default.',
    default: "solaria-1",
    options: ["solaria-1"]
  },
  {
    name: "endpointing",
    type: "number",
    required: true,
    description:
      "The endpointing duration in seconds. Endpointing is the duration of silence which will cause an utterance to be considered as finished",
    default: 0.05,
    min: 0.01,
    max: 10
  },
  {
    name: "maximum_duration_without_endpointing",
    type: "number",
    required: true,
    description:
      "The maximum duration in seconds without endpointing. If endpointing is not detected after this duration, current utterance will be considered as finished",
    default: 5,
    min: 5,
    max: 60
  },
  {
    name: "language_config",
    type: "object",
    required: false,
    description: "Specify the language configuration",
    nestedFields: [
      {
        name: "languages",
        type: "multiselect",
        required: true,
        description:
          "If one language is set, it will be used for the transcription. Otherwise, language will be auto-detected by the model.",
        default: [],
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
        ],
        inputFormat: "comma-separated"
      },
      {
        name: "code_switching",
        type: "boolean",
        required: true,
        description:
          "If true, language will be auto-detected on each utterance. Otherwise, language will be auto-detected on first utterance and then used for the rest of the transcription. If one language is set, this option will be ignored.",
        default: false
      }
    ]
  },
  {
    name: "pre_processing",
    type: "object",
    required: false,
    description: "Specify the pre-processing configuration",
    nestedFields: [
      {
        name: "audio_enhancer",
        type: "boolean",
        required: true,
        description: "If true, apply pre-processing to the audio stream to enhance the quality.",
        default: false
      },
      {
        name: "speech_threshold",
        type: "number",
        required: true,
        description:
          "Sensitivity configuration for Speech Threshold. A value close to 1 will apply stricter thresholds, making it less likely to detect background sounds as speech.",
        default: 0.6,
        min: 0,
        max: 1
      }
    ]
  },
  {
    name: "realtime_processing",
    type: "object",
    required: false,
    description: "Specify the realtime processing configuration",
    nestedFields: [
      {
        name: "custom_vocabulary",
        type: "boolean",
        required: true,
        description: "If true, enable custom vocabulary for the transcription.",
        default: false
      },
      {
        name: "custom_vocabulary_config",
        type: "object",
        required: false,
        description: "Custom vocabulary configuration, if `custom_vocabulary` is enabled",
        nestedFields: [
          {
            name: "vocabulary",
            type: "array",
            required: true,
            description:
              "Specific vocabulary list to feed the transcription model with. Each item can be a string or an object with the following properties: value, intensity, pronunciations, language.",
            inputFormat: "comma-separated"
          },
          {
            name: "default_intensity",
            type: "number",
            required: false,
            description: "Default intensity for the custom vocabulary",
            min: 0,
            max: 1
          }
        ]
      },
      {
        name: "custom_spelling",
        type: "boolean",
        required: true,
        description: "If true, enable custom spelling for the transcription.",
        default: false
      },
      {
        name: "custom_spelling_config",
        type: "object",
        required: false,
        description: "Custom spelling configuration, if `custom_spelling` is enabled",
        nestedFields: [
          {
            name: "spelling_dictionary",
            type: "object",
            required: true,
            description: "The list of spelling applied on the audio transcription",
            inputFormat: "json"
          }
        ]
      },
      {
        name: "translation",
        type: "boolean",
        required: true,
        description: "If true, enable translation for the transcription",
        default: false
      },
      {
        name: "translation_config",
        type: "object",
        required: false,
        description: "Translation configuration, if `translation` is enabled",
        nestedFields: [
          {
            name: "target_languages",
            type: "multiselect",
            required: true,
            description:
              "Target language in `iso639-1` format you want the transcription translated to",
            inputFormat: "comma-separated",
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
              "wo",
              "yi",
              "yo",
              "zh"
            ]
          },
          {
            name: "model",
            type: "select",
            required: true,
            description: "Model you want the translation model to use to translate",
            default: "base",
            options: ["base", "enhanced"]
          },
          {
            name: "match_original_utterances",
            type: "boolean",
            required: true,
            description: "Align translated utterances with the original ones",
            default: true
          },
          {
            name: "lipsync",
            type: "boolean",
            required: true,
            description: "Whether to apply lipsync to the translated transcription. ",
            default: true
          },
          {
            name: "context_adaptation",
            type: "boolean",
            required: true,
            description:
              "Enables or disables context-aware translation features that allow the model to adapt translations based on provided context.",
            default: true
          },
          {
            name: "context",
            type: "string",
            required: false,
            description: "Context information to improve translation accuracy"
          },
          {
            name: "informal",
            type: "boolean",
            required: true,
            description:
              "Forces the translation to use informal language forms when available in the target language.",
            default: false
          }
        ]
      },
      {
        name: "named_entity_recognition",
        type: "boolean",
        required: true,
        description: "If true, enable named entity recognition for the transcription.",
        default: false
      },
      {
        name: "sentiment_analysis",
        type: "boolean",
        required: true,
        description: "If true, enable sentiment analysis for the transcription.",
        default: false
      }
    ]
  },
  {
    name: "post_processing",
    type: "object",
    required: false,
    description: "Specify the post-processing configuration",
    nestedFields: [
      {
        name: "summarization",
        type: "boolean",
        required: true,
        description: "If true, generates summarization for the whole transcription.",
        default: false
      },
      {
        name: "summarization_config",
        type: "object",
        required: false,
        description: "Summarization configuration, if `summarization` is enabled",
        nestedFields: [
          {
            name: "type",
            type: "select",
            required: true,
            description: "The type of summarization to apply",
            default: "general",
            options: ["general", "bullet_points", "concise"]
          }
        ]
      },
      {
        name: "chapterization",
        type: "boolean",
        required: true,
        description: "If true, generates chapters for the whole transcription.",
        default: false
      }
    ]
  },
  {
    name: "messages_config",
    type: "object",
    required: false,
    description: "Specify the websocket messages configuration",
    nestedFields: [
      {
        name: "receive_partial_transcripts",
        type: "boolean",
        required: true,
        description: "If true, partial transcript will be sent to websocket.",
        default: false
      },
      {
        name: "receive_final_transcripts",
        type: "boolean",
        required: true,
        description: "If true, final transcript will be sent to websocket.",
        default: true
      },
      {
        name: "receive_speech_events",
        type: "boolean",
        required: true,
        description: "If true, begin and end speech events will be sent to websocket.",
        default: true
      },
      {
        name: "receive_pre_processing_events",
        type: "boolean",
        required: true,
        description: "If true, pre-processing events will be sent to websocket.",
        default: true
      },
      {
        name: "receive_realtime_processing_events",
        type: "boolean",
        required: true,
        description: "If true, realtime processing events will be sent to websocket.",
        default: true
      },
      {
        name: "receive_post_processing_events",
        type: "boolean",
        required: true,
        description: "If true, post-processing events will be sent to websocket.",
        default: true
      },
      {
        name: "receive_acknowledgments",
        type: "boolean",
        required: true,
        description: "If true, acknowledgments will be sent to websocket.",
        default: true
      },
      {
        name: "receive_errors",
        type: "boolean",
        required: true,
        description: "If true, errors will be sent to websocket.",
        default: true
      },
      {
        name: "receive_lifecycle_events",
        type: "boolean",
        required: true,
        description: "If true, lifecycle events will be sent to websocket.",
        default: false
      }
    ]
  },
  {
    name: "callback",
    type: "boolean",
    required: true,
    description: "If true, messages will be sent to configured url.",
    default: false
  },
  {
    name: "callback_config",
    type: "object",
    required: false,
    description: "Specify the callback configuration",
    nestedFields: [
      {
        name: "url",
        type: "string",
        required: false,
        description: "URL on which we will do a `POST` request with configured messages"
      },
      {
        name: "receive_partial_transcripts",
        type: "boolean",
        required: true,
        description: "If true, partial transcript will be sent to the defined callback.",
        default: false
      },
      {
        name: "receive_final_transcripts",
        type: "boolean",
        required: true,
        description: "If true, final transcript will be sent to the defined callback.",
        default: true
      },
      {
        name: "receive_speech_events",
        type: "boolean",
        required: true,
        description: "If true, begin and end speech events will be sent to the defined callback.",
        default: false
      },
      {
        name: "receive_pre_processing_events",
        type: "boolean",
        required: true,
        description: "If true, pre-processing events will be sent to the defined callback.",
        default: true
      },
      {
        name: "receive_realtime_processing_events",
        type: "boolean",
        required: true,
        description: "If true, realtime processing events will be sent to the defined callback.",
        default: true
      },
      {
        name: "receive_post_processing_events",
        type: "boolean",
        required: true,
        description: "If true, post-processing events will be sent to the defined callback.",
        default: true
      },
      {
        name: "receive_acknowledgments",
        type: "boolean",
        required: true,
        description: "If true, acknowledgments will be sent to the defined callback.",
        default: false
      },
      {
        name: "receive_errors",
        type: "boolean",
        required: true,
        description: "If true, errors will be sent to the defined callback.",
        default: false
      },
      {
        name: "receive_lifecycle_events",
        type: "boolean",
        required: true,
        description: "If true, lifecycle events will be sent to the defined callback.",
        default: true
      }
    ]
  }
] as const
/** Field names for GladiaStreaming */
export type GladiaStreamingFieldName = (typeof GLADIA_STREAMING_FIELDS)[number]["name"]

/** Gladia list filter field metadata (8 fields) */
export const GLADIA_LIST_FILTER_FIELDS = [
  {
    name: "offset",
    type: "number",
    required: true,
    description: "The starting point for pagination. A value of 0 starts from the first item.",
    default: 0,
    min: 0
  },
  {
    name: "limit",
    type: "number",
    required: true,
    description:
      "The maximum number of items to return. Useful for pagination and controlling data payload size.",
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
    description:
      "Filter for items after the specified date. Use with `before_date` for a range. Date in ISO format."
  },
  {
    name: "status",
    type: "multiselect",
    required: false,
    description:
      "Filter the list based on item status. Accepts multiple values from the predefined list.",
    options: ["queued", "processing", "done", "error"],
    inputFormat: "comma-separated"
  },
  {
    name: "custom_metadata",
    type: "object",
    required: false,
    inputFormat: "json"
  },
  {
    name: "kind",
    type: "multiselect",
    required: false,
    description:
      "Filter the list based on the item type. Supports multiple values from the predefined list.",
    options: ["pre-recorded", "live"],
    inputFormat: "comma-separated"
  }
] as const
/** Field names for GladiaListFilter */
export type GladiaListFilterFieldName = (typeof GLADIA_LIST_FILTER_FIELDS)[number]["name"]

// ─────────────────────────────────────────────────────────────────────────────
// Deepgram
// ─────────────────────────────────────────────────────────────────────────────

/** Deepgram transcription field metadata (37 fields) */
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
    description:
      "Arbitrary key-value pairs that are attached to the API response for usage in downstream processing"
  },
  {
    name: "sentiment",
    type: "boolean",
    required: true,
    description: "Recognizes the sentiment throughout a transcript or text",
    default: false
  },
  {
    name: "summarize",
    type: "select",
    required: false,
    description:
      "Summarize content. For Listen API, supports string version option. For Read API, accepts boolean only.",
    options: ["v2"]
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
    required: true,
    description: "Detect topics throughout a transcript or text",
    default: false
  },
  {
    name: "custom_topic",
    type: "string",
    required: false,
    description:
      "Custom topics you want the model to detect within your input audio or text if present Submit up to `100`."
  },
  {
    name: "custom_topic_mode",
    type: "select",
    required: true,
    description:
      "Sets how the model will interpret strings submitted to the `custom_topic` param. When `strict`, the model will only return topics submitted using the `custom_topic` param. When `extended`, the model will return its own detected topics in addition to those submitted using the `custom_topic` param",
    default: "extended",
    options: ["extended", "strict"]
  },
  {
    name: "intents",
    type: "boolean",
    required: true,
    description: "Recognizes speaker intent throughout a transcript or text",
    default: false
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
    description:
      "Sets how the model will interpret intents submitted to the `custom_intent` param. When `strict`, the model will only return intents submitted using the `custom_intent` param. When `extended`, the model will return its own detected intents in the `custom_intent` param.",
    default: "extended",
    options: ["extended", "strict"]
  },
  {
    name: "detect_entities",
    type: "boolean",
    required: true,
    description: "Identifies and extracts key entities from content in submitted audio",
    default: false
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
    required: true,
    description:
      "Deprecated: use `diarize_model` instead. Recognize speaker changes. Each word in the transcript will be assigned a speaker number starting at 0.",
    default: false
  },
  {
    name: "diarize_model",
    type: "select",
    required: false,
    description:
      "Select and enable a specific diarization model version. Specifying this parameter enables diarization and selects the model — you do not need to also set the deprecated `diarize=true` parameter. For batch, supported values are `latest` (currently v2), `v1`, and `v2`. For streaming, supported values are `latest` (currently v1) and `v1`; `v2` returns a validation error on streaming requests.",
    options: ["latest", "v1", "v2"]
  },
  {
    name: "dictation",
    type: "boolean",
    required: true,
    description: "Dictation mode for controlling formatting with dictated speech",
    default: false
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
    required: true,
    description: 'Filler Words can help transcribe interruptions in your audio, like "uh" and "um"',
    default: false
  },
  {
    name: "keyterm",
    type: "array",
    required: false,
    description:
      "Key term prompting can boost or suppress specialized terminology and brands. Only compatible with Nova-3",
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
    type: "select",
    required: true,
    description:
      "The [BCP-47 language tag](https://tools.ietf.org/html/bcp47) that hints at the primary spoken language. Depending on the Model and API endpoint you choose only certain languages are available",
    default: "en",
    options: [
      "af",
      "am",
      "ar",
      "ar-AE",
      "ar-DZ",
      "ar-EG",
      "ar-IQ",
      "ar-IR",
      "ar-JO",
      "ar-KW",
      "ar-LB",
      "ar-MA",
      "ar-PS",
      "ar-QA",
      "ar-SA",
      "ar-SD",
      "ar-SY",
      "ar-TD",
      "ar-TN",
      "as",
      "az",
      "ba",
      "be",
      "be-BY",
      "bg",
      "bn",
      "bn-IN",
      "bo",
      "br",
      "bs",
      "bs-BA",
      "ca",
      "cs",
      "cy",
      "da",
      "da-DK",
      "de",
      "de-AT",
      "de-CH",
      "de-DE",
      "el",
      "en",
      "en-AU",
      "en-CA",
      "en-GB",
      "en-IE",
      "en-IN",
      "en-MY",
      "en-NZ",
      "en-PH",
      "en-US",
      "en-ZA",
      "es",
      "es-419",
      "es-AR",
      "es-ES",
      "es-LATAM",
      "es-MX",
      "es-US",
      "et",
      "eu",
      "fa",
      "fi",
      "fo",
      "fr",
      "fr-BE",
      "fr-ca",
      "fr-CA",
      "fr-CH",
      "fr-FR",
      "gl",
      "gu",
      "gu-IN",
      "ha",
      "haw",
      "he",
      "hi",
      "hi-Latn",
      "hr",
      "hr-HR",
      "ht",
      "hu",
      "hy",
      "id",
      "id-ID",
      "is",
      "it",
      "it-IT",
      "ja",
      "ja-JP",
      "jw",
      "ka",
      "kk",
      "km",
      "kn",
      "kn-IN",
      "ko",
      "ko-KR",
      "la",
      "lb",
      "ln",
      "lo",
      "lt",
      "lv",
      "mg",
      "mi",
      "mk",
      "mk-MK",
      "ml",
      "mn",
      "mr",
      "mr-IN",
      "ms",
      "ms-MY",
      "ms-SG",
      "mt",
      "multi",
      "my",
      "ne",
      "nl",
      "nl-BE",
      "nl-NL",
      "nn",
      "no",
      "no-NO",
      "oc",
      "pa",
      "pl",
      "pl-PL",
      "ps",
      "pt",
      "pt-BR",
      "pt-PT",
      "ro",
      "ro-MD",
      "ru",
      "ru-Latn",
      "ru-RU",
      "sa",
      "sd",
      "si",
      "sk",
      "sl",
      "sl-SL",
      "sn",
      "so",
      "sq",
      "sr",
      "sr-RS",
      "su",
      "sv",
      "sv-SE",
      "sw",
      "ta",
      "ta-IN",
      "taq",
      "te",
      "te-IN",
      "tg",
      "th",
      "th-TH",
      "tk",
      "tl",
      "tr",
      "tr-TR",
      "tt",
      "uk",
      "ur",
      "uz",
      "vi",
      "yi",
      "yo",
      "zh",
      "zh-CN",
      "zh-Hans",
      "zh-Hant",
      "zh-HK",
      "zh-TW"
    ]
  },
  {
    name: "measurements",
    type: "boolean",
    required: true,
    description: "Spoken measurements will be converted to their corresponding abbreviations",
    default: false
  },
  {
    name: "model",
    type: "select",
    required: false,
    description: "AI model used to process submitted audio",
    options: [
      "nova-3",
      "nova-3-general",
      "nova-3-medical",
      "nova-2",
      "nova-2-general",
      "nova-2-meeting",
      "nova-2-finance",
      "nova-2-conversationalai",
      "nova-2-voicemail",
      "nova-2-video",
      "nova-2-medical",
      "nova-2-drivethru",
      "nova-2-automotive",
      "nova",
      "nova-general",
      "nova-phonecall",
      "nova-medical",
      "enhanced",
      "enhanced-general",
      "enhanced-meeting",
      "enhanced-phonecall",
      "enhanced-finance",
      "base",
      "meeting",
      "phonecall",
      "finance",
      "conversationalai",
      "voicemail",
      "video"
    ]
  },
  {
    name: "multichannel",
    type: "boolean",
    required: true,
    description: "Transcribe each audio channel independently",
    default: false
  },
  {
    name: "numerals",
    type: "boolean",
    required: true,
    description: "Numerals converts numbers from written format to numerical format",
    default: false
  },
  {
    name: "paragraphs",
    type: "boolean",
    required: true,
    description: "Splits audio into paragraphs to improve transcript readability",
    default: false
  },
  {
    name: "profanity_filter",
    type: "boolean",
    required: true,
    description:
      "Profanity Filter looks for recognized profanity and converts it to the nearest recognized non-profane word or removes it from the transcript completely",
    default: false
  },
  {
    name: "punctuate",
    type: "boolean",
    required: true,
    description: "Add punctuation and capitalization to the transcript",
    default: false
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
    required: true,
    description:
      "Apply formatting to transcript output. When set to true, additional formatting will be applied to transcripts to improve readability",
    default: false
  },
  {
    name: "utterances",
    type: "boolean",
    required: true,
    description: "Segments speech into meaningful semantic units",
    default: false
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
    type: "select",
    required: false,
    description: "Version of an AI model to use",
    options: ["latest"]
  },
  {
    name: "mip_opt_out",
    type: "boolean",
    required: true,
    description:
      "Opts out requests from the Deepgram Model Improvement Program. Refer to our Docs for pricing impacts before setting this to true. https://dpgr.am/deepgram-mip",
    default: false
  }
] as const
/** Field names for DeepgramTranscription */
export type DeepgramTranscriptionFieldName = (typeof DEEPGRAM_TRANSCRIPTION_FIELDS)[number]["name"]

/** Deepgram streaming field metadata (45 fields) */
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
    description:
      "Arbitrary key-value pairs that are attached to the API response for usage in downstream processing"
  },
  {
    name: "sentiment",
    type: "boolean",
    required: true,
    description: "Recognizes the sentiment throughout a transcript or text",
    default: false
  },
  {
    name: "summarize",
    type: "select",
    required: false,
    description:
      "Summarize content. For Listen API, supports string version option. For Read API, accepts boolean only.",
    options: ["v2"]
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
    required: true,
    description: "Detect topics throughout a transcript or text",
    default: false
  },
  {
    name: "custom_topic",
    type: "string",
    required: false,
    description:
      "Custom topics you want the model to detect within your input audio or text if present Submit up to `100`."
  },
  {
    name: "custom_topic_mode",
    type: "select",
    required: true,
    description:
      "Sets how the model will interpret strings submitted to the `custom_topic` param. When `strict`, the model will only return topics submitted using the `custom_topic` param. When `extended`, the model will return its own detected topics in addition to those submitted using the `custom_topic` param",
    default: "extended",
    options: ["extended", "strict"]
  },
  {
    name: "intents",
    type: "boolean",
    required: true,
    description: "Recognizes speaker intent throughout a transcript or text",
    default: false
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
    description:
      "Sets how the model will interpret intents submitted to the `custom_intent` param. When `strict`, the model will only return intents submitted using the `custom_intent` param. When `extended`, the model will return its own detected intents in the `custom_intent` param.",
    default: "extended",
    options: ["extended", "strict"]
  },
  {
    name: "detect_entities",
    type: "boolean",
    required: true,
    description: "Identifies and extracts key entities from content in submitted audio",
    default: false
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
    required: true,
    description:
      "Deprecated: use `diarize_model` instead. Recognize speaker changes. Each word in the transcript will be assigned a speaker number starting at 0.",
    default: false
  },
  {
    name: "diarize_model",
    type: "select",
    required: false,
    description:
      "Select and enable a specific diarization model version. Specifying this parameter enables diarization and selects the model — you do not need to also set the deprecated `diarize=true` parameter. For batch, supported values are `latest` (currently v2), `v1`, and `v2`. For streaming, supported values are `latest` (currently v1) and `v1`; `v2` returns a validation error on streaming requests.",
    options: ["latest", "v1", "v2"]
  },
  {
    name: "dictation",
    type: "boolean",
    required: true,
    description: "Dictation mode for controlling formatting with dictated speech",
    default: false
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
    required: true,
    description: 'Filler Words can help transcribe interruptions in your audio, like "uh" and "um"',
    default: false
  },
  {
    name: "keyterm",
    type: "array",
    required: false,
    description:
      "Key term prompting can boost or suppress specialized terminology and brands. Only compatible with Nova-3",
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
    type: "select",
    required: true,
    description:
      "The [BCP-47 language tag](https://tools.ietf.org/html/bcp47) that hints at the primary spoken language. Depending on the Model and API endpoint you choose only certain languages are available",
    default: "en",
    options: [
      "af",
      "am",
      "ar",
      "ar-AE",
      "ar-DZ",
      "ar-EG",
      "ar-IQ",
      "ar-IR",
      "ar-JO",
      "ar-KW",
      "ar-LB",
      "ar-MA",
      "ar-PS",
      "ar-QA",
      "ar-SA",
      "ar-SD",
      "ar-SY",
      "ar-TD",
      "ar-TN",
      "as",
      "az",
      "ba",
      "be",
      "be-BY",
      "bg",
      "bn",
      "bn-IN",
      "bo",
      "br",
      "bs",
      "bs-BA",
      "ca",
      "cs",
      "cy",
      "da",
      "da-DK",
      "de",
      "de-AT",
      "de-CH",
      "de-DE",
      "el",
      "en",
      "en-AU",
      "en-CA",
      "en-GB",
      "en-IE",
      "en-IN",
      "en-MY",
      "en-NZ",
      "en-PH",
      "en-US",
      "en-ZA",
      "es",
      "es-419",
      "es-AR",
      "es-ES",
      "es-LATAM",
      "es-MX",
      "es-US",
      "et",
      "eu",
      "fa",
      "fi",
      "fo",
      "fr",
      "fr-BE",
      "fr-ca",
      "fr-CA",
      "fr-CH",
      "fr-FR",
      "gl",
      "gu",
      "gu-IN",
      "ha",
      "haw",
      "he",
      "hi",
      "hi-Latn",
      "hr",
      "hr-HR",
      "ht",
      "hu",
      "hy",
      "id",
      "id-ID",
      "is",
      "it",
      "it-IT",
      "ja",
      "ja-JP",
      "jw",
      "ka",
      "kk",
      "km",
      "kn",
      "kn-IN",
      "ko",
      "ko-KR",
      "la",
      "lb",
      "ln",
      "lo",
      "lt",
      "lv",
      "mg",
      "mi",
      "mk",
      "mk-MK",
      "ml",
      "mn",
      "mr",
      "mr-IN",
      "ms",
      "ms-MY",
      "ms-SG",
      "mt",
      "multi",
      "my",
      "ne",
      "nl",
      "nl-BE",
      "nl-NL",
      "nn",
      "no",
      "no-NO",
      "oc",
      "pa",
      "pl",
      "pl-PL",
      "ps",
      "pt",
      "pt-BR",
      "pt-PT",
      "ro",
      "ro-MD",
      "ru",
      "ru-Latn",
      "ru-RU",
      "sa",
      "sd",
      "si",
      "sk",
      "sl",
      "sl-SL",
      "sn",
      "so",
      "sq",
      "sr",
      "sr-RS",
      "su",
      "sv",
      "sv-SE",
      "sw",
      "ta",
      "ta-IN",
      "taq",
      "te",
      "te-IN",
      "tg",
      "th",
      "th-TH",
      "tk",
      "tl",
      "tr",
      "tr-TR",
      "tt",
      "uk",
      "ur",
      "uz",
      "vi",
      "yi",
      "yo",
      "zh",
      "zh-CN",
      "zh-Hans",
      "zh-Hant",
      "zh-HK",
      "zh-TW"
    ]
  },
  {
    name: "measurements",
    type: "boolean",
    required: true,
    description: "Spoken measurements will be converted to their corresponding abbreviations",
    default: false
  },
  {
    name: "model",
    type: "select",
    required: false,
    description: "AI model used to process submitted audio",
    options: [
      "nova-3",
      "nova-3-general",
      "nova-3-medical",
      "nova-2",
      "nova-2-general",
      "nova-2-meeting",
      "nova-2-finance",
      "nova-2-conversationalai",
      "nova-2-voicemail",
      "nova-2-video",
      "nova-2-medical",
      "nova-2-drivethru",
      "nova-2-automotive",
      "nova",
      "nova-general",
      "nova-phonecall",
      "nova-medical",
      "enhanced",
      "enhanced-general",
      "enhanced-meeting",
      "enhanced-phonecall",
      "enhanced-finance",
      "base",
      "meeting",
      "phonecall",
      "finance",
      "conversationalai",
      "voicemail",
      "video"
    ]
  },
  {
    name: "multichannel",
    type: "boolean",
    required: true,
    description: "Transcribe each audio channel independently",
    default: false
  },
  {
    name: "numerals",
    type: "boolean",
    required: true,
    description: "Numerals converts numbers from written format to numerical format",
    default: false
  },
  {
    name: "paragraphs",
    type: "boolean",
    required: true,
    description: "Splits audio into paragraphs to improve transcript readability",
    default: false
  },
  {
    name: "profanity_filter",
    type: "boolean",
    required: true,
    description:
      "Profanity Filter looks for recognized profanity and converts it to the nearest recognized non-profane word or removes it from the transcript completely",
    default: false
  },
  {
    name: "punctuate",
    type: "boolean",
    required: true,
    description: "Add punctuation and capitalization to the transcript",
    default: false
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
    required: true,
    description:
      "Apply formatting to transcript output. When set to true, additional formatting will be applied to transcripts to improve readability",
    default: false
  },
  {
    name: "utterances",
    type: "boolean",
    required: true,
    description: "Segments speech into meaningful semantic units",
    default: false
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
    type: "select",
    required: false,
    description: "Version of an AI model to use",
    options: ["latest"]
  },
  {
    name: "mip_opt_out",
    type: "boolean",
    required: true,
    description:
      "Opts out requests from the Deepgram Model Improvement Program. Refer to our Docs for pricing impacts before setting this to true. https://dpgr.am/deepgram-mip",
    default: false
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
    description:
      "smart format#using no delay - see https://developers.deepgram.com/docs/smart-format#using-no-delay"
  },
  {
    name: "utterance_end_ms",
    type: "number",
    required: false,
    description:
      "understanding end of speech detection - see https://developers.deepgram.com/docs/understanding-end-of-speech-detection"
  },
  {
    name: "vad_events",
    type: "boolean",
    required: false,
    description:
      "start of speech detection - see https://developers.deepgram.com/docs/start-of-speech-detection"
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
    description:
      "Start date of the requested date range. Formats accepted are YYYY-MM-DD, YYYY-MM-DDTHH:MM:SS, or YYYY-MM-DDTHH:MM:SS+HH:MM"
  },
  {
    name: "end",
    type: "string",
    required: false,
    description:
      "End date of the requested date range. Formats accepted are YYYY-MM-DD, YYYY-MM-DDTHH:MM:SS, or YYYY-MM-DDTHH:MM:SS+HH:MM"
  },
  {
    name: "limit",
    type: "number",
    required: true,
    description: "Number of results to return per page. Default 10. Range [1,1000]",
    default: 10
  },
  {
    name: "page",
    type: "number",
    required: false,
    description:
      "Navigate and return the results to retrieve specific portions of information of the response"
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
    description:
      "Filter for requests that succeeded (status code < 300) or failed (status code >=400)",
    options: ["succeeded", "failed"]
  }
] as const
/** Field names for DeepgramListFilter */
export type DeepgramListFilterFieldName = (typeof DEEPGRAM_LIST_FILTER_FIELDS)[number]["name"]

// ─────────────────────────────────────────────────────────────────────────────
// AssemblyAI
// ─────────────────────────────────────────────────────────────────────────────

/** AssemblyAI transcription field metadata (49 fields) */
export const ASSEMBLYAI_TRANSCRIPTION_FIELDS = [
  {
    name: "audio_url",
    type: "string",
    required: true,
    description: "The URL of the audio or video file to transcribe."
  },
  {
    name: "audio_end_at",
    type: "number",
    required: false,
    description:
      "The point in time, in milliseconds, to stop transcribing in your media file. See [Set the start and end of the transcript](https://www.assemblyai.com/docs/pre-recorded-audio/set-the-start-and-end-of-the-transcript) for more details."
  },
  {
    name: "audio_start_from",
    type: "number",
    required: false,
    description:
      "The point in time, in milliseconds, to begin transcribing in your media file. See [Set the start and end of the transcript](https://www.assemblyai.com/docs/pre-recorded-audio/set-the-start-and-end-of-the-transcript) for more details."
  },
  {
    name: "auto_chapters",
    type: "boolean",
    required: true,
    description:
      "Enable [Auto Chapters](https://www.assemblyai.com/docs/speech-understanding/auto-chapters), can be true or false. Requires `punctuate` to be `true`, and cannot be enabled together with `summarization`. Deprecated - use [LLM Gateway](https://www.assemblyai.com/docs/llm-gateway/quickstart) instead for more flexible chapter summaries. See the [updated Auto Chapters page](https://www.assemblyai.com/docs/speech-understanding/auto-chapters) for details.\n\nNote: This parameter is only supported for the Universal-2 model.\n",
    default: false
  },
  {
    name: "auto_highlights",
    type: "boolean",
    required: true,
    description:
      "Enable [Key Phrases](https://www.assemblyai.com/docs/speech-understanding/key-phrases), either true or false",
    default: false
  },
  {
    name: "content_safety",
    type: "boolean",
    required: true,
    description:
      "Enable [Content Moderation](https://www.assemblyai.com/docs/content-moderation), can be true or false",
    default: false
  },
  {
    name: "content_safety_confidence",
    type: "number",
    required: true,
    description:
      "The confidence threshold for the [Content Moderation](https://www.assemblyai.com/docs/content-moderation) model. Values must be between 25 and 100. Requires `content_safety` to be enabled; otherwise it's ignored.",
    default: 50,
    min: 25,
    max: 100
  },
  {
    name: "custom_spelling",
    type: "array",
    required: false,
    description:
      "Customize how words are spelled and formatted using to and from values. Each `to` value must be a single word, and each `from` phrase can contain at most 5 words. See [Custom Spelling](https://www.assemblyai.com/docs/pre-recorded-audio/correct-spelling-of-terms) for more details.",
    inputFormat: "comma-separated"
  },
  {
    name: "disfluencies",
    type: "boolean",
    required: true,
    description:
      'Transcribe [Filler Words](https://www.assemblyai.com/docs/pre-recorded-audio/include-filler-words), like "umm", in your media file; can be true or false. Supported on Universal-3.5 Pro and Universal-2.',
    default: false
  },
  {
    name: "domain",
    type: "string",
    required: false,
    description:
      'Enable domain-specific transcription models to improve accuracy for specialized terminology. Set to `"medical-v1"` to enable [Medical Mode](https://www.assemblyai.com/docs/pre-recorded-audio/medical-mode) for improved accuracy of medical terms such as medications, procedures, conditions, and dosages.\n\nSupported languages: English (`en`), Spanish (`es`), German (`de`), French (`fr`). If `medical-v1` is used with an unsupported language, the parameter is ignored and a warning is returned.\n',
    default: null
  },
  {
    name: "entity_detection",
    type: "boolean",
    required: true,
    description:
      "Enable [Entity Detection](https://www.assemblyai.com/docs/speech-understanding/entity-detection), can be true or false",
    default: false
  },
  {
    name: "filter_profanity",
    type: "boolean",
    required: true,
    description:
      "Filter profanity from the transcribed text, can be true or false. See [Profanity Filtering](https://www.assemblyai.com/docs/profanity-filtering) for more details.",
    default: false
  },
  {
    name: "format_text",
    type: "boolean",
    required: true,
    description:
      "Enable [Text Formatting](https://www.assemblyai.com/docs/pre-recorded-audio), can be true or false",
    default: true
  },
  {
    name: "iab_categories",
    type: "boolean",
    required: true,
    description:
      "Enable [Topic Detection](https://www.assemblyai.com/docs/speech-understanding/topic-detection), can be true or false",
    default: false
  },
  {
    name: "keyterms_prompt",
    type: "array",
    required: false,
    description:
      "Improve accuracy with up to 200 (for Universal-2) or 1000 (for Universal-3.5 Pro) domain-specific words or phrases (maximum 6 words per phrase). See [Keyterms Prompting](https://www.assemblyai.com/docs/pre-recorded-audio/universal-3-5-pro/prompting#keyterms-prompting) for more details.\n",
    inputFormat: "comma-separated"
  },
  {
    name: "language_code",
    type: "select",
    required: true,
    description:
      "The language of your audio file. Possible values are found in [Supported Languages](https://www.assemblyai.com/docs/pre-recorded-audio/supported-languages).\nThe default value is 'en_us'.\n",
    default: "en_us",
    options: [
      "en",
      "en_au",
      "en_uk",
      "en_us",
      "es",
      "fr",
      "de",
      "it",
      "pt",
      "nl",
      "af",
      "sq",
      "am",
      "ar",
      "hy",
      "as",
      "az",
      "ba",
      "eu",
      "be",
      "bn",
      "bs",
      "br",
      "bg",
      "my",
      "ca",
      "zh",
      "hr",
      "cs",
      "da",
      "et",
      "fo",
      "fi",
      "gl",
      "ka",
      "el",
      "gu",
      "ht",
      "ha",
      "haw",
      "he",
      "hi",
      "hu",
      "is",
      "id",
      "ja",
      "jw",
      "kn",
      "kk",
      "km",
      "ko",
      "lo",
      "la",
      "lv",
      "ln",
      "lt",
      "lb",
      "mk",
      "mg",
      "ms",
      "ml",
      "mt",
      "mi",
      "mr",
      "mn",
      "ne",
      "no",
      "nn",
      "oc",
      "pa",
      "ps",
      "fa",
      "pl",
      "ro",
      "ru",
      "sa",
      "sr",
      "sn",
      "sd",
      "si",
      "sk",
      "sl",
      "so",
      "su",
      "sw",
      "sv",
      "tl",
      "tg",
      "ta",
      "tt",
      "te",
      "th",
      "bo",
      "tr",
      "tk",
      "uk",
      "ur",
      "uz",
      "vi",
      "cy",
      "yi",
      "yo"
    ]
  },
  {
    name: "language_codes",
    type: "multiselect",
    required: false,
    description:
      "The language codes of your audio file. Used for [Code switching](/speech-to-text/pre-recorded-audio/code-switching)\nOne of the values specified must be `en`.\n",
    options: [
      "en",
      "en_au",
      "en_uk",
      "en_us",
      "es",
      "fr",
      "de",
      "it",
      "pt",
      "nl",
      "af",
      "sq",
      "am",
      "ar",
      "hy",
      "as",
      "az",
      "ba",
      "eu",
      "be",
      "bn",
      "bs",
      "br",
      "bg",
      "my",
      "ca",
      "zh",
      "hr",
      "cs",
      "da",
      "et",
      "fo",
      "fi",
      "gl",
      "ka",
      "el",
      "gu",
      "ht",
      "ha",
      "haw",
      "he",
      "hi",
      "hu",
      "is",
      "id",
      "ja",
      "jw",
      "kn",
      "kk",
      "km",
      "ko",
      "lo",
      "la",
      "lv",
      "ln",
      "lt",
      "lb",
      "mk",
      "mg",
      "ms",
      "ml",
      "mt",
      "mi",
      "mr",
      "mn",
      "ne",
      "no",
      "nn",
      "oc",
      "pa",
      "ps",
      "fa",
      "pl",
      "ro",
      "ru",
      "sa",
      "sr",
      "sn",
      "sd",
      "si",
      "sk",
      "sl",
      "so",
      "su",
      "sw",
      "sv",
      "tl",
      "tg",
      "ta",
      "tt",
      "te",
      "th",
      "bo",
      "tr",
      "tk",
      "uk",
      "ur",
      "uz",
      "vi",
      "cy",
      "yi",
      "yo"
    ],
    inputFormat: "comma-separated"
  },
  {
    name: "language_confidence_threshold",
    type: "number",
    required: true,
    description:
      "The confidence threshold for the automatically detected language.\nAn error will be returned if the language confidence is below this threshold.\nDefaults to 0. See [Automatic Language Detection](https://www.assemblyai.com/docs/pre-recorded-audio/language-detection) for more details.\n",
    default: 0,
    min: 0,
    max: 1
  },
  {
    name: "language_detection",
    type: "boolean",
    required: true,
    description:
      "Enable [Automatic language detection](https://www.assemblyai.com/docs/pre-recorded-audio/language-detection), either true or false.",
    default: false
  },
  {
    name: "language_detection_options",
    type: "object",
    required: false,
    description:
      "Specify options for [Automatic Language Detection](https://www.assemblyai.com/docs/pre-recorded-audio/language-detection).",
    nestedFields: [
      {
        name: "expected_languages",
        type: "array",
        required: false,
        description:
          'List of languages expected in the audio file. Defaults to `["all"]` when unspecified. See [Automatic Language Detection](https://www.assemblyai.com/docs/pre-recorded-audio/language-detection) for more details.',
        inputFormat: "comma-separated"
      },
      {
        name: "fallback_language",
        type: "string",
        required: true,
        description:
          'If the detected language of the audio file is not in the list of expected languages, the `fallback_language` is used. Specify `["auto"]` to let our model choose the fallback language from `expected_languages` with the highest confidence score. See [Automatic Language Detection](https://www.assemblyai.com/docs/pre-recorded-audio/language-detection) for more details.\n',
        default: "auto"
      },
      {
        name: "code_switching",
        type: "boolean",
        required: true,
        description:
          "Whether [code switching](/speech-to-text/pre-recorded-audio/code-switching) should be detected.\n",
        default: false
      },
      {
        name: "code_switching_confidence_threshold",
        type: "number",
        required: true,
        description:
          "The confidence threshold for [code switching](/speech-to-text/pre-recorded-audio/code-switching) detection. If the code switching confidence is below this threshold, the transcript will be processed in the language with the highest `language_detection_confidence` score.\n",
        default: 0.3,
        min: 0,
        max: 1
      }
    ]
  },
  {
    name: "multichannel",
    type: "boolean",
    required: true,
    description:
      "Enable [Multichannel](https://www.assemblyai.com/docs/pre-recorded-audio/transcribe-multiple-audio-channels) transcription, can be true or false.",
    default: false
  },
  {
    name: "prompt",
    type: "string",
    required: false,
    description:
      "Provide natural language prompting of up to 1,500 words of contextual information to the model. See the [Prompting Guide](https://www.assemblyai.com/docs/pre-recorded-audio/prompting) for best practices.\n\nNote: This parameter is only supported for the Universal-3.5 Pro model.\n"
  },
  {
    name: "punctuate",
    type: "boolean",
    required: true,
    description:
      "Enable [Automatic Punctuation](https://www.assemblyai.com/docs/pre-recorded-audio), can be true or false",
    default: true
  },
  {
    name: "redact_pii",
    type: "boolean",
    required: true,
    description:
      "Redact PII from the transcribed text using the Redact PII model, can be true or false. Requires `format_text` to be `true`. See [PII Redaction](https://www.assemblyai.com/docs/pii-redaction) for more details.",
    default: false
  },
  {
    name: "redact_pii_audio",
    type: "boolean",
    required: true,
    description:
      'Generate a copy of the original media file with spoken PII "beeped" out, can be true or false. Requires `redact_pii` to be `true`. See [PII redaction](https://www.assemblyai.com/docs/pii-redaction#request-for-redacted-audio) for more details.',
    default: false
  },
  {
    name: "redact_pii_audio_options",
    type: "object",
    required: false,
    description:
      "Specify options for [PII redacted audio](https://www.assemblyai.com/docs/pii-redaction#request-for-redacted-audio) files.",
    nestedFields: [
      {
        name: "return_redacted_no_speech_audio",
        type: "boolean",
        required: true,
        description:
          "By default, audio redaction provides redacted audio URLs only when speech is detected. However, if your use-case specifically requires redacted audio files even for silent audio files without any dialogue, you can opt to receive these URLs by setting this parameter to `true`. Requires `redact_pii_audio` to be `true`.",
        default: false
      },
      {
        name: "override_audio_redaction_method",
        type: "select",
        required: false,
        description:
          "Specify the method used to redact audio. By default, redacted audio uses a beep sound. Set to `silence` to replace PII with silence instead of a beep.",
        options: ["silence"]
      }
    ]
  },
  {
    name: "redact_pii_audio_quality",
    type: "select",
    required: true,
    description:
      "Controls the filetype of the audio created by redact_pii_audio. Currently supports mp3 (default) and wav. See [PII redaction](https://www.assemblyai.com/docs/pii-redaction#request-for-redacted-audio) for more details.",
    default: "mp3",
    options: ["mp3", "wav"]
  },
  {
    name: "redact_pii_policies",
    type: "multiselect",
    required: false,
    description:
      "The list of PII Redaction policies to enable. See [PII redaction](https://www.assemblyai.com/docs/pii-redaction) for more details.",
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
      "gender",
      "gender_sexuality",
      "healthcare_number",
      "injury",
      "ip_address",
      "language",
      "location",
      "location_address",
      "location_address_street",
      "location_city",
      "location_coordinate",
      "location_country",
      "location_state",
      "location_zip",
      "marital_status",
      "medical_condition",
      "medical_process",
      "money_amount",
      "nationality",
      "number_sequence",
      "occupation",
      "organization",
      "organization_medical_facility",
      "passport_number",
      "password",
      "person_age",
      "person_name",
      "phone_number",
      "physical_attribute",
      "political_affiliation",
      "religion",
      "sexuality",
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
    type: "select",
    required: true,
    description:
      "The replacement logic for detected PII, can be `entity_name` or `hash`. See [PII redaction](https://www.assemblyai.com/docs/pii-redaction) for more details.",
    default: "hash",
    options: ["entity_name", "hash"]
  },
  {
    name: "redact_pii_return_unredacted",
    type: "boolean",
    required: true,
    description:
      "When set to `true`, returns the original unredacted transcript alongside the redacted one in the same response. Requires `redact_pii` to be `true`, otherwise a 400 error is returned.\n\nWhen enabled, the response includes the additional fields `unredacted_text`, `unredacted_words`, and `unredacted_utterances`. The existing `text`, `words`, and `utterances` fields remain fully redacted. When disabled (default), the response is unchanged and contains only the redacted transcript. See [PII redaction](https://www.assemblyai.com/docs/pii-redaction) for more details.\n",
    default: false
  },
  {
    name: "redact_static_entities",
    type: "object",
    required: false,
    description:
      'A map of user-defined terms to redact, where each key is a redaction label and each value is a list of exact terms to match (e.g. `{ "INTERNAL_TOOL": ["Bearclaw", "Cubclaw"] }`). Each matching term in the transcript is redacted using the `redact_pii_sub` substitution, on top of standard PII Redaction. Useful for redacting specific, predefined terms (proprietary names, internal codenames) that aren\'t general PII categories.\n\nThis is a literal find-and-replace (tolerant of casing, surrounding punctuation, and minor spacing/hyphenation), not a model — it does not generalize beyond the terms you provide. Requires `redact_pii` to be `true`, otherwise a 400 error is returned. When `redact_pii_audio` is enabled, matched terms are also redacted in the audio output. You can provide up to 100 labels, each with up to 200 terms of at most 200 characters; a label may contain only letters, numbers, spaces, underscores, and hyphens (max 80 characters). See [Static Entity Redaction](https://www.assemblyai.com/docs/guardrails/redact-pii-from-transcripts#static-entity-redaction) for more details.\n',
    inputFormat: "json"
  },
  {
    name: "sentiment_analysis",
    type: "boolean",
    required: true,
    description:
      "Enable [Sentiment Analysis](https://www.assemblyai.com/docs/speech-understanding/sentiment-analysis), can be true or false. Requires `punctuate` to be `true`.",
    default: false
  },
  {
    name: "speaker_labels",
    type: "boolean",
    required: true,
    description:
      "Enable [Speaker diarization](https://www.assemblyai.com/docs/pre-recorded-audio/label-speakers), can be true or false. Requires `punctuate` to be `true`.",
    default: false
  },
  {
    name: "speaker_options",
    type: "object",
    required: false,
    description:
      "Specify options for [Speaker diarization](https://www.assemblyai.com/docs/pre-recorded-audio/label-speakers#set-a-range-of-possible-speakers). Use this to set a range of possible speakers. Requires `speaker_labels` to be `true`, and cannot be used together with `speakers_expected`. When both bounds are set, `min_speakers_expected` must be less than or equal to `max_speakers_expected`.",
    nestedFields: [
      {
        name: "min_speakers_expected",
        type: "number",
        required: false,
        description:
          "A hard lower limit on the number of speaker labels — the model won't return fewer speakers than this. See [Set a range of possible speakers](https://www.assemblyai.com/docs/pre-recorded-audio/label-speakers#set-a-range-of-possible-speakers) for more details."
      },
      {
        name: "max_speakers_expected",
        type: "number",
        required: false,
        description:
          "<Warning>Setting this parameter too high may hurt model accuracy</Warning>\nA hard upper limit on the number of speaker labels. If more people speak than this value, the additional speakers are merged into existing labels. Setting it higher than the true number of speakers can cause the model to over-split and return more speakers than are actually present. The default depends on audio duration: no limit for 0-2 minutes, 10 for 2-10 minutes, and 30 for 10+ minutes. See [Set a range of possible speakers](https://www.assemblyai.com/docs/pre-recorded-audio/label-speakers#set-a-range-of-possible-speakers) for more details.\n"
      }
    ]
  },
  {
    name: "speakers_expected",
    type: "number",
    required: false,
    description:
      "Tells the speaker label model how many speakers it should attempt to identify. Requires `speaker_labels` to be `true` and must be a positive integer; cannot be used together with `speaker_options`. See [Set number of speakers expected](https://www.assemblyai.com/docs/pre-recorded-audio/label-speakers#set-number-of-speakers-expected) for more details.",
    default: null
  },
  {
    name: "speech_models",
    type: "multiselect",
    required: true,
    description:
      "Optional. List one or more speech models in priority order. Supported values: `universal-3-5-pro`, `universal-2`. If omitted, defaults to `universal-3-5-pro`. See [Model Selection](https://www.assemblyai.com/docs/pre-recorded-audio/select-the-speech-model) for available models and routing behavior.\n",
    default: ["universal-3-5-pro"],
    options: ["universal-3-5-pro", "universal-2"],
    inputFormat: "comma-separated"
  },
  {
    name: "speech_threshold",
    type: "number",
    required: false,
    description:
      "Reject audio files that contain less than this fraction of speech.\nValid values are in the range [0, 1] inclusive. See [Speech Threshold](https://www.assemblyai.com/docs/speech-threshold) for more details.\n",
    default: 0,
    min: 0,
    max: 1
  },
  {
    name: "speech_understanding",
    type: "object",
    required: false,
    description:
      "Enable speech understanding tasks like [Translation](https://www.assemblyai.com/docs/speech-understanding/translation), [Speaker Identification](https://www.assemblyai.com/docs/speech-understanding/speaker-identification), and [Custom Formatting](https://www.assemblyai.com/docs/speech-understanding/custom-formatting). See the task-specific docs for available options and configuration.\n",
    nestedFields: [
      {
        name: "request",
        type: "object",
        required: true,
        nestedFields: [
          {
            name: "translation",
            type: "object",
            required: true,
            nestedFields: [
              {
                name: "target_languages",
                type: "array",
                required: true,
                description:
                  'List of target language codes (e.g., `["es", "de"]`). See [Translation](https://www.assemblyai.com/docs/speech-understanding/translation) for supported languages.',
                inputFormat: "comma-separated"
              },
              {
                name: "formal",
                type: "boolean",
                required: true,
                description:
                  "Use formal language style. See [Translation](https://www.assemblyai.com/docs/speech-understanding/translation) for more details.",
                default: true
              },
              {
                name: "match_original_utterance",
                type: "boolean",
                required: true,
                description:
                  "When enabled with Speaker Labels, returns translated text in the utterances array. Each utterance will include a `translated_texts` key containing translations for each target language.",
                default: false
              }
            ]
          },
          {
            name: "speaker_identification",
            type: "object",
            required: true,
            nestedFields: [
              {
                name: "speaker_type",
                type: "select",
                required: true,
                description:
                  "Type of speaker identification. See [Speaker Identification](https://www.assemblyai.com/docs/speech-understanding/speaker-identification) for details on each type.",
                options: ["role", "name"]
              },
              {
                name: "known_values",
                type: "array",
                required: false,
                description:
                  'Required if speaker_type is "role". Each value must be 35 characters or less.',
                inputFormat: "comma-separated"
              },
              {
                name: "speakers",
                type: "array",
                required: false,
                description:
                  "An array of speaker objects with metadata to improve identification accuracy. Each object should include a `role` or `name` (depending on `speaker_type`) and an optional `description` to help the model identify the speaker. You can also include any additional custom properties (e.g., `company`, `title`) to provide more context. Use this as an alternative to `known_values` when you want to provide additional context about each speaker.",
                inputFormat: "comma-separated"
              }
            ]
          },
          {
            name: "custom_formatting",
            type: "object",
            required: true,
            nestedFields: [
              {
                name: "date",
                type: "string",
                required: false,
                description:
                  'Date format pattern (e.g., `"mm/dd/yyyy"`). See [Custom Formatting](https://www.assemblyai.com/docs/speech-understanding/custom-formatting) for more details.'
              },
              {
                name: "phone_number",
                type: "string",
                required: false,
                description:
                  'Phone number format pattern (e.g., `"(xxx)xxx-xxxx"`). See [Custom Formatting](https://www.assemblyai.com/docs/speech-understanding/custom-formatting) for more details.'
              },
              {
                name: "email",
                type: "string",
                required: false,
                description:
                  'Email format pattern (e.g., `"username@domain.com"`). See [Custom Formatting](https://www.assemblyai.com/docs/speech-understanding/custom-formatting) for more details.'
              }
            ]
          },
          {
            name: "summarization",
            type: "object",
            required: true,
            nestedFields: [
              {
                name: "summary_type",
                type: "select",
                required: false,
                description:
                  "Type of summary. Bullets returns short bullet point style summaries, paragraph is generally more verbose and detailed.",
                options: ["paragraph", "bullets"]
              },
              {
                name: "effort",
                type: "select",
                required: false,
                options: ["low", "medium"]
              }
            ]
          },
          {
            name: "action_items",
            type: "object",
            required: true,
            nestedFields: [
              {
                name: "include_decisions",
                type: "boolean",
                required: false,
                description: "Option to include decision making in action items."
              },
              {
                name: "effort",
                type: "select",
                required: false,
                options: ["low", "medium"]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "summarization",
    type: "boolean",
    required: true,
    description:
      "Enable [Summarization](https://www.assemblyai.com/docs/speech-understanding/summarization), can be true or false. Requires both `punctuate` and `format_text` to be `true`, and cannot be enabled together with `auto_chapters`. Deprecated - use [LLM Gateway](https://www.assemblyai.com/docs/llm-gateway/quickstart) instead for more flexible summaries. See the [updated Summarization page](https://www.assemblyai.com/docs/speech-understanding/summarization) for details.\n\nNote: This parameter is only supported for the Universal-2 model.\n",
    default: false
  },
  {
    name: "summary_model",
    type: "select",
    required: true,
    description:
      "The model to summarize the transcript. Must be set together with `summary_type`. Compatibility - `catchy` supports `gist` and `headline`; `informative` and `conversational` support `headline`, `paragraph`, `bullets`, and `bullets_verbose`. Deprecated - use [LLM Gateway](https://www.assemblyai.com/docs/llm-gateway/quickstart) instead for more flexible summaries. See the [updated Summarization page](https://www.assemblyai.com/docs/speech-understanding/summarization) for details.",
    default: "informative",
    options: ["informative", "conversational", "catchy"]
  },
  {
    name: "summary_type",
    type: "select",
    required: true,
    description:
      "The type of summary. Must be set together with `summary_model`; see `summary_model` for the supported model and type combinations. Deprecated - use [LLM Gateway](https://www.assemblyai.com/docs/llm-gateway/quickstart) instead for more flexible summaries. See the [updated Summarization page](https://www.assemblyai.com/docs/speech-understanding/summarization) for details.",
    default: "bullets",
    options: ["bullets", "bullets_verbose", "gist", "headline", "paragraph"]
  },
  {
    name: "remove_audio_tags",
    type: "select",
    required: true,
    description:
      'Universal-3.5 Pro generates rich transcripts that can include inline annotations such as audio event markers and speaker cues. Set to `"all"` to remove all inline annotations, or `"speaker"` to remove only speaker cues while keeping other annotations. By default, all inline annotations are removed.\n\nNote: This parameter is only supported for the Universal-3.5 Pro model.\n',
    default: "all",
    options: ["all", "speaker"]
  },
  {
    name: "temperature",
    type: "number",
    required: true,
    description:
      "Control the amount of randomness injected into the model's response. See the [Prompting Guide](https://www.assemblyai.com/docs/pre-recorded-audio/prompting) for more details.\n\nNote: This parameter only takes effect on the Universal-3.5 Pro model.\n",
    default: 0,
    min: 0,
    max: 1
  },
  {
    name: "webhook_auth_header_name",
    type: "string",
    required: false,
    description:
      "The header name to be sent with the transcript completed or failed [webhook](https://www.assemblyai.com/docs/deployment/webhooks-for-pre-recorded-audio) requests. Must be 1-1000 characters and contain only ASCII letters, numbers, hyphens, and underscores. Requires `webhook_auth_header_value` and `webhook_url` to also be set.",
    default: null
  },
  {
    name: "webhook_auth_header_value",
    type: "string",
    required: false,
    description:
      "The header value to send back with the transcript completed or failed [webhook](https://www.assemblyai.com/docs/deployment/webhooks-for-pre-recorded-audio) requests for added security. Must be 1-1000 characters and must not contain carriage returns or newlines. Requires `webhook_auth_header_name` and `webhook_url` to also be set.",
    default: null
  },
  {
    name: "webhook_url",
    type: "string",
    required: false,
    description:
      "The URL to which we send [webhook](https://www.assemblyai.com/docs/deployment/webhooks-for-pre-recorded-audio) requests.\n"
  },
  {
    name: "custom_topics",
    type: "boolean",
    required: true,
    description: "This parameter does not currently have any functionality attached to it.",
    default: false
  },
  {
    name: "speech_model",
    type: "select",
    required: false,
    description:
      "This parameter has been replaced with the `speech_models` parameter, learn more about the `speech_models` parameter [here](https://www.assemblyai.com/docs/pre-recorded-audio/select-the-speech-model).\n",
    options: ["universal-3-5-pro", "universal-2"]
  },
  {
    name: "topics",
    type: "array",
    required: false,
    description: "This parameter does not currently have any functionality attached to it.",
    inputFormat: "comma-separated"
  }
] as const
/** Field names for AssemblyAITranscription */
export type AssemblyAITranscriptionFieldName =
  (typeof ASSEMBLYAI_TRANSCRIPTION_FIELDS)[number]["name"]

/** AssemblyAI streaming field metadata (42 fields) */
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
    description:
      "Add up to 2500 characters of custom vocabulary. The parameter value must be a JSON encoded array of strings. The JSON must be URL encoded like other query string parameters."
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
    description:
      "Set to true to receive the SessionInformation message before the session ends. Defaults to false."
  },
  {
    name: "domain",
    type: "string",
    required: false,
    description:
      'Enable domain-specific transcription models to improve accuracy for specialized terminology. Set to `"medical-v1"` to enable [Medical Mode](https://www.assemblyai.com/docs/streaming/medical-mode) for improved accuracy of medical terms such as medications, procedures, conditions, and dosages. Supported languages: English (`en`), Spanish (`es`), German (`de`), French (`fr`). If used with an unsupported language, the parameter is ignored and a warning is returned.'
  },
  {
    name: "connectTimeout",
    type: "number",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "maxConnectionRetries",
    type: "number",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "connectionRetryDelay",
    type: "number",
    required: false,
    description: "From SDK v3"
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
    name: "minTurnSilence",
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
    name: "prompt",
    type: "string",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "agentContext",
    type: "string",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "speechModel",
    type: "select",
    required: false,
    description: "From SDK v3",
    options: ["universal-streaming-english", "universal-streaming-multilingual"]
  },
  {
    name: "languageCode",
    type: "string",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "languageCodes",
    type: "array",
    required: false,
    description: "From SDK v3",
    inputFormat: "comma-separated"
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
  },
  {
    name: "speakerLabels",
    type: "boolean",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "maxSpeakers",
    type: "number",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "voiceFocus",
    type: "string",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "voiceFocusThreshold",
    type: "number",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "continuousPartials",
    type: "boolean",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "interruptionDelay",
    type: "number",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "turnLeftPadMs",
    type: "number",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "customerSupportAudioCapture",
    type: "boolean",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "includePartialTurns",
    type: "boolean",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "redactPii",
    type: "boolean",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "redactPiiPolicies",
    type: "string",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "redactPiiSub",
    type: "string",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "mode",
    type: "string",
    required: true,
    description: "From SDK v3"
  },
  {
    name: "llmGateway",
    type: "string",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "webhookUrl",
    type: "string",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "webhookAuthHeaderName",
    type: "string",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "webhookAuthHeaderValue",
    type: "string",
    required: false,
    description: "From SDK v3"
  }
] as const
/** Field names for AssemblyAIStreaming */
export type AssemblyAIStreamingFieldName = (typeof ASSEMBLYAI_STREAMING_FIELDS)[number]["name"]

/** AssemblyAI streaming update field metadata (14 fields) */
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
    name: "min_turn_silence",
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
  },
  {
    name: "keyterms_prompt",
    type: "array",
    required: false,
    description: "From SDK v3",
    inputFormat: "comma-separated"
  },
  {
    name: "prompt",
    type: "string",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "agent_context",
    type: "string",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "filter_profanity",
    type: "boolean",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "interruption_delay",
    type: "number",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "turn_left_pad_ms",
    type: "number",
    required: false,
    description: "From SDK v3"
  },
  {
    name: "language_codes",
    type: "array",
    required: false,
    description: "From SDK v3",
    inputFormat: "comma-separated"
  }
] as const
/** Field names for AssemblyAIStreamingUpdate */
export type AssemblyAIStreamingUpdateFieldName =
  (typeof ASSEMBLYAI_STREAMING_UPDATE_FIELDS)[number]["name"]

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
    required: true,
    description: "Only get throttled transcripts, overrides the status filter",
    default: false
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
    description:
      "The audio file object (not file name) to transcribe, in one of these formats: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, or webm.\n"
  },
  {
    name: "model",
    type: "string",
    required: true,
    description:
      "ID of the model to use. The options are `gpt-4o-transcribe`, `gpt-4o-mini-transcribe`, `gpt-4o-mini-transcribe-2025-12-15`, `whisper-1` (which is powered by our open source Whisper V2 model), and `gpt-4o-transcribe-diarize`.\n"
  },
  {
    name: "language",
    type: "select",
    required: false,
    description:
      "The language of the input audio. Supplying the input language in [ISO-639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) (e.g. `en`) format will improve accuracy and latency.\n",
    options: [
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
    ]
  },
  {
    name: "prompt",
    type: "string",
    required: false,
    description:
      "An optional text to guide the model's style or continue a previous audio segment. The [prompt](/docs/guides/speech-to-text#prompting) should match the audio language. This field is not supported when using `gpt-4o-transcribe-diarize`.\n"
  },
  {
    name: "response_format",
    type: "select",
    required: true,
    description:
      "The format of the output, in one of these options: `json`, `text`, `srt`, `verbose_json`, `vtt`, or `diarized_json`. For `gpt-4o-transcribe` and `gpt-4o-mini-transcribe`, the only supported format is `json`. For `gpt-4o-transcribe-diarize`, the supported formats are `json`, `text`, and `diarized_json`, with `diarized_json` required to receive speaker annotations.\n",
    default: "json",
    options: ["json", "text", "srt", "verbose_json", "vtt", "diarized_json"]
  },
  {
    name: "temperature",
    type: "number",
    required: true,
    description:
      "The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use [log probability](https://en.wikipedia.org/wiki/Log_probability) to automatically increase the temperature until certain thresholds are hit.\n",
    default: 0
  },
  {
    name: "include",
    type: "multiselect",
    required: false,
    description:
      "Additional information to include in the transcription response.\n`logprobs` will return the log probabilities of the tokens in the\nresponse to understand the model's confidence in the transcription.\n`logprobs` only works with response_format set to `json` and only with\nthe models `gpt-4o-transcribe`, `gpt-4o-mini-transcribe`, and `gpt-4o-mini-transcribe-2025-12-15`. This field is not supported when using `gpt-4o-transcribe-diarize`.\n",
    options: ["logprobs"],
    inputFormat: "comma-separated"
  },
  {
    name: "timestamp_granularities",
    type: "multiselect",
    required: true,
    description:
      "The timestamp granularities to populate for this transcription. `response_format` must be set `verbose_json` to use timestamp granularities. Either or both of these options are supported: `word`, or `segment`. Note: There is no additional latency for segment timestamps, but generating word timestamps incurs additional latency.\nThis option is not available for `gpt-4o-transcribe-diarize`.\n",
    default: ["segment"],
    options: ["word", "segment"],
    inputFormat: "comma-separated"
  },
  {
    name: "stream",
    type: "boolean",
    required: false
  },
  {
    name: "chunking_strategy",
    type: "string",
    required: false,
    description:
      'Controls how the audio is cut into chunks. When set to `"auto"`, the server first normalizes loudness and then uses voice activity detection (VAD) to choose boundaries. `server_vad` object can be provided to tweak VAD detection parameters manually. If unset, the audio is transcribed as a single block. Required when using `gpt-4o-transcribe-diarize` for inputs longer than 30 seconds. '
  },
  {
    name: "known_speaker_names",
    type: "array",
    required: false,
    description:
      "Optional list of speaker names that correspond to the audio samples provided in `known_speaker_references[]`. Each entry should be a short identifier (for example `customer` or `agent`). Up to 4 speakers are supported.\n",
    inputFormat: "comma-separated"
  },
  {
    name: "known_speaker_references",
    type: "array",
    required: false,
    description:
      "Optional list of audio samples (as [data URLs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs)) that contain known speaker references matching `known_speaker_names[]`. Each sample must be between 2 and 10 seconds, and can use any of the same input audio formats supported by `file`.\n",
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
    required: false,
    nestedFields: [
      {
        name: "wordLevelTimestampsEnabled",
        type: "boolean",
        required: false,
        description:
          "A value indicating whether word level timestamps are requested. The default value is\r\n`false`."
      },
      {
        name: "displayFormWordLevelTimestampsEnabled",
        type: "boolean",
        required: false,
        description:
          "A value indicating whether word level timestamps for the display form are requested. The default value is `false`."
      },
      {
        name: "duration",
        type: "string",
        required: false,
        description:
          'The duration of the transcription. The duration is encoded as ISO 8601 duration\r\n("PnYnMnDTnHnMnS", see https://en.wikipedia.org/wiki/ISO_8601#Durations).'
      },
      {
        name: "channels",
        type: "array",
        required: false,
        description:
          "A collection of the requested channel numbers.\r\nIn the default case, the channels 0 and 1 are considered.",
        inputFormat: "comma-separated"
      },
      {
        name: "destinationContainerUrl",
        type: "string",
        required: false,
        description:
          'The requested destination container.\r\n### Remarks ###\r\nWhen a destination container is used in combination with a `timeToLive`, the metadata of a\r\ntranscription will be deleted normally, but the data stored in the destination container, including\r\ntranscription results, will remain untouched, because no delete permissions are required for this\r\ncontainer.<br />\r\nTo support automatic cleanup, either configure blob lifetimes on the container, or use "Bring your own Storage (BYOS)"\r\ninstead of `destinationContainerUrl`, where blobs can be cleaned up.'
      },
      {
        name: "punctuationMode",
        type: "select",
        required: false,
        description: "The mode used for punctuation.",
        options: ["None", "Dictated", "Automatic", "DictatedAndAutomatic"]
      },
      {
        name: "profanityFilterMode",
        type: "select",
        required: false,
        description: "Mode of profanity filtering.",
        options: ["None", "Removed", "Tags", "Masked"]
      },
      {
        name: "timeToLive",
        type: "string",
        required: false,
        description:
          'How long the transcription will be kept in the system after it has completed. Once the\r\ntranscription reaches the time to live after completion (successful or failed) it will be automatically\r\ndeleted. Not setting this value or setting it to 0 will disable automatic deletion. The longest supported\r\nduration is 31 days.\r\nThe duration is encoded as ISO 8601 duration ("PnYnMnDTnHnMnS", see https://en.wikipedia.org/wiki/ISO_8601#Durations).'
      },
      {
        name: "email",
        type: "string",
        required: false,
        description:
          "The email address to send email notifications to in case the operation completes.\r\nThe value will be removed after successfully sending the email."
      },
      {
        name: "error",
        type: "object",
        required: false,
        nestedFields: [
          {
            name: "code",
            type: "string",
            required: false,
            description: "The code of this error."
          },
          {
            name: "message",
            type: "string",
            required: false,
            description: "The message for this error."
          }
        ]
      },
      {
        name: "diarizationEnabled",
        type: "boolean",
        required: false,
        description:
          "A value indicating whether diarization (speaker identification) is requested. The default value\r\nis `false`.\r\nIf this field is set to true and the improved diarization system is configured by specifying\r\n`DiarizationProperties`, the improved diarization system will provide diarization for a configurable\r\nrange of speakers.\r\nIf this field is set to true and the improved diarization system is not enabled (not specifying\r\n`DiarizationProperties`), the basic diarization system will distinguish between up to two speakers.\r\nNo extra charges are applied for the basic diarization.\r\n            \r\nThe basic diarization system is deprecated and will be removed in the next major version of the API.\r\nThis `diarizationEnabled` setting will also be removed."
      },
      {
        name: "diarization",
        type: "object",
        required: false,
        nestedFields: [
          {
            name: "speakers",
            type: "object",
            required: true,
            nestedFields: [
              {
                name: "minCount",
                type: "number",
                required: false,
                description:
                  "A hint for the minimum number of speakers for diarization. Must be smaller than or equal to the maxSpeakers property.",
                min: 1
              },
              {
                name: "maxCount",
                type: "number",
                required: false,
                description:
                  "The maximum number of speakers for diarization. Must be less than 36 and larger than or equal to the minSpeakers property.",
                min: 1
              }
            ]
          }
        ]
      },
      {
        name: "languageIdentification",
        type: "object",
        required: false,
        nestedFields: [
          {
            name: "mode",
            type: "select",
            required: true,
            description: "The mode used for language identification.",
            default: "Continuous",
            options: ["Continuous", "Single"]
          },
          {
            name: "candidateLocales",
            type: "array",
            required: true,
            description:
              'The candidate locales for language identification (example ["en-US", "de-DE", "es-ES"]). A minimum of 2 and a maximum of 10 candidate locales, including the main locale for the transcription, is supported for continuous mode. For single language identification, the maximum number of candidate locales is unbounded.',
            inputFormat: "comma-separated"
          },
          {
            name: "speechModelMapping",
            type: "object",
            required: false,
            description:
              "An optional mapping of locales to speech model entities. If no model is given for a locale, the default base model is used.\r\nKeys must be locales contained in the candidate locales, values are entities for models of the respective locales.",
            inputFormat: "json"
          }
        ]
      }
    ]
  },
  {
    name: "model",
    type: "object",
    required: false,
    nestedFields: [
      {
        name: "self",
        type: "string",
        required: true,
        description: "The location of the referenced entity."
      }
    ]
  },
  {
    name: "dataset",
    type: "object",
    required: false,
    nestedFields: [
      {
        name: "self",
        type: "string",
        required: true,
        description: "The location of the referenced entity."
      }
    ]
  },
  {
    name: "contentUrls",
    type: "array",
    required: false,
    description:
      "A list of content urls to get audio files to transcribe. Up to 1000 urls are allowed.\r\nThis property will not be returned in a response.",
    inputFormat: "comma-separated"
  },
  {
    name: "contentContainerUrl",
    type: "string",
    required: false,
    description:
      "A URL for an Azure blob container that contains the audio files. A container is allowed to have a maximum size of 5GB and a maximum number of 10000 blobs.\r\nThe maximum size for a blob is 2.5GB.\r\nContainer SAS should contain 'r' (read) and 'l' (list) permissions.\r\nThis property will not be returned in a response."
  },
  {
    name: "locale",
    type: "select",
    required: true,
    description:
      "The locale of the contained data. If Language Identification is used, this locale is used to transcribe speech for which no language could be detected.",
    options: [
      "af-ZA",
      "am-ET",
      "ar-AE",
      "ar-BH",
      "ar-DZ",
      "ar-EG",
      "ar-IL",
      "ar-IQ",
      "ar-JO",
      "ar-KW",
      "ar-LB",
      "ar-LY",
      "ar-MA",
      "ar-OM",
      "ar-PS",
      "ar-QA",
      "ar-SA",
      "ar-SY",
      "ar-TN",
      "ar-YE",
      "as-IN",
      "az-AZ",
      "bg-BG",
      "bn-BD",
      "bn-IN",
      "bs-BA",
      "ca-ES",
      "cs-CZ",
      "cy-GB",
      "da-DK",
      "de-AT",
      "de-CH",
      "de-DE",
      "el-GR",
      "en-AU",
      "en-CA",
      "en-GB",
      "en-GH",
      "en-HK",
      "en-IE",
      "en-IN",
      "en-KE",
      "en-NG",
      "en-NZ",
      "en-PH",
      "en-SG",
      "en-TZ",
      "en-US",
      "en-ZA",
      "es-AR",
      "es-BO",
      "es-CL",
      "es-CO",
      "es-CR",
      "es-CU",
      "es-DO",
      "es-EC",
      "es-ES",
      "es-GQ",
      "es-GT",
      "es-HN",
      "es-MX",
      "es-NI",
      "es-PA",
      "es-PE",
      "es-PR",
      "es-PY",
      "es-SV",
      "es-US",
      "es-UY",
      "es-VE",
      "et-EE",
      "eu-ES",
      "fa-IR",
      "fi-FI",
      "fil-PH",
      "fr-BE",
      "fr-CA",
      "fr-CH",
      "fr-FR",
      "ga-IE",
      "gl-ES",
      "gu-IN",
      "he-IL",
      "hi-IN",
      "hr-HR",
      "hu-HU",
      "hy-AM",
      "id-ID",
      "is-IS",
      "it-CH",
      "it-IT",
      "ja-JP",
      "jv-ID",
      "ka-GE",
      "kk-KZ",
      "km-KH",
      "kn-IN",
      "ko-KR",
      "lo-LA",
      "lt-LT",
      "lv-LV",
      "mk-MK",
      "ml-IN",
      "mn-MN",
      "mr-IN",
      "ms-MY",
      "mt-MT",
      "my-MM",
      "nan-CN",
      "nb-NO",
      "ne-NP",
      "nl-BE",
      "nl-NL",
      "or-IN",
      "pa-IN",
      "pl-PL",
      "ps-AF",
      "pt-BR",
      "pt-PT",
      "ro-RO",
      "ru-RU",
      "si-LK",
      "sk-SK",
      "sl-SI",
      "so-SO",
      "sq-AL",
      "sr-ME",
      "sr-RS",
      "sr-XK",
      "su-ID",
      "sv-SE",
      "sw-KE",
      "sw-TZ",
      "ta-IN",
      "ta-LK",
      "ta-MY",
      "ta-SG",
      "te-IN",
      "th-TH",
      "tr-TR",
      "uk-UA",
      "ur-IN",
      "ur-PK",
      "uz-UZ",
      "vi-VN",
      "wuu-CN",
      "yue-CN",
      "zh-CN",
      "zh-HK",
      "zh-SG",
      "zh-TW",
      "zu-ZA"
    ]
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
    type: "object",
    required: false,
    description:
      "The custom properties of this entity. The maximum allowed key length is 64 characters, the maximum\r\nallowed value length is 256 characters and the count of allowed entries is 10.",
    inputFormat: "json"
  },
  {
    name: "project",
    type: "object",
    required: false,
    nestedFields: [
      {
        name: "self",
        type: "string",
        required: true,
        description: "The location of the referenced entity."
      }
    ]
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
    description:
      "A filtering expression for selecting a subset of the available transcriptions.\r\n            - Supported properties: displayName, description, createdDateTime, lastActionDateTime, status, locale.\r\n            - Operators:\r\n              - eq, ne are supported for all properties.\r\n              - gt, ge, lt, le are supported for createdDateTime and lastActionDateTime.\r\n              - and, or, not are supported.\r\n            - Example:\r\n              filter=createdDateTime gt 2022-02-01T11:00:00Z"
  }
] as const
/** Field names for AzureListFilter */
export type AzureListFilterFieldName = (typeof AZURE_LIST_FILTER_FIELDS)[number]["name"]

// ─────────────────────────────────────────────────────────────────────────────
// ElevenLabs
// ─────────────────────────────────────────────────────────────────────────────

/** ElevenLabs transcription field metadata (26 fields) */
export const ELEVENLABS_TRANSCRIPTION_FIELDS = [
  {
    name: "model_id",
    type: "select",
    required: true,
    description: "The ID of the model to use for transcription.",
    options: ["scribe_v1", "scribe_v2"]
  },
  {
    name: "file",
    type: "string",
    required: false,
    description:
      "The file to transcribe (100ms minimum audio length). All major audio and video formats are supported. Exactly one of the file or cloud_storage_url parameters must be provided. The file size must be less than 5.0GB."
  },
  {
    name: "language_code",
    type: "select",
    required: false,
    description:
      "An ISO-639-1 or ISO-639-3 language_code corresponding to the language of the audio file. Can sometimes improve transcription performance if known beforehand. Defaults to null, in this case the language is predicted automatically.",
    options: [
      "en",
      "zh",
      "de",
      "es",
      "ru",
      "ko",
      "fr",
      "ja",
      "pt",
      "tr",
      "pl",
      "ca",
      "nl",
      "ar",
      "sv",
      "it",
      "id",
      "hi",
      "fi",
      "vi",
      "he",
      "uk",
      "el",
      "ms",
      "cs",
      "ro",
      "da",
      "hu",
      "ta",
      "no",
      "th",
      "ur",
      "hr",
      "bg",
      "lt",
      "ml",
      "cy",
      "sk",
      "te",
      "fa",
      "lv",
      "bn",
      "sr",
      "az",
      "sl",
      "kn",
      "et",
      "mk",
      "is",
      "hy",
      "ne",
      "mn",
      "bs",
      "kk",
      "sw",
      "gl",
      "mr",
      "pa",
      "km",
      "sn",
      "yo",
      "so",
      "af",
      "oc",
      "ka",
      "be",
      "tg",
      "sd",
      "gu",
      "am",
      "lo",
      "uz",
      "ps",
      "mt",
      "lb",
      "my",
      "as",
      "ln",
      "ha",
      "jw"
    ]
  },
  {
    name: "tag_audio_events",
    type: "boolean",
    required: true,
    description:
      "Whether to tag audio events like (laughter), (footsteps), etc. in the transcription.",
    default: true
  },
  {
    name: "num_speakers",
    type: "number",
    required: false,
    description:
      "The maximum amount of speakers talking in the uploaded file. Can help with predicting who speaks when. The maximum amount of speakers that can be predicted is 32. Defaults to null, in this case the amount of speakers is set to the maximum value the model supports.",
    min: 1,
    max: 32
  },
  {
    name: "timestamps_granularity",
    type: "select",
    required: true,
    description:
      "The granularity of the timestamps in the transcription. 'word' provides word-level timestamps and 'character' provides character-level timestamps per word.",
    default: "word",
    options: ["none", "word", "character"]
  },
  {
    name: "diarize",
    type: "boolean",
    required: true,
    description: "Whether to annotate which speaker is currently talking in the uploaded file.",
    default: false
  },
  {
    name: "diarization_threshold",
    type: "number",
    required: false,
    description:
      "Diarization threshold to apply during speaker diarization. A higher value means there will be a lower chance of one speaker being diarized as two different speakers but also a higher chance of two different speakers being diarized as one speaker (less total speakers predicted). A low value means there will be a higher chance of one speaker being diarized as two different speakers but also a lower chance of two different speakers being diarized as one speaker (more total speakers predicted). Can only be set when diarize=True and num_speakers=None. Defaults to None, in which case we will choose a threshold based on the model_id (0.22 usually).",
    min: 0.1,
    max: 0.4
  },
  {
    name: "additional_formats",
    type: "array",
    required: false,
    description: "A list of additional formats to export the transcript to.",
    inputFormat: "comma-separated"
  },
  {
    name: "file_format",
    type: "select",
    required: true,
    description:
      "The format of input audio. Options are 'pcm_s16le_16' or 'other' For `pcm_s16le_16`, the input audio must be 16-bit PCM at a 16kHz sample rate, single channel (mono), and little-endian byte order. Latency will be lower than with passing an encoded waveform.",
    default: "other",
    options: ["pcm_s16le_16", "other"]
  },
  {
    name: "cloud_storage_url",
    type: "string",
    required: false,
    description:
      "[Deprecated] This parameter is deprecated and will be removed in the future. Use 'source_url' instead.The HTTPS URL of the file to transcribe. Exactly one of the file or cloud_storage_url parameters must be provided. The file must be accessible via HTTPS and the file size must be less than 2GB. Any valid HTTPS URL is accepted, including URLs from cloud storage providers (AWS S3, Google Cloud Storage, Cloudflare R2, etc.), CDNs, or any other HTTPS source. URLs can be pre-signed or include authentication tokens in query parameters."
  },
  {
    name: "source_url",
    type: "string",
    required: false,
    description:
      "The URL of an audio or video file to transcribe. Supports hosted video or audio files, YouTube video URLs, TikTok video URLs, and other video hosting services."
  },
  {
    name: "webhook",
    type: "boolean",
    required: true,
    description:
      "Whether to send the transcription result to configured speech-to-text webhooks.  If set the request will return early without the transcription, which will be delivered later via webhook.",
    default: false
  },
  {
    name: "webhook_id",
    type: "string",
    required: false,
    description:
      "Optional specific webhook ID to send the transcription result to. Only valid when webhook is set to true. If not provided, transcription will be sent to all configured speech-to-text webhooks."
  },
  {
    name: "temperature",
    type: "number",
    required: false,
    description:
      "Controls the randomness of the transcription output. Accepts values between 0.0 and 2.0, where higher values result in more diverse and less deterministic results. If omitted, we will use a temperature based on the model you selected which is usually 0.",
    min: 0,
    max: 2
  },
  {
    name: "seed",
    type: "number",
    required: false,
    description:
      "If specified, our system will make a best effort to sample deterministically, such that repeated requests with the same seed and parameters should return the same result. Determinism is not guaranteed. Must be an integer between 0 and 2147483647.",
    min: 0,
    max: 2147483647
  },
  {
    name: "use_multi_channel",
    type: "boolean",
    required: true,
    description:
      "Whether the audio file contains multiple channels where each channel contains a single speaker. When enabled, each channel is transcribed independently. By default a separate transcript is returned per channel; set multichannel_output_style='combined' to instead receive a single transcript with all channels merged and sorted by time. Each word in the response includes a 'channel_index' field indicating which channel it was spoken on. A maximum of 5 channels is supported. Each channel is billed independently at the full audio duration, so cost scales linearly with the number of channels.",
    default: false
  },
  {
    name: "multichannel_output_style",
    type: "select",
    required: true,
    description:
      "Controls the response shape when use_multi_channel is enabled. 'separate' (default) returns one transcript per channel under 'transcripts'. 'combined' merges all channels into a single transcript whose words are sorted by start time, each carrying a 'channel_index' - matching the single-channel response shape. 'combined' requires timestamps (timestamps_granularity must not be 'none') and does not support entity detection or redaction.",
    default: "separate",
    options: ["separate", "combined"]
  },
  {
    name: "webhook_metadata",
    type: "string",
    required: false,
    description:
      "Optional metadata to be included in the webhook response. This should be a JSON string representing an object with a maximum depth of 2 levels and maximum size of 16KB. Useful for tracking internal IDs, job references, or other contextual information."
  },
  {
    name: "entity_detection",
    type: "string",
    required: false,
    description:
      "Detect entities in the transcript. Can be 'all' to detect all entities, a single entity type or category string, or a list of entity types/categories. Categories include 'pii', 'phi', 'pci', 'other', 'offensive_language'. When enabled, detected entities will be returned in the 'entities' field with their text, type, and character positions. Usage of this parameter will incur an additional 30% surcharge on the base transcription cost."
  },
  {
    name: "no_verbatim",
    type: "boolean",
    required: true,
    description:
      "If true, the transcription will not have any filler words, false starts and non-speech sounds. Only supported with scribe_v2 model.",
    default: false
  },
  {
    name: "use_speaker_library",
    type: "boolean",
    required: true,
    description:
      "Whether to use the speaker library for identifying known speakers during diarization. When enabled and diarize is true, detected speakers will be matched against registered speakers in the workspace's speaker library.",
    default: false
  },
  {
    name: "detect_speaker_roles",
    type: "boolean",
    required: true,
    description:
      "Whether to detect speaker roles (agent vs customer). Requires diarize=true. Cannot be used with use_multi_channel=true. When enabled, speaker_id values will be 'agent' and 'customer' instead of 'speaker_0', 'speaker_1', etc. Usage incurs an additional 10% surcharge on base transcription cost.",
    default: false
  },
  {
    name: "entity_redaction",
    type: "string",
    required: false,
    description:
      "Redact entities from the transcript text. Accepts the same format as entity_detection: 'all', a category ('pii', 'phi'), or specific entity types. Must be a subset of entity_detection. When redaction is enabled, the entities field will not be returned. Usage of this parameter will incur an additional 30% surcharge on the base transcription cost."
  },
  {
    name: "entity_redaction_mode",
    type: "string",
    required: true,
    description:
      "How to format redacted entities. 'redacted' replaces with {REDACTED}, 'entity_type' replaces with {ENTITY_TYPE}, 'enumerated_entity_type' replaces with {ENTITY_TYPE_N} where N enumerates each occurrence. Only used when entity_redaction is set.",
    default: "enumerated_entity_type"
  },
  {
    name: "keyterms",
    type: "array",
    required: true,
    description:
      'A list of keyterms to bias the transcription towards.           The keyterms are words or phrases you want the model to recognise more accurately.           The number of keyterms cannot exceed 1000.           The length of each keyterm must be less than 50 characters.           Keyterms can contain at most 5 words (after normalisation).           For example ["hello", "world", "technical term"].           The following characters are not supported: `<`, `>`, `{`, `}`, `[`, `]`, `\\`.           Usage of this parameter will incur an additional 20% surcharge on the base transcription cost.           When more than 100 keyterms are provided, a minimum billable duration of 20 seconds applies per request.',
    default: [],
    inputFormat: "comma-separated"
  }
] as const
/** Field names for ElevenLabsTranscription */
export type ElevenLabsTranscriptionFieldName =
  (typeof ELEVENLABS_TRANSCRIPTION_FIELDS)[number]["name"]

// ─────────────────────────────────────────────────────────────────────────────
// Speechmatics
// ─────────────────────────────────────────────────────────────────────────────

/** Speechmatics transcription field metadata (8 fields) */
export const SPEECHMATICS_TRANSCRIPTION_FIELDS = [
  {
    name: "language",
    type: "select",
    required: true,
    description:
      "Language model to process the audio input, normally specified as an ISO language code",
    options: [
      "auto",
      "ar",
      "ar_en",
      "ba",
      "be",
      "bg",
      "bn",
      "ca",
      "cmn",
      "cmn_en",
      "cmn_en_ms_ta",
      "cs",
      "cy",
      "da",
      "de",
      "el",
      "en",
      "en_ms",
      "en_ta",
      "eo",
      "es",
      "et",
      "eu",
      "fa",
      "fi",
      "fr",
      "ga",
      "gl",
      "he",
      "hi",
      "hr",
      "hu",
      "ia",
      "id",
      "it",
      "ja",
      "ko",
      "lt",
      "lv",
      "mn",
      "mr",
      "ms",
      "mt",
      "nl",
      "nn",
      "no",
      "pl",
      "pt",
      "ro",
      "ru",
      "sk",
      "sl",
      "sv",
      "sw",
      "ta",
      "th",
      "tl",
      "tr",
      "ug",
      "uk",
      "ur",
      "vi",
      "yue"
    ]
  },
  {
    name: "domain",
    type: "string",
    required: false,
    description:
      'Request a specialized model based on "language" but optimized for a particular field'
  },
  {
    name: "output_locale",
    type: "string",
    required: false,
    description: "Language locale to be used when generating the transcription output"
  },
  {
    name: "model",
    type: "select",
    required: false,
    description: "Specific model to use in transcription",
    options: ["standard", "enhanced"]
  },
  {
    name: "operating_point",
    type: "select",
    required: false,
    description: "Deprecated compatibility alias for model",
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
    description:
      "Include additional entity objects in the transcription results (dates, numbers, etc)"
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
export type SpeechmaticsTranscriptionFieldName =
  (typeof SPEECHMATICS_TRANSCRIPTION_FIELDS)[number]["name"]

/** Speechmatics streaming field metadata (11 fields) */
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
    type: "select",
    required: true,
    description:
      "Language model to process the audio input, normally specified as an ISO language code. The value must be consistent with the language code used in the API endpoint URL.",
    options: [
      "auto",
      "ar",
      "ar_en",
      "ba",
      "be",
      "bg",
      "bn",
      "ca",
      "cmn",
      "cmn_en",
      "cmn_en_ms_ta",
      "cs",
      "cy",
      "da",
      "de",
      "el",
      "en",
      "en_ms",
      "en_ta",
      "eo",
      "es",
      "et",
      "eu",
      "fa",
      "fi",
      "fr",
      "ga",
      "gl",
      "he",
      "hi",
      "hr",
      "hu",
      "ia",
      "id",
      "it",
      "ja",
      "ko",
      "lt",
      "lv",
      "mn",
      "mr",
      "ms",
      "mt",
      "nl",
      "nn",
      "no",
      "pl",
      "pt",
      "ro",
      "ru",
      "sk",
      "sl",
      "sv",
      "sw",
      "ta",
      "th",
      "tl",
      "tr",
      "ug",
      "uk",
      "ur",
      "vi",
      "yue"
    ]
  },
  {
    name: "domain",
    type: "string",
    required: false,
    description:
      "Request a specialized model based on 'language' but optimized for a particular field, e.g. `finance` or `medical`."
  },
  {
    name: "max_delay",
    type: "number",
    required: false,
    description:
      "This is the delay in seconds between the end of a spoken word and returning the Final transcript results. See [Latency](https://docs.speechmatics.com/speech-to-text/realtime/output#latency) for more details",
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
    description:
      "Whether or not to send Partials (i.e. `AddPartialTranslation` messages) as well as Finals (i.e. `AddTranslation` messages) See [Partial transcripts](https://docs.speechmatics.com/speech-to-text/realtime/output#partial-transcripts)."
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
    options: ["standard", "enhanced", "melia-1"]
  },
  {
    name: "model",
    type: "select",
    required: false,
    options: ["standard", "enhanced", "melia-1"]
  },
  {
    name: "channel_diarization_labels",
    type: "array",
    required: false,
    inputFormat: "comma-separated"
  }
] as const
/** Field names for SpeechmaticsStreaming */
export type SpeechmaticsStreamingFieldName = (typeof SPEECHMATICS_STREAMING_FIELDS)[number]["name"]

/** Speechmatics streaming update field metadata (4 fields) */
export const SPEECHMATICS_STREAMING_UPDATE_FIELDS = [
  {
    name: "language",
    type: "select",
    required: false,
    description:
      "Language model to process the audio input, normally specified as an ISO language code. The value must be consistent with the language code used in the API endpoint URL.",
    options: [
      "auto",
      "ar",
      "ar_en",
      "ba",
      "be",
      "bg",
      "bn",
      "ca",
      "cmn",
      "cmn_en",
      "cmn_en_ms_ta",
      "cs",
      "cy",
      "da",
      "de",
      "el",
      "en",
      "en_ms",
      "en_ta",
      "eo",
      "es",
      "et",
      "eu",
      "fa",
      "fi",
      "fr",
      "ga",
      "gl",
      "he",
      "hi",
      "hr",
      "hu",
      "ia",
      "id",
      "it",
      "ja",
      "ko",
      "lt",
      "lv",
      "mn",
      "mr",
      "ms",
      "mt",
      "nl",
      "nn",
      "no",
      "pl",
      "pt",
      "ro",
      "ru",
      "sk",
      "sl",
      "sv",
      "sw",
      "ta",
      "th",
      "tl",
      "tr",
      "ug",
      "uk",
      "ur",
      "vi",
      "yue"
    ]
  },
  {
    name: "max_delay",
    type: "number",
    required: false,
    description:
      "This is the delay in seconds between the end of a spoken word and returning the Final transcript results. See [Latency](https://docs.speechmatics.com/speech-to-text/realtime/output#latency) for more details",
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
    description:
      "Whether or not to send Partials (i.e. `AddPartialTranslation` messages) as well as Finals (i.e. `AddTranslation` messages) See [Partial transcripts](https://docs.speechmatics.com/speech-to-text/realtime/output#partial-transcripts)."
  }
] as const
/** Field names for SpeechmaticsStreamingUpdate */
export type SpeechmaticsStreamingUpdateFieldName =
  (typeof SPEECHMATICS_STREAMING_UPDATE_FIELDS)[number]["name"]

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
export type SpeechmaticsListFilterFieldName =
  (typeof SPEECHMATICS_LIST_FILTER_FIELDS)[number]["name"]

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
    description:
      "URL of the audio file to transcribe. Cannot be specified if `file_id` is specified."
  },
  {
    name: "file_id",
    type: "string",
    required: false,
    description:
      "ID of the uploaded file to transcribe. Cannot be specified if `audio_url` is specified."
  },
  {
    name: "language_hints",
    type: "multiselect",
    required: false,
    description:
      "Expected languages in the audio. If not specified, languages are automatically detected.",
    inputFormat: "comma-separated",
    options: [
      "af",
      "sq",
      "ar",
      "az",
      "eu",
      "be",
      "bn",
      "bs",
      "bg",
      "ca",
      "zh",
      "hr",
      "cs",
      "da",
      "nl",
      "en",
      "et",
      "fi",
      "fr",
      "gl",
      "de",
      "el",
      "gu",
      "he",
      "hi",
      "hu",
      "id",
      "it",
      "ja",
      "kn",
      "kk",
      "ko",
      "lv",
      "lt",
      "mk",
      "ms",
      "ml",
      "mr",
      "no",
      "fa",
      "pl",
      "pt",
      "pa",
      "ro",
      "ru",
      "sr",
      "sk",
      "sl",
      "es",
      "sw",
      "sv",
      "tl",
      "ta",
      "te",
      "th",
      "tr",
      "uk",
      "ur",
      "vi",
      "cy"
    ]
  },
  {
    name: "language_hints_strict",
    type: "boolean",
    required: false,
    description: "When `true`, the model will rely more on language hints."
  },
  {
    name: "enable_speaker_diarization",
    type: "boolean",
    required: false,
    description: "When `true`, speakers are identified and separated in the transcription output."
  },
  {
    name: "enable_language_identification",
    type: "boolean",
    required: false,
    description: "When `true`, language is detected for each part of the transcription."
  },
  {
    name: "translation",
    type: "object",
    required: false,
    description: "Translation configuration.",
    nestedFields: [
      {
        name: "type",
        type: "select",
        required: true,
        options: ["one_way", "two_way"]
      },
      {
        name: "target_language",
        type: "string",
        required: false
      },
      {
        name: "language_a",
        type: "string",
        required: false
      },
      {
        name: "language_b",
        type: "string",
        required: false
      }
    ]
  },
  {
    name: "context",
    type: "string",
    required: false,
    description:
      "Additional context to improve transcription accuracy and formatting of specialized terms."
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

/** Soniox streaming field metadata (15 fields) */
export const SONIOX_STREAMING_FIELDS = [
  {
    name: "model",
    type: "select",
    required: true,
    options: ["stt-rt-v4", "stt-rt-preview", "stt-rt-v3-preview", "stt-rt-preview-v2", "stt-rt-v3"]
  },
  {
    name: "audioFormat",
    type: "select",
    required: false,
    options: [
      "auto",
      "aac",
      "aiff",
      "amr",
      "asf",
      "flac",
      "mp3",
      "ogg",
      "wav",
      "webm",
      "pcm_s8",
      "pcm_s16le",
      "pcm_s16be",
      "pcm_s24le",
      "pcm_s24be",
      "pcm_s32le",
      "pcm_s32be",
      "pcm_u8",
      "pcm_u16le",
      "pcm_u16be",
      "pcm_u24le",
      "pcm_u24be",
      "pcm_u32le",
      "pcm_u32be",
      "pcm_f32le",
      "pcm_f32be",
      "pcm_f64le",
      "pcm_f64be",
      "mulaw",
      "alaw"
    ]
  },
  {
    name: "sampleRate",
    type: "number",
    required: false
  },
  {
    name: "numChannels",
    type: "number",
    required: false
  },
  {
    name: "languageHints",
    type: "multiselect",
    required: false,
    inputFormat: "comma-separated",
    options: [
      "af",
      "sq",
      "ar",
      "az",
      "eu",
      "be",
      "bn",
      "bs",
      "bg",
      "ca",
      "zh",
      "hr",
      "cs",
      "da",
      "nl",
      "en",
      "et",
      "fi",
      "fr",
      "gl",
      "de",
      "el",
      "gu",
      "he",
      "hi",
      "hu",
      "id",
      "it",
      "ja",
      "kn",
      "kk",
      "ko",
      "lv",
      "lt",
      "mk",
      "ms",
      "ml",
      "mr",
      "no",
      "fa",
      "pl",
      "pt",
      "pa",
      "ro",
      "ru",
      "sr",
      "sk",
      "sl",
      "es",
      "sw",
      "sv",
      "tl",
      "ta",
      "te",
      "th",
      "tr",
      "uk",
      "ur",
      "vi",
      "cy"
    ]
  },
  {
    name: "languageHintsStrict",
    type: "boolean",
    required: false
  },
  {
    name: "context",
    type: "string",
    required: false
  },
  {
    name: "enableSpeakerDiarization",
    type: "boolean",
    required: false
  },
  {
    name: "enableLanguageIdentification",
    type: "boolean",
    required: false
  },
  {
    name: "enableEndpointDetection",
    type: "boolean",
    required: false
  },
  {
    name: "maxEndpointDelayMs",
    type: "number",
    required: false
  },
  {
    name: "translation",
    type: "object",
    required: false,
    nestedFields: [
      {
        name: "type",
        type: "select",
        required: true,
        options: ["two_way"]
      },
      {
        name: "target_language",
        type: "string",
        required: true
      },
      {
        name: "language_a",
        type: "string",
        required: true
      },
      {
        name: "language_b",
        type: "string",
        required: true
      }
    ]
  },
  {
    name: "clientReferenceId",
    type: "string",
    required: false
  },
  {
    name: "keepaliveIntervalMs",
    type: "number",
    required: false
  },
  {
    name: "connectTimeoutMs",
    type: "number",
    required: false
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
    listFilters: GLADIA_LIST_FILTER_FIELDS
  },
  deepgram: {
    transcription: DEEPGRAM_TRANSCRIPTION_FIELDS,
    streaming: DEEPGRAM_STREAMING_FIELDS,
    listFilters: DEEPGRAM_LIST_FILTER_FIELDS
  },
  assemblyai: {
    transcription: ASSEMBLYAI_TRANSCRIPTION_FIELDS,
    streaming: ASSEMBLYAI_STREAMING_FIELDS,
    streamingUpdate: ASSEMBLYAI_STREAMING_UPDATE_FIELDS,
    listFilters: ASSEMBLYAI_LIST_FILTER_FIELDS
  },
  "openai-whisper": {
    transcription: OPENAI_TRANSCRIPTION_FIELDS
  },
  "azure-stt": {
    transcription: AZURE_TRANSCRIPTION_FIELDS,
    listFilters: AZURE_LIST_FILTER_FIELDS
  },
  elevenlabs: {
    transcription: ELEVENLABS_TRANSCRIPTION_FIELDS
  },
  speechmatics: {
    transcription: SPEECHMATICS_TRANSCRIPTION_FIELDS,
    streaming: SPEECHMATICS_STREAMING_FIELDS,
    streamingUpdate: SPEECHMATICS_STREAMING_UPDATE_FIELDS,
    listFilters: SPEECHMATICS_LIST_FILTER_FIELDS
  },
  soniox: {
    transcription: SONIOX_TRANSCRIPTION_FIELDS,
    streaming: SONIOX_STREAMING_FIELDS,
    listFilters: SONIOX_LIST_FILTER_FIELDS
  }
} as const

export type FieldMetadataProvider = keyof typeof PROVIDER_FIELDS
