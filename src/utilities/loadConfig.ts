import { existsSync } from 'node:fs'
import { createJiti as Jiti } from 'jiti'
import { type ToolGuardsConfig } from '../guard'
import { toolGuardsSchema } from '../validation/config'



const jiti = Jiti(import.meta.url)

/**
 * Load config from a TypeScript file (uses jiti for dynamic TypeScript import without compilation).
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
