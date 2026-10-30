'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Radio, RefreshCw, Settings2 } from 'lucide-react';
import { request } from '@/lib/api';
import { checkPlatformConnection } from '@/lib/platform-status.mjs';
import type { CheckedConnectionStatus } from '@/lib/platform-status.mjs';

type ConnectionStatus = 'checking' | CheckedConnectionStatus;

const statusCopy: Record<ConnectionStatus, { label: string; description: string }> = {
  checking: { label: 'Checking', description: 'Checking your workspace connection…' },
  disconnected: { label: 'Not connected', description: 'Connect your workspace to check the Ceyteq API.' },
  online: { label: 'Online', description: 'The Ceyteq API responded to the latest connection check.' },
  unavailable: { label: 'Unable to check', description: 'The connection check failed. Review your workspace settings and try again.' },
};

export function PlatformStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('checking');
    void checkPlatformConnection(request, controller.signal).then((result) => {
      if (!controller.signal.aborted) setStatus(result);
    });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    const timer = window.setInterval(() => setAttempt((value) => value + 1), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="platform-control" aria-labelledby="system-status-title">
      <div className="platform-control-topline">
        <span><i /> CONTROL CENTER</span>
        <span>CEYTEQ / SYSTEM</span>
      </div>
      <div className="platform-control-heading">
        <div>
          <span className="platform-control-eyebrow">YOUR DIGITAL PLATFORM</span>
          <h2 id="system-status-title">System Status<span>.</span></h2>
        </div>
        <div className={`platform-status platform-status-${status}`} role="status" aria-live="polite">
          <span className="platform-status-dot" aria-hidden="true" />
          {statusCopy[status].label}
        </div>
      </div>
      <p className="platform-status-description">{statusCopy[status].description}</p>

      <div className="platform-actions">
        <Link href="/channels" className="platform-action">
          <span className="platform-action-icon"><Radio size={20} aria-hidden="true" /></span>
          <span className="platform-action-text"><strong>Initialize Ceyteq Node</strong><small>Set up a WhatsApp channel</small></span>
          <ArrowUpRight className="platform-action-arrow" size={17} aria-hidden="true" />
        </Link>
        <Link href="/settings" className="platform-action">
          <span className="platform-action-icon"><Settings2 size={20} aria-hidden="true" /></span>
          <span className="platform-action-text"><strong>Network Configurations</strong><small>Manage your workspace connection</small></span>
          <ArrowUpRight className="platform-action-arrow" size={17} aria-hidden="true" />
        </Link>
      </div>

      <div className="platform-control-bottom">
        <span>API connection check <i /> Does not indicate channel or database health</span>
        <button type="button" onClick={() => setAttempt((value) => value + 1)} disabled={status === 'checking'}>
          <RefreshCw size={13} aria-hidden="true" /> Check again
        </button>
      </div>
    </section>
  );
}
