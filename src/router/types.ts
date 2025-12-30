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

// Streaming request types for type-safe streaming options
import type { StreamingRequest as GladiaStreamingRequest } from "../generated/gladia/schema/streamingRequest"

// ─────────────────────────────────────────────────────────────────────────────
// Extended response types - rich data from each provider (fully typed from OpenAPI)
// ─────────────────────────────────────────────────────────────────────────────

// AssemblyAI extended types
import type { Chapter as AssemblyAIChapter } from "../generated/assemblyai/schema/chapter"
import type { Entity as AssemblyAIEntity } from "../generated/assemblyai/schema/entity"
import type { SentimentAnalysisResult as AssemblyAISentimentResult } from "../generated/assemblyai/schema/sentimentAnalysisResult"
import type { AutoHighlightsResult as AssemblyAIHighlightsResult } from "../generated/assemblyai/schema/autoHighlightsResult"
import type { ContentSafetyLabelsResult as AssemblyAIContentSafetyResult } from "../generated/assemblyai/schema/contentSafetyLabelsResult"
import type { TopicDetectionModelResult as AssemblyAITopicsResult } from "../generated/assemblyai/schema/topicDetectionModelResult"

// Gladia extended types
import type { TranslationDTO as GladiaTranslation } from "../generated/gladia/schema/translationDTO"
import type { ModerationDTO as GladiaModeration } from "../generated/gladia/schema/moderationDTO"
import type { NamedEntityRecognitionDTO as GladiaEntities } from "../generated/gladia/schema/namedEntityRecognitionDTO"
import type { SentimentAnalysisDTO as GladiaSentiment } from "../generated/gladia/schema/sentimentAnalysisDTO"
import type { AudioToLlmListDTO as GladiaAudioToLlmResult } from "../generated/gladia/schema/audioToLlmListDTO"
import type { ChapterizationDTO as GladiaChapters } from "../generated/gladia/schema/chapterizationDTO"
import type { SpeakerReidentificationDTO as GladiaSpeakerReidentification } from "../generated/gladia/schema/speakerReidentificationDTO"
import type { StructuredDataExtractionDTO as GladiaStructuredData } from "../generated/gladia/schema/structuredDataExtractionDTO"

// Deepgram extended types
import type { ListenV1ResponseMetadata as DeepgramMetadata } from "../generated/deepgram/schema/listenV1ResponseMetadata"

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
export type TranscriptionLanguage = AssemblyAILanguageCode | GladiaLanguageCode | string

// Re-export provider-specific types for direct access
export type { ListenV1MediaTranscribeParams as DeepgramOptions }
export type { TranscriptOptionalParams as AssemblyAIOptions }
export type { InitTranscriptionRequest as GladiaOptions }
export type { CodeSwitchingConfigDTO as GladiaCodeSwitchingConfig }
export type { AudioToLlmListConfigDTO as GladiaAudioToLlmConfig }
export type { CreateTranscriptionRequest as OpenAIWhisperOptions }
// Note: GladiaStreamingOptions is defined in provider-streaming-types.ts
// This exports the raw request type for advanced usage
export type { GladiaStreamingRequest }

// Re-export extended response types for direct access
export type {
  AssemblyAIChapter,
  AssemblyAIEntity,
  AssemblyAISentimentResult,
  AssemblyAIHighlightsResult,
  AssemblyAIContentSafetyResult,
  AssemblyAITopicsResult,
  GladiaTranslation,
  GladiaModeration,
  GladiaEntities,
  GladiaSentiment,
  GladiaAudioToLlmResult,
  GladiaChapters,
  GladiaSpeakerReidentification,
  GladiaStructuredData,
  DeepgramMetadata
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider Extended Data Types - typed rich data beyond basic transcription
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extended data from AssemblyAI transcription
 * Includes chapters, entities, sentiment, content safety, and more
 */
export interface AssemblyAIExtendedData {
  /** Auto-generated chapters with summaries */
  chapters?: AssemblyAIChapter[]
  /** Detected named entities (people, organizations, locations) */
  entities?: AssemblyAIEntity[]
  /** Per-utterance sentiment analysis results */
  sentimentResults?: AssemblyAISentimentResult[]
  /** Key phrases and highlights */
  highlights?: AssemblyAIHighlightsResult
  /** Content safety/moderation labels */
  contentSafety?: AssemblyAIContentSafetyResult
  /** IAB topic categories */
  topics?: AssemblyAITopicsResult
  /** Language detection confidence (0-1) */
  languageConfidence?: number
  /** Whether the request was throttled */
  throttled?: boolean
}

/**
 * Extended data from Gladia transcription
 * Includes translation, moderation, entities, LLM outputs, and more
 */
export interface GladiaExtendedData {
  /** Translation results (if translation enabled) */
  translation?: GladiaTranslation
  /** Content moderation results */
  moderation?: GladiaModeration
  /** Named entity recognition results */
  entities?: GladiaEntities
  /** Sentiment analysis results */
  sentiment?: GladiaSentiment
  /** Audio-to-LLM custom prompt results */
  audioToLlm?: GladiaAudioToLlmResult
  /** Auto-generated chapters */
  chapters?: GladiaChapters
  /** AI speaker reidentification results */
  speakerReidentification?: GladiaSpeakerReidentification
  /** Structured data extraction results */
  structuredData?: GladiaStructuredData
  /** Custom metadata echoed back */
  customMetadata?: Record<string, unknown>
}

/**
 * Extended data from Deepgram transcription
 * Includes detailed metadata, model info, and feature-specific data
 */
export interface DeepgramExtendedData {
  /** Full response metadata */
  metadata?: DeepgramMetadata
  /** Request ID for debugging/tracking */
  requestId?: string
  /** SHA256 hash of the audio */
  sha256?: string
  /** Model versions used */
  modelInfo?: Record<string, unknown>
  /** Tags echoed back from request */
  tags?: string[]
}

/**
 * Map of provider names to their extended data types
 */
export type ProviderExtendedDataMap = {
  assemblyai: AssemblyAIExtendedData
  gladia: GladiaExtendedData
  deepgram: DeepgramExtendedData
  "openai-whisper": Record<string, never> // No extended data
  "azure-stt": Record<string, never> // No extended data
  speechmatics: Record<string, never> // No extended data
}

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
 * When a specific provider is known at compile time, both `raw` and `extended`
 * fields will be typed with that provider's actual types.
 *
 * @template P - The transcription provider (defaults to all providers)
 *
 * @example Type narrowing with specific provider
 * ```typescript
 * const result: UnifiedTranscriptResponse<'assemblyai'> = await adapter.transcribe(audio);
 * // result.raw is typed as AssemblyAITranscript
 * // result.extended is typed as AssemblyAIExtendedData
 * const chapters = result.extended?.chapters; // AssemblyAIChapter[] | undefined
 * const entities = result.extended?.entities; // AssemblyAIEntity[] | undefined
 * ```
 *
 * @example Accessing Gladia extended data
 * ```typescript
 * const result: UnifiedTranscriptResponse<'gladia'> = await gladiaAdapter.transcribe(audio);
 * const translation = result.extended?.translation; // GladiaTranslation | undefined
 * const llmResults = result.extended?.audioToLlm; // GladiaAudioToLlmResult | undefined
 * ```
 *
 * @example Generic usage (all providers)
 * ```typescript
 * const result: UnifiedTranscriptResponse = await router.transcribe(audio);
 * // result.raw is typed as unknown (could be any provider)
 * // result.extended is typed as union of all extended types
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
  /**
   * Extended provider-specific data (fully typed from OpenAPI specs)
   *
   * Contains rich data beyond basic transcription:
   * - AssemblyAI: chapters, entities, sentiment, content safety, topics
   * - Gladia: translation, moderation, entities, audio-to-llm, chapters
   * - Deepgram: detailed metadata, request tracking, model info
   *
   * @example Access AssemblyAI chapters
   * ```typescript
   * const result = await assemblyaiAdapter.transcribe(audio, { summarization: true });
   * result.extended?.chapters?.forEach(chapter => {
   *   console.log(`${chapter.headline}: ${chapter.summary}`);
   * });
   * ```
   */
  extended?: P extends keyof ProviderExtendedDataMap ? ProviderExtendedDataMap[P] : unknown
  /**
   * Request tracking information for debugging
   */
  tracking?: {
    /** Provider's request/job ID */
    requestId?: string
    /** Audio fingerprint (SHA256) if available */
    audioHash?: string
    /** Processing duration in milliseconds */
    processingTimeMs?: number
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

  // ─────────────────────────────────────────────────────────────────
  // Provider-specific streaming options with FULL type safety
  // ─────────────────────────────────────────────────────────────────

  /**
   * Gladia-specific streaming options (passed directly to API)
   *
   * Includes pre_processing, realtime_processing, post_processing,
   * messages_config, and callback configuration.
   *
   * @see https://docs.gladia.io/api-reference/v2/live
   *
   * @example
   * ```typescript
   * await adapter.transcribeStream({
   *   gladiaStreaming: {
   *     realtime_processing: {
   *       words_accurate_timestamps: true
   *     },
   *     messages_config: {
   *       receive_partial_transcripts: true
   *     }
   *   }
   * });
   * ```
   */
  gladiaStreaming?: Partial<
    Omit<GladiaStreamingRequest, "encoding" | "sample_rate" | "bit_depth" | "channels">
  >
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
