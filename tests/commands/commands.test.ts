import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockConfigInit,
  mockGetAll,
  mockSpeak,
  mockFormatSuccess,
  mockFormatError,
} = vi.hoisted(() => ({
  mockConfigInit: vi.fn().mockResolvedValue(undefined),
  mockGetAll: vi.fn(),
  mockSpeak: vi.fn().mockResolvedValue(undefined),
  mockFormatSuccess: vi.fn(),
  mockFormatError: vi.fn(),
}));

vi.mock('../../src/core/config.js', () => ({
  ConfigManager: vi.fn().mockImplementation(function MockConfigManager() {
    return {
      init: mockConfigInit,
      getAll: mockGetAll,
    };
  }),
}));

vi.mock('../../src/core/tts.js', () => ({
  TextToSpeech: vi.fn().mockImplementation(function MockTextToSpeech() {
    return {
      speak: mockSpeak,
      getAvailableVoices: vi.fn().mockResolvedValue([]),
    };
  }),
}));

vi.mock('../../src/utils/format.js', () => ({
  formatSuccess: mockFormatSuccess,
  formatError: mockFormatError,
}));

import { cmdSpeak } from '../../src/commands/commands.js';

describe('cmdSpeak', () => {
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

  it('returns 1 when no text is provided', async () => {
    const code = await cmdSpeak([]);
    expect(code).toBe(1);
    expect(mockFormatError).toHaveBeenCalled();
    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it('speaks text and returns 0', async () => {
    const code = await cmdSpeak(['hello', 'world']);

    expect(code).toBe(0);
    expect(mockSpeak).toHaveBeenCalledWith(
      'hello world',
      expect.objectContaining({ voice: 'Samantha', rate: 200, volume: 50 }),
    );
    expect(mockFormatSuccess).toHaveBeenCalledWith('Speech playback completed');
  });
});
