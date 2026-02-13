import { existsSync, realpathSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'



/**
 * Resolved path within or outside the project.
 */
export type ResolvedProjectPath = (
  | { internal: true; relativePath: string }
  | { internal: false; absolutePath: string }
)

/**
 * Resolve a path relative to the project, following symlinks.
 * Returns whether the real path is internal or external.
 *
 * @example
 * resolveProjectPath('src/app.ts')
 * // { internal: true, relativePath: 'src/app.ts' }
 *
 * @example
 * // symlink node_modules/pkg → ~/.pnpm-store/...
 * resolveProjectPath('node_modules/pkg')
 * // { internal: false, absolutePath: '/home/user/.pnpm-store/...' }
 */
export const resolveProjectPath = (value: string): ResolvedProjectPath => {

  const projectPath = process.env['CLAUDE_PROJECT_DIR'] ?? process.cwd()
  const resolved = resolve(projectPath, value)

  // Resolve symlinks if file exists to detect links pointing outside
  const realPath = existsSync(resolved)
    ? realpathSync(resolved)
    : resolved

  const rel = relative(projectPath, realPath)

  if (!rel.startsWith('..') && !isAbsolute(rel))
    return { internal: true, relativePath: rel }

  return { internal: false, absolutePath: realPath }
}
