import { defineConfig } from "orval"

// Transcription Provider OpenAPI Specs
// All specs are stored locally and synced via: pnpm openapi:sync
const GLADIA_INPUT = {
  target: "./specs/gladia-openapi.json"
}

const ASSEMBLYAI_INPUT = {
  target: "./specs/assemblyai-openapi.json"
}

/**
 * Deepgram spec is pre-processed by scripts/fix-deepgram-spec.js
 * to remove duplicate parameter definitions before Orval runs.
 */
const DEEPGRAM_INPUT = {
  target: "./specs/deepgram-openapi.yml"
}

const OPENAI_WHISPER_INPUT = {
  target: "./specs/openai-whisper-openapi.yml"
}

const AZURE_STT_INPUT = {
  target: "./specs/azure-stt-openapi.json"
}

const SPEECHMATICS_INPUT = {
  target: "./specs/speechmatics-batch.yaml"
}

export default defineConfig({
  // Gladia API generation
  gladiaApi: {
    input: GLADIA_INPUT,
    output: {
      target: "./src/generated/gladia/api",
      schemas: "./src/generated/gladia/schema",
      client: "axios-functions",
      mode: "single", // Use single mode instead of tags-split to avoid toSorted issue
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
      mode: "single", // Use single mode for Node 18 compatibility
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
      mode: "single", // Use single mode for Node 18 compatibility
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
      mode: "single", // Use single mode for Node 18 compatibility
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
      mode: "single", // Use single mode for Node 18 compatibility
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
      mode: "single", // Use single mode for Node 18 compatibility
      fileExtension: ".zod.ts",
      biome: true
    }
  },

  // OpenAI Whisper API generation (schemas only due to Node 18 limitations)
  openaiWhisperApi: {
    input: OPENAI_WHISPER_INPUT,
    output: {
      target: "./src/generated/openai/api",
      schemas: "./src/generated/openai/schema",
      client: "axios-functions",
      mode: "single",
      biome: true,
      mock: false, // Disable mock generation
      override: {
        operations: {
          // Only generate types, skip operations to avoid toSorted issue
          Audio: false
        }
      }
    }
  },
  // Generate Zod schemas for OpenAI Whisper
  openaiWhisperZod: {
    input: OPENAI_WHISPER_INPUT,
    output: {
      target: "./src/generated/openai/api",
      client: "zod",
      mode: "single", // Use single mode for Node 18 compatibility
      fileExtension: ".zod.ts",
      biome: true
    }
  },

  // Azure Speech-to-Text API generation
  azureSTTApi: {
    input: AZURE_STT_INPUT,
    output: {
      target: "./src/generated/azure/api",
      schemas: "./src/generated/azure/schema",
      client: "axios-functions",
      mode: "single",
      biome: true,
      mock: {
        type: "msw",
        baseUrl: "https://api.cognitive.microsoft.com"
      }
    }
  },
  // Generate Zod schemas for Azure STT
  azureSTTZod: {
    input: AZURE_STT_INPUT,
    output: {
      target: "./src/generated/azure/api",
      client: "zod",
      mode: "single",
      fileExtension: ".zod.ts",
      biome: true
    }
  },

  // Speechmatics API generation (manual types due to invalid Swagger 2.0 spec)
  // The official spec has validation errors that prevent automatic generation.
  // We'll create manual type definitions based on API documentation.
  // speechmaticsApi: {
  //   input: SPEECHMATICS_INPUT,
  //   output: {
  //     target: "./src/generated/speechmatics/api",
  //     schemas: "./src/generated/speechmatics/schema",
  //     client: "axios-functions",
  //     mode: "single",
  //     biome: true
  //   }
  // },
  // Generate Zod schemas for Speechmatics
  speechmaticsZod: {
    input: SPEECHMATICS_INPUT,
    output: {
      target: "./src/generated/speechmatics/api",
      client: "zod",
      mode: "single",
      fileExtension: ".zod.ts",
      biome: true
    }
  }
})
