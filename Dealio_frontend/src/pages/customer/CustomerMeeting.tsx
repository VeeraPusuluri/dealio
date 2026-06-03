import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { customerApi, portalApi, builderApi } from '@/lib/api';
import { pushNotifTo } from '@/lib/crossNotify';
import {
  Calendar, MapPin, Clock, Star, Building2, FileText, Users, Loader2,
  RefreshCw, X, ChevronRight, MessageSquare, CheckCircle2, Sparkles,
  Navigation, Phone, Plus, UserCheck, User,
} from 'lucide-react';
import AddToCalendarButton from '@/components/shared/AddToCalendarButton';
import { toast } from 'sonner';
import DatePickerField from '@/components/shared/DatePickerField';
import { getAvailableSlotsForDate, ALL_SLOTS } from '@/lib/builderAvailability';

interface ApiMeeting {
  id: number; builderId: number; projectId: number; projectName: string;
  preferredDate: string; preferredTime: string;
  confirmedDate?: string | null; confirmedTime?: string | null;
  status: string; notes?: string | null; builderNotes?: string | null;
  meetingType?: string | null;
}
interface ProjectSummary { id: number; name: string; city: string; }
interface CPProfile { id: number; fullName: string; phone?: string; email?: string; preferredCity?: string; }
type MeetingType = 'Site Visit' | 'Builder Meeting' | 'Document Review' | 'Interior Consult';

const MEETING_TYPES: { type: MeetingType; Icon: React.ElementType; desc: string }[] = [
  { type: 'Site Visit',       Icon: Building2, desc: 'Tour the property in person' },
  { type: 'Builder Meeting',  Icon: Users,     desc: 'Meet the developer team' },
  { type: 'Document Review',  Icon: FileText,  desc: 'Go over agreements & docs' },
  { type: 'Interior Consult', Icon: Sparkles,  desc: 'Plan interiors & fitouts' },
];

// Fallback slots shown when no builder availability is configured
const DEFAULT_TIME_SLOTS = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

const STATUS_META: Record<string, { label: string; dot: string; pill: string; text: string }> = {
  Pending:   { label: 'Pending Confirmation', dot: 'bg-amber-400',   pill: 'bg-amber-50 border-amber-200',    text: 'text-amber-700' },
  PENDING:   { label: 'Pending Confirmation', dot: 'bg-amber-400',   pill: 'bg-amber-50 border-amber-200',    text: 'text-amber-700' },
  Confirmed: { label: 'Confirmed',            dot: 'bg-blue-500',    pill: 'bg-blue-50 border-blue-200',      text: 'text-blue-700' },
  CONFIRMED: { label: 'Confirmed',            dot: 'bg-blue-500',    pill: 'bg-blue-50 border-blue-200',      text: 'text-blue-700' },
  Completed: { label: 'Completed',            dot: 'bg-emerald-500', pill: 'bg-emerald-50 border-emerald-200',text: 'text-emerald-700' },
  COMPLETED: { label: 'Completed',            dot: 'bg-emerald-500', pill: 'bg-emerald-50 border-emerald-200',text: 'text-emerald-700' },
  Cancelled:            { label: 'Request Declined',   dot: 'bg-red-400',    pill: 'bg-red-50 border-red-200',          text: 'text-red-600'    },
  CANCELLED:            { label: 'Request Declined',   dot: 'bg-red-400',    pill: 'bg-red-50 border-red-200',          text: 'text-red-600'    },
  Rejected:             { label: 'Request Declined',   dot: 'bg-red-400',    pill: 'bg-red-50 border-red-200',          text: 'text-red-600'    },
  REJECTED:             { label: 'Request Declined',   dot: 'bg-red-400',    pill: 'bg-red-50 border-red-200',          text: 'text-red-600'    },
  Rescheduled:          { label: 'Rescheduled',        dot: 'bg-orange-400', pill: 'bg-orange-50 border-orange-200',    text: 'text-orange-700' },
  RESCHEDULED:          { label: 'Rescheduled',        dot: 'bg-orange-400', pill: 'bg-orange-50 border-orange-200',    text: 'text-orange-700' },
  'Follow-up Required': { label: 'Follow-up Required', dot: 'bg-violet-500', pill: 'bg-violet-50 border-violet-200',   text: 'text-violet-700' },
};

function fmtDate(s?: string | null) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const isToday    = d.toDateString() === new Date().toDateString();
  const isTomorrow = d.toDateString() === new Date(Date.now() + 86400000).toDateString();
  if (isToday)    return 'Today';
  if (isTomorrow) return 'Tomorrow';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const inp = 'w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/40 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all placeholder:text-muted-foreground';

export default function CustomerMeeting() {
  const { user } = useAuthStore();
  const location = useLocation();
  const phone = user?.phone ?? '';

  const [cps, setCPs]           = useState<CPProfile[]>([]);
  const [meetings, setMeetings] = useState<ApiMeeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [showForm, setShowForm] = useState(false);
  // 'meetings' tab by default so customer always lands on their list first
  const [activeTab, setActiveTab] = useState<'meetings' | 'book'>('meetings');

  // Booking form
  const [selectedCP, setSelectedCP]             = useState<CPProfile | null>(null);
  const [cities, setCities]                     = useState<string[]>([]);
  const [loadingCities, setLoadingCities]       = useState(true);
  const [selectedCity, setSelectedCity]         = useState('');
  const [projects, setProjects]                 = useState<ProjectSummary[]>([]);
  const [loadingProjects, setLoadingProjects]   = useState(false);
  const [selectedProject, setSelectedProject]  = useState<{ id: number; builderId: number; name: string; builderName?: string } | null>(null);
  const [meetingType, setMeetingType]           = useState<MeetingType>('Site Visit');
  const [selectedDate, setSelectedDate]         = useState('');
  const [selectedTime, setSelectedTime]         = useState('');
  const [notes, setNotes]                       = useState('');
  const [submitting, setSubmitting]             = useState(false);

  // Detail drawer
  const [selected, setSelected] = useState<ApiMeeting | null>(null);

  // Rating
  const [ratingId, setRatingId] = useState<number | null>(null);
  const [rating, setRating]     = useState(0);

  const fetchMeetings = useCallback(async () => {
    if (!phone) { setLoadingMeetings(false); return; }
    setLoadingMeetings(true);
    try {
      const data = await portalApi.getMyMeetings(phone);
      setMeetings((data as ApiMeeting[]) || []);
    } catch { /* ignore */ }
    finally { setLoadingMeetings(false); }
  }, [phone]);

  useEffect(() => {
    fetchMeetings();
    const fallback = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Pune', 'Delhi NCR', 'Chennai'];
    setLoadingCities(true);
    customerApi.getCities()
      .then(d => setCities((d as string[])?.length ? d as string[] : fallback))
      .catch(() => setCities(fallback))
      .finally(() => setLoadingCities(false));
    customerApi.getAvailableCPs()
      .then(d => setCPs((d as CPProfile[]) || []))
      .catch(() => {});
    if (location.state?.projectId && location.state?.builderId) {
      // Navigated from a project page → jump to booking tab with project pre-filled
      setActiveTab('book');
      setShowForm(true);
      setSelectedCity(location.state.city ?? '');
      setSelectedProject({
        id: location.state.projectId,
        builderId: location.state.builderId,
        name: location.state.projectName ?? 'Selected Project',
        builderName: location.state.builderName ?? 'Builder',
      });
    }
  }, [fetchMeetings, location.state]);

  const handleCityChange = async (city: string) => {
    setSelectedCity(city);
    setSelectedProject(null);
    setSelectedDate('');
    setSelectedTime('');
    if (!city) return;
    setLoadingProjects(true);
    try {
      const data = await customerApi.getProjectsByCity(city);
      setProjects((data as ProjectSummary[]) || []);
    } catch { setProjects([]); }
    finally { setLoadingProjects(false); }
  };

  const handleProjectSelect = async (p: ProjectSummary) => {
    try {
      const detail = await customerApi.getProject(p.id) as { id: number; builderId: number; builderName?: string };
      setSelectedProject({ id: p.id, builderId: detail.builderId, name: p.name, builderName: detail.builderName ?? 'Builder' });
    } catch {
      setSelectedProject({ id: p.id, builderId: 1, name: p.name });
    }
  };

  const openFormWithCP = (cp: CPProfile) => {
    setSelectedCP(cp);
    setShowForm(true);
    setTimeout(() => document.getElementById('meeting-form-top')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSubmit = async () => {
    if (!selectedProject || !selectedDate || !selectedTime) {
      toast.error('Please select a project, date and time');
      return;
    }
    setSubmitting(true);
    try {
      await portalApi.bookMeeting({
        builderId: selectedProject.builderId,
        projectId: selectedProject.id,
        customerName: user?.name ?? '',
        customerPhone: phone,
        preferredDate: selectedDate,
        preferredTime: selectedTime,
        meetingType,
        notes: notes || undefined,
        cpUserId: selectedCP?.id ?? null,
      });
      useNotificationStore.getState().addNotification({
        type: 'info', title: 'Meeting Request Sent',
        message: `Your ${meetingType} for ${selectedProject.name} on ${selectedDate} at ${selectedTime} has been sent.`,
        link: '/customer/meeting',
      });
      const builderId = builderApi.getCachedBuilderId() ?? String(selectedProject.builderId);
      pushNotifTo('builder', builderId, {
        type: 'info', title: '📅 New Meeting Request',
        message: `${user?.name ?? 'A customer'} requested a ${meetingType} for ${selectedProject.name} on ${selectedDate} at ${selectedTime}.`,
        link: '/builder/meetings',
      });
      // Also notify the CP if one is associated with this booking
      if (selectedCP?.id) {
        pushNotifTo('cp', String(selectedCP.id), {
          type: 'info', title: '📅 Meeting Request Created',
          message: `${user?.name ?? 'Your customer'} booked a ${meetingType} for ${selectedProject.name} on ${selectedDate} at ${selectedTime}.`,
          link: '/cp/meetings',
        });
      }
      window.dispatchEvent(new CustomEvent('dealio:new-meeting'));
      toast.success('Meeting request sent! The builder will confirm shortly.');
      closeForm();
      setActiveTab('meetings'); // switch to My Meetings so user sees their new request
      fetchMeetings();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to book meeting');
    } finally { setSubmitting(false); }
  };

  const closeForm = () => {
    setShowForm(false); setSelectedCP(null); setSelectedCity(''); setSelectedProject(null);
    setSelectedDate(''); setSelectedTime(''); setNotes('');
  };

  const today = new Date().toISOString().split('T')[0];
  const upcoming   = meetings.filter(m => ['Pending','PENDING','Confirmed','CONFIRMED','Rescheduled','RESCHEDULED'].includes(m.status));
  const completed  = meetings.filter(m => ['Completed','COMPLETED'].includes(m.status));
  const cancelled  = meetings.filter(m => ['Cancelled','CANCELLED','Rejected','REJECTED'].includes(m.status));

  // Steps completed flags
  const step1Done = !!selectedCity;
  const step2Done = !!selectedProject;
  const step3Done = !!selectedDate && !!selectedTime;

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold text-foreground">Meetings</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">Track your site visits and book new appointments</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          <button onClick={() => setActiveTab('meetings')}
            className={`flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-all ${
              activeTab === 'meetings'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            <Calendar size={14} />
            My Meetings
            {meetings.length > 0 && (
              <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-600 text-white">
                {meetings.length}
              </span>
            )}
          </button>
          <button onClick={() => { setActiveTab('book'); setShowForm(true); }}
            className={`flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-all ${
              activeTab === 'book'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            <Plus size={14} /> Book a Visit
          </button>
        </div>

        {/* Stats strip — shown on My Meetings tab */}
        {activeTab === 'meetings' && meetings.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Upcoming',  value: upcoming.length,  dot: 'bg-blue-500' },
              { label: 'Completed', value: completed.length, dot: 'bg-emerald-500' },
              { label: 'Rejected',  value: cancelled.length, dot: 'bg-red-400' },
              { label: 'Total',     value: meetings.length,  dot: 'bg-slate-400' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                  <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ══ BOOK A VISIT TAB ══════════════════════════════════════════════ */}
        {activeTab === 'book' && (
        <div className="space-y-4">

        {/* ── Channel Partners ── */}
        {cps.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-orange-500" />
              <h2 className="text-[13px] font-bold text-foreground">Channel Partners</h2>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">
              Book a meeting through a partner — they'll guide you throughout your buying journey
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {cps.map(cp => {
                const isSelected = selectedCP?.id === cp.id;
                return (
                  <div key={cp.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                      isSelected ? 'border-teal-400 bg-teal-50' : 'border-border bg-orange-50/30 hover:bg-orange-50/60'
                    }`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[13px] font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg,#E87722,#F97316)' }}>
                      {cp.fullName?.[0]?.toUpperCase() ?? 'C'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-foreground truncate">{cp.fullName}</p>
                      {cp.preferredCity && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin size={9} /> {cp.preferredCity}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {cp.phone && (
                        <>
                          <a href={`tel:${cp.phone}`}
                            className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors"
                            title="Call">
                            <Phone size={13} />
                          </a>
                          <button onClick={() => window.open(`https://wa.me/91${cp.phone?.replace(/\D/g,'')}`, '_blank')}
                            className="w-8 h-8 rounded-lg bg-[#25D366]/10 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                            title="WhatsApp">
                            <MessageSquare size={13} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openFormWithCP(cp)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                          isSelected
                            ? 'bg-teal-600 text-white'
                            : 'text-white hover:opacity-90'
                        }`}
                        style={isSelected ? undefined : { background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
                        {isSelected ? <><UserCheck size={11} /> Selected</> : <><Calendar size={11} /> Book</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Booking Form ── */}
        {showForm && (
          <div id="meeting-form-top" className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Form header */}
            <div className="px-6 pt-5 pb-4 border-b border-border"
              style={{ background: 'linear-gradient(135deg,#0A7E8C08 0%,transparent 100%)' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-bold text-foreground">New Meeting Request</h2>
                <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                  <X size={14} />
                </button>
              </div>

              {/* Selected CP badge */}
              {selectedCP && (
                <div className="mt-3 flex items-center gap-2.5 p-2.5 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                    style={{ background: 'linear-gradient(135deg,#E87722,#F97316)' }}>
                    {selectedCP.fullName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-orange-800">With: {selectedCP.fullName}</p>
                    {selectedCP.preferredCity && <p className="text-[10px] text-orange-500">{selectedCP.preferredCity}</p>}
                  </div>
                  <button onClick={() => setSelectedCP(null)} className="text-orange-300 hover:text-orange-500">
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* Step progress */}
              <div className="flex items-center gap-1.5 mt-3">
                {[
                  { label: 'City',    done: step1Done },
                  { label: 'Project', done: step2Done },
                  { label: 'Date & Time', done: step3Done },
                ].map(({ label, done }, i) => (
                  <div key={label} className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 transition-all ${
                      done ? 'bg-teal-600 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {done ? <CheckCircle2 size={11} /> : i + 1}
                    </div>
                    <span className={`text-[10px] truncate ${done ? 'text-teal-700 font-semibold' : 'text-muted-foreground'}`}>{label}</span>
                    {i < 2 && <div className="h-px flex-1 bg-border min-w-[6px]" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-6">

              {/* Step 1: City */}
              <div>
                <label className="text-[12px] font-semibold text-foreground block mb-2.5">
                  <span className="text-teal-600 mr-1.5">1.</span> Select City
                </label>
                {loadingCities ? (
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-3">
                    <Loader2 size={14} className="animate-spin" /> Loading cities…
                  </div>
                ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {cities.map(city => (
                    <button key={city} onClick={() => handleCityChange(city)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-[12px] font-medium transition-all ${
                        selectedCity === city
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-border hover:border-teal-200 text-foreground hover:bg-muted/40'
                      }`}>
                      <MapPin size={12} className={selectedCity === city ? 'text-teal-500' : 'text-muted-foreground'} />
                      {city}
                    </button>
                  ))}
                </div>
                )}
              </div>

              {/* Step 2: Project */}
              {selectedCity && (
                <div>
                  <label className="text-[12px] font-semibold text-foreground block mb-2.5">
                    <span className="text-teal-600 mr-1.5">2.</span> Select Project in {selectedCity}
                  </label>
                  {loadingProjects ? (
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-3">
                      <Loader2 size={14} className="animate-spin" /> Loading projects…
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
                      <p className="text-[12px] text-muted-foreground">No projects listed in {selectedCity} yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {projects.map(p => (
                        <button key={p.id} onClick={() => handleProjectSelect(p)}
                          className={`text-left p-3.5 rounded-xl border transition-all ${
                            selectedProject?.id === p.id
                              ? 'border-teal-500 bg-teal-50'
                              : 'border-border hover:border-teal-200 hover:bg-muted/30'
                          }`}>
                          <p className="text-[12px] font-semibold text-foreground">{p.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <MapPin size={9} /> {p.city}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Steps 3 onwards — only after project selected */}
              {selectedProject && (
                <>
                  {/* Selected project pill */}
                  <div className="flex items-center gap-2.5 p-3 bg-teal-50 rounded-xl border border-teal-100">
                    <Building2 size={14} className="text-teal-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-teal-800 truncate">{selectedProject.name}</p>
                      {selectedProject.builderName && (
                        <p className="text-[11px] text-teal-600">by {selectedProject.builderName}</p>
                      )}
                    </div>
                    <button onClick={() => { setSelectedProject(null); setSelectedDate(''); setSelectedTime(''); }}
                      className="text-teal-300 hover:text-teal-600 transition-colors">
                      <X size={13} />
                    </button>
                  </div>

                  {/* Meeting type */}
                  <div>
                    <label className="text-[12px] font-semibold text-foreground block mb-2.5">
                      <span className="text-teal-600 mr-1.5">3.</span> Meeting Type
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {MEETING_TYPES.map(({ type, Icon, desc }) => {
                        const active = meetingType === type;
                        return (
                          <button key={type} onClick={() => setMeetingType(type)}
                            className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                              active ? 'border-teal-500 bg-teal-50' : 'border-border hover:border-teal-200 hover:bg-muted/30'
                            }`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              active ? 'bg-teal-100' : 'bg-muted'
                            }`}>
                              <Icon size={15} className={active ? 'text-teal-600' : 'text-muted-foreground'} />
                            </div>
                            <div>
                              <p className={`text-[12px] font-semibold ${active ? 'text-teal-700' : 'text-foreground'}`}>{type}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="text-[12px] font-semibold text-foreground block mb-2.5">
                      <span className="text-teal-600 mr-1.5">4.</span> Preferred Date
                    </label>
                    <DatePickerField
                      value={selectedDate}
                      onChange={v => { setSelectedDate(v); setSelectedTime(''); }}
                      minDate={today}
                    />
                  </div>

                  {/* Time slots — filtered by builder's availability */}
                  {selectedDate && (() => {
                    const availableSlots = selectedProject
                      ? getAvailableSlotsForDate(String(selectedProject.builderId), selectedDate)
                      : [];
                    const displaySlots = availableSlots.length > 0
                      ? ALL_SLOTS.filter(s => availableSlots.includes(s))
                      : DEFAULT_TIME_SLOTS;
                    return (
                    <div>
                      <label className="text-[12px] font-semibold text-foreground block mb-2.5">
                        <span className="text-teal-600 mr-1.5">5.</span> Preferred Time
                        {availableSlots.length > 0 && (
                          <span className="ml-2 text-[10px] text-teal-600 font-normal">Builder available slots</span>
                        )}
                      </label>
                      {displaySlots.length === 0 ? (
                        <p className="text-[12px] text-muted-foreground py-2">No available slots on this day — please choose another date.</p>
                      ) : (
                      <div className="flex flex-wrap gap-2">
                        {displaySlots.map(slot => (
                          <button key={slot} onClick={() => setSelectedTime(slot)}
                            className={`px-3.5 py-2 rounded-xl text-[12px] font-medium border transition-all flex items-center gap-1.5 ${
                              selectedTime === slot
                                ? 'text-white border-transparent'
                                : 'bg-card border-border text-foreground hover:bg-muted/40'
                            }`}
                            style={selectedTime === slot ? { background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' } : undefined}>
                            <Clock size={11} /> {slot}
                          </button>
                        ))}
                      </div>
                      )}
                    </div>
                  );
                  })()}

                  {/* Notes */}
                  {selectedTime && (
                    <div>
                      <label className="text-[12px] font-semibold text-foreground block mb-2.5">
                        Notes <span className="text-muted-foreground font-normal text-[11px]">(optional)</span>
                      </label>
                      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                        placeholder="Any questions for the builder, accessibility needs…"
                        className={`${inp} resize-none`} />
                    </div>
                  )}

                  {/* Summary + Submit */}
                  {selectedDate && selectedTime && (
                    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Booking Summary</p>
                      <div className="space-y-2">
                        {selectedCP && (
                          <div className="flex items-center gap-2 text-[12px]">
                            <User size={12} className="text-orange-500" />
                            <span className="text-foreground">With <strong>{selectedCP.fullName}</strong></span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[12px]">
                          <Building2 size={12} className="text-teal-600" />
                          <span className="font-medium text-foreground">{selectedProject.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px]">
                          <Sparkles size={12} className="text-teal-600" />
                          <span className="text-foreground">{meetingType}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px]">
                          <Calendar size={12} className="text-teal-600" />
                          <span className="text-foreground">{fmtDate(selectedDate)} · {selectedTime}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={handleSubmit} disabled={submitting}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-all"
                          style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
                          {submitting
                            ? <><Loader2 size={13} className="animate-spin" /> Sending…</>
                            : <><Calendar size={13} /> Confirm Request</>}
                        </button>
                        <button onClick={closeForm}
                          className="px-4 py-2.5 rounded-xl text-[12px] border border-border text-muted-foreground hover:bg-muted transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        </div>
        )}

        {/* ══ MY MEETINGS TAB ═══════════════════════════════════════════════ */}
        {activeTab === 'meetings' && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-[13px] font-bold text-foreground">My Meetings</h2>
            <button onClick={fetchMeetings} disabled={loadingMeetings}
              className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw size={12} className={loadingMeetings ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {loadingMeetings ? (
            <div className="flex justify-center py-14">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Calendar size={24} className="text-muted-foreground" />
              </div>
              <p className="text-[14px] font-semibold text-foreground">No visits scheduled yet</p>
              <p className="text-[12px] text-muted-foreground mt-1.5 max-w-xs">
                Book a site visit above to start your property journey. The builder will confirm your slot.
              </p>
              <button onClick={() => { setActiveTab('book'); setShowForm(true); }}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
                <Plus size={13} /> Book Your First Visit
              </button>
            </div>
          ) : (
            <div>
              {upcoming.length > 0 && (
                <>
                  <div className="px-5 py-2.5 bg-blue-50/60 border-b border-border">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                      Upcoming · {upcoming.length}
                    </p>
                  </div>
                  {upcoming.map((m, i) => (
                    <MeetingRow key={m.id} meeting={m}
                      isLast={i === upcoming.length - 1 && completed.length === 0}
                      onClick={() => setSelected(m)} />
                  ))}
                </>
              )}
              {completed.length > 0 && (
                <>
                  <div className="px-5 py-2.5 bg-muted/40 border-b border-border">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      Completed · {completed.length}
                    </p>
                  </div>
                  {completed.map((m, i) => (
                    <MeetingRow key={m.id} meeting={m}
                      isLast={i === completed.length - 1 && cancelled.length === 0}
                      onClick={() => setSelected(m)} />
                  ))}
                </>
              )}
              {cancelled.length > 0 && (
                <>
                  <div className="px-5 py-2.5 bg-red-50/60 border-b border-border">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-red-500">
                      Rejected / Cancelled · {cancelled.length}
                    </p>
                  </div>
                  {cancelled.map((m, i) => (
                    <MeetingRow key={m.id} meeting={m}
                      isLast={i === cancelled.length - 1}
                      onClick={() => setSelected(m)} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        )}

      </div>

      {/* ── Meeting Detail Drawer ── */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-card shadow-2xl border-l border-border flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#0A7E8C0d 0%,transparent 100%)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#0A7E8C15', color: '#0A7E8C' }}>
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{selected.projectName ?? 'Property Visit'}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{selected.meetingType ?? 'Site Visit'}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)}
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-muted/20">
              {/* Status */}
              {(() => {
                const meta = STATUS_META[selected.status] ?? { label: selected.status, dot: 'bg-muted', pill: 'bg-muted border-border', text: 'text-foreground' };
                return (
                  <div className="bg-card rounded-xl border border-border p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2.5">Status</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${meta.pill}`}>
                      <div className={`w-2 h-2 rounded-full ${meta.dot}`} />
                      <span className={`text-[12px] font-semibold ${meta.text}`}>{meta.label}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Schedule */}
              <div className="bg-card rounded-xl border border-border p-4 space-y-3.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Schedule</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Calendar size={13} style={{ color: '#0A7E8C' }} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Requested</p>
                    <p className="text-[13px] font-medium text-foreground">
                      {fmtDate(selected.preferredDate)} · {selected.preferredTime}
                    </p>
                  </div>
                </div>
                {selected.confirmedDate && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Confirmed by Builder</p>
                      <p className="text-[13px] font-semibold text-emerald-600">
                        {fmtDate(selected.confirmedDate)}{selected.confirmedTime ? ` · ${selected.confirmedTime}` : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Builder message */}
              {selected.builderNotes && (
                <div className="rounded-xl p-4 border" style={{ backgroundColor: '#0A7E8C08', borderColor: '#0A7E8C25' }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2.5" style={{ color: '#0A7E8C' }}>
                    Message from Builder
                  </p>
                  <div className="flex items-start gap-2.5">
                    <MessageSquare size={13} className="shrink-0 mt-0.5" style={{ color: '#0A7E8C' }} />
                    <p className="text-[13px] text-foreground leading-relaxed">{selected.builderNotes}</p>
                  </div>
                </div>
              )}

              {selected.notes && (
                <div className="bg-card rounded-xl border border-border p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2.5">Your Notes</p>
                  <p className="text-[13px] text-foreground leading-relaxed">{selected.notes}</p>
                </div>
              )}

              {['Confirmed','CONFIRMED','Rescheduled','RESCHEDULED'].includes(selected.status) && (
                <>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.projectName)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100 hover:border-emerald-300 transition-all group">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                      <Navigation size={16} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-emerald-800 group-hover:text-emerald-600">Get Directions</p>
                      <p className="text-[11px] text-emerald-500 truncate mt-0.5">{selected.projectName}</p>
                    </div>
                    <MapPin size={14} className="text-emerald-400 shrink-0" />
                  </a>
                  <AddToCalendarButton opts={{
                    id: selected.id,
                    projectName: selected.projectName,
                    date: selected.confirmedDate ?? selected.preferredDate,
                    time: selected.confirmedTime ?? selected.preferredTime,
                    summary: `Site Visit — ${selected.projectName}`,
                    description: `Your site visit at ${selected.projectName}`,
                  }} />
                </>
              )}
            </div>

            <div className="border-t border-border px-5 py-4 bg-card flex-shrink-0 space-y-2">
              {['Cancelled','CANCELLED','Rejected','REJECTED'].includes(selected.status) ? (
                <>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
                    <X size={13} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-red-700 leading-relaxed">
                      Your meeting request was declined by the builder. You can book a new slot on a different date.
                    </p>
                  </div>
                  <button
                    onClick={() => { setSelected(null); setActiveTab('book'); setShowForm(true); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
                    <Plus size={14} /> Book a New Slot
                  </button>
                </>
              ) : ['Completed','COMPLETED'].includes(selected.status) ? (
                <button onClick={() => { setRatingId(selected.id); setRating(0); setSelected(null); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}>
                  <Star size={14} /> Rate Your Experience
                </button>
              ) : (
                <button onClick={() => setSelected(null)}
                  className="w-full py-2.5 rounded-xl text-[13px] border border-border text-muted-foreground hover:bg-muted transition-colors">
                  Close
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Rating modal */}
      {ratingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setRatingId(null)} />
          <div className="relative bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-border space-y-4 text-center mx-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto">
              <Star size={22} className="text-amber-500" />
            </div>
            <h3 className="text-[15px] font-bold text-foreground">How was your experience?</h3>
            <p className="text-[12px] text-muted-foreground">Your feedback helps builders improve site visits.</p>
            <div className="flex gap-2 justify-center py-1">
              {Array.from({ length: 5 }, (_, i) => (
                <button key={i} onClick={() => setRating(i + 1)}>
                  <Star size={30} className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'} />
                </button>
              ))}
            </div>
            <button onClick={() => { toast.success('Thank you for your feedback!'); setRatingId(null); setRating(0); }}
              disabled={rating === 0}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
              Submit Rating
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function MeetingRow({ meeting, isLast, onClick }: { meeting: ApiMeeting; isLast: boolean; onClick: () => void }) {
  const meta = STATUS_META[meeting.status] ?? { label: meeting.status, dot: 'bg-muted', pill: 'bg-muted border-border', text: 'text-foreground' };
  const displayDate = meeting.confirmedDate ?? meeting.preferredDate;
  const displayTime = meeting.confirmedTime ?? meeting.preferredTime;
  return (
    <button onClick={onClick}
      className={`w-full text-left px-5 py-4 hover:bg-muted/20 transition-colors group ${!isLast ? 'border-b border-border' : ''}`}>
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shrink-0" style={{ color: '#0A7E8C' }}>
          <Building2 size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13px] font-semibold text-foreground truncate">{meeting.projectName ?? 'Property Visit'}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${meta.pill} ${meta.text}`}>
              {meta.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar size={10} />{fmtDate(displayDate)}</span>
            <span className="flex items-center gap-1"><Clock size={10} />{displayTime}</span>
            {meeting.meetingType && <span className="hidden sm:inline">{meeting.meetingType}</span>}
          </div>
          {meeting.builderNotes && (
            <p className="text-[11px] mt-1.5 font-medium truncate" style={{ color: '#0A7E8C' }}>
              Builder: {meeting.builderNotes}
            </p>
          )}
        </div>
        <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
      </div>
    </button>
  );
}
