/** @type {import('typedoc').TypeDocOptions} */
export default {
  // Entry points - Client abstraction/bridge
  entryPoints: [
    "./src/node/client.ts",
    "./src/node/types.d.ts"
  ],

  out: "./docs/generated/client",
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

  // Exclude test files only
  exclude: [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/test/**/*",
    "**/examples/**/*"
  ],

  includeVersion: true,
  tsconfig: "./tsconfig.json",

  // Organization
  categorizeByGroup: true,
  defaultCategory: "Other",

  sort: ["kind", "required-first", "alphabetical"],
  sortEntryPoints: true,

  kindSortOrder: [
    "Function",
    "Interface",
    "TypeAlias",
    "Enum"
  ],

  // Keep readable - don't expand too deeply
  maxTypeConversionDepth: 4,

  hideGenerator: true,
  githubPages: false,

  name: "@meeting-baas/sdk - Client API & Bridge"
};
