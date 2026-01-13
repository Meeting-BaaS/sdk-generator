#!/usr/bin/env node
/**
 * Generates a Mermaid diagram of the SDK generation pipeline
 * by analyzing the actual codebase structure.
 *
 * Run: pnpm openapi:diagram
 * Output: docs/sdk-generation-pipeline.mmd
 *
 * @fileoverview Auto-generates pipeline visualization from codebase analysis
 */

const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "..")
const SPECS_DIR = path.join(ROOT, "specs")
const SCRIPTS_DIR = path.join(ROOT, "scripts")
const GENERATED_DIR = path.join(ROOT, "src/generated")
const ADAPTERS_DIR = path.join(ROOT, "src/adapters")

/**
 * @typedef {Object} SpecSource
 * @property {string} [url] - Remote URL to fetch from
 * @property {string} output - Local output path
 * @property {string} [format] - File format (json, yaml, typescript)
 * @property {boolean} [manual] - Whether this is a manual spec
 * @property {string} [note] - Note about manual specs
 */

/**
 * @typedef {Object.<string, SpecSource>} SpecSources
 */

/**
 * Parse SPEC_SOURCES from sync-specs.js dynamically
 * @returns {SpecSources}
 */
function parseSpecSources() {
  const syncSpecsPath = path.join(SCRIPTS_DIR, "sync-specs.js")
  const content = fs.readFileSync(syncSpecsPath, "utf-8")

  // Extract SPEC_SOURCES object using regex
  const match = content.match(/const SPEC_SOURCES\s*=\s*\{([\s\S]*?)\n\}/m)
  if (!match) {
    console.warn("Warning: Could not parse SPEC_SOURCES from sync-specs.js")
    return {}
  }

  const sources = {}
  const bodyContent = match[1]

  // Parse each source entry
  const entryRegex = /(\w+):\s*\{([^}]+)\}/g
  let entryMatch
  while ((entryMatch = entryRegex.exec(bodyContent)) !== null) {
    const [, name, props] = entryMatch
    const source = {}

    // Extract url
    const urlMatch = props.match(/url:\s*["']([^"']+)["']/)
    if (urlMatch) source.url = urlMatch[1]

    // Extract output
    const outputMatch = props.match(/output:\s*["']([^"']+)["']/)
    if (outputMatch) source.output = outputMatch[1]

    // Extract manual flag
    if (props.includes("manual: true")) source.manual = true

    // Extract note
    const noteMatch = props.match(/note:\s*["']([^"']+)["']/)
    if (noteMatch) source.note = noteMatch[1]

    sources[name] = source
  }

  return sources
}

/**
 * Scan specs directory for all spec files
 * @returns {string[]}
 */
function scanSpecs() {
  return fs
    .readdirSync(SPECS_DIR)
    .filter(
      (f) => f.endsWith(".json") || f.endsWith(".yml") || f.endsWith(".yaml") || f.endsWith(".ts")
    )
    .filter((f) => !f.endsWith(".backup"))
}

/**
 * Scan scripts directory and categorize by type
 * @returns {{fix: string[], sync: string[], generate: string[]}}
 */
function scanScripts() {
  const scripts = fs.readdirSync(SCRIPTS_DIR).filter((f) => f.endsWith(".js"))
  return {
    fix: scripts.filter((f) => f.startsWith("fix-")),
    sync: scripts.filter((f) => f.startsWith("sync-")),
    generate: scripts.filter((f) => f.startsWith("generate-") && !f.includes("pipeline-diagram"))
  }
}

/**
 * Scan generated directory for provider directories
 * @returns {string[]}
 */
function scanGenerated() {
  if (!fs.existsSync(GENERATED_DIR)) return []
  return fs
    .readdirSync(GENERATED_DIR)
    .filter((f) => fs.statSync(path.join(GENERATED_DIR, f)).isDirectory())
}

/**
 * Scan adapters directory
 * @returns {string[]}
 */
function scanAdapters() {
  if (!fs.existsSync(ADAPTERS_DIR)) return []
  return fs.readdirSync(ADAPTERS_DIR).filter((f) => f.endsWith("-adapter.ts"))
}

/**
 * Scan webhooks directory
 * @returns {string[]}
 */
function scanWebhooks() {
  const webhooksDir = path.join(ROOT, "src/webhooks")
  if (!fs.existsSync(webhooksDir)) return []
  return fs.readdirSync(webhooksDir).filter((f) => f.endsWith("-webhook.ts"))
}

/**
 * Check what's in the router directory
 * @returns {{hasRouter: boolean, hasStreamingTypes: boolean}}
 */
function scanRouter() {
  const routerDir = path.join(ROOT, "src/router")
  if (!fs.existsSync(routerDir)) return { hasRouter: false, hasStreamingTypes: false }
  const files = fs.readdirSync(routerDir)
  return {
    hasRouter: files.includes("voice-router.ts"),
    hasStreamingTypes: files.includes("provider-streaming-types.ts"),
    files: files.filter((f) => f.endsWith(".ts"))
  }
}

/**
 * Scan manual-types directory for type overrides
 * @returns {string[]}
 */
function scanManualTypes() {
  const manualTypesDir = path.join(SCRIPTS_DIR, "manual-types")
  if (!fs.existsSync(manualTypesDir)) return []

  const providers = []
  for (const item of fs.readdirSync(manualTypesDir)) {
    const itemPath = path.join(manualTypesDir, item)
    if (fs.statSync(itemPath).isDirectory()) {
      const files = fs.readdirSync(itemPath).filter((f) => f.endsWith(".ts"))
      if (files.length > 0) {
        providers.push({ provider: item, files })
      }
    }
  }
  return providers
}

/**
 * Parse orval.config.ts for project names
 * @returns {string[]}
 */
function parseOrvalConfig() {
  const orvalPath = path.join(ROOT, "orval.config.ts")
  const content = fs.readFileSync(orvalPath, "utf-8")

  const projects = []
  const projectRegex = /(\w+(?:Api|Zod)):\s*\{/g
  let match
  while ((match = projectRegex.exec(content)) !== null) {
    projects.push(match[1])
  }
  return projects
}

/**
 * Sanitize string for use as Mermaid node ID
 * @param {string} str
 * @returns {string}
 */
function sanitizeId(str) {
  return str.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()
}

/**
 * Get spec filename from output path
 * @param {string} output
 * @returns {string}
 */
function getSpecFilename(output) {
  return path.basename(output)
}

/**
 * Generate the Mermaid diagram
 * @returns {string}
 */
function generateMermaid() {
  const specSources = parseSpecSources()
  const specs = scanSpecs()
  const scripts = scanScripts()
  const generated = scanGenerated()
  const adapters = scanAdapters()
  const webhooks = scanWebhooks()
  const router = scanRouter()
  const manualTypes = scanManualTypes()
  const orvalProjects = parseOrvalConfig()

  // Separate remote and manual sources
  const remoteSources = Object.entries(specSources).filter(([, v]) => !v.manual && v.url)
  const manualSources = Object.entries(specSources).filter(([, v]) => v.manual)

  let mmd = `%% SDK Generation Pipeline - Auto-generated by scripts/generate-pipeline-diagram.js
%% Run: pnpm openapi:diagram
%% Last generated: ${new Date().toISOString()}
%% Sources parsed from: sync-specs.js, orval.config.ts, package.json

flowchart TB
`

  // ===== REMOTE SOURCES =====
  mmd += `    subgraph REMOTE["REMOTE SOURCES"]
        direction TB
`
  for (const [key, source] of remoteSources) {
    const shortUrl = source.url.replace("https://", "").replace("http://", "").substring(0, 40)
    mmd += `        REMOTE_${sanitizeId(key)}["${key}<br/>${shortUrl}..."]
`
  }
  mmd += `    end

`

  // ===== SYNC SCRIPT =====
  mmd += `    subgraph SYNC["SPEC SYNC"]
        SYNC_SCRIPT["sync-specs.js<br/>pnpm openapi:sync"]
    end

`

  // ===== MANUAL SPECS =====
  if (manualSources.length > 0) {
    mmd += `    subgraph MANUAL["MANUAL SPECS"]
        direction TB
`
    for (const [key, source] of manualSources) {
      const filename = getSpecFilename(source.output)
      mmd += `        MANUAL_${sanitizeId(key)}["${filename}<br/>${source.note || "manually maintained"}"]
`
    }
    mmd += `    end

`
  }

  // ===== MANUAL TYPE OVERRIDES =====
  if (manualTypes.length > 0) {
    mmd += `    subgraph MANUAL_TYPES["MANUAL TYPE OVERRIDES"]
        direction TB
`
    for (const { provider, files } of manualTypes) {
      mmd += `        MT_${sanitizeId(provider)}["${provider}/<br/>${files.length} type files"]
`
    }
    mmd += `    end

`
  }

  // ===== SPECS DIRECTORY =====
  mmd += `    subgraph SPECS["specs/ directory"]
        direction TB
`
  for (const spec of specs) {
    const id = sanitizeId(spec.replace(/\.(json|yml|yaml|ts)$/, ""))
    mmd += `        SPEC_${id}["${spec}"]
`
  }
  mmd += `    end

`

  // ===== PRE-ORVAL FIXES =====
  const preOrvalFixes = scripts.fix.filter(
    (f) => f.includes("openai") || f.includes("speechmatics") || f.includes("deepgram")
  )
  if (preOrvalFixes.length > 0) {
    mmd += `    subgraph FIX_PRE["PRE-ORVAL FIXES"]
        direction TB
`
    for (const script of preOrvalFixes) {
      const id = sanitizeId(script.replace(".js", ""))
      // Extract what it fixes from the filename
      const provider = script.replace("fix-", "").replace("-spec.js", "")
      mmd += `        PRE_${id}["${script}<br/>fixes ${provider} spec"]
`
    }
    mmd += `    end

`
  }

  // ===== ORVAL GENERATION =====
  mmd += `    subgraph ORVAL["ORVAL GENERATION"]
        direction TB
        ORVAL_CFG["orval.config.ts<br/>${orvalProjects.length} projects"]
        ORVAL_API["API clients<br/>axios-functions"]
        ORVAL_ZOD["Zod schemas<br/>runtime validation"]
        ORVAL_TYPES["TypeScript types<br/>schema/ directories"]
    end

`

  // ===== POST-ORVAL FIXES =====
  const postOrvalFixes = scripts.fix.filter(
    (f) => f.includes("generated") || f.includes("assemblyai-missing")
  )
  if (postOrvalFixes.length > 0) {
    mmd += `    subgraph FIX_POST["POST-ORVAL FIXES"]
        direction TB
`
    for (const script of postOrvalFixes) {
      const id = sanitizeId(script.replace(".js", ""))
      mmd += `        POST_${id}["${script}"]
`
    }
    // Add sed fixes from package.json
    mmd += `        POST_SED["sed fixes<br/>speechmatics string literals"]
`
    mmd += `    end

`
  }

  // ===== STREAMING TYPE GENERATION =====
  const streamingScripts = scripts.sync.filter((f) => f.includes("streaming"))
  if (streamingScripts.length > 0) {
    mmd += `    subgraph STREAMING["STREAMING TYPE GENERATION"]
        direction TB
`
    for (const script of streamingScripts) {
      const id = sanitizeId(script.replace(".js", ""))
      const provider = script.replace("sync-", "").replace("-streaming-types.js", "")
      mmd += `        STREAM_${id}["${script}<br/>${provider}"]
`
    }
    mmd += `    end

`
  }

  // ===== LANGUAGE EXTRACTION =====
  const langScripts = scripts.generate.filter((f) => f.includes("language"))
  if (langScripts.length > 0) {
    mmd += `    subgraph LANGS["LANGUAGE EXTRACTION"]
        direction TB
`
    for (const script of langScripts) {
      const id = sanitizeId(script.replace(".js", ""))
      mmd += `        LANG_${id}["${script}"]
`
    }
    mmd += `    end

`
  }

  // ===== GENERATED OUTPUT =====
  if (generated.length > 0) {
    mmd += `    subgraph GENERATED["src/generated/"]
        direction TB
`
    for (const dir of generated) {
      const id = sanitizeId(dir)
      const genPath = path.join(GENERATED_DIR, dir)
      const contents = fs.readdirSync(genPath)
      const hasApi = contents.includes("api")
      const hasSchema = contents.includes("schema")
      const hasStreaming = contents.some((f) => f.includes("streaming"))
      const hasBatch = contents.some((f) => f.includes("batch"))
      const hasLanguages = contents.includes("languages.ts")

      let features = []
      if (hasApi) features.push("api/")
      if (hasSchema) features.push("schema/")
      if (hasStreaming) features.push("streaming")
      if (hasBatch) features.push("batch")
      if (hasLanguages) features.push("languages")

      mmd += `        GEN_${id}["${dir}/<br/>${features.join(" ")}"]
`
    }
    mmd += `    end

`
  }

  // ===== EXPORTS =====
  mmd += `    subgraph EXPORTS["SDK EXPORTS"]
        direction TB
        EXP_FIELD["field-configs.ts<br/>zodToFieldConfigs()"]
        EXP_INDEX["index.ts<br/>Types + Zod namespaces"]
        EXP_META["provider-metadata.ts<br/>Provider info"]
        EXP_CONST["constants.ts<br/>Enums + constants"]
    end

`

  // ===== SDK INTERNALS =====
  mmd += `    subgraph SDK_INTERNALS["SDK INTERNALS"]
        direction TB
`

  // Adapters
  if (adapters.length > 0) {
    mmd += `        subgraph ADAPTERS["Provider Adapters"]
            direction LR
`
    for (const adapter of adapters) {
      const id = sanitizeId(adapter.replace("-adapter.ts", ""))
      const name = adapter.replace("-adapter.ts", "")
      mmd += `            ADAPT_${id}["${name}"]
`
    }
    mmd += `        end
`
  }

  // Webhooks
  if (webhooks.length > 0) {
    mmd += `        subgraph WEBHOOKS["Webhook Handlers"]
            direction LR
`
    for (const webhook of webhooks) {
      const id = sanitizeId(webhook.replace("-webhook.ts", ""))
      const name = webhook.replace("-webhook.ts", "")
      mmd += `            HOOK_${id}["${name}"]
`
    }
    mmd += `        end
`
  }

  // Router
  if (router.hasRouter) {
    mmd += `        subgraph ROUTER["Voice Router"]
            direction TB
            ROUTER_MAIN["voice-router.ts<br/>VoiceRouter class"]
            ROUTER_TYPES["types.ts<br/>TranscriptionConfig"]
            ROUTER_STREAM["provider-streaming-types.ts"]
        end
`
  }

  mmd += `    end

`

  // ===== PUBLIC API =====
  mmd += `    subgraph PUBLIC_API["PUBLIC API (what users import)"]
        direction TB
        API_ROUTER["VoiceRouter<br/>Multi-provider routing"]
        API_ADAPTERS["Provider Adapters<br/>Direct provider access"]
        API_WEBHOOKS["WebhookRouter<br/>Webhook handling"]
        API_TYPES["Types + Zod Schemas<br/>Runtime validation"]
        API_CONFIGS["Field Configs<br/>UI form generation"]
        API_META["Provider Metadata<br/>Provider capabilities"]
    end

`

  // ===== CONNECTIONS =====

  // Remote -> Sync Script
  mmd += `    %% Remote sources to sync script
    REMOTE --> SYNC_SCRIPT
`

  // Sync Script -> Specs
  mmd += `
    %% Sync script to specs
    SYNC_SCRIPT --> SPECS
`

  // Manual -> Specs
  if (manualSources.length > 0) {
    mmd += `
    %% Manual specs to specs directory
    MANUAL --> SPECS
`
  }

  // Manual Types -> Post-fixes (they're used during fix-generated)
  if (manualTypes.length > 0) {
    mmd += `
    %% Manual type overrides
    MANUAL_TYPES --> FIX_POST
`
  }

  // Specs -> Pre-fixes (for specs that need fixing)
  mmd += `
    %% Specs requiring pre-processing
`
  // Map pre-fix scripts to their target spec files (must match sanitized spec filenames)
  const preFixToSpec = {
    "fix-deepgram-spec": "deepgram-openapi", // specs/deepgram-openapi.yml
    "fix-openai-spec": "openai-openapi", // specs/openai-openapi.yaml
    "fix-speechmatics-spec": "speechmatics-batch" // specs/speechmatics-batch.yml
  }
  for (const script of preOrvalFixes) {
    const scriptId = sanitizeId(script.replace(".js", ""))
    const specKey = script.replace(".js", "")
    const specId = preFixToSpec[specKey]
    if (specId) {
      mmd += `    SPEC_${sanitizeId(specId)} --> PRE_${scriptId}
`
    }
  }

  // Pre-fixes -> Orval
  mmd += `
    %% Pre-fixes to Orval
`
  for (const script of preOrvalFixes) {
    const id = sanitizeId(script.replace(".js", ""))
    mmd += `    PRE_${id} --> ORVAL
`
  }

  // Specs -> Orval (direct, for specs without pre-fixes)
  mmd += `
    %% Specs directly to Orval (no pre-processing needed)
    SPECS --> ORVAL
`

  // Orval internal
  mmd += `
    %% Orval internal flow
    ORVAL_CFG --> ORVAL_API
    ORVAL_CFG --> ORVAL_ZOD
    ORVAL_CFG --> ORVAL_TYPES
`

  // Orval -> Post-fixes
  mmd += `
    %% Orval to post-fixes
    ORVAL --> FIX_POST
`

  // Post-fixes -> Generated
  mmd += `
    %% Post-fixes to generated
    FIX_POST --> GENERATED
`

  // Streaming specs -> Streaming scripts
  mmd += `
    %% Streaming spec sources to streaming scripts
`
  // Map streaming sync scripts to their source spec files (must match sanitized spec filenames)
  const streamingSpecMap = {
    "sync-assemblyai-streaming-types": "assemblyai-streaming-sdk", // specs/assemblyai-streaming-sdk.ts
    "sync-deepgram-streaming-types": "deepgram-streaming-sdk", // specs/deepgram-streaming-sdk.ts
    "sync-speechmatics-streaming-types": "speechmatics-asyncapi", // specs/speechmatics-asyncapi.yml
    "sync-soniox-streaming-types": "soniox-streaming-types" // specs/soniox-streaming-types.ts (manual)
  }
  for (const script of streamingScripts) {
    const scriptId = sanitizeId(script.replace(".js", ""))
    const scriptKey = script.replace(".js", "")
    const specId = streamingSpecMap[scriptKey]
    if (specId) {
      mmd += `    SPEC_${sanitizeId(specId)} --> STREAM_${scriptId}
`
    }
  }

  // Streaming -> Generated
  mmd += `
    %% Streaming scripts to generated
    STREAMING --> GENERATED
`

  // Languages -> Generated
  if (langScripts.length > 0) {
    mmd += `
    %% Language extraction to generated
    LANGS --> GENERATED
`
  }

  // Generated -> Exports
  mmd += `
    %% Generated to exports
    GENERATED --> EXP_FIELD
    GENERATED --> EXP_INDEX
    GENERATED --> EXP_META
    EXP_FIELD --> EXP_INDEX
`

  // Exports + Generated -> SDK Internals
  mmd += `
    %% Exports and generated consumed by SDK internals
    EXPORTS --> SDK_INTERNALS
    GENERATED --> SDK_INTERNALS
`

  // SDK Internals -> Public API
  mmd += `
    %% SDK internals to public API
    ADAPTERS --> API_ADAPTERS
    WEBHOOKS --> API_WEBHOOKS
    ROUTER --> API_ROUTER
    EXP_FIELD --> API_CONFIGS
    EXP_META --> API_META
    EXP_INDEX --> API_TYPES
`

  // Styling
  mmd += `
    %% Styling
    classDef remote fill:#e3f2fd,stroke:#1565c0
    classDef manual fill:#fce4ec,stroke:#c2185b
    classDef fix fill:#fff3e0,stroke:#ef6c00
    classDef gen fill:#e8f5e9,stroke:#2e7d32
    classDef export fill:#f3e5f5,stroke:#7b1fa2
    classDef internal fill:#e0f2f1,stroke:#00695c
    classDef api fill:#fff9c4,stroke:#f9a825

    class REMOTE,SYNC remote
    class MANUAL,MANUAL_TYPES manual
    class FIX_PRE,FIX_POST fix
    class ORVAL,GENERATED,STREAMING,LANGS gen
    class EXPORTS export
    class SDK_INTERNALS,ADAPTERS,WEBHOOKS,ROUTER internal
    class PUBLIC_API api
`

  return mmd
}

// ===== MAIN =====
const outputPath = path.join(ROOT, "docs/sdk-generation-pipeline.mmd")
const mermaid = generateMermaid()

// Ensure docs directory exists
const docsDir = path.join(ROOT, "docs")
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true })
}

fs.writeFileSync(outputPath, mermaid)

// Print summary
const specSources = parseSpecSources()
const remoteSources = Object.entries(specSources).filter(([, v]) => !v.manual && v.url)
const manualSources = Object.entries(specSources).filter(([, v]) => v.manual)

console.log(`Generated: ${outputPath}`)
console.log(`Remote sources: ${remoteSources.length} (parsed from sync-specs.js)`)
console.log(`Manual sources: ${manualSources.length}`)
console.log(`Spec files: ${scanSpecs().length}`)
console.log(`Fix scripts: ${scanScripts().fix.length}`)
console.log(`Sync scripts: ${scanScripts().sync.length}`)
console.log(`Generated providers: ${scanGenerated().length}`)
console.log(`Orval projects: ${parseOrvalConfig().length}`)
console.log(`Manual type overrides: ${scanManualTypes().length} providers`)
console.log(`--- SDK Internals ---`)
console.log(`Adapters: ${scanAdapters().length}`)
console.log(`Webhooks: ${scanWebhooks().length}`)
console.log(`Router: ${scanRouter().hasRouter ? "yes" : "no"}`)
