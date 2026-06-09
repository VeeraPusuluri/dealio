import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { cpApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatCurrency, formatDate } from '@/lib/format';
import { DollarSign, TrendingUp, Clock, CheckCircle, Wallet, Receipt } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import DocumentPreviewModal from '@/components/shared/DocumentPreviewModal';

interface CommissionEntry {
  id: number;
  status: string;
  dealValue: number | null;
  commissionStatus: string | null;
  commissionPercent: number;
  commissionAmount: number;
  commissionReleasedAt: string | null;
  createdAt: string;
  customerName: string;
  projectName: string;
  projectCity: string;
  cpTier: string;
}

const TDS_RATE = 0.10;

const CPCommissions = () => {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<CommissionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'history'>('overview');
  const [statementFor, setStatementFor] = useState<CommissionEntry | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    cpApi.getCommissions(user.id).then(data => {
      setEntries((data as CommissionEntry[]) || []);
    }).catch(() => setEntries([])).finally(() => setLoading(false));
  }, [user?.id]);

  const total    = entries.reduce((s, c) => s + c.commissionAmount, 0);
  const released = entries.filter(c => c.commissionStatus === 'Released').reduce((s, c) => s + c.commissionAmount, 0);
  const pending  = entries.filter(c => c.commissionStatus !== 'Released').reduce((s, c) => s + c.commissionAmount, 0);
  const tds      = Math.round(released * TDS_RATE);
  const net      = released - tds;

  const byProject = entries.reduce((acc, c) => {
    acc[c.projectName] = (acc[c.projectName] || 0) + c.commissionAmount;
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(byProject).map(([name, value]) => ({ name, value }));
  const colors = ['#0A7E8C', '#E87722', '#8B5CF6', '#16A34A', '#F59E0B'];

  const display = tab === 'overview' ? entries : entries.filter(c => c.commissionStatus === 'Released');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Total Earned" value={formatCurrency(total)} icon={DollarSign} color="#0A7E8C" />
          <StatCard title="Released" value={formatCurrency(released)} icon={CheckCircle} color="#16A34A" />
          <StatCard title="TDS Deducted (10%)" value={formatCurrency(tds)} icon={Wallet} color="#DC2626" />
          <StatCard title="Net Received" value={formatCurrency(net)} icon={TrendingUp} color="#16A34A" />
          <StatCard title="Pending" value={formatCurrency(pending)} icon={Clock} color="#F59E0B" />
        </div>

        <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
          <button onClick={() => setTab('overview')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'overview' ? 'bg-card shadow text-card-foreground' : 'text-muted-foreground'}`}>My Earnings</button>
          <button onClick={() => setTab('history')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'history' ? 'bg-card shadow text-card-foreground' : 'text-muted-foreground'}`}>Released History</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-lg card-shadow border border-border overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-muted-foreground text-sm animate-pulse">Loading commissions...</div>
            ) : display.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">
                {tab === 'overview' ? 'No commissions yet — close your first deal!' : 'No released commissions yet'}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="px-4 py-3 font-medium">Project</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium text-right">Sale Value</th>
                    <th className="px-4 py-3 font-medium text-right">Rate</th>
                    <th className="px-4 py-3 font-medium text-right">Commission</th>
                    {tab === 'history' && <th className="px-4 py-3 font-medium text-right">TDS (10%)</th>}
                    {tab === 'history' && <th className="px-4 py-3 font-medium text-right">Net</th>}
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    {tab === 'history' && <th className="px-4 py-3 font-medium">Invoice</th>}
                  </tr>
                </thead>
                <tbody>
                  {display.map(c => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="text-card-foreground font-medium">{c.projectName}</p>
                        <p className="text-xs text-muted-foreground">{c.projectCity}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.customerName}</td>
                      <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(c.dealValue ?? 0)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{c.commissionPercent}%</td>
                      <td className="px-4 py-3 text-right font-semibold text-accent">{formatCurrency(c.commissionAmount)}</td>
                      {tab === 'history' && (
                        <td className="px-4 py-3 text-right text-destructive">
                          {c.commissionStatus === 'Released' ? formatCurrency(Math.round(c.commissionAmount * TDS_RATE)) : '—'}
                        </td>
                      )}
                      {tab === 'history' && (
                        <td className="px-4 py-3 text-right font-semibold text-card-foreground">
                          {c.commissionStatus === 'Released' ? formatCurrency(c.commissionAmount - Math.round(c.commissionAmount * TDS_RATE)) : '—'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(c.createdAt)}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.commissionStatus === 'Released' ? 'Paid' : (c.commissionStatus || 'Pending')} /></td>
                      {tab === 'history' && (
                        <td className="px-4 py-3">
                          {c.commissionStatus === 'Released' && (
                            <button
                              onClick={() => setStatementFor(c)}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border border-border text-card-foreground hover:bg-muted transition-colors"
                            >
                              <Receipt size={12} /> Statement
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-card rounded-lg p-5 card-shadow border border-border">
              <h3 className="font-semibold text-card-foreground mb-4">By Project</h3>
              {pieData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                      {pieData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {pieData.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {pieData.slice(0, 4).map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                        <span className="text-muted-foreground truncate max-w-[120px]">{d.name}</span>
                      </div>
                      <span className="font-medium text-card-foreground">{formatCurrency(d.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card rounded-lg p-5 card-shadow border border-border space-y-3">
              <h3 className="font-semibold text-card-foreground">Summary</h3>
              {[
                { label: 'Gross Earned', value: total, color: 'text-card-foreground' },
                { label: 'Released', value: released, color: 'text-green-600' },
                { label: 'TDS Deducted', value: -tds, color: 'text-red-500' },
                { label: 'Net in Hand', value: net, color: 'text-card-foreground font-bold' },
                { label: 'Pending', value: pending, color: 'text-amber-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={color}>{formatCurrency(Math.abs(value))}{value < 0 ? ' (deducted)' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {statementFor && (
        <DocumentPreviewModal
          open={!!statementFor}
          onClose={() => setStatementFor(null)}
          type="commission"
          data={{
            cpName: user?.name || '',
            project: statementFor.projectName,
            customer: statementFor.customerName,
            saleValue: formatCurrency(statementFor.dealValue ?? 0),
            commissionPct: `${statementFor.commissionPercent}%`,
            grossComm: formatCurrency(statementFor.commissionAmount),
            tds: formatCurrency(Math.round(statementFor.commissionAmount * TDS_RATE)),
            netPayable: formatCurrency(statementFor.commissionAmount - Math.round(statementFor.commissionAmount * TDS_RATE)),
            date: statementFor.commissionReleasedAt ? formatDate(statementFor.commissionReleasedAt) : formatDate(statementFor.createdAt),
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default CPCommissions;
