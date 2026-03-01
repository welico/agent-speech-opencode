# agent-speech-opencode

> **Text-to-speech plugin for OpenCode** — AI 응답을 macOS 내장 `say` 명령으로 읽어줍니다.

**Platform**: macOS | **Integration**: OpenCode Plugin + MCP Server

---

## Overview

OpenCode에서 AI 응답이 완료되면 자동으로 TTS로 읽어주는 플러그인입니다.

두 가지 통합 방식을 지원합니다:

| 방식 | 설명 |
|------|------|
| **Plugin** (권장) | `session.idle` 이벤트로 자동 TTS — AI 응답 완료 시 자동 실행 |
| **MCP Server** | `speak_text` 도구 — AI가 직접 TTS 호출 가능 |

---

## Quick Start

### Option A: Plugin (자동 TTS)

프로젝트 루트 또는 홈 디렉토리에 플러그인 파일을 배치합니다.

```bash
# 글로벌 설치
npm install -g agent-speech-opencode

# 플러그인 디렉토리 생성
mkdir -p ~/.config/opencode/plugins
```

`~/.config/opencode/plugins/agent-speech.js` 파일 생성:

```js
import { AgentSpeechPlugin } from 'agent-speech-opencode';
export default AgentSpeechPlugin;
```

OpenCode를 재시작하면 AI 응답 완료 시 자동으로 TTS가 실행됩니다.

### Option B: MCP Server

`opencode.jsonc`에 추가:

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

그런 다음 프롬프트에서: **"Say 'Hello World'"**

---

## Installation

### Prerequisites

- **macOS 10.15+**
- **Node.js 18+**
- **OpenCode**

### From Source

```bash
git clone https://github.com/welico/agent-speech-opencode.git
cd agent-speech-opencode
npm install
npm run build
```

---

## Configuration

설정 파일 위치: `~/.agent-speech/config.json`

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

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `enabled` | `true` | TTS 활성화 여부 |
| `voice` | `"Samantha"` | macOS 음성 이름 |
| `rate` | `200` | 말하기 속도 (50-400 WPM) |
| `volume` | `50` | 볼륨 (0-100) |
| `minLength` | `10` | 최소 텍스트 길이 (0 = 제한 없음) |
| `maxLength` | `0` | 최대 텍스트 길이 (0 = 제한 없음) |

---

## CLI Reference

```bash
agent-speech init              # 설정 초기화
agent-speech enable            # TTS 활성화
agent-speech disable           # TTS 비활성화
agent-speech toggle            # 토글
agent-speech status            # 현재 설정 확인
agent-speech reset             # 기본값으로 초기화
agent-speech set-voice <name>  # 음성 설정 (예: Samantha, Alex)
agent-speech set-rate <wpm>    # 속도 설정 (50-400)
agent-speech set-volume <0-100> # 볼륨 설정
agent-speech list-voices       # 사용 가능한 음성 목록
agent-speech help              # 도움말
```

### Voice Selection

```bash
agent-speech list-voices       # macOS 설치된 음성 목록
agent-speech set-voice Alex    # 음성 변경
```

인기 음성: Samantha, Alex, Victoria, Daniel, Fiona, Tessa

---

## MCP Tool Reference

### `speak_text`

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `text` | string | ✓ | 읽을 텍스트 |
| `voice` | string | | 음성 이름 |
| `rate` | number | | 속도 (50-400 WPM) |
| `volume` | number | | 볼륨 (0-100) |

---

## Project Structure

```
src/
├── core/
│   ├── tts.ts           # TTS 엔진
│   ├── config.ts        # 설정 관리
│   └── filter.ts        # 콘텐츠 필터
├── infrastructure/
│   ├── say.ts           # macOS say 커맨드 래퍼
│   ├── fs.ts            # 파일시스템 유틸
│   └── mcp-server.ts    # MCP 서버
├── utils/
│   ├── logger.ts
│   ├── error-handler.ts
│   ├── schemas.ts
│   └── format.ts
├── commands/            # CLI 커맨드
├── opencode-plugin.ts   # OpenCode 플러그인 (session.idle 훅)
├── mcp-server.ts        # MCP 서버 엔트리포인트
├── cli.ts               # CLI 엔트리포인트
└── index.ts             # 패키지 엔트리포인트
```

---

## Troubleshooting

### TTS가 실행되지 않을 때

1. 설정 확인: `agent-speech status`
2. 활성화: `agent-speech enable`
3. 볼륨 확인: macOS 시스템 볼륨 확인
4. 음성 테스트: `say -v Samantha "test"`

### "say command not found"

이 플러그인은 macOS 전용입니다. `say` 커맨드는 macOS에서만 사용 가능합니다.

### 디버그 로그

```bash
DEBUG=true LOG_LEVEL=debug node dist/mcp-server.js
tail -f /tmp/agent-speech-debug.log
```

---

## License

MIT