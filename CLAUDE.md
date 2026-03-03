# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Build
npm run build          # Compile TypeScript to dist/
npm run dev            # Watch mode - rebuild on changes

# Testing
npm test               # Run all tests with Vitest
npm run test:ui        # Run tests with Vitest UI
npm run test:coverage  # Run tests with coverage report

# Code Quality
npm run lint           # Lint src/ with ESLint
npm run typecheck      # Type check without emitting files
```

**Run single test file**: `npm test -- <test-file-pattern>`
**Debug test**: Add `.only` to test or use `npm run test:ui`

## Architecture Overview

This is a **macOS text-to-speech plugin** for OpenCode with two integration modes:

1. **Plugin Mode**: `AgentSpeechPlugin` registers `session.idle` hook that automatically TTSs AI responses
2. **MCP Server Mode**: Exposes `speak_text` tool for AI to invoke directly

### Core Modules (`src/core/`)

- **`TextToSpeech`**: Main TTS engine orchestrating speech synthesis
  - Wraps `SayCommand` (macOS `say` process)
  - Applies `ContentFilter` before speaking
  - Handles chunking for long text (max 1000 chars)

- **`ConfigManager`**: Application configuration state
  - Loads from `~/.agent-speech/config.json`
  - Dirty flag pattern for lazy saves
  - Migration support via `version` field

- **`ContentFilter`**: Security and content sanitization
  - Filters sensitive data (API keys, passwords, tokens)
  - Optional code block/command output removal
  - Enforces min/max length constraints

### Infrastructure (`src/infrastructure/`)

- **`SayCommand`**: macOS `say` command wrapper via `spawn()`
  - Chunks long text at sentence boundaries
  - Tracks current process for `stop()` capability
  - Parses `say -v '?'` for voice listing

- **`MCPServer`**: MCP server exposing `speak_text` tool
  - Uses `@modelcontextprotocol/sdk`
  - Stdio transport for communication
  - Validates input with Zod schemas

### Entry Points

- **`src/index.ts`**: Package exports (TTS, ConfigManager, Filter, types)
- **`src/opencode-plugin.ts`**: Plugin export for `~/.config/opencode/plugins/`
- **`src/mcp-server.ts`**: MCP server entry (requires `init()` before use)
- **`src/cli.ts`**: CLI tool for config management

## Key Patterns

### Async Initialization
Many classes require `await init()` before use:
```ts
const config = new ConfigManager();
await config.init();  // Loads config from disk
```

### Error Handling Wrapper
`utils/error-handler.ts` provides `withErrorHandling`:
```ts
return withErrorHandling('operationName', async () => {
  // code that may throw
}, logger);
```

### Content Filtering
Text passes through filter before TTS:
```ts
const { shouldSpeak, text: filtered, reason } = filter.filter(input, config);
if (!shouldSpeak) {
  logger.debug('Skipping speech', { reason });
  return;
}
```

### Test Organization
- Unit tests mirror source structure: `tests/core/config.test.ts`
- Mock external dependencies (fs, logger) with `vi.mock()`
- CLI and MCP server excluded from coverage

## Type System

All types defined in `src/types/index.ts`:
- `AppConfig`: Full config file structure
- `TTSConfig`: Runtime TTS parameters
- `FilterConfig`: Content filtering options
- `VoiceInfo`: Voice metadata from `say` command
- `SpeakTextInput`: MCP tool input schema

## Configuration

Default config location: `~/.agent-speech/config.json`

Key settings:
- `enabled`: Master TTS toggle
- `voice`: macOS voice name (default: "Samantha")
- `rate`: Words per minute, 50-400 (default: 200)
- `volume`: 0-100 (default: 50)
- `minLength`/`maxLength`: Response length filters
- `filters.sensitive`: Redact passwords/keys
- `filters.skipCodeBlocks`: Remove markdown code blocks

## Platform Constraints

- **macOS only**: Uses native `say` command
- **Node 18+**: ES2022 modules, `import`/`export`
- **TypeScript strict mode**: All type errors must be resolved

## Common Tasks

- **Add new filter rule**: Add pattern to `ContentFilter.SENSITIVE_PATTERNS`
- **Change default voice**: Update `DEFAULT_CONFIG` in `core/config.ts`
- **Add CLI command**: Add to `src/commands/` and register in `cli.ts`
- **Mock `SayCommand` in tests**: Use `vi.mock()` on `infrastructure/say.ts`
- **Test MCP tool**: Run MCP server directly with stdio transport
