import axios, { type AxiosInstance } from "axios"
import WebSocket from "ws"
import type { ProviderConfig } from "../base-adapter"
import type {
  AudioInput,
  ListTranscriptsOptions,
  StreamingCallbacks,
  StreamingSession,
  UnifiedTranscriptResponse
} from "../../router/types"
import type { SessionStatus } from "../shared-types"
import type { ListenV1Response } from "../../generated/deepgram/schema/listenV1Response"
import type { ListenV1MediaTranscribeParams } from "../../generated/deepgram/schema/listenV1MediaTranscribeParams"
import type { ManageV1ProjectsRequestsListParams } from "../../generated/deepgram/schema/manageV1ProjectsRequestsListParams"
import { ManageV1FilterStatusParameter } from "../../generated/deepgram/schema/manageV1FilterStatusParameter"
import { ManageV1FilterEndpointParameter } from "../../generated/deepgram/schema/manageV1FilterEndpointParameter"
import {
  buildDeepgramStreamingUrl,
  handleDeepgramWebSocketMessage,
  type DeepgramRealtimeMessage
} from "./mappers"
import {
  closeWebSocket,
  setupWebSocketHandlers,
  validateSessionForAudio,
  waitForWebSocketOpen
} from "../../utils/websocket-helpers"

export function createDeepgramClient(
  baseUrl: string,
  config: Pick<ProviderConfig, "apiKey" | "timeout" | "headers">
): AxiosInstance {
  return axios.create({
    baseURL: baseUrl,
    timeout: config.timeout ?? 60000,
    headers: {
      Authorization: `Token ${config.apiKey}`,
      "Content-Type": "application/json",
      ...config.headers
    }
  })
}

export async function submitDeepgramTranscription(
  client: AxiosInstance,
  audio: AudioInput,
  params: ListenV1MediaTranscribeParams
): Promise<ListenV1Response> {
  if (audio.type === "url") {
    return await client
      .post<ListenV1Response>("/listen", { url: audio.url }, { params })
      .then((res) => res.data)
  }

  if (audio.type === "file") {
    return await client
      .post<ListenV1Response>("/listen", audio.file, {
        params,
        headers: {
          "Content-Type": "audio/*"
        }
      })
      .then((res) => res.data)
  }

  throw new Error(
    "Deepgram adapter does not support stream type for pre-recorded transcription. Use transcribeStream() for real-time streaming."
  )
}

export function createDeepgramProjectIdError(
  provider: "deepgram",
  action: "getTranscript" | "listTranscripts"
): UnifiedTranscriptResponse {
  return {
    success: false,
    provider,
    error: {
      code: "MISSING_PROJECT_ID",
      message: `Deepgram ${action} requires projectId. Initialize with: { apiKey, projectId }`
    }
  }
}

export function buildDeepgramListParams(
  options?: ListTranscriptsOptions
): ManageV1ProjectsRequestsListParams {
  const params: ManageV1ProjectsRequestsListParams = {
    endpoint: ManageV1FilterEndpointParameter.listen,
    ...options?.deepgram
  }

  if (options?.limit) params.limit = options.limit
  if (options?.afterDate) params.start = options.afterDate
  if (options?.beforeDate) params.end = options.beforeDate
  if (options?.status) {
    const statusMap: Record<string, ManageV1FilterStatusParameter> = {
      completed: ManageV1FilterStatusParameter.succeeded,
      succeeded: ManageV1FilterStatusParameter.succeeded,
      error: ManageV1FilterStatusParameter.failed,
      failed: ManageV1FilterStatusParameter.failed
    }
    params.status = statusMap[options.status.toLowerCase()]
  }

  return params
}

export async function createDeepgramStreamingSession(args: {
  apiKey: string
  provider: "deepgram"
  wsBaseUrl: string
  options?: Parameters<typeof buildDeepgramStreamingUrl>[1]
  callbacks?: StreamingCallbacks
}): Promise<StreamingSession> {
  const { apiKey, provider, wsBaseUrl, options, callbacks } = args
  const wsUrl = buildDeepgramStreamingUrl(wsBaseUrl, options)
  const ws = new WebSocket(wsUrl, {
    headers: {
      Authorization: `Token ${apiKey}`
    }
  })

  let sessionStatus: SessionStatus = "connecting"
  const sessionId = `deepgram-${Date.now()}-${Math.random().toString(36).substring(7)}`

  setupWebSocketHandlers(ws, callbacks, (status) => {
    sessionStatus = status
  })

  ws.on("message", (data: Buffer) => {
    const rawPayload = data.toString()

    try {
      const message = JSON.parse(rawPayload) as DeepgramRealtimeMessage

      if (callbacks?.onRawMessage) {
        callbacks.onRawMessage({
          provider,
          direction: "incoming",
          timestamp: Date.now(),
          payload: rawPayload,
          messageType: message.type
        })
      }

      handleDeepgramWebSocketMessage(message, callbacks)
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

  await waitForWebSocketOpen(ws)

  const sendCloseStream = () => {
    const closeMessage = JSON.stringify({ type: "CloseStream" })

    if (callbacks?.onRawMessage) {
      callbacks.onRawMessage({
        provider,
        direction: "outgoing",
        timestamp: Date.now(),
        payload: closeMessage,
        messageType: "CloseStream"
      })
    }

    ws.send(closeMessage)
  }

  return {
    id: sessionId,
    provider,
    createdAt: new Date(),
    getStatus: () => sessionStatus,
    sendAudio: async (chunk) => {
      validateSessionForAudio(sessionStatus, ws.readyState, WebSocket.OPEN)

      if (callbacks?.onRawMessage) {
        const audioPayload =
          chunk.data instanceof ArrayBuffer
            ? chunk.data
            : (chunk.data.buffer.slice(
                chunk.data.byteOffset,
                chunk.data.byteOffset + chunk.data.byteLength
              ) as ArrayBuffer)
        callbacks.onRawMessage({
          provider,
          direction: "outgoing",
          timestamp: Date.now(),
          payload: audioPayload,
          messageType: "audio"
        })
      }

      ws.send(chunk.data)

      if (chunk.isLast) {
        sendCloseStream()
      }
    },
    close: async () => {
      if (sessionStatus === "closed" || sessionStatus === "closing") {
        return
      }

      sessionStatus = "closing"

      if (ws.readyState === WebSocket.OPEN) {
        sendCloseStream()
      }

      await closeWebSocket(ws)
      sessionStatus = "closed"
    }
  }
}
