import { join } from 'node:path'
import { z } from 'zod'
import { checkPermissions } from './checkPermissions'
import { readInput, replyAllow, replyDeny } from './io'
import { Logger } from './logger'
import { loadConfig } from './utilities/loadConfig'



/** Path to permissions config file, relative to project directory */
const PERMISSIONS_FILE = '.claude/guard.config.ts'

/** Environment variables schema */
const environmentSchema = z.object({

  projectDir: z.string().min(1).default(process.cwd()),
  level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  stderr: z.boolean().default(false),
})

/** Parsed and validated environment */
const environment = environmentSchema.parse({

  projectDir: process.env['CLAUDE_PROJECT_DIR'],
  level: process.env['GUARD_LOG'],
  stderr: process.env['GUARD_STDERR'] === 'true',
})

/** Logger instance for authorization decisions */
const logger = Logger(environment.projectDir, {

  level: environment.level,
  stderr: environment.stderr,
})

try {

  const { toolName, toolInput } = await readInput()

  logger.debug(`Tool request: ${toolName}`, { toolInput })

  // Load permissions config
  const permissionsPath = join(environment.projectDir, PERMISSIONS_FILE)
  const config = await loadConfig(permissionsPath)

  // No config = deny all (exhaustive config required)
  if (!config) {

    logger.info(`No permissions file, denying: ${toolName}`)
    replyDeny(`No permissions config found at ${PERMISSIONS_FILE}`)
    process.exit(0)
  }

  const result = checkPermissions(toolName, toolInput, config)

  if (result.allowed) {

    logger.debug(`Allowed: ${toolName}`)
    replyAllow()
    process.exit(0)
  }

  // Denied
  logger.info(`Denied: ${toolName}`, { reason: result.reason })

  // Build detailed reason message
  const message = [
    result.reason,
    '',
    `Tool: ${toolName}`,
    `Input: ${JSON.stringify(toolInput, undefined, 2)}`,
    '',
    `To fix: ${result.suggestion} in ${PERMISSIONS_FILE}`,
  ]

  replyDeny(message.join('\n'))
} catch (originalError) {

  const error = originalError instanceof Error
    ? originalError
    : new Error(String(originalError))

  logger.error(`Script error: ${error.message}`, {
    stack: error.stack,
  })

  // On error, deny for safety
  replyDeny(`Authorization script error: ${error.message}`)

  process.exit(1)
}
