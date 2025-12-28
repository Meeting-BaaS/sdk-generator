//! Deepgram adapter implementation
//!
//! Provides transcription services using Deepgram's API with full type safety
//! via generated OpenAPI client.

use async_trait::async_trait;
use serde::Deserialize;
use tokio::sync::{mpsc, oneshot};
use tokio_tungstenite::tungstenite::Message;

use super::streaming::{self, AudioEncoding, WebSocketConnection};
use super::{AdapterError, ProviderConfig, StreamingSession, TranscriptionAdapter};
use crate::types::{
    AudioInput, ProviderCapabilities, Speaker, StreamEvent, StreamEventType, StreamingOptions,
    TranscribeOptions, TranscriptionData, TranscriptionProvider, TranscriptionStatus,
    UnifiedTranscriptResponse, Utterance, Word,
};

// Import generated Deepgram client types
use deepgram_client::apis::configuration::Configuration;
use deepgram_client::apis::listen_api::listen_v1_media_transcribe;
use deepgram_client::models::{
    ListenV1MediaTranscribe200Response, ListenV1MediaTranscribeSummarizeParameter,
    ListenV1RequestUrl, ListenV1Response, ListenV1ResponseResultsUtterancesInner,
    ListenV1ResponseResultsChannelsInnerAlternativesInnerWordsInner,
};

const DEFAULT_BASE_URL: &str = "https://api.deepgram.com";
const STREAMING_URL: &str = "wss://api.deepgram.com/v1/listen";

/// Deepgram streaming response message
#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type")]
enum DeepgramStreamMessage {
    /// Transcription results
    Results {
        is_final: bool,
        channel: DeepgramChannel,
    },
    /// Utterance end marker
    UtteranceEnd,
    /// Metadata message
    Metadata {
        #[serde(flatten)]
        data: serde_json::Value,
    },
}

#[derive(Debug, Clone, Deserialize)]
struct DeepgramChannel {
    alternatives: Vec<DeepgramAlternative>,
}

#[derive(Debug, Clone, Deserialize)]
struct DeepgramAlternative {
    transcript: String,
    confidence: f32,
    words: Option<Vec<DeepgramWord>>,
}

#[derive(Debug, Clone, Deserialize)]
struct DeepgramWord {
    word: String,
    start: f32,
    end: f32,
    confidence: f32,
    speaker: Option<i32>,
}

/// Deepgram adapter for speech-to-text transcription
///
/// Uses the generated OpenAPI client for full type safety.
/// Deepgram returns results synchronously (no polling needed).
pub struct DeepgramAdapter {
    config: Option<ProviderConfig>,
    api_config: Option<Configuration>,
}

impl DeepgramAdapter {
    /// Create a new Deepgram adapter
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
        api_config.bearer_access_token = Some(config.api_key.clone());
        api_config
    }

    /// Map Word from generated type to unified type (channel words don't have speaker)
    fn map_word(word: &ListenV1ResponseResultsChannelsInnerAlternativesInnerWordsInner) -> Word {
        Word {
            text: word.word.clone().unwrap_or_default(),
            start: word.start.map(|x| x as f64).unwrap_or(0.0),
            end: word.end.map(|x| x as f64).unwrap_or(0.0),
            confidence: word.confidence.map(|x| x as f64),
            speaker: None, // Channel words don't have speaker info
        }
    }

    /// Map Utterance from generated type to unified type
    fn map_utterance(utterance: &ListenV1ResponseResultsUtterancesInner) -> Utterance {
        let words = utterance.words.as_ref().map(|w| {
            w.iter()
                .map(|word| Word {
                    text: word.word.clone().unwrap_or_default(),
                    start: word.start.map(|x| x as f64).unwrap_or(0.0),
                    end: word.end.map(|x| x as f64).unwrap_or(0.0),
                    confidence: word.confidence.map(|x| x as f64),
                    speaker: word.speaker.map(|s| (s as i32).to_string()),
                })
                .collect()
        });

        Utterance {
            text: utterance.transcript.clone().unwrap_or_default(),
            start: utterance.start.map(|x| x as f64).unwrap_or(0.0),
            end: utterance.end.map(|x| x as f64).unwrap_or(0.0),
            confidence: utterance.confidence.map(|x| x as f64),
            speaker: utterance.speaker.map(|s| (s as i32).to_string()),
            words,
        }
    }

    /// Build streaming WebSocket URL with query parameters
    fn build_streaming_url(options: &StreamingOptions) -> String {
        let mut url = format!("{}?", STREAMING_URL);
        let mut params = Vec::new();

        // Encoding
        if let Some(ref encoding) = options.encoding {
            if let Some(enc) = AudioEncoding::from_str(encoding) {
                params.push(format!("encoding={}", enc.to_deepgram()));
            }
        }

        // Sample rate
        if let Some(sample_rate) = options.sample_rate {
            params.push(format!("sample_rate={}", sample_rate));
        }

        // Channels
        if let Some(channels) = options.channels {
            params.push(format!("channels={}", channels));
        }

        // Language
        if let Some(ref language) = options.language {
            params.push(format!("language={}", language));
        }

        // Model (nova-2, nova-3, base, enhanced, whisper, etc.)
        if let Some(ref model) = options.model {
            params.push(format!("model={}", model));
        }

        // Interim results (default true for streaming)
        let interim = options.interim_results.unwrap_or(true);
        params.push(format!("interim_results={}", interim));

        // Diarization
        if options.diarization == Some(true) {
            params.push("diarize=true".to_string());
        }

        // Always enable punctuation
        params.push("punctuate=true".to_string());

        url.push_str(&params.join("&"));
        url
    }

    /// Parse streaming message into unified event
    fn parse_streaming_message(text: &str) -> Option<StreamEvent> {
        let msg: DeepgramStreamMessage = serde_json::from_str(text).ok()?;

        match msg {
            DeepgramStreamMessage::Results { is_final, channel } => {
                let alt = channel.alternatives.first()?;

                let words = alt.words.as_ref().map(|words| {
                    words
                        .iter()
                        .map(|w| Word {
                            text: w.word.clone(),
                            start: w.start as f64,
                            end: w.end as f64,
                            confidence: Some(w.confidence as f64),
                            speaker: w.speaker.map(|s| s.to_string()),
                        })
                        .collect()
                });

                Some(StreamEvent {
                    event_type: StreamEventType::Transcript,
                    text: Some(alt.transcript.clone()),
                    is_final: Some(is_final),
                    utterance: None,
                    words,
                    speaker: None,
                    confidence: Some(alt.confidence as f64),
                    error: None,
                    data: None,
                })
            }
            DeepgramStreamMessage::UtteranceEnd => Some(StreamEvent {
                event_type: StreamEventType::Utterance,
                text: None,
                is_final: Some(true),
                utterance: None,
                words: None,
                speaker: None,
                confidence: None,
                error: None,
                data: None,
            }),
            DeepgramStreamMessage::Metadata { data } => Some(StreamEvent {
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
        }
    }

    /// Normalize Deepgram response to unified format
    fn normalize_response(&self, response: ListenV1Response) -> UnifiedTranscriptResponse {
        // Extract text from first channel's first alternative
        let text = response
            .results
            .channels
            .first()
            .and_then(|c| c.alternatives.as_ref())
            .and_then(|alts| alts.first())
            .map(|a| a.transcript.clone().unwrap_or_default())
            .unwrap_or_default();

        // Extract words from first channel's first alternative
        let words: Option<Vec<Word>> = response
            .results
            .channels
            .first()
            .and_then(|c| c.alternatives.as_ref())
            .and_then(|alts| alts.first())
            .and_then(|a| a.words.as_ref())
            .map(|words: &Vec<_>| words.iter().map(Self::map_word).collect());

        // Extract utterances if available
        let utterances: Option<Vec<Utterance>> = response
            .results
            .utterances
            .as_ref()
            .map(|u| u.iter().map(Self::map_utterance).collect());

        // Extract unique speakers from utterances
        let speakers: Option<Vec<Speaker>> = utterances.as_ref().map(|utts| {
            let mut speaker_ids: Vec<String> = utts
                .iter()
                .filter_map(|u| u.speaker.clone())
                .collect();
            speaker_ids.sort();
            speaker_ids.dedup();
            speaker_ids
                .into_iter()
                .map(|id| Speaker {
                    id: id.clone(),
                    label: Some(format!("Speaker {}", id)),
                    confidence: None,
                })
                .collect()
        });

        // Extract summary
        let summary = response
            .results
            .summary
            .as_ref()
            .map(|s| s.short.clone().unwrap_or_default());

        // Extract duration
        let duration = Some(response.metadata.duration);

        // Extract detected language
        let language = response
            .results
            .channels
            .first()
            .and_then(|c| c.detected_language.clone());

        // Serialize for raw output
        let raw = serde_json::to_value(&response).unwrap_or_default();

        UnifiedTranscriptResponse {
            success: true,
            provider: TranscriptionProvider::Deepgram,
            data: Some(TranscriptionData {
                id: response.metadata.request_id.to_string(),
                text,
                confidence: response
                    .results
                    .channels
                    .first()
                    .and_then(|c| c.alternatives.as_ref())
                    .and_then(|alts| alts.first())
                    .and_then(|a| a.confidence)
                    .map(|x| x as f64),
                status: TranscriptionStatus::Completed,
                language,
                duration,
                speakers,
                words,
                utterances,
                summary,
                metadata: None,
                created_at: Some(response.metadata.created.clone()),
                completed_at: None,
            }),
            error: None,
            raw: Some(raw),
        }
    }
}

impl Default for DeepgramAdapter {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl TranscriptionAdapter for DeepgramAdapter {
    fn name(&self) -> TranscriptionProvider {
        TranscriptionProvider::Deepgram
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

        // Build request body
        let request_url = ListenV1RequestUrl::new(audio_url);

        // Extract options
        let opts = options.as_ref();
        let language = opts.and_then(|o| o.language.as_deref());
        let diarize = opts.and_then(|o| o.diarization);
        let detect_language = opts.and_then(|o| {
            o.language_detection.map(|b| {
                deepgram_client::models::ListenV1MediaTranscribeDetectLanguageParameter::Boolean(b)
            })
        });
        let summarize = opts.and_then(|o| {
            o.summarization
                .map(|b| ListenV1MediaTranscribeSummarizeParameter::ReadApiBooleanOption(b))
        });
        let sentiment = opts.and_then(|o| o.sentiment_analysis);
        let detect_entities = opts.and_then(|o| o.entity_detection);
        let callback = opts.and_then(|o| o.webhook_url.as_deref());
        let utterances = diarize; // Enable utterances when diarization is enabled
        let keyterm = opts.and_then(|o| o.custom_vocabulary.clone());

        // Use generated API client function - FULLY TYPED!
        let response = listen_v1_media_transcribe(
            api_config,
            request_url,
            callback,                      // callback
            None,                          // callback_method
            None,                          // extra
            sentiment,                     // sentiment
            summarize,                     // summarize
            None,                          // tag
            None,                          // topics
            None,                          // custom_topic
            None,                          // custom_topic_mode
            None,                          // intents
            None,                          // custom_intent
            None,                          // custom_intent_mode
            detect_entities,               // detect_entities
            detect_language,               // detect_language
            diarize,                       // diarize
            None,                          // dictation
            None,                          // encoding
            None,                          // filler_words
            keyterm,                       // keyterm
            None,                          // keywords
            language,                      // language
            None,                          // measurements
            None,                          // model
            None,                          // multichannel
            None,                          // numerals
            None,                          // paragraphs
            None,                          // profanity_filter
            Some(true),                    // punctuate
            None,                          // redact
            None,                          // replace
            None,                          // search
            None,                          // smart_format
            utterances,                    // utterances
            None,                          // utt_split
            None,                          // version
            None,                          // mip_opt_out
        )
        .await
        .map_err(|e| AdapterError::ProviderError {
            code: "API_ERROR".into(),
            message: e.to_string(),
        })?;

        // Handle response
        match response {
            ListenV1MediaTranscribe200Response::ListenV1Response(resp) => {
                Ok(self.normalize_response(*resp))
            }
            ListenV1MediaTranscribe200Response::ListenV1AcceptedResponse(accepted) => {
                // Callback was provided, return immediately with request ID
                Ok(UnifiedTranscriptResponse {
                    success: true,
                    provider: TranscriptionProvider::Deepgram,
                    data: Some(TranscriptionData {
                        id: accepted.request_id.to_string(),
                        text: String::new(),
                        confidence: None,
                        status: TranscriptionStatus::Processing,
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
                    raw: Some(serde_json::to_value(&accepted).unwrap_or_default()),
                })
            }
        }
    }

    async fn get_transcript(
        &self,
        _transcript_id: &str,
    ) -> Result<UnifiedTranscriptResponse, AdapterError> {
        // Deepgram doesn't have a get transcript endpoint - results are returned immediately
        Err(AdapterError::NotSupported(
            "Deepgram returns results synchronously - use transcribe() instead".into(),
        ))
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
            // Connect to Deepgram WebSocket
            let conn_result = WebSocketConnection::connect(
                &url,
                vec![("Authorization", &format!("Token {}", api_key))],
            )
            .await;

            let mut ws = match conn_result {
                Ok(ws) => ws,
                Err(e) => {
                    let _ = event_tx.send(streaming::error_event("CONNECTION_ERROR", e.to_string())).await;
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
                        // Send close stream message to Deepgram
                        let _ = ws.send_text(r#"{"type":"CloseStream"}"#).await;
                        let _ = ws.close().await;
                        let _ = event_tx.send(streaming::close_event()).await;
                        break;
                    }
                }
            }
        });

        Ok(StreamingSession {
            id: session_id,
            provider: TranscriptionProvider::Deepgram,
            audio_tx,
            event_rx,
            close_tx,
        })
    }
}
