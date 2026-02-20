import { z } from 'zod'
import { type Extractable } from './extractable'
import { type GreedyExtractable } from './extractables/greedy'
import { acceptAll, MergedPolicy, PolicyFactory } from './policyEvaluator'
import { type ValidableFactory } from './validable'



// ─── Types ──────────────────────────────────────────────────────────────────

export type CommandPattern = {
  readonly kind: 'CommandPattern'
  segments: ReadonlyArray<string>
  extractors: ReadonlyArray<Extractable>
}

export type SpreadExtractable = (
  & Extractable
  & { readonly kind: 'SpreadExtractable' }
)

type ExtractedToken = {
  extractor: Extractable
  value: string
}


// ─── Constants ──────────────────────────────────────────────────────────────

const COMPOSITION_OPERATORS = [
  '&&', // logical AND
  '||', // logical OR
  '|', // pipe
  ';', // sequential
]

const DANGEROUS_PATTERNS = [
  '$(', // command substitution
  '${', // variable expansion
  '`', // legacy command substitution
]


// ─── Helpers ────────────────────────────────────────────────────────────────

export const spread = (extractable: Extractable): SpreadExtractable => ({
  ...extractable,
  kind: 'SpreadExtractable' as const,
})

const isSpread = (extractable: Extractable): extractable is SpreadExtractable => (
  'kind' in extractable
  && (extractable as Record<string, unknown>).kind === 'SpreadExtractable'
)

const isGreedy = (extractable: Extractable): extractable is GreedyExtractable => (
  'kind' in extractable
  && (extractable as Record<string, unknown>).kind === 'GreedyExtractable'
)

export const isCommandPattern = (value: unknown): value is CommandPattern => (
  typeof value === 'object'
  && !!value
  && 'kind' in value
  && (value as Record<string, unknown>).kind === 'CommandPattern'
)

/**
 * Count consecutive backslashes immediately before `position` in `input`.
 * Used by splitComposedCommand to distinguish real quotes from escaped ones:
 * even count (0, 2, 4...) = real quote, odd count (1, 3...) = escaped quote.
 */
const countPrecedingBackslashes = (input: string, position: number): number => {

  let count = 0

  for (let j = position - 1; j >= 0 && input[j] === '\\'; j--)
    count++

  return count
}

// ─── Tagged template literal ────────────────────────────────────────────────

/**
 * Tagged template literal to create a CommandPattern.
 * Validates fixed segments: throws if composition operators or dangerous patterns detected.
 */
export const command = (
  strings: TemplateStringsArray,
  ...expressions: Array<Extractable>
): CommandPattern => {

  for (const segment of strings) {

    for (const operator of COMPOSITION_OPERATORS)
      if (segment.includes(operator))
        throw new Error(`Composition operator "${operator}" is not allowed in command segments. Split into separate command patterns.`)

    for (const pattern of DANGEROUS_PATTERNS)
      if (segment.includes(pattern))
        throw new Error(`Dangerous pattern "${pattern}" is not allowed in command segments.`)
  }

  return {
    kind: 'CommandPattern' as const,
    segments: [...strings],
    extractors: expressions,
  }
}


// ─── matchCommandPattern ────────────────────────────────────────────────────

/**
 * Tests whether an atomic command (no composition) matches a CommandPattern.
 * Phase 1: syntactic extraction (extract) with backtracking for spreads.
 * Phase 2: security validation + policies (validate) on extracted tokens.
 */
const matchCommandPattern = (pattern: CommandPattern, value: string): boolean => {

  const { segments, extractors } = pattern

  const matchSegment = (
    remaining: string,
    index: number,
    tokens: Array<ExtractedToken>,
  ): Array<ExtractedToken> | undefined => {

    const segment = segments[index]

    if (segment === undefined)
      return

    if (!remaining.startsWith(segment))
      return

    const afterSegment = remaining.slice(segment.length)

    if (index >= extractors.length)
      return afterSegment.length === 0
        ? tokens
        : undefined

    const extractor = extractors[index]!

    if (isGreedy(extractor))
      return matchGreedy(extractor, afterSegment, index, tokens)

    if (isSpread(extractor))
      return matchSpread(extractor, afterSegment, index, tokens)

    const consumed = extractor.extract(afterSegment)

    if (consumed === false)
      return

    return matchSegment(
      afterSegment.slice(consumed),
      index + 1,
      [...tokens, { extractor, value: afterSegment.slice(0, consumed) }],
    )
  }

  const matchSpread = (
    extractor: Extractable,
    remaining: string,
    index: number,
    tokens: Array<ExtractedToken>,
  ): Array<ExtractedToken> | undefined => {

    const consumed = extractor.extract(remaining)

    if (consumed === false || consumed === 0)
      return

    const afterToken = remaining.slice(consumed)
    const updatedTokens = [...tokens, { extractor, value: remaining.slice(0, consumed) }]

    const result = matchSegment(afterToken, index + 1, updatedTokens)

    if (result !== undefined)
      return result

    if (afterToken.length > 0 && afterToken[0] === ' ')
      return matchSpread(extractor, afterToken.slice(1), index, updatedTokens)

    return
  }

  const matchGreedy = (
    extractor: Extractable,
    remaining: string,
    index: number,
    tokens: Array<ExtractedToken>,
  ): Array<ExtractedToken> | undefined => {

    const consumed = extractor.extract(remaining)

    if (consumed === false)
      return

    for (let length = consumed; length >= 1; length--) {

      const result = matchSegment(
        remaining.slice(length),
        index + 1,
        [...tokens, { extractor, value: remaining.slice(0, length) }],
      )

      if (result !== undefined)
        return result
    }

    return
  }

  const tokens = matchSegment(value, 0, [])

  if (tokens === undefined)
    return false

  return tokens.every(({ extractor, value: tokenValue }) => extractor.validate(tokenValue) !== undefined)
}


// ─── splitComposedCommand ───────────────────────────────────────────────────

/**
 * Splits a composed command by &&, ||, |, ; (respecting quotes).
 * Each part is trimmed. Empty parts are excluded.
 *
 * Tracks `"`, `'`, and backtick quotes. Backtick tracking is defense-in-depth (SEC-H3):
 * backticks are rejected downstream by all extractors, but tracking them here prevents
 * incorrect splitting of operators inside command substitution (e.g. `` echo `cmd | other` ``).
 *
 * Double-quote detection uses `countPrecedingBackslashes` to correctly handle escaped
 * backslashes before quotes (SEC-M6): `\\"` has 2 backslashes (even) → real closing quote,
 * `\\\"` has 3 backslashes (odd) → escaped quote.
 */
export const splitComposedCommand = (input: string): Array<string> => {

  const parts: Array<string> = []
  let current = ''
  let quoteChar: string | undefined = undefined
  let i = 0

  while (i < input.length) {

    const character = input[i]!
    const nextTwo = input.slice(i, i + 2)

    if (character === '"' && quoteChar !== `'` && quoteChar !== '`' && countPrecedingBackslashes(input, i) % 2 === 0) {

      if (quoteChar === '"')
        quoteChar = undefined
      else
        quoteChar = '"'

      current += character
      i++
      continue
    }

    if (character === `'` && quoteChar !== '"' && quoteChar !== '`') {

      if (quoteChar === `'`)
        quoteChar = undefined
      else
        quoteChar = `'`

      current += character
      i++
      continue
    }

    // Backtick tracking for correct splitting (defense-in-depth, SEC-H3).
    // Backticks are rejected downstream by all extractors (EXCLUDED_CHARACTERS),
    // but tracking them prevents incorrect splitting of operators inside command substitution.
    if (character === '`' && quoteChar !== '"' && quoteChar !== `'`) {

      if (quoteChar === '`')
        quoteChar = undefined
      else
        quoteChar = '`'

      current += character
      i++
      continue
    }

    if (quoteChar !== undefined) {

      current += character
      i++
      continue
    }

    // Two-character operators: &&, ||
    if (nextTwo === '&&' || nextTwo === '||') {

      if (current.trim())
        parts.push(current.trim())

      current = ''
      i += 2
      continue
    }

    // Single-character operators: |, ;
    // & and \n are intentionally NOT split — blocked at extraction level instead.
    // Splitting allowed bypasses: `git status &` backgrounded, `git status\nrm` injected.
    if (character === '|' || character === ';') {

      if (current.trim())
        parts.push(current.trim())

      current = ''
      i++
      continue
    }

    current += character
    i++
  }

  if (current.trim())
    parts.push(current.trim())

  return parts
}


// ─── CommandValidable ───────────────────────────────────────────────────────

/** Zod schema for a single CommandPattern. */
export const commandPatternSchema = z.custom<CommandPattern>(isCommandPattern)

/** Suggestion for a command field that does not match. */
export const commandBuildSuggestion = (value: string): string => `Add a command pattern for '${value}' to allow.command`

/** Curried command matcher: `(pattern) => (value) => MatchResult`. */
const CommandMatcher = (pattern: CommandPattern) => (value: string) => (
  matchCommandPattern(pattern, value)
    ? { matched: true as const, match: `command\`${pattern.segments.join('...')}\`` }
    : { matched: false as const, failure: undefined }
)

/**
 * ValidableFactory for CommandPattern.
 * Receives policies (allow/deny of CommandPattern), returns a Validable
 * whose validate(value) calls matchCommandPattern. Matching-only, no validation.
 */
export const CommandValidable: ValidableFactory<CommandPattern, string> = (...policies) => {

  if (policies.length === 0)
    return acceptAll

  const merged = MergedPolicy(
    ...policies.map(PolicyFactory(CommandMatcher)),
  )

  return {
    validate: value => {

      const result = merged(value)

      return result.outcome === 'allowed'
        ? result.match
        : undefined
    },
  }
}
