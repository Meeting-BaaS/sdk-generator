/**
 * Standardized error handling utilities for Voice Router SDK
 *
 * Provides consistent error codes, messages, and formatting across all adapters.
 */

/**
 * Standard error codes used across all providers
 *
 * These codes provide a consistent error taxonomy regardless of which
 * provider is being used.
 */
export const ERROR_CODES = {
  /** Failed to parse API response or WebSocket message */
  PARSE_ERROR: "PARSE_ERROR",

  /** WebSocket connection error */
  WEBSOCKET_ERROR: "WEBSOCKET_ERROR",

  /** Async transcription job did not complete within timeout */
  POLLING_TIMEOUT: "POLLING_TIMEOUT",

  /** Transcription processing failed on provider side */
  TRANSCRIPTION_ERROR: "TRANSCRIPTION_ERROR",

  /** Connection attempt timed out */
  CONNECTION_TIMEOUT: "CONNECTION_TIMEOUT",

  /** Invalid input provided to API */
  INVALID_INPUT: "INVALID_INPUT",

  /** Authentication failed (invalid or missing API key) */
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",

  /** Rate limit exceeded */
  RATE_LIMIT: "RATE_LIMIT",

  /** Provider server error (5xx) */
  SERVER_ERROR: "SERVER_ERROR",

  /** Requested operation not supported by provider */
  NOT_SUPPORTED: "NOT_SUPPORTED",

  /** No transcription results available */
  NO_RESULTS: "NO_RESULTS",

  /** Unspecified or unknown error */
  UNKNOWN_ERROR: "UNKNOWN_ERROR"
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

/**
 * Default error messages for each error code
 *
 * These can be overridden with custom messages when creating errors.
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  PARSE_ERROR: "Failed to parse response data",
  WEBSOCKET_ERROR: "WebSocket connection error",
  POLLING_TIMEOUT: "Transcription did not complete within timeout period",
  TRANSCRIPTION_ERROR: "Transcription processing failed",
  CONNECTION_TIMEOUT: "Connection attempt timed out",
  INVALID_INPUT: "Invalid input provided",
  AUTHENTICATION_ERROR: "Authentication failed (invalid or missing API key)",
  RATE_LIMIT: "Rate limit exceeded",
  SERVER_ERROR: "Provider server error",
  NOT_SUPPORTED: "Operation not supported by this provider",
  NO_RESULTS: "No transcription results available",
  UNKNOWN_ERROR: "An unknown error occurred"
}

/**
 * Standard error object structure
 */
export interface StandardError {
  /** Error code from ERROR_CODES */
  code: string
  /** Human-readable error message */
  message: string
  /** HTTP status code if applicable */
  statusCode?: number
  /** Additional error details */
  details?: unknown
}

/**
 * Create a standardized error object
 *
 * @param code - Error code from ERROR_CODES
 * @param customMessage - Optional custom message (defaults to standard message)
 * @param details - Optional additional error details
 * @returns Standardized error object
 *
 * @example
 * ```typescript
 * throw createError(ERROR_CODES.PARSE_ERROR, undefined, rawError)
 *
 * throw createError(
 *   ERROR_CODES.TRANSCRIPTION_ERROR,
 *   "Audio file format not supported",
 *   { format: "mp4", supported: ["wav", "mp3"] }
 * )
 * ```
 */
export function createError(
  code: ErrorCode,
  customMessage?: string,
  details?: unknown
): StandardError {
  return {
    code,
    message: customMessage || ERROR_MESSAGES[code],
    details
  }
}

/**
 * Create error from caught exception
 *
 * Safely extracts error information from unknown caught values.
 *
 * @param error - Caught error (any type)
 * @param defaultCode - Error code to use if not extractable
 * @param statusCode - HTTP status code if applicable
 * @returns Standardized error object
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation()
 * } catch (error) {
 *   return { success: false, error: createErrorFromException(error) }
 * }
 * ```
 */
export function createErrorFromException(
  error: unknown,
  defaultCode: ErrorCode = ERROR_CODES.UNKNOWN_ERROR,
  statusCode?: number
): StandardError {
  if (error instanceof Error) {
    const err = error as Error & { statusCode?: number; code?: string }
    return {
      code: err.code || defaultCode,
      message: err.message || ERROR_MESSAGES[defaultCode],
      statusCode: statusCode || err.statusCode,
      details: error
    }
  }

  return {
    code: defaultCode,
    message: String(error) || ERROR_MESSAGES[defaultCode],
    statusCode,
    details: error
  }
}

/**
 * Map an HTTP status code to a semantic error code
 */
export function httpStatusToErrorCode(status: number): ErrorCode {
  switch (status) {
    case 400:
    case 404:
    case 422:
      return ERROR_CODES.INVALID_INPUT
    case 401:
    case 403:
      return ERROR_CODES.AUTHENTICATION_ERROR
    case 408:
      return ERROR_CODES.CONNECTION_TIMEOUT
    case 429:
      return ERROR_CODES.RATE_LIMIT
    default:
      if (status >= 500) return ERROR_CODES.SERVER_ERROR
      return ERROR_CODES.UNKNOWN_ERROR
  }
}

/**
 * Extract the real error message from a provider's HTTP error response body
 *
 * Tries common field paths across all providers (paths are largely disjoint):
 * - OpenAI: `{ error: { message: "..." } }`
 * - AssemblyAI, Speechmatics: `{ error: "message string" }`
 * - Gladia, Soniox, Azure, Deepgram modern: `{ message: "..." }`
 * - Deepgram legacy: `{ err_msg: "..." }`
 * - ElevenLabs: `{ detail: { message: "..." } }`
 */
export function extractProviderMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") {
    return typeof data === "string" ? data : undefined
  }
  const d = data as Record<string, any>
  // OpenAI: { error: { message: "..." } }
  if (d.error && typeof d.error === "object" && d.error.message) return String(d.error.message)
  // AssemblyAI, Speechmatics: { error: "message string" }
  if (typeof d.error === "string") return d.error
  // ElevenLabs: { detail: { message: "..." } }
  if (d.detail && typeof d.detail === "object" && d.detail.message) return String(d.detail.message)
  // Gladia, Soniox, Azure, Deepgram modern: { message: "..." }
  if (typeof d.message === "string") return d.message
  // Deepgram legacy: { err_msg: "..." }
  if (typeof d.err_msg === "string") return d.err_msg
  return undefined
}
