# Provider OpenAPI Shortfalls

This document tracks gaps in provider OpenAPI specifications that require manual workarounds in the SDK.

## Overview

The SDK aims to use **only generated types** from provider OpenAPI specs. However, some providers have incomplete specs that require manual const definitions.

| Provider | OpenAPI Completeness | Manual Workarounds | listTranscripts | getTranscript | getAudioFile |
|----------|---------------------|-------------------|-----------------|---------------|--------------|
| **Gladia** | Excellent | None | ✅ Full | ✅ Full | ✅ Yes |
| **Deepgram** | Good | Sample rate, Model enum, Language | ⚠️ Metadata | ✅ Full (requires projectId) | ❌ No |
| **AssemblyAI** | Moderate | Sample rate, Encoding, Speech model | ✅ Full | ✅ Full | ❌ No |
| **Azure** | Good | None | ✅ Full | ✅ Full | ❌ No |

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
| `audioUrl` | `audio_url` | N/A | `contentUrls[0]` | `metadata.request_id` |
| `createdAt` | `created` | `created_at` | `createdDateTime` | N/A |
| `completedAt` | `completed` | `completed_at` | `lastActionDateTime` | N/A |
| `audioDuration` | `audio_duration` | `metadata.audio_duration` | N/A | `metadata.duration` |
| `kind` | N/A | `kind` ("pre-recorded"/"live") | N/A | N/A |

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
| `GladiaStatus` | Gladia | ✅ OpenAPI | `TranscriptionControllerListV2StatusItem` |
| `AssemblyAIEncoding` | AssemblyAI | ⚠️ Type-checked | Spec has union type |
| `AssemblyAISpeechModel` | AssemblyAI | ⚠️ Type-checked | Spec has union type |
| `AssemblyAISampleRate` | AssemblyAI | ❌ Unchecked | Spec uses `number` |
| `AssemblyAIStatus` | AssemblyAI | ✅ OpenAPI | `TranscriptStatus` |
| `AzureStatus` | Azure | ✅ OpenAPI | `Status` |
