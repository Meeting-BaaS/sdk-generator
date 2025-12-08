# Voice Router SDK - Implementation Plan

## 🎯 Goal
Create a **multi-provider transcription SDK** that unifies multiple Speech-to-Text APIs (Gladia, DeepGram, AssemblyAI, etc.) behind a single, provider-agnostic interface.

## 📋 Current Status

### ✅ Completed
- Created `voice-router` branch
- Analyzed existing architecture (reusable patterns identified)
- Updated `orval.config.ts` with initial provider configs
- Removed old Meeting BaaS v1/v2 code

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

### Priority 1 (Start Here)
- [x] **Gladia** - https://api.gladia.io/openapi.json
- [x] **AssemblyAI** - https://raw.githubusercontent.com/AssemblyAI/assemblyai-api-spec/main/openapi.json

### Priority 2
- [ ] **Deepgram** - (Need to find OpenAPI spec or manual types)
- [ ] **Rev.ai** - https://www.rev.ai/docs
- [ ] **Speechmatics** - https://docs.speechmatics.com/

### Priority 3 (Future)
- [ ] **Google Speech-to-Text**
- [ ] **Azure Speech Services**
- [ ] **AWS Transcribe**

## 🔧 Implementation Steps

### Phase 1: Foundation (Current)
1. ✅ Set up orval config for providers
2. [ ] Fix orval generation issues
3. [ ] Generate types for Gladia (simpler provider first)
4. [ ] Create base provider interface
5. [ ] Build first adapter (Gladia)

### Phase 2: Multi-Provider
1. [ ] Add AssemblyAI adapter
2. [ ] Add Deepgram adapter (manual types if needed)
3. [ ] Create VoiceRouter bridge class
4. [ ] Implement provider selection logic

### Phase 3: Polish
1. [ ] Add comprehensive tests
2. [ ] Generate documentation
3. [ ] Update README with new architecture
4. [ ] Add usage examples

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

1. **Working Gladia Integration**: Can transcribe audio using Gladia API
2. **Working AssemblyAI Integration**: Can transcribe audio using AssemblyAI API
3. **Unified Interface**: Single `VoiceRouter` class that works with both
4. **Type Safety**: Full TypeScript support with generated types
5. **Documentation**: Generated docs showing usage for each provider
6. **Tests**: Integration tests for each provider

## 🚀 Next Steps

### Immediate (Today)
1. Fix orval config to use `mode: "single"`
2. Generate Gladia types successfully
3. Create base provider interface
4. Build first Gladia adapter

### Short-term (This Week)
1. Add AssemblyAI adapter
2. Build VoiceRouter bridge
3. Add tests
4. Update README

### Medium-term (Next Week)
1. Add Deepgram (manual types if needed)
2. Add more providers
3. Comprehensive documentation
4. Publish v1.0.0

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

