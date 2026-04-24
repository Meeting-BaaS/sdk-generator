#!/usr/bin/env node
/**
 * Filter and fix Deepgram OpenAPI spec for SDK-needed endpoints
 *
 * The official Deepgram spec includes ~50 endpoints (agents, billing, keys, etc.)
 * with duplicate operationIds (bare CRUD verbs like "list", "get", "create").
 * This script:
 * 1. Filters to only the 7 endpoints the SDK uses
 * 2. Assigns unique operationIds derived from paths
 * 3. Simplifies duplicate SpeakV1 parameter schemas
 * 4. Removes unreferenced schemas
 *
 * Source: https://api.deepgram.com/openapi.yaml
 */

const fs = require("fs")
const yaml = require("js-yaml")

const SPEC_PATH = "./specs/deepgram-openapi.yml"

console.log("🔧 Filtering Deepgram spec to SDK-needed endpoints...\n")

if (!fs.existsSync(SPEC_PATH)) {
  console.log("⚠️  Deepgram spec not found at", SPEC_PATH)
  console.log("   Run 'pnpm openapi:sync --provider deepgram' first")
  process.exit(0)
}

const specContent = fs.readFileSync(SPEC_PATH, "utf-8")
const spec = yaml.load(specContent)

let fixCount = 0

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Keep only SDK-needed paths and assign unique operationIds
// ─────────────────────────────────────────────────────────────────────────────
console.log("📋 Step 1: Filtering paths to SDK-needed endpoints")

const ALLOWED_ENDPOINTS = {
  "/v1/listen": { post: "listenTranscribe" },
  "/v1/speak": { post: "speakGenerate" },
  "/v1/read": { post: "readAnalyze" },
  "/v1/models": { get: "listModels" },
  "/v1/models/{model_id}": { get: "getModel" },
  "/v1/projects/{project_id}/requests": { get: "listProjectRequests" },
  "/v1/projects/{project_id}/requests/{request_id}": { get: "getProjectRequest" }
}

const removedPaths = []
if (spec.paths) {
  const pathKeys = Object.keys(spec.paths)
  for (const pathKey of pathKeys) {
    if (!ALLOWED_ENDPOINTS[pathKey]) {
      removedPaths.push(pathKey)
      delete spec.paths[pathKey]
      fixCount++
      continue
    }

    // Remove methods we don't need from kept paths
    const allowedMethods = ALLOWED_ENDPOINTS[pathKey]
    const pathObj = spec.paths[pathKey]
    for (const method of Object.keys(pathObj)) {
      if (["get", "post", "put", "patch", "delete", "options", "head"].includes(method)) {
        if (!allowedMethods[method]) {
          delete pathObj[method]
          fixCount++
        } else {
          // Assign unique operationId
          pathObj[method].operationId = allowedMethods[method]
        }
      }
    }
  }
}

console.log(`   ✅ Kept ${Object.keys(spec.paths || {}).length} SDK paths`)
console.log(`   🗑️  Removed ${removedPaths.length} unused paths`)

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Simplify duplicate SpeakV1 parameter schemas
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📋 Step 2: Simplifying duplicate SpeakV1 parameter schemas")

const SIMPLE_SCHEMAS = {
  SpeakV1Container: {
    name: "container",
    in: "query",
    required: false,
    description: "Container format for output audio",
    schema: { type: "string", enum: ["none", "wav", "ogg"], default: "wav" }
  },
  SpeakV1Encoding: {
    name: "encoding",
    in: "query",
    required: false,
    description: "Audio encoding format",
    schema: {
      type: "string",
      enum: ["linear16", "aac", "opus", "mp3", "flac", "mulaw", "alaw"],
      default: "mp3"
    }
  },
  SpeakV1SampleRate: {
    name: "sample_rate",
    in: "query",
    required: false,
    description: "Sample rate in Hz",
    schema: { type: "integer", enum: [8000, 16000, 22050, 24000, 32000, 48000] }
  }
}

const CONFLICTING_PARAMS = Object.keys(SIMPLE_SCHEMAS)
let simplifiedCount = 0

if (spec.components?.parameters) {
  for (const param of CONFLICTING_PARAMS) {
    if (spec.components.parameters[param]) {
      spec.components.parameters[param] = SIMPLE_SCHEMAS[param]
      simplifiedCount++
      console.log(`   ✅ Simplified components/parameters/${param}`)
    }
  }
}

// Also inline conflicting params in path operations
if (spec.paths) {
  for (const [, pathValue] of Object.entries(spec.paths)) {
    if (!pathValue || typeof pathValue !== "object") continue
    for (const [, operation] of Object.entries(pathValue)) {
      if (!operation?.parameters) continue
      operation.parameters = operation.parameters.map((param) => {
        if (param.$ref) {
          const refName = param.$ref.split("/").pop()
          if (CONFLICTING_PARAMS.includes(refName)) {
            simplifiedCount++
            return SIMPLE_SCHEMAS[refName]
          }
        }
        return param
      })
    }
  }
}

console.log(`   Simplified ${simplifiedCount} parameter schemas`)

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Collect all $ref references from remaining paths
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📋 Step 3: Collecting referenced schemas")

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

let referencedSchemas = collectRefs(spec.paths)
console.log(`   Found ${referencedSchemas.size} directly referenced schemas`)

// ─────────────────────────────────────────────────────────────────────────────
// Step 4: Resolve transitive dependencies
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📋 Step 4: Resolving transitive schema dependencies")

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

// ─────────────────────────────────────────────────────────────────────────────
// Step 5: Remove unreferenced schemas
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📋 Step 5: Removing unreferenced schemas")

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

console.log(`   ✅ Kept ${referencedSchemas.size} SDK-related schemas`)
console.log(`   🗑️  Removed ${removedSchemas.length} unreferenced schemas`)

// ─────────────────────────────────────────────────────────────────────────────
// Step 6: Fix malformed array schemas
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📋 Step 6: Fixing malformed array schemas")

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

// ─────────────────────────────────────────────────────────────────────────────
// Step 7: Fix missing path parameters
// ─────────────────────────────────────────────────────────────────────────────
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
  console.log(`   ✅ No missing path parameters`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 8: Update spec metadata
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📋 Step 8: Updating spec metadata")

spec.info.title = "Deepgram API"
spec.info.description =
  "Deepgram API - Transcription, TTS, text analysis, and request history endpoints. Filtered from the official Deepgram API spec."
console.log(`   ✅ Updated title and description`)

// Filter tags
if (spec.tags) {
  spec.tags = spec.tags.filter((tag) => {
    const name = tag.name?.toLowerCase() || ""
    return (
      name.includes("listen") ||
      name.includes("speak") ||
      name.includes("read") ||
      name.includes("model")
    )
  })
  console.log(`   ✅ Filtered tags`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Write fixed spec
// ─────────────────────────────────────────────────────────────────────────────
const fixedContent = yaml.dump(spec, {
  lineWidth: -1,
  noRefs: true,
  quotingType: '"',
  forceQuotes: false
})

fs.writeFileSync(SPEC_PATH, fixedContent, "utf-8")

console.log(`\n✅ Applied ${fixCount} fixes/filters to Deepgram spec`)
console.log(`📝 Filtered spec saved to: ${SPEC_PATH}`)
console.log(`\n📊 Final spec summary:`)
console.log(`   Paths: ${Object.keys(spec.paths || {}).length}`)
console.log(`   Schemas: ${Object.keys(spec.components?.schemas || {}).length}`)
console.log(`   Tags: ${(spec.tags || []).length}\n`)
