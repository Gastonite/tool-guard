import { statSync } from 'node:fs'



const value = process.env['CLAUDE_PROJECT_DIR']

if (!value)
  throw new Error('CLAUDE_PROJECT_DIR must be set')

const stat = statSync(value, { throwIfNoEntry: false })

if (!stat)
  throw new Error(`CLAUDE_PROJECT_DIR does not exist: ${value}`)

if (!stat.isDirectory())
  throw new Error(`CLAUDE_PROJECT_DIR is not a directory: ${value}`)

export const projectPath = value
