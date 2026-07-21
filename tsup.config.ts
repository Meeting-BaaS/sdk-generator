import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    webhooks: "src/webhooks/index.ts",
    constants: "src/constants.ts",
    "field-configs": "src/field-configs.ts",
    "field-metadata": "src/field-metadata.ts",
    "field-equivalences": "src/field-equivalences.ts",
    "provider-metadata": "src/provider-metadata.ts"
  },
  format: ["cjs", "esm"],
  // tsup 8.5.1's bundled DTS plugin injects the deprecated baseUrl option.
  dts: {
    compilerOptions: {
      ignoreDeprecations: "6.0",
      types: ["node"]
    }
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  banner: {
    js: "#!/usr/bin/env node"
  }
})
