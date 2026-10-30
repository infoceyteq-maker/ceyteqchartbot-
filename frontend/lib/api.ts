export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { 'content-type': 'application/json', 'x-ceyteq-request': '1', ...options.headers },
    cache: 'no-store',
  });
  let data: any;
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) throw new ApiError(data?.error || 'Something went wrong. Please try again.', response.status);
  return data as T;
}

export function backend<T>(path: string, method = 'GET', data?: unknown) {
  return request<T>(`/api/backend/${path}`, { method, body: data === undefined ? undefined : JSON.stringify(data) });
}

export function messageText(message?: { message?: Record<string, any>; messageType?: string }) {
  const body = message?.message;
  if (!body) return message?.messageType ? `[${message.messageType.replace(/Message$/, '')}]` : 'No message yet';
  return body.conversation || body.extendedTextMessage?.text || body.imageMessage?.caption || body.videoMessage?.caption
    || body.documentMessage?.caption || (body.imageMessage ? 'Photo' : body.videoMessage ? 'Video' : body.audioMessage ? 'Voice message' : body.documentMessage ? 'Document' : 'Message');
}

export function contactName(item: { pushName?: string | null; remoteJid: string }) {
  return item.pushName?.trim() || item.remoteJid.split('@')[0] || 'Unknown contact';
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
}

export function displayTime(value?: string | number | null) {
  if (!value) return '—';
  const date = new Date(typeof value === 'number' ? value * 1000 : value);
  if (Number.isNaN(date.getTime())) return '—';
  const sameDay = date.toDateString() === new Date().toDateString();
  return new Intl.DateTimeFormat('en', sameDay ? { hour: 'numeric', minute: '2-digit' } : { month: 'short', day: 'numeric' }).format(date);
}
