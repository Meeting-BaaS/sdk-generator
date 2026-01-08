# Provider OpenAPI Shortfalls

This document tracks gaps in provider OpenAPI specifications that require manual workarounds in the SDK.

## Overview

The SDK aims to use **only generated types** from provider OpenAPI specs. However, some providers have incomplete specs that require manual const definitions.

| Provider | OpenAPI Completeness | Manual Workarounds |
|----------|---------------------|-------------------|
| **Gladia** | Excellent | None |
| **Deepgram** | Good | Sample rate, Model enum |
| **AssemblyAI** | Moderate | Sample rate, Encoding, Speech model |
| **Azure** | Good | None |

---

## Deepgram

### Sample Rate (Not in OpenAPI)

**Issue:** Deepgram's OpenAPI spec defines `sample_rate` as plain `number` with no enum.

**Workaround:** Manual `DeepgramSampleRate` const (unchecked):

```typescript
// src/constants.ts
export const DeepgramSampleRate = {
  NUMBER_8000: 8000,
  NUMBER_16000: 16000,
  NUMBER_32000: 32000,
  NUMBER_44100: 44100,
  NUMBER_48000: 48000
} as const  // NOT type-checked
```

**Source:** Values from [Deepgram documentation](https://developers.deepgram.com/docs/streaming)

### Model Enum (Union type, not const object)

**Issue:** OpenAPI generates `ListenV1ModelParameter` as a union type with `| string` fallback, not a const object.

**Workaround:** Manual `DeepgramModel` const with `satisfies` check:

```typescript
export const DeepgramModel = {
  "nova-3": "nova-3",
  "nova-2": "nova-2",
  // ...
} as const satisfies Record<string, ListenV1ModelParameter>
```

**Type Safety:** Compile-time error if values drift from generated type.

---

## AssemblyAI

### Sample Rate (Not in OpenAPI)

**Issue:** AssemblyAI's streaming SDK accepts any `number` for sample rate. No enum exists in the spec.

**Workaround:** Manual `AssemblyAISampleRate` const (unchecked):

```typescript
export const AssemblyAISampleRate = {
  rate8000: 8000,
  rate16000: 16000,
  rate22050: 22050,
  rate44100: 44100,
  rate48000: 48000
} as const  // NOT type-checked
```

**Source:** Values from [AssemblyAI documentation](https://www.assemblyai.com/docs/speech-to-text/streaming)

### Encoding (Union type, not const object)

**Issue:** `AudioEncoding` is a union type (`"pcm_s16le" | "pcm_mulaw"`), not a const object.

**Workaround:** Manual `AssemblyAIEncoding` const with `satisfies` check:

```typescript
export const AssemblyAIEncoding = {
  pcmS16le: "pcm_s16le",
  pcmMulaw: "pcm_mulaw"
} as const satisfies Record<string, AudioEncoding>
```

### Speech Model (Union type, not const object)

**Issue:** `StreamingSpeechModel` is a union type, not a const object.

**Workaround:** Manual `AssemblyAISpeechModel` const with `satisfies` check:

```typescript
export const AssemblyAISpeechModel = {
  english: "universal-streaming-english",
  multilingual: "universal-streaming-multilingual"
} as const satisfies Record<string, StreamingSpeechModel>
```

---

## Gladia

Gladia has the most complete OpenAPI spec. All constants are direct re-exports:

| Const | Generated Type | Status |
|-------|---------------|--------|
| `GladiaEncoding` | `StreamingSupportedEncodingEnum` | ✅ |
| `GladiaSampleRate` | `StreamingSupportedSampleRateEnum` | ✅ |
| `GladiaBitDepth` | `StreamingSupportedBitDepthEnum` | ✅ |
| `GladiaModel` | `StreamingSupportedModels` | ✅ |
| `GladiaLanguage` | `TranscriptionLanguageCodeEnum` | ✅ |
| `GladiaStatus` | `TranscriptionControllerListV2StatusItem` | ✅ |

---

## Azure

Azure Speech-to-Text has a complete OpenAPI spec. All status values are generated:

| Const | Generated Type | Status |
|-------|---------------|--------|
| `AzureStatus` | `Status` | ✅ |

---

## Type Safety Levels

### ✅ OpenAPI (Best)
Direct re-export from generated types. Any spec changes automatically update the SDK.

```typescript
export { StreamingSupportedEncodingEnum as GladiaEncoding } from "./generated/..."
```

### ⚠️ Type-checked (Good)
Manual const with `satisfies` constraint. Compile-time error if values become invalid.

```typescript
export const DeepgramModel = { ... } as const satisfies Record<string, ListenV1ModelParameter>
```

### ❌ Unchecked (Risky)
Manual const with no type constraint. Values may drift from provider's actual API.

```typescript
export const DeepgramSampleRate = { ... } as const  // No type check!
```

---

## Contributing

If you find a provider has added types to their OpenAPI spec that we're manually defining:

1. Check if the generated type exists in `src/generated/{provider}/`
2. If it does, update `src/constants.ts` to re-export it instead
3. Remove the manual const and update the JSDoc
4. Run `pnpm build` to verify

---

## Summary Table

| Const | Provider | Type Safety | Reason |
|-------|----------|-------------|--------|
| `DeepgramEncoding` | Deepgram | ✅ OpenAPI | `ListenV1EncodingParameter` |
| `DeepgramRedact` | Deepgram | ✅ OpenAPI | `ListenV1RedactParameterOneOfItem` |
| `DeepgramTopicMode` | Deepgram | ✅ OpenAPI | `SharedCustomTopicModeParameter` |
| `DeepgramSampleRate` | Deepgram | ❌ Unchecked | Spec uses `number` |
| `DeepgramModel` | Deepgram | ⚠️ Type-checked | Spec has `\| string` fallback |
| `GladiaEncoding` | Gladia | ✅ OpenAPI | `StreamingSupportedEncodingEnum` |
| `GladiaSampleRate` | Gladia | ✅ OpenAPI | `StreamingSupportedSampleRateEnum` |
| `GladiaBitDepth` | Gladia | ✅ OpenAPI | `StreamingSupportedBitDepthEnum` |
| `GladiaModel` | Gladia | ✅ OpenAPI | `StreamingSupportedModels` |
| `GladiaLanguage` | Gladia | ✅ OpenAPI | `TranscriptionLanguageCodeEnum` |
| `GladiaStatus` | Gladia | ✅ OpenAPI | `TranscriptionControllerListV2StatusItem` |
| `AssemblyAIEncoding` | AssemblyAI | ⚠️ Type-checked | Spec has union type |
| `AssemblyAISpeechModel` | AssemblyAI | ⚠️ Type-checked | Spec has union type |
| `AssemblyAISampleRate` | AssemblyAI | ❌ Unchecked | Spec uses `number` |
| `AssemblyAIStatus` | AssemblyAI | ✅ OpenAPI | `TranscriptStatus` |
| `AzureStatus` | Azure | ✅ OpenAPI | `Status` |
