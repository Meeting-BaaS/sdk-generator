# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.2] - 2026-01-12

### Added

#### Typed Soniox Streaming Options

New `SonioxStreamingOptions` interface with full type safety - no more `as any` casts needed:

```typescript
await adapter.transcribeStream({
  sonioxStreaming: {
    model: 'stt-rt-preview',
    enableSpeakerDiarization: true,
    enableEndpointDetection: true,
    context: {
      terms: ['TypeScript', 'React'],
      text: 'Technical discussion'
    },
    translation: { type: 'one_way', target_language: 'es' }
  }
});
```

**Features:**
- `audioFormat` - PCM encodings (`pcm_s16le`, `mulaw`, etc.) or auto-detect (`wav`, `mp3`, etc.)
- `enableSpeakerDiarization` - Speaker labels on each token
- `enableLanguageIdentification` - Language detection per token
- `enableEndpointDetection` - Detect when speaker finishes
- `context` - Structured vocabulary hints (terms, text, translation terms)
- `translation` - One-way or two-way translation config
- `languageHints` - Expected languages for better accuracy
- `clientReferenceId` - Custom tracking ID

---

## [0.6.1] - 2026-01-12

### Changed

#### Browser-Safe Main Entry Point

The main SDK entry point is now browser-safe. Webhooks (which use `node:crypto`) are moved to a separate entry point.

**Before (0.6.0):**
```typescript
// This pulled in node:crypto and broke Next.js/browser builds
import { WebhookRouter, AllProviders } from 'voice-router-dev';
```

**After (0.6.1):**
```typescript
// Main entry is now browser-safe
import { VoiceRouter, AllProviders, StreamingProviders } from 'voice-router-dev';

// Webhooks are server-side only - import separately
import { WebhookRouter } from 'voice-router-dev/webhooks';
```

**Why this matters:**
- Next.js apps can now import from the main entry without webpack errors
- No more `node:crypto` pollution in client bundles
- Cloudflare Workers and edge runtimes work out of the box

**Entry point summary:**

| Entry Point | Browser Safe | Contains |
|-------------|--------------|----------|
| `voice-router-dev` | ✅ Yes | Router, Adapters, Types, Metadata |
| `voice-router-dev/webhooks` | ❌ No (node:crypto) | WebhookRouter, handlers |
| `voice-router-dev/constants` | ✅ Yes | Enums only |
| `voice-router-dev/field-configs` | ✅ Yes | Field configurations |
| `voice-router-dev/provider-metadata` | ✅ Yes | Capabilities, languages |

---

## [0.6.0] - 2026-01-11

### Added

#### OpenAI Official Spec Integration

OpenAI types now auto-generated from the official [Stainless-hosted OpenAPI spec](https://app.stainless.com/api/spec/documented/openai/openapi.documented.yml):

```typescript
import { OpenAIModel, OpenAIResponseFormat } from 'voice-router-dev/constants'
import type {
  RealtimeSessionCreateRequest,
  RealtimeTranscriptionSessionCreateRequest,
  CreateTranscriptionResponseDiarizedJson
} from 'voice-router-dev'

// All models from official spec
const model = OpenAIModel["gpt-4o-transcribe-diarize"]

// Response formats including diarization
const format = OpenAIResponseFormat.diarized_json
```

**What changed:**
- **Single source of truth**: Stainless live spec (auto-updated by OpenAI)
- **54 schemas** generated (up from 15 manual types)
- **7 endpoints** included: batch audio + realtime streaming
- **Diarization types** now from official spec (`CreateTranscriptionResponseDiarizedJson`)
- **Realtime API types**: `RealtimeSessionCreateRequest`, `RealtimeTranscriptionSessionCreateRequest`, `VadConfig`, etc.

**New models in `OpenAIModel`:**
- `whisper-1` - Open source Whisper V2
- `gpt-4o-transcribe` - GPT-4o based transcription
- `gpt-4o-mini-transcribe` - Faster, cost-effective
- `gpt-4o-mini-transcribe-2025-12-15` - Dated version
- `gpt-4o-transcribe-diarize` - With speaker diarization

**New response formats in `OpenAIResponseFormat`:**
- `diarized_json` - JSON with speaker annotations (requires `gpt-4o-transcribe-diarize`)

#### OpenAI Realtime Streaming Types

WebSocket event types for OpenAI Realtime API:

```typescript
import { OpenAIStreamingTypes } from 'voice-router-dev'

// Session creation
const session: OpenAIStreamingTypes.RealtimeSessionConfig = {
  modalities: ['text', 'audio'],
  voice: 'ash',
  input_audio_format: 'pcm16',
  input_audio_transcription: { model: 'whisper-1' },
  turn_detection: { type: 'server_vad', threshold: 0.6 }
}

// WebSocket event handling
type ServerEvent = OpenAIStreamingTypes.RealtimeServerEvent
type ClientEvent = OpenAIStreamingTypes.RealtimeClientEvent
```

**Endpoints:**
- OpenAI: `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview`
- Azure OpenAI: `wss://{endpoint}/openai/realtime?deployment={model}&api-version={version}`

#### Soniox Provider (8th Provider)

New adapter for [Soniox](https://soniox.com) speech-to-text with batch and streaming support:

```typescript
import { createSonioxAdapter, SonioxLanguages } from 'voice-router-dev'

const adapter = createSonioxAdapter({
  apiKey: process.env.SONIOX_API_KEY
})

// Batch transcription
const result = await adapter.transcribe({
  type: 'url',
  url: 'https://example.com/audio.mp3'
}, {
  language: 'en',
  diarization: true
})

// Real-time streaming
const session = await adapter.transcribeStream({
  language: 'en',
  sampleRate: 16000
}, {
  onTranscript: (event) => console.log(event.text),
  onError: (error) => console.error(error)
})

// Dynamic model/language discovery
const models = await adapter.getModels()
const languages = await adapter.getLanguagesForModel('stt-rt-preview')
```

**Features:**
- Batch transcription via URL or file upload
- Real-time WebSocket streaming with endpoint detection
- Speaker diarization
- Language identification (auto-detect)
- Translation support (one-way and bidirectional)
- Custom vocabulary via structured context
- 60+ supported languages

**Generated types from OpenAPI spec (`api.soniox.com/v1/openapi.json`):**
- `SonioxLanguages` - Array of `{code, name}` for all 60 languages
- `SonioxLanguageCodes` - ISO 639-1 language codes
- `SonioxLanguageLabels` - Code-to-name mapping
- 90+ schema types via Orval (Transcription, Model, Language, etc.)

#### Speechmatics Batch API Type Generation

Full type generation from Speechmatics SDK batch spec (`speechmatics-batch.yml`):

```typescript
import type { JobConfig, RetrieveTranscriptResponse } from 'voice-router-dev'
import { OperatingPoint, TranscriptionConfigDiarization } from 'voice-router-dev'

// Use generated enums instead of hardcoded strings
const config: JobConfig = {
  type: 'transcription',
  transcription_config: {
    language: 'en',
    operating_point: OperatingPoint.enhanced,
    diarization: TranscriptionConfigDiarization.speaker
  }
}
```

**Generated from SDK spec:**
- 100+ TypeScript types from `speechmatics-batch.yml`
- Enums: `OperatingPoint`, `TranscriptionConfigDiarization`, `SummarizationConfigSummaryType`, `SummarizationConfigSummaryLength`, `JobDetailsStatus`
- Removed manual `src/types/speechmatics.ts` (replaced by generated types)

#### Soniox Field Configs

Field config functions for Soniox now available:

```typescript
import {
  getSonioxTranscriptionFields,
  getSonioxStreamingFields,
  getSonioxListFilterFields,
  getSonioxFieldConfigs
} from 'voice-router-dev/field-configs'

const fields = getSonioxTranscriptionFields()
// → [{ name: 'model', type: 'string', ... }, { name: 'language_hints', ... }, ...]
```

#### Field Config Coverage (All Providers)

| Provider     | Transcription | Streaming | List Filters | Update Config |
|--------------|:-------------:|:---------:|:------------:|:-------------:|
| Gladia       | ✓             | ✓         | ✓            | -             |
| Deepgram     | ✓             | ✓         | ✓            | -             |
| AssemblyAI   | ✓             | ✓         | ✓            | ✓             |
| OpenAI       | ✓             | -         | -            | -             |
| Speechmatics | ✓             | ✓         | ✓            | ✓             |
| Soniox       | ✓             | ✓         | ✓            | -             |
| Azure        | -             | -         | -            | -             |

> **Note:** Azure field configs not yet implemented (no OpenAPI spec available).

#### Zod Schema Exports Reference

All generated Zod schemas are exported for direct use with `zodToFieldConfigs()`:

| Export Name               | Provider     | Source                          |
|---------------------------|--------------|----------------------------------|
| `GladiaZodSchemas`        | Gladia       | OpenAPI spec                     |
| `DeepgramZodSchemas`      | Deepgram     | OpenAPI spec                     |
| `AssemblyAIZodSchemas`    | AssemblyAI   | OpenAPI spec                     |
| `OpenAIZodSchemas`        | OpenAI       | OpenAPI spec                     |
| `SpeechmaticsZodSchemas`  | Speechmatics | OpenAPI spec (batch)             |
| `SonioxApiZodSchemas`     | Soniox       | OpenAPI spec (batch)             |
| `SonioxStreamingZodSchemas` | Soniox     | Manual spec (real-time WebSocket)|

> **Note on manual specs:** Soniox and Deepgram streaming types are manually maintained because
> these providers do not publish AsyncAPI specs for their WebSocket APIs. Types were extracted
> from their official SDKs (`@soniox/speech-to-text-web` and `@deepgram/sdk`). The REST API
> types are auto-synced from their OpenAPI specs. If these providers publish AsyncAPI specs
> in the future, we will switch to auto-generation.

```typescript
import { zodToFieldConfigs, SonioxApiZodSchemas } from 'voice-router-dev'

// Extract fields from any Zod schema
const transcriptionFields = zodToFieldConfigs(SonioxApiZodSchemas.createTranscriptionBody)
```

#### SDK Generation Pipeline Diagram

New auto-generated Mermaid diagram showing the SDK generation flow:

```bash
pnpm openapi:diagram
```

Generates `docs/sdk-generation-pipeline.mmd` from codebase analysis:
- Analyzes `sync-specs.js` for remote/manual spec sources
- Extracts orval config for API/Zod generation
- Maps streaming type sync scripts
- Includes consumer layer (router, webhooks, adapters)
- Shows public API exports

### Changed

- **OpenAI spec source**: Now uses Stainless live spec instead of manual `openai-whisper-openapi.yml`
- **`fix-openai-spec.js`**: Filters full OpenAI API to audio + realtime endpoints only
- **OpenAI adapter**: Uses `OpenAIModel` constants instead of hardcoded strings
- **Provider capabilities**: OpenAI now shows `streaming: true` (via Realtime API)
- **Azure adapter**: Uses generated enums instead of hardcoded strings, removed `any` type casts
- **Speechmatics adapter** now uses generated enums instead of hardcoded string values
- **Speechmatics adapter** fixed API structure: `sentiment_analysis_config` and `summarization_config` moved to job level (was incorrectly in `transcription_config`)
- **Speechmatics adapter** fixed `additional_vocab` format: now uses `{content: string}[]` per spec
- **Speechmatics adapter** fixed `speaker_diarization_config`: uses `speaker_sensitivity` (not `max_speakers`)
- **Soniox language codes** now generated from OpenAPI spec (60 languages vs 28 hardcoded)
- OpenAPI sync scripts now include Speechmatics batch spec and Soniox specs
- Added `openapi:generate:speechmatics`, `openapi:generate:soniox`, `openapi:clean:speechmatics`, `openapi:clean:soniox` scripts
- Added `openapi:sync-soniox-languages` to generate flow

### Fixed

- OpenAI model values now stay in sync with official spec
- `OpenAIResponseFormat` now includes `diarized_json` from official spec
- OpenAI `languageDetection` capability is now `true` (language is optional in request)
- Azure `languageDetection` capability fixed (was incorrectly `false`)
- Azure `customVocabulary` capability fixed
- AssemblyAI/Speechmatics streaming types now survive `openapi:clean` (stored in `specs/`)
- Speechmatics batch field configs now work (was returning empty array)
- Speechmatics webhook handler now uses generated `RetrieveTranscriptResponse` type
- **AssemblyAI streaming field configs** now include SDK v3 fields (`keyterms`, `keytermsPrompt`, `speechModel`, `languageDetection`, etc.) - sync script parses both AsyncAPI spec and SDK TypeScript types

#### Soniox Regional Endpoints (Sovereign Cloud)

Regional endpoint support for Soniox data residency:

```typescript
import { createSonioxAdapter, SonioxRegion } from 'voice-router-dev'

const adapter = createSonioxAdapter({
  apiKey: process.env.SONIOX_EU_API_KEY,
  region: SonioxRegion.eu  // EU data residency
})
```

| Region | REST API | WebSocket |
|--------|----------|-----------|
| `us` (default) | `api.soniox.com` | `stt-rt.soniox.com` |
| `eu` | `api.eu.soniox.com` | `stt-rt.eu.soniox.com` |
| `jp` | `api.jp.soniox.com` | `stt-rt.jp.soniox.com` |

**Note:** Soniox API keys are region-specific. Each project is created with a specific region, and the API key only works with that region's endpoint.

---

## [0.5.5] - 2026-01-09

### Changed

- Dynamic streaming types synced from AsyncAPI/SDK specs for all providers
- Deepgram streaming params derived from official SDK (`TranscriptionSchema.ts`)
- AssemblyAI streaming Zod auto-generated from SDK types
- Speechmatics streaming types from AsyncAPI spec

---

## [0.5.0] - 2026-01-09

### Added

#### Zero-Hardcoding Field Configs

All field configs are now derived from Zod schemas at runtime - zero hardcoded field definitions:

```typescript
import { zodToFieldConfigs, DeepgramZodSchemas } from 'voice-router-dev'

// Extract fields directly from generated Zod schemas
const fields = zodToFieldConfigs(DeepgramZodSchemas.listenV1MediaTranscribeQueryParams)
// → [{ name, type, description, options, default, min, max, ... }]

// Or use pre-built helpers
import { getDeepgramTranscriptionFields } from 'voice-router-dev'
const deepgramFields = getDeepgramTranscriptionFields() // 36 fields from Zod
```

**Exports:**
- `zodToFieldConfigs(schema)` - Extract field configs from any Zod schema
- `filterFields(fields, names)` - Include only specified fields
- `excludeFields(fields, names)` - Exclude specified fields
- `GladiaZodSchemas`, `DeepgramZodSchemas`, `AssemblyAIZodSchemas`, etc.

#### 100% Streaming Field Coverage

| Provider   | Fields | Source |
|------------|--------|--------|
| Gladia     | 10     | OpenAPI Zod |
| Deepgram   | 30     | OpenAPI Zod |
| AssemblyAI | 13     | SDK Zod |

### Changed

- Deleted `streaming-field-schemas.ts` (was 461 lines of hardcoding)
- Rewrote `field-configs.ts`: 890 → 205 lines (zero hardcoded fields)
- All field configs now derived from Zod schemas at runtime

---

## [0.4.1] - 2026-01-09

### Added

#### Provider Metadata Exports for UI Rendering

Static runtime data derived from OpenAPI specs and adapter definitions:

```typescript
import {
  ProviderCapabilitiesMap,
  CapabilityLabels,
  LanguageLabels,
  AllLanguageCodes,
  ProviderDisplayNames,
  StreamingProviders,
  BatchOnlyProviders
} from 'voice-router-dev/provider-metadata'

// Capability matrix for all providers
const capabilities = ProviderCapabilitiesMap['deepgram']
// → { streaming: true, diarization: true, ... }

// Language dropdown data
const languages = AllLanguageCodes['gladia']
// → ['en', 'es', 'fr', ...]
const label = LanguageLabels['en'] // → 'English'
```

#### Browser-Safe Subpath Exports

New subpath exports with no `node:crypto` dependency:

```typescript
// Browser-safe imports
import { AllFieldConfigs } from 'voice-router-dev/field-configs'
import { ProviderCapabilitiesMap } from 'voice-router-dev/provider-metadata'

// Full SDK (server-side only)
import { VoiceRouter } from 'voice-router-dev'
```

**Exports:**
- `voice-router-dev/constants` - Enums only (existing)
- `voice-router-dev/field-configs` - Field configurations
- `voice-router-dev/provider-metadata` - Capabilities, languages, display names

### Changed

- Types refactored to shared `src/types/core.ts` for browser compatibility
- `router/types.ts` re-exports from `core.ts` (no duplication)

---

## [0.3.7] - 2026-01-09

### Added

#### Region Support for Multiple Providers

Region support for data residency, compliance, and latency optimization:

**Deepgram EU Region** (GA Jan 2026):

```typescript
import { createDeepgramAdapter, DeepgramRegion } from 'voice-router-dev'

const adapter = createDeepgramAdapter({
  apiKey: process.env.DEEPGRAM_API_KEY,
  region: DeepgramRegion.eu  // All processing in EU
})
```

**Speechmatics Regional Endpoints** (EU, US, AU):

```typescript
import { createSpeechmaticsAdapter, SpeechmaticsRegion } from 'voice-router-dev'

const adapter = createSpeechmaticsAdapter({
  apiKey: process.env.SPEECHMATICS_API_KEY,
  region: SpeechmaticsRegion.us1  // USA endpoint
})
```

| Region | Endpoint | Availability |
|--------|----------|--------------|
| `eu1` | eu1.asr.api.speechmatics.com | All customers |
| `eu2` | eu2.asr.api.speechmatics.com | Enterprise only |
| `us1` | us1.asr.api.speechmatics.com | All customers |
| `us2` | us2.asr.api.speechmatics.com | Enterprise only |
| `au1` | au1.asr.api.speechmatics.com | All customers |

**Gladia Streaming Regions**:

```typescript
import { GladiaRegion } from 'voice-router-dev/constants'

await adapter.transcribeStream({
  region: GladiaRegion["us-west"]  // or "eu-west"
})
```

**Dynamic region switching** for debugging and testing:

```typescript
// Switch regions on the fly without reinitializing
adapter.setRegion(DeepgramRegion.eu)
await adapter.transcribe(audio)

// Check current region
console.log(adapter.getRegion())
// Deepgram: { api: "https://api.eu.deepgram.com/v1", websocket: "wss://api.eu.deepgram.com/v1/listen" }
// Speechmatics: "https://us1.asr.api.speechmatics.com/v2"
```

**Region support summary:**

| Provider | Regions | Config Level | Dynamic Switch |
|----------|---------|--------------|----------------|
| **Deepgram** | `global`, `eu` | Adapter init | `setRegion()` |
| **Speechmatics** | `eu1`, `eu2`*, `us1`, `us2`*, `au1` | Adapter init | `setRegion()` |
| **Gladia** | `us-west`, `eu-west` | Streaming options | Per-request |
| **Azure** | Via `speechConfig` | Adapter init | Reinitialize |

\* Enterprise only

#### OpenAPI Spec Sync

New unified spec management system for syncing provider OpenAPI specs from official sources:

```bash
# Sync all specs from remote sources
pnpm openapi:sync

# Sync specific providers
pnpm openapi:sync:gladia
pnpm openapi:sync:deepgram
pnpm openapi:sync:assemblyai

# Full rebuild with fresh specs
pnpm openapi:rebuild
```

**Spec sources:**
- Gladia: https://api.gladia.io/openapi.json
- AssemblyAI: https://github.com/AssemblyAI/assemblyai-api-spec
- Deepgram: https://github.com/deepgram/deepgram-api-specs

All specs are now stored locally in `./specs/` for reproducible builds.

### Fixed

- Deepgram spec regeneration now works correctly with Orval input transformer
- Manual Deepgram parameter files (SpeakV1Container, SpeakV1Encoding, SpeakV1SampleRate) are preserved during regeneration

### Changed

- `prepublishOnly` now syncs and validates specs before publishing

---

## [0.3.3] - 2026-01-08

### Added

#### Gladia Audio File Download

New `getAudioFile()` method for Gladia adapter - download the original audio used for transcription.

Returns `ArrayBuffer` for cross-platform compatibility (Node.js and browser):

```typescript
const result = await gladiaAdapter.getAudioFile('transcript-123')
if (result.success && result.data) {
  // Node.js: Convert to Buffer and save
  const buffer = Buffer.from(result.data)
  fs.writeFileSync('audio.mp3', buffer)

  // Browser: Convert to Blob for playback/download
  const blob = new Blob([result.data], { type: result.contentType || 'audio/mpeg' })
  const url = URL.createObjectURL(blob)
}

// Download audio from a live/streaming session
const liveResult = await gladiaAdapter.getAudioFile('stream-456', 'streaming')
console.log('Size:', liveResult.data?.byteLength, 'bytes')
```

**Note:** This is a Gladia-specific feature. Other providers (Deepgram, AssemblyAI, Azure) do not store audio files after transcription.

New capability flag: `capabilities.getAudioFile` indicates provider support for audio retrieval.

#### Improved Metadata Clarity

New metadata fields for better discoverability:

```typescript
interface TranscriptMetadata {
  /** Original audio URL you provided (echoed back) - renamed from audioUrl */
  sourceAudioUrl?: string

  /** True if getAudioFile() can retrieve the audio (Gladia only) */
  audioFileAvailable?: boolean
  // ...
}
```

Usage pattern:
```typescript
const { transcripts } = await router.listTranscripts('gladia')

transcripts.forEach(item => {
  // What you sent
  console.log(item.data?.metadata?.sourceAudioUrl)  // "https://your-bucket.s3.amazonaws.com/audio.mp3"

  // Can we download from provider?
  if (item.data?.metadata?.audioFileAvailable) {
    const audio = await gladiaAdapter.getAudioFile(item.data.id)
    // audio.data is a Blob - actual file stored by Gladia
  }
})
```

### Changed

- **BREAKING:** `metadata.audioUrl` renamed to `metadata.sourceAudioUrl` for clarity
  - This field contains the URL you originally provided, not a provider-hosted URL
- `audioFileAvailable` is now set on all provider responses (derived from `capabilities.getAudioFile`)

#### listTranscripts Implementation

Full `listTranscripts()` support for AssemblyAI, Gladia, Azure, and Deepgram using only generated types:

```typescript
// List recent transcripts with filtering
const { transcripts, hasMore } = await router.listTranscripts('assemblyai', {
  status: 'completed',
  date: '2026-01-07',
  limit: 50
})

// Date range filtering (Gladia)
const { transcripts } = await router.listTranscripts('gladia', {
  afterDate: '2026-01-01',
  beforeDate: '2026-01-31'
})

// Provider-specific passthrough
const { transcripts } = await router.listTranscripts('assemblyai', {
  assemblyai: { after_id: 'cursor-123' }
})

// Deepgram request history (requires projectId)
const adapter = new DeepgramAdapter()
adapter.initialize({
  apiKey: process.env.DEEPGRAM_API_KEY,
  projectId: process.env.DEEPGRAM_PROJECT_ID
})

// List requests (metadata only)
const { transcripts } = await adapter.listTranscripts({
  status: 'succeeded',
  afterDate: '2026-01-01'
})

// Get full transcript by request ID
const fullTranscript = await adapter.getTranscript(transcripts[0].data?.id)
console.log(fullTranscript.data?.text)  // Full transcript!
```

#### Status Enums for Filtering

New status constants with IDE autocomplete:

```typescript
import { AssemblyAIStatus, GladiaStatus, AzureStatus, DeepgramStatus } from 'voice-router-dev/constants'

await router.listTranscripts('assemblyai', {
  status: AssemblyAIStatus.completed  // queued | processing | completed | error
})

await router.listTranscripts('gladia', {
  status: GladiaStatus.done  // queued | processing | done | error
})

await router.listTranscripts('azure-stt', {
  status: AzureStatus.Succeeded  // NotStarted | Running | Succeeded | Failed
})

// Deepgram (request history - requires projectId)
await adapter.listTranscripts({
  status: DeepgramStatus.succeeded  // succeeded | failed
})
```

#### JSDoc Comments for All Constants

All constants now have JSDoc with:
- Available values listed
- Usage examples
- Provider-specific notes

#### Typed Response Interfaces

New exported types for full autocomplete on transcript responses:

```typescript
import type {
  TranscriptData,
  TranscriptMetadata,
  ListTranscriptsResponse
} from 'voice-router-dev';

const response: ListTranscriptsResponse = await router.listTranscripts('assemblyai', { limit: 20 });

response.transcripts.forEach(item => {
  // Full autocomplete - no `as any` casts needed!
  console.log(item.data?.id);                    // string
  console.log(item.data?.status);                // TranscriptionStatus
  console.log(item.data?.metadata?.audioUrl);    // string | undefined
  console.log(item.data?.metadata?.createdAt);   // string | undefined
});
```

**Note:** These are manual normalization types that unify different provider schemas.
For raw provider types, use `result.raw` with the generic parameter:

```typescript
const result: UnifiedTranscriptResponse<'assemblyai'> = await adapter.transcribe(audio);
// result.raw is typed as AssemblyAITranscript
```

#### DeepgramSampleRate Const

New convenience const for Deepgram sample rates (not in OpenAPI spec):

```typescript
import { DeepgramSampleRate } from 'voice-router-dev/constants'

{ sampleRate: DeepgramSampleRate.NUMBER_16000 }
```

#### Additional Deepgram OpenAPI Re-exports

New constants directly re-exported from OpenAPI-generated types:

```typescript
import { DeepgramIntentMode, DeepgramCallbackMethod } from 'voice-router-dev/constants'

// Intent detection mode
{ customIntentMode: DeepgramIntentMode.extended }  // extended | strict

// Async callback method
{ callbackMethod: DeepgramCallbackMethod.POST }  // POST | PUT
```

### Changed

- All adapter `listTranscripts()` implementations use generated API functions and types only
- Status mappings use generated enums (`TranscriptStatus`, `TranscriptionControllerListV2StatusItem`, `Status`, `ManageV1FilterStatusParameter`)
- Deepgram adapter now supports `listTranscripts()` via request history API (metadata only)
- Deepgram `getTranscript()` now returns full transcript data from request history

### Fixed

- Gladia `listTranscripts()` now includes file metadata:
  - `data.duration` - audio duration in seconds
  - `metadata.audioUrl` - source URL (if audio_url was used)
  - `metadata.filename` - original filename
  - `metadata.audioDuration` - audio duration (also in metadata)
  - `metadata.numberOfChannels` - number of audio channels

- All adapters now include `raw: item` in `listTranscripts()` responses for consistency:
  - AssemblyAI: now includes `raw` field with original `TranscriptListItem`
  - Azure: now includes `raw` field with original `Transcription` item
  - Added `metadata.description` to Azure list responses

- Added clarifying comments in adapters about provider limitations:
  - AssemblyAI: `audio_duration` only available in full `Transcript`, not `TranscriptListItem`
  - Azure: `contentUrls` is write-only (not returned in list responses per API docs)

---

## [0.3.0] - 2026-01-07

### Added

#### Browser-Safe Constants Export

New `/constants` subpath export for browser, Cloudflare Workers, and edge environments:

```typescript
// Browser-safe import (no node:crypto, ws, or axios)
import { DeepgramModel, GladiaEncoding, AssemblyAIEncoding } from 'voice-router-dev/constants'

const model = DeepgramModel["nova-3"]
const encoding = GladiaEncoding["wav/pcm"]
```

The main entry point (`voice-router-dev`) still works but bundles Node.js dependencies.
Use `/constants` when you only need the enum values without the adapter classes.

#### Type-Safe Streaming Enums with Autocomplete

New const objects provide IDE autocomplete and compile-time validation for all streaming options.
All enums are derived from OpenAPI specs and stay in sync with provider APIs.

**Deepgram:**
```typescript
import { DeepgramEncoding, DeepgramModel, DeepgramRedact } from 'voice-router-dev'

await adapter.transcribeStream({
  deepgramStreaming: {
    encoding: DeepgramEncoding.linear16,       // "linear16" | "flac" | "mulaw" | ...
    model: DeepgramModel["nova-3"],            // "nova-3" | "nova-2" | "enhanced" | ...
    redact: [DeepgramRedact.pii],              // "pii" | "pci" | "numbers"
  }
})
```

**Gladia:**
```typescript
import { GladiaEncoding, GladiaSampleRate, GladiaLanguage } from 'voice-router-dev'

await adapter.transcribeStream({
  encoding: GladiaEncoding['wav/pcm'],         // "wav/pcm" | "wav/alaw" | "wav/ulaw"
  sampleRate: GladiaSampleRate.NUMBER_16000,   // 8000 | 16000 | 32000 | 44100 | 48000
  language: GladiaLanguage.en,                 // 100+ language codes
})
```

**AssemblyAI:**
```typescript
import { AssemblyAIEncoding, AssemblyAISpeechModel, AssemblyAISampleRate } from 'voice-router-dev'

await adapter.transcribeStream({
  assemblyaiStreaming: {
    encoding: AssemblyAIEncoding.pcmS16le,              // "pcm_s16le" | "pcm_mulaw"
    speechModel: AssemblyAISpeechModel.multilingual,    // English or multilingual
    sampleRate: AssemblyAISampleRate.rate16000,         // 8000-48000
  }
})
```

#### Type Safety Audit

All enums are either re-exported from OpenAPI-generated types or type-checked with `satisfies`:

| Enum | Source | Type Safety |
|------|--------|-------------|
| `DeepgramEncoding` | Re-exported from `ListenV1EncodingParameter` | ✅ OpenAPI |
| `DeepgramRedact` | Re-exported from `ListenV1RedactParameterOneOfItem` | ✅ OpenAPI |
| `DeepgramModel` | Manual const with `satisfies ListenV1ModelParameter` | ⚠️ Type-checked |
| `DeepgramTopicMode` | Re-exported from `SharedCustomTopicModeParameter` | ✅ OpenAPI |
| `GladiaEncoding` | Re-exported from `StreamingSupportedEncodingEnum` | ✅ OpenAPI |
| `GladiaSampleRate` | Re-exported from `StreamingSupportedSampleRateEnum` | ✅ OpenAPI |
| `GladiaBitDepth` | Re-exported from `StreamingSupportedBitDepthEnum` | ✅ OpenAPI |
| `GladiaModel` | Re-exported from `StreamingSupportedModels` | ✅ OpenAPI |
| `GladiaLanguage` | Re-exported from `TranscriptionLanguageCodeEnum` | ✅ OpenAPI |
| `AssemblyAIEncoding` | Manual const with `satisfies AudioEncoding` | ⚠️ Type-checked |
| `AssemblyAISpeechModel` | Manual const with `satisfies StreamingSpeechModel` | ⚠️ Type-checked |
| `AssemblyAISampleRate` | Manual const (no generated type exists) | ❌ Unchecked |

**Why some remain manual:**
- `DeepgramModel`: OpenAPI generates a type union, not a const object
- `AssemblyAI*`: Synced from SDK types which are unions, not const objects
- `AssemblyAISampleRate`: Not defined in any spec (values from SDK documentation)

The `satisfies` keyword ensures compile-time errors if values drift from the generated types.

#### Full Streaming Implementation for All Providers

- **Gladia**: Complete streaming with pre-processing, real-time processing (translation, NER, sentiment), post-processing (summarization, chapterization), and all WebSocket message types
- **Deepgram**: Full streaming with 30+ options including filler words, numerals, measurements, topics, intents, sentiment, entities, keyterm prompting, and VAD events
- **AssemblyAI**: v3 Universal Streaming API with end-of-turn detection tuning, VAD threshold, format turns, profanity filtering, keyterms, and dynamic configuration updates

#### New Streaming Event Callbacks

```typescript
await adapter.transcribeStream(options, {
  onTranscript: (event) => { /* interim/final transcripts */ },
  onUtterance: (utterance) => { /* complete utterances */ },
  onSpeechStart: (event) => { /* speech detected */ },
  onSpeechEnd: (event) => { /* speech ended */ },
  onTranslation: (event) => { /* real-time translation (Gladia) */ },
  onSentiment: (event) => { /* sentiment analysis (Gladia) */ },
  onEntity: (event) => { /* named entity recognition (Gladia) */ },
  onSummarization: (event) => { /* post-processing summary (Gladia) */ },
  onChapterization: (event) => { /* auto-chapters (Gladia) */ },
  onMetadata: (metadata) => { /* stream metadata */ },
  onError: (error) => { /* error handling */ },
  onClose: (code, reason) => { /* connection closed */ },
})
```

#### AssemblyAI Dynamic Configuration

```typescript
const session = await adapter.transcribeStream(options, callbacks)

// Update configuration mid-stream
session.updateConfiguration?.({
  end_of_turn_confidence_threshold: 0.8,
  vad_threshold: 0.4,
  format_turns: true,
})

// Force end-of-turn detection
session.forceEndpoint?.()
```

### Changed

- `TranscriptionModel` (batch) now uses strict union type (no `| string` fallback)
- `DeepgramStreamingOptions.model` now uses strict union type (no `| string` fallback)
- `AssemblyAIStreamingOptions.speechModel` now uses strict union type
- `ProviderCapabilities` now includes `listTranscripts` and `deleteTranscript` flags
- `DeepgramStreamingOptions` now includes 30+ typed parameters from OpenAPI spec
- `AssemblyAIStreamingOptions` now includes all v3 streaming parameters
- `GladiaStreamingOptions` now includes full pre/realtime/post processing options
- Provider-specific streaming options now have JSDoc examples for better discoverability

### Deprecated

Raw generated enum exports are deprecated in favor of user-friendly aliases:

| Deprecated | Use Instead |
|------------|-------------|
| `ListenV1EncodingParameter` | `DeepgramEncoding` |
| `ListenV1ModelParameter` | `DeepgramModel` |
| `ListenV1RedactParameterOneOfItem` | `DeepgramRedact` |
| `StreamingSupportedEncodingEnum` | `GladiaEncoding` |
| `StreamingSupportedSampleRateEnum` | `GladiaSampleRate` |
| `StreamingSupportedBitDepthEnum` | `GladiaBitDepth` |

---

## Migration Guide (0.2.x → 0.3.0)

### 1. Update Enum Imports

**Before (0.2.x):**
```typescript
import {
  ListenV1EncodingParameter,
  StreamingSupportedEncodingEnum
} from 'voice-router-dev'

const encoding = ListenV1EncodingParameter.linear16
const gladiaEncoding = StreamingSupportedEncodingEnum['wav/pcm']
```

**After (0.3.0):**
```typescript
import {
  DeepgramEncoding,
  GladiaEncoding
} from 'voice-router-dev'

const encoding = DeepgramEncoding.linear16
const gladiaEncoding = GladiaEncoding['wav/pcm']
```

### 2. Update Model References

**Before:**
```typescript
// String literals (still work but no autocomplete)
model: "nova-3"
```

**After:**
```typescript
import { DeepgramModel } from 'voice-router-dev'

// With autocomplete
model: DeepgramModel["nova-3"]
```

### 3. Update Streaming Options

**Before (0.2.x):**
```typescript
await adapter.transcribeStream({
  encoding: 'linear16',
  sampleRate: 16000,
})
```

**After (0.3.0):**
```typescript
await adapter.transcribeStream({
  deepgramStreaming: {
    encoding: DeepgramEncoding.linear16,
    sampleRate: 16000,
    // Now supports 30+ additional options with autocomplete
    fillerWords: true,
    smartFormat: true,
  }
})
```

### 4. New Callback Handlers

If you were only using `onTranscript`, you now have access to more granular events:

```typescript
await adapter.transcribeStream(options, {
  onTranscript: (event) => { /* still works */ },

  // New in 0.3.0:
  onSpeechStart: (event) => console.log('Speech started'),
  onSpeechEnd: (event) => console.log('Speech ended'),
  onUtterance: (utterance) => console.log('Complete utterance:', utterance.text),
})
```

---

## [0.2.8] - 2025-12-30

### Added
- Typed extended response data with `extendedData` field
- Request tracking with `requestId` field
- Type-safe provider-specific options from OpenAPI specs

### Changed
- Replace 'text' with 'words' in SDK responses

## [0.2.5] - 2025-12-15

### Added
- Initial OpenAPI-generated types for Gladia, Deepgram, AssemblyAI
- Webhook normalization handlers
- Basic streaming support
