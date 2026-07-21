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

type ZodShape = Record<string, z.ZodTypeAny>

type ZodCheck = {
  kind?: string
  value?: number
  _zod?: {
    def?: {
      check?: string
      value?: number
    }
  }
}

type ZodInternalDef = {
  checks?: ZodCheck[]
  defaultValue?: unknown | (() => unknown)
  description?: string
  element?: z.ZodTypeAny
  entries?: Record<string, string | number>
  in?: z.ZodTypeAny
  innerType?: z.ZodTypeAny
  left?: z.ZodTypeAny
  options?: z.ZodTypeAny[]
  right?: z.ZodTypeAny
  schema?: z.ZodTypeAny
  shape?: ZodShape | (() => ZodShape)
  type?: string | z.ZodTypeAny
  typeName?: string
  value?: unknown
  values?: readonly (string | number)[]
}

type ZodSchemaInternals = {
  _def?: ZodInternalDef
  description?: string
  element?: z.ZodTypeAny
  maxValue?: number | null
  minValue?: number | null
  options?: readonly z.ZodTypeAny[] | readonly (string | number)[]
  shape?: ZodShape | (() => ZodShape)
}

const ZOD_V4_TYPE_NAMES: Readonly<Record<string, string>> = {
  array: "ZodArray",
  boolean: "ZodBoolean",
  default: "ZodDefault",
  enum: "ZodEnum",
  intersection: "ZodIntersection",
  literal: "ZodLiteral",
  null: "ZodNull",
  nullable: "ZodNullable",
  number: "ZodNumber",
  object: "ZodObject",
  optional: "ZodOptional",
  pipe: "ZodEffects",
  record: "ZodRecord",
  string: "ZodString",
  undefined: "ZodUndefined",
  union: "ZodUnion"
}

function getSchemaInternals(schema: z.ZodTypeAny): ZodSchemaInternals {
  return schema as unknown as ZodSchemaInternals
}

function getZodDef(schema: z.ZodTypeAny): ZodInternalDef | undefined {
  return getSchemaInternals(schema)._def
}

function getUnionOptions(schema: z.ZodTypeAny): z.ZodTypeAny[] {
  const defOptions = getZodDef(schema)?.options
  if (defOptions) return defOptions

  const schemaOptions = getSchemaInternals(schema).options
  return Array.isArray(schemaOptions) ? (schemaOptions as z.ZodTypeAny[]) : []
}

/**
 * Extract the inner type from optional/nullable wrappers
 */
function unwrapZodType(schema: z.ZodTypeAny): { inner: z.ZodTypeAny; required: boolean } {
  let inner = schema
  let required = true

  for (;;) {
    const typeName = getZodTypeName(inner)
    const def = getZodDef(inner)

    if (typeName === "ZodOptional") {
      required = false
      if (!def?.innerType) break
      inner = def.innerType
      continue
    }

    if (typeName === "ZodNullable" || typeName === "ZodDefault") {
      if (!def?.innerType) break
      inner = def.innerType
      continue
    }

    if (typeName === "ZodUnion") {
      const options = getUnionOptions(inner)
      const substantiveOptions = options.filter((option) => {
        const optionTypeName = getZodTypeName(option)
        return optionTypeName !== "ZodNull" && optionTypeName !== "ZodUndefined"
      })

      if (options.length === 2 && substantiveOptions.length === 1) {
        inner = substantiveOptions[0]
        continue
      }
    }

    break
  }

  return { inner, required }
}

/**
 * Get the Zod type name
 */
function getZodTypeName(schema: z.ZodTypeAny): string {
  const def = getZodDef(schema)
  if (typeof def?.typeName === "string") return def.typeName
  if (typeof def?.type === "string") return ZOD_V4_TYPE_NAMES[def.type] ?? "Unknown"
  return "Unknown"
}

/**
 * Extract description from Zod schema
 */
function getDescription(schema: z.ZodTypeAny): string | undefined {
  return getZodDef(schema)?.description || getSchemaInternals(schema).description
}

/**
 * Extract min/max from Zod number schema
 */
function getNumberConstraints(schema: z.ZodTypeAny): { min?: number; max?: number } {
  const constraints: { min?: number; max?: number } = {}
  const { minValue, maxValue } = getSchemaInternals(schema)

  if (typeof minValue === "number" && Number.isFinite(minValue)) constraints.min = minValue
  if (typeof maxValue === "number" && Number.isFinite(maxValue)) constraints.max = maxValue

  for (const check of getZodDef(schema)?.checks ?? []) {
    const checkName = check.kind ?? check._zod?.def?.check
    const value = check.value ?? check._zod?.def?.value

    if ((checkName === "min" || checkName === "greater_than") && typeof value === "number") {
      constraints.min = value
    }
    if ((checkName === "max" || checkName === "less_than") && typeof value === "number") {
      constraints.max = value
    }
  }

  return constraints
}

/**
 * Extract enum values from Zod enum schema
 */
function getEnumValues(schema: z.ZodTypeAny): readonly (string | number)[] | undefined {
  const typeName = getZodTypeName(schema)
  if (typeName !== "ZodEnum" && typeName !== "ZodNativeEnum") return undefined

  const schemaOptions = getSchemaInternals(schema).options
  if (Array.isArray(schemaOptions)) return schemaOptions as readonly (string | number)[]

  const def = getZodDef(schema)
  if (def?.values) return def.values
  if (def?.entries) return Object.values(def.entries)
  return []
}

function readZodShape(shape: ZodShape | (() => ZodShape) | undefined): ZodShape {
  if (typeof shape === "function") {
    return shape()
  }

  return shape ?? {}
}

function fieldConfigsFromShape(shape: ZodShape): ZodFieldConfig[] {
  return Object.entries(shape).map(([key, value]) => zodFieldToConfig(key, value))
}

/**
 * Extract default value from Zod schema
 */
function getDefaultValue(schema: z.ZodTypeAny): unknown {
  const def = getZodDef(schema)
  if (getZodTypeName(schema) === "ZodDefault") {
    return typeof def?.defaultValue === "function" ? def.defaultValue() : def?.defaultValue
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

    case "ZodNumber": {
      baseConfig.type = "number"
      const constraints = getNumberConstraints(inner)
      if (constraints.min !== undefined) baseConfig.min = constraints.min
      if (constraints.max !== undefined) baseConfig.max = constraints.max
      break
    }

    case "ZodBoolean":
      baseConfig.type = "boolean"
      break

    case "ZodEnum":
    case "ZodNativeEnum":
      baseConfig.type = "select"
      baseConfig.options = getEnumValues(inner)
      break

    case "ZodArray": {
      baseConfig.type = "array"
      baseConfig.inputFormat = "comma-separated"
      // Check if array items are enum (multiselect)
      const def = getZodDef(inner)
      const defType = def?.type
      const itemType =
        getSchemaInternals(inner).element ??
        def?.element ??
        (typeof defType === "object" ? defType : undefined)
      if (itemType && getZodTypeName(itemType) === "ZodEnum") {
        baseConfig.type = "multiselect"
        baseConfig.options = getEnumValues(itemType)
      }
      break
    }

    case "ZodObject": {
      baseConfig.type = "object"
      // Recursively extract nested fields
      const internals = getSchemaInternals(inner)
      const shape = readZodShape(internals.shape ?? getZodDef(inner)?.shape)
      if (Object.keys(shape).length > 0) {
        baseConfig.nestedFields = fieldConfigsFromShape(shape)
      }
      break
    }

    case "ZodRecord":
      // Record types like zod.record(zod.string(), zod.any()) - arbitrary key-value objects
      baseConfig.type = "object"
      baseConfig.inputFormat = "json"
      break

    case "ZodUnion":
    case "ZodDiscriminatedUnion": {
      const unionOptions = getUnionOptions(inner)
      const substantiveOptions = unionOptions.filter(
        (option) =>
          getZodTypeName(option) !== "ZodNull" && getZodTypeName(option) !== "ZodUndefined"
      )
      const objectShapes = substantiveOptions.map(extractShape)

      if (objectShapes.length > 0 && objectShapes.every((shape) => Object.keys(shape).length > 0)) {
        baseConfig.type = "object"
        baseConfig.nestedFields = fieldConfigsFromShape(Object.assign({}, ...objectShapes))
        break
      }

      const substantiveOption = substantiveOptions[0]
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
      break
    }

    case "ZodLiteral":
      baseConfig.type = "select"
      baseConfig.options = (getZodDef(inner)?.values ?? [getZodDef(inner)?.value]).filter(
        (value): value is string | number => typeof value === "string" || typeof value === "number"
      )
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
  const def = getZodDef(schema)
  const schemaInternals = getSchemaInternals(schema)

  // Handle objects with .shape function but no _def (created for recursive calls)
  if (!def && typeof schemaInternals.shape === "function") {
    return schemaInternals.shape()
  }

  switch (typeName) {
    case "ZodObject":
      return readZodShape(schemaInternals.shape ?? def?.shape)

    case "ZodIntersection": {
      // Merge shapes from both sides of intersection
      const left = def?.left ? extractShape(def.left) : {}
      const right = def?.right ? extractShape(def.right) : {}
      return { ...left, ...right }
    }

    case "ZodUnion": {
      const options = getUnionOptions(schema)
      const mergedShape: ZodShape = {}
      for (const opt of options) {
        Object.assign(mergedShape, extractShape(opt))
      }
      return mergedShape
    }

    case "ZodEffects":
      // Unwrap effects (refinements, transforms)
      return def?.schema || def?.in ? extractShape(def.schema ?? (def.in as z.ZodTypeAny)) : {}

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
