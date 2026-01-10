/**
 * Deepgram Streaming Zod Schemas
 * AUTO-GENERATED from Deepgram JS SDK - DO NOT EDIT MANUALLY
 *
 * @source /run/media/lazrossi/KINGSTON/code/sdk-generator/specs/deepgram-streaming-sdk.ts
 * @see https://developers.deepgram.com/docs/sdk-feature-matrix
 *
 * Batch params come from Orval (OpenAPI) - see deepgramAPISpecification.zod.ts
 * Streaming-only params below are extracted from LiveSchema in the SDK.
 *
 * Regenerate with: pnpm openapi:sync-deepgram-streaming
 */

import { z as zod } from "zod"

/**
 * Deepgram streaming-only params from LiveSchema
 * These extend the batch TranscriptionSchema params
 */
export const deepgramStreamingOnlyParams = zod.object({
  channels: zod.number().optional().describe("channels - see https://developers.deepgram.com/docs/channels"),
  encoding: zod.string().optional().describe("encoding - see https://developers.deepgram.com/docs/encoding"),
  sample_rate: zod.number().optional().describe("sample rate - see https://developers.deepgram.com/docs/sample-rate"),
  endpointing: zod.union([zod.literal(false), zod.number()]).optional().describe("endpointing - see https://developers.deepgram.com/docs/endpointing"),
  interim_results: zod.boolean().optional().describe("interim results - see https://developers.deepgram.com/docs/interim-results"),
  no_delay: zod.boolean().optional().describe("smart format#using no delay - see https://developers.deepgram.com/docs/smart-format#using-no-delay"),
  utterance_end_ms: zod.number().optional().describe("understanding end of speech detection - see https://developers.deepgram.com/docs/understanding-end-of-speech-detection"),
  vad_events: zod.boolean().optional().describe("start of speech detection - see https://developers.deepgram.com/docs/start-of-speech-detection")
})

/**
 * Re-export for field-configs.ts
 */
export { deepgramStreamingOnlyParams as streamingTranscriberParams }
