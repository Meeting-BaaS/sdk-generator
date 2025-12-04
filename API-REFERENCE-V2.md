# API Reference - v2

This document provides a comprehensive reference for all Meeting BaaS v2 API methods available in the SDK.

The SDK provides a comprehensive interface for all Meeting BaaS v2 API endpoints. All methods return a discriminated union response:

```typescript
type ApiResponseV2<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; error: string; code: string; statusCode: number; details: unknown | null; data?: never }
```

**Batch Routes (v2)**: Special case returning `{ success: true, data: [...], errors: [...] }` for partial success scenarios.

## Webhook Types and Zod Schemas

The v2 API includes comprehensive TypeScript types and Zod schemas for all webhook events, enabling you to build type-safe webhook handlers.

### Available Webhook Types

All webhook types are exported from the `V2` namespace:

**Bot Webhooks:**

- `BotWebhookCompleted` - Sent when a bot successfully completes recording
- `BotWebhookFailed` - Sent when a bot fails to join or record
- `BotWebhookStatusChange` - Sent when a bot's status changes

**Calendar Webhooks:**

- `CalendarWebhookConnectionCreated` - Sent when a calendar connection is created
- `CalendarWebhookConnectionUpdated` - Sent when a calendar connection is updated
- `CalendarWebhookConnectionDeleted` - Sent when a calendar connection is deleted
- `CalendarWebhookEventCreated` - Sent when a calendar event is created
- `CalendarWebhookEventUpdated` - Sent when a calendar event is updated
- `CalendarWebhookEventCancelled` - Sent when a calendar event is cancelled
- `CalendarWebhookEventsSynced` - Sent when a calendar completes the initial sync

**Callback Payloads:**

- `CallbackCompleted` - Callback payload sent when a bot successfully completes recording (event: `"bot.completed"`)
- `CallbackFailed` - Callback payload sent when a bot fails to join or record (event: `"bot.failed"`)

> **Note:** Callback payloads have the same structure as webhook events but are sent to bot-specific callback URLs configured via `callback_config` when creating bots.

### Usage Example

```typescript
import type { V2 } from "@meeting-baas/sdk";

// Type-safe webhook handler
async function handleWebhook(payload: V2.BotWebhookCompleted) {
  if (payload.event === "bot.completed") {
    console.log("Bot completed:", payload.data.bot_id);
    console.log("Transcription:", payload.data.transcription);
    console.log("Video URL:", payload.data.video);
  }
}

// You can also use discriminated unions for multiple event types
type WebhookEvent = 
  | V2.BotWebhookCompleted 
  | V2.BotWebhookFailed 
  | V2.BotWebhookStatusChange
  | V2.CalendarWebhookEventCreated;

async function handleAnyWebhook(payload: WebhookEvent) {
  switch (payload.event) {
    case "bot.completed":
      // TypeScript knows payload.data has BotWebhookCompletedData
      break;
    case "bot.failed":
      // TypeScript knows payload.data has BotWebhookFailedData
      break;
    // ... other cases
  }
}

// Callback payloads can be handled the same way
async function handleCallback(payload: V2.CallbackCompleted | V2.CallbackFailed) {
  if (payload.event === "bot.completed") {
    // TypeScript knows this is CallbackCompleted
    console.log("Callback - Bot completed:", payload.data.bot_id);
  } else if (payload.event === "bot.failed") {
    // TypeScript knows this is CallbackFailed
    console.log("Callback - Bot failed:", payload.data.bot_id);
  }
}
```

For detailed webhook documentation, see the [v2 API webhook reference](https://docs.meetingbaas.com/api-v2/reference/webhooks).

## Available Methods

### Bot Management

| Method | Description | Parameters |
|--------|-------------|------------|
| `createBot` | Create a bot | [`CreateBotRequestBodyInput`](https://docs.meetingbaas.com/api-v2/reference/bots/create-bot) |
| `batchCreateBots` | Create multiple bots | [`BatchCreateBotsRequestBodyInput`](https://docs.meetingbaas.com/api-v2/reference/bots/batch-create-bots) |
| `listBots` | List bots | [`ListBotsParams?`](https://docs.meetingbaas.com/api-v2/reference/bots/list-bots) |
| `getBotDetails` | Get bot details | [`{ bot_id: string }`](https://docs.meetingbaas.com/api-v2/reference/bots/get-bot-details) |
| `getBotStatus` | Get bot status | [`{ bot_id: string }`](https://docs.meetingbaas.com/api-v2/reference/bots/get-bot-status) |
| `getBotScreenshots` | Get bot screenshots | [`{ bot_id: string; limit?: number; cursor?: string \| null }`](https://docs.meetingbaas.com/api-v2/reference/bots/get-bot-screenshots) |
| `leaveBot` | Leave meeting | [`{ bot_id: string }`](https://docs.meetingbaas.com/api-v2/reference/bots/leave-bot) |
| `deleteBotData` | Delete bot data | [`{ bot_id: string; delete_from_provider?: boolean }`](https://docs.meetingbaas.com/api-v2/reference/bots/delete-bot-data) |
| `resendFinalWebhook` | Resend final webhook | [`{ bot_id: string }`](https://docs.meetingbaas.com/api-v2/reference/bots/resend-final-webhook) |
| `retryCallback` | Retry callback | [`{ bot_id: string; callbackConfig?: RetryCallbackRequestBodyInput }`](https://docs.meetingbaas.com/api-v2/reference/bots/retry-callback) |

### Scheduled Bot Management

| Method | Description | Parameters |
|--------|-------------|------------|
| `createScheduledBot` | Create scheduled bot | [`CreateScheduledBotRequestBodyInput`](https://docs.meetingbaas.com/api-v2/reference/bots/create-scheduled-bot) |
| `batchCreateScheduledBots` | Create multiple scheduled bots | [`BatchCreateScheduledBotsRequestBodyInput`](https://docs.meetingbaas.com/api-v2/reference/bots/batch-create-scheduled-bots) |
| `listScheduledBots` | List scheduled bots | [`ListScheduledBotsParams?`](https://docs.meetingbaas.com/api-v2/reference/bots/list-scheduled-bots) |
| `getScheduledBot` | Get scheduled bot details | [`{ bot_id: string }`](https://docs.meetingbaas.com/api-v2/reference/bots/get-scheduled-bot-details) |
| `updateScheduledBot` | Update scheduled bot | [`{ bot_id: string; body: UpdateScheduledBotRequestBodyInput }`](https://docs.meetingbaas.com/api-v2/reference/bots/update-scheduled-bot) |
| `deleteScheduledBot` | Delete scheduled bot | [`{ bot_id: string }`](https://docs.meetingbaas.com/api-v2/reference/bots/delete-scheduled-bot) |

### Calendar Connection Management

| Method | Description | Parameters |
|--------|-------------|------------|
| `listRawCalendars` | List raw calendars (preview before creating connection) | [`ListRawCalendarsRequestBodyInput`](https://docs.meetingbaas.com/api-v2/reference/calendars/list-raw-calendars) |
| `createCalendarConnection` | Create calendar connection | [`CreateCalendarConnectionRequestBodyInput`](https://docs.meetingbaas.com/api-v2/reference/calendars/create-calendar-connection) |
| `listCalendars` | List calendar connections | [`ListCalendarsParams?`](https://docs.meetingbaas.com/api-v2/reference/calendars/list-calendars) |
| `getCalendarDetails` | Get calendar connection details | [`{ calendar_id: string }`](https://docs.meetingbaas.com/api-v2/reference/calendars/get-calendar-details) |
| `updateCalendarConnection` | Update calendar connection | [`{ calendar_id: string; body: UpdateCalendarConnectionRequestBodyInput }`](https://docs.meetingbaas.com/api-v2/reference/calendars/update-calendar-connection) |
| `deleteCalendarConnection` | Delete calendar connection | [`{ calendar_id: string }`](https://docs.meetingbaas.com/api-v2/reference/calendars/delete-calendar-connection) |
| `syncCalendar` | Sync calendar events | [`{ calendar_id: string }`](https://docs.meetingbaas.com/api-v2/reference/calendars/sync-calendar) |
| `resubscribeCalendar` | Resubscribe to calendar webhooks | [`{ calendar_id: string }`](https://docs.meetingbaas.com/api-v2/reference/calendars/resubscribe-calendar) |

### Calendar Event Management

| Method | Description | Parameters |
|--------|-------------|------------|
| `listEvents` | List calendar events | [`{ calendar_id: string; query?: ListEventsParams }`](https://docs.meetingbaas.com/api-v2/reference/calendars/list-events) |
| `listEventSeries` | List event series | [`{ calendar_id: string; query?: ListEventSeriesParams }`](https://docs.meetingbaas.com/api-v2/reference/calendars/list-event-series) |
| `getEventDetails` | Get event details | [`{ calendar_id: string; event_id: string }`](https://docs.meetingbaas.com/api-v2/reference/calendars/get-event-details) |

### Calendar Bot Management

| Method | Description | Parameters |
|--------|-------------|------------|
| `createCalendarBot` | Schedule bot for calendar event | [`{ calendar_id: string; body: CreateCalendarBotRequestBodyInput }`](https://docs.meetingbaas.com/api-v2/reference/calendars/create-calendar-bot) |
| `updateCalendarBot` | Update calendar bot | [`{ calendar_id: string; event_id: string; body: UpdateCalendarBotRequestBodyInput }`](https://docs.meetingbaas.com/api-v2/reference/calendars/update-calendar-bot) |
| `deleteCalendarBot` | Cancel calendar bot | [`{ calendar_id: string; event_id: string }`](https://docs.meetingbaas.com/api-v2/reference/calendars/delete-calendar-bot) |
