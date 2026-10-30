#!/usr/bin/env bash
set -euo pipefail
# Install dependencies only. Configuration and migrations are deliberately
# separate so this helper never overwrites a database or downloads a shell script.
command -v node >/dev/null || { echo 'Install Node.js 22 first.' >&2; exit 1; }
node -e 'if (Number(process.versions.node.split(".")[0]) < 20) { console.error("Node.js 20 or newer is required."); process.exit(1); }'
npm ci
npm --prefix frontend ci
echo 'Dependencies installed. Follow README.md to configure TiDB, review migrations, and start Ceyteq.'
