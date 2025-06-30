import type { AxiosRequestConfig } from "axios"
import z from "zod"
import type {
  BotParam2,
  BotParam3,
  BotsWithMetadataParams,
  Calendar,
  CreateCalendarParams,
  CreateCalendarResponse,
  DeleteResponse,
  Event,
  GetMeetingDataParams,
  JoinRequest,
  JoinResponse,
  LeaveResponse,
  ListEventResponse,
  ListEventsParams,
  ListRawCalendarsParams,
  ListRawCalendarsResponse,
  ListRecentBotsResponse,
  Metadata,
  PatchBotParams,
  ResyncAllResponse,
  RetranscribeBody,
  ScheduleRecordEventParams,
  ScreenshotsList,
  UnscheduleRecordEventParams,
  UpdateCalendarParams
} from "../generated/schema"
import { type ApiResponse, apiWrapper, apiWrapperNoParams } from "./api"
import type { BaasClientConfig } from "./types"

/**
 * Internal client state and utilities
 */
class ClientState {
  private apiKey: string
  private baseUrl: string
  private timeout: number

  constructor(config: BaasClientConfig) {
    this.apiKey = config?.api_key ?? "" // The fallback is an empty string, which will be checked in the apiWrapper
    this.baseUrl = config?.base_url ?? "https://api.meetingbaas.com"
    this.timeout = config?.timeout ?? 30000
  }

  getApiKey(): string {
    return this.apiKey
  }

  getBaseUrl(): string {
    return this.baseUrl
  }

  getOptions(): AxiosRequestConfig {
    return {
      baseURL: this.baseUrl,
      headers: {
        "x-meeting-baas-api-key": this.apiKey,
        "Content-Type": "application/json"
      },
      timeout: this.timeout
    }
  }
}

/**
 * Tree-shakeable client factory
 * Creates a client object with only the methods you import
 */
export function createBaasClient(config: BaasClientConfig) {
  const state = new ClientState(config)

  return {
    /**
     * Have a bot join a meeting, now or in the future
     * @param params - The parameters for the join meeting request. Learn more about the request body [here](https://docs.meetingbaas.com/api/reference/join)
     * @returns The response from the join meeting request
     */
    async joinMeeting(params: JoinRequest): Promise<ApiResponse<JoinResponse>> {
      const { join } = await import("../generated/api/default/default.js")
      const { joinBody } = await import("../generated/api/default/default.zod.js")

      return apiWrapper(join, joinBody, params, state.getOptions())
    },

    /**
     * Have a bot leave a meeting
     * @param params - The parameters for the leave meeting request. Learn more about the request body [here](https://docs.meetingbaas.com/api/reference/leave)
     * @returns The response from the leave meeting request
     */
    async leaveMeeting(params: { uuid: string }): Promise<ApiResponse<LeaveResponse>> {
      const { leave } = await import("../generated/api/default/default.js")
      const { leaveParams } = await import("../generated/api/default/default.zod.js")

      return apiWrapper(
        (params: { uuid: string }, options: AxiosRequestConfig) => leave(params.uuid, options),
        leaveParams,
        params,
        state.getOptions()
      )
    },

    /**
     * Get meeting recording and metadata
     * @param params - The parameters for the get meeting data request. Learn more about the request body [here](https://docs.meetingbaas.com/api/reference/get_meeting_data)
     * @returns The response from the get meeting data request
     */
    async getMeetingData(params: GetMeetingDataParams): Promise<ApiResponse<Metadata>> {
      const { getMeetingData: getMeetingDataApi } = await import(
        "../generated/api/default/default.js"
      )
      const { getMeetingDataQueryParams } = await import("../generated/api/default/default.zod.js")

      return apiWrapper(getMeetingDataApi, getMeetingDataQueryParams, params, state.getOptions())
    },

    /**
     * Delete bot data
     * @param params - The parameters for the delete bot data request. Learn more about the request body [here](https://docs.meetingbaas.com/api/reference/delete_data)
     * @returns The response from the delete bot data request
     */
    async deleteBotData(params: { uuid: string }): Promise<ApiResponse<DeleteResponse>> {
      const { deleteData } = await import("../generated/api/default/default.js")
      const { deleteDataParams } = await import("../generated/api/default/default.zod.js")

      return apiWrapper(
        (params: { uuid: string }, options: AxiosRequestConfig) => deleteData(params.uuid, options),
        deleteDataParams,
        params,
        state.getOptions()
      )
    },

    /**
     * Retrieves a paginated list of the user's bots with essential metadata, including IDs, names, and meeting details. Supports filtering, sorting, and advanced querying options.
     * @param params - The parameters for the list bots with metadata request. Learn more about the request body [here](https://docs.meetingbaas.com/api/reference/bots_with_metadata)
     * @returns The response from the list bots with metadata request
     */
    async listBots(params?: BotsWithMetadataParams): Promise<ApiResponse<ListRecentBotsResponse>> {
      const { botsWithMetadata } = await import("../generated/api/default/default.js")
      const { botsWithMetadataQueryParams } = await import(
        "../generated/api/default/default.zod.js"
      )

      return apiWrapper(
        botsWithMetadata,
        botsWithMetadataQueryParams,
        params ?? {},
        state.getOptions()
      )
    },

    /**
     * Transcribe or retranscribe a bot's audio using the Default or your provided Speech to Text Provider
     * @param params - The parameters for the retranscribe bot request. Learn more about the request body [here](https://docs.meetingbaas.com/api/reference/retranscribe_bot)
     * @returns The response from the retranscribe bot request
     */
    async retranscribeBot(params: RetranscribeBody): Promise<ApiResponse<void>> {
      const { retranscribeBot: retranscribeBotApi } = await import(
        "../generated/api/default/default.js"
      )
      const { retranscribeBotBody } = await import("../generated/api/default/default.zod.js")

      return apiWrapper(retranscribeBotApi, retranscribeBotBody, params, state.getOptions())
    },

    /**
     * Retrieves screenshots captured during the bot's session before it joins a meeting
     * @param params - The parameters for the get screenshots request. Learn more about the request body [here](https://docs.meetingbaas.com/api/reference/get_screenshots)
     * @returns The response from the get screenshots request
     */
    async getScreenshots(params: { uuid: string }): Promise<ApiResponse<ScreenshotsList>> {
      const { getScreenshots: getScreenshotsApi } = await import(
        "../generated/api/default/default.js"
      )
      const { getScreenshotsParams } = await import("../generated/api/default/default.zod.js")

      return apiWrapper(
        (params: { uuid: string }, options: AxiosRequestConfig) =>
          getScreenshotsApi(params.uuid, options),
        getScreenshotsParams,
        params,
        state.getOptions()
      )
    },

    /**
     * Integrates a new calendar with the system using OAuth credentials. This endpoint establishes a connection with the calendar provider (Google, Microsoft), sets up webhook notifications for real-time updates, and performs an initial sync of all calendar events. It requires OAuth credentials (client ID, client secret, and refresh token) and the platform type. Once created, the calendar is assigned a unique UUID that should be used for all subsequent operations. Returns the newly created calendar object with all integration details.
     * @param params - The parameters for the create calendar request. Learn more about the request body [here](https://docs.meetingbaas.com/api/reference/calendars/create_calendar)
     * @returns The response from the create calendar request
     */
    async createCalendar(
      params: CreateCalendarParams
    ): Promise<ApiResponse<CreateCalendarResponse>> {
      const { createCalendar: createCalendarApi } = await import(
        "../generated/api/calendars/calendars.js"
      )
      const { createCalendarBody } = await import("../generated/api/calendars/calendars.zod.js")

      return apiWrapper(createCalendarApi, createCalendarBody, params, state.getOptions())
    },

    /**
     * Retrieves all calendars that have been integrated with the system for the authenticated user. Returns a list of calendars with their names, email addresses, provider information, and sync status. This endpoint shows only calendars that have been formally connected through the create_calendar endpoint, not all available calendars from the provider.
     * @returns The response from the list calendars request. Learn more about the request body [here](https://docs.meetingbaas.com/api/reference/calendars/list_calendars)
     */
    async listCalendars(): Promise<ApiResponse<Calendar[]>> {
      const { listCalendars: listCalendarsApi } = await import(
        "../generated/api/calendars/calendars.js"
      )

      return apiWrapperNoParams(listCalendarsApi, state.getOptions())
    },

    /**
     * Retrieves detailed information about a specific calendar integration by its UUID. Returns comprehensive calendar data including the calendar name, email address, provider details (Google, Microsoft), sync status, and other metadata. This endpoint is useful for displaying calendar information to users or verifying the status of a calendar integration before performing operations on its events.
     * @param params - The parameters for the get calendar request. Learn more about the request body [here](https://docs.meetingbaas.com/api/reference/calendars/get_calendar)
     * @returns The response from the get calendar request
     */
    async getCalendar(params: { uuid: string }): Promise<ApiResponse<Calendar>> {
      const { getCalendar: getCalendarApi } = await import(
        "../generated/api/calendars/calendars.js"
      )
      const { getCalendarParams } = await import("../generated/api/calendars/calendars.zod.js")

      return apiWrapper(
        (params: { uuid: string }, options: AxiosRequestConfig) =>
          getCalendarApi(params.uuid, options),
        getCalendarParams,
        params,
        state.getOptions()
      )
    },

    /**
     * Updates a calendar integration with new credentials or platform while maintaining the same UUID. This operation is performed as an atomic transaction to ensure data integrity. The system automatically unschedules existing bots to prevent duplicates, updates the calendar credentials, and triggers a full resync of all events. Useful when OAuth tokens need to be refreshed or when migrating a calendar between providers. Returns the updated calendar object with its new configuration.
     * @param params - The parameters for the update calendar request. Learn more about the request body [here](https://docs.meetingbaas.com/api/reference/calendars/update_calendar)
     * @returns The response from the update calendar request
     */
    async updateCalendar(params: {
      uuid: string
      body: UpdateCalendarParams
    }): Promise<ApiResponse<CreateCalendarResponse>> {
      const { updateCalendar: updateCalendarApi } = await import(
        "../generated/api/calendars/calendars.js"
      )
      const { updateCalendarParams, updateCalendarBody } = await import(
        "../generated/api/calendars/calendars.zod.js"
      )

      return apiWrapper(
        (params: { uuid: string; body: UpdateCalendarParams }, options) =>
          updateCalendarApi(params.uuid, params.body, options),
        z.object({
          uuid: updateCalendarParams.shape.uuid,
          body: updateCalendarBody
        }),
        params,
        state.getOptions()
      )
    },

    /**
     * Permanently removes a calendar integration by its UUID, including all associated events and bot configurations. This operation cancels any active subscriptions with the calendar provider, stops all webhook notifications, and unschedules any pending recordings. All related resources are cleaned up in the database. This action cannot be undone, and subsequent requests to this calendar's UUID will return 404 Not Found errors.
     * @param params - The parameters for the delete calendar request. Learn more about the request body [here](https://docs.meetingbaas.com/api/reference/calendars/delete_calendar)
     * @returns The response from the delete calendar request
     */
    async deleteCalendar(params: { uuid: string }): Promise<ApiResponse<void>> {
      const { deleteCalendar: deleteCalendarApi } = await import(
        "../generated/api/calendars/calendars.js"
      )
      const { deleteCalendarParams } = await import("../generated/api/calendars/calendars.zod.js")

      return apiWrapper(
        (params: { uuid: string }, options: AxiosRequestConfig) =>
          deleteCalendarApi(params.uuid, options),
        deleteCalendarParams,
        params,
        state.getOptions()
      )
    },

    /**
     * Retrieves comprehensive details about a specific calendar event by its UUID. Returns complete event information including title, meeting link, start and end times, organizer status, recurrence information, and the full list of attendees with their names and email addresses. Also includes any associated bot parameters if recording is scheduled for this event. The raw calendar data from the provider is also included for advanced use cases.
     * @param params - The parameters for the get calendar event request. Learn more about the request body [here](https://docs.meetingbaas.com/api/reference/calendars/get_event)
     * @returns The response from the get calendar event request
     */
    async getCalendarEvent(params: { uuid: string }): Promise<ApiResponse<Event>> {
      const { getEvent } = await import("../generated/api/calendars/calendars.js")
      const { getEventParams } = await import("../generated/api/calendars/calendars.zod.js")

      return apiWrapper(
        (params: { uuid: string }, options: AxiosRequestConfig) => getEvent(params.uuid, options),
        getEventParams,
        params,
        state.getOptions()
      )
    },

    /**
     * Configures a bot to automatically join and record a specific calendar event at its scheduled time. The request body contains detailed bot configuration, including recording options, streaming settings, and webhook notification URLs. For recurring events, the 'all_occurrences' parameter can be set to true to schedule recording for all instances of the recurring series, or false (default) to schedule only the specific instance. Returns the updated event(s) with the bot parameters attached.
     * @param params - The parameters for the schedule calendar record event request. Learn more about the request body [here](https://docs.meetingbaas.com/api/reference/calendars/schedule_record_event)
     * @returns The response from the schedule calendar record event request
     */
    async scheduleCalendarRecordEvent(params: {
      uuid: string
      body: BotParam2
      query?: ScheduleRecordEventParams
    }): Promise<ApiResponse<Event[]>> {
      const { scheduleRecordEvent } = await import("../generated/api/calendars/calendars.js")
      const { scheduleRecordEventBody, scheduleRecordEventQueryParams, scheduleRecordEventParams } =
        await import("../generated/api/calendars/calendars.zod.js")

      return apiWrapper(
        (params: { uuid: string; body: BotParam2; query?: ScheduleRecordEventParams }, options) =>
          scheduleRecordEvent(params.uuid, params.body, params.query, options),
        z.object({
          uuid: scheduleRecordEventParams.shape.uuid,
          query: scheduleRecordEventQueryParams.optional(),
          body: scheduleRecordEventBody
        }),
        params,
        state.getOptions()
      )
    },

    /**
     * Cancels a previously scheduled recording for a calendar event and releases associated bot resources. For recurring events, the 'all_occurrences' parameter controls whether to unschedule from all instances of the recurring series or just the specific occurrence. This operation is idempotent and will not error if no bot was scheduled. Returns the updated event(s) with the bot parameters removed.
     * @param params - The parameters for the unschedule calendar record event request. Learn more about the request body [here](https://docs.meetingbaas.com/api/reference/calendars/unschedule_record_event)
     * @returns The response from the unschedule calendar record event request
     */
    async unscheduleCalendarRecordEvent(params: {
      uuid: string
      query?: UnscheduleRecordEventParams
    }): Promise<ApiResponse<Event[]>> {
      const { unscheduleRecordEvent } = await import("../generated/api/calendars/calendars.js")
      const { unscheduleRecordEventQueryParams, unscheduleRecordEventParams } = await import(
        "../generated/api/calendars/calendars.zod.js"
      )

      return apiWrapper(
        (params: { uuid: string; query?: UnscheduleRecordEventParams }, options) =>
          unscheduleRecordEvent(params.uuid, params.query, options),
        z.object({
          uuid: unscheduleRecordEventParams.shape.uuid,
          query: unscheduleRecordEventQueryParams.optional()
        }),
        params,
        state.getOptions()
      )
    },

    /**
     * Updates the configuration of a bot already scheduled to record an event. Allows modification of recording settings, webhook URLs, and other bot parameters without canceling and recreating the scheduled recording. For recurring events, the 'all_occurrences' parameter determines whether changes apply to all instances or just the specific occurrence. Returns the updated event(s) with the modified bot parameters.
     * @param params - The parameters for the patch bot request. Learn more about the request body [here](https://docs.meetingbaas.com/api/reference/calendars/patch_bot)
     * @returns The response from the patch bot request
     */
    async patchBot(params: {
      uuid: string
      body: BotParam3
      query?: PatchBotParams
    }): Promise<ApiResponse<Event[]>> {
      const { patchBot: patchBotApi } = await import("../generated/api/calendars/calendars.js")
      const { patchBotBody, patchBotQueryParams, patchBotParams } = await import(
        "../generated/api/calendars/calendars.zod.js"
      )

      return apiWrapper(
        (params: { uuid: string; body: BotParam3; query?: PatchBotParams }, options) =>
          patchBotApi(params.uuid, params.body, params.query, options),
        z.object({
          uuid: patchBotParams.shape.uuid,
          query: patchBotQueryParams.optional(),
          body: patchBotBody
        }),
        params,
        state.getOptions()
      )
    },

    /**
     * Retrieves a paginated list of calendar events with comprehensive filtering options. Supports filtering by organizer email, attendee email, date ranges (start_date_gte, start_date_lte), and event status. Results can be limited to upcoming events (default), past events, or all events. Each event includes full details such as meeting links, participants, and recording status. The response includes a 'next' pagination cursor for retrieving additional results.
     * @param params - The parameters for the list calendar events request. Learn more about the request body [here](https://docs.meetingbaas.com/api/reference/calendars/list_events)
     * @returns The response from the list calendar events request
     */
    async listCalendarEvents(query: ListEventsParams): Promise<ApiResponse<ListEventResponse>> {
      const { listEvents } = await import("../generated/api/calendars/calendars.js")
      const { listEventsQueryParams } = await import("../generated/api/calendars/calendars.zod.js")

      return apiWrapper(listEvents, listEventsQueryParams, query, state.getOptions())
    },

    /**
     * Retrieves the full documentation for the webhook events that Meeting BaaS sends to your webhook URL. This includes all event types, their payload structures, and any additional metadata. Useful for developers to understand and integrate webhook functionality into their applications.
     * @returns The response from the get webhook documentation request
     */
    async getWebhookDocumentation(): Promise<ApiResponse<unknown>> {
      const { webhookDocumentation } = await import("../generated/api/webhooks/webhooks.js")

      return apiWrapperNoParams(webhookDocumentation, state.getOptions())
    },

    /**
     * Retrieves the full documentation for the webhook events that Meeting BaaS sends to your webhook URL for a specific bot. This includes all event types, their payload structures, and any additional metadata. Useful for developers to understand and integrate webhook functionality into their applications.
     * @returns The response from the get bot webhook documentation request
     */
    async getBotWebhookDocumentation(): Promise<ApiResponse<unknown>> {
      const { botWebhookDocumentation } = await import("../generated/api/webhooks/webhooks.js")

      return apiWrapperNoParams(botWebhookDocumentation, state.getOptions())
    },

    /**
     * Retrieves the full documentation for the webhook events that Meeting BaaS sends to your webhook URL for a specific calendar. This includes all event types, their payload structures, and any additional metadata. Useful for developers to understand and integrate webhook functionality into their applications.
     * @returns The response from the get calendar webhook documentation request
     */
    async getCalendarWebhookDocumentation(): Promise<ApiResponse<unknown>> {
      const { calendarWebhookDocumentation } = await import("../generated/api/webhooks/webhooks.js")

      return apiWrapperNoParams(calendarWebhookDocumentation, state.getOptions())
    },

    /**
     * Triggers a full resync of all calendar events for all integrated calendars. This operation is useful when you need to ensure that all calendar data is up-to-date in the system. It will re-fetch all events from the calendar providers and update the system's internal state. Returns a response indicating the status of the resync operation.
     * @returns The response from the resync all calendars request
     */
    async resyncAllCalendars(): Promise<ApiResponse<ResyncAllResponse>> {
      const { resyncAll } = await import("../generated/api/calendars/calendars.js")

      return apiWrapperNoParams(resyncAll, state.getOptions())
    },

    /**
     * Retrieves unprocessed calendar data directly from the provider (Google, Microsoft) using provided OAuth credentials. This endpoint is typically used during the initial setup process to allow users to select which calendars to integrate. Returns a list of available calendars with their unique IDs, email addresses, and primary status. This data is not persisted until a calendar is formally created using the create_calendar endpoint.
     * @param params - The parameters for the list raw calendars request. Learn more about the request body [here](https://docs.meetingbaas.com/api/reference/calendars/list_raw_calendars)
     * @returns The response from the list raw calendars request
     */
    async listRawCalendars(
      params: ListRawCalendarsParams
    ): Promise<ApiResponse<ListRawCalendarsResponse>> {
      const { listRawCalendars: listRawCalendarsApi } = await import(
        "../generated/api/calendars/calendars.js"
      )
      const { listRawCalendarsBody } = await import("../generated/api/calendars/calendars.zod.js")

      return apiWrapper(listRawCalendarsApi, listRawCalendarsBody, params, state.getOptions())
    },

    getApiKey(): string {
      return state.getApiKey()
    },

    getBaseUrl(): string {
      return state.getBaseUrl()
    }
  }
}
