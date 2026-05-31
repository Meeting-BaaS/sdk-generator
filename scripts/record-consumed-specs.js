#!/usr/bin/env node

/**
 * Record Consumed Spec Checksums
 *
 * `sync-specs.js` stores `specs[key].sha256` = the hash of the RAW upstream
 * download. But before Orval runs, several specs are rewritten in place by the
 * `fix-*-spec.js` scripts (see `fixedBy` in provider-upstream-manifest.js), so
 * the bytes codegen actually consumes differ from the raw download.
 *
 * This script records `specs[key].consumedSha256` = the hash of the spec file
 * *as it sits on disk now* (i.e. post-fix). Run it right after
 * `pnpm openapi:fix-specs`, so it captures exactly what Orval will read.
 *
 * Together, `sha256` (upstream) and `consumedSha256` (consumed) close the gap
 * between "what we downloaded" and "what our generated code is built from".
 *
 * Usage:
 *   node scripts/record-consumed-specs.js
 *   node scripts/record-consumed-specs.js --check   # report drift, write nothing
 */

const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const { SPEC_SOURCES } = require("./provider-upstream-manifest")

const SPECS_DIR = path.join(__dirname, "..", "specs")
const CHECKSUMS_FILE = path.join(SPECS_DIR, ".checksums.json")

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex")
}

function loadChecksums() {
  try {
    const parsed = JSON.parse(fs.readFileSync(CHECKSUMS_FILE, "utf-8"))
    if (!parsed.specs) parsed.specs = {}
    return parsed
  } catch {
    return { specs: {}, references: {} }
  }
}

function main() {
  const checkOnly = process.argv.includes("--check")
  const checksumData = loadChecksums()

  let changes = 0
  let drift = 0
  let missing = 0

  console.log(
    checkOnly
      ? "🔍 Checking consumed (post-fix) spec checksums..."
      : "📝 Recording consumed (post-fix) spec checksums..."
  )

  for (const [specKey, config] of Object.entries(SPEC_SOURCES)) {
    // Manual specs are not transformed by fix scripts; their sha256 already
    // reflects the on-disk file, so consumed == sha256. Skip them.
    if (config.manual) continue

    const outputPath = path.join(__dirname, "..", config.output)
    if (!fs.existsSync(outputPath)) {
      console.log(`  ⚠️  ${specKey}: spec not found at ${config.output} — run sync/generate first`)
      missing++
      continue
    }

    const entry = (checksumData.specs[specKey] ??= {})
    const onDiskSha = sha256(fs.readFileSync(outputPath))
    const previous = entry.consumedSha256
    const drifted = previous != null && previous !== onDiskSha
    const tag = config.fixedBy ? ` (fixed by ${config.fixedBy})` : ""

    if (drifted) drift++

    if (checkOnly) {
      if (previous == null) {
        console.log(`  📌 ${specKey}: consumed not yet recorded${tag}`)
      } else if (drifted) {
        console.log(
          `  🔄 ${specKey}: consumed changed ${previous.slice(0, 12)} -> ${onDiskSha.slice(0, 12)}${tag}`
        )
      } else {
        console.log(`  ✅ ${specKey}: consumed unchanged${tag}`)
      }
      continue
    }

    if (previous !== onDiskSha) changes++
    entry.consumedSha256 = onDiskSha
    entry.consumedAt = new Date().toISOString()
    if (config.fixedBy) entry.fixedBy = config.fixedBy
    else if (entry.fixedBy) delete entry.fixedBy

    const matchesUpstream = entry.sha256 != null && entry.sha256 === onDiskSha
    const note = config.fixedBy
      ? drifted
        ? "post-fix bytes changed"
        : "post-fix"
      : matchesUpstream
        ? "matches upstream (untransformed)"
        : "untransformed"
    console.log(`  ${changes && previous !== onDiskSha ? "🔄" : "✅"} ${specKey}: ${note}${tag}`)
  }

  if (!checkOnly && changes > 0) {
    checksumData.updatedAt = new Date().toISOString()
    fs.writeFileSync(CHECKSUMS_FILE, JSON.stringify(checksumData, null, 2) + "\n", "utf-8")
    console.log(`\n  💾 Updated ${changes} consumed checksum(s) in specs/.checksums.json`)
  } else if (!checkOnly) {
    console.log("\n  ✅ Consumed checksums already up to date")
  }

  if (checkOnly && drift > 0) {
    console.log(`\n  ⚠️  ${drift} spec(s) drifted from recorded consumed checksum`)
    process.exit(2)
  }
  if (missing > 0 && checkOnly) {
    process.exit(1)
  }
}

main()
