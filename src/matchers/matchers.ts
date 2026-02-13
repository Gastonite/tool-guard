import { type ExtractorType } from '../types/Extractor'
import { getValidator, type ValidatorName } from '../validation/validators/validators'
import { matchGlob } from './matchGlob'
import { matchPathGlob } from './matchPathGlob'



/**
 * Metadata about a placeholder type.
 * Used for parsing and validating placeholder patterns.
 */
export type PlaceholderType = {

  /** Validator name to use for this placeholder */
  name: ValidatorName

  /** Whether this is a spread placeholder (...SAFE_*) */
  spread: boolean

  /** Fixed character length (e.g., 40 for SAFE_COMMIT_HASH) */
  fixedLength?: number

  /** Whether value must be quoted (e.g., SAFE_STRING) */
  quoted?: boolean
}

/**
 * A placeholder found in a pattern, with its position.
 * Used when parsing patterns with multiple placeholders.
 */
export type ExtractedPlaceholder = {

  /** The full placeholder pattern (e.g., "SAFE_FILE_PATH") */
  pattern: string

  /** Metadata about the placeholder type */
  type: PlaceholderType

  /** Character index where placeholder starts in the pattern */
  index: number
}

/**
 * Registry of all supported SAFE_* placeholder types.
 * Maps placeholder pattern to its metadata.
 */
const PLACEHOLDER_TYPES: Record<string, PlaceholderType> = {
  '...SAFE_EXTERNAL_FILE_PATH': { name: 'SAFE_EXTERNAL_FILE_PATH', spread: true },
  '...SAFE_FILE_PATH': { name: 'SAFE_FILE_PATH', spread: true },
  '...SAFE_INTERNAL_FILE_PATH': { name: 'SAFE_INTERNAL_FILE_PATH', spread: true },
  SAFE_BRANCH: { name: 'SAFE_BRANCH', spread: false },
  SAFE_COMMIT_HASH: { name: 'SAFE_COMMIT_HASH', spread: false, fixedLength: 40 },
  SAFE_EXTERNAL_FILE_PATH: { name: 'SAFE_EXTERNAL_FILE_PATH', spread: false },
  SAFE_FILE_PATH: { name: 'SAFE_FILE_PATH', spread: false },
  SAFE_INTERNAL_FILE_PATH: { name: 'SAFE_INTERNAL_FILE_PATH', spread: false },
  SAFE_NUMBER: { name: 'SAFE_NUMBER', spread: false },
  SAFE_PACKAGE: { name: 'SAFE_PACKAGE', spread: false },
  SAFE_SHORT_HASH: { name: 'SAFE_SHORT_HASH', spread: false },
  SAFE_STRING: { name: 'SAFE_STRING', spread: false, quoted: true },
  SAFE_URL: { name: 'SAFE_URL', spread: false },
}

/**
 * Placeholder patterns sorted by length (longest first).
 * Ensures spread patterns (...SAFE_*) match before their non-spread variants.
 */
const PLACEHOLDER_PATTERNS = Object.keys(PLACEHOLDER_TYPES)
  .sort((a, b) => b.length - a.length)

/**
 * Extract all placeholders from a pattern in order of appearance
 */
const extractAllPlaceholders = (pattern: string): Array<ExtractedPlaceholder> => {

  const placeholders: Array<ExtractedPlaceholder> = []
  let searchStart = 0

  while (searchStart < pattern.length) {

    // Find the placeholder that appears first in the remaining pattern
    let firstMatch: ExtractedPlaceholder | undefined

    for (const placeholder of PLACEHOLDER_PATTERNS) {

      const foundIndex = pattern.indexOf(placeholder, searchStart)
      const type = PLACEHOLDER_TYPES[placeholder]!

      if (foundIndex !== -1 && (!firstMatch || foundIndex < firstMatch.index))
        firstMatch = {
          pattern: placeholder,
          type,
          index: foundIndex,
        }
    }

    if (!firstMatch)
      break

    placeholders.push(firstMatch)
    searchStart = firstMatch.index + firstMatch.pattern.length
  }

  return placeholders
}

/**
 * Match a pattern against a value.
 *
 * Supports:
 * - Glob patterns with * wildcard
 * - SAFE_* placeholders for secure value validation
 * - Spread operator (...SAFE_FILE_PATH) for multiple values
 * - Mixed placeholder types (e.g., "git commit -m SAFE_STRING -- SAFE_FILE_PATH")
 *
 * Falls back to glob matching if no SAFE_* placeholders are present.
 */
export const matchPattern = (
  pattern: string,
  value: string,
  extractorType?: ExtractorType,
): boolean => {

  if (extractorType)
    return matchPathGlob(pattern, value, extractorType)

  const placeholders = extractAllPlaceholders(pattern)

  if (placeholders.length === 0)
    return matchGlob(pattern, value)

  let patternPos = 0
  let valuePos = 0

  for (let i = 0; i < placeholders.length; i++) {

    const placeholder = placeholders[i]
    if (!placeholder)
      continue // TypeScript safety

    // Match fixed segment before this placeholder
    const fixedSegment = pattern.slice(patternPos, placeholder.index)
    if (fixedSegment) {

      if (!value.startsWith(fixedSegment, valuePos))
        return false
      valuePos += fixedSegment.length
    }

    // Determine where placeholder value ends
    const nextPatternPos = placeholder.index + placeholder.pattern.length
    const nextPh = placeholders[i + 1]
    const nextFixedSegment = nextPh
      ? pattern.slice(nextPatternPos, nextPh.index)
      : pattern.slice(nextPatternPos)

    // Extract placeholder value based on type
    let extractedValue: string
    let newValuePos: number

    if (placeholder.type.fixedLength) {

      // Fixed length (SAFE_COMMIT_HASH: 40 chars)
      extractedValue = value.slice(valuePos, valuePos + placeholder.type.fixedLength)
      newValuePos = valuePos + placeholder.type.fixedLength
    } else if (placeholder.type.quoted) {

      // Quoted string (SAFE_STRING)
      if (value[valuePos] !== '"')
        return false
      const closingQuote = value.indexOf('"', valuePos + 1)
      if (closingQuote === -1)
        return false
      extractedValue = value.slice(valuePos, closingQuote + 1)
      newValuePos = closingQuote + 1
    } else if (nextFixedSegment) {

      // Find where next fixed segment starts
      const nextSegmentPos = value.indexOf(nextFixedSegment, valuePos)
      if (nextSegmentPos === -1)
        return false
      extractedValue = value.slice(valuePos, nextSegmentPos)
      newValuePos = nextSegmentPos
    } else {

      // Last placeholder: take everything remaining
      extractedValue = value.slice(valuePos)
      newValuePos = value.length
    }

    if (!extractedValue)
      return false

    // Validate extracted value
    const validator = getValidator(placeholder.type.name)
    if (!validator)
      return false

    if (placeholder.type.spread) {

      // Spread: validate each space-separated value
      const parts = extractedValue.split(' ')
      if (!parts.every(validator))
        return false
    } else {

      if (!validator(extractedValue))
        return false
    }

    valuePos = newValuePos
    patternPos = nextPatternPos
  }

  // Match remaining fixed segment after last placeholder
  const remainingPattern = pattern.slice(patternPos)
  const remainingValue = value.slice(valuePos)

  return remainingPattern === remainingValue
}

/**
 * Check if value matches any pattern in the list.
 */
export const matchesAnyPattern = (
  value: string,
  patterns: Array<string>,
  extractorType?: ExtractorType,
): string | undefined => (
  patterns.find(pattern => matchPattern(pattern, value, extractorType))
)
