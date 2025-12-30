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

// Provider-specific response types for type-safe raw responses
import type { ListenV1Response } from "../generated/deepgram/schema/listenV1Response"
import type { PreRecordedResponse } from "../generated/gladia/schema/preRecordedResponse"
import type { CreateTranscription200One } from "../generated/openai/schema/createTranscription200One"
import type { Transcript as AssemblyAITranscript } from "../generated/assemblyai/schema/transcript"
import type { Transcription as AzureTranscription } from "../generated/azure/schema/transcription"

// Provider-specific model types for type-safe model selection
import type { ListenV1ModelParameter } from "../generated/deepgram/schema/listenV1ModelParameter"
import type { StreamingSupportedModels } from "../generated/gladia/schema/streamingSupportedModels"
import type { SpeechModel as AssemblyAISpeechModel } from "../generated/assemblyai/schema/speechModel"

// Provider-specific language types for type-safe language selection
import type { TranscriptLanguageCode as AssemblyAILanguageCode } from "../generated/assemblyai/schema/transcriptLanguageCode"
import type { TranscriptionLanguageCodeEnum as GladiaLanguageCode } from "../generated/gladia/schema/transcriptionLanguageCodeEnum"

// Provider-specific request types for full type safety
import type { ListenV1MediaTranscribeParams } from "../generated/deepgram/schema/listenV1MediaTranscribeParams"
import type { TranscriptOptionalParams } from "../generated/assemblyai/schema/transcriptOptionalParams"
import type { InitTranscriptionRequest } from "../generated/gladia/schema/initTranscriptionRequest"
import type { CodeSwitchingConfigDTO } from "../generated/gladia/schema/codeSwitchingConfigDTO"
import type { AudioToLlmListConfigDTO } from "../generated/gladia/schema/audioToLlmListConfigDTO"
import type { CreateTranscriptionRequest } from "../generated/openai/schema/createTranscriptionRequest"

/**
 * Speechmatics operating point (model) type
 * Manually defined as Speechmatics OpenAPI spec doesn't export this cleanly
 */
export type SpeechmaticsOperatingPoint = "standard" | "enhanced"

/**
 * Unified transcription model type with autocomplete for all providers
 *
 * Includes all known models from:
 * - Deepgram: nova-3, nova-2, enhanced, base, whisper, etc.
 * - AssemblyAI: best, slam-1, universal
 * - Gladia: solaria-1
 * - Speechmatics: standard, enhanced
 *
 * Also accepts any string for future/custom models.
 */
export type TranscriptionModel =
  | ListenV1ModelParameter
  | StreamingSupportedModels
  | AssemblyAISpeechModel
  | SpeechmaticsOperatingPoint

/**
 * Unified transcription language type with autocomplete for all providers
 *
 * Includes language codes from AssemblyAI and Gladia OpenAPI specs.
 * Deepgram uses string for flexibility.
 */
export type TranscriptionLanguage =
  | AssemblyAILanguageCode
  | GladiaLanguageCode
  | string

// Re-export provider-specific types for direct access
export type { ListenV1MediaTranscribeParams as DeepgramOptions }
export type { TranscriptOptionalParams as AssemblyAIOptions }
export type { InitTranscriptionRequest as GladiaOptions }
export type { CodeSwitchingConfigDTO as GladiaCodeSwitchingConfig }
export type { AudioToLlmListConfigDTO as GladiaAudioToLlmConfig }
export type { CreateTranscriptionRequest as OpenAIWhisperOptions }

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
 * Providers that support real-time streaming transcription
 */
export type StreamingProvider = "gladia" | "deepgram" | "assemblyai"

/**
 * Providers that only support batch/async transcription
 */
export type BatchOnlyProvider = "azure-stt" | "openai-whisper" | "speechmatics"

/**
 * WebSocket session status for streaming transcription
 */
export type SessionStatus = "connecting" | "open" | "closing" | "closed"

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
 *
 * For provider-specific options, use the typed provider options:
 * - `deepgram`: Full Deepgram API options
 * - `assemblyai`: Full AssemblyAI API options
 * - `gladia`: Full Gladia API options
 */
export interface TranscribeOptions {
  /**
   * Model to use for transcription (provider-specific)
   *
   * Type-safe model selection derived from OpenAPI specs:
   * - Deepgram: 'nova-3', 'nova-2', 'enhanced', 'base', etc.
   * - AssemblyAI: 'best', 'slam-1', 'universal'
   * - Speechmatics: 'standard', 'enhanced' (operating point)
   * - Gladia: 'solaria-1' (streaming only)
   *
   * @see TranscriptionModel for full list of available models
   */
  model?: TranscriptionModel

  /**
   * Language code with autocomplete from OpenAPI specs
   *
   * @example 'en', 'en_us', 'fr', 'de', 'es'
   * @see TranscriptionLanguage for full list
   */
  language?: TranscriptionLanguage

  /** Enable automatic language detection */
  languageDetection?: boolean

  /**
   * Enable code switching (multilingual audio detection)
   * Supported by: Gladia
   */
  codeSwitching?: boolean

  /**
   * Code switching configuration (Gladia-specific)
   * @see GladiaCodeSwitchingConfig
   */
  codeSwitchingConfig?: CodeSwitchingConfigDTO

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

  /**
   * Audio-to-LLM configuration (Gladia-specific)
   * Run custom LLM prompts on the transcription
   * @see GladiaAudioToLlmConfig
   */
  audioToLlm?: AudioToLlmListConfigDTO

  // ─────────────────────────────────────────────────────────────────
  // Provider-specific options with FULL type safety from OpenAPI specs
  // These are passed directly to the provider API
  // ─────────────────────────────────────────────────────────────────

  /**
   * Deepgram-specific options (passed directly to API)
   * @see https://developers.deepgram.com/reference/listen-file
   */
  deepgram?: Partial<ListenV1MediaTranscribeParams>

  /**
   * AssemblyAI-specific options (passed directly to API)
   * @see https://www.assemblyai.com/docs/api-reference/transcripts/submit
   */
  assemblyai?: Partial<TranscriptOptionalParams>

  /**
   * Gladia-specific options (passed directly to API)
   * @see https://docs.gladia.io/
   */
  gladia?: Partial<InitTranscriptionRequest>

  /**
   * OpenAI Whisper-specific options (passed directly to API)
   * @see https://platform.openai.com/docs/api-reference/audio/createTranscription
   */
  openai?: Partial<Omit<CreateTranscriptionRequest, "file" | "model">>
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
 * Map of provider names to their raw response types
 * Enables type-safe access to provider-specific raw responses
 */
export type ProviderRawResponseMap = {
  gladia: PreRecordedResponse
  deepgram: ListenV1Response
  "openai-whisper": CreateTranscription200One
  assemblyai: AssemblyAITranscript
  "azure-stt": AzureTranscription
  speechmatics: unknown // No generated type available yet
}

/**
 * Unified transcription response with provider-specific type safety
 *
 * When a specific provider is known at compile time, the `raw` field
 * will be typed with that provider's actual response type.
 *
 * @template P - The transcription provider (defaults to all providers)
 *
 * @example Type narrowing with specific provider
 * ```typescript
 * const result: UnifiedTranscriptResponse<'deepgram'> = await adapter.transcribe(audio);
 * // result.raw is typed as ListenV1Response
 * const deepgramMetadata = result.raw?.metadata;
 * ```
 *
 * @example Generic usage (all providers)
 * ```typescript
 * const result: UnifiedTranscriptResponse = await router.transcribe(audio);
 * // result.raw is typed as unknown (could be any provider)
 * ```
 */
export interface UnifiedTranscriptResponse<
  P extends TranscriptionProvider = TranscriptionProvider
> {
  /** Operation success status */
  success: boolean
  /** Provider that performed the transcription */
  provider: P
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
  /**
   * Raw provider response (for advanced usage)
   *
   * Type-safe based on the provider:
   * - `gladia`: PreRecordedResponse
   * - `deepgram`: ListenV1Response
   * - `openai-whisper`: CreateTranscription200One
   * - `assemblyai`: AssemblyAITranscript
   * - `azure-stt`: AzureTranscription
   */
  raw?: P extends keyof ProviderRawResponseMap ? ProviderRawResponseMap[P] : unknown
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
  /**
   * Model to use for transcription (provider-specific)
   *
   * Type-safe with autocomplete for all known models:
   * - Deepgram: 'nova-2', 'nova-3', 'base', 'enhanced', 'whisper-large', etc.
   * - Gladia: 'solaria-1' (default)
   * - AssemblyAI: Not applicable (uses Universal-2 automatically)
   *
   * @example
   * // Use Nova-2 for better multilingual support
   * { model: 'nova-2', language: 'fr' }
   */
  model?: TranscriptionModel
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
