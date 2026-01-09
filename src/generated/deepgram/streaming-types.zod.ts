/**
 * Deepgram Streaming Zod Schemas
 * Auto-synced from Deepgram JS SDK LiveSchema
 * @see https://github.com/deepgram/deepgram-js-sdk/blob/main/src/lib/types/TranscriptionSchema.ts
 * @see https://developers.deepgram.com/docs/sdk-feature-matrix
 *
 * DO NOT EDIT MANUALLY - regenerate with: pnpm openapi:sync-deepgram-streaming
 *
 * Batch params come from Orval (OpenAPI) - see deepgramAPISpecification.zod.ts
 * Streaming-only params below are synced from Deepgram SDK.
 */

import { z as zod } from "zod"

/**
 * Deepgram streaming-only params from LiveSchema
 * These extend the batch TranscriptionSchema params
 */
export const deepgramStreamingOnlyParams = zod.object({
  channels: zod.number().optional()
    .describe("Number of audio channels (1 for mono, 2 for stereo)"),
  sample_rate: zod.number().optional()
    .describe("Audio sample rate in Hz (e.g., 16000, 48000)"),
  encoding: zod.string().optional()
    .describe("Audio encoding format (linear16, mulaw, flac, etc.)"),
  interim_results: zod.boolean().optional()
    .describe("Enable interim/partial transcription results"),
  endpointing: zod.union([zod.number(), zod.literal(false)]).optional()
    .describe("VAD endpointing: silence duration in ms, or false to disable"),
  utterance_end_ms: zod.number().optional()
    .describe("Duration of silence in ms to mark utterance end"),
  vad_events: zod.boolean().optional()
    .describe("Enable voice activity detection events"),
  no_delay: zod.boolean().optional()
    .describe("Disable Deepgram buffering for lowest latency"),
  diarize_version: zod.string().optional()
    .describe("Diarization model version to use"),
})

/**
 * Re-export for field-configs.ts
 */
export { deepgramStreamingOnlyParams as streamingTranscriberParams }
