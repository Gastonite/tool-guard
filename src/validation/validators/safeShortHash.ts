import { isHexadecimalString } from './charsets'
import { type Validator } from './validators'



/**
 * Validates a short git hash (7-40 hex characters).
 *
 * @example
 * validateSafeShortHash('abc1234') // true
 * validateSafeShortHash('a1b2c3d4e5f6...') // true
 * validateSafeShortHash('abc') // false (too short)
 */
export const validateSafeShortHash: Validator = value => isHexadecimalString(value, 7, 40)
