# Changelog

## v0.2.0 - 2026-03-03

- Align OpenCode plugin runtime with official plugin hook model using `event` + `session.idle` handling.
- Switch session lookup to OpenCode SDK-style `client.session.messages({ path: { id } })` flow.
- Make npm plugin loading reliable by pointing package root export to `opencode-plugin` entry.
- Add plugin-focused automated tests for idle event speech trigger and compatibility behavior.
- Update README with official npm plugin configuration and migration notes from claude-code variant.
