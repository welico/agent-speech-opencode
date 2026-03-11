import { ConfigManager } from '../core/config.js';
import { formatSuccess, formatError } from '../utils/format.js';
import { mkdir, writeFile, unlink, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const SUPPORTED_LANGUAGES = new Set([
  'auto',
  'en',
  'ko',
  'ja',
  'zh-CN',
  'es',
  'fr',
  'de',
  'it',
  'ru',
]);

export async function cmdInit(): Promise<number> {
  const config = new ConfigManager();
  await config.init();
  await config.save();
  formatSuccess('Configuration initialized at ~/.agent-speech/config.json');
  return 0;
}

export async function cmdEnable(): Promise<number> {
  const config = new ConfigManager();
  await config.init();
  config.set('enabled', true);
  await config.save();
  formatSuccess('TTS enabled');
  return 0;
}

export async function cmdDisable(): Promise<number> {
  const config = new ConfigManager();
  await config.init();
  config.set('enabled', false);
  await config.save();
  formatSuccess('TTS disabled');
  return 0;
}

export async function cmdToggle(): Promise<number> {
  const config = new ConfigManager();
  await config.init();
  const current = config.get('enabled');
  config.set('enabled', !current);
  await config.save();
  formatSuccess(`TTS ${!current ? 'enabled' : 'disabled'}`);
  return 0;
}

export async function cmdStatus(): Promise<number> {
  const config = new ConfigManager();
  await config.init();
  const cfg = config.getAll();

  console.log('Agent Speech Status');
  console.log(`├─ Enabled: ${cfg.enabled}`);
  console.log(`├─ Voice: ${cfg.voice}`);
  console.log(`├─ Rate: ${cfg.rate} WPM`);
  console.log(`├─ Volume: ${cfg.volume}`);
  console.log(`├─ Min Length: ${cfg.minLength}`);
  console.log(`├─ Max Length: ${cfg.maxLength === 0 ? 'unlimited' : cfg.maxLength}`);
  console.log(`└─ Language: ${cfg.language}`);
  return 0;
}

export async function cmdReset(): Promise<number> {
  const config = new ConfigManager();
  await config.init();
  config.reset();
  await config.save();
  formatSuccess('Configuration reset to defaults');
  return 0;
}

export async function cmdSetVoice(voice: string | undefined): Promise<number> {
  if (!voice) {
    formatError('Voice name required. Example: agent-speech set-voice Samantha');
    return 1;
  }
  const config = new ConfigManager();
  await config.init();
  config.set('voice', voice);
  await config.save();
  formatSuccess(`Voice set to "${voice}"`);
  return 0;
}

export async function cmdSetRate(rateArg: string | undefined): Promise<number> {
  if (!rateArg) {
    formatError('Rate required. Example: agent-speech set-rate 200');
    return 1;
  }
  const rate = parseInt(rateArg, 10);
  if (isNaN(rate) || rate < 50 || rate > 400) {
    formatError('Rate must be a number between 50 and 400');
    return 1;
  }
  const config = new ConfigManager();
  await config.init();
  config.set('rate', rate);
  await config.save();
  formatSuccess(`Rate set to ${rate} WPM`);
  return 0;
}

export async function cmdSetVolume(volumeArg: string | undefined): Promise<number> {
  if (!volumeArg) {
    formatError('Volume required. Example: agent-speech set-volume 50');
    return 1;
  }
  const volume = parseInt(volumeArg, 10);
  if (isNaN(volume) || volume < 0 || volume > 100) {
    formatError('Volume must be a number between 0 and 100');
    return 1;
  }
  const config = new ConfigManager();
  await config.init();
  config.set('volume', volume);
  await config.save();
  formatSuccess(`Volume set to ${volume}`);
  return 0;
}

export async function cmdSetLanguage(languageArg: string | undefined): Promise<number> {
  if (!languageArg) {
    formatError('Language required. Example: agent-speech set-language ko');
    return 1;
  }

  const language = languageArg.trim();
  if (!SUPPORTED_LANGUAGES.has(language)) {
    formatError('Supported languages: auto, en, ko, ja, zh-CN, es, fr, de, it, ru');
    return 1;
  }

  const config = new ConfigManager();
  await config.init();
  config.set('language', language);
  await config.save();
  formatSuccess(`Language set to ${language}`);
  return 0;
}

export async function cmdListVoices(): Promise<number> {
  const { TextToSpeech } = await import('../core/tts.js');
  const tts = new TextToSpeech();
  const voices = await tts.getAvailableVoices();

  console.log('Available voices:');
  for (const v of voices) {
    console.log(`  - ${v.name} (${v.language})`);
  }
  return 0;
}

export async function cmdSpeak(textArg: string[] | undefined): Promise<number> {
  const text = (textArg ?? []).join(' ').trim();
  if (!text) {
    formatError('Text required. Example: agent-speech speak Hello from OpenCode');
    return 1;
  }

  const config = new ConfigManager();
  await config.init();
  const cfg = config.getAll();

  const { TextToSpeech } = await import('../core/tts.js');
  const tts = new TextToSpeech();

  try {
    await tts.speak(text, {
      enabled: cfg.enabled,
      voice: cfg.voice,
      rate: cfg.rate,
      volume: cfg.volume,
      minLength: cfg.minLength,
      maxLength: cfg.maxLength,
      filters: cfg.filters,
    });
    formatSuccess('Speech playback completed');
    return 0;
  } catch (error) {
    formatError('Speech playback failed', error);
    return 1;
  }
}

export async function cmdVersion(): Promise<number> {
  try {
    const packagePath = new URL('../../package.json', import.meta.url);
    const raw = await readFile(packagePath, 'utf-8');
    const parsed = JSON.parse(raw) as { version?: string; name?: string };
    const name = parsed.name ?? '@welico/agent-speech-opencode';
    const version = parsed.version ?? 'unknown';
    console.log(`${name} ${version}`);
    return 0;
  } catch (error) {
    formatError('Failed to read package version', error);
    return 1;
  }
}

function launchAgentPath(): string {
  return join(homedir(), 'Library', 'LaunchAgents', 'com.welico.agent-speech.update.plist');
}

function launchAgentContent(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.welico.agent-speech.update</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/sh</string>
    <string>-lc</string>
    <string>npm install -g @welico/agent-speech-opencode@latest</string>
  </array>
  <key>StartInterval</key>
  <integer>86400</integer>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>
`;
}

export async function cmdEnableAutoUpdate(): Promise<number> {
  const path = launchAgentPath();
  const dir = join(homedir(), 'Library', 'LaunchAgents');

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path, launchAgentContent(), 'utf-8');
    formatSuccess('Auto-update enabled (daily npm update)');
    console.log(`  LaunchAgent file: ${path}`);
    console.log('  To activate now: launchctl load -w ~/Library/LaunchAgents/com.welico.agent-speech.update.plist');
    return 0;
  } catch (error) {
    formatError('Failed to enable auto-update', error);
    return 1;
  }
}

export async function cmdDisableAutoUpdate(): Promise<number> {
  const path = launchAgentPath();

  try {
    await unlink(path);
    formatSuccess('Auto-update disabled');
    console.log('  To unload now: launchctl unload -w ~/Library/LaunchAgents/com.welico.agent-speech.update.plist');
    return 0;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      formatSuccess('Auto-update was already disabled');
      return 0;
    }
    formatError('Failed to disable auto-update', error);
    return 1;
  }
}

export function cmdHelp(): number {
  console.log(`
agent-speech — OpenCode TTS plugin CLI

Commands:
  init              Initialize configuration
  enable            Enable TTS
  disable           Disable TTS
  toggle            Toggle TTS on/off
  status            Show current settings
  reset             Reset to defaults
  set-voice <name>  Set voice (e.g., Samantha, Alex)
  set-rate <wpm>    Set speech rate (50-400)
  set-volume <0-100> Set volume
  set-language <code> Set spoken language (auto, en, ko, ja, zh-CN, es, fr, de, it, ru)
  list-voices       List available voices
  speak <text...>   Speak text immediately
  version           Show installed package version
  enable-auto-update  Enable daily auto-update via launchd
  disable-auto-update Disable daily auto-update via launchd
  help              Show this help
  `.trim());
  return 0;
}
