/** @type {import('typedoc').TypeDocOptions} */
export default {
  // V1 API Documentation - Include methods AND types
  entryPoints: [
    "./src/node/v1-methods.ts",
    "./src/node/types.d.ts"
  ],

  out: "./docs/generated/v1",
  plugin: ["typedoc-plugin-markdown"],

  // Output settings
  outputFileStrategy: "modules",
  readme: "none",

  // Source settings
  disableSources: true,
  excludeExternals: true,
  excludePrivate: true,
  excludeProtected: true,
  excludeInternal: true,

  // Exclude test files and v2-specific types
  exclude: [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/test/**/*",
    "**/src/node/v2-methods.ts",
    "**/src/generated/v2/**/*"
  ],

  includeVersion: true,
  tsconfig: "./tsconfig.json",

  // Organization
  categorizeByGroup: true,
  defaultCategory: "Methods",

  sort: ["kind", "required-first", "alphabetical"],
  sortEntryPoints: true,

  kindSortOrder: [
    "Function",
    "Interface",
    "TypeAlias"
  ],

  // Limit depth for readability
  maxTypeConversionDepth: 4,

  hideGenerator: true,
  githubPages: false,

  name: "@meeting-baas/sdk - v1 API Reference"
};
