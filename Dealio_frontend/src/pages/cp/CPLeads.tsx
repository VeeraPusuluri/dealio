import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { builderApi, cpApi, portalApi } from '@/lib/api';
import { pushNotifTo } from '@/lib/crossNotify';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';
import {
  Plus, Phone, MessageSquare, Search, Loader2, X,
  Calendar, CalendarCheck, CalendarDays, ArrowLeft, IndianRupee,
  TrendingUp, Building2, ChevronDown, CheckCircle2,
  Send, FileText, ExternalLink, Zap, RefreshCw, Route,
} from 'lucide-react';
import CustomerJourneyTab from '@/components/shared/CustomerJourneyTab';
import { useNavigate, Link } from 'react-router-dom';
import DatePickerField from '@/components/shared/DatePickerField';

interface CPLead {
  id: number;
  projectId: number;
  projectName: string;
  builderId?: number | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  dealValue?: number | null;
  status: string;
  commissionStatus: string;
  commissionPercent?: number | null;
  estimatedCommission?: number | null;
  createdAt: string;
}

interface PublicProject { id: number; builderId: number; name: string; city?: string; }

const STAGES = [
  'New Lead', 'Profile Created', 'Meeting Requested', 'Meeting Confirmed',
  'Meeting Done', 'Negotiation', 'Agreement', 'Pending Booking', 'Booked', 'Closed',
] as const;

const STAGE_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  'New Lead':           { bg: 'bg-slate-50',   text: 'text-slate-600',   dot: '#94a3b8' },
  'Profile Created':    { bg: 'bg-teal-50',    text: 'text-teal-700',    dot: '#0d9488' },
  'Agreement':          { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: '#2563eb' },
  'Meeting Requested':  { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: '#6366f1' },
  'Meeting Confirmed':  { bg: 'bg-violet-50',  text: 'text-violet-700',  dot: '#8b5cf6' },
  'Meeting Done':       { bg: 'bg-pink-50',    text: 'text-pink-700',    dot: '#ec4899' },
  'Negotiation':        { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: '#f59e0b' },
  'Pending Booking':    { bg: 'bg-cyan-50',    text: 'text-cyan-700',    dot: '#0891b2' },
  'Booked':             { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: '#10b981' },
  'Closed':             { bg: 'bg-green-50',   text: 'text-green-700',   dot: '#16a34a' },
};

const COMM_STATUS_COLOR: Record<string, string> = {
  Pending:    'bg-amber-50 text-amber-700',
  Processing: 'bg-blue-50 text-blue-700',
  Released:   'bg-green-50 text-green-700',
};

const fmt = (n: number) => {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(0)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const TIME_SLOTS = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

const DEAL_STAGES_PROGRESS = ['Meeting Done', 'Negotiation', 'Agreement', 'Booked'] as const;

/* ─────────────────────────────────────────────────────────────────────────────
   DealPanel — right-side drawer for Negotiation / Agreement leads
───────────────────────────────────────────────────────────────────────────── */
interface DealPanelProps {
  lead: CPLead;
  dealDetail: Record<string, unknown> | null;
  loading: boolean;
  cpUserId: number | string;
  onClose: () => void;
  onRefresh: () => void;
}

const DealPanel = ({ lead, dealDetail, loading, cpUserId, onClose, onRefresh }: DealPanelProps) => {
  const [tab, setTab] = useState<'journey' | 'actions' | 'messages' | 'documents'>('journey');
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [agreeing, setAgreeing] = useState(false);

  const commAmt = (dealDetail?.commissionAmount as number | undefined) ?? lead.estimatedCommission ?? 0;
  const cpAgreed = !!(dealDetail?.cpAgreed);
  const customerConfirmed = !!(dealDetail?.customerConfirmed);
  const cpTier = (dealDetail?.cpTier as string | undefined) ?? '—';
  const commPercent = (dealDetail?.commissionPercent as number | undefined) ?? lead.commissionPercent ?? 0;
  const dealValue = (dealDetail?.dealValue as number | undefined) ?? lead.dealValue ?? 0;
  const dealStage = (dealDetail?.status as string | undefined) ?? lead.status;

  const messages: Array<{ id: number; senderRole: string; message: string; createdAt: string }> =
    (dealDetail?.messages as Array<{ id: number; senderRole: string; message: string; createdAt: string }>) ?? [];

  const documents: Array<{ id: number; docType: string; name: string; fileUrl?: string | null }> =
    (dealDetail?.dealDocuments as Array<{ id: number; docType: string; name: string; fileUrl?: string | null }>) ?? [];

  const waText = encodeURIComponent(
    `Hi ${lead.customerName.split(' ')[0]}, the builder has shared pricing details for ${lead.projectName}. Please log in to your Dealio portal at /customer/journey to review.`
  );
  const waUrl = `https://wa.me/91${lead.customerPhone.replace(/\D/g, '')}?text=${waText}`;

  const handleSend = async () => {
    const msg = msgInput.trim();
    if (!msg) return;
    setSending(true);
    try {
      await cpApi.sendCPDealMessage(cpUserId, lead.id, msg);
      setMsgInput('');
      onRefresh();
      toast.success('Message sent');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleAgree = async () => {
    setAgreeing(true);
    try {
      await cpApi.agreeDeal(cpUserId, lead.id);
      onRefresh();
      toast.success('Deal marked as agreed!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to agree deal');
    } finally {
      setAgreeing(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-sm font-bold text-slate-900 truncate">
              Deal for {lead.customerName}
            </p>
            <p className="text-xs text-slate-500 truncate">{lead.projectName}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              to={`/cp/deals/${lead.id}`}
              title="Open the shared Deal Room"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-teal-700 hover:bg-teal-50 transition-colors"
            >
              <ExternalLink size={12} /> Deal Room
            </Link>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Commission badge */}
        <div className={`mx-4 mt-3 rounded-xl px-4 py-3 ${cpAgreed ? 'bg-green-50' : 'bg-amber-50'}`}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className={`text-xs font-bold ${cpAgreed ? 'text-green-700' : 'text-amber-700'}`}>
                Pending payout: {commAmt > 0 ? fmt(commAmt) : '₹—'}
              </p>
              <p className={`text-[10px] mt-0.5 ${cpAgreed ? 'text-green-600' : 'text-amber-600'}`}>
                Tier: {cpTier} | {commPercent}% of {dealValue > 0 ? fmt(dealValue) : '₹—'}
              </p>
            </div>
            {cpAgreed && (
              <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Agreed
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 mx-4 mt-3 shrink-0 overflow-x-auto">
          {([
            ['journey',   'Journey',   Route         ],
            ['actions',   'Actions',   Zap           ],
            ['messages',  'Messages',  MessageSquare ],
            ['documents', 'Docs',      FileText      ],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1 flex-1 py-2 text-[11px] font-semibold whitespace-nowrap transition-colors ${
                tab === key
                  ? 'text-teal-700 border-b-2 border-teal-500'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={10} /> {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">

          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-teal-400" />
            </div>
          )}

          {!loading && tab === 'journey' && (
            <CustomerJourneyTab
              stage={dealStage}
              customerName={lead.customerName}
              projectName={lead.projectName}
              dealValue={dealValue || null}
              role="cp"
              onCall={() => window.open(`tel:${lead.customerPhone}`)}
              onWhatsApp={() => window.open(`https://wa.me/91${lead.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${lead.customerName.split(' ')[0]}! Following up on ${lead.projectName}. 😊`)}`)}
              onScheduleMeeting={() => setTab('actions')}
            />
          )}

          {!loading && tab === 'messages' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-2 overflow-y-auto pb-2">
                {messages.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">No messages yet</div>
                ) : messages.map(m => {
                  const isCp = m.senderRole === 'CP';
                  return (
                    <div key={m.id} className={`flex ${isCp ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${isCp ? 'bg-teal-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-700 rounded-bl-sm'}`}>
                        <p>{m.message}</p>
                        <p className={`text-[9px] mt-1 ${isCp ? 'text-teal-200' : 'text-slate-400'}`}>
                          {new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100 mt-2 shrink-0">
                <input
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type a message…"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
                />
                <button onClick={handleSend} disabled={!msgInput.trim() || sending}
                  className="p-2 rounded-xl text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </div>
          )}

          {!loading && tab === 'documents' && (
            <div className="space-y-4">
              <div className="space-y-2">
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs rounded-xl border border-dashed border-slate-200">
                    No documents from builder yet
                  </div>
                ) : documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={13} className="text-teal-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded mr-1">{doc.docType}</span>
                        <span className="text-xs text-slate-700 truncate">{doc.name}</span>
                      </div>
                    </div>
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                        className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-teal-600 hover:text-teal-800">
                        Open <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-green-100 bg-green-50 p-3 space-y-2">
                <p className="text-[10px] font-bold text-green-700 uppercase tracking-wide">Relay to Customer</p>
                <p className="text-[11px] text-green-800 leading-relaxed bg-white rounded-lg px-3 py-2 border border-green-100">
                  Hi {lead.customerName.split(' ')[0]}, the builder has shared pricing details for {lead.projectName}. Please log in to your Dealio portal at /customer/journey to review.
                </p>
                <a href={waUrl} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors">
                  <MessageSquare size={12} /> Send via WhatsApp
                </a>
              </div>
            </div>
          )}

          {!loading && tab === 'actions' && (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Deal Progress</p>
                <div className="flex gap-1 flex-wrap">
                  {DEAL_STAGES_PROGRESS.map(s => {
                    const isCurrent = dealStage === s;
                    const isPast = DEAL_STAGES_PROGRESS.indexOf(s) < DEAL_STAGES_PROGRESS.indexOf(dealStage as typeof DEAL_STAGES_PROGRESS[number]);
                    return (
                      <span key={s} className={`px-2 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                        isCurrent ? 'bg-teal-600 text-white border-teal-600'
                        : isPast   ? 'bg-teal-50 text-teal-600 border-teal-200'
                        :            'bg-slate-50 text-slate-400 border-slate-200'
                      }`}>{s}</span>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {cpAgreed && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
                    <CheckCircle2 size={12} /> Deal Agreed
                  </span>
                )}
                {customerConfirmed && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200">
                    <CheckCircle2 size={12} /> Customer Confirmed
                  </span>
                )}
              </div>
              {(dealStage === 'Negotiation' || dealStage === 'Agreement') && !cpAgreed && (
                <button onClick={handleAgree} disabled={agreeing}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all shadow-sm"
                  style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
                  {agreeing ? <><Loader2 size={14} className="animate-spin" /> Marking…</> : <><Zap size={14} /> Mark Deal Agreed</>}
                </button>
              )}
              <a href="/cp/followups"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors">
                <CalendarDays size={13} /> Schedule Follow-up
              </a>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Quick Contact</p>
                <div className="flex gap-2">
                  <a href={`tel:${lead.customerPhone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <Phone size={12} /> Call
                  </a>
                  <a href={`https://wa.me/91${lead.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${lead.customerName.split(' ')[0]}! Following up on ${lead.projectName}. 😊`)}`}
                    target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-green-200 bg-green-50 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors">
                    <MessageSquare size={12} /> WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────────────────── */
const CPLeads = () => {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  const [leads, setLeads]       = useState<CPLead[]>([]);
  const [loading, setLoading]   = useState(true);
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [search, setSearch]     = useState('');
  const [projectFilter, setProjectFilter] = useState('All');

  // ── Add Lead modal ─────────────────────────────────────────────────────
  const [addOpen, setAddOpen]         = useState(false);
  const [addProject, setAddProject]   = useState<PublicProject | null>(null);
  const [addName, setAddName]         = useState('');
  const [addPhone, setAddPhone]       = useState('');
  const [addEmail, setAddEmail]       = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);

  // ── Meeting scheduling modal ───────────────────────────────────────────
  const [meetingLead, setMeetingLead] = useState<CPLead | null>(null);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingSubmitting, setMeetingSubmitting] = useState(false);
  const [meetingBookedSlots, setMeetingBookedSlots] = useState<string[]>([]);

  // ── Deal panel ─────────────────────────────────────────────────────────
  const [dealPanelLead, setDealPanelLead]       = useState<CPLead | null>(null);
  const [dealDetail, setDealDetail]             = useState<Record<string, unknown> | null>(null);
  const [dealDetailLoading, setDealDetailLoading] = useState(false);

  const fetchLeads = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await cpApi.getLeads(user.id);
      setLeads((data as CPLead[]) ?? []);
    } catch {
      toast.error('Could not load leads');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    builderApi.getPublicProjects()
      .then(data => setProjects((data as PublicProject[]) || []))
      .catch(() => {});
  }, []);

  // Load deal detail whenever the panel lead changes
  const loadDealDetail = useCallback(async (lead: CPLead) => {
    if (!user?.id) return;
    setDealDetailLoading(true);
    try {
      const data = await cpApi.getCPDeal(user.id, lead.id);
      setDealDetail(data as Record<string, unknown>);
    } catch {
      setDealDetail(null);
    } finally {
      setDealDetailLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (dealPanelLead) {
      loadDealDetail(dealPanelLead);
    } else {
      setDealDetail(null);
    }
  }, [dealPanelLead, loadDealDetail]);

  const openDealPanel = (lead: CPLead) => {
    setDealPanelLead(lead);
  };

  const handleAddLead = async () => {
    if (!addProject || !addPhone.trim()) return;
    setAddSubmitting(true);
    try {
      const customerName = addName.trim() || addPhone.trim();

      // POST /cp/:cpUserId/leads — dedicated endpoint, always creates as 'New Lead'
      await cpApi.createLead(user!.id, {
        projectId:     addProject.id,
        customerName,
        customerPhone: addPhone.trim(),
        customerEmail: addEmail.trim() || undefined,
      });

      // Notify builder via localStorage bridge
      pushNotifTo('builder', String(addProject.builderId), {
        type:    'info',
        title:   '🆕 New Lead Added by CP',
        message: `${user?.name ?? 'A CP'} added ${customerName} as a new lead for ${addProject.name}.`,
        link:    '/builder/leads',
      });

      toast.success(`Lead added — "${customerName}" is now in New Lead`);
      setAddOpen(false);
      setAddProject(null); setAddName(''); setAddPhone(''); setAddEmail('');
      await fetchLeads();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to add lead');
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleScheduleMeeting = async () => {
    if (!meetingLead || !meetingDate || !meetingTime) return;
    const project = projects.find(p => p.name === meetingLead.projectName);
    if (!project) { toast.error('Project not found in listings'); return; }
    setMeetingSubmitting(true);
    try {
      await portalApi.bookMeeting({
        builderId:    project.builderId,
        projectId:    project.id,
        customerName: meetingLead.customerName,
        customerPhone: meetingLead.customerPhone,
        preferredDate: meetingDate,
        preferredTime: meetingTime,
        meetingType:  'Site Visit',
        notes: `Arranged by CP: ${user?.name || 'Channel Partner'}`,
        cpUserId: user?.id ?? null,
      });
      toast.success(`Meeting scheduled for ${meetingLead.customerName}`);
      setMeetingLead(null); setMeetingDate(''); setMeetingTime('');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to schedule meeting');
    } finally {
      setMeetingSubmitting(false); }
  };

  const projectNames = [...new Set(leads.map(l => l.projectName))];

  const filtered = leads.filter(l => {
    if (projectFilter !== 'All' && l.projectName !== projectFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.customerName.toLowerCase().includes(q) ||
             l.customerPhone.includes(q) ||
             l.projectName.toLowerCase().includes(q);
    }
    return true;
  });

  const totalComm = leads.reduce((s, l) => s + (l.estimatedCommission ?? 0), 0);
  const activeLeads = leads.filter(l => !['Booked', 'Closed'].includes(l.status)).length;

  const isDealActive = (status: string) => status === 'Negotiation' || status === 'Agreement';

  return (
    <DashboardLayout>
      <div className="space-y-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-foreground">Lead Pipeline</h2>
              <p className="text-xs text-muted-foreground">{leads.length} total · {activeLeads} active</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLeads()}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Refresh leads">
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => setAddOpen(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-1.5 hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
              <Plus size={15} /> Add Lead
            </button>
          </div>
        </div>

        {/* ── Stats strip ── */}
        {!loading && leads.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total leads', value: String(leads.length), color: '#0D9488', bg: 'bg-teal-50' },
              { label: 'Active', value: String(activeLeads), color: '#7C3AED', bg: 'bg-violet-50' },
              { label: 'Est. commission', value: totalComm > 0 ? fmt(totalComm) : '₹—', color: '#D97706', bg: 'bg-amber-50' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl p-3.5 ${s.bg}`}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: s.color + 'CC' }}>{s.label}</p>
                <p className="text-xl font-black leading-none" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search customer, phone, project…"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300" />
          </div>
          <div className="relative">
            <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 font-medium">
              <option value="All">All projects</option>
              {projectNames.map(p => <option key={p}>{p}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* ── Kanban ── */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-teal-400" /></div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={24} className="text-teal-400" />
            </div>
            <h3 className="font-bold text-slate-700 mb-1">No leads yet</h3>
            <p className="text-sm text-slate-400 mb-4">Add your first lead using the button above</p>
            <button onClick={() => setAddOpen(true)}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
              <Plus size={14} className="inline mr-1" /> Add Lead
            </button>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {STAGES.map(stage => {
              // Normalise post-booking statuses into 'Closed' column so they remain visible
          const POST_BOOKING = ['loan application created', 'loan sanctioned', 'loan disbursed', 'registration done', 'possession given'];
          const normaliseStatus = (s: string) => POST_BOOKING.includes(s.toLowerCase()) ? 'closed' : s.toLowerCase();
          const stageLeads = filtered.filter(l => normaliseStatus(l.status) === stage.toLowerCase());
              const style = STAGE_COLOR[stage] ?? { bg: 'bg-slate-50', text: 'text-slate-600', dot: '#94a3b8' };
              return (
                <div key={stage} className="min-w-[230px] flex-shrink-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: style.dot }} />
                    <h3 className="text-xs font-bold text-slate-700 truncate">{stage}</h3>
                    <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5 shrink-0">{stageLeads.length}</span>
                  </div>
                  <div className="space-y-2">
                    {stageLeads.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-100 py-5 text-center">
                        <p className="text-[11px] text-slate-300">No leads</p>
                      </div>
                    )}
                    {stageLeads.map(lead => (
                      <div
                        key={lead.id}
                        className={`bg-white rounded-xl p-3 border shadow-sm text-xs transition-all cursor-pointer ${
                          isDealActive(lead.status)
                            ? 'border-amber-200 hover:border-amber-300 hover:shadow-md'
                            : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
                        }`}
                        onClick={() => openDealPanel(lead)}
                      >
                        {/* Customer name + status badge */}
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <p className="font-bold text-slate-800 text-[13px] leading-snug flex-1 min-w-0 truncate">{lead.customerName}</p>
                          <div className="flex items-center gap-1 shrink-0">
                            {isDealActive(lead.status) && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                Deal Active
                              </span>
                            )}
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                              {stage}
                            </span>
                          </div>
                        </div>

                        {/* Project */}
                        <p className="text-slate-500 truncate mb-2 flex items-center gap-1">
                          <Building2 size={9} className="shrink-0" /> {lead.projectName}
                        </p>

                        {/* Commission + deal value */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {lead.estimatedCommission && (
                            <span className="flex items-center gap-0.5 text-teal-700 font-bold">
                              <IndianRupee size={9} />{fmt(lead.estimatedCommission)}
                            </span>
                          )}
                          {lead.commissionStatus && (
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${COMM_STATUS_COLOR[lead.commissionStatus] ?? 'bg-slate-100 text-slate-600'}`}>
                              {lead.commissionStatus}
                            </span>
                          )}
                        </div>

                        {/* Added date */}
                        <p className="text-[10px] text-slate-400 mb-2">
                          Added {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                          <div className="flex gap-1">
                            <a href={`tel:${lead.customerPhone}`}
                              onClick={e => e.stopPropagation()}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-teal-600 transition-colors" title="Call">
                              <Phone size={12} />
                            </a>
                            <a href={`https://wa.me/91${lead.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${lead.customerName.split(' ')[0]}! Following up on ${lead.projectName}. 😊`)}`}
                              target="_blank" rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors" title="WhatsApp">
                              <MessageSquare size={12} />
                            </a>
                            <button
                              onClick={e => { e.stopPropagation(); setMeetingLead(lead); setMeetingDate(''); setMeetingTime(''); }}
                              className="p-1.5 rounded-lg hover:bg-teal-50 text-slate-400 hover:text-teal-600 transition-colors" title="Schedule Meeting">
                              <Calendar size={12} />
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            {lead.status === 'Booked' && (
                              <CheckCircle2 size={13} className="text-emerald-500" />
                            )}
                            <span className={`text-[9px] font-semibold ${isDealActive(lead.status) ? 'text-amber-600' : 'text-slate-400'}`}>View →</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Lead Modal ── */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAddOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Plus size={16} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Add New Lead</p>
                  <p className="text-xs text-gray-500">Lead will appear in builder's pipeline too</p>
                </div>
              </div>
              <button onClick={() => setAddOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={14} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Project selection */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Project <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={addProject?.id ?? ''}
                    onChange={e => {
                      const p = projects.find(p => p.id === Number(e.target.value));
                      setAddProject(p ?? null);
                    }}
                    className="w-full appearance-none px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400">
                    <option value="">Select a project…</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.city ? ` · ${p.city}` : ''}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Customer name */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Customer Name</label>
                <input value={addName} onChange={e => setAddName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400" />
              </div>

              {/* Customer phone */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Customer Phone <span className="text-red-500">*</span></label>
                <input value={addPhone} onChange={e => setAddPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  type="tel" maxLength={10}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400" />
              </div>

              {/* Customer email (optional) */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Email <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={addEmail} onChange={e => setAddEmail(e.target.value)}
                  placeholder="customer@email.com"
                  type="email"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400" />
              </div>
            </div>

            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={handleAddLead}
                disabled={!addProject || !addPhone.trim() || addSubmitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
                {addSubmitting ? <><Loader2 size={13} className="animate-spin" /> Adding…</> : <><Plus size={13} /> Add Lead</>}
              </button>
              <button onClick={() => setAddOpen(false)} className="px-4 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule Meeting Modal ── */}
      {meetingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMeetingLead(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Calendar size={16} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Schedule Meeting</p>
                  <p className="text-xs text-gray-500">{meetingLead.customerName} · {meetingLead.projectName}</p>
                </div>
              </div>
              <button onClick={() => setMeetingLead(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={14} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <DatePickerField
                  label="Preferred Date"
                  value={meetingDate}
                  onChange={async v => {
                    setMeetingDate(v); setMeetingTime('');
                    if (v && meetingLead) {
                      const project = projects.find(p => p.name === meetingLead.projectName);
                      if (project?.builderId) {
                        portalApi.getBookedSlots(project.builderId, v)
                          .then(s => setMeetingBookedSlots(s ?? []))
                          .catch(() => setMeetingBookedSlots([]));
                      }
                    }
                  }}
                  minDate={new Date().toISOString().split('T')[0]}
                  fromYear={new Date().getFullYear()}
                  toYear={new Date().getFullYear() + 2}
                />
              </div>
              {meetingDate && (
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">Preferred Time</label>
                  <div className="flex flex-wrap gap-2">
                    {TIME_SLOTS.map(slot => {
                      const isBooked   = meetingBookedSlots.includes(slot);
                      const isSelected = meetingTime === slot;
                      return (
                        <button key={slot}
                          disabled={isBooked}
                          onClick={() => !isBooked && setMeetingTime(slot)}
                          title={isBooked ? 'Already booked' : undefined}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            isBooked    ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed line-through'
                            : isSelected ? 'bg-teal-600 text-white border-teal-600'
                            :              'bg-gray-50 text-gray-600 border-gray-200 hover:border-teal-300'
                          }`}>
                          {slot}{isBooked ? ' ·Full' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 pb-5 flex gap-2">
              <button onClick={handleScheduleMeeting} disabled={!meetingDate || !meetingTime || meetingSubmitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
                {meetingSubmitting ? <><Loader2 size={13} className="animate-spin" /> Scheduling…</> : <><CalendarCheck size={13} /> Confirm Booking</>}
              </button>
              <button onClick={() => { setMeetingLead(null); setMeetingDate(''); setMeetingTime(''); }}
                className="px-4 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Deal Panel ── */}
      {dealPanelLead && (
        <DealPanel
          lead={dealPanelLead}
          dealDetail={dealDetail}
          loading={dealDetailLoading}
          cpUserId={user!.id}
          onClose={() => setDealPanelLead(null)}
          onRefresh={() => loadDealDetail(dealPanelLead)}
        />
      )}
    </DashboardLayout>
  );
};

export default CPLeads;
