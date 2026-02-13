import { type ConfigWithExtends } from 'typescript-eslint'
import { configs as tsEslintConfigs } from 'typescript-eslint'



export const tsEslintConfig: Array<ConfigWithExtends> = [
  ...tsEslintConfigs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      // Type-checked rules
      '@typescript-eslint/no-for-in-array': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      indent: 'off',
      '@typescript-eslint/indent': 'off',
      '@typescript-eslint/array-type': ['error', {
        default: 'generic',
      }],
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
      }],
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      '@typescript-eslint/naming-convention': ['error', {
        selector: 'typeParameter',
        format: ['PascalCase'],
        custom: {
          regex: '^(T|T[A-Z][A-Za-z]+)$',
          match: true,
        },
      }],
      '@typescript-eslint/no-inferrable-types': ['error', {
        ignoreParameters: true,
      }],
      '@typescript-eslint/prefer-for-of': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
]
