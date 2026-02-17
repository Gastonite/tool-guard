import { existsSync, realpathSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'



/**
 * Resolve symlinks by walking up to the nearest existing ancestor.
 * For non-existent files (e.g. Write targets), resolves symlinks in parent
 * directories to prevent bypass via symlinked directories.
 */
export const resolveWithParentSymlinks = (targetPath: string): string => {

  if (existsSync(targetPath))
    return realpathSync(targetPath)

  const parent = dirname(targetPath)

  // At filesystem root — can't go higher
  if (parent === targetPath)
    return targetPath

  return resolve(
    resolveWithParentSymlinks(parent),
    basename(targetPath),
  )
}
