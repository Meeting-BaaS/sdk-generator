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

<a id="diarization"></a>

## Speaker Diarization

> Identify and separate different speakers in audio

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | `diarization`, `diarization_config`, `diarization_config.number_of_speakers`, `diarization_config.min_speakers`, `diarization_config.max_speakers` | — |
| AssemblyAI | `speaker_labels`, `speaker_options.min_speakers_expected`, `speaker_options.max_speakers_expected`, `speakers_expected` | — |
| Deepgram | `diarize`, `diarize_model` | `diarize`, `diarize_model` |
| OpenAI Whisper | — | — |
| Azure STT | `properties.diarizationEnabled` | — |
| Speechmatics | `diarization` | — |
| Soniox | `enable_speaker_diarization` | `enableSpeakerDiarization` |
| ElevenLabs | `num_speakers`, `diarize`, `diarization_threshold` | — |

**Provider-specific notes:**

- Gladia: `diarization` (boolean) + `diarization_config` (object with speaker counts)
- Deepgram: `diarize` (boolean) - no speaker count hints
- AssemblyAI: `speaker_labels` (boolean) + `speakers_expected` (number)
- Soniox: `enableSpeakerDiarization` / `enable_speaker_diarization` (streaming vs async)
- ElevenLabs: `diarize` (boolean) + `num_speakers` and `diarization_threshold`
- Azure: `properties.diarizationEnabled` (boolean)
- OpenAI: Use `gpt-4o-transcribe-diarize` model instead of a field

**Non-equivalences (fields with same intent but different behavior):**

- OpenAI uses a dedicated model, not a boolean flag
- Speaker count hints only available on some providers

---

<a id="punctuation"></a>

## Punctuation & Formatting

> Add punctuation, capitalization, and smart formatting

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | `punctuation_enhanced` | — |
| AssemblyAI | `format_text`, `punctuate` | — |
| Deepgram | `punctuate`, `smart_format` | `punctuate`, `smart_format` |
| OpenAI Whisper | — | — |
| Azure STT | — | — |
| Speechmatics | — | — |
| Soniox | — | — |
| ElevenLabs | — | — |

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

<a id="language"></a>

## Language Selection

> Primary transcription language or language detection

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | `language_config` | `language_config` |
| AssemblyAI | `language_code`, `language_detection`, `language_detection_options`, `language_detection_options.expected_languages`, `language_detection_options.fallback_language`, `language_detection_options.code_switching`, `language_detection_options.code_switching_confidence_threshold` | — |
| Deepgram | `detect_language`, `language` | `detect_language`, `language` |
| OpenAI Whisper | `language` | — |
| Azure STT | `locale` | — |
| Speechmatics | `language` | `language` |
| Soniox | `language_hints`, `language_hints_strict` | `languageHints`, `languageHintsStrict` |
| ElevenLabs | `language_code` | — |

**Provider-specific notes:**

- Gladia: `language_config.languages` (array) or `language` (deprecated)
- Deepgram: `language` (string, BCP-47 code)
- AssemblyAI: `language_code` (string, ISO 639-1)
- ElevenLabs: `language_code` (ISO-639-1 or ISO-639-3)
- Speechmatics: `language` (string, language pack code)
- Soniox: `languageHints` (array of ISO codes)
- Azure: `locale` (string, BCP-47)
- OpenAI: `language` (string, ISO 639-1)

**Non-equivalences (fields with same intent but different behavior):**

- Field names differ significantly across providers
- Some accept arrays (multi-language), others only strings
- Language code formats vary (ISO 639-1 vs BCP-47 vs custom)

---

<a id="model"></a>

## Model Selection

> Choose transcription model/tier

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | — | `model` |
| AssemblyAI | `speech_models`, `speech_model` | — |
| Deepgram | `model` | `model` |
| OpenAI Whisper | `model` | — |
| Azure STT | `model` | — |
| Speechmatics | `model`, `operating_point` | `operating_point`, `model` |
| Soniox | `model` | `model` |
| ElevenLabs | `model_id` | — |

**Provider-specific notes:**

- Gladia: `model` (select: solaria-1, accurate, fast)
- Deepgram: `model` (nova-2, nova, enhanced, base, whisper)
- AssemblyAI: `speech_model` (best, nano)
- ElevenLabs: `model_id` (scribe model identifiers)
- Speechmatics: `model` (standard, enhanced); `operating_point` is deprecated compatibility
- Soniox: Model specified in URL/config (stt-rt-v5, stt-async-v5)
- OpenAI: `model` (whisper-1, gpt-4o-transcribe, etc.)

**Non-equivalences (fields with same intent but different behavior):**

- Speechmatics `operating_point` is deprecated and aliases `model`
- Model names are provider-specific and not translatable
- Quality/speed tradeoffs differ by provider

---

<a id="translation"></a>

## Translation

> Translate transcription to other languages

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | `translation`, `translation_config`, `translation_config.target_languages`, `translation_config.model`, `translation_config.match_original_utterances`, `translation_config.lipsync`, `translation_config.context_adaptation`, `translation_config.context`, `translation_config.informal` | `realtime_processing.translation_config`, `realtime_processing.translation_config.target_languages`, `realtime_processing.translation_config.model`, `realtime_processing.translation_config.match_original_utterances`, `realtime_processing.translation_config.lipsync`, `realtime_processing.translation_config.context_adaptation`, `realtime_processing.translation_config.context`, `realtime_processing.translation_config.informal` |
| AssemblyAI | `speech_understanding.request.translation.target_languages` | — |
| Deepgram | — | — |
| OpenAI Whisper | — | — |
| Azure STT | — | — |
| Speechmatics | — | — |
| Soniox | `translation` | `translation` |
| ElevenLabs | — | — |

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

<a id="sentiment"></a>

## Sentiment Analysis

> Detect emotional tone in speech

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | `sentiment_analysis` | `realtime_processing.sentiment_analysis` |
| AssemblyAI | `sentiment_analysis` | — |
| Deepgram | `sentiment` | `sentiment` |
| OpenAI Whisper | — | — |
| Azure STT | — | — |
| Speechmatics | — | — |
| Soniox | — | — |
| ElevenLabs | — | — |

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

<a id="entities"></a>

## Entity Detection (NER)

> Detect named entities (people, places, organizations)

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | `named_entity_recognition`, `pii_redaction_config.entity_types` | `realtime_processing.named_entity_recognition` |
| AssemblyAI | `entity_detection` | — |
| Deepgram | `detect_entities` | `detect_entities` |
| OpenAI Whisper | — | — |
| Azure STT | — | — |
| Speechmatics | — | — |
| Soniox | — | — |
| ElevenLabs | `entity_detection`, `entity_redaction`, `entity_redaction_mode` | — |

**Provider-specific notes:**

- Gladia: `named_entity_recognition` (boolean)
- AssemblyAI: `entity_detection` (boolean)
- ElevenLabs: `entity_detection` (entity types/categories)
- Deepgram: `detect_entities` (boolean)
- Speechmatics: Not available in real-time
- Soniox: Not available
- OpenAI: Not available

**Non-equivalences (fields with same intent but different behavior):**

- Entity taxonomies differ by provider
- Some providers detect more entity types than others

---

<a id="profanity"></a>

## Profanity Filtering

> Censor or filter profane language

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | — | — |
| AssemblyAI | `filter_profanity` | `filterProfanity` |
| Deepgram | `profanity_filter` | `profanity_filter` |
| OpenAI Whisper | — | — |
| Azure STT | `properties.profanityFilterMode` | — |
| Speechmatics | — | — |
| Soniox | — | — |
| ElevenLabs | — | — |

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

<a id="redaction"></a>

## PII Redaction

> Redact personally identifiable information

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | `pii_redaction`, `pii_redaction_config`, `pii_redaction_config.entity_types`, `pii_redaction_config.processed_text_type` | — |
| AssemblyAI | `redact_pii`, `redact_pii_audio`, `redact_pii_audio_options`, `redact_pii_audio_options.return_redacted_no_speech_audio`, `redact_pii_audio_options.override_audio_redaction_method`, `redact_pii_audio_quality`, `redact_pii_policies`, `redact_pii_sub`, `redact_pii_return_unredacted`, `redact_static_entities` | `redactPii`, `redactPiiPolicies`, `redactPiiSub` |
| Deepgram | `redact` | `redact` |
| OpenAI Whisper | — | — |
| Azure STT | — | — |
| Speechmatics | — | — |
| Soniox | — | — |
| ElevenLabs | `entity_redaction`, `entity_redaction_mode` | — |

**Provider-specific notes:**

- Deepgram: `redact` (array of PII types)
- AssemblyAI: `redact_pii` (boolean) + `redact_pii_policies` (array)
- ElevenLabs: `entity_redaction` and `entity_redaction_mode`
- Gladia: Not available for live
- Speechmatics: Not available
- Soniox: Not available
- OpenAI: Not available

**Non-equivalences (fields with same intent but different behavior):**

- PII categories differ by provider
- Audio vs text redaction options vary

---

<a id="timestamps"></a>

## Word Timestamps

> Get precise timing for each word

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | — | — |
| AssemblyAI | — | — |
| Deepgram | — | — |
| OpenAI Whisper | `timestamp_granularities` | — |
| Azure STT | `properties.wordLevelTimestampsEnabled`, `properties.displayFormWordLevelTimestampsEnabled` | — |
| Speechmatics | — | — |
| Soniox | — | — |
| ElevenLabs | `timestamps_granularity` | — |

**Provider-specific notes:**

- Gladia: `words_accurate_timestamps` (if available)
- Deepgram: Always included in response
- AssemblyAI: Always included when using streaming
- Speechmatics: Always included
- Soniox: Always included
- ElevenLabs: `timestamps_granularity` (word or character)
- OpenAI: `timestamp_granularities` (array: word, segment)

**Non-equivalences (fields with same intent but different behavior):**

- Most providers include by default
- OpenAI requires explicit request

---

<a id="callback"></a>

## Webhook/Callback

> Send results to a webhook URL

| Provider | Transcription Fields | Streaming Fields |
|----------|---------------------|------------------|
| Gladia | `callback_url`, `callback`, `callback_config`, `callback_config.url`, `callback_config.method` | `callback`, `callback_config`, `callback_config.url`, `callback_config.receive_partial_transcripts`, `callback_config.receive_final_transcripts`, `callback_config.receive_speech_events`, `callback_config.receive_pre_processing_events`, `callback_config.receive_realtime_processing_events`, `callback_config.receive_post_processing_events`, `callback_config.receive_acknowledgments`, `callback_config.receive_errors`, `callback_config.receive_lifecycle_events` |
| AssemblyAI | `webhook_auth_header_name`, `webhook_auth_header_value`, `webhook_url` | `webhookUrl`, `webhookAuthHeaderName`, `webhookAuthHeaderValue` |
| Deepgram | `callback`, `callback_method` | `callback`, `callback_method` |
| OpenAI Whisper | — | — |
| Azure STT | — | — |
| Speechmatics | — | — |
| Soniox | `webhook_url`, `webhook_auth_header_name`, `webhook_auth_header_value` | — |
| ElevenLabs | `webhook`, `webhook_id`, `webhook_metadata` | — |

**Provider-specific notes:**

- Gladia: `callback` (boolean) + `callback_config` (object)
- Deepgram: `callback` (string URL)
- AssemblyAI: `webhook_url` (string)
- ElevenLabs: `webhook` and `webhook_id`
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
