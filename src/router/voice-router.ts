/**
 * VoiceRouter - Unified transcription API bridge
 * Provides a provider-agnostic interface for multiple Speech-to-Text services
 */

import type { ProviderConfig, TranscriptionAdapter } from "../adapters/base-adapter"
import type {
  AssemblyAIProviderStreamingOptions,
  DeepgramProviderStreamingOptions,
  ElevenLabsProviderStreamingOptions,
  GladiaProviderStreamingOptions,
  OpenAIProviderStreamingOptions,
  ProviderStreamingOptions,
  SonioxProviderStreamingOptions,
  SpeechmaticsProviderStreamingOptions
} from "./provider-streaming-types"
import type {
  AudioInput,
  ListTranscriptsOptions,
  ProviderCapabilities,
  StreamingCallbacks,
  StreamingOptions,
  StreamingSession,
  TranscribeOptions,
  TranscriptionProvider,
  UnifiedTranscriptResponse
} from "./types"

const SUPPORTED_PROVIDERS = [
  "gladia",
  "assemblyai",
  "deepgram",
  "openai-whisper",
  "azure-stt",
  "speechmatics",
  "soniox",
  "elevenlabs"
] as const satisfies readonly TranscriptionProvider[]
const SUPPORTED_PROVIDER_SET = new Set<string>(SUPPORTED_PROVIDERS)
const OPTIONAL_ADAPTER_METHODS = [
  "transcribeStream",
  "deleteTranscript",
  "listTranscripts",
  "getRawClient"
] as const
const REQUIRED_ADAPTER_METHODS = ["initialize", "transcribe", "getTranscript"] as const
const REQUIRED_CAPABILITY_FLAGS = [
  "streaming",
  "diarization",
  "wordTimestamps",
  "languageDetection",
  "customVocabulary",
  "summarization",
  "sentimentAnalysis",
  "entityDetection",
  "piiRedaction",
  "listTranscripts",
  "deleteTranscript"
] as const satisfies readonly Exclude<keyof ProviderCapabilities, "getAudioFile">[]
const AUDIO_INPUT_TYPES = ["url", "file", "stream"] as const
const STREAMING_CALLBACK_NAMES = [
  "onOpen",
  "onTranscript",
  "onUtterance",
  "onMetadata",
  "onError",
  "onClose",
  "onRawMessage",
  "onSpeechStart",
  "onSpeechEnd",
  "onTranslation",
  "onSentiment",
  "onEntity",
  "onSummarization",
  "onChapterization",
  "onAudioAck",
  "onLifecycle"
] as const satisfies readonly (keyof StreamingCallbacks)[]

type OptionalAdapterMethod = (typeof OPTIONAL_ADAPTER_METHODS)[number]
type RequiredAdapterMethod = (typeof REQUIRED_ADAPTER_METHODS)[number]
type CapabilityFlag = keyof ProviderCapabilities
type StreamingCallbackName = (typeof STREAMING_CALLBACK_NAMES)[number]
type DefaultStreamingOptions = StreamingOptions & { provider?: never }

interface AdapterMethodSnapshots {
  transcribe: (audio: AudioInput, options?: TranscribeOptions) => Promise<UnifiedTranscriptResponse>
  getTranscript: (transcriptId: string) => Promise<UnifiedTranscriptResponse>
  transcribeStream?: (
    options?: StreamingOptions,
    callbacks?: StreamingCallbacks
  ) => Promise<StreamingSession>
  deleteTranscript?: (transcriptId: string) => Promise<{ success: boolean }>
  listTranscripts?: (options?: ListTranscriptsOptions) => Promise<{
    transcripts: UnifiedTranscriptResponse[]
    total?: number
    hasMore?: boolean
  }>
  getRawClient?: () => unknown
}

function isSupportedProvider(provider: string): provider is TranscriptionProvider {
  return SUPPORTED_PROVIDER_SET.has(provider)
}

function formatRuntimeValue(value: unknown): string {
  try {
    return String(value)
  } catch {
    try {
      return Object.prototype.toString.call(value)
    } catch {
      return "<unprintable value>"
    }
  }
}

function requireSupportedProvider(provider: unknown, label = "Provider"): TranscriptionProvider {
  if (typeof provider !== "string" || provider.length === 0 || !isSupportedProvider(provider)) {
    throw new Error(
      `${label} '${formatRuntimeValue(provider)}' is not supported. Supported providers: ${SUPPORTED_PROVIDERS.join(", ")}`
    )
  }

  return provider
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`)
  }

  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function hasOwnKey(record: object, key: PropertyKey): boolean {
  const ownKey = typeof key === "number" ? String(key) : key
  return Reflect.ownKeys(record).includes(ownKey)
}

function requireOptionalObjectOptions<T>(
  options: T | undefined | null,
  operation: string
): T | undefined {
  if (options === undefined || options === null) {
    return undefined
  }

  if (!isRecord(options)) {
    throw new Error(`${operation} options must be an object`)
  }

  return options
}

function copyOwnStringOptions(
  options: Record<string, unknown>,
  excludedKeys: readonly string[] = []
): Record<string, unknown> {
  const excluded = new Set(excludedKeys)
  const snapshot: Record<string, unknown> = {}

  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(options))) {
    if (!excluded.has(key) && "value" in descriptor) {
      Object.defineProperty(snapshot, key, {
        value: descriptor.value,
        enumerable: true,
        configurable: true,
        writable: true
      })
    }
  }

  return snapshot
}

function getOwnDataProperty(record: object, key: PropertyKey): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key)
  return descriptor && "value" in descriptor ? descriptor.value : undefined
}

function requireAudioInput(audio: unknown): AudioInput {
  if (!isRecord(audio)) {
    throw new Error("Audio input must be an object")
  }

  const type = getOwnDataProperty(audio, "type")
  if (type === undefined) {
    throw new Error(`Audio input type must be one of: ${AUDIO_INPUT_TYPES.join(", ")}`)
  }

  switch (type) {
    case "url":
      {
        const url = getOwnDataProperty(audio, "url")
        if (typeof url !== "string" || url.trim().length === 0) {
          throw new Error("URL audio input requires a non-empty url")
        }
      }
      return audio as unknown as AudioInput
    case "file":
      if (
        getOwnDataProperty(audio, "file") === undefined ||
        getOwnDataProperty(audio, "file") === null
      ) {
        throw new Error("File audio input requires file")
      }
      return audio as unknown as AudioInput
    case "stream":
      if (
        getOwnDataProperty(audio, "stream") === undefined ||
        getOwnDataProperty(audio, "stream") === null
      ) {
        throw new Error("Stream audio input requires stream")
      }
      return audio as unknown as AudioInput
    default:
      throw new Error(`Audio input type must be one of: ${AUDIO_INPUT_TYPES.join(", ")}`)
  }
}

function requireStreamingCallbacks(
  callbacks: StreamingCallbacks | undefined | null
): StreamingCallbacks | undefined {
  if (callbacks === undefined || callbacks === null) {
    return undefined
  }

  if (!isRecord(callbacks)) {
    throw new Error("Streaming callbacks must be an object")
  }

  const callbackRecord = callbacks as Partial<Record<StreamingCallbackName, unknown>>
  const validCallbacks: Partial<StreamingCallbacks> = {}

  for (const name of STREAMING_CALLBACK_NAMES) {
    const callbackDescriptor = Object.getOwnPropertyDescriptor(callbackRecord, name)
    if (!callbackDescriptor || !("value" in callbackDescriptor)) {
      continue
    }

    const callback = callbackDescriptor.value
    if (callback !== undefined && typeof callback !== "function") {
      throw new Error(`Streaming callback '${name}' must be a function`)
    }

    if (callback !== undefined) {
      validCallbacks[name] = callback as never
    }
  }

  return validCallbacks as StreamingCallbacks
}

function findPropertyDescriptor(
  target: Record<PropertyKey, unknown>,
  key: PropertyKey
): PropertyDescriptor | undefined {
  let current: object | null = target

  while (current) {
    const descriptor = Object.getOwnPropertyDescriptor(current, key)
    if (descriptor) {
      return descriptor
    }

    current = Object.getPrototypeOf(current)
  }

  return undefined
}

function hasInvalidRequiredAdapterMethod(
  adapter: Record<PropertyKey, unknown>,
  method: RequiredAdapterMethod
): boolean {
  const descriptor = findPropertyDescriptor(adapter, method)
  return !descriptor || !("value" in descriptor) || typeof descriptor.value !== "function"
}

function hasInvalidOptionalAdapterMethod(adapter: Record<PropertyKey, unknown>): boolean {
  return OPTIONAL_ADAPTER_METHODS.some((method) => {
    const descriptor = findPropertyDescriptor(adapter, method)
    if (!descriptor) {
      return false
    }

    return (
      !("value" in descriptor) ||
      (descriptor.value !== undefined && typeof descriptor.value !== "function")
    )
  })
}

function getFunctionDataProperty(
  adapter: Record<PropertyKey, unknown>,
  method: RequiredAdapterMethod | OptionalAdapterMethod
): unknown {
  const descriptor = findPropertyDescriptor(adapter, method)
  return descriptor && "value" in descriptor && typeof descriptor.value === "function"
    ? descriptor.value
    : undefined
}

function snapshotAdapterMethods(
  adapter: Record<PropertyKey, unknown>
): AdapterMethodSnapshots | undefined {
  const transcribe = getFunctionDataProperty(adapter, "transcribe") as
    | AdapterMethodSnapshots["transcribe"]
    | undefined
  const getTranscript = getFunctionDataProperty(adapter, "getTranscript") as
    | AdapterMethodSnapshots["getTranscript"]
    | undefined

  if (!transcribe || !getTranscript) {
    return undefined
  }

  const snapshots: AdapterMethodSnapshots = {
    transcribe,
    getTranscript
  }
  const transcribeStream = getFunctionDataProperty(adapter, "transcribeStream") as
    | AdapterMethodSnapshots["transcribeStream"]
    | undefined
  const deleteTranscript = getFunctionDataProperty(adapter, "deleteTranscript") as
    | AdapterMethodSnapshots["deleteTranscript"]
    | undefined
  const listTranscripts = getFunctionDataProperty(adapter, "listTranscripts") as
    | AdapterMethodSnapshots["listTranscripts"]
    | undefined
  const getRawClient = getFunctionDataProperty(adapter, "getRawClient") as
    | AdapterMethodSnapshots["getRawClient"]
    | undefined

  if (transcribeStream) {
    snapshots.transcribeStream = transcribeStream
  }

  if (deleteTranscript) {
    snapshots.deleteTranscript = deleteTranscript
  }

  if (listTranscripts) {
    snapshots.listTranscripts = listTranscripts
  }

  if (getRawClient) {
    snapshots.getRawClient = getRawClient
  }

  return snapshots
}

function hasInvalidProviderCapabilities(capabilities: unknown): boolean {
  if (!isRecord(capabilities)) {
    return true
  }

  const capabilityRecord = capabilities as Partial<Record<CapabilityFlag, boolean>>
  const hasBooleanDataFlag = (flag: CapabilityFlag): boolean => {
    const descriptor = Object.getOwnPropertyDescriptor(capabilityRecord, flag)
    return Boolean(descriptor && "value" in descriptor && typeof descriptor.value === "boolean")
  }

  return (
    REQUIRED_CAPABILITY_FLAGS.some((flag) => !hasBooleanDataFlag(flag)) ||
    (hasOwnKey(capabilityRecord, "getAudioFile") && !hasBooleanDataFlag("getAudioFile"))
  )
}

function snapshotProviderCapabilities(capabilities: ProviderCapabilities): ProviderCapabilities {
  const capabilityRecord = capabilities as Partial<Record<CapabilityFlag, boolean>>
  const snapshot = {} as ProviderCapabilities

  for (const flag of REQUIRED_CAPABILITY_FLAGS) {
    snapshot[flag] = capabilityRecord[flag] as boolean
  }

  if (hasOwnKey(capabilityRecord, "getAudioFile")) {
    snapshot.getAudioFile = capabilityRecord.getAudioFile
  }

  return snapshot
}

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
  private adapters: Map<TranscriptionProvider, TranscriptionAdapter> = new Map()
  private capabilitySnapshots: Map<TranscriptionProvider, ProviderCapabilities> = new Map()
  private methodSnapshots: Map<TranscriptionProvider, AdapterMethodSnapshots> = new Map()
  private config: VoiceRouterConfig
  private roundRobinIndex = 0

  constructor(config: VoiceRouterConfig) {
    const providerMap = isRecord(config) ? getOwnDataProperty(config, "providers") : undefined
    const rawProviderConfigs: Record<PropertyKey, unknown> = isRecord(providerMap)
      ? (providerMap as Record<PropertyKey, unknown>)
      : {}
    const providerConfigs: Partial<Record<TranscriptionProvider, ProviderConfig>> = {}

    for (const providerKey of Reflect.ownKeys(rawProviderConfigs)) {
      if (typeof providerKey !== "string" || !isSupportedProvider(providerKey)) {
        throw new Error(
          `Unsupported provider configuration: '${formatRuntimeValue(providerKey)}'. Supported providers: ${SUPPORTED_PROVIDERS.join(", ")}`
        )
      }

      const provider = providerKey
      const providerConfig = getOwnDataProperty(rawProviderConfigs, providerKey)

      if (providerConfig == null) {
        continue
      }

      if (typeof providerConfig !== "object" || Array.isArray(providerConfig)) {
        throw new Error(`Provider configuration for '${provider}' must be an object`)
      }

      const providerConfigRecord = providerConfig as Record<string, unknown>
      const apiKeyDescriptor = Object.getOwnPropertyDescriptor(providerConfigRecord, "apiKey")
      const hasApiKey = Boolean(apiKeyDescriptor && "value" in apiKeyDescriptor)
      const apiKey = hasApiKey ? apiKeyDescriptor?.value : undefined

      if (!hasApiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
        throw new Error(`Provider configuration for '${provider}' requires a non-empty apiKey`)
      }

      const providerConfigSnapshot = copyOwnStringOptions(
        providerConfigRecord
      ) as unknown as ProviderConfig
      providerConfigSnapshot.apiKey = apiKey
      providerConfigs[provider] = providerConfigSnapshot
    }

    const configOptions: Partial<VoiceRouterConfig> = {}
    if (isRecord(config)) {
      const defaultProvider = getOwnDataProperty(config, "defaultProvider")
      if (defaultProvider !== undefined) {
        configOptions.defaultProvider = defaultProvider as TranscriptionProvider
      }

      const selectionStrategy = getOwnDataProperty(config, "selectionStrategy")
      if (selectionStrategy !== undefined) {
        configOptions.selectionStrategy =
          selectionStrategy as VoiceRouterConfig["selectionStrategy"]
      }
    }

    this.config = {
      selectionStrategy: "default",
      ...configOptions,
      providers: providerConfigs
    }

    const configuredProviders = Object.keys(providerConfigs) as TranscriptionProvider[]

    // Validate configuration
    if (configuredProviders.length === 0) {
      throw new Error("VoiceRouter requires at least one provider configuration")
    }

    const defaultProvider = this.config.defaultProvider as unknown

    if (
      this.config.selectionStrategy !== "explicit" &&
      this.config.selectionStrategy !== "default" &&
      this.config.selectionStrategy !== "round-robin"
    ) {
      throw new Error(
        `Unsupported selection strategy: ${formatRuntimeValue(this.config.selectionStrategy)}. ` +
          "Supported strategies: explicit, default, round-robin"
      )
    }

    if (defaultProvider !== undefined) {
      requireSupportedProvider(defaultProvider, "Default provider")
    }

    if (
      this.config.selectionStrategy === "default" &&
      this.config.defaultProvider &&
      !this.config.providers[this.config.defaultProvider]
    ) {
      throw new Error(
        `Default provider '${this.config.defaultProvider}' does not have a provider configuration`
      )
    }

    // If using default strategy, ensure a default provider is set
    if (this.config.selectionStrategy === "default" && !this.config.defaultProvider) {
      // Auto-select first configured provider as default
      this.config.defaultProvider = configuredProviders[0]
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
    const adapterRecord =
      adapter && typeof adapter === "object"
        ? (adapter as unknown as Record<PropertyKey, unknown>)
        : undefined
    const nameDescriptor = adapterRecord
      ? Object.getOwnPropertyDescriptor(adapterRecord, "name")
      : undefined
    const capabilitiesDescriptor = adapterRecord
      ? Object.getOwnPropertyDescriptor(adapterRecord, "capabilities")
      : undefined
    const adapterName =
      nameDescriptor && "value" in nameDescriptor ? nameDescriptor.value : undefined
    const adapterCapabilities =
      capabilitiesDescriptor && "value" in capabilitiesDescriptor
        ? capabilitiesDescriptor.value
        : undefined
    const initialize = getFunctionDataProperty(adapterRecord ?? {}, "initialize") as
      | ((config: ProviderConfig) => void)
      | undefined

    if (
      !adapterRecord ||
      typeof adapterName !== "string" ||
      hasInvalidProviderCapabilities(adapterCapabilities) ||
      REQUIRED_ADAPTER_METHODS.some((method) =>
        hasInvalidRequiredAdapterMethod(adapterRecord, method)
      ) ||
      hasInvalidOptionalAdapterMethod(adapterRecord)
    ) {
      throw new Error("Invalid transcription adapter")
    }

    const adapterProvider = requireSupportedProvider(adapterName, "Adapter provider")
    const capabilitySnapshot = snapshotProviderCapabilities(
      adapterCapabilities as ProviderCapabilities
    )

    // Initialize adapter with config
    const providerConfig = this.config.providers[adapterProvider]
    if (!providerConfig) {
      throw new Error(`No configuration found for provider: ${adapterProvider}`)
    }

    initialize?.call(adapter, providerConfig)
    const methodSnapshot = snapshotAdapterMethods(adapterRecord)
    if (!methodSnapshot) {
      throw new Error("Invalid transcription adapter")
    }

    this.adapters.set(adapterProvider, adapter)
    this.capabilitySnapshots.set(adapterProvider, capabilitySnapshot)
    this.methodSnapshots.set(adapterProvider, methodSnapshot)
  }

  /**
   * Get an adapter by provider name
   */
  getAdapter(provider: TranscriptionProvider): TranscriptionAdapter {
    const supportedProvider = requireSupportedProvider(provider)
    const adapter = this.adapters.get(supportedProvider)
    if (!adapter) {
      throw new Error(
        `Provider '${supportedProvider}' is not registered. Available providers: ${Array.from(this.adapters.keys()).join(", ")}`
      )
    }
    return adapter
  }

  private getRegisteredCapabilities(provider: TranscriptionProvider): ProviderCapabilities {
    const capabilities = this.capabilitySnapshots.get(provider)
    if (!capabilities) {
      throw new Error(
        `Provider '${provider}' is not registered. Available providers: ${Array.from(this.adapters.keys()).join(", ")}`
      )
    }

    return capabilities
  }

  private getRegisteredMethods(provider: TranscriptionProvider): AdapterMethodSnapshots {
    const methods = this.methodSnapshots.get(provider)
    if (!methods) {
      throw new Error(
        `Provider '${provider}' is not registered. Available providers: ${Array.from(this.adapters.keys()).join(", ")}`
      )
    }

    return methods
  }

  /**
   * Select provider based on configured strategy
   */
  private selectProvider(preferredProvider?: TranscriptionProvider | null): TranscriptionProvider {
    // If provider explicitly specified, use it
    if (preferredProvider !== undefined) {
      const provider = requireSupportedProvider(preferredProvider)
      if (!this.adapters.has(provider)) {
        throw new Error(
          `Provider '${provider}' is not registered. Available providers: ${Array.from(this.adapters.keys()).join(", ")}`
        )
      }
      return provider
    }

    // Apply selection strategy
    switch (this.config.selectionStrategy) {
      case "explicit":
        throw new Error(
          "Provider must be explicitly specified when using 'explicit' selection strategy"
        )

      case "round-robin": {
        const providers = Array.from(this.adapters.keys())
        if (providers.length === 0) {
          throw new Error("No providers are registered")
        }
        const provider = providers[this.roundRobinIndex % providers.length]
        this.roundRobinIndex++
        return provider
      }
      default:
        if (!this.config.defaultProvider) {
          throw new Error("No default provider configured")
        }
        return this.config.defaultProvider
    }
  }

  private splitProviderOptions(
    options: (Record<string, unknown> & { provider?: unknown }) | undefined | null,
    operation: string
  ): {
    provider?: TranscriptionProvider | null
    adapterOptions: Record<string, unknown>
  } {
    const validOptions = requireOptionalObjectOptions(options, operation)
    if (validOptions === undefined) {
      return { provider: undefined, adapterOptions: {} }
    }

    const provider = getOwnDataProperty(validOptions, "provider")
    const adapterOptions = copyOwnStringOptions(validOptions, ["provider"])

    return {
      provider: provider as TranscriptionProvider | null | undefined,
      adapterOptions
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
    options?: TranscribeOptions & { provider?: TranscriptionProvider }
  ): Promise<UnifiedTranscriptResponse> {
    const { provider, adapterOptions } = this.splitProviderOptions(
      options as (Record<string, unknown> & { provider?: unknown }) | undefined | null,
      "transcribe"
    )
    const validAudio = requireAudioInput(audio)
    const selectedProvider = this.selectProvider(provider)
    const adapter = this.getAdapter(selectedProvider)
    const methods = this.getRegisteredMethods(selectedProvider)

    return methods.transcribe.call(adapter, validAudio, adapterOptions as TranscribeOptions)
  }

  /**
   * Get transcription result by ID
   * Provider must be specified since IDs are provider-specific
   */
  async getTranscript(
    transcriptId: string,
    provider: TranscriptionProvider
  ): Promise<UnifiedTranscriptResponse> {
    const validTranscriptId = requireNonEmptyString(transcriptId, "Transcript ID")
    const supportedProvider = requireSupportedProvider(provider)
    const adapter = this.getAdapter(supportedProvider)
    const methods = this.getRegisteredMethods(supportedProvider)
    return methods.getTranscript.call(adapter, validTranscriptId)
  }

  /**
   * Stream audio for real-time transcription with Gladia
   *
   * @param options - Gladia-specific streaming options (type-safe from OpenAPI spec)
   * @param callbacks - Event callbacks for transcription results
   * @returns Promise that resolves with a StreamingSession
   *
   * @example Gladia streaming (type-safe!)
   * ```typescript
   * const session = await router.transcribeStream({
   *   provider: 'gladia',
   *   encoding: 'wav/pcm',  // ✅ Only Gladia encodings allowed
   *   sampleRate: 16000,    // ✅ Gladia OpenAPI sample-rate enum
   *   channels: 1
   * }, {
   *   onTranscript: (event) => console.log(event.text),
   *   onError: (error) => console.error(error)
   * });
   * ```
   */
  transcribeStream(
    options: GladiaProviderStreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession>

  /**
   * Stream audio for real-time transcription with Deepgram
   *
   * @param options - Deepgram-specific streaming options (type-safe from OpenAPI spec)
   * @param callbacks - Event callbacks for transcription results
   * @returns Promise that resolves with a StreamingSession
   *
   * @example Deepgram streaming (type-safe!)
   * ```typescript
   * const session = await router.transcribeStream({
   *   provider: 'deepgram',
   *   encoding: 'linear16',  // ✅ Only Deepgram encodings allowed
   *   sampleRate: 22050,     // ✅ Positive integer Hz pass-through
   *   language: 'en',
   *   diarization: true
   * }, {
   *   onTranscript: (event) => console.log(event.text)
   * });
   * ```
   */
  transcribeStream(
    options: DeepgramProviderStreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession>

  /**
   * Stream audio for real-time transcription with AssemblyAI
   *
   * @param options - AssemblyAI-specific streaming options (type-safe from OpenAPI spec)
   * @param callbacks - Event callbacks for transcription results
   * @returns Promise that resolves with a StreamingSession
   *
   * @example AssemblyAI streaming (type-safe!)
   * ```typescript
   * const session = await router.transcribeStream({
   *   provider: 'assemblyai',
   *   sampleRate: 22050  // ✅ Positive integer Hz pass-through
   * }, {
   *   onTranscript: (event) => console.log(event.text)
   * });
   * ```
   */
  transcribeStream(
    options: AssemblyAIProviderStreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession>

  /**
   * Stream audio for real-time transcription with Soniox
   *
   * @param options - Soniox-specific streaming options
   * @param callbacks - Event callbacks for transcription results
   * @returns Promise that resolves with a StreamingSession
   */
  transcribeStream(
    options: SonioxProviderStreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession>

  /**
   * Stream audio for real-time transcription with OpenAI Realtime
   *
   * @param options - Generic streaming options plus OpenAI-specific nested options
   * @param callbacks - Event callbacks for transcription results
   * @returns Promise that resolves with a StreamingSession
   */
  transcribeStream(
    options: OpenAIProviderStreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession>

  /**
   * Stream audio for real-time transcription with ElevenLabs
   *
   * @param options - Generic streaming options plus ElevenLabs-specific nested options
   * @param callbacks - Event callbacks for transcription results
   * @returns Promise that resolves with a StreamingSession
   */
  transcribeStream(
    options: ElevenLabsProviderStreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession>

  /**
   * Stream audio for real-time transcription with Speechmatics
   *
   * @param options - Generic streaming options plus Speechmatics-specific nested options
   * @param callbacks - Event callbacks for transcription results
   * @returns Promise that resolves with a StreamingSession
   */
  transcribeStream(
    options: SpeechmaticsProviderStreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession>

  /**
   * Stream audio for real-time transcription (uses default provider)
   *
   * @param options - Generic streaming options
   * @param callbacks - Event callbacks for transcription results
   * @returns Promise that resolves with a StreamingSession
   */
  transcribeStream(
    options?: DefaultStreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession>

  // Implementation
  async transcribeStream(
    options?: ProviderStreamingOptions | DefaultStreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession> {
    const { provider, adapterOptions } = this.splitProviderOptions(
      options as (Record<string, unknown> & { provider?: unknown }) | undefined | null,
      "transcribeStream"
    )
    const validCallbacks = requireStreamingCallbacks(callbacks)
    const selectedProvider = this.selectProvider(provider)
    const adapter = this.getAdapter(selectedProvider)
    const capabilities = this.getRegisteredCapabilities(selectedProvider)
    const methods = this.getRegisteredMethods(selectedProvider)

    // Check if adapter supports streaming
    if (!capabilities.streaming || !methods.transcribeStream) {
      throw new Error(`Provider '${selectedProvider}' does not support streaming transcription`)
    }

    // Cast to StreamingOptions since adapter will handle provider-specific conversions
    return methods.transcribeStream.call(
      adapter,
      adapterOptions as StreamingOptions,
      validCallbacks
    )
  }

  /**
   * Delete a transcription
   * Not all providers support this operation
   */
  async deleteTranscript(
    transcriptId: string,
    provider: TranscriptionProvider
  ): Promise<{ success: boolean }> {
    const validTranscriptId = requireNonEmptyString(transcriptId, "Transcript ID")
    const supportedProvider = requireSupportedProvider(provider)
    const adapter = this.getAdapter(supportedProvider)
    const capabilities = this.getRegisteredCapabilities(supportedProvider)
    const methods = this.getRegisteredMethods(supportedProvider)

    if (!capabilities.deleteTranscript || !methods.deleteTranscript) {
      throw new Error(`Provider '${provider}' does not support deleting transcripts`)
    }

    return methods.deleteTranscript.call(adapter, validTranscriptId)
  }

  /**
   * List recent transcriptions with filtering
   *
   * Supports date/time filtering, status filtering, and pagination.
   * Not all providers support this operation.
   *
   * @example Filter by date range
   * ```typescript
   * const { transcripts } = await router.listTranscripts('assemblyai', {
   *   afterDate: '2026-01-01',
   *   beforeDate: '2026-01-31',
   *   status: 'completed',
   *   limit: 50
   * })
   * ```
   */
  async listTranscripts(
    provider: TranscriptionProvider,
    options?: ListTranscriptsOptions
  ): Promise<{
    transcripts: UnifiedTranscriptResponse[]
    total?: number
    hasMore?: boolean
  }> {
    const validOptions = requireOptionalObjectOptions(options, "listTranscripts")
    const adapterOptions =
      validOptions === undefined
        ? undefined
        : copyOwnStringOptions(validOptions as Record<string, unknown>)
    const supportedProvider = requireSupportedProvider(provider)
    const adapter = this.getAdapter(supportedProvider)
    const capabilities = this.getRegisteredCapabilities(supportedProvider)
    const methods = this.getRegisteredMethods(supportedProvider)

    if (!capabilities.listTranscripts || !methods.listTranscripts) {
      throw new Error(`Provider '${provider}' does not support listing transcripts`)
    }

    return methods.listTranscripts.call(adapter, adapterOptions)
  }

  /**
   * Get capabilities for a specific provider
   */
  getProviderCapabilities(provider: TranscriptionProvider): ProviderCapabilities {
    const supportedProvider = requireSupportedProvider(provider)
    const capabilities = this.getRegisteredCapabilities(supportedProvider)
    return snapshotProviderCapabilities(capabilities)
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
    const supportedProvider = requireSupportedProvider(provider)
    const adapter = this.getAdapter(supportedProvider)
    const methods = this.getRegisteredMethods(supportedProvider)

    if (!methods.getRawClient) {
      throw new Error(`Provider '${provider}' does not expose a raw client`)
    }

    return methods.getRawClient.call(adapter)
  }
}

/**
 * Factory function to create a VoiceRouter with auto-registered adapters
 */
export function createVoiceRouter(
  config: VoiceRouterConfig,
  adapters?: TranscriptionAdapter[]
): VoiceRouter {
  const router = new VoiceRouter(config)

  if (adapters !== undefined && !Array.isArray(adapters)) {
    throw new Error("createVoiceRouter adapters must be an array")
  }

  // Register provided adapters
  if (adapters && adapters.length > 0) {
    for (const adapter of adapters) {
      router.registerAdapter(adapter)
    }
  }

  return router
}
