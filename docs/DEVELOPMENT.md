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

- **User Guide**: README.md
- **Technical Workflow**: docs/SDK_GENERATION_WORKFLOW.md
- **This Guide**: docs/DEVELOPMENT.md
- **API Reference**: docs/generated/ (auto-generated)

## Troubleshooting

### Build Fails with Type Errors

1. Clean and regenerate: `pnpm openapi:clean && pnpm openapi:generate`
2. Check fix script ran: Look for "✅ Fixes applied" in output
3. See `docs/SDK_GENERATION_WORKFLOW.md` Phase 2.5 for fix details

### Provider Types Missing

Run `pnpm openapi:generate` to regenerate all provider types.

### Generated Code Has Errors

Post-generation fixes run automatically. If issues persist, check `scripts/fix-generated.js`.
