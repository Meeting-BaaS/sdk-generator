/**
 * ElevenLabs Speech-to-Text API mappers: unified types ↔ ElevenLabs API types
 */

import type {
  ElevenLabsExtendedData,
  UnifiedTranscriptResponse,
  Word
} from "../../router/types"
import { buildUtterancesFromWords } from "../../utils/transcription-helpers"
import type { SpeechToTextChunkResponseModel } from "../../generated/elevenlabs/schema/speechToTextChunkResponseModel"

export function mapFromElevenLabsResponse(
  response: {
    transcripts?: SpeechToTextChunkResponseModel[]
    transcription_id?: string
    [key: string]: unknown
  },
  provider: "elevenlabs"
): UnifiedTranscriptResponse {
  const chunks: SpeechToTextChunkResponseModel[] = response.transcripts
    ? (response.transcripts as SpeechToTextChunkResponseModel[])
    : [response as unknown as SpeechToTextChunkResponseModel]

  const text = chunks.map((c) => c.text).join(" ")

  const words: Word[] = []
  const speakerSet = new Set<string>()
  const audioEvents: ElevenLabsExtendedData["audioEvents"] = []

  for (const chunk of chunks) {
    if (!chunk.words) continue

    for (const w of chunk.words) {
      if (w.type === "audio_event") {
        audioEvents.push({
          text: w.text,
          start: typeof w.start === "number" ? w.start : 0,
          end: typeof w.end === "number" ? w.end : 0
        })
        continue
      }

      const speakerId = w.speaker_id ?? undefined
      const word: Word = {
        word: w.text,
        start: typeof w.start === "number" ? w.start : 0,
        end: typeof w.end === "number" ? w.end : 0,
        confidence: w.logprob !== undefined ? Math.exp(w.logprob) : undefined,
        speaker: speakerId
      }
      words.push(word)

      if (speakerId) speakerSet.add(speakerId)
    }
  }

  const speakers =
    speakerSet.size > 0
      ? Array.from(speakerSet).map((id) => ({
          id,
          label: `Speaker ${id}`
        }))
      : undefined

  const utterances = words.length > 0 ? buildUtterancesFromWords(words) : []

  const language = chunks[0]?.language_code
  const languageProbability = chunks[0]?.language_probability

  const entities: ElevenLabsExtendedData["entities"] = []
  for (const chunk of chunks) {
    if (chunk.entities && Array.isArray(chunk.entities)) {
      for (const entity of chunk.entities as Array<{
        text: string
        entity_type: string
        start_char: number
        end_char: number
      }>) {
        entities.push({
          text: entity.text,
          entity_type: entity.entity_type,
          start_char: entity.start_char,
          end_char: entity.end_char
        })
      }
    }
  }

  const transcriptionId =
    response.transcription_id || chunks[0]?.transcription_id || `elevenlabs_${Date.now()}`

  return {
    success: true,
    provider,
    data: {
      id: transcriptionId,
      text,
      status: "completed",
      language,
      speakers,
      words: words.length > 0 ? words : undefined,
      utterances: utterances.length > 0 ? utterances : undefined
    },
    extended: {
      entities: entities.length > 0 ? entities : undefined,
      audioEvents: audioEvents.length > 0 ? audioEvents : undefined,
      languageProbability
    } as ElevenLabsExtendedData,
    tracking: { requestId: transcriptionId },
    raw: response
  }
}
