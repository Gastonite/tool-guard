import { isSafeContentString } from './charsets'
import { type Validator } from './validators'



/**
 * Validates a quoted string with safe characters only.
 * Must start and end with double quotes.
 *
 * @example
 * validateSafeString('"hello world"') // true
 * validateSafeString('"fix: bug #123"') // true
 * validateSafeString('hello') // false (no quotes)
 * validateSafeString('"; rm -rf /"') // false (dangerous)
 */
export const validateSafeString: Validator = value => (
  value.startsWith('"') && value.endsWith('"') && isSafeContentString(value.slice(1, -1))
)
