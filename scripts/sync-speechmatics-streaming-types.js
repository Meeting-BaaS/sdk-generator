/**
 * Sync Speechmatics Streaming Types
 * Parses the AsyncAPI spec and generates Zod schemas dynamically
 * @see https://github.com/speechmatics/speechmatics-js-sdk/tree/main/packages/real-time-client
 */

const fs = require("fs")
const path = require("path")
const yaml = require("js-yaml")

const ASYNCAPI_SPEC = path.join(__dirname, "../specs/speechmatics-asyncapi.yml")
const OUTPUT_DIR = path.join(__dirname, "../src/generated/speechmatics")
const STREAMING_ZOD_OUTPUT = path.join(OUTPUT_DIR, "streaming-types.zod.ts")

/**
 * Convert JSON Schema type to Zod type string
 */
function jsonSchemaToZod(schema, indent = "  ", refs = {}) {
  if (!schema) return "zod.unknown()"

  // Handle $ref
  if (schema.$ref) {
    const refName = schema.$ref.split("/").pop()
    if (refs[refName]) {
      return refs[refName]
    }
    return `zod.unknown() /* TODO: resolve ${refName} */`
  }

  // Handle const
  if (schema.const !== undefined) {
    return `zod.literal(${JSON.stringify(schema.const)})`
  }

  // Handle enum
  if (schema.enum) {
    const values = schema.enum.map((v) => JSON.stringify(v)).join(", ")
    return `zod.enum([${values}])`
  }

  // Handle oneOf
  if (schema.oneOf) {
    const options = schema.oneOf.map((s) => jsonSchemaToZod(s, indent, refs))
    return `zod.union([${options.join(", ")}])`
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
      const itemType = schema.items ? jsonSchemaToZod(schema.items, indent, refs) : "zod.unknown()"
      return `zod.array(${itemType})`
    case "object":
      if (!schema.properties) return "zod.object({})"
      const props = Object.entries(schema.properties)
        .map(([key, propSchema]) => {
          const isRequired = schema.required?.includes(key)
          let zodType = jsonSchemaToZod(propSchema, indent + "  ", refs)
          if (!isRequired) zodType += ".optional()"
          const desc = propSchema.description
            ? `.describe(${JSON.stringify(propSchema.description.replace(/\n/g, " ").trim())})`
            : ""
          return `${indent}  ${key}: ${zodType}${desc}`
        })
        .join(",\n")
      return `zod.object({\n${props}\n${indent}})`
    default:
      return "zod.unknown()"
  }
}

/**
 * Extract and flatten streaming params from AsyncAPI schemas
 */
function extractStreamingParams(schemas) {
  const result = {
    audioFormat: {},
    transcriptionConfig: {},
    midSessionConfig: {}
  }

  // Extract Raw audio format
  if (schemas.AudioFormatRaw?.properties) {
    const raw = schemas.AudioFormatRaw.properties
    if (raw.encoding) result.audioFormat.encoding = { ...raw.encoding, $ref: raw.encoding.$ref }
    if (raw.sample_rate) result.audioFormat.sample_rate = raw.sample_rate
  }

  // Extract TranscriptionConfig
  if (schemas.TranscriptionConfig?.properties) {
    result.transcriptionConfig = { ...schemas.TranscriptionConfig.properties }
  }

  // Extract MidSessionTranscriptionConfig
  if (schemas.MidSessionTranscriptionConfig?.properties) {
    result.midSessionConfig = { ...schemas.MidSessionTranscriptionConfig.properties }
  }

  return result
}

/**
 * Generate Zod schema from AsyncAPI spec
 */
function generateZodFromAsyncAPI(specPath) {
  const specContent = fs.readFileSync(specPath, "utf-8")
  const spec = yaml.load(specContent)

  const schemas = spec.components?.schemas || {}
  const info = spec.info || {}

  // Build refs map for common schemas
  const refs = {}
  if (schemas.RawAudioEncodingEnum?.enum) {
    refs.RawAudioEncodingEnum = `zod.enum([${schemas.RawAudioEncodingEnum.enum.map((v) => JSON.stringify(v)).join(", ")}])`
  }
  if (schemas.MaxDelayModeConfig?.enum) {
    refs.MaxDelayModeConfig = `zod.enum([${schemas.MaxDelayModeConfig.enum.map((v) => JSON.stringify(v)).join(", ")}])`
  }
  if (schemas.OperatingPoint?.enum) {
    refs.OperatingPoint = `zod.enum([${schemas.OperatingPoint.enum.map((v) => JSON.stringify(v)).join(", ")}])`
  }

  // Generate individual schema exports
  const schemaExports = []

  // Audio encoding enum
  if (schemas.RawAudioEncodingEnum?.enum) {
    schemaExports.push(`/**
 * Speechmatics audio encoding formats
 * @source RawAudioEncodingEnum from AsyncAPI spec
 */
export const speechmaticsAudioEncodingSchema = ${refs.RawAudioEncodingEnum}`)
  }

  // TranscriptionConfig
  if (schemas.TranscriptionConfig) {
    const zodSchema = jsonSchemaToZod(schemas.TranscriptionConfig, "", refs)
    schemaExports.push(`/**
 * Speechmatics transcription config
 * @source TranscriptionConfig from AsyncAPI spec
 */
export const speechmaticsTranscriptionConfigSchema = ${zodSchema}`)
  }

  // MidSessionTranscriptionConfig
  if (schemas.MidSessionTranscriptionConfig) {
    const zodSchema = jsonSchemaToZod(schemas.MidSessionTranscriptionConfig, "", refs)
    schemaExports.push(`/**
 * Speechmatics mid-session update config
 * @source MidSessionTranscriptionConfig from AsyncAPI spec
 */
export const speechmaticsMidSessionConfigSchema = ${zodSchema}`)
  }

  // SpeakerDiarizationConfig
  if (schemas.SpeakerDiarizationConfig) {
    const zodSchema = jsonSchemaToZod(schemas.SpeakerDiarizationConfig, "", refs)
    schemaExports.push(`/**
 * Speechmatics speaker diarization config
 * @source SpeakerDiarizationConfig from AsyncAPI spec
 */
export const speechmaticsSpeakerDiarizationConfigSchema = ${zodSchema}`)
  }

  // ConversationConfig
  if (schemas.ConversationConfig) {
    const zodSchema = jsonSchemaToZod(schemas.ConversationConfig, "", refs)
    schemaExports.push(`/**
 * Speechmatics conversation config (VAD/end-of-utterance)
 * @source ConversationConfig from AsyncAPI spec
 */
export const speechmaticsConversationConfigSchema = ${zodSchema}`)
  }

  // AudioFilteringConfig
  if (schemas.AudioFilteringConfig) {
    const zodSchema = jsonSchemaToZod(schemas.AudioFilteringConfig, "", refs)
    schemaExports.push(`/**
 * Speechmatics audio filtering config
 * @source AudioFilteringConfig from AsyncAPI spec
 */
export const speechmaticsAudioFilteringConfigSchema = ${zodSchema}`)
  }

  // Build flattened streaming params
  const flattenedParams = []

  // Audio format params
  if (schemas.RawAudioEncodingEnum?.enum) {
    flattenedParams.push(`  encoding: speechmaticsAudioEncodingSchema.optional()
    .describe("Audio encoding format")`)
  }
  flattenedParams.push(`  sample_rate: zod.number().optional()
    .describe("Audio sample rate in Hz")`)

  // Transcription config params (flattened)
  if (schemas.TranscriptionConfig?.properties) {
    const props = schemas.TranscriptionConfig.properties
    const required = schemas.TranscriptionConfig.required || []

    for (const [key, prop] of Object.entries(props)) {
      // Skip complex nested objects for flattened version
      if (
        prop.$ref &&
        !["RawAudioEncodingEnum", "MaxDelayModeConfig", "OperatingPoint"].includes(
          prop.$ref.split("/").pop()
        )
      ) {
        continue
      }

      let zodType = jsonSchemaToZod(prop, "  ", refs)
      if (!required.includes(key)) zodType += ".optional()"

      const desc = prop.description
        ? `.describe(${JSON.stringify(prop.description.replace(/\n/g, " ").trim())})`
        : ""
      flattenedParams.push(`  ${key}: ${zodType}${desc}`)
    }
  }

  // Build mid-session update params
  const updateParams = []
  if (schemas.MidSessionTranscriptionConfig?.properties) {
    for (const [key, prop] of Object.entries(schemas.MidSessionTranscriptionConfig.properties)) {
      // Skip complex nested objects
      if (prop.$ref && !["MaxDelayModeConfig"].includes(prop.$ref.split("/").pop())) {
        continue
      }

      let zodType = jsonSchemaToZod(prop, "  ", refs)
      zodType += ".optional()"

      const desc = prop.description
        ? `.describe(${JSON.stringify(prop.description.replace(/\n/g, " ").trim())})`
        : ""
      updateParams.push(`  ${key}: ${zodType}${desc}`)
    }
  }

  return `/**
 * Speechmatics Streaming Zod Schemas
 * AUTO-GENERATED from AsyncAPI spec - DO NOT EDIT MANUALLY
 *
 * @source ${ASYNCAPI_SPEC.replace(process.cwd() + "/", "")}
 * @version ${info.version || "unknown"}
 * @see ${info.externalDocs?.url || "https://docs.speechmatics.com/rt-api-ref"}
 *
 * Regenerate with: pnpm openapi:sync-speechmatics-streaming
 */

import { z as zod } from "zod"

${schemaExports.join("\n\n")}

/**
 * Speechmatics streaming transcriber params (flattened)
 * Combined from StartRecognition message structure
 */
export const streamingTranscriberParams = zod.object({
${flattenedParams.join(",\n")}
})

/**
 * Speechmatics mid-session update params
 * Can be sent via SetRecognitionConfig message
 */
export const streamingUpdateConfigParams = zod.object({
${updateParams.join(",\n")}
})
`
}

async function main() {
  try {
    console.log("📥 Generating Speechmatics streaming types from AsyncAPI spec...")

    // Check if spec exists
    if (!fs.existsSync(ASYNCAPI_SPEC)) {
      console.error(`❌ AsyncAPI spec not found at ${ASYNCAPI_SPEC}`)
      console.log("   Run 'pnpm openapi:sync --provider speechmaticsAsync' first")
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

    console.log("✅ Successfully generated Speechmatics streaming types!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Failed to generate Speechmatics streaming types:", error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()
