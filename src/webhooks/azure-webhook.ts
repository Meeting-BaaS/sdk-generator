/**
 * Azure Speech-to-Text webhook handler
 * Parses and normalizes Azure STT webhook callbacks
 */

import { BaseWebhookHandler } from "./base-webhook"
import type { UnifiedWebhookEvent, WebhookVerificationOptions } from "./types"
import type { TranscriptionProvider } from "../router/types"
import crypto from "node:crypto"

/**
 * Azure webhook event payload structure
 * Based on Azure Speech Services v3.1 webhook format
 */
interface AzureWebhookPayload {
  /** Event action (e.g., "TranscriptionCreated", "TranscriptionSucceeded", "TranscriptionFailed") */
  action: string
  /** Timestamp of the event */
  timestamp: string
  /** Self-link to the resource */
  self?: string
  /** Additional properties */
  properties?: Record<string, unknown>
  /** Error details (for failed events) */
  error?: {
    code: string
    message: string
  }
}

/**
 * Azure webhook handler
 *
 * Handles webhook callbacks from Azure Speech Services API:
 * - TranscriptionCreated - Transcription job created
 * - TranscriptionRunning - Transcription is processing
 * - TranscriptionSucceeded - Transcription completed successfully
 * - TranscriptionFailed - Transcription failed with error
 *
 * Azure supports optional webhook signature verification using a shared secret.
 *
 * @example Basic usage
 * ```typescript
 * import { AzureWebhookHandler } from '@meeting-baas/sdk';
 *
 * const handler = new AzureWebhookHandler();
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
 * console.log('Action:', event.raw.action);
 * ```
 *
 * @example With signature verification
 * ```typescript
 * // Verify webhook signature (if configured in Azure)
 * const isValid = handler.verify(req.body, {
 *   signature: req.headers['x-azure-signature'],
 *   secret: process.env.AZURE_WEBHOOK_SECRET,
 *   rawBody: req.rawBody
 * });
 *
 * if (!isValid) {
 *   return res.status(401).json({ error: 'Invalid signature' });
 * }
 * ```
 *
 * @example Processing completed transcription
 * ```typescript
 * const event = handler.parse(req.body);
 *
 * if (event.eventType === 'transcription.completed') {
 *   // Extract transcription ID from self link
 *   const transcriptionId = event.data?.id;
 *
 *   // Fetch full transcript using AzureAdapter.getTranscript(transcriptionId)
 *   console.log('Transcription completed:', transcriptionId);
 * }
 * ```
 */
export class AzureWebhookHandler extends BaseWebhookHandler {
  readonly provider: TranscriptionProvider = "azure-stt"

  /**
   * Check if payload matches Azure webhook format
   */
  matches(
    payload: unknown,
    _options?: { queryParams?: Record<string, string>; userAgent?: string }
  ): boolean {
    if (!payload || typeof payload !== "object") {
      return false
    }

    const obj = payload as Record<string, unknown>

    // Azure webhooks have "action" and "timestamp" fields
    if (!("action" in obj) || !("timestamp" in obj)) {
      return false
    }

    // action should be a string
    if (typeof obj.action !== "string") {
      return false
    }

    // Action should start with "Transcription"
    if (!obj.action.startsWith("Transcription")) {
      return false
    }

    return true
  }

  /**
   * Parse Azure webhook payload to unified format
   */
  parse(
    payload: unknown,
    _options?: { queryParams?: Record<string, string> }
  ): UnifiedWebhookEvent {
    if (!this.matches(payload)) {
      return this.createErrorEvent(payload, "Invalid Azure webhook payload")
    }

    const webhookPayload = payload as AzureWebhookPayload
    const action = webhookPayload.action
    const timestamp = webhookPayload.timestamp

    // Extract transcription ID from self link
    // Format: https://{region}.api.cognitive.microsoft.com/speechtotext/v3.1/transcriptions/{id}
    let transcriptionId = ""
    if (webhookPayload.self) {
      const match = webhookPayload.self.match(/\/transcriptions\/([^/?]+)/)
      if (match) {
        transcriptionId = match[1]
      }
    }

    // Map Azure actions to unified event types
    if (action === "TranscriptionCreated") {
      return {
        success: true,
        provider: this.provider,
        eventType: "transcription.created",
        data: {
          id: transcriptionId,
          status: "queued",
          createdAt: timestamp
        },
        timestamp,
        raw: payload
      }
    }

    if (action === "TranscriptionRunning") {
      return {
        success: true,
        provider: this.provider,
        eventType: "transcription.processing",
        data: {
          id: transcriptionId,
          status: "processing"
        },
        timestamp,
        raw: payload
      }
    }

    if (action === "TranscriptionSucceeded") {
      return {
        success: true,
        provider: this.provider,
        eventType: "transcription.completed",
        data: {
          id: transcriptionId,
          status: "completed",
          completedAt: timestamp
          // Note: Full transcript data needs to be fetched via API
          // using AzureAdapter.getTranscript(transcriptionId)
        },
        timestamp,
        raw: payload
      }
    }

    if (action === "TranscriptionFailed") {
      return {
        success: false,
        provider: this.provider,
        eventType: "transcription.failed",
        data: {
          id: transcriptionId,
          status: "error",
          error: webhookPayload.error?.message || "Transcription failed",
          metadata: {
            errorCode: webhookPayload.error?.code
          }
        },
        timestamp,
        raw: payload
      }
    }

    // Unknown action
    return this.createErrorEvent(payload, `Unknown Azure webhook action: ${action}`)
  }

  /**
   * Verify Azure webhook signature
   *
   * Azure can optionally sign webhooks using HMAC-SHA256.
   * The signature is sent in the X-Azure-Signature header.
   *
   * Note: Signature verification is optional in Azure and must be
   * configured when creating the webhook.
   *
   * @param payload - Webhook payload
   * @param options - Verification options with signature and secret
   * @returns true if signature is valid or no signature provided
   *
   * @example
   * ```typescript
   * const isValid = handler.verify(req.body, {
   *   signature: req.headers['x-azure-signature'],
   *   secret: process.env.AZURE_WEBHOOK_SECRET,
   *   rawBody: req.rawBody
   * });
   * ```
   */
  verify(payload: unknown, options: WebhookVerificationOptions): boolean {
    // If no signature provided, skip verification
    // (Azure webhooks can be configured without signatures)
    if (!options.signature) {
      return true
    }

    // Need secret to verify
    if (!options.secret) {
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
 * Factory function to create an Azure webhook handler
 */
export function createAzureWebhookHandler(): AzureWebhookHandler {
  return new AzureWebhookHandler()
}
