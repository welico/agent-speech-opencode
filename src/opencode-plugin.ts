import { TextToSpeech } from './core/tts.js';
import { ConfigManager } from './core/config.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger({ prefix: '[agent-speech]' });

type SessionMessage = {
  role: string;
  parts: Array<{ type: string; text?: string }>;
};

type OpenCodeClient = {
  session: {
    get: (id: string) => Promise<{ messages?: SessionMessage[] }>;
  };
};

type PluginContext = {
  client: OpenCodeClient;
};

export const AgentSpeechPlugin = async ({ client }: PluginContext) => {
  const config = new ConfigManager();
  const tts = new TextToSpeech();

  await config.init();
  logger.info('agent-speech-opencode plugin initialized');

  return {
    'session.idle': async (input: { sessionId: string }) => {
      const cfg = config.getAll();
      if (!cfg.enabled) return;

      try {
        const session = await client.session.get(input.sessionId);
        const messages = session.messages ?? [];

        const lastAssistant = [...messages]
          .reverse()
          .find((m) => m.role === 'assistant');

        if (!lastAssistant) return;

        const text = lastAssistant.parts
          .filter((p) => p.type === 'text' && typeof p.text === 'string')
          .map((p) => p.text as string)
          .join('\n')
          .trim();

        if (!text) return;

        logger.debug('Speaking last assistant message', { length: text.length });

        await tts.speak(text, {
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
