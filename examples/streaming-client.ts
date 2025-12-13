/**
 * Best Practice Example: Real-time Streaming Transcription Client
 *
 * This example demonstrates the recommended way to use VoiceRouter SDK
 * for real-time streaming transcription with proper error handling,
 * logging, and provider management.
 */

import {
  VoiceRouter,
  GladiaAdapter,
  DeepgramAdapter,
  AssemblyAIAdapter,
} from "voice-router-dev";
import type {
  StreamingSession,
  StreamingProvider,
  StreamingOptions,
  StreamingCallbacks,
  VoiceRouterConfig,
} from "voice-router-dev";

/**
 * Configuration interface for the streaming client
 */
interface StreamingClientConfig {
  /** VoiceRouter configuration with provider credentials */
  voiceRouter: VoiceRouterConfig;
  /** Default streaming provider (must support streaming) */
  defaultProvider?: StreamingProvider;
  /** Enable transcript logging to file */
  enableLogging?: boolean;
  /** Directory for transcript logs */
  logDirectory?: string;
}

/**
 * Simplified streaming transcription client using VoiceRouter SDK
 *
 * This client demonstrates best practices for:
 * - Automatic provider validation (SDK checks capabilities)
 * - Clean error handling
 * - Type-safe provider selection
 * - Proper session lifecycle management
 *
 * @example Basic usage
 * ```typescript
 * const client = new StreamingClient({
 *   voiceRouter: {
 *     providers: {
 *       gladia: { apiKey: process.env.GLADIA_API_KEY },
 *       deepgram: { apiKey: process.env.DEEPGRAM_API_KEY }
 *     },
 *     defaultProvider: 'gladia'
 *   }
 * });
 *
 * // Start streaming session
 * await client.startSession({
 *   encoding: 'linear16',
 *   sampleRate: 16000,
 *   language: 'en'
 * });
 *
 * // Send audio chunks
 * await client.sendAudio(audioBuffer);
 *
 * // End session
 * await client.endSession();
 * ```
 */
export class StreamingClient {
  private router: VoiceRouter;
  private session: StreamingSession | null = null;
  private defaultProvider: StreamingProvider;

  constructor(config: StreamingClientConfig) {
    // Initialize VoiceRouter
    this.router = new VoiceRouter(config.voiceRouter);

    // Register only streaming-capable adapters
    this.registerStreamingAdapters(config.voiceRouter);

    // Set default provider (SDK will validate it supports streaming)
    this.defaultProvider = config.defaultProvider || this.getFirstStreamingProvider();

    console.log(`[StreamingClient] Initialized with default provider: ${this.defaultProvider}`);
  }

  /**
   * Register adapters for providers that support streaming
   */
  private registerStreamingAdapters(config: VoiceRouterConfig): void {
    const adapters = [
      { name: "gladia", adapter: new GladiaAdapter() },
      { name: "deepgram", adapter: new DeepgramAdapter() },
      { name: "assemblyai", adapter: new AssemblyAIAdapter() },
    ] as const;

    for (const { name, adapter } of adapters) {
      if (config.providers[name]) {
        this.router.registerAdapter(adapter);
        console.log(`[StreamingClient] Registered ${name} adapter`);
      }
    }
  }

  /**
   * Get the first available streaming provider
   */
  private getFirstStreamingProvider(): StreamingProvider {
    const registered = this.router.getRegisteredProviders() as string[];
    const streamingProviders: StreamingProvider[] = ["gladia", "deepgram", "assemblyai"];

    const firstStreaming = registered.find((p) =>
      streamingProviders.includes(p as StreamingProvider)
    ) as StreamingProvider;

    if (!firstStreaming) {
      throw new Error("No streaming providers configured. Add Gladia, Deepgram, or AssemblyAI.");
    }

    return firstStreaming;
  }

  /**
   * Start a streaming transcription session
   *
   * The SDK automatically validates that the provider supports streaming
   * and throws a helpful error if not.
   *
   * @param options - Streaming configuration options
   * @param provider - Optional provider override (defaults to configured default)
   * @returns Promise<boolean> - true if session started successfully
   *
   * @example
   * ```typescript
   * await client.startSession({
   *   encoding: 'linear16',
   *   sampleRate: 16000,
   *   language: 'en',
   *   interimResults: true
   * });
   * ```
   */
  async startSession(
    options: Omit<StreamingOptions, "provider">,
    provider?: StreamingProvider
  ): Promise<boolean> {
    try {
      const selectedProvider = provider || this.defaultProvider;

      console.log(`[StreamingClient] Starting session with ${selectedProvider}...`);

      // SDK validates provider supports streaming and throws clear error if not
      this.session = await this.router.transcribeStream(
        {
          provider: selectedProvider,
          ...options,
        } as StreamingOptions & { provider: StreamingProvider },
        this.createCallbacks(selectedProvider)
      );

      console.log(`[StreamingClient] ✅ Session started with ${selectedProvider}`);
      return true;
    } catch (error: any) {
      // SDK throws helpful error like:
      // "Provider 'azure-stt' does not support streaming transcription"
      console.error(`[StreamingClient] ❌ Failed to start session:`, error.message);
      return false;
    }
  }

  /**
   * Create standard callbacks for streaming events
   * Override this method to customize behavior
   */
  protected createCallbacks(provider: string): StreamingCallbacks {
    return {
      onOpen: () => {
        console.log(`[StreamingClient] 🔌 Connected to ${provider}`);
      },

      onTranscript: (event) => {
        const prefix = event.isFinal ? "📝 FINAL" : "💬 Partial";
        console.log(`[StreamingClient] ${prefix}: "${event.text}"`);

        // Override in subclass to handle transcripts
        this.onTranscript(event.text || "", event.isFinal || false, event);
      },

      onError: (error) => {
        console.error(`[StreamingClient] ❌ Error from ${provider}:`, error.message);
        // Override in subclass to handle errors
        this.onError(error);
      },

      onClose: (code, reason) => {
        console.log(`[StreamingClient] 🔌 Disconnected from ${provider}`, { code, reason });
        // Override in subclass to handle close
        this.onClose(code, reason);
      },
    };
  }

  /**
   * Send audio data to the streaming session
   *
   * @param audioData - Raw audio data buffer
   * @param isLast - Mark this as the last chunk
   * @returns Promise<boolean> - true if sent successfully
   */
  async sendAudio(audioData: Buffer, isLast = false): Promise<boolean> {
    if (!this.session) {
      console.error("[StreamingClient] ⚠️ No active session. Call startSession() first.");
      return false;
    }

    try {
      await this.session.sendAudio({ data: audioData, isLast });
      return true;
    } catch (error: any) {
      console.error("[StreamingClient] ❌ Failed to send audio:", error.message);
      return false;
    }
  }

  /**
   * End the current streaming session
   */
  async endSession(): Promise<void> {
    if (this.session) {
      try {
        await this.session.close();
        console.log("[StreamingClient] Session ended");
      } catch (error: any) {
        console.error("[StreamingClient] Error ending session:", error.message);
      } finally {
        this.session = null;
      }
    }
  }

  /**
   * Check if there's an active streaming session
   */
  isActive(): boolean {
    return this.session !== null && this.session.getStatus() === "open";
  }

  /**
   * Get the current session status
   */
  getStatus(): "connecting" | "open" | "closing" | "closed" {
    return this.session?.getStatus() || "closed";
  }

  /**
   * Get the VoiceRouter instance for advanced usage
   */
  getRouter(): VoiceRouter {
    return this.router;
  }

  // ===== Override these methods in your subclass =====

  /**
   * Called when a transcript is received
   * Override this to handle transcripts in your application
   */
  protected onTranscript(
    text: string,
    isFinal: boolean,
    event: any
  ): void {
    // Default implementation does nothing
    // Override in subclass to handle transcripts
  }

  /**
   * Called when an error occurs
   * Override this to handle errors in your application
   */
  protected onError(error: any): void {
    // Default implementation does nothing
    // Override in subclass to handle errors
  }

  /**
   * Called when the connection closes
   * Override this to handle disconnection in your application
   */
  protected onClose(code?: number, reason?: string): void {
    // Default implementation does nothing
    // Override in subclass to handle disconnection
  }
}

/**
 * Extended example with custom transcript handling
 */
export class TranscriptionClient extends StreamingClient {
  private transcriptCallback: ((text: string, isFinal: boolean) => void) | null = null;

  /**
   * Register a callback for transcript events
   */
  onTranscription(callback: (text: string, isFinal: boolean) => void): void {
    this.transcriptCallback = callback;
  }

  /**
   * Handle incoming transcripts
   */
  protected onTranscript(text: string, isFinal: boolean): void {
    if (this.transcriptCallback) {
      this.transcriptCallback(text, isFinal);
    }
  }

  /**
   * Handle errors
   */
  protected onError(error: any): void {
    // Add custom error handling here
    // e.g., reconnection logic, alerting, etc.
  }

  /**
   * Handle connection close
   */
  protected onClose(code?: number, reason?: string): void {
    // Add custom cleanup here
    // e.g., update UI state, attempt reconnection, etc.
  }
}

// ===== Usage Examples =====

/**
 * Example 1: Basic streaming with Gladia
 */
export async function exampleBasicStreaming() {
  const client = new StreamingClient({
    voiceRouter: {
      providers: {
        gladia: { apiKey: "your-gladia-key" },
      },
      defaultProvider: "gladia",
    },
  });

  // Start session
  await client.startSession({
    encoding: "linear16",
    sampleRate: 16000,
    language: "en",
    interimResults: true,
  });

  // Send audio (in your audio loop)
  const audioChunk = Buffer.from([]); // Your audio data
  await client.sendAudio(audioChunk);

  // End session
  await client.endSession();
}

/**
 * Example 2: Multi-provider with custom handling
 */
export async function exampleMultiProvider() {
  const client = new TranscriptionClient({
    voiceRouter: {
      providers: {
        gladia: { apiKey: process.env.GLADIA_API_KEY! },
        deepgram: { apiKey: process.env.DEEPGRAM_API_KEY! },
        assemblyai: { apiKey: process.env.ASSEMBLYAI_API_KEY! },
      },
      defaultProvider: "gladia",
    },
  });

  // Register custom transcript handler
  client.onTranscription((text, isFinal) => {
    if (isFinal) {
      console.log("Final transcript:", text);
      // Save to database, send to client, etc.
    }
  });

  // Try Gladia first, fallback to Deepgram if it fails
  let success = await client.startSession({
    encoding: "linear16",
    sampleRate: 16000,
  });

  if (!success) {
    console.log("Gladia failed, trying Deepgram...");
    success = await client.startSession(
      {
        encoding: "linear16",
        sampleRate: 16000,
      },
      "deepgram"
    );
  }

  if (success) {
    // Send audio...
  }

  await client.endSession();
}

/**
 * Example 3: Provider-specific options
 */
export async function exampleProviderSpecificOptions() {
  const client = new StreamingClient({
    voiceRouter: {
      providers: {
        gladia: { apiKey: process.env.GLADIA_API_KEY! },
      },
      defaultProvider: "gladia",
    },
  });

  // Gladia-specific options (type-safe!)
  await client.startSession({
    encoding: "linear16",
    sampleRate: 16000,
    language: "en",
    diarization: true, // Speaker diarization
    interimResults: true,
    endpointing: 500, // Gladia-specific: utterance end silence threshold
  });
}
