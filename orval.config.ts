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
 * Deepgram input transformer
 *
 * Handles duplicate parameter conflicts in the Deepgram OpenAPI spec.
 * The spec defines SpeakV1Container, SpeakV1Encoding, SpeakV1SampleRate
 * parameters multiple times with slightly different schemas, causing
 * Orval to generate duplicate type definitions.
 *
 * Solution: Inline these parameters directly into the path operations
 * and remove them from components/parameters to prevent duplicate generation.
 * Manual type files are restored after generation via fix-generated.js.
 */
const deepgramTransformer = (spec: any) => {
  const conflictingParams = [
    "SpeakV1ContainerParameter",
    "SpeakV1EncodingParameter",
    "SpeakV1SampleRateParameter"
  ]

  // Remove conflicting parameters from components
  if (spec.components?.parameters) {
    for (const param of conflictingParams) {
      if (spec.components.parameters[param]) {
        delete spec.components.parameters[param]
      }
    }
  }

  // Inline parameters in paths that reference them
  if (spec.paths) {
    for (const [pathKey, pathValue] of Object.entries(spec.paths)) {
      if (!pathValue || typeof pathValue !== 'object') continue

      for (const [method, operation] of Object.entries(pathValue as Record<string, any>)) {
        if (!operation?.parameters) continue

        operation.parameters = operation.parameters.map((param: any) => {
          if (param.$ref) {
            const refName = param.$ref.split('/').pop()
            if (conflictingParams.includes(refName)) {
              // Inline the parameter based on its name
              if (refName === "SpeakV1ContainerParameter") {
                return {
                  name: "container",
                  in: "query",
                  schema: { type: "string", enum: ["none", "wav", "ogg"] }
                }
              }
              if (refName === "SpeakV1EncodingParameter") {
                return {
                  name: "encoding",
                  in: "query",
                  schema: { type: "string", enum: ["linear16", "aac", "opus", "mp3", "flac", "mulaw", "alaw"] }
                }
              }
              if (refName === "SpeakV1SampleRateParameter") {
                return {
                  name: "sample_rate",
                  in: "query",
                  schema: { type: "integer", enum: [8000, 16000, 22050, 24000, 32000, 48000] }
                }
              }
            }
          }
          return param
        })
      }
    }
  }

  return spec
}

const DEEPGRAM_INPUT = {
  target: "./specs/deepgram-openapi.yml",
  transformer: deepgramTransformer
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
