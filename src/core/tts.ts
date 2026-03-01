import { TTSConfig, VoiceInfo } from '../types/index.js';
import { SayCommand } from '../infrastructure/say.js';
import { ContentFilter } from './filter.js';
import { createLogger } from '../utils/logger.js';
import { withErrorHandling } from '../utils/error-handler.js';

export class TextToSpeech {
  private say: SayCommand;
  private filter: ContentFilter;
  private enabled = true;
  private logger = createLogger({ prefix: '[TTS]' });

  constructor() {
    this.say = new SayCommand();
    this.filter = new ContentFilter();
  }

  async speak(text: string, config: TTSConfig): Promise<void> {
    return withErrorHandling('speak', async () => {
      this.logger.debug('Starting speech', { textLength: text.length });

      if (!config.enabled || !this.enabled) {
        this.logger.debug('Speech disabled');
        return;
      }

      const { shouldSpeak, text: filteredText, reason } = this.filter.filter(text, config);

      if (!shouldSpeak) {
        this.logger.debug('Skipping speech', { reason });
        return;
      }

      await this.say.speak(filteredText, config, {
        onClose: (code) => {
          if (code !== 0) this.logger.error('Speech process exited with non-zero code', { code });
        },
        onError: (error) => {
          this.logger.error('Speech error', error);
        },
      });
    }, this.logger);
  }

  stop(): void {
    this.say.stop();
  }

  async getAvailableVoices(): Promise<VoiceInfo[]> {
    return this.say.getAvailableVoices();
  }

  isSpeaking(): boolean {
    return this.say.isSpeaking();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  filterText(text: string, config: TTSConfig): string {
    const { text: filtered } = this.filter.filter(text, config);
    return filtered;
  }
}
