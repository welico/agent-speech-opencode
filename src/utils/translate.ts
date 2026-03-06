import { createLogger } from './logger.js';

const logger = createLogger({ prefix: '[translate]' });

type GoogleTranslateResponse = unknown[];

function parseTranslatedText(payload: unknown): string {
  if (!Array.isArray(payload)) return '';

  const root = payload as GoogleTranslateResponse;
  if (!Array.isArray(root[0])) return '';

  const segments = root[0] as unknown[];
  const translated = segments
    .map((segment) => {
      if (!Array.isArray(segment)) return '';
      return typeof segment[0] === 'string' ? segment[0] : '';
    })
    .filter((part) => part.length > 0)
    .join('')
    .trim();

  return translated;
}

export async function translateText(
  text: string,
  targetLanguage: string,
  timeoutMs = 3000,
): Promise<string> {
  const normalizedTarget = targetLanguage.trim();

  if (!text.trim()) return text;
  if (!normalizedTarget || normalizedTarget.toLowerCase() === 'en') return text;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(normalizedTarget)}&dt=t&q=${encodedText}`;
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });

    if (!response.ok) {
      logger.warn('Translation API returned non-200 status', {
        status: response.status,
        statusText: response.statusText,
      });
      return text;
    }

    const data: unknown = await response.json();
    const translated = parseTranslatedText(data);
    return translated || text;
  } catch (error) {
    logger.debug('Translation failed, using original text', {
      error: error instanceof Error ? error.message : String(error),
    });
    return text;
  } finally {
    clearTimeout(timeoutId);
  }
}
