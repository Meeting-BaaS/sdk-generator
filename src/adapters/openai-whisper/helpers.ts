import axios from "axios"
import WebSocket from "ws"
import type {
  AudioChunk,
  AudioInput,
  StreamingCallbacks,
  StreamingOptions,
  StreamingSession
} from "../../router/types"
import type {
  ConversationItemInputAudioTranscriptionCompletedEvent,
  ErrorEvent as RealtimeErrorEvent,
  InputAudioBufferSpeechStartedEvent,
  InputAudioBufferSpeechStoppedEvent,
  RealtimeServerEvent,
  SessionCreatedEvent
} from "../../generated/openai/streaming-types"
import {
  getOpenAIRealtimeUrl,
  REALTIME_SERVER_EVENTS
} from "../../generated/openai/streaming-types"
import {
  OpenAIRealtimeAudioFormat,
  OpenAIRealtimeModel,
  OpenAIRealtimeTranscriptionModel,
  OpenAIRealtimeTurnDetection
} from "../../constants"

export async function loadOpenAIAudioInput(audio: AudioInput): Promise<Buffer | Blob> {
  if (audio.type === "url") {
    const response = await axios.get(audio.url, {
      responseType: "arraybuffer"
    })
    return Buffer.from(response.data)
  }

  if (audio.type === "file") {
    return audio.file
  }

  throw new Error("OpenAI Whisper only supports URL and File audio input (not stream)")
}

export function handleOpenAIRealtimeMessage(
  message: RealtimeServerEvent,
  callbacks?: StreamingCallbacks
): void {
  switch (message.type) {
    case REALTIME_SERVER_EVENTS.SessionCreated: {
      const sessionMsg = message as SessionCreatedEvent
      callbacks?.onMetadata?.({
        sessionId: sessionMsg.session.id,
        model: sessionMsg.session.model
      })
      break
    }
    case REALTIME_SERVER_EVENTS.InputAudioBufferSpeechStarted: {
      const speechStart = message as InputAudioBufferSpeechStartedEvent
      callbacks?.onSpeechStart?.({
        type: "speech_start",
        timestamp: speechStart.audio_start_ms / 1000,
        sessionId: speechStart.item_id
      })
      break
    }
    case REALTIME_SERVER_EVENTS.InputAudioBufferSpeechStopped: {
      const speechStop = message as InputAudioBufferSpeechStoppedEvent
      callbacks?.onSpeechEnd?.({
        type: "speech_end",
        timestamp: speechStop.audio_end_ms / 1000,
        sessionId: speechStop.item_id
      })
      break
    }
    case REALTIME_SERVER_EVENTS.ConversationItemInputAudioTranscriptionCompleted: {
      const transcription = message as ConversationItemInputAudioTranscriptionCompletedEvent
      callbacks?.onTranscript?.({
        type: "transcript",
        text: transcription.transcript,
        isFinal: true
      })
      break
    }
    case REALTIME_SERVER_EVENTS.Error: {
      const errorMsg = message as RealtimeErrorEvent
      callbacks?.onError?.({
        code: errorMsg.error.code || "REALTIME_ERROR",
        message: errorMsg.error.message,
        details: errorMsg.error
      })
      break
    }
  }
}

export async function createOpenAIRealtimeSession(args: {
  apiKey: string
  provider: "openai-whisper"
  options?: StreamingOptions
  callbacks?: StreamingCallbacks
}): Promise<StreamingSession> {
  const { apiKey, provider, options, callbacks } = args
  const openaiOpts = options?.openaiStreaming || {}
  const model = openaiOpts.model || OpenAIRealtimeModel["gpt-4o-realtime-preview"]
  const wsUrl = getOpenAIRealtimeUrl(model)

  const ws = new WebSocket(wsUrl, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "OpenAI-Beta": "realtime=v1"
    }
  })

  let sessionStatus: "connecting" | "open" | "closing" | "closed" = "connecting"
  const sessionId = `openai-realtime-${Date.now()}-${Math.random().toString(36).substring(7)}`

  ws.on("open", () => {
    sessionStatus = "open"

    const sessionConfig = {
      type: "session.update",
      session: {
        modalities: ["audio", "text"],
        input_audio_format: openaiOpts.inputAudioFormat || OpenAIRealtimeAudioFormat.pcm16,
        input_audio_transcription: {
          model: OpenAIRealtimeTranscriptionModel["whisper-1"]
        },
        turn_detection: openaiOpts.turnDetection
          ? {
              type: openaiOpts.turnDetection.type || OpenAIRealtimeTurnDetection.server_vad,
              threshold: openaiOpts.turnDetection.threshold,
              prefix_padding_ms: openaiOpts.turnDetection.prefixPaddingMs,
              silence_duration_ms: openaiOpts.turnDetection.silenceDurationMs
            }
          : {
              type: OpenAIRealtimeTurnDetection.server_vad
            },
        instructions: openaiOpts.instructions
      }
    }

    const sessionConfigMessage = JSON.stringify(sessionConfig)
    if (callbacks?.onRawMessage) {
      callbacks.onRawMessage({
        provider,
        direction: "outgoing",
        timestamp: Date.now(),
        payload: sessionConfigMessage,
        messageType: "session.update"
      })
    }

    ws.send(sessionConfigMessage)
    callbacks?.onOpen?.()
  })

  ws.on("message", (data: Buffer) => {
    const rawPayload = data.toString()

    try {
      const message = JSON.parse(rawPayload) as RealtimeServerEvent
      if (callbacks?.onRawMessage) {
        callbacks.onRawMessage({
          provider,
          direction: "incoming",
          timestamp: Date.now(),
          payload: rawPayload,
          messageType: message.type
        })
      }
      handleOpenAIRealtimeMessage(message, callbacks)
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

      const appendMessage = JSON.stringify({
        type: "input_audio_buffer.append",
        audio: Buffer.from(chunk.data).toString("base64")
      })

      if (callbacks?.onRawMessage) {
        callbacks.onRawMessage({
          provider,
          direction: "outgoing",
          timestamp: Date.now(),
          payload: appendMessage,
          messageType: "input_audio_buffer.append"
        })
      }

      ws.send(appendMessage)

      if (chunk.isLast) {
        const commitMessage = JSON.stringify({ type: "input_audio_buffer.commit" })
        if (callbacks?.onRawMessage) {
          callbacks.onRawMessage({
            provider,
            direction: "outgoing",
            timestamp: Date.now(),
            payload: commitMessage,
            messageType: "input_audio_buffer.commit"
          })
        }
        ws.send(commitMessage)
      }
    },
    close: async () => {
      if (sessionStatus === "closed" || sessionStatus === "closing") {
        return
      }

      sessionStatus = "closing"
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input_audio_buffer.commit" }))
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
    }
  }
}
