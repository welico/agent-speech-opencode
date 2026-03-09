import { TTSConfig, FilterResult } from '../types/index.js';

const SENSITIVE_PATTERNS = [
  /(?:api[_-]?key|apikey|api-key)['":\s]*([a-zA-Z0-9_-]{20,})/gi,
  /(?:password|passwd|pwd)['":\s]*([^\s,;]{6,})/gi,
  /(?:token|bearer|auth)['":\s]*([a-zA-Z0-9._-]{20,})/gi,
  /(?:secret|private[_-]?key|privatekey)['":\s]*([a-zA-Z0-9_-]{20,})/gi,
  /AKIA[0-9A-Z]{16}/g,
  /(?:["']?)([A-Za-z0-9+/]{40,}={0,2})(?:["']?\s*(?:,|\)|}))/g,
];

const CODE_BLOCK_PATTERNS = [
  /```[\s\S]*?```/g,
  /`[^`]+`/g,
  /\$[^$]+$/g,
  /^[\s]*[>$].+$/gm,
];

const COMMAND_OUTPUT_PATTERNS = [
  /^[+-]{3,}$/gm,
  /^\s*(BUILD|FAILED|SUCCESS|INFO|DEBUG|WARN|ERROR)\b/gm,
];

const SUMMARY_KEYWORDS = [
  /^(done|completed?|finished|fixed|updated|added|removed|changed|refactored)\b/i,
  /^(in summary|to summarize|in conclusion|the result|the fix|the change)/i,
  /^(this (adds?|fixes?|updates?|changes?|removes?|creates?))/i,
  /^(now |the (file|code|function|class|test|build|type))/i,
];

const DECISION_PATTERNS: RegExp[] = [
  // Question mark at end of sentence or paragraph
  /\?(?:\s|$)/,

  // English: explicit requests for user input
  /\blet me know\b/i,
  /\bplease\s+(?:choose|select|decide|confirm|specify)\b/i,
  /\b(?:should I|shall I|would you like|do you (?:want|prefer)|would you prefer)\b/i,
  /\b(?:which (?:one|option|approach|method|way))\b/i,
  /\b(?:what would you (?:like|prefer))\b/i,
  /\b(?:how (?:should I|would you like to))\b/i,

  // Korean: question/decision patterns
  /(?:할|될|갈)까요/,
  /(?:해|알려)\s*주세요/,
  /(?:선택|결정|어떻게|어떤|하시겠|원하시|괜찮으시)/,
];

export class ContentFilter {
  extractDecision(text: string): string {
    const paragraphs = this.stripMarkdown(text);
    if (paragraphs.length === 0) return '';

    const tail = paragraphs.slice(-3);
    const decisionParagraph = [...tail]
      .reverse()
      .find((p) => DECISION_PATTERNS.some((re) => re.test(p)));

    if (!decisionParagraph) return '';

    return this.trimToSentence(decisionParagraph, 200);
  }

  summarize(text: string): string {
    const paragraphs = this.stripMarkdown(text);
    if (paragraphs.length === 0) return '';

    const conclusion = paragraphs.find((p) =>
      SUMMARY_KEYWORDS.some((re) => re.test(p)),
    );

    const candidate = conclusion ?? paragraphs[paragraphs.length - 1];

    return this.trimToSentence(candidate, 200);
  }

  private stripMarkdown(text: string): string[] {
    let clean = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '');
    clean = clean.replace(/^#{1,6}\s+/gm, '');
    clean = clean.replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1');
    clean = clean.replace(/_{1,2}([^_]+)_{1,2}/g, '$1');
    clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    clean = clean.replace(/^[\s]*[-*+]\s+/gm, '');
    clean = clean.replace(/^\s*\d+\.\s+/gm, '');

    return clean
      .split(/\n{2,}/)
      .map((p) => p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
      .filter((p) => p.length > 10);
  }

  private trimToSentence(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;

    const slice = text.slice(0, maxLen);
    const lastPunct = Math.max(
      slice.lastIndexOf('. '),
      slice.lastIndexOf('! '),
      slice.lastIndexOf('? '),
    );

    if (lastPunct > 20) {
      return slice.slice(0, lastPunct + 1).trim();
    }

    const lastSpace = slice.lastIndexOf(' ');
    return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trim() + '…';
  }

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
      result = result.replace(pattern, () => '[REDACTED]');
    }
    result = result.replace(/^export\s+\w+\s*=\s*['"][\w-]+['"]/gm, 'export $1 = "[REDACTED]"');
    return result;
  }

  private cleanupWhitespace(text: string): string {
    return text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/^\s+|\s+$/gm, '');
  }
}
