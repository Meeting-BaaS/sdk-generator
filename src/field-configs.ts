/**
 * Field configuration types and Zod-derived field extractors
 *
 * All field configs are derived from Zod schemas (generated from OpenAPI specs).
 * Zero hardcoding - single source of truth.
 *
 * @example
 * ```typescript
 * import { getDeepgramTranscriptionFields, FieldConfig } from 'voice-router-dev'
 *
 * const fields = getDeepgramTranscriptionFields()
 * fields.forEach(field => {
 *   if (field.type === 'boolean') {
 *     renderCheckbox(field.name, field.description, field.default)
 *   }
 * })
 * ```
 *
 * @packageDocumentation
 */

import { zodToFieldConfigs, type ZodFieldConfig } from "./utils/zod-to-field-configs"

// Import Zod schemas from generated code
import {
  listenV1MediaTranscribeQueryParams as deepgramTranscribeParams,
  manageV1ProjectsRequestsListQueryParams as deepgramListParams
} from "./generated/deepgram/api/deepgramAPISpecification.zod"

import { deepgramStreamingOnlyParams } from "./generated/deepgram/streaming-types.zod"

import {
  createTranscriptBody as assemblyaiTranscribeParams,
  listTranscriptsQueryParams as assemblyaiListParams
} from "./generated/assemblyai/api/assemblyAIAPI.zod"

import { streamingTranscriberParams as assemblyaiStreamingParams } from "./generated/assemblyai/streaming-types.zod"

import {
  transcriptionControllerInitPreRecordedJobV2Body as gladiaTranscribeParams,
  transcriptionControllerListV2QueryParams as gladiaListParams,
  streamingControllerInitStreamingSessionV2Body as gladiaStreamingParams
} from "./generated/gladia/api/gladiaControlAPI.zod"

import { createTranscriptionBody as openaiTranscribeParams } from "./generated/openai/api/openAIAPI.zod"

// ─────────────────────────────────────────────────────────────────────────────
// Re-export types
// ─────────────────────────────────────────────────────────────────────────────

export type { ZodFieldConfig as FieldConfig }
export type { FieldType } from "./utils/zod-to-field-configs"

/**
 * Provider field configuration map
 */
export interface ProviderFieldConfigs {
  /** Provider name */
  provider: string
  /** Transcription request fields */
  transcription: ZodFieldConfig[]
  /** Streaming request fields (if supported) */
  streaming?: ZodFieldConfig[]
  /** List transcripts filter fields */
  listFilters?: ZodFieldConfig[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Gladia - Derived from Zod schemas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get Gladia transcription fields (derived from OpenAPI spec)
 */
export function getGladiaTranscriptionFields(): ZodFieldConfig[] {
  return zodToFieldConfigs(gladiaTranscribeParams)
}

/**
 * Get Gladia list filter fields (derived from OpenAPI spec)
 */
export function getGladiaListFilterFields(): ZodFieldConfig[] {
  return zodToFieldConfigs(gladiaListParams)
}

/**
 * Get Gladia streaming fields (derived from OpenAPI spec)
 */
export function getGladiaStreamingFields(): ZodFieldConfig[] {
  return zodToFieldConfigs(gladiaStreamingParams)
}

/**
 * Get all Gladia field configs
 */
export function getGladiaFieldConfigs(): ProviderFieldConfigs {
  return {
    provider: "gladia",
    transcription: getGladiaTranscriptionFields(),
    streaming: getGladiaStreamingFields(),
    listFilters: getGladiaListFilterFields()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Deepgram - Derived from Zod schemas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get Deepgram transcription fields (derived from OpenAPI spec)
 */
export function getDeepgramTranscriptionFields(): ZodFieldConfig[] {
  return zodToFieldConfigs(deepgramTranscribeParams)
}

/**
 * Get Deepgram list filter fields (derived from OpenAPI spec)
 */
export function getDeepgramListFilterFields(): ZodFieldConfig[] {
  return zodToFieldConfigs(deepgramListParams)
}

/**
 * Get Deepgram streaming fields (batch params + streaming-specific params)
 */
export function getDeepgramStreamingFields(): ZodFieldConfig[] {
  // Combine batch transcription params with streaming-only params
  const batchFields = zodToFieldConfigs(deepgramTranscribeParams)
  const streamingFields = zodToFieldConfigs(deepgramStreamingOnlyParams)
  return [...batchFields, ...streamingFields]
}

/**
 * Get all Deepgram field configs
 */
export function getDeepgramFieldConfigs(): ProviderFieldConfigs {
  return {
    provider: "deepgram",
    transcription: getDeepgramTranscriptionFields(),
    streaming: getDeepgramStreamingFields(),
    listFilters: getDeepgramListFilterFields()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AssemblyAI - Derived from Zod schemas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get AssemblyAI transcription fields (derived from OpenAPI spec)
 */
export function getAssemblyAITranscriptionFields(): ZodFieldConfig[] {
  return zodToFieldConfigs(assemblyaiTranscribeParams)
}

/**
 * Get AssemblyAI list filter fields (derived from OpenAPI spec)
 */
export function getAssemblyAIListFilterFields(): ZodFieldConfig[] {
  return zodToFieldConfigs(assemblyaiListParams)
}

/**
 * Get AssemblyAI streaming fields (derived from streaming types)
 */
export function getAssemblyAIStreamingFields(): ZodFieldConfig[] {
  return zodToFieldConfigs(assemblyaiStreamingParams)
}

/**
 * Get all AssemblyAI field configs
 */
export function getAssemblyAIFieldConfigs(): ProviderFieldConfigs {
  return {
    provider: "assemblyai",
    transcription: getAssemblyAITranscriptionFields(),
    streaming: getAssemblyAIStreamingFields(),
    listFilters: getAssemblyAIListFilterFields()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OpenAI Whisper - Derived from Zod schemas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get OpenAI Whisper transcription fields (derived from OpenAPI spec)
 */
export function getOpenAITranscriptionFields(): ZodFieldConfig[] {
  return zodToFieldConfigs(openaiTranscribeParams)
}

/**
 * Get all OpenAI field configs
 */
export function getOpenAIFieldConfigs(): ProviderFieldConfigs {
  return {
    provider: "openai-whisper",
    transcription: getOpenAITranscriptionFields()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// All Providers
// ─────────────────────────────────────────────────────────────────────────────

export type FieldConfigProvider = "gladia" | "deepgram" | "assemblyai" | "openai-whisper"

/**
 * Get field configs for a specific provider
 */
export function getProviderFieldConfigs(provider: FieldConfigProvider): ProviderFieldConfigs {
  switch (provider) {
    case "gladia":
      return getGladiaFieldConfigs()
    case "deepgram":
      return getDeepgramFieldConfigs()
    case "assemblyai":
      return getAssemblyAIFieldConfigs()
    case "openai-whisper":
      return getOpenAIFieldConfigs()
  }
}

/**
 * Get all provider field configs
 */
export function getAllFieldConfigs(): Record<FieldConfigProvider, ProviderFieldConfigs> {
  return {
    gladia: getGladiaFieldConfigs(),
    deepgram: getDeepgramFieldConfigs(),
    assemblyai: getAssemblyAIFieldConfigs(),
    "openai-whisper": getOpenAIFieldConfigs()
  }
}
