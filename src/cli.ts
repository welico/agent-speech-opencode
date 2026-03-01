#!/usr/bin/env node
import {
  cmdInit,
  cmdEnable,
  cmdDisable,
  cmdToggle,
  cmdStatus,
  cmdReset,
  cmdSetVoice,
  cmdSetRate,
  cmdSetVolume,
  cmdListVoices,
  cmdHelp,
} from './commands/index.js';
import { formatError } from './utils/format.js';

async function main(): Promise<number> {
  const args = process.argv.slice(2);

  if (args.length === 0) return cmdHelp();

  const [command, ...rest] = args;

  switch (command) {
    case 'init': return cmdInit();
    case 'enable': return cmdEnable();
    case 'disable': return cmdDisable();
    case 'toggle': return cmdToggle();
    case 'status': return cmdStatus();
    case 'reset': return cmdReset();
    case 'set-voice': return cmdSetVoice(rest[0]);
    case 'set-rate': return cmdSetRate(rest[0]);
    case 'set-volume': return cmdSetVolume(rest[0]);
    case 'list-voices': return cmdListVoices();
    case 'help':
    case '--help':
    case '-h': return cmdHelp();
    default:
      formatError(`Unknown command: ${command}`);
      formatError('Run "agent-speech help" for usage');
      return 1;
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    formatError('Unexpected error:', error);
    process.exit(1);
  });
