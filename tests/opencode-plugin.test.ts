import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockSpeak = vi.fn().mockResolvedValue(undefined);
const mockConfigInit = vi.fn().mockResolvedValue(undefined);
const mockGetAll = vi.fn();

vi.mock('../src/core/tts.js', () => ({
  TextToSpeech: vi.fn().mockImplementation(function MockTextToSpeech() {
    return {
      speak: mockSpeak,
    };
  }),
}));

vi.mock('../src/core/config.js', () => ({
  ConfigManager: vi.fn().mockImplementation(function MockConfigManager() {
    return {
      init: mockConfigInit,
      getAll: mockGetAll,
    };
  }),
}));

vi.mock('../src/utils/logger.js', () => ({
  createLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { AgentSpeechPlugin } from '../src/opencode-plugin.js';

describe('AgentSpeechPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAll.mockReturnValue({
      enabled: true,
      voice: 'Samantha',
      rate: 200,
      volume: 50,
      minLength: 10,
      maxLength: 0,
      filters: {
        sensitive: false,
        skipCodeBlocks: false,
        skipCommands: false,
      },
      language: 'auto',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('speaks when assistant message requires user decision', async () => {
    const messages = [
      { info: { role: 'user' }, parts: [{ type: 'text', text: 'hello' }] },
      { info: { role: 'assistant' }, parts: [{ type: 'text', text: 'I found two approaches. Should I proceed with option A or option B?' }] },
    ];

    const client = {
      session: {
        messages: vi.fn().mockResolvedValue({ data: messages }),
      },
    };

    const plugin = await AgentSpeechPlugin({ client });
    await plugin.event?.({
      event: {
        type: 'session.idle',
        properties: { sessionID: 'session-1' },
      },
    });

    expect(client.session.messages).toHaveBeenCalledWith({ path: { id: 'session-1' } });
    expect(mockSpeak).toHaveBeenCalledTimes(1);
    expect(mockSpeak).toHaveBeenCalledWith(
      expect.stringContaining('Should I proceed'),
      expect.objectContaining({ voice: 'Samantha', rate: 200, volume: 50 })
    );
  });

  it('does NOT speak status-only messages without user decision', async () => {
    const messages = [
      { info: { role: 'user' }, parts: [{ type: 'text', text: 'fix the bug' }] },
      { info: { role: 'assistant' }, parts: [{ type: 'text', text: 'Done. The bug has been fixed and all tests pass.' }] },
    ];

    const client = {
      session: {
        messages: vi.fn().mockResolvedValue({ data: messages }),
      },
    };

    const plugin = await AgentSpeechPlugin({ client });
    await plugin.event?.({
      event: {
        type: 'session.idle',
        properties: { sessionID: 'session-1' },
      },
    });

    expect(client.session.messages).toHaveBeenCalledWith({ path: { id: 'session-1' } });
    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it('supports sessionId fallback property name', async () => {
    const client = {
      session: {
        messages: vi.fn().mockResolvedValue({
          data: [{ role: 'assistant', parts: [{ type: 'text', text: 'Would you like me to apply this change?' }] }],
        }),
      },
    };

    const plugin = await AgentSpeechPlugin({ client });
    await plugin.event?.({
      event: {
        type: 'session.idle',
        properties: { sessionId: 'legacy-id' },
      },
    });

    expect(client.session.messages).toHaveBeenCalledWith({ path: { id: 'legacy-id' } });
    expect(mockSpeak).toHaveBeenCalledTimes(1);
  });

  it('does not run for non-session.idle events', async () => {
    const client = {
      session: {
        messages: vi.fn(),
      },
    };

    const plugin = await AgentSpeechPlugin({ client });
    await plugin.event?.({
      event: {
        type: 'session.updated',
      },
    });

    expect(client.session.messages).not.toHaveBeenCalled();
    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it('translates decision text to detected user language before speaking', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [[['이 변경 사항을 적용할까요?', 'Should I apply this change?', null, null, 15]]],
    });
    vi.stubGlobal('fetch', fetchMock);

    const messages = [
      { info: { role: 'user' }, parts: [{ type: 'text', text: '한국어로 말해줘' }] },
      { info: { role: 'assistant' }, parts: [{ type: 'text', text: 'The fix is ready. Should I apply this change?' }] },
    ];

    const client = {
      session: {
        messages: vi.fn().mockResolvedValue({ data: messages }),
      },
    };

    const plugin = await AgentSpeechPlugin({ client });
    await plugin.event?.({
      event: {
        type: 'session.idle',
        properties: { sessionID: 'session-2' },
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('tl=ko');
    expect(mockSpeak).toHaveBeenCalledWith(
      '이 변경 사항을 적용할까요?',
      expect.objectContaining({ voice: 'Samantha', rate: 200, volume: 50 })
    );
  });
});
