import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { cpApi } from '@/lib/api';
import { Brain, Phone, MessageSquare, Zap, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react';

interface CPLead {
  id: number;
  customerName: string;
  customerPhone: string;
  projectName: string;
  status: string;
  createdAt: string;
}

type HeatLabel = 'Hot' | 'Warm' | 'Cold';

const STATUS_SCORE: Record<string, number> = {
  'Negotiation':       88,
  'Meeting Done':      72,
  'Meeting Confirmed': 62,
  'Meeting Requested': 52,
  'Profile Created':   36,
  'New Lead':          22,
  'Booked':            95,
};

const STATUS_LABEL: Record<string, HeatLabel> = {
  'Negotiation':       'Hot',
  'Booked':            'Hot',
  'Meeting Done':      'Warm',
  'Meeting Confirmed': 'Warm',
  'Meeting Requested': 'Warm',
  'Profile Created':   'Cold',
  'New Lead':          'Cold',
};

const NEXT_ACTION: Record<string, string> = {
  'New Lead':          'Call to introduce yourself and understand their requirements',
  'Profile Created':   'Share the project brochure and highlight key features via WhatsApp',
  'Meeting Requested': 'Coordinate with the builder to confirm the site visit date',
  'Meeting Confirmed': 'Send a warm reminder 24 hours before the site visit',
  'Meeting Done':      'Follow up with pricing, payment plan, and available configurations',
  'Negotiation':       'Share special offers and flexible payment plans to close the deal',
  'Booked':            'Congratulate and assist with documentation and loan requirements',
};

const heatColors: Record<HeatLabel, { bg: string; text: string; bar: string; pill: string }> = {
  Hot:  { bg: 'bg-red-50',    text: 'text-red-700',    bar: 'bg-red-500',    pill: 'bg-red-100 text-red-700 border-red-200' },
  Warm: { bg: 'bg-amber-50',  text: 'text-amber-700',  bar: 'bg-amber-500',  pill: 'bg-amber-100 text-amber-700 border-amber-200' },
  Cold: { bg: 'bg-blue-50',   text: 'text-blue-700',   bar: 'bg-blue-500',   pill: 'bg-blue-100 text-blue-700 border-blue-200' },
};

function computeScore(lead: CPLead): { score: number; label: HeatLabel } {
  const base  = STATUS_SCORE[lead.status] ?? 20;
  const days  = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 86400000);
  const decay = Math.min(days * 0.5, 20);
  const score = Math.max(5, Math.round(base - decay));
  const label: HeatLabel = score >= 70 ? 'Hot' : score >= 45 ? 'Warm' : 'Cold';
  return { score, label };
}

export default function CPAIInsights() {
  const { user } = useAuthStore();
  const cpUserId = user?.id ?? '';

  const [leads, setLeads]       = useState<CPLead[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<'All' | HeatLabel>('All');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchLeads = useCallback(async () => {
    if (!cpUserId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await cpApi.getLeads(cpUserId);
      const active = ((data as CPLead[]) || []).filter(l => l.status !== 'Closed');
      setLeads(active);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [cpUserId]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const scored = leads.map(l => ({ ...l, ...computeScore(l) }));
  const hot  = scored.filter(l => l.label === 'Hot').length;
  const warm = scored.filter(l => l.label === 'Warm').length;
  const cold = scored.filter(l => l.label === 'Cold').length;

  const filtered = filter === 'All' ? scored : scored.filter(l => l.label === filter);
  const sorted   = [...filtered].sort((a, b) => b.score - a.score);

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
              <Brain size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-foreground">AI Lead Intelligence</h1>
              <p className="text-[12px] text-muted-foreground mt-0.5">Scoring based on lead stage and activity</p>
            </div>
          </div>
          <button onClick={fetchLeads} disabled={loading}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Active', value: leads.length, color: 'text-foreground' },
            { label: 'Hot Leads',    value: hot,          color: 'text-red-600' },
            { label: 'Warm Leads',   value: warm,         color: 'text-amber-600' },
            { label: 'Cold Leads',   value: cold,         color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-1.5">
          {(['All', 'Hot', 'Warm', 'Cold'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border ${
                filter === f ? 'bg-teal-600 text-white border-teal-600' : 'bg-card border-border text-muted-foreground hover:border-teal-300'
              }`}>
              {f}
            </button>
          ))}
        </div>

        {/* Lead cards */}
        {loading ? (
          <div className="flex justify-center py-14">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <Brain size={28} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-[13px] font-semibold text-foreground">No active leads</p>
            <p className="text-[12px] text-muted-foreground mt-1">Add leads from the Projects page to see AI scoring.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sorted.map(lead => {
              const c = heatColors[lead.label];
              const expanded = expandedId === lead.id;
              const action = NEXT_ACTION[lead.status];
              return (
                <div key={lead.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                  <button className="w-full text-left px-5 py-4 flex items-center gap-4"
                    onClick={() => setExpandedId(expanded ? null : lead.id)}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-[15px] ${c.bg} ${c.text}`}>
                      {lead.customerName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-foreground">{lead.customerName}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.pill}`}>
                          {lead.score} · {lead.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{lead.projectName} · {lead.status}</p>
                    </div>
                    <div className="w-20 shrink-0">
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${lead.score}%` }} />
                      </div>
                    </div>
                    {expanded ? <ChevronUp size={14} className="text-muted-foreground shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground shrink-0" />}
                  </button>

                  {expanded && (
                    <div className="border-t border-border px-5 py-4 space-y-3 bg-muted/20">
                      {action && (
                        <div className="flex items-start gap-2.5 bg-teal-50 border border-teal-100 rounded-xl px-3.5 py-3">
                          <Zap size={14} className="text-teal-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-teal-600 mb-0.5">Next Best Action</p>
                            <p className="text-[13px] text-teal-800">{action}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {lead.customerPhone && (
                          <>
                            <a href={`tel:${lead.customerPhone}`}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-[12px] font-semibold hover:bg-emerald-700 transition-colors">
                              <Phone size={12} /> Call
                            </a>
                            <button onClick={() => {
                              const msg = `Hi ${lead.customerName}, ${NEXT_ACTION[lead.status] ?? 'just checking in on your property search!'}`;
                              window.open(`https://wa.me/91${lead.customerPhone.replace(/\D/,'')}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500 text-white text-[12px] font-semibold hover:bg-green-600 transition-colors">
                              <MessageSquare size={12} /> WhatsApp
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
