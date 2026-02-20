import { BaseEslintPreset } from './eslint.base.config'



export default BaseEslintPreset({
  ignores: ['apps', 'packages', 'node_modules', 'dist'],
  tsconfigRootDir: import.meta.dirname,
  unusedExportsReporting: {
    ignoreUnusedTypeExports: true,
    ignoreExports: [
      '*.config.ts',
      '**/*.test.ts',
      'src/cli.ts',
    ],
  },
})
