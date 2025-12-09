/**
 * Gladia webhook handler
 * Parses and normalizes Gladia webhook callbacks
 */

import type { WebhookTranscriptionSuccessPayload } from "../generated/gladia/schema/webhookTranscriptionSuccessPayload"
import type { WebhookTranscriptionErrorPayload } from "../generated/gladia/schema/webhookTranscriptionErrorPayload"
import type { WebhookTranscriptionCreatedPayload } from "../generated/gladia/schema/webhookTranscriptionCreatedPayload"
import { BaseWebhookHandler } from "./base-webhook"
import type { UnifiedWebhookEvent } from "./types"
import type { TranscriptionProvider } from "../router/types"

/**
 * Gladia webhook handler
 *
 * Handles webhook callbacks from Gladia API:
 * - transcription.created - Job created and queued
 * - transcription.success - Job completed successfully
 * - transcription.error - Job failed with error
 *
 * @example
 * ```typescript
 * import { GladiaWebhookHandler } from '@meeting-baas/sdk';
 *
 * const handler = new GladiaWebhookHandler();
 *
 * // Validate webhook
 * const validation = handler.validate(req.body);
 * if (!validation.valid) {
 *   return res.status(400).json({ error: validation.error });
 * }
 *
 * // Parse webhook
 * const event = handler.parse(req.body);
 * console.log('Event type:', event.eventType);
 * console.log('Job ID:', event.data?.id);
 *
 * if (event.eventType === 'transcription.completed') {
 *   console.log('Transcript:', event.data?.text);
 * }
 * ```
 */
export class GladiaWebhookHandler extends BaseWebhookHandler {
  readonly provider: TranscriptionProvider = "gladia"

  /**
   * Check if payload matches Gladia webhook format
   */
  matches(
    payload: unknown,
    _options?: { queryParams?: Record<string, string>; userAgent?: string }
  ): boolean {
    if (!payload || typeof payload !== "object") {
      return false
    }

    const obj = payload as Record<string, unknown>

    // Gladia webhooks have "event" and "payload" fields
    if (!("event" in obj) || !("payload" in obj)) {
      return false
    }

    // Event should be a string starting with "transcription."
    if (typeof obj.event !== "string") {
      return false
    }

    if (!obj.event.startsWith("transcription.")) {
      return false
    }

    // Payload should be an object with "id" field
    if (!obj.payload || typeof obj.payload !== "object") {
      return false
    }

    const payloadObj = obj.payload as Record<string, unknown>
    return typeof payloadObj.id === "string"
  }

  /**
   * Parse Gladia webhook payload to unified format
   */
  parse(
    payload: unknown,
    _options?: { queryParams?: Record<string, string> }
  ): UnifiedWebhookEvent {
    if (!this.matches(payload)) {
      return this.createErrorEvent(payload, "Invalid Gladia webhook payload")
    }

    const webhookPayload = payload as
      | WebhookTranscriptionSuccessPayload
      | WebhookTranscriptionErrorPayload
      | WebhookTranscriptionCreatedPayload

    const jobId = webhookPayload.payload.id
    const event = webhookPayload.event

    // Handle different event types
    if (event === "transcription.created") {
      return {
        success: true,
        provider: this.provider,
        eventType: "transcription.created",
        data: {
          id: jobId,
          status: "queued"
        },
        timestamp: new Date().toISOString(),
        raw: payload
      }
    }

    if (event === "transcription.success") {
      // For success events, we need to fetch the full result
      // The webhook only contains the job ID, not the transcript
      return {
        success: true,
        provider: this.provider,
        eventType: "transcription.completed",
        data: {
          id: jobId,
          status: "completed"
          // Note: Full transcript data needs to be fetched via API
          // using GladiaAdapter.getTranscript(jobId)
        },
        timestamp: new Date().toISOString(),
        raw: payload
      }
    }

    if (event === "transcription.error") {
      return {
        success: false,
        provider: this.provider,
        eventType: "transcription.failed",
        data: {
          id: jobId,
          status: "error",
          error: "Transcription failed"
        },
        timestamp: new Date().toISOString(),
        raw: payload
      }
    }

    // Unknown event type
    return this.createErrorEvent(payload, `Unknown Gladia webhook event: ${event}`)
  }

  /**
   * Verify Gladia webhook signature
   *
   * Note: As of the current API version, Gladia does not provide
   * webhook signature verification. This method is a placeholder
   * for future implementation.
   *
   * @param payload - Webhook payload
   * @param options - Verification options
   * @returns Always returns true (no verification available)
   */
  verify(): boolean {
    // Gladia does not currently support webhook signature verification
    // Return true to indicate no verification is required
    return true
  }
}

/**
 * Factory function to create a Gladia webhook handler
 */
export function createGladiaWebhookHandler(): GladiaWebhookHandler {
  return new GladiaWebhookHandler()
}
