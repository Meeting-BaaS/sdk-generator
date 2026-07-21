import { beforeEach, describe, expect, it, vi } from "vitest"
import { AssemblyAIAdapter } from "../../src/adapters/assemblyai-adapter"
import {
  createTranscript,
  deleteTranscript,
  getTranscript,
  listTranscripts
} from "../../src/generated/assemblyai/api/assemblyAIAPI"

const { MockWebSocket, wsInstances } = vi.hoisted(() => {
  type MockWebSocketHandler = (...args: unknown[]) => void

  class MockWebSocket {
    static readonly OPEN = 1
    readonly url: string
    readonly options?: unknown
    readyState = 0
    readonly sent: unknown[] = []
    private readonly handlers = new Map<string, MockWebSocketHandler[]>()
    private readonly onceHandlers = new Map<string, MockWebSocketHandler[]>()

    constructor(url: string, options?: unknown) {
      this.url = url
      this.options = options
      wsInstances.push(this)
    }

    on(event: string, handler: MockWebSocketHandler): this {
      const handlers = this.handlers.get(event) ?? []
      handlers.push(handler)
      this.handlers.set(event, handlers)
      return this
    }

    once(event: string, handler: MockWebSocketHandler): this {
      const handlers = this.onceHandlers.get(event) ?? []
      handlers.push(handler)
      this.onceHandlers.set(event, handlers)
      return this
    }

    send(payload: unknown): void {
      this.sent.push(payload)
    }

    close(): void {
      this.readyState = 3
      queueMicrotask(() => {
        this.emit("close", 1000, Buffer.from("closed"))
      })
    }

    terminate(): void {
      this.readyState = 3
    }

    open(): void {
      this.readyState = MockWebSocket.OPEN
      this.emit("open")
    }

    receive(payload: string | Record<string, unknown>): void {
      const rawPayload = typeof payload === "string" ? payload : JSON.stringify(payload)
      this.emit("message", Buffer.from(rawPayload))
    }

    private emit(event: string, ...args: unknown[]): void {
      for (const handler of this.handlers.get(event) ?? []) {
        handler(...args)
      }

      const onceHandlers = this.onceHandlers.get(event) ?? []
      this.onceHandlers.delete(event)
      for (const handler of onceHandlers) {
        handler(...args)
      }
    }
  }

  const wsInstances: MockWebSocket[] = []

  return {
    MockWebSocket,
    wsInstances
  }
})

vi.mock("../../src/generated/assemblyai/api/assemblyAIAPI", () => ({
  createTranscript: vi.fn(),
  getTranscript: vi.fn(),
  deleteTranscript: vi.fn(),
  listTranscripts: vi.fn()
}))

vi.mock("ws", () => ({
  default: MockWebSocket
}))

const createTranscriptMock = vi.mocked(createTranscript)
const getTranscriptMock = vi.mocked(getTranscript)
const deleteTranscriptMock = vi.mocked(deleteTranscript)
const listTranscriptsMock = vi.mocked(listTranscripts)

describe("AssemblyAIAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wsInstances.length = 0
  })

  it("maps unified URL transcription options and legacy speech_model passthrough", async () => {
    createTranscriptMock.mockResolvedValue({
      data: {
        id: "aai-1",
        status: "queued"
      },
      status: 200
    } as Awaited<ReturnType<typeof createTranscript>>)

    const adapter = new AssemblyAIAdapter()
    adapter.initialize({ apiKey: "secret", region: "eu" })

    const result = await adapter.transcribe(
      {
        type: "url",
        url: "https://example.com/audio.mp3"
      },
      {
        language: "fr",
        model: "universal-2",
        diarization: true,
        speakersExpected: 2,
        summarization: true,
        sentimentAnalysis: true,
        entityDetection: true,
        piiRedaction: true,
        customVocabulary: ["Meeting BaaS", "SDK"],
        webhookUrl: "https://example.com/webhook",
        assemblyai: {
          speech_model: "deprecated-model",
          punctuate: false
        }
      }
    )

    expect(createTranscriptMock).toHaveBeenCalledWith(
      {
        audio_url: "https://example.com/audio.mp3",
        speech_models: ["universal-2"],
        punctuate: false,
        format_text: true,
        language_code: "fr_us",
        speaker_labels: true,
        speakers_expected: 2,
        keyterms_prompt: ["Meeting BaaS", "SDK"],
        summarization: true,
        summary_model: "informative",
        summary_type: "bullets",
        sentiment_analysis: true,
        entity_detection: true,
        redact_pii: true,
        webhook_url: "https://example.com/webhook"
      },
      expect.objectContaining({
        baseURL: "https://api.eu.assemblyai.com",
        headers: expect.objectContaining({
          authorization: "secret"
        })
      })
    )
    expect(result).toEqual({
      success: true,
      provider: "assemblyai",
      data: {
        id: "aai-1",
        text: "",
        status: "queued"
      },
      raw: {
        id: "aai-1",
        status: "queued"
      }
    })
  })

  it("rejects non-URL audio input before calling the generated API", async () => {
    const adapter = new AssemblyAIAdapter()
    adapter.initialize({ apiKey: "secret" })

    const result = await adapter.transcribe({
      type: "file",
      file: new Uint8Array([1, 2, 3]),
      filename: "audio.wav"
    })

    expect(result).toMatchObject({
      success: false,
      provider: "assemblyai",
      error: {
        code: "UNKNOWN_ERROR",
        message:
          "AssemblyAI adapter currently only supports URL-based audio input. Use audio.type='url'"
      }
    })
    expect(createTranscriptMock).not.toHaveBeenCalled()
  })

  it("normalizes completed transcript details", async () => {
    getTranscriptMock.mockResolvedValue({
      data: {
        id: "aai-2",
        status: "completed",
        text: "hello world",
        confidence: 0.92,
        language_code: "en_us",
        audio_duration: 1250,
        audio_url: "https://example.com/audio.mp3",
        summary: "Greeting",
        utterances: [
          {
            text: "hello world",
            start: 0,
            end: 1200,
            confidence: 0.91,
            speaker: "A",
            words: [
              {
                text: "hello",
                start: 0,
                end: 500,
                confidence: 0.9,
                speaker: "A"
              },
              {
                text: "world",
                start: 600,
                end: 1200,
                confidence: 0.94,
                speaker: "A"
              }
            ]
          }
        ],
        words: [
          {
            text: "hello",
            start: 0,
            end: 500,
            confidence: 0.9,
            speaker: "A"
          }
        ],
        entities: [{ text: "world", entity_type: "other" }],
        language_confidence: 0.99,
        throttled: false
      },
      status: 200
    } as Awaited<ReturnType<typeof getTranscript>>)

    const adapter = new AssemblyAIAdapter()
    adapter.initialize({ apiKey: "secret" })

    await expect(adapter.getTranscript("aai-2")).resolves.toMatchObject({
      success: true,
      provider: "assemblyai",
      data: {
        id: "aai-2",
        text: "hello world",
        confidence: 0.92,
        status: "completed",
        language: "en_us",
        duration: 1.25,
        speakers: [{ id: "A", label: "A" }],
        words: [
          {
            word: "hello",
            start: 0,
            end: 0.5,
            confidence: 0.9,
            speaker: "A"
          }
        ],
        utterances: [
          {
            text: "hello world",
            start: 0,
            end: 1.2,
            speaker: "A",
            confidence: 0.91
          }
        ],
        summary: "Greeting",
        metadata: {
          sourceAudioUrl: "https://example.com/audio.mp3"
        }
      },
      extended: {
        entities: [{ text: "world", entity_type: "other" }],
        languageConfidence: 0.99,
        throttled: false
      },
      tracking: {
        requestId: "aai-2"
      }
    })
  })

  it("lists and deletes transcripts through generated API functions", async () => {
    listTranscriptsMock.mockResolvedValue({
      data: {
        transcripts: [
          {
            id: "aai-list-1",
            status: "completed",
            audio_url: "https://example.com/audio.mp3",
            created: "2026-06-24T00:00:00.000Z",
            completed: "2026-06-24T00:01:00.000Z",
            resource_url: "https://api.assemblyai.com/v2/transcript/aai-list-1"
          }
        ],
        page_details: {
          next_url: null
        }
      },
      status: 200
    } as Awaited<ReturnType<typeof listTranscripts>>)
    deleteTranscriptMock.mockResolvedValue({
      data: {
        status: "completed"
      },
      status: 200
    } as Awaited<ReturnType<typeof deleteTranscript>>)

    const adapter = new AssemblyAIAdapter()
    adapter.initialize({ apiKey: "secret" })

    await expect(
      adapter.listTranscripts({
        limit: 10,
        status: "completed",
        date: "2026-06-24",
        assemblyai: {
          after_id: "cursor-1"
        }
      })
    ).resolves.toMatchObject({
      hasMore: false,
      transcripts: [
        {
          success: true,
          provider: "assemblyai",
          data: {
            id: "aai-list-1",
            text: "",
            status: "completed",
            metadata: {
              sourceAudioUrl: "https://example.com/audio.mp3",
              createdAt: "2026-06-24T00:00:00.000Z",
              completedAt: "2026-06-24T00:01:00.000Z"
            }
          }
        }
      ]
    })
    expect(listTranscriptsMock).toHaveBeenCalledWith(
      {
        after_id: "cursor-1",
        limit: 10,
        status: "completed",
        created_on: "2026-06-24"
      },
      expect.any(Object)
    )

    await expect(adapter.deleteTranscript("aai-list-1")).resolves.toEqual({ success: true })
    expect(deleteTranscriptMock).toHaveBeenCalledWith("aai-list-1", expect.any(Object))
  })

  it("streams buffered audio over regional WebSocket and normalizes provider events", async () => {
    const onOpen = vi.fn()
    const onRawMessage = vi.fn()
    const onTranscript = vi.fn()
    const onUtterance = vi.fn()
    const onMetadata = vi.fn()
    const onError = vi.fn()
    const onClose = vi.fn()

    const adapter = new AssemblyAIAdapter()
    adapter.initialize({ apiKey: "secret", region: "eu" })

    const sessionPromise = adapter.transcribeStream(
      {
        encoding: "linear16",
        sampleRate: 16000,
        customVocabulary: ["Meeting BaaS", "SDK"],
        assemblyaiStreaming: {
          speechModel: "universal-streaming-english",
          languageDetection: true,
          endOfTurnConfidenceThreshold: 0.6,
          minEndOfTurnSilenceWhenConfident: 700,
          maxTurnSilence: 2000,
          vadThreshold: 0.3,
          formatTurns: true,
          filterProfanity: true,
          keytermsPrompt: ["technical meeting"],
          inactivityTimeout: 60000
        }
      },
      {
        onOpen,
        onRawMessage,
        onTranscript,
        onUtterance,
        onMetadata,
        onError,
        onClose
      }
    )

    const ws = wsInstances[0]
    expect(ws).toBeDefined()
    if (!ws) throw new Error("Expected AssemblyAI WebSocket instance")

    const url = new URL(ws.url)
    expect(`${url.origin}${url.pathname}`).toBe("wss://streaming.eu.assemblyai.com/v3/ws")
    expect(url.searchParams.get("sample_rate")).toBe("16000")
    expect(url.searchParams.get("encoding")).toBe("pcm_s16le")
    expect(url.searchParams.get("speech_model")).toBe("universal-streaming-english")
    expect(url.searchParams.get("language_detection")).toBe("true")
    expect(url.searchParams.get("end_of_turn_confidence_threshold")).toBe("0.6")
    expect(url.searchParams.get("min_end_of_turn_silence_when_confident")).toBe("700")
    expect(url.searchParams.get("max_turn_silence")).toBe("2000")
    expect(url.searchParams.get("vad_threshold")).toBe("0.3")
    expect(url.searchParams.get("format_turns")).toBe("true")
    expect(url.searchParams.get("filter_profanity")).toBe("true")
    expect(url.searchParams.get("inactivity_timeout")).toBe("60000")
    expect(url.searchParams.getAll("keyterms")).toEqual(["Meeting BaaS", "SDK"])
    expect(url.searchParams.getAll("keyterms_prompt")).toEqual(["technical meeting"])
    expect(ws.options).toMatchObject({
      headers: {
        Authorization: "secret"
      }
    })

    ws.open()
    const session = await sessionPromise
    expect(session.provider).toBe("assemblyai")
    expect(session.getStatus()).toBe("open")
    expect(onOpen).toHaveBeenCalledOnce()

    const expiresAt = Date.parse("2026-06-24T00:00:00.000Z")
    ws.receive({
      type: "Begin",
      id: "aai-session-1",
      expires_at: expiresAt
    })
    ws.receive({
      type: "Turn",
      turn_order: 1,
      turn_is_formatted: true,
      end_of_turn: true,
      transcript: "hello world",
      end_of_turn_confidence: 0.87,
      language_code: "en",
      language_confidence: 0.98,
      words: [
        {
          text: "hello",
          start: 0,
          end: 500,
          confidence: 0.91,
          word_is_final: true
        },
        {
          text: "world",
          start: 600,
          end: 1200,
          confidence: 0.9,
          word_is_final: true
        }
      ]
    })
    ws.receive({
      type: "Termination",
      audio_duration_seconds: 1.2,
      session_duration_seconds: 2.3
    })
    ws.receive({
      error: "Invalid stream configuration"
    })

    expect(onMetadata).toHaveBeenCalledWith({
      type: "begin",
      sessionId: "aai-session-1",
      expiresAt: "2026-06-24T00:00:00.000Z"
    })
    expect(onMetadata).toHaveBeenCalledWith({
      type: "termination",
      audioDurationSeconds: 1.2,
      sessionDurationSeconds: 2.3
    })
    expect(onTranscript).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "transcript",
        text: "hello world",
        isFinal: true,
        confidence: 0.87,
        language: "en",
        words: [
          {
            word: "hello",
            start: 0,
            end: 0.5,
            confidence: 0.91
          },
          {
            word: "world",
            start: 0.6,
            end: 1.2,
            confidence: 0.9
          }
        ]
      })
    )
    expect(onUtterance).toHaveBeenCalledWith({
      text: "hello world",
      start: 0,
      end: 1.2,
      confidence: 0.87,
      words: [
        {
          word: "hello",
          start: 0,
          end: 0.5,
          confidence: 0.91
        },
        {
          word: "world",
          start: 0.6,
          end: 1.2,
          confidence: 0.9
        }
      ]
    })
    expect(onError).toHaveBeenCalledWith({
      code: "API_ERROR",
      message: "Invalid stream configuration"
    })
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "assemblyai",
        direction: "incoming",
        messageType: "Turn"
      })
    )
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "assemblyai",
        direction: "incoming",
        messageType: "Error"
      })
    )

    await session.sendAudio({ data: new Uint8Array(800) })
    expect(ws.sent).toEqual([])

    await session.sendAudio({ data: new Uint8Array(900) })
    expect(ws.sent).toHaveLength(1)
    expect(Buffer.isBuffer(ws.sent[0])).toBe(true)
    expect((ws.sent[0] as Buffer).byteLength).toBe(1700)

    await session.sendAudio({ data: new Uint8Array([1, 2]), isLast: true })
    expect(ws.sent[1]).toBeInstanceOf(Buffer)
    expect((ws.sent[1] as Buffer).byteLength).toBe(2)
    expect(ws.sent[2]).toBe(JSON.stringify({ type: "Terminate" }))
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "assemblyai",
        direction: "outgoing",
        messageType: "audio",
        payload: expect.any(ArrayBuffer)
      })
    )
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "assemblyai",
        direction: "outgoing",
        messageType: "Terminate",
        payload: JSON.stringify({ type: "Terminate" })
      })
    )

    session.updateConfiguration?.({
      end_of_turn_confidence_threshold: 0.5,
      vad_threshold: 0.2
    })
    session.forceEndpoint?.()
    expect(ws.sent[3]).toBe(
      JSON.stringify({
        type: "UpdateConfiguration",
        end_of_turn_confidence_threshold: 0.5,
        vad_threshold: 0.2
      })
    )
    expect(ws.sent[4]).toBe(JSON.stringify({ type: "ForceEndpoint" }))

    await session.close()
    expect(ws.sent[5]).toBe(JSON.stringify({ type: "Terminate" }))
    expect(session.getStatus()).toBe("closed")
    expect(onClose).toHaveBeenCalledWith(1000, "closed")
  })

  it("reports malformed streaming messages and blocks streaming operations after close", async () => {
    const onRawMessage = vi.fn()
    const onError = vi.fn()

    const adapter = new AssemblyAIAdapter()
    adapter.initialize({ apiKey: "secret" })

    const sessionPromise = adapter.transcribeStream(
      {},
      {
        onRawMessage,
        onError
      }
    )

    const ws = wsInstances[0]
    expect(ws).toBeDefined()
    if (!ws) throw new Error("Expected AssemblyAI WebSocket instance")

    ws.open()
    const session = await sessionPromise

    ws.receive("{")

    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "assemblyai",
        direction: "incoming",
        payload: "{",
        messageType: "parse_error"
      })
    )
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "PARSE_ERROR",
        message: "Failed to parse WebSocket message"
      })
    )

    ws.close()
    await Promise.resolve()

    await expect(session.sendAudio({ data: Buffer.from([1, 2, 3]) })).rejects.toThrow(
      "Cannot send audio: session is closed"
    )
    expect(() => session.updateConfiguration?.({ vad_threshold: 0.4 })).toThrow(
      "Cannot update configuration: WebSocket is not open"
    )
    expect(() => session.forceEndpoint?.()).toThrow("Cannot force endpoint: WebSocket is not open")
  })
})
