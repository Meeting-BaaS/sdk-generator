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
      // Only fix boolean values that are invalid, not valid boolean defaults
      else if (
        typeof obj[key] === "boolean" &&
        currentPath.includes("properties.") &&
        key !== "default"
      ) {
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
      // Stabilize the last_updated default in ListRecentBotsResponse
      else if (
        path.includes("ListRecentBotsResponse") &&
        path.includes("last_updated") &&
        key === "default" &&
        typeof obj[key] === "string" &&
        obj[key].includes("T")
      ) {
        // Replace dynamic timestamp default with a fixed reference timestamp.
        // This timestamp changes frequently and would cause unnecessary spam in the SDK versions.
        const originalTimestamp = obj[key]
        obj[key] = "2025-01-01T00:00:00.000000000+00:00"
        if (originalTimestamp !== obj[key]) {
          issues.push(
            `Stabilized ListRecentBotsResponse.last_updated default: ${originalTimestamp} -> ${obj[key]}`
          )
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
  // Clone to avoid mutating the original
  const schema = JSON.parse(JSON.stringify(inputSchema))
  preprocess(schema)
  if (issues.length) {
    console.log("Issues found and/or fixed during preprocessing:")
    issues.forEach((i) => console.log(" -", i))
  } else {
    console.log("No issues found during preprocessing.")
  }
  return schema
}
