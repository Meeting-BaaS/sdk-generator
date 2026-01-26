# Gladia OpenAPI Spec vs Documentation Discrepancies

**Date:** 2026-01-26
**SDK Version:** 0.7.8
**Author:** SDK Generator Team

This document tracks discrepancies between Gladia's official OpenAPI spec and their documentation pages.

---

## Sources

### Primary Sources

| Source | URL | Description |
|--------|-----|-------------|
| OpenAPI Spec | https://api.gladia.io/openapi.json | Machine-readable API definition |
| Docs Index | https://docs.gladia.io/llms.txt | Documentation sitemap for LLMs |

### API Reference Pages

| Page | URL |
|------|-----|
| Live Init (POST /v2/live) | https://docs.gladia.io/api-reference/v2/live/init |
| WebSocket Connection | https://docs.gladia.io/api-reference/v2/live/websocket |
| Audio Chunk Action | https://docs.gladia.io/api-reference/v2/live/action/audio-chunk |
| Stop Recording Action | https://docs.gladia.io/api-reference/v2/live/action/stop-recording |
| Transcript Message | https://docs.gladia.io/api-reference/v2/live/message/transcript |

### Guides & Tutorials

| Page | URL |
|------|-----|
| V1→V2 Migration Guide | https://docs.gladia.io/chapters/live-stt/migration-from-v1 |
| Word Timestamps Section | https://docs.gladia.io/chapters/live-stt/migration-from-v1#word-timestamps |
| Supported Languages | https://docs.gladia.io/chapters/language/supported-languages |

### Batch Transcription (for comparison)

| Page | URL |
|------|-----|
| Pre-recorded Transcription | https://docs.gladia.io/api-reference/v2/pre-recorded/transcription |

---

## Discrepancies Found

### 1. `words_accurate_timestamps` - FIXED in SDK 0.7.8

| Source | Status | Link |
|--------|--------|------|
| OpenAPI Spec | **Missing** | [openapi.json](https://api.gladia.io/openapi.json) (search `RealtimeProcessingConfig`) |
| API Reference | **Missing** | [POST /v2/live](https://docs.gladia.io/api-reference/v2/live/init) (see `realtime_processing`) |
| Migration Guide | **Documented** | [Word Timestamps section](https://docs.gladia.io/chapters/live-stt/migration-from-v1#word-timestamps) |

**Evidence from migration guide:**
> `word_timestamps` has been renamed to `words_accurate_timestamps` and moved into the `realtime_processing` object.

**Resolution:** Added to SDK spec manually based on migration guide.

```json
// V2 config from migration guide
{
  "realtime_processing": {
    "words_accurate_timestamps": true  // ✅ Now in SDK
  }
}
```

---

## Fields Present in All Sources (Verified)

### `realtime_processing`

| Field | OpenAPI | API Ref | Migration | SDK |
|-------|---------|---------|-----------|-----|
| `custom_vocabulary` | ✅ | ✅ | ❌ | ✅ |
| `custom_vocabulary_config` | ✅ | ❌ | ❌ | ✅ |
| `custom_spelling` | ✅ | ✅ | ❌ | ✅ |
| `custom_spelling_config` | ✅ | ❌ | ❌ | ✅ |
| `translation` | ✅ | ✅ | ❌ | ✅ |
| `translation_config` | ✅ | ❌ | ❌ | ✅ |
| `named_entity_recognition` | ✅ | ✅ | ❌ | ✅ |
| `sentiment_analysis` | ✅ | ✅ | ❌ | ✅ |
| `words_accurate_timestamps` | ❌ | ❌ | ✅ | ✅ |

### `pre_processing`

| Field | OpenAPI | API Ref | Migration | SDK |
|-------|---------|---------|-----------|-----|
| `audio_enhancer` | ✅ | ✅ | ✅ | ✅ |
| `speech_threshold` | ✅ | ✅ | ❌ | ✅ |

### `language_config`

| Field | OpenAPI | API Ref | Migration | SDK |
|-------|---------|---------|-----------|-----|
| `languages` | ✅ | ✅ | ✅ | ✅ |
| `code_switching` | ✅ | ✅ | ✅ | ✅ |

### `messages_config`

| Field | OpenAPI | API Ref | Migration | SDK |
|-------|---------|---------|-----------|-----|
| `receive_partial_transcripts` | ✅ | ✅ | ✅ | ✅ |
| `receive_final_transcripts` | ✅ | ✅ | ✅ | ✅ |
| `receive_speech_events` | ✅ | ✅ | ✅ | ✅ |
| `receive_pre_processing_events` | ✅ | ✅ | ✅ | ✅ |
| `receive_realtime_processing_events` | ✅ | ✅ | ✅ | ✅ |
| `receive_post_processing_events` | ✅ | ✅ | ✅ | ✅ |
| `receive_acknowledgments` | ✅ | ✅ | ✅ | ✅ |
| `receive_lifecycle_events` | ✅ | ✅ | ✅ | ✅ |
| `receive_errors` | ✅ | ✅ | ❌ | ✅ |

### `post_processing`

| Field | OpenAPI | API Ref | Migration | SDK |
|-------|---------|---------|-----------|-----|
| `summarization` | ✅ | ✅ | ❌ | ✅ |
| `summarization_config` | ✅ | ❌ | ❌ | ✅ |
| `chapterization` | ✅ | ✅ | ❌ | ✅ |

---

## Fields NOT in Streaming API (Batch Only)

These fields exist in Gladia's **batch transcription API** but are NOT available in the **live streaming API**.

**Verification:**
- Streaming schema: Search `RealtimeProcessingConfig` in [openapi.json](https://api.gladia.io/openapi.json)
- Batch schema: See [Pre-recorded Transcription API](https://docs.gladia.io/api-reference/v2/pre-recorded/transcription)

| Field | Streaming | Batch | Notes |
|-------|-----------|-------|-------|
| `emotion_analysis` | ❌ | ✅ | Only in batch `TranscriptionConfig` |
| `structured_data_extraction` | ❌ | ✅ | Only in batch `TranscriptionConfig` |
| `audio_to_llm` | ❌ | ✅ | Only in batch `TranscriptionConfig` |
| `diarization` | ❌ | ✅ | Only in batch `TranscriptionConfig` |
| `moderation` | ❌ | ✅ | Only in batch `TranscriptionConfig` |

> **Warning:** If a client sends these fields to the streaming API, Gladia silently ignores them.

---

## Deprecated V1 Fields (Not in V2)

Per the [migration guide](https://docs.gladia.io/chapters/live-stt/migration-from-v1#other-properties), these V1 fields are **not supported** in V2:

| V1 Field | V2 Status | Source |
|----------|-----------|--------|
| `prosody` | Not supported | [Other properties](https://docs.gladia.io/chapters/live-stt/migration-from-v1#other-properties) |
| `reinject_context` | Not supported | [Other properties](https://docs.gladia.io/chapters/live-stt/migration-from-v1#other-properties) |
| `transcription_hint` | Not supported | [Other properties](https://docs.gladia.io/chapters/live-stt/migration-from-v1#other-properties) |
| `frames_format` | Auto-detected | [Frames format](https://docs.gladia.io/chapters/live-stt/migration-from-v1#frames-format) |
| `model` | Only `solaria-1` | [Model](https://docs.gladia.io/chapters/live-stt/migration-from-v1#model) |
| `language_behaviour` | Replaced by `language_config` | [Language](https://docs.gladia.io/chapters/live-stt/migration-from-v1#language) |
| `language` | Replaced by `language_config.languages` | [Manual language](https://docs.gladia.io/chapters/live-stt/migration-from-v1#manual) |
| `word_timestamps` | Renamed to `words_accurate_timestamps` | [Word timestamps](https://docs.gladia.io/chapters/live-stt/migration-from-v1#word-timestamps) |
| `audio_enhancer` | Moved to `pre_processing.audio_enhancer` | [Audio enhancer](https://docs.gladia.io/chapters/live-stt/migration-from-v1#audio-enhancer) |
| `maximum_audio_duration` | Renamed to `maximum_duration_without_endpointing` | [End-pointing](https://docs.gladia.io/chapters/live-stt/migration-from-v1#end-pointing-and-maximum-audio-duration) |

---

## Recommendations

1. **Monitor Gladia's OpenAPI spec** for updates - they may add `words_accurate_timestamps` eventually
   - Check: https://api.gladia.io/openapi.json
   - Our sync script: `pnpm openapi:sync:gladia`

2. **Do not add batch-only fields** to streaming config - they will be silently ignored
   - Compare `RealtimeProcessingConfig` vs `TranscriptionConfig` in OpenAPI spec

3. **Report spec gaps to Gladia** - their OpenAPI spec should match their documentation
   - Gladia GitHub: https://github.com/gladiaio
   - Contact: support@gladia.io

4. **Use migration guide as source of truth** for V2 features
   - https://docs.gladia.io/chapters/live-stt/migration-from-v1

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-26 | Initial audit, added `words_accurate_timestamps` to SDK spec |
