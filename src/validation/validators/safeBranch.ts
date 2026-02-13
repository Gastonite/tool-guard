import { isValidPathString } from './charsets'
import { type Validator } from './validators'



/**
 * Validates a git branch name.
 *
 * @example
 * validateSafeBranch('main') // true
 * validateSafeBranch('feature/my-feature') // true
 * validateSafeBranch('-malicious') // false (starts with dash)
 * validateSafeBranch('branch name') // false (space)
 */
export const validateSafeBranch: Validator = value => (
  value !== '' && !value.startsWith('-') && !value.startsWith('.') && isValidPathString(value)
)
