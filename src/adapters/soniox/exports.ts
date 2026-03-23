export {
  createTranscription as createSonioxTranscription,
  getTranscription as getSonioxTranscription,
  deleteTranscription as deleteSonioxTranscription,
  getFiles as getSonioxFiles,
  uploadFile as uploadSonioxFile,
  getFile as getSonioxFile
} from "../../generated/soniox/api/sonioxPublicAPI"

export type {
  CreateTranscriptionResult as CreateSonioxTranscriptionResult,
  GetTranscriptionResult as GetSonioxTranscriptionResult,
  DeleteTranscriptionResult as DeleteSonioxTranscriptionResult,
  GetFilesResult as GetSonioxFilesResult,
  UploadFileResult as UploadSonioxFileResult,
  GetFileResult as GetSonioxFileResult
} from "../../generated/soniox/api/sonioxPublicAPI"
