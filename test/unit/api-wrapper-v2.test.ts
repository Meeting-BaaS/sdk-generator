import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios"
import { AxiosError } from "axios"
import { describe, expect, it } from "vitest"
import { z } from "zod"
import {
  type ApiResponseV2,
  apiWrapperV2,
  apiWrapperV2List,
  apiWrapperV2NoParams,
  type ListApiResponseV2
} from "../../src/node/api"
import { createMockApiKey } from "../setup"

describe("API Wrapper V2 Functions", () => {
  describe("apiWrapperV2", () => {
    it("should handle missing API key header", async () => {
      const mockOperation = async (
        _params: unknown,
        _options: AxiosRequestConfig
      ): Promise<{ data: ApiResponseV2<string> }> => ({
        data: { success: true as const, data: "success" }
      })

      const result = await apiWrapperV2(
        mockOperation,
        null,
        {},
        {
          headers: {} // Missing API key header
        }
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Unauthorized")
        expect(result.message).toBe("Please configure the api key when creating the client")
        expect(result.code).toBe("MISSING_API_KEY")
        expect(result.statusCode).toBe(401)
      }
    })

    it("should handle undefined headers", async () => {
      const mockOperation = async (
        _params: unknown,
        _options: AxiosRequestConfig
      ): Promise<{ data: ApiResponseV2<string> }> => ({
        data: { success: true as const, data: "success" }
      })

      const result = await apiWrapperV2(
        mockOperation,
        null,
        {},
        {} as AxiosRequestConfig // No headers at all
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Unauthorized")
        expect(result.message).toBe("Please configure the api key when creating the client")
        expect(result.code).toBe("MISSING_API_KEY")
        expect(result.statusCode).toBe(401)
      }
    })

    it("should handle validation errors", async () => {
      const schema = z.object({
        required: z.string()
      })

      const mockOperation = async (_params: object): Promise<{ data: ApiResponseV2<string> }> => ({
        data: { success: true as const, data: "success" }
      })

      const result = await apiWrapperV2(
        mockOperation,
        schema,
        { required: undefined } as { required?: unknown }, // Invalid params
        {
          headers: {
            "x-meeting-baas-api-key": createMockApiKey()
          }
        }
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Bad Request")
        expect(result.message).toBe("Validation failed")
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.statusCode).toBe(400)
        expect(result.details).toContain("Required")
      }
    })

    it("should handle successful operation with ApiResponseV2 format", async () => {
      const schema = z.object({ value: z.string() })
      const mockOperation = async (
        params: { value: string },
        _options: AxiosRequestConfig
      ): Promise<{ data: ApiResponseV2<string> }> => ({
        data: { success: true as const, data: `Hello, ${params.value}` }
      })

      const result = await apiWrapperV2(
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

    it("should handle successful operation with AxiosResponse format", async () => {
      const mockOperation = async (
        _params: unknown,
        _options: AxiosRequestConfig
      ): Promise<AxiosResponse<ApiResponseV2<string>>> => {
        return {
          data: { success: true as const, data: "axios response" },
          status: 200,
          statusText: "OK",
          headers: {},
          config: {} as InternalAxiosRequestConfig
        }
      }

      const result = await apiWrapperV2(
        mockOperation,
        null,
        {},
        {
          headers: {
            "x-meeting-baas-api-key": createMockApiKey()
          }
        }
      )

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe("axios response")
      }
    })

    it("should extract ApiResponseV2 error from axios error response", async () => {
      const mockError = {
        success: false,
        error: "Custom error message",
        code: "CUSTOM_ERROR",
        statusCode: 402,
        message: "Custom error message",
        details: { field: "value" }
      }

      const mockOperation = async (_params: unknown, _options: AxiosRequestConfig) => {
        const error = new AxiosError("Request failed")
        error.response = {
          status: 402,
          data: mockError,
          headers: {},
          config: {} as InternalAxiosRequestConfig,
          statusText: "Payment Required"
        }
        throw error
      }

      const result = await apiWrapperV2(
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
        expect(result.error).toBe("Custom error message")
        expect(result.code).toBe("CUSTOM_ERROR")
        expect(result.statusCode).toBe(402)
        expect(result.details).toEqual({ field: "value" })
      }
    })

    it("should extract ApiResponseV2 error from axios error response with all required fields", async () => {
      // Test the exact condition path: responseData has success=false, error, code, statusCode
      const mockError = {
        success: false as const,
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        statusCode: 400,
        message: "Validation failed",
        details: null
      }

      const mockOperation = async (_params: unknown, _options: AxiosRequestConfig) => {
        const error = new AxiosError("Request failed")
        error.response = {
          status: 400,
          data: mockError,
          headers: {},
          config: {} as InternalAxiosRequestConfig,
          statusText: "Bad Request"
        }
        throw error
      }

      const result = await apiWrapperV2(
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
        expect(result.error).toBe("Validation failed")
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.statusCode).toBe(400)
      }
    })

    it("should handle axios error where responseData fails condition checks", async () => {
      // Test cases where responseData exists but doesn't match ApiResponseV2 format
      // This tests lines 248-251, 253-254 by ensuring the condition fails at different points

      // Case 1: responseData has success but it's true (not false)
      const mockOperation1 = async (_params: unknown, _options: AxiosRequestConfig) => {
        const error = new AxiosError("Request failed")
        error.response = {
          status: 400,
          data: { success: true, data: "test" }, // success is true, not false
          headers: {},
          config: {} as InternalAxiosRequestConfig,
          statusText: "Bad Request"
        }
        throw error
      }

      const result1 = await apiWrapperV2(
        mockOperation1,
        null,
        {},
        {
          headers: {
            "x-meeting-baas-api-key": createMockApiKey()
          }
        }
      )

      expect(result1.success).toBe(false)
      if (!result1.success) {
        expect(result1.code).toBe("HTTP_ERROR")
        expect(result1.statusCode).toBe(400)
      }

      // Case 2: responseData has success=false but missing error field
      const mockOperation2 = async (_params: unknown, _options: AxiosRequestConfig) => {
        const error = new AxiosError("Request failed")
        error.response = {
          status: 400,
          data: { success: false, code: "ERROR", statusCode: 400 }, // missing "error" field
          headers: {},
          config: {} as InternalAxiosRequestConfig,
          statusText: "Bad Request"
        }
        throw error
      }

      const result2 = await apiWrapperV2(
        mockOperation2,
        null,
        {},
        {
          headers: {
            "x-meeting-baas-api-key": createMockApiKey()
          }
        }
      )

      expect(result2.success).toBe(false)
      if (!result2.success) {
        expect(result2.code).toBe("HTTP_ERROR")
        expect(result2.statusCode).toBe(400)
      }

      // Case 3: responseData is undefined (covers line 262: details: responseData ?? null)
      const mockOperation3a = async (_params: unknown, _options: AxiosRequestConfig) => {
        const error = new AxiosError("Request failed")
        error.response = {
          status: 500,
          data: undefined, // undefined responseData
          headers: {},
          config: {} as InternalAxiosRequestConfig,
          statusText: "Internal Server Error"
        }
        throw error
      }

      const result3a = await apiWrapperV2(
        mockOperation3a,
        null,
        {},
        {
          headers: {
            "x-meeting-baas-api-key": createMockApiKey()
          }
        }
      )

      expect(result3a.success).toBe(false)
      if (!result3a.success) {
        expect(result3a.code).toBe("HTTP_ERROR")
        expect(result3a.statusCode).toBe(500)
        expect(result3a.details).toBeNull() // Should be null when responseData is undefined
      }

      // Case 3: responseData has success=false and error but missing code field
      const mockOperation3 = async (_params: unknown, _options: AxiosRequestConfig) => {
        const error = new AxiosError("Request failed")
        error.response = {
          status: 400,
          data: { success: false, error: "Error message", statusCode: 400 }, // missing "code" field
          headers: {},
          config: {} as InternalAxiosRequestConfig,
          statusText: "Bad Request"
        }
        throw error
      }

      const result3 = await apiWrapperV2(
        mockOperation3,
        null,
        {},
        {
          headers: {
            "x-meeting-baas-api-key": createMockApiKey()
          }
        }
      )

      expect(result3.success).toBe(false)
      if (!result3.success) {
        expect(result3.code).toBe("HTTP_ERROR")
        expect(result3.statusCode).toBe(400)
      }

      // Case 4: responseData has success=false, error, code but missing statusCode field
      const mockOperation4 = async (_params: unknown, _options: AxiosRequestConfig) => {
        const error = new AxiosError("Request failed")
        error.response = {
          status: 400,
          data: { success: false, error: "Error message", code: "ERROR" }, // missing "statusCode" field
          headers: {},
          config: {} as InternalAxiosRequestConfig,
          statusText: "Bad Request"
        }
        throw error
      }

      const result4 = await apiWrapperV2(
        mockOperation4,
        null,
        {},
        {
          headers: {
            "x-meeting-baas-api-key": createMockApiKey()
          }
        }
      )

      expect(result4.success).toBe(false)
      if (!result4.success) {
        expect(result4.code).toBe("HTTP_ERROR")
        expect(result4.statusCode).toBe(400)
      }

      // Case 5: responseData is not an object (e.g., string)
      const mockOperation5 = async (_params: unknown, _options: AxiosRequestConfig) => {
        const error = new AxiosError("Request failed")
        error.response = {
          status: 400,
          data: "Error string", // not an object
          headers: {},
          config: {} as InternalAxiosRequestConfig,
          statusText: "Bad Request"
        }
        throw error
      }

      const result5 = await apiWrapperV2(
        mockOperation5,
        null,
        {},
        {
          headers: {
            "x-meeting-baas-api-key": createMockApiKey()
          }
        }
      )

      expect(result5.success).toBe(false)
      if (!result5.success) {
        expect(result5.code).toBe("HTTP_ERROR")
        expect(result5.statusCode).toBe(400)
      }

      // Case 6: responseData is null
      const mockOperation6 = async (_params: unknown, _options: AxiosRequestConfig) => {
        const error = new AxiosError("Request failed")
        error.response = {
          status: 400,
          data: null, // null responseData
          headers: {},
          config: {} as InternalAxiosRequestConfig,
          statusText: "Bad Request"
        }
        throw error
      }

      const result6 = await apiWrapperV2(
        mockOperation6,
        null,
        {},
        {
          headers: {
            "x-meeting-baas-api-key": createMockApiKey()
          }
        }
      )

      expect(result6.success).toBe(false)
      if (!result6.success) {
        expect(result6.code).toBe("HTTP_ERROR")
        expect(result6.statusCode).toBe(400)
      }
    })

    it("should handle axios error without ApiResponseV2 format", async () => {
      const mockOperation = async (_params: unknown, _options: AxiosRequestConfig) => {
        const error = new AxiosError("Network error")
        error.response = {
          status: 500,
          data: { message: "Internal server error" },
          headers: {},
          config: {} as InternalAxiosRequestConfig,
          statusText: "Internal Server Error"
        }
        throw error
      }

      const result = await apiWrapperV2(
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
        expect(result.error).toBe("Internal Server Error")
        expect(result.message).toBe("Network error")
        expect(result.code).toBe("HTTP_ERROR")
        expect(result.statusCode).toBe(500)
        expect(result.details).toContain("Internal server error")
      }
    })

    it("should handle axios error with undefined status code", async () => {
      const mockOperation = async (_params: unknown, _options: AxiosRequestConfig) => {
        const error = new AxiosError("Network error")
        error.response = {
          status: undefined as unknown as number,
          data: { message: "Error" },
          headers: {},
          config: {} as InternalAxiosRequestConfig,
          statusText: "Error"
        }
        throw error
      }

      const result = await apiWrapperV2(
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
        expect(result.error).toBe("Internal Server Error")
        expect(result.message).toBe("Network error")
        expect(result.code).toBe("HTTP_ERROR")
        expect(result.statusCode).toBe(500) // Should default to 500 when status is undefined
        expect(result.details).toContain("Error")
      }
    })

    it("should handle axios error without response", async () => {
      const mockOperation = async (_params: unknown, _options: AxiosRequestConfig) => {
        const error = new AxiosError("Network error")
        // No response property - AxiosError without response is treated as UNKNOWN_ERROR
        throw error
      }

      const result = await apiWrapperV2(
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
        expect(result.error).toBe("Internal Server Error")
        expect(result.message).toBe("Network error")
        // When AxiosError has no response, it's treated as UNKNOWN_ERROR, not HTTP_ERROR
        expect(result.code).toBe("UNKNOWN_ERROR")
        expect(result.statusCode).toBe(500)
      }
    })

    it("should handle non-Error exceptions", async () => {
      const mockOperation = async () => {
        throw "String error"
      }

      const result = await apiWrapperV2(
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
        expect(result.error).toBe("Internal Server Error")
        expect(result.message).toBe("String error")
        expect(result.code).toBe("UNKNOWN_ERROR")
        expect(result.statusCode).toBe(500)
      }
    })

    it("should handle non-AxiosError with response property", async () => {
      const mockOperation = async (_params: unknown, _options: AxiosRequestConfig) => {
        const error = new Error("Custom error") as Error & {
          response?: { status: number; data?: unknown }
        }
        error.response = {
          status: 404,
          data: { message: "Not found" }
        }
        throw error
      }

      const result = await apiWrapperV2(
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
        expect(result.error).toBe("Internal Server Error")
        expect(result.message).toBe("Custom error")
        expect(result.code).toBe("HTTP_ERROR")
        expect(result.statusCode).toBe(404)
      }
    })
  })

  describe("apiWrapperV2NoParams", () => {
    it("should handle missing API key header", async () => {
      const mockOperation = async (
        _options: AxiosRequestConfig
      ): Promise<{ data: ApiResponseV2<string> }> => ({
        data: { success: true as const, data: "success" }
      })

      const result = await apiWrapperV2NoParams(mockOperation, {
        headers: {} // Missing API key header
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Unauthorized")
        expect(result.message).toBe("Please configure the api key when creating the client")
        expect(result.code).toBe("MISSING_API_KEY")
        expect(result.statusCode).toBe(401)
      }
    })

    it("should handle undefined headers", async () => {
      const mockOperation = async (
        _options: AxiosRequestConfig
      ): Promise<{ data: ApiResponseV2<string> }> => ({
        data: { success: true as const, data: "success" }
      })

      const result = await apiWrapperV2NoParams(mockOperation, {} as AxiosRequestConfig)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Unauthorized")
        expect(result.message).toBe("Please configure the api key when creating the client")
        expect(result.code).toBe("MISSING_API_KEY")
        expect(result.statusCode).toBe(401)
      }
    })

    it("should handle successful operation", async () => {
      const mockOperation = async (
        _options: AxiosRequestConfig
      ): Promise<{ data: ApiResponseV2<number> }> => ({
        data: { success: true as const, data: 42 }
      })

      const result = await apiWrapperV2NoParams(mockOperation, {
        headers: {
          "x-meeting-baas-api-key": createMockApiKey()
        }
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(42)
      }
    })

    it("should handle operation errors", async () => {
      const mockOperation = async (_options: AxiosRequestConfig) => {
        throw new Error("Network error")
      }

      const result = await apiWrapperV2NoParams(mockOperation, {
        headers: {
          "x-meeting-baas-api-key": createMockApiKey()
        }
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Internal Server Error")
        expect(result.message).toBe("Network error")
        expect(result.code).toBe("UNKNOWN_ERROR")
        expect(result.statusCode).toBe(500)
      }
    })

    it("should handle axios errors", async () => {
      const mockOperation = async (_options: AxiosRequestConfig) => {
        const error = new AxiosError("Request failed")
        error.response = {
          status: 404,
          data: { message: "Not found" },
          headers: {},
          config: {} as InternalAxiosRequestConfig,
          statusText: "Not Found"
        }
        throw error
      }

      const result = await apiWrapperV2NoParams(mockOperation, {
        headers: {
          "x-meeting-baas-api-key": createMockApiKey()
        }
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Internal Server Error")
        expect(result.message).toBe("Request failed")
        expect(result.code).toBe("HTTP_ERROR")
        expect(result.statusCode).toBe(404)
        expect(result.details).toContain("Not found")
      }
    })

    it("should extract ApiResponseV2 error from axios error response", async () => {
      // Test the exact condition path: responseData has success=false, error, code, statusCode
      // This covers lines 248-251, 253-254 in apiWrapperV2NoParams
      const mockError = {
        success: false as const,
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        statusCode: 400,
        message: "Validation failed",
        details: { field: "value" }
      }

      const mockOperation = async (_options: AxiosRequestConfig) => {
        const error = new AxiosError("Request failed")
        error.response = {
          status: 400,
          data: mockError,
          headers: {},
          config: {} as InternalAxiosRequestConfig,
          statusText: "Bad Request"
        }
        throw error
      }

      const result = await apiWrapperV2NoParams(mockOperation, {
        headers: {
          "x-meeting-baas-api-key": createMockApiKey()
        }
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Validation failed")
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.statusCode).toBe(400)
        expect(result.details).toEqual({ field: "value" })
      }
    })

    it("should handle axios errors with undefined status code", async () => {
      const mockOperation = async (_options: AxiosRequestConfig) => {
        const error = new AxiosError("Request failed")
        error.response = {
          status: undefined as unknown as number,
          data: { message: "Error" },
          headers: {},
          config: {} as InternalAxiosRequestConfig,
          statusText: "Error"
        }
        throw error
      }

      const result = await apiWrapperV2NoParams(mockOperation, {
        headers: {
          "x-meeting-baas-api-key": createMockApiKey()
        }
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Internal Server Error")
        expect(result.message).toBe("Request failed")
        expect(result.code).toBe("HTTP_ERROR")
        expect(result.statusCode).toBe(500) // Should default to 500 when status is undefined
        expect(result.details).toContain("Error")
      }
    })

    it("should handle axios error with undefined responseData", async () => {
      // Test the branch where responseData is undefined (covers line 262: details: responseData ?? null)
      const mockOperation = async (_options: AxiosRequestConfig) => {
        const error = new AxiosError("Request failed")
        error.response = {
          status: 500,
          data: undefined, // undefined responseData
          headers: {},
          config: {} as InternalAxiosRequestConfig,
          statusText: "Internal Server Error"
        }
        throw error
      }

      const result = await apiWrapperV2NoParams(mockOperation, {
        headers: {
          "x-meeting-baas-api-key": createMockApiKey()
        }
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Internal Server Error")
        expect(result.message).toBe("Request failed")
        expect(result.code).toBe("HTTP_ERROR")
        expect(result.statusCode).toBe(500)
        expect(result.details).toBeNull() // Should be null when responseData is undefined
      }
    })

    it("should handle non-Error exceptions", async () => {
      const mockOperation = async () => {
        throw "String error"
      }

      const result = await apiWrapperV2NoParams(mockOperation, {
        headers: {
          "x-meeting-baas-api-key": createMockApiKey()
        }
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Internal Server Error")
        expect(result.message).toBe("String error")
        expect(result.code).toBe("UNKNOWN_ERROR")
        expect(result.statusCode).toBe(500)
      }
    })
  })

  describe("apiWrapperV2List", () => {
    it("should handle missing API key header", async () => {
      const mockOperation = async (
        _params: unknown,
        _options: AxiosRequestConfig
      ): Promise<{ data: ListApiResponseV2<string> }> => ({
        data: { success: true as const, data: ["success"], cursor: null, prev_cursor: null }
      })

      const result = await apiWrapperV2List(
        mockOperation,
        null,
        {},
        {
          headers: {} // Missing API key header
        }
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Unauthorized")
        expect(result.message).toBe("Please configure the api key when creating the client")
        expect(result.code).toBe("MISSING_API_KEY")
        expect(result.statusCode).toBe(401)
      }
    })

    it("should handle undefined headers", async () => {
      const mockOperation = async (
        _params: unknown,
        _options: AxiosRequestConfig
      ): Promise<{ data: ListApiResponseV2<string> }> => ({
        data: { success: true as const, data: ["success"], cursor: null, prev_cursor: null }
      })

      const result = await apiWrapperV2List(
        mockOperation,
        null,
        {},
        {} as AxiosRequestConfig // No headers at all
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Unauthorized")
        expect(result.message).toBe("Please configure the api key when creating the client")
        expect(result.code).toBe("MISSING_API_KEY")
        expect(result.statusCode).toBe(401)
      }
    })

    it("should handle validation errors", async () => {
      const mockOperation = async (
        _params: unknown,
        _options: AxiosRequestConfig
      ): Promise<{ data: ListApiResponseV2<string> }> => ({
        data: { success: true as const, data: ["success"], cursor: null, prev_cursor: null }
      })

      const schema = z.object({
        required: z.string()
      })

      const result = await apiWrapperV2List(
        mockOperation,
        schema,
        { required: undefined } as { required?: unknown },
        {
          headers: { "x-meeting-baas-api-key": createMockApiKey() }
        }
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.statusCode).toBe(400)
      }
    })

    it("should handle successful operation with AxiosResponse format", async () => {
      const mockOperation = async (
        _params: unknown,
        _options: AxiosRequestConfig
      ): Promise<AxiosResponse<ListApiResponseV2<string>, InternalAxiosRequestConfig>> => {
        return {
          data: {
            success: true as const,
            data: ["item1", "item2"],
            cursor: "next",
            prev_cursor: "prev"
          },
          status: 200,
          statusText: "OK",
          headers: {},
          config: {} as InternalAxiosRequestConfig
        }
      }

      const result = await apiWrapperV2List(
        mockOperation,
        null,
        {},
        {
          headers: { "x-meeting-baas-api-key": createMockApiKey() }
        }
      )

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(["item1", "item2"])
        expect(result.cursor).toBe("next")
        expect(result.prev_cursor).toBe("prev")
      }
    })

    it("should handle error response from API", async () => {
      const mockOperation = async (
        _params: unknown,
        _options: AxiosRequestConfig
      ): Promise<{ data: ListApiResponseV2<string> }> => ({
        data: {
          success: false as const,
          message: "Not found",
          error: "Not found",
          code: "NOT_FOUND",
          statusCode: 404,
          details: null
        }
      })

      const result = await apiWrapperV2List(
        mockOperation,
        null,
        {},
        {
          headers: { "x-meeting-baas-api-key": createMockApiKey() }
        }
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Not found")
        expect(result.message).toBe("Not found")
        expect(result.code).toBe("NOT_FOUND")
        expect(result.statusCode).toBe(404)
      }
    })

    it("should handle axios error with ApiResponseV2 error format in response.data", async () => {
      const mockOperation = async (
        _params: unknown,
        _options: AxiosRequestConfig
      ): Promise<{ data: ListApiResponseV2<string> }> => {
        const error = new AxiosError("Request failed")
        error.response = {
          status: 400,
          data: {
            success: false,
            error: "Bad request",
            code: "BAD_REQUEST",
            statusCode: 400,
            details: null
          },
          statusText: "Bad Request",
          headers: {},
          config: {} as InternalAxiosRequestConfig
        }
        throw error
      }

      const result = await apiWrapperV2List(
        mockOperation,
        null,
        {},
        {
          headers: { "x-meeting-baas-api-key": createMockApiKey() }
        }
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Bad request")
        expect(result.code).toBe("BAD_REQUEST")
        expect(result.statusCode).toBe(400)
      }
    })

    it("should handle axios error without ApiResponseV2 format in response.data", async () => {
      const mockOperation = async (
        _params: unknown,
        _options: AxiosRequestConfig
      ): Promise<{ data: ListApiResponseV2<string> }> => {
        const error = new AxiosError("Request failed")
        error.response = {
          status: 500,
          data: { message: "Internal server error" },
          statusText: "Internal Server Error",
          headers: {},
          config: {} as InternalAxiosRequestConfig
        }
        throw error
      }

      const result = await apiWrapperV2List(
        mockOperation,
        null,
        {},
        {
          headers: { "x-meeting-baas-api-key": createMockApiKey() }
        }
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Internal Server Error")
        expect(result.message).toBe("Request failed")
        expect(result.code).toBe("HTTP_ERROR")
        expect(result.statusCode).toBe(500)
        expect(result.details).toContain("Internal server error")
      }
    })

    it("should handle axios error with undefined status code", async () => {
      // Test the branch where response.status is undefined (covers line 376: statusCode: axiosError.response?.status ?? 500)
      const mockOperation = async (
        _params: unknown,
        _options: AxiosRequestConfig
      ): Promise<{ data: ListApiResponseV2<string> }> => {
        const error = new AxiosError("Request failed")
        error.response = {
          status: undefined as unknown as number,
          data: { message: "Error" },
          statusText: "Error",
          headers: {},
          config: {} as InternalAxiosRequestConfig
        }
        throw error
      }

      const result = await apiWrapperV2List(
        mockOperation,
        null,
        {},
        {
          headers: { "x-meeting-baas-api-key": createMockApiKey() }
        }
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Internal Server Error")
        expect(result.message).toBe("Request failed")
        expect(result.code).toBe("HTTP_ERROR")
        expect(result.statusCode).toBe(500) // Should default to 500 when status is undefined
        expect(result.details).toContain("Error")
      }
    })

    it("should handle axios error with undefined responseData", async () => {
      // Test the branch where responseData is undefined (covers line 377: details: responseData ?? null)
      const mockOperation = async (
        _params: unknown,
        _options: AxiosRequestConfig
      ): Promise<{ data: ListApiResponseV2<string> }> => {
        const error = new AxiosError("Request failed")
        error.response = {
          status: 500,
          data: undefined, // undefined responseData
          statusText: "Internal Server Error",
          headers: {},
          config: {} as InternalAxiosRequestConfig
        }
        throw error
      }

      const result = await apiWrapperV2List(
        mockOperation,
        null,
        {},
        {
          headers: { "x-meeting-baas-api-key": createMockApiKey() }
        }
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Internal Server Error")
        expect(result.message).toBe("Request failed")
        expect(result.code).toBe("HTTP_ERROR")
        expect(result.statusCode).toBe(500)
        expect(result.details).toBeNull() // Should be null when responseData is undefined
      }
    })

    it("should handle axios error without response property", async () => {
      const mockOperation = async (
        _params: unknown,
        _options: AxiosRequestConfig
      ): Promise<{ data: ListApiResponseV2<string> }> => {
        const error = new Error("Network error")
        throw error
      }

      const result = await apiWrapperV2List(
        mockOperation,
        null,
        {},
        {
          headers: { "x-meeting-baas-api-key": createMockApiKey() }
        }
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Internal Server Error")
        expect(result.message).toBe("Network error")
        expect(result.code).toBe("UNKNOWN_ERROR")
        expect(result.statusCode).toBe(500)
      }
    })

    it("should handle non-Error exceptions", async () => {
      const mockOperation = async (
        _params: unknown,
        _options: AxiosRequestConfig
      ): Promise<{ data: ListApiResponseV2<string> }> => {
        throw "String error"
      }

      const result = await apiWrapperV2List(
        mockOperation,
        null,
        {},
        {
          headers: { "x-meeting-baas-api-key": createMockApiKey() }
        }
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Internal Server Error")
        expect(result.message).toBe("String error")
        expect(result.code).toBe("UNKNOWN_ERROR")
        expect(result.statusCode).toBe(500)
      }
    })
  })
})
