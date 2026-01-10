/**
 * Speechmatics webhook handler
 * Parses and normalizes Speechmatics webhook callbacks
 */

import { BaseWebhookHandler } from "./base-webhook"
import type { UnifiedWebhookEvent } from "./types"
import type { TranscriptionProvider } from "../router/types"
import type { RetrieveTranscriptResponse } from "../generated/speechmatics/schema/retrieveTranscriptResponse"

/**
 * Speechmatics webhook handler
 *
 * Handles webhook callbacks from Speechmatics API.
 * Speechmatics sends job completion notifications via POST with:
 * - Query parameters: id (job ID) and status (success/error/fetch_error/trim_error)
 * - User agent: "Speechmatics-API/2.0"
 * - Body: transcript JSON or multipart data depending on configuration
 *
 * @see https://docs.speechmatics.com/features-other/notifications
 *
 * @example
 * ```typescript
 * import { SpeechmaticsWebhookHandler } from '@meeting-baas/sdk';
 *
 * const handler = new SpeechmaticsWebhookHandler();
 *
 * // Validate webhook
 * const validation = handler.validate(req.body, {
 *   queryParams: req.query,  // Include query params for status check
 *   userAgent: req.headers['user-agent']
 * });
 *
 * if (!validation.valid) {
 *   return res.status(400).json({ error: validation.error });
 * }
 *
 * // Parse webhook
 * const event = handler.parse(req.body, {
 *   queryParams: req.query
 * });
 *
 * if (event.eventType === 'transcription.completed') {
 *   console.log('Transcript:', event.data?.text);
 * }
 * ```
 */
export class SpeechmaticsWebhookHandler extends BaseWebhookHandler {
  readonly provider: TranscriptionProvider = "speechmatics"

  /**
   * Check if payload matches Speechmatics webhook format
   */
  matches(
    payload: unknown,
    options?: { queryParams?: Record<string, string>; userAgent?: string }
  ): boolean {
    // Check user agent if provided
    if (options?.userAgent) {
      if (!options.userAgent.includes("Speechmatics-API")) {
        return false
      }
    }

    // Check for required query params
    if (options?.queryParams) {
      const { id, status } = options.queryParams
      if (!id || !status) {
        return false
      }
    }

    // Speechmatics can send either JSON or multipart data
    // For JSON transcript, check for expected structure
    if (payload && typeof payload === "object") {
      const obj = payload as Record<string, unknown>

      // Check for Speechmatics transcript format
      if ("format" in obj && "job" in obj && "metadata" in obj) {
        return true
      }

      // Could also be a simple status object
      if ("job" in obj || "id" in obj) {
        return true
      }
    }

    // If we can't determine from payload alone, rely on query params
    return !!options?.queryParams?.id && !!options?.queryParams?.status
  }

  /**
   * Validate webhook request
   */
  validate(
    payload: unknown,
    options?: { queryParams?: Record<string, string>; userAgent?: string }
  ): { valid: boolean; error?: string } {
    // Check for required query parameters
    if (!options?.queryParams?.id) {
      return {
        valid: false,
        error: "Missing required query parameter: id"
      }
    }

    if (!options?.queryParams?.status) {
      return {
        valid: false,
        error: "Missing required query parameter: status"
      }
    }

    // Validate status value
    const validStatuses = ["success", "error", "fetch_error", "trim_error"]
    if (!validStatuses.includes(options.queryParams.status)) {
      return {
        valid: false,
        error: `Invalid status value: ${options.queryParams.status}`
      }
    }

    // Optional: Check user agent
    if (options?.userAgent && !options.userAgent.includes("Speechmatics-API")) {
      return {
        valid: false,
        error: "Invalid user agent (expected Speechmatics-API/2.0)"
      }
    }

    return { valid: true }
  }

  /**
   * Parse webhook payload into unified event format
   */
  parse(payload: unknown, options?: { queryParams?: Record<string, string> }): UnifiedWebhookEvent {
    const queryParams = options?.queryParams || {}
    const jobId = queryParams.id
    const status = queryParams.status

    // Determine event type based on status
    let eventType: UnifiedWebhookEvent["eventType"]
    if (status === "success") {
      eventType = "transcription.completed"
    } else if (status === "error" || status === "fetch_error" || status === "trim_error") {
      eventType = "transcription.failed"
    } else {
      eventType = "transcription.created"
    }

    // Parse transcript if available and status is success
    if (status === "success" && payload && typeof payload === "object") {
      const transcript = payload as RetrieveTranscriptResponse

      if (transcript.results && transcript.job) {
        // Extract full text
        const text = transcript.results
          .filter((r) => r.type === "word" && r.alternatives)
          .map((r) => r.alternatives![0]?.content || "")
          .join(" ")

        // Extract speakers if present
        const speakerSet = new Set<string>()
        transcript.results.forEach((r) => {
          if (r.alternatives) {
            const speaker = r.alternatives[0]?.speaker
            if (speaker) speakerSet.add(speaker)
          }
        })

        const speakers =
          speakerSet.size > 0
            ? Array.from(speakerSet).map((id) => ({
                id,
                label: `Speaker ${id}`
              }))
            : undefined

        return {
          success: true,
          provider: this.provider,
          eventType,
          timestamp: new Date().toISOString(),
          data: {
            id: jobId,
            text,
            status: "completed",
            language: transcript.metadata.transcription_config?.language,
            duration: transcript.job.duration,
            speakers,
            createdAt: transcript.job.created_at
          },
          raw: payload
        }
      }
    }

    // Return minimal event for non-success or incomplete payloads
    return {
      success: status === "success",
      provider: this.provider,
      eventType,
      timestamp: new Date().toISOString(),
      data: {
        id: jobId,
        text: "",
        status: status === "success" ? "completed" : "error"
      },
      raw: payload
    }
  }
}
