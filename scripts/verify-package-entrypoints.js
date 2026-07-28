#!/usr/bin/env node

const fs = require("node:fs")
const path = require("node:path")
const { execFileSync } = require("node:child_process")
const { createRequire } = require("node:module")
const { pathToFileURL } = require("node:url")

const rootDir = path.resolve(__dirname, "..")
const requireFromRoot = createRequire(path.join(rootDir, "package.json"))
const packageJsonPath = path.join(rootDir, "package.json")
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function absoluteExportPath(relativePath) {
  return path.join(rootDir, relativePath.replace(/^\.\//, ""))
}

function assertFile(relativePath, label) {
  const filePath = absoluteExportPath(relativePath)
  assert(fs.existsSync(filePath), `${label} target missing: ${relativePath}`)
  return filePath
}

function assertExports(moduleObject, names, label) {
  for (const name of names) {
    assert(name in moduleObject, `${label} missing export: ${name}`)
  }
}

function assertNoExports(moduleObject, names, label) {
  for (const name of names) {
    assert(!(name in moduleObject), `${label} unexpectedly exports: ${name}`)
  }
}

function assertTypeExports(relativePath, names, label) {
  const filePath = assertFile(relativePath, `${label} types`)
  const declarationText = fs.readFileSync(filePath, "utf-8")

  for (const name of names) {
    assert(new RegExp(`\\b${name}\\b`).test(declarationText), `${label} types missing: ${name}`)
  }
}

function assertTypeConsumerCompiles(label) {
  const tmpRoot = path.dirname(assertFile(packageJson.exports["."].types, `${label} types`))
  const tmpDir = fs.mkdtempSync(path.join(tmpRoot, "entrypoint-types-"))
  const consumerPath = path.join(tmpDir, "consumer.ts")
  const tsconfigPath = path.join(tmpDir, "tsconfig.json")
  const tscPath = require.resolve("typescript/bin/tsc")

  fs.writeFileSync(
    consumerPath,
    `import {
  AssemblyAIStatus,
  AssemblyAISpeechModel,
  AssemblyAITranscriptionModel,
  AllProviders,
  AzureStatus,
  BatchOnlyProviders,
  DeepgramEncoding,
  GladiaBitDepth,
  GladiaEncoding,
  GladiaSampleRate,
  OpenAIRealtimeAudioFormat,
  SonioxRealtimeModel,
  StreamingProviders,
  VoiceRouter,
  createVoiceRouter,
  SpeechmaticsModel,
  SpeechmaticsOperatingPoint,
  SpeechmaticsRegion,
  mapEncodingToProvider,
  validateAudioConfig,
  type AssemblyAIStatusType,
  type AssemblyAICompatibleSpeechModel,
  type AssemblyAIRouterOptions,
  type AudioEncoding,
  type AzureBatchOptions,
  type AzureStatusType,
  type DeepgramEncodingType,
  type GladiaBitDepthType,
  type GladiaEncodingType,
  type GladiaSampleRateType,
  type ListTranscriptsOptions,
  type OpenAIRealtimeAudioFormatType,
  type BatchOnlyProvider,
  type ProviderExtendedDataMap,
  type ProviderRawResponseMap,
  type ProviderStreamingOptions,
  type SpeechmaticsExtendedData,
  type SpeechmaticsModelType,
  type SpeechmaticsOperatingPointType,
  type SpeechmaticsRegionType,
  type SpeechmaticsBatchOptions,
  type StreamingProvider,
  type StreamingOptions,
  type StreamingOptionsForProvider,
  type TranscribeOptions,
  type TranscriptionModel,
  type TranscribeStreamParams,
  type UnifiedTranscriptResponse,
  type VoiceRouterConfig
} from "voice-router-dev"
import {
  DeepgramEncoding as ConstantsDeepgramEncoding,
  type AzureStatusType as ConstantsAzureStatusType
} from "voice-router-dev/constants"
import {
  WebhookRouter,
  type ElevenLabsWebhookPayload,
  type ProviderWebhookPayloadMap,
  type UnifiedWebhookEvent,
  type WebhookProvider,
  type WebhookRouterOptions
} from "voice-router-dev/webhooks"
import { getDeepgramTranscriptionFields } from "voice-router-dev/field-configs"
import { PROVIDER_FIELDS } from "voice-router-dev/field-metadata"
import { FIELD_EQUIVALENCES } from "voice-router-dev/field-equivalences"
import {
  AllProviders as MetadataAllProviders,
  BatchOnlyProviders as MetadataBatchOnlyProviders,
  ProviderCapabilitiesMap,
  StreamingProviders as MetadataStreamingProviders
} from "voice-router-dev/provider-metadata"

const config: VoiceRouterConfig = { providers: { gladia: { apiKey: "key" } } }
const router: VoiceRouter = createVoiceRouter(config)
const unifiedEncoding: AudioEncoding = "linear16"
const mapped: string = mapEncodingToProvider(
  DeepgramEncoding.linear16 as DeepgramEncodingType,
  "deepgram"
)
const bitDepth: GladiaBitDepthType = GladiaBitDepth.NUMBER_16
const sampleRate: GladiaSampleRateType = GladiaSampleRate.NUMBER_16000
const providerEncoding: GladiaEncodingType = GladiaEncoding["wav/pcm"]
const assemblyStatus: AssemblyAIStatusType = AssemblyAIStatus.completed
const legacyAssemblyModel: AssemblyAICompatibleSpeechModel =
  AssemblyAITranscriptionModel["universal-3-pro"]
const legacyUnifiedModel: TranscriptionModel = legacyAssemblyModel
const assemblyRouterOptions: AssemblyAIRouterOptions = {
  speech_model: legacyAssemblyModel,
  speech_models: [legacyAssemblyModel, AssemblyAITranscriptionModel["universal-2"]]
}
const azureStatus: AzureStatusType = AzureStatus.Succeeded
const constantsAzureStatus: ConstantsAzureStatusType = azureStatus
const realtimeFormat: OpenAIRealtimeAudioFormatType = OpenAIRealtimeAudioFormat.pcm16
const speechmaticsModel: SpeechmaticsModelType = SpeechmaticsModel.enhanced
const speechmaticsOperatingPoint: SpeechmaticsOperatingPointType = SpeechmaticsOperatingPoint.standard
const speechmaticsRegion: SpeechmaticsRegionType = SpeechmaticsRegion.eu2
const allProviders = AllProviders
const streamingProviders = StreamingProviders
const batchOnlyProviders = BatchOnlyProviders
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? (<T>() => T extends B ? 1 : 2) extends (<T>() => T extends A ? 1 : 2)
      ? true
      : false
    : false
type Expect<T extends true> = T
type IsUnknown<T> = unknown extends T ? ([keyof T] extends [never] ? true : false) : false
type ProviderStreamingOptionProviders = ProviderStreamingOptions["provider"]
type ProviderStreamingOptionsMatchMetadata = Expect<
  Equal<ProviderStreamingOptionProviders, StreamingProvider>
>
type AzureRawIsTyped = Expect<Equal<IsUnknown<ProviderRawResponseMap["azure-stt"]>, false>>
type DeepgramRawIsTyped = Expect<Equal<IsUnknown<ProviderRawResponseMap["deepgram"]>, false>>
type GladiaRawIsTyped = Expect<Equal<IsUnknown<ProviderRawResponseMap["gladia"]>, false>>
type SpeechmaticsRawIsTyped = Expect<Equal<IsUnknown<ProviderRawResponseMap["speechmatics"]>, false>>
type SonioxRawIsTyped = Expect<Equal<IsUnknown<ProviderRawResponseMap["soniox"]>, false>>
type ElevenLabsRawIsTyped = Expect<Equal<IsUnknown<ProviderRawResponseMap["elevenlabs"]>, false>>
type SpeechmaticsExtendedMatchesMap = Expect<
  Equal<ProviderExtendedDataMap["speechmatics"], SpeechmaticsExtendedData>
>
type ElevenLabsWebhookPayloadMatchesMap = Expect<
  Equal<ProviderWebhookPayloadMap["elevenlabs"], ElevenLabsWebhookPayload>
>
type WebhookProviderMatchesPayloadMap = Expect<
  Equal<WebhookProvider, Exclude<keyof ProviderWebhookPayloadMap, "openai-whisper">>
>
type BatchOnlyProvidersExcludedFromStreamingOptions = Expect<
  Equal<Extract<ProviderStreamingOptions, { provider: BatchOnlyProvider }>, never>
>
type DeepgramStreamingOptions = StreamingOptionsForProvider<"deepgram">
// @ts-expect-error Azure is batch-only and cannot parameterize streaming helper types.
type AzureStreamingOptions = StreamingOptionsForProvider<"azure-stt">
const gladiaProviderStreaming = {
  provider: "gladia",
  encoding: GladiaEncoding["wav/pcm"],
  sampleRate: GladiaSampleRate.NUMBER_16000,
  gladiaStreaming: { endpointing: 0.5 }
} satisfies ProviderStreamingOptions
const deepgramProviderStreaming = {
  provider: "deepgram",
  encoding: DeepgramEncoding.linear16,
  deepgramStreaming: { punctuate: true, smartFormat: true }
} satisfies ProviderStreamingOptions
const assemblyProviderStreaming = {
  provider: "assemblyai",
  sampleRate: 24000,
  assemblyaiStreaming: {
    sampleRate: 24000,
    speechModel: AssemblyAISpeechModel.english,
    formatTurns: true
  }
} satisfies ProviderStreamingOptions
const sonioxProviderStreaming = {
  provider: "soniox",
  sonioxStreaming: {
    model: SonioxRealtimeModel.stt_rt_v5,
    audioFormat: "pcm_s16le"
  }
} satisfies ProviderStreamingOptions
const assemblyParams: TranscribeStreamParams<"assemblyai"> = {
  options: assemblyProviderStreaming,
  callbacks: {}
}
const gladiaParams: TranscribeStreamParams<"gladia"> = {
  options: gladiaProviderStreaming,
  callbacks: {}
}
const deepgramOptionsForProvider: DeepgramStreamingOptions = {
  encoding: DeepgramEncoding.linear16,
  deepgramStreaming: { punctuate: true }
}
const azureBatchOptions: AzureBatchOptions = {
  displayName: "Board meeting",
  properties: {
    channels: [0],
    languageIdentification: { candidateLocales: ["en-US", "fr-FR"] }
  }
}
const speechmaticsBatchOptions: SpeechmaticsBatchOptions = {
  tracking: { reference: "meeting-123" },
  output_config: { srt_overrides: { max_lines: 2 } },
  transcription_config: { domain: "finance" }
}
const transcribeOptions: TranscribeOptions = {
  model: legacyUnifiedModel,
  assemblyai: assemblyRouterOptions,
  azure: azureBatchOptions,
  speechmatics: speechmaticsBatchOptions
}
const azureRawResponse: ProviderRawResponseMap["azure-stt"] = {
  transcription: {
    displayName: "Board meeting",
    locale: "en-US"
  },
  transcriptionData: {
    combinedRecognizedPhrases: [{ display: "hello", lexical: "hello" }]
  }
}
const deepgramRawResponse: ProviderRawResponseMap["deepgram"] = { request_id: "dg-1" }
const gladiaRawResponse: ProviderRawResponseMap["gladia"] = {
  id: "gladia-1",
  result_url: "https://example.com/result"
}
const speechmaticsRawResponse: ProviderRawResponseMap["speechmatics"] = { id: "job-1" }
const speechmaticsExtendedData: SpeechmaticsExtendedData = {
  metadata: { created_at: "2026-06-25T00:00:00Z", type: "transcription" },
  summary: { content: "hello" },
  translations: { fr: [{ content: "bonjour", start_time: 0, end_time: 1 }] },
  audio_events: [{ type: "music", start_time: 0, end_time: 1, confidence: 0.9 }]
}
const sonioxRawResponse: ProviderRawResponseMap["soniox"] = {
  meta: {
    id: "soniox-1",
    status: "queued",
    created_at: "2026-06-25T00:00:00Z",
    model: "stt-async-v5",
    filename: "meeting.wav",
    enable_speaker_diarization: false,
    enable_language_identification: false
  }
}
const elevenlabsRawResponse: ProviderRawResponseMap["elevenlabs"] = {
  language_code: "eng",
  language_probability: 1,
  text: "hello",
  words: []
}
const elevenlabsWebhookPayload: ProviderWebhookPayloadMap["elevenlabs"] = {
  transcription_id: "el-webhook-1",
  audio_duration_secs: 1,
  transcripts: [
    {
      language_code: "eng",
      language_probability: 1,
      text: "hello",
      words: [{ text: "hello", type: "word", start: 0, end: 1, logprob: 0 }]
    }
  ]
}
const speechmaticsResponse: UnifiedTranscriptResponse<"speechmatics"> = {
  success: true,
  provider: "speechmatics",
  extended: speechmaticsExtendedData,
  raw: speechmaticsRawResponse
}
const sonioxResponse: UnifiedTranscriptResponse<"soniox"> = {
  success: true,
  provider: "soniox",
  raw: sonioxRawResponse
}
const elevenlabsResponse: UnifiedTranscriptResponse<"elevenlabs"> = {
  success: true,
  provider: "elevenlabs",
  raw: elevenlabsRawResponse
}
const elevenlabsWebhookEvent: UnifiedWebhookEvent<"elevenlabs"> = {
  success: true,
  provider: "elevenlabs",
  eventType: "transcription.completed",
  timestamp: "2026-06-25T00:00:00.000Z",
  raw: elevenlabsWebhookPayload
}
const webhookRouterOptions: WebhookRouterOptions = { provider: "elevenlabs" }
const webhookProvider: WebhookProvider = "gladia"
// @ts-expect-error OpenAI Whisper has no webhook payload or handler.
const unsupportedWebhookRouterOptions: WebhookRouterOptions = { provider: "openai-whisper" }
// @ts-expect-error OpenAI Whisper has no webhook payload or handler.
type UnsupportedOpenAIWebhookEvent = UnifiedWebhookEvent<"openai-whisper">
const azureResponse: UnifiedTranscriptResponse<"azure-stt"> = {
  success: true,
  provider: "azure-stt",
  raw: azureRawResponse
}
const deepgramResponse: UnifiedTranscriptResponse<"deepgram"> = {
  success: true,
  provider: "deepgram",
  raw: deepgramRawResponse
}
const gladiaResponse: UnifiedTranscriptResponse<"gladia"> = {
  success: true,
  provider: "gladia",
  raw: gladiaRawResponse
}
const listOptions: ListTranscriptsOptions = {
  azure: { filter: "locale eq 'en-US'" },
  speechmatics: { include_deleted: true }
}
const streamingAudioConfig: StreamingOptions = { sampleRate: 22050, channels: 1, bitDepth: 16 }
// @ts-expect-error Deepgram helper options must not accept AssemblyAI-specific nested options.
const mismatchedDeepgramOptionsForProvider: DeepgramStreamingOptions = { assemblyaiStreaming: { formatTurns: true } }
// @ts-expect-error Deepgram helper options must not accept AssemblyAI batch options.
const mismatchedDeepgramBatchOptionsForProvider: DeepgramStreamingOptions = { assemblyai: {} }
// @ts-expect-error Explicit Deepgram provider options must not accept AssemblyAI-specific nested options.
const mismatchedDeepgramProviderStreaming = { provider: "deepgram", assemblyaiStreaming: { formatTurns: true } } satisfies ProviderStreamingOptions
// @ts-expect-error Explicit Deepgram provider options must not accept AssemblyAI batch options.
const mismatchedDeepgramBatchProviderStreaming = { provider: "deepgram", assemblyai: {} } satisfies ProviderStreamingOptions

validateAudioConfig({ encoding: unifiedEncoding, sampleRate, bitDepth }, "gladia")
validateAudioConfig(streamingAudioConfig, "gladia")
void router.transcribeStream(gladiaProviderStreaming)
void router.transcribeStream(deepgramProviderStreaming)
void router.transcribeStream(assemblyProviderStreaming)
// @ts-expect-error Explicit Deepgram router calls must not accept AssemblyAI-specific nested options.
void router.transcribeStream({ provider: "deepgram", assemblyaiStreaming: { formatTurns: true } })
// @ts-expect-error Explicit Deepgram router calls must not accept AssemblyAI batch options.
void router.transcribeStream({ provider: "deepgram", assemblyai: {} })
void router.transcribeStream({
  provider: "openai-whisper",
  openaiStreaming: { inputAudioFormat: OpenAIRealtimeAudioFormat.pcm16 }
})
void router.transcribeStream(sonioxProviderStreaming)
void router.transcribeStream({
  provider: "elevenlabs",
  elevenlabsStreaming: { audioFormat: "pcm_16000", commitStrategy: "vad" }
})
void router.transcribeStream({
  provider: "speechmatics",
  speechmaticsStreaming: { region: speechmaticsRegion, model: speechmaticsModel }
})
void router
void mapped
void providerEncoding
void assemblyStatus
void legacyAssemblyModel
void legacyUnifiedModel
void assemblyRouterOptions
void assemblyParams
void gladiaParams
void deepgramOptionsForProvider
void transcribeOptions
void azureResponse
void deepgramResponse
void gladiaResponse
void speechmaticsResponse
void sonioxResponse
void elevenlabsResponse
void elevenlabsWebhookEvent
void webhookRouterOptions
void webhookProvider
void unsupportedWebhookRouterOptions
void listOptions
void streamingAudioConfig
void mismatchedDeepgramOptionsForProvider
void mismatchedDeepgramBatchOptionsForProvider
void mismatchedDeepgramProviderStreaming
void mismatchedDeepgramBatchProviderStreaming
void constantsAzureStatus
void realtimeFormat
void speechmaticsOperatingPoint
void ConstantsDeepgramEncoding
void WebhookRouter
void getDeepgramTranscriptionFields
void PROVIDER_FIELDS
void FIELD_EQUIVALENCES
void ProviderCapabilitiesMap
void allProviders
void streamingProviders
void batchOnlyProviders
void MetadataAllProviders
void MetadataStreamingProviders
void MetadataBatchOnlyProviders
`
  )

  fs.writeFileSync(
    tsconfigPath,
    JSON.stringify({
      compilerOptions: {
        noEmit: true,
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        strict: true,
        skipLibCheck: true,
        esModuleInterop: true,
        resolvePackageJsonExports: true,
        resolvePackageJsonImports: true
      },
      files: [consumerPath]
    })
  )

  try {
    execFileSync(process.execPath, [tscPath, "--project", tsconfigPath], {
      cwd: rootDir,
      encoding: "utf-8",
      stdio: "pipe"
    })
  } catch (error) {
    const output = [error.stdout, error.stderr].filter(Boolean).join("\n").trim()
    throw new Error(`${label} type consumer failed${output ? `:\n${output}` : ""}`)
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

async function verifyEntrypoint(key, expectedExports, forbiddenExports = []) {
  const exportConfig = packageJson.exports[key]
  assert(exportConfig && typeof exportConfig === "object", `Missing object export: ${key}`)

  const importPath = assertFile(exportConfig.import, `${key} import`)
  const requirePath = assertFile(exportConfig.require, `${key} require`)
  assertFile(exportConfig.types, `${key} types`)

  const esmModule = await import(pathToFileURL(importPath).href)
  const cjsModule = requireFromRoot(requirePath)

  assertExports(esmModule, expectedExports, `${key} ESM`)
  assertExports(cjsModule, expectedExports, `${key} CJS`)
  assertNoExports(esmModule, forbiddenExports, `${key} ESM`)
  assertNoExports(cjsModule, forbiddenExports, `${key} CJS`)
}

async function main() {
  const exportsMap = packageJson.exports
  assert(exportsMap && typeof exportsMap === "object", "package.json exports map missing")

  for (const [key, exportConfig] of Object.entries(exportsMap)) {
    if (key === "./package.json") {
      assertFile(exportConfig, key)
      continue
    }

    if (typeof exportConfig === "string") {
      assertFile(exportConfig, key)
      continue
    }

    assertFile(exportConfig.import, `${key} import`)
    assertFile(exportConfig.require, `${key} require`)
    assertFile(exportConfig.types, `${key} types`)
  }

  await verifyEntrypoint(
    ".",
    [
      "VoiceRouter",
      "createVoiceRouter",
      "GladiaAdapter",
      "AssemblyAIAdapter",
      "AllProviders",
      "StreamingProviders",
      "BatchOnlyProviders",
      "mapEncodingToProvider",
      "validateAudioConfig",
      "zodToFieldConfigs"
    ],
    ["WebhookRouter", "createWebhookRouter"]
  )
  assertTypeExports(
    packageJson.exports["."].types,
    [
      "DeepgramEncodingType",
      "DeepgramSampleRateType",
      "GladiaEncodingType",
      "GladiaSampleRateType",
      "GladiaBitDepthType",
      "AssemblyAIStatusType",
      "AzureStatusType",
      "OpenAIRealtimeAudioFormatType",
      "SpeechmaticsModelType",
      "SpeechmaticsOperatingPointType"
    ],
    "."
  )
  assertTypeConsumerCompiles(".")
  await verifyEntrypoint("./webhooks", [
    "WebhookRouter",
    "createWebhookRouter",
    "GladiaWebhookHandler",
    "AssemblyAIWebhookHandler"
  ])
  await verifyEntrypoint("./constants", [
    "DeepgramEncoding",
    "GladiaEncoding",
    "OpenAIModel",
    "SpeechmaticsModel",
    "SpeechmaticsOperatingPoint"
  ])
  await verifyEntrypoint("./field-configs", [
    "GladiaTranscriptionSchema",
    "getDeepgramTranscriptionFields"
  ])
  await verifyEntrypoint("./field-metadata", ["GLADIA_TRANSCRIPTION_FIELDS", "PROVIDER_FIELDS"])
  await verifyEntrypoint("./field-equivalences", ["FIELD_EQUIVALENCES", "getEquivalentField"])
  await verifyEntrypoint("./provider-metadata", [
    "ProviderCapabilitiesMap",
    "ProviderDisplayNames",
    "AllProviders",
    "StreamingProviders",
    "BatchOnlyProviders"
  ])

  console.log("Package entrypoint smoke passed")
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
