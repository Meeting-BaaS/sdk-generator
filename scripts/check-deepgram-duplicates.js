const fs = require("fs")
const yaml = require("js-yaml")

const spec = yaml.load(fs.readFileSync("specs/deepgram-openapi.yml", "utf8"))

const schemas = Object.keys(spec.components.schemas || {})
const parameters = Object.keys(spec.components.parameters || {})

console.log("Total schemas:", schemas.length)
console.log("Total parameters:", parameters.length)

// Find SpeakV1 items
const speakSchemas = schemas.filter((k) => k.startsWith("SpeakV1"))
const speakParams = parameters.filter((k) => k.startsWith("SpeakV1"))

console.log("\nSpeakV1 schemas:", speakSchemas)
console.log("SpeakV1 parameters:", speakParams)

// Check for overlap
const overlap = speakSchemas.filter((s) => speakParams.includes(s))
if (overlap.length > 0) {
  console.log("\n🛑 FOUND DUPLICATES (same name in both schemas and parameters):")
  overlap.forEach((d) => console.log("  -", d))
} else {
  console.log("\n✅ No overlap between schemas and parameters")
}
