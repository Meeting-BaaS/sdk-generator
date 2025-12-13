/**
 * OpenAI Whisper transcription provider adapter
 * Documentation: https://platform.openai.com/docs/guides/speech-to-text
 */

import axios from "axios"
import type {
  AudioInput,
  ProviderCapabilities,
  TranscribeOptions,
  UnifiedTranscriptResponse
} from "../router/types"
import { BaseAdapter, type ProviderConfig } from "./base-adapter"

// Import generated API client function - FULL TYPE SAFETY!
import { createTranscription } from "../generated/openai/api/openAIAPI"

// Import OpenAI generated types
import type { CreateTranscriptionRequest } from "../generated/openai/schema/createTranscriptionRequest"
import type { CreateTranscriptionResponseVerboseJson } from "../generated/openai/schema/createTranscriptionResponseVerboseJson"
import type { CreateTranscriptionResponseDiarizedJson } from "../generated/openai/schema/createTranscriptionResponseDiarizedJson"
import type { AudioTranscriptionModel } from "../generated/openai/schema/audioTranscriptionModel"

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
    streaming: false, // Synchronous only (no streaming API for transcription)
    diarization: true, // Available with gpt-4o-transcribe-diarize model
    wordTimestamps: true,
    languageDetection: false, // Language should be provided for best accuracy
    customVocabulary: false, // Uses prompt instead
    summarization: false,
    sentimentAnalysis: false,
    entityDetection: false,
    piiRedaction: false
  }

  protected baseUrl = "https://api.openai.com/v1"

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
      // Fetch audio if URL provided
      let audioData: Buffer | Blob
      let fileName = "audio.mp3"

      if (audio.type === "url") {
        const response = await axios.get(audio.url, {
          responseType: "arraybuffer"
        })
        audioData = Buffer.from(response.data)

        // Extract filename from URL if possible
        const urlPath = new URL(audio.url).pathname
        const extractedName = urlPath.split("/").pop()
        if (extractedName) {
          fileName = extractedName
        }
      } else if (audio.type === "file") {
        audioData = audio.file
        fileName = audio.filename || fileName
      } else {
        return {
          success: false,
          provider: this.name,
          error: {
            code: "INVALID_INPUT",
            message: "OpenAI Whisper only supports URL and File audio input (not stream)"
          }
        }
      }

      // Determine model based on options
      const model = this.selectModel(options)

      // Set response format based on requirements
      const isDiarization = model === "gpt-4o-transcribe-diarize"
      const needsWords = options?.wordTimestamps === true

      // Build typed request using generated types
      const request: CreateTranscriptionRequest = {
        file: audioData as any, // Generated type expects Blob
        model: model as AudioTranscriptionModel
      }

      // Add optional parameters
      if (options?.language) {
        request.language = options.language
      }

      if (options?.metadata?.prompt) {
        request.prompt = options.metadata.prompt as string
      }

      if (options?.metadata?.temperature !== undefined) {
        request.temperature = options.metadata.temperature as number
      }

      if (isDiarization) {
        // Diarization model returns diarized_json format
        request.response_format = "diarized_json"

        // Add known speakers if provided
        if (options?.metadata?.knownSpeakerNames) {
          request.known_speaker_names = options.metadata.knownSpeakerNames as string[]
        }

        if (options?.metadata?.knownSpeakerReferences) {
          request.known_speaker_references = options.metadata.knownSpeakerReferences as string[]
        }
      } else if (needsWords || options?.diarization) {
        // Use verbose_json for word timestamps
        request.response_format = "verbose_json"

        // Add timestamp granularities
        if (needsWords) {
          request.timestamp_granularities = ["word", "segment"]
        }
      } else {
        // Simple json format for basic transcription
        request.response_format = "json"
      }

      // Use generated API client function - FULLY TYPED!
      const response = await createTranscription(request, this.getAxiosConfig())

      return this.normalizeResponse(response.data as any, model, isDiarization)
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
   * Select appropriate model based on transcription options
   */
  private selectModel(options?: TranscribeOptions): AudioTranscriptionModel {
    // Use model from metadata if provided
    if (options?.metadata?.model) {
      return options.metadata.model as AudioTranscriptionModel
    }

    // Auto-select based on diarization requirement
    if (options?.diarization) {
      return "gpt-4o-transcribe-diarize"
    }

    // Default to gpt-4o-transcribe (better accuracy than whisper-1)
    return "gpt-4o-transcribe"
  }

  /**
   * Normalize OpenAI response to unified format
   */
  private normalizeResponse(
    response:
      | CreateTranscriptionResponseVerboseJson
      | CreateTranscriptionResponseDiarizedJson
      | { text: string },
    model: AudioTranscriptionModel,
    isDiarization: boolean
  ): UnifiedTranscriptResponse {
    // Handle simple json format
    if ("text" in response && Object.keys(response).length === 1) {
      return {
        success: true,
        provider: this.name,
        data: {
          id: `openai-${Date.now()}`,
          text: response.text,
          status: "completed",
          language: undefined,
          confidence: undefined
        },
        raw: response
      }
    }

    // Handle diarized format
    if (isDiarization && "segments" in response) {
      const diarizedResponse = response as CreateTranscriptionResponseDiarizedJson

      // Extract unique speakers
      const speakerSet = new Set(diarizedResponse.segments.map((seg) => seg.speaker))
      const speakers = Array.from(speakerSet).map((speaker) => ({
        id: speaker,
        label: speaker // Already labeled by OpenAI (A, B, C or custom names)
      }))

      // Build utterances from segments
      const utterances = diarizedResponse.segments.map((segment) => ({
        speaker: segment.speaker,
        text: segment.text,
        start: segment.start,
        end: segment.end,
        confidence: undefined
      }))

      return {
        success: true,
        provider: this.name,
        data: {
          id: `openai-${Date.now()}`,
          text: diarizedResponse.text,
          status: "completed",
          language: undefined,
          duration: diarizedResponse.duration,
          speakers,
          utterances
        },
        raw: response
      }
    }

    // Handle verbose format
    if ("duration" in response && "language" in response) {
      const verboseResponse = response as CreateTranscriptionResponseVerboseJson

      // Extract words if available
      const words = verboseResponse.words?.map((word) => ({
        text: word.word,
        start: word.start,
        end: word.end,
        confidence: undefined
      }))

      return {
        success: true,
        provider: this.name,
        data: {
          id: `openai-${Date.now()}`,
          text: verboseResponse.text,
          status: "completed",
          language: verboseResponse.language,
          duration: verboseResponse.duration,
          words
        },
        raw: response
      }
    }

    // Fallback (shouldn't reach here)
    return {
      success: true,
      provider: this.name,
      data: {
        id: `openai-${Date.now()}`,
        text: "text" in response ? response.text : "",
        status: "completed"
      },
      raw: response
    }
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
