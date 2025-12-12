#!/usr/bin/env node
/**
 * Automatically fix validation issues in OpenAI Whisper OpenAPI spec
 * This script patches the spec to be compatible with Orval/OpenAPI generators
 */

const fs = require("fs")
const yaml = require("js-yaml")

const SPEC_PATH = "./specs/openai-whisper-openapi.yml"
const BACKUP_PATH = "./specs/openai-whisper-openapi.yml.backup"

console.log("🔧 Fixing OpenAI Whisper OpenAPI spec validation issues...\n")

// Read the spec
const specContent = fs.readFileSync(SPEC_PATH, "utf8")
const spec = yaml.load(specContent)

let fixCount = 0

// Fix 1: Missing path parameters
console.log("❌ Issue: Missing path parameter definitions")

if (spec.paths) {
  for (const [pathKey, pathObj] of Object.entries(spec.paths)) {
    // Extract path parameters from the path string
    const pathParams = [...pathKey.matchAll(/\{([^}]+)\}/g)].map((m) => m[1])

    for (const [method, operation] of Object.entries(pathObj)) {
      if (typeof operation !== "object" || !operation) continue

      // Skip if not an operation (e.g., parameters, summary, etc.)
      if (!["get", "post", "put", "patch", "delete", "options", "head"].includes(method)) {
        continue
      }

      // Check if operation has parameters
      if (!operation.parameters) {
        operation.parameters = []
      }

      // Check each path parameter is defined
      for (const paramName of pathParams) {
        const isDefined = operation.parameters.some(
          (p) => p.name === paramName && p.in === "path"
        )

        if (!isDefined) {
          console.log(`   Found missing path parameter: ${paramName} in ${method.toUpperCase()} ${pathKey}`)

          // Add the missing parameter
          operation.parameters.push({
            name: paramName,
            in: "path",
            required: true,
            description: `${paramName} identifier`,
            schema: {
              type: "string"
            }
          })

          console.log(`   ✅ Added missing parameter: ${paramName}`)
          fixCount++
        }
      }
    }
  }
}

console.log(`   Fixed ${fixCount} missing path parameters`)

// Fix 2: Remove invalid operations that can't be fixed
console.log("\n❌ Issue: Invalid operations that reference non-audio endpoints")

// OpenAI Whisper SDK should only include audio transcription/translation endpoints
// Remove any certificate or other non-audio operations
const allowedPaths = [
  "/audio/transcriptions",
  "/audio/translations",
  "/audio/speech",
  "/models",
  "/files"
]

if (spec.paths) {
  const pathKeys = Object.keys(spec.paths)
  for (const pathKey of pathKeys) {
    // Check if this path is audio-related
    const isAudioPath = allowedPaths.some((allowed) => pathKey.startsWith(allowed))

    if (!isAudioPath) {
      console.log(`   Removing non-audio path: ${pathKey}`)
      delete spec.paths[pathKey]
      fixCount++
    }
  }
}

console.log("   ✅ Removed non-audio paths")

// Fix 3: Ensure response schemas are valid
console.log("\n❌ Issue: Invalid response schemas")

if (spec.paths) {
  for (const [pathKey, pathObj] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathObj)) {
      if (typeof operation !== "object" || !operation.responses) continue

      for (const [statusCode, response] of Object.entries(operation.responses)) {
        // Ensure response has content or schema
        if (!response.content && !response.schema && !response.$ref) {
          console.log(`   Found response without content: ${method.toUpperCase()} ${pathKey} ${statusCode}`)

          // Add default empty response
          response.description = response.description || "Successful response"
          fixCount++
        }
      }
    }
  }
}

console.log("   ✅ Fixed response schemas")

// Save backup
if (!fs.existsSync(BACKUP_PATH)) {
  fs.writeFileSync(BACKUP_PATH, specContent)
  console.log(`\n💾 Backup saved to: ${BACKUP_PATH}`)
}

// Write fixed spec
const fixedYaml = yaml.dump(spec, { lineWidth: -1 })
fs.writeFileSync(SPEC_PATH, fixedYaml)

console.log(`\n✅ Applied ${fixCount} fixes to OpenAI Whisper spec`)
console.log(`📝 Fixed spec saved to: ${SPEC_PATH}\n`)
