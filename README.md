# Voice Router SDK

Universal speech-to-text router for 6+ transcription providers with a single, unified API.

[![npm version](https://badge.fury.io/js/voice-router.svg)](https://www.npmjs.com/package/voice-router)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Voice Router is a unified TypeScript SDK that provides a single interface to interact with multiple speech-to-text transcription providers:

- ✅ **Gladia** - Batch + Real-time streaming
- ✅ **AssemblyAI** - Batch + Real-time streaming
- ✅ **Deepgram** - Batch + Real-time streaming
- ✅ **Azure Speech-to-Text** - Batch transcription
- ✅ **OpenAI Whisper** - Synchronous transcription (gpt-4o, whisper-1)
- ✅ **Speechmatics** - Batch transcription

**Why Voice Router?**
- 🔄 Switch providers without changing code
- 🎯 Unified API across all providers
- 📦 Webhook normalization with auto-detection
- 🔊 Real-time streaming support (WebSocket)
- 📊 Speaker diarization, sentiment analysis, summarization
- 🔒 Type-safe with full TypeScript support
- ⚡ Zero-config provider fallback strategies

## Features

- **BaaS API Client**: Strongly typed functions for interacting with the Meeting BaaS API
- **Bot Management**: Create, join, and manage meeting bots across platforms
- **Calendar Integration**: Connect calendars and automatically schedule meeting recordings
- **Transcription Services**: Unified interface for multiple transcription providers (Gladia, AssemblyAI, Deepgram, Azure STT)
- **Webhook Normalization**: Automatically parse and normalize webhooks from all transcription providers
- **Streaming Transcription**: Real-time WebSocket streaming for live transcription
- **Complete API Coverage**: Access to all Meeting BaaS API endpoints
- **TypeScript Support**: Full TypeScript definitions for all APIs
- **Enhanced Error Handling**: Discriminated union responses for type-safe error handling
- **Parameter Validation**: Automatic Zod schema validation for all API calls
- **Tree-shakeable**: Only import the methods you need
- **Comprehensive Testing**: Full test coverage with MSW mocking

## System Requirements

- **Node.js**: Version 20.0.0 or higher (required for development and type generation).
- **Package Managers**: npm, yarn, or pnpm

**Tested Node.js Versions**: 20, 21, 22

> **Note**: Development requires Node 20+ due to dependencies on modern JavaScript features (`toSorted()`) used by the OpenAPI type generator (Orval). Runtime usage may work with Node 18+, but type generation and builds require Node 20+.

## Installation

```bash
# With npm
npm install voice-router

# With yarn
yarn add voice-router

# With pnpm
pnpm add voice-router
```

## Quick Start

### v1 API (Default)

```typescript
import { createBaasClient } from "voice-router";

// Create a BaaS client (defaults to v1 API)
const client = createBaasClient({
  api_key: "your-api-key", // Get yours at https://meetingbaas.com
});

async function example() {
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
}
```

### v2 API

```typescript
import { createBaasClient } from "voice-router";

// Create a v2 BaaS client
const client = createBaasClient({
  api_key: "your-api-key",
  api_version: "v2" // Use v2 API
});

async function example() {
  // Create a bot (v2 API method)
  const { success, data, error } = await client.createBot({
    meeting_url: "https://meet.google.com/abc-def-ghi",
    bot_name: "Meeting Assistant"
  });
  
  if (success) {
    console.log("Bot created successfully:", data.bot_id);
  } else {
    console.error("Error creating bot:", error);
  }
}
```

### For MCP Servers

```typescript
import { type JoinRequest, createBaasClient } from "voice-router"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

// Create an MCP server
const server = new McpServer({
  name: "demo-server",
  version: "1.0.0"
})

// @modelcontextprotocol/sdk expects the input schema to be a ZodRawShape (plain object with zod types)
const joinToolInputSchema = {
  bot_name: z.string().default("Meeting BaaS Bot"),
  meeting_url: z.string(),
  reserved: z.boolean().default(false)
}

// Add a joinMeeting tool
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
import { createBaasClient } from "voice-router";

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
import { createBaasClient } from "voice-router";

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

### Webhook Normalization

The SDK includes webhook normalization for transcription providers, automatically parsing and unifying webhook callbacks from Gladia, AssemblyAI, Deepgram, and Azure STT:

```typescript
import { WebhookRouter } from "voice-router";
import express from "express";

const app = express();
const router = new WebhookRouter();

// Single endpoint handles all transcription providers
app.post('/webhooks/transcription', express.json(), (req, res) => {
  // Auto-detect provider and parse webhook
  const result = router.route(req.body, {
    verification: {
      signature: req.headers['x-signature'] as string,
      secret: process.env.WEBHOOK_SECRET!
    }
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  // Unified event format across all providers
  console.log('Provider:', result.provider);
  console.log('Event type:', result.event?.eventType);
  console.log('Transcript ID:', result.event?.data?.id);

  if (result.event?.eventType === 'transcription.completed') {
    console.log('Transcription completed!');
    // Fetch full transcript using provider's adapter
  }

  res.status(200).json({ received: true });
});

app.listen(3000);
```

Supported webhook events:
- `transcription.created` - Transcription job created
- `transcription.processing` - Transcription is processing
- `transcription.completed` - Transcription completed successfully
- `transcription.failed` - Transcription failed with error
- `live.session_started` - Live streaming session started
- `live.session_ended` - Live streaming session ended
- `live.transcript` - Live transcript update

### Advanced Usage with Error Handling

```typescript
import { createBaasClient } from "voice-router";

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

The SDK provides a comprehensive interface for all Meeting BaaS API endpoints. For detailed documentation of all available methods, see:

- **[API Reference - v1](API-REFERENCE-V1.md)**: Complete documentation for all v1 API methods (default)
- **[API Reference - v2](API-REFERENCE-V2.md)**: Complete documentation for all v2 API methods

### Response Types

**v1 API**: All methods return a discriminated union response:

```typescript
type ApiResponse<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; error: ZodError | Error; data?: never }
```

**v2 API**: All methods return a discriminated union response:

```typescript
type ApiResponseV2<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; error: string; code: string; statusCode: number; details: unknown | null; data?: never }
```

**Batch Routes (v2)**: Special case returning `{ success: true, data: [...], errors: [...] }` for partial success scenarios.

## TypeScript Support

The SDK provides full TypeScript support with generated types from the OpenAPI specification:

```typescript
import type { 
  JoinRequest, 
  JoinResponse, 
  Metadata, 
  CreateCalendarParams 
} from "voice-router";

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

## Webhook Types (v2)

The v2 API includes comprehensive TypeScript types for all webhook events, enabling you to build type-safe webhook handlers. All webhook types are available through the `V2` namespace:

```typescript
import type { V2 } from "voice-router";

// Type-safe webhook handler
async function handleWebhook(payload: V2.BotWebhookCompleted) {
  if (payload.event === "bot.completed") {
    console.log("Bot completed:", payload.data.bot_id);
    console.log("Transcription:", payload.data.transcription);
  }
}
```

Available webhook types include:

- **Bot webhooks**: `BotWebhookCompleted`, `BotWebhookFailed`, `BotWebhookStatusChange`
- **Calendar webhooks**: `CalendarWebhookConnectionCreated`, `CalendarWebhookConnectionUpdated`, `CalendarWebhookConnectionDeleted`, `CalendarWebhookEventCreated`, `CalendarWebhookEventUpdated`, `CalendarWebhookEventCancelled`, `CalendarWebhookEventsSynced`
- **Callback payloads**: `CallbackCompleted`, `CallbackFailed` (for bot-specific callbacks)

See [API Reference - v2](API-REFERENCE-V2.md#webhook-types-and-zod-schemas) for more details and examples.

## API Versioning

The SDK supports both Meeting BaaS v1 and v2 APIs. You can select which API version to use when creating the client:

```typescript
// v1 API (default, for backward compatibility)
const v1Client = createBaasClient({
  api_key: "your-api-key"
  // api_version defaults to "v1"
});

// v2 API
const v2Client = createBaasClient({
  api_key: "your-api-key",
  api_version: "v2"
});
```

### Type-Safe Version Selection

TypeScript automatically infers the available methods based on the `api_version` you specify:

```typescript
// v1 client - only v1 methods available
const v1Client = createBaasClient({ api_key: "key" });
v1Client.joinMeeting({ ... }); // ✅ Available
v1Client.createBot({ ... }); // ❌ Not available

// v2 client - only v2 methods available
const v2Client = createBaasClient({ api_key: "key", api_version: "v2" });
v2Client.createBot({ ... }); // ✅ Available
v2Client.joinMeeting({ ... }); // ❌ Not available
```

### Response Format Differences

**v1 API**: SDK wraps responses in `{ success: true, data: T }` or `{ success: false, error: ZodError | Error }`

**v2 API**: API already returns `{ success: true, data: T }` or `{ success: false, error: string, code: string, statusCode: number, details: unknown | null }`. The SDK passes these through without transformation.

**Batch Routes (v2)**: Special case returning `{ success: true, data: [...], errors: [...] }` for partial success scenarios.

### Migration from v1 to v2

To migrate from v1 to v2, simply change the `api_version` in your client configuration:

```typescript
// Before (v1)
const client = createBaasClient({
  api_key: "your-api-key"
});

// After (v2)
const client = createBaasClient({
  api_key: "your-api-key",
  api_version: "v2"
});
```

TypeScript will automatically show only v2 methods, making migration straightforward. See [MIGRATION.md](MIGRATION.md) for detailed migration guide.

## Configuration

The client accepts the following configuration options:

```typescript
interface BaasClientConfig {
  api_key: string;           // Required: Your Meeting BaaS API key
  api_version?: "v1" | "v2"; // Optional: API version (default: "v1")
  base_url?: string;         // Optional: Base URL (internal use)
  timeout?: number;          // Optional: Request timeout in ms (default: 30000)
}
```

### Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `api_key` | `string` | ✅ Yes | - | Your Meeting BaaS API key. Get yours at [meetingbaas.com](https://meetingbaas.com) |
| `api_version` | `"v1" \| "v2"` | ❌ No | `"v1"` | API version to use. Use `"v2"` for the new Meeting BaaS v2 API |
| `timeout` | `number` | ❌ No | `30000` | Request timeout in milliseconds. Some requests may take longer, so we recommend setting a longer timeout if you notice timeouts |

## Migration from v4.x

If you're upgrading from v4.x, see [MIGRATION.md](MIGRATION.md) for detailed migration instructions.

## Documentation Generation

The SDK includes automated documentation generation using [TypeDoc](https://typedoc.org/) and [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) to generate comprehensive markdown documentation organized into 3 separate sections (Client/Bridge, v1 API, v2 API).

### Generate Documentation

```bash
pnpm docs:generate    # Generate all documentation
pnpm docs:clean       # Clean generated docs
```

### Configuration

Documentation generation is configured using three separate TypeDoc configuration files:

- **`typedoc.config.mjs`** - Client/Bridge documentation
  - Entry points: `src/node/client.ts`, `src/node/types.d.ts`
  - Output: `docs/generated/client/`
  - Documents: `createBaasClient()` factory and configuration types

- **`typedoc.v1.config.mjs`** - v1 API documentation
  - Entry points: `src/node/v1-methods.ts`, `src/node/types.d.ts`
  - Output: `docs/generated/v1/`
  - Documents: v1 methods like `joinMeeting()`, `leaveMeeting()`, etc.
  - Excludes: v2-specific code and types

- **`typedoc.v2.config.mjs`** - v2 API documentation
  - Entry points: `src/node/v2-methods.ts`, `src/node/types.d.ts`
  - Output: `docs/generated/v2/`
  - Documents: v2 methods like `createBot()`, `batchCreateBots()`, etc.
  - Excludes: v1-specific code and types

### Output Structure

Documentation is output to `docs/generated/` with a landing page at [INDEX.md](docs/generated/INDEX.md) showing v1 vs v2 comparisons and navigation to:

- **Client/Bridge API** (`docs/generated/client/`) - How to use `createBaasClient()` with type-safe version selection
- **v1 API Reference** (`docs/generated/v1/`) - Complete v1 API methods and types
- **v2 API Reference** (`docs/generated/v2/`) - Complete v2 API methods and types

See [ADDING_NEW_API_VERSION.md](ADDING_NEW_API_VERSION.md) for details on adding new API versions to the SDK.

## Contributing

We welcome contributions! Please see [DEVELOPMENT.md](DEVELOPMENT.md) for development guidelines.

## License

[MIT](LICENSE)
