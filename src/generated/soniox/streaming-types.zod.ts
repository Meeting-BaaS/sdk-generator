/**
 * Soniox Streaming Zod Schemas
 * AUTO-GENERATED from official SDK declarations - DO NOT EDIT MANUALLY
 *
 * @source npm:@soniox/speech-to-text-web
 * @version 1.4.0
 * @see https://soniox.com/docs/stt/SDKs/web-sdk
 *
 * Regenerate with: pnpm openapi:sync-soniox-streaming
 */

import { z as zod } from "zod"

// =============================================================================
// Audio Format Schemas
// =============================================================================

/**
 * Audio format for the streamed audio.
 */
export const sonioxAudioFormatSchema = zod.enum([
  "auto",
  "aac",
  "aiff",
  "amr",
  "asf",
  "flac",
  "mp3",
  "ogg",
  "wav",
  "webm",
  "pcm_s8",
  "pcm_s16le",
  "pcm_s16be",
  "pcm_s24le",
  "pcm_s24be",
  "pcm_s32le",
  "pcm_s32be",
  "pcm_u8",
  "pcm_u16le",
  "pcm_u16be",
  "pcm_u24le",
  "pcm_u24be",
  "pcm_u32le",
  "pcm_u32be",
  "pcm_f32le",
  "pcm_f32be",
  "pcm_f64le",
  "pcm_f64be",
  "mulaw",
  "alaw"
])

// =============================================================================
// Translation Configuration Schemas
// =============================================================================

export const sonioxOneWayTranslationSchema = zod.object({
  type: zod.literal("one_way"),
  target_language: zod.string()
})

export const sonioxTwoWayTranslationSchema = zod.object({
  type: zod.literal("two_way"),
  language_a: zod.string(),
  language_b: zod.string()
})

export const sonioxTranslationConfigSchema = zod.union([
  sonioxOneWayTranslationSchema,
  sonioxTwoWayTranslationSchema
])

// =============================================================================
// Context Configuration Schemas
// =============================================================================

export const sonioxContextGeneralItemSchema = zod.object({
  key: zod.string(),
  value: zod.string()
})

export const sonioxTranslationTermSchema = zod.object({
  source: zod.string(),
  target: zod.string()
})

export const sonioxStructuredContextSchema = zod.object({
  general: zod.array(sonioxContextGeneralItemSchema).optional(),
  text: zod.string().optional(),
  terms: zod.array(zod.string()).optional(),
  translation_terms: zod
    .array(sonioxTranslationTermSchema)
    .optional()
})

export const sonioxContextSchema = zod.union([
  sonioxStructuredContextSchema,
  zod.string()
])

// =============================================================================
// Real-time Model Schema
// =============================================================================

/**
 * Real-time model identifier.
 */
export const sonioxRealtimeModelSchema = zod.enum([
  "stt-rt-v4",
  "stt-rt-v3",
  "stt-rt-preview",
  "stt-rt-v3-preview",
  "stt-rt-preview-v2"
])

// =============================================================================
// Streaming Transcriber Params Schema
// =============================================================================

export const streamingTranscriberParams = zod.object({
  model: sonioxRealtimeModelSchema,
  audioFormat: sonioxAudioFormatSchema.optional(),
  sampleRate: zod.number().optional(),
  numChannels: zod.number().optional(),
  languageHints: zod.array(zod.string()).optional(),
  context: sonioxContextSchema.optional(),
  enableSpeakerDiarization: zod.boolean().optional(),
  enableLanguageIdentification: zod.boolean().optional(),
  enableEndpointDetection: zod.boolean().optional(),
  translation: sonioxTranslationConfigSchema.optional(),
  clientReferenceId: zod.string().optional()
})

// =============================================================================
// Token and Response Schemas
// =============================================================================

export const sonioxTranslationStatusSchema = zod.enum(["original", "translation", "none"])

export const sonioxTokenSchema = zod.object({
  text: zod.string(),
  start_ms: zod.number().optional(),
  end_ms: zod.number().optional(),
  confidence: zod.number(),
  is_final: zod.boolean(),
  speaker: zod.string().optional(),
  translation_status: sonioxTranslationStatusSchema.optional(),
  language: zod.string().optional(),
  source_language: zod.string().optional()
})

export const sonioxStreamingResponseSchema = zod.object({
  text: zod.string(),
  tokens: zod.array(sonioxTokenSchema),
  final_audio_proc_ms: zod.number(),
  total_audio_proc_ms: zod.number(),
  finished: zod.boolean().optional(),
  error_code: zod.number().optional(),
  error_message: zod.string().optional()
})

// =============================================================================
// Client State Schemas
// =============================================================================

export const sonioxRecorderStateSchema = zod.enum([
  "Init",
  "RequestingMedia",
  "OpeningWebSocket",
  "Running",
  "FinishingProcessing",
  "Finished",
  "Error",
  "Canceled"
])

export const sonioxErrorStatusSchema = zod.enum(['get_user_media_failed', 'api_key_fetch_failed', 'queue_limit_exceeded', 'media_recorder_error', 'api_error', 'websocket_error'])

// =============================================================================
// Mid-session Update Params (placeholder - Soniox doesn't support mid-session updates)
// =============================================================================

export const streamingUpdateConfigParams = zod.object({})
