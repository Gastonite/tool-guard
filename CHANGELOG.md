# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com),
and this project adheres to [Semantic Versioning](https://semver.org).

## [1.0.0] - 2026-02-20

### Breaking changes

- **`PolicyInput` merged into `PolicyDefinition`** — `PolicyInput` no longer exists as a separate type. Use `PolicyDefinition` everywhere.
- **`PolicyEvaluator` replaced by `PolicyFactory`/`MergedPolicy`** — the legacy `PolicyEvaluator` class-like API is removed. Use the composable `PolicyFactory()` and `MergedPolicy()` functions instead.
- **`Rule` module removed** — `src/rule.ts`, `src/validation/rule.ts` and their tests are deleted. Policy evaluation is now handled entirely by `PolicyDefinition`.
- **`parseStringPolicies` removed** — `src/utilities/parseStringPolicies.ts` is deleted. String policies are now parsed inline via Zod schemas.
- **`globPolicyEvaluator` renamed to `globPolicy`** — import path changes from `tool-guard/globPolicyEvaluator` to `tool-guard/globPolicy`.
- **`validation/stringPattern` removed** — merged into `validation/policy.ts`.
- **`Validator`/`Validable`/`ValidableFactory` generics changed** — now use `<TValue = any>` default (bivariance) instead of `unknown`. `ValidableFactory` gains a `TPattern` generic: `ValidableFactory<TPattern = unknown, TValue = any>`.
- **`CommandValidable` signature changed** — accepts `PolicyDefinition` object (`{ allow: [...] }`) instead of a raw array.

### Refactoring

- Composable policy system: `PolicyFactory(matcher)` creates a policy function, `MergedPolicy(...policies)` composes them with first-match semantics.
- `Validator<TValue>`, `Validable<TValue>`, `ValidableFactory<TPattern, TValue>` — full generic chain, no phantom types, no `value as string` casts.
- `Extractable` typed as `Validable<string>` (was untyped `Validable`).
- All validate functions (`charset`, `fixedLength`, `path`, `greedy`, `safeString`, `validateWithPolicies`) receive `value: string` directly — no more `value as string` casts.
- `GlobValidable` typed as `ValidableFactory<string, string>`, `CommandValidable` as `ValidableFactory<CommandPattern, string>`.
- ESLint and tsconfig now include `scripts/`.

### Documentation

- README restructured: single ultra-complete config example with shared `PolicyDefinition` arrays between guards and extractables.
- `docs/pattern-matching.md` restructured into 3 sections: string glob, path patterns (picomatch), command patterns.
- `docs/logging.md` created (extracted from README).
- Vite env preset fixed: only blocks `.local` files (the actual secrets).
- Punchy intros with short code examples added to every doc page.

## [0.1.0] - 2026-02-17

### Added

- Initial release
- Declarative permission system for Claude Code via PreToolUse hooks
- Guard factories for all built-in tools (Bash, Read, Write, Edit, Glob, Grep, etc.)
- SAFE_* placeholders for injection-proof command validation
- Quote-aware command parsing with composition splitting (`&&`, `||`, `|`, `;`)
- Glob-based pattern matching for file tools
- Path traversal protection via SAFE_INTERNAL_FILE_PATH / SAFE_EXTERNAL_FILE_PATH
- Deny-by-default policy (unconfigured tools are blocked)
- TypeScript config with full autocompletion
- Configurable logging to `.claude/logs/guard.log`
