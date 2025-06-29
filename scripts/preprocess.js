const issues = []

function preprocess(obj, path = "") {
  if (obj && typeof obj === "object") {
    for (const key in obj) {
      const currentPath = path ? `${path}.${key}` : key

      // Fix additionalProperties
      if (key === "additionalProperties" && (obj[key] === true || obj[key] === false)) {
        issues.push(`Fixed additionalProperties boolean at ${currentPath}`)
        obj[key] = {}
      }
      // Fix boolean properties in schema properties (invalid OpenAPI)
      else if (typeof obj[key] === "boolean" && currentPath.includes("properties.")) {
        issues.push(`Fixed boolean property in schema at ${currentPath}: ${obj[key]} -> {}`)
        obj[key] = {}
      }
      // Fix items: true (invalid OpenAPI)
      else if (key === "items" && obj[key] === true) {
        issues.push(`Fixed items: true at ${currentPath} -> items: {}`)
        obj[key] = {}
      }
      // Fix tuple-style items arrays (not supported in OpenAPI 3.x)
      else if (key === "items" && Array.isArray(obj[key])) {
        issues.push(`Fixed tuple-style items array at ${currentPath} -> generic object schema`)
        obj[key] = {
          type: "object",
          additionalProperties: true
        }
      }
      // Log other boolean values for reference
      else if (typeof obj[key] === "boolean") {
        issues.push(`Boolean value at ${currentPath}: ${obj[key]}`)
      }

      preprocess(obj[key], currentPath)
    }
  }
}

/**
 * Transformer function for orval.
 * This function preprocesses the input schema to fix issues with the schema.
 *
 * @param {OpenAPIObject} inputSchema
 * @return {OpenAPIObject}
 */
module.exports = (inputSchema) => {
  preprocess(inputSchema)
  if (issues.length) {
    console.log("Issues found and/or fixed during preprocessing:")
    issues.forEach((i) => console.log(" -", i))
  } else {
    console.log("No issues found during preprocessing.")
  }
  return inputSchema
}
