import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, COOKIE_NAME, isSameOriginRequest, unsealSession, readLimitedBody } from '@/lib/server';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ path: string[] }> };
const actions: Record<string, Record<string, number>> = {
  GET: { 'instance/fetchInstances': 0, 'instance/connect': 1, 'instance/connectionState': 1, 'webhook/find': 1 },
  POST: { 'instance/create': 0, 'instance/restart': 1, 'chat/findChats': 1, 'chat/findContacts': 1,
    'chat/findMessages': 1, 'message/sendText': 1, 'webhook/set': 1 },
  DELETE: { 'instance/delete': 1, 'instance/logout': 1 },
};

function safeInstances(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ({
    id: item.id, name: item.name, connectionStatus: item.connectionStatus,
    ownerJid: item.ownerJid, profileName: item.profileName, number: item.number,
    integration: item.integration, createdAt: item.createdAt,
    _count: item._count ? { Message: item._count.Message, Chat: item._count.Chat, Contact: item._count.Contact } : undefined,
  }));
}

async function handle(request: NextRequest, context: Context) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 });
  const apiKey = unsealSession(request.cookies.get(COOKIE_NAME)?.value);
  if (!apiKey) return NextResponse.json({ error: 'Connect your workspace first.' }, { status: 401 });
  const parts = (await context.params).path;
  const action = parts.slice(0, 2).join('/');
  const extra = actions[request.method]?.[action];
  if (extra === undefined || parts.length !== 2 + extra || parts.some((part) => !part || /[\\/\x00-\x1f]/.test(part) || part === '.' || part === '..' || part.length > 150)) {
    return NextResponse.json({ error: 'This API action is not available.' }, { status: 404 });
  }
  let body: string | undefined;
  if (request.method === 'POST') {
    try {
      body = await readLimitedBody(request, 32768);
      const parsed = JSON.parse(body || '{}');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid object');
    } catch (error) {
      if (error instanceof RangeError) return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
      return NextResponse.json({ error: 'Invalid JSON object.' }, { status: 400 });
    }
  }
  try {
    // Preserve existing secret webhook headers and flags without returning them to the browser.
    if (action === 'webhook/set' && body) {
      const input = JSON.parse(body);
      if (!input.webhook || typeof input.webhook !== 'object' || Array.isArray(input.webhook)) {
        return NextResponse.json({ error: 'Invalid webhook settings.' }, { status: 400 });
      }
      const existingResponse = await backendFetch(`/webhook/find/${encodeURIComponent(parts[2])}`, apiKey);
      if (!existingResponse.ok) return NextResponse.json({ error: 'Could not load current webhook settings.' }, { status: 502 });
      const existing = await existingResponse.json();
      input.webhook = { ...input.webhook, headers: existing?.headers || {}, byEvents: !!existing?.webhookByEvents, base64: !!existing?.webhookBase64 };
      body = JSON.stringify(input);
    }
    const response = await backendFetch('/' + parts.map(encodeURIComponent).join('/'), apiKey, { method: request.method, body });
    let data: any;
    try { data = await response.json(); } catch { data = { error: 'Unexpected response from the Ceyteq API.' }; }
    if (!response.ok || data?.error === true) {
      const status = response.ok ? 502 : response.status;
      const detail = data?.response?.message || data?.message || data?.error;
      // Internal errors may contain database URLs or other server-side secrets.
      const message = status >= 500 ? 'The Ceyteq API could not complete the request.'
        : Array.isArray(detail) ? detail.join(', ') : String(detail || 'The API request failed.');
      return NextResponse.json({ error: message }, { status });
    }
    if (action === 'instance/fetchInstances') data = safeInstances(data);
    if (action === 'instance/create') data = {
      instance: data?.instance ? {
        instanceName: data.instance.instanceName, instanceId: data.instance.instanceId,
        status: data.instance.status, integration: data.instance.integration,
      } : null,
      qrcode: data?.qrcode,
    };
    if (action === 'webhook/find' || action === 'webhook/set') {
      data = data ? { enabled: data.enabled, url: data.url, events: data.events } : null;
    }
    return NextResponse.json(data ?? null, { status: response.status, headers: { 'cache-control': 'no-store' } });
  } catch {
    const message = action === 'message/sendText'
      ? 'Could not confirm whether the message was sent. Check the conversation before retrying.'
      : 'Cannot reach the Ceyteq API. Check the server and try again.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
