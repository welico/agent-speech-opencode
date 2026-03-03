import { describe, it, expect, vi, beforeEach } from 'vitest';

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
    });
  });

  it('speaks the latest assistant message on session.idle event', async () => {
    const messages = [
      { info: { role: 'user' }, parts: [{ type: 'text', text: 'hello' }] },
      { info: { role: 'assistant' }, parts: [{ type: 'text', text: 'latest response' }] },
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
      'latest response',
      expect.objectContaining({ voice: 'Samantha', rate: 200, volume: 50 })
    );
  });

  it('supports sessionId fallback property name', async () => {
    const client = {
      session: {
        messages: vi.fn().mockResolvedValue({
          data: [{ role: 'assistant', parts: [{ type: 'text', text: 'fallback id' }] }],
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
});
