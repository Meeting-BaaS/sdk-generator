/**
 * Deepgram OpenAPI Spec Transformer
 *
 * Handles duplicate parameter conflicts in the Deepgram OpenAPI spec.
 * The spec defines SpeakV1Container, SpeakV1Encoding, SpeakV1SampleRate
 * parameters multiple times with slightly different schemas, causing
 * Orval to generate duplicate type definitions.
 *
 * Solution: Inline these parameters directly into the path operations
 * and remove them from components/parameters to prevent duplicate generation.
 * Manual type files are restored after generation via fix-generated.js.
 *
 * @param {object} spec - The OpenAPI spec object
 * @returns {object} - The transformed spec
 */
module.exports = (spec) => {
  const conflictingParams = [
    "SpeakV1ContainerParameter",
    "SpeakV1EncodingParameter",
    "SpeakV1SampleRateParameter"
  ]

  console.log("🔧 Deepgram transformer: Removing conflicting parameters...")

  // Remove conflicting parameters from components
  if (spec.components?.parameters) {
    for (const param of conflictingParams) {
      if (spec.components.parameters[param]) {
        delete spec.components.parameters[param]
        console.log(`   ✅ Removed components/parameters/${param}`)
      }
    }
  }

  // Inline parameters in paths that reference them
  let inlinedCount = 0
  if (spec.paths) {
    for (const [pathKey, pathValue] of Object.entries(spec.paths)) {
      if (!pathValue || typeof pathValue !== 'object') continue

      for (const [method, operation] of Object.entries(pathValue)) {
        if (!operation?.parameters) continue

        operation.parameters = operation.parameters.map((param) => {
          if (param.$ref) {
            const refName = param.$ref.split('/').pop()
            if (conflictingParams.includes(refName)) {
              inlinedCount++
              // Inline the parameter based on its name
              if (refName === "SpeakV1ContainerParameter") {
                return {
                  name: "container",
                  in: "query",
                  schema: { type: "string", enum: ["none", "wav", "ogg"] }
                }
              }
              if (refName === "SpeakV1EncodingParameter") {
                return {
                  name: "encoding",
                  in: "query",
                  schema: { type: "string", enum: ["linear16", "aac", "opus", "mp3", "flac", "mulaw", "alaw"] }
                }
              }
              if (refName === "SpeakV1SampleRateParameter") {
                return {
                  name: "sample_rate",
                  in: "query",
                  schema: { type: "integer", enum: [8000, 16000, 22050, 24000, 32000, 48000] }
                }
              }
            }
          }
          return param
        })
      }
    }
  }

  console.log(`   ✅ Inlined ${inlinedCount} parameter references`)
  console.log("🔧 Deepgram transformer: Done!")

  return spec
}
