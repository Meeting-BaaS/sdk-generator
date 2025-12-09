/**
 * VoiceRouter - Unified transcription API bridge
 * Provides a provider-agnostic interface for multiple Speech-to-Text services
 */

import type {
	TranscriptionAdapter,
	ProviderConfig,
} from "../adapters/base-adapter"
import type {
	AudioInput,
	StreamEvent,
	StreamingCallbacks,
	StreamingOptions,
	StreamingSession,
	TranscribeOptions,
	TranscriptionProvider,
	UnifiedTranscriptResponse,
} from "./types"

/**
 * Configuration for VoiceRouter
 */
export interface VoiceRouterConfig {
	/**
	 * Provider configurations
	 * Key: provider name, Value: provider config
	 */
	providers: Partial<Record<TranscriptionProvider, ProviderConfig>>

	/**
	 * Default provider to use when not specified
	 */
	defaultProvider?: TranscriptionProvider

	/**
	 * Strategy for provider selection when multiple providers are configured
	 * - 'explicit': Always require provider to be specified (throws error if not)
	 * - 'default': Use defaultProvider if not specified
	 * - 'round-robin': Rotate between providers for load balancing
	 * - 'fastest': Choose provider with lowest current queue (future feature)
	 */
	selectionStrategy?: "explicit" | "default" | "round-robin"
}

/**
 * VoiceRouter - Main class for provider-agnostic transcription
 *
 * Provides a unified interface across multiple Speech-to-Text providers
 * (Gladia, AssemblyAI, Deepgram, etc.). Automatically handles provider
 * selection, adapter management, and response normalization.
 *
 * @example Basic usage with single provider
 * ```typescript
 * import { VoiceRouter, GladiaAdapter } from '@meeting-baas/sdk';
 *
 * const router = new VoiceRouter({
 *   providers: {
 *     gladia: { apiKey: process.env.GLADIA_API_KEY }
 *   },
 *   defaultProvider: 'gladia'
 * });
 *
 * router.registerAdapter(new GladiaAdapter());
 *
 * const result = await router.transcribe({
 *   type: 'url',
 *   url: 'https://example.com/audio.mp3'
 * });
 *
 * console.log(result.data.text);
 * ```
 *
 * @example Multi-provider with round-robin
 * ```typescript
 * const router = new VoiceRouter({
 *   providers: {
 *     gladia: { apiKey: process.env.GLADIA_API_KEY },
 *     assemblyai: { apiKey: process.env.ASSEMBLYAI_API_KEY }
 *   },
 *   selectionStrategy: 'round-robin'
 * });
 *
 * router.registerAdapter(new GladiaAdapter());
 * router.registerAdapter(new AssemblyAIAdapter());
 *
 * // Automatically alternates between providers
 * await router.transcribe(audio1); // Uses Gladia
 * await router.transcribe(audio2); // Uses AssemblyAI
 * await router.transcribe(audio3); // Uses Gladia again
 * ```
 */
export class VoiceRouter {
	private adapters: Map<TranscriptionProvider, TranscriptionAdapter> =
		new Map()
	private config: VoiceRouterConfig
	private roundRobinIndex = 0

	constructor(config: VoiceRouterConfig) {
		this.config = {
			selectionStrategy: "default",
			...config,
		}

		// Validate configuration
		if (Object.keys(config.providers).length === 0) {
			throw new Error(
				"VoiceRouter requires at least one provider configuration",
			)
		}

		// If using default strategy, ensure a default provider is set
		if (
			this.config.selectionStrategy === "default" &&
			!this.config.defaultProvider
		) {
			// Auto-select first provider as default
			this.config.defaultProvider = Object.keys(
				config.providers,
			)[0] as TranscriptionProvider
		}
	}

	/**
	 * Register an adapter for a provider
	 *
	 * Call this method for each provider you want to use. The adapter will be
	 * initialized with the configuration provided in the constructor.
	 *
	 * @param adapter - Provider adapter instance to register
	 * @throws {Error} If no configuration found for the provider
	 *
	 * @example
	 * ```typescript
	 * const router = new VoiceRouter({
	 *   providers: {
	 *     gladia: { apiKey: 'YOUR_KEY' }
	 *   }
	 * });
	 *
	 * router.registerAdapter(new GladiaAdapter());
	 * ```
	 */
	registerAdapter(adapter: TranscriptionAdapter): void {
		// Initialize adapter with config
		const providerConfig = this.config.providers[adapter.name]
		if (!providerConfig) {
			throw new Error(
				`No configuration found for provider: ${adapter.name}`,
			)
		}

		adapter.initialize(providerConfig)
		this.adapters.set(adapter.name, adapter)
	}

	/**
	 * Get an adapter by provider name
	 */
	getAdapter(provider: TranscriptionProvider): TranscriptionAdapter {
		const adapter = this.adapters.get(provider)
		if (!adapter) {
			throw new Error(
				`Provider '${provider}' is not registered. Available providers: ${Array.from(this.adapters.keys()).join(", ")}`,
			)
		}
		return adapter
	}

	/**
	 * Select provider based on configured strategy
	 */
	private selectProvider(
		preferredProvider?: TranscriptionProvider,
	): TranscriptionProvider {
		// If provider explicitly specified, use it
		if (preferredProvider) {
			if (!this.adapters.has(preferredProvider)) {
				throw new Error(
					`Provider '${preferredProvider}' is not registered. Available providers: ${Array.from(this.adapters.keys()).join(", ")}`,
				)
			}
			return preferredProvider
		}

		// Apply selection strategy
		switch (this.config.selectionStrategy) {
			case "explicit":
				throw new Error(
					"Provider must be explicitly specified when using 'explicit' selection strategy",
				)

			case "round-robin": {
				const providers = Array.from(this.adapters.keys())
				const provider = providers[this.roundRobinIndex % providers.length]
				this.roundRobinIndex++
				return provider
			}

			case "default":
			default:
				if (!this.config.defaultProvider) {
					throw new Error("No default provider configured")
				}
				return this.config.defaultProvider
		}
	}

	/**
	 * Transcribe audio using a specific provider or the default
	 *
	 * Submit audio for transcription. The provider will be selected based on
	 * your configuration strategy (explicit, default, or round-robin).
	 *
	 * @param audio - Audio input (URL, file buffer, or stream)
	 * @param options - Transcription options (language, diarization, etc.)
	 * @param options.provider - Specific provider to use (overrides selection strategy)
	 * @returns Unified transcription response with normalized format
	 * @throws {Error} If provider not registered or selection fails
	 *
	 * @example URL audio
	 * ```typescript
	 * const result = await router.transcribe({
	 *   type: 'url',
	 *   url: 'https://example.com/audio.mp3'
	 * }, {
	 *   language: 'en',
	 *   diarization: true,
	 *   summarization: true
	 * });
	 *
	 * if (result.success) {
	 *   console.log('Transcript:', result.data.text);
	 *   console.log('Speakers:', result.data.speakers);
	 *   console.log('Summary:', result.data.summary);
	 * }
	 * ```
	 *
	 * @example Specific provider
	 * ```typescript
	 * const result = await router.transcribe(audio, {
	 *   provider: 'gladia',  // Force use of Gladia
	 *   language: 'en'
	 * });
	 * ```
	 */
	async transcribe(
		audio: AudioInput,
		options?: TranscribeOptions & { provider?: TranscriptionProvider },
	): Promise<UnifiedTranscriptResponse> {
		const provider = this.selectProvider(options?.provider)
		const adapter = this.getAdapter(provider)

		// Remove provider from options before passing to adapter
		const { provider: _, ...adapterOptions } = options || {}

		return adapter.transcribe(audio, adapterOptions)
	}

	/**
	 * Get transcription result by ID
	 * Provider must be specified since IDs are provider-specific
	 */
	async getTranscript(
		transcriptId: string,
		provider: TranscriptionProvider,
	): Promise<UnifiedTranscriptResponse> {
		const adapter = this.getAdapter(provider)
		return adapter.getTranscript(transcriptId)
	}

	/**
	 * Stream audio for real-time transcription
	 * Only works with providers that support streaming
	 *
	 * @param options - Streaming options including provider selection
	 * @param callbacks - Event callbacks for transcription results
	 * @returns Promise that resolves with a StreamingSession
	 *
	 * @example
	 * ```typescript
	 * import { VoiceRouter } from '@meeting-baas/sdk';
	 *
	 * const router = new VoiceRouter();
	 * router.initialize({
	 *   gladia: { apiKey: process.env.GLADIA_KEY },
	 *   deepgram: { apiKey: process.env.DEEPGRAM_KEY }
	 * });
	 *
	 * const session = await router.transcribeStream({
	 *   provider: 'deepgram',
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
	 * await session.close();
	 * ```
	 */
	async transcribeStream(
		options?: StreamingOptions & { provider?: TranscriptionProvider },
		callbacks?: StreamingCallbacks,
	): Promise<StreamingSession> {
		const provider = this.selectProvider(options?.provider)
		const adapter = this.getAdapter(provider)

		// Check if adapter supports streaming
		if (!adapter.capabilities.streaming || !adapter.transcribeStream) {
			throw new Error(
				`Provider '${provider}' does not support streaming transcription`,
			)
		}

		// Remove provider from options before passing to adapter
		const { provider: _, ...adapterOptions } = options || {}

		return adapter.transcribeStream(adapterOptions, callbacks)
	}

	/**
	 * Delete a transcription
	 * Not all providers support this operation
	 */
	async deleteTranscript(
		transcriptId: string,
		provider: TranscriptionProvider,
	): Promise<{ success: boolean }> {
		const adapter = this.getAdapter(provider)

		if (!adapter.deleteTranscript) {
			throw new Error(
				`Provider '${provider}' does not support deleting transcripts`,
			)
		}

		return adapter.deleteTranscript(transcriptId)
	}

	/**
	 * List recent transcriptions
	 * Not all providers support this operation
	 */
	async listTranscripts(
		provider: TranscriptionProvider,
		options?: {
			limit?: number
			offset?: number
			status?: string
		},
	): Promise<{
		transcripts: UnifiedTranscriptResponse[]
		total?: number
		hasMore?: boolean
	}> {
		const adapter = this.getAdapter(provider)

		if (!adapter.listTranscripts) {
			throw new Error(
				`Provider '${provider}' does not support listing transcripts`,
			)
		}

		return adapter.listTranscripts(options)
	}

	/**
	 * Get capabilities for a specific provider
	 */
	getProviderCapabilities(provider: TranscriptionProvider) {
		const adapter = this.getAdapter(provider)
		return adapter.capabilities
	}

	/**
	 * Get all registered providers
	 */
	getRegisteredProviders(): TranscriptionProvider[] {
		return Array.from(this.adapters.keys())
	}

	/**
	 * Get raw provider client for advanced usage
	 */
	getRawProviderClient(provider: TranscriptionProvider): unknown {
		const adapter = this.getAdapter(provider)

		if (!adapter.getRawClient) {
			throw new Error(
				`Provider '${provider}' does not expose a raw client`,
			)
		}

		return adapter.getRawClient()
	}
}

/**
 * Factory function to create a VoiceRouter with auto-registered adapters
 */
export function createVoiceRouter(
	config: VoiceRouterConfig,
	adapters?: TranscriptionAdapter[],
): VoiceRouter {
	const router = new VoiceRouter(config)

	// Register provided adapters
	if (adapters && adapters.length > 0) {
		for (const adapter of adapters) {
			router.registerAdapter(adapter)
		}
	}

	return router
}
