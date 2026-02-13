import { type Linter } from 'eslint'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import { importX as importPlugin } from 'eslint-plugin-import-x'



/**
 * Options for import/no-unused-modules rule.
 * @see https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-unused-modules.md
 */
export type NoUnusedModulesOptions = {

  /**
   * Array of files/directories to be analyzed. Defaults to current directory.
   */
  src?: Array<string>

  /**
   * Files/directories whose exports should be ignored.
   */
  ignoreExports?: Array<string>

  /**
   * Report modules without any exports.
   */
  missingExports?: true

  /**
   * Report exports without any static usage within other modules.
   */
  unusedExports?: boolean

  /**
   * Ignore unused type exports (TypeScript only).
   */
  ignoreUnusedTypeExports?: boolean
}

export type ImportEslintConfigOptions = {

  /**
   * Configure import/no-unused-modules rule.
   * - `false`: rule disabled (recommended for packages)
   * - `NoUnusedModulesOptions`: rule enabled with custom options (for apps)
   * Requires empty .eslintrc file in each package (flat config limitation)
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-unused-modules.md
   */
  unusedExportsReporting?: NoUnusedModulesOptions
}

export const ImportEslintConfig = ({
  unusedExportsReporting,
}: ImportEslintConfigOptions): Array<Linter.Config> => {

  const unusedModulesRule: Linter.RuleEntry<[NoUnusedModulesOptions]> = unusedExportsReporting
    ? ['error', {
      missingExports: true,
      unusedExports: true,
      ...unusedExportsReporting,
    }]
    : 'off'

  return [
    {
      files: ['**/*.{js,jsx,ts,tsx,cjs,mjs}'],
      plugins: {
        // @ts-expect-error - https://github.com/un-ts/eslint-plugin-import-x/issues/203
        import: importPlugin,
      },
      settings: {
        'import-x/resolver-next': [
          createTypeScriptImportResolver({
            alwaysTryTypes: true,
            project: './tsconfig.json',
          }),
        ],
        'import-x/parsers': {
          '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
        'import-x/internal-regex': '^(~)/',
      },
      rules: {
        // Import order
        'import/order': ['error', {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          pathGroups: [
            {
              pattern: '~/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'never',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          warnOnUnassignedImports: false,
        }],

        // 3 empty lines after all imports
        'import/newline-after-import': ['error', { count: 3 }],

        // No duplicate imports (prefer combining)
        'import/no-duplicates': ['error', {
          'prefer-inline': false,
          considerQueryString: true,
        }],

        // Order of members in named imports (types last)
        'import/consistent-type-specifier-style': ['error', 'prefer-inline'],

        // File extensions
        'import/extensions': 'off',

        // No unused imports/exports (configured via unusedExports option)
        'import/no-unused-modules': unusedModulesRule,

        // No unresolved imports
        'import/no-unresolved': ['error', {
          ignore: ['^~/'],
          caseSensitive: true,
          commonjs: true,
          amd: false,
        }],

        // No default exports (with exceptions)
        'import/no-default-export': ['error'],

        // Ensure imports exist
        'import/named': 'error',
        'import/default': 'error',
        'import/namespace': 'error',

        // Prevent issues
        'import/no-named-as-default': 'error',
        'import/no-named-as-default-member': 'error',
        'import/no-named-default': 'error',

        // No mutable exports (disabled as per your preference)
        'import/no-mutable-exports': 'off',

        // Export style
        'import/no-named-export': 'off',
        'import/exports-last': 'off',
        'import/group-exports': 'off',
        'import/prefer-default-export': 'off',

        // Dependencies
        'import/no-extraneous-dependencies': ['error', {
          devDependencies: true,
          optionalDependencies: false,
          peerDependencies: false,
          includeTypes: true,
        }],

        // Imports for side effects (only CSS allowed)
        'import/no-unassigned-import': ['error', {
          allow: ['**/*.css', '**/*.scss', '**/*.less'],
        }],

        // Module systems
        'import/no-commonjs': 'error',
        'import/no-amd': 'error',
        'import/no-dynamic-require': 'error',
        'import/no-webpack-loader-syntax': 'error',

        // Import style
        'import/no-namespace': 'error',
        'import/no-relative-parent-imports': 'off',
        'import/no-relative-packages': 'error',
        'import/no-absolute-path': 'error',
        'import/no-self-import': 'error',

        // Code quality
        'import/no-cycle': ['error', {
          maxDepth: Infinity,
          ignoreExternal: true,
        }],
        'import/no-useless-path-segments': ['error', {
          noUselessIndex: false, // NodeNext requires explicit index.js
        }],
        'import/first': 'error',
        'import/no-import-module-exports': 'error',
        'import/no-empty-named-blocks': 'error',

        // Warnings
        'import/no-deprecated': 'warn',

        // Not needed/configured
        'import/max-dependencies': 'off',
        'import/dynamic-import-chunkname': 'off',
        'import/no-anonymous-default-export': 'off',
      },
    },

    // Exceptions for default exports in config files and Storybook
    {
      files: [
        '*.config.ts',
        '*.config.js',
        '.eslintrc.js',
        '**/*.stories.ts',
        '**/*.stories.tsx',
        '.storybook/**/*.ts',
        '.storybook/**/*.tsx',
      ],
      rules: {
        'import/no-default-export': 'off',
      },
    },
  ]
}
