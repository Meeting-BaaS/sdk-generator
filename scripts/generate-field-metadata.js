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

const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const OUTPUT_FILE = path.join(__dirname, "../src/field-metadata.ts")

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
    if (value.every(v => typeof v === "string" || typeof v === "number")) {
      const items = value.map(v => JSON.stringify(v)).join(", ")
      if (items.length < 80) return `[${items}]`
    }
    const spaces = " ".repeat(indent)
    const items = value.map(v => `${spaces}  ${serializeValue(v, indent + 2)}`).join(",\n")
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
 */
function generateFieldArray(name, fields, docComment) {
  // Serialize fields without nestedFields for now (keep it lightweight)
  const simplifiedFields = fields.map(f => {
    const simplified = {
      name: f.name,
      type: f.type,
      required: f.required,
    }
    if (f.description) simplified.description = f.description
    if (f.default !== undefined) simplified.default = f.default
    if (f.options?.length) simplified.options = f.options
    if (f.min !== undefined) simplified.min = f.min
    if (f.max !== undefined) simplified.max = f.max
    if (f.inputFormat) simplified.inputFormat = f.inputFormat
    // Skip nestedFields for lightweight output
    return simplified
  })

  const serialized = simplifiedFields.map(f => `  ${serializeValue(f, 2).trim()}`).join(",\n")

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

  // We need to compile and run the field-configs to extract the data
  // Use ts-node to execute TypeScript directly
  const extractScript = `
    const {
      getGladiaFieldConfigs,
      getDeepgramFieldConfigs,
      getAssemblyAIFieldConfigs,
      getOpenAIFieldConfigs,
      getAzureFieldConfigs,
      getSpeechmaticsFieldConfigs,
      getSonioxFieldConfigs
    } = require("./src/field-configs.ts")

    const configs = {
      gladia: getGladiaFieldConfigs(),
      deepgram: getDeepgramFieldConfigs(),
      assemblyai: getAssemblyAIFieldConfigs(),
      openai: getOpenAIFieldConfigs(),
      azure: getAzureFieldConfigs(),
      speechmatics: getSpeechmaticsFieldConfigs(),
      soniox: getSonioxFieldConfigs()
    }

    console.log(JSON.stringify(configs))
  `

  // Run with ts-node to get the field configs
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
    // Fallback: try to parse field-configs.ts directly and build manually
    console.log("  → Falling back to manual extraction...")

    // Alternative: require the built JS if available
    try {
      const distPath = path.join(__dirname, "../dist/field-configs.js")
      if (fs.existsSync(distPath)) {
        const {
          getGladiaFieldConfigs,
          getDeepgramFieldConfigs,
          getAssemblyAIFieldConfigs,
          getOpenAIFieldConfigs,
          getAzureFieldConfigs,
          getSpeechmaticsFieldConfigs,
          getSonioxFieldConfigs
        } = require(distPath)

        configs = {
          gladia: getGladiaFieldConfigs(),
          deepgram: getDeepgramFieldConfigs(),
          assemblyai: getAssemblyAIFieldConfigs(),
          openai: getOpenAIFieldConfigs(),
          azure: getAzureFieldConfigs(),
          speechmatics: getSpeechmaticsFieldConfigs(),
          soniox: getSonioxFieldConfigs()
        }
      } else {
        throw new Error("dist/field-configs.js not found. Run 'pnpm build:quick' first.")
      }
    } catch (fallbackError) {
      console.error("❌ Fallback also failed:", fallbackError.message)
      process.exit(1)
    }
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
}

`

  // Generate for each provider
  const providers = [
    { key: "gladia", name: "Gladia", config: configs.gladia },
    { key: "deepgram", name: "Deepgram", config: configs.deepgram },
    { key: "assemblyai", name: "AssemblyAI", config: configs.assemblyai },
    { key: "openai", name: "OpenAI", config: configs.openai },
    { key: "azure", name: "Azure", config: configs.azure },
    { key: "speechmatics", name: "Speechmatics", config: configs.speechmatics },
    { key: "soniox", name: "Soniox", config: configs.soniox },
  ]

  for (const { key, name, config } of providers) {
    const upperKey = key.toUpperCase()
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
        `/** ${name} transcription field metadata (${config.transcription.length} fields) */`
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
        `/** ${name} streaming field metadata (${config.streaming.length} fields) */`
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
        `/** ${name} streaming update field metadata (${config.streamingUpdate.length} fields) */`
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
        `/** ${name} list filter field metadata (${config.listFilters.length} fields) */`
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

  for (const { key, config } of providers) {
    const upperKey = key.toUpperCase()
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

    output += `  ${key}: {\n${props.join(",\n")},\n  },\n`
  }

  output += `} as const

export type FieldMetadataProvider = keyof typeof PROVIDER_FIELDS
`

  // Write output
  fs.writeFileSync(OUTPUT_FILE, output)

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

main().catch(err => {
  console.error("❌ Error:", err.message)
  process.exit(1)
})
