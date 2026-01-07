# Type-Safe Streaming

This guide shows how to use the SDK's type-safe streaming enums for compile-time validation and IDE autocomplete.

## Quick Start

```typescript
// Node.js - full SDK with adapters
import {
  // Deepgram
  DeepgramEncoding,
  DeepgramModel,
  DeepgramRedact,
  DeepgramTopicMode,

  // Gladia
  GladiaEncoding,
  GladiaSampleRate,
  GladiaBitDepth,
  GladiaLanguage,

  // AssemblyAI
  AssemblyAIEncoding,
  AssemblyAISpeechModel,
  AssemblyAISampleRate,
} from 'voice-router-dev'

// Browser/Edge - constants only (no Node.js deps)
import {
  DeepgramEncoding,
  DeepgramModel,
  GladiaEncoding,
  AssemblyAIEncoding,
} from 'voice-router-dev/constants'
```

All enums provide:
- **Autocomplete** - Press `.` to see all valid options
- **Compile-time errors** - Typos caught before runtime
- **OpenAPI sync** - Values derived from provider specs

---

## Deepgram

```typescript
import {
  DeepgramAdapter,
  DeepgramEncoding,
  DeepgramModel,
  DeepgramRedact,
  DeepgramTopicMode
} from 'voice-router-dev'

const adapter = new DeepgramAdapter({ apiKey: process.env.DEEPGRAM_API_KEY })

const session = await adapter.transcribeStream({
  deepgramStreaming: {
    // Audio format
    encoding: DeepgramEncoding.linear16,     // linear16 | flac | mulaw | opus | speex | g729
    sampleRate: 16000,
    channels: 1,

    // Model selection
    model: DeepgramModel["nova-3"],          // nova-3 | nova-2 | nova-2-medical | enhanced | ...
    language: "en",

    // Processing options
    punctuate: true,
    smartFormat: true,
    fillerWords: true,                       // Detect "uh", "um"
    numerals: true,                          // "twenty" → "20"

    // Advanced features
    diarization: true,
    sentiment: true,
    topics: true,
    customTopicMode: DeepgramTopicMode.extended,

    // Redaction
    redact: [DeepgramRedact.pii, DeepgramRedact.pci],  // pii | pci | numbers
  }
}, {
  onTranscript: (event) => console.log(event.text),
  onUtterance: (utterance) => console.log('Final:', utterance.text),
})

// Send audio
session.send(audioBuffer)

// Close when done
session.close()
```

---

## Gladia

```typescript
import {
  GladiaAdapter,
  GladiaEncoding,
  GladiaSampleRate,
  GladiaBitDepth,
  GladiaLanguage
} from 'voice-router-dev'

const adapter = new GladiaAdapter({ apiKey: process.env.GLADIA_API_KEY })

const session = await adapter.transcribeStream({
  // Audio format (all type-safe from OpenAPI)
  encoding: GladiaEncoding["wav/pcm"],       // wav/pcm | wav/alaw | wav/ulaw
  sampleRate: GladiaSampleRate.NUMBER_16000, // 8000 | 16000 | 32000 | 44100 | 48000
  bitDepth: GladiaBitDepth.NUMBER_16,        // 8 | 16 | 24 | 32
  channels: 1,

  // Language
  language: GladiaLanguage.en,               // 100+ language codes with autocomplete

  // Gladia-specific passthrough options
  gladiaStreaming: {
    // Pre-processing
    pre_processing: {
      audio_enhancer: true,
    },

    // Real-time processing
    realtime_processing: {
      translation: true,
      translation_config: {
        target_languages: ["es", "fr"],
      },
    },
  }
}, {
  onTranscript: (event) => console.log(event.text),
  onTranslation: (event) => console.log(`${event.targetLanguage}: ${event.translatedText}`),
  onSentiment: (event) => console.log(`Sentiment: ${event.sentiment}`),
})

session.send(audioBuffer)
session.close()
```

---

## AssemblyAI

```typescript
import {
  AssemblyAIAdapter,
  AssemblyAIEncoding,
  AssemblyAISpeechModel,
  AssemblyAISampleRate
} from 'voice-router-dev'

const adapter = new AssemblyAIAdapter({ apiKey: process.env.ASSEMBLYAI_API_KEY })

const session = await adapter.transcribeStream({
  assemblyaiStreaming: {
    // Audio format
    encoding: AssemblyAIEncoding.pcmS16le,   // pcm_s16le | pcm_mulaw
    sampleRate: AssemblyAISampleRate.rate16000,

    // Model
    speechModel: AssemblyAISpeechModel.multilingual,  // english | multilingual

    // End-of-turn detection tuning
    endOfTurnConfidenceThreshold: 0.5,
    minEndOfTurnSilenceWhenConfident: 1000,
    maxTurnSilence: 20000,

    // Processing
    formatTurns: true,
    filterProfanity: true,

    // Custom vocabulary
    keyterms: ["technical", "terms"],
  }
}, {
  onTranscript: (event) => console.log(event.text),
  onUtterance: (utterance) => console.log('Turn complete:', utterance.text),
})

// Dynamic configuration (mid-stream updates)
session.updateConfiguration?.({
  endOfTurnConfidenceThreshold: 0.8,
  vadThreshold: 0.4,
})

// Force end-of-turn
session.forceEndpoint?.()

session.send(audioBuffer)
session.close()
```

---

## Type Safety Reference

| Enum | Values | Source |
|------|--------|--------|
| `DeepgramEncoding` | `linear16`, `flac`, `mulaw`, `opus`, `speex`, `g729` | OpenAPI |
| `DeepgramModel` | `nova-3`, `nova-2`, `nova-2-medical`, `enhanced`, ... | OpenAPI |
| `DeepgramRedact` | `pii`, `pci`, `numbers` | OpenAPI |
| `DeepgramTopicMode` | `strict`, `extended` | OpenAPI |
| `GladiaEncoding` | `wav/pcm`, `wav/alaw`, `wav/ulaw` | OpenAPI |
| `GladiaSampleRate` | `8000`, `16000`, `32000`, `44100`, `48000` | OpenAPI |
| `GladiaBitDepth` | `8`, `16`, `24`, `32` | OpenAPI |
| `GladiaLanguage` | `en`, `es`, `fr`, ... (100+ codes) | OpenAPI |
| `AssemblyAIEncoding` | `pcm_s16le`, `pcm_mulaw` | SDK types |
| `AssemblyAISpeechModel` | `english`, `multilingual` | SDK types |
| `AssemblyAISampleRate` | `8000`, `16000`, `22050`, `44100`, `48000` | Manual |

---

## Callbacks Reference

```typescript
await adapter.transcribeStream(options, {
  // Core events (all providers)
  onTranscript: (event) => {},     // Interim/final transcripts
  onUtterance: (utterance) => {},  // Complete utterances
  onError: (error) => {},          // Errors
  onClose: (code, reason) => {},   // Connection closed

  // Speech events
  onSpeechStart: (event) => {},    // Speech detected
  onSpeechEnd: (event) => {},      // Speech ended

  // Gladia-specific
  onTranslation: (event) => {},    // Real-time translation
  onSentiment: (event) => {},      // Sentiment analysis
  onEntity: (event) => {},         // Named entities
  onSummarization: (event) => {},  // Post-processing summary
  onChapterization: (event) => {}, // Auto-chapters

  // Metadata
  onMetadata: (metadata) => {},    // Stream metadata
})
```
