/**
 * AssemblyAI Streaming Zod Schemas
 * AUTO-GENERATED from AsyncAPI spec + SDK types - DO NOT EDIT MANUALLY
 *
 * Sources merged:
 * - AsyncAPI: specs/assemblyai-asyncapi.json (legacy WebSocket API)
 * - SDK types: src/generated/assemblyai/streaming-types.ts (v3 streaming fields)
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
  wordBoost: zod.string().optional().describe("Add up to 2500 characters of custom vocabulary. The parameter value must be a JSON encoded array of strings. The JSON must be URL encoded like other query string parameters."),
  encoding: zod.enum(["pcm_s16le", "pcm_mulaw"]).optional().describe("The encoding of the audio data"),
  disablePartialTranscripts: zod.boolean().optional().describe("Set to true to not receive partial transcripts. Defaults to false."),
  enableExtraSessionInformation: zod.boolean().optional().describe("Set to true to receive the SessionInformation message before the session ends. Defaults to false."),
  endOfTurnConfidenceThreshold: zod.number().optional().describe("From SDK v3"),
  minEndOfTurnSilenceWhenConfident: zod.number().optional().describe("From SDK v3"),
  maxTurnSilence: zod.number().optional().describe("From SDK v3"),
  vadThreshold: zod.number().optional().describe("From SDK v3"),
  formatTurns: zod.boolean().optional().describe("From SDK v3"),
  filterProfanity: zod.boolean().optional().describe("From SDK v3"),
  keyterms: zod.array(zod.string()).optional().describe("From SDK v3"),
  keytermsPrompt: zod.array(zod.string()).optional().describe("From SDK v3"),
  speechModel: zod.enum(["universal-streaming-english", "universal-streaming-multilingual"]).optional().describe("From SDK v3"),
  languageDetection: zod.boolean().optional().describe("From SDK v3"),
  inactivityTimeout: zod.number().optional().describe("From SDK v3")
})

/**
 * AssemblyAI streaming update config params
 * For mid-session updates via ConfigureEndUtteranceSilenceThreshold message
 * @source ConfigureEndUtteranceSilenceThreshold schema from AsyncAPI spec
 */
export const streamingUpdateConfigParams = zod.object({
  end_utterance_silence_threshold: zod.number().min(0).max(20000).optional().describe("The duration threshold in milliseconds"),
  end_of_turn_confidence_threshold: zod.number().optional().describe("From SDK v3"),
  min_end_of_turn_silence_when_confident: zod.number().optional().describe("From SDK v3"),
  max_turn_silence: zod.number().optional().describe("From SDK v3"),
  vad_threshold: zod.number().optional().describe("From SDK v3"),
  format_turns: zod.boolean().optional().describe("From SDK v3")
})
