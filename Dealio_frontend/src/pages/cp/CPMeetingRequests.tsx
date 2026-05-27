import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { cpApi } from '@/lib/api';
import { projects } from '@/data/projects';
import { formatCurrency } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Calendar, Clock, CheckCircle2, XCircle, RefreshCw, Loader2,
  MessageSquare, Phone, Building2, ChevronRight, Share2, Users,
  AlertCircle, X, MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDealStore } from '@/stores/useDealStore';

interface ApiMeeting {
  id: number;
  projectName: string;
  customerName: string;
  customerPhone: string;
  preferredDate: string;
  preferredTime: string;
  confirmedDate: string | null;
  confirmedTime: string | null;
  meetingType: string | null;
  notes: string | null;
  builderNotes: string | null;
  cpNotes: string | null;
  status: string;
  createdAt: string;
}

const S: Record<string, { pill: string; dot: string; label: string }> = {
  Pending:              { pill: 'bg-amber-100 text-amber-700 border border-amber-200',    dot: 'bg-amber-400',   label: 'Pending Confirmation' },
  Confirmed:            { pill: 'bg-blue-100 text-blue-700 border border-blue-200',       dot: 'bg-blue-500',    label: 'Confirmed' },
  Rescheduled:          { pill: 'bg-orange-100 text-orange-700 border border-orange-200', dot: 'bg-orange-400',  label: 'Rescheduled' },
  Completed:            { pill: 'bg-emerald-100 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500', label: 'Completed' },
  'Follow-up Required': { pill: 'bg-violet-100 text-violet-700 border border-violet-200', dot: 'bg-violet-500',  label: 'Follow-up' },
  Cancelled:            { pill: 'bg-red-100 text-red-600 border border-red-200',          dot: 'bg-red-400',     label: 'Cancelled' },
};

function fmtDate(s: string) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const isToday = d.toDateString() === new Date().toDateString();
  return isToday ? 'Today' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function timeAgo(s: string) {
  const diff = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
  if (diff < 1)    return 'just now';
  if (diff < 60)   return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

const STEPS = ['Select City', 'Select Project', 'Customer Details'] as const;

const CPMeetingRequests = () => {
  const { user } = useAuthStore();
  const { addShareEvent, shareEvents } = useDealStore();
  const cpUserId = user?.id ?? '';

  const [tab, setTab] = useState<'meetings' | 'sharing'>('meetings');
  const [meetings, setMeetings] = useState<ApiMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ApiMeeting | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // New meeting request form state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [form, setForm] = useState({ customerName: '', customerPhone: '', preferredDate: '', preferredTime: '', notes: '' });

  // Share modal
  const [showShareModal, setShowShareModal] = useState<string | null>(null);
  const [shareContact, setShareContact] = useState('');

  const cities = [...new Set(projects.map(p => p.city))].sort();
  const cityProjects = projects.filter(p => p.city === selectedCity);

  const loadMeetings = useCallback(async () => {
    if (!cpUserId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await cpApi.getMeetings(cpUserId);
      setMeetings((data as ApiMeeting[]) || []);
    } catch {
      toast.error('Could not load meetings');
    } finally {
      setLoading(false);
    }
  }, [cpUserId]);

  useEffect(() => { loadMeetings(); }, [loadMeetings]);
  useEffect(() => {
    const h = () => loadMeetings();
    window.addEventListener('dealio:new-meeting', h);
    return () => window.removeEventListener('dealio:new-meeting', h);
  }, [loadMeetings]);

  const handleSaveNote = async () => {
    if (!selected || !cpUserId) return;
    setSavingNote(true);
    try {
      const updated = await cpApi.addMeetingNote(cpUserId, selected.id, noteInput);
      const u = updated as ApiMeeting;
      setMeetings(prev => prev.map(m => m.id === selected.id ? { ...m, cpNotes: u.cpNotes } : m));
      setSelected(prev => prev ? { ...prev, cpNotes: u.cpNotes } : null);
      toast.success('Note saved');
    } catch {
      toast.error('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const openDetail = (m: ApiMeeting) => {
    setSelected(m);
    setNoteInput(m.cpNotes ?? '');
  };

  // New meeting request
  const closeForm = () => { setShowRequestForm(false); setStep(1); setSelectedCity(''); setSelectedProjectId(''); setForm({ customerName: '', customerPhone: '', preferredDate: '', preferredTime: '', notes: '' }); };

  const handleSubmitRequest = () => {
    const project = projects.find(p => p.id === selectedProjectId);
    if (!project || !form.customerName || !form.customerPhone) { toast.error('Please fill all required fields'); return; }
    useDealStore.getState().createMeetingRequest({
      cpId: String(cpUserId), cpName: user?.name ?? 'CP',
      builderId: 'B001', builderName: project.builder,
      projectId: selectedProjectId, projectName: project.name,
      customerName: form.customerName, customerPhone: form.customerPhone,
      preferredDate: form.preferredDate, preferredTime: form.preferredTime, notes: form.notes,
    });
    toast.success('Meeting request sent to builder');
    closeForm();
    setTimeout(loadMeetings, 500);
  };

  const handleWhatsAppShare = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const trackingLink = `https://dealio.app/p/${projectId}?utm_source=cp&utm_cp_id=${cpUserId}`;
    const message = `Hi! I'd like to share this property with you: ${project.name} in ${project.location}. ${project.bhkTypes.join('/')} starting ${formatCurrency(project.priceRange[0])}. ${trackingLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    addShareEvent({ cpId: String(cpUserId), projectId, projectName: project.name, sharedWith: shareContact || 'Unknown', sharedVia: 'WhatsApp' });
    toast.success('Shared via WhatsApp');
    setShowShareModal(null);
    setShareContact('');
  };

  const meta = selected ? (S[selected.status] ?? S['Pending']) : null;
  const pending = meetings.filter(m => m.status === 'Pending').length;
  const confirmed = meetings.filter(m => m.status === 'Confirmed' || m.status === 'Rescheduled').length;

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold text-foreground">Meetings & Sharing</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">Track meeting requests and share projects with clients</p>
          </div>
          <button onClick={() => { setShowRequestForm(true); setTab('meetings'); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}>
            <Calendar size={14} /> New Request
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/60 rounded-xl p-1 w-fit">
          {(['meetings', 'sharing'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all capitalize ${tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t === 'meetings' ? (
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} /> Meetings
                  {pending > 0 && <span className="w-4 h-4 rounded-full bg-amber-400 text-white text-[9px] font-bold flex items-center justify-center">{pending}</span>}
                </span>
              ) : (
                <span className="flex items-center gap-1.5"><Share2 size={13} /> Project Sharing</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Meetings tab ─────────────────────────────────────────────── */}
        {tab === 'meetings' && (
          <>
            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total',     value: meetings.length, dotColor: 'bg-muted',      textColor: 'text-foreground' },
                { label: 'Pending',   value: pending,         dotColor: 'bg-amber-400',   textColor: 'text-amber-600' },
                { label: 'Confirmed', value: confirmed,        dotColor: 'bg-blue-500',    textColor: 'text-blue-600' },
              ].map(({ label, value, dotColor, textColor }) => (
                <div key={label} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                    <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
                  </div>
                  <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Meeting list */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-[13px] font-bold text-foreground">Meeting Activity</h2>
                <button onClick={loadMeetings} disabled={loading} className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
              ) : meetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                    <Calendar size={22} className="text-muted-foreground" />
                  </div>
                  <p className="text-[13px] font-semibold text-foreground">No meeting activity yet</p>
                  <p className="text-[12px] text-muted-foreground mt-1">Meetings you arrange for clients will appear here.</p>
                </div>
              ) : (
                <div>
                  {meetings.map(m => {
                    const ms = S[m.status] ?? S['Pending'];
                    return (
                      <button key={m.id} onClick={() => openDetail(m)}
                        className="w-full text-left px-5 py-4 border-b border-border last:border-0 hover:bg-muted/20 transition-colors group">
                        <div className="flex items-start gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${ms.dot}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[13px] font-semibold text-foreground truncate">{m.customerName}</p>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${ms.pill}`}>{ms.label}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{m.projectName} · {m.meetingType ?? 'Site Visit'}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1"><Calendar size={9} />{fmtDate(m.confirmedDate ?? m.preferredDate)}</span>
                              <span className="flex items-center gap-1"><Clock size={9} />{m.confirmedTime ?? m.preferredTime}</span>
                              <span className="ml-auto">{timeAgo(m.createdAt)}</span>
                            </div>
                            {m.builderNotes && (
                              <div className="mt-2 flex items-start gap-1.5 bg-blue-50 rounded-lg px-2.5 py-1.5">
                                <MessageSquare size={10} className="text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-blue-700 leading-snug">{m.builderNotes}</p>
                              </div>
                            )}
                          </div>
                          <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-1" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Project Sharing tab ──────────────────────────────────────── */}
        {tab === 'sharing' && (
          <>
            {/* Recent shares */}
            {shareEvents.filter(s => s.cpId === String(cpUserId)).length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="text-[13px] font-bold text-foreground mb-3">Recent Shares</h3>
                <div className="space-y-2">
                  {shareEvents.filter(s => s.cpId === String(cpUserId)).slice(0, 5).map(se => (
                    <div key={se.id} className="flex items-center gap-3 text-[13px]">
                      <Share2 size={13} className="text-emerald-500 shrink-0" />
                      <span className="text-foreground font-medium truncate">{se.projectName}</span>
                      <span className="text-muted-foreground text-[12px]">→ {se.sharedWith} via {se.sharedVia}</span>
                      <span className="text-[11px] text-muted-foreground ml-auto shrink-0">{new Date(se.timestamp).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Project cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(p => (
                <div key={p.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-32 object-cover" />
                  <div className="p-4">
                    <h4 className="font-semibold text-foreground text-[13px]">{p.name}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{p.builder} · {p.location}</p>
                    <div className="flex items-center gap-2 mt-2 text-[12px]">
                      <Badge variant="outline">{p.available} units</Badge>
                      <Badge className="bg-muted text-foreground border-border">{p.commissionPercent}%</Badge>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => setShowShareModal(p.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[12px] font-medium border border-border text-foreground hover:bg-muted transition-colors">
                        <Share2 size={11} /> Share
                      </button>
                      <button onClick={() => {
                        setStep(3); setSelectedCity(p.city); setSelectedProjectId(p.id);
                        setForm({ customerName: '', customerPhone: '', preferredDate: '', preferredTime: '', notes: '' });
                        setShowRequestForm(true);
                      }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[12px] font-medium border border-border text-foreground hover:bg-muted transition-colors">
                        <Calendar size={11} /> Meet
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Meeting Detail Drawer ──────────────────────────────────────── */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-card shadow-2xl border-l border-border flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0A7E8C0d 0%, transparent 100%)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#0A7E8C15', color: '#0A7E8C' }}>
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{selected.customerName}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{selected.projectName}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-muted/20">

              {/* Status */}
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">Builder Status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${meta!.dot}`} />
                  <span className="text-[13px] font-semibold text-foreground">{meta!.label}</span>
                  {selected.status === 'Confirmed' && <CheckCircle2 size={14} className="text-blue-500 ml-auto" />}
                  {selected.status === 'Cancelled' && <XCircle size={14} className="text-red-400 ml-auto" />}
                  {selected.status === 'Pending' && <AlertCircle size={14} className="text-amber-400 ml-auto" />}
                </div>
              </div>

              {/* Schedule */}
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Schedule</p>
                <div className="flex items-center gap-2.5">
                  <Calendar size={13} className="shrink-0" style={{ color: '#0A7E8C' }} />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Requested</p>
                    <p className="text-[13px] font-medium text-foreground">{fmtDate(selected.preferredDate)} · {selected.preferredTime}</p>
                  </div>
                </div>
                {selected.confirmedDate && (
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Confirmed by Builder</p>
                      <p className="text-[13px] font-semibold text-emerald-600">{fmtDate(selected.confirmedDate)}{selected.confirmedTime ? ` · ${selected.confirmedTime}` : ''}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact */}
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3">Customer Contact</p>
                <a href={`tel:${selected.customerPhone}`}
                  className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border hover:border-ring hover:bg-muted/60 transition-all">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0A7E8C15', color: '#0A7E8C' }}>
                    <Phone size={13} />
                  </div>
                  <p className="text-[13px] font-semibold text-foreground">{selected.customerPhone}</p>
                </a>
              </div>

              {/* Builder message */}
              {selected.builderNotes && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600 mb-2">Message from Builder</p>
                  <div className="flex items-start gap-2">
                    <MessageSquare size={13} className="text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[13px] text-blue-800 leading-relaxed">{selected.builderNotes}</p>
                  </div>
                </div>
              )}

              {/* Map link for confirmed */}
              {(selected.status === 'Confirmed' || selected.status === 'Rescheduled') && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.projectName)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 hover:border-emerald-300 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <MapPin size={13} className="text-emerald-600" />
                  </div>
                  <p className="text-[13px] font-semibold text-emerald-700 group-hover:text-emerald-600">Get Directions</p>
                </a>
              )}

              {/* CP Notes */}
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">My Notes</p>
                <textarea
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  rows={3}
                  placeholder="Add your notes about this meeting…"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring resize-none transition-all placeholder:text-muted-foreground"
                />
                <button onClick={handleSaveNote} disabled={savingNote}
                  className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}>
                  {savingNote ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Share Modal */}
      <Dialog open={!!showShareModal} onOpenChange={() => setShowShareModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Share Project</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input value={shareContact} onChange={e => setShareContact(e.target.value)} placeholder="Customer name (for tracking)" />
            <Button className="w-full" onClick={() => showShareModal && handleWhatsAppShare(showShareModal)}>
              <MessageSquare size={15} className="mr-2" /> Share via WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meeting Request Form */}
      <Dialog open={showRequestForm} onOpenChange={closeForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Request Meeting with Builder</DialogTitle></DialogHeader>

          {/* Steps */}
          <div className="flex items-center gap-1 mb-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-1 flex-1">
                <div className={`w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center shrink-0 ${step > i + 1 || step === i + 1 ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{i + 1}</div>
                <span className={`text-xs truncate ${step === i + 1 ? 'text-teal-700 font-medium' : 'text-gray-400'}`}>{label}</span>
                {i < STEPS.length - 1 && <ChevronRight size={11} className="text-gray-300 shrink-0" />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Choose the city for the site visit.</p>
              <div className="grid grid-cols-2 gap-2">
                {cities.map(city => (
                  <button key={city} onClick={() => { setSelectedCity(city); setSelectedProjectId(''); }}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${selectedCity === city ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 hover:border-teal-200 text-gray-700'}`}>
                    <MapPin size={13} /> {city}
                  </button>
                ))}
              </div>
              <Button className="w-full bg-teal-600 hover:bg-teal-700" disabled={!selectedCity} onClick={() => setStep(2)}>Next <ChevronRight size={13} className="ml-1" /></Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Projects in <span className="font-semibold text-gray-800">{selectedCity}</span></p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {cityProjects.map(p => (
                  <button key={p.id} onClick={() => setSelectedProjectId(p.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${selectedProjectId === p.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-200'}`}>
                    <p className="font-medium text-sm text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.builder} · {p.location}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1 bg-teal-600 hover:bg-teal-700" disabled={!selectedProjectId} onClick={() => setStep(3)}>Next <ChevronRight size={13} className="ml-1" /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              {selectedProjectId && (
                <div className="p-2.5 rounded-lg bg-teal-50 text-xs text-teal-700 font-medium border border-teal-100">
                  <Building2 size={11} className="inline mr-1" />{projects.find(p => p.id === selectedProjectId)?.name}
                </div>
              )}
              <Input placeholder="Customer Name *" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} />
              <Input placeholder="Customer Phone *" value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} />
              <Input type="date" value={form.preferredDate} onChange={e => setForm({ ...form, preferredDate: e.target.value })} />
              <Input placeholder="Preferred Time (e.g. 10:00 AM)" value={form.preferredTime} onChange={e => setForm({ ...form, preferredTime: e.target.value })} />
              <Input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={handleSubmitRequest}>Send Request</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CPMeetingRequests;