import { type ExtractableFactory, type Extractable } from '~/extractable'
import { GlobSimplePolicy } from '~/globPolicy'
import { acceptAllSymbol, MergedPolicy } from '~/policyEvaluator'
import { type Predicate } from '~/types/Predicate'
import { validateWithPolicies } from './utilities/validateWithPolicies'



/**
 * Factory-of-factory from a charset.
 * extract: scans chars from the charset (pure syntax).
 * validate: security (predicate) + policies (allow/deny via MergedPolicy).
 */
export const CharsetExtractableFactory = (
  charset: Set<string>,
  predicate: Predicate<string>,
): ExtractableFactory => {

  const extract = (input: string): number | false => {

    let consumed = 0

    while (consumed < input.length && charset.has(input[consumed]!))
      consumed++

    return consumed === 0
      ? false
      : consumed
  }

  const defaultExtractable: Extractable = {
    extract,
    validate: value => (
      predicate(value)
        ? acceptAllSymbol
        : undefined
    ),
  }

  return (...policies) => {

    if (policies.length === 0)
      return defaultExtractable

    const merged = MergedPolicy(
      ...policies.map(GlobSimplePolicy),
    )

    return {
      extract,
      validate: value => validateWithPolicies(value, predicate, merged),
    }
  }
}
