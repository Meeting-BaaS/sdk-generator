import WebSocket from "ws"
import type {
  ListTranscriptsOptions,
  StreamingCallbacks,
  StreamingSession,
  UnifiedTranscriptResponse
} from "../../router/types"
import type { TranscriptJobType } from "../shared-types"
import { ERROR_CODES } from "../../utils/errors"
import {
  preRecordedControllerDeletePreRecordedJobV2,
  preRecordedControllerGetAudioV2,
  streamingControllerDeleteStreamingJobV2,
  streamingControllerGetAudioV2
} from "../../generated/gladia/api/gladiaControlAPI"
import type { TranscriptionControllerListV2Params } from "../../generated/gladia/schema/transcriptionControllerListV2Params"
import { TranscriptionControllerListV2StatusItem } from "../../generated/gladia/schema/transcriptionControllerListV2StatusItem"
import { handleGladiaWebSocketMessage } from "./mappers"
import {
  closeWebSocket,
  setupWebSocketHandlers,
  validateSessionForAudio,
  waitForWebSocketOpen
} from "../../utils/websocket-helpers"

type GladiaDeleteConfig = Parameters<typeof preRecordedControllerDeletePreRecordedJobV2>[1]
type GladiaAudioConfig = Parameters<typeof preRecordedControllerGetAudioV2>[1]

export function createQueuedTranscriptResponse(
  provider: "gladia",
  id: string,
  raw: unknown
): UnifiedTranscriptResponse {
  return {
    success: true,
    provider,
    data: {
      id,
      text: "",
      status: "queued"
    },
    raw
  }
}

export async function deleteGladiaJob(
  transcriptId: string,
  jobType: TranscriptJobType,
  axiosConfig: GladiaDeleteConfig
): Promise<void> {
  if (jobType === "streaming") {
    await streamingControllerDeleteStreamingJobV2(transcriptId, axiosConfig)
    return
  }

  await preRecordedControllerDeletePreRecordedJobV2(transcriptId, axiosConfig)
}

export async function downloadGladiaAudio(
  transcriptId: string,
  jobType: TranscriptJobType,
  axiosConfig: GladiaAudioConfig
): Promise<{ data: ArrayBuffer; headers?: Record<string, string> }> {
  if (jobType === "streaming") {
    return (await streamingControllerGetAudioV2(transcriptId, axiosConfig)) as {
      data: ArrayBuffer
      headers?: Record<string, string>
    }
  }

  return (await preRecordedControllerGetAudioV2(transcriptId, axiosConfig)) as {
    data: ArrayBuffer
    headers?: Record<string, string>
  }
}

export function buildGladiaListParams(
  options?: ListTranscriptsOptions
): TranscriptionControllerListV2Params {
  const params: TranscriptionControllerListV2Params = {
    ...options?.gladia
  }

  if (options?.limit) params.limit = options.limit
  if (options?.offset) params.offset = options.offset
  if (options?.status) {
    const statusMap: Record<string, TranscriptionControllerListV2StatusItem> = {
      queued: TranscriptionControllerListV2StatusItem.queued,
      processing: TranscriptionControllerListV2StatusItem.processing,
      completed: TranscriptionControllerListV2StatusItem.done,
      done: TranscriptionControllerListV2StatusItem.done,
      error: TranscriptionControllerListV2StatusItem.error
    }
    const mappedStatus = statusMap[options.status.toLowerCase()]
    if (mappedStatus) params.status = [mappedStatus]
  }
  if (options?.date) params.date = options.date
  if (options?.beforeDate) params.before_date = options.beforeDate
  if (options?.afterDate) params.after_date = options.afterDate

  return params
}

export async function createGladiaStreamingSession(args: {
  provider: "gladia"
  sessionId: string
  wsUrl: string
  callbacks?: StreamingCallbacks
}): Promise<StreamingSession> {
  const { provider, sessionId, wsUrl, callbacks } = args
  const ws = new WebSocket(wsUrl)
  let sessionStatus: "connecting" | "open" | "closing" | "closed" = "connecting"

  setupWebSocketHandlers(ws, callbacks, (status) => {
    sessionStatus = status
  })

  ws.on("message", (data: Buffer) => {
    const rawPayload = data.toString()

    try {
      const message = JSON.parse(rawPayload)

      if (callbacks?.onRawMessage) {
        callbacks.onRawMessage({
          provider,
          direction: "incoming",
          timestamp: Date.now(),
          payload: rawPayload,
          messageType: (message as Record<string, unknown>).type as string | undefined
        })
      }

      handleGladiaWebSocketMessage(message, callbacks)
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
        code: ERROR_CODES.PARSE_ERROR,
        message: "Failed to parse WebSocket message",
        details: error
      })
    }
  })

  await waitForWebSocketOpen(ws)

  const sendStopRecording = () => {
    const stopMessage = JSON.stringify({ type: "stop_recording" })

    if (callbacks?.onRawMessage) {
      callbacks.onRawMessage({
        provider,
        direction: "outgoing",
        timestamp: Date.now(),
        payload: stopMessage,
        messageType: "stop_recording"
      })
    }

    ws.send(stopMessage)
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
        sendStopRecording()
      }
    },
    close: async () => {
      if (sessionStatus === "closed" || sessionStatus === "closing") {
        return
      }

      sessionStatus = "closing"

      if (ws.readyState === WebSocket.OPEN) {
        sendStopRecording()
      }

      await closeWebSocket(ws)
      sessionStatus = "closed"
    }
  }
}
