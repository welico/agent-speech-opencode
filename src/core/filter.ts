import { TTSConfig, FilterResult } from '../types/index.js';

const SENSITIVE_PATTERNS = [
  /(?:api[_-]?key|apikey|api-key)['":\s]*([a-zA-Z0-9_\-]{20,})/gi,
  /(?:password|passwd|pwd)['":\s]*([^\s,;]{6,})/gi,
  /(?:token|bearer|auth)['":\s]*([a-zA-Z0-9._\-]{20,})/gi,
  /(?:secret|private[_-]?key|privatekey)['":\s]*([a-zA-Z0-9_\-]{20,})/gi,
  /AKIA[0-9A-Z]{16}/g,
  /(?:["']?)([A-Za-z0-9+/]{40,}={0,2})(?:["']?\s*(?:,|\)|}))/g,
];

const CODE_BLOCK_PATTERNS = [
  /```[\s\S]*?```/g,
  /`[^`]+`/g,
  /\$[^$]+$/g,
  /^[\s]*[>\$].+$/gm,
];

const COMMAND_OUTPUT_PATTERNS = [
  /^[+\-]{3,}$/gm,
  /^\s*(BUILD|FAILED|SUCCESS|INFO|DEBUG|WARN|ERROR)\b/gm,
];

export class ContentFilter {
  filter(text: string, config: TTSConfig): FilterResult {
    let filteredText = text;

    if (config.minLength > 0 && text.length < config.minLength) {
      return {
        shouldSpeak: false,
        text: '',
        reason: `Text length (${text.length}) is below minimum (${config.minLength})`,
      };
    }

    if (config.maxLength > 0 && text.length > config.maxLength) {
      return {
        shouldSpeak: false,
        text: '',
        reason: `Text length (${text.length}) exceeds maximum (${config.maxLength})`,
      };
    }

    if (config.filters.sensitive) {
      filteredText = this.filterSensitive(filteredText);
    }

    if (config.filters.skipCodeBlocks) {
      filteredText = this.removeCodeBlocks(filteredText);
    }

    if (config.filters.skipCommands) {
      filteredText = this.removeCommandOutputs(filteredText);
    }

    filteredText = this.cleanupWhitespace(filteredText);

    return {
      shouldSpeak: filteredText.trim().length > 0,
      text: filteredText,
    };
  }

  detectSensitive(text: string): boolean {
    const lowerText = text.toLowerCase();

    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(text)) return true;
    }

    const sensitiveKeywords = [
      'password', 'passwd', 'pwd', 'secret', 'private key',
      'api key', 'apikey', 'access token', 'auth token', 'bearer token',
    ];

    for (const keyword of sensitiveKeywords) {
      if (lowerText.includes(keyword)) return true;
    }

    return false;
  }

  removeCodeBlocks(text: string): string {
    let result = text;
    for (const pattern of CODE_BLOCK_PATTERNS) {
      result = result.replace(pattern, '');
    }
    return result;
  }

  removeCommandOutputs(text: string): string {
    let result = text;
    for (const pattern of COMMAND_OUTPUT_PATTERNS) {
      result = result.replace(pattern, '');
    }
    return result;
  }

  private filterSensitive(text: string): string {
    let result = text;
    for (const pattern of SENSITIVE_PATTERNS) {
      result = result.replace(pattern, (_match, _group1) => '[REDACTED]');
    }
    result = result.replace(/^export\s+\w+\s*=\s*['"][\w\-]+['"]/gm, 'export $1 = "[REDACTED]"');
    return result;
  }

  private cleanupWhitespace(text: string): string {
    return text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/^\s+|\s+$/gm, '');
  }
}
