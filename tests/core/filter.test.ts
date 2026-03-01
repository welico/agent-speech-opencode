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
});
