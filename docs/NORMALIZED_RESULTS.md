# Normalized Result Structure

The Voice Router SDK normalizes responses from all providers into a consistent structure. This enables you to:

- Display transcripts consistently regardless of provider
- Store raw responses and re-normalize them later
- Access provider-specific features through typed `extended` data

## Core Types

```typescript
import type {
  UnifiedTranscriptResponse,
  TranscriptData,
  Word,
  Utterance,
  Speaker,
  TranscriptMetadata,
  TranscriptionStatus
} from 'voice-router-dev';
```

## UnifiedTranscriptResponse

The main response type returned by `transcribe()`, `getTranscript()`, and `listTranscripts()`:

```typescript
interface UnifiedTranscriptResponse<P extends TranscriptionProvider = TranscriptionProvider> {
  /** Whether the operation succeeded */
  success: boolean;

  /** Provider that performed the transcription */
  provider: P;

  /** Normalized transcript data */
  data?: TranscriptData;

  /** Provider-specific extended data (typed per provider) */
  extended?: ProviderExtendedData[P];

  /** Request tracking information */
  tracking?: {
    requestId?: string;
    audioHash?: string;
    processingTimeMs?: number;
  };

  /** Error information (only present on failure) */
  error?: {
    code: string;
    message: string;
    details?: unknown;
    statusCode?: number;
  };

  /** Raw provider response (typed per provider) */
  raw?: ProviderRawResponse[P];
}
```

## TranscriptData

The normalized data structure, consistent across all providers:

```typescript
interface TranscriptData {
  /** Unique transcript ID */
  id: string;

  /** Full transcribed text */
  text: string;

  /** Transcription status */
  status: 'queued' | 'processing' | 'completed' | 'error';

  /** Overall confidence score (0-1) */
  confidence?: number;

  /** Audio duration in seconds */
  duration?: number;

  /** Detected or specified language code */
  language?: string;

  /** Speaker diarization results */
  speakers?: Speaker[];

  /** Word-level transcription with timestamps */
  words?: Word[];

  /** Utterances (speaker turns) */
  utterances?: Utterance[];

  /** Summary of the content (if summarization enabled) */
  summary?: string;

  /** Transcript metadata */
  metadata?: TranscriptMetadata;

  /** Creation timestamp */
  createdAt?: string;

  /** Completion timestamp */
  completedAt?: string;
}
```

## Word

Word-level transcription with timing:

```typescript
interface Word {
  /** The transcribed word */
  word: string;

  /** Start time in seconds */
  start: number;

  /** End time in seconds */
  end: number;

  /** Confidence score (0-1) */
  confidence?: number;

  /** Speaker ID if diarization is enabled */
  speaker?: string;
}
```

## Utterance

A sentence or phrase by a single speaker:

```typescript
interface Utterance {
  /** The transcribed text */
  text: string;

  /** Start time in seconds */
  start: number;

  /** End time in seconds */
  end: number;

  /** Speaker ID */
  speaker?: string;

  /** Confidence score (0-1) */
  confidence?: number;

  /** Words in this utterance */
  words?: Word[];
}
```

## Speaker

Speaker information from diarization:

```typescript
interface Speaker {
  /** Speaker identifier (e.g., "A", "B", "speaker_0") */
  id: string;

  /** Speaker label if known */
  label?: string;

  /** Confidence score for speaker identification (0-1) */
  confidence?: number;
}
```

## Provider-Specific Type Safety

When you know which provider you're using, the response is fully typed:

```typescript
// Generic - raw and extended are unknown
const result: UnifiedTranscriptResponse = await router.transcribe(audio);

// Provider-specific - full type safety!
const assemblyResult: UnifiedTranscriptResponse<'assemblyai'> =
  await router.transcribe(audio, { provider: 'assemblyai' });

// TypeScript knows the exact types:
// - assemblyResult.raw is AssemblyAITranscript
// - assemblyResult.extended is AssemblyAIExtendedData
```

### Raw Response Types by Provider

| Provider | Raw Type |
|----------|----------|
| `gladia` | `PreRecordedResponse` |
| `deepgram` | `ListenV1Response` |
| `assemblyai` | `AssemblyAITranscript` |
| `openai-whisper` | `CreateTranscription200One` |
| `azure-stt` | `AzureTranscription` |

### Extended Data Types by Provider

| Provider | Extended Type | Contents |
|----------|--------------|----------|
| `gladia` | `GladiaExtendedData` | translation, moderation, entities, sentiment, chapters, audioToLlm, customMetadata |
| `assemblyai` | `AssemblyAIExtendedData` | chapters, entities, sentimentResults, highlights, contentSafety, topics |
| `deepgram` | `DeepgramExtendedData` | metadata, requestId, sha256, modelInfo, tags |

## Usage Examples

### Display a Transcript

```typescript
const result = await router.transcribe(audio, { provider: 'gladia' });

if (result.success && result.data) {
  console.log('Text:', result.data.text);
  console.log('Duration:', result.data.duration, 'seconds');
  console.log('Language:', result.data.language);

  // Display words with timestamps
  result.data.words?.forEach(word => {
    console.log(`[${word.start.toFixed(2)}s] ${word.word}`);
  });

  // Display speaker turns
  result.data.utterances?.forEach(utt => {
    console.log(`Speaker ${utt.speaker}: ${utt.text}`);
  });
}
```

### Access Provider-Specific Features

```typescript
// AssemblyAI chapters and entities
const result = await router.transcribe(audio, {
  provider: 'assemblyai',
  assemblyai: { auto_chapters: true, entity_detection: true }
});

if (result.extended) {
  result.extended.chapters?.forEach(ch => {
    console.log(`Chapter: ${ch.headline}`);
    console.log(`Summary: ${ch.summary}`);
  });

  result.extended.entities?.forEach(e => {
    console.log(`Entity: ${e.entity_type} - ${e.text}`);
  });
}
```

### Store and Re-use Raw Responses

```typescript
// Store the raw response in your database
const result = await router.transcribe(audio, { provider: 'gladia' });
await db.save({
  id: result.data?.id,
  provider: result.provider,
  raw: result.raw  // Store raw for re-processing
});

// Later: retrieve and access the typed raw response
const stored = await db.get(id);
const raw = stored.raw as GladiaTypes.PreRecordedResponse;
console.log(raw.result?.transcription?.full_transcript);
```

### Handle Errors Consistently

```typescript
const result = await router.transcribe(audio, { provider: 'deepgram' });

if (!result.success) {
  console.error('Provider:', result.provider);
  console.error('Error code:', result.error?.code);
  console.error('Message:', result.error?.message);
  console.error('HTTP Status:', result.error?.statusCode);

  // Fallback to another provider
  const fallback = await router.transcribe(audio, { provider: 'assemblyai' });
}
```

## Webhooks

Webhooks also use a normalized structure via `UnifiedWebhookEvent`:

```typescript
import { WebhookRouter } from 'voice-router-dev/webhooks';
import type { UnifiedWebhookEvent } from 'voice-router-dev/webhooks';

const webhookRouter = new WebhookRouter();
const event: UnifiedWebhookEvent = webhookRouter.route(payload);

// Same normalized structure
console.log(event.provider);
console.log(event.eventType);  // 'transcription.completed'
console.log(event.data?.text);
console.log(event.data?.words);
console.log(event.raw);  // Original webhook payload
```

## Type Imports Summary

```typescript
// Core normalized types
import type {
  UnifiedTranscriptResponse,
  TranscriptData,
  Word,
  Utterance,
  Speaker,
  TranscriptMetadata,
  TranscriptionStatus,
  ListTranscriptsResponse
} from 'voice-router-dev';

// Extended data types
import type {
  GladiaExtendedData,
  AssemblyAIExtendedData,
  DeepgramExtendedData,
  // Individual types
  GladiaTranslation,
  GladiaChapters,
  AssemblyAIChapter,
  AssemblyAIEntity,
  DeepgramMetadata
} from 'voice-router-dev';

// Provider-specific raw types (for advanced usage)
import * as GladiaTypes from 'voice-router-dev';
import * as AssemblyAITypes from 'voice-router-dev';
import * as DeepgramTypes from 'voice-router-dev';
```
