import { appendFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'



/** Log levels */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/** Logger configuration */
export type LoggerConfig = {

  /** Minimum log level to output */
  level: LogLevel

  /** Path to log file (relative to project dir) */
  filePath: string

  /** Whether to also log to stderr */
  stderr: boolean
}

/** Logger instance */
export type LoggerInstance = {
  debug: (message: string, data?: Record<string, unknown>) => void
  info: (message: string, data?: Record<string, unknown>) => void
  warn: (message: string, data?: Record<string, unknown>) => void
  error: (message: string, data?: Record<string, unknown>) => void
}

/** Numeric values for log level comparison */
const _LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/**
 * Create a logger for authorization decisions.
 * Logs to a file in the project directory and optionally to stderr.
 * @param projectDir - Base directory for log file path resolution
 * @param options - Logger configuration options
 * @returns Logger instance with debug/info/warn/error methods
 */
export const Logger = (projectDir: string, options: Partial<LoggerConfig> = {}): LoggerInstance => {

  /** Merged configuration with defaults */
  const _config: LoggerConfig = {
    level: options.level ?? 'info',
    filePath: options.filePath ?? '.claude/logs/guard.log',
    stderr: options.stderr ?? false,
  }

  /**
   * Check if a log level should be output based on config.
   * @param level - The log level to check
   * @returns True if level meets minimum threshold
   */
  const _shouldLog = (level: LogLevel): boolean => (
    _LOG_LEVEL_VALUES[level] >= _LOG_LEVEL_VALUES[_config.level]
  )

  /**
   * Format a log entry.
   * @param level - Log level
   * @param message - Log message
   * @param data - Optional structured data
   * @returns Formatted log string
   */
  const _format = (level: LogLevel, message: string, data?: Record<string, unknown>): string => {

    const timestamp = new Date().toISOString()
    const levelStr = level.toUpperCase().padEnd(5)
    let entry = `[${timestamp}] [${levelStr}] ${message}`

    if (data)
      entry += '\n' + JSON.stringify(data, undefined, 2)

    return entry + '\n'
  }

  /**
   * Write a log entry to file and optionally stderr.
   * @param level - Log level
   * @param message - Log message
   * @param data - Optional structured data
   */
  const _write = (level: LogLevel, message: string, data?: Record<string, unknown>): void => {

    if (!_shouldLog(level))
      return

    const entry = _format(level, message, data)

    if (_config.stderr)
      process.stderr.write(entry)

    try {

      const logPath = join(projectDir, _config.filePath)
      const logDir = dirname(logPath)

      if (!existsSync(logDir))
        mkdirSync(logDir, { recursive: true })

      appendFileSync(logPath, entry)
    } catch {
      // Ignore file write errors - don't break the hook
    }
  }

  return {
    debug: (message, data) => _write('debug', message, data),
    info: (message, data) => _write('info', message, data),
    warn: (message, data) => _write('warn', message, data),
    error: (message, data) => _write('error', message, data),
  }
}
