import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import { formatCurrency } from '@/lib/format';
import { Users, Building2, DollarSign, TrendingUp, CreditCard, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const gmvTrend = Array.from({ length: 12 }, (_, i) => ({ month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i], gmv: 50 + Math.random() * 30 }));
const revSource = [{ name: 'SaaS', value: 18, color: '#0A7E8C' }, { name: 'Commission', value: 42, color: '#E87722' }, { name: 'Loan Fees', value: 24, color: '#2E5D8E' }, { name: 'Services', value: 10, color: '#7B5E3A' }, { name: 'JV', value: 6, color: '#C0392B' }];
const cpReg = [{ month: 'Aug', count: 120 }, { month: 'Sep', count: 145 }, { month: 'Oct', count: 180 }, { month: 'Nov', count: 160 }, { month: 'Dec', count: 210 }, { month: 'Jan', count: 195 }];

const AdminOverview = () => (
  <DashboardLayout>
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Users" value="3,240" icon={Users} color="#6B3FA0" />
        <StatCard title="Active Projects" value={42} icon={Building2} color="#0A7E8C" />
        <StatCard title="GMV" value="₹840Cr" icon={DollarSign} color="#E87722" />
        <StatCard title="Revenue (Month)" value="₹42.6L" icon={TrendingUp} color="#16A34A" />
        <StatCard title="Loans Sanctioned" value="₹124Cr" icon={CreditCard} color="#2E5D8E" />
        <StatCard title="Pending Approvals" value={7} icon={AlertTriangle} color="#DC2626" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg p-5 card-shadow border border-border">
          <h3 className="font-semibold text-card-foreground mb-4">GMV Trend (Cr)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={gmvTrend}><XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} /><YAxis fontSize={10} tickLine={false} axisLine={false} /><Tooltip /><Line type="monotone" dataKey="gmv" stroke="#6B3FA0" strokeWidth={2} dot={{ r: 3 }} /></LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-lg p-5 card-shadow border border-border">
          <h3 className="font-semibold text-card-foreground mb-4">CP Registrations</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={cpReg}><XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} /><YAxis fontSize={10} tickLine={false} axisLine={false} /><Tooltip /><Bar dataKey="count" fill="#E87722" radius={[4,4,0,0]} /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-lg p-5 card-shadow border border-border">
          <h3 className="font-semibold text-card-foreground mb-4">Revenue Sources</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={revSource} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={2}>
              {revSource.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-2 mt-2">{revSource.map(s => (
            <span key={s.name} className="text-[10px] text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />{s.name}</span>
          ))}</div>
        </div>
      </div>
    </div>
  </DashboardLayout>
);
export default AdminOverview;
