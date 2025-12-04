# Migration Guide

This guide helps you migrate between SDK versions.

## Table of Contents

- [v4.x to v5.0.0](#migration-guide-v4x-to-v500)
- [v5.x to v6.0.0](#migration-guide-v5x-to-v600)

---

## Migration Guide: v4.x to v5.0.0

This guide helps you migrate from Meeting BaaS SDK v4.x to v5.0.0. Version 5.0.0 introduces significant architectural improvements with some breaking changes.

## 🚀 What's New in v5.0.0

- **Complete architectural redesign** with improved TypeScript support
- **Enhanced error handling** with discriminated union responses
- **Automatic parameter validation** using Zod schemas
- **Tree-shakeable client** for better bundle optimization
- **Comprehensive testing** with MSW mocking
- **Simplified API** focused on core SDK functionality
- **Removed MCP tools** to streamline the package
- **Removed Unnecessary casing changes** to improve performance

## ⚠️ Breaking Changes

### 1. Client Creation

**Before (v4.x):**

```typescript
import { BaasClient } from "@meeting-baas/sdk";

const client = new BaasClient({
  apiKey: "your-api-key",
  baseUrl: "https://api.meetingbaas.com"
});
```

**After (v5.0.0):**

```typescript
import { createBaasClient } from "@meeting-baas/sdk";

const client = createBaasClient({
  api_key: "your-api-key",
  base_url: "https://api.meetingbaas.com"
});
```

**Changes:**

- `new BaasClient()` → `createBaasClient()`
- `apiKey` → `api_key`
- `baseUrl` → `base_url`

### 2. API Response Handling

**Before (v4.x):**

```typescript
try {
  const botId = await client.joinMeeting({
    botName: "My Bot",
    meetingUrl: "https://meet.google.com/abc-def-ghi",
    reserved: true
  });
  console.log("Bot ID:", botId);
} catch (error) {
  console.error("Error:", error);
}
```

**After (v5.0.0):**

```typescript
const result = await client.joinMeeting({
  bot_name: "My Bot",
  meeting_url: "https://meet.google.com/abc-def-ghi",
  reserved: true
});

if (result.success) {
  console.log("Bot ID:", result.data.bot_id);
} else {
  console.error("Error:", result.error);
}
```

**Changes:**

- All methods now return discriminated union responses
- No more try/catch for API errors (they're returned to the caller in the response)
- Parameter names changed to snake_case.
- Response data is wrapped in `result.data`

### 3. Parameter Naming Convention

All parameter names have changed from camelCase to snake_case to match the API specification:

| v4.x | v5.0.0 |
|------|--------|
| `botName` | `bot_name` |
| `meetingUrl` | `meeting_url` |
| `botId` | `bot_id` |
| `oauthClientId` | `oauth_client_id` |
| `oauthClientSecret` | `oauth_client_secret` |
| `oauthRefreshToken` | `oauth_refresh_token` |
| `includeTranscripts` | `include_transcripts` |

Since the parameters of the APIs were in snake_case, it made sense to embrace it. This makes the SDK more performant (no more case conversion) and more intuitive for users already well versed with our APIs.

### 4. Method Signatures

**Before (v4.x):**

```typescript
// Direct return values
const botId = await client.joinMeeting(params);
const meetingData = await client.getMeetingData(botId);
await client.deleteData(botId);
```

**After (v5.0.0):**

```typescript
// Discriminated union responses
const { success, data, error } = await client.joinMeeting(params);
if (success) {
  const meetingDataResult = await client.getMeetingData({
    bot_id: data.bot_id
  });
  
  if (meetingDataResult.success) {
    const deleteResult = await client.deleteBotData({
      uuid: meetingDataResult.data.bot_id
    });
  }
}
```

### 5. MCP Tools Registration

**Before (v4.x):**

```typescript
import { allTools, registerTools } from "@meeting-baas/sdk/tools";
import { BaasClient } from "@meeting-baas/sdk";

const client = new BaasClient({ apiKey: "your-key" });
await registerTools(allTools, server.registerTool);
```

**After (v5.0.0):**
MCP tool registration has been removed to give users more control. Since different MCP servers handle schemas, descriptions, and tool registration differently, we now expose the core SDK functions that you can use to register your own MCP tools:

```typescript
import { type JoinRequest, createBaasClient } from "@meeting-baas/sdk"
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

**Changes:**

- Removed pre-built MCP tool registration helpers
- Users now have full control over tool schemas, descriptions, and registration
- SDK functions can be used directly within custom MCP tool handlers
- Better flexibility for different MCP server implementations

### 6. Configuration Interface

**Before (v4.x):**

```typescript
interface BaasClientConfig {
  apiKey: string;
  baseUrl?: string;
}
```

**After (v5.0.0):**

```typescript
interface BaasClientConfig {
  api_key: string;
  base_url?: string;
  timeout?: number; // New optional timeout parameter
}
```

## 📋 Migration Checklist

### Step 1: Update Dependencies

```bash
# Update to v5.0.0
npm install @meeting-baas/sdk@^5.0.0
# or
yarn add @meeting-baas/sdk@^5.0.0
# or
pnpm add @meeting-baas/sdk@^5.0.0
```

### Step 2: Update Imports

```typescript
// Before
import { BaasClient } from "@meeting-baas/sdk";

// After
import { createBaasClient } from "@meeting-baas/sdk";
```

### Step 3: Update Client Creation

```typescript
// Before
const client = new BaasClient({
  apiKey: "your-api-key"
});

// After
const client = createBaasClient({
  api_key: "your-api-key"
});
```

### Step 4: Update Method Calls

For each API call, you need to:

1. **Change parameter names** to snake_case
2. **Handle discriminated union responses**
3. **Update parameter structures** where needed

### Step 5: Update Error Handling

```typescript
// Before
try {
  const result = await client.someMethod(params);
  // Handle success
} catch (error) {
  // Handle error
}

// After
const { success, data, error } = await client.someMethod(params);
if (success) {
  // Handle success with data
} else {
  // Handle error with error
}
```

## 🔄 Migration Examples

### Example 1: Basic Bot Operations

**Before (v4.x):**

```typescript
import { BaasClient } from "@meeting-baas/sdk";

const client = new BaasClient({
  apiKey: "your-api-key"
});

try {
  const botId = await client.joinMeeting({
    botName: "My Bot",
    meetingUrl: "https://meet.google.com/abc-def-ghi",
    reserved: true
  });
  
  const meetingData = await client.getMeetingData(botId);
  console.log("Meeting data:", meetingData);
  
  await client.deleteData(botId);
} catch (error) {
  console.error("Error:", error);
}
```

**After (v5.0.0):**

```typescript
import { createBaasClient } from "@meeting-baas/sdk";

const client = createBaasClient({
  api_key: "your-api-key"
});

const joinResult = await client.joinMeeting({
  bot_name: "My Bot",
  meeting_url: "https://meet.google.com/abc-def-ghi",
  reserved: true
});

if (joinResult.success) {
  const meetingDataResult = await client.getMeetingData({
    bot_id: joinResult.data.bot_id
  });
  
  if (meetingDataResult.success) {
    console.log("Meeting data:", meetingDataResult.data);
  } else {
    console.error("Error getting meeting data:", meetingDataResult.error);
  }
  
  const deleteResult = await client.deleteBotData({
    uuid: joinResult.data.bot_id
  });
  
  if (deleteResult.success) {
    console.log("Bot data deleted successfully");
  } else {
    console.error("Error deleting bot data:", deleteResult.error);
  }
} else {
  console.error("Error joining meeting:", joinResult.error);
}
```

### Example 2: Calendar Operations

**Before (v4.x):**

```typescript
import { BaasClient, Provider } from "@meeting-baas/sdk";

const client = new BaasClient({
  apiKey: "your-api-key"
});

try {
  const calendar = await client.createCalendar({
    oauthClientId: "your-oauth-client-id",
    oauthClientSecret: "your-oauth-client-secret",
    oauthRefreshToken: "your-oauth-refresh-token",
    platform: Provider.Google
  });
  
  const calendars = await client.listCalendars();
  const events = await client.listEvents(calendar.uuid);
} catch (error) {
  console.error("Error:", error);
}
```

**After (v5.0.0):**

```typescript
import { createBaasClient } from "@meeting-baas/sdk";

const client = createBaasClient({
  api_key: "your-api-key"
});

const calendarResult = await client.createCalendar({
  oauth_client_id: "your-oauth-client-id",
  oauth_client_secret: "your-oauth-client-secret",
  oauth_refresh_token: "your-oauth-refresh-token",
  platform: "Google"
});

if (calendarResult.success) {
  const calendarsResult = await client.listCalendars();
  if (calendarsResult.success) {
    console.log("Calendars:", calendarsResult.data);
  }
  
  const eventsResult = await client.listCalendarEvents({
    calendar_id: calendarResult.data.calendar.uuid
  });
  
  if (eventsResult.success) {
    console.log("Events:", eventsResult.data);
  }
} else {
  console.error("Error creating calendar:", calendarResult.error);
}
```

## 🧪 Testing Your Migration

After migrating, test your code thoroughly:

1. **Run your existing tests** to ensure they still pass
2. **Test error scenarios** to verify error handling works correctly
3. **Check TypeScript compilation** for any type errors
4. **Verify API calls** work as expected

## 🆘 Common Issues

### Issue 1: TypeScript Errors

If you see TypeScript errors about missing properties, check that you've updated all parameter names to snake_case.

### Issue 2: Runtime Errors

If you see runtime errors about missing methods, ensure you're using `createBaasClient()` instead of `new BaasClient()`.

### Issue 3: Undefined Results

If you're getting undefined results, make sure you're checking `result.success` before accessing `result.data`.

### Issue 4: Parameter Validation Errors

If you see Zod validation errors, check that all required parameters are provided and have the correct types.

## 📞 Getting Help

If you encounter issues during migration:

1. Check this migration guide
2. Review the [README.md](README.md) for current usage examples
3. Open an issue on GitHub with details about your specific problem
4. Join our [Discord community](https://discord.com/invite/dsvFgDTr6c) for support

## 🎉 Benefits of v5.0.0

After migration, you'll enjoy:

- **Better TypeScript support** with full type safety
- **Improved error handling** with discriminated unions
- **Automatic parameter validation** preventing runtime errors
- **Tree-shakeable bundle** for smaller application sizes
- **Comprehensive testing** ensuring reliability
- **Cleaner API** focused on core functionality

The migration effort is worth it for the improved developer experience and reliability!

---

## Migration Guide: v5.x to v6.0.0

This guide helps you migrate from Meeting BaaS SDK v5.x to v6.0.0. Version 6.0.0 adds support for Meeting BaaS v2 API while maintaining full backward compatibility with v1 API.

## 🚀 What's New in v6.0.0

- **Dual API Support**: Support for both Meeting BaaS v1 and v2 APIs in parallel
- **Type-Safe Version Selection**: TypeScript automatically infers available methods based on `api_version`
- **Pass-Through v2 Responses**: v2 API responses are passed through without transformation (API already returns correct format)
- **Backward Compatible**: All existing v1 code continues to work without changes
- **Easy Migration Path**: Simply change `api_version: "v2"` to migrate to v2 API

## ⚠️ No Breaking Changes

v6.0.0 is **fully backward compatible** with v5.x. All existing code using v1 API will continue to work without any changes.

## 📋 Using v2 API

### Basic Usage

To use the v2 API, simply specify `api_version: "v2"` when creating the client:

```typescript
import { createBaasClient } from "@meeting-baas/sdk";

// v1 API (default, backward compatible)
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

### Type-Safe Method Access

TypeScript automatically infers which methods are available based on the API version:

```typescript
// v1 client - only v1 methods available
const v1Client = createBaasClient({ api_key: "key" });
v1Client.joinMeeting({ ... }); // ✅ Available
v1Client.createBot({ ... }); // ❌ TypeScript error - not available

// v2 client - only v2 methods available
const v2Client = createBaasClient({ api_key: "key", api_version: "v2" });
v2Client.createBot({ ... }); // ✅ Available
v2Client.joinMeeting({ ... }); // ❌ TypeScript error - not available
```

### Response Format Differences

**v1 API Response**:

```typescript
type ApiResponse<T> =
  | { success: true; data: T; error?: never }
  | { success: false; error: ZodError | Error; data?: never }
```

**v2 API Response**:

```typescript
type ApiResponseV2<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string; statusCode: number; details: unknown | null }
```

**Key Differences**:

- v1: SDK wraps responses, `error` can be `ZodError | Error`
- v2: API already returns structured format, SDK passes through as-is
- v2 error responses include `code`, `statusCode`, and `details` fields

### Batch Routes (v2)

v2 batch routes return a special format for partial success:

```typescript
// Batch response format
{
  success: true,
  data: [...], // Successful items
  errors: [...] // Failed items with error details
}

// Example: batchCreateBots
const result = await v2Client.batchCreateBots({
  bots: [...]
});

if (result.success) {
  console.log("Successful:", result.data);
  if (result.errors.length > 0) {
    console.log("Failed:", result.errors);
  }
}
```

## 🔄 v2 Migration Examples

### Example 1: Migrating from v1 to v2

**Before (v1 API)**:

```typescript
import { createBaasClient } from "@meeting-baas/sdk";

const client = createBaasClient({
  api_key: "your-api-key"
});

const result = await client.joinMeeting({
  meeting_url: "https://meet.google.com/abc-def-ghi",
  bot_name: "My Bot",
  reserved: true
});

if (result.success) {
  console.log("Bot ID:", result.data.bot_id);
}
```

**After (v2 API)**:

```typescript
import { createBaasClient } from "@meeting-baas/sdk";

const client = createBaasClient({
  api_key: "your-api-key",
  api_version: "v2" // Only change needed!
});

// v2 uses createBot instead of joinMeeting
const result = await client.createBot({
  meeting_url: "https://meet.google.com/abc-def-ghi",
  bot_name: "My Bot"
});

if (result.success) {
  console.log("Bot ID:", result.data.bot_id);
} else {
  // v2 error format includes code and statusCode
  console.error("Error:", result.error);
  console.error("Code:", result.code);
  console.error("Status:", result.statusCode);
}
```

### Example 2: Using Both APIs in Parallel

You can use both APIs in the same codebase:

```typescript
import { createBaasClient } from "@meeting-baas/sdk";

const v1Client = createBaasClient({
  api_key: "your-api-key",
  api_version: "v1"
});

const v2Client = createBaasClient({
  api_key: "your-api-key",
  api_version: "v2"
});

// Use v1 for legacy operations
const v1Result = await v1Client.joinMeeting({ ... });

// Use v2 for new features
const v2Result = await v2Client.createBot({ ... });
```

## 📋 v2 Migration Checklist

### Step 1: Update Dependencies to SDK v6

```bash
# Update to v6.0.0
npm install @meeting-baas/sdk@^6.0.0
# or
yarn add @meeting-baas/sdk@^6.0.0
# or
pnpm add @meeting-baas/sdk@^6.0.0
```

### Step 2: Test Existing Code

All existing v1 code should continue to work without changes. Test your application to ensure everything works as expected.

### Step 3: Migrate to v2 (Optional)

If you want to use v2 API:

1. **Update client creation** to include `api_version: "v2"`
2. **Update method calls** to use v2 method names (e.g., `createBot` instead of `joinMeeting`)
3. **Update error handling** to use v2 error format (`code`, `statusCode`, `details`)
4. **Handle batch responses** if using batch operations (check `errors` array)

### Step 4: Update Type Imports (if needed)

If you're importing types, they're now organized by version:

```typescript
// v1 types (from generated/v1/schema)
import type { JoinRequest, JoinResponse } from "@meeting-baas/sdk";

// v2 types (from generated/v2/schema)
import type { CreateBotRequest, CreateBotResponse } from "@meeting-baas/sdk";
```

## 🆘 Common Issues when migrating to v6

### Issue 1: TypeScript Shows Wrong Methods

**Problem**: TypeScript shows v1 methods when you want v2, or vice versa.

**Solution**: Ensure `api_version` is correctly set in the client configuration. TypeScript infers methods based on this value.

```typescript
// Correct
const client = createBaasClient({
  api_key: "key",
  api_version: "v2" // Must be explicitly set for v2
});
```

### Issue 2: Error Handling Differences

**Problem**: v2 error format is different from v1.

**Solution**: Update error handling to use v2 error fields:

```typescript
// v1 error handling
if (!result.success) {
  console.error(result.error); // ZodError | Error
}

// v2 error handling
if (!result.success) {
  console.error(result.error); // string
  console.error(result.code); // string
  console.error(result.statusCode); // number
  console.error(result.details); // unknown | null
}
```

### Issue 3: Batch Route Errors

**Problem**: Batch routes return `success: true` even when some items fail.

**Solution**: Check the `errors` array for partial failures:

```typescript
const result = await client.batchCreateBots({ bots: [...] });

if (result.success) {
  if (result.errors.length > 0) {
    // Some items failed
    console.log("Partial success:", result.data);
    console.log("Errors:", result.errors);
  } else {
    // All items succeeded
    console.log("All succeeded:", result.data);
  }
}
```

## 🎉 Benefits of v6.0.0

After upgrading, you'll enjoy:

- **Dual API Support**: Use both v1 and v2 APIs as needed
- **Type Safety**: TypeScript ensures you only use methods available for your selected API version
- **Easy Migration**: Simple configuration change to migrate to v2
- **Backward Compatible**: All existing v1 code continues to work
- **Future-Proof**: Ready for v2 API features and improvements

The upgrade is seamless - your existing code continues to work, and you can migrate to v2 at your own pace!
