import { type EvaluateResult } from '~/policyEvaluator'
import { type Predicate } from '~/types/Predicate'



export const validateWithPolicies = (
  value: string,
  predicate: Predicate<string>,
  evaluator: (value: string) => EvaluateResult<string, undefined>,
): string | undefined => {

  if (!predicate(value))
    return undefined

  const result = evaluator(value)

  return result.outcome === 'allowed'
    ? result.match
    : undefined
}
