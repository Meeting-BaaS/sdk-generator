import type { AxiosRequestConfig } from "axios"
import z from "zod"
import type {
  BatchCreateBotResponseDataItem,
  BatchCreateBotResponseErrorsItem,
  BatchCreateBotsRequestBodyInput,
  BatchCreateScheduledBotResponseDataItem,
  BatchCreateScheduledBotResponseErrorsItem,
  BatchCreateScheduledBotsRequestBodyInput,
  CreateBotRequestBodyInput,
  CreateBotResponseData,
  CreateCalendarBotRequestBodyInput,
  CreateCalendarBotResponseDataItem,
  CreateCalendarBotResponseErrorsItem,
  CreateCalendarConnectionRequestBodyInput,
  CreateCalendarConnectionResponseData,
  CreateScheduledBotRequestBodyInput,
  CreateScheduledBotResponseData,
  DeleteBotDataResponseData,
  DeleteCalendarBotBody,
  DeleteCalendarBotResponseDataItem,
  DeleteCalendarBotResponseErrorsItem,
  DeleteCalendarConnectionResponseData,
  DeleteScheduledBotResponseData,
  GetBotDetailsResponseData,
  GetBotScreenshotsResponseDataItem,
  GetBotStatusResponseData,
  GetCalendarDetailsResponseData,
  GetEventDetailsResponseData,
  GetScheduledBotResponseData,
  LeaveBotResponseData,
  ListBotsParams,
  ListBotsResponseDataItem,
  ListCalendarsParams,
  ListCalendarsResponseDataItem,
  ListEventSeriesParams,
  ListEventSeriesResponseDataItem,
  ListEventsParams as ListEventsParamsV2,
  ListEventsResponseDataItem,
  ListRawCalendarsRequestBodyInput,
  ListRawCalendarsResponseDataItem,
  ListScheduledBotsParams,
  ListScheduledBotsResponseDataItem,
  ResendFinalWebhookResponseData,
  ResubscribeCalendarResponseData,
  RetryCallbackRequestBodyInput,
  RetryCallbackResponseData,
  SyncCalendarResponseData,
  UpdateCalendarBotRequestBodyInput,
  UpdateCalendarBotResponseDataItem,
  UpdateCalendarBotResponseErrorsItem,
  UpdateCalendarConnectionRequestBodyInput,
  UpdateCalendarConnectionResponseData,
  UpdateScheduledBotRequestBodyInput,
  UpdateScheduledBotResponseData
} from "../generated/v2/schema"
import {
  type ApiResponseV2,
  apiWrapperV2,
  apiWrapperV2List,
  type BatchApiResponseV2,
  type ListApiResponseV2
} from "./api"
import type { ClientState } from "./client-state"
import type { BaasClientV2Methods } from "./types"

/**
 * Create v2 client methods
 * Methods use pass-through responses (ApiResponseV2<T>)
 */
export function createV2Methods(state: ClientState): BaasClientV2Methods {
  return {
    // Bot methods
    async createBot(
      params: CreateBotRequestBodyInput
    ): Promise<ApiResponseV2<CreateBotResponseData>> {
      const { createBot: createBotApi } = await import("../generated/v2/api/bots/bots.js")
      const { createBotBody } = await import("../generated/v2/api/bots/bots.zod.js")

      return apiWrapperV2<CreateBotResponseData, CreateBotRequestBodyInput>(
        createBotApi,
        createBotBody,
        params,
        state.getOptions()
      )
    },

    async batchCreateBots(
      params: BatchCreateBotsRequestBodyInput
    ): Promise<
      BatchApiResponseV2<BatchCreateBotResponseDataItem, BatchCreateBotResponseErrorsItem>
    > {
      const { batchCreateBots: batchCreateBotsApi } = await import(
        "../generated/v2/api/bots/bots.js"
      )
      const { batchCreateBotsBody } = await import("../generated/v2/api/bots/bots.zod.js")

      // Note: batchCreateBots returns BatchApiResponseV2, but apiWrapperV2 returns ApiResponseV2
      // We need to handle this specially or update apiWrapperV2 to support batch responses
      return apiWrapperV2<BatchCreateBotResponseDataItem[], BatchCreateBotsRequestBodyInput>(
        batchCreateBotsApi,
        batchCreateBotsBody,
        params,
        state.getOptions()
      ) as Promise<
        BatchApiResponseV2<BatchCreateBotResponseDataItem, BatchCreateBotResponseErrorsItem>
      >
    },

    async listBots(params?: ListBotsParams): Promise<ListApiResponseV2<ListBotsResponseDataItem>> {
      const { listBots: listBotsApi } = await import("../generated/v2/api/bots/bots.js")
      const { listBotsQueryParams } = await import("../generated/v2/api/bots/bots.zod.js")

      // Provide default limit if params is undefined or limit is not provided
      const paramsWithDefaults: ListBotsParams = params ? { limit: 50, ...params } : { limit: 50 }

      return apiWrapperV2List<ListBotsResponseDataItem, ListBotsParams>(
        listBotsApi,
        listBotsQueryParams,
        paramsWithDefaults,
        state.getOptions()
      )
    },

    async getBotDetails(params: {
      bot_id: string
    }): Promise<ApiResponseV2<GetBotDetailsResponseData>> {
      const { getBotDetails: getBotDetailsApi } = await import("../generated/v2/api/bots/bots.js")
      const { getBotDetailsParams } = await import("../generated/v2/api/bots/bots.zod.js")

      return apiWrapperV2<GetBotDetailsResponseData, { bot_id: string }>(
        (params: { bot_id: string }, options: AxiosRequestConfig) =>
          getBotDetailsApi(params.bot_id, options),
        getBotDetailsParams,
        params,
        state.getOptions()
      )
    },

    async getBotStatus(params: {
      bot_id: string
    }): Promise<ApiResponseV2<GetBotStatusResponseData>> {
      const { getBotStatus: getBotStatusApi } = await import("../generated/v2/api/bots/bots.js")
      const { getBotStatusParams } = await import("../generated/v2/api/bots/bots.zod.js")

      return apiWrapperV2<GetBotStatusResponseData, { bot_id: string }>(
        (params: { bot_id: string }, options: AxiosRequestConfig) =>
          getBotStatusApi(params.bot_id, options),
        getBotStatusParams,
        params,
        state.getOptions()
      )
    },

    async getBotScreenshots(params: {
      bot_id: string
      limit?: number
      cursor?: string | null
    }): Promise<ListApiResponseV2<GetBotScreenshotsResponseDataItem>> {
      const { getBotScreenshots: getBotScreenshotsApi } = await import(
        "../generated/v2/api/bots/bots.js"
      )
      const { getBotScreenshotsParams } = await import("../generated/v2/api/bots/bots.zod.js")

      return apiWrapperV2List<
        GetBotScreenshotsResponseDataItem,
        { bot_id: string; limit?: number; cursor?: string | null }
      >(
        (params: { bot_id: string; limit?: number; cursor?: string | null }, options) =>
          getBotScreenshotsApi(
            params.bot_id,
            { limit: params.limit, cursor: params.cursor },
            options
          ),
        z.object({
          bot_id: getBotScreenshotsParams.shape.bot_id,
          limit: z.number().optional(),
          cursor: z.string().nullable().optional()
        }),
        params,
        state.getOptions()
      )
    },

    async leaveBot(params: { bot_id: string }): Promise<ApiResponseV2<LeaveBotResponseData>> {
      const { leaveBot: leaveBotApi } = await import("../generated/v2/api/bots/bots.js")
      const { leaveBotParams } = await import("../generated/v2/api/bots/bots.zod.js")

      return apiWrapperV2<LeaveBotResponseData, { bot_id: string }>(
        (params: { bot_id: string }, options: AxiosRequestConfig) =>
          leaveBotApi(params.bot_id, options),
        leaveBotParams,
        params,
        state.getOptions()
      )
    },

    async deleteBotData(params: {
      bot_id: string
      delete_from_provider?: boolean
    }): Promise<ApiResponseV2<DeleteBotDataResponseData>> {
      const { deleteBotData: deleteBotDataApi } = await import("../generated/v2/api/bots/bots.js")
      const { deleteBotDataParams, deleteBotDataQueryParams } = await import(
        "../generated/v2/api/bots/bots.zod.js"
      )

      return apiWrapperV2<
        DeleteBotDataResponseData,
        { bot_id: string; delete_from_provider?: boolean }
      >(
        (params: { bot_id: string; delete_from_provider?: boolean }, options) =>
          deleteBotDataApi(
            params.bot_id,
            { delete_from_provider: params.delete_from_provider },
            options
          ),
        z.object({
          bot_id: deleteBotDataParams.shape.bot_id,
          delete_from_provider: deleteBotDataQueryParams.shape.delete_from_provider.optional()
        }),
        params,
        state.getOptions()
      )
    },

    async resendFinalWebhook(params: {
      bot_id: string
    }): Promise<ApiResponseV2<ResendFinalWebhookResponseData>> {
      const { resendFinalWebhook: resendFinalWebhookApi } = await import(
        "../generated/v2/api/bots/bots.js"
      )
      const { resendFinalWebhookParams } = await import("../generated/v2/api/bots/bots.zod.js")

      return apiWrapperV2<ResendFinalWebhookResponseData, { bot_id: string }>(
        (params: { bot_id: string }, options: AxiosRequestConfig) =>
          resendFinalWebhookApi(params.bot_id, options),
        resendFinalWebhookParams,
        params,
        state.getOptions()
      )
    },

    async retryCallback(params: {
      bot_id: string
      callbackConfig?: RetryCallbackRequestBodyInput
    }): Promise<ApiResponseV2<RetryCallbackResponseData>> {
      const { retryCallback: retryCallbackApi } = await import("../generated/v2/api/bots/bots.js")
      const { retryCallbackParams, retryCallbackBody } = await import(
        "../generated/v2/api/bots/bots.zod.js"
      )

      return apiWrapperV2<
        RetryCallbackResponseData,
        { bot_id: string; callbackConfig?: RetryCallbackRequestBodyInput }
      >(
        (params: { bot_id: string; callbackConfig?: RetryCallbackRequestBodyInput }, options) =>
          retryCallbackApi(params.bot_id, params.callbackConfig ?? null, options),
        z.object({
          bot_id: retryCallbackParams.shape.bot_id,
          callbackConfig: retryCallbackBody.optional()
        }),
        params,
        state.getOptions()
      )
    },

    // Scheduled bot methods
    async createScheduledBot(
      params: CreateScheduledBotRequestBodyInput
    ): Promise<ApiResponseV2<CreateScheduledBotResponseData>> {
      const { createScheduledBot: createScheduledBotApi } = await import(
        "../generated/v2/api/bots/bots.js"
      )
      const { createScheduledBotBody } = await import("../generated/v2/api/bots/bots.zod.js")

      return apiWrapperV2<CreateScheduledBotResponseData, CreateScheduledBotRequestBodyInput>(
        createScheduledBotApi,
        createScheduledBotBody,
        params,
        state.getOptions()
      )
    },

    async batchCreateScheduledBots(
      params: BatchCreateScheduledBotsRequestBodyInput
    ): Promise<
      BatchApiResponseV2<
        BatchCreateScheduledBotResponseDataItem,
        BatchCreateScheduledBotResponseErrorsItem
      >
    > {
      const { batchCreateScheduledBots: batchCreateScheduledBotsApi } = await import(
        "../generated/v2/api/bots/bots.js"
      )
      const { batchCreateScheduledBotsBody } = await import("../generated/v2/api/bots/bots.zod.js")

      return apiWrapperV2<
        BatchCreateScheduledBotResponseDataItem[],
        BatchCreateScheduledBotsRequestBodyInput
      >(
        batchCreateScheduledBotsApi,
        batchCreateScheduledBotsBody,
        params,
        state.getOptions()
      ) as Promise<
        BatchApiResponseV2<
          BatchCreateScheduledBotResponseDataItem,
          BatchCreateScheduledBotResponseErrorsItem
        >
      >
    },

    async listScheduledBots(
      params?: ListScheduledBotsParams
    ): Promise<ListApiResponseV2<ListScheduledBotsResponseDataItem>> {
      const { listScheduledBots: listScheduledBotsApi } = await import(
        "../generated/v2/api/bots/bots.js"
      )
      const { listScheduledBotsQueryParams } = await import("../generated/v2/api/bots/bots.zod.js")

      return apiWrapperV2List<ListScheduledBotsResponseDataItem, ListScheduledBotsParams>(
        listScheduledBotsApi,
        listScheduledBotsQueryParams,
        params ?? { limit: 50 },
        state.getOptions()
      )
    },

    async getScheduledBot(params: {
      bot_id: string
    }): Promise<ApiResponseV2<GetScheduledBotResponseData>> {
      const { getScheduledBotDetails: getScheduledBotApi } = await import(
        "../generated/v2/api/bots/bots.js"
      )
      const { getScheduledBotDetailsParams } = await import("../generated/v2/api/bots/bots.zod.js")

      return apiWrapperV2<GetScheduledBotResponseData, { bot_id: string }>(
        (params: { bot_id: string }, options: AxiosRequestConfig) =>
          getScheduledBotApi(params.bot_id, options),
        getScheduledBotDetailsParams,
        params,
        state.getOptions()
      )
    },

    async updateScheduledBot(params: {
      bot_id: string
      body: UpdateScheduledBotRequestBodyInput
    }): Promise<ApiResponseV2<UpdateScheduledBotResponseData>> {
      const { updateScheduledBot: updateScheduledBotApi } = await import(
        "../generated/v2/api/bots/bots.js"
      )
      const { updateScheduledBotParams, updateScheduledBotBody } = await import(
        "../generated/v2/api/bots/bots.zod.js"
      )

      return apiWrapperV2<
        UpdateScheduledBotResponseData,
        { bot_id: string; body: UpdateScheduledBotRequestBodyInput }
      >(
        (params: { bot_id: string; body: UpdateScheduledBotRequestBodyInput }, options) =>
          updateScheduledBotApi(params.bot_id, params.body, options),
        z.object({
          bot_id: updateScheduledBotParams.shape.bot_id,
          body: updateScheduledBotBody
        }),
        params,
        state.getOptions()
      )
    },

    async deleteScheduledBot(params: {
      bot_id: string
    }): Promise<ApiResponseV2<DeleteScheduledBotResponseData>> {
      const { deleteScheduledBot: deleteScheduledBotApi } = await import(
        "../generated/v2/api/bots/bots.js"
      )
      const { deleteScheduledBotParams } = await import("../generated/v2/api/bots/bots.zod.js")

      return apiWrapperV2<DeleteScheduledBotResponseData, { bot_id: string }>(
        (params: { bot_id: string }, options: AxiosRequestConfig) =>
          deleteScheduledBotApi(params.bot_id, options),
        deleteScheduledBotParams,
        params,
        state.getOptions()
      )
    },

    // Calendar methods
    async listRawCalendars(
      params: ListRawCalendarsRequestBodyInput
    ): Promise<ApiResponseV2<ListRawCalendarsResponseDataItem[]>> {
      const { listRawCalendars: listRawCalendarsApi } = await import(
        "../generated/v2/api/calendars/calendars.js"
      )
      const { listRawCalendarsBody } = await import(
        "../generated/v2/api/calendars/calendars.zod.js"
      )

      return apiWrapperV2<ListRawCalendarsResponseDataItem[], ListRawCalendarsRequestBodyInput>(
        listRawCalendarsApi,
        listRawCalendarsBody,
        params,
        state.getOptions()
      )
    },

    async createCalendarConnection(
      params: CreateCalendarConnectionRequestBodyInput
    ): Promise<ApiResponseV2<CreateCalendarConnectionResponseData>> {
      const { createCalendarConnection: createCalendarConnectionApi } = await import(
        "../generated/v2/api/calendars/calendars.js"
      )
      const { createCalendarConnectionBody } = await import(
        "../generated/v2/api/calendars/calendars.zod.js"
      )

      return apiWrapperV2<
        CreateCalendarConnectionResponseData,
        CreateCalendarConnectionRequestBodyInput
      >(createCalendarConnectionApi, createCalendarConnectionBody, params, state.getOptions())
    },

    async listCalendars(
      params?: ListCalendarsParams
    ): Promise<ListApiResponseV2<ListCalendarsResponseDataItem>> {
      const { listCalendars: listCalendarsApi } = await import(
        "../generated/v2/api/calendars/calendars.js"
      )
      const { listCalendarsQueryParams } = await import(
        "../generated/v2/api/calendars/calendars.zod.js"
      )

      // Provide default limit if params is undefined or limit is not provided
      const paramsWithDefaults: ListCalendarsParams = params
        ? { limit: 50, ...params }
        : { limit: 50 }

      return apiWrapperV2List<ListCalendarsResponseDataItem, ListCalendarsParams>(
        listCalendarsApi,
        listCalendarsQueryParams,
        paramsWithDefaults,
        state.getOptions()
      )
    },

    async getCalendarDetails(params: {
      calendar_id: string
    }): Promise<ApiResponseV2<GetCalendarDetailsResponseData>> {
      const { getCalendarDetails: getCalendarDetailsApi } = await import(
        "../generated/v2/api/calendars/calendars.js"
      )
      const { getCalendarDetailsParams } = await import(
        "../generated/v2/api/calendars/calendars.zod.js"
      )

      return apiWrapperV2<GetCalendarDetailsResponseData, { calendar_id: string }>(
        (params: { calendar_id: string }, options: AxiosRequestConfig) =>
          getCalendarDetailsApi(params.calendar_id, options),
        getCalendarDetailsParams,
        params,
        state.getOptions()
      )
    },

    async updateCalendarConnection(params: {
      calendar_id: string
      body: UpdateCalendarConnectionRequestBodyInput
    }): Promise<ApiResponseV2<UpdateCalendarConnectionResponseData>> {
      const { updateCalendarConnection: updateCalendarConnectionApi } = await import(
        "../generated/v2/api/calendars/calendars.js"
      )
      const { updateCalendarConnectionParams, updateCalendarConnectionBody } = await import(
        "../generated/v2/api/calendars/calendars.zod.js"
      )

      return apiWrapperV2<
        UpdateCalendarConnectionResponseData,
        { calendar_id: string; body: UpdateCalendarConnectionRequestBodyInput }
      >(
        (
          params: { calendar_id: string; body: UpdateCalendarConnectionRequestBodyInput },
          options
        ) => updateCalendarConnectionApi(params.calendar_id, params.body, options),
        z.object({
          calendar_id: updateCalendarConnectionParams.shape.calendar_id,
          body: updateCalendarConnectionBody
        }),
        params,
        state.getOptions()
      )
    },

    async deleteCalendarConnection(params: {
      calendar_id: string
    }): Promise<ApiResponseV2<DeleteCalendarConnectionResponseData>> {
      const { deleteCalendarConnection: deleteCalendarConnectionApi } = await import(
        "../generated/v2/api/calendars/calendars.js"
      )
      const { deleteCalendarConnectionParams } = await import(
        "../generated/v2/api/calendars/calendars.zod.js"
      )

      return apiWrapperV2<DeleteCalendarConnectionResponseData, { calendar_id: string }>(
        (params: { calendar_id: string }, options: AxiosRequestConfig) =>
          deleteCalendarConnectionApi(params.calendar_id, options),
        deleteCalendarConnectionParams,
        params,
        state.getOptions()
      )
    },

    async syncCalendar(params: {
      calendar_id: string
    }): Promise<ApiResponseV2<SyncCalendarResponseData>> {
      const { syncCalendar: syncCalendarApi } = await import(
        "../generated/v2/api/calendars/calendars.js"
      )
      const { syncCalendarParams } = await import("../generated/v2/api/calendars/calendars.zod.js")

      return apiWrapperV2<SyncCalendarResponseData, { calendar_id: string }>(
        (params: { calendar_id: string }, options: AxiosRequestConfig) =>
          syncCalendarApi(params.calendar_id, options),
        syncCalendarParams,
        params,
        state.getOptions()
      )
    },

    async resubscribeCalendar(params: {
      calendar_id: string
    }): Promise<ApiResponseV2<ResubscribeCalendarResponseData>> {
      const { resubscribeCalendar: resubscribeCalendarApi } = await import(
        "../generated/v2/api/calendars/calendars.js"
      )
      const { resubscribeCalendarParams } = await import(
        "../generated/v2/api/calendars/calendars.zod.js"
      )

      return apiWrapperV2<ResubscribeCalendarResponseData, { calendar_id: string }>(
        (params: { calendar_id: string }, options: AxiosRequestConfig) =>
          resubscribeCalendarApi(params.calendar_id, options),
        resubscribeCalendarParams,
        params,
        state.getOptions()
      )
    },

    async listEvents(params: {
      calendar_id: string
      query?: ListEventsParamsV2
    }): Promise<ListApiResponseV2<ListEventsResponseDataItem>> {
      const { listEvents: listEventsApi } = await import(
        "../generated/v2/api/calendars/calendars.js"
      )
      const { listEventsParams: listEventsParamsSchema, listEventsQueryParams } = await import(
        "../generated/v2/api/calendars/calendars.zod.js"
      )

      return apiWrapperV2List<
        ListEventsResponseDataItem,
        { calendar_id: string; query?: ListEventsParamsV2 }
      >(
        (params: { calendar_id: string; query?: ListEventsParamsV2 }, options) =>
          listEventsApi(
            params.calendar_id,
            params.query ?? { limit: 50, show_cancelled: true },
            options
          ),
        z.object({
          calendar_id: listEventsParamsSchema.shape.calendar_id,
          query: listEventsQueryParams.optional()
        }),
        params,
        state.getOptions()
      )
    },

    async listEventSeries(params: {
      calendar_id: string
      query?: ListEventSeriesParams
    }): Promise<ListApiResponseV2<ListEventSeriesResponseDataItem>> {
      const { listEventSeries: listEventSeriesApi } = await import(
        "../generated/v2/api/calendars/calendars.js"
      )
      const { listEventSeriesParams: listEventSeriesParamsSchema, listEventSeriesQueryParams } =
        await import("../generated/v2/api/calendars/calendars.zod.js")

      return apiWrapperV2List<
        ListEventSeriesResponseDataItem,
        { calendar_id: string; query?: ListEventSeriesParams }
      >(
        (params: { calendar_id: string; query?: ListEventSeriesParams }, options) =>
          listEventSeriesApi(
            params.calendar_id,
            params.query ?? { limit: 50, show_cancelled: true },
            options
          ),
        z.object({
          calendar_id: listEventSeriesParamsSchema.shape.calendar_id,
          query: listEventSeriesQueryParams.optional()
        }),
        params,
        state.getOptions()
      )
    },

    async getEventDetails(params: {
      calendar_id: string
      event_id: string
    }): Promise<ApiResponseV2<GetEventDetailsResponseData>> {
      const { getEventDetails: getEventDetailsApi } = await import(
        "../generated/v2/api/calendars/calendars.js"
      )
      const { getEventDetailsParams } = await import(
        "../generated/v2/api/calendars/calendars.zod.js"
      )

      return apiWrapperV2<GetEventDetailsResponseData, { calendar_id: string; event_id: string }>(
        (params: { calendar_id: string; event_id: string }, options) =>
          getEventDetailsApi(params.calendar_id, params.event_id, options),
        getEventDetailsParams,
        params,
        state.getOptions()
      )
    },

    async createCalendarBot(params: {
      calendar_id: string
      body: CreateCalendarBotRequestBodyInput
    }): Promise<
      BatchApiResponseV2<CreateCalendarBotResponseDataItem, CreateCalendarBotResponseErrorsItem>
    > {
      const { createCalendarBot: createCalendarBotApi } = await import(
        "../generated/v2/api/calendars/calendars.js"
      )
      const { createCalendarBotParams, createCalendarBotBody } = await import(
        "../generated/v2/api/calendars/calendars.zod.js"
      )

      return apiWrapperV2<
        CreateCalendarBotResponseDataItem[],
        { calendar_id: string; body: CreateCalendarBotRequestBodyInput }
      >(
        (params: { calendar_id: string; body: CreateCalendarBotRequestBodyInput }, options) =>
          createCalendarBotApi(params.calendar_id, params.body, options),
        z.object({
          calendar_id: createCalendarBotParams.shape.calendar_id,
          body: createCalendarBotBody
        }),
        params,
        state.getOptions()
      ) as Promise<
        BatchApiResponseV2<CreateCalendarBotResponseDataItem, CreateCalendarBotResponseErrorsItem>
      >
    },

    async updateCalendarBot(params: {
      calendar_id: string
      event_id: string
      body: UpdateCalendarBotRequestBodyInput
    }): Promise<
      BatchApiResponseV2<UpdateCalendarBotResponseDataItem, UpdateCalendarBotResponseErrorsItem>
    > {
      const { updateCalendarBot: updateCalendarBotApi } = await import(
        "../generated/v2/api/calendars/calendars.js"
      )
      const { updateCalendarBotParams, updateCalendarBotBody } = await import(
        "../generated/v2/api/calendars/calendars.zod.js"
      )

      // event_id is in the body, not the path
      const bodyWithEventId = {
        ...params.body,
        event_id: params.event_id
      } as UpdateCalendarBotRequestBodyInput

      return apiWrapperV2<
        UpdateCalendarBotResponseDataItem[],
        { calendar_id: string; body: UpdateCalendarBotRequestBodyInput }
      >(
        (params: { calendar_id: string; body: UpdateCalendarBotRequestBodyInput }, options) =>
          updateCalendarBotApi(params.calendar_id, params.body, options),
        z.object({
          calendar_id: updateCalendarBotParams.shape.calendar_id,
          body: updateCalendarBotBody
        }),
        { calendar_id: params.calendar_id, body: bodyWithEventId },
        state.getOptions()
      ) as Promise<
        BatchApiResponseV2<UpdateCalendarBotResponseDataItem, UpdateCalendarBotResponseErrorsItem>
      >
    },

    async deleteCalendarBot(params: {
      calendar_id: string
      event_id: string
    }): Promise<
      BatchApiResponseV2<DeleteCalendarBotResponseDataItem, DeleteCalendarBotResponseErrorsItem>
    > {
      const { deleteCalendarBot: deleteCalendarBotApi } = await import(
        "../generated/v2/api/calendars/calendars.js"
      )
      const { deleteCalendarBotParams, deleteCalendarBotBody } = await import(
        "../generated/v2/api/calendars/calendars.zod.js"
      )

      // event_id is in the body, not the path. The body requires series_id, so we'll use a placeholder
      // and include event_id. This is a workaround for the interface mismatch.
      // The interface says event_id is a path param, but the API expects it in the body.
      // We construct a valid body with event_id and required fields.
      const body: DeleteCalendarBotBody = {
        event_id: params.event_id,
        all_occurrences: false,
        series_id: "00000000-0000-0000-0000-000000000000" // Placeholder UUID since series_id is required
      }

      return apiWrapperV2<
        DeleteCalendarBotResponseDataItem[],
        { calendar_id: string; body: DeleteCalendarBotBody }
      >(
        (params: { calendar_id: string; body: DeleteCalendarBotBody }, options) =>
          deleteCalendarBotApi(params.calendar_id, params.body, options),
        z.object({
          calendar_id: deleteCalendarBotParams.shape.calendar_id,
          body: deleteCalendarBotBody
        }),
        { calendar_id: params.calendar_id, body },
        state.getOptions()
      ) as Promise<
        BatchApiResponseV2<DeleteCalendarBotResponseDataItem, DeleteCalendarBotResponseErrorsItem>
      >
    },

    getApiKey(): string {
      return state.getApiKey()
    },

    getBaseUrl(): string {
      return state.getBaseUrl()
    }
  }
}
