#!/usr/bin/env node

/**
 * OpenAPI Spec Sync Script
 *
 * Downloads OpenAPI specifications from official provider sources.
 * Stores them locally in ./specs/ for reproducible builds.
 *
 * Usage:
 *   node scripts/sync-specs.js              # Sync all specs
 *   node scripts/sync-specs.js --provider gladia    # Sync specific provider
 *   node scripts/sync-specs.js --provider deepgram
 *   node scripts/sync-specs.js --provider assemblyai
 *   node scripts/sync-specs.js --provider assemblyaiAsync
 *   node scripts/sync-specs.js --validate-only      # Just validate existing specs
 *
 * Spec Sources:
 *   - Gladia: https://api.gladia.io/openapi.json
 *   - AssemblyAI: https://github.com/AssemblyAI/assemblyai-api-spec
 *   - Deepgram: https://github.com/deepgram/deepgram-api-specs
 *   - Speechmatics: https://github.com/speechmatics/speechmatics-js-sdk
 *   - OpenAI, Azure: Manual specs (no official OpenAPI)
 */

const fs = require("fs")
const path = require("path")
const https = require("https")

// Spec source definitions
const SPEC_SOURCES = {
  gladia: {
    url: "https://api.gladia.io/openapi.json",
    output: "specs/gladia-openapi.json",
    format: "json"
  },
  assemblyai: {
    url: "https://raw.githubusercontent.com/AssemblyAI/assemblyai-api-spec/main/openapi.json",
    output: "specs/assemblyai-openapi.json",
    format: "json"
  },
  assemblyaiAsync: {
    url: "https://raw.githubusercontent.com/AssemblyAI/assemblyai-api-spec/main/asyncapi.json",
    output: "specs/assemblyai-asyncapi.json",
    format: "json"
  },
  deepgram: {
    url: "https://raw.githubusercontent.com/deepgram/deepgram-api-specs/main/openapi.yml",
    output: "specs/deepgram-openapi.yml",
    format: "yaml"
  },
  // Manual specs - these are maintained locally, not synced
  openai: {
    manual: true,
    output: "specs/openai-whisper-openapi.yml",
    note: "No official OpenAPI spec available"
  },
  azure: {
    manual: true,
    output: "specs/azure-stt-openapi.json",
    note: "No official OpenAPI spec available"
  },
  speechmatics: {
    url: "https://raw.githubusercontent.com/speechmatics/speechmatics-js-sdk/main/packages/batch-client/schema/batch.yml",
    output: "specs/speechmatics-batch.yml",
    format: "yaml"
  },
  speechmaticsAsync: {
    url: "https://raw.githubusercontent.com/speechmatics/speechmatics-js-sdk/main/packages/real-time-client/schema/realtime.yml",
    output: "specs/speechmatics-asyncapi.yml",
    format: "yaml"
  },
  deepgramStreaming: {
    url: "https://raw.githubusercontent.com/deepgram/deepgram-js-sdk/main/src/lib/types/TranscriptionSchema.ts",
    output: "specs/deepgram-streaming-sdk.ts",
    format: "typescript"
  }
}

/**
 * Fetch content from URL (follows redirects)
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const makeRequest = (requestUrl) => {
      https
        .get(requestUrl, (res) => {
          // Handle redirects
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            makeRequest(res.headers.location)
            return
          }

          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
            return
          }

          let data = ""
          res.on("data", (chunk) => (data += chunk))
          res.on("end", () => resolve(data))
          res.on("error", reject)
        })
        .on("error", reject)
    }

    makeRequest(url)
  })
}

/**
 * Validate spec content (basic check)
 */
function validateSpec(content, format) {
  try {
    if (format === "json") {
      const parsed = JSON.parse(content)
      // Check for OpenAPI or AsyncAPI markers
      if (!parsed.openapi && !parsed.asyncapi && !parsed.swagger) {
        return { valid: false, error: "Missing openapi/asyncapi/swagger version field" }
      }
      return { valid: true, version: parsed.openapi || parsed.asyncapi || parsed.swagger }
    } else if (format === "yaml") {
      // Basic YAML validation - check for openapi/asyncapi field
      if (
        !content.includes("openapi:") &&
        !content.includes("swagger:") &&
        !content.includes("asyncapi:")
      ) {
        return { valid: false, error: "Missing openapi/asyncapi/swagger version field" }
      }
      const versionMatch = content.match(/(?:openapi|asyncapi):\s*['"]?([^'"\s]+)['"]?/)
      return { valid: true, version: versionMatch ? versionMatch[1] : "unknown" }
    } else if (format === "typescript") {
      // TypeScript SDK file - check for expected exports
      if (!content.includes("interface") && !content.includes("type")) {
        return { valid: false, error: "Missing TypeScript interface/type definitions" }
      }
      return { valid: true, version: "sdk" }
    }
    return { valid: false, error: "Unknown format" }
  } catch (e) {
    return { valid: false, error: e.message }
  }
}

/**
 * Sync a single spec
 */
async function syncSpec(name, config) {
  const outputPath = path.join(__dirname, "..", config.output)

  if (config.manual) {
    // Check if manual spec exists
    if (fs.existsSync(outputPath)) {
      console.log(`  ⏭️  ${name}: Manual spec (not synced) - ${config.note}`)
      return { status: "skipped", reason: "manual" }
    } else {
      console.log(`  ⚠️  ${name}: Manual spec missing at ${config.output}`)
      return { status: "missing", reason: "manual spec not found" }
    }
  }

  console.log(`  📥 ${name}: Fetching from ${config.url}`)

  try {
    const content = await fetchUrl(config.url)

    // Validate
    const validation = validateSpec(content, config.format)
    if (!validation.valid) {
      console.log(`  ❌ ${name}: Invalid spec - ${validation.error}`)
      return { status: "error", error: validation.error }
    }

    // Ensure directory exists
    const dir = path.dirname(outputPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Write spec
    fs.writeFileSync(outputPath, content, "utf-8")
    console.log(`  ✅ ${name}: Saved to ${config.output} (${validation.version})`)

    return { status: "success", version: validation.version }
  } catch (e) {
    console.log(`  ❌ ${name}: Failed - ${e.message}`)
    return { status: "error", error: e.message }
  }
}

/**
 * Validate existing specs without downloading
 */
async function validateOnly() {
  console.log("🔍 Validating existing specs...\n")

  let allValid = true

  for (const [name, config] of Object.entries(SPEC_SOURCES)) {
    const outputPath = path.join(__dirname, "..", config.output)

    if (!fs.existsSync(outputPath)) {
      if (config.manual) {
        console.log(`  ⚠️  ${name}: Manual spec missing`)
      } else {
        console.log(`  ❌ ${name}: Spec not found - run sync first`)
        allValid = false
      }
      continue
    }

    const content = fs.readFileSync(outputPath, "utf-8")
    const format = config.format || (outputPath.endsWith(".json") ? "json" : "yaml")
    const validation = validateSpec(content, format)

    if (validation.valid) {
      console.log(`  ✅ ${name}: Valid (${validation.version})`)
    } else {
      console.log(`  ❌ ${name}: Invalid - ${validation.error}`)
      allValid = false
    }
  }

  return allValid
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)

  // Parse arguments
  const validateOnlyMode = args.includes("--validate-only")
  const providerIndex = args.indexOf("--provider")
  const specificProvider = providerIndex >= 0 ? args[providerIndex + 1] : null

  if (validateOnlyMode) {
    const valid = await validateOnly()
    process.exit(valid ? 0 : 1)
  }

  console.log("🔄 Syncing OpenAPI specs from official sources...\n")

  const results = {}

  if (specificProvider) {
    // Sync specific provider
    if (!SPEC_SOURCES[specificProvider]) {
      console.error(`❌ Unknown provider: ${specificProvider}`)
      console.error(`Available providers: ${Object.keys(SPEC_SOURCES).join(", ")}`)
      process.exit(1)
    }
    results[specificProvider] = await syncSpec(specificProvider, SPEC_SOURCES[specificProvider])
  } else {
    // Sync all providers
    for (const [name, config] of Object.entries(SPEC_SOURCES)) {
      results[name] = await syncSpec(name, config)
    }
  }

  // Summary
  console.log("\n📊 Summary:")
  const success = Object.values(results).filter((r) => r.status === "success").length
  const skipped = Object.values(results).filter((r) => r.status === "skipped").length
  const errors = Object.values(results).filter((r) => r.status === "error").length

  console.log(`  ✅ Synced: ${success}`)
  console.log(`  ⏭️  Skipped: ${skipped}`)
  if (errors > 0) {
    console.log(`  ❌ Errors: ${errors}`)
    process.exit(1)
  }
}

// Run
main().catch((e) => {
  console.error("Fatal error:", e)
  process.exit(1)
})
