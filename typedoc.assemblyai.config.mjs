/** @type {import('typedoc').TypeDocOptions} */
export default {
  // AssemblyAI Provider Documentation
  entryPoints: [
    "./src/adapters/assemblyai-adapter.ts"
  ],

  out: "./docs/generated/assemblyai",
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
    "**/src/adapters/gladia-adapter.ts",
    "**/src/adapters/deepgram-adapter.ts",
    "**/src/generated/gladia/**/*",
    "**/src/generated/deepgram/**/*"
  ],

  includeVersion: true,
  tsconfig: "./tsconfig.json",

  // Organization
  categorizeByGroup: true,
  defaultCategory: "AssemblyAI",

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

  name: "Voice Router SDK - AssemblyAI Provider",

  // Enhanced documentation options
  includeVersion: true,

  // TODO: Add external documents
  // projectDocuments: [
  //   "docs/guides/assemblyai-getting-started.md",
  //   "docs/guides/assemblyai-features.md",
  //   "docs/guides/assemblyai-best-practices.md"
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
