import { Buffer } from "node:buffer"
import { describe, expect, it } from "vitest"
import { toArrayBuffer, toAudioBlob } from "../../src/utils/blob-helpers"

describe("blob helpers", () => {
  it("creates Blob-safe audio from Node buffers", async () => {
    const blob = toAudioBlob(Buffer.from([1, 2, 3]), "audio/wav")

    expect(blob.type).toBe("audio/wav")
    expect([...new Uint8Array(await blob.arrayBuffer())]).toEqual([1, 2, 3])
  })

  it.each([
    ["ArrayBuffer", new Uint8Array([1, 2, 3]).buffer],
    ["typed array", new Uint8Array([1, 2, 3])],
    ["Blob", new Blob([new Uint8Array([1, 2, 3])])]
  ])("normalizes %s binary data", async (_label, input) => {
    const result = await toArrayBuffer(input)

    expect(result).toBeInstanceOf(ArrayBuffer)
    expect([...new Uint8Array(result)]).toEqual([1, 2, 3])
  })
})
