/**
 * Voice Router SDK - Multi-Provider Transcription API
 * Unified interface for Gladia, AssemblyAI, Deepgram, and more
 */

export * from "./adapters"
// Main Voice Router exports
export * from "./router"

// Note: Webhooks are NOT exported here to keep main entry browser-safe (no node:crypto)
// Import webhooks separately: import { WebhookRouter } from 'voice-router-dev/webhooks'

// Field configurations for UI rendering
export * from "./field-configs"
export * as AssemblyAIZodSchemas from "./generated/assemblyai/api/assemblyAIAPI.zod"
export * as AssemblyAITypes from "./generated/assemblyai/schema"
export * as AzureTypes from "./generated/azure/schema"
export * as DeepgramZodSchemas from "./generated/deepgram/api/deepgramAPI.zod"
export * as DeepgramTypes from "./generated/deepgram/schema"
export * as ElevenLabsZodSchemas from "./generated/elevenlabs/api/elevenLabsSpeechToTextAPI.zod"
export * as ElevenLabsTypes from "./generated/elevenlabs/schema"
// Zod schemas for runtime field config extraction
export * as GladiaZodSchemas from "./generated/gladia/api/gladiaControlAPI.zod"
// Provider-specific generated types (for advanced usage)
export * as GladiaTypes from "./generated/gladia/schema"
export * as OpenAIZodSchemas from "./generated/openai/api/openAIAudioRealtimeAPI.zod"
export * as OpenAITypes from "./generated/openai/schema"
export * as OpenAIStreamingTypes from "./generated/openai/streaming-types"
export * as SonioxApiZodSchemas from "./generated/soniox/api/sonioxPublicAPI.zod"
export * as SonioxTypes from "./generated/soniox/schema"
export * as SonioxSDK from "./generated/soniox/sdk-types"
export * as SonioxStreamingTypes from "./generated/soniox/streaming-types.zod"
export * as SonioxStreamingZodSchemas from "./generated/soniox/streaming-types.zod"
export * as SpeechmaticsZodSchemas from "./generated/speechmatics/api/speechmaticsASRRESTAPI.zod"
export * as SpeechmaticsTypes from "./generated/speechmatics/schema"
// Provider metadata (capabilities, languages, display names)
export * from "./provider-metadata"
// Error taxonomy and retry classification
export type { ErrorCode, StandardError } from "./utils/errors"
export {
  ERROR_CODES,
  errnoToErrorCode,
  extractValidationErrors,
  httpStatusToErrorCode,
  isRetryableErrorCode,
  RETRYABLE_ERROR_CODES
} from "./utils/errors"
export type { FieldType, ZodFieldConfig } from "./utils/zod-to-field-configs"
// Zod-to-field-configs utility
export { excludeFields, filterFields, zodToFieldConfigs } from "./utils/zod-to-field-configs"
