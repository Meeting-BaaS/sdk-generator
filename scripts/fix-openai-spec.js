#!/usr/bin/env node
/**
 * Filter and fix OpenAI OpenAPI spec for Whisper/audio endpoints only
 *
 * The official OpenAI spec includes the entire API (chat, embeddings, assistants, etc.)
 * This script filters it down to just audio transcription/translation endpoints
 * and fixes any validation issues for Orval compatibility.
 *
 * Source: https://github.com/openai/openai-openapi (synced via sync-specs.js)
 */

const fs = require("fs")
const yaml = require("js-yaml")

const SPEC_PATH = "./specs/openai-openapi.yaml"
const BACKUP_PATH = "./specs/openai-openapi.yaml.backup"

console.log("🔧 Filtering OpenAI spec to audio/Whisper endpoints only...\n")

// Check if spec exists
if (!fs.existsSync(SPEC_PATH)) {
  console.log("⚠️  OpenAI spec not found at", SPEC_PATH)
  console.log("   Run 'pnpm openapi:sync --provider openai' first")
  process.exit(0)
}

// Read the spec
const specContent = fs.readFileSync(SPEC_PATH, "utf8")
const spec = yaml.load(specContent)

let fixCount = 0

// Step 1: Keep only audio-related paths
console.log("📋 Step 1: Filtering paths to audio endpoints only")

const allowedPathPrefixes = [
  "/audio/transcriptions",
  "/audio/translations",
  "/audio/speech"
]

const removedPaths = []
if (spec.paths) {
  const pathKeys = Object.keys(spec.paths)
  for (const pathKey of pathKeys) {
    const isAudioPath = allowedPathPrefixes.some((prefix) => pathKey.startsWith(prefix))
    if (!isAudioPath) {
      removedPaths.push(pathKey)
      delete spec.paths[pathKey]
      fixCount++
    }
  }
}

console.log(`   ✅ Kept ${Object.keys(spec.paths || {}).length} audio paths`)
console.log(`   🗑️  Removed ${removedPaths.length} non-audio paths`)

// Step 2: Collect all $ref references from remaining paths
console.log("\n📋 Step 2: Collecting referenced schemas")

function collectRefs(obj, refs = new Set()) {
  if (!obj || typeof obj !== "object") return refs

  if (obj.$ref && typeof obj.$ref === "string") {
    // Extract schema name from $ref like "#/components/schemas/CreateTranscriptionRequest"
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

// Step 3: Resolve transitive dependencies (schemas that reference other schemas)
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

console.log(`   ✅ Kept ${referencedSchemas.size} audio-related schemas`)
console.log(`   🗑️  Removed ${removedSchemas.length} unreferenced schemas`)

// Step 5: Fix malformed array schemas (missing items key)
console.log("\n📋 Step 5: Fixing malformed array schemas")

function fixArraySchemas(obj, path = "") {
  if (!obj || typeof obj !== "object") return 0
  let fixes = 0

  // If this is an array type without items, add default items
  if (obj.type === "array" && !obj.items) {
    obj.items = { type: "integer" } // Default to integer for bytes arrays
    fixes++
    console.log(`   ✅ Fixed array missing items: ${path}`)
  }

  // Recursively check all properties
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

spec.info.title = "OpenAI Audio API"
spec.info.description = "OpenAI Audio API - Transcription, Translation, and Speech endpoints. Filtered from the official OpenAI API spec."
console.log(`   ✅ Updated title and description`)

// Filter tags to audio only
if (spec.tags) {
  spec.tags = spec.tags.filter(tag => 
    tag.name?.toLowerCase().includes("audio")
  )
  console.log(`   ✅ Filtered tags to audio-related only`)
}

// Save backup (only if not already exists)
if (!fs.existsSync(BACKUP_PATH)) {
  fs.writeFileSync(BACKUP_PATH, specContent)
  console.log(`\n💾 Backup saved to: ${BACKUP_PATH}`)
}

// Write fixed spec
const fixedYaml = yaml.dump(spec, { lineWidth: -1 })
fs.writeFileSync(SPEC_PATH, fixedYaml)

console.log(`\n✅ Applied ${fixCount} fixes/filters to OpenAI spec`)
console.log(`📝 Filtered spec saved to: ${SPEC_PATH}`)
console.log(`\n📊 Final spec summary:`)
console.log(`   Paths: ${Object.keys(spec.paths || {}).length}`)
console.log(`   Schemas: ${Object.keys(spec.components?.schemas || {}).length}`)
console.log(`   Tags: ${(spec.tags || []).length}\n`)
