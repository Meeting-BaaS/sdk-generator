# Adding a New API Version (e.g., v3)

This guide provides a step-by-step process for adding a new API version to the SDK. Use this as a generic template for adding v3, v4, or any new API provider.

## Overview

The SDK uses a **multi-version architecture** where:
- OpenAPI specs are fetched from live URLs and code is auto-generated
- Each version has isolated generated code in `src/generated/{version}/`
- A factory pattern routes to version-specific methods
- All versions are bundled into a single npm package with tree-shaking

## Files That Need Modification

When adding a new API version, you'll need to update these files:

### Core Implementation Files
1. **`orval.config.ts`** - OpenAPI code generation config
2. **`package.json`** - Build and generation scripts
3. **`src/node/api.ts`** - Response type definitions and wrappers
4. **`src/node/{version}-methods.ts`** - **NEW FILE** - Method implementations
5. **`src/node/types.d.ts`** - TypeScript type definitions
6. **`src/node/client.ts`** - Client factory routing
7. **`src/node/client-state.ts`** - State management (if base URL differs)
8. **`src/index.ts`** - Main package exports

### Documentation Files
9. **`typedoc.{version}.config.mjs`** - **NEW FILE** - Documentation config
10. **`README.md`** - Usage documentation

---

## Step-by-Step: Adding v3 API

### Step 1: Generate v3 Types from OpenAPI

#### A. Update `orval.config.ts`

```typescript
// Add v3 input configuration
const V3_INPUT = {
  target: "https://api.meetingbaas.com/v3/openapi.json"
}

export default defineConfig({
  // ... existing v1 and v2 configs ...

  // v3 API generation
  baasApiV3: {
    input: V3_INPUT,
    output: {
      target: "./src/generated/v3/api",
      schemas: "./src/generated/v3/schema",
      client: "axios-functions",
      mode: "tags-split",
      biome: true,
      mock: {
        type: "msw",
        baseUrl: "https://api.meetingbaas.com"
      }
    }
  },

  // Generate Zod schemas for v3
  baasZodV3: {
    input: V3_INPUT,
    output: {
      target: "./src/generated/v3/api",
      client: "zod",
      mode: "tags-split",
      fileExtension: ".zod.ts",
      biome: true
    }
  }
})
```

#### B. Add generation scripts to `package.json`

```json
{
  "scripts": {
    "openapi:clean:v3": "rm -rf src/generated/v3",
    "openapi:generate:v3": "pnpm openapi:clean:v3 && orval --config orval.config.ts baasApiV3 baasZodV3",
    "openapi:rebuild:v3": "pnpm openapi:generate:v3 && pnpm build",

    "docs:generate:v3": "typedoc --options typedoc.v3.config.mjs",
    "docs:generate": "pnpm docs:clean && pnpm docs:generate:v1 && pnpm docs:generate:v2 && pnpm docs:generate:v3 && pnpm docs:generate:client"
  }
}
```

**Note:** The main `openapi:generate` script will automatically include v3 once configured in `orval.config.ts`.

#### C. Generate the types

```bash
pnpm openapi:generate:v3
```

---

### Step 2: Define v3 Response Types and Wrapper

#### Update `src/node/api.ts`

Add v3 response type and wrapper function. **Note:** Adjust the response structure based on your actual v3 API format.

```typescript
// Existing types...
export type ApiResponseV1<T> = ...
export type ApiResponseV2<T> = ...

/**
 * v3 API response type
 * Adjust fields based on your actual v3 API response format
 */
export type ApiResponseV3<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      statusCode: number;
      code: string;
      message: string;
      details: string | null;
      // Add any v3-specific fields
      requestId?: string;
      retryAfter?: number | null;
    }

/**
 * v3 Batch response (if applicable)
 */
export type BatchApiResponseV3<TData, TError> = {
  success: true;
  data: TData[];
  errors: TError[];
}

/**
 * v3 List response (if applicable)
 */
export type ListApiResponseV3<T> = {
  success: true;
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * v3 API wrapper - simpler pattern for cleaner code
 * Wraps API calls and standardizes error handling
 */
export async function apiWrapperV3<T>(
  fn: () => Promise<T>
): Promise<ApiResponseV3<T>> {
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

**Key Design Decision:** This uses a **simpler wrapper pattern** that doesn't include Zod validation. The validation happens at the API level or can be added in individual methods if needed.

---

### Step 3: Create v3 Methods Implementation

#### Create `src/node/v3-methods.ts`

This file implements wrapper methods for all v3 endpoints. The methods use dynamic imports for tree-shaking.

```typescript
import type { ClientState } from "./client-state"
import type { BaasClientV3Methods } from "./types.d"
import { apiWrapperV3 } from "./api"

// Import generated functions - adjust paths based on actual tag names from OpenAPI
import * as BotsV3 from "../generated/v3/api/bots/bots"
import * as CalendarsV3 from "../generated/v3/api/calendars/calendars"
// ... import other v3 API modules

/**
 * Create v3 client methods
 * Methods use pass-through responses (ApiResponseV3<T>)
 */
export function createV3Methods(state: ClientState): BaasClientV3Methods {
  // Helper to get request config
  const getRequestConfig = () => ({
    baseURL: state.baseUrl,
    headers: state.headers,
    timeout: state.timeout
  })

  return {
    /**
     * Create a bot (v3 API)
     * @param params - Bot creation parameters
     * @returns The response from the create bot request
     */
    createBot: (params) =>
      apiWrapperV3(() =>
        BotsV3.createBot(params, getRequestConfig())
      ),

    /**
     * Get bot details
     * @param botId - The bot ID
     */
    getBotDetails: (botId) =>
      apiWrapperV3(() =>
        BotsV3.getBotDetails(botId, getRequestConfig())
      ),

    /**
     * List bots with optional filtering
     * @param params - Optional filter parameters
     */
    listBots: (params) =>
      apiWrapperV3(() =>
        BotsV3.listBots(params, getRequestConfig())
      ),

    /**
     * Leave a meeting
     * @param botId - The bot ID
     */
    leaveBot: (botId) =>
      apiWrapperV3(() =>
        BotsV3.leaveBot(botId, getRequestConfig())
      ),

    // Calendar methods
    listCalendars: () =>
      apiWrapperV3(() =>
        CalendarsV3.listCalendars(getRequestConfig())
      ),

    // Add all other v3 methods following the same pattern...
  }
}
```

**Pattern Notes:**
- Use arrow functions for concise method definitions
- `getRequestConfig()` helper provides consistent request configuration
- Dynamic imports happen at module load (not per-call) for better performance
- `apiWrapperV3` handles all error standardization

**After Generation:** Update the import paths and function names to match what Orval actually generates from your OpenAPI spec.

---

### Step 4: Update Type Definitions

#### Update `src/node/types.d.ts`

Add v3 configuration and method interfaces:

```typescript
import type {
  // Import v3 request/response types from generated schema
  CreateBotRequestV3,
  BotResponseV3,
  ListBotsParamsV3,
  BotsListResponseV3,
  CalendarResponseV3
  // ... import all v3 types you need
} from "../generated/v3/schema"

// Update ApiResponse imports
import type {
  ApiResponse,
  ApiResponseV2,
  ApiResponseV3,
  BatchApiResponseV3,
  ListApiResponseV3
} from "./api"

/**
 * Configuration for the BaasClient
 */
export interface BaasClientConfig {
  api_key: string
  /**
   * API version to use
   * - "v1": Meeting BaaS v1 API (default, for backward compatibility)
   * - "v2": Meeting BaaS v2 API
   * - "v3": Meeting BaaS v3 API (latest)
   * @default "v1"
   */
  api_version?: "v1" | "v2" | "v3"
  base_url?: string
  timeout?: number
}

/**
 * v3-specific configuration
 */
export interface BaasClientConfigV3 extends Omit<BaasClientConfig, "api_version"> {
  api_version: "v3"
  base_url?: string  // Optional, defaults based on provider
}

/**
 * v3 Client methods interface
 * Define all v3 methods with their parameter and return types
 */
export interface BaasClientV3Methods {
  // Bot Management
  createBot(params: CreateBotRequestV3): Promise<ApiResponseV3<BotResponseV3>>
  getBotDetails(botId: string): Promise<ApiResponseV3<BotResponseV3>>
  listBots(params?: ListBotsParamsV3): Promise<ApiResponseV3<BotsListResponseV3>>
  leaveBot(botId: string): Promise<ApiResponseV3<void>>

  // Calendar Operations
  listCalendars(): Promise<ApiResponseV3<CalendarResponseV3[]>>
  connectCalendar(params: ConnectCalendarRequestV3): Promise<ApiResponseV3<CalendarResponseV3>>

  // Add all other v3 methods...
}
```

**Important Notes:**
- Import only the types you actually use (tree-shaking friendly)
- Type names will match what Orval generates from your OpenAPI spec
- Update these after running `pnpm openapi:generate:v3` to see actual type names

---

### Step 5: Update Client Factory

#### Update `src/node/client.ts`

Add v3 routing to the client factory:

```typescript
import { ClientState } from "./client-state"
import { createV1Methods } from "./v1-methods"
import { createV2Methods } from "./v2-methods"
import { createV3Methods } from "./v3-methods"  // Add import
import type {
  BaasClientConfig,
  BaasClientConfigV1,
  BaasClientConfigV2,
  BaasClientConfigV3,  // Add type import
  BaasClientV1Methods,
  BaasClientV2Methods,
  BaasClientV3Methods  // Add type import
} from "./types.d"

/**
 * Conditional client type based on API version
 * Ensures type-safe method access based on selected version
 */
export type BaasClient<V extends "v1" | "v2" | "v3" = "v1"> =
  V extends "v1" ? BaasClientV1Methods :
  V extends "v2" ? BaasClientV2Methods :
  V extends "v3" ? BaasClientV3Methods :
  never

// Function overloads for type-safe version selection
export function createBaasClient(config: BaasClientConfigV1): BaasClient<"v1">
export function createBaasClient(config: BaasClientConfigV2): BaasClient<"v2">
export function createBaasClient(config: BaasClientConfigV3): BaasClient<"v3">  // Add overload
export function createBaasClient(config: BaasClientConfig): BaasClient<"v1" | "v2" | "v3">

// Implementation
export function createBaasClient(config: BaasClientConfig) {
  const state = new ClientState(config)
  const apiVersion = config.api_version ?? "v1"

  // Route to appropriate version
  if (apiVersion === "v3") {
    return createV3Methods(state) as any
  }
  if (apiVersion === "v2") {
    return createV2Methods(state) as any
  }
  return createV1Methods(state) as any  // Default to v1
}
```

**Key Points:**
- TypeScript ensures only v3 methods are available when `api_version: "v3"` is used
- Factory pattern makes it easy to add new versions
- ClientState handles version-specific configuration (base URLs, headers, etc.)

---

### Step 6: Update Documentation Generation

#### Create `typedoc.v3.config.mjs`

```javascript
/** @type {import('typedoc').TypeDocOptions} */
export default {
  // V3 API Documentation - Include methods AND types
  entryPoints: [
    "./src/node/v3-methods.ts",
    "./src/node/types.d.ts"
  ],

  out: "./docs/generated/v3",
  plugin: ["typedoc-plugin-markdown"],

  // Output settings
  outputFileStrategy: "modules",
  readme: "none",

  // Source settings
  disableSources: true,
  excludeExternals: true,
  excludePrivate: true,
  excludeProtected: true,
  excludeInternal: true,

  // Exclude test files and other API versions
  exclude: [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/test/**/*",
    "**/src/node/v1-methods.ts",
    "**/src/node/v2-methods.ts",
    "**/src/generated/v1/**/*",
    "**/src/generated/v2/**/*"
  ],

  includeVersion: true,
  tsconfig: "./tsconfig.json",

  // Organization
  categorizeByGroup: true,
  defaultCategory: "Methods",

  sort: ["kind", "required-first", "alphabetical"],
  sortEntryPoints: true,

  kindSortOrder: [
    "Function",
    "Interface",
    "TypeAlias"
  ],

  // Limit depth for readability
  maxTypeConversionDepth: 4,

  hideGenerator: true,
  githubPages: false,

  name: "@meeting-baas/sdk - v3 API Reference"
};
```

**Note:** The docs generation scripts were already added in Step 1B when updating `package.json`.

---

### Step 7: Update Main Index Export

#### Update `src/index.ts`

Add v3 exports to the main entry point:

```typescript
// Main SDK Export file

// v1 exports (backward compatibility) - existing
export * from "./generated/v1/api/calendars/calendars.zod"
export * from "./generated/v1/api/default/default.zod"
export * from "./generated/v1/api/webhooks/webhooks.zod"
export * from "./generated/v1/schema"

// v2 exports (namespaced) - existing
export * as V2Zod from "./generated/v2/api/bots/bots.zod"
export * as V2ZodCalendars from "./generated/v2/api/calendars/calendars.zod"
export * as V2 from "./generated/v2/schema"

// v3 exports (namespaced) - ADD THESE
export * as V3Zod from "./generated/v3/api/bots/bots.zod"
export * as V3ZodCalendars from "./generated/v3/api/calendars/calendars.zod"
// Add exports for all v3 API modules
export * as V3 from "./generated/v3/schema"

// Client factory and types
export { type BaasClient, createBaasClient } from "./node/client"
export * from "./node/types.d"
```

**Usage after publishing:**
```typescript
import { createBaasClient, V3 } from "@meeting-baas/sdk"

// Types are available under V3 namespace
const params: V3.CreateBotRequest = { ... }
```

---

### Step 8: Update Client State (if needed)

#### Update `src/node/client-state.ts`

If your v3 API uses a different base URL or requires different configuration, update ClientState:

```typescript
export class ClientState {
  public readonly baseUrl: string
  public readonly headers: Record<string, string>
  public readonly timeout: number
  private apiVersion: "v1" | "v2" | "v3"  // Add "v3"

  constructor(config: BaasClientConfig) {
    this.apiVersion = config.api_version ?? "v1"

    // Set default base URL based on version
    if (this.apiVersion === "v3") {
      // If v3 uses a different base URL
      this.baseUrl = config.base_url ?? "https://api.v3.example.com"
    } else {
      this.baseUrl = config.base_url ?? "https://api.meetingbaas.com"
    }

    // Set headers (adjust if v3 uses different auth header)
    this.headers = {
      "X-API-Key": config.api_key,
      "Content-Type": "application/json"
    }

    this.timeout = config.timeout ?? 30000
  }

  getApiVersion(): "v1" | "v2" | "v3" {
    return this.apiVersion
  }
}
```

**Note:** Only update this if v3 requires different base URLs or headers. If v3 uses the same infrastructure as v2, you may not need changes here.

---

## Summary: Files to Modify for New API Version

### Required Changes (Core Functionality)

1. ✅ **`orval.config.ts`** - Add v3 OpenAPI generation config
2. ✅ **`package.json`** - Add v3 scripts (`openapi:generate:v3`, `openapi:rebuild:v3`, `docs:generate:v3`)
3. ✅ **`src/node/api.ts`** - Add `ApiResponseV3<T>` and `apiWrapperV3()`
4. ✅ **`src/node/v3-methods.ts`** - **CREATE NEW FILE** - Implement all v3 methods
5. ✅ **`src/node/types.d.ts`** - Add v3 types, `BaasClientConfigV3`, `BaasClientV3Methods`
6. ✅ **`src/node/client.ts`** - Add v3 routing in `createBaasClient()`
7. ✅ **`src/node/client-state.ts`** - Update API version type (and base URL logic if needed)
8. ✅ **`src/index.ts`** - Export v3 types and Zod schemas

### Required Changes (Documentation)

9. ✅ **`typedoc.v3.config.mjs`** - **CREATE NEW FILE** - v3 docs config
10. ✅ **`README.md`** - Document v3 API with usage examples

### Optional Changes

11. ⚠️ **Tests** - Add v3 integration tests
12. ⚠️ **`MIGRATION.md`** - Update if there are breaking changes
13. ⚠️ **`docs/generated/INDEX.md`** - Add v3 to API comparison table

---

## Checklist: Adding v3 API

### Configuration & Setup
- [ ] Add v3 OpenAPI config to `orval.config.ts`
- [ ] Add v3 scripts to `package.json`
- [ ] Create `typedoc.v3.config.mjs`
- [ ] Run `pnpm openapi:generate:v3` to generate types

### Core Implementation
- [ ] Add `ApiResponseV3<T>` and `apiWrapperV3()` to `src/node/api.ts`
- [ ] Create `src/node/v3-methods.ts` with all method implementations
- [ ] Add v3 types to `src/node/types.d.ts` (`BaasClientConfigV3`, `BaasClientV3Methods`)
- [ ] Update `src/node/client.ts` with v3 routing
- [ ] Update `src/node/client-state.ts` API version type
- [ ] Export v3 types/schemas in `src/index.ts`

### Testing & Verification
- [ ] Build SDK: `pnpm build`
- [ ] Test v3 client locally with real API calls
- [ ] Write integration tests for v3 methods
- [ ] Run full test suite: `pnpm test`

### Documentation
- [ ] Generate docs: `pnpm docs:generate`
- [ ] Update `README.md` with v3 usage examples
- [ ] Update `MIGRATION.md` if breaking changes
- [ ] Update `docs/generated/INDEX.md` comparison table (optional)

### Final Steps
- [ ] Verify all TypeScript types are correct
- [ ] Check that tree-shaking works (test bundle size)
- [ ] Commit changes and create PR
- [ ] Ensure GitHub Actions tests pass

---

## Difficulty Level

**Difficulty: Medium** (2-3 hours for experienced developer)

**Why it's manageable:**
1. **Pattern is established** - Follow the v2 structure exactly
2. **Types are auto-generated** - Orval generates TypeScript from OpenAPI
3. **Factory pattern is simple** - Just add one conditional branch
4. **Documentation is automated** - TypeDoc generates from code
5. **Simpler wrapper pattern** - No complex validation logic needed

**Main effort:**
- Writing/wrapping each individual method in `v3-methods.ts` (repetitive but straightforward)
- Testing all methods work correctly with real API calls

**What could be automated:**
- A code generator script that reads the OpenAPI spec and auto-generates `v3-methods.ts`
- Script to auto-update type imports in `types.d.ts`

---

## Troubleshooting

### Issue: Generated function names don't match examples

**Solution:** After running `pnpm openapi:generate:v3`, check the actual function names in `src/generated/v3/api/*/` and update your imports in `src/node/v3-methods.ts` accordingly. Function names are based on OpenAPI `operationId` fields.

### Issue: Type errors in client.ts

**Solution:** Ensure all interfaces (`BaasClientConfigV3`, `BaasClientV3Methods`) are properly exported from `types.d.ts` and imported in `client.ts`. Check that the conditional type in `BaasClient<V>` includes v3.

### Issue: Base URL not working

**Solution:** Verify the base URL logic in `src/node/client-state.ts`. If v3 uses a different API domain, add conditional logic in the constructor to set the correct `baseUrl`.

### Issue: Authentication failing

**Solution:** Check if v3 uses different authentication headers. Update the `headers` object in `ClientState` constructor if v3 requires different auth (e.g., `Authorization: Bearer` vs `X-API-Key`).

### Issue: Build fails with module not found

**Solution:** Ensure you've run `pnpm openapi:generate:v3` before building. The generated files must exist before TypeScript can compile the wrapper code.

### Issue: Tree-shaking not working (large bundle)

**Solution:** Verify you're using arrow function syntax in methods (as shown in Step 3) and that imports are at the top of `v3-methods.ts`, not inside each method.

---

## Automated Updates

Once v3 is integrated, it will be automatically included in the daily update workflow:

1. **Daily Cron**: GitHub Actions runs at 2 AM UTC
2. **Fetch Specs**: Pulls latest OpenAPI specs for v1, v2, and v3
3. **Generate Code**: Runs `pnpm openapi:rebuild` (includes all versions)
4. **Detect Changes**: Checks if any API changed
5. **Test**: Runs full test suite across Node 18-22
6. **Publish**: Auto-publishes to npm if tests pass
7. **Release**: Creates GitHub release with auto-generated notes

No manual intervention required after initial setup!
