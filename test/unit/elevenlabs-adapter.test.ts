import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ElevenLabsAdapter } from "../../src/adapters/elevenlabs-adapter"
import { ElevenLabsRegion } from "../../src/constants"

const { MockWebSocket, wsInstances } = vi.hoisted(() => {
  type MockWebSocketHandler = (...args: unknown[]) => void

  class MockWebSocket {
    readonly url: string
    readonly options?: unknown
    readonly sent: unknown[] = []
    onopen?: () => void
    onmessage?: (event: { data: string }) => void
    onerror?: () => void
    onclose?: (event: { code: number; reason: string }) => void
    private readonly handlers = new Map<string, MockWebSocketHandler[]>()

    constructor(url: string, options?: unknown) {
      this.url = url
      this.options = options
      wsInstances.push(this)
    }

    send(payload: unknown): void {
      this.sent.push(payload)
    }

    once(event: string, handler: MockWebSocketHandler): this {
      const handlers = this.handlers.get(event) ?? []
      handlers.push(handler)
      this.handlers.set(event, handlers)
      return this
    }

    open(): void {
      this.onopen?.()
    }

    receive(payload: string | Record<string, unknown>): void {
      const rawPayload = typeof payload === "string" ? payload : JSON.stringify(payload)
      this.onmessage?.({ data: rawPayload })
    }

    close(_code?: number, reason = "closed"): void {
      queueMicrotask(() => {
        this.onclose?.({ code: 1000, reason })
        const handlers = this.handlers.get("close") ?? []
        this.handlers.delete("close")
        for (const handler of handlers) {
          handler(1000, Buffer.from(reason))
        }
      })
    }
  }

  const wsInstances: MockWebSocket[] = []

  return {
    MockWebSocket,
    wsInstances
  }
})

vi.mock("axios", () => ({
  default: {
    create: vi.fn()
  }
}))

vi.mock("ws", () => ({
  default: MockWebSocket
}))

type MockAxiosClient = {
  post: ReturnType<typeof vi.fn>
  get: ReturnType<typeof vi.fn>
}

function formValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return typeof value === "string" ? value : undefined
}

function formValues(formData: FormData, key: string): string[] {
  return formData.getAll(key).filter((value): value is string => typeof value === "string")
}

describe("ElevenLabsAdapter", () => {
  let client: MockAxiosClient

  beforeEach(() => {
    client = {
      post: vi.fn(),
      get: vi.fn()
    }
    vi.mocked(axios.create).mockReturnValue(client as unknown as ReturnType<typeof axios.create>)
    wsInstances.length = 0
  })

  it("maps unified URL transcription options to ElevenLabs multipart fields", async () => {
    client.post.mockResolvedValue({
      data: {
        transcription_id: "el-1",
        text: "hello world",
        language_code: "en",
        language_probability: 0.97,
        words: [
          {
            text: "hello",
            type: "word",
            start: 0,
            end: 0.5,
            logprob: Math.log(0.9),
            speaker_id: "speaker_0"
          },
          {
            text: "world",
            type: "word",
            start: 0.6,
            end: 1,
            logprob: Math.log(0.8),
            speaker_id: "speaker_0"
          },
          {
            text: "laughter",
            type: "audio_event",
            start: 1.1,
            end: 1.4
          }
        ],
        entities: [
          {
            text: "world",
            entity_type: "other",
            start_char: 6,
            end_char: 11
          }
        ]
      }
    })

    const adapter = new ElevenLabsAdapter()
    adapter.initialize({
      apiKey: "secret",
      region: ElevenLabsRegion.eu
    })

    const result = await adapter.transcribe(
      {
        type: "url",
        url: "https://example.com/audio.wav"
      },
      {
        language: "en",
        model: "scribe_v2",
        diarization: true,
        speakersExpected: 2,
        customVocabulary: ["Meeting BaaS", "SDK"],
        entityDetection: true,
        elevenlabs: {
          tag_audio_events: false,
          webhook_metadata: { meeting_id: "m-1" }
        }
      }
    )

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: "https://api.eu.residency.elevenlabs.io",
        headers: {
          "xi-api-key": "secret"
        }
      })
    )
    expect(client.post).toHaveBeenCalledWith(
      "/v1/speech-to-text",
      expect.any(FormData),
      expect.objectContaining({
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })
    )

    const formData = client.post.mock.calls[0]?.[1] as FormData
    expect(formValue(formData, "model_id")).toBe("scribe_v2")
    expect(formValue(formData, "cloud_storage_url")).toBe("https://example.com/audio.wav")
    expect(formValue(formData, "language_code")).toBe("en")
    expect(formValue(formData, "diarize")).toBe("true")
    expect(formValue(formData, "timestamps_granularity")).toBe("word")
    expect(formValue(formData, "num_speakers")).toBe("2")
    expect(formValues(formData, "keyterms")).toEqual(["Meeting BaaS", "SDK"])
    expect(formValue(formData, "entity_detection")).toBe("all")
    expect(formValue(formData, "tag_audio_events")).toBe("false")
    expect(formValue(formData, "webhook_metadata")).toBe('{"meeting_id":"m-1"}')

    expect(result).toMatchObject({
      success: true,
      provider: "elevenlabs",
      data: {
        id: "el-1",
        text: "hello world",
        status: "completed",
        language: "en",
        speakers: [{ id: "speaker_0", label: "Speaker speaker_0" }]
      },
      extended: {
        languageProbability: 0.97,
        entities: [
          {
            text: "world",
            entity_type: "other",
            start_char: 6,
            end_char: 11
          }
        ],
        audioEvents: [
          {
            text: "laughter",
            start: 1.1,
            end: 1.4
          }
        ]
      },
      tracking: {
        requestId: "el-1"
      }
    })
    expect(result.data?.words).toHaveLength(2)
    expect(result.data?.utterances).toHaveLength(1)
  })

  it("returns a queued acknowledgement for webhook mode", async () => {
    client.post.mockResolvedValue({
      data: {
        request_id: "req-1"
      }
    })

    const adapter = new ElevenLabsAdapter()
    adapter.initialize({ apiKey: "secret" })

    const result = await adapter.transcribe(
      {
        type: "url",
        url: "https://example.com/audio.wav"
      },
      {
        webhookUrl: "https://example.com/webhook",
        elevenlabs: {
          webhook_id: "hook-1"
        }
      }
    )

    const formData = client.post.mock.calls[0]?.[1] as FormData
    expect(formValue(formData, "webhook")).toBe("true")
    expect(formValue(formData, "webhook_id")).toBe("hook-1")
    expect(result).toMatchObject({
      success: true,
      provider: "elevenlabs",
      data: {
        id: "req-1",
        text: "",
        status: "queued"
      },
      tracking: {
        requestId: "req-1"
      }
    })
  })

  it("rejects unsupported stream audio input before making an API request", async () => {
    const adapter = new ElevenLabsAdapter()
    adapter.initialize({ apiKey: "secret" })

    const result = await adapter.transcribe({
      type: "stream",
      stream: new ReadableStream()
    })

    expect(result).toEqual({
      success: false,
      provider: "elevenlabs",
      error: {
        code: "INVALID_INPUT",
        message: "ElevenLabs only supports URL and File audio input"
      }
    })
    expect(client.post).not.toHaveBeenCalled()
  })

  it("retrieves and normalizes transcript results by ID", async () => {
    client.get.mockResolvedValue({
      data: {
        transcription_id: "el-2",
        text: "stored transcript",
        language_code: "fr",
        words: []
      }
    })

    const adapter = new ElevenLabsAdapter()
    adapter.initialize({ apiKey: "secret" })

    await expect(adapter.getTranscript("el-2")).resolves.toMatchObject({
      success: true,
      provider: "elevenlabs",
      data: {
        id: "el-2",
        text: "stored transcript",
        status: "completed",
        language: "fr"
      }
    })
    expect(client.get).toHaveBeenCalledWith("/v1/speech-to-text/transcripts/el-2")
  })

  it("streams authenticated realtime audio and normalizes transcript events", async () => {
    const onOpen = vi.fn()
    const onRawMessage = vi.fn()
    const onTranscript = vi.fn()
    const onUtterance = vi.fn()
    const onError = vi.fn()
    const onClose = vi.fn()

    const adapter = new ElevenLabsAdapter()
    adapter.initialize({
      apiKey: "secret",
      region: ElevenLabsRegion.eu
    })

    const sessionPromise = adapter.transcribeStream(
      {
        language: "en",
        languageDetection: true,
        diarization: true,
        elevenlabsStreaming: {
          model: "scribe_v2_realtime",
          includeTimestamps: true,
          includeLanguageDetection: true,
          commitStrategy: "vad",
          vadSilenceThresholdSecs: 0.7,
          vadThreshold: 0.4,
          minSpeechDurationMs: 150,
          minSilenceDurationMs: 500,
          previousText: "Previous context"
        }
      },
      {
        onOpen,
        onRawMessage,
        onTranscript,
        onUtterance,
        onError,
        onClose
      }
    )

    const ws = wsInstances[0]
    expect(ws).toBeDefined()
    if (!ws) throw new Error("Expected ElevenLabs WebSocket instance")

    const url = new URL(ws.url)
    expect(`${url.origin}${url.pathname}`).toBe(
      "wss://api.eu.residency.elevenlabs.io/v1/speech-to-text/realtime"
    )
    expect(url.searchParams.get("model_id")).toBe("scribe_v2_realtime")
    expect(url.searchParams.get("audio_format")).toBe("pcm_16000")
    expect(url.searchParams.get("language_code")).toBe("en")
    expect(url.searchParams.get("include_timestamps")).toBe("true")
    expect(url.searchParams.get("include_language_detection")).toBe("true")
    expect(url.searchParams.get("commit_strategy")).toBe("vad")
    expect(url.searchParams.get("vad_silence_threshold_secs")).toBe("0.7")
    expect(url.searchParams.get("vad_threshold")).toBe("0.4")
    expect(url.searchParams.get("min_speech_duration_ms")).toBe("150")
    expect(url.searchParams.get("min_silence_duration_ms")).toBe("500")
    expect(url.searchParams.get("previous_text")).toBe("Previous context")
    expect(ws.options).toMatchObject({
      headers: {
        "xi-api-key": "secret"
      }
    })

    ws.open()
    const session = await sessionPromise
    expect(session.provider).toBe("elevenlabs")
    expect(session.getStatus()).toBe("open")
    expect(onOpen).toHaveBeenCalledOnce()

    ws.receive({
      message_type: "partial_transcript",
      text: "hello"
    })
    ws.receive({
      message_type: "committed_transcript",
      text: "hello world"
    })
    ws.receive({
      message_type: "committed_transcript_with_timestamps",
      text: "hello world",
      language_code: "en",
      words: [
        {
          text: "hello",
          start: 0,
          end: 0.5,
          logprob: Math.log(0.91),
          speaker_id: "speaker_0"
        },
        {
          text: "world",
          start: 0.6,
          end: 1.2,
          logprob: Math.log(0.9),
          speaker_id: "speaker_0"
        }
      ]
    })
    ws.receive({
      message_type: "auth_error",
      error: "Invalid API key"
    })

    expect(onTranscript).toHaveBeenCalledWith({
      type: "transcript",
      text: "hello",
      isFinal: false,
      confidence: undefined
    })
    expect(onTranscript).toHaveBeenCalledWith({
      type: "transcript",
      text: "hello world",
      isFinal: true,
      confidence: undefined
    })
    expect(onTranscript).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "transcript",
        text: "hello world",
        isFinal: true,
        language: "en",
        speaker: "speaker_0",
        words: [
          {
            word: "hello",
            start: 0,
            end: 0.5,
            confidence: 0.91,
            speaker: "speaker_0"
          },
          {
            word: "world",
            start: 0.6,
            end: 1.2,
            confidence: 0.9,
            speaker: "speaker_0"
          }
        ]
      })
    )
    expect(onUtterance).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "hello world",
        start: 0,
        end: 1.2,
        speaker: "speaker_0"
      })
    )
    expect(onError).toHaveBeenCalledWith({
      code: "auth_error",
      message: "Invalid API key"
    })
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "elevenlabs",
        direction: "incoming",
        messageType: "committed_transcript_with_timestamps"
      })
    )
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "elevenlabs",
        direction: "incoming",
        messageType: "error"
      })
    )

    await session.sendAudio({ data: new Uint8Array([1, 2, 3]) })
    expect(JSON.parse(ws.sent[0] as string)).toEqual({
      message_type: "input_audio_chunk",
      audio_base_64: Buffer.from([1, 2, 3]).toString("base64")
    })
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "elevenlabs",
        direction: "outgoing",
        messageType: "audio",
        payload: ws.sent[0]
      })
    )

    await session.close()
    expect(JSON.parse(ws.sent[1] as string)).toEqual({
      message_type: "end_of_stream"
    })
    await Promise.resolve()
    expect(session.getStatus()).toBe("closed")
    expect(onClose).toHaveBeenCalledWith(1000, "Client requested close")
  })

  it("reports malformed realtime messages and blocks audio after close", async () => {
    const onError = vi.fn()

    const adapter = new ElevenLabsAdapter()
    adapter.initialize({ apiKey: "secret" })

    const sessionPromise = adapter.transcribeStream(
      {},
      {
        onError
      }
    )

    const ws = wsInstances[0]
    expect(ws).toBeDefined()
    if (!ws) throw new Error("Expected ElevenLabs WebSocket instance")

    ws.open()
    const session = await sessionPromise

    ws.receive("{")

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "PARSE_ERROR",
        message: expect.stringContaining("Failed to parse message:")
      })
    )

    ws.close()
    await Promise.resolve()

    await expect(session.sendAudio({ data: Buffer.from([1, 2, 3]) })).rejects.toThrow(
      "Session is not open"
    )
  })
})
