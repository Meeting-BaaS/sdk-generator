/**
 * Deepgram Streaming Zod Schemas
 *
 * NOTE: These streaming-specific params are NOT in Deepgram's OpenAPI spec.
 * They are documented only at: https://developers.deepgram.com/docs/live-streaming-api
 *
 * Unlike AssemblyAI (which has SDK types we can sync), Deepgram's streaming
 * params must be maintained manually based on their documentation.
 *
 * Batch params come from Orval (OpenAPI) - see deepgramAPISpecification.zod.ts
 * Streaming-only params below are maintained manually.
 */

import { z as zod } from "zod"

/**
 * Deepgram streaming-specific params Zod schema
 * These params are only available for streaming (not in batch OpenAPI spec)
 */
export const deepgramStreamingOnlyParams = zod.object({
  sample_rate: zod
    .number()
    .optional()
    .describe("Audio sample rate in Hz (e.g., 16000, 48000)"),
  channels: zod
    .number()
    .optional()
    .describe("Number of audio channels (1 for mono, 2 for stereo)"),
  interim_results: zod
    .boolean()
    .optional()
    .describe("Enable interim/partial transcription results"),
  endpointing: zod
    .union([zod.number(), zod.literal(false)])
    .optional()
    .describe("VAD endpointing: silence duration in ms, or false to disable"),
  vad_events: zod
    .boolean()
    .optional()
    .describe("Enable voice activity detection events"),
  utterance_end_ms: zod
    .number()
    .optional()
    .describe("Duration of silence in ms to mark utterance end"),
  no_delay: zod
    .boolean()
    .optional()
    .describe("Disable Deepgram's smart buffering for lowest latency")
})

/**
 * Complete Deepgram streaming params
 * Re-exports batch params plus streaming-only params
 */
export { deepgramStreamingOnlyParams as streamingTranscriberParams }
