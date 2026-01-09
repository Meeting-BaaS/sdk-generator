#!/usr/bin/env node

/**
 * Fix Deepgram OpenAPI Spec
 *
 * Handles duplicate parameter conflicts in the Deepgram OpenAPI spec.
 * The spec defines SpeakV1Container, SpeakV1Encoding, SpeakV1SampleRate
 * parameters multiple times with slightly different schemas, causing
 * Orval to generate duplicate type definitions.
 *
 * Solution: Remove the duplicate parameter definitions from components/parameters
 * and inline them into the path operations.
 */

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

const SPEC_PATH = path.join(__dirname, '..', 'specs', 'deepgram-openapi.yml')

// Parameter names without "Parameter" suffix (as they appear in the spec)
const CONFLICTING_PARAMS = [
  'SpeakV1Container',
  'SpeakV1Encoding',
  'SpeakV1SampleRate'
]

// Simple schema replacements for the complex oneOf structures
// These replace the problematic oneOf schemas that cause Orval to generate duplicates
const SIMPLE_SCHEMAS = {
  SpeakV1Container: {
    name: 'container',
    in: 'query',
    required: false,
    description: 'Container format for output audio',
    schema: { type: 'string', enum: ['none', 'wav', 'ogg'], default: 'wav' }
  },
  SpeakV1Encoding: {
    name: 'encoding',
    in: 'query',
    required: false,
    description: 'Audio encoding format',
    schema: { type: 'string', enum: ['linear16', 'aac', 'opus', 'mp3', 'flac', 'mulaw', 'alaw'], default: 'mp3' }
  },
  SpeakV1SampleRate: {
    name: 'sample_rate',
    in: 'query',
    required: false,
    description: 'Sample rate in Hz',
    schema: { type: 'integer', enum: [8000, 16000, 22050, 24000, 32000, 48000] }
  }
}

function main() {
  console.log('🔧 Fixing Deepgram OpenAPI spec duplicate parameters...\n')

  if (!fs.existsSync(SPEC_PATH)) {
    console.log('⚠️  Deepgram spec not found at', SPEC_PATH)
    console.log('   Run "pnpm openapi:sync" first')
    return
  }

  // Read the spec
  const content = fs.readFileSync(SPEC_PATH, 'utf-8')
  const spec = yaml.load(content)

  let simplifiedCount = 0
  let inlinedCount = 0

  // Replace complex oneOf schemas with simple enum schemas in components/parameters
  if (spec.components?.parameters) {
    for (const param of CONFLICTING_PARAMS) {
      if (spec.components.parameters[param]) {
        // Replace the complex oneOf schema with a simple schema
        spec.components.parameters[param] = SIMPLE_SCHEMAS[param]
        simplifiedCount++
        console.log('   ✅ Simplified components/parameters/' + param)
      }
    }
  }

  // Also inline parameters in paths that reference them (belt and suspenders)
  if (spec.paths) {
    for (const [pathKey, pathValue] of Object.entries(spec.paths)) {
      if (!pathValue || typeof pathValue !== 'object') continue

      for (const [method, operation] of Object.entries(pathValue)) {
        if (!operation?.parameters) continue

        operation.parameters = operation.parameters.map((param) => {
          if (param.$ref) {
            const refName = param.$ref.split('/').pop()
            if (CONFLICTING_PARAMS.includes(refName)) {
              inlinedCount++
              // Return simplified inline version
              return SIMPLE_SCHEMAS[refName]
            }
          }
          return param
        })
      }
    }
  }

  // Write the fixed spec back
  const fixedContent = yaml.dump(spec, {
    lineWidth: -1,  // Don't wrap lines
    noRefs: true,   // Don't use YAML anchors
    quotingType: '"',
    forceQuotes: false
  })

  fs.writeFileSync(SPEC_PATH, fixedContent, 'utf-8')

  console.log('\n✅ Fixed Deepgram spec:')
  console.log('   - Simplified ' + simplifiedCount + ' parameter schemas')
  console.log('   - Inlined ' + inlinedCount + ' parameter references')
  console.log('📝 Saved to: ' + SPEC_PATH)
}

main()
