//! VoiceRouter - Unified transcription API bridge
//!
//! Provides a provider-agnostic interface for multiple Speech-to-Text services,
//! matching the TypeScript SDK API.

use std::collections::HashMap;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

use crate::adapters::{
    AdapterError, AssemblyAIAdapter, DeepgramAdapter, GladiaAdapter, ProviderConfig,
    StreamingSession, TranscriptionAdapter,
};
use crate::types::{
    AudioInput, ProviderCapabilities, StreamingCallbacks, StreamingOptions, TranscribeOptions,
    TranscriptionProvider, UnifiedTranscriptResponse,
};

/// Strategy for provider selection when multiple providers are configured
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum SelectionStrategy {
    /// Always require provider to be specified (throws error if not)
    Explicit,
    /// Use defaultProvider if not specified
    #[default]
    Default,
    /// Rotate between providers for load balancing
    RoundRobin,
}

/// Configuration for VoiceRouter
#[derive(Debug, Clone)]
pub struct VoiceRouterConfig {
    /// Provider configurations (key: provider name, value: provider config)
    pub providers: HashMap<TranscriptionProvider, ProviderConfig>,
    /// Default provider to use when not specified
    pub default_provider: Option<TranscriptionProvider>,
    /// Strategy for provider selection when multiple providers are configured
    pub selection_strategy: SelectionStrategy,
}

impl Default for VoiceRouterConfig {
    fn default() -> Self {
        Self {
            providers: HashMap::new(),
            default_provider: None,
            selection_strategy: SelectionStrategy::Default,
        }
    }
}

/// VoiceRouter - Main class for provider-agnostic transcription
///
/// Provides a unified interface across multiple Speech-to-Text providers
/// (Gladia, AssemblyAI, Deepgram, etc.). Automatically handles provider
/// selection, adapter management, and response normalization.
pub struct VoiceRouter {
    adapters: HashMap<TranscriptionProvider, Arc<dyn TranscriptionAdapter>>,
    config: VoiceRouterConfig,
    round_robin_index: AtomicUsize,
}

impl VoiceRouter {
    /// Create a new Voice Router with the given configuration
    ///
    /// # Panics
    /// Panics if no providers are configured
    pub fn new(config: VoiceRouterConfig) -> Self {
        if config.providers.is_empty() {
            panic!("VoiceRouter requires at least one provider configuration");
        }

        let mut router = Self {
            adapters: HashMap::new(),
            config: config.clone(),
            round_robin_index: AtomicUsize::new(0),
        };

        // Auto-select first provider as default if using default strategy and none set
        if router.config.selection_strategy == SelectionStrategy::Default
            && router.config.default_provider.is_none()
        {
            router.config.default_provider = config.providers.keys().next().copied();
        }

        // Initialize adapters for all configured providers
        for (provider, provider_config) in &config.providers {
            match provider {
                TranscriptionProvider::Gladia => {
                    let mut adapter = GladiaAdapter::new();
                    if adapter.initialize(provider_config.clone()).is_ok() {
                        router
                            .adapters
                            .insert(*provider, Arc::new(adapter));
                    }
                }
                TranscriptionProvider::AssemblyAI => {
                    let mut adapter = AssemblyAIAdapter::new();
                    if adapter.initialize(provider_config.clone()).is_ok() {
                        router
                            .adapters
                            .insert(*provider, Arc::new(adapter));
                    }
                }
                TranscriptionProvider::Deepgram => {
                    let mut adapter = DeepgramAdapter::new();
                    if adapter.initialize(provider_config.clone()).is_ok() {
                        router
                            .adapters
                            .insert(*provider, Arc::new(adapter));
                    }
                }
                _ => {
                    // Other providers not yet implemented
                }
            }
        }

        router
    }

    /// Register a custom adapter for a provider
    ///
    /// Call this method if you want to use a custom adapter implementation
    /// instead of the built-in ones.
    pub fn register_adapter(&mut self, adapter: Arc<dyn TranscriptionAdapter>) {
        let provider = adapter.name();
        if self.config.providers.contains_key(&provider) {
            // Note: We can't mutate through Arc, so adapters should be pre-initialized
            self.adapters.insert(provider, adapter);
        }
    }

    /// Get an adapter by provider name
    pub fn get_adapter(
        &self,
        provider: TranscriptionProvider,
    ) -> Result<&Arc<dyn TranscriptionAdapter>, AdapterError> {
        self.adapters.get(&provider).ok_or_else(|| {
            AdapterError::InvalidConfig(format!(
                "Provider '{:?}' is not registered. Available providers: {:?}",
                provider,
                self.get_registered_providers()
            ))
        })
    }

    /// Select provider based on configured strategy
    fn select_provider(
        &self,
        preferred_provider: Option<TranscriptionProvider>,
    ) -> Result<TranscriptionProvider, AdapterError> {
        // If provider explicitly specified, use it
        if let Some(provider) = preferred_provider {
            if !self.adapters.contains_key(&provider) {
                return Err(AdapterError::InvalidConfig(format!(
                    "Provider '{:?}' is not registered. Available providers: {:?}",
                    provider,
                    self.get_registered_providers()
                )));
            }
            return Ok(provider);
        }

        // Apply selection strategy
        match self.config.selection_strategy {
            SelectionStrategy::Explicit => Err(AdapterError::InvalidConfig(
                "Provider must be explicitly specified when using 'explicit' selection strategy"
                    .into(),
            )),
            SelectionStrategy::RoundRobin => {
                let providers: Vec<_> = self.adapters.keys().collect();
                let index = self.round_robin_index.fetch_add(1, Ordering::SeqCst);
                let provider = providers[index % providers.len()];
                Ok(*provider)
            }
            SelectionStrategy::Default => self.config.default_provider.ok_or_else(|| {
                AdapterError::InvalidConfig("No default provider configured".into())
            }),
        }
    }

    /// Transcribe audio using a specific provider or the default
    ///
    /// The provider will be selected based on your configuration strategy
    /// (explicit, default, or round-robin).
    pub async fn transcribe(
        &self,
        audio: AudioInput,
        options: Option<TranscribeOptions>,
    ) -> Result<UnifiedTranscriptResponse, AdapterError> {
        let provider = self.select_provider(None)?;
        self.transcribe_with_provider(provider, audio, options).await
    }

    /// Transcribe audio with a specific provider
    pub async fn transcribe_with_provider(
        &self,
        provider: TranscriptionProvider,
        audio: AudioInput,
        options: Option<TranscribeOptions>,
    ) -> Result<UnifiedTranscriptResponse, AdapterError> {
        let adapter = self.get_adapter(provider)?;
        adapter.transcribe(audio, options).await
    }

    /// Transcribe audio from a URL
    pub async fn transcribe_url(
        &self,
        url: &str,
        options: Option<TranscribeOptions>,
    ) -> Result<UnifiedTranscriptResponse, AdapterError> {
        self.transcribe(AudioInput::Url(url.to_string()), options)
            .await
    }

    /// Transcribe audio bytes
    pub async fn transcribe_bytes(
        &self,
        data: Vec<u8>,
        filename: Option<String>,
        options: Option<TranscribeOptions>,
    ) -> Result<UnifiedTranscriptResponse, AdapterError> {
        self.transcribe(AudioInput::Bytes { data, filename }, options)
            .await
    }

    /// Get transcription result by ID
    /// Provider must be specified since IDs are provider-specific
    pub async fn get_transcript(
        &self,
        transcript_id: &str,
        provider: TranscriptionProvider,
    ) -> Result<UnifiedTranscriptResponse, AdapterError> {
        let adapter = self.get_adapter(provider)?;
        adapter.get_transcript(transcript_id).await
    }

    /// Stream audio for real-time transcription
    ///
    /// Returns a StreamingSession that can be used to send audio chunks
    /// and receive transcription events.
    pub async fn transcribe_stream(
        &self,
        options: Option<StreamingOptions>,
        _callbacks: Option<StreamingCallbacks>,
    ) -> Result<StreamingSession, AdapterError> {
        self.transcribe_stream_with_provider(None, options, _callbacks)
            .await
    }

    /// Stream audio for real-time transcription with a specific provider
    pub async fn transcribe_stream_with_provider(
        &self,
        provider: Option<TranscriptionProvider>,
        options: Option<StreamingOptions>,
        _callbacks: Option<StreamingCallbacks>,
    ) -> Result<StreamingSession, AdapterError> {
        let provider = self.select_provider(provider)?;
        let adapter = self.get_adapter(provider)?;

        // Check if adapter supports streaming
        if !adapter.capabilities().streaming {
            return Err(AdapterError::NotSupported(format!(
                "Provider '{:?}' does not support streaming transcription",
                provider
            )));
        }

        adapter.transcribe_stream(options).await
    }

    /// Delete a transcription
    /// Not all providers support this operation
    pub async fn delete_transcript(
        &self,
        transcript_id: &str,
        provider: TranscriptionProvider,
    ) -> Result<bool, AdapterError> {
        let adapter = self.get_adapter(provider)?;
        adapter.delete_transcript(transcript_id).await
    }

    /// Get capabilities for a specific provider
    pub fn get_provider_capabilities(
        &self,
        provider: TranscriptionProvider,
    ) -> Option<ProviderCapabilities> {
        self.adapters.get(&provider).map(|a| a.capabilities())
    }

    /// Get all registered providers
    pub fn get_registered_providers(&self) -> Vec<TranscriptionProvider> {
        self.adapters.keys().copied().collect()
    }

    /// Get the default provider
    pub fn default_provider(&self) -> Option<TranscriptionProvider> {
        self.config
            .default_provider
            .or_else(|| self.adapters.keys().next().copied())
    }
}

/// Factory function to create a VoiceRouter
pub fn create_voice_router(config: VoiceRouterConfig) -> VoiceRouter {
    VoiceRouter::new(config)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic(expected = "VoiceRouter requires at least one provider configuration")]
    fn test_empty_config_panics() {
        VoiceRouter::new(VoiceRouterConfig::default());
    }

    #[test]
    fn test_selection_strategy_explicit() {
        let mut providers = HashMap::new();
        providers.insert(
            TranscriptionProvider::Gladia,
            ProviderConfig {
                api_key: "test".into(),
                base_url: None,
                timeout_ms: None,
                headers: None,
            },
        );

        let router = VoiceRouter::new(VoiceRouterConfig {
            providers,
            default_provider: None,
            selection_strategy: SelectionStrategy::Explicit,
        });

        // Should fail without explicit provider
        let result = router.select_provider(None);
        assert!(result.is_err());

        // Should succeed with explicit provider
        let result = router.select_provider(Some(TranscriptionProvider::Gladia));
        assert!(result.is_ok());
    }
}
