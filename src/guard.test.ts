import { describe, expect, it } from 'vitest'
import { defineGuard, ToolGuardFactory } from './guard'



describe('defineGuard', () => {

  it('returns config as-is (type helper)', () => {

    const BashPolicy = ToolGuardFactory(['command'])

    const config = defineGuard({
      Bash: BashPolicy({ allow: 'git *' }),
      TodoRead: true,
    })

    expect(config.Bash).toBeDefined()
    expect(config.TodoRead).toBe(true)
  })
})



describe('ToolGuardFactory', () => {

  describe('simple format (auto-conversion)', () => {

    const ReadPolicy = ToolGuardFactory(['file_path'])

    it('accepts simple { allow } format', () => {

      const policy = ReadPolicy({ allow: 'src/*' })
      expect(policy({ file_path: 'src/index.ts' })).toEqual({ allowed: true })
      expect(policy({ file_path: 'docs/index.md' }).allowed).toBe(false)
    })

    it('accepts simple { allow, deny } format', () => {

      const policy = ReadPolicy({ allow: '*', deny: '*.env' })
      expect(policy({ file_path: 'src/index.ts' })).toEqual({ allowed: true })
      expect(policy({ file_path: '.env' }).allowed).toBe(false)
    })

    it('accepts array of patterns in allow', () => {

      const policy = ReadPolicy({ allow: ['src/*', 'docs/*'] })
      expect(policy({ file_path: 'src/index.ts' })).toEqual({ allowed: true })
      expect(policy({ file_path: 'docs/index.md' })).toEqual({ allowed: true })
      expect(policy({ file_path: 'tests/index.ts' }).allowed).toBe(false)
    })

    it('converts simple format to primary key rule', () => {

      const GrepPolicy = ToolGuardFactory(['path', 'pattern'])

      // Simple format applies to 'path' (first key)
      const policy = GrepPolicy({ allow: 'src/*' })
      expect(policy({ path: 'src/file.ts', pattern: 'anything' })).toEqual({ allowed: true })
      expect(policy({ path: 'tests/file.ts', pattern: 'anything' }).allowed).toBe(false)
    })

    it('accepts pattern array directly (shorthand)', () => {

      const policy = ReadPolicy(['src/*', 'docs/*'])
      expect(policy({ file_path: 'src/index.ts' })).toEqual({ allowed: true })
      expect(policy({ file_path: 'docs/index.md' })).toEqual({ allowed: true })
      expect(policy({ file_path: 'tests/index.ts' }).allowed).toBe(false)
    })

    it('accepts single pattern string directly (shorthand)', () => {

      const policy = ReadPolicy('src/*')
      expect(policy({ file_path: 'src/index.ts' })).toEqual({ allowed: true })
      expect(policy({ file_path: 'docs/index.md' }).allowed).toBe(false)
    })
  })

  describe('explicit format (multi-prop)', () => {

    const GrepPolicy = ToolGuardFactory(['path', 'pattern'])

    describe('syntactic sugar', () => {

      it('accepts wildcard string', () => {

        const policy = GrepPolicy('*')
        expect(policy({ pattern: 'anything', path: 'anywhere' })).toEqual({ allowed: true })
      })

      it('accepts a single rule (record)', () => {

        const policy = GrepPolicy({ path: 'src/*' })
        expect(policy({ pattern: 'anything', path: 'src/file.ts' })).toEqual({ allowed: true })
        expect(policy({ pattern: 'anything', path: 'tests/file.ts' }).allowed).toBe(false)
      })

      it('accepts an array of rules', () => {

        const policy = GrepPolicy([
          { path: 'src/*' },
          { pattern: 'TODO' },
        ])

        expect(policy({ pattern: 'anything', path: 'src/file.ts' })).toEqual({ allowed: true })
        expect(policy({ pattern: 'TODO', path: 'docs/file.md' })).toEqual({ allowed: true })
        expect(policy({ pattern: 'FIXME', path: 'docs/file.md' }).allowed).toBe(false)
      })

      it('accepts PolicyConfig object', () => {

        const policy = GrepPolicy({
          allow: { pattern: '*', path: 'src/*' },
          deny: { pattern: 'password', path: '*' },
        })

        expect(policy({ pattern: 'TODO', path: 'src/file.ts' })).toEqual({ allowed: true })
        expect(policy({ pattern: 'password', path: 'src/file.ts' }).allowed).toBe(false)
      })
    })

    describe('Pattern in rules', () => {

      it('accepts string instead of array in rule props', () => {

        const policy = GrepPolicy({ allow: { pattern: 'TODO', path: 'src/*' } })
        expect(policy({ pattern: 'TODO', path: 'src/file.ts' })).toEqual({ allowed: true })
        expect(policy({ pattern: 'FIXME', path: 'src/file.ts' }).allowed).toBe(false)
      })

      it('accepts array in rule props', () => {

        const policy = GrepPolicy({
          allow: { pattern: ['TODO', 'FIXME'], path: 'src/*' },
        })

        expect(policy({ pattern: 'TODO', path: 'src/file.ts' })).toEqual({ allowed: true })
        expect(policy({ pattern: 'FIXME', path: 'src/file.ts' })).toEqual({ allowed: true })
        expect(policy({ pattern: 'HACK', path: 'src/file.ts' }).allowed).toBe(false)
      })
    })

    describe('optional props (default to wildcard)', () => {

      it('treats missing props as wildcard', () => {

        const policy = GrepPolicy({ allow: { path: 'src/*' } })

        expect(policy({ pattern: 'anything', path: 'src/file.ts' })).toEqual({ allowed: true })
        expect(policy({ pattern: 'password', path: 'src/file.ts' })).toEqual({ allowed: true })
        expect(policy({ pattern: 'anything', path: 'tests/file.ts' }).allowed).toBe(false)
      })
    })

    describe('AND/OR logic', () => {

      it('uses AND within a record (all props must match)', () => {

        const policy = GrepPolicy({
          allow: { pattern: 'TODO', path: 'src/*' },
        })

        expect(policy({ pattern: 'TODO', path: 'src/file.ts' })).toEqual({ allowed: true })
        expect(policy({ pattern: 'FIXME', path: 'src/file.ts' }).allowed).toBe(false)
        expect(policy({ pattern: 'TODO', path: 'docs/file.md' }).allowed).toBe(false)
      })

      it('uses OR between records (any can match)', () => {

        const policy = GrepPolicy({
          allow: [
            { pattern: 'TODO', path: 'src/*' },
            { pattern: 'FIXME', path: 'tests/*' },
          ],
        })

        expect(policy({ pattern: 'TODO', path: 'src/file.ts' })).toEqual({ allowed: true })
        expect(policy({ pattern: 'FIXME', path: 'tests/file.ts' })).toEqual({ allowed: true })
        expect(policy({ pattern: 'TODO', path: 'tests/file.ts' }).allowed).toBe(false)
      })

      it('uses AND for deny (all props must match to deny)', () => {

        const policy = GrepPolicy({
          allow: '*',
          deny: { pattern: 'password', path: '*secret*' },
        })

        expect(policy({ pattern: 'password', path: 'src/file.ts' })).toEqual({ allowed: true })
        expect(policy({ pattern: 'TODO', path: 'src/secret/file.ts' })).toEqual({ allowed: true })
        expect(policy({ pattern: 'password', path: 'src/secret/file.ts' }).allowed).toBe(false)
      })

      it('uses OR between deny records', () => {

        const policy = GrepPolicy({
          allow: '*',
          deny: [
            { pattern: 'password', path: '*' },
            { pattern: '*', path: '*node_modules*' },
          ],
        })

        expect(policy({ pattern: 'password', path: 'src/file.ts' }).allowed).toBe(false)
        expect(policy({ pattern: 'TODO', path: 'node_modules/pkg/file.js' }).allowed).toBe(false)
        expect(policy({ pattern: 'TODO', path: 'src/file.ts' })).toEqual({ allowed: true })
      })
    })

    describe('wildcard allow', () => {

      it('allows everything with allow: "*"', () => {

        const policy = GrepPolicy({ allow: '*' })
        expect(policy({ pattern: 'anything', path: 'anywhere/file.ts' })).toEqual({ allowed: true })
      })

      it('can be combined with deny', () => {

        const policy = GrepPolicy({
          allow: '*',
          deny: { pattern: 'secret', path: '*' },
        })

        expect(policy({ pattern: 'TODO', path: 'src/file.ts' })).toEqual({ allowed: true })
        expect(policy({ pattern: 'secret', path: 'src/file.ts' }).allowed).toBe(false)
      })
    })
  })

  describe('edge cases', () => {

    describe('single-prop policy', () => {

      const ReadPolicy = ToolGuardFactory(['path'])

      it('handles empty string values', () => {

        const strict = ReadPolicy({ allow: 'src/*' })
        expect(strict({ path: '' }).allowed).toBe(false)

        const wildcard = ReadPolicy({ allow: '*' })
        expect(wildcard({ path: '' })).toEqual({ allowed: true })
      })

      it('handles missing input props as empty string', () => {

        const strict = ReadPolicy({ allow: 'src/*' })
        expect(strict({}).allowed).toBe(false)

        const wildcard = ReadPolicy({ allow: '*' })
        expect(wildcard({})).toEqual({ allowed: true })
      })

      it('coerces non-string values to string', () => {

        const CountPolicy = ToolGuardFactory(['count'])
        const policy = CountPolicy({ allow: '123' })
        expect(policy({ count: 123 })).toEqual({ allowed: true })
        expect(policy({ count: 456 }).allowed).toBe(false)
      })

      it('returns helpful reason and suggestion on deny', () => {

        const policy = ReadPolicy({ allow: 'src/*' })
        const result = policy({ path: 'tests/file.ts' })

        expect(result.allowed).toBe(false)
        if (!result.allowed) {

          expect(result.reason).toContain('not in allow list')
          expect(result.suggestion).toContain('tests/file.ts')
          expect(result.suggestion).toContain('allow')
        }
      })

      it('returns pattern info when denied by deny rule', () => {

        const policy = ReadPolicy({ allow: '*', deny: '*secret*' })
        const result = policy({ path: 'src/secret/file.ts' })

        expect(result.allowed).toBe(false)
        if (!result.allowed) {

          expect(result.reason).toContain('*secret*')
          expect(result.suggestion).toContain('deny')
        }
      })

      it('omitted deny allows everything', () => {

        const policy = ReadPolicy({ allow: '*' })
        expect(policy({ path: 'anything' })).toEqual({ allowed: true })
      })
    })

    describe('path extractor suggestions', () => {

      const PathPolicy = ToolGuardFactory([{ name: 'file_path', type: 'path' }])

      it('suggests exact path and glob for nested paths', () => {

        const policy = PathPolicy({ allow: 'src/*' })
        const result = policy({ file_path: 'docs/guide.md' })

        expect(result.allowed).toBe(false)
        if (!result.allowed)
          expect(result.suggestion).toBe(`Add 'docs/guide.md' or 'docs/*' to allow.file_path`)
      })

      it('suggests exact path and * for root-level files', () => {

        const policy = PathPolicy({ allow: 'src/*' })
        const result = policy({ file_path: 'README.md' })

        expect(result.allowed).toBe(false)
        if (!result.allowed)
          expect(result.suggestion).toBe(`Add 'README.md' or '*' to allow.file_path`)
      })

      it('suggests * for empty path value', () => {

        const policy = PathPolicy({ allow: 'src/*' })
        const result = policy({})

        expect(result.allowed).toBe(false)
        if (!result.allowed)
          expect(result.suggestion).toBe(`Add '*' to allow.file_path`)
      })

      it('suggests external: with resolved absolute for absolute paths', () => {

        const policy = PathPolicy({ allow: 'src/*' })
        const result = policy({ file_path: '/etc/hosts' })

        expect(result.allowed).toBe(false)
        if (!result.allowed)
          expect(result.suggestion).toBe(`Add 'external:/etc/hosts' or 'external:/etc/*' to allow.file_path`)
      })

      it('suggests external: with resolved absolute for traversal paths', () => {

        const projectPath = process.cwd()
        const parentDir = projectPath.slice(0, projectPath.lastIndexOf('/'))

        const policy = PathPolicy({ allow: 'src/*' })
        const result = policy({ file_path: '../secret.txt' })

        expect(result.allowed).toBe(false)
        if (!result.allowed)
          expect(result.suggestion).toBe(`Add 'external:${parentDir}/secret.txt' or 'external:${parentDir}/*' to allow.file_path`)
      })
    })

    describe('multi-prop policy', () => {

      const GrepPolicy = ToolGuardFactory(['path', 'pattern'])

      it('handles missing input props as empty string', () => {

        const policy = GrepPolicy('*')
        expect(policy({})).toEqual({ allowed: true })
      })

      it('returns helpful reason with prop name on deny', () => {

        const policy = GrepPolicy({ path: 'src/*' })
        const result = policy({ pattern: 'TODO', path: 'tests/file.ts' })

        expect(result.allowed).toBe(false)
        if (!result.allowed) {

          expect(result.reason).toContain('path')
          expect(result.suggestion).toContain('tests/file.ts')
        }
      })

      it('wildcard in one prop still requires other props to match', () => {

        const policy = GrepPolicy({ pattern: '*', path: 'src/*' })
        expect(policy({ pattern: 'anything', path: 'src/file.ts' })).toEqual({ allowed: true })
        expect(policy({ pattern: 'anything', path: 'tests/file.ts' }).allowed).toBe(false)
      })

      it('all props with same value', () => {

        const policy = ToolGuardFactory(['a', 'b'])({ a: 'x', b: 'x' })
        expect(policy({ a: 'x', b: 'x' })).toEqual({ allowed: true })
        expect(policy({ a: 'x', b: 'y' }).allowed).toBe(false)
      })

      it('one prop missing in rule, one present', () => {

        const policy = ToolGuardFactory(['a', 'b'])({ a: 'x' }) // b defaults to '*'
        expect(policy({ a: 'x' })).toEqual({ allowed: true })
        expect(policy({ a: 'x', b: 'anything' })).toEqual({ allowed: true })
        expect(policy({ a: 'y', b: 'anything' }).allowed).toBe(false)
      })

      it('both props missing in input', () => {

        const strict = ToolGuardFactory(['a', 'b'])({ a: 'x' })
        expect(strict({}).allowed).toBe(false)

        const wildcard = ToolGuardFactory(['a', 'b'])('*')
        expect(wildcard({})).toEqual({ allowed: true })
      })
    })

    describe('allow/deny priority', () => {

      const ReadPolicy = ToolGuardFactory(['path'])

      it('deny takes precedence over allow when both match', () => {

        const policy = ReadPolicy({ allow: 'src/*', deny: 'src/*' })
        expect(policy({ path: 'src/file.ts' }).allowed).toBe(false)
      })

      it('checks allow before deny (deny ignored if allow fails)', () => {

        const policy = ReadPolicy({ allow: 'src/*', deny: '*' })
        const result = policy({ path: 'other/file.ts' })

        expect(result.allowed).toBe(false)
        if (!result.allowed)
          expect(result.reason).toContain('allow')
      })

      it('evaluation order: allow first, then deny', () => {

        const policy = ReadPolicy({ allow: '*', deny: 'secret/*' })
        expect(policy({ path: 'public/file.ts' })).toEqual({ allowed: true })
        expect(policy({ path: 'secret/file.ts' }).allowed).toBe(false)
      })
    })

    describe('empty allow array (fail-safe)', () => {

      it('denies everything when allow is empty', () => {

        const ReadPolicy = ToolGuardFactory(['path'])
        const policy = ReadPolicy({ allow: [] })
        expect(policy({ path: 'anything' }).allowed).toBe(false)
      })

      it('empty allow with deny still denies everything', () => {

        const ReadPolicy = ToolGuardFactory(['path'])
        const policy = ReadPolicy({ allow: [], deny: ['secret'] })
        expect(policy({ path: 'public' }).allowed).toBe(false)
        expect(policy({ path: 'secret' }).allowed).toBe(false)
      })
    })

    describe('invalid inputs', () => {

      it('handles null in input object (coerced to empty string)', () => {

        const ReadPolicy = ToolGuardFactory(['path'])
        const policy = ReadPolicy({ allow: '*' })
        // eslint-disable-next-line no-restricted-syntax -- testing null handling
        expect(policy({ path: null as unknown as string })).toEqual({ allowed: true })
      })

      it('handles undefined in input object', () => {

        const ReadPolicy = ToolGuardFactory(['path'])
        const policy = ReadPolicy({ allow: '*' })
        expect(policy({ path: undefined as unknown as string })).toEqual({ allowed: true })
      })

      it('handles object value (coerced to string)', () => {

        const ReadPolicy = ToolGuardFactory(['path'])
        const policy = ReadPolicy({ allow: '*object*' })
        expect(policy({ path: {} as unknown as string })).toEqual({ allowed: true })
      })

      it('handles array value (coerced to string)', () => {

        const ReadPolicy = ToolGuardFactory(['path'])
        const policy = ReadPolicy({ allow: 'a,b' })
        expect(policy({ path: ['a', 'b'] as unknown as string })).toEqual({ allowed: true })
      })

      it('handles boolean value (coerced to string)', () => {

        const ReadPolicy = ToolGuardFactory(['path'])
        const policy = ReadPolicy({ allow: 'true' })
        expect(policy({ path: true as unknown as string })).toEqual({ allowed: true })
        expect(policy({ path: false as unknown as string }).allowed).toBe(false)
      })
    })
  })

  describe('policy composition', () => {

    const ReadPolicy = ToolGuardFactory(['path'])

    it('single argument works the same (backward compatible)', () => {

      const guard = ReadPolicy({ allow: 'src/*', deny: '*.env' })
      expect(guard({ path: 'src/file.ts' })).toEqual({ allowed: true })
      expect(guard({ path: 'src/.env' }).allowed).toBe(false)
      expect(guard({ path: 'docs/file.ts' }).allowed).toBe(false)
    })

    it('first-match: first scoped policy whose allow matches decides', () => {

      const guard = ReadPolicy(
        { allow: 'src/*' },
        { allow: 'tests/*' },
      )

      expect(guard({ path: 'src/file.ts' })).toEqual({ allowed: true })
      expect(guard({ path: 'tests/file.ts' })).toEqual({ allowed: true })
      expect(guard({ path: 'docs/file.md' }).allowed).toBe(false)
    })

    it('scoped deny does not leak to other policies', () => {

      const guard = ReadPolicy(
        { allow: 'src/**', deny: '*test*' },
        { allow: 'tests/**' },
      )

      // Policy A allows, no deny match
      expect(guard({ path: 'src/file.ts' })).toEqual({ allowed: true })
      // Policy A allows, deny matches
      expect(guard({ path: 'src/file.test.ts' }).allowed).toBe(false)
      // Policy A skip, Policy B allows
      expect(guard({ path: 'tests/file.ts' })).toEqual({ allowed: true })
      // Policy A skip, Policy B allows (A deny does not leak)
      expect(guard({ path: 'tests/file.test.ts' })).toEqual({ allowed: true })
    })

    it('order matters: first matching policy wins', () => {

      const guard = ReadPolicy(
        { allow: 'src/**', deny: '*.ts' },
        { allow: 'src/**' },
      )

      // Policy A allows, deny matches → DENIED (Policy B not tried)
      expect(guard({ path: 'src/file.ts' }).allowed).toBe(false)
    })

    it('global deny: deny-only policy filters after first-match', () => {

      const guard = ReadPolicy(
        { allow: 'src/**' },
        { allow: 'tests/**' },
        { deny: '*.env' },
      )

      expect(guard({ path: 'src/file.ts' })).toEqual({ allowed: true })
      expect(guard({ path: 'tests/file.ts' })).toEqual({ allowed: true })
      expect(guard({ path: 'src/.env' }).allowed).toBe(false)
      expect(guard({ path: 'tests/.env' }).allowed).toBe(false)
    })

    it('global deny message is distinct from scoped deny', () => {

      const guard = ReadPolicy(
        { allow: '*' },
        { deny: '*.env' },
      )

      const result = guard({ path: 'src/.env' })
      expect(result.allowed).toBe(false)
      if (!result.allowed)
        expect(result.reason).toContain('global deny')
    })

    it('global deny position in variadic does not matter', () => {

      const guard = ReadPolicy(
        { deny: '*.env' },
        { allow: 'src/**' },
        { allow: 'tests/**' },
      )

      expect(guard({ path: 'src/file.ts' })).toEqual({ allowed: true })
      expect(guard({ path: 'src/.env' }).allowed).toBe(false)
    })

    it('deny-only alone denies everything (no scoped policies)', () => {

      const guard = ReadPolicy({ deny: '*.env' })

      expect(guard({ path: 'src/file.ts' }).allowed).toBe(false)
      expect(guard({ path: '.env' }).allowed).toBe(false)

      const result = guard({ path: 'anything' })
      if (!result.allowed)
        expect(result.reason).toBe('No allow rules defined')
    })

    it('invalid input in variadic returns error guard', () => {

      const guard = ReadPolicy(
        { allow: 'src/**' },
        // @ts-expect-error - testing invalid runtime input
        123,
      )

      const result = guard({ path: 'src/file.ts' })
      expect(result.allowed).toBe(false)
      if (!result.allowed)
        expect(result.reason).toContain('Invalid policy config')
    })
  })

  describe('type safety', () => {

    it('rejects mixed rule/config objects at compile time', () => {

      const GrepPolicy = ToolGuardFactory(['path', 'pattern'])

      // Valid configs
      GrepPolicy({ path: 'src/*' })
      GrepPolicy({ allow: '*' })
      GrepPolicy({ allow: { path: 'src/*' } })

      // @ts-expect-error - mixing rule props with config props is forbidden
      GrepPolicy({ path: 'src/*', allow: '*' })

      // @ts-expect-error - mixing rule props with config props is forbidden
      GrepPolicy({ pattern: 'TODO', deny: '*' })
    })

    it('requires at least one prop in MultiRule', () => {

      const GrepPolicy = ToolGuardFactory(['path', 'pattern'])

      // Valid: at least one prop
      GrepPolicy({ path: 'src/*' })
      GrepPolicy({ pattern: 'TODO' })
      GrepPolicy({ pattern: 'TODO', path: 'src/*' })

      // {} is accepted by TypeScript but rejected at runtime by Zod refine
      GrepPolicy({})
    })

    it('empty allow array denies everything (fail-safe)', () => {

      const GrepPolicy = ToolGuardFactory(['path', 'pattern'])

      // Empty allow array is valid (fail-safe: denies everything)
      const policy = GrepPolicy({ allow: [] })
      expect(policy({ path: 'anything', pattern: 'any' }).allowed).toBe(false)
    })

    it('empty rules array denies everything (fail-safe)', () => {

      const GrepPolicy = ToolGuardFactory(['path', 'pattern'])

      // Empty array is Pattern shorthand: [] → { allow: [] } → deny all
      const policy = GrepPolicy([])
      expect(policy({ path: 'anything', pattern: 'any' }).allowed).toBe(false)
    })
  })
})
