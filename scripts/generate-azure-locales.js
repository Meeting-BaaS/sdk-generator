#!/usr/bin/env node
/**
 * Generate Azure Speech-to-Text locale constants from Microsoft documentation
 *
 * Parses locale codes from the official Azure language support documentation.
 * The API requires authentication, so we parse the public documentation page.
 *
 * @see https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=stt
 *
 * Run: node scripts/generate-azure-locales.js
 */

const fs = require("fs")
const path = require("path")
const https = require("https")

const DOCS_URL =
  "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=stt"
const OUTPUT_PATH = path.join(__dirname, "../src/generated/azure/locales.ts")

// BCP-47 language names
const LANGUAGE_NAMES = {
  af: "Afrikaans",
  am: "Amharic",
  ar: "Arabic",
  as: "Assamese",
  az: "Azerbaijani",
  ba: "Bashkir",
  be: "Belarusian",
  bg: "Bulgarian",
  bn: "Bengali",
  bo: "Tibetan",
  bs: "Bosnian",
  ca: "Catalan",
  cs: "Czech",
  cy: "Welsh",
  da: "Danish",
  de: "German",
  el: "Greek",
  en: "English",
  es: "Spanish",
  et: "Estonian",
  eu: "Basque",
  fa: "Persian",
  fi: "Finnish",
  fil: "Filipino",
  fo: "Faroese",
  fr: "French",
  ga: "Irish",
  gl: "Galician",
  gu: "Gujarati",
  ha: "Hausa",
  he: "Hebrew",
  hi: "Hindi",
  hr: "Croatian",
  hu: "Hungarian",
  hy: "Armenian",
  id: "Indonesian",
  is: "Icelandic",
  it: "Italian",
  iu: "Inuktitut",
  ja: "Japanese",
  jv: "Javanese",
  ka: "Georgian",
  kk: "Kazakh",
  km: "Khmer",
  kn: "Kannada",
  ko: "Korean",
  lo: "Lao",
  lt: "Lithuanian",
  lv: "Latvian",
  mi: "Maori",
  mk: "Macedonian",
  ml: "Malayalam",
  mn: "Mongolian",
  mr: "Marathi",
  ms: "Malay",
  mt: "Maltese",
  my: "Burmese",
  nan: "Min Nan Chinese",
  nb: "Norwegian Bokmål",
  ne: "Nepali",
  nl: "Dutch",
  or: "Odia",
  pa: "Punjabi",
  pl: "Polish",
  ps: "Pashto",
  pt: "Portuguese",
  ro: "Romanian",
  ru: "Russian",
  si: "Sinhala",
  sk: "Slovak",
  sl: "Slovenian",
  so: "Somali",
  sq: "Albanian",
  sr: "Serbian",
  su: "Sundanese",
  sv: "Swedish",
  sw: "Swahili",
  ta: "Tamil",
  te: "Telugu",
  th: "Thai",
  tr: "Turkish",
  uk: "Ukrainian",
  ur: "Urdu",
  uz: "Uzbek",
  vi: "Vietnamese",
  wuu: "Wu Chinese",
  yue: "Cantonese",
  zh: "Chinese",
  zu: "Zulu",
  ans: "Anishinaabemowin",
  atn: "Atikamekw",
  non: "Norse"
}

const REGION_NAMES = {
  AF: "Afghanistan",
  AE: "UAE",
  AL: "Albania",
  AM: "Armenia",
  AR: "Argentina",
  AT: "Austria",
  AU: "Australia",
  AZ: "Azerbaijan",
  BA: "Bosnia",
  BD: "Bangladesh",
  BE: "Belgium",
  BG: "Bulgaria",
  BH: "Bahrain",
  BO: "Bolivia",
  BR: "Brazil",
  BY: "Belarus",
  CA: "Canada",
  CH: "Switzerland",
  CL: "Chile",
  CN: "China",
  CO: "Colombia",
  CR: "Costa Rica",
  CU: "Cuba",
  CZ: "Czechia",
  DE: "Germany",
  DK: "Denmark",
  DO: "Dominican Republic",
  DZ: "Algeria",
  EC: "Ecuador",
  EE: "Estonia",
  EG: "Egypt",
  ES: "Spain",
  FI: "Finland",
  FR: "France",
  GB: "United Kingdom",
  GE: "Georgia",
  GH: "Ghana",
  GQ: "Equatorial Guinea",
  GR: "Greece",
  GT: "Guatemala",
  HD: "Historical",
  HK: "Hong Kong",
  HN: "Honduras",
  HR: "Croatia",
  HU: "Hungary",
  ID: "Indonesia",
  IE: "Ireland",
  IL: "Israel",
  IN: "India",
  IQ: "Iraq",
  IR: "Iran",
  IS: "Iceland",
  IT: "Italy",
  JO: "Jordan",
  JP: "Japan",
  KE: "Kenya",
  KH: "Cambodia",
  KR: "Korea",
  KW: "Kuwait",
  KZ: "Kazakhstan",
  LA: "Latin",
  LB: "Lebanon",
  LK: "Sri Lanka",
  LT: "Lithuania",
  LV: "Latvia",
  LY: "Libya",
  MA: "Morocco",
  MK: "North Macedonia",
  MM: "Myanmar",
  MN: "Mongolia",
  MT: "Malta",
  MX: "Mexico",
  MY: "Malaysia",
  NG: "Nigeria",
  NI: "Nicaragua",
  NL: "Netherlands",
  NO: "Norway",
  NP: "Nepal",
  NZ: "New Zealand",
  OM: "Oman",
  PA: "Panama",
  PE: "Peru",
  PH: "Philippines",
  PK: "Pakistan",
  PL: "Poland",
  PR: "Puerto Rico",
  PS: "Palestine",
  PT: "Portugal",
  PY: "Paraguay",
  QA: "Qatar",
  RO: "Romania",
  RS: "Serbia",
  RU: "Russia",
  SA: "Saudi Arabia",
  SE: "Sweden",
  SG: "Singapore",
  SI: "Slovenia",
  SK: "Slovakia",
  SO: "Somalia",
  SV: "El Salvador",
  SY: "Syria",
  TH: "Thailand",
  TN: "Tunisia",
  TR: "Turkey",
  TW: "Taiwan",
  TZ: "Tanzania",
  UA: "Ukraine",
  US: "United States",
  UY: "Uruguay",
  UZ: "Uzbekistan",
  VE: "Venezuela",
  VN: "Vietnam",
  YE: "Yemen",
  ZA: "South Africa"
}

function getLocaleName(code) {
  const parts = code.split("-")
  const lang = parts[0]
  const region = parts[1]

  const langName = LANGUAGE_NAMES[lang] || lang
  const regionName = REGION_NAMES[region] || region

  return region ? `${langName} (${regionName})` : langName
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchUrl(res.headers.location).then(resolve).catch(reject)
          return
        }
        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () => resolve(data))
        res.on("error", reject)
      })
      .on("error", reject)
  })
}

async function main() {
  console.log("📦 Generating Azure Speech-to-Text locale constants from documentation...")
  console.log(`   Fetching: ${DOCS_URL}`)

  try {
    const html = await fetchUrl(DOCS_URL)

    // Extract BCP-47 locale codes (format: xx-XX or xxx-XX)
    const localePattern = /\b([a-z]{2,3}-[A-Z]{2})\b/g
    const matches = html.match(localePattern) || []

    // Dedupe and filter valid locales
    const uniqueLocales = [...new Set(matches)]
      .filter((code) => {
        // Filter out false positives (like CSS classes, etc.)
        const [lang, region] = code.split("-")
        return LANGUAGE_NAMES[lang] || lang.length === 2
      })
      .sort()

    console.log(`   Found ${uniqueLocales.length} unique locale codes`)

    if (uniqueLocales.length < 50) {
      throw new Error(`Expected at least 50 locales, found ${uniqueLocales.length}`)
    }

    const locales = uniqueLocales.map((code) => ({
      code,
      name: getLocaleName(code)
    }))

    // Generate TypeScript file
    const output = `/**
 * Generated from Azure Speech-to-Text documentation - DO NOT EDIT MANUALLY
 *
 * This file is auto-generated by scripts/generate-azure-locales.js
 * Run 'pnpm openapi:sync-azure-locales' to regenerate.
 *
 * BCP-47 locale tags for Azure Speech Services
 * @see https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
 *
 * @generated
 */

/**
 * Azure Speech-to-Text supported locale metadata
 */
export const AzureLocales = [
${locales.map((loc) => `  { code: "${loc.code}", name: "${loc.name}" }`).join(",\n")}
] as const

/**
 * Azure Speech-to-Text supported locale codes (BCP-47)
 */
export const AzureLocaleCodes = [
${locales.map((loc) => `  "${loc.code}"`).join(",\n")}
] as const

/**
 * Type for Azure locale codes
 */
export type AzureLocaleCode = (typeof AzureLocaleCodes)[number]

/**
 * Locale code to name mapping
 */
export const AzureLocaleLabels: Record<AzureLocaleCode, string> = {
${locales.map((loc) => `  "${loc.code}": "${loc.name}"`).join(",\n")}
} as const

/**
 * Azure locale constant object for autocomplete
 *
 * Note: Azure uses BCP-47 locale codes (e.g., "en-US", "pt-BR")
 * rather than simple ISO 639-1 codes.
 *
 * @example
 * \`\`\`typescript
 * import { AzureLocale } from 'voice-router-dev/constants'
 *
 * { locale: AzureLocale["en-US"] }
 * { locale: AzureLocale["pt-BR"] }
 * \`\`\`
 */
export const AzureLocale = {
${locales.map((loc) => `  "${loc.code}": "${loc.code}"`).join(",\n")}
} as const satisfies Record<string, AzureLocaleCode>
`

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_PATH)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    fs.writeFileSync(OUTPUT_PATH, output, "utf-8")
    console.log(`✅ Generated ${OUTPUT_PATH}`)
    console.log(`   - ${locales.length} locale codes`)
    console.log(
      `   - AzureLocales, AzureLocaleCodes, AzureLocaleCode, AzureLocaleLabels, AzureLocale`
    )
  } catch (error) {
    console.error(`❌ Failed to generate Azure locales: ${error.message}`)
    process.exit(1)
  }
}

main()
