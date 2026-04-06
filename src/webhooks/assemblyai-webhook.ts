/**
 * AssemblyAI webhook handler
 * Parses and normalizes AssemblyAI webhook callbacks
 */

import type { Transcript } from "../generated/assemblyai/schema/transcript"

/** Lightweight webhook notification format (webhook schemas dropped from docs spec) */
interface TranscriptReadyNotification {
  transcript_id: string
  status: string
}
import { BaseWebhookHandler } from "./base-webhook"
import type { UnifiedWebhookEvent, WebhookVerificationOptions } from "./types"
import type { TranscriptionProvider, Word, Utterance } from "../router/types"
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
 * @example Basic usage (full transcript body)
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
 * // Parse webhook — works with both notification and full transcript formats
 * const event = handler.parse(req.body);
 * if (event.eventType === 'transcription.completed') {
 *   console.log('Transcript ID:', event.data?.id);
 *   console.log('Text:', event.data?.text);
 *   console.log('Duration:', event.data?.duration);
 *   console.log('Confidence:', event.data?.confidence);
 *
 *   // Word-level timestamps (seconds)
 *   event.data?.words?.forEach(w => {
 *     console.log(`${w.word}: ${w.start}s - ${w.end}s`);
 *   });
 *
 *   // Speaker-segmented utterances
 *   event.data?.utterances?.forEach(u => {
 *     console.log(`Speaker ${u.speaker}: ${u.text}`);
 *   });
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
   *
   * Supports two formats:
   * - Notification format: `{ transcript_id, status }` (lightweight callback)
   * - Full transcript format: `{ id, status, audio_url, text, words, ... }` (complete response)
   */
  matches(
    payload: unknown,
    _options?: { queryParams?: Record<string, string>; userAgent?: string }
  ): boolean {
    if (!payload || typeof payload !== "object") {
      return false
    }

    const obj = payload as Record<string, unknown>

    // Format 1: Notification format — { transcript_id, status }
    // Only terminal statuses (completed/error) are accepted because AssemblyAI
    // webhooks only fire on terminal states. Non-terminal statuses (queued,
    // processing) are never sent as webhook payloads.
    if ("transcript_id" in obj && "status" in obj) {
      if (typeof obj.transcript_id !== "string") return false
      if (obj.status !== "completed" && obj.status !== "error") return false
      return true
    }

    // Format 2: Full transcript format — { id, status, audio_url }
    // Same terminal-status restriction as above — webhooks only deliver
    // completed or error payloads.
    if ("id" in obj && "status" in obj && "audio_url" in obj) {
      if (typeof obj.id !== "string") return false
      if (obj.status !== "completed" && obj.status !== "error") return false
      return true
    }

    return false
  }

  /**
   * Determine if the payload is a full transcript (vs a lightweight notification)
   */
  private isFullTranscript(payload: Record<string, unknown>): boolean {
    return "audio_url" in payload && "id" in payload
  }

  /**
   * Parse AssemblyAI webhook payload to unified format
   *
   * Supports two payload formats:
   * - Notification: `{ transcript_id, status }` — returns minimal event (ID + status only)
   * - Full transcript: `{ id, status, text, words, utterances, ... }` — returns complete data
   */
  parse(
    payload: unknown,
    _options?: { queryParams?: Record<string, string> }
  ): UnifiedWebhookEvent {
    if (!this.matches(payload)) {
      return this.createErrorEvent(payload, "Invalid AssemblyAI webhook payload")
    }

    const obj = payload as Record<string, unknown>

    // Determine ID and status from whichever format we received
    const isFullFormat = this.isFullTranscript(obj)
    const transcriptId = isFullFormat
      ? (payload as Transcript).id
      : (payload as TranscriptReadyNotification).transcript_id
    const status = obj.status as string

    if (status === "error") {
      const error = isFullFormat ? (payload as Transcript).error : undefined
      return {
        success: false,
        provider: this.provider,
        eventType: "transcription.failed",
        data: {
          id: transcriptId,
          status: "error",
          error: error || "Transcription failed"
        },
        timestamp: new Date().toISOString(),
        raw: payload
      }
    }

    if (status === "completed") {
      // Full transcript format — extract all available data
      if (isFullFormat) {
        return this.parseFullTranscript(payload as Transcript, payload)
      }

      // Notification format — only ID and status available
      return {
        success: true,
        provider: this.provider,
        eventType: "transcription.completed",
        data: {
          id: transcriptId,
          status: "completed"
        },
        timestamp: new Date().toISOString(),
        raw: payload
      }
    }

    // Unknown status
    return this.createErrorEvent(payload, `Unknown AssemblyAI status: ${status}`)
  }

  /**
   * Parse a full AssemblyAI transcript response into unified format
   *
   * AssemblyAI times are in milliseconds — converted to seconds for unified format.
   */
  private parseFullTranscript(transcript: Transcript, raw: unknown): UnifiedWebhookEvent {
    try {
      // Convert words (ms → seconds)
      const words: Word[] | undefined = transcript.words
        ? transcript.words.map((w) => ({
            word: w.text,
            start: w.start / 1000,
            end: w.end / 1000,
            confidence: w.confidence,
            speaker: w.speaker ?? undefined
          }))
        : undefined

      // Convert utterances (ms → seconds)
      const utterances: Utterance[] | undefined = transcript.utterances
        ? transcript.utterances.map((u) => ({
            text: u.text,
            start: u.start / 1000,
            end: u.end / 1000,
            speaker: u.speaker,
            confidence: u.confidence,
            words: u.words.map((w) => ({
              word: w.text,
              start: w.start / 1000,
              end: w.end / 1000,
              confidence: w.confidence,
              speaker: w.speaker ?? undefined
            }))
          }))
        : undefined

      // Extract unique speakers from utterances
      const speakerIds = new Set<string>()
      transcript.utterances?.forEach((u) => {
        if (u.speaker) speakerIds.add(u.speaker)
      })
      const speakers =
        speakerIds.size > 0
          ? Array.from(speakerIds).map((id) => ({ id, label: `Speaker ${id}` }))
          : undefined

      return {
        success: true,
        provider: this.provider,
        eventType: "transcription.completed",
        data: {
          id: transcript.id,
          status: "completed",
          text: transcript.text ?? undefined,
          confidence: transcript.confidence ?? undefined,
          duration: transcript.audio_duration ?? undefined,
          language: transcript.language_code ?? undefined,
          speakers,
          words,
          utterances,
          summary: transcript.summary ?? undefined,
          metadata: {
            speech_model: transcript.speech_model,
            audio_channels: transcript.audio_channels,
            webhook_status_code: transcript.webhook_status_code
          }
        },
        timestamp: new Date().toISOString(),
        raw
      }
    } catch (error) {
      return this.createErrorEvent(
        raw,
        `Failed to parse AssemblyAI transcript: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
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
