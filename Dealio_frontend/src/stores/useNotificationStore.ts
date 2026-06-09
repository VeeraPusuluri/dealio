import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { notificationsApi } from '@/lib/api';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  role?: string;
  link?: string;
  /** Source DB id when this came from the server — used to dedupe + sync read-state. */
  serverId?: number;
}

/** Shape returned by the backend notification list endpoints. */
export interface ServerNotification {
  id: number;
  title: string;
  message: string;
  type?: string;
  link?: string | null;
  read?: boolean;
  createdAt?: string;
}

const NOTIF_TYPES = ['success', 'error', 'info', 'warning'] as const;
function coerceType(t?: string): Notification['type'] {
  return (NOTIF_TYPES as readonly string[]).includes(t ?? '') ? (t as Notification['type']) : 'info';
}

// Stable content fingerprint. The same logical event can reach the bell via several
// transports (live SSE, the cross-notify drain, and the one-time DB hydration). When
// the event carries no serverId we fall back to this key so it still dedupes — and,
// crucially, a notification the user already read can't be resurrected as unread by a
// later hydrate of the same content.
function contentKey(n: { title: string; message: string; link?: string }): string {
  return `${n.title}${n.message}${n.link ?? ''}`;
}

const STORAGE_KEY = 'dealio_notifications';
const MAX_STORED  = 50;

function load(): Notification[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function save(ns: Notification[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ns.slice(0, MAX_STORED))); } catch { /* ignore */ }
}
function countUnread(ns: Notification[]): number {
  return ns.filter((n) => !n.read).length;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  ingestServerNotifications: (items: ServerNotification[]) => void;
  markRead:     (id: string) => void;
  markAllRead:  () => void;
  dismiss:      (id: string) => void;
  clearAll:     () => void;
}

const initial = load();

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: initial,
  unreadCount:   countUnread(initial),

  // Add a single live notification. Deduped by serverId (when present) and by content
  // so the same event arriving on two transports — or an SSE reconnect replay — can't
  // create a second row in the bell.
  addNotification: (n) =>
    set((state) => {
      // A server-id'd event is identified by its id (so two genuinely-distinct
      // messages with identical text aren't collapsed). An id-less event (city
      // broadcast, cross-notify drain) dedupes by content against other id-less rows.
      const dupe = n.serverId != null
        ? state.notifications.some((x) => x.serverId === n.serverId)
        : state.notifications.some((x) => x.serverId == null && contentKey(x) === contentKey(n));
      if (dupe) return state;

      const notification: Notification = {
        ...n,
        // When the event mirrors a persisted row, give it that row's stable identity so
        // a later hydrate reconciles to the same entry instead of duplicating it.
        id:        n.serverId != null ? `SV${n.serverId}` : `NT${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        read:      false,
      };
      const next = [notification, ...state.notifications];
      save(next);
      return { notifications: next, unreadCount: countUnread(next) };
    }),

  // Merge server-persisted notifications into the store (called once on login).
  // Deduped by serverId AND by content, so a row whose live SSE copy is already in the
  // bell (possibly already read) is not re-added as a fresh unread duplicate.
  ingestServerNotifications: (items) =>
    set((state) => {
      const seenServer    = new Set(state.notifications.filter((n) => n.serverId != null).map((n) => n.serverId));
      // Only reconcile against id-less (live SSE / cross-notify) rows — so a hydrated
      // row whose transient copy is already in the bell (possibly already read) isn't
      // re-added, without collapsing two distinct server rows that share wording.
      const seenTransient = new Set(state.notifications.filter((n) => n.serverId == null).map(contentKey));
      const mapped: Notification[] = items
        .filter((it) => !seenServer.has(it.id))
        .map((it) => ({
          id:        `SV${it.id}`,
          serverId:  it.id,
          type:      coerceType(it.type),
          title:     it.title,
          message:   it.message,
          link:      it.link ?? undefined,
          timestamp: it.createdAt ?? new Date().toISOString(),
          read:      it.read ?? false,
        }))
        .filter((m) => !seenTransient.has(contentKey(m)));
      if (mapped.length === 0) return state;
      const next = [...mapped, ...state.notifications]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, MAX_STORED);
      save(next);
      return { notifications: next, unreadCount: countUnread(next) };
    }),

  markRead: (id) =>
    set((state) => {
      const target = state.notifications.find((n) => n.id === id);
      if (!target || target.read) return state;
      const next = state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      save(next);
      // Persist read-state server-side so it survives reloads / other devices and the
      // notification can't come back as unread on the next hydrate.
      if (target.serverId != null) {
        notificationsApi.markRead(useAuthStore.getState().user?.role, target.serverId);
      }
      return { notifications: next, unreadCount: countUnread(next) };
    }),

  markAllRead: () =>
    set((state) => {
      if (state.unreadCount === 0) return state;
      const next = state.notifications.map((n) => ({ ...n, read: true }));
      save(next);
      notificationsApi.markAllRead(useAuthStore.getState().user?.role);
      return { notifications: next, unreadCount: 0 };
    }),

  dismiss: (id) =>
    set((state) => {
      const target = state.notifications.find((n) => n.id === id);
      const next   = state.notifications.filter((n) => n.id !== id);
      save(next);
      // Dismissing an unread server notification also marks it read so it doesn't
      // reappear on the next hydrate.
      if (target && !target.read && target.serverId != null) {
        notificationsApi.markRead(useAuthStore.getState().user?.role, target.serverId);
      }
      return { notifications: next, unreadCount: countUnread(next) };
    }),

  clearAll: () =>
    set((state) => {
      save([]);
      // Best-effort: clear unread server-side too, so a hydrate can't repopulate them.
      if (state.unreadCount > 0) notificationsApi.markAllRead(useAuthStore.getState().user?.role);
      return { notifications: [], unreadCount: 0 };
    }),
}));
