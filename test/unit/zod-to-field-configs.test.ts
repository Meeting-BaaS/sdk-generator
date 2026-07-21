import { describe, expect, it } from "vitest"
import { z } from "zod"
import {
  excludeFields,
  filterFields,
  zodToFieldConfigs
} from "../../src/utils/zod-to-field-configs"

describe("zodToFieldConfigs", () => {
  it("extracts Zod 4 field types, metadata, defaults, and constraints", () => {
    const schema = z.object({
      name: z.string().describe("Display name"),
      retries: z.number().min(1).max(5).default(3),
      enabled: z.boolean().optional(),
      mode: z.enum(["fast", "accurate"]),
      tags: z.array(z.enum(["one", "two"])),
      metadata: z.record(z.string(), z.unknown()),
      nested: z.object({ count: z.number() }),
      fixed: z.literal("value")
    })

    expect(zodToFieldConfigs(schema)).toEqual([
      {
        name: "name",
        type: "string",
        required: true,
        description: "Display name"
      },
      {
        name: "retries",
        type: "number",
        required: true,
        description: undefined,
        default: 3,
        min: 1,
        max: 5
      },
      {
        name: "enabled",
        type: "boolean",
        required: false,
        description: undefined
      },
      {
        name: "mode",
        type: "select",
        required: true,
        description: undefined,
        options: ["fast", "accurate"]
      },
      {
        name: "tags",
        type: "multiselect",
        required: true,
        description: undefined,
        inputFormat: "comma-separated",
        options: ["one", "two"]
      },
      {
        name: "metadata",
        type: "object",
        required: true,
        description: undefined,
        inputFormat: "json"
      },
      {
        name: "nested",
        type: "object",
        required: true,
        description: undefined,
        nestedFields: [
          {
            name: "count",
            type: "number",
            required: true,
            description: undefined
          }
        ]
      },
      {
        name: "fixed",
        type: "select",
        required: true,
        description: undefined,
        options: ["value"]
      }
    ])
  })

  it("unwraps nullable unions and transformed object schemas", () => {
    const nullable = z.object({ language: z.enum(["en", "fr"]).or(z.null()) })
    const transformed = z
      .object({ source: z.string(), priority: z.number() })
      .transform((value) => value)

    expect(zodToFieldConfigs(nullable)[0]).toMatchObject({
      name: "language",
      type: "select",
      options: ["en", "fr"]
    })
    expect(zodToFieldConfigs(transformed).map(({ name }) => name)).toEqual(["source", "priority"])
  })

  it("merges intersection shapes and filters extracted fields", () => {
    const fields = zodToFieldConfigs(
      z.intersection(z.object({ first: z.string() }), z.object({ second: z.boolean() }))
    )

    expect(fields.map(({ name }) => name)).toEqual(["first", "second"])
    expect(filterFields(fields, ["second"]).map(({ name }) => name)).toEqual(["second"])
    expect(excludeFields(fields, ["first"]).map(({ name }) => name)).toEqual(["second"])
  })

  it("merges nested object-union branches", () => {
    const fields = zodToFieldConfigs(
      z.object({
        request: z.union([
          z.object({
            translation: z.object({ target_languages: z.array(z.string()) })
          }),
          z.object({ summarization: z.object({ summary_type: z.string() }) })
        ])
      })
    )

    expect(fields[0]).toMatchObject({
      name: "request",
      type: "object",
      nestedFields: [
        {
          name: "translation",
          type: "object",
          nestedFields: [{ name: "target_languages", type: "array" }]
        },
        {
          name: "summarization",
          type: "object",
          nestedFields: [{ name: "summary_type", type: "string" }]
        }
      ]
    })
  })
})
