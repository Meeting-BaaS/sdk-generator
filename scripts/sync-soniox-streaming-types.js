#!/usr/bin/env node

/**
 * Sync Soniox Streaming Types
 * Generates local TypeScript + Zod schemas from the official Soniox Web SDK.
 *
 * Source of truth:
 * - npm package: @soniox/speech-to-text-web
 * - declarations: dist/types.d.ts, dist/state.d.ts, dist/errors.d.ts, dist/soniox-client.d.ts
 *
 * This is not OpenAPI-generated because Soniox does not publish an official
 * realtime AsyncAPI/OpenAPI spec for their WebSocket protocol.
 */

const fs = require("fs")
const os = require("os")
const path = require("path")
const https = require("https")
const { execFileSync } = require("child_process")

const PACKAGE_NAME = "@soniox/speech-to-text-web"
const REGISTRY_URL = `https://registry.npmjs.org/${PACKAGE_NAME}/latest`

const SPEC_OUTPUT = path.join(__dirname, "../specs/soniox-streaming-types.ts")
const OUTPUT_DIR = path.join(__dirname, "../src/generated/soniox")
const STREAMING_ZOD_OUTPUT = path.join(OUTPUT_DIR, "streaming-types.zod.ts")
const SONIOX_MODELS_SOURCE = path.join(__dirname, "../src/generated/soniox/models.ts")

const CURATED_AUDIO_FORMATS = [
  "auto",
  "aac",
  "aiff",
  "amr",
  "asf",
  "flac",
  "mp3",
  "ogg",
  "wav",
  "webm",
  "pcm_s8",
  "pcm_s16le",
  "pcm_s16be",
  "pcm_s24le",
  "pcm_s24be",
  "pcm_s32le",
  "pcm_s32be",
  "pcm_u8",
  "pcm_u16le",
  "pcm_u16be",
  "pcm_u24le",
  "pcm_u24be",
  "pcm_u32le",
  "pcm_u32be",
  "pcm_f32le",
  "pcm_f32be",
  "pcm_f64le",
  "pcm_f64be",
  "mulaw",
  "alaw"
]

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchJson(res.headers.location).then(resolve, reject)
          return
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
          return
        }

        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () => {
          try {
            resolve(JSON.parse(data))
          } catch (error) {
            reject(error)
          }
        })
        res.on("error", reject)
      })
      .on("error", reject)
  })
}

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath)

    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close()
          fs.rmSync(outputPath, { force: true })
          downloadFile(res.headers.location, outputPath).then(resolve, reject)
          return
        }

        if (res.statusCode !== 200) {
          file.close()
          fs.rmSync(outputPath, { force: true })
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
          return
        }

        res.pipe(file)
        file.on("finish", () => {
          file.close()
          resolve()
        })
      })
      .on("error", (error) => {
        file.close()
        fs.rmSync(outputPath, { force: true })
        reject(error)
      })
  })
}

function extractSingle(content, pattern, label) {
  const match = content.match(pattern)
  if (!match) {
    throw new Error(`Failed to extract ${label} from SDK declarations`)
  }
  return match[1].trim()
}

function indentBlock(block, spaces) {
  const prefix = " ".repeat(spaces)
  return block
    .split("\n")
    .map((line) => (line.length > 0 ? `${prefix}${line}` : line))
    .join("\n")
}

function getAudioOptionType(audioOptionsBlock, propertyName) {
  const escaped = propertyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = new RegExp(`${escaped}\\??:\\s*([^;]+);`)
  return extractSingle(audioOptionsBlock, pattern, `AudioOptions.${propertyName}`)
}

function parseRecorderStates(stateContent) {
  const tuple = extractSingle(
    stateContent,
    /declare const recorderStates: readonly \[([\s\S]*?)\];/,
    "RecorderState tuple"
  )

  return tuple
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
}

function parseRealtimeModelCodes() {
  const modelsSource = fs.readFileSync(SONIOX_MODELS_SOURCE, "utf-8")
  const match = modelsSource.match(
    /export const SonioxRealtimeModelCodes = \[([\s\S]*?)\] as const/
  )
  if (!match) {
    throw new Error("Failed to extract SonioxRealtimeModelCodes from generated models")
  }

  return match[1]
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
}

function buildSpecFile({
  version,
  requestTypes,
  contextType,
  translationConfigType,
  translationStatusType,
  tokenBody,
  responseBody,
  recorderStates,
  errorStatusType,
  realtimeModels,
  audioFormats
}) {
  const recorderStateUnion = recorderStates.join("\n  | ")
  const realtimeModelUnion = realtimeModels.join("\n  | ")
  const audioFormatUnion = audioFormats.join("\n  | ")

  return `/**
 * Soniox Streaming Types
 * AUTO-GENERATED FROM OFFICIAL SDK - DO NOT EDIT MANUALLY
 *
 * @source npm:${PACKAGE_NAME}
 * @version ${version}
 * @see https://soniox.com/docs/stt/SDKs/web-sdk
 *
 * Generated by: scripts/sync-soniox-streaming-types.js
 *
 * Notes:
 * - Request shapes are derived from the SDK's public \`AudioOptions\` type.
 * - Response shapes are derived from \`SpeechToTextAPIResponse\` and related SDK types.
 * - \`model\` is enriched from src/generated/soniox/models.ts so realtime model
 *   select options/autocomplete remain available.
 * - \`audioFormat\` is enriched from the curated Soniox audio format list used by the SDK adapter.
 */

// =============================================================================
// Audio Format Types
// =============================================================================

/**
 * Audio format for the streamed audio.
 */
export type AudioFormat =
  | ${audioFormatUnion}

// =============================================================================
// Translation Configuration Types
// =============================================================================

/**
 * Translation configuration
 */
export type TranslationConfig = ${translationConfigType}

// =============================================================================
// Context Configuration Types
// =============================================================================

/**
 * Additional context to improve transcription accuracy
 */
export type Context = ${contextType}

// =============================================================================
// Real-time Model Types
// =============================================================================

/**
 * Real-time model identifier.
 */
export type RealtimeModelId =
  | ${realtimeModelUnion}

// =============================================================================
// WebSocket API Request Types
// =============================================================================

/**
 * Parameters for initiating a real-time transcription session
 * @source AudioOptions from ${PACKAGE_NAME}
 */
export interface StreamingTranscriberParams {
  model: RealtimeModelId
  audioFormat?: AudioFormat
  sampleRate?: ${requestTypes.sampleRate}
  numChannels?: ${requestTypes.numChannels}
  languageHints?: ${requestTypes.languageHints}
  context?: Context
  enableSpeakerDiarization?: ${requestTypes.enableSpeakerDiarization}
  enableLanguageIdentification?: ${requestTypes.enableLanguageIdentification}
  enableEndpointDetection?: ${requestTypes.enableEndpointDetection}
  translation?: TranslationConfig
  clientReferenceId?: ${requestTypes.clientReferenceId}
}

// =============================================================================
// WebSocket API Response Types
// =============================================================================

/**
 * Translation status for tokens
 */
export type TranslationStatus = ${translationStatusType}

/**
 * Individual token in a transcription result
 * @source Token from ${PACKAGE_NAME}
 */
export interface Token {
${indentBlock(tokenBody, 2)}
}

/**
 * Real-time transcription response
 * @source SpeechToTextAPIResponse from ${PACKAGE_NAME}
 */
export interface StreamingResponse {
${indentBlock(responseBody, 2)}
}

// =============================================================================
// Client State Types
// =============================================================================

/**
 * Recorder/client states
 * @source RecorderState from ${PACKAGE_NAME}
 */
export type RecorderState =
  | ${recorderStateUnion}

/**
 * Error status types
 * @source ErrorStatus from ${PACKAGE_NAME}
 */
export type ErrorStatus = ${errorStatusType}
`
}

function buildZodFile({ version, recorderStates, errorStatusType }) {
  const recorderStateValues = recorderStates.join(",\n  ")
  const errorStatusValues = errorStatusType
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean)
    .join(", ")
  const realtimeModelValues = parseRealtimeModelCodes().join(",\n  ")
  const audioFormatValues = CURATED_AUDIO_FORMATS.map((value) => JSON.stringify(value)).join(
    ",\n  "
  )

  return `/**
 * Soniox Streaming Zod Schemas
 * AUTO-GENERATED from official SDK declarations - DO NOT EDIT MANUALLY
 *
 * @source npm:${PACKAGE_NAME}
 * @version ${version}
 * @see https://soniox.com/docs/stt/SDKs/web-sdk
 *
 * Regenerate with: pnpm openapi:sync-soniox-streaming
 */

import { z as zod } from "zod"

// =============================================================================
// Audio Format Schemas
// =============================================================================

/**
 * Audio format for the streamed audio.
 */
export const sonioxAudioFormatSchema = zod.enum([
  ${audioFormatValues}
])

// =============================================================================
// Translation Configuration Schemas
// =============================================================================

export const sonioxOneWayTranslationSchema = zod.object({
  type: zod.literal("one_way"),
  target_language: zod.string()
})

export const sonioxTwoWayTranslationSchema = zod.object({
  type: zod.literal("two_way"),
  language_a: zod.string(),
  language_b: zod.string()
})

export const sonioxTranslationConfigSchema = zod.union([
  sonioxOneWayTranslationSchema,
  sonioxTwoWayTranslationSchema
])

// =============================================================================
// Context Configuration Schemas
// =============================================================================

export const sonioxContextGeneralItemSchema = zod.object({
  key: zod.string(),
  value: zod.string()
})

export const sonioxTranslationTermSchema = zod.object({
  source: zod.string(),
  target: zod.string()
})

export const sonioxStructuredContextSchema = zod.object({
  general: zod.array(sonioxContextGeneralItemSchema).optional(),
  text: zod.string().optional(),
  terms: zod.array(zod.string()).optional(),
  translation_terms: zod
    .array(sonioxTranslationTermSchema)
    .optional()
})

export const sonioxContextSchema = zod.union([
  sonioxStructuredContextSchema,
  zod.string()
])

// =============================================================================
// Real-time Model Schema
// =============================================================================

/**
 * Real-time model identifier.
 */
export const sonioxRealtimeModelSchema = zod.enum([
  ${realtimeModelValues}
])

// =============================================================================
// Streaming Transcriber Params Schema
// =============================================================================

export const streamingTranscriberParams = zod.object({
  model: sonioxRealtimeModelSchema,
  audioFormat: sonioxAudioFormatSchema.optional(),
  sampleRate: zod.number().optional(),
  numChannels: zod.number().optional(),
  languageHints: zod.array(zod.string()).optional(),
  context: sonioxContextSchema.optional(),
  enableSpeakerDiarization: zod.boolean().optional(),
  enableLanguageIdentification: zod.boolean().optional(),
  enableEndpointDetection: zod.boolean().optional(),
  translation: sonioxTranslationConfigSchema.optional(),
  clientReferenceId: zod.string().optional()
})

// =============================================================================
// Token and Response Schemas
// =============================================================================

export const sonioxTranslationStatusSchema = zod.enum([${errorStatusValues.includes('"none"') ? "" : ""}"original", "translation", "none"])

export const sonioxTokenSchema = zod.object({
  text: zod.string(),
  start_ms: zod.number().optional(),
  end_ms: zod.number().optional(),
  confidence: zod.number(),
  is_final: zod.boolean(),
  speaker: zod.string().optional(),
  translation_status: sonioxTranslationStatusSchema.optional(),
  language: zod.string().optional(),
  source_language: zod.string().optional()
})

export const sonioxStreamingResponseSchema = zod.object({
  text: zod.string(),
  tokens: zod.array(sonioxTokenSchema),
  final_audio_proc_ms: zod.number(),
  total_audio_proc_ms: zod.number(),
  finished: zod.boolean().optional(),
  error_code: zod.number().optional(),
  error_message: zod.string().optional()
})

// =============================================================================
// Client State Schemas
// =============================================================================

export const sonioxRecorderStateSchema = zod.enum([
  ${recorderStateValues}
])

export const sonioxErrorStatusSchema = zod.enum([${errorStatusValues}])

// =============================================================================
// Mid-session Update Params (placeholder - Soniox doesn't support mid-session updates)
// =============================================================================

export const streamingUpdateConfigParams = zod.object({})
`
}

async function loadSdkDeclarations() {
  const metadata = await fetchJson(REGISTRY_URL)
  if (!metadata?.dist?.tarball) {
    throw new Error(`No tarball found in npm metadata for ${PACKAGE_NAME}`)
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "soniox-streaming-sdk-"))
  const tarballPath = path.join(tempDir, "sdk.tgz")
  const extractDir = path.join(tempDir, "extract")
  fs.mkdirSync(extractDir, { recursive: true })

  try {
    await downloadFile(metadata.dist.tarball, tarballPath)
    execFileSync("tar", ["-xzf", tarballPath, "-C", extractDir])

    const pkgDir = path.join(extractDir, "package", "dist")
    return {
      version: metadata.version,
      types: fs.readFileSync(path.join(pkgDir, "types.d.ts"), "utf-8"),
      state: fs.readFileSync(path.join(pkgDir, "state.d.ts"), "utf-8"),
      errors: fs.readFileSync(path.join(pkgDir, "errors.d.ts"), "utf-8"),
      client: fs.readFileSync(path.join(pkgDir, "soniox-client.d.ts"), "utf-8")
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

async function main() {
  try {
    console.log(`📥 Syncing Soniox streaming types from ${PACKAGE_NAME}...`)

    const sdk = await loadSdkDeclarations()

    const contextType = extractSingle(
      sdk.types,
      /export type Context = ([\s\S]*?);\nexport type TranslationConfig/,
      "Context"
    )
    const translationConfigType = extractSingle(
      sdk.types,
      /export type TranslationConfig = ([\s\S]*?);\nexport type TranslationStatus/,
      "TranslationConfig"
    )
    const translationStatusType = extractSingle(
      sdk.types,
      /export type TranslationStatus = ([^;]+);/,
      "TranslationStatus"
    )
    const tokenBody = extractSingle(sdk.types, /export interface Token \{([\s\S]*?)\n\}/, "Token")
    const responseBody = extractSingle(
      sdk.types,
      /export interface SpeechToTextAPIResponse \{([\s\S]*?)\n\}/,
      "SpeechToTextAPIResponse"
    )
    const recorderStates = parseRecorderStates(sdk.state)
    const errorStatusType = extractSingle(
      sdk.errors,
      /export type ErrorStatus = ([^;]+);/,
      "ErrorStatus"
    )

    const audioOptionsBlock = extractSingle(
      sdk.client,
      /type AudioOptions = \{([\s\S]*?)\n\} & Callbacks;/,
      "AudioOptions"
    )

    const requestTypes = {
      model: getAudioOptionType(audioOptionsBlock, "model"),
      languageHints: getAudioOptionType(audioOptionsBlock, "languageHints"),
      context: getAudioOptionType(audioOptionsBlock, "context"),
      enableSpeakerDiarization: getAudioOptionType(audioOptionsBlock, "enableSpeakerDiarization"),
      enableLanguageIdentification: getAudioOptionType(
        audioOptionsBlock,
        "enableLanguageIdentification"
      ),
      enableEndpointDetection: getAudioOptionType(audioOptionsBlock, "enableEndpointDetection"),
      translation: getAudioOptionType(audioOptionsBlock, "translation"),
      audioFormat: getAudioOptionType(audioOptionsBlock, "audioFormat"),
      sampleRate: getAudioOptionType(audioOptionsBlock, "sampleRate"),
      numChannels: getAudioOptionType(audioOptionsBlock, "numChannels"),
      clientReferenceId: getAudioOptionType(audioOptionsBlock, "clientReferenceId")
    }
    const realtimeModels = parseRealtimeModelCodes()

    const specContent = buildSpecFile({
      version: sdk.version,
      requestTypes,
      contextType,
      translationConfigType,
      translationStatusType,
      tokenBody,
      responseBody,
      recorderStates,
      errorStatusType,
      realtimeModels,
      audioFormats: CURATED_AUDIO_FORMATS.map((value) => JSON.stringify(value))
    })

    const zodContent = buildZodFile({
      version: sdk.version,
      recorderStates,
      errorStatusType
    })

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    }

    fs.writeFileSync(SPEC_OUTPUT, specContent)
    fs.writeFileSync(STREAMING_ZOD_OUTPUT, zodContent)

    console.log(`  ✅ Wrote ${path.relative(process.cwd(), SPEC_OUTPUT)}`)
    console.log(`  ✅ Wrote ${path.relative(process.cwd(), STREAMING_ZOD_OUTPUT)}`)
    console.log("✅ Soniox streaming types synced from official SDK")
  } catch (error) {
    console.error("❌ Failed to sync Soniox streaming types:", error.message)
    process.exit(1)
  }
}

main()
