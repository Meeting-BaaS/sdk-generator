#!/usr/bin/env node
/**
 * Filter and fix AssemblyAI OpenAPI spec for STT endpoints
 *
 * The live docs spec (https://www.assemblyai.com/docs/openapi.json) includes
 * LLM Gateway, Speech Understanding, and streaming token endpoints.
 * This script filters it down to /v2/* STT paths, maps operationIds back to
 * descriptive names (preserving adapter imports), and strips inline Authorization
 * header parameters (Orval handles auth via security schemes).
 *
 * Follows the same pattern as fix-elevenlabs-spec.js.
 */

const fs = require("fs")

const SPEC_PATH = "./specs/assemblyai-openapi.json"
const BACKUP_PATH = "./specs/assemblyai-openapi.json.backup"

console.log("🔧 Filtering AssemblyAI spec to STT endpoints...\n")

// Check if spec exists
if (!fs.existsSync(SPEC_PATH)) {
  console.log("⚠️  AssemblyAI spec not found at", SPEC_PATH)
  console.log("   Run 'pnpm openapi:sync --provider assemblyai' first")
  process.exit(0)
}

// Read the spec
const specContent = fs.readFileSync(SPEC_PATH, "utf8")
const spec = JSON.parse(specContent)

let fixCount = 0

// Step 1: Keep only /v2/* paths (drop /chat/completions, /understanding, /v3/token)
console.log("📋 Step 1: Filtering paths to /v2/* STT endpoints")

const allowedPathPrefixes = ["/v2/"]

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
console.log(`   🗑️  Removed ${removedPaths.length} non-STT paths: ${removedPaths.join(", ")}`)

// Step 2: Map operationIds to descriptive names (preserves adapter/consumer imports)
console.log("\n📋 Step 2: Mapping operationIds to descriptive names")

const OPERATION_ID_MAP = {
  submit: "createTranscript",
  get: "getTranscript",
  delete: "deleteTranscript",
  list: "listTranscripts",
  upload: "uploadFile",
  "get-sentences": "getTranscriptSentences",
  "get-paragraphs": "getTranscriptParagraphs",
  "get-subtitles": "getSubtitles",
  "get-redacted-audio": "getRedactedAudio",
  "word-search": "wordSearch"
}

let operationIdFixes = 0
if (spec.paths) {
  for (const [pathKey, pathObj] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathObj)) {
      if (typeof operation !== "object" || !operation) continue
      if (!["get", "post", "put", "patch", "delete", "options", "head"].includes(method)) {
        continue
      }

      if (operation.operationId && OPERATION_ID_MAP[operation.operationId]) {
        const oldId = operation.operationId
        const newId = OPERATION_ID_MAP[oldId]
        operation.operationId = newId
        console.log(`   ✅ ${oldId} → ${newId} (${method.toUpperCase()} ${pathKey})`)
        operationIdFixes++
      }
    }
  }
}

fixCount += operationIdFixes
console.log(`   Mapped ${operationIdFixes} operationIds`)

// Step 3: Strip inline Authorization header parameters
console.log("\n📋 Step 3: Stripping inline Authorization header parameters")

let authParamFixes = 0
if (spec.paths) {
  for (const [pathKey, pathObj] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathObj)) {
      if (typeof operation !== "object" || !operation) continue
      if (!["get", "post", "put", "patch", "delete", "options", "head"].includes(method)) {
        continue
      }

      if (operation.parameters && Array.isArray(operation.parameters)) {
        const before = operation.parameters.length
        operation.parameters = operation.parameters.filter(
          (p) => !(p.name === "Authorization" && p.in === "header")
        )
        const removed = before - operation.parameters.length
        if (removed > 0) {
          authParamFixes += removed
          // Remove empty parameters array
          if (operation.parameters.length === 0) {
            delete operation.parameters
          }
        }
      }
    }
  }
}

fixCount += authParamFixes
console.log(`   🗑️  Removed ${authParamFixes} inline Authorization params`)

// Step 4: Collect all $ref references from remaining paths
console.log("\n📋 Step 4: Collecting referenced schemas")

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

// Step 5: Resolve transitive dependencies
console.log("\n📋 Step 5: Resolving transitive schema dependencies")

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

// Step 6: Remove unreferenced schemas
console.log("\n📋 Step 6: Removing unreferenced schemas")

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

// Step 7: Fix malformed array schemas (missing items key)
console.log("\n📋 Step 7: Fixing malformed array schemas")

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

// Step 8: Fix any missing path parameters
console.log("\n📋 Step 8: Fixing missing path parameters")

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

      // Remove empty parameters array
      if (operation.parameters.length === 0) {
        delete operation.parameters
      }
    }
  }
}

if (paramFixes > 0) {
  console.log(`   ✅ Added ${paramFixes} missing path parameters`)
} else {
  console.log(`   ✅ No missing path parameters`)
}

// Step 9: Remove deprecated request fields that conflict with their replacements
//
// The docs spec includes `speech_model` (singular, deprecated) alongside `speech_models`
// (plural, required array) on TranscriptParams. The API rejects requests containing both:
//   "speech_model and speech_models cannot be used in the same request"
// Strip the deprecated field from the request schema only — the Transcript response schema
// keeps it (read-only, tells you which model was used).
console.log("\n📋 Step 9: Removing deprecated conflicting fields from TranscriptParams")

const DEPRECATED_REQUEST_FIELDS = ["speech_model"]
const transcriptParamsSchema = spec.components?.schemas?.TranscriptParams
if (transcriptParamsSchema?.properties) {
  for (const field of DEPRECATED_REQUEST_FIELDS) {
    if (transcriptParamsSchema.properties[field]) {
      delete transcriptParamsSchema.properties[field]
      // Also remove from required array if present
      if (Array.isArray(transcriptParamsSchema.required)) {
        transcriptParamsSchema.required = transcriptParamsSchema.required.filter((r) => r !== field)
      }
      console.log(`   🗑️  Removed deprecated ${field} from TranscriptParams`)
      fixCount++
    }
  }
} else {
  console.log(`   ⏭️  TranscriptParams not found (skipped)`)
}

// Step 10: Update spec metadata
console.log("\n📋 Step 9: Updating spec metadata")

spec.info.title = "AssemblyAI API"
spec.info.description =
  "AssemblyAI Speech-to-Text API - Batch transcription endpoints. Filtered from the official AssemblyAI docs spec."
console.log(`   ✅ Updated title to "AssemblyAI API"`)

// Filter tags to STT only
if (spec.tags) {
  spec.tags = spec.tags.filter((tag) => {
    const name = tag.name?.toLowerCase() || ""
    return name.includes("transcript") || name.includes("upload") || name.includes("speech")
  })
  console.log(`   ✅ Filtered tags to STT only`)
}

// Save backup (only if not already exists)
if (!fs.existsSync(BACKUP_PATH)) {
  fs.writeFileSync(BACKUP_PATH, specContent)
  console.log(`\n💾 Backup saved to: ${BACKUP_PATH}`)
}

// Write fixed spec
fs.writeFileSync(SPEC_PATH, JSON.stringify(spec, null, 2))

console.log(`\n✅ Applied ${fixCount} fixes/filters to AssemblyAI spec`)
console.log(`📝 Filtered spec saved to: ${SPEC_PATH}`)
console.log(`\n📊 Final spec summary:`)
console.log(`   Paths: ${Object.keys(spec.paths || {}).length}`)
console.log(`   Schemas: ${Object.keys(spec.components?.schemas || {}).length}`)
console.log(`   Tags: ${(spec.tags || []).length}\n`)
