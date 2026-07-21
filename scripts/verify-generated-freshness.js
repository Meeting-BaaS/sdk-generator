#!/usr/bin/env node

const fs = require("node:fs")
const path = require("node:path")
const crypto = require("node:crypto")
const { spawnSync } = require("node:child_process")

const rootDir = path.resolve(__dirname, "..")
const targetPaths = [
  "specs",
  "src/generated",
  "src/constants.ts",
  "src/provider-metadata.ts",
  "src/field-configs.ts",
  "src/field-metadata.ts",
  "src/field-equivalences.ts",
  "docs/FIELD_EQUIVALENCES.md"
]

function usage() {
  console.log(`Usage: node scripts/verify-generated-freshness.js [--allow-dirty]

Runs pnpm openapi:generate and fails if committed specs, generated TypeScript
output, or generated/API-derived public metadata/docs would change. Use
--allow-dirty only when checking that generation is idempotent from an
already-dirty generated state.`)
}

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: rootDir,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"]
  })

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim()
    throw new Error(`git ${args.join(" ")} failed${output ? `:\n${output}` : ""}`)
  }

  return result.stdout
}

function runPnpm(args) {
  const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm"
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit"
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function sha256File(relativePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.join(rootDir, relativePath)))
    .digest("hex")
}

function untrackedSnapshot() {
  return runGit(["ls-files", "--others", "--exclude-standard", "--", ...targetPaths])
    .split(/\r?\n/)
    .filter(Boolean)
    .sort()
    .map((relativePath) => `${relativePath}\0${sha256File(relativePath)}`)
    .join("\n")
}

function trackedSnapshot() {
  return runGit(["ls-files", "--", ...targetPaths])
    .split(/\r?\n/)
    .filter(Boolean)
    .sort()
    .map((relativePath) => {
      const absolutePath = path.join(rootDir, relativePath)
      if (!fs.existsSync(absolutePath)) {
        return `${relativePath}\0<deleted>`
      }

      return `${relativePath}\0${sha256File(relativePath)}`
    })
    .join("\n")
}

function snapshot() {
  const tracked = trackedSnapshot()
  const status = statusText()
  const untracked = untrackedSnapshot()

  return {
    tracked,
    status,
    untracked,
    text: JSON.stringify({ tracked, status, untracked })
  }
}

function isClean(state) {
  return state.status === "(none)"
}

function statusText() {
  return runGit(["status", "--short", "--", ...targetPaths]).trim() || "(none)"
}

function main() {
  const args = process.argv.slice(2)
  const help = args.includes("--help") || args.includes("-h")
  const allowDirty = args.includes("--allow-dirty")
  const unknownArgs = args.filter(
    (arg) => arg !== "--help" && arg !== "-h" && arg !== "--allow-dirty"
  )

  if (help) {
    usage()
    return
  }

  if (unknownArgs.length > 0) {
    console.error(`Unknown argument(s): ${unknownArgs.join(", ")}`)
    usage()
    process.exit(1)
  }

  const before = snapshot()
  if (!allowDirty && !isClean(before)) {
    console.error("Generated API freshness check requires a clean generated/API-derived tree.")
    console.error("Current status:")
    console.error(statusText())
    console.error(
      "\nCommit or stash generated/spec changes first, or use --allow-dirty for idempotency checks."
    )
    process.exit(2)
  }

  runPnpm(["openapi:generate"])

  const after = snapshot()
  if (before.text !== after.text) {
    console.error("Generated API types/specs are stale.")
    console.error(
      "Run `pnpm openapi:generate` and commit the resulting specs/generated/public metadata changes."
    )
    console.error("Current status:")
    console.error(statusText())
    process.exit(2)
  }

  console.log("Generated API types/specs are up to date.")
}

main()
