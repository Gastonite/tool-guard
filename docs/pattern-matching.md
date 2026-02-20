# Pattern matching

Three systems, each designed for a specific context:

| System | Used by | `*` behavior | Example |
|--------|---------|-------------|---------|
| [String glob](#string-glob) | Non-path fields, extractable policies | Matches everything | `git *` matches `git status` |
| [Path patterns](#path-patterns-picomatch) | File tool guards, path extractables | Stops at `/` | `src/*.ts` matches `src/app.ts` but not `src/utils/app.ts` |
| [Command patterns](#command-patterns) | Bash guard | N/A (uses extractables) | `` command`git commit -m ${safeString}` `` |

---

## String glob

The simplest matching: `*` matches **any characters** — including `/`, spaces, and dots. No regex, no path awareness, just fast string matching.

Used for:
- **Guard fields without a custom factory** — `WebFetchToolGuard` (url), `WebSearchToolGuard` (query), `TaskToolGuard` (subagent_type), `LSPToolGuard` (operation), etc.
- **Extractable policies** — restricting what `Greedy`, `SafeString`, `SafeNumber`, and other non-path extractables accept in [command templates](./command-templates.md)

### The `*` wildcard

`*` matches any characters. Consecutive wildcards are collapsed (`**` = `*` — no semantic distinction).

Without wildcard, the pattern requires an exact match.

### OneOrMany — `*` always consumes at least 1 character

**This is critical.** Every `*` must consume **at least one character**. This is consistent across the entire library — greedy extraction, spread, charset extraction all require at least one match.

| Pattern | Value | Match? | Why |
|---------|-------|--------|-----|
| `git *` | `git status` | **yes** | `*` consumes `status` (7 chars) |
| `git *` | `git` | **no** | `*` would consume 0 chars |
| `*.env` | `production.env` | **yes** | `*` consumes `production` |
| `*.env` | `.env` | **no** | `*` would consume 0 chars |
| `.env.*` | `.env.local` | **yes** | `*` consumes `local` |
| `.env.*` | `.env.` | **no** | `*` would consume 0 chars |
| `*.ts` | `.ts` | **no** | `*` would consume 0 chars |
| `*` | `anything` | **yes** | `*` consumes `anything` |
| `*` | `` | **no** | `*` would consume 0 chars |
| `a*a` | `aa` | **no** | `*` would consume 0 chars |
| `a*b*c` | `aXXbYYc` | **yes** | first `*` consumes `XX`, second consumes `YY` |

### Implications for env file patterns

Because of OneOrMany, you need **multiple patterns** to cover all env file variants:

```typescript
// WRONG — this does NOT match ".env"
const denyEnv = ['*.env']
//   *.env  → matches "production.env", "staging.env"
//   *.env  → does NOT match ".env" (wildcard needs 1+ char)

// CORRECT — cover all variants explicitly
const denyEnv = ['*.env', '.env', '.env.*']
//   *.env  → matches "production.env", "staging.env"
//   .env   → matches ".env" (exact match, no wildcard)
//   .env.* → matches ".env.local", ".env.production"
```

### To match the zero case, add an exact pattern

When you need `*` to also match "nothing", add a second pattern without the wildcard:

```typescript
// Matches "git status", "git log" — but NOT bare "git"
['git *']

// Matches "git status" AND bare "git"
['git *', 'git']
```

---

## Path patterns (picomatch)

When a `/` matters. Path-aware matching powered by [picomatch](https://github.com/micromatch/picomatch) with `{ dot: true }` — where `*` stops at directory boundaries and `**` crosses them.

Used for:
- **All file tool guards** — `ReadToolGuard`, `WriteToolGuard`, `EditToolGuard`, `MultiEditToolGuard`, `GlobToolGuard`, `GrepToolGuard`, `LSToolGuard`, `LSPToolGuard` (filePath field), `NotebookEditToolGuard`, `NotebookReadToolGuard`
- **Path extractables in command templates** — `SafeFilePath`, `SafeDirectoryPath`, `SafeInternalFilePath`, etc.

### Rules

- `*` matches any characters **except `/`** (single directory level)
- `**` matches any characters **including `/`** (recursive)
- `{a,b}` matches either `a` or `b`
- `!pattern` negates a pattern

| Pattern | Matches | Does NOT match |
|---------|---------|----------------|
| `src/*.ts` | `src/app.ts` | `src/utils/app.ts` |
| `src/**/*.ts` | `src/app.ts`, `src/utils/app.ts` | `tests/app.ts` |
| `**/*.env` | `foo/.env`, `a/b/.env` | `.env` (no directory prefix) |
| `*.env` | `production.env` | `.env` (OneOrMany) |
| `.env` | `.env` | `.env.local` |

### Key difference with string glob

| | String glob | Path patterns |
|--|-------------|---------------|
| `*` matches | Everything (including `/`) | Single directory level |
| `**` | Same as `*` | Recursive (all levels) |
| `{a,b}` | Not supported | Alternation |
| `!pattern` | Not supported | Negation |

### Scope isolation

Path extractables (used in both file tool guards and command templates) enforce **scope isolation** to prevent path traversal:

| Scope | Behavior | Example |
|-------|----------|---------|
| `internal` | Must resolve within project directory | Blocks `../../etc/passwd` |
| `external` | Must be an absolute path | Requires `/usr/bin/node` |
| `internalUnlessExternalPrefixed` | Internal by default, external with `external:` prefix in policies | Default for file tool guards |

The `internalUnlessExternalPrefixed` scope (default for all built-in file tool guards) supports the `external:` prefix in policy patterns:

```typescript
ReadToolGuard({
  allow: ['src/**', 'external:/etc/hosts'],
  //       ^internal    ^external (absolute path)
})
```

### Path types

Path extractables can be restricted to files or directories:

| Type | Behavior |
|------|----------|
| `file` | Rejects empty strings (a file must have a name) |
| `directory` | Accepts empty strings (empty = current directory) |

### Allowed characters

Path extractables only accept: `a-zA-Z0-9`, `_`, `.`, `/`, `-`. All other characters (spaces, shell metacharacters, unicode) are rejected at extraction level.

### Symlink resolution

Paths are resolved through symlinks (including parent directories for non-existent files like Write targets) to prevent bypass via symlinked directories.

**TOCTOU note**: There is an inherent race condition between resolving symlinks and Claude Code using the path. The threat model assumes the attacker does not have local filesystem access.

---

## Command patterns

A different beast entirely. Glob patterns are dangerous for Bash — `git *` would match `git status && rm -rf /`. Command patterns split composed commands, then validate each part independently with [extractables](./extractables.md).

See [command-templates.md](./command-templates.md) for the full documentation.

```typescript
import { command, spread } from 'tool-guard/command'
import { safeString } from 'tool-guard/extractables/safeString'
import { safeFilePath } from 'tool-guard/extractables/safeFilePath'

BashToolGuard({
  allow: [
    command`git status`,                          // exact match
    command`git commit -m ${safeString}`,         // parameterized
    command`git add ${spread(safeFilePath)}`,     // one or more values
  ],
})
```

Key security properties:
- Composition operators are **split**, not glob-matched — `git status && rm -rf /` is never matched as a whole
- Shell metacharacters (`$`, `` ` ``, `<`, `>`, `(`, `)`, `&`) are **blocked** at extraction level
- Quote-aware splitting — operators inside `"..."`, `'...'`, and backticks are not split on
