import crypto from "node:crypto"
import { describe, expect, it } from "vitest"
import { AzureWebhookHandler } from "../../src/webhooks/azure-webhook"
import { DeepgramWebhookHandler } from "../../src/webhooks/deepgram-webhook"
import { ElevenLabsWebhookHandler } from "../../src/webhooks/elevenlabs-webhook"
import { SonioxWebhookHandler } from "../../src/webhooks/soniox-webhook"
import { SpeechmaticsWebhookHandler } from "../../src/webhooks/speechmatics-webhook"

describe("provider webhook handlers", () => {
  it("validates and parses Deepgram completed callbacks", () => {
    const handler = new DeepgramWebhookHandler()
    const payload = {
      metadata: {
        request_id: "dg-1",
        duration: 1.4,
        channels: 1,
        created: "2026-06-24T00:00:00.000Z",
        models: ["nova-3"]
      },
      results: {
        channels: [
          {
            detected_language: "en",
            alternatives: [
              {
                transcript: "hello world",
                confidence: 0.98,
                words: [
                  {
                    word: "hello",
                    start: 0,
                    end: 0.5,
                    confidence: 0.99
                  }
                ],
                summaries: [{ summary: "Greeting" }]
              }
            ]
          }
        ],
        utterances: [
          {
            id: "utt-1",
            transcript: "hello world",
            start: 0,
            end: 1.4,
            speaker: 0,
            channel: 0,
            confidence: 0.98,
            words: [
              {
                word: "hello",
                start: 0,
                end: 0.5,
                confidence: 0.99,
                speaker: 0
              }
            ]
          }
        ]
      }
    }

    expect(handler.validate(payload)).toMatchObject({
      valid: true,
      provider: "deepgram",
      details: {
        eventType: "transcription.completed",
        success: true
      }
    })
    expect(handler.parse(payload)).toMatchObject({
      success: true,
      provider: "deepgram",
      eventType: "transcription.completed",
      data: {
        id: "dg-1",
        status: "completed",
        text: "hello world",
        confidence: 0.98,
        duration: 1.4,
        language: "en",
        speakers: [{ id: "0", label: "Speaker 0" }],
        summary: "Greeting"
      }
    })
  })

  it("turns malformed Deepgram callbacks into validation failures", () => {
    const handler = new DeepgramWebhookHandler()

    expect(handler.validate({ metadata: { request_id: "dg-1" }, results: {} })).toMatchObject({
      valid: false,
      error: "Payload does not match deepgram webhook format"
    })
  })

  it("parses Azure lifecycle callbacks and verifies optional HMAC signatures", () => {
    const handler = new AzureWebhookHandler()
    const payload = {
      action: "TranscriptionSucceeded",
      timestamp: "2026-06-24T00:00:00.000Z",
      self: "https://eastus.api.cognitive.microsoft.com/speechtotext/v3.1/transcriptions/az-1"
    }
    const rawBody = JSON.stringify(payload)
    const signature = crypto.createHmac("sha256", "secret").update(rawBody).digest("hex")

    expect(handler.parse(payload)).toMatchObject({
      success: true,
      provider: "azure-stt",
      eventType: "transcription.completed",
      data: {
        id: "az-1",
        status: "completed",
        completedAt: "2026-06-24T00:00:00.000Z"
      }
    })
    expect(handler.verify(payload, { rawBody })).toBe(true)
    expect(handler.verify(payload, { rawBody, signature, secret: "secret" })).toBe(true)
    expect(handler.verify(payload, { rawBody, signature: "bad", secret: "secret" })).toBe(false)
  })

  it("validates Speechmatics query params and parses successful transcript bodies", () => {
    const handler = new SpeechmaticsWebhookHandler()
    const payload = {
      format: "2.9",
      job: {
        duration: 1.2,
        created_at: "2026-06-24T00:00:00.000Z"
      },
      metadata: {
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
              confidence: 0.95,
              speaker: "S1"
            }
          ]
        },
        {
          type: "punctuation",
          attaches_to: "previous",
          alternatives: [{ content: "." }]
        }
      ]
    }
    const options = {
      queryParams: {
        id: "sm-1",
        status: "success"
      },
      userAgent: "Speechmatics-API/2.0"
    }

    expect(handler.validate(payload, options)).toEqual({ valid: true })
    expect(handler.parse(payload, options)).toMatchObject({
      success: true,
      provider: "speechmatics",
      eventType: "transcription.completed",
      data: {
        id: "sm-1",
        status: "completed",
        text: "hello.",
        language: "en",
        duration: 1.2,
        speakers: [{ id: "S1", label: "Speaker S1" }]
      }
    })
    expect(handler.validate(payload, { queryParams: { id: "sm-1", status: "bogus" } })).toEqual({
      valid: false,
      error: "Invalid status value: bogus"
    })
  })

  it("validates and parses ElevenLabs transcription callbacks", () => {
    const handler = new ElevenLabsWebhookHandler()
    const payload = {
      transcription_id: "el-1",
      text: "hello world",
      language_code: "en",
      language_probability: 0.99,
      channel_index: 0,
      words: [
        {
          text: "hello",
          type: "word",
          start: 0,
          end: 0.5,
          logprob: Math.log(0.9),
          speaker_id: "speaker-1"
        },
        {
          text: " ",
          type: "spacing",
          logprob: 0
        }
      ]
    }

    expect(handler.validate(payload)).toMatchObject({ valid: true, provider: "elevenlabs" })
    expect(handler.parse(payload)).toMatchObject({
      success: true,
      provider: "elevenlabs",
      eventType: "transcription.completed",
      data: {
        id: "el-1",
        status: "completed",
        text: "hello world",
        language: "en",
        speakers: [{ id: "speaker-1", label: "Speaker speaker-1" }],
        metadata: {
          language_probability: 0.99,
          channel_index: 0
        }
      }
    })
    expect(handler.verify()).toBe(true)
  })

  it("validates and parses ElevenLabs multichannel transcription callbacks", () => {
    const handler = new ElevenLabsWebhookHandler()
    const payload = {
      transcription_id: "el-multi-1",
      audio_duration_secs: 2.4,
      transcripts: [
        {
          transcription_id: "el-multi-1",
          text: "agent hello",
          language_code: "en",
          language_probability: 0.98,
          channel_index: 0,
          words: [
            {
              text: "agent",
              type: "word",
              start: 0,
              end: 0.4,
              logprob: Math.log(0.92),
              speaker_id: "agent"
            },
            {
              text: "hello",
              type: "word",
              start: 0.5,
              end: 0.9,
              logprob: Math.log(0.91),
              speaker_id: "agent"
            }
          ],
          entities: [
            {
              text: "agent",
              entity_type: "other",
              start_char: 0,
              end_char: 5
            }
          ]
        },
        {
          transcription_id: "el-multi-1",
          text: "customer hi",
          language_code: "en",
          language_probability: 0.97,
          channel_index: 1,
          words: [
            {
              text: "customer",
              type: "word",
              start: 1,
              end: 1.4,
              logprob: Math.log(0.9),
              speaker_id: "customer"
            },
            {
              text: "hi",
              type: "word",
              start: 1.5,
              end: 1.8,
              logprob: Math.log(0.89),
              speaker_id: "customer"
            }
          ]
        }
      ]
    }

    expect(handler.validate(payload)).toMatchObject({ valid: true, provider: "elevenlabs" })
    expect(handler.parse(payload)).toMatchObject({
      success: true,
      provider: "elevenlabs",
      eventType: "transcription.completed",
      data: {
        id: "el-multi-1",
        status: "completed",
        text: "agent hello customer hi",
        language: "en",
        speakers: [
          { id: "agent", label: "Speaker agent" },
          { id: "customer", label: "Speaker customer" }
        ],
        metadata: {
          language_probability: 0.98,
          channel_index: 0,
          channel_indices: [0, 1],
          audio_duration_secs: 2.4,
          entities: [
            {
              text: "agent",
              entity_type: "other",
              start_char: 0,
              end_char: 5
            }
          ]
        }
      }
    })
  })

  it("validates and parses Soniox notification callbacks", () => {
    const handler = new SonioxWebhookHandler()
    const completed = {
      id: "sx-1",
      status: "completed"
    }
    const failed = {
      id: "sx-2",
      status: "error",
      error_message: "provider failed"
    }

    expect(handler.validate(completed)).toMatchObject({ valid: true, provider: "soniox" })
    expect(handler.parse(completed)).toMatchObject({
      success: true,
      provider: "soniox",
      eventType: "transcription.completed",
      data: {
        id: "sx-1",
        status: "completed"
      }
    })
    expect(handler.parse(failed)).toMatchObject({
      success: false,
      eventType: "transcription.failed",
      data: {
        id: "sx-2",
        status: "error",
        error: "provider failed"
      }
    })
    expect(handler.verify()).toBe(true)
  })
})
