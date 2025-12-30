# Changelog

All notable changes to the Voice Router SDK will be documented in this file.

## [0.2.5] - 2024-12-30

### Added

#### Type-Safe Provider Options
- **Provider-specific typed options**: Each adapter now accepts fully typed options from OpenAPI specs
  - `deepgram?: Partial<DeepgramOptions>` - Full Deepgram API parameters
  - `assemblyai?: Partial<AssemblyAIOptions>` - Full AssemblyAI API parameters
  - `gladia?: Partial<GladiaOptions>` - Full Gladia API parameters
  - `openai?: Partial<OpenAIWhisperOptions>` - Full OpenAI Whisper API parameters

- **TranscriptionLanguage type**: Union type with autocomplete from AssemblyAI and Gladia OpenAPI specs

- **Code switching support** (Gladia):
  - `codeSwitching?: boolean` - Enable multilingual audio detection
  - `codeSwitchingConfig?: GladiaCodeSwitchingConfig` - Fine-tune code switching behavior
  - Note: This is now correctly separate from `languageDetection`

- **Audio-to-LLM support** (Gladia):
  - `audioToLlm?: GladiaAudioToLlmConfig` - Run custom LLM prompts on transcriptions

#### Model Selection for Pre-recorded Transcription
- **TranscriptionModel type**: Derived from OpenAPI specs with autocomplete for all providers
  - Deepgram: `nova-3`, `nova-2`, `enhanced`, `base`, `whisper-large`, etc.
  - AssemblyAI: `best`, `slam-1`, `universal`
  - Gladia: `solaria-1`
  - Speechmatics: `standard`, `enhanced`

- **model field in TranscribeOptions**: Select transcription model for pre-recorded audio (previously only available for streaming)

#### Transcript Deletion
- **deleteTranscript()**: Delete transcription data from provider servers
  - AssemblyAI: Marks transcript as deleted
  - Gladia: Supports both pre-recorded and streaming jobs
  - Azure STT: Full deletion via generated API
  - Speechmatics: Supports force deletion option

### Changed

- **Removed untyped metadata field**: The generic `metadata?: Record<string, unknown>` has been replaced with typed provider-specific options
- **Spread operator pattern**: All adapters now use `...options.provider` for type-safe option merging

### Developer Experience

- **NixOS support**: Added `flake.nix` for reproducible development environment with Node.js 20, pnpm, biome, and Rust toolchain

## Usage Examples

### Type-Safe Provider Options

```typescript
// Use Deepgram-specific options with full autocomplete
const result = await router.transcribe(audio, {
  language: 'en',
  diarization: true,
  deepgram: {
    smart_format: true,
    paragraphs: true,
    detect_topics: true
  }
});

// Use AssemblyAI-specific options
const result = await router.transcribe(audio, {
  model: 'best',
  assemblyai: {
    auto_chapters: true,
    content_safety: true,
    iab_categories: true
  }
});

// Use Gladia code switching for multilingual audio
const result = await router.transcribe(audio, {
  codeSwitching: true,
  gladia: {
    custom_metadata: { session_id: 'abc123' }
  }
});
```

### Delete Transcription Data

```typescript
// Delete transcript from provider
await adapter.deleteTranscript('transcript-id');

// Gladia: delete streaming job
await gladiaAdapter.deleteTranscript('job-id', 'streaming');

// Speechmatics: force delete running job
await speechmaticsAdapter.deleteTranscript('job-id', true);
```
