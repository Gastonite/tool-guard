import { resolveProjectPath } from '~/utilities/resolveProjectPath'



export const PathBuildSuggestion = (fieldName: string) => (value: string): string => {

  if (!value)
    return `Add '*' to allow.${fieldName}`

  const resolved = resolveProjectPath(value)

  if (resolved.internal) {

    const lastSlashIndex = resolved.relativePath.lastIndexOf('/')
    const globPattern = lastSlashIndex === -1
      ? '*'
      : `${resolved.relativePath.slice(0, lastSlashIndex)}/*`
    return `Add '${resolved.relativePath}' or '${globPattern}' to allow.${fieldName}`
  }

  const lastSlashIndex = resolved.absolutePath.lastIndexOf('/')
  const globPattern = `external:${resolved.absolutePath.slice(0, lastSlashIndex)}/*`
  return `Add 'external:${resolved.absolutePath}' or '${globPattern}' to allow.${fieldName}`
}
