function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.byteLength)
  new Uint8Array(arrayBuffer).set(buffer)
  return arrayBuffer
}

export function toAudioBlob(file: Buffer | Blob, mimeType = "audio/wav"): Blob {
  return file instanceof Blob ? file : new Blob([bufferToArrayBuffer(file)], { type: mimeType })
}

export async function toArrayBuffer(
  data: ArrayBuffer | ArrayBufferView | Blob
): Promise<ArrayBuffer> {
  if (data instanceof ArrayBuffer) return data
  if (data instanceof Blob) return data.arrayBuffer()

  const arrayBuffer = new ArrayBuffer(data.byteLength)
  new Uint8Array(arrayBuffer).set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength))
  return arrayBuffer
}
