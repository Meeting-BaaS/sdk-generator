import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  FIELD_EQUIVALENCES,
  getCategoryFields,
  getEquivalentField,
  supportsCategory
} from "../../src/field-equivalences"
import { AllProviders } from "../../src/provider-metadata"

function sorted(values: readonly string[]): string[] {
  return [...values].sort()
}

describe("field equivalences", () => {
  it("uses the same canonical providers as public provider metadata", () => {
    const providers = sorted(AllProviders)

    for (const category of Object.values(FIELD_EQUIVALENCES)) {
      const categoryProviders = Object.keys(category.providers)

      expect(sorted(categoryProviders)).toEqual(providers)
      expect(categoryProviders).not.toContain("azure")
      expect(categoryProviders).not.toContain("openai")
    }
  })

  it("does not expose duplicate field names for any category/provider/mode", () => {
    for (const [categoryName, category] of Object.entries(FIELD_EQUIVALENCES)) {
      for (const [providerName, fields] of Object.entries(category.providers)) {
        for (const mode of ["transcription", "streaming"] as const) {
          const uniqueFields = new Set(fields[mode])

          expect(fields[mode], `${categoryName}.${providerName}.${mode}`).toHaveLength(
            uniqueFields.size
          )
        }
      }
    }
  })

  it("preserves nested field paths instead of exposing nested fields as top-level names", () => {
    const transcriptionFields = getCategoryFields("translation", "transcription")
    const streamingFields = getCategoryFields("translation", "streaming")

    expect(transcriptionFields.gladia).toContain("translation_config.target_languages")
    expect(transcriptionFields.gladia).not.toContain("target_languages")
    expect(streamingFields.gladia).toContain(
      "realtime_processing.translation_config.target_languages"
    )
    expect(streamingFields.gladia).not.toContain("target_languages")

    expect(transcriptionFields.assemblyai).toContain(
      "speech_understanding.request.translation.target_languages"
    )
    expect(transcriptionFields.assemblyai).not.toContain("target_languages")
  })

  it("documents the actual provider lookup shape in the generated example", () => {
    const source = readFileSync("src/field-equivalences.ts", "utf8")

    expect(source).toContain("FIELD_EQUIVALENCES.diarization.providers.deepgram.transcription[0]")
    expect(source).not.toContain("FIELD_EQUIVALENCES.diarization.deepgram.transcription[0]")
  })

  it("generates table-of-contents links that resolve to explicit markdown anchors", () => {
    const markdown = readFileSync("docs/FIELD_EQUIVALENCES.md", "utf8")
    const tocAnchors = [...markdown.matchAll(/^- \[[^\]]+\]\(#([^)]+)\)$/gm)].map(
      ([, anchor]) => anchor
    )
    const explicitAnchors = new Set(
      [...markdown.matchAll(/^<a id="([^"]+)"><\/a>$/gm)].map(([, anchor]) => anchor)
    )

    expect(tocAnchors).not.toHaveLength(0)
    for (const anchor of tocAnchors) {
      expect(explicitAnchors.has(anchor), anchor).toBe(true)
    }
  })

  it("exposes canonical helper lookups for renamed and newly covered providers", () => {
    const languageFields = getCategoryFields("language", "transcription")
    const modelFields = getCategoryFields("model", "transcription")

    expect(languageFields["azure-stt"]).toContain("locale")
    expect(languageFields["openai-whisper"]).toContain("language")
    expect(languageFields.elevenlabs).toContain("language_code")
    expect(modelFields.speechmatics).toContain("model")
    expect(modelFields.speechmatics).toContain("operating_point")

    expect(getEquivalentField("model", "elevenlabs", "transcription")).toBe("model_id")
    expect(getEquivalentField("model", "speechmatics", "transcription")).toBe("model")
    expect(supportsCategory("diarization", "elevenlabs", "transcription")).toBe(true)
    expect(supportsCategory("diarization", "openai-whisper", "transcription")).toBe(false)
  })

  it("does not classify Deepgram keyword controls as word timestamp fields", () => {
    const timestampFields = getCategoryFields("timestamps", "transcription")
    const streamingTimestampFields = getCategoryFields("timestamps", "streaming")

    expect(timestampFields.deepgram).not.toContain("filler_words")
    expect(timestampFields.deepgram).not.toContain("keywords")
    expect(streamingTimestampFields.deepgram).not.toContain("filler_words")
    expect(streamingTimestampFields.deepgram).not.toContain("keywords")
  })
})
