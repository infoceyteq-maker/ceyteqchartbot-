import { NextResponse } from 'next/server';
import { createCustomerServerClient } from '@/lib/supabase/server';

// The destination is deliberately fixed: callback query parameters cannot
// redirect an authenticated customer to an external site.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const supabase = await createCustomerServerClient();

  if (code && supabase) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.session) return new NextResponse(null, { status: 303, headers: { Location: '/profile', 'Cache-Control': 'no-store' } });
    } catch {
      // An unavailable auth service should return the customer to sign-in.
    }
  }

  return new NextResponse(null, { status: 303, headers: { Location: '/login?auth_error=invalid_link', 'Cache-Control': 'no-store' } });
}
