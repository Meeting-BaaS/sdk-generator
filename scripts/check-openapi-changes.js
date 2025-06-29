#!/usr/bin/env node

/**
 * Script to check for OpenAPI specification changes
 * Used by GitHub Actions to determine if SDK needs updating
 */

const fs = require("node:fs")
const path = require("node:path")

const OPENAPI_URL = "https://api.meetingbaas.com/openapi.json"
const SPEC_FILE = path.join(__dirname, "..", "open-api", "openapi-spec.json")

async function fetchOpenAPI() {
  try {
    const response = await fetch(OPENAPI_URL)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const spec = await response.json()
    return spec
  } catch (error) {
    throw new Error(`Failed to fetch OpenAPI spec: ${error.message}`)
  }
}

function loadPreviousSpec() {
  try {
    if (fs.existsSync(SPEC_FILE)) {
      const data = fs.readFileSync(SPEC_FILE, "utf8")
      return JSON.parse(data)
    }
  } catch (error) {
    console.warn("Could not load previous spec:", error.message)
  }
  return null
}

function saveSpec(spec) {
  fs.writeFileSync(SPEC_FILE, JSON.stringify(spec, null, 2))
  console.log("OpenAPI spec saved to:", SPEC_FILE)
}

function compareSpecs(current, previous) {
  if (!previous) {
    console.log("No previous spec found, treating as new")
    return { hasChanges: true, changes: ["Initial spec"] }
  }

  const changes = []

  // Compare versions
  if (current.info?.version !== previous.info?.version) {
    changes.push(`API version changed: ${previous.info?.version} → ${current.info?.version}`)
  }

  // Compare paths
  const currentPaths = Object.keys(current.paths || {})
  const previousPaths = Object.keys(previous.paths || {})

  const addedPaths = currentPaths.filter((path) => !previousPaths.includes(path))
  const removedPaths = previousPaths.filter((path) => !currentPaths.includes(path))

  if (addedPaths.length > 0) {
    changes.push(`Added endpoints: ${addedPaths.join(", ")}`)
  }

  if (removedPaths.length > 0) {
    changes.push(`Removed endpoints: ${removedPaths.join(", ")}`)
  }

  // Compare schemas
  const currentSchemas = Object.keys(current.components?.schemas || {})
  const previousSchemas = Object.keys(previous.components?.schemas || {})

  const addedSchemas = currentSchemas.filter((schema) => !previousSchemas.includes(schema))
  const removedSchemas = previousSchemas.filter((schema) => !currentSchemas.includes(schema))

  if (addedSchemas.length > 0) {
    changes.push(`Added schemas: ${addedSchemas.join(", ")}`)
  }

  if (removedSchemas.length > 0) {
    changes.push(`Removed schemas: ${removedSchemas.join(", ")}`)
  }

  const hasChanges = changes.length > 0

  return { hasChanges, changes }
}

async function main() {
  try {
    console.log("Fetching current OpenAPI specification...")
    const currentSpec = await fetchOpenAPI()

    console.log("Loading previous specification...")
    const previousSpec = loadPreviousSpec()

    console.log("Comparing specifications...")
    const { hasChanges, changes } = compareSpecs(currentSpec, previousSpec)

    if (hasChanges) {
      console.log("✅ Changes detected:")
      changes.forEach((change) => console.log(`  - ${change}`))

      console.log("Saving new specification...")
      saveSpec(currentSpec)

      // Exit with code 1 to indicate changes (useful for CI)
      process.exit(1)
    } else {
      console.log("✅ No changes detected")
      process.exit(0)
    }
  } catch (error) {
    console.error("❌ Error:", error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { fetchOpenAPI, compareSpecs }
