import { validateExternalFilePath } from './safeExternalFilePath'
import { validateInternalFilePath } from './safeInternalFilePath'
import { type Validator } from './validators'



/**
 * Validates any safe file path (internal or external).
 *
 * @example
 * validateFilePath('src/app.ts') // true (internal)
 * validateFilePath('/etc/hosts') // true (external)
 * validateFilePath('../etc/passwd') // false (escapes project, not absolute)
 */
export const validateFilePath: Validator = path => validateInternalFilePath(path) || validateExternalFilePath(path)
