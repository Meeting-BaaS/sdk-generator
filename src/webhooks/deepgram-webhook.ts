/**
 * Deepgram webhook handler
 * Parses and normalizes Deepgram webhook callbacks
 */

import type { ListenV1Response } from "../generated/deepgram/schema/listenV1Response"
import { BaseWebhookHandler } from "./base-webhook"
import type { UnifiedWebhookEvent } from "./types"
import type { TranscriptionProvider } from "../router/types"

/**
 * Deepgram webhook handler
 *
 * Handles webhook callbacks from Deepgram API.
 * Deepgram sends the full transcription response to the callback URL
 * when transcription is complete.
 *
 * Note: Deepgram does not provide webhook signature verification.
 * For security, use HTTPS and validate the request source.
 *
 * @example Basic usage
 * ```typescript
 * import { DeepgramWebhookHandler } from '@meeting-baas/sdk';
 *
 * const handler = new DeepgramWebhookHandler();
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
 * console.log('Transcript:', event.data?.text);
 * console.log('Speakers:', event.data?.speakers);
 * ```
 *
 * @example Processing completed transcription
 * ```typescript
 * const event = handler.parse(req.body);
 *
 * if (event.eventType === 'transcription.completed') {
 *   console.log('Request ID:', event.data?.id);
 *   console.log('Transcript:', event.data?.text);
 *   console.log('Duration:', event.data?.duration);
 *   console.log('Confidence:', event.data?.confidence);
 *
 *   // Access word-level timestamps
 *   event.data?.words?.forEach(word => {
 *     console.log(`${word.text}: ${word.start}s - ${word.end}s`);
 *   });
 *
 *   // Access speaker diarization
 *   event.data?.speakers?.forEach(speaker => {
 *     console.log(`Speaker ${speaker.speaker}: ${speaker.text}`);
 *   });
 * }
 * ```
 */
export class DeepgramWebhookHandler extends BaseWebhookHandler {
	readonly provider: TranscriptionProvider = "deepgram"

	/**
	 * Check if payload matches Deepgram webhook format
	 */
	matches(
		payload: unknown,
		_options?: { queryParams?: Record<string, string>; userAgent?: string },
	): boolean {
		if (!payload || typeof payload !== "object") {
			return false
		}

		const obj = payload as Record<string, unknown>

		// Deepgram callbacks have "metadata" and "results" fields
		if (!("metadata" in obj) || !("results" in obj)) {
			return false
		}

		// metadata should be an object with "request_id"
		if (!obj.metadata || typeof obj.metadata !== "object") {
			return false
		}

		const metadata = obj.metadata as Record<string, unknown>
		if (!("request_id" in metadata)) {
			return false
		}

		// results should be an object with "channels"
		if (!obj.results || typeof obj.results !== "object") {
			return false
		}

		const results = obj.results as Record<string, unknown>
		return "channels" in results
	}

	/**
	 * Parse Deepgram webhook payload to unified format
	 */
	parse(
		payload: unknown,
		_options?: { queryParams?: Record<string, string> },
	): UnifiedWebhookEvent {
		if (!this.matches(payload)) {
			return this.createErrorEvent(payload, "Invalid Deepgram webhook payload")
		}

		const response = payload as ListenV1Response

		try {
			// Extract basic info
			const requestId = response.metadata.request_id
			const duration = response.metadata.duration
			const channels = response.results.channels || []

			// Deepgram can have multiple channels, we'll use the first one
			if (channels.length === 0) {
				return {
					success: false,
					provider: this.provider,
					eventType: "transcription.failed",
					data: {
						id: requestId || "",
						status: "error",
						error: "No channels in response",
					},
					timestamp: new Date().toISOString(),
					raw: payload,
				}
			}

			const channel = channels[0]
			const alternatives = channel.alternatives || []

			if (alternatives.length === 0) {
				return {
					success: false,
					provider: this.provider,
					eventType: "transcription.failed",
					data: {
						id: requestId || "",
						status: "error",
						error: "No alternatives in response",
					},
					timestamp: new Date().toISOString(),
					raw: payload,
				}
			}

			const alternative = alternatives[0]
			const transcript = alternative.transcript

			// Check if transcription was successful
			if (!transcript) {
				return {
					success: false,
					provider: this.provider,
					eventType: "transcription.failed",
					data: {
						id: requestId || "",
						status: "error",
						error: "Empty transcript",
					},
					timestamp: new Date().toISOString(),
					raw: payload,
				}
			}

			// Extract words (if available)
			const words =
				alternative.words && alternative.words.length > 0
					? alternative.words.map((word) => ({
							text: word.word || "",
							start: word.start || 0,
							end: word.end || 0,
							confidence: word.confidence,
						}))
					: undefined

			// Extract speakers from utterances (if available)
			const speakers =
				response.results.utterances && response.results.utterances.length > 0
					? response.results.utterances.map((utterance) => ({
							id: utterance.speaker?.toString() || "unknown",
							speaker: utterance.speaker?.toString() || "unknown",
							text: utterance.transcript || "",
							confidence: utterance.confidence,
						}))
					: undefined

			// Extract utterances (if available)
			const utterances =
				response.results.utterances && response.results.utterances.length > 0
					? response.results.utterances.map((utterance) => ({
							text: utterance.transcript || "",
							start: utterance.start || 0,
							end: utterance.end || 0,
							speaker: utterance.speaker?.toString(),
							confidence: utterance.confidence,
							words:
								utterance.words && utterance.words.length > 0
									? utterance.words.map((word) => ({
											text: word.word || "",
											start: word.start || 0,
											end: word.end || 0,
											confidence: word.confidence,
										}))
									: undefined,
						}))
					: undefined

			// Extract summary (if available)
			const summary = alternative.summaries?.[0]?.summary

			return {
				success: true,
				provider: this.provider,
				eventType: "transcription.completed",
				data: {
					id: requestId || "",
					status: "completed",
					text: transcript,
					confidence: alternative.confidence,
					duration,
					language: response.metadata.models?.[0] || undefined,
					speakers: speakers && speakers.length > 0 ? speakers : undefined,
					words: words && words.length > 0 ? words : undefined,
					utterances:
						utterances && utterances.length > 0 ? utterances : undefined,
					summary,
					metadata: {
						channels: response.metadata.channels,
						created: response.metadata.created,
						models: response.metadata.models,
					},
				},
				timestamp: new Date().toISOString(),
				raw: payload,
			}
		} catch (error) {
			return this.createErrorEvent(
				payload,
				`Failed to parse Deepgram webhook: ${error instanceof Error ? error.message : "Unknown error"}`,
			)
		}
	}

	/**
	 * Verify Deepgram webhook signature
	 *
	 * Note: Deepgram does not currently support webhook signature verification.
	 * For security, use HTTPS and validate the request source (IP allowlist, etc.).
	 *
	 * @returns Always returns true (no verification available)
	 */
	verify(): boolean {
		// Deepgram does not currently support webhook signature verification
		// Return true to indicate no verification is required
		return true
	}
}

/**
 * Factory function to create a Deepgram webhook handler
 */
export function createDeepgramWebhookHandler(): DeepgramWebhookHandler {
	return new DeepgramWebhookHandler()
}
