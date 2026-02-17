import { type EvaluateResult, type ParsedPolicy, PolicyEvaluator } from './policyEvaluator'



/**
 * Match a glob pattern against a value (without regex).
 * Supports `*` as wildcard (matches any characters including spaces).
 *
 * **OneOrMany:** Each `*` must consume at least one character. This is consistent
 * with the rest of the library where sequences (greedy, spread, charset) all
 * require at least one match. To accept the zero case, declare an additional
 * pattern (e.g. `allow: ['git *', 'git']` to also allow bare `git`).
 *
 * **String matching, not path matching:** `*` matches any characters including `/`.
 * Consecutive wildcards are collapsed (`**` = `*`). For path-aware matching
 * (where `*` matches a single directory level), use `matchesPathPattern` from
 * `path.ts` instead.
 *
 * Algorithm: Collapse consecutive `*`, split by `*` into segments, verify each
 * segment appears in the value in the correct position/order, and ensure each
 * wildcard consumed at least 1 character.
 *
 * @example
 * matchGlobPattern('git *', 'git status')     // true
 * matchGlobPattern('*env', '.env')            // true  (* consumes '.')
 * matchGlobPattern('a*b*c', 'aXXbYYc')       // true
 * matchGlobPattern('*', '')                   // false (OneOrMany)
 * matchGlobPattern('*.ts', '.ts')             // false (* needs 1+ char)
 * matchGlobPattern('a*a', 'aa')              // false (* needs 1+ char)
 */
export const matchGlobPattern = (pattern: string, value: string): boolean => {

  // Collapse consecutive wildcards: "a**b" → "a*b" (no semantic distinction)
  const normalizedPattern = pattern.replace(/\*+/g, '*')

  // Split pattern by wildcard: "git *" → ["git ", ""]
  const segments = normalizedPattern.split('*')

  // No wildcard in pattern: require exact match
  if (segments.length === 1)
    return pattern === value

  // OneOrMany: each wildcard must consume at least 1 character
  const numberOfWildcards = segments.length - 1
  const totalSegmentLength = segments.reduce((sum, segment) => sum + segment.length, 0)

  if (value.length < totalSegmentLength + numberOfWildcards)
    return false

  // Track how much of the value we've matched so far
  let valueIndex = 0

  for (let i = 0; i < segments.length; i++) {

    // Reserve 1 character for the wildcard before this segment
    if (i > 0)
      valueIndex += 1

    const segment = segments[i] ?? ''

    // Empty segment = nothing to match (wildcard handles it)
    if (segment === '')
      continue

    // First segment (before first *): value must START with it
    if (i === 0) {

      if (!value.startsWith(segment))
        return false

      valueIndex = segment.length

      continue
    }

    // Last segment (after last *): value must END with it
    if (i === segments.length - 1) {

      if (!value.endsWith(segment))
        return false

      // Ensure no overlap with previous matches
      if (value.length - segment.length < valueIndex)
        return false

      continue
    }

    // Middle segment (between two *): must appear AFTER previous match
    // Example: "a*b*c" → 'b' must appear somewhere after 'a'
    const foundIndex = value.indexOf(segment, valueIndex)
    if (foundIndex === -1)
      return false

    valueIndex = foundIndex + segment.length
  }

  return true
}

export const GlobPolicyEvaluator = (
  parsedPolicies: Array<ParsedPolicy<string>>,
): (value: string) => EvaluateResult<string, undefined> => (
  PolicyEvaluator(parsedPolicies, (pattern, value) => (
    matchGlobPattern(pattern, value)
      ? { matched: true, match: pattern }
      : { matched: false, failure: undefined }
  ))
)
