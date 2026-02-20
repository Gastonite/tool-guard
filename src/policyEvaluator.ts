import { type MatchResult } from './types/MatchResult'
import { type Validable } from './validable'
import { stringPolicyDefinitionSchema } from './validation/policy'



// ─── PolicyResult ───────────────────────────────────────────────────────────

export type PolicyResult<TMatch, TFailure> = (
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


// ─── PolicyFactory ──────────────────────────────────────────────────────────

/**
 * Factory-of-factory: takes a curried Matcher and returns a factory
 * that creates per-policy evaluation functions.
 *
 * Matcher: `(pattern) => (value) => MatchResult`
 * Factory: `({ allow?, deny? }) => (value) => PolicyResult`
 *
 * Per-policy logic:
 * - Deny-only (no allow) → globalDeny on first match, noMatch otherwise
 * - Allow+deny → try allow first, then scoped deny, then allowed
 * - No match → noMatch with optional lastFailure
 */
export const PolicyFactory = <TPattern, TValue, TMatch, TFailure>(
  Matcher: (pattern: TPattern) => (value: TValue) => MatchResult<TMatch, TFailure>,
) => (
  policy: { allow?: Array<TPattern>; deny?: Array<TPattern> },
): (value: TValue) => PolicyResult<TMatch, TFailure> => {

  const allowMatchers = (policy.allow ?? []).map(Matcher)
  const denyMatchers = (policy.deny ?? []).map(Matcher)

  return value => {

    // Deny-only → globalDeny
    if (allowMatchers.length === 0) {

      for (const matcher of denyMatchers) {

        const result = matcher(value)

        if (result.matched)
          return { outcome: 'globalDeny', match: result.match }
      }

      return { outcome: 'noMatch' }
    }

    // Try allow
    let lastFailure: TFailure | undefined
    let allowMatch: TMatch | undefined

    for (const matcher of allowMatchers) {

      const result = matcher(value)

      if (result.matched) {

        allowMatch = result.match
        break
      }

      lastFailure = result.failure
    }

    if (allowMatch === undefined)
      return { outcome: 'noMatch', lastFailure }

    // Scoped deny
    for (const matcher of denyMatchers) {

      const result = matcher(value)

      if (result.matched)
        return { outcome: 'scopedDeny', match: result.match }
    }

    return { outcome: 'allowed', match: allowMatch }
  }
}


// ─── SimplePolicyFactory ────────────────────────────────────────────────────

/**
 * Factory-of-factory for extractable-style policies (always string patterns).
 * Validates input via stringPolicyDefinitionSchema, then creates matchers.
 *
 * Returns a factory: `(input) → policyFn`.
 */
export const SimplePolicyFactory = <TValue, TMatch, TFailure>(
  Matcher: (pattern: string) => (value: TValue) => MatchResult<TMatch, TFailure>,
) => {

  const factory = PolicyFactory(Matcher)

  return (input: unknown): (value: TValue) => PolicyResult<TMatch, TFailure> => {

    return factory(
      stringPolicyDefinitionSchema.parse(input),
    )
  }
}


// ─── MergedPolicy ───────────────────────────────────────────────────────────

/**
 * Aggregates multiple per-policy functions into a single evaluation function.
 *
 * Single-pass algorithm:
 * - Short-circuit on globalDeny (immediate return)
 * - First-match for allowed/scopedDeny
 * - Accumulates lastFailure from noMatch results
 */
export const MergedPolicy = <TValue, TMatch, TFailure>(
  ...policies: Array<(value: TValue) => PolicyResult<TMatch, TFailure>>
): (value: TValue) => PolicyResult<TMatch, TFailure> => value => {

  let firstResult: PolicyResult<TMatch, TFailure> | undefined
  let lastFailure: TFailure | undefined

  for (const policy of policies) {

    const result = policy(value)

    if (result.outcome === 'globalDeny')
      return result

    if (firstResult === undefined && (result.outcome === 'allowed' || result.outcome === 'scopedDeny'))
      firstResult = result

    if (result.outcome === 'noMatch' && result.lastFailure !== undefined)
      lastFailure = result.lastFailure
  }

  return firstResult ?? { outcome: 'noMatch', lastFailure }
}
