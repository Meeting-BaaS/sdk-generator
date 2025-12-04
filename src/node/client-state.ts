import type { AxiosRequestConfig } from "axios"
import type { BaasClientConfig } from "./types"

/**
 * Internal client state and utilities
 */
export class ClientState {
  private apiKey: string
  private baseUrl: string
  private timeout: number
  private apiVersion: "v1" | "v2"

  constructor(config: BaasClientConfig) {
    this.apiKey = config?.api_key ?? "" // The fallback is an empty string, which will be checked in the apiWrapper
    this.apiVersion = config?.api_version ?? "v1"
    // Don't add /v2 prefix here - the generated v2 API functions already include it in their paths
    this.baseUrl = config?.base_url ?? "https://api.meetingbaas.com"
    this.timeout = config?.timeout ?? 30000
  }

  getApiKey(): string {
    return this.apiKey
  }

  getBaseUrl(): string {
    return this.baseUrl
  }

  getApiVersion(): "v1" | "v2" {
    return this.apiVersion
  }

  getOptions(): AxiosRequestConfig {
    return {
      baseURL: this.baseUrl,
      headers: {
        "x-meeting-baas-api-key": this.apiKey,
        "Content-Type": "application/json"
      },
      timeout: this.timeout
    }
  }
}
