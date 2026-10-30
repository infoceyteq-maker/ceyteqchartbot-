const dotenv = require('dotenv');
const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { applyEnvironmentAliases } = require('./config/environment-aliases');

dotenv.config();
applyEnvironmentAliases();

const { DATABASE_PROVIDER } = process.env;
const databaseProviderDefault = DATABASE_PROVIDER ?? 'mysql';
if (!['mysql', 'postgresql', 'psql_bouncer'].includes(databaseProviderDefault)) {
  console.error('DATABASE_PROVIDER must be mysql, postgresql, or psql_bouncer.');
  process.exit(1);
}

if (!DATABASE_PROVIDER) {
  console.warn(`DATABASE_PROVIDER is not set in the .env file, using default: ${databaseProviderDefault}`);
}

// Map the psql_bouncer client to the PostgreSQL migration history.
function getMigrationsFolder(provider) {
  switch (provider) {
    case 'psql_bouncer':
      return 'postgresql-migrations'; // psql_bouncer usa as migrations do postgresql
    default:
      return `${provider}-migrations`;
  }
}

const migrationsFolder = getMigrationsFolder(databaseProviderDefault);

let command = process.argv
  .slice(2)
  .join(' ')
  .replace(/DATABASE_PROVIDER/g, databaseProviderDefault);

// Substituir referências à pasta de migrations pela pasta correta
const migrationsPattern = new RegExp(`${databaseProviderDefault}-migrations`, 'g');
command = command.replace(migrationsPattern, migrationsFolder);

if (command.includes('rmdir') && existsSync('prisma\\migrations')) {
  try {
    execSync('rmdir /S /Q prisma\\migrations', { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error removing directory: prisma\\migrations`);
    process.exit(1);
  }
} else if (command.includes('rmdir')) {
  console.warn(`Directory 'prisma\\migrations' does not exist, skipping removal.`);
}

try {
  execSync(command, { stdio: 'inherit' });
} catch (error) {
  console.error(`Error executing command: ${command}`);
  process.exit(1);
}