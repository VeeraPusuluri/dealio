import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, LayoutGrid, CheckCircle, Clock, Banknote } from 'lucide-react';
import { toast } from 'sonner';

interface Deal {
  id: number;
  status: string;
  dealValue: number | null;
  commissionStatus: string | null;
  createdAt: string;
  customer: { id: number; fullName: string; phone: string; email?: string };
  project: { id: number; name: string; city: string };
  builder: { id: number; companyName: string };
  cp: { id: number; user: { fullName: string } } | null;
  loanCase: { id: number; status: string } | null;
}

const STATUSES = [
  'Enquiry', 'New Lead', 'Profile Created', 'Meeting Requested',
  'Meeting Confirmed', 'Meeting Done', 'Negotiation', 'Booked',
  'Loan Application Created', 'Loan Sanctioned', 'Loan Disbursed',
  'Registration Done', 'Possession Given',
];

const STATUS_COLORS: Record<string, string> = {
  Booked: '#16A34A', 'Registration Done': '#0A7E8C', 'Possession Given': '#8B5CF6',
  Negotiation: '#F59E0B', 'Meeting Done': '#3B82F6', 'Loan Sanctioned': '#16A34A',
};

const AdminDeals = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState<Deal | null>(null);

  useEffect(() => {
    adminApi.getDeals().then(data => {
      setDeals((data as Deal[]) || []);
    }).catch(() => {
      toast.error('Failed to load deals');
    }).finally(() => setLoading(false));
  }, []);

  const filtered = deals.filter(d => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.customer.fullName.toLowerCase().includes(q) || d.project.name.toLowerCase().includes(q) || d.builder.companyName.toLowerCase().includes(q);
    }
    return true;
  });

  const updateMilestone = async (dealId: number, status: string) => {
    try {
      await adminApi.updateDealMilestone(dealId, status);
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, status } : d));
      if (selected?.id === dealId) setSelected(prev => prev ? { ...prev, status } : null);
      toast.success(`Deal updated to "${status}"`);
    } catch {
      toast.error('Failed to update deal status');
    }
  };

  const totalGmv = deals.reduce((s, d) => s + (d.dealValue ?? 0), 0);
  const active = deals.filter(d => !['Registration Done', 'Possession Given'].includes(d.status)).length;
  const closed = deals.filter(d => ['Registration Done', 'Possession Given'].includes(d.status)).length;
  const withLoan = deals.filter(d => d.loanCase).length;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/admin')} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={15} className="text-muted-foreground" />
          </button>
          <h2 className="text-[15px] font-bold text-foreground">Deal Oversight</h2>
          <span className="ml-auto text-xs text-muted-foreground">{deals.length} total deals</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total GMV" value={formatCurrency(totalGmv)} icon={Banknote} color="#0A7E8C" />
          <StatCard title="Active Deals" value={active} icon={Clock} color="#F59E0B" />
          <StatCard title="Closed / Possession" value={closed} icon={CheckCircle} color="#16A34A" />
          <StatCard title="With Loan" value={withLoan} icon={LayoutGrid} color="#6B3FA0" />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer, project, or builder..." className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted text-sm outline-none text-foreground placeholder:text-muted-foreground" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-muted text-sm text-foreground outline-none border-0">
            <option value="ALL">All Statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="bg-card rounded-lg card-shadow border border-border overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground text-sm animate-pulse">Loading deals...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">No deals match your filters</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border bg-muted/30">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Builder</th>
                  <th className="px-4 py-3 font-medium text-right">Value</th>
                  <th className="px-4 py-3 font-medium">CP</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Loan</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Move To</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} onClick={() => setSelected(d)} className="border-t border-border hover:bg-muted/30 cursor-pointer">
                    <td className="px-4 py-3">
                      <p className="font-medium text-card-foreground">{d.customer.fullName}</p>
                      <p className="text-xs text-muted-foreground">{d.customer.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-card-foreground">{d.project.name}</p>
                      <p className="text-xs text-muted-foreground">{d.project.city}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{d.builder.companyName}</td>
                    <td className="px-4 py-3 text-right font-semibold text-card-foreground">
                      {d.dealValue ? formatCurrency(d.dealValue) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{d.cp?.user?.fullName || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white"
                        style={{ backgroundColor: STATUS_COLORS[d.status] || '#6B7280' }}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.loanCase
                        ? <StatusBadge status={d.loanCase.status} />
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(d.createdAt)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <select
                        className="text-[11px] rounded-lg px-2 py-1.5 bg-muted text-foreground outline-none border border-border cursor-pointer"
                        value={d.status}
                        onChange={e => updateMilestone(d.id, e.target.value)}
                      >
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-card h-full overflow-y-auto shadow-xl animate-slide-up">
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-card-foreground">Deal #{selected.id}</h2>
                <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-muted rounded-lg"><X size={18} /></button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Customer', value: selected.customer.fullName, sub: selected.customer.phone },
                  { label: 'Project', value: selected.project.name, sub: selected.project.city },
                  { label: 'Builder', value: selected.builder.companyName },
                  { label: 'CP', value: selected.cp?.user?.fullName || 'Direct' },
                ].map(({ label, value, sub }) => (
                  <div key={label}>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-card-foreground">{value}</p>
                    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                  </div>
                ))}
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Deal Value</p>
                  <p className="text-sm font-bold text-card-foreground">{selected.dealValue ? formatCurrency(selected.dealValue) : '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Commission</p>
                  <StatusBadge status={selected.commissionStatus || 'Pending'} />
                </div>
                {selected.loanCase && (
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Loan Status</p>
                    <StatusBadge status={selected.loanCase.status} />
                  </div>
                )}
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Created</p>
                  <p className="text-sm text-card-foreground">{formatDate(selected.createdAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Update Milestone</p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => updateMilestone(selected.id, s)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        selected.status === s
                          ? 'text-white shadow-sm'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                      style={selected.status === s ? { backgroundColor: STATUS_COLORS[s] || '#0A7E8C' } : undefined}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDeals;
