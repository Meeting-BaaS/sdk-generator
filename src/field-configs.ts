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

import {
  streamingTranscriberParams as assemblyaiStreamingParams,
  streamingUpdateConfigParams as assemblyaiUpdateConfigParams
} from "./generated/assemblyai/streaming-types.zod"

import {
  transcriptionControllerInitPreRecordedJobV2Body as gladiaTranscribeParams,
  transcriptionControllerListV2QueryParams as gladiaListParams,
  streamingControllerInitStreamingSessionV2Body as gladiaStreamingParams
} from "./generated/gladia/api/gladiaControlAPI.zod"

import { createTranscriptionBody as openaiTranscribeParams } from "./generated/openai/api/openAIAudioRealtimeAPI.zod"

import {
  streamingTranscriberParams as speechmaticsStreamingParams,
  streamingUpdateConfigParams as speechmaticsUpdateConfigParams
} from "./generated/speechmatics/streaming-types.zod"

import {
  batchTranscriptionParams as speechmaticsTranscribeParams,
  listJobsQueryParams as speechmaticsListParams
} from "./generated/speechmatics/batch-types.zod"

import {
  createTranscriptionBody as sonioxTranscribeParams,
  getTranscriptionsQueryParams as sonioxListParams
} from "./generated/soniox/api/sonioxPublicAPI.zod"

import {
  streamingTranscriberParams as sonioxStreamingParams,
  streamingUpdateConfigParams as sonioxUpdateConfigParams
} from "./generated/soniox/streaming-types.zod"

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
  /** Streaming update config fields (for mid-stream updates) */
  streamingUpdate?: ZodFieldConfig[]
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
 * Get AssemblyAI streaming update config fields (for mid-stream updates)
 */
export function getAssemblyAIStreamingUpdateFields(): ZodFieldConfig[] {
  return zodToFieldConfigs(assemblyaiUpdateConfigParams)
}

/**
 * Get all AssemblyAI field configs
 */
export function getAssemblyAIFieldConfigs(): ProviderFieldConfigs {
  return {
    provider: "assemblyai",
    transcription: getAssemblyAITranscriptionFields(),
    streaming: getAssemblyAIStreamingFields(),
    streamingUpdate: getAssemblyAIStreamingUpdateFields(),
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
// Speechmatics - Derived from Zod schemas (synced from SDK)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get Speechmatics transcription fields (derived from batch API spec)
 * @see https://github.com/speechmatics/speechmatics-js-sdk/tree/main/packages/batch-client
 */
export function getSpeechmaticsTranscriptionFields(): ZodFieldConfig[] {
  return zodToFieldConfigs(speechmaticsTranscribeParams)
}

/**
 * Get Speechmatics list filter fields (derived from batch API spec)
 */
export function getSpeechmaticsListFilterFields(): ZodFieldConfig[] {
  return zodToFieldConfigs(speechmaticsListParams)
}

/**
 * Get Speechmatics streaming fields (derived from SDK types)
 * @see https://github.com/speechmatics/speechmatics-js-sdk/tree/main/packages/real-time-client/models
 */
export function getSpeechmaticsStreamingFields(): ZodFieldConfig[] {
  return zodToFieldConfigs(speechmaticsStreamingParams)
}

/**
 * Get Speechmatics streaming update config fields (for mid-stream updates)
 * @see MidSessionTranscriptionConfig in Speechmatics SDK
 */
export function getSpeechmaticsStreamingUpdateFields(): ZodFieldConfig[] {
  return zodToFieldConfigs(speechmaticsUpdateConfigParams)
}

/**
 * Get all Speechmatics field configs
 */
export function getSpeechmaticsFieldConfigs(): ProviderFieldConfigs {
  return {
    provider: "speechmatics",
    transcription: getSpeechmaticsTranscriptionFields(),
    streaming: getSpeechmaticsStreamingFields(),
    streamingUpdate: getSpeechmaticsStreamingUpdateFields(),
    listFilters: getSpeechmaticsListFilterFields()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Soniox - Derived from Zod schemas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get Soniox transcription fields (derived from OpenAPI spec)
 * @see https://soniox.com/docs/stt/async-api
 */
export function getSonioxTranscriptionFields(): ZodFieldConfig[] {
  return zodToFieldConfigs(sonioxTranscribeParams)
}

/**
 * Get Soniox list filter fields (derived from OpenAPI spec)
 */
export function getSonioxListFilterFields(): ZodFieldConfig[] {
  return zodToFieldConfigs(sonioxListParams)
}

/**
 * Get Soniox streaming fields (derived from streaming types)
 * @see https://soniox.com/docs/stt/SDKs/web-sdk
 */
export function getSonioxStreamingFields(): ZodFieldConfig[] {
  return zodToFieldConfigs(sonioxStreamingParams)
}

/**
 * Get Soniox streaming update config fields (placeholder - Soniox doesn't support mid-session updates)
 */
export function getSonioxStreamingUpdateFields(): ZodFieldConfig[] {
  return zodToFieldConfigs(sonioxUpdateConfigParams)
}

/**
 * Get all Soniox field configs
 */
export function getSonioxFieldConfigs(): ProviderFieldConfigs {
  return {
    provider: "soniox",
    transcription: getSonioxTranscriptionFields(),
    streaming: getSonioxStreamingFields(),
    streamingUpdate: getSonioxStreamingUpdateFields(),
    listFilters: getSonioxListFilterFields()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// All Providers
// ─────────────────────────────────────────────────────────────────────────────

export type FieldConfigProvider =
  | "gladia"
  | "deepgram"
  | "assemblyai"
  | "openai-whisper"
  | "speechmatics"
  | "soniox"

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
    case "speechmatics":
      return getSpeechmaticsFieldConfigs()
    case "soniox":
      return getSonioxFieldConfigs()
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
    "openai-whisper": getOpenAIFieldConfigs(),
    speechmatics: getSpeechmaticsFieldConfigs(),
    soniox: getSonioxFieldConfigs()
  }
}
