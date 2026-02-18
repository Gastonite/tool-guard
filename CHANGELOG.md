# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com),
and this project adheres to [Semantic Versioning](https://semver.org).

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
