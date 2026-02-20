# Reusable policies

Since `guard.config.ts` is plain TypeScript, you can extract reusable deny/allow arrays and share them across guards — both file tools and command templates.

---

## The OneOrMany trap

Before writing reusable policies, understand this critical behavior:

> **Every `*` must consume at least one character.**

This means `*.env` does **NOT** match `.env`. You always need multiple patterns to cover all variants of a file name.

```typescript
// ⚠️ WRONG — does NOT match ".env"
const DENY_ENV = ['*.env']

// ✅ CORRECT — covers all variants
const DENY_ENV = ['.env', '*.env', '.env.*']
```

| Pattern | `.env` | `production.env` | `.env.local` | `.env.production` |
|---------|--------|-------------------|--------------|-------------------|
| `.env` | **yes** | no | no | no |
| `*.env` | **no** | **yes** | no | no |
| `.env.*` | no | no | **yes** | **yes** |

---

## Reusable deny arrays for file tools

```typescript
// deny-patterns.ts

/**
 * Deny all env file variants.
 *
 * Covers:
 * - .env (exact)
 * - *.env (production.env, staging.env, etc.)
 * - .env.* (.env.local, .env.production, etc.)
 */
export const DENY_ENV_FILES = ['.env', '*.env', '.env.*'] as const

/**
 * Deny secret/credential files.
 */
export const DENY_SECRETS = [
  '**/*.pem',
  '**/*.key',
  '**/*.p12',
  '**/*.pfx',
  '**/credentials*',
  '**/secrets/**',
] as const

/**
 * Deny all sensitive files (env + secrets).
 */
export const DENY_SENSITIVE = [
  ...DENY_ENV_FILES,
  ...DENY_SECRETS,
] as const
```

```typescript
// guard.config.ts
import { defineGuard } from 'tool-guard/guard'
import { ReadToolGuard } from 'tool-guard/guards/read'
import { WriteToolGuard } from 'tool-guard/guards/write'
import { EditToolGuard } from 'tool-guard/guards/edit'
import { DENY_SENSITIVE } from './deny-patterns'

export default defineGuard({
  Read: ReadToolGuard({ allow: ['*'], deny: [...DENY_SENSITIVE] }),
  Write: WriteToolGuard({ allow: ['*'], deny: [...DENY_SENSITIVE] }),
  Edit: EditToolGuard({ allow: ['*'], deny: [...DENY_SENSITIVE] }),
})
```

---

## Reusable command arrays for Bash

```typescript
// commands.ts
import { command, spread } from 'tool-guard/command'
import { greedy } from 'tool-guard/extractables/greedy'
import { safeString } from 'tool-guard/extractables/safeString'
import { safeBranch } from 'tool-guard/extractables/safeBranch'
import { safeFilePath } from 'tool-guard/extractables/safeFilePath'
import { safePackage } from 'tool-guard/extractables/safePackage'
import { safeNumber } from 'tool-guard/extractables/safeNumber'

/**
 * Common git commands.
 */
export const GIT_COMMANDS = [
  command`git status`,
  command`git log ${greedy}`,
  command`git diff`,
  command`git diff ${safeFilePath}`,
  command`git add ${spread(safeFilePath)}`,
  command`git commit -m ${safeString}`,
  command`git checkout ${safeBranch}`,
  command`git checkout -b ${safeBranch}`,
  command`git push`,
  command`git push origin ${safeBranch}`,
  command`git pull`,
  command`git merge ${safeBranch}`,
] as const

/**
 * pnpm commands.
 */
export const PNPM_COMMANDS = [
  command`pnpm install`,
  command`pnpm add ${safePackage}`,
  command`pnpm add -D ${safePackage}`,
  command`pnpm test`,
  command`pnpm build`,
  command`pnpm lint`,
] as const

/**
 * Safe read-only shell commands.
 */
export const READONLY_COMMANDS = [
  command`ls`,
  command`ls ${safeFilePath}`,
  command`pwd`,
  command`cat ${safeFilePath}`,
  command`head -n ${safeNumber} ${safeFilePath}`,
  command`tail -n ${safeNumber} ${safeFilePath}`,
] as const
```

```typescript
// guard.config.ts
import { defineGuard } from 'tool-guard/guard'
import { BashToolGuard } from 'tool-guard/guards/bash'
import { GIT_COMMANDS, PNPM_COMMANDS, READONLY_COMMANDS } from './commands'

export default defineGuard({
  Bash: BashToolGuard({
    allow: [
      ...GIT_COMMANDS,
      ...PNPM_COMMANDS,
      ...READONLY_COMMANDS,
    ],
  }),
})
```

---

## Reusable policy objects

Guards and extractable factories both accept **variadic** policy arguments. Instead of spreading pattern arrays into `allow`/`deny`, you can define complete `PolicyDefinition` objects and pass them directly:

```typescript
// policies.ts
import { type PolicyDefinition } from 'tool-guard/policy'

export const ALLOW_ALL: PolicyDefinition<string> = { allow: ['*'] }

export const DENY_ENV: PolicyDefinition<string> = {
  deny: ['.env', '*.env', '.env.*'],
}

export const DENY_SECRETS: PolicyDefinition<string> = {
  deny: ['**/*.pem', '**/*.key', '**/*.p12', '**/credentials*'],
}

/** Compose into a reusable array — spread into any guard or extractable. */
export const SAFE_FILE_POLICIES = [ALLOW_ALL, DENY_ENV, DENY_SECRETS] as const
```

### In guards

```typescript
// guard.config.ts
import { defineGuard } from 'tool-guard/guard'
import { ReadToolGuard } from 'tool-guard/guards/read'
import { WriteToolGuard } from 'tool-guard/guards/write'
import { EditToolGuard } from 'tool-guard/guards/edit'
import { SAFE_FILE_POLICIES } from './policies'

export default defineGuard({
  Read: ReadToolGuard(...SAFE_FILE_POLICIES),
  Write: WriteToolGuard(...SAFE_FILE_POLICIES),
  Edit: EditToolGuard(...SAFE_FILE_POLICIES),
})
```

### In extractables

The same policy objects work in extractable factories inside command templates:

```typescript
import { command } from 'tool-guard/command'
import { SafeFilePath } from 'tool-guard/extractables/safeFilePath'
import { ALLOW_ALL, DENY_SECRETS } from './policies'

command`cat ${SafeFilePath(ALLOW_ALL, DENY_SECRETS)}`
```

### Compared to pattern arrays

| Approach | Definition | Usage |
|----------|-----------|-------|
| Pattern arrays | `const DENY = ['.env', '*.env'] as const` | `Guard({ allow: ['*'], deny: [...DENY] })` |
| Policy objects | `const DENY = { deny: ['.env', '*.env'] }` | `Guard(ALLOW_ALL, DENY)` |

Both approaches are valid. Policy objects are more composable when you reuse the same allow/deny combinations across multiple guards.

---

## Mixing both: file policies + command policies

A complete config using reusable arrays across both file tools and Bash:

```typescript
// guard.config.ts
import { defineGuard } from 'tool-guard/guard'
import { BashToolGuard } from 'tool-guard/guards/bash'
import { ReadToolGuard } from 'tool-guard/guards/read'
import { WriteToolGuard } from 'tool-guard/guards/write'
import { EditToolGuard } from 'tool-guard/guards/edit'
import { GlobToolGuard } from 'tool-guard/guards/glob'
import { GrepToolGuard } from 'tool-guard/guards/grep'
import { DENY_SENSITIVE } from './deny-patterns'
import { GIT_COMMANDS, PNPM_COMMANDS, READONLY_COMMANDS } from './commands'

export default defineGuard({
  Read: ReadToolGuard({ allow: ['*'], deny: [...DENY_SENSITIVE] }),
  Write: WriteToolGuard({ allow: ['*'], deny: [...DENY_SENSITIVE] }),
  Edit: EditToolGuard({ allow: ['*'], deny: [...DENY_SENSITIVE] }),
  Glob: GlobToolGuard({ allow: ['*'] }),
  Grep: GrepToolGuard({ allow: ['*'] }),

  Bash: BashToolGuard({
    allow: [
      ...GIT_COMMANDS,
      ...PNPM_COMMANDS,
      ...READONLY_COMMANDS,
    ],
  }),

  WebFetch: true,
  WebSearch: true,
  Task: true,
})
```

---

## Preset: Vite env files

Vite uses these env file patterns ([docs](https://vite.dev/guide/env-and-mode)):

| File | Loaded |
|------|--------|
| `.env` | Always |
| `.env.local` | Always, git-ignored |
| `.env.[mode]` | Only in specified mode |
| `.env.[mode].local` | Only in specified mode, git-ignored |

Because of **OneOrMany**, a single pattern like `*.env` won't match `.env`. Here's a complete preset:

```typescript
/**
 * Deny all Vite env files.
 *
 * Covers the 4 Vite patterns:
 * - .env                    → exact match
 * - .env.local              → .env.* pattern
 * - .env.development        → .env.* pattern
 * - .env.production         → .env.* pattern
 * - .env.staging            → .env.* pattern
 * - .env.development.local  → .env.* pattern
 * - .env.production.local   → .env.* pattern
 * - database.env            → *.env pattern
 *
 * Also matches deeply nested variants:
 * - config/.env             → **\/.env pattern
 * - packages/app/.env.local → **\/.env.* pattern
 */
export const DENY_VITE_ENV = [
  // Root level
  '.env',       // exact: .env
  '*.env',      // suffixed: production.env, staging.env
  '.env.*',     // prefixed: .env.local, .env.production, .env.development.local

  // Nested in subdirectories
  '**/.env',    // nested exact: config/.env, packages/app/.env
  '**/*.env',   // nested suffixed: config/production.env
  '**/.env.*',  // nested prefixed: packages/app/.env.local
] as const
```

Usage:

```typescript
import { defineGuard } from 'tool-guard/guard'
import { ReadToolGuard } from 'tool-guard/guards/read'
import { WriteToolGuard } from 'tool-guard/guards/write'
import { EditToolGuard } from 'tool-guard/guards/edit'
import { DENY_VITE_ENV } from './deny-patterns'

export default defineGuard({
  Read: ReadToolGuard({ allow: ['*'], deny: [...DENY_VITE_ENV] }),
  Write: WriteToolGuard({ allow: ['*'], deny: [...DENY_VITE_ENV] }),
  Edit: EditToolGuard({ allow: ['*'], deny: [...DENY_VITE_ENV] }),
})
```

### What it blocks

| File | Blocked? | Matched by |
|------|----------|------------|
| `.env` | **yes** | `.env` (exact) |
| `.env.local` | **yes** | `.env.*` |
| `.env.development` | **yes** | `.env.*` |
| `.env.production` | **yes** | `.env.*` |
| `.env.staging` | **yes** | `.env.*` |
| `.env.development.local` | **yes** | `.env.*` |
| `.env.production.local` | **yes** | `.env.*` |
| `database.env` | **yes** | `*.env` |
| `config/.env` | **yes** | `**/.env` |
| `packages/app/.env.local` | **yes** | `**/.env.*` |
| `src/app.ts` | no | — |
| `.envrc` | no | — (not `.env.*`, the `rc` is after `env` not after `.env.`) |

### Important: `.envrc` is NOT matched

`.envrc` does **not** match `.env.*` because picomatch treats `.` as a literal character. `.env.*` matches `.env.` followed by one or more characters. `.envrc` is `.env` followed by `rc` without a `.` separator — it matches `*.env*` but not `.env.*`.

If you also want to block `.envrc` (used by direnv), add it explicitly:

```typescript
export const DENY_VITE_ENV_PLUS_DIRENV = [
  ...DENY_VITE_ENV,
  '.envrc',
  '**/.envrc',
] as const
```
