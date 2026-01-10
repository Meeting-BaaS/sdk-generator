/**
 * Speechmatics Streaming Zod Schemas
 * AUTO-GENERATED from AsyncAPI spec - DO NOT EDIT MANUALLY
 *
 * @source specs/speechmatics-asyncapi.yml
 * @version 2.0.0
 * @see https://docs.speechmatics.com/rt-api-ref
 *
 * Regenerate with: pnpm openapi:sync-speechmatics-streaming
 */

import { z as zod } from "zod"

/**
 * Speechmatics audio encoding formats
 * @source RawAudioEncodingEnum from AsyncAPI spec
 */
export const speechmaticsAudioEncodingSchema = zod.enum(["pcm_f32le", "pcm_s16le", "mulaw"])

/**
 * Speechmatics transcription config
 * @source TranscriptionConfig from AsyncAPI spec
 */
export const speechmaticsTranscriptionConfigSchema = zod.object({
  language: zod
    .string()
    .describe(
      "Language model to process the audio input, normally specified as an ISO language code. The value must be consistent with the language code used in the API endpoint URL."
    ),
  domain: zod
    .string()
    .optional()
    .describe(
      "Request a specialized model based on 'language' but optimized for a particular field, e.g. `finance` or `medical`."
    ),
  output_locale: zod
    .unknown() /* TODO: resolve OutputLocale */
    .optional(),
  additional_vocab: zod
    .unknown() /* TODO: resolve VocabList */
    .optional(),
  diarization: zod
    .unknown() /* TODO: resolve DiarizationConfig */
    .optional(),
  max_delay: zod
    .number()
    .min(0.7)
    .max(4)
    .optional()
    .describe(
      "This is the delay in seconds between the end of a spoken word and returning the Final transcript results. See [Latency](https://docs.speechmatics.com/speech-to-text/realtime/output#latency) for more details"
    ),
  max_delay_mode: zod.enum(["flexible", "fixed"]).optional(),
  speaker_diarization_config: zod
    .unknown() /* TODO: resolve SpeakerDiarizationConfig */
    .optional(),
  audio_filtering_config: zod
    .unknown() /* TODO: resolve AudioFilteringConfig */
    .optional(),
  transcript_filtering_config: zod
    .unknown() /* TODO: resolve TranscriptFilteringConfig */
    .optional(),
  enable_partials: zod
    .boolean()
    .optional()
    .describe(
      "Whether or not to send Partials (i.e. `AddPartialTranslation` messages) as well as Finals (i.e. `AddTranslation` messages) See [Partial transcripts](https://docs.speechmatics.com/speech-to-text/realtime/output#partial-transcripts)."
    ),
  enable_entities: zod.boolean().optional(),
  operating_point: zod.enum(["standard", "enhanced"]).optional(),
  punctuation_overrides: zod
    .unknown() /* TODO: resolve PunctuationOverrides */
    .optional(),
  conversation_config: zod
    .unknown() /* TODO: resolve ConversationConfig */
    .optional()
})

/**
 * Speechmatics mid-session update config
 * @source MidSessionTranscriptionConfig from AsyncAPI spec
 */
export const speechmaticsMidSessionConfigSchema = zod.object({
  language: zod
    .string()
    .optional()
    .describe(
      "Language model to process the audio input, normally specified as an ISO language code. The value must be consistent with the language code used in the API endpoint URL."
    ),
  max_delay: zod
    .number()
    .min(0.7)
    .max(4)
    .optional()
    .describe(
      "This is the delay in seconds between the end of a spoken word and returning the Final transcript results. See [Latency](https://docs.speechmatics.com/speech-to-text/realtime/output#latency) for more details"
    ),
  max_delay_mode: zod.enum(["flexible", "fixed"]).optional(),
  audio_filtering_config: zod
    .unknown() /* TODO: resolve AudioFilteringConfig */
    .optional(),
  enable_partials: zod
    .boolean()
    .optional()
    .describe(
      "Whether or not to send Partials (i.e. `AddPartialTranslation` messages) as well as Finals (i.e. `AddTranslation` messages) See [Partial transcripts](https://docs.speechmatics.com/speech-to-text/realtime/output#partial-transcripts)."
    ),
  conversation_config: zod
    .unknown() /* TODO: resolve ConversationConfig */
    .optional()
})

/**
 * Speechmatics speaker diarization config
 * @source SpeakerDiarizationConfig from AsyncAPI spec
 */
export const speechmaticsSpeakerDiarizationConfigSchema = zod.object({
  max_speakers: zod
    .number()
    .min(2)
    .max(100)
    .optional()
    .describe(
      "Configure the maximum number of speakers to detect. See [Max Speakers](http://docs.speechmatics.com/speech-to-text/features/diarization#max-speakers)."
    ),
  prefer_current_speaker: zod
    .boolean()
    .optional()
    .describe(
      "When set to `true`, reduces the likelihood of incorrectly switching between similar sounding speakers. See [Prefer Current Speaker](https://docs.speechmatics.com/speech-to-text/features/diarization#prefer-current-speaker)."
    ),
  speaker_sensitivity: zod.number().min(0).max(1).optional(),
  speakers: zod
    .array(zod.unknown() /* TODO: resolve SpeakersInputItem */)
    .optional()
    .describe(
      "Use this option to provide speaker labels linked to their speaker identifiers. When passed, the transcription system will tag spoken words in the transcript with the provided speaker labels whenever any of the specified speakers is detected in the audio. :::note This feature is currently in [preview mode](https://docs.speechmatics.com/private/preview-mode). :::"
    )
})

/**
 * Speechmatics conversation config (VAD/end-of-utterance)
 * @source ConversationConfig from AsyncAPI spec
 */
export const speechmaticsConversationConfigSchema = zod.object({
  end_of_utterance_silence_trigger: zod.number().min(0).max(2).optional()
})

/**
 * Speechmatics audio filtering config
 * @source AudioFilteringConfig from AsyncAPI spec
 */
export const speechmaticsAudioFilteringConfigSchema = zod.object({
  volume_threshold: zod.number().min(0).max(100).optional()
})

/**
 * Speechmatics streaming transcriber params (flattened)
 * Combined from StartRecognition message structure
 */
export const streamingTranscriberParams = zod.object({
  encoding: speechmaticsAudioEncodingSchema.optional().describe("Audio encoding format"),
  sample_rate: zod.number().optional().describe("Audio sample rate in Hz"),
  language: zod
    .string()
    .describe(
      "Language model to process the audio input, normally specified as an ISO language code. The value must be consistent with the language code used in the API endpoint URL."
    ),
  domain: zod
    .string()
    .optional()
    .describe(
      "Request a specialized model based on 'language' but optimized for a particular field, e.g. `finance` or `medical`."
    ),
  max_delay: zod
    .number()
    .min(0.7)
    .max(4)
    .optional()
    .describe(
      "This is the delay in seconds between the end of a spoken word and returning the Final transcript results. See [Latency](https://docs.speechmatics.com/speech-to-text/realtime/output#latency) for more details"
    ),
  max_delay_mode: zod.enum(["flexible", "fixed"]).optional(),
  enable_partials: zod
    .boolean()
    .optional()
    .describe(
      "Whether or not to send Partials (i.e. `AddPartialTranslation` messages) as well as Finals (i.e. `AddTranslation` messages) See [Partial transcripts](https://docs.speechmatics.com/speech-to-text/realtime/output#partial-transcripts)."
    ),
  enable_entities: zod.boolean().optional(),
  operating_point: zod.enum(["standard", "enhanced"]).optional()
})

/**
 * Speechmatics mid-session update params
 * Can be sent via SetRecognitionConfig message
 */
export const streamingUpdateConfigParams = zod.object({
  language: zod
    .string()
    .optional()
    .describe(
      "Language model to process the audio input, normally specified as an ISO language code. The value must be consistent with the language code used in the API endpoint URL."
    ),
  max_delay: zod
    .number()
    .min(0.7)
    .max(4)
    .optional()
    .describe(
      "This is the delay in seconds between the end of a spoken word and returning the Final transcript results. See [Latency](https://docs.speechmatics.com/speech-to-text/realtime/output#latency) for more details"
    ),
  max_delay_mode: zod.enum(["flexible", "fixed"]).optional(),
  enable_partials: zod
    .boolean()
    .optional()
    .describe(
      "Whether or not to send Partials (i.e. `AddPartialTranslation` messages) as well as Finals (i.e. `AddTranslation` messages) See [Partial transcripts](https://docs.speechmatics.com/speech-to-text/realtime/output#partial-transcripts)."
    )
})
