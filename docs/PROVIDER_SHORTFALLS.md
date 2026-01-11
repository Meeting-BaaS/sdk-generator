# Provider OpenAPI Shortfalls

This document tracks gaps in provider OpenAPI specifications that require manual workarounds in the SDK.

## Overview

The SDK aims to use **only generated types** from provider OpenAPI specs. However, some providers have incomplete specs that require manual const definitions.

| Provider | OpenAPI Completeness | Manual Workarounds | listTranscripts | getTranscript | getAudioFile |
|----------|---------------------|-------------------|-----------------|---------------|--------------|
| **Gladia** | Excellent | None | ✅ Full | ✅ Full | ✅ Yes |
| **Deepgram** | Good | Sample rate, Model enum, Language | ✅ Metadata | ✅ Full (requires projectId) | ❌ No |
| **AssemblyAI** | Moderate | Sample rate, Encoding, Speech model | ✅ Full | ✅ Full | ❌ No |
| **Azure** | Good | None | ✅ Full | ✅ Full | ❌ No |

---

## Audio Retrieval & Re-transcription

This table shows what's available for re-processing or exporting transcription data:

| Capability | Gladia | AssemblyAI | Azure | Deepgram |
|------------|--------|------------|-------|----------|
| **List transcripts** | ✅ Full metadata | ✅ Full metadata | ✅ Full metadata | ✅ Request history |
| **Get full transcript** | ✅ | ✅ | ✅ | ✅ (requires projectId) |
| **Audio file stored** | ✅ By provider | ❌ | ❌ | ❌ |
| **Download audio** | ✅ `getAudioFile()` | ❌ | ❌ | ❌ |
| **Source URL returned** | ✅ `sourceAudioUrl` | ✅ `sourceAudioUrl` | ❌ Write-only | ❌ Not stored |
| **Re-transcribe** | ✅ Download & resubmit | ⚠️ If URL still valid | ❌ Store your own | ❌ Store your own |

### Use Cases by Provider

**Gladia** - Best for re-processing:
```typescript
// List, download audio, re-transcribe with different settings
const { transcripts } = await gladiaAdapter.listTranscripts({ limit: 100 })
for (const t of transcripts) {
  if (t.data?.metadata?.audioFileAvailable) {
    const audio = await gladiaAdapter.getAudioFile(t.data.id)
    // Re-transcribe with different options
    await gladiaAdapter.transcribe({ type: 'buffer', buffer: Buffer.from(audio.data!) }, newOptions)
  }
}
```

**AssemblyAI** - Re-transcribe if URL still accessible:
```typescript
const { transcripts } = await assemblyaiAdapter.listTranscripts({ status: 'completed' })
for (const t of transcripts) {
  const sourceUrl = t.data?.metadata?.sourceAudioUrl
  if (sourceUrl) {
    // Only works if URL is still valid/accessible
    await assemblyaiAdapter.transcribe({ type: 'url', url: sourceUrl }, newOptions)
  }
}
```

**Deepgram** - Export metadata, store your own audio references:
```typescript
// Useful for: audit trails, usage analytics, billing reconciliation
const { transcripts } = await deepgramAdapter.listTranscripts({
  afterDate: '2026-01-01',
  status: 'succeeded'
})

// Export to CSV for reporting
const csv = transcripts.map(t => ({
  requestId: t.data?.id,
  createdAt: t.data?.metadata?.createdAt,
  endpoint: t.data?.metadata?.apiPath,
  status: t.data?.status
}))

// To re-transcribe: you must store audio URLs yourself
// const myAudioUrl = await myDatabase.getAudioUrl(t.data?.id)
```

**Azure** - Similar to Deepgram:
```typescript
const { transcripts } = await azureAdapter.listTranscripts({ status: 'Succeeded' })
// contentUrls is write-only - not returned in responses
// Store your own audio references for re-transcription
```

---

## List Filtering Capabilities

Each provider supports different filtering options. The SDK provides a unified interface where each provider implements what they support:

| Filter Option | Gladia | AssemblyAI | Azure | Deepgram |
|---------------|--------|------------|-------|----------|
| `limit` | ✅ | ✅ | ✅ `top` | ✅ |
| `offset` | ✅ | ❌ | ✅ `skip` | ❌ |
| `page` | ❌ | ❌ | ❌ | ✅ |
| `cursor` (after_id) | ❌ | ✅ | ❌ | ❌ |
| `status` | ✅ | ✅ | ✅ OData | ✅ |
| `date` (exact) | ✅ | ✅ `created_on` | ❌ | ❌ |
| `afterDate` | ✅ | ❌ | ✅ OData | ✅ `start` |
| `beforeDate` | ✅ | ❌ | ✅ OData | ✅ `end` |
| `kind` (pre-recorded/live) | ✅ | ❌ | ❌ | ❌ |
| `requestId` | ❌ | ❌ | ❌ | ✅ |
| `endpoint` | ❌ | ❌ | ❌ | ✅ |
| `customMetadata` | ✅ | ❌ | ❌ | ❌ |

### Deepgram-specific filters

Deepgram's request history API has unique filtering for API usage analysis:

```typescript
await deepgramAdapter.listTranscripts({
  afterDate: '2026-01-01',
  beforeDate: '2026-01-31',
  status: 'succeeded',
  deepgram: {
    endpoint: '/v1/listen',      // Filter by API endpoint
    method: 'POST',              // Filter by HTTP method
    request_id: 'abc123',        // Find specific request
    deployment: 'production'     // Filter by deployment
  }
})
```

---

## Deepgram

### Sample Rate (Not in OpenAPI)

**Issue:** Deepgram's OpenAPI spec defines `sample_rate` as plain `number` with no enum.

**Workaround:** Manual `DeepgramSampleRate` const (unchecked):

```typescript
// src/constants.ts
export const DeepgramSampleRate = {
  NUMBER_8000: 8000,
  NUMBER_16000: 16000,
  NUMBER_32000: 32000,
  NUMBER_44100: 44100,
  NUMBER_48000: 48000
} as const  // NOT type-checked
```

**Source:** Values from [Deepgram documentation](https://developers.deepgram.com/docs/streaming)

### Model Enum (Union type, not const object)

**Issue:** OpenAPI generates `ListenV1ModelParameter` as a union type with `| string` fallback, not a const object.

**Workaround:** Manual `DeepgramModel` const with `satisfies` check:

```typescript
export const DeepgramModel = {
  "nova-3": "nova-3",
  "nova-2": "nova-2",
  // ...
} as const satisfies Record<string, ListenV1ModelParameter>
```

**Type Safety:** Compile-time error if values drift from generated type.

### Language (Plain string, no enum)

**Issue:** OpenAPI generates `ListenV1LanguageParameter` as plain `string` type.

**Decision:** Not exported as a const - users pass BCP-47 language codes directly.

### Fully Generated Deepgram Constants

These constants are direct re-exports from OpenAPI-generated types:

| Const | Generated Type | Values |
|-------|---------------|--------|
| `DeepgramEncoding` | `ListenV1EncodingParameter` | `linear16`, `flac`, `mulaw`, `opus`, `speex`, `g729` |
| `DeepgramRedact` | `ListenV1RedactParameterOneOfItem` | `pci`, `pii`, `numbers` |
| `DeepgramTopicMode` | `SharedCustomTopicModeParameter` | `extended`, `strict` |
| `DeepgramIntentMode` | `SharedCustomIntentModeParameter` | `extended`, `strict` |
| `DeepgramCallbackMethod` | `SharedCallbackMethodParameter` | `POST`, `PUT` |
| `DeepgramStatus` | `ManageV1FilterStatusParameter` | `succeeded`, `failed` |

### listTranscripts vs getTranscript

**`listTranscripts()`** - Returns metadata only (for listing/filtering):
- `request_id` - Unique request identifier
- `created` - Timestamp
- `path` - API endpoint used
- `code` - HTTP status code (success/failure)
- `api_key_id` - Which API key was used

**`getTranscript(requestId)`** - Returns FULL transcript data:
- Complete transcript text
- Words with timestamps
- Speaker diarization results
- All metadata from original response

**Workflow:**
```typescript
// 1. Initialize with projectId
adapter.initialize({
  apiKey: process.env.DEEPGRAM_API_KEY,
  projectId: process.env.DEEPGRAM_PROJECT_ID
})

// 2. List requests (metadata only)
const { transcripts } = await adapter.listTranscripts({
  status: 'succeeded',
  limit: 50
})

// 3. Get full transcript for specific request
const fullTranscript = await adapter.getTranscript(transcripts[0].data?.id)
console.log(fullTranscript.data?.text)  // Full transcript text!
console.log(fullTranscript.data?.words) // Words with timestamps!
```

---

## AssemblyAI

### Sample Rate (Not in OpenAPI)

**Issue:** AssemblyAI's streaming SDK accepts any `number` for sample rate. No enum exists in the spec.

**Workaround:** Manual `AssemblyAISampleRate` const (unchecked):

```typescript
export const AssemblyAISampleRate = {
  rate8000: 8000,
  rate16000: 16000,
  rate22050: 22050,
  rate44100: 44100,
  rate48000: 48000
} as const  // NOT type-checked
```

**Source:** Values from [AssemblyAI documentation](https://www.assemblyai.com/docs/speech-to-text/streaming)

### Encoding (Union type, not const object)

**Issue:** `AudioEncoding` is a union type (`"pcm_s16le" | "pcm_mulaw"`), not a const object.

**Workaround:** Manual `AssemblyAIEncoding` const with `satisfies` check:

```typescript
export const AssemblyAIEncoding = {
  pcmS16le: "pcm_s16le",
  pcmMulaw: "pcm_mulaw"
} as const satisfies Record<string, AudioEncoding>
```

### Speech Model (Union type, not const object)

**Issue:** `StreamingSpeechModel` is a union type, not a const object.

**Workaround:** Manual `AssemblyAISpeechModel` const with `satisfies` check:

```typescript
export const AssemblyAISpeechModel = {
  english: "universal-streaming-english",
  multilingual: "universal-streaming-multilingual"
} as const satisfies Record<string, StreamingSpeechModel>
```

---

## Gladia

Gladia has the most complete OpenAPI spec. All constants are direct re-exports:

| Const | Generated Type | Status |
|-------|---------------|--------|
| `GladiaEncoding` | `StreamingSupportedEncodingEnum` | ✅ |
| `GladiaSampleRate` | `StreamingSupportedSampleRateEnum` | ✅ |
| `GladiaBitDepth` | `StreamingSupportedBitDepthEnum` | ✅ |
| `GladiaModel` | `StreamingSupportedModels` | ✅ |
| `GladiaLanguage` | `TranscriptionLanguageCodeEnum` | ✅ |
| `GladiaRegion` | `StreamingSupportedRegions` | ✅ |
| `GladiaStatus` | `TranscriptionControllerListV2StatusItem` | ✅ |

---

## Azure

Azure Speech-to-Text has a complete OpenAPI spec. All status values are generated:

| Const | Generated Type | Status |
|-------|---------------|--------|
| `AzureStatus` | `Status` | ✅ |

---

## Type Safety Levels

### ✅ OpenAPI (Best)
Direct re-export from generated types. Any spec changes automatically update the SDK.

```typescript
export { StreamingSupportedEncodingEnum as GladiaEncoding } from "./generated/..."
```

### ⚠️ Type-checked (Good)
Manual const with `satisfies` constraint. Compile-time error if values become invalid.

```typescript
export const DeepgramModel = { ... } as const satisfies Record<string, ListenV1ModelParameter>
```

### ❌ Unchecked (Risky)
Manual const with no type constraint. Values may drift from provider's actual API.

```typescript
export const DeepgramSampleRate = { ... } as const  // No type check!
```

---

## Contributing

If you find a provider has added types to their OpenAPI spec that we're manually defining:

1. Check if the generated type exists in `src/generated/{provider}/`
2. If it does, update `src/constants.ts` to re-export it instead
3. Remove the manual const and update the JSDoc
4. Run `pnpm build` to verify

---

---

## Unified Response Types (Manual Normalization)

The following types are **intentionally manual** because they normalize different provider schemas into a unified interface. This is the SDK's core value-add.

### TranscriptMetadata

Normalizes metadata fields across providers:

| SDK Field | AssemblyAI | Gladia | Azure | Deepgram |
|-----------|-----------|--------|-------|----------|
| `sourceAudioUrl` | `audio_url` | `file.source` | ❌ (write-only) | ❌ (not stored) |
| `audioFileAvailable` | `false` | `true` | `false` | `false` |
| `createdAt` | `created` | `created_at` | `createdDateTime` | `created` |
| `completedAt` | `completed` | `completed_at` | `lastActionDateTime` | N/A |
| `audioDuration` | `audio_duration` | `file.audio_duration` | N/A | N/A |
| `kind` | N/A | `kind` ("pre-recorded"/"live") | N/A | N/A |
| `apiPath` | N/A | N/A | N/A | `path` |
| `apiKeyId` | N/A | N/A | N/A | `api_key_id` |

**Why manual:** No single OpenAPI spec defines these unified field names.

### TranscriptData

Normalizes the core transcript structure:

| SDK Field | AssemblyAI | Gladia | Azure |
|-----------|-----------|--------|-------|
| `id` | `id` | `id` | `self.split('/').pop()` |
| `text` | `text` | `result.transcription.full_transcript` | Combined from files |
| `status` | `status` | `status` (mapped) | `status` (mapped) |
| `words` | `words` | `result.transcription.utterances[].words` | `recognizedPhrases[].nBest[].words` |

**Why manual:** Provider response structures differ significantly.

### ListTranscriptsResponse

Wrapper for list results:

```typescript
interface ListTranscriptsResponse {
  transcripts: UnifiedTranscriptResponse[]
  total?: number
  hasMore?: boolean
}
```

**Why manual:** Pagination differs (cursor-based vs offset-based vs next URL).

### Accessing Raw Provider Types

For users who need provider-specific types, use the `raw` field:

```typescript
const result = await adapter.transcribe(audio);

// Typed access to provider-specific response
if (result.raw) {
  // result.raw is typed as AssemblyAITranscript | GladiaPreRecordedResponse | etc.
}
```

Or use the generic parameter:

```typescript
const result: UnifiedTranscriptResponse<'assemblyai'> = await adapter.transcribe(audio);
// result.raw is now typed as AssemblyAITranscript
```

---

## Summary Table

| Const | Provider | Type Safety | Reason |
|-------|----------|-------------|--------|
| `DeepgramEncoding` | Deepgram | ✅ OpenAPI | `ListenV1EncodingParameter` |
| `DeepgramRedact` | Deepgram | ✅ OpenAPI | `ListenV1RedactParameterOneOfItem` |
| `DeepgramTopicMode` | Deepgram | ✅ OpenAPI | `SharedCustomTopicModeParameter` |
| `DeepgramIntentMode` | Deepgram | ✅ OpenAPI | `SharedCustomIntentModeParameter` |
| `DeepgramCallbackMethod` | Deepgram | ✅ OpenAPI | `SharedCallbackMethodParameter` |
| `DeepgramStatus` | Deepgram | ✅ OpenAPI | `ManageV1FilterStatusParameter` |
| `DeepgramSampleRate` | Deepgram | ❌ Unchecked | Spec uses `number` |
| `DeepgramModel` | Deepgram | ⚠️ Type-checked | Spec has `\| string` fallback |
| `DeepgramLanguage` | Deepgram | N/A (not exported) | Spec uses plain `string` |
| `GladiaEncoding` | Gladia | ✅ OpenAPI | `StreamingSupportedEncodingEnum` |
| `GladiaSampleRate` | Gladia | ✅ OpenAPI | `StreamingSupportedSampleRateEnum` |
| `GladiaBitDepth` | Gladia | ✅ OpenAPI | `StreamingSupportedBitDepthEnum` |
| `GladiaModel` | Gladia | ✅ OpenAPI | `StreamingSupportedModels` |
| `GladiaLanguage` | Gladia | ✅ OpenAPI | `TranscriptionLanguageCodeEnum` |
| `GladiaRegion` | Gladia | ✅ OpenAPI | `StreamingSupportedRegions` |
| `GladiaStatus` | Gladia | ✅ OpenAPI | `TranscriptionControllerListV2StatusItem` |
| `AssemblyAIEncoding` | AssemblyAI | ⚠️ Type-checked | Spec has union type |
| `AssemblyAISpeechModel` | AssemblyAI | ⚠️ Type-checked | Spec has union type |
| `AssemblyAISampleRate` | AssemblyAI | ❌ Unchecked | Spec uses `number` |
| `AssemblyAIStatus` | AssemblyAI | ✅ OpenAPI | `TranscriptStatus` |
| `AzureStatus` | Azure | ✅ OpenAPI | `Status` |

---

## OpenAPI Spec Sources

All specs are stored locally in `./specs/` and can be synced from their authoritative sources.

| Provider | Source URL | Format | Sync Command |
|----------|-----------|--------|--------------|
| Gladia | https://api.gladia.io/openapi.json | JSON | `pnpm openapi:sync:gladia` |
| AssemblyAI | https://github.com/AssemblyAI/assemblyai-api-spec/blob/main/openapi.json | JSON | `pnpm openapi:sync:assemblyai` |
| AssemblyAI AsyncAPI | https://github.com/AssemblyAI/assemblyai-api-spec/blob/main/asyncapi.json | JSON | `pnpm openapi:sync:assemblyai` |
| Deepgram | https://github.com/deepgram/deepgram-api-specs/blob/main/openapi.yml | YAML | `pnpm openapi:sync:deepgram` |
| OpenAI | https://github.com/openai/openai-openapi (filtered to audio endpoints) | YAML | `pnpm openapi:sync --provider openai` |
| Azure STT | https://github.com/Azure/azure-rest-api-specs (Speech/SpeechToText v3.2) | JSON | `pnpm openapi:sync --provider azure` |
| Speechmatics | Manual (spec has validation errors) | YAML | - |

### Syncing Specs

```bash
# Sync all specs from remote sources
pnpm openapi:sync

# Sync specific provider
pnpm openapi:sync:gladia
pnpm openapi:sync:deepgram
pnpm openapi:sync:assemblyai

# Validate all local specs
pnpm openapi:validate

# Full rebuild with fresh specs
pnpm openapi:rebuild
```

### Known Spec Issues

| Provider | Issue | Workaround |
|----------|-------|------------|
| Deepgram | Duplicate parameter names cause Orval type conflicts | Input transformer in `orval.config.ts` inlines conflicting parameters |
| OpenAI | Official spec covers entire API, not just audio endpoints | `fix-openai-spec.js` filters to audio endpoints and fixes malformed arrays |
| Azure | Swagger 2.0 spec covers full Speech API v3.2 | Synced from `Azure/azure-rest-api-specs` (works without modifications) |
| Speechmatics | Official Swagger 2.0 spec has validation errors | Manual spec with fixes in `specs/speechmatics-batch.yaml` |

### Field Config Type Discrepancies

Some provider specs have type definitions that don't match their documentation or actual API behavior.

#### Gladia: `custom_vocabulary` Misleading Type

**Issue:** The `custom_vocabulary` field is typed as `boolean`, but the description says:
> "Can be either boolean...or an array with specific vocabulary list"

**Reality:** Gladia's API uses **two separate fields**:
- `custom_vocabulary: boolean` - Enables/disables the feature
- `custom_vocabulary_config: { vocabulary: [...] }` - Contains the actual vocabulary array

**Impact on Field Configs:**
```typescript
const fields = getGladiaTranscriptionFields()
// custom_vocabulary → type: "boolean" ✓ (correct)
// custom_vocabulary_config → type: "object" with nestedFields ✓ (correct)
```

**Workaround:** None needed. The types are correct, only the description is misleading.

#### AssemblyAI: Streaming SDK vs AsyncAPI Mismatch (RESOLVED)

**Issue:** The Node SDK streaming types differ from the AsyncAPI spec:

| SDK Type (`streaming-types.ts`) | AsyncAPI Zod (`streaming-types.zod.ts`) |
|--------------------------------|----------------------------------------|
| `keyterms?: string[]` | ✅ Now merged |
| `keytermsPrompt?: string[]` | ✅ Now merged |
| `speechModel?: StreamingSpeechModel` | ✅ Now merged |
| `languageDetection?: boolean` | ✅ Now merged |
| Not present | `wordBoost: string` (JSON-encoded, legacy) |

**Solution:** The sync script (`scripts/sync-assemblyai-streaming-types.js`) now:
1. Parses AsyncAPI spec for legacy WebSocket fields
2. Parses SDK TypeScript types (`streaming-types.ts`) for v3 fields
3. Merges both sources into the Zod output

**Result:** Field configs now include all SDK v3 fields:
```typescript
const fields = getAssemblyAIStreamingFields()
// Now includes: keyterms, keytermsPrompt, speechModel, languageDetection, etc.
```

Fields marked with `.describe("From SDK v3")` indicate they were extracted from the SDK types rather than the AsyncAPI spec.

---

## Regional Endpoints

Regional endpoint support for data residency, compliance, and latency optimization.

### Official Documentation Links

| Provider | Documentation |
|----------|--------------|
| **Deepgram** | https://developers.deepgram.com/reference/custom-endpoints |
| **Speechmatics** | https://docs.speechmatics.com/get-started/authentication#supported-endpoints |
| **Soniox** | https://soniox.com/docs/stt/data-residency |
| **Gladia** | Streaming regions via OpenAPI spec (`StreamingSupportedRegions`) |

### Regional Endpoint Summary

| Provider | Regions | Config Level | Dynamic Switch |
|----------|---------|--------------|----------------|
| **Deepgram** | `global`, `eu` | Adapter init | `setRegion()` |
| **Speechmatics** | `eu1`, `eu2`*, `us1`, `us2`*, `au1` | Adapter init | `setRegion()` |
| **Soniox** | `us`, `eu`, `jp` | Adapter init | `setRegion()`** |
| **Gladia** | `us-west`, `eu-west` | Streaming options | Per-request |
| **Azure** | Via `speechConfig` | Adapter init | Reinitialize |

\* Enterprise only
\*\* Soniox API keys are region-specific - switching regions also requires changing the API key

### Deepgram Endpoints

| Region | REST API | WebSocket |
|--------|----------|-----------|
| Global (default) | `api.deepgram.com` | `wss://api.deepgram.com` |
| EU | `api.eu.deepgram.com` | `wss://api.eu.deepgram.com` |
| Dedicated | `{SHORT_UID}.{REGION}.api.deepgram.com` | Use `baseUrl` |
| Self-hosted | Custom | Use `baseUrl` |

```typescript
import { createDeepgramAdapter, DeepgramRegion } from 'voice-router-dev'

// EU endpoint
const adapter = createDeepgramAdapter({
  apiKey: process.env.DEEPGRAM_API_KEY,
  region: DeepgramRegion.eu
})

// Dedicated or self-hosted - use baseUrl
const dedicated = createDeepgramAdapter({
  apiKey: process.env.DEEPGRAM_API_KEY,
  baseUrl: 'https://abc123.eu-west-1.api.deepgram.com/v1'
})
```

### Speechmatics Endpoints

| Region | Endpoint | Availability |
|--------|----------|--------------|
| `eu1` | `eu1.asr.api.speechmatics.com` | All customers |
| `eu2` | `eu2.asr.api.speechmatics.com` | Enterprise only |
| `us1` | `us1.asr.api.speechmatics.com` | All customers |
| `us2` | `us2.asr.api.speechmatics.com` | Enterprise only |
| `au1` | `au1.asr.api.speechmatics.com` | All customers |

```typescript
import { createSpeechmaticsAdapter, SpeechmaticsRegion } from 'voice-router-dev'

const adapter = createSpeechmaticsAdapter({
  apiKey: process.env.SPEECHMATICS_API_KEY,
  region: SpeechmaticsRegion.us1
})

// Switch regions dynamically for testing
adapter.setRegion(SpeechmaticsRegion.au1)
```

### Soniox Endpoints (Sovereign Cloud)

| Region | REST API | WebSocket (Real-time) | Availability |
|--------|----------|----------------------|--------------|
| `us` (default) | `api.soniox.com` | `stt-rt.soniox.com` | All customers |
| `eu` | `api.eu.soniox.com` | `stt-rt.eu.soniox.com` | All customers |
| `jp` | `api.jp.soniox.com` | `stt-rt.jp.soniox.com` | All customers |

**Coming soon:** Korea, Australia, India, Canada, Saudi Arabia, UK, Brazil

**Important:** Soniox API keys are region-specific. Each project is created with a specific
region, and the API key only works with that region's endpoint.

```typescript
import { createSonioxAdapter, SonioxRegion } from 'voice-router-dev'

// US project (default)
const usAdapter = createSonioxAdapter({
  apiKey: process.env.SONIOX_US_API_KEY,
  region: SonioxRegion.us
})

// EU project (requires EU project API key)
const euAdapter = createSonioxAdapter({
  apiKey: process.env.SONIOX_EU_API_KEY,
  region: SonioxRegion.eu
})
```

### Dynamic Region Switching

Deepgram and Speechmatics support changing regions without reinitializing (same API key works):

```typescript
// Test different regions
adapter.setRegion(DeepgramRegion.eu)
const euResult = await adapter.transcribe(audio)

adapter.setRegion(DeepgramRegion.global)
const globalResult = await adapter.transcribe(audio)

// Check current region
console.log(adapter.getRegion())
```
