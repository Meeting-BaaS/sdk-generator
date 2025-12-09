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
 * Unified webhook event
 * Normalized across all transcription providers
 */
export interface UnifiedWebhookEvent {
  /** Whether the operation was successful */
  success: boolean
  /** Provider that sent this webhook */
  provider: TranscriptionProvider
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
  /** Original webhook payload (for debugging/advanced usage) */
  raw: unknown
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
