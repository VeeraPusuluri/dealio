import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import { formatCurrency } from '@/lib/format';
import { DollarSign, TrendingUp, Clock, BarChart3, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, FunnelChart, Funnel, LabelList } from 'recharts';
import { toast } from 'sonner';

const gmvByMonth = [
  { month: 'Aug', gmv: 52 }, { month: 'Sep', gmv: 61 }, { month: 'Oct', gmv: 75 },
  { month: 'Nov', gmv: 68 }, { month: 'Dec', gmv: 84 }, { month: 'Jan', gmv: 92 },
];

const revenueByCity = [
  { city: 'Hyderabad', revenue: 58 }, { city: 'Mumbai', revenue: 24 },
  { city: 'Bangalore', revenue: 18 }, { city: 'Chennai', revenue: 12 },
];

const revenueByTier = [
  { name: 'Platinum', value: 45, color: '#8B5CF6' }, { name: 'Gold', value: 30, color: '#F59E0B' },
  { name: 'Silver', value: 18, color: '#6B7280' }, { name: 'Bronze', value: 7, color: '#B87333' },
];

const topProjects = [
  { name: 'My Home Avatar', revenue: 28 }, { name: 'Prestige Skyline', revenue: 22 },
  { name: 'Sobha Meridian', revenue: 18 }, { name: 'Incor Carmel Heights', revenue: 15 },
  { name: 'Mahindra Happinest', revenue: 12 }, { name: 'Aparna Sarovar', revenue: 10 },
];

const dealTrend = [
  { month: 'Aug', deals: 32, revenue: 52 }, { month: 'Sep', deals: 38, revenue: 61 },
  { month: 'Oct', deals: 45, revenue: 75 }, { month: 'Nov', deals: 41, revenue: 68 },
  { month: 'Dec', deals: 52, revenue: 84 }, { month: 'Jan', deals: 58, revenue: 92 },
];

const funnel = [
  { name: 'Leads', value: 1240, fill: '#3B82F6' },
  { name: 'Meetings', value: 680, fill: '#8B5CF6' },
  { name: 'Negotiations', value: 320, fill: '#F59E0B' },
  { name: 'Closed', value: 148, fill: '#16A34A' },
];

const breakdownData = [
  { builder: 'My Home Group', project: 'My Home Avatar', unitsSold: 45, gmv: 990000000, platformFee: 9900000, cpCommission: 29700000, netRevenue: 9900000 },
  { builder: 'Prestige Group', project: 'Prestige Skyline', unitsSold: 38, gmv: 456000000, platformFee: 4560000, cpCommission: 11400000, netRevenue: 4560000 },
  { builder: 'Sobha Ltd', project: 'Sobha Meridian', unitsSold: 28, gmv: 224000000, platformFee: 2240000, cpCommission: 4480000, netRevenue: 2240000 },
  { builder: 'Incor Infrastructure', project: 'Incor Carmel Heights', unitsSold: 22, gmv: 198000000, platformFee: 1980000, cpCommission: 4455000, netRevenue: 1980000 },
];

const AdminRevenue = () => {
  const [dateRange, setDateRange] = useState('This Month');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Filter */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {['This Month', 'Last 3 Months', 'Last 6 Months', 'This Year'].map(d => (
              <button key={d} onClick={() => setDateRange(d)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === d ? 'bg-[#6B3FA0] text-white' : 'bg-muted text-muted-foreground'}`}>{d}</button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total GMV" value="₹840Cr" icon={DollarSign} color="#6B3FA0" />
          <StatCard title="Platform Commission" value="₹42.6L" icon={TrendingUp} color="#16A34A" />
          <StatCard title="Pending Payouts" value="₹8.2L" icon={Clock} color="#F59E0B" />
          <StatCard title="Avg Deal Size" value="₹98L" icon={BarChart3} color="#0A7E8C" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg p-5 card-shadow border border-border">
            <h3 className="font-semibold text-card-foreground mb-4">GMV by Month (Cr)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={gmvByMonth}><XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} /><YAxis fontSize={11} tickLine={false} axisLine={false} /><Tooltip /><Bar dataKey="gmv" fill="#0D9488" radius={[4,4,0,0]} /></BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-lg p-5 card-shadow border border-border">
            <h3 className="font-semibold text-card-foreground mb-4">Revenue by City (Cr)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueByCity} layout="vertical"><XAxis type="number" fontSize={11} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="city" fontSize={11} tickLine={false} axisLine={false} width={80} /><Tooltip /><Bar dataKey="revenue" fill="#6B3FA0" radius={[0,4,4,0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg p-5 card-shadow border border-border">
            <h3 className="font-semibold text-card-foreground mb-4">Revenue by CP Tier</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart><Pie data={revenueByTier} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={2}>
                {revenueByTier.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">{revenueByTier.map(t => (
              <span key={t.name} className="text-xs text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />{t.name} ({t.value}%)</span>
            ))}</div>
          </div>
          <div className="bg-card rounded-lg p-5 card-shadow border border-border">
            <h3 className="font-semibold text-card-foreground mb-4">Top Projects by Revenue (Cr)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProjects} layout="vertical"><XAxis type="number" fontSize={11} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="name" fontSize={10} tickLine={false} axisLine={false} width={120} /><Tooltip /><Bar dataKey="revenue" fill="#E87722" radius={[0,4,4,0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg p-5 card-shadow border border-border">
            <h3 className="font-semibold text-card-foreground mb-4">Deal Volume vs Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dealTrend}><XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} /><YAxis yAxisId="left" fontSize={11} tickLine={false} axisLine={false} /><YAxis yAxisId="right" orientation="right" fontSize={11} tickLine={false} axisLine={false} /><Tooltip /><Line yAxisId="left" type="monotone" dataKey="deals" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} /><Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#6B3FA0" strokeWidth={2} dot={{ r: 3 }} /></LineChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Deals</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-600" />Revenue (Cr)</span>
            </div>
          </div>
          <div className="bg-card rounded-lg p-5 card-shadow border border-border">
            <h3 className="font-semibold text-card-foreground mb-4">Conversion Funnel</h3>
            <div className="space-y-3 mt-4">
              {funnel.map((f, i) => (
                <div key={f.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-card-foreground">{f.name}</span>
                    <span className="text-sm text-muted-foreground">{f.value}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-6">
                    <div className="h-6 rounded-full flex items-center justify-end pr-2" style={{ width: `${(f.value / funnel[0].value) * 100}%`, backgroundColor: f.fill }}>
                      <span className="text-[10px] text-white font-semibold">{Math.round((f.value / funnel[0].value) * 100)}%</span>
                    </div>
                  </div>
                  {i < funnel.length - 1 && <p className="text-[10px] text-muted-foreground text-right mt-0.5">→ {Math.round((funnel[i + 1].value / f.value) * 100)}% conversion</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="bg-card rounded-lg card-shadow border border-border">
          <div className="p-5 flex items-center justify-between border-b border-border">
            <h3 className="font-semibold text-card-foreground">Revenue Breakdown</h3>
            <button onClick={() => toast.success('CSV exported')} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#6B3FA0] text-white flex items-center gap-2"><Download size={14} /> Export CSV</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b border-border">
                <th className="px-4 py-3 font-medium">Builder</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium text-right">Units Sold</th>
                <th className="px-4 py-3 font-medium text-right">GMV</th>
                <th className="px-4 py-3 font-medium text-right">Platform Fee</th>
                <th className="px-4 py-3 font-medium text-right">CP Commission</th>
                <th className="px-4 py-3 font-medium text-right">Net Revenue</th>
              </tr></thead>
              <tbody>
                {breakdownData.map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-card-foreground">{r.builder}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.project}</td>
                    <td className="px-4 py-3 text-right text-card-foreground">{r.unitsSold}</td>
                    <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(r.gmv)}</td>
                    <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(r.platformFee)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(r.cpCommission)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-card-foreground">{formatCurrency(r.netRevenue)}</td>
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

export default AdminRevenue;
