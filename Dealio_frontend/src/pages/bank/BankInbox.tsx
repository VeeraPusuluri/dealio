import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatusBadge from '@/components/shared/StatusBadge';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { Loader2, Search, RefreshCw, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface LoanCase {
  id: number;
  status: string;
  loanAmount: number;
  bank?: string | null;
  officerName?: string | null;
  submittedAt: string;
  customer: { fullName: string; phone: string; email?: string };
  deal: { id: number; dealValue?: number | null; project?: { name: string; city: string } | null };
}

const STATUSES = ['All', 'Applied', 'Under Review', 'Sanctioned', 'Disbursed', 'Rejected'];

const BankInbox = () => {
  const [cases, setCases]       = useState<LoanCase[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [updating, setUpdating] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    adminApi.getLoanCases()
      .then(d => setCases((d as LoanCase[]) || []))
      .catch(() => toast.error('Failed to load cases'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = cases.filter(c => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.customer.fullName.toLowerCase().includes(q)
        || c.deal?.project?.name?.toLowerCase().includes(q)
        || c.bank?.toLowerCase().includes(q);
    }
    return true;
  });

  const updateStatus = async (id: number, status: string) => {
    setUpdating(id);
    try {
      await adminApi.updateLoanCaseStatus(id, { status });
      setCases(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      toast.success(`Loan case updated to "${status}"`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-foreground">Loan Inbox</h2>
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer or project…"
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted text-[13px] outline-none text-foreground placeholder:text-muted-foreground" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-muted text-[13px] text-foreground outline-none border-0">
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="bg-card rounded-lg card-shadow border border-border overflow-x-auto">
          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-muted-foreground">
              {cases.length === 0 ? 'No loan applications yet' : 'No cases match your filters'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border bg-muted/30">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium text-right">Loan Amount</th>
                  <th className="px-4 py-3 font-medium">Bank</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Officer</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium">Update Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium text-card-foreground">{c.customer.fullName}</p>
                      <p className="text-[11px] text-muted-foreground">{c.customer.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-card-foreground">{c.deal?.project?.name ?? '—'}</p>
                      {c.deal?.project?.city && <p className="text-[11px] text-muted-foreground">{c.deal.project.city}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-card-foreground">{formatCurrency(c.loanAmount)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.bank ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{c.officerName ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-[12px]">{formatDate(c.submittedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <select
                          value={c.status}
                          disabled={updating === c.id}
                          onChange={e => updateStatus(c.id, e.target.value)}
                          className="text-[12px] rounded-lg px-2.5 py-1.5 bg-muted text-foreground outline-none border border-border cursor-pointer pr-7 appearance-none">
                          {STATUSES.filter(s => s !== 'All').map(s => <option key={s}>{s}</option>)}
                        </select>
                        {updating === c.id
                          ? <Loader2 size={11} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground pointer-events-none" />
                          : <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BankInbox;
