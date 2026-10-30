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
