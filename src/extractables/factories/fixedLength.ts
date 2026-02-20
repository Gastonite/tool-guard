import { type ExtractableFactory, type Extractable } from '~/extractable'
import { GlobSimplePolicy } from '~/globPolicy'
import { acceptAllSymbol, MergedPolicy } from '~/policyEvaluator'
import { type Predicate } from '~/types/Predicate'
import { validateWithPolicies } from './utilities/validateWithPolicies'



/**
 * Fixed-length factory-of-factory (e.g. commit hash 40 chars).
 * extract: consumes exactly N chars from the charset.
 * validate: security (predicate) + policies via MergedPolicy.
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
