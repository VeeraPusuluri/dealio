import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency } from '@/lib/format';
import { useLoanStore } from '@/stores/useLoanStore';
import { Inbox, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { BarChart as RBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart } from 'recharts';

const funnelData = [
  { name: 'Applications', value: 28, fill: '#3B82F6' },
  { name: 'Processing', value: 12, fill: '#F59E0B' },
  { name: 'Sanctioned', value: 22, fill: '#0A7E8C' },
  { name: 'Disbursed', value: 18, fill: '#16A34A' },
];

const BankOverview = () => {
  const { loans } = useLoanStore();
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Applications" value={28} icon={Inbox} color="#3B82F6" />
          <StatCard title="Sanctioned" value={22} icon={CheckCircle} color="#0A7E8C" />
          <StatCard title="Disbursed" value={18} icon={DollarSign} color="#16A34A" />
          <StatCard title="Fee Pending" value={formatCurrency(124000)} icon={Clock} color="#F59E0B" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg p-5 card-shadow border border-border">
            <h3 className="font-semibold text-card-foreground mb-4">Application Funnel</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RBarChart data={funnelData}>
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2E5D8E" radius={[4,4,0,0]} />
              </RBarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-lg p-5 card-shadow border border-border">
            <h3 className="font-semibold text-card-foreground mb-4">Recent Applications</h3>
            <div className="space-y-3">{loans.slice(0, 5).map(l => (
              <div key={l.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div><p className="text-sm font-medium text-card-foreground">{l.customerName}</p><p className="text-xs text-muted-foreground">{l.projectName} · {formatCurrency(l.loanAmount)}</p></div>
                <StatusBadge status={l.status} />
              </div>
            ))}</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default BankOverview;
