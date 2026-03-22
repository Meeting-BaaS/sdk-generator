/**
 * Soniox API mappers: unified types ↔ Soniox API types
 */

import type { UnifiedTranscriptResponse, Utterance, Word } from "../../router/types"
import { buildUtterancesFromWords } from "../../utils/transcription-helpers"
import { TranscriptionStatus as SonioxTranscriptionStatus } from "../../generated/soniox/schema/transcriptionStatus"

interface SonioxToken {
  text?: string
  is_final?: boolean
  start_ms?: number
  end_ms?: number
  confidence?: number
  speaker?: string
  language?: string
}

interface SonioxResponse {
  id?: string
  text?: string
  tokens?: SonioxToken[]
  total_audio_proc_ms?: number
}

function tokensToWords(tokens: SonioxToken[]): Word[] {
  return tokens
    .filter((t) => t.is_final && t.start_ms !== undefined && t.end_ms !== undefined)
    .map((token) => ({
      word: token.text || "",
      start: token.start_ms! / 1000,
      end: token.end_ms! / 1000,
      confidence: token.confidence,
      speaker: token.speaker
    }))
}

function tokensToUtterances(tokens: SonioxToken[]): Utterance[] {
  return buildUtterancesFromWords(tokensToWords(tokens))
}

export function buildUtterancesFromSonioxTokens(tokens: SonioxToken[]): Utterance[] {
  return tokensToUtterances(tokens)
}

export function mapFromSonioxResponse(
  response: SonioxResponse,
  provider: "soniox"
): UnifiedTranscriptResponse {
  const text =
    response.text ||
    (response.tokens
      ? response.tokens
          .filter((t) => t.is_final)
          .map((t) => (t.text || "").trim())
          .join(" ")
          .trim()
      : "")

  const words: Word[] = response.tokens ? tokensToWords(response.tokens) : []

  const speakerSet = new Set<string>()
  if (response.tokens) {
    response.tokens.forEach((t) => {
      if (t.speaker) speakerSet.add(t.speaker)
    })
  }

  const speakers =
    speakerSet.size > 0
      ? Array.from(speakerSet).map((id) => ({
          id,
          label: `Speaker ${id}`
        }))
      : undefined

  const utterances = response.tokens
    ? tokensToUtterances(response.tokens)
    : []

  const language = response.tokens?.find((t) => t.language)?.language

  return {
    success: true,
    provider,
    data: {
      id: response.id || `soniox_${Date.now()}`,
      text,
      status: SonioxTranscriptionStatus.completed,
      language,
      duration: response.total_audio_proc_ms ? response.total_audio_proc_ms / 1000 : undefined,
      speakers,
      words: words.length > 0 ? words : undefined,
      utterances: utterances.length > 0 ? utterances : undefined
    },
    tracking: {
      requestId: response.id,
      processingTimeMs: response.total_audio_proc_ms
    },
    raw: response
  }
}
