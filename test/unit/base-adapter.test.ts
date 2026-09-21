import { describe, expect, it } from "vitest"
import { BaseAdapter } from "../../src/adapters/base-adapter"
import type {
  AudioInput,
  ProviderCapabilities,
  TranscribeOptions,
  UnifiedTranscriptResponse
} from "../../src/router/types"
import { ERROR_CODES, type ErrorCode } from "../../src/utils/errors"

const capabilities: ProviderCapabilities = {
  streaming: false,
  diarization: false,
  wordTimestamps: false,
  languageDetection: false,
  customVocabulary: false,
  summarization: false,
  sentimentAnalysis: false,
  entityDetection: false,
  piiRedaction: false,
  listTranscripts: false,
  deleteTranscript: false
}

class HarnessAdapter extends BaseAdapter {
  readonly name = "gladia" as const
  readonly capabilities = capabilities
  protected baseUrl = "https://api.default.test"
  transcriptResponses: UnifiedTranscriptResponse[] = []

  async transcribe(
    _audio: AudioInput,
    _options?: TranscribeOptions
  ): Promise<UnifiedTranscriptResponse> {
    return {
      success: true,
      provider: this.name,
      data: {
        id: "tx-1",
        status: "completed"
      }
    }
  }

  async getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse> {
    return (
      this.transcriptResponses.shift() ?? {
        success: true,
        provider: this.name,
        data: {
          id: transcriptId,
          status: "completed"
        }
      }
    )
  }

  exposeValidateConfig(): void {
    this.validateConfig()
  }

  exposeDeriveWsUrl(url: string): string {
    return this.deriveWsUrl(url)
  }

  exposeAxiosConfig(
    authHeaderName?: string,
    authHeaderValue?: (apiKey: string) => string
  ): {
    baseURL: string
    timeout: number
    headers: Record<string, string>
  } {
    return this.getAxiosConfig(authHeaderName, authHeaderValue)
  }

  exposeErrorResponse(
    error: unknown,
    statusCode?: number,
    code?: ErrorCode
  ): UnifiedTranscriptResponse {
    return this.createErrorResponse(error, statusCode, code)
  }

  exposePoll(
    transcriptId: string,
    options?: { maxAttempts?: number; intervalMs?: number }
  ): Promise<UnifiedTranscriptResponse> {
    return this.pollForCompletion(transcriptId, options)
  }
}

describe("BaseAdapter helpers", () => {
  it("validates initialization and required API keys", () => {
    const adapter = new HarnessAdapter()

    expect(() => adapter.exposeValidateConfig()).toThrow(
      "Adapter gladia is not initialized. Call initialize() first."
    )

    adapter.initialize({ apiKey: "" })
    expect(() => adapter.exposeValidateConfig()).toThrow("API key is required for gladia provider")

    adapter.initialize({ apiKey: "secret" })
    expect(() => adapter.exposeValidateConfig()).not.toThrow()
  })

  it("builds axios config with default URL, timeout, auth formatting, and custom headers", () => {
    const adapter = new HarnessAdapter()
    adapter.initialize({
      apiKey: "secret",
      baseUrl: "https://proxy.example",
      timeout: 1234,
      headers: {
        "X-Correlation-Id": "corr-1",
        "Content-Type": "application/octet-stream"
      }
    })

    expect(adapter.exposeAxiosConfig("Authorization", (apiKey) => `Bearer ${apiKey}`)).toEqual({
      baseURL: "https://proxy.example",
      timeout: 1234,
      headers: {
        Authorization: "Bearer secret",
        "Content-Type": "application/octet-stream",
        "X-Correlation-Id": "corr-1"
      }
    })
  })

  it("derives WebSocket URLs from HTTP URLs and preserves ws URLs", () => {
    const adapter = new HarnessAdapter()

    expect(adapter.exposeDeriveWsUrl("https://api.example/v1")).toBe("wss://api.example/v1")
    expect(adapter.exposeDeriveWsUrl("http://localhost:8787")).toBe("ws://localhost:8787")
    expect(adapter.exposeDeriveWsUrl("wss://stream.example/v1")).toBe("wss://stream.example/v1")
  })

  it("normalizes provider HTTP errors with semantic codes and provider messages", () => {
    const adapter = new HarnessAdapter()
    const result = adapter.exposeErrorResponse({
      message: "Request failed with status code 401",
      response: {
        status: 401,
        statusText: "Unauthorized",
        data: {
          error: {
            message: "Invalid API key"
          }
        }
      }
    })

    expect(result).toMatchObject({
      success: false,
      provider: "gladia",
      error: {
        code: ERROR_CODES.AUTHENTICATION_ERROR,
        message: "Invalid API key",
        statusCode: 401,
        details: {
          httpStatus: 401,
          httpStatusText: "Unauthorized",
          provider: "gladia"
        }
      }
    })
  })

  it("allows explicit error codes to override HTTP status mapping", () => {
    const adapter = new HarnessAdapter()
    const result = adapter.exposeErrorResponse(
      new Error("custom parse failure"),
      500,
      ERROR_CODES.PARSE_ERROR
    )

    expect(result.error).toMatchObject({
      code: ERROR_CODES.PARSE_ERROR,
      message: "custom parse failure",
      statusCode: 500
    })
  })

  it("polls until a transcript completes", async () => {
    const adapter = new HarnessAdapter()
    adapter.transcriptResponses = [
      {
        success: true,
        provider: "gladia",
        data: {
          id: "tx-1",
          status: "processing"
        }
      },
      {
        success: true,
        provider: "gladia",
        data: {
          id: "tx-1",
          status: "completed",
          text: "done"
        }
      }
    ]

    await expect(
      adapter.exposePoll("tx-1", { maxAttempts: 3, intervalMs: 0 })
    ).resolves.toMatchObject({
      success: true,
      data: {
        status: "completed",
        text: "done"
      }
    })
  })

  it("returns provider failures immediately while polling", async () => {
    const adapter = new HarnessAdapter()
    adapter.transcriptResponses = [
      {
        success: false,
        provider: "gladia",
        error: {
          code: ERROR_CODES.RATE_LIMIT,
          message: "Too many requests"
        }
      }
    ]

    await expect(
      adapter.exposePoll("tx-1", { maxAttempts: 3, intervalMs: 0 })
    ).resolves.toMatchObject({
      success: false,
      error: {
        code: ERROR_CODES.RATE_LIMIT,
        message: "Too many requests"
      }
    })
  })

  it("converts terminal error statuses and timeouts into standardized polling errors", async () => {
    const failed = new HarnessAdapter()
    failed.transcriptResponses = [
      {
        success: true,
        provider: "gladia",
        data: {
          id: "tx-1",
          status: "error"
        }
      }
    ]

    await expect(
      failed.exposePoll("tx-1", { maxAttempts: 1, intervalMs: 0 })
    ).resolves.toMatchObject({
      success: false,
      error: {
        code: ERROR_CODES.TRANSCRIPTION_ERROR,
        message: "Transcription failed"
      }
    })

    const timeout = new HarnessAdapter()
    timeout.transcriptResponses = [
      {
        success: true,
        provider: "gladia",
        data: {
          id: "tx-1",
          status: "processing"
        }
      },
      {
        success: true,
        provider: "gladia",
        data: {
          id: "tx-1",
          status: "queued"
        }
      }
    ]

    await expect(
      timeout.exposePoll("tx-1", { maxAttempts: 2, intervalMs: 0 })
    ).resolves.toMatchObject({
      success: false,
      error: {
        code: ERROR_CODES.POLLING_TIMEOUT,
        message: "Transcription did not complete after 2 attempts"
      }
    })
  })
})

describe("createErrorResponse normalization", () => {
  const initialized = () => {
    const adapter = new HarnessAdapter()
    adapter.initialize({ apiKey: "secret", timeout: 1234 })
    return adapter
  }

  it("appends Gladia validation_errors to the message and exposes them structured", () => {
    const adapter = initialized()
    const axiosError = Object.assign(new Error("Request failed with status code 400"), {
      response: {
        status: 400,
        statusText: "Bad Request",
        data: {
          statusCode: 400,
          message: "Invalid parameter(s). See validation_errors for more details.",
          validation_errors: ["audio_to_llm_config.each value in prompts must be a string"]
        }
      }
    })

    const result = adapter.exposeErrorResponse(axiosError)

    expect(result.error?.message).toBe(
      "Invalid parameter(s). See validation_errors for more details.; audio_to_llm_config.each value in prompts must be a string"
    )
    expect(result.error?.validationErrors).toEqual([
      "audio_to_llm_config.each value in prompts must be a string"
    ])
    expect(result.error?.code).toBe(ERROR_CODES.INVALID_INPUT)
    expect(result.error?.retryable).toBe(false)
  })

  it("extracts FastAPI-style detail arrays with field locations", () => {
    const adapter = initialized()
    const axiosError = Object.assign(new Error("Request failed with status code 422"), {
      response: {
        status: 422,
        data: {
          detail: [{ loc: ["body", "language_code"], msg: "value is not a valid enumeration" }]
        }
      }
    })

    const result = adapter.exposeErrorResponse(axiosError)

    expect(result.error?.validationErrors).toEqual([
      "body.language_code: value is not a valid enumeration"
    ])
    expect(result.error?.message).toContain("body.language_code: value is not a valid enumeration")
  })

  it("classifies axios timeouts as retryable CONNECTION_TIMEOUT with the timeout budget", () => {
    const adapter = initialized()
    const axiosError = Object.assign(new Error("timeout of 1234ms exceeded"), {
      code: "ECONNABORTED"
    })

    const result = adapter.exposeErrorResponse(axiosError)

    expect(result.error?.code).toBe(ERROR_CODES.CONNECTION_TIMEOUT)
    expect(result.error?.retryable).toBe(true)
    expect(result.error?.statusCode).toBeUndefined()
    expect((result.error?.details as { timeoutMs?: number }).timeoutMs).toBe(1234)
  })

  it("classifies network errnos as retryable NETWORK_ERROR", () => {
    const adapter = initialized()

    for (const errno of ["ECONNRESET", "ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "EPIPE"]) {
      const result = adapter.exposeErrorResponse(
        Object.assign(new Error(`socket error ${errno}`), { code: errno })
      )
      expect(result.error?.code).toBe(ERROR_CODES.NETWORK_ERROR)
      expect(result.error?.retryable).toBe(true)
      expect(result.error?.statusCode).toBeUndefined()
    }
  })

  it("marks throttling and server errors retryable, HTTP status winning over errno", () => {
    const adapter = initialized()

    const throttled = adapter.exposeErrorResponse(
      Object.assign(new Error("Request failed with status code 429"), {
        code: "ECONNRESET",
        response: { status: 429, data: { message: "Too many requests" } }
      })
    )
    expect(throttled.error?.code).toBe(ERROR_CODES.RATE_LIMIT)
    expect(throttled.error?.retryable).toBe(true)

    const server = adapter.exposeErrorResponse(
      Object.assign(new Error("Request failed with status code 503"), {
        response: { status: 503, data: {} }
      })
    )
    expect(server.error?.code).toBe(ERROR_CODES.SERVER_ERROR)
    expect(server.error?.retryable).toBe(true)
  })
})
