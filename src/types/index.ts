/**
 * Filter configuration for content filtering
 */
export interface FilterConfig {
  /** Filter out sensitive information (passwords, API keys, etc.) */
  sensitive: boolean;
  /** Skip code blocks when speaking */
  skipCodeBlocks: boolean;
  /** Skip command outputs */
  skipCommands: boolean;
}

/**
 * Text-to-Speech configuration
 */
export interface TTSConfig {
  /** Enable/disable TTS */
  enabled: boolean;
  /** macOS voice name (e.g., "Samantha", "Alex") */
  voice: string;
  /** Speech rate in words per minute (50-400) */
  rate: number;
  /** Volume level (0-100) */
  volume: number;
  /** Minimum response length to speak (0 = no minimum) */
  minLength: number;
  /** Maximum response length to speak (0 = no maximum) */
  maxLength: number;
  /** Content filtering options */
  filters: FilterConfig;
}

/**
 * Complete application configuration
 */
export interface AppConfig {
  /** Config version for migration */
  version: string;
  /** Enable/disable TTS */
  enabled: boolean;
  /** macOS voice name (e.g., "Samantha", "Alex") */
  voice: string;
  /** Speech rate in words per minute (50-400) */
  rate: number;
  /** Volume level (0-100) */
  volume: number;
  /** Minimum response length to speak (0 = no minimum) */
  minLength: number;
  /** Maximum response length to speak (0 = no maximum) */
  maxLength: number;
  /** Content filtering options */
  filters: FilterConfig;
  /** Language setting */
  language?: string;
}

/**
 * Result of content filtering
 */
export interface FilterResult {
  /** Whether content should be spoken */
  shouldSpeak: boolean;
  /** Filtered/sanitized text */
  text: string;
  /** Reason for filtering (if not speaking) */
  reason?: string;
}

/**
 * MCP tool input for speak_text
 */
export interface SpeakTextInput {
  /** Text to speak */
  text: string;
  /** Voice name (overrides config) */
  voice?: string;
  /** Speech rate in WPM (overrides config) */
  rate?: number;
  /** Volume level 0-100 (overrides config) */
  volume?: number;
}

/**
 * Available voice information
 */
export interface VoiceInfo {
  /** Voice name */
  name: string;
  /** Voice display name */
  displayName: string;
  /** Language code */
  language: string;
  /** Voice quality */
  quality?: string;
}
