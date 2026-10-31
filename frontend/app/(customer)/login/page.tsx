'use client';

// Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, enable
// email/SMS Auth, and allow /auth/callback in Supabase redirect settings.

import { ArrowLeft, ArrowRight, Check, LockKeyhole, Mail, MessageCircle, ShieldCheck, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createCustomerBrowserClient } from '@/lib/supabase/client';
import { baduma } from '@/lib/baduma';
import { normalizePhone } from '@/lib/baduma-phone.mjs';

type Method = 'phone' | 'email';

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createCustomerBrowserClient(), []);
  const [method, setMethod] = useState<Method>('phone');
  const [contact, setContact] = useState('');
  const [destination, setDestination] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('auth_error')) {
      setError('That sign-in link could not be verified. It may have expired; request a new one or try again later.');
    }
    if (!supabase) return;
    let cancelled = false;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !cancelled) {
        router.replace('/profile');
        router.refresh();
      }
    }).catch(() => {
      // A failed session check should not prevent a customer from signing in.
    });
    return () => { cancelled = true; };
  }, [router, supabase]);

  function changeMethod(next: Method) {
    setMethod(next);
    setContact('');
    setDestination('');
    setCode('');
    setError('');
    setNotice('');
  }

  async function sendCode(value: string, isResend = false) {
    if (!supabase) {
      setError('Secure sign-in is not configured yet. Please contact Baduma for help.');
      return;
    }
    const recipient = method === 'phone' ? normalizePhone(value) : value.trim();
    if (!recipient) {
      setError(method === 'phone' ? 'Enter a valid phone number, including its country code.' : 'Enter a valid email address.');
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { error: authError } = method === 'phone'
        ? await supabase.auth.signInWithOtp({ phone: recipient })
        : await supabase.auth.signInWithOtp({
          email: recipient,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
      if (authError) throw authError;
      setDestination(recipient);
      setCode('');
      if (isResend) setNotice(method === 'phone' ? 'A new code has been requested.' : 'A new email has been requested.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to send your sign-in details. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendCode(contact);
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !destination) return;
    if (!/^\d{6,8}$/.test(code)) {
      setError('Enter the 6 to 8 digit code you received.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { data, error: authError } = method === 'phone'
        ? await supabase.auth.verifyOtp({ phone: destination, token: code, type: 'sms' })
        : await supabase.auth.verifyOtp({ email: destination, token: code, type: 'email' });
      if (authError) throw authError;
      if (!data.session) throw new Error('Verification did not create a session. Please try again.');
      router.replace('/profile');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not verify that code. Please try again.');
      setBusy(false);
    }
  }

  return (
    <section className="baduma-login bd-grid" aria-labelledby="login-title">
      <div className="baduma-login-intro">
        <div className="baduma-kicker"><span /> CUSTOMER ACCOUNT</div>
        <h1 id="login-title">Good to see <em>you.</em></h1>
        <p>Sign in with your phone or email. No passwords, no long forms.</p>
        <div className="baduma-benefits bd-grid">
          <div className="baduma-benefit">
            <span className="baduma-benefit-icon"><LockKeyhole size={18} aria-hidden="true" /></span>
            <span><strong>Simple &amp; secure</strong><small>One-time access, just for you.</small></span>
          </div>
          <div className="baduma-benefit">
            <span className="baduma-benefit-icon"><MessageCircle size={18} aria-hidden="true" /></span>
            <span><strong>Need a little help?</strong><small><a href={baduma.phone}>Give us a call</a> or <a href={baduma.whatsapp} target="_blank" rel="noopener noreferrer">message us</a>.</small></span>
          </div>
        </div>
      </div>

      <div className="baduma-auth-card">
        <div className="baduma-auth-card-top">
          <div><span className="baduma-card-eyebrow">YOUR ACCOUNT</span><h2>Sign in</h2></div>
          <span className="baduma-auth-icon"><ShieldCheck size={21} aria-hidden="true" /></span>
        </div>
        <p className="baduma-auth-subtitle">Choose how you&apos;d like to continue.</p>

        <div className="baduma-methods" aria-label="Sign-in method">
          <button type="button" className={method === 'phone' ? 'is-selected' : ''} aria-pressed={method === 'phone'} onClick={() => changeMethod('phone')} disabled={busy}>
            <Smartphone size={17} aria-hidden="true" /> Phone
          </button>
          <button type="button" className={method === 'email' ? 'is-selected' : ''} aria-pressed={method === 'email'} onClick={() => changeMethod('email')} disabled={busy}>
            <Mail size={17} aria-hidden="true" /> Email
          </button>
        </div>

        {!destination ? (
          <form onSubmit={handleRequest} className="baduma-auth-form bd-grid">
            <label htmlFor="baduma-contact">{method === 'phone' ? 'Mobile number' : 'Email address'}</label>
            <div className="baduma-input-wrap">
              {method === 'phone' ? <Smartphone size={18} aria-hidden="true" /> : <Mail size={18} aria-hidden="true" />}
              <input
                id="baduma-contact"
                type={method === 'phone' ? 'tel' : 'email'}
                inputMode={method === 'phone' ? 'tel' : 'email'}
                autoComplete={method === 'phone' ? 'tel' : 'email'}
                placeholder={method === 'phone' ? '077 123 4567' : 'you@example.com'}
                value={contact}
                onChange={(event) => { setContact(event.target.value); setError(''); }}
                required
                disabled={busy}
              />
            </div>
            <p className="baduma-field-hint">{method === 'phone' ? 'We’ll text you a one-time verification code.' : 'We’ll email you a secure sign-in link.'}</p>
            {error && <p className="baduma-alert" role="alert">{error}</p>}
            <button className="baduma-primary-button" type="submit" disabled={busy}>
              <span>{busy ? 'Sending…' : method === 'phone' ? 'Send one-time code' : 'Send sign-in link'}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="baduma-auth-form bd-grid">
            <button type="button" className="baduma-back-link" onClick={() => { setDestination(''); setCode(''); setError(''); setNotice(''); }} disabled={busy}>
              <ArrowLeft size={15} aria-hidden="true" /> Use a different {method === 'phone' ? 'number' : 'email'}
            </button>
            <p className="baduma-sent-copy">
              {method === 'phone' ? 'Enter the code sent to ' : 'Open the secure link sent to '}<strong>{destination}</strong>.
              {method === 'email' && ' If your email includes a code, you can enter it below.'}
            </p>
            <label htmlFor="baduma-code">Verification code</label>
            <div className="baduma-input-wrap">
              <LockKeyhole size={18} aria-hidden="true" />
              <input id="baduma-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" maxLength={8} placeholder="Enter your code" value={code} onChange={(event) => { setCode(event.target.value.replace(/\D/g, '')); setError(''); }} required disabled={busy} />
            </div>
            {error && <p className="baduma-alert" role="alert">{error}</p>}
            {notice && <p className="baduma-notice" role="status"><Check size={15} aria-hidden="true" />{notice}</p>}
            <button className="baduma-primary-button" type="submit" disabled={busy}>
              <span>{busy ? 'Verifying…' : 'Verify and continue'}</span><ArrowRight size={18} aria-hidden="true" />
            </button>
            <button className="baduma-resend" type="button" onClick={() => void sendCode(destination, true)} disabled={busy}>Resend {method === 'phone' ? 'code' : 'email'}</button>
          </form>
        )}
        <div className="baduma-auth-security"><ShieldCheck size={15} aria-hidden="true" /> Never share your verification code with anyone.</div>
      </div>
    </section>
  );
}
