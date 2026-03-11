import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TextToSpeech } from '../core/tts.js';
import { ConfigManager } from '../core/config.js';
import { createLogger } from '../utils/logger.js';
import { withErrorHandling } from '../utils/error-handler.js';
import { safeValidateSpeakTextInput } from '../utils/schemas.js';

const SPEAK_TOOL_NAME = 'speak_text';

export class MCPServer {
  private server: Server;
  private tts: TextToSpeech;
  private config: ConfigManager;
  private logger = createLogger({ prefix: '[MCP]' });

  constructor() {
    this.server = new Server(
      { name: '@welico/agent-speech-opencode', version: '0.2.5' },
      { capabilities: { tools: {} } }
    );
    this.tts = new TextToSpeech();
    this.config = new ConfigManager();
    this.setupHandlers();
  }

  async init(): Promise<void> {
    await this.config.init();
    this.setupToolListing();
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  async stop(): Promise<void> {
    await this.server.close();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      if (name === SPEAK_TOOL_NAME) return this.handleSpeak(args);

      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      };
    });
  }

  private setupToolListing(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: SPEAK_TOOL_NAME,
          description: 'Convert text to speech using macOS TTS',
          inputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Text to speak' },
              voice: { type: 'string', description: 'Voice name (e.g., Samantha, Alex)' },
              rate: { type: 'number', description: 'Speech rate in WPM (50-400)' },
              volume: { type: 'number', description: 'Volume level (0-100)' },
            },
            required: ['text'],
          },
        },
      ],
    }));
  }

  private async handleSpeak(args: unknown): Promise<{
    content: Array<{ type: string; text: string }>;
  }> {
    return withErrorHandling('handleSpeak', async () => {
      const validation = safeValidateSpeakTextInput(args);
      if (!validation.success) {
        throw new Error(validation.error);
      }

      const input = validation.data;
      const cfg = this.config.getAll();

      const speakConfig = {
        enabled: cfg.enabled,
        voice: input.voice ?? cfg.voice,
        rate: input.rate ?? cfg.rate,
        volume: input.volume ?? cfg.volume,
        minLength: cfg.minLength,
        maxLength: cfg.maxLength,
        filters: cfg.filters,
      };

      this.tts.speak(input.text, speakConfig);

      return {
        content: [
          { type: 'text', text: `Speaking text with voice "${speakConfig.voice}"` },
        ],
      };
    }, this.logger);
  }
}

export async function createMCPServer(): Promise<MCPServer> {
  const server = new MCPServer();
  await server.init();
  return server;
}
