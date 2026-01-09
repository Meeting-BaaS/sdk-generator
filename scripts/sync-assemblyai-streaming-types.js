/**
 * Sync AssemblyAI v3 Streaming Types
 * Downloads the official streaming types from AssemblyAI's Node SDK
 * and generates corresponding Zod schemas
 */

const https = require("https")
const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const STREAMING_TYPES_URL =
  "https://raw.githubusercontent.com/AssemblyAI/assemblyai-node-sdk/main/src/types/streaming/index.ts"
const OUTPUT_DIR = path.join(__dirname, "../src/generated/assemblyai")
const STREAMING_OUTPUT = path.join(OUTPUT_DIR, "streaming-types.ts")
const STREAMING_ZOD_OUTPUT = path.join(OUTPUT_DIR, "streaming-types.zod.ts")

function downloadFile(url, outputPath) {
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

function fixImports(content) {
  // Add header comment
  const header = `/**
 * AssemblyAI v3 Streaming Types
 * Auto-synced from: https://github.com/AssemblyAI/assemblyai-node-sdk
 * DO NOT EDIT MANUALLY - This file is auto-generated
 *
 * To update: Run \`pnpm openapi:sync-assemblyai-streaming\`
 */

`

  // Define AudioEncoding inline (based on AssemblyAI docs: pcm_s16le or pcm_mulaw)
  const audioEncodingType = `/**
 * Audio encoding format for streaming
 * @see https://www.assemblyai.com/docs/speech-to-text/streaming
 */
export type AudioEncoding = "pcm_s16le" | "pcm_mulaw";

`

  // Remove the import statement and add the AudioEncoding definition
  const withoutImport = content.replace('import { AudioEncoding } from "..";', "")

  return header + audioEncodingType + withoutImport
}

/**
 * Generate Zod schemas from TypeScript types
 * Extracts specific types for field config generation
 */
function generateZodSchemas() {
  // Create a ts-to-zod config for the streaming types
  const config = {
    input: STREAMING_OUTPUT,
    output: STREAMING_ZOD_OUTPUT,
    // Only generate schemas for types we need for field configs
    nameFilter: (name) =>
      ["StreamingTranscriberParams", "StreamingUpdateConfiguration"].includes(name)
  }

  const configPath = path.join(OUTPUT_DIR, "ts-to-zod.config.json")
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

  try {
    execSync(`npx ts-to-zod ${STREAMING_OUTPUT} ${STREAMING_ZOD_OUTPUT}`, {
      cwd: path.join(__dirname, ".."),
      stdio: "pipe"
    })

    // Post-process the generated Zod file
    let zodContent = fs.readFileSync(STREAMING_ZOD_OUTPUT, "utf-8")

    // Add header
    const header = `/**
 * AssemblyAI Streaming Zod Schemas
 * Auto-generated from streaming-types.ts using ts-to-zod
 * DO NOT EDIT MANUALLY - regenerate with: pnpm openapi:sync-assemblyai-streaming
 */

`
    // Replace import with zod import
    zodContent = zodContent.replace(
      /import \{ z \} from "zod";?/,
      'import { z as zod } from "zod"'
    )

    // Rename schemas to match our naming convention
    zodContent = zodContent.replace(
      /export const streamingTranscriberParamsSchema/g,
      "export const streamingTranscriberParams"
    )
    zodContent = zodContent.replace(
      /export const streamingUpdateConfigurationSchema/g,
      "export const streamingUpdateConfigParams"
    )

    // Remove the "Schema" suffix from type references
    zodContent = zodContent.replace(/Schema(?=\s*[,;\)])/g, "")

    fs.writeFileSync(STREAMING_ZOD_OUTPUT, header + zodContent)
    return true
  } catch (error) {
    console.warn("  ⚠️  ts-to-zod failed, using fallback Zod generation")
    return false
  } finally {
    // Cleanup config
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath)
    }
  }
}

/**
 * Fallback: Generate Zod schemas manually from parsed TS types
 * Used when ts-to-zod fails or for custom schema requirements
 */
function generateFallbackZodSchemas() {
  const content = fs.readFileSync(STREAMING_OUTPUT, "utf-8")

  // Parse StreamingTranscriberParams fields
  const transcriberMatch = content.match(
    /export type StreamingTranscriberParams\s*=\s*\{([^}]+)\}/s
  )
  const updateConfigMatch = content.match(
    /export type StreamingUpdateConfiguration\s*=\s*\{([^}]+)\}/s
  )

  const zodContent = `/**
 * AssemblyAI Streaming Zod Schemas
 * Auto-generated from streaming-types.ts
 * DO NOT EDIT MANUALLY - regenerate with: pnpm openapi:sync-assemblyai-streaming
 */

import { z as zod } from "zod"

/**
 * AssemblyAI streaming transcriber params Zod schema
 */
export const streamingTranscriberParams = zod.object({
  sampleRate: zod.number().describe("Audio sample rate in Hz (e.g., 16000)"),
  encoding: zod
    .enum(["pcm_s16le", "pcm_mulaw"])
    .optional()
    .describe("Audio encoding format"),
  speechModel: zod
    .enum(["universal-streaming-english", "universal-streaming-multilingual"])
    .optional()
    .describe("Speech recognition model to use"),
  languageDetection: zod
    .boolean()
    .optional()
    .describe("Enable automatic language detection"),
  endOfTurnConfidenceThreshold: zod
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Confidence threshold for end-of-turn detection (0-1)"),
  minEndOfTurnSilenceWhenConfident: zod
    .number()
    .optional()
    .describe("Minimum silence in ms to trigger end-of-turn when confident"),
  maxTurnSilence: zod
    .number()
    .optional()
    .describe("Maximum silence in ms before forcing end-of-turn"),
  vadThreshold: zod
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Voice activity detection threshold (0-1)"),
  formatTurns: zod
    .boolean()
    .optional()
    .describe("Enable real-time text formatting of turns"),
  filterProfanity: zod
    .boolean()
    .optional()
    .describe("Filter profanity in real-time transcription"),
  keyterms: zod
    .array(zod.string())
    .optional()
    .describe("Key terms to boost in recognition"),
  keytermsPrompt: zod
    .array(zod.string())
    .optional()
    .describe("Context hints for key terms"),
  inactivityTimeout: zod
    .number()
    .optional()
    .describe("Session timeout in ms if no audio received")
})

/**
 * AssemblyAI streaming update configuration params
 * These can be sent mid-stream to adjust VAD/turn detection
 */
export const streamingUpdateConfigParams = zod.object({
  end_of_turn_confidence_threshold: zod
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Confidence threshold for end-of-turn detection (0-1)"),
  min_end_of_turn_silence_when_confident: zod
    .number()
    .optional()
    .describe("Minimum silence in ms to trigger end-of-turn when confident"),
  max_turn_silence: zod
    .number()
    .optional()
    .describe("Maximum silence in ms before forcing end-of-turn"),
  vad_threshold: zod
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Voice activity detection threshold (0-1)"),
  format_turns: zod
    .boolean()
    .optional()
    .describe("Enable real-time text formatting of turns")
})
`

  fs.writeFileSync(STREAMING_ZOD_OUTPUT, zodContent)
}

async function main() {
  try {
    console.log("📥 Downloading AssemblyAI v3 streaming types...")

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    }

    // Download streaming types
    console.log("  → Downloading from AssemblyAI SDK...")
    const streamingContent = await downloadFile(STREAMING_TYPES_URL)
    const fixedStreamingContent = fixImports(streamingContent)
    fs.writeFileSync(STREAMING_OUTPUT, fixedStreamingContent)
    console.log(`  ✅ Saved to ${path.relative(process.cwd(), STREAMING_OUTPUT)}`)

    // Generate Zod schemas
    console.log("  → Generating Zod schemas...")
    const tsToZodSuccess = generateZodSchemas()
    if (!tsToZodSuccess) {
      generateFallbackZodSchemas()
    }
    console.log(`  ✅ Saved to ${path.relative(process.cwd(), STREAMING_ZOD_OUTPUT)}`)

    console.log("✅ Successfully synced AssemblyAI v3 streaming types!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Failed to sync AssemblyAI streaming types:", error.message)
    process.exit(1)
  }
}

main()
