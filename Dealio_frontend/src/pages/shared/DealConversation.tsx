import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { portalApi, builderApi, cpApi } from '@/lib/api';
import { useDealSocket } from '@/hooks/useDealSocket';
import { threadKey, ROLE_LABEL, ChatRole } from '@/lib/threads';
import { MessageSquare, Send, Wifi, WifiOff, Loader2, Building2, User, Users, Plus, X } from 'lucide-react';

// A conversation is a *private thread* between the signed-in user and one
// counterparty (builder / cp / customer) on a deal. Each deal can yield up to two
// threads for the viewer; builder↔customer and customer↔cp never see each other.
interface ThreadConv {
  key: string;               // `${dealId}:${threadKey}` — unique row id
  dealId: number;
  threadKey: string;         // canonical role pair, scopes the socket room
  counterpartyRole: ChatRole;
  title: string;             // counterparty name
  subtitle: string;          // project · stage
}

const ROLE_ICON: Record<ChatRole, typeof Building2> = {
  builder: Building2,
  cp: Users,
  customer: User,
};

const clean = (s: string) => s.replace(/^ · | · $/g, '').trim();

const DealConversation = () => {
  const { user } = useAuthStore();
  const [params] = useSearchParams();
  const wantDealId = params.get('dealId');
  const wantWith = params.get('with'); // 'builder' | 'cp' | 'customer'

  const [conversations, setConversations] = useState<ThreadConv[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const myRole = user?.role as ChatRole | undefined;
  const selected = conversations.find(c => c.key === selectedKey) ?? null;

  // Socket connects only while a thread is open (see useDealSocket).
  const { messages, connected, sendMessage } = useDealSocket(selected?.dealId ?? null, selected?.threadKey);

  // Load the caller's conversations (the private threads on their deals).
  useEffect(() => {
    if (!user || !myRole) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const convs: ThreadConv[] = [];
        const add = (dealId: number, counterpartyRole: ChatRole, title: string, subtitle: string) => {
          if (!Number.isFinite(dealId) || !title) return;
          convs.push({
            key: `${dealId}:${threadKey(myRole, counterpartyRole)}`,
            dealId,
            threadKey: threadKey(myRole, counterpartyRole),
            counterpartyRole,
            title,
            subtitle: clean(subtitle),
          });
        };

        if (myRole === 'customer') {
          const deals = (await portalApi.getMyDeals(user.phone ?? '')) as Record<string, unknown>[];
          (deals || []).forEach(d => {
            const dealId = Number(d.dealId);
            const sub = `${(d.projectName as string) ?? ''} · ${(d.dealStatus as string) ?? ''}`;
            add(dealId, 'builder', (d.builderName as string) || 'Your Builder', sub);
            if (d.cpName) add(dealId, 'cp', d.cpName as string, sub);
          });
        } else if (myRole === 'builder') {
          const builderId = builderApi.getCachedBuilderId();
          if (builderId) {
            const deals = (await builderApi.getBuilderDeals(builderId)) as Record<string, unknown>[];
            (deals || []).forEach(d => {
              const dealId = Number(d.id);
              const sub = `${(d.projectName as string) ?? ''} · ${(d.status as string) ?? ''}`;
              add(dealId, 'customer', (d.customerName as string) || 'Customer', sub);
              if (d.cpName) add(dealId, 'cp', d.cpName as string, sub);
            });
          }
        } else if (myRole === 'cp') {
          const leads = (await cpApi.getLeads(user.id)) as Record<string, unknown>[];
          (leads || []).forEach(d => {
            const dealId = Number(d.id ?? d.dealId);
            const sub = `${(d.projectName as string) ?? ''} · ${(d.stage as string) ?? (d.status as string) ?? ''}`;
            add(dealId, 'customer', (d.customerName as string) || 'Customer', sub);
            add(dealId, 'builder', (d.builderName as string) || 'Builder', sub);
          });
        }

        if (cancelled) return;
        setConversations(convs);

        // Auto-open: a deep-link (?dealId=&with=) wins, else the first thread.
        let want: ThreadConv | undefined;
        if (wantDealId) {
          const ofDeal = convs.filter(c => c.dealId === Number(wantDealId));
          want = (wantWith && ofDeal.find(c => c.counterpartyRole === wantWith)) || ofDeal[0];
        }
        setSelectedKey(want?.key ?? convs[0]?.key ?? null);
      } catch {
        if (!cancelled) setConversations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, myRole, wantDealId, wantWith]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Group conversations by counterparty role for the "+" picker.
  const grouped = useMemo(() => {
    const g: Partial<Record<ChatRole, ThreadConv[]>> = {};
    conversations.forEach(c => { (g[c.counterpartyRole] ??= []).push(c); });
    return g;
  }, [conversations]);

  if (!user || !myRole) return null;

  const handleSend = () => {
    const t = draft.trim();
    if (!t || !selected) return;
    sendMessage(t);
    setDraft('');
  };

  const openThread = (key: string) => {
    setSelectedKey(key);
    setPickerOpen(false);
  };

  const SelectedIcon = selected ? ROLE_ICON[selected.counterpartyRole] : Building2;

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Conversation list */}
        <div className="w-80 shrink-0 bg-card rounded-lg border border-border overflow-y-auto relative">
          <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
            <div>
              <h3 className="font-semibold text-card-foreground">Conversations</h3>
              <p className="text-xs text-muted-foreground">
                {conversations.length} {conversations.length === 1 ? 'chat' : 'chats'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selected && (connected
                ? <Wifi size={14} className="text-green-500" aria-label="Connected" />
                : <WifiOff size={14} className="text-slate-400" aria-label="Connecting" />)}
              <button
                onClick={() => setPickerOpen(o => !o)}
                aria-label="Start a new conversation"
                title="New conversation"
                className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                {pickerOpen ? <X size={15} /> : <Plus size={15} />}
              </button>
            </div>
          </div>

          {/* New-conversation picker — only the parties this user is linked with */}
          {pickerOpen && (
            <div className="border-b border-border bg-muted/30 p-3 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground">
                Start a conversation with…
              </p>
              {conversations.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No linked contacts yet. They appear here once a booking links you.
                </p>
              )}
              {(['builder', 'cp', 'customer'] as ChatRole[]).map(role => {
                const items = grouped[role];
                if (!items || items.length === 0) return null;
                const Icon = ROLE_ICON[role];
                return (
                  <div key={role} className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/80">
                      {ROLE_LABEL[role]}s
                    </p>
                    {items.map(c => (
                      <button
                        key={c.key}
                        onClick={() => openThread(c.key)}
                        className="w-full flex items-center gap-2 text-left px-2.5 py-2 rounded-md hover:bg-background transition-colors"
                      >
                        <Icon size={14} className="text-muted-foreground shrink-0" />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-card-foreground truncate">{c.title}</span>
                          <span className="block text-[11px] text-muted-foreground truncate">{c.subtitle}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No conversations yet. Book a site visit to start one with your builder.
            </p>
          ) : conversations.map(c => {
            const Icon = ROLE_ICON[c.counterpartyRole];
            return (
              <button
                key={c.key}
                onClick={() => setSelectedKey(c.key)}
                className={`w-full text-left p-4 border-b border-border hover:bg-muted/50 transition-colors flex items-start gap-2.5 ${selectedKey === c.key ? 'bg-primary/5' : ''}`}
              >
                <Icon size={15} className="text-muted-foreground mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="font-medium text-sm text-card-foreground truncate">{c.title}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">· {ROLE_LABEL[c.counterpartyRole]}</span>
                  </span>
                  <span className="block text-xs text-muted-foreground truncate">{c.subtitle}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Chat pane */}
        <div className="flex-1 bg-card rounded-lg border border-border flex flex-col">
          {selected ? (
            <>
              <div className="p-4 border-b border-border flex items-center gap-2">
                <SelectedIcon size={16} className="text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-card-foreground">
                    {selected.title} <span className="text-xs font-normal text-muted-foreground">· {ROLE_LABEL[selected.counterpartyRole]}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">{selected.subtitle}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 p-4">
                {messages.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    {connected ? `No messages yet. Say hello to your ${ROLE_LABEL[selected.counterpartyRole].toLowerCase()}!` : 'Connecting…'}
                  </p>
                )}
                {messages.map(m => {
                  const mine = m.senderRole === myRole;
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
                <p>{loading ? 'Loading…' : 'Select a conversation or tap + to start one'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DealConversation;
