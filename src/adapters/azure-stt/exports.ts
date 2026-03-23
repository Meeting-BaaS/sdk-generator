export {
  transcriptionsCreate,
  transcriptionsDelete,
  transcriptionsGet,
  transcriptionsList,
  transcriptionsListFiles,
  webHooksCreate,
  webHooksDelete,
  webHooksList
} from "../../generated/azure/api/speechServicesAPIVersion32"

export type {
  PaginatedTranscriptions
} from "../../generated/azure/schema/paginatedTranscriptions"
export type { Transcription } from "../../generated/azure/schema/transcription"
export type { TranscriptionsListParams } from "../../generated/azure/schema/transcriptionsListParams"
export type { WebHook } from "../../generated/azure/schema/webHook"
export type { WebHookEvents } from "../../generated/azure/schema/webHookEvents"

export { LanguageIdentificationMode } from "../../generated/azure/schema/languageIdentificationMode"
export type { TranscriptionProperties } from "../../generated/azure/schema/transcriptionProperties"
export type {
  LanguageIdentificationProperties
} from "../../generated/azure/schema/languageIdentificationProperties"
export { Status as AzureStatus } from "../../generated/azure/schema/status"
export { ProfanityFilterMode } from "../../generated/azure/schema/profanityFilterMode"
export { PunctuationMode } from "../../generated/azure/schema/punctuationMode"
