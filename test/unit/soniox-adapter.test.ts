import { beforeEach, describe, expect, it, vi } from "vitest"
import { SonioxAdapter } from "../../src/adapters/soniox-adapter"
import { SonioxAsyncModel, SonioxRealtimeModel, SonioxRegion } from "../../src/constants"
import {
  createTranscription,
  getTranscription,
  getTranscriptionTranscript,
  uploadFile
} from "../../src/generated/soniox/api/sonioxPublicAPI"

const { MockWebSocket, wsInstances } = vi.hoisted(() => {
  class MockWebSocket {
    readonly url: string
    readonly sent: unknown[] = []
    onopen?: () => void
    onmessage?: (event: { data: string }) => void
    onerror?: () => void
    onclose?: (event: { code: number; reason: string }) => void

    constructor(url: string) {
      this.url = url
      wsInstances.push(this)
    }

    send(payload: unknown): void {
      this.sent.push(payload)
    }

    open(): void {
      this.onopen?.()
    }

    receive(payload: string | Record<string, unknown>): void {
      const rawPayload = typeof payload === "string" ? payload : JSON.stringify(payload)
      this.onmessage?.({ data: rawPayload })
    }

    close(code = 1000, reason = "closed"): void {
      queueMicrotask(() => {
        this.onclose?.({ code, reason })
      })
    }
  }

  const wsInstances: MockWebSocket[] = []

  return {
    MockWebSocket,
    wsInstances
  }
})

vi.mock("../../src/generated/soniox/api/sonioxPublicAPI", () => ({
  createTranscription: vi.fn(),
  getTranscription: vi.fn(),
  getTranscriptionTranscript: vi.fn(),
  uploadFile: vi.fn()
}))

vi.mock("ws", () => ({
  default: MockWebSocket
}))

const createTranscriptionMock = vi.mocked(createTranscription)
const getTranscriptionMock = vi.mocked(getTranscription)
const getTranscriptionTranscriptMock = vi.mocked(getTranscriptionTranscript)
const uploadFileMock = vi.mocked(uploadFile)

describe("SonioxAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wsInstances.length = 0
  })

  it("maps unified URL transcription options to Soniox payload and EU auth config", async () => {
    createTranscriptionMock.mockResolvedValue({
      data: {
        id: "soniox-1",
        status: "queued",
        created_at: "2026-06-24T00:00:00Z",
        model: SonioxAsyncModel.stt_async_v5,
        filename: "remote.mp3",
        enable_speaker_diarization: true,
        enable_language_identification: true,
        audio_duration_ms: 1250
      },
      status: 200
    } as Awaited<ReturnType<typeof createTranscription>>)

    const adapter = new SonioxAdapter()
    adapter.initialize({
      apiKey: "secret",
      region: SonioxRegion.eu
    })

    const result = await adapter.transcribe(
      {
        type: "url",
        url: "https://example.com/audio.mp3"
      },
      {
        model: SonioxAsyncModel.stt_async_v5,
        language: "en",
        diarization: true,
        languageDetection: true,
        customVocabulary: ["Meeting BaaS", "SDK"],
        webhookUrl: "https://example.com/webhook",
        soniox: {
          language_hints: ["fr"],
          language_hints_strict: true,
          webhook_auth_header_name: "x-hook-secret",
          webhook_auth_header_value: "hook-secret",
          client_reference_id: "meeting-1"
        }
      }
    )

    expect(createTranscriptionMock).toHaveBeenCalledWith(
      {
        model: SonioxAsyncModel.stt_async_v5,
        audio_url: "https://example.com/audio.mp3",
        language_hints: ["en"],
        language_hints_strict: true,
        enable_speaker_diarization: true,
        enable_language_identification: true,
        context: {
          terms: ["Meeting BaaS", "SDK"]
        },
        webhook_url: "https://example.com/webhook",
        webhook_auth_header_name: "x-hook-secret",
        webhook_auth_header_value: "hook-secret",
        client_reference_id: "meeting-1"
      },
      expect.objectContaining({
        baseURL: "https://api.eu.soniox.com",
        headers: expect.objectContaining({
          Authorization: "Bearer secret",
          "Content-Type": "application/json"
        })
      })
    )
    expect(result).toMatchObject({
      success: true,
      provider: "soniox",
      data: {
        id: "soniox-1",
        text: "",
        status: "queued",
        duration: 1.25
      }
    })
  })

  it("uploads file audio before creating a transcription", async () => {
    uploadFileMock.mockResolvedValue({
      data: {
        id: "file-1",
        filename: "meeting.wav",
        size: 3,
        created_at: "2026-06-24T00:00:00Z"
      },
      status: 200
    } as Awaited<ReturnType<typeof uploadFile>>)
    createTranscriptionMock.mockResolvedValue({
      data: {
        id: "soniox-file-1",
        status: "queued",
        created_at: "2026-06-24T00:00:01Z",
        model: "stt-async-v5",
        filename: "meeting.wav",
        enable_speaker_diarization: false,
        enable_language_identification: false
      },
      status: 200
    } as Awaited<ReturnType<typeof createTranscription>>)

    const adapter = new SonioxAdapter()
    adapter.initialize({ apiKey: "secret" })

    const result = await adapter.transcribe(
      {
        type: "file",
        file: new Uint8Array([1, 2, 3]),
        filename: "meeting.wav",
        mimeType: "audio/wav"
      },
      {
        webhookUrl: "https://example.com/webhook"
      }
    )

    const uploadBody = uploadFileMock.mock.calls[0]?.[0] as Parameters<typeof uploadFile>[0]
    expect(uploadBody.file).toBeInstanceOf(Blob)
    expect(uploadBody.file.size).toBe(3)
    expect(uploadBody.file.type).toBe("audio/wav")
    expect(createTranscriptionMock).toHaveBeenCalledWith(
      {
        model: "stt-async-v5",
        file_id: "file-1",
        language_hints: undefined,
        enable_speaker_diarization: undefined,
        enable_language_identification: undefined,
        context: undefined,
        webhook_url: "https://example.com/webhook"
      },
      expect.any(Object)
    )
    expect(result).toMatchObject({
      success: true,
      provider: "soniox",
      data: {
        id: "soniox-file-1",
        status: "queued"
      }
    })
  })

  it("rejects unsupported stream audio input before making generated API calls", async () => {
    const adapter = new SonioxAdapter()
    adapter.initialize({ apiKey: "secret" })

    const result = await adapter.transcribe({
      type: "stream",
      stream: new ReadableStream()
    })

    expect(result).toEqual({
      success: false,
      provider: "soniox",
      error: {
        code: "INVALID_INPUT",
        message: "Soniox only supports URL and File audio input"
      }
    })
    expect(uploadFileMock).not.toHaveBeenCalled()
    expect(createTranscriptionMock).not.toHaveBeenCalled()
  })

  it("normalizes completed transcript metadata and tokens", async () => {
    getTranscriptionMock.mockResolvedValue({
      data: {
        id: "soniox-2",
        status: "completed",
        created_at: "2026-06-24T00:00:00Z",
        model: SonioxAsyncModel.stt_async_v5,
        filename: "remote.mp3",
        enable_speaker_diarization: true,
        enable_language_identification: true,
        audio_duration_ms: 3210
      },
      status: 200
    } as Awaited<ReturnType<typeof getTranscription>>)
    getTranscriptionTranscriptMock.mockResolvedValue({
      data: {
        id: "soniox-2",
        text: "hello world",
        tokens: [
          {
            text: "hello",
            start_ms: 0,
            end_ms: 500,
            confidence: 0.91,
            speaker: "1",
            language: "en"
          },
          {
            text: "world",
            start_ms: 600,
            end_ms: 1200,
            confidence: 0.89,
            speaker: "2",
            language: "en"
          }
        ]
      },
      status: 200
    } as Awaited<ReturnType<typeof getTranscriptionTranscript>>)

    const adapter = new SonioxAdapter()
    adapter.initialize({ apiKey: "secret" })

    await expect(adapter.getTranscript("soniox-2")).resolves.toMatchObject({
      success: true,
      provider: "soniox",
      data: {
        id: "soniox-2",
        text: "hello world",
        status: "completed",
        language: "en",
        duration: 3.21,
        speakers: [
          { id: "1", label: "Speaker 1" },
          { id: "2", label: "Speaker 2" }
        ],
        words: [
          {
            word: "hello",
            start: 0,
            end: 0.5,
            confidence: 0.91,
            speaker: "1"
          },
          {
            word: "world",
            start: 0.6,
            end: 1.2,
            confidence: 0.89,
            speaker: "2"
          }
        ],
        utterances: [
          {
            text: "hello",
            start: 0,
            end: 0.5,
            speaker: "1"
          },
          {
            text: "world",
            start: 0.6,
            end: 1.2,
            speaker: "2"
          }
        ]
      },
      tracking: {
        requestId: "soniox-2"
      }
    })
    expect(getTranscriptionMock).toHaveBeenCalledWith("soniox-2", expect.any(Object))
    expect(getTranscriptionTranscriptMock).toHaveBeenCalledWith("soniox-2", expect.any(Object))
  })

  it("streams realtime audio and normalizes Soniox token events", async () => {
    const onOpen = vi.fn()
    const onRawMessage = vi.fn()
    const onTranscript = vi.fn()
    const onUtterance = vi.fn()
    const onError = vi.fn()
    const onClose = vi.fn()

    const adapter = new SonioxAdapter()
    adapter.initialize({
      apiKey: "secret",
      region: SonioxRegion.jp
    })

    const sessionPromise = adapter.transcribeStream(
      {
        language: "en",
        diarization: true,
        languageDetection: true,
        sonioxStreaming: {
          model: SonioxRealtimeModel.stt_rt_v5,
          audioFormat: "pcm_s16le",
          sampleRate: 48000,
          numChannels: 2,
          languageHints: ["en", "es"],
          languageHintsStrict: true,
          enableLanguageIdentification: true,
          enableEndpointDetection: true,
          maxEndpointDelayMs: 1200,
          enableSpeakerDiarization: true,
          context: {
            terms: ["Meeting BaaS"],
            text: "Product discussion"
          },
          translation: {
            type: "one_way",
            target_language: "fr"
          },
          clientReferenceId: "call-1"
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
    if (!ws) throw new Error("Expected Soniox WebSocket instance")

    const url = new URL(ws.url)
    expect(`${url.origin}${url.pathname}`).toBe("wss://stt-rt.jp.soniox.com/transcribe-websocket")
    expect(url.searchParams.get("api_key")).toBe("secret")
    expect(url.searchParams.get("model")).toBe(SonioxRealtimeModel.stt_rt_v5)
    expect(url.searchParams.get("audio_format")).toBe("pcm_s16le")
    expect(url.searchParams.get("sample_rate")).toBe("48000")
    expect(url.searchParams.get("num_channels")).toBe("2")
    expect(JSON.parse(url.searchParams.get("language_hints") || "[]")).toEqual(["en", "es"])
    expect(url.searchParams.get("language_hints_strict")).toBe("true")
    expect(url.searchParams.get("enable_language_identification")).toBe("true")
    expect(url.searchParams.get("enable_endpoint_detection")).toBe("true")
    expect(url.searchParams.get("max_endpoint_delay_ms")).toBe("1200")
    expect(url.searchParams.get("enable_speaker_diarization")).toBe("true")
    expect(JSON.parse(url.searchParams.get("context") || "{}")).toEqual({
      terms: ["Meeting BaaS"],
      text: "Product discussion"
    })
    expect(JSON.parse(url.searchParams.get("translation") || "{}")).toEqual({
      type: "one_way",
      target_language: "fr"
    })
    expect(url.searchParams.get("client_reference_id")).toBe("call-1")

    ws.open()
    const session = await sessionPromise
    expect(session.provider).toBe("soniox")
    expect(session.getStatus()).toBe("open")
    expect(onOpen).toHaveBeenCalledOnce()

    ws.receive({
      text: "hello",
      tokens: [
        {
          text: "hello",
          start_ms: 0,
          end_ms: 500,
          confidence: 0.91,
          is_final: false,
          speaker: "1",
          language: "en"
        }
      ],
      final_audio_proc_ms: 0,
      total_audio_proc_ms: 500
    })
    ws.receive({
      text: "hello world",
      tokens: [
        {
          text: "hello",
          start_ms: 0,
          end_ms: 500,
          confidence: 0.91,
          is_final: true,
          speaker: "1",
          language: "en"
        },
        {
          text: "world",
          start_ms: 600,
          end_ms: 1200,
          confidence: 0.9,
          is_final: true,
          speaker: "1",
          language: "en"
        }
      ],
      final_audio_proc_ms: 1200,
      total_audio_proc_ms: 1200
    })
    ws.receive({
      text: "",
      tokens: [],
      final_audio_proc_ms: 1200,
      total_audio_proc_ms: 1200,
      error_code: 401,
      error_message: "Invalid API key"
    })
    ws.receive({
      text: "",
      tokens: [],
      final_audio_proc_ms: 1200,
      total_audio_proc_ms: 1200,
      finished: true
    })

    expect(onTranscript).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "transcript",
        text: "hello",
        isFinal: false,
        speaker: "1",
        language: "en",
        confidence: 0.91
      })
    )
    expect(onTranscript).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "transcript",
        text: "hello world",
        isFinal: true,
        speaker: "1",
        language: "en",
        words: [
          {
            word: "hello",
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
        speaker: "1"
      })
    )
    expect(onError).toHaveBeenCalledWith({
      code: "401",
      message: "Invalid API key"
    })
    expect(onClose).toHaveBeenCalledWith(1000, "Transcription complete")
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "soniox",
        direction: "incoming",
        messageType: "final_tokens"
      })
    )

    await session.sendAudio({ data: new Uint8Array([1, 2, 3]) })
    expect(ws.sent[0]).toEqual(new Uint8Array([1, 2, 3]))
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "soniox",
        direction: "outgoing",
        messageType: "audio",
        payload: new Uint8Array([1, 2, 3]).buffer
      })
    )

    await session.close()
    await Promise.resolve()
    expect(session.getStatus()).toBe("closed")
    expect(onClose).toHaveBeenCalledWith(1000, "Client requested close")
  })

  it("reports malformed realtime messages and blocks audio after close", async () => {
    const onError = vi.fn()

    const adapter = new SonioxAdapter()
    adapter.initialize({ apiKey: "secret" })

    const sessionPromise = adapter.transcribeStream({}, { onError })
    const ws = wsInstances[0]
    expect(ws).toBeDefined()
    if (!ws) throw new Error("Expected Soniox WebSocket instance")

    ws.open()
    const session = await sessionPromise
    ws.receive("{")

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "PARSE_ERROR"
      })
    )

    await session.close()
    await Promise.resolve()

    await expect(session.sendAudio({ data: Buffer.from([1]) })).rejects.toThrow(
      "Session is not open"
    )
  })
})
