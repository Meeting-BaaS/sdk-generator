# API Reference - v1

This document provides a comprehensive reference for all Meeting BaaS v1 API methods available in the SDK.

The SDK provides a comprehensive interface for all Meeting BaaS API endpoints. All methods return a discriminated union response:

```typescript
type ApiResponse<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; error: ZodError | Error; data?: never }
```

## Available Methods

### Bot Management

| Method | Description | Parameters |
|--------|-------------|------------|
| `joinMeeting` | Have a bot join a meeting, now or in the future | [`JoinRequest`](https://docs.meetingbaas.com/api/reference/join) |
| `leaveMeeting` | Have a bot leave a meeting | [`{ uuid: string }`](https://docs.meetingbaas.com/api/reference/leave) |
| `getMeetingData` | Get meeting recording and metadata | [`GetMeetingDataParams`](https://docs.meetingbaas.com/api/reference/get_meeting_data) |
| `deleteBotData` | Delete bot data | [`{ uuid: string }`](https://docs.meetingbaas.com/api/reference/delete_data) |
| `listBots` | Retrieves a paginated list of the user's bots with essential metadata, including IDs, names, and meeting details. Supports filtering, sorting, and advanced querying options. | [`BotsWithMetadataParams?`](https://docs.meetingbaas.com/api/reference/bots_with_metadata) |
| `retranscribeBot` | Transcribe or retranscribe a bot's audio using the Default or your provided Speech to Text Provider | [`RetranscribeBody`](https://docs.meetingbaas.com/api/reference/retranscribe_bot) |
| `getScreenshots` | Retrieves screenshots captured during the bot's session before it joins a meeting | [`{ uuid: string }`](https://docs.meetingbaas.com/api/reference/get_screenshots) |

### Calendar Management

| Method | Description | Parameters |
|--------|-------------|------------|
| `createCalendar` | Integrates a new calendar with the system using OAuth credentials. This endpoint establishes a connection with the calendar provider (Google, Microsoft), sets up webhook notifications for real-time updates, and performs an initial sync of all calendar events. It requires OAuth credentials (client ID, client secret, and refresh token) and the platform type. Once created, the calendar is assigned a unique UUID that should be used for all subsequent operations. Returns the newly created calendar object with all integration details. | [`CreateCalendarParams`](https://docs.meetingbaas.com/api/reference/calendars/create_calendar) |
| `listCalendars` | Retrieves all calendars that have been integrated with the system for the authenticated user. Returns a list of calendars with their names, email addresses, provider information, and sync status. This endpoint shows only calendars that have been formally connected through the create_calendar endpoint, not all available calendars from the provider. | None |
| `getCalendar` | Retrieves detailed information about a specific calendar integration by its UUID. Returns comprehensive calendar data including the calendar name, email address, provider details (Google, Microsoft), sync status, and other metadata. This endpoint is useful for displaying calendar information to users or verifying the status of a calendar integration before performing operations on its events. | [`{ uuid: string }`](https://docs.meetingbaas.com/api/reference/calendars/get_calendar) |
| `updateCalendar` | Updates a calendar integration with new credentials or platform while maintaining the same UUID. This operation is performed as an atomic transaction to ensure data integrity. The system automatically unschedules existing bots to prevent duplicates, updates the calendar credentials, and triggers a full resync of all events. Useful when OAuth tokens need to be refreshed or when migrating a calendar between providers. Returns the updated calendar object with its new configuration. | [`{ uuid: string; body: UpdateCalendarParams }`](https://docs.meetingbaas.com/api/reference/calendars/update_calendar) |
| `deleteCalendar` | Permanently removes a calendar integration by its UUID, including all associated events and bot configurations. This operation cancels any active subscriptions with the calendar provider, stops all webhook notifications, and unschedules any pending recordings. All related resources are cleaned up in the database. This action cannot be undone, and subsequent requests to this calendar's UUID will return 404 Not Found errors. | [`{ uuid: string }`](https://docs.meetingbaas.com/api/reference/calendars/delete_calendar) |
| `getCalendarEvent` | Retrieves comprehensive details about a specific calendar event by its UUID. Returns complete event information including title, meeting link, start and end times, organizer status, recurrence information, and the full list of attendees with their names and email addresses. Also includes any associated bot parameters if recording is scheduled for this event. The raw calendar data from the provider is also included for advanced use cases. | [`{ uuid: string }`](https://docs.meetingbaas.com/api/reference/calendars/get_event) |
| `scheduleCalendarRecordEvent` | Configures a bot to automatically join and record a specific calendar event at its scheduled time. The request body contains detailed bot configuration, including recording options, streaming settings, and webhook notification URLs. For recurring events, the 'all_occurrences' parameter can be set to true to schedule recording for all instances of the recurring series, or false (default) to schedule only the specific instance. Returns the updated event(s) with the bot parameters attached. | [`{ uuid: string; body: BotParam2; query?: ScheduleRecordEventParams }`](https://docs.meetingbaas.com/api/reference/calendars/schedule_record_event) |
| `unscheduleCalendarRecordEvent` | Cancels a previously scheduled recording for a calendar event and releases associated bot resources. For recurring events, the 'all_occurrences' parameter controls whether to unschedule from all instances of the recurring series or just the specific occurrence. This operation is idempotent and will not error if no bot was scheduled. Returns the updated event(s) with the bot parameters removed. | [`{ uuid: string; query?: UnscheduleRecordEventParams }`](https://docs.meetingbaas.com/api/reference/calendars/unschedule_record_event) |
| `patchBot` | Updates the configuration of a bot already scheduled to record an event. Allows modification of recording settings, webhook URLs, and other bot parameters without canceling and recreating the scheduled recording. For recurring events, the 'all_occurrences' parameter determines whether changes apply to all instances or just the specific occurrence. Returns the updated event(s) with the modified bot parameters. | [`{ uuid: string; body: BotParam3; query?: PatchBotParams }`](https://docs.meetingbaas.com/api/reference/calendars/patch_bot) |
| `listCalendarEvents` | Retrieves a paginated list of calendar events with comprehensive filtering options. Supports filtering by organizer email, attendee email, date ranges (start_date_gte, start_date_lte), and event status. Results can be limited to upcoming events (default), past events, or all events. Each event includes full details such as meeting links, participants, and recording status. The response includes a 'next' pagination cursor for retrieving additional results. | [`ListEventsParams`](https://docs.meetingbaas.com/api/reference/calendars/list_events) |
| `resyncAllCalendars` | Triggers a full resync of all calendar events for all integrated calendars. This operation is useful when you need to ensure that all calendar data is up-to-date in the system. It will re-fetch all events from the calendar providers and update the system's internal state. Returns a response indicating the status of the resync operation. | None |
| `listRawCalendars` | Retrieves unprocessed calendar data directly from the provider (Google, Microsoft) using provided OAuth credentials. This endpoint is typically used during the initial setup process to allow users to select which calendars to integrate. Returns a list of available calendars with their unique IDs, email addresses, and primary status. This data is not persisted until a calendar is formally created using the create_calendar endpoint. | [`ListRawCalendarsParams`](https://docs.meetingbaas.com/api/reference/calendars/list_raw_calendars) |

### Webhooks

| Method | Description | Parameters |
|--------|-------------|------------|
| `getWebhookDocumentation` | Retrieves the full documentation for the webhook events that Meeting BaaS sends to your webhook URL. This includes all event types, their payload structures, and any additional metadata. Useful for developers to understand and integrate webhook functionality into their applications. | None |
| `getBotWebhookDocumentation` | Retrieves the full documentation for the webhook events that Meeting BaaS sends to your webhook URL for a specific bot. This includes all event types, their payload structures, and any additional metadata. Useful for developers to understand and integrate webhook functionality into their applications. | None |
| `getCalendarWebhookDocumentation` | Retrieves the full documentation for the webhook events that Meeting BaaS sends to your webhook URL for a specific calendar. This includes all event types, their payload structures, and any additional metadata. Useful for developers to understand and integrate webhook functionality into their applications. | None |
