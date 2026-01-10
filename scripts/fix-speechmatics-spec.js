#!/usr/bin/env node

/**
 * Fix Speechmatics Batch OpenAPI Spec
 *
 * The Speechmatics batch.yml from the SDK uses YAML anchors (*ref_0, *ref_1)
 * that orval/swagger-parser doesn't handle correctly. This script expands
 * the anchors inline so orval can process the spec.
 *
 * @see https://github.com/speechmatics/speechmatics-js-sdk/tree/main/packages/batch-client/schema
 */

const fs = require("fs")
const path = require("path")
const yaml = require("js-yaml")

const SPEC_PATH = path.join(__dirname, "..", "specs", "speechmatics-batch.yml")

function main() {
  console.log("🔧 Fixing Speechmatics batch spec YAML anchors...\n")

  if (!fs.existsSync(SPEC_PATH)) {
    console.log("⚠️  Speechmatics spec not found at", SPEC_PATH)
    console.log('   Run "pnpm openapi:sync" first')
    return
  }

  // Read and parse YAML (js-yaml automatically resolves anchors!)
  const content = fs.readFileSync(SPEC_PATH, "utf-8")
  const spec = yaml.load(content)

  // Write back as YAML (anchors are now expanded)
  const fixedContent = yaml.dump(spec, {
    lineWidth: -1, // Don't wrap lines
    noRefs: true, // Don't use YAML references (expand them)
    quotingType: '"',
    forceQuotes: false
  })

  fs.writeFileSync(SPEC_PATH, fixedContent)
  console.log("✅ Fixed Speechmatics spec - YAML anchors expanded")
}

main()
