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
	UnifiedTranscriptResponse,
} from "../router/types"

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
	transcribe(
		audio: AudioInput,
		options?: TranscribeOptions,
	): Promise<UnifiedTranscriptResponse>

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
		callbacks?: StreamingCallbacks,
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
		options?: StreamingOptions,
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
	listTranscripts?(options?: {
		limit?: number
		offset?: number
		status?: string
	}): Promise<{
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

	protected config?: ProviderConfig

	initialize(config: ProviderConfig): void {
		this.config = config
	}

	abstract transcribe(
		audio: AudioInput,
		options?: TranscribeOptions,
	): Promise<UnifiedTranscriptResponse>

	abstract getTranscript(
		transcriptId: string,
	): Promise<UnifiedTranscriptResponse>

	/**
	 * Helper method to create error responses
	 */
	protected createErrorResponse(
		error: Error | unknown,
		statusCode?: number,
	): UnifiedTranscriptResponse {
		const err = error as Error & { statusCode?: number; code?: string }
		return {
			success: false,
			provider: this.name,
			error: {
				code: err.code || "UNKNOWN_ERROR",
				message: err.message || "An unknown error occurred",
				statusCode: statusCode || err.statusCode,
				details: error,
			},
		}
	}

	/**
	 * Helper method to validate configuration
	 */
	protected validateConfig(): void {
		if (!this.config) {
			throw new Error(
				`Adapter ${this.name} is not initialized. Call initialize() first.`,
			)
		}
		if (!this.config.apiKey) {
			throw new Error(`API key is required for ${this.name} provider`)
		}
	}
}
