import { beforeEach, describe, expect, it } from "vitest"
import {
  getBotsWithMetadataMockHandler,
  getBotsWithMetadataResponseMock,
  getDeleteDataMockHandler,
  getGetMeetingDataMockHandler,
  getGetMeetingDataResponseMock,
  getGetScreenshotsMockHandler,
  getJoinMockHandler,
  getLeaveMockHandler,
  getRetranscribeBotMockHandler
} from "../../src/generated/v1/api/default/default.msw"
import { type BaasClient, createBaasClient } from "../../src/node/client"
import { createMockApiKey, server } from "../setup"

describe("Bot Operations Integration Tests", () => {
  let client: BaasClient<"v1">

  beforeEach(() => {
    client = createBaasClient({
      api_key: createMockApiKey(),
      api_version: "v1"
    })
  })

  describe("joinMeeting", () => {
    it("should join a meeting successfully", async () => {
      const botId = "123e4567-e89b-12d3-a456-426614174000"

      server.use(
        getJoinMockHandler({
          bot_id: botId
        })
      )

      const result = await client.joinMeeting({
        meeting_url: "https://meet.google.com/abc-defg-hij",
        bot_name: "Test Bot",
        reserved: false
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ bot_id: botId })
      }
    })

    it("should join a meeting with webhook URL", async () => {
      const botId = "123e4567-e89b-12d3-a456-426614174000"

      server.use(
        getJoinMockHandler({
          bot_id: botId
        })
      )

      const result = await client.joinMeeting({
        meeting_url: "https://meet.google.com/abc-defg-hij",
        bot_name: "Test Bot",
        reserved: false,
        webhook_url: "https://example.com/webhook"
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ bot_id: botId })
      }
    })

    it("should join a reserved meeting", async () => {
      const botId = "123e4567-e89b-12d3-a456-426614174000"

      server.use(
        getJoinMockHandler({
          bot_id: botId
        })
      )

      const result = await client.joinMeeting({
        meeting_url: "https://meet.google.com/abc-defg-hij",
        bot_name: "Test Bot",
        reserved: true
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ bot_id: botId })
      }
    })
  })

  describe("leaveMeeting", () => {
    it("should leave a meeting successfully", async () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000"

      server.use(
        getLeaveMockHandler({
          ok: true
        })
      )

      const result = await client.leaveMeeting({ uuid })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ ok: true })
      }
    })
  })

  describe("getMeetingData", () => {
    it("should get meeting data successfully", async () => {
      const mockMetadata = getGetMeetingDataResponseMock()

      server.use(getGetMeetingDataMockHandler(mockMetadata))

      const result = await client.getMeetingData({
        bot_id: "123e4567-e89b-12d3-a456-426614174000",
        include_transcripts: true
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockMetadata)
      }
    })

    it("should get meeting data without transcripts", async () => {
      const mockMetadata = getGetMeetingDataResponseMock()

      server.use(getGetMeetingDataMockHandler(mockMetadata))

      const result = await client.getMeetingData({
        bot_id: "123e4567-e89b-12d3-a456-426614174000",
        include_transcripts: false
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockMetadata)
      }
    })
  })

  describe("deleteBotData", () => {
    it("should delete bot data successfully", async () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000"

      server.use(
        getDeleteDataMockHandler({
          ok: true,
          status: "deleted"
        })
      )

      const result = await client.deleteBotData({ uuid })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ ok: true, status: "deleted" })
      }
    })
  })

  describe("listBots", () => {
    it("should list bots without query parameters", async () => {
      const mockBots = getBotsWithMetadataResponseMock()

      server.use(getBotsWithMetadataMockHandler(mockBots))

      const result = await client.listBots()
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockBots)
      }
    })

    it("should list bots with query parameters", async () => {
      const mockBots = getBotsWithMetadataResponseMock()

      server.use(getBotsWithMetadataMockHandler(mockBots))

      const result = await client.listBots({
        bot_name: "Test",
        limit: 5,
        meeting_url: "meet.google.com"
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockBots)
      }
    })
  })

  describe("retranscribeBot", () => {
    it("should retranscribe bot successfully", async () => {
      server.use(getRetranscribeBotMockHandler())

      const result = await client.retranscribeBot({
        bot_uuid: "123e4567-e89b-12d3-a456-426614174000"
      })

      expect(result.success).toBe(true)
    })

    it("should retranscribe bot with custom settings", async () => {
      server.use(getRetranscribeBotMockHandler())

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
      const mockScreenshots = [
        {
          date: "2023-01-01T00:00:00Z",
          url: "https://s3.amazonaws.com/screenshots/screenshot1.jpg"
        },
        {
          date: "2023-01-01T01:00:00Z",
          url: "https://s3.amazonaws.com/screenshots/screenshot2.jpg"
        }
      ]

      server.use(getGetScreenshotsMockHandler(mockScreenshots))

      const result = await client.getScreenshots({
        uuid: "123e4567-e89b-12d3-a456-426614174000"
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockScreenshots)
      }
    })
  })
})
