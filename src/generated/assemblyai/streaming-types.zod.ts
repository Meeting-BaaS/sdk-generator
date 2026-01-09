/**
 * AssemblyAI Streaming Zod Schemas
 * Derived from streaming-types.ts for field config extraction
 */

import { z as zod } from "zod"

/**
 * AssemblyAI streaming params Zod schema
 * Used for extracting field configs
 */
export const streamingTranscriberParams = zod.object({
  sampleRate: zod
    .number()
    .describe("Audio sample rate in Hz (e.g., 16000)"),
  encoding: zod
    .enum(["pcm_s16le", "pcm_mulaw"])
    .optional()
    .describe("Audio encoding format"),
  speechModel: zod
    .enum(["universal-streaming-english", "universal-streaming-multilingual"])
    .optional()
    .describe("Speech recognition model to use"),
  languageDetection: zod
    .boolean()
    .optional()
    .describe("Enable automatic language detection"),
  endOfTurnConfidenceThreshold: zod
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Confidence threshold for end-of-turn detection (0-1)"),
  minEndOfTurnSilenceWhenConfident: zod
    .number()
    .optional()
    .describe("Minimum silence in ms to trigger end-of-turn when confident"),
  maxTurnSilence: zod
    .number()
    .optional()
    .describe("Maximum silence in ms before forcing end-of-turn"),
  vadThreshold: zod
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Voice activity detection threshold (0-1)"),
  formatTurns: zod
    .boolean()
    .optional()
    .describe("Enable real-time text formatting of turns"),
  filterProfanity: zod
    .boolean()
    .optional()
    .describe("Filter profanity in real-time transcription"),
  keyterms: zod
    .array(zod.string())
    .optional()
    .describe("Key terms to boost in recognition (comma-separated)"),
  keytermsPrompt: zod
    .array(zod.string())
    .optional()
    .describe("Context hints for key terms"),
  inactivityTimeout: zod
    .number()
    .optional()
    .describe("Session timeout in ms if no audio received")
})

/**
 * AssemblyAI streaming update configuration params
 * These can be sent mid-stream to adjust VAD/turn detection
 */
export const streamingUpdateConfigParams = zod.object({
  end_of_turn_confidence_threshold: zod
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Confidence threshold for end-of-turn detection (0-1)"),
  min_end_of_turn_silence_when_confident: zod
    .number()
    .optional()
    .describe("Minimum silence in ms to trigger end-of-turn when confident"),
  max_turn_silence: zod
    .number()
    .optional()
    .describe("Maximum silence in ms before forcing end-of-turn"),
  vad_threshold: zod
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Voice activity detection threshold (0-1)"),
  format_turns: zod
    .boolean()
    .optional()
    .describe("Enable real-time text formatting of turns")
})
