# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.3] - 2026-01-08

### Added

#### Gladia Audio File Download

New `getAudioFile()` method for Gladia adapter - download the original audio used for transcription:

```typescript
// Download audio from a pre-recorded transcription
const result = await gladiaAdapter.getAudioFile('transcript-123')
if (result.success && result.data) {
  // Save to file (Node.js)
  const buffer = Buffer.from(await result.data.arrayBuffer())
  fs.writeFileSync('audio.mp3', buffer)

  // Or create download URL (browser)
  const url = URL.createObjectURL(result.data)
}

// Download audio from a live/streaming session
const liveResult = await gladiaAdapter.getAudioFile('stream-456', 'streaming')
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
