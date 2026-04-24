/**
 * Soniox webhook handler
 * Parses and normalizes Soniox webhook callbacks
 *
 * Soniox webhooks are notification-only: payload is `{ id, status }`.
 * The consumer must call `getTranscript(id)` to fetch the full transcript.
 *
 * @see https://soniox.com/docs/stt/async/webhooks
 */

import { BaseWebhookHandler } from "./base-webhook"
import type { UnifiedWebhookEvent } from "./types"
import type { TranscriptionProvider } from "../router/types"
import type { Transcription as SonioxWebhookPayload } from "../generated/soniox/schema/transcription"
import { TranscriptionStatus as SonioxTranscriptionStatus } from "../generated/soniox/schema/transcriptionStatus"

export type { SonioxWebhookPayload }

/**
 * Soniox webhook handler
 *
 * Handles webhook callbacks from Soniox async transcription API.
 * Soniox sends minimal notification payloads with `{ id, status }`.
 * No transcript data is included — use `getTranscript(id)` to fetch results.
 *
 * @example
 * ```typescript
 * import { SonioxWebhookHandler } from '@meeting-baas/sdk/webhooks';
 *
 * const handler = new SonioxWebhookHandler();
 *
 * const event = handler.parse(req.body);
 * if (event.eventType === 'transcription.completed') {
 *   // Fetch transcript via adapter
 *   const result = await sonioxAdapter.getTranscript(event.data.id);
 * }
 * ```
 */
export class SonioxWebhookHandler extends BaseWebhookHandler {
  readonly provider: TranscriptionProvider = "soniox"

  /**
   * Check if payload matches Soniox webhook format
   *
   * Soniox webhooks have a minimal `{ id, status }` shape.
   * Excludes false positives by checking the payload does NOT have
   * fields unique to other providers.
   */
  matches(
    payload: unknown,
    _options?: { queryParams?: Record<string, string>; userAgent?: string }
  ): boolean {
    if (!payload || typeof payload !== "object") {
      return false
    }

    const obj = payload as Record<string, unknown>

    // Must have id (string) and status (string)
    if (typeof obj.id !== "string" || typeof obj.status !== "string") {
      return false
    }

    // Status must be a known Soniox transcription status (from generated enum)
    const validStatuses: string[] = Object.values(SonioxTranscriptionStatus)
    if (!validStatuses.includes(obj.status as string)) {
      return false
    }

    // Exclude ElevenLabs: has language_code + words array
    if ("language_code" in obj && "words" in obj) {
      return false
    }

    // Exclude Deepgram: has metadata.model_info
    if ("metadata" in obj) {
      const meta = obj.metadata as Record<string, unknown>
      if (meta && typeof meta === "object" && "model_info" in meta) {
        return false
      }
    }

    // Exclude Speechmatics: has results array
    if ("results" in obj && Array.isArray(obj.results)) {
      return false
    }

    // Exclude Gladia: has event field
    if ("event" in obj) {
      return false
    }

    // Exclude AssemblyAI: has transcript_id (not id)
    if ("transcript_id" in obj) {
      return false
    }

    return true
  }

  /**
   * Parse Soniox webhook payload to unified format
   *
   * Returns notification-only data (id + status). No transcript text
   * is included — Soniox webhooks are notification-only.
   */
  parse(
    payload: unknown,
    _options?: { queryParams?: Record<string, string> }
  ): UnifiedWebhookEvent {
    if (!this.matches(payload)) {
      return this.createErrorEvent(payload, "Invalid Soniox webhook payload")
    }

    const data = payload as SonioxWebhookPayload

    let eventType: UnifiedWebhookEvent["eventType"]
    switch (data.status) {
      case SonioxTranscriptionStatus.completed:
        eventType = "transcription.completed"
        break
      case SonioxTranscriptionStatus.error:
        eventType = "transcription.failed"
        break
      case SonioxTranscriptionStatus.processing:
        eventType = "transcription.processing"
        break
      default:
        eventType = "transcription.created"
    }

    return {
      success: data.status !== SonioxTranscriptionStatus.error,
      provider: this.provider,
      eventType,
      data: {
        id: data.id,
        status: data.status === SonioxTranscriptionStatus.completed
          ? "completed"
          : data.status === SonioxTranscriptionStatus.error
            ? "error"
            : "processing",
        error: data.error_message ?? undefined
      },
      timestamp: new Date().toISOString(),
      raw: payload as UnifiedWebhookEvent["raw"]
    }
  }

  /**
   * Verify Soniox webhook signature
   *
   * Soniox uses custom auth headers on webhook delivery rather than
   * HMAC signature verification. No server-side verification is available.
   *
   * @returns Always returns true
   */
  verify(): boolean {
    return true
  }
}

/**
 * Factory function to create a Soniox webhook handler
 */
export function createSonioxWebhookHandler(): SonioxWebhookHandler {
  return new SonioxWebhookHandler()
}
