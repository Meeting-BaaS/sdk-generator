/**
 * Soniox Streaming Zod Schemas
 * AUTO-GENERATED from manual TypeScript spec - DO NOT EDIT MANUALLY
 *
 * @source specs/soniox-streaming-types.ts
 * @version 1.0.0
 * @see https://soniox.com/docs/stt/SDKs/web-sdk
 *
 * Regenerate with: pnpm openapi:sync-soniox-streaming
 */

import { z as zod } from "zod"

// =============================================================================
// Audio Format Schemas
// =============================================================================

/**
 * Auto-detected audio formats
 */
export const sonioxAutoDetectedAudioFormatSchema = zod.enum([
  "auto",
  "aac",
  "aiff",
  "amr",
  "asf",
  "flac",
  "mp3",
  "ogg",
  "wav",
  "webm"
])

/**
 * PCM audio encodings (raw audio formats)
 */
export const sonioxPcmAudioEncodingSchema = zod.enum([
  // Signed PCM
  "pcm_s8",
  "pcm_s16le",
  "pcm_s16be",
  "pcm_s24le",
  "pcm_s24be",
  "pcm_s32le",
  "pcm_s32be",
  // Unsigned PCM
  "pcm_u8",
  "pcm_u16le",
  "pcm_u16be",
  "pcm_u24le",
  "pcm_u24be",
  "pcm_u32le",
  "pcm_u32be",
  // Float PCM
  "pcm_f32le",
  "pcm_f32be",
  "pcm_f64le",
  "pcm_f64be",
  // Companded
  "mulaw",
  "alaw"
])

/**
 * All supported audio formats
 */
export const sonioxAudioFormatSchema = zod.union([
  sonioxAutoDetectedAudioFormatSchema,
  sonioxPcmAudioEncodingSchema
])

// =============================================================================
// Translation Configuration Schemas
// =============================================================================

/**
 * One-way translation configuration
 */
export const sonioxOneWayTranslationSchema = zod.object({
  type: zod.literal("one_way"),
  target_language: zod.string().describe("Target language code for translation")
})

/**
 * Two-way translation configuration
 */
export const sonioxTwoWayTranslationSchema = zod.object({
  type: zod.literal("two_way"),
  language_a: zod.string().describe("First language for bidirectional translation"),
  language_b: zod.string().describe("Second language for bidirectional translation")
})

/**
 * Translation configuration (union of one-way and two-way)
 */
export const sonioxTranslationConfigSchema = zod.union([
  sonioxOneWayTranslationSchema,
  sonioxTwoWayTranslationSchema
])

// =============================================================================
// Context Configuration Schemas
// =============================================================================

/**
 * General context item (key-value pair)
 */
export const sonioxContextGeneralItemSchema = zod.object({
  key: zod.string().describe("Context item key (e.g. 'Domain')"),
  value: zod.string().describe("Context item value (e.g. 'medicine')")
})

/**
 * Translation term mapping
 */
export const sonioxTranslationTermSchema = zod.object({
  source: zod.string().describe("Source term"),
  target: zod.string().describe("Target term to translate to")
})

/**
 * Structured context for improving transcription accuracy
 */
export const sonioxStructuredContextSchema = zod.object({
  general: zod.array(sonioxContextGeneralItemSchema).optional()
    .describe("General context items (key-value pairs)"),
  text: zod.string().optional()
    .describe("Text context"),
  terms: zod.array(zod.string()).optional()
    .describe("Terms that might occur in speech"),
  translation_terms: zod.array(sonioxTranslationTermSchema).optional()
    .describe("Hints how to translate specific terms (ignored if translation is not enabled)")
})

/**
 * Context can be either a structured object or a plain string
 */
export const sonioxContextSchema = zod.union([
  sonioxStructuredContextSchema,
  zod.string()
])

// =============================================================================
// Streaming Transcriber Params Schema
// =============================================================================

/**
 * Soniox streaming transcriber params
 * Parameters for initiating a real-time transcription session
 * @source StreamingTranscriberParams from manual spec
 */
export const streamingTranscriberParams = zod.object({
  model: zod.string()
    .describe("Real-time model to use (e.g., 'stt-rt-preview', 'stt-rt-v3')"),
  audioFormat: sonioxAudioFormatSchema.optional()
    .describe("Audio format specification. Use 'auto' for automatic detection"),
  sampleRate: zod.number().optional()
    .describe("Sample rate in Hz (required for raw PCM formats)"),
  numChannels: zod.number().min(1).max(2).optional()
    .describe("Number of audio channels (1 for mono, 2 for stereo) - required for raw PCM formats"),
  languageHints: zod.array(zod.string()).optional()
    .describe("Expected languages in the audio (ISO language codes)"),
  context: sonioxContextSchema.optional()
    .describe("Additional context to improve transcription accuracy"),
  enableSpeakerDiarization: zod.boolean().optional()
    .describe("Enable speaker diarization - each token will include a speaker field"),
  enableLanguageIdentification: zod.boolean().optional()
    .describe("Enable language identification - each token will include a language field"),
  enableEndpointDetection: zod.boolean().optional()
    .describe("Enable endpoint detection to detect when a speaker has finished talking"),
  translation: sonioxTranslationConfigSchema.optional()
    .describe("Translation configuration"),
  clientReferenceId: zod.string().optional()
    .describe("Optional tracking identifier (client-defined)")
})

// =============================================================================
// Token and Response Schemas
// =============================================================================

/**
 * Translation status for tokens
 */
export const sonioxTranslationStatusSchema = zod.enum(["none", "original", "translation"])

/**
 * Individual token in a transcription result
 */
export const sonioxTokenSchema = zod.object({
  text: zod.string()
    .describe("Token text content (subword, word, or space)"),
  start_ms: zod.number().optional()
    .describe("Start time of the token in milliseconds"),
  end_ms: zod.number().optional()
    .describe("End time of the token in milliseconds"),
  confidence: zod.number().min(0).max(1).optional()
    .describe("Confidence score between 0.0 and 1.0"),
  is_final: zod.boolean()
    .describe("Whether this token is final (confirmed) or provisional"),
  speaker: zod.string().optional()
    .describe("Speaker identifier (only present when speaker diarization is enabled)"),
  language: zod.string().optional()
    .describe("Detected language code (only present when language identification is enabled)"),
  source_language: zod.string().optional()
    .describe("Original language code for translated tokens"),
  translation_status: sonioxTranslationStatusSchema.optional()
    .describe("Translation status: 'none', 'original', or 'translation'")
})

/**
 * Real-time transcription response
 */
export const sonioxStreamingResponseSchema = zod.object({
  text: zod.string().optional()
    .describe("Complete transcribed text"),
  tokens: zod.array(sonioxTokenSchema)
    .describe("List of recognized tokens"),
  final_audio_proc_ms: zod.number().optional()
    .describe("Milliseconds of audio processed into final tokens"),
  total_audio_proc_ms: zod.number().optional()
    .describe("Milliseconds of audio processed (final + non-final)"),
  finished: zod.boolean().optional()
    .describe("Whether the transcription is complete"),
  error: zod.string().optional()
    .describe("Error message if an error occurred"),
  error_code: zod.number().optional()
    .describe("Error code if an error occurred")
})

// =============================================================================
// Client State Schemas
// =============================================================================

/**
 * Recorder/client states
 */
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

/**
 * Error status types
 */
export const sonioxErrorStatusSchema = zod.enum([
  "get_user_media_failed",
  "api_key_fetch_failed",
  "queue_limit_exceeded",
  "media_recorder_error",
  "api_error",
  "websocket_error"
])

// =============================================================================
// Mid-session Update Params (placeholder - Soniox doesn't support mid-session updates)
// =============================================================================

/**
 * Soniox streaming update config params
 * Note: Soniox Real-time API doesn't currently support mid-session configuration updates.
 * This is a placeholder for API consistency with other providers.
 */
export const streamingUpdateConfigParams = zod.object({})
