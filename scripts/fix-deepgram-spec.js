/**
 * Fix Deepgram OpenAPI spec - Remove duplicate schemas
 *
 * The official Deepgram OpenAPI spec has duplicate schema definitions:
 * - SpeakV1ContainerParameter (2x)
 * - SpeakV1EncodingParameter (2x)
 * - SpeakV1SampleRateParameter (2x)
 *
 * This script downloads the spec, removes duplicates, and saves it locally.
 */

const fs = require("node:fs")
const path = require("node:path")
const https = require("node:https")

const DEEPGRAM_SPEC_URL =
  "https://raw.githubusercontent.com/deepgram/deepgram-api-specs/main/openapi.yml"
const OUTPUT_PATH = path.join(__dirname, "../specs/deepgram-openapi.yml")

console.log("🔧 Fixing Deepgram OpenAPI spec...")

// Download spec
https
  .get(DEEPGRAM_SPEC_URL, (res) => {
    let data = ""

    res.on("data", (chunk) => {
      data += chunk
    })

    res.on("end", () => {
      console.log("✅ Downloaded Deepgram OpenAPI spec")

      // Remove duplicate schemas by keeping only the first occurrence
      const lines = data.split("\n")
      const seenSchemas = new Set()
      const result = []
      let inSchemaDefinition = false
      let currentSchemaName = null
      let skipUntilNextSchema = false
      let indentLevel = 0

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // Detect schema definitions under components/schemas
        if (line.match(/^\s{4}\w+Parameter:$/)) {
          const match = line.match(/^\s{4}(\w+Parameter):$/)
          if (match) {
            currentSchemaName = match[1]
            indentLevel = line.search(/\S/)

            if (seenSchemas.has(currentSchemaName)) {
              console.log(`⚠️  Removing duplicate schema: ${currentSchemaName}`)
              skipUntilNextSchema = true
              continue
            } else {
              seenSchemas.add(currentSchemaName)
              skipUntilNextSchema = false
            }
          }
        }

        // Skip lines if we're in a duplicate schema
        if (skipUntilNextSchema) {
          // Check if we've reached the next schema (same indent level)
          const lineIndent = line.search(/\S/)
          if (lineIndent >= 0 && lineIndent <= indentLevel && line.match(/^\s{4}\w+:/)) {
            // We've reached the next schema
            skipUntilNextSchema = false

            // Check if this is also a duplicate
            const match = line.match(/^\s{4}(\w+):$/)
            if (match) {
              currentSchemaName = match[1]
              if (seenSchemas.has(currentSchemaName)) {
                console.log(`⚠️  Removing duplicate schema: ${currentSchemaName}`)
                skipUntilNextSchema = true
                continue
              } else {
                seenSchemas.add(currentSchemaName)
              }
            }
          } else {
            continue
          }
        }

        result.push(line)
      }

      const fixed = result.join("\n")

      // Save fixed spec
      fs.writeFileSync(OUTPUT_PATH, fixed, "utf8")
      console.log(`✅ Fixed Deepgram spec saved to: ${OUTPUT_PATH}`)
      console.log(
        `📊 Removed duplicates: SpeakV1ContainerParameter, SpeakV1EncodingParameter, SpeakV1SampleRateParameter`
      )
    })
  })
  .on("error", (err) => {
    console.error("❌ Error downloading Deepgram spec:", err.message)
    process.exit(1)
  })
