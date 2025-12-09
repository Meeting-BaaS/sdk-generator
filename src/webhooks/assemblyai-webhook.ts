/**
 * AssemblyAI webhook handler
 * Parses and normalizes AssemblyAI webhook callbacks
 */

import type { TranscriptReadyNotification } from "../generated/assemblyai/schema/transcriptReadyNotification"
import { BaseWebhookHandler } from "./base-webhook"
import type { UnifiedWebhookEvent, WebhookVerificationOptions } from "./types"
import type { TranscriptionProvider } from "../router/types"
import crypto from "node:crypto"

/**
 * AssemblyAI webhook handler
 *
 * Handles webhook callbacks from AssemblyAI API:
 * - completed - Transcription completed successfully
 * - error - Transcription failed with error
 *
 * AssemblyAI supports webhook signature verification using HMAC-SHA256.
 *
 * @example Basic usage
 * ```typescript
 * import { AssemblyAIWebhookHandler } from '@meeting-baas/sdk';
 *
 * const handler = new AssemblyAIWebhookHandler();
 *
 * // Validate webhook
 * const validation = handler.validate(req.body);
 * if (!validation.valid) {
 *   return res.status(400).json({ error: validation.error });
 * }
 *
 * // Parse webhook
 * const event = handler.parse(req.body);
 * if (event.eventType === 'transcription.completed') {
 *   console.log('Transcript ID:', event.data?.id);
 * }
 * ```
 *
 * @example With signature verification
 * ```typescript
 * // Verify webhook signature
 * const isValid = handler.verify(req.body, {
 *   signature: req.headers['x-assemblyai-signature'],
 *   secret: process.env.ASSEMBLYAI_WEBHOOK_SECRET,
 *   rawBody: req.rawBody
 * });
 *
 * if (!isValid) {
 *   return res.status(401).json({ error: 'Invalid signature' });
 * }
 * ```
 */
export class AssemblyAIWebhookHandler extends BaseWebhookHandler {
  readonly provider: TranscriptionProvider = "assemblyai"

  /**
   * Check if payload matches AssemblyAI webhook format
   */
  matches(
    payload: unknown,
    _options?: { queryParams?: Record<string, string>; userAgent?: string }
  ): boolean {
    if (!payload || typeof payload !== "object") {
      return false
    }

    const obj = payload as Record<string, unknown>

    // AssemblyAI webhooks have "transcript_id" and "status" fields
    if (!("transcript_id" in obj) || !("status" in obj)) {
      return false
    }

    // transcript_id should be a string
    if (typeof obj.transcript_id !== "string") {
      return false
    }

    // status should be "completed" or "error"
    if (obj.status !== "completed" && obj.status !== "error") {
      return false
    }

    return true
  }

  /**
   * Parse AssemblyAI webhook payload to unified format
   */
  parse(
    payload: unknown,
    _options?: { queryParams?: Record<string, string> }
  ): UnifiedWebhookEvent {
    if (!this.matches(payload)) {
      return this.createErrorEvent(payload, "Invalid AssemblyAI webhook payload")
    }

    const notification = payload as TranscriptReadyNotification
    const transcriptId = notification.transcript_id
    const status = notification.status

    if (status === "completed") {
      return {
        success: true,
        provider: this.provider,
        eventType: "transcription.completed",
        data: {
          id: transcriptId,
          status: "completed"
          // Note: Full transcript data needs to be fetched via API
          // using AssemblyAIAdapter.getTranscript(transcriptId)
        },
        timestamp: new Date().toISOString(),
        raw: payload
      }
    }

    if (status === "error") {
      return {
        success: false,
        provider: this.provider,
        eventType: "transcription.failed",
        data: {
          id: transcriptId,
          status: "error",
          error: "Transcription failed"
        },
        timestamp: new Date().toISOString(),
        raw: payload
      }
    }

    // Unknown status
    return this.createErrorEvent(payload, `Unknown AssemblyAI status: ${status}`)
  }

  /**
   * Verify AssemblyAI webhook signature
   *
   * AssemblyAI uses HMAC-SHA256 for webhook signature verification.
   * The signature is sent in the X-AssemblyAI-Signature header.
   *
   * @param payload - Webhook payload
   * @param options - Verification options with signature and secret
   * @returns true if signature is valid
   *
   * @example
   * ```typescript
   * const isValid = handler.verify(req.body, {
   *   signature: req.headers['x-assemblyai-signature'],
   *   secret: process.env.ASSEMBLYAI_WEBHOOK_SECRET,
   *   rawBody: req.rawBody // Raw request body as string or Buffer
   * });
   * ```
   */
  verify(payload: unknown, options: WebhookVerificationOptions): boolean {
    // Need signature and secret to verify
    if (!options.signature || !options.secret) {
      return false
    }

    try {
      // Use raw body if provided, otherwise stringify payload
      const body =
        options.rawBody || (typeof payload === "string" ? payload : JSON.stringify(payload))

      // Compute HMAC-SHA256 signature
      const hmac = crypto.createHmac("sha256", options.secret)
      const bodyBuffer = typeof body === "string" ? Buffer.from(body) : body
      hmac.update(bodyBuffer)
      const computedSignature = hmac.digest("hex")

      // Compare signatures (constant-time comparison)
      return crypto.timingSafeEqual(Buffer.from(options.signature), Buffer.from(computedSignature))
    } catch (error) {
      // If any error occurs during verification, treat as invalid
      return false
    }
  }
}

/**
 * Factory function to create an AssemblyAI webhook handler
 */
export function createAssemblyAIWebhookHandler(): AssemblyAIWebhookHandler {
  return new AssemblyAIWebhookHandler()
}
