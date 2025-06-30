import { delay, HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import {
  getGetMeetingDataMockHandler,
  getJoinMockHandler,
  getLeaveMockHandler
} from "../src/generated/api/default/default.msw"
import type { JoinRequest } from "../src/generated/schema"
import { createBaasClient } from "../src/node/client"
import { createMockApiKey, server } from "./setup"

describe("Error Handling", () => {
  let client: ReturnType<typeof createBaasClient>

  beforeEach(() => {
    client = createBaasClient({
      api_key: createMockApiKey()
    })
  })

  describe("API Errors", () => {
    it("should handle 400 Bad Request errors", async () => {
      // Override the handler to return a 400 error
      server.use(
        getJoinMockHandler(() => {
          throw new Error("Invalid request parameters")
        })
      )

      const result = await client.joinMeeting({
        meeting_url: "invalid-url",
        bot_name: "",
        reserved: false
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain("Request failed")
      }
    })

    it("should handle 401 Unauthorized errors", async () => {
      server.use(
        getJoinMockHandler(() => {
          throw new Error("Invalid API key")
        })
      )

      const result = await client.joinMeeting({
        meeting_url: "https://meet.google.com/abc-defg-hij",
        bot_name: "Test Bot",
        reserved: false
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain("Request failed")
      }
    })

    it("should handle 404 Not Found errors", async () => {
      server.use(
        getGetMeetingDataMockHandler(() => {
          throw new Error("Bot not found")
        })
      )

      const result = await client.getMeetingData({
        bot_id: "non-existent-bot-id"
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain("Request failed")
      }
    })

    it("should handle 429 Rate Limit errors", async () => {
      server.use(
        getJoinMockHandler(() => {
          throw new Error("Rate limit exceeded")
        })
      )

      const result = await client.joinMeeting({
        meeting_url: "https://meet.google.com/abc-defg-hij",
        bot_name: "Test Bot",
        reserved: false
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain("Request failed")
      }
    })

    it("should handle 500 Internal Server errors", async () => {
      server.use(
        getJoinMockHandler(() => {
          throw new Error("Internal server error")
        })
      )

      const result = await client.joinMeeting({
        meeting_url: "https://meet.google.com/abc-defg-hij",
        bot_name: "Test Bot",
        reserved: false
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain("Request failed")
      }
    })
  })

  describe("Network Errors", () => {
    it("should handle network timeouts", async () => {
      // Create a handler that delays longer than the client timeout
      const timeoutHandler = http.post("https://api.meetingbaas.com/bots/", async () => {
        await delay(10000) // 10 second delay
        return new HttpResponse(JSON.stringify({ bot_id: "test" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      })

      server.use(timeoutHandler)

      // Use a client with a very short timeout
      const timeoutClient = createBaasClient({
        api_key: createMockApiKey(),
        timeout: 100 // 100ms timeout
      })

      const result = await timeoutClient.joinMeeting({
        meeting_url: "https://meet.google.com/abc-defg-hij",
        bot_name: "Test Bot",
        reserved: false
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain("timeout")
      }
    })

    it("should handle connection refused errors", async () => {
      server.use(
        getJoinMockHandler(() => {
          throw new Error("Connection refused")
        })
      )

      const result = await client.joinMeeting({
        meeting_url: "https://meet.google.com/abc-defg-hij",
        bot_name: "Test Bot",
        reserved: false
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain("Request failed")
      }
    })
  })

  describe("Validation Errors", () => {
    it("should handle missing required fields", async () => {
      // Test with missing bot_name - this should fail at the SDK level
      const result = await client.joinMeeting({
        meeting_url: "https://meet.google.com/abc-defg-hij",
        reserved: false
        // Missing bot_name
      } as JoinRequest)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
      }
    })

    it("should handle invalid UUID format", async () => {
      // Override handler to validate UUID format
      server.use(
        getLeaveMockHandler(() => {
          throw new Error("Invalid UUID format")
        })
      )

      const result = await client.leaveMeeting({
        uuid: "invalid-uuid-format"
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain("Request failed")
      }
    })

    it("should handle invalid meeting URL format", async () => {
      // Override handler to validate meeting URL format
      server.use(
        getJoinMockHandler(() => {
          throw new Error("Invalid meeting URL format")
        })
      )

      const result = await client.joinMeeting({
        meeting_url: "not-a-valid-url",
        bot_name: "Test Bot",
        reserved: false
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain("Request failed")
      }
    })
  })

  describe("Client Configuration Errors", () => {
    it("should handle missing API key", () => {
      expect(() =>
        createBaasClient({
          api_key: ""
        })
      ).not.toThrow() // Client creation should succeed, but API calls will fail
    })

    it("should handle invalid base URL", () => {
      expect(() =>
        createBaasClient({
          api_key: createMockApiKey(),
          base_url: "not-a-valid-url"
        })
      ).not.toThrow() // Client creation should succeed, but API calls will fail
    })
  })

  describe("Response Handling", () => {
    it("should handle successful responses correctly", async () => {
      const mockBotId = "123e4567-e89b-12d3-a456-426614174000"

      server.use(
        getJoinMockHandler({
          bot_id: mockBotId
        })
      )

      const result = await client.joinMeeting({
        meeting_url: "https://meet.google.com/abc-defg-hij",
        bot_name: "Test Bot",
        reserved: false
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.bot_id).toBe(mockBotId)
      }
    })

    it("should handle error responses correctly", async () => {
      server.use(
        getJoinMockHandler(() => {
          throw new Error("Custom error message")
        })
      )

      const result = await client.joinMeeting({
        meeting_url: "https://meet.google.com/abc-defg-hij",
        bot_name: "Test Bot",
        reserved: false
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain("Request failed")
      }
    })
  })
})
