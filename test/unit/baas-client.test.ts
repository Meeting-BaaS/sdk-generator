import { beforeEach, describe, expect, it } from "vitest"
import { createBaasClient } from "../../src/node/client"
import { createMockApiKey } from "../setup"

describe("BaasClient", () => {
  let client: ReturnType<typeof createBaasClient>

  beforeEach(() => {
    client = createBaasClient({
      api_key: createMockApiKey()
    })
  })

  describe("constructor", () => {
    it("should create a client with default configuration", () => {
      expect(client).toBeDefined()
      expect(client.getApiKey()).toBe(createMockApiKey())
    })

    it("should create a client with custom configuration", () => {
      const customClient = createBaasClient({
        api_key: "custom-key",
        base_url: "https://custom-api.example.com"
      })

      expect(customClient.getApiKey()).toBe("custom-key")
    })
  })

  describe("joinMeeting", () => {
    it("should join a meeting successfully", async () => {
      const result = await client.joinMeeting({
        meeting_url: "https://meet.google.com/abc-defg-hij",
        bot_name: "Test Bot",
        reserved: false
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("bot_id")
        expect(typeof result.data.bot_id).toBe("string")
      }
    })

    it("should handle join meeting with all optional parameters", async () => {
      const result = await client.joinMeeting({
        meeting_url: "https://meet.google.com/abc-defg-hij",
        bot_name: "Test Bot",
        reserved: false,
        bot_image: "https://example.com/bot-image.jpg",
        enter_message: "Hello from the bot!",
        extra: { customer_id: "12345" },
        recording_mode: "speaker_view",
        speech_to_text: { provider: "Gladia" },
        webhook_url: "https://example.com/webhook"
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("bot_id")
      }
    })
  })

  describe("leaveMeeting", () => {
    it("should leave a meeting successfully", async () => {
      const result = await client.leaveMeeting({
        uuid: "123e4567-e89b-12d3-a456-426614174000"
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("ok")
        expect(result.data.ok).toBe(true)
      }
    })
  })

  describe("getMeetingData", () => {
    it("should get meeting data successfully", async () => {
      const result = await client.getMeetingData({
        bot_id: "123e4567-e89b-12d3-a456-426614174000"
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("bot_data")
        expect(result.data).toHaveProperty("duration")
        expect(result.data).toHaveProperty("mp4")
        expect(result.data.bot_data).toHaveProperty("bot")
        expect(result.data.bot_data).toHaveProperty("transcripts")
      }
    })

    it("should get meeting data without transcripts", async () => {
      const result = await client.getMeetingData({
        bot_id: "123e4567-e89b-12d3-a456-426614174000",
        include_transcripts: false
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("bot_data")
      }
    })
  })

  describe("deleteBotData", () => {
    it("should delete bot data successfully", async () => {
      const result = await client.deleteBotData({
        uuid: "123e4567-e89b-12d3-a456-426614174000"
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("ok")
        expect(result.data).toHaveProperty("status")
        expect(result.data.ok).toBe(true)
        expect(result.data.status).toBe("deleted")
      }
    })
  })

  describe("listBots", () => {
    it("should list bots successfully", async () => {
      const result = await client.listBots()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("bots")
        expect(Array.isArray(result.data.bots)).toBe(true)
        expect(result.data.bots.length).toBeGreaterThan(0)
        expect(result.data.bots[0]).toHaveProperty("bot_name")
        expect(result.data.bots[0]).toHaveProperty("uuid")
      }
    })

    it("should list bots with filtering", async () => {
      const result = await client.listBots({
        bot_name: "Test",
        limit: 5,
        meeting_url: "meet.google.com"
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("bots")
        expect(Array.isArray(result.data.bots)).toBe(true)
      }
    })
  })

  describe("retranscribeBot", () => {
    it("should retranscribe bot successfully", async () => {
      const result = await client.retranscribeBot({
        bot_uuid: "123e4567-e89b-12d3-a456-426614174000"
      })

      expect(result.success).toBe(true)
    })

    it("should retranscribe bot with custom settings", async () => {
      const result = await client.retranscribeBot({
        bot_uuid: "123e4567-e89b-12d3-a456-426614174000",
        speech_to_text: {
          provider: "Gladia",
          api_key: "custom-api-key"
        },
        webhook_url: "https://example.com/webhook"
      })

      expect(result.success).toBe(true)
    })
  })

  describe("getScreenshots", () => {
    it("should get screenshots successfully", async () => {
      const result = await client.getScreenshots({
        uuid: "123e4567-e89b-12d3-a456-426614174000"
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true)
        expect(result.data.length).toBeGreaterThan(0)
        expect(result.data[0]).toHaveProperty("date")
        expect(result.data[0]).toHaveProperty("url")
      }
    })
  })

  describe("Client Configuration", () => {
    it("should create client with default configuration", () => {
      const client = createBaasClient({
        api_key: "test-api-key"
      })

      expect(client).toBeDefined()
      expect(typeof client.joinMeeting).toBe("function")
      expect(typeof client.leaveMeeting).toBe("function")
    })

    it("should create client with undefined api_key (fallback to empty string)", () => {
      const client = createBaasClient({
        api_key: undefined as unknown as string
      })

      expect(client).toBeDefined()
      expect(client.getApiKey()).toBe("")
    })

    it("should create client with null api_key (fallback to empty string)", () => {
      const client = createBaasClient({
        api_key: null as unknown as string
      })

      expect(client).toBeDefined()
      expect(client.getApiKey()).toBe("")
    })

    it("should create client with custom configuration", () => {
      const client = createBaasClient({
        api_key: "test-api-key",
        base_url: "https://custom-api.example.com",
        timeout: 60000
      })

      expect(client).toBeDefined()
    })

    it("should expose getApiKey method", () => {
      const client = createBaasClient({
        api_key: "test-api-key"
      })

      expect(client.getApiKey()).toBe("test-api-key")
    })

    it("should use correct base URL in options", () => {
      const client = createBaasClient({
        api_key: "test-api-key",
        base_url: "https://custom-api.example.com"
      })

      // Test that the base URL is used correctly by checking if a method works
      // This indirectly tests the getBaseUrl method through getOptions
      expect(client.getBaseUrl()).toBe("https://custom-api.example.com")
    })
  })
})
