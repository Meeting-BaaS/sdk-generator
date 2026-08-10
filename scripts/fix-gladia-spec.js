#!/usr/bin/env node

/**
 * Remove empty webhook `responses` objects from the Gladia spec, and pin the
 * volatile date/date-time `example` values that upstream stamps with the
 * current server time on every fetch.
 *
 * Upstream added `"responses": {}` to every webhook operation, which fails
 * orval's OpenAPI validation (a Responses Object must have at least one
 * response). Webhooks are not consumed by the generated client, so dropping
 * the empty object restores the previously valid shape.
 *
 * Example pinning keeps the post-fix bytes identical across daily fetches so
 * the publish-time sync leaves a clean tree (canonicalizeForHash masks the
 * same values for upstream-change detection).
 */

const fs = require("node:fs")
const path = require("node:path")

const SPEC_PATH = path.join(__dirname, "..", "specs", "gladia-openapi.json")

const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const PINNED_TIMESTAMP = "2026-01-01T00:00:00.000Z"
const PINNED_DATE = "2026-01-01"

function pinVolatileExamples(value) {
  if (!value || typeof value !== "object") return 0

  let pins = 0
  if (typeof value.example === "string") {
    if (ISO_TIMESTAMP_RE.test(value.example) && value.example !== PINNED_TIMESTAMP) {
      value.example = PINNED_TIMESTAMP
      pins++
    } else if (ISO_DATE_RE.test(value.example) && value.example !== PINNED_DATE) {
      value.example = PINNED_DATE
      pins++
    }
  }

  for (const child of Object.values(value)) {
    pins += pinVolatileExamples(child)
  }

  return pins
}

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
  const pins = pinVolatileExamples(spec)

  if (removals === 0 && pins === 0) {
    console.log("No empty webhook responses or volatile examples found — spec unchanged")
    return
  }

  fs.writeFileSync(SPEC_PATH, JSON.stringify(spec), "utf-8")
  console.log(
    `Removed ${removals} empty webhook responses object(s), pinned ${pins} volatile example(s)`
  )
}

main()
