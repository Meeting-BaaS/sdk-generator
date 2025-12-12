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
export const GLADIA_ENCODING_MAP: Record<string, string> = {
  linear16: "wav/pcm",
  mulaw: "wav/ulaw",
  alaw: "wav/alaw"
} as const

/**
 * Deepgram encoding mappings
 * Deepgram uses lowercase format names
 */
export const DEEPGRAM_ENCODING_MAP: Record<string, string> = {
  linear16: "linear16",
  mulaw: "mulaw",
  flac: "flac",
  opus: "opus",
  speex: "speex",
  "amr-nb": "amr-nb",
  "amr-wb": "amr-wb",
  g729: "g729"
} as const

/**
 * AssemblyAI encoding mappings
 * AssemblyAI uses pcm_s16le for streaming
 */
export const ASSEMBLYAI_ENCODING_MAP: Record<string, string> = {
  linear16: "pcm_s16le"
} as const

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
  provider: "gladia" | "deepgram" | "assemblyai"
): string {
  let mapping: Record<string, string>

  switch (provider) {
    case "gladia":
      mapping = GLADIA_ENCODING_MAP
      break
    case "deepgram":
      mapping = DEEPGRAM_ENCODING_MAP
      break
    case "assemblyai":
      mapping = ASSEMBLYAI_ENCODING_MAP
      break
  }

  const providerEncoding = mapping[unifiedEncoding]

  if (!providerEncoding) {
    throw new Error(
      `Encoding '${unifiedEncoding}' is not supported by ${provider}. ` +
        `Supported encodings: ${Object.keys(mapping).join(", ")}`
    )
  }

  return providerEncoding
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
    sampleRate?: AudioSampleRate
    channels?: AudioChannels
    bitDepth?: AudioBitDepth
  },
  provider: "gladia" | "deepgram" | "assemblyai"
): void {
  if (config.encoding) {
    // This will throw if encoding is not supported
    mapEncodingToProvider(config.encoding, provider)
  }

  // Provider-specific validations
  if (provider === "gladia") {
    if (config.channels && (config.channels < 1 || config.channels > 8)) {
      throw new Error("Gladia supports 1-8 audio channels")
    }
  }

  if (provider === "assemblyai" && config.encoding && config.encoding !== "linear16") {
    throw new Error("AssemblyAI streaming only supports linear16 encoding")
  }
}
