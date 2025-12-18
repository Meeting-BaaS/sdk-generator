/**
 * Sync AssemblyAI v3 Streaming Types
 * Downloads the official streaming types from AssemblyAI's Node SDK
 */

const https = require("https")
const fs = require("fs")
const path = require("path")

const STREAMING_TYPES_URL =
  "https://raw.githubusercontent.com/AssemblyAI/assemblyai-node-sdk/main/src/types/streaming/index.ts"
const OUTPUT_DIR = path.join(__dirname, "../src/generated/assemblyai")
const STREAMING_OUTPUT = path.join(OUTPUT_DIR, "streaming-types.ts")

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

    console.log("✅ Successfully synced AssemblyAI v3 streaming types!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Failed to sync AssemblyAI streaming types:", error.message)
    process.exit(1)
  }
}

main()
