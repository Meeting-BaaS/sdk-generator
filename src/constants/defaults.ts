/**
 * Default configuration constants for Voice Router SDK
 *
 * These constants provide sensible defaults for timeouts, polling intervals,
 * and other configuration values used across all adapters.
 */

/**
 * Default timeout values for different operation types (in milliseconds)
 */
export const DEFAULT_TIMEOUTS = {
  /** Standard HTTP request timeout for API calls (60 seconds) */
  HTTP_REQUEST: 60000,

  /** Audio processing timeout for long audio files (120 seconds) */
  AUDIO_PROCESSING: 120000,

  /** WebSocket connection establishment timeout (10 seconds) */
  WS_CONNECTION: 10000,

  /** WebSocket graceful close timeout (5 seconds) */
  WS_CLOSE: 5000
} as const

/**
 * Default polling configuration for async transcription jobs
 */
export const DEFAULT_POLLING = {
  /** Maximum number of polling attempts before timing out */
  MAX_ATTEMPTS: 60,

  /** Standard interval between polling attempts (2 seconds) */
  INTERVAL_MS: 2000,

  /** Slower interval for long-running jobs (3 seconds) */
  SLOW_INTERVAL_MS: 3000
} as const
