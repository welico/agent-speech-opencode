import fs from 'node:fs';
import path from 'node:path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  output: 'stderr' | 'file' | 'both';
  filePath: string;
  prefix: string;
  maxSize: number;
  maxFiles: number;
}

const DEFAULT_CONFIG: LoggerConfig = {
  enabled: process.env.DEBUG === 'true',
  level: (process.env.LOG_LEVEL as LogLevel) ?? 'debug',
  output: 'both',
  filePath: process.env.LOG_FILE ?? '/tmp/agent-speech-debug.log',
  prefix: '[DEBUG]',
  maxSize: 10 * 1024 * 1024,
  maxFiles: 3,
};

export interface Logger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
  enable(enabled: boolean): void;
  setLevel(level: LogLevel): void;
}

export function createLogger(config?: Partial<LoggerConfig>): Logger {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const logLevels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

  function writeToFile(entry: string): void {
    try {
      const logDir = path.dirname(cfg.filePath);
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

      if (fs.existsSync(cfg.filePath)) {
        const stats = fs.statSync(cfg.filePath);
        if (stats.size >= cfg.maxSize) rotateLogs();
      }

      fs.appendFileSync(cfg.filePath, entry + '\n');
    } catch (error) {
      console.error('[LOGGER] Failed to write to file:', error);
    }
  }

  function rotateLogs(): void {
    for (let i = cfg.maxFiles - 1; i >= 1; i--) {
      const oldFile = `${cfg.filePath}.${i}`;
      const newFile = `${cfg.filePath}.${i + 1}`;
      if (fs.existsSync(oldFile)) fs.renameSync(oldFile, newFile);
    }
    if (fs.existsSync(cfg.filePath)) fs.renameSync(cfg.filePath, `${cfg.filePath}.1`);
  }

  function log(level: LogLevel, message: string, data?: unknown): void {
    if (!cfg.enabled || logLevels[level] < logLevels[cfg.level]) return;

    const timestamp = new Date().toISOString();
    const prefix = `${cfg.prefix} [${level.toUpperCase()}]`;
    const logMessage = `${prefix} ${message}`;

    if (cfg.output === 'stderr' || cfg.output === 'both') {
      if (data) console.error(logMessage, data);
      else console.error(logMessage);
    }

    if (cfg.output === 'file' || cfg.output === 'both') {
      writeToFile(JSON.stringify({ timestamp, level, message, data }));
    }
  }

  return {
    debug: (message, data) => log('debug', message, data),
    info: (message, data) => log('info', message, data),
    warn: (message, data) => log('warn', message, data),
    error: (message, data) => log('error', message, data),
    enable: (enabled) => { cfg.enabled = enabled; },
    setLevel: (level) => { cfg.level = level; },
  };
}

export const logger = createLogger();
