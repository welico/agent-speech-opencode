import { describe, it, expect } from 'vitest';
import { ContentFilter } from '../../src/core/filter.js';
import type { TTSConfig } from '../../src/types/index.js';

const baseConfig: TTSConfig = {
  enabled: true,
  voice: 'Samantha',
  rate: 200,
  volume: 50,
  minLength: 0,
  maxLength: 0,
  filters: {
    sensitive: false,
    skipCodeBlocks: false,
    skipCommands: false,
  },
};

describe('ContentFilter', () => {
  const filter = new ContentFilter();

  describe('filter()', () => {
    it('should return shouldSpeak=true for normal text', () => {
      const result = filter.filter('Hello, this is a test message.', baseConfig);
      expect(result.shouldSpeak).toBe(true);
      expect(result.text).toBe('Hello, this is a test message.');
    });

    it('should respect minLength - reject short text', () => {
      const config = { ...baseConfig, minLength: 20 };
      const result = filter.filter('Hi', config);
      expect(result.shouldSpeak).toBe(false);
      expect(result.reason).toContain('minimum');
    });

    it('should respect minLength - allow text meeting minimum', () => {
      const config = { ...baseConfig, minLength: 5 };
      const result = filter.filter('Hello world', config);
      expect(result.shouldSpeak).toBe(true);
    });

    it('should respect maxLength - reject long text', () => {
      const longText = 'a'.repeat(100);
      const config = { ...baseConfig, maxLength: 50 };
      const result = filter.filter(longText, config);
      expect(result.shouldSpeak).toBe(false);
      expect(result.reason).toContain('maximum');
    });

    it('should allow maxLength=0 (no limit)', () => {
      const longText = 'a'.repeat(10000);
      const config = { ...baseConfig, maxLength: 0 };
      const result = filter.filter(longText, config);
      expect(result.shouldSpeak).toBe(true);
    });

    it('should return shouldSpeak=false for empty text after filtering', () => {
      const result = filter.filter('   \n\n   ', baseConfig);
      expect(result.shouldSpeak).toBe(false);
    });

    it('should remove code blocks when skipCodeBlocks=true', () => {
      const config = {
        ...baseConfig,
        filters: { ...baseConfig.filters, skipCodeBlocks: true },
      };
      const text = 'Here is code:\n```js\nconsole.log("hello");\n```\nEnd.';
      const result = filter.filter(text, config);
      expect(result.text).not.toContain('console.log');
      expect(result.text).toContain('Here is code');
    });

    it('should NOT remove code blocks when skipCodeBlocks=false', () => {
      const text = 'Here is code:\n```js\nconsole.log("hello");\n```\nEnd.';
      const result = filter.filter(text, baseConfig);
      expect(result.text).toContain('console.log');
    });

    it('should collapse 3+ newlines to at most 2', () => {
      const result = filter.filter('Hello\n\n\n\nWorld', baseConfig);
      expect(result.text).not.toMatch(/\n{3,}/);
    });

    it('should collapse multiple spaces to one', () => {
      const result = filter.filter('Hello   World', baseConfig);
      expect(result.text).toBe('Hello World');
    });
  });

  describe('detectSensitive()', () => {
    it('should detect API key pattern', () => {
      const text = 'api_key: abc123defghijklmnopqrstuvwxyz';
      expect(filter.detectSensitive(text)).toBe(true);
    });

    it('should detect password keyword', () => {
      expect(filter.detectSensitive('my password is secret')).toBe(true);
    });

    it('should detect token keyword', () => {
      expect(filter.detectSensitive('access token for authentication')).toBe(true);
    });

    it('should return false for normal text', () => {
      expect(filter.detectSensitive('Hello, how are you today?')).toBe(false);
    });
  });

  describe('removeCodeBlocks()', () => {
    it('should remove fenced code blocks', () => {
      const text = 'Before\n```\nsome code\n```\nAfter';
      const result = filter.removeCodeBlocks(text);
      expect(result).not.toContain('some code');
      expect(result).toContain('Before');
      expect(result).toContain('After');
    });

    it('should remove inline code', () => {
      const text = 'Use `console.log()` to debug.';
      const result = filter.removeCodeBlocks(text);
      expect(result).not.toContain('console.log()');
    });
  });

  describe('extractDecision()', () => {
    it('should return text ending with question mark', () => {
      const text = 'I found two approaches.\n\nWhich approach would you prefer?';
      const result = filter.extractDecision(text);
      expect(result).toContain('Which approach would you prefer?');
    });

    it('should detect "should I" decision pattern', () => {
      const text = 'The file has a type error.\n\nShould I fix the type error now or skip it for later?';
      const result = filter.extractDecision(text);
      expect(result).toContain('Should I fix');
    });

    it('should detect "would you like" decision pattern', () => {
      const text = 'Changes are ready.\n\nWould you like me to commit these changes?';
      const result = filter.extractDecision(text);
      expect(result).toContain('Would you like');
    });

    it('should detect "let me know" decision pattern', () => {
      const text = 'I can use either Redis or Memcached for caching.\n\nLet me know which one to use.';
      const result = filter.extractDecision(text);
      expect(result).toContain('Let me know');
    });

    it('should detect "which option" decision pattern', () => {
      const text = 'Option A uses hooks, option B uses classes.\n\nWhich option fits your project better?';
      const result = filter.extractDecision(text);
      expect(result).toContain('Which option');
    });

    it('should detect Korean question patterns', () => {
      const text = '두 가지 방법이 있습니다.\n\n어떤 방법으로 진행할까요?';
      const result = filter.extractDecision(text);
      expect(result).toContain('진행할까요');
    });

    it('should detect Korean decision keywords', () => {
      const text = '설정 파일을 수정했습니다.\n\n다음 단계를 선택해 주세요.';
      const result = filter.extractDecision(text);
      expect(result).toContain('선택');
    });

    it('should return empty string for status updates (no question)', () => {
      const text = 'Done. All changes have been applied successfully.';
      expect(filter.extractDecision(text)).toBe('');
    });

    it('should return empty string for code explanations without questions', () => {
      const text = 'The function uses a factory pattern.\n\nIt creates instances based on the input type.\n\nThis approach is more maintainable.';
      expect(filter.extractDecision(text)).toBe('');
    });

    it('should return empty string for completion messages', () => {
      const text = 'I updated the configuration file.\n\n```json\n{"key": "value"}\n```\n\nThe build passes now.';
      expect(filter.extractDecision(text)).toBe('');
    });

    it('should strip code blocks before checking for decisions', () => {
      const text = '```ts\nconst x = 1;\n```\n\nShould I add tests for this change?';
      const result = filter.extractDecision(text);
      expect(result).not.toContain('const x');
      expect(result).toContain('Should I add tests');
    });

    it('should strip markdown formatting', () => {
      const text = '## Options\n\n**Option A**: faster. **Option B**: safer.\n\nWhich one would you prefer?';
      const result = filter.extractDecision(text);
      expect(result).not.toContain('##');
      expect(result).not.toContain('**');
    });

    it('should trim to 200 characters at a sentence boundary', () => {
      const long = 'Should I proceed with ' + 'x'.repeat(200) + '?';
      const result = filter.extractDecision(long);
      expect(result.length).toBeLessThanOrEqual(200);
    });

    it('should return empty string for code-only text', () => {
      const text = '```ts\nconst x = 1;\n```';
      expect(filter.extractDecision(text)).toBe('');
    });

    it('should check only the last 3 paragraphs for decisions', () => {
      const text = 'Is this relevant?\n\nParagraph two is here now.\n\nParagraph three continues.\n\nParagraph four is fine.\n\nDone. Everything is complete.';
      expect(filter.extractDecision(text)).toBe('');
    });
  });

  describe('summarize()', () => {
    it('should return short text unchanged', () => {
      const text = 'Done. The file has been updated.';
      expect(filter.summarize(text)).toBe(text);
    });

    it('should strip code blocks', () => {
      const text = 'Here is a fix:\n\n```ts\nconst x = 1;\n```\n\nFixed the bug.';
      const result = filter.summarize(text);
      expect(result).not.toContain('const x');
      expect(result).toContain('Fixed the bug');
    });

    it('should prefer conclusion paragraph matching SUMMARY_KEYWORDS', () => {
      const text = 'Some background info here.\n\nMore details about the implementation.\n\nDone. The refactoring is complete.';
      const result = filter.summarize(text);
      expect(result).toContain('Done');
    });

    it('should fall back to last paragraph when no keyword match', () => {
      const text = 'First paragraph with some content.\n\nSecond paragraph is here.\n\nThird paragraph at the end.';
      const result = filter.summarize(text);
      expect(result).toContain('Third paragraph');
    });

    it('should trim to 200 characters at a sentence boundary', () => {
      const long = 'This is sentence one. This is sentence two. ' + 'x'.repeat(200);
      const result = filter.summarize(long);
      expect(result.length).toBeLessThanOrEqual(200);
    });

    it('should strip markdown headings and bold', () => {
      const text = '## Summary\n\n**Done.** The update is complete.';
      const result = filter.summarize(text);
      expect(result).not.toContain('##');
      expect(result).not.toContain('**');
    });

    it('should return empty string for code-only text', () => {
      const text = '```ts\nconst x = 1;\n```';
      expect(filter.summarize(text)).toBe('');
    });
  });
});
