import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLeadStore } from '@/stores/useLeadStore';
import { LeadStage, leadStageColors } from '@/data/leads';
import { formatCurrency } from '@/lib/format';
import { Plus, Phone, MessageSquare, Search, Download, Calendar, CalendarCheck, Loader2, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MilestoneChip from '@/components/shared/MilestoneChip';
import LeadScoreBadge from '@/components/shared/LeadScoreBadge';
import { calculateLeadScore } from '@/lib/leadScoring';
import { useFollowUpStore, type CallLog } from '@/stores/useFollowUpStore';
import CallLogModal from '@/components/shared/CallLogModal';
import { outcomeColors } from '@/components/shared/CallLogModal';
import { builderApi, portalApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';

interface PublicProject { id: number; builderId: number; name: string; }
const TIME_SLOTS = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

const stages: LeadStage[] = ['New Lead', 'Meeting Requested', 'Meeting Confirmed', 'Meeting Done', 'Negotiation', 'Booked', 'Closed'];

const stageToMilestone: Record<string, string> = {
  'New Lead': 'Enquiry', 'Meeting Requested': 'Site Visit Scheduled', 'Meeting Confirmed': 'Site Visit Scheduled',
  'Meeting Done': 'Site Visit Done', 'Negotiation': 'Negotiation', 'Booked': 'Booked', 'Closed': 'Possession Given',
};

const CPLeads = () => {
  const navigate = useNavigate();
  const { leads } = useLeadStore();
  const { callLogs } = useFollowUpStore();
  const user = useAuthStore(s => s.user);
  const cpLeads = leads.filter(l => l.cpId === 'CP001' || true);
  const [callLogTarget, setCallLogTarget] = useState<{ id: string; name: string; project: string } | null>(null);

  // Meeting scheduling
  const [publicProjects, setPublicProjects] = useState<PublicProject[]>([]);
  const [meetingLead, setMeetingLead] = useState<typeof cpLeads[0] | null>(null);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingSubmitting, setMeetingSubmitting] = useState(false);

  useEffect(() => {
    builderApi.getPublicProjects()
      .then(data => setPublicProjects((data as PublicProject[]) || []))
      .catch(() => {});
  }, []);

  const handleScheduleMeeting = async () => {
    if (!meetingLead || !meetingDate || !meetingTime) return;
    const project = publicProjects.find(p => p.name === meetingLead.projectName);
    if (!project) { toast.error('Project not found in listings — contact builder directly.'); return; }
    setMeetingSubmitting(true);
    try {
      await portalApi.bookMeeting({
        builderId: project.builderId,
        projectId: project.id,
        customerName: meetingLead.customerName,
        customerPhone: meetingLead.phone,
        preferredDate: meetingDate,
        preferredTime: meetingTime,
        meetingType: 'Site Visit',
        notes: `Arranged by CP: ${user?.name || 'Channel Partner'}`,
      });
      toast.success(`Meeting scheduled for ${meetingLead.customerName}`);
      setMeetingLead(null); setMeetingDate(''); setMeetingTime('');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to schedule meeting');
    } finally { setMeetingSubmitting(false); }
  };

  // Search & filters
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [scoreFilter, setScoreFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'value'>('date');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const projects = [...new Set(cpLeads.map(l => l.projectName))];
  const sources = [...new Set(cpLeads.map(l => l.source))];

  const filtered = cpLeads.filter(l => {
    if (search && !l.customerName.toLowerCase().includes(search.toLowerCase()) && !l.projectName.toLowerCase().includes(search.toLowerCase())) return false;
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

  const toggleSelect = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleExport = () => {
    const sel = sortedLeads.filter(l => selected.has(l.id));
    const csv = 'Name,Project,Type,Budget,Stage,Source\n' + sel.map(l => `${l.customerName},${l.projectName},${l.unitType},${l.budget},${l.stage},${l.source}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'leads.csv'; a.click();
  };

  const getLastCall = (leadId: string): CallLog | undefined => {
    const logs = callLogs.filter((c) => c.leadId === leadId);
    return logs[logs.length - 1];
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-lg font-bold text-foreground">Lead Pipeline</h2>
          </div>
          <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-accent text-accent-foreground flex items-center gap-1.5"><Plus size={16} /> Add Lead</button>
        </div>

        {/* Search & filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer or project name..." className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted text-sm outline-none text-foreground" />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="px-3 py-1.5 rounded-lg bg-muted text-xs text-foreground outline-none">
              <option>All</option>{projects.map(p => <option key={p}>{p}</option>)}
            </select>
            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="px-3 py-1.5 rounded-lg bg-muted text-xs text-foreground outline-none">
              <option>All</option>{sources.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)} className="px-3 py-1.5 rounded-lg bg-muted text-xs text-foreground outline-none">
              <option>All</option><option>Hot</option><option>Warm</option><option>Cold</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="px-3 py-1.5 rounded-lg bg-muted text-xs text-foreground outline-none">
              <option value="date">Sort: Date</option><option value="score">Sort: Score</option><option value="value">Sort: Value</option>
            </select>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium text-card-foreground">{selected.size} selected</span>
            <button onClick={() => { const phones = sortedLeads.filter(l => selected.has(l.id)).map(l => l.phone).join(','); window.open(`https://wa.me/?text=${encodeURIComponent('Hi! Check out our latest properties on Dealio.')}`); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#25D366] text-white">Send WhatsApp</button>
            <button onClick={handleExport} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-secondary-foreground flex items-center gap-1"><Download size={12} /> Export CSV</button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground hover:text-card-foreground">Clear</button>
          </div>
        )}

        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.map(stage => {
            const stageLeads = sortedLeads.filter(l => l.stage === stage);
            return (
              <div key={stage} className="min-w-[240px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: leadStageColors[stage] }} />
                  <h3 className="text-xs font-semibold text-foreground">{stage}</h3>
                  <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">{stageLeads.length}</span>
                </div>
                <div className="space-y-2">
                  {stageLeads.map(lead => {
                    const score = calculateLeadScore(lead);
                    const lastCall = getLastCall(lead.id);
                    const milestone = stageToMilestone[lead.stage] || 'Enquiry';
                    const isStale = lead.stage === 'New Lead' && lead.daysInStage > 1;
                    const isColdRisk = lead.stage === 'New Lead' && lead.daysInStage > 3;
                    const needsPush = lead.stage === 'Meeting Done' && lead.daysInStage > 7;

                    return (
                      <div key={lead.id} className="bg-card rounded-lg p-3 card-shadow border border-border text-xs relative">
                        <input type="checkbox" checked={selected.has(lead.id)} onChange={() => toggleSelect(lead.id)} className="absolute top-2 right-2" />
                        <div className="flex items-center justify-between mb-1 pr-6">
                          <p className="font-semibold text-card-foreground text-sm">{lead.customerName}</p>
                          <LeadScoreBadge score={score} />
                        </div>
                        <p className="text-muted-foreground mt-1">{lead.projectName} · {lead.unitType}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-medium text-accent">{formatCurrency(lead.budget)}</span>
                          <span className="text-muted-foreground">{lead.source}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {isColdRisk && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Cold Risk</span>}
                          {isStale && !isColdRisk && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Stale</span>}
                          {needsPush && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Needs Push</span>}
                        </div>
                        {lastCall && <div className="mt-1.5"><span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${outcomeColors[lastCall.outcome] || 'bg-muted text-muted-foreground'}`}>{lastCall.outcome}</span></div>}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                          <MilestoneChip milestone={milestone} />
                          <div className="flex gap-1">
                            <button onClick={() => setCallLogTarget({ id: lead.id, name: lead.customerName, project: lead.projectName })} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Log Call"><Phone size={12} /></button>
                            <button onClick={() => window.open(`https://wa.me/91${lead.phone}`, '_blank')} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="WhatsApp"><MessageSquare size={12} /></button>
                            <button onClick={() => { setMeetingLead(lead); setMeetingDate(''); setMeetingTime(''); }} className="p-1 rounded hover:bg-secondary/10 text-muted-foreground hover:text-secondary transition-colors" title="Schedule Meeting"><Calendar size={12} /></button>
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
      </div>

      {callLogTarget && <CallLogModal open={!!callLogTarget} onClose={() => setCallLogTarget(null)} leadId={callLogTarget.id} customerName={callLogTarget.name} projectName={callLogTarget.project} />}

      {/* ── Schedule Meeting Modal ── */}
      {meetingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMeetingLead(null)} />
          <div className="relative bg-card rounded-2xl w-full max-w-md shadow-2xl border border-border overflow-hidden">

            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-secondary/5 to-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Calendar size={16} className="text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-card-foreground">Schedule Meeting</p>
                  <p className="text-xs text-muted-foreground">{meetingLead.customerName} · {meetingLead.projectName}</p>
                </div>
              </div>
              <button onClick={() => setMeetingLead(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <X size={14} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {!publicProjects.find(p => p.name === meetingLead.projectName) && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Project not found in published listings. Meeting request may fail.
                </p>
              )}

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">Preferred Date</label>
                <input
                  type="date"
                  value={meetingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => { setMeetingDate(e.target.value); setMeetingTime(''); }}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-sm text-foreground outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                />
              </div>

              {meetingDate && (
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">Preferred Time</label>
                  <div className="flex flex-wrap gap-2">
                    {TIME_SLOTS.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setMeetingTime(slot)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${meetingTime === slot ? 'bg-secondary text-white border-secondary shadow-sm' : 'bg-muted text-muted-foreground border-border hover:border-secondary/40 hover:text-secondary'}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={handleScheduleMeeting}
                disabled={!meetingDate || !meetingTime || meetingSubmitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}
              >
                {meetingSubmitting
                  ? <><Loader2 size={13} className="animate-spin" /> Scheduling…</>
                  : <><CalendarCheck size={13} /> Confirm Booking</>}
              </button>
              <button
                onClick={() => { setMeetingLead(null); setMeetingDate(''); setMeetingTime(''); }}
                className="px-4 py-2.5 rounded-xl text-sm border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CPLeads;
