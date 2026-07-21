/**
 * Webhook normalization module
 *
 * Provides unified webhook handling across all transcription providers.
 * Automatically detects provider from payload structure and normalizes
 * webhook events to a common format.
 *
 * @module webhooks
 *
 * @example Basic usage
 * ```typescript
 * import { WebhookRouter } from '@meeting-baas/sdk';
 *
 * const router = new WebhookRouter();
 * const result = router.route(req.body);
 *
 * if (result.success) {
 *   console.log('Provider:', result.provider);
 *   console.log('Event:', result.event);
 * }
 * ```
 *
 * @example Express.js webhook endpoint
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
 *   // Process the normalized event
 *   if (result.event?.eventType === 'transcription.completed') {
 *     console.log('Transcription completed:', result.event.data?.id);
 *   }
 *
 *   res.status(200).json({ received: true });
 * });
 * ```
 */

export {
  AssemblyAIWebhookHandler,
  createAssemblyAIWebhookHandler
} from "./assemblyai-webhook"
export {
  AzureWebhookHandler,
  createAzureWebhookHandler
} from "./azure-webhook"
// Export base handler
export { BaseWebhookHandler } from "./base-webhook"
export {
  createDeepgramWebhookHandler,
  DeepgramWebhookHandler
} from "./deepgram-webhook"
export {
  createElevenLabsWebhookHandler,
  ElevenLabsWebhookHandler
} from "./elevenlabs-webhook"
// Export provider-specific handlers
export {
  createGladiaWebhookHandler,
  GladiaWebhookHandler
} from "./gladia-webhook"
export {
  createSonioxWebhookHandler,
  SonioxWebhookHandler
} from "./soniox-webhook"
export { SpeechmaticsWebhookHandler } from "./speechmatics-webhook"
// Export types
export type {
  AssemblyAIWebhookPayload,
  AzureWebhookPayload,
  DeepgramWebhookPayload,
  ElevenLabsWebhookPayload,
  GladiaWebhookErrorPayload,
  // Provider-specific webhook payload types
  GladiaWebhookPayload,
  GladiaWebhookSuccessPayload,
  ProviderWebhookPayloadMap,
  SonioxWebhookPayload,
  SpeechmaticsWebhookPayload,
  UnifiedWebhookEvent,
  WebhookEventType,
  WebhookProvider,
  WebhookValidation,
  WebhookVerificationOptions
} from "./types"

// Export router
export {
  createWebhookRouter,
  WebhookRouter,
  type WebhookRouterOptions,
  type WebhookRouterResult
} from "./webhook-router"
