import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    webhooks: "src/webhooks/index.ts",
    constants: "src/constants.ts",
    "field-configs": "src/field-configs.ts",
    "provider-metadata": "src/provider-metadata.ts"
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  banner: {
    js: "#!/usr/bin/env node"
  }
})
