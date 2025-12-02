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
  ResyncAllCalendarsParams,
  ResyncAllCalendarsResponse,
  RetranscribeBody,
  ScheduleRecordEventParams,
  ScreenshotsList,
  UnscheduleRecordEventParams,
  UpdateCalendarParams
} from "../generated/v1/schema"
import type {
  BatchCreateBotsRequestBodyInput,
  BatchCreateBotResponseDataItem,
  BatchCreateBotResponseErrorsItem,
  BatchCreateScheduledBotsRequestBodyInput,
  BatchCreateScheduledBotResponseDataItem,
  BatchCreateScheduledBotResponseErrorsItem,
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
  DeleteCalendarBotResponseDataItem,
  DeleteCalendarBotResponseErrorsItem,
  DeleteCalendarConnectionResponseData,
  DeleteScheduledBotResponseData,
  GetBotDetailsResponseData,
  GetBotScreenshotsResponse,
  GetBotStatusResponseData,
  GetCalendarDetailsResponseData,
  GetEventDetailsResponseData,
  GetScheduledBotResponseData,
  LeaveBotResponseData,
  ListBotsParams,
  ListBotsResponse,
  ListCalendarsParams,
  ListCalendarsResponse,
  ListEventsParams as ListEventsParamsV2,
  ListEventsResponse,
  ListEventSeriesParams,
  ListEventSeriesResponse,
  ListRawCalendarsRequestBodyInput,
  ListRawCalendarsResponseDataItem,
  ListScheduledBotsParams,
  ListScheduledBotsResponse,
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
import type { ApiResponse, ApiResponseV2, BatchApiResponseV2, ListApiResponseV2 } from "./api"

/**
 * Configuration for the BaasClient
 */
export interface BaasClientConfig {
  /**
   * Meeting BaaS API key. Get your API key from https://meetingbaas.com/
   */
  api_key: string
  /**
   * API version to use
   * - "v1": Meeting BaaS v1 API (default, for backward compatibility)
   * - "v2": Meeting BaaS v2 API
   * @default "v1"
   */
  api_version?: "v1" | "v2"
  /**
   * Base URL for the API
   * This is an internal parameter and should not be accessed directly
   * @default "https://api.meetingbaas.com"
   */
  base_url?: string
  /**
   * Timeout for the API requests. Default is 30 seconds.
   * Some requests may take longer, so we recommend setting a longer timeout if you notice timeouts.
   * @default 30000
   */
  timeout?: number
}

/**
 * Base configuration for v1 client
 */
export interface BaasClientConfigV1 extends Omit<BaasClientConfig, "api_version"> {
  api_version?: "v1"
}

/**
 * Base configuration for v2 client
 */
export interface BaasClientConfigV2 extends Omit<BaasClientConfig, "api_version"> {
  api_version: "v2"
}

/**
 * v1 Client methods interface
 * These methods use wrapped responses (ApiResponse<T>)
 */
export interface BaasClientV1Methods {
  joinMeeting(params: JoinRequest): Promise<ApiResponse<JoinResponse>>
  leaveMeeting(params: { uuid: string }): Promise<ApiResponse<LeaveResponse>>
  getMeetingData(params: GetMeetingDataParams): Promise<ApiResponse<Metadata>>
  deleteBotData(params: { uuid: string }): Promise<ApiResponse<DeleteResponse>>
  listBots(params?: BotsWithMetadataParams): Promise<ApiResponse<ListRecentBotsResponse>>
  retranscribeBot(params: RetranscribeBody): Promise<ApiResponse<void>>
  getScreenshots(params: { uuid: string }): Promise<ApiResponse<ScreenshotsList>>
  createCalendar(params: CreateCalendarParams): Promise<ApiResponse<CreateCalendarResponse>>
  listCalendars(): Promise<ApiResponse<Calendar[]>>
  getCalendar(params: { uuid: string }): Promise<ApiResponse<Calendar>>
  updateCalendar(params: {
    uuid: string
    body: UpdateCalendarParams
  }): Promise<ApiResponse<CreateCalendarResponse>>
  deleteCalendar(params: { uuid: string }): Promise<ApiResponse<void>>
  getCalendarEvent(params: { uuid: string }): Promise<ApiResponse<Event>>
  scheduleCalendarRecordEvent(params: {
    uuid: string
    body: BotParam2
    query?: ScheduleRecordEventParams
  }): Promise<ApiResponse<Event[]>>
  unscheduleCalendarRecordEvent(params: {
    uuid: string
    query?: UnscheduleRecordEventParams
  }): Promise<ApiResponse<Event[]>>
  patchBot(params: {
    uuid: string
    body: BotParam3
    query?: PatchBotParams
  }): Promise<ApiResponse<Event[]>>
  listCalendarEvents(query: ListEventsParams): Promise<ApiResponse<ListEventResponse>>
  getWebhookDocumentation(): Promise<ApiResponse<unknown>>
  getBotWebhookDocumentation(): Promise<ApiResponse<unknown>>
  getCalendarWebhookDocumentation(): Promise<ApiResponse<unknown>>
  resyncAllCalendars(
    query?: ResyncAllCalendarsParams
  ): Promise<ApiResponse<ResyncAllCalendarsResponse>>
  listRawCalendars(params: ListRawCalendarsParams): Promise<ApiResponse<ListRawCalendarsResponse>>
  getApiKey(): string
  getBaseUrl(): string
}

/**
 * v2 Client methods interface
 * These methods use pass-through responses (ApiResponseV2<T>)
 */
export interface BaasClientV2Methods {
  createBot(params: CreateBotRequestBodyInput): Promise<ApiResponseV2<CreateBotResponseData>>
  batchCreateBots(
    params: BatchCreateBotsRequestBodyInput
  ): Promise<BatchApiResponseV2<BatchCreateBotResponseDataItem, BatchCreateBotResponseErrorsItem>>
  listBots(params?: ListBotsParams): Promise<ListApiResponseV2<ListBotsResponseDataItem>>
  getBotDetails(params: { bot_id: string }): Promise<ApiResponseV2<GetBotDetailsResponseData>>
  getBotStatus(params: { bot_id: string }): Promise<ApiResponseV2<GetBotStatusResponseData>>
  getBotScreenshots(params: {
    bot_id: string
    limit?: number
    cursor?: string | null
  }): Promise<ListApiResponseV2<GetBotScreenshotsResponseDataItem>>
  leaveBot(params: { bot_id: string }): Promise<ApiResponseV2<LeaveBotResponseData>>
  deleteBotData(params: {
    bot_id: string
    delete_from_provider?: boolean
  }): Promise<ApiResponseV2<DeleteBotDataResponseData>>
  resendFinalWebhook(params: {
    bot_id: string
  }): Promise<ApiResponseV2<ResendFinalWebhookResponseData>>
  retryCallback(params: {
    bot_id: string
    callbackConfig?: RetryCallbackRequestBodyInput
  }): Promise<ApiResponseV2<RetryCallbackResponseData>>
  createScheduledBot(
    params: CreateScheduledBotRequestBodyInput
  ): Promise<ApiResponseV2<CreateScheduledBotResponseData>>
  batchCreateScheduledBots(
    params: BatchCreateScheduledBotsRequestBodyInput
  ): Promise<
    BatchApiResponseV2<
      BatchCreateScheduledBotResponseDataItem,
      BatchCreateScheduledBotResponseErrorsItem
    >
  >
  listScheduledBots(
    params?: ListScheduledBotsParams
  ): Promise<ListApiResponseV2<ListScheduledBotsResponseDataItem>>
  getScheduledBot(params: { bot_id: string }): Promise<ApiResponseV2<GetScheduledBotResponseData>>
  updateScheduledBot(params: {
    bot_id: string
    body: UpdateScheduledBotRequestBodyInput
  }): Promise<ApiResponseV2<UpdateScheduledBotResponseData>>
  deleteScheduledBot(params: {
    bot_id: string
  }): Promise<ApiResponseV2<DeleteScheduledBotResponseData>>
  listRawCalendars(
    params: ListRawCalendarsRequestBodyInput
  ): Promise<ApiResponseV2<ListRawCalendarsResponseDataItem[]>>
  createCalendarConnection(
    params: CreateCalendarConnectionRequestBodyInput
  ): Promise<ApiResponseV2<CreateCalendarConnectionResponseData>>
  listCalendars(
    params?: ListCalendarsParams
  ): Promise<ListApiResponseV2<ListCalendarsResponseDataItem>>
  getCalendarDetails(params: {
    calendar_id: string
  }): Promise<ApiResponseV2<GetCalendarDetailsResponseData>>
  updateCalendarConnection(params: {
    calendar_id: string
    body: UpdateCalendarConnectionRequestBodyInput
  }): Promise<ApiResponseV2<UpdateCalendarConnectionResponseData>>
  deleteCalendarConnection(params: {
    calendar_id: string
  }): Promise<ApiResponseV2<DeleteCalendarConnectionResponseData>>
  syncCalendar(params: { calendar_id: string }): Promise<ApiResponseV2<SyncCalendarResponseData>>
  resubscribeCalendar(params: {
    calendar_id: string
  }): Promise<ApiResponseV2<ResubscribeCalendarResponseData>>
  listEvents(params: {
    calendar_id: string
    query?: ListEventsParamsV2
  }): Promise<ListApiResponseV2<ListEventsResponseDataItem>>
  listEventSeries(params: {
    calendar_id: string
    query?: ListEventSeriesParams
  }): Promise<ListApiResponseV2<ListEventSeriesResponseDataItem>>
  getEventDetails(params: {
    calendar_id: string
    event_id: string
  }): Promise<ApiResponseV2<GetEventDetailsResponseData>>
  createCalendarBot(params: {
    calendar_id: string
    body: CreateCalendarBotRequestBodyInput
  }): Promise<
    BatchApiResponseV2<CreateCalendarBotResponseDataItem, CreateCalendarBotResponseErrorsItem>
  >
  updateCalendarBot(params: {
    calendar_id: string
    event_id: string
    body: UpdateCalendarBotRequestBodyInput
  }): Promise<
    BatchApiResponseV2<UpdateCalendarBotResponseDataItem, UpdateCalendarBotResponseErrorsItem>
  >
  deleteCalendarBot(params: {
    calendar_id: string
    event_id: string
  }): Promise<
    BatchApiResponseV2<DeleteCalendarBotResponseDataItem, DeleteCalendarBotResponseErrorsItem>
  >
  getApiKey(): string
  getBaseUrl(): string
}
