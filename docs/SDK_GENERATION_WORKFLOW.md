# SDK Generation Workflow

Technical workflow for generating the Voice Router SDK from OpenAPI specifications.

## Pipeline Overview

```
OpenAPI Specs → Orval Generation → Post-Gen Fixes → TypeScript Build → TypeDoc Generation
```

**Technologies**: Orval (code generation), Biome (formatting), TypeDoc (docs), tsup (bundling)

---

## Phase 1: OpenAPI Specification Fetching

### Provider Specs

| Provider | Source | Type |
|----------|--------|------|
| Gladia | https://api.gladia.io/openapi.json | Remote |
| Deepgram | https://developers.deepgram.com/openapi.json | Remote |
| AssemblyAI | https://api.assemblyai.com/openapi.yml | Remote |
| Azure STT | `specs/azure-stt-api-v3.1.json` | Bundled |
| OpenAI Whisper | `specs/openai-whisper-openapi.yml` | Filtered |
| Speechmatics | `specs/speechmatics-batch.yaml` | Bundled |

### Commands

```bash
pnpm openapi:fetch      # Download specs
pnpm openapi:clean      # Clean generated/
pnpm openapi:generate   # Fetch + Generate types
```

**Config**: `orval.config.ts` defines all provider configurations.

---

## Phase 2: Type Generation with Orval

### Configuration (`orval.config.ts`)

```javascript
export default {
  gladia: {
    input: "https://api.gladia.io/openapi.json",
    output: {
      target: "./src/generated/gladia/api/gladiaControlAPI.ts",
      schemas: "./src/generated/gladia/schema",
      mode: "single",           // Single file (Node 18 compat)
      client: "axios"
    }
  },
  // ... 5 more providers
}
```

### Generation Process

```bash
pnpm orval
  ↓
Orval reads orval.config.ts
  ↓
For each provider:
  1. Fetch OpenAPI spec
  2. Parse schemas
  3. Generate TypeScript types
  4. Generate API client functions
  5. Format with Biome
```

### Output Structure

```
src/generated/
├── gladia/
│   ├── api/
│   │   └── gladiaControlAPI.ts       # 7,225 lines
│   │   └── gladiaControlAPI.zod.ts   # Zod schemas
│   └── schema/
│       ├── initTranscriptionRequest.ts
│       ├── preRecordedResponse.ts
│       └── ... (100+ types)
├── deepgram/
├── assemblyai/
└── ...
```

**Generated per provider**: ~3,000-8,000 lines of TypeScript types and API functions.

---

## Phase 2.5: Post-Generation Fixes

### The Problem

Orval generates invalid TypeScript in some cases:

1. Extra commas: `,export const foo`
2. Malformed Deepgram parameter files (14 files)
3. Duplicate object properties
4. Array default type inference issues
5. Unterminated string literals
6. Error type shadowing
7. FormData object append issues
8. Discriminated union issues
9. Empty zod.array() calls

### The Solution

**Script**: `scripts/fix-generated.js`

Automatically fixes all known issues before TypeScript compilation.

```bash
🔧 Fixing generated TypeScript files...
Found 3345 generated files to check

✅ Fixes applied:
  - Fixed duplicate properties in 14 Deepgram parameter files
  - Added type annotations to array defaults (3 files)
  - Added 'as any' fallback for 22 array defaults
  - Fixed FormData object append in OpenAI
```

### Fix Categories

**1. Deepgram Parameter File Reconstruction**

Before (malformed):
```typescript
export type SpeakV1EncodingParameter = typeof ...;
opus',
  aac: 'aac',
} as const
```

After (fixed):
```typescript
export type SpeakV1EncodingParameter = typeof SpeakV1EncodingParameter[keyof typeof SpeakV1EncodingParameter];

export const SpeakV1EncodingParameter = {
  opus: 'opus',
  aac: 'aac'
} as const
```

**2. Array Default Type Safety (Hybrid Approach)**

Tier 1 - Proper type annotations (nearby enums):
```typescript
export const arrayDefault: ("word" | "segment")[] = ["segment"]
```

Tier 2 - `as any` fallback (enums 600+ lines away):
```typescript
.default(constantName as any)
```

**Results**:
- OpenAI: 1 typed ✅
- Gladia: 2 typed ✅, 22 fallback
- Deepgram: 1 fallback

**Why?** Prioritizes type safety while maintaining build success. User requested "proper types where possible, `as any` only as fallback."

### Build Pipeline Integration

```bash
pnpm build
  ↓
prebuild hook
  ↓
pnpm openapi:fix-specs   # Fix spec validation
  ↓
pnpm openapi:fix         # Run fix-generated.js
  ↓
build:bundle             # TypeScript compile (0 errors)
  ↓
build:docs               # TypeDoc generate (success)
```

**Automatic**: Runs on every build via `prebuild` hook.

---

## Phase 2.6: Router Type Safety Enhancements

With all generated types properly fixed, we leverage them in the router layer.

### Enhancement 1: Provider-Specific Type Discrimination

```typescript
// Provider response map
export type ProviderRawResponseMap = {
  gladia: PreRecordedResponse
  deepgram: ListenV1Response
  "openai-whisper": CreateTranscription200One
  assemblyai: AssemblyAITranscript
  "azure-stt": AzureTranscription
}

// Generic parameter for type narrowing
export interface UnifiedTranscriptResponse<P extends TranscriptionProvider = TranscriptionProvider> {
  provider: P
  raw?: P extends keyof ProviderRawResponseMap ? ProviderRawResponseMap[P] : unknown
}
```

**Usage**:
```typescript
const result: UnifiedTranscriptResponse<'deepgram'> = await adapter.transcribe(audio)
result.raw?.metadata  // ✅ Typed as ListenV1Response
```

### Enhancement 2: Leveraging Fixed Parameter Types

```typescript
export interface DeepgramStreamingOptions {
  encoding?: typeof ListenV1EncodingParameter[keyof typeof ListenV1EncodingParameter]
  language?: ListenV1LanguageParameter  // string (BCP-47)
  model?: ListenV1ModelParameter        // 'nova-3' | 'enhanced' | ...
  version?: ListenV1VersionParameter    // 'latest' | string
}
```

### Enhancement 3: Exported Parameter Enums

```typescript
// src/router/index.ts
export { ListenV1EncodingParameter } from "../generated/deepgram/schema/..."
export { StreamingSupportedEncodingEnum } from "../generated/gladia/schema/..."
```

**Usage**:
```typescript
import { ListenV1EncodingParameter } from '@meeting-baas/sdk'

const session = await router.transcribeStream({
  encoding: ListenV1EncodingParameter.linear16  // ✅ Autocomplete!
})
```

**Benefits**: IntelliSense, compile-time safety, provider discrimination, direct enum access.

**Connection to Phase 2.5**: Only possible because fixes ensure all 14 Deepgram parameter files have proper type declarations, no duplicates, and complete exports.

---

## Phase 3: Adapter Implementation

### Architecture

```
VoiceRouter (router layer)
  ↓
Provider Adapters (gladia, deepgram, assemblyai, ...)
  ↓
BaseAdapter (interface)
```

**File**: `src/adapters/base-adapter.ts`

```typescript
export interface TranscriptionAdapter {
  name: TranscriptionProvider
  capabilities: ProviderCapabilities

  initialize(config: ProviderConfig): void
  transcribe(audio: AudioInput, options?: TranscribeOptions): Promise<UnifiedTranscriptResponse>
  transcribeStream?(options?: StreamingOptions, callbacks?: StreamingCallbacks): Promise<StreamingSession>
  getTranscript?(id: string): Promise<UnifiedTranscriptResponse>
}
```

### Adapter Pattern

Each adapter:
1. Uses generated API client
2. Normalizes responses to `UnifiedTranscriptResponse`
3. Handles provider-specific features
4. Implements error handling

**Example**: `src/adapters/gladia-adapter.ts` uses `src/generated/gladia/api/gladiaControlAPI.ts`

---

## Phase 4: Build & Bundle

### Commands

```bash
pnpm build              # Bundle + Docs
pnpm build:bundle       # tsup build
pnpm build:docs         # TypeDoc generation
```

### Output

```
dist/
├── index.js            # CJS bundle (151 KB)
├── index.mjs           # ESM bundle (148 KB)
├── index.d.ts          # Type declarations (406 KB)
└── ...

docs/generated/
├── router/             # Core API docs
├── gladia/             # Gladia adapter docs
├── deepgram/
└── ... (8 providers)
```

---

## Phase 5: Documentation Generation

### TypeDoc Overview

**TypeDoc** extracts documentation from TypeScript source code (JSDoc comments) and generates markdown files.

**Plugin**: `typedoc-plugin-markdown` - Generates markdown instead of HTML.

### Configuration

**Configs**: `typedoc.*.config.mjs` (9 separate configs)

```javascript
// typedoc.router.config.mjs - Core SDK API
export default {
  entryPoints: [
    "./src/router/voice-router.ts",    // VoiceRouter class
    "./src/router/types.ts",           // Core types
    "./src/adapters/base-adapter.ts"   // BaseAdapter interface
  ],
  out: "./docs/generated/router",
  plugin: ["typedoc-plugin-markdown"],
  readme: "none"
}
```

### Generation Process

```bash
pnpm build:docs
  ↓
pnpm docs:generate
  ↓
docs:clean                # Remove old docs
  ↓
docs:generate:router      # Core SDK API
docs:generate:webhooks    # Webhook handlers
docs:generate:gladia      # Gladia adapter
docs:generate:deepgram    # Deepgram adapter
docs:generate:assemblyai  # AssemblyAI adapter
docs:generate:azure       # Azure adapter
docs:generate:openai      # OpenAI adapter
docs:generate:speechmatics # Speechmatics adapter
```

### Output Structure

```
docs/generated/
├── router/                           # Core SDK API
│   ├── README.md
│   ├── router/
│   │   ├── voice-router.md           # ⭐ VoiceRouter class (main API)
│   │   └── types.md                  # ⭐ Core types (UnifiedTranscriptResponse, etc.)
│   ├── adapters/
│   │   └── base-adapter.md           # ⭐ BaseAdapter interface
│   └── webhooks/
├── webhooks/                         # Webhook handlers
│   ├── webhook-router.md             # ⭐ WebhookRouter class
│   ├── gladia-webhook.md
│   ├── deepgram-webhook.md
│   └── ... (6 provider webhooks)
├── gladia/                           # Gladia adapter API
│   └── adapters/gladia-adapter.md
├── deepgram/                         # Deepgram adapter API
│   └── adapters/deepgram-adapter.md
└── ... (6 more providers)
```

**Total Output**: ~50+ markdown files across 8 documentation sets.

### Most Important Generated Files

| File | Content | Audience |
|------|---------|----------|
| `router/router/voice-router.md` | VoiceRouter class methods | SDK users |
| `router/router/types.md` | UnifiedTranscriptResponse, StreamingOptions | SDK users & developers |
| `router/adapters/base-adapter.md` | BaseAdapter interface | Provider implementers |
| `webhooks/webhook-router.md` | WebhookRouter class | Webhook users |
| `{provider}/adapters/*.md` | Provider-specific adapters | Power users |

### What Gets Documented

TypeDoc extracts from JSDoc comments:

```typescript
/**
 * Transcribe audio using a specific provider
 *
 * Submit audio for transcription. The provider will be selected based on
 * your configuration strategy (explicit, default, or round-robin).
 *
 * @param audio - Audio input (URL, file buffer, or stream)
 * @param options - Transcription options (language, diarization, etc.)
 * @param options.provider - Specific provider to use (overrides selection)
 * @returns Unified transcription response with normalized format
 *
 * @example URL audio
 * ```typescript
 * const result = await router.transcribe({
 *   type: 'url',
 *   url: 'https://example.com/audio.mp3'
 * }, {
 *   language: 'en',
 *   diarization: true
 * });
 * ```
 */
async transcribe(audio: AudioInput, options?: TranscribeOptions)
```

**Generates**:
- Method signature with full type information
- Description and detailed explanation
- Parameter documentation
- Return type documentation
- Usage examples with syntax highlighting

### Viewing Documentation

**Local**: Open `docs/generated/router/README.md` in any markdown viewer

**GitHub**: Navigate to `/docs/generated/` in repository

**Links**:
- Main API: `docs/generated/router/router/voice-router.md`
- Types: `docs/generated/router/router/types.md`
- Webhooks: `docs/generated/webhooks/webhook-router.md`

---

## Adding a New Provider

1. **Add to `orval.config.ts`**:
```javascript
newProvider: {
  input: "https://api.provider.com/openapi.json",
  output: {
    target: "./src/generated/newprovider/api/api.ts",
    schemas: "./src/generated/newprovider/schema",
    mode: "single",
    client: "axios"
  }
}
```

2. **Generate types**: `pnpm openapi:generate`

3. **Create adapter**: `src/adapters/newprovider-adapter.ts`

4. **Implement `BaseAdapter`**

5. **Add webhook handler**: `src/webhooks/newprovider-webhook.ts`

6. **Update `TranscriptionProvider` type**: `src/router/types.ts`

7. **Add TypeDoc config**: `typedoc.newprovider.config.mjs`

8. **Update docs**: Add to README.md provider table

---

## Troubleshooting

### Build Fails with Type Errors

1. Check fix script ran: `pnpm openapi:fix`
2. Clean regenerate: `pnpm openapi:clean && pnpm openapi:generate`
3. Check Phase 2.5 fix script

### Provider Types Missing

Run `pnpm openapi:generate` to regenerate.

### TypeDoc Generation Fails

Ensure Phase 2.5 fixes applied (check for "✅ Fixes applied" in build output).

---

## Summary

**Fully Automated Pipeline**:
1. ✅ Fetch OpenAPI specs
2. ✅ Generate TypeScript types with Orval
3. ✅ Automatically fix generation issues
4. ✅ Build CJS/ESM/DTS bundles
5. ✅ Generate comprehensive documentation
6. ✅ 0 errors, type-safe SDK

**Result**: Production-ready SDK with full type safety and comprehensive documentation, generated from OpenAPI specifications.
