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

  describe("pauseBotRecording", () => {
    it("should pause recording successfully without chat message", async () => {
      const botId = createMockBotId()
      const mockResponse = createMockV2SuccessResponse({
        message: "Recording paused"
      })

      server.use(
        http.post(
          `https://api.meetingbaas.com/v2/bots/${botId}/pause-recording`,
          async ({ request }) => {
            const body = (await request.json()) as { chat_message?: string }
            expect(body.chat_message).toBeUndefined()
            return HttpResponse.json(mockResponse, { status: 200 })
          }
        )
      )

      const result = await client.pauseBotRecording({ bot_id: botId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("message")
      }
    })

    it("should pause recording with chat message", async () => {
      const botId = createMockBotId()
      const mockResponse = createMockV2SuccessResponse({
        message: "Recording paused"
      })

      server.use(
        http.post(
          `https://api.meetingbaas.com/v2/bots/${botId}/pause-recording`,
          async ({ request }) => {
            const body = (await request.json()) as { chat_message?: string }
            if (body.chat_message !== "Recording has been paused") {
              return HttpResponse.json(
                createMockV2ErrorResponse("chat_message mismatch", "VALIDATION_ERROR", 400),
                { status: 400 }
              )
            }
            return HttpResponse.json(mockResponse, { status: 200 })
          }
        )
      )

      const result = await client.pauseBotRecording({
        bot_id: botId,
        body: { chat_message: "Recording has been paused" }
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("message")
      }
    })
  })

  describe("resumeBotRecording", () => {
    it("should resume recording successfully without chat message", async () => {
      const botId = createMockBotId()
      const mockResponse = createMockV2SuccessResponse({
        message: "Recording resumed"
      })

      server.use(
        http.post(
          `https://api.meetingbaas.com/v2/bots/${botId}/resume-recording`,
          async ({ request }) => {
            const body = (await request.json()) as { chat_message?: string }
            expect(body.chat_message).toBeUndefined()
            return HttpResponse.json(mockResponse, { status: 200 })
          }
        )
      )

      const result = await client.resumeBotRecording({ bot_id: botId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("message")
      }
    })

    it("should resume recording with chat message", async () => {
      const botId = createMockBotId()
      const mockResponse = createMockV2SuccessResponse({
        message: "Recording resumed"
      })

      server.use(
        http.post(
          `https://api.meetingbaas.com/v2/bots/${botId}/resume-recording`,
          async ({ request }) => {
            const body = (await request.json()) as { chat_message?: string }
            if (body.chat_message !== "Recording has resumed") {
              return HttpResponse.json(
                createMockV2ErrorResponse("chat_message mismatch", "VALIDATION_ERROR", 400),
                { status: 400 }
              )
            }
            return HttpResponse.json(mockResponse, { status: 200 })
          }
        )
      )

      const result = await client.resumeBotRecording({
        bot_id: botId,
        body: { chat_message: "Recording has resumed" }
      })

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

  describe("Zoom credentials", () => {
    it("should create Zoom credential successfully", async () => {
      const credentialId = createMockBotId()
      const mockResponse = createMockV2SuccessResponse({
        credential_id: credentialId,
        name: "Test Credential",
        credential_type: "user",
        zoom_user_id: "zoom-user-123",
        zoom_account_id: null,
        scopes: null,
        state: "active",
        last_error_message: null,
        last_error_at: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z"
      })

      server.use(
        http.post("https://api.meetingbaas.com/v2/zoom-credentials", () => {
          return HttpResponse.json(mockResponse, { status: 201 })
        })
      )

      const result = await client.createZoomCredential({
        name: "Test Credential",
        client_id: "client-id",
        client_secret: "client-secret"
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("credential_id")
        expect(result.data.credential_id).toBe(credentialId)
        expect(result.data).toHaveProperty("name")
        expect(result.data).toHaveProperty("credential_type")
        expect(result.data).toHaveProperty("state")
      }
    })

    it("should list Zoom credentials successfully", async () => {
      const credentialId = createMockBotId()
      const mockResponse = createMockV2SuccessResponse([
        {
          credential_id: credentialId,
          name: "Test Credential",
          credential_type: "user" as const,
          zoom_user_id: "zoom-user-123",
          zoom_account_id: null,
          zoom_email: "user@example.com",
          zoom_display_name: "Test User",
          scopes: null,
          state: "active" as const,
          last_error_message: null,
          last_error_at: null,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
          extra: null
        }
      ])

      server.use(
        http.get("https://api.meetingbaas.com/v2/zoom-credentials", () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.listZoomCredentials()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true)
        expect(result.data).toHaveLength(1)
        expect(result.data[0]).toHaveProperty("credential_id")
        expect(result.data[0]).toHaveProperty("name")
        expect(result.data[0]).toHaveProperty("credential_type")
      }
    })

    it("should get Zoom credential successfully", async () => {
      const credentialId = createMockBotId()
      const mockResponse = createMockV2SuccessResponse({
        credential_id: credentialId,
        name: "Test Credential",
        credential_type: "user",
        zoom_user_id: "zoom-user-123",
        zoom_account_id: null,
        scopes: null,
        state: "active",
        last_error_message: null,
        last_error_at: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z"
      })

      server.use(
        http.get(`https://api.meetingbaas.com/v2/zoom-credentials/${credentialId}`, () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.getZoomCredential({ id: credentialId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("credential_id")
        expect(result.data.credential_id).toBe(credentialId)
        expect(result.data).toHaveProperty("name")
      }
    })

    it("should update Zoom credential successfully", async () => {
      const credentialId = createMockBotId()
      const mockResponse = createMockV2SuccessResponse({
        credential_id: credentialId,
        name: "Updated Credential",
        credential_type: "user",
        zoom_user_id: "zoom-user-123",
        zoom_account_id: null,
        scopes: null,
        state: "active",
        last_error_message: null,
        last_error_at: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-02T00:00:00Z"
      })

      server.use(
        http.patch(`https://api.meetingbaas.com/v2/zoom-credentials/${credentialId}`, () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.updateZoomCredential({
        id: credentialId,
        body: { name: "Updated Credential" }
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("name")
        expect(result.data.name).toBe("Updated Credential")
      }
    })

    it("should delete Zoom credential successfully", async () => {
      const credentialId = createMockBotId()
      const mockResponse = createMockV2SuccessResponse({
        message: "Credential deleted"
      })

      server.use(
        http.delete(`https://api.meetingbaas.com/v2/zoom-credentials/${credentialId}`, () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.deleteZoomCredential({ id: credentialId })

      expect(result.success).toBe(true)
    })

    it("should infer Zoom credential methods on v2 client", () => {
      expect(client).toHaveProperty("createZoomCredential")
      expect(client).toHaveProperty("listZoomCredentials")
      expect(client).toHaveProperty("getZoomCredential")
      expect(client).toHaveProperty("updateZoomCredential")
      expect(client).toHaveProperty("deleteZoomCredential")
    })
  })

  describe("retranscribeBot", () => {
    it("should retranscribe a bot without overrides", async () => {
      const botId = createMockBotId()
      const mockResponse = createMockV2SuccessResponse({
        message: "Retranscription queued"
      })

      server.use(
        http.post(`https://api.meetingbaas.com/v2/bots/${botId}/retranscribe`, () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.retranscribeBot({ bot_id: botId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.message).toBe("Retranscription queued")
      }
    })

    it("should retranscribe a bot with provider override", async () => {
      const botId = createMockBotId()
      const mockResponse = createMockV2SuccessResponse({
        message: "Retranscription queued with new provider"
      })

      server.use(
        http.post(`https://api.meetingbaas.com/v2/bots/${botId}/retranscribe`, () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.retranscribeBot({
        bot_id: botId,
        body: { transcription: { provider: "deepgram" } }
      })

      expect(result.success).toBe(true)
    })

    it("should handle retranscribe error response", async () => {
      const botId = createMockBotId()
      const mockError = createMockV2ErrorResponse(
        "Bot has no audio recordings",
        "NO_RECORDING",
        409
      )

      server.use(
        http.post(`https://api.meetingbaas.com/v2/bots/${botId}/retranscribe`, () => {
          return HttpResponse.json(mockError, { status: 409 })
        })
      )

      const result = await client.retranscribeBot({ bot_id: botId })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NO_RECORDING")
        expect(result.statusCode).toBe(409)
      }
    })
  })

  describe("Meet workspaces", () => {
    const workspaceId = "11111111-1111-4111-8111-111111111111"

    it("should create meet workspace successfully", async () => {
      const mockResponse = createMockV2SuccessResponse({
        workspace_id: workspaceId,
        name: "Acme",
        domain: "bots.acme.com",
        cert_pem: "-----BEGIN CERTIFICATE-----\nMIIBIjANBg...\n-----END CERTIFICATE-----",
        state: "active",
        last_error_message: null,
        last_error_at: null
      })

      server.use(
        http.post("https://api.meetingbaas.com/v2/meet-workspaces", () => {
          return HttpResponse.json(mockResponse, { status: 201 })
        })
      )

      const result = await client.createMeetWorkspace({
        domain: "bots.acme.com",
        generate_keypair: true
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.workspace_id).toBe(workspaceId)
        expect(result.data.cert_pem).toContain("BEGIN CERTIFICATE")
      }
    })

    it("should handle create meet workspace duplicate-domain error", async () => {
      const mockError = createMockV2ErrorResponse(
        "Workspace for this domain already exists",
        "DUPLICATE_DOMAIN",
        409
      )

      server.use(
        http.post("https://api.meetingbaas.com/v2/meet-workspaces", () => {
          return HttpResponse.json(mockError, { status: 409 })
        })
      )

      const result = await client.createMeetWorkspace({
        domain: "bots.acme.com",
        generate_keypair: true
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("DUPLICATE_DOMAIN")
        expect(result.statusCode).toBe(409)
      }
    })

    it("should list meet workspaces successfully", async () => {
      const mockResponse = createMockV2SuccessResponse([
        {
          workspace_id: workspaceId,
          name: "Acme",
          domain: "bots.acme.com",
          cert_pem: "cert",
          state: "active" as const
        }
      ])

      server.use(
        http.get("https://api.meetingbaas.com/v2/meet-workspaces", () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.listMeetWorkspaces()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true)
        expect(result.data).toHaveLength(1)
        expect(result.data[0].workspace_id).toBe(workspaceId)
      }
    })

    it("should get meet workspace successfully", async () => {
      const mockResponse = createMockV2SuccessResponse({
        workspace_id: workspaceId,
        name: "Acme",
        domain: "bots.acme.com",
        cert_pem: "cert",
        state: "active"
      })

      server.use(
        http.get(`https://api.meetingbaas.com/v2/meet-workspaces/${workspaceId}`, () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.getMeetWorkspace({ workspace_id: workspaceId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.workspace_id).toBe(workspaceId)
      }
    })

    it("should update meet workspace successfully", async () => {
      const mockResponse = createMockV2SuccessResponse({
        workspace_id: workspaceId,
        name: "Acme Renamed",
        domain: "bots.acme.com",
        cert_pem: "cert",
        state: "active"
      })

      server.use(
        http.patch(`https://api.meetingbaas.com/v2/meet-workspaces/${workspaceId}`, () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.updateMeetWorkspace({
        workspace_id: workspaceId,
        body: { name: "Acme Renamed" }
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe("Acme Renamed")
      }
    })

    it("should delete meet workspace successfully", async () => {
      const mockResponse = createMockV2SuccessResponse({
        message: "Workspace deleted"
      })

      server.use(
        http.delete(`https://api.meetingbaas.com/v2/meet-workspaces/${workspaceId}`, () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.deleteMeetWorkspace({ workspace_id: workspaceId })

      expect(result.success).toBe(true)
    })

    it("should infer meet workspace methods on v2 client", () => {
      expect(client).toHaveProperty("createMeetWorkspace")
      expect(client).toHaveProperty("listMeetWorkspaces")
      expect(client).toHaveProperty("getMeetWorkspace")
      expect(client).toHaveProperty("updateMeetWorkspace")
      expect(client).toHaveProperty("deleteMeetWorkspace")
    })
  })

  describe("Meet logins", () => {
    const workspaceId = "22222222-2222-4222-8222-222222222222"
    const credentialId = "33333333-3333-4333-8333-333333333333"

    it("should create meet login successfully", async () => {
      const mockResponse = createMockV2SuccessResponse({
        credential_id: credentialId,
        workspace_id: workspaceId,
        name: "bot1",
        email: "bot1@bots.acme.com",
        email_group: null,
        state: "active",
        active_session_count: 0
      })

      server.use(
        http.post("https://api.meetingbaas.com/v2/meet-logins", () => {
          return HttpResponse.json(mockResponse, { status: 201 })
        })
      )

      const result = await client.createMeetLogin({
        workspace_id: workspaceId,
        name: "bot1",
        email: "bot1@bots.acme.com"
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.credential_id).toBe(credentialId)
        expect(result.data.email).toBe("bot1@bots.acme.com")
      }
    })

    it("should handle create meet login domain-mismatch error", async () => {
      const mockError = createMockV2ErrorResponse(
        "Email domain does not match workspace",
        "DOMAIN_MISMATCH",
        422
      )

      server.use(
        http.post("https://api.meetingbaas.com/v2/meet-logins", () => {
          return HttpResponse.json(mockError, { status: 422 })
        })
      )

      const result = await client.createMeetLogin({
        workspace_id: workspaceId,
        name: "bot1",
        email: "bot1@bots.acme.com"
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("DOMAIN_MISMATCH")
        expect(result.statusCode).toBe(422)
      }
    })

    it("should list meet logins successfully", async () => {
      const mockResponse = createMockV2SuccessResponse([
        {
          credential_id: credentialId,
          workspace_id: workspaceId,
          name: "bot1",
          email: "bot1@bots.acme.com",
          email_group: null,
          state: "active" as const,
          active_session_count: 0
        }
      ])

      server.use(
        http.get("https://api.meetingbaas.com/v2/meet-logins", () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.listMeetLogins()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true)
        expect(result.data).toHaveLength(1)
      }
    })

    it("should get meet login utilization successfully", async () => {
      const mockResponse = createMockV2SuccessResponse({
        logins_total: 3,
        logins_active: 3,
        logins_invalid: 0,
        concurrent_sessions: 12,
        concurrent_capacity: 60,
        utilization_pct: 20,
        by_email_group: []
      })

      server.use(
        http.get("https://api.meetingbaas.com/v2/meet-logins/utilization", () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.getMeetLoginUtilization()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.concurrent_capacity).toBe(60)
        expect(result.data.utilization_pct).toBe(20)
      }
    })

    it("should get meet login successfully", async () => {
      const mockResponse = createMockV2SuccessResponse({
        credential_id: credentialId,
        workspace_id: workspaceId,
        name: "bot1",
        email: "bot1@bots.acme.com",
        email_group: null,
        state: "active",
        active_session_count: 0
      })

      server.use(
        http.get(`https://api.meetingbaas.com/v2/meet-logins/${credentialId}`, () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.getMeetLogin({ credential_id: credentialId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.credential_id).toBe(credentialId)
      }
    })

    it("should update meet login successfully", async () => {
      const mockResponse = createMockV2SuccessResponse({
        credential_id: credentialId,
        workspace_id: workspaceId,
        name: "bot1 renamed",
        email: "bot1@bots.acme.com",
        email_group: null,
        state: "active",
        active_session_count: 0
      })

      server.use(
        http.patch(`https://api.meetingbaas.com/v2/meet-logins/${credentialId}`, () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.updateMeetLogin({
        credential_id: credentialId,
        body: { name: "bot1 renamed" }
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe("bot1 renamed")
      }
    })

    it("should delete meet login successfully", async () => {
      const mockResponse = createMockV2SuccessResponse({
        message: "Login deleted"
      })

      server.use(
        http.delete(`https://api.meetingbaas.com/v2/meet-logins/${credentialId}`, () => {
          return HttpResponse.json(mockResponse, { status: 200 })
        })
      )

      const result = await client.deleteMeetLogin({ credential_id: credentialId })

      expect(result.success).toBe(true)
    })

    it("should infer meet login methods on v2 client", () => {
      expect(client).toHaveProperty("createMeetLogin")
      expect(client).toHaveProperty("listMeetLogins")
      expect(client).toHaveProperty("getMeetLogin")
      expect(client).toHaveProperty("getMeetLoginUtilization")
      expect(client).toHaveProperty("updateMeetLogin")
      expect(client).toHaveProperty("deleteMeetLogin")
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
        message: "Custom error message",
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
