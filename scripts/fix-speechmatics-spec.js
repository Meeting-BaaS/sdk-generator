#!/usr/bin/env node
/**
 * Automatically fix validation issues in Speechmatics OpenAPI spec
 * This script patches the spec to be compatible with Orval/OpenAPI generators
 */

const fs = require('fs');
const yaml = require('js-yaml');

const SPEC_PATH = './specs/speechmatics-batch.yaml';
const BACKUP_PATH = './specs/speechmatics-batch.yaml.backup';

console.log('🔧 Fixing Speechmatics OpenAPI spec validation issues...\n');

// Read the spec
const specContent = fs.readFileSync(SPEC_PATH, 'utf8');
const spec = yaml.parse(specContent);

let fixCount = 0;

// Fix 1: basePath must start with "/"
if (spec.basePath && !spec.basePath.startsWith('/')) {
  console.log('❌ Issue: basePath must start with "/"');
  console.log(`   Found: "${spec.basePath}"`);

  // Extract just the path portion
  const url = new URL(spec.basePath);
  spec.basePath = url.pathname;

  // Also set the host and schemes if not present
  if (!spec.host) {
    spec.host = url.host;
  }
  if (!spec.schemes || spec.schemes.length === 0) {
    spec.schemes = [url.protocol.replace(':', '')];
  }

  console.log(`   ✅ Fixed: basePath = "${spec.basePath}", host = "${spec.host}"`);
  fixCount++;
}

// Fix 2: Remove YAML anchors and merge keys (not supported by JSON Schema)
console.log('\n❌ Issue: YAML anchors/merge keys not supported');

function removeAnchorsAndMerges(obj, path = '') {
  if (typeof obj !== 'object' || obj === null) return;

  for (const key in obj) {
    if (key === '<<') {
      // This is a merge key - we need to inline it
      console.log(`   Found merge key at: ${path}/${key}`);
      delete obj[key];
      fixCount++;
    } else if (typeof obj[key] === 'object') {
      removeAnchorsAndMerges(obj[key], `${path}/${key}`);
    }
  }
}

removeAnchorsAndMerges(spec);
console.log('   ✅ Removed YAML merge keys');

// Fix 3: Fix invalid schema properties
console.log('\n❌ Issue: Invalid schema properties');

function fixSchemas(obj, path = '') {
  if (typeof obj !== 'object' || obj === null) return;

  // Fix confidence property (appears to be incorrectly defined)
  if (obj.confidence && typeof obj.confidence === 'object') {
    if (!obj.confidence.type && !obj.confidence.$ref) {
      console.log(`   Found invalid confidence property at: ${path}`);
      obj.confidence = {
        type: 'number',
        format: 'float',
        description: 'Confidence score'
      };
      fixCount++;
    }
  }

  // Recursively check nested objects
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      fixSchemas(obj[key], `${path}/${key}`);
    }
  }
}

if (spec.definitions) {
  fixSchemas(spec.definitions, '/definitions');
}
if (spec.paths) {
  fixSchemas(spec.paths, '/paths');
}

console.log('   ✅ Fixed invalid schema properties');

// Fix 4: Ensure all responses have proper structure
console.log('\n❌ Issue: Invalid response schemas');

if (spec.paths) {
  for (const [pathKey, pathObj] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathObj)) {
      if (typeof operation !== 'object' || !operation.responses) continue;

      for (const [statusCode, response] of Object.entries(operation.responses)) {
        if (response.schema && response.schema.type && response.schema.properties) {
          // Move complex schemas to definitions
          if (!response.schema.$ref) {
            const defName = `${operation.operationId || method}Response${statusCode}`;
            if (!spec.definitions) spec.definitions = {};
            spec.definitions[defName] = { ...response.schema };
            response.schema = { $ref: `#/definitions/${defName}` };
            console.log(`   Moved inline schema to definition: ${defName}`);
            fixCount++;
          }
        }
      }
    }
  }
}

console.log('   ✅ Fixed response schemas');

// Save backup
if (!fs.existsSync(BACKUP_PATH)) {
  fs.writeFileSync(BACKUP_PATH, specContent);
  console.log(`\n💾 Backup saved to: ${BACKUP_PATH}`);
}

// Write fixed spec
const fixedYaml = yaml.stringify(spec);
fs.writeFileSync(SPEC_PATH, fixedYaml);

console.log(`\n✅ Applied ${fixCount} fixes to Speechmatics spec`);
console.log(`📝 Fixed spec saved to: ${SPEC_PATH}\n`);
