//! Unified types for the Voice Router SDK
//!
//! These types provide a provider-agnostic interface for transcription services,
//! mirroring the TypeScript SDK's type system.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

/// Supported transcription providers
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum TranscriptionProvider {
    #[serde(rename = "gladia")]
    Gladia,
    #[serde(rename = "assemblyai")]
    AssemblyAI,
    #[serde(rename = "deepgram")]
    Deepgram,
    #[serde(rename = "azure-stt")]
    AzureStt,
    #[serde(rename = "openai-whisper")]
    OpenAIWhisper,
    #[serde(rename = "speechmatics")]
    Speechmatics,
}

/// Providers that support real-time streaming transcription
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum StreamingProvider {
    Gladia,
    Deepgram,
    #[serde(rename = "assemblyai")]
    AssemblyAI,
}

/// Transcription status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TranscriptionStatus {
    Queued,
    Processing,
    Completed,
    Error,
}

/// Provider capabilities
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ProviderCapabilities {
    /// Real-time streaming transcription support
    pub streaming: bool,
    /// Speaker diarization (identifying different speakers)
    pub diarization: bool,
    /// Word-level timestamps
    pub word_timestamps: bool,
    /// Automatic language detection
    pub language_detection: bool,
    /// Custom vocabulary/keyword boosting
    pub custom_vocabulary: bool,
    /// Audio summarization
    pub summarization: bool,
    /// Sentiment analysis
    pub sentiment_analysis: bool,
    /// Entity detection
    pub entity_detection: bool,
    /// PII redaction
    pub pii_redaction: bool,
}

/// Audio input for transcription
#[derive(Debug)]
pub enum AudioInput {
    /// URL to audio file
    Url(String),
    /// Raw audio bytes
    Bytes { data: Vec<u8>, filename: Option<String> },
    /// Streaming audio (for real-time transcription)
    Stream(tokio::sync::mpsc::Receiver<Vec<u8>>),
}

/// Common transcription options across all providers
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TranscribeOptions {
    /// Language code (e.g., 'en', 'en-US', 'es')
    #[serde(skip_serializing_if = "Option::is_none")]
    pub language: Option<String>,
    /// Enable automatic language detection
    #[serde(skip_serializing_if = "Option::is_none")]
    pub language_detection: Option<bool>,
    /// Enable speaker diarization
    #[serde(skip_serializing_if = "Option::is_none")]
    pub diarization: Option<bool>,
    /// Expected number of speakers (for diarization)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub speakers_expected: Option<u32>,
    /// Enable word-level timestamps
    #[serde(skip_serializing_if = "Option::is_none")]
    pub word_timestamps: Option<bool>,
    /// Custom vocabulary to boost
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom_vocabulary: Option<Vec<String>>,
    /// Enable summarization
    #[serde(skip_serializing_if = "Option::is_none")]
    pub summarization: Option<bool>,
    /// Enable sentiment analysis
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sentiment_analysis: Option<bool>,
    /// Enable entity detection
    #[serde(skip_serializing_if = "Option::is_none")]
    pub entity_detection: Option<bool>,
    /// Enable PII redaction
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pii_redaction: Option<bool>,
    /// Webhook URL for async results
    #[serde(skip_serializing_if = "Option::is_none")]
    pub webhook_url: Option<String>,
    /// Custom metadata to attach
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

/// Speaker information from diarization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Speaker {
    /// Speaker identifier (e.g., "0", "1", "speaker_0")
    pub id: String,
    /// Speaker label if known
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    /// Confidence score for speaker identification (0-1)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confidence: Option<f64>,
}

/// Word-level transcription with timing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Word {
    /// The transcribed word
    pub text: String,
    /// Start time in seconds
    pub start: f64,
    /// End time in seconds
    pub end: f64,
    /// Confidence score (0-1)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confidence: Option<f64>,
    /// Speaker ID if diarization is enabled
    #[serde(skip_serializing_if = "Option::is_none")]
    pub speaker: Option<String>,
}

/// Utterance (sentence or phrase by a single speaker)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Utterance {
    /// The transcribed text
    pub text: String,
    /// Start time in seconds
    pub start: f64,
    /// End time in seconds
    pub end: f64,
    /// Speaker ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub speaker: Option<String>,
    /// Confidence score (0-1)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confidence: Option<f64>,
    /// Words in this utterance
    #[serde(skip_serializing_if = "Option::is_none")]
    pub words: Option<Vec<Word>>,
}

/// Unified transcription response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedTranscriptResponse {
    /// Operation success status
    pub success: bool,
    /// Provider that performed the transcription
    pub provider: TranscriptionProvider,
    /// Transcription data (only present on success)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<TranscriptionData>,
    /// Error information (only present on failure)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<TranscriptionError>,
    /// Raw provider response (for advanced usage)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub raw: Option<serde_json::Value>,
}

/// Transcription data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionData {
    /// Unique transcription ID
    pub id: String,
    /// Full transcribed text
    pub text: String,
    /// Overall confidence score (0-1)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confidence: Option<f64>,
    /// Transcription status
    pub status: TranscriptionStatus,
    /// Detected or specified language code
    #[serde(skip_serializing_if = "Option::is_none")]
    pub language: Option<String>,
    /// Audio duration in seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<f64>,
    /// Speaker diarization results
    #[serde(skip_serializing_if = "Option::is_none")]
    pub speakers: Option<Vec<Speaker>>,
    /// Word-level transcription with timestamps
    #[serde(skip_serializing_if = "Option::is_none")]
    pub words: Option<Vec<Word>>,
    /// Utterances (speaker turns)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub utterances: Option<Vec<Utterance>>,
    /// Summary of the content
    #[serde(skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
    /// Additional provider-specific metadata
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, serde_json::Value>>,
    /// Creation timestamp
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
    /// Completion timestamp
    #[serde(skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<String>,
}

/// Transcription error
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionError {
    /// Error code
    pub code: String,
    /// Human-readable error message
    pub message: String,
    /// Additional error details
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
    /// HTTP status code if applicable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status_code: Option<u16>,
}

/// Streaming event types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum StreamEventType {
    Open,
    Transcript,
    Utterance,
    Metadata,
    Error,
    Close,
}

/// Streaming transcription event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamEvent {
    /// Event type (matches TypeScript's "type" field)
    #[serde(rename = "type")]
    pub event_type: StreamEventType,
    /// Partial transcript text
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    /// Whether this is a final transcript (vs interim)
    #[serde(rename = "isFinal", skip_serializing_if = "Option::is_none")]
    pub is_final: Option<bool>,
    /// Utterance data (for type: "utterance")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub utterance: Option<Utterance>,
    /// Words in this event
    #[serde(skip_serializing_if = "Option::is_none")]
    pub words: Option<Vec<Word>>,
    /// Speaker ID if diarization is enabled
    #[serde(skip_serializing_if = "Option::is_none")]
    pub speaker: Option<String>,
    /// Confidence score for this event
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confidence: Option<f64>,
    /// Error information (for type: "error")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<TranscriptionError>,
    /// Additional event data
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,
}

/// Audio chunk for streaming transcription
#[derive(Debug, Clone)]
pub struct AudioChunk {
    /// Audio data as bytes
    pub data: Vec<u8>,
    /// Whether this is the last chunk (optional, matches TypeScript)
    pub is_last: Option<bool>,
}

/// Options for streaming transcription
/// Extends TranscribeOptions (minus webhookUrl) with streaming-specific options
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct StreamingOptions {
    // --- Fields from TranscribeOptions (minus webhookUrl) ---
    /// Language code (e.g., 'en', 'en-US', 'es')
    #[serde(skip_serializing_if = "Option::is_none")]
    pub language: Option<String>,
    /// Enable automatic language detection
    #[serde(skip_serializing_if = "Option::is_none")]
    pub language_detection: Option<bool>,
    /// Enable speaker diarization
    #[serde(skip_serializing_if = "Option::is_none")]
    pub diarization: Option<bool>,
    /// Expected number of speakers (for diarization)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub speakers_expected: Option<u32>,
    /// Enable word-level timestamps
    #[serde(skip_serializing_if = "Option::is_none")]
    pub word_timestamps: Option<bool>,
    /// Custom vocabulary to boost
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom_vocabulary: Option<Vec<String>>,
    /// Enable summarization
    #[serde(skip_serializing_if = "Option::is_none")]
    pub summarization: Option<bool>,
    /// Enable sentiment analysis
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sentiment_analysis: Option<bool>,
    /// Enable entity detection
    #[serde(skip_serializing_if = "Option::is_none")]
    pub entity_detection: Option<bool>,
    /// Enable PII redaction
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pii_redaction: Option<bool>,
    /// Custom metadata to attach
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, serde_json::Value>>,
    // --- Streaming-specific options ---
    /// Audio encoding format (linear16, mulaw, etc.)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub encoding: Option<String>,
    /// Sample rate in Hz (8000, 16000, 32000, 44100, 48000)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sample_rate: Option<u32>,
    /// Number of audio channels (1-8)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub channels: Option<u8>,
    /// Bit depth for PCM audio (8, 16, 24, 32)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bit_depth: Option<u8>,
    /// Enable interim results (partial transcripts)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub interim_results: Option<bool>,
    /// Utterance end silence threshold in milliseconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub endpointing: Option<u32>,
    /// Maximum duration without endpointing in seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_silence: Option<u32>,
    /// Model to use for transcription (provider-specific)
    ///
    /// - Deepgram: "nova-2", "nova-3", "base", "enhanced", "whisper-large", etc.
    /// - Gladia: "solaria-1" (default)
    /// - AssemblyAI: Not applicable (uses Universal-2 automatically)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
}

/// Streaming session status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SessionStatus {
    Connecting,
    Open,
    Closing,
    Closed,
}

/// Callback functions for streaming events
///
/// These callbacks provide a way to handle streaming events similar to
/// the TypeScript SDK's callback-based API.
pub struct StreamingCallbacks {
    /// Called when connection is established
    pub on_open: Option<Arc<dyn Fn() + Send + Sync>>,
    /// Called when a transcript (interim or final) is received
    pub on_transcript: Option<Arc<dyn Fn(StreamEvent) + Send + Sync>>,
    /// Called when a complete utterance is detected
    pub on_utterance: Option<Arc<dyn Fn(Utterance) + Send + Sync>>,
    /// Called when metadata is received
    pub on_metadata: Option<Arc<dyn Fn(HashMap<String, serde_json::Value>) + Send + Sync>>,
    /// Called when an error occurs
    pub on_error: Option<Arc<dyn Fn(TranscriptionError) + Send + Sync>>,
    /// Called when the stream is closed
    pub on_close: Option<Arc<dyn Fn(Option<u16>, Option<String>) + Send + Sync>>,
}

impl Default for StreamingCallbacks {
    fn default() -> Self {
        Self {
            on_open: None,
            on_transcript: None,
            on_utterance: None,
            on_metadata: None,
            on_error: None,
            on_close: None,
        }
    }
}

impl std::fmt::Debug for StreamingCallbacks {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("StreamingCallbacks")
            .field("on_open", &self.on_open.as_ref().map(|_| "<callback>"))
            .field("on_transcript", &self.on_transcript.as_ref().map(|_| "<callback>"))
            .field("on_utterance", &self.on_utterance.as_ref().map(|_| "<callback>"))
            .field("on_metadata", &self.on_metadata.as_ref().map(|_| "<callback>"))
            .field("on_error", &self.on_error.as_ref().map(|_| "<callback>"))
            .field("on_close", &self.on_close.as_ref().map(|_| "<callback>"))
            .finish()
    }
}

/// Represents an active streaming transcription session (interface)
///
/// This matches the TypeScript StreamingSession interface with methods
/// for sending audio, closing, and getting status.
pub struct StreamingSessionHandle {
    /// Unique session ID
    pub id: String,
    /// Provider handling this stream
    pub provider: TranscriptionProvider,
    /// Session creation timestamp
    pub created_at: std::time::Instant,
    /// Internal status
    status: std::sync::atomic::AtomicU8,
    /// Channel to send audio chunks
    audio_tx: tokio::sync::mpsc::Sender<AudioChunk>,
    /// Close signal sender
    close_tx: Option<tokio::sync::oneshot::Sender<()>>,
}

impl StreamingSessionHandle {
    /// Create a new streaming session handle
    pub fn new(
        id: String,
        provider: TranscriptionProvider,
        audio_tx: tokio::sync::mpsc::Sender<AudioChunk>,
        close_tx: tokio::sync::oneshot::Sender<()>,
    ) -> Self {
        Self {
            id,
            provider,
            created_at: std::time::Instant::now(),
            status: std::sync::atomic::AtomicU8::new(0), // Connecting
            audio_tx,
            close_tx: Some(close_tx),
        }
    }

    /// Send an audio chunk to the stream
    pub async fn send_audio(&self, chunk: AudioChunk) -> Result<(), String> {
        self.audio_tx
            .send(chunk)
            .await
            .map_err(|e| format!("Failed to send audio: {}", e))
    }

    /// Close the streaming session
    pub async fn close(&mut self) -> Result<(), String> {
        if let Some(tx) = self.close_tx.take() {
            tx.send(())
                .map_err(|_| "Failed to send close signal".to_string())?;
        }
        self.set_status(SessionStatus::Closed);
        Ok(())
    }

    /// Get current session status
    pub fn get_status(&self) -> SessionStatus {
        match self.status.load(std::sync::atomic::Ordering::SeqCst) {
            0 => SessionStatus::Connecting,
            1 => SessionStatus::Open,
            2 => SessionStatus::Closing,
            _ => SessionStatus::Closed,
        }
    }

    /// Set session status
    pub fn set_status(&self, status: SessionStatus) {
        let value = match status {
            SessionStatus::Connecting => 0,
            SessionStatus::Open => 1,
            SessionStatus::Closing => 2,
            SessionStatus::Closed => 3,
        };
        self.status.store(value, std::sync::atomic::Ordering::SeqCst);
    }
}

impl std::fmt::Debug for StreamingSessionHandle {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("StreamingSessionHandle")
            .field("id", &self.id)
            .field("provider", &self.provider)
            .field("status", &self.get_status())
            .field("created_at", &self.created_at)
            .finish()
    }
}
