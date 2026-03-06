import { afterEach, describe, expect, it, vi } from 'vitest';
import { translateText } from '../../src/utils/translate.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('translateText', () => {
  it('returns original text when target is en', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await translateText('Hello world', 'en');
    expect(result).toBe('Hello world');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls google translate API and returns translated text', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [[['안녕하세요', 'Hello', null, null, 10]]],
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await translateText('Hello', 'ko');
    expect(result).toBe('안녕하세요');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('translate.googleapis.com/translate_a/single');
    expect(String(fetchMock.mock.calls[0][0])).toContain('tl=ko');
  });

  it('falls back to original text when API fails', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network fail'));
    vi.stubGlobal('fetch', fetchMock);

    const result = await translateText('Hello', 'ko');
    expect(result).toBe('Hello');
  });
});
