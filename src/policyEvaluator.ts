import { type MatchResult } from './types/MatchResult'
import { type Validable } from './validable'



// ─── ParsedPolicy ────────────────────────────────────────────────────────────

export type ParsedPolicy<TPattern> = {
  allow: Array<TPattern>
  deny: Array<TPattern>
}


// ─── EvaluateResult ──────────────────────────────────────────────────────────

export type EvaluateResult<TMatch, TFailure> = (
  | { outcome: 'globalDeny'; match: TMatch }
  | { outcome: 'scopedDeny'; match: TMatch }
  | { outcome: 'allowed'; match: TMatch }
  | { outcome: 'noMatch'; lastFailure?: TFailure }
)


// ─── acceptAll ───────────────────────────────────────────────────────────────

/** Special value returned by acceptAll — means "everything accepted without policy". */
export const acceptAllSymbol = Symbol('acceptAll')

/** Well-known Validable: accepts any value, returns acceptAllSymbol. */
export const acceptAll: Validable = { validate: () => acceptAllSymbol }


// ─── PolicyEvaluator ─────────────────────────────────────────────────────────

/**
 * Pure higher-order function for the deny/allow algorithm.
 *
 * Construction: receives policies + testMatch callback.
 * Separates globalDenies/scopedPolicies once.
 * Returns an evaluate(value) → EvaluateResult function.
 *
 * Algorithm:
 * 1. GlobalDenies FIRST (fast rejection)
 * 2. First-match on scopedPolicies:
 *    - allow match → check scoped deny → match → scopedDeny (HARD REJECT)
 *    - allow match → no deny → allowed
 *    - no allow match → continue (next policy)
 * 3. No match → noMatch (with optional lastFailure)
 */
export const PolicyEvaluator = <TPattern, TValue, TMatch, TFailure>(
  policies: Array<ParsedPolicy<TPattern>>,
  testMatch: (pattern: TPattern, value: TValue) => MatchResult<TMatch, TFailure>,
): (value: TValue) => EvaluateResult<TMatch, TFailure> => {

  const globalDenies = policies.filter(policy => policy.allow.length === 0)
  const scopedPolicies = policies.filter(policy => policy.allow.length > 0)

  return value => {

    // 1. GlobalDenies FIRST (fast rejection)
    for (const policy of globalDenies)
      for (const pattern of policy.deny) {

        const result = testMatch(pattern, value)

        if (result.matched)
          return { outcome: 'globalDeny', match: result.match }
      }

    // 2. First-match on scopedPolicies
    let lastFailure: TFailure | undefined

    for (const policy of scopedPolicies) {

      let allowMatch: TMatch | undefined

      for (const pattern of policy.allow) {

        const result = testMatch(pattern, value)

        if (result.matched) {

          allowMatch = result.match
          break
        }

        lastFailure = result.failure
      }

      if (allowMatch === undefined)
        continue

      // Allow matched — check scoped deny
      for (const pattern of policy.deny) {

        const result = testMatch(pattern, value)

        if (result.matched)
          return { outcome: 'scopedDeny', match: result.match }
      }

      return { outcome: 'allowed', match: allowMatch }
    }

    return { outcome: 'noMatch', lastFailure }
  }
}
