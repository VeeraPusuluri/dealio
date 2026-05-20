import DashboardLayout from '@/components/layout/DashboardLayout';
import StatusBadge from '@/components/shared/StatusBadge';
import { channelPartners } from '@/data/channelPartners';
import { formatCurrency } from '@/lib/format';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';

const chartData = channelPartners.slice(0, 5).map(cp => ({ name: cp.name.split(' ')[0], earnings: cp.totalEarnings }));

const BuilderCPPerformance = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="la-banner px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center">
            <Users size={17} className="text-teal-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">CP Performance</h2>
        </div>

        <div className="la-card p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Top CPs by Earnings</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} tick={{ fill: '#94a3b8' }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="earnings" fill="#0A7E8C" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="la-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700">All Channel Partners</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3 font-medium">CP Name</th>
                  <th className="px-5 py-3 font-medium">Tier</th>
                  <th className="px-5 py-3 font-medium">City</th>
                  <th className="px-5 py-3 font-medium text-right">Deals (Month)</th>
                  <th className="px-5 py-3 font-medium text-right">Total Earnings</th>
                  <th className="px-5 py-3 font-medium text-right">Pending</th>
                </tr>
              </thead>
              <tbody>
                {channelPartners.map(cp => (
                  <tr key={cp.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{cp.name}</td>
                    <td className="px-5 py-3"><StatusBadge status={cp.tier} /></td>
                    <td className="px-5 py-3 text-slate-400">{cp.city}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">{cp.dealsThisMonth}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{formatCurrency(cp.totalEarnings)}</td>
                    <td className="px-5 py-3 text-right text-teal-600 font-medium">{formatCurrency(cp.pendingCommission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BuilderCPPerformance;