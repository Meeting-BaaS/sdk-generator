/**
 * OpenAI Realtime API Types
 * 
 * WebSocket-based real-time speech-to-text, text-to-speech, and voice conversations.
 * Source: https://github.com/Azure-Samples/RealtimeAIApp-JS
 * 
 * Endpoints:
 * - OpenAI: wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview
 * - Azure OpenAI: wss://{endpoint}/openai/realtime?deployment={model}&api-version={version}
 */

// ─────────────────────────────────────────────────────────────────────────────
// Session Configuration
// ─────────────────────────────────────────────────────────────────────────────

export interface RealtimeSessionConfig {
  /** Modalities for the session: 'text', 'audio', or both */
  modalities: ('text' | 'audio')[]
  /** Voice for text-to-speech: ash, coral, sage, shimmer, verse, alloy */
  voice: 'ash' | 'coral' | 'sage' | 'shimmer' | 'verse' | 'alloy'
  /** Input audio format */
  input_audio_format: 'pcm16' | 'g711_ulaw' | 'g711_alaw'
  /** Output audio format */
  output_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw'
  /** Input audio transcription config */
  input_audio_transcription?: {
    model: 'whisper-1'
  }
  /** Voice activity detection config */
  turn_detection?: {
    type: 'server_vad'
    threshold?: number
    prefix_padding_ms?: number
    silence_duration_ms?: number
  }
  /** Tool choice mode */
  tool_choice?: 'auto' | 'none' | 'required'
  /** Max response output tokens */
  max_response_output_tokens?: number | 'inf'
  /** System instructions */
  instructions?: string
  /** Tools (function calling) */
  tools?: RealtimeTool[]
}

export interface RealtimeTool {
  type: 'function'
  name: string
  description?: string
  parameters?: Record<string, unknown>
}

// ─────────────────────────────────────────────────────────────────────────────
// Client Events (sent to OpenAI)
// ─────────────────────────────────────────────────────────────────────────────

export type RealtimeClientEvent =
  | SessionUpdateEvent
  | InputAudioBufferAppendEvent
  | InputAudioBufferCommitEvent
  | InputAudioBufferClearEvent
  | ConversationItemCreateEvent
  | ConversationItemTruncateEvent
  | ConversationItemDeleteEvent
  | ResponseCreateEvent
  | ResponseCancelEvent

export interface SessionUpdateEvent {
  type: 'session.update'
  session: Partial<RealtimeSessionConfig>
}

export interface InputAudioBufferAppendEvent {
  type: 'input_audio_buffer.append'
  /** Base64-encoded audio data */
  audio: string
}

export interface InputAudioBufferCommitEvent {
  type: 'input_audio_buffer.commit'
}

export interface InputAudioBufferClearEvent {
  type: 'input_audio_buffer.clear'
}

export interface ConversationItemCreateEvent {
  type: 'conversation.item.create'
  previous_item_id?: string
  item: ConversationItem
}

export interface ConversationItemTruncateEvent {
  type: 'conversation.item.truncate'
  item_id: string
  content_index: number
  audio_end_ms: number
}

export interface ConversationItemDeleteEvent {
  type: 'conversation.item.delete'
  item_id: string
}

export interface ResponseCreateEvent {
  type: 'response.create'
  event_id?: string
  response?: {
    modalities?: ('text' | 'audio')[]
    voice?: string
    instructions?: string
  }
}

export interface ResponseCancelEvent {
  type: 'response.cancel'
}

// ─────────────────────────────────────────────────────────────────────────────
// Server Events (received from OpenAI)
// ─────────────────────────────────────────────────────────────────────────────

export type RealtimeServerEvent =
  | ErrorEvent
  | SessionCreatedEvent
  | SessionUpdatedEvent
  | InputAudioBufferSpeechStartedEvent
  | InputAudioBufferSpeechStoppedEvent
  | InputAudioBufferCommittedEvent
  | InputAudioBufferClearedEvent
  | ConversationItemCreatedEvent
  | ConversationItemInputAudioTranscriptionCompletedEvent
  | ConversationItemInputAudioTranscriptionFailedEvent
  | ResponseCreatedEvent
  | ResponseDoneEvent
  | ResponseAudioDeltaEvent
  | ResponseAudioDoneEvent
  | ResponseAudioTranscriptDeltaEvent
  | ResponseAudioTranscriptDoneEvent
  | ResponseTextDeltaEvent
  | ResponseTextDoneEvent
  | ResponseFunctionCallArgumentsDeltaEvent
  | ResponseFunctionCallArgumentsDoneEvent
  | RateLimitsUpdatedEvent

export interface ErrorEvent {
  type: 'error'
  error: RealtimeError
}

export interface RealtimeError {
  type: string
  code?: string
  message: string
  param?: string
  event_id?: string
}

export interface SessionCreatedEvent {
  type: 'session.created'
  session: {
    id: string
    object: 'realtime.session'
    model: string
    modalities: ('text' | 'audio')[]
    voice: string
    input_audio_format: string
    output_audio_format: string
  }
}

export interface SessionUpdatedEvent {
  type: 'session.updated'
  session: {
    id: string
    modalities: ('text' | 'audio')[]
  }
}

export interface InputAudioBufferSpeechStartedEvent {
  type: 'input_audio_buffer.speech_started'
  audio_start_ms: number
  item_id: string
}

export interface InputAudioBufferSpeechStoppedEvent {
  type: 'input_audio_buffer.speech_stopped'
  audio_end_ms: number
  item_id: string
}

export interface InputAudioBufferCommittedEvent {
  type: 'input_audio_buffer.committed'
  previous_item_id?: string
  item_id: string
}

export interface InputAudioBufferClearedEvent {
  type: 'input_audio_buffer.cleared'
}

export interface ConversationItemCreatedEvent {
  type: 'conversation.item.created'
  previous_item_id?: string
  item: ConversationItem
}

export interface ConversationItem {
  id?: string
  type: 'message' | 'function_call' | 'function_call_output'
  object?: 'realtime.item'
  status?: 'completed' | 'in_progress' | 'incomplete'
  role?: 'user' | 'assistant' | 'system'
  content?: ConversationItemContent[]
}

export interface ConversationItemContent {
  type: 'input_text' | 'input_audio' | 'text' | 'audio'
  text?: string
  audio?: string
  transcript?: string
}

export interface ConversationItemInputAudioTranscriptionCompletedEvent {
  type: 'conversation.item.input_audio_transcription.completed'
  item_id: string
  content_index: number
  transcript: string
}

export interface ConversationItemInputAudioTranscriptionFailedEvent {
  type: 'conversation.item.input_audio_transcription.failed'
  item_id: string
  content_index: number
  error: RealtimeError
}

export interface ResponseCreatedEvent {
  type: 'response.created'
  response: {
    id: string
    object: 'realtime.response'
    status: 'in_progress' | 'completed' | 'cancelled' | 'failed'
    output: ConversationItem[]
  }
}

export interface ResponseDoneEvent {
  type: 'response.done'
  response: {
    id: string
    object: 'realtime.response'
    status: 'completed' | 'cancelled' | 'failed' | 'incomplete'
    usage?: {
      total_tokens: number
      input_tokens: number
      output_tokens: number
    }
  }
}

export interface ResponseAudioDeltaEvent {
  type: 'response.audio.delta'
  response_id: string
  item_id: string
  output_index: number
  content_index: number
  /** Base64-encoded audio delta */
  delta: string
}

export interface ResponseAudioDoneEvent {
  type: 'response.audio.done'
  response_id: string
  item_id: string
  output_index: number
  content_index: number
}

export interface ResponseAudioTranscriptDeltaEvent {
  type: 'response.audio_transcript.delta'
  response_id: string
  item_id: string
  output_index: number
  content_index: number
  delta: string
}

export interface ResponseAudioTranscriptDoneEvent {
  type: 'response.audio_transcript.done'
  response_id: string
  item_id: string
  output_index: number
  content_index: number
  transcript: string
}

export interface ResponseTextDeltaEvent {
  type: 'response.text.delta'
  response_id: string
  item_id: string
  output_index: number
  content_index: number
  delta: string
}

export interface ResponseTextDoneEvent {
  type: 'response.text.done'
  response_id: string
  item_id: string
  output_index: number
  content_index: number
  text: string
}

export interface ResponseFunctionCallArgumentsDeltaEvent {
  type: 'response.function_call_arguments.delta'
  response_id: string
  item_id: string
  output_index: number
  call_id: string
  delta: string
}

export interface ResponseFunctionCallArgumentsDoneEvent {
  type: 'response.function_call_arguments.done'
  response_id: string
  item_id: string
  output_index: number
  call_id: string
  name: string
  arguments: string
}

export interface RateLimitsUpdatedEvent {
  type: 'rate_limits.updated'
  rate_limits: RateLimit[]
}

export interface RateLimit {
  name: string
  limit: number
  remaining: number
  reset_seconds: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Server Event Types (for type guards)
// ─────────────────────────────────────────────────────────────────────────────

export const REALTIME_SERVER_EVENTS = {
  Error: 'error',
  SessionCreated: 'session.created',
  SessionUpdated: 'session.updated',
  InputAudioBufferSpeechStarted: 'input_audio_buffer.speech_started',
  InputAudioBufferSpeechStopped: 'input_audio_buffer.speech_stopped',
  InputAudioBufferCommitted: 'input_audio_buffer.committed',
  InputAudioBufferCleared: 'input_audio_buffer.cleared',
  ConversationItemCreated: 'conversation.item.created',
  ConversationItemInputAudioTranscriptionCompleted: 'conversation.item.input_audio_transcription.completed',
  ConversationItemInputAudioTranscriptionFailed: 'conversation.item.input_audio_transcription.failed',
  ResponseCreated: 'response.created',
  ResponseDone: 'response.done',
  ResponseAudioDelta: 'response.audio.delta',
  ResponseAudioDone: 'response.audio.done',
  ResponseAudioTranscriptDelta: 'response.audio_transcript.delta',
  ResponseAudioTranscriptDone: 'response.audio_transcript.done',
  ResponseTextDelta: 'response.text.delta',
  ResponseTextDone: 'response.text.done',
  ResponseFunctionCallArgumentsDelta: 'response.function_call_arguments.delta',
  ResponseFunctionCallArgumentsDone: 'response.function_call_arguments.done',
  RateLimitsUpdated: 'rate_limits.updated',
} as const

export type RealtimeServerEventType = typeof REALTIME_SERVER_EVENTS[keyof typeof REALTIME_SERVER_EVENTS]

// ─────────────────────────────────────────────────────────────────────────────
// Client Event Types
// ─────────────────────────────────────────────────────────────────────────────

export const REALTIME_CLIENT_EVENTS = {
  SessionUpdate: 'session.update',
  InputAudioBufferAppend: 'input_audio_buffer.append',
  InputAudioBufferCommit: 'input_audio_buffer.commit',
  InputAudioBufferClear: 'input_audio_buffer.clear',
  ConversationItemCreate: 'conversation.item.create',
  ConversationItemTruncate: 'conversation.item.truncate',
  ConversationItemDelete: 'conversation.item.delete',
  ResponseCreate: 'response.create',
  ResponseCancel: 'response.cancel',
} as const

export type RealtimeClientEventType = typeof REALTIME_CLIENT_EVENTS[keyof typeof REALTIME_CLIENT_EVENTS]

// ─────────────────────────────────────────────────────────────────────────────
// Connection URLs
// ─────────────────────────────────────────────────────────────────────────────

/** Get OpenAI Realtime WebSocket URL */
export function getOpenAIRealtimeUrl(model: string = 'gpt-4o-realtime-preview'): string {
  return `wss://api.openai.com/v1/realtime?model=${model}`
}

/** Get Azure OpenAI Realtime WebSocket URL */
export function getAzureOpenAIRealtimeUrl(
  endpoint: string,
  deployment: string,
  apiVersion: string = '2024-10-01-preview'
): string {
  const baseUrl = endpoint.replace('https://', 'wss://')
  return `${baseUrl}/openai/realtime?deployment=${deployment}&api-version=${apiVersion}`
}

