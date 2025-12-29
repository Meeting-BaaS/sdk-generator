//! Streaming utilities and WebSocket helpers
//!
//! Common functionality for real-time streaming transcription across providers.

use futures::{SinkExt, StreamExt};
use tokio_tungstenite::{
    connect_async,
    tungstenite::{http::Request, Message},
    MaybeTlsStream, WebSocketStream,
};

use super::AdapterError;
use crate::types::{SessionStatus, StreamEvent, StreamEventType, TranscriptionError};

/// Audio encoding formats for streaming
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AudioEncoding {
    /// 16-bit signed little-endian PCM
    Pcm16,
    /// 8-bit mu-law
    Mulaw,
    /// 8-bit A-law
    Alaw,
    /// Opus codec
    Opus,
    /// FLAC codec
    Flac,
    /// MP3 codec
    Mp3,
}

impl AudioEncoding {
    /// Convert to Deepgram encoding string
    pub fn to_deepgram(&self) -> &'static str {
        match self {
            AudioEncoding::Pcm16 => "linear16",
            AudioEncoding::Mulaw => "mulaw",
            AudioEncoding::Alaw => "alaw",
            AudioEncoding::Opus => "opus",
            AudioEncoding::Flac => "flac",
            AudioEncoding::Mp3 => "mp3",
        }
    }

    /// Convert to AssemblyAI encoding string
    pub fn to_assemblyai(&self) -> &'static str {
        match self {
            AudioEncoding::Pcm16 => "pcm_s16le",
            AudioEncoding::Mulaw => "pcm_mulaw",
            AudioEncoding::Alaw => "pcm_alaw",
            _ => "pcm_s16le", // Default to PCM for unsupported
        }
    }

    /// Convert to Gladia encoding string
    pub fn to_gladia(&self) -> &'static str {
        match self {
            AudioEncoding::Pcm16 => "wav/pcm",
            AudioEncoding::Mulaw => "wav/mulaw",
            AudioEncoding::Alaw => "wav/alaw",
            _ => "wav/pcm", // Default to PCM for unsupported
        }
    }

    /// Parse from common encoding string
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "linear16" | "pcm_s16le" | "pcm16" | "pcm" | "wav/pcm" => Some(AudioEncoding::Pcm16),
            "mulaw" | "pcm_mulaw" | "wav/mulaw" => Some(AudioEncoding::Mulaw),
            "alaw" | "pcm_alaw" | "wav/alaw" => Some(AudioEncoding::Alaw),
            "opus" => Some(AudioEncoding::Opus),
            "flac" => Some(AudioEncoding::Flac),
            "mp3" => Some(AudioEncoding::Mp3),
            _ => None,
        }
    }
}

/// WebSocket connection wrapper for streaming sessions
pub struct WebSocketConnection {
    stream: WebSocketStream<MaybeTlsStream<tokio::net::TcpStream>>,
    status: SessionStatus,
}

impl WebSocketConnection {
    /// Connect to a WebSocket endpoint with optional headers
    ///
    /// When no custom headers are needed, uses direct URL connection (tungstenite adds
    /// WebSocket upgrade headers automatically). When custom headers are provided,
    /// manually adds required WebSocket upgrade headers to the request.
    pub async fn connect(
        url: &str,
        headers: Vec<(&str, &str)>,
    ) -> Result<Self, AdapterError> {
        let (stream, _response) = if headers.is_empty() {
            // Simple connection without custom headers - use URL directly
            // tungstenite automatically adds WebSocket upgrade headers
            tokio::time::timeout(
                std::time::Duration::from_secs(10),
                connect_async(url),
            )
            .await
            .map_err(|_| AdapterError::WebSocketError("Connection timeout".into()))?
            .map_err(|e| AdapterError::WebSocketError(format!("Connection failed: {}", e)))?
        } else {
            // Build request with custom headers and proper WebSocket upgrade headers
            // When building a custom Request, tungstenite doesn't auto-add WebSocket headers
            let ws_key = tokio_tungstenite::tungstenite::handshake::client::generate_key();
            let mut request = Request::builder()
                .uri(url)
                .header("Upgrade", "websocket")
                .header("Connection", "Upgrade")
                .header("Sec-WebSocket-Key", &ws_key)
                .header("Sec-WebSocket-Version", "13");

            for (key, value) in headers {
                request = request.header(key, value);
            }

            let request = request
                .body(())
                .map_err(|e| AdapterError::WebSocketError(format!("Failed to build request: {}", e)))?;

            tokio::time::timeout(
                std::time::Duration::from_secs(10),
                connect_async(request),
            )
            .await
            .map_err(|_| AdapterError::WebSocketError("Connection timeout".into()))?
            .map_err(|e| AdapterError::WebSocketError(format!("Connection failed: {}", e)))?
        };

        Ok(Self {
            stream,
            status: SessionStatus::Open,
        })
    }

    /// Get current connection status
    pub fn status(&self) -> SessionStatus {
        self.status
    }

    /// Send a text message
    pub async fn send_text(&mut self, text: &str) -> Result<(), AdapterError> {
        self.stream
            .send(Message::Text(text.to_string().into()))
            .await
            .map_err(|e| AdapterError::WebSocketError(format!("Send failed: {}", e)))
    }

    /// Send binary data (audio)
    pub async fn send_binary(&mut self, data: Vec<u8>) -> Result<(), AdapterError> {
        self.stream
            .send(Message::Binary(data.into()))
            .await
            .map_err(|e| AdapterError::WebSocketError(format!("Send failed: {}", e)))
    }

    /// Receive the next message
    pub async fn recv(&mut self) -> Option<Result<Message, AdapterError>> {
        match self.stream.next().await {
            Some(Ok(msg)) => Some(Ok(msg)),
            Some(Err(e)) => Some(Err(AdapterError::WebSocketError(format!(
                "Receive failed: {}",
                e
            )))),
            None => {
                self.status = SessionStatus::Closed;
                None
            }
        }
    }

    /// Close the connection gracefully
    pub async fn close(&mut self) -> Result<(), AdapterError> {
        self.status = SessionStatus::Closing;
        self.stream
            .close(None)
            .await
            .map_err(|e| AdapterError::WebSocketError(format!("Close failed: {}", e)))?;
        self.status = SessionStatus::Closed;
        Ok(())
    }
}

/// Audio buffer for providers that require minimum chunk sizes
pub struct AudioBuffer {
    buffer: Vec<u8>,
    min_bytes: usize,
    max_bytes: usize,
}

impl AudioBuffer {
    /// Create a new audio buffer with byte limits
    pub fn new(min_bytes: usize, max_bytes: usize) -> Self {
        Self {
            buffer: Vec::with_capacity(max_bytes),
            min_bytes,
            max_bytes,
        }
    }

    /// Create a buffer for AssemblyAI (50ms - 1000ms at 16kHz 16-bit mono)
    pub fn for_assemblyai() -> Self {
        // At 16kHz, 16-bit mono: 32 bytes/ms
        Self::new(1_600, 32_000) // 50ms to 1000ms
    }

    /// Add data to the buffer, returns chunks ready to send
    pub fn add(&mut self, data: Vec<u8>) -> Vec<Vec<u8>> {
        self.buffer.extend(data);
        let mut chunks = Vec::new();

        while self.buffer.len() >= self.max_bytes {
            let chunk: Vec<u8> = self.buffer.drain(..self.max_bytes).collect();
            chunks.push(chunk);
        }

        chunks
    }

    /// Flush remaining data if it meets minimum requirement
    pub fn flush(&mut self) -> Option<Vec<u8>> {
        if self.buffer.len() >= self.min_bytes {
            Some(std::mem::take(&mut self.buffer))
        } else if !self.buffer.is_empty() {
            // For final flush, send whatever we have
            Some(std::mem::take(&mut self.buffer))
        } else {
            None
        }
    }
}

/// Create an error event
pub fn error_event(code: &str, message: String) -> StreamEvent {
    StreamEvent {
        event_type: StreamEventType::Error,
        text: None,
        is_final: None,
        utterance: None,
        words: None,
        speaker: None,
        confidence: None,
        error: Some(TranscriptionError {
            code: code.to_string(),
            message,
            details: None,
            status_code: None,
        }),
        data: None,
    }
}

/// Create an open event
pub fn open_event() -> StreamEvent {
    StreamEvent {
        event_type: StreamEventType::Open,
        text: None,
        is_final: None,
        utterance: None,
        words: None,
        speaker: None,
        confidence: None,
        error: None,
        data: None,
    }
}

/// Create a close event
pub fn close_event() -> StreamEvent {
    StreamEvent {
        event_type: StreamEventType::Close,
        text: None,
        is_final: None,
        utterance: None,
        words: None,
        speaker: None,
        confidence: None,
        error: None,
        data: None,
    }
}

/// Generate a unique session ID
pub fn generate_session_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    format!("stream_{:x}", timestamp)
}
