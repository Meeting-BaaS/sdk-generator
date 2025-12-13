# Development Guide

Quick reference for developers working on the Voice Router SDK.

## Quick Start

```bash
# Install dependencies
pnpm install

# Build SDK
pnpm build

# Run tests
pnpm test
```

## Build Commands

### Main Build

```bash
pnpm build              # Build bundles + Generate docs
pnpm build:bundle       # Build CJS/ESM/DTS only
pnpm build:docs         # Generate TypeDoc markdown only
```

### Development

```bash
pnpm dev                # Watch mode
pnpm format             # Format with Biome
pnpm lint               # Lint with Biome
```

### OpenAPI Generation

```bash
pnpm openapi:generate   # Regenerate all provider types from OpenAPI specs
pnpm openapi:clean      # Clean generated types
pnpm openapi:fix        # Apply post-generation fixes
```

## Project Structure

```
src/
├── router/              # VoiceRouter core
│   ├── voice-router.ts  # Main router class
│   ├── types.ts         # Unified types
│   └── index.ts         # Public exports
├── adapters/            # Provider adapters
│   ├── base-adapter.ts  # Base interface
│   ├── gladia-adapter.ts
│   ├── deepgram-adapter.ts
│   └── ...
├── generated/           # Auto-generated from OpenAPI specs
│   ├── gladia/
│   ├── deepgram/
│   └── ...
└── webhooks/            # Webhook handlers

scripts/
├── fix-generated.js     # Post-generation fixes
└── ...

docs/
├── SDK_GENERATION_WORKFLOW.md  # Comprehensive technical guide
└── generated/                  # Auto-generated TypeDoc
```

## OpenAPI Specifications

Provider OpenAPI specs are fetched automatically during generation:

| Provider | Spec Source | Version |
|----------|-------------|---------|
| **Gladia** | https://api.gladia.io/openapi.json | Latest |
| **Deepgram** | https://developers.deepgram.com/openapi.json | 1.0.0 |
| **AssemblyAI** | https://api.assemblyai.com/openapi.yml | Latest |
| **Azure** | Bundled spec (fixed) | 3.1 |
| **OpenAI** | Filtered Whisper endpoints | 2.3.0 |
| **Speechmatics** | Bundled spec (fixed) | Latest |

**Automatic Fetching**: `pnpm openapi:generate` downloads latest specs and generates types.

## Known Issues & Fixes

### Orval Generation Bugs

Orval sometimes generates invalid TypeScript. Our **post-generation fix script** (`scripts/fix-generated.js`) automatically fixes:

1. **Extra commas** before export statements
2. **Malformed Deepgram parameter files** (14 files)
3. **Duplicate object properties**
4. **Array default type inference** (hybrid approach: proper types where possible, `as any` fallback)
5. **Unterminated string literals**
6. **Error type shadowing**
7. **FormData object append** issues
8. **Discriminated union** issues
9. **Empty zod.array()** calls

**Documentation**: See `docs/SDK_GENERATION_WORKFLOW.md` Phase 2.5 for comprehensive details.

### Build Process

```bash
pnpm build
  ↓
prebuild hook
  ↓
openapi:fix-specs     # Fix spec validation issues
  ↓
openapi:fix           # Fix generated TypeScript
  ↓
build:bundle          # TypeScript compilation (0 errors)
  ↓
build:docs            # TypeDoc generation (success)
```

## Adding a New Provider

1. **Add OpenAPI spec** to `orval.config.ts`
2. **Generate types**: `pnpm openapi:generate`
3. **Create adapter** in `src/adapters/{provider}-adapter.ts`
4. **Implement** `BaseAdapter` interface
5. **Add webhook handler** in `src/webhooks/`
6. **Add tests**
7. **Update docs**

See `docs/SDK_GENERATION_WORKFLOW.md` for detailed workflow.

## Type Safety

### Provider-Specific Types

The SDK provides full type safety with provider discrimination:

```typescript
// Generic response
const result: UnifiedTranscriptResponse = await router.transcribe(audio)

// Provider-specific response (typed!)
const deepgramResult: UnifiedTranscriptResponse<'deepgram'> = await router.transcribe(audio, {
  provider: 'deepgram'
})
deepgramResult.raw?.metadata  // ✅ Typed as ListenV1Response
```

### Exported Enums

Use provider-specific enums for type-safe configuration:

```typescript
import { ListenV1EncodingParameter } from '@meeting-baas/sdk'

const session = await router.transcribeStream({
  provider: 'deepgram',
  encoding: ListenV1EncodingParameter.linear16  // ✅ Autocomplete!
})
```

## Testing

```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # Coverage report
```

## Publishing

```bash
# Update version in package.json
npm version patch|minor|major

# Build and publish
pnpm build
npm publish
```

## Documentation

### Documentation Structure

```
docs/
├── README.md                        # This file
├── DEVELOPMENT.md                   # Developer quick reference
├── SDK_GENERATION_WORKFLOW.md       # Technical workflow
└── generated/                       # Auto-generated TypeDoc
    ├── router/                      # Core SDK API
    │   ├── README.md
    │   ├── router/
    │   │   ├── voice-router.md      # ⭐ Main router class
    │   │   └── types.md             # ⭐ Core types
    │   ├── adapters/
    │   │   └── base-adapter.md      # ⭐ Base adapter interface
    │   └── webhooks/
    ├── webhooks/                    # Webhook handlers
    │   ├── README.md
    │   ├── webhook-router.md        # ⭐ WebhookRouter class
    │   ├── gladia-webhook.md
    │   ├── deepgram-webhook.md
    │   └── ...
    ├── gladia/                      # Gladia adapter API
    ├── deepgram/                    # Deepgram adapter API
    ├── assemblyai/                  # AssemblyAI adapter API
    ├── openai/                      # OpenAI adapter API
    ├── azure/                       # Azure adapter API
    └── speechmatics/                # Speechmatics adapter API
```

### TypeDoc Generation

**How It Works**:

TypeDoc extracts documentation from TypeScript source code comments and generates markdown files.

**Configuration**: `typedoc.*.config.mjs` (9 separate configs)

```javascript
// typedoc.router.config.mjs
export default {
  entryPoints: [
    "./src/router/voice-router.ts",
    "./src/router/types.ts",
    "./src/adapters/base-adapter.ts"
  ],
  out: "./docs/generated/router",
  plugin: ["typedoc-plugin-markdown"],
  readme: "none"
}
```

**Generation Command**:

```bash
pnpm build:docs              # Generate all documentation
pnpm docs:generate:router    # Generate router docs only
pnpm docs:generate:gladia    # Generate Gladia docs only
# ... etc for each provider
```

**What Gets Generated**:

1. **Class Documentation** - Methods, properties, examples from JSDoc comments
2. **Interface Documentation** - Type definitions, parameters, return types
3. **Type Aliases** - Union types, mapped types, generic types
4. **Enum Documentation** - Available values and descriptions

**Most Important Generated Files**:

| File | Description | Use Case |
|------|-------------|----------|
| `router/router/voice-router.md` | VoiceRouter class API | Main entry point, all router methods |
| `router/router/types.md` | Core types | UnifiedTranscriptResponse, StreamingOptions, etc. |
| `router/adapters/base-adapter.md` | BaseAdapter interface | Implementing new providers |
| `webhooks/webhook-router.md` | WebhookRouter class | Webhook handling, auto-detection |
| `{provider}/adapters/*.md` | Provider adapters | Provider-specific features |

### Example: Reading Generated Docs

**To implement a new provider**, read:
1. `router/adapters/base-adapter.md` - Interface to implement
2. `gladia/adapters/gladia-adapter.md` - Example implementation
3. `router/router/types.md` - Response types to return

**To use webhooks**, read:
1. `webhooks/webhook-router.md` - WebhookRouter API
2. `webhooks/{provider}-webhook.md` - Provider-specific handlers
3. `webhooks/types.md` - Event types

**To use streaming**, read:
1. `router/router/voice-router.md` - `transcribeStream()` method
2. `router/router/types.md` - StreamingOptions and StreamingSession
3. Provider adapter docs for provider-specific options

### Updating Documentation

Documentation is regenerated on every build:

```bash
pnpm build        # Regenerates docs/generated/
```

**To update docs**:
1. Update JSDoc comments in source code
2. Run `pnpm build:docs`
3. Check generated markdown in `docs/generated/`

**JSDoc Example**:

```typescript
/**
 * Transcribe audio using a specific provider
 *
 * @param audio - Audio input (URL, file, or stream)
 * @param options - Transcription options
 * @returns Unified transcription response
 *
 * @example
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
async transcribe(audio: AudioInput, options?: TranscribeOptions): Promise<UnifiedTranscriptResponse>
```

This generates comprehensive markdown documentation automatically.

## Troubleshooting

### Build Fails with Type Errors

1. Clean and regenerate: `pnpm openapi:clean && pnpm openapi:generate`
2. Check fix script ran: Look for "✅ Fixes applied" in output
3. See `docs/SDK_GENERATION_WORKFLOW.md` Phase 2.5 for fix details

### Provider Types Missing

Run `pnpm openapi:generate` to regenerate all provider types.

### Generated Code Has Errors

Post-generation fixes run automatically. If issues persist, check `scripts/fix-generated.js`.
