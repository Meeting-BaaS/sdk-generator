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
import type { DeepgramModelType } from "./streaming-enums"
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
import type { StreamingSupportedRegions } from "../generated/gladia/schema/streamingSupportedRegions"
import type {
  DeepgramStreamingOptions,
  AssemblyAIStreamingOptions,
  OpenAIStreamingOptions,
  SonioxStreamingOptions
} from "./provider-streaming-types"

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
 * Strict union type - only accepts valid models from each provider:
 * - Deepgram: nova-3, nova-2, enhanced, base, etc.
 * - AssemblyAI: best, slam-1, universal
 * - Gladia: solaria-1
 * - Speechmatics: standard, enhanced
 *
 * Use provider const objects for autocomplete:
 * @example
 * ```typescript
 * import { DeepgramModel } from 'voice-router-dev'
 * { model: DeepgramModel["nova-3"] }
 * ```
 */
export type TranscriptionModel =
  | DeepgramModelType
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
  soniox: Record<string, never> // Extended data via streaming types
}

// Re-export core types (browser-safe)
export type { TranscriptionProvider, ProviderCapabilities, AudioInput } from "../types/core"
import type { TranscriptionProvider } from "../types/core"

// Import derived streaming types from provider-metadata (compile-time derived from capabilities)
import type { StreamingProviderType, BatchOnlyProviderType } from "../provider-metadata"

/**
 * Providers that support real-time streaming transcription
 *
 * This type is automatically derived from ProviderCapabilitiesMap.streaming in provider-metadata.ts
 * No manual sync needed - if you set `streaming: true` for a provider, it's included here.
 */
export type StreamingProvider = StreamingProviderType

/**
 * Providers that only support batch/async transcription
 *
 * Automatically derived from providers where streaming is false or undefined.
 * Note: Speechmatics has a WebSocket API but streaming is not yet implemented in this SDK.
 */
export type BatchOnlyProvider = BatchOnlyProviderType

/**
 * WebSocket session status for streaming transcription
 */
export type SessionStatus = "connecting" | "open" | "closing" | "closed"

// ProviderCapabilities is re-exported from ../types/core above

// Provider-specific list params for type-safe passthrough
import type { ListTranscriptsParams as AssemblyAIListParams } from "../generated/assemblyai/schema/listTranscriptsParams"
import type { TranscriptionControllerListV2Params as GladiaListParams } from "../generated/gladia/schema/transcriptionControllerListV2Params"
import type { ManageV1ProjectsRequestsListParams as DeepgramListParams } from "../generated/deepgram/schema/manageV1ProjectsRequestsListParams"

/**
 * Options for listing transcripts with date/time filtering
 *
 * Providers support different filtering capabilities:
 * - AssemblyAI: status, created_on, before_id, after_id, throttled_only
 * - Gladia: status, date, before_date, after_date, custom_metadata
 * - Azure: status, skip, top, filter (OData)
 * - Deepgram: start, end, status, page, request_id, endpoint (requires projectId)
 *
 * @example Filter by date
 * ```typescript
 * await adapter.listTranscripts({
 *   date: '2026-01-07',           // Exact date (ISO format)
 *   status: 'completed',
 *   limit: 50
 * })
 * ```
 *
 * @example Filter by date range
 * ```typescript
 * await adapter.listTranscripts({
 *   afterDate: '2026-01-01',
 *   beforeDate: '2026-01-31',
 *   limit: 100
 * })
 * ```
 */
export interface ListTranscriptsOptions {
  /** Maximum number of transcripts to retrieve */
  limit?: number
  /** Pagination offset (skip N results) */
  offset?: number
  /** Filter by transcript status */
  status?: "queued" | "processing" | "completed" | "error" | string
  /** Filter by exact date (ISO format: YYYY-MM-DD) */
  date?: string
  /** Filter for transcripts created before this date (ISO format) */
  beforeDate?: string
  /** Filter for transcripts created after this date (ISO format) */
  afterDate?: string

  // Provider-specific passthrough options
  /** AssemblyAI-specific list options */
  assemblyai?: Partial<AssemblyAIListParams>
  /** Gladia-specific list options */
  gladia?: Partial<GladiaListParams>
  /** Deepgram-specific list options (request history) */
  deepgram?: Partial<DeepgramListParams>
}

// AudioInput is re-exported from ../types/core above

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
  word: string
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

// ─────────────────────────────────────────────────────────────────────────────
// Transcript Data Types (for listTranscripts and getTranscript responses)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Transcript metadata with typed common fields
 *
 * Contains provider-agnostic metadata fields that are commonly available.
 * Provider-specific fields can be accessed via the index signature.
 *
 * @example
 * ```typescript
 * const { transcripts } = await router.listTranscripts('assemblyai', { limit: 20 });
 * transcripts.forEach(item => {
 *   console.log(item.data?.metadata?.audioUrl);     // string | undefined
 *   console.log(item.data?.metadata?.createdAt);    // string | undefined
 *   console.log(item.data?.metadata?.audioDuration); // number | undefined
 * });
 * ```
 */
export interface TranscriptMetadata {
  /**
   * Original audio URL/source you provided to the API (echoed back).
   * This is NOT a provider-hosted URL - it's what you sent when creating the transcription.
   */
  sourceAudioUrl?: string

  /**
   * True if the provider stored the audio and it can be downloaded via adapter.getAudioFile().
   * Currently only Gladia supports this - other providers discard audio after processing.
   *
   * @example
   * ```typescript
   * if (item.data?.metadata?.audioFileAvailable) {
   *   const audio = await gladiaAdapter.getAudioFile(item.data.id)
   *   // audio.data is a Blob
   * }
   * ```
   */
  audioFileAvailable?: boolean

  /** Resource URL for the transcript */
  resourceUrl?: string
  /** Creation timestamp (ISO 8601) */
  createdAt?: string
  /** Completion timestamp (ISO 8601) */
  completedAt?: string
  /** Last action timestamp (Azure) */
  lastActionAt?: string
  /** Audio duration in seconds */
  audioDuration?: number
  /** Transcript type */
  kind?: "batch" | "pre-recorded" | "live" | "streaming"
  /** Display name (Azure) */
  displayName?: string
  /** Files URL (Azure) */
  filesUrl?: string
  /** Custom metadata (Gladia) */
  customMetadata?: Record<string, unknown>
  /** Provider-specific fields */
  [key: string]: unknown
}

/**
 * Transcript data structure
 *
 * Contains the core transcript information returned by getTranscript and listTranscripts.
 *
 * @example
 * ```typescript
 * const result = await router.getTranscript('abc123', 'assemblyai');
 * if (result.success && result.data) {
 *   console.log(result.data.id);           // string
 *   console.log(result.data.text);         // string
 *   console.log(result.data.status);       // TranscriptionStatus
 *   console.log(result.data.metadata);     // TranscriptMetadata
 * }
 * ```
 */
export interface TranscriptData {
  /** Unique transcript ID */
  id: string
  /** Full transcribed text (empty for list items) */
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
  /** Transcript metadata */
  metadata?: TranscriptMetadata
  /** Creation timestamp (shorthand for metadata.createdAt) */
  createdAt?: string
  /** Completion timestamp (shorthand for metadata.completedAt) */
  completedAt?: string
}

/**
 * Response from listTranscripts
 *
 * @example
 * ```typescript
 * import type { ListTranscriptsResponse } from 'voice-router-dev';
 *
 * const response: ListTranscriptsResponse = await router.listTranscripts('assemblyai', {
 *   status: 'completed',
 *   limit: 50
 * });
 *
 * response.transcripts.forEach(item => {
 *   console.log(item.data?.id, item.data?.status);
 * });
 *
 * if (response.hasMore) {
 *   // Fetch next page
 * }
 * ```
 */
export interface ListTranscriptsResponse {
  /** List of transcripts */
  transcripts: UnifiedTranscriptResponse[]
  /** Total count (if available from provider) */
  total?: number
  /** Whether more results are available */
  hasMore?: boolean
}

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
  soniox: unknown // Uses streaming types
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
  data?: TranscriptData
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
  // Gladia-specific event types
  | "speech_start" // Speech detected start
  | "speech_end" // Speech detected end
  | "translation" // Real-time translation result
  | "sentiment" // Sentiment analysis result
  | "entity" // Named entity recognition result
  | "summarization" // Post-processing summarization
  | "chapterization" // Post-processing chapterization
  | "audio_ack" // Audio chunk acknowledgment
  | "lifecycle" // Session lifecycle events (start_session, end_recording, etc.)

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
  /** Language of the transcript/utterance */
  language?: string
  /** Channel number for multi-channel audio */
  channel?: number
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
 * Speech event data (for speech_start/speech_end events)
 */
export interface SpeechEvent {
  /** Event type: speech_start or speech_end */
  type: "speech_start" | "speech_end"
  /** Timestamp in seconds */
  timestamp: number
  /** Channel number */
  channel?: number
  /** Session ID */
  sessionId?: string
}

/**
 * Translation event data (for real-time translation)
 */
export interface TranslationEvent {
  /** Utterance ID this translation belongs to */
  utteranceId?: string
  /** Original text */
  original?: string
  /** Target language */
  targetLanguage: string
  /** Translated text */
  translatedText: string
  /** Whether this is a final translation */
  isFinal?: boolean
}

/**
 * Sentiment analysis result (for real-time sentiment)
 */
export interface SentimentEvent {
  /** Utterance ID this sentiment belongs to */
  utteranceId?: string
  /** Sentiment label (positive, negative, neutral) */
  sentiment: string
  /** Confidence score 0-1 */
  confidence?: number
}

/**
 * Named entity recognition result
 */
export interface EntityEvent {
  /** Utterance ID this entity belongs to */
  utteranceId?: string
  /** Entity text */
  text: string
  /** Entity type (PERSON, ORGANIZATION, LOCATION, etc.) */
  type: string
  /** Start position */
  start?: number
  /** End position */
  end?: number
}

/**
 * Post-processing summarization event
 */
export interface SummarizationEvent {
  /** Full summarization text */
  summary: string
  /** Error if summarization failed */
  error?: string
}

/**
 * Post-processing chapterization event
 */
export interface ChapterizationEvent {
  /** Generated chapters */
  chapters: Array<{
    /** Chapter title/headline */
    headline: string
    /** Chapter summary */
    summary: string
    /** Start time in seconds */
    start: number
    /** End time in seconds */
    end: number
  }>
  /** Error if chapterization failed */
  error?: string
}

/**
 * Audio chunk acknowledgment event
 */
export interface AudioAckEvent {
  /** Byte range of the acknowledged audio chunk [start, end] */
  byteRange?: [number, number]
  /** Time range in seconds of the acknowledged audio chunk [start, end] */
  timeRange?: [number, number]
  /** Acknowledgment timestamp */
  timestamp?: string
}

/**
 * Lifecycle event (session start, recording end, etc.)
 */
export interface LifecycleEvent {
  /** Lifecycle event type */
  eventType:
    | "start_session"
    | "start_recording"
    | "stop_recording"
    | "end_recording"
    | "end_session"
  /** Event timestamp */
  timestamp?: string
  /** Session ID */
  sessionId?: string
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

  /**
   * Deepgram-specific streaming options (passed to WebSocket URL)
   *
   * Includes filler_words, numerals, measurements, paragraphs,
   * profanity_filter, topics, intents, custom_topic, custom_intent,
   * keyterm, dictation, utt_split, and more.
   *
   * @see https://developers.deepgram.com/docs/streaming
   *
   * @example
   * ```typescript
   * await adapter.transcribeStream({
   *   deepgramStreaming: {
   *     fillerWords: true,
   *     profanityFilter: true,
   *     topics: true,
   *     intents: true,
   *     customTopic: ['sales', 'support'],
   *     customIntent: ['purchase', 'complaint'],
   *     numerals: true
   *   }
   * });
   * ```
   */
  deepgramStreaming?: DeepgramStreamingOptions

  /**
   * AssemblyAI-specific streaming options (passed to WebSocket URL & configuration)
   *
   * Includes end-of-turn detection tuning, VAD threshold, profanity filter,
   * keyterms, speech model selection, and language detection.
   *
   * @see https://www.assemblyai.com/docs/speech-to-text/streaming
   *
   * @example
   * ```typescript
   * await adapter.transcribeStream({
   *   assemblyaiStreaming: {
   *     speechModel: 'universal-streaming-multilingual',
   *     languageDetection: true,
   *     endOfTurnConfidenceThreshold: 0.7,
   *     minEndOfTurnSilenceWhenConfident: 500,
   *     vadThreshold: 0.3,
   *     formatTurns: true,
   *     filterProfanity: true,
   *     keyterms: ['TypeScript', 'JavaScript', 'API']
   *   }
   * });
   * ```
   */
  assemblyaiStreaming?: AssemblyAIStreamingOptions

  /**
   * OpenAI Realtime API streaming options
   *
   * Configure the OpenAI Realtime WebSocket connection for audio transcription.
   * Uses the Realtime API which supports real-time audio input transcription.
   *
   * @see https://platform.openai.com/docs/guides/realtime
   *
   * @example
   * ```typescript
   * await adapter.transcribeStream({
   *   openaiStreaming: {
   *     model: 'gpt-4o-realtime-preview',
   *     voice: 'alloy',
   *     turnDetection: {
   *       type: 'server_vad',
   *       threshold: 0.5,
   *       silenceDurationMs: 500
   *     }
   *   }
   * });
   * ```
   */
  openaiStreaming?: OpenAIStreamingOptions

  /**
   * Soniox-specific streaming options
   *
   * Configure the Soniox WebSocket connection for real-time transcription.
   * Supports speaker diarization, language identification, translation, and custom context.
   *
   * @see https://soniox.com/docs/stt/SDKs/web-sdk
   *
   * @example
   * ```typescript
   * await adapter.transcribeStream({
   *   sonioxStreaming: {
   *     model: 'stt-rt-preview',
   *     enableSpeakerDiarization: true,
   *     enableEndpointDetection: true,
   *     context: {
   *       terms: ['TypeScript', 'React'],
   *       text: 'Technical discussion'
   *     },
   *     translation: { type: 'one_way', target_language: 'es' }
   *   }
   * });
   * ```
   */
  sonioxStreaming?: SonioxStreamingOptions

  /**
   * Regional endpoint for streaming (Gladia only)
   *
   * Gladia supports regional streaming endpoints for lower latency:
   * - `us-west`: US West Coast
   * - `eu-west`: EU West (Ireland)
   *
   * @example
   * ```typescript
   * import { GladiaRegion } from 'voice-router-dev/constants'
   *
   * await adapter.transcribeStream({
   *   region: GladiaRegion["us-west"]
   * })
   * ```
   *
   * @see https://docs.gladia.io/api-reference/v2/live
   */
  region?: StreamingSupportedRegions
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

  // ─────────────────────────────────────────────────────────────────
  // Gladia-specific streaming callbacks
  // ─────────────────────────────────────────────────────────────────

  /** Called when speech starts (Gladia: requires receive_speech_events) */
  onSpeechStart?: (event: SpeechEvent) => void
  /** Called when speech ends (Gladia: requires receive_speech_events) */
  onSpeechEnd?: (event: SpeechEvent) => void
  /** Called for real-time translation (Gladia: requires translation enabled) */
  onTranslation?: (event: TranslationEvent) => void
  /** Called for real-time sentiment analysis (Gladia: requires sentiment_analysis enabled) */
  onSentiment?: (event: SentimentEvent) => void
  /** Called for named entity recognition (Gladia: requires named_entity_recognition enabled) */
  onEntity?: (event: EntityEvent) => void
  /** Called when post-processing summarization completes (Gladia: requires summarization enabled) */
  onSummarization?: (event: SummarizationEvent) => void
  /** Called when post-processing chapterization completes (Gladia: requires chapterization enabled) */
  onChapterization?: (event: ChapterizationEvent) => void
  /** Called for audio chunk acknowledgments (Gladia: requires receive_acknowledgments) */
  onAudioAck?: (event: AudioAckEvent) => void
  /** Called for session lifecycle events (Gladia: requires receive_lifecycle_events) */
  onLifecycle?: (event: LifecycleEvent) => void
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
