import { readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { type BuildOptions, build } from 'esbuild'



// Common options
const common: BuildOptions = {
  platform: 'node',
  target: 'node18',
  format: 'esm',
  sourcemap: true,
}

// Bundle the CLI (single file for performance)
const buildCli = () => build({
  ...common,
  entryPoints: ['src/cli.ts'],
  outfile: 'dist/cli.js',
  bundle: true,
  minify: true,
  alias: { '~': resolve('src') },
  // Externalize Node.js built-ins and all node_modules (jiti uses dynamic requires)
  packages: 'external',
  banner: {
    js: '#!/usr/bin/env node',
  },
})

// Get all .ts files in a directory (non-recursive, excluding tests)
const getEntryPoints = async (dir: string): Promise<Array<string>> => {

  const files = await readdir(join('src', dir))

  return files
    .filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    .map(f => join('src', dir, f))
}

// Build library modules (NOT bundled, preserves imports for tree-shaking)
const buildLibrary = async () => {

  const directories = [
    'config',
    'extractables',
    'extractables/factories',
    'extractables/factories/utilities',
    'extractables/utilities',
    'guards',
    'types',
    'utilities',
    'validation',
  ]

  const entryPoints: Array<string> = [
    'src/checkPermissions.ts',
    'src/command.ts',
    'src/extractable.ts',
    'src/field.ts',
    'src/globPolicyEvaluator.ts',
    'src/guard.ts',
    'src/io.ts',
    'src/logger.ts',
    'src/policy.ts',
    'src/policyEvaluator.ts',
    'src/rule.ts',
    'src/validable.ts',
  ]

  for (const directory of directories)
    entryPoints.push(
      ...await getEntryPoints(directory),
    )

  return build({
    ...common,
    entryPoints,
    outdir: 'dist',
    bundle: false, // Keep imports, don't bundle
  })
}

// Run builds
await Promise.all([
  buildCli(),
  buildLibrary(),
])

console.log('Build complete')
