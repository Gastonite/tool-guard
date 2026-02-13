/**
 * Type of an extractor. Determines matching behavior.
 * All types use picomatch glob with built-in path security validation.
 *
 * - `'filePath'`: must have a non-empty value (a file must have a name)
 * - `'directoryPath'`: empty value = cwd (current working directory)
 * - `'path'`: file or directory, empty value = cwd
 */
export type ExtractorType = 'directoryPath' | 'filePath' | 'path'

/**
 * Normalized extractor with name and optional type.
 */
export type Extractor<TKeys extends string> = {
  name: TKeys
  type?: ExtractorType
}
