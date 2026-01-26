# Field Equivalences Across Providers

> **AUTO-GENERATED** - Do not edit manually
> 
> Regenerate with: `pnpm docs:field-equivalences`
> 
> Source: Analyzed from `src/field-metadata.ts`

This document maps semantically similar fields across providers to help you build
provider translation logic in your application. **The SDK intentionally does NOT
provide automatic translation** because these mappings are often lossy or
semantically different.

## Table of Contents

- [Speaker Diarization](#diarization)
- [Punctuation & Formatting](#punctuation)
- [Language Selection](#language)
- [Model Selection](#model)
- [Translation](#translation)
- [Sentiment Analysis](#sentiment)
- [Entity Detection (NER)](#entities)
- [Profanity Filtering](#profanity)
- [PII Redaction](#redaction)
- [Word Timestamps](#timestamps)
- [Webhook/Callback](#callback)

---

## Speaker Diarization

> Identify and separate different speakers in audio

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | `diarization`, `diarization_config`, `number_of_speakers`, `min_speakers`, `max_speakers` | — |
| Deepgram | `diarize` | `diarize` |
| Assemblyai | `speaker_labels`, `speakers_expected` | — |
| Speechmatics | `diarization` | — |
| Soniox | `enable_speaker_diarization` | `enableSpeakerDiarization` |
| Azure | `diarizationEnabled`, `diarization` | — |
| Openai | — | — |

**Provider-specific notes:**

- Gladia: `diarization` (boolean) + `diarization_config` (object with speaker counts)
- Deepgram: `diarize` (boolean) - no speaker count hints
- AssemblyAI: `speaker_labels` (boolean) + `speakers_expected` (number)
- Soniox: `enableSpeakerDiarization` / `enable_speaker_diarization` (streaming vs async)
- Azure: `properties.diarizationEnabled` (boolean)
- OpenAI: Use `gpt-4o-transcribe-diarize` model instead of a field

**Non-equivalences (fields with same intent but different behavior):**

- OpenAI uses a dedicated model, not a boolean flag
- Speaker count hints only available on some providers

---

## Punctuation & Formatting

> Add punctuation, capitalization, and smart formatting

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | `punctuation_enhanced` | — |
| Deepgram | `punctuate`, `smart_format` | `punctuate`, `smart_format` |
| Assemblyai | `punctuate`, `format_text` | — |
| Speechmatics | — | — |
| Soniox | — | — |
| Azure | `punctuationMode` | — |
| Openai | — | — |

**Provider-specific notes:**

- Gladia: `punctuation_enhanced` (boolean) - enhanced algorithm
- Deepgram: `punctuate` (boolean) OR `smart_format` (boolean, includes more than punctuation)
- AssemblyAI: `punctuate` (boolean)
- Speechmatics: Automatic, no toggle needed
- Azure: `properties.punctuationMode` (select: None, Dictated, Automatic, DictatedAndAutomatic)

**Non-equivalences (fields with same intent but different behavior):**

- Deepgram `smart_format` is NOT equivalent to just punctuation - it includes numerals, dates, formatting
- Azure uses modes, not a boolean
- Speechmatics has no toggle (always on)

---

## Language Selection

> Primary transcription language or language detection

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | `detect_language`, `language`, `language_config` | `language_config` |
| Deepgram | `detect_language`, `language` | `detect_language`, `language` |
| Assemblyai | `language_code`, `language_detection` | — |
| Speechmatics | `language` | `language` |
| Soniox | `language_hints`, `language_hints_strict` | `languageHints` |
| Azure | `locale` | — |
| Openai | `language` | — |

**Provider-specific notes:**

- Gladia: `language_config.languages` (array) or `language` (deprecated)
- Deepgram: `language` (string, BCP-47 code)
- AssemblyAI: `language_code` (string, ISO 639-1)
- Speechmatics: `language` (string, language pack code)
- Soniox: `languageHints` (array of ISO codes)
- Azure: `locale` (string, BCP-47)
- OpenAI: `language` (string, ISO 639-1)

**Non-equivalences (fields with same intent but different behavior):**

- Field names differ significantly across providers
- Some accept arrays (multi-language), others only strings
- Language code formats vary (ISO 639-1 vs BCP-47 vs custom)

---

## Model Selection

> Choose transcription model/tier

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | `model` | `model`, `model` |
| Deepgram | `model` | `model` |
| Assemblyai | `speech_model` | — |
| Speechmatics | `operating_point` | `operating_point` |
| Soniox | `model` | `model` |
| Azure | `model` | — |
| Openai | `model` | — |

**Provider-specific notes:**

- Gladia: `model` (select: solaria-1, accurate, fast)
- Deepgram: `model` (nova-2, nova, enhanced, base, whisper)
- AssemblyAI: `speech_model` (best, nano)
- Speechmatics: `operating_point` (standard, enhanced) - NOT called 'model'
- Soniox: Model specified in URL/config (stt-rt-preview, stt-async-preview)
- OpenAI: `model` (whisper-1, gpt-4o-transcribe, etc.)

**Non-equivalences (fields with same intent but different behavior):**

- Speechmatics uses `operating_point`, not `model`
- Model names are provider-specific and not translatable
- Quality/speed tradeoffs differ by provider

---

## Translation

> Translate transcription to other languages

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | `translation`, `translation_config`, `target_languages` | `translation`, `translation_config`, `target_languages` |
| Deepgram | — | — |
| Assemblyai | — | — |
| Speechmatics | — | — |
| Soniox | `translation` | `translation` |
| Azure | — | — |
| Openai | — | — |

**Provider-specific notes:**

- Gladia: `translation` (boolean) + `translation_config.target_languages` (array)
- Deepgram: Not available via transcription API
- AssemblyAI: Not available
- Speechmatics: `translation_config` (object)
- Soniox: `translation` (object with target_language)
- OpenAI: Not available

**Non-equivalences (fields with same intent but different behavior):**

- Not all providers support translation
- Gladia supports multiple target languages, Soniox supports one

---

## Sentiment Analysis

> Detect emotional tone in speech

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | `sentiment_analysis` | `sentiment_analysis` |
| Deepgram | `sentiment` | `sentiment` |
| Assemblyai | `sentiment_analysis` | — |
| Speechmatics | — | — |
| Soniox | — | — |
| Azure | — | — |
| Openai | — | — |

**Provider-specific notes:**

- Gladia: `sentiment_analysis` (boolean)
- AssemblyAI: `sentiment_analysis` (boolean)
- Deepgram: `sentiment` (boolean)
- Speechmatics: Not available
- Soniox: Not available
- OpenAI: Not available

**Non-equivalences (fields with same intent but different behavior):**

- Only some providers support sentiment analysis
- Output formats differ significantly

---

## Entity Detection (NER)

> Detect named entities (people, places, organizations)

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | `named_entity_recognition` | `named_entity_recognition` |
| Deepgram | `detect_entities` | `detect_entities` |
| Assemblyai | `entity_detection` | — |
| Speechmatics | — | — |
| Soniox | — | — |
| Azure | — | — |
| Openai | — | — |

**Provider-specific notes:**

- Gladia: `named_entity_recognition` (boolean)
- AssemblyAI: `entity_detection` (boolean)
- Deepgram: `detect_entities` (boolean)
- Speechmatics: Not available in real-time
- Soniox: Not available
- OpenAI: Not available

**Non-equivalences (fields with same intent but different behavior):**

- Entity taxonomies differ by provider
- Some providers detect more entity types than others

---

## Profanity Filtering

> Censor or filter profane language

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | — | — |
| Deepgram | `profanity_filter` | `profanity_filter` |
| Assemblyai | `filter_profanity` | `filterProfanity` |
| Speechmatics | — | — |
| Soniox | — | — |
| Azure | `profanityFilterMode` | — |
| Openai | — | — |

**Provider-specific notes:**

- Gladia: Not available
- Deepgram: `profanity_filter` (boolean)
- AssemblyAI: `filter_profanity` (boolean)
- Speechmatics: Not available
- Soniox: Not available
- OpenAI: Not available

**Non-equivalences (fields with same intent but different behavior):**

- Limited provider support
- Replacement strategies differ (asterisks vs removal)

---

## PII Redaction

> Redact personally identifiable information

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | — | — |
| Deepgram | `redact` | `redact` |
| Assemblyai | `redact_pii`, `redact_pii_audio`, `redact_pii_audio_quality`, `redact_pii_policies`, `redact_pii_sub` | — |
| Speechmatics | — | — |
| Soniox | — | — |
| Azure | — | — |
| Openai | — | — |

**Provider-specific notes:**

- Deepgram: `redact` (array of PII types)
- AssemblyAI: `redact_pii` (boolean) + `redact_pii_policies` (array)
- Gladia: Not available for live
- Speechmatics: Not available
- Soniox: Not available
- OpenAI: Not available

**Non-equivalences (fields with same intent but different behavior):**

- PII categories differ by provider
- Audio vs text redaction options vary

---

## Word Timestamps

> Get precise timing for each word

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | — | `words_accurate_timestamps` |
| Deepgram | `filler_words`, `keywords` | `filler_words`, `keywords` |
| Assemblyai | — | — |
| Speechmatics | — | — |
| Soniox | — | — |
| Azure | `wordLevelTimestampsEnabled`, `displayFormWordLevelTimestampsEnabled` | — |
| Openai | `timestamp_granularities` | — |

**Provider-specific notes:**

- Gladia: `words_accurate_timestamps` (if available)
- Deepgram: Always included in response
- AssemblyAI: Always included when using streaming
- Speechmatics: Always included
- Soniox: Always included
- OpenAI: `timestamp_granularities` (array: word, segment)

**Non-equivalences (fields with same intent but different behavior):**

- Most providers include by default
- OpenAI requires explicit request

---

## Webhook/Callback

> Send results to a webhook URL

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | `callback_url`, `callback`, `callback_config` | `callback`, `callback_config` |
| Deepgram | `callback`, `callback_method` | `callback`, `callback_method` |
| Assemblyai | `webhook_url`, `webhook_auth_header_name`, `webhook_auth_header_value` | — |
| Speechmatics | — | — |
| Soniox | `webhook_url`, `webhook_auth_header_name`, `webhook_auth_header_value` | — |
| Azure | — | — |
| Openai | — | — |

**Provider-specific notes:**

- Gladia: `callback` (boolean) + `callback_config` (object)
- Deepgram: `callback` (string URL)
- AssemblyAI: `webhook_url` (string)
- Speechmatics: Callback in job config
- Azure: Webhook in transcription properties
- Soniox: Not available
- OpenAI: Not available

**Non-equivalences (fields with same intent but different behavior):**

- Config structure varies significantly
- Auth header support differs

---

## Recommendation

Rather than trying to auto-translate configs between providers, we recommend:

1. **Define your own semantic config** in your app:
   ```typescript
   interface MyTranscriptionIntent {
     language: string
     wantsDiarization: boolean
     wantsPunctuation: boolean
   }
   ```

2. **Map explicitly to each provider** with full type safety:
   ```typescript
   function toDeepgram(intent: MyTranscriptionIntent): DeepgramConfig {
     return {
       language: intent.language,
       diarize: intent.wantsDiarization,
       punctuate: intent.wantsPunctuation
     }
   }
   ```

This approach is explicit, type-safe, and doesn't hide the semantic differences
between providers.
