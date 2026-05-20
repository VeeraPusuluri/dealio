import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { useCommissionStore } from '@/stores/useCommissionStore';
import { formatCurrency, formatDate } from '@/lib/format';
import { DollarSign, TrendingUp, Clock, CheckCircle, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

const CPCommissions = () => {
  const { commissions } = useCommissionStore();
  const [tab, setTab] = useState<'overview' | 'history'>('overview');
  const cpCommissions = commissions.filter(c => c.cpId === 'CP001');
  const total = cpCommissions.reduce((s, c) => s + c.amount, 0);
  const released = cpCommissions.filter(c => c.status === 'Released').reduce((s, c) => s + c.amount, 0);
  const pending = cpCommissions.filter(c => c.status === 'Pending').reduce((s, c) => s + c.amount, 0);
  const bonus = cpCommissions.reduce((s, c) => s + (c.referralBonus || 0), 0);

  // TDS calculation (10% standard)
  const tdsRate = 0.1;
  const tdsDeducted = Math.round(released * tdsRate);
  const netReceived = released - tdsDeducted;

  const byProject = cpCommissions.reduce((acc, c) => {
    acc[c.projectName] = (acc[c.projectName] || 0) + c.amount;
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(byProject).map(([name, value]) => ({ name, value }));
  const colors = ['#0A7E8C', '#E87722', '#8B5CF6', '#16A34A'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Total Earned" value={formatCurrency(total)} icon={DollarSign} color="#0A7E8C" />
          <StatCard title="Released" value={formatCurrency(released)} icon={CheckCircle} color="#16A34A" />
          <StatCard title="TDS Deducted" value={formatCurrency(tdsDeducted)} icon={Wallet} color="#DC2626" />
          <StatCard title="Net Received" value={formatCurrency(netReceived)} icon={TrendingUp} color="#16A34A" />
          <StatCard title="Pending" value={formatCurrency(pending)} icon={Clock} color="#F59E0B" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
          <button onClick={() => setTab('overview')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'overview' ? 'bg-card shadow text-card-foreground' : 'text-muted-foreground'}`}>My Earnings</button>
          <button onClick={() => setTab('history')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'history' ? 'bg-card shadow text-card-foreground' : 'text-muted-foreground'}`}>Earnings History</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-lg card-shadow border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b border-border">
                <th className="px-4 py-3 font-medium">Project</th><th className="px-4 py-3 font-medium">Unit</th><th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium text-right">Sale Value</th><th className="px-4 py-3 font-medium text-right">Commission</th>
                {tab === 'history' && <th className="px-4 py-3 font-medium text-right">TDS (10%)</th>}
                {tab === 'history' && <th className="px-4 py-3 font-medium text-right">Net</th>}
                <th className="px-4 py-3 font-medium">Status</th>
              </tr></thead>
              <tbody>{cpCommissions.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-card-foreground">{c.projectName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.unit}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.customerName}</td>
                  <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(c.saleValue)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-accent">{formatCurrency(c.amount)}</td>
                  {tab === 'history' && <td className="px-4 py-3 text-right text-destructive">{c.status === 'Released' ? formatCurrency(Math.round(c.amount * tdsRate)) : '-'}</td>}
                  {tab === 'history' && <td className="px-4 py-3 text-right font-semibold text-card-foreground">{c.status === 'Released' ? formatCurrency(c.amount - Math.round(c.amount * tdsRate)) : '-'}</td>}
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="bg-card rounded-lg p-5 card-shadow border border-border">
            <h3 className="font-semibold text-card-foreground mb-4">By Project</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie><Tooltip formatter={(v: number) => formatCurrency(v)} /></PieChart>
            </ResponsiveContainer>
            {bonus > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Referral Bonus</p>
                <p className="text-lg font-bold text-card-foreground">{formatCurrency(bonus)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CPCommissions;
