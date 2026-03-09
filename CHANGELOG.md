# Changelog

## v0.2.5 - 2026-03-09

- Restore npm-only plugin management so users keep `plugin: ["agent-speech-opencode"]` without local clone scripts.
- Update auto-update command to run daily npm global upgrade instead of git pull.
- Adopt `@opencode-ai/plugin` type signatures for stronger plugin typing compatibility.

## v0.2.4 - 2026-03-09

- Add GitHub-first installation and update scripts for npm-free plugin management.
- Add CLI commands to enable/disable daily git-based auto-update via macOS launchd.
- Update README to fully English content and document npm-free update/management flows.

## v0.2.3 - 2026-03-09

- Speak only when assistant output requires a user decision, skipping routine status updates.
- Add decision-intent extraction patterns for English and Korean prompts in speech filtering.
- Add and update plugin/filter tests to cover decision-only speech behavior.
- Add ESLint TypeScript configuration and align lint script with `src/**/*.ts`.

## v0.2.1 - 2026-03-03

- Expand README installation guide for direct setup inside OpenCode CLI terminal.
- Add richer usage documentation with quick verification and tuning commands.
- Add multiple project badges (npm, release, node, platform, OpenCode, MCP, license).

## v0.2.0 - 2026-03-03

- Align OpenCode plugin runtime with official plugin hook model using `event` + `session.idle` handling.
- Switch session lookup to OpenCode SDK-style `client.session.messages({ path: { id } })` flow.
- Make npm plugin loading reliable by pointing package root export to `opencode-plugin` entry.
- Add plugin-focused automated tests for idle event speech trigger and compatibility behavior.
- Update README with official npm plugin configuration and migration notes from claude-code variant.
