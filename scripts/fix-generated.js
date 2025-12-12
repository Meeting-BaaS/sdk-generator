#!/usr/bin/env node

/**
 * Post-generation fixer for Orval-generated code
 * Fixes common syntax errors in generated TypeScript files
 */

const fs = require("fs")
const path = require("path")

const fixes = []

/**
 * Recursively find files matching patterns
 */
function findFiles(dir, patterns) {
  const results = []

  function walk(currentDir) {
    if (!fs.existsSync(currentDir)) return

    const files = fs.readdirSync(currentDir)

    for (const file of files) {
      const filePath = path.join(currentDir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        walk(filePath)
      } else if (stat.isFile()) {
        // Check if file matches any pattern
        for (const pattern of patterns) {
          if (filePath.includes(pattern)) {
            results.push(filePath)
            break
          }
        }
      }
    }
  }

  walk(dir)
  return results
}

/**
 * Fix extra commas before export statements in Zod files
 * Example: ",export const foo = 1;" -> "export const foo = 1;"
 */
function fixExtraCommas(content, filePath) {
  const before = content
  // Remove commas before export statements
  content = content.replace(/,\s*export\s+const\s+/g, "export const ")

  if (content !== before) {
    fixes.push(`Fixed extra commas in ${filePath}`)
  }

  return content
}

/**
 * Fix malformed Deepgram parameter files
 * Example:
 *   export type Foo = typeof Foo[keyof typeof Foo] ;
 *   ,
 *   NUMBER_16000: 16000,
 *
 * Should be:
 *   export const Foo = {
 *   NUMBER_16000: 16000,
 */
function fixDeepgramParameters(content, filePath) {
  const before = content

  // Pattern: export type Foo = ... ;\n,\n  prop: value,
  // This indicates the object definition got separated from the type
  const pattern = /(export type \w+Parameter = typeof \w+Parameter\[keyof typeof \w+Parameter\] ;\s*),\s*\n/g

  if (pattern.test(content)) {
    // This file is malformed - likely the object definition is missing
    // Try to reconstruct by finding the orphaned object
    const lines = content.split("\n")
    let fixed = []
    let skipNext = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Skip lone commas
      if (line.trim() === ",") {
        skipNext = true
        continue
      }

      // If we just skipped a comma and this looks like an object property
      if (skipNext && /^\s+\w+:/.test(line)) {
        // This is part of an orphaned object - skip this file for now
        // These need manual fixing or spec correction
        fixes.push(`⚠️  SKIPPED malformed file ${filePath} - needs manual fix or spec correction`)
        return before // Return original, don't try to auto-fix
      }

      fixed.push(line)
      skipNext = false
    }

    content = fixed.join("\n")
  }

  if (content !== before) {
    fixes.push(`Fixed Deepgram parameter syntax in ${filePath}`)
  }

  return content
}

/**
 * Fix unterminated string literals in generated files
 * Example: opus', should be 'opus',
 */
function fixUnterminatedStrings(content, filePath) {
  const before = content

  // Look for patterns like: word', instead of 'word',
  content = content.replace(/(\w+)'\s*,/g, "'$1',")

  if (content !== before) {
    fixes.push(`Fixed unterminated strings in ${filePath}`)
  }

  return content
}

/**
 * Process a single file
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8")
  const original = content

  // Apply all fixes
  content = fixExtraCommas(content, filePath)
  content = fixDeepgramParameters(content, filePath)
  content = fixUnterminatedStrings(content, filePath)

  // Only write if changed
  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf-8")
  }
}

/**
 * Main function
 */
function main() {
  console.log("🔧 Fixing generated TypeScript files...")

  const patterns = [".zod.ts", "Parameter.ts"]

  const generatedDir = path.join(__dirname, "..", "src", "generated")
  const files = findFiles(generatedDir, patterns)

  console.log(`Found ${files.length} generated files to check`)

  for (const file of files) {
    try {
      processFile(file)
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message)
    }
  }

  if (fixes.length > 0) {
    console.log("\n✅ Fixes applied:")
    fixes.forEach((fix) => console.log(`  - ${fix}`))
  } else {
    console.log("\n✨ No fixes needed - all files are clean!")
  }
}

// Run if called directly
if (require.main === module) {
  try {
    main()
  } catch (error) {
    console.error("Fatal error:", error)
    process.exit(1)
  }
}

module.exports = { main }
