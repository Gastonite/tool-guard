import { isAbsolute, relative, resolve } from 'node:path'
import picomatch from 'picomatch'
import { type ExtractorType } from '../types/Extractor'
import { validateExternalFilePath } from '../validation/validators/safeExternalFilePath'
import { validateInternalFilePath } from '../validation/validators/safeInternalFilePath'



const EXTERNAL_PREFIX = 'external:'

/**
 * Match a glob pattern against a file path using picomatch.
 * Built-in security: validates path safety before glob matching.
 *
 * - `filePath`: empty value is rejected (a file must have a name)
 * - `directoryPath` / `path`: empty value = cwd, matched only by `*` or `**`
 * - Internal: pattern and value normalized to relative (to project root)
 * - `external:` prefix: pattern and value normalized to absolute
 * - `*` does not cross `/` boundaries
 * - `**` crosses `/` boundaries
 * - Dotfiles are matched (`dot: true`)
 */
export const matchPathGlob = (
  pattern: string,
  value: string,
  extractorType: ExtractorType,
): boolean => {

  const projectPath = process.env['CLAUDE_PROJECT_DIR'] ?? process.cwd()

  // External: both pattern and value resolved to absolute
  if (pattern.startsWith(EXTERNAL_PREFIX)) {

    if (!validateExternalFilePath(value))
      return false

    const resolvedValue = resolve(projectPath, value)
    const resolvedPattern = resolve(projectPath, pattern.slice(EXTERNAL_PREFIX.length))

    return picomatch.isMatch(resolvedValue, resolvedPattern, { dot: true })
  }

  // Empty value: depends on extractor type
  if (!value) {

    // filePath: a file must have a name
    if (extractorType === 'filePath')
      return false

    // directoryPath / path: empty = cwd, only explicit wildcards match root
    return pattern === '*' || pattern === '**'
  }

  if (!validateInternalFilePath(value))
    return false

  // Internal: both pattern and value normalized to relative
  const relativePath = isAbsolute(value)
    ? relative(projectPath, value)
    : value

  const relativePattern = isAbsolute(pattern)
    ? relative(projectPath, pattern)
    : pattern

  return picomatch.isMatch(relativePath, relativePattern, { dot: true })
}
