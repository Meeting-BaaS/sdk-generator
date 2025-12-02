import { describe, expect, it } from "vitest"
import { ClientState } from "../../src/node/client-state"
import type { BaasClientConfig } from "../../src/node/types"

describe("ClientState", () => {
  describe("getApiVersion", () => {
    it("should return v1 by default", () => {
      const state = new ClientState({
        api_key: "test-key"
      })

      expect(state.getApiVersion()).toBe("v1")
    })

    it("should return v1 when explicitly set", () => {
      const state = new ClientState({
        api_key: "test-key",
        api_version: "v1"
      })

      expect(state.getApiVersion()).toBe("v1")
    })

    it("should return v2 when explicitly set", () => {
      const state = new ClientState({
        api_key: "test-key",
        api_version: "v2"
      })

      expect(state.getApiVersion()).toBe("v2")
    })
  })

  describe("getApiKey", () => {
    it("should return the API key", () => {
      const state = new ClientState({
        api_key: "test-key-123"
      })

      expect(state.getApiKey()).toBe("test-key-123")
    })

    it("should return empty string when API key is not provided", () => {
      const state = new ClientState({} as Partial<BaasClientConfig> as BaasClientConfig)

      expect(state.getApiKey()).toBe("")
    })
  })

  describe("getBaseUrl", () => {
    it("should return default base URL", () => {
      const state = new ClientState({
        api_key: "test-key"
      })

      expect(state.getBaseUrl()).toBe("https://api.meetingbaas.com")
    })

    it("should return custom base URL", () => {
      const state = new ClientState({
        api_key: "test-key",
        base_url: "https://custom-api.example.com"
      })

      expect(state.getBaseUrl()).toBe("https://custom-api.example.com")
    })

    it("should not add /v2 prefix for v2 API", () => {
      const state = new ClientState({
        api_key: "test-key",
        api_version: "v2"
      })

      expect(state.getBaseUrl()).toBe("https://api.meetingbaas.com")
    })
  })

  describe("getOptions", () => {
    it("should return options with API key header", () => {
      const state = new ClientState({
        api_key: "test-key-123"
      })

      const options = state.getOptions()

      expect(options.headers).toBeDefined()
      expect(options.headers?.["x-meeting-baas-api-key"]).toBe("test-key-123")
      expect(options.headers?.["Content-Type"]).toBe("application/json")
    })

    it("should return options with default timeout", () => {
      const state = new ClientState({
        api_key: "test-key"
      })

      const options = state.getOptions()

      expect(options.timeout).toBe(30000)
    })

    it("should return options with custom timeout", () => {
      const state = new ClientState({
        api_key: "test-key",
        timeout: 60000
      })

      const options = state.getOptions()

      expect(options.timeout).toBe(60000)
    })

    it("should return options with baseURL", () => {
      const state = new ClientState({
        api_key: "test-key",
        base_url: "https://custom-api.example.com"
      })

      const options = state.getOptions()

      expect(options.baseURL).toBe("https://custom-api.example.com")
    })
  })
})
