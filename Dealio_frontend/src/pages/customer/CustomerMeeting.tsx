import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatDate } from '@/lib/format';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useDealStore } from '@/stores/useDealStore';
import { customerApi, portalApi, builderApi } from '@/lib/api';
import { pushNotifTo } from '@/lib/crossNotify';
import { projects as mockProjects } from '@/data/projects';
import { Calendar, MapPin, Clock, Star, Building2, FileText, Users, Loader2, RefreshCw, X, ChevronRight, MessageSquare, CheckCircle2, Sparkles, Navigation } from 'lucide-react';
import { toast } from 'sonner';

interface ApiMeeting {
  id: number; builderId: number; projectId: number; projectName: string;
  preferredDate: string; preferredTime: string; confirmedDate?: string; confirmedTime?: string;
  status: string; notes?: string; builderNotes?: string;
}
interface ProjectSummary { id: number; name: string; city: string; }
type MeetingType = 'Site Visit' | 'Builder Meeting' | 'Document Review' | 'Interior Consult';

const TYPE_ICONS: Record<MeetingType, React.ElementType> = {
  'Site Visit': Building2, 'Builder Meeting': Users, 'Document Review': FileText, 'Interior Consult': Sparkles,
};
const STATUS_LABEL: Record<string, string> = {
  Pending: 'Pending Confirmation', Confirmed: 'Confirmed', Completed: 'Completed', Cancelled: 'Cancelled',
  PENDING: 'Pending Confirmation', CONFIRMED: 'Confirmed', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};
const STATUS_COLOR: Record<string, string> = {
  Pending: '#F59E0B', Confirmed: '#3B82F6', Completed: '#16A34A', Cancelled: '#DC2626',
  PENDING: '#F59E0B', CONFIRMED: '#3B82F6', COMPLETED: '#16A34A', CANCELLED: '#DC2626',
};
const TIME_SLOTS = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

const inp = 'w-full mt-1.5 px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all placeholder:text-muted-foreground';

interface CPProfile { id: number; fullName: string; phone?: string; email?: string; preferredCity?: string; }

const CustomerMeeting = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const phone = user?.phone ?? '';

  const [cps, setCPs] = useState<CPProfile[]>([]);
  const [meetings, setMeetings] = useState<ApiMeeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{ id: number; builderId: number; name: string; builderName?: string } | null>(null);
  const [meetingType, setMeetingType] = useState<MeetingType>('Site Visit');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<ApiMeeting | null>(null);
  const [ratingId, setRatingId] = useState<number | null>(null);
  const [rating, setRating] = useState(0);

  const fetchMeetings = useCallback(async () => {
    if (!phone) { setLoadingMeetings(false); return; }
    setLoadingMeetings(true);
    try { const data = await portalApi.getMyMeetings(phone); setMeetings((data as ApiMeeting[]) || []); }
    catch { toast.error('Could not load meetings'); }
    finally { setLoadingMeetings(false); }
  }, [phone]);

  useEffect(() => {
    fetchMeetings();
    customerApi.getAvailableCPs()
      .then(data => setCPs((data as CPProfile[]) || []))
      .catch(() => {});
    const fallback = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Pune', 'Delhi NCR', 'Chennai'];
    customerApi.getCities().then(d => setCities((d as string[])?.length ? d as string[] : fallback)).catch(() => setCities(fallback));
    customerApi.getProjectsByCity().then(data => {
      const apiData = (data as ProjectSummary[]) || [];
      setProjects(apiData.length ? apiData : mockProjects.map(p => ({ id: Number(p.id.replace('P', '')), name: p.name, city: p.city })));
    }).catch(() => setProjects(mockProjects.map(p => ({ id: Number(p.id.replace('P', '')), name: p.name, city: p.city }))));
    if (location.state?.projectId && location.state?.builderId) {
      setShowForm(true);
      setSelectedCity(location.state.city || '');
      setSelectedProject({ id: location.state.projectId, builderId: location.state.builderId, name: location.state.projectName || 'Selected Project', builderName: location.state.builderName || 'Builder' });
    }
  }, [fetchMeetings, location.state]);

  const handleCityChange = async (city: string) => {
    setSelectedCity(city); setSelectedProject(null); setLoadingProjects(true);
    try {
      const data = await customerApi.getProjectsByCity(city || undefined);
      const apiData = (data as ProjectSummary[]) || [];
      if (apiData.length) { setProjects(apiData); }
      else { setProjects(mockProjects.filter(p => !city || p.city === city).map(p => ({ id: Number(p.id.replace('P', '')), name: p.name, city: p.city }))); }
    } catch {
      setProjects(mockProjects.filter(p => !city || p.city === city).map(p => ({ id: Number(p.id.replace('P', '')), name: p.name, city: p.city })));
    } finally { setLoadingProjects(false); }
  };

  const handleProjectSelect = async (p: ProjectSummary) => {
    try {
      const detail = await customerApi.getProject(p.id) as { id: number; builderId: number; builderName?: string };
      setSelectedProject({ id: p.id, builderId: detail.builderId, name: p.name, builderName: detail.builderName || 'Builder' });
    } catch {
      const mock = mockProjects.find(m => Number(m.id.replace('P', '')) === p.id || m.name === p.name);
      setSelectedProject({ id: p.id, builderId: 1, name: p.name, builderName: mock?.builder || 'Builder' });
    }
  };

  const handleBookMeeting = async () => {
    if (!selectedProject || !selectedDate || !selectedTime) { toast.error('Please complete all required steps'); return; }
    setSubmitting(true);
    try {
      await portalApi.bookMeeting({ builderId: selectedProject.builderId, projectId: selectedProject.id, customerName: user?.name ?? '', customerPhone: phone, preferredDate: selectedDate, preferredTime: selectedTime, meetingType, notes: notes || undefined });
      useDealStore.getState().createMeetingRequest({ cpId: '', cpName: '', builderId: String(selectedProject.builderId), builderName: selectedProject.builderName || 'Builder', projectId: String(selectedProject.id), projectName: selectedProject.name, customerName: user?.name ?? 'Customer', customerPhone: phone, preferredDate: selectedDate, preferredTime: selectedTime, notes: notes || '' });
      toast.success('Meeting request sent! The builder will confirm shortly.');
      useNotificationStore.getState().addNotification({ type: 'info', title: 'Meeting Request Sent', message: `Your ${meetingType} request for ${selectedProject.name} on ${selectedDate} at ${selectedTime} has been sent.`, link: '/customer/meeting' });
      const builderId = builderApi.getCachedBuilderId() ?? String(selectedProject.builderId);
      pushNotifTo('builder', builderId, { type: 'info', title: '📅 New Meeting Request', message: `${user?.name ?? 'A customer'} has requested a ${meetingType} for ${selectedProject.name} on ${selectedDate} at ${selectedTime}.`, link: '/builder/meetings' });
      window.dispatchEvent(new CustomEvent('dealio:new-meeting'));
      setShowForm(false); setSelectedCity(''); setSelectedProject(null); setSelectedDate(''); setSelectedTime(''); setNotes('');
      fetchMeetings();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to book meeting');
    } finally { setSubmitting(false); }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold text-foreground">Meetings</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">Schedule and manage your property visits</p>
          </div>
          <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-all" style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}>
            <Calendar size={14} /> {showForm ? 'Cancel' : 'Schedule Meeting'}
          </button>
        </div>

        {/* ── Channel Partners ── */}
        {cps.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div>
              <h2 className="text-[14px] font-bold text-foreground flex items-center gap-2">
                <Users size={15} className="text-orange-500" /> Channel Partners
              </h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">Our trusted partners can guide you through your property journey.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cps.map(cp => (
                <div key={cp.id} className="flex items-center gap-3 p-3.5 bg-orange-50/60 rounded-xl border border-orange-100">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[13px] font-bold shrink-0"
                    style={{ background: 'linear-gradient(135deg, #E87722, #F97316)' }}
                  >
                    {cp.fullName?.[0]?.toUpperCase() ?? 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{cp.fullName}</p>
                    {cp.preferredCity && (
                      <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <MapPin size={9} /> {cp.preferredCity}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {cp.phone && (
                      <button
                        onClick={() => window.open(`https://wa.me/91${cp.phone}`, '_blank')}
                        className="p-2 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageSquare size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowForm(true);
                        setMeetingType('Builder Meeting');
                        setNotes(`I'd like to meet with CP: ${cp.fullName}`);
                        setTimeout(() => document.querySelector('select')?.scrollIntoView({ behavior: 'smooth' }), 100);
                      }}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white hover:opacity-90 transition-all"
                      style={{ background: 'linear-gradient(135deg, #E87722, #F97316)' }}
                    >
                      Arrange Meeting
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showForm && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <h2 className="text-[14px] font-bold text-foreground">New Meeting Request</h2>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Step 1: Filter by City</label>
              <select value={selectedCity} onChange={e => handleCityChange(e.target.value)} className={inp}>
                <option value="">— All cities —</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {selectedCity && (
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Step 2: Project</label>
                {loadingProjects ? (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> Loading…</div>
                ) : (
                  <select value={selectedProject?.id ?? ''} onChange={e => { const p = projects.find(p => p.id === Number(e.target.value)); if (p) handleProjectSelect(p); else setSelectedProject(null); }} className={inp}>
                    <option value="">{projects.length === 0 ? `No projects in ${selectedCity}` : '— Select a project —'}</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
              </div>
            )}

            {selectedProject && (
              <div>
                <label className="text-[12px] font-semibold text-foreground block mb-1.5">Step 3: Meeting Type</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['Site Visit', 'Builder Meeting', 'Document Review', 'Interior Consult'] as MeetingType[]).map(type => {
                    const Icon = TYPE_ICONS[type];
                    const active = meetingType === type;
                    return (
                      <button key={type} onClick={() => setMeetingType(type)}
                        className={`p-4 rounded-xl border text-center transition-all ${active ? 'border-transparent text-white' : 'border-border bg-card hover:bg-muted/40'}`}
                        style={active ? { background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' } : undefined}>
                        <Icon size={20} className={`mx-auto mb-2 ${active ? 'text-white' : 'text-muted-foreground'}`} />
                        <p className={`text-[11px] font-medium ${active ? 'text-white' : 'text-foreground'}`}>{type}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedProject && (
              <div>
                <label className="text-[12px] font-semibold text-foreground block mb-1.5">Step 4: Preferred Date</label>
                <input type="date" value={selectedDate} min={today} onChange={e => { setSelectedDate(e.target.value); setSelectedTime(''); }} className={inp} />
              </div>
            )}

            {selectedDate && (
              <div>
                <label className="text-[12px] font-semibold text-foreground block mb-1.5">Step 5: Preferred Time</label>
                <div className="flex flex-wrap gap-2">
                  {TIME_SLOTS.map(slot => (
                    <button key={slot} onClick={() => setSelectedTime(slot)}
                      className={`px-4 py-2 rounded-xl text-[12px] font-medium border transition-all ${selectedTime === slot ? 'text-white border-transparent' : 'bg-card border-border text-foreground hover:bg-muted/40'}`}
                      style={selectedTime === slot ? { background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' } : undefined}>{slot}</button>
                  ))}
                </div>
              </div>
            )}

            {selectedTime && (
              <div>
                <label className="text-[12px] font-semibold text-foreground block mb-1.5">Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className={`${inp} resize-none min-h-[60px]`} placeholder="Any special requests…" />
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={handleBookMeeting} disabled={!selectedProject || !selectedDate || !selectedTime || submitting}
                className="px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center gap-2 disabled:opacity-50 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}>
                {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : 'Send Request'}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl text-[13px] border border-border text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[14px] font-bold text-foreground">My Meetings</h2>
            <button onClick={fetchMeetings} disabled={loadingMeetings} className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              <RefreshCw size={12} className={loadingMeetings ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {loadingMeetings ? (
            <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Calendar size={22} className="text-muted-foreground" />
              </div>
              <p className="text-[13px] text-muted-foreground">No meetings yet. Schedule your first visit above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMeeting(m)}
                  className="w-full text-left bg-muted/30 hover:bg-muted/50 rounded-xl border border-border hover:border-ring/40 p-4 flex flex-wrap items-center gap-4 justify-between transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-card border border-border flex items-center justify-center shrink-0" style={{ color: '#0A7E8C' }}>
                      <Building2 size={18} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{m.projectName || 'Project Visit'}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(m.confirmedDate || m.preferredDate)}</span>
                        <span className="flex items-center gap-1"><Clock size={11} />{m.confirmedTime || m.preferredTime}</span>
                      </div>
                      {m.builderNotes && <p className="text-[11px] mt-1 font-medium" style={{ color: '#0A7E8C' }}>{m.builderNotes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={STATUS_LABEL[m.status] || m.status} color={STATUS_COLOR[m.status]} />
                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Meeting Detail Drawer ─────────────────────────────────── */}
      {selectedMeeting && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedMeeting(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-card shadow-2xl border-l border-border flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0A7E8C0d 0%, transparent 100%)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#0A7E8C15', color: '#0A7E8C' }}>
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{selectedMeeting.projectName || 'Project Visit'}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Meeting #{selectedMeeting.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMeeting(null)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-muted/20">

              {/* Status */}
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLOR[selectedMeeting.status] || '#94a3b8' }} />
                  <span className="text-[13px] font-semibold text-foreground">{STATUS_LABEL[selectedMeeting.status] || selectedMeeting.status}</span>
                </div>
              </div>

              {/* Schedule */}
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Schedule</p>
                <div className="flex items-center gap-2.5">
                  <Calendar size={14} className="shrink-0" style={{ color: '#0A7E8C' }} />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Preferred Date</p>
                    <p className="text-[13px] font-medium text-foreground">{formatDate(selectedMeeting.preferredDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock size={14} className="shrink-0" style={{ color: '#0A7E8C' }} />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Preferred Time</p>
                    <p className="text-[13px] font-medium text-foreground">{selectedMeeting.preferredTime}</p>
                  </div>
                </div>
                {selectedMeeting.confirmedDate && (
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Confirmed Date & Time</p>
                      <p className="text-[13px] font-semibold text-emerald-600">
                        {formatDate(selectedMeeting.confirmedDate)}{selectedMeeting.confirmedTime ? ` at ${selectedMeeting.confirmedTime}` : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedMeeting.notes && (
                <div className="bg-card rounded-xl border border-border p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">Your Notes</p>
                  <div className="flex items-start gap-2.5">
                    <MessageSquare size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-[13px] text-foreground leading-relaxed">{selectedMeeting.notes}</p>
                  </div>
                </div>
              )}

              {/* Builder notes */}
              {selectedMeeting.builderNotes && (
                <div className="rounded-xl p-4 border" style={{ backgroundColor: '#0A7E8C08', borderColor: '#0A7E8C25' }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: '#0A7E8C' }}>Message from Builder</p>
                  <div className="flex items-start gap-2.5">
                    <MessageSquare size={14} className="shrink-0 mt-0.5" style={{ color: '#0A7E8C' }} />
                    <p className="text-[13px] leading-relaxed text-foreground">{selectedMeeting.builderNotes}</p>
                  </div>
                </div>
              )}

              {/* Map / directions for confirmed meetings */}
              {(selectedMeeting.status === 'CONFIRMED' || selectedMeeting.status === 'Confirmed') && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 mb-3">Location & Directions</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedMeeting.projectName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/60 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                      <Navigation size={15} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-emerald-800 group-hover:text-emerald-600 transition-colors">Get Directions</p>
                      <p className="text-[11px] text-emerald-500 truncate mt-0.5">{selectedMeeting.projectName}</p>
                    </div>
                    <MapPin size={14} className="text-emerald-400 shrink-0" />
                  </a>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-5 py-4 bg-card flex-shrink-0">
              {selectedMeeting.status === 'COMPLETED' ? (
                <button
                  onClick={() => { setRatingId(selectedMeeting.id); setRating(0); setSelectedMeeting(null); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
                >
                  <Star size={14} /> Rate Your Experience
                </button>
              ) : (
                <button
                  onClick={() => setSelectedMeeting(null)}
                  className="w-full py-2.5 rounded-xl text-[13px] border border-border text-muted-foreground hover:bg-muted transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {ratingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setRatingId(null)} />
          <div className="relative bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl border border-border space-y-4 text-center">
            <h3 className="text-[15px] font-bold text-foreground">Rate Your Experience</h3>
            <div className="flex gap-2 justify-center">
              {Array.from({ length: 5 }, (_, i) => (
                <button key={i} onClick={() => setRating(i + 1)}>
                  <Star size={28} className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'} />
                </button>
              ))}
            </div>
            <button onClick={() => { toast.success('Thank you for your feedback!'); setRatingId(null); setRating(0); }} disabled={rating === 0}
              className="px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50 hover:opacity-90 w-full"
              style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}>
              Submit Rating
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerMeeting;