import axios, { type AxiosInstance } from "axios"
import WebSocket from "ws"
import type {
  AudioInput,
  StreamEvent,
  StreamingCallbacks,
  StreamingOptions,
  StreamingSession,
  TranscribeOptions,
  Word
} from "../../router/types"
import type { ProviderConfig } from "../base-adapter"
import type { ElevenLabsModelCode } from "../../generated/elevenlabs/models"
import { buildUtterancesFromWords } from "../../utils/transcription-helpers"

export function createElevenLabsClient(
  baseUrl: string,
  config: Pick<ProviderConfig, "apiKey" | "timeout" | "headers">
): AxiosInstance {
  return axios.create({
    baseURL: baseUrl,
    timeout: config.timeout ?? 120000,
    headers: {
      "xi-api-key": config.apiKey,
      ...config.headers
    }
  })
}

export function buildElevenLabsTranscriptionFormData(
  audio: AudioInput,
  options: TranscribeOptions | undefined,
  defaultModel: ElevenLabsModelCode
): FormData {
  const formData = new FormData()
  const modelId = (options?.model as ElevenLabsModelCode) || defaultModel
  formData.append("model_id", modelId)

  if (audio.type === "url") {
    formData.append("cloud_storage_url", audio.url)
  } else if (audio.type === "file") {
    const audioBlob =
      audio.file instanceof Blob
        ? audio.file
        : new Blob([audio.file], { type: audio.mimeType || "audio/wav" })
    formData.append("file", audioBlob, audio.filename || "audio.wav")
  } else {
    throw new Error("ElevenLabs only supports URL and File audio input")
  }

  if (options?.language) formData.append("language_code", options.language)
  if (options?.diarization) formData.append("diarize", "true")

  formData.append("timestamps_granularity", "word")

  if (options?.speakersExpected) {
    formData.append("num_speakers", String(options.speakersExpected))
  }

  if (options?.customVocabulary?.length) {
    for (const term of options.customVocabulary) {
      formData.append("keyterms", term)
    }
  }

  if (options?.entityDetection) {
    formData.append("entity_detection", "all")
  }

  const elevenlabsOpts = options?.elevenlabs
  if (elevenlabsOpts) {
    for (const [key, value] of Object.entries(elevenlabsOpts)) {
      if (value === undefined || value === null) continue
      if (formData.has(key)) continue
      if (typeof value === "boolean") {
        formData.append(key, String(value))
      } else if (Array.isArray(value)) {
        for (const item of value) {
          formData.append(key, typeof item === "object" ? JSON.stringify(item) : String(item))
        }
      } else if (typeof value === "object") {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, String(value))
      }
    }
  }

  return formData
}

export function buildElevenLabsStreamingUrl(
  wsBase: string,
  options?: StreamingOptions
): { url: string; modelId: string } {
  const wsUrl = new URL(`${wsBase}/v1/speech-to-text/realtime`)
  const elOpts = options?.elevenlabsStreaming
  const modelId = elOpts?.model || "scribe_v2_realtime"
  wsUrl.searchParams.set("model_id", modelId)

  const audioFormat = elOpts?.audioFormat || "pcm_16000"
  wsUrl.searchParams.set("audio_format", audioFormat)

  const langCode = elOpts?.languageCode || options?.language
  if (langCode) wsUrl.searchParams.set("language_code", langCode)
  if (elOpts?.includeTimestamps !== undefined) {
    wsUrl.searchParams.set("include_timestamps", String(elOpts.includeTimestamps))
  }
  if (elOpts?.includeLanguageDetection || options?.languageDetection) {
    wsUrl.searchParams.set("include_language_detection", "true")
  }
  if (elOpts?.commitStrategy) wsUrl.searchParams.set("commit_strategy", elOpts.commitStrategy)
  if (elOpts?.vadSilenceThresholdSecs !== undefined) {
    wsUrl.searchParams.set("vad_silence_threshold_secs", String(elOpts.vadSilenceThresholdSecs))
  }
  if (elOpts?.vadThreshold !== undefined) {
    wsUrl.searchParams.set("vad_threshold", String(elOpts.vadThreshold))
  }
  if (elOpts?.minSpeechDurationMs !== undefined) {
    wsUrl.searchParams.set("min_speech_duration_ms", String(elOpts.minSpeechDurationMs))
  }
  if (elOpts?.minSilenceDurationMs !== undefined) {
    wsUrl.searchParams.set("min_silence_duration_ms", String(elOpts.minSilenceDurationMs))
  }
  if (elOpts?.previousText) wsUrl.searchParams.set("previous_text", elOpts.previousText)

  if (!elOpts?.audioFormat && options?.encoding) {
    const encodingMap: Record<string, string> = {
      linear16: "pcm_16000",
      pcm: "pcm_16000",
      mulaw: "ulaw_8000"
    }
    const mappedFormat = encodingMap[options.encoding]
    if (mappedFormat) wsUrl.searchParams.set("audio_format", mappedFormat)
  }

  return { url: wsUrl.toString(), modelId }
}

export async function createElevenLabsStreamingSession(args: {
  apiKey: string
  provider: "elevenlabs"
  region: string
  modelId: string
  wsUrl: string
  options?: StreamingOptions
  callbacks?: StreamingCallbacks
}): Promise<StreamingSession> {
  const { apiKey, provider, region, modelId, wsUrl, options, callbacks } = args
  const sessionId = `elevenlabs_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const createdAt = new Date()

  let status: "connecting" | "open" | "closing" | "closed" = "connecting"
  let openedAt: number | null = null
  let receivedData = false

  const ws = new WebSocket(wsUrl, {
    headers: {
      "xi-api-key": apiKey
    }
  })

  ws.on("open", () => {
    status = "open"
    openedAt = Date.now()
    callbacks?.onOpen?.()
  })

  ws.on("message", (event: Buffer) => {
    receivedData = true

    const rawPayload = event.toString()
    let messageType: string | undefined

    try {
      const data = JSON.parse(rawPayload)

      if (data.error) messageType = "error"
      else if (data.message_type === "session_started") messageType = "session_started"
      else if (data.message_type === "partial_transcript") messageType = "partial_transcript"
      else if (data.message_type === "committed_transcript") messageType = "committed_transcript"
      else if (data.message_type === "committed_transcript_with_timestamps") {
        messageType = "committed_transcript_with_timestamps"
      }

      if (callbacks?.onRawMessage) {
        callbacks.onRawMessage({
          provider,
          direction: "incoming",
          timestamp: Date.now(),
          payload: rawPayload,
          messageType
        })
      }

      if (data.error) {
        callbacks?.onError?.({
          code: data.error_code?.toString() || "STREAM_ERROR",
          message: data.error
        })
        return
      }

      if (data.message_type === "session_started") return

      if (data.message_type === "partial_transcript") {
        const streamEvent: StreamEvent = {
          type: "transcript",
          text: data.text || "",
          isFinal: false,
          confidence: undefined,
          language: data.language_code
        }
        callbacks?.onTranscript?.(streamEvent)
        return
      }

      if (
        data.message_type === "committed_transcript" ||
        data.message_type === "committed_transcript_with_timestamps"
      ) {
        const words: Word[] = data.words
          ? data.words.map((w: any) => ({
              word: w.text || "",
              start: w.start || 0,
              end: w.end || 0,
              confidence: w.logprob !== undefined ? Math.exp(w.logprob) : undefined,
              speaker: w.speaker_id
            }))
          : []

        const streamEvent: StreamEvent = {
          type: "transcript",
          text: data.text || "",
          isFinal: true,
          words: words.length > 0 ? words : undefined,
          speaker: words[0]?.speaker,
          language: data.language_code,
          confidence: undefined
        }

        callbacks?.onTranscript?.(streamEvent)

        if (options?.diarization && words.length > 0) {
          const utterances = buildUtterancesFromWords(words)
          for (const utterance of utterances) {
            callbacks?.onUtterance?.(utterance)
          }
        }
      }
    } catch (error) {
      callbacks?.onError?.({
        code: "PARSE_ERROR",
        message: `Failed to parse message: ${error}`
      })
    }
  })

  ws.on("error", () => {
    callbacks?.onError?.({
      code: "WEBSOCKET_ERROR",
      message: "WebSocket error occurred"
    })
  })

  ws.on("close", (code: number, reason: Buffer) => {
    status = "closed"

    const timeSinceOpen = openedAt ? Date.now() - openedAt : null
    const isImmediateClose = timeSinceOpen !== null && timeSinceOpen < 1000 && !receivedData

    if (isImmediateClose && code === 1000) {
      callbacks?.onError?.({
        code: "ELEVENLABS_CONFIG_REJECTED",
        message: [
          "ElevenLabs closed connection immediately after opening.",
          `Current config: region=${region}, model=${modelId}`,
          "Likely causes:",
          "  - Invalid API key",
          "  - Unsupported audio format or model",
          reason.length > 0 ? `Server reason: ${reason.toString()}` : null
        ]
          .filter(Boolean)
          .join("\n")
      })
    }

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

    ws.once("close", () => {
      clearTimeout(timeout)
      reject(new Error("WebSocket connection failed"))
    })

    ws.once("error", (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })

  return {
    id: sessionId,
    provider,
    createdAt,
    getStatus: () => status,
    sendAudio: async (chunk) => {
      if (status !== "open") {
        throw new Error("Session is not open")
      }

      const base64Audio = Buffer.from(chunk.data).toString("base64")
      const message = JSON.stringify({
        message_type: "input_audio_chunk",
        audio_base_64: base64Audio
      })

      if (callbacks?.onRawMessage) {
        callbacks.onRawMessage({
          provider,
          direction: "outgoing",
          timestamp: Date.now(),
          payload: message,
          messageType: "audio"
        })
      }

      ws.send(message)
    },
    close: async () => {
      if (status !== "open") return

      status = "closing"
      ws.send(JSON.stringify({ message_type: "end_of_stream" }))
      ws.close(1000, "Client requested close")

      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          ws.terminate()
          resolve()
        }, 5000)

        ws.once("close", () => {
          clearTimeout(timeout)
          status = "closed"
          resolve()
        })
      })
    }
  }
}
