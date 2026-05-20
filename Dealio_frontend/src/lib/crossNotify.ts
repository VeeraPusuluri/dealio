// Cross-role notification bridge via localStorage.
// Works for same-device sessions (local dev / demo); real deployments rely on SSE.

export interface CrossNotif {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
  timestamp: string;
}

const key = (role: string, userId: string) => `dealio_xnotif_${role}_${userId}`;

export function pushNotifTo(
  role: string,
  userId: string,
  n: Omit<CrossNotif, 'id' | 'timestamp'>
) {
  try {
    const existing: CrossNotif[] = JSON.parse(localStorage.getItem(key(role, userId)) || '[]');
    const entry: CrossNotif = { ...n, id: `xn${Date.now()}`, timestamp: new Date().toISOString() };
    localStorage.setItem(key(role, userId), JSON.stringify([entry, ...existing].slice(0, 30)));
    // Wake up same-tab listeners immediately
    window.dispatchEvent(new CustomEvent(`dealio:xnotif:${role}`, { detail: entry }));
  } catch { /* ignore storage errors */ }
}

export function drainNotifs(role: string, userId: string): CrossNotif[] {
  try {
    const k = key(role, userId);
    const notifs: CrossNotif[] = JSON.parse(localStorage.getItem(k) || '[]');
    if (notifs.length) localStorage.removeItem(k);
    return notifs;
  } catch { return []; }
}