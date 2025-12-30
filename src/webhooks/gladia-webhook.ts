/**
 * Gladia webhook handler
 * Parses and normalizes Gladia webhook callbacks
 */

import type { CallbackTranscriptionSuccessPayload } from "../generated/gladia/schema/callbackTranscriptionSuccessPayload"
import type { CallbackTranscriptionErrorPayload } from "../generated/gladia/schema/callbackTranscriptionErrorPayload"
import type { UtteranceDTO } from "../generated/gladia/schema/utteranceDTO"
import type { WordDTO } from "../generated/gladia/schema/wordDTO"
import { BaseWebhookHandler } from "./base-webhook"
import type { UnifiedWebhookEvent } from "./types"
import type { TranscriptionProvider, Utterance, Word } from "../router/types"

/**
 * Gladia webhook handler
 *
 * Handles webhook callbacks from Gladia API:
 * - transcription.success - Job completed successfully (includes full transcript)
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
 *   console.log('Utterances:', event.data?.utterances);
 * }
 * ```
 */
export class GladiaWebhookHandler extends BaseWebhookHandler {
  readonly provider: TranscriptionProvider = "gladia"

  /**
   * Convert Gladia WordDTO to unified Word type
   */
  private mapWord(w: WordDTO): Word {
    return {
      word: w.word,
      start: w.start,
      end: w.end,
      confidence: w.confidence
    }
  }

  /**
   * Convert Gladia UtteranceDTO to unified Utterance type
   */
  private mapUtterance(utterance: UtteranceDTO): Utterance {
    return {
      text: utterance.text,
      start: utterance.start,
      end: utterance.end,
      confidence: utterance.confidence,
      speaker: utterance.speaker !== undefined ? String(utterance.speaker) : undefined,
      words: utterance.words?.map((w) => this.mapWord(w))
    }
  }

  /**
   * Check if payload matches Gladia webhook format
   *
   * Gladia callbacks have the structure:
   * - { id, event: "transcription.success", payload: TranscriptionResultDTO, custom_metadata? }
   * - { id, event: "transcription.error", error: ErrorDTO, custom_metadata? }
   */
  matches(
    payload: unknown,
    _options?: { queryParams?: Record<string, string>; userAgent?: string }
  ): boolean {
    if (!payload || typeof payload !== "object") {
      return false
    }

    const obj = payload as Record<string, unknown>

    // Gladia webhooks have "id" and "event" fields at the top level
    if (!("id" in obj) || !("event" in obj)) {
      return false
    }

    // ID should be a string (UUID)
    if (typeof obj.id !== "string") {
      return false
    }

    // Event should be a string starting with "transcription."
    if (typeof obj.event !== "string") {
      return false
    }

    if (!obj.event.startsWith("transcription.")) {
      return false
    }

    // Success events have "payload", error events have "error"
    if (obj.event === "transcription.success" && !("payload" in obj)) {
      return false
    }

    if (obj.event === "transcription.error" && !("error" in obj)) {
      return false
    }

    return true
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

    const obj = payload as Record<string, unknown>
    const jobId = obj.id as string
    const event = obj.event as string

    // Handle success event
    if (event === "transcription.success") {
      const successPayload = payload as CallbackTranscriptionSuccessPayload
      const result = successPayload.payload

      // Extract transcription data
      const transcription = result.transcription
      const metadata = result.metadata

      // Map utterances to unified format
      const utterances: Utterance[] | undefined = transcription?.utterances?.map((u) =>
        this.mapUtterance(u)
      )

      // Flatten all words from utterances
      const words: Word[] | undefined = transcription?.utterances?.flatMap(
        (u) => u.words?.map((w) => this.mapWord(w)) ?? []
      )

      // Extract unique speakers from utterances
      const speakerIds = new Set<number>()
      transcription?.utterances?.forEach((u) => {
        if (u.speaker !== undefined) {
          speakerIds.add(u.speaker)
        }
      })
      const speakers =
        speakerIds.size > 0 ? Array.from(speakerIds).map((id) => ({ id: String(id) })) : undefined

      // Build the summary field only if summarization succeeded
      const summary =
        result.summarization?.success && result.summarization.results
          ? result.summarization.results
          : undefined

      return {
        success: true,
        provider: this.provider,
        eventType: "transcription.completed",
        data: {
          id: jobId,
          status: "completed",
          text: transcription?.full_transcript,
          duration: metadata?.audio_duration,
          language: transcription?.languages?.[0],
          speakers,
          words,
          utterances,
          summary,
          metadata: {
            transcription_time: metadata?.transcription_time,
            billing_time: metadata?.billing_time,
            number_of_distinct_channels: metadata?.number_of_distinct_channels,
            custom_metadata: successPayload.custom_metadata
          },
          completedAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        raw: payload
      }
    }

    // Handle error event
    if (event === "transcription.error") {
      const errorPayload = payload as CallbackTranscriptionErrorPayload
      const error = errorPayload.error

      return {
        success: false,
        provider: this.provider,
        eventType: "transcription.failed",
        data: {
          id: jobId,
          status: "error",
          error: error?.message || "Transcription failed",
          metadata: {
            error_code: error?.code,
            custom_metadata: errorPayload.custom_metadata
          }
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
