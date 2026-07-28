/**
 * AssemblyAI v3 streaming declarations mirrored from the official Node SDK.
 *
 * Update this snapshot whenever `assemblyaiStreaming` changes, then run
 * `pnpm openapi:sync-assemblyai-streaming`.
 */

export type AudioEncoding = "pcm_s16le" | "pcm_mulaw" | "opus" | "ogg_opus" | "aac"

export type Channel = string | "unknown"

export type VadFrame = {
  ts: number
  channel: string
  active: boolean
  rms: number
}

export type VadDetectorResult = {
  active: boolean
  energy: number
}

export interface VadDetector {
  process(frame: Float32Array): VadDetectorResult
  reset(): void
}

export type ChannelAttributionParams = {
  dominanceRatio?: number
  timelineWindowMs?: number
  createVad?: (channelName: string) => VadDetector
  flushIntervalMs?: number
  resolveUnknownChannelsMethod?: "none" | "window" | "speaker-history"
  resolutionWindowWords?: number
  speakerHistoryMinRmsEvidence?: number
  speakerHistoryDominanceRatio?: number
}

export type LLMGatewayMessage = {
  role: string
  content: string
}

export type LLMGatewayConfig = {
  model: string
  messages: LLMGatewayMessage[]
  max_tokens: number
}

export type StreamingSpeechModel =
  | "universal-streaming-english"
  | "universal-streaming-multilingual"
  | "u3-rt-pro"
  | "u3-rt-pro-beta-1"
  | "whisper-rt"
  | "universal-3-5-pro"
  | "u3-pro"

export type StreamingDomain = "medical-v1"

export type StreamingMode = "max_accuracy" | "min_latency" | "balanced"

export type VoiceFocusModel = "near-field" | "far-field"

export type StreamingPiiSubstitution = "hash" | "entity_name"

export type StreamingPiiPolicy =
  | "account_number"
  | "banking_information"
  | "blood_type"
  | "corporate_action"
  | "credit_card_cvv"
  | "credit_card_expiration"
  | "credit_card_number"
  | "date"
  | "date_interval"
  | "date_of_birth"
  | "day"
  | "drivers_license"
  | "drug"
  | "duration"
  | "effect"
  | "email_address"
  | "event"
  | "filename"
  | "financial_metric"
  | "gender"
  | "gender_sexuality"
  | "healthcare_number"
  | "injury"
  | "ip_address"
  | "language"
  | "location"
  | "location_address"
  | "location_address_street"
  | "location_city"
  | "location_coordinate"
  | "location_country"
  | "location_state"
  | "location_zip"
  | "marital_status"
  | "medical_code"
  | "medical_condition"
  | "medical_process"
  | "money_amount"
  | "month"
  | "nationality"
  | "number_sequence"
  | "occupation"
  | "organization"
  | "organization_id"
  | "organization_medical_facility"
  | "passport_number"
  | "password"
  | "person_age"
  | "person_name"
  | "phone_number"
  | "physical_attribute"
  | "political_affiliation"
  | "product"
  | "project"
  | "religion"
  | "sexuality"
  | "statistics"
  | "time"
  | "trend"
  | "url"
  | "us_social_security_number"
  | "username"
  | "vehicle_id"
  | "year"
  | "zodiac_sign"

export type StreamingTranscriberParams = {
  websocketBaseUrl?: string
  apiKey?: string
  token?: string
  connectTimeout?: number
  maxConnectionRetries?: number
  connectionRetryDelay?: number
  sampleRate?: number
  encoding?: AudioEncoding
  endOfTurnConfidenceThreshold?: number
  /** @deprecated Use `minTurnSilence`. */
  minEndOfTurnSilenceWhenConfident?: number
  minTurnSilence?: number
  maxTurnSilence?: number
  vadThreshold?: number
  formatTurns?: boolean
  sessionHeartbeat?: boolean
  filterProfanity?: boolean
  keyterms?: string[]
  keytermsPrompt?: string[]
  prompt?: string
  agentContext?: string
  speechModel?: StreamingSpeechModel
  /** @deprecated Use `languageCodes`. */
  languageCode?: string
  languageCodes?: string[]
  languageDetection?: boolean
  domain?: StreamingDomain
  inactivityTimeout?: number
  speakerLabels?: boolean
  maxSpeakers?: number
  voiceFocus?: VoiceFocusModel
  voiceFocusThreshold?: number
  continuousPartials?: boolean
  interruptionDelay?: number
  turnLeftPadMs?: number
  customerSupportAudioCapture?: boolean
  includePartialTurns?: boolean
  redactPii?: boolean
  redactPiiPolicies?: StreamingPiiPolicy[]
  redactPiiSub?: StreamingPiiSubstitution
  mode?: StreamingMode
  llmGateway?: LLMGatewayConfig
  webhookUrl?: string
  webhookAuthHeaderName?: string
  webhookAuthHeaderValue?: string
  channels?: Array<{ name: string }>
  channelAttribution?: ChannelAttributionParams
}

export type StreamingEvents =
  | "open"
  | "close"
  | "turn"
  | "speechStarted"
  | "llmGatewayResponse"
  | "speakerRevision"
  | "warning"
  | "heartbeat"
  | "vad"
  | "error"

export type StreamingListeners = {
  open?: (event: BeginEvent) => void
  close?: (code: number, reason: string) => void
  turn?: (event: TurnEvent) => void
  speechStarted?: (event: SpeechStartedEvent) => void
  llmGatewayResponse?: (event: LLMGatewayResponseEvent) => void
  speakerRevision?: (event: SpeakerRevisionEvent) => void
  warning?: (event: WarningEvent) => void
  heartbeat?: (event: HeartbeatEvent) => void
  vad?: (event: VadFrame) => void
  error?: (error: Error) => void
}

export type StreamingTokenParams = {
  expires_in_seconds: number
  max_session_duration_seconds?: number
}

export type StreamingTemporaryTokenResponse = {
  token: string
}

export type StreamingAudioData = ArrayBufferLike

export type BeginEvent = {
  type: "Begin"
  id: string
  expires_at: number
}

export type SpeechStartedEvent = {
  type: "SpeechStarted"
  timestamp: number
}

export type TurnEvent = {
  type: "Turn"
  turn_order: number
  turn_is_formatted: boolean
  end_of_turn: boolean
  transcript: string
  end_of_turn_confidence: number
  words: StreamingWord[]
  language_code?: string
  language_confidence?: number
  speaker_label?: string
  channel?: Channel
}

export type StreamingWord = {
  start: number
  end: number
  confidence: number
  text: string
  word_is_final: boolean
  speaker?: string
  channel?: Channel
  channelResolved?: boolean
}

export type TerminationEvent = {
  type: "Termination"
  audio_duration_seconds: number
  session_duration_seconds: number
}

export type StreamingTerminateSession = {
  type: "Terminate"
}

export type StreamingUpdateConfiguration = {
  type: "UpdateConfiguration"
  end_of_turn_confidence_threshold?: number
  /** @deprecated Use `min_turn_silence`. */
  min_end_of_turn_silence_when_confident?: number
  min_turn_silence?: number
  max_turn_silence?: number
  vad_threshold?: number
  format_turns?: boolean
  session_heartbeat?: boolean
  keyterms_prompt?: string[]
  prompt?: string
  agent_context?: string
  filter_profanity?: boolean
  interruption_delay?: number
  turn_left_pad_ms?: number
  language_codes?: string[]
}

export type StreamingForceEndpoint = {
  type: "ForceEndpoint"
}

export type StreamingKeepAlive = {
  type: "KeepAlive"
}

export type ErrorEvent = {
  type: "Error"
  error_code?: number
  error: string
}

export type WarningEvent = {
  type: "Warning"
  warning_code: number
  warning: string
}

export type HeartbeatEvent = {
  type: "Heartbeat"
  total_audio_received_ms: number
  total_duration_ms: number
  realtime_factor: number
  max_speech_probability: number
}

export type LLMGatewayResponseEvent = {
  type: "LLMGatewayResponse"
  turn_order: number
  transcript: string
  data: unknown
}

export type SpeakerRevisionItem = {
  turn_order: number
  speaker_label?: string
  words: StreamingWord[]
}

export type SpeakerRevisionEvent = {
  type: "SpeakerRevision"
  revisions: SpeakerRevisionItem[]
}

export type StreamingEventMessage =
  | BeginEvent
  | TurnEvent
  | SpeechStartedEvent
  | TerminationEvent
  | LLMGatewayResponseEvent
  | SpeakerRevisionEvent
  | ErrorEvent
  | WarningEvent
  | HeartbeatEvent

export type StreamingOperationMessage =
  | StreamingUpdateConfiguration
  | StreamingForceEndpoint
  | StreamingKeepAlive
  | StreamingTerminateSession
