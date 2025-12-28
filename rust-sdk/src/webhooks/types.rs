//! Unified webhook types

use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::types::{
    Speaker, TranscriptionProvider, TranscriptionStatus, Utterance, Word,
};

/// Webhook event types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum WebhookEventType {
    #[serde(rename = "transcription.created")]
    TranscriptionCreated,
    #[serde(rename = "transcription.processing")]
    TranscriptionProcessing,
    #[serde(rename = "transcription.completed")]
    TranscriptionCompleted,
    #[serde(rename = "transcription.failed")]
    TranscriptionFailed,
}

/// Unified webhook event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedWebhookEvent {
    /// Whether the operation was successful
    pub success: bool,
    /// Provider that sent this webhook
    pub provider: TranscriptionProvider,
    /// Type of webhook event
    pub event_type: WebhookEventType,
    /// Transcription data (if available)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<WebhookTranscriptionData>,
    /// Event timestamp
    pub timestamp: String,
    /// Original webhook payload
    #[serde(skip_serializing_if = "Option::is_none")]
    pub raw: Option<serde_json::Value>,
}

/// Transcription data from webhook
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebhookTranscriptionData {
    /// Transcription job ID
    pub id: String,
    /// Current status
    pub status: TranscriptionStatus,
    /// Full transcribed text
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    /// Overall confidence score
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confidence: Option<f64>,
    /// Audio duration in seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<f64>,
    /// Detected language
    #[serde(skip_serializing_if = "Option::is_none")]
    pub language: Option<String>,
    /// Speaker diarization results
    #[serde(skip_serializing_if = "Option::is_none")]
    pub speakers: Option<Vec<Speaker>>,
    /// Word-level transcription
    #[serde(skip_serializing_if = "Option::is_none")]
    pub words: Option<Vec<Word>>,
    /// Utterances
    #[serde(skip_serializing_if = "Option::is_none")]
    pub utterances: Option<Vec<Utterance>>,
    /// Summary
    #[serde(skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
    /// Error message (for failed events)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    /// Additional metadata
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

/// Webhook parsing errors
#[derive(Debug, Error)]
pub enum WebhookError {
    #[error("JSON parsing error: {0}")]
    JsonError(#[from] serde_json::Error),

    #[error("Invalid payload structure: {0}")]
    InvalidPayload(String),

    #[error("Unknown webhook event: {0}")]
    UnknownEvent(String),

    #[error("Unknown provider")]
    UnknownProvider,

    #[error("Unsupported provider: {0}")]
    UnsupportedProvider(String),
}
