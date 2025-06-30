import { beforeEach, describe, expect, it } from "vitest"
import {
  getListRawCalendarsMockHandler,
  getListRawCalendarsResponseMock,
  getResyncAllMockHandler,
  getResyncAllResponseMock
} from "../../src/generated/api/calendars/calendars.msw"
import { createBaasClient } from "../../src/node/client"
import { createMockApiKey, server } from "../setup"

describe("Utility Operations Integration Tests", () => {
  let client: ReturnType<typeof createBaasClient>

  beforeEach(() => {
    client = createBaasClient({
      api_key: createMockApiKey()
    })
  })

  describe("resyncAllCalendars", () => {
    it("should resync all calendars successfully", async () => {
      const mockResponse = getResyncAllResponseMock({
        synced_calendars: [
          "123e4567-e89b-12d3-a456-426614174000",
          "987fcdeb-51a2-43d1-b789-123456789abc"
        ],
        errors: []
      })

      server.use(getResyncAllMockHandler(mockResponse))

      const result = await client.resyncAllCalendars()
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockResponse)
      }
    })

    it("should handle resync errors", async () => {
      const mockResponse = getResyncAllResponseMock({
        synced_calendars: ["123e4567-e89b-12d3-a456-426614174000"],
        errors: [
          [{ error: "Calendar not found", calendar_id: "987fcdeb-51a2-43d1-b789-123456789abc" }]
        ]
      })

      server.use(getResyncAllMockHandler(mockResponse))

      const result = await client.resyncAllCalendars()
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockResponse)
        expect(result.data.synced_calendars).toHaveLength(1)
        expect(result.data.errors).toHaveLength(1)
      }
    })
  })

  describe("listRawCalendars", () => {
    it("should list raw calendars successfully", async () => {
      const params = {
        oauth_client_id: "client123",
        oauth_client_secret: "secret123",
        oauth_refresh_token: "token123",
        platform: "Google" as const
      }

      const mockResponse = getListRawCalendarsResponseMock({
        calendars: [
          {
            id: "calendar1",
            email: "calendar1@example.com",
            is_primary: true
          },
          {
            id: "calendar2",
            email: "calendar2@example.com",
            is_primary: false
          }
        ]
      })

      server.use(getListRawCalendarsMockHandler(mockResponse))

      const result = await client.listRawCalendars(params)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockResponse)
      }
    })

    it("should list raw calendars for Microsoft platform", async () => {
      const params = {
        oauth_client_id: "client123",
        oauth_client_secret: "secret123",
        oauth_refresh_token: "token123",
        platform: "Microsoft" as const
      }

      const mockResponse = getListRawCalendarsResponseMock({
        calendars: [
          {
            id: "outlook-calendar",
            email: "calendar@outlook.com",
            is_primary: true
          }
        ]
      })

      server.use(getListRawCalendarsMockHandler(mockResponse))

      const result = await client.listRawCalendars(params)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockResponse)
      }
    })
  })

  describe("getApiKey", () => {
    it("should return the API key", () => {
      const apiKey = client.getApiKey()
      expect(apiKey).toBe(createMockApiKey())
    })
  })

  describe("createBaasClient function", () => {
    it("should create a client with default configuration", () => {
      const testClient = createBaasClient({
        api_key: "test-api-key"
      })

      expect(testClient).toBeDefined()
      expect(testClient.getApiKey()).toBe("test-api-key")
    })

    it("should create a client with custom base URL", () => {
      const testClient = createBaasClient({
        api_key: "test-api-key",
        base_url: "https://custom-api.example.com"
      })

      expect(testClient).toBeDefined()
      expect(testClient.getApiKey()).toBe("test-api-key")
    })
  })
})
