import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { useCommissionStore } from '@/stores/useCommissionStore';
import { channelPartners, tierColors } from '@/data/channelPartners';
import { formatCurrency, formatDate } from '@/lib/format';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Users, AlertTriangle, CheckCircle, Search, X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

type AdminCommissionStatus = 'Pending' | 'Released' | 'On Hold' | 'Disputed';

const AdminCommissions = () => {
  const navigate = useNavigate();
  const { commissions, releaseCommission } = useCommissionStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [releaseModal, setReleaseModal] = useState<string | null>(null);
  const [dealDrawer, setDealDrawer] = useState<string | null>(null);
  const [tab, setTab] = useState<'queue' | 'history'>('queue');

  const enriched = commissions.map(c => {
    const cp = channelPartners.find(p => p.id === c.cpId);
    return { ...c, tier: cp?.tier || 'Silver', phone: cp?.phone, upi: `${c.cpName.toLowerCase().replace(/\s/g, '')}@upi` };
  });

  const filtered = enriched.filter(c => {
    if (search && !c.cpName.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (projectFilter !== 'All' && c.projectName !== projectFilter) return false;
    return true;
  });

  const pendingTotal = enriched.filter(c => c.status === 'Pending').reduce((s, c) => s + c.amount, 0);
  const releasedThisMonth = enriched.filter(c => c.status === 'Released').reduce((s, c) => s + c.amount, 0);
  const cpsAwaiting = new Set(enriched.filter(c => c.status === 'Pending').map(c => c.cpId)).size;
  const projects = [...new Set(enriched.map(c => c.projectName))];

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(c => c.id)));
  };

  const handleRelease = (id: string) => {
    releaseCommission(id);
    setReleaseModal(null);
    toast.success('Commission released successfully');
  };

  const handleBulkRelease = () => {
    selected.forEach(id => releaseCommission(id));
    setSelected(new Set());
    toast.success(`${selected.size} commissions released`);
  };

  const queueItems = filtered.filter(c => c.status !== 'Released');
  const historyItems = filtered.filter(c => c.status === 'Released');
  const displayItems = tab === 'queue' ? queueItems : historyItems;

  const releaseItem = releaseModal ? enriched.find(c => c.id === releaseModal) : null;
  const dealItem = dealDrawer ? enriched.find(c => c.id === dealDrawer) : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/admin')} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Back to Overview">
            <ArrowLeft size={15} className="text-muted-foreground" />
          </button>
          <h2 className="text-[15px] font-bold text-foreground">Commission Management</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Pending Payout" value={formatCurrency(pendingTotal)} icon={DollarSign} color="#F59E0B" />
          <StatCard title="Released This Month" value={formatCurrency(releasedThisMonth)} icon={CheckCircle} color="#16A34A" />
          <StatCard title="CPs Awaiting Payment" value={cpsAwaiting} icon={Users} color="#6B3FA0" />
          <StatCard title="Disputed" value={0} icon={AlertTriangle} color="#DC2626" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
          <button onClick={() => setTab('queue')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'queue' ? 'bg-card shadow text-card-foreground' : 'text-muted-foreground'}`}>Commission Queue</button>
          <button onClick={() => setTab('history')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'history' ? 'bg-card shadow text-card-foreground' : 'text-muted-foreground'}`}>History</button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by CP name..." className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted text-sm outline-none text-foreground" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-muted text-sm text-foreground outline-none">
            <option>All</option><option>Pending</option><option>Released</option><option>Processing</option>
          </select>
          <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-muted text-sm text-foreground outline-none">
            <option>All</option>
            {projects.map(p => <option key={p}>{p}</option>)}
          </select>
          {selected.size > 0 && tab === 'queue' && (
            <button onClick={handleBulkRelease} className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:opacity-90">
              Bulk Release ({selected.size})
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg card-shadow border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border">
              {tab === 'queue' && <th className="px-4 py-3"><input type="checkbox" checked={selected.size === displayItems.length && displayItems.length > 0} onChange={toggleAll} /></th>}
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">CP Name</th>
              <th className="px-4 py-3 font-medium">Tier</th>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium text-right">Sale Value</th>
              <th className="px-4 py-3 font-medium text-right">%</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr></thead>
            <tbody>
              {displayItems.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  {tab === 'queue' && <td className="px-4 py-3"><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} /></td>}
                  <td className="px-4 py-3 font-medium text-card-foreground">{c.id}</td>
                  <td className="px-4 py-3 text-card-foreground">{c.cpName}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.tier} color={tierColors[c.tier as keyof typeof tierColors]} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{c.projectName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.unit}</td>
                  <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(c.saleValue)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{c.commissionPercent}%</td>
                  <td className="px-4 py-3 text-right font-semibold text-card-foreground">{formatCurrency(c.amount)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(c.expectedDate)}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 flex gap-1">
                    {c.status === 'Pending' && <button onClick={() => setReleaseModal(c.id)} className="px-3 py-1 rounded text-xs font-semibold bg-green-600 text-white hover:opacity-90">Release</button>}
                    <button onClick={() => setDealDrawer(c.id)} className="px-3 py-1 rounded text-xs font-semibold bg-muted text-card-foreground hover:opacity-90">View Deal</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Release Modal */}
      {releaseItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setReleaseModal(null)} />
          <div className="relative bg-card rounded-xl p-6 w-full max-w-md shadow-xl animate-slide-up space-y-4">
            <h3 className="text-lg font-bold text-card-foreground">Confirm Commission Release</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">CP Name</span><span className="font-medium text-card-foreground">{releaseItem.cpName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold text-card-foreground">{formatCurrency(releaseItem.amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Bank Account</span><span className="text-card-foreground">XXXX XXXX 4567</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">UPI ID</span><span className="text-card-foreground">{releaseItem.upi}</span></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setReleaseModal(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={() => handleRelease(releaseItem.id)} className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:opacity-90">Confirm Release</button>
            </div>
          </div>
        </div>
      )}

      {/* Deal Drawer */}
      {dealItem && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDealDrawer(null)} />
          <div className="relative w-full max-w-md bg-card h-full overflow-y-auto animate-slide-up shadow-xl">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-card-foreground">Deal Details</h2>
                <button onClick={() => setDealDrawer(null)} className="p-1 hover:bg-muted rounded"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">Commission ID</p><p className="font-medium text-card-foreground">{dealItem.id}</p></div>
                <div><p className="text-muted-foreground">CP</p><p className="font-medium text-card-foreground">{dealItem.cpName}</p></div>
                <div><p className="text-muted-foreground">Customer</p><p className="font-medium text-card-foreground">{dealItem.customerName}</p></div>
                <div><p className="text-muted-foreground">Project</p><p className="font-medium text-card-foreground">{dealItem.projectName}</p></div>
                <div><p className="text-muted-foreground">Unit</p><p className="font-medium text-card-foreground">{dealItem.unit}</p></div>
                <div><p className="text-muted-foreground">Sale Value</p><p className="font-medium text-card-foreground">{formatCurrency(dealItem.saleValue)}</p></div>
                <div><p className="text-muted-foreground">Commission %</p><p className="font-medium text-card-foreground">{dealItem.commissionPercent}%</p></div>
                <div><p className="text-muted-foreground">Amount</p><p className="font-bold text-card-foreground">{formatCurrency(dealItem.amount)}</p></div>
                <div><p className="text-muted-foreground">Status</p><StatusBadge status={dealItem.status} /></div>
                {dealItem.referralBonus && <div><p className="text-muted-foreground">Referral Bonus</p><p className="font-medium text-card-foreground">{formatCurrency(dealItem.referralBonus)}</p></div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminCommissions;
