/**
 * Post-processing script for Orval-generated axios calls.
 *
 * 1. Orval emits `axios.post(url, undefined, options)` for endpoints with no
 *    request body. Axios still sets Content-Type: application/json on POST
 *    requests even when the body is undefined, causing Fastify to reject the
 *    request (empty body with JSON content-type). Replacing `undefined` with
 *    `{}` fixes this.
 *
 * 2. Orval emits `axios.delete(url, options)` for DELETE endpoints with no
 *    body. Axios can still send a Content-Type header, causing Fastify to
 *    reject the request with FST_ERR_CTP_EMPTY_JSON_BODY. We strip the
 *    Content-Type header by merging it into the options.
 */
const fs = require("node:fs")
const path = require("node:path")

const GENERATED_DIR = path.resolve(__dirname, "../src/generated")

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8")
  // Fix POST/PUT/PATCH with undefined body
  let fixed = content.replace(
    /axios\.(post|put|patch)\(([^,]+),\s*undefined\s*,/g,
    "axios.$1($2, {},"
  )
  // Fix DELETE with no body — strip Content-Type header
  // Matches: axios.delete(`url`, options)
  fixed = fixed.replace(
    /axios\.delete\(([^,]+),\s*options\s*\)/g,
    "axios.delete($1, { ...options, headers: { ...options?.headers, 'Content-Type': '' } })"
  )
  if (fixed !== content) {
    fs.writeFileSync(filePath, fixed, "utf-8")
    console.log(`Fixed: ${path.relative(process.cwd(), filePath)}`)
    return true
  }
  return false
}

function walkDir(dir) {
  let fixed = 0
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      fixed += walkDir(fullPath)
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".zod.ts")) {
      if (fixFile(fullPath)) fixed++
    }
  }
  return fixed
}

const count = walkDir(GENERATED_DIR)
console.log(`\nFixed ${count} file(s) with undefined body arguments.`)
