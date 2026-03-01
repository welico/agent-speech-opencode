import { spawn, ChildProcess } from 'child_process';
import { TTSConfig, VoiceInfo } from '../types/index.js';

const MAX_TEXT_LENGTH = 1000;

interface ProcessCallbacks {
  onClose?: (code: number | null) => void;
  onError?: (error: Error) => void;
}

export class SayCommand {
  private currentProcess: ChildProcess | null = null;

  speak(text: string, config: TTSConfig, callbacks?: ProcessCallbacks): Promise<void> {
    this.stop();
    const chunks = this.splitText(text, config.maxLength);
    if (chunks.length === 0) return Promise.resolve();
    return this.speakChunks(chunks, config, callbacks);
  }

  stop(): void {
    if (this.currentProcess) {
      this.currentProcess.kill('SIGTERM');
      this.currentProcess = null;
    }
  }

  isSpeaking(): boolean {
    return this.currentProcess !== null;
  }

  async getAvailableVoices(): Promise<VoiceInfo[]> {
    try {
      const result = await this.execSay(['-v', '?']);
      return this.parseVoices(result);
    } catch {
      return this.getDefaultVoices();
    }
  }

  private speakChunks(
    chunks: string[],
    config: TTSConfig,
    callbacks?: ProcessCallbacks
  ): Promise<void> {
    let index = 0;

    const speakNext = (): Promise<void> => {
      if (index >= chunks.length) return Promise.resolve();

      const chunk = chunks[index++];
      return new Promise((resolve, reject) => {
        const args = this.buildArgs(chunk, config);
        this.currentProcess = spawn('say', args, { stdio: 'ignore' });

        if (!this.currentProcess) {
          reject(new Error('Failed to spawn say process'));
          return;
        }

        this.currentProcess.on('close', (code) => {
          this.currentProcess = null;
          callbacks?.onClose?.(code);

          if (code === 0) {
            speakNext().then(resolve).catch(reject);
          } else {
            reject(new Error(`say exited with code ${code}`));
          }
        });

        this.currentProcess.on('error', (error) => {
          this.currentProcess = null;
          callbacks?.onError?.(error);
          reject(error);
        });
      });
    };

    return speakNext();
  }

  private buildArgs(text: string, config: TTSConfig): string[] {
    const args: string[] = [];

    if (config.voice) args.push('-v', config.voice);
    if (config.rate && config.rate !== 200) args.push('-r', config.rate.toString());
    if (config.volume !== undefined && config.volume !== 50) {
      args.push('-a', (config.volume / 100).toString());
    }

    args.push(text);
    return args;
  }

  private splitText(text: string, maxLength: number): string[] {
    const effectiveMax = maxLength > 0 ? Math.min(maxLength, MAX_TEXT_LENGTH) : MAX_TEXT_LENGTH;

    if (text.length <= effectiveMax) return [text];

    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      let splitIndex = effectiveMax;
      const searchRange = Math.min(effectiveMax, remaining.length);
      const searchStart = Math.max(0, effectiveMax - 100);

      for (let i = searchRange - 1; i >= searchStart; i--) {
        const char = remaining[i];
        if (char === '.' || char === '!' || char === '?') {
          if (i + 1 >= remaining.length || remaining[i + 1] === ' ' || remaining[i + 1] === '\n') {
            splitIndex = i + 1;
            break;
          }
        }
      }

      if (splitIndex === effectiveMax) {
        for (let i = effectiveMax - 1; i >= effectiveMax - 50; i--) {
          const char = remaining[i];
          if (char === ' ' || char === '\n') {
            splitIndex = i + 1;
            break;
          }
        }
      }

      chunks.push(remaining.slice(0, splitIndex).trim());
      remaining = remaining.slice(splitIndex).trim();
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  private async execSay(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn('say', args);
      const chunks: Buffer[] = [];

      proc.stdout?.on('data', (chunk) => chunks.push(chunk));
      proc.stderr?.on('data', (chunk) => chunks.push(chunk));

      proc.on('close', (code) => {
        if (code === 0) resolve(Buffer.concat(chunks).toString('utf-8'));
        else reject(new Error(`say command failed with code ${code}`));
      });

      proc.on('error', reject);
    });
  }

  private parseVoices(output: string): VoiceInfo[] {
    const lines = output.split('\n');
    const voices: VoiceInfo[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const match = trimmed.match(/^(\S+)\s+(.+?)\s+([a-z]{2}-[A-Z]{2})/);
      if (match) {
        voices.push({
          name: match[1],
          displayName: match[2].trim(),
          language: match[3],
        });
      }
    }

    return voices;
  }

  private getDefaultVoices(): VoiceInfo[] {
    return [
      { name: 'Samantha', displayName: 'Samantha', language: 'en-US' },
      { name: 'Alex', displayName: 'Alex', language: 'en-US' },
      { name: 'Victoria', displayName: 'Victoria', language: 'en-US' },
      { name: 'Fred', displayName: 'Fred', language: 'en-US' },
      { name: 'Tessa', displayName: 'Tessa', language: 'en-GB' },
      { name: 'Daniel', displayName: 'Daniel', language: 'en-GB' },
      { name: 'Karen', displayName: 'Karen', language: 'en-AU' },
      { name: 'Moira', displayName: 'Moira', language: 'en-IE' },
    ];
  }
}
