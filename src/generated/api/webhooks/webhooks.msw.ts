/**
 * Generated by orval v7.9.0 🍺
 * Do not edit manually.
 * Meeting BaaS API
 * Meeting BaaS API
 * OpenAPI spec version: 1.1
 */
import { delay, HttpResponse, http } from "msw"

export const getWebhookDocumentationMockHandler = (
  overrideResponse?:
    | unknown
    | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<unknown> | unknown)
) => {
  return http.get("https://api.meetingbaas.com/bots/webhooks", async (info) => {
    await delay(1000)
    if (typeof overrideResponse === "function") {
      await overrideResponse(info)
    }
    return new HttpResponse(null, { status: 200 })
  })
}

export const getBotWebhookDocumentationMockHandler = (
  overrideResponse?:
    | unknown
    | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<unknown> | unknown)
) => {
  return http.get("https://api.meetingbaas.com/bots/webhooks/bot", async (info) => {
    await delay(1000)
    if (typeof overrideResponse === "function") {
      await overrideResponse(info)
    }
    return new HttpResponse(null, { status: 200 })
  })
}

export const getCalendarWebhookDocumentationMockHandler = (
  overrideResponse?:
    | unknown
    | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<unknown> | unknown)
) => {
  return http.get("https://api.meetingbaas.com/bots/webhooks/calendar", async (info) => {
    await delay(1000)
    if (typeof overrideResponse === "function") {
      await overrideResponse(info)
    }
    return new HttpResponse(null, { status: 200 })
  })
}
export const getWebhooksMock = () => [
  getWebhookDocumentationMockHandler(),
  getBotWebhookDocumentationMockHandler(),
  getCalendarWebhookDocumentationMockHandler()
]
