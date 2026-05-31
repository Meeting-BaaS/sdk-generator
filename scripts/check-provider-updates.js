#!/usr/bin/env node

/**
 * Provider Update Checker
 *
 * Checks upstream provider specs and SDK packages to detect changes that may
 * require regeneration or adapter work.
 *
 * Data ownership:
 * - `specs/*` and `references/*` are still owned by `sync-specs.js`
 * - `providerSdks/*` is owned by this script
 *
 * Usage:
 *   node scripts/check-provider-updates.js
 *   node scripts/check-provider-updates.js --provider soniox
 *   node scripts/check-provider-updates.js --write
 */

const fs = require("fs")
const path = require("path")
const http = require("http")
const https = require("https")
const crypto = require("crypto")
const zlib = require("zlib")
const { SPEC_SOURCES, PROVIDERS, canonicalizeForHash } = require("./provider-upstream-manifest")

const SPECS_DIR = path.join(__dirname, "..", "specs")
const CHECKSUMS_FILE = path.join(SPECS_DIR, ".checksums.json")

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex")
}

function loadChecksums() {
  try {
    const parsed = JSON.parse(fs.readFileSync(CHECKSUMS_FILE, "utf-8"))
    if (!parsed.specs) parsed.specs = {}
    if (!parsed.references) parsed.references = {}
    if (!parsed.providerSdks) parsed.providerSdks = {}
    if (!parsed.providerUpstreams) parsed.providerUpstreams = {}
    return parsed
  } catch {
    return { specs: {}, references: {}, providerSdks: {}, providerUpstreams: {} }
  }
}

function saveChecksums(data) {
  data.updatedAt = new Date().toISOString()
  fs.writeFileSync(CHECKSUMS_FILE, JSON.stringify(data, null, 2) + "\n", "utf-8")
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const makeRequest = (requestUrl, redirectCount) => {
      const client = requestUrl.startsWith("https") ? https : http
      client
        .get(
          requestUrl,
          {
            headers: {
              "User-Agent": "sdk-generator-provider-update-checker"
            }
          },
          (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              res.resume()
              if (redirectCount >= 10) {
                reject(new Error(`Too many redirects (${url})`))
                return
              }
              // Location may be relative; resolve it against the current URL
              let nextUrl
              try {
                nextUrl = new URL(res.headers.location, requestUrl).href
              } catch {
                reject(
                  new Error(`Invalid redirect location "${res.headers.location}" from ${requestUrl}`)
                )
                return
              }
              makeRequest(nextUrl, redirectCount + 1)
              return
            }

            if (res.statusCode !== 200) {
              reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
              return
            }

            const chunks = []
            res.on("data", (chunk) => chunks.push(chunk))
            res.on("end", () => resolve(Buffer.concat(chunks)))
            res.on("error", reject)
          }
        )
        .on("error", reject)
    }

    makeRequest(url, 0)
  })
}

async function fetchText(url) {
  return (await fetchBuffer(url)).toString("utf-8")
}

function normalizeTarPath(filePath) {
  // Tarball entries are prefixed with `package/`; declaration paths resolved
  // from package.json `exports`/`types` often carry a leading `./`. Strip both
  // so a tarball entry (`package/dist/x`) and a declared path (`./dist/x`)
  // normalize to the same key (`dist/x`).
  return filePath
    .replace(/\\/g, "/")
    .replace(/^package\//, "")
    .replace(/^\.\//, "")
}

function stateKey(providerName, sourceKey) {
  return `${providerName}:${sourceKey}`
}

function readTarEntry(buffer, targetPath) {
  const normalizedTarget = normalizeTarPath(targetPath)
  let offset = 0

  while (offset + 512 <= buffer.length) {
    const header = buffer.subarray(offset, offset + 512)
    if (header.every((byte) => byte === 0)) {
      break
    }

    const name = header
      .subarray(0, 100)
      .toString("utf-8")
      .replace(/\0.*$/, "")
    const prefix = header
      .subarray(345, 500)
      .toString("utf-8")
      .replace(/\0.*$/, "")
    const fullName = normalizeTarPath(prefix ? `${prefix}/${name}` : name)
    const sizeOctal = header
      .subarray(124, 136)
      .toString("utf-8")
      .replace(/\0.*$/, "")
      .trim()
    const size = sizeOctal ? parseInt(sizeOctal, 8) : 0
    const contentStart = offset + 512
    const contentEnd = contentStart + size

    if (fullName === normalizedTarget) {
      return buffer.subarray(contentStart, contentEnd)
    }

    offset = contentStart + Math.ceil(size / 512) * 512
  }

  return null
}

function extractPackageFileFromTarball(tarballBuffer, filePath) {
  const tarBuffer = zlib.gunzipSync(tarballBuffer)
  const entry = readTarEntry(tarBuffer, filePath)
  if (!entry) {
    throw new Error(`File not found in npm tarball: ${filePath}`)
  }
  return entry
}

function findTypesExport(exportsField, subpath = ".") {
  if (!exportsField) return null

  const candidate = typeof exportsField === "object" ? exportsField[subpath] : null
  if (!candidate) return null

  if (typeof candidate === "string") {
    return candidate.endsWith(".d.ts") || candidate.endsWith(".d.mts") ? candidate : null
  }

  if (typeof candidate === "object") {
    if (typeof candidate.types === "string") return candidate.types
    if (typeof candidate.import === "object" && typeof candidate.import.types === "string") {
      return candidate.import.types
    }
    if (typeof candidate.require === "object" && typeof candidate.require.types === "string") {
      return candidate.require.types
    }
    if (typeof candidate.default === "object" && typeof candidate.default.types === "string") {
      return candidate.default.types
    }
  }

  return null
}

function resolveDeclarationFiles(packageJson, upstreamConfig) {
  if (Array.isArray(upstreamConfig.declarationFiles) && upstreamConfig.declarationFiles.length > 0) {
    return upstreamConfig.declarationFiles
  }

  const fromExports = findTypesExport(packageJson.exports, upstreamConfig.exportPath || ".")
  if (fromExports) return [fromExports]
  if (typeof packageJson.types === "string") return [packageJson.types]
  if (typeof packageJson.typings === "string") return [packageJson.typings]

  for (const candidate of ["dist/index.d.mts", "dist/index.d.ts", "index.d.ts"]) {
    if (upstreamConfig.fallbackDeclarationFiles?.includes(candidate)) return [candidate]
  }

  return upstreamConfig.fallbackDeclarationFiles?.length
    ? [upstreamConfig.fallbackDeclarationFiles[0]]
    : []
}

async function fetchNpmPackageDetails(packageName) {
  const metadataUrl = `https://registry.npmjs.org/${packageName}/latest`
  const metadata = JSON.parse(await fetchText(metadataUrl))
  const tarballUrl = metadata.dist?.tarball
  if (!tarballUrl) {
    throw new Error(`npm metadata for ${packageName} is missing dist.tarball`)
  }

  const tarballBuffer = await fetchBuffer(tarballUrl)
  const packageJsonBuffer = extractPackageFileFromTarball(tarballBuffer, "package.json")
  const packageJson = JSON.parse(packageJsonBuffer.toString("utf-8"))

  return {
    metadataUrl,
    tarballUrl,
    version: metadata.version,
    packageJson,
    tarballBuffer
  }
}

async function checkPackageUpstream(providerName, upstreamConfig, checksumData, write) {
  const providerSdkState = (checksumData.providerSdks[providerName] ??= { packages: {} })
  if (!providerSdkState.packages) providerSdkState.packages = {}

  const pkgName = upstreamConfig.packageName

  try {
    const pkg = await fetchNpmPackageDetails(pkgName)
    const declarationFiles = resolveDeclarationFiles(pkg.packageJson, upstreamConfig)
    const declarationHashes = {}
    let declarationError

    if (declarationFiles.length === 0) {
      declarationError = "No declaration file could be resolved from package metadata"
    }

    for (const declarationFile of declarationFiles) {
      try {
        const declarationBuffer = extractPackageFileFromTarball(pkg.tarballBuffer, declarationFile)
        declarationHashes[declarationFile] = sha256(declarationBuffer)
      } catch (error) {
        declarationError = error.message
        break
      }
    }

    const previous = checksumData.providerSdks[providerName]?.packages?.[pkgName]
    const versionChanged = previous?.version != null && previous.version !== pkg.version
    const combinedDeclarationSha =
      Object.keys(declarationHashes).length > 0
        ? sha256(
            Buffer.from(
              Object.entries(declarationHashes)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([file, hash]) => `${file}:${hash}`)
                .join("\n"),
              "utf-8"
            )
          )
        : undefined
    const declarationChanged =
      combinedDeclarationSha != null &&
      previous?.declarationSha256 != null &&
      previous.declarationSha256 !== combinedDeclarationSha
    const isNew = previous == null

    if (write) {
      providerSdkState.packages[pkgName] = {
        packageName: pkgName,
        sourceKey: upstreamConfig.key,
        label: upstreamConfig.label,
        registryUrl: pkg.metadataUrl,
        tarballUrl: pkg.tarballUrl,
        version: pkg.version,
        sourceFiles: declarationFiles,
        declarationSha256: combinedDeclarationSha ?? undefined,
        declarationFileHashes: declarationHashes,
        declarationError: declarationError ?? undefined,
        checkedAt: new Date().toISOString()
      }
    }

    let status = "unchanged"
    if (declarationError) status = "warning"
    if (isNew) status = "new"
    if (versionChanged || declarationChanged) status = "changed"

    return {
      kind: "sdk",
      key: upstreamConfig.key,
      name: pkgName,
      label: upstreamConfig.label,
      status,
      isNew,
      changed: versionChanged || declarationChanged,
      details: {
        previousVersion: previous?.version,
        currentVersion: pkg.version,
        previousDeclarationSha256: previous?.declarationSha256,
        currentDeclarationSha256: combinedDeclarationSha,
        sourceFiles: declarationFiles,
        declarationFileHashes: declarationHashes,
        declarationError
      }
    }
  } catch (error) {
    return {
      kind: "sdk",
      name: pkgName,
      label: upstreamConfig.label,
      status: "error",
      changed: false,
      details: {
        error: error.message
      }
    }
  }
}

async function checkRemoteUpstream(providerName, upstreamConfig, checksumData, write) {
  const upstreamState = (checksumData.providerUpstreams[stateKey(providerName, upstreamConfig.key)] ??=
    {})

  try {
    const content = await fetchBuffer(upstreamConfig.url)
    // canonicalizeForHash() is a no-op for non-JSON (e.g. HTML docs pages).
    const currentSha256 = sha256(canonicalizeForHash(content))
    const previousSha256 = upstreamState.sha256
    const changed = previousSha256 != null && previousSha256 !== currentSha256
    const isNew = previousSha256 == null

    if (write) {
      checksumData.providerUpstreams[stateKey(providerName, upstreamConfig.key)] = {
        provider: providerName,
        key: upstreamConfig.key,
        type: upstreamConfig.type,
        label: upstreamConfig.label,
        url: upstreamConfig.url,
        sha256: currentSha256,
        size: content.length,
        checkedAt: new Date().toISOString()
      }
    }

    return {
      kind: "upstream",
      key: upstreamConfig.key,
      name: upstreamConfig.key,
      label: upstreamConfig.label,
      status: isNew ? "new" : changed ? "changed" : "unchanged",
      changed,
      details: {
        url: upstreamConfig.url,
        previousSha256,
        currentSha256
      }
    }
  } catch (error) {
    return {
      kind: "upstream",
      key: upstreamConfig.key,
      name: upstreamConfig.key,
      label: upstreamConfig.label,
      status: "error",
      changed: false,
      details: {
        url: upstreamConfig.url,
        error: error.message
      }
    }
  }
}

// Hash the spec file as it sits on disk (post-fix) and compare it to the
// recorded consumed checksum. This surfaces the gap between the raw upstream
// bytes (sha256) and the bytes codegen actually reads (consumedSha256).
function inspectConsumed(specKey, config, checksumData) {
  const outputPath = path.join(__dirname, "..", config.output)
  if (!fs.existsSync(outputPath)) return { exists: false, fixedBy: config.fixedBy }

  const onDiskSha = sha256(fs.readFileSync(outputPath))
  const recorded = checksumData.specs[specKey]?.consumedSha256
  return {
    exists: true,
    onDiskSha,
    recorded,
    recordedPresent: recorded != null,
    drift: recorded != null && recorded !== onDiskSha,
    fixedBy: config.fixedBy
  }
}

async function checkSpec(specKey, checksumData, changedParents = new Set()) {
  const config = SPEC_SOURCES[specKey]
  if (!config) {
    return {
      kind: "spec",
      name: specKey,
      status: "error",
      changed: false,
      details: { error: `Unknown spec key: ${specKey}` }
    }
  }

  if (config.manual) {
    const outputPath = path.join(__dirname, "..", config.output)
    const exists = fs.existsSync(outputPath)
    const localSha = exists ? sha256(fs.readFileSync(outputPath)) : null
    const trackedSha = checksumData.specs[specKey]?.sha256 ?? null
    const localDrift = exists && trackedSha != null && localSha !== trackedSha
    const parentSourceChanged = [
      ...(config.dependsOn ?? []),
      ...(config.dependsOnUpstreams ?? [])
    ].some((dependencyKey) => changedParents.has(dependencyKey))

    return {
      kind: "spec",
      name: specKey,
      key: specKey,
      status: exists
        ? parentSourceChanged
          ? "needs-regeneration"
          : localDrift
            ? "local-drift"
            : "manual"
        : "missing",
      changed: false,
      details: {
        output: config.output,
        note: config.note,
        localDrift,
        dependsOn: config.dependsOn ?? [],
        dependsOnUpstreams: config.dependsOnUpstreams ?? []
      }
    }
  }

  try {
    const content = await fetchText(config.url)
    // Hash the canonical form so non-deterministic upstream serializers don't
    // trigger false drift. Pairs with sync-specs.js writing canonical hashes.
    const currentSha = sha256(canonicalizeForHash(content))
    const trackedSha = checksumData.specs[specKey]?.sha256
    const changed = trackedSha != null && trackedSha !== currentSha
    const isNew = trackedSha == null

    return {
      kind: "spec",
      name: specKey,
      status: isNew ? "new" : changed ? "changed" : "unchanged",
      changed,
      details: {
        url: config.url,
        output: config.output,
        trackedSha256: trackedSha,
        currentSha256: currentSha,
        consumed: inspectConsumed(specKey, config, checksumData)
      }
    }
  } catch (error) {
    return {
      kind: "spec",
      name: specKey,
      status: "error",
      changed: false,
      details: {
        url: config.url,
        error: error.message
      }
    }
  }
}

function formatHash(hash) {
  return hash ? hash.slice(0, 12) : "n/a"
}

function printProviderReport(providerName, specResults, upstreamResults) {
  console.log(`\n${providerName}`)

  for (const result of specResults) {
    const d = result.details || {}

    if (result.status === "changed") {
      console.log(
        `  🔄 spec ${result.name}: ${formatHash(d.trackedSha256)} -> ${formatHash(d.currentSha256)}`
      )
    } else if (result.status === "new") {
      console.log(`  📌 spec ${result.name}: not yet tracked in specs/.checksums.json`)
    } else if (result.status === "manual") {
      console.log(`  ⏭️  spec ${result.name}: manual (${d.note})`)
    } else if (result.status === "needs-regeneration") {
      console.log(`  ⚠️  spec ${result.name}: input source changed, regeneration likely needed`)
    } else if (result.status === "local-drift") {
      console.log(`  ⚠️  spec ${result.name}: local file differs from tracked checksum`)
    } else if (result.status === "missing") {
      console.log(`  ⚠️  spec ${result.name}: missing local file ${d.output}`)
    } else if (result.status === "error") {
      console.log(`  ❌ spec ${result.name}: ${d.error}`)
    } else {
      console.log(`  ✅ spec ${result.name}: unchanged`)
    }

    // Consumed (post-fix) sub-line — what codegen actually reads from disk.
    const consumed = d.consumed
    if (consumed?.exists) {
      if (consumed.recordedPresent && consumed.drift) {
        console.log(
          `      ↳ consumed (post-fix) drift: ${formatHash(consumed.recorded)} -> ${formatHash(consumed.onDiskSha)}${consumed.fixedBy ? ` via ${consumed.fixedBy}` : ""}`
        )
      } else if (!consumed.recordedPresent && consumed.fixedBy) {
        console.log(
          `      ↳ consumed: not recorded (fixed by ${consumed.fixedBy}) — run pnpm openapi:record-consumed`
        )
      } else if (consumed.recordedPresent && consumed.fixedBy) {
        console.log(`      ↳ consumed: matches recorded post-fix (${consumed.fixedBy})`)
      }
    }
  }

  for (const result of upstreamResults) {
    const labelPrefix = result.kind === "sdk" ? "sdk" : "upstream"

    if (result.status === "changed") {
      if (result.kind === "sdk") {
        const versionChange =
          result.details.previousVersion &&
          result.details.previousVersion !== result.details.currentVersion
            ? `${result.details.previousVersion} -> ${result.details.currentVersion}`
            : `v${result.details.currentVersion}`
        const declChange =
          result.details.previousDeclarationSha256 && result.details.currentDeclarationSha256
            ? ` (${formatHash(result.details.previousDeclarationSha256)} -> ${formatHash(result.details.currentDeclarationSha256)})`
            : ""
        console.log(`  🔄 ${labelPrefix} ${result.name}: ${versionChange}${declChange}`)
      } else {
        console.log(
          `  🔄 ${labelPrefix} ${result.name}: ${formatHash(result.details.previousSha256)} -> ${formatHash(result.details.currentSha256)}`
        )
      }
      continue
    }

    if (result.status === "new") {
      if (result.kind === "sdk") {
        console.log(
          `  📌 ${labelPrefix} ${result.name}: tracking v${result.details.currentVersion}${result.details.sourceFiles?.length ? ` (${result.details.sourceFiles.join(", ")})` : ""}`
        )
      } else {
        console.log(`  📌 ${labelPrefix} ${result.name}: tracking ${result.details.url}`)
      }
      continue
    }

    if (result.status === "warning") {
      console.log(
        `  ⚠️  ${labelPrefix} ${result.name}: v${result.details.currentVersion} (${result.details.declarationError})`
      )
      continue
    }

    if (result.status === "error") {
      console.log(`  ❌ ${labelPrefix} ${result.name}: ${result.details.error}`)
      continue
    }

    if (result.kind === "sdk") {
      console.log(
        `  ✅ ${labelPrefix} ${result.name}: v${result.details.currentVersion}${result.details.sourceFiles?.length ? ` (${result.details.sourceFiles.join(", ")}, ${formatHash(result.details.currentDeclarationSha256)})` : ""}`
      )
    } else {
      console.log(`  ✅ ${labelPrefix} ${result.name}: unchanged`)
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  const providerIndex = args.indexOf("--provider")
  const specificProvider = providerIndex >= 0 ? args[providerIndex + 1] : null
  const write = args.includes("--write")

  const availableProviders = Object.keys(PROVIDERS)
  if (specificProvider && !PROVIDERS[specificProvider]) {
    console.error(`Unknown provider: ${specificProvider}`)
    console.error(`Available providers: ${availableProviders.join(", ")}`)
    process.exit(1)
  }

  const checksumData = loadChecksums()
  const providersToCheck = specificProvider ? [specificProvider] : availableProviders

  console.log(
    write
      ? "🔄 Checking provider updates and writing SDK baselines to specs/.checksums.json..."
      : "🔍 Checking provider updates..."
  )

  const summary = {
    changed: [],
    errors: [],
    warnings: [],
    tracked: []
  }

  for (const providerName of providersToCheck) {
    const config = PROVIDERS[providerName]
    const changedInputs = new Set()
    const upstreamResults = []

    for (const specKey of config.specKeys) {
      const specResult = await checkSpec(specKey, checksumData)
      if (specResult.status === "changed") {
        changedInputs.add(specKey)
      }
      upstreamResults.push(specResult)
    }

    for (const upstream of config.upstreams ?? []) {
      const result =
        upstream.type === "npm-package"
          ? await checkPackageUpstream(providerName, upstream, checksumData, write)
          : await checkRemoteUpstream(providerName, upstream, checksumData, write)
      upstreamResults.push(result)
      if (result.status === "changed") {
        changedInputs.add(upstream.key)
      }
    }

    const specResults = []
    const nonSpecResults = []

    for (const specKey of config.specKeys) {
      specResults.push(await checkSpec(specKey, checksumData, changedInputs))
    }

    for (const result of upstreamResults) {
      if (result.kind === "spec") continue
      nonSpecResults.push(result)
    }

    printProviderReport(providerName, specResults, nonSpecResults)

    const changed = [...specResults, ...nonSpecResults].some((result) => result.status === "changed")
    const warnings = [...specResults, ...nonSpecResults].some((result) =>
      ["warning", "local-drift", "missing", "needs-regeneration"].includes(result.status)
    )
    const errors = [...specResults, ...nonSpecResults].some((result) => result.status === "error")
    const newlyTracked = nonSpecResults.some((result) => result.status === "new")

    if (changed) summary.changed.push(providerName)
    if (warnings) summary.warnings.push(providerName)
    if (errors) summary.errors.push(providerName)
    if (newlyTracked) summary.tracked.push(providerName)
  }

  if (write) {
    saveChecksums(checksumData)
  }

  console.log("\nSummary")
  if (summary.changed.length > 0) {
    console.log(`  changed: ${summary.changed.join(", ")}`)
  }
  if (summary.warnings.length > 0) {
    console.log(`  warnings: ${summary.warnings.join(", ")}`)
  }
  if (summary.errors.length > 0) {
    console.log(`  errors: ${summary.errors.join(", ")}`)
  }
  if (summary.tracked.length > 0) {
    console.log(`  newly tracked SDKs: ${summary.tracked.join(", ")}`)
  }
  if (
    summary.changed.length === 0 &&
    summary.warnings.length === 0 &&
    summary.errors.length === 0 &&
    summary.tracked.length === 0
  ) {
    console.log("  all checked providers are unchanged")
  }

  if (summary.errors.length > 0) {
    process.exit(1)
  }
  if (summary.changed.length > 0) {
    process.exit(2)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
