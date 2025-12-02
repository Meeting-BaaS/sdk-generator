import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { type BaasClient, createBaasClient } from "../../src/node/client"
import {
  createMockApiKey,
  createMockBotId,
  createMockV2BatchResponse,
  createMockV2SuccessResponse,
  server
} from "../setup"

describe("v2 Bot Operations Extended Tests", () => {
  let client: BaasClient<"v2">

  beforeEach(() => {
    client = createBaasClient({
      api_key: createMockApiKey(),
      api_version: "v2"
    })
  })

  describe("getBotScreenshots", () => {
    it("should get bot screenshots successfully", async () => {
      const botId = createMockBotId()
      server.use(
        http.get(`https://api.meetingbaas.com/v2/bots/${botId}/screenshots`, () => {
          return HttpResponse.json(
            {
              success: true as const,
              data: [
                { screenshot_id: 1, url: "https://example.com/screenshot1.jpg" },
                { screenshot_id: 2, url: "https://example.com/screenshot2.jpg" }
              ],
              cursor: null,
              prev_cursor: null
            },
            { status: 200 }
          )
        })
      )

      const result = await client.getBotScreenshots({ bot_id: botId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(2)
        expect(result.cursor).toBeNull()
      }
    })

    it("should get bot screenshots with pagination", async () => {
      const botId = createMockBotId()
      server.use(
        http.get(`https://api.meetingbaas.com/v2/bots/${botId}/screenshots`, () => {
          return HttpResponse.json(
            {
              success: true as const,
              data: [{ screenshot_id: 1, url: "https://example.com/screenshot1.jpg" }],
              cursor: "next-cursor",
              prev_cursor: null
            },
            { status: 200 }
          )
        })
      )

      const result = await client.getBotScreenshots({
        bot_id: botId,
        limit: 10,
        cursor: "prev-cursor"
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.cursor).toBe("next-cursor")
      }
    })
  })

  describe("resendFinalWebhook", () => {
    it("should resend final webhook successfully", async () => {
      const botId = createMockBotId()
      server.use(
        http.post(`https://api.meetingbaas.com/v2/bots/${botId}/resend-webhook`, () => {
          return HttpResponse.json(
            createMockV2SuccessResponse({ message: "Webhook resent successfully" }),
            { status: 200 }
          )
        })
      )

      const result = await client.resendFinalWebhook({ bot_id: botId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.message).toBe("Webhook resent successfully")
      }
    })
  })

  describe("retryCallback", () => {
    it("should retry callback successfully", async () => {
      const botId = createMockBotId()
      server.use(
        http.post(`https://api.meetingbaas.com/v2/bots/${botId}/retry-callback`, () => {
          return HttpResponse.json(
            createMockV2SuccessResponse({ message: "Callback retried successfully" }),
            { status: 200 }
          )
        })
      )

      const result = await client.retryCallback({
        bot_id: botId,
        callbackConfig: {
          url: "https://example.com/callback",
          method: "POST"
        }
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.message).toBe("Callback retried successfully")
      }
    })

    it("should return error when bot_id is missing", async () => {
      // @ts-expect-error - Testing missing bot_id
      const result = await client.retryCallback({
        callbackConfig: {
          url: "https://example.com/callback",
          method: "POST"
        }
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain("Required")
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.statusCode).toBe(400)
      }
    })

    it("should retry callback with undefined callbackConfig", async () => {
      const botId = createMockBotId()
      server.use(
        http.post(`https://api.meetingbaas.com/v2/bots/${botId}/retry-callback`, () => {
          return HttpResponse.json(
            createMockV2SuccessResponse({ message: "Callback retried successfully" }),
            { status: 200 }
          )
        })
      )

      // Test with undefined callbackConfig to cover the ?? null branch
      const result = await client.retryCallback({
        bot_id: botId,
        callbackConfig: undefined
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.message).toBe("Callback retried successfully")
      }
    })
  })

  describe("createScheduledBot", () => {
    it("should create scheduled bot successfully", async () => {
      const botId = createMockBotId()
      server.use(
        http.post("https://api.meetingbaas.com/v2/bots/scheduled", () => {
          return HttpResponse.json(
            createMockV2SuccessResponse({
              bot_id: botId,
              scheduled_at: "2025-12-25T10:00:00Z"
            }),
            { status: 201 }
          )
        })
      )

      const result = await client.createScheduledBot({
        meeting_url: "https://meet.google.com/abc-defg-hij",
        bot_name: "Scheduled Bot",
        join_at: "2025-12-25T10:00:00Z"
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.bot_id).toBe(botId)
      }
    })
  })

  describe("batchCreateScheduledBots", () => {
    it("should batch create scheduled bots successfully", async () => {
      const botId1 = createMockBotId()
      const botId2 = "223e4567-e89b-12d3-a456-426614174001"
      server.use(
        http.post("https://api.meetingbaas.com/v2/bots/scheduled/batch", () => {
          return HttpResponse.json(
            createMockV2BatchResponse(
              [
                { bot_id: botId1, scheduled_at: "2025-12-25T10:00:00Z" },
                { bot_id: botId2, scheduled_at: "2025-12-25T11:00:00Z" }
              ],
              []
            ),
            { status: 201 }
          )
        })
      )

      const result = await client.batchCreateScheduledBots([
        {
          meeting_url: "https://meet.google.com/abc-defg-hij",
          bot_name: "Bot 1",
          join_at: "2025-12-25T10:00:00Z"
        },
        {
          meeting_url: "https://meet.google.com/xyz-1234-567",
          bot_name: "Bot 2",
          join_at: "2025-12-25T11:00:00Z"
        }
      ])

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(2)
        expect(result.errors).toHaveLength(0)
      }
    })
  })

  describe("listScheduledBots", () => {
    it("should list scheduled bots successfully", async () => {
      server.use(
        http.get("https://api.meetingbaas.com/v2/bots/scheduled", () => {
          return HttpResponse.json(
            {
              success: true as const,
              data: [
                {
                  bot_id: createMockBotId(),
                  scheduled_at: "2025-12-25T10:00:00Z",
                  status: "scheduled"
                }
              ],
              cursor: null,
              prev_cursor: null
            },
            { status: 200 }
          )
        })
      )

      const result = await client.listScheduledBots()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
      }
    })
  })

  describe("getScheduledBot", () => {
    it("should get scheduled bot successfully", async () => {
      const botId = createMockBotId()
      server.use(
        http.get(`https://api.meetingbaas.com/v2/bots/scheduled/${botId}`, () => {
          return HttpResponse.json(
            createMockV2SuccessResponse({
              bot_id: botId,
              scheduled_at: "2025-12-25T10:00:00Z",
              status: "scheduled"
            }),
            { status: 200 }
          )
        })
      )

      const result = await client.getScheduledBot({ bot_id: botId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.bot_id).toBe(botId)
      }
    })
  })

  describe("updateScheduledBot", () => {
    it("should update scheduled bot successfully", async () => {
      const botId = createMockBotId()
      server.use(
        http.patch(`https://api.meetingbaas.com/v2/bots/scheduled/${botId}`, () => {
          return HttpResponse.json(
            createMockV2SuccessResponse({
              message: "Scheduled bot updated successfully"
            }),
            { status: 200 }
          )
        })
      )

      const result = await client.updateScheduledBot({
        bot_id: botId,
        body: {
          join_at: "2025-12-26T10:00:00Z"
        }
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.message).toBe("Scheduled bot updated successfully")
      }
    })
  })

  describe("deleteScheduledBot", () => {
    it("should delete scheduled bot successfully", async () => {
      const botId = createMockBotId()
      server.use(
        http.delete(`https://api.meetingbaas.com/v2/bots/scheduled/${botId}`, () => {
          return HttpResponse.json(
            createMockV2SuccessResponse({ message: "Scheduled bot deleted successfully" }),
            { status: 200 }
          )
        })
      )

      const result = await client.deleteScheduledBot({ bot_id: botId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.message).toBe("Scheduled bot deleted successfully")
      }
    })
  })
})
