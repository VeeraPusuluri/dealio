import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { adminApi } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { Inbox, CheckCircle, Clock, DollarSign, Loader2 } from 'lucide-react';
import { BarChart as RBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

interface LoanCase {
  id: number;
  status: string;
  loanAmount: number;
  bank?: string | null;
  officerName?: string | null;
  submittedAt: string;
  customer: { fullName: string; phone: string };
  deal: { id: number; status: string; dealValue?: number | null; project?: { name: string; city: string } | null; builder?: { companyName: string } | null };
}

const BankOverview = () => {
  const [cases, setCases]   = useState<LoanCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getLoanCases()
      .then(d => setCases((d as LoanCase[]) || []))
      .catch(() => toast.error('Failed to load loan cases'))
      .finally(() => setLoading(false));
  }, []);

  const total      = cases.length;
  const pending    = cases.filter(c => c.status === 'Applied' || c.status === 'Under Review').length;
  const sanctioned = cases.filter(c => c.status === 'Sanctioned').length;
  const disbursed  = cases.filter(c => c.status === 'Disbursed').length;
  const totalAmt   = cases.reduce((s, c) => s + (c.loanAmount ?? 0), 0);

  const statusCounts = [
    { name: 'Applied',      value: cases.filter(c => c.status === 'Applied').length,      fill: '#3B82F6' },
    { name: 'Under Review', value: cases.filter(c => c.status === 'Under Review').length, fill: '#F59E0B' },
    { name: 'Sanctioned',   value: sanctioned,                                             fill: '#0A7E8C' },
    { name: 'Disbursed',    value: disbursed,                                              fill: '#16A34A' },
    { name: 'Rejected',     value: cases.filter(c => c.status === 'Rejected').length,     fill: '#EF4444' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Applications" value={total}                        icon={Inbox}        color="#3B82F6" />
              <StatCard title="Sanctioned"         value={sanctioned}                   icon={CheckCircle}  color="#0A7E8C" />
              <StatCard title="Disbursed"          value={disbursed}                    icon={DollarSign}   color="#16A34A" />
              <StatCard title="Total Loan Value"   value={formatCurrency(totalAmt)}     icon={Clock}        color="#F59E0B" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg p-5 card-shadow border border-border">
                <h3 className="font-semibold text-card-foreground mb-4">Application Status Funnel</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RBarChart data={statusCounts}>
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {statusCounts.map((s, i) => (
                        <rect key={i} fill={s.fill} />
                      ))}
                    </Bar>
                  </RBarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-lg p-5 card-shadow border border-border">
                <h3 className="font-semibold text-card-foreground mb-4">Recent Applications</h3>
                {cases.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground text-center py-8">No loan applications yet</p>
                ) : (
                  <div className="space-y-3">
                    {cases.slice(0, 5).map(c => (
                      <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div>
                          <p className="text-[13px] font-medium text-card-foreground">{c.customer.fullName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {c.deal?.project?.name ?? 'Project'} · {formatCurrency(c.loanAmount)}
                          </p>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BankOverview;
