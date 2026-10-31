import { UserRound } from 'lucide-react';
import { redirect } from 'next/navigation';
import { CustomerSignOut } from '@/components/baduma/sign-out';
import { createCustomerServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createCustomerServerClient();
  if (!supabase) redirect('/login');
  const result = await supabase.auth.getUser().catch(() => null);
  const user = result?.data.user;
  if (result?.error || !user) redirect('/login');

  return (
    <section className="baduma-simple-page" aria-labelledby="profile-title">
      <div className="baduma-kicker"><span /> CUSTOMER ACCOUNT</div>
      <h1 id="profile-title">Your <em>profile.</em></h1>
      <div className="baduma-simple-card">
        <span className="baduma-benefit-icon"><UserRound size={20} aria-hidden="true" /></span>
        <div><span className="baduma-card-eyebrow">SIGNED IN AS</span><p className="baduma-profile-identity">{user.email || user.phone || 'Customer'}</p></div>
        <CustomerSignOut />
      </div>
    </section>
  );
}
