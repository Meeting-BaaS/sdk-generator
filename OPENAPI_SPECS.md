# OpenAPI Specification Management

This document explains how the Voice Router SDK fetches and manages OpenAPI specifications for each transcription provider.

## Current Approach: Direct HTTP Fetch

The SDK uses [Orval](https://orval.dev/) to automatically generate TypeScript types from OpenAPI specifications. When you run `pnpm openapi:generate`, Orval fetches specs directly from remote URLs:

### Provider Spec URLs

| Provider | OpenAPI Spec URL | Status |
|----------|-----------------|--------|
| **Gladia** | `https://api.gladia.io/openapi.json` | ✅ Working |
| **AssemblyAI** | `https://raw.githubusercontent.com/AssemblyAI/assemblyai-api-spec/main/openapi.json` | ✅ Working |
| **Deepgram** | `https://api.deepgram.com/openapi.json` | ❌ 404 Not Found |

## Available Scripts

```bash
# Generate types for all providers
pnpm openapi:generate

# Generate types for specific provider
pnpm openapi:generate:gladia
pnpm openapi:generate:assemblyai
pnpm openapi:generate:deepgram

# Clean generated files
pnpm openapi:clean              # All providers
pnpm openapi:clean:gladia       # Specific provider
pnpm openapi:clean:assemblyai
pnpm openapi:clean:deepgram

# Regenerate and rebuild
pnpm openapi:rebuild
```

## How It Works

1. **Fetch**: Orval downloads the OpenAPI spec from the remote URL
2. **Parse**: Validates and parses the OpenAPI schema
3. **Generate**: Creates TypeScript types in `src/generated/{provider}/schema/`
4. **Format**: Runs Biome formatter on generated files

### Generated Output Structure

```
src/generated/
├── gladia/
│   └── schema/           # TypeScript type definitions
│       ├── transcript.ts
│       ├── transcribeRequest.ts
│       └── ...
├── assemblyai/
│   └── schema/
│       ├── transcript.ts
│       └── ...
└── deepgram/            # Not generated yet (no spec available)
    └── schema/
```

## Advantages of Direct Fetch

✅ **Always up-to-date** - Gets latest API changes automatically
✅ **No manual maintenance** - No need to download/update specs manually
✅ **Version controlled** - Generated types are committed to git

## Disadvantages

❌ **No versioning** - Can break builds if provider changes their API
❌ **Network dependency** - Requires internet connection to regenerate
❌ **Provider availability** - Some providers don't publish OpenAPI specs (e.g., Deepgram)

## Alternative Approaches

### Option 1: Local Spec Files (Recommended for Deepgram)

For providers without public OpenAPI specs, manually create or download specs:

```typescript
// orval.config.ts
const DEEPGRAM_INPUT = {
  target: "./specs/deepgram-openapi.json"  // Local file
}
```

**Pros:** Full control, works offline, versioned
**Cons:** Manual updates required

### Option 2: Spec Caching

Cache downloaded specs locally with a timestamp:

```bash
# scripts/fetch-specs.sh
curl https://api.gladia.io/openapi.json > specs/gladia-$(date +%Y%m%d).json
```

**Pros:** Offline support, can pin versions
**Cons:** Additional complexity, manual cache management

### Option 3: Provider SDK Dependencies

Use official SDKs instead of generating types:

```bash
pnpm add @deepgram/sdk @assemblyai/core
```

**Pros:** Official support, battle-tested
**Cons:** Larger bundle size, different API styles

## Deepgram Solution

Since Deepgram doesn't provide a public OpenAPI spec at `https://api.deepgram.com/openapi.json`, we have three options:

1. **Manual TypeScript types** - Write types by hand from their docs
2. **Use their official SDK** - `@deepgram/sdk` package
3. **Create OpenAPI spec** - Reverse-engineer from their API documentation

**Recommended:** Use option 2 (official SDK) for Deepgram and create a thin adapter wrapper.

## Versioning Strategy

### Current: Latest Always

```typescript
// Always fetches latest spec
const GLADIA_INPUT = {
  target: "https://api.gladia.io/openapi.json"
}
```

### Alternative: Pinned Versions

```typescript
// Pin to specific version/date
const GLADIA_INPUT = {
  target: "https://api.gladia.io/openapi.json?version=2024-01"
}
```

Or commit downloaded specs:

```bash
# Download and commit
curl https://api.gladia.io/openapi.json > specs/gladia-v1.0.0.json
git add specs/gladia-v1.0.0.json
git commit -m "chore: add Gladia OpenAPI spec v1.0.0"
```

## Best Practices

1. **Version Control Generated Types**: Always commit generated types to git so builds work without fetching
2. **CI/CD Integration**: Run `pnpm openapi:generate` in CI to catch breaking changes
3. **Validate After Generation**: Check that types compile (`pnpm build`) after regenerating
4. **Document Provider Versions**: Note which API version each spec represents
5. **Test Breaking Changes**: Run full test suite after regenerating types

## Troubleshooting

### Error: "HTTP ERROR 404"

Provider doesn't have an OpenAPI spec at that URL. Options:
- Find the correct URL in provider docs
- Use local spec file
- Write manual types
- Use official SDK

### Error: "toSorted is not a function"

Orval requires Node 20+ for `mode: "tags-split"`. Solutions:
- Upgrade Node to 20+
- Use `mode: "single"` instead (already applied to Gladia)
- Use explicit polyfill

### Types Out of Sync

If generated types don't match provider API:
```bash
# Regenerate everything
pnpm openapi:clean
pnpm openapi:generate
pnpm build
```

## Future Improvements

- [ ] Add spec validation before generation
- [ ] Implement spec caching for offline development
- [ ] Set up CI job to detect provider API changes
- [ ] Create custom transformers for provider-specific quirks
- [ ] Add Deepgram support (manual types or official SDK)
