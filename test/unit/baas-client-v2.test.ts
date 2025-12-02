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

describe("BaasClient v2", () => {
  let client: BaasClient<"v2">

  beforeEach(() => {
    client = createBaasClient({
      api_key: createMockApiKey(),
      api_version: "v2"
    })
  })

  describe("constructor", () => {
    it("should create a v2 client with default configuration", () => {
      expect(client).toBeDefined()
      expect(client.getApiKey()).toBe(createMockApiKey())
      expect(client.getBaseUrl()).toBe("https://api.meetingbaas.com")
    })

    it("should create a v2 client with custom base URL", () => {
      const customClient: BaasClient<"v2"> = createBaasClient({
        api_key: "custom-key",
        base_url: "https://custom-api.example.com",
        api_version: "v2"
      })

      expect(customClient.getApiKey()).toBe("custom-key")
      expect(customClient.getBaseUrl()).toBe("https://custom-api.example.com")
    })

    it("should infer v2 methods when api_version is v2", () => {
      // TypeScript should only expose v2 methods
      expect(client).toHaveProperty("createBot")
      expect(client).toHaveProperty("listBots")
      expect(client).toHaveProperty("getBotDetails")
      // v1 methods should not be available
      expect(client).not.toHaveProperty("joinMeeting")
    })
  })

  describe("createBot", () => {
    it("should create a bot successfully", async () => {
      const botId = createMockBotId()
      const mockResponse = createMockV2SuccessResponse({
        bot_id: botId
      })

      server.use(
        http.post("https://api.meetingbaas.com/v2/bots", () => {
          return HttpResponse.json(mockResponse, { status: 201 })
        })
      )

      const result = await client.createBot({
        meeting_url: "https://meet.google.com/abc-defg-hij",
        bot_name: "Test Bot"
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("bot_id")
        expect(result.data.bot_id).toBe(botId)
      }
    })

    it("should handle create bot error response", async () => {
      const mockError = createMockV2ErrorResponse("Insufficient tokens", "INSUFFICIENT_TOKENS", 402)

      server.use(
        http.post("https://api.meetingbaas.com/v2/bots", () => {
          return HttpResponse.json(mockError, { status: 402 })
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
      const mockResponse = createMockV2BatchResponse(
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
      )

      server.use(
        http.post("https://api.meetingbaas.com/v2/bots/batch", () => {
          return HttpResponse.json(mockResponse, { status: 201 })
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
  })

  describe("listBots", () => {
    it("should list bots successfully", async () => {
      const mockResponse = {
        success: true as const,
        data: [{ bot_id: "bot-1" }, { bot_id: "bot-2" }],
        cursor: null,
        prev_cursor: null
      }

      server.use(
        http.get("https://api.meetingbaas.com/v2/bots", () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.listBots()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(2)
        expect(Array.isArray(result.data)).toBe(true)
        expect(result.cursor).toBeNull()
        expect(result.prev_cursor).toBeNull()
      }
    })

    it("should list bots with query parameters", async () => {
      const mockResponse = createMockV2SuccessResponse({
        data: [],
        next: null
      })

      server.use(
        http.get("https://api.meetingbaas.com/v2/bots", () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.listBots({
        limit: 10,
        cursor: "next-cursor"
      })

      expect(result.success).toBe(true)
    })
  })

  describe("getBotDetails", () => {
    it("should get bot details successfully", async () => {
      const botId = createMockBotId()
      const mockResponse = createMockV2SuccessResponse({
        bot_id: botId,
        bot_name: "Test Bot",
        status: "active"
      })

      server.use(
        http.get(`https://api.meetingbaas.com/v2/bots/${botId}`, () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.getBotDetails({ bot_id: botId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("bot_id")
        expect(result.data.bot_id).toBe(botId)
      }
    })

    it("should handle bot not found", async () => {
      const botId = "00000000-0000-0000-0000-000000000000" // Valid UUID format but will trigger 404
      const mockError = createMockV2ErrorResponse("Bot not found", "NOT_FOUND", 404)

      server.use(
        http.get(`https://api.meetingbaas.com/v2/bots/${botId}`, () => {
          return HttpResponse.json(mockError, { status: 404 })
        })
      )

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
      const mockResponse = createMockV2SuccessResponse({
        status: "active",
        meeting_url: "https://meet.google.com/abc-defg-hij"
      })

      server.use(
        http.get(`https://api.meetingbaas.com/v2/bots/${botId}/status`, () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.getBotStatus({ bot_id: botId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("status")
      }
    })
  })

  describe("getBotScreenshots", () => {
    it("should get bot screenshots successfully", async () => {
      const botId = createMockBotId()
      const mockResponse = {
        success: true as const,
        data: [
          {
            screenshot_id: 1,
            url: "https://example.com/screenshot1.jpg"
          }
        ],
        cursor: null,
        prev_cursor: null
      }

      server.use(
        http.get(`https://api.meetingbaas.com/v2/bots/${botId}/screenshots`, () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.getBotScreenshots({ bot_id: botId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
        expect(result.data[0].url).toBe("https://example.com/screenshot1.jpg")
      }
    })
  })

  describe("leaveBot", () => {
    it("should leave bot successfully", async () => {
      const botId = createMockBotId()
      const mockResponse = createMockV2SuccessResponse({
        message: "Bot left successfully"
      })

      server.use(
        http.post(`https://api.meetingbaas.com/v2/bots/${botId}/leave`, () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.leaveBot({ bot_id: botId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("message")
      }
    })
  })

  describe("deleteBotData", () => {
    it("should delete bot data successfully", async () => {
      const botId = createMockBotId()
      const mockResponse = createMockV2SuccessResponse({
        message: "Bot data deleted successfully"
      })

      server.use(
        http.delete(`https://api.meetingbaas.com/v2/bots/${botId}/delete-data`, () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.deleteBotData({ bot_id: botId })

      expect(result.success).toBe(true)
    })

    it("should delete bot data with delete_from_provider option", async () => {
      const botId = createMockBotId()
      const mockResponse = createMockV2SuccessResponse({
        message: "Bot data deleted successfully"
      })

      server.use(
        http.delete(`https://api.meetingbaas.com/v2/bots/${botId}/delete-data`, () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.deleteBotData({
        bot_id: botId,
        delete_from_provider: true
      })

      expect(result.success).toBe(true)
    })
  })

  describe("createCalendarConnection", () => {
    it("should create calendar connection successfully", async () => {
      const mockResponse = createMockV2SuccessResponse({
        calendar_id: "cal-123",
        calendar_name: "Test Calendar"
      })

      server.use(
        http.post("https://api.meetingbaas.com/v2/calendars", () => {
          return HttpResponse.json(mockResponse, { status: 201 })
        })
      )

      const result = await client.createCalendarConnection({
        calendar_platform: "google",
        oauth_client_id: "client-id",
        oauth_client_secret: "client-secret",
        oauth_refresh_token: "refresh-token",
        oauth_tenant_id: "tenant-id",
        raw_calendar_id: "calendar-id"
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("calendar_id")
      }
    })
  })

  describe("listCalendars", () => {
    it("should list calendars successfully with undefined params", async () => {
      const calendarId = "123e4567-e89b-12d3-a456-426614174000"
      server.use(
        http.get("https://api.meetingbaas.com/v2/calendars", () => {
          return HttpResponse.json(
            {
              success: true as const,
              data: [
                {
                  calendar_id: calendarId,
                  calendar_platform: "google" as const,
                  account_email: "test@example.com",
                  status: "active" as const,
                  synced_at: null,
                  created_at: "2025-01-01T00:00:00Z"
                }
              ],
              cursor: null,
              prev_cursor: null
            },
            { status: 200 }
          )
        })
      )

      // Explicitly pass undefined to test the else branch
      const result = await client.listCalendars(undefined)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
        expect(result.data[0].calendar_id).toBe(calendarId)
      }
    })

    it("should list calendars successfully with params", async () => {
      const calendarId = "123e4567-e89b-12d3-a456-426614174000"
      server.use(
        http.get("https://api.meetingbaas.com/v2/calendars", () => {
          return HttpResponse.json(
            {
              success: true as const,
              data: [
                {
                  calendar_id: calendarId,
                  calendar_platform: "google" as const,
                  account_email: "test@example.com",
                  status: "active" as const,
                  synced_at: null,
                  created_at: "2025-01-01T00:00:00Z"
                }
              ],
              cursor: null,
              prev_cursor: null
            },
            { status: 200 }
          )
        })
      )

      const result = await client.listCalendars({ limit: 10 })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
        expect(result.data[0].calendar_id).toBe(calendarId)
      }
    })
  })

  describe("getCalendarDetails", () => {
    it("should get calendar details successfully", async () => {
      const calendarId = "123e4567-e89b-12d3-a456-426614174000"
      const mockResponse = createMockV2SuccessResponse({
        calendar_id: calendarId,
        calendar_name: "Test Calendar"
      })

      server.use(
        http.get(`https://api.meetingbaas.com/v2/calendars/${calendarId}`, () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.getCalendarDetails({ calendar_id: calendarId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("calendar_id")
      }
    })
  })

  describe("createCalendarBot", () => {
    it("should create calendar bot successfully", async () => {
      const calendarId = "123e4567-e89b-12d3-a456-426614174000"
      const eventId = "223e4567-e89b-12d3-a456-426614174001"
      const seriesId = "323e4567-e89b-12d3-a456-426614174002"
      const botId = "423e4567-e89b-12d3-a456-426614174003"

      const mockResponse = createMockV2SuccessResponse({
        bot_id: botId,
        event_id: eventId
      })

      server.use(
        http.post(`https://api.meetingbaas.com/v2/calendars/${calendarId}/bots`, () => {
          return HttpResponse.json(mockResponse, { status: 201 })
        })
      )

      const result = await client.createCalendarBot({
        calendar_id: calendarId,
        body: {
          event_id: eventId,
          bot_name: "Test Bot",
          series_id: seriesId,
          all_occurrences: false
        }
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("bot_id")
      }
    })
  })

  describe("response format", () => {
    it("should pass through v2 API response format without transformation", async () => {
      const botId = createMockBotId()
      const mockResponse = {
        success: true,
        data: {
          custom_field: "custom_value"
        }
      }

      server.use(
        http.get(`https://api.meetingbaas.com/v2/bots/${botId}`, () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.getBotDetails({ bot_id: botId })

      // v2 responses are passed through as-is
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockResponse.data)
      }
    })

    it("should pass through v2 error response format", async () => {
      const botId = "00000000-0000-0000-0000-000000000000" // Valid UUID format
      const mockError = {
        success: false,
        error: "Custom error message",
        code: "CUSTOM_ERROR",
        statusCode: 400,
        details: { field: "value" }
      }

      server.use(
        http.get(`https://api.meetingbaas.com/v2/bots/${botId}`, () => {
          return HttpResponse.json(mockError, { status: 400 })
        })
      )

      const result = await client.getBotDetails({ bot_id: botId })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Custom error message")
        expect(result.code).toBe("CUSTOM_ERROR")
        expect(result.statusCode).toBe(400)
        expect(result.details).toEqual({ field: "value" })
      }
    })
  })
})
