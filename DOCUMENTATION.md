# Voice Router SDK - Documentation Guide

This guide explains how to generate and maintain documentation for the Voice Router SDK.

## Documentation Stack

- **TypeDoc**: Generates API documentation from TypeScript source code
- **typedoc-plugin-markdown**: Outputs documentation as Markdown files
- **Multiple Configs**: Separate documentation for each component

## Available Documentation Sets

### 1. Router Core API (`docs/generated/router/`)

**Source**: Core VoiceRouter bridge and base adapter
**Config**: `typedoc.router.config.mjs`
**Command**: `pnpm docs:generate:router`

Documents:
- `VoiceRouter` class - Main entry point for multi-provider transcription
- `types.ts` - Unified types (UnifiedTranscriptResponse, TranscribeOptions, etc.)
- `base-adapter.ts` - Base adapter interface all providers implement

**Entry Points**:
```typescript
./src/router/voice-router.ts
./src/router/types.ts
./src/adapters/base-adapter.ts
```

### 2. Gladia Provider (`docs/generated/gladia/`)

**Source**: Gladia adapter implementation
**Config**: `typedoc.gladia.config.mjs`
**Command**: `pnpm docs:generate:gladia`

Documents:
- `GladiaAdapter` class - Complete Gladia implementation
- Gladia-specific features and methods
- Response normalization logic

**Entry Points**:
```typescript
./src/adapters/gladia-adapter.ts
```

### 3. AssemblyAI Provider (`docs/generated/assemblyai/`)

**Source**: AssemblyAI adapter (future implementation)
**Config**: `typedoc.assemblyai.config.mjs`
**Command**: `pnpm docs:generate:assemblyai`

**Status**: Config ready, waiting for adapter implementation

## Quick Start

### Generate All Documentation

```bash
# Clean and regenerate all docs
pnpm docs:generate
```

This runs:
1. `pnpm docs:clean` - Removes old docs
2. `pnpm docs:generate:router` - Generates core docs
3. `pnpm docs:generate:gladia` - Generates Gladia docs
4. `pnpm docs:generate:assemblyai` - Generates AssemblyAI docs (when ready)

### Generate Specific Documentation

```bash
# Router core only
pnpm docs:generate:router

# Gladia provider only
pnpm docs:generate:gladia

# AssemblyAI provider only (future)
pnpm docs:generate:assemblyai
```

### Clean Documentation

```bash
# Remove all generated docs
pnpm docs:clean
```

## Configuration Details

### Common Settings

All configs share these settings:

```javascript
{
  plugin: ["typedoc-plugin-markdown"],  // Markdown output
  outputFileStrategy: "modules",         // One file per module
  disableSources: true,                  // Hide source links
  excludeExternals: true,                // Skip external deps
  excludePrivate: false,                 // Show private methods
  excludeProtected: false,               // Show protected methods
  parametersFormat: "table",             // Table layout
  enumMembersFormat: "table"             // Table layout
}
```

### Router Config Specifics

**Output**: `./docs/generated/router`

**Excludes**:
- Test files (`**/*.test.ts`, `**/*.spec.ts`)
- Example files (`**/examples/**/*`)
- Generated provider types (`**/src/generated/**/*`)
- Provider adapters (documented separately)

**Group Order**:
1. Router
2. Configuration
3. Types
4. Adapters
5. Responses

### Provider Config Specifics

**Output**: `./docs/generated/{provider}`

**Excludes**:
- Test files
- Other provider adapters
- Other provider generated types

**Group Order**:
1. Adapter
2. Configuration
3. Methods
4. Types

## Documentation Structure

```
docs/
├── generated/              # Auto-generated API docs
│   ├── router/            # Core VoiceRouter docs
│   │   ├── README.md
│   │   ├── adapters/
│   │   │   └── base-adapter.md
│   │   └── router/
│   │       ├── voice-router.md
│   │       └── types.md
│   ├── gladia/            # Gladia adapter docs
│   │   └── README.md
│   └── assemblyai/        # AssemblyAI adapter docs (future)
│       └── README.md
└── guides/                # Manual guides (future)
    ├── getting-started.md
    ├── provider-selection.md
    └── creating-adapters.md
```

## Adding Guides (Future)

The typedoc configs have `projectDocuments` commented out. To add guide documentation:

1. **Create guides directory**:
   ```bash
   mkdir -p docs/guides
   ```

2. **Add guide files**:
   ```bash
   # Router guides
   docs/guides/getting-started.md
   docs/guides/provider-selection.md
   docs/guides/error-handling.md
   docs/guides/creating-adapters.md

   # Provider guides
   docs/guides/gladia-getting-started.md
   docs/guides/gladia-features.md
   docs/guides/assemblyai-getting-started.md
   ```

3. **Uncomment projectDocuments** in typedoc configs:
   ```javascript
   // typedoc.router.config.mjs
   projectDocuments: [
     "docs/guides/getting-started.md",
     "docs/guides/provider-selection.md",
     "docs/guides/error-handling.md",
     "docs/guides/creating-adapters.md"
   ]
   ```

4. **Regenerate docs**:
   ```bash
   pnpm docs:generate
   ```

## Writing Good Documentation

### For Classes

```typescript
/**
 * GladiaAdapter implements transcription for the Gladia API
 *
 * @example
 * ```typescript
 * const adapter = new GladiaAdapter();
 * adapter.initialize({ apiKey: 'YOUR_KEY' });
 * const result = await adapter.transcribe({
 *   type: 'url',
 *   url: 'https://example.com/audio.mp3'
 * });
 * ```
 */
export class GladiaAdapter extends BaseAdapter { }
```

### For Methods

```typescript
/**
 * Submit audio for transcription
 *
 * @param audio - Audio input (URL, file, or stream)
 * @param options - Transcription options (language, diarization, etc.)
 * @returns Unified transcript response with status and result
 *
 * @example
 * ```typescript
 * const result = await adapter.transcribe(
 *   { type: 'url', url: 'https://...' },
 *   { language: 'en', diarization: true }
 * );
 * ```
 */
async transcribe(audio: AudioInput, options?: TranscribeOptions) { }
```

### For Types

```typescript
/**
 * Unified transcription response across all providers
 *
 * All provider responses are normalized to this format for consistency.
 * Check `success` to determine if transcription succeeded.
 */
export interface UnifiedTranscriptResponse {
  /** Whether the transcription was successful */
  success: boolean;

  /** Provider that performed the transcription */
  provider: TranscriptionProvider;

  /** Transcription data (only present on success) */
  data?: { /* ... */ }

  /** Error information (only present on failure) */
  error?: { /* ... */ }
}
```

## Troubleshooting

### Error: "Cannot find module"

If you see missing module errors, ensure all source files exist:
```bash
# Check source files
ls -la src/router/
ls -la src/adapters/
```

### Error: "ENOENT: no such file or directory, scandir"

This means a `projectDocuments` path doesn't exist. Either:
- Create the missing guide files
- Comment out the `projectDocuments` array

### Warnings: "not included in the documentation"

TypeDoc warns when referenced types aren't in entry points. This is normal for:
- Generated provider types (intentionally excluded)
- External types from dependencies

To reduce warnings, you can:
- Add more entry points
- Accept the warnings (they don't affect output)

## Best Practices

1. **Regenerate after changes**: Run `pnpm docs:generate` after modifying source code
2. **Version control**: Commit generated docs to git for easy browsing on GitHub
3. **Review output**: Check generated markdown for formatting issues
4. **Add examples**: Include code examples in JSDoc comments
5. **Keep updated**: Regenerate docs before releases

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/docs.yml
- name: Generate documentation
  run: pnpm docs:generate

- name: Check for changes
  run: git diff --exit-code docs/generated/
  # Fails if docs are out of sync
```

## Publishing Documentation

### GitHub Pages

```bash
# Configure for GitHub Pages
gh-pages -d docs/generated
```

### Docusaurus Integration

```javascript
// docusaurus.config.js
{
  staticDirectories: ['static', 'docs/generated']
}
```

### Vercel/Netlify

Point to `docs/generated/` as static content directory.

## Future Enhancements

- [ ] Add guide documentation (getting started, tutorials)
- [ ] Create interactive examples
- [ ] Add search functionality
- [ ] Generate PDF documentation
- [ ] Add changelog integration
- [ ] Create video tutorials
- [ ] Add Deepgram adapter docs when ready
