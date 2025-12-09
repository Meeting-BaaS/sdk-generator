/**
 * Webhook router with automatic provider detection
 * Routes webhook payloads to the correct provider handler
 */

import type { BaseWebhookHandler } from "./base-webhook"
import { GladiaWebhookHandler } from "./gladia-webhook"
import { AssemblyAIWebhookHandler } from "./assemblyai-webhook"
import { DeepgramWebhookHandler } from "./deepgram-webhook"
import { AzureWebhookHandler } from "./azure-webhook"
import { SpeechmaticsWebhookHandler } from "./speechmatics-webhook"
import type {
	UnifiedWebhookEvent,
	WebhookValidation,
	WebhookVerificationOptions,
} from "./types"
import type { TranscriptionProvider } from "../router/types"

/**
 * Webhook router options
 */
export interface WebhookRouterOptions {
	/**
	 * Specific provider to use (skips auto-detection)
	 */
	provider?: TranscriptionProvider

	/**
	 * Webhook verification options (signature, secret, etc.)
	 */
	verification?: WebhookVerificationOptions

	/**
	 * Whether to verify webhook signatures
	 * @default true
	 */
	verifySignature?: boolean

	/**
	 * Query parameters from the webhook request
	 * (e.g., for Speechmatics: ?id=<job_id>&status=success)
	 */
	queryParams?: Record<string, string>

	/**
	 * User agent from the webhook request headers
	 * (e.g., for Speechmatics: "Speechmatics-API/2.0")
	 */
	userAgent?: string
}

/**
 * Webhook router result
 */
export interface WebhookRouterResult {
	/**
	 * Whether routing was successful
	 */
	success: boolean

	/**
	 * Detected or specified provider
	 */
	provider?: TranscriptionProvider

	/**
	 * Parsed unified webhook event
	 */
	event?: UnifiedWebhookEvent

	/**
	 * Error message if routing failed
	 */
	error?: string

	/**
	 * Whether signature verification was performed and passed
	 */
	verified?: boolean
}

/**
 * Webhook router with automatic provider detection
 *
 * Automatically detects the webhook provider from the payload structure
 * and routes to the appropriate handler for parsing and normalization.
 *
 * @example Basic usage with auto-detection
 * ```typescript
 * import { WebhookRouter } from '@meeting-baas/sdk';
 *
 * const router = new WebhookRouter();
 *
 * // Auto-detect provider and parse webhook
 * const result = router.route(req.body);
 *
 * if (result.success) {
 *   console.log('Provider:', result.provider);
 *   console.log('Event type:', result.event?.eventType);
 *   console.log('Transcript ID:', result.event?.data?.id);
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 *
 * @example With signature verification
 * ```typescript
 * const router = new WebhookRouter();
 *
 * const result = router.route(req.body, {
 *   verification: {
 *     signature: req.headers['x-signature'],
 *     secret: process.env.WEBHOOK_SECRET,
 *     rawBody: req.rawBody
 *   }
 * });
 *
 * if (!result.verified) {
 *   return res.status(401).json({ error: 'Invalid signature' });
 * }
 * ```
 *
 * @example Specify provider explicitly
 * ```typescript
 * const router = new WebhookRouter();
 *
 * // Skip auto-detection, use specific provider
 * const result = router.route(req.body, {
 *   provider: 'gladia'
 * });
 * ```
 *
 * @example Express.js middleware
 * ```typescript
 * import express from 'express';
 * import { WebhookRouter } from '@meeting-baas/sdk';
 *
 * const app = express();
 * const router = new WebhookRouter();
 *
 * app.post('/webhooks/transcription', express.json(), (req, res) => {
 *   const result = router.route(req.body, {
 *     verification: {
 *       signature: req.headers['x-signature'] as string,
 *       secret: process.env.WEBHOOK_SECRET!
 *     }
 *   });
 *
 *   if (!result.success) {
 *     return res.status(400).json({ error: result.error });
 *   }
 *
 *   if (!result.verified) {
 *     return res.status(401).json({ error: 'Invalid signature' });
 *   }
 *
 *   // Process webhook event
 *   console.log('Received webhook from:', result.provider);
 *   console.log('Event:', result.event);
 *
 *   res.status(200).json({ received: true });
 * });
 * ```
 */
export class WebhookRouter {
	private handlers: Map<TranscriptionProvider, BaseWebhookHandler>

	constructor() {
		// Initialize all provider handlers
		this.handlers = new Map([
			["gladia", new GladiaWebhookHandler()],
			["assemblyai", new AssemblyAIWebhookHandler()],
			["deepgram", new DeepgramWebhookHandler()],
			["azure-stt", new AzureWebhookHandler()],
			["speechmatics", new SpeechmaticsWebhookHandler()],
		])
	}

	/**
	 * Route webhook payload to the correct handler
	 *
	 * @param payload - Raw webhook payload
	 * @param options - Routing options (provider, verification, etc.)
	 * @returns Routing result with parsed event
	 */
	route(
		payload: unknown,
		options?: WebhookRouterOptions,
	): WebhookRouterResult {
		// If provider is specified, use that handler directly
		if (options?.provider) {
			return this.routeToProvider(payload, options.provider, options)
		}

		// Auto-detect provider
		const detectedProvider = this.detectProvider(payload, {
			queryParams: options?.queryParams,
			userAgent: options?.userAgent,
		})

		if (!detectedProvider) {
			return {
				success: false,
				error: "Could not detect webhook provider from payload structure",
			}
		}

		return this.routeToProvider(payload, detectedProvider, options)
	}

	/**
	 * Detect provider from webhook payload structure
	 *
	 * @param payload - Raw webhook payload
	 * @param options - Detection options (query params, user agent, etc.)
	 * @returns Detected provider or undefined
	 */
	detectProvider(
		payload: unknown,
		options?: { queryParams?: Record<string, string>; userAgent?: string },
	): TranscriptionProvider | undefined {
		// Try each handler's matches() method
		for (const [provider, handler] of this.handlers) {
			if (handler.matches(payload, options)) {
				return provider
			}
		}

		return undefined
	}

	/**
	 * Validate webhook payload
	 *
	 * @param payload - Raw webhook payload
	 * @param options - Routing options
	 * @returns Validation result
	 */
	validate(
		payload: unknown,
		options?: WebhookRouterOptions,
	): WebhookValidation {
		// If provider is specified, use that handler directly
		if (options?.provider) {
			const handler = this.handlers.get(options.provider)
			if (!handler) {
				return {
					valid: false,
					error: `Unknown provider: ${options.provider}`,
				}
			}
			return handler.validate(payload, {
				queryParams: options.queryParams,
				userAgent: options.userAgent,
			})
		}

		// Auto-detect provider
		const detectedProvider = this.detectProvider(payload, {
			queryParams: options?.queryParams,
			userAgent: options?.userAgent,
		})

		if (!detectedProvider) {
			return {
				valid: false,
				error: "Could not detect webhook provider from payload structure",
			}
		}

		const handler = this.handlers.get(detectedProvider)
		if (!handler) {
			return {
				valid: false,
				error: `Handler not found for provider: ${detectedProvider}`,
			}
		}

		return handler.validate(payload, {
			queryParams: options?.queryParams,
			userAgent: options?.userAgent,
		})
	}

	/**
	 * Verify webhook signature
	 *
	 * @param payload - Raw webhook payload
	 * @param provider - Provider name
	 * @param options - Verification options
	 * @returns true if signature is valid
	 */
	verify(
		payload: unknown,
		provider: TranscriptionProvider,
		options: WebhookVerificationOptions,
	): boolean {
		const handler = this.handlers.get(provider)
		if (!handler || !handler.verify) {
			// No verification available for this provider
			return true
		}

		return handler.verify(payload, options)
	}

	/**
	 * Route to a specific provider handler
	 */
	private routeToProvider(
		payload: unknown,
		provider: TranscriptionProvider,
		options?: WebhookRouterOptions,
	): WebhookRouterResult {
		const handler = this.handlers.get(provider)

		if (!handler) {
			return {
				success: false,
				error: `Handler not found for provider: ${provider}`,
			}
		}

		// Verify signature if requested
		let verified = true
		if (
			options?.verifySignature !== false &&
			options?.verification &&
			handler.verify
		) {
			verified = handler.verify(payload, options.verification)
			if (!verified) {
				return {
					success: false,
					provider,
					error: "Webhook signature verification failed",
					verified: false,
				}
			}
		}

		// Validate payload
		const validation = handler.validate(payload, {
			queryParams: options?.queryParams,
			userAgent: options?.userAgent,
		})
		if (!validation.valid) {
			return {
				success: false,
				provider,
				error: validation.error,
				verified,
			}
		}

		// Parse payload
		try {
			const event = handler.parse(payload, {
				queryParams: options?.queryParams,
			})

			return {
				success: true,
				provider,
				event,
				verified,
			}
		} catch (error) {
			return {
				success: false,
				provider,
				error: `Failed to parse webhook: ${error instanceof Error ? error.message : "Unknown error"}`,
				verified,
			}
		}
	}

	/**
	 * Get handler for a specific provider
	 *
	 * @param provider - Provider name
	 * @returns Handler instance or undefined
	 */
	getHandler(provider: TranscriptionProvider): BaseWebhookHandler | undefined {
		return this.handlers.get(provider)
	}

	/**
	 * Get all registered providers
	 *
	 * @returns Array of provider names
	 */
	getProviders(): TranscriptionProvider[] {
		return Array.from(this.handlers.keys())
	}
}

/**
 * Factory function to create a webhook router
 */
export function createWebhookRouter(): WebhookRouter {
	return new WebhookRouter()
}
