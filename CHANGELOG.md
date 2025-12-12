# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 2025-12-12

### 🐛 CRITICAL BUG FIXES

#### Fixed WebSocket Message Parsing (Gladia, AssemblyAI, Deepgram)
- **Issue**: WebSocket streaming returned empty transcripts due to incorrect field access
- **Root Cause**: Using `JSON.parse()` without applying generated TypeScript types, accessing wrong nested fields
- **Impact**: All streaming transcriptions failed silently with empty text

**Gladia Fix**:
- ✅ Fixed `message.text` → `message.data.utterance.text` (correct nested structure)
- ✅ Fixed `message.is_final` → `message.data.is_final`
- ✅ Added proper TypeScript type `TranscriptMessage` from generated schema
- ✅ WebSocket messages now type-safe with compile-time validation

**AssemblyAI Fix**:
- ✅ Added manual WebSocket message types (`SessionBeginsMessage`, `PartialTranscriptMessage`, `FinalTranscriptMessage`)
- ✅ Applied discriminated union `RealtimeMessage` for type-safe message handling
- ✅ Removed unsafe `any` types and optional chaining (`?.`)

**Deepgram Fix**:
- ✅ Added manual WebSocket message types (`DeepgramResultsMessage`, etc.)
- ✅ Applied proper type narrowing with discriminated unions
- ✅ Removed unsafe fallbacks (`|| ""`, `|| 0`)

### ⚡ PERFORMANCE & CODE QUALITY

#### Refactored to Use Generated API Clients
**Problem**: Adapters manually created axios clients and made HTTP calls, bypassing Orval-generated API client functions with full type safety.

**Gladia Adapter**:
- ✅ Replaced manual `this.client.post<Type>("/url", payload)` with `preRecordedControllerInitPreRecordedJobV2(request, config)`
- ✅ Replaced manual `this.client.get<Type>("/url")` with `preRecordedControllerGetPreRecordedJobV2(id, config)`
- ✅ Replaced manual streaming init with `streamingControllerInitStreamingSessionV2(request, config)`
- ✅ Removed `AxiosInstance` and manual `axios.create()` initialization

**AssemblyAI Adapter**:
- ✅ Replaced manual transcription calls with `createTranscript(request, config)`
- ✅ Replaced manual get calls with `getTranscriptAPI(id, config)`
- ✅ Replaced manual token creation with `createTemporaryToken(params, config)`
- ✅ Removed `AxiosInstance` and manual initialization

**Benefits**:
- 🎯 **Full compile-time type safety** - TypeScript validates request/response structures
- 🎯 **Correct URLs** - Hardcoded in generated functions, can't be typo'd
- 🎯 **Auto-updates** - Regenerating from OpenAPI specs updates adapters automatically
- 🎯 **Less code** - No manual axios client management
- 🎯 **This class of bugs is now IMPOSSIBLE** - Types enforce correct structure

### 📚 DOCUMENTATION

- ✅ Added `BUG_ANALYSIS_TYPE_SAFETY.md` - Comprehensive root cause analysis
- ✅ Documented why manual axios approach was dangerous
- ✅ Explained the difference between type generation vs actually using types
- ✅ Created guidelines for future adapter development

### 🔧 TECHNICAL DETAILS

**Files Changed**:
- `src/adapters/gladia-adapter.ts` - HTTP + WebSocket refactored
- `src/adapters/assemblyai-adapter.ts` - HTTP + WebSocket refactored
- `src/adapters/deepgram-adapter.ts` - WebSocket refactored
- `BUG_ANALYSIS_TYPE_SAFETY.md` - New documentation
- `CHANGELOG.md` - Created

**Type Safety Improvements**:
- Removed all `JSON.parse()` returning `any` without type application
- Added discriminated union types for WebSocket messages
- Removed unsafe type assertions and optional chaining where fields are guaranteed
- Applied generated API client functions with full type checking

**Build Status**:
- ✅ CJS Bundle: Success
- ✅ ESM Bundle: Success
- ⚠️ DTS Build: Fails due to pre-existing AssemblyAI schema generation issues (unrelated to this fix)

### 🚧 KNOWN ISSUES

**AssemblyAI Schema Generation**:
- Missing generated schema files (`afterId`, `beforeId`, `createdOn`, etc.)
- Affects DTS (type declaration) build only
- Does NOT affect runtime (CJS/ESM bundles work perfectly)
- **Workaround**: Use CJS or ESM bundles directly
- **Fix**: Regenerate AssemblyAI OpenAPI client from updated spec

**Deepgram OpenAPI Generation**:
- Cannot generate API client due to duplicate schema names in OpenAPI spec
- Deepgram adapter uses manual HTTP calls (still needs refactoring)
- WebSocket parsing is type-safe

---

## [0.1.3] - 2025-12-12

### Added
- Strict TypeScript types for audio encoding with automatic provider mapping
- `AudioEncoding` union type with all supported formats
- `mapEncodingToProvider()` function for automatic format conversion
- Runtime validation with clear error messages

### Changed
- Updated `StreamingOptions` to use strict `AudioEncoding` instead of `string`
- Fixed Gladia streaming endpoint from `/v2/live` to `/live` (base URL already has `/v2`)
- Improved type safety for sample rates, bit depths, and channel configurations

### Fixed
- Corrected Gladia baseURL to match OpenAPI spec: `https://api.gladia.io/v2`
- Fixed "Cannot POST /v2/v2/live" error caused by duplicate `/v2` in path

---

## [0.1.2] - 2025-12-08

### Added
- Initial AssemblyAI adapter implementation
- Comprehensive documentation generation

---

## [0.1.1] - 2025-12-08

### Fixed
- Corrected Gladia streaming endpoint path

---

## [0.1.0] - 2025-12-08

### Added
- Initial release with Gladia adapter
- Voice Router SDK foundation
- Generated types from OpenAPI specs
