/** @type {import('typedoc').TypeDocOptions} */
export default {
  // OpenAI Whisper Provider Documentation
  entryPoints: ["./src/adapters/openai-whisper-adapter.ts"],

  out: "./docs/generated/openai",
  plugin: ["typedoc-plugin-markdown"],

  // Output settings
  outputFileStrategy: "modules",
  readme: "none",

  // Source settings
  disableSources: true,
  excludeExternals: true,
  excludePrivate: false, // Show private methods for advanced users
  excludeProtected: false,
  excludeInternal: true,

  // Exclude test files and other providers
  exclude: [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/test/**/*",
    "**/examples/**/*",
    "**/src/adapters/gladia-adapter.ts",
    "**/src/adapters/assemblyai-adapter.ts",
    "**/src/adapters/deepgram-adapter.ts",
    "**/src/adapters/azure-stt-adapter.ts",
    "**/src/generated/**/*" // Exclude all generated types to avoid build errors
  ],

  includeVersion: true,
  tsconfig: "./tsconfig.json",

  // Organization
  categorizeByGroup: true,
  defaultCategory: "OpenAI Whisper",

  sort: ["kind", "required-first", "alphabetical"],
  sortEntryPoints: true,

  kindSortOrder: ["Class", "Interface", "TypeAlias", "Function", "Enum"],

  // Keep readable
  maxTypeConversionDepth: 5,

  hideGenerator: true,
  githubPages: false,

  name: "Voice Router SDK - OpenAI Whisper Provider",

  // Enhanced documentation options
  includeVersion: true,

  // Better categorization
  groupOrder: ["Adapter", "Configuration", "Methods", "Types", "*"],

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
}
