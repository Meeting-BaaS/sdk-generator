# Voice Router SDK - Complete Development Workflow

This document outlines the complete end-to-end workflow for developing and maintaining the Voice Router SDK.

## 🔄 Complete Workflow Overview

```
1. Fetch OpenAPI Specs → 2. Generate Types → 3. Build Adapters → 4. Build SDK → 5. Generate Docs → 6. Test → 7. Publish
```

---

## Step 1: Fetch OpenAPI Specifications

### Automatic (Recommended)

```bash
# Fetch all provider specs and generate types
pnpm openapi:generate
```

This command:
- Cleans `src/generated/` directory
- Downloads OpenAPI specs from remote URLs
- Generates TypeScript types for all providers
- Formats generated code with Biome

### Per-Provider

```bash
# Generate types for specific provider
pnpm openapi:generate:gladia
pnpm openapi:generate:assemblyai
pnpm openapi:generate:deepgram
```

### Manual Verification

```bash
# Check what was generated
ls -la src/generated/gladia/schema/
ls -la src/generated/assemblyai/schema/

# Count generated files
find src/generated -name "*.ts" | wc -l
```

**Output**: `src/generated/{provider}/schema/*.ts` - TypeScript type definitions

---

## Step 2: Verify Generated Types

### Type Validation

```bash
# Check TypeScript compilation
pnpm build

# Should output:
# ✓ CJS build success
# ✓ ESM build success
# ✓ DTS build success
```

### Fix Common Issues

If types have errors:

```bash
# Check for missing imports
grep -r "Cannot find module" src/generated/

# Fix manually or regenerate
pnpm openapi:clean:gladia
pnpm openapi:generate:gladia
```

**Output**: Validated TypeScript types that compile without errors

---

## Step 3: Build Provider Adapters

### Create Adapter Implementation

```typescript
// src/adapters/{provider}-adapter.ts
import { BaseAdapter } from './base-adapter';
import type { TranscribeOptions, UnifiedTranscriptResponse } from '../router/types';

export class ProviderAdapter extends BaseAdapter {
  readonly name = 'provider' as const;
  readonly capabilities = { /* ... */ };

  async transcribe(audio, options) {
    // Implementation using generated types
  }

  async getTranscript(id) {
    // Implementation
  }
}
```

### Register in Index

```typescript
// src/adapters/index.ts
export * from './provider-adapter';
```

### Test Compilation

```bash
pnpm build
```

**Output**: Working adapter that implements `TranscriptionAdapter` interface

---

## Step 4: Build & Bundle SDK

### Development Build

```bash
# Clean build
pnpm clean:build

# Watch mode for development
pnpm dev
```

### Production Build

```bash
pnpm build
```

**Generates**:
- `dist/index.js` - CommonJS bundle
- `dist/index.mjs` - ES Module bundle
- `dist/index.d.ts` - TypeScript declarations
- `dist/index.d.mts` - ES Module declarations

### Verify Bundle

```bash
# Check bundle sizes
ls -lh dist/

# Verify exports
node -e "console.log(Object.keys(require('./dist/index.js')))"
```

**Output**: Production-ready bundles in `dist/`

---

## Step 5: Generate Documentation

### API Documentation (TypeDoc)

```bash
# Generate all docs
pnpm docs:generate

# Or per-component
pnpm docs:generate:router      # Core API
pnpm docs:generate:gladia      # Gladia provider
pnpm docs:generate:assemblyai  # AssemblyAI provider
```

**Generates**: `docs/generated/{component}/` - Markdown API docs

### Verify Documentation

```bash
# Check generated docs
ls -la docs/generated/router/
cat docs/generated/router/README.md

# Count documentation files
find docs/generated -name "*.md" | wc -l
```

**Output**: Complete API documentation in Markdown format

---

## Step 6: Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run with UI
pnpm test:ui

# Watch mode
pnpm vitest
```

### Integration Tests

```bash
# Test specific provider
pnpm test:integration
```

### Manual Testing (Local Development)

```bash
# Link SDK locally
pnpm link

# In test project
cd /path/to/test-project
pnpm link @meeting-baas/sdk

# Create test file
node test.js
```

**test.js example**:
```javascript
const { VoiceRouter, GladiaAdapter } = require('@meeting-baas/sdk');

const router = new VoiceRouter({
  providers: {
    gladia: { apiKey: process.env.GLADIA_API_KEY }
  },
  defaultProvider: 'gladia'
});

router.registerAdapter(new GladiaAdapter());

router.transcribe({
  type: 'url',
  url: 'https://example.com/audio.mp3'
}).then(result => {
  console.log('Result:', result);
});
```

**Output**: Verified working SDK with all features tested

---

## Step 7: Lint & Format

```bash
# Check code style
pnpm lint

# Auto-fix issues
pnpm lint:fix
```

**Output**: Clean, formatted code following project style

---

## Step 8: Version & Publish

### Update Version

```bash
# Bump version
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

### Pre-publish Checks

```bash
# Runs automatically before publish
pnpm prepublishOnly

# Includes:
# - pnpm lint:fix
# - pnpm build
```

### Publish

```bash
# Dry run
pnpm publish --dry-run

# Actual publish
pnpm publish
```

**Output**: Published package on npm

---

## 🔄 Complete Workflow Script

Here's a single command to run the entire workflow:

```bash
#!/bin/bash
# complete-workflow.sh

set -e  # Exit on error

echo "📥 Step 1: Fetching OpenAPI specs and generating types..."
pnpm openapi:generate

echo "✅ Step 2: Verifying types compile..."
pnpm build

echo "📚 Step 3: Generating documentation..."
pnpm docs:generate

echo "🧪 Step 4: Running tests..."
pnpm test

echo "🎨 Step 5: Linting and formatting..."
pnpm lint:fix

echo "🏗️  Step 6: Final production build..."
pnpm clean:build

echo "✨ Workflow complete!"
echo "📦 Bundle sizes:"
ls -lh dist/

echo "📖 Documentation generated:"
find docs/generated -name "*.md" | wc -l
echo "   files created"

echo "🎉 SDK ready for publish!"
```

Make executable and run:
```bash
chmod +x complete-workflow.sh
./complete-workflow.sh
```

---

## 🔧 Partial Workflows

### Quick Development Iteration

```bash
# Make code changes, then:
pnpm dev  # Watch mode, rebuilds on change
```

### After Updating Provider Adapter

```bash
pnpm build
pnpm docs:generate:gladia
pnpm test
```

### After OpenAPI Spec Update

```bash
pnpm openapi:generate:gladia
pnpm build
pnpm test
```

### Before Committing

```bash
pnpm lint:fix
pnpm build
pnpm test
git add -A
git commit -m "feat: your changes"
```

---

## 🐛 Troubleshooting Workflows

### OpenAPI Generation Fails

```bash
# Check network connection
curl -I https://api.gladia.io/openapi.json

# Try single provider
pnpm openapi:generate:gladia

# Check orval version
pnpm why orval
```

### Build Fails

```bash
# Check TypeScript errors
tsc --noEmit

# Clean and rebuild
pnpm clean
pnpm openapi:clean
pnpm openapi:generate
pnpm build
```

### Documentation Generation Fails

```bash
# Check entry points exist
ls -la src/router/voice-router.ts
ls -la src/adapters/gladia-adapter.ts

# Verify typedoc config
cat typedoc.router.config.mjs

# Try individual generation
pnpm docs:generate:router
```

### Tests Fail

```bash
# Run tests with verbose output
pnpm vitest --reporter=verbose

# Run specific test
pnpm vitest src/adapters/gladia-adapter.test.ts

# Check test coverage
pnpm test:coverage
```

---

## 📊 Workflow Checklist

Before releasing a new version:

- [ ] OpenAPI specs regenerated
- [ ] Types compile without errors
- [ ] All adapters implement correct interfaces
- [ ] SDK builds successfully (CJS + ESM + DTS)
- [ ] Documentation generated and accurate
- [ ] All tests passing
- [ ] Code linted and formatted
- [ ] Bundle sizes reasonable
- [ ] CHANGELOG.md updated
- [ ] Version bumped appropriately
- [ ] Git committed and tagged

---

## 🎯 Common Use Cases

### Adding a New Provider

```bash
# 1. Add OpenAPI URL to orval.config.ts
# 2. Generate types
pnpm openapi:generate:newprovider

# 3. Create adapter
touch src/adapters/newprovider-adapter.ts

# 4. Implement adapter (using generated types)
# 5. Export from index
# 6. Create typedoc config
cp typedoc.gladia.config.mjs typedoc.newprovider.config.mjs

# 7. Add to package.json scripts
# 8. Test, build, document
pnpm build
pnpm docs:generate:newprovider
pnpm test
```

### Updating Provider Types

```bash
# Provider released new API version
pnpm openapi:generate:gladia
pnpm build  # Check for breaking changes
pnpm test   # Verify adapters still work
```

### Local Development with Test App

```bash
# Terminal 1: SDK in watch mode
cd sdk-generator
pnpm dev

# Terminal 2: Test app
cd test-app
pnpm link ../sdk-generator
node test.js
```

---

## 🚀 CI/CD Integration

### GitHub Actions Workflow

```yaml
name: SDK Build & Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: pnpm install

      - name: Generate types from OpenAPI
        run: pnpm openapi:generate

      - name: Build SDK
        run: pnpm build

      - name: Generate documentation
        run: pnpm docs:generate

      - name: Run tests
        run: pnpm test

      - name: Lint code
        run: pnpm lint
```

---

## 📈 Performance Benchmarks

Track these metrics:

- **OpenAPI generation**: ~5-10 seconds
- **Type compilation**: ~2-5 seconds
- **SDK build**: ~1-2 seconds
- **Documentation**: ~3-5 seconds
- **Tests**: ~5-10 seconds
- **Total workflow**: ~30-45 seconds

---

## 🔗 Related Documentation

- [OPENAPI_SPECS.md](./OPENAPI_SPECS.md) - OpenAPI spec management
- [DOCUMENTATION.md](./DOCUMENTATION.md) - TypeDoc documentation
- [VOICE_ROUTER_PLAN.md](./VOICE_ROUTER_PLAN.md) - Architecture plan
- [README.md](./README.md) - SDK usage guide
