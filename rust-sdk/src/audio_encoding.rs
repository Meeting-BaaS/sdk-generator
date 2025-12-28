//! Unified audio encoding types for Voice Router SDK
//!
//! These types provide strict typing for audio formats across all providers,
//! preventing common bugs like passing unsupported encoding formats.

use serde::{Deserialize, Serialize};

/// Unified audio encoding formats supported across providers
///
/// - `Linear16`: PCM 16-bit linear (universal support)
/// - `Mulaw`: μ-law 8-bit (Gladia, Deepgram)
/// - `Alaw`: A-law 8-bit (Gladia only)
/// - `Flac`: FLAC codec (Deepgram only)
/// - `Opus`: Opus codec (Deepgram only)
/// - `Speex`: Speex codec (Deepgram only)
/// - `AmrNb`: AMR narrowband (Deepgram only)
/// - `AmrWb`: AMR wideband (Deepgram only)
/// - `G729`: G.729 codec (Deepgram only)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum AudioEncoding {
    /// PCM 16-bit linear (universal support)
    #[serde(rename = "linear16")]
    Linear16,
    /// μ-law 8-bit telephony codec
    #[serde(rename = "mulaw")]
    Mulaw,
    /// A-law 8-bit telephony codec
    #[serde(rename = "alaw")]
    Alaw,
    /// FLAC codec (Deepgram only)
    #[serde(rename = "flac")]
    Flac,
    /// Opus codec (Deepgram only)
    #[serde(rename = "opus")]
    Opus,
    /// Speex codec (Deepgram only)
    #[serde(rename = "speex")]
    Speex,
    /// AMR narrowband (Deepgram only)
    #[serde(rename = "amr-nb")]
    AmrNb,
    /// AMR wideband (Deepgram only)
    #[serde(rename = "amr-wb")]
    AmrWb,
    /// G.729 codec (Deepgram only)
    #[serde(rename = "g729")]
    G729,
}

impl AudioEncoding {
    /// Convert to string representation
    pub fn as_str(&self) -> &'static str {
        match self {
            AudioEncoding::Linear16 => "linear16",
            AudioEncoding::Mulaw => "mulaw",
            AudioEncoding::Alaw => "alaw",
            AudioEncoding::Flac => "flac",
            AudioEncoding::Opus => "opus",
            AudioEncoding::Speex => "speex",
            AudioEncoding::AmrNb => "amr-nb",
            AudioEncoding::AmrWb => "amr-wb",
            AudioEncoding::G729 => "g729",
        }
    }

    /// Parse from string
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "linear16" | "pcm_s16le" | "pcm16" | "pcm" => Some(AudioEncoding::Linear16),
            "mulaw" | "pcm_mulaw" => Some(AudioEncoding::Mulaw),
            "alaw" | "pcm_alaw" => Some(AudioEncoding::Alaw),
            "flac" => Some(AudioEncoding::Flac),
            "opus" => Some(AudioEncoding::Opus),
            "speex" => Some(AudioEncoding::Speex),
            "amr-nb" => Some(AudioEncoding::AmrNb),
            "amr-wb" => Some(AudioEncoding::AmrWb),
            "g729" => Some(AudioEncoding::G729),
            _ => None,
        }
    }
}

/// Standard sample rates (Hz) for audio streaming
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AudioSampleRate {
    #[serde(rename = "8000")]
    Hz8000 = 8000,
    #[serde(rename = "16000")]
    Hz16000 = 16000,
    #[serde(rename = "32000")]
    Hz32000 = 32000,
    #[serde(rename = "44100")]
    Hz44100 = 44100,
    #[serde(rename = "48000")]
    Hz48000 = 48000,
}

impl AudioSampleRate {
    pub fn as_u32(&self) -> u32 {
        *self as u32
    }
}

/// Standard bit depths for PCM audio
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AudioBitDepth {
    Bit8 = 8,
    Bit16 = 16,
    Bit24 = 24,
    Bit32 = 32,
}

/// Audio channel configurations (1-8 channels)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct AudioChannels(u8);

impl AudioChannels {
    pub fn new(channels: u8) -> Option<Self> {
        if channels >= 1 && channels <= 8 {
            Some(Self(channels))
        } else {
            None
        }
    }

    pub fn mono() -> Self {
        Self(1)
    }

    pub fn stereo() -> Self {
        Self(2)
    }

    pub fn as_u8(&self) -> u8 {
        self.0
    }
}

impl Default for AudioChannels {
    fn default() -> Self {
        Self::mono()
    }
}

/// Provider type for encoding mapping
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StreamingProvider {
    Gladia,
    Deepgram,
    AssemblyAI,
}

/// Map unified encoding to Gladia format
fn map_to_gladia(encoding: AudioEncoding) -> Option<&'static str> {
    match encoding {
        AudioEncoding::Linear16 => Some("wav/pcm"),
        AudioEncoding::Mulaw => Some("wav/ulaw"),
        AudioEncoding::Alaw => Some("wav/alaw"),
        _ => None,
    }
}

/// Map unified encoding to Deepgram format
fn map_to_deepgram(encoding: AudioEncoding) -> Option<&'static str> {
    match encoding {
        AudioEncoding::Linear16 => Some("linear16"),
        AudioEncoding::Mulaw => Some("mulaw"),
        AudioEncoding::Flac => Some("flac"),
        AudioEncoding::Opus => Some("opus"),
        AudioEncoding::Speex => Some("speex"),
        AudioEncoding::AmrNb => Some("amr-nb"),
        AudioEncoding::AmrWb => Some("amr-wb"),
        AudioEncoding::G729 => Some("g729"),
        _ => None,
    }
}

/// Map unified encoding to AssemblyAI format
fn map_to_assemblyai(encoding: AudioEncoding) -> Option<&'static str> {
    match encoding {
        AudioEncoding::Linear16 => Some("pcm_s16le"),
        AudioEncoding::Mulaw => Some("pcm_mulaw"),
        AudioEncoding::Alaw => Some("pcm_alaw"),
        _ => None,
    }
}

/// Get provider-specific encoding format from unified format
///
/// # Arguments
/// * `encoding` - Unified encoding format
/// * `provider` - Target provider
///
/// # Returns
/// Provider-specific encoding string, or error if not supported
pub fn map_encoding_to_provider(
    encoding: AudioEncoding,
    provider: StreamingProvider,
) -> Result<&'static str, String> {
    let result = match provider {
        StreamingProvider::Gladia => map_to_gladia(encoding),
        StreamingProvider::Deepgram => map_to_deepgram(encoding),
        StreamingProvider::AssemblyAI => map_to_assemblyai(encoding),
    };

    result.ok_or_else(|| {
        let supported = match provider {
            StreamingProvider::Gladia => "linear16, mulaw, alaw",
            StreamingProvider::Deepgram => "linear16, mulaw, flac, opus, speex, amr-nb, amr-wb, g729",
            StreamingProvider::AssemblyAI => "linear16, mulaw, alaw",
        };
        format!(
            "Encoding '{:?}' is not supported by {:?}. Supported encodings: {}",
            encoding, provider, supported
        )
    })
}

/// Validate audio configuration for a specific provider
///
/// # Arguments
/// * `encoding` - Audio encoding format
/// * `channels` - Number of audio channels
/// * `provider` - Target provider
///
/// # Returns
/// Ok if valid, Err with message if invalid
pub fn validate_audio_config(
    encoding: Option<AudioEncoding>,
    channels: Option<AudioChannels>,
    provider: StreamingProvider,
) -> Result<(), String> {
    // Validate encoding if provided
    if let Some(enc) = encoding {
        map_encoding_to_provider(enc, provider)?;
    }

    // Provider-specific validations
    if provider == StreamingProvider::Gladia {
        if let Some(ch) = channels {
            if ch.as_u8() < 1 || ch.as_u8() > 8 {
                return Err("Gladia supports 1-8 audio channels".to_string());
            }
        }
    }

    if provider == StreamingProvider::AssemblyAI {
        if let Some(enc) = encoding {
            if enc != AudioEncoding::Linear16 {
                return Err("AssemblyAI streaming only supports linear16 encoding".to_string());
            }
        }
    }

    Ok(())
}
