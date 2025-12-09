/**
 * Speechmatics API Type Definitions
 *
 * IMPORTANT: These types are manually defined based on Speechmatics API documentation
 * because the official OpenAPI spec contains validation errors that prevent auto-generation.
 *
 * Source: https://docs.speechmatics.com/
 * Spec location: ./specs/speechmatics-batch.yaml (has validation issues)
 *
 * @see https://docs.speechmatics.com/introduction/batch-guide
 * @see https://docs.speechmatics.com/jobsapi
 */

/**
 * Job configuration for transcription
 */
export interface JobConfig {
  type: 'transcription';
  transcription_config: TranscriptionConfig;
  fetch_data?: FetchData;
  notification_config?: NotificationConfig;
}

/**
 * Configuration options for transcription
 */
export interface TranscriptionConfig {
  /** Language code (e.g., 'en', 'es', 'fr') */
  language: string;

  /** Operating point: 'standard' or 'enhanced' */
  operating_point?: 'standard' | 'enhanced';

  /** Enable speaker diarization */
  diarization?: 'speaker' | 'none';

  /** Expected number of speakers (when diarization enabled) */
  speaker_diarization_config?: {
    max_speakers?: number;
  };

  /** Additional languages for language identification */
  additional_vocab?: string[];

  /** Custom dictionary */
  custom_dictionary?: CustomDictionary;

  /** Enable punctuation */
  enable_entities?: boolean;

  /** Output locale for formatting */
  output_locale?: string;

  /** Maximum number of alternatives per word */
  max_alternatives?: number;

  /** Enable sentiment analysis */
  enable_sentiment_analysis?: boolean;

  /** Summarization configuration */
  summarization_config?: {
    type?: 'bullets' | 'brief' | 'paragraph';
    length?: 'short' | 'medium' | 'long';
  };
}

/**
 * Custom dictionary for specialized vocabulary
 */
export interface CustomDictionary {
  content: Array<{
    sounds_like?: string[];
    display_as?: string;
  }>;
}

/**
 * Configuration for fetching audio from URL
 */
export interface FetchData {
  url: string;
  auth_headers?: Record<string, string>;
}

/**
 * Response when submitting a job
 */
export interface JobSubmitResponse {
  id: string;
  created_at: string;
  duration?: number;
  data_name?: string;
}

/**
 * Job details response
 */
export interface JobDetailsResponse {
  job: {
    id: string;
    data_name: string;
    duration: number;
    created_at: string;
    config: JobConfig;
    status: 'running' | 'done' | 'rejected' | 'expired';
    errors?: Array<{
      type: string;
      message: string;
    }>;
  };
}

/**
 * Complete transcription response
 */
export interface TranscriptionResponse {
  format: string;
  job: {
    id: string;
    data_name: string;
    duration: number;
    created_at: string;
  };
  metadata: {
    created_at: string;
    type: string;
    transcription_config: TranscriptionConfig;
  };
  results: TranscriptionResult[];
  sentiment_analysis?: SentimentAnalysisResult;
  summary?: SummaryResult;
}

/**
 * Individual transcription result (word/entity)
 */
export interface TranscriptionResult {
  type: 'word' | 'punct' | 'entity';
  start_time: number;
  end_time: number;
  alternatives: Array<{
    content: string;
    confidence: number;
    language?: string;
    speaker?: string;
    display?: {
      direction?: string;
    };
  }>;
  attaches_to?: 'previous' | 'next' | 'both';
  is_eos?: boolean;
}

/**
 * Sentiment analysis result
 */
export interface SentimentAnalysisResult {
  sentiment_analysis: {
    segments: Array<{
      start_time: number;
      end_time: number;
      sentiment: 'positive' | 'negative' | 'neutral';
      confidence: number;
    }>;
  };
}

/**
 * Summary result
 */
export interface SummaryResult {
  content: string;
  summary_type: 'bullets' | 'brief' | 'paragraph';
}

/**
 * List jobs response
 */
export interface ListJobsResponse {
  jobs: Array<{
    id: string;
    data_name: string;
    duration: number;
    created_at: string;
    status: 'running' | 'done' | 'rejected' | 'expired';
  }>;
}

/**
 * Error response
 */
export interface ErrorResponse {
  code: number;
  error: string;
  detail?: string;
}

/**
 * Notification configuration for webhook callbacks
 *
 * Speechmatics sends webhooks upon job completion with:
 * - Query parameters: id (job ID) and status (success/error/fetch_error/trim_error)
 * - User agent: "Speechmatics-API/2.0"
 * - Body: content based on `contents` array configuration
 *
 * @see https://docs.speechmatics.com/features-other/notifications
 */
export interface NotificationConfig {
  /** Webhook URL to receive notifications */
  url: string;

  /**
   * Items to include in webhook body
   * - If empty: body will be empty
   * - If single item: sent as body with appropriate Content-Type
   * - If multiple items: sent as multipart file attachments
   * - If not specified: defaults to transcript as file attachment
   */
  contents?: Array<
    | 'jobinfo'
    | 'transcript'
    | 'transcript.json-v2'
    | 'transcript.txt'
    | 'transcript.srt'
    | 'alignment'
    | 'alignment.word_start_and_end'
    | 'alignment.one_per_line'
    | 'data'
    | 'text'
  >;

  /** HTTP method for webhook (default: post) */
  method?: 'post' | 'put';

  /** Additional headers for authentication/authorization */
  auth_headers?: string[];
}
