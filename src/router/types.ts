/**
 * Unified types for the Voice Router SDK
 * These types provide a provider-agnostic interface for transcription services
 */

/**
 * Supported transcription providers
 */
export type TranscriptionProvider = "gladia" | "assemblyai" | "deepgram"

/**
 * Provider capabilities - indicates which features each provider supports
 */
export interface ProviderCapabilities {
	/** Real-time streaming transcription support */
	streaming: boolean
	/** Speaker diarization (identifying different speakers) */
	diarization: boolean
	/** Word-level timestamps */
	wordTimestamps: boolean
	/** Automatic language detection */
	languageDetection: boolean
	/** Custom vocabulary/keyword boosting */
	customVocabulary: boolean
	/** Audio summarization */
	summarization: boolean
	/** Sentiment analysis */
	sentimentAnalysis: boolean
	/** Entity detection */
	entityDetection: boolean
	/** PII redaction */
	piiRedaction: boolean
}

/**
 * Audio input for transcription
 */
export type AudioInput =
	| { type: "url"; url: string }
	| { type: "file"; file: Buffer | Blob; filename?: string }
	| { type: "stream"; stream: ReadableStream }

/**
 * Common transcription options across all providers
 */
export interface TranscribeOptions {
	/** Language code (e.g., 'en', 'en-US', 'es') */
	language?: string
	/** Enable automatic language detection */
	languageDetection?: boolean
	/** Enable speaker diarization */
	diarization?: boolean
	/** Expected number of speakers (for diarization) */
	speakersExpected?: number
	/** Enable word-level timestamps */
	wordTimestamps?: boolean
	/** Custom vocabulary to boost (provider-specific format) */
	customVocabulary?: string[]
	/** Enable summarization */
	summarization?: boolean
	/** Enable sentiment analysis */
	sentimentAnalysis?: boolean
	/** Enable entity detection */
	entityDetection?: boolean
	/** Enable PII redaction */
	piiRedaction?: boolean
	/** Webhook URL for async results */
	webhookUrl?: string
	/** Custom metadata to attach to the transcription */
	metadata?: Record<string, unknown>
}

/**
 * Speaker information from diarization
 */
export interface Speaker {
	/** Speaker identifier (e.g., "A", "B", "speaker_0") */
	id: string
	/** Speaker label if known */
	label?: string
	/** Confidence score for speaker identification (0-1) */
	confidence?: number
}

/**
 * Word-level transcription with timing
 */
export interface Word {
	/** The transcribed word */
	text: string
	/** Start time in seconds */
	start: number
	/** End time in seconds */
	end: number
	/** Confidence score (0-1) */
	confidence?: number
	/** Speaker ID if diarization is enabled */
	speaker?: string
}

/**
 * Utterance (sentence or phrase by a single speaker)
 */
export interface Utterance {
	/** The transcribed text */
	text: string
	/** Start time in seconds */
	start: number
	/** End time in seconds */
	end: number
	/** Speaker ID */
	speaker?: string
	/** Confidence score (0-1) */
	confidence?: number
	/** Words in this utterance */
	words?: Word[]
}

/**
 * Transcription status
 */
export type TranscriptionStatus =
	| "queued"
	| "processing"
	| "completed"
	| "error"

/**
 * Unified transcription response
 */
export interface UnifiedTranscriptResponse {
	/** Operation success status */
	success: boolean
	/** Provider that performed the transcription */
	provider: TranscriptionProvider
	/** Transcription data (only present on success) */
	data?: {
		/** Unique transcription ID */
		id: string
		/** Full transcribed text */
		text: string
		/** Overall confidence score (0-1) */
		confidence?: number
		/** Transcription status */
		status: TranscriptionStatus
		/** Detected or specified language code */
		language?: string
		/** Audio duration in seconds */
		duration?: number
		/** Speaker diarization results */
		speakers?: Speaker[]
		/** Word-level transcription with timestamps */
		words?: Word[]
		/** Utterances (speaker turns) */
		utterances?: Utterance[]
		/** Summary of the content (if summarization enabled) */
		summary?: string
		/** Additional provider-specific metadata */
		metadata?: Record<string, unknown>
		/** Creation timestamp */
		createdAt?: string
		/** Completion timestamp */
		completedAt?: string
	}
	/** Error information (only present on failure) */
	error?: {
		/** Error code (provider-specific or normalized) */
		code: string
		/** Human-readable error message */
		message: string
		/** Additional error details */
		details?: unknown
		/** HTTP status code if applicable */
		statusCode?: number
	}
	/** Raw provider response (for advanced usage) */
	raw?: unknown
}

/**
 * Streaming transcription event types
 */
export type StreamEventType =
	| "transcript" // Partial or final transcript
	| "metadata" // Metadata about the stream
	| "error" // Error event
	| "end" // Stream ended

/**
 * Streaming transcription event
 */
export interface StreamEvent {
	type: StreamEventType
	/** Partial transcript text (for type: "transcript") */
	text?: string
	/** Whether this is a final transcript (vs interim) */
	isFinal?: boolean
	/** Error information (for type: "error") */
	error?: {
		code: string
		message: string
		details?: unknown
	}
	/** Additional event data */
	data?: unknown
}
