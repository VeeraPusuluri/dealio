import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { adminApi } from '@/lib/api';
import { tierColors } from '@/data/channelPartners';
import { formatCurrency, formatDate } from '@/lib/format';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Users, AlertTriangle, CheckCircle, Search, X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useNotificationStore } from '@/stores/useNotificationStore';

interface CommissionDeal {
  id: number;
  status: string;
  dealValue: number | null;
  commissionStatus: string | null;
  commissionReleasedAt: string | null;
  createdAt: string;
  customer: { fullName: string };
  project: { name: string; city: string };
  cp: { id: number; tier: string; user: { fullName: string } };
}

const COMMISSION_RATE = 0.03;

const AdminCommissions = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<CommissionDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [releaseModal, setReleaseModal] = useState<CommissionDeal | null>(null);
  const [dealDrawer, setDealDrawer] = useState<CommissionDeal | null>(null);
  const [tab, setTab] = useState<'queue' | 'history'>('queue');

  useEffect(() => {
    adminApi.getCommissions().then(data => {
      setDeals((data as CommissionDeal[]) || []);
    }).catch(() => {
      toast.error('Failed to load commissions');
    }).finally(() => setLoading(false));
  }, []);

  const commissionAmount = (d: CommissionDeal) => Math.round((d.dealValue ?? 0) * COMMISSION_RATE);

  const filtered = deals.filter(d => {
    const cpName = d.cp?.user?.fullName || '';
    if (search && !cpName.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'All') {
      if (statusFilter !== (d.commissionStatus || 'Pending')) return false;
    }
    if (projectFilter !== 'All' && d.project?.name !== projectFilter) return false;
    return true;
  });

  const pendingTotal = deals.filter(d => d.commissionStatus === 'Pending').reduce((s, d) => s + commissionAmount(d), 0);
  const releasedTotal = deals.filter(d => d.commissionStatus === 'Released').reduce((s, d) => s + commissionAmount(d), 0);
  const cpsAwaiting = new Set(deals.filter(d => d.commissionStatus === 'Pending').map(d => d.cp?.id)).size;
  const projects = [...new Set(deals.map(d => d.project?.name).filter(Boolean))];

  const toggleSelect = (id: number) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () => {
    const queueItems = filtered.filter(d => d.commissionStatus !== 'Released');
    if (selected.size === queueItems.length) setSelected(new Set());
    else setSelected(new Set(queueItems.map(d => d.id)));
  };

  const handleMarkProcessing = (dealId: number) => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, commissionStatus: 'Processing' } : d));
    toast.success('Commission moved to processing');
  };

  const handleRelease = async (dealId: number) => {
    try {
      const deal = deals.find(d => d.id === dealId);
      await adminApi.updateDealMilestone(dealId, deal?.status || 'Booked');
      // Update commissionStatus locally — in production this would be a dedicated endpoint
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, commissionStatus: 'Released', commissionReleasedAt: new Date().toISOString() } : d));
      setReleaseModal(null);
      toast.success('Commission released successfully');
      if (deal) {
        useNotificationStore.getState().addNotification({
          type: 'success',
          title: 'Commission paid out',
          message: `₹${(commissionAmount(deal) / 100000).toFixed(1)}L released for ${deal.project?.name || 'your deal'} — invoice & statement are ready to download.`,
          role: 'cp',
          link: '/cp/commissions',
        });
      }
    } catch {
      toast.error('Failed to release commission');
    }
  };

  const handleBulkRelease = () => {
    selected.forEach(id => handleRelease(id));
    setSelected(new Set());
  };

  const queueItems = filtered.filter(d => d.commissionStatus !== 'Released');
  const historyItems = filtered.filter(d => d.commissionStatus === 'Released');
  const displayItems = tab === 'queue' ? queueItems : historyItems;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/admin')} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={15} className="text-muted-foreground" />
          </button>
          <h2 className="text-[15px] font-bold text-foreground">Commission Management</h2>
          <span className="ml-auto text-xs text-muted-foreground">{deals.length} commissionable deals</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Pending Payout" value={formatCurrency(pendingTotal)} icon={DollarSign} color="#F59E0B" />
          <StatCard title="Released Total" value={formatCurrency(releasedTotal)} icon={CheckCircle} color="#16A34A" />
          <StatCard title="CPs Awaiting Payment" value={cpsAwaiting} icon={Users} color="#6B3FA0" />
          <StatCard title="Disputed" value={0} icon={AlertTriangle} color="#DC2626" />
        </div>

        <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
          <button onClick={() => setTab('queue')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'queue' ? 'bg-card shadow text-card-foreground' : 'text-muted-foreground'}`}>
            Commission Queue {queueItems.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">{filtered.filter(d => d.commissionStatus !== 'Released').length}</span>}
          </button>
          <button onClick={() => setTab('history')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'history' ? 'bg-card shadow text-card-foreground' : 'text-muted-foreground'}`}>History</button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by CP name..." className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted text-sm outline-none text-foreground" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-muted text-sm text-foreground outline-none">
            <option>All</option><option>Pending</option><option>Processing</option><option>Released</option>
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

        <div className="bg-card rounded-lg card-shadow border border-border overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground text-sm animate-pulse">Loading commissions...</div>
          ) : displayItems.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              {tab === 'queue' ? 'No pending commissions' : 'No commission history yet'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  {tab === 'queue' && (
                    <th className="px-4 py-3">
                      <input type="checkbox" checked={selected.size === queueItems.length && queueItems.length > 0} onChange={toggleAll} />
                    </th>
                  )}
                  <th className="px-4 py-3 font-medium">Deal #</th>
                  <th className="px-4 py-3 font-medium">CP Name</th>
                  <th className="px-4 py-3 font-medium">Tier</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium text-right">Sale Value</th>
                  <th className="px-4 py-3 font-medium text-right">Rate</th>
                  <th className="px-4 py-3 font-medium text-right">Commission</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map(d => (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    {tab === 'queue' && (
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggleSelect(d.id)} />
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium text-card-foreground">#{d.id}</td>
                    <td className="px-4 py-3 text-card-foreground">{d.cp?.user?.fullName || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.cp?.tier || 'Silver'} color={tierColors[(d.cp?.tier || 'Silver') as keyof typeof tierColors]} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{d.project?.name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.customer?.fullName || '—'}</td>
                    <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(d.dealValue ?? 0)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{(COMMISSION_RATE * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3 text-right font-semibold text-card-foreground">{formatCurrency(commissionAmount(d))}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(d.createdAt)}</td>
                    <td className="px-4 py-3"><StatusBadge status={d.commissionStatus === 'Released' ? 'Paid' : (d.commissionStatus || 'Pending')} /></td>
                    <td className="px-4 py-3 flex gap-1">
                      {(!d.commissionStatus || d.commissionStatus === 'Pending') && (
                        <button onClick={() => handleMarkProcessing(d.id)} className="px-3 py-1 rounded text-xs font-semibold bg-blue-600 text-white hover:opacity-90">Start Processing</button>
                      )}
                      {d.commissionStatus === 'Processing' && (
                        <button onClick={() => setReleaseModal(d)} className="px-3 py-1 rounded text-xs font-semibold bg-green-600 text-white hover:opacity-90">Release</button>
                      )}
                      <button onClick={() => setDealDrawer(d)} className="px-3 py-1 rounded text-xs font-semibold bg-muted text-card-foreground hover:opacity-90">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {releaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setReleaseModal(null)} />
          <div className="relative bg-card rounded-xl p-6 w-full max-w-md shadow-xl animate-slide-up space-y-4">
            <h3 className="text-lg font-bold text-card-foreground">Confirm Commission Release</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">CP Name</span><span className="font-medium text-card-foreground">{releaseModal.cp?.user?.fullName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Project</span><span className="text-card-foreground">{releaseModal.project?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sale Value</span><span className="text-card-foreground">{formatCurrency(releaseModal.dealValue ?? 0)}</span></div>
              <div className="flex justify-between border-t border-border pt-2"><span className="text-muted-foreground">Commission (3%)</span><span className="font-bold text-card-foreground">{formatCurrency(commissionAmount(releaseModal))}</span></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setReleaseModal(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={() => handleRelease(releaseModal.id)} className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:opacity-90">Confirm Release</button>
            </div>
          </div>
        </div>
      )}

      {dealDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDealDrawer(null)} />
          <div className="relative w-full max-w-md bg-card h-full overflow-y-auto animate-slide-up shadow-xl">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-card-foreground">Deal #{dealDrawer.id} — Details</h2>
                <button onClick={() => setDealDrawer(null)} className="p-1 hover:bg-muted rounded"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">CP</p><p className="font-medium text-card-foreground">{dealDrawer.cp?.user?.fullName}</p></div>
                <div><p className="text-muted-foreground">Tier</p><StatusBadge status={dealDrawer.cp?.tier || 'Silver'} /></div>
                <div><p className="text-muted-foreground">Customer</p><p className="font-medium text-card-foreground">{dealDrawer.customer?.fullName}</p></div>
                <div><p className="text-muted-foreground">Project</p><p className="font-medium text-card-foreground">{dealDrawer.project?.name}</p></div>
                <div><p className="text-muted-foreground">City</p><p className="text-card-foreground">{dealDrawer.project?.city}</p></div>
                <div><p className="text-muted-foreground">Deal Status</p><StatusBadge status={dealDrawer.status} /></div>
                <div><p className="text-muted-foreground">Sale Value</p><p className="font-bold text-card-foreground">{formatCurrency(dealDrawer.dealValue ?? 0)}</p></div>
                <div><p className="text-muted-foreground">Commission (3%)</p><p className="font-bold text-card-foreground">{formatCurrency(commissionAmount(dealDrawer))}</p></div>
                <div><p className="text-muted-foreground">Commission Status</p><StatusBadge status={dealDrawer.commissionStatus === 'Released' ? 'Paid' : (dealDrawer.commissionStatus || 'Pending')} /></div>
                {dealDrawer.commissionReleasedAt && (
                  <div><p className="text-muted-foreground">Released On</p><p className="text-card-foreground">{formatDate(dealDrawer.commissionReleasedAt)}</p></div>
                )}
                <div><p className="text-muted-foreground">Deal Date</p><p className="text-card-foreground">{formatDate(dealDrawer.createdAt)}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminCommissions;
