import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { type BaasClient, createBaasClient } from "../../src/node/client"
import {
  createMockApiKey,
  createMockBotId,
  createMockV2BatchResponse,
  createMockV2ErrorResponse,
  createMockV2SuccessResponse,
  server
} from "../setup"

describe("v2 Bot Operations Integration Tests", () => {
  let client: BaasClient<"v2">

  beforeEach(() => {
    client = createBaasClient({
      api_key: createMockApiKey(),
      api_version: "v2"
    })
  })

  describe("createBot", () => {
    it("should create a bot successfully", async () => {
      const botId = createMockBotId()

      server.use(
        http.post("https://api.meetingbaas.com/v2/bots", () => {
          return HttpResponse.json(
            createMockV2SuccessResponse({
              bot_id: botId
            }),
            { status: 201 }
          )
        })
      )

      const result = await client.createBot({
        meeting_url: "https://meet.google.com/abc-defg-hij",
        bot_name: "Test Bot"
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ bot_id: botId })
      }
    })

    it("should handle create bot with all optional parameters", async () => {
      const botId = createMockBotId()

      server.use(
        http.post("https://api.meetingbaas.com/v2/bots", () => {
          return HttpResponse.json(
            createMockV2SuccessResponse({
              bot_id: botId
            }),
            { status: 201 }
          )
        })
      )

      const result = await client.createBot({
        meeting_url: "https://meet.google.com/abc-defg-hij",
        bot_name: "Test Bot",
        bot_image: "https://example.com/bot-image.jpg",
        entry_message: "Hello from the bot!",
        recording_mode: "speaker_view"
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.bot_id).toBe(botId)
      }
    })

    it("should handle create bot error - insufficient tokens", async () => {
      server.use(
        http.post("https://api.meetingbaas.com/v2/bots", () => {
          return HttpResponse.json(
            createMockV2ErrorResponse("Insufficient tokens", "INSUFFICIENT_TOKENS", 402),
            { status: 402 }
          )
        })
      )

      const result = await client.createBot({
        meeting_url: "https://meet.google.com/abc-defg-hij",
        bot_name: "Test Bot"
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Insufficient tokens")
        expect(result.code).toBe("INSUFFICIENT_TOKENS")
        expect(result.statusCode).toBe(402)
      }
    })
  })

  describe("batchCreateBots", () => {
    it("should create multiple bots with partial success", async () => {
      server.use(
        http.post("https://api.meetingbaas.com/v2/bots/batch", () => {
          return HttpResponse.json(
            createMockV2BatchResponse(
              [{ bot_id: "bot-1" }, { bot_id: "bot-2" }],
              [
                {
                  index: 2,
                  code: "INVALID_MEETING_URL",
                  message: "Invalid meeting URL",
                  details: null,
                  extra: null
                }
              ]
            ),
            { status: 201 }
          )
        })
      )

      const result = await client.batchCreateBots([
        { meeting_url: "https://meet.google.com/abc-defg-hij", bot_name: "Bot 1" },
        { meeting_url: "https://meet.google.com/xyz-1234-567", bot_name: "Bot 2" },
        { meeting_url: "https://google.com/invalid-test", bot_name: "Bot 3" }
      ])

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(2)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].message).toBe("Invalid meeting URL")
      }
    })

    it("should handle batch create with all successful", async () => {
      server.use(
        http.post("https://api.meetingbaas.com/v2/bots/batch", () => {
          return HttpResponse.json(
            createMockV2BatchResponse([{ bot_id: "bot-1" }, { bot_id: "bot-2" }]),
            { status: 201 }
          )
        })
      )

      const result = await client.batchCreateBots([
        { meeting_url: "https://meet.google.com/abc-defg-hij", bot_name: "Bot 1" },
        { meeting_url: "https://meet.google.com/xyz-1234-567", bot_name: "Bot 2" }
      ])

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(2)
        expect(result.errors).toHaveLength(0)
      }
    })
  })

  describe("listBots", () => {
    it("should list bots successfully", async () => {
      const mockBots = [
        { bot_id: "bot-1", bot_name: "Bot 1", status: "active" },
        { bot_id: "bot-2", bot_name: "Bot 2", status: "completed" }
      ]

      server.use(
        http.get("https://api.meetingbaas.com/v2/bots", () => {
          return HttpResponse.json(
            {
              success: true as const,
              data: mockBots,
              cursor: null,
              prev_cursor: null
            },
            { status: 200 }
          )
        })
      )

      const result = await client.listBots()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockBots)
        expect(result.cursor).toBeNull()
      }
    })

    it("should list bots with pagination", async () => {
      server.use(
        http.get("https://api.meetingbaas.com/v2/bots", () => {
          return HttpResponse.json(
            {
              success: true as const,
              data: [{ bot_id: "bot-1" }],
              cursor: "next-cursor-123",
              prev_cursor: "initial-cursor"
            },
            { status: 200 }
          )
        })
      )

      const result = await client.listBots({
        limit: 10,
        cursor: "initial-cursor"
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.cursor).toBe("next-cursor-123")
        expect(result.prev_cursor).toBe("initial-cursor")
      }
    })
  })

  describe("getBotDetails", () => {
    it("should get bot details successfully", async () => {
      const botId = createMockBotId()
      const mockBotDetails = {
        bot_id: botId,
        bot_name: "Test Bot",
        status: "active",
        meeting_url: "https://meet.google.com/abc-defg-hij"
      }

      server.use(
        http.get(`https://api.meetingbaas.com/v2/bots/${botId}`, () => {
          return HttpResponse.json(createMockV2SuccessResponse(mockBotDetails), { status: 200 })
        })
      )

      const result = await client.getBotDetails({ bot_id: botId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockBotDetails)
      }
    })

    it("should handle bot not found", async () => {
      server.use(
        http.get("https://api.meetingbaas.com/v2/bots/00000000-0000-0000-0000-000000000000", () => {
          return HttpResponse.json(createMockV2ErrorResponse("Bot not found", "NOT_FOUND", 404), {
            status: 404
          })
        })
      )

      const botId = "00000000-0000-0000-0000-000000000000" // Valid UUID format but will trigger 404
      const result = await client.getBotDetails({ bot_id: botId })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.statusCode).toBe(404)
        expect(result.error).toBe("Bot not found")
      }
    })
  })

  describe("getBotStatus", () => {
    it("should get bot status successfully", async () => {
      const botId = createMockBotId()
      const mockStatus = {
        status: "active",
        meeting_url: "https://meet.google.com/abc-defg-hij",
        joined_at: "2024-01-01T00:00:00Z"
      }

      server.use(
        http.get(`https://api.meetingbaas.com/v2/bots/${botId}/status`, () => {
          return HttpResponse.json(createMockV2SuccessResponse(mockStatus), { status: 200 })
        })
      )

      const result = await client.getBotStatus({ bot_id: botId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe("active")
      }
    })
  })

  describe("leaveBot", () => {
    it("should leave bot successfully", async () => {
      const botId = createMockBotId()

      server.use(
        http.post(`https://api.meetingbaas.com/v2/bots/${botId}/leave`, () => {
          return HttpResponse.json(
            createMockV2SuccessResponse({ message: "Bot left successfully" }),
            { status: 200 }
          )
        })
      )

      const result = await client.leaveBot({ bot_id: botId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.message).toBe("Bot left successfully")
      }
    })
  })

  describe("deleteBotData", () => {
    it("should delete bot data successfully", async () => {
      const botId = createMockBotId()

      server.use(
        http.delete(`https://api.meetingbaas.com/v2/bots/${botId}/delete-data`, () => {
          return HttpResponse.json(
            createMockV2SuccessResponse({ message: "Bot data deleted successfully" }),
            { status: 200 }
          )
        })
      )

      const result = await client.deleteBotData({ bot_id: botId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.message).toBe("Bot data deleted successfully")
      }
    })

    it("should delete bot data with delete_from_provider option", async () => {
      const botId = createMockBotId()

      server.use(
        http.delete(`https://api.meetingbaas.com/v2/bots/${botId}/delete-data`, () => {
          return HttpResponse.json(
            createMockV2SuccessResponse({ message: "Bot data deleted successfully" }),
            { status: 200 }
          )
        })
      )

      const result = await client.deleteBotData({
        bot_id: botId,
        delete_from_provider: true
      })

      expect(result.success).toBe(true)
    })
  })
})
