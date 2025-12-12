#!/usr/bin/env node
/**
 * Automatically fix validation issues in Speechmatics OpenAPI spec
 * This script patches the spec to be compatible with Orval/OpenAPI generators
 */

const fs = require("fs")
const yaml = require("js-yaml")

const SPEC_PATH = "./specs/speechmatics-batch.yaml"
const BACKUP_PATH = "./specs/speechmatics-batch.yaml.backup"

console.log("🔧 Fixing Speechmatics OpenAPI spec validation issues...\n")

// Read the spec
const specContent = fs.readFileSync(SPEC_PATH, "utf8")
const spec = yaml.load(specContent)

let fixCount = 0

// Fix 1: basePath must start with "/"
if (spec.basePath && !spec.basePath.startsWith("/")) {
  console.log('❌ Issue: basePath must start with "/"')
  console.log(`   Found: "${spec.basePath}"`)

  // Extract just the path portion
  const url = new URL(spec.basePath)
  spec.basePath = url.pathname

  // Also set the host and schemes if not present
  if (!spec.host) {
    spec.host = url.host
  }
  if (!spec.schemes || spec.schemes.length === 0) {
    spec.schemes = [url.protocol.replace(":", "")]
  }

  console.log(`   ✅ Fixed: basePath = "${spec.basePath}", host = "${spec.host}"`)
  fixCount++
}

// Fix 2: Remove YAML anchors and merge keys (not supported by JSON Schema)
console.log("\n❌ Issue: YAML anchors/merge keys not supported")

function removeAnchorsAndMerges(obj, path = "") {
  if (typeof obj !== "object" || obj === null) return

  // If this is an array that looks like it's using YAML anchors, fix it
  if (Array.isArray(obj) && obj.some((item) => typeof item === "string" && item.startsWith("*"))) {
    console.log(`   Found YAML anchor reference in array at: ${path}`)
    // Remove anchor references - these cause validation errors
    const filtered = obj.filter((item) => !(typeof item === "string" && item.startsWith("*")))
    // Clear and repopulate array
    obj.length = 0
    filtered.forEach((item) => obj.push(item))
    fixCount++
  }

  for (const key in obj) {
    if (key === "<<") {
      // This is a merge key - we need to inline it
      console.log(`   Found merge key at: ${path}/${key}`)
      delete obj[key]
      fixCount++
    } else if (typeof obj[key] === "object") {
      removeAnchorsAndMerges(obj[key], `${path}/${key}`)
    }
  }
}

removeAnchorsAndMerges(spec)

// Fix 2b: Replace YAML anchor references with actual values
if (spec.definitions) {
  for (const [defName, definition] of Object.entries(spec.definitions)) {
    if (typeof definition !== "object") continue

    // Check for anchor references in required
    if (typeof definition.required === "string" && definition.required.startsWith("*")) {
      console.log(`   Found anchor reference in ${defName}.required: ${definition.required}`)
      // Replace with empty array (will be populated if we find the anchor target)
      definition.required = []
      fixCount++
    }

    // Check for anchor references in properties
    if (typeof definition.properties === "string" && definition.properties.startsWith("*")) {
      console.log(`   Found anchor reference in ${defName}.properties: ${definition.properties}`)
      // Replace with empty object
      definition.properties = {}
      fixCount++
    }
  }
}

console.log("   ✅ Removed YAML merge keys and anchor references")

// Fix 3: Fix invalid schema properties
console.log("\n❌ Issue: Invalid schema properties")

function fixSchemas(obj, path = "") {
  if (typeof obj !== "object" || obj === null) return

  // Fix confidence property - ensure it's a valid schema
  if (obj.confidence && typeof obj.confidence === "object") {
    const validKeys = ["type", "format", "description", "minimum", "maximum", "default", "example"]
    const hasInvalidKeys = Object.keys(obj.confidence).some((k) => !validKeys.includes(k))

    if (!obj.confidence.type && !obj.confidence.$ref) {
      console.log(`   Fixed confidence property without type at: ${path}`)
      obj.confidence = {
        type: "number",
        format: "float",
        minimum: 0,
        maximum: 1,
        description: "Confidence score"
      }
      fixCount++
    } else if (hasInvalidKeys) {
      console.log(`   Cleaned confidence property with invalid keys at: ${path}`)
      const cleaned = { type: "number", format: "float" }
      for (const key of validKeys) {
        if (obj.confidence[key] !== undefined) {
          cleaned[key] = obj.confidence[key]
        }
      }
      obj.confidence = cleaned
      fixCount++
    }
  }

  // Fix segments array - ensure items is properly defined
  if (obj.segments && typeof obj.segments === "object") {
    if (obj.segments.type === "array") {
      if (!obj.segments.items) {
        console.log(`   Fixed segments array missing items at: ${path}`)
        obj.segments.items = { type: "object" }
        fixCount++
      } else if (typeof obj.segments.items === "object" && !obj.segments.items.$ref) {
        // Ensure items has proper structure
        if (!obj.segments.items.type && !obj.segments.items.properties) {
          console.log(`   Fixed segments.items structure at: ${path}`)
          obj.segments.items.type = "object"
          fixCount++
        }
      }
    }
  }

  // Fix sentiment_analysis nested structure
  if (path.includes("sentiment_analysis") && obj.properties && obj.properties.sentiment_analysis) {
    console.log(`   Fixed nested sentiment_analysis duplication at: ${path}`)
    // Remove the duplicate nesting
    if (
      obj.properties.sentiment_analysis.properties &&
      obj.properties.sentiment_analysis.properties.sentiment_analysis
    ) {
      obj.properties.sentiment_analysis =
        obj.properties.sentiment_analysis.properties.sentiment_analysis
      fixCount++
    }
  }

  // Recursively check nested objects
  for (const key in obj) {
    if (typeof obj[key] === "object") {
      fixSchemas(obj[key], `${path}/${key}`)
    }
  }
}

if (spec.definitions) {
  fixSchemas(spec.definitions, "/definitions")
}
if (spec.paths) {
  fixSchemas(spec.paths, "/paths")
}

console.log("   ✅ Fixed invalid schema properties")

// Fix 4: Ensure all responses have proper structure
console.log("\n❌ Issue: Invalid response schemas")

if (spec.paths) {
  for (const [pathKey, pathObj] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathObj)) {
      if (typeof operation !== "object" || !operation.responses) continue

      for (const [statusCode, response] of Object.entries(operation.responses)) {
        // Ensure response has proper structure (either $ref or schema with $ref)
        if (response.schema && !response.schema.$ref) {
          // Check if schema is complex (has properties or is inline)
          if (response.schema.type && response.schema.properties) {
            // Move to definitions
            const defName = `${operation.operationId || method}Response${statusCode}`
            if (!spec.definitions) spec.definitions = {}

            // Check if definition already exists
            if (!spec.definitions[defName]) {
              spec.definitions[defName] = { ...response.schema }
              console.log(`   Moved inline schema to definition: ${defName}`)
              fixCount++
            }

            response.schema = { $ref: `#/definitions/${defName}` }
          } else if (!response.schema.type && Object.keys(response.schema).length > 0) {
            // Schema has properties but no type - might be malformed
            console.log(
              `   Fixed schema without type at ${method.toUpperCase()} ${pathKey} ${statusCode}`
            )
            response.schema.type = "object"
            fixCount++
          }
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
// Use noRefs to prevent YAML from creating anchor references
const fixedYaml = yaml.dump(spec, {
  lineWidth: -1,
  noRefs: true // Prevent automatic anchor/alias creation
})
fs.writeFileSync(SPEC_PATH, fixedYaml)

console.log(`\n✅ Applied ${fixCount} fixes to Speechmatics spec`)
console.log(`📝 Fixed spec saved to: ${SPEC_PATH}\n`)
