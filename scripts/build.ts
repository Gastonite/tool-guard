import * as esbuild from 'esbuild'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'



// Common options
const common: esbuild.BuildOptions = {
  platform: 'node',
  target: 'node18',
  format: 'esm',
  sourcemap: true,
}

// Bundle the CLI (single file for performance)
const buildCli = () => esbuild.build({
  ...common,
  entryPoints: ['src/cli.ts'],
  outfile: 'dist/cli.js',
  bundle: true,
  minify: true,
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
    'matchers',
    'guards',
    'utilities',
    'validation',
    'validation/validators',
  ]

  const entryPoints: Array<string> = [
    'src/checkPermissions.ts',
    'src/guard.ts',
    'src/io.ts',
    'src/logger.ts',
    'src/policy.ts',
    'src/rule.ts',
  ]

  for (const directory of directories)
    entryPoints.push(
      ...await getEntryPoints(directory),
    )

  return esbuild.build({
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
