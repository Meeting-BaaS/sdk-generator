/**
 * Generated by orval v7.9.0 🍺
 * Do not edit manually.
 * Meeting BaaS API
 * Meeting BaaS API
 * OpenAPI spec version: 1.1
 */
import { z as zod } from "zod"

/**
 * Forces a sync of all your connected calendars with their providers (Google, Microsoft).

Processes each calendar individually and returns:
- `synced_calendars`: UUIDs of successfully synced calendars
- `errors`: Details of any failures

Sends webhook notifications for calendars with updates.
 * @summary Resync All Calendars
 */
export const resyncAllResponseErrorsItemMin = 2

export const resyncAllResponseErrorsItemMax = 2

export const resyncAllResponse = zod.object({
  errors: zod
    .array(
      zod
        .array(zod.record(zod.string(), zod.any()))
        .min(resyncAllResponseErrorsItemMin)
        .max(resyncAllResponseErrorsItemMax)
    )
    .describe("List of calendar UUIDs that failed to resync, with error messages"),
  synced_calendars: zod
    .array(zod.string().uuid())
    .describe("List of calendar UUIDs that were successfully resynced")
})

/**
 * Retrieves unprocessed calendar data directly from the provider (Google, Microsoft) using provided OAuth credentials. This endpoint is typically used during the initial setup process to allow users to select which calendars to integrate. Returns a list of available calendars with their unique IDs, email addresses, and primary status. This data is not persisted until a calendar is formally created using the create_calendar endpoint.
 * @summary List Raw Calendars
 */
export const listRawCalendarsBody = zod.object({
  oauth_client_id: zod.string(),
  oauth_client_secret: zod.string(),
  oauth_refresh_token: zod.string(),
  platform: zod
    .enum(["Google", "Microsoft"])
    .describe(
      'Fields with value `\"simple\"` parse as `Kind::Simple`. Fields with value `\"fancy\"` parse as `Kind::SoFancy`.'
    )
})

export const listRawCalendarsResponse = zod.object({
  calendars: zod.array(
    zod.object({
      email: zod.string(),
      id: zod.string(),
      is_primary: zod.boolean()
    })
  )
})

/**
 * Retrieves all calendars that have been integrated with the system for the authenticated user. Returns a list of calendars with their names, email addresses, provider information, and sync status. This endpoint shows only calendars that have been formally connected through the create_calendar endpoint, not all available calendars from the provider.
 * @summary List Calendars
 */
export const listCalendarsResponseItem = zod.object({
  email: zod.string(),
  google_id: zod.string(),
  name: zod.string(),
  resource_id: zod.string().nullish(),
  uuid: zod.string().uuid()
})
export const listCalendarsResponse = zod.array(listCalendarsResponseItem)

/**
 * Integrates a new calendar with the system using OAuth credentials. This endpoint establishes a connection with the calendar provider (Google, Microsoft), sets up webhook notifications for real-time updates, and performs an initial sync of all calendar events. It requires OAuth credentials (client ID, client secret, and refresh token) and the platform type. Once created, the calendar is assigned a unique UUID that should be used for all subsequent operations. Returns the newly created calendar object with all integration details.
 * @summary Create Calendar
 */
export const createCalendarBody = zod.object({
  oauth_client_id: zod.string(),
  oauth_client_secret: zod.string(),
  oauth_refresh_token: zod.string(),
  platform: zod
    .enum(["Google", "Microsoft"])
    .describe(
      'Fields with value `\"simple\"` parse as `Kind::Simple`. Fields with value `\"fancy\"` parse as `Kind::SoFancy`.'
    ),
  raw_calendar_id: zod.string().nullish()
})

export const createCalendarResponse = zod.object({
  calendar: zod.object({
    email: zod.string(),
    google_id: zod.string(),
    name: zod.string(),
    resource_id: zod.string().nullish(),
    uuid: zod.string().uuid()
  })
})

/**
 * Retrieves detailed information about a specific calendar integration by its UUID. Returns comprehensive calendar data including the calendar name, email address, provider details (Google, Microsoft), sync status, and other metadata. This endpoint is useful for displaying calendar information to users or verifying the status of a calendar integration before performing operations on its events.
 * @summary Get Calendar
 */
export const getCalendarParams = zod.object({
  uuid: zod.string().describe("The UUID identifier")
})

export const getCalendarResponse = zod.object({
  email: zod.string(),
  google_id: zod.string(),
  name: zod.string(),
  resource_id: zod.string().nullish(),
  uuid: zod.string().uuid()
})

/**
 * Permanently removes a calendar integration by its UUID, including all associated events and bot configurations. This operation cancels any active subscriptions with the calendar provider, stops all webhook notifications, and unschedules any pending recordings. All related resources are cleaned up in the database. This action cannot be undone, and subsequent requests to this calendar's UUID will return 404 Not Found errors.
 * @summary Delete Calendar
 */
export const deleteCalendarParams = zod.object({
  uuid: zod.string().describe("The UUID identifier")
})

/**
 * Updates a calendar integration with new credentials or platform while maintaining the same UUID. This operation is performed as an atomic transaction to ensure data integrity. The system automatically unschedules existing bots to prevent duplicates, updates the calendar credentials, and triggers a full resync of all events. Useful when OAuth tokens need to be refreshed or when migrating a calendar between providers. Returns the updated calendar object with its new configuration.
 * @summary Update Calendar
 */
export const updateCalendarParams = zod.object({
  uuid: zod.string().describe("The UUID identifier")
})

export const updateCalendarBody = zod.object({
  oauth_client_id: zod.string(),
  oauth_client_secret: zod.string(),
  oauth_refresh_token: zod.string(),
  platform: zod
    .enum(["Google", "Microsoft"])
    .describe(
      'Fields with value `\"simple\"` parse as `Kind::Simple`. Fields with value `\"fancy\"` parse as `Kind::SoFancy`.'
    )
})

export const updateCalendarResponse = zod.object({
  calendar: zod.object({
    email: zod.string(),
    google_id: zod.string(),
    name: zod.string(),
    resource_id: zod.string().nullish(),
    uuid: zod.string().uuid()
  })
})

/**
 * Retrieves comprehensive details about a specific calendar event by its UUID. Returns complete event information including title, meeting link, start and end times, organizer status, recurrence information, and the full list of attendees with their names and email addresses. Also includes any associated bot parameters if recording is scheduled for this event. The raw calendar data from the provider is also included for advanced use cases.
 * @summary Get Event
 */
export const getEventParams = zod.object({
  uuid: zod.string().describe("The UUID identifier")
})

export const getEventResponse = zod.object({
  attendees: zod.array(
    zod.object({
      email: zod.string().describe("The email address of the meeting attendee"),
      name: zod
        .string()
        .nullish()
        .describe(
          "The display name of the attendee if available from the calendar provider (Google, Microsoft)"
        )
    })
  ),
  bot_param: zod
    .object({
      bot_image: zod.string().nullish(),
      bot_name: zod.string(),
      deduplication_key: zod.string().nullish(),
      enter_message: zod.string().nullish(),
      extra: zod.record(zod.string(), zod.any()).describe("Custom data object"),
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
      speech_to_text_api_key: zod.string().nullish(),
      speech_to_text_provider: zod.enum(["Gladia", "Runpod", "Default"]).or(zod.null()).optional(),
      streaming_audio_frequency: zod.enum(["16khz", "24khz"]).or(zod.null()).optional(),
      streaming_input: zod.string().nullish(),
      streaming_output: zod.string().nullish(),
      transcription_custom_parameters: zod
        .record(zod.string(), zod.any())
        .describe("Custom data object"),
      waiting_room_timeout: zod.number().nullish(),
      webhook_url: zod.string(),
      zoom_sdk_id: zod.string().nullish(),
      zoom_sdk_pwd: zod.string().nullish()
    })
    .or(zod.null())
    .optional()
    .describe("Associated bot parameters if a bot is scheduled for this event"),
  calendar_uuid: zod.string().uuid(),
  deleted: zod.boolean().describe("Indicates whether this event has been deleted"),
  end_time: zod.string().datetime({}).describe("The end time of the event in UTC timezone"),
  google_id: zod
    .string()
    .describe("The unique identifier of the event from the calendar provider (Google, Microsoft)"),
  is_organizer: zod
    .boolean()
    .describe("Indicates whether the current user is the organizer of this event"),
  is_recurring: zod
    .boolean()
    .describe("Indicates whether this event is part of a recurring series"),
  last_updated_at: zod
    .string()
    .datetime({})
    .describe("The timestamp when this event was last updated"),
  meeting_url: zod.string().describe("The URL that can be used to join the meeting (if available)"),
  name: zod.string().describe("The title/name of the calendar event"),
  raw: zod.record(zod.string(), zod.any()).describe("Custom data object"),
  recurring_event_id: zod
    .string()
    .nullish()
    .describe("For recurring events, the ID of the parent recurring event series (if applicable)"),
  start_time: zod.string().datetime({}).describe("The start time of the event in UTC timezone"),
  uuid: zod.string().uuid()
})

/**
 * Configures a bot to automatically join and record a specific calendar event at its scheduled time. The request body contains detailed bot configuration, including recording options, streaming settings, and webhook notification URLs. For recurring events, the 'all_occurrences' parameter can be set to true to schedule recording for all instances of the recurring series, or false (default) to schedule only the specific instance. Returns the updated event(s) with the bot parameters attached.
 * @summary Schedule Record Event
 */
export const scheduleRecordEventParams = zod.object({
  uuid: zod.string().describe("The UUID identifier")
})

export const scheduleRecordEventQueryParams = zod.object({
  all_occurrences: zod
    .boolean()
    .nullish()
    .describe("schedule a bot to all occurences of a recurring event")
})

export const scheduleRecordEventBody = zod.object({
  bot_image: zod.string().nullish(),
  bot_name: zod.string(),
  deduplication_key: zod.string().nullish(),
  enter_message: zod.string().nullish(),
  extra: zod.record(zod.string(), zod.any()).describe("Custom data object"),
  noone_joined_timeout: zod.number().nullish(),
  recording_mode: zod
    .enum(["speaker_view"])
    .describe("Records the active speaker view")
    .or(
      zod.enum(["gallery_view"]).describe("Records the gallery view showing multiple participants")
    )
    .or(zod.enum(["audio_only"]).describe("Records only the audio from the meeting"))
    .describe("Recording mode for the bot")
    .or(zod.null())
    .optional(),
  speech_to_text: zod
    .object({
      api_key: zod.string().nullish(),
      provider: zod.enum(["Gladia", "Runpod", "Default"])
    })
    .or(zod.enum(["Gladia", "Runpod", "Default"]))
    .or(zod.null())
    .optional(),
  streaming_audio_frequency: zod.enum(["16khz", "24khz"]).or(zod.null()).optional(),
  streaming_input: zod.string().nullish(),
  streaming_output: zod.string().nullish(),
  transcription_custom_parameters: zod
    .record(zod.string(), zod.any())
    .optional()
    .describe("Custom data object"),
  waiting_room_timeout: zod.number().nullish(),
  webhook_url: zod.string().nullish(),
  zoom_sdk_id: zod.string().nullish(),
  zoom_sdk_pwd: zod.string().nullish()
})

export const scheduleRecordEventResponseItem = zod.object({
  attendees: zod.array(
    zod.object({
      email: zod.string().describe("The email address of the meeting attendee"),
      name: zod
        .string()
        .nullish()
        .describe(
          "The display name of the attendee if available from the calendar provider (Google, Microsoft)"
        )
    })
  ),
  bot_param: zod
    .object({
      bot_image: zod.string().nullish(),
      bot_name: zod.string(),
      deduplication_key: zod.string().nullish(),
      enter_message: zod.string().nullish(),
      extra: zod.record(zod.string(), zod.any()).describe("Custom data object"),
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
      speech_to_text_api_key: zod.string().nullish(),
      speech_to_text_provider: zod.enum(["Gladia", "Runpod", "Default"]).or(zod.null()).optional(),
      streaming_audio_frequency: zod.enum(["16khz", "24khz"]).or(zod.null()).optional(),
      streaming_input: zod.string().nullish(),
      streaming_output: zod.string().nullish(),
      transcription_custom_parameters: zod
        .record(zod.string(), zod.any())
        .describe("Custom data object"),
      waiting_room_timeout: zod.number().nullish(),
      webhook_url: zod.string(),
      zoom_sdk_id: zod.string().nullish(),
      zoom_sdk_pwd: zod.string().nullish()
    })
    .or(zod.null())
    .optional()
    .describe("Associated bot parameters if a bot is scheduled for this event"),
  calendar_uuid: zod.string().uuid(),
  deleted: zod.boolean().describe("Indicates whether this event has been deleted"),
  end_time: zod.string().datetime({}).describe("The end time of the event in UTC timezone"),
  google_id: zod
    .string()
    .describe("The unique identifier of the event from the calendar provider (Google, Microsoft)"),
  is_organizer: zod
    .boolean()
    .describe("Indicates whether the current user is the organizer of this event"),
  is_recurring: zod
    .boolean()
    .describe("Indicates whether this event is part of a recurring series"),
  last_updated_at: zod
    .string()
    .datetime({})
    .describe("The timestamp when this event was last updated"),
  meeting_url: zod.string().describe("The URL that can be used to join the meeting (if available)"),
  name: zod.string().describe("The title/name of the calendar event"),
  raw: zod.record(zod.string(), zod.any()).describe("Custom data object"),
  recurring_event_id: zod
    .string()
    .nullish()
    .describe("For recurring events, the ID of the parent recurring event series (if applicable)"),
  start_time: zod.string().datetime({}).describe("The start time of the event in UTC timezone"),
  uuid: zod.string().uuid()
})
export const scheduleRecordEventResponse = zod.array(scheduleRecordEventResponseItem)

/**
 * Cancels a previously scheduled recording for a calendar event and releases associated bot resources. For recurring events, the 'all_occurrences' parameter controls whether to unschedule from all instances of the recurring series or just the specific occurrence. This operation is idempotent and will not error if no bot was scheduled. Returns the updated event(s) with the bot parameters removed.
 * @summary Unschedule Record Event
 */
export const unscheduleRecordEventParams = zod.object({
  uuid: zod.string().describe("The UUID identifier")
})

export const unscheduleRecordEventQueryParams = zod.object({
  all_occurrences: zod
    .boolean()
    .nullish()
    .describe("unschedule a bot from all occurences of a recurring event")
})

export const unscheduleRecordEventResponseItem = zod.object({
  attendees: zod.array(
    zod.object({
      email: zod.string().describe("The email address of the meeting attendee"),
      name: zod
        .string()
        .nullish()
        .describe(
          "The display name of the attendee if available from the calendar provider (Google, Microsoft)"
        )
    })
  ),
  bot_param: zod
    .object({
      bot_image: zod.string().nullish(),
      bot_name: zod.string(),
      deduplication_key: zod.string().nullish(),
      enter_message: zod.string().nullish(),
      extra: zod.record(zod.string(), zod.any()).describe("Custom data object"),
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
      speech_to_text_api_key: zod.string().nullish(),
      speech_to_text_provider: zod.enum(["Gladia", "Runpod", "Default"]).or(zod.null()).optional(),
      streaming_audio_frequency: zod.enum(["16khz", "24khz"]).or(zod.null()).optional(),
      streaming_input: zod.string().nullish(),
      streaming_output: zod.string().nullish(),
      transcription_custom_parameters: zod
        .record(zod.string(), zod.any())
        .describe("Custom data object"),
      waiting_room_timeout: zod.number().nullish(),
      webhook_url: zod.string(),
      zoom_sdk_id: zod.string().nullish(),
      zoom_sdk_pwd: zod.string().nullish()
    })
    .or(zod.null())
    .optional()
    .describe("Associated bot parameters if a bot is scheduled for this event"),
  calendar_uuid: zod.string().uuid(),
  deleted: zod.boolean().describe("Indicates whether this event has been deleted"),
  end_time: zod.string().datetime({}).describe("The end time of the event in UTC timezone"),
  google_id: zod
    .string()
    .describe("The unique identifier of the event from the calendar provider (Google, Microsoft)"),
  is_organizer: zod
    .boolean()
    .describe("Indicates whether the current user is the organizer of this event"),
  is_recurring: zod
    .boolean()
    .describe("Indicates whether this event is part of a recurring series"),
  last_updated_at: zod
    .string()
    .datetime({})
    .describe("The timestamp when this event was last updated"),
  meeting_url: zod.string().describe("The URL that can be used to join the meeting (if available)"),
  name: zod.string().describe("The title/name of the calendar event"),
  raw: zod.record(zod.string(), zod.any()).describe("Custom data object"),
  recurring_event_id: zod
    .string()
    .nullish()
    .describe("For recurring events, the ID of the parent recurring event series (if applicable)"),
  start_time: zod.string().datetime({}).describe("The start time of the event in UTC timezone"),
  uuid: zod.string().uuid()
})
export const unscheduleRecordEventResponse = zod.array(unscheduleRecordEventResponseItem)

/**
 * Updates the configuration of a bot already scheduled to record an event. Allows modification of recording settings, webhook URLs, and other bot parameters without canceling and recreating the scheduled recording. For recurring events, the 'all_occurrences' parameter determines whether changes apply to all instances or just the specific occurrence. Returns the updated event(s) with the modified bot parameters.
 * @summary Patch Bot
 */
export const patchBotParams = zod.object({
  uuid: zod.string().describe("The UUID identifier")
})

export const patchBotQueryParams = zod.object({
  all_occurrences: zod
    .boolean()
    .nullish()
    .describe("schedule a bot to all occurences of a recurring event")
})

export const patchBotBodyBotImageDefault = null
export const patchBotBodyDeduplicationKeyDefault = null
export const patchBotBodyEnterMessageDefault = null
export const patchBotBodyExtraDefault = null
export const patchBotBodyNooneJoinedTimeoutDefault = null
export const patchBotBodySpeechToTextDefault = null
export const patchBotBodyStreamingAudioFrequencyDefault = null
export const patchBotBodyStreamingInputDefault = null
export const patchBotBodyStreamingOutputDefault = null
export const patchBotBodyTranscriptionCustomParametersDefault = null
export const patchBotBodyWaitingRoomTimeoutDefault = null
export const patchBotBodyZoomSdkIdDefault = null
export const patchBotBodyZoomSdkPwdDefault = null

export const patchBotBody = zod.object({
  bot_image: zod.string().nullish(),
  bot_name: zod.string().nullish(),
  deduplication_key: zod.string().nullish(),
  enter_message: zod.string().nullish(),
  extra: zod.any().optional(),
  noone_joined_timeout: zod.number().nullish(),
  recording_mode: zod
    .enum(["speaker_view"])
    .describe("Records the active speaker view")
    .or(
      zod.enum(["gallery_view"]).describe("Records the gallery view showing multiple participants")
    )
    .or(zod.enum(["audio_only"]).describe("Records only the audio from the meeting"))
    .describe("Recording mode for the bot")
    .or(zod.null())
    .or(zod.null())
    .optional(),
  speech_to_text: zod
    .object({
      api_key: zod.string().nullish(),
      provider: zod.enum(["Gladia", "Runpod", "Default"])
    })
    .or(zod.enum(["Gladia", "Runpod", "Default"]))
    .or(zod.null())
    .or(zod.null())
    .optional(),
  streaming_audio_frequency: zod.enum(["16khz", "24khz"]).or(zod.null()).or(zod.null()).optional(),
  streaming_input: zod.string().nullish(),
  streaming_output: zod.string().nullish(),
  transcription_custom_parameters: zod.any().optional(),
  waiting_room_timeout: zod.number().nullish(),
  webhook_url: zod.string().nullish(),
  zoom_sdk_id: zod.string().nullish(),
  zoom_sdk_pwd: zod.string().nullish()
})

export const patchBotResponseItem = zod.object({
  attendees: zod.array(
    zod.object({
      email: zod.string().describe("The email address of the meeting attendee"),
      name: zod
        .string()
        .nullish()
        .describe(
          "The display name of the attendee if available from the calendar provider (Google, Microsoft)"
        )
    })
  ),
  bot_param: zod
    .object({
      bot_image: zod.string().nullish(),
      bot_name: zod.string(),
      deduplication_key: zod.string().nullish(),
      enter_message: zod.string().nullish(),
      extra: zod.record(zod.string(), zod.any()).describe("Custom data object"),
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
      speech_to_text_api_key: zod.string().nullish(),
      speech_to_text_provider: zod.enum(["Gladia", "Runpod", "Default"]).or(zod.null()).optional(),
      streaming_audio_frequency: zod.enum(["16khz", "24khz"]).or(zod.null()).optional(),
      streaming_input: zod.string().nullish(),
      streaming_output: zod.string().nullish(),
      transcription_custom_parameters: zod
        .record(zod.string(), zod.any())
        .describe("Custom data object"),
      waiting_room_timeout: zod.number().nullish(),
      webhook_url: zod.string(),
      zoom_sdk_id: zod.string().nullish(),
      zoom_sdk_pwd: zod.string().nullish()
    })
    .or(zod.null())
    .optional()
    .describe("Associated bot parameters if a bot is scheduled for this event"),
  calendar_uuid: zod.string().uuid(),
  deleted: zod.boolean().describe("Indicates whether this event has been deleted"),
  end_time: zod.string().datetime({}).describe("The end time of the event in UTC timezone"),
  google_id: zod
    .string()
    .describe("The unique identifier of the event from the calendar provider (Google, Microsoft)"),
  is_organizer: zod
    .boolean()
    .describe("Indicates whether the current user is the organizer of this event"),
  is_recurring: zod
    .boolean()
    .describe("Indicates whether this event is part of a recurring series"),
  last_updated_at: zod
    .string()
    .datetime({})
    .describe("The timestamp when this event was last updated"),
  meeting_url: zod.string().describe("The URL that can be used to join the meeting (if available)"),
  name: zod.string().describe("The title/name of the calendar event"),
  raw: zod.record(zod.string(), zod.any()).describe("Custom data object"),
  recurring_event_id: zod
    .string()
    .nullish()
    .describe("For recurring events, the ID of the parent recurring event series (if applicable)"),
  start_time: zod.string().datetime({}).describe("The start time of the event in UTC timezone"),
  uuid: zod.string().uuid()
})
export const patchBotResponse = zod.array(patchBotResponseItem)

/**
 * Retrieves a paginated list of calendar events with comprehensive filtering options. Supports filtering by organizer email, attendee email, date ranges (start_date_gte, start_date_lte), and event status. Results can be limited to upcoming events (default), past events, or all events. Each event includes full details such as meeting links, participants, and recording status. The response includes a 'next' pagination cursor for retrieving additional results.
 * @summary List Events
 */
export const listEventsQueryParams = zod.object({
  attendee_email: zod
    .string()
    .nullish()
    .describe(
      'If provided, filters events to include only those with this attendee\'s email address Example: \"jane.smith@example.com\"'
    ),
  calendar_id: zod
    .string()
    .describe(
      "Calendar ID to filter events by This is required to specify which calendar's events to retrieve"
    ),
  cursor: zod
    .string()
    .nullish()
    .describe(
      "Optional cursor for pagination This value is included in the `next` field of the previous response"
    ),
  organizer_email: zod
    .string()
    .nullish()
    .describe(
      'If provided, filters events to include only those with this organizer\'s email address Example: \"john.doe@example.com\"'
    ),
  start_date_gte: zod
    .string()
    .nullish()
    .describe(
      'If provided, filters events to include only those with a start date greater than or equal to this timestamp Format: ISO-8601 string, e.g., \"2023-01-01T00:00:00Z\"'
    ),
  start_date_lte: zod
    .string()
    .nullish()
    .describe(
      'If provided, filters events to include only those with a start date less than or equal to this timestamp Format: ISO-8601 string, e.g., \"2023-12-31T23:59:59Z\"'
    ),
  status: zod
    .string()
    .nullish()
    .describe(
      'Filter events by meeting status Valid values: \"upcoming\" (default) returns events after current time, \"past\" returns previous events, \"all\" returns both'
    ),
  updated_at_gte: zod
    .string()
    .nullish()
    .describe(
      'If provided, fetches only events updated at or after this timestamp Format: ISO-8601 string, e.g., \"2023-01-01T00:00:00Z\"'
    )
})

export const listEventsResponse = zod.object({
  data: zod
    .array(
      zod.object({
        attendees: zod.array(
          zod.object({
            email: zod.string().describe("The email address of the meeting attendee"),
            name: zod
              .string()
              .nullish()
              .describe(
                "The display name of the attendee if available from the calendar provider (Google, Microsoft)"
              )
          })
        ),
        bot_param: zod
          .object({
            bot_image: zod.string().nullish(),
            bot_name: zod.string(),
            deduplication_key: zod.string().nullish(),
            enter_message: zod.string().nullish(),
            extra: zod.record(zod.string(), zod.any()).describe("Custom data object"),
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
            speech_to_text_api_key: zod.string().nullish(),
            speech_to_text_provider: zod
              .enum(["Gladia", "Runpod", "Default"])
              .or(zod.null())
              .optional(),
            streaming_audio_frequency: zod.enum(["16khz", "24khz"]).or(zod.null()).optional(),
            streaming_input: zod.string().nullish(),
            streaming_output: zod.string().nullish(),
            transcription_custom_parameters: zod
              .record(zod.string(), zod.any())
              .describe("Custom data object"),
            waiting_room_timeout: zod.number().nullish(),
            webhook_url: zod.string(),
            zoom_sdk_id: zod.string().nullish(),
            zoom_sdk_pwd: zod.string().nullish()
          })
          .or(zod.null())
          .optional()
          .describe("Associated bot parameters if a bot is scheduled for this event"),
        calendar_uuid: zod.string().uuid(),
        deleted: zod.boolean().describe("Indicates whether this event has been deleted"),
        end_time: zod.string().datetime({}).describe("The end time of the event in UTC timezone"),
        google_id: zod
          .string()
          .describe(
            "The unique identifier of the event from the calendar provider (Google, Microsoft)"
          ),
        is_organizer: zod
          .boolean()
          .describe("Indicates whether the current user is the organizer of this event"),
        is_recurring: zod
          .boolean()
          .describe("Indicates whether this event is part of a recurring series"),
        last_updated_at: zod
          .string()
          .datetime({})
          .describe("The timestamp when this event was last updated"),
        meeting_url: zod
          .string()
          .describe("The URL that can be used to join the meeting (if available)"),
        name: zod.string().describe("The title/name of the calendar event"),
        raw: zod.record(zod.string(), zod.any()).describe("Custom data object"),
        recurring_event_id: zod
          .string()
          .nullish()
          .describe(
            "For recurring events, the ID of the parent recurring event series (if applicable)"
          ),
        start_time: zod
          .string()
          .datetime({})
          .describe("The start time of the event in UTC timezone"),
        uuid: zod.string().uuid()
      })
    )
    .describe("Vector of calendar events matching the list criteria"),
  next: zod
    .string()
    .nullish()
    .describe(
      "Optional url for fetching the next page of results if there are more results to fetch. The limit of events returned is 100. When None, there are no more results to fetch."
    )
})
