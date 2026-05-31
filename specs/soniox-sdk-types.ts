/**
 * Soniox SDK-mapped types and classes exposed through this SDK's import surface.
 *
 * These are aliases/wrappers around the official `@soniox/node` exports so
 * consumers can stay on `voice-router-dev` imports consistently.
 */

export {
  FetchHttpClient as SonioxFetchHttpClient,
  RealtimeSttSession,
  SonioxNodeClient
} from "@soniox/node"

export type {
  CleanupTarget as SonioxCleanupTarget,
  ISonioxTranscript as SonioxTranscript,
  ISonioxTranscription as SonioxTranscription,
  RealtimeResult as SonioxRealtimeResult,
  RealtimeToken as SonioxRealtimeToken,
  SonioxLanguage as SonioxSdkLanguage,
  SonioxModel as SonioxSdkModel,
  SonioxNodeClientOptions,
  SttSessionConfig as SonioxSttSessionConfig,
  SttSessionOptions as SonioxSttSessionOptions,
  TranscriptionContext as SonioxTranscriptionContext,
  TranslationConfig as SonioxSdkTranslationConfig,
  WaitOptions as SonioxWaitOptions
} from "@soniox/node"
