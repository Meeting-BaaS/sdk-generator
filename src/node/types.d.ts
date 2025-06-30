/**
 * Configuration for the BaasClient
 */
export interface BaasClientConfig {
  /**
   * Meeting BaaS API key. Get your API key from https://meetingbaas.com/
   */
  api_key: string
  /**
   * Base URL for the API
   * This is an internal parameter and should not be accessed directly
   * @default "https://api.meetingbaas.com"
   */
  base_url?: string
  /**
   * Timeout for the API requests. Default is 30 seconds.
   * Some requests may take longer, so we recommend setting a longer timeout if you notice timeouts.
   * @default 30000
   */
  timeout?: number
}
