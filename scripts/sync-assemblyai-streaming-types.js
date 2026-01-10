/**
 * Sync AssemblyAI Streaming Types
 * Parses the local AsyncAPI spec and generates Zod schemas dynamically
 * @see specs/assemblyai-asyncapi.json
 */

const fs = require("fs")
const path = require("path")

const ASYNCAPI_SPEC = path.join(__dirname, "../specs/assemblyai-asyncapi.json")
const OUTPUT_DIR = path.join(__dirname, "../src/generated/assemblyai")
const STREAMING_ZOD_OUTPUT = path.join(OUTPUT_DIR, "streaming-types.zod.ts")

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
  }

  // Generate mid-session update params from ConfigureEndUtteranceSilenceThreshold
  const updateParams = []
  const configSchema = schemas.ConfigureEndUtteranceSilenceThreshold
  if (configSchema?.properties) {
    for (const [key, prop] of Object.entries(configSchema.properties)) {
      let zodType = jsonSchemaToZod(prop, refs)
      zodType += ".optional()"

      const desc = prop.description
        ? `.describe(${JSON.stringify(prop.description.replace(/\n/g, " ").trim())})`
        : ""

      updateParams.push(`  ${key}: ${zodType}${desc}`)
    }
  }

  return `/**
 * AssemblyAI Streaming Zod Schemas
 * AUTO-GENERATED from AsyncAPI spec - DO NOT EDIT MANUALLY
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

    console.log("✅ Successfully generated AssemblyAI streaming types!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Failed to generate AssemblyAI streaming types:", error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()
