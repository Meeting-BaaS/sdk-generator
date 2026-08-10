#!/usr/bin/env node
/**
 * Generate Field Metadata from Zod Schemas
 *
 * This script extracts field metadata from Zod schemas at build time
 * and generates lightweight static TypeScript files with no Zod dependency.
 *
 * Consumers can import from 'voice-router-dev/field-metadata' (~5KB)
 * instead of 'voice-router-dev/field-configs' (2.8MB+ types).
 *
 * Regenerate with: pnpm openapi:generate-field-metadata
 */

const fs = require("node:fs")
const path = require("node:path")
const { execSync } = require("node:child_process")

const OUTPUT_FILE = path.join(__dirname, "../src/field-metadata.ts")

/**
 * Language field detection and auto-population config
 *
 * Maps provider keys to their language field names and generated constant names.
 * This enables auto-setting type: 'select' and populating options from generated constants.
 */
const LANGUAGE_FIELD_CONFIG = {
  gladia: {
    fieldNames: ["language"],
    sourcePath: "src/generated/gladia/schema/transcriptionLanguageCodeEnum.ts",
    sourceExportName: "TranscriptionLanguageCodeEnum"
  },
  assemblyai: {
    fieldNames: ["language_code"],
    sourcePath: "src/generated/assemblyai/schema/transcriptLanguageCode.ts",
    sourceExportName: "TranscriptLanguageCode"
  },
  deepgram: {
    fieldNames: ["language"],
    sourcePath: "src/generated/deepgram/languages.ts",
    sourceExportName: "DeepgramLanguageCodes"
  },
  speechmatics: {
    fieldNames: ["language"],
    sourcePath: "src/generated/speechmatics/languages.ts",
    sourceExportName: "SpeechmaticsLanguageCodes"
  },
  soniox: {
    fieldNames: ["language_hints", "languageHints"],
    sourcePath: "src/generated/soniox/languages.ts",
    sourceExportName: "SonioxLanguageCodes"
  },
  "azure-stt": {
    fieldNames: ["locale", "defaultLanguage"],
    sourcePath: "src/generated/azure/locales.ts",
    sourceExportName: "AzureLocaleCodes"
  },
  "openai-whisper": {
    fieldNames: ["language"],
    sourcePath: "src/constants.ts", // OpenAI uses manual constants
    sourceExportName: "OpenAILanguageCodes"
  },
  elevenlabs: {
    fieldNames: ["language_code"],
    sourcePath: "src/generated/elevenlabs/languages.ts",
    sourceExportName: "ElevenLabsLanguageCodes"
  }
}

/**
 * Extract the initializer for a named exported const from a TypeScript source file.
 */
function extractConstInitializer(source, exportName) {
  const marker = `export const ${exportName} =`
  const markerIndex = source.indexOf(marker)
  if (markerIndex === -1) {
    throw new Error(`export const ${exportName} not found`)
  }

  let index = markerIndex + marker.length
  while (/\s/.test(source[index])) index += 1

  const open = source[index]
  const close = open === "[" ? "]" : open === "{" ? "}" : null
  if (!close) {
    throw new Error(`export const ${exportName} initializer is not an array or object`)
  }

  let depth = 0
  let quote = null
  let escaped = false

  for (let i = index; i < source.length; i += 1) {
    const char = source[i]

    if (quote) {
      if (escaped) {
        escaped = false
      } else if (char === "\\") {
        escaped = true
      } else if (char === quote) {
        quote = null
      }
      continue
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char
      continue
    }

    if (char === open) {
      depth += 1
    } else if (char === close) {
      depth -= 1
      if (depth === 0) {
        return source.slice(index, i + 1)
      }
    }
  }

  throw new Error(`export const ${exportName} initializer was not closed`)
}

/**
 * Load string values from a source TypeScript const array or object.
 *
 * This intentionally reads source files rather than dist/*.js so API-derived
 * metadata generation never depends on stale build output.
 */
function loadStringValuesFromSource(config) {
  const sourcePath = path.join(__dirname, "..", config.sourcePath)
  const source = fs.readFileSync(sourcePath, "utf-8")
  const initializer = extractConstInitializer(source, config.sourceExportName)

  if (initializer.startsWith("[")) {
    return [...initializer.matchAll(/["']([^"']+)["']/g)].map(([, value]) => value)
  }

  return [...initializer.matchAll(/:\s*["']([^"']+)["']/g)].map(([, value]) => value)
}

/**
 * Load language codes from source TypeScript files.
 */
function loadLanguageCodes() {
  const languageCodes = {}

  for (const [provider, config] of Object.entries(LANGUAGE_FIELD_CONFIG)) {
    try {
      languageCodes[provider] = loadStringValuesFromSource(config)
      console.log(`  → Loaded ${languageCodes[provider].length} language codes for ${provider}`)
    } catch (err) {
      console.log(`  ⚠ Could not load language codes for ${provider}: ${err.message}`)
    }
  }

  return languageCodes
}

// Field type definition for reference (matches ZodFieldConfig)
const FIELD_TYPE_UNION = `"string" | "number" | "boolean" | "select" | "multiselect" | "array" | "object"`

/**
 * Serialize a value for TypeScript code
 */
function serializeValue(value, indent = 2) {
  if (value === undefined) return "undefined"
  if (value === null) return "null"
  if (typeof value === "string") return JSON.stringify(value)
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]"
    // For simple arrays (strings/numbers), keep inline
    if (value.every((v) => typeof v === "string" || typeof v === "number")) {
      const items = value.map((v) => JSON.stringify(v)).join(", ")
      if (items.length < 80) return `[${items}]`
    }
    const spaces = " ".repeat(indent)
    const items = value.map((v) => `${spaces}  ${serializeValue(v, indent + 2)}`).join(",\n")
    return `[\n${items}\n${spaces}]`
  }
  if (typeof value === "object") {
    const spaces = " ".repeat(indent)
    const entries = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${spaces}  ${k}: ${serializeValue(v, indent + 2)}`)
      .join(",\n")
    return `{\n${entries}\n${spaces}}`
  }
  return JSON.stringify(value)
}

/**
 * Generate TypeScript code for a field config array
 *
 * @param {string} name - Export name for the constant
 * @param {Array} fields - Field configs from Zod extraction
 * @param {string} docComment - JSDoc comment
 * @param {string} providerKey - Provider key (e.g., 'gladia', 'deepgram')
 * @param {Object} languageCodes - Map of provider -> language code arrays
 */
function generateFieldArray(name, fields, docComment, providerKey = null, languageCodes = {}) {
  const providerConfig = providerKey ? LANGUAGE_FIELD_CONFIG[providerKey] : null
  const providerLanguageCodes = providerKey ? languageCodes[providerKey] : null

  // Serialize fields without nestedFields for now (keep it lightweight)
  const simplifiedFields = fields.map((f) => {
    const simplified = {
      name: f.name,
      type: f.type,
      required: f.required
    }
    if (f.description) simplified.description = f.description
    if (f.default !== undefined) simplified.default = f.default
    if (f.options?.length) simplified.options = f.options
    if (f.min !== undefined) simplified.min = f.min
    if (f.max !== undefined) simplified.max = f.max
    if (f.inputFormat) simplified.inputFormat = f.inputFormat

    // Auto-populate language field options
    if (providerConfig && providerLanguageCodes?.length) {
      const isLanguageField = providerConfig.fieldNames.includes(f.name)
      if (isLanguageField) {
        // Array fields (like language_hints) become multiselect
        if (f.type === "array") {
          simplified.type = "multiselect"
        } else {
          simplified.type = "select"
        }
        simplified.options = providerLanguageCodes
      }
    }

    // Include nestedFields for object types (recursive structure)
    if (f.nestedFields?.length) {
      simplified.nestedFields = f.nestedFields.map((nf) => {
        const nestedSimplified = {
          name: nf.name,
          type: nf.type,
          required: nf.required
        }
        if (nf.description) nestedSimplified.description = nf.description
        if (nf.default !== undefined) nestedSimplified.default = nf.default
        if (nf.options?.length) nestedSimplified.options = nf.options
        if (nf.min !== undefined) nestedSimplified.min = nf.min
        if (nf.max !== undefined) nestedSimplified.max = nf.max
        if (nf.inputFormat) nestedSimplified.inputFormat = nf.inputFormat
        // Recursively include deeply nested fields
        if (nf.nestedFields?.length) nestedSimplified.nestedFields = nf.nestedFields
        return nestedSimplified
      })
    }
    return simplified
  })

  const serialized = simplifiedFields.map((f) => `  ${serializeValue(f, 2).trim()}`).join(",\n")

  return `${docComment}
export const ${name} = [
${serialized}
] as const
`
}

/**
 * Generate field name union type from array
 */
function generateFieldNameType(typeName, arrayName) {
  return `/** Field names for ${typeName.replace("FieldName", "")} */
export type ${typeName} = (typeof ${arrayName})[number]["name"]
`
}

async function main() {
  console.log("📦 Generating lightweight field metadata from Zod schemas...")

  // Load language codes for auto-populating language fields
  console.log("  → Loading auto-generated language codes...")
  const languageCodes = loadLanguageCodes()

  // We need to compile and run the source field-configs to extract current data.
  const extractScript = `
    const {
      getGladiaFieldConfigs,
      getDeepgramFieldConfigs,
      getAssemblyAIFieldConfigs,
      getOpenAIFieldConfigs,
      getAzureFieldConfigs,
      getElevenLabsFieldConfigs,
      getSpeechmaticsFieldConfigs,
      getSonioxFieldConfigs
    } = require("./src/field-configs.ts")

    const configs = {
      gladia: getGladiaFieldConfigs(),
      deepgram: getDeepgramFieldConfigs(),
      assemblyai: getAssemblyAIFieldConfigs(),
      "openai-whisper": getOpenAIFieldConfigs(),
      "azure-stt": getAzureFieldConfigs(),
      elevenlabs: getElevenLabsFieldConfigs(),
      speechmatics: getSpeechmaticsFieldConfigs(),
      soniox: getSonioxFieldConfigs()
    }

    console.log(JSON.stringify(configs))
  `

  // Run with ts-node so metadata is derived from the current TypeScript source.
  console.log("  → Extracting field metadata from Zod schemas...")
  let configs
  try {
    const result = execSync(
      `npx ts-node --transpile-only -e '${extractScript.replace(/'/g, "\\'")}'`,
      {
        cwd: path.join(__dirname, ".."),
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"]
      }
    )
    configs = JSON.parse(result)
  } catch (error) {
    console.error("❌ Failed to extract field configs:", error.message)
    console.error("❌ Field metadata must be generated from src/field-configs.ts, not dist output.")
    process.exit(1)
  }

  console.log("  ✓ Extracted field metadata for all providers")

  // Generate TypeScript output
  console.log("  → Generating src/field-metadata.ts...")

  let output = `/**
 * Lightweight Field Metadata - Pre-computed from Zod schemas
 *
 * AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Regenerate with: pnpm openapi:generate-field-metadata
 *
 * This module provides field metadata without the heavy Zod schema types.
 * Use this for UI rendering, form generation, and field introspection
 * when you don't need runtime Zod validation.
 *
 * Import: \`import { GLADIA_FIELDS, GladiaTranscriptionFieldName } from 'voice-router-dev/field-metadata'\`
 *
 * For full Zod schemas with runtime validation, use 'voice-router-dev/field-configs' instead.
 *
 * @packageDocumentation
 */

/**
 * Field type for UI rendering
 */
export type FieldType = ${FIELD_TYPE_UNION}

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

`

  // Generate for each provider
  const providers = [
    { key: "gladia", name: "Gladia", prefix: "GLADIA", config: configs.gladia },
    { key: "deepgram", name: "Deepgram", prefix: "DEEPGRAM", config: configs.deepgram },
    { key: "assemblyai", name: "AssemblyAI", prefix: "ASSEMBLYAI", config: configs.assemblyai },
    { key: "openai-whisper", name: "OpenAI", prefix: "OPENAI", config: configs["openai-whisper"] },
    { key: "azure-stt", name: "Azure", prefix: "AZURE", config: configs["azure-stt"] },
    { key: "elevenlabs", name: "ElevenLabs", prefix: "ELEVENLABS", config: configs.elevenlabs },
    {
      key: "speechmatics",
      name: "Speechmatics",
      prefix: "SPEECHMATICS",
      config: configs.speechmatics
    },
    { key: "soniox", name: "Soniox", prefix: "SONIOX", config: configs.soniox }
  ]

  for (const { key, name, prefix, config } of providers) {
    const upperKey = prefix
    const pascalName = name.replace(/[^a-zA-Z]/g, "")

    output += `// ─────────────────────────────────────────────────────────────────────────────
// ${name}
// ─────────────────────────────────────────────────────────────────────────────

`

    // Transcription fields
    if (config.transcription?.length) {
      const arrayName = `${upperKey}_TRANSCRIPTION_FIELDS`
      output += generateFieldArray(
        arrayName,
        config.transcription,
        `/** ${name} transcription field metadata (${config.transcription.length} fields) */`,
        key,
        languageCodes
      )
      output += generateFieldNameType(`${pascalName}TranscriptionFieldName`, arrayName)
      output += "\n"
    }

    // Streaming fields
    if (config.streaming?.length) {
      const arrayName = `${upperKey}_STREAMING_FIELDS`
      output += generateFieldArray(
        arrayName,
        config.streaming,
        `/** ${name} streaming field metadata (${config.streaming.length} fields) */`,
        key,
        languageCodes
      )
      output += generateFieldNameType(`${pascalName}StreamingFieldName`, arrayName)
      output += "\n"
    }

    // Streaming update fields
    if (config.streamingUpdate?.length) {
      const arrayName = `${upperKey}_STREAMING_UPDATE_FIELDS`
      output += generateFieldArray(
        arrayName,
        config.streamingUpdate,
        `/** ${name} streaming update field metadata (${config.streamingUpdate.length} fields) */`,
        key,
        languageCodes
      )
      output += generateFieldNameType(`${pascalName}StreamingUpdateFieldName`, arrayName)
      output += "\n"
    }

    // List filter fields
    if (config.listFilters?.length) {
      const arrayName = `${upperKey}_LIST_FILTER_FIELDS`
      output += generateFieldArray(
        arrayName,
        config.listFilters,
        `/** ${name} list filter field metadata (${config.listFilters.length} fields) */`,
        key,
        languageCodes
      )
      output += generateFieldNameType(`${pascalName}ListFilterFieldName`, arrayName)
      output += "\n"
    }
  }

  // Add convenience exports - dynamically build based on what fields exist
  output += `// ─────────────────────────────────────────────────────────────────────────────
// Convenience exports
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All providers with their field metadata
 */
export const PROVIDER_FIELDS = {
`

  for (const { key, prefix, config } of providers) {
    const upperKey = prefix
    const props = []

    if (config.transcription?.length) {
      props.push(`    transcription: ${upperKey}_TRANSCRIPTION_FIELDS`)
    }
    if (config.streaming?.length) {
      props.push(`    streaming: ${upperKey}_STREAMING_FIELDS`)
    }
    if (config.streamingUpdate?.length) {
      props.push(`    streamingUpdate: ${upperKey}_STREAMING_UPDATE_FIELDS`)
    }
    if (config.listFilters?.length) {
      props.push(`    listFilters: ${upperKey}_LIST_FILTER_FIELDS`)
    }

    output += `  ${JSON.stringify(key)}: {\n${props.join(",\n")},\n  },\n`
  }

  output += `} as const

export type FieldMetadataProvider = keyof typeof PROVIDER_FIELDS
`

  // Write output
  fs.writeFileSync(OUTPUT_FILE, output)
  try {
    execSync("pnpm exec biome format --write src/field-metadata.ts", {
      cwd: path.join(__dirname, ".."),
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"]
    })
    console.log("  → Formatted field metadata with Biome")
  } catch (formatError) {
    console.error(`  ✗ Could not format field metadata: ${formatError.message}`)
    console.error(
      "  Biome is required for deterministic generated output (the freshness gate compares bytes)."
    )
    console.error("  Run inside the dev shell (direnv) so `biome` is on PATH.")
    process.exit(1)
  }

  // Count fields for summary
  let totalFields = 0
  for (const { config } of providers) {
    totalFields += config.transcription?.length || 0
    totalFields += config.streaming?.length || 0
    totalFields += config.streamingUpdate?.length || 0
    totalFields += config.listFilters?.length || 0
  }

  console.log(`  ✅ Generated ${OUTPUT_FILE}`)
  console.log(`     → ${providers.length} providers, ${totalFields} total fields`)
  console.log("✅ Field metadata generation complete!")
}

main().catch((err) => {
  console.error("❌ Error:", err.message)
  process.exit(1)
})
