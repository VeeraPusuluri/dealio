import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/format';
import { Users, FileText, CheckCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const monthlyData = [
  { month: 'Aug', leads: 8, won: 2 }, { month: 'Sep', leads: 12, won: 4 },
  { month: 'Oct', leads: 10, won: 3 }, { month: 'Nov', leads: 15, won: 5 },
  { month: 'Dec', leads: 18, won: 6 }, { month: 'Jan', leads: 14, won: 4 },
];

const revenueData = [
  { month: 'Aug', revenue: 920000 }, { month: 'Sep', revenue: 1450000 },
  { month: 'Oct', revenue: 1100000 }, { month: 'Nov', revenue: 1820000 },
  { month: 'Dec', revenue: 2200000 }, { month: 'Jan', revenue: 1680000 },
];

const sourceData = [
  { name: 'CP Referral', value: 45, color: '#E87722' },
  { name: 'Builder', value: 30, color: '#0A7E8C' },
  { name: 'Direct', value: 25, color: '#7B5E3A' },
];

const topProjects = [
  { name: 'My Home Avatar', leads: 8 }, { name: 'Sobha Meridian', leads: 5 }, { name: 'Prestige Skyline', leads: 4 },
];

const VendorAnalytics = () => {
  const totalLeads = 14;
  const quotesSent = 11;
  const jobsWon = 4;
  const conversionRate = Math.round((jobsWon / totalLeads) * 100);
  const avgQuoteValue = 1396667;
  const quoteAcceptance = 61;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Leads This Month" value={totalLeads} icon={Users} color="#7B5E3A" />
          <StatCard title="Quotes Sent" value={quotesSent} icon={FileText} color="#E87722" />
          <StatCard title="Jobs Won" value={jobsWon} icon={CheckCircle} color="#16A34A" />
          <StatCard title="Conversion Rate" value={`${conversionRate}%`} icon={TrendingUp} color="#0A7E8C" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leads vs Jobs Won */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <h3 className="font-semibold text-card-foreground mb-4">Leads vs Jobs Won (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="leads" fill="#7B5E3A" radius={[4, 4, 0, 0]} name="Leads" />
                <Bar dataKey="won" fill="#16A34A" radius={[4, 4, 0, 0]} name="Won" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lead Sources */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <h3 className="font-semibold text-card-foreground mb-4">Lead Sources</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                    {sourceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {sourceData.map(s => (
                  <div key={s.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-sm text-card-foreground">{s.name}</span>
                    <span className="text-sm font-semibold text-card-foreground ml-auto">{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue by Month */}
          <div className="bg-card rounded-xl p-5 border border-border lg:col-span-2">
            <h3 className="font-semibold text-card-foreground mb-4">Revenue by Month</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#7B5E3A" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Side stats */}
          <div className="space-y-4">
            <div className="bg-card rounded-xl p-5 border border-border">
              <p className="text-xs text-muted-foreground">Avg Quote Value</p>
              <p className="text-xl font-bold text-card-foreground">{formatCurrency(avgQuoteValue)}</p>
            </div>
            <div className="bg-card rounded-xl p-5 border border-border">
              <p className="text-xs text-muted-foreground mb-2">Quote Acceptance Rate</p>
              <p className="text-xl font-bold text-card-foreground mb-2">{quoteAcceptance}%</p>
              <Progress value={quoteAcceptance} className="h-2" />
            </div>
            <div className="bg-card rounded-xl p-5 border border-border">
              <p className="text-xs text-muted-foreground mb-2">Top Projects by Leads</p>
              {topProjects.map(p => (
                <div key={p.name} className="flex items-center justify-between py-1">
                  <span className="text-sm text-card-foreground">{p.name}</span>
                  <span className="text-sm font-semibold" style={{ color: '#7B5E3A' }}>{p.leads}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VendorAnalytics;
