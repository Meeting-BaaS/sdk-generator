import type { HttpHandler } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll } from "vitest"
// v1 mocks
import { getCalendarsMock } from "../src/generated/v1/api/calendars/calendars.msw"
import {
  getBotsWithMetadataMockHandler,
  getDeleteDataMockHandler,
  getDeleteDataResponseMock,
  getGetMeetingDataMockHandler,
  getGetScreenshotsMockHandler,
  getJoinMockHandler,
  getLeaveMockHandler,
  getLeaveResponseMock,
  getRetranscribeBotMockHandler
} from "../src/generated/v1/api/default/default.msw"
import { getWebhooksMock } from "../src/generated/v1/api/webhooks/webhooks.msw"

// v2 mocks
import { getBotsMock } from "../src/generated/v2/api/bots/bots.msw"
import { getCalendarsMock as getV2CalendarsMock } from "../src/generated/v2/api/calendars/calendars.msw"

// Note: Scheduled bot mocks are included in getBotsMock() (no separate scheduled-bots directory)
const v2Mocks: HttpHandler[] = [...getBotsMock(), ...getV2CalendarsMock()]

// Override handlers to return consistent success responses
const leaveHandler = getLeaveMockHandler(() => getLeaveResponseMock({ ok: true }))
const deleteHandler = getDeleteDataMockHandler(() =>
  getDeleteDataResponseMock({ ok: true, status: "deleted" })
)

export const server = setupServer(
  // v1 handlers
  getJoinMockHandler(),
  leaveHandler,
  getGetMeetingDataMockHandler(),
  deleteHandler,
  getBotsWithMetadataMockHandler(),
  getRetranscribeBotMockHandler(),
  getGetScreenshotsMockHandler(),
  ...getCalendarsMock(),
  ...getWebhooksMock(),
  // v2 handlers
  ...v2Mocks
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))

afterEach(() => server.resetHandlers())

afterAll(() => server.close())

export const createMockApiKey = () => "test-api-key-12345"

export const createMockBotId = () => "123e4567-e89b-12d3-a456-426614174000"

export const createMockMeetingUrl = () => "https://meet.google.com/abc-defg-hij"

/**
 * Create a mock v2 API response with success format
 */
export const createMockV2SuccessResponse = <T>(data: T) => ({
  success: true as const,
  data
})

/**
 * Create a mock v2 API error response
 */
export const createMockV2ErrorResponse = (error: string, code = "ERROR", statusCode = 400) => ({
  success: false as const,
  error,
  code,
  statusCode,
  message: error,
  details: null
})

/**
 * Create a mock v2 batch response with partial success
 * Matches the actual API response structure with index, code, message, details, and extra
 */
export const createMockV2BatchResponse = <
  T,
  TError extends { index: number; code: string; message: string; details: unknown; extra: unknown }
>(
  data: T[],
  errors: TError[] = []
) => ({
  success: true as const,
  data,
  errors
})
