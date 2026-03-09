# agent-speech-opencode

> **Text-to-speech plugin for OpenCode** — reads AI responses using the native macOS `say` command.

[![npm version](https://img.shields.io/npm/v/agent-speech-opencode?color=2f81f7&label=npm)](https://www.npmjs.com/package/agent-speech-opencode)
[![npm downloads](https://img.shields.io/npm/dm/agent-speech-opencode?color=2ea043&label=downloads)](https://www.npmjs.com/package/agent-speech-opencode)
[![GitHub release](https://img.shields.io/github/v/release/welico/agent-speech-opencode?color=2f81f7&label=release)](https://github.com/welico/agent-speech-opencode/releases)
[![GitHub last commit](https://img.shields.io/github/last-commit/welico/agent-speech-opencode?color=57606a)](https://github.com/welico/agent-speech-opencode/commits/main)
[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![platform macOS](https://img.shields.io/badge/platform-macOS-000000?logo=apple&logoColor=white)](https://www.apple.com/macos)
[![OpenCode Plugin](https://img.shields.io/badge/OpenCode-Plugin-orange)](https://opencode.ai/docs/plugins)
[![MCP Server](https://img.shields.io/badge/MCP-Server-7c3aed)](https://opencode.ai/docs/mcp-servers)
[![license MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

**Platform**: macOS | **Integration**: OpenCode Plugin + MCP Server

For the official OpenCode plugin model and packaging flow, see `docs/opencode-plugin-package-guide.md`.

---

## Overview

`agent-speech-opencode` adds text-to-speech to OpenCode so assistant responses can be spoken automatically.

It supports two integration modes:

| Mode | Description |
|------|-------------|
| **Plugin** (recommended) | Hooks into `session.idle` and speaks responses automatically when a turn completes. |
| **MCP Server** | Exposes a `speak_text` MCP tool so the assistant can request speech explicitly. |

---

## Quick Start

### Install directly in OpenCode CLI (recommended)

```bash
npm install -g agent-speech-opencode
mkdir -p ~/.config/opencode
```

Add the following to `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["agent-speech-opencode"]
}
```

Restart OpenCode. Speech output starts from the next assistant response.

### Plugin configuration (required)

Your `~/.config/opencode/opencode.json` should contain only the npm plugin name:

No repository clone is required for normal users.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["agent-speech-opencode"]
}
```

Install:

```bash
npm install -g agent-speech-opencode
```

Restart OpenCode. Responses should now be spoken automatically.

### Option A: Local plugin file

Install globally and create a plugin entry file:

```bash
npm install -g agent-speech-opencode
mkdir -p ~/.config/opencode/plugins
```

Create `~/.config/opencode/plugins/agent-speech.js`:

```js
import { AgentSpeechPlugin } from 'agent-speech-opencode';

export default AgentSpeechPlugin;
```

Restart OpenCode. Responses should now be spoken automatically.

### Option B: MCP server mode

Add this to your `opencode.jsonc`:

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

Then trigger it in a prompt, for example: `Say "Hello world"`.

> Important: The MCP `command` path should be an absolute path to `dist/mcp-server.js`.

---

## Installation

### Prerequisites

- macOS 10.15+
- Node.js 18+
- OpenCode

### Install in OpenCode CLI terminal

```bash
npm install -g agent-speech-opencode
agent-speech init
agent-speech status
```

### Upgrade

```bash
npm install -g agent-speech-opencode@latest
```

### Install from source

```bash
git clone https://github.com/welico/agent-speech-opencode.git
cd agent-speech-opencode
npm install
npm run build
```

### Verify installation

```bash
agent-speech status
```

---

## Configuration

Config file location: `~/.agent-speech/config.json`

```json
{
  "version": "1.0.0",
  "enabled": true,
  "voice": "Samantha",
  "rate": 200,
  "volume": 50,
  "minLength": 10,
  "maxLength": 0,
  "filters": {
    "sensitive": false,
    "skipCodeBlocks": false,
    "skipCommands": false
  }
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | `true` | Enable or disable speech globally. |
| `voice` | `"Samantha"` | macOS voice name. |
| `rate` | `200` | Speech rate in words per minute (`50-400`). |
| `volume` | `50` | Volume level (`0-100`). |
| `minLength` | `10` | Minimum text length (`0` disables the minimum). |
| `maxLength` | `0` | Maximum text length (`0` disables the maximum). |
| `filters.sensitive` | `false` | Redact sensitive-looking content before speaking. |
| `filters.skipCodeBlocks` | `false` | Skip Markdown code blocks. |
| `filters.skipCommands` | `false` | Skip command-style output lines. |

---

## Usage

### Basic usage flow

1. Start OpenCode.
2. When a response finishes (`session.idle`), the plugin automatically reads the latest assistant text.
3. If needed, tune voice and speed with commands such as `agent-speech set-voice Alex`.

### Quick checks

```bash
agent-speech status
agent-speech list-voices
agent-speech set-rate 180
agent-speech set-volume 70
```

### Automatic (Plugin mode)

- OpenCode finishes a response.
- The plugin receives the `session.idle` event.
- Filtered text is sent to macOS `say` and played.

### Manual (MCP mode)

- Configure the MCP server in `opencode.jsonc`.
- Ask the model to call speech output (for example: `Say "Deployment completed"`).
- The model can invoke `speak_text` with optional `voice`, `rate`, and `volume`.

---

## CLI Reference

```bash
agent-speech init                 # Initialize config file
agent-speech enable               # Enable speech
agent-speech disable              # Disable speech
agent-speech toggle               # Toggle enabled/disabled
agent-speech status               # Print current config status
agent-speech reset                # Reset config to defaults
agent-speech set-voice <name>     # Set macOS voice
agent-speech set-rate <wpm>       # Set rate (50-400)
agent-speech set-volume <0-100>   # Set volume (0-100)
agent-speech set-language <code>  # Set language (auto, en, ko, ja, zh-CN, es, fr, de, it, ru)
agent-speech list-voices          # List installed macOS voices
agent-speech enable-auto-update   # Enable daily auto-update via launchd
agent-speech disable-auto-update  # Disable daily auto-update via launchd
agent-speech help                 # Show help
```

Popular voices include `Samantha`, `Alex`, `Victoria`, `Daniel`, `Fiona`, and `Tessa`.

---

## Updates

### Do users need to update manually?

By default, yes. Globally installed npm packages do not auto-update on their own.

### Manual update

```bash
npm install -g agent-speech-opencode@latest
```

### Optional automatic updates

Enable daily background updates on macOS:

```bash
agent-speech enable-auto-update
launchctl load -w ~/Library/LaunchAgents/com.welico.agent-speech.update.plist
```

Note: auto-update runs daily `npm install -g agent-speech-opencode@latest`.

Disable automatic updates:

```bash
agent-speech disable-auto-update
launchctl unload -w ~/Library/LaunchAgents/com.welico.agent-speech.update.plist
```

---

## MCP Tool Reference

### `speak_text`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | Text to speak. |
| `voice` | string | No | macOS voice name override. |
| `rate` | number | No | Speech rate (`50-400`). |
| `volume` | number | No | Volume (`0-100`). |

---

## Development

```bash
npm run build
npm run typecheck
npm test
```

Project layout:

```text
src/
├── core/
│   ├── tts.ts
│   ├── config.ts
│   └── filter.ts
├── infrastructure/
│   ├── say.ts
│   ├── fs.ts
│   └── mcp-server.ts
├── utils/
│   ├── logger.ts
│   ├── error-handler.ts
│   ├── schemas.ts
│   └── format.ts
├── commands/
├── opencode-plugin.ts
├── mcp-server.ts
├── cli.ts
└── index.ts
```

---

## Troubleshooting

### No speech output

1. Check status: `agent-speech status`
2. Enable speech: `agent-speech enable`
3. Check system volume in macOS
4. Test voice directly: `say -v Samantha "test"`

### `say: command not found`

This package is macOS-only. The `say` command is not available on Linux or Windows.

### Debug logging

```bash
DEBUG=true LOG_LEVEL=debug node dist/mcp-server.js
tail -f /tmp/agent-speech-debug.log
```

---

## Migration from agent-speech-claude-code

- The plugin now handles `session.idle` through the OpenCode `event` hook model.
- Session lookup uses OpenCode SDK-style `client.session.messages({ path: { id } })`.
- npm installation auto-loads through the `plugin` array with `agent-speech-opencode`.

---

## License

MIT
