import { afterEach, describe, expect, it, vi } from 'vitest'



const statSyncMock = vi.hoisted(() => vi.fn())

vi.unmock('./projectPath')
vi.mock('node:fs', () => ({ statSync: statSyncMock }))

describe('projectPath', () => {

  const originalEnv = process.env['CLAUDE_PROJECT_DIR']

  afterEach(() => {

    statSyncMock.mockReset()

    if (originalEnv !== undefined)
      process.env['CLAUDE_PROJECT_DIR'] = originalEnv
    else
      delete process.env['CLAUDE_PROJECT_DIR']
  })

  it('throws when CLAUDE_PROJECT_DIR is not set', async () => {

    delete process.env['CLAUDE_PROJECT_DIR']
    vi.resetModules()

    await expect(() => import('./projectPath')).rejects.toThrow('CLAUDE_PROJECT_DIR must be set')
  })

  it('throws when CLAUDE_PROJECT_DIR does not exist', async () => {

    process.env['CLAUDE_PROJECT_DIR'] = '/nonexistent/path'
    statSyncMock.mockReturnValue(undefined)
    vi.resetModules()

    await expect(() => import('./projectPath')).rejects.toThrow('CLAUDE_PROJECT_DIR does not exist')
  })

  it('throws when CLAUDE_PROJECT_DIR is not a directory', async () => {

    process.env['CLAUDE_PROJECT_DIR'] = '/some/file.txt'
    statSyncMock.mockReturnValue({ isDirectory: () => false })
    vi.resetModules()

    await expect(() => import('./projectPath')).rejects.toThrow('CLAUDE_PROJECT_DIR is not a directory')
  })

  it('exports path when CLAUDE_PROJECT_DIR is valid', async () => {

    process.env['CLAUDE_PROJECT_DIR'] = '/valid/project'
    statSyncMock.mockReturnValue({ isDirectory: () => true })
    vi.resetModules()

    const module = await import('./projectPath')

    expect(module.projectPath).toBe('/valid/project')
  })
})
