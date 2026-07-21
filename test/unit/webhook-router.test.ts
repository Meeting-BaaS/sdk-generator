import crypto from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  createWebhookRouter,
  WebhookRouter,
  type WebhookRouterOptions
} from "../../src/webhooks/webhook-router"

const gladiaSuccessPayload = {
  id: "gladia-job-1",
  event: "transcription.success",
  payload: {
    transcription: {
      full_transcript: "hello world",
      languages: ["en"],
      utterances: [
        {
          text: "hello world",
          start: 0,
          end: 1.2,
          confidence: 0.98,
          speaker: 1,
          words: [
            { word: "hello", start: 0, end: 0.5, confidence: 0.99 },
            { word: "world", start: 0.6, end: 1.2, confidence: 0.97 }
          ]
        }
      ]
    },
    metadata: {
      audio_duration: 1.2,
      transcription_time: 0.4,
      billing_time: 2,
      number_of_distinct_channels: 1
    },
    summarization: {
      success: true,
      results: "Greeting"
    }
  },
  custom_metadata: {
    meeting_id: "m-1"
  }
}

describe("WebhookRouter", () => {
  it("auto-detects and normalizes Gladia success callbacks", () => {
    const router = createWebhookRouter()

    expect(router.detectProvider(gladiaSuccessPayload)).toBe("gladia")
    expect(router.route(gladiaSuccessPayload)).toMatchObject({
      success: true,
      provider: "gladia",
      verified: true,
      event: {
        success: true,
        provider: "gladia",
        eventType: "transcription.completed",
        data: {
          id: "gladia-job-1",
          status: "completed",
          text: "hello world",
          duration: 1.2,
          language: "en",
          summary: "Greeting",
          speakers: [{ id: "1", label: "Speaker 1" }],
          metadata: {
            custom_metadata: {
              meeting_id: "m-1"
            }
          }
        }
      }
    })
  })

  it("returns validation errors for unknown payloads", () => {
    const router = new WebhookRouter()

    expect(router.route({ not: "a webhook" })).toEqual({
      success: false,
      error: "Could not detect webhook provider from payload structure"
    })
    expect(router.validate({ not: "a webhook" })).toEqual({
      valid: false,
      error: "Could not detect webhook provider from payload structure"
    })
  })

  it("routes explicit AssemblyAI notification payloads", () => {
    const router = new WebhookRouter()
    const payload = {
      transcript_id: "assemblyai-tx-1",
      status: "completed"
    }

    expect(router.route(payload, { provider: "assemblyai" })).toMatchObject({
      success: true,
      provider: "assemblyai",
      verified: true,
      event: {
        success: true,
        eventType: "transcription.completed",
        data: {
          id: "assemblyai-tx-1",
          status: "completed"
        }
      }
    })
  })

  it("rejects invalid explicit providers instead of falling back to auto-detection", () => {
    const router = new WebhookRouter()
    const invalidOptions: Array<[unknown, string]> = [
      ["", "Unknown provider: <empty string>"],
      [null, "Unknown provider: null"],
      ["openai-whisper", "Unknown provider: openai-whisper"],
      [Symbol("gladia"), "Unknown provider: Symbol(gladia)"]
    ]

    for (const [provider, error] of invalidOptions) {
      const options = { provider } as unknown as WebhookRouterOptions

      expect(router.route(gladiaSuccessPayload, options)).toEqual({
        success: false,
        error
      })
      expect(router.validate(gladiaSuccessPayload, options)).toEqual({
        valid: false,
        error
      })
    }
  })

  it("rejects accessor-backed explicit providers without invoking getters", () => {
    const router = new WebhookRouter()
    let getterCalled = false
    const options = Object.defineProperty({}, "provider", {
      enumerable: true,
      get() {
        getterCalled = true
        return "gladia"
      }
    }) as WebhookRouterOptions
    const error = "Invalid provider option: provider must be an own data property"

    expect(router.route(gladiaSuccessPayload, options)).toEqual({
      success: false,
      error
    })
    expect(router.validate(gladiaSuccessPayload, options)).toEqual({
      valid: false,
      error
    })
    expect(getterCalled).toBe(false)
  })

  it("auto-detects and routes ElevenLabs multichannel callbacks", () => {
    const router = new WebhookRouter()
    const payload = {
      transcription_id: "el-multi-1",
      audio_duration_secs: 2.4,
      transcripts: [
        {
          text: "agent hello",
          language_code: "en",
          language_probability: 0.98,
          channel_index: 0,
          words: [
            {
              text: "hello",
              type: "word",
              start: 0,
              end: 0.5,
              logprob: Math.log(0.9),
              speaker_id: "agent"
            }
          ]
        },
        {
          text: "customer hi",
          language_code: "en",
          language_probability: 0.97,
          channel_index: 1,
          words: [
            {
              text: "hi",
              type: "word",
              start: 1,
              end: 1.5,
              logprob: Math.log(0.89),
              speaker_id: "customer"
            }
          ]
        }
      ]
    }

    expect(router.detectProvider(payload)).toBe("elevenlabs")
    expect(router.route(payload)).toMatchObject({
      success: true,
      provider: "elevenlabs",
      event: {
        provider: "elevenlabs",
        eventType: "transcription.completed",
        data: {
          id: "el-multi-1",
          status: "completed",
          text: "agent hello customer hi",
          speakers: [
            { id: "agent", label: "Speaker agent" },
            { id: "customer", label: "Speaker customer" }
          ],
          metadata: {
            channel_indices: [0, 1],
            audio_duration_secs: 2.4
          }
        }
      }
    })
  })

  it("verifies AssemblyAI HMAC signatures and rejects invalid signatures", () => {
    const router = new WebhookRouter()
    const payload = {
      transcript_id: "assemblyai-tx-1",
      status: "completed"
    }
    const rawBody = JSON.stringify(payload)
    const signature = crypto.createHmac("sha256", "secret").update(rawBody).digest("hex")

    expect(
      router.route(payload, {
        provider: "assemblyai",
        verification: {
          signature,
          secret: "secret",
          rawBody
        }
      })
    ).toMatchObject({
      success: true,
      verified: true
    })

    expect(
      router.route(payload, {
        provider: "assemblyai",
        verification: {
          signature: "bad-signature",
          secret: "secret",
          rawBody
        }
      })
    ).toEqual({
      success: false,
      provider: "assemblyai",
      error: "Webhook signature verification failed",
      verified: false
    })
  })

  it("skips signature verification when verifySignature is false", () => {
    const router = new WebhookRouter()
    const payload = {
      transcript_id: "assemblyai-tx-1",
      status: "completed"
    }

    expect(
      router.route(payload, {
        provider: "assemblyai",
        verifySignature: false,
        verification: {
          signature: "bad-signature",
          secret: "secret",
          rawBody: JSON.stringify(payload)
        }
      })
    ).toMatchObject({
      success: true,
      provider: "assemblyai",
      event: {
        success: true,
        eventType: "transcription.completed",
        data: {
          id: "assemblyai-tx-1"
        }
      }
    })
  })

  it("exposes registered webhook providers and handlers", () => {
    const router = new WebhookRouter()

    expect(router.getProviders()).toEqual([
      "gladia",
      "assemblyai",
      "deepgram",
      "azure-stt",
      "speechmatics",
      "elevenlabs",
      "soniox"
    ])
    expect(router.getHandler("gladia")?.provider).toBe("gladia")
  })
})
