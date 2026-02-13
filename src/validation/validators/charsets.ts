/** Allowed characters in file paths: alphanumeric, _, ., /, - */
const PATH_CHARACTERS = new Set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_./-')

/** Hexadecimal characters (lowercase only) */
const HEXADECIMAL_CHARACTERS = new Set('0123456789abcdef')

/** Numeric digits 0-9 */
const DIGIT_CHARACTERS = new Set('0123456789')

/** Allowed characters in safe strings: alphanumeric, whitespace, common punctuation */
const SAFE_STRING_CHARACTERS = new Set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 \t\n.,;:!?\'-_()/=+#@[]{}')

/**
 * Check if every character in value belongs to the allowed set (O(1) lookup per char).
 * @param value - String to validate
 * @param allowedCharacters - Set of allowed characters
 * @returns True if all characters are in the allowed set
 */
const containsOnlyCharactersFrom = (value: string, allowedCharacters: Set<string>): boolean => (
  [...value].every(character => allowedCharacters.has(character))
)

/** Check if string contains only valid path characters (a-z, A-Z, 0-9, _, ., /, -) */
export const isValidPathString = (value: string): boolean => (
  value.length > 0
  && containsOnlyCharactersFrom(value, PATH_CHARACTERS)
)

/** Check if string is a valid hexadecimal string with length constraints */
export const isHexadecimalString = (value: string, minimumLength: number, maximumLength: number): boolean => (
  value.length >= minimumLength
  && value.length <= maximumLength
  && containsOnlyCharactersFrom(value, HEXADECIMAL_CHARACTERS)
)

/** Check if string contains only digit characters (0-9) */
export const isDigitString = (value: string): boolean => (
  value.length > 0
  && containsOnlyCharactersFrom(value, DIGIT_CHARACTERS)
)

/** Check if string contains only safe content characters (no shell metacharacters) */
export const isSafeContentString = (value: string): boolean => (
  containsOnlyCharactersFrom(value, SAFE_STRING_CHARACTERS)
)
