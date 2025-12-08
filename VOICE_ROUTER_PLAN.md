# Voice Router SDK - Implementation Plan

## 🎯 Goal
Create a **multi-provider transcription SDK** that unifies multiple Speech-to-Text APIs (Gladia, DeepGram, AssemblyAI, etc.) behind a single, provider-agnostic interface.

## 📋 Current Status

### ✅ Completed
- Created `voice-router` branch
- Analyzed existing architecture (reusable patterns identified)
- Updated `orval.config.ts` with initial provider configs
- Removed old Meeting BaaS v1/v2 code
- Generated types for Gladia and AssemblyAI
- Created base provider interface (`BaseAdapter`)
- **Implemented Gladia adapter** - Full transcription support with diarization, summarization, etc.
- **Implemented AssemblyAI adapter** - Full transcription support with advanced features
- Created VoiceRouter bridge class with provider selection strategies
- Generated comprehensive documentation for all providers
- Build system working with unified commands

### 🚧 In Progress
- Testing adapters with real API calls
- Adding usage examples

### ⚠️ Blockers Found
1. **Orval + Node 18 compatibility**: `toSorted()` not available in Node 18
   - Solution: Use `mode: "single"` instead of `mode: "tags-split"`

2. **Deepgram OpenAPI spec**: No public OpenAPI spec found at standard URL
   - Need to find correct URL or use manual typing

3. **Provider OpenAPI quality**: Each provider has different schema quality/formats
   - May need custom transformers (like existing `scripts/preprocess.js`)

## 🏗️ Architecture Design

### Provider Layer
Each transcription provider gets:
- Generated types from OpenAPI (`src/generated/{provider}/`)
- Provider adapter class (`src/adapters/{provider}-adapter.ts`)
- Normalized interface implementation

### Bridge Layer
- `VoiceRouter` class - main entry point
- Unified interface for common operations:
  - `transcribe(audio, options)` - Synchronous transcription
  - `transcribeStream(audioStream, options)` - Real-time transcription
  - `getTranscript(id)` - Retrieve completed transcription
  - `getSpeakers(id)` - Get speaker diarization
  - `getWordTimestamps(id)` - Get word-level timestamps

### Response Normalization
```typescript
interface UnifiedTranscriptResponse {
  success: boolean
  provider: 'gladia' | 'deepgram' | 'assemblyai' | ...
  data?: {
    id: string
    text: string
    confidence: number
    speakers?: Speaker[]
    words?: Word[]
    language?: string
    duration?: number
  }
  error?: {
    code: string
    message: string
    details?: unknown
  }
}
```

## 📦 Target Providers

**⚠️ See [PROVIDER_INTEGRATION_PLAN.md](./PROVIDER_INTEGRATION_PLAN.md) for comprehensive provider integration roadmap**

### ✅ Completed (2/11 providers)
- [x] **Gladia** - https://api.gladia.io/openapi.json - ✅ Adapter implemented
- [x] **AssemblyAI** - https://github.com/AssemblyAI/assemblyai-api-spec - ✅ Adapter implemented

### 🚧 Phase 2: High Priority (3 providers)
- [ ] **Deepgram** - https://github.com/deepgram/deepgram-api-specs - 🔴 TODO - **NEXT**
- [ ] **OpenAI Whisper** - https://app.stainless.com/api/spec/documented/openai/openapi.documented.yml - 🔴 TODO
- [ ] **Azure Speech-to-Text** - https://github.com/Azure/azure-rest-api-specs - 🔴 TODO

### 📋 Phase 3: Medium Priority (2 providers)
- [ ] **Speechmatics** - https://docs.speechmatics.com/jobsapi - 🔴 TODO
- [ ] **Google Cloud STT** - https://speech.googleapis.com/$discovery/rest?version=v2 - ⚠️ Discovery Doc (needs conversion)

### 🔻 Phase 4: Low Priority (2 providers)
- [ ] **Rev.ai** - No public OpenAPI spec - Manual typing required
- [ ] **Amazon Transcribe** - AWS proprietary - Manual typing required

### ⏸️ Skipped (2 providers)
- IBM Watson STT (deprecated)
- Kaldi (self-hosted toolkit)

## 🔧 Implementation Steps

### Phase 1: Foundation ✅ COMPLETED
1. ✅ Set up orval config for providers
2. ✅ Fix orval generation issues (workaround with mode: "single")
3. ✅ Generate types for Gladia
4. ✅ Create base provider interface
5. ✅ Build first adapter (Gladia)

### Phase 2: Multi-Provider ✅ COMPLETED
1. ✅ Add AssemblyAI adapter - **DONE Dec 8, 2025**
2. ⏳ Add Deepgram adapter (manual types needed - no OpenAPI spec)
3. ✅ Create VoiceRouter bridge class
4. ✅ Implement provider selection logic (explicit, default, round-robin)

### Phase 3: Polish (Current)
1. ⏳ Add comprehensive tests
2. ✅ Generate documentation
3. ⏳ Update README with new architecture
4. ⏳ Add usage examples

## 🚧 Known Issues & Solutions

### Issue 1: Orval toSorted() Error
**Problem**: Orval uses `toSorted()` which doesn't exist in Node 18

**Solutions**:
- Option A: Upgrade to Node 20+ (check `package.json` engines)
- Option B: Use `mode: "single"` instead of `mode: "tags-split"`
- Option C: Use custom transformer to polyfill

**Recommendation**: Use Option B for now

### Issue 2: Deepgram OpenAPI Spec
**Problem**: No public OpenAPI spec found

**Solutions**:
- Option A: Find correct URL (check Deepgram docs)
- Option B: Generate from their API docs manually
- Option C: Use community-maintained spec (if exists)
- Option D: Write manual TypeScript types

**Recommendation**: Start with Gladia + AssemblyAI (working specs), add Deepgram later

### Issue 3: Different Provider Capabilities
**Problem**: Each provider has different features (some have speaker diarization, some don't)

**Solution**: Use capability flags in provider interface:
```typescript
interface ProviderCapabilities {
  streaming: boolean
  diarization: boolean
  wordTimestamps: boolean
  languageDetection: boolean
  customVocabulary: boolean
}
```

## 📂 File Structure

```
voice-router-sdk/
├── src/
│   ├── generated/              # Auto-generated from OpenAPI
│   │   ├── gladia/
│   │   ├── assemblyai/
│   │   └── deepgram/
│   ├── adapters/               # Provider adapters
│   │   ├── base-adapter.ts
│   │   ├── gladia-adapter.ts
│   │   ├── assemblyai-adapter.ts
│   │   └── deepgram-adapter.ts
│   ├── router/                 # Bridge layer
│   │   ├── voice-router.ts
│   │   ├── types.ts
│   │   └── normalizer.ts
│   └── index.ts                # Main export
├── scripts/
│   └── preprocess.js           # OpenAPI fixer (reused)
├── docs/
│   └── generated/
│       ├── gladia/
│       ├── assemblyai/
│       └── router/
├── orval.config.ts             # Provider configs
├── package.json                # Scripts per provider
└── README.md                   # Usage guide
```

## 🎯 Success Criteria

1. ✅ **Working Gladia Integration**: Can transcribe audio using Gladia API - **DONE**
2. ✅ **Working AssemblyAI Integration**: Can transcribe audio using AssemblyAI API - **DONE**
3. ✅ **Unified Interface**: Single `VoiceRouter` class that works with both - **DONE**
4. ✅ **Type Safety**: Full TypeScript support with generated types - **DONE**
5. ✅ **Documentation**: Generated docs showing usage for each provider - **DONE**
6. ⏳ **Tests**: Integration tests for each provider - **TODO**

## 🚀 Next Steps

### ✅ Completed (Dec 8, 2025)
1. ✅ Fix orval config to use `mode: "single"`
2. ✅ Generate Gladia types successfully
3. ✅ Create base provider interface
4. ✅ Build first Gladia adapter
5. ✅ Add AssemblyAI adapter
6. ✅ Build VoiceRouter bridge
7. ✅ Generate comprehensive documentation

### Immediate (Now)
1. Add integration tests for both adapters
2. Update main README with new Voice Router architecture
3. Add usage examples and guides
4. Test with real API keys

### Short-term (This Week)
1. Add Deepgram adapter (manual types or find spec)
2. Add error handling tests
3. Performance testing and optimization
4. Create migration guide from Meeting BaaS v1/v2

### Medium-term (Next Week)
1. Add more providers (Rev.ai, Speechmatics)
2. Add streaming transcription support
3. Publish v6.0.0 as Voice Router SDK
4. Update package metadata and branding

## ❓ Open Questions

1. **Package Name**: Keep `@meeting-baas/sdk` or rename to `@voice-router/sdk`?
2. **API Key Management**: Single config object or per-provider?
   ```typescript
   // Option A: Single config
   new VoiceRouter({
     gladia: { api_key: '...' },
     assemblyai: { api_key: '...' }
   })

   // Option B: Per-provider
   new VoiceRouter('gladia', { api_key: '...' })
   ```
3. **Provider Selection**: Auto-detect, explicit, or round-robin?
4. **Streaming Support**: All providers or optional feature?

