/**
 * Base webhook handler interface
 * All provider-specific webhook handlers must implement this
 */

import type {
	UnifiedWebhookEvent,
	WebhookValidation,
	WebhookVerificationOptions,
} from "./types"
import type { TranscriptionProvider } from "../router/types"

/**
 * Abstract base class for webhook handlers
 *
 * Each provider implements this to parse and normalize their webhook payloads
 */
export abstract class BaseWebhookHandler {
	/** Provider name */
	abstract readonly provider: TranscriptionProvider

	/**
	 * Check if this payload matches this provider's webhook format
	 *
	 * Used for auto-detection of webhook provider
	 *
	 * @param payload - Raw webhook payload
	 * @param options - Optional context (query params, headers, etc.)
	 * @returns true if this handler can process the payload
	 *
	 * @example
	 * ```typescript
	 * matches(payload, options) {
	 *   return typeof payload === 'object' &&
	 *          'event' in payload &&
	 *          'payload' in payload
	 * }
	 * ```
	 */
	abstract matches(
		payload: unknown,
		options?: { queryParams?: Record<string, string>; userAgent?: string },
	): boolean

	/**
	 * Parse and normalize webhook payload
	 *
	 * Converts provider-specific webhook format to UnifiedWebhookEvent
	 *
	 * @param payload - Raw webhook payload
	 * @param options - Optional context (query params, headers, etc.)
	 * @returns Normalized webhook event
	 * @throws Error if payload cannot be parsed
	 *
	 * @example
	 * ```typescript
	 * parse(payload, options) {
	 *   const typed = payload as ProviderWebhookPayload
	 *   return {
	 *     success: true,
	 *     provider: this.provider,
	 *     eventType: 'transcription.completed',
	 *     data: { id: typed.job_id, ... },
	 *     timestamp: new Date().toISOString(),
	 *     raw: payload
	 *   }
	 * }
	 * ```
	 */
	abstract parse(
		payload: unknown,
		options?: { queryParams?: Record<string, string> },
	): UnifiedWebhookEvent

	/**
	 * Verify webhook signature (if provider supports it)
	 *
	 * Optional method - implement if provider supports webhook signature verification
	 *
	 * @param payload - Raw webhook payload
	 * @param options - Verification options (signature, secret, etc.)
	 * @returns true if signature is valid
	 *
	 * @example
	 * ```typescript
	 * verify(payload, options) {
	 *   if (!options.signature || !options.secret) return false
	 *
	 *   const computed = crypto
	 *     .createHmac('sha256', options.secret)
	 *     .update(JSON.stringify(payload))
	 *     .digest('hex')
	 *
	 *   return computed === options.signature
	 * }
	 * ```
	 */
	verify?(payload: unknown, options: WebhookVerificationOptions): boolean

	/**
	 * Validate webhook payload structure
	 *
	 * Checks if payload has required fields and correct types
	 *
	 * @param payload - Raw webhook payload
	 * @param options - Optional context (query params, headers, etc.)
	 * @returns Validation result with details
	 */
	validate(
		payload: unknown,
		options?: { queryParams?: Record<string, string>; userAgent?: string },
	): WebhookValidation {
		try {
			// Check if this handler matches the payload
			if (!this.matches(payload, options)) {
				return {
					valid: false,
					error: `Payload does not match ${this.provider} webhook format`,
				}
			}

			// Try to parse the payload
			const event = this.parse(payload, options)

			// Basic validation
			if (!event.provider || !event.eventType) {
				return {
					valid: false,
					error: "Parsed event missing required fields",
				}
			}

			return {
				valid: true,
				provider: this.provider,
				details: {
					eventType: event.eventType,
					success: event.success,
				},
			}
		} catch (error) {
			return {
				valid: false,
				error: error instanceof Error ? error.message : "Unknown error",
				details: { error },
			}
		}
	}

	/**
	 * Helper method to create error response
	 */
	protected createErrorEvent(
		payload: unknown,
		errorMessage: string,
	): UnifiedWebhookEvent {
		return {
			success: false,
			provider: this.provider,
			eventType: "transcription.failed",
			data: {
				id: "",
				status: "error",
				error: errorMessage,
			},
			timestamp: new Date().toISOString(),
			raw: payload,
		}
	}
}
