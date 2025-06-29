import { defineConfig } from "orval"

const SHARED_INPUT = {
  target: "https://api.meetingbaas.com/openapi.json",
  override: {
    transformer: "./scripts/preprocess.js"
  }
}

export default defineConfig({
  baasApi: {
    input: SHARED_INPUT,
    output: {
      target: "./src/generated/api",
      schemas: "./src/generated/schema",
      client: "axios-functions",
      mode: "tags-split",
      biome: true,
      mock: {
        type: "msw",
        baseUrl: "https://api.meetingbaas.com"
      }
    }
  },
  // Generate Zod schemas
  baasZod: {
    input: SHARED_INPUT,
    output: {
      target: "./src/generated/api",
      client: "zod",
      mode: "tags-split",
      fileExtension: ".zod.ts",
      biome: true
    }
  }
})
