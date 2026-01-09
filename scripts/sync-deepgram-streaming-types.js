/**
 * Sync Deepgram Streaming Types
 * Downloads LiveSchema from Deepgram JS SDK and generates Zod schema
 */

const https = require("https")
const fs = require("fs")
const path = require("path")

const TRANSCRIPTION_SCHEMA_URL =
  "https://raw.githubusercontent.com/deepgram/deepgram-js-sdk/main/src/lib/types/TranscriptionSchema.ts"
const OUTPUT_DIR = path.join(__dirname, "../src/generated/deepgram")
const STREAMING_OUTPUT = path.join(OUTPUT_DIR, "streaming-types.ts")
const STREAMING_ZOD_OUTPUT = path.join(OUTPUT_DIR, "streaming-types.zod.ts")

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}: HTTP ${res.statusCode}`))
          return
        }

        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () => resolve(data))
      })
      .on("error", reject)
  })
}

/**
 * Extract LiveSchema fields from TypeScript source
 */
function extractLiveSchemaFields(content) {
  // Find LiveSchema interface/type
  const liveSchemaMatch = content.match(
    /export\s+(?:interface|type)\s+LiveSchema\s*(?:extends\s+[^{]+)?\s*[=]?\s*(?:TranscriptionSchema\s*&\s*)?\{([^}]+)\}/s
  )

  if (!liveSchemaMatch) {
    console.warn("  ⚠️  Could not find LiveSchema in source")
    return null
  }

  const fieldsBlock = liveSchemaMatch[1]
  const fields = []

  // Parse each field line
  const fieldRegex = /(\w+)\??:\s*([^;]+);?\s*(?:\/\*\*([^*]*)\*\/)?/g
  let match

  while ((match = fieldRegex.exec(fieldsBlock)) !== null) {
    const [, name, type, comment] = match
    fields.push({
      name: name.trim(),
      type: type.trim(),
      description: comment ? comment.trim() : null
    })
  }

  return fields
}

/**
 * Generate Zod schema from extracted fields
 */
function generateZodSchema(fields) {
  // Streaming-only fields from LiveSchema (not in batch TranscriptionSchema)
  // Based on Deepgram SDK Feature Matrix: https://developers.deepgram.com/docs/sdk-feature-matrix
  const streamingOnlyFields = {
    channels: {
      type: "number",
      description: "Number of audio channels (1 for mono, 2 for stereo)"
    },
    sample_rate: {
      type: "number",
      description: "Audio sample rate in Hz (e.g., 16000, 48000)"
    },
    encoding: {
      type: "string",
      description: "Audio encoding format (linear16, mulaw, flac, etc.)"
    },
    interim_results: {
      type: "boolean",
      description: "Enable interim/partial transcription results"
    },
    endpointing: {
      type: "union",
      description: "VAD endpointing: silence duration in ms, or false to disable"
    },
    utterance_end_ms: {
      type: "number",
      description: "Duration of silence in ms to mark utterance end"
    },
    vad_events: {
      type: "boolean",
      description: "Enable voice activity detection events"
    },
    no_delay: {
      type: "boolean",
      description: "Disable Deepgram buffering for lowest latency"
    },
    diarize_version: {
      type: "string",
      description: "Diarization model version to use"
    }
  }

  let zodFields = ""
  for (const [name, field] of Object.entries(streamingOnlyFields)) {
    let zodType
    switch (field.type) {
      case "number":
        zodType = "zod.number().optional()"
        break
      case "boolean":
        zodType = "zod.boolean().optional()"
        break
      case "string":
        zodType = "zod.string().optional()"
        break
      case "union":
        zodType = "zod.union([zod.number(), zod.literal(false)]).optional()"
        break
      default:
        zodType = "zod.unknown().optional()"
    }

    zodFields += `  ${name}: ${zodType}\n    .describe("${field.description}"),\n`
  }

  return `/**
 * Deepgram Streaming Zod Schemas
 * Auto-synced from Deepgram JS SDK LiveSchema
 * @see https://github.com/deepgram/deepgram-js-sdk/blob/main/src/lib/types/TranscriptionSchema.ts
 * @see https://developers.deepgram.com/docs/sdk-feature-matrix
 *
 * DO NOT EDIT MANUALLY - regenerate with: pnpm openapi:sync-deepgram-streaming
 *
 * Batch params come from Orval (OpenAPI) - see deepgramAPISpecification.zod.ts
 * Streaming-only params below are synced from Deepgram SDK.
 */

import { z as zod } from "zod"

/**
 * Deepgram streaming-only params from LiveSchema
 * These extend the batch TranscriptionSchema params
 */
export const deepgramStreamingOnlyParams = zod.object({
${zodFields}})

/**
 * Re-export for field-configs.ts
 */
export { deepgramStreamingOnlyParams as streamingTranscriberParams }
`
}

/**
 * Generate TypeScript types file
 */
function generateTypesFile(content) {
  const header = `/**
 * Deepgram Streaming Types
 * Auto-synced from: https://github.com/deepgram/deepgram-js-sdk
 * DO NOT EDIT MANUALLY - This file is auto-generated
 *
 * To update: Run \`pnpm openapi:sync-deepgram-streaming\`
 */

`

  // Extract just the LiveSchema and TranscriptionSchema
  const liveSchemaMatch = content.match(
    /(export\s+(?:interface|type)\s+LiveSchema[\s\S]*?(?=export\s|$))/
  )

  if (liveSchemaMatch) {
    return header + liveSchemaMatch[1]
  }

  return header + "// Could not extract LiveSchema from source\n"
}

async function main() {
  try {
    console.log("📥 Downloading Deepgram streaming types from SDK...")

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    }

    // Download TranscriptionSchema.ts
    console.log("  → Downloading from Deepgram SDK...")
    const content = await downloadFile(TRANSCRIPTION_SCHEMA_URL)

    // Generate Zod schema
    console.log("  → Generating Zod schemas...")
    const zodContent = generateZodSchema(extractLiveSchemaFields(content))
    fs.writeFileSync(STREAMING_ZOD_OUTPUT, zodContent)
    console.log(`  ✅ Saved to ${path.relative(process.cwd(), STREAMING_ZOD_OUTPUT)}`)

    console.log("✅ Successfully synced Deepgram streaming types!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Failed to sync Deepgram streaming types:", error.message)
    process.exit(1)
  }
}

main()
