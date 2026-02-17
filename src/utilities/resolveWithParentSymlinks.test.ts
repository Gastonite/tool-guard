import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { resolveWithParentSymlinks } from './resolveWithParentSymlinks'



describe('resolveWithParentSymlinks', () => {

  let root = ''
  let projectDirectory = ''
  let externalDirectory = ''

  beforeAll(() => {

    root = mkdtempSync(join(tmpdir(), 'resolve-symlinks-'))
    projectDirectory = join(root, 'project')
    externalDirectory = join(root, 'external')

    mkdirSync(projectDirectory, { recursive: true })
    mkdirSync(join(projectDirectory, 'src'), { recursive: true })
    mkdirSync(externalDirectory, { recursive: true })

    writeFileSync(join(externalDirectory, 'file.ts'), '')
    writeFileSync(join(projectDirectory, 'src', 'actual.ts'), '')
    writeFileSync(join(projectDirectory, 'src', 'real.ts'), '')

    symlinkSync(
      join(projectDirectory, 'src', 'actual.ts'),
      join(projectDirectory, 'src', 'link.ts'),
    )

    symlinkSync(
      externalDirectory,
      join(projectDirectory, 'link'),
    )
  })

  afterAll(() => {

    rmSync(root, { recursive: true, force: true })
  })

  it('resolves symlink pointing outside directory', () => {

    const result = resolveWithParentSymlinks(join(projectDirectory, 'link', 'file.ts'))

    expect(result).toBe(join(externalDirectory, 'file.ts'))
  })

  it('resolves symlink parent for nonexistent file', () => {

    const result = resolveWithParentSymlinks(join(projectDirectory, 'link', 'nonexistent.ts'))

    expect(result).toBe(join(externalDirectory, 'nonexistent.ts'))
  })

  it('resolves internal symlink to real path', () => {

    const result = resolveWithParentSymlinks(join(projectDirectory, 'src', 'link.ts'))

    expect(result).toBe(join(projectDirectory, 'src', 'actual.ts'))
  })

  it('returns path as-is for real files', () => {

    const result = resolveWithParentSymlinks(join(projectDirectory, 'src', 'real.ts'))

    expect(result).toBe(join(projectDirectory, 'src', 'real.ts'))
  })
})
