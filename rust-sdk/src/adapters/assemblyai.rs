//! AssemblyAI adapter implementation
//!
//! Provides transcription services using AssemblyAI's API with full type safety
//! via generated OpenAPI client.

use async_trait::async_trait;
use serde::Deserialize;
use std::collections::HashSet;
use tokio::sync::{mpsc, oneshot};
use tokio_tungstenite::tungstenite::Message;

use super::streaming::{self, AudioBuffer, AudioEncoding, WebSocketConnection};
use super::{AdapterError, ProviderConfig, StreamingSession, TranscriptionAdapter};
use crate::types::{
    AudioInput, ProviderCapabilities, Speaker, StreamEvent, StreamEventType, StreamingOptions,
    TranscribeOptions, TranscriptionData, TranscriptionError, TranscriptionProvider,
    TranscriptionStatus, UnifiedTranscriptResponse, Utterance, Word,
};

// Import generated AssemblyAI client types
use assemblyai_client::apis::configuration::Configuration;
use assemblyai_client::apis::transcript_api::{
    create_transcript, delete_transcript, get_transcript,
};
use assemblyai_client::models::{
    Transcript, TranscriptParams, TranscriptStatus as AaiStatus, TranscriptUtterance,
    TranscriptWord,
};

const DEFAULT_BASE_URL: &str = "https://api.assemblyai.com";
const STREAMING_URL: &str = "wss://streaming.assemblyai.com/v3/ws";

/// AssemblyAI streaming message types (v3 Universal Streaming)
#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type")]
enum AssemblyAIStreamMessage {
    /// Session begin event
    Begin {
        id: String,
        expires_at: String,
    },
    /// Transcription turn event
    Turn {
        transcript: String,
        #[serde(default)]
        end_of_turn: bool,
        #[serde(default)]
        end_of_turn_confidence: f64,
        #[serde(default)]
        words: Vec<AssemblyAIWord>,
    },
    /// Session termination event
    Termination {
        #[serde(default)]
        audio_duration_seconds: f64,
        #[serde(default)]
        session_duration_seconds: f64,
    },
    /// Session information event
    SessionInformation {
        #[serde(flatten)]
        _data: serde_json::Value,
    },
}

/// AssemblyAI error message (different structure)
#[derive(Debug, Clone, Deserialize)]
struct AssemblyAIErrorMessage {
    error: String,
}

#[derive(Debug, Clone, Deserialize)]
struct AssemblyAIWord {
    text: String,
    start: i64,
    end: i64,
    confidence: f64,
}

/// AssemblyAI adapter for speech-to-text transcription
///
/// Uses the generated OpenAPI client for full type safety.
pub struct AssemblyAIAdapter {
    config: Option<ProviderConfig>,
    api_config: Option<Configuration>,
}

impl AssemblyAIAdapter {
    /// Create a new AssemblyAI adapter
    pub fn new() -> Self {
        Self {
            config: None,
            api_config: None,
        }
    }

    /// Build the API configuration from provider config
    fn build_api_config(config: &ProviderConfig) -> Configuration {
        let mut api_config = Configuration::new();
        api_config.base_path = config
            .base_url
            .clone()
            .unwrap_or_else(|| DEFAULT_BASE_URL.to_string());
        api_config.api_key = Some(assemblyai_client::apis::configuration::ApiKey {
            prefix: None,
            key: config.api_key.clone(),
        });
        api_config
    }

    /// Build transcription request from unified options
    fn build_transcript_params(
        audio_url: String,
        options: Option<&TranscribeOptions>,
    ) -> TranscriptParams {
        let mut params = TranscriptParams::new(audio_url);

        if let Some(opts) = options {
            // Language detection
            if opts.language_detection == Some(true) {
                params.language_detection = Some(true);
            }

            // Speaker diarization
            if opts.diarization == Some(true) {
                params.speaker_labels = Some(true);
                if let Some(speakers) = opts.speakers_expected {
                    params.speakers_expected = Some(speakers as i32);
                }
            }

            // Custom vocabulary (keyterms_prompt in AssemblyAI)
            if let Some(ref vocab) = opts.custom_vocabulary {
                if !vocab.is_empty() {
                    params.keyterms_prompt = Some(vocab.clone());
                }
            }

            // Summarization
            if opts.summarization == Some(true) {
                params.summarization = Some(true);
            }

            // Sentiment analysis
            if opts.sentiment_analysis == Some(true) {
                params.sentiment_analysis = Some(true);
            }

            // Entity detection
            if opts.entity_detection == Some(true) {
                params.entity_detection = Some(true);
            }

            // PII redaction
            if opts.pii_redaction == Some(true) {
                params.redact_pii = Some(true);
            }

            // Webhook
            if let Some(ref webhook_url) = opts.webhook_url {
                params.webhook_url = Some(webhook_url.clone());
            }
        }

        params
    }

    /// Map Word from generated type to unified type
    fn map_word(word: &TranscriptWord) -> Word {
        Word {
            text: word.text.clone(),
            start: word.start as f64 / 1000.0, // Convert ms to seconds
            end: word.end as f64 / 1000.0,     // Convert ms to seconds
            confidence: Some(word.confidence),
            speaker: word.speaker.clone(),
        }
    }

    /// Map Utterance from generated type to unified type
    fn map_utterance(utterance: &TranscriptUtterance) -> Utterance {
        Utterance {
            text: utterance.text.clone(),
            start: utterance.start as f64 / 1000.0, // Convert ms to seconds
            end: utterance.end as f64 / 1000.0,     // Convert ms to seconds
            confidence: Some(utterance.confidence),
            speaker: Some(utterance.speaker.clone()),
            words: Some(utterance.words.iter().map(Self::map_word).collect()),
        }
    }

    /// Extract unique speakers from utterances
    fn extract_speakers(utterances: &[TranscriptUtterance]) -> Option<Vec<Speaker>> {
        let speaker_ids: HashSet<&String> = utterances.iter().map(|u| &u.speaker).collect();

        if speaker_ids.is_empty() {
            return None;
        }

        Some(
            speaker_ids
                .into_iter()
                .map(|id| Speaker {
                    id: id.clone(),
                    label: Some(format!("Speaker {}", id)),
                    confidence: None,
                })
                .collect(),
        )
    }

    /// Build streaming WebSocket URL with query parameters
    fn build_streaming_url(options: &StreamingOptions) -> String {
        let mut url = format!("{}?", STREAMING_URL);
        let mut params = Vec::new();

        // Sample rate (default 16000)
        let sample_rate = options.sample_rate.unwrap_or(16000);
        params.push(format!("sample_rate={}", sample_rate));

        // Encoding
        if let Some(ref encoding) = options.encoding {
            if let Some(enc) = AudioEncoding::from_str(encoding) {
                params.push(format!("encoding={}", enc.to_assemblyai()));
            }
        }

        url.push_str(&params.join("&"));
        url
    }

    /// Parse streaming message into unified event
    fn parse_streaming_message(text: &str) -> Option<StreamEvent> {
        // First try to parse as error message
        if let Ok(err) = serde_json::from_str::<AssemblyAIErrorMessage>(text) {
            return Some(StreamEvent {
                event_type: StreamEventType::Error,
                text: None,
                is_final: None,
                utterance: None,
                words: None,
                speaker: None,
                confidence: None,
                error: Some(TranscriptionError {
                    code: "PROVIDER_ERROR".to_string(),
                    message: err.error,
                    details: None,
                    status_code: None,
                }),
                data: None,
            });
        }

        // Try to parse as typed message
        let msg: AssemblyAIStreamMessage = serde_json::from_str(text).ok()?;

        match msg {
            AssemblyAIStreamMessage::Begin { id, expires_at } => Some(StreamEvent {
                event_type: StreamEventType::Metadata,
                text: Some(format!(r#"{{"id":"{}","expires_at":"{}"}}"#, id, expires_at)),
                is_final: None,
                utterance: None,
                words: None,
                speaker: None,
                confidence: None,
                error: None,
                data: None,
            }),
            AssemblyAIStreamMessage::Turn {
                transcript,
                end_of_turn,
                end_of_turn_confidence,
                words,
            } => {
                let mapped_words: Vec<Word> = words
                    .into_iter()
                    .map(|w| Word {
                        text: w.text,
                        start: w.start as f64 / 1000.0, // Convert ms to seconds
                        end: w.end as f64 / 1000.0,
                        confidence: Some(w.confidence),
                        speaker: None,
                    })
                    .collect();

                Some(StreamEvent {
                    event_type: StreamEventType::Transcript,
                    text: Some(transcript),
                    is_final: Some(end_of_turn),
                    utterance: None,
                    words: if mapped_words.is_empty() {
                        None
                    } else {
                        Some(mapped_words)
                    },
                    speaker: None,
                    confidence: if end_of_turn {
                        Some(end_of_turn_confidence)
                    } else {
                        None
                    },
                    error: None,
                    data: None,
                })
            }
            AssemblyAIStreamMessage::Termination {
                audio_duration_seconds,
                session_duration_seconds,
            } => Some(StreamEvent {
                event_type: StreamEventType::Metadata,
                text: Some(format!(
                    r#"{{"audio_duration":{},"session_duration":{}}}"#,
                    audio_duration_seconds, session_duration_seconds
                )),
                is_final: None,
                utterance: None,
                words: None,
                speaker: None,
                confidence: None,
                error: None,
                data: None,
            }),
            // Session information - informational, don't forward
            AssemblyAIStreamMessage::SessionInformation { .. } => None,
        }
    }

    /// Normalize AssemblyAI response to unified format
    fn normalize_response(&self, response: Transcript) -> UnifiedTranscriptResponse {
        let status = match response.status {
            AaiStatus::Queued => TranscriptionStatus::Queued,
            AaiStatus::Processing => TranscriptionStatus::Processing,
            AaiStatus::Completed => TranscriptionStatus::Completed,
            AaiStatus::Error => TranscriptionStatus::Error,
        };

        // Serialize before moving fields
        let raw = serde_json::to_value(&response).unwrap_or_default();

        // Handle error state
        if response.status == AaiStatus::Error {
            return UnifiedTranscriptResponse {
                success: false,
                provider: TranscriptionProvider::AssemblyAI,
                data: None,
                error: Some(TranscriptionError {
                    code: "TRANSCRIPTION_ERROR".into(),
                    message: response
                        .error
                        .clone()
                        .unwrap_or_else(|| "Transcription failed".into()),
                    details: None,
                    status_code: None,
                }),
                raw: Some(raw),
            };
        }

        // Extract text (handle double Option)
        let text = response
            .text
            .flatten()
            .unwrap_or_default();

        // Extract words (handle double Option)
        let words: Option<Vec<Word>> = response
            .words
            .flatten()
            .map(|words| words.iter().map(Self::map_word).collect());

        // Extract speakers from utterances (before moving utterances)
        let speakers = response
            .utterances
            .as_ref()
            .and_then(|opt| opt.as_ref())
            .and_then(|utts| Self::extract_speakers(utts));

        // Extract utterances (handle double Option)
        let utterances: Option<Vec<Utterance>> = response
            .utterances
            .flatten()
            .map(|utts| utts.iter().map(Self::map_utterance).collect());

        // Extract summary (handle double Option)
        let summary = response.summary.flatten();

        // Extract confidence (handle double Option)
        let confidence = response.confidence.flatten();

        // Extract duration (handle double Option, convert ms to seconds)
        let duration = response
            .audio_duration
            .flatten()
            .map(|d| d as f64 / 1000.0);

        // Extract language (use as_ref to avoid moving)
        let language = response
            .language_code
            .as_ref()
            .map(|lc| format!("{:?}", lc));

        UnifiedTranscriptResponse {
            success: true,
            provider: TranscriptionProvider::AssemblyAI,
            data: Some(TranscriptionData {
                id: response.id.to_string(),
                text,
                confidence,
                status,
                language,
                duration,
                speakers,
                words,
                utterances,
                summary,
                metadata: None,
                created_at: None,
                completed_at: None,
            }),
            error: None,
            raw: Some(raw),
        }
    }

    /// Poll for transcription completion
    async fn poll_for_completion(
        &self,
        transcript_id: &str,
    ) -> Result<UnifiedTranscriptResponse, AdapterError> {
        let api_config = self
            .api_config
            .as_ref()
            .ok_or(AdapterError::NotInitialized)?;

        const MAX_ATTEMPTS: u32 = 120;
        const POLL_INTERVAL_MS: u64 = 1000;

        for _ in 0..MAX_ATTEMPTS {
            let response = get_transcript(api_config, transcript_id)
                .await
                .map_err(|e| AdapterError::ProviderError {
                    code: "API_ERROR".into(),
                    message: e.to_string(),
                })?;

            match response.status {
                AaiStatus::Completed | AaiStatus::Error => {
                    return Ok(self.normalize_response(response));
                }
                _ => {
                    tokio::time::sleep(tokio::time::Duration::from_millis(POLL_INTERVAL_MS)).await;
                }
            }
        }

        Ok(UnifiedTranscriptResponse {
            success: false,
            provider: TranscriptionProvider::AssemblyAI,
            data: None,
            error: Some(TranscriptionError {
                code: "POLLING_TIMEOUT".into(),
                message: format!(
                    "Transcription did not complete after {} attempts",
                    MAX_ATTEMPTS
                ),
                details: None,
                status_code: None,
            }),
            raw: None,
        })
    }
}

impl Default for AssemblyAIAdapter {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl TranscriptionAdapter for AssemblyAIAdapter {
    fn name(&self) -> TranscriptionProvider {
        TranscriptionProvider::AssemblyAI
    }

    fn capabilities(&self) -> ProviderCapabilities {
        ProviderCapabilities {
            streaming: true,
            diarization: true,
            word_timestamps: true,
            language_detection: true,
            custom_vocabulary: true,
            summarization: true,
            sentiment_analysis: true,
            entity_detection: true,
            pii_redaction: true,
        }
    }

    fn initialize(&mut self, config: ProviderConfig) -> Result<(), AdapterError> {
        if config.api_key.is_empty() {
            return Err(AdapterError::InvalidConfig("API key is required".into()));
        }
        self.api_config = Some(Self::build_api_config(&config));
        self.config = Some(config);
        Ok(())
    }

    async fn transcribe(
        &self,
        audio: AudioInput,
        options: Option<TranscribeOptions>,
    ) -> Result<UnifiedTranscriptResponse, AdapterError> {
        let api_config = self
            .api_config
            .as_ref()
            .ok_or(AdapterError::NotInitialized)?;

        // Get audio URL
        let audio_url = match audio {
            AudioInput::Url(url) => url,
            AudioInput::Bytes { .. } => {
                return Err(AdapterError::NotSupported(
                    "File upload not yet implemented - use URL input".into(),
                ));
            }
            AudioInput::Stream(_) => {
                return Err(AdapterError::NotSupported(
                    "Use transcribe_stream for streaming audio".into(),
                ));
            }
        };

        // Build typed request using generated types
        let params = Self::build_transcript_params(audio_url, options.as_ref());

        // Use generated API client function - FULLY TYPED!
        let response = create_transcript(api_config, params)
            .await
            .map_err(|e| AdapterError::ProviderError {
                code: "API_ERROR".into(),
                message: e.to_string(),
            })?;

        let transcript_id = response.id.to_string();

        // If webhook is provided, return immediately with job ID
        if options
            .as_ref()
            .and_then(|o| o.webhook_url.as_ref())
            .is_some()
        {
            return Ok(UnifiedTranscriptResponse {
                success: true,
                provider: TranscriptionProvider::AssemblyAI,
                data: Some(TranscriptionData {
                    id: transcript_id,
                    text: String::new(),
                    confidence: None,
                    status: TranscriptionStatus::Queued,
                    language: None,
                    duration: None,
                    speakers: None,
                    words: None,
                    utterances: None,
                    summary: None,
                    metadata: None,
                    created_at: None,
                    completed_at: None,
                }),
                error: None,
                raw: Some(serde_json::to_value(&response).unwrap_or_default()),
            });
        }

        // Otherwise, poll for results
        self.poll_for_completion(&transcript_id).await
    }

    async fn get_transcript(
        &self,
        transcript_id: &str,
    ) -> Result<UnifiedTranscriptResponse, AdapterError> {
        let api_config = self
            .api_config
            .as_ref()
            .ok_or(AdapterError::NotInitialized)?;

        let response = get_transcript(api_config, transcript_id)
            .await
            .map_err(|e| AdapterError::ProviderError {
                code: "API_ERROR".into(),
                message: e.to_string(),
            })?;

        Ok(self.normalize_response(response))
    }

    async fn delete_transcript(&self, transcript_id: &str) -> Result<bool, AdapterError> {
        let api_config = self
            .api_config
            .as_ref()
            .ok_or(AdapterError::NotInitialized)?;

        delete_transcript(api_config, transcript_id)
            .await
            .map_err(|e| AdapterError::ProviderError {
                code: "API_ERROR".into(),
                message: e.to_string(),
            })?;

        Ok(true)
    }

    async fn transcribe_stream(
        &self,
        options: Option<StreamingOptions>,
    ) -> Result<StreamingSession, AdapterError> {
        let config = self.config.as_ref().ok_or(AdapterError::NotInitialized)?;

        let opts = options.unwrap_or_default();
        let url = Self::build_streaming_url(&opts);

        // Create channels for communication
        let (audio_tx, mut audio_rx) = mpsc::channel::<Vec<u8>>(32);
        let (event_tx, event_rx) = mpsc::channel::<StreamEvent>(32);
        let (close_tx, mut close_rx) = oneshot::channel::<()>();

        let session_id = streaming::generate_session_id();
        let api_key = config.api_key.clone();

        // Spawn WebSocket handler task
        tokio::spawn(async move {
            // Connect to AssemblyAI WebSocket
            let conn_result = WebSocketConnection::connect(
                &url,
                vec![("Authorization", &api_key)],
            )
            .await;

            let mut ws = match conn_result {
                Ok(ws) => ws,
                Err(e) => {
                    let _ = event_tx
                        .send(streaming::error_event("CONNECTION_ERROR", e.to_string()))
                        .await;
                    return;
                }
            };

            // Send open event
            let _ = event_tx.send(streaming::open_event()).await;

            // Audio buffer for AssemblyAI (requires 50ms-1000ms chunks)
            let mut audio_buffer = AudioBuffer::for_assemblyai();

            loop {
                tokio::select! {
                    // Handle incoming audio from user
                    Some(audio_data) = audio_rx.recv() => {
                        // Buffer audio and send when ready
                        for chunk in audio_buffer.add(audio_data) {
                            if let Err(e) = ws.send_binary(chunk).await {
                                let _ = event_tx.send(streaming::error_event("SEND_ERROR", e.to_string())).await;
                                break;
                            }
                        }
                    }

                    // Handle incoming WebSocket messages
                    msg = ws.recv() => {
                        match msg {
                            Some(Ok(Message::Text(text))) => {
                                if let Some(event) = Self::parse_streaming_message(&text) {
                                    if event_tx.send(event).await.is_err() {
                                        break;
                                    }
                                }
                            }
                            Some(Ok(Message::Close(_))) => {
                                let _ = event_tx.send(streaming::close_event()).await;
                                break;
                            }
                            Some(Err(e)) => {
                                let _ = event_tx.send(streaming::error_event("WEBSOCKET_ERROR", e.to_string())).await;
                                break;
                            }
                            None => {
                                let _ = event_tx.send(streaming::close_event()).await;
                                break;
                            }
                            _ => {}
                        }
                    }

                    // Handle close signal
                    _ = &mut close_rx => {
                        // Flush remaining buffered audio
                        if let Some(chunk) = audio_buffer.flush() {
                            let _ = ws.send_binary(chunk).await;
                        }
                        // Send terminate session message to AssemblyAI
                        let _ = ws.send_text(r#"{"terminate_session":true}"#).await;
                        let _ = ws.close().await;
                        let _ = event_tx.send(streaming::close_event()).await;
                        break;
                    }
                }
            }
        });

        Ok(StreamingSession {
            id: session_id,
            provider: TranscriptionProvider::AssemblyAI,
            audio_tx,
            event_rx,
            close_tx,
        })
    }
}
