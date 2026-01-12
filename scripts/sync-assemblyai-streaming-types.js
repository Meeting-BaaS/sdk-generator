/**
 * Sync AssemblyAI Streaming Types
 * Parses the local AsyncAPI spec AND SDK TypeScript types to generate complete Zod schemas
 *
 * Sources:
 * - AsyncAPI spec: specs/assemblyai-asyncapi.json (legacy WebSocket API)
 * - SDK types: specs/assemblyai-streaming-sdk.ts (SDK v3 fields from GitHub)
 *
 * The SDK types include fields not in AsyncAPI: keyterms, keytermsPrompt, speechModel, etc.
 * This script merges both sources to provide complete field coverage.
 *
 * @see https://www.assemblyai.com/docs/speech-to-text/streaming
 */

const fs = require("fs")
const path = require("path")

const ASYNCAPI_SPEC = path.join(__dirname, "../specs/assemblyai-asyncapi.json")
const SDK_TYPES = path.join(__dirname, "../specs/assemblyai-streaming-sdk.ts")
const OUTPUT_DIR = path.join(__dirname, "../src/generated/assemblyai")
const STREAMING_ZOD_OUTPUT = path.join(OUTPUT_DIR, "streaming-types.zod.ts")
const STREAMING_TYPES_OUTPUT = path.join(OUTPUT_DIR, "streaming-types.ts")

/**
 * Parse TypeScript type definition and extract fields
 * @param {string} content - TypeScript file content
 * @param {string} typeName - Name of the type to extract (e.g., "StreamingTranscriberParams")
 * @returns {Object} Map of field name to { tsType, optional }
 */
function parseTypeScriptType(content, typeName) {
  const fields = {}

  // Match the type definition block
  const typeRegex = new RegExp(`export type ${typeName}\\s*=\\s*\\{([^}]+)\\}`, "s")
  const match = content.match(typeRegex)
  if (!match) return fields

  const body = match[1]

  // Match each field: fieldName?: Type or fieldName: Type
  const fieldRegex = /(\w+)(\?)?:\s*([^;\n]+)/g
  let fieldMatch
  while ((fieldMatch = fieldRegex.exec(body)) !== null) {
    const [, name, optional, tsType] = fieldMatch
    fields[name] = {
      tsType: tsType.trim(),
      optional: !!optional
    }
  }

  return fields
}

/**
 * Convert TypeScript type to Zod schema string
 */
function tsTypeToZod(tsType, optional = false) {
  let zodType

  // Handle union types with literals (e.g., "universal-streaming-english" | "universal-streaming-multilingual")
  if (tsType.includes("|") && tsType.includes('"')) {
    const literals = tsType.match(/"[^"]+"/g)
    if (literals) {
      zodType = `zod.enum([${literals.join(", ")}])`
    } else {
      zodType = "zod.string()"
    }
  }
  // Handle string[]
  else if (tsType === "string[]") {
    zodType = "zod.array(zod.string())"
  }
  // Handle number
  else if (tsType === "number") {
    zodType = "zod.number()"
  }
  // Handle boolean
  else if (tsType === "boolean") {
    zodType = "zod.boolean()"
  }
  // Handle string
  else if (tsType === "string") {
    zodType = "zod.string()"
  }
  // Handle specific known types
  else if (tsType === "AudioEncoding") {
    zodType = 'zod.enum(["pcm_s16le", "pcm_mulaw"])'
  } else if (tsType === "StreamingSpeechModel") {
    zodType = 'zod.enum(["universal-streaming-english", "universal-streaming-multilingual"])'
  }
  // Default fallback
  else {
    zodType = "zod.unknown()"
  }

  if (optional) {
    zodType += ".optional()"
  }

  return zodType
}

/**
 * Convert JSON Schema type to Zod type string
 */
function jsonSchemaToZod(schema, refs = {}) {
  if (!schema) return "zod.unknown()"

  // Handle $ref
  if (schema.$ref) {
    const refName = schema.$ref.split("/").pop()
    if (refs[refName]) {
      return refs[refName]
    }
    return `zod.unknown() /* TODO: resolve ${refName} */`
  }

  // Handle enum
  if (schema.enum) {
    const values = schema.enum.map((v) => JSON.stringify(v)).join(", ")
    return `zod.enum([${values}])`
  }

  // Handle type
  switch (schema.type) {
    case "string":
      return "zod.string()"
    case "number":
    case "integer":
      let numType = "zod.number()"
      if (schema.minimum !== undefined) numType += `.min(${schema.minimum})`
      if (schema.maximum !== undefined) numType += `.max(${schema.maximum})`
      return numType
    case "boolean":
      return "zod.boolean()"
    case "array":
      const itemType = schema.items ? jsonSchemaToZod(schema.items, refs) : "zod.unknown()"
      return `zod.array(${itemType})`
    default:
      return "zod.unknown()"
  }
}

/**
 * Generate Zod schema from AsyncAPI spec
 */
function generateZodFromAsyncAPI(specPath) {
  const specContent = fs.readFileSync(specPath, "utf-8")
  const spec = JSON.parse(specContent)

  const schemas = spec.components?.schemas || {}
  const info = spec.info || {}

  // Get WebSocket query params (connection params)
  const wsChannel = spec.channels?.["/v2/realtime/ws"]
  const queryParams = wsChannel?.bindings?.ws?.query?.properties || {}
  const requiredParams = wsChannel?.bindings?.ws?.query?.required || []

  // Build refs map for common schemas
  const refs = {}
  if (schemas.AudioEncoding?.enum) {
    refs.AudioEncoding = `zod.enum([${schemas.AudioEncoding.enum.map((v) => JSON.stringify(v)).join(", ")}])`
  }

  // Generate streaming transcriber params from query bindings
  const streamingParams = []
  const addedKeys = new Set()

  for (const [key, prop] of Object.entries(queryParams)) {
    // Skip auth-related params
    if (key === "Authorization" || key === "token") continue

    let zodType = jsonSchemaToZod(prop, refs)
    const isRequired = requiredParams.includes(key)
    if (!isRequired) zodType += ".optional()"

    const desc = prop.description
      ? `.describe(${JSON.stringify(prop.description.replace(/\n/g, " ").trim())})`
      : ""

    // Convert snake_case to camelCase for JS conventions
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    streamingParams.push(`  ${camelKey}: ${zodType}${desc}`)
    addedKeys.add(camelKey)
  }

  // Add SDK v3 fields from streaming-types.ts (not present in AsyncAPI spec)
  if (fs.existsSync(SDK_TYPES)) {
    const sdkContent = fs.readFileSync(SDK_TYPES, "utf-8")
    const sdkFields = parseTypeScriptType(sdkContent, "StreamingTranscriberParams")

    for (const [key, field] of Object.entries(sdkFields)) {
      // Skip fields already added from AsyncAPI, and skip internal fields
      if (addedKeys.has(key)) continue
      if (["websocketBaseUrl", "apiKey", "token"].includes(key)) continue

      const zodType = tsTypeToZod(field.tsType, field.optional)
      streamingParams.push(`  ${key}: ${zodType}.describe("From SDK v3")`)
    }
  }

  // Generate mid-session update params from ConfigureEndUtteranceSilenceThreshold
  const updateParams = []
  const updateAddedKeys = new Set()
  const configSchema = schemas.ConfigureEndUtteranceSilenceThreshold
  if (configSchema?.properties) {
    for (const [key, prop] of Object.entries(configSchema.properties)) {
      let zodType = jsonSchemaToZod(prop, refs)
      zodType += ".optional()"

      const desc = prop.description
        ? `.describe(${JSON.stringify(prop.description.replace(/\n/g, " ").trim())})`
        : ""

      updateParams.push(`  ${key}: ${zodType}${desc}`)
      updateAddedKeys.add(key)
    }
  }

  // Add SDK v3 update config fields from streaming-types.ts
  if (fs.existsSync(SDK_TYPES)) {
    const sdkContent = fs.readFileSync(SDK_TYPES, "utf-8")
    const sdkUpdateFields = parseTypeScriptType(sdkContent, "StreamingUpdateConfiguration")

    for (const [key, field] of Object.entries(sdkUpdateFields)) {
      // Skip 'type' field and already added fields
      if (key === "type") continue
      if (updateAddedKeys.has(key)) continue

      const zodType = tsTypeToZod(field.tsType, field.optional)
      updateParams.push(`  ${key}: ${zodType}.describe("From SDK v3")`)
    }
  }

  return `/**
 * AssemblyAI Streaming Zod Schemas
 * AUTO-GENERATED from AsyncAPI spec + SDK types - DO NOT EDIT MANUALLY
 *
 * Sources merged:
 * - AsyncAPI: ${ASYNCAPI_SPEC.replace(process.cwd() + "/", "")} (legacy WebSocket API)
 * - SDK types: ${SDK_TYPES.replace(process.cwd() + "/", "")} (v3 streaming fields)
 *
 * @source ${ASYNCAPI_SPEC.replace(process.cwd() + "/", "")}
 * @version ${info.version || "unknown"}
 * @see https://www.assemblyai.com/docs/speech-to-text/streaming
 *
 * Regenerate with: pnpm openapi:sync-assemblyai-streaming
 */

import { z as zod } from "zod"

/**
 * AssemblyAI audio encoding formats
 * @source AudioEncoding from AsyncAPI spec
 */
export const assemblyaiAudioEncodingSchema = ${refs.AudioEncoding || 'zod.enum(["pcm_s16le", "pcm_mulaw"])'}

/**
 * AssemblyAI streaming transcriber params
 * @source WebSocket query bindings from AsyncAPI spec
 */
export const streamingTranscriberParams = zod.object({
${streamingParams.join(",\n")}
})

/**
 * AssemblyAI streaming update config params
 * For mid-session updates via ConfigureEndUtteranceSilenceThreshold message
 * @source ConfigureEndUtteranceSilenceThreshold schema from AsyncAPI spec
 */
export const streamingUpdateConfigParams = zod.object({
${updateParams.join(",\n")}
})
`
}

/**
 * Copy the TypeScript types file from specs/ to generated/
 * This file contains all the streaming types used by adapters and constants
 */
function copyTypeScriptTypes() {
  const srcPath = path.join(__dirname, "../specs/assemblyai-streaming-types.ts")
  if (!fs.existsSync(srcPath)) {
    console.warn(`  ⚠️  ${srcPath} not found, skipping TypeScript types`)
    return false
  }
  const content = fs.readFileSync(srcPath, "utf-8")
  fs.writeFileSync(STREAMING_TYPES_OUTPUT, content)
  return true
}

async function main() {
  try {
    console.log("📥 Generating AssemblyAI streaming types from AsyncAPI spec...")

    // Check if spec exists
    if (!fs.existsSync(ASYNCAPI_SPEC)) {
      console.error(`❌ AsyncAPI spec not found at ${ASYNCAPI_SPEC}`)
      console.log("   Run 'pnpm openapi:sync --provider assemblyaiAsync' first")
      process.exit(1)
    }

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    }

    // Generate Zod schema from AsyncAPI spec
    console.log(`  → Parsing ${path.relative(process.cwd(), ASYNCAPI_SPEC)}...`)
    const zodContent = generateZodFromAsyncAPI(ASYNCAPI_SPEC)

    fs.writeFileSync(STREAMING_ZOD_OUTPUT, zodContent)
    console.log(`  ✅ Generated ${path.relative(process.cwd(), STREAMING_ZOD_OUTPUT)}`)

    // Copy TypeScript types file from specs/ for adapters and constants.ts
    if (copyTypeScriptTypes()) {
      console.log(`  ✅ Copied ${path.relative(process.cwd(), STREAMING_TYPES_OUTPUT)} from specs/`)
    }

    console.log("✅ Successfully generated AssemblyAI streaming types!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Failed to generate AssemblyAI streaming types:", error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()
