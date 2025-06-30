import { describe, expect, it } from "vitest"
import { z } from "zod"
import { apiWrapper, apiWrapperNoParams } from "../../src/node/api"
import { createMockApiKey } from "../setup"

describe("API Wrapper Functions", () => {
  describe("apiWrapper", () => {
    it("should handle missing API key header", async () => {
      const mockOperation = async () => ({ data: "success" })

      const result = await apiWrapper(
        mockOperation,
        null,
        {},
        {
          headers: {} // Missing API key header
        }
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe("Please configure the api key when creating the client")
      }
    })

    it("should handle undefined headers", async () => {
      const mockOperation = async () => ({ data: "success" })

      const result = await apiWrapper(
        mockOperation,
        null,
        {},
        {} // No headers at all
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe("Please configure the api key when creating the client")
      }
    })

    it("should handle validation errors", async () => {
      const schema = z.object({
        required: z.string()
      })

      const mockOperation = async (_params: object) => ({ data: "success" })

      const result = await apiWrapper(
        mockOperation,
        schema,
        { required: undefined }, // Invalid params
        {
          headers: {
            "x-meeting-baas-api-key": createMockApiKey()
          }
        }
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(z.ZodError)
      }
    })

    it("should handle operation errors", async () => {
      const mockOperation = async () => {
        throw new Error("Network error")
      }

      const result = await apiWrapper(
        mockOperation,
        null,
        {},
        {
          headers: {
            "x-meeting-baas-api-key": createMockApiKey()
          }
        }
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe("Network error")
      }
    })

    it("should handle non-Error exceptions", async () => {
      const mockOperation = async () => {
        throw "String error"
      }

      const result = await apiWrapper(
        mockOperation,
        null,
        {},
        {
          headers: {
            "x-meeting-baas-api-key": createMockApiKey()
          }
        }
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe("String error")
      }
    })

    it("should handle successful operation", async () => {
      const schema = z.object({ value: z.string() })
      const mockOperation = async (params: { value: string }) => ({
        data: `Hello, ${params.value}`
      })

      const result = await apiWrapper(
        mockOperation,
        schema,
        { value: "World" },
        {
          headers: {
            "x-meeting-baas-api-key": createMockApiKey()
          }
        }
      )

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe("Hello, World")
      }
    })
  })

  describe("apiWrapperNoParams", () => {
    it("should handle missing API key header", async () => {
      const mockOperation = async () => ({ data: "success" })

      const result = await apiWrapperNoParams(mockOperation, {
        headers: {} // Missing API key header
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe("Please configure the api key when creating the client")
      }
    })

    it("should handle undefined headers", async () => {
      const mockOperation = async () => ({ data: "success" })

      const result = await apiWrapperNoParams(mockOperation, {}) // No headers at all

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe("Please configure the api key when creating the client")
      }
    })

    it("should handle operation errors", async () => {
      const mockOperation = async () => {
        throw new Error("Network error")
      }

      const result = await apiWrapperNoParams(mockOperation, {
        headers: {
          "x-meeting-baas-api-key": createMockApiKey()
        }
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe("Network error")
      }
    })

    it("should handle non-Error exceptions", async () => {
      const mockOperation = async () => {
        throw "String error"
      }

      const result = await apiWrapperNoParams(mockOperation, {
        headers: {
          "x-meeting-baas-api-key": createMockApiKey()
        }
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe("String error")
      }
    })

    it("should handle successful operation", async () => {
      const mockOperation = async () => ({ data: 42 })

      const result = await apiWrapperNoParams(mockOperation, {
        headers: {
          "x-meeting-baas-api-key": createMockApiKey()
        }
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(42)
      }
    })
  })
})
