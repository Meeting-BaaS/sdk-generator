import { beforeEach, describe, expect, it, vi } from "vitest"
import { GladiaAdapter } from "../../src/adapters/gladia-adapter"
import {
  preRecordedControllerDeletePreRecordedJobV2,
  preRecordedControllerGetAudioV2,
  preRecordedControllerGetPreRecordedJobV2,
  preRecordedControllerInitPreRecordedJobV2,
  streamingControllerDeleteStreamingJobV2,
  streamingControllerInitStreamingSessionV2,
  transcriptionControllerListV2
} from "../../src/generated/gladia/api/gladiaControlAPI"

const { MockWebSocket, wsInstances } = vi.hoisted(() => {
  type MockWebSocketHandler = (...args: unknown[]) => void

  class MockWebSocket {
    static readonly CONNECTING = 0
    static readonly OPEN = 1
    static readonly CLOSING = 2
    static readonly CLOSED = 3

    readonly url: string
    readonly sent: unknown[] = []
    readyState = MockWebSocket.CONNECTING
    private readonly handlers = new Map<string, MockWebSocketHandler[]>()
    private readonly onceHandlers = new Map<string, MockWebSocketHandler[]>()

    constructor(url: string) {
      this.url = url
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

    open(): void {
      this.readyState = MockWebSocket.OPEN
      this.emit("open")
    }

    receive(payload: string | Record<string, unknown>): void {
      const rawPayload = typeof payload === "string" ? payload : JSON.stringify(payload)
      this.emit("message", Buffer.from(rawPayload))
    }

    close(code = 1000, reason = "closed"): void {
      this.readyState = MockWebSocket.CLOSING
      queueMicrotask(() => {
        this.readyState = MockWebSocket.CLOSED
        this.emit("close", code, Buffer.from(reason))
      })
    }

    terminate(): void {
      this.readyState = MockWebSocket.CLOSED
      this.emit("close", 1006, Buffer.from("terminated"))
    }

    private emit(event: string, ...args: unknown[]): void {
      const handlers = this.handlers.get(event) ?? []
      for (const handler of handlers) {
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

vi.mock("../../src/generated/gladia/api/gladiaControlAPI", () => ({
  preRecordedControllerDeletePreRecordedJobV2: vi.fn(),
  preRecordedControllerGetAudioV2: vi.fn(),
  preRecordedControllerGetPreRecordedJobV2: vi.fn(),
  preRecordedControllerInitPreRecordedJobV2: vi.fn(),
  streamingControllerDeleteStreamingJobV2: vi.fn(),
  streamingControllerInitStreamingSessionV2: vi.fn(),
  transcriptionControllerListV2: vi.fn()
}))

vi.mock("ws", () => ({
  default: MockWebSocket
}))

const initJobMock = vi.mocked(preRecordedControllerInitPreRecordedJobV2)
const initStreamingMock = vi.mocked(streamingControllerInitStreamingSessionV2)
const getJobMock = vi.mocked(preRecordedControllerGetPreRecordedJobV2)
const deleteJobMock = vi.mocked(preRecordedControllerDeletePreRecordedJobV2)
const deleteStreamingJobMock = vi.mocked(streamingControllerDeleteStreamingJobV2)
const getAudioMock = vi.mocked(preRecordedControllerGetAudioV2)
const listTranscriptionsMock = vi.mocked(transcriptionControllerListV2)

function gladiaCompletedResponse() {
  return {
    id: "gladia-2",
    request_id: "req-2",
    version: 2,
    status: "done",
    created_at: "2026-06-24T00:00:00Z",
    completed_at: "2026-06-24T00:01:00Z",
    post_session_metadata: {},
    kind: "pre-recorded",
    file: {
      source: "https://example.com/audio.wav",
      filename: "audio.wav",
      audio_duration: 1.2,
      number_of_channels: 1
    },
    request_params: {
      audio_url: "https://example.com/audio.wav"
    },
    result: {
      transcription: {
        full_transcript: "hello world",
        languages: ["en"],
        utterances: [
          {
            start: 0,
            end: 1.2,
            confidence: 0.92,
            channel: 0,
            speaker: 1,
            text: "hello world",
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
          }
        ]
      },
      summarization: {
        results: "Greeting"
      },
      named_entity_recognition: [{ entity: "world" }],
      sentiment_analysis: { sentiment: "positive" }
    },
    custom_metadata: {
      meeting_id: "m-1"
    }
  }
}

describe("GladiaAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wsInstances.length = 0
  })

  it("maps unified URL transcription options and strips deprecated language_config keys", async () => {
    initJobMock.mockResolvedValue({
      data: {
        id: "gladia-1"
      },
      status: 200
    } as Awaited<ReturnType<typeof preRecordedControllerInitPreRecordedJobV2>>)

    const adapter = new GladiaAdapter()
    adapter.initialize({ apiKey: "secret" })

    const result = await adapter.transcribe(
      {
        type: "url",
        url: "https://example.com/audio.wav"
      },
      {
        language: "en",
        codeSwitching: true,
        diarization: true,
        speakersExpected: 2,
        customVocabulary: ["Meeting BaaS", "SDK"],
        summarization: true,
        sentimentAnalysis: true,
        entityDetection: true,
        webhookUrl: "https://example.com/webhook",
        gladia: {
          custom_metadata: {
            meeting_id: "m-1"
          },
          language_config: {
            detect_language: true,
            languages: ["fr"]
          }
        } as never
      }
    )

    expect(initJobMock).toHaveBeenCalledWith(
      {
        audio_url: "https://example.com/audio.wav",
        custom_metadata: {
          meeting_id: "m-1"
        },
        language_config: {
          languages: ["en"],
          code_switching: true
        },
        diarization: true,
        diarization_config: {
          number_of_speakers: 2
        },
        custom_vocabulary: true,
        custom_vocabulary_config: {
          vocabulary: ["Meeting BaaS", "SDK"]
        },
        summarization: true,
        sentiment_analysis: true,
        named_entity_recognition: true,
        callback: true,
        callback_config: {
          url: "https://example.com/webhook"
        }
      },
      expect.objectContaining({
        baseURL: "https://api.gladia.io",
        headers: expect.objectContaining({
          "x-gladia-key": "secret",
          "Content-Type": "application/json"
        })
      })
    )
    expect(result).toEqual({
      success: true,
      provider: "gladia",
      data: {
        id: "gladia-1",
        text: "",
        status: "queued"
      },
      raw: {
        id: "gladia-1"
      }
    })
  })

  it("rejects non-URL audio input before calling the generated API", async () => {
    const adapter = new GladiaAdapter()
    adapter.initialize({ apiKey: "secret" })

    const result = await adapter.transcribe({
      type: "file",
      file: new Uint8Array([1, 2, 3]),
      filename: "audio.wav"
    })

    expect(result).toEqual({
      success: false,
      provider: "gladia",
      error: {
        code: "INVALID_INPUT",
        message:
          "Gladia adapter currently only supports URL-based audio input. Use audio.type='url'"
      }
    })
    expect(initJobMock).not.toHaveBeenCalled()
  })

  it("normalizes completed transcription results", async () => {
    getJobMock.mockResolvedValue({
      data: gladiaCompletedResponse(),
      status: 200
    } as Awaited<ReturnType<typeof preRecordedControllerGetPreRecordedJobV2>>)

    const adapter = new GladiaAdapter()
    adapter.initialize({ apiKey: "secret" })

    await expect(adapter.getTranscript("gladia-2")).resolves.toMatchObject({
      success: true,
      provider: "gladia",
      data: {
        id: "gladia-2",
        text: "hello world",
        status: "completed",
        language: "en",
        speakers: [{ id: "1", label: "Speaker 1" }],
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
        ],
        utterances: [
          {
            text: "hello world",
            start: 0,
            end: 1.2,
            speaker: "1",
            confidence: 0.92
          }
        ],
        summary: "Greeting",
        metadata: {
          sourceAudioUrl: "https://example.com/audio.wav",
          audioFileAvailable: true,
          filename: "audio.wav",
          audioDuration: 1.2
        },
        createdAt: "2026-06-24T00:00:00Z",
        completedAt: "2026-06-24T00:01:00Z"
      },
      extended: {
        entities: [{ entity: "world" }],
        sentiment: { sentiment: "positive" },
        customMetadata: {
          meeting_id: "m-1"
        }
      },
      tracking: {
        requestId: "req-2"
      }
    })
    expect(getJobMock).toHaveBeenCalledWith("gladia-2", expect.any(Object))
  })

  it("lists and normalizes transcription jobs", async () => {
    listTranscriptionsMock.mockResolvedValue({
      data: {
        first: "https://api.gladia.io/v2/transcription",
        current: "https://api.gladia.io/v2/transcription?offset=0",
        next: null,
        items: [gladiaCompletedResponse()]
      },
      status: 200
    } as Awaited<ReturnType<typeof transcriptionControllerListV2>>)

    const adapter = new GladiaAdapter()
    adapter.initialize({ apiKey: "secret" })

    await expect(
      adapter.listTranscripts({
        limit: 10,
        offset: 5,
        status: "completed",
        date: "2026-06-24",
        afterDate: "2026-06-01",
        beforeDate: "2026-06-30",
        gladia: {
          custom_metadata: {
            meeting_id: "m-1"
          }
        }
      })
    ).resolves.toMatchObject({
      hasMore: false,
      transcripts: [
        {
          success: true,
          provider: "gladia",
          data: {
            id: "gladia-2",
            text: "hello world",
            status: "completed",
            duration: 1.2,
            metadata: {
              kind: "pre-recorded",
              customMetadata: {
                meeting_id: "m-1"
              }
            }
          }
        }
      ]
    })
    expect(listTranscriptionsMock).toHaveBeenCalledWith(
      {
        custom_metadata: {
          meeting_id: "m-1"
        },
        limit: 10,
        offset: 5,
        status: ["done"],
        date: "2026-06-24",
        after_date: "2026-06-01",
        before_date: "2026-06-30"
      },
      expect.any(Object)
    )
  })

  it("deletes pre-recorded and streaming jobs idempotently", async () => {
    deleteJobMock.mockResolvedValueOnce({
      data: undefined,
      status: 204
    } as Awaited<ReturnType<typeof preRecordedControllerDeletePreRecordedJobV2>>)
    deleteStreamingJobMock.mockRejectedValueOnce({
      response: {
        status: 404
      }
    })

    const adapter = new GladiaAdapter()
    adapter.initialize({ apiKey: "secret" })

    await expect(adapter.deleteTranscript("gladia-delete-1")).resolves.toEqual({ success: true })
    expect(deleteJobMock).toHaveBeenCalledWith("gladia-delete-1", expect.any(Object))

    await expect(adapter.deleteTranscript("stream-delete-1", "streaming")).resolves.toEqual({
      success: true
    })
    expect(deleteStreamingJobMock).toHaveBeenCalledWith("stream-delete-1", expect.any(Object))
  })

  it("downloads audio files and maps 404 responses", async () => {
    const audioData = new ArrayBuffer(3)
    getAudioMock
      .mockResolvedValueOnce({
        data: audioData,
        headers: {
          "content-type": "audio/wav"
        },
        status: 200
      } as Awaited<ReturnType<typeof preRecordedControllerGetAudioV2>>)
      .mockRejectedValueOnce({
        response: {
          status: 404
        }
      })

    const adapter = new GladiaAdapter()
    adapter.initialize({ apiKey: "secret" })

    await expect(adapter.getAudioFile("gladia-audio-1")).resolves.toEqual({
      success: true,
      data: audioData,
      contentType: "audio/wav"
    })
    expect(getAudioMock).toHaveBeenCalledWith(
      "gladia-audio-1",
      expect.objectContaining({
        responseType: "arraybuffer"
      })
    )

    await expect(adapter.getAudioFile("missing-audio")).resolves.toEqual({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Audio file not found for transcript missing-audio"
      }
    })
  })

  it("streams realtime audio and dispatches Gladia WebSocket events", async () => {
    initStreamingMock.mockResolvedValue({
      data: {
        id: "live-1",
        created_at: "2026-06-24T00:00:00Z",
        url: "wss://gladia.example/live-token"
      },
      status: 201
    } as Awaited<ReturnType<typeof streamingControllerInitStreamingSessionV2>>)

    const onOpen = vi.fn()
    const onRawMessage = vi.fn()
    const onTranscript = vi.fn()
    const onUtterance = vi.fn()
    const onSpeechStart = vi.fn()
    const onSpeechEnd = vi.fn()
    const onTranslation = vi.fn()
    const onSentiment = vi.fn()
    const onEntity = vi.fn()
    const onSummarization = vi.fn()
    const onChapterization = vi.fn()
    const onAudioAck = vi.fn()
    const onLifecycle = vi.fn()
    const onError = vi.fn()
    const onClose = vi.fn()

    const adapter = new GladiaAdapter()
    adapter.initialize({
      apiKey: "secret",
      wsBaseUrl: "wss://proxy.example/live"
    })

    const utterance = {
      start: 0,
      end: 1.2,
      confidence: 0.92,
      channel: 0,
      speaker: 1,
      text: "hello world",
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
    }

    const sessionPromise = adapter.transcribeStream(
      {
        provider: "gladia",
        encoding: "wav/pcm",
        sampleRate: 16000,
        bitDepth: 16,
        channels: 2,
        model: "solaria-1",
        endpointing: 0.4,
        maximumDurationWithoutEndpointing: 8,
        languageConfig: {
          detect_language: true,
          languages: ["fr"]
        } as never,
        language: "en",
        codeSwitching: true,
        customVocabulary: ["Meeting BaaS"],
        sentimentAnalysis: true,
        entityDetection: true,
        summarization: true,
        interimResults: true,
        region: "eu-west",
        preProcessing: {
          audio_enhancer: true,
          speech_threshold: 0.5
        },
        realtimeProcessing: {
          translation: true
        },
        postProcessing: {
          chapterization: true
        },
        messagesConfig: {
          receive_partial_transcripts: true,
          receive_final_transcripts: true,
          receive_speech_events: true,
          receive_acknowledgments: true,
          receive_errors: true,
          receive_lifecycle_events: true
        }
      } as never,
      {
        onOpen,
        onRawMessage,
        onTranscript,
        onUtterance,
        onSpeechStart,
        onSpeechEnd,
        onTranslation,
        onSentiment,
        onEntity,
        onSummarization,
        onChapterization,
        onAudioAck,
        onLifecycle,
        onError,
        onClose
      }
    )

    await Promise.resolve()
    const ws = wsInstances[0]
    expect(ws).toBeDefined()
    if (!ws) throw new Error("Expected Gladia WebSocket instance")

    expect(ws.url).toBe("wss://proxy.example/live")
    expect(initStreamingMock).toHaveBeenCalledWith(
      expect.objectContaining({
        encoding: "wav/pcm",
        sample_rate: 16000,
        bit_depth: 16,
        channels: 2,
        model: "solaria-1",
        endpointing: 0.4,
        maximum_duration_without_endpointing: 8,
        language_config: {
          languages: ["en"],
          code_switching: true
        },
        pre_processing: {
          audio_enhancer: true,
          speech_threshold: 0.5
        },
        realtime_processing: {
          translation: true,
          custom_vocabulary: true,
          custom_vocabulary_config: {
            vocabulary: ["Meeting BaaS"]
          },
          sentiment_analysis: true,
          named_entity_recognition: true
        },
        post_processing: {
          chapterization: true,
          summarization: true
        },
        messages_config: {
          receive_partial_transcripts: true,
          receive_final_transcripts: true,
          receive_speech_events: true,
          receive_acknowledgments: true,
          receive_errors: true,
          receive_lifecycle_events: true
        }
      }),
      {
        region: "eu-west"
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-gladia-key": "secret"
        })
      })
    )

    ws.open()
    const session = await sessionPromise
    expect(session).toMatchObject({
      id: "live-1",
      provider: "gladia"
    })
    expect(session.getStatus()).toBe("open")
    expect(onOpen).toHaveBeenCalledOnce()

    ws.receive({
      type: "transcript",
      session_id: "live-1",
      created_at: "2026-06-24T00:00:01Z",
      data: {
        id: "utt-1",
        is_final: false,
        utterance
      }
    })
    ws.receive({
      type: "utterance",
      session_id: "live-1",
      created_at: "2026-06-24T00:00:02Z",
      data: {
        id: "utt-1",
        is_final: true,
        utterance
      }
    })
    ws.receive({
      type: "speech_start",
      session_id: "live-1",
      created_at: "2026-06-24T00:00:03Z",
      data: {
        time: 0,
        channel: 0
      }
    })
    ws.receive({
      type: "speech_end",
      session_id: "live-1",
      created_at: "2026-06-24T00:00:04Z",
      data: {
        time: 1.2,
        channel: 0
      }
    })
    ws.receive({
      type: "translation",
      session_id: "live-1",
      created_at: "2026-06-24T00:00:05Z",
      error: null,
      data: {
        utterance_id: "utt-1",
        utterance,
        original_language: "en",
        target_language: "fr",
        translated_utterance: {
          ...utterance,
          text: "bonjour monde"
        }
      }
    })
    ws.receive({
      type: "sentiment_analysis",
      session_id: "live-1",
      created_at: "2026-06-24T00:00:06Z",
      error: null,
      data: {
        utterance_id: "utt-1",
        utterance,
        results: [
          {
            sentiment: "positive",
            emotion: "joy",
            text: "hello world",
            start: 0,
            end: 1.2,
            channel: 0
          }
        ]
      }
    })
    ws.receive({
      type: "named_entity_recognition",
      session_id: "live-1",
      created_at: "2026-06-24T00:00:07Z",
      error: null,
      data: {
        utterance_id: "utt-1",
        utterance,
        results: [
          {
            entity_type: "ORG",
            text: "Meeting BaaS",
            start: 0,
            end: 1
          }
        ]
      }
    })
    ws.receive({
      type: "post_summarization",
      session_id: "live-1",
      created_at: "2026-06-24T00:00:08Z",
      error: null,
      data: {
        results: "Greeting summary"
      }
    })
    ws.receive({
      type: "audio_chunk_ack",
      session_id: "live-1",
      created_at: "2026-06-24T00:00:10Z",
      acknowledged: true,
      error: null,
      data: {
        byte_range: [0, 3],
        time_range: [0, 0.1]
      }
    })
    ws.receive({
      type: "start_session",
      session_id: "live-1",
      created_at: "2026-06-24T00:00:11Z"
    })
    ws.receive({
      type: "error",
      error: {
        code: "STREAM_ERROR",
        message: "Provider error"
      }
    })

    expect(onTranscript).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "hello world",
        isFinal: false,
        speaker: "1",
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
    expect(onUtterance).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "hello world",
        start: 0,
        end: 1.2,
        speaker: "1"
      })
    )
    expect(onSpeechStart).toHaveBeenCalledWith({
      type: "speech_start",
      timestamp: 0,
      channel: 0,
      sessionId: "live-1"
    })
    expect(onSpeechEnd).toHaveBeenCalledWith({
      type: "speech_end",
      timestamp: 1.2,
      channel: 0,
      sessionId: "live-1"
    })
    expect(onTranslation).toHaveBeenCalledWith({
      utteranceId: "utt-1",
      original: "hello world",
      targetLanguage: "fr",
      translatedText: "bonjour monde",
      isFinal: true
    })
    expect(onSentiment).toHaveBeenCalledWith({
      utteranceId: "utt-1",
      sentiment: "positive",
      confidence: undefined
    })
    expect(onEntity).toHaveBeenCalledWith({
      utteranceId: "utt-1",
      text: "Meeting BaaS",
      type: "ORG",
      start: 0,
      end: 1
    })
    expect(onSummarization).toHaveBeenCalledWith({
      summary: "Greeting summary"
    })
    // Gladia retired post-processing chapterization (2026-09); the live
    // "post_chapterization" message no longer exists upstream.
    expect(onChapterization).not.toHaveBeenCalled()
    expect(onAudioAck).toHaveBeenCalledWith({
      byteRange: [0, 3],
      timeRange: [0, 0.1],
      timestamp: "2026-06-24T00:00:10Z"
    })
    expect(onLifecycle).toHaveBeenCalledWith({
      eventType: "start_session",
      timestamp: "2026-06-24T00:00:11Z",
      sessionId: "live-1"
    })
    expect(onError).toHaveBeenCalledWith({
      code: "STREAM_ERROR",
      message: "Provider error",
      details: expect.any(Object)
    })
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "gladia",
        direction: "incoming",
        messageType: "audio_chunk_ack"
      })
    )

    await session.sendAudio({
      data: new Uint8Array([1, 2, 3]),
      isLast: true
    })
    expect(ws.sent[0]).toEqual(new Uint8Array([1, 2, 3]))
    expect(JSON.parse(ws.sent[1] as string)).toEqual({ type: "stop_recording" })
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "gladia",
        direction: "outgoing",
        messageType: "audio",
        payload: new Uint8Array([1, 2, 3]).buffer
      })
    )

    await session.close()
    expect(JSON.parse(ws.sent[2] as string)).toEqual({ type: "stop_recording" })
    await Promise.resolve()
    expect(session.getStatus()).toBe("closed")
    expect(onClose).toHaveBeenCalledWith(1000, "closed")
  })

  it("reports malformed realtime messages and blocks audio after close", async () => {
    initStreamingMock.mockResolvedValue({
      data: {
        id: "live-parse",
        created_at: "2026-06-24T00:00:00Z",
        url: "wss://gladia.example/live-token"
      },
      status: 201
    } as Awaited<ReturnType<typeof streamingControllerInitStreamingSessionV2>>)

    const onError = vi.fn()
    const onRawMessage = vi.fn()

    const adapter = new GladiaAdapter()
    adapter.initialize({ apiKey: "secret" })

    const sessionPromise = adapter.transcribeStream(
      {},
      {
        onError,
        onRawMessage
      }
    )

    await Promise.resolve()
    const ws = wsInstances[0]
    expect(ws).toBeDefined()
    if (!ws) throw new Error("Expected Gladia WebSocket instance")

    ws.open()
    const session = await sessionPromise
    ws.receive("{")

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "PARSE_ERROR",
        message: "Failed to parse WebSocket message"
      })
    )
    expect(onRawMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "gladia",
        direction: "incoming",
        messageType: "parse_error",
        payload: "{"
      })
    )

    await session.close()
    await Promise.resolve()

    await expect(session.sendAudio({ data: Buffer.from([1]) })).rejects.toThrow(
      "Cannot send audio: session is closed"
    )
  })
})
