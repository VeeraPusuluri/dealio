import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { builderApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import MilestoneChip from '@/components/shared/MilestoneChip';
import LeadScoreBadge from '@/components/shared/LeadScoreBadge';
import { LeadStage, leadStageColors } from '@/data/leads';
import { formatCurrency } from '@/lib/format';
import { calculateLeadScore } from '@/lib/leadScoring';
import { useFollowUpStore } from '@/stores/useFollowUpStore';
import CallLogModal from '@/components/shared/CallLogModal';
import { outcomeColors } from '@/components/shared/CallLogModal';
import DocumentPreviewModal from '@/components/shared/DocumentPreviewModal';
import { Phone, FileText, Search, Download, ChevronRight, Loader2, Building2, X, Mail, MapPin, Clock, User, Calendar, IndianRupee, Tag, MessageSquare, ArrowLeft, CheckCircle, Bookmark, RefreshCw, AlertCircle, CheckCircle2, Route } from 'lucide-react';
import CustomerJourneyTab from '@/components/shared/CustomerJourneyTab';

interface UnitShortlistItem {
  id: number;
  projectId: number;
  projectName: string;
  customerName: string;
  customerPhone: string;
  unitId: string;
  unitDetails: { bhk?: string; areaSqft?: number; price?: number; floor?: number; facing?: string; };
  status: 'Pending' | 'Accepted' | 'SuggestOther';
  builderNote: string | null;
  createdAt: string;
}
import { toast } from 'sonner';

const stages: LeadStage[] = ['New Lead', 'Profile Created', 'Meeting Requested', 'Meeting Confirmed', 'Meeting Done', 'Negotiation', 'Agreement', 'Pending Booking', 'Booked', 'Closed'];

const stageToMilestone: Record<string, string> = {
  'New Lead': 'Enquiry', 'Profile Created': 'Enquiry',
  'Meeting Requested': 'Site Visit Scheduled', 'Meeting Confirmed': 'Site Visit Scheduled',
  'Meeting Done': 'Site Visit Done', 'Negotiation': 'Negotiation',
  'Agreement': 'Agreement', 'Pending Booking': 'Booked', 'Booked': 'Booked', 'Closed': 'Possession Given',
};

// Map backend enum values to display labels
const STAGE_MAP: Record<string, LeadStage> = {
  NEW_LEAD: 'New Lead',
  PROFILE_CREATED: 'Profile Created',
  'Profile Created': 'Profile Created',
  MEETING_REQUESTED: 'Meeting Requested',
  MEETING_CONFIRMED: 'Meeting Confirmed',
  MEETING_DONE: 'Meeting Done',
  NEGOTIATION: 'Negotiation',
  Negotiation: 'Negotiation',
  AGREEMENT: 'Agreement',
  Agreement: 'Agreement',
  PENDING_BOOKING: 'Pending Booking',
  'Pending Booking': 'Pending Booking',
  BOOKED: 'Booked',
  Booked: 'Booked',
  CLOSED: 'Closed',
  Closed: 'Closed',
  // post-booking statuses → show under 'Closed' column
  'Loan Application Created': 'Closed',
  'Loan Sanctioned':          'Closed',
  'Loan Disbursed':           'Closed',
  'Registration Done':        'Closed',
  'Possession Given':         'Closed',
};

// Map display label back to backend enum
const STAGE_ENUM: Record<string, string> = {
  'New Lead': 'NEW_LEAD',
  'Profile Created': 'Profile Created',
  'Meeting Requested': 'MEETING_REQUESTED',
  'Meeting Confirmed': 'MEETING_CONFIRMED',
  'Meeting Done': 'MEETING_DONE',
  'Negotiation': 'NEGOTIATION',
  'Agreement': 'Agreement',
  'Pending Booking': 'Pending Booking',
  'Booked': 'BOOKED',
  'Closed': 'CLOSED',
};

interface ApiLead {
  id: number;
  customerName: string;
  phone: string;
  email?: string;
  city: string;
  stage: string;
  budget?: number;
  source?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  daysInStage: number;
  project?: { id: number; name: string };
  owner?: { id: number; fullName: string };
}

interface ApiDeal {
  id: number;
  status: string;
  dealValue: number | null;
  createdAt: string;
  updatedAt?: string;
  customerName: string;
  customerPhone: string;
  projectName: string;
  cpName?: string | null;
  cpId?: number | null;
}

const VALID_STAGES = ['New Lead', 'Profile Created', 'Meeting Requested', 'Meeting Confirmed', 'Meeting Done', 'Negotiation', 'Agreement', 'Pending Booking', 'Booked', 'Closed',
  'Loan Application Created', 'Loan Sanctioned', 'Loan Disbursed', 'Registration Done', 'Possession Given'];

function dealToLead(d: ApiDeal) {
  const stage = VALID_STAGES.includes(d.status) ? d.status as LeadStage : 'New Lead';
  return {
    id: `deal-${d.id}`,
    customerName: d.customerName,
    projectName: d.projectName,
    stage,
    budget: d.dealValue ?? 0,
    cpName: d.cpName ?? 'Direct',
    source: d.cpName ? 'CP Referral' : 'Direct Enquiry',
    unitType: '—',
    daysInStage: Math.max(0, Math.floor((Date.now() - new Date(d.createdAt).getTime()) / 86_400_000)),
    createdAt: d.createdAt,
    followUps: 0, documents: 0, lastContact: d.updatedAt ?? d.createdAt,
  };
}

function apiLeadToRow(l: ApiLead & { projectName?: string; cpName?: string }) {
  const stage = (STAGE_MAP[l.stage] ?? l.stage) as LeadStage;
  return {
    id: `lead-${l.id}`,
    numericId: Number(l.id),
    customerName: l.customerName,
    projectName: l.projectName ?? l.project?.name ?? '—',
    stage: VALID_STAGES.includes(stage) ? stage : 'New Lead' as LeadStage,
    budget: l.budget ?? 0,
    cpName: l.cpName ?? l.owner?.fullName ?? 'Direct',
    source: l.source ?? 'Customer Portal',
    unitType: '—',
    daysInStage: l.daysInStage,
    createdAt: l.createdAt,
    followUps: 0, documents: 0, lastContact: l.updatedAt ?? l.createdAt,
    phone: l.phone,
    email: l.email ?? '',
    city: l.city ?? '',
    notes: l.notes ?? '',
  };
}

const NEXT_STAGES: Record<string, LeadStage[]> = {
  'New Lead': ['Profile Created', 'Meeting Requested', 'Negotiation', 'Closed'],
  'Profile Created': ['Meeting Requested', 'Negotiation', 'Closed'],
  'Meeting Requested': ['Meeting Confirmed', 'Meeting Done', 'Negotiation', 'Closed'],
  'Meeting Confirmed': ['Meeting Done', 'Negotiation', 'Closed'],
  'Meeting Done': ['Negotiation', 'Agreement', 'Booked', 'Closed'],
  'Negotiation': ['Agreement', 'Booked', 'Closed'],
  'Agreement': ['Pending Booking', 'Booked', 'Closed'],
  'Pending Booking': ['Booked', 'Closed'],
  'Booked': ['Closed'],
  'Closed': [],
};

export function BuilderLeadsPanel({ builderId: externalBid, embedded }: { builderId?: string | null; embedded?: boolean } = {}) {
  const navigate = useNavigate();
  const { callLogs } = useFollowUpStore();
  const [apiLeads, setApiLeads] = useState<ReturnType<typeof apiLeadToRow>[]>([]);
  const [loading, setLoading] = useState(true);
  const [callLogTarget, setCallLogTarget] = useState<{ id: string; name: string; project: string } | null>(null);
  const [docModal, setDocModal] = useState<{ type: 'booking' | 'allotment'; data: Record<string, string> } | null>(null);
  const [stageModal, setStageModal] = useState<{ id: string; numericId: number; name: string; currentStage: LeadStage } | null>(null);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [drawerLead, setDrawerLead] = useState<ReturnType<typeof apiLeadToRow> | null>(null);
  const [drawerTab, setDrawerTab] = useState<'details' | 'journey'>('journey');

  const loadLeads = async () => {
    let builderId = externalBid ?? builderApi.getCachedBuilderId();
    if (!builderId) {
      try {
        const { user } = useAuthStore.getState();
        if (!user?.id) { setLoading(false); return; }
        const email = user.email || `uid${user.id}@dealio.builder`;
        const res = await builderApi.ensureBuilder(user.name || '', email, user.phone, user.id) as { builderId: number };
        builderId = String(res.builderId);
        builderApi.setCachedBuilderId(builderId);
      } catch {
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    try {
      const data = await builderApi.getBuilderLeads(builderId);
      setApiLeads(((data as ApiLead[]) || []).map(apiLeadToRow));
    } catch {
      try {
        const data = await builderApi.getBuilderDeals(builderId);
        setApiLeads(((data as ApiDeal[]) || []).map(d => ({ ...dealToLead(d), numericId: 0, phone: '', email: '', city: '', notes: '' })) as ReturnType<typeof apiLeadToRow>[]);
      } catch {
        setApiLeads([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLeads(); }, []);

  const handleStageChange = async (newStage: LeadStage) => {
    if (!stageModal || updatingStage) return;
    const builderId = builderApi.getCachedBuilderId();
    if (!builderId) { toast.error('Builder ID not found'); return; }
    setUpdatingStage(true);
    try {
      await builderApi.updateLeadStage(builderId, stageModal.numericId, STAGE_ENUM[newStage] ?? newStage);
      setApiLeads(prev => prev.map(l =>
        l.id === stageModal.id ? { ...l, stage: newStage } : l
      ));
      toast.success(`Lead moved to ${newStage}`);
      setStageModal(null);
    } catch {
      toast.error('Failed to update lead stage');
    } finally {
      setUpdatingStage(false);
    }
  };

  const leads = apiLeads;

  const [activeTab, setActiveTab] = useState<'leads' | 'shortlists'>('leads');
  const [shortlists, setShortlists] = useState<UnitShortlistItem[]>([]);
  const [shortlistsLoading, setShortlistsLoading] = useState(false);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [responseNote, setResponseNote] = useState('');
  const [respondModal, setRespondModal] = useState<UnitShortlistItem | null>(null);

  const loadShortlists = async () => {
    const builderId = builderApi.getCachedBuilderId();
    if (!builderId) return;
    setShortlistsLoading(true);
    try {
      const data = await builderApi.getBuilderShortlists(builderId);
      setShortlists((data as UnitShortlistItem[]) || []);
    } catch { toast.error('Failed to load shortlists'); }
    finally { setShortlistsLoading(false); }
  };

  useEffect(() => { if (activeTab === 'shortlists') loadShortlists(); }, [activeTab]);

  const handleRespond = async (status: 'Accepted' | 'SuggestOther') => {
    if (!respondModal) return;
    const builderId = builderApi.getCachedBuilderId();
    if (!builderId) return;
    setRespondingId(respondModal.id);
    try {
      await builderApi.respondToShortlist(builderId, respondModal.id, status, responseNote || undefined);
      setShortlists(prev => prev.map(s => s.id === respondModal.id ? { ...s, status, builderNote: responseNote || null } : s));
      toast.success(status === 'Accepted' ? 'Unit accepted! Customer notified.' : 'Suggestion sent to customer.');
      setRespondModal(null);
      setResponseNote('');
    } catch { toast.error('Failed to update'); }
    finally { setRespondingId(null); }
  };

  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [scoreFilter, setScoreFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'value'>('date');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const projects = [...new Set(leads.map(l => l.projectName))];
  const sources  = [...new Set(leads.map(l => l.source ?? 'Direct Enquiry'))];

  const filtered = leads.filter(l => {
    if (search && !l.customerName.toLowerCase().includes(search.toLowerCase()) && !l.projectName.toLowerCase().includes(search.toLowerCase()) && !l.cpName.toLowerCase().includes(search.toLowerCase())) return false;
    if (projectFilter !== 'All' && l.projectName !== projectFilter) return false;
    if (sourceFilter !== 'All' && l.source !== sourceFilter) return false;
    if (scoreFilter !== 'All') {
      const score = calculateLeadScore(l).total;
      if (scoreFilter === 'Hot' && score < 70) return false;
      if (scoreFilter === 'Warm' && (score < 40 || score >= 70)) return false;
      if (scoreFilter === 'Cold' && score >= 40) return false;
    }
    return true;
  });

  const sortedLeads = [...filtered].sort((a, b) => {
    if (sortBy === 'score') return calculateLeadScore(b).total - calculateLeadScore(a).total;
    if (sortBy === 'value') return b.budget - a.budget;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const toggleSelect = (id: string) => setSelected(prev => { const n = new Set(prev); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });

  const handleExport = () => {
    const selectedLeads = sortedLeads.filter(l => selected.has(l.id));
    const csv = 'Name,Project,Type,Budget,Stage,Source,CP\n' + selectedLeads.map(l => `${l.customerName},${l.projectName},${l.unitType},${l.budget},${l.stage},${l.source},${l.cpName}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leads.csv';
    a.click();
  };

  // Stat counts
  const totalLeads = leads.length;
  const hotLeads   = leads.filter(l => calculateLeadScore(l).total >= 70).length;
  const warmLeads  = leads.filter(l => { const s = calculateLeadScore(l).total; return s >= 40 && s < 70; }).length;
  const coldLeads  = leads.filter(l => calculateLeadScore(l).total < 40).length;
  const bookedLeads = leads.filter(l => l.stage === 'Booked' || l.stage === 'Closed').length;

  const sel = 'px-3 py-1.5 rounded-xl bg-card border border-border text-[12px] text-foreground outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all';

  const inner = (
    <>
      <div className={`flex flex-col gap-4 ${embedded ? 'h-full' : 'h-[calc(100vh-7rem)]'}`}>

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {!embedded && <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={16} />
            </button>}
            <div>
              <h2 className="text-[17px] font-bold text-foreground leading-tight">Leads & Pipeline</h2>
              <p className="text-[11px] text-muted-foreground">{totalLeads} lead{totalLeads !== 1 ? 's' : ''} across {stages.length} stages</p>
            </div>
          </div>
          <button onClick={loadLeads} disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
            <Loader2 size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit flex-shrink-0">
          {(['leads', 'shortlists'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all capitalize flex items-center gap-1.5 ${activeTab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t === 'leads' ? <><User size={12} /> Leads</> : <><Bookmark size={12} /> Unit Shortlists {shortlists.filter(s => s.status === 'Pending').length > 0 && <span className="w-4 h-4 rounded-full bg-amber-400 text-white text-[9px] font-bold flex items-center justify-center">{shortlists.filter(s => s.status === 'Pending').length}</span>}</>}
            </button>
          ))}
        </div>

        {/* ── Stat strip ── */}
        {activeTab === 'leads' && !loading && leads.length > 0 && (
          <div className="grid grid-cols-5 gap-2.5 flex-shrink-0">
            {[
              { label: 'Total', value: totalLeads, dot: '#0A7E8C', bg: 'bg-card' },
              { label: '🔴 Hot', value: hotLeads, dot: '#EF4444', bg: 'bg-red-50' },
              { label: '🟡 Warm', value: warmLeads, dot: '#F59E0B', bg: 'bg-amber-50' },
              { label: '🔵 Cold', value: coldLeads, dot: '#3B82F6', bg: 'bg-blue-50' },
              { label: 'Booked / Closed', value: bookedLeads, dot: '#10B981', bg: 'bg-emerald-50' },
            ].map(({ label, value, dot, bg }) => (
              <div key={label} className={`rounded-2xl border border-border ${bg} px-4 py-3 flex items-center gap-3`}>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
                  <p className="text-[20px] font-bold text-foreground leading-tight">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Shortlists panel ── */}
        {activeTab === 'shortlists' && (
          <div className="flex-1 overflow-y-auto space-y-3">
            {shortlistsLoading ? (
              <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
            ) : shortlists.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <Bookmark size={28} className="text-muted-foreground mb-3" />
                <p className="text-[13px] font-semibold text-foreground">No unit shortlists yet</p>
                <p className="text-[11px] text-muted-foreground mt-1">When customers shortlist units, they'll appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {shortlists.map(s => {
                  const isPending = s.status === 'Pending';
                  return (
                    <div key={s.id} className="bg-card rounded-2xl border border-border p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[14px] font-bold text-foreground">Unit {s.unitId}</p>
                          <p className="text-[11px] text-muted-foreground">{s.projectName}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${
                          s.status === 'Accepted' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                          s.status === 'SuggestOther' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                          'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>{s.status === 'Accepted' ? 'Accepted' : s.status === 'SuggestOther' ? 'Suggestion Sent' : 'Pending Review'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        <User size={12} /> <span className="font-medium text-foreground">{s.customerName}</span>
                        <a href={`tel:${s.customerPhone}`} className="flex items-center gap-1 ml-1 text-teal-600 hover:underline">
                          <Phone size={11} />{s.customerPhone}
                        </a>
                      </div>

                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        {s.unitDetails.bhk && <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">{s.unitDetails.bhk}</span>}
                        {s.unitDetails.areaSqft && <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">{s.unitDetails.areaSqft} sqft</span>}
                        {s.unitDetails.floor && <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">Floor {s.unitDetails.floor}</span>}
                        {s.unitDetails.facing && <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">{s.unitDetails.facing}</span>}
                      </div>

                      {s.builderNote && s.status === 'SuggestOther' && (
                        <p className="text-[11px] text-blue-700 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">Your note: {s.builderNote}</p>
                      )}

                      {isPending && (
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => { setRespondModal(s); setResponseNote(''); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold text-white hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
                            <CheckCircle2 size={13} /> Respond
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Search + filters ── */}
        {activeTab === 'leads' && (<><div className="flex gap-2 flex-wrap flex-shrink-0">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search customer, project or CP…"
              className="w-full pl-8 pr-4 py-2 rounded-xl bg-card border border-border text-[12px] outline-none text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all" />
          </div>
          <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className={sel}>
            <option>All</option>{projects.map(p => <option key={p}>{p}</option>)}
          </select>
          <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)} className={sel}>
            <option value="All">All Scores</option><option>Hot</option><option>Warm</option><option>Cold</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as 'date' | 'score' | 'value')} className={sel}>
            <option value="date">↕ Date</option><option value="score">↕ Score</option><option value="value">↕ Value</option>
          </select>
          {selected.size > 0 && (
            <>
              <button onClick={handleExport}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}>
                <Download size={12} /> Export {selected.size}
              </button>
              <button onClick={() => setSelected(new Set())} className="px-2 text-[12px] text-muted-foreground hover:text-foreground">✕</button>
            </>
          )}
        </div>

        {/* ── Leads Content ── */}
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-center p-12">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Building2 size={26} className="text-muted-foreground" />
            </div>
            <p className="text-[14px] font-bold text-foreground mb-1">No leads yet</p>
            <p className="text-[13px] text-muted-foreground max-w-xs">Leads will appear here once customers book meetings or channel partners submit enquiries.</p>
          </div>
        ) : (
          /* ── Kanban ── */
          <div className="flex gap-3 overflow-x-auto flex-1 min-h-0 pb-2">
            {stages.map(stage => {
              const stageLeads = sortedLeads.filter(l => l.stage === stage);
              const stageColor = leadStageColors[stage] || '#94a3b8';
              return (
                <div key={stage} className="flex flex-col min-w-[236px] max-w-[236px] flex-shrink-0">
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-2.5 px-0.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: stageColor }} />
                    <h3 className="text-[11px] font-bold text-foreground flex-1 truncate uppercase tracking-[0.06em]">{stage}</h3>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{stageLeads.length}</span>
                  </div>
                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 min-h-0">
                    {stageLeads.length === 0 && (
                      <div className="h-12 rounded-xl border border-dashed border-border flex items-center justify-center">
                        <span className="text-[11px] text-muted-foreground">—</span>
                      </div>
                    )}
                    {stageLeads.map(lead => {
                      const score = calculateLeadScore(lead);
                      const lastCall = callLogs.filter(c => c.leadId === lead.id).pop();
                      const milestone = stageToMilestone[lead.stage] || 'Enquiry';
                      const numericId = lead.numericId;
                      const nextStages = NEXT_STAGES[lead.stage] ?? [];
                      const initials = lead.customerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                      return (
                        <div key={lead.id}
                          className="bg-card rounded-xl border border-border p-3 cursor-pointer hover:border-ring/50 hover:shadow-md transition-all duration-150 relative group"
                          onClick={() => { setDrawerLead(lead); setDrawerTab('journey'); }}>
                          {/* Selection checkbox */}
                          <input type="checkbox" checked={selected.has(lead.id)} onChange={() => toggleSelect(lead.id)}
                            onClick={e => e.stopPropagation()}
                            className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {/* Customer row */}
                          <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white"
                              style={{ backgroundColor: stageColor }}>
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-bold text-foreground truncate">{lead.customerName}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{lead.projectName}</p>
                            </div>
                            <LeadScoreBadge score={score} />
                          </div>
                          {/* Budget + days */}
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold" style={{ color: '#0A7E8C' }}>
                              {lead.budget > 0 ? formatCurrency(lead.budget) : '—'}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                              lead.daysInStage < 3 ? 'bg-emerald-100 text-emerald-700' :
                              lead.daysInStage <= 7 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-600'}`}>
                              {lead.daysInStage}d
                            </span>
                          </div>
                          {/* CP + last call */}
                          <div className="flex items-center justify-between mt-1.5">
                            <p className="text-[9px] text-muted-foreground truncate max-w-[100px]">CP: {lead.cpName}</p>
                            {lastCall && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${outcomeColors[lastCall.outcome] || 'bg-muted text-muted-foreground'}`}>
                                {lastCall.outcome}
                              </span>
                            )}
                          </div>
                          {/* Agreement badge */}
                          {lead.stage === 'Agreement' && (
                            <div className="flex items-center gap-1 mt-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <FileText size={9} />
                              Agreement Stage · Awaiting Signature
                            </div>
                          )}
                          {/* Footer */}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                            <MilestoneChip milestone={milestone} />
                            <div className="flex gap-0.5">
                              <button onClick={e => { e.stopPropagation(); setCallLogTarget({ id: lead.id, name: lead.customerName, project: lead.projectName }); }}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Log Call">
                                <Phone size={11} />
                              </button>
                              {(lead.stage === 'Agreement' || lead.stage === 'Closed' || lead.stage === 'Booked') && (
                                <button onClick={e => { e.stopPropagation(); setDocModal({ type: lead.stage === 'Closed' ? 'allotment' : 'booking', data: { customer: lead.customerName, project: lead.projectName, unit: lead.unitType, totalPrice: formatCurrency(lead.budget), unitType: lead.unitType, bookingAmount: formatCurrency(lead.budget * 0.05), builder: 'Builder', cp: lead.cpName } }); }}
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Generate Document">
                                  <FileText size={11} />
                                </button>
                              )}
                              {numericId > 0 && nextStages.length > 0 && (
                                <button onClick={e => { e.stopPropagation(); setStageModal({ id: lead.id, numericId, name: lead.customerName, currentStage: lead.stage }); }}
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Move Stage">
                                  <ChevronRight size={11} />
                                </button>
                              )}
                            </div>
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
      </>) }
      </div>

      {/* ── Lead Detail Drawer ─────────────────────────────────────────────── */}
      {drawerLead && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setDrawerLead(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-card shadow-2xl flex flex-col overflow-hidden border-l border-border">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0A7E8C12 0%, transparent 100%)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#0A7E8C15', color: '#0A7E8C' }}>
                  <User size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{drawerLead.customerName}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: leadStageColors[drawerLead.stage] }} />
                    <span className="text-[11px] text-muted-foreground">{drawerLead.stage}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setDrawerLead(null)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-border flex-shrink-0">
              {([['journey', Route, 'Journey'] as const, ['details', User, 'Details'] as const]).map(([key, Icon, label]) => (
                <button key={key} onClick={() => setDrawerTab(key)}
                  className={`flex items-center gap-1.5 flex-1 py-2.5 text-[12px] font-semibold transition-all border-b-2 -mb-px ${
                    drawerTab === key ? 'border-[#0A7E8C] text-[#0A7E8C]' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}>
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-muted/20">

              {/* ── Journey Tab ── */}
              {drawerTab === 'journey' && (
                <CustomerJourneyTab
                  stage={drawerLead.stage}
                  customerName={drawerLead.customerName}
                  projectName={drawerLead.projectName}
                  dealValue={drawerLead.budget || null}
                  role="builder"
                  onCall={drawerLead.phone ? () => { window.open(`tel:${drawerLead.phone}`); } : undefined}
                  onWhatsApp={drawerLead.phone ? () => { window.open(`https://wa.me/91${drawerLead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${drawerLead.customerName.split(' ')[0]}! Following up on ${drawerLead.projectName}.`)}`); } : undefined}
                  onSendQuote={() => {
                    setDrawerLead(null);
                    // Navigate to deals page for this customer
                  }}
                />
              )}

              {/* ── Details Tab ── */}
              {drawerTab === 'details' && <>

              {/* Contact */}
              <div className="bg-card rounded-xl border border-border p-4 space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">Contact Details</p>
                {drawerLead.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone size={14} className="shrink-0" style={{ color: '#0A7E8C' }} />
                    <a href={`tel:${drawerLead.phone}`} className="text-[13px] font-medium text-foreground hover:opacity-70 transition-opacity">{drawerLead.phone}</a>
                  </div>
                )}
                {drawerLead.email && (
                  <div className="flex items-center gap-2.5">
                    <Mail size={14} className="shrink-0" style={{ color: '#0A7E8C' }} />
                    <a href={`mailto:${drawerLead.email}`} className="text-[13px] font-medium text-foreground hover:opacity-70 transition-opacity">{drawerLead.email}</a>
                  </div>
                )}
                {drawerLead.city && (
                  <div className="flex items-center gap-2.5">
                    <MapPin size={14} className="shrink-0" style={{ color: '#0A7E8C' }} />
                    <span className="text-[13px] text-foreground">{drawerLead.city}</span>
                  </div>
                )}
              </div>

              {/* Project & Meeting */}
              <div className="bg-card rounded-xl border border-border p-4 space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">Project & Meeting</p>
                <div className="flex items-center gap-2.5">
                  <Building2 size={14} className="shrink-0" style={{ color: '#0A7E8C' }} />
                  <span className="text-[13px] font-medium text-foreground">{drawerLead.projectName}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Tag size={14} className="shrink-0" style={{ color: '#0A7E8C' }} />
                  <span className="text-[13px] text-muted-foreground">Stage: <span className="font-semibold text-foreground">{drawerLead.stage}</span></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock size={14} className="shrink-0" style={{ color: '#0A7E8C' }} />
                  <span className="text-[13px] text-muted-foreground">{drawerLead.daysInStage} day{drawerLead.daysInStage !== 1 ? 's' : ''} in current stage</span>
                </div>
                {drawerLead.budget > 0 && (
                  <div className="flex items-center gap-2.5">
                    <IndianRupee size={14} className="shrink-0" style={{ color: '#0A7E8C' }} />
                    <span className="text-[13px] text-muted-foreground">Budget: <span className="font-semibold text-foreground">{formatCurrency(drawerLead.budget)}</span></span>
                  </div>
                )}
              </div>

              {/* Lead Info */}
              <div className="bg-card rounded-xl border border-border p-4 space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">Lead Info</p>
                <div className="flex items-center gap-2.5">
                  <User size={14} className="shrink-0" style={{ color: '#0A7E8C' }} />
                  <span className="text-[13px] text-muted-foreground">CP / Owner: <span className="font-medium text-foreground">{drawerLead.cpName}</span></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Tag size={14} className="shrink-0" style={{ color: '#0A7E8C' }} />
                  <span className="text-[13px] text-muted-foreground">Source: <span className="font-medium text-foreground">{drawerLead.source}</span></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Calendar size={14} className="shrink-0" style={{ color: '#0A7E8C' }} />
                  <span className="text-[13px] text-muted-foreground">Created: <span className="font-medium text-foreground">{new Date(drawerLead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-[13px] text-muted-foreground">Last updated: <span className="font-medium text-foreground">{new Date(drawerLead.lastContact).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
                </div>
              </div>

              {/* Visit Notes — shown when site visit has been completed */}
              {drawerLead.stage === 'Meeting Done' && drawerLead.notes && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">Visit Notes</p>
                  </div>
                  <p className="text-[13px] text-emerald-900 leading-relaxed pl-5">{drawerLead.notes}</p>
                </div>
              )}

              {/* General notes */}
              {drawerLead.notes && drawerLead.stage !== 'Meeting Done' && (
                <div className="bg-card rounded-xl border border-border p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">Notes</p>
                  <div className="flex items-start gap-2.5">
                    <MessageSquare size={14} className="shrink-0 mt-0.5" style={{ color: '#0A7E8C' }} />
                    <p className="text-[13px] text-foreground leading-relaxed">{drawerLead.notes}</p>
                  </div>
                </div>
              )}

              {/* Move to next stage */}
              {drawerLead.numericId > 0 && (NEXT_STAGES[drawerLead.stage] ?? []).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2 px-1">Move to Stage</p>
                  <div className="space-y-2">
                    {(NEXT_STAGES[drawerLead.stage] ?? []).map(nextStage => (
                      <button
                        key={nextStage}
                        onClick={() => {
                          setStageModal({ id: drawerLead.id, numericId: drawerLead.numericId, name: drawerLead.customerName, currentStage: drawerLead.stage });
                          setDrawerLead(null);
                        }}
                        className="w-full text-left px-4 py-2.5 rounded-xl bg-card border border-border hover:border-ring hover:bg-muted/30 transition-all text-[13px] font-medium text-foreground flex items-center justify-between"
                      >
                        <span>{nextStage}</span>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: leadStageColors[nextStage] }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              </> }
            </div>

            {/* Footer actions */}
            <div className="border-t border-border px-5 py-4 flex gap-2 flex-shrink-0 bg-card">
              <button
                onClick={() => { setCallLogTarget({ id: drawerLead.id, name: drawerLead.customerName, project: drawerLead.projectName }); setDrawerLead(null); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Phone size={14} /> Log Call
              </button>
              {drawerLead.stage === 'Booked' && (
                <button
                  onClick={() => { setDocModal({ type: 'booking', data: { customer: drawerLead.customerName, project: drawerLead.projectName, unit: drawerLead.unitType, bookingAmount: formatCurrency(drawerLead.budget * 0.1), totalPrice: formatCurrency(drawerLead.budget), builder: 'Builder', cp: drawerLead.cpName } }); setDrawerLead(null); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}
                >
                  <FileText size={14} /> Booking Receipt
                </button>
              )}
              {drawerLead.stage === 'Closed' && (
                <button
                  onClick={() => { setDocModal({ type: 'allotment', data: { customer: drawerLead.customerName, project: drawerLead.projectName, unit: drawerLead.unitType, totalPrice: formatCurrency(drawerLead.budget), unitType: drawerLead.unitType } }); setDrawerLead(null); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}
                >
                  <FileText size={14} /> Allotment Letter
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {callLogTarget && <CallLogModal open={!!callLogTarget} onClose={() => setCallLogTarget(null)} leadId={callLogTarget.id} customerName={callLogTarget.name} projectName={callLogTarget.project} />}
      {docModal && <DocumentPreviewModal open={!!docModal} onClose={() => setDocModal(null)} type={docModal.type} data={docModal.data} />}

      {/* Stage Change Modal */}
      {stageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setStageModal(null)} />
          <div className="relative bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl border border-border space-y-4">
            <h3 className="text-[15px] font-bold text-foreground">Update Lead Status</h3>
            <p className="text-[13px] text-foreground">{stageModal.name}</p>
            <p className="text-[12px] text-muted-foreground">Current: <span className="font-medium text-foreground">{stageModal.currentStage}</span></p>
            <div className="space-y-2">
              {(NEXT_STAGES[stageModal.currentStage] ?? []).map(nextStage => (
                <button
                  key={nextStage}
                  onClick={() => handleStageChange(nextStage)}
                  disabled={updatingStage}
                  className="w-full text-left px-4 py-3 rounded-xl border border-border hover:border-ring hover:bg-muted/30 transition-all text-[13px] font-medium text-foreground disabled:opacity-50 flex items-center justify-between"
                >
                  <span>{nextStage}</span>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: leadStageColors[nextStage] }} />
                </button>
              ))}
            </div>
            <button onClick={() => setStageModal(null)} className="w-full text-[13px] text-muted-foreground hover:text-foreground py-1">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Respond to Shortlist Modal ── */}
      {respondModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRespondModal(null)} />
          <div className="relative bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-border space-y-4 mx-4">
            <h3 className="text-[15px] font-bold text-foreground">Respond to Shortlist</h3>
            <div className="p-3 rounded-xl bg-muted/50 border border-border text-[12px] space-y-1">
              <p className="font-semibold text-foreground">Unit {respondModal.unitId} — {respondModal.projectName}</p>
              <p className="text-muted-foreground">By {respondModal.customerName} ({respondModal.customerPhone})</p>
              {respondModal.unitDetails.bhk && <p className="text-muted-foreground">{respondModal.unitDetails.bhk}{respondModal.unitDetails.areaSqft ? ` · ${respondModal.unitDetails.areaSqft} sqft` : ''}</p>}
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">Note to customer (optional)</label>
              <textarea value={responseNote} onChange={e => setResponseNote(e.target.value)} rows={3}
                placeholder="e.g. This unit is available and reserved for you. / We suggest Tower B, Floor 8 instead."
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none placeholder:text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleRespond('Accepted')} disabled={!!respondingId}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold text-white disabled:opacity-60 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
                {respondingId ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={13} />} Accept Unit
              </button>
              <button onClick={() => handleRespond('SuggestOther')} disabled={!!respondingId}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold border border-border text-foreground hover:bg-muted disabled:opacity-60 transition-colors">
                {respondingId ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={13} />} Suggest Other
              </button>
            </div>
            <button onClick={() => setRespondModal(null)} className="w-full text-[12px] text-muted-foreground hover:text-foreground py-1">Cancel</button>
          </div>
        </div>
      )}
    </>
  );
  return embedded ? inner : <DashboardLayout>{inner}</DashboardLayout>;
}

const BuilderLeads = () => <BuilderLeadsPanel />;
export default BuilderLeads;