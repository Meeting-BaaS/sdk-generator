# Provider Integration Plan

**Comprehensive plan for integrating all transcription providers into Voice Router SDK**

---

## Overview

Based on `providers.csv`, we have 11 transcription providers to potentially integrate. This plan prioritizes providers with OpenAPI specifications and evaluates the effort required for each.

---

## Provider Status Summary

| Rank | Provider | OpenAPI Available | Batch Status | Streaming Status | Webhook Status | Priority |
|------|----------|-------------------|--------------|------------------|----------------|----------|
| 1 | Deepgram | ✅ Yes (GitHub) | ✅ **DONE** | ✅ **DONE** (WebSocket) | ✅ **DONE** | ✅ Complete |
| 2 | OpenAI Whisper | ✅ Yes (YAML) | ✅ **DONE** | ❌ Not Available (HTTP only) | ❌ Not Available (Sync API) | ✅ Complete |
| 3 | Azure Speech-to-Text | ✅ Yes (JSON) | ✅ **DONE** | ❌ Not Available (v3.1) | ✅ **DONE** | ✅ Complete |
| 4 | Google Cloud STT | ⚠️ Discovery Doc | 🔴 TODO | 🔴 TODO | 🔴 TODO | **MEDIUM** |
| 5 | AssemblyAI | ✅ Yes (YAML) | ✅ **DONE** | ✅ **DONE** (Real-time) | ✅ **DONE** | ✅ Complete |
| 6 | Rev AI | ❌ No | 🔴 TODO | 🔴 TODO | 🔴 TODO | **LOW** |
| 7 | Speechmatics | ✅ Yes (Manual types) | ✅ **DONE** | ❌ Not Available (Batch only) | ✅ **DONE** | ✅ Complete |
| 8 | Amazon Transcribe | ❌ AWS Only | 🔴 TODO | 🔴 TODO | 🔴 TODO | **LOW** |
| 9 | IBM Watson STT | ⚠️ Deprecated | ⏸️ SKIP | ⏸️ SKIP | ⏸️ SKIP | N/A |
| 10 | Kaldi | N/A (Self-hosted) | ⏸️ SKIP | ⏸️ SKIP | ⏸️ SKIP | N/A |
| - | Gladia | ✅ Yes (JSON) | ✅ **DONE** | ✅ **DONE** (WebSocket) | ✅ **DONE** | ✅ Complete |

**Recent Updates (December 9, 2025)**:
- ✅ **SPEECHMATICS IMPLEMENTED** with batch transcription support
- ✅ Manual type definitions with strong documentation (OpenAPI spec had validation errors)
- ✅ Batch transcription with speaker diarization, sentiment analysis, and summarization
- ✅ Custom vocabulary and fetch from URL support
- ✅ Webhook normalization with query parameter parsing (id, status)
- ✅ **OPENAI WHISPER IMPLEMENTED** with multi-model support
- ✅ Support for gpt-4o-transcribe, gpt-4o-mini-transcribe, gpt-4o-transcribe-diarize, and whisper-1
- ✅ Speaker diarization with known speaker references
- ✅ Word-level timestamps with verbose JSON format
- ✅ **WEBHOOK NORMALIZATION IMPLEMENTED** for 5 providers
- ✅ Automatic provider detection from webhook payload structure
- ✅ Unified webhook event format: `UnifiedWebhookEvent`
- ✅ Signature verification for AssemblyAI and Azure (optional)
- ✅ `WebhookRouter` with auto-detection and routing
- ✅ Provider-specific handlers: `GladiaWebhookHandler`, `AssemblyAIWebhookHandler`, `DeepgramWebhookHandler`, `AzureWebhookHandler`, `SpeechmaticsWebhookHandler`
- ✅ **STREAMING SUPPORT IMPLEMENTED** for 3 providers: Gladia, AssemblyAI, Deepgram
- ✅ WebSocket-based real-time transcription with callback architecture
- ✅ Comprehensive streaming types: `StreamingSession`, `StreamingOptions`, `StreamingCallbacks`
- ✅ Installed `ws` package for WebSocket support
- ✅ Updated documentation with streaming and webhook examples
- ✅ Build passing with no TypeScript errors
- ✅ Azure STT fully integrated (131 schemas, batch-only adapter)
- ✅ Upgraded to Node 20.19.6 for Orval compatibility
- **6 providers now fully functional**: Gladia, AssemblyAI, Deepgram, Azure STT, OpenAI Whisper, Speechmatics

**Legend**:
- ✅ Done - Adapter implemented and tested
- 🔴 TODO - Not started
- ⏸️ SKIP - Not applicable or deprecated
- ❌ Not Available - Provider doesn't support this feature

---

## Streaming Architecture Overview

### Implementation Status

The SDK now supports **two transcription modes**:

#### 1. Batch/Async Transcription (All 4 providers)
- Upload audio file via REST API
- Poll for completion
- Get final transcript
- **Use case**: Pre-recorded audio files

#### 2. Real-time Streaming (3 providers)
- WebSocket-based connection
- Send audio chunks incrementally
- Receive interim and final results
- **Use case**: Live audio (microphone, phone calls)

### Provider Streaming Details

| Provider | Streaming Method | Auth Method | Audio Format | Features |
|----------|-----------------|-------------|--------------|----------|
| **Gladia** | REST init → WebSocket URL | API key in init | Raw PCM bytes | Utterances, interim results |
| **AssemblyAI** | Token endpoint → WebSocket | Temporary token | Base64 JSON | Partial + final, word timings |
| **Deepgram** | Direct WebSocket + params | Token header | Raw audio bytes | Interim, utterances, diarization |
| **Azure STT** | ❌ Not supported | N/A (v3.1 batch only) | N/A | Batch transcription only |

### Key Streaming Types

```typescript
// Main streaming interface
interface StreamingSession {
  id: string
  provider: TranscriptionProvider
  sendAudio: (chunk: AudioChunk) => Promise<void>
  close: () => Promise<void>
  getStatus: () => "connecting" | "open" | "closing" | "closed"
  createdAt: Date
}

// Configuration
interface StreamingOptions {
  encoding?: string       // 'linear16', 'mulaw', etc.
  sampleRate?: number     // 16000, 48000, etc.
  channels?: number       // 1 (mono), 2 (stereo)
  language?: string
  diarization?: boolean
  interimResults?: boolean
}

// Event callbacks
interface StreamingCallbacks {
  onOpen?: () => void
  onTranscript?: (event: StreamEvent) => void
  onUtterance?: (utterance: Utterance) => void
  onError?: (error: Error) => void
  onClose?: (code?, reason?) => void
}
```

### Usage Example

```typescript
import { DeepgramAdapter } from '@meeting-baas/sdk';

const adapter = new DeepgramAdapter();
adapter.initialize({ apiKey: process.env.DEEPGRAM_KEY });

// Start streaming session
const session = await adapter.transcribeStream({
  encoding: 'linear16',
  sampleRate: 16000,
  channels: 1,
  language: 'en',
  interimResults: true
}, {
  onOpen: () => console.log('Connected'),
  onTranscript: (event) => {
    if (event.isFinal) {
      console.log('Final:', event.text);
    } else {
      console.log('Interim:', event.text);
    }
  },
  onError: (error) => console.error(error),
  onClose: () => console.log('Disconnected')
});

// Send audio chunks
const audioChunk = getAudioFromMicrophone(); // Your audio source
await session.sendAudio({ data: audioChunk });

// Close when done
await session.close();
```

### Documentation

All streaming features are **automatically documented** via TypeDoc:
- Method signatures in each adapter's README
- Complete type documentation in `docs/generated/router/router/types.md`
- Code examples extracted from JSDoc comments
- Provider-specific implementation details

See `docs/SDK_GENERATION_WORKFLOW.md` Phase 3.5 for complete streaming architecture documentation.

---

## Webhook Normalization Architecture

### Implementation Status

The SDK now provides **unified webhook handling** across all transcription providers:

- ✅ **Automatic provider detection** from payload structure
- ✅ **Unified event format** with normalized data
- ✅ **Signature verification** (where supported by provider)
- ✅ **Type-safe webhook handlers** with full TypeScript support

### Provider Webhook Details

| Provider | Webhook Format | Signature Verification | Event Types |
|----------|---------------|------------------------|-------------|
| **Gladia** | `{event, payload}` | ❌ Not supported | `transcription.created`, `transcription.success`, `transcription.error` |
| **AssemblyAI** | `{transcript_id, status}` | ✅ HMAC-SHA256 | `completed`, `error` |
| **Deepgram** | Full `ListenV1Response` | ❌ Not supported | Full transcription result in callback |
| **Azure STT** | `{action, timestamp, self}` | ✅ HMAC-SHA256 (optional) | `TranscriptionCreated`, `TranscriptionRunning`, `TranscriptionSucceeded`, `TranscriptionFailed` |
| **Speechmatics** | Query params + body | ❌ Not supported | `success`, `error`, `fetch_error`, `trim_error` via query parameters |

### Unified Webhook Event Format

```typescript
interface UnifiedWebhookEvent {
  success: boolean
  provider: TranscriptionProvider
  eventType: WebhookEventType // 'transcription.created' | 'transcription.processing' | 'transcription.completed' | 'transcription.failed'
  data?: {
    id: string
    status: TranscriptionStatus
    text?: string
    confidence?: number
    duration?: number
    language?: string
    speakers?: Speaker[]
    words?: Word[]
    utterances?: Utterance[]
    summary?: string
    error?: string
    metadata?: Record<string, unknown>
  }
  timestamp: string
  raw: unknown // Original webhook payload
}
```

### Usage Example

```typescript
import { WebhookRouter } from '@meeting-baas/sdk';
import express from 'express';

const app = express();
const router = new WebhookRouter();

// Single endpoint handles all transcription providers
app.post('/webhooks/transcription', express.json(), (req, res) => {
  // Auto-detect provider and parse webhook
  const result = router.route(req.body, {
    verification: {
      signature: req.headers['x-signature'] as string,
      secret: process.env.WEBHOOK_SECRET!
    }
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  // Unified event format across all providers
  console.log('Provider:', result.provider); // 'gladia' | 'assemblyai' | 'deepgram' | 'azure-stt' | 'speechmatics'
  console.log('Event type:', result.event?.eventType); // 'transcription.completed'
  console.log('Transcript ID:', result.event?.data?.id);

  if (result.event?.eventType === 'transcription.completed') {
    // Fetch full transcript using provider's adapter
    const adapter = getAdapter(result.provider);
    const transcript = await adapter.getTranscript(result.event.data.id);
    console.log('Full transcript:', transcript.data.text);
  }

  res.status(200).json({ received: true });
});

app.listen(3000);
```

### Provider-Specific Handlers

Each provider has a dedicated webhook handler:

```typescript
import {
  GladiaWebhookHandler,
  AssemblyAIWebhookHandler,
  DeepgramWebhookHandler,
  AzureWebhookHandler,
  SpeechmaticsWebhookHandler
} from '@meeting-baas/sdk';

// Use specific handler if you know the provider
const gladiaHandler = new GladiaWebhookHandler();
const event = gladiaHandler.parse(webhookPayload);

// Or use WebhookRouter for auto-detection
const router = new WebhookRouter();
const result = router.route(webhookPayload);
```

### Documentation

All webhook features are **automatically documented** via TypeDoc:
- WebhookRouter and handler method signatures
- Complete type documentation for `UnifiedWebhookEvent`
- Code examples extracted from JSDoc comments
- Provider-specific webhook formats and requirements

---

## Complete Integration Guide: From API Key to Production

### Quick Start: Using the SDK

#### Installation

```bash
npm install @meeting-baas/sdk
# or
pnpm add @meeting-baas/sdk
```

#### Basic Setup

```typescript
import { VoiceRouter } from '@meeting-baas/sdk';

// Initialize router
const router = new VoiceRouter({
  gladia: { apiKey: process.env.GLADIA_API_KEY },
  assemblyai: { apiKey: process.env.ASSEMBLYAI_API_KEY },
  deepgram: { apiKey: process.env.DEEPGRAM_API_KEY },
  'azure-stt': {
    apiKey: process.env.AZURE_API_KEY,
    region: 'eastus'  // Azure requires region
  },
  'openai-whisper': { apiKey: process.env.OPENAI_API_KEY },
  speechmatics: { apiKey: process.env.SPEECHMATICS_API_KEY }
});
```

---

## Provider-Specific Integration Examples

### 1. Gladia Integration

#### Features Available
- ✅ Batch transcription
- ✅ Real-time streaming
- ✅ Webhooks
- ✅ Speaker diarization
- ✅ Summarization
- ✅ Sentiment analysis
- ✅ Multi-language detection

#### Example 1: Simple Batch Transcription
```typescript
import { VoiceRouter } from '@meeting-baas/sdk';

const router = new VoiceRouter({
  gladia: { apiKey: process.env.GLADIA_API_KEY }
});

const result = await router.transcribe({
  type: 'url',
  url: 'https://example.com/recording.mp3'
}, {
  provider: 'gladia',
  language: 'en'
});

console.log('Transcript:', result.data?.text);
```

#### Example 2: Advanced with Diarization & Summary
```typescript
const result = await router.transcribe({
  type: 'url',
  url: 'https://example.com/meeting.mp3'
}, {
  provider: 'gladia',
  language: 'en',
  diarization: true,
  speakersExpected: 3,
  summarization: true,
  sentimentAnalysis: true
});

// Access speakers
result.data?.speakers?.forEach(speaker => {
  console.log(`${speaker.speaker}: ${speaker.text}`);
});

// Get summary
console.log('Summary:', result.data?.summary);
```

#### Example 3: Async with Webhook + Polling
```typescript
// Submit with webhook for async notification
const submission = await router.transcribe({
  type: 'url',
  url: 'https://example.com/long-recording.mp3'
}, {
  provider: 'gladia',
  language: 'en',
  webhookUrl: 'https://myapp.com/webhook/transcription',
  diarization: true
});

// Get job ID for polling (backup if webhook fails)
const jobId = submission.data?.id;
console.log('Job submitted:', jobId);

// Poll for completion
const pollInterval = setInterval(async () => {
  const status = await router.getTranscript(jobId, { provider: 'gladia' });

  if (status.data?.status === 'completed') {
    console.log('Completed:', status.data.text);
    clearInterval(pollInterval);
  } else if (status.data?.status === 'error') {
    console.error('Failed:', status.error);
    clearInterval(pollInterval);
  } else {
    console.log('Status:', status.data?.status);
  }
}, 5000); // Poll every 5 seconds
```

#### Example 4: Real-time Streaming
```typescript
const session = await router.transcribeStream({
  provider: 'gladia',
  encoding: 'wav/pcm',
  sampleRate: 16000,
  channels: 1,
  language: 'en',
  interimResults: true
}, {
  onOpen: () => console.log('Connected to Gladia'),
  onTranscript: (event) => {
    if (event.isFinal) {
      console.log('Final:', event.text);
    } else {
      console.log('Interim:', event.text);
    }
  },
  onUtterance: (utterance) => {
    console.log(`Speaker ${utterance.speaker}: ${utterance.text}`);
  },
  onError: (error) => console.error('Error:', error),
  onClose: () => console.log('Stream closed')
});

// Send audio chunks (from microphone, file stream, etc.)
const audioStream = getAudioStream(); // Your audio source
for await (const chunk of audioStream) {
  await session.sendAudio({ data: chunk });
}

// Close when done
await session.close();
```

---

### 2. AssemblyAI Integration

#### Features Available
- ✅ Batch transcription
- ✅ Real-time streaming
- ✅ Webhooks with signature verification
- ✅ Speaker diarization
- ✅ Summarization
- ✅ Sentiment analysis
- ✅ Entity detection
- ✅ Content moderation
- ✅ Auto chapters

#### Example 1: Comprehensive Analysis
```typescript
const result = await router.transcribe({
  type: 'url',
  url: 'https://example.com/podcast.mp3'
}, {
  provider: 'assemblyai',
  language: 'en_us',
  diarization: true,
  summarization: true,
  sentimentAnalysis: true,
  entityDetection: true,
  customVocabulary: ['AI', 'machine learning', 'neural networks']
});

console.log('Transcript:', result.data?.text);
console.log('Summary:', result.data?.summary);
console.log('Speakers:', result.data?.speakers);
```

#### Example 2: With Webhook Signature Verification
```typescript
import express from 'express';
import { WebhookRouter } from '@meeting-baas/sdk';

const app = express();
const webhookRouter = new WebhookRouter();

// Webhook endpoint
app.post('/webhook/transcription', express.json(), (req, res) => {
  const result = webhookRouter.route(req.body, {
    provider: 'assemblyai',
    verification: {
      signature: req.headers['x-assemblyai-signature'] as string,
      secret: process.env.ASSEMBLYAI_WEBHOOK_SECRET!,
      rawBody: req.rawBody
    }
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  if (!result.verified) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  console.log('Webhook received:', result.event);
  res.json({ received: true });
});

// Submit transcription
const submission = await router.transcribe({
  type: 'url',
  url: 'https://example.com/audio.mp3'
}, {
  provider: 'assemblyai',
  webhookUrl: 'https://myapp.com/webhook/transcription'
});

console.log('Transcript ID:', submission.data?.id);
```

#### Example 3: Real-time with Partial Results
```typescript
const session = await router.transcribeStream({
  provider: 'assemblyai',
  encoding: 'pcm_s16le',
  sampleRate: 16000,
  language: 'en_us',
  interimResults: true
}, {
  onTranscript: (event) => {
    if (event.isFinal) {
      // Save final transcript
      saveFinalTranscript(event.text);
    } else {
      // Update UI with interim results
      updateLiveTranscript(event.text);
    }
  }
});
```

---

### 3. Deepgram Integration

#### Features Available
- ✅ Batch transcription (synchronous - returns immediately)
- ✅ Real-time streaming
- ✅ Webhooks (with callback parameter)
- ✅ Speaker diarization
- ✅ Summarization
- ✅ Sentiment analysis
- ✅ Entity detection
- ✅ PII redaction
- ✅ Custom vocabulary

#### Example 1: Synchronous Transcription (No Polling!)
```typescript
// Deepgram returns results immediately
const result = await router.transcribe({
  type: 'url',
  url: 'https://example.com/audio.mp3'
}, {
  provider: 'deepgram',
  language: 'en',
  diarization: true,
  summarization: true
});

// Results available immediately!
console.log('Transcript:', result.data?.text);
console.log('Summary:', result.data?.summary);
console.log('Request ID:', result.data?.id); // For debugging/logging
```

#### Example 2: With Callback URL (Async Mode)
```typescript
// Use callback for async processing
const result = await router.transcribe({
  type: 'url',
  url: 'https://example.com/long-audio.mp3'
}, {
  provider: 'deepgram',
  language: 'en',
  webhookUrl: 'https://myapp.com/callback', // Deepgram calls this with full results
  diarization: true,
  piiRedaction: true // Redact sensitive information
});

console.log('Request ID:', result.data?.id);
```

#### Example 3: Streaming with Diarization
```typescript
const session = await router.transcribeStream({
  provider: 'deepgram',
  encoding: 'linear16',
  sampleRate: 16000,
  channels: 1,
  language: 'en',
  diarization: true,
  interimResults: true
}, {
  onTranscript: (event) => {
    console.log(`[${event.isFinal ? 'FINAL' : 'INTERIM'}] ${event.text}`);
  },
  onUtterance: (utterance) => {
    // Complete speaker turns
    console.log(`Speaker ${utterance.speaker}: ${utterance.text}`);
  }
});
```

---

### 4. Azure Speech-to-Text Integration

#### Features Available
- ✅ Batch transcription (always async)
- ❌ Real-time streaming (not in v3.1)
- ✅ Webhooks with optional signature
- ✅ Speaker diarization
- ✅ Custom models
- ✅ Language identification

#### Example 1: Batch Transcription with Polling
```typescript
// Azure is always async - must poll
const submission = await router.transcribe({
  type: 'url',
  url: 'https://example.com/audio.mp3'
}, {
  provider: 'azure-stt',
  language: 'en-US',
  diarization: true
});

const transcriptionId = submission.data?.id;
console.log('Azure Transcription ID:', transcriptionId);

// Polling helper
async function pollUntilComplete(id: string, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await router.getTranscript(id, { provider: 'azure-stt' });

    console.log(`Attempt ${i + 1}: ${status.data?.status}`);

    if (status.data?.status === 'completed') {
      return status;
    } else if (status.data?.status === 'error') {
      throw new Error('Transcription failed');
    }

    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
  }

  throw new Error('Polling timeout');
}

const final = await pollUntilComplete(transcriptionId);
console.log('Transcript:', final.data?.text);
```

#### Example 2: With Custom Model
```typescript
const result = await router.transcribe({
  type: 'url',
  url: 'https://example.com/specialized-audio.mp3'
}, {
  provider: 'azure-stt',
  language: 'en-US',
  metadata: {
    modelId: 'custom-medical-model-id', // Your custom trained model
    displayName: 'Medical Transcription',
    description: 'Specialized medical terminology'
  }
});
```

#### Example 3: With Webhook
```typescript
// Setup webhook in Azure first, then reference it
const result = await router.transcribe({
  type: 'url',
  url: 'https://example.com/audio.mp3'
}, {
  provider: 'azure-stt',
  language: 'en-US',
  diarization: true
  // Note: Azure webhooks are configured separately in the Azure portal
  // The webhook will receive events as transcription progresses
});
```

---

### 5. OpenAI Whisper Integration

#### Features Available
- ✅ Synchronous transcription (instant results)
- ❌ Real-time streaming (not available)
- ❌ Webhooks (synchronous API only)
- ✅ Speaker diarization (gpt-4o-transcribe-diarize model)
- ✅ Word-level timestamps
- ✅ Multiple model options (whisper-1, gpt-4o-transcribe, gpt-4o-mini-transcribe, gpt-4o-transcribe-diarize)
- ✅ Known speaker references for improved diarization

#### Example 1: Simple Transcription with gpt-4o
```typescript
// OpenAI returns results immediately (synchronous)
const result = await router.transcribe({
  type: 'url',
  url: 'https://example.com/audio.mp3'
}, {
  provider: 'openai-whisper',
  language: 'en',
  metadata: {
    model: 'gpt-4o-transcribe'  // More accurate than whisper-1
  }
});

console.log('Transcript:', result.data?.text);
// No polling needed - results are immediate!
```

#### Example 2: Diarization with Known Speakers
```typescript
// Use diarization model with known speaker references
const result = await router.transcribe({
  type: 'url',
  url: 'https://example.com/customer-call.mp3'
}, {
  provider: 'openai-whisper',
  language: 'en',
  diarization: true,  // Automatically selects gpt-4o-transcribe-diarize
  metadata: {
    knownSpeakerNames: ['customer', 'agent'],
    knownSpeakerReferences: [
      'data:audio/wav;base64,UklGRi4AAABXQVZFZm10...',  // 2-10s customer voice sample
      'data:audio/wav;base64,UklGRi4AAABXQVZFZm10...'   // 2-10s agent voice sample
    ]
  }
});

// Speakers are now labeled as 'customer' and 'agent' instead of 'A' and 'B'
result.data?.utterances?.forEach(utterance => {
  console.log(`${utterance.speaker}: ${utterance.text}`);
});
```

#### Example 3: Word Timestamps with Temperature Control
```typescript
const result = await router.transcribe({
  type: 'url',
  url: 'https://example.com/technical-lecture.mp3'
}, {
  provider: 'openai-whisper',
  language: 'en',
  wordTimestamps: true,
  metadata: {
    model: 'gpt-4o-transcribe',
    temperature: 0.2,  // Lower temperature = more focused output
    prompt: 'Expect technical terminology related to artificial intelligence, machine learning, and deep learning'
  }
});

console.log('Full transcript:', result.data?.text);

// Access word-level timestamps
result.data?.words?.forEach(word => {
  console.log(`${word.text} (${word.start}s - ${word.end}s)`);
});
```

#### Example 4: Model Comparison
```typescript
// Compare accuracy/speed across different models
async function compareModels(audioUrl: string) {
  const models = [
    'whisper-1',              // Fastest, Whisper V2 open source
    'gpt-4o-mini-transcribe', // Fast & cost-effective
    'gpt-4o-transcribe'       // Most accurate
  ];

  const results = await Promise.all(
    models.map(model =>
      router.transcribe({
        type: 'url',
        url: audioUrl
      }, {
        provider: 'openai-whisper',
        language: 'en',
        metadata: { model }
      })
    )
  );

  results.forEach((result, i) => {
    console.log(`\n${models[i]}:`);
    console.log(result.data?.text);
  });
}
```

---

### 6. Speechmatics Integration

#### Features Available
- ✅ Batch transcription (asynchronous)
- ❌ Real-time streaming (not supported in current implementation)
- ✅ Webhooks via query parameters
- ✅ Speaker diarization
- ✅ Sentiment analysis
- ✅ Summarization
- ✅ Custom vocabulary
- ✅ Known for high accuracy (per ASR benchmarks)

#### Example 1: Simple Batch Transcription with URL
```typescript
// Speechmatics is async - webhook recommended
const result = await router.transcribe({
  type: 'url',
  url: 'https://example.com/audio.mp3'
}, {
  provider: 'speechmatics',
  language: 'en',
  diarization: true
});

const jobId = result.data?.id;
console.log('Speechmatics Job ID:', jobId);

// Poll for completion
async function pollSpeechmatics(id: string) {
  const status = await router.getTranscript(id, { provider: 'speechmatics' });

  if (status.data?.status === 'completed') {
    console.log('Transcript:', status.data.text);
    return status;
  }

  // Continue polling...
  await new Promise(resolve => setTimeout(resolve, 5000));
  return pollSpeechmatics(id);
}

await pollSpeechmatics(jobId);
```

#### Example 2: Advanced with Summarization and Sentiment
```typescript
const result = await router.transcribe({
  type: 'url',
  url: 'https://example.com/meeting.mp3'
}, {
  provider: 'speechmatics',
  language: 'en',
  diarization: true,
  metadata: {
    operating_point: 'enhanced',  // Higher accuracy mode
    enable_sentiment_analysis: true,
    summarization_config: {
      type: 'bullets',  // 'bullets' | 'brief' | 'paragraph'
      length: 'medium'  // 'short' | 'medium' | 'long'
    }
  }
});

console.log('Job submitted:', result.data?.id);
```

#### Example 3: With Webhook Notifications
```typescript
// Setup webhook endpoint first
import express from 'express';
import { WebhookRouter } from '@meeting-baas/sdk';

const app = express();
const webhookRouter = new WebhookRouter();

// Speechmatics sends query params: ?id=<job_id>&status=success
app.post('/webhook/speechmatics', express.json(), (req, res) => {
  const result = webhookRouter.route(req.body, {
    provider: 'speechmatics',
    queryParams: req.query as Record<string, string>,
    userAgent: req.headers['user-agent']
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  console.log('Speechmatics webhook:', result.event?.eventType);
  console.log('Job ID:', req.query.id);
  console.log('Status:', req.query.status);

  if (result.event?.eventType === 'transcription.completed') {
    console.log('Transcript:', result.event.data?.text);
  }

  res.json({ received: true });
});

// Submit job with webhook
const submission = await router.transcribe({
  type: 'url',
  url: 'https://example.com/audio.mp3'
}, {
  provider: 'speechmatics',
  language: 'en',
  webhookUrl: 'https://myapp.com/webhook/speechmatics',
  diarization: true
});
```

#### Example 4: Custom Vocabulary for Domain-Specific Terms
```typescript
const result = await router.transcribe({
  type: 'url',
  url: 'https://example.com/medical-recording.mp3'
}, {
  provider: 'speechmatics',
  language: 'en',
  customVocabulary: ['pharyngitis', 'amoxicillin', 'dysphagia'],
  metadata: {
    operating_point: 'enhanced',
    speaker_diarization_config: {
      max_speakers: 2  // Doctor and patient
    }
  }
});
```

---

## Multi-Provider Strategy Patterns

### Pattern 1: Provider Fallback Chain

```typescript
async function transcribeWithFallback(audioUrl: string) {
  const providers: Array<'deepgram' | 'gladia' | 'assemblyai'> = [
    'deepgram',   // Try fastest first
    'gladia',     // Fallback to Gladia
    'assemblyai'  // Last resort
  ];

  for (const provider of providers) {
    try {
      console.log(`Attempting with ${provider}...`);

      const result = await router.transcribe({
        type: 'url',
        url: audioUrl
      }, {
        provider,
        language: 'en',
        diarization: true
      });

      if (result.success) {
        console.log(`✓ Success with ${provider}`);
        return result;
      }
    } catch (error) {
      console.error(`✗ ${provider} failed:`, error);
      continue; // Try next provider
    }
  }

  throw new Error('All providers failed');
}
```

### Pattern 2: Load Balancing by Audio Length

```typescript
function selectProviderByDuration(durationSeconds: number) {
  if (durationSeconds < 60) {
    // Short audio - use Deepgram (synchronous, fast)
    return 'deepgram';
  } else if (durationSeconds < 300) {
    // Medium audio - use Gladia (good balance)
    return 'gladia';
  } else {
    // Long audio - use Azure or AssemblyAI (async with webhooks)
    return 'assemblyai';
  }
}

const provider = selectProviderByDuration(audioMetadata.duration);
const result = await router.transcribe(audio, { provider });
```

### Pattern 3: Feature-Based Selection

```typescript
function selectProviderByFeatures(requirements: {
  streaming?: boolean;
  summarization?: boolean;
  sentiment?: boolean;
  realtime?: boolean;
}) {
  if (requirements.realtime && requirements.streaming) {
    // Real-time streaming needed
    return 'assemblyai'; // Best real-time support
  } else if (requirements.summarization && requirements.sentiment) {
    // Advanced analysis needed
    return 'assemblyai'; // Most comprehensive features
  } else if (!requirements.streaming) {
    // Batch only, want fast results
    return 'deepgram'; // Synchronous results
  } else {
    // General purpose
    return 'gladia';
  }
}
```

### Pattern 4: Cost Optimization

```typescript
interface ProviderPricing {
  provider: 'gladia' | 'assemblyai' | 'deepgram' | 'azure-stt';
  costPerMinute: number;
  features: string[];
}

function selectCheapestProvider(
  durationMinutes: number,
  requiredFeatures: string[]
) {
  const pricing: ProviderPricing[] = [
    { provider: 'gladia', costPerMinute: 0.0002, features: ['diarization', 'summary'] },
    { provider: 'assemblyai', costPerMinute: 0.00025, features: ['diarization', 'summary', 'sentiment'] },
    { provider: 'deepgram', costPerMinute: 0.0003, features: ['diarization', 'pii'] },
    { provider: 'azure-stt', costPerMinute: 0.00024, features: ['diarization', 'custom'] }
  ];

  // Filter by required features
  const compatible = pricing.filter(p =>
    requiredFeatures.every(f => p.features.includes(f))
  );

  // Sort by cost
  compatible.sort((a, b) => a.costPerMinute - b.costPerMinute);

  return compatible[0]?.provider || 'gladia'; // Default to Gladia
}
```

---

## Production Best Practices

### 1. Error Handling

```typescript
async function robustTranscription(audio: AudioInput) {
  try {
    const result = await router.transcribe(audio, {
      provider: 'gladia',
      language: 'en'
    });

    if (!result.success) {
      // Handle API error
      console.error('Error:', result.error);

      // Log for monitoring
      logToSentry({
        provider: result.provider,
        error: result.error,
        audio: audio.url
      });

      // Return user-friendly error
      return {
        success: false,
        message: 'Transcription failed. Please try again.'
      };
    }

    return result;
  } catch (error) {
    // Handle network/timeout errors
    console.error('Network error:', error);
    throw error;
  }
}
```

### 2. Webhook Resilience

```typescript
import express from 'express';
import { WebhookRouter } from '@meeting-baas/sdk';

const app = express();
const webhookRouter = new WebhookRouter();
const processingQueue = new Map();

app.post('/webhook/transcription', express.json(), async (req, res) => {
  try {
    // Auto-detect provider
    const result = webhookRouter.route(req.body, {
      verification: {
        signature: req.headers['x-signature'] as string,
        secret: process.env.WEBHOOK_SECRET!
      }
    });

    if (!result.success) {
      console.error('Invalid webhook:', result.error);
      return res.status(400).json({ error: result.error });
    }

    // Immediately acknowledge receipt (prevent retries)
    res.status(200).json({ received: true });

    // Process asynchronously
    setImmediate(async () => {
      try {
        await processWebhookEvent(result.event);
      } catch (error) {
        console.error('Processing failed:', error);
        // Store for retry
        await saveFailedWebhook(result.event);
      }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});
```

### 3. Caching Strategy

```typescript
import Redis from 'ioredis';

const redis = new Redis();

async function transcribeWithCache(audioUrl: string, options: any) {
  // Generate cache key
  const cacheKey = `transcript:${audioUrl}:${JSON.stringify(options)}`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log('Cache hit!');
    return JSON.parse(cached);
  }

  // Transcribe
  const result = await router.transcribe({
    type: 'url',
    url: audioUrl
  }, options);

  // Cache for 24 hours
  if (result.success) {
    await redis.setex(cacheKey, 86400, JSON.stringify(result));
  }

  return result;
}
```

### 4. Rate Limiting

```typescript
import Bottleneck from 'bottleneck';

// Create limiter: 10 requests per second
const limiter = new Bottleneck({
  maxConcurrent: 10,
  minTime: 100 // 100ms between requests
});

// Wrap transcription calls
const rateLimitedTranscribe = limiter.wrap(
  async (audio: AudioInput, options: any) => {
    return router.transcribe(audio, options);
  }
);

// Usage
const results = await Promise.all([
  rateLimitedTranscribe(audio1, { provider: 'gladia' }),
  rateLimitedTranscribe(audio2, { provider: 'gladia' }),
  rateLimitedTranscribe(audio3, { provider: 'gladia' })
]);
```

---

## Integration Phases

### ✅ Phase 1: Foundation (COMPLETED)
- [x] Gladia adapter
- [x] AssemblyAI adapter
- [x] VoiceRouter bridge
- [x] Documentation system
- [x] Build pipeline

### ✅ Phase 2: High Priority Providers (PARTIALLY COMPLETE)
Focus on providers with public OpenAPI specs and high usage.

#### 2.1 Deepgram (Rank 1) - ✅ **COMPLETED**
- ✅ OpenAPI spec downloaded from GitHub
- ✅ Types generated (263 schemas)
- ✅ DeepgramAdapter implemented with full features
- ✅ Documentation generated
- ✅ Build tested successfully
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
