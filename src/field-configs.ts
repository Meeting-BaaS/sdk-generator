/**
 * Field configuration types and Zod-derived field extractors
 *
 * All field configs are derived from Zod schemas (generated from OpenAPI specs).
 * Zero hardcoding - single source of truth.
 *
 * ## Type-Safe Field Overrides
 *
 * Use exported field name types for compile-time safety:
 *
 * @example
 * ```typescript
 * import {
 *   GladiaStreamingFieldName,
 *   GladiaStreamingConfig,
 *   FieldOverrides,
 *   GladiaStreamingSchema,
 *   FieldConfig
 * } from 'voice-router-dev/field-configs'
 *
 * // Type-safe field overrides - typos caught at compile time!
 * const overrides: Partial<Record<GladiaStreamingFieldName, FieldConfig | null>> = {
 *   encoding: { name: 'encoding', type: 'select', required: false },
 *   language_config: null, // Hide this field
 *   // typo_field: null, // ✗ TypeScript error!
 * }
 *
 * // Or use the generic helper with any schema
 * const overrides2: FieldOverrides<typeof GladiaStreamingSchema> = {
 *   encoding: { name: 'encoding', type: 'select', required: false },
 * }
 *
 * // Fully typed config values - option values are validated too!
 * const config: Partial<GladiaStreamingConfig> = {
 *   encoding: 'wav/pcm', // ✓ Only valid options allowed
 *   sample_rate: 16000,
 * }
 *
 * // Extract specific field's valid options
 * type EncodingOptions = GladiaStreamingConfig['encoding']
 * // = 'wav/pcm' | 'wav/alaw' | 'wav/ulaw'
 * ```
 *
 * ## Runtime Field Extraction
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

import { z } from "zod"
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
  transcriptionsCreateBody as azureTranscribeParams,
  transcriptionsListQueryParams as azureListParams
} from "./generated/azure/api/speechServicesAPIVersion32.zod"

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
// Typed Field Names - Compile-time type safety for field overrides
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generic helper for type-safe field overrides.
 * Use with any Zod schema to get typed field names.
 *
 * @example
 * ```typescript
 * import { FieldOverrides, GladiaStreamingSchema } from 'voice-router-dev/field-configs'
 *
 * const overrides: FieldOverrides<typeof GladiaStreamingSchema> = {
 *   encoding: { name: 'encoding', type: 'select' },
 *   typo_field: null, // ✗ TypeScript error!
 * }
 * ```
 */
export type FieldOverrides<Schema extends z.ZodTypeAny> = Partial<
  Record<keyof z.infer<Schema>, ZodFieldConfig | null>
>

// ─────────────────────────────────────────────────────────────────────────────
// Gladia - Typed field names and schemas
// ─────────────────────────────────────────────────────────────────────────────

/** Field names for Gladia transcription requests */
export type GladiaTranscriptionFieldName = keyof z.infer<typeof gladiaTranscribeParams>
/** Field names for Gladia streaming sessions */
export type GladiaStreamingFieldName = keyof z.infer<typeof gladiaStreamingParams>
/** Field names for Gladia list filters */
export type GladiaListFilterFieldName = keyof z.infer<typeof gladiaListParams>

/** Gladia transcription request values (fully typed) */
export type GladiaTranscriptionConfig = z.infer<typeof gladiaTranscribeParams>
/** Gladia streaming session config (fully typed) */
export type GladiaStreamingConfig = z.infer<typeof gladiaStreamingParams>

/** Zod schema for Gladia transcription - use for advanced type extraction */
export const GladiaTranscriptionSchema = gladiaTranscribeParams
/** Zod schema for Gladia streaming - use for advanced type extraction */
export const GladiaStreamingSchema = gladiaStreamingParams
/** Zod schema for Gladia list filters */
export const GladiaListFilterSchema = gladiaListParams

// ─────────────────────────────────────────────────────────────────────────────
// Deepgram - Typed field names and schemas
// ─────────────────────────────────────────────────────────────────────────────

/** Field names for Deepgram transcription requests */
export type DeepgramTranscriptionFieldName = keyof z.infer<typeof deepgramTranscribeParams>
/** Field names for Deepgram streaming (transcription + streaming-only params) */
export type DeepgramStreamingFieldName =
  | keyof z.infer<typeof deepgramTranscribeParams>
  | keyof z.infer<typeof deepgramStreamingOnlyParams>
/** Field names for Deepgram list filters */
export type DeepgramListFilterFieldName = keyof z.infer<typeof deepgramListParams>

/** Deepgram transcription request values (fully typed) */
export type DeepgramTranscriptionConfig = z.infer<typeof deepgramTranscribeParams>
/** Deepgram streaming-only config values */
export type DeepgramStreamingOnlyConfig = z.infer<typeof deepgramStreamingOnlyParams>

/** Zod schema for Deepgram transcription */
export const DeepgramTranscriptionSchema = deepgramTranscribeParams
/** Zod schema for Deepgram streaming-only params */
export const DeepgramStreamingOnlySchema = deepgramStreamingOnlyParams
/** Zod schema for Deepgram list filters */
export const DeepgramListFilterSchema = deepgramListParams

// ─────────────────────────────────────────────────────────────────────────────
// AssemblyAI - Typed field names and schemas
// ─────────────────────────────────────────────────────────────────────────────

/** Field names for AssemblyAI transcription requests */
export type AssemblyAITranscriptionFieldName = keyof z.infer<typeof assemblyaiTranscribeParams>
/** Field names for AssemblyAI streaming sessions */
export type AssemblyAIStreamingFieldName = keyof z.infer<typeof assemblyaiStreamingParams>
/** Field names for AssemblyAI streaming update config */
export type AssemblyAIStreamingUpdateFieldName = keyof z.infer<typeof assemblyaiUpdateConfigParams>
/** Field names for AssemblyAI list filters */
export type AssemblyAIListFilterFieldName = keyof z.infer<typeof assemblyaiListParams>

/** AssemblyAI transcription request values (fully typed) */
export type AssemblyAITranscriptionConfig = z.infer<typeof assemblyaiTranscribeParams>
/** AssemblyAI streaming session config (fully typed) */
export type AssemblyAIStreamingConfig = z.infer<typeof assemblyaiStreamingParams>
/** AssemblyAI streaming update config (fully typed) */
export type AssemblyAIStreamingUpdateConfig = z.infer<typeof assemblyaiUpdateConfigParams>

/** Zod schema for AssemblyAI transcription */
export const AssemblyAITranscriptionSchema = assemblyaiTranscribeParams
/** Zod schema for AssemblyAI streaming */
export const AssemblyAIStreamingSchema = assemblyaiStreamingParams
/** Zod schema for AssemblyAI streaming updates */
export const AssemblyAIStreamingUpdateSchema = assemblyaiUpdateConfigParams
/** Zod schema for AssemblyAI list filters */
export const AssemblyAIListFilterSchema = assemblyaiListParams

// ─────────────────────────────────────────────────────────────────────────────
// OpenAI - Typed field names and schemas
// ─────────────────────────────────────────────────────────────────────────────

/** Field names for OpenAI Whisper transcription requests */
export type OpenAITranscriptionFieldName = keyof z.infer<typeof openaiTranscribeParams>

/** OpenAI Whisper transcription request values (fully typed) */
export type OpenAITranscriptionConfig = z.infer<typeof openaiTranscribeParams>

/** Zod schema for OpenAI transcription */
export const OpenAITranscriptionSchema = openaiTranscribeParams

// ─────────────────────────────────────────────────────────────────────────────
// Azure - Typed field names and schemas
// ─────────────────────────────────────────────────────────────────────────────

/** Field names for Azure Speech Services transcription requests */
export type AzureTranscriptionFieldName = keyof z.infer<typeof azureTranscribeParams>
/** Field names for Azure list filters */
export type AzureListFilterFieldName = keyof z.infer<typeof azureListParams>

/** Azure transcription request values (fully typed) */
export type AzureTranscriptionConfig = z.infer<typeof azureTranscribeParams>

/** Zod schema for Azure transcription */
export const AzureTranscriptionSchema = azureTranscribeParams
/** Zod schema for Azure list filters */
export const AzureListFilterSchema = azureListParams

// ─────────────────────────────────────────────────────────────────────────────
// Speechmatics - Typed field names and schemas
// ─────────────────────────────────────────────────────────────────────────────

/** Field names for Speechmatics batch transcription requests */
export type SpeechmaticsTranscriptionFieldName = keyof z.infer<typeof speechmaticsTranscribeParams>
/** Field names for Speechmatics streaming sessions */
export type SpeechmaticsStreamingFieldName = keyof z.infer<typeof speechmaticsStreamingParams>
/** Field names for Speechmatics streaming update config */
export type SpeechmaticsStreamingUpdateFieldName = keyof z.infer<
  typeof speechmaticsUpdateConfigParams
>
/** Field names for Speechmatics list filters */
export type SpeechmaticsListFilterFieldName = keyof z.infer<typeof speechmaticsListParams>

/** Speechmatics batch transcription values (fully typed) */
export type SpeechmaticsTranscriptionConfig = z.infer<typeof speechmaticsTranscribeParams>
/** Speechmatics streaming session config (fully typed) */
export type SpeechmaticsStreamingConfig = z.infer<typeof speechmaticsStreamingParams>
/** Speechmatics streaming update config (fully typed) */
export type SpeechmaticsStreamingUpdateConfig = z.infer<typeof speechmaticsUpdateConfigParams>

/** Zod schema for Speechmatics transcription */
export const SpeechmaticsTranscriptionSchema = speechmaticsTranscribeParams
/** Zod schema for Speechmatics streaming */
export const SpeechmaticsStreamingSchema = speechmaticsStreamingParams
/** Zod schema for Speechmatics streaming updates */
export const SpeechmaticsStreamingUpdateSchema = speechmaticsUpdateConfigParams
/** Zod schema for Speechmatics list filters */
export const SpeechmaticsListFilterSchema = speechmaticsListParams

// ─────────────────────────────────────────────────────────────────────────────
// Soniox - Typed field names and schemas
// ─────────────────────────────────────────────────────────────────────────────

/** Field names for Soniox transcription requests */
export type SonioxTranscriptionFieldName = keyof z.infer<typeof sonioxTranscribeParams>
/** Field names for Soniox streaming sessions */
export type SonioxStreamingFieldName = keyof z.infer<typeof sonioxStreamingParams>
/** Field names for Soniox streaming update config */
export type SonioxStreamingUpdateFieldName = keyof z.infer<typeof sonioxUpdateConfigParams>
/** Field names for Soniox list filters */
export type SonioxListFilterFieldName = keyof z.infer<typeof sonioxListParams>

/** Soniox transcription request values (fully typed) */
export type SonioxTranscriptionConfig = z.infer<typeof sonioxTranscribeParams>
/** Soniox streaming session config (fully typed) */
export type SonioxStreamingConfig = z.infer<typeof sonioxStreamingParams>
/** Soniox streaming update config (fully typed) */
export type SonioxStreamingUpdateConfig = z.infer<typeof sonioxUpdateConfigParams>

/** Zod schema for Soniox transcription */
export const SonioxTranscriptionSchema = sonioxTranscribeParams
/** Zod schema for Soniox streaming */
export const SonioxStreamingSchema = sonioxStreamingParams
/** Zod schema for Soniox streaming updates */
export const SonioxStreamingUpdateSchema = sonioxUpdateConfigParams
/** Zod schema for Soniox list filters */
export const SonioxListFilterSchema = sonioxListParams

// ─────────────────────────────────────────────────────────────────────────────
// Convenience type aliases for all providers
// ─────────────────────────────────────────────────────────────────────────────

/** All transcription field names across providers */
export type TranscriptionFieldName =
  | GladiaTranscriptionFieldName
  | DeepgramTranscriptionFieldName
  | AssemblyAITranscriptionFieldName
  | OpenAITranscriptionFieldName
  | AzureTranscriptionFieldName
  | SpeechmaticsTranscriptionFieldName
  | SonioxTranscriptionFieldName

/** All streaming field names across providers */
export type StreamingFieldName =
  | GladiaStreamingFieldName
  | DeepgramStreamingFieldName
  | AssemblyAIStreamingFieldName
  | SpeechmaticsStreamingFieldName
  | SonioxStreamingFieldName

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
// Azure - Derived from Zod schemas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get Azure Speech Services transcription fields (derived from OpenAPI spec)
 */
export function getAzureTranscriptionFields(): ZodFieldConfig[] {
  return zodToFieldConfigs(azureTranscribeParams)
}

/**
 * Get Azure list filter fields (derived from OpenAPI spec)
 */
export function getAzureListFilterFields(): ZodFieldConfig[] {
  return zodToFieldConfigs(azureListParams)
}

/**
 * Get all Azure field configs
 */
export function getAzureFieldConfigs(): ProviderFieldConfigs {
  return {
    provider: "azure",
    transcription: getAzureTranscriptionFields(),
    listFilters: getAzureListFilterFields()
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
  | "azure"
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
    case "azure":
      return getAzureFieldConfigs()
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
    azure: getAzureFieldConfigs(),
    speechmatics: getSpeechmaticsFieldConfigs(),
    soniox: getSonioxFieldConfigs()
  }
}
