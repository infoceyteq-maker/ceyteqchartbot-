'use client';

import type { ReactNode } from 'react';
import { AlertCircle, ArrowRight, X } from 'lucide-react';
import { initials } from '@/lib/api';

export function BrandMark({ small = false }: { small?: boolean }) {
  return <span className={`brand-mark ${small ? 'brand-mark-small' : ''}`} aria-hidden="true"><img src="/ceyteq-mark.svg" alt="" /></span>;
}

export function Avatar({ name, index = 0, size = 'normal' }: { name: string; index?: number; size?: 'normal' | 'large' }) {
  return <span className={`avatar avatar-${index % 6} ${size === 'large' ? 'avatar-large' : ''}`} aria-hidden="true">{initials(name)}</span>;
}

export function StatusPill({ status, sample = false }: { status: string; sample?: boolean }) {
  const open = status === 'open';
  const pending = status === 'connecting';
  return <span className={`status-pill ${open ? 'status-open' : pending ? 'status-pending' : 'status-closed'}`}><i />{sample ? 'Sample' : open ? 'Connected' : pending ? 'Connecting' : 'Disconnected'}</span>;
}

export function Modal({ title, subtitle, onClose, children, wide = false }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return <div className="modal-backdrop" onMouseDown={onClose}>
    <div className={`modal-card ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className="modal-heading"><div><span className="eyebrow">CEYTEQ WORKSPACE</span><h2 id="modal-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button></div>
      {children}
    </div>
  </div>;
}

export function Notice({ children, type = 'error' }: { children: ReactNode; type?: 'error' | 'info' | 'success' }) {
  return <div className={`notice notice-${type}`} role={type === 'error' ? 'alert' : 'status'}><AlertCircle size={16} /><span>{children}</span></div>;
}

export function EmptyState({ title, description, action, onAction }: { title: string; description: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state"><div className="empty-icon"><span>✦</span></div><strong>{title}</strong><p>{description}</p>{action && onAction && <button className="text-action" onClick={onAction}>{action} <ArrowRight size={15} /></button>}</div>;
}

export function SectionTitle({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="section-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action && <div className="heading-actions">{action}</div>}</div>;
}
