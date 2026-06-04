import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { cpApi } from '@/lib/api';
import { Phone, MessageSquare, Loader2, RefreshCw, User, List, CalendarDays } from 'lucide-react';
import { AppleCalendar, CalEvent } from '@/components/shared/AppleCalendar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CPLead {
  id: number;
  projectName: string;
  customerName: string;
  customerPhone: string;
  status: string;
  createdAt: string;
}

interface CPFollowUp {
  id: string;
  dealId: string;
  customerName: string;
  projectName: string;
  reason: string;
  dueDate: string;
  dueTime?: string | null;
  done: boolean;
  createdAt: string;
}

interface CPMeeting {
  id: number;
  projectName: string;
  customerName: string;
  customerPhone: string;
  preferredDate: string;
  preferredTime: string;
  confirmedDate: string | null;
  confirmedTime: string | null;
  meetingType: string | null;
  status: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  'New Lead':          'bg-slate-100 text-slate-600',
  'Profile Created':   'bg-blue-100 text-blue-700',
  'Meeting Requested': 'bg-amber-100 text-amber-700',
  'Meeting Confirmed': 'bg-indigo-100 text-indigo-700',
  'Meeting Done':      'bg-violet-100 text-violet-700',
  'Negotiation':       'bg-orange-100 text-orange-700',
  'Booked':            'bg-emerald-100 text-emerald-700',
  'Closed':            'bg-gray-100 text-gray-500',
};

const NEXT_ACTION: Record<string, string> = {
  'New Lead':          'Call to understand requirements and schedule a site visit',
  'Profile Created':   'Share project brochure via WhatsApp',
  'Meeting Requested': 'Confirm the site visit date with the builder',
  'Meeting Confirmed': 'Send a reminder message 24 hours before the visit',
  'Meeting Done':      'Follow up with pricing details and payment plan',
  'Negotiation':       'Share payment plan options and builder special offers',
};

const ACTIVE_STATUSES = ['New Lead', 'Profile Created', 'Meeting Requested', 'Meeting Confirmed', 'Meeting Done', 'Negotiation'];

const daysBetween = (dateStr: string) =>
  Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);

function toDateOnly(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.split('T')[0];
  return d.toISOString().split('T')[0];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CPFollowUps() {
  const { user } = useAuthStore();
  const cpUserId = user?.id ?? '';

  const [leads,     setLeads]     = useState<CPLead[]>([]);
  const [followUps, setFollowUps] = useState<CPFollowUp[]>([]);
  const [meetings,  setMeetings]  = useState<CPMeeting[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<string>('All');
  const [viewMode,  setViewMode]  = useState<'list' | 'calendar'>('list');

  const fetchAll = useCallback(async () => {
    if (!cpUserId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [leadsData, fuData, mtgData] = await Promise.all([
        cpApi.getLeads(cpUserId),
        cpApi.getFollowUps(cpUserId),
        cpApi.getMeetings(cpUserId),
      ]);
      setLeads((leadsData as CPLead[]) || []);
      setFollowUps((fuData as CPFollowUp[]) || []);
      setMeetings((mtgData as CPMeeting[]) || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [cpUserId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const active   = leads.filter(l => ACTIVE_STATUSES.includes(l.status));
  const filtered = filter === 'All' ? active : active.filter(l => l.status === filter);

  const statuses = ['All', ...ACTIVE_STATUSES];

  const openWA = (name: string, project: string, phone: string) => {
    const msg = `Hi ${name}, just checking in on your property search! Have you had time to think about ${project}? I'm here to answer any questions.`;
    window.open(`https://wa.me/91${phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // ── Calendar events mapping ────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const calEvents: CalEvent[] = [
    ...followUps
      .filter(f => !f.done)
      .map(f => ({
        id:       `fu-${f.id}`,
        title:    f.customerName,
        subtitle: f.projectName + ' · ' + f.reason,
        date:     toDateOnly(f.dueDate),
        time:     f.dueTime || undefined,
        type:     'followup' as const,
      })),
    ...meetings
      .filter(m => !['Cancelled'].includes(m.status))
      .map(m => ({
        id:       `mtg-${m.id}`,
        title:    m.customerName,
        subtitle: m.projectName,
        date:     toDateOnly(m.confirmedDate || m.preferredDate),
        time:     m.confirmedTime || m.preferredTime || undefined,
        type:     (m.meetingType === 'Site Visit' ? 'visit' : 'meeting') as CalEvent['type'],
        status:   m.status,
        phone:    m.customerPhone,
      })),
    // Leads in Negotiation show as ongoing action items (pinned to today)
    ...active
      .filter(l => l.status === 'Negotiation')
      .map(l => ({
        id:       `lead-${l.id}`,
        title:    l.customerName,
        subtitle: l.projectName + ' · Negotiate pricing',
        date:     today,
        type:     'negotiation' as const,
        phone:    l.customerPhone,
      })),
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold text-foreground">Follow-ups</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">Track and act on all active leads</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-muted/60 rounded-xl p-1">
              {(['list', 'calendar'] as const).map(v => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${viewMode === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  {v === 'list' ? <List size={13} /> : <CalendarDays size={13} />}
                  {v === 'list' ? 'List' : 'Calendar'}
                </button>
              ))}
            </div>
            <button onClick={fetchAll} disabled={loading}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active Follow-ups',    value: active.length,                                       color: 'text-foreground' },
            { label: 'Needs Attention (7d+)', value: active.filter(l => daysBetween(l.createdAt) >= 7).length, color: 'text-amber-600' },
            { label: 'Hot (Negotiation)',     value: active.filter(l => l.status === 'Negotiation').length, color: 'text-orange-600' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Calendar view ── */}
        {viewMode === 'calendar' && (
          <AppleCalendar events={calEvents} loading={loading} accentColor="#0A7E8C" />
        )}

        {/* ── List view ── */}
        {viewMode === 'list' && (
          <>
            {/* Status filter */}
            <div className="flex gap-1.5 flex-wrap">
              {statuses.map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border ${
                    filter === s
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-card border-border text-muted-foreground hover:border-teal-300 hover:text-teal-700'
                  }`}>
                  {s}{s === 'All' ? ` (${active.length})` : ''}
                </button>
              ))}
            </div>

            {/* Lead list */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-14">
                  <Loader2 size={24} className="animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                    <CalendarDays size={22} className="text-muted-foreground" />
                  </div>
                  <p className="text-[13px] font-semibold text-foreground">No active follow-ups</p>
                  <p className="text-[12px] text-muted-foreground mt-1">All leads are either booked or closed.</p>
                </div>
              ) : (
                filtered.map((lead, i) => {
                  const age    = daysBetween(lead.createdAt);
                  const action = NEXT_ACTION[lead.status];
                  return (
                    <div key={lead.id} className={`px-5 py-4 ${i < filtered.length - 1 ? 'border-b border-border' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                          <User size={16} className="text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[13px] font-semibold text-foreground">{lead.customerName}</p>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[lead.status] ?? 'bg-muted text-muted-foreground'}`}>
                              {lead.status}
                            </span>
                            {age >= 7 && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                {age}d idle
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{lead.projectName}</p>
                          {action && (
                            <p className="text-[11px] text-teal-700 mt-1.5 bg-teal-50 px-2.5 py-1 rounded-lg">
                              → {action}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {lead.customerPhone && (
                            <>
                              <a href={`tel:${lead.customerPhone}`}
                                className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors">
                                <Phone size={13} />
                              </a>
                              <button onClick={() => openWA(lead.customerName, lead.projectName, lead.customerPhone)}
                                className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors">
                                <MessageSquare size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
