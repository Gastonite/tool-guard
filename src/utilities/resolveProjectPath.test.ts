import { describe, expect, it } from 'vitest'
import { resolveProjectPath } from './resolveProjectPath'



describe('resolveProjectPath', () => {

  it('resolves simple relative path as internal', () => {

    const result = resolveProjectPath('src/app.ts')

    expect(result.internal).toBe(true)
    expect(result).toHaveProperty('relativePath', 'src/app.ts')
  })

  it('resolves nested relative path as internal', () => {

    const result = resolveProjectPath('src/foo/bar.ts')

    expect(result.internal).toBe(true)
    expect(result).toHaveProperty('relativePath', 'src/foo/bar.ts')
  })

  it('resolves dot as internal (project root)', () => {

    const result = resolveProjectPath('.')

    expect(result.internal).toBe(true)
    expect(result).toHaveProperty('relativePath', '')
  })

  it('resolves ./ prefix as internal', () => {

    const result = resolveProjectPath('./src/app.ts')

    expect(result.internal).toBe(true)
    expect(result).toHaveProperty('relativePath', 'src/app.ts')
  })

  it('resolves absolute path as external', () => {

    const result = resolveProjectPath('/etc/passwd')

    expect(result.internal).toBe(false)
    expect(result).toHaveProperty('absolutePath')
  })

  it('resolves traversal path as external', () => {

    const result = resolveProjectPath('../foo')

    expect(result.internal).toBe(false)
    expect(result).toHaveProperty('absolutePath')
  })

  it('resolves deep traversal as external', () => {

    const result = resolveProjectPath('src/../../../etc/passwd')

    expect(result.internal).toBe(false)
    expect(result).toHaveProperty('absolutePath')
  })

  it('resolves traversal that stays internal (package.json)', () => {

    const result = resolveProjectPath('src/../package.json')

    expect(result.internal).toBe(true)
    expect(result).toHaveProperty('relativePath', 'package.json')
  })
})
