/**
 * Manual Speechmatics type definitions
 * The OpenAPI spec doesn't accurately represent the actual API,
 * so we define types based on real API behavior
 */

export interface JobConfig {
  type: "transcription" | "alignment"
  transcription_config?: {
    language?: string
    operating_point?: string
    diarization?: string
    enable_entities?: boolean
    [key: string]: unknown
  }
  fetch_data?: {
    url: string
  }
  notification_config?: Array<{
    url: string
    contents: string[]
    method?: "POST" | "PUT"
  }>
  [key: string]: unknown
}

export interface JobSubmitResponse {
  id: string
  created_at: string
  [key: string]: unknown
}

export interface JobDetailsResponse {
  job: {
    id: string
    created_at: string
    status: string
    data_name?: string
    duration?: number
    [key: string]: unknown
  }
}

export interface TranscriptionResponse {
  format: string
  job: {
    id: string
    created_at: string
    duration?: number
    data_name?: string
    [key: string]: unknown
  }
  metadata: {
    created_at: string
    type: string
    transcription_config?: {
      language: string
      operating_point?: string
      diarization?: string
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  results: Array<{
    type: "word" | "punctuation" | "entity"
    start_time?: number
    end_time?: number
    alternatives?: Array<{
      content: string
      confidence?: number
      speaker?: string
      language?: string
      [key: string]: unknown
    }>
    [key: string]: unknown
  }>
  summary?: {
    content?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}
