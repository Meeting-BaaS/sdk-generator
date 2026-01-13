#!/usr/bin/env node
/**
 * Fix Gladia OpenAPI spec for C# generation
 * Removes webhooks that don't have response types (causes OpenAPI Generator errors)
 */

const fs = require('fs');
const path = require('path');

const specPath = path.join(__dirname, '../specs/gladia-openapi.json');
const outputPath = path.join(__dirname, '../specs/gladia-openapi-csharp.json');

console.log('📝 Fixing Gladia spec for C# generation...');

const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

// Remove webhooks section entirely (they're for receiving callbacks, not client SDK)
if (spec.webhooks) {
  console.log(`  Removing ${Object.keys(spec.webhooks).length} webhook definitions`);
  delete spec.webhooks;
}

// Write fixed spec
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
console.log(`✅ Fixed spec written to ${outputPath}`);
