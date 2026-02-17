import { type ExtractableFactory, type Extractable } from '~/extractable'
import { GlobPolicyEvaluator } from '~/globPolicyEvaluator'
import { acceptAllSymbol } from '~/policyEvaluator'
import { type Predicate } from '~/types/Predicate'
import { parseStringPolicies } from '~/utilities/parseStringPolicies'
import { validateWithPolicies } from './utilities/validateWithPolicies'



/**
 * Factory-of-factory from a charset.
 * extract: scans chars from the charset (pure syntax).
 * validate: security (predicate) + policies (allow/deny via PolicyEvaluator).
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

    const parsedPolicies = parseStringPolicies(policies)
    if (parsedPolicies === undefined)
      return defaultExtractable

    const evaluator = GlobPolicyEvaluator(parsedPolicies)

    return {
      extract,
      validate: value => validateWithPolicies(value, predicate, evaluator),
    }
  }
}
