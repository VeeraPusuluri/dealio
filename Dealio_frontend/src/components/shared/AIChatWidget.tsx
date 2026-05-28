import { useState, useRef, useEffect, useCallback } from 'react';
import { aiApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { X, Send, Loader2, Sparkles, ChevronDown, RotateCcw } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const QUICK_PROMPTS: Record<string, string[]> = {
  builder: [
    'How do I add a new project?',
    'How does commission tracking work?',
    'What is a Channel Partner?',
    'How do I manage my leads pipeline?',
  ],
  cp: [
    'Draft a WhatsApp message for a 3BHK buyer',
    'Which project suits a budget of ₹80L?',
    'How is my commission calculated?',
    'How do I follow up after a site visit?',
  ],
  customer: [
    'What is the home buying process?',
    'How do I calculate my EMI?',
    'What does RERA registration mean?',
    'What should I check before booking a flat?',
  ],
  default: [
    'Tell me about Dealio',
    'How do I get started?',
    'What features are available?',
    'How do leads work?',
  ],
};

const ROLE_LABEL: Record<string, string> = {
  builder: 'Builder',
  cp: 'Channel Partner',
  customer: 'Customer',
  admin: 'Admin',
  bank: 'Bank',
  vendor: 'Vendor',
  nri: 'NRI Buyer',
  landowner: 'Land Owner',
};

const ROLE_COLOR: Record<string, string> = {
  builder:  'from-teal-500 to-emerald-600',
  cp:       'from-orange-500 to-amber-600',
  customer: 'from-blue-500 to-indigo-600',
  admin:    'from-violet-500 to-purple-600',
  default:  'from-slate-600 to-slate-800',
};

export default function AIChatWidget() {
  const user = useAuthStore(s => s.user);
  const role = (user?.role ?? 'default').toLowerCase();

  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLTextAreaElement>(null);
  const readerRef               = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  const gradient = ROLE_COLOR[role] ?? ROLE_COLOR.default;
  const prompts  = QUICK_PROMPTS[role] ?? QUICK_PROMPTS.default;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open && messages.length === 0) {
      // Show welcome message
      setMessages([{
        role: 'assistant',
        content: `Hi${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! 👋 I'm your Dealio AI assistant. I can help you with project information, ${role === 'cp' ? 'draft client messages, understand commissions,' : role === 'customer' ? 'guide you through buying a home, explain EMIs and RERA,' : 'manage leads, understand your pipeline,'} and answer any questions about Dealio.\n\nWhat can I help you with today?`,
      }]);
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: trimmed },
      { role: 'assistant', content: '', streaming: true },
    ];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Build history (exclude the streaming placeholder)
    const history = newMessages
      .filter(m => !m.streaming)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const reader = aiApi.streamChat(history, {
        role,
        userName: user?.name ?? undefined,
      });
      readerRef.current = reader;

      const decoder = new TextDecoder();
      let assistantText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data) as { text?: string; error?: string };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              assistantText += parsed.text;
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === 'assistant') {
                  next[next.length - 1] = { ...last, content: assistantText, streaming: true };
                }
                return next;
              });
            }
          } catch { /* partial JSON line — skip */ }
        }
      }

      // Finalise — remove streaming flag
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'assistant') {
          next[next.length - 1] = { role: 'assistant', content: assistantText || '(No response)' };
        }
        return next;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'assistant') {
          next[next.length - 1] = { role: 'assistant', content: `Sorry, I ran into an error: ${msg}` };
        }
        return next;
      });
    } finally {
      setLoading(false);
      readerRef.current = null;
    }
  }, [messages, loading, role, user?.name]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const reset = () => {
    readerRef.current?.cancel();
    setMessages([]);
    setLoading(false);
    // Re-trigger welcome message
    setTimeout(() => setMessages([{
      role: 'assistant',
      content: `Conversation cleared! How can I help you?`,
    }]), 50);
  };

  return (
    <>
      {/* ── Floating button ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95"
          style={{ background: `linear-gradient(135deg, #0A7E8C, #0d9488)` }}
          title="Dealio AI Assistant"
        >
          <Sparkles size={22} />
        </button>
      )}

      {/* ── Chat panel ── */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[380px] max-w-[calc(100vw-24px)] rounded-3xl shadow-2xl bg-white border border-slate-100 overflow-hidden"
          style={{ height: 'min(620px, calc(100vh - 48px))' }}>

          {/* Header */}
          <div className={`px-4 py-3.5 bg-gradient-to-r ${gradient} flex items-center gap-3 shrink-0`}>
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles size={17} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-none">Dealio AI</p>
              <p className="text-[11px] text-white/70 mt-0.5">{ROLE_LABEL[role] ?? 'Assistant'} · Real estate expert</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={reset} title="New conversation"
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors">
                <RotateCcw size={14} />
              </button>
              <button onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors">
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/50">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-3`}>
                  <Sparkles size={24} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Dealio AI</p>
                <p className="text-xs text-slate-400">Your real estate assistant</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 mr-2 mt-0.5`}>
                    <Sparkles size={12} className="text-white" />
                  </div>
                )}
                <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white rounded-br-sm'
                    : 'bg-white border border-slate-100 text-slate-800 rounded-bl-sm shadow-sm'
                }`}>
                  {msg.content
                    ? msg.content.split('\n').map((line, li) => (
                        <span key={li}>
                          {line.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, pi) =>
                            part.startsWith('**') && part.endsWith('**')
                              ? <strong key={pi}>{part.slice(2, -2)}</strong>
                              : part.startsWith('*') && part.endsWith('*')
                              ? <em key={pi}>{part.slice(1, -1)}</em>
                              : part
                          )}
                          {li < msg.content.split('\n').length - 1 && <br />}
                        </span>
                      ))
                    : msg.streaming && <span className="inline-block w-2 h-4 bg-slate-300 rounded animate-pulse" />
                  }
                  {msg.streaming && msg.content && (
                    <span className="inline-block w-1.5 h-3.5 bg-teal-400 rounded ml-0.5 animate-pulse" />
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts — shown only on first message */}
          {messages.length <= 1 && !loading && (
            <div className="px-4 pb-2 flex gap-1.5 flex-wrap shrink-0 bg-slate-50/50">
              {prompts.map(p => (
                <button key={p} onClick={() => send(p)}
                  className="text-[11px] px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-all font-medium">
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t border-slate-100 shrink-0 bg-white">
            <div className="flex items-end gap-2 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-400/15 transition-all px-3 py-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask anything about Dealio…"
                rows={1}
                disabled={loading}
                className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none min-h-[20px] max-h-[80px] leading-5 disabled:opacity-50"
                style={{ height: Math.min(80, Math.max(20, input.split('\n').length * 20)) }}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  input.trim() && !loading
                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-300 mt-1.5">Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </>
  );
}
