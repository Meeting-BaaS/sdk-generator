import { describe, expect, it, vi } from "vitest"
import type { ProviderConfig, TranscriptionAdapter } from "../../src/adapters/base-adapter"
import { AllProviders } from "../../src/provider-metadata"
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
} from "../../src/router/types"
import {
  createVoiceRouter,
  VoiceRouter,
  type VoiceRouterConfig
} from "../../src/router/voice-router"

const capabilities: ProviderCapabilities = {
  streaming: true,
  diarization: true,
  wordTimestamps: true,
  languageDetection: true,
  customVocabulary: true,
  summarization: true,
  sentimentAnalysis: true,
  entityDetection: true,
  piiRedaction: true,
  listTranscripts: true,
  deleteTranscript: true
}

class FakeAdapter implements TranscriptionAdapter {
  readonly capabilities: ProviderCapabilities
  config?: ProviderConfig
  transcribeCalls: Array<{ audio: AudioInput; options?: TranscribeOptions }> = []
  streamCalls: Array<{ options?: StreamingOptions; callbacks?: StreamingCallbacks }> = []
  getCalls: string[] = []
  deleteCalls: string[] = []
  listCalls: Array<ListTranscriptsOptions | undefined> = []

  constructor(
    readonly name: TranscriptionProvider,
    capabilityOverrides: Partial<ProviderCapabilities> = {}
  ) {
    this.capabilities = { ...capabilities, ...capabilityOverrides }
  }

  initialize(config: ProviderConfig): void {
    this.config = config
  }

  async transcribe(
    audio: AudioInput,
    options?: TranscribeOptions
  ): Promise<UnifiedTranscriptResponse> {
    this.transcribeCalls.push({ audio, options })
    return {
      success: true,
      provider: this.name,
      data: {
        id: `${this.name}-1`,
        status: "completed",
        text: `${this.name} transcript`
      }
    }
  }

  async getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse> {
    this.getCalls.push(transcriptId)
    return {
      success: true,
      provider: this.name,
      data: {
        id: transcriptId,
        status: "completed",
        text: "stored transcript"
      }
    }
  }

  async transcribeStream(
    options?: StreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession> {
    this.streamCalls.push({ options, callbacks })
    return {
      id: `${this.name}-stream`,
      provider: this.name,
      createdAt: new Date("2026-06-24T00:00:00.000Z"),
      sendAudio: vi.fn(async () => undefined),
      close: vi.fn(async () => undefined),
      getStatus: () => "open"
    }
  }

  async deleteTranscript(transcriptId: string): Promise<{ success: boolean }> {
    this.deleteCalls.push(transcriptId)
    return { success: true }
  }

  async listTranscripts(options?: ListTranscriptsOptions): Promise<{
    transcripts: UnifiedTranscriptResponse[]
    total?: number
    hasMore?: boolean
  }> {
    this.listCalls.push(options)
    return {
      transcripts: [
        {
          success: true,
          provider: this.name,
          data: {
            id: "listed-1",
            status: options?.status === "error" ? "error" : "completed"
          }
        }
      ],
      total: 1,
      hasMore: false
    }
  }

  getRawClient(): unknown {
    return { provider: this.name }
  }
}

class MinimalAdapter implements TranscriptionAdapter {
  readonly capabilities: ProviderCapabilities
  config?: ProviderConfig

  constructor(
    readonly name: TranscriptionProvider,
    capabilityOverrides: Partial<ProviderCapabilities> = {}
  ) {
    this.capabilities = { ...capabilities, ...capabilityOverrides }
  }

  initialize(config: ProviderConfig): void {
    this.config = config
  }

  async transcribe(
    _audio: AudioInput,
    _options?: TranscribeOptions
  ): Promise<UnifiedTranscriptResponse> {
    return {
      success: true,
      provider: this.name,
      data: {
        id: `${this.name}-minimal`,
        status: "completed"
      }
    }
  }

  async getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse> {
    return {
      success: true,
      provider: this.name,
      data: {
        id: transcriptId,
        status: "completed"
      }
    }
  }
}

function config(overrides: Partial<VoiceRouterConfig> = {}): VoiceRouterConfig {
  return {
    providers: {
      gladia: { apiKey: "gladia-key" },
      deepgram: { apiKey: "deepgram-key" }
    },
    ...overrides
  }
}

const audio: AudioInput = {
  type: "url",
  url: "https://example.com/audio.wav"
}

function nullPrototypeObject(): object {
  return Object.create(null)
}

function unformattableObject(): object {
  return {
    [Symbol.toPrimitive]() {
      throw new Error("cannot stringify")
    },
    get [Symbol.toStringTag]() {
      throw new Error("cannot inspect")
    }
  }
}

function nonEnumerableCapabilities(): ProviderCapabilities {
  const hiddenCapabilities = {} as ProviderCapabilities

  for (const [flag, value] of Object.entries(capabilities)) {
    Object.defineProperty(hiddenCapabilities, flag, {
      value,
      enumerable: false
    })
  }

  return hiddenCapabilities
}

describe("VoiceRouter", () => {
  it("accepts every provider advertised by public metadata", () => {
    for (const provider of AllProviders) {
      expect(
        () =>
          new VoiceRouter({
            providers: { [provider]: { apiKey: "secret" } }
          })
      ).not.toThrow()
    }
  })

  it("rejects empty provider configuration", () => {
    expect(() => new VoiceRouter({ providers: {} })).toThrow(
      "VoiceRouter requires at least one provider configuration"
    )
  })

  it("rejects missing provider maps at runtime", () => {
    expect(() => new VoiceRouter({} as unknown as VoiceRouterConfig)).toThrow(
      "VoiceRouter requires at least one provider configuration"
    )
    expect(() => new VoiceRouter({ providers: null } as unknown as VoiceRouterConfig)).toThrow(
      "VoiceRouter requires at least one provider configuration"
    )
  })

  it("rejects provider maps inherited from the config prototype", () => {
    expect(
      () =>
        new VoiceRouter(
          Object.create({
            providers: { gladia: { apiKey: "secret" } }
          }) as VoiceRouterConfig
        )
    ).toThrow("VoiceRouter requires at least one provider configuration")
  })

  it("does not read top-level provider map accessors", () => {
    const routerConfig = {} as VoiceRouterConfig
    Object.defineProperty(routerConfig, "providers", {
      enumerable: true,
      get() {
        throw new Error("providers getter called")
      }
    })

    expect(() => new VoiceRouter(routerConfig)).toThrow(
      "VoiceRouter requires at least one provider configuration"
    )
  })

  it("rejects non-record provider maps at runtime", () => {
    expect(() => new VoiceRouter({ providers: "gladia" } as unknown as VoiceRouterConfig)).toThrow(
      "VoiceRouter requires at least one provider configuration"
    )
    expect(
      () => new VoiceRouter({ providers: [{ apiKey: "secret" }] } as unknown as VoiceRouterConfig)
    ).toThrow("VoiceRouter requires at least one provider configuration")
  })

  it("rejects provider entries without config objects", () => {
    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: undefined } as unknown as VoiceRouterConfig["providers"]
        })
    ).toThrow("VoiceRouter requires at least one provider configuration")
    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: null } as unknown as VoiceRouterConfig["providers"]
        })
    ).toThrow("VoiceRouter requires at least one provider configuration")
  })

  it("does not read provider map entry accessors", () => {
    const providers = {} as VoiceRouterConfig["providers"]
    Object.defineProperty(providers, "gladia", {
      enumerable: true,
      get() {
        throw new Error("gladia provider getter called")
      }
    })

    expect(() => new VoiceRouter({ providers })).toThrow(
      "VoiceRouter requires at least one provider configuration"
    )
  })

  it("rejects unsupported provider keys at runtime", () => {
    expect(
      () =>
        new VoiceRouter({
          providers: { gladai: { apiKey: "secret" } } as unknown as VoiceRouterConfig["providers"]
        })
    ).toThrow("Unsupported provider configuration: 'gladai'")
    expect(
      () =>
        new VoiceRouter({
          providers: {
            gladai: { apiKey: "secret" },
            gladia: { apiKey: "gladia-key" }
          } as unknown as VoiceRouterConfig["providers"]
        })
    ).toThrow("Unsupported provider configuration: 'gladai'")
    expect(
      () =>
        new VoiceRouter({
          providers: {
            gladai: undefined,
            gladia: { apiKey: "gladia-key" }
          } as unknown as VoiceRouterConfig["providers"]
        })
    ).toThrow("Unsupported provider configuration: 'gladai'")
  })

  it("rejects unsupported non-enumerable provider keys at runtime", () => {
    const providers = {} as VoiceRouterConfig["providers"]
    Object.defineProperty(providers, "gladai", {
      value: { apiKey: "secret" },
      enumerable: false
    })

    expect(() => new VoiceRouter({ providers })).toThrow(
      "Unsupported provider configuration: 'gladai'"
    )
  })

  it("rejects symbol provider keys at runtime", () => {
    const providers = {
      gladia: { apiKey: "secret" },
      [Symbol("gladia")]: { apiKey: "symbol-secret" }
    } as unknown as VoiceRouterConfig["providers"]

    expect(() => new VoiceRouter({ providers })).toThrow(
      "Unsupported provider configuration: 'Symbol(gladia)'"
    )
  })

  it("rejects provider config values that are not objects", () => {
    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: "secret" } as unknown as VoiceRouterConfig["providers"]
        })
    ).toThrow("Provider configuration for 'gladia' must be an object")
    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: ["secret"] } as unknown as VoiceRouterConfig["providers"]
        })
    ).toThrow("Provider configuration for 'gladia' must be an object")
    expect(
      () =>
        new VoiceRouter({
          providers: {
            gladia: "secret",
            deepgram: { apiKey: "deepgram-key" }
          } as unknown as VoiceRouterConfig["providers"]
        })
    ).toThrow("Provider configuration for 'gladia' must be an object")
  })

  it("rejects provider config objects without non-empty api keys", () => {
    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: {} } as unknown as VoiceRouterConfig["providers"]
        })
    ).toThrow("Provider configuration for 'gladia' requires a non-empty apiKey")
    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: { apiKey: "" } }
        })
    ).toThrow("Provider configuration for 'gladia' requires a non-empty apiKey")
    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: { apiKey: "   " } }
        })
    ).toThrow("Provider configuration for 'gladia' requires a non-empty apiKey")
    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: { apiKey: 123 } } as unknown as VoiceRouterConfig["providers"]
        })
    ).toThrow("Provider configuration for 'gladia' requires a non-empty apiKey")
  })

  it("rejects provider config objects whose api key is inherited", () => {
    const providerConfig = Object.create({ apiKey: "secret" }) as ProviderConfig

    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: providerConfig }
        })
    ).toThrow("Provider configuration for 'gladia' requires a non-empty apiKey")
  })

  it("does not read own provider config api key accessors", () => {
    const providerConfig = {} as ProviderConfig
    Object.defineProperty(providerConfig, "apiKey", {
      enumerable: true,
      get() {
        throw new Error("own apiKey getter called")
      }
    })

    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: providerConfig }
        })
    ).toThrow("Provider configuration for 'gladia' requires a non-empty apiKey")
  })

  it("does not read inherited provider config api key getters", () => {
    const providerConfig = Object.create({
      get apiKey() {
        throw new Error("inherited apiKey getter called")
      }
    }) as ProviderConfig

    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: providerConfig }
        })
    ).toThrow("Provider configuration for 'gladia' requires a non-empty apiKey")
  })

  it("does not pass inherited provider config options to adapters", () => {
    const providerConfig = Object.assign(Object.create({ baseUrl: "https://inherited.example" }), {
      apiKey: "secret"
    }) as ProviderConfig
    const gladia = new FakeAdapter("gladia")

    createVoiceRouter({ providers: { gladia: providerConfig } }, [gladia])

    expect(gladia.config?.apiKey).toBe("secret")
    expect(gladia.config?.baseUrl).toBeUndefined()
  })

  it("passes non-enumerable own api keys to adapters", () => {
    const providerConfig = {} as ProviderConfig
    Object.defineProperty(providerConfig, "apiKey", {
      value: "secret",
      enumerable: false
    })
    const gladia = new FakeAdapter("gladia")

    createVoiceRouter({ providers: { gladia: providerConfig } }, [gladia])

    expect(gladia.config).toEqual({ apiKey: "secret" })
  })

  it("passes non-enumerable own provider config options to adapters", () => {
    const providerConfig = { apiKey: "secret" } as ProviderConfig
    Object.defineProperty(providerConfig, "baseUrl", {
      value: "https://api.example.test",
      enumerable: false
    })
    const gladia = new FakeAdapter("gladia")

    createVoiceRouter({ providers: { gladia: providerConfig } }, [gladia])

    expect(gladia.config).toEqual({
      apiKey: "secret",
      baseUrl: "https://api.example.test"
    })
  })

  it("does not let provider config __proto__ fields pollute adapter config snapshots", () => {
    const providerConfig = { apiKey: "secret" } as ProviderConfig & Record<string, unknown>
    Object.defineProperty(providerConfig, "__proto__", {
      value: { baseUrl: "https://polluted.example" },
      enumerable: true
    })
    const gladia = new FakeAdapter("gladia")

    createVoiceRouter({ providers: { gladia: providerConfig } }, [gladia])

    expect(Object.getPrototypeOf(gladia.config)).toBe(Object.prototype)
    expect(gladia.config?.baseUrl).toBeUndefined()
    expect(Object.hasOwn(gladia.config as object, "__proto__")).toBe(true)
  })

  it("honors non-enumerable own provider config entries", () => {
    const providers = {} as VoiceRouterConfig["providers"]
    Object.defineProperty(providers, "gladia", {
      value: { apiKey: "secret" },
      enumerable: false
    })
    const gladia = new FakeAdapter("gladia")

    createVoiceRouter({ providers }, [gladia])

    expect(gladia.config).toEqual({ apiKey: "secret" })
    expect(gladia.transcribeCalls).toHaveLength(0)
  })

  it("does not read top-level defaultProvider or selectionStrategy accessors", async () => {
    const gladia = new FakeAdapter("gladia")
    const routerConfig = {
      providers: { gladia: { apiKey: "secret" } }
    } as VoiceRouterConfig
    Object.defineProperty(routerConfig, "defaultProvider", {
      enumerable: true,
      get() {
        throw new Error("defaultProvider getter called")
      }
    })
    Object.defineProperty(routerConfig, "selectionStrategy", {
      enumerable: true,
      get() {
        throw new Error("selectionStrategy getter called")
      }
    })
    const router = createVoiceRouter(routerConfig, [gladia])

    await expect(router.transcribe(audio)).resolves.toMatchObject({ provider: "gladia" })
    expect(gladia.transcribeCalls).toHaveLength(1)
  })

  it("rejects unsupported selection strategies at runtime", () => {
    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: { apiKey: "secret" } },
          selectionStrategy: "fastest" as unknown as VoiceRouterConfig["selectionStrategy"]
        })
    ).toThrow(
      "Unsupported selection strategy: fastest. Supported strategies: explicit, default, round-robin"
    )
    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: { apiKey: "secret" } },
          selectionStrategy: Symbol(
            "round-robin"
          ) as unknown as VoiceRouterConfig["selectionStrategy"]
        })
    ).toThrow(
      "Unsupported selection strategy: Symbol(round-robin). Supported strategies: explicit, default, round-robin"
    )
    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: { apiKey: "secret" } },
          selectionStrategy:
            nullPrototypeObject() as unknown as VoiceRouterConfig["selectionStrategy"]
        })
    ).toThrow(
      "Unsupported selection strategy: [object Object]. Supported strategies: explicit, default, round-robin"
    )
  })

  it("rejects unformattable runtime config values with explicit validation errors", () => {
    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: { apiKey: "secret" } },
          selectionStrategy:
            unformattableObject() as unknown as VoiceRouterConfig["selectionStrategy"]
        })
    ).toThrow(
      "Unsupported selection strategy: <unprintable value>. Supported strategies: explicit, default, round-robin"
    )
    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: { apiKey: "secret" } },
          defaultProvider: unformattableObject() as unknown as TranscriptionProvider
        })
    ).toThrow("Default provider '<unprintable value>' is not supported")
  })

  it("rejects a default provider without matching provider config", () => {
    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: { apiKey: "secret" } },
          defaultProvider: "deepgram"
        })
    ).toThrow("Default provider 'deepgram' does not have a provider configuration")
  })

  it("rejects invalid default provider values at runtime", () => {
    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: { apiKey: "secret" } },
          defaultProvider: "" as unknown as TranscriptionProvider
        })
    ).toThrow("Default provider '' is not supported")
    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: { apiKey: "secret" } },
          defaultProvider: null as unknown as TranscriptionProvider
        })
    ).toThrow("Default provider 'null' is not supported")
    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: { apiKey: "secret" } },
          defaultProvider: 123 as unknown as TranscriptionProvider
        })
    ).toThrow("Default provider '123' is not supported")
    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: { apiKey: "secret" } },
          defaultProvider: Symbol("gladia") as unknown as TranscriptionProvider
        })
    ).toThrow("Default provider 'Symbol(gladia)' is not supported")
    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: { apiKey: "secret" } },
          defaultProvider: nullPrototypeObject() as unknown as TranscriptionProvider
        })
    ).toThrow("Default provider '[object Object]' is not supported")
    expect(
      () =>
        new VoiceRouter({
          providers: { gladia: { apiKey: "secret" } },
          defaultProvider: "gladai" as unknown as TranscriptionProvider
        })
    ).toThrow("Default provider 'gladai' is not supported")
  })

  it("initializes registered adapters with provider config", () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])

    expect(gladia.config).toEqual({ apiKey: "secret" })
    expect(router.getRegisteredProviders()).toEqual(["gladia"])
  })

  it("rejects non-array adapter lists in the factory", () => {
    const gladia = new FakeAdapter("gladia")

    expect(() =>
      createVoiceRouter(
        { providers: { gladia: { apiKey: "secret" } } },
        gladia as unknown as TranscriptionAdapter[]
      )
    ).toThrow("createVoiceRouter adapters must be an array")
  })

  it("rejects invalid adapters at runtime", () => {
    const router = new VoiceRouter({ providers: { gladia: { apiKey: "secret" } } })

    expect(() => router.registerAdapter(null as unknown as TranscriptionAdapter)).toThrow(
      "Invalid transcription adapter"
    )
    expect(() =>
      router.registerAdapter({ name: "gladia" } as unknown as TranscriptionAdapter)
    ).toThrow("Invalid transcription adapter")
  })

  it("rejects adapters with invalid capability shapes at runtime", () => {
    const capabilityCases: unknown[] = [
      [],
      { ...capabilities, streaming: "yes" },
      { ...capabilities, getAudioFile: "yes" }
    ]
    const missingFlag = { ...capabilities } as Record<string, unknown>
    delete missingFlag.streaming
    capabilityCases.push(missingFlag)

    for (const adapterCapabilities of capabilityCases) {
      const router = new VoiceRouter({ providers: { gladia: { apiKey: "secret" } } })
      const adapter = {
        name: "gladia",
        capabilities: adapterCapabilities,
        initialize: vi.fn(),
        transcribe: vi.fn(),
        getTranscript: vi.fn()
      } as unknown as TranscriptionAdapter

      expect(() => router.registerAdapter(adapter)).toThrow("Invalid transcription adapter")
    }
  })

  it("rejects adapters whose capability flags are inherited", () => {
    const router = new VoiceRouter({ providers: { gladia: { apiKey: "secret" } } })
    const adapter = {
      name: "gladia",
      capabilities: Object.create(capabilities),
      initialize: vi.fn(),
      transcribe: vi.fn(),
      getTranscript: vi.fn()
    } as unknown as TranscriptionAdapter

    expect(() => router.registerAdapter(adapter)).toThrow("Invalid transcription adapter")
  })

  it("does not read adapter capability getters during registration", () => {
    const router = new VoiceRouter({ providers: { gladia: { apiKey: "secret" } } })
    const adapterCapabilities = { ...capabilities }
    Object.defineProperty(adapterCapabilities, "streaming", {
      enumerable: true,
      get() {
        throw new Error("streaming getter called")
      }
    })
    const adapter = {
      name: "gladia",
      capabilities: adapterCapabilities,
      initialize: vi.fn(),
      transcribe: vi.fn(),
      getTranscript: vi.fn()
    } as unknown as TranscriptionAdapter

    expect(() => router.registerAdapter(adapter)).toThrow("Invalid transcription adapter")
  })

  it("does not read adapter identity or capabilities accessors during registration", () => {
    const router = new VoiceRouter({ providers: { gladia: { apiKey: "secret" } } })
    const nameAccessorAdapter = {
      capabilities,
      initialize: vi.fn(),
      transcribe: vi.fn(),
      getTranscript: vi.fn()
    } as unknown as TranscriptionAdapter
    Object.defineProperty(nameAccessorAdapter, "name", {
      enumerable: true,
      get() {
        throw new Error("name getter called")
      }
    })
    const capabilitiesAccessorAdapter = {
      name: "gladia",
      initialize: vi.fn(),
      transcribe: vi.fn(),
      getTranscript: vi.fn()
    } as unknown as TranscriptionAdapter
    Object.defineProperty(capabilitiesAccessorAdapter, "capabilities", {
      enumerable: true,
      get() {
        throw new Error("capabilities getter called")
      }
    })

    expect(() => router.registerAdapter(nameAccessorAdapter)).toThrow(
      "Invalid transcription adapter"
    )
    expect(() => router.registerAdapter(capabilitiesAccessorAdapter)).toThrow(
      "Invalid transcription adapter"
    )
  })

  it("rejects adapters whose required data properties are inherited", () => {
    const router = new VoiceRouter({ providers: { gladia: { apiKey: "secret" } } })
    const adapter = Object.assign(Object.create({ name: "gladia", capabilities }), {
      initialize: vi.fn(),
      transcribe: vi.fn(),
      getTranscript: vi.fn()
    }) as unknown as TranscriptionAdapter

    expect(() => router.registerAdapter(adapter)).toThrow("Invalid transcription adapter")
  })

  it("rejects adapters with invalid optional method shapes at runtime", () => {
    for (const method of [
      "transcribeStream",
      "deleteTranscript",
      "listTranscripts",
      "getRawClient"
    ] as const) {
      const router = new VoiceRouter({ providers: { gladia: { apiKey: "secret" } } })
      const adapter = {
        name: "gladia",
        capabilities,
        initialize: vi.fn(),
        transcribe: vi.fn(),
        getTranscript: vi.fn(),
        [method]: true
      } as unknown as TranscriptionAdapter

      expect(() => router.registerAdapter(adapter)).toThrow("Invalid transcription adapter")
    }
  })

  it("does not read adapter method accessors during registration", () => {
    for (const method of [
      "initialize",
      "transcribe",
      "getTranscript",
      "transcribeStream",
      "deleteTranscript",
      "listTranscripts",
      "getRawClient"
    ] as const) {
      const router = new VoiceRouter({ providers: { gladia: { apiKey: "secret" } } })
      const adapter = {
        name: "gladia",
        capabilities,
        initialize: vi.fn(),
        transcribe: vi.fn(),
        getTranscript: vi.fn()
      } as unknown as TranscriptionAdapter
      Object.defineProperty(adapter, method, {
        configurable: true,
        enumerable: true,
        get() {
          throw new Error(`${method} getter called`)
        }
      })

      expect(() => router.registerAdapter(adapter)).toThrow("Invalid transcription adapter")
    }
  })

  it("rejects adapters for unsupported providers before config lookup", () => {
    const router = new VoiceRouter({ providers: { gladia: { apiKey: "secret" } } })

    expect(() =>
      router.registerAdapter(new FakeAdapter("gladai" as unknown as TranscriptionProvider))
    ).toThrow("Adapter provider 'gladai' is not supported")
  })

  it("rejects adapter registration without matching provider config", () => {
    const router = new VoiceRouter({ providers: { gladia: { apiKey: "secret" } } })

    expect(() => router.registerAdapter(new FakeAdapter("deepgram"))).toThrow(
      "No configuration found for provider: deepgram"
    )
  })

  it("overwrites duplicate adapter registration for the same provider", async () => {
    const first = new FakeAdapter("gladia")
    const second = new FakeAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [first])

    router.registerAdapter(second)

    await expect(router.transcribe(audio)).resolves.toMatchObject({ provider: "gladia" })
    expect(first.transcribeCalls).toHaveLength(0)
    expect(second.transcribeCalls).toHaveLength(1)
    expect(router.getRegisteredProviders()).toEqual(["gladia"])
  })

  it("uses the first configured provider as default when default strategy has no defaultProvider", async () => {
    const gladia = new FakeAdapter("gladia")
    const deepgram = new FakeAdapter("deepgram")
    const router = createVoiceRouter(config(), [gladia, deepgram])

    const result = await router.transcribe(audio, { provider: undefined })

    expect(result.provider).toBe("gladia")
    expect(gladia.transcribeCalls).toHaveLength(1)
    expect(deepgram.transcribeCalls).toHaveLength(0)
  })

  it("uses default selection when selectionStrategy is explicitly undefined", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter(
      {
        providers: { gladia: { apiKey: "secret" } },
        selectionStrategy: undefined
      },
      [gladia]
    )

    await expect(router.transcribe(audio)).resolves.toMatchObject({ provider: "gladia" })
    expect(gladia.transcribeCalls).toHaveLength(1)
  })

  it("honors non-enumerable own selectionStrategy values", async () => {
    const gladia = new FakeAdapter("gladia")
    const routerConfig = {
      providers: { gladia: { apiKey: "secret" } }
    } as VoiceRouterConfig
    Object.defineProperty(routerConfig, "selectionStrategy", {
      value: "explicit",
      enumerable: false
    })
    const router = createVoiceRouter(routerConfig, [gladia])

    await expect(router.transcribe(audio)).rejects.toThrow(
      "Provider must be explicitly specified when using 'explicit' selection strategy"
    )
    expect(gladia.transcribeCalls).toHaveLength(0)
  })

  it("honors non-enumerable own defaultProvider values", async () => {
    const gladia = new FakeAdapter("gladia")
    const deepgram = new FakeAdapter("deepgram")
    const routerConfig = {
      providers: {
        gladia: { apiKey: "gladia-key" },
        deepgram: { apiKey: "deepgram-key" }
      }
    } as VoiceRouterConfig
    Object.defineProperty(routerConfig, "defaultProvider", {
      value: "deepgram",
      enumerable: false
    })
    const router = createVoiceRouter(routerConfig, [gladia, deepgram])

    await expect(router.transcribe(audio)).resolves.toMatchObject({ provider: "deepgram" })
    expect(gladia.transcribeCalls).toHaveLength(0)
    expect(deepgram.transcribeCalls).toHaveLength(1)
  })

  it("uses the first provider with config as default when earlier entries are empty", async () => {
    const deepgram = new FakeAdapter("deepgram")
    const router = createVoiceRouter(
      {
        providers: {
          gladia: undefined,
          deepgram: { apiKey: "deepgram-key" }
        } as unknown as VoiceRouterConfig["providers"]
      },
      [deepgram]
    )

    const result = await router.transcribe(audio)

    expect(result.provider).toBe("deepgram")
    expect(deepgram.transcribeCalls).toHaveLength(1)
  })

  it("removes router-only provider option before calling the adapter", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter(config(), [gladia])

    await router.transcribe(audio, { provider: "gladia", diarization: true })

    expect(gladia.transcribeCalls[0]?.options).toEqual({ diarization: true })
  })

  it("passes non-enumerable own transcribe options to adapters", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter(config(), [gladia])
    const options = { provider: "gladia" } as TranscribeOptions & {
      provider?: TranscriptionProvider
    }
    Object.defineProperty(options, "language", {
      value: "en",
      enumerable: false
    })

    await router.transcribe(audio, options)

    expect(gladia.transcribeCalls[0]?.options).toEqual({ language: "en" })
  })

  it("does not let transcribe option __proto__ fields pollute adapter options", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter(config(), [gladia])
    const options = { provider: "gladia" } as TranscribeOptions & {
      provider?: TranscriptionProvider
    }
    Object.defineProperty(options, "__proto__", {
      value: { diarization: true },
      enumerable: true
    })

    await router.transcribe(audio, options)

    const adapterOptions = gladia.transcribeCalls[0]?.options as Record<string, unknown>
    expect(Object.getPrototypeOf(adapterOptions)).toBe(Object.prototype)
    expect(adapterOptions.diarization).toBeUndefined()
    expect(Object.hasOwn(adapterOptions, "__proto__")).toBe(true)
  })

  it("does not read own transcribe option accessors", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])
    const options = {} as TranscribeOptions & {
      provider?: TranscriptionProvider
    }
    Object.defineProperty(options, "provider", {
      enumerable: true,
      get() {
        throw new Error("provider getter called")
      }
    })
    Object.defineProperty(options, "language", {
      enumerable: true,
      get() {
        throw new Error("language getter called")
      }
    })

    await expect(router.transcribe(audio, options)).resolves.toMatchObject({ provider: "gladia" })
    expect(gladia.transcribeCalls[0]?.options).toEqual({})
  })

  it("does not use inherited provider options for batch provider selection", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter(
      config({ providers: { gladia: { apiKey: "secret" } }, selectionStrategy: "explicit" }),
      [gladia]
    )

    await expect(
      router.transcribe(
        audio,
        Object.create({ provider: "gladia" }) as TranscribeOptions & {
          provider?: TranscriptionProvider
        }
      )
    ).rejects.toThrow(
      "Provider must be explicitly specified when using 'explicit' selection strategy"
    )
    expect(gladia.transcribeCalls).toHaveLength(0)
  })

  it("rejects invalid transcribe options at runtime", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])

    await expect(
      router.transcribe(
        audio,
        "bad" as unknown as TranscribeOptions & { provider?: TranscriptionProvider }
      )
    ).rejects.toThrow("transcribe options must be an object")
    await expect(
      router.transcribe(
        audio,
        [] as unknown as TranscribeOptions & { provider?: TranscriptionProvider }
      )
    ).rejects.toThrow("transcribe options must be an object")
    expect(gladia.transcribeCalls).toHaveLength(0)
  })

  it("rejects invalid audio inputs before adapter calls or provider selection", async () => {
    const gladia = new FakeAdapter("gladia")
    const deepgram = new FakeAdapter("deepgram")
    const router = createVoiceRouter(config({ selectionStrategy: "round-robin" }), [
      gladia,
      deepgram
    ])

    await expect(router.transcribe(null as unknown as AudioInput)).rejects.toThrow(
      "Audio input must be an object"
    )
    await expect(router.transcribe([] as unknown as AudioInput)).rejects.toThrow(
      "Audio input must be an object"
    )
    await expect(router.transcribe({} as unknown as AudioInput)).rejects.toThrow(
      "Audio input type must be one of: url, file, stream"
    )
    await expect(
      router.transcribe({ type: "url", url: "   " } as unknown as AudioInput)
    ).rejects.toThrow("URL audio input requires a non-empty url")
    await expect(router.transcribe({ type: "file" } as unknown as AudioInput)).rejects.toThrow(
      "File audio input requires file"
    )
    await expect(router.transcribe({ type: "stream" } as unknown as AudioInput)).rejects.toThrow(
      "Stream audio input requires stream"
    )

    expect(gladia.transcribeCalls).toHaveLength(0)
    expect(deepgram.transcribeCalls).toHaveLength(0)
    await expect(router.transcribe(audio)).resolves.toMatchObject({ provider: "gladia" })
  })

  it("rejects audio inputs whose required fields are inherited", async () => {
    const gladia = new FakeAdapter("gladia")
    const deepgram = new FakeAdapter("deepgram")
    const router = createVoiceRouter(config({ selectionStrategy: "round-robin" }), [
      gladia,
      deepgram
    ])

    await expect(
      router.transcribe(Object.create({ type: "url", url: "https://example.com/audio.wav" }))
    ).rejects.toThrow("Audio input type must be one of: url, file, stream")
    await expect(
      router.transcribe(
        Object.assign(Object.create({ url: "https://example.com/audio.wav" }), {
          type: "url"
        }) as AudioInput
      )
    ).rejects.toThrow("URL audio input requires a non-empty url")
    await expect(
      router.transcribe(
        Object.assign(Object.create({ file: Buffer.from("audio") }), { type: "file" })
      )
    ).rejects.toThrow("File audio input requires file")
    await expect(
      router.transcribe(Object.assign(Object.create({ stream: {} }), { type: "stream" }))
    ).rejects.toThrow("Stream audio input requires stream")

    expect(gladia.transcribeCalls).toHaveLength(0)
    expect(deepgram.transcribeCalls).toHaveLength(0)
    await expect(router.transcribe(audio)).resolves.toMatchObject({ provider: "gladia" })
  })

  it("does not read audio input accessors before adapter calls or provider selection", async () => {
    const gladia = new FakeAdapter("gladia")
    const deepgram = new FakeAdapter("deepgram")
    const router = createVoiceRouter(config({ selectionStrategy: "round-robin" }), [
      gladia,
      deepgram
    ])
    const audioWithTypeAccessor = {} as AudioInput
    Object.defineProperty(audioWithTypeAccessor, "type", {
      enumerable: true,
      get() {
        throw new Error("type getter called")
      }
    })
    const audioWithUrlAccessor = { type: "url" } as unknown as AudioInput
    Object.defineProperty(audioWithUrlAccessor, "url", {
      enumerable: true,
      get() {
        throw new Error("url getter called")
      }
    })
    const audioWithFileAccessor = { type: "file" } as unknown as AudioInput
    Object.defineProperty(audioWithFileAccessor, "file", {
      enumerable: true,
      get() {
        throw new Error("file getter called")
      }
    })
    const audioWithStreamAccessor = { type: "stream" } as unknown as AudioInput
    Object.defineProperty(audioWithStreamAccessor, "stream", {
      enumerable: true,
      get() {
        throw new Error("stream getter called")
      }
    })

    await expect(router.transcribe(audioWithTypeAccessor)).rejects.toThrow(
      "Audio input type must be one of: url, file, stream"
    )
    await expect(router.transcribe(audioWithUrlAccessor)).rejects.toThrow(
      "URL audio input requires a non-empty url"
    )
    await expect(router.transcribe(audioWithFileAccessor)).rejects.toThrow(
      "File audio input requires file"
    )
    await expect(router.transcribe(audioWithStreamAccessor)).rejects.toThrow(
      "Stream audio input requires stream"
    )

    expect(gladia.transcribeCalls).toHaveLength(0)
    expect(deepgram.transcribeCalls).toHaveLength(0)
    await expect(router.transcribe(audio)).resolves.toMatchObject({ provider: "gladia" })
  })

  it("requires explicit provider when selectionStrategy is explicit", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter(
      config({ providers: { gladia: { apiKey: "secret" } }, selectionStrategy: "explicit" }),
      [gladia]
    )

    await expect(router.transcribe(audio)).rejects.toThrow(
      "Provider must be explicitly specified when using 'explicit' selection strategy"
    )
    await expect(router.transcribe(audio, { provider: "gladia" })).resolves.toMatchObject({
      provider: "gladia",
      success: true
    })
  })

  it("round-robins across registered providers", async () => {
    const gladia = new FakeAdapter("gladia")
    const deepgram = new FakeAdapter("deepgram")
    const router = createVoiceRouter(config({ selectionStrategy: "round-robin" }), [
      gladia,
      deepgram
    ])

    await expect(router.transcribe(audio)).resolves.toMatchObject({ provider: "gladia" })
    await expect(router.transcribe(audio)).resolves.toMatchObject({ provider: "deepgram" })
    await expect(router.transcribe(audio)).resolves.toMatchObject({ provider: "gladia" })
  })

  it("fails clearly when round-robin has no registered adapters", async () => {
    const router = new VoiceRouter(
      config({
        providers: { gladia: { apiKey: "secret" } },
        selectionStrategy: "round-robin"
      })
    )

    await expect(router.transcribe(audio)).rejects.toThrow("No providers are registered")
  })

  it("rejects explicit calls to unregistered providers", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])

    await expect(router.transcribe(audio, { provider: "deepgram" })).rejects.toThrow(
      "Provider 'deepgram' is not registered"
    )
    await expect(router.getTranscript("tx-1", "deepgram")).rejects.toThrow(
      "Provider 'deepgram' is not registered"
    )
  })

  it("rejects invalid explicit provider values before adapter lookup", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])

    await expect(
      router.transcribe(audio, {
        provider: "" as unknown as TranscriptionProvider
      })
    ).rejects.toThrow("Provider '' is not supported")
    await expect(
      router.transcribe(audio, {
        provider: null as unknown as TranscriptionProvider
      })
    ).rejects.toThrow("Provider 'null' is not supported")
    await expect(
      router.transcribe(audio, {
        provider: Symbol("gladia") as unknown as TranscriptionProvider
      })
    ).rejects.toThrow("Provider 'Symbol(gladia)' is not supported")
    await expect(
      router.transcribe(audio, {
        provider: nullPrototypeObject() as unknown as TranscriptionProvider
      })
    ).rejects.toThrow("Provider '[object Object]' is not supported")
    await expect(
      router.transcribe(audio, {
        provider: "gladai" as unknown as TranscriptionProvider
      })
    ).rejects.toThrow("Provider 'gladai' is not supported")
    expect(gladia.transcribeCalls).toHaveLength(0)
  })

  it("rejects invalid direct provider arguments before adapter lookup", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])

    expect(() => router.getAdapter("gladai" as unknown as TranscriptionProvider)).toThrow(
      "Provider 'gladai' is not supported"
    )
    await expect(
      router.getTranscript("tx-1", null as unknown as TranscriptionProvider)
    ).rejects.toThrow("Provider 'null' is not supported")
    await expect(
      router.deleteTranscript("tx-1", "" as unknown as TranscriptionProvider)
    ).rejects.toThrow("Provider '' is not supported")
    await expect(router.listTranscripts(123 as unknown as TranscriptionProvider)).rejects.toThrow(
      "Provider '123' is not supported"
    )
    expect(() => router.getAdapter(Symbol("gladia") as unknown as TranscriptionProvider)).toThrow(
      "Provider 'Symbol(gladia)' is not supported"
    )
    expect(() =>
      router.getAdapter(nullPrototypeObject() as unknown as TranscriptionProvider)
    ).toThrow("Provider '[object Object]' is not supported")
    expect(() =>
      router.getProviderCapabilities("gladai" as unknown as TranscriptionProvider)
    ).toThrow("Provider 'gladai' is not supported")
    expect(() => router.getRawProviderClient("gladai" as unknown as TranscriptionProvider)).toThrow(
      "Provider 'gladai' is not supported"
    )
    expect(gladia.deleteCalls).toEqual([])
    expect(gladia.listCalls).toEqual([])
  })

  it("rejects invalid transcript IDs before adapter calls", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])

    await expect(router.getTranscript("", "gladia")).rejects.toThrow(
      "Transcript ID must be a non-empty string"
    )
    await expect(router.getTranscript("   ", "gladia")).rejects.toThrow(
      "Transcript ID must be a non-empty string"
    )
    await expect(router.getTranscript(null as unknown as string, "gladia")).rejects.toThrow(
      "Transcript ID must be a non-empty string"
    )
    await expect(router.deleteTranscript(123 as unknown as string, "gladia")).rejects.toThrow(
      "Transcript ID must be a non-empty string"
    )
    expect(gladia.getCalls).toEqual([])
    expect(gladia.deleteCalls).toEqual([])
  })

  it("rejects invalid list transcript options before adapter calls", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])

    await expect(
      router.listTranscripts("gladia", "bad" as unknown as ListTranscriptsOptions)
    ).rejects.toThrow("listTranscripts options must be an object")
    await expect(
      router.listTranscripts("gladia", [] as unknown as ListTranscriptsOptions)
    ).rejects.toThrow("listTranscripts options must be an object")
    expect(gladia.listCalls).toEqual([])
  })

  it("does not pass inherited list transcript options to adapters", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])

    const result = await router.listTranscripts(
      "gladia",
      Object.create({ status: "error" }) as ListTranscriptsOptions
    )

    expect(result.transcripts[0]?.data.status).toBe("completed")
    expect(gladia.listCalls).toHaveLength(1)
    expect(gladia.listCalls[0]?.status).toBeUndefined()
  })

  it("passes non-enumerable own list transcript options to adapters", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])
    const options = {} as ListTranscriptsOptions
    Object.defineProperty(options, "status", {
      value: "error",
      enumerable: false
    })

    const result = await router.listTranscripts("gladia", options)

    expect(result.transcripts[0]?.data.status).toBe("error")
    expect(gladia.listCalls).toHaveLength(1)
    expect(gladia.listCalls[0]).toEqual({ status: "error" })
  })

  it("does not read own list transcript option accessors", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])
    const options = {} as ListTranscriptsOptions
    Object.defineProperty(options, "status", {
      enumerable: true,
      get() {
        throw new Error("status getter called")
      }
    })

    const result = await router.listTranscripts("gladia", options)

    expect(result.transcripts[0]?.data.status).toBe("completed")
    expect(gladia.listCalls).toHaveLength(1)
    expect(gladia.listCalls[0]).toEqual({})
  })

  it("delegates supported streaming and removes router-only provider option", async () => {
    const gladia = new FakeAdapter("gladia")
    const callbacks: StreamingCallbacks = {
      onTranscript: vi.fn()
    }
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])

    await expect(
      router.transcribeStream({ provider: "gladia", encoding: "wav/pcm" }, callbacks)
    ).resolves.toMatchObject({
      id: "gladia-stream",
      provider: "gladia"
    })

    expect(gladia.streamCalls).toHaveLength(1)
    expect(gladia.streamCalls[0]?.options).toEqual({ encoding: "wav/pcm" })
    expect(gladia.streamCalls[0]?.callbacks).toEqual(callbacks)
    expect(gladia.streamCalls[0]?.callbacks).not.toBe(callbacks)
  })

  it("passes non-enumerable own streaming options to adapters", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])
    const options = { provider: "gladia" } as StreamingOptions & {
      provider?: TranscriptionProvider
    }
    Object.defineProperty(options, "encoding", {
      value: "wav/pcm",
      enumerable: false
    })

    await expect(router.transcribeStream(options)).resolves.toMatchObject({
      id: "gladia-stream",
      provider: "gladia"
    })

    expect(gladia.streamCalls[0]?.options).toEqual({ encoding: "wav/pcm" })
  })

  it("does not read own streaming option accessors", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])
    const options = {} as StreamingOptions & {
      provider?: TranscriptionProvider
    }
    Object.defineProperty(options, "provider", {
      enumerable: true,
      get() {
        throw new Error("streaming provider getter called")
      }
    })
    Object.defineProperty(options, "encoding", {
      enumerable: true,
      get() {
        throw new Error("encoding getter called")
      }
    })

    await expect(router.transcribeStream(options)).resolves.toMatchObject({ provider: "gladia" })
    expect(gladia.streamCalls[0]?.options).toEqual({})
  })

  it("does not pass inherited streaming callbacks to adapters", async () => {
    const gladia = new FakeAdapter("gladia")
    const inheritedTranscript = vi.fn()
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])

    await expect(
      router.transcribeStream(
        { provider: "gladia" },
        Object.create({ onTranscript: inheritedTranscript }) as StreamingCallbacks
      )
    ).resolves.toMatchObject({
      id: "gladia-stream",
      provider: "gladia"
    })

    expect(gladia.streamCalls).toHaveLength(1)
    expect(gladia.streamCalls[0]?.callbacks).toEqual({})
    expect(gladia.streamCalls[0]?.callbacks).not.toHaveProperty("onTranscript")
  })

  it("does not read own streaming callback accessors", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])
    const callbacks = {} as StreamingCallbacks
    Object.defineProperty(callbacks, "onTranscript", {
      enumerable: true,
      get() {
        throw new Error("onTranscript getter called")
      }
    })

    await expect(router.transcribeStream({ provider: "gladia" }, callbacks)).resolves.toMatchObject(
      {
        id: "gladia-stream",
        provider: "gladia"
      }
    )
    expect(gladia.streamCalls).toHaveLength(1)
    expect(gladia.streamCalls[0]?.callbacks).toEqual({})
    expect(gladia.streamCalls[0]?.callbacks).not.toHaveProperty("onTranscript")
  })

  it("does not use inherited provider options for streaming provider selection", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter(
      config({ providers: { gladia: { apiKey: "secret" } }, selectionStrategy: "explicit" }),
      [gladia]
    )

    await expect(
      router.transcribeStream(Object.create({ provider: "gladia" }) as StreamingOptions)
    ).rejects.toThrow(
      "Provider must be explicitly specified when using 'explicit' selection strategy"
    )
    expect(gladia.streamCalls).toHaveLength(0)
  })

  it("rejects invalid streaming options at runtime", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])

    await expect(router.transcribeStream("bad" as unknown as StreamingOptions)).rejects.toThrow(
      "transcribeStream options must be an object"
    )
    await expect(router.transcribeStream([] as unknown as StreamingOptions)).rejects.toThrow(
      "transcribeStream options must be an object"
    )
    expect(gladia.streamCalls).toHaveLength(0)
  })

  it("rejects invalid streaming callbacks before adapter calls or provider selection", async () => {
    const gladia = new FakeAdapter("gladia")
    const deepgram = new FakeAdapter("deepgram")
    const router = createVoiceRouter(config({ selectionStrategy: "round-robin" }), [
      gladia,
      deepgram
    ])

    await expect(
      router.transcribeStream(undefined, "bad" as unknown as StreamingCallbacks)
    ).rejects.toThrow("Streaming callbacks must be an object")
    await expect(
      router.transcribeStream(undefined, [] as unknown as StreamingCallbacks)
    ).rejects.toThrow("Streaming callbacks must be an object")
    await expect(
      router.transcribeStream(undefined, {
        onTranscript: "bad"
      } as unknown as StreamingCallbacks)
    ).rejects.toThrow("Streaming callback 'onTranscript' must be a function")

    expect(gladia.streamCalls).toHaveLength(0)
    expect(deepgram.streamCalls).toHaveLength(0)
    await expect(router.transcribeStream()).resolves.toMatchObject({ provider: "gladia" })
  })

  it("blocks unsupported streaming providers before adapter call", async () => {
    const azure = new FakeAdapter("azure-stt", { streaming: false })
    const router = createVoiceRouter({ providers: { "azure-stt": { apiKey: "secret" } } }, [azure])

    await expect(router.transcribeStream({ provider: "azure-stt" })).rejects.toThrow(
      "Provider 'azure-stt' does not support streaming transcription"
    )
    expect(azure.streamCalls).toHaveLength(0)
  })

  it("blocks adapters that advertise streaming without implementing it", async () => {
    const gladia = new MinimalAdapter("gladia", { ...capabilities, streaming: true })
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])

    await expect(router.transcribeStream({ provider: "gladia" })).rejects.toThrow(
      "Provider 'gladia' does not support streaming transcription"
    )
  })

  it("delegates optional transcript operations and raw client access", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])

    await expect(router.getTranscript("tx-1", "gladia")).resolves.toMatchObject({
      data: { id: "tx-1" }
    })
    await expect(router.deleteTranscript("tx-1", "gladia")).resolves.toEqual({ success: true })
    await expect(router.listTranscripts("gladia", { status: "completed" })).resolves.toMatchObject({
      total: 1,
      hasMore: false
    })
    expect(gladia.deleteCalls).toEqual(["tx-1"])
    expect(gladia.listCalls).toEqual([{ status: "completed" }])
    expect(router.getProviderCapabilities("gladia")).toMatchObject(capabilities)
    expect(router.getRawProviderClient("gladia")).toEqual({ provider: "gladia" })
  })

  it("returns provider capabilities without exposing adapter state", () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])

    const returnedCapabilities = router.getProviderCapabilities("gladia")
    returnedCapabilities.deleteTranscript = false

    expect(returnedCapabilities).not.toBe(gladia.capabilities)
    expect(gladia.capabilities.deleteTranscript).toBe(true)
    expect(router.getProviderCapabilities("gladia").deleteTranscript).toBe(true)
  })

  it("returns non-enumerable own provider capabilities in snapshots", () => {
    const gladia = new FakeAdapter("gladia")
    Object.defineProperty(gladia, "capabilities", {
      value: nonEnumerableCapabilities()
    })
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])

    expect(router.getProviderCapabilities("gladia")).toEqual(capabilities)
  })

  it("uses registration-time capability snapshots after adapter capability mutation", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])

    Object.defineProperty(gladia.capabilities, "streaming", {
      configurable: true,
      get() {
        throw new Error("streaming getter called")
      }
    })
    Object.defineProperty(gladia.capabilities, "deleteTranscript", {
      configurable: true,
      value: false
    })
    Object.defineProperty(gladia.capabilities, "listTranscripts", {
      configurable: true,
      value: false
    })

    expect(router.getProviderCapabilities("gladia")).toEqual(capabilities)
    await expect(router.transcribeStream({ provider: "gladia" })).resolves.toMatchObject({
      provider: "gladia"
    })
    await expect(router.deleteTranscript("tx-1", "gladia")).resolves.toEqual({ success: true })
    await expect(router.listTranscripts("gladia")).resolves.toMatchObject({ total: 1 })
  })

  it("uses registration-time adapter method snapshots after adapter method mutation", async () => {
    const gladia = new FakeAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])

    for (const method of [
      "transcribe",
      "getTranscript",
      "transcribeStream",
      "deleteTranscript",
      "listTranscripts",
      "getRawClient"
    ] as const) {
      Object.defineProperty(gladia, method, {
        configurable: true,
        get() {
          throw new Error(`${method} getter called`)
        }
      })
    }

    await expect(router.transcribe(audio)).resolves.toMatchObject({ provider: "gladia" })
    await expect(router.getTranscript("tx-1", "gladia")).resolves.toMatchObject({
      data: { id: "tx-1" }
    })
    await expect(router.transcribeStream({ provider: "gladia" })).resolves.toMatchObject({
      provider: "gladia"
    })
    await expect(router.deleteTranscript("tx-1", "gladia")).resolves.toEqual({ success: true })
    await expect(router.listTranscripts("gladia")).resolves.toMatchObject({ total: 1 })
    expect(router.getRawProviderClient("gladia")).toEqual({ provider: "gladia" })
  })

  it("honors optional transcript capability flags before adapter methods", async () => {
    const gladia = new FakeAdapter("gladia", {
      deleteTranscript: false,
      listTranscripts: false
    })
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])

    await expect(router.deleteTranscript("tx-1", "gladia")).rejects.toThrow(
      "Provider 'gladia' does not support deleting transcripts"
    )
    await expect(router.listTranscripts("gladia")).rejects.toThrow(
      "Provider 'gladia' does not support listing transcripts"
    )
    expect(gladia.deleteCalls).toEqual([])
    expect(gladia.listCalls).toEqual([])
  })

  it("rejects unsupported optional transcript operations and raw client access", async () => {
    const gladia = new MinimalAdapter("gladia")
    const router = createVoiceRouter({ providers: { gladia: { apiKey: "secret" } } }, [gladia])

    await expect(router.deleteTranscript("tx-1", "gladia")).rejects.toThrow(
      "Provider 'gladia' does not support deleting transcripts"
    )
    await expect(router.listTranscripts("gladia")).rejects.toThrow(
      "Provider 'gladia' does not support listing transcripts"
    )
    expect(() => router.getRawProviderClient("gladia")).toThrow(
      "Provider 'gladia' does not expose a raw client"
    )
  })
})
