/**
 * Gladia transcription provider adapter
 * Documentation: https://docs.gladia.io/
 */

import axios, { type AxiosInstance } from "axios"
import type {
	AudioInput,
	ProviderCapabilities,
	TranscribeOptions,
	UnifiedTranscriptResponse,
} from "../router/types"
import { BaseAdapter, type ProviderConfig } from "./base-adapter"

// Import Gladia generated types
import type { InitPreRecordedTranscriptionResponse } from "../generated/gladia/schema/initPreRecordedTranscriptionResponse"
import type { InitTranscriptionRequest } from "../generated/gladia/schema/initTranscriptionRequest"
import type { PreRecordedResponse } from "../generated/gladia/schema/preRecordedResponse"
import type { TranscriptionDTO } from "../generated/gladia/schema/transcriptionDTO"
import type { UtteranceDTO } from "../generated/gladia/schema/utteranceDTO"
import type { WordDTO } from "../generated/gladia/schema/wordDTO"

/**
 * Gladia adapter implementation
 */
export class GladiaAdapter extends BaseAdapter {
	readonly name = "gladia" as const
	readonly capabilities: ProviderCapabilities = {
		streaming: true,
		diarization: true,
		wordTimestamps: true,
		languageDetection: true,
		customVocabulary: true,
		summarization: true,
		sentimentAnalysis: true,
		entityDetection: true,
		piiRedaction: false, // Gladia doesn't have PII redaction in their API
	}

	private client?: AxiosInstance
	private baseUrl = "https://api.gladia.io/v2"

	initialize(config: ProviderConfig): void {
		super.initialize(config)

		this.client = axios.create({
			baseURL: config.baseUrl || this.baseUrl,
			timeout: config.timeout || 60000,
			headers: {
				"x-gladia-key": config.apiKey,
				"Content-Type": "application/json",
				...config.headers,
			},
		})
	}

	/**
	 * Submit audio for transcription
	 */
	async transcribe(
		audio: AudioInput,
		options?: TranscribeOptions,
	): Promise<UnifiedTranscriptResponse> {
		this.validateConfig()

		try {
			// Prepare the request payload
			const payload = this.buildTranscriptionRequest(audio, options)

			// Submit transcription job
			const response =
				await this.client!.post<InitPreRecordedTranscriptionResponse>(
					"/transcription",
					payload,
				)

			const jobId = response.data.id

			// If webhook is provided, return immediately with job ID
			if (options?.webhookUrl) {
				return {
					success: true,
					provider: this.name,
					data: {
						id: jobId,
						text: "",
						status: "queued",
					},
					raw: response.data,
				}
			}

			// Otherwise, poll for results
			return await this.pollForCompletion(jobId)
		} catch (error) {
			return this.createErrorResponse(error)
		}
	}

	/**
	 * Get transcription result by ID
	 */
	async getTranscript(
		transcriptId: string,
	): Promise<UnifiedTranscriptResponse> {
		this.validateConfig()

		try {
			const response = await this.client!.get<PreRecordedResponse>(
				`/transcription/${transcriptId}`,
			)

			return this.normalizeResponse(response.data)
		} catch (error) {
			return this.createErrorResponse(error)
		}
	}

	/**
	 * Build Gladia transcription request from unified options
	 */
	private buildTranscriptionRequest(
		audio: AudioInput,
		options?: TranscribeOptions,
	): InitTranscriptionRequest {
		// Get audio URL
		let audioUrl: string
		if (audio.type === "url") {
			audioUrl = audio.url
		} else {
			throw new Error(
				"Gladia adapter currently only supports URL-based audio input. Use audio.type='url'",
			)
		}

		const request: InitTranscriptionRequest = {
			audio_url: audioUrl,
		}

		// Map options to Gladia format
		if (options) {
			// Language configuration
			if (options.language || options.languageDetection) {
				request.language_config = {
					languages: options.language
						? ([options.language] as any)
						: undefined,
					code_switching: options.languageDetection,
				}
			}

			// Diarization (speaker recognition)
			if (options.diarization) {
				request.diarization = true
				if (options.speakersExpected) {
					request.diarization_config = {
						number_of_speakers: options.speakersExpected,
					}
				}
			}

			// Custom vocabulary
			if (options.customVocabulary && options.customVocabulary.length > 0) {
				request.custom_vocabulary = true
				request.custom_vocabulary_config = {
					vocabulary: options.customVocabulary as any,
				}
			}

			// Summarization
			if (options.summarization) {
				request.summarization = true
			}

			// Sentiment analysis
			if (options.sentimentAnalysis) {
				request.sentiment_analysis = true
			}

			// Named entity recognition (entity detection)
			if (options.entityDetection) {
				request.named_entity_recognition = true
			}

			// Webhook callback
			if (options.webhookUrl) {
				request.callback = true
				request.callback_config = {
					url: options.webhookUrl,
				}
			}

			// Custom metadata
			if (options.metadata) {
				request.custom_metadata = options.metadata
			}
		}

		return request
	}

	/**
	 * Normalize Gladia response to unified format
	 */
	private normalizeResponse(
		response: PreRecordedResponse,
	): UnifiedTranscriptResponse {
		// Map Gladia status to unified status
		let status: "queued" | "processing" | "completed" | "error"
		switch (response.status) {
			case "queued":
				status = "queued"
				break
			case "processing":
				status = "processing"
				break
			case "done":
				status = "completed"
				break
			case "error":
				status = "error"
				break
			default:
				status = "queued"
		}

		// Handle error state
		if (response.status === "error") {
			return {
				success: false,
				provider: this.name,
				error: {
					code: response.error_code?.toString() || "TRANSCRIPTION_ERROR",
					message: "Transcription failed",
					statusCode: response.error_code || undefined,
				},
				raw: response,
			}
		}

		// Extract transcription result
		const result = response.result
		const transcription = result?.transcription

		return {
			success: true,
			provider: this.name,
			data: {
				id: response.id,
				text: transcription?.full_transcript || "",
				confidence: undefined, // Gladia doesn't provide overall confidence
				status,
				language: transcription?.languages?.[0], // Use first detected language
				duration: undefined, // Not directly available in Gladia response
				speakers: this.extractSpeakers(transcription),
				words: this.extractWords(transcription),
				utterances: this.extractUtterances(transcription),
				summary: result?.summarization?.results || undefined,
				metadata: {
					requestParams: response.request_params,
					customMetadata: response.custom_metadata,
				},
				createdAt: response.created_at,
				completedAt: response.completed_at || undefined,
			},
			raw: response,
		}
	}

	/**
	 * Extract speaker information from Gladia response
	 */
	private extractSpeakers(transcription: TranscriptionDTO | undefined) {
		if (!transcription?.utterances) {
			return undefined
		}

		// Gladia stores speakers in utterances - extract unique speakers
		const speakerSet = new Set<number>()
		transcription.utterances.forEach((utterance: UtteranceDTO) => {
			if (utterance.speaker !== undefined) {
				speakerSet.add(utterance.speaker)
			}
		})

		if (speakerSet.size === 0) {
			return undefined
		}

		return Array.from(speakerSet).map((speakerId) => ({
			id: speakerId.toString(),
			label: `Speaker ${speakerId}`,
		}))
	}

	/**
	 * Extract word timestamps from Gladia response
	 */
	private extractWords(transcription: TranscriptionDTO | undefined) {
		if (!transcription?.utterances) {
			return undefined
		}

		// Flatten all words from all utterances
		const allWords = transcription.utterances.flatMap((utterance: UtteranceDTO) =>
			utterance.words.map((word: WordDTO) => ({
				text: word.word,
				start: word.start,
				end: word.end,
				confidence: word.confidence,
				speaker: utterance.speaker?.toString(),
			})),
		)

		return allWords.length > 0 ? allWords : undefined
	}

	/**
	 * Extract utterances from Gladia response
	 */
	private extractUtterances(transcription: TranscriptionDTO | undefined) {
		if (!transcription?.utterances) {
			return undefined
		}

		return transcription.utterances.map((utterance: UtteranceDTO) => ({
			text: utterance.text,
			start: utterance.start,
			end: utterance.end,
			speaker: utterance.speaker?.toString(),
			confidence: utterance.confidence,
			words: utterance.words.map((word: WordDTO) => ({
				text: word.word,
				start: word.start,
				end: word.end,
				confidence: word.confidence,
			})),
		}))
	}

	/**
	 * Poll for transcription completion
	 */
	private async pollForCompletion(
		jobId: string,
		maxAttempts = 60,
		intervalMs = 2000,
	): Promise<UnifiedTranscriptResponse> {
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			const result = await this.getTranscript(jobId)

			if (!result.success) {
				return result
			}

			const status = result.data?.status
			if (status === "completed") {
				return result
			}

			if (status === "error") {
				return {
					success: false,
					provider: this.name,
					error: {
						code: "TRANSCRIPTION_ERROR",
						message: "Transcription failed",
					},
					raw: result.raw,
				}
			}

			// Wait before next poll
			await new Promise((resolve) => setTimeout(resolve, intervalMs))
		}

		// Timeout
		return {
			success: false,
			provider: this.name,
			error: {
				code: "POLLING_TIMEOUT",
				message: `Transcription did not complete after ${maxAttempts} attempts`,
			},
		}
	}
}

/**
 * Factory function to create a Gladia adapter
 */
export function createGladiaAdapter(config: ProviderConfig): GladiaAdapter {
	const adapter = new GladiaAdapter()
	adapter.initialize(config)
	return adapter
}
