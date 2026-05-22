import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { builderApi } from '@/lib/api';
import { pushNotifTo } from '@/lib/crossNotify';
import { useNotificationStore } from '@/stores/useNotificationStore';
import {
  Calendar, CheckCircle2, Clock, MessageSquare, Phone, Loader2,
  RefreshCw, Building2, XCircle, Users, FileText,
  ChevronRight, Search, X, ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

interface ApiMeeting {
  id: number;
  builderId: number;
  projectId: number | null;
  projectName: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  preferredDate: string;
  preferredTime: string;
  meetingType: string | null;
  notes: string | null;
  builderNotes: string | null;
  confirmedDate: string | null;
  confirmedTime: string | null;
  status: string;
  createdAt: string;
}

// ── status config ──────────────────────────────────────────────────────────────

const S: Record<string, { pill: string; dot: string; label: string; headerBg: string; headerText: string; headerBorder: string }> = {
  Pending:              { pill: 'bg-amber-50 text-amber-700 border border-amber-200',    dot: 'bg-amber-400',   label: 'Pending',   headerBg: 'bg-amber-50',   headerText: 'text-amber-700',  headerBorder: 'border-amber-100' },
  Confirmed:            { pill: 'bg-blue-50 text-blue-700 border border-blue-200',       dot: 'bg-blue-500',    label: 'Confirmed', headerBg: 'bg-blue-50',    headerText: 'text-blue-700',   headerBorder: 'border-blue-100' },
  Completed:            { pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500', label: 'Completed', headerBg: 'bg-emerald-50', headerText: 'text-emerald-700', headerBorder: 'border-emerald-100' },
  'Follow-up Required': { pill: 'bg-violet-50 text-violet-700 border border-violet-200', dot: 'bg-violet-500',  label: 'Follow-up', headerBg: 'bg-violet-50',  headerText: 'text-violet-700', headerBorder: 'border-violet-100' },
  Cancelled:            { pill: 'bg-red-50 text-red-600 border border-red-200',          dot: 'bg-red-400',     label: 'Cancelled', headerBg: 'bg-red-50',     headerText: 'text-red-600',    headerBorder: 'border-red-100' },
};

const STAT_STYLES: Record<string, { iconBg: string; iconColor: string }> = {
  Total:     { iconBg: 'bg-slate-100',   iconColor: 'text-slate-500' },
  Pending:   { iconBg: 'bg-amber-100',   iconColor: 'text-amber-600' },
  Confirmed: { iconBg: 'bg-blue-100',    iconColor: 'text-blue-600' },
  Completed: { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
};

const TYPE_ICON: Record<string, React.ElementType> = {
  'Site Visit': Building2, 'Builder Meeting': Users, 'Document Review': FileText,
};

function initials(n: string) { return n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
function fmtDate(s: string) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const isToday = d.toDateString() === new Date().toDateString();
  return isToday ? 'Today' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function isNew(s: string) { return Date.now() - new Date(s).getTime() < 24 * 3600 * 1000; }
function timeAgo(s: string) {
  const diff = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
  if (diff < 60)  return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

const ic = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 transition-all placeholder:text-slate-400 shadow-sm';

// ── component ──────────────────────────────────────────────────────────────────

const BuilderMeetings = () => {
  const [meetings,     setMeetings]     = useState<ApiMeeting[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('all');
  const [search,       setSearch]       = useState('');
  const [selected,     setSelected]     = useState<ApiMeeting | null>(null);
  const [actionType,   setActionType]   = useState<string | null>(null);
  const [notes,        setNotes]        = useState('');
  const [newDate,      setNewDate]      = useState('');
  const [newTime,      setNewTime]      = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);

  const loadMeetings = useCallback(async () => {
    const bid = builderApi.getCachedBuilderId();
    if (!bid) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await builderApi.getBuilderMeetings(bid);
      const list = (data as ApiMeeting[]) || [];
      setMeetings(list);
      setSelected(prev => prev ? (list.find(m => m.id === prev.id) ?? null) : null);
    } catch { toast.error('Could not load meetings'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadMeetings(); }, [loadMeetings]);
  useEffect(() => {
    const h = () => loadMeetings();
    window.addEventListener('dealio:new-meeting', h);
    return () => window.removeEventListener('dealio:new-meeting', h);
  }, [loadMeetings]);

  const total     = meetings.length;
  const pending   = meetings.filter(m => m.status === 'Pending').length;
  const confirmed = meetings.filter(m => m.status === 'Confirmed').length;
  const completed = meetings.filter(m => m.status === 'Completed').length;

  const list = meetings.filter(m => {
    if (filter !== 'all' && m.status !== filter) return false;
    if (search && !m.customerName.toLowerCase().includes(search.toLowerCase()) &&
        !m.projectName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAction = async () => {
    if (!actionType || !selected) return;
    const bid = builderApi.getCachedBuilderId();
    if (!bid) return;
    const statusMap: Record<string, string> = {
      confirm: 'Confirmed', complete: 'Completed',
      followup: 'Follow-up Required', reject: 'Cancelled',
    };
    const newStatus = statusMap[actionType];
    if (!newStatus) return;
    setSubmitting(true);
    try {
      await builderApi.updateMeetingStatus(bid, selected.id, {
        status: newStatus,
        ...(notes   ? { notes }   : {}),
        ...(newDate ? { confirmedDate: newDate } : {}),
        ...(newTime ? { confirmedTime: newTime } : {}),
      });
      const updated = { ...selected, status: newStatus };
      setMeetings(prev => prev.map(m => m.id === selected.id ? updated : m));
      setSelected(updated);
      toast.success({ confirm: 'Meeting confirmed!', complete: 'Marked as completed', followup: 'Follow-up flagged', reject: 'Request rejected' }[actionType] ?? 'Updated');

      const selfMsgs: Record<string, string> = {
        Confirmed: `Meeting with ${selected.customerName} confirmed for ${selected.preferredDate} at ${selected.preferredTime}`,
        Completed: `Meeting with ${selected.customerName} marked as completed`,
        'Follow-up Required': `Follow-up flagged for ${selected.customerName}`,
        Cancelled: `Meeting request from ${selected.customerName} rejected`,
      };
      useNotificationStore.getState().addNotification({
        type:    newStatus === 'Cancelled' ? 'error' : newStatus === 'Follow-up Required' ? 'warning' : 'success',
        title:   `Meeting ${newStatus}`,
        message: selfMsgs[newStatus] ?? '',
        link:    '/builder/meetings',
      });

      const customerId = String(selected.customerId);
      if (newStatus === 'Confirmed') {
        pushNotifTo('customer', customerId, { type: 'success', title: '✅ Meeting Confirmed!', message: `Your site visit for ${selected.projectName} on ${selected.preferredDate} at ${selected.preferredTime} has been confirmed by the builder.`, link: '/customer/meeting' });
      } else if (newStatus === 'Completed') {
        pushNotifTo('customer', customerId, { type: 'info', title: 'Meeting Completed', message: `Your visit to ${selected.projectName} has been marked as completed. We hope it went well!`, link: '/customer/meeting' });
      } else if (newStatus === 'Cancelled') {
        pushNotifTo('customer', customerId, { type: 'error', title: 'Meeting Request Declined', message: `Your meeting request for ${selected.projectName} on ${selected.preferredDate} could not be accommodated. Please try a different date.`, link: '/customer/meeting' });
      } else if (newStatus === 'Follow-up Required') {
        pushNotifTo('customer', customerId, { type: 'warning', title: 'Follow-up Scheduled', message: `The builder has flagged your visit to ${selected.projectName} for a follow-up. Expect a call soon.`, link: '/customer/meeting' });
      }
    } catch { toast.error('Failed to update'); }
    finally {
      setSubmitting(false); setActionType(null);
      setNotes(''); setNewDate(''); setNewTime('');
    }
  };

  const selectMeeting = (m: ApiMeeting) => { setSelected(m); setActionType(null); setMobileDetail(true); };
  const meta = selected ? (S[selected.status] ?? S['Pending']) : null;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-7rem)] gap-4">

        {/* ── Stat strip ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          {([
            { label: 'Total',     value: total },
            { label: 'Pending',   value: pending },
            { label: 'Confirmed', value: confirmed },
            { label: 'Completed', value: completed },
          ] as const).map(({ label, value }) => {
            const st = STAT_STYLES[label];
            return (
              <div key={label} className="la-card px-4 py-3.5 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${st.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Calendar size={16} className={st.iconColor} />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">{label}</p>
                  <p className="text-xl font-bold text-slate-800 leading-tight">{value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Split pane ─────────────────────────────────────────────────── */}
        <div className="flex gap-4 flex-1 min-h-0">

          {/* ── Left: list ─────────────────────────────────────────────── */}
          <div className={`flex flex-col la-card overflow-hidden flex-shrink-0 ${mobileDetail ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96`}>

            {/* search + filters */}
            <div className="p-4 border-b border-slate-100 space-y-3 flex-shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search customer or project…"
                  className="w-full pl-8 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={12} />
                  </button>
                )}
              </div>
              <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
                {['all', 'Pending', 'Confirmed', 'Completed', 'Follow-up Required', 'Cancelled'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all ${
                      filter === f ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}>
                    {f === 'all' ? 'All' : f === 'Follow-up Required' ? 'Follow-up' : f}
                  </button>
                ))}
              </div>
            </div>

            {/* list items */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-teal-500" />
                </div>
              ) : list.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-3">
                    <Calendar size={22} className="text-teal-300" />
                  </div>
                  <p className="text-sm text-slate-400">No meetings found</p>
                </div>
              ) : list.map(m => {
                const ms = S[m.status] ?? S['Pending'];
                const isSelected = selected?.id === m.id;
                return (
                  <button key={m.id} onClick={() => selectMeeting(m)}
                    className={`w-full text-left px-4 py-3.5 border-b border-slate-100 last:border-0 transition-all group relative ${
                      isSelected ? 'bg-teal-50/70 border-l-[3px] border-l-teal-500 pl-3.5' : 'hover:bg-slate-50/80'
                    }`}>
                    <div className="flex items-center gap-3">
                      {/* avatar */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white ${
                        m.status === 'Pending'   ? 'bg-amber-400'   :
                        m.status === 'Confirmed' ? 'bg-blue-500'    :
                        m.status === 'Completed' ? 'bg-emerald-500' :
                        m.status === 'Cancelled' ? 'bg-red-400'     : 'bg-violet-500'
                      }`}>
                        {initials(m.customerName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{m.customerName}</p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isNew(m.createdAt) && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">NEW</span>
                            )}
                            <span className={`w-2 h-2 rounded-full ${ms.dot}`} />
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{m.projectName}</p>
                        <div className="flex items-center gap-2.5 mt-1 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1"><Calendar size={9} />{fmtDate(m.preferredDate)}</span>
                          <span className="flex items-center gap-1"><Clock size={9} />{m.preferredTime}</span>
                        </div>
                      </div>
                      <ChevronRight size={13} className="text-slate-300 flex-shrink-0 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* refresh footer */}
            <div className="border-t border-slate-100 p-2 flex-shrink-0">
              <button onClick={loadMeetings} disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
          </div>

          {/* ── Right: detail ──────────────────────────────────────────── */}
          <div className={`flex-1 min-w-0 la-card overflow-hidden flex flex-col ${mobileDetail ? 'flex' : 'hidden md:flex'}`}>
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center">
                  <Calendar size={28} className="text-teal-300" />
                </div>
                <p className="font-semibold text-slate-700">Select a meeting</p>
                <p className="text-sm text-slate-400 max-w-xs">Choose a meeting from the list to view customer details and take action.</p>
              </div>
            ) : (
              <>
                {/* ── Detail header ─────────────────────────────────────── */}
                <div className={`px-6 py-5 flex-shrink-0 border-b ${meta!.headerBorder} ${meta!.headerBg}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* mobile back */}
                      <button onClick={() => setMobileDetail(false)} className="md:hidden p-1.5 rounded-lg bg-white/70 text-slate-600 mr-1 shrink-0">
                        <ArrowLeft size={14} />
                      </button>
                      {/* avatar */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white ${
                        selected.status === 'Pending'   ? 'bg-amber-400'   :
                        selected.status === 'Confirmed' ? 'bg-blue-500'    :
                        selected.status === 'Completed' ? 'bg-emerald-500' :
                        selected.status === 'Cancelled' ? 'bg-red-400'     : 'bg-violet-500'
                      }`}>
                        {initials(selected.customerName)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-800 leading-tight">{selected.customerName}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{selected.projectName}</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${meta!.pill}`}>
                      {meta!.label}
                    </span>
                  </div>

                  {/* info chips row */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {[
                      { icon: Calendar, text: fmtDate(selected.preferredDate) },
                      { icon: Clock,    text: selected.preferredTime },
                      { icon: Phone,    text: selected.customerPhone },
                      ...(selected.meetingType ? [{ icon: TYPE_ICON[selected.meetingType] ?? Building2, text: selected.meetingType }] : []),
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-1.5 bg-white/70 px-3 py-1.5 rounded-full border border-white/80 shadow-sm">
                        <Icon size={11} className={meta!.headerText} />
                        <span className={`text-xs font-medium ${meta!.headerText}`}>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Detail body ───────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40">

                  {/* contact */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact</p>
                    <a href={`tel:${selected.customerPhone}`}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/40 transition-all group">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                        <Phone size={14} className="text-teal-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Phone</p>
                        <p className="text-sm font-semibold text-slate-700 group-hover:text-teal-600 transition-colors">{selected.customerPhone}</p>
                      </div>
                    </a>
                  </div>

                  {/* meeting details grid */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Meeting Details</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { label: 'Requested Date', value: fmtDate(selected.preferredDate), icon: Calendar },
                        { label: 'Requested Time', value: selected.preferredTime,           icon: Clock },
                        ...(selected.confirmedDate ? [{ label: 'Confirmed Date', value: fmtDate(selected.confirmedDate), icon: CheckCircle2 }] : []),
                        ...(selected.confirmedTime ? [{ label: 'Confirmed Time', value: selected.confirmedTime,          icon: Clock }] : []),
                        { label: 'Project',  value: selected.projectName,            icon: Building2 },
                        { label: 'Type',     value: selected.meetingType ?? 'General', icon: TYPE_ICON[selected.meetingType ?? ''] ?? Building2 },
                        { label: 'Received', value: timeAgo(selected.createdAt),     icon: Clock },
                        { label: 'Status',   value: meta!.label,                     icon: CheckCircle2 },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="bg-slate-50 rounded-xl p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Icon size={11} className="text-teal-500" />
                            <p className="text-[10px] text-slate-400 font-medium">{label}</p>
                          </div>
                          <p className="text-sm font-semibold text-slate-700 leading-snug">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* customer notes */}
                  {selected.notes && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Customer Notes</p>
                      <div className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-3">
                        <MessageSquare size={14} className="text-teal-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-600 leading-relaxed">{selected.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* action panel — inline form */}
                  {actionType ? (
                    <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-800">
                          {{ confirm: 'Confirm Meeting', complete: 'Mark Completed', followup: 'Flag Follow-up', reject: 'Reject Request' }[actionType]}
                        </p>
                        <button onClick={() => setActionType(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                          <X size={14} />
                        </button>
                      </div>

                      {actionType === 'confirm' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-medium text-slate-400 mb-1.5 block">Confirmed Date</label>
                            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className={ic} />
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-slate-400 mb-1.5 block">Confirmed Time</label>
                            <input value={newTime} onChange={e => setNewTime(e.target.value)} placeholder="e.g. 11:00 AM" className={ic} />
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="text-[10px] font-medium text-slate-400 mb-1.5 block">Notes (optional)</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                          placeholder="Add a note for the customer…" className={`${ic} resize-none`} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setActionType(null)}
                          className="flex-1 py-2.5 rounded-xl text-xs font-medium border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
                          Cancel
                        </button>
                        <button onClick={handleAction} disabled={submitting}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white transition-opacity disabled:opacity-60 hover:opacity-90 shadow-sm ${actionType === 'reject' ? 'bg-red-500' : ''}`}
                          style={actionType !== 'reject' ? { background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' } : undefined}>
                          {submitting ? <Loader2 size={12} className="animate-spin" /> : null}
                          {submitting ? 'Saving…' : { confirm: 'Confirm', complete: 'Mark Done', followup: 'Flag', reject: 'Reject' }[actionType]}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* action buttons */
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Actions</p>
                      <div className="space-y-2">
                        {selected.status === 'Pending' && (<>
                          <button onClick={() => setActionType('confirm')}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-sm"
                            style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>
                            <CheckCircle2 size={16} /> Confirm Meeting
                          </button>
                          <button onClick={() => setActionType('reject')}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors">
                            <XCircle size={15} /> Reject Request
                          </button>
                        </>)}
                        {selected.status === 'Confirmed' && (
                          <button onClick={() => setActionType('complete')}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 transition-opacity shadow-sm">
                            <CheckCircle2 size={16} /> Mark as Completed
                          </button>
                        )}
                        {(selected.status === 'Confirmed' || selected.status === 'Completed') && (
                          <button onClick={() => setActionType('followup')}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-violet-700 border border-violet-200 bg-violet-50 hover:bg-violet-100 transition-colors">
                            <MessageSquare size={15} /> Flag Follow-up
                          </button>
                        )}
                        {(selected.status === 'Cancelled' || selected.status === 'Completed' || selected.status === 'Follow-up Required') && (
                          <p className="text-center py-3 text-xs text-slate-400">
                            No further actions available.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BuilderMeetings;