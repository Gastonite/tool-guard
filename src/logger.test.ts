import { existsSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Logger } from './logger'



describe('Logger', () => {

  let projectDir: string

  beforeEach(() => {

    projectDir = join(tmpdir(), 'logger-test')
  })

  afterEach(() => {

    if (existsSync(projectDir))
      rmSync(projectDir, { recursive: true })
  })

  describe('level filtering', () => {

    it('logs at configured level and above', () => {

      const logger = Logger(projectDir, { level: 'warn' })

      logger.debug('ignored')
      logger.info('ignored')
      logger.warn('kept')
      logger.error('kept')

      const logPath = join(projectDir, '.claude/logs/guard.log')
      const content = readFileSync(logPath, 'utf-8')

      expect(content).not.toContain('ignored')
      expect(content).toContain('kept')
    })

    it('defaults to info level', () => {

      const logger = Logger(projectDir)

      logger.debug('ignored')
      logger.info('kept')

      const logPath = join(projectDir, '.claude/logs/guard.log')
      const content = readFileSync(logPath, 'utf-8')

      expect(content).not.toContain('ignored')
      expect(content).toContain('kept')
    })

    it('debug level logs everything', () => {

      const logger = Logger(projectDir, { level: 'debug' })

      logger.debug('d')
      logger.info('i')
      logger.warn('w')
      logger.error('e')

      const logPath = join(projectDir, '.claude/logs/guard.log')
      const content = readFileSync(logPath, 'utf-8')

      expect(content).toContain('[DEBUG]')
      expect(content).toContain('[INFO ]')
      expect(content).toContain('[WARN ]')
      expect(content).toContain('[ERROR]')
    })
  })

  describe('formatting', () => {

    it('includes ISO timestamp, level, and message', () => {

      const logger = Logger(projectDir, { level: 'debug' })

      logger.info('test message')

      const logPath = join(projectDir, '.claude/logs/guard.log')
      const content = readFileSync(logPath, 'utf-8')

      expect(content).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(content).toContain('[INFO ]')
      expect(content).toContain('test message')
    })

    it('includes JSON data when provided', () => {

      const logger = Logger(projectDir, { level: 'debug' })

      logger.info('with data', { tool: 'Read', path: '/etc/passwd' })

      const logPath = join(projectDir, '.claude/logs/guard.log')
      const content = readFileSync(logPath, 'utf-8')

      expect(content).toContain('"tool": "Read"')
      expect(content).toContain('"path": "/etc/passwd"')
    })

    it('omits data block when no data provided', () => {

      const logger = Logger(projectDir, { level: 'debug' })

      logger.info('no data')

      const logPath = join(projectDir, '.claude/logs/guard.log')
      const content = readFileSync(logPath, 'utf-8')
      const lines = content.trim().split('\n')

      expect(lines).toHaveLength(1)
    })
  })

  describe('file output', () => {

    it('creates log directory if it does not exist', () => {

      const logger = Logger(projectDir)

      logger.info('test')

      const logPath = join(projectDir, '.claude/logs/guard.log')

      expect(existsSync(logPath)).toBe(true)
    })

    it('uses custom file path', () => {

      const logger = Logger(projectDir, { filePath: 'custom/log.txt' })

      logger.info('test')

      const logPath = join(projectDir, 'custom/log.txt')

      expect(existsSync(logPath)).toBe(true)
    })

    it('appends to existing log file', () => {

      const logger = Logger(projectDir)

      logger.info('first')
      logger.info('second')

      const logPath = join(projectDir, '.claude/logs/guard.log')
      const content = readFileSync(logPath, 'utf-8')

      expect(content).toContain('first')
      expect(content).toContain('second')
    })

    it('does not throw on file write error', () => {

      // Use an invalid path that cannot be created
      const logger = Logger('/dev/null/impossible', { level: 'debug' })

      expect(() => logger.info('test')).not.toThrow()
    })
  })

  describe('stderr output', () => {

    it('writes to stderr when enabled', () => {

      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
      const logger = Logger(projectDir, { stderr: true })

      logger.info('stderr test')

      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('stderr test'))
      stderrSpy.mockRestore()
    })

    it('does not write to stderr when disabled', () => {

      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
      const logger = Logger(projectDir, { stderr: false })

      logger.info('test')

      expect(stderrSpy).not.toHaveBeenCalled()
      stderrSpy.mockRestore()
    })
  })
})
