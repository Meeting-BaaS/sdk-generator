import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DeepgramAdapter } from "../../src/adapters/deepgram-adapter"
import { DeepgramRegion } from "../../src/constants"

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

    emitError(error: Error): void {
      this.emit("error", error)
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

function deepgramTranscriptResponse() {
  return {
    metadata: {
      request_id: "dg-1",
      sha256: "sha-1",
      duration: 2.4,
      tags: ["meeting"]
    },
    results: {
      channels: [
        {
          detected_language: "en",
          alternatives: [
            {
              transcript: "hello world",
              confidence: 0.93,
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
                  confidence: 0.95
                }
              ],
              summaries: [{ summary: "Greeting" }]
            }
          ]
        }
      ],
      utterances: [
        {
          transcript: "hello world",
          start: 0,
          end: 1.2,
          confidence: 0.92,
          speaker: 0,
          words: [
            {
              word: "hello",
              start: 0,
              end: 0.5,
              confidence: 0.91
            }
          ]
        }
      ]
    }
  }
}

describe("DeepgramAdapter", () => {
  let client: MockAxiosClient

  beforeEach(() => {
    client = {
      post: vi.fn(),
      get: vi.fn()
    }
    vi.mocked(axios.create).mockReturnValue(client as unknown as ReturnType<typeof axios.create>)
    wsInstances.length = 0
  })

  it("maps unified URL transcription options and normalizes synchronous results", async () => {
    client.post.mockResolvedValue({
      data: deepgramTranscriptResponse()
    })

    const adapter = new DeepgramAdapter()
    adapter.initialize({
      apiKey: "secret",
      region: DeepgramRegion.eu
    })

    const result = await adapter.transcribe(
      {
        type: "url",
        url: "https://example.com/audio.mp3"
      },
      {
        model: "nova-3",
        language: "en",
        languageDetection: true,
        diarization: true,
        summarization: true,
        sentimentAnalysis: true,
        entityDetection: true,
        piiRedaction: true,
        customVocabulary: ["Meeting BaaS", "SDK"],
        deepgram: {
          punctuate: false,
          smart_format: false,
          paragraphs: true
        }
      }
    )

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: "https://api.eu.deepgram.com/v1",
        headers: expect.objectContaining({
          Authorization: "Token secret",
          "Content-Type": "application/json"
        })
      })
    )
    expect(client.post).toHaveBeenCalledWith(
      "/listen",
      { url: "https://example.com/audio.mp3" },
      {
        params: {
          punctuate: false,
          utterances: true,
          smart_format: false,
          paragraphs: true,
          model: "nova-3",
          language: "en",
          detect_language: true,
          diarize: true,
          keywords: ["Meeting BaaS", "SDK"],
          summarize: true,
          sentiment: true,
          detect_entities: true,
          redact: ["pci", "pii"]
        }
      }
    )
    expect(result).toMatchObject({
      success: true,
      provider: "deepgram",
      data: {
        id: "dg-1",
        text: "hello world",
        confidence: 0.93,
        status: "completed",
        language: "en",
        duration: 2.4,
        speakers: [{ id: "0", label: "Speaker 0" }],
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
            confidence: 0.95
          }
        ],
        utterances: [
          {
            text: "hello world",
            start: 0,
            end: 1.2,
            speaker: "0",
            confidence: 0.92
          }
        ],
        summary: "Greeting"
      },
      extended: {
        requestId: "dg-1",
        sha256: "sha-1",
        tags: ["meeting"]
      },
      tracking: {
        requestId: "dg-1",
        audioHash: "sha-1"
      }
    })
  })

  it("returns a queued acknowledgement for callback mode", async () => {
    client.post.mockResolvedValue({
      data: {
        request_id: "dg-callback-1"
      }
    })

    const adapter = new DeepgramAdapter()
    adapter.initialize({ apiKey: "secret" })

    const result = await adapter.transcribe(
      {
        type: "url",
        url: "https://example.com/audio.mp3"
      },
      {
        webhookUrl: "https://example.com/webhook"
      }
    )

    expect(client.post).toHaveBeenCalledWith(
      "/listen",
      { url: "https://example.com/audio.mp3" },
      {
        params: {
          callback: "https://example.com/webhook",
          punctuate: true,
          smart_format: true,
          utterances: true
        }
      }
    )
    expect(result).toEqual({
      success: true,
      provider: "deepgram",
      data: {
        id: "dg-callback-1",
        text: "",
        status: "queued"
      },
      tracking: {
        requestId: "dg-callback-1"
      },
      raw: {
        request_id: "dg-callback-1"
      }
    })
  })

  it("rejects unsupported stream audio input before making an API request", async () => {
    const adapter = new DeepgramAdapter()
    adapter.initialize({ apiKey: "secret" })

    const result = await adapter.transcribe({
      type: "stream",
      stream: new ReadableStream()
    })

    expect(result).toEqual({
      success: false,
      provider: "deepgram",
      error: {
        code: "INVALID_INPUT",
        message:
          "Deepgram adapter does not support stream type for pre-recorded transcription. Use transcribeStream() for real-time streaming."
      }
    })
    expect(client.post).not.toHaveBeenCalled()
  })

  it("uses request history for getTranscript and listTranscripts when projectId is configured", async () => {
    client.get
      .mockResolvedValueOnce({
        data: {
          request: {
            request_id: "dg-history-1",
            response: deepgramTranscriptResponse()
          }
        }
      })
      .mockResolvedValueOnce({
        data: {
          page: 1,
          limit: 10,
          requests: [
            {
              request_id: "dg-history-2",
              created: "2026-06-24T00:00:00Z",
              path: "/v1/listen",
              api_key_id: "key-1",
              deployment: "dg",
              callback: "https://example.com/webhook",
              code: 200
            },
            {
              request_id: "dg-history-failed",
              created: "2026-06-24T00:02:00Z",
              path: "/v1/listen",
              code: 500
            }
          ]
        }
      })

    const adapter = new DeepgramAdapter()
    adapter.initialize({
      apiKey: "secret",
      projectId: "project-1"
    })

    await expect(adapter.getTranscript("dg-history-1")).resolves.toMatchObject({
      success: true,
      provider: "deepgram",
      data: {
        id: "dg-1",
        text: "hello world",
        status: "completed"
      }
    })
    expect(client.get).toHaveBeenCalledWith("/projects/project-1/requests/dg-history-1")

    await expect(
      adapter.listTranscripts({
        limit: 10,
        status: "completed",
        afterDate: "2026-06-01",
        beforeDate: "2026-06-24"
      })
    ).resolves.toMatchObject({
      hasMore: false,
      transcripts: [
        {
          success: true,
          provider: "deepgram",
          data: {
            id: "dg-history-2",
            text: "",
            status: "completed",
            metadata: {
              createdAt: "2026-06-24T00:00:00Z",
              apiPath: "/v1/listen",
              apiKeyId: "key-1",
              deployment: "dg",
              callbackUrl: "https://example.com/webhook",
              responseCode: 200
            }
          }
        },
        {
          success: false,
          provider: "deepgram",
          data: {
            id: "dg-history-failed",
            status: "error"
          },
          error: {
            code: "REQUEST_FAILED",
            message: "Request failed with status code 500"
          }
        }
      ]
    })
    expect(client.get).toHaveBeenCalledWith("/projects/project-1/requests", {
      params: {
        endpoint: "listen",
        limit: 10,
        start: "2026-06-01",
        end: "2026-06-24",
        status: "succeeded"
      }
    })
  })

  it("reports missing projectId before calling request history APIs", async () => {
    const adapter = new DeepgramAdapter()
    adapter.initialize({ apiKey: "secret" })

    await expect(adapter.getTranscript("dg-1")).resolves.toMatchObject({
      success: false,
      provider: "deepgram",
      error: {
        code: "MISSING_PROJECT_ID"
      }
    })
    await expect(adapter.listTranscripts()).resolves.toMatchObject({
      hasMore: false,
      transcripts: [
        {
          success: false,
          provider: "deepgram",
          error: {
            code: "MISSING_PROJECT_ID"
          }
        }
      ]
    })
    expect(client.get).not.toHaveBeenCalled()
  })

  it("streams audio over a mapped WebSocket connection and normalizes provider events", async () => {
    const onOpen = vi.fn()
    const onRawMessage = vi.fn()
    const onTranscript = vi.fn()
    const onUtterance = vi.fn()
    const onSpeechStart = vi.fn()
    const onSpeechEnd = vi.fn()
    const onMetadata = vi.fn()
    const onError = vi.fn()
    const onClose = vi.fn()

    const adapter = new DeepgramAdapter()
    adapter.initialize({
      apiKey: "secret",
      region: DeepgramRegion.eu
    })

    const sessionPromise = adapter.transcribeStream(
      {
        encoding: "linear16",
        sampleRate: 16000,
        language: "en",
        model: "nova-3",
        interimResults: true,
        diarization: true,
        piiRedaction: true,
        customVocabulary: ["Meeting BaaS", "SDK"],
        endpointing: 500,
        deepgramStreaming: {
          punctuate: false,
          smartFormat: true,
          fillerWords: true,
          keyterm: ["TypeScript"],
          tag: ["stream-test"]
        }
      },
      {
        onOpen,
        onRawMessage,
        onTranscript,
        onUtterance,
        onSpeechStart,
        onSpeechEnd,
        onMetadata,
        onError,
        onClose
      }
    )

    const ws = wsInstances[0]
    expect(ws).toBeDefined()
    if (!ws) throw new Error("Expected Deepgram WebSocket instance")

    const url = new URL(ws.url)
    expect(`${url.origin}${url.pathname}`).toBe("wss://api.eu.deepgram.com/v1/listen")
    expect(url.searchParams.get("encoding")).toBe("linear16")
    expect(url.searchParams.get("sample_rate")).toBe("16000")
    expect(url.searchParams.get("language")).toBe("en")
    expect(url.searchParams.get("model")).toBe("nova-3")
    expect(url.searchParams.get("interim_results")).toBe("true")
    expect(url.searchParams.get("diarize")).toBe("true")
    expect(url.searchParams.get("punctuate")).toBe("false")
    expect(url.searchParams.get("smart_format")).toBe("true")
    expect(url.searchParams.get("filler_words")).toBe("true")
    expect(url.searchParams.get("endpointing")).toBe("500")
    expect(url.searchParams.getAll("keywords")).toEqual(["Meeting BaaS", "SDK"])
    expect(url.searchParams.getAll("redact")).toEqual(["pii", "pci"])
    expect(url.searchParams.getAll("keyterm")).toEqual(["TypeScript"])
    expect(url.searchParams.getAll("tag")).toEqual(["stream-test"])
    expect(ws.options).toMatchObject({
      headers: {
        Authorization: "Token secret"
      }
    })

    ws.open()
    const session = await sessionPromise
    expect(session.provider).toBe("deepgram")
    expect(session.getStatus()).toBe("open")
    expect(onOpen).toHaveBeenCalledOnce()

    ws.receive({
      type: "Results",
      channel_index: [0],
      duration: 1.2,
      start: 0,
      is_final: true,
      speech_final: true,
      channel: {
        detected_language: "en",
        alternatives: [
          {
            transcript: "hello world",
            confidence: 0.94,
            words: [
              {
                word: "hello",
                punctuated_word: "Hello",
                start: 0,
                end: 0.5,
                confidence: 0.91,
                speaker: 1
              },
              {
                word: "world",
                start: 0.6,
                end: 1.2,
                confidence: 0.9,
                speaker: 1
              }
            ]
          }
        ]
      },
      metadata: {
        request_id: "dg-stream-1",
        model_uuid: "model-1",
        model_info: {
          name: "nova-3",
          version: "1",
          arch: "nova"
        }
      }
    })
    ws.receive({
      type: "SpeechStarted",
      channel: [0],
      timestamp: 0.2
    })
    ws.receive({
      type: "UtteranceEnd",
      channel: [0],
      last_word_end: 1.2
    })
    ws.receive({
      type: "Metadata",
      transaction_key: "txn-1",
      request_id: "dg-stream-1",
      sha256: "sha-1",
      created: "2026-06-24T00:00:00Z",
      duration: 1.2,
      channels: 1
    })
    ws.receive({
      type: "Error",
      variant: "BAD_REQUEST",
      message: "Invalid stream configuration"
    })

    expect(onTranscript).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "transcript",
        text: "hello world",
        isFinal: true,
        confidence: 0.94,
        language: "en",
        words: [
          {
            word: "Hello",
            start: 0,
            end: 0.5,
            confidence: 0.91,
            speaker: "1"
          },
          {
            word: "world",
            start: 0.6,
            end: 1.2,
            confidence: 0.9,
            speaker: "1"
          }
        ]
      })
    )
    expect(onUtterance).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "hello world",
        start: 0,
        end: 1.2,
        confidence: 0.94,
        words: [
          {
            word: "Hello",
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
    expect(onSpeechStart).toHaveBeenCalledWith({
      type: "speech_start",
      timestamp: 0.2,
      channel: 0
    })
    expect(onSpeechEnd).toHaveBeenCalledWith({
      type: "speech_end",
      timestamp: 1.2,
      channel: 0
    })
    expect(onMetadata).toHaveBeenCalledWith({
      transaction_key: "txn-1",
      request_id: "dg-stream-1",
      sha256: "sha-1",
      created: "2026-06-24T00:00:00Z",
      duration: 1.2,
      channels: 1
    })
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: "Invalid stream configuration"
      })
    )
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "deepgram",
        direction: "incoming",
        messageType: "Results"
      })
    )

    const audio = new Uint8Array([1, 2, 3])
    await session.sendAudio({ data: audio, isLast: true })
    expect(ws.sent[0]).toBe(audio)
    expect(ws.sent[1]).toBe(JSON.stringify({ type: "CloseStream" }))
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "deepgram",
        direction: "outgoing",
        messageType: "audio",
        payload: expect.any(ArrayBuffer)
      })
    )
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "deepgram",
        direction: "outgoing",
        messageType: "CloseStream",
        payload: JSON.stringify({ type: "CloseStream" })
      })
    )

    await session.close()
    expect(session.getStatus()).toBe("closed")
    expect(onClose).toHaveBeenCalledWith(1000, "closed")
  })

  it("reports malformed streaming messages and blocks sends after close", async () => {
    const onRawMessage = vi.fn()
    const onError = vi.fn()

    const adapter = new DeepgramAdapter()
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
    if (!ws) throw new Error("Expected Deepgram WebSocket instance")

    ws.open()
    const session = await sessionPromise

    ws.receive("{")

    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "deepgram",
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
  })
})
