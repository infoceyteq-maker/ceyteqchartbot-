export type CheckedConnectionStatus = 'disconnected' | 'online' | 'unavailable';

export function checkPlatformConnection(
  request: (path: string, options?: RequestInit) => Promise<unknown>,
  signal: AbortSignal,
): Promise<CheckedConnectionStatus>;
