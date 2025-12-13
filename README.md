# Voice Router SDK

> Universal speech-to-text router for 6+ transcription providers with a single, unified API.

[![npm version](https://badge.fury.io/js/voice-router-dev.svg)](https://www.npmjs.com/package/voice-router-dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)

## Why Voice Router?

Switch between speech-to-text providers **without changing your code**. One API for Gladia, AssemblyAI, Deepgram, Azure, OpenAI Whisper, and Speechmatics.

```typescript
import { VoiceRouter } from 'voice-router-dev';

const router = new VoiceRouter({
  providers: {
    gladia: { apiKey: process.env.GLADIA_KEY },
    deepgram: { apiKey: process.env.DEEPGRAM_KEY }
  }
});

// Same code works with ANY provider
const result = await router.transcribe(audio, {
  provider: 'gladia'  // Switch to 'deepgram' anytime
});
```

## Features

- 🔄 **Provider-Agnostic** - Switch providers with one line
- 🎯 **Unified API** - Same interface for all providers
- 📦 **Webhook Normalization** - Auto-detect and parse webhooks
- 🔊 **Real-time Streaming** - WebSocket support (Gladia, AssemblyAI, Deepgram)
- 📊 **Advanced Features** - Diarization, sentiment, summarization
- 🔒 **Type-Safe** - Full TypeScript support
- ⚡ **Provider Fallback** - Automatic failover strategies
- 🎨 **Zero Config** - Works out of the box

## Supported Providers

| Provider | Batch | Streaming | Webhooks | Special Features |
|----------|-------|-----------|----------|------------------|
| **Gladia** | ✅ | ✅ WebSocket | ✅ | Multi-language, code-switching |
| **AssemblyAI** | ✅ | ✅ Real-time | ✅ HMAC | Auto chapters, content moderation |
| **Deepgram** | ✅ Sync | ✅ WebSocket | ✅ | PII redaction, keyword boosting |
| **Azure STT** | ✅ Async | ❌ | ✅ HMAC | Custom models, language ID |
| **OpenAI Whisper** | ✅ Sync | ❌ | ❌ | gpt-4o, multi-model support |
| **Speechmatics** | ✅ Async | ❌ | ✅ Query params | High accuracy, enhanced mode |

## Installation

```bash
npm install voice-router-dev
# or
pnpm add voice-router-dev
# or
yarn add voice-router-dev
```

## Quick Start

### Basic Transcription

```typescript
import { VoiceRouter, GladiaAdapter } from 'voice-router-dev';

// Initialize router
const router = new VoiceRouter({
  providers: {
    gladia: { apiKey: 'YOUR_GLADIA_KEY' }
  },
  defaultProvider: 'gladia'
});

// Register adapter
router.registerAdapter(new GladiaAdapter());

// Transcribe from URL
const result = await router.transcribe({
  type: 'url',
  url: 'https://example.com/audio.mp3'
}, {
  language: 'en',
  diarization: true
});

if (result.success) {
  console.log('Transcript:', result.data.text);
  console.log('Speakers:', result.data.speakers);
}
```

### Multi-Provider with Fallback

```typescript
import {
  VoiceRouter,
  GladiaAdapter,
  AssemblyAIAdapter,
  DeepgramAdapter
} from 'voice-router-dev';

const router = new VoiceRouter({
  providers: {
    gladia: { apiKey: process.env.GLADIA_KEY },
    assemblyai: { apiKey: process.env.ASSEMBLYAI_KEY },
    deepgram: { apiKey: process.env.DEEPGRAM_KEY }
  },
  selectionStrategy: 'round-robin'  // Auto load-balance
});

// Register all providers
router.registerAdapter(new GladiaAdapter());
router.registerAdapter(new AssemblyAIAdapter());
router.registerAdapter(new DeepgramAdapter());

// Automatically rotates between providers
await router.transcribe(audio1);  // Uses Gladia
await router.transcribe(audio2);  // Uses AssemblyAI
await router.transcribe(audio3);  // Uses Deepgram
```

### Real-time Streaming

```typescript
import { VoiceRouter, DeepgramAdapter } from 'voice-router-dev';

const router = new VoiceRouter({
  providers: {
    deepgram: { apiKey: process.env.DEEPGRAM_KEY }
  }
});

router.registerAdapter(new DeepgramAdapter());

// Start streaming session
const session = await router.transcribeStream({
  provider: 'deepgram',
  encoding: 'linear16',
  sampleRate: 16000,
  language: 'en',
  interimResults: true
}, {
  onTranscript: (event) => {
    if (event.isFinal) {
      console.log('Final:', event.text);
    } else {
      console.log('Interim:', event.text);
    }
  },
  onError: (error) => console.error(error)
});

// Send audio chunks
const audioStream = getMicrophoneStream();
for await (const chunk of audioStream) {
  await session.sendAudio({ data: chunk });
}

await session.close();
```

### Webhook Normalization

```typescript
import express from 'express';
import { WebhookRouter } from 'voice-router-dev';

const app = express();
const webhookRouter = new WebhookRouter();

// Single endpoint handles ALL providers
app.post('/webhooks/transcription', express.json(), (req, res) => {
  // Auto-detect provider from payload
  const result = webhookRouter.route(req.body, {
    queryParams: req.query,
    userAgent: req.headers['user-agent'],
    verification: {
      signature: req.headers['x-signature'],
      secret: process.env.WEBHOOK_SECRET
    }
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  // Unified format across all providers
  console.log('Provider:', result.provider);  // 'gladia' | 'assemblyai' | etc
  console.log('Event:', result.event?.eventType);  // 'transcription.completed'
  console.log('ID:', result.event?.data?.id);
  console.log('Text:', result.event?.data?.text);

  res.json({ received: true });
});
```

## Advanced Usage

### Provider-Specific Features

```typescript
// Gladia - Multi-language detection
const result = await router.transcribe(audio, {
  provider: 'gladia',
  languageDetection: true,
  summarization: true,
  sentimentAnalysis: true
});

// AssemblyAI - Content moderation
const result = await router.transcribe(audio, {
  provider: 'assemblyai',
  entityDetection: true,
  metadata: {
    content_safety: true,
    auto_chapters: true
  }
});

// Deepgram - PII redaction
const result = await router.transcribe(audio, {
  provider: 'deepgram',
  piiRedaction: true,
  customVocabulary: ['technical', 'terms']
});

// OpenAI Whisper - Model selection
const result = await router.transcribe(audio, {
  provider: 'openai-whisper',
  metadata: {
    model: 'gpt-4o-transcribe',  // or 'whisper-1'
    temperature: 0.2
  }
});

// Speechmatics - Enhanced accuracy
const result = await router.transcribe(audio, {
  provider: 'speechmatics',
  metadata: {
    operating_point: 'enhanced',  // Higher accuracy
    enable_sentiment_analysis: true
  }
});
```

### Error Handling

```typescript
const result = await router.transcribe(audio, {
  provider: 'gladia',
  language: 'en'
});

if (!result.success) {
  console.error('Provider:', result.provider);
  console.error('Error:', result.error);
  console.error('Details:', result.data);

  // Implement fallback strategy
  const fallbackResult = await router.transcribe(audio, {
    provider: 'assemblyai'  // Try different provider
  });
}
```

### Custom Provider Selection

```typescript
// Explicit provider selection
const router = new VoiceRouter({
  providers: {
    gladia: { apiKey: '...' },
    deepgram: { apiKey: '...' }
  },
  selectionStrategy: 'explicit'  // Must specify provider
});

// Round-robin load balancing
const router = new VoiceRouter({
  providers: { /* ... */ },
  selectionStrategy: 'round-robin'
});

// Default fallback
const router = new VoiceRouter({
  providers: { /* ... */ },
  defaultProvider: 'gladia',
  selectionStrategy: 'default'
});
```

## API Reference

### VoiceRouter

Main class for provider-agnostic transcription.

**Constructor:**
```typescript
new VoiceRouter(config: VoiceRouterConfig)
```

**Methods:**
- `registerAdapter(adapter: TranscriptionAdapter)` - Register a provider adapter
- `transcribe(audio: AudioInput, options?: TranscribeOptions)` - Transcribe audio
- `transcribeStream(options: StreamingOptions, callbacks: StreamingCallbacks)` - Stream audio
- `getTranscript(id: string, provider: string)` - Get transcript by ID
- `getProviderCapabilities(provider: string)` - Get provider features

### WebhookRouter

Automatic webhook detection and normalization.

**Methods:**
- `route(payload: unknown, options?: WebhookRouterOptions)` - Parse webhook
- `detectProvider(payload: unknown)` - Detect provider from payload
- `validate(payload: unknown)` - Validate webhook structure

### Adapters

Provider-specific implementations:
- `GladiaAdapter` - Gladia transcription
- `AssemblyAIAdapter` - AssemblyAI transcription
- `DeepgramAdapter` - Deepgram transcription
- `AzureSTTAdapter` - Azure Speech-to-Text
- `OpenAIWhisperAdapter` - OpenAI Whisper
- `SpeechmaticsAdapter` - Speechmatics transcription

## TypeScript Support

Full type definitions included with **provider-specific type safety**:

```typescript
import type {
  VoiceRouter,
  VoiceRouterConfig,
  AudioInput,
  TranscribeOptions,
  UnifiedTranscriptResponse,
  StreamingSession,
  StreamingOptions,
  UnifiedWebhookEvent,
  TranscriptionProvider
} from 'voice-router-dev';
```

### Provider-Specific Type Safety

**🎯 New: Type-safe responses with provider discrimination**

The SDK now provides full type safety for provider-specific responses:

```typescript
// Generic response - raw field is unknown
const result: UnifiedTranscriptResponse = await router.transcribe(audio);

// Provider-specific response - raw field is properly typed!
const deepgramResult: UnifiedTranscriptResponse<'deepgram'> = await router.transcribe(audio, {
  provider: 'deepgram'
});

// ✅ TypeScript knows raw is ListenV1Response
const metadata = deepgramResult.raw?.metadata;
const model = deepgramResult.raw?.results?.channels?.[0]?.alternatives?.[0]?.model;
```

**Provider-specific raw response types:**
- `gladia` → `PreRecordedResponse`
- `deepgram` → `ListenV1Response`
- `openai-whisper` → `CreateTranscription200One`
- `assemblyai` → `AssemblyAITranscript`
- `azure-stt` → `AzureTranscription`

### Exported Parameter Enums

**🎯 New: Direct access to provider parameter enums**

Import and use provider-specific enums for type-safe configuration:

```typescript
import {
  // Deepgram enums
  ListenV1EncodingParameter,
  ListenV1ModelParameter,
  SpeakV1EncodingParameter,

  // Gladia enums
  StreamingSupportedEncodingEnum,
  StreamingSupportedSampleRateEnum,

  // OpenAI types
  AudioResponseFormat
} from 'voice-router-dev';

// ✅ Type-safe Deepgram encoding
const session = await router.transcribeStream({
  provider: 'deepgram',
  encoding: ListenV1EncodingParameter.linear16,  // Autocomplete works!
  model: ListenV1ModelParameter['nova-2'],
  sampleRate: 16000
});

// ✅ Type-safe Gladia encoding
const gladiaSession = await router.transcribeStream({
  provider: 'gladia',
  encoding: StreamingSupportedEncodingEnum['wav/pcm'],
  sampleRate: StreamingSupportedSampleRateEnum['16000']
});
```

### Type-Safe Streaming Options

Streaming options are now fully typed based on provider OpenAPI specifications:

```typescript
// Deepgram streaming - all options are type-safe
const deepgramSession = await router.transcribeStream({
  provider: 'deepgram',
  encoding: 'linear16',           // ✅ Only Deepgram encodings
  model: 'nova-3',                // ✅ Validated model names
  language: 'en-US',              // ✅ BCP-47 language codes
  diarization: true,
  smartFormat: true
}, callbacks);

// Gladia streaming - different options
const gladiaSession = await router.transcribeStream({
  provider: 'gladia',
  encoding: 'wav/pcm',            // ✅ Only Gladia encodings
  sampleRate: 16000,              // ✅ Only supported rates
  bitDepth: 16,                   // ✅ Only supported depths
  languageConfig: { languages: ['en'] }
}, callbacks);

// AssemblyAI streaming - simpler options
const assemblySession = await router.transcribeStream({
  provider: 'assemblyai',
  sampleRate: 16000,              // ✅ Only 8000, 16000, 22050, 44100, 48000
  wordTimestamps: true
}, callbacks);
```

**Benefits:**
- ✅ **Full IntelliSense** - Autocomplete for all provider-specific options
- ✅ **Compile-time Safety** - Invalid options caught before runtime
- ✅ **Provider Discrimination** - Type system knows which provider you're using
- ✅ **OpenAPI-Generated** - Types come directly from provider specifications

## Requirements

- **Node.js**: 20.0.0 or higher
- **TypeScript**: 5.0+ (optional)
- **Package Managers**: npm, pnpm, or yarn

## Documentation

### API Reference (Auto-Generated)

Comprehensive API documentation is auto-generated with [TypeDoc](https://typedoc.org/) from TypeScript source code:

📁 **[docs/generated/](./docs/generated/)** - Complete API reference

**Main Documentation Sets**:

1. **[router/](./docs/generated/router/)** - Core SDK API
   - `voice-router.md` - VoiceRouter class (main entry point)
   - `types.md` - Unified types (UnifiedTranscriptResponse, StreamingOptions, etc.)
   - `adapters/base-adapter.md` - BaseAdapter interface

2. **[webhooks/](./docs/generated/webhooks/)** - Webhook handling
   - `webhook-router.md` - WebhookRouter class (auto-detect providers)
   - `types.md` - Webhook event types
   - `{provider}-webhook.md` - Provider-specific webhook handlers

3. **Provider-Specific Adapters**:
   - [gladia/](./docs/generated/gladia/) - Gladia adapter API
   - [deepgram/](./docs/generated/deepgram/) - Deepgram adapter API
   - [assemblyai/](./docs/generated/assemblyai/) - AssemblyAI adapter API
   - [openai/](./docs/generated/openai/) - OpenAI Whisper adapter API
   - [azure/](./docs/generated/azure/) - Azure STT adapter API
   - [speechmatics/](./docs/generated/speechmatics/) - Speechmatics adapter API

**Most Important Files**:
- `docs/generated/router/router/voice-router.md` - Main router class
- `docs/generated/router/router/types.md` - Core types
- `docs/generated/webhooks/webhook-router.md` - Webhook handling

### Developer Documentation

- **[docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Quick reference for developers
- **[docs/SDK_GENERATION_WORKFLOW.md](./docs/SDK_GENERATION_WORKFLOW.md)** - Technical workflow

## Provider Setup Guides

### Gladia
```typescript
import { VoiceRouter, GladiaAdapter } from 'voice-router-dev';

const router = new VoiceRouter({
  providers: { gladia: { apiKey: 'YOUR_KEY' } }
});
router.registerAdapter(new GladiaAdapter());
```

Get your API key: https://gladia.io

### AssemblyAI
```typescript
import { VoiceRouter, AssemblyAIAdapter } from 'voice-router-dev';

const router = new VoiceRouter({
  providers: { assemblyai: { apiKey: 'YOUR_KEY' } }
});
router.registerAdapter(new AssemblyAIAdapter());
```

Get your API key: https://assemblyai.com

### Deepgram
```typescript
import { VoiceRouter, DeepgramAdapter } from 'voice-router-dev';

const router = new VoiceRouter({
  providers: { deepgram: { apiKey: 'YOUR_KEY' } }
});
router.registerAdapter(new DeepgramAdapter());
```

Get your API key: https://deepgram.com

### Azure Speech-to-Text
```typescript
import { VoiceRouter, AzureSTTAdapter } from 'voice-router-dev';

const router = new VoiceRouter({
  providers: {
    'azure-stt': {
      apiKey: 'YOUR_KEY',
      region: 'eastus'  // Required
    }
  }
});
router.registerAdapter(new AzureSTTAdapter());
```

Get your credentials: https://azure.microsoft.com/en-us/services/cognitive-services/speech-to-text/

### OpenAI Whisper
```typescript
import { VoiceRouter, OpenAIWhisperAdapter } from 'voice-router-dev';

const router = new VoiceRouter({
  providers: { 'openai-whisper': { apiKey: 'YOUR_KEY' } }
});
router.registerAdapter(new OpenAIWhisperAdapter());
```

Get your API key: https://platform.openai.com

### Speechmatics
```typescript
import { VoiceRouter, SpeechmaticsAdapter } from 'voice-router-dev';

const router = new VoiceRouter({
  providers: { speechmatics: { apiKey: 'YOUR_KEY' } }
});
router.registerAdapter(new SpeechmaticsAdapter());
```

Get your API key: https://speechmatics.com

## Contributing

Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

## License

MIT © [Lazare Zemliak](https://github.com/Meeting-Baas)

## Support

- **Issues**: [GitHub Issues](https://github.com/Meeting-Baas/sdk-generator/issues)
- **Repository**: [GitHub](https://github.com/Meeting-Baas/sdk-generator)

---

**Note**: This is a development version (`voice-router-dev`). The stable release will be published as `voice-router`.
