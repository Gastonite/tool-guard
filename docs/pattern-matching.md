# Pattern matching

tool-guard uses two distinct pattern matching systems depending on the context:

- **Glob patterns** (string matching) — for file tools and extractable policies
- **Command patterns** (`command` template) — for Bash commands

---

## Glob patterns — string matching

Used by file tool guards (Read, Write, Edit, Glob, Grep, LS, etc.) and by extractable policies.

### The `*` wildcard

`*` matches **any characters** including `/`, spaces, and dots. Consecutive wildcards are collapsed (`**` = `*`).

This is **string matching, not path matching**. There is no distinction between `*` and `**` — both match any characters. For path-aware matching (where `*` matches a single directory level), file tool guards use [picomatch](https://github.com/micromatch/picomatch) internally.

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
// ⚠️ WRONG — this does NOT match ".env"
const denyEnv = ['*.env']
//   *.env  → matches "production.env", "staging.env"
//   *.env  → does NOT match ".env" (wildcard needs 1+ char)

// ✅ CORRECT — cover all variants explicitly
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

## Path matching (file tools)

File tool guards (Read, Write, Edit, etc.) use [picomatch](https://github.com/micromatch/picomatch) for path-aware matching:

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

---

## Command patterns (Bash)

See [command-templates.md](./command-templates.md) for the full `command` template documentation.
