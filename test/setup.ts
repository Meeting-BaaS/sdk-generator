import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll } from "vitest"
import { getCalendarsMock } from "../src/generated/api/calendars/calendars.msw"
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
} from "../src/generated/api/default/default.msw"
import { getWebhooksMock } from "../src/generated/api/webhooks/webhooks.msw"

// Override handlers to return consistent success responses
const leaveHandler = getLeaveMockHandler(() => getLeaveResponseMock({ ok: true }))
const deleteHandler = getDeleteDataMockHandler(() =>
  getDeleteDataResponseMock({ ok: true, status: "deleted" })
)

export const server = setupServer(
  getJoinMockHandler(),
  leaveHandler,
  getGetMeetingDataMockHandler(),
  deleteHandler,
  getBotsWithMetadataMockHandler(),
  getRetranscribeBotMockHandler(),
  getGetScreenshotsMockHandler(),
  ...getCalendarsMock(),
  ...getWebhooksMock()
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))

afterEach(() => server.resetHandlers())

afterAll(() => server.close())

export const createMockApiKey = () => "test-api-key-12345"

export const createMockBotId = () => "123e4567-e89b-12d3-a456-426614174000"

export const createMockMeetingUrl = () => "https://meet.google.com/abc-defg-hij"
