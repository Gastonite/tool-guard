
import { type Extractable } from '~/extractable'
import { GlobPolicyEvaluator } from '~/globPolicyEvaluator'
import { type SimplePolicyDefinition } from '~/policy'
import { acceptAllSymbol } from '~/policyEvaluator'
import { type Predicate } from '~/types/Predicate'
import { parseStringPolicies } from '~/utilities/parseStringPolicies'
import { validateWithPolicies } from './factories/utilities/validateWithPolicies'
import { EXCLUDED_DOUBLE_QUOTE_CHARACTERS, isSafeQuotedCharacter } from './utilities/quoteCharacters'



/**
 * Greedy charset: all printable ASCII except dangerous shell metacharacters.
 * Excluded: $ ` < > ( ) & — see EXCLUDED_CHARACTERS below.
 * Composition metacharacters (&&, ||, |, ;) are handled upstream by splitComposedCommand.
 *
 * `&` and `\n` are blocked at extraction level (not split) to prevent injection bypass.
 * `&` is in EXCLUDED_CHARACTERS; `\n` is naturally outside printable ASCII (32–126).
 * Splitting either allowed bypasses: `git status &` backgrounded the process,
 * `git status\nrm -rf /` injected a second command.
 */
const GREEDY_CHARACTERS = new Set<string>()

const EXCLUDED_CHARACTERS = new Set([
  '$', // variable expansion ($HOME, ${}, $())
  '`', // command substitution
  '<', // input redirection, heredocs (<<, <<<)
  '>', // output redirection (>, >>)
  '(', // subshell execution
  ')', // subshell execution
  '&', // background execution
])

// Fill with all printable ASCII characters except dangerous ones
for (let code = 32; code <= 126; code++) {

  const character = String.fromCharCode(code)

  if (!EXCLUDED_CHARACTERS.has(character))
    GREEDY_CHARACTERS.add(character)
}

// Tab (newline deliberately excluded — it's a command separator in bash)
GREEDY_CHARACTERS.add('\t')

/**
 * Quote-aware greedy extraction state machine.
 *
 * Three modes:
 * - **Outside quotes**: consumes GREEDY_CHARACTERS (safe printable ASCII).
 * - **Double quotes**: consumes printable ASCII + tab + newline, except `$` and backtick
 *   which bash still interprets (variable expansion, command substitution).
 *   Backslash escape: `\"` = literal `"`, `\\` = literal `\`, any `\X` = literal X.
 * - **Single quotes**: all printable ASCII + tab + newline, no escape sequences —
 *   backslash is literal (bash behavior).
 *
 * Returns characters consumed, or `false` on failure (empty input or unclosed quote).
 */
const extractGreedy = (input: string): number | false => {

  let consumed = 0
  let quoteChar: string | undefined = undefined

  while (consumed < input.length) {

    const character = input[consumed]!

    if (quoteChar !== undefined) {

      // Closing quote
      if (character === quoteChar) {

        quoteChar = undefined
        consumed++
        continue
      }

      // Backslash escape inside double quotes: consume next char unconditionally
      if (quoteChar === '"' && character === '\\' && consumed + 1 < input.length) {

        consumed += 2
        continue
      }

      // Dangerous chars inside double quotes
      if (quoteChar === '"' && EXCLUDED_DOUBLE_QUOTE_CHARACTERS.has(character))
        break

      // Any printable ASCII inside quotes
      if (isSafeQuotedCharacter(character.charCodeAt(0))) {

        consumed++
        continue
      }

      break
    }

    // Opening quote
    if (character === '"' || character === `'`) {

      quoteChar = character
      consumed++
      continue
    }

    // Outside quotes: standard charset
    if (!GREEDY_CHARACTERS.has(character))
      break

    consumed++
  }

  // Unclosed quote: reject
  if (quoteChar !== undefined)
    return false

  return consumed === 0
    ? false
    : consumed
}

// Temporary: delegates to extractGreedy until Extractable/Validable distinction is improved.
// In command context, extractGreedy is called twice (pattern matching + validate). This will change.
// eslint-disable-next-line  import/no-unused-modules -- public API
export const isFullyExtractable: Predicate<string> = value => extractGreedy(value) === value.length

export type GreedyExtractable = (
  & Extractable
  & { readonly kind: 'GreedyExtractable' }
)

// eslint-disable-next-line  import/no-unused-modules -- public API
export const defaultGreedyExtractable: GreedyExtractable = {
  extract: extractGreedy,
  validate: value => (
    isFullyExtractable(value)
      ? acceptAllSymbol
      : undefined
  ),
  kind: 'GreedyExtractable' as const,
}

/**
 * Factory for greedy extractables with optional glob policies.
 *
 * Without policies: accepts any input passing quote-aware extraction.
 * With policies: validates extraction, then evaluates the raw value against glob patterns
 * via GlobPolicyEvaluator, which uses string matching (`matchGlobPattern`): `*` matches any
 * characters including `/`, and `*`/`**` are equivalent.
 */
export const Greedy = (...policies: Array<SimplePolicyDefinition<string>>): GreedyExtractable => {

  const parsedPolicies = parseStringPolicies(policies)

  if (parsedPolicies === undefined)
    return defaultGreedyExtractable

  const evaluator = GlobPolicyEvaluator(parsedPolicies)

  return {
    extract: extractGreedy,
    validate: value => validateWithPolicies(value, isFullyExtractable, evaluator),
    kind: 'GreedyExtractable' as const,
  }
}

export const greedy = Greedy()
