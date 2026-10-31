import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const key = 'test-global-api-key';
const calls = [];
let backend;
let next;
let base;
let cookie;
let output = '';

async function getFreePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function json(res, status, value) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(value));
}

before(async () => {
  backend = createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : undefined;
    calls.push({ method: req.method, url: req.url, key: req.headers.apikey, body });
    if (req.headers.apikey !== key) return json(res, 401, { error: 'Unauthorized' });
    const url = req.url;
    if (url === '/instance/fetchInstances') return json(res, 200, [{ id: 'i1', name: 'support', connectionStatus: 'open', integration: 'WHATSAPP-BAILEYS', token: 'instance-secret', Chatwoot: { token: 'chatwoot-secret' }, _count: { Message: 3, Chat: 1, Contact: 1, secret: 'hidden' } }]);
    if (url === '/instance/create') return json(res, 201, { instance: { instanceName: body.instanceName, instanceId: 'i2', status: 'close', integration: body.integration, accessTokenWaBusiness: 'business-secret', webhookWaBusiness: 'webhook-secret' }, hash: 'new-instance-secret', webhook: { webhookHeaders: { authorization: 'hidden' } } });
    if (url === '/instance/connect/support') return json(res, 200, { base64: 'data:image/png;base64,aGVsbG8=' });
    if (url === '/instance/connectionState/support') return json(res, 200, { instance: { state: 'open' } });
    if (url === '/chat/findChats/support') return json(res, 200, [{ id: 'contact1', remoteJid: '94770000000@s.whatsapp.net', pushName: 'Nila' }]);
    if (url === '/chat/findContacts/support') return json(res, 200, [{ id: 'contact1', remoteJid: '94770000000@s.whatsapp.net', pushName: 'Nila' }]);
    if (url === '/chat/findMessages/support') return json(res, 200, { messages: { records: [{ id: 'm1', key: { remoteJid: '94770000000@s.whatsapp.net' }, message: { conversation: 'Hello' } }] } });
    if (url === '/message/sendText/support') {
      if (body?.text === 'invalid') return json(res, 400, { response: { message: ['Recipient is invalid'] } });
      if (body?.text === 'server-error') return json(res, 500, { response: { message: 'mysql://db-secret:password@internal/' } });
      return json(res, 201, { key: { id: 'm2' } });
    }
    if (url === '/webhook/find/support') return json(res, 200, { enabled: true, url: 'https://receiver.example/hook', events: ['MESSAGES_UPSERT', 'CONTACTS_UPDATE'], headers: { Authorization: 'Bearer webhook-secret' }, webhookByEvents: true, webhookBase64: true });
    if (url === '/webhook/set/support') return json(res, 201, { ...body.webhook, headers: body.webhook.headers });
    if (url === '/instance/delete/support') return json(res, 200, { status: 'SUCCESS' });
    return json(res, 404, { error: 'not mocked' });
  });
  backend.listen(0, '127.0.0.1');
  await once(backend, 'listening');
  const port = await getFreePort();
  base = `http://127.0.0.1:${port}`;
  next = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', NEXT_DIST_DIR: '.next/contract-test', CEYTEQ_API_URL: `http://127.0.0.1:${backend.address().port}`, CEYTEQ_SESSION_SECRET: 'contract-test-session-secret-unique-and-long-2026', NEXT_PUBLIC_SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_ANON_KEY: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  next.stdout.on('data', (chunk) => { output += chunk; });
  next.stderr.on('data', (chunk) => { output += chunk; });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Next did not start.\n${output}`)), 90000);
    const onData = (chunk) => {
      if (chunk.toString().includes('Ready')) { clearTimeout(timer); resolve(); }
    };
    next.stdout.on('data', onData);
    next.once('exit', (code) => { clearTimeout(timer); reject(new Error(`Next exited (${code}).\n${output}`)); });
  });
});

after(async () => {
  if (next && next.exitCode === null) {
    next.kill('SIGTERM');
    await once(next, 'exit');
  }
  if (backend?.listening) await new Promise((resolve) => backend.close(resolve));
});

function call(path, { method = 'GET', body, headers = {}, useCookie = true } = {}) {
  const defaultHeaders = { 'x-ceyteq-request': '1', origin: base };
  if (useCookie && cookie) defaultHeaders.cookie = cookie;
  if (body !== undefined && typeof body !== 'string') {
    body = JSON.stringify(body);
    defaultHeaders['content-type'] = 'application/json';
  }
  return fetch(base + path, { method, headers: { ...defaultHeaders, ...headers }, body });
}

test('control screen and existing workspace routes render without exposing proxy access', async () => {
  const page = await fetch(base);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /<title>Ceyteq Digital Platform<\/title>/);
  assert.match(html, /System Status/);
  assert.match(html, /Checking your workspace connection/);
  assert.match(html, /Does not indicate channel or database health/);
  for (const path of ['/workspace', '/channels', '/settings']) assert.ok(html.includes(`href="${path}"`));
  for (const contact of ['tel:+94788607143', 'tel:+94768607143', 'mailto:info.ceyteq@gmail.com', 'http://ceyteq.online/']) {
    assert.ok(html.includes(`href="${contact}"`), `Missing contact link: ${contact}`);
  }
  const socialLinks = {
    Facebook: 'https://www.facebook.com/share/1KM2kZvaCC/',
    Instagram: 'https://www.instagram.com/ceyteq/',
    'X (Twitter)': 'https://x.com/CeylonTech22598',
    LinkedIn: 'https://www.linkedin.com/in/ceylon-technology',
    TikTok: 'https://www.tiktok.com/@ceyteq?lang=en-GB',
    YouTube: 'https://youtube.com/@ceylontechnology-ceyteq?si=a4L-B_OZjvhjO7sw',
    Pinterest: 'https://www.pinterest.com/infoceyteq/',
  };
  for (const [name, url] of Object.entries(socialLinks)) {
    assert.ok(html.includes(name), `Missing social link label: ${name}`);
    assert.ok(html.includes(`href="${url}"`), `Incorrect social link URL: ${name}`);
  }
  assert.ok(html.includes('href="https://wa.me/94788607143"'));
  for (const path of ['/workspace', '/conversations', '/contacts', '/channels', '/integrations', '/settings', '/support']) {
    const workspace = await fetch(base + path);
    assert.equal(workspace.status, 200, path);
    assert.match(await workspace.text(), /Sample workspace/, path);
  }
  const response = await call('/api/backend/instance/fetchInstances', { useCookie: false });
  assert.equal(response.status, 401);
});

test('Baduma customer shell has isolated navigation, exact contact links, and protected profile', async () => {
  const response = await fetch(base + '/login');
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Baduma \| Customer<\/title>/);
  const navigation = html.match(/<nav class="baduma-nav" aria-label="Customer navigation">([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(navigation);
  for (const [name, path] of [['Menu', '/menu'], ['Cart', '/cart'], ['Track Orders', '/track-orders'], ['Profile', '/profile']]) {
    assert.ok(navigation.includes(name), name);
    assert.ok(navigation.includes(`href="${path}"`), path);
  }
  assert.doesNotMatch(navigation, /Admin|Staff|Driver/i);
  for (const expected of [
    'https://www.facebook.com/share/1FPwigZWbq/?mibextid=wwXIfr',
    'https://www.instagram.com/badum.sl?obrf=ZTdnZHQzZ3BzbTZ0&amp;utm_source=qr',
    'https://wa.me/94779481682',
    'https://maps.app.goo.gl/8c6MEqyV3ReS7Z5r6?g_st=ic',
    'tel:+94770701682', 'mailto:Sadunchamila405@gmail.com',
    'Sadun Chamila', 'Baduma.malgammana', '+94 77 070 1682', '+94 77 948 1682',
  ]) assert.ok(html.includes(expected), expected);
  for (const path of ['/menu', '/cart', '/track-orders']) assert.equal((await fetch(base + path)).status, 200, path);
  const profile = await fetch(base + '/profile', { redirect: 'manual' });
  assert.equal(profile.status, 307);
  assert.equal(profile.headers.get('location'), '/login');
  const callback = await fetch(base + '/auth/callback?next=https://evil.example', { redirect: 'manual' });
  assert.equal(callback.status, 303);
  assert.equal(callback.headers.get('location'), '/login?auth_error=invalid_link');
});

test('custom header and same-origin protections reject invalid requests', async () => {
  const count = calls.length;
  assert.equal((await fetch(base + '/api/session')).status, 403);
  assert.equal((await call('/api/session', { headers: { origin: 'https://evil.example' } })).status, 403);
  assert.equal((await call('/api/session', { method: 'POST', body: { apiKey: key }, headers: { origin: 'https://evil.example' } })).status, 403);
  assert.equal(calls.length, count);
});

test('API keys are verified and held in an encrypted, HTTP-only cookie', async () => {
  const bad = await call('/api/session', { method: 'POST', body: { apiKey: 'wrong-key' } });
  assert.equal(bad.status, 401);
  assert.equal(bad.headers.get('set-cookie'), null);
  const good = await call('/api/session', { method: 'POST', body: { apiKey: key }, headers: { 'x-forwarded-proto': 'https' } });
  assert.equal(good.status, 200);
  const setCookie = good.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=strict/i);
  assert.match(setCookie, /Secure/i);
  assert.doesNotMatch(setCookie, /test-global-api-key|dGVzdC1nbG9iYWwtYXBpLWtleQ/);
  cookie = setCookie.split(';')[0];
  assert.deepEqual(await (await call('/api/session')).json(), { authenticated: true });
  const altered = cookie.slice(0, -4) + 'abcd';
  assert.deepEqual(await (await call('/api/session', { headers: { cookie: altered } })).json(), { authenticated: false });
});

test('proxy exposes only allowed actions and filters instance credentials', async () => {
  const beforeCalls = calls.length;
  assert.equal((await call('/api/backend/settings/find/support')).status, 404);
  assert.equal((await call('/api/backend/instance/fetchInstances/extra')).status, 404);
  assert.equal((await call('/api/backend/instance/create')).status, 404);
  assert.equal(calls.length, beforeCalls);
  const response = await call('/api/backend/instance/fetchInstances');
  const text = await response.text();
  assert.equal(response.status, 200);
  assert.doesNotMatch(text, /instance-secret|chatwoot-secret|hidden/);
  assert.deepEqual(JSON.parse(text)[0]._count, { Message: 3, Chat: 1, Contact: 1 });
  assert.equal(calls.at(-1).key, key);
});

test('channel, contacts, conversation and message operations use the real API contracts', async () => {
  const create = await call('/api/backend/instance/create', { method: 'POST', body: { instanceName: 'new', integration: 'WHATSAPP-BAILEYS', qrcode: false } });
  assert.equal(create.status, 201);
  const createText = await create.text();
  assert.doesNotMatch(createText, /secret|hash|webhookWaBusiness|accessToken/);
  assert.equal(JSON.parse(createText).instance.instanceName, 'new');
  assert.equal((await call('/api/backend/instance/connect/support')).status, 200);
  assert.equal((await call('/api/backend/instance/connectionState/support')).status, 200);
  for (const path of ['findChats', 'findContacts', 'findMessages']) {
    const result = await call(`/api/backend/chat/${path}/support`, { method: 'POST', body: { offset: 100, page: 1 } });
    assert.equal(result.status, 200);
  }
  const result = await call('/api/backend/message/sendText/support', { method: 'POST', body: { number: '94770000000', text: 'Hello' } });
  assert.equal(result.status, 201);
  assert.equal(calls.at(-1).body.text, 'Hello');
  assert.equal((await call('/api/backend/instance/delete/support', { method: 'DELETE' })).status, 200);
});

test('webhook secrets stay server-side and are preserved on update', async () => {
  const found = await call('/api/backend/webhook/find/support');
  const body = await found.text();
  assert.equal(found.status, 200);
  assert.doesNotMatch(body, /webhook-secret|Authorization|webhookBase64|webhookByEvents/);
  const update = await call('/api/backend/webhook/set/support', { method: 'POST', body: { webhook: { enabled: true, url: 'https://receiver.example/new', events: ['MESSAGES_UPSERT', 'CONTACTS_UPDATE'], headers: { Authorization: 'replace-attempt' }, byEvents: false, base64: false } } });
  assert.equal(update.status, 201);
  assert.doesNotMatch(await update.text(), /webhook-secret|Authorization/);
  const forwarded = calls.at(-1).body.webhook;
  assert.equal(forwarded.headers.Authorization, 'Bearer webhook-secret');
  assert.equal(forwarded.byEvents, true);
  assert.equal(forwarded.base64, true);
  assert.deepEqual(forwarded.events, ['MESSAGES_UPSERT', 'CONTACTS_UPDATE']);
});

test('errors, malformed input, and oversized requests are handled safely', async () => {
  const bad = await call('/api/backend/message/sendText/support', { method: 'POST', body: { text: 'invalid' } });
  assert.equal(bad.status, 400);
  assert.match((await bad.json()).error, /Recipient is invalid/);
  const serverError = await call('/api/backend/message/sendText/support', { method: 'POST', body: { text: 'server-error' } });
  assert.equal(serverError.status, 500);
  assert.doesNotMatch(await serverError.text(), /password|db-secret/);
  assert.equal((await call('/api/backend/message/sendText/support', { method: 'POST', body: '{bad' })).status, 400);
  assert.equal((await call('/api/backend/message/sendText/support', { method: 'POST', body: [] })).status, 400);
  assert.equal((await call('/api/backend/message/sendText/support', { method: 'POST', body: { text: 'x'.repeat(33000) } })).status, 413);
  assert.equal((await call('/api/session', { method: 'POST', body: { apiKey: 'x'.repeat(3000) } })).status, 413);
  // Chunked input has no Content-Length; the streaming limit must still hold.
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('x'.repeat(33000))); controller.close(); } });
  const chunked = await fetch(base + '/api/backend/message/sendText/support', { method: 'POST', headers: { 'x-ceyteq-request': '1', origin: base, cookie }, body: stream, duplex: 'half' });
  assert.equal(chunked.status, 413);
  assert.equal((await call('/api/backend/webhook/set/support', { method: 'POST', body: {} })).status, 400);
});

test('disconnect expires the session cookie', async () => {
  const response = await call('/api/session', { method: 'DELETE' });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/i);
  cookie = response.headers.get('set-cookie').split(';')[0];
  assert.deepEqual(await (await call('/api/session')).json(), { authenticated: false });
});
