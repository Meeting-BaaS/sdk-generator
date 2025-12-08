import type { AxiosRequestConfig } from "axios"
import type { BaasClientConfig } from "./types"

/**
 * Internal client state and utilities
 */
export class ClientState {
  private apiKey: string
  private baseUrl: string
  private timeout: number
  private apiVersion: "v1" | "v2" | "vexa"

  constructor(config: BaasClientConfig) {
    this.apiKey = config?.api_key ?? "" // The fallback is an empty string, which will be checked in the apiWrapper
    this.apiVersion = config?.api_version ?? "v1"

    // Set default base URL based on version (Bridge: Base URL)
    if (this.apiVersion === "vexa") {
      this.baseUrl = config?.base_url ?? "https://api.cloud.vexa.ai"
    } else {
      // Don't add /v2 prefix here - the generated v2 API functions already include it in their paths
      this.baseUrl = config?.base_url ?? "https://api.meetingbaas.com"
    }

    this.timeout = config?.timeout ?? 30000
  }

  getApiKey(): string {
    return this.apiKey
  }

  getBaseUrl(): string {
    return this.baseUrl
  }

  getApiVersion(): "v1" | "v2" | "vexa" {
    return this.apiVersion
  }

  getOptions(): AxiosRequestConfig {
    // Bridge: Authentication header - different for Vexa
    const authHeader = this.apiVersion === "vexa"
      ? "X-API-Key"
      : "x-meeting-baas-api-key"

    return {
      baseURL: this.baseUrl,
      headers: {
        [authHeader]: this.apiKey,
        "Content-Type": "application/json"
      },
      timeout: this.timeout
    }
  }
}
