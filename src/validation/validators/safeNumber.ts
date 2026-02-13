import { isDigitString } from './charsets'
import { type Validator } from './validators'



/**
 * Validates a positive integer.
 *
 * @example
 * validateSafeNumber('42') // true
 * validateSafeNumber('0') // true
 * validateSafeNumber('-5') // false
 * validateSafeNumber('3.14') // false
 */
export const validateSafeNumber: Validator = isDigitString
