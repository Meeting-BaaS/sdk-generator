# Meeting BaaS SDK

<p align="center"><a href="https://discord.com/invite/dsvFgDTr6c"><img height="60px" src="https://user-images.githubusercontent.com/31022056/158916278-4504b838-7ecb-4ab9-a900-7dc002aade78.png" alt="Join our Discord!"></a></p>

<p align="center">
  <img src="https://meetingbaas.com/static/a3e9f3dbde935920a3558317a514ff1a/b5380/preview.png" alt="Meeting BaaS" width="720">
</p>

Official SDK for interacting with the [Meeting BaaS](https://meetingbaas.com) API - The unified API for Google Meet, Zoom, and Microsoft Teams.

> **Note**: This package is automatically generated from the Meeting BaaS OpenAPI specification. For development and contribution guidelines, see [DEVELOPMENT.md](https://github.com/meeting-baas/sdk-generator/blob/HEAD/DEVELOPMENT.md). For the official API reference, visit [docs.meetingbaas.com](https://docs.meetingbaas.com).

> **🚀 New in v5.0.0**: Complete architectural redesign with improved TypeScript support, better error handling, and enhanced developer experience. See [MIGRATION.md](MIGRATION.md) for upgrade guide.

## Features

- **BaaS API Client**: Strongly typed functions for interacting with the Meeting BaaS API
- **Bot Management**: Create, join, and manage meeting bots across platforms
- **Calendar Integration**: Connect calendars and automatically schedule meeting recordings
- **Complete API Coverage**: Access to all Meeting BaaS API endpoints
- **TypeScript Support**: Full TypeScript definitions for all APIs
- **Enhanced Error Handling**: Discriminated union responses for type-safe error handling
- **Parameter Validation**: Automatic Zod schema validation for all API calls
- **Tree-shakeable**: Only import the methods you need
- **Comprehensive Testing**: Full test coverage with MSW mocking

## Installation

```bash
# With npm
npm install @meeting-baas/sdk

# With yarn
yarn add @meeting-baas/sdk

# With pnpm
pnpm add @meeting-baas/sdk
```

## Quick Start

```typescript
import { createBaasClient } from "@meeting-baas/sdk";

// Create a BaaS client
const client = createBaasClient({
  api_key: "your-api-key", // Get yours at https://meetingbaas.com
});

// Join a meeting
const { success, data, error } = await client.joinMeeting({
  bot_name: "Meeting Assistant",
  meeting_url: "https://meet.google.com/abc-def-ghi",
  reserved: true,
});

if (success) {
  console.log("Bot joined successfully:", data.bot_id);
} else {
  console.error("Error joining meeting:", error);
}
```

### For MCP Servers

```typescript
import { type JoinRequest, createBaasClient } from "@meeting-baas/sdk"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

// Create an MCP server
const server = new McpServer({
  name: "demo-server",
  version: "1.0.0"
})

const joinToolInputSchema = {
  bot_name: z.string().default("Meeting BaaS Bot"),
  meeting_url: z.string(),
  reserved: z.boolean().default(false)
}

// Add an joinMeeting tool
server.registerTool(
  "joinMeeting",
  {
    title: "Send a Meeting BaaS bot to a meeting",
    description:
      "Send a Meeting BaaS bot to a Google Meet/Teams/Zoom meeting to automatically record and transcribe the meeting with speech diarization",
    inputSchema: joinToolInputSchema
  },
  async (args) => {
    const client = createBaasClient({
      api_key: "your-api-key"
    })

    const { success, data, error } = await client.joinMeeting(args as JoinRequest)

    if (success) {
      return {
        content: [{ type: "text", text: `Successfully joined meeting: ${JSON.stringify(data)}` }]
      }
    }

    return {
      content: [{ type: "text", text: `Failed to join meeting: ${error}` }]
    }
  }
)
```

## Usage Examples

### Basic Usage

```typescript
import { createBaasClient } from "@meeting-baas/sdk";

// Create a BaaS client
const client = createBaasClient({
  api_key: "your-api-key",
});

const joinMeeting = async () => {
  // Join a meeting
  const { success, data, error } = await client.joinMeeting({
    bot_name: "My Assistant",
    meeting_url: "https://meet.google.com/abc-def-ghi",
    reserved: true,
  });

  if (success) {
    console.log("Bot joined successfully:", data.bot_id);
  } else {
    console.error("Error joining meeting:", error);
  }
}

const leaveMeeting = async () => {
  // Leave a meeting
  const { success, data, error } = await client.leaveMeeting({
    uuid: "123e4567-e89b-12d3-a456-426614174000"
  });
  
  if (success) {
    console.log("Bot left the meeting successfully:", data.bot_id);
  } else {
    console.error("Error leaving meeting:", error);
  }
}

```

### Calendar Integration

```typescript
import { createBaasClient } from "@meeting-baas/sdk";

const client = createBaasClient({
  api_key: "your-api-key",
});

// Create a calendar integration
const calendarResult = await client.createCalendar({
  oauth_client_id: "your-oauth-client-id",
  oauth_client_secret: "your-oauth-client-secret",
  oauth_refresh_token: "your-oauth-refresh-token",
  platform: "Google",
});

if (calendarResult.success) {
  console.log("Calendar created:", calendarResult.data);

  // List all calendars
  const calendarsResult = await client.listCalendars();
  if (calendarsResult.success) {
    console.log("All calendars:", calendarsResult.data);
  }

  // List events from a calendar
  const eventsResult = await client.listCalendarEvents({
    calendar_id: calendarResult.data.calendar.uuid,
    start_date_gte: new Date().toISOString(),
    start_date_lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
  
  if (eventsResult.success) {
    console.log("Events:", eventsResult.data);
  }
}
```

### Advanced Usage with Error Handling

```typescript
import { createBaasClient } from "@meeting-baas/sdk";

const client = createBaasClient({
  api_key: "your-api-key",
  timeout: 60000
});

async function comprehensiveExample() {
  try {
    // Join a meeting with all options
    const joinResult = await client.joinMeeting({
      meeting_url: "https://meet.google.com/abc-defg-hij",
      bot_name: "Advanced Test Bot",
      reserved: false,
      bot_image: "https://example.com/bot-image.jpg",
      enter_message: "Hello from the advanced test bot!",
      extra: { test_id: "advanced-example" },
      recording_mode: "speaker_view",
      speech_to_text: { provider: "Gladia" },
      webhook_url: "https://example.com/webhook"
    });

    if (joinResult.success) {
      const botId = joinResult.data.bot_id;
      console.log("Bot joined with ID:", botId);

      // Get meeting data with transcripts
      const meetingDataResult = await client.getMeetingData({
        bot_id: botId,
        include_transcripts: true
      });

      if (meetingDataResult.success) {
        console.log("Meeting duration:", meetingDataResult.data.duration);
        console.log("Has MP4:", !!meetingDataResult.data.mp4);
      }

      // Leave the meeting
      const leaveResult = await client.leaveMeeting({
        uuid: botId
      });

      if (leaveResult.success) {
        console.log("Bot left meeting successfully");
      }

      // Delete bot data
      const deleteResult = await client.deleteBotData({
        uuid: botId
      });

      if (deleteResult.success) {
        console.log("Bot data deleted successfully");
      }
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}
```

## API Reference

The SDK provides a comprehensive interface for all Meeting BaaS API endpoints. All methods return a discriminated union response:

```typescript
type ApiResponse<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; error: ZodError | Error; data?: never }
```

### Available Methods

#### Bot Management

| Method | Description | Parameters |
|--------|-------------|------------|
| `joinMeeting` | Have a bot join a meeting, now or in the future | [`JoinRequest`](https://docs.meetingbaas.com/api/reference/join) |
| `leaveMeeting` | Have a bot leave a meeting | [`{ uuid: string }`](https://docs.meetingbaas.com/api/reference/leave) |
| `getMeetingData` | Get meeting recording and metadata | [`GetMeetingDataParams`](https://docs.meetingbaas.com/api/reference/get_meeting_data) |
| `deleteBotData` | Delete bot data | [`{ uuid: string }`](https://docs.meetingbaas.com/api/reference/delete_data) |
| `listBots` | Retrieves a paginated list of the user's bots with essential metadata, including IDs, names, and meeting details. Supports filtering, sorting, and advanced querying options. | [`BotsWithMetadataParams?`](https://docs.meetingbaas.com/api/reference/bots_with_metadata) |
| `retranscribeBot` | Transcribe or retranscribe a bot's audio using the Default or your provided Speech to Text Provider | [`RetranscribeBody`](https://docs.meetingbaas.com/api/reference/retranscribe_bot) |
| `getScreenshots` | Retrieves screenshots captured during the bot's session before it joins a meeting | [`{ uuid: string }`](https://docs.meetingbaas.com/api/reference/get_screenshots) |

#### Calendar Management

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

#### Webhooks

| Method | Description | Parameters |
|--------|-------------|------------|
| `getWebhookDocumentation` | Retrieves the full documentation for the webhook events that Meeting BaaS sends to your webhook URL. This includes all event types, their payload structures, and any additional metadata. Useful for developers to understand and integrate webhook functionality into their applications. | None |
| `getBotWebhookDocumentation` | Retrieves the full documentation for the webhook events that Meeting BaaS sends to your webhook URL for a specific bot. This includes all event types, their payload structures, and any additional metadata. Useful for developers to understand and integrate webhook functionality into their applications. | None |
| `getCalendarWebhookDocumentation` | Retrieves the full documentation for the webhook events that Meeting BaaS sends to your webhook URL for a specific calendar. This includes all event types, their payload structures, and any additional metadata. Useful for developers to understand and integrate webhook functionality into their applications. | None |

## TypeScript Support

The SDK provides full TypeScript support with generated types from the OpenAPI specification:

```typescript
import type { 
  JoinRequest, 
  JoinResponse, 
  Metadata, 
  CreateCalendarParams 
} from "@meeting-baas/sdk";

// All types are available for advanced usage
const joinParams: JoinRequest = {
  meeting_url: "https://meet.google.com/abc-def-ghi",
  bot_name: "My Bot",
  reserved: false
};
```

## Error Handling

The SDK provides type-safe error handling with discriminated union responses:

```typescript
const result = await client.joinMeeting({
  meeting_url: "https://meet.google.com/abc-def-ghi",
  bot_name: "My Bot",
  reserved: false
});

if (result.success) {
  // TypeScript knows result.data is JoinResponse
  console.log("Bot ID:", result.data.bot_id);
} else {
  // TypeScript knows result.error is ZodError | Error
  if (result.error instanceof ZodError) {
    console.error("Validation error:", result.error.errors);
  } else {
    console.error("API error:", result.error.message);
  }
}
```

## Configuration

The client accepts the following configuration options:

```typescript
interface BaasClientConfig {
  api_key: string;           // Required: Your Meeting BaaS API key
  timeout?: number;          // Optional: Request timeout in ms (default: 30000)
}
```

### Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `api_key` | `string` | ✅ Yes | - | Your Meeting BaaS API key. Get yours at [meetingbaas.com](https://meetingbaas.com) |
| `timeout` | `number` | ❌ No | `30000` | Request timeout in milliseconds. Some requests may take longer, so we recommend setting a longer timeout if you notice timeouts |

## Testing

The SDK includes comprehensive tests with MSW (Mock Service Worker) for reliable testing:

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests only
pnpm test:integration

# Run tests with coverage
pnpm test:coverage
```

## Migration from v4.x

If you're upgrading from v4.x, see [MIGRATION.md](MIGRATION.md) for detailed migration instructions.

## Contributing

We welcome contributions! Please see [DEVELOPMENT.md](DEVELOPMENT.md) for development guidelines.

## License

[MIT](LICENSE)
