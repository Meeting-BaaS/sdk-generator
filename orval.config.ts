import { defineConfig } from "orval"

const V1_INPUT = {
  target: "https://api.meetingbaas.com/openapi.json",
  override: {
    transformer: "./scripts/preprocess.js"
  }
}

// No preprocessing needed for v2 (v2 has proper defaults in OpenAPI spec)
const V2_INPUT = {
  target: "https://api.pre-prod-meetingbaas.com/v2/openapi.json"
}

export default defineConfig({
  // v1 API generation (existing, reorganized to v1 directory)
  baasApiV1: {
    input: V1_INPUT,
    output: {
      target: "./src/generated/v1/api",
      schemas: "./src/generated/v1/schema",
      client: "axios-functions",
      mode: "tags-split",
      biome: true,
      mock: {
        type: "msw",
        baseUrl: "https://api.meetingbaas.com"
      }
    }
  },
  // Generate Zod schemas for v1
  baasZodV1: {
    input: V1_INPUT,
    output: {
      target: "./src/generated/v1/api",
      client: "zod",
      mode: "tags-split",
      fileExtension: ".zod.ts",
      biome: true
    }
  },
  // v2 API generation (new)
  baasApiV2: {
    input: V2_INPUT,
    output: {
      target: "./src/generated/v2/api",
      schemas: "./src/generated/v2/schema",
      client: "axios-functions",
      mode: "tags-split",
      biome: true,
      mock: {
        type: "msw",
        baseUrl: "https://api.meetingbaas.com"
      }
    }
  },
  // Generate Zod schemas for v2
  baasZodV2: {
    input: V2_INPUT,
    output: {
      target: "./src/generated/v2/api",
      client: "zod",
      mode: "tags-split",
      fileExtension: ".zod.ts",
      biome: true
    }
  }
})
