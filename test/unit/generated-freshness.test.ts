import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  OpenAIRealtimeModelCodes,
  OpenAITranscriptionModelCodes
} from "../../src/generated/openai/models"

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts: Record<string, string>
}

describe("generated API freshness scripts", () => {
  it("keeps generated OpenAI model sets non-empty", () => {
    expect(OpenAITranscriptionModelCodes.length).toBeGreaterThan(0)
    expect(OpenAIRealtimeModelCodes.length).toBeGreaterThan(0)
  })

  it("regenerates public metadata and field-equivalence artifacts after provider types", () => {
    const script = packageJson.scripts["openapi:generate"]
    const refreshScript = packageJson.scripts["openapi:refresh-public-metadata"]

    expect(refreshScript).toBe("pnpm docs:field-equivalences")
    expect(script).toContain("pnpm openapi:refresh-public-metadata")
    expect(script.indexOf("pnpm openapi:refresh-public-metadata")).toBeGreaterThan(
      script.lastIndexOf("pnpm openapi:fix")
    )
  })

  it("regenerates field metadata before field-equivalence docs consume it", () => {
    const script = packageJson.scripts["docs:field-equivalences"]
    const prepareScript = packageJson.scripts["docs:prepare-generated"]
    const rawScript = packageJson.scripts["docs:field-equivalences:raw"]

    expect(prepareScript).toBe("pnpm openapi:generate-field-metadata")
    expect(rawScript).toBe("node scripts/generate-field-equivalences.js")
    expect(script).toContain("pnpm docs:prepare-generated")
    expect(script).toContain("pnpm docs:field-equivalences:raw")
    expect(script.indexOf("pnpm docs:field-equivalences:raw")).toBeGreaterThan(
      script.indexOf("pnpm docs:prepare-generated")
    )
  })

  it("refreshes public metadata before full documentation generation", () => {
    const script = packageJson.scripts["docs:generate"]

    expect(script).toContain("pnpm docs:clean")
    expect(script).toContain("pnpm docs:prepare-generated")
    expect(script).toContain("pnpm docs:generate:router")
    expect(script.indexOf("pnpm docs:prepare-generated")).toBeGreaterThan(
      script.indexOf("pnpm docs:clean")
    )
    expect(script.indexOf("pnpm docs:generate:router")).toBeGreaterThan(
      script.indexOf("pnpm docs:prepare-generated")
    )
    expect(script.trim().endsWith("pnpm docs:field-equivalences:raw")).toBe(true)
  })

  it("refreshes public metadata after every provider-specific TypeScript generator", () => {
    const targetedGenerators = [
      "openapi:generate:gladia",
      "openapi:generate:assemblyai",
      "openapi:generate:deepgram",
      "openapi:generate:azure",
      "openapi:generate:openai",
      "openapi:generate:speechmatics",
      "openapi:generate:speechmatics-streaming",
      "openapi:generate:soniox",
      "openapi:generate:soniox-streaming",
      "openapi:generate:elevenlabs"
    ]

    for (const scriptName of targetedGenerators) {
      const script = packageJson.scripts[scriptName]

      expect(script, scriptName).toContain("pnpm openapi:refresh-public-metadata")
      expect(script.trim().endsWith("pnpm openapi:refresh-public-metadata"), scriptName).toBe(true)
    }
  })

  it("provides targeted TypeScript generators for every Orval-backed provider", () => {
    const expectedGenerators: Record<string, string[]> = {
      "openapi:generate:gladia": [
        "openapi:clean:gladia",
        "--project gladiaApi",
        "--project gladiaZod"
      ],
      "openapi:generate:assemblyai": [
        "openapi:clean:assemblyai",
        "--project assemblyaiApi",
        "--project assemblyaiZod"
      ],
      "openapi:generate:deepgram": [
        "openapi:clean:deepgram",
        "--project deepgramApi",
        "--project deepgramZod"
      ],
      "openapi:generate:azure": [
        "fix-azure-spec.js",
        "openapi:clean:azure",
        "--project azureSTTApi",
        "--project azureSTTZod",
        "pnpm openapi:sync-azure-locales"
      ],
      "openapi:generate:openai": [
        "openapi:clean:openai",
        "--project openaiWhisperApi",
        "--project openaiWhisperZod",
        "pnpm openapi:sync-openai-models"
      ],
      "openapi:generate:speechmatics": [
        "openapi:clean:speechmatics",
        "--project speechmaticsApi",
        "--project speechmaticsZod"
      ],
      "openapi:generate:soniox": [
        "openapi:clean:soniox",
        "--project sonioxApi",
        "--project sonioxZod"
      ],
      "openapi:generate:elevenlabs": [
        "openapi:clean:elevenlabs",
        "--project elevenlabsApi",
        "--project elevenlabsZod"
      ]
    }

    for (const [scriptName, expectedFragments] of Object.entries(expectedGenerators)) {
      const script = packageJson.scripts[scriptName]

      expect(script, scriptName).toBeTruthy()
      for (const expectedFragment of expectedFragments) {
        expect(script, `${scriptName} should include ${expectedFragment}`).toContain(
          expectedFragment
        )
      }
    }
  })

  it("refreshes public metadata after the build lifecycle syncs generated language and model constants", () => {
    const script = packageJson.scripts.prebuild

    expect(script).toContain("pnpm openapi:sync-deepgram-languages")
    expect(script).toContain("pnpm openapi:sync-elevenlabs-models")
    expect(script).toContain("pnpm openapi:refresh-public-metadata")
    expect(script.trim().endsWith("pnpm openapi:refresh-public-metadata")).toBe(true)
  })

  it("fails builds instead of silently reusing stale generated API types", () => {
    const script = packageJson.scripts["build:types"]

    expect(script).toContain("pnpm openapi:generate")
    expect(script).not.toContain("||")
    expect(script).not.toContain("Type generation skipped")
  })

  it("regenerates and checks generated API types during publish", () => {
    const script = packageJson.scripts.prepublishOnly

    expect(script).toContain("pnpm openapi:sync")
    expect(script).toContain("pnpm openapi:generate")
    expect(script).toContain("pnpm openapi:check-generated")
    expect(script.indexOf("pnpm openapi:generate")).toBeGreaterThan(
      script.indexOf("pnpm openapi:sync")
    )
    expect(script.indexOf("pnpm openapi:check-generated")).toBeGreaterThan(
      script.indexOf("pnpm openapi:generate")
    )
  })

  it("type-checks regenerated source before publish, CI, and auto-update commits", () => {
    const publishScript = packageJson.scripts.prepublishOnly
    const workflow = readFileSync(".github/workflows/test-sdk.yml", "utf8")
    const autoUpdateWorkflow = readFileSync(".github/workflows/auto-update.yml", "utf8")

    expect(packageJson.scripts.typecheck).toBe("tsc --noEmit --pretty false")
    expect(publishScript).toContain("pnpm typecheck")
    expect(publishScript.indexOf("pnpm typecheck")).toBeGreaterThan(
      publishScript.indexOf("pnpm openapi:check-generated")
    )

    expect(workflow).toContain("run: pnpm typecheck")
    expect(workflow.indexOf("run: pnpm typecheck")).toBeGreaterThan(
      workflow.indexOf("run: pnpm openapi:rebuild")
    )
    expect(workflow.indexOf("- name: Run tests")).toBeGreaterThan(
      workflow.indexOf("- name: Check source types")
    )

    expect(autoUpdateWorkflow).toContain("run: pnpm typecheck")
    expect(autoUpdateWorkflow.indexOf("run: pnpm typecheck")).toBeGreaterThan(
      autoUpdateWorkflow.indexOf("run: pnpm openapi:rebuild")
    )
    expect(autoUpdateWorkflow.indexOf("git add .")).toBeGreaterThan(
      autoUpdateWorkflow.indexOf("run: pnpm typecheck")
    )
  })

  it("checks regenerated auto-update output before committing and publishes without rerunning scripts", () => {
    const autoUpdateWorkflow = readFileSync(".github/workflows/auto-update.yml", "utf8")

    expect(autoUpdateWorkflow).toContain("run: pnpm openapi:check-generated")
    expect(autoUpdateWorkflow.indexOf("run: pnpm openapi:check-generated")).toBeGreaterThan(
      autoUpdateWorkflow.indexOf("run: pnpm openapi:rebuild")
    )
    expect(autoUpdateWorkflow.indexOf("git add .")).toBeGreaterThan(
      autoUpdateWorkflow.indexOf("run: pnpm openapi:check-generated")
    )

    expect(autoUpdateWorkflow).toContain("pnpm publish --access public --ignore-scripts")
    expect(
      autoUpdateWorkflow.indexOf("pnpm publish --access public --ignore-scripts")
    ).toBeGreaterThan(autoUpdateWorkflow.indexOf("git push origin main"))
  })

  it("regenerates auto-update output even when raw specs are unchanged", () => {
    const autoUpdateWorkflow = readFileSync(".github/workflows/auto-update.yml", "utf8")
    const regenerateStepStart = autoUpdateWorkflow.indexOf("- name: Regenerate SDK")
    const checkChangesStepStart = autoUpdateWorkflow.indexOf("- name: Check for actual changes")
    const regenerateStep = autoUpdateWorkflow.slice(regenerateStepStart, checkChangesStepStart)

    expect(regenerateStepStart).toBeGreaterThan(autoUpdateWorkflow.indexOf("pnpm openapi:sync"))
    expect(checkChangesStepStart).toBeGreaterThan(regenerateStepStart)
    expect(regenerateStep).toContain("pnpm openapi:generate && pnpm build")
    expect(regenerateStep).not.toContain("if: steps.sync-specs.outputs.has_spec_changes")
    expect(autoUpdateWorkflow).toMatch(
      /changed_providers: \$\{\{ steps\.check-changes\.outputs\.changed_providers \|\| steps\.sync-specs\.outputs\.changed_providers \}\}/
    )
    expect(autoUpdateWorkflow).toMatch(
      /echo "changed_providers=\$\{CHANGED_PROVIDERS:-unknown\}" >> \$GITHUB_OUTPUT/
    )
  })

  it("checks lint without mutating source before publish and auto-update commits", () => {
    const publishScript = packageJson.scripts.prepublishOnly
    const autoUpdateWorkflow = readFileSync(".github/workflows/auto-update.yml", "utf8")

    expect(publishScript).toContain("pnpm lint")
    expect(publishScript).not.toContain("pnpm lint:fix")
    expect(publishScript.indexOf("pnpm lint")).toBeGreaterThan(
      publishScript.indexOf("pnpm openapi:check-generated")
    )
    expect(publishScript.indexOf("pnpm typecheck")).toBeGreaterThan(
      publishScript.indexOf("pnpm lint")
    )

    expect(autoUpdateWorkflow).toContain("run: pnpm lint")
    expect(autoUpdateWorkflow.indexOf("run: pnpm lint")).toBeGreaterThan(
      autoUpdateWorkflow.indexOf("run: pnpm openapi:rebuild")
    )
    expect(autoUpdateWorkflow.indexOf("git add .")).toBeGreaterThan(
      autoUpdateWorkflow.indexOf("run: pnpm lint")
    )
  })

  it("checks built package entrypoints before publish, CI, and auto-update commits", () => {
    const publishScript = packageJson.scripts.prepublishOnly
    const workflow = readFileSync(".github/workflows/test-sdk.yml", "utf8")
    const autoUpdateWorkflow = readFileSync(".github/workflows/auto-update.yml", "utf8")

    expect(packageJson.scripts["test:entrypoints"]).toBe(
      "node scripts/verify-package-entrypoints.js"
    )
    expect(publishScript).toContain("pnpm test:entrypoints")
    expect(publishScript.indexOf("pnpm test:entrypoints")).toBeGreaterThan(
      publishScript.indexOf("pnpm build")
    )

    expect(workflow).toContain("run: pnpm test:entrypoints")
    expect(workflow.indexOf("run: pnpm test:entrypoints")).toBeGreaterThan(
      workflow.indexOf("run: pnpm openapi:rebuild")
    )
    expect(workflow.indexOf("- name: Run tests")).toBeGreaterThan(
      workflow.indexOf("- name: Check package entrypoints")
    )

    expect(autoUpdateWorkflow).toContain("run: pnpm test:entrypoints")
    expect(autoUpdateWorkflow.indexOf("run: pnpm test:entrypoints")).toBeGreaterThan(
      autoUpdateWorkflow.indexOf("run: pnpm openapi:rebuild")
    )
    expect(autoUpdateWorkflow.indexOf("git add .")).toBeGreaterThan(
      autoUpdateWorkflow.indexOf("run: pnpm test:entrypoints")
    )
  })

  it("checks public generated metadata and field-equivalence artifacts for freshness", () => {
    const source = readFileSync("scripts/verify-generated-freshness.js", "utf8")

    expect(source).toContain('"src/constants.ts"')
    expect(source).toContain('"src/provider-metadata.ts"')
    expect(source).toContain('"src/field-configs.ts"')
    expect(source).toContain('"src/field-metadata.ts"')
    expect(source).toContain('"src/field-equivalences.ts"')
    expect(source).toContain('"docs/FIELD_EQUIVALENCES.md"')
  })

  it("generates field metadata from source constants instead of stale build output", () => {
    const source = readFileSync("scripts/generate-field-metadata.js", "utf8")

    expect(source).toContain("loadStringValuesFromSource")
    expect(source).toContain('require("./src/field-configs.ts")')
    expect(source).not.toContain("dist/constants.js")
    expect(source).not.toContain("dist/field-configs.js")
    expect(source).not.toContain("build:quick")
  })

  it("normalizes targeted OpenAI zod generation to match full generation", () => {
    const packageScript = packageJson.scripts["openapi:generate:openai"]
    const fixerSource = readFileSync("scripts/fix-generated.js", "utf8")
    const specFixerSource = readFileSync("scripts/fix-openai-spec.js", "utf8")

    expect(packageScript).toContain("pnpm openapi:sync-openai-models")
    expect(packageScript.indexOf("pnpm openapi:fix")).toBeGreaterThan(
      packageScript.indexOf("pnpm openapi:sync-openai-models")
    )
    expect(fixerSource).toContain("fixOpenAIRealtimeResponseModalities")
    expect(fixerSource).toContain("Normalized OpenAI realtime response modalities")
    expect(specFixerSource).toContain("fixInvalidSchemaDefaults")
    expect(specFixerSource).toContain("Marked null default as nullable")
  })

  it("normalizes Orval boolean aliases to Zod's public API", () => {
    const fixerSource = readFileSync("scripts/fix-generated.js", "utf8")

    expect(fixerSource).toContain("fixZodBooleanAliases")
    expect(fixerSource).toContain("zod.boolean()")
  })

  it("repairs malformed AssemblyAI speech-understanding schemas", () => {
    const specFixerSource = readFileSync("scripts/fix-assemblyai-spec.js", "utf8")
    const summarizationSource = readFileSync(
      "src/generated/assemblyai/schema/summarizationRequestBody.ts",
      "utf8"
    )
    const actionItemsSource = readFileSync(
      "src/generated/assemblyai/schema/actionItemsRequestBodyActionItems.ts",
      "utf8"
    )

    expect(specFixerSource).toContain("fixMalformedSpeechUnderstandingSchemas")
    expect(summarizationSource).toContain("summarization:")
    expect(summarizationSource).not.toContain("summariazation")
    expect(actionItemsSource).toContain("include_decisions?: boolean")
  })

  it("preserves Orval 7 generated imports after Orval 8 regeneration", () => {
    const fixerSource = readFileSync("scripts/fix-generated.js", "utf8")

    expect(fixerSource).toContain("fixLegacyZodExportAliases")
    expect(fixerSource).toContain("restoreGeneratedCompatibilityFiles")
    expect(fixerSource).toContain("createTranscriptionRequestModel.ts")
    expect(fixerSource).toContain("speechToText200.ts")
    expect(fixerSource).toContain("listTranscriptionResponseItemsItem.ts")
  })
})
