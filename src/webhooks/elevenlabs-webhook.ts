/**
 * ElevenLabs webhook handler
 * Parses and normalizes ElevenLabs webhook callbacks
 */

import type { SpeechToTextChunkResponseModel } from "../generated/elevenlabs/schema/speechToTextChunkResponseModel"
import type { SpeechToTextWordResponseModel } from "../generated/elevenlabs/schema/speechToTextWordResponseModel"
import { buildUtterancesFromWords } from "../utils/transcription-helpers"
import { BaseWebhookHandler } from "./base-webhook"
import type { UnifiedWebhookEvent } from "./types"
import type { TranscriptionProvider } from "../router/types"

/**
 * ElevenLabs webhook handler
 *
 * Handles webhook callbacks from ElevenLabs Speech-to-Text API.
 * ElevenLabs sends the full transcription result to the webhook URL
 * when transcription is complete. The payload includes the `SpeechToTextChunkResponseModel`
 * with words, entities, and language detection.
 *
 * Note: ElevenLabs webhook signature verification uses the `webhook_id` and
 * request signing. For security, use HTTPS and validate the request source.
 *
 * @example Basic usage
 * ```typescript
 * import { ElevenLabsWebhookHandler } from '@meeting-baas/sdk/webhooks';
 *
 * const handler = new ElevenLabsWebhookHandler();
 *
 * const validation = handler.validate(req.body);
 * if (!validation.valid) {
 *   return res.status(400).json({ error: validation.error });
 * }
 *
 * const event = handler.parse(req.body);
 * console.log('Event type:', event.eventType);
 * console.log('Transcript:', event.data?.text);
 * ```
 */
export class ElevenLabsWebhookHandler extends BaseWebhookHandler {
  readonly provider: TranscriptionProvider = "elevenlabs"

  /**
   * Check if payload matches ElevenLabs webhook format
   *
   * ElevenLabs webhook payloads contain the full transcription result
   * with `words` array and `language_code` / `language_probability` fields.
   */
  matches(
    payload: unknown,
    _options?: { queryParams?: Record<string, string>; userAgent?: string }
  ): boolean {
    if (!payload || typeof payload !== "object") {
      return false
    }

    const obj = payload as Record<string, unknown>

    // ElevenLabs transcription responses have "words" and "language_code" and "language_probability"
    if (!("words" in obj) || !("language_code" in obj) || !("language_probability" in obj)) {
      return false
    }

    // words should be an array
    if (!Array.isArray(obj.words)) {
      return false
    }

    // text should be present
    if (!("text" in obj)) {
      return false
    }

    // Words should have ElevenLabs-specific "logprob" and "type" fields
    if (obj.words.length > 0) {
      const firstWord = obj.words[0] as Record<string, unknown>
      if (!("logprob" in firstWord) || !("type" in firstWord)) {
        return false
      }
    }

    return true
  }

  /**
   * Parse ElevenLabs webhook payload to unified format
   */
  parse(
    payload: unknown,
    _options?: { queryParams?: Record<string, string> }
  ): UnifiedWebhookEvent {
    if (!this.matches(payload)) {
      return this.createErrorEvent(payload, "Invalid ElevenLabs webhook payload")
    }

    const response = payload as SpeechToTextChunkResponseModel

    try {
      const transcriptionId = response.transcription_id?.toString() || ""
      const transcript = response.text

      if (!transcript) {
        return {
          success: false,
          provider: this.provider,
          eventType: "transcription.failed",
          data: {
            id: transcriptionId,
            status: "error",
            error: "Empty transcript"
          },
          timestamp: new Date().toISOString(),
          raw: payload
        }
      }

      // Extract words with timestamps
      const words =
        response.words && response.words.length > 0
          ? response.words
              .filter((w: SpeechToTextWordResponseModel) => w.type === "word")
              .map((w: SpeechToTextWordResponseModel) => ({
                word: w.text || "",
                start: typeof w.start === "number" ? w.start : 0,
                end: typeof w.end === "number" ? w.end : 0,
                confidence: w.logprob !== undefined ? Math.exp(w.logprob) : undefined,
                speaker: w.speaker_id?.toString()
              }))
          : undefined

      // Extract unique speakers from word speaker_ids
      const speakerIds = new Set<string>()
      if (response.words) {
        for (const w of response.words) {
          if (w.speaker_id !== undefined && w.speaker_id !== null) {
            speakerIds.add(w.speaker_id.toString())
          }
        }
      }
      const speakers =
        speakerIds.size > 0
          ? Array.from(speakerIds).map((id) => ({
              id,
              label: `Speaker ${id}`
            }))
          : undefined

      // Build utterances from words using shared utility
      const utterances =
        words && words.length > 0
          ? buildUtterancesFromWords(
              words.map((w) => ({
                word: w.word,
                start: w.start,
                end: w.end,
                confidence: w.confidence,
                speaker: w.speaker
              }))
            )
          : undefined

      return {
        success: true,
        provider: this.provider,
        eventType: "transcription.completed",
        data: {
          id: transcriptionId,
          status: "completed",
          text: transcript,
          language: response.language_code,
          speakers: speakers && speakers.length > 0 ? speakers : undefined,
          words: words && words.length > 0 ? words : undefined,
          utterances: utterances && utterances.length > 0 ? utterances : undefined,
          metadata: {
            language_probability: response.language_probability,
            entities: response.entities,
            channel_index: response.channel_index
          }
        },
        timestamp: new Date().toISOString(),
        raw: payload
      }
    } catch (error) {
      return this.createErrorEvent(
        payload,
        `Failed to parse ElevenLabs webhook: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  /**
   * Verify ElevenLabs webhook signature
   *
   * Note: ElevenLabs does not currently provide a standard webhook signature
   * verification mechanism for STT webhooks. For security, use HTTPS and
   * validate the request source.
   *
   * @returns Always returns true (no verification available)
   */
  verify(): boolean {
    return true
  }
}

/**
 * Factory function to create an ElevenLabs webhook handler
 */
export function createElevenLabsWebhookHandler(): ElevenLabsWebhookHandler {
  return new ElevenLabsWebhookHandler()
}
