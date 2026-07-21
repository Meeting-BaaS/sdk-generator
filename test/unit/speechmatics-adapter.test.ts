import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SpeechmaticsAdapter } from "../../src/adapters/speechmatics-adapter"
import {
  SpeechmaticsModel,
  SpeechmaticsOperatingPoint,
  SpeechmaticsRegion
} from "../../src/constants"

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

    close(): void {
      queueMicrotask(() => {
        this.onclose?.({ code: 1000, reason: "closed" })
        const handlers = this.handlers.get("close") ?? []
        this.handlers.delete("close")
        for (const handler of handlers) {
          handler(1000, Buffer.from("closed"))
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
  delete: ReturnType<typeof vi.fn>
}

function formValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return typeof value === "string" ? value : undefined
}

function transcriptResponse() {
  return {
    format: "2.9",
    job: {
      id: "sm-2",
      created_at: "2026-06-24T00:00:00Z",
      data_name: "meeting.wav",
      duration: 1.3
    },
    metadata: {
      created_at: "2026-06-24T00:00:02Z",
      type: "transcription",
      transcription_config: {
        language: "en"
      }
    },
    results: [
      {
        type: "word",
        start_time: 0,
        end_time: 0.5,
        alternatives: [
          {
            content: "hello",
            confidence: 0.91,
            language: "en",
            speaker: "S1"
          }
        ]
      },
      {
        type: "word",
        start_time: 0.6,
        end_time: 1.2,
        alternatives: [
          {
            content: "world",
            confidence: 0.89,
            language: "en",
            speaker: "S1"
          }
        ]
      },
      {
        type: "punctuation",
        start_time: 1.2,
        end_time: 1.2,
        attaches_to: "previous",
        alternatives: [
          {
            content: ".",
            confidence: 1,
            language: "en"
          }
        ]
      }
    ],
    summary: {
      content: "Greeting"
    },
    translations: {
      fr: [{ content: "bonjour le monde", start_time: 0, end_time: 1.2, speaker: "S1" }]
    },
    chapters: [
      { title: "Greeting chapter", summary: "Saying hello", start_time: 0, end_time: 1.2 }
    ],
    audio_events: [{ type: "music", start_time: 1.2, end_time: 1.3, confidence: 0.8 }],
    audio_event_summary: {
      overall: {
        music: {
          total_duration: 0.1,
          count: 1
        }
      }
    }
  }
}

describe("SpeechmaticsAdapter", () => {
  let client: MockAxiosClient

  beforeEach(() => {
    client = {
      post: vi.fn(),
      get: vi.fn(),
      delete: vi.fn()
    }
    vi.mocked(axios.create).mockReturnValue(client as unknown as ReturnType<typeof axios.create>)
    wsInstances.length = 0
  })

  it("submits URL transcription as FormData with mapped job config and regional auth", async () => {
    client.post.mockResolvedValue({
      data: {
        id: "sm-1"
      }
    })

    const adapter = new SpeechmaticsAdapter()
    adapter.initialize({
      apiKey: "secret",
      region: SpeechmaticsRegion.us1
    })

    const result = await adapter.transcribe(
      {
        type: "url",
        url: "https://example.com/audio.wav"
      },
      {
        language: "en",
        model: SpeechmaticsModel.enhanced,
        diarization: true,
        speakersExpected: 3,
        sentimentAnalysis: true,
        summarization: true,
        customVocabulary: ["Meeting BaaS", "SDK"],
        webhookUrl: "https://example.com/webhook",
        speechmatics: {
          tracking: {
            title: "Board meeting",
            reference: "meeting-123"
          },
          output_config: {
            srt_overrides: {
              max_lines: 2
            }
          },
          transcription_config: {
            domain: "finance",
            output_locale: "en-US"
          }
        }
      }
    )

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: "https://us1.asr.api.speechmatics.com/v2",
        headers: {
          Authorization: "Bearer secret"
        }
      })
    )
    expect(client.post).toHaveBeenCalledWith("/jobs", expect.any(FormData), {
      headers: {}
    })
    const formData = client.post.mock.calls[0]?.[1] as FormData
    const config = JSON.parse(formValue(formData, "config") ?? "{}")
    expect(config).toMatchObject({
      type: "transcription",
      fetch_data: {
        url: "https://example.com/audio.wav"
      },
      transcription_config: {
        language: "en",
        model: "enhanced",
        domain: "finance",
        output_locale: "en-US",
        diarization: "speaker",
        speaker_diarization_config: {
          speaker_sensitivity: 0.3
        },
        additional_vocab: [{ content: "Meeting BaaS" }, { content: "SDK" }]
      },
      sentiment_analysis_config: {},
      summarization_config: {
        summary_type: "bullets",
        summary_length: "brief"
      },
      output_config: {
        srt_overrides: {
          max_lines: 2
        }
      },
      tracking: {
        title: "Board meeting",
        reference: "meeting-123"
      },
      notification_config: [
        {
          url: "https://example.com/webhook",
          contents: ["transcript"]
        }
      ]
    })
    expect(result).toEqual({
      success: true,
      provider: "speechmatics",
      data: {
        id: "sm-1",
        text: "",
        status: "queued"
      },
      raw: {
        id: "sm-1"
      }
    })
    expect(config.transcription_config).not.toHaveProperty("operating_point")
  })

  it("uploads file audio as multipart FormData", async () => {
    client.post.mockResolvedValue({
      data: {
        id: "sm-file-1"
      }
    })

    const adapter = new SpeechmaticsAdapter()
    adapter.initialize({ apiKey: "secret" })

    const result = await adapter.transcribe(
      {
        type: "file",
        file: new Uint8Array([1, 2, 3]),
        filename: "meeting.wav"
      },
      {
        webhookUrl: "https://example.com/webhook"
      }
    )

    expect(client.post).toHaveBeenCalledWith("/jobs", expect.any(FormData), {
      headers: {}
    })
    const formData = client.post.mock.calls[0]?.[1] as FormData
    expect(formData.get("data_file")).toBeInstanceOf(Blob)
    expect(result).toMatchObject({
      success: true,
      provider: "speechmatics",
      data: {
        id: "sm-file-1",
        status: "queued"
      }
    })
  })

  it("rejects unsupported stream audio input before making an API request", async () => {
    const adapter = new SpeechmaticsAdapter()
    adapter.initialize({ apiKey: "secret" })

    const result = await adapter.transcribe({
      type: "stream",
      stream: new ReadableStream()
    })

    expect(result).toEqual({
      success: false,
      provider: "speechmatics",
      error: {
        code: "INVALID_INPUT",
        message: "Speechmatics only supports URL and File audio input"
      }
    })
    expect(client.post).not.toHaveBeenCalled()
  })

  it("returns processing status without fetching transcript until the job is done", async () => {
    client.get.mockResolvedValue({
      data: {
        job: {
          id: "sm-running-1",
          status: "running",
          created_at: "2026-06-24T00:00:00Z",
          data_name: "meeting.wav"
        }
      }
    })

    const adapter = new SpeechmaticsAdapter()
    adapter.initialize({ apiKey: "secret" })

    await expect(adapter.getTranscript("sm-running-1")).resolves.toMatchObject({
      success: true,
      provider: "speechmatics",
      data: {
        id: "sm-running-1",
        text: "",
        status: "processing",
        createdAt: "2026-06-24T00:00:00Z"
      }
    })
    expect(client.get).toHaveBeenCalledTimes(1)
    expect(client.get).toHaveBeenCalledWith("/jobs/sm-running-1")
  })

  it("normalizes completed transcript results", async () => {
    client.get
      .mockResolvedValueOnce({
        data: {
          job: {
            id: "sm-2",
            status: "done",
            created_at: "2026-06-24T00:00:00Z",
            data_name: "meeting.wav"
          }
        }
      })
      .mockResolvedValueOnce({
        data: transcriptResponse()
      })

    const adapter = new SpeechmaticsAdapter()
    adapter.initialize({ apiKey: "secret" })

    await expect(adapter.getTranscript("sm-2")).resolves.toMatchObject({
      success: true,
      provider: "speechmatics",
      data: {
        id: "sm-2",
        text: "hello world.",
        status: "completed",
        language: "en",
        duration: 1.3,
        speakers: [{ id: "S1", label: "Speaker S1" }],
        words: [
          {
            word: "hello",
            start: 0,
            end: 0.5,
            confidence: 0.91,
            speaker: "S1"
          },
          {
            word: "world",
            start: 0.6,
            end: 1.2,
            confidence: 0.89,
            speaker: "S1"
          }
        ],
        utterances: [
          {
            text: "hello world",
            start: 0,
            end: 1.2,
            speaker: "S1"
          }
        ],
        summary: "Greeting",
        createdAt: "2026-06-24T00:00:00Z"
      },
      tracking: {
        requestId: "sm-2"
      },
      extended: {
        metadata: {
          created_at: "2026-06-24T00:00:02Z",
          type: "transcription",
          transcription_config: {
            language: "en"
          }
        },
        summary: {
          content: "Greeting"
        },
        translations: {
          fr: [{ content: "bonjour le monde", start_time: 0, end_time: 1.2, speaker: "S1" }]
        },
        chapters: [
          { title: "Greeting chapter", summary: "Saying hello", start_time: 0, end_time: 1.2 }
        ],
        audio_events: [{ type: "music", start_time: 1.2, end_time: 1.3, confidence: 0.8 }],
        audio_event_summary: {
          overall: {
            music: {
              total_duration: 0.1,
              count: 1
            }
          }
        }
      }
    })
    expect(client.get).toHaveBeenNthCalledWith(1, "/jobs/sm-2")
    expect(client.get).toHaveBeenNthCalledWith(2, "/jobs/sm-2/transcript")
  })

  it("lists jobs through Speechmatics request history", async () => {
    client.get.mockResolvedValue({
      data: {
        jobs: [
          {
            id: "sm-list-1",
            status: "done",
            created_at: "2026-06-24T00:00:00Z",
            data_name: "meeting.wav",
            duration: 42
          },
          {
            id: "sm-list-failed",
            status: "rejected",
            created_at: "2026-06-24T00:01:00Z",
            data_name: "bad.wav"
          }
        ]
      }
    })

    const adapter = new SpeechmaticsAdapter()
    adapter.initialize({ apiKey: "secret" })

    await expect(
      adapter.listTranscripts?.({
        limit: 2,
        beforeDate: "2026-06-25T00:00:00Z",
        speechmatics: {
          include_deleted: true
        }
      })
    ).resolves.toMatchObject({
      hasMore: true,
      transcripts: [
        {
          success: true,
          provider: "speechmatics",
          data: {
            id: "sm-list-1",
            text: "",
            status: "completed",
            duration: 42,
            metadata: {
              createdAt: "2026-06-24T00:00:00Z",
              dataName: "meeting.wav"
            }
          }
        },
        {
          success: false,
          provider: "speechmatics",
          data: {
            id: "sm-list-failed",
            status: "error"
          },
          error: {
            code: "JOB_FAILED",
            message: "Job sm-list-failed ended with status rejected"
          }
        }
      ]
    })
    expect(client.get).toHaveBeenCalledWith("/jobs", {
      params: {
        include_deleted: true,
        limit: 2,
        created_before: "2026-06-25T00:00:00Z"
      }
    })
  })

  it("deletes jobs and treats 404 as already deleted", async () => {
    client.delete.mockResolvedValueOnce({}).mockRejectedValueOnce({
      response: {
        status: 404
      }
    })

    const adapter = new SpeechmaticsAdapter()
    adapter.initialize({ apiKey: "secret" })

    await expect(adapter.deleteTranscript("sm-delete-1", true)).resolves.toEqual({
      success: true
    })
    expect(client.delete).toHaveBeenCalledWith("/jobs/sm-delete-1", {
      params: { force: true }
    })

    await expect(adapter.deleteTranscript("sm-delete-2")).resolves.toEqual({
      success: true
    })
    expect(client.delete).toHaveBeenCalledWith("/jobs/sm-delete-2", {
      params: undefined
    })
  })

  it("streams authenticated realtime audio and normalizes transcript events", async () => {
    const onOpen = vi.fn()
    const onRawMessage = vi.fn()
    const onTranscript = vi.fn()
    const onUtterance = vi.fn()
    const onMetadata = vi.fn()
    const onError = vi.fn()
    const onClose = vi.fn()

    const adapter = new SpeechmaticsAdapter()
    adapter.initialize({
      apiKey: "secret",
      region: SpeechmaticsRegion.us1
    })

    const sessionPromise = adapter.transcribeStream(
      {
        language: "en",
        sampleRate: 16000,
        diarization: true,
        interimResults: true,
        entityDetection: true,
        customVocabulary: ["Meeting BaaS", "SDK"],
        speechmaticsStreaming: {
          region: SpeechmaticsRegion.us1,
          operatingPoint: SpeechmaticsOperatingPoint.enhanced,
          maxSpeakers: 2,
          maxDelay: 1.5,
          conversationConfig: {
            endOfUtteranceSilenceTrigger: 0.8
          }
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
    if (!ws) throw new Error("Expected Speechmatics WebSocket instance")

    expect(ws.url).toBe("wss://us1.rt.speechmatics.com/v2")
    expect(ws.options).toMatchObject({
      headers: {
        Authorization: "Bearer secret"
      }
    })

    ws.open()
    expect(JSON.parse(ws.sent[0] as string)).toMatchObject({
      message: "StartRecognition",
      audio_format: {
        type: "raw",
        encoding: "pcm_s16le",
        sample_rate: 16000
      },
      transcription_config: {
        language: "en",
        enable_entities: true,
        enable_partials: true,
        model: "enhanced",
        max_delay: 1.5,
        diarization: "speaker",
        speaker_diarization_config: {
          max_speakers: 2
        },
        additional_vocab: [{ content: "Meeting BaaS" }, { content: "SDK" }]
      },
      conversation_config: {
        end_of_utterance_silence_trigger: 0.8
      }
    })
    expect(JSON.parse(ws.sent[0] as string).transcription_config).not.toHaveProperty(
      "operating_point"
    )
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "speechmatics",
        direction: "outgoing",
        messageType: "StartRecognition"
      })
    )

    ws.receive({
      message: "RecognitionStarted",
      id: "sm-stream-1",
      language_pack_info: {
        word_delimiter: " ",
        writing_direction: "left-to-right"
      }
    })

    const session = await sessionPromise
    expect(session.provider).toBe("speechmatics")
    expect(session.getStatus()).toBe("open")
    expect(onOpen).toHaveBeenCalledOnce()
    expect(onMetadata).toHaveBeenCalledWith({
      id: "sm-stream-1",
      languagePackInfo: {
        word_delimiter: " ",
        writing_direction: "left-to-right"
      }
    })

    const transcriptPayload = {
      message: "AddTranscript",
      metadata: {
        start_time: 0,
        end_time: 1.2,
        transcript: "hello world"
      },
      channel: "1",
      results: [
        {
          type: "word",
          start_time: 0,
          end_time: 0.5,
          alternatives: [
            {
              content: "hello",
              confidence: 0.91,
              speaker: "S1"
            }
          ]
        },
        {
          type: "word",
          start_time: 0.6,
          end_time: 1.2,
          alternatives: [
            {
              content: "world",
              confidence: 0.9,
              speaker: "S1"
            }
          ]
        }
      ]
    }
    ws.receive({
      ...transcriptPayload,
      message: "AddPartialTranscript"
    })
    ws.receive(transcriptPayload)
    ws.receive({
      message: "Warning",
      type: "duration_limit_exceeded",
      reason: "Limit near"
    })
    ws.receive({
      message: "Error",
      type: "invalid_config",
      reason: "Bad config"
    })

    expect(onTranscript).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "transcript",
        text: "hello world",
        isFinal: false,
        speaker: "S1",
        confidence: 0.91,
        channel: 1
      })
    )
    expect(onTranscript).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "transcript",
        text: "hello world",
        isFinal: true,
        speaker: "S1",
        confidence: 0.91,
        channel: 1,
        words: [
          {
            word: "hello",
            start: 0,
            end: 0.5,
            confidence: 0.91,
            speaker: "S1"
          },
          {
            word: "world",
            start: 0.6,
            end: 1.2,
            confidence: 0.9,
            speaker: "S1"
          }
        ]
      })
    )
    expect(onUtterance).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "hello world",
        start: 0,
        end: 1.2,
        speaker: "S1"
      })
    )
    expect(onMetadata).toHaveBeenCalledWith({
      warning: "duration_limit_exceeded",
      reason: "Limit near"
    })
    expect(onError).toHaveBeenCalledWith({
      code: "invalid_config",
      message: "Bad config"
    })
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "speechmatics",
        direction: "incoming",
        messageType: "AddTranscript"
      })
    )

    const audio = new Uint8Array([1, 2, 3])
    await session.sendAudio({ data: audio })
    expect(ws.sent[1]).toBe(audio)
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "speechmatics",
        direction: "outgoing",
        messageType: "audio",
        payload: expect.any(ArrayBuffer)
      })
    )

    await session.close()
    expect(JSON.parse(ws.sent[2] as string)).toEqual({
      message: "EndOfStream",
      last_seq_no: 0
    })
    expect(session.getStatus()).toBe("closing")
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "speechmatics",
        direction: "outgoing",
        messageType: "EndOfStream"
      })
    )

    ws.receive({
      message: "EndOfTranscript"
    })
    expect(onClose).toHaveBeenCalledWith(1000, "Transcription complete")
  })

  it("reports malformed realtime messages and blocks audio after close", async () => {
    const onError = vi.fn()

    const adapter = new SpeechmaticsAdapter()
    adapter.initialize({ apiKey: "secret" })

    const sessionPromise = adapter.transcribeStream(
      {},
      {
        onError
      }
    )

    const ws = wsInstances[0]
    expect(ws).toBeDefined()
    if (!ws) throw new Error("Expected Speechmatics WebSocket instance")

    ws.open()
    ws.receive({
      message: "RecognitionStarted",
      id: "sm-stream-2"
    })
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
