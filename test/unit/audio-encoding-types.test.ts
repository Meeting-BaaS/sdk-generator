import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import * as routerExports from "../../src/router"
import {
  ASSEMBLYAI_ENCODING_MAP,
  DEEPGRAM_ENCODING_MAP,
  GLADIA_ENCODING_MAP,
  mapEncodingToProvider,
  validateAudioConfig
} from "../../src/router/audio-encoding-types"

function nullPrototypeObject(): object {
  return Object.create(null)
}

function unformattableObject(): object {
  return {
    [Symbol.toPrimitive]() {
      throw new Error("cannot stringify")
    },
    get [Symbol.toStringTag]() {
      throw new Error("cannot inspect")
    }
  }
}

describe("audio encoding router helpers", () => {
  it("exposes audio encoding helpers from the router barrel", () => {
    expect(routerExports).toHaveProperty("mapEncodingToProvider")
    expect(routerExports).toHaveProperty("validateAudioConfig")
  })

  it("maps unified encodings to provider-specific streaming encodings", () => {
    expect(mapEncodingToProvider("linear16", "gladia")).toBe("wav/pcm")
    expect(mapEncodingToProvider("mulaw", "gladia")).toBe("wav/ulaw")
    expect(mapEncodingToProvider("alaw", "gladia")).toBe("wav/alaw")

    expect(mapEncodingToProvider("linear16", "deepgram")).toBe("linear16")
    expect(mapEncodingToProvider("flac", "deepgram")).toBe("flac")
    expect(mapEncodingToProvider("g729", "deepgram")).toBe("g729")

    expect(mapEncodingToProvider("linear16", "assemblyai")).toBe("pcm_s16le")
    expect(mapEncodingToProvider("mulaw", "assemblyai")).toBe("pcm_mulaw")
    expect(mapEncodingToProvider("opus", "assemblyai")).toBe("opus")
  })

  it("exposes runtime-immutable encoding maps", () => {
    expect(Object.isFrozen(GLADIA_ENCODING_MAP)).toBe(true)
    expect(Object.isFrozen(DEEPGRAM_ENCODING_MAP)).toBe(true)
    expect(Object.isFrozen(ASSEMBLYAI_ENCODING_MAP)).toBe(true)
  })

  it("rejects provider-unsupported encodings with supported values", () => {
    expect(() => mapEncodingToProvider("flac", "gladia")).toThrow(
      "Encoding 'flac' is not supported by gladia. Supported encodings: linear16, mulaw, alaw"
    )
    expect(() => mapEncodingToProvider("flac", "assemblyai")).toThrow(
      "Encoding 'flac' is not supported by assemblyai. Supported encodings: linear16, mulaw, opus"
    )
  })

  it("rejects inherited object property names as encodings", () => {
    expect(() => mapEncodingToProvider("toString" as never, "gladia")).toThrow(
      "Encoding 'toString' is not supported by gladia"
    )
    expect(() => validateAudioConfig({ encoding: "toString" as never }, "gladia")).toThrow(
      "Encoding 'toString' is not supported by gladia"
    )
  })

  it("rejects symbol runtime values with explicit validation errors", () => {
    expect(() => mapEncodingToProvider(Symbol("linear16") as never, "gladia")).toThrow(
      "Encoding 'Symbol(linear16)' is not supported by gladia"
    )
    expect(() =>
      mapEncodingToProvider(
        "linear16",
        Symbol("gladia") as unknown as Parameters<typeof mapEncodingToProvider>[1]
      )
    ).toThrow("Encoding provider 'Symbol(gladia)' is not supported")
  })

  it("rejects null-prototype runtime values with explicit validation errors", () => {
    expect(() => mapEncodingToProvider(nullPrototypeObject() as never, "gladia")).toThrow(
      "Encoding '[object Object]' is not supported by gladia"
    )
    expect(() =>
      mapEncodingToProvider(
        "linear16",
        nullPrototypeObject() as unknown as Parameters<typeof mapEncodingToProvider>[1]
      )
    ).toThrow("Encoding provider '[object Object]' is not supported")
  })

  it("rejects unformattable runtime values with explicit validation errors", () => {
    expect(() => mapEncodingToProvider(unformattableObject() as never, "gladia")).toThrow(
      "Encoding '<unprintable value>' is not supported by gladia"
    )
    expect(() =>
      mapEncodingToProvider(
        "linear16",
        unformattableObject() as unknown as Parameters<typeof mapEncodingToProvider>[1]
      )
    ).toThrow("Encoding provider '<unprintable value>' is not supported")
  })

  it("rejects unsupported runtime providers with a clear error", () => {
    expect(() =>
      mapEncodingToProvider(
        "linear16",
        "speechmatics" as unknown as Parameters<typeof mapEncodingToProvider>[1]
      )
    ).toThrow("Encoding provider 'speechmatics' is not supported")
  })

  it("validates audio config shape and provider-specific constraints", () => {
    expect(() => validateAudioConfig({ encoding: "linear16", channels: 8 }, "gladia")).not.toThrow()
    expect(() => validateAudioConfig({ encoding: "flac" }, "deepgram")).not.toThrow()

    expect(() => validateAudioConfig(null as never, "gladia")).toThrow(
      "Audio config must be an object"
    )
    expect(() => validateAudioConfig([] as never, "gladia")).toThrow(
      "Audio config must be an object"
    )
    expect(() => validateAudioConfig({ encoding: "" as never }, "gladia")).toThrow(
      "Encoding '' is not supported by gladia"
    )
    expect(() => validateAudioConfig({ channels: 0 as never }, "gladia")).toThrow(
      "Gladia supports 1-8 audio channels"
    )
    expect(() => validateAudioConfig({ channels: 1.5 as never }, "gladia")).toThrow(
      "Gladia supports 1-8 audio channels"
    )
    expect(() => validateAudioConfig({ channels: "2" as never }, "gladia")).toThrow(
      "Gladia supports 1-8 audio channels"
    )
    expect(() => validateAudioConfig({ channels: 9 as never }, "gladia")).toThrow(
      "Gladia supports 1-8 audio channels"
    )
  })

  it("ignores inherited audio config fields", () => {
    expect(() =>
      validateAudioConfig(
        Object.create({
          encoding: "flac",
          sampleRate: 12345,
          channels: 9,
          bitDepth: 12
        }),
        "gladia"
      )
    ).not.toThrow()
  })

  it("does not read inherited audio config getters", () => {
    const inheritedEncoding = {
      get encoding() {
        throw new Error("inherited encoding getter called")
      },
      get sampleRate() {
        throw new Error("inherited sampleRate getter called")
      },
      get channels() {
        throw new Error("inherited channels getter called")
      },
      get bitDepth() {
        throw new Error("inherited bitDepth getter called")
      }
    }

    expect(() => validateAudioConfig(Object.create(inheritedEncoding), "gladia")).not.toThrow()
  })

  it("does not read own audio config accessors", () => {
    const config = {} as Parameters<typeof validateAudioConfig>[0]
    Object.defineProperties(config, {
      encoding: {
        enumerable: true,
        get() {
          throw new Error("own encoding getter called")
        }
      },
      sampleRate: {
        enumerable: true,
        get() {
          throw new Error("own sampleRate getter called")
        }
      },
      channels: {
        enumerable: true,
        get() {
          throw new Error("own channels getter called")
        }
      },
      bitDepth: {
        enumerable: true,
        get() {
          throw new Error("own bitDepth getter called")
        }
      }
    })

    expect(() => validateAudioConfig(config, "gladia")).not.toThrow()
  })

  it("validates standard channel values for every supported encoding provider", () => {
    expect(() => validateAudioConfig({ channels: 8 }, "deepgram")).not.toThrow()
    expect(() => validateAudioConfig({ channels: 1 }, "assemblyai")).not.toThrow()

    expect(() => validateAudioConfig({ channels: 0 as never }, "deepgram")).toThrow(
      "Audio channels must be one of: 1, 2, 3, 4, 5, 6, 7, 8"
    )
    expect(() => validateAudioConfig({ channels: 1.5 as never }, "deepgram")).toThrow(
      "Audio channels must be one of: 1, 2, 3, 4, 5, 6, 7, 8"
    )
    expect(() => validateAudioConfig({ channels: "2" as never }, "assemblyai")).toThrow(
      "Audio channels must be one of: 1, 2, 3, 4, 5, 6, 7, 8"
    )
    expect(() => validateAudioConfig({ channels: 9 as never }, "assemblyai")).toThrow(
      "Audio channels must be one of: 1, 2, 3, 4, 5, 6, 7, 8"
    )
  })

  it("allows numeric sample rates while validating standard bit depths", () => {
    expect(() => validateAudioConfig({ sampleRate: 16000, bitDepth: 16 }, "gladia")).not.toThrow()
    expect(() => validateAudioConfig({ sampleRate: 22050 }, "deepgram")).not.toThrow()
    expect(() => validateAudioConfig({ sampleRate: 24000 }, "assemblyai")).not.toThrow()
    expect(() => validateAudioConfig({ sampleRate: 12345 }, "gladia")).not.toThrow()

    expect(() => validateAudioConfig({ sampleRate: 0 as never }, "gladia")).toThrow(
      "Sample rate must be a positive integer"
    )
    expect(() => validateAudioConfig({ sampleRate: 1.5 as never }, "gladia")).toThrow(
      "Sample rate must be a positive integer"
    )
    expect(() => validateAudioConfig({ sampleRate: "16000" as never }, "gladia")).toThrow(
      "Sample rate must be a positive integer"
    )
    expect(() => validateAudioConfig({ bitDepth: 12 as never }, "gladia")).toThrow(
      "Bit depth must be one of: 8, 16, 24, 32"
    )
    expect(() => validateAudioConfig({ bitDepth: "16" as never }, "gladia")).toThrow(
      "Bit depth must be one of: 8, 16, 24, 32"
    )
  })

  it("keeps public router sample-rate guidance aligned with numeric pass-through", () => {
    const voiceRouterSource = readFileSync("src/router/voice-router.ts", "utf8")
    const typesSource = readFileSync("src/router/types.ts", "utf8")

    expect(voiceRouterSource).not.toContain("Only 8000, 16000, 32000, 44100, 48000")
    expect(voiceRouterSource).not.toContain("Only supported sample rates")
    expect(voiceRouterSource).toContain("Positive integer Hz pass-through")
    expect(voiceRouterSource).toContain("Gladia OpenAPI sample-rate enum")
    expect(typesSource).toContain("22050, 24000")
    expect(typesSource).toContain("Positive integer values are passed through")
    expect(typesSource).toContain("individual providers may enforce narrower")
  })
})
