# Adding Vexa API Integration

This guide provides step-by-step instructions for integrating the Vexa API as a third API option alongside v1 and v2 in the Meeting BaaS SDK.

## Overview

The Vexa API will be added as a new `api_version` option ("vexa") that users can select when creating a BaaS client. The integration follows the same architectural pattern established for v1 and v2, ensuring consistency and maintainability.

## Current Architecture Summary

The SDK uses a multi-version architecture where:

- **OpenAPI specs** are fetched from live URLs and code is auto-generated using Orval
- **Generated code** is placed in version-specific directories (`src/generated/v1/`, `src/generated/v2/`)
- **Client factory** (`createBaasClient`) routes to version-specific methods based on `api_version` config
- **All versions** are bundled into a single npm package with tree-shaking support
- **Automated updates** run daily via GitHub Actions to keep SDK in sync with live APIs

## Vexa API Details

- **Base URL**: `https://api.cloud.vexa.ai`
- **OpenAPI Spec**: `https://api.cloud.vexa.ai/openapi.json`
- **Authentication**: `X-API-Key` header
- **Main Features**:
  - Bot Management (request, stop, status, config updates)
  - Transcriptions (get transcripts, list meetings)
  - Meeting Management (delete, update metadata)
  - User webhook configuration
  - Admin operations

### Key Differences from v1/v2

- **Platform-based routing**: Endpoints use `{platform}/{native_meeting_id}` path parameters
- **Supported platforms**: `google_meet`, `zoom`, `teams`
- **Different resource model**: Focus on bot lifecycle and transcription retrieval vs. v1/v2's join/leave pattern

## Implementation Steps

### Step 1: Update Orval Configuration

**File**: `orval.config.ts`

Add Vexa input source and generation configs:

```typescript
import { defineConfig } from "orval"

const V1_INPUT = {
  target: "https://api.meetingbaas.com/openapi.json",
  override: {
    transformer: "./scripts/preprocess.js"
  }
}

const V2_INPUT = {
  target: "https://api.meetingbaas.com/v2/openapi.json"
}

// Add Vexa input
const VEXA_INPUT = {
  target: "https://api.cloud.vexa.ai/openapi.json"
  // Note: Add transformer if preprocessing is needed after first run
}

export default defineConfig({
  // v1 API generation (existing)
  baasApiV1: {
    input: V1_INPUT,
    output: {
      target: "./src/generated/v1/api",
      schemas: "./src/generated/v1/schema",
      client: "axios-functions",
      mode: "tags-split",
      biome: true,
      mock: {
        type: "msw",
        baseUrl: "https://api.meetingbaas.com"
      }
    }
  },
  baasZodV1: {
    input: V1_INPUT,
    output: {
      target: "./src/generated/v1/api",
      client: "zod",
      mode: "tags-split",
      fileExtension: ".zod.ts",
      biome: true
    }
  },

  // v2 API generation (existing)
  baasApiV2: {
    input: V2_INPUT,
    output: {
      target: "./src/generated/v2/api",
      schemas: "./src/generated/v2/schema",
      client: "axios-functions",
      mode: "tags-split",
      biome: true,
      mock: {
        type: "msw",
        baseUrl: "https://api.meetingbaas.com"
      }
    }
  },
  baasZodV2: {
    input: V2_INPUT,
    output: {
      target: "./src/generated/v2/api",
      client: "zod",
      mode: "tags-split",
      fileExtension: ".zod.ts",
      biome: true
    }
  },

  // Vexa API generation (new)
  baasApiVexa: {
    input: VEXA_INPUT,
    output: {
      target: "./src/generated/vexa/api",
      schemas: "./src/generated/vexa/schema",
      client: "axios-functions",
      mode: "tags-split",
      biome: true,
      mock: {
        type: "msw",
        baseUrl: "https://api.cloud.vexa.ai"
      }
    }
  },
  baasZodVexa: {
    input: VEXA_INPUT,
    output: {
      target: "./src/generated/vexa/api",
      client: "zod",
      mode: "tags-split",
      fileExtension: ".zod.ts",
      biome: true
    }
  }
})
```

**Expected Generated Structure:**
```
src/generated/vexa/
├── api/
│   ├── bot-management/
│   │   ├── bot-management.ts       # API functions
│   │   └── bot-management.zod.ts   # Zod schemas
│   ├── transcriptions/
│   │   ├── transcriptions.ts
│   │   └── transcriptions.zod.ts
│   ├── administration/
│   │   ├── administration.ts
│   │   └── administration.zod.ts
│   └── user/
│       ├── user.ts
│       └── user.zod.ts
└── schema/                         # TypeScript type definitions
```

### Step 2: Add Package.json Scripts

**File**: `package.json`

Add Vexa-specific scripts and update main scripts:

```json
{
  "scripts": {
    "openapi:clean:vexa": "rm -rf src/generated/vexa",
    "openapi:generate:vexa": "pnpm openapi:clean:vexa && orval --config orval.config.ts baasApiVexa baasZodVexa",
    "openapi:rebuild:vexa": "pnpm openapi:generate:vexa && pnpm build",

    "docs:generate:vexa": "typedoc --options typedoc.vexa.config.mjs",
    "docs:generate": "pnpm docs:clean && pnpm docs:generate:v1 && pnpm docs:generate:v2 && pnpm docs:generate:vexa && pnpm docs:generate:client"
  }
}
```

**Note**: The main `openapi:generate` script (which runs `orval` without specific configs) will automatically include Vexa once it's defined in `orval.config.ts`.

### Step 3: Define Response Types and Wrapper

**File**: `src/node/api.ts`

Add Vexa response type and wrapper function:

```typescript
// Existing types...
export type ApiResponseV1<T> = ...
export type ApiResponseV2<T> = ...

// Add Vexa response type
export type ApiResponseVexa<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      statusCode: number;
      code: string;
      message: string;
      details: string | null;
    }

// Add Vexa wrapper function
export async function apiWrapperVexa<T>(
  fn: () => Promise<T>
): Promise<ApiResponseVexa<T>> {
  try {
    const data = await fn()
    return { success: true, data }
  } catch (error: any) {
    const errorResponse = error.response?.data
    return {
      success: false,
      error: errorResponse?.error || error.message || "Unknown error",
      statusCode: error.response?.status || 500,
      code: errorResponse?.code || "UNKNOWN_ERROR",
      message: errorResponse?.message || error.message || "An error occurred",
      details: errorResponse?.details || null
    }
  }
}
```

### Step 4: Update Type Definitions

**File**: `src/node/types.d.ts`

Add Vexa to the config and define method interfaces:

```typescript
import type {
  MeetingResponse,
  TranscriptionResponse,
  BotStatusResponse,
  MeetingListResponse,
  Platform
} from "../generated/vexa/schema"

// Update BaasClientConfig to include "vexa"
export interface BaasClientConfig {
  api_key: string
  api_version?: "v1" | "v2" | "vexa"
  base_url?: string
  timeout?: number
}

// Add Vexa-specific config
export interface BaasClientConfigVexa extends Omit<BaasClientConfig, "api_version"> {
  api_version: "vexa"
  base_url?: string  // Defaults to https://api.cloud.vexa.ai
}

// Define Vexa method interfaces
export interface BaasClientVexaMethods {
  // Bot Management
  requestBot(params: {
    platform: Platform
    native_meeting_id: string
    bot_name?: string
    language?: string
    task?: string
    passcode?: string
  }): Promise<ApiResponseVexa<MeetingResponse>>

  stopBot(params: {
    platform: Platform
    native_meeting_id: string
  }): Promise<ApiResponseVexa<MeetingResponse>>

  getBotsStatus(): Promise<ApiResponseVexa<BotStatusResponse>>

  updateBotConfig(params: {
    platform: Platform
    native_meeting_id: string
    config: {
      language?: string
      task?: string
    }
  }): Promise<ApiResponseVexa<void>>

  // Transcriptions
  getTranscript(params: {
    platform: Platform
    native_meeting_id: string
  }): Promise<ApiResponseVexa<TranscriptionResponse>>

  getMeetings(): Promise<ApiResponseVexa<MeetingListResponse>>

  deleteMeeting(params: {
    platform: Platform
    native_meeting_id: string
  }): Promise<ApiResponseVexa<void>>

  updateMeetingData(params: {
    platform: Platform
    native_meeting_id: string
    data: {
      name?: string
      participants?: string[]
      languages?: string[]
      notes?: string
    }
  }): Promise<ApiResponseVexa<MeetingResponse>>

  // User
  setWebhook(params: {
    webhook_url: string
  }): Promise<ApiResponseVexa<void>>
}
```

### Step 5: Create Vexa Method Implementations

**File**: `src/node/vexa-methods.ts` (NEW FILE)

Create wrapper methods for all Vexa endpoints:

```typescript
import type { ClientState } from "./client-state"
import type { BaasClientVexaMethods } from "./types.d"
import { apiWrapperVexa } from "./api"

// Import generated functions (adjust paths based on actual tag names from OpenAPI)
import * as BotManagement from "../generated/vexa/api/bot-management/bot-management"
import * as Transcriptions from "../generated/vexa/api/transcriptions/transcriptions"
import * as User from "../generated/vexa/api/user/user"

export function createVexaMethods(state: ClientState): BaasClientVexaMethods {
  const getRequestConfig = () => ({
    baseURL: state.baseUrl,
    headers: state.headers,
    timeout: state.timeout
  })

  return {
    // Bot Management
    requestBot: (params) =>
      apiWrapperVexa(() =>
        BotManagement.requestBotProxyBotsPost({
          platform: params.platform,
          native_meeting_id: params.native_meeting_id,
          bot_name: params.bot_name,
          language: params.language,
          task: params.task,
          passcode: params.passcode
        }, getRequestConfig())
      ),

    stopBot: (params) =>
      apiWrapperVexa(() =>
        BotManagement.stopBotProxyBotsPlatformNativeMeetingIdDelete(
          params.platform,
          params.native_meeting_id,
          getRequestConfig()
        )
      ),

    getBotsStatus: () =>
      apiWrapperVexa(() =>
        BotManagement.getBotsStatusProxyBotsStatusGet(getRequestConfig())
      ),

    updateBotConfig: (params) =>
      apiWrapperVexa(() =>
        BotManagement.updateBotConfigProxyBotsPlatformNativeMeetingIdConfigPut(
          params.platform,
          params.native_meeting_id,
          params.config,
          getRequestConfig()
        )
      ),

    // Transcriptions
    getTranscript: (params) =>
      apiWrapperVexa(() =>
        Transcriptions.getTranscriptProxyTranscriptsPlatformNativeMeetingIdGet(
          params.platform,
          params.native_meeting_id,
          getRequestConfig()
        )
      ),

    getMeetings: () =>
      apiWrapperVexa(() =>
        Transcriptions.getMeetingsProxyMeetingsGet(getRequestConfig())
      ),

    deleteMeeting: (params) =>
      apiWrapperVexa(() =>
        Transcriptions.deleteMeetingProxyMeetingsPlatformNativeMeetingIdDelete(
          params.platform,
          params.native_meeting_id,
          getRequestConfig()
        )
      ),

    updateMeetingData: (params) =>
      apiWrapperVexa(() =>
        Transcriptions.updateMeetingDataProxyMeetingsPlatformNativeMeetingIdPatch(
          params.platform,
          params.native_meeting_id,
          { data: params.data },
          getRequestConfig()
        )
      ),

    // User
    setWebhook: (params) =>
      apiWrapperVexa(() =>
        User.setUserWebhookProxyUserWebhookPut(
          params,
          getRequestConfig()
        )
      )
  }
}
```

**Note**: Function names will be auto-generated by Orval based on the OpenAPI `operationId` fields. Adjust the import names after running `pnpm openapi:generate:vexa` to see the actual generated function names.

### Step 6: Update Client State

**File**: `src/node/client-state.ts`

Update the API version type to include "vexa":

```typescript
export class ClientState {
  public readonly baseUrl: string
  public readonly headers: Record<string, string>
  public readonly timeout: number
  private apiVersion: "v1" | "v2" | "vexa"  // Add "vexa"

  constructor(config: BaasClientConfig) {
    this.apiVersion = config.api_version ?? "v1"

    // Set default base URL based on version
    if (this.apiVersion === "vexa") {
      this.baseUrl = config.base_url ?? "https://api.cloud.vexa.ai"
    } else {
      this.baseUrl = config.base_url ?? "https://api.meetingbaas.com"
    }

    this.headers = {
      "X-API-Key": config.api_key,
      "Content-Type": "application/json"
    }
    this.timeout = config.timeout ?? 30000
  }

  getApiVersion(): "v1" | "v2" | "vexa" {
    return this.apiVersion
  }
}
```

### Step 7: Update Client Factory

**File**: `src/node/client.ts`

Add Vexa routing to the client factory:

```typescript
import { ClientState } from "./client-state"
import { createV1Methods } from "./v1-methods"
import { createV2Methods } from "./v2-methods"
import { createVexaMethods } from "./vexa-methods"  // Import new methods
import type {
  BaasClientConfig,
  BaasClientConfigV1,
  BaasClientConfigV2,
  BaasClientConfigVexa,  // Import new config
  BaasClientV1Methods,
  BaasClientV2Methods,
  BaasClientVexaMethods  // Import new methods type
} from "./types.d"

// Update type to include vexa
export type BaasClient<V extends "v1" | "v2" | "vexa" = "v1"> =
  V extends "v1" ? BaasClientV1Methods :
  V extends "v2" ? BaasClientV2Methods :
  V extends "vexa" ? BaasClientVexaMethods :
  never

// Add function overload for Vexa
export function createBaasClient(config: BaasClientConfigV1): BaasClient<"v1">
export function createBaasClient(config: BaasClientConfigV2): BaasClient<"v2">
export function createBaasClient(config: BaasClientConfigVexa): BaasClient<"vexa">
export function createBaasClient(config: BaasClientConfig): BaasClient<"v1" | "v2" | "vexa">

// Update implementation
export function createBaasClient(config: BaasClientConfig) {
  const state = new ClientState(config)
  const apiVersion = config.api_version ?? "v1"

  if (apiVersion === "vexa") {
    return createVexaMethods(state) as any
  }
  if (apiVersion === "v2") {
    return createV2Methods(state) as any
  }
  return createV1Methods(state) as any
}
```

### Step 8: Update Main Export

**File**: `src/index.ts`

Add Vexa exports:

```typescript
// Main SDK Export file

// v1 exports (backward compatibility)
export * from "./generated/v1/api/calendars/calendars.zod"
export * from "./generated/v1/api/default/default.zod"
export * from "./generated/v1/api/webhooks/webhooks.zod"
export * from "./generated/v1/schema"

// v2 exports (namespaced)
export * as V2Zod from "./generated/v2/api/bots/bots.zod"
export * as V2ZodCalendars from "./generated/v2/api/calendars/calendars.zod"
export * as V2 from "./generated/v2/schema"

// Vexa exports (namespaced)
export * as VexaZodBots from "./generated/vexa/api/bot-management/bot-management.zod"
export * as VexaZodTranscriptions from "./generated/vexa/api/transcriptions/transcriptions.zod"
export * as VexaZodUser from "./generated/vexa/api/user/user.zod"
export * as Vexa from "./generated/vexa/schema"

// Client factory and types
export { type BaasClient, createBaasClient } from "./node/client"
export * from "./node/types.d"
```

### Step 9: Create TypeDoc Configuration

**File**: `typedoc.vexa.config.mjs` (NEW FILE)

Create documentation configuration for Vexa:

```javascript
export default {
  entryPoints: [
    "./src/generated/vexa/api/bot-management/bot-management.ts",
    "./src/generated/vexa/api/transcriptions/transcriptions.ts",
    "./src/generated/vexa/api/user/user.ts",
    "./src/generated/vexa/schema/index.ts"
  ],
  out: "./docs/generated/vexa",
  plugin: ["typedoc-plugin-markdown"],
  entryPointStrategy: "expand",
  name: "Vexa API Reference",
  readme: "none",
  disableSources: true,
  excludePrivate: true,
  excludeProtected: true,
  excludeInternal: true,
  hideGenerator: true
}
```

### Step 10: Update Documentation

**File**: `README.md`

Add Vexa usage examples to the documentation:

```markdown
## API Versioning

The SDK supports multiple API versions through the `api_version` configuration option:

### v1 API (Default)
<!-- existing v1 examples -->

### v2 API
<!-- existing v2 examples -->

### Vexa API

```typescript
import { createBaasClient } from "@meeting-baas/sdk";

// Create a Vexa client
const client = createBaasClient({
  api_key: "your-vexa-api-key",
  api_version: "vexa"
});

async function example() {
  // Request a bot to join a meeting
  const { success, data, error } = await client.requestBot({
    platform: "google_meet",
    native_meeting_id: "abc-def-ghi",
    bot_name: "Vexa Transcription Bot"
  });

  if (success) {
    console.log("Bot requested successfully:", data);
  } else {
    console.error("Error requesting bot:", error);
  }

  // Get bot status
  const status = await client.getBotsStatus();
  if (status.success) {
    console.log("Running bots:", status.data.running_bots);
  }

  // Get transcript for a meeting
  const transcript = await client.getTranscript({
    platform: "google_meet",
    native_meeting_id: "abc-def-ghi"
  });

  if (transcript.success) {
    console.log("Transcript segments:", transcript.data.segments);
  }
}
```

**Type-Safe Version Selection:**

```typescript
// TypeScript ensures you only call methods available for each version
const vexaClient = createBaasClient({ api_key: "...", api_version: "vexa" })

vexaClient.requestBot(...)    // ✅ Available
vexaClient.getTranscript(...) // ✅ Available
vexaClient.joinMeeting(...)   // ❌ TypeScript error (v1 method)
vexaClient.createBot(...)     // ❌ TypeScript error (v2 method)
```
```

## Testing the Integration

### 1. Generate Vexa Types

```bash
pnpm openapi:generate:vexa
```

This will:
- Fetch the OpenAPI spec from `https://api.cloud.vexa.ai/openapi.json`
- Generate TypeScript types in `src/generated/vexa/schema/`
- Generate API functions in `src/generated/vexa/api/`
- Generate Zod schemas for validation

### 2. Verify Generated Files

Check that the following directories were created:
```
src/generated/vexa/
├── api/
│   ├── bot-management/
│   ├── transcriptions/
│   ├── user/
│   └── administration/
└── schema/
```

### 3. Update Function Names

Open `src/node/vexa-methods.ts` and verify/update the imported function names to match what was actually generated by Orval.

### 4. Build the SDK

```bash
pnpm build
```

### 5. Test Locally

Create a test file:

```typescript
// test-vexa.ts
import { createBaasClient } from "./dist/index.js"

const client = createBaasClient({
  api_key: process.env.VEXA_API_KEY!,
  api_version: "vexa"
})

async function test() {
  const result = await client.getBotsStatus()
  console.log(result)
}

test()
```

Run it:
```bash
VEXA_API_KEY=your-key node test-vexa.ts
```

### 6. Add Tests

Create integration tests in `test/integration/vexa.test.ts` following the pattern used for v1 and v2 tests.

## Automated Updates

Once integrated, the Vexa API will be automatically included in the daily update workflow:

1. **Daily Cron**: GitHub Actions runs at 2 AM UTC
2. **Fetch Specs**: Pulls latest OpenAPI specs for v1, v2, and Vexa
3. **Generate Code**: Runs `pnpm openapi:rebuild` (includes all versions)
4. **Check Changes**: Detects if any API changed
5. **Test**: Runs full test suite across Node 18-22
6. **Publish**: Auto-publishes new version to npm if tests pass
7. **Release**: Creates GitHub release with auto-generated notes

No manual intervention required!

## Troubleshooting

### Issue: Generated function names don't match

**Solution**: After running `pnpm openapi:generate:vexa`, check the actual function names in `src/generated/vexa/api/*/` and update `src/node/vexa-methods.ts` accordingly.

### Issue: Type errors in client.ts

**Solution**: Make sure all interfaces are properly exported from `types.d.ts` and imported in `client.ts`.

### Issue: Base URL not correct

**Solution**: Verify the `baseUrl` logic in `src/node/client-state.ts` defaults to `https://api.cloud.vexa.ai` for vexa.

### Issue: Authentication failing

**Solution**: Confirm the Vexa API uses `X-API-Key` header. If different, update the headers in `ClientState` constructor.

## Estimated Time

- **Setup and Configuration**: 30 minutes
- **Implementation**: 1-2 hours
- **Testing**: 30 minutes
- **Documentation**: 30 minutes

**Total**: 2-3 hours

## Checklist

- [ ] Update `orval.config.ts` with Vexa input and configs
- [ ] Add scripts to `package.json`
- [ ] Add Vexa response types to `src/node/api.ts`
- [ ] Update type definitions in `src/node/types.d.ts`
- [ ] Create `src/node/vexa-methods.ts` with method implementations
- [ ] Update `src/node/client-state.ts` to include "vexa"
- [ ] Update `src/node/client.ts` factory with Vexa routing
- [ ] Update `src/index.ts` with Vexa exports
- [ ] Create `typedoc.vexa.config.mjs`
- [ ] Update `README.md` with Vexa examples
- [ ] Run `pnpm openapi:generate:vexa`
- [ ] Verify generated files and update function names if needed
- [ ] Run `pnpm build`
- [ ] Test locally
- [ ] Add integration tests
- [ ] Update documentation
- [ ] Commit and push changes

## Support

For questions or issues with this integration, please refer to:
- [Vexa API Documentation](https://api.cloud.vexa.ai/docs)
- [SDK Development Guide](./DEVELOPMENT.md)
- [Adding New API Versions Guide](./ADDING_NEW_API_VERSION.md)
