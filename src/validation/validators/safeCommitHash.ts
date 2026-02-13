import { isHexadecimalString } from './charsets'
import { type Validator } from './validators'



/**
 * Validates a git SHA-1 commit hash (exactly 40 hex characters).
 *
 * @example
 * validateSafeCommitHash('a1b2c3...') // true (40 chars)
 * validateSafeCommitHash('abc123') // false (too short)
 */
export const validateSafeCommitHash: Validator = value => isHexadecimalString(value, 40, 40)
