import { beforeEach, describe, expect, it } from "vitest"
import {
  getCreateCalendarMockHandler,
  getCreateCalendarResponseMock,
  getDeleteCalendarMockHandler,
  getGetCalendarMockHandler,
  getGetCalendarResponseMock,
  getGetEventMockHandler,
  getGetEventResponseMock,
  getListCalendarsMockHandler,
  getListCalendarsResponseMock,
  getListEventsMockHandler,
  getListEventsResponseMock,
  getListRawCalendarsMockHandler,
  getListRawCalendarsResponseMock,
  getPatchBotMockHandler,
  getPatchBotResponseMock,
  getResyncAllMockHandler,
  getResyncAllResponseMock,
  getScheduleRecordEventMockHandler,
  getScheduleRecordEventResponseMock,
  getUnscheduleRecordEventMockHandler,
  getUnscheduleRecordEventResponseMock,
  getUpdateCalendarMockHandler
} from "../../src/generated/api/calendars/calendars.msw"
import { createBaasClient } from "../../src/node/client"
import { createMockApiKey, server } from "../setup"

describe("Calendar Operations Integration", () => {
  let client: ReturnType<typeof createBaasClient>

  beforeEach(() => {
    client = createBaasClient({
      api_key: createMockApiKey()
    })
  })

  describe("Calendar Lifecycle", () => {
    it("should create, list, get, update, and delete a calendar", async () => {
      const mockCalendar = getCreateCalendarResponseMock()

      server.use(getCreateCalendarMockHandler(mockCalendar))

      // Create calendar
      const createResult = await client.createCalendar({
        platform: "Google",
        oauth_client_id: "test-client-id",
        oauth_client_secret: "test-client-secret",
        oauth_refresh_token: "test-refresh-token"
      })

      expect(createResult.success).toBe(true)
      if (createResult.success) {
        expect(createResult.data).toHaveProperty("calendar")
        expect(createResult.data.calendar).toHaveProperty("uuid")
        expect(createResult.data.calendar).toHaveProperty("email")
        expect(createResult.data.calendar).toHaveProperty("name")

        const calendarUuid = createResult.data.calendar.uuid

        // List calendars
        const mockCalendars = getListCalendarsResponseMock()
        server.use(getListCalendarsMockHandler(mockCalendars))

        const listResult = await client.listCalendars()
        expect(listResult.success).toBe(true)
        if (listResult.success) {
          expect(Array.isArray(listResult.data)).toBe(true)
          expect(listResult.data.length).toBeGreaterThan(0)
        }

        // Get specific calendar
        const mockGetCalendar = getGetCalendarResponseMock({ uuid: calendarUuid })
        server.use(getGetCalendarMockHandler(mockGetCalendar))

        const getResult = await client.getCalendar({ uuid: calendarUuid })
        expect(getResult.success).toBe(true)
        if (getResult.success) {
          expect(getResult.data.uuid).toBe(calendarUuid)
        }

        // Update calendar
        const mockUpdateCalendar = getCreateCalendarResponseMock()
        server.use(getUpdateCalendarMockHandler(mockUpdateCalendar))

        const updateResult = await client.updateCalendar({
          uuid: calendarUuid,
          body: {
            platform: "Google",
            oauth_client_id: "updated-client-id",
            oauth_client_secret: "updated-client-secret",
            oauth_refresh_token: "updated-refresh-token"
          }
        })
        expect(updateResult.success).toBe(true)
        if (updateResult.success) {
          expect(updateResult.data).toHaveProperty("calendar")
        }

        // Delete calendar
        server.use(getDeleteCalendarMockHandler())

        const deleteResult = await client.deleteCalendar({ uuid: calendarUuid })
        expect(deleteResult.success).toBe(true)
      }
    }, 10000)
  })

  describe("Event Management", () => {
    let calendarUuid: string

    beforeEach(async () => {
      // Create a calendar for testing events
      const mockCalendar = getCreateCalendarResponseMock()
      server.use(getCreateCalendarMockHandler(mockCalendar))

      const createResult = await client.createCalendar({
        platform: "Google",
        oauth_client_id: "test-client-id",
        oauth_client_secret: "test-client-secret",
        oauth_refresh_token: "test-refresh-token"
      })

      if (createResult.success) {
        calendarUuid = createResult.data.calendar.uuid
      } else {
        calendarUuid = "test-uuid"
      }
    })

    it("should list events for a calendar", async () => {
      const mockEvents = getListEventsResponseMock()
      server.use(getListEventsMockHandler(mockEvents))

      const result = await client.listCalendarEvents({
        calendar_id: calendarUuid,
        start_date_gte: new Date().toISOString(),
        start_date_lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("data")
        expect(Array.isArray(result.data.data)).toBe(true)
        // Note: next property might not be present in all responses
      }
    }, 10000)

    it("should get a specific event", async () => {
      // First list events to get an event UUID
      const mockEvents = getListEventsResponseMock()
      server.use(getListEventsMockHandler(mockEvents))

      const listResult = await client.listCalendarEvents({
        calendar_id: calendarUuid
      })

      if (listResult.success && listResult.data.data.length > 0) {
        const eventUuid = listResult.data.data[0].uuid

        const mockEvent = getGetEventResponseMock({ uuid: eventUuid })
        server.use(getGetEventMockHandler(mockEvent))

        const event = await client.getCalendarEvent({ uuid: eventUuid })

        expect(event.success).toBe(true)
        if (event.success) {
          expect(event.data).toHaveProperty("uuid")
          expect(event.data).toHaveProperty("name")
          expect(event.data).toHaveProperty("start_time")
          expect(event.data).toHaveProperty("end_time")
          expect(event.data).toHaveProperty("meeting_url")
        }
      }
    }, 10000)

    it("should schedule and unschedule a bot for an event", async () => {
      // First list events to get an event UUID
      const mockEvents = getListEventsResponseMock()
      server.use(getListEventsMockHandler(mockEvents))

      const listResult = await client.listCalendarEvents({
        calendar_id: calendarUuid
      })

      if (listResult.success && listResult.data.data.length > 0) {
        const eventUuid = listResult.data.data[0].uuid

        // Schedule bot - ensure we have a proper mock response
        const mockScheduleResult = getScheduleRecordEventResponseMock()
        const scheduleHandler = getScheduleRecordEventMockHandler(mockScheduleResult)
        server.use(scheduleHandler)

        const scheduleResult = await client.scheduleCalendarRecordEvent({
          uuid: eventUuid,
          body: {
            bot_name: "Scheduled Bot",
            extra: { test: true },
            webhook_url: "https://example.com/webhook"
          },
          query: {
            all_occurrences: false
          }
        })

        expect(scheduleResult.success).toBe(true)
        if (scheduleResult.success) {
          expect(Array.isArray(scheduleResult.data)).toBe(true)
          expect(scheduleResult.data.length).toBeGreaterThan(0)
        }

        // Unschedule bot - ensure we have a proper mock response
        const mockUnscheduleResult = getUnscheduleRecordEventResponseMock()
        const unscheduleHandler = getUnscheduleRecordEventMockHandler(mockUnscheduleResult)
        server.use(unscheduleHandler)

        const unscheduleResult = await client.unscheduleCalendarRecordEvent({
          uuid: eventUuid,
          query: {
            all_occurrences: false
          }
        })

        expect(unscheduleResult.success).toBe(true)
        if (unscheduleResult.success) {
          expect(Array.isArray(unscheduleResult.data)).toBe(true)
          expect(unscheduleResult.data.length).toBeGreaterThan(0)
        }
      }
    }, 10000)

    it("should patch bot configuration for an event", async () => {
      // First list events to get an event UUID
      const mockEvents = getListEventsResponseMock()
      server.use(getListEventsMockHandler(mockEvents))

      const listResult = await client.listCalendarEvents({
        calendar_id: calendarUuid
      })

      if (listResult.success && listResult.data.data.length > 0) {
        const eventUuid = listResult.data.data[0].uuid

        // Ensure we have a proper mock response for patching
        const mockPatchResult = getPatchBotResponseMock()
        const patchHandler = getPatchBotMockHandler(mockPatchResult)
        server.use(patchHandler)

        const patchResult = await client.patchBot({
          uuid: eventUuid,
          body: {
            bot_name: "Updated Bot Name",
            extra: { updated: true }
          },
          query: {
            all_occurrences: false
          }
        })

        expect(patchResult.success).toBe(true)
        if (patchResult.success) {
          expect(Array.isArray(patchResult.data)).toBe(true)
          expect(patchResult.data.length).toBeGreaterThan(0)
        }
      }
    }, 10000)
  })

  describe("Raw Calendar Operations", () => {
    it("should list raw calendars from OAuth provider", async () => {
      const mockRawCalendars = getListRawCalendarsResponseMock()
      server.use(getListRawCalendarsMockHandler(mockRawCalendars))

      const result = await client.listRawCalendars({
        platform: "Google",
        oauth_client_id: "test-client-id",
        oauth_client_secret: "test-client-secret",
        oauth_refresh_token: "test-refresh-token"
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("calendars")
        expect(Array.isArray(result.data.calendars)).toBe(true)
        expect(result.data.calendars.length).toBeGreaterThan(0)
        expect(result.data.calendars[0]).toHaveProperty("email")
        expect(result.data.calendars[0]).toHaveProperty("id")
        expect(result.data.calendars[0]).toHaveProperty("is_primary")
      }
    }, 10000)
  })

  describe("Calendar Sync Operations", () => {
    it("should resync all calendars", async () => {
      const mockResyncResult = getResyncAllResponseMock()
      server.use(getResyncAllMockHandler(mockResyncResult))

      const result = await client.resyncAllCalendars()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty("synced_calendars")
        expect(result.data).toHaveProperty("errors")
        expect(Array.isArray(result.data.synced_calendars)).toBe(true)
        expect(Array.isArray(result.data.errors)).toBe(true)
      }
    }, 10000)
  })
})
