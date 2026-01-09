/**
 * Core types - Browser-safe type definitions
 *
 * This file contains foundational types used across the SDK.
 * It has NO Node.js dependencies and is safe for browser use.
 *
 * @packageDocumentation
 */

// ─────────────────────────────────────────────────────────────────────────────
// Provider Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Supported transcription provider identifiers
 */
export type TranscriptionProvider =
  | "gladia"
  | "assemblyai"
  | "deepgram"
  | "openai-whisper"
  | "azure-stt"
  | "speechmatics"

/**
 * Provider capability flags
 *
 * Each boolean indicates whether the provider supports a specific feature.
 * Use ProviderCapabilitiesMap from provider-metadata for runtime access.
 */
export interface ProviderCapabilities {
  /** Real-time streaming transcription support */
  streaming: boolean
  /** Speaker diarization (identifying different speakers) */
  diarization: boolean
  /** Word-level timestamps */
  wordTimestamps: boolean
  /** Automatic language detection */
  languageDetection: boolean
  /** Custom vocabulary/keyword boosting */
  customVocabulary: boolean
  /** Audio summarization */
  summarization: boolean
  /** Sentiment analysis */
  sentimentAnalysis: boolean
  /** Entity detection */
  entityDetection: boolean
  /** PII redaction */
  piiRedaction: boolean
  /** List/fetch previous transcriptions */
  listTranscripts: boolean
  /** Delete transcriptions */
  deleteTranscript: boolean
  /** Download original audio file */
  getAudioFile?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Transcript Status Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Unified transcript status across all providers
 */
export type TranscriptStatus =
  | "queued"
  | "processing"
  | "completed"
  | "error"

// ─────────────────────────────────────────────────────────────────────────────
// Audio Input Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Audio input from a URL
 */
export interface AudioInputUrl {
  type: "url"
  url: string
}

/**
 * Audio input from a file/buffer
 */
export interface AudioInputFile {
  type: "file"
  file: Buffer | Blob
  filename?: string
  mimeType?: string
}

/**
 * Audio input from a stream (for streaming transcription)
 */
export interface AudioInputStream {
  type: "stream"
  stream: ReadableStream | NodeJS.ReadableStream
}

/**
 * Union of all audio input types
 */
export type AudioInput = AudioInputUrl | AudioInputFile | AudioInputStream
