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
import { buildUtterancesFromSonioxTokens } from "./mappers"

export function createSonioxClient(
  baseUrl: string,
  config: Pick<ProviderConfig, "apiKey" | "timeout" | "headers">
): AxiosInstance {
  return axios.create({
    baseURL: baseUrl,
    timeout: config.timeout || 120000,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      ...config.headers
    }
  })
}

export function buildSonioxBatchRequest(
  audio: AudioInput,
  options: TranscribeOptions | undefined,
  defaultModel: string
): { body?: Record<string, unknown>; formData?: FormData } {
  const model = options?.model || defaultModel

  if (audio.type === "url") {
    const requestBody: Record<string, unknown> = {
      model,
      audio_url: audio.url
    }

    if (options?.language) requestBody.language_hints = [options.language]
    if (options?.diarization) requestBody.enable_speaker_diarization = true
    if (options?.languageDetection) requestBody.enable_language_identification = true
    if (options?.customVocabulary?.length) {
      requestBody.context = { terms: options.customVocabulary }
    }

    return { body: requestBody }
  }

  if (audio.type === "file") {
    const formData = new FormData()
    const audioBlob =
      audio.file instanceof Blob
        ? audio.file
        : new Blob([audio.file], { type: audio.mimeType || "audio/wav" })
    formData.append("audio", audioBlob, audio.filename || "audio.wav")
    formData.append("model", model)

    if (options?.language) {
      formData.append("language_hints", JSON.stringify([options.language]))
    }
    if (options?.diarization) {
      formData.append("enable_speaker_diarization", "true")
    }
    if (options?.languageDetection) {
      formData.append("enable_language_identification", "true")
    }
    if (options?.customVocabulary?.length) {
      formData.append("context", JSON.stringify({ terms: options.customVocabulary }))
    }

    return { formData }
  }

  throw new Error("Soniox only supports URL and File audio input")
}

export function buildSonioxStreamingUrl(
  wsBase: string,
  options?: StreamingOptions
): { url: string; modelId: string } {
  const wsUrl = new URL(`${wsBase}/transcribe-websocket`)
  const modelId = options?.sonioxStreaming?.model || options?.model || "stt-rt-preview"
  wsUrl.searchParams.set("model", modelId)

  if (options?.encoding) {
    const encodingMap: Record<string, string> = {
      linear16: "pcm_s16le",
      pcm: "pcm_s16le",
      mulaw: "mulaw",
      alaw: "alaw"
    }
    wsUrl.searchParams.set("audio_format", encodingMap[options.encoding] || options.encoding)
  }
  if (options?.sampleRate) wsUrl.searchParams.set("sample_rate", options.sampleRate.toString())
  if (options?.channels) wsUrl.searchParams.set("num_channels", options.channels.toString())

  const sonioxOpts = options?.sonioxStreaming
  if (sonioxOpts?.languageHints?.length) {
    wsUrl.searchParams.set("language_hints", JSON.stringify(sonioxOpts.languageHints))
  }
  if (sonioxOpts?.enableLanguageIdentification) {
    wsUrl.searchParams.set("enable_language_identification", "true")
  }
  if (sonioxOpts?.enableEndpointDetection) {
    wsUrl.searchParams.set("enable_endpoint_detection", "true")
  }
  if (sonioxOpts?.enableSpeakerDiarization) {
    wsUrl.searchParams.set("enable_speaker_diarization", "true")
  }
  if (sonioxOpts?.context) {
    wsUrl.searchParams.set(
      "context",
      typeof sonioxOpts.context === "string"
        ? sonioxOpts.context
        : JSON.stringify(sonioxOpts.context)
    )
  }
  if (sonioxOpts?.translation) {
    wsUrl.searchParams.set("translation", JSON.stringify(sonioxOpts.translation))
  }
  if (sonioxOpts?.clientReferenceId) {
    wsUrl.searchParams.set("client_reference_id", sonioxOpts.clientReferenceId)
  }

  if (!sonioxOpts?.languageHints && options?.language) {
    if (options.language === "multi") {
      console.warn(
        '[Soniox] Warning: language="multi" is Deepgram-specific and not supported by Soniox. ' +
          "For automatic language detection, use languageDetection: true instead, or specify a language code like 'en'."
      )
    }
    wsUrl.searchParams.set("language_hints", JSON.stringify([options.language]))
  }
  if (!sonioxOpts?.enableSpeakerDiarization && options?.diarization) {
    wsUrl.searchParams.set("enable_speaker_diarization", "true")
  }
  if (!sonioxOpts?.enableLanguageIdentification && options?.languageDetection) {
    wsUrl.searchParams.set("enable_language_identification", "true")
  }

  return { url: wsUrl.toString(), modelId }
}

export async function createSonioxStreamingSession(args: {
  apiKey: string
  provider: "soniox"
  region: string
  modelId: string
  wsUrl: string
  options?: StreamingOptions
  callbacks?: StreamingCallbacks
}): Promise<StreamingSession> {
  const { apiKey, provider, region, modelId, wsUrl, options, callbacks } = args
  const sessionId = `soniox_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const createdAt = new Date()

  const url = new URL(wsUrl)
  url.searchParams.set("api_key", apiKey)

  let status: "connecting" | "open" | "closing" | "closed" = "connecting"
  let openedAt: number | null = null
  let receivedData = false

  const ws = new WebSocket(url.toString())

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
      else if (data.finished) messageType = "finished"
      else if (data.tokens) {
        messageType = data.tokens.every((t: any) => t.is_final) ? "final_tokens" : "partial_tokens"
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

      if (data.finished) {
        callbacks?.onClose?.(1000, "Transcription complete")
        return
      }

      if (data.tokens?.length) {
        const words: Word[] = data.tokens.map((token: any) => ({
          word: token.text,
          start: token.start_ms ? token.start_ms / 1000 : 0,
          end: token.end_ms ? token.end_ms / 1000 : 0,
          confidence: token.confidence,
          speaker: token.speaker
        }))

        const text = data.text || data.tokens.map((t: any) => t.text).join("")
        const isFinal = data.tokens.every((t: any) => t.is_final)
        const streamEvent: StreamEvent = {
          type: "transcript",
          text,
          isFinal,
          words,
          speaker: data.tokens[0]?.speaker,
          language: data.tokens[0]?.language,
          confidence: data.tokens[0]?.confidence
        }

        callbacks?.onTranscript?.(streamEvent)

        if (isFinal && options?.diarization) {
          const utterances = buildUtterancesFromSonioxTokens(
            data.tokens.filter((t: any) => t.is_final)
          )
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

  ws.on("error", (err: Error) => {
    callbacks?.onError?.({
      code: "WEBSOCKET_ERROR",
      message: err.message || "WebSocket error occurred",
      details: err
    })
  })

  ws.on("close", (code: number, reason: Buffer) => {
    status = "closed"

    const timeSinceOpen = openedAt ? Date.now() - openedAt : null
    const isImmediateClose = timeSinceOpen !== null && timeSinceOpen < 1000 && !receivedData
    if (isImmediateClose && code === 1000) {
      callbacks?.onError?.({
        code: "SONIOX_CONFIG_REJECTED",
        message: [
          "Soniox closed connection immediately after opening.",
          `Current config: region=${region}, model=${modelId}`,
          "Likely causes:",
          `  - Invalid API key or region mismatch (keys are region-specific, current: ${region})`,
          "  - Invalid language value (e.g., 'multi' is Deepgram-only, use 'en' for Soniox)",
          "  - Unsupported audio format or sample rate for the model",
          "  - Model not available for your account",
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

      if (callbacks?.onRawMessage) {
        const buffer = Buffer.from(chunk.data)
        const audioPayload = buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength
        ) as ArrayBuffer
        callbacks.onRawMessage({
          provider,
          direction: "outgoing",
          timestamp: Date.now(),
          payload: audioPayload,
          messageType: "audio"
        })
      }

      ws.send(chunk.data)
    },
    close: async () => {
      if (status === "open") {
        status = "closing"
        ws.close(1000, "Client requested close")
      }
    }
  }
}
