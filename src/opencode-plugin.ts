import { TextToSpeech } from './core/tts.js';
import { ConfigManager } from './core/config.js';
import { ContentFilter } from './core/filter.js';
import { translateText } from './utils/translate.js';
import { createLogger } from './utils/logger.js';
import type { Plugin, PluginInput } from '@opencode-ai/plugin';

const logger = createLogger({ prefix: '[agent-speech]' });

type SessionMessage = {
  info?: { role?: string };
  role?: string;
  parts: Array<{ type: string; text?: string }>;
};

const HANGUL_REGEX = /[\uac00-\ud7af]/;
const JAPANESE_REGEX = /[\u3040-\u30ff]/;
const CJK_REGEX = /[\u4e00-\u9fff]/;
const CYRILLIC_REGEX = /[\u0400-\u04ff]/;

function extractMessageText(message: SessionMessage | undefined): string {
  if (!message) return '';

  return message.parts
    .filter((p) => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text as string)
    .join('\n')
    .trim();
}

function detectLanguageFromText(text: string): string {
  if (HANGUL_REGEX.test(text)) return 'ko';
  if (JAPANESE_REGEX.test(text)) return 'ja';
  if (CJK_REGEX.test(text)) return 'zh-CN';
  if (CYRILLIC_REGEX.test(text)) return 'ru';
  return 'en';
}

function extractMessages(result: unknown): SessionMessage[] {
  if (Array.isArray(result)) return result as SessionMessage[];
  if (!result || typeof result !== 'object') return [];

  const payload = result as {
    data?: unknown;
    messages?: unknown;
  };

  if (Array.isArray(payload.messages)) {
    return payload.messages as SessionMessage[];
  }

  if (Array.isArray(payload.data)) {
    return payload.data as SessionMessage[];
  }

  return [];
}

export const AgentSpeechPlugin: Plugin = async ({ client }: PluginInput) => {
  const config = new ConfigManager();
  const tts = new TextToSpeech();
  const filter = new ContentFilter();

  await config.init();
  logger.info('agent-speech-opencode plugin initialized');

  return {
    event: async ({ event }: { event: { type: string; properties?: Record<string, unknown> } }) => {
      if (event.type !== 'session.idle') return;

      const properties = event.properties ?? {};
      const sessionID =
        (typeof properties.sessionID === 'string' ? properties.sessionID : undefined) ??
        (typeof properties.sessionId === 'string' ? properties.sessionId : undefined);
      if (!sessionID) return;

      const cfg = config.getAll();
      if (!cfg.enabled) return;

      try {
        const result = await client.session.messages({ path: { id: sessionID } });
        const messages = extractMessages(result);

        const lastAssistant = [...messages]
          .reverse()
          .find((m) => (m.info?.role ?? m.role) === 'assistant');

        const lastUser = [...messages]
          .reverse()
          .find((m) => (m.info?.role ?? m.role) === 'user');

        if (!lastAssistant) return;

        const text = extractMessageText(lastAssistant);

        if (!text) return;

        const decision = filter.extractDecision(text);
        if (!decision) return;

        const languageFromConfig = cfg.language?.trim();
        const targetLanguage = languageFromConfig && languageFromConfig !== 'auto'
          ? languageFromConfig
          : detectLanguageFromText(extractMessageText(lastUser));

        const spokenText = await translateText(decision, targetLanguage);
        if (!spokenText) return;

        logger.debug('Speaking decision-required message', {
          original: text.length,
          decision: decision.length,
          language: targetLanguage,
        });

        await tts.speak(spokenText, {
          enabled: cfg.enabled,
          voice: cfg.voice,
          rate: cfg.rate,
          volume: cfg.volume,
          minLength: cfg.minLength,
          maxLength: cfg.maxLength,
          filters: cfg.filters,
        });
      } catch (error) {
        logger.error('Failed to speak session response', error);
      }
    },
  };
};

export default AgentSpeechPlugin;
