//! Webhook handling for transcription callbacks
//!
//! Provides unified parsing of webhook payloads from different providers.

pub mod types;
pub mod gladia;

use crate::types::TranscriptionProvider;
use types::{UnifiedWebhookEvent, WebhookError};

/// Webhook router that auto-detects provider and parses payloads
pub struct WebhookRouter;

impl WebhookRouter {
    /// Create a new webhook router
    pub fn new() -> Self {
        Self
    }

    /// Route and parse a webhook payload
    pub fn route(&self, payload: &[u8]) -> Result<UnifiedWebhookEvent, WebhookError> {
        // Try to detect provider from payload structure
        let json: serde_json::Value = serde_json::from_slice(payload)?;

        // Gladia: has "event" field starting with "transcription."
        if let Some(event) = json.get("event").and_then(|e| e.as_str()) {
            if event.starts_with("transcription.") {
                return gladia::GladiaWebhookHandler::parse(&json);
            }
        }

        // AssemblyAI: has "status" field
        if json.get("status").is_some() && json.get("id").is_some() {
            // TODO: Implement AssemblyAI webhook parsing
            return Err(WebhookError::UnsupportedProvider("assemblyai".into()));
        }

        Err(WebhookError::UnknownProvider)
    }

    /// Parse a webhook payload for a specific provider
    pub fn parse(
        &self,
        provider: TranscriptionProvider,
        payload: &[u8],
    ) -> Result<UnifiedWebhookEvent, WebhookError> {
        let json: serde_json::Value = serde_json::from_slice(payload)?;

        match provider {
            TranscriptionProvider::Gladia => gladia::GladiaWebhookHandler::parse(&json),
            _ => Err(WebhookError::UnsupportedProvider(format!("{:?}", provider))),
        }
    }
}

impl Default for WebhookRouter {
    fn default() -> Self {
        Self::new()
    }
}
