/**
 * Shared endpoint configuration for transcription providers
 *
 * Centralizes API and WebSocket base URLs. Adapters resolve endpoints from
 * this registry, with config overrides (baseUrl, wsBaseUrl) and region support.
 */

import type { TranscriptionProvider } from "../router/types"

/**
 * Endpoint URLs for a transcription provider
 *
 * - `api`: REST API base URL (required)
 * - `websocket`: WebSocket base URL for streaming (optional - some providers
 *   get it dynamically, e.g. Gladia from REST init)
 */
export interface ProviderEndpoints {
  api: string
  websocket?: string
}

/**
 * Region-to-host mapping for providers that support regional endpoints
 */
type RegionToEndpoints<TRegion extends string> = Record<TRegion, ProviderEndpoints>

/**
 * Default endpoints for providers with static URLs (no region)
 */
const STATIC_ENDPOINTS: Partial<Record<TranscriptionProvider, ProviderEndpoints>> = {
  gladia: {
    api: "https://api.gladia.io"
    // websocket: from REST streaming init response
  },
  "openai-whisper": {
    api: "https://api.openai.com/v1"
  }
}

/**
 * Deepgram region → endpoints
 */
const DEEPGRAM_REGION_ENDPOINTS: RegionToEndpoints<"global" | "eu"> = {
  global: {
    api: "https://api.deepgram.com/v1",
    websocket: "wss://api.deepgram.com/v1/listen"
  },
  eu: {
    api: "https://api.eu.deepgram.com/v1",
    websocket: "wss://api.eu.deepgram.com/v1/listen"
  }
}

/**
 * AssemblyAI region → endpoints
 */
const ASSEMBLYAI_REGION_ENDPOINTS: RegionToEndpoints<"us" | "eu"> = {
  us: {
    api: "https://api.assemblyai.com",
    websocket: "wss://streaming.assemblyai.com/v3/ws"
  },
  eu: {
    api: "https://api.eu.assemblyai.com",
    websocket: "wss://streaming.eu.assemblyai.com/v3/ws"
  }
}

/**
 * Speechmatics region → API base URL (path added in adapter)
 * Returns full URL including /v2
 */
const SPEECHMATICS_REGION_ENDPOINTS: Record<string, ProviderEndpoints> = {
  eu1: { api: "https://eu1.asr.api.speechmatics.com/v2" },
  eu2: { api: "https://eu2.asr.api.speechmatics.com/v2" },
  us1: { api: "https://us1.asr.api.speechmatics.com/v2" },
  us2: { api: "https://us2.asr.api.speechmatics.com/v2" },
  au1: { api: "https://au1.asr.api.speechmatics.com/v2" }
}

/**
 * Soniox region → endpoints
 */
const SONIOX_REGION_ENDPOINTS: RegionToEndpoints<"us" | "eu" | "jp"> = {
  us: {
    api: "https://api.soniox.com/v1",
    websocket: "wss://stt-rt.soniox.com"
  },
  eu: {
    api: "https://api.eu.soniox.com/v1",
    websocket: "wss://stt-rt.eu.soniox.com"
  },
  jp: {
    api: "https://api.jp.soniox.com/v1",
    websocket: "wss://stt-rt.jp.soniox.com"
  }
}

/**
 * ElevenLabs region → endpoints
 */
const ELEVENLABS_REGION_ENDPOINTS: Record<string, ProviderEndpoints> = {
  global: {
    api: "https://api.elevenlabs.io",
    websocket: "wss://api.elevenlabs.io"
  },
  us: {
    api: "https://api.us.elevenlabs.io",
    websocket: "wss://api.us.elevenlabs.io"
  },
  eu: {
    api: "https://api.eu.residency.elevenlabs.io",
    websocket: "wss://api.eu.residency.elevenlabs.io"
  },
  in: {
    api: "https://api.in.residency.elevenlabs.io",
    websocket: "wss://api.in.residency.elevenlabs.io"
  }
}

/**
 * Resolve endpoints for a provider
 *
 * @param provider - Provider name
 * @param region - Optional region code (provider-specific)
 * @param overrides - Optional baseUrl/wsBaseUrl from config
 */
export function getProviderEndpoints(
  provider: TranscriptionProvider,
  region?: string,
  overrides?: { baseUrl?: string; wsBaseUrl?: string }
): ProviderEndpoints {
  // Config overrides take precedence
  if (overrides?.baseUrl) {
    return {
      api: overrides.baseUrl,
      websocket: overrides.wsBaseUrl
    }
  }

  // Static endpoints (no region)
  const staticEp = STATIC_ENDPOINTS[provider]
  if (staticEp) {
    return {
      ...staticEp,
      websocket: overrides?.wsBaseUrl ?? staticEp.websocket
    }
  }

  // Region-based endpoints
  switch (provider) {
    case "deepgram": {
      const r = (region === "eu" ? "eu" : "global") as "global" | "eu"
      const ep = DEEPGRAM_REGION_ENDPOINTS[r]
      return {
        ...ep,
        websocket: overrides?.wsBaseUrl ?? ep.websocket
      }
    }
    case "assemblyai": {
      const r = (region === "eu" ? "eu" : "us") as "us" | "eu"
      const ep = ASSEMBLYAI_REGION_ENDPOINTS[r]
      return {
        ...ep,
        websocket: overrides?.wsBaseUrl ?? ep.websocket
      }
    }
    case "speechmatics": {
      const r = region || "eu1"
      const ep = SPEECHMATICS_REGION_ENDPOINTS[r] ?? SPEECHMATICS_REGION_ENDPOINTS.eu1
      return { ...ep }
    }
    case "soniox": {
      const r = (region as "us" | "eu" | "jp") || "us"
      const ep = SONIOX_REGION_ENDPOINTS[r] ?? SONIOX_REGION_ENDPOINTS.us
      return {
        ...ep,
        websocket: overrides?.wsBaseUrl ?? ep.websocket
      }
    }
    case "elevenlabs": {
      const r = region || "global"
      const ep = ELEVENLABS_REGION_ENDPOINTS[r] ?? ELEVENLABS_REGION_ENDPOINTS.global
      return {
        ...ep,
        websocket: overrides?.wsBaseUrl ?? ep.websocket
      }
    }
    case "azure-stt": {
      const r = region || "eastus"
      return { api: `https://${r}.api.cognitive.microsoft.com/speechtotext/v3.1` }
    }
    default:
      return { api: "" }
  }
}
