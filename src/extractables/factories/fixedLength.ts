import { type ExtractableFactory, type Extractable } from '~/extractable'
import { GlobPolicyEvaluator } from '~/globPolicyEvaluator'
import { acceptAllSymbol } from '~/policyEvaluator'
import { type Predicate } from '~/types/Predicate'
import { parseStringPolicies } from '~/utilities/parseStringPolicies'
import { validateWithPolicies } from './utilities/validateWithPolicies'



/**
 * Fixed-length factory-of-factory (e.g. commit hash 40 chars).
 * extract: consumes exactly N chars from the charset.
 * validate: security (predicate) + policies via PolicyEvaluator.
 */
export const FixedLengthExtractableFactory = (
  charset: Set<string>,
  length: number,
  predicate: Predicate<string>,
): ExtractableFactory => {

  const extract = (input: string): number | false => {

    if (input.length < length)
      return false

    for (let i = 0; i < length; i++)
      if (!charset.has(input[i]!))
        return false

    return length
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
