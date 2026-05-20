import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { projects } from '@/data/projects';
import { channelPartners } from '@/data/channelPartners';
import { useLeadStore } from '@/stores/useLeadStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell } from 'recharts';
import { TrendingUp, Users, IndianRupee, Building2, Download } from 'lucide-react';

const BuilderAnalytics = () => {
  const [dateRange, setDateRange] = useState('month');
  const [velocityProject, setVelocityProject] = useState(projects[0]?.id || '');

  const leads = useLeadStore((s) => s.leads);
  const funnelData = [
    { name: 'Enquiries', value: leads.length, fill: 'hsl(var(--primary))' },
    { name: 'Site Visits', value: leads.filter(l => ['Meeting Done', 'Negotiation', 'Booked', 'Closed'].includes(l.stage)).length, fill: '#6366F1' },
    { name: 'Meetings Held', value: leads.filter(l => ['Meeting Done', 'Negotiation', 'Booked', 'Closed'].includes(l.stage)).length, fill: '#8B5CF6' },
    { name: 'Negotiations', value: leads.filter(l => ['Negotiation', 'Booked', 'Closed'].includes(l.stage)).length, fill: '#F59E0B' },
    { name: 'Bookings', value: leads.filter(l => ['Booked', 'Closed'].includes(l.stage)).length, fill: '#10B981' },
    { name: 'Registrations', value: leads.filter(l => l.stage === 'Closed').length, fill: '#16A34A' },
  ];

  const cpPerf = channelPartners.map(cp => {
    const cpLeads = leads.filter(l => l.cpId === cp.id);
    const visits = cpLeads.filter(l => ['Meeting Done', 'Negotiation', 'Booked', 'Closed'].includes(l.stage)).length;
    const bookings = cpLeads.filter(l => ['Booked', 'Closed'].includes(l.stage)).length;
    return { name: cp.name, leads: cpLeads.length, visits, bookings, conversion: cpLeads.length > 0 ? ((bookings / cpLeads.length) * 100).toFixed(1) : '0', commission: cp.pendingCommission };
  }).sort((a, b) => b.bookings - a.bookings);

  const velocityData = Array.from({ length: 8 }, (_, i) => ({ week: `W${i + 1}`, units: Math.floor(Math.random() * 8) + 1 }));

  const totalBookings = leads.filter(l => ['Booked', 'Closed'].includes(l.stage)).length;
  const totalRevenue = leads.filter(l => ['Booked', 'Closed'].includes(l.stage)).reduce((s, l) => s + l.budget, 0);
  const avgDeal = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="la-banner px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Builder Analytics</h2>
          <div className="flex gap-1.5">
            {['week', 'month', 'quarter'].map(r => (
              <button key={r} onClick={() => setDateRange(r)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${dateRange === r ? 'bg-teal-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:border-teal-200'}`}>
                {r === 'week' ? 'This Week' : r === 'month' ? 'This Month' : 'This Quarter'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Bookings', value: totalBookings, icon: Building2, color: '#0A7E8C' },
            { label: 'Revenue Booked', value: `₹${(totalRevenue / 10000000).toFixed(1)}Cr`, icon: IndianRupee, color: '#16A34A' },
            { label: 'Avg Deal Value', value: `₹${(avgDeal / 100000).toFixed(0)}L`, icon: TrendingUp, color: '#D97706' },
            { label: 'Active CPs', value: channelPartners.length, icon: Users, color: '#2563EB' },
          ].map(s => (
            <div key={s.label} className="la-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}18`, color: s.color }}>
                  <s.icon size={15} />
                </div>
                <span className="text-xs text-slate-400">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-slate-800">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="la-card p-5">
            <h3 className="font-semibold text-slate-700 mb-4">Deal Funnel</h3>
            <div className="space-y-2">
              {funnelData.map((d, i) => {
                const maxVal = funnelData[0].value || 1;
                const pct = ((d.value / maxVal) * 100).toFixed(0);
                const convPct = i > 0 && funnelData[i - 1].value > 0 ? ((d.value / funnelData[i - 1].value) * 100).toFixed(0) : '100';
                return (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 text-right">{d.name}</span>
                    <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                      <div className="h-full rounded-lg transition-all" style={{ width: `${pct}%`, backgroundColor: d.fill }} />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-card-foreground">{d.value}</span>
                    </div>
                    {i > 0 && <span className="text-[10px] text-muted-foreground w-10">{convPct}%</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="la-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700">Unit Velocity</h3>
              <select value={velocityProject} onChange={e => setVelocityProject(e.target.value)} className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm">
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="units" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="la-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">CP Performance</h3>
            <button className="text-xs text-teal-600 flex items-center gap-1 hover:underline"><Download size={12} /> Export CSV</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-400 border-b border-slate-100 bg-slate-50/60">
                <th className="px-3 py-2.5 font-medium rounded-tl-lg">CP Name</th><th className="px-3 py-2.5 font-medium text-right">Leads</th>
                <th className="px-3 py-2.5 font-medium text-right">Visits</th><th className="px-3 py-2.5 font-medium text-right">Bookings</th>
                <th className="px-3 py-2.5 font-medium text-right">Conv %</th><th className="px-3 py-2.5 font-medium text-right rounded-tr-lg">Commission (₹)</th>
              </tr></thead>
              <tbody>{cpPerf.map(cp => (
                <tr key={cp.name} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-slate-800">{cp.name}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{cp.leads}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{cp.visits}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{cp.bookings}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{cp.conversion}%</td>
                  <td className="px-3 py-2.5 text-right text-teal-600 font-medium">₹{cp.commission.toLocaleString('en-IN')}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>

        <div className="la-card p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Project-wise Status</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-400 border-b border-slate-100 bg-slate-50/60">
                <th className="px-3 py-2.5 font-medium rounded-tl-lg">Project</th><th className="px-3 py-2.5 font-medium text-right">Total</th>
                <th className="px-3 py-2.5 font-medium text-right">Available</th><th className="px-3 py-2.5 font-medium text-right">Booked</th>
                <th className="px-3 py-2.5 font-medium text-right">Sold</th><th className="px-3 py-2.5 font-medium rounded-tr-lg">% Sold</th>
              </tr></thead>
              <tbody>{projects.map(p => {
                const pctSold = ((p.sold / p.totalUnits) * 100).toFixed(0);
                return (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-slate-800">{p.name}</td>
                    <td className="px-3 py-2.5 text-right text-slate-600">{p.totalUnits}</td>
                    <td className="px-3 py-2.5 text-right text-emerald-600">{p.available}</td>
                    <td className="px-3 py-2.5 text-right text-amber-600">{p.booked}</td>
                    <td className="px-3 py-2.5 text-right text-red-500">{p.sold}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-teal-500 rounded-full" style={{ width: `${pctSold}%` }} /></div>
                        <span className="text-xs text-slate-400 w-8">{pctSold}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BuilderAnalytics;
