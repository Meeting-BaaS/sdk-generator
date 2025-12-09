/** @type {import('typedoc').TypeDocOptions} */
export default {
  // Webhook Normalization - Complete documentation
  entryPoints: [
    "./src/webhooks/index.ts",
    "./src/webhooks/types.ts",
    "./src/webhooks/webhook-router.ts",
    "./src/webhooks/base-webhook.ts",
    "./src/webhooks/gladia-webhook.ts",
    "./src/webhooks/assemblyai-webhook.ts",
    "./src/webhooks/deepgram-webhook.ts",
    "./src/webhooks/azure-webhook.ts"
  ],

  out: "./docs/generated/webhooks",
  plugin: ["typedoc-plugin-markdown"],

  // Output settings
  outputFileStrategy: "modules",
  readme: "none",

  // Source settings
  disableSources: true,
  excludeExternals: true,
  excludePrivate: false,  // Include private methods for debugging
  excludeProtected: false,
  excludeInternal: true,

  // Exclude test files
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
  defaultCategory: "Webhooks",

  sort: ["kind", "required-first", "alphabetical"],
  sortEntryPoints: true,

  kindSortOrder: [
    "Class",
    "Interface",
    "TypeAlias",
    "Function",
    "Enum"
  ],

  // Keep readable - don't expand too deeply
  maxTypeConversionDepth: 5,

  hideGenerator: true,
  githubPages: false,

  name: "Voice Router SDK - Webhook Normalization",

  // Enhanced documentation options
  includeVersion: true,

  // Better categorization
  groupOrder: [
    "Router",
    "Handlers",
    "Types",
    "Validation",
    "*"
  ],

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
};
