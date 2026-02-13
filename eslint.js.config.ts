import js from '@eslint/js'
import globals from 'globals'
import { type ConfigWithExtends } from 'typescript-eslint'



export const jsEslintConfig: Array<ConfigWithExtends> = [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'import/no-anonymous-default-export': 'off',
      'func-style': ['error', 'expression'],
      'no-implicit-globals': 'error',
      'no-debugger': 'error',
      'prefer-arrow-callback': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.object.name="Object"][callee.property.name="assign"]',
          message: 'Use extend() or override() instead of Object.assign()',
        },
        {
          selector: 'ExportNamedDeclaration:not([declaration]):not([source])',
          message: 'Use inline named exports (export const X = ...) instead of export { X }',
        },
        {
          selector: 'Literal[value=null]',
          message: 'Use undefined instead of null',
        },
        {
          selector: 'ClassDeclaration',
          message: 'Use factory functions instead of classes',
        },
        {
          selector: 'ClassExpression',
          message: 'Use factory functions instead of classes',
        },
      ],
    },
  },
]
