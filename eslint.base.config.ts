import { globalIgnores } from 'eslint/config'
import { ImportEslintConfig, type NoUnusedModulesOptions } from './eslint.import.config'
import { jsEslintConfig } from './eslint.js.config'
import { nodeEslintConfig } from './eslint.node.config'
import { perfectionistEslintConfig } from './eslint.perfectionist.config'
import { stylisticEslintConfig } from './eslint.stylistic.config'
import { tsEslintConfig } from './eslint.ts.config'



/**
 * Options for ESLint presets.
 */
export type BaseEslintPresetOptions = {

  /**
   * Glob patterns to ignore.
   * @example ['dist', 'node_modules']
   */
  ignores?: Array<string>

  /**
   * Root directory for TypeScript config resolution.
   * Required in monorepos to help ESLint find the correct tsconfig.json.
   * @example import.meta.dirname
   */
  tsconfigRootDir?: string

  /**
   * Configure import/no-unused-modules rule.
   * - `false`: rule disabled (recommended for packages)
   * - `NoUnusedModulesOptions`: rule enabled with custom options (for apps)
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-unused-modules.md
   * @example false // disable for packages
   * @example { src: ['src'], unusedExports: true } // enable for apps
   */
  unusedExportsReporting?: NoUnusedModulesOptions
}

/**
 * Base ESLint preset factory with TypeScript, stylistic, and import rules.
 *
 * @param options - Preset configuration options
 * @returns ESLint flat config array
 *
 * @example
 * ```ts
 * // eslint.config.ts
 * import { BaseEslintPreset } from '@drive/eslint-config/presets/base'
 *
 * export default BaseEslintPreset({
 *   ignores: ['dist', 'node_modules'],
 *   tsconfigRootDir: import.meta.dirname,
 * })
 * ```
 */
export const BaseEslintPreset = ({
  ignores,
  tsconfigRootDir,
  unusedExportsReporting,
}: BaseEslintPresetOptions) => {


  return [
    ...(ignores
      ? [globalIgnores(ignores)]
      : []),
    ...jsEslintConfig,
    ...tsEslintConfig,
    ...stylisticEslintConfig,
    ...perfectionistEslintConfig,
    ...nodeEslintConfig,
    ...ImportEslintConfig({
      unusedExportsReporting,
    }),
    ...(tsconfigRootDir
      ? [{
        languageOptions: {
          parserOptions: {
            tsconfigRootDir,
          },
        },
      }]
      : []),
  ]
}
