import { type Extractable, type ExtractableFactory } from '~/extractable'
import { GlobSimplePolicy } from '~/globPolicy'
import { acceptAllSymbol, MergedPolicy } from '~/policyEvaluator'
import { type Predicate } from '~/types/Predicate'
import { EXCLUDED_DOUBLE_QUOTE_CHARACTERS, isSafeQuotedCharacter } from './utilities/quoteCharacters'



/**
 * Extracts a safe quoted string starting at position 0.
 *
 * Same quote-aware security model as greedy's extractGreedy:
 * - Double quotes: backslash escapes (`\"`, `\\`), rejects `$` and backtick (bash interprets them).
 * - Single quotes: everything is literal (bash behavior), no escape sequences.
 *
 * Returns total characters consumed (including surrounding quotes), or `false` on failure.
 */
// eslint-disable-next-line  import/no-unused-modules -- public API
export const extractSafeString = (input: string): number | false => {

  if (input.length < 2)
    return false

  const quoteChar = input[0]

  if (quoteChar !== '"' && quoteChar !== `'`)
    return false

  let consumed = 1

  while (consumed < input.length) {

    const character = input[consumed]!

    // Closing quote
    if (character === quoteChar)
      return consumed + 1

    // Backslash escape inside double quotes
    if (quoteChar === '"' && character === '\\' && consumed + 1 < input.length) {

      consumed += 2
      continue
    }

    // Dangerous chars inside double quotes
    if (quoteChar === '"' && EXCLUDED_DOUBLE_QUOTE_CHARACTERS.has(character))
      return false

    // Safe quoted character
    if (!isSafeQuotedCharacter(character.charCodeAt(0)))
      return false

    consumed++
  }

  // Unclosed quote
  return false
}

/**
 * Strips surrounding quotes from a validated string value.
 * Used before policy evaluation so `"hello world"` matches glob pattern `hello*`.
 */
const unquote = (value: string): string => {

  const quoted = (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith(`'`) && value.endsWith(`'`))

  if (quoted)
    return value.slice(1, -1)

  return value
}

// Temporary: delegates to extractSafeString (same pattern as greedy isFullyExtractable)
// eslint-disable-next-line  import/no-unused-modules -- public API
export const isFullyExtractableSafeString: Predicate<string> = value => (
  extractSafeString(value) === value.length
)

// eslint-disable-next-line  import/no-unused-modules -- public API
export const defaultSafeStringExtractable: Extractable = {
  extract: extractSafeString,
  validate: value => (
    isFullyExtractableSafeString(value)
      ? acceptAllSymbol
      : undefined
  ),
}

/**
 * Factory for quoted string extractables with optional glob policies.
 *
 * Without policies: accepts any safe quoted string.
 * With policies: validates extraction, then evaluates the **unquoted** content against
 * glob patterns — so `"hello world"` is matched as `hello world`.
 */
export const SafeString: ExtractableFactory = (...policies) => {

  if (policies.length === 0)
    return defaultSafeStringExtractable

  const merged = MergedPolicy(
    ...policies.map(GlobSimplePolicy),
  )

  return {
    extract: extractSafeString,
    validate: value => {

      if (!isFullyExtractableSafeString(value))
        return

      const result = merged(unquote(value))

      return result.outcome === 'allowed'
        ? result.match
        : undefined
    },
  }
}

export const safeString = SafeString()
