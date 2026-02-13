import { type Validator } from './validators'



/**
 * Validates a safe package name (npm-style).
 *
 * @example
 * validateSafePackage('lodash') // true
 * validateSafePackage('@types/node') // true
 * validateSafePackage('pkg@1.0.0') // true
 * validateSafePackage('pkg; rm -rf /') // false
 */
export const validateSafePackage: Validator = value => {

  // npm package name pattern (with optional scope and version)
  return (/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*(@[a-z0-9^~>=<.-]+)?$/).test(value)
}
