/**
 * Azure Speech-to-Text transcription provider adapter
 * Documentation: https://learn.microsoft.com/azure/cognitive-services/speech-service/
 */

import axios from "axios"
import type {
  AudioInput,
  ProviderCapabilities,
  TranscribeOptions,
  UnifiedTranscriptResponse
} from "../router/types"
import { BaseAdapter, type ProviderConfig } from "./base-adapter"

// Import generated API client functions - FULL TYPE SAFETY!
import {
  transcriptionsCreate,
  transcriptionsGet,
  transcriptionsDelete,
  transcriptionsListFiles
} from "../generated/azure/api/speechServicesAPIV31"

// Import Azure generated types
import type { Transcription } from "../generated/azure/schema/transcription"
import type { TranscriptionProperties } from "../generated/azure/schema/transcriptionProperties"

/**
 * Azure Speech-to-Text transcription provider adapter
 *
 * Implements transcription for Azure Cognitive Services Speech API with support for:
 * - Batch transcription (async processing)
 * - Speaker diarization (identifying different speakers)
 * - Multi-language support
 * - Custom models and acoustic models
 * - Word-level timestamps
 * - Profanity filtering
 * - Punctuation and capitalization
 *
 * @see https://learn.microsoft.com/azure/cognitive-services/speech-service/ Azure Speech Documentation
 *
 * @example Basic transcription
 * ```typescript
 * import { AzureSTTAdapter } from '@meeting-baas/sdk';
 *
 * const adapter = new AzureSTTAdapter();
 * adapter.initialize({
 *   apiKey: process.env.AZURE_SPEECH_KEY,
 *   region: 'eastus' // Your Azure region
 * });
 *
 * const result = await adapter.transcribe({
 *   type: 'url',
 *   url: 'https://example.com/audio.mp3'
 * }, {
 *   language: 'en-US',
 *   diarization: true
 * });
 *
 * console.log(result.data.text);
 * ```
 *
 * @example With custom model
 * ```typescript
 * const result = await adapter.transcribe(audio, {
 *   language: 'en-US',
 *   diarization: true,
 *   metadata: {
 *     modelId: 'custom-model-id'
 *   }
 * });
 * ```
 *
 * @example Async transcription with polling (Azure always returns job ID)
 * ```typescript
 * // Submit transcription (Azure is always async)
 * const result = await adapter.transcribe({
 *   type: 'url',
 *   url: 'https://example.com/audio.mp3'
 * }, {
 *   language: 'en-US',
 *   diarization: true
 * });
 *
 * // Get transcription ID for polling
 * const transcriptionId = result.data?.id;
 * console.log('Transcription ID:', transcriptionId);
 *
 * // Poll for completion
 * const poll = async () => {
 *   const status = await adapter.getTranscript(transcriptionId);
 *   if (status.data?.status === 'completed') {
 *     console.log('Transcript:', status.data.text);
 *   } else if (status.data?.status === 'processing') {
 *     setTimeout(poll, 5000); // Poll every 5 seconds
 *   }
 * };
 * await poll();
 * ```
 */
export class AzureSTTAdapter extends BaseAdapter {
  readonly name = "azure-stt" as const
  readonly capabilities: ProviderCapabilities = {
    streaming: false, // Batch transcription only
    diarization: true,
    wordTimestamps: true,
    languageDetection: false,
    customVocabulary: true,
    summarization: false,
    sentimentAnalysis: false,
    entityDetection: false,
    piiRedaction: false
  }

  private region?: string
  protected baseUrl = "https://eastus.api.cognitive.microsoft.com/speechtotext/v3.1" // Default, overridden in initialize()

  initialize(config: ProviderConfig & { region?: string }): void {
    super.initialize(config)

    this.region = config.region || "eastus"
    this.baseUrl =
      config.baseUrl || `https://${this.region}.api.cognitive.microsoft.com/speechtotext/v3.1`
  }

  /**
   * Get axios config for generated API client functions
   * Configures headers and base URL using Azure subscription key
   */
  protected getAxiosConfig() {
    return super.getAxiosConfig("Ocp-Apim-Subscription-Key")
  }

  /**
   * Submit audio for transcription
   *
   * Azure Speech-to-Text uses batch transcription which processes asynchronously.
   * You need to poll getTranscript() to retrieve the completed transcription.
   *
   * @param audio - Audio input (URL only for batch transcription)
   * @param options - Transcription options
   * @returns Response with transcription ID for polling
   */
  async transcribe(
    audio: AudioInput,
    options?: TranscribeOptions
  ): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    if (audio.type !== "url") {
      return {
        success: false,
        provider: this.name,
        error: {
          code: "INVALID_INPUT",
          message: "Azure Speech-to-Text batch transcription only supports URL input"
        }
      }
    }

    try {
      const transcriptionRequest: Partial<Transcription> = {
        displayName: (options?.metadata?.displayName as string) || "SDK Transcription",
        description: (options?.metadata?.description as string) || "",
        locale: options?.language || "en-US",
        contentUrls: [audio.url],
        properties: this.buildTranscriptionProperties(options)
      }

      // Use generated API client function - FULLY TYPED!
      const response = await transcriptionsCreate(
        transcriptionRequest as Transcription,
        this.getAxiosConfig()
      )

      const transcription = response.data

      return {
        success: true,
        provider: this.name,
        data: {
          id: transcription.self?.split("/").pop() || "",
          text: "", // Will be populated after polling
          status: this.normalizeStatus(transcription.status),
          language: transcription.locale,
          createdAt: transcription.createdDateTime
        },
        raw: transcription
      }
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  /**
   * Get transcription result by ID
   *
   * Poll this method to check transcription status and retrieve results.
   *
   * @param transcriptId - Transcription ID from Azure
   * @returns Transcription response with status and results
   */
  async getTranscript(transcriptId: string): Promise<UnifiedTranscriptResponse> {
    this.validateConfig()

    try {
      // Get transcription status using generated API
      const statusResponse = await transcriptionsGet(transcriptId, this.getAxiosConfig())

      const transcription = statusResponse.data
      const status = this.normalizeStatus(transcription.status)

      if (status !== "completed") {
        return {
          success: true,
          provider: this.name,
          data: {
            id: transcriptId,
            text: "",
            status,
            language: transcription.locale,
            createdAt: transcription.createdDateTime
          },
          raw: transcription
        }
      }

      // Get transcription files (results) using generated API
      if (!transcription.links?.files) {
        return {
          success: false,
          provider: this.name,
          error: {
            code: "NO_RESULTS",
            message: "Transcription completed but no result files available"
          },
          raw: transcription
        }
      }

      const filesResponse = await transcriptionsListFiles(
        transcriptId,
        undefined,
        this.getAxiosConfig()
      )
      const files = filesResponse.data?.values || []

      // Find the transcription result file
      const resultFile = files.find((file: any) => file.kind === "Transcription")

      if (!resultFile?.links?.contentUrl) {
        return {
          success: false,
          provider: this.name,
          error: {
            code: "NO_RESULTS",
            message: "Transcription result file not found"
          },
          raw: transcription
        }
      }

      // Fetch the actual transcription content (contentUrl is an external link, not part of API)
      const contentResponse = await axios.get(resultFile.links.contentUrl)
      const transcriptionData = contentResponse.data

      return this.normalizeResponse(transcription, transcriptionData)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  /**
   * Delete a transcription and its associated data
   *
   * Removes the transcription from Azure's servers. This action is irreversible.
   *
   * @param transcriptId - The ID of the transcription to delete
   * @returns Promise with success status
   *
   * @example Delete a transcription
   * ```typescript
   * const result = await adapter.deleteTranscript('abc123-def456');
   * if (result.success) {
   *   console.log('Transcription deleted successfully');
   * }
   * ```
   *
   * @see https://learn.microsoft.com/azure/cognitive-services/speech-service/batch-transcription
   */
  async deleteTranscript(transcriptId: string): Promise<{ success: boolean }> {
    this.validateConfig()

    try {
      // Use generated API client function - FULLY TYPED!
      await transcriptionsDelete(transcriptId, this.getAxiosConfig())

      return { success: true }
    } catch (error) {
      // If transcription not found, consider it already deleted
      const err = error as { response?: { status?: number } }
      if (err.response?.status === 404) {
        return { success: true }
      }
      throw error
    }
  }

  /**
   * Build Azure-specific transcription properties
   */
  private buildTranscriptionProperties(options?: TranscribeOptions): TranscriptionProperties {
    const properties: any = {
      wordLevelTimestampsEnabled: options?.wordTimestamps ?? true,
      punctuationMode: "DictatedAndAutomatic",
      profanityFilterMode: "Masked"
    }

    if (options?.diarization) {
      properties.diarizationEnabled = true
      if (options.speakersExpected) {
        properties.diarization = {
          speakers: {
            minCount: 1,
            maxCount: options.speakersExpected
          }
        }
      }
    }

    if (options?.customVocabulary && options.customVocabulary.length > 0) {
      properties.customProperties = {
        phrases: options.customVocabulary.join(",")
      }
    }

    return properties
  }

  /**
   * Normalize Azure status to unified status
   */
  private normalizeStatus(status: any): "queued" | "processing" | "completed" | "error" {
    const statusStr = status?.toString().toLowerCase() || ""

    if (statusStr.includes("succeeded")) return "completed"
    if (statusStr.includes("running")) return "processing"
    if (statusStr.includes("notstarted")) return "queued"
    if (statusStr.includes("failed")) return "error"

    return "queued"
  }

  /**
   * Normalize Azure transcription response to unified format
   */
  private normalizeResponse(
    transcription: Transcription,
    transcriptionData: any
  ): UnifiedTranscriptResponse {
    const combinedPhrases = transcriptionData.combinedRecognizedPhrases || []
    const recognizedPhrases = transcriptionData.recognizedPhrases || []

    // Get full text from combined phrases
    const fullText =
      combinedPhrases.map((phrase: any) => phrase.display || phrase.lexical).join(" ") || ""

    // Extract words with timestamps
    const words = recognizedPhrases.flatMap((phrase: any) =>
      (phrase.nBest?.[0]?.words || []).map((word: any) => ({
        text: word.word,
        start: word.offsetInTicks / 10000000, // Convert ticks to seconds
        end: (word.offsetInTicks + word.durationInTicks) / 10000000,
        confidence: word.confidence,
        speaker: phrase.speaker !== undefined ? phrase.speaker.toString() : undefined
      }))
    )

    // Extract speakers if diarization was enabled
    const speakers =
      recognizedPhrases.length > 0 && recognizedPhrases[0].speaker !== undefined
        ? Array.from(
            new Set(
              recognizedPhrases.map((p: any) => p.speaker).filter((s: any) => s !== undefined)
            )
          ).map((speakerId: unknown) => ({
            id: String(speakerId),
            label: `Speaker ${speakerId}`
          }))
        : undefined

    return {
      success: true,
      provider: this.name,
      data: {
        id: transcription.self?.split("/").pop() || "",
        text: fullText,
        confidence: recognizedPhrases[0]?.nBest?.[0]?.confidence,
        status: "completed",
        language: transcription.locale,
        duration: transcriptionData.duration ? transcriptionData.duration / 10000000 : undefined,
        speakers,
        words: words.length > 0 ? words : undefined,
        createdAt: transcription.createdDateTime,
        completedAt: transcription.lastActionDateTime
      },
      raw: {
        transcription,
        transcriptionData
      }
    }
  }
}

/**
 * Factory function to create an Azure STT adapter
 */
export function createAzureSTTAdapter(
  config: ProviderConfig & { region?: string }
): AzureSTTAdapter {
  const adapter = new AzureSTTAdapter()
  adapter.initialize(config)
  return adapter
}
