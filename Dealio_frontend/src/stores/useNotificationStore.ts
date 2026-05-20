import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  role?: string;
  link?: string;
}

const STORAGE_KEY = 'dealio_notifications';
const MAX_STORED  = 50;

function load(): Notification[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function save(ns: Notification[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ns.slice(0, MAX_STORED))); } catch { /* ignore */ }
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markRead:     (id: string) => void;
  markAllRead:  () => void;
  dismiss:      (id: string) => void;
}

const initial = load();

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: initial,
  unreadCount:   initial.filter(n => !n.read).length,

  addNotification: (n) =>
    set((state) => {
      const notification: Notification = {
        ...n,
        id:        `NT${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        read:      false,
      };
      const next = [notification, ...state.notifications];
      save(next);
      return { notifications: next, unreadCount: state.unreadCount + 1 };
    }),

  markRead: (id) =>
    set((state) => {
      const next = state.notifications.map(n => n.id === id ? { ...n, read: true } : n);
      save(next);
      return { notifications: next, unreadCount: Math.max(0, state.unreadCount - 1) };
    }),

  markAllRead: () =>
    set((state) => {
      const next = state.notifications.map(n => ({ ...n, read: true }));
      save(next);
      return { notifications: next, unreadCount: 0 };
    }),

  dismiss: (id) =>
    set((state) => {
      const target = state.notifications.find(n => n.id === id);
      const next   = state.notifications.filter(n => n.id !== id);
      save(next);
      return { notifications: next, unreadCount: Math.max(0, state.unreadCount - (target?.read ? 0 : 1)) };
    }),
}));