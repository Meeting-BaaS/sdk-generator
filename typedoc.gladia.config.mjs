/** @type {import('typedoc').TypeDocOptions} */
export default {
  // Gladia Provider Documentation
  entryPoints: [
    "./src/adapters/gladia-adapter.ts"
  ],

  out: "./docs/generated/gladia",
  plugin: ["typedoc-plugin-markdown"],

  // Output settings
  outputFileStrategy: "modules",
  readme: "none",

  // Source settings
  disableSources: true,
  excludeExternals: true,
  excludePrivate: false,  // Show private methods for advanced users
  excludeProtected: false,
  excludeInternal: true,

  // Exclude test files and other providers
  exclude: [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/test/**/*",
    "**/examples/**/*",
    "**/src/adapters/assemblyai-adapter.ts",
    "**/src/adapters/deepgram-adapter.ts",
    "**/src/generated/assemblyai/**/*",
    "**/src/generated/deepgram/**/*"
  ],

  includeVersion: true,
  tsconfig: "./tsconfig.json",

  // Organization
  categorizeByGroup: true,
  defaultCategory: "Gladia",

  sort: ["kind", "required-first", "alphabetical"],
  sortEntryPoints: true,

  kindSortOrder: [
    "Class",
    "Interface",
    "TypeAlias",
    "Function",
    "Enum"
  ],

  // Keep readable
  maxTypeConversionDepth: 5,

  hideGenerator: true,
  githubPages: false,

  name: "Voice Router SDK - Gladia Provider",

  // Enhanced documentation options
  includeVersion: true,

  // TODO: Add external documents
  // projectDocuments: [
  //   "docs/guides/gladia-getting-started.md",
  //   "docs/guides/gladia-features.md",
  //   "docs/guides/gladia-best-practices.md"
  // ],

  // Better categorization
  groupOrder: [
    "Adapter",
    "Configuration",
    "Methods",
    "Types",
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

  // Include type hierarchy
  visibilityFilters: {
    protected: true,
    private: true,
    inherited: true,
    external: false
  }
};
