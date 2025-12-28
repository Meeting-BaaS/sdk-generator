//! # Voice Router SDK
//!
//! Universal speech-to-text router for multiple transcription providers.
//!
//! This SDK provides a unified interface for working with multiple Speech-to-Text
//! providers, matching the TypeScript SDK API as closely as possible.
//!
//! ## Supported Providers
//!
//! - **Gladia** - Full support (batch + streaming)
//! - **AssemblyAI** - Full support (batch + streaming)
//! - **Deepgram** - Full support (batch + streaming)
//! - **Azure STT** - Batch only
//! - **OpenAI Whisper** - Batch only
//!
//! ## Example
//!
//! ```rust,no_run
//! use voice_router::{VoiceRouter, VoiceRouterConfig, TranscriptionProvider, SelectionStrategy};
//! use std::collections::HashMap;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let mut providers = HashMap::new();
//!     providers.insert(
//!         TranscriptionProvider::Gladia,
//!         voice_router::adapters::ProviderConfig {
//!             api_key: "your-api-key".into(),
//!             base_url: None,
//!             timeout_ms: None,
//!             headers: None,
//!         },
//!     );
//!
//!     let router = VoiceRouter::new(VoiceRouterConfig {
//!         providers,
//!         default_provider: Some(TranscriptionProvider::Gladia),
//!         selection_strategy: SelectionStrategy::Default,
//!     });
//!
//!     let result = router.transcribe_url(
//!         "https://example.com/audio.mp3",
//!         None,
//!     ).await?;
//!
//!     println!("Transcript: {}", result.data.unwrap().text);
//!     Ok(())
//! }
//! ```

pub mod adapters;
pub mod audio_encoding;
pub mod constants;
pub mod errors;
pub mod router;
pub mod types;
pub mod webhooks;

// Re-export main types (avoiding conflicts)
pub use audio_encoding::{
    map_encoding_to_provider, validate_audio_config, AudioBitDepth, AudioChannels, AudioEncoding,
    AudioSampleRate, StreamingProvider as AudioStreamingProvider,
};
pub use constants::*;
pub use errors::{ErrorCodes, StandardError};
pub use router::{SelectionStrategy, VoiceRouter, VoiceRouterConfig};
pub use types::*;

// Generated clients are in separate directories with their own structure
// They are referenced directly by adapters using relative paths
