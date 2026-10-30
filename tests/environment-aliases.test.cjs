const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { applyEnvironmentAliases } = require('../config/environment-aliases');

const root = path.resolve(__dirname, '..');
const fixture = path.join(__dirname, 'fixtures', 'print-runtime-config.ts');
const cliFixture = path.join(__dirname, 'fixtures', 'print-prisma-env.cjs');
const fakeUrl = 'mysql://test_user:test_password@tidb.invalid:4000/ceyteq?sslaccept=strict';
const oldUrl = 'mysql://old_user:old_password@old.invalid:4000/ceyteq?sslaccept=strict';

function cleanEnv() {
  const env = { ...process.env };
  for (const key of [
    'DATABASE_URL',
    'DATABASE_CONNECTION_URI',
    'DATABASE_BOUNCER_CONNECTION_URI',
    'SHADOW_DATABASE_URL',
    'DATABASE_PROVIDER',
    'SERVER_PORT',
    'PORT',
    'AUTHENTICATION_API_KEY',
    'GLOBAL_API_KEY',
    'SERVER_URL',
    'DOCKER_ENV',
  ])
    delete env[key];
  env.DATABASE_PROVIDER = 'mysql';
  return env;
}

function isolatedDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ceyteq-env-test-'));
}

function run(program, args, options) {
  const result = spawnSync(program, args, { encoding: 'utf8', ...options });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

test('maps the short names without altering their values', () => {
  const env = { DATABASE_URL: fakeUrl, PORT: '8080', GLOBAL_API_KEY: 'example-key' };
  applyEnvironmentAliases(env);
  assert.equal(env.DATABASE_CONNECTION_URI, fakeUrl);
  assert.equal(env.SERVER_PORT, '8080');
  assert.equal(env.AUTHENTICATION_API_KEY, 'example-key');
});

test('existing names win; empty existing values fall back to the alias', () => {
  const env = {
    DATABASE_URL: fakeUrl,
    DATABASE_CONNECTION_URI: oldUrl,
    PORT: '8080',
    SERVER_PORT: '',
    GLOBAL_API_KEY: 'example-key',
    AUTHENTICATION_API_KEY: 'existing-key',
  };
  applyEnvironmentAliases(env);
  assert.equal(env.DATABASE_CONNECTION_URI, oldUrl);
  assert.equal(env.SERVER_PORT, '8080');
  assert.equal(env.AUTHENTICATION_API_KEY, 'existing-key');
});

test('does not create credentials or ports when values are absent', () => {
  const env = {};
  applyEnvironmentAliases(env);
  assert.deepEqual(env, {});
});

test('runtime loads the supplied .env names, including in containers', () => {
  const cwd = isolatedDir();
  try {
    fs.writeFileSync(
      path.join(cwd, '.env'),
      `DATABASE_URL="${fakeUrl}"\nPORT=9001\nSERVER_URL="http://localhost:9001"\nGLOBAL_API_KEY="test-key"\n`,
    );
    const env = { ...cleanEnv(), DOCKER_ENV: 'true' };
    const result = run(process.execPath, [require.resolve('tsx/cli'), fixture], { cwd, env });
    assert.deepEqual(result, {
      databaseUrl: fakeUrl,
      prismaUrlEnv: fakeUrl,
      serverPort: 9001,
      serverUrl: 'http://localhost:9001',
      apiKey: 'test-key',
    });
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('runtime retains precedence for legacy names', () => {
  const cwd = isolatedDir();
  try {
    const env = {
      ...cleanEnv(),
      DATABASE_URL: fakeUrl,
      DATABASE_CONNECTION_URI: oldUrl,
      PORT: '9001',
      SERVER_PORT: '9100',
      GLOBAL_API_KEY: 'alias-key',
      AUTHENTICATION_API_KEY: 'legacy-key',
    };
    const result = run(process.execPath, [require.resolve('tsx/cli'), fixture], { cwd, env });
    assert.deepEqual(result, {
      databaseUrl: oldUrl,
      prismaUrlEnv: oldUrl,
      serverPort: 9100,
      serverUrl: null,
      apiKey: 'legacy-key',
    });
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('Prisma command wrapper forwards DATABASE_URL as DATABASE_CONNECTION_URI', () => {
  const cwd = isolatedDir();
  try {
    fs.writeFileSync(path.join(cwd, '.env'), `DATABASE_URL="${fakeUrl}"\nPORT=9001\nGLOBAL_API_KEY="test-key"\n`);
    const command = `"${process.execPath}" "${cliFixture}"`;
    const result = run(process.execPath, [path.join(root, 'runWithProvider.js'), command], { cwd, env: cleanEnv() });
    assert.deepEqual(result, { databaseUrl: fakeUrl, serverPort: '9001', apiKey: 'test-key' });
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('Prisma command wrapper preserves an existing connection URI', () => {
  const cwd = isolatedDir();
  try {
    const env = { ...cleanEnv(), DATABASE_URL: fakeUrl, DATABASE_CONNECTION_URI: oldUrl };
    const command = `"${process.execPath}" "${cliFixture}"`;
    const result = run(process.execPath, [path.join(root, 'runWithProvider.js'), command], { cwd, env });
    assert.equal(result.databaseUrl, oldUrl);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('db:push selects the configured provider schema and forwards the database alias', () => {
  const cwd = isolatedDir();
  try {
    const packageScript = require('../package.json').scripts['db:push'];
    const match = packageScript.match(/^node runWithProvider\.js "(npx prisma .+)"$/);
    assert.ok(match, 'db:push must use the provider-aware wrapper');
    // Substitute a harmless fixture for npx: never contact or modify a database.
    const command = match[1].replace(/^npx prisma/, `"${process.execPath}" "${cliFixture}" prisma`);
    for (const provider of ['mysql', 'postgresql']) {
      const env = { ...cleanEnv(), DATABASE_PROVIDER: provider, DATABASE_URL: fakeUrl };
      const result = run(process.execPath, [path.join(root, 'runWithProvider.js'), command], { cwd, env });
      assert.equal(result.databaseUrl, fakeUrl);
      assert.deepEqual(result.args, ['prisma', 'db', 'push', '--schema', `./prisma/${provider}-schema.prisma`]);
    }
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('the default Prisma schema mirrors the complete TiDB/MySQL schema', () => {
  const mysqlSchema = fs.readFileSync(path.join(root, 'prisma', 'mysql-schema.prisma'), 'utf8').replace(/\r\n/g, '\n');
  const defaultSchema = fs.readFileSync(path.join(root, 'prisma', 'schema.prisma'), 'utf8').replace(/\r\n/g, '\n');
  assert.equal(defaultSchema, mysqlSchema, 'Run npm run db:sync-schema after updating the MySQL schema.');
  assert.match(defaultSchema, /provider\s*=\s*"mysql"/);
  assert.match(defaultSchema, /binaryTargets\s*=\s*\["native", "debian-openssl-3\.0\.x"\]/);
  assert.match(defaultSchema, /model Instance\s*\{/);
  assert.match(defaultSchema, /model Message\s*\{/);
});

test('direct Prisma CLI selects the provider schema and loads DATABASE_URL from .env', () => {
  const cwd = isolatedDir();
  try {
    // Static schema validation uses placeholder engine paths: this does not
    // start an engine, connect to TiDB, or validate its runtime compatibility.
    const env = {
      ...cleanEnv(),
      PRISMA_SCHEMA_ENGINE_BINARY: process.execPath,
      PRISMA_QUERY_ENGINE_LIBRARY: process.execPath,
    };
    delete env.DATABASE_PROVIDER;
    fs.writeFileSync(path.join(cwd, '.env'), `DATABASE_URL="${fakeUrl}"\n`);
    const prismaCli = path.join(root, 'node_modules', 'prisma', 'build', 'index.js');
    const config = path.join(root, 'prisma.config.ts');
    const result = spawnSync(process.execPath, [prismaCli, 'validate', '--config', config], {
      cwd,
      env,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /prisma[\\/]schema\.prisma/);
    assert.match(result.stdout, /schema .* valid/i);

    const postgres = spawnSync(process.execPath, [prismaCli, 'validate', '--config', config], {
      cwd,
      env: { ...env, DATABASE_PROVIDER: 'postgresql', DATABASE_URL: 'postgresql://user:pass@localhost:5432/ceyteq' },
      encoding: 'utf8',
    });
    assert.equal(postgres.status, 0, postgres.stderr || postgres.stdout);
    assert.match(postgres.stdout, /prisma[\\/]postgresql-schema\.prisma/);

    const explicitSchema = spawnSync(
      process.execPath,
      [prismaCli, 'validate', '--config', config, '--schema', path.join(root, 'prisma', 'mysql-schema.prisma')],
      { cwd, env: { ...env, DATABASE_PROVIDER: 'postgresql', DATABASE_URL: fakeUrl }, encoding: 'utf8' },
    );
    assert.equal(explicitSchema.status, 0, explicitSchema.stderr || explicitSchema.stdout);
    assert.match(explicitSchema.stdout, /prisma[\\/]mysql-schema\.prisma/);

    const invalid = spawnSync(process.execPath, [prismaCli, 'validate', '--config', config], {
      cwd,
      env: { ...env, DATABASE_PROVIDER: 'unsupported' },
      encoding: 'utf8',
    });
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stderr, /DATABASE_PROVIDER must be mysql, postgresql, or psql_bouncer/);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('the direct Prisma config retains canonical connection precedence', () => {
  const cwd = isolatedDir();
  try {
    const env = { ...cleanEnv(), DATABASE_URL: fakeUrl, DATABASE_CONNECTION_URI: oldUrl };
    const fixture = path.join(root, 'tests', 'fixtures', 'print-prisma-config.ts');
    const result = run(process.execPath, [require.resolve('tsx/cli'), fixture], { cwd, env });
    assert.equal(result.connectionUri, oldUrl);
    assert.equal(result.schema, 'prisma/schema.prisma');
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('the example environment uses branded namespaces without real credentials', () => {
  const values = require('dotenv').parse(fs.readFileSync(path.join(root, '.env.example')));
  assert.equal(values.SERVER_NAME, 'ceyteq');
  assert.equal(values.DATABASE_PROVIDER, 'mysql');
  assert.match(values.DATABASE_URL, /^mysql:\/\/USER:PASSWORD@HOST:4000\/ceyteq\?sslaccept=strict$/);
  assert.equal(values.DATABASE_CONNECTION_CLIENT_NAME, 'ceyteq');
  assert.equal(values.PROVIDER_ENABLED, 'false');
  assert.equal(values.PROVIDER_PREFIX, 'ceyteq');
  assert.equal(values.NATS_ENABLED, 'false');
  assert.equal(values.NATS_EXCHANGE_NAME, 'ceyteq');
  assert.equal(values.KAFKA_TOPIC_PREFIX, 'ceyteq');
  assert.equal(values.GLOBAL_API_KEY, 'replace-with-a-strong-random-api-key');
});
