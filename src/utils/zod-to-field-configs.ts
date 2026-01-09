/**
 * Zod Schema to Field Config Converter
 *
 * Extracts field metadata from Zod schemas at runtime.
 * This eliminates hardcoding - Zod schemas (generated from OpenAPI) are the source of truth.
 *
 * @example
 * ```typescript
 * import { zodToFieldConfigs } from 'voice-router-dev'
 * import { listenV1MediaTranscribeParams } from 'voice-router-dev/generated/deepgram'
 *
 * const fields = zodToFieldConfigs(listenV1MediaTranscribeParams)
 * // → [{ name: "keywords", type: "array", description: "...", ... }]
 * ```
 *
 * @packageDocumentation
 */

import type { z } from "zod"

/**
 * Field type for UI rendering
 */
export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "select"
  | "multiselect"
  | "array"
  | "object"

/**
 * Field configuration extracted from Zod schema
 */
export interface ZodFieldConfig {
  /** Field name (from schema key) */
  name: string
  /** Field type for UI rendering */
  type: FieldType
  /** Description from .describe() */
  description?: string
  /** Default value */
  default?: unknown
  /** Whether field is required */
  required: boolean
  /** Enum options for select types */
  options?: readonly (string | number)[]
  /** Minimum value for numbers */
  min?: number
  /** Maximum value for numbers */
  max?: number
  /** Nested fields for object types */
  nestedFields?: ZodFieldConfig[]
  /** Input format hint (e.g., "comma-separated" for arrays) */
  inputFormat?: "comma-separated" | "json"
}

/**
 * Extract the inner type from optional/nullable wrappers
 */
function unwrapZodType(schema: z.ZodTypeAny): { inner: z.ZodTypeAny; required: boolean } {
  let inner = schema
  let required = true

  // Unwrap ZodOptional
  if (inner._def?.typeName === "ZodOptional") {
    required = false
    inner = inner._def.innerType
  }

  // Unwrap ZodNullable
  if (inner._def?.typeName === "ZodNullable") {
    inner = inner._def.innerType
  }

  // Unwrap ZodDefault (has a default value)
  if (inner._def?.typeName === "ZodDefault") {
    inner = inner._def.innerType
  }

  return { inner, required }
}

/**
 * Get the Zod type name
 */
function getZodTypeName(schema: z.ZodTypeAny): string {
  return schema._def?.typeName || "Unknown"
}

/**
 * Extract description from Zod schema
 */
function getDescription(schema: z.ZodTypeAny): string | undefined {
  return schema._def?.description || schema.description
}

/**
 * Extract min/max from Zod number schema
 */
function getNumberConstraints(schema: z.ZodTypeAny): { min?: number; max?: number } {
  const checks = schema._def?.checks || []
  const constraints: { min?: number; max?: number } = {}

  for (const check of checks) {
    if (check.kind === "min") {
      constraints.min = check.value
    }
    if (check.kind === "max") {
      constraints.max = check.value
    }
  }

  return constraints
}

/**
 * Extract enum values from Zod enum schema
 */
function getEnumValues(schema: z.ZodTypeAny): readonly (string | number)[] | undefined {
  if (schema._def?.typeName === "ZodEnum") {
    return schema._def.values
  }
  if (schema._def?.typeName === "ZodNativeEnum") {
    return Object.values(schema._def.values)
  }
  return undefined
}

/**
 * Extract default value from Zod schema
 */
function getDefaultValue(schema: z.ZodTypeAny): unknown {
  if (schema._def?.typeName === "ZodDefault") {
    return typeof schema._def.defaultValue === "function"
      ? schema._def.defaultValue()
      : schema._def.defaultValue
  }
  return undefined
}

/**
 * Convert a single Zod field to FieldConfig
 */
function zodFieldToConfig(name: string, schema: z.ZodTypeAny): ZodFieldConfig {
  const { inner, required } = unwrapZodType(schema)
  const typeName = getZodTypeName(inner)
  const description = getDescription(schema) || getDescription(inner)
  const defaultValue = getDefaultValue(schema)

  const baseConfig: ZodFieldConfig = {
    name,
    type: "string", // Default, will be overridden
    required,
    description
  }

  if (defaultValue !== undefined) {
    baseConfig.default = defaultValue
  }

  switch (typeName) {
    case "ZodString":
      baseConfig.type = "string"
      break

    case "ZodNumber":
      baseConfig.type = "number"
      const constraints = getNumberConstraints(inner)
      if (constraints.min !== undefined) baseConfig.min = constraints.min
      if (constraints.max !== undefined) baseConfig.max = constraints.max
      break

    case "ZodBoolean":
      baseConfig.type = "boolean"
      break

    case "ZodEnum":
    case "ZodNativeEnum":
      baseConfig.type = "select"
      baseConfig.options = getEnumValues(inner)
      break

    case "ZodArray":
      baseConfig.type = "array"
      baseConfig.inputFormat = "comma-separated"
      // Check if array items are enum (multiselect)
      const itemType = inner._def?.type
      if (itemType && getZodTypeName(itemType) === "ZodEnum") {
        baseConfig.type = "multiselect"
        baseConfig.options = getEnumValues(itemType)
      }
      break

    case "ZodObject":
      baseConfig.type = "object"
      // Recursively extract nested fields
      const shape = inner._def?.shape?.()
      if (shape) {
        baseConfig.nestedFields = zodToFieldConfigs({ shape: () => shape } as z.ZodObject<any>)
      }
      break

    case "ZodUnion":
    case "ZodDiscriminatedUnion":
      // For unions, try to extract common type or use first option
      const options = inner._def?.options || []
      if (options.length > 0) {
        const firstOption = options[0]
        const firstTypeName = getZodTypeName(firstOption)
        if (firstTypeName === "ZodString") {
          baseConfig.type = "string"
        } else if (firstTypeName === "ZodArray") {
          baseConfig.type = "array"
          baseConfig.inputFormat = "comma-separated"
        }
      }
      break

    case "ZodLiteral":
      baseConfig.type = "select"
      baseConfig.options = [inner._def?.value]
      break

    default:
      // Fall back to string for unknown types
      baseConfig.type = "string"
  }

  return baseConfig
}

/**
 * Convert a Zod object schema to an array of field configs
 *
 * @param schema - Zod object schema (e.g., listenV1MediaTranscribeParams)
 * @returns Array of field configurations for UI rendering
 *
 * @example
 * ```typescript
 * import { zodToFieldConfigs } from 'voice-router-dev'
 * import { listenV1MediaTranscribeParams } from 'voice-router-dev/generated/deepgram'
 *
 * const fields = zodToFieldConfigs(listenV1MediaTranscribeParams)
 * console.log(fields)
 * // [
 * //   { name: "model", type: "select", options: ["nova-3", ...], description: "AI model..." },
 * //   { name: "language", type: "string", description: "BCP-47 language tag..." },
 * //   { name: "punctuate", type: "boolean", description: "Add punctuation..." },
 * //   ...
 * // ]
 * ```
 */
export function zodToFieldConfigs(schema: z.ZodObject<any>): ZodFieldConfig[] {
  const shape = schema._def?.shape?.() || schema.shape || {}
  const fields: ZodFieldConfig[] = []

  for (const [key, value] of Object.entries(shape)) {
    fields.push(zodFieldToConfig(key, value as z.ZodTypeAny))
  }

  return fields
}

/**
 * Filter field configs to only include specified fields
 */
export function filterFields(
  fields: ZodFieldConfig[],
  include: string[]
): ZodFieldConfig[] {
  return fields.filter((f) => include.includes(f.name))
}

/**
 * Exclude specific fields from field configs
 */
export function excludeFields(
  fields: ZodFieldConfig[],
  exclude: string[]
): ZodFieldConfig[] {
  return fields.filter((f) => !exclude.includes(f.name))
}
