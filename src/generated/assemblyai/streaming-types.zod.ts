/**
 * AssemblyAI Streaming Zod Schemas
 * AUTO-GENERATED from AsyncAPI spec - DO NOT EDIT MANUALLY
 *
 * @source specs/assemblyai-asyncapi.json
 * @version 1.1.2
 * @see https://www.assemblyai.com/docs/speech-to-text/streaming
 *
 * Regenerate with: pnpm openapi:sync-assemblyai-streaming
 */

import { z as zod } from "zod"

/**
 * AssemblyAI audio encoding formats
 * @source AudioEncoding from AsyncAPI spec
 */
export const assemblyaiAudioEncodingSchema = zod.enum(["pcm_s16le", "pcm_mulaw"])

/**
 * AssemblyAI streaming transcriber params
 * @source WebSocket query bindings from AsyncAPI spec
 */
export const streamingTranscriberParams = zod.object({
  sampleRate: zod.number().describe("The sample rate of the streamed audio"),
  wordBoost: zod
    .string()
    .optional()
    .describe(
      "Add up to 2500 characters of custom vocabulary. The parameter value must be a JSON encoded array of strings. The JSON must be URL encoded like other query string parameters."
    ),
  encoding: zod
    .enum(["pcm_s16le", "pcm_mulaw"])
    .optional()
    .describe("The encoding of the audio data"),
  disablePartialTranscripts: zod
    .boolean()
    .optional()
    .describe("Set to true to not receive partial transcripts. Defaults to false."),
  enableExtraSessionInformation: zod
    .boolean()
    .optional()
    .describe(
      "Set to true to receive the SessionInformation message before the session ends. Defaults to false."
    )
})

/**
 * AssemblyAI streaming update config params
 * For mid-session updates via ConfigureEndUtteranceSilenceThreshold message
 * @source ConfigureEndUtteranceSilenceThreshold schema from AsyncAPI spec
 */
export const streamingUpdateConfigParams = zod.object({
  end_utterance_silence_threshold: zod
    .number()
    .min(0)
    .max(20000)
    .optional()
    .describe("The duration threshold in milliseconds")
})
