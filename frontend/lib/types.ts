export type Instance = {
  id: string;
  name: string;
  connectionStatus: 'open' | 'close' | 'connecting' | string;
  ownerJid?: string | null;
  profileName?: string | null;
  number?: string | null;
  integration?: string | null;
  createdAt?: string | null;
  _count?: { Message?: number; Contact?: number; Chat?: number };
};

export type Message = {
  id: string;
  key?: { id?: string; remoteJid?: string; fromMe?: boolean };
  pushName?: string | null;
  messageType?: string;
  message?: Record<string, any>;
  messageTimestamp?: number;
  status?: string | null;
};

export type Chat = {
  id?: string | null;
  remoteJid: string;
  pushName?: string | null;
  updatedAt?: string | null;
  unreadCount?: number | null;
  lastMessage?: Message;
};

export type Contact = {
  id: string;
  remoteJid: string;
  pushName?: string | null;
  isGroup?: boolean;
  createdAt?: string | null;
};

export type Webhook = { enabled: boolean; url: string; events: string[] } | null;
