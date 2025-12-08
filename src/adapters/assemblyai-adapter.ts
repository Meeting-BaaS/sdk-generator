/**
 * AssemblyAI transcription provider adapter
 * Documentation: https://www.assemblyai.com/docs
 */

import axios, { type AxiosInstance } from "axios"
import type {
	AudioInput,
	ProviderCapabilities,
	TranscribeOptions,
	UnifiedTranscriptResponse,
} from "../router/types"
import { BaseAdapter, type ProviderConfig } from "./base-adapter"

// Import AssemblyAI generated types
import type { Transcript } from "../generated/assemblyai/schema/transcript"
import type { TranscriptParams } from "../generated/assemblyai/schema/transcriptParams"
import type { TranscriptStatus } from "../generated/assemblyai/schema/transcriptStatus"
import type { TranscriptWord } from "../generated/assemblyai/schema/transcriptWord"
import type { TranscriptUtterance } from "../generated/assemblyai/schema/transcriptUtterance"

/**
 * AssemblyAI transcription provider adapter
 *
 * Implements transcription for the AssemblyAI API with support for:
 * - Synchronous and asynchronous transcription
 * - Speaker diarization (speaker labels)
 * - Multi-language detection and transcription
 * - Summarization and sentiment analysis
 * - Entity detection and content moderation
 * - Custom vocabulary and spelling
 * - Word-level timestamps
 * - PII redaction
 *
 * @see https://www.assemblyai.com/docs AssemblyAI API Documentation
 *
 * @example Basic transcription
 * ```typescript
 * import { AssemblyAIAdapter } from '@meeting-baas/sdk';
 *
 * const adapter = new AssemblyAIAdapter();
 * adapter.initialize({
 *   apiKey: process.env.ASSEMBLYAI_API_KEY
 * });
 *
 * const result = await adapter.transcribe({
 *   type: 'url',
 *   url: 'https://example.com/audio.mp3'
 * }, {
 *   language: 'en',
 *   diarization: true
 * });
 *
 * console.log(result.data.text);
 * console.log(result.data.speakers);
 * ```
 *
 * @example With advanced features
 * ```typescript
 * const result = await adapter.transcribe(audio, {
 *   language: 'en_us',
 *   diarization: true,
 *   summarization: true,
 *   sentimentAnalysis: true,
 *   entityDetection: true,
 *   piiRedaction: true
 * });
 *
 * console.log('Summary:', result.data.summary);
 * console.log('Entities:', result.data.metadata?.entities);
 * ```
 */
export class AssemblyAIAdapter extends BaseAdapter {
	readonly name = "assemblyai" as const
	readonly capabilities: ProviderCapabilities = {
		streaming: true,
		diarization: true,
		wordTimestamps: true,
		languageDetection: true,
		customVocabulary: true,
		summarization: true,
		sentimentAnalysis: true,
		entityDetection: true,
		piiRedaction: true,
	}

	private client?: AxiosInstance
	private baseUrl = "https://api.assemblyai.com/v2"

	initialize(config: ProviderConfig): void {
		super.initialize(config)

		this.client = axios.create({
			baseURL: config.baseUrl || this.baseUrl,
			timeout: config.timeout || 60000,
			headers: {
				authorization: config.apiKey,
				"Content-Type": "application/json",
				...config.headers,
			},
		})
	}

	/**
	 * Submit audio for transcription
	 *
	 * Sends audio to AssemblyAI API for transcription. If a webhook URL is provided,
	 * returns immediately with the job ID. Otherwise, polls until completion.
	 *
	 * @param audio - Audio input (currently only URL type supported)
	 * @param options - Transcription options
	 * @param options.language - Language code (e.g., 'en', 'en_us', 'es', 'fr')
	 * @param options.languageDetection - Enable automatic language detection
	 * @param options.diarization - Enable speaker identification (speaker_labels)
	 * @param options.speakersExpected - Number of expected speakers
	 * @param options.summarization - Generate text summary
	 * @param options.sentimentAnalysis - Analyze sentiment of transcription
	 * @param options.entityDetection - Detect named entities (people, places, etc.)
	 * @param options.piiRedaction - Redact personally identifiable information
	 * @param options.customVocabulary - Words to boost in recognition
	 * @param options.webhookUrl - Callback URL for async results
	 * @returns Normalized transcription response
	 * @throws {Error} If audio type is not 'url' (file/stream not yet supported)
	 *
	 * @example Simple transcription
	 * ```typescript
	 * const result = await adapter.transcribe({
	 *   type: 'url',
	 *   url: 'https://example.com/meeting.mp3'
	 * });
	 * ```
	 *
	 * @example With advanced features
	 * ```typescript
	 * const result = await adapter.transcribe({
	 *   type: 'url',
	 *   url: 'https://example.com/meeting.mp3'
	 * }, {
	 *   language: 'en_us',
	 *   diarization: true,
	 *   speakersExpected: 3,
	 *   summarization: true,
	 *   sentimentAnalysis: true,
	 *   entityDetection: true,
	 *   customVocabulary: ['API', 'TypeScript', 'JavaScript']
	 * });
	 * ```
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
			const response = await this.client!.post<Transcript>(
				"/transcript",
				payload,
			)

			const transcriptId = response.data.id

			// If webhook is provided, return immediately with job ID
			if (options?.webhookUrl) {
				return {
					success: true,
					provider: this.name,
					data: {
						id: transcriptId,
						text: "",
						status: "queued",
					},
					raw: response.data,
				}
			}

			// Otherwise, poll for results
			return await this.pollForCompletion(transcriptId)
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
			const response = await this.client!.get<Transcript>(
				`/transcript/${transcriptId}`,
			)

			return this.normalizeResponse(response.data)
		} catch (error) {
			return this.createErrorResponse(error)
		}
	}

	/**
	 * Build AssemblyAI transcription request from unified options
	 */
	private buildTranscriptionRequest(
		audio: AudioInput,
		options?: TranscribeOptions,
	): TranscriptParams {
		// Get audio URL
		let audioUrl: string
		if (audio.type === "url") {
			audioUrl = audio.url
		} else {
			throw new Error(
				"AssemblyAI adapter currently only supports URL-based audio input. Use audio.type='url'",
			)
		}

		const request: TranscriptParams = {
			audio_url: audioUrl,
		}

		// Map options to AssemblyAI format
		if (options) {
			// Language configuration
			if (options.language) {
				// Convert ISO codes to AssemblyAI format (e.g., 'en' -> 'en_us')
				const languageCode = options.language.includes("_")
					? options.language
					: `${options.language}_us`
				request.language_code = languageCode as any
			}

			if (options.languageDetection) {
				request.language_detection = true
			}

			// Speaker diarization
			if (options.diarization) {
				request.speaker_labels = true
				if (options.speakersExpected) {
					request.speakers_expected = options.speakersExpected
				}
			}

			// Custom vocabulary (word boost)
			if (options.customVocabulary && options.customVocabulary.length > 0) {
				request.word_boost = options.customVocabulary
				request.boost_param = "high" // default to high boost
			}

			// Summarization
			if (options.summarization) {
				request.summarization = true
				request.summary_model = "informative"
				request.summary_type = "bullets"
			}

			// Sentiment analysis
			if (options.sentimentAnalysis) {
				request.sentiment_analysis = true
			}

			// Entity detection
			if (options.entityDetection) {
				request.entity_detection = true
			}

			// PII redaction
			if (options.piiRedaction) {
				request.redact_pii = true
			}

			// Webhook callback
			if (options.webhookUrl) {
				request.webhook_url = options.webhookUrl
			}

			// Enable word timestamps by default (AssemblyAI includes them automatically)
			// Enable punctuation and formatting for better results
			request.punctuate = true
			request.format_text = true
		}

		return request
	}

	/**
	 * Normalize AssemblyAI response to unified format
	 */
	private normalizeResponse(response: Transcript): UnifiedTranscriptResponse {
		// Map AssemblyAI status to unified status
		let status: "queued" | "processing" | "completed" | "error"
		switch (response.status) {
			case "queued":
				status = "queued"
				break
			case "processing":
				status = "processing"
				break
			case "completed":
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
					code: "TRANSCRIPTION_ERROR",
					message: response.error || "Transcription failed",
				},
				raw: response,
			}
		}

		return {
			success: true,
			provider: this.name,
			data: {
				id: response.id,
				text: response.text || "",
				confidence:
					response.confidence !== null ? response.confidence : undefined,
				status,
				language: response.language_code,
				duration: response.audio_duration
					? response.audio_duration / 1000
					: undefined, // Convert ms to seconds
				speakers: this.extractSpeakers(response),
				words: this.extractWords(response),
				utterances: this.extractUtterances(response),
				summary: response.summary || undefined,
				metadata: {
					audioUrl: response.audio_url,
					entities: response.entities,
					sentimentAnalysis: response.sentiment_analysis_results,
					contentModeration: response.content_safety_labels,
				},
			},
			raw: response,
		}
	}

	/**
	 * Extract speaker information from AssemblyAI response
	 */
	private extractSpeakers(transcript: Transcript) {
		if (!transcript.utterances || transcript.utterances.length === 0) {
			return undefined
		}

		// Extract unique speakers from utterances
		const speakerSet = new Set<string>()
		transcript.utterances.forEach((utterance: TranscriptUtterance) => {
			if (utterance.speaker) {
				speakerSet.add(utterance.speaker)
			}
		})

		if (speakerSet.size === 0) {
			return undefined
		}

		return Array.from(speakerSet).map((speakerId) => ({
			id: speakerId,
			label: speakerId, // AssemblyAI uses format like "A", "B", "C"
		}))
	}

	/**
	 * Extract word timestamps from AssemblyAI response
	 */
	private extractWords(transcript: Transcript) {
		if (!transcript.words || transcript.words.length === 0) {
			return undefined
		}

		return transcript.words.map((word: TranscriptWord) => ({
			text: word.text,
			start: word.start / 1000, // Convert ms to seconds
			end: word.end / 1000, // Convert ms to seconds
			confidence: word.confidence,
			speaker: word.speaker || undefined,
		}))
	}

	/**
	 * Extract utterances from AssemblyAI response
	 */
	private extractUtterances(transcript: Transcript) {
		if (!transcript.utterances || transcript.utterances.length === 0) {
			return undefined
		}

		return transcript.utterances.map((utterance: TranscriptUtterance) => ({
			text: utterance.text,
			start: utterance.start / 1000, // Convert ms to seconds
			end: utterance.end / 1000, // Convert ms to seconds
			speaker: utterance.speaker || undefined,
			confidence: utterance.confidence,
			words: utterance.words.map((word: TranscriptWord) => ({
				text: word.text,
				start: word.start / 1000,
				end: word.end / 1000,
				confidence: word.confidence,
			})),
		}))
	}

	/**
	 * Poll for transcription completion
	 */
	private async pollForCompletion(
		transcriptId: string,
		maxAttempts = 60,
		intervalMs = 3000,
	): Promise<UnifiedTranscriptResponse> {
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			const result = await this.getTranscript(transcriptId)

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
 * Factory function to create an AssemblyAI adapter
 */
export function createAssemblyAIAdapter(
	config: ProviderConfig,
): AssemblyAIAdapter {
	const adapter = new AssemblyAIAdapter()
	adapter.initialize(config)
	return adapter
}
