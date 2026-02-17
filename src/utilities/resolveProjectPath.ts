import { isAbsolute, relative, resolve } from 'node:path'
import { projectPath } from '~/config/projectPath'
import { resolveWithParentSymlinks } from './resolveWithParentSymlinks'



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
 * For non-existent files, resolves symlinks in parent directories
 * to prevent bypass via symlinked directories.
 *
 * **Security note (TOCTOU):** There is an inherent race condition between
 * resolving symlinks here and Claude Code actually using the path. An attacker
 * with filesystem access could re-point a symlink after resolution but before
 * use. This is a fundamental limitation of userspace path validation on Unix —
 * the threat model assumes the attacker does not have local filesystem access.
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

  const resolved = resolve(projectPath, value)
  const realPath = resolveWithParentSymlinks(resolved)
  const rel = relative(projectPath, realPath)

  if (!rel.startsWith('..') && !isAbsolute(rel))
    return { internal: true, relativePath: rel }

  return { internal: false, absolutePath: realPath }
}
