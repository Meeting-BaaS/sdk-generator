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

  // Unwrap ZodUnion with null (e.g., .or(zod.null()) pattern)
  // This is common in OpenAPI specs for nullable fields
  if (inner._def?.typeName === "ZodUnion") {
    const options = inner._def.options || []
    // Find non-null/undefined option
    const nonNullOption = options.find(
      (opt: z.ZodTypeAny) =>
        opt._def?.typeName !== "ZodNull" && opt._def?.typeName !== "ZodUndefined"
    )
    if (nonNullOption && options.length === 2) {
      // It's a simple T | null union, extract T
      inner = nonNullOption
    }
  }

  // Recursively unwrap if we found a wrapper inside a wrapper
  // e.g., ZodDefault(ZodUnion(ZodEnum, ZodNull))
  const innerTypeName = inner._def?.typeName
  if (
    innerTypeName === "ZodOptional" ||
    innerTypeName === "ZodNullable" ||
    innerTypeName === "ZodDefault" ||
    innerTypeName === "ZodUnion"
  ) {
    // Check if current inner differs from what we started with at this level
    if (inner !== schema) {
      const recursed = unwrapZodType(inner)
      return { inner: recursed.inner, required: required && recursed.required }
    }
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

    case "ZodRecord":
      // Record types like zod.record(zod.string(), zod.any()) - arbitrary key-value objects
      baseConfig.type = "object"
      baseConfig.inputFormat = "json"
      break

    case "ZodUnion":
    case "ZodDiscriminatedUnion":
      // For unions, try to extract common type or use first non-null option
      const unionOptions = inner._def?.options || []
      if (unionOptions.length > 0) {
        // Find first non-null/undefined option
        const substantiveOption = unionOptions.find(
          (opt: z.ZodTypeAny) =>
            opt._def?.typeName !== "ZodNull" && opt._def?.typeName !== "ZodUndefined"
        )
        if (substantiveOption) {
          const optTypeName = getZodTypeName(substantiveOption)
          if (optTypeName === "ZodEnum" || optTypeName === "ZodNativeEnum") {
            baseConfig.type = "select"
            baseConfig.options = getEnumValues(substantiveOption)
          } else if (optTypeName === "ZodString") {
            baseConfig.type = "string"
          } else if (optTypeName === "ZodArray") {
            baseConfig.type = "array"
            baseConfig.inputFormat = "comma-separated"
          } else if (optTypeName === "ZodNumber") {
            baseConfig.type = "number"
          } else if (optTypeName === "ZodBoolean") {
            baseConfig.type = "boolean"
          }
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
 * Extract shape from various Zod schema types
 */
function extractShape(schema: z.ZodTypeAny): Record<string, z.ZodTypeAny> {
  const typeName = getZodTypeName(schema)
  // Cast to any for accessing internal Zod properties
  const def = schema._def as any

  // Handle objects with .shape function but no _def (created for recursive calls)
  if (!def && typeof (schema as any).shape === "function") {
    return (schema as any).shape()
  }

  switch (typeName) {
    case "ZodObject":
      return def?.shape?.() || (schema as any).shape || {}

    case "ZodIntersection":
      // Merge shapes from both sides of intersection
      const left = extractShape(def?.left)
      const right = extractShape(def?.right)
      return { ...left, ...right }

    case "ZodUnion":
      // For unions, try first option that's an object
      const options = def?.options || []
      for (const opt of options) {
        const shape = extractShape(opt)
        if (Object.keys(shape).length > 0) return shape
      }
      return {}

    case "ZodEffects":
      // Unwrap effects (refinements, transforms)
      return extractShape(def?.schema)

    default:
      return {}
  }
}

/**
 * Convert a Zod schema to an array of field configs
 *
 * Supports ZodObject, ZodIntersection, ZodUnion, and ZodEffects.
 *
 * @param schema - Zod schema (object, intersection, union, etc.)
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
export function zodToFieldConfigs(schema: z.ZodTypeAny): ZodFieldConfig[] {
  const shape = extractShape(schema)
  const fields: ZodFieldConfig[] = []

  for (const [key, value] of Object.entries(shape)) {
    fields.push(zodFieldToConfig(key, value as z.ZodTypeAny))
  }

  return fields
}

/**
 * Filter field configs to only include specified fields
 */
export function filterFields(fields: ZodFieldConfig[], include: string[]): ZodFieldConfig[] {
  return fields.filter((f) => include.includes(f.name))
}

/**
 * Exclude specific fields from field configs
 */
export function excludeFields(fields: ZodFieldConfig[], exclude: string[]): ZodFieldConfig[] {
  return fields.filter((f) => !exclude.includes(f.name))
}
