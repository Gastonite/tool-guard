import { existsSync, realpathSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'
import { isValidPathString } from './charsets'
import { type Validator } from './validators'



/**
 * Validates an external file path (outside the project directory).
 * Resolves symlinks to detect links pointing inside the project.
 *
 * @example
 * validateExternalFilePath('/etc/hosts') // true (absolute, outside project)
 * validateExternalFilePath('../drive/file.ts') // true (traversal, outside project)
 * validateExternalFilePath('src/app.ts') // false (inside project)
 * validateExternalFilePath('file;rm.ts') // false (shell metacharacters)
 */
export const validateExternalFilePath: Validator = path => {

  const projectPath = process.env['CLAUDE_PROJECT_DIR'] ?? process.cwd()

  if (!isValidPathString(path))
    return false

  // Resolve to absolute
  const resolved = resolve(projectPath, path)

  // Resolve symlinks if file exists to detect links pointing inside
  const realPath = existsSync(resolved)
    ? realpathSync(resolved)
    : resolved

  // Must resolve to outside the project
  const rel = relative(projectPath, realPath)

  return rel.startsWith('..') || isAbsolute(rel)
}
