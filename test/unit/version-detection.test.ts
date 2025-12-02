import { describe, expect, it } from "vitest"
import { createBaasClient } from "../../src/node/client"
import { createMockApiKey } from "../setup"

describe("Version Detection", () => {
  describe("v1 client (default)", () => {
    it("should create v1 client by default", () => {
      const client = createBaasClient({
        api_key: createMockApiKey()
      })

      expect(client.getBaseUrl()).toBe("https://api.meetingbaas.com")
      // v1 methods should be available
      expect(client).toHaveProperty("joinMeeting")
      expect(client).toHaveProperty("leaveMeeting")
      expect(client).toHaveProperty("getMeetingData")
      // v2-only methods should not be available (listBots exists in both v1 and v2)
      expect(client).not.toHaveProperty("createBot")
      expect(client).not.toHaveProperty("getBotDetails")
    })

    it("should create v1 client with explicit api_version", () => {
      const client = createBaasClient({
        api_key: createMockApiKey(),
        api_version: "v1"
      })

      expect(client.getBaseUrl()).toBe("https://api.meetingbaas.com")
      expect(client).toHaveProperty("joinMeeting")
    })
  })

  describe("v2 client", () => {
    it("should create v2 client with explicit api_version", () => {
      const client = createBaasClient({
        api_key: createMockApiKey(),
        api_version: "v2"
      })

      expect(client.getBaseUrl()).toBe("https://api.meetingbaas.com")
      // v2 methods should be available
      expect(client).toHaveProperty("createBot")
      expect(client).toHaveProperty("listBots")
      expect(client).toHaveProperty("getBotDetails")
      // v1 methods should not be available
      expect(client).not.toHaveProperty("joinMeeting")
      expect(client).not.toHaveProperty("leaveMeeting")
    })

    it("should create v2 client with custom base URL", () => {
      const client = createBaasClient({
        api_key: createMockApiKey(),
        base_url: "https://custom-api.example.com",
        api_version: "v2"
      })

      expect(client.getBaseUrl()).toBe("https://custom-api.example.com")
    })
  })

  describe("backward compatibility", () => {
    it("should maintain backward compatibility - existing code should work without changes", () => {
      // This simulates existing code that doesn't specify api_version
      const client = createBaasClient({
        api_key: createMockApiKey()
      })

      // Should default to v1 and have v1 methods
      expect(client.getBaseUrl()).toBe("https://api.meetingbaas.com")
      expect(client).toHaveProperty("joinMeeting")
    })

    it("should allow migration to v2 by changing only api_version", () => {
      // Old code
      const v1Client = createBaasClient({
        api_key: createMockApiKey()
      })

      // Migrated code - only change is api_version
      const v2Client = createBaasClient({
        api_key: createMockApiKey(),
        api_version: "v2"
      })

      expect(v1Client.getBaseUrl()).toBe("https://api.meetingbaas.com")
      expect(v2Client.getBaseUrl()).toBe("https://api.meetingbaas.com")
      expect(v1Client).toHaveProperty("joinMeeting")
      expect(v2Client).toHaveProperty("createBot")
    })
  })
})
