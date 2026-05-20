import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/stores/useNotificationStore';

const TOKEN_KEY      = 'dealio_access_token';
const RETRY_DELAY_MS = 5_000;

interface SSEEvent {
  type: string;
  title?: string;
  message?: string;
  projectId?: number;
  meetingId?: number;
  city?: string;
  timestamp?: string;
  link?: string;
}

function isMeetingEvent(title = '') {
  const t = title.toLowerCase();
  return t.includes('meeting') || t.includes('visit') || t.includes('confirm') || t.includes('complet');
}

function routeNotifType(sseType: string): 'info' | 'success' | 'warning' | 'error' {
  if (sseType.includes('confirm')) return 'success';
  if (sseType.includes('complet')) return 'success';
  if (sseType.includes('cancel') || sseType.includes('reject')) return 'error';
  if (sseType.includes('followup') || sseType.includes('follow_up')) return 'warning';
  return 'info';
}

function handleFrame(raw: string) {
  try {
    const data: SSEEvent = JSON.parse(raw);
    if (data.type === 'connected') return;

    const title   = data.title   ?? '';
    const message = data.message ?? '';
    if (!title && !message) return;

    const notifType = routeNotifType(data.type ?? '');

    useNotificationStore.getState().addNotification({
      type:    notifType,
      title,
      message,
      link:    data.link,
    });

    // Signal meeting list pages to re-fetch
    if (isMeetingEvent(title) || data.type?.includes('meeting')) {
      window.dispatchEvent(new CustomEvent('dealio:new-meeting'));
    }
  } catch { /* malformed frame — ignore */ }
}

export function useNotificationStream(streamUrl: string, enabled: boolean, reconnectKey = 0) {
  const esRef    = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const connect = () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;

      const es = new EventSource(`${streamUrl}?token=${encodeURIComponent(token)}`);
      esRef.current = es;

      // Default (unnamed) SSE messages
      es.onmessage = (e: MessageEvent<string>) => handleFrame(e.data);

      // Named event types the builder backend may emit
      const namedEvents = [
        'meeting_request', 'meeting_confirmed', 'meeting_completed',
        'meeting_cancelled', 'meeting_followup',
        'new_project', 'project_update',
        'notification',
      ];
      namedEvents.forEach(evt =>
        es.addEventListener(evt, (e: Event) => handleFrame((e as MessageEvent).data))
      );

      es.onerror = () => {
        es.close();
        esRef.current = null;
        retryRef.current = setTimeout(connect, RETRY_DELAY_MS);
      };
    };

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [streamUrl, enabled, reconnectKey]);
}