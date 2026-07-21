/**
 * ElevenLabs webhook handler
 * Parses and normalizes ElevenLabs webhook callbacks
 */

import type { MultichannelSpeechToTextResponseModel } from "../generated/elevenlabs/schema/multichannelSpeechToTextResponseModel"
import type { SpeechToText200 } from "../generated/elevenlabs/schema/speechToText200"
import type { SpeechToTextChunkResponseModel } from "../generated/elevenlabs/schema/speechToTextChunkResponseModel"
import type { SpeechToTextWordResponseModel } from "../generated/elevenlabs/schema/speechToTextWordResponseModel"
import { buildUtterancesFromWords } from "../utils/transcription-helpers"
import { BaseWebhookHandler } from "./base-webhook"
import type { UnifiedWebhookEvent, WebhookProvider } from "./types"

/**
 * ElevenLabs webhook handler
 *
 * Handles webhook callbacks from ElevenLabs Speech-to-Text API.
 * ElevenLabs sends the full transcription result to the webhook URL
 * when transcription is complete. The payload is the generated `SpeechToText200`
 * result union: either a single chunk or a multichannel transcripts object.
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
  readonly provider: WebhookProvider = "elevenlabs"

  /**
   * Check if payload matches ElevenLabs webhook format
   *
   * ElevenLabs webhook payloads contain the generated speech-to-text result:
   * either a single transcript chunk or a multichannel transcripts array.
   */
  matches(
    payload: unknown,
    _options?: { queryParams?: Record<string, string>; userAgent?: string }
  ): boolean {
    if (!payload || typeof payload !== "object") {
      return false
    }

    const obj = payload as Record<string, unknown>

    if ("transcripts" in obj) {
      return (
        Array.isArray(obj.transcripts) &&
        obj.transcripts.length > 0 &&
        obj.transcripts.every((chunk) => this.isTranscriptChunk(chunk))
      )
    }

    return this.isTranscriptChunk(obj)
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

    const response = payload as SpeechToText200

    try {
      const chunks: SpeechToTextChunkResponseModel[] =
        "transcripts" in response
          ? (response as MultichannelSpeechToTextResponseModel).transcripts
          : [response as SpeechToTextChunkResponseModel]
      const transcriptionId =
        response.transcription_id?.toString() || chunks[0]?.transcription_id?.toString() || ""
      const transcript = chunks.map((chunk) => chunk.text).join(" ")

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
          raw: payload as UnifiedWebhookEvent["raw"]
        }
      }

      // Extract words with timestamps
      const words =
        chunks.flatMap((chunk) => chunk.words || []).length > 0
          ? chunks
              .flatMap((chunk) => chunk.words || [])
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
      for (const chunk of chunks) {
        for (const w of chunk.words || []) {
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

      const entities = chunks.flatMap((chunk) => chunk.entities || [])
      const channelIndices = chunks
        .map((chunk) => chunk.channel_index)
        .filter((channelIndex): channelIndex is number => typeof channelIndex === "number")

      return {
        success: true,
        provider: this.provider,
        eventType: "transcription.completed",
        data: {
          id: transcriptionId,
          status: "completed",
          text: transcript,
          language: chunks[0]?.language_code,
          speakers: speakers && speakers.length > 0 ? speakers : undefined,
          words: words && words.length > 0 ? words : undefined,
          utterances: utterances && utterances.length > 0 ? utterances : undefined,
          metadata: {
            language_probability: chunks[0]?.language_probability,
            entities: entities.length > 0 ? entities : undefined,
            channel_index: chunks[0]?.channel_index,
            channel_indices: channelIndices.length > 0 ? channelIndices : undefined,
            audio_duration_secs: response.audio_duration_secs
          }
        },
        timestamp: new Date().toISOString(),
        raw: payload as UnifiedWebhookEvent["raw"]
      }
    } catch (error) {
      return this.createErrorEvent(
        payload,
        `Failed to parse ElevenLabs webhook: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  private isTranscriptChunk(value: unknown): value is SpeechToTextChunkResponseModel {
    if (!value || typeof value !== "object") {
      return false
    }

    const obj = value as Record<string, unknown>

    if (!("words" in obj) || !("language_code" in obj) || !("language_probability" in obj)) {
      return false
    }

    if (!Array.isArray(obj.words) || !("text" in obj)) {
      return false
    }

    if (obj.words.length > 0) {
      const firstWord = obj.words[0] as Record<string, unknown>
      return "logprob" in firstWord && "type" in firstWord
    }

    return true
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
