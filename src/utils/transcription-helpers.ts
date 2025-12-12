/**
 * Transcription processing utilities
 *
 * Provides reusable helpers for extracting and normalizing transcription
 * data (speakers, words, utterances) across different provider formats.
 */

import type { Speaker, Word, TranscriptionStatus } from "../router/types"

/**
 * Extract unique speakers from utterances
 *
 * Generic helper that works with any provider's utterance format via
 * a mapping function to extract speaker IDs.
 *
 * @param utterances - Provider-specific utterances array
 * @param getSpeakerId - Function to extract speaker ID from utterance
 * @param formatLabel - Optional function to format speaker label
 * @returns Array of unique speakers or undefined if none found
 *
 * @example Gladia
 * ```typescript
 * const speakers = extractSpeakersFromUtterances(
 *   transcription?.utterances,
 *   (utterance) => utterance.speaker,
 *   (id) => `Speaker ${id}`
 * )
 * ```
 *
 * @example AssemblyAI (already has good labels)
 * ```typescript
 * const speakers = extractSpeakersFromUtterances(
 *   transcript.utterances,
 *   (utterance) => utterance.speaker,
 *   (id) => id  // Keep as-is: "A", "B", "C"
 * )
 * ```
 */
export function extractSpeakersFromUtterances<T>(
  utterances: T[] | undefined | null,
  getSpeakerId: (utterance: T) => string | number | undefined,
  formatLabel?: (speakerId: string) => string
): Speaker[] | undefined {
  if (!utterances || utterances.length === 0) {
    return undefined
  }

  const speakerSet = new Set<string>()

  utterances.forEach((utterance) => {
    const speakerId = getSpeakerId(utterance)
    if (speakerId !== undefined) {
      speakerSet.add(String(speakerId))
    }
  })

  if (speakerSet.size === 0) {
    return undefined
  }

  return Array.from(speakerSet).map((speakerId) => ({
    id: speakerId,
    label: formatLabel ? formatLabel(speakerId) : `Speaker ${speakerId}`
  }))
}

/**
 * Extract and normalize words from provider-specific format
 *
 * Generic helper that maps provider word formats to unified Word type.
 *
 * @param words - Provider-specific words array
 * @param mapper - Function to convert provider word to unified Word
 * @returns Array of normalized words or undefined if none found
 *
 * @example Gladia
 * ```typescript
 * const words = extractWords(
 *   allWords,
 *   (word: WordDTO) => ({
 *     text: word.word,
 *     start: word.start,
 *     end: word.end,
 *     confidence: word.confidence
 *   })
 * )
 * ```
 */
export function extractWords<T>(
  words: T[] | undefined | null,
  mapper: (word: T) => Word
): Word[] | undefined {
  if (!words || words.length === 0) {
    return undefined
  }

  const normalizedWords = words.map(mapper)
  return normalizedWords.length > 0 ? normalizedWords : undefined
}

/**
 * Status mapping configurations for each provider
 *
 * Maps provider-specific status strings to unified TranscriptionStatus.
 * Keys are lowercase provider status values, values are unified statuses.
 */
export const STATUS_MAPPINGS = {
  gladia: {
    queued: "queued" as TranscriptionStatus,
    processing: "processing" as TranscriptionStatus,
    done: "completed" as TranscriptionStatus,
    error: "error" as TranscriptionStatus
  },
  assemblyai: {
    queued: "queued" as TranscriptionStatus,
    processing: "processing" as TranscriptionStatus,
    completed: "completed" as TranscriptionStatus,
    error: "error" as TranscriptionStatus
  },
  deepgram: {
    queued: "queued" as TranscriptionStatus,
    processing: "processing" as TranscriptionStatus,
    completed: "completed" as TranscriptionStatus,
    error: "error" as TranscriptionStatus
  },
  azure: {
    succeeded: "completed" as TranscriptionStatus,
    running: "processing" as TranscriptionStatus,
    notstarted: "queued" as TranscriptionStatus,
    failed: "error" as TranscriptionStatus
  },
  speechmatics: {
    running: "processing" as TranscriptionStatus,
    done: "completed" as TranscriptionStatus,
    rejected: "error" as TranscriptionStatus,
    expired: "error" as TranscriptionStatus
  }
} as const

export type SupportedProvider = keyof typeof STATUS_MAPPINGS

/**
 * Normalize provider status to unified status
 *
 * Handles both exact matches and substring matches (for Azure-style statuses).
 *
 * @param providerStatus - Status string from provider API
 * @param provider - Provider name
 * @param defaultStatus - Fallback status if no match found
 * @returns Unified transcription status
 *
 * @example Gladia
 * ```typescript
 * const status = normalizeStatus(response.status, "gladia")
 * // "done" -> "completed"
 * ```
 *
 * @example Azure (substring matching)
 * ```typescript
 * const status = normalizeStatus("Succeeded", "azure")
 * // Case-insensitive substring match: "Succeeded" contains "succeeded" -> "completed"
 * ```
 */
export function normalizeStatus(
  providerStatus: string | undefined | null,
  provider: SupportedProvider,
  defaultStatus: TranscriptionStatus = "queued"
): TranscriptionStatus {
  if (!providerStatus) return defaultStatus

  const mapping = STATUS_MAPPINGS[provider]
  const statusKey = providerStatus.toString().toLowerCase()

  // Try exact match first
  if (statusKey in mapping) {
    return mapping[statusKey as keyof typeof mapping]
  }

  // Try substring match (for Azure-style statuses like "Succeeded", "NotStarted")
  for (const [key, value] of Object.entries(mapping)) {
    if (statusKey.includes(key)) {
      return value
    }
  }

  return defaultStatus
}
