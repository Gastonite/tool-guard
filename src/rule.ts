import { matchesAnyPattern } from './matchers/matchers'
import { type Extractor } from './types/Extractor'
import { type NonEmptyArray } from './types/NonEmptyArray'
import { type RequireAtLeastOne } from './types/RequireAtLeastOne'
import { type Pattern } from './validation/rule'



/**
 * A rule definition for policy matching.
 * At least one property must be defined.
 * Missing properties default to `['*']` (match any).
 * `allow`/`deny` are forbidden to prevent mixing with structured format.
 */
export type RuleDefinition<TKeys extends string> = (
  & RequireAtLeastOne<Partial<Record<TKeys, Pattern>>>
  & { allow?: never; deny?: never }
)

/**
 * Rule input: wildcard or structured definition.
 */
export type RuleInput<TKeys extends string> = '*' | RuleDefinition<TKeys>


/**
 * A rule is a function that matches tool input against patterns.
 * - On success: returns last matched extractor and pattern
 * - On failure: returns first failed extractor and its value
 */
export type Rule<TKeys extends string> = (
  input: Record<string, unknown>,
) => ((
  | { extractor: Extractor<TKeys>; matches: true; pattern: string }
  | { extractor: Extractor<TKeys>; matches: false; value: string }
))


/**
 * Creates a Rule from input.
 *
 * @param input - RuleInput (wildcard or RuleDefinition)
 * @param extractors - Non-empty array of property names
 * @returns Rule function that matches tool input
 */
export const Rule = <TKeys extends string>(
  input: RuleInput<TKeys>,
  extractors: NonEmptyArray<Extractor<TKeys>>,
): Rule<TKeys> => {

  const _patterns = Object.fromEntries(
    extractors.map(
      input === '*'
        ? ({ name }) => [name, ['*']]
        : ({ name }) => [name, (
          input[name] === undefined
            ? ['*']
            : Array.isArray(input[name])
              ? input[name]
              : [input[name]]
        )],
    ),
  ) as Record<TKeys, Array<string>>

  return toolInput => {

    let lastExtractor: Extractor<TKeys> = extractors[0]
    let lastPattern = ''

    for (const extractor of extractors) {

      const value = String(toolInput[extractor.name] ?? '')

      const pattern = matchesAnyPattern(value, _patterns[extractor.name], extractor.type)
      if (!pattern)
        return {
          matches: false,
          extractor,
          value,
        }

      lastExtractor = extractor
      lastPattern = pattern
    }

    return {
      matches: true,
      extractor: lastExtractor,
      pattern: lastPattern,
    }
  }
}
