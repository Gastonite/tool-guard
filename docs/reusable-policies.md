# Reusable policies

`guard.config.ts` is plain TypeScript. Extract reusable arrays, compose them, share them across guards and extractables.

```typescript
const DENY_SECRETS = ['.env', '*.env', '.env.*', '**/*.pem'] as const

ReadToolGuard({ allow: ['*'], deny: [...DENY_SECRETS] })
WriteToolGuard({ allow: ['src/**'], deny: [...DENY_SECRETS] })
```

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

## Full config: file policies + command policies

Bringing it all together — file tools and Bash sharing the same deny lists:

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

## Preset: Vite env secrets

Vite uses these env file patterns ([docs](https://vite.dev/guide/env-and-mode)):

| File | Loaded | Sensitive? |
|------|--------|------------|
| `.env` | Always | No — committed to git |
| `.env.local` | Always, **git-ignored** | **Yes** |
| `.env.[mode]` | Only in specified mode | No — committed to git |
| `.env.[mode].local` | Only in specified mode, **git-ignored** | **Yes** |

Only `.local` files contain secrets. The others (`.env`, `.env.development`, `.env.production`) are meant to be committed and typically contain non-sensitive defaults.

```typescript
/**
 * Deny Vite env secrets (.local files only).
 *
 * Covers:
 * - .env.local                   → .env.local (exact)
 * - .env.development.local       → .env.*.local pattern
 * - .env.production.local        → .env.*.local pattern
 * - .env.staging.local           → .env.*.local pattern
 *
 * Also matches deeply nested variants:
 * - config/.env.local            → **\/.env.local pattern
 * - packages/app/.env.prod.local → **\/.env.*.local pattern
 */
export const DENY_VITE_ENV_SECRETS = [
  // Root level
  '.env.local',       // exact: .env.local
  '.env.*.local',     // mode-specific: .env.development.local, .env.production.local

  // Nested in subdirectories
  '**/.env.local',    // nested exact: config/.env.local
  '**/.env.*.local',  // nested mode-specific: packages/app/.env.staging.local
] as const
```

Usage:

```typescript
import { defineGuard } from 'tool-guard/guard'
import { ReadToolGuard } from 'tool-guard/guards/read'
import { WriteToolGuard } from 'tool-guard/guards/write'
import { EditToolGuard } from 'tool-guard/guards/edit'
import { DENY_VITE_ENV_SECRETS } from './deny-patterns'

export default defineGuard({
  Read: ReadToolGuard({ allow: ['*'], deny: [...DENY_VITE_ENV_SECRETS] }),
  Write: WriteToolGuard({ allow: ['*'], deny: [...DENY_VITE_ENV_SECRETS] }),
  Edit: EditToolGuard({ allow: ['*'], deny: [...DENY_VITE_ENV_SECRETS] }),
})
```

### What it blocks

| File | Blocked? | Matched by |
|------|----------|------------|
| `.env.local` | **yes** | `.env.local` (exact) |
| `.env.development.local` | **yes** | `.env.*.local` |
| `.env.production.local` | **yes** | `.env.*.local` |
| `.env.staging.local` | **yes** | `.env.*.local` |
| `config/.env.local` | **yes** | `**/.env.local` |
| `packages/app/.env.prod.local` | **yes** | `**/.env.*.local` |
| `.env` | no | — (committed, not sensitive) |
| `.env.development` | no | — (committed, not sensitive) |
| `.env.production` | no | — (committed, not sensitive) |
| `src/app.ts` | no | — |
