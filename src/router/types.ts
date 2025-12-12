/**
 * Unified types for the Voice Router SDK
 * These types provide a provider-agnostic interface for transcription services
 */

import type {
  AudioEncoding,
  AudioSampleRate,
  AudioChannels,
  AudioBitDepth
} from "./audio-encoding-types"

/**
 * Supported transcription providers
 */
export type TranscriptionProvider =
  | "gladia"
  | "assemblyai"
  | "deepgram"
  | "azure-stt"
  | "openai-whisper"
  | "speechmatics"

/**
 * Provider capabilities - indicates which features each provider supports
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
}

/**
 * Audio input for transcription
 */
export type AudioInput =
  | { type: "url"; url: string }
  | { type: "file"; file: Buffer | Blob; filename?: string }
  | { type: "stream"; stream: ReadableStream }

/**
 * Common transcription options across all providers
 */
export interface TranscribeOptions {
  /** Language code (e.g., 'en', 'en-US', 'es') */
  language?: string
  /** Enable automatic language detection */
  languageDetection?: boolean
  /** Enable speaker diarization */
  diarization?: boolean
  /** Expected number of speakers (for diarization) */
  speakersExpected?: number
  /** Enable word-level timestamps */
  wordTimestamps?: boolean
  /** Custom vocabulary to boost (provider-specific format) */
  customVocabulary?: string[]
  /** Enable summarization */
  summarization?: boolean
  /** Enable sentiment analysis */
  sentimentAnalysis?: boolean
  /** Enable entity detection */
  entityDetection?: boolean
  /** Enable PII redaction */
  piiRedaction?: boolean
  /** Webhook URL for async results */
  webhookUrl?: string
  /** Custom metadata to attach to the transcription */
  metadata?: Record<string, unknown>
}

/**
 * Speaker information from diarization
 */
export interface Speaker {
  /** Speaker identifier (e.g., "A", "B", "speaker_0") */
  id: string
  /** Speaker label if known */
  label?: string
  /** Confidence score for speaker identification (0-1) */
  confidence?: number
}

/**
 * Word-level transcription with timing
 */
export interface Word {
  /** The transcribed word */
  text: string
  /** Start time in seconds */
  start: number
  /** End time in seconds */
  end: number
  /** Confidence score (0-1) */
  confidence?: number
  /** Speaker ID if diarization is enabled */
  speaker?: string
}

/**
 * Utterance (sentence or phrase by a single speaker)
 */
export interface Utterance {
  /** The transcribed text */
  text: string
  /** Start time in seconds */
  start: number
  /** End time in seconds */
  end: number
  /** Speaker ID */
  speaker?: string
  /** Confidence score (0-1) */
  confidence?: number
  /** Words in this utterance */
  words?: Word[]
}

/**
 * Transcription status
 */
export type TranscriptionStatus = "queued" | "processing" | "completed" | "error"

/**
 * Unified transcription response
 */
export interface UnifiedTranscriptResponse {
  /** Operation success status */
  success: boolean
  /** Provider that performed the transcription */
  provider: TranscriptionProvider
  /** Transcription data (only present on success) */
  data?: {
    /** Unique transcription ID */
    id: string
    /** Full transcribed text */
    text: string
    /** Overall confidence score (0-1) */
    confidence?: number
    /** Transcription status */
    status: TranscriptionStatus
    /** Detected or specified language code */
    language?: string
    /** Audio duration in seconds */
    duration?: number
    /** Speaker diarization results */
    speakers?: Speaker[]
    /** Word-level transcription with timestamps */
    words?: Word[]
    /** Utterances (speaker turns) */
    utterances?: Utterance[]
    /** Summary of the content (if summarization enabled) */
    summary?: string
    /** Additional provider-specific metadata */
    metadata?: Record<string, unknown>
    /** Creation timestamp */
    createdAt?: string
    /** Completion timestamp */
    completedAt?: string
  }
  /** Error information (only present on failure) */
  error?: {
    /** Error code (provider-specific or normalized) */
    code: string
    /** Human-readable error message */
    message: string
    /** Additional error details */
    details?: unknown
    /** HTTP status code if applicable */
    statusCode?: number
  }
  /** Raw provider response (for advanced usage) */
  raw?: unknown
}

/**
 * Streaming transcription event types
 */
export type StreamEventType =
  | "open" // Connection established
  | "transcript" // Partial or final transcript
  | "utterance" // Complete utterance detected
  | "metadata" // Metadata about the stream
  | "error" // Error event
  | "close" // Stream ended/closed

/**
 * Streaming transcription event
 */
export interface StreamEvent {
  type: StreamEventType
  /** Partial transcript text (for type: "transcript") */
  text?: string
  /** Whether this is a final transcript (vs interim) */
  isFinal?: boolean
  /** Utterance data (for type: "utterance") */
  utterance?: Utterance
  /** Words in this event */
  words?: Word[]
  /** Speaker ID if diarization is enabled */
  speaker?: string
  /** Confidence score for this event */
  confidence?: number
  /** Error information (for type: "error") */
  error?: {
    code: string
    message: string
    details?: unknown
  }
  /** Additional event data */
  data?: unknown
}

/**
 * Audio chunk for streaming transcription
 */
export interface AudioChunk {
  /** Audio data as Buffer or Uint8Array */
  data: Buffer | Uint8Array
  /** Whether this is the last chunk */
  isLast?: boolean
}

/**
 * Options for streaming transcription
 */
export interface StreamingOptions extends Omit<TranscribeOptions, "webhookUrl"> {
  /**
   * Audio encoding format
   *
   * Common formats:
   * - `linear16`: PCM 16-bit (universal, recommended)
   * - `mulaw`: μ-law telephony codec
   * - `alaw`: A-law telephony codec
   * - `flac`, `opus`, `speex`: Advanced codecs (Deepgram only)
   *
   * @see AudioEncoding for full list of supported formats
   */
  encoding?: AudioEncoding
  /**
   * Sample rate in Hz
   *
   * Common rates: 8000, 16000, 32000, 44100, 48000
   * Most providers recommend 16000 Hz for optimal quality/performance
   */
  sampleRate?: AudioSampleRate | number
  /**
   * Number of audio channels
   *
   * - 1: Mono (recommended for transcription)
   * - 2: Stereo
   * - 3-8: Multi-channel (provider-specific support)
   */
  channels?: AudioChannels | number
  /**
   * Bit depth for PCM audio
   *
   * Common depths: 8, 16, 24, 32
   * 16-bit is standard for most applications
   */
  bitDepth?: AudioBitDepth | number
  /** Enable interim results (partial transcripts) */
  interimResults?: boolean
  /** Utterance end silence threshold in milliseconds */
  endpointing?: number
  /** Maximum duration without endpointing in seconds */
  maxSilence?: number
}

/**
 * Callback functions for streaming events
 */
export interface StreamingCallbacks {
  /** Called when connection is established */
  onOpen?: () => void
  /** Called when a transcript (interim or final) is received */
  onTranscript?: (event: StreamEvent) => void
  /** Called when a complete utterance is detected */
  onUtterance?: (utterance: Utterance) => void
  /** Called when metadata is received */
  onMetadata?: (metadata: Record<string, unknown>) => void
  /** Called when an error occurs */
  onError?: (error: { code: string; message: string; details?: unknown }) => void
  /** Called when the stream is closed */
  onClose?: (code?: number, reason?: string) => void
}

/**
 * Represents an active streaming transcription session
 */
export interface StreamingSession {
  /** Unique session ID */
  id: string
  /** Provider handling this stream */
  provider: TranscriptionProvider
  /** Send an audio chunk to the stream */
  sendAudio: (chunk: AudioChunk) => Promise<void>
  /** Close the streaming session */
  close: () => Promise<void>
  /** Get current session status */
  getStatus: () => "connecting" | "open" | "closing" | "closed"
  /** Session creation timestamp */
  createdAt: Date
}
