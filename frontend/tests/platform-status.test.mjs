import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkPlatformConnection } from '../lib/platform-status.mjs';

const sessionPath = '/api/session';
const apiPath = '/api/backend/instance/fetchInstances';

test('a missing session is not reported as online and does not call the backend', async () => {
  const signal = new AbortController().signal;
  const calls = [];
  const result = await checkPlatformConnection(async (path, options) => {
    calls.push(path);
    assert.equal(options.signal, signal);
    return { authenticated: false };
  }, signal);
  assert.equal(result, 'disconnected');
  assert.deepEqual(calls, [sessionPath]);
});

test('online requires both an authenticated session and a successful API response', async () => {
  const signal = new AbortController().signal;
  const calls = [];
  const result = await checkPlatformConnection(async (path, options) => {
    calls.push(path);
    assert.equal(options.signal, signal);
    return path === sessionPath ? { authenticated: true } : [];
  }, signal);
  assert.equal(result, 'online');
  assert.deepEqual(calls, [sessionPath, apiPath]);
});

test('a failed session or API request is reported as unable to check', async () => {
  const signal = new AbortController().signal;
  assert.equal(await checkPlatformConnection(async () => { throw new Error('session failure'); }, signal), 'unavailable');
  const calls = [];
  const result = await checkPlatformConnection(async (path) => {
    calls.push(path);
    if (path === sessionPath) return { authenticated: true };
    throw new Error('API failure');
  }, signal);
  assert.equal(result, 'unavailable');
  assert.deepEqual(calls, [sessionPath, apiPath]);
});
