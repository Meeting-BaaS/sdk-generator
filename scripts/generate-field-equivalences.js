#!/usr/bin/env node
/**
 * Generate Field Equivalences Documentation
 *
 * Analyzes field metadata across all providers and generates a markdown
 * document showing semantic field mappings and non-equivalences.
 *
 * This helps SDK consumers understand how fields map (or don't map)
 * between providers when building their own translation logic.
 *
 * Run: pnpm docs:field-equivalences
 * Output: docs/FIELD_EQUIVALENCES.md
 */

const fs = require("fs")
const path = require("path")

const FIELD_METADATA_PATH = path.join(__dirname, "../src/field-metadata.ts")
const OUTPUT_MD_PATH = path.join(__dirname, "../docs/FIELD_EQUIVALENCES.md")
const OUTPUT_TS_PATH = path.join(__dirname, "../src/field-equivalences.ts")

// ─────────────────────────────────────────────────────────────────────────────
// Semantic Field Categories
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Semantic categories with field patterns and notes about non-equivalence
 */
const SEMANTIC_CATEGORIES = {
  diarization: {
    label: "Speaker Diarization",
    description: "Identify and separate different speakers in audio",
    patterns: [
      /^diariz/i,
      /speaker_labels/i,
      /enableSpeakerDiarization/i,
      /enable_speaker_diarization/i,
      /diarizationEnabled/i,
      /speakers_expected/i,
      /number_of_speakers/i,
      /min_speakers/i,
      /max_speakers/i
    ],
    notes: [
      "Gladia: `diarization` (boolean) + `diarization_config` (object with speaker counts)",
      "Deepgram: `diarize` (boolean) - no speaker count hints",
      "AssemblyAI: `speaker_labels` (boolean) + `speakers_expected` (number)",
      "Soniox: `enableSpeakerDiarization` / `enable_speaker_diarization` (streaming vs async)",
      "Azure: `properties.diarizationEnabled` (boolean)",
      "OpenAI: Use `gpt-4o-transcribe-diarize` model instead of a field"
    ],
    nonEquivalences: [
      "OpenAI uses a dedicated model, not a boolean flag",
      "Speaker count hints only available on some providers"
    ]
  },

  punctuation: {
    label: "Punctuation & Formatting",
    description: "Add punctuation, capitalization, and smart formatting",
    patterns: [
      /^punctuat/i,
      /smart_format/i,
      /format_text/i,
      /auto_punctuation/i
    ],
    notes: [
      "Gladia: `punctuation_enhanced` (boolean) - enhanced algorithm",
      "Deepgram: `punctuate` (boolean) OR `smart_format` (boolean, includes more than punctuation)",
      "AssemblyAI: `punctuate` (boolean)",
      "Speechmatics: Automatic, no toggle needed",
      "Azure: `properties.punctuationMode` (select: None, Dictated, Automatic, DictatedAndAutomatic)"
    ],
    nonEquivalences: [
      "Deepgram `smart_format` is NOT equivalent to just punctuation - it includes numerals, dates, formatting",
      "Azure uses modes, not a boolean",
      "Speechmatics has no toggle (always on)"
    ]
  },

  language: {
    label: "Language Selection",
    description: "Primary transcription language or language detection",
    patterns: [
      /^language$/i,
      /^language_code$/i,
      /^language_config$/i,
      /^locale$/i,
      /^defaultLanguage$/i,
      /language_hints/i,
      /languageHints/i,
      /detect_language/i,
      /language_detection/i
    ],
    notes: [
      "Gladia: `language_config.languages` (array) or `language` (deprecated)",
      "Deepgram: `language` (string, BCP-47 code)",
      "AssemblyAI: `language_code` (string, ISO 639-1)",
      "Speechmatics: `language` (string, language pack code)",
      "Soniox: `languageHints` (array of ISO codes)",
      "Azure: `locale` (string, BCP-47)",
      "OpenAI: `language` (string, ISO 639-1)"
    ],
    nonEquivalences: [
      "Field names differ significantly across providers",
      "Some accept arrays (multi-language), others only strings",
      "Language code formats vary (ISO 639-1 vs BCP-47 vs custom)"
    ]
  },

  model: {
    label: "Model Selection",
    description: "Choose transcription model/tier",
    patterns: [
      /^model$/i,
      /speech_model/i,
      /operating_point/i
    ],
    notes: [
      "Gladia: `model` (select: solaria-1, accurate, fast)",
      "Deepgram: `model` (nova-2, nova, enhanced, base, whisper)",
      "AssemblyAI: `speech_model` (best, nano)",
      "Speechmatics: `operating_point` (standard, enhanced) - NOT called 'model'",
      "Soniox: Model specified in URL/config (stt-rt-preview, stt-async-preview)",
      "OpenAI: `model` (whisper-1, gpt-4o-transcribe, etc.)"
    ],
    nonEquivalences: [
      "Speechmatics uses `operating_point`, not `model`",
      "Model names are provider-specific and not translatable",
      "Quality/speed tradeoffs differ by provider"
    ]
  },

  translation: {
    label: "Translation",
    description: "Translate transcription to other languages",
    patterns: [
      /^translation$/i,
      /translation_config/i,
      /target_languages/i,
      /target_translation_language/i
    ],
    notes: [
      "Gladia: `translation` (boolean) + `translation_config.target_languages` (array)",
      "Deepgram: Not available via transcription API",
      "AssemblyAI: Not available",
      "Speechmatics: `translation_config` (object)",
      "Soniox: `translation` (object with target_language)",
      "OpenAI: Not available"
    ],
    nonEquivalences: [
      "Not all providers support translation",
      "Gladia supports multiple target languages, Soniox supports one"
    ]
  },

  sentiment: {
    label: "Sentiment Analysis",
    description: "Detect emotional tone in speech",
    patterns: [
      /sentiment/i
    ],
    notes: [
      "Gladia: `sentiment_analysis` (boolean)",
      "AssemblyAI: `sentiment_analysis` (boolean)",
      "Deepgram: `sentiment` (boolean)",
      "Speechmatics: Not available",
      "Soniox: Not available",
      "OpenAI: Not available"
    ],
    nonEquivalences: [
      "Only some providers support sentiment analysis",
      "Output formats differ significantly"
    ]
  },

  entities: {
    label: "Entity Detection (NER)",
    description: "Detect named entities (people, places, organizations)",
    patterns: [
      /entity/i,
      /named_entity/i,
      /detect_entities/i
    ],
    notes: [
      "Gladia: `named_entity_recognition` (boolean)",
      "AssemblyAI: `entity_detection` (boolean)",
      "Deepgram: `detect_entities` (boolean)",
      "Speechmatics: Not available in real-time",
      "Soniox: Not available",
      "OpenAI: Not available"
    ],
    nonEquivalences: [
      "Entity taxonomies differ by provider",
      "Some providers detect more entity types than others"
    ]
  },

  profanity: {
    label: "Profanity Filtering",
    description: "Censor or filter profane language",
    patterns: [
      /profanity/i,
      /filter_profanity/i
    ],
    notes: [
      "Gladia: Not available",
      "Deepgram: `profanity_filter` (boolean)",
      "AssemblyAI: `filter_profanity` (boolean)",
      "Speechmatics: Not available",
      "Soniox: Not available",
      "OpenAI: Not available"
    ],
    nonEquivalences: [
      "Limited provider support",
      "Replacement strategies differ (asterisks vs removal)"
    ]
  },

  redaction: {
    label: "PII Redaction",
    description: "Redact personally identifiable information",
    patterns: [
      /redact/i,
      /pii/i
    ],
    notes: [
      "Deepgram: `redact` (array of PII types)",
      "AssemblyAI: `redact_pii` (boolean) + `redact_pii_policies` (array)",
      "Gladia: Not available for live",
      "Speechmatics: Not available",
      "Soniox: Not available",
      "OpenAI: Not available"
    ],
    nonEquivalences: [
      "PII categories differ by provider",
      "Audio vs text redaction options vary"
    ]
  },

  timestamps: {
    label: "Word Timestamps",
    description: "Get precise timing for each word",
    patterns: [
      /timestamp/i,
      /words$/i,
      /word_timestamps/i
    ],
    notes: [
      "Gladia: `words_accurate_timestamps` (if available)",
      "Deepgram: Always included in response",
      "AssemblyAI: Always included when using streaming",
      "Speechmatics: Always included",
      "Soniox: Always included",
      "OpenAI: `timestamp_granularities` (array: word, segment)"
    ],
    nonEquivalences: [
      "Most providers include by default",
      "OpenAI requires explicit request"
    ]
  },

  callback: {
    label: "Webhook/Callback",
    description: "Send results to a webhook URL",
    patterns: [
      /callback/i,
      /webhook/i
    ],
    notes: [
      "Gladia: `callback` (boolean) + `callback_config` (object)",
      "Deepgram: `callback` (string URL)",
      "AssemblyAI: `webhook_url` (string)",
      "Speechmatics: Callback in job config",
      "Azure: Webhook in transcription properties",
      "Soniox: Not available",
      "OpenAI: Not available"
    ],
    nonEquivalences: [
      "Config structure varies significantly",
      "Auth header support differs"
    ]
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse Field Metadata
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract provider field arrays from the generated field-metadata.ts
 */
function parseFieldMetadata() {
  const content = fs.readFileSync(FIELD_METADATA_PATH, "utf-8")

  const providers = {}
  const providerConfigs = [
    { key: "gladia", patterns: ["GLADIA_TRANSCRIPTION_FIELDS", "GLADIA_STREAMING_FIELDS"] },
    { key: "deepgram", patterns: ["DEEPGRAM_TRANSCRIPTION_FIELDS", "DEEPGRAM_STREAMING_FIELDS"] },
    { key: "assemblyai", patterns: ["ASSEMBLYAI_TRANSCRIPTION_FIELDS", "ASSEMBLYAI_STREAMING_FIELDS"] },
    { key: "speechmatics", patterns: ["SPEECHMATICS_TRANSCRIPTION_FIELDS", "SPEECHMATICS_STREAMING_FIELDS"] },
    { key: "soniox", patterns: ["SONIOX_TRANSCRIPTION_FIELDS", "SONIOX_STREAMING_FIELDS"] },
    { key: "azure", patterns: ["AZURE_TRANSCRIPTION_FIELDS"] },
    { key: "openai", patterns: ["OPENAI_TRANSCRIPTION_FIELDS"] }
  ]

  for (const { key, patterns } of providerConfigs) {
    providers[key] = { transcription: [], streaming: [] }

    for (const pattern of patterns) {
      const regex = new RegExp(`export const ${pattern}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`, "m")
      const match = content.match(regex)

      if (match) {
        // Extract field names from the array
        const fieldNameRegex = /name:\s*"([^"]+)"/g
        let fieldMatch
        const fields = []
        while ((fieldMatch = fieldNameRegex.exec(match[1])) !== null) {
          fields.push(fieldMatch[1])
        }

        if (pattern.includes("STREAMING")) {
          providers[key].streaming = fields
        } else {
          providers[key].transcription = fields
        }
      }
    }
  }

  return providers
}

/**
 * Find fields matching semantic category patterns
 */
function findMatchingFields(fields, patterns) {
  return fields.filter(field =>
    patterns.some(pattern => pattern.test(field))
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate Markdown
// ─────────────────────────────────────────────────────────────────────────────

function generateMarkdown(providers) {
  const lines = []

  lines.push("# Field Equivalences Across Providers")
  lines.push("")
  lines.push("> **AUTO-GENERATED** - Do not edit manually")
  lines.push("> ")
  lines.push("> Regenerate with: `pnpm docs:field-equivalences`")
  lines.push("> ")
  lines.push("> Source: Analyzed from `src/field-metadata.ts`")
  lines.push("")
  lines.push("This document maps semantically similar fields across providers to help you build")
  lines.push("provider translation logic in your application. **The SDK intentionally does NOT")
  lines.push("provide automatic translation** because these mappings are often lossy or")
  lines.push("semantically different.")
  lines.push("")
  lines.push("## Table of Contents")
  lines.push("")

  for (const [category, config] of Object.entries(SEMANTIC_CATEGORIES)) {
    lines.push(`- [${config.label}](#${category})`)
  }
  lines.push("")
  lines.push("---")
  lines.push("")

  for (const [category, config] of Object.entries(SEMANTIC_CATEGORIES)) {
    lines.push(`## ${config.label}`)
    lines.push("")
    lines.push(`> ${config.description}`)
    lines.push("")

    // Build table
    lines.push("| Provider | Transcription Fields | Streaming Fields |")
    lines.push("|----------|---------------------|------------------|")

    for (const [providerKey, providerFields] of Object.entries(providers)) {
      const transcriptionMatches = findMatchingFields(providerFields.transcription, config.patterns)
      const streamingMatches = findMatchingFields(providerFields.streaming, config.patterns)

      const transcriptionCell = transcriptionMatches.length > 0
        ? transcriptionMatches.map(f => `\`${f}\``).join(", ")
        : "—"
      const streamingCell = streamingMatches.length > 0
        ? streamingMatches.map(f => `\`${f}\``).join(", ")
        : "—"

      const providerName = providerKey.charAt(0).toUpperCase() + providerKey.slice(1)
      lines.push(`| ${providerName} | ${transcriptionCell} | ${streamingCell} |`)
    }

    lines.push("")

    // Notes
    if (config.notes && config.notes.length > 0) {
      lines.push("**Provider-specific notes:**")
      lines.push("")
      for (const note of config.notes) {
        lines.push(`- ${note}`)
      }
      lines.push("")
    }

    // Non-equivalences
    if (config.nonEquivalences && config.nonEquivalences.length > 0) {
      lines.push("**Non-equivalences (fields with same intent but different behavior):**")
      lines.push("")
      for (const note of config.nonEquivalences) {
        lines.push(`- ${note}`)
      }
      lines.push("")
    }

    lines.push("---")
    lines.push("")
  }

  // Footer
  lines.push("## Recommendation")
  lines.push("")
  lines.push("Rather than trying to auto-translate configs between providers, we recommend:")
  lines.push("")
  lines.push("1. **Define your own semantic config** in your app:")
  lines.push("   ```typescript")
  lines.push("   interface MyTranscriptionIntent {")
  lines.push("     language: string")
  lines.push("     wantsDiarization: boolean")
  lines.push("     wantsPunctuation: boolean")
  lines.push("   }")
  lines.push("   ```")
  lines.push("")
  lines.push("2. **Map explicitly to each provider** with full type safety:")
  lines.push("   ```typescript")
  lines.push("   function toDeepgram(intent: MyTranscriptionIntent): DeepgramConfig {")
  lines.push("     return {")
  lines.push("       language: intent.language,")
  lines.push("       diarize: intent.wantsDiarization,")
  lines.push("       punctuate: intent.wantsPunctuation")
  lines.push("     }")
  lines.push("   }")
  lines.push("   ```")
  lines.push("")
  lines.push("This approach is explicit, type-safe, and doesn't hide the semantic differences")
  lines.push("between providers.")
  lines.push("")

  return lines.join("\n")
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate TypeScript
// ─────────────────────────────────────────────────────────────────────────────

function generateTypeScript(providers) {
  const lines = []

  lines.push(`/**`)
  lines.push(` * Field Equivalences - Programmatic access to cross-provider field mappings`)
  lines.push(` *`)
  lines.push(` * AUTO-GENERATED - Do not edit manually`)
  lines.push(` * Regenerate with: pnpm docs:field-equivalences`)
  lines.push(` *`)
  lines.push(` * @example`)
  lines.push(` * \`\`\`typescript`)
  lines.push(` * import { FIELD_EQUIVALENCES, getEquivalentField } from 'voice-router-dev/field-equivalences'`)
  lines.push(` *`)
  lines.push(` * // Get diarization field for Deepgram`)
  lines.push(` * const field = FIELD_EQUIVALENCES.diarization.deepgram.transcription[0] // 'diarize'`)
  lines.push(` *`)
  lines.push(` * // Or use the helper`)
  lines.push(` * const field = getEquivalentField('diarization', 'deepgram', 'transcription') // 'diarize'`)
  lines.push(` * \`\`\``)
  lines.push(` *`)
  lines.push(` * @packageDocumentation`)
  lines.push(` */`)
  lines.push(``)

  // Provider type
  lines.push(`/** Supported providers */`)
  lines.push(`export type Provider = ${Object.keys(providers).map(p => `"${p}"`).join(" | ")}`)
  lines.push(``)

  // Category type
  lines.push(`/** Semantic field categories */`)
  lines.push(`export type FieldCategory = ${Object.keys(SEMANTIC_CATEGORIES).map(c => `"${c}"`).join(" | ")}`)
  lines.push(``)

  // Mode type
  lines.push(`/** API mode */`)
  lines.push(`export type ApiMode = "transcription" | "streaming"`)
  lines.push(``)

  // Provider fields interface
  lines.push(`/** Fields for a provider in a category */`)
  lines.push(`export interface ProviderFields {`)
  lines.push(`  transcription: readonly string[]`)
  lines.push(`  streaming: readonly string[]`)
  lines.push(`}`)
  lines.push(``)

  // Category mapping interface
  lines.push(`/** Mapping of providers to their fields for a category */`)
  lines.push(`export type CategoryMapping = {`)
  lines.push(`  [P in Provider]: ProviderFields`)
  lines.push(`}`)
  lines.push(``)

  // Category metadata interface
  lines.push(`/** Metadata for a semantic category */`)
  lines.push(`export interface CategoryMetadata {`)
  lines.push(`  label: string`)
  lines.push(`  description: string`)
  lines.push(`  providers: CategoryMapping`)
  lines.push(`  notes: readonly string[]`)
  lines.push(`  nonEquivalences: readonly string[]`)
  lines.push(`}`)
  lines.push(``)

  // Build the data structure
  lines.push(`/**`)
  lines.push(` * Field equivalences across providers`)
  lines.push(` *`)
  lines.push(` * Maps semantic categories to provider-specific field names.`)
  lines.push(` * Use this to build your own translation logic.`)
  lines.push(` */`)
  lines.push(`export const FIELD_EQUIVALENCES: Record<FieldCategory, CategoryMetadata> = {`)

  for (const [category, config] of Object.entries(SEMANTIC_CATEGORIES)) {
    lines.push(`  ${category}: {`)
    lines.push(`    label: ${JSON.stringify(config.label)},`)
    lines.push(`    description: ${JSON.stringify(config.description)},`)
    lines.push(`    providers: {`)

    for (const [providerKey, providerFields] of Object.entries(providers)) {
      const transcriptionMatches = findMatchingFields(providerFields.transcription, config.patterns)
      const streamingMatches = findMatchingFields(providerFields.streaming, config.patterns)

      lines.push(`      ${providerKey}: {`)
      lines.push(`        transcription: ${JSON.stringify(transcriptionMatches)} as const,`)
      lines.push(`        streaming: ${JSON.stringify(streamingMatches)} as const`)
      lines.push(`      },`)
    }

    lines.push(`    },`)
    lines.push(`    notes: ${JSON.stringify(config.notes || [])} as const,`)
    lines.push(`    nonEquivalences: ${JSON.stringify(config.nonEquivalences || [])} as const`)
    lines.push(`  },`)
  }

  lines.push(`} as const`)
  lines.push(``)

  // Helper function
  lines.push(`/**`)
  lines.push(` * Get the equivalent field name for a provider`)
  lines.push(` *`)
  lines.push(` * @param category - Semantic category (e.g., 'diarization', 'punctuation')`)
  lines.push(` * @param provider - Target provider`)
  lines.push(` * @param mode - API mode ('transcription' or 'streaming')`)
  lines.push(` * @returns First matching field name, or undefined if not supported`)
  lines.push(` *`)
  lines.push(` * @example`)
  lines.push(` * \`\`\`typescript`)
  lines.push(` * getEquivalentField('diarization', 'deepgram', 'transcription') // 'diarize'`)
  lines.push(` * getEquivalentField('diarization', 'gladia', 'transcription')   // 'diarization'`)
  lines.push(` * getEquivalentField('diarization', 'openai', 'transcription')   // undefined`)
  lines.push(` * \`\`\``)
  lines.push(` */`)
  lines.push(`export function getEquivalentField(`)
  lines.push(`  category: FieldCategory,`)
  lines.push(`  provider: Provider,`)
  lines.push(`  mode: ApiMode`)
  lines.push(`): string | undefined {`)
  lines.push(`  const fields = FIELD_EQUIVALENCES[category]?.providers[provider]?.[mode]`)
  lines.push(`  return fields?.[0]`)
  lines.push(`}`)
  lines.push(``)

  // Get all fields for a category
  lines.push(`/**`)
  lines.push(` * Get all equivalent fields for a category`)
  lines.push(` *`)
  lines.push(` * @param category - Semantic category`)
  lines.push(` * @param mode - API mode`)
  lines.push(` * @returns Map of provider to field names`)
  lines.push(` *`)
  lines.push(` * @example`)
  lines.push(` * \`\`\`typescript`)
  lines.push(` * const diarizationFields = getCategoryFields('diarization', 'transcription')`)
  lines.push(` * // { deepgram: ['diarize'], gladia: ['diarization', ...], ... }`)
  lines.push(` * \`\`\``)
  lines.push(` */`)
  lines.push(`export function getCategoryFields(`)
  lines.push(`  category: FieldCategory,`)
  lines.push(`  mode: ApiMode`)
  lines.push(`): Record<Provider, readonly string[]> {`)
  lines.push(`  const result = {} as Record<Provider, readonly string[]>`)
  lines.push(`  const categoryData = FIELD_EQUIVALENCES[category]`)
  lines.push(`  if (!categoryData) return result`)
  lines.push(``)
  lines.push(`  for (const [provider, fields] of Object.entries(categoryData.providers)) {`)
  lines.push(`    result[provider as Provider] = fields[mode]`)
  lines.push(`  }`)
  lines.push(`  return result`)
  lines.push(`}`)
  lines.push(``)

  // Check if provider supports a category
  lines.push(`/**`)
  lines.push(` * Check if a provider supports a semantic category`)
  lines.push(` *`)
  lines.push(` * @param category - Semantic category`)
  lines.push(` * @param provider - Provider to check`)
  lines.push(` * @param mode - API mode`)
  lines.push(` * @returns true if the provider has fields for this category`)
  lines.push(` */`)
  lines.push(`export function supportsCategory(`)
  lines.push(`  category: FieldCategory,`)
  lines.push(`  provider: Provider,`)
  lines.push(`  mode: ApiMode`)
  lines.push(`): boolean {`)
  lines.push(`  const fields = FIELD_EQUIVALENCES[category]?.providers[provider]?.[mode]`)
  lines.push(`  return fields !== undefined && fields.length > 0`)
  lines.push(`}`)
  lines.push(``)

  return lines.join("\n")
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  console.log("Generating field equivalences...")

  // Ensure directories exist
  const docsDir = path.dirname(OUTPUT_MD_PATH)
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true })
  }

  // Parse field metadata
  const providers = parseFieldMetadata()

  // Generate TypeScript
  const typescript = generateTypeScript(providers)
  fs.writeFileSync(OUTPUT_TS_PATH, typescript)
  console.log(`Generated: ${OUTPUT_TS_PATH}`)

  // Generate markdown
  const markdown = generateMarkdown(providers)
  fs.writeFileSync(OUTPUT_MD_PATH, markdown)
  console.log(`Generated: ${OUTPUT_MD_PATH}`)

  // Summary
  let totalFields = 0
  for (const [provider, fields] of Object.entries(providers)) {
    const count = fields.transcription.length + fields.streaming.length
    totalFields += count
    console.log(`  ${provider}: ${count} fields`)
  }
  console.log(`  Total: ${totalFields} fields analyzed`)
  console.log(`  Categories: ${Object.keys(SEMANTIC_CATEGORIES).length}`)
}

main()
