import type { AxiosRequestConfig } from "axios"
import type { ZodError, ZodSchema } from "zod"

/**
 * Discriminated union type for API responses
 * Ensures type safety: when error is present, data is undefined, and vice versa
 */
export type ApiResponse<T> =
  | { success: true; data: T; error?: never }
  | { success: false; error: ZodError | Error; data?: never }

/**
 * Generic wrapper function for API calls with validation and error handling
 * This is the main wrapper you can use for all your API functions
 */
export async function apiWrapper<TData, TParams = void>(
  operation: (params: TParams, options: AxiosRequestConfig) => Promise<{ data: TData }>,
  schema: ZodSchema<TParams> | null,
  params: TParams,
  options: AxiosRequestConfig
): Promise<ApiResponse<TData>> {
  try {
    if (!options.headers || !options.headers["x-meeting-baas-api-key"]) {
      return {
        success: false,
        error: new Error("Please configure the api key when creating the client")
      }
    }

    // Validate parameters if schema is provided
    let validatedParams = params
    if (schema) {
      const validationResult = schema.safeParse(params)
      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error
        }
      }
      validatedParams = validationResult.data
    }

    // Make the API call
    const response = await operation(validatedParams, options)

    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    }
  }
}

/**
 * Generic wrapper for functions that take no parameters
 */
export async function apiWrapperNoParams<TData>(
  operation: (options: AxiosRequestConfig) => Promise<{ data: TData }>,
  options: AxiosRequestConfig
): Promise<ApiResponse<TData>> {
  try {
    if (!options.headers || !options.headers["x-meeting-baas-api-key"]) {
      return {
        success: false,
        error: new Error("Please configure the api key when creating the client")
      }
    }
    // Make the API call
    const response = await operation(options)

    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    }
  }
}

/**
 * v2 API response type - API already returns success/error format
 */
export type ApiResponseV2<T> =
  | { success: true; data: T }
  | {
      success: false
      error: string
      code: string
      statusCode: number
      message: string
      retryAfter?: number | null
      details: string | null
    }

/**
 * v2 Batch API response type - Batch routes return success with data and errors arrays
 */
export type BatchApiResponseV2<TData, TError = { item: unknown; error: string }> =
  | { success: true; data: TData[]; errors: TError[] }
  | {
      success: false
      error: string
      code: string
      statusCode: number
      message: string
      retryAfter?: number | null
      details: string | null
    }

/**
 * List API response type with flattened cursor fields
 * Used for paginated list endpoints where cursor and prev_cursor are at the top level
 */
export type ListApiResponseV2<TData> =
  | {
      success: true
      data: TData[]
      cursor: string | null
      prev_cursor: string | null
      error?: never
      code?: never
      statusCode?: never
      details?: never
    }
  | {
      success: false
      error: string
      code: string
      statusCode: number
      details: string | null
      message: string
      retryAfter?: number | null
      data?: never
      cursor?: never
      prev_cursor?: never
    }

/**
 * Generic wrapper function for v2 API calls
 * v2 API already returns { success, data } or { success: false, error, code, statusCode, details }
 * So we only validate parameters and pass through the response
 * The generated API functions return AxiosResponse<T>, so we extract .data from the response
 */
export async function apiWrapperV2<TData, TParams = void>(
  operation: (
    params: TParams,
    options: AxiosRequestConfig
  ) => Promise<
    { data: ApiResponseV2<TData> } | import("axios").AxiosResponse<ApiResponseV2<TData>>
  >,
  schema: ZodSchema<TParams> | null,
  params: TParams,
  options: AxiosRequestConfig
): Promise<ApiResponseV2<TData>> {
  try {
    if (!options.headers || !options.headers["x-meeting-baas-api-key"]) {
      return {
        success: false,
        error: "Unauthorized",
        message: "Please configure the api key when creating the client",
        code: "MISSING_API_KEY",
        statusCode: 401,
        details: null
      }
    }

    // Validate parameters if schema is provided
    let validatedParams = params
    if (schema) {
      const validationResult = schema.safeParse(params)
      if (!validationResult.success) {
        return {
          success: false,
          error: "Bad Request",
          code: "VALIDATION_ERROR",
          statusCode: 400,
          message: "Validation failed",
          details: validationResult.error.message
        }
      }
      validatedParams = validationResult.data
    }

    // Make the API call - generated functions return AxiosResponse<T>
    const response = await operation(validatedParams, options)

    // Extract data from axios response (both { data: ... } and AxiosResponse have .data)
    // The generated API functions return AxiosResponse<ApiResponseV2<TData>>
    // So response.data is already ApiResponseV2<TData>
    return (response as { data: ApiResponseV2<TData> }).data
  } catch (error) {
    // Handle network/axios errors
    if (error instanceof Error && "response" in error) {
      const axiosError = error as { response?: { status: number; data?: unknown } }
      const responseData = axiosError.response?.data

      // If the response data is already in ApiResponseV2 error format, return it directly
      if (
        responseData &&
        typeof responseData === "object" &&
        "success" in responseData &&
        responseData.success === false &&
        "error" in responseData &&
        "code" in responseData &&
        "statusCode" in responseData &&
        "message" in responseData
      ) {
        return responseData as ApiResponseV2<TData>
      }

      // Otherwise, wrap it in a generic error format
      return {
        success: false,
        error: "Internal Server Error",
        code: "HTTP_ERROR",
        statusCode: axiosError.response?.status ?? 500,
        message: error.message,
        details: responseData ? JSON.stringify(responseData) : null
      }
    }
    return {
      success: false,
      error: "Internal Server Error",
      code: "UNKNOWN_ERROR",
      statusCode: 500,
      message: error instanceof Error ? error.message : String(error),
      details: null
    }
  }
}

/**
 * Generic wrapper for v2 functions that take no parameters
 */
export async function apiWrapperV2NoParams<TData>(
  operation: (options: AxiosRequestConfig) => Promise<{ data: ApiResponseV2<TData> }>,
  options: AxiosRequestConfig
): Promise<ApiResponseV2<TData>> {
  try {
    if (!options.headers || !options.headers["x-meeting-baas-api-key"]) {
      return {
        success: false,
        error: "Unauthorized",
        message: "Please configure the api key when creating the client",
        code: "MISSING_API_KEY",
        statusCode: 401,
        details: null
      }
    }
    // Make the API call
    const response = await operation(options)

    return response.data
  } catch (error) {
    // Handle network/axios errors
    if (error instanceof Error && "response" in error) {
      const axiosError = error as { response?: { status: number; data?: unknown } }
      const responseData = axiosError.response?.data

      // If the response data is already in ApiResponseV2 error format, return it directly
      if (
        responseData &&
        typeof responseData === "object" &&
        "success" in responseData &&
        responseData.success === false &&
        "error" in responseData &&
        "code" in responseData &&
        "statusCode" in responseData &&
        "message" in responseData
      ) {
        return responseData as ApiResponseV2<TData>
      }

      // Otherwise, wrap it in a generic error format
      return {
        success: false,
        error: "Internal Server Error",
        code: "HTTP_ERROR",
        statusCode: axiosError.response?.status ?? 500,
        message: error.message,
        details: responseData ? JSON.stringify(responseData) : null
      }
    }
    return {
      success: false,
      error: "Internal Server Error",
      code: "UNKNOWN_ERROR",
      statusCode: 500,
      message: error instanceof Error ? error.message : String(error),
      details: null
    }
  }
}

/**
 * Vexa API response type - simpler format without retryAfter
 */
export type ApiResponseVexa<T> =
  | { success: true; data: T }
  | {
      success: false
      error: string
      statusCode: number
      code: string
      message: string
      details: string | null
    }

/**
 * Vexa API wrapper - simpler pattern for cleaner code
 * Wraps API calls and standardizes error handling
 */
export async function apiWrapperVexa<T>(
  fn: () => Promise<T>
): Promise<ApiResponseVexa<T>> {
  try {
    const data = await fn()
    return { success: true, data }
  } catch (error: any) {
    const errorResponse = error.response?.data
    return {
      success: false,
      error: errorResponse?.error || error.message || "Unknown error",
      statusCode: error.response?.status || 500,
      code: errorResponse?.code || "UNKNOWN_ERROR",
      message: errorResponse?.message || error.message || "An error occurred",
      details: errorResponse?.details || null
    }
  }
}

/**
 * Wrapper function for v2 list API calls that flattens cursor fields
 * Transforms API response from { success: true, data: [...], cursor: ..., prev_cursor: ... }
 * to { success: true, data: [...], cursor: ..., prev_cursor: ... } with cursor/prev_cursor at top level
 */
export async function apiWrapperV2List<TData, TParams = void>(
  operation: (
    params: TParams,
    options: AxiosRequestConfig
  ) => Promise<
    | {
        data:
          | { success: true; data: TData[]; cursor: string | null; prev_cursor: string | null }
          | { success: false; error: string; code: string; statusCode: number; details: unknown }
      }
    | import("axios").AxiosResponse<
        | { success: true; data: TData[]; cursor: string | null; prev_cursor: string | null }
        | { success: false; error: string; code: string; statusCode: number; details: unknown }
      >
  >,
  schema: ZodSchema<TParams> | null,
  params: TParams,
  options: AxiosRequestConfig
): Promise<ListApiResponseV2<TData>> {
  try {
    if (!options.headers || !options.headers["x-meeting-baas-api-key"]) {
      return {
        success: false,
        error: "Unauthorized",
        code: "MISSING_API_KEY",
        statusCode: 401,
        message: "Please configure the api key when creating the client",
        details: null
      }
    }

    // Validate parameters if schema is provided
    let validatedParams = params
    if (schema) {
      const validationResult = schema.safeParse(params)
      if (!validationResult.success) {
        return {
          success: false,
          error: "Bad Request",
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          statusCode: 400,
          details: validationResult.error.message
        }
      }
      validatedParams = validationResult.data
    }

    // Make the API call
    const response = await operation(validatedParams, options)

    // Extract data from axios response
    // The generated API functions return AxiosResponse<ListResponse>
    // where ListResponse = { success: true, data: [...], cursor: ..., prev_cursor: ... }
    const apiResponse = (
      response as {
        data:
          | { success: true; data: TData[]; cursor: string | null; prev_cursor: string | null }
          | { success: false; error: string; code: string; statusCode: number; details: unknown }
      }
    ).data

    // If error response, return as-is
    if (!apiResponse.success) {
      return apiResponse as ListApiResponseV2<TData>
    }

    // Flatten the response: extract data array and cursor fields to top level
    return {
      success: true,
      data: apiResponse.data,
      cursor: apiResponse.cursor,
      prev_cursor: apiResponse.prev_cursor
    }
  } catch (error) {
    // Handle network/axios errors
    if (error instanceof Error && "response" in error) {
      const axiosError = error as { response?: { status: number; data?: unknown } }
      const responseData = axiosError.response?.data

      // If the response data is already in ApiResponseV2 error format, return it directly
      if (
        responseData &&
        typeof responseData === "object" &&
        "success" in responseData &&
        responseData.success === false &&
        "error" in responseData &&
        "code" in responseData &&
        "statusCode" in responseData
      ) {
        return responseData as ListApiResponseV2<TData>
      }

      // Otherwise, wrap it in a generic error format
      return {
        success: false,
        error: "Internal Server Error",
        code: "HTTP_ERROR",
        statusCode: axiosError.response?.status ?? 500,
        message: error.message,
        details: responseData ? JSON.stringify(responseData) : null
      }
    }
    return {
      success: false,
      error: "Internal Server Error",
      code: "UNKNOWN_ERROR",
      statusCode: 500,
      message: error instanceof Error ? error.message : String(error),
      details: null
    }
  }
}
