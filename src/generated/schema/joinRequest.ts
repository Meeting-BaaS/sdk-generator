/**
 * Generated by orval v7.9.0 🍺
 * Do not edit manually.
 * Meeting BaaS API
 * Meeting BaaS API
 * OpenAPI spec version: 1.1
 */

import type { Extra } from "./extra"
import type { JoinRequestAutomaticLeave } from "./joinRequestAutomaticLeave"
import type { JoinRequestBotImage } from "./joinRequestBotImage"
import type { JoinRequestDeduplicationKey } from "./joinRequestDeduplicationKey"
import type { JoinRequestEntryMessage } from "./joinRequestEntryMessage"
import type { JoinRequestRecordingMode } from "./joinRequestRecordingMode"
import type { JoinRequestSpeechToText } from "./joinRequestSpeechToText"
import type { JoinRequestStartTime } from "./joinRequestStartTime"
import type { JoinRequestStreaming } from "./joinRequestStreaming"
import type { JoinRequestWebhookUrl } from "./joinRequestWebhookUrl"
import type { JoinRequestZoomSdkId } from "./joinRequestZoomSdkId"
import type { JoinRequestZoomSdkPwd } from "./joinRequestZoomSdkPwd"

export interface JoinRequest {
  /** The bot will leave the meeting automatically after the timeout, defaults to 600 seconds. */
  automatic_leave?: JoinRequestAutomaticLeave
  /** The image to use for the bot, must be a URL. Recommended ratio is 16:9. */
  bot_image?: JoinRequestBotImage
  bot_name: string
  /** We prevent multiple bots with same API key joining a meeting within 5 mins, unless overridden by deduplication_key. */
  deduplication_key?: JoinRequestDeduplicationKey
  /** There are no entry messages on Microsoft Teams as guests outside of an organization do not have access to the chat. */
  entry_message?: JoinRequestEntryMessage
  /** A JSON object that allows you to add custom data to a bot for your convenience, e.g. your end user's ID. */
  extra?: Extra
  meeting_url: string
  /** The recording mode for the bot, defaults to 'speaker_view'. */
  recording_mode?: JoinRequestRecordingMode
  /** Whether or not the bot should come from the available pool of bots or be a dedicated bot. Reserved bots come in exactly 4 minutes after the request. */
  reserved: boolean
  /** The default speech to text provider is Gladia. */
  speech_to_text?: JoinRequestSpeechToText
  /**
   * Unix timestamp (in milliseconds) for when the bot should join the meeting. The bot joins 4 minutes before the start time.
   * @minimum 0
   */
  start_time?: JoinRequestStartTime
  /** WebSocket streams for 16 kHz audio. Input stream receives audio sent to the bot. Output stream receives audio from the bot. */
  streaming?: JoinRequestStreaming
  /** For your own transcription parameters */
  transcription_custom_parameters?: unknown
  /** A webhook URL to send events to, overrides the webhook URL set in your account settings. */
  webhook_url?: JoinRequestWebhookUrl
  /** For the Own Zoom Credentials feature, we need your zoom sdk id. */
  zoom_sdk_id?: JoinRequestZoomSdkId
  /** For the Own Zoom Credentials feature, we need your zoom sdk pwd. */
  zoom_sdk_pwd?: JoinRequestZoomSdkPwd
  [key: string]: unknown
}
