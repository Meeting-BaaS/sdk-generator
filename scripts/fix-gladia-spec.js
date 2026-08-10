#!/usr/bin/env node

/**
 * Remove empty webhook `responses` objects from the Gladia spec.
 * Upstream added `"responses": {}` to every webhook operation, which fails
 * orval's OpenAPI validation (a Responses Object must have at least one
 * response). Webhooks are not consumed by the generated client, so dropping
 * the empty object restores the previously valid shape.
 */

const fs = require("node:fs")
const path = require("node:path")

const SPEC_PATH = path.join(__dirname, "..", "specs", "gladia-openapi.json")

function removeEmptyWebhookResponses(spec) {
  let removals = 0
  for (const webhook of Object.values(spec.webhooks || {})) {
    for (const operation of Object.values(webhook || {})) {
      if (
        operation &&
        typeof operation === "object" &&
        operation.responses &&
        Object.keys(operation.responses).length === 0
      ) {
        delete operation.responses
        removals++
      }
    }
  }
  return removals
}

function main() {
  console.log("Fixing Gladia webhook responses...")

  if (!fs.existsSync(SPEC_PATH)) {
    console.log(`Gladia spec not found at ${SPEC_PATH}`)
    console.log('Run "pnpm openapi:sync" first')
    return
  }

  const raw = fs.readFileSync(SPEC_PATH, "utf-8")
  const spec = JSON.parse(raw)
  const removals = removeEmptyWebhookResponses(spec)

  if (removals === 0) {
    console.log("No empty webhook responses found — spec unchanged")
    return
  }

  fs.writeFileSync(SPEC_PATH, JSON.stringify(spec), "utf-8")
  console.log(`Removed ${removals} empty webhook responses object(s)`)
}

main()
