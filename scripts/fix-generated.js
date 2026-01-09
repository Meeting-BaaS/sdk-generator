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
    const constLineIndex = lines.findIndex((line) =>
      line.includes(`export const ${capitalizedParamName} = {`)
    )

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
          let typeLineIndex = -1

          // Find type declaration if it exists
          for (let i = 0; i < constLineIndex; i++) {
            if (lines[i].includes(`export type ${capitalizedParamName}`)) {
              typeLineIndex = i
              break
            }
          }

          // Build header - everything before the type declaration (or before const if no type)
          if (typeLineIndex >= 0) {
            // Header is everything before the type declaration
            header = lines.slice(0, typeLineIndex).join("\n")
          } else {
            // No type declaration - use header up to const (comments, etc.)
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
          }

          // Always add a complete type declaration
          const reconstructed = `${header}

/**
 * ${capitalizedParamName} type definition
 */
export type ${capitalizedParamName} = typeof ${capitalizedParamName}[keyof typeof ${capitalizedParamName}];

export const ${capitalizedParamName} = {
${uniqueProps.join(",\n")}
} as const
`
          if (typeLineIndex >= 0) {
            fixes.push(`Fixed duplicate properties in Deepgram parameter file ${filePath}`)
          } else {
            fixes.push(`Fixed duplicate properties and added missing type in ${filePath}`)
          }
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
    const typeLineIndex = lines.findIndex((line) =>
      line.includes(`export type ${matchedParamName}`)
    )

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
        const normalizedProps = properties
          .map((prop) => {
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
            let cleaned = prop.replace(/,\s*$/, "") // Remove trailing comma
            if (!cleaned.startsWith("  ")) {
              cleaned = "  " + cleaned.trim()
            }
            return cleaned
          })
          .filter(Boolean)

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
 *   'transcript.'txt' → 'transcript.txt'
 *
 * NOTE: This fix is needed for Speechmatics files where Orval mangles
 * enum values that contain dots (e.g., "transcript.txt" becomes "transcript.'txt'")
 */
function fixUnterminatedStrings(content, filePath) {
  // Only apply to Speechmatics zod files - other providers are mostly correct
  if (!filePath.includes("speechmatics") || !filePath.includes(".zod.ts")) {
    return content
  }

  const before = content

  // Fix mangled enum values: 'transcript.'txt' -> 'transcript.txt'
  // Orval sometimes inserts extra quotes after dots in enum values
  // Use a more permissive pattern that handles various word characters
  content = content.replace(/'(\w+)\.'(\w+)'/g, "'$1.$2'")

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
          break // Found the default for this enum
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
  // Handle both double quotes and backticks
  // Replace: formData.append("chunking_strategy", value)
  // With: formData.append("chunking_strategy", typeof value === 'object' ? JSON.stringify(value) : String(value))
  content = content.replace(
    /formData\.append\(["`]chunking_strategy["`],\s+(?!typeof\s)([a-zA-Z._\[\]]+)\)/g,
    'formData.append("chunking_strategy", typeof $1 === "object" ? JSON.stringify($1) : String($1))'
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

  // Find problematic discriminated unions where the first object doesn't have the discriminator
  // Pattern: zod.discriminatedUnion("task", [zod.object({
  // where the object doesn't start with "task":
  // Replace discriminatedUnion with union for these cases
  content = content.replace(
    /zod\.discriminatedUnion\('task',\s*\[zod\.object\(\{/g,
    "zod.union([zod.object({"
  )

  // Also handle double-quoted version
  content = content.replace(
    /zod\.discriminatedUnion\("task",\s*\[zod\.object\(\{/g,
    "zod.union([zod.object({"
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
 * Fix Deepgram mock data where provider values must match the discriminated union
 * The type is a discriminated union where each model type has a specific provider:
 * - OpenAI models (gpt-*) -> 'open_ai'
 * - Anthropic models (claude-*) -> 'anthropic'
 * - Google models (gemini-*) -> 'google'
 * - Groq models (openai/gpt-oss-*) -> 'groq'
 * - Custom models (any string) -> 'aws_bedrock'
 */
function fixDeepgramMockProvider(content, filePath) {
  if (!filePath.includes("deepgram") || !filePath.includes("APISpecification.ts")) {
    return content
  }

  const before = content

  // Fix each model variant with the correct provider
  // Pattern: {id: faker.helpers.arrayElement(['model-ids'...] as const), name: ..., provider: {}}

  // OpenAI models (gpt-5, gpt-4o, etc.) -> 'open_ai'
  content = content.replace(
    /\{id: faker\.helpers\.arrayElement\(\['gpt-5','gpt-5-mini','gpt-5-nano','gpt-4\.1','gpt-4\.1-mini','gpt-4\.1-nano','gpt-4o','gpt-4o-mini'\] as const\), name: faker\.string\.alpha\(20\), provider: (\{\}|"[^"]*")\}/g,
    "{id: faker.helpers.arrayElement(['gpt-5','gpt-5-mini','gpt-5-nano','gpt-4.1','gpt-4.1-mini','gpt-4.1-nano','gpt-4o','gpt-4o-mini'] as const), name: faker.string.alpha(20), provider: 'open_ai'}"
  )

  // Anthropic models (claude-*) -> 'anthropic'
  content = content.replace(
    /\{id: faker\.helpers\.arrayElement\(\['claude-3-5-haiku-latest','claude-sonnet-4-20250514'\] as const\), name: faker\.string\.alpha\(20\), provider: (\{\}|"[^"]*")\}/g,
    "{id: faker.helpers.arrayElement(['claude-3-5-haiku-latest','claude-sonnet-4-20250514'] as const), name: faker.string.alpha(20), provider: 'anthropic'}"
  )

  // Google models (gemini-*) -> 'google'
  content = content.replace(
    /\{id: faker\.helpers\.arrayElement\(\['gemini-2\.5-flash','gemini-2\.0-flash','gemini-2\.0-flash-lite'\] as const\), name: faker\.string\.alpha\(20\), provider: (\{\}|"[^"]*")\}/g,
    "{id: faker.helpers.arrayElement(['gemini-2.5-flash','gemini-2.0-flash','gemini-2.0-flash-lite'] as const), name: faker.string.alpha(20), provider: 'google'}"
  )

  // Groq models (openai/gpt-oss-*) -> 'groq'
  content = content.replace(
    /\{id: faker\.helpers\.arrayElement\(\['openai\/gpt-oss-20b'\] as const\), name: faker\.string\.alpha\(20\), provider: (\{\}|"[^"]*")\}/g,
    "{id: faker.helpers.arrayElement(['openai/gpt-oss-20b'] as const), name: faker.string.alpha(20), provider: 'groq'}"
  )

  // Custom models (any string id) -> 'aws_bedrock'
  content = content.replace(
    /\{id: faker\.string\.alpha\(20\), name: faker\.string\.alpha\(20\), provider: (\{\}|"[^"]*")\}/g,
    "{id: faker.string.alpha(20), name: faker.string.alpha(20), provider: 'aws_bedrock'}"
  )

  if (content !== before) {
    fixes.push(`Fixed mock provider types in ${filePath}`)
  }

  return content
}

/**
 * Fix mismatched default type annotations
 * Orval sometimes generates wrong type annotations for default constants, e.g.:
 *   export const fooDefault: ('a' | 'b')[] = 0.6;  // number assigned to array type
 *   export const barDefault: ('json' | 'text')[] = "json";  // string assigned to array type
 *
 * Fix: Remove the incorrect type annotation and let TypeScript infer the type
 */
function fixMismatchedDefaultTypes(content, filePath) {
  if (!filePath.includes(".zod.ts")) {
    return content
  }

  const before = content

  // Fix: array type annotation with non-array value (number, string, boolean)
  // Pattern: export const fooDefault: (...)[] = <non-array-value>
  // The value might be followed by ; or ;export (all on one line)
  // Replace with: export const fooDefault = <value>
  content = content.replace(
    /export const (\w+):\s*\([^)]+\)\[\]\s*=\s*([\d.]+|"[^"]*"|'[^']*'|true|false)(?=;)/g,
    'export const $1 = $2'
  )

  if (content !== before) {
    fixes.push(`Fixed mismatched default type annotations in ${filePath}`)
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
  // Order matters! fixArrayDefaults must run BEFORE fixMismatchedDefaultTypes
  // because fixArrayDefaults may add type annotations that fixMismatchedDefaultTypes
  // then needs to remove for non-array values
  content = fixExtraCommas(content, filePath)
  content = fixDeepgramParameters(content, filePath)
  content = fixUnterminatedStrings(content, filePath)
  content = fixErrorTypeShadowing(content, filePath)
  content = fixArrayDefaults(content, filePath)
  content = fixMismatchedDefaultTypes(content, filePath)
  content = fixFormDataObjectAppend(content, filePath)
  content = fixDiscriminatedUnionMissingField(content, filePath)
  content = fixEmptyZodArrayCalls(content, filePath)
  content = fixDeepgramMockProvider(content, filePath)

  // Only write if changed
  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf-8")
  }
}

/**
 * Restore manual Deepgram type files
 *
 * Orval cannot properly generate certain Deepgram parameter types due to
 * duplicate definitions in the OpenAPI spec. We maintain manual versions
 * of these files and copy them after generation.
 *
 * Files restored:
 * - speakV1ContainerParameter.ts
 * - speakV1EncodingParameter.ts
 * - speakV1SampleRateParameter.ts
 */
function restoreManualDeepgramFiles() {
  const manualDir = path.join(__dirname, "manual-types", "deepgram")
  const targetDir = path.join(__dirname, "..", "src", "generated", "deepgram", "schema")

  if (!fs.existsSync(manualDir)) {
    console.log("⚠️  Manual Deepgram types directory not found, skipping restore")
    return
  }

  if (!fs.existsSync(targetDir)) {
    console.log("⚠️  Deepgram schema directory not found, skipping restore")
    return
  }

  const manualFiles = [
    "speakV1ContainerParameter.ts",
    "speakV1EncodingParameter.ts",
    "speakV1SampleRateParameter.ts"
  ]

  let restored = 0
  for (const file of manualFiles) {
    const srcPath = path.join(manualDir, file)
    const destPath = path.join(targetDir, file)

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath)
      restored++
      fixes.push(`Restored manual Deepgram file: ${file}`)
    } else {
      console.log(`⚠️  Manual file not found: ${file}`)
    }
  }

  if (restored > 0) {
    console.log(`\n📦 Restored ${restored} manual Deepgram type files`)
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

  // Restore manual Deepgram files after processing
  restoreManualDeepgramFiles()

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
