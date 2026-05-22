import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useCustomerMilestoneStore, milestoneStages, milestoneColors, MilestoneStage } from '@/stores/useCustomerMilestoneStore';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { X, ChevronRight, Search } from 'lucide-react';

const AdminCustomers = () => {
  const { milestones, updateStage } = useCustomerMilestoneStore();
  const [activeTab, setActiveTab] = useState<string>('All');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const tabStages = ['All', 'Enquiry', 'Site Visit Done', 'Booked', 'Loan Application Created', 'Loan Sanctioned', 'Registration Done', 'Possession Given'];

  const filtered = milestones.filter(m => {
    if (activeTab !== 'All' && m.currentStage !== activeTab) return false;
    if (searchTerm && !m.customerName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const customer = milestones.find(m => m.id === selectedCustomer);

  const handleMoveStage = (id: string, newStage: MilestoneStage) => {
    updateStage(id, newStage, 'Admin');
    toast.success(`Customer moved to ${newStage}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Customer Milestones</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search customer..." className="pl-9 pr-3 py-2 rounded-lg border border-input bg-card text-sm w-60" />
            </div>
          </div>
        </div>

        {/* Stage tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {tabStages.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${activeTab === tab ? 'bg-admin text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              style={activeTab === tab ? { backgroundColor: 'hsl(265, 44%, 44%)' } : {}}>
              {tab === 'All' ? `All (${milestones.length})` : `${tab.split(' ').slice(0, 2).join(' ')} (${milestones.filter(m => m.currentStage === tab).length})`}
            </button>
          ))}
        </div>

        {/* Customer cards */}
        <div className="grid gap-3">
          {filtered.map(m => (
            <div key={m.id} onClick={() => setSelectedCustomer(m.id)} className="bg-card rounded-lg card-shadow border border-border p-4 cursor-pointer hover:border-admin/40 transition-colors" style={{ '--admin-color': 'hsl(265, 44%, 44%)' } as any}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: milestoneColors[m.currentStage] }}>{m.customerName[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-card-foreground">{m.customerName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: milestoneColors[m.currentStage] }}>{m.currentStage}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{m.projectName}{m.unit ? ` — Tower ${m.tower}, Unit ${m.unit}` : ''}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    {m.cpName && <span>CP: {m.cpName}</span>}
                    <span>{m.daysInCurrentStage}d in stage</span>
                    <span>Last: {m.lastActivityDate}</span>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); const idx = milestoneStages.indexOf(m.currentStage); if (idx < milestoneStages.length - 1) handleMoveStage(m.id, milestoneStages[idx + 1]); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary/10 text-secondary hover:bg-secondary/20">
                  Move Next →
                </button>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>

        {/* Customer 360 drawer */}
        {customer && (
          <>
            <div className="fixed inset-0 z-40 modal-backdrop" onClick={() => setSelectedCustomer(null)} />
            <div className="fixed right-0 top-0 bottom-0 z-50 w-[520px] bg-card border-l border-border overflow-y-auto">
              <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
                <h3 className="font-bold text-card-foreground">Customer 360 — {customer.customerName}</h3>
                <button onClick={() => setSelectedCustomer(null)} className="p-1 hover:bg-muted rounded"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-5">
                {/* Personal */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Personal Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> <span className="font-medium text-card-foreground">{customer.customerName}</span></div>
                    <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium text-card-foreground">{customer.phone}</span></div>
                    <div><span className="text-muted-foreground">Email:</span> <span className="font-medium text-card-foreground">{customer.email}</span></div>
                  </div>
                </div>
                {/* Property */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Property</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Project:</span> <span className="font-medium text-card-foreground">{customer.projectName}</span></div>
                    <div><span className="text-muted-foreground">Unit:</span> <span className="font-medium text-card-foreground">{customer.unit ? `Tower ${customer.tower} - ${customer.unit}` : 'Not assigned'}</span></div>
                    <div><span className="text-muted-foreground">Type:</span> <span className="font-medium text-card-foreground">{customer.unitType}</span></div>
                    {customer.price && <div><span className="text-muted-foreground">Price:</span> <span className="font-medium text-card-foreground">{formatCurrency(customer.price)}</span></div>}
                  </div>
                </div>
                {/* CP & Builder */}
                {(customer.cpName || customer.builderName) && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Stakeholders</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {customer.cpName && <div><span className="text-muted-foreground">CP:</span> <span className="font-medium text-card-foreground">{customer.cpName}</span></div>}
                      {customer.builderName && <div><span className="text-muted-foreground">Builder:</span> <span className="font-medium text-card-foreground">{customer.builderName}</span></div>}
                    </div>
                  </div>
                )}
                {/* Move Stage */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Move to Stage</label>
                  <select onChange={e => { if (e.target.value) { handleMoveStage(customer.id, e.target.value as MilestoneStage); } e.target.value = ''; }} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm">
                    <option value="">Select stage...</option>
                    {milestoneStages.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {/* Timeline */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Stage History</h4>
                  <div className="space-y-3">
                    {customer.stageHistory.map((h, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: milestoneColors[h.stage] }} />
                        <div>
                          <span className="font-medium text-card-foreground">{h.stage}</span>
                          <p className="text-xs text-muted-foreground">{h.date} · {h.updatedBy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCustomers;
