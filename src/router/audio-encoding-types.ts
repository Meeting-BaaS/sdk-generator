/**
 * Unified audio encoding types for Voice Router SDK
 *
 * These types provide strict typing for audio formats across all providers,
 * preventing common bugs like passing unsupported encoding formats.
 */

/**
 * Unified audio encoding formats supported across providers
 *
 * - `linear16`: PCM 16-bit linear (universal support)
 * - `mulaw`: μ-law 8-bit (Gladia, Deepgram)
 * - `alaw`: A-law 8-bit (Gladia only)
 * - `flac`: FLAC codec (Deepgram only)
 * - `opus`: Opus codec (Deepgram only)
 * - `speex`: Speex codec (Deepgram only)
 * - `amr-nb`: AMR narrowband (Deepgram only)
 * - `amr-wb`: AMR wideband (Deepgram only)
 * - `g729`: G.729 codec (Deepgram only)
 */
export type AudioEncoding =
  // Universal - supported by most providers
  | "linear16"
  // μ-law and A-law - telephony codecs
  | "mulaw"
  | "alaw"
  // Advanced codecs - Deepgram specific
  | "flac"
  | "opus"
  | "speex"
  | "amr-nb"
  | "amr-wb"
  | "g729"

/**
 * Standard sample rates (Hz) for audio streaming
 */
export type AudioSampleRate = 8000 | 16000 | 32000 | 44100 | 48000

/**
 * Standard bit depths for PCM audio
 */
export type AudioBitDepth = 8 | 16 | 24 | 32

/**
 * Audio channel configurations
 */
export type AudioChannels = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

const SUPPORTED_AUDIO_CHANNELS = [
  1, 2, 3, 4, 5, 6, 7, 8
] as const satisfies readonly AudioChannels[]

const SUPPORTED_AUDIO_BIT_DEPTHS = [8, 16, 24, 32] as const satisfies readonly AudioBitDepth[]

/**
 * Provider-specific encoding format mappings
 *
 * Each provider may have different names for the same codec.
 * These mappings translate between unified format and provider format.
 */
export interface EncodingMapping {
  /** Unified encoding format */
  unified: AudioEncoding
  /** Provider-specific encoding string */
  provider: string
}

/**
 * Gladia encoding mappings
 * Gladia uses "wav/xxx" format for streaming
 */
export const GLADIA_ENCODING_MAP: Readonly<Record<string, string>> = Object.freeze({
  linear16: "wav/pcm",
  mulaw: "wav/ulaw",
  alaw: "wav/alaw"
})

/**
 * Deepgram encoding mappings
 * Deepgram uses lowercase format names
 */
export const DEEPGRAM_ENCODING_MAP: Readonly<Record<string, string>> = Object.freeze({
  linear16: "linear16",
  mulaw: "mulaw",
  flac: "flac",
  opus: "opus",
  speex: "speex",
  "amr-nb": "amr-nb",
  "amr-wb": "amr-wb",
  g729: "g729"
})

/**
 * AssemblyAI encoding mappings
 * AssemblyAI uses pcm_s16le for streaming
 */
export const ASSEMBLYAI_ENCODING_MAP: Readonly<Record<string, string>> = Object.freeze({
  linear16: "pcm_s16le"
})

type EncodingProvider = "gladia" | "deepgram" | "assemblyai"

const SUPPORTED_ENCODING_PROVIDERS = ["gladia", "deepgram", "assemblyai"] as const

const ENCODING_MAPS: Record<EncodingProvider, Readonly<Record<string, string>>> = {
  gladia: GLADIA_ENCODING_MAP,
  deepgram: DEEPGRAM_ENCODING_MAP,
  assemblyai: ASSEMBLYAI_ENCODING_MAP
}

function requireEncodingProvider(provider: unknown): EncodingProvider {
  if (
    typeof provider !== "string" ||
    !SUPPORTED_ENCODING_PROVIDERS.includes(provider as EncodingProvider)
  ) {
    throw new Error(
      `Encoding provider '${formatRuntimeValue(provider)}' is not supported. Supported providers: ${SUPPORTED_ENCODING_PROVIDERS.join(", ")}`
    )
  }

  return provider as EncodingProvider
}

function formatSupportedValues(values: readonly number[]): string {
  return values.join(", ")
}

function formatRuntimeValue(value: unknown): string {
  try {
    return String(value)
  } catch {
    try {
      return Object.prototype.toString.call(value)
    } catch {
      return "<unprintable value>"
    }
  }
}

function hasOwnKey(record: object, key: PropertyKey): boolean {
  const ownKey = typeof key === "number" ? String(key) : key
  return Reflect.ownKeys(record).includes(ownKey)
}

function getOwnDataProperty(
  record: object,
  key: PropertyKey
): { present: boolean; value: unknown } {
  const descriptor = Object.getOwnPropertyDescriptor(record, key)

  if (!descriptor || !("value" in descriptor)) {
    return { present: false, value: undefined }
  }

  return { present: true, value: descriptor.value }
}

/**
 * Get provider-specific encoding format from unified format
 *
 * @param unifiedEncoding - Unified encoding format
 * @param provider - Target provider
 * @returns Provider-specific encoding string
 * @throws Error if encoding is not supported by provider
 *
 * @example
 * ```typescript
 * const gladiaEncoding = mapEncodingToProvider('linear16', 'gladia')
 * // Returns: 'wav/pcm'
 *
 * const deepgramEncoding = mapEncodingToProvider('linear16', 'deepgram')
 * // Returns: 'linear16'
 * ```
 */
export function mapEncodingToProvider(
  unifiedEncoding: AudioEncoding,
  provider: EncodingProvider
): string {
  const validProvider = requireEncodingProvider(provider)
  const mapping = ENCODING_MAPS[validProvider]

  if (typeof unifiedEncoding !== "string" || !hasOwnKey(mapping, unifiedEncoding)) {
    throw new Error(
      `Encoding '${formatRuntimeValue(unifiedEncoding)}' is not supported by ${validProvider}. ` +
        `Supported encodings: ${Object.keys(mapping).join(", ")}`
    )
  }

  return mapping[unifiedEncoding]
}

/**
 * Validate audio configuration for a specific provider
 *
 * @param config - Audio configuration to validate
 * @param provider - Target provider
 * @throws Error if configuration is invalid for the provider
 */
export function validateAudioConfig(
  config: {
    encoding?: AudioEncoding
    sampleRate?: AudioSampleRate | number
    channels?: AudioChannels | number
    bitDepth?: AudioBitDepth | number
  },
  provider: EncodingProvider
): void {
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    throw new Error("Audio config must be an object")
  }

  const validProvider = requireEncodingProvider(provider)
  const configRecord = config as Record<string, unknown>
  const encodingConfig = getOwnDataProperty(configRecord, "encoding")
  const sampleRateConfig = getOwnDataProperty(configRecord, "sampleRate")
  const bitDepthConfig = getOwnDataProperty(configRecord, "bitDepth")
  const channelsConfig = getOwnDataProperty(configRecord, "channels")
  const { present: hasEncoding, value: encoding } = encodingConfig
  const { present: hasSampleRate, value: sampleRate } = sampleRateConfig
  const { present: hasBitDepth, value: bitDepth } = bitDepthConfig
  const { present: hasChannels, value: channels } = channelsConfig

  if (
    hasSampleRate &&
    sampleRate !== undefined &&
    (typeof sampleRate !== "number" || !Number.isInteger(sampleRate) || sampleRate <= 0)
  ) {
    throw new Error("Sample rate must be a positive integer")
  }

  if (
    hasBitDepth &&
    bitDepth !== undefined &&
    (typeof bitDepth !== "number" ||
      !SUPPORTED_AUDIO_BIT_DEPTHS.includes(bitDepth as AudioBitDepth))
  ) {
    throw new Error(
      `Bit depth must be one of: ${formatSupportedValues(SUPPORTED_AUDIO_BIT_DEPTHS)}`
    )
  }

  if (hasEncoding && encoding !== undefined) {
    // This will throw if encoding is not supported
    mapEncodingToProvider(encoding as AudioEncoding, validProvider)
  }

  if (hasChannels && channels !== undefined) {
    if (
      typeof channels !== "number" ||
      !Number.isInteger(channels) ||
      !SUPPORTED_AUDIO_CHANNELS.includes(channels as AudioChannels)
    ) {
      if (validProvider === "gladia") {
        throw new Error("Gladia supports 1-8 audio channels")
      }
      throw new Error(
        `Audio channels must be one of: ${formatSupportedValues(SUPPORTED_AUDIO_CHANNELS)}`
      )
    }
  }

  if (
    validProvider === "assemblyai" &&
    hasEncoding &&
    encoding !== undefined &&
    encoding !== "linear16"
  ) {
    throw new Error("AssemblyAI streaming only supports linear16 encoding")
  }
}
