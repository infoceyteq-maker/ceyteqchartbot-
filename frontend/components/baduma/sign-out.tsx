'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { LogOut } from 'lucide-react';
import { createCustomerBrowserClient } from '@/lib/supabase/client';

export function CustomerSignOut() {
  const supabase = useMemo(() => createCustomerBrowserClient(), []);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function signOut() {
    if (!supabase) return;
    setBusy(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signOut();
      if (authError) throw authError;
      router.replace('/login');
      router.refresh();
    } catch {
      setError('Could not sign out. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" className="baduma-secondary-button" onClick={() => void signOut()} disabled={busy || !supabase}>
        <LogOut size={17} aria-hidden="true" /> {busy ? 'Signing out…' : 'Sign out'}
      </button>
      {error && <p className="baduma-alert" role="alert">{error}</p>}
    </div>
  );
}
