import { type Linter } from 'eslint'
import perfectionist from 'eslint-plugin-perfectionist'



export const perfectionistEslintConfig: Array<Linter.Config> = [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      perfectionist,
    },
    rules: {
      'perfectionist/sort-jsx-props': ['error', {
        type: 'unsorted',
        groups: [
          'reserved',
          'unknown',
          'shorthand-prop',
          'callback',
        ],
        customGroups: [
          {
            groupName: 'reserved',
            elementNamePattern: '^(key|ref)$',
          },
          {
            groupName: 'callback',
            elementNamePattern: '^on[A-Z].+',
          },
        ],
      }],
    },
  },
]
