/** @type {import('typedoc').TypeDocOptions} */
export default {
  // Voice Router - Main API documentation (including webhooks)
  entryPoints: [
    "./src/router/voice-router.ts",
    "./src/router/types.ts",
    "./src/adapters/base-adapter.ts",
    "./src/webhooks/index.ts",
    "./src/webhooks/types.ts",
    "./src/webhooks/webhook-router.ts",
    "./src/webhooks/base-webhook.ts"
  ],

  out: "./docs/generated/router",
  plugin: ["typedoc-plugin-markdown"],

  // Output settings
  outputFileStrategy: "modules",
  readme: "none",

  // Source settings
  disableSources: true,
  excludeExternals: true,
  excludePrivate: false, // Include private methods for adapter developers
  excludeProtected: false,
  excludeInternal: true,

  // Exclude test files and generated provider types
  exclude: [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/test/**/*",
    "**/examples/**/*",
    "**/src/generated/**/*",
    "**/src/adapters/gladia-adapter.ts",
    "**/src/adapters/assemblyai-adapter.ts",
    "**/src/adapters/deepgram-adapter.ts"
  ],

  includeVersion: true,
  tsconfig: "./tsconfig.json",

  // Organization
  categorizeByGroup: true,
  defaultCategory: "Core",

  sort: ["kind", "required-first", "alphabetical"],
  sortEntryPoints: true,

  kindSortOrder: ["Class", "Interface", "TypeAlias", "Function", "Enum"],

  // Keep readable - don't expand too deeply
  maxTypeConversionDepth: 5,

  hideGenerator: true,
  githubPages: false,

  name: "Voice Router SDK - Core API",

  // Enhanced documentation options
  includeVersion: true,

  // TODO: Add external documents for comprehensive guides
  // projectDocuments: [
  //   "docs/guides/getting-started.md",
  //   "docs/guides/provider-selection.md",
  //   "docs/guides/error-handling.md",
  //   "docs/guides/creating-adapters.md"
  // ],

  // Better categorization
  groupOrder: ["Router", "Webhooks", "Configuration", "Types", "Adapters", "Responses", "*"],

  // Enhanced navigation
  navigation: {
    includeCategories: true,
    includeGroups: true,
    includeFolders: true
  },

  // Show parameter descriptions and examples
  parametersFormat: "table",
  enumMembersFormat: "table",

  // Include type hierarchy for better understanding
  visibilityFilters: {
    protected: true,
    private: true,
    inherited: true,
    external: false
  }
}
