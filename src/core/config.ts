import { AppConfig } from '../types/index.js';
import { readConfig, writeConfig } from '../infrastructure/fs.js';
import { createLogger } from '../utils/logger.js';

const DEFAULT_CONFIG: AppConfig = {
  version: '1.0.0',
  enabled: true,
  voice: 'Samantha',
  rate: 200,
  volume: 50,
  minLength: 10,
  maxLength: 0,
  language: 'auto',
  filters: {
    sensitive: false,
    skipCodeBlocks: false,
    skipCommands: false,
  },
};

export class ConfigManager {
  private config: AppConfig;
  private dirty = false;
  private logger = createLogger({ prefix: '[CONFIG]' });

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  async init(): Promise<void> {
    this.logger.debug('Initializing config manager');
    const loaded = await readConfig();

    if (loaded) {
      this.config = this.migrateConfig(loaded);
    } else {
      this.config = { ...DEFAULT_CONFIG };
    }

    this.dirty = false;
  }

  private migrateConfig(oldConfig: AppConfig): AppConfig {
    return { ...DEFAULT_CONFIG, ...oldConfig };
  }

  async save(): Promise<void> {
    if (!this.dirty) return;
    await writeConfig(this.config);
    this.dirty = false;
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  getAll(): AppConfig {
    return { ...this.config };
  }

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    (this.config[key] as AppConfig[K]) = value;
    this.dirty = true;
  }

  setMultiple(values: Partial<AppConfig>): void {
    Object.assign(this.config, values);
    this.dirty = true;
  }

  reset(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.dirty = true;
  }

  validate(): boolean {
    const { enabled, voice, rate, volume, minLength, maxLength, language } = this.config;
    if (
      typeof enabled !== 'boolean' ||
      typeof voice !== 'string' ||
      typeof rate !== 'number' ||
      typeof volume !== 'number' ||
      typeof minLength !== 'number' ||
      typeof maxLength !== 'number' ||
      typeof language !== 'string'
    ) return false;

    if (rate < 50 || rate > 400) return false;
    if (volume < 0 || volume > 100) return false;
    if (minLength < 0 || maxLength < 0) return false;

    return true;
  }
}
