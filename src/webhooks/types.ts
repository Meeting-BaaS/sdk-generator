/**
 * Unified webhook types for transcription providers
 * Normalizes webhook callbacks from different providers to a common format
 */

import type {
  Speaker,
  TranscriptionProvider,
  TranscriptionStatus,
  Utterance,
  Word
} from "../router/types"

// Provider-specific webhook payload types (fully typed from OpenAPI)
import type { CallbackTranscriptionSuccessPayload as GladiaWebhookSuccessPayload } from "../generated/gladia/schema/callbackTranscriptionSuccessPayload"
import type { CallbackTranscriptionErrorPayload as GladiaWebhookErrorPayload } from "../generated/gladia/schema/callbackTranscriptionErrorPayload"
import type { TranscriptWebhookNotification as AssemblyAIWebhookPayload } from "../generated/assemblyai/schema/transcriptWebhookNotification"
import type { ListenV1Response as DeepgramWebhookPayload } from "../generated/deepgram/schema/listenV1Response"

// Re-export webhook payload types for direct access
export type {
  GladiaWebhookSuccessPayload,
  GladiaWebhookErrorPayload,
  AssemblyAIWebhookPayload,
  DeepgramWebhookPayload
}

/**
 * Union of all Gladia webhook payloads
 */
export type GladiaWebhookPayload = GladiaWebhookSuccessPayload | GladiaWebhookErrorPayload

/**
 * Map of provider names to their webhook payload types
 */
export type ProviderWebhookPayloadMap = {
  gladia: GladiaWebhookPayload
  assemblyai: AssemblyAIWebhookPayload
  deepgram: DeepgramWebhookPayload
  "azure-stt": unknown
  "openai-whisper": never // No webhooks
  speechmatics: unknown
}

/**
 * Unified webhook event types
 */
export type WebhookEventType =
  | "transcription.created" // Job created/queued
  | "transcription.processing" // Job started processing
  | "transcription.completed" // Job completed successfully
  | "transcription.failed" // Job failed with error
  | "live.session_started" // Live streaming session started
  | "live.session_ended" // Live streaming session ended
  | "live.transcript" // Live transcript update

/**
 * Unified webhook event with provider-specific type safety
 *
 * When a specific provider is known at compile time, the `raw` field
 * will be typed with that provider's actual webhook payload type.
 *
 * @template P - The transcription provider (defaults to all providers)
 *
 * @example Type-safe Gladia webhook handling
 * ```typescript
 * const event: UnifiedWebhookEvent<'gladia'> = handler.parse(payload);
 * // event.raw is typed as GladiaWebhookPayload
 * if ('payload' in event.raw) {
 *   const transcription = event.raw.payload; // TranscriptionResultDTO
 * }
 * ```
 */
export interface UnifiedWebhookEvent<P extends TranscriptionProvider = TranscriptionProvider> {
  /** Whether the operation was successful */
  success: boolean
  /** Provider that sent this webhook */
  provider: P
  /** Type of webhook event */
  eventType: WebhookEventType
  /** Transcription data (if available) */
  data?: {
    /** Transcription job ID */
    id: string
    /** Current status */
    status: TranscriptionStatus
    /** Full transcribed text (only for completed events) */
    text?: string
    /** Overall confidence score */
    confidence?: number
    /** Audio duration in seconds */
    duration?: number
    /** Detected or specified language */
    language?: string
    /** Speaker diarization results */
    speakers?: Speaker[]
    /** Word-level transcription */
    words?: Word[]
    /** Utterances (speaker turns) */
    utterances?: Utterance[]
    /** Summary of content */
    summary?: string
    /** Error message (only for failed events) */
    error?: string
    /** Additional provider-specific metadata */
    metadata?: Record<string, unknown>
    /** Creation timestamp */
    createdAt?: string
    /** Completion timestamp */
    completedAt?: string
  }
  /** Event timestamp */
  timestamp: string
  /**
   * Original webhook payload (fully typed per provider)
   *
   * Type-safe based on the provider:
   * - `gladia`: GladiaWebhookPayload
   * - `assemblyai`: AssemblyAIWebhookPayload
   * - `deepgram`: DeepgramWebhookPayload
   */
  raw: P extends keyof ProviderWebhookPayloadMap ? ProviderWebhookPayloadMap[P] : unknown
}

/**
 * Webhook validation result
 */
export interface WebhookValidation {
  /** Whether the webhook is valid */
  valid: boolean
  /** Detected provider (if valid) */
  provider?: TranscriptionProvider
  /** Error message (if invalid) */
  error?: string
  /** Additional validation details */
  details?: Record<string, unknown>
}

/**
 * Webhook signature verification options
 */
export interface WebhookVerificationOptions {
  /** Webhook signature from headers */
  signature?: string
  /** Webhook secret key */
  secret?: string
  /** Raw request body (for signature verification) */
  rawBody?: string | Buffer
  /** Timestamp from headers (for replay attack prevention) */
  timestamp?: string
  /** Custom headers from the webhook request */
  headers?: Record<string, string>
}
