/**
 * Streaming Field Schemas - Single Source of Truth
 *
 * These schemas define both:
 * 1. Runtime field configurations for UI rendering (FieldConfig[])
 * 2. Type validation against the actual streaming options interfaces
 *
 * The schema structure mirrors the TypeScript interfaces in provider-streaming-types.ts
 * Any mismatch will cause a compile-time error via the type assertions below.
 *
 * @packageDocumentation
 */

import type { FieldConfig, FieldType } from "./field-configs"
import type {
  DeepgramStreamingOptions,
  AssemblyAIStreamingOptions
} from "./router/provider-streaming-types"

// Import constants for select options
import {
  DeepgramModel,
  DeepgramEncoding,
  DeepgramSampleRate,
  DeepgramTopicMode,
  AssemblyAIEncoding,
  AssemblyAISpeechModel,
  AssemblyAISampleRate
} from "./constants"

// ─────────────────────────────────────────────────────────────────────────────
// Schema Definition Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Field schema definition with full metadata
 */
interface FieldSchema {
  type: FieldType
  description: string
  default?: string | number | boolean | string[]
  options?: readonly string[] | readonly number[]
  min?: number
  max?: number
  example?: string | number | boolean
  stability?: "stable" | "beta" | "alpha"
}

/**
 * Schema map type - keys must match the interface property names
 */
type SchemaMap<T> = {
  [K in keyof T]?: FieldSchema
}

/**
 * Convert a schema map to FieldConfig array
 */
function schemaToFieldConfigs<T>(schema: SchemaMap<T>): readonly FieldConfig[] {
  return Object.entries(schema).map(([name, fieldSchema]) => ({
    name,
    ...(fieldSchema as FieldSchema),
    stability: (fieldSchema as FieldSchema).stability ?? "stable"
  })) as readonly FieldConfig[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Deepgram Streaming Schema
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deepgram streaming field schema
 *
 * Type-checked against DeepgramStreamingOptions - any property name mismatch
 * will cause a compile error.
 */
const DeepgramStreamingSchema: SchemaMap<DeepgramStreamingOptions> = {
  // Audio Format
  encoding: {
    type: "select",
    description: "Audio encoding format",
    options: Object.values(DeepgramEncoding),
    default: "linear16"
  },
  sampleRate: {
    type: "select",
    description: "Audio sample rate in Hz",
    options: Object.values(DeepgramSampleRate),
    default: 16000
  },
  channels: {
    type: "number",
    description: "Number of audio channels",
    default: 1,
    min: 1
  },

  // Model & Language
  model: {
    type: "select",
    description: "Transcription model to use",
    options: Object.values(DeepgramModel),
    default: "nova-3"
  },
  language: {
    type: "string",
    description: "Language code (BCP-47 format, e.g., 'en', 'en-US')",
    example: "en"
  },
  languageDetection: {
    type: "boolean",
    description: "Enable automatic language detection",
    default: false
  },

  // Transcription Processing
  interimResults: {
    type: "boolean",
    description: "Enable interim results (partial transcripts before final)",
    default: true
  },
  punctuate: {
    type: "boolean",
    description: "Add punctuation to the transcript",
    default: true
  },
  smartFormat: {
    type: "boolean",
    description: "Apply smart formatting (dates, numbers, etc.)",
    default: true
  },
  diarization: {
    type: "boolean",
    description: "Enable speaker diarization",
    default: false
  },
  fillerWords: {
    type: "boolean",
    description: "Include filler words (uh, um) in transcript",
    default: false
  },
  numerals: {
    type: "boolean",
    description: "Convert spoken numbers to digits",
    default: false
  },
  measurements: {
    type: "boolean",
    description: "Convert measurements to abbreviations",
    default: false
  },
  profanityFilter: {
    type: "boolean",
    description: "Filter profanity from transcript",
    default: false
  },
  dictation: {
    type: "boolean",
    description: "Enable dictation mode (optimized for dictation)",
    default: false
  },
  utteranceSplit: {
    type: "number",
    description: "Utterance split duration threshold in milliseconds",
    min: 0
  },

  // Advanced Analysis
  sentiment: {
    type: "boolean",
    description: "Enable real-time sentiment analysis",
    default: false
  },
  detectEntities: {
    type: "boolean",
    description: "Enable entity detection",
    default: false
  },
  topics: {
    type: "boolean",
    description: "Enable topic detection",
    default: false
  },
  customTopicMode: {
    type: "select",
    description: "Topic detection mode",
    options: Object.values(DeepgramTopicMode)
  },
  intents: {
    type: "boolean",
    description: "Enable intent recognition",
    default: false
  },
  summarize: {
    type: "boolean",
    description: "Enable summarization",
    default: false
  },

  // Endpoint Configuration
  endpointing: {
    type: "number",
    description: "Silence duration in ms to trigger endpoint (VAD)",
    min: 0
  },
  vadThreshold: {
    type: "number",
    description: "Voice activity detection threshold (0-1)",
    min: 0,
    max: 1
  }
} as const

/**
 * Deepgram streaming field configurations
 * Derived from DeepgramStreamingSchema - type-safe against the interface
 */
export const DeepgramStreamingFields = schemaToFieldConfigs(DeepgramStreamingSchema)

// ─────────────────────────────────────────────────────────────────────────────
// AssemblyAI Streaming Schema
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AssemblyAI streaming field schema
 *
 * Type-checked against AssemblyAIStreamingOptions - any property name mismatch
 * will cause a compile error.
 */
const AssemblyAIStreamingSchema: SchemaMap<AssemblyAIStreamingOptions> = {
  // Audio Format
  sampleRate: {
    type: "select",
    description: "Audio sample rate in Hz",
    options: Object.values(AssemblyAISampleRate),
    default: 16000
  },
  encoding: {
    type: "select",
    description: "Audio encoding format",
    options: Object.values(AssemblyAIEncoding),
    default: "pcm_s16le"
  },

  // Model & Language
  speechModel: {
    type: "select",
    description: "Speech model to use",
    options: Object.values(AssemblyAISpeechModel),
    default: "universal-streaming-multilingual"
  },
  languageDetection: {
    type: "boolean",
    description: "Enable automatic language detection",
    default: false
  },

  // End-of-Turn Detection
  endOfTurnConfidenceThreshold: {
    type: "number",
    description: "Confidence threshold for end-of-turn detection (0-1)",
    default: 0.5,
    min: 0,
    max: 1
  },
  minEndOfTurnSilenceWhenConfident: {
    type: "number",
    description: "Minimum silence (ms) to trigger end-of-turn when confident",
    default: 1000,
    min: 0
  },
  maxTurnSilence: {
    type: "number",
    description: "Maximum silence (ms) before forcing end-of-turn",
    default: 20000,
    min: 0
  },

  // Voice Activity Detection
  vadThreshold: {
    type: "number",
    description: "VAD sensitivity threshold (0-1). Lower = more sensitive",
    min: 0,
    max: 1
  },

  // Transcription Processing
  formatTurns: {
    type: "boolean",
    description: "Enable real-time text formatting of turns",
    default: true
  },
  filterProfanity: {
    type: "boolean",
    description: "Filter profanity in real-time transcription",
    default: false
  }
} as const

/**
 * AssemblyAI streaming field configurations
 * Derived from AssemblyAIStreamingSchema - type-safe against the interface
 */
export const AssemblyAIStreamingFields = schemaToFieldConfigs(AssemblyAIStreamingSchema)
