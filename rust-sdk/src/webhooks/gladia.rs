//! Gladia webhook handler
//!
//! Parses and normalizes Gladia webhook callbacks.

use std::collections::HashSet;

use crate::types::{Speaker, TranscriptionProvider, TranscriptionStatus, Utterance, Word};

use super::types::{
    UnifiedWebhookEvent, WebhookError, WebhookEventType, WebhookTranscriptionData,
};

/// Gladia webhook handler
pub struct GladiaWebhookHandler;

impl GladiaWebhookHandler {
    /// Parse a Gladia webhook payload to unified format
    pub fn parse(payload: &serde_json::Value) -> Result<UnifiedWebhookEvent, WebhookError> {
        // Extract common fields
        let id = payload
            .get("id")
            .and_then(|v| v.as_str())
            .ok_or_else(|| WebhookError::InvalidPayload("Missing 'id' field".into()))?;

        let event = payload
            .get("event")
            .and_then(|v| v.as_str())
            .ok_or_else(|| WebhookError::InvalidPayload("Missing 'event' field".into()))?;

        match event {
            "transcription.success" => Self::parse_success(id, payload),
            "transcription.error" => Self::parse_error(id, payload),
            _ => Err(WebhookError::UnknownEvent(event.to_string())),
        }
    }

    fn parse_success(
        id: &str,
        payload: &serde_json::Value,
    ) -> Result<UnifiedWebhookEvent, WebhookError> {
        let result = payload
            .get("payload")
            .ok_or_else(|| WebhookError::InvalidPayload("Missing 'payload' field".into()))?;

        let transcription = result.get("transcription");
        let metadata = result.get("metadata");

        // Extract full transcript
        let text = transcription
            .and_then(|t| t.get("full_transcript"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        // Extract duration
        let duration = metadata
            .and_then(|m| m.get("audio_duration"))
            .and_then(|v| v.as_f64());

        // Extract language
        let language = transcription
            .and_then(|t| t.get("languages"))
            .and_then(|v| v.as_array())
            .and_then(|arr| arr.first())
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        // Map utterances
        let utterances: Option<Vec<Utterance>> = transcription
            .and_then(|t| t.get("utterances"))
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter().filter_map(Self::map_utterance).collect());

        // Flatten words from utterances
        let words: Option<Vec<Word>> = transcription
            .and_then(|t| t.get("utterances"))
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|u| u.get("words"))
                    .filter_map(|v| v.as_array())
                    .flatten()
                    .filter_map(Self::map_word)
                    .collect()
            });

        // Extract unique speakers
        let speakers: Option<Vec<Speaker>> = transcription
            .and_then(|t| t.get("utterances"))
            .and_then(|v| v.as_array())
            .map(|arr| {
                let speaker_ids: HashSet<i64> = arr
                    .iter()
                    .filter_map(|u| u.get("speaker"))
                    .filter_map(|v| v.as_i64())
                    .collect();

                speaker_ids
                    .into_iter()
                    .map(|id| Speaker {
                        id: id.to_string(),
                        label: None,
                        confidence: None,
                    })
                    .collect()
            })
            .filter(|v: &Vec<Speaker>| !v.is_empty());

        // Extract summary if summarization succeeded
        let summary = result
            .get("summarization")
            .filter(|s| s.get("success").and_then(|v| v.as_bool()).unwrap_or(false))
            .and_then(|s| s.get("results"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        // Build metadata
        let webhook_metadata = serde_json::json!({
            "transcription_time": metadata.and_then(|m| m.get("transcription_time")),
            "billing_time": metadata.and_then(|m| m.get("billing_time")),
            "number_of_distinct_channels": metadata.and_then(|m| m.get("number_of_distinct_channels")),
            "custom_metadata": payload.get("custom_metadata"),
        });

        Ok(UnifiedWebhookEvent {
            success: true,
            provider: TranscriptionProvider::Gladia,
            event_type: WebhookEventType::TranscriptionCompleted,
            data: Some(WebhookTranscriptionData {
                id: id.to_string(),
                status: TranscriptionStatus::Completed,
                text,
                confidence: None,
                duration,
                language,
                speakers,
                words,
                utterances,
                summary,
                error: None,
                metadata: Some(webhook_metadata),
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
            raw: Some(payload.clone()),
        })
    }

    fn parse_error(
        id: &str,
        payload: &serde_json::Value,
    ) -> Result<UnifiedWebhookEvent, WebhookError> {
        let error = payload.get("error");

        let error_message = error
            .and_then(|e| e.get("message"))
            .and_then(|v| v.as_str())
            .unwrap_or("Transcription failed")
            .to_string();

        let error_code = error
            .and_then(|e| e.get("code"))
            .and_then(|v| v.as_i64());

        Ok(UnifiedWebhookEvent {
            success: false,
            provider: TranscriptionProvider::Gladia,
            event_type: WebhookEventType::TranscriptionFailed,
            data: Some(WebhookTranscriptionData {
                id: id.to_string(),
                status: TranscriptionStatus::Error,
                text: None,
                confidence: None,
                duration: None,
                language: None,
                speakers: None,
                words: None,
                utterances: None,
                summary: None,
                error: Some(error_message),
                metadata: Some(serde_json::json!({
                    "error_code": error_code,
                    "custom_metadata": payload.get("custom_metadata"),
                })),
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
            raw: Some(payload.clone()),
        })
    }

    fn map_word(word: &serde_json::Value) -> Option<Word> {
        Some(Word {
            text: word.get("word")?.as_str()?.to_string(),
            start: word.get("start")?.as_f64()?,
            end: word.get("end")?.as_f64()?,
            confidence: word.get("confidence").and_then(|v| v.as_f64()),
            speaker: None,
        })
    }

    fn map_utterance(utterance: &serde_json::Value) -> Option<Utterance> {
        let words: Option<Vec<Word>> = utterance
            .get("words")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter().filter_map(Self::map_word).collect());

        Some(Utterance {
            text: utterance.get("text")?.as_str()?.to_string(),
            start: utterance.get("start")?.as_f64()?,
            end: utterance.get("end")?.as_f64()?,
            confidence: utterance.get("confidence").and_then(|v| v.as_f64()),
            speaker: utterance
                .get("speaker")
                .and_then(|v| v.as_i64())
                .map(|id| id.to_string()),
            words,
        })
    }
}
