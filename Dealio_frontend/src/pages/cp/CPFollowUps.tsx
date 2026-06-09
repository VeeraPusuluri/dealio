import { useState, useEffect, useCallback, Fragment } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { cpApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Phone, MessageSquare, Loader2, RefreshCw, User, List, CalendarDays,
  Plus, Check, Clock, X, ChevronDown, CheckCircle2,
} from 'lucide-react';
import { AppleCalendar, CalEvent } from '@/components/shared/AppleCalendar';

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

const STATUS_COLOR: Record<string, string> = {
  'New Lead':          'bg-slate-100 text-slate-600',
  'Profile Created':   'bg-blue-100 text-blue-700',
  'Meeting Requested': 'bg-amber-100 text-amber-700',
  'Meeting Confirmed': 'bg-indigo-100 text-indigo-700',
  'Meeting Done':      'bg-violet-100 text-violet-700',
  'Negotiation':       'bg-orange-100 text-orange-700',
  'Agreement':         'bg-blue-100 text-blue-700',
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
  'Agreement':         'Ensure customer confirms the agreement in the portal',
};

const ACTIVE_STATUSES = ['New Lead', 'Profile Created', 'Meeting Requested', 'Meeting Confirmed', 'Meeting Done', 'Negotiation', 'Agreement'];

const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];

const REASON_PRESETS = [
  'Check interest level', 'Share pricing details', 'Schedule site visit',
  'Follow up after visit', 'Discuss payment plan', 'Agreement follow-up',
  'Document collection', 'Loan assistance', 'Closing push',
];

const daysBetween = (dateStr: string) => Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);

function toDateOnly(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.split('T')[0];
  return d.toISOString().split('T')[0];
}

/* ── Schedule Follow-up inline form ─────────────────────────────── */
function ScheduleForm({
  lead, cpUserId, onCreated, onCancel,
}: {
  lead: CPLead; cpUserId: string | number;
  onCreated: (fu: CPFollowUp) => void;
  onCancel: () => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [dueDate, setDueDate] = useState(today);
  const [dueTime, setDueTime] = useState('');
  const [reason, setReason]   = useState('');
  const [saving, setSaving]   = useState(false);

  const handleSave = async () => {
    if (!dueDate || !reason.trim()) { toast.error('Pick a date and add a reason'); return; }
    setSaving(true);
    try {
      const fu = await cpApi.createFollowUp(cpUserId, {
        dealId: lead.id,
        dueDate,
        dueTime: dueTime || undefined,
        reason:  reason.trim(),
      }) as CPFollowUp;
      toast.success(`Follow-up scheduled for ${dueDate}${dueTime ? ` at ${dueTime}` : ''}`);
      onCreated(fu);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to schedule follow-up');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-3">
      <p className="text-[11px] font-bold text-teal-700 uppercase tracking-wide">Schedule Follow-up · {lead.customerName}</p>

      {/* Date + time row */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[140px]">
          <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Date</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} min={today}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all" />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Time (optional)</label>
          <div className="relative">
            <select value={dueTime} onChange={e => setDueTime(e.target.value)}
              className="w-full appearance-none px-3 py-2 rounded-xl border border-border bg-background text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 pr-8">
              <option value="">Any time</option>
              {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Quick reason chips */}
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground block mb-1.5">Reason</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {REASON_PRESETS.map(r => (
            <button key={r} type="button" onClick={() => setReason(r)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                reason === r ? 'bg-teal-600 text-white border-teal-600' : 'bg-card border-border text-muted-foreground hover:border-teal-300 hover:text-teal-700'
              }`}>
              {r}
            </button>
          ))}
        </div>
        <input value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Or type a custom reason…"
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 placeholder:text-muted-foreground" />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={handleSave} disabled={saving || !dueDate || !reason.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          {saving ? 'Saving…' : 'Schedule'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-xl text-[12px] text-muted-foreground border border-border hover:bg-muted transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function CPFollowUps({ embedded }: { embedded?: boolean } = {}) {
  const { user } = useAuthStore();
  const Wrapper = embedded ? Fragment : DashboardLayout;
  const cpUserId = user?.id ?? '';

  const [leads,     setLeads]     = useState<CPLead[]>([]);
  const [followUps, setFollowUps] = useState<CPFollowUp[]>([]);
  const [meetings,  setMeetings]  = useState<CPMeeting[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<string>('All');
  const [viewMode,  setViewMode]  = useState<'list' | 'calendar'>('list');
  const [schedulingFor, setSchedulingFor] = useState<number | null>(null);
  const [markingDone,   setMarkingDone]   = useState<string | null>(null);

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

  const handleMarkDone = async (fu: CPFollowUp) => {
    setMarkingDone(fu.id);
    try {
      await cpApi.markFollowUpDone(cpUserId, fu.id);
      setFollowUps(prev => prev.map(f => f.id === fu.id ? { ...f, done: true } : f));
      toast.success('Follow-up marked as done');
    } catch { toast.error('Failed to update'); }
    finally { setMarkingDone(null); }
  };

  const today  = new Date().toISOString().split('T')[0];
  const active = leads.filter(l => ACTIVE_STATUSES.includes(l.status));
  const filtered = filter === 'All' ? active : active.filter(l => l.status === filter);
  const statuses = ['All', ...ACTIVE_STATUSES];

  // Follow-ups grouped by lead
  const fuByDeal = followUps.reduce((acc, fu) => {
    const arr = acc[fu.dealId] ?? [];
    arr.push(fu);
    acc[fu.dealId] = arr;
    return acc;
  }, {} as Record<string, CPFollowUp[]>);

  const pendingToday = followUps.filter(f => !f.done && toDateOnly(f.dueDate) === today).length;
  const pendingTotal = followUps.filter(f => !f.done).length;

  const openWA = (name: string, project: string, phone: string) => {
    const msg = `Hi ${name}, just checking in on your property search! Have you had time to think about ${project}? I'm here to answer any questions.`;
    window.open(`https://wa.me/91${phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const calEvents: CalEvent[] = [
    ...followUps.filter(f => !f.done).map(f => ({
      id:       `fu-${f.id}`,
      title:    f.customerName,
      subtitle: f.projectName + ' · ' + f.reason,
      date:     toDateOnly(f.dueDate),
      time:     f.dueTime || undefined,
      type:     'followup' as const,
    })),
    ...meetings.filter(m => m.status !== 'Cancelled').map(m => ({
      id:       `mtg-${m.id}`,
      title:    m.customerName,
      subtitle: m.projectName,
      date:     toDateOnly(m.confirmedDate || m.preferredDate),
      time:     m.confirmedTime || m.preferredTime || undefined,
      type:     (m.meetingType === 'Site Visit' ? 'visit' : 'meeting') as CalEvent['type'],
      status:   m.status,
      phone:    m.customerPhone,
    })),
    ...active.filter(l => l.status === 'Negotiation').map(l => ({
      id: `lead-${l.id}`, title: l.customerName,
      subtitle: l.projectName + ' · Negotiate pricing',
      date: today, type: 'negotiation' as const, phone: l.customerPhone,
    })),
  ];

  return (
    <Wrapper>
      <div className={embedded ? 'space-y-5' : 'space-y-5 pb-8'}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold text-foreground">Follow-ups</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">Track and schedule follow-ups for all active leads</p>
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
            { label: 'Active Leads',      value: active.length,     color: 'text-foreground'  },
            { label: 'Due Today',         value: pendingToday,      color: pendingToday > 0 ? 'text-amber-600' : 'text-foreground' },
            { label: 'Pending Follow-ups', value: pendingTotal,      color: pendingTotal > 0 ? 'text-teal-700' : 'text-foreground'  },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {viewMode === 'calendar' && (
          <AppleCalendar events={calEvents} loading={loading} accentColor="#0A7E8C" />
        )}

        {viewMode === 'list' && (
          <>
            <div className="flex gap-1.5 flex-wrap">
              {statuses.map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border ${
                    filter === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-card border-border text-muted-foreground hover:border-teal-300 hover:text-teal-700'
                  }`}>
                  {s}{s === 'All' ? ` (${active.length})` : ''}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-14"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
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
                  const leadFUs = (fuByDeal[String(lead.id)] ?? []).filter(f => !f.done);
                  const todayFU = leadFUs.find(f => toDateOnly(f.dueDate) === today);
                  const isScheduling = schedulingFor === lead.id;

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
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">{age}d idle</span>
                            )}
                            {todayFU && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                                <Clock size={9} /> Due today{todayFU.dueTime ? ` · ${todayFU.dueTime}` : ''}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{lead.projectName}</p>
                          {action && !isScheduling && (
                            <p className="text-[11px] text-teal-700 mt-1.5 bg-teal-50 px-2.5 py-1 rounded-lg">→ {action}</p>
                          )}

                          {/* Pending follow-ups for this lead */}
                          {leadFUs.length > 0 && !isScheduling && (
                            <div className="mt-2 space-y-1.5">
                              {leadFUs.slice(0, 3).map(fu => (
                                <div key={fu.id} className="flex items-center gap-2 text-[11px] bg-muted/40 rounded-lg px-2.5 py-1.5">
                                  <Clock size={10} className="text-teal-600 shrink-0" />
                                  <span className="text-foreground font-medium flex-1 truncate">{fu.reason}</span>
                                  <span className="text-muted-foreground shrink-0">
                                    {toDateOnly(fu.dueDate) === today ? 'Today' : toDateOnly(fu.dueDate)}
                                    {fu.dueTime ? ` · ${fu.dueTime}` : ''}
                                  </span>
                                  <button
                                    onClick={() => handleMarkDone(fu)}
                                    disabled={markingDone === fu.id}
                                    title="Mark done"
                                    className="w-5 h-5 rounded-full border border-border bg-card hover:bg-emerald-50 hover:border-emerald-400 flex items-center justify-center transition-colors shrink-0">
                                    {markingDone === fu.id
                                      ? <Loader2 size={9} className="animate-spin text-muted-foreground" />
                                      : <Check size={9} className="text-muted-foreground" />}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Schedule inline form */}
                          {isScheduling && (
                            <ScheduleForm
                              lead={lead}
                              cpUserId={cpUserId}
                              onCreated={fu => {
                                setFollowUps(prev => [fu, ...prev]);
                                setSchedulingFor(null);
                              }}
                              onCancel={() => setSchedulingFor(null)}
                            />
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            onClick={() => setSchedulingFor(isScheduling ? null : lead.id)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
                              isScheduling
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                            }`}>
                            {isScheduling ? <X size={11} /> : <Plus size={11} />}
                            {isScheduling ? 'Cancel' : 'Follow-up'}
                          </button>
                          {lead.customerPhone && (
                            <div className="flex gap-1">
                              <a href={`tel:${lead.customerPhone}`}
                                className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors">
                                <Phone size={13} />
                              </a>
                              <button onClick={() => openWA(lead.customerName, lead.projectName, lead.customerPhone)}
                                className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors">
                                <MessageSquare size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Done follow-ups today */}
            {followUps.filter(f => f.done && toDateOnly(f.dueDate) === today).length > 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                  <CheckCircle2 size={12} /> Completed today · {followUps.filter(f => f.done && toDateOnly(f.dueDate) === today).length}
                </p>
                <div className="space-y-1.5">
                  {followUps.filter(f => f.done && toDateOnly(f.dueDate) === today).map(fu => (
                    <div key={fu.id} className="flex items-center gap-2 text-[11px]">
                      <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                      <span className="font-medium text-emerald-800">{fu.customerName}</span>
                      <span className="text-emerald-600">· {fu.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Wrapper>
  );
}
