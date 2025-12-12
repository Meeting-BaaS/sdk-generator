/**
 * Base adapter interface for transcription providers
 * All provider adapters must implement this interface
 */

import type {
  AudioInput,
  ProviderCapabilities,
  StreamEvent,
  StreamingCallbacks,
  StreamingOptions,
  StreamingSession,
  TranscribeOptions,
  TranscriptionProvider,
  UnifiedTranscriptResponse
} from "../router/types"
import { DEFAULT_TIMEOUTS, DEFAULT_POLLING } from "../constants/defaults"
import { ERROR_CODES, type ErrorCode } from "../utils/errors"

/**
 * Provider configuration
 */
export interface ProviderConfig {
  /** API key for authentication */
  apiKey: string
  /** Base API URL (optional, uses provider default if not specified) */
  baseUrl?: string
  /** Request timeout in milliseconds */
  timeout?: number
  /** Custom headers to include in requests */
  headers?: Record<string, string>
  /** Additional provider-specific options */
  options?: Record<string, unknown>
}

/**
 * Base adapter interface that all provider adapters must implement
 */
export interface TranscriptionAdapter {
  /**
   * Provider name
   */
  readonly name: TranscriptionProvider

  /**
   * Provider capabilities
   */
  readonly capabilities: ProviderCapabilities

  /**
   * Initialize the adapter with configuration
   */
  initialize(config: ProviderConfig): void

  /**
   * Submit audio for transcription (async)
   * Returns immediately with a job ID that can be polled
   */
  transcribe(audio: AudioInput, options?: TranscribeOptions): Promise<UnifiedTranscriptResponse>

  /**
   * Get transcription result by ID
   * Used to poll for results after async submission
   */
  getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse>

  /**
   * Stream audio for real-time transcription (callback-based)
   * Only available if capabilities.streaming is true
   *
   * This method creates a streaming session that accepts audio chunks
   * and returns transcription results via callbacks.
   *
   * @param options - Streaming configuration options
   * @param callbacks - Event callbacks for transcription results
   * @returns Promise that resolves with a StreamingSession
   *
   * @example
   * ```typescript
   * const session = await adapter.transcribeStream({
   *   encoding: 'linear16',
   *   sampleRate: 16000,
   *   language: 'en'
   * }, {
   *   onTranscript: (event) => console.log(event.text),
   *   onError: (error) => console.error(error)
   * });
   *
   * // Send audio chunks
   * await session.sendAudio({ data: audioBuffer });
   *
   * // Close when done
   * await session.close();
   * ```
   */
  transcribeStream?(
    options?: StreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession>

  /**
   * Stream audio for real-time transcription (async iterator)
   * Alternative streaming API that returns an async iterable
   * Only available if capabilities.streaming is true
   *
   * @deprecated Prefer transcribeStream() with callbacks for better control
   */
  transcribeStreamIterator?(
    audioStream: ReadableStream,
    options?: StreamingOptions
  ): AsyncIterable<StreamEvent>

  /**
   * Delete a transcription
   * Not all providers support deletion
   */
  deleteTranscript?(transcriptId: string): Promise<{ success: boolean }>

  /**
   * List recent transcriptions
   * Not all providers support listing
   */
  listTranscripts?(options?: { limit?: number; offset?: number; status?: string }): Promise<{
    transcripts: UnifiedTranscriptResponse[]
    total?: number
    hasMore?: boolean
  }>

  /**
   * Get provider-specific raw client
   * For advanced users who need direct access to provider APIs
   */
  getRawClient?(): unknown
}

/**
 * Abstract base class for adapters (optional convenience)
 * Providers can extend this or implement TranscriptionAdapter directly
 */
export abstract class BaseAdapter implements TranscriptionAdapter {
  abstract readonly name: TranscriptionProvider
  abstract readonly capabilities: ProviderCapabilities

  /**
   * Base URL for provider API (must be defined by subclass)
   */
  protected abstract baseUrl: string

  protected config?: ProviderConfig

  initialize(config: ProviderConfig): void {
    this.config = config
  }

  abstract transcribe(
    audio: AudioInput,
    options?: TranscribeOptions
  ): Promise<UnifiedTranscriptResponse>

  abstract getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse>

  /**
   * Helper method to create error responses
   *
   * @param error - Error object or unknown error
   * @param statusCode - Optional HTTP status code
   * @param code - Optional error code (defaults to extracted or UNKNOWN_ERROR)
   */
  protected createErrorResponse(
    error: Error | unknown,
    statusCode?: number,
    code?: ErrorCode
  ): UnifiedTranscriptResponse {
    const err = error as Error & { statusCode?: number; code?: string }
    return {
      success: false,
      provider: this.name,
      error: {
        code: code || err.code || ERROR_CODES.UNKNOWN_ERROR,
        message: err.message || "An unknown error occurred",
        statusCode: statusCode || err.statusCode,
        details: error
      }
    }
  }

  /**
   * Helper method to validate configuration
   */
  protected validateConfig(): void {
    if (!this.config) {
      throw new Error(`Adapter ${this.name} is not initialized. Call initialize() first.`)
    }
    if (!this.config.apiKey) {
      throw new Error(`API key is required for ${this.name} provider`)
    }
  }

  /**
   * Build axios config for generated API client functions
   *
   * @param authHeaderName - Header name for API key (e.g., "Authorization", "x-gladia-key")
   * @param authHeaderValue - Optional function to format auth header value (defaults to raw API key)
   * @returns Axios config object
   */
  protected getAxiosConfig(
    authHeaderName: string = "Authorization",
    authHeaderValue?: (apiKey: string) => string
  ): {
    baseURL: string
    timeout: number
    headers: Record<string, string>
  } {
    this.validateConfig()

    const authValue = authHeaderValue
      ? authHeaderValue(this.config!.apiKey)
      : this.config!.apiKey

    return {
      baseURL: this.config!.baseUrl || this.baseUrl,
      timeout: this.config!.timeout || DEFAULT_TIMEOUTS.HTTP_REQUEST,
      headers: {
        [authHeaderName]: authValue,
        "Content-Type": "application/json",
        ...this.config!.headers
      }
    }
  }

  /**
   * Generic polling helper for async transcription jobs
   *
   * Polls getTranscript() until job completes or times out.
   *
   * @param transcriptId - Job/transcript ID to poll
   * @param options - Polling configuration
   * @returns Final transcription result
   */
  protected async pollForCompletion(
    transcriptId: string,
    options?: {
      maxAttempts?: number
      intervalMs?: number
    }
  ): Promise<UnifiedTranscriptResponse> {
    const { maxAttempts = DEFAULT_POLLING.MAX_ATTEMPTS, intervalMs = DEFAULT_POLLING.INTERVAL_MS } =
      options || {}

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.getTranscript(transcriptId)

      if (!result.success) {
        return result
      }

      const status = result.data?.status
      if (status === "completed") {
        return result
      }

      if (status === "error") {
        return this.createErrorResponse(
          new Error("Transcription failed"),
          undefined,
          ERROR_CODES.TRANSCRIPTION_ERROR
        )
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }

    return {
      success: false,
      provider: this.name,
      error: {
        code: ERROR_CODES.POLLING_TIMEOUT,
        message: `Transcription did not complete after ${maxAttempts} attempts`
      }
    }
  }
}
