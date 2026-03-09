#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/welico/agent-speech-opencode.git"
PLUGIN_ROOT="${HOME}/.config/opencode/plugins/agent-speech-opencode"
ENTRY_FILE="${HOME}/.config/opencode/plugins/agent-speech.js"

mkdir -p "${HOME}/.config/opencode/plugins"

if [ -d "${PLUGIN_ROOT}/.git" ]; then
  git -C "${PLUGIN_ROOT}" pull --ff-only
else
  git clone "${REPO_URL}" "${PLUGIN_ROOT}"
fi

cat > "${ENTRY_FILE}" <<EOF
import AgentSpeechPlugin from '${PLUGIN_ROOT}/dist/opencode-plugin.js';

export default AgentSpeechPlugin;
EOF

echo "Installed from GitHub at: ${PLUGIN_ROOT}"
echo "Plugin entry created: ${ENTRY_FILE}"
echo "Restart OpenCode to apply changes."
