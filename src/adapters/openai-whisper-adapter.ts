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
import { createTranscription } from "../generated/openai/api/openAIAudioAPI"

// Import OpenAI generated types
import type { CreateTranscriptionRequest } from "../generated/openai/schema/createTranscriptionRequest"
import type { CreateTranscriptionResponseVerboseJson } from "../generated/openai/schema/createTranscriptionResponseVerboseJson"
import type { CreateTranscriptionRequestModel } from "../generated/openai/schema/createTranscriptionRequestModel"

/**
 * Diarized response type for speaker-labeled transcription
 * Note: This extends the verbose JSON format with speaker information
 * The official OpenAI spec doesn't include this yet, but the API supports it
 */
interface DiarizedSegment {
  id: number
  start: number
  end: number
  text: string
  speaker: string
}

interface CreateTranscriptionResponseDiarizedJson {
  task: string
  language: string
  duration: number
  text: string
  segments: DiarizedSegment[]
}

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
    languageDetection: false, // Language should be provided for best accuracy
    customVocabulary: false, // Uses prompt instead
    summarization: false,
    sentimentAnalysis: false,
    entityDetection: false,
    piiRedaction: false,
    listTranscripts: false, // Synchronous API, no stored transcripts
    deleteTranscript: false
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
      // Start with provider-specific options (fully typed from OpenAPI)
      const request: CreateTranscriptionRequest = {
        ...options?.openai,
        file: audioData as any, // Generated type expects Blob
        model: model as CreateTranscriptionRequestModel
      }

      // Map normalized options (take precedence over openai-specific)
      if (options?.language) {
        request.language = options.language
      }

      if (isDiarization) {
        // Diarization model uses verbose_json format with speaker info
        request.response_format = "verbose_json"
      } else if (needsWords || options?.diarization) {
        // Use verbose_json for word timestamps
        request.response_format = "verbose_json"

        // Add timestamp granularities (using the OpenAPI array-style property name)
        if (needsWords) {
          ;(request as any)["timestamp_granularities[]"] = ["word", "segment"]
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
  private selectModel(options?: TranscribeOptions): CreateTranscriptionRequestModel {
    // Use model from normalized options if provided
    if (options?.model) {
      return options.model as CreateTranscriptionRequestModel
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
    model: CreateTranscriptionRequestModel,
    isDiarization: boolean
  ): UnifiedTranscriptResponse {
    // Handle simple json format
    if ("text" in response && Object.keys(response).length === 1) {
      const requestId = `openai-${Date.now()}`
      return {
        success: true,
        provider: this.name,
        data: {
          id: requestId,
          text: response.text,
          status: "completed",
          language: undefined,
          confidence: undefined
        },
        extended: {},
        tracking: {
          requestId
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

      const requestId = `openai-${Date.now()}`
      return {
        success: true,
        provider: this.name,
        data: {
          id: requestId,
          text: diarizedResponse.text,
          status: "completed",
          language: undefined,
          duration: diarizedResponse.duration,
          speakers,
          utterances
        },
        extended: {},
        tracking: {
          requestId
        },
        raw: response
      }
    }

    // Handle verbose format
    if ("duration" in response && "language" in response) {
      const verboseResponse = response as CreateTranscriptionResponseVerboseJson

      // Extract words if available
      const words = verboseResponse.words?.map((w) => ({
        word: w.word,
        start: w.start,
        end: w.end,
        confidence: undefined
      }))

      const requestId = `openai-${Date.now()}`
      return {
        success: true,
        provider: this.name,
        data: {
          id: requestId,
          text: verboseResponse.text,
          status: "completed",
          language: verboseResponse.language,
          duration: verboseResponse.duration,
          words
        },
        extended: {},
        tracking: {
          requestId
        },
        raw: response
      }
    }

    // Fallback (shouldn't reach here)
    const requestId = `openai-${Date.now()}`
    return {
      success: true,
      provider: this.name,
      data: {
        id: requestId,
        text: "text" in response ? response.text : "",
        status: "completed"
      },
      extended: {},
      tracking: {
        requestId
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

// ─────────────────────────────────────────────────────────────────────────────
// Re-export generated types for direct SDK access
// ─────────────────────────────────────────────────────────────────────────────

// API client function
export { createTranscription } from "../generated/openai/api/openAIAudioAPI"

// Request/Response types
export type {
  CreateTranscriptionRequest,
  CreateTranscriptionResponseVerboseJson,
  CreateTranscriptionRequestModel
}

// Local diarization type (not in official spec yet)
export type { CreateTranscriptionResponseDiarizedJson }
