'use client';

import { ArrowRight, ArrowUpRight, AudioLines, ChevronRight, CircleHelp, ContactRound, Headphones, MessageCircleMore, MessagesSquare, Plus, Radio, RefreshCw, Send, Sparkles } from 'lucide-react';
import { ActivityChart } from '@/components/activity-chart';
import { Avatar, EmptyState, SectionTitle } from '@/components/ui';
import { contactName, displayTime, messageText } from '@/lib/api';
import type { Chat, Instance, Message } from '@/lib/types';

export function Overview({ sample, instances, activeInstance, chats, messages, loading, onConnect, onNavigate, onCompose, onRefresh, onChat }: {
  sample: boolean; instances: Instance[]; activeInstance: string; chats: Chat[]; messages: Message[]; loading: boolean;
  onConnect: () => void; onNavigate: (section: string) => void; onCompose: () => void; onRefresh: () => void; onChat: (chat: Chat) => void;
}) {
  const total = (field: 'Message' | 'Contact' | 'Chat') => instances.reduce((sum, item) => sum + (item._count?.[field] || 0), 0);
  const connected = instances.filter((item) => item.connectionStatus === 'open').length;
  const metrics = [
    { label: 'Total conversations', value: total('Chat').toLocaleString(), note: 'Across all channels', icon: MessagesSquare, tone: 'blue' },
    { label: 'Messages exchanged', value: total('Message').toLocaleString(), note: 'Messages in your workspace', icon: Send, tone: 'indigo' },
    { label: 'Total contacts', value: total('Contact').toLocaleString(), note: 'People you’re connected with', icon: ContactRound, tone: 'violet' },
    { label: 'Connected channels', value: `${connected} / ${instances.length}`, note: 'Channels ready to connect', icon: Radio, tone: 'cyan' },
  ];
  return <>
    <SectionTitle title="Overview" subtitle="A little snapshot of everything happening in your workspace." action={<><button className="soft-button refresh-button" onClick={onRefresh} disabled={loading} title="Refresh workspace"><RefreshCw size={16} className={loading ? 'spin' : ''} /><span>Refresh</span></button><button className="primary-button" onClick={onCompose}><Plus size={17} /> New message</button></>} />

    <section className="welcome-banner">
      <div className="banner-content"><div className="banner-kicker"><Sparkles size={13} /> YOUR CONVERSATION HUB</div><h2>Better conversations.<br /><span>Brighter connections.</span></h2><p>Everything you need to connect, engage, and grow — all in one place.</p><button onClick={sample ? onConnect : () => onNavigate('conversations')} className="banner-button">{sample ? 'Connect your workspace' : 'Go to conversations'} <ArrowRight size={15} /></button></div>
      <div className="banner-index"><span>01</span><i /><span>CEYTEQ WORKSPACE</span></div>
    </section>

    <div className="section-label-row"><div><span className="eyebrow">YOUR WORKSPACE</span><h2 className="subheading">The big picture <span>✳</span></h2></div><span className="sample-caption">{sample ? 'Illustrative sample data' : 'All-time totals'}</span></div>
    <div className="metric-grid">{metrics.map(({ label, value, note, icon: Icon, tone }) => <article className="metric-card" key={label}>
      <div className="metric-top"><div className={`metric-icon metric-${tone}`}><Icon size={20} strokeWidth={1.8} /></div><span className="metric-arrow"><ArrowUpRight size={15} /></span></div>
      <div className="metric-value">{value}</div><div className="metric-label">{label}</div><div className="metric-note">{note}</div>
    </article>)}</div>

    <div className="dashboard-grid">
      <section className="panel activity-panel"><div className="panel-heading"><div><span className="eyebrow">A CLOSER LOOK</span><h2>Message activity</h2><p>{sample ? 'A sample of conversations over time' : activeInstance ? `Recent messages · ${activeInstance}` : 'Connect a channel to see activity'}</p></div><span className="period-pill">Last 7 days <ChevronRight size={14} /></span></div>
        <div className="chart-legend"><span><i className="legend-received" />Received</span><span><i className="legend-sent" />Sent</span><span className="chart-scope">{sample ? 'Sample' : 'Most recent 500 messages'}</span></div>
        <ActivityChart demo={sample} messages={messages} />
      </section>
      <section className="channel-panel"><div className="channel-heading"><div><span className="eyebrow light-eyebrow">STAY CONNECTED</span><h2>Your channels</h2><p>All your connections, in one place.</p></div><span className="channel-icon"><AudioLines size={19} /></span></div>
        <div className="channel-total"><span>{connected.toString().padStart(2, '0')}</span><div><strong>{sample ? 'Sample channels' : 'Channels online'}</strong><small>out of {instances.length.toString().padStart(2, '0')} total channels</small></div><div className="channel-ring" style={{ '--progress': `${instances.length ? connected / instances.length * 100 : 0}%` } as React.CSSProperties}><span>{instances.length ? Math.round(connected / instances.length * 100) : 0}%</span></div></div>
        <div className="channel-list">{instances.slice(0, 2).map((instance, index) => <div className="channel-row" key={instance.id}><span className="channel-app-icon">{index === 0 ? <MessageCircleMore size={17} /> : <Radio size={17} />}</span><div><strong>{instance.name}</strong><small>{instance.integration === 'WHATSAPP-BUSINESS' ? 'WhatsApp Business' : 'WhatsApp'}</small></div><i className={instance.connectionStatus === 'open' ? 'channel-dot active' : 'channel-dot'} /></div>)}{!instances.length && <p className="channel-empty">No channels added yet.</p>}</div>
        <button className="channel-link" onClick={() => onNavigate('channels')}>Manage channels <ArrowRight size={15} /></button>
      </section>
    </div>

    <div className="bottom-grid">
      <section className="panel recent-panel"><div className="panel-heading recent-heading"><div><span className="eyebrow">KEEP THE CONVERSATION GOING</span><h2>Recent conversations</h2><p>{sample ? 'A peek at your sample inbox' : activeInstance ? `Latest from ${activeInstance}` : 'Your latest conversations will appear here'}</p></div><button className="panel-link" onClick={() => onNavigate('conversations')}>View all <ArrowRight size={15} /></button></div>
        {chats.length ? <div className="recent-table"><div className="table-head"><span>CONTACT</span><span>LAST MESSAGE</span><span>TIME</span><span /></div>{chats.slice(0, 4).map((chat, index) => <button className="recent-row" key={chat.remoteJid} onClick={() => onChat(chat)}><span className="person-cell"><Avatar name={contactName(chat)} index={index} /><span><strong>{contactName(chat)}</strong><small>{chat.remoteJid.split('@')[0]}</small></span></span><span className="message-preview">{messageText(chat.lastMessage)}</span><span className="table-time">{displayTime(chat.lastMessage?.messageTimestamp || chat.updatedAt)}</span><ChevronRight size={16} className="row-chevron" /></button>)}</div> : <EmptyState title="Nothing here just yet" description="Your recent conversations will appear when messages arrive." action={sample ? 'Connect workspace' : 'Manage channels'} onAction={sample ? onConnect : () => onNavigate('channels')} />}
      </section>
      <section className="help-card"><div className="help-top"><span className="help-icon"><Headphones size={20} /></span><span className="help-sparkle">✳</span></div><span className="eyebrow">WE&apos;RE HERE FOR YOU</span><h2>Need a helping hand?</h2><p>Big questions or little ones, our team is always happy to help.</p><button className="help-link" onClick={() => onNavigate('support')}>Get in touch <ArrowRight size={15} /></button><div className="help-watermark"><CircleHelp size={92} strokeWidth={0.8} /></div></section>
    </div>
    <div className="overview-footer"><span>Made for meaningful conversations <span>✦</span></span><span>Ceyteq (Ceylon Technology)</span></div>
  </>;
}
