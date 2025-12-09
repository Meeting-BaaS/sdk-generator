/**
 * Voice Router SDK - Multi-Provider Transcription API
 * Unified interface for Gladia, AssemblyAI, Deepgram, and more
 */

// Main Voice Router exports
export * from "./router"
export * from "./adapters"

// Webhook normalization exports
export * from "./webhooks"

// Provider-specific generated types (for advanced usage)
export * as GladiaTypes from "./generated/gladia/schema"
export * as AssemblyAITypes from "./generated/assemblyai/schema"
