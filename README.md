# agent-speech-opencode

> **Text-to-speech plugin for OpenCode** — reads AI responses using the native macOS `say` command.

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

### Option A: Plugin mode (automatic speech)

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
agent-speech list-voices          # List installed macOS voices
agent-speech help                 # Show help
```

Popular voices include `Samantha`, `Alex`, `Victoria`, `Daniel`, `Fiona`, and `Tessa`.

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

## License

MIT
