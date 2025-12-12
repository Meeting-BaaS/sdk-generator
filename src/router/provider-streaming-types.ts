/**
 * Provider-specific streaming option types using OpenAPI-generated schemas
 *
 * These types provide compile-time safety by restricting options to what
 * each provider actually supports according to their OpenAPI specifications.
 */

// Gladia types - from OpenAPI-generated schema
import type { StreamingRequest } from "../generated/gladia/schema/streamingRequest"
import type { StreamingSupportedEncodingEnum } from "../generated/gladia/schema/streamingSupportedEncodingEnum"
import type { StreamingSupportedSampleRateEnum } from "../generated/gladia/schema/streamingSupportedSampleRateEnum"
import type { StreamingSupportedBitDepthEnum } from "../generated/gladia/schema/streamingSupportedBitDepthEnum"
import type { LanguageConfig } from "../generated/gladia/schema/languageConfig"

// Deepgram types - from OpenAPI-generated schema
import type { ListenV1MediaTranscribeParams } from "../generated/deepgram/schema/listenV1MediaTranscribeParams"
import type { ListenV1EncodingParameter } from "../generated/deepgram/schema/listenV1EncodingParameter"
import type { ListenV1LanguageParameter } from "../generated/deepgram/schema/listenV1LanguageParameter"

// Common callback types
import type { StreamingCallbacks } from "./types"

/**
 * Gladia streaming options (from OpenAPI spec)
 *
 * Based on the generated `StreamingRequest` type from Gladia's OpenAPI spec.
 * All supported encodings, sample rates, and bit depths are from the spec.
 */
export interface GladiaStreamingOptions {
  /** Audio encoding format - only Gladia-supported formats */
  encoding?: StreamingSupportedEncodingEnum
  /** Sample rate - only Gladia-supported rates */
  sampleRate?: StreamingSupportedSampleRateEnum
  /** Bit depth - only Gladia-supported depths */
  bitDepth?: StreamingSupportedBitDepthEnum
  /** Number of audio channels (1-8) */
  channels?: number
  /** Endpointing duration in seconds (0.01-10) */
  endpointing?: number
  /** Language configuration */
  languageConfig?: LanguageConfig
  /** Interim/partial results */
  interimResults?: boolean
}

/**
 * Deepgram streaming options (from OpenAPI spec)
 *
 * Based on the generated `ListenV1MediaTranscribeParams` type from Deepgram's OpenAPI spec.
 * All supported options come directly from the spec.
 */
export interface DeepgramStreamingOptions {
  /** Audio encoding format - only Deepgram-supported formats */
  encoding?: ListenV1EncodingParameter
  /** Sample rate in Hz */
  sampleRate?: number
  /** Language code (BCP-47 format) */
  language?: ListenV1LanguageParameter
  /** Enable speaker diarization */
  diarization?: boolean
  /** Enable language detection */
  languageDetection?: boolean
  /** Enable punctuation */
  punctuate?: boolean
  /** Enable smart formatting */
  smartFormat?: boolean
  /** Enable interim results */
  interimResults?: boolean
  /** Callback URL for webhooks */
  webhookUrl?: string
  /** Custom vocabulary/keywords */
  keywords?: string | string[]
  /** Number of audio channels */
  channels?: number
}

/**
 * AssemblyAI streaming options
 *
 * AssemblyAI's streaming API is simpler - it only requires sample_rate.
 * Note: AssemblyAI only supports PCM16 encoding for streaming.
 */
export interface AssemblyAIStreamingOptions {
  /** Sample rate in Hz (8000 or 16000 recommended) */
  sampleRate?: 8000 | 16000 | 22050 | 44100 | 48000
  /** Enable word-level timestamps */
  wordTimestamps?: boolean
}

/**
 * Union of all provider-specific streaming options
 */
export type ProviderStreamingOptions =
  | ({ provider: "gladia" } & GladiaStreamingOptions)
  | ({ provider: "deepgram" } & DeepgramStreamingOptions)
  | ({ provider: "assemblyai" } & AssemblyAIStreamingOptions)

/**
 * Type-safe streaming options for a specific provider
 */
export type StreamingOptionsForProvider<P extends "gladia" | "deepgram" | "assemblyai"> =
  P extends "gladia"
    ? GladiaStreamingOptions
    : P extends "deepgram"
      ? DeepgramStreamingOptions
      : P extends "assemblyai"
        ? AssemblyAIStreamingOptions
        : never

/**
 * Type-safe transcribeStream parameters for a specific provider
 */
export interface TranscribeStreamParams<P extends "gladia" | "deepgram" | "assemblyai"> {
  /** Streaming options specific to this provider */
  options?: StreamingOptionsForProvider<P> & { provider: P }
  /** Event callbacks */
  callbacks?: StreamingCallbacks
}
