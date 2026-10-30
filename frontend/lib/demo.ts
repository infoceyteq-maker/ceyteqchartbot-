import type { Chat, Contact, Instance, Message } from './types';

// Illustrative data is only displayed in the explicitly labelled sample workspace.
export const demoInstances: Instance[] = [
  { id: 'sample-1', name: 'Ceyteq Support', connectionStatus: 'open', number: '94788607143', integration: 'WHATSAPP-BAILEYS', _count: { Message: 4862, Contact: 624, Chat: 1812 } },
  { id: 'sample-2', name: 'Sales Team', connectionStatus: 'open', number: '94768607143', integration: 'WHATSAPP-BAILEYS', _count: { Message: 2786, Contact: 308, Chat: 641 } },
  { id: 'sample-3', name: 'Customer Care', connectionStatus: 'open', integration: 'WHATSAPP-BUSINESS', _count: { Message: 819, Contact: 136, Chat: 154 } },
  { id: 'sample-4', name: 'Campaigns', connectionStatus: 'close', integration: 'WHATSAPP-BAILEYS', _count: { Message: 0, Contact: 0, Chat: 0 } },
];

const sampleRows = [
  ['Nethmi Perera', '94770000001@s.whatsapp.net', 'That sounds great, thank you so much!', 4, 2],
  ['Kasun Silva', '94770000002@s.whatsapp.net', 'Hi! Could you share more details?', 18, 0],
  ['Amara Fernando', '94770000003@s.whatsapp.net', 'Perfect, I’ll get back to you shortly.', 42, 0],
  ['Tharindu Jay', '94770000004@s.whatsapp.net', 'Thank you for the quick response!', 95, 1],
  ['Shanika Mendis', '94770000005@s.whatsapp.net', 'Looking forward to hearing from you.', 180, 0],
] as const;

export function sampleChats(): Chat[] {
  return sampleRows.map(([name, jid, text, minutes, unread], index) => ({
    id: `sample-contact-${index}`, remoteJid: jid, pushName: name, unreadCount: unread,
    updatedAt: new Date(Date.now() - minutes * 60000).toISOString(),
    lastMessage: { id: `sample-message-${index}`, key: { remoteJid: jid, fromMe: false }, message: { conversation: text }, messageTimestamp: Math.floor(Date.now() / 1000) - minutes * 60 },
  }));
}

export const demoContacts: Contact[] = sampleRows.map(([name, jid], index) => ({
  id: `sample-contact-${index}`, remoteJid: jid, pushName: name, isGroup: false,
}));

export function sampleThread(chat: Chat): Message[] {
  const now = Math.floor(Date.now() / 1000);
  return [
    { id: 'sample-thread-1', key: { remoteJid: chat.remoteJid, fromMe: false }, message: { conversation: 'Hi there! I’d love to know more about your services.' }, messageTimestamp: now - 3600 },
    { id: 'sample-thread-2', key: { remoteJid: chat.remoteJid, fromMe: true }, message: { conversation: 'Hello! Thanks for reaching out to Ceyteq. How can we help you today?' }, messageTimestamp: now - 3300 },
    { id: 'sample-thread-3', key: { remoteJid: chat.remoteJid, fromMe: false }, message: chat.lastMessage?.message, messageTimestamp: chat.lastMessage?.messageTimestamp },
  ];
}

export const demoActivity = {
  received: [26, 43, 35, 64, 53, 78, 68],
  sent: [15, 28, 22, 38, 31, 50, 43],
};
