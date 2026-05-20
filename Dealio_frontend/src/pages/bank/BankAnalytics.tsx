import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { initialLoans } from '@/data/loans';
import { useDealStore } from '@/stores/useDealStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Clock, CheckCircle, AlertTriangle, FileText, TrendingUp } from 'lucide-react';

const BankAnalytics = () => {
  const [dateRange, setDateRange] = useState('month');
  const { loanCases } = useDealStore();

  const loans = initialLoans;
  const stats = [
    { label: 'New Applications', value: loans.filter(l => l.status === 'Applied').length, icon: FileText, color: 'text-blue-600' },
    { label: 'Processing', value: loans.filter(l => l.status === 'Processing').length, icon: Clock, color: 'text-amber-600' },
    { label: 'Sanctioned', value: loans.filter(l => l.status === 'Sanctioned').length, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Disbursed', value: loans.filter(l => l.status === 'Disbursed').length, icon: TrendingUp, color: 'text-primary' },
  ];

  const approvalTrend = [
    { month: 'Aug', rate: 72 }, { month: 'Sep', rate: 68 }, { month: 'Oct', rate: 75 },
    { month: 'Nov', rate: 80 }, { month: 'Dec', rate: 78 }, { month: 'Jan', rate: 82 },
  ];

  const stageFunnel = [
    { stage: 'Application', count: 5 }, { stage: 'Docs Collection', count: 4 },
    { stage: 'Credit Check', count: 3 }, { stage: 'Valuation', count: 3 },
    { stage: 'Sanction', count: 2 }, { stage: 'Agreement', count: 2 },
    { stage: 'Disbursement', count: 1 },
  ];

  const daysSince = (dateStr: string) => Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-card-foreground">Bank Analytics</h2>
          <div className="flex gap-2">
            {['week', 'month', 'quarter'].map(r => (
              <button key={r} onClick={() => setDateRange(r)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${dateRange === r ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {r === 'week' ? 'This Week' : r === 'month' ? 'This Month' : 'This Quarter'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-1"><s.icon size={16} className={s.color} /><span className="text-xs text-muted-foreground">{s.label}</span></div>
              <p className="text-2xl font-bold text-card-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-lg p-5 border border-border">
          <h3 className="font-semibold text-card-foreground mb-4">TAT — Turnaround Time</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b border-border">
                <th className="px-3 py-2 font-medium">Case ID</th><th className="px-3 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 font-medium">Applied</th><th className="px-3 py-2 font-medium">Current Stage</th>
                <th className="px-3 py-2 font-medium text-right">Days in Stage</th><th className="px-3 py-2 font-medium text-right">Total Days</th>
              </tr></thead>
              <tbody>{loans.map(l => {
                const totalDays = daysSince(l.appliedDate);
                const daysInStage = l.sanctionedDate ? daysSince(l.sanctionedDate) : totalDays;
                const isOverdue = daysInStage > 7;
                return (
                  <tr key={l.id} className={`border-b border-border last:border-0 ${isOverdue ? 'bg-destructive/5' : ''}`}>
                    <td className="px-3 py-2.5 text-card-foreground font-medium">{l.id}</td>
                    <td className="px-3 py-2.5 text-card-foreground">{l.customerName}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{l.appliedDate}</td>
                    <td className="px-3 py-2.5 text-card-foreground">{l.status}</td>
                    <td className={`px-3 py-2.5 text-right font-medium ${isOverdue ? 'text-destructive' : 'text-card-foreground'}`}>
                      {daysInStage}d {isOverdue && <AlertTriangle size={12} className="inline ml-1" />}
                    </td>
                    <td className="px-3 py-2.5 text-right text-card-foreground">{totalDays}d</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg p-5 border border-border">
            <h3 className="font-semibold text-card-foreground mb-4">Approval Rate Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={approvalTrend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[50, 100]} unit="%" />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} name="Approval %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-lg p-5 border border-border">
            <h3 className="font-semibold text-card-foreground mb-4">Stage-wise Funnel</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stageFunnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 10 }} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Cases" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BankAnalytics;
