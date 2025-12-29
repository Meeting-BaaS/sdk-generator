//! Provider adapters for transcription services
//!
//! Each adapter implements the `TranscriptionAdapter` trait to provide
//! a unified interface for transcription operations.

pub mod assemblyai;
pub mod deepgram;
pub mod gladia;
pub mod streaming;

use async_trait::async_trait;
use thiserror::Error;

use crate::types::{
    AudioInput, ProviderCapabilities, StreamEvent, StreamingOptions,
    TranscribeOptions, TranscriptionProvider, UnifiedTranscriptResponse,
};

/// Adapter error types
#[derive(Debug, Error)]
pub enum AdapterError {
    #[error("HTTP request failed: {0}")]
    HttpError(#[from] reqwest::Error),

    #[error("WebSocket error: {0}")]
    WebSocketError(String),

    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("Provider error: {code} - {message}")]
    ProviderError { code: String, message: String },

    #[error("Not initialized: call initialize() first")]
    NotInitialized,

    #[error("Feature not supported: {0}")]
    NotSupported(String),

    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),
}

/// Provider configuration
#[derive(Debug, Clone)]
pub struct ProviderConfig {
    /// API key for authentication
    pub api_key: String,
    /// Base API URL (optional, uses provider default if not specified)
    pub base_url: Option<String>,
    /// Request timeout in milliseconds
    pub timeout_ms: Option<u64>,
    /// Custom headers to include in requests
    pub headers: Option<std::collections::HashMap<String, String>>,
}

/// Streaming session handle
pub struct StreamingSession {
    /// Session ID
    pub id: String,
    /// Provider handling this stream
    pub provider: TranscriptionProvider,
    /// Channel to send audio chunks
    pub audio_tx: tokio::sync::mpsc::Sender<Vec<u8>>,
    /// Channel to receive events
    pub event_rx: tokio::sync::mpsc::Receiver<StreamEvent>,
    /// Close signal (public to allow destructuring when needed)
    pub close_tx: tokio::sync::oneshot::Sender<()>,
}

impl StreamingSession {
    /// Send an audio chunk
    pub async fn send_audio(&self, data: Vec<u8>) -> Result<(), AdapterError> {
        self.audio_tx
            .send(data)
            .await
            .map_err(|e| AdapterError::WebSocketError(e.to_string()))
    }

    /// Close the streaming session
    pub async fn close(self) -> Result<(), AdapterError> {
        self.close_tx
            .send(())
            .map_err(|_| AdapterError::WebSocketError("Failed to send close signal".into()))
    }

    /// Consume the session and return individual parts for custom handling
    ///
    /// Useful when you need to forward audio/events through channels while
    /// keeping close capability separate.
    pub fn into_parts(
        self,
    ) -> (
        tokio::sync::mpsc::Sender<Vec<u8>>,
        tokio::sync::mpsc::Receiver<StreamEvent>,
        tokio::sync::oneshot::Sender<()>,
    ) {
        (self.audio_tx, self.event_rx, self.close_tx)
    }
}

/// Base adapter trait that all provider adapters must implement
#[async_trait]
pub trait TranscriptionAdapter: Send + Sync {
    /// Provider name
    fn name(&self) -> TranscriptionProvider;

    /// Provider capabilities
    fn capabilities(&self) -> ProviderCapabilities;

    /// Initialize the adapter with configuration
    fn initialize(&mut self, config: ProviderConfig) -> Result<(), AdapterError>;

    /// Submit audio for transcription
    async fn transcribe(
        &self,
        audio: AudioInput,
        options: Option<TranscribeOptions>,
    ) -> Result<UnifiedTranscriptResponse, AdapterError>;

    /// Get transcription result by ID
    async fn get_transcript(
        &self,
        transcript_id: &str,
    ) -> Result<UnifiedTranscriptResponse, AdapterError>;

    /// Stream audio for real-time transcription
    /// Only available if capabilities.streaming is true
    async fn transcribe_stream(
        &self,
        _options: Option<StreamingOptions>,
    ) -> Result<StreamingSession, AdapterError> {
        Err(AdapterError::NotSupported(
            "Streaming not supported by this provider".into(),
        ))
    }

    /// Delete a transcription (not all providers support this)
    async fn delete_transcript(&self, _transcript_id: &str) -> Result<bool, AdapterError> {
        Err(AdapterError::NotSupported(
            "Delete not supported by this provider".into(),
        ))
    }
}

// Re-export adapters
pub use assemblyai::AssemblyAIAdapter;
pub use deepgram::DeepgramAdapter;
pub use gladia::GladiaAdapter;
