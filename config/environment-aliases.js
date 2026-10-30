/**
 * Support the common deployment variable names while retaining the existing
 * Ceyteq/Prisma names. Explicit, non-empty existing names always take priority.
 * Call after loading .env and before creating a ConfigService or Prisma client.
 */
function applyEnvironmentAliases(env = process.env) {
  const aliases = [
    ['DATABASE_CONNECTION_URI', 'DATABASE_URL'],
    ['SERVER_PORT', 'PORT'],
    ['AUTHENTICATION_API_KEY', 'GLOBAL_API_KEY'],
  ];

  for (const [existingName, aliasName] of aliases) {
    if (!env[existingName] && env[aliasName]) {
      env[existingName] = env[aliasName];
    }
  }
}

module.exports = { applyEnvironmentAliases };
