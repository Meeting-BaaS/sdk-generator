import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { type BaasClient, createBaasClient } from "../../src/node/client"
import {
  createMockApiKey,
  createMockV2BatchResponse,
  createMockV2SuccessResponse,
  server
} from "../setup"

describe("v2 Calendar Operations Integration Tests", () => {
  let client: BaasClient<"v2">

  beforeEach(() => {
    client = createBaasClient({
      api_key: createMockApiKey(),
      api_version: "v2"
    })
  })

  describe("listRawCalendars", () => {
    it("should list raw calendars successfully", async () => {
      server.use(
        http.post("https://api.meetingbaas.com/v2/calendars/list-raw", () => {
          return HttpResponse.json(
            createMockV2SuccessResponse([
              {
                id: "cal-1",
                name: "Calendar 1",
                email: "test@example.com",
                is_primary: false
              }
            ]),
            { status: 200 }
          )
        })
      )

      const result = await client.listRawCalendars({
        calendar_platform: "google",
        oauth_client_id: "client-id",
        oauth_client_secret: "client-secret",
        oauth_refresh_token: "refresh-token"
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
      }
    })
  })

  describe("createCalendarConnection", () => {
    it("should create calendar connection successfully", async () => {
      const calendarId = "123e4567-e89b-12d3-a456-426614174000"
      server.use(
        http.post("https://api.meetingbaas.com/v2/calendars", () => {
          return HttpResponse.json(
            createMockV2SuccessResponse({
              calendar_id: calendarId,
              calendar_name: "Test Calendar",
              account_email: "test@example.com"
            }),
            { status: 201 }
          )
        })
      )

      const result = await client.createCalendarConnection({
        calendar_platform: "google",
        oauth_client_id: "client-id",
        oauth_client_secret: "client-secret",
        oauth_refresh_token: "refresh-token",
        raw_calendar_id: "primary"
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.calendar_id).toBe(calendarId)
      }
    })
  })

  describe("updateCalendarConnection", () => {
    it("should update calendar connection successfully", async () => {
      const calendarId = "123e4567-e89b-12d3-a456-426614174000"
      server.use(
        http.patch(`https://api.meetingbaas.com/v2/calendars/${calendarId}`, () => {
          return HttpResponse.json(
            createMockV2SuccessResponse({
              calendar_id: calendarId,
              calendar_name: "Updated Calendar"
            }),
            { status: 200 }
          )
        })
      )

      const result = await client.updateCalendarConnection({
        calendar_id: calendarId,
        body: {
          oauth_client_id: "client-id",
          oauth_client_secret: "client-secret",
          oauth_refresh_token: "new-refresh-token"
        }
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.calendar_id).toBe(calendarId)
      }
    })
  })

  describe("deleteCalendarConnection", () => {
    it("should delete calendar connection successfully", async () => {
      const calendarId = "123e4567-e89b-12d3-a456-426614174000"
      server.use(
        http.delete(`https://api.meetingbaas.com/v2/calendars/${calendarId}`, () => {
          return HttpResponse.json(
            createMockV2SuccessResponse({ message: "Calendar deleted successfully" }),
            { status: 200 }
          )
        })
      )

      const result = await client.deleteCalendarConnection({ calendar_id: calendarId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.message).toBe("Calendar deleted successfully")
      }
    })
  })

  describe("syncCalendar", () => {
    it("should sync calendar successfully", async () => {
      const calendarId = "123e4567-e89b-12d3-a456-426614174000"
      server.use(
        http.post(`https://api.meetingbaas.com/v2/calendars/${calendarId}/sync`, () => {
          return HttpResponse.json(
            createMockV2SuccessResponse({ message: "Calendar synced successfully" }),
            { status: 200 }
          )
        })
      )

      const result = await client.syncCalendar({ calendar_id: calendarId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.message).toBe("Calendar synced successfully")
      }
    })
  })

  describe("resubscribeCalendar", () => {
    it("should resubscribe calendar successfully", async () => {
      const calendarId = "123e4567-e89b-12d3-a456-426614174000"
      server.use(
        http.post(`https://api.meetingbaas.com/v2/calendars/${calendarId}/resubscribe`, () => {
          return HttpResponse.json(
            createMockV2SuccessResponse({ message: "Calendar resubscribed successfully" }),
            { status: 200 }
          )
        })
      )

      const result = await client.resubscribeCalendar({ calendar_id: calendarId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ message: "Calendar resubscribed successfully" })
      }
    })
  })

  describe("listEvents", () => {
    it("should list events successfully", async () => {
      const calendarId = "123e4567-e89b-12d3-a456-426614174000"
      server.use(
        http.get(`https://api.meetingbaas.com/v2/calendars/${calendarId}/events`, () => {
          return HttpResponse.json(
            {
              success: true as const,
              data: [
                {
                  event_id: "event-1",
                  title: "Meeting 1",
                  start_time: "2025-12-25T10:00:00Z"
                }
              ],
              cursor: null,
              prev_cursor: null
            },
            { status: 200 }
          )
        })
      )

      const result = await client.listEvents({
        calendar_id: calendarId,
        query: { limit: 50, show_cancelled: true }
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
      }
    })

    it("should list events successfully with undefined query", async () => {
      const calendarId = "123e4567-e89b-12d3-a456-426614174000"
      server.use(
        http.get(`https://api.meetingbaas.com/v2/calendars/${calendarId}/events`, () => {
          return HttpResponse.json(
            {
              success: true as const,
              data: [
                {
                  event_id: "event-1",
                  title: "Meeting 1",
                  start_time: "2025-12-25T10:00:00Z"
                }
              ],
              cursor: null,
              prev_cursor: null
            },
            { status: 200 }
          )
        })
      )

      // Test with undefined query to cover the ?? { limit: 50, show_cancelled: true } branch
      const result = await client.listEvents({
        calendar_id: calendarId,
        query: undefined
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
      }
    })
  })

  describe("getEventDetails", () => {
    it("should get event details successfully", async () => {
      const calendarId = "123e4567-e89b-12d3-a456-426614174000"
      const eventId = "223e4567-e89b-12d3-a456-426614174001"
      server.use(
        http.get(`https://api.meetingbaas.com/v2/calendars/${calendarId}/events/${eventId}`, () => {
          return HttpResponse.json(
            createMockV2SuccessResponse({
              event_id: eventId,
              event_name: "Test Event",
              start_time: "2025-12-25T10:00:00Z"
            }),
            { status: 200 }
          )
        })
      )

      const result = await client.getEventDetails({
        calendar_id: calendarId,
        event_id: eventId
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.event_id).toBe(eventId)
      }
    })
  })

  describe("listEventSeries", () => {
    it("should list event series successfully", async () => {
      const calendarId = "123e4567-e89b-12d3-a456-426614174000"
      server.use(
        http.get(`https://api.meetingbaas.com/v2/calendars/${calendarId}/series`, () => {
          return HttpResponse.json(
            {
              success: true as const,
              data: [
                {
                  series_id: "series-1",
                  series_name: "Recurring Meeting",
                  next_occurrence: "2025-12-25T10:00:00Z"
                }
              ],
              cursor: null,
              prev_cursor: null
            },
            { status: 200 }
          )
        })
      )

      const result = await client.listEventSeries({
        calendar_id: calendarId,
        query: { limit: 50, show_cancelled: true }
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
      }
    })

    it("should list event series successfully with undefined query", async () => {
      const calendarId = "123e4567-e89b-12d3-a456-426614174000"
      server.use(
        http.get(`https://api.meetingbaas.com/v2/calendars/${calendarId}/series`, () => {
          return HttpResponse.json(
            {
              success: true as const,
              data: [
                {
                  series_id: "series-1",
                  series_name: "Recurring Meeting",
                  next_occurrence: "2025-12-25T10:00:00Z"
                }
              ],
              cursor: null,
              prev_cursor: null
            },
            { status: 200 }
          )
        })
      )

      // Test with undefined query to cover the ?? { limit: 50, show_cancelled: true } branch
      const result = await client.listEventSeries({
        calendar_id: calendarId,
        query: undefined
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
      }
    })
  })

  describe("updateCalendarBot", () => {
    it("should update calendar bot successfully", async () => {
      const calendarId = "123e4567-e89b-12d3-a456-426614174000"
      const eventId = "223e4567-e89b-12d3-a456-426614174001"
      server.use(
        http.patch(`https://api.meetingbaas.com/v2/calendars/${calendarId}/bots`, () => {
          return HttpResponse.json(createMockV2BatchResponse([{ event_id: eventId }], []), {
            status: 200
          })
        })
      )

      const result = await client.updateCalendarBot({
        calendar_id: calendarId,
        event_id: eventId,
        body: {
          series_id: "323e4567-e89b-12d3-a456-426614174002",
          all_occurrences: false,
          event_id: eventId,
          bot_name: "Updated Bot"
        }
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
        expect(result.data[0].event_id).toBe(eventId)
      }
    })
  })

  describe("deleteCalendarBot", () => {
    it("should delete calendar bot successfully", async () => {
      const calendarId = "123e4567-e89b-12d3-a456-426614174000"
      const eventId = "223e4567-e89b-12d3-a456-426614174001"
      server.use(
        http.delete(`https://api.meetingbaas.com/v2/calendars/${calendarId}/bots`, () => {
          return HttpResponse.json(createMockV2BatchResponse([{ event_id: eventId }], []), {
            status: 200
          })
        })
      )

      const result = await client.deleteCalendarBot({
        calendar_id: calendarId,
        event_id: eventId
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
        expect(result.data[0].event_id).toBe(eventId)
      }
    })
  })
})
