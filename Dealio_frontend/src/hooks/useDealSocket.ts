import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_BUILDER_URL ?? 'http://127.0.0.1:8090/api').replace('/api', '');

export interface DealMessage {
  id: number;
  dealId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  threadKey?: string;
  message: string;
  createdAt: string;
}

/** Default thread for surfaces (like the DealRoom) that show a single chat box. */
export const DEFAULT_THREAD_KEY = 'builder-customer';

/**
 * Live chat socket for one private thread within a deal.
 *
 * A "thread" is the conversation between two roles on a deal (e.g. builder↔customer
 * or cp↔customer), identified by `threadKey`. The connection is tied to the open
 * chat: it is established only when `dealId` is set and re-established when either
 * `dealId` or `threadKey` changes. The backend authorizes the join, so a party can
 * only ever see threads they belong to.
 */
export function useDealSocket(dealId: number | null, threadKey: string = DEFAULT_THREAD_KEY) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<DealMessage[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // No chat open → no connection.
    if (dealId == null) {
      setConnected(false);
      setMessages([]);
      return;
    }

    const token = localStorage.getItem('dealio_access_token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;
    setMessages([]);

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_deal', { dealId, threadKey }); // join this private thread
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('message_history', (msgs: DealMessage[]) => setMessages(msgs));
    socket.on('deal_message', (msg: DealMessage) => setMessages(prev => [...prev, msg]));

    // Chat closed (dealId/threadKey changed/cleared) or view unmounted → leave + disconnect.
    return () => {
      socket.emit('leave_deal', { dealId, threadKey });
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [dealId, threadKey]);

  const sendMessage = useCallback((message: string) => {
    if (!socketRef.current || dealId == null || !message.trim()) return;
    socketRef.current.emit('send_message', { dealId, threadKey, message });
  }, [dealId, threadKey]);

  return { messages, connected, sendMessage };
}
