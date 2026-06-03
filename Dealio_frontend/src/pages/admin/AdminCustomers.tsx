import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { milestoneStages, milestoneColors, MilestoneStage } from '@/stores/useCustomerMilestoneStore';
import { adminApi } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { X, ChevronRight, Search, RefreshCw } from 'lucide-react';

interface DealMilestone {
  id: number;
  status: string;
  dealValue: number | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: number; fullName: string; phone: string; email: string | null };
  project: { id: number; name: string; city: string };
  builder: { id: number; companyName: string } | null;
  cp: { id: number; user: { fullName: string } } | null;
  loanCase: { id: number; status: string } | null;
}

// Maps backend Deal status + LoanCase status → MilestoneStage
function deriveMilestoneStage(dealStatus: string, loanStatus?: string | null): MilestoneStage {
  if (dealStatus === 'Possession Given') return 'Possession Given';
  if (dealStatus === 'Registration Done' || dealStatus === 'CLOSED') return 'Registration Done';
  if (loanStatus === 'Disbursed' || loanStatus === 'DISBURSED' || dealStatus === 'LOAN_SANCTIONED') return 'Loan Disbursed';
  if (loanStatus === 'Sanctioned' || loanStatus === 'APPROVED') return 'Loan Sanctioned';
  if (loanStatus === 'Active' || loanStatus === 'UNDER_REVIEW' || loanStatus === 'SUBMITTED' || dealStatus === 'INTERESTED_LOAN_REQUIRED') return 'Loan Application Created';
  if (dealStatus === 'Booked' || dealStatus === 'BOOKED') return 'Booked';
  if (dealStatus === 'Negotiation' || dealStatus === 'NEGOTIATION') return 'Negotiation';
  if (dealStatus === 'Site Visit Done' || dealStatus === 'MEETING_COMPLETED') return 'Site Visit Done';
  if (dealStatus === 'Site Visit Scheduled') return 'Site Visit Scheduled';
  return 'Enquiry';
}

// Maps MilestoneStage back to a Deal status string for the PATCH call
function milestoneToStatus(stage: MilestoneStage): string {
  const map: Record<MilestoneStage, string> = {
    'Enquiry': 'Enquiry',
    'Site Visit Scheduled': 'Site Visit Scheduled',
    'Site Visit Done': 'Site Visit Done',
    'Negotiation': 'Negotiation',
    'Booked': 'Booked',
    'Loan Application Created': 'Loan Application Created',
    'Loan Sanctioned': 'Loan Sanctioned',
    'Loan Disbursed': 'Loan Disbursed',
    'Registration Done': 'Registration Done',
    'Possession Given': 'Possession Given',
  };
  return map[stage] ?? stage;
}

function daysAgo(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  return Math.floor((Date.now() - then) / 86_400_000);
}

const tabStages = ['All', 'Enquiry', 'Site Visit Done', 'Booked', 'Loan Application Created', 'Loan Sanctioned', 'Registration Done', 'Possession Given'];

const AdminCustomers = () => {
  const [deals, setDeals] = useState<DealMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [selectedDeal, setSelectedDeal] = useState<DealMilestone | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getDeals() as DealMilestone[];
      setDeals(data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = deals.filter(d => {
    const stage = deriveMilestoneStage(d.status, d.loanCase?.status);
    if (activeTab !== 'All' && stage !== activeTab) return false;
    if (searchTerm && !d.customer.fullName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const countForStage = (stage: string) =>
    deals.filter(d => deriveMilestoneStage(d.status, d.loanCase?.status) === stage).length;

  const handleMoveStage = async (deal: DealMilestone, newStage: MilestoneStage) => {
    try {
      await adminApi.updateDealMilestone(deal.id, milestoneToStatus(newStage));
      setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, status: milestoneToStatus(newStage) } : d));
      if (selectedDeal?.id === deal.id) setSelectedDeal(prev => prev ? { ...prev, status: milestoneToStatus(newStage) } : prev);
      toast.success(`Moved to ${newStage}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Customer Milestones</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search customer..."
                className="pl-9 pr-3 py-2 rounded-lg border border-input bg-card text-sm w-60"
              />
            </div>
            <button onClick={load} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Refresh">
              <RefreshCw size={14} className={`text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stage tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {tabStages.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${activeTab === tab ? 'text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              style={activeTab === tab ? { backgroundColor: 'hsl(265, 44%, 44%)' } : {}}
            >
              {tab === 'All' ? `All (${deals.length})` : `${tab.split(' ').slice(0, 2).join(' ')} (${countForStage(tab)})`}
            </button>
          ))}
        </div>

        {/* Loading / error states */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            Loading customer milestones...
          </div>
        )}
        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-16">
            <p className="text-sm text-destructive">{error}</p>
            <button onClick={load} className="px-4 py-2 rounded-lg bg-muted text-sm hover:bg-muted/80">Retry</button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            No customers found.
          </div>
        )}

        {/* Customer cards */}
        {!loading && !error && (
          <div className="grid gap-3">
            {filtered.map(d => {
              const stage = deriveMilestoneStage(d.status, d.loanCase?.status);
              const stageColor = milestoneColors[stage];
              const stageIdx = milestoneStages.indexOf(stage);
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDeal(d)}
                  className="bg-card rounded-lg border border-border p-4 cursor-pointer hover:border-purple-500/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: stageColor }}
                    >
                      {d.customer.fullName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-card-foreground">{d.customer.fullName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: stageColor }}>
                          {stage}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{d.project.name}{d.project.city ? ` · ${d.project.city}` : ''}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        {d.cp && <span>CP: {d.cp.user.fullName}</span>}
                        {d.dealValue && <span>{formatCurrency(d.dealValue)}</span>}
                        <span>{daysAgo(d.updatedAt)}d since update</span>
                      </div>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (stageIdx < milestoneStages.length - 1) handleMoveStage(d, milestoneStages[stageIdx + 1]);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary/10 text-secondary hover:bg-secondary/20 disabled:opacity-40"
                      disabled={stageIdx >= milestoneStages.length - 1}
                    >
                      Move Next →
                    </button>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Customer 360 drawer */}
        {selectedDeal && (() => {
          const stage = deriveMilestoneStage(selectedDeal.status, selectedDeal.loanCase?.status);
          return (
            <>
              <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSelectedDeal(null)} />
              <div className="fixed right-0 top-0 bottom-0 z-50 w-[520px] bg-card border-l border-border overflow-y-auto">
                <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
                  <h3 className="font-bold text-card-foreground">Customer 360 — {selectedDeal.customer.fullName}</h3>
                  <button onClick={() => setSelectedDeal(null)} className="p-1 hover:bg-muted rounded"><X size={18} /></button>
                </div>
                <div className="p-5 space-y-5">
                  {/* Personal */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Personal Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Name:</span> <span className="font-medium text-card-foreground">{selectedDeal.customer.fullName}</span></div>
                      <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium text-card-foreground">{selectedDeal.customer.phone}</span></div>
                      {selectedDeal.customer.email && (
                        <div className="col-span-2"><span className="text-muted-foreground">Email:</span> <span className="font-medium text-card-foreground">{selectedDeal.customer.email}</span></div>
                      )}
                    </div>
                  </div>

                  {/* Property */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Property</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Project:</span> <span className="font-medium text-card-foreground">{selectedDeal.project.name}</span></div>
                      <div><span className="text-muted-foreground">City:</span> <span className="font-medium text-card-foreground">{selectedDeal.project.city}</span></div>
                      {selectedDeal.dealValue && (
                        <div><span className="text-muted-foreground">Deal Value:</span> <span className="font-medium text-card-foreground">{formatCurrency(selectedDeal.dealValue)}</span></div>
                      )}
                      {selectedDeal.loanCase && (
                        <div><span className="text-muted-foreground">Loan Status:</span> <span className="font-medium text-card-foreground">{selectedDeal.loanCase.status}</span></div>
                      )}
                    </div>
                  </div>

                  {/* Stakeholders */}
                  {(selectedDeal.cp || selectedDeal.builder) && (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Stakeholders</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {selectedDeal.cp && <div><span className="text-muted-foreground">CP:</span> <span className="font-medium text-card-foreground">{selectedDeal.cp.user.fullName}</span></div>}
                        {selectedDeal.builder && <div><span className="text-muted-foreground">Builder:</span> <span className="font-medium text-card-foreground">{selectedDeal.builder.companyName}</span></div>}
                      </div>
                    </div>
                  )}

                  {/* Move Stage */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Move to Stage</label>
                    <select
                      onChange={e => { if (e.target.value) { handleMoveStage(selectedDeal, e.target.value as MilestoneStage); } e.target.value = ''; }}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm"
                    >
                      <option value="">Select stage...</option>
                      {milestoneStages.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Current stage info */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Current Stage</h4>
                    <div className="flex gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: milestoneColors[stage] }} />
                      <div>
                        <span className="font-medium text-card-foreground">{stage}</span>
                        <p className="text-xs text-muted-foreground">{new Date(selectedDeal.updatedAt).toLocaleDateString()} · Last updated</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Created {new Date(selectedDeal.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </DashboardLayout>
  );
};

export default AdminCustomers;
