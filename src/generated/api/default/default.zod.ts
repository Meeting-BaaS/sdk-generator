/**
 * Generated by orval v7.9.0 🍺
 * Do not edit manually.
 * Meeting BaaS API
 * Meeting BaaS API
 * OpenAPI spec version: 1.1
 */
import { z as zod } from "zod"

/**
 * Have a bot join a meeting, now or in the future. You can provide a `webhook_url` parameter to receive webhook events specific to this bot, overriding your account's default webhook URL. Events include recording completion, failures, and transcription updates.
 * @summary Join
 */
export const joinBodyAutomaticLeaveNooneJoinedTimeoutMin = 0
export const joinBodyAutomaticLeaveWaitingRoomTimeoutMin = 0
export const joinBodyStartTimeMin = 0
export const joinBodyTranscriptionCustomParametersDefault = null

export const joinBody = zod.object({
  automatic_leave: zod
    .object({
      noone_joined_timeout: zod
        .number()
        .min(joinBodyAutomaticLeaveNooneJoinedTimeoutMin)
        .nullish()
        .describe(
          "The timeout in seconds for the bot to wait for participants to join before leaving the meeting, defaults to 600 seconds"
        ),
      waiting_room_timeout: zod
        .number()
        .min(joinBodyAutomaticLeaveWaitingRoomTimeoutMin)
        .nullish()
        .describe(
          "The timeout in seconds for the bot to wait in the waiting room before leaving the meeting, defaults to 600 seconds"
        )
    })
    .or(zod.null())
    .optional()
    .describe(
      "The bot will leave the meeting automatically after the timeout, defaults to 600 seconds."
    ),
  bot_image: zod
    .string()
    .url()
    .nullish()
    .describe("The image to use for the bot, must be a URL. Recommended ratio is 16:9."),
  bot_name: zod.string(),
  deduplication_key: zod
    .string()
    .nullish()
    .describe(
      "We prevent multiple bots with same API key joining a meeting within 5 mins, unless overridden by deduplication_key."
    ),
  entry_message: zod
    .string()
    .nullish()
    .describe(
      "There are no entry messages on Microsoft Teams as guests outside of an organization do not have access to the chat."
    ),
  extra: zod.record(zod.string(), zod.any()).optional().describe("Custom data object"),
  meeting_url: zod.string(),
  recording_mode: zod
    .enum(["speaker_view"])
    .describe("Records the active speaker view")
    .or(
      zod.enum(["gallery_view"]).describe("Records the gallery view showing multiple participants")
    )
    .or(zod.enum(["audio_only"]).describe("Records only the audio from the meeting"))
    .describe("Recording mode for the bot")
    .or(zod.null())
    .optional()
    .describe("The recording mode for the bot, defaults to 'speaker_view'."),
  reserved: zod
    .boolean()
    .describe(
      "Whether or not the bot should come from the available pool of bots or be a dedicated bot. Reserved bots come in exactly 4 minutes after the request."
    ),
  speech_to_text: zod
    .object({
      api_key: zod.string().nullish(),
      provider: zod.enum(["Gladia", "Runpod", "Default"])
    })
    .or(zod.enum(["Gladia", "Runpod", "Default"]))
    .or(zod.null())
    .optional()
    .describe("The default speech to text provider is Gladia."),
  start_time: zod
    .number()
    .min(joinBodyStartTimeMin)
    .nullish()
    .describe(
      "Unix timestamp (in milliseconds) for when the bot should join the meeting. The bot joins 4 minutes before the start time."
    ),
  streaming: zod
    .object({
      audio_frequency: zod.enum(["16khz", "24khz"]).or(zod.null()).optional(),
      input: zod.string().nullish(),
      output: zod.string().nullish()
    })
    .or(zod.null())
    .optional()
    .describe(
      "WebSocket streams for 16 kHz audio. Input stream receives audio sent to the bot. Output stream receives audio from the bot."
    ),
  transcription_custom_parameters: zod
    .any()
    .optional()
    .describe("For your own transcription parameters"),
  webhook_url: zod
    .string()
    .nullish()
    .describe(
      "A webhook URL to send events to, overrides the webhook URL set in your account settings."
    ),
  zoom_sdk_id: zod
    .string()
    .nullish()
    .describe("For the Own Zoom Credentials feature, we need your zoom sdk id."),
  zoom_sdk_pwd: zod
    .string()
    .nullish()
    .describe("For the Own Zoom Credentials feature, we need your zoom sdk pwd.")
})

export const joinResponse = zod.object({
  bot_id: zod.string().uuid()
})

/**
 * Leave
 * @summary Leave
 */
export const leaveParams = zod.object({
  uuid: zod.string().describe("The UUID identifier")
})

export const leaveResponse = zod.object({
  ok: zod.boolean()
})

/**
 * Get meeting recording and metadata
 * @summary Get Meeting Data
 */
export const getMeetingDataQueryIncludeTranscriptsDefault = true

export const getMeetingDataQueryParams = zod.object({
  bot_id: zod.string(),
  include_transcripts: zod
    .boolean()
    .default(getMeetingDataQueryIncludeTranscriptsDefault)
    .describe(
      "Whether to include transcription data in the response. Defaults to true if not specified."
    )
})

export const getMeetingDataResponse = zod.object({
  bot_data: zod.object({
    bot: zod.object({
      account_id: zod.number(),
      bot_image: zod.string().nullish(),
      bot_name: zod.string(),
      bot_param_id: zod.number(),
      created_at: zod.string().datetime({}),
      deduplication_key: zod.string().nullish(),
      diarization_fails: zod.number().nullish(),
      diarization_v2: zod.boolean(),
      ended_at: zod.string().datetime({}).nullable(),
      enter_message: zod.string().nullish(),
      errors: zod.string().nullish(),
      event_id: zod.number().nullish(),
      extra: zod.record(zod.string(), zod.any()).describe("Custom data object"),
      id: zod.number(),
      meeting_url: zod.string(),
      mp4_s3_path: zod.string(),
      noone_joined_timeout: zod.number().nullish(),
      recording_mode: zod
        .enum(["speaker_view"])
        .describe("Records the active speaker view")
        .or(
          zod
            .enum(["gallery_view"])
            .describe("Records the gallery view showing multiple participants")
        )
        .or(zod.enum(["audio_only"]).describe("Records only the audio from the meeting"))
        .describe("Recording mode for the bot")
        .or(zod.null())
        .optional(),
      reserved: zod.boolean(),
      scheduled_bot_id: zod.number().nullish(),
      session_id: zod.string().nullish(),
      speech_to_text_api_key: zod.string().nullish(),
      speech_to_text_provider: zod.enum(["Gladia", "Runpod", "Default"]).or(zod.null()).optional(),
      streaming_audio_frequency: zod.enum(["16khz", "24khz"]).or(zod.null()).optional(),
      streaming_input: zod.string().nullish(),
      streaming_output: zod.string().nullish(),
      transcription_custom_parameters: zod
        .record(zod.string(), zod.any())
        .describe("Custom data object"),
      transcription_fails: zod.number().nullish(),
      transcription_payloads: zod.any().optional(),
      user_reported_error: zod.any().optional(),
      uuid: zod.string().uuid(),
      waiting_room_timeout: zod.number().nullish(),
      webhook_url: zod.string(),
      zoom_sdk_id: zod.string().nullish(),
      zoom_sdk_pwd: zod.string().nullish()
    }),
    transcripts: zod.array(
      zod.object({
        bot_id: zod.number(),
        end_time: zod.number().nullish(),
        id: zod.number(),
        lang: zod.string().nullish(),
        speaker: zod.string(),
        start_time: zod.number(),
        user_id: zod.number().nullish(),
        words: zod.array(
          zod.object({
            bot_id: zod.number(),
            end_time: zod.number(),
            id: zod.number(),
            start_time: zod.number(),
            text: zod.string(),
            user_id: zod.number().nullish()
          })
        )
      })
    )
  }),
  duration: zod.number().describe("Duration of the recording in seconds"),
  mp4: zod
    .string()
    .describe(
      "URL to access the recording MP4 file. Will be an empty string if the file doesn't exist in S3."
    )
})

/**
 * Deletes a bot's data including recording, transcription, and logs. Only metadata is retained. Rate limited to 5 requests per minute per API key.
 * @summary Delete Data
 */
export const deleteDataParams = zod.object({
  uuid: zod.string().describe("The UUID identifier")
})

export const deleteDataResponse = zod.object({
  ok: zod.boolean().describe("Whether the request was processed successfully"),
  status: zod
    .enum(["deleted"])
    .describe("All data was successfully deleted")
    .or(
      zod
        .enum(["partiallyDeleted"])
        .describe("Some data was deleted, but other parts couldn't be removed")
    )
    .or(
      zod
        .enum(["alreadyDeleted"])
        .describe("No data needed to be deleted as it was already removed")
    )
    .or(zod.enum(["noDataFound"]).describe("No data was found for the specified bot"))
})

/**
 * Retrieves a paginated list of the user's bots with essential metadata, including IDs, names, and meeting details. Supports filtering, sorting, and advanced querying options.
 * @summary List Bots with Metadata
 */
export const botsWithMetadataQueryLimitDefault = 10

export const botsWithMetadataQueryParams = zod.object({
  bot_name: zod
    .string()
    .nullish()
    .describe(
      'Filter bots by name containing this string.\n\nPerforms a case-insensitive partial match on the bot\'s name. Useful for finding bots with specific naming conventions or to locate a particular bot when you don\'t have its ID.\n\nExample: \"Sales\" would match \"Sales Meeting\", \"Quarterly Sales\", etc.'
    ),
  created_after: zod
    .string()
    .nullish()
    .describe(
      'Filter bots created after this date (ISO format).\n\nLimits results to bots created at or after the specified timestamp. Used for time-based filtering to find recent additions.\n\nFormat: ISO-8601 date-time string (YYYY-MM-DDThh:mm:ss) Example: \"2023-05-01T00:00:00\"'
    ),
  created_before: zod
    .string()
    .nullish()
    .describe(
      'Filter bots created before this date (ISO format).\n\nLimits results to bots created at or before the specified timestamp. Used for time-based filtering to exclude recent additions.\n\nFormat: ISO-8601 date-time string (YYYY-MM-DDThh:mm:ss) Example: \"2023-05-31T23:59:59\"'
    ),
  cursor: zod
    .string()
    .nullish()
    .describe(
      "Cursor for pagination, obtained from previous response.\n\nUsed for retrieving the next set of results after a previous call. The cursor value is returned in the `nextCursor` field of responses that have additional results available.\n\nFormat: Base64-encoded string containing pagination metadata"
    ),
  ended_after: zod
    .string()
    .nullish()
    .describe(
      'Filter bots ended after this date (ISO format).\n\nLimits results to bots that ended at or after the specified timestamp. Useful for finding completed meetings within a specific time period.\n\nFormat: ISO-8601 date-time string (YYYY-MM-DDThh:mm:ss) Example: \"2023-05-01T00:00:00\"'
    ),
  filter_by_extra: zod
    .string()
    .nullish()
    .describe(
      'Filter bots by matching values in the extra JSON payload.\n\nThis parameter performs in-memory filtering on the `extra` JSON field, similar to a SQL WHERE clause. It reduces the result set to only include bots that match all specified conditions.\n\nFormat specifications: - Single condition: \"field:value\" - Multiple conditions: \"field1:value1,field2:value2\"\n\nExamples: - \"customer_id:12345\" - Only bots with this customer ID - \"status:active,project:sales\" - Only active bots from sales projects\n\nNotes: - All conditions must match for a bot to be included - Values are matched exactly (case-sensitive) - Bots without the specified field are excluded'
    ),
  limit: zod
    .number()
    .default(botsWithMetadataQueryLimitDefault)
    .describe(
      "Maximum number of bots to return in a single request.\n\nLimits the number of results returned in a single API call. This parameter helps control response size and page length.\n\nDefault: 10 Minimum: 1 Maximum: 50"
    ),
  meeting_url: zod
    .string()
    .nullish()
    .describe(
      'Filter bots by meeting URL containing this string.\n\nPerforms a case-insensitive partial match on the bot\'s meeting URL. Use this to find bots associated with specific meeting platforms or particular meeting IDs.\n\nExample: \"zoom.us\" would match all Zoom meetings'
    ),
  sort_by_extra: zod
    .string()
    .nullish()
    .describe(
      'Sort the results by a field in the extra JSON payload.\n\nThis parameter performs in-memory sorting on the `extra` JSON field, similar to a SQL ORDER BY clause. It changes the order of results but not which results are included.\n\nFormat specifications: - Default (ascending): \"field\" - Explicit direction: \"field:asc\" or \"field:desc\"\n\nExamples: - \"customer_id\" - Sort by customer_id (ascending) - \"priority:desc\" - Sort by priority (descending)\n\nNotes: - Applied after all filtering - String comparison is used for sorting - Bots with the field come before bots without it - Can be combined with filter_by_extra'
    ),
  speaker_name: zod
    .string()
    .nullish()
    .describe(
      'NOTE: this is a preview feature and not yet available\n\nFilter bots by speaker name containing this string.\n\nPerforms a case-insensitive partial match on the speakers in the meeting. Useful for finding meetings that included a specific person.\n\nExample: \"John\" would match meetings with speakers like \"John Smith\" or \"John Doe\"'
    )
})

export const botsWithMetadataResponseLastUpdatedDefault = "2025-01-01T00:00:00.000000000+00:00"

export const botsWithMetadataResponse = zod
  .object({
    bots: zod
      .array(
        zod
          .object({
            access_count: zod
              .number()
              .nullish()
              .describe("Number of times this bot data has been accessed (if tracked)"),
            bot_name: zod.string().describe("Name of the bot"),
            created_at: zod.string().describe("Creation timestamp of the bot in ISO-8601 format"),
            duration: zod
              .number()
              .nullish()
              .describe("Duration of the bot session in seconds (if completed)"),
            ended_at: zod
              .string()
              .nullish()
              .describe("End time of the bot session (if completed) in ISO-8601 format"),
            extra: zod.record(zod.string(), zod.any()).describe("Custom data object"),
            id: zod
              .number()
              .describe(
                "Unique identifier of the bot (legacy field)\n\nThis field is maintained for backwards compatibility. It is serialized as a UUID string to match the old API format. New clients should use the uuid field instead."
              ),
            last_accessed_at: zod
              .string()
              .nullish()
              .describe("Last time this bot data was accessed (if available)"),
            meeting_url: zod.string().describe("URL of the meeting the bot joined"),
            session_id: zod.string().nullish().describe("Session ID if the bot is active"),
            speakers: zod
              .array(zod.string())
              .describe("List of unique speaker names from the bot's transcripts"),
            uuid: zod
              .string()
              .uuid()
              .describe(
                "Unique identifier of the bot (new field)\n\nThis is the preferred field to use for bot identification. The id field is maintained for backwards compatibility."
              )
          })
          .describe("Entry for a recent bot in the list response")
      )
      .describe(
        'List of recent bots with their metadata\n\nThis field is serialized as both \"bots\" and \"recent_bots\" for backwards compatibility. New clients should use the \"bots\" field name.'
      ),
    last_updated: zod
      .string()
      .datetime({})
      .default(botsWithMetadataResponseLastUpdatedDefault)
      .describe(
        "Timestamp of when this data was generated (in ISO-8601 format)\n\nThis field is maintained for backwards compatibility. It is automatically set to the current time when the response is created."
      ),
    next_cursor: zod.string().nullish().describe("Optional cursor for pagination")
  })
  .describe("Response for listing recent bots")

/**
 * Transcribe or retranscribe a bot's audio using the Default or your provided Speech to Text Provider
 * @summary Retranscribe Bot
 */
export const retranscribeBotBody = zod.object({
  bot_uuid: zod.string(),
  speech_to_text: zod
    .object({
      api_key: zod.string().nullish(),
      provider: zod.enum(["Gladia", "Runpod", "Default"])
    })
    .or(zod.enum(["Gladia", "Runpod", "Default"]))
    .or(zod.null())
    .optional(),
  webhook_url: zod.string().nullish()
})

/**
 * Retrieves screenshots captured during the bot's session
 * @summary Get Screenshots
 */
export const getScreenshotsParams = zod.object({
  uuid: zod.string().describe("The UUID identifier")
})

export const getScreenshotsResponseItem = zod
  .object({
    date: zod.string(),
    url: zod.string()
  })
  .describe("Schema-compatible wrapper for the Screenshot struct")
export const getScreenshotsResponse = zod.array(getScreenshotsResponseItem)
