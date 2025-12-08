import { defineConfig } from "orval"

// Transcription Provider OpenAPI Specs
const GLADIA_INPUT = {
  target: "https://api.gladia.io/openapi.json"
}

const ASSEMBLYAI_INPUT = {
  target: "https://raw.githubusercontent.com/AssemblyAI/assemblyai-api-spec/main/openapi.json"
}

const DEEPGRAM_INPUT = {
  target: "./specs/deepgram-openapi.yml"
}

export default defineConfig({
  // Gladia API generation
  gladiaApi: {
    input: GLADIA_INPUT,
    output: {
      target: "./src/generated/gladia/api",
      schemas: "./src/generated/gladia/schema",
      client: "axios-functions",
      mode: "single",  // Use single mode instead of tags-split to avoid toSorted issue
      biome: true,
      mock: {
        type: "msw",
        baseUrl: "https://api.gladia.io"
      }
    }
  },
  // Generate Zod schemas for Gladia
  gladiaZod: {
    input: GLADIA_INPUT,
    output: {
      target: "./src/generated/gladia/api",
      client: "zod",
      mode: "tags-split",
      fileExtension: ".zod.ts",
      biome: true
    }
  },

  // AssemblyAI API generation
  assemblyaiApi: {
    input: ASSEMBLYAI_INPUT,
    output: {
      target: "./src/generated/assemblyai/api",
      schemas: "./src/generated/assemblyai/schema",
      client: "axios-functions",
      mode: "tags-split",
      biome: true,
      mock: {
        type: "msw",
        baseUrl: "https://api.assemblyai.com"
      }
    }
  },
  // Generate Zod schemas for AssemblyAI
  assemblyaiZod: {
    input: ASSEMBLYAI_INPUT,
    output: {
      target: "./src/generated/assemblyai/api",
      client: "zod",
      mode: "tags-split",
      fileExtension: ".zod.ts",
      biome: true
    }
  },

  // Deepgram API generation
  deepgramApi: {
    input: DEEPGRAM_INPUT,
    output: {
      target: "./src/generated/deepgram/api",
      schemas: "./src/generated/deepgram/schema",
      client: "axios-functions",
      mode: "single",  // Use single mode for Node 18 compatibility
      biome: true,
      mock: {
        type: "msw",
        baseUrl: "https://api.deepgram.com"
      }
    }
  },
  // Generate Zod schemas for Deepgram
  deepgramZod: {
    input: DEEPGRAM_INPUT,
    output: {
      target: "./src/generated/deepgram/api",
      client: "zod",
      mode: "single",  // Use single mode for Node 18 compatibility
      fileExtension: ".zod.ts",
      biome: true
    }
  }
})
