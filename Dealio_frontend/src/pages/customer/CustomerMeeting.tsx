import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { customerApi, portalApi, builderApi } from '@/lib/api';
import { pushNotifTo } from '@/lib/crossNotify';

const RATING_LABEL = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
import {
  Calendar, MapPin, Clock, Star, Building2, FileText, Users, Loader2,
  RefreshCw, X, ChevronRight, MessageSquare, CheckCircle2, Sparkles,
  Navigation, Phone, Plus, UserCheck, User, Bookmark, ExternalLink,
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
  customerRating?: number | null;
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
  const [bookedSlots, setBookedSlots]           = useState<string[]>([]);

  // Detail drawer
  const [selected, setSelected] = useState<ApiMeeting | null>(null);

  // Rating
  const [ratingId, setRatingId] = useState<number | null>(null);
  const [rating, setRating]     = useState(0);

  // Unit shortlist picker
  type UnitRow = { id: string; tower: string; floor: number; unit: number; bhk: string; areaSqft?: number; price?: number; status: string; facing?: string; };
  type FloorPlanDoc = { id: number; fileName: string; fileUrl: string; docType: string; };
  const [shortlistMeeting, setShortlistMeeting] = useState<ApiMeeting | null>(null);
  const [unitPickerUnits, setUnitPickerUnits]   = useState<UnitRow[]>([]);
  const [floorPlanDocs, setFloorPlanDocs]       = useState<FloorPlanDoc[]>([]);
  const [unitPickerLoading, setUnitPickerLoading] = useState(false);
  const [selectedUnit, setSelectedUnit]           = useState<UnitRow | null>(null);
  const [submittingShortlist, setSubmittingShortlist] = useState(false);

  // Post-visit shortlist status (for the selected meeting)
  type ShortlistStatus = { id: number; unitId: string; status: 'Pending' | 'Accepted' | 'SuggestOther'; builderNote: string | null; dealStatus?: string | null; };
  const [postVisitShortlist, setPostVisitShortlist] = useState<ShortlistStatus | null | 'none'>('none');
  const [loadingPostVisit, setLoadingPostVisit] = useState(false);

  const openUnitPicker = async (meeting: ApiMeeting) => {
    setShortlistMeeting(meeting);
    setSelectedUnit(null);
    setFloorPlanDocs([]);
    setUnitPickerLoading(true);
    try {
      const [project, docs] = await Promise.all([
        builderApi.getProject(meeting.builderId, meeting.projectId) as Promise<{ unitMatrix?: UnitRow[]; totalUnits?: number; availableUnits?: number; configurations?: string[]; towers?: number; floorsPerTower?: number; }>,
        builderApi.getDocuments(meeting.builderId, meeting.projectId).catch(() => []) as Promise<FloorPlanDoc[]>,
      ]);
      const plans = (Array.isArray(docs) ? docs : []).filter(d => d.docType === 'Floor Plan');
      setFloorPlanDocs(plans);
      if (project?.unitMatrix && Array.isArray(project.unitMatrix) && project.unitMatrix.length > 0) {
        setUnitPickerUnits(project.unitMatrix as UnitRow[]);
      } else {
        // Generate synthetic units from counts
        const total = project?.totalUnits ?? 0;
        const configs = project?.configurations ?? ['2 BHK'];
        const floors = project?.floorsPerTower ?? Math.max(1, Math.min(Math.ceil(total / 4), 15));
        const perFloor = Math.max(1, Math.ceil(total / floors));
        const synthetic: UnitRow[] = [];
        for (let f = 1; f <= floors && synthetic.length < total; f++) {
          for (let u = 1; u <= perFloor && synthetic.length < total; u++) {
            synthetic.push({ id: `A-${f}0${u}`, tower: 'A', floor: f, unit: u, bhk: configs[(u - 1) % configs.length], status: 'Available' });
          }
        }
        setUnitPickerUnits(synthetic);
      }
    } catch { toast.error('Could not load units'); setShortlistMeeting(null); }
    finally { setUnitPickerLoading(false); }
  };

  const handleShortlistSubmit = async () => {
    if (!shortlistMeeting || !selectedUnit || !phone) return;
    setSubmittingShortlist(true);
    try {
      await portalApi.shortlistUnit({
        customerPhone: phone,
        builderId: shortlistMeeting.builderId,
        projectId: shortlistMeeting.projectId,
        unitId: selectedUnit.id,
        unitDetails: selectedUnit,
      });
      toast.success(`Unit ${selectedUnit.id} shortlisted! The builder will review it.`);
      setPostVisitShortlist({ id: Date.now(), unitId: selectedUnit.id, status: 'Pending', builderNote: null, dealStatus: null });
      setShortlistMeeting(null);
      setSelectedUnit(null);
    } catch { toast.error('Failed to shortlist unit'); }
    finally { setSubmittingShortlist(false); }
  };

  const openMeeting = useCallback(async (m: ApiMeeting) => {
    setSelected(m);
    setPostVisitShortlist('none');
    if (!['Completed', 'COMPLETED'].includes(m.status) || !phone) return;
    setLoadingPostVisit(true);
    try {
      const [shortlists, deals] = await Promise.allSettled([
        portalApi.getMyShortlists(phone),
        portalApi.getMyDeals(phone),
      ]);
      const sl = shortlists.status === 'fulfilled'
        ? (shortlists.value as Array<{ projectId: number; unitId: string; status: string; builderNote: string | null; id: number }>)
            .find(s => s.projectId === m.projectId)
        : undefined;
      if (sl) {
        const dealStatus = deals.status === 'fulfilled'
          ? (deals.value as Array<{ projectId: number; dealStatus: string }>)
              .find(d => d.projectId === m.projectId)?.dealStatus ?? null
          : null;
        setPostVisitShortlist({ id: sl.id, unitId: sl.unitId, status: sl.status as 'Pending' | 'Accepted' | 'SuggestOther', builderNote: sl.builderNote, dealStatus });
      } else {
        setPostVisitShortlist(null);
      }
    } catch { setPostVisitShortlist(null); }
    finally { setLoadingPostVisit(false); }
  }, [phone]);

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

  // Fetch already-confirmed slots whenever date + project are both selected
  useEffect(() => {
    if (!selectedProject || !selectedDate) { setBookedSlots([]); return; }
    portalApi.getBookedSlots(selectedProject.builderId, selectedDate)
      .then(slots => setBookedSlots(slots ?? []))
      .catch(() => setBookedSlots([]));
  }, [selectedProject?.builderId, selectedDate]);

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
                        {displaySlots.map(slot => {
                          const isBooked   = bookedSlots.includes(slot);
                          const isSelected = selectedTime === slot;
                          return (
                          <button key={slot}
                            onClick={() => !isBooked && setSelectedTime(slot)}
                            disabled={isBooked}
                            title={isBooked ? 'Already booked — choose another time' : undefined}
                            className={`px-3.5 py-2 rounded-xl text-[12px] font-medium border transition-all flex items-center gap-1.5 ${
                              isBooked
                                ? 'bg-muted border-border text-muted-foreground opacity-50 cursor-not-allowed line-through'
                                : isSelected
                                  ? 'text-white border-transparent'
                                  : 'bg-card border-border text-foreground hover:bg-muted/40'
                            }`}
                            style={isSelected && !isBooked ? { background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' } : undefined}>
                            <Clock size={11} /> {slot}{isBooked ? ' · Full' : ''}
                          </button>
                          );
                        })}
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
                      onClick={() => openMeeting(m)} />
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
                      onClick={() => openMeeting(m)} />
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
                      onClick={() => openMeeting(m)} />
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

              {/* ── Post-visit flow tracker ── */}
              {['Completed','COMPLETED'].includes(selected.status) && (() => {
                const sl = postVisitShortlist;
                const dealStage = typeof sl === 'object' && sl !== null ? sl.dealStatus?.toLowerCase() : null;
                const isNegotiation = dealStage === 'negotiation';
                const isAgreement   = dealStage === 'agreement';
                const isBooked      = dealStage === 'booked' || dealStage === 'loan sanctioned' || dealStage === 'closed';

                type StepState = 'done' | 'active' | 'upcoming';
                const steps: { icon: React.ElementType; label: string; sub: string; state: StepState }[] = [
                  {
                    icon: CheckCircle2,
                    label: 'Site Visit',
                    sub: fmtDate(selected.confirmedDate ?? selected.preferredDate) ?? 'Completed',
                    state: 'done',
                  },
                  {
                    icon: Bookmark,
                    label: 'Unit Shortlisted',
                    sub: typeof sl === 'object' && sl !== null
                      ? sl.status === 'Accepted' ? `Unit ${sl.unitId} — accepted`
                      : sl.status === 'SuggestOther' ? `Unit ${sl.unitId} — see note`
                      : `Unit ${sl.unitId} — awaiting review`
                      : sl === null ? 'Not shortlisted yet' : '…',
                    state: typeof sl === 'object' && sl !== null ? (sl.status === 'Pending' ? 'active' : 'done') : 'active',
                  },
                  {
                    icon: MessageSquare,
                    label: 'Negotiation',
                    sub: isNegotiation ? 'In progress' : isAgreement || isBooked ? 'Completed' : 'Waiting for unit acceptance',
                    state: isNegotiation ? 'active' : isAgreement || isBooked ? 'done' : 'upcoming',
                  },
                  {
                    icon: CheckCircle,
                    label: 'Agreement',
                    sub: isAgreement ? 'Confirm acceptance in Journey' : isBooked ? 'Confirmed' : 'Awaiting negotiation',
                    state: isAgreement ? 'active' : isBooked ? 'done' : 'upcoming',
                  },
                ];

                const stepColors: Record<StepState, { ring: string; icon: string; dot: string }> = {
                  done:     { ring: 'border-emerald-300 bg-emerald-50',  icon: 'text-emerald-600', dot: 'bg-emerald-500' },
                  active:   { ring: 'border-[#0A7E8C] bg-teal-50/60',   icon: 'text-[#0A7E8C]',  dot: 'bg-[#0A7E8C]' },
                  upcoming: { ring: 'border-border bg-muted/20',         icon: 'text-muted-foreground', dot: 'bg-muted-foreground/30' },
                };

                return (
                  <div className="space-y-3">
                    {/* Step tracker */}
                    <div className="bg-card rounded-2xl border border-border p-4 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3">Your Journey — {selected.projectName}</p>
                      {loadingPostVisit ? (
                        <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
                      ) : (
                        <div className="space-y-2">
                          {steps.map((step, i) => {
                            const c = stepColors[step.state];
                            const Icon = step.icon;
                            return (
                              <div key={step.label} className="flex items-start gap-3">
                                {/* Connector column */}
                                <div className="flex flex-col items-center shrink-0" style={{ width: 32 }}>
                                  <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 ${c.ring}`}>
                                    <Icon size={14} className={c.icon} />
                                  </div>
                                  {i < steps.length - 1 && (
                                    <div className={`w-0.5 flex-1 mt-1 mb-0 min-h-[16px] rounded-full ${step.state === 'done' ? 'bg-emerald-300' : 'bg-border'}`} />
                                  )}
                                </div>
                                {/* Text */}
                                <div className="flex-1 pb-3 min-w-0">
                                  <p className={`text-[12px] font-semibold leading-tight ${step.state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground'}`}>{step.label}</p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{step.sub}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Builder's note when SuggestOther */}
                    {typeof sl === 'object' && sl !== null && sl.status === 'SuggestOther' && (
                      <div className="rounded-xl p-3.5 border border-blue-100 bg-blue-50 space-y-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare size={13} className="text-blue-600 shrink-0" />
                          <p className="text-[11px] font-bold text-blue-700">Builder's Suggestion</p>
                        </div>
                        <p className="text-[12px] text-blue-800 leading-relaxed">{sl.builderNote ?? 'Please choose a different unit.'}</p>
                        <button
                          onClick={() => { setSelected(null); openUnitPicker(selected); }}
                          className="w-full py-2 rounded-xl text-[12px] font-semibold text-white hover:opacity-90"
                          style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
                          Pick Another Unit
                        </button>
                      </div>
                    )}

                    {/* No shortlist yet → primary CTA */}
                    {sl === null && (
                      <button
                        onClick={() => { setSelected(null); openUnitPicker(selected); }}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-ring hover:bg-muted/30 transition-all group text-left">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#0A7E8C15', color: '#0A7E8C' }}>
                          <Bookmark size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-foreground">Shortlist a Unit</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Browse units from {selected.projectName} and save your favourite</p>
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                      </button>
                    )}

                    {/* Shortlist pending → waiting state */}
                    {typeof sl === 'object' && sl !== null && sl.status === 'Pending' && (
                      <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 flex items-center gap-3">
                        <Clock size={14} className="text-amber-600 shrink-0" />
                        <div>
                          <p className="text-[12px] font-semibold text-amber-800">Waiting for builder review</p>
                          <p className="text-[11px] text-amber-600 mt-0.5">You shortlisted Unit {sl.unitId}. The builder will respond shortly.</p>
                        </div>
                      </div>
                    )}

                    {/* Shortlist accepted + deal active → go to Journey */}
                    {typeof sl === 'object' && sl !== null && sl.status === 'Accepted' && (
                      <div className="space-y-2">
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 flex items-center gap-3">
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                          <div>
                            <p className="text-[12px] font-semibold text-emerald-800">Unit {sl.unitId} accepted!</p>
                            <p className="text-[11px] text-emerald-600 mt-0.5">
                              {isAgreement ? 'Agreement stage — confirm acceptance in your Journey.' : isBooked ? 'Property booked! View your Journey.' : 'Negotiation started. Track progress in your Journey.'}
                            </p>
                          </div>
                        </div>
                        <a href="/customer/journey"
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold text-white hover:opacity-90"
                          style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
                          View My Journey <ChevronRight size={13} />
                        </a>
                      </div>
                    )}

                    {/* Builder notes (completed visit) */}
                    {selected.builderNotes && (
                      <div className="rounded-xl p-3.5 border" style={{ backgroundColor: '#0A7E8C08', borderColor: '#0A7E8C25' }}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5" style={{ color: '#0A7E8C' }}>Builder's Visit Notes</p>
                        <p className="text-[12px] text-foreground leading-relaxed">{selected.builderNotes}</p>
                      </div>
                    )}
                  </div>
                );
              })()}

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
                <div className="space-y-2">
                  {selected.customerRating ? (
                    <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={16} className={s <= selected.customerRating! ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                        ))}
                      </div>
                      <span className="text-[12px] font-semibold text-amber-700">{RATING_LABEL[selected.customerRating]}</span>
                    </div>
                  ) : (
                  <button onClick={() => { setRatingId(selected.id); setRating(0); setSelected(null); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}>
                    <Star size={14} /> Rate Your Experience
                  </button>
                  )}
                  <a href="/customer/journey"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold border border-border text-foreground hover:bg-muted transition-colors">
                    <CheckCircle2 size={14} /> View My Journey
                  </a>
                </div>
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
            <button
              onClick={async () => {
                try {
                  await portalApi.rateMeeting(ratingId, rating);
                  setMeetings(prev => prev.map(m => m.id === ratingId ? { ...m, customerRating: rating } : m));
                  toast.success('Thank you for your feedback!');
                } catch {
                  toast.error('Failed to save rating');
                } finally {
                  setRatingId(null); setRating(0);
                }
              }}
              disabled={rating === 0}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
              Submit Rating
            </button>
          </div>
        </div>
      )}

      {/* Unit Shortlist Picker Modal */}
      {shortlistMeeting && (() => {
        // Build tower → { floors sorted desc, units per floor }
        const towers = [...new Set(unitPickerUnits.map(u => u.tower))].sort();
        const allFloors = [...new Set(unitPickerUnits.map(u => u.floor))].sort((a, b) => b - a);

        const unitStyle = (u: UnitRow) => {
          const isSelected = selectedUnit?.id === u.id;
          const st = (u.status ?? '').toLowerCase();
          if (isSelected) return { bg: 'bg-teal-600 border-teal-600 text-white', clickable: true };
          if (st === 'available') return { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 cursor-pointer', clickable: true };
          if (st === 'booked')   return { bg: 'bg-amber-50 border-amber-200 text-amber-600 cursor-not-allowed opacity-70', clickable: false };
          if (st === 'sold')     return { bg: 'bg-red-50 border-red-200 text-red-500 cursor-not-allowed opacity-60', clickable: false };
          return { bg: 'bg-muted border-border text-muted-foreground cursor-not-allowed opacity-60', clickable: false };
        };

        const fmtPrice = (p?: number) => {
          if (!p) return null;
          if (p >= 10_000_000) return `₹${(p / 10_000_000).toFixed(1)}Cr`;
          if (p >= 100_000)    return `₹${(p / 100_000).toFixed(0)}L`;
          return `₹${p.toLocaleString('en-IN')}`;
        };

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShortlistMeeting(null)} />
            <div className="relative bg-card w-full max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border flex flex-col max-h-[92vh] overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                <div>
                  <h3 className="font-bold text-[15px] text-foreground">Unit Matrix</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{shortlistMeeting.projectName} · tap an available unit to shortlist</p>
                </div>
                <button onClick={() => setShortlistMeeting(null)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground"><X size={16} /></button>
              </div>

              {/* Legend */}
              <div className="px-5 py-2.5 border-b border-border bg-muted/20 flex gap-4 shrink-0 flex-wrap">
                {[
                  { label: 'Available', cls: 'bg-emerald-100 border-emerald-300' },
                  { label: 'Booked',    cls: 'bg-amber-100 border-amber-300' },
                  { label: 'Sold',      cls: 'bg-red-100 border-red-300' },
                  { label: 'Selected',  cls: 'bg-teal-600 border-teal-600' },
                ].map(({ label, cls }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`w-3.5 h-3.5 rounded border ${cls}`} />
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>

              {/* Floor Plans — shown when builder has uploaded them */}
              {floorPlanDocs.length > 0 && (
                <div className="px-5 py-3 border-b border-border bg-muted/10 shrink-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                    Floor Plans
                  </p>
                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                    {floorPlanDocs.map(doc => {
                      const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(doc.fileUrl ?? '');
                      return (
                        <a
                          key={doc.id}
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 flex flex-col items-center gap-1.5 p-2 rounded-xl border border-border bg-card hover:border-teal-300 hover:bg-teal-50/40 transition-all group w-28"
                        >
                          {isImage ? (
                            <img
                              src={doc.fileUrl}
                              alt={doc.fileName}
                              className="w-24 h-16 object-cover rounded-lg border border-border bg-muted"
                            />
                          ) : (
                            <div className="w-24 h-16 rounded-lg border border-border bg-muted flex items-center justify-center">
                              <FileText size={22} className="text-muted-foreground group-hover:text-teal-600 transition-colors" />
                            </div>
                          )}
                          <p className="text-[9px] text-muted-foreground text-center truncate w-full leading-tight group-hover:text-teal-700">
                            {doc.fileName}
                          </p>
                          <span className="flex items-center gap-1 text-[9px] text-teal-600 font-semibold">
                            <ExternalLink size={9} /> Open
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Matrix body */}
              <div className="flex-1 overflow-y-auto p-4">
                {unitPickerLoading ? (
                  <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
                ) : unitPickerUnits.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground text-[13px]">No units configured for this project.</div>
                ) : (
                  <div className="space-y-6">
                    {towers.map(tower => {
                      const towerUnits = unitPickerUnits.filter(u => u.tower === tower);
                      const towerFloors = [...new Set(towerUnits.map(u => u.floor))].sort((a, b) => b - a);
                      return (
                        <div key={tower}>
                          {towers.length > 1 && (
                            <div className="flex items-center gap-2 mb-3">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">Tower {tower}</div>
                              <div className="flex-1 h-px bg-border" />
                            </div>
                          )}

                          {/* Floor rows: highest floor first */}
                          <div className="space-y-1.5">
                            {towerFloors.map(floor => {
                              const floorUnits = towerUnits.filter(u => u.floor === floor).sort((a, b) => a.unit - b.unit);
                              return (
                                <div key={floor} className="flex items-start gap-2">
                                  {/* Floor label */}
                                  <div className="w-10 shrink-0 text-right">
                                    <span className="text-[10px] font-semibold text-muted-foreground leading-none">{floor === 0 ? 'G' : `F${floor}`}</span>
                                  </div>
                                  {/* Units in this floor */}
                                  <div className="flex gap-1.5 flex-wrap">
                                    {floorUnits.map(u => {
                                      const { bg, clickable } = unitStyle(u);
                                      const isSelected = selectedUnit?.id === u.id;
                                      return (
                                        <button
                                          key={u.id}
                                          disabled={!clickable}
                                          onClick={() => clickable && setSelectedUnit(isSelected ? null : u)}
                                          title={`${u.id} · ${u.bhk}${u.areaSqft ? ` · ${u.areaSqft} sqft` : ''}${u.facing ? ` · ${u.facing}` : ''}${u.price ? ` · ${fmtPrice(u.price)}` : ''}`}
                                          className={`w-14 h-14 rounded-lg border text-center flex flex-col items-center justify-center transition-all ${bg}`}>
                                          <span className={`text-[10px] font-bold leading-tight ${isSelected ? 'text-white' : ''}`}>{u.id}</span>
                                          <span className={`text-[9px] leading-tight mt-0.5 ${isSelected ? 'text-teal-100' : 'text-muted-foreground'}`}>{u.bhk}</span>
                                          {u.price && <span className={`text-[8px] leading-tight ${isSelected ? 'text-teal-200' : 'text-muted-foreground'}`}>{fmtPrice(u.price)}</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Unit detail panel */}
              {selectedUnit && (
                <div className="border-t border-border shrink-0" style={{ background: 'linear-gradient(to bottom, #f0fdfa, #fff)' }}>
                  {/* Unit identity row */}
                  <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#0A7E8C18' }}>
                        <Bookmark size={15} style={{ color: '#0A7E8C' }} />
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-foreground">Unit {selectedUnit.id}</p>
                        <p className="text-[11px] text-muted-foreground">Tower {selectedUnit.tower} · Floor {selectedUnit.floor === 0 ? 'Ground' : selectedUnit.floor}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      Available
                    </span>
                  </div>

                  {/* Attributes grid */}
                  <div className="grid grid-cols-3 gap-2 px-5 pb-3">
                    {[
                      { label: 'Configuration', value: selectedUnit.bhk },
                      { label: 'Area',           value: selectedUnit.areaSqft ? `${selectedUnit.areaSqft} sqft` : '—' },
                      { label: 'Price',          value: fmtPrice(selectedUnit.price) ?? '—' },
                      { label: 'Facing',         value: selectedUnit.facing ?? '—' },
                      { label: 'Floor',          value: selectedUnit.floor === 0 ? 'Ground' : `Floor ${selectedUnit.floor}` },
                      { label: 'Tower',          value: `Tower ${selectedUnit.tower}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white rounded-xl border border-border px-3 py-2.5">
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                        <p className="text-[13px] font-semibold text-foreground mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="px-5 pb-4">
                    <button
                      onClick={handleShortlistSubmit}
                      disabled={submittingShortlist}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
                      style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
                      {submittingShortlist
                        ? <><Loader2 size={13} className="animate-spin" /> Submitting…</>
                        : <><Bookmark size={13} /> Shortlist Unit {selectedUnit.id}</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
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
