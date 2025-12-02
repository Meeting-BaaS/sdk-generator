const fs = require("node:fs")
const path = require("node:path")

/**
 * Post-processing script to fix TypeScript type issues in generated Zod schemas.
 *
 * Fixes cases where array default values are inferred as string[] instead of
 * the proper enum tuple type (e.g., ("srt" | "vtt")[]).
 */
function fixZodDefaults(filePath) {
  let content = fs.readFileSync(filePath, "utf8")
  let modified = false

  // Pattern 1: Fix array defaults for enum arrays
  // Match: export const ...FormatsDefault = ["srt"]
  // Replace with: export const ...FormatsDefault = ["srt"] as const
  const formatsDefaultPattern = /(export const \w+FormatsDefault = \[[\s\n]*"[^"]+"[\s\n]*\])/g
  const matches = content.match(formatsDefaultPattern)

  if (matches) {
    matches.forEach((match) => {
      if (!match.includes("as const")) {
        const fixed = `${match} as const`
        content = content.replace(match, fixed)
        modified = true
      }
    })
  }

  // Pattern 2: More general - fix any array default that's used with enum arrays
  // This is a more aggressive fix that looks for the pattern where we have:
  // .array(zod.enum([...])).default(constantName)
  // and the constant is defined as an array literal
  // Commented out - only fixing the specific FormatsDefault issue for now
  /*
  const enumArrayPattern =
    /\.array\(zod\.enum\(\["([^"]+)",\s*"([^"]+)"\]\)\)[\s\n]*\.default\([\s\n]*(\w+Default)\)/g
  let enumArrayMatch = enumArrayPattern.exec(content)
  while (enumArrayMatch !== null) {
    const constantName = enumArrayMatch[3]
    const constantPattern = new RegExp(
      `(export const ${constantName} = \\[[\\s\\n]*"[^"]+"[\\s\\n]*\\])`,
      "g"
    )
    const constantMatch = content.match(constantPattern)
    if (constantMatch && !constantMatch[0].includes("as const")) {
      const fixed = constantMatch[0] + " as const"
      content = content.replace(constantMatch[0], fixed)
      modified = true
    }
    enumArrayMatch = enumArrayPattern.exec(content)
  }
  */

  if (modified) {
    fs.writeFileSync(filePath, content, "utf8")
    console.log(`Fixed type issues in: ${filePath}`)
  }
}

/**
 * Recursively find and fix all .zod.ts files
 */
function processDirectory(dir) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      processDirectory(filePath)
    } else if (file.endsWith(".zod.ts")) {
      fixZodDefaults(filePath)
    }
  }
}

// Export functions for use in other scripts
module.exports = { fixZodDefaults, processDirectory }

// If run directly, process files/directories passed as arguments (from orval hook)
// or fall back to processing the generated v2 directory
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.length > 0) {
    // Process files/directories passed by orval hook
    for (const arg of args) {
      const fullPath = path.isAbsolute(arg) ? arg : path.join(process.cwd(), arg)
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) {
          processDirectory(fullPath)
        } else if (fullPath.endsWith(".zod.ts")) {
          fixZodDefaults(fullPath)
        }
      }
    }
    console.log("Post-processing complete!")
  } else {
    // Fallback: process the generated v2 directory
    const generatedDir = path.join(__dirname, "..", "src", "generated", "v2")
    if (fs.existsSync(generatedDir)) {
      processDirectory(generatedDir)
      console.log("Post-processing complete!")
    } else {
      console.log("Generated directory not found, skipping post-processing")
    }
  }
}
