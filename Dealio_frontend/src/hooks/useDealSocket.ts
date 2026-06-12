import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_BUILDER_URL ?? 'http://127.0.0.1:8090/api').replace('/api', '');

export interface DealMessage {
  id: number;
  dealId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

/**
 * Live chat socket for a single deal/conversation.
 *
 * The connection is tied to the open chat: it is established only when `dealId` is set
 * (a conversation is opened) and torn down when `dealId` becomes null (chat closed) or
 * the component unmounts. This keeps one socket per open conversation and guarantees the
 * builder/customer link is dropped the moment the chat is closed.
 */
export function useDealSocket(dealId: number | null) {
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
      socket.emit('join_deal', dealId); // join the room for this conversation
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('message_history', (msgs: DealMessage[]) => setMessages(msgs));
    socket.on('deal_message', (msg: DealMessage) => setMessages(prev => [...prev, msg]));

    // Chat closed (dealId changed/cleared) or view unmounted → leave + disconnect.
    return () => {
      socket.emit('leave_deal', dealId);
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [dealId]);

  const sendMessage = useCallback((message: string) => {
    if (!socketRef.current || dealId == null || !message.trim()) return;
    socketRef.current.emit('send_message', { dealId, message });
  }, [dealId]);

  return { messages, connected, sendMessage };
}
