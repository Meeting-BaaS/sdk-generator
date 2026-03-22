/**
 * Shared types used across transcription provider adapters
 *
 * Centralizes common patterns (region, session status, getRegion return shape)
 * so adapters stay consistent and typed.
 */

import type { ProviderConfig } from "./base-adapter"

// ─────────────────────────────────────────────────────────────────────────────
// Region types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return type for adapters that expose both REST API and WebSocket endpoints.
 *
 * Used by Deepgram and AssemblyAI getRegion(). Soniox, ElevenLabs, Speechmatics
 * return a single region code (string) instead.
 *
 * @example Deepgram
 * ```typescript
 * getRegion(): RegionalEndpoints {
 *   return { api: this.baseUrl, websocket: this.wsBaseUrl }
 * }
 * ```
 */
export interface RegionalEndpoints {
  /** REST API base URL */
  api: string
  /** WebSocket base URL for streaming */
  websocket: string
}

/**
 * Config extension for adapters that support regional endpoints.
 * Generic over the provider-specific region literal type.
 *
 * @example Deepgram
 * ```typescript
 * export interface DeepgramConfig extends ProviderConfigWithRegion<DeepgramRegionType> {
 *   projectId?: string
 * }
 * ```
 *
 * @example AssemblyAI
 * ```typescript
 * export interface AssemblyAIConfig extends ProviderConfigWithRegion<AssemblyAIRegionType> {}
 * ```
 */
export interface ProviderConfigWithRegion<TRegion extends string = string> extends ProviderConfig {
  /**
   * Regional endpoint for data residency and/or latency.
   * Each provider defines its own allowed values (e.g. "global" | "eu" for Deepgram).
   */
  region?: TRegion
}

// ─────────────────────────────────────────────────────────────────────────────
// Job type (pre-recorded vs streaming)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Job type for providers that support both pre-recorded and streaming transcriptions.
 * Used by Gladia for deleteTranscript(), getAudioFile(), etc.
 *
 * Other providers may adopt this when they add streaming + batch support.
 */
export type TranscriptJobType = "pre-recorded" | "streaming"

// ─────────────────────────────────────────────────────────────────────────────
// Re-export SessionStatus for adapter consistency
// ─────────────────────────────────────────────────────────────────────────────

export type { SessionStatus } from "../router/types"
