#!/usr/bin/env bash
set -euo pipefail
# The image is built with MySQL. Generate the client for another explicitly
# selected provider at runtime before executing any commands.
if [ "${DATABASE_PROVIDER:-mysql}" != "mysql" ]; then
  npm run db:generate
fi
# Migrations are opt-in so starting an existing service does not silently
# change its database. Run them separately after reviewing backups and DDL.
if [ "${RUN_DATABASE_MIGRATIONS:-false}" = "true" ]; then
  npm run db:deploy
fi
exec "$@"
