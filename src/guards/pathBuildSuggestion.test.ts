import { describe, expect, it } from 'vitest'
import { PathBuildSuggestion } from './pathBuildSuggestion'



describe('PathBuildSuggestion', () => {

  const suggest = PathBuildSuggestion('file_path')

  it('suggests * for empty value', () => {

    expect(suggest('')).toBe(`Add '*' to allow.file_path`)
  })

  it('suggests exact path and * for root-level file', () => {

    const result = suggest('foo.ts')

    expect(result).toContain(`'foo.ts'`)
    expect(result).toContain(`'*'`)
  })

  it('suggests exact path and glob parent for nested path', () => {

    const result = suggest('src/foo/bar.ts')

    expect(result).toContain(`'src/foo/bar.ts'`)
    expect(result).toContain(`'src/foo/*'`)
  })

  it('suggests external: prefixed absolute path for absolute path', () => {

    const result = suggest('/etc/passwd')

    expect(result).toContain('external:')
    expect(result).toContain('/etc/passwd')
  })

  it('suggests external: prefixed resolved path for traversal path', () => {

    const result = suggest('../foo/bar.ts')

    expect(result).toContain('external:')
    expect(result).toContain('foo/bar.ts')
  })
})
