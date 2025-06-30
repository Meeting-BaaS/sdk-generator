import { describe, expect, it } from "vitest"
import {
  advancedUsage,
  calendarExample,
  comprehensiveExample,
  exampleUsage,
  exampleWithErrorHandling
} from "../../examples/baas-client-usage"

describe("Example Usage Integration Tests", () => {
  describe("exampleUsage", () => {
    it("should run without throwing errors", async () => {
      // This test ensures the example doesn't crash
      // We don't need to assert specific values since MSW handles the mocking
      await expect(exampleUsage()).resolves.not.toThrow()
    })
  })

  describe("exampleWithErrorHandling", () => {
    it("should run without throwing errors", async () => {
      await expect(exampleWithErrorHandling()).resolves.not.toThrow()
    })
  })

  describe("calendarExample", () => {
    it("should run without throwing errors", async () => {
      await expect(calendarExample()).resolves.not.toThrow()
    })
  })

  describe("advancedUsage", () => {
    it("should run without throwing errors", async () => {
      await expect(advancedUsage()).resolves.not.toThrow()
    })
  })

  describe("comprehensiveExample", () => {
    it("should run without throwing errors", async () => {
      // This test makes multiple API calls, so it needs a longer timeout
      await expect(comprehensiveExample()).resolves.not.toThrow()
    }, 15000) // 15 second timeout
  })

  describe("Example Functions Export", () => {
    it("should export all example functions", () => {
      expect(typeof exampleUsage).toBe("function")
      expect(typeof exampleWithErrorHandling).toBe("function")
      expect(typeof calendarExample).toBe("function")
      expect(typeof advancedUsage).toBe("function")
      expect(typeof comprehensiveExample).toBe("function")
    })
  })
})
