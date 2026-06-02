# Architecture: Options Surfacing & Adapters

> Reference for agents and contributors editing this repo. Pairs with
> [`sdk-generation-pipeline.mmd`](./sdk-generation-pipeline.mmd) (the visual
> dataflow) and [`package.json`](../package.json) (the script wiring).

The SDK exposes a single `VoiceRouter.transcribe(audio, options)` entry point
that targets 8 transcription providers. The trick is that `options` is at once
**provider-agnostic** (unified fields like `language`, `diarization`) and
**fully typed per provider** (`gladia: { translation: true, ... }` autocompletes
against Gladia's generated OpenAPI types). This document explains how that
shape is built and how to add or modify it.

---

## 1. The pipeline (one paragraph)

Upstream provider specs (OpenAPI JSON/YAML, streaming SDK `.ts` files, HTML
docs pages, npm declaration files) are downloaded by **`sync-specs.js`** into
`specs/`. Five of them are then transformed in place by **`fix-*-spec.js`**
(post-fix bytes recorded as `consumedSha256`). **Orval** generates
`src/generated/<provider>/{api,schema}` from each spec; supplementary
generators emit language/model constants and streaming response types. Hand-
maintained files under `src/generated/` are restored from `specs/` by
**`fix-generated.js`** after `openapi:clean`. Adapters in `src/adapters/`
import the generated types and the `BaseAdapter` contract to expose a unified
API to the router. See the .mmd diagram for the visual flow; the canonical
manifest is `scripts/provider-upstream-manifest.js`.

Drift detection: `pnpm providers:check-updates` re-fetches every tracked
source and compares against `specs/.checksums.json` (canonical JSON hashes
+ post-fix `consumedSha256` + SDK declaration hashes).

---

## 2. Three layers of options

Defined in [`src/router/types.ts`](../src/router/types.ts).

### 2.1 Unified `TranscribeOptions` (line ~394)

Provider-agnostic fields: `language`, `model`, `diarization`,
`wordTimestamps`, `interimResults`, `summarization`, `webhookUrl`, etc. These
work for every adapter. The router selects an adapter (`selectionStrategy`),
the adapter maps these to provider-native field names.

```ts
await router.transcribe(audio, { language: "en", diarization: true })
```

### 2.2 Provider-specific overrides

A property per provider, typed against the generated request-body schema:

```ts
deepgram?:    Partial<ListenTranscribeParams>        // from generated/deepgram/schema/listenTranscribeParams
assemblyai?:  Partial<AssemblyAITranscriptParams>    // from generated/assemblyai/schema/transcriptParams
gladia?:      Partial<InitTranscriptionRequest>      // from generated/gladia/schema/initTranscriptionRequest
openai?:      Partial<Omit<CreateTranscriptionRequest, "file" | "model">>
elevenlabs?:  Partial<Omit<BodySpeechToTextV1SpeechToTextPost, "file" | "model_id" | ...>>
soniox?:      SonioxBatchOptions
```

These give consumers the full provider API surface with IntelliSense — every
field is typed against the spec orval just generated. **The `Partial<X>` type
is the contract**: changing the spec changes the consumer-visible options.

```ts
await router.transcribe(audio, {
  provider: "gladia",
  language: "en",
  gladia: {
    translation: true,
    translation_config: { target_languages: ["fr", "es"] }, // typed
    chapterization: true
  }
})
```

### 2.3 Streaming-specific (`StreamingOptions` line ~1034)

Extends `TranscribeOptions` (minus `webhookUrl`) and adds session-only fields
(`encoding`, `sampleRate`, `interimResults`) plus provider-specific streaming
keys: `gladiaStreaming`, `deepgramStreaming`, `assemblyaiStreaming`,
`speechmaticsStreaming`, `sonioxStreaming`, `elevenlabsStreaming`,
`openaiStreaming`. Same `Partial<>` pattern, typed against the streaming
request schemas.

### 2.4 Extended response data (the inverse)

`ProviderExtendedDataMap` (line ~289) ties each provider to its rich
extended payload type (`GladiaExtendedData`, `AssemblyAIExtendedData`, etc.).
A response typed `UnifiedTranscriptResponse<"gladia">` carries
`extended: GladiaExtendedData` with full per-provider typing on the way back
out.

---

## 3. How options flow at runtime

```
consumer ──→ router.transcribe(audio, options)
              │
              │  selectionStrategy: explicit | default | round-robin
              ▼
            adapter.transcribe(audio, options)
              │
              │  1. Validate config (api key, etc.)
              │  2. Build provider-native body:
              │     a. Map unified fields  (options.language → provider key)
              │     b. Spread provider-specific overrides last
              │        ({ ...mappedFromUnified, ...options.gladia })
              │     c. Apply defaults (punctuate, smart_format, etc.)
              │  3. Send HTTP via axios (URL branch JSON or file branch FormData)
              │  4. Parse provider response
              ▼
            adapter.normalize* (helpers in src/utils/transcription-helpers.ts)
              │
              │  Build UnifiedTranscriptResponse.data:
              │   text, words[], utterances[], speakers[], confidence, ...
              │  Populate .extended with provider-specific payload (typed)
              │  Populate .raw with the full provider response (typed)
              ▼
            UnifiedTranscriptResponse<P>
```

Two principles:
- **Provider-specific overrides win.** Adapters spread `options.<provider>`
  last so the consumer can always override what the unified mapping decided.
- **Generated types are the contract.** Adapters never invent options shapes;
  they pass through `Partial<GeneratedRequestType>`.

Example (Deepgram, `src/adapters/deepgram-adapter.ts:475-481`):

```ts
const params: ListenTranscribeParams = {
  ...mappedFromUnified,
  ...options.deepgram,                                  // consumer overrides
  punctuate:    options.deepgram?.punctuate    ?? true, // defaults last
  utterances:   options.deepgram?.utterances   ?? true,
  smart_format: options.deepgram?.smart_format ?? true
}
```

---

## 4. The adapter contract (`BaseAdapter`)

[`src/adapters/base-adapter.ts`](../src/adapters/base-adapter.ts)

```ts
abstract class BaseAdapter implements TranscriptionAdapter {
  readonly name: TranscriptionProvider           // "gladia" | "deepgram" | …
  readonly capabilities: ProviderCapabilities    // { streaming, diarization, ... }

  initialize(config: ProviderConfig): void       // store apiKey, build axios client

  // Required
  abstract transcribe(audio, options?): Promise<UnifiedTranscriptResponse>
  abstract getTranscript(id): Promise<UnifiedTranscriptResponse>

  // Optional
  transcribeStream?(options, callbacks): Promise<StreamingSession>
  transcribeStreamIterator?(options): AsyncIterable<StreamEvent>
  deleteTranscript?(id): Promise<{ success: boolean }>
  listTranscripts?(opts?: ListTranscriptsOptions): Promise<{...}>
  getRawClient?(): unknown
}
```

`ProviderCapabilities` is a flat record of `boolean` flags
(`streaming`, `diarization`, `wordTimestamps`, `customVocabulary`,
`summarization`, `sentimentAnalysis`, `entityDetection`, `piiRedaction`,
`listTranscripts`, `deleteTranscript`). It's used both for routing
decisions and for compile-time-derived types (`StreamingProvider` is
narrowed from this map at compile time via
`src/provider-metadata.ts`).

---

## 5. Writing a new adapter

The order matters because each step's output feeds the next.

1. **Add the spec** to `scripts/provider-upstream-manifest.js`:
   ```js
   const SPEC_SOURCES = {
     // ...
     <provider>: {
       url: "https://…/openapi.json",
       output: "specs/<provider>-openapi.json",
       format: "json",
       fixedBy: "fix-<provider>-spec.js"   // only if you need a transform
     },
   }
   const PROVIDERS = {
     // ...
     <provider>: {
       specKeys: ["<provider>"],
       upstreams: [
         { key: "<provider>NodeSdk", type: "npm-package", packageName: "…" }
       ]
     },
   }
   ```

2. **Register with orval** in [`orval.config.ts`](../orval.config.ts):
   ```ts
   const X_INPUT = { target: "./specs/<provider>-openapi.json" }
   export default defineConfig({
     <provider>Api: { input: X_INPUT, output: { target: "./src/generated/<provider>/api", client: "axios-functions", mode: "single", ... } },
     <provider>Zod: { input: X_INPUT, output: { target: "./src/generated/<provider>/api", client: "zod", fileExtension: ".zod.ts", ... } },
   })
   ```

3. **Generate**: `pnpm openapi:sync && pnpm openapi:generate:<provider>` (per-
   provider variant) or `pnpm openapi:rebuild` (full pipeline). Confirm
   `src/generated/<provider>/{api,schema}` is populated.

4. **Add the unified-option type slots** to `TranscribeOptions` (and
   `StreamingOptions` if applicable) in `src/router/types.ts`:
   ```ts
   import type { <ProviderRequestType> } from "../generated/<provider>/schema/…"
   export interface TranscribeOptions {
     // ...
     <provider>?: Partial<<ProviderRequestType>>
   }
   ```
   Also add the provider key to `ProviderExtendedDataMap` (use
   `Record<string, never>` if there's no extended data).

5. **Write the adapter** under `src/adapters/<provider>-adapter.ts`:
   ```ts
   export class <Provider>Adapter extends BaseAdapter {
     readonly name = "<provider>" as const
     readonly capabilities: ProviderCapabilities = { streaming: …, … }
     private client?: AxiosInstance

     initialize(config: ProviderConfig) {
       super.initialize(config)
       this.client = axios.create({ baseURL: …, headers: { Authorization: `Bearer ${config.apiKey}` } })
     }

     async transcribe(audio, options) {
       const params = {
         ...mapUnifiedToProvider(options),
         ...options?.<provider>     // provider overrides last
       }
       const response = await this.client!.post(...)
       return {
         success: true,
         provider: this.name,
         data: { id, text, words, utterances, speakers, ... },  // normalized
         extended: { ... },                                     // typed extra
         raw: response.data                                     // full typed
       }
     }

     async getTranscript(id) { /* poll endpoint, normalize */ }
   }
   ```

6. **Add helpers** if the provider returns segmented results that need
   stitching into `words`/`utterances`/`text`. Put them in
   [`src/utils/transcription-helpers.ts`](../src/utils/transcription-helpers.ts).

7. **Webhooks** (if applicable): add `src/webhooks/<provider>-webhook.ts`
   implementing detection + normalization, then register it in
   `src/webhooks/webhook-router.ts`.

8. **Streaming** (if applicable): if there's no streaming protocol in the
   OpenAPI spec, hand-extract types into
   `specs/<provider>-streaming-response-types.ts`, add a `manual: true`
   entry to `SPEC_SOURCES` with `dependsOnUpstreams: ["<provider>SdkPackage"]`,
   and add a restore function in `scripts/fix-generated.js` so
   `openapi:clean` doesn't wipe it. Implement `transcribeStream` on the
   adapter using `ws`.

9. **Provider metadata**: add a `ProviderCapabilitiesMap` entry in
   `src/provider-metadata.ts` so derived types (`StreamingProvider`,
   `BatchOnlyProvider`) include the new provider.

10. **Register** the adapter in `src/adapters/index.ts` and the router's
    default factory in `src/router/voice-router.ts`.

11. **Verify**:
    - `pnpm openapi:check-consumed` (post-fix hash recorded)
    - `pnpm providers:check-updates` (provider appears in output)
    - `pnpm build` (typecheck + bundle)

---

## 6. Hand-maintained files under `src/generated/`

`openapi:clean` wipes `src/generated/`. Files that aren't produced by orval
or a generator must be restored, or they'll vanish on the next clean rebuild.

The restore pattern (see `scripts/fix-generated.js`):

1. Keep the canonical source under `specs/<provider>-<name>.ts`.
2. Register as a `manual: true` `SPEC_SOURCE` with `dependsOnUpstreams`
   pointing at the SDK it was extracted from.
3. Add a `restore<Provider><What>()` function in `fix-generated.js` that
   `fs.copyFileSync` from `specs/` to `src/generated/<provider>/<name>.ts`.
4. Call it from `main()`.

Currently restored: `speechmatics/batch-types.zod.ts`,
`openai/streaming-types.ts`, `deepgram/{streaming-response-types,
schema/speakV1*Parameter}`, `soniox/{sdk-types, streaming-response-types}`,
`elevenlabs/streaming-response-types`. Also: the curated language list
`specs/elevenlabs-languages.json` is consumed by
`scripts/generate-elevenlabs-languages.js` to produce
`src/generated/elevenlabs/languages.ts`.

---

## 7. The script wiring (cheat sheet)

From [`package.json`](../package.json):

| Phase | Script | What it does |
|---|---|---|
| Sync | `openapi:sync` | Download all 8 specs → `specs/` (uses manifest) |
| Pre-orval fix | `openapi:fix-specs` | Run all 5 `fix-*-spec.js` in place |
| Consumed baseline | `openapi:record-consumed` | Hash post-fix specs → `.checksums.json` |
| Clean | `openapi:clean` | `rm -rf src/generated` |
| Codegen | `orval` | Generate `api/` + `schema/` for all 8 providers |
| Streaming | `openapi:sync-*-streaming` | 4 streaming-type generators |
| Lang/model | `openapi:sync-*-languages`, `…-models` | 9 generators feeding `src/generated/<P>/{languages,models}.ts` |
| Post-orval fix | `openapi:fix` | `fix-generated.js` (touch-ups + restore hand-maintained) |
| All of the above | `openapi:generate` | Chained, this order, idempotent |
| Sync + generate + build | `openapi:rebuild` | Top-level "from scratch" |
| Drift check | `providers:check-updates` | Reports upstream + consumed drift, exit 2 = changes |

The `prebuild` hook runs `fix-specs + fix + lang/model generators` only — no
orval, no clean. That's the lightweight "produce a build artifact from
already-generated code" path. `prepublishOnly` runs the heavy
`sync + validate + lint:fix + build`.

---

## 8. Common pitfalls (lessons from past breakage)

- **Multipart file uploads need real `FormData`**. Setting `Content-Type:
  multipart/form-data` on a plain object makes axios serialize as JSON without
  a boundary; the provider rejects. Always build a `FormData` and let axios
  derive the header. See `speechmatics-adapter.ts:340` for the pattern.
- **Buffer vs Blob.** `AudioInput.file` is `Buffer | Blob`. When pushing into
  FormData in Node, wrap `Buffer` with `new Blob([buffer])` first.
- **`openapi:clean` wipes hand-maintained files.** If you add a file under
  `src/generated/<provider>/` that no generator emits, also add a restore
  function in `fix-generated.js` (Section 6).
- **`fix-*-spec.js` are not all idempotent.** Re-running on already-fixed
  bytes can corrupt. The pipeline always runs `sync` (which re-writes raw)
  before `fix-specs`. Don't run `fix-specs` standalone on a "clean" repo
  expecting the same output.
- **Non-deterministic upstreams.** Some specs reorder keys or embed
  timestamps per request (Gladia). The checker canonicalizes JSON and masks
  ISO-8601 timestamps. If you add a new upstream that's noisy in a different
  way, extend `canonicalizeForHash` in
  `scripts/provider-upstream-manifest.js`.
- **Generated step ordering.** If a generator reads another generator's
  output, sequence them. Example: `sync-soniox-streaming` reads
  `src/generated/soniox/models.ts` and must run after `sync-soniox-models`.
- **Per-provider `openapi:generate:<X>` scripts do not run
  `record-consumed`.** Only the top-level `openapi:generate` does. After
  per-provider regens, run `pnpm openapi:record-consumed` explicitly.

---

## 9. Where to start when modifying things

- Adding a new option to a provider → edit upstream spec or wait for it;
  re-sync; re-generate; the option appears automatically in the
  `Partial<>` for that provider in `TranscribeOptions`.
- Adding a unified field (works for every provider) → add to
  `TranscribeOptions`, then map it inside each adapter's `transcribe`.
- Adding a new provider → Section 5.
- Investigating "where does this typed field come from?" → trace the import
  in `src/router/types.ts` to its `src/generated/<P>/schema/…` file → that
  was produced by orval from `specs/<P>-openapi.{json,yml,yaml}` per
  `orval.config.ts`.
- Investigating "did upstream change?" → `pnpm providers:check-updates`.
- Investigating "is my generated code stale?" → `pnpm
  openapi:check-consumed`.
