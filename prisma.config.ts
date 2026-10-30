import { config as loadEnvironment } from 'dotenv';
import { defineConfig } from 'prisma/config';
import { applyEnvironmentAliases } from './config/environment-aliases';

// Prisma 6 skips its automatic .env loading when a config file is present.
// Use the same precedence and aliases as the backend and provider wrapper.
loadEnvironment();
applyEnvironmentAliases();

const provider = process.env.DATABASE_PROVIDER ?? 'mysql';
if (!['mysql', 'postgresql', 'psql_bouncer'].includes(provider)) {
  throw new Error('DATABASE_PROVIDER must be mysql, postgresql, or psql_bouncer.');
}

// A full MySQL schema.prisma is supplied for standard Prisma CLI usage. The
// provider-specific files remain available to existing scripts and deployments.
// Migration history is selected by the db:migrate/db:deploy wrappers, not here.
export default defineConfig({
  schema: provider === 'mysql' ? 'prisma/schema.prisma' : `prisma/${provider}-schema.prisma`,
});
