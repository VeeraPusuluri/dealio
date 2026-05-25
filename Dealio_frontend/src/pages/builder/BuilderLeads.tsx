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
import { Phone, FileText, Search, Download, ChevronRight, Loader2, Building2, X, Mail, MapPin, Clock, User, Calendar, IndianRupee, Tag, MessageSquare, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const stages: LeadStage[] = ['New Lead', 'Meeting Requested', 'Meeting Confirmed', 'Meeting Done', 'Negotiation', 'Booked', 'Closed'];

const stageToMilestone: Record<string, string> = {
  'New Lead': 'Enquiry', 'Meeting Requested': 'Site Visit Scheduled', 'Meeting Confirmed': 'Site Visit Scheduled',
  'Meeting Done': 'Site Visit Done', 'Negotiation': 'Negotiation', 'Booked': 'Booked', 'Closed': 'Possession Given',
};

// Map backend enum values to display labels
const STAGE_MAP: Record<string, LeadStage> = {
  NEW_LEAD: 'New Lead',
  MEETING_REQUESTED: 'Meeting Requested',
  MEETING_CONFIRMED: 'Meeting Confirmed',
  MEETING_DONE: 'Meeting Done',
  NEGOTIATION: 'Negotiation',
  BOOKED: 'Booked',
  CLOSED: 'Closed',
};

// Map display label back to backend enum
const STAGE_ENUM: Record<string, string> = {
  'New Lead': 'NEW_LEAD',
  'Meeting Requested': 'MEETING_REQUESTED',
  'Meeting Confirmed': 'MEETING_CONFIRMED',
  'Meeting Done': 'MEETING_DONE',
  'Negotiation': 'NEGOTIATION',
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
  customerName: string;
  customerPhone: string;
  projectName: string;
}

const VALID_STAGES = ['New Lead', 'Meeting Requested', 'Meeting Confirmed', 'Meeting Done', 'Negotiation', 'Booked', 'Closed'];

function dealToLead(d: ApiDeal) {
  const stage = VALID_STAGES.includes(d.status) ? d.status as LeadStage : 'New Lead';
  return {
    id: `deal-${d.id}`,
    customerName: d.customerName,
    projectName: d.projectName,
    stage,
    budget: d.dealValue ?? 0,
    cpName: 'Direct',
    source: 'Direct Enquiry',
    unitType: '—',
    daysInStage: Math.max(0, Math.floor((Date.now() - new Date(d.createdAt).getTime()) / 86_400_000)),
    createdAt: d.createdAt,
    followUps: 0, documents: 0, lastContact: d.createdAt,
  };
}

function apiLeadToRow(l: ApiLead) {
  const stage = (STAGE_MAP[l.stage] ?? l.stage) as LeadStage;
  return {
    id: `lead-${l.id}`,
    numericId: l.id,
    customerName: l.customerName,
    projectName: l.project?.name ?? '—',
    stage: VALID_STAGES.includes(stage) ? stage : 'New Lead' as LeadStage,
    budget: l.budget ?? 0,
    cpName: l.owner?.fullName ?? 'Direct',
    source: l.source ?? 'Customer Portal',
    unitType: '—',
    daysInStage: l.daysInStage,
    createdAt: l.createdAt,
    followUps: 0, documents: 0, lastContact: l.updatedAt,
    phone: l.phone,
    email: l.email ?? '',
    city: l.city ?? '',
    notes: l.notes ?? '',
  };
}

const NEXT_STAGES: Record<string, LeadStage[]> = {
  'New Lead': ['Meeting Requested', 'Negotiation', 'Closed'],
  'Meeting Requested': ['Meeting Confirmed', 'Meeting Done', 'Negotiation', 'Closed'],
  'Meeting Confirmed': ['Meeting Done', 'Negotiation', 'Closed'],
  'Meeting Done': ['Negotiation', 'Booked', 'Closed'],
  'Negotiation': ['Booked', 'Closed'],
  'Booked': ['Closed'],
  'Closed': [],
};

const BuilderLeads = () => {
  const navigate = useNavigate();
  const { callLogs } = useFollowUpStore();
  const [apiLeads, setApiLeads] = useState<ReturnType<typeof apiLeadToRow>[]>([]);
  const [loading, setLoading] = useState(true);
  const [callLogTarget, setCallLogTarget] = useState<{ id: string; name: string; project: string } | null>(null);
  const [docModal, setDocModal] = useState<{ type: 'booking' | 'allotment'; data: Record<string, string> } | null>(null);
  const [stageModal, setStageModal] = useState<{ id: string; numericId: number; name: string; currentStage: LeadStage } | null>(null);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [drawerLead, setDrawerLead] = useState<ReturnType<typeof apiLeadToRow> | null>(null);

  const loadLeads = async () => {
    let builderId = builderApi.getCachedBuilderId();
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

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="la-banner px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors" title="Back">
              <ArrowLeft size={16} />
            </button>
            <h2 className="text-lg font-bold text-slate-800">Leads & Meetings</h2>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer, project, or CP name..." className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm outline-none text-slate-700 placeholder:text-slate-400 shadow-sm focus:border-teal-300 focus:ring-2 focus:ring-teal-100 transition-all" />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 outline-none shadow-sm">
              <option>All</option>{projects.map(p => <option key={p}>{p}</option>)}
            </select>
            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 outline-none shadow-sm">
              <option>All</option>{sources.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)} className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 outline-none shadow-sm">
              <option>All</option><option>Hot</option><option>Warm</option><option>Cold</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as 'date' | 'score' | 'value')} className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 outline-none shadow-sm">
              <option value="date">Sort: Date</option><option value="score">Sort: Score</option><option value="value">Sort: Value</option>
            </select>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl border border-teal-100">
            <span className="text-sm font-medium text-teal-800">{selected.size} selected</span>
            <button onClick={handleExport} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1 shadow-sm" style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}><Download size={12} /> Export CSV</button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-teal-500" />
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-gradient-to-br from-teal-50 to-white border-2 border-dashed border-teal-100 rounded-3xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-4">
              <Building2 size={28} className="text-teal-600" />
            </div>
            <p className="font-semibold text-slate-700 mb-1">No leads yet</p>
            <p className="text-sm text-slate-400">Leads will appear here once customers book meetings or deals are created.</p>
          </div>
        ) : null}

        {!loading && leads.length > 0 && <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageLeads = sortedLeads.filter((l) => l.stage === stage);
            return (
              <div key={stage} className="min-w-[250px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: leadStageColors[stage] }} />
                  <h3 className="text-sm font-semibold text-slate-700">{stage}</h3>
                  <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{stageLeads.length}</span>
                </div>
                <div className="space-y-2">
                  {stageLeads.map((lead) => {
                    const score = calculateLeadScore(lead);
                    const lastCall = callLogs.filter((c) => c.leadId === lead.id).pop();
                    const milestone = stageToMilestone[lead.stage] || 'Enquiry';
                    const numericId = lead.numericId;
                    const nextStages = NEXT_STAGES[lead.stage] ?? [];

                    return (
                      <div
                        key={lead.id}
                        className="bg-white rounded-xl p-3 relative cursor-pointer hover:shadow-md transition-all duration-150"
                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)' }}
                        onClick={() => setDrawerLead(lead)}
                      >
                        <input type="checkbox" checked={selected.has(lead.id)} onChange={() => toggleSelect(lead.id)}
                          onClick={e => e.stopPropagation()} className="absolute top-2 right-2" />
                        <div className="flex items-center justify-between pr-6">
                          <p className="font-semibold text-sm text-slate-800">{lead.customerName}</p>
                          <LeadScoreBadge score={score} />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{lead.projectName} · {lead.unitType}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-semibold text-teal-600">{formatCurrency(lead.budget)}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${lead.daysInStage < 3 ? 'bg-emerald-50 text-emerald-700' : lead.daysInStage <= 7 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
                            {lead.daysInStage}d
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5">CP: {lead.cpName}</p>
                        {lastCall && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block ${outcomeColors[lastCall.outcome] || 'bg-slate-100 text-slate-500'}`}>{lastCall.outcome}</span>}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                          <MilestoneChip milestone={milestone} />
                          <div className="flex gap-1">
                            <button
                              onClick={e => { e.stopPropagation(); setCallLogTarget({ id: lead.id, name: lead.customerName, project: lead.projectName }); }}
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="Log Call"
                            >
                              <Phone size={12} />
                            </button>
                            {lead.stage === 'Closed' && (
                              <button onClick={e => { e.stopPropagation(); setDocModal({ type: 'allotment', data: { customer: lead.customerName, project: lead.projectName, unit: lead.unitType, totalPrice: formatCurrency(lead.budget), unitType: lead.unitType } }); }}
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="Generate Allotment">
                                <FileText size={12} />
                              </button>
                            )}
                            {lead.stage === 'Booked' && (
                              <button onClick={e => { e.stopPropagation(); setDocModal({ type: 'booking', data: { customer: lead.customerName, project: lead.projectName, unit: lead.unitType, bookingAmount: formatCurrency(lead.budget * 0.1), totalPrice: formatCurrency(lead.budget), builder: 'Builder', cp: lead.cpName } }); }}
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="Generate Receipt">
                                <FileText size={12} />
                              </button>
                            )}
                            {numericId > 0 && nextStages.length > 0 && (
                              <button
                                onClick={e => { e.stopPropagation(); setStageModal({ id: lead.id, numericId, name: lead.customerName, currentStage: lead.stage }); }}
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="Change Status"
                              >
                                <ChevronRight size={12} />
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
        </div>}
      </div>

      {/* ── Lead Detail Drawer ─────────────────────────────────────────────── */}
      {drawerLead && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setDrawerLead(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0 bg-gradient-to-r from-teal-50/60 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{drawerLead.customerName}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: leadStageColors[drawerLead.stage] }} />
                    <span className="text-xs text-slate-400">{drawerLead.stage}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setDrawerLead(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40">

              {/* Contact */}
              <div className="bg-white rounded-xl p-4 space-y-2.5 shadow-sm">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Contact Details</p>
                {drawerLead.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone size={14} className="text-teal-500 shrink-0" />
                    <a href={`tel:${drawerLead.phone}`} className="text-sm font-medium text-slate-700 hover:text-teal-600 transition-colors">{drawerLead.phone}</a>
                  </div>
                )}
                {drawerLead.email && (
                  <div className="flex items-center gap-2.5">
                    <Mail size={14} className="text-teal-500 shrink-0" />
                    <a href={`mailto:${drawerLead.email}`} className="text-sm font-medium text-slate-700 hover:text-teal-600 transition-colors">{drawerLead.email}</a>
                  </div>
                )}
                {drawerLead.city && (
                  <div className="flex items-center gap-2.5">
                    <MapPin size={14} className="text-teal-500 shrink-0" />
                    <span className="text-sm text-slate-700">{drawerLead.city}</span>
                  </div>
                )}
              </div>

              {/* Project & Meeting */}
              <div className="bg-white rounded-xl p-4 space-y-2.5 shadow-sm">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Project & Meeting</p>
                <div className="flex items-center gap-2.5">
                  <Building2 size={14} className="text-teal-500 shrink-0" />
                  <span className="text-sm font-medium text-slate-700">{drawerLead.projectName}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Tag size={14} className="text-teal-500 shrink-0" />
                  <span className="text-sm text-slate-600">Stage: <span className="font-semibold text-slate-800">{drawerLead.stage}</span></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock size={14} className="text-teal-500 shrink-0" />
                  <span className="text-sm text-slate-600">{drawerLead.daysInStage} day{drawerLead.daysInStage !== 1 ? 's' : ''} in current stage</span>
                </div>
                {drawerLead.budget > 0 && (
                  <div className="flex items-center gap-2.5">
                    <IndianRupee size={14} className="text-teal-500 shrink-0" />
                    <span className="text-sm text-slate-600">Budget: <span className="font-semibold text-slate-800">{formatCurrency(drawerLead.budget)}</span></span>
                  </div>
                )}
              </div>

              {/* Lead Info */}
              <div className="bg-white rounded-xl p-4 space-y-2.5 shadow-sm">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Lead Info</p>
                <div className="flex items-center gap-2.5">
                  <User size={14} className="text-teal-500 shrink-0" />
                  <span className="text-sm text-slate-600">CP / Owner: <span className="font-medium text-slate-800">{drawerLead.cpName}</span></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Tag size={14} className="text-teal-500 shrink-0" />
                  <span className="text-sm text-slate-600">Source: <span className="font-medium text-slate-800">{drawerLead.source}</span></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Calendar size={14} className="text-teal-500 shrink-0" />
                  <span className="text-sm text-slate-600">Created: <span className="font-medium text-slate-800">{new Date(drawerLead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock size={14} className="text-slate-300 shrink-0" />
                  <span className="text-sm text-slate-600">Last updated: <span className="font-medium text-slate-800">{new Date(drawerLead.lastContact).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
                </div>
              </div>

              {/* Notes */}
              {drawerLead.notes && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Notes</p>
                  <div className="flex items-start gap-2.5">
                    <MessageSquare size={14} className="text-teal-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 leading-relaxed">{drawerLead.notes}</p>
                  </div>
                </div>
              )}

              {/* Move to next stage */}
              {drawerLead.numericId > 0 && (NEXT_STAGES[drawerLead.stage] ?? []).length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">Move to Stage</p>
                  <div className="space-y-2">
                    {(NEXT_STAGES[drawerLead.stage] ?? []).map(nextStage => (
                      <button
                        key={nextStage}
                        onClick={() => {
                          setStageModal({ id: drawerLead.id, numericId: drawerLead.numericId, name: drawerLead.customerName, currentStage: drawerLead.stage });
                          setDrawerLead(null);
                        }}
                        className="w-full text-left px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all text-sm font-medium text-slate-700 flex items-center justify-between shadow-sm"
                      >
                        <span>{nextStage}</span>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: leadStageColors[nextStage] }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="border-t border-slate-100 px-5 py-4 flex gap-2 flex-shrink-0 bg-white">
              <button
                onClick={() => { setCallLogTarget({ id: drawerLead.id, name: drawerLead.customerName, project: drawerLead.projectName }); setDrawerLead(null); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Phone size={14} /> Log Call
              </button>
              {drawerLead.stage === 'Booked' && (
                <button
                  onClick={() => { setDocModal({ type: 'booking', data: { customer: drawerLead.customerName, project: drawerLead.projectName, unit: drawerLead.unitType, bookingAmount: formatCurrency(drawerLead.budget * 0.1), totalPrice: formatCurrency(drawerLead.budget), builder: 'Builder', cp: drawerLead.cpName } }); setDrawerLead(null); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}
                >
                  <FileText size={14} /> Booking Receipt
                </button>
              )}
              {drawerLead.stage === 'Closed' && (
                <button
                  onClick={() => { setDocModal({ type: 'allotment', data: { customer: drawerLead.customerName, project: drawerLead.projectName, unit: drawerLead.unitType, totalPrice: formatCurrency(drawerLead.budget), unitType: drawerLead.unitType } }); setDrawerLead(null); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}
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
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-800">Update Lead Status</h3>
            <p className="text-sm text-slate-500">{stageModal.name}</p>
            <p className="text-xs text-slate-400">Current: <span className="font-medium text-slate-700">{stageModal.currentStage}</span></p>
            <div className="space-y-2">
              {(NEXT_STAGES[stageModal.currentStage] ?? []).map(nextStage => (
                <button
                  key={nextStage}
                  onClick={() => handleStageChange(nextStage)}
                  disabled={updatingStage}
                  className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all text-sm font-medium text-slate-700 disabled:opacity-50 flex items-center justify-between"
                >
                  <span>{nextStage}</span>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: leadStageColors[nextStage] }} />
                </button>
              ))}
            </div>
            <button onClick={() => setStageModal(null)} className="w-full text-sm text-slate-400 hover:text-slate-600 py-1">
              Cancel
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default BuilderLeads;