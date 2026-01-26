/**
 * Field Equivalences - Programmatic access to cross-provider field mappings
 *
 * AUTO-GENERATED - Do not edit manually
 * Regenerate with: pnpm docs:field-equivalences
 *
 * @example
 * ```typescript
 * import { FIELD_EQUIVALENCES, getEquivalentField } from 'voice-router-dev/field-equivalences'
 *
 * // Get diarization field for Deepgram
 * const field = FIELD_EQUIVALENCES.diarization.deepgram.transcription[0] // 'diarize'
 *
 * // Or use the helper
 * const field = getEquivalentField('diarization', 'deepgram', 'transcription') // 'diarize'
 * ```
 *
 * @packageDocumentation
 */

/** Supported providers */
export type Provider = "gladia" | "deepgram" | "assemblyai" | "speechmatics" | "soniox" | "azure" | "openai"

/** Semantic field categories */
export type FieldCategory = "diarization" | "punctuation" | "language" | "model" | "translation" | "sentiment" | "entities" | "profanity" | "redaction" | "timestamps" | "callback"

/** API mode */
export type ApiMode = "transcription" | "streaming"

/** Fields for a provider in a category */
export interface ProviderFields {
  transcription: readonly string[]
  streaming: readonly string[]
}

/** Mapping of providers to their fields for a category */
export type CategoryMapping = {
  [P in Provider]: ProviderFields
}

/** Metadata for a semantic category */
export interface CategoryMetadata {
  label: string
  description: string
  providers: CategoryMapping
  notes: readonly string[]
  nonEquivalences: readonly string[]
}

/**
 * Field equivalences across providers
 *
 * Maps semantic categories to provider-specific field names.
 * Use this to build your own translation logic.
 */
export const FIELD_EQUIVALENCES: Record<FieldCategory, CategoryMetadata> = {
  diarization: {
    label: "Speaker Diarization",
    description: "Identify and separate different speakers in audio",
    providers: {
      gladia: {
        transcription: ["diarization","diarization_config","number_of_speakers","min_speakers","max_speakers"] as const,
        streaming: [] as const
      },
      deepgram: {
        transcription: ["diarize"] as const,
        streaming: ["diarize"] as const
      },
      assemblyai: {
        transcription: ["speaker_labels","speakers_expected"] as const,
        streaming: [] as const
      },
      speechmatics: {
        transcription: ["diarization"] as const,
        streaming: [] as const
      },
      soniox: {
        transcription: ["enable_speaker_diarization"] as const,
        streaming: ["enableSpeakerDiarization"] as const
      },
      azure: {
        transcription: ["diarizationEnabled","diarization"] as const,
        streaming: [] as const
      },
      openai: {
        transcription: [] as const,
        streaming: [] as const
      },
    },
    notes: ["Gladia: `diarization` (boolean) + `diarization_config` (object with speaker counts)","Deepgram: `diarize` (boolean) - no speaker count hints","AssemblyAI: `speaker_labels` (boolean) + `speakers_expected` (number)","Soniox: `enableSpeakerDiarization` / `enable_speaker_diarization` (streaming vs async)","Azure: `properties.diarizationEnabled` (boolean)","OpenAI: Use `gpt-4o-transcribe-diarize` model instead of a field"] as const,
    nonEquivalences: ["OpenAI uses a dedicated model, not a boolean flag","Speaker count hints only available on some providers"] as const
  },
  punctuation: {
    label: "Punctuation & Formatting",
    description: "Add punctuation, capitalization, and smart formatting",
    providers: {
      gladia: {
        transcription: ["punctuation_enhanced"] as const,
        streaming: [] as const
      },
      deepgram: {
        transcription: ["punctuate","smart_format"] as const,
        streaming: ["punctuate","smart_format"] as const
      },
      assemblyai: {
        transcription: ["punctuate","format_text"] as const,
        streaming: [] as const
      },
      speechmatics: {
        transcription: [] as const,
        streaming: [] as const
      },
      soniox: {
        transcription: [] as const,
        streaming: [] as const
      },
      azure: {
        transcription: ["punctuationMode"] as const,
        streaming: [] as const
      },
      openai: {
        transcription: [] as const,
        streaming: [] as const
      },
    },
    notes: ["Gladia: `punctuation_enhanced` (boolean) - enhanced algorithm","Deepgram: `punctuate` (boolean) OR `smart_format` (boolean, includes more than punctuation)","AssemblyAI: `punctuate` (boolean)","Speechmatics: Automatic, no toggle needed","Azure: `properties.punctuationMode` (select: None, Dictated, Automatic, DictatedAndAutomatic)"] as const,
    nonEquivalences: ["Deepgram `smart_format` is NOT equivalent to just punctuation - it includes numerals, dates, formatting","Azure uses modes, not a boolean","Speechmatics has no toggle (always on)"] as const
  },
  language: {
    label: "Language Selection",
    description: "Primary transcription language or language detection",
    providers: {
      gladia: {
        transcription: ["detect_language","language","language_config"] as const,
        streaming: ["language_config"] as const
      },
      deepgram: {
        transcription: ["detect_language","language"] as const,
        streaming: ["detect_language","language"] as const
      },
      assemblyai: {
        transcription: ["language_code","language_detection"] as const,
        streaming: [] as const
      },
      speechmatics: {
        transcription: ["language"] as const,
        streaming: ["language"] as const
      },
      soniox: {
        transcription: ["language_hints","language_hints_strict"] as const,
        streaming: ["languageHints"] as const
      },
      azure: {
        transcription: ["locale"] as const,
        streaming: [] as const
      },
      openai: {
        transcription: ["language"] as const,
        streaming: [] as const
      },
    },
    notes: ["Gladia: `language_config.languages` (array) or `language` (deprecated)","Deepgram: `language` (string, BCP-47 code)","AssemblyAI: `language_code` (string, ISO 639-1)","Speechmatics: `language` (string, language pack code)","Soniox: `languageHints` (array of ISO codes)","Azure: `locale` (string, BCP-47)","OpenAI: `language` (string, ISO 639-1)"] as const,
    nonEquivalences: ["Field names differ significantly across providers","Some accept arrays (multi-language), others only strings","Language code formats vary (ISO 639-1 vs BCP-47 vs custom)"] as const
  },
  model: {
    label: "Model Selection",
    description: "Choose transcription model/tier",
    providers: {
      gladia: {
        transcription: ["model"] as const,
        streaming: ["model","model"] as const
      },
      deepgram: {
        transcription: ["model"] as const,
        streaming: ["model"] as const
      },
      assemblyai: {
        transcription: ["speech_model"] as const,
        streaming: [] as const
      },
      speechmatics: {
        transcription: ["operating_point"] as const,
        streaming: ["operating_point"] as const
      },
      soniox: {
        transcription: ["model"] as const,
        streaming: ["model"] as const
      },
      azure: {
        transcription: ["model"] as const,
        streaming: [] as const
      },
      openai: {
        transcription: ["model"] as const,
        streaming: [] as const
      },
    },
    notes: ["Gladia: `model` (select: solaria-1, accurate, fast)","Deepgram: `model` (nova-2, nova, enhanced, base, whisper)","AssemblyAI: `speech_model` (best, nano)","Speechmatics: `operating_point` (standard, enhanced) - NOT called 'model'","Soniox: Model specified in URL/config (stt-rt-preview, stt-async-preview)","OpenAI: `model` (whisper-1, gpt-4o-transcribe, etc.)"] as const,
    nonEquivalences: ["Speechmatics uses `operating_point`, not `model`","Model names are provider-specific and not translatable","Quality/speed tradeoffs differ by provider"] as const
  },
  translation: {
    label: "Translation",
    description: "Translate transcription to other languages",
    providers: {
      gladia: {
        transcription: ["translation","translation_config","target_languages"] as const,
        streaming: ["translation","translation_config","target_languages"] as const
      },
      deepgram: {
        transcription: [] as const,
        streaming: [] as const
      },
      assemblyai: {
        transcription: [] as const,
        streaming: [] as const
      },
      speechmatics: {
        transcription: [] as const,
        streaming: [] as const
      },
      soniox: {
        transcription: ["translation"] as const,
        streaming: ["translation"] as const
      },
      azure: {
        transcription: [] as const,
        streaming: [] as const
      },
      openai: {
        transcription: [] as const,
        streaming: [] as const
      },
    },
    notes: ["Gladia: `translation` (boolean) + `translation_config.target_languages` (array)","Deepgram: Not available via transcription API","AssemblyAI: Not available","Speechmatics: `translation_config` (object)","Soniox: `translation` (object with target_language)","OpenAI: Not available"] as const,
    nonEquivalences: ["Not all providers support translation","Gladia supports multiple target languages, Soniox supports one"] as const
  },
  sentiment: {
    label: "Sentiment Analysis",
    description: "Detect emotional tone in speech",
    providers: {
      gladia: {
        transcription: ["sentiment_analysis"] as const,
        streaming: ["sentiment_analysis"] as const
      },
      deepgram: {
        transcription: ["sentiment"] as const,
        streaming: ["sentiment"] as const
      },
      assemblyai: {
        transcription: ["sentiment_analysis"] as const,
        streaming: [] as const
      },
      speechmatics: {
        transcription: [] as const,
        streaming: [] as const
      },
      soniox: {
        transcription: [] as const,
        streaming: [] as const
      },
      azure: {
        transcription: [] as const,
        streaming: [] as const
      },
      openai: {
        transcription: [] as const,
        streaming: [] as const
      },
    },
    notes: ["Gladia: `sentiment_analysis` (boolean)","AssemblyAI: `sentiment_analysis` (boolean)","Deepgram: `sentiment` (boolean)","Speechmatics: Not available","Soniox: Not available","OpenAI: Not available"] as const,
    nonEquivalences: ["Only some providers support sentiment analysis","Output formats differ significantly"] as const
  },
  entities: {
    label: "Entity Detection (NER)",
    description: "Detect named entities (people, places, organizations)",
    providers: {
      gladia: {
        transcription: ["named_entity_recognition"] as const,
        streaming: ["named_entity_recognition"] as const
      },
      deepgram: {
        transcription: ["detect_entities"] as const,
        streaming: ["detect_entities"] as const
      },
      assemblyai: {
        transcription: ["entity_detection"] as const,
        streaming: [] as const
      },
      speechmatics: {
        transcription: [] as const,
        streaming: [] as const
      },
      soniox: {
        transcription: [] as const,
        streaming: [] as const
      },
      azure: {
        transcription: [] as const,
        streaming: [] as const
      },
      openai: {
        transcription: [] as const,
        streaming: [] as const
      },
    },
    notes: ["Gladia: `named_entity_recognition` (boolean)","AssemblyAI: `entity_detection` (boolean)","Deepgram: `detect_entities` (boolean)","Speechmatics: Not available in real-time","Soniox: Not available","OpenAI: Not available"] as const,
    nonEquivalences: ["Entity taxonomies differ by provider","Some providers detect more entity types than others"] as const
  },
  profanity: {
    label: "Profanity Filtering",
    description: "Censor or filter profane language",
    providers: {
      gladia: {
        transcription: [] as const,
        streaming: [] as const
      },
      deepgram: {
        transcription: ["profanity_filter"] as const,
        streaming: ["profanity_filter"] as const
      },
      assemblyai: {
        transcription: ["filter_profanity"] as const,
        streaming: ["filterProfanity"] as const
      },
      speechmatics: {
        transcription: [] as const,
        streaming: [] as const
      },
      soniox: {
        transcription: [] as const,
        streaming: [] as const
      },
      azure: {
        transcription: ["profanityFilterMode"] as const,
        streaming: [] as const
      },
      openai: {
        transcription: [] as const,
        streaming: [] as const
      },
    },
    notes: ["Gladia: Not available","Deepgram: `profanity_filter` (boolean)","AssemblyAI: `filter_profanity` (boolean)","Speechmatics: Not available","Soniox: Not available","OpenAI: Not available"] as const,
    nonEquivalences: ["Limited provider support","Replacement strategies differ (asterisks vs removal)"] as const
  },
  redaction: {
    label: "PII Redaction",
    description: "Redact personally identifiable information",
    providers: {
      gladia: {
        transcription: [] as const,
        streaming: [] as const
      },
      deepgram: {
        transcription: ["redact"] as const,
        streaming: ["redact"] as const
      },
      assemblyai: {
        transcription: ["redact_pii","redact_pii_audio","redact_pii_audio_quality","redact_pii_policies","redact_pii_sub"] as const,
        streaming: [] as const
      },
      speechmatics: {
        transcription: [] as const,
        streaming: [] as const
      },
      soniox: {
        transcription: [] as const,
        streaming: [] as const
      },
      azure: {
        transcription: [] as const,
        streaming: [] as const
      },
      openai: {
        transcription: [] as const,
        streaming: [] as const
      },
    },
    notes: ["Deepgram: `redact` (array of PII types)","AssemblyAI: `redact_pii` (boolean) + `redact_pii_policies` (array)","Gladia: Not available for live","Speechmatics: Not available","Soniox: Not available","OpenAI: Not available"] as const,
    nonEquivalences: ["PII categories differ by provider","Audio vs text redaction options vary"] as const
  },
  timestamps: {
    label: "Word Timestamps",
    description: "Get precise timing for each word",
    providers: {
      gladia: {
        transcription: [] as const,
        streaming: ["words_accurate_timestamps"] as const
      },
      deepgram: {
        transcription: ["filler_words","keywords"] as const,
        streaming: ["filler_words","keywords"] as const
      },
      assemblyai: {
        transcription: [] as const,
        streaming: [] as const
      },
      speechmatics: {
        transcription: [] as const,
        streaming: [] as const
      },
      soniox: {
        transcription: [] as const,
        streaming: [] as const
      },
      azure: {
        transcription: ["wordLevelTimestampsEnabled","displayFormWordLevelTimestampsEnabled"] as const,
        streaming: [] as const
      },
      openai: {
        transcription: ["timestamp_granularities"] as const,
        streaming: [] as const
      },
    },
    notes: ["Gladia: `words_accurate_timestamps` (if available)","Deepgram: Always included in response","AssemblyAI: Always included when using streaming","Speechmatics: Always included","Soniox: Always included","OpenAI: `timestamp_granularities` (array: word, segment)"] as const,
    nonEquivalences: ["Most providers include by default","OpenAI requires explicit request"] as const
  },
  callback: {
    label: "Webhook/Callback",
    description: "Send results to a webhook URL",
    providers: {
      gladia: {
        transcription: ["callback_url","callback","callback_config"] as const,
        streaming: ["callback","callback_config"] as const
      },
      deepgram: {
        transcription: ["callback","callback_method"] as const,
        streaming: ["callback","callback_method"] as const
      },
      assemblyai: {
        transcription: ["webhook_url","webhook_auth_header_name","webhook_auth_header_value"] as const,
        streaming: [] as const
      },
      speechmatics: {
        transcription: [] as const,
        streaming: [] as const
      },
      soniox: {
        transcription: ["webhook_url","webhook_auth_header_name","webhook_auth_header_value"] as const,
        streaming: [] as const
      },
      azure: {
        transcription: [] as const,
        streaming: [] as const
      },
      openai: {
        transcription: [] as const,
        streaming: [] as const
      },
    },
    notes: ["Gladia: `callback` (boolean) + `callback_config` (object)","Deepgram: `callback` (string URL)","AssemblyAI: `webhook_url` (string)","Speechmatics: Callback in job config","Azure: Webhook in transcription properties","Soniox: Not available","OpenAI: Not available"] as const,
    nonEquivalences: ["Config structure varies significantly","Auth header support differs"] as const
  },
} as const

/**
 * Get the equivalent field name for a provider
 *
 * @param category - Semantic category (e.g., 'diarization', 'punctuation')
 * @param provider - Target provider
 * @param mode - API mode ('transcription' or 'streaming')
 * @returns First matching field name, or undefined if not supported
 *
 * @example
 * ```typescript
 * getEquivalentField('diarization', 'deepgram', 'transcription') // 'diarize'
 * getEquivalentField('diarization', 'gladia', 'transcription')   // 'diarization'
 * getEquivalentField('diarization', 'openai', 'transcription')   // undefined
 * ```
 */
export function getEquivalentField(
  category: FieldCategory,
  provider: Provider,
  mode: ApiMode
): string | undefined {
  const fields = FIELD_EQUIVALENCES[category]?.providers[provider]?.[mode]
  return fields?.[0]
}

/**
 * Get all equivalent fields for a category
 *
 * @param category - Semantic category
 * @param mode - API mode
 * @returns Map of provider to field names
 *
 * @example
 * ```typescript
 * const diarizationFields = getCategoryFields('diarization', 'transcription')
 * // { deepgram: ['diarize'], gladia: ['diarization', ...], ... }
 * ```
 */
export function getCategoryFields(
  category: FieldCategory,
  mode: ApiMode
): Record<Provider, readonly string[]> {
  const result = {} as Record<Provider, readonly string[]>
  const categoryData = FIELD_EQUIVALENCES[category]
  if (!categoryData) return result

  for (const [provider, fields] of Object.entries(categoryData.providers)) {
    result[provider as Provider] = fields[mode]
  }
  return result
}

/**
 * Check if a provider supports a semantic category
 *
 * @param category - Semantic category
 * @param provider - Provider to check
 * @param mode - API mode
 * @returns true if the provider has fields for this category
 */
export function supportsCategory(
  category: FieldCategory,
  provider: Provider,
  mode: ApiMode
): boolean {
  const fields = FIELD_EQUIVALENCES[category]?.providers[provider]?.[mode]
  return fields !== undefined && fields.length > 0
}
