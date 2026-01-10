/**
 * Sync Deepgram Streaming Types
 * Parses LiveSchema from local SDK TypeScript file and generates Zod schema
 * @see https://github.com/deepgram/deepgram-js-sdk/blob/main/src/lib/types/TranscriptionSchema.ts
 */

const fs = require("fs")
const path = require("path")

const SDK_SOURCE = path.join(__dirname, "../specs/deepgram-streaming-sdk.ts")
const OUTPUT_DIR = path.join(__dirname, "../src/generated/deepgram")
const STREAMING_ZOD_OUTPUT = path.join(OUTPUT_DIR, "streaming-types.zod.ts")

/**
 * Parse TypeScript interface to extract fields
 * This is a simple parser for the Deepgram SDK format
 */
function parseTypeScriptInterface(content, interfaceName) {
  // Find the start of the interface (without export keyword for inner interfaces)
  const patterns = [
    new RegExp(`interface\\s+${interfaceName}\\s*(?:extends\\s+[\\w,\\s]+)?\\s*\\{`, "g"),
    new RegExp(`type\\s+${interfaceName}\\s*=\\s*(?:\\w+\\s*&\\s*)?\\{`, "g")
  ]

  let startIndex = -1
  for (const pattern of patterns) {
    const match = pattern.exec(content)
    if (match) {
      startIndex = match.index + match[0].length
      break
    }
  }

  if (startIndex === -1) {
    console.warn(`  ⚠️  Could not find ${interfaceName} in source`)
    return []
  }

  // Find matching closing brace (handle nested braces)
  let braceCount = 1
  let endIndex = startIndex
  while (braceCount > 0 && endIndex < content.length) {
    if (content[endIndex] === "{") braceCount++
    if (content[endIndex] === "}") braceCount--
    endIndex++
  }

  const fieldsBlock = content.slice(startIndex, endIndex - 1)
  const fields = []

  // Parse multi-line JSDoc comments and field definitions
  // Format:
  //   /**
  //    * @see url
  //    */
  //   fieldName?: type;
  const fieldPattern =
    /\/\*\*[\s\S]*?@see\s+(https?:\/\/[^\s*]+)[\s\S]*?\*\/\s*(\w+)(\?)?:\s*([^;]+);/g

  let match
  while ((match = fieldPattern.exec(fieldsBlock)) !== null) {
    const [, doc, name, optional, type] = match
    fields.push({
      name,
      type: type.trim(),
      optional: !!optional,
      doc
    })
  }

  return fields
}

/**
 * Convert TypeScript type to Zod type string
 */
function tsTypeToZod(tsType) {
  // Handle union types like "false | number"
  if (tsType.includes("|")) {
    const parts = tsType.split("|").map((p) => p.trim())
    const zodParts = parts.map((p) => {
      if (p === "false") return "zod.literal(false)"
      if (p === "true") return "zod.literal(true)"
      if (p === "number") return "zod.number()"
      if (p === "string") return "zod.string()"
      if (p === "boolean") return "zod.boolean()"
      return `zod.unknown() /* ${p} */`
    })
    return `zod.union([${zodParts.join(", ")}])`
  }

  // Handle simple types
  switch (tsType) {
    case "number":
      return "zod.number()"
    case "string":
      return "zod.string()"
    case "boolean":
      return "zod.boolean()"
    default:
      return `zod.unknown() /* ${tsType} */`
  }
}

/**
 * Generate Zod schema from parsed LiveSchema fields
 */
function generateZodSchema(fields, sdkUrl) {
  if (fields.length === 0) {
    console.warn("  ⚠️  No fields extracted, generating empty schema")
  }

  const zodFields = fields
    .map((field) => {
      let zodType = tsTypeToZod(field.type)
      if (field.optional) zodType += ".optional()"

      // Extract description from doc URL
      let description = ""
      if (field.doc) {
        // Extract feature name from URL like "https://developers.deepgram.com/docs/interim-results"
        const featureMatch = field.doc.match(/\/docs\/([^/]+)(?:#.*)?$/)
        if (featureMatch) {
          const feature = featureMatch[1].replace(/-/g, " ")
          description = `.describe("${feature} - see ${field.doc}")`
        } else {
          description = `.describe("see ${field.doc}")`
        }
      }

      return `  ${field.name}: ${zodType}${description}`
    })
    .join(",\n")

  return `/**
 * Deepgram Streaming Zod Schemas
 * AUTO-GENERATED from Deepgram JS SDK - DO NOT EDIT MANUALLY
 *
 * @source ${sdkUrl}
 * @see https://developers.deepgram.com/docs/sdk-feature-matrix
 *
 * Batch params come from Orval (OpenAPI) - see deepgramAPISpecification.zod.ts
 * Streaming-only params below are extracted from LiveSchema in the SDK.
 *
 * Regenerate with: pnpm openapi:sync-deepgram-streaming
 */

import { z as zod } from "zod"

/**
 * Deepgram streaming-only params from LiveSchema
 * These extend the batch TranscriptionSchema params
 */
export const deepgramStreamingOnlyParams = zod.object({
${zodFields}
})

/**
 * Re-export for field-configs.ts
 */
export { deepgramStreamingOnlyParams as streamingTranscriberParams }
`
}

function main() {
  try {
    console.log("📥 Generating Deepgram streaming types from SDK...")

    // Check if SDK source exists
    if (!fs.existsSync(SDK_SOURCE)) {
      console.error(`❌ SDK source not found at ${SDK_SOURCE}`)
      console.log("   Run 'pnpm openapi:sync' first to download specs")
      process.exit(1)
    }

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    }

    // Read local SDK TypeScript
    console.log(`  → Parsing ${path.relative(process.cwd(), SDK_SOURCE)}...`)
    const content = fs.readFileSync(SDK_SOURCE, "utf-8")

    // Parse LiveSchema (streaming-only fields)
    const liveFields = parseTypeScriptInterface(content, "LiveSchema")
    console.log(`  ✓ Found ${liveFields.length} streaming-only fields:`)
    liveFields.forEach((f) => console.log(`    - ${f.name}: ${f.type}`))

    // Generate Zod schema
    console.log("  → Generating Zod schemas...")
    const zodContent = generateZodSchema(liveFields, SDK_SOURCE)
    fs.writeFileSync(STREAMING_ZOD_OUTPUT, zodContent)
    console.log(`  ✅ Saved to ${path.relative(process.cwd(), STREAMING_ZOD_OUTPUT)}`)

    console.log("✅ Successfully generated Deepgram streaming types!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Failed to generate Deepgram streaming types:", error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()
