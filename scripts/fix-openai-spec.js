#!/usr/bin/env node
/**
 * Filter and fix OpenAI OpenAPI spec for audio + realtime endpoints
 *
 * The official OpenAI spec includes the entire API (chat, embeddings, assistants, etc.)
 * This script filters it down to:
 * - Audio transcription/translation/speech endpoints (batch)
 * - Realtime streaming endpoints (WebSocket-based)
 * And fixes any validation issues for Orval compatibility.
 *
 * Source: https://raw.githubusercontent.com/openai/openai-openapi/master/openapi.yaml
 */

const fs = require("node:fs")
const yaml = require("js-yaml")

const SPEC_PATH = "./specs/openai-openapi.yaml"
const BACKUP_PATH = "./specs/openai-openapi.yaml.backup"

console.log("🔧 Filtering OpenAI spec to audio + realtime endpoints...\n")

// Check if spec exists
if (!fs.existsSync(SPEC_PATH)) {
  console.log("⚠️  OpenAI spec not found at", SPEC_PATH)
  console.log("   Run 'pnpm openapi:sync --provider openai' first")
  process.exit(0)
}

// Read the spec
const specContent = fs.readFileSync(SPEC_PATH, "utf8")

// js-yaml cannot parse a `|+` block scalar whose only content is a
// whitespace-only line (the upstream suffix example is a bare newline):
// it fails to infer the block indent and rejects the following key with
// "bad indentation of a mapping entry". Rewrite such scalars to an
// equivalent inline "\n" before parsing.
const sanitizedContent = specContent.replace(
  /^([ \t]*)example: \|\+\n(?:[ \t]*\n)+(?=[ \t]*\S)/gm,
  '$1example: "\\n"\n'
)
const spec = yaml.load(sanitizedContent)

let fixCount = 0

// Step 1: Keep only audio and realtime paths
console.log("📋 Step 1: Filtering paths to audio + realtime endpoints")

const allowedPathPrefixes = [
  // Batch audio endpoints
  "/audio/transcriptions",
  "/audio/translations",
  "/audio/speech",
  "/audio/voices",
  // Realtime streaming endpoints
  "/realtime/sessions",
  "/realtime/transcription_sessions",
  "/realtime/client_secrets"
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

// Webhooks are unrelated to audio generation and reference schemas removed below.
const removedWebhooks = Object.keys(spec.webhooks || {}).length
if (removedWebhooks > 0) {
  delete spec.webhooks
  fixCount += removedWebhooks
  console.log(`   🗑️  Removed ${removedWebhooks} non-audio webhooks`)
}

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

// Named responses (components.responses) are referenced from paths and in
// turn reference schemas (e.g. ErrorResponse); prune the unused ones and
// include the kept ones in schema collection so their refs stay resolvable.
function collectResponseRefs(obj, refs = new Set()) {
  if (!obj || typeof obj !== "object") return refs
  if (obj.$ref && typeof obj.$ref === "string") {
    const match = obj.$ref.match(/#\/components\/responses\/(.+)/)
    if (match) refs.add(match[1])
  }
  for (const value of Object.values(obj)) {
    collectResponseRefs(value, refs)
  }
  return refs
}

if (spec.components?.responses) {
  const referencedResponses = collectResponseRefs(spec.paths)
  for (const responseName of Object.keys(spec.components.responses)) {
    if (!referencedResponses.has(responseName)) {
      delete spec.components.responses[responseName]
      fixCount++
    }
  }
  console.log(
    `   Kept ${Object.keys(spec.components.responses).length} referenced named response(s)`
  )
}

// Collect refs from paths and the named responses they use
let referencedSchemas = collectRefs(spec.paths)
if (spec.components?.responses) {
  referencedSchemas = collectRefs(spec.components.responses, referencedSchemas)
}
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

const arrayFixes = fixArraySchemas(spec)
if (arrayFixes > 0) {
  console.log(`   Fixed ${arrayFixes} array schemas`)
  fixCount += arrayFixes
} else {
  console.log("   ✅ No malformed array schemas found")
}

// Step 6: Repair defaults whose values do not match their schemas.
// Stainless occasionally publishes null defaults without nullable and array
// defaults on scalar schemas. Both produce invalid Zod output in Orval.
console.log("\n📋 Step 6: Fixing invalid schema defaults")

function fixInvalidSchemaDefaults(obj, path = "") {
  if (!obj || typeof obj !== "object") return 0
  let fixes = 0

  if (Object.hasOwn(obj, "default")) {
    if (obj.default === null && obj.nullable !== true) {
      obj.nullable = true
      fixes++
      console.log(`   ✅ Marked null default as nullable: ${path}`)
    } else if (obj.type === "string" && typeof obj.default !== "string") {
      delete obj.default
      fixes++
      console.log(`   ✅ Removed non-string default from string schema: ${path}`)
    }
  }

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null) {
      fixes += fixInvalidSchemaDefaults(value, `${path}/${key}`)
    }
  }

  return fixes
}

const defaultFixes = fixInvalidSchemaDefaults(spec)
fixCount += defaultFixes
if (defaultFixes === 0) {
  console.log("   ✅ No invalid schema defaults found")
}

// Step 7: Fix any missing path parameters
console.log("\n📋 Step 7: Fixing missing path parameters")

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
  console.log("   ✅ No missing path parameters")
}

// Step 8: Update spec metadata
console.log("\n📋 Step 8: Updating spec metadata")

spec.info.title = "OpenAI Audio & Realtime API"
spec.info.description =
  "OpenAI Audio API - Transcription, Translation, Speech, and Realtime streaming endpoints. Filtered from the official OpenAI API spec (Stainless-hosted)."
console.log("   ✅ Updated title and description")

// Filter tags to audio and realtime only
if (spec.tags) {
  spec.tags = spec.tags.filter((tag) => {
    const name = tag.name?.toLowerCase() || ""
    return name.includes("audio") || name.includes("realtime")
  })
  console.log("   ✅ Filtered tags to audio + realtime only")
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
console.log("\n📊 Final spec summary:")
console.log(`   Paths: ${Object.keys(spec.paths || {}).length}`)
console.log(`   Schemas: ${Object.keys(spec.components?.schemas || {}).length}`)
console.log(`   Tags: ${(spec.tags || []).length}\n`)
