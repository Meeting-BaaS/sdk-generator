//! Standardized error handling utilities for Voice Router SDK
//!
//! Provides consistent error codes, messages, and formatting across all adapters.

use serde::{Deserialize, Serialize};

/// Standard error codes used across all providers
///
/// These codes provide a consistent error taxonomy regardless of which
/// provider is being used.
pub struct ErrorCodes;

impl ErrorCodes {
    /// Failed to parse API response or WebSocket message
    pub const PARSE_ERROR: &'static str = "PARSE_ERROR";
    /// WebSocket connection error
    pub const WEBSOCKET_ERROR: &'static str = "WEBSOCKET_ERROR";
    /// Async transcription job did not complete within timeout
    pub const POLLING_TIMEOUT: &'static str = "POLLING_TIMEOUT";
    /// Transcription processing failed on provider side
    pub const TRANSCRIPTION_ERROR: &'static str = "TRANSCRIPTION_ERROR";
    /// Connection attempt timed out
    pub const CONNECTION_TIMEOUT: &'static str = "CONNECTION_TIMEOUT";
    /// Invalid input provided to API
    pub const INVALID_INPUT: &'static str = "INVALID_INPUT";
    /// Requested operation not supported by provider
    pub const NOT_SUPPORTED: &'static str = "NOT_SUPPORTED";
    /// No transcription results available
    pub const NO_RESULTS: &'static str = "NO_RESULTS";
    /// Unspecified or unknown error
    pub const UNKNOWN_ERROR: &'static str = "UNKNOWN_ERROR";
}

/// Alias for error code type
pub type ErrorCode = &'static str;

/// Get the default message for an error code
pub fn get_error_message(code: &str) -> &'static str {
    match code {
        ErrorCodes::PARSE_ERROR => "Failed to parse response data",
        ErrorCodes::WEBSOCKET_ERROR => "WebSocket connection error",
        ErrorCodes::POLLING_TIMEOUT => "Transcription did not complete within timeout period",
        ErrorCodes::TRANSCRIPTION_ERROR => "Transcription processing failed",
        ErrorCodes::CONNECTION_TIMEOUT => "Connection attempt timed out",
        ErrorCodes::INVALID_INPUT => "Invalid input provided",
        ErrorCodes::NOT_SUPPORTED => "Operation not supported by this provider",
        ErrorCodes::NO_RESULTS => "No transcription results available",
        _ => "An unknown error occurred",
    }
}

/// Standard error object structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StandardError {
    /// Error code from ErrorCodes
    pub code: String,
    /// Human-readable error message
    pub message: String,
    /// HTTP status code if applicable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status_code: Option<u16>,
    /// Additional error details
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

impl StandardError {
    /// Create a standardized error object
    ///
    /// # Arguments
    /// * `code` - Error code from ErrorCodes
    /// * `custom_message` - Optional custom message (defaults to standard message)
    /// * `details` - Optional additional error details
    pub fn new(code: &str, custom_message: Option<&str>, details: Option<serde_json::Value>) -> Self {
        Self {
            code: code.to_string(),
            message: custom_message
                .map(|s| s.to_string())
                .unwrap_or_else(|| get_error_message(code).to_string()),
            status_code: None,
            details,
        }
    }

    /// Create a standardized error with status code
    pub fn with_status_code(mut self, status_code: u16) -> Self {
        self.status_code = Some(status_code);
        self
    }
}

impl std::fmt::Display for StandardError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{}] {}", self.code, self.message)
    }
}

impl std::error::Error for StandardError {}
