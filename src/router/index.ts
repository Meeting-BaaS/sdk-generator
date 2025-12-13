/**
 * Voice Router - Unified transcription interface
 */

export * from "./types"
export * from "./voice-router"
export * from "./provider-streaming-types"

/**
 * Deepgram Parameter Enums
 * Type-safe enums for Deepgram API options (now properly fixed!)
 *
 * @example Using Deepgram encoding parameter
 * ```typescript
 * import { ListenV1EncodingParameter } from '@meeting-baas/sdk';
 *
 * const options = {
 *   encoding: ListenV1EncodingParameter.linear16,  // ✅ Type-safe!
 *   sampleRate: 16000
 * };
 * ```
 */
export { ListenV1EncodingParameter } from "../generated/deepgram/schema/listenV1EncodingParameter"
export { ListenV1LanguageParameter } from "../generated/deepgram/schema/listenV1LanguageParameter"
export { ListenV1ModelParameter } from "../generated/deepgram/schema/listenV1ModelParameter"
export { ListenV1VersionParameter } from "../generated/deepgram/schema/listenV1VersionParameter"
export { SpeakV1EncodingParameter } from "../generated/deepgram/schema/speakV1EncodingParameter"
export { SpeakV1ContainerParameter } from "../generated/deepgram/schema/speakV1ContainerParameter"
export { SpeakV1SampleRateParameter } from "../generated/deepgram/schema/speakV1SampleRateParameter"

/**
 * Gladia Parameter Enums
 * Type-safe enums for Gladia API options
 *
 * @example Using Gladia streaming encoding
 * ```typescript
 * import { StreamingSupportedEncodingEnum } from '@meeting-baas/sdk';
 *
 * const session = await router.transcribeStream({
 *   provider: 'gladia',
 *   encoding: StreamingSupportedEncodingEnum['wav/pcm'],  // ✅ Type-safe!
 *   sampleRate: 16000
 * });
 * ```
 */
export { StreamingSupportedEncodingEnum } from "../generated/gladia/schema/streamingSupportedEncodingEnum"
export { StreamingSupportedSampleRateEnum } from "../generated/gladia/schema/streamingSupportedSampleRateEnum"
export { StreamingSupportedBitDepthEnum } from "../generated/gladia/schema/streamingSupportedBitDepthEnum"

/**
 * OpenAI Whisper Types
 * Type-safe types for OpenAI Whisper API
 */
export type { AudioTranscriptionModel } from "../generated/openai/schema/audioTranscriptionModel"
export type { AudioResponseFormat } from "../generated/openai/schema/audioResponseFormat"
