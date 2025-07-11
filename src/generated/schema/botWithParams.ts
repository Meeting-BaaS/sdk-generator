/**
 * Generated by orval v7.9.0 🍺
 * Do not edit manually.
 * Meeting BaaS API
 * Meeting BaaS API
 * OpenAPI spec version: 1.1
 */
import type { BotWithParamsBotImage } from "./botWithParamsBotImage"
import type { BotWithParamsDeduplicationKey } from "./botWithParamsDeduplicationKey"
import type { BotWithParamsDiarizationFails } from "./botWithParamsDiarizationFails"
import type { BotWithParamsEnterMessage } from "./botWithParamsEnterMessage"
import type { BotWithParamsErrors } from "./botWithParamsErrors"
import type { BotWithParamsEventId } from "./botWithParamsEventId"
import type { BotWithParamsNooneJoinedTimeout } from "./botWithParamsNooneJoinedTimeout"
import type { BotWithParamsRecordingMode } from "./botWithParamsRecordingMode"
import type { BotWithParamsScheduledBotId } from "./botWithParamsScheduledBotId"
import type { BotWithParamsSessionId } from "./botWithParamsSessionId"
import type { BotWithParamsSpeechToTextApiKey } from "./botWithParamsSpeechToTextApiKey"
import type { BotWithParamsSpeechToTextProvider } from "./botWithParamsSpeechToTextProvider"
import type { BotWithParamsStreamingAudioFrequency } from "./botWithParamsStreamingAudioFrequency"
import type { BotWithParamsStreamingInput } from "./botWithParamsStreamingInput"
import type { BotWithParamsStreamingOutput } from "./botWithParamsStreamingOutput"
import type { BotWithParamsTranscriptionFails } from "./botWithParamsTranscriptionFails"
import type { BotWithParamsWaitingRoomTimeout } from "./botWithParamsWaitingRoomTimeout"
import type { BotWithParamsZoomSdkId } from "./botWithParamsZoomSdkId"
import type { BotWithParamsZoomSdkPwd } from "./botWithParamsZoomSdkPwd"
import type { DateTime } from "./dateTime"
import type { Extra } from "./extra"
import type { OptionalDateTime } from "./optionalDateTime"

export interface BotWithParams {
  account_id: number
  bot_image?: BotWithParamsBotImage
  bot_name: string
  bot_param_id: number
  created_at: DateTime
  deduplication_key?: BotWithParamsDeduplicationKey
  diarization_fails?: BotWithParamsDiarizationFails
  diarization_v2: boolean
  ended_at: OptionalDateTime
  enter_message?: BotWithParamsEnterMessage
  errors?: BotWithParamsErrors
  event_id?: BotWithParamsEventId
  extra: Extra
  id: number
  meeting_url: string
  mp4_s3_path: string
  noone_joined_timeout?: BotWithParamsNooneJoinedTimeout
  recording_mode?: BotWithParamsRecordingMode
  reserved: boolean
  scheduled_bot_id?: BotWithParamsScheduledBotId
  session_id?: BotWithParamsSessionId
  speech_to_text_api_key?: BotWithParamsSpeechToTextApiKey
  speech_to_text_provider?: BotWithParamsSpeechToTextProvider
  streaming_audio_frequency?: BotWithParamsStreamingAudioFrequency
  streaming_input?: BotWithParamsStreamingInput
  streaming_output?: BotWithParamsStreamingOutput
  transcription_custom_parameters: Extra
  transcription_fails?: BotWithParamsTranscriptionFails
  transcription_payloads?: unknown
  user_reported_error?: unknown
  uuid: string
  waiting_room_timeout?: BotWithParamsWaitingRoomTimeout
  webhook_url: string
  zoom_sdk_id?: BotWithParamsZoomSdkId
  zoom_sdk_pwd?: BotWithParamsZoomSdkPwd
}
