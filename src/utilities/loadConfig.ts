import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createJiti as Jiti } from 'jiti'
import { type ToolGuardsConfig } from '~/guard'
import { toolGuardsSchema } from '~/validation/config'



const __dirname = dirname(fileURLToPath(import.meta.url))

const jiti = Jiti(import.meta.url, {
  alias: {
    '~': resolve(__dirname, '..'),
  },
})

/**
 * Load config from a TypeScript file (uses jiti for dynamic TypeScript import without compilation).
 *
 * **Security note:** This executes arbitrary TypeScript/JavaScript code from the config file
 * via `jiti.import()`. This is by design — same trust model as `eslint.config.js` or
 * `webpack.config.js`. The config file is developer-authored source code, not untrusted input.
 *
 * @param filePath - Path to the guard.config.ts file
 * @returns Parsed config or undefined if file doesn't exist
 */
export const loadConfig = async (filePath: string): Promise<ToolGuardsConfig | undefined> => {

  if (!existsSync(filePath))
    return

  const module = await jiti.import(filePath)
  const config = (module as { default: ToolGuardsConfig }).default

  // Validate config
  toolGuardsSchema.parse(config)

  return config
}
