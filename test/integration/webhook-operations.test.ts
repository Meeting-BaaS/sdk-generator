import { beforeEach, describe, expect, it } from "vitest"
import {
  getBotWebhookDocumentationMockHandler,
  getCalendarWebhookDocumentationMockHandler,
  getWebhookDocumentationMockHandler
} from "../../src/generated/api/webhooks/webhooks.msw"
import { createBaasClient } from "../../src/node/client"
import { createMockApiKey, server } from "../setup"

describe("Webhook Operations Integration Tests", () => {
  let client: ReturnType<typeof createBaasClient>

  beforeEach(() => {
    client = createBaasClient({
      api_key: createMockApiKey()
    })
  })

  describe("getWebhookDocumentation", () => {
    it("should get webhook documentation successfully", async () => {
      server.use(getWebhookDocumentationMockHandler())
      const result = await client.getWebhookDocumentation()
      expect(result.success).toBe(true)
    })
  })

  describe("getBotWebhookDocumentation", () => {
    it("should get bot webhook documentation successfully", async () => {
      server.use(getBotWebhookDocumentationMockHandler())
      const result = await client.getBotWebhookDocumentation()
      expect(result.success).toBe(true)
    })
  })

  describe("getCalendarWebhookDocumentation", () => {
    it("should get calendar webhook documentation successfully", async () => {
      server.use(getCalendarWebhookDocumentationMockHandler())
      const result = await client.getCalendarWebhookDocumentation()
      expect(result.success).toBe(true)
    })
  })
})
