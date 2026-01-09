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

// Provider-specific generated types (for advanced usage)
export * as GladiaTypes from "./generated/gladia/schema"
export * as AssemblyAITypes from "./generated/assemblyai/schema"
export * as DeepgramTypes from "./generated/deepgram/schema"
export * as OpenAITypes from "./generated/openai/schema"
export * as AzureTypes from "./generated/azure/schema"
