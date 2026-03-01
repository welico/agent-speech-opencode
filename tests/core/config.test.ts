import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigManager } from '../../src/core/config.js';

vi.mock('../../src/infrastructure/fs.js', () => ({
  readConfig: vi.fn().mockResolvedValue(null),
  writeConfig: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/utils/logger.js', () => ({
  createLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('ConfigManager', () => {
  let manager: ConfigManager;

  beforeEach(() => {
    manager = new ConfigManager();
  });

  describe('defaults', () => {
    it('should have correct default values', () => {
      const config = manager.getAll();
      expect(config.version).toBe('1.0.0');
      expect(config.enabled).toBe(true);
      expect(config.voice).toBe('Samantha');
      expect(config.rate).toBe(200);
      expect(config.volume).toBe(50);
      expect(config.minLength).toBe(10);
      expect(config.maxLength).toBe(0);
    });

    it('should have correct default filter values', () => {
      const config = manager.getAll();
      expect(config.filters.sensitive).toBe(false);
      expect(config.filters.skipCodeBlocks).toBe(false);
      expect(config.filters.skipCommands).toBe(false);
    });
  });

  describe('get() and set()', () => {
    it('should get a single key', () => {
      expect(manager.get('voice')).toBe('Samantha');
    });

    it('should set and get a value', () => {
      manager.set('voice', 'Alex');
      expect(manager.get('voice')).toBe('Alex');
    });

    it('should set enabled to false', () => {
      manager.set('enabled', false);
      expect(manager.get('enabled')).toBe(false);
    });
  });

  describe('setMultiple()', () => {
    it('should update multiple values at once', () => {
      manager.setMultiple({ voice: 'Victoria', rate: 150 });
      expect(manager.get('voice')).toBe('Victoria');
      expect(manager.get('rate')).toBe(150);
    });
  });

  describe('reset()', () => {
    it('should reset to defaults after changes', () => {
      manager.set('voice', 'Alex');
      manager.set('rate', 300);
      manager.reset();
      expect(manager.get('voice')).toBe('Samantha');
      expect(manager.get('rate')).toBe(200);
    });
  });

  describe('validate()', () => {
    it('should return true for valid default config', () => {
      expect(manager.validate()).toBe(true);
    });

    it('should return false for rate below 50', () => {
      manager.set('rate', 10);
      expect(manager.validate()).toBe(false);
    });

    it('should return false for rate above 400', () => {
      manager.set('rate', 500);
      expect(manager.validate()).toBe(false);
    });

    it('should return false for volume below 0', () => {
      manager.set('volume', -1);
      expect(manager.validate()).toBe(false);
    });

    it('should return false for volume above 100', () => {
      manager.set('volume', 101);
      expect(manager.validate()).toBe(false);
    });

    it('should return true for boundary rate values (50, 400)', () => {
      manager.set('rate', 50);
      expect(manager.validate()).toBe(true);
      manager.set('rate', 400);
      expect(manager.validate()).toBe(true);
    });

    it('should return true for boundary volume values (0, 100)', () => {
      manager.set('volume', 0);
      expect(manager.validate()).toBe(true);
      manager.set('volume', 100);
      expect(manager.validate()).toBe(true);
    });
  });

  describe('getAll()', () => {
    it('should return a copy, not reference', () => {
      const config1 = manager.getAll();
      const config2 = manager.getAll();
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });
});
