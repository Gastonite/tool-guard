import { resolveProjectPath } from '../../utilities/resolveProjectPath'
import { isValidPathString } from './charsets'
import { type Validator } from './validators'



/**
 * Validates a file path within the project directory.
 * Resolves symlinks to detect links pointing outside the project.
 *
 * @example
 * validateInternalFilePath('src/app.ts') // true (if in project)
 * validateInternalFilePath('../etc/passwd') // false (escapes project)
 * validateInternalFilePath('/etc/hosts') // false (outside project)
 * validateInternalFilePath('src/link') // false (if symlink points outside project)
 */
export const validateInternalFilePath: Validator = path => (
  isValidPathString(path) && resolveProjectPath(path).internal
)
