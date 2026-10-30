import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, COOKIE_NAME, cookieOptions, isSameOriginRequest, sealSession, unsealSession, readLimitedBody } from '@/lib/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 });
  return NextResponse.json({ authenticated: !!unsealSession(request.cookies.get(COOKIE_NAME)?.value) }, {
    headers: { 'cache-control': 'no-store' },
  });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 });
  let apiKey: unknown;
  try {
    const text = await readLimitedBody(request, 2048);
    apiKey = JSON.parse(text).apiKey;
  } catch (error) {
    if (error instanceof RangeError) return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
    return NextResponse.json({ error: 'Enter your API key.' }, { status: 400 });
  }
  if (typeof apiKey !== 'string' || !apiKey.trim() || apiKey.length > 512 || /[\r\n]/.test(apiKey)) {
    return NextResponse.json({ error: 'Enter a valid API key.' }, { status: 400 });
  }
  let sealed: string;
  try { sealed = sealSession(apiKey.trim()); }
  catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Session configuration is missing.' }, { status: 503 });
  }
  try {
    const response = await backendFetch('/instance/fetchInstances', apiKey.trim());
    if (!response.ok) {
      return NextResponse.json({ error: response.status === 401 || response.status === 403
        ? 'The API key was not accepted.' : 'The Ceyteq API could not verify your key.' }, { status: response.status === 401 ? 401 : 502 });
    }
    const result = NextResponse.json({ authenticated: true }, { headers: { 'cache-control': 'no-store' } });
    result.cookies.set(COOKIE_NAME, sealed, cookieOptions(request));
    return result;
  } catch {
    return NextResponse.json({ error: 'Cannot reach the Ceyteq API. Check the server configuration and try again.' }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 });
  const result = NextResponse.json({ authenticated: false }, { headers: { 'cache-control': 'no-store' } });
  result.cookies.set(COOKIE_NAME, '', { ...cookieOptions(request), maxAge: 0 });
  return result;
}
