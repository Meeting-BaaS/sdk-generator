# Provider Integration Plan

**Comprehensive plan for integrating all transcription providers into Voice Router SDK**

---

## Overview

Based on `providers.csv`, we have 11 transcription providers to potentially integrate. This plan prioritizes providers with OpenAPI specifications and evaluates the effort required for each.

---

## Provider Status Summary

| Rank | Provider | OpenAPI Available | Status | Priority |
|------|----------|-------------------|--------|----------|
| 1 | Deepgram | ✅ Yes (GitHub) | 🔴 TODO | **HIGH** |
| 2 | OpenAI Whisper | ✅ Yes (YAML) | 🔴 TODO | **HIGH** |
| 3 | Azure Speech-to-Text | ✅ Yes (JSON) | 🔴 TODO | **HIGH** |
| 4 | Google Cloud STT | ⚠️ Discovery Doc | 🔴 TODO | **MEDIUM** |
| 5 | AssemblyAI | ✅ Yes (YAML) | ✅ **DONE** | ✅ Complete |
| 6 | Rev AI | ❌ No | 🔴 TODO | **LOW** |
| 7 | Speechmatics | ✅ Yes | 🔴 TODO | **MEDIUM** |
| 8 | Amazon Transcribe | ❌ AWS Only | 🔴 TODO | **LOW** |
| 9 | IBM Watson STT | ⚠️ Deprecated | ⏸️ SKIP | N/A |
| 10 | Kaldi | N/A (Self-hosted) | ⏸️ SKIP | N/A |
| - | Gladia | ✅ Yes (JSON) | ✅ **DONE** | ✅ Complete |

**Legend**:
- ✅ Done - Adapter implemented and tested
- 🔴 TODO - Not started
- ⏸️ SKIP - Not applicable or deprecated

---

## Integration Phases

### ✅ Phase 1: Foundation (COMPLETED)
- [x] Gladia adapter
- [x] AssemblyAI adapter
- [x] VoiceRouter bridge
- [x] Documentation system
- [x] Build pipeline

### 🚧 Phase 2: High Priority Providers (CURRENT)
Focus on providers with public OpenAPI specs and high usage.

#### 2.1 Deepgram (Rank 1) - **STARTING NOW**
- ✅ OpenAPI spec available
- 📍 Location: https://github.com/deepgram/deepgram-api-specs
- 📋 Has both OpenAPI + AsyncAPI specs
- 🎯 **Action**: Download spec, generate types, implement adapter

#### 2.2 OpenAI Whisper (Rank 2)
- ✅ OpenAPI spec available (YAML)
- 📍 Location: https://app.stainless.com/api/spec/documented/openai/openapi.documented.yml
- 📋 Part of full OpenAI API
- 🎯 **Action**: Extract Whisper endpoints, generate types

#### 2.3 Azure Speech-to-Text (Rank 3)
- ✅ OpenAPI spec available (JSON)
- 📍 Location: https://github.com/Azure/azure-rest-api-specs/blob/master/specification/cognitiveservices/data-plane/Speech/SpeechToText/stable/v3.1/speechtotext.json
- 📋 Enterprise-grade API
- 🎯 **Action**: Download spec, generate types, implement adapter

### 📋 Phase 3: Medium Priority Providers

#### 3.1 Speechmatics (Rank 7)
- ✅ OpenAPI spec available
- 📍 Location: https://docs.speechmatics.com/jobsapi (download button)
- 🎯 **Action**: Download from docs, generate types

#### 3.2 Google Cloud Speech-to-Text (Rank 4)
- ⚠️ Discovery Document format (not OpenAPI)
- 📍 Location: https://speech.googleapis.com/$discovery/rest?version=v2
- 🎯 **Action**: Convert Discovery Doc → OpenAPI or manual types
- 💡 **Note**: Requires custom conversion or manual typing

### 🔻 Phase 4: Low Priority / Manual Implementation

#### 4.1 Rev AI (Rank 6)
- ❌ No public OpenAPI spec
- 📋 SDKs available but no formal spec
- 🎯 **Action**: Manual typing from SDK inspection

#### 4.2 Amazon Transcribe (Rank 8)
- ❌ AWS proprietary format
- 📋 Use AWS SDK as reference
- 🎯 **Action**: Manual typing based on AWS SDK

### ⏸️ Phase 5: Skipped / Not Applicable

#### IBM Watson Speech-to-Text (Rank 9)
- ⚠️ **SKIP**: Deprecated, OpenAPI 2.0 legacy
- **Reason**: No longer maintained by IBM

#### Kaldi (Rank 10)
- ⚠️ **SKIP**: Self-hosted toolkit, not a hosted API
- **Reason**: Not applicable for cloud SDK

---

## Phase 2.1: Deepgram Integration (STARTING NOW)

### Step 1: Download OpenAPI Spec ✅

**Spec Location**: https://github.com/deepgram/deepgram-api-specs

```bash
# Clone the Deepgram specs repository
git clone https://github.com/deepgram/deepgram-api-specs.git /tmp/deepgram-specs

# Find the OpenAPI spec
ls -la /tmp/deepgram-specs/
# Look for: openapi.json, openapi.yaml, or similar
```

### Step 2: Add Orval Configuration

**File**: `orval.config.ts`

```typescript
deepgramApi: {
  input: {
    target: "./specs/deepgram-openapi.json",  // Or use GitHub raw URL
  },
  output: {
    target: "./src/generated/deepgram/schema/",
    mode: "single",
    client: "axios",
    clean: true,
    prettier: true,
  },
},

deepgramZod: {
  input: {
    target: "./specs/deepgram-openapi.json",
  },
  output: {
    target: "./src/generated/deepgram/zod/",
    mode: "single",
    client: "zod",
  },
}
```

### Step 3: Generate Types

```bash
# Add script to package.json
pnpm openapi:generate:deepgram

# Or run directly
orval --config orval.config.ts --project deepgramApi
orval --config orval.config.ts --project deepgramZod
```

### Step 4: Implement Adapter

**File**: `src/adapters/deepgram-adapter.ts`

```typescript
/**
 * Deepgram transcription provider adapter
 * Documentation: https://developers.deepgram.com/
 */

import axios, { type AxiosInstance } from "axios"
import type {
  AudioInput,
  ProviderCapabilities,
  TranscribeOptions,
  UnifiedTranscriptResponse,
} from "../router/types"
import { BaseAdapter, type ProviderConfig } from "./base-adapter"

// Import Deepgram generated types
import type { TranscriptionResponse } from "../generated/deepgram/schema/transcriptionResponse"
// ... other imports

export class DeepgramAdapter extends BaseAdapter {
  readonly name = "deepgram" as const
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    diarization: true,
    wordTimestamps: true,
    languageDetection: true,
    customVocabulary: true,
    summarization: true,
    sentimentAnalysis: true,
    entityDetection: false,
    piiRedaction: true,
  }

  private client?: AxiosInstance
  private baseUrl = "https://api.deepgram.com/v1"

  initialize(config: ProviderConfig): void {
    super.initialize(config)

    this.client = axios.create({
      baseURL: config.baseUrl || this.baseUrl,
      headers: {
        Authorization: `Token ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    })
  }

  async transcribe(
    audio: AudioInput,
    options?: TranscribeOptions
  ): Promise<UnifiedTranscriptResponse> {
    // Implementation
  }

  async getTranscript(
    transcriptId: string
  ): Promise<UnifiedTranscriptResponse> {
    // Implementation
  }
}

export function createDeepgramAdapter(
  config: ProviderConfig
): DeepgramAdapter {
  const adapter = new DeepgramAdapter()
  adapter.initialize(config)
  return adapter
}
```

### Step 5: Update Types

**File**: `src/router/types.ts`

```typescript
export type TranscriptionProvider =
  | "gladia"
  | "assemblyai"
  | "deepgram"  // ← Add here
```

### Step 6: Export Adapter

**File**: `src/adapters/index.ts`

```typescript
export * from "./base-adapter"
export * from "./gladia-adapter"
export * from "./assemblyai-adapter"
export * from "./deepgram-adapter"  // ← Add here
```

### Step 7: Add TypeDoc Configuration

**File**: `typedoc.deepgram.config.mjs`

```javascript
export default {
  entryPoints: ["./src/adapters/deepgram-adapter.ts"],
  out: "./docs/generated/deepgram",
  plugin: ["typedoc-plugin-markdown"],
  outputFileStrategy: "modules",
  readme: "none",
  disableSources: true,
  excludeExternals: true,
  name: "Voice Router SDK - Deepgram Provider",
  // ... other config
}
```

### Step 8: Update Build Scripts

**File**: `package.json`

```json
{
  "scripts": {
    "openapi:generate:deepgram": "pnpm openapi:clean:deepgram && orval --config orval.config.ts --project deepgramApi && orval --config orval.config.ts --project deepgramZod",
    "docs:generate": "... && pnpm docs:generate:deepgram",
    "docs:generate:deepgram": "typedoc --options typedoc.deepgram.config.mjs"
  }
}
```

### Step 9: Test & Document

```bash
# Build with new adapter
pnpm build:all

# Test
pnpm test

# Verify exports
node -e "console.log(require('./dist').DeepgramAdapter)"
```

### Step 10: Commit

```bash
git add -A
git commit -m "feat: add Deepgram transcription provider"
```

---

## Effort Estimation

### High Priority (Phase 2) - ~3-5 days each

| Provider | Effort | Complexity | Notes |
|----------|--------|------------|-------|
| Deepgram | 🟢 Low | OpenAPI available, similar to existing | 1-2 days |
| OpenAI Whisper | 🟡 Medium | Extract from full API spec | 2-3 days |
| Azure STT | 🟡 Medium | Enterprise API, complex auth | 3-5 days |

### Medium Priority (Phase 3) - ~2-4 days each

| Provider | Effort | Complexity | Notes |
|----------|--------|------------|-------|
| Speechmatics | 🟢 Low | OpenAPI available | 1-2 days |
| Google Cloud STT | 🟠 High | Discovery Doc conversion | 3-4 days |

### Low Priority (Phase 4) - ~5-7 days each

| Provider | Effort | Complexity | Notes |
|----------|--------|------------|-------|
| Rev AI | 🟠 High | No spec, manual typing | 5-7 days |
| Amazon Transcribe | 🟠 High | AWS SDK reference | 5-7 days |

---

## Success Criteria

For each provider integration:

- [ ] OpenAPI spec obtained (or types manually created)
- [ ] Types generated in `src/generated/{provider}/`
- [ ] Adapter implemented in `src/adapters/{provider}-adapter.ts`
- [ ] Adapter extends `BaseAdapter` with all required methods
- [ ] Response normalization to `UnifiedTranscriptResponse`
- [ ] Comprehensive JSDoc with examples
- [ ] TypeDoc configuration created
- [ ] Documentation generated
- [ ] Unit tests added
- [ ] Integration test with real API (manual)
- [ ] Exported in `src/adapters/index.ts`
- [ ] Added to `TranscriptionProvider` type union
- [ ] Build succeeds without errors
- [ ] Committed to git

---

## Current Status

### ✅ Completed (2/11)
- Gladia
- AssemblyAI

### 🚧 In Progress (0/11)
- None

### 🔴 TODO High Priority (3/11)
- Deepgram (Phase 2.1) ← **STARTING NOW**
- OpenAI Whisper (Phase 2.2)
- Azure Speech-to-Text (Phase 2.3)

### 📋 TODO Medium Priority (2/11)
- Speechmatics (Phase 3.1)
- Google Cloud STT (Phase 3.2)

### 🔻 TODO Low Priority (2/11)
- Rev AI (Phase 4.1)
- Amazon Transcribe (Phase 4.2)

### ⏸️ Skipped (2/11)
- IBM Watson STT (deprecated)
- Kaldi (self-hosted toolkit)

---

## Next Actions

1. **Download Deepgram OpenAPI spec** from GitHub
2. **Add Deepgram to orval.config.ts**
3. **Generate Deepgram types** with `pnpm openapi:generate:deepgram`
4. **Implement DeepgramAdapter** following existing patterns
5. **Test and document**
6. **Commit and move to next provider**

---

## Timeline Estimate

- **Phase 2 (High Priority)**: 6-10 days
  - Deepgram: 1-2 days
  - OpenAI Whisper: 2-3 days
  - Azure STT: 3-5 days

- **Phase 3 (Medium Priority)**: 5-8 days
  - Speechmatics: 1-2 days
  - Google Cloud STT: 3-4 days (conversion needed)

- **Phase 4 (Low Priority)**: 10-14 days
  - Rev AI: 5-7 days (manual typing)
  - Amazon Transcribe: 5-7 days (AWS SDK reference)

**Total Estimated Time**: 21-32 days for all providers

**Realistic Timeline**: 4-6 weeks (accounting for testing, documentation, and polish)

---

## Notes

- **Focus on quality over speed**: Each adapter should match the quality of Gladia/AssemblyAI
- **Test incrementally**: Don't implement all providers before testing
- **Document as you go**: Write JSDoc comments while implementing
- **Reuse patterns**: Follow established adapter architecture
- **Handle errors gracefully**: Each provider has unique error formats

---

**Last Updated**: December 8, 2025
**Current Phase**: Phase 2.1 - Deepgram Integration
**Next Milestone**: Complete High Priority Providers (3 adapters)
