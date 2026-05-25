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

export function useDealSocket(dealId: number | null) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<DealMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const currentDealRef = useRef<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('dealio_access_token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('message_history', (msgs: DealMessage[]) => setMessages(msgs));
    socket.on('deal_message', (msg: DealMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const sock = socketRef.current;
    if (!sock || !sock.connected) return;
    if (currentDealRef.current !== null) {
      sock.emit('leave_deal', currentDealRef.current);
    }
    if (dealId !== null) {
      setMessages([]);
      sock.emit('join_deal', dealId);
    }
    currentDealRef.current = dealId;
  }, [dealId]);

  // Re-join after connect if a deal is selected
  useEffect(() => {
    const sock = socketRef.current;
    if (!sock || !connected || dealId === null) return;
    setMessages([]);
    sock.emit('join_deal', dealId);
    currentDealRef.current = dealId;
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback((message: string) => {
    if (!socketRef.current || dealId === null || !message.trim()) return;
    socketRef.current.emit('send_message', { dealId, message });
  }, [dealId]);

  return { messages, connected, sendMessage };
}
