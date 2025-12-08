# Voice Router SDK - Build Commands Reference

Quick reference for all build and development commands.

## 🚀 Main Build Command

### `pnpm build`

**The unified build command** - Runs everything you need to build the SDK:

```bash
pnpm build
```

**What it does:**
1. 🔨 **Builds SDK bundles** (CJS + ESM + TypeScript declarations)
2. 📚 **Generates documentation** (TypeDoc → Markdown)

**Output:**
- `dist/index.js` - CommonJS bundle (51KB)
- `dist/index.mjs` - ES Module bundle (49KB)
- `dist/index.d.ts` - TypeScript declarations (292KB)
- `docs/generated/router/` - Core API docs
- `docs/generated/gladia/` - Gladia provider docs

**When to use:** Every time before committing, testing locally, or publishing.

---

## 📦 Build Variants

### `pnpm build:all`

Complete build including OpenAPI type regeneration:

```bash
pnpm build:all
```

**Includes:**
1. 📥 **Generates types from OpenAPI specs** (Gladia, AssemblyAI, Deepgram)
2. 🔨 **Builds SDK bundles**
3. 📚 **Generates documentation**

**When to use:** When provider APIs have been updated and you need fresh types.

**Note:** May fail with Node 18 due to orval's `toSorted()` requirement. Use existing generated types instead.

### `pnpm build:bundle`

Build SDK bundles only (fastest):

```bash
pnpm build:bundle
```

**Output:** Only `dist/` files (CJS, ESM, DTS)

**When to use:** Quick rebuilds during development.

### `pnpm build:docs`

Generate documentation only:

```bash
pnpm build:docs
```

**Output:** Only `docs/generated/` files

**When to use:** After updating JSDoc comments in source code.

### `pnpm build:types`

Generate TypeScript types from OpenAPI specs only:

```bash
pnpm build:types
```

**Output:** `src/generated/{provider}/schema/*.ts`

**When to use:** When provider OpenAPI specs are updated.

### `pnpm build:quick`

Absolute fastest build (tsup only, no logging):

```bash
pnpm build:quick
```

**Output:** Only SDK bundles

**When to use:** Rapid iteration during development.

---

## 🧹 Clean Commands

### `pnpm clean`

Remove build artifacts:

```bash
pnpm clean
```

Removes: `dist/` directory

### `pnpm clean:build`

Clean and rebuild bundles:

```bash
pnpm clean:build
```

Equivalent to: `pnpm clean && pnpm build:bundle`

### `pnpm openapi:clean`

Remove all generated types:

```bash
pnpm openapi:clean
```

Removes: `src/generated/` directory

### `pnpm docs:clean`

Remove generated documentation:

```bash
pnpm docs:clean
```

Removes: `docs/generated/` directory

---

## 🔧 Development Commands

### `pnpm dev`

Watch mode - automatically rebuilds on file changes:

```bash
pnpm dev
```

**What it watches:** Source files in `src/`

**What it rebuilds:** SDK bundles only (fast iteration)

**When to use:** Active development with live reload.

---

## 📝 Per-Provider Commands

### OpenAPI Type Generation

```bash
# Generate types for specific provider
pnpm openapi:generate:gladia
pnpm openapi:generate:assemblyai
pnpm openapi:generate:deepgram

# Clean specific provider
pnpm openapi:clean:gladia
pnpm openapi:clean:assemblyai
pnpm openapi:clean:deepgram
```

### Documentation Generation

```bash
# Generate docs for specific component
pnpm docs:generate:router      # Core VoiceRouter API
pnpm docs:generate:gladia      # Gladia adapter
pnpm docs:generate:assemblyai  # AssemblyAI adapter (when ready)
```

---

## 🧪 Testing Commands

### `pnpm test`

Run all tests:

```bash
pnpm test
```

### `pnpm test:ui`

Run tests with interactive UI:

```bash
pnpm test:ui
```

### `pnpm test:coverage`

Run tests with coverage report:

```bash
pnpm test:coverage
```

### `pnpm test:unit`

Run unit tests only:

```bash
pnpm test:unit
```

### `pnpm test:integration`

Run integration tests only:

```bash
pnpm test:integration
```

---

## 🎨 Code Quality Commands

### `pnpm lint`

Check code style:

```bash
pnpm lint
```

### `pnpm lint:fix`

Auto-fix code style issues:

```bash
pnpm lint:fix
```

**When to use:** Before committing.

---

## 🔄 Complete Workflows

### Before Committing

```bash
pnpm lint:fix
pnpm build
pnpm test
git add -A
git commit -m "your changes"
```

### After Provider API Update

```bash
pnpm openapi:generate:gladia  # Or specific provider
pnpm build
pnpm test
```

### Quick Development Iteration

```bash
# Terminal 1: Watch mode
pnpm dev

# Terminal 2: Make changes, then test
node test.js
```

### Before Publishing

```bash
pnpm lint:fix
pnpm build:all  # If types need updating
pnpm build      # Otherwise just this
pnpm test
pnpm publish --dry-run  # Verify
pnpm publish            # When ready
```

---

## 🔗 Automated Workflow Script

For a complete automated test of the entire build pipeline:

```bash
./scripts/test-workflow.sh
```

This validates:
- ✅ Generated types exist
- ✅ SDK builds successfully
- ✅ Documentation generates
- ✅ Bundle exports are correct
- ✅ Code quality checks pass

---

## 📊 Build Performance

Typical build times on modern hardware:

| Command | Duration | Output Size |
|---------|----------|-------------|
| `pnpm build:quick` | ~1s | 390KB |
| `pnpm build:bundle` | ~1-2s | 390KB |
| `pnpm build:docs` | ~3-5s | 5 files |
| `pnpm build` | ~4-7s | 390KB + docs |
| `pnpm build:all` | ~10-15s | All + types |

---

## ⚙️ Build Configuration

### TypeScript (tsup)

Config: `tsup.config.ts`

Outputs:
- CJS (CommonJS) for Node.js
- ESM (ES Modules) for modern bundlers
- DTS (TypeScript declarations) for type safety

### Documentation (TypeDoc)

Configs:
- `typedoc.router.config.mjs` - Core API
- `typedoc.gladia.config.mjs` - Gladia provider
- `typedoc.assemblyai.config.mjs` - AssemblyAI provider

Format: Markdown (GitHub-friendly)

### Type Generation (Orval)

Config: `orval.config.ts`

Sources:
- Gladia: `https://api.gladia.io/openapi.json`
- AssemblyAI: `https://raw.githubusercontent.com/AssemblyAI/assemblyai-api-spec/main/openapi.json`
- Deepgram: Manual types (no public OpenAPI spec)

---

## 🐛 Troubleshooting

### Build fails with TypeScript errors

```bash
# Clean everything and rebuild
pnpm clean
pnpm openapi:clean
pnpm build:all
```

### Documentation generation errors

```bash
# Check entry points exist
ls -la src/router/voice-router.ts
ls -la src/adapters/gladia-adapter.ts

# Regenerate
pnpm docs:clean
pnpm docs:generate
```

### OpenAPI generation fails

```bash
# Likely Node 18 + orval compatibility issue
# Use existing generated types
pnpm build  # Skips type generation

# Or upgrade Node to 20+
nvm install 20
nvm use 20
pnpm build:all
```

---

## 💡 Tips

1. **Use `pnpm build`** for most cases - it's fast and complete
2. **Use `pnpm dev`** during active development for instant feedback
3. **Use `pnpm build:all`** only when provider APIs change
4. **Run `pnpm lint:fix`** before committing
5. **Test with `./scripts/test-workflow.sh`** before publishing

---

## 📚 Related Documentation

- [WORKFLOW.md](./WORKFLOW.md) - Complete development workflow
- [DOCUMENTATION.md](./DOCUMENTATION.md) - Documentation guide
- [OPENAPI_SPECS.md](./OPENAPI_SPECS.md) - OpenAPI spec management
- [README.md](./README.md) - SDK usage guide
