export {
  speechToText,
  getTranscriptById,
  deleteTranscriptById
} from "../../generated/elevenlabs/api/elevenLabsSpeechToTextAPI"

export type {
  SpeechToTextResult,
  GetTranscriptByIdResult,
  DeleteTranscriptByIdResult
} from "../../generated/elevenlabs/api/elevenLabsSpeechToTextAPI"

export type { SpeechToTextChunkResponseModel } from "../../generated/elevenlabs/schema/speechToTextChunkResponseModel"
