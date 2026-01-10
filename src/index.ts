/**
 * Voice Router SDK - Multi-Provider Transcription API
 * Unified interface for Gladia, AssemblyAI, Deepgram, and more
 */

// Main Voice Router exports
export * from "./router"
export * from "./adapters"

// Webhook normalization exports
export * from "./webhooks"

// Field configurations for UI rendering
export * from "./field-configs"

// Provider metadata (capabilities, languages, display names)
export * from "./provider-metadata"

// Provider-specific generated types (for advanced usage)
export * as GladiaTypes from "./generated/gladia/schema"
export * as AssemblyAITypes from "./generated/assemblyai/schema"
export * as DeepgramTypes from "./generated/deepgram/schema"
export * as OpenAITypes from "./generated/openai/schema"
export * as AzureTypes from "./generated/azure/schema"
export * as SpeechmaticsTypes from "./generated/speechmatics/schema"
export * as SonioxTypes from "./generated/soniox/schema"
export * as SonioxStreamingTypes from "./generated/soniox/streaming-types.zod"

// Zod schemas for runtime field config extraction
export * as GladiaZodSchemas from "./generated/gladia/api/gladiaControlAPI.zod"
export * as DeepgramZodSchemas from "./generated/deepgram/api/deepgramAPISpecification.zod"
export * as AssemblyAIZodSchemas from "./generated/assemblyai/api/assemblyAIAPI.zod"
export * as OpenAIZodSchemas from "./generated/openai/api/openAIAPI.zod"
export * as SpeechmaticsZodSchemas from "./generated/speechmatics/api/speechmaticsASRRESTAPI.zod"
export * as SonioxApiZodSchemas from "./generated/soniox/api/sonioxPublicAPI.zod"
export * as SonioxStreamingZodSchemas from "./generated/soniox/streaming-types.zod"

// Zod-to-field-configs utility
export { zodToFieldConfigs, filterFields, excludeFields } from "./utils/zod-to-field-configs"
export type { ZodFieldConfig, FieldType } from "./utils/zod-to-field-configs"
