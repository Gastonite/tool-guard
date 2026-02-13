/**
 * Match a glob pattern against a value (without regex).
 * Supports * as wildcard (matches any characters including spaces).
 *
 * Algorithm: Split pattern by '*' into segments, then verify each segment
 * appears in the value in the correct position/order.
 *
 * Examples:
 *   matchGlob('git *', 'git status')     → segments: ['git ', ''] → true
 *   matchGlob('*.ts', 'app.ts')          → segments: ['', '.ts'] → true
 *   matchGlob('a*b*c', 'aXXbYYc')        → segments: ['a', 'b', 'c'] → true
 *   matchGlob('git *', 'npm install')    → segments: ['git ', ''] → false
 */
export const matchGlob = (pattern: string, value: string): boolean => {

  // Split pattern by wildcard: "git *" → ["git ", ""]
  const segments = pattern.split('*')

  // No wildcard in pattern: require exact match
  if (segments.length === 1)
    return pattern === value

  // Track how much of the value we've matched so far
  let valueIndex = 0

  for (let i = 0; i < segments.length; i++) {

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
      // Ensure no overlap: "a*a" should NOT match "a" (needs at least "aa")
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
