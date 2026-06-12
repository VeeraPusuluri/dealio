import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { portalApi, builderApi, cpApi } from '@/lib/api';
import { useDealSocket } from '@/hooks/useDealSocket';
import { MessageSquare, Send, Wifi, WifiOff, Loader2, Building2 } from 'lucide-react';

// A conversation is a deal thread — the same `deal:${id}` socket room used across the app.
interface Conversation {
  id: number;       // dealId — the socket room + message thread key
  title: string;    // who/what the conversation is about
  subtitle: string; // project · stage
}

const DealConversation = () => {
  const { user } = useAuthStore();
  const [params] = useSearchParams();
  const wantDealId = params.get('dealId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // Socket connects only while a conversation is open (see useDealSocket).
  const { messages, connected, sendMessage } = useDealSocket(selectedId);

  // Load the caller's conversations (their deals) from the backend.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let convs: Conversation[] = [];
        if (user.role === 'customer') {
          const deals = (await portalApi.getMyDeals(user.phone ?? '')) as Record<string, unknown>[];
          convs = (deals || []).map(d => ({
            id: Number(d.dealId),
            title: (d.projectName as string) || 'Your Builder',
            subtitle: `With your builder · ${(d.dealStatus as string) ?? ''}`.trim(),
          }));
        } else if (user.role === 'builder') {
          const builderId = builderApi.getCachedBuilderId();
          if (builderId) {
            const deals = (await builderApi.getBuilderDeals(builderId)) as Record<string, unknown>[];
            convs = (deals || []).map(d => ({
              id: Number(d.id),
              title: (d.customerName as string) || 'Customer',
              subtitle: `${(d.projectName as string) ?? ''} · ${(d.status as string) ?? ''}`.replace(/^ · | · $/g, ''),
            }));
          }
        } else if (user.role === 'cp') {
          const leads = (await cpApi.getLeads(user.id)) as Record<string, unknown>[];
          convs = (leads || []).map(d => ({
            id: Number(d.id ?? d.dealId),
            title: (d.customerName as string) || 'Customer',
            subtitle: `${(d.projectName as string) ?? ''} · ${(d.stage as string) ?? (d.status as string) ?? ''}`.replace(/^ · | · $/g, ''),
          }));
        }
        convs = convs.filter(c => Number.isFinite(c.id));
        if (cancelled) return;
        setConversations(convs);
        // Auto-open the requested deal (from "Contact Builder"), else the first conversation.
        const want = wantDealId ? convs.find(c => c.id === Number(wantDealId)) : null;
        setSelectedId(want?.id ?? convs[0]?.id ?? null);
      } catch {
        if (!cancelled) setConversations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, wantDealId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (!user) return null;

  const selected = conversations.find(c => c.id === selectedId) ?? null;

  const handleSend = () => {
    const t = draft.trim();
    if (!t || selectedId == null) return;
    sendMessage(t);
    setDraft('');
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Conversation list */}
        <div className="w-80 shrink-0 bg-card rounded-lg border border-border overflow-y-auto">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-card-foreground">Conversations</h3>
              <p className="text-xs text-muted-foreground">
                {conversations.length} {conversations.length === 1 ? 'chat' : 'chats'}
              </p>
            </div>
            {selectedId != null && (connected
              ? <Wifi size={14} className="text-green-500" aria-label="Connected" />
              : <WifiOff size={14} className="text-slate-400" aria-label="Connecting" />)}
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No conversations yet. Book a site visit to start one with your builder.
            </p>
          ) : conversations.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`w-full text-left p-4 border-b border-border hover:bg-muted/50 transition-colors ${selectedId === c.id ? 'bg-primary/5' : ''}`}
            >
              <p className="font-medium text-sm text-card-foreground truncate">{c.title}</p>
              <p className="text-xs text-muted-foreground truncate">{c.subtitle}</p>
            </button>
          ))}
        </div>

        {/* Chat pane */}
        <div className="flex-1 bg-card rounded-lg border border-border flex flex-col">
          {selected ? (
            <>
              <div className="p-4 border-b border-border flex items-center gap-2">
                <Building2 size={16} className="text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-card-foreground">{selected.title}</h3>
                  <p className="text-xs text-muted-foreground">{selected.subtitle}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 p-4">
                {messages.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    {connected ? 'No messages yet. Say hello to your builder!' : 'Connecting…'}
                  </p>
                )}
                {messages.map(m => {
                  const mine = m.senderRole === user.role;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-3 rounded-lg ${mine ? 'bg-primary/10' : 'bg-muted/50'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-medium text-muted-foreground capitalize">
                            {mine ? 'You' : m.senderRole}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-card-foreground">{m.message}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              <div className="p-4 border-t border-border flex gap-2">
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                  placeholder={connected ? 'Type a message…' : 'Connecting…'}
                  disabled={!connected}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                />
                <button
                  onClick={handleSend}
                  disabled={!connected || !draft.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Send size={14} /> Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
                <p>{loading ? 'Loading…' : 'Select a conversation to start chatting'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DealConversation;
