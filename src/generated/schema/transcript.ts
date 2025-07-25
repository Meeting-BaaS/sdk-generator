/**
 * Generated by orval v7.9.0 🍺
 * Do not edit manually.
 * Meeting BaaS API
 * Meeting BaaS API
 * OpenAPI spec version: 1.1
 */
import type { TranscriptEndTime } from "./transcriptEndTime"
import type { TranscriptLang } from "./transcriptLang"
import type { TranscriptUserId } from "./transcriptUserId"
import type { Word } from "./word"

export interface Transcript {
  bot_id: number
  end_time?: TranscriptEndTime
  id: number
  lang?: TranscriptLang
  speaker: string
  start_time: number
  user_id?: TranscriptUserId
  words: Word[]
}
