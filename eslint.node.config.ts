import { type Linter } from 'eslint'
import nodePlugin from 'eslint-plugin-n'



export const nodeEslintConfig: Array<Linter.Config> = [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      node: nodePlugin,
    },
    rules: {
      'node/prefer-node-protocol': 'error',
    },
  },
]
