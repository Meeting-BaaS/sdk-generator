//! Default configuration constants for Voice Router SDK
//!
//! These constants provide sensible defaults for timeouts, polling intervals,
//! and other configuration values used across all adapters.

/// Default timeout values for different operation types (in milliseconds)
pub struct Timeouts {
    /// Standard HTTP request timeout for API calls (60 seconds)
    pub http_request: u64,
    /// Audio processing timeout for long audio files (120 seconds)
    pub audio_processing: u64,
    /// WebSocket connection establishment timeout (10 seconds)
    pub ws_connection: u64,
    /// WebSocket graceful close timeout (5 seconds)
    pub ws_close: u64,
}

/// Default timeout configuration
pub const DEFAULT_TIMEOUTS: Timeouts = Timeouts {
    http_request: 60000,
    audio_processing: 120000,
    ws_connection: 10000,
    ws_close: 5000,
};

/// Default polling configuration for async transcription jobs
pub struct Polling {
    /// Maximum number of polling attempts before timing out
    pub max_attempts: u32,
    /// Standard interval between polling attempts (milliseconds)
    pub interval_ms: u64,
    /// Slower interval for long-running jobs (milliseconds)
    pub slow_interval_ms: u64,
}

/// Default polling configuration
pub const DEFAULT_POLLING: Polling = Polling {
    max_attempts: 60,
    interval_ms: 2000,
    slow_interval_ms: 3000,
};
