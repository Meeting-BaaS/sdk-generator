/** @type {import('typedoc').TypeDocOptions} */
export default {
  // V2 API Documentation - Include methods AND types
  entryPoints: [
    "./src/node/v2-methods.ts",
    "./src/node/types.d.ts"
  ],

  out: "./docs/generated/v2",
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

  // Exclude test files and v1-specific types
  exclude: [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/test/**/*",
    "**/src/node/v1-methods.ts",
    "**/src/generated/v1/**/*"
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

  name: "@meeting-baas/sdk - v2 API Reference",

  // Enhanced documentation options
  includeVersion: true,

  // Add external documents for comprehensive guides
  projectDocuments: [
    "docs/guides/v2-getting-started.md",
    "docs/guides/v2-error-handling.md",
    "docs/guides/v2-webhook-handling.md",
    "docs/guides/v2-best-practices.md"
  ],

  // Better categorization
  groupOrder: [
    "Bot Management",
    "Calendar Integration",
    "Webhook Types",
    "Request Types",
    "Response Types",
    "Validation Schemas",
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
    protected: false,
    private: false,
    inherited: true,
    external: false
  }
};
