//! Gladia adapter implementation
//!
//! Provides transcription services using Gladia's API with full type safety
//! via generated OpenAPI client.

use async_trait::async_trait;
use serde::Deserialize;
use std::collections::HashSet;
use tokio::sync::{mpsc, oneshot};
use tokio_tungstenite::tungstenite::Message;

use super::streaming::{self, AudioEncoding, WebSocketConnection};
use super::{AdapterError, ProviderConfig, StreamingSession, TranscriptionAdapter};
use crate::types::{
    AudioInput, ProviderCapabilities, Speaker, StreamEvent, StreamEventType, StreamingOptions,
    TranscribeOptions, TranscriptionData, TranscriptionError, TranscriptionProvider,
    TranscriptionStatus, UnifiedTranscriptResponse, Utterance, Word,
};

// Import generated Gladia client types
use gladia_client::apis::configuration::Configuration;
use gladia_client::apis::live_v2_api::streaming_controller_init_streaming_session_v2;
use gladia_client::apis::pre_recorded_v2_api::{
    pre_recorded_controller_delete_pre_recorded_job_v2,
    pre_recorded_controller_get_pre_recorded_job_v2,
    pre_recorded_controller_init_pre_recorded_job_v2,
};
use gladia_client::models::{
    pre_recorded_response::Status as GladiaStatus, CallbackConfigDto, CustomVocabularyConfigDto,
    DiarizationConfigDto, InitTranscriptionRequest, LanguageConfig, PreRecordedResponse,
    StreamingRequest, StreamingSupportedBitDepthEnum, StreamingSupportedEncodingEnum,
    StreamingSupportedModels, StreamingSupportedSampleRateEnum, TranscriptionDto,
    TranscriptionResultDto, UtteranceDto, WordDto,
};

const DEFAULT_BASE_URL: &str = "https://api.gladia.io";

/// Gladia streaming message types
#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type")]
#[serde(rename_all = "snake_case")]
enum GladiaStreamMessage {
    /// Interim or final transcript
    Transcript {
        data: GladiaTranscriptData,
    },
    /// Completed utterance
    Utterance {
        data: GladiaUtteranceData,
    },
    /// Metadata message
    Metadata {
        #[serde(flatten)]
        data: serde_json::Value,
    },
    /// Error message
    Error {
        message: String,
    },
}

#[derive(Debug, Clone, Deserialize)]
struct GladiaTranscriptData {
    is_final: bool,
    utterance: GladiaUtteranceInfo,
}

#[derive(Debug, Clone, Deserialize)]
struct GladiaUtteranceData {
    utterance: GladiaUtteranceInfo,
}

#[derive(Debug, Clone, Deserialize)]
struct GladiaUtteranceInfo {
    text: String,
    start: f64,
    end: f64,
    #[serde(default)]
    speaker: Option<i32>,
    confidence: f64,
    #[serde(default)]
    words: Vec<GladiaStreamWord>,
}

#[derive(Debug, Clone, Deserialize)]
struct GladiaStreamWord {
    word: String,
    start: f64,
    end: f64,
    confidence: f64,
}

/// Gladia adapter for speech-to-text transcription
///
/// Uses the generated OpenAPI client for full type safety.
pub struct GladiaAdapter {
    config: Option<ProviderConfig>,
    api_config: Option<Configuration>,
}

impl GladiaAdapter {
    /// Create a new Gladia adapter
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
        api_config.api_key = Some(gladia_client::apis::configuration::ApiKey {
            prefix: None,
            key: config.api_key.clone(),
        });
        api_config
    }

    /// Build transcription request from unified options (matching TypeScript)
    fn build_transcription_request(
        audio_url: String,
        options: Option<&TranscribeOptions>,
    ) -> InitTranscriptionRequest {
        let mut request = InitTranscriptionRequest::new(audio_url);

        if let Some(opts) = options {
            // Language configuration (matching TypeScript's language_config)
            if opts.language.is_some() || opts.language_detection.is_some() {
                let mut lang_config = LanguageConfig::default();
                // Note: language codes would need to be validated against TranscriptionLanguageCodeEnum
                // For now we'll set code_switching for language detection
                if opts.language_detection == Some(true) {
                    lang_config.code_switching = Some(true);
                }
                request.language_config = Some(Box::new(lang_config));
            }

            // Diarization (speaker recognition)
            if opts.diarization == Some(true) {
                request.diarization = Some(true);
                if let Some(speakers) = opts.speakers_expected {
                    let mut diarization_config = DiarizationConfigDto::default();
                    diarization_config.number_of_speakers = Some(speakers as i32);
                    request.diarization_config = Some(Box::new(diarization_config));
                }
            }

            // Custom vocabulary
            if let Some(ref vocab) = opts.custom_vocabulary {
                if !vocab.is_empty() {
                    request.custom_vocabulary = Some(true);
                    let vocab_entries: Vec<_> = vocab
                        .iter()
                        .map(|s| {
                            gladia_client::models::CustomVocabularyConfigDtoVocabularyInner::String(
                                s.clone(),
                            )
                        })
                        .collect();
                    let vocab_config = CustomVocabularyConfigDto::new(vocab_entries);
                    request.custom_vocabulary_config = Some(Box::new(vocab_config));
                }
            }

            // Summarization
            if opts.summarization == Some(true) {
                request.summarization = Some(true);
            }

            // Sentiment analysis
            if opts.sentiment_analysis == Some(true) {
                request.sentiment_analysis = Some(true);
            }

            // Named entity recognition (entity detection)
            if opts.entity_detection == Some(true) {
                request.named_entity_recognition = Some(true);
            }

            // Webhook callback
            if let Some(ref webhook_url) = opts.webhook_url {
                request.callback = Some(true);
                let callback_config = CallbackConfigDto::new(webhook_url.clone());
                request.callback_config = Some(Box::new(callback_config));
            }

            // Custom metadata
            if let Some(ref metadata) = opts.metadata {
                request.custom_metadata = Some(metadata.clone());
            }
        }

        request
    }

    /// Map Word from generated type to unified type
    fn map_word(word: &WordDto) -> Word {
        Word {
            text: word.word.clone(),
            start: word.start,
            end: word.end,
            confidence: Some(word.confidence),
            speaker: None,
        }
    }

    /// Map Utterance from generated type to unified type
    fn map_utterance(utterance: &UtteranceDto) -> Utterance {
        Utterance {
            text: utterance.text.clone(),
            start: utterance.start,
            end: utterance.end,
            confidence: Some(utterance.confidence),
            speaker: utterance.speaker.map(|s| s.to_string()),
            words: Some(utterance.words.iter().map(Self::map_word).collect()),
        }
    }

    /// Extract unique speakers from utterances
    fn extract_speakers(transcription: &TranscriptionDto) -> Option<Vec<Speaker>> {
        let speaker_ids: HashSet<i32> = transcription
            .utterances
            .iter()
            .filter_map(|u| u.speaker)
            .collect();

        if speaker_ids.is_empty() {
            return None;
        }

        Some(
            speaker_ids
                .into_iter()
                .map(|id| Speaker {
                    id: id.to_string(),
                    label: Some(format!("Speaker {}", id)),
                    confidence: None,
                })
                .collect(),
        )
    }

    /// Extract words from all utterances
    fn extract_words(transcription: &TranscriptionDto) -> Option<Vec<Word>> {
        let words: Vec<Word> = transcription
            .utterances
            .iter()
            .flat_map(|u| {
                let speaker = u.speaker.map(|s| s.to_string());
                u.words.iter().map(move |w| Word {
                    text: w.word.clone(),
                    start: w.start,
                    end: w.end,
                    confidence: Some(w.confidence),
                    speaker: speaker.clone(),
                })
            })
            .collect();

        if words.is_empty() {
            None
        } else {
            Some(words)
        }
    }

    /// Extract summary from result
    fn extract_summary(result: &TranscriptionResultDto) -> Option<String> {
        result.summarization.as_ref().map(|s| s.results.clone())
    }

    /// Build streaming request from options
    fn build_streaming_request(options: &StreamingOptions) -> StreamingRequest {
        let mut request = StreamingRequest::new();

        // Sample rate
        if let Some(rate) = options.sample_rate {
            request.sample_rate = match rate {
                8000 => Some(StreamingSupportedSampleRateEnum::Variant8000),
                16000 => Some(StreamingSupportedSampleRateEnum::Variant16000),
                32000 => Some(StreamingSupportedSampleRateEnum::Variant32000),
                44100 => Some(StreamingSupportedSampleRateEnum::Variant44100),
                48000 => Some(StreamingSupportedSampleRateEnum::Variant48000),
                _ => Some(StreamingSupportedSampleRateEnum::Variant16000), // Default
            };
        }

        // Encoding
        if let Some(ref encoding) = options.encoding {
            if let Some(enc) = AudioEncoding::from_str(encoding) {
                request.encoding = match enc {
                    AudioEncoding::Pcm16 => Some(StreamingSupportedEncodingEnum::WavSlashPcm),
                    AudioEncoding::Mulaw => Some(StreamingSupportedEncodingEnum::WavSlashUlaw),
                    AudioEncoding::Alaw => Some(StreamingSupportedEncodingEnum::WavSlashAlaw),
                    _ => Some(StreamingSupportedEncodingEnum::WavSlashPcm),
                };
                // Set bit depth for PCM
                if enc == AudioEncoding::Pcm16 {
                    request.bit_depth = Some(StreamingSupportedBitDepthEnum::Variant16);
                }
            }
        }

        // Channels
        if let Some(channels) = options.channels {
            request.channels = Some(channels as i32);
        }

        // Model (solaria-1 is the only option currently)
        if let Some(ref model) = options.model {
            if model == "solaria-1" {
                request.model = Some(StreamingSupportedModels::Solaria1);
            }
            // Ignore unsupported model names - will use default
        }

        request
    }

    /// Parse streaming message into unified event
    fn parse_streaming_message(text: &str) -> Option<StreamEvent> {
        let msg: GladiaStreamMessage = serde_json::from_str(text).ok()?;

        match msg {
            GladiaStreamMessage::Transcript { data } => {
                let words: Vec<Word> = data
                    .utterance
                    .words
                    .iter()
                    .map(|w| Word {
                        text: w.word.clone(),
                        start: w.start,
                        end: w.end,
                        confidence: Some(w.confidence),
                        speaker: data.utterance.speaker.map(|s| s.to_string()),
                    })
                    .collect();

                Some(StreamEvent {
                    event_type: StreamEventType::Transcript,
                    text: Some(data.utterance.text),
                    is_final: Some(data.is_final),
                    utterance: None,
                    words: if words.is_empty() { None } else { Some(words) },
                    speaker: data.utterance.speaker.map(|s| s.to_string()),
                    confidence: Some(data.utterance.confidence),
                    error: None,
                    data: None,
                })
            }
            GladiaStreamMessage::Utterance { data } => {
                let words: Vec<Word> = data
                    .utterance
                    .words
                    .iter()
                    .map(|w| Word {
                        text: w.word.clone(),
                        start: w.start,
                        end: w.end,
                        confidence: Some(w.confidence),
                        speaker: data.utterance.speaker.map(|s| s.to_string()),
                    })
                    .collect();

                Some(StreamEvent {
                    event_type: StreamEventType::Utterance,
                    text: Some(data.utterance.text.clone()),
                    is_final: Some(true),
                    utterance: Some(Utterance {
                        text: data.utterance.text,
                        start: data.utterance.start,
                        end: data.utterance.end,
                        speaker: data.utterance.speaker.map(|s| s.to_string()),
                        confidence: Some(data.utterance.confidence),
                        words: if words.is_empty() {
                            None
                        } else {
                            Some(words)
                        },
                    }),
                    words: None,
                    speaker: data.utterance.speaker.map(|s| s.to_string()),
                    confidence: Some(data.utterance.confidence),
                    error: None,
                    data: None,
                })
            }
            GladiaStreamMessage::Metadata { data } => Some(StreamEvent {
                event_type: StreamEventType::Metadata,
                text: Some(data.to_string()),
                is_final: None,
                utterance: None,
                words: None,
                speaker: None,
                confidence: None,
                error: None,
                data: None,
            }),
            GladiaStreamMessage::Error { message } => Some(StreamEvent {
                event_type: StreamEventType::Error,
                text: None,
                is_final: None,
                utterance: None,
                words: None,
                speaker: None,
                confidence: None,
                error: Some(TranscriptionError {
                    code: "PROVIDER_ERROR".to_string(),
                    message,
                    details: None,
                    status_code: None,
                }),
                data: None,
            }),
        }
    }

    /// Normalize Gladia response to unified format
    fn normalize_response(&self, response: PreRecordedResponse) -> UnifiedTranscriptResponse {
        let status = match response.status {
            GladiaStatus::Queued => TranscriptionStatus::Queued,
            GladiaStatus::Processing => TranscriptionStatus::Processing,
            GladiaStatus::Done => TranscriptionStatus::Completed,
            GladiaStatus::Error => TranscriptionStatus::Error,
        };

        // Handle error state
        if response.status == GladiaStatus::Error {
            return UnifiedTranscriptResponse {
                success: false,
                provider: TranscriptionProvider::Gladia,
                data: None,
                error: Some(TranscriptionError {
                    code: "TRANSCRIPTION_ERROR".into(),
                    message: "Transcription failed".into(),
                    details: None,
                    status_code: response.error_code.map(|c| c as u16),
                }),
                raw: Some(serde_json::to_value(&response).unwrap_or_default()),
            };
        }

        // Extract transcription data if available
        let (text, language, speakers, words, utterances, summary, duration) =
            if let Some(ref result) = response.result {
                if let Some(ref transcription) = result.transcription {
                    (
                        transcription.full_transcript.clone(),
                        transcription.languages.first().map(|l| format!("{:?}", l)),
                        Self::extract_speakers(transcription),
                        Self::extract_words(transcription),
                        Some(
                            transcription
                                .utterances
                                .iter()
                                .map(Self::map_utterance)
                                .collect(),
                        ),
                        Self::extract_summary(result),
                        Some(result.metadata.audio_duration),
                    )
                } else {
                    (String::new(), None, None, None, None, None, Some(result.metadata.audio_duration))
                }
            } else {
                (String::new(), None, None, None, None, None, None)
            };

        // Serialize before moving fields
        let raw = serde_json::to_value(&response).unwrap_or_default();

        UnifiedTranscriptResponse {
            success: true,
            provider: TranscriptionProvider::Gladia,
            data: Some(TranscriptionData {
                id: response.id.to_string(),
                text,
                confidence: None,
                status,
                language,
                duration,
                speakers,
                words,
                utterances,
                summary,
                metadata: response.custom_metadata,
                created_at: Some(response.created_at),
                completed_at: response.completed_at,
            }),
            error: None,
            raw: Some(raw),
        }
    }

    /// Poll for transcription completion
    async fn poll_for_completion(
        &self,
        job_id: &str,
    ) -> Result<UnifiedTranscriptResponse, AdapterError> {
        let api_config = self
            .api_config
            .as_ref()
            .ok_or(AdapterError::NotInitialized)?;

        const MAX_ATTEMPTS: u32 = 120;
        const POLL_INTERVAL_MS: u64 = 1000;

        for _ in 0..MAX_ATTEMPTS {
            let response = pre_recorded_controller_get_pre_recorded_job_v2(api_config, job_id)
                .await
                .map_err(|e| AdapterError::ProviderError {
                    code: "API_ERROR".into(),
                    message: e.to_string(),
                })?;

            match response.status {
                GladiaStatus::Done | GladiaStatus::Error => {
                    return Ok(self.normalize_response(response));
                }
                _ => {
                    tokio::time::sleep(tokio::time::Duration::from_millis(POLL_INTERVAL_MS)).await;
                }
            }
        }

        Ok(UnifiedTranscriptResponse {
            success: false,
            provider: TranscriptionProvider::Gladia,
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

impl Default for GladiaAdapter {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl TranscriptionAdapter for GladiaAdapter {
    fn name(&self) -> TranscriptionProvider {
        TranscriptionProvider::Gladia
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
            pii_redaction: false, // Gladia doesn't have PII redaction
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
        let request = Self::build_transcription_request(audio_url, options.as_ref());

        // Use generated API client function - FULLY TYPED!
        let response = pre_recorded_controller_init_pre_recorded_job_v2(api_config, request)
            .await
            .map_err(|e| AdapterError::ProviderError {
                code: "API_ERROR".into(),
                message: e.to_string(),
            })?;

        let job_id = response.id.to_string();

        // If webhook is provided, return immediately with job ID
        if options
            .as_ref()
            .and_then(|o| o.webhook_url.as_ref())
            .is_some()
        {
            return Ok(UnifiedTranscriptResponse {
                success: true,
                provider: TranscriptionProvider::Gladia,
                data: Some(TranscriptionData {
                    id: job_id,
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
        self.poll_for_completion(&job_id).await
    }

    async fn get_transcript(
        &self,
        transcript_id: &str,
    ) -> Result<UnifiedTranscriptResponse, AdapterError> {
        let api_config = self
            .api_config
            .as_ref()
            .ok_or(AdapterError::NotInitialized)?;

        let response = pre_recorded_controller_get_pre_recorded_job_v2(api_config, transcript_id)
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

        pre_recorded_controller_delete_pre_recorded_job_v2(api_config, transcript_id)
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
        let api_config = self
            .api_config
            .as_ref()
            .ok_or(AdapterError::NotInitialized)?;

        let opts = options.unwrap_or_default();
        let streaming_request = Self::build_streaming_request(&opts);

        // Step 1: Initialize streaming session via REST API
        let init_response = streaming_controller_init_streaming_session_v2(
            api_config,
            streaming_request,
            None, // region
        )
        .await
        .map_err(|e| AdapterError::ProviderError {
            code: "API_ERROR".into(),
            message: e.to_string(),
        })?;

        let session_id = init_response.id.to_string();
        let ws_url = init_response.url;

        // Create channels for communication
        let (audio_tx, mut audio_rx) = mpsc::channel::<Vec<u8>>(32);
        let (event_tx, event_rx) = mpsc::channel::<StreamEvent>(32);
        let (close_tx, mut close_rx) = oneshot::channel::<()>();

        // Spawn WebSocket handler task
        tokio::spawn(async move {
            // Step 2: Connect to WebSocket (token is already in URL, no auth header needed)
            let conn_result = WebSocketConnection::connect(&ws_url, vec![]).await;

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

            loop {
                tokio::select! {
                    // Handle incoming audio from user
                    Some(audio_data) = audio_rx.recv() => {
                        if let Err(e) = ws.send_binary(audio_data).await {
                            let _ = event_tx.send(streaming::error_event("SEND_ERROR", e.to_string())).await;
                            break;
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
                        // Send stop_recording message to Gladia
                        let _ = ws.send_text(r#"{"type":"stop_recording"}"#).await;
                        let _ = ws.close().await;
                        let _ = event_tx.send(streaming::close_event()).await;
                        break;
                    }
                }
            }
        });

        Ok(StreamingSession {
            id: session_id,
            provider: TranscriptionProvider::Gladia,
            audio_tx,
            event_rx,
            close_tx,
        })
    }
}
