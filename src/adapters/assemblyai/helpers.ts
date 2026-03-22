import WebSocket from "ws"
import type {
  AudioChunk,
  ListTranscriptsOptions,
  StreamingCallbacks,
  StreamingSession,
  UnifiedTranscriptResponse
} from "../../router/types"
import type { SessionStatus } from "../shared-types"
import type { ListTranscriptsParams } from "../../generated/assemblyai/schema/listTranscriptsParams"
import type {
  StreamingEventMessage,
  StreamingForceEndpoint,
  StreamingUpdateConfiguration
} from "../../generated/assemblyai/streaming-types"
import { handleAssemblyAIWebSocketMessage } from "./mappers"

export function createAssemblyAIQueuedResponse(
  transcriptId: string,
  provider: "assemblyai",
  raw: unknown
): UnifiedTranscriptResponse {
  return {
    success: true,
    provider,
    data: {
      id: transcriptId,
      text: "",
      status: "queued"
    },
    raw
  }
}

export function buildAssemblyAIListParams(
  options?: ListTranscriptsOptions
): ListTranscriptsParams {
  const params: ListTranscriptsParams = {
    ...options?.assemblyai
  }

  if (options?.limit) {
    params.limit = options.limit
  }
  if (options?.status) {
    params.status = options.status as ListTranscriptsParams["status"]
  }
  if (options?.date) {
    params.created_on = options.date
  }

  return params
}

export async function createAssemblyAIStreamingSession(args: {
  apiKey: string
  provider: "assemblyai"
  wsUrl: string
  callbacks?: StreamingCallbacks
}): Promise<
  StreamingSession & {
    updateConfiguration?: (config: Partial<Omit<StreamingUpdateConfiguration, "type">>) => void
    forceEndpoint?: () => void
  }
> {
  const { apiKey, provider, wsUrl, callbacks } = args
  const ws = new WebSocket(wsUrl, {
    headers: {
      Authorization: apiKey
    }
  })

  let sessionStatus: SessionStatus = "connecting"
  const sessionId = `assemblyai-${Date.now()}-${Math.random().toString(36).substring(7)}`
  let audioBuffer = Buffer.alloc(0)
  const MIN_CHUNK_SIZE = 1600

  const flushAudioBuffer = () => {
    if (audioBuffer.length > 0 && ws.readyState === WebSocket.OPEN) {
      if (callbacks?.onRawMessage) {
        const audioPayload = audioBuffer.buffer.slice(
          audioBuffer.byteOffset,
          audioBuffer.byteOffset + audioBuffer.byteLength
        ) as ArrayBuffer
        callbacks.onRawMessage({
          provider,
          direction: "outgoing",
          timestamp: Date.now(),
          payload: audioPayload,
          messageType: "audio"
        })
      }

      ws.send(audioBuffer)
      audioBuffer = Buffer.alloc(0)
    }
  }

  ws.on("open", () => {
    sessionStatus = "open"
    callbacks?.onOpen?.()
  })

  ws.on("message", (data: Buffer) => {
    const rawPayload = data.toString()

    try {
      const message = JSON.parse(rawPayload) as StreamingEventMessage
      if (callbacks?.onRawMessage) {
        const messageType =
          "type" in message
            ? (message as { type: string }).type
            : "error" in message
              ? "Error"
              : undefined
        callbacks.onRawMessage({
          provider,
          direction: "incoming",
          timestamp: Date.now(),
          payload: rawPayload,
          messageType
        })
      }

      handleAssemblyAIWebSocketMessage(message, callbacks)
    } catch (error) {
      if (callbacks?.onRawMessage) {
        callbacks.onRawMessage({
          provider,
          direction: "incoming",
          timestamp: Date.now(),
          payload: rawPayload,
          messageType: "parse_error"
        })
      }

      callbacks?.onError?.({
        code: "PARSE_ERROR",
        message: "Failed to parse WebSocket message",
        details: error
      })
    }
  })

  ws.on("error", (error: Error) => {
    callbacks?.onError?.({
      code: "WEBSOCKET_ERROR",
      message: error.message,
      details: error
    })
  })

  ws.on("close", (code: number, reason: Buffer) => {
    sessionStatus = "closed"
    callbacks?.onClose?.(code, reason.toString())
  })

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("WebSocket connection timeout"))
    }, 10000)

    ws.once("open", () => {
      clearTimeout(timeout)
      resolve()
    })

    ws.once("error", (error) => {
      clearTimeout(timeout)
      reject(error)
    })
  })

  return {
    id: sessionId,
    provider,
    createdAt: new Date(),
    getStatus: () => sessionStatus,
    sendAudio: async (chunk: AudioChunk) => {
      if (sessionStatus !== "open") {
        throw new Error(`Cannot send audio: session is ${sessionStatus}`)
      }

      if (ws.readyState !== WebSocket.OPEN) {
        throw new Error("WebSocket is not open")
      }

      audioBuffer = Buffer.concat([audioBuffer, chunk.data])
      if (audioBuffer.length >= MIN_CHUNK_SIZE) {
        if (callbacks?.onRawMessage) {
          const audioPayload = audioBuffer.buffer.slice(
            audioBuffer.byteOffset,
            audioBuffer.byteOffset + audioBuffer.byteLength
          )
          callbacks.onRawMessage({
            provider,
            direction: "outgoing",
            timestamp: Date.now(),
            payload: audioPayload,
            messageType: "audio"
          })
        }

        ws.send(audioBuffer)
        audioBuffer = Buffer.alloc(0)
      }

      if (chunk.isLast) {
        flushAudioBuffer()
        const terminateMessage = JSON.stringify({ type: "Terminate" })
        if (callbacks?.onRawMessage) {
          callbacks.onRawMessage({
            provider,
            direction: "outgoing",
            timestamp: Date.now(),
            payload: terminateMessage,
            messageType: "Terminate"
          })
        }
        ws.send(terminateMessage)
      }
    },
    close: async () => {
      if (sessionStatus === "closed" || sessionStatus === "closing") {
        return
      }

      sessionStatus = "closing"
      flushAudioBuffer()

      if (ws.readyState === WebSocket.OPEN) {
        const terminateMessage = JSON.stringify({ type: "Terminate" })
        if (callbacks?.onRawMessage) {
          callbacks.onRawMessage({
            provider,
            direction: "outgoing",
            timestamp: Date.now(),
            payload: terminateMessage,
            messageType: "Terminate"
          })
        }
        ws.send(terminateMessage)
      }

      return new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          ws.terminate()
          resolve()
        }, 5000)

        ws.close()
        ws.once("close", () => {
          clearTimeout(timeout)
          sessionStatus = "closed"
          resolve()
        })
      })
    },
    updateConfiguration: (config: Partial<Omit<StreamingUpdateConfiguration, "type">>) => {
      if (ws.readyState !== WebSocket.OPEN) {
        throw new Error("Cannot update configuration: WebSocket is not open")
      }

      const updateMsg: StreamingUpdateConfiguration = {
        type: "UpdateConfiguration",
        ...config
      }
      ws.send(JSON.stringify(updateMsg))
    },
    forceEndpoint: () => {
      if (ws.readyState !== WebSocket.OPEN) {
        throw new Error("Cannot force endpoint: WebSocket is not open")
      }

      const forceMsg: StreamingForceEndpoint = {
        type: "ForceEndpoint"
      }
      ws.send(JSON.stringify(forceMsg))
    }
  }
}
