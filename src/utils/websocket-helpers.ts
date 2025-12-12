/**
 * WebSocket utility functions for streaming transcription
 *
 * Provides reusable helpers for WebSocket connection management,
 * event handling, and session validation.
 */

import type WebSocket from "ws"
import type { StreamingCallbacks, SessionStatus } from "../router/types"
import { DEFAULT_TIMEOUTS } from "../constants/defaults"
import { ERROR_CODES, createError } from "./errors"

/**
 * Wait for WebSocket connection to open with timeout
 *
 * @param ws - WebSocket instance
 * @param timeoutMs - Connection timeout in milliseconds
 * @returns Promise that resolves when connection opens
 * @throws Error if connection times out or fails
 *
 * @example
 * ```typescript
 * const ws = new WebSocket(url)
 * await waitForWebSocketOpen(ws)
 * // WebSocket is now open and ready
 * ```
 */
export function waitForWebSocketOpen(
  ws: WebSocket,
  timeoutMs: number = DEFAULT_TIMEOUTS.WS_CONNECTION
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("WebSocket connection timeout"))
    }, timeoutMs)

    ws.once("open", () => {
      clearTimeout(timeout)
      resolve()
    })

    ws.once("error", (error) => {
      clearTimeout(timeout)
      reject(error)
    })
  })
}

/**
 * Close WebSocket gracefully with timeout
 *
 * Attempts graceful close, but will forcefully terminate if timeout is reached.
 *
 * @param ws - WebSocket instance
 * @param timeoutMs - Close timeout in milliseconds
 * @returns Promise that resolves when connection is closed
 *
 * @example
 * ```typescript
 * await closeWebSocket(ws)
 * // WebSocket is now closed
 * ```
 */
export function closeWebSocket(
  ws: WebSocket,
  timeoutMs: number = DEFAULT_TIMEOUTS.WS_CLOSE
): Promise<void> {
  return new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      ws.terminate()
      resolve()
    }, timeoutMs)

    ws.close()

    ws.once("close", () => {
      clearTimeout(timeout)
      resolve()
    })
  })
}

/**
 * Setup standard WebSocket event handlers
 *
 * Configures consistent event handling for open, error, and close events
 * across all streaming adapters.
 *
 * @param ws - WebSocket instance
 * @param callbacks - Streaming callbacks from user
 * @param setSessionStatus - Function to update session status
 *
 * @example
 * ```typescript
 * let sessionStatus: SessionStatus = "connecting"
 *
 * setupWebSocketHandlers(
 *   ws,
 *   callbacks,
 *   (status) => { sessionStatus = status }
 * )
 * ```
 */
export function setupWebSocketHandlers(
  ws: WebSocket,
  callbacks: StreamingCallbacks | undefined,
  setSessionStatus: (status: SessionStatus) => void
): void {
  ws.on("open", () => {
    setSessionStatus("open")
    callbacks?.onOpen?.()
  })

  ws.on("error", (error: Error) => {
    callbacks?.onError?.(createError(ERROR_CODES.WEBSOCKET_ERROR, error.message, error))
  })

  ws.on("close", (code: number, reason: Buffer) => {
    setSessionStatus("closed")
    callbacks?.onClose?.(code, reason.toString())
  })
}

/**
 * Validate that WebSocket session is ready to send audio
 *
 * Checks both session status and WebSocket ready state before allowing
 * audio data to be sent.
 *
 * @param sessionStatus - Current session status
 * @param wsReadyState - WebSocket readyState value
 * @param WebSocketOpen - WebSocket.OPEN constant value
 * @throws Error if session is not ready
 *
 * @example
 * ```typescript
 * validateSessionForAudio(sessionStatus, ws.readyState, WebSocket.OPEN)
 * ws.send(audioData) // Safe to send now
 * ```
 */
export function validateSessionForAudio(
  sessionStatus: SessionStatus,
  wsReadyState: number,
  WebSocketOpen: number
): void {
  if (sessionStatus !== "open") {
    throw new Error(`Cannot send audio: session is ${sessionStatus}`)
  }

  if (wsReadyState !== WebSocketOpen) {
    throw new Error("WebSocket is not open")
  }
}
