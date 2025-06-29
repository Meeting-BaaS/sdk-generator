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
