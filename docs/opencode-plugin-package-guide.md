# OpenCode Plugin Package Guide (Official Model + This Repository)

This document explains how OpenCode officially loads plugins and how to package or install `@welico/agent-speech-opencode` accordingly.

Source of truth: `https://opencode.ai/docs/plugins/`.

## Does OpenCode provide an official plugin package guide?

Yes. OpenCode has official plugin documentation at `https://opencode.ai/docs/plugins/`.

It covers:

- Where plugins are loaded from (global/project directories)
- How npm plugins are declared in OpenCode config
- Plugin function shape (context input + hook object return)
- Dependency handling for local plugins
- Hook/event names and examples

## Official Loading Model

OpenCode supports two plugin sources:

1. Local plugin files (auto-loaded)
2. npm plugin packages (declared in config)

### Local plugin directories

- Project level: `.opencode/plugins/`
- Global level: `~/.config/opencode/plugins/`

Files in these paths are loaded automatically at startup.

### npm plugins in OpenCode config

Add package names to the `plugin` array in `opencode.json` or `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "@welico/agent-speech-opencode",
    "@my-org/custom-plugin"
  ]
}
```

OpenCode installs npm plugins automatically and caches dependencies under `~/.cache/opencode/node_modules/`.

## Official Plugin Function Shape

Per official docs, a plugin is a JavaScript/TypeScript module that exports one or more plugin functions.

Basic pattern:

```ts
export const MyPlugin = async ({ project, client, $, directory, worktree }) => {
  return {
    "session.idle": async (input) => {
      // hook implementation
    }
  }
}
```

The plugin function receives context, then returns an object whose keys are hook names.

## Dependencies for Local Plugins

If a local plugin file imports external npm packages, add `.opencode/package.json` and declare dependencies there.

Example:

```json
{
  "dependencies": {
    "shescape": "^2.1.0"
  }
}
```

OpenCode runs `bun install` at startup for this configuration directory dependency setup.

## Load Order (Official)

OpenCode load order is:

1. `~/.config/opencode/opencode.json` (global config)
2. `opencode.json` (project config)
3. `~/.config/opencode/plugins/` (global plugin directory)
4. `.opencode/plugins/` (project plugin directory)

## Applying the Official Model to @welico/agent-speech-opencode

This repository exports `AgentSpeechPlugin` and can be consumed in practical OpenCode setups.

### Recommended installation (local plugin file using npm package)

```bash
npm install -g @welico/agent-speech-opencode
mkdir -p ~/.config/opencode/plugins
```

Create `~/.config/opencode/plugins/agent-speech.js`:

```js
import { AgentSpeechPlugin } from "@welico/agent-speech-opencode"

export default AgentSpeechPlugin
```

This follows OpenCode's local plugin loading path while reusing the npm package code.

### MCP server mode (for explicit tool-based speech)

If you want explicit MCP tool calls (`speak_text`) instead of event-hook-only speech, configure the MCP server:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "agent-speech": {
      "type": "local",
      "command": ["node", "/ABSOLUTE/PATH/TO/agent-speech-opencode/dist/mcp-server.js"],
      "enabled": true
    }
  }
}
```

Use an absolute path for `dist/mcp-server.js`.

## Packaging Notes for Maintainers

- Keep plugin exports stable from package entry (`src/index.ts` -> `dist/index.js`)
- Keep the plugin hook implementation in `src/opencode-plugin.ts`
- Keep package metadata and exports aligned in `package.json`
- Validate with `npm run build`, `npm run typecheck`, and `npm test`

## References

- Official OpenCode plugin docs: `https://opencode.ai/docs/plugins/`
- Official OpenCode config docs: `https://opencode.ai/docs/config/`
- Project README quick start: `README.md`
