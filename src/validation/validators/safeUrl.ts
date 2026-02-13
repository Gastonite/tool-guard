import { type Validator } from './validators'



/**
 * Validates a safe URL (http/https only, no credentials).
 *
 * @example
 * validateSafeUrl('https://example.com') // true
 * validateSafeUrl('https://api.github.com/repos') // true
 * validateSafeUrl('file:///etc/passwd') // false
 * validateSafeUrl('https://user:pass@example.com') // false
 */
export const validateSafeUrl: Validator = value => {

  try {

    const url = new URL(value)

    // Only allow http/https
    if (url.protocol !== 'http:' && url.protocol !== 'https:')
      return false

    // No credentials in URL
    if (url.username || url.password)
      return false

    return true
  } catch {

    return false
  }
}
