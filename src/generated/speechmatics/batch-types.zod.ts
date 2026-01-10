/**
 * Speechmatics Batch Zod Schemas
 * Extracted from generated speechmaticsASRRESTAPI.zod.ts for field configs
 *
 * @source specs/speechmatics-batch.yml
 * @see https://docs.speechmatics.com/jobsapi
 */

import { z as zod } from "zod"

/**
 * Speechmatics operating point enum
 */
export const speechmaticsOperatingPointSchema = zod.enum(["standard", "enhanced"])

/**
 * Speechmatics diarization enum
 */
export const speechmaticsDiarizationSchema = zod.enum(["none", "speaker", "channel"])

/**
 * Speechmatics max delay mode enum
 */
export const speechmaticsMaxDelayModeSchema = zod.enum(["fixed", "flexible"])

/**
 * Speechmatics transcription config for batch jobs
 * Contains all transcription-specific settings
 */
export const batchTranscriptionParams = zod.object({
  language: zod
    .string()
    .describe("Language model to process the audio input, normally specified as an ISO language code"),
  domain: zod
    .string()
    .optional()
    .describe('Request a specialized model based on "language" but optimized for a particular field'),
  output_locale: zod
    .string()
    .optional()
    .describe("Language locale to be used when generating the transcription output"),
  operating_point: speechmaticsOperatingPointSchema
    .optional()
    .describe("Transcription operating point - standard or enhanced accuracy"),
  diarization: speechmaticsDiarizationSchema
    .optional()
    .describe("Specify whether speaker or channel labels are added to the transcript"),
  enable_entities: zod
    .boolean()
    .optional()
    .describe("Include additional entity objects in the transcription results (dates, numbers, etc)"),
  max_delay_mode: speechmaticsMaxDelayModeSchema
    .optional()
    .describe("Whether to enable flexible endpointing for entities")
})

/**
 * Speechmatics list jobs query params
 */
export const listJobsQueryParams = zod.object({
  created_before: zod
    .string()
    .datetime({})
    .optional()
    .describe("UTC Timestamp cursor for paginating request response"),
  limit: zod
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Limit for paginating the request response. Defaults to 100."),
  include_deleted: zod
    .boolean()
    .optional()
    .describe("Specifies whether deleted jobs should be included in the response")
})
