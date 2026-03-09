#!/usr/bin/env bash
set -euo pipefail

PLUGIN_ROOT="${HOME}/.config/opencode/plugins/agent-speech-opencode"

if [ ! -d "${PLUGIN_ROOT}/.git" ]; then
  echo "GitHub install not found at ${PLUGIN_ROOT}"
  echo "Run scripts/install-from-github.sh first."
  exit 1
fi

git -C "${PLUGIN_ROOT}" pull --ff-only
echo "Updated plugin from GitHub. Restart OpenCode to apply changes."
