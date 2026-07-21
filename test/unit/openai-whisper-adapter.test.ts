import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { OpenAIWhisperAdapter } from "../../src/adapters/openai-whisper-adapter"
import {
  OpenAIModel,
  OpenAIRealtimeAudioFormat,
  OpenAIRealtimeModel,
  OpenAIRealtimeTurnDetection,
  OpenAIResponseFormat
} from "../../src/constants"
import { createTranscription } from "../../src/generated/openai/api/openAIAudioRealtimeAPI"

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

vi.mock("axios", () => ({
  default: {
    get: vi.fn()
  }
}))

vi.mock("../../src/generated/openai/api/openAIAudioRealtimeAPI", () => ({
  createTranscription: vi.fn()
}))

vi.mock("ws", () => ({
  default: MockWebSocket
}))

const axiosGetMock = vi.mocked(axios.get)
const createTranscriptionMock = vi.mocked(createTranscription)

describe("OpenAIWhisperAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wsInstances.length = 0
  })

  it("fetches URL audio and maps simple transcription options", async () => {
    axiosGetMock.mockResolvedValue({
      data: new Uint8Array([1, 2, 3]).buffer
    })
    createTranscriptionMock.mockResolvedValue({
      data: {
        text: "hello world"
      },
      status: 200
    } as Awaited<ReturnType<typeof createTranscription>>)

    const adapter = new OpenAIWhisperAdapter()
    adapter.initialize({ apiKey: "secret" })

    const result = await adapter.transcribe(
      {
        type: "url",
        url: "https://example.com/audio.mp3"
      },
      {
        language: "en",
        openai: {
          prompt: "Technical meeting",
          temperature: 0.2
        }
      }
    )

    expect(axiosGetMock).toHaveBeenCalledWith("https://example.com/audio.mp3", {
      responseType: "arraybuffer"
    })
    expect(createTranscriptionMock).toHaveBeenCalledWith(
      {
        file: expect.any(Buffer),
        model: OpenAIModel["gpt-4o-transcribe"],
        prompt: "Technical meeting",
        temperature: 0.2,
        language: "en",
        response_format: OpenAIResponseFormat.json
      },
      expect.objectContaining({
        baseURL: "https://api.openai.com/v1",
        headers: expect.objectContaining({
          Authorization: "Bearer secret",
          "Content-Type": "application/json"
        })
      })
    )
    expect(result).toMatchObject({
      success: true,
      provider: "openai-whisper",
      data: {
        id: expect.stringMatching(/^openai-/),
        text: "hello world",
        status: "completed"
      },
      tracking: {
        requestId: expect.stringMatching(/^openai-/)
      }
    })
  })

  it("maps file input with word timestamps to verbose_json and normalizes words", async () => {
    createTranscriptionMock.mockResolvedValue({
      data: {
        language: "en",
        duration: 1.2,
        text: "hello world",
        words: [
          {
            word: "hello",
            start: 0,
            end: 0.5
          },
          {
            word: "world",
            start: 0.6,
            end: 1.2
          }
        ]
      },
      status: 200
    } as Awaited<ReturnType<typeof createTranscription>>)

    const adapter = new OpenAIWhisperAdapter()
    adapter.initialize({ apiKey: "secret" })

    const result = await adapter.transcribe(
      {
        type: "file",
        file: new Blob([new Uint8Array([1, 2, 3])], { type: "audio/wav" }),
        filename: "meeting.wav"
      },
      {
        model: OpenAIModel["whisper-1"],
        wordTimestamps: true
      }
    )

    expect(axiosGetMock).not.toHaveBeenCalled()
    expect(createTranscriptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        file: expect.any(Blob),
        model: OpenAIModel["whisper-1"],
        response_format: OpenAIResponseFormat.verbose_json,
        timestamp_granularities: ["word", "segment"]
      }),
      expect.any(Object)
    )
    expect(result).toMatchObject({
      success: true,
      provider: "openai-whisper",
      data: {
        text: "hello world",
        status: "completed",
        language: "en",
        duration: 1.2,
        words: [
          {
            word: "hello",
            start: 0,
            end: 0.5
          },
          {
            word: "world",
            start: 0.6,
            end: 1.2
          }
        ]
      }
    })
  })

  it("uses diarized_json for diarization and normalizes speaker segments", async () => {
    createTranscriptionMock.mockResolvedValue({
      data: {
        task: "transcribe",
        duration: 2,
        text: "hello agent",
        segments: [
          {
            type: "transcript.text.segment",
            id: "seg-1",
            start: 0,
            end: 1,
            text: "hello",
            speaker: "customer"
          },
          {
            type: "transcript.text.segment",
            id: "seg-2",
            start: 1,
            end: 2,
            text: "agent",
            speaker: "agent"
          }
        ]
      },
      status: 200
    } as Awaited<ReturnType<typeof createTranscription>>)

    const adapter = new OpenAIWhisperAdapter()
    adapter.initialize({ apiKey: "secret" })

    const result = await adapter.transcribe(
      {
        type: "file",
        file: new Blob([new Uint8Array([1])], { type: "audio/wav" }),
        filename: "meeting.wav"
      },
      {
        diarization: true,
        openai: {
          known_speaker_names: ["customer", "agent"],
          known_speaker_references: [
            "data:audio/wav;base64,customer",
            "data:audio/wav;base64,agent"
          ]
        }
      }
    )

    expect(createTranscriptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: OpenAIModel["gpt-4o-transcribe-diarize"],
        response_format: OpenAIResponseFormat.diarized_json,
        known_speaker_names: ["customer", "agent"],
        known_speaker_references: ["data:audio/wav;base64,customer", "data:audio/wav;base64,agent"]
      }),
      expect.any(Object)
    )
    expect(result).toMatchObject({
      success: true,
      provider: "openai-whisper",
      data: {
        text: "hello agent",
        status: "completed",
        duration: 2,
        speakers: [
          { id: "customer", label: "customer" },
          { id: "agent", label: "agent" }
        ],
        utterances: [
          {
            speaker: "customer",
            text: "hello",
            start: 0,
            end: 1
          },
          {
            speaker: "agent",
            text: "agent",
            start: 1,
            end: 2
          }
        ]
      }
    })
  })

  it("rejects unsupported stream audio input before fetching or transcribing", async () => {
    const adapter = new OpenAIWhisperAdapter()
    adapter.initialize({ apiKey: "secret" })

    const result = await adapter.transcribe({
      type: "stream",
      stream: new ReadableStream()
    })

    expect(result).toEqual({
      success: false,
      provider: "openai-whisper",
      error: {
        code: "INVALID_INPUT",
        message: "OpenAI Whisper only supports URL and File audio input (not stream)"
      }
    })
    expect(axiosGetMock).not.toHaveBeenCalled()
    expect(createTranscriptionMock).not.toHaveBeenCalled()
  })

  it("reports getTranscript as unsupported for synchronous transcriptions", async () => {
    const adapter = new OpenAIWhisperAdapter()
    adapter.initialize({ apiKey: "secret" })

    await expect(adapter.getTranscript("openai-1")).resolves.toEqual({
      success: false,
      provider: "openai-whisper",
      error: {
        code: "NOT_SUPPORTED",
        message:
          "OpenAI Whisper processes transcriptions synchronously. Use transcribe() method directly."
      }
    })
  })

  it("streams audio through OpenAI Realtime and normalizes transcription events", async () => {
    const onOpen = vi.fn()
    const onRawMessage = vi.fn()
    const onTranscript = vi.fn()
    const onUtterance = vi.fn()
    const onSpeechStart = vi.fn()
    const onSpeechEnd = vi.fn()
    const onMetadata = vi.fn()
    const onError = vi.fn()
    const onClose = vi.fn()

    const adapter = new OpenAIWhisperAdapter()
    adapter.initialize({ apiKey: "secret" })

    const sessionPromise = adapter.transcribeStream(
      {
        openaiStreaming: {
          model: OpenAIRealtimeModel["gpt-4o-realtime-preview"],
          inputAudioFormat: OpenAIRealtimeAudioFormat.g711_ulaw,
          turnDetection: {
            type: OpenAIRealtimeTurnDetection.server_vad,
            threshold: 0.42,
            prefixPaddingMs: 250,
            silenceDurationMs: 650
          },
          instructions: "Use meeting vocabulary"
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
    if (!ws) throw new Error("Expected OpenAI Realtime WebSocket instance")

    const url = new URL(ws.url)
    expect(`${url.origin}${url.pathname}`).toBe("wss://api.openai.com/v1/realtime")
    expect(url.searchParams.get("model")).toBe(OpenAIRealtimeModel["gpt-4o-realtime-preview"])
    expect(ws.options).toMatchObject({
      headers: {
        Authorization: "Bearer secret",
        "OpenAI-Beta": "realtime=v1"
      }
    })

    ws.open()
    const session = await sessionPromise
    expect(session.provider).toBe("openai-whisper")
    expect(session.getStatus()).toBe("open")
    expect(onOpen).toHaveBeenCalledOnce()

    expect(JSON.parse(ws.sent[0] as string)).toEqual({
      type: "session.update",
      session: {
        modalities: ["audio", "text"],
        input_audio_format: "g711_ulaw",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.42,
          prefix_padding_ms: 250,
          silence_duration_ms: 650
        },
        instructions: "Use meeting vocabulary"
      }
    })
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "openai-whisper",
        direction: "outgoing",
        payload: ws.sent[0],
        messageType: "session.update"
      })
    )

    ws.receive({
      type: "session.created",
      session: {
        id: "rt-session-1",
        object: "realtime.session",
        model: "gpt-4o-realtime-preview",
        modalities: ["audio", "text"],
        voice: "alloy",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16"
      }
    })
    ws.receive({
      type: "input_audio_buffer.speech_started",
      audio_start_ms: 250,
      item_id: "item-1"
    })
    ws.receive({
      type: "input_audio_buffer.speech_stopped",
      audio_end_ms: 1250,
      item_id: "item-1"
    })
    ws.receive({
      type: "conversation.item.input_audio_transcription.completed",
      item_id: "item-1",
      content_index: 0,
      transcript: "hello world"
    })
    ws.receive({
      type: "error",
      error: {
        type: "invalid_request_error",
        code: "bad_audio",
        message: "Invalid audio"
      }
    })

    expect(onMetadata).toHaveBeenCalledWith({
      sessionId: "rt-session-1",
      model: "gpt-4o-realtime-preview"
    })
    expect(onSpeechStart).toHaveBeenCalledWith({
      type: "speech_start",
      timestamp: 0.25,
      sessionId: "item-1"
    })
    expect(onSpeechEnd).toHaveBeenCalledWith({
      type: "speech_end",
      timestamp: 1.25,
      sessionId: "item-1"
    })
    expect(onTranscript).toHaveBeenCalledWith({
      type: "transcript",
      text: "hello world",
      isFinal: true
    })
    expect(onUtterance).toHaveBeenCalledWith({
      text: "hello world",
      start: 0,
      end: 0,
      words: []
    })
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "bad_audio",
        message: "Invalid audio"
      })
    )
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "openai-whisper",
        direction: "incoming",
        messageType: "conversation.item.input_audio_transcription.completed"
      })
    )

    await session.sendAudio({ data: new Uint8Array([1, 2, 3]), isLast: true })
    expect(JSON.parse(ws.sent[1] as string)).toEqual({
      type: "input_audio_buffer.append",
      audio: Buffer.from([1, 2, 3]).toString("base64")
    })
    expect(JSON.parse(ws.sent[2] as string)).toEqual({
      type: "input_audio_buffer.commit"
    })
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "openai-whisper",
        direction: "outgoing",
        messageType: "input_audio_buffer.append",
        payload: ws.sent[1]
      })
    )
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "openai-whisper",
        direction: "outgoing",
        messageType: "input_audio_buffer.commit",
        payload: ws.sent[2]
      })
    )

    await session.close()
    expect(JSON.parse(ws.sent[3] as string)).toEqual({
      type: "input_audio_buffer.commit"
    })
    expect(session.getStatus()).toBe("closed")
    expect(onClose).toHaveBeenCalledWith(1000, "closed")
  })

  it("reports malformed Realtime messages and blocks audio after close", async () => {
    const onRawMessage = vi.fn()
    const onError = vi.fn()

    const adapter = new OpenAIWhisperAdapter()
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
    if (!ws) throw new Error("Expected OpenAI Realtime WebSocket instance")

    ws.open()
    const session = await sessionPromise

    ws.receive("{")

    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "openai-whisper",
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
