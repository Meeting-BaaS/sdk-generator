#!/usr/bin/env node

/**
 * Remove Azure example references that point outside the downloaded spec.
 * Examples do not affect generated API contracts, and their target files are
 * not part of the standalone upstream download.
 */

const fs = require("node:fs")
const path = require("node:path")

const SPEC_PATH = path.join(__dirname, "..", "specs", "azure-stt-openapi.json")

function removeExternalExamples(value) {
  if (!value || typeof value !== "object") return 0

  let removals = 0
  if (Object.hasOwn(value, "x-ms-examples")) {
    delete value["x-ms-examples"]
    removals++
  }

  for (const child of Object.values(value)) {
    removals += removeExternalExamples(child)
  }

  return removals
}

function main() {
  console.log("Fixing Azure Speech-to-Text example references...")

  if (!fs.existsSync(SPEC_PATH)) {
    console.log(`Azure spec not found at ${SPEC_PATH}`)
    console.log('Run "pnpm openapi:sync" first')
    return
  }

  const spec = JSON.parse(fs.readFileSync(SPEC_PATH, "utf-8"))
  const removals = removeExternalExamples(spec)

  fs.writeFileSync(SPEC_PATH, `${JSON.stringify(spec, null, 2)}\n`, "utf-8")
  console.log(`Removed ${removals} external x-ms-examples block(s)`)
}

main()
