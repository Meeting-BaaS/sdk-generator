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

const fs = require("node:fs")
const path = require("node:path")
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

  const baseUrlFixes = normalizeSwaggerBaseUrl(spec)
  if (baseUrlFixes > 0) {
    console.log("✅ Normalized absolute Swagger basePath")
  }

  const deprecatedFixes = normalizeDefinitionDeprecations(spec.definitions)
  if (deprecatedFixes > 0) {
    console.log(`✅ Preserved ${deprecatedFixes} schema deprecation(s) as x-deprecated`)
  }

  const scalarFixes = fixTrailingCommaScalars(spec)
  if (scalarFixes > 0) {
    console.log(`✅ Fixed ${scalarFixes} trailing comma scalar value(s)`)
  }

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

function normalizeSwaggerBaseUrl(spec) {
  if (typeof spec.basePath !== "string" || !/^https?:\/\//.test(spec.basePath)) return 0

  const baseUrl = new URL(spec.basePath)
  spec.host = baseUrl.host
  spec.basePath = baseUrl.pathname || "/"
  spec.schemes = [baseUrl.protocol.replace(/:$/, "")]
  return 1
}

function normalizeDefinitionDeprecations(value) {
  if (!value || typeof value !== "object") return 0

  let fixes = 0
  if (Object.hasOwn(value, "deprecated")) {
    value["x-deprecated"] = value.deprecated
    delete value.deprecated
    fixes++
  }

  for (const child of Object.values(value)) {
    fixes += normalizeDefinitionDeprecations(child)
  }

  return fixes
}

function fixTrailingCommaScalars(value) {
  if (!value || typeof value !== "object") return 0

  let fixes = 0
  for (const [key, child] of Object.entries(value)) {
    if ((key === "type" || key === "format") && typeof child === "string" && child.endsWith(",")) {
      value[key] = child.replace(/,+$/, "")
      fixes++
      continue
    }

    fixes += fixTrailingCommaScalars(child)
  }

  return fixes
}

main()
