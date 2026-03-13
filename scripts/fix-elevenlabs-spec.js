#!/usr/bin/env node
/**
 * Filter and fix ElevenLabs OpenAPI spec for speech-to-text endpoints
 *
 * The official ElevenLabs spec includes the entire API (TTS, voice cloning, etc.)
 * This script filters it down to:
 * - Batch STT: POST /v1/speech-to-text
 * - Realtime STT: (WebSocket, not in OpenAPI but we keep the path reference)
 * And fixes any validation issues for Orval compatibility.
 *
 * Source: https://api.elevenlabs.io/openapi.json
 */

const fs = require("fs")

const SPEC_PATH = "./specs/elevenlabs-openapi.json"
const BACKUP_PATH = "./specs/elevenlabs-openapi.json.backup"

console.log("🔧 Filtering ElevenLabs spec to speech-to-text endpoints...\n")

// Check if spec exists
if (!fs.existsSync(SPEC_PATH)) {
  console.log("⚠️  ElevenLabs spec not found at", SPEC_PATH)
  console.log("   Run 'pnpm openapi:sync --provider elevenlabs' first")
  process.exit(0)
}

// Read the spec
const specContent = fs.readFileSync(SPEC_PATH, "utf8")
const spec = JSON.parse(specContent)

let fixCount = 0

// Step 1: Keep only speech-to-text paths
console.log("📋 Step 1: Filtering paths to speech-to-text endpoints")

const allowedPathPrefixes = [
  "/v1/speech-to-text"
]

const removedPaths = []
if (spec.paths) {
  const pathKeys = Object.keys(spec.paths)
  for (const pathKey of pathKeys) {
    const isSTTPath = allowedPathPrefixes.some((prefix) => pathKey.startsWith(prefix))
    if (!isSTTPath) {
      removedPaths.push(pathKey)
      delete spec.paths[pathKey]
      fixCount++
    }
  }
}

console.log(`   ✅ Kept ${Object.keys(spec.paths || {}).length} STT paths`)
console.log(`   🗑️  Removed ${removedPaths.length} non-STT paths`)

// Step 2: Collect all $ref references from remaining paths
console.log("\n📋 Step 2: Collecting referenced schemas")

function collectRefs(obj, refs = new Set()) {
  if (!obj || typeof obj !== "object") return refs

  if (obj.$ref && typeof obj.$ref === "string") {
    const match = obj.$ref.match(/#\/components\/schemas\/(.+)/)
    if (match) {
      refs.add(match[1])
    }
  }

  for (const value of Object.values(obj)) {
    collectRefs(value, refs)
  }

  return refs
}

// Collect refs from paths
let referencedSchemas = collectRefs(spec.paths)
console.log(`   Found ${referencedSchemas.size} directly referenced schemas`)

// Step 3: Resolve transitive dependencies
console.log("\n📋 Step 3: Resolving transitive schema dependencies")

function resolveTransitiveDeps(schemas, allSchemas, resolved = new Set()) {
  for (const schemaName of schemas) {
    if (resolved.has(schemaName)) continue
    resolved.add(schemaName)

    const schema = allSchemas[schemaName]
    if (schema) {
      const nestedRefs = collectRefs(schema)
      resolveTransitiveDeps(nestedRefs, allSchemas, resolved)
    }
  }
  return resolved
}

if (spec.components?.schemas) {
  referencedSchemas = resolveTransitiveDeps(referencedSchemas, spec.components.schemas)
  console.log(`   Total schemas needed (with dependencies): ${referencedSchemas.size}`)
}

// Step 4: Remove unreferenced schemas
console.log("\n📋 Step 4: Removing unreferenced schemas")

const removedSchemas = []
if (spec.components?.schemas) {
  const schemaKeys = Object.keys(spec.components.schemas)
  for (const schemaName of schemaKeys) {
    if (!referencedSchemas.has(schemaName)) {
      removedSchemas.push(schemaName)
      delete spec.components.schemas[schemaName]
      fixCount++
    }
  }
}

console.log(`   ✅ Kept ${referencedSchemas.size} STT-related schemas`)
console.log(`   🗑️  Removed ${removedSchemas.length} unreferenced schemas`)

// Step 5: Fix malformed array schemas (missing items key)
console.log("\n📋 Step 5: Fixing malformed array schemas")

function fixArraySchemas(obj, path = "") {
  if (!obj || typeof obj !== "object") return 0
  let fixes = 0

  if (obj.type === "array" && !obj.items) {
    obj.items = { type: "string" }
    fixes++
    console.log(`   ✅ Fixed array missing items: ${path}`)
  }

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null) {
      fixes += fixArraySchemas(value, `${path}/${key}`)
    }
  }

  return fixes
}

let arrayFixes = fixArraySchemas(spec)
if (arrayFixes > 0) {
  console.log(`   Fixed ${arrayFixes} array schemas`)
  fixCount += arrayFixes
} else {
  console.log(`   ✅ No malformed array schemas found`)
}

// Step 6: Fix any missing path parameters
console.log("\n📋 Step 6: Fixing missing path parameters")

let paramFixes = 0
if (spec.paths) {
  for (const [pathKey, pathObj] of Object.entries(spec.paths)) {
    const pathParams = [...pathKey.matchAll(/\{([^}]+)\}/g)].map((m) => m[1])

    for (const [method, operation] of Object.entries(pathObj)) {
      if (typeof operation !== "object" || !operation) continue
      if (!["get", "post", "put", "patch", "delete", "options", "head"].includes(method)) {
        continue
      }

      if (!operation.parameters) {
        operation.parameters = []
      }

      for (const paramName of pathParams) {
        const isDefined = operation.parameters.some((p) => p.name === paramName && p.in === "path")
        if (!isDefined) {
          operation.parameters.push({
            name: paramName,
            in: "path",
            required: true,
            description: `${paramName} identifier`,
            schema: { type: "string" }
          })
          paramFixes++
          fixCount++
        }
      }
    }
  }
}

if (paramFixes > 0) {
  console.log(`   ✅ Added ${paramFixes} missing path parameters`)
} else {
  console.log(`   ✅ No missing path parameters`)
}

// Step 7: Update spec metadata
console.log("\n📋 Step 7: Updating spec metadata")

spec.info.title = "ElevenLabs Speech-to-Text API"
spec.info.description =
  "ElevenLabs Speech-to-Text API - Batch and realtime transcription endpoints. Filtered from the official ElevenLabs API spec."
console.log(`   ✅ Updated title and description`)

// Filter tags to STT only
if (spec.tags) {
  spec.tags = spec.tags.filter((tag) => {
    const name = tag.name?.toLowerCase() || ""
    return name.includes("speech-to-text") || name.includes("stt") || name.includes("transcri")
  })
  console.log(`   ✅ Filtered tags to STT only`)
}

// Remove security schemes that aren't relevant (keep xi-api-key)
if (spec.components?.securitySchemes) {
  // Keep all security schemes - ElevenLabs uses xi-api-key
  console.log(`   ✅ Security schemes preserved`)
}

// Save backup (only if not already exists)
if (!fs.existsSync(BACKUP_PATH)) {
  fs.writeFileSync(BACKUP_PATH, specContent)
  console.log(`\n💾 Backup saved to: ${BACKUP_PATH}`)
}

// Write fixed spec
fs.writeFileSync(SPEC_PATH, JSON.stringify(spec, null, 2))

console.log(`\n✅ Applied ${fixCount} fixes/filters to ElevenLabs spec`)
console.log(`📝 Filtered spec saved to: ${SPEC_PATH}`)
console.log(`\n📊 Final spec summary:`)
console.log(`   Paths: ${Object.keys(spec.paths || {}).length}`)
console.log(`   Schemas: ${Object.keys(spec.components?.schemas || {}).length}`)
console.log(`   Tags: ${(spec.tags || []).length}\n`)
