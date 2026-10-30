/**
 * A valid session alone is not proof that the API is reachable. Never report
 * online unless the same authenticated read used by the workspace succeeds.
 */
export async function checkPlatformConnection(request, signal) {
  try {
    const session = await request('/api/session', { signal });
    if (!session.authenticated) return 'disconnected';
    await request('/api/backend/instance/fetchInstances', { signal });
    return 'online';
  } catch {
    return 'unavailable';
  }
}
