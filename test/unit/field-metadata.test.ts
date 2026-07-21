import { describe, expect, it } from "vitest"
import {
  AssemblyAIAdapter,
  AzureSTTAdapter,
  DeepgramAdapter,
  ElevenLabsAdapter,
  GladiaAdapter,
  OpenAIWhisperAdapter,
  SonioxAdapter,
  SpeechmaticsAdapter
} from "../../src/adapters"
import { OpenAILanguageCodes } from "../../src/constants"
import {
  type CanonicalFieldConfigProvider,
  getAllFieldConfigs,
  getProviderFieldConfigs
} from "../../src/field-configs"
import { PROVIDER_FIELDS } from "../../src/field-metadata"
import { TranscriptLanguageCode } from "../../src/generated/assemblyai/schema/transcriptLanguageCode"
import { AzureLocaleCodes } from "../../src/generated/azure/locales"
import { DeepgramLanguageCodes as GeneratedDeepgramLanguageCodes } from "../../src/generated/deepgram/languages"
import { ElevenLabsLanguageCodes } from "../../src/generated/elevenlabs/languages"
import { TranscriptionLanguageCodeEnum } from "../../src/generated/gladia/schema/transcriptionLanguageCodeEnum"
import { SonioxLanguageCodes } from "../../src/generated/soniox/languages"
import { SpeechmaticsLanguageCodes } from "../../src/generated/speechmatics/languages"
import {
  AllLanguageCodes,
  AllProviders,
  BatchOnlyProviders,
  ProviderCapabilitiesMap,
  ProviderDisplayNames,
  ProviderDocs,
  ProviderWebsites,
  StreamingProviders
} from "../../src/provider-metadata"

function sorted(values: readonly string[]): string[] {
  return [...values].sort()
}

interface FieldMetadataLike {
  readonly name: string
  readonly options?: readonly (string | number)[]
  readonly nestedFields?: readonly FieldMetadataLike[]
}

function findField(
  fields: readonly FieldMetadataLike[],
  path: readonly string[]
): FieldMetadataLike {
  const [name, ...rest] = path
  const field = fields.find((candidate) => candidate.name === name)

  if (!field) {
    throw new Error(`Missing field metadata path: ${path.join(".")}`)
  }

  if (rest.length === 0) {
    return field
  }

  if (!field.nestedFields) {
    throw new Error(`Missing nested field metadata under: ${name}`)
  }

  return findField(field.nestedFields, rest)
}

describe("provider field metadata", () => {
  it("keeps public provider metadata aligned with supported providers", () => {
    const providers = sorted(AllProviders)
    const fieldConfigs = getAllFieldConfigs()

    expect(sorted(Object.keys(ProviderCapabilitiesMap))).toEqual(providers)
    expect(sorted(Object.keys(AllLanguageCodes))).toEqual(providers)
    expect(sorted(Object.keys(ProviderDisplayNames))).toEqual(providers)
    expect(sorted(Object.keys(ProviderDocs))).toEqual(providers)
    expect(sorted(Object.keys(ProviderWebsites))).toEqual(providers)
    expect(sorted(Object.keys(fieldConfigs))).toEqual(providers)
    expect(sorted(Object.keys(PROVIDER_FIELDS))).toEqual(providers)

    for (const provider of AllProviders) {
      const fieldProvider = provider as CanonicalFieldConfigProvider
      const staticProvider = provider as keyof typeof PROVIDER_FIELDS

      expect(ProviderDisplayNames[provider]).toBeTruthy()
      expect(ProviderDocs[provider]).toMatch(/^https:\/\//)
      expect(ProviderWebsites[provider]).toMatch(/^https:\/\//)
      expect(AllLanguageCodes[provider].length).toBeGreaterThan(0)

      expect(fieldConfigs[fieldProvider].provider).toBe(provider)
      expect(fieldConfigs[fieldProvider].transcription.length).toBeGreaterThan(0)
      expect(PROVIDER_FIELDS[staticProvider].transcription.length).toBeGreaterThan(0)
    }
  })

  it("keeps public capability metadata aligned with adapter declarations", () => {
    const adapters = [
      new GladiaAdapter(),
      new AssemblyAIAdapter(),
      new DeepgramAdapter(),
      new OpenAIWhisperAdapter(),
      new AzureSTTAdapter(),
      new SpeechmaticsAdapter(),
      new SonioxAdapter(),
      new ElevenLabsAdapter()
    ]

    for (const adapter of adapters) {
      expect(ProviderCapabilitiesMap[adapter.name]).toEqual(adapter.capabilities)
    }
  })

  it("keeps provider lists aligned with adapters and capabilities", () => {
    const adapters = [
      new GladiaAdapter(),
      new AssemblyAIAdapter(),
      new DeepgramAdapter(),
      new OpenAIWhisperAdapter(),
      new AzureSTTAdapter(),
      new SpeechmaticsAdapter(),
      new SonioxAdapter(),
      new ElevenLabsAdapter()
    ]
    const providers = sorted(AllProviders)

    expect(sorted(adapters.map((adapter) => adapter.name))).toEqual(providers)
    expect(sorted(StreamingProviders)).toEqual(
      sorted(AllProviders.filter((provider) => ProviderCapabilitiesMap[provider].streaming))
    )
    expect(sorted(BatchOnlyProviders)).toEqual(
      sorted(AllProviders.filter((provider) => !ProviderCapabilitiesMap[provider].streaming))
    )
    expect(new Set([...StreamingProviders, ...BatchOnlyProviders])).toEqual(new Set(AllProviders))
  })

  it("uses generated Deepgram language metadata", () => {
    expect(AllLanguageCodes.deepgram).toEqual(GeneratedDeepgramLanguageCodes)
  })

  it("keeps generated language field options aligned with current TypeScript sources", () => {
    const checks = [
      {
        fields: PROVIDER_FIELDS.gladia.transcription,
        path: ["language_config", "languages"],
        expected: Object.values(TranscriptionLanguageCodeEnum)
      },
      {
        fields: PROVIDER_FIELDS.assemblyai.transcription,
        path: ["language_code"],
        expected: Object.values(TranscriptLanguageCode)
      },
      {
        fields: PROVIDER_FIELDS.deepgram.transcription,
        path: ["language"],
        expected: GeneratedDeepgramLanguageCodes
      },
      {
        fields: PROVIDER_FIELDS["openai-whisper"].transcription,
        path: ["language"],
        expected: OpenAILanguageCodes
      },
      {
        fields: PROVIDER_FIELDS["azure-stt"].transcription,
        path: ["locale"],
        expected: AzureLocaleCodes
      },
      {
        fields: PROVIDER_FIELDS.elevenlabs.transcription,
        path: ["language_code"],
        expected: ElevenLabsLanguageCodes
      },
      {
        fields: PROVIDER_FIELDS.speechmatics.transcription,
        path: ["language"],
        expected: SpeechmaticsLanguageCodes
      },
      {
        fields: PROVIDER_FIELDS.soniox.transcription,
        path: ["language_hints"],
        expected: SonioxLanguageCodes
      }
    ] as const

    for (const { fields, path, expected } of checks) {
      expect(findField(fields, path).options, path.join(".")).toEqual(expected)
    }
  })

  it("keeps azure as a backwards-compatible field config alias", () => {
    expect(getProviderFieldConfigs("azure").provider).toBe("azure-stt")
    expect(getProviderFieldConfigs("azure-stt").provider).toBe("azure-stt")
  })
})
