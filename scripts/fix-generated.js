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
 * Fix malformed Deepgram parameter files where the const object declaration is missing
 * Example malformed input:
 *   export type Foo = typeof Foo[keyof typeof Foo] ;
 *   prop1',
 *     prop2: 'value',
 *   } as const
 *
 * Should be:
 *   export type Foo = typeof Foo[keyof typeof Foo];
 *   export const Foo = {
 *     prop1: 'prop1',
 *     prop2: 'value',
 *   } as const;
 */
function fixDeepgramParameters(content, filePath) {
  if (!filePath.includes("/deepgram/schema/") || !filePath.includes("Parameter.ts")) {
    return content
  }

  const before = content
  const lines = content.split("\n")

  // Extract parameter name from filename
  const paramNameMatch = filePath.match(/\/(\w+Parameter)\.ts$/)
  if (!paramNameMatch) return content

  const paramName = paramNameMatch[1]
  const capitalizedParamName = paramName.charAt(0).toUpperCase() + paramName.slice(1)

  // Check if file has export const declaration
  const hasConstDeclaration = content.includes(`export const ${capitalizedParamName} = {`)
  const hasTypeDeclaration = content.includes(`export type ${capitalizedParamName}`)

  // Case 1: Has const but might have duplicate properties or malformed syntax
  if (hasConstDeclaration) {
    const constLineIndex = lines.findIndex(line => line.includes(`export const ${capitalizedParamName} = {`))

    if (constLineIndex >= 0) {
      // Find the closing brace
      let endIndex = -1
      for (let i = constLineIndex + 1; i < lines.length; i++) {
        if (lines[i].includes("} as const")) {
          endIndex = i
          break
        }
      }

      if (endIndex > constLineIndex) {
        // Extract properties and remove duplicates
        const propertiesSection = lines.slice(constLineIndex + 1, endIndex)
        const seenKeys = new Set()
        const uniqueProps = []

        for (const line of propertiesSection) {
          const trimmed = line.trim()
          if (trimmed === "") continue

          // Extract key from property
          const keyMatch = trimmed.match(/^(\w+):/)
          if (keyMatch) {
            const key = keyMatch[1]
            if (!seenKeys.has(key)) {
              seenKeys.add(key)
              // Clean up the property line
              let cleaned = trimmed.replace(/,\s*$/, "")
              uniqueProps.push(`  ${cleaned}`)
            }
          }
        }

        if (uniqueProps.length > 0) {
          // Reconstruct the file
          let header = ""
          let hasTypeDecl = false

          // Find type declaration if it exists
          for (let i = 0; i < constLineIndex; i++) {
            if (lines[i].includes(`export type ${capitalizedParamName}`)) {
              header = lines.slice(0, i + 1).join("\n")
              hasTypeDecl = true
              break
            }
          }

          if (!hasTypeDecl) {
            // No type declaration found - need to add it
            // Use header up to const (comments, etc.)
            const headerLines = []
            for (let i = 0; i < constLineIndex; i++) {
              // Skip eslint-disable and empty lines right before const
              const line = lines[i]
              if (line.includes("eslint-disable") && i === constLineIndex - 1) {
                continue
              }
              headerLines.push(line)
            }
            header = headerLines.join("\n")

            // Add type declaration
            const reconstructed = `${header}

/**
 * ${capitalizedParamName} type definition
 */
export type ${capitalizedParamName} = typeof ${capitalizedParamName}[keyof typeof ${capitalizedParamName}];

export const ${capitalizedParamName} = {
${uniqueProps.join(",\n")}
} as const
`
            fixes.push(`Fixed duplicate properties and added missing type in ${filePath}`)
            return reconstructed
          }

          const reconstructed = `${header}

export const ${capitalizedParamName} = {
${uniqueProps.join(",\n")}
} as const
`
          fixes.push(`Fixed duplicate properties in Deepgram parameter file ${filePath}`)
          return reconstructed
        }
      }
    }

    // Fix malformed closing syntax like `} as const] ;`
    if (content.includes("} as const]")) {
      content = content.replace(/\} as const\]\s*;/g, "} as const")
      fixes.push(`Fixed malformed closing syntax in ${filePath}`)
    }

    return content
  }

  // Case 2: Missing const declaration - reconstruct from orphaned properties
  const typeMatch = content.match(/export type (\w+Parameter) = typeof \1\[keyof typeof \1\]\s*;/)

  if (typeMatch && !hasConstDeclaration) {
    const matchedParamName = typeMatch[1]

    // Find where properties start and reconstruct
    const typeLineIndex = lines.findIndex(line => line.includes(`export type ${matchedParamName}`))

    if (typeLineIndex >= 0) {
      // Collect all orphaned properties
      const properties = []
      let foundAsConst = false

      for (let i = typeLineIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim()

        if (line === "") continue
        if (line.includes("} as const")) {
          foundAsConst = true
          break
        }

        // Match property patterns: "prop:" or "prop',"
        if (line.match(/^(\w+)['"]?\s*[:,]/) || line.match(/^(\w+):/)) {
          properties.push(line)
        }
      }

      if (foundAsConst && properties.length > 0) {
        // Reconstruct the file properly
        const header = lines.slice(0, typeLineIndex + 1).join("\n")

        // Normalize properties and remove duplicates
        const seenKeys = new Set()
        const normalizedProps = properties.map(prop => {
          // Handle malformed patterns like "opus',"
          const malformedMatch = prop.match(/^(\w+)'\s*,?$/)
          if (malformedMatch) {
            const key = malformedMatch[1]
            if (seenKeys.has(key)) return null
            seenKeys.add(key)
            return `  ${key}: '${key}'`
          }

          // Handle normal properties, ensure proper formatting
          if (!prop.includes(":")) return null

          // Extract key
          const keyMatch = prop.match(/^(\w+):/)
          if (keyMatch) {
            const key = keyMatch[1]
            if (seenKeys.has(key)) return null
            seenKeys.add(key)
          }

          // Clean up and ensure consistent format
          let cleaned = prop.replace(/,\s*$/, "")  // Remove trailing comma
          if (!cleaned.startsWith("  ")) {
            cleaned = "  " + cleaned.trim()
          }
          return cleaned
        }).filter(Boolean)

        const reconstructed = `${header}

export const ${matchedParamName} = {
${normalizedProps.join(",\n")}
} as const
`

        fixes.push(`Reconstructed malformed Deepgram parameter file ${filePath}`)
        return reconstructed
      }
    }

    // If we couldn't reconstruct, warn and return original
    fixes.push(`⚠️  SKIPPED malformed file ${filePath} - could not reconstruct`)
    return before
  }

  return content
}

/**
 * Fix unterminated string literals in generated files
 * Handles cases where Orval generates unquoted strings that end with quotes
 *
 * Examples:
 *   opus', → 'opus',
 *   'key': value', → 'key': 'value',
 *
 * NOTE: This fix is only needed for specific Speechmatics files
 * Most Deepgram and AssemblyAI files have properly quoted strings
 */
function fixUnterminatedStrings(content, filePath) {
  // Only apply to Speechmatics zod files - other providers are mostly correct
  if (!filePath.includes("/speechmatics/") || !filePath.includes(".zod.ts")) {
    return content
  }

  const before = content

  // Only fix simple standalone enum values
  // Match: word', (not after a colon or quote) and replace with: 'word',
  content = content.replace(/(?<![':\w-])\b(\w+)'\s*,/g, "'$1',")

  if (content !== before) {
    fixes.push(`Fixed unterminated strings in ${filePath}`)
  }

  return content
}

/**
 * Fix shadowing of global Error type in OpenAI generated files
 * Example: import type { Error } from './error'
 * Should be: import type { Error as ErrorType } from './error'
 */
function fixErrorTypeShadowing(content, filePath) {
  const before = content

  // Rename Error imports to ErrorType to avoid shadowing global Error
  content = content.replace(
    /import type \{ Error \} from '\.\/error'/g,
    "import type { Error as ErrorType } from './error'"
  )

  // Update references from Error to ErrorType
  if (content !== before) {
    content = content.replace(/:\s*Error([;\s])/g, ": ErrorType$1")
    content = content.replace(/Error\[\]/g, "ErrorType[]")
    fixes.push(`Fixed Error type shadowing in ${filePath}`)
  }

  return content
}

/**
 * Fix array default values by adding proper type annotations
 * Zod enums need specific tuple types, but default constants are inferred as string[]
 * Solution: Add union type annotation to the array constant (e.g., ("word" | "segment")[])
 */
function fixArrayDefaults(content, filePath) {
  const before = content

  // Strategy: Find all enum definitions and their associated default constants
  // Look for patterns like:
  // .enum([values]) ... .default(constantName)
  // Can be across multiple lines with various method calls in between

  const constantTypes = new Map()

  // Split content into lines for easier processing
  const lines = content.split("\n")

  // Track when we see an enum and look ahead for a matching .default()
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Find enum definitions: .enum(["value1", "value2"])
    const enumMatch = line.match(/\.enum\((\[[^\]]+\])\)/)
    if (enumMatch) {
      const enumArray = enumMatch[1]

      // Look ahead for .default() calls (within next 20 lines to handle deeply nested structures)
      for (let j = i; j < Math.min(i + 20, lines.length); j++) {
        const defaultMatch = lines[j].match(/\.default\(([a-zA-Z]\w*Default)\)/)
        if (defaultMatch) {
          const constantName = defaultMatch[1]

          // Parse enum values to create a union type
          const values = enumArray.match(/"([^"]+)"|'([^']+)'/g) || []
          const unionType = values.join(" | ")

          constantTypes.set(constantName, `(${unionType})[]`)
          break  // Found the default for this enum
        }
      }
    }
  }

  // Add type annotations to the array constants
  // Handle both single-line and multi-line definitions manually
  let fixCount = 0
  const contentLines = content.split("\n")

  for (const [constantName, typeAnnotation] of constantTypes.entries()) {
    // Find the line with the constant declaration
    for (let i = 0; i < contentLines.length; i++) {
      if (contentLines[i].includes(`export const ${constantName} =`)) {
        // Check if array is on same line
        if (contentLines[i].includes("[") && contentLines[i].includes("]")) {
          // Single line: export const Foo = [...]
          contentLines[i] = contentLines[i].replace(
            `export const ${constantName} =`,
            `export const ${constantName}: ${typeAnnotation} =`
          )
          fixCount++
        } else if (i + 1 < contentLines.length && contentLines[i + 1].trim().startsWith("[")) {
          // Multi-line: export const Foo =\n  [...]
          contentLines[i] = contentLines[i].replace(
            `export const ${constantName} =`,
            `export const ${constantName}: ${typeAnnotation} =`
          )
          fixCount++
        }
        break
      }
    }
  }

  content = contentLines.join("\n")

  if (fixCount > 0) {
    fixes.push(`Added type annotations to array defaults in ${filePath} (${fixCount} constants)`)
  }

  // Fallback: For any remaining .default(arrayConstant) without type annotation, use 'as any'
  // This catches constants that are too far from their enum definition
  // Handle both single-line and multi-line .default() calls
  let fallbackCount = 0

  // Single-line: .default(constantName)
  content = content.replace(
    /\.default\(([a-zA-Z]\w*Default)\)/g,
    (match, constantName) => {
      // Check if this constant is an array that doesn't have a type annotation yet
      const hasTypeAnnotation = new RegExp(`export const ${constantName}:[^=]+=`).test(content)
      const isArrayConstant = new RegExp(`export const ${constantName} =[\\s\\S]{0,20}\\[`).test(content)

      if (!hasTypeAnnotation && isArrayConstant) {
        fallbackCount++
        return `.default(${constantName} as any)`
      }
      return match
    }
  )

  // Multi-line: .default(\n      constantName\n    )
  content = content.replace(
    /\.default\(\s*\n\s*([a-zA-Z]\w*Default)\s*\n\s*\)/g,
    (match, constantName) => {
      // Check if this constant is an array that doesn't have a type annotation yet
      const hasTypeAnnotation = new RegExp(`export const ${constantName}:[^=]+=`).test(content)
      const isArrayConstant = new RegExp(`export const ${constantName} =[\\s\\S]{0,20}\\[`).test(content)

      if (!hasTypeAnnotation && isArrayConstant) {
        fallbackCount++
        return `.default(${constantName} as any)`
      }
      return match
    }
  )

  if (fallbackCount > 0) {
    fixes.push(`Added 'as any' fallback for ${fallbackCount} array defaults in ${filePath}`)
  }

  return content
}

/**
 * Fix FormData.append calls that try to append objects
 * Objects need to be serialized to JSON strings for FormData
 */
function fixFormDataObjectAppend(content, filePath) {
  const before = content

  // Find FormData.append calls with chunking_strategy (which can be an object)
  // Only match if not already wrapped with typeof check
  // Replace: formData.append("chunking_strategy", value)
  // With: formData.append("chunking_strategy", typeof value === 'object' ? JSON.stringify(value) : value)
  content = content.replace(
    /formData\.append\("chunking_strategy",\s+(?!typeof\s)([a-zA-Z._\[\]]+)\)/g,
    "formData.append(\"chunking_strategy\", typeof $1 === 'object' ? JSON.stringify($1) : $1)"
  )

  if (content !== before) {
    fixes.push(`Fixed FormData object append in ${filePath}`)
  }

  return content
}

/**
 * Fix discriminated unions where first variant is missing the discriminator field
 * This is an Orval bug - we'll convert discriminatedUnion to regular union
 */
function fixDiscriminatedUnionMissingField(content, filePath) {
  const before = content

  // Find problematic discriminated unions where the discriminator appears after some objects
  // Pattern: zod.discriminatedUnion("task", [
  //   zod.object({ no task field }),
  //   zod.object({ task: ... })
  // Replace discriminatedUnion with union for these cases
  content = content.replace(
    /zod\.discriminatedUnion\("task",\s*\[\s*zod\s*\.object\(\{\s*text:/g,
    "zod.union([\n  zod.object({\n      text:"
  )

  if (content !== before) {
    fixes.push(`Fixed discriminated union to regular union in ${filePath}`)
  }

  return content
}

/**
 * Fix empty zod.array() calls that are missing schema parameter
 * Orval bug: generates .array(zod.array()) instead of .array(zod.array(zod.string()))
 * Replace with zod.array(zod.unknown()) as a safe default
 */
function fixEmptyZodArrayCalls(content, filePath) {
  const before = content

  // Replace .array(zod.array()) with .array(zod.array(zod.unknown()))
  content = content.replace(/\.array\(zod\.array\(\)\)/g, ".array(zod.array(zod.unknown()))")

  if (content !== before) {
    fixes.push(`Fixed empty zod.array() calls in ${filePath}`)
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
  content = fixErrorTypeShadowing(content, filePath)
  content = fixArrayDefaults(content, filePath)
  content = fixFormDataObjectAppend(content, filePath)
  content = fixDiscriminatedUnionMissingField(content, filePath)
  content = fixEmptyZodArrayCalls(content, filePath)

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

  const patterns = [".zod.ts", "Parameter.ts", "/schema/", "/api/"]

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
