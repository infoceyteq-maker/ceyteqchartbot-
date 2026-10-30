import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { NextRequest } from 'next/server';

export const COOKIE_NAME = 'ceyteq_session';
const SESSION_SECONDS = 60 * 60 * 12;

function sessionKey() {
  const secret = process.env.CEYTEQ_SESSION_SECRET;
  if (!secret || secret.length < 32 || secret === 'replace-with-a-long-random-session-secret') {
    throw new Error('Set CEYTEQ_SESSION_SECRET to a unique random value of at least 32 characters.');
  }
  return createHash('sha256').update(secret).digest();
}

export function sealSession(apiKey: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', sessionKey(), iv);
  const plaintext = JSON.stringify({ apiKey, expires: Date.now() + SESSION_SECONDS * 1000 });
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url');
}

export function unsealSession(value: string | undefined): string | null {
  if (!value || value.length > 4096) return null;
  try {
    const data = Buffer.from(value, 'base64url');
    if (data.length < 29) return null;
    const decipher = createDecipheriv('aes-256-gcm', sessionKey(), data.subarray(0, 12));
    decipher.setAuthTag(data.subarray(12, 28));
    const session = JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString('utf8'));
    return typeof session.apiKey === 'string' && typeof session.expires === 'number' && session.expires > Date.now()
      ? session.apiKey : null;
  } catch {
    return null;
  }
}

export function cookieOptions(request: NextRequest) {
  const secure = request.headers.get('x-forwarded-proto')?.split(',')[0].trim() === 'https'
    || request.nextUrl.protocol === 'https:';
  return { httpOnly: true, secure, sameSite: 'strict' as const, path: '/', maxAge: SESSION_SECONDS };
}

// A custom header cannot be sent cross-origin by a browser without a CORS
// preflight, which these endpoints never allow. Also reject mismatched Origins.
export function isSameOriginRequest(request: NextRequest) {
  if (request.headers.get('x-ceyteq-request') !== '1') return false;
  const origin = request.headers.get('origin');
  if (!origin) return true; // Same-origin GETs normally omit Origin.
  try {
    const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').split(',')[0].trim();
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// Read at most the specified number of bytes even for chunked requests without
// a Content-Length header. Do not buffer an unbounded body before checking it.
export async function readLimitedBody(request: NextRequest, limit: number) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > limit) throw new RangeError('Request is too large.');
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new RangeError('Request is too large.');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export function apiUrl(path: string) {
  const base = new URL(process.env.CEYTEQ_API_URL || 'http://127.0.0.1:8080');
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
    throw new Error('CEYTEQ_API_URL must be an HTTP(S) URL without credentials, query, or fragment.');
  }
  base.pathname = `${base.pathname.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  return base.toString();
}

export async function backendFetch(path: string, apiKey: string, init: RequestInit = {}) {
  return fetch(apiUrl(path), {
    ...init,
    headers: { apikey: apiKey, 'content-type': 'application/json' },
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
  });
}
