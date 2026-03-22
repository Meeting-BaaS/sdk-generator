export * from "./openai-whisper"
/**
 * OpenAI Whisper transcription provider adapter
 * Documentation: https://platform.openai.com/docs/guides/speech-to-text
 */

import type {
  AudioInput,
  ProviderCapabilities,
  StreamingCallbacks,
  StreamingOptions,
  StreamingSession,
  TranscribeOptions,
  UnifiedTranscriptResponse
} from "../router/types"
import { BaseAdapter, type ProviderConfig } from "./base-adapter"
import { getProviderEndpoints } from "./provider-endpoints"
import {
  selectOpenAIModel,
  mapToTranscriptionRequest,
  mapFromOpenAIResponse
} from "./mappers/openai-whisper-mappers"

// Import generated API client function - FULL TYPE SAFETY!
import { createTranscription } from "../generated/openai/api/openAIAudioRealtimeAPI"

// Import OpenAI generated types (all from official Stainless-hosted spec)
import type { CreateTranscriptionRequestModel } from "../generated/openai/schema/createTranscriptionRequestModel"

// Import model and response format constants (derived from official spec)
import { OpenAIModel } from "../constants"
import {
  createOpenAIRealtimeSession,
  loadOpenAIAudioInput
} from "./helpers/openai-whisper-helpers"

/**
 * OpenAI Whisper transcription provider adapter
 *
 * Implements transcription for OpenAI's Whisper and GPT-4o transcription models with support for:
 * - Multiple model options: whisper-1, gpt-4o-transcribe, gpt-4o-mini-transcribe, gpt-4o-transcribe-diarize
 * - Speaker diarization (with gpt-4o-transcribe-diarize model)
 * - Word-level timestamps
 * - Multi-language support
 * - Prompt-based style guidance
 * - Known speaker references for improved diarization
 * - Temperature control for output randomness
 *
 * @see https://platform.openai.com/docs/guides/speech-to-text OpenAI Speech-to-Text Documentation
 * @see https://platform.openai.com/docs/api-reference/audio OpenAI Audio API Reference
 *
 * @example Basic transcription
 * ```typescript
 * import { OpenAIWhisperAdapter } from '@meeting-baas/sdk';
 *
 * const adapter = new OpenAIWhisperAdapter();
 * adapter.initialize({
 *   apiKey: process.env.OPENAI_API_KEY
 * });
 *
 * const result = await adapter.transcribe({
 *   type: 'url',
 *   url: 'https://example.com/audio.mp3'
 * }, {
 *   language: 'en'
 * });
 *
 * console.log(result.data.text);
 * ```
 *
 * @example With diarization (speaker identification)
 * ```typescript
 * const result = await adapter.transcribe({
 *   type: 'url',
 *   url: 'https://example.com/meeting.mp3'
 * }, {
 *   language: 'en',
 *   diarization: true,  // Uses gpt-4o-transcribe-diarize model
 *   metadata: {
 *     model: 'gpt-4o-transcribe-diarize'
 *   }
 * });
 *
 * console.log('Speakers:', result.data.speakers);
 * console.log('Utterances:', result.data.utterances);
 * ```
 *
 * @example With word timestamps and custom model
 * ```typescript
 * const result = await adapter.transcribe(audio, {
 *   language: 'en',
 *   wordTimestamps: true,
 *   metadata: {
 *     model: 'gpt-4o-transcribe',  // More accurate than whisper-1
 *     temperature: 0.2,  // Lower temperature for more focused output
 *     prompt: 'Expect technical terminology related to AI and machine learning'
 *   }
 * });
 *
 * console.log('Words:', result.data.words);
 * ```
 *
 * @example With known speakers for improved diarization
 * ```typescript
 * const result = await adapter.transcribe(audio, {
 *   language: 'en',
 *   diarization: true,
 *   metadata: {
 *     model: 'gpt-4o-transcribe-diarize',
 *     knownSpeakerNames: ['customer', 'agent'],
 *     knownSpeakerReferences: [
 *       'data:audio/wav;base64,...',  // Customer voice sample
 *       'data:audio/wav;base64,...'   // Agent voice sample
 *     ]
 *   }
 * });
 *
 * // Speakers will be labeled as 'customer' and 'agent' instead of 'A' and 'B'
 * console.log('Speakers:', result.data.speakers);
 * ```
 */
export class OpenAIWhisperAdapter extends BaseAdapter {
  readonly name = "openai-whisper" as const
  readonly capabilities: ProviderCapabilities = {
    streaming: true, // Via OpenAI Realtime API (WebSocket) - see streaming-types.ts
    diarization: true, // Available with gpt-4o-transcribe-diarize model
    wordTimestamps: true,
    languageDetection: true, // Auto-detects language if not provided (returns in verbose_json)
    customVocabulary: false, // Uses prompt for guidance instead
    summarization: false,
    sentimentAnalysis: false,
    entityDetection: false,
    piiRedaction: false,
    listTranscripts: false, // Synchronous API, no stored transcripts
    deleteTranscript: false
  }

  protected baseUrl: string

  constructor() {
    super()
    const defaults = getProviderEndpoints("openai-whisper")
    this.baseUrl = defaults.api
  }

  /**
   * Get axios config for generated API client functions
   * Configures headers and base URL using Bearer token authorization
   */
  protected getAxiosConfig() {
    return super.getAxiosConfig("Authorization", (apiKey) => `Bearer ${apiKey}`)
  }

  /**
   * Submit audio for transcription
   *
   * OpenAI Whisper API processes audio synchronously and returns results immediately.
   * Supports multiple models with different capabilities:
   * - whisper-1: Open source Whisper V2 model
   * - gpt-4o-transcribe: More accurate GPT-4o based transcription
   * - gpt-4o-mini-transcribe: Faster, cost-effective GPT-4o mini
   * - gpt-4o-transcribe-diarize: GPT-4o with speaker diarization
   *
   * @param audio - Audio input (URL or Buffer)
   * @param options - Transcription options
   * @returns Transcription response with full results
   */
  async transcribe(
    audio: AudioInput,
    options?: TranscribeOptions
  ): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      const audioData = await loadOpenAIAudioInput(audio)
      const model = selectOpenAIModel(options)
      const isDiarization = model === OpenAIModel["gpt-4o-transcribe-diarize"]
      const request = mapToTranscriptionRequest(
        audioData as Buffer,
        options,
        model as CreateTranscriptionRequestModel
      )

      const response = await createTranscription(request, this.getAxiosConfig())

      return mapFromOpenAIResponse(
        response.data as any,
        model as CreateTranscriptionRequestModel,
        isDiarization,
        this.name
      )
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  /**
   * OpenAI Whisper returns results synchronously, so getTranscript is not needed.
   * This method exists for interface compatibility but will return an error.
   */
  async getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse> {
    return {
      success: false,
      provider: this.name,
      error: {
        code: "NOT_SUPPORTED",
        message:
          "OpenAI Whisper processes transcriptions synchronously. Use transcribe() method directly."
      }
    }
  }

  /**
   * Real-time streaming transcription using OpenAI Realtime API
   *
   * Opens a WebSocket connection to OpenAI's Realtime API for live audio transcription.
   * Audio should be sent as PCM16 format (16-bit signed, little-endian).
   *
   * @param options - Streaming options including audio format and VAD settings
   * @param callbacks - Event callbacks for transcription events
   * @returns StreamingSession for sending audio and controlling the session
   *
   * @example
   * ```typescript
   * const session = await adapter.transcribeStream({
   *   sampleRate: 24000,
   *   openaiStreaming: {
   *     model: 'gpt-4o-realtime-preview',
   *     turnDetection: {
   *       type: 'server_vad',
   *       threshold: 0.5,
   *       silenceDurationMs: 500
   *     }
   *   }
   * }, {
   *   onTranscript: (event) => console.log(event.text),
   *   onError: (error) => console.error(error)
   * });
   *
   * // Send audio chunks (PCM16 format)
   * session.sendAudio({ data: audioBuffer });
   *
   * // Close when done
   * await session.close();
   * ```
   */
  async transcribeStream(
    options?: StreamingOptions,
    callbacks?: StreamingCallbacks
  ): Promise<StreamingSession> {
    this.validateConfig()
    return await createOpenAIRealtimeSession({
      apiKey: this.config!.apiKey,
      provider: this.name,
      options,
      callbacks
    })
  }
}

/**
 * Factory function to create an OpenAI Whisper adapter
 */
export function createOpenAIWhisperAdapter(config: ProviderConfig): OpenAIWhisperAdapter {
  const adapter = new OpenAIWhisperAdapter()
  adapter.initialize(config)
  return adapter
}

export * from "./openai-whisper/exports"
