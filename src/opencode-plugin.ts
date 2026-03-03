import { TextToSpeech } from './core/tts.js';
import { ConfigManager } from './core/config.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger({ prefix: '[agent-speech]' });

type SessionMessage = {
  info?: { role?: string };
  role?: string;
  parts: Array<{ type: string; text?: string }>;
};

type OpenCodeClient = {
  session: {
    messages: (args: { path: { id: string } }) => Promise<unknown>;
  };
};

type PluginContext = {
  client: OpenCodeClient;
};

type SessionIdleEvent = {
  type: string;
  properties?: {
    sessionID?: string;
    sessionId?: string;
  };
};

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

export const AgentSpeechPlugin = async ({ client }: PluginContext) => {
  const config = new ConfigManager();
  const tts = new TextToSpeech();

  await config.init();
  logger.info('agent-speech-opencode plugin initialized');

  return {
    event: async ({ event }: { event: SessionIdleEvent }) => {
      if (event.type !== 'session.idle') return;

      const sessionID = event.properties?.sessionID ?? event.properties?.sessionId;
      if (!sessionID) return;

      const cfg = config.getAll();
      if (!cfg.enabled) return;

      try {
        const result = await client.session.messages({ path: { id: sessionID } });
        const messages = extractMessages(result);

        const lastAssistant = [...messages]
          .reverse()
          .find((m) => (m.info?.role ?? m.role) === 'assistant');

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
