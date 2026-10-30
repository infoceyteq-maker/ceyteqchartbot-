'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Cable, ChevronDown, CircleHelp, ContactRound, Headphones, LayoutDashboard, Menu, MessagesSquare, Radio, Search, Settings2, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Overview } from '@/components/overview';
import { Channels, Contacts, Conversations, Integrations, Settings, Support } from '@/components/sections';
import { BrandMark, Modal, Notice } from '@/components/ui';
import { backend, request } from '@/lib/api';
import { brand } from '@/lib/brand';
import { demoContacts, demoInstances, sampleChats, sampleThread } from '@/lib/demo';
import type { Chat, Contact, Instance, Message, Webhook } from '@/lib/types';

type Mode = 'sample' | 'live';
type ModalName = 'connect' | 'create' | 'compose' | 'qr' | 'webhook' | null;
const nav = [
  { section: '', label: 'Overview', icon: LayoutDashboard },
  { section: 'conversations', label: 'Conversations', icon: MessagesSquare },
  { section: 'contacts', label: 'Contacts', icon: ContactRound },
  { section: 'channels', label: 'Channels', icon: Radio },
  { section: 'integrations', label: 'Integrations', icon: Cable },
];
const titles: Record<string, string> = { '': 'Overview', conversations: 'Conversations', contacts: 'Contacts', channels: 'Channels', integrations: 'Integrations', settings: 'Settings', support: 'Support' };
const webhookEvents = ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'SEND_MESSAGE', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'];

export function Workspace() {
  const router = useRouter();
  const pathname = usePathname();
  const section = pathname.split('/')[1] || '';
  const [mode, setMode] = useState<Mode>('sample');
  const [instances, setInstances] = useState<Instance[]>(demoInstances);
  const [active, setActive] = useState(demoInstances[0].name);
  const [chats, setChats] = useState<Chat[]>(() => sampleChats());
  const [contacts, setContacts] = useState<Contact[]>(demoContacts);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [thread, setThread] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [modal, setModal] = useState<ModalName>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const [apiKey, setApiKey] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState('');
  const [composeNumber, setComposeNumber] = useState('');
  const [composeText, setComposeText] = useState('');
  const [qrInstance, setQrInstance] = useState<Instance | null>(null);
  const [qrImage, setQrImage] = useState('');
  const [qrMessage, setQrMessage] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookSelected, setWebhookSelected] = useState<string[]>([]);
  const [toast, setToast] = useState('');
  const [reload, setReload] = useState(0);

  const sample = mode === 'sample';
  const navigate = useCallback((destination: string) => { setMobileNav(false); router.push(destination ? `/${destination}` : '/workspace'); }, [router]);
  const openModal = (name: ModalName) => { setFormError(''); setModal(name); };
  const refresh = () => setReload((value) => value + 1);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 4500); };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    let alive = true;
    request<{ authenticated: boolean }>('/api/session').then(({ authenticated }) => {
      if (alive && authenticated) { setMode('live'); setInstances([]); setActive(''); setChats([]); setContacts([]); }
    }).catch(() => { /* Sample mode is available without a configured backend. */ });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (mode !== 'live') return;
    let alive = true;
    setLoading(true); setDataError('');
    backend<Instance[]>('instance/fetchInstances').then((data) => {
      if (!alive) return;
      const list = Array.isArray(data) ? data : [];
      setInstances(list);
      setActive((old) => list.some((item) => item.name === old) ? old : list[0]?.name || '');
    }).catch((error) => { if (alive) { setInstances([]); setActive(''); setDataError(error instanceof Error ? error.message : 'Could not load channels.'); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [mode, reload]);

  useEffect(() => {
    if (mode !== 'live') return;
    if (!active) { setChats([]); setContacts([]); setRecentMessages([]); return; }
    let alive = true;
    setChats([]); setContacts([]); setRecentMessages([]); setSelectedChat(null);
    const name = encodeURIComponent(active);
    Promise.allSettled([
      backend<Chat[]>(`chat/findChats/${name}`, 'POST', { take: 100 }),
      backend<Contact[]>(`chat/findContacts/${name}`, 'POST', { offset: 100, page: 1 }),
      backend<{ messages: { records: Message[] } }>(`chat/findMessages/${name}`, 'POST', { offset: 500, page: 1 }),
    ]).then(([chatResult, contactResult, messageResult]) => {
      if (!alive) return;
      const loadedChats = chatResult.status === 'fulfilled' && Array.isArray(chatResult.value) ? chatResult.value : [];
      setChats(loadedChats);
      setContacts(contactResult.status === 'fulfilled' && Array.isArray(contactResult.value) ? contactResult.value : []);
      setRecentMessages(messageResult.status === 'fulfilled' ? messageResult.value?.messages?.records || [] : []);
      const failures = [chatResult, contactResult, messageResult].filter((result) => result.status === 'rejected');
      if (failures.length) setDataError('Some channel data could not be loaded. Check the channel connection and try refreshing.');
      else setDataError('');
      const selectedId = new URLSearchParams(window.location.search).get('chat');
      if (selectedId) setSelectedChat(loadedChats.find((chat) => chat.remoteJid === selectedId) || null);
    });
    return () => { alive = false; };
  }, [mode, active, reload]);

  useEffect(() => {
    if (!selectedChat) { setThread([]); return; }
    if (sample) { setThread(sampleThread(selectedChat)); return; }
    let alive = true;
    setThreadLoading(true); setThread([]);
    backend<{ messages: { records: Message[] } }>(`chat/findMessages/${encodeURIComponent(active)}`, 'POST', {
      where: { key: { remoteJid: selectedChat.remoteJid } }, offset: 100, page: 1,
    }).then((data) => { if (alive) setThread([...(data.messages?.records || [])].reverse()); })
      .catch((error) => { if (alive) setDataError(error instanceof Error ? error.message : 'Could not load messages.'); })
      .finally(() => { if (alive) setThreadLoading(false); });
    return () => { alive = false; };
  }, [selectedChat, active, sample]);

  // Deep links to a conversation are resolved after its channel's inbox loads.
  useEffect(() => {
    if (section !== 'conversations' || !chats.length) return;
    const jid = new URLSearchParams(window.location.search).get('chat');
    if (jid) setSelectedChat(chats.find((chat) => chat.remoteJid === jid) || null);
  }, [section, chats]);

  const connect = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setFormError('');
    try {
      await request('/api/session', { method: 'POST', body: JSON.stringify({ apiKey }) });
      setApiKey(''); setInstances([]); setActive(''); setChats([]); setContacts([]); setSelectedChat(null); setMode('live'); setModal(null);
      notify('Workspace connected successfully.');
    } catch (error) { setFormError(error instanceof Error ? error.message : 'Could not connect.'); }
    finally { setBusy(false); }
  };
  const disconnect = async () => {
    try { await request('/api/session', { method: 'DELETE' }); }
    catch { setDataError('Could not disconnect. Please try again.'); return; }
    setMode('sample'); setInstances(demoInstances); setActive(demoInstances[0].name); setChats(sampleChats()); setContacts(demoContacts); setRecentMessages([]); setSelectedChat(null); setDataError('');
    notify('Disconnected. You’re now viewing sample data.'); navigate('');
  };
  const openCompose = (number = '') => {
    if (sample) { openModal('connect'); return; }
    if (!instances.length) { notify('Add a channel before sending a message.'); navigate('channels'); return; }
    setComposeNumber(number); setComposeText(''); openModal('compose');
  };
  const sendMessage = async (text: string, number = selectedChat?.remoteJid || '') => {
    if (!active || !number || !text) throw new Error('Choose a channel and recipient first.');
    await backend(`message/sendText/${encodeURIComponent(active)}`, 'POST', { number, text });
    if (selectedChat && number === selectedChat.remoteJid) {
      try {
        const data = await backend<{ messages: { records: Message[] } }>(`chat/findMessages/${encodeURIComponent(active)}`, 'POST', { where: { key: { remoteJid: number } }, offset: 100, page: 1 });
        setThread([...(data.messages?.records || [])].reverse());
      } catch {
        // The send succeeded. Do not report a failed send or invite a duplicate retry.
        setDataError('Message sent, but the conversation could not be refreshed. Refresh to see the latest messages.');
      }
    }
  };
  const createChannel = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setFormError('');
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(newName.trim())) { setFormError('Use 1–80 letters, numbers, hyphens or underscores.'); setBusy(false); return; }
    try {
      const data = await backend<{ instance: { instanceName: string; instanceId: string; status: string } }>('instance/create', 'POST', { instanceName: newName.trim(), integration: 'WHATSAPP-BAILEYS', qrcode: false });
      const name = data.instance?.instanceName || newName.trim();
      setNewName(''); refresh(); notify('Channel created. Connect it to WhatsApp to get started.');
      await showQr({ id: data.instance?.instanceId || name, name, connectionStatus: data.instance?.status || 'close', integration: 'WHATSAPP-BAILEYS' });
    } catch (error) { setFormError(error instanceof Error ? error.message : 'Could not create the channel.'); }
    finally { setBusy(false); }
  };
  const showQr = async (instance: Instance) => {
    setQrInstance(instance); setQrImage(''); setQrMessage(''); setFormError(''); setModal('qr'); setBusy(true);
    try {
      const data = await backend<any>(`instance/connect/${encodeURIComponent(instance.name)}`);
      const code = data?.base64 || data?.qrcode?.base64;
      if (typeof code === 'string' && /^data:image\/(png|jpeg|webp);base64,/i.test(code)) setQrImage(code);
      else setQrMessage(data?.instance?.state === 'open' || instance.connectionStatus === 'open' ? 'This channel is already connected.' : 'The QR code is not ready yet. Refresh the code in a moment.');
    } catch (error) { setFormError(error instanceof Error ? error.message : 'Could not connect the channel.'); }
    finally { setBusy(false); }
  };
  const deleteChannel = async (instance: Instance) => {
    if (!window.confirm(`Delete “${instance.name}”? This also removes its stored conversations and cannot be undone.`)) return;
    try { await backend(`instance/delete/${encodeURIComponent(instance.name)}`, 'DELETE'); notify('Channel deleted.'); refresh(); }
    catch (error) { setDataError(error instanceof Error ? error.message : 'Could not delete channel.'); }
  };
  const openWebhook = async () => {
    if (!active) { notify('Add a channel before configuring a webhook.'); navigate('channels'); return; }
    openModal('webhook'); setBusy(true); setWebhookUrl(''); setWebhookEnabled(false); setWebhookSelected([]);
    try {
      const data = await backend<Webhook>(`webhook/find/${encodeURIComponent(active)}`);
      setWebhookUrl(data?.url || ''); setWebhookEnabled(!!data?.enabled); setWebhookSelected(Array.isArray(data?.events) ? data.events : []);
    } catch (error) { setFormError(error instanceof Error ? error.message : 'Could not load webhook.'); }
    finally { setBusy(false); }
  };
  const saveWebhook = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setFormError('');
    try {
      const url = new URL(webhookUrl);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Enter an HTTP or HTTPS webhook URL.');
      if (webhookEnabled && !webhookSelected.length) throw new Error('Choose at least one event for an enabled webhook.');
      await backend(`webhook/set/${encodeURIComponent(active)}`, 'POST', { webhook: { enabled: webhookEnabled, url: webhookUrl, events: webhookSelected } });
      setModal(null); notify('Webhook settings saved.');
    } catch (error) { setFormError(error instanceof Error ? error.message : 'Could not save webhook.'); }
    finally { setBusy(false); }
  };
  const selectedPage = titles[section] ? section : '';
  const page = (() => {
    switch (selectedPage) {
      case 'conversations': return <Conversations sample={sample} instances={instances} active={active} onInstance={setActive} chats={chats} selected={selectedChat} onSelect={setSelectedChat} thread={thread} threadLoading={threadLoading} onSend={sendMessage} onConnect={() => openModal('connect')} search={search} setSearch={setSearch} />;
      case 'contacts': return <Contacts sample={sample} instances={instances} active={active} onInstance={setActive} contacts={contacts} search={search} setSearch={setSearch} onMessage={(contact) => openCompose(contact.remoteJid)} onConnect={() => openModal('connect')} />;
      case 'channels': return <Channels sample={sample} instances={instances} onNew={() => openModal('create')} onConnect={() => openModal('connect')} onQr={showQr} onDelete={deleteChannel} onRefresh={refresh} loading={loading} />;
      case 'integrations': return <Integrations sample={sample} onConnect={() => openModal('connect')} onWebhook={openWebhook} />;
      case 'settings': return <Settings sample={sample} onConnect={() => openModal('connect')} onDisconnect={disconnect} />;
      case 'support': return <Support />;
      default: return <Overview sample={sample} instances={instances} activeInstance={active} chats={chats} messages={recentMessages} loading={loading} onConnect={() => openModal('connect')} onNavigate={navigate} onCompose={() => openCompose()} onRefresh={refresh} onChat={(chat) => { setSelectedChat(chat); router.push(`/conversations?chat=${encodeURIComponent(chat.remoteJid)}`); }} />;
    }
  })();

  return <div className="app-shell">
    {mobileNav && <button className="nav-overlay" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}><div className="sidebar-brand"><Link href="/" className="sidebar-brand-link" aria-label="Ceyteq home"><BrandMark /><div><strong>ceyteq<span>.</span></strong><small>CEYLON TECHNOLOGY</small></div></Link><button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={19} /></button></div><div className="sidebar-workspace"><span className="workspace-icon"><Sparkles size={17} /></span><span><strong>Ceyteq workspace</strong><small>{sample ? 'Sample workspace' : 'Your workspace'}</small></span><ChevronDown size={14} /></div><div className="nav-caption">WORKSPACE</div><nav className="side-nav" aria-label="Main navigation">{nav.map(({ section: target, label, icon: Icon }) => <Link href={target ? `/${target}` : '/workspace'} key={label} onClick={() => setMobileNav(false)} className={`nav-link ${selectedPage === target ? 'active' : ''}`}><Icon size={18} strokeWidth={1.7} /><span>{label}</span>{selectedPage === target && <i />}</Link>)}</nav><div className="nav-caption nav-caption-bottom">GENERAL</div><nav className="side-nav" aria-label="General navigation"><Link href="/settings" onClick={() => setMobileNav(false)} className={`nav-link ${selectedPage === 'settings' ? 'active' : ''}`}><Settings2 size={18} strokeWidth={1.7} /><span>Settings</span>{selectedPage === 'settings' && <i />}</Link><Link href="/support" onClick={() => setMobileNav(false)} className={`nav-link ${selectedPage === 'support' ? 'active' : ''}`}><CircleHelp size={18} strokeWidth={1.7} /><span>Help &amp; support</span>{selectedPage === 'support' && <i />}</Link></nav><div className="sidebar-spacer" /><div className="sidebar-help"><span className="sidebar-help-icon"><Headphones size={19} /></span><strong>Need some help?</strong><p>We’re just a message away.</p><a href={brand.whatsapp} target="_blank" rel="noreferrer">Chat with us <ArrowUpRight size={13} /></a></div><div className="sidebar-footer"><span className="sidebar-user">C</span><span><strong>Ceyteq team</strong><small>Workspace administrator</small></span><Link href="/settings" aria-label="Workspace settings"><Settings2 size={16} /></Link></div></aside>
    <div className="main-shell"><header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={21} /></button><div className="breadcrumb"><span>WORKSPACE</span><ChevronDown size={12} className="crumb-arrow" /><strong>{titles[selectedPage]}</strong></div><div className="topbar-right"><div className="top-search"><Search size={16} /><input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && selectedPage !== 'contacts' && selectedPage !== 'conversations') navigate('conversations'); }} placeholder="Search conversations..." aria-label="Search conversations" /><span>⌘ K</span></div><Link className="top-icon" href="/support" aria-label="Help and support"><CircleHelp size={19} /></Link><button className={`top-status ${sample ? 'is-sample' : ''}`} onClick={() => sample ? openModal('connect') : navigate('settings')}><i />{sample ? 'Sample workspace' : 'Workspace connected'}</button><span className="top-user">C</span></div></header>
      <main className="main-content">{toast && <div className="toast" role="status"><ShieldCheck size={17} />{toast}</div>}{dataError && <div className="workspace-error"><Notice>{dataError}</Notice></div>}{page}</main>
    </div>

    {modal === 'connect' && <Modal title="Connect your workspace" subtitle="Bring your Ceyteq conversations into this workspace." onClose={() => { setApiKey(''); setModal(null); }}><form className="modal-form" onSubmit={connect}><div className="connection-explainer"><ShieldCheck size={20} /><span>Your key is verified against your configured Ceyteq API and kept in an encrypted, HTTP-only session.</span></div><label>Global API key<input type="password" autoComplete="off" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Enter your API key" required autoFocus /></label><p className="input-help">Your administrator configures the API address and session secret on the server. Use HTTPS in production.</p>{formError && <Notice>{formError}</Notice>}<div className="modal-actions"><button type="button" className="soft-button" onClick={() => setModal(null)}>Maybe later</button><button className="primary-button" disabled={busy}>{busy ? 'Connecting…' : 'Connect workspace'} <ArrowRight size={16} /></button></div></form></Modal>}
    {modal === 'create' && <Modal title="Add a channel" subtitle="Create a WhatsApp channel, then scan its QR code to connect." onClose={() => setModal(null)}><form className="modal-form" onSubmit={createChannel}><label>Channel name<input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="e.g. customer-support" required autoFocus maxLength={80} /></label><p className="input-help">Letters, numbers, hyphens, and underscores only.</p>{formError && <Notice>{formError}</Notice>}<div className="modal-actions"><button type="button" className="soft-button" onClick={() => setModal(null)}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? 'Creating…' : 'Create channel'} <ArrowRight size={16} /></button></div></form></Modal>}
    {modal === 'compose' && <Modal title="Start a conversation" subtitle="Send a message from one of your connected channels." onClose={() => setModal(null)}><form className="modal-form" onSubmit={async (event) => { event.preventDefault(); setBusy(true); setFormError(''); try { await sendMessage(composeText.trim(), composeNumber.trim()); setModal(null); notify('Message sent.'); refresh(); } catch (error) { setFormError(error instanceof Error ? error.message : 'Could not send message.'); } finally { setBusy(false); } }}><label>Channel<select value={active} onChange={(event) => setActive(event.target.value)}>{instances.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label><label>Recipient number<input value={composeNumber} onChange={(event) => setComposeNumber(event.target.value)} placeholder="e.g. 94771234567" required /></label><p className="input-help">Include the country code, without spaces or the plus sign.</p><label>Message<textarea value={composeText} onChange={(event) => setComposeText(event.target.value)} placeholder="Write a thoughtful message..." rows={4} required /></label>{formError && <Notice>{formError}</Notice>}<div className="modal-actions"><button type="button" className="soft-button" onClick={() => setModal(null)}>Cancel</button><button className="primary-button" disabled={busy || !composeText.trim() || !composeNumber.trim()}>{busy ? 'Sending…' : 'Send message'} <ArrowRight size={16} /></button></div></form></Modal>}
    {modal === 'qr' && <Modal title="Connect your channel" subtitle={`WhatsApp connection for ${qrInstance?.name || 'your channel'}.`} onClose={() => { setModal(null); refresh(); }}><div className="qr-body">{busy ? <p>Loading connection…</p> : qrImage ? <><img src={qrImage} alt="WhatsApp connection QR code" /><p>Open WhatsApp on your phone, go to Linked devices, and scan this code.</p></> : <div className="qr-placeholder"><Radio size={27} /><p>{qrMessage || 'No QR code available.'}</p></div>}{formError && <Notice>{formError}</Notice>}<div className="modal-actions"><button className="soft-button" onClick={() => { setModal(null); refresh(); }}>Done</button><button className="primary-button" disabled={busy || !qrInstance} onClick={() => qrInstance && showQr(qrInstance)}>Refresh connection <RefreshIcon /></button></div></div></Modal>}
    {modal === 'webhook' && <Modal title="Configure webhook" subtitle={`Choose which events to send from ${active}.`} onClose={() => setModal(null)}><form className="modal-form" onSubmit={saveWebhook}><label>Webhook URL<input type="url" value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} placeholder="https://your-app.example/webhook" required /></label><label className="checkbox-row"><input type="checkbox" checked={webhookEnabled} onChange={(event) => setWebhookEnabled(event.target.checked)} /> Enable this webhook</label><span className="form-label">Events</span><div className="checkbox-grid">{webhookEvents.map((event) => <label className="checkbox-row" key={event}><input type="checkbox" checked={webhookSelected.includes(event)} onChange={(e) => setWebhookSelected((old) => e.target.checked ? [...old, event] : old.filter((value) => value !== event))} /> {event.replaceAll('_', ' ').toLowerCase()}</label>)}</div><p className="input-help">Existing headers and unedited events are retained. Disabling the webhook clears its events.</p>{formError && <Notice>{formError}</Notice>}<div className="modal-actions"><button type="button" className="soft-button" onClick={() => setModal(null)}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? 'Loading…' : 'Save webhook'} <ArrowRight size={16} /></button></div></form></Modal>}
  </div>;
}

function RefreshIcon() { return <span aria-hidden="true">↻</span>; }
