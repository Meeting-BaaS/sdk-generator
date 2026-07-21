import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AzureSTTAdapter } from "../../src/adapters/azure-stt-adapter"
import {
  transcriptionsCreate,
  transcriptionsDelete,
  transcriptionsGet,
  transcriptionsList,
  transcriptionsListFiles,
  webHooksCreate,
  webHooksDelete,
  webHooksList
} from "../../src/generated/azure/api/speechServicesAPIVersion32"
import { FileKind } from "../../src/generated/azure/schema/fileKind"
import { Status as AzureStatus } from "../../src/generated/azure/schema/status"

vi.mock("axios", () => ({
  default: {
    get: vi.fn()
  }
}))

vi.mock("../../src/generated/azure/api/speechServicesAPIVersion32", () => ({
  transcriptionsCreate: vi.fn(),
  transcriptionsDelete: vi.fn(),
  transcriptionsGet: vi.fn(),
  transcriptionsList: vi.fn(),
  transcriptionsListFiles: vi.fn(),
  webHooksCreate: vi.fn(),
  webHooksDelete: vi.fn(),
  webHooksList: vi.fn()
}))

const createMock = vi.mocked(transcriptionsCreate)
const getMock = vi.mocked(transcriptionsGet)
const listMock = vi.mocked(transcriptionsList)
const listFilesMock = vi.mocked(transcriptionsListFiles)
const deleteMock = vi.mocked(transcriptionsDelete)
const createWebhookMock = vi.mocked(webHooksCreate)
const deleteWebhookMock = vi.mocked(webHooksDelete)
const listWebhooksMock = vi.mocked(webHooksList)
const axiosGetMock = vi.mocked(axios.get)

function completedTranscription() {
  return {
    self: "https://westus.api.cognitive.microsoft.com/speechtotext/v3.2/transcriptions/az-1",
    locale: "en-US",
    displayName: "SDK Transcription",
    status: AzureStatus.Succeeded,
    createdDateTime: "2026-06-24T00:00:00Z",
    lastActionDateTime: "2026-06-24T00:01:00Z",
    links: {
      files:
        "https://westus.api.cognitive.microsoft.com/speechtotext/v3.2/transcriptions/az-1/files"
    }
  }
}

function azureTranscriptionResult() {
  return {
    combinedRecognizedPhrases: [{ display: "hello world" }],
    recognizedPhrases: [
      {
        speaker: 1,
        nBest: [
          {
            confidence: 0.93,
            words: [
              {
                word: "hello",
                offsetInTicks: 0,
                durationInTicks: 5_000_000,
                confidence: 0.91
              },
              {
                word: "world",
                offsetInTicks: 6_000_000,
                durationInTicks: 6_000_000,
                confidence: 0.9
              }
            ]
          }
        ]
      }
    ],
    duration: 12_000_000
  }
}

describe("AzureSTTAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("maps URL transcription options through the generated v3.2 client and normalizes results", async () => {
    createMock.mockResolvedValue({
      data: {
        self: "https://westus.api.cognitive.microsoft.com/speechtotext/v3.2/transcriptions/az-1",
        locale: "en-US",
        displayName: "SDK Transcription",
        status: AzureStatus.Running
      },
      status: 201
    } as Awaited<ReturnType<typeof transcriptionsCreate>>)
    getMock.mockResolvedValue({
      data: completedTranscription(),
      status: 200
    } as Awaited<ReturnType<typeof transcriptionsGet>>)
    listFilesMock.mockResolvedValue({
      data: {
        values: [
          {
            kind: FileKind.Transcription,
            links: {
              contentUrl: "https://blob.example.com/az-1.json"
            }
          }
        ]
      },
      status: 200
    } as Awaited<ReturnType<typeof transcriptionsListFiles>>)
    axiosGetMock.mockResolvedValue({
      data: azureTranscriptionResult()
    })

    const adapter = new AzureSTTAdapter()
    adapter.initialize({ apiKey: "secret", region: "westus" })

    const result = await adapter.transcribe(
      {
        type: "url",
        url: "https://example.com/audio.wav"
      },
      {
        language: "en-US",
        diarization: true,
        speakersExpected: 2,
        wordTimestamps: false,
        azure: {
          displayName: "Board meeting",
          description: "Quarterly planning",
          customProperties: {
            owner: "sdk"
          },
          properties: {
            channels: [0],
            displayFormWordLevelTimestampsEnabled: true,
            languageIdentification: {
              candidateLocales: ["en-US", "fr-FR"]
            }
          }
        }
      }
    )

    expect(createMock).toHaveBeenCalledWith(
      {
        displayName: "Board meeting",
        description: "Quarterly planning",
        locale: "en-US",
        contentUrls: ["https://example.com/audio.wav"],
        customProperties: {
          owner: "sdk"
        },
        properties: {
          wordLevelTimestampsEnabled: false,
          displayFormWordLevelTimestampsEnabled: true,
          channels: [0],
          languageIdentification: {
            candidateLocales: ["en-US", "fr-FR"]
          },
          punctuationMode: "DictatedAndAutomatic",
          profanityFilterMode: "Masked",
          diarizationEnabled: true,
          diarization: {
            speakers: {
              minCount: 1,
              maxCount: 2
            }
          }
        }
      },
      expect.objectContaining({
        baseURL: "https://westus.api.cognitive.microsoft.com/speechtotext/v3.2",
        headers: {
          "Ocp-Apim-Subscription-Key": "secret",
          "Content-Type": "application/json"
        }
      })
    )
    expect(listFilesMock).toHaveBeenCalledWith(
      "az-1",
      undefined,
      expect.objectContaining({
        baseURL: "https://westus.api.cognitive.microsoft.com/speechtotext/v3.2"
      })
    )
    expect(axiosGetMock).toHaveBeenCalledWith("https://blob.example.com/az-1.json")
    expect(result).toMatchObject({
      success: true,
      provider: "azure-stt",
      data: {
        id: "az-1",
        text: "hello world",
        confidence: 0.93,
        status: "completed",
        language: "en-US",
        duration: 1.2,
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
            speaker: "1"
          }
        ],
        createdAt: "2026-06-24T00:00:00Z",
        completedAt: "2026-06-24T00:01:00Z"
      },
      tracking: {
        requestId: "az-1"
      }
    })
  })

  it("rejects non-URL audio input before calling the generated API", async () => {
    const adapter = new AzureSTTAdapter()
    adapter.initialize({ apiKey: "secret" })

    const result = await adapter.transcribe({
      type: "file",
      file: new Uint8Array([1, 2, 3]),
      filename: "audio.wav"
    })

    expect(result).toEqual({
      success: false,
      provider: "azure-stt",
      error: {
        code: "INVALID_INPUT",
        message: "Azure Speech-to-Text batch transcription only supports URL input"
      }
    })
    expect(createMock).not.toHaveBeenCalled()
  })

  it("returns processing status without fetching result files", async () => {
    getMock.mockResolvedValue({
      data: {
        self: "https://eastus.api.cognitive.microsoft.com/speechtotext/v3.2/transcriptions/az-running-1",
        locale: "en-US",
        displayName: "SDK Transcription",
        status: AzureStatus.Running,
        createdDateTime: "2026-06-24T00:00:00Z"
      },
      status: 200
    } as Awaited<ReturnType<typeof transcriptionsGet>>)

    const adapter = new AzureSTTAdapter()
    adapter.initialize({ apiKey: "secret" })

    await expect(adapter.getTranscript("az-running-1")).resolves.toMatchObject({
      success: true,
      provider: "azure-stt",
      data: {
        id: "az-running-1",
        text: "",
        status: "processing",
        language: "en-US",
        createdAt: "2026-06-24T00:00:00Z"
      }
    })
    expect(listFilesMock).not.toHaveBeenCalled()
  })

  it("returns no-results when a completed transcription has no result file link", async () => {
    getMock.mockResolvedValue({
      data: {
        self: "https://eastus.api.cognitive.microsoft.com/speechtotext/v3.2/transcriptions/az-empty-1",
        locale: "en-US",
        displayName: "SDK Transcription",
        status: AzureStatus.Succeeded
      },
      status: 200
    } as Awaited<ReturnType<typeof transcriptionsGet>>)

    const adapter = new AzureSTTAdapter()
    adapter.initialize({ apiKey: "secret" })

    await expect(adapter.getTranscript("az-empty-1")).resolves.toEqual({
      success: false,
      provider: "azure-stt",
      error: {
        code: "NO_RESULTS",
        message: "Transcription completed but no result files available"
      },
      raw: {
        self: "https://eastus.api.cognitive.microsoft.com/speechtotext/v3.2/transcriptions/az-empty-1",
        locale: "en-US",
        displayName: "SDK Transcription",
        status: AzureStatus.Succeeded
      }
    })
    expect(listFilesMock).not.toHaveBeenCalled()
  })

  it("lists transcripts with Azure OData status filters", async () => {
    listMock.mockResolvedValue({
      data: {
        values: [
          {
            self: "https://eastus.api.cognitive.microsoft.com/speechtotext/v3.2/transcriptions/az-list-1",
            locale: "en-US",
            displayName: "List item",
            description: "Sample",
            status: AzureStatus.Succeeded,
            createdDateTime: "2026-06-24T00:00:00Z",
            lastActionDateTime: "2026-06-24T00:01:00Z",
            links: {
              files:
                "https://eastus.api.cognitive.microsoft.com/speechtotext/v3.2/transcriptions/az-list-1/files"
            }
          }
        ],
        "@nextLink": "https://next.example.com"
      },
      status: 200
    } as Awaited<ReturnType<typeof transcriptionsList>>)

    const adapter = new AzureSTTAdapter()
    adapter.initialize({ apiKey: "secret" })

    await expect(
      adapter.listTranscripts({
        limit: 10,
        offset: 5,
        status: "completed",
        azure: {
          filter: "locale eq 'en-US'"
        }
      })
    ).resolves.toMatchObject({
      hasMore: true,
      transcripts: [
        {
          success: true,
          provider: "azure-stt",
          data: {
            id: "az-list-1",
            text: "",
            status: "completed",
            language: "en-US",
            metadata: {
              audioFileAvailable: false,
              displayName: "List item",
              description: "Sample",
              createdAt: "2026-06-24T00:00:00Z",
              lastActionAt: "2026-06-24T00:01:00Z",
              filesUrl:
                "https://eastus.api.cognitive.microsoft.com/speechtotext/v3.2/transcriptions/az-list-1/files"
            }
          }
        }
      ]
    })
    expect(listMock).toHaveBeenCalledWith(
      {
        top: 10,
        skip: 5,
        filter: "status eq 'Succeeded'"
      },
      expect.objectContaining({
        baseURL: "https://eastus.api.cognitive.microsoft.com/speechtotext/v3.2"
      })
    )

    listMock.mockClear()
    await adapter.listTranscripts({
      azure: {
        filter: "locale eq 'en-US'"
      }
    })
    expect(listMock).toHaveBeenCalledWith(
      {
        filter: "locale eq 'en-US'"
      },
      expect.objectContaining({
        baseURL: "https://eastus.api.cognitive.microsoft.com/speechtotext/v3.2"
      })
    )
  })

  it("deletes transcripts idempotently when Azure returns 404", async () => {
    deleteMock.mockRejectedValue({ response: { status: 404 } })

    const adapter = new AzureSTTAdapter()
    adapter.initialize({ apiKey: "secret" })

    await expect(adapter.deleteTranscript("az-missing-1")).resolves.toEqual({
      success: true
    })
    expect(deleteMock).toHaveBeenCalledWith(
      "az-missing-1",
      expect.objectContaining({
        baseURL: "https://eastus.api.cognitive.microsoft.com/speechtotext/v3.2"
      })
    )
  })

  it("creates, lists, and deletes subscription webhooks", async () => {
    createWebhookMock.mockResolvedValue({
      data: {
        self: "https://eastus.api.cognitive.microsoft.com/speechtotext/v3.2/webhooks/hook-1",
        webUrl: "https://example.com/webhook",
        displayName: "SDK Webhook",
        events: {
          transcriptionCompletion: true
        }
      },
      status: 201
    } as Awaited<ReturnType<typeof webHooksCreate>>)
    listWebhooksMock.mockResolvedValue({
      data: {
        values: [
          {
            self: "https://eastus.api.cognitive.microsoft.com/speechtotext/v3.2/webhooks/hook-1",
            webUrl: "https://example.com/webhook",
            displayName: "SDK Webhook",
            events: {
              transcriptionCompletion: true
            }
          }
        ]
      },
      status: 200
    } as Awaited<ReturnType<typeof webHooksList>>)
    deleteWebhookMock.mockResolvedValue({
      data: undefined,
      status: 204
    } as Awaited<ReturnType<typeof webHooksDelete>>)

    const adapter = new AzureSTTAdapter()
    adapter.initialize({ apiKey: "secret" })

    await expect(
      adapter.registerWebhook("https://example.com/webhook", {
        events: {
          transcriptionCompletion: true
        }
      })
    ).resolves.toMatchObject({
      self: "https://eastus.api.cognitive.microsoft.com/speechtotext/v3.2/webhooks/hook-1",
      webUrl: "https://example.com/webhook"
    })
    expect(createWebhookMock).toHaveBeenCalledWith(
      {
        webUrl: "https://example.com/webhook",
        displayName: "SDK Webhook",
        events: {
          transcriptionCompletion: true
        }
      },
      expect.objectContaining({
        baseURL: "https://eastus.api.cognitive.microsoft.com/speechtotext/v3.2"
      })
    )

    await expect(adapter.listWebhooks()).resolves.toHaveLength(1)
    expect(listWebhooksMock).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        baseURL: "https://eastus.api.cognitive.microsoft.com/speechtotext/v3.2"
      })
    )

    await expect(adapter.unregisterWebhook("hook-1")).resolves.toBeUndefined()
    expect(deleteWebhookMock).toHaveBeenCalledWith(
      "hook-1",
      expect.objectContaining({
        baseURL: "https://eastus.api.cognitive.microsoft.com/speechtotext/v3.2"
      })
    )
  })
})
