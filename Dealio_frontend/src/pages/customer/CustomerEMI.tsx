import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/format';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calculator, TrendingDown, Landmark, CalendarDays, IndianRupee } from 'lucide-react';

function calcEmi(principal: number, annualRate: number, years: number) {
  const r = annualRate / 12 / 100;
  const n = years * 12;
  return Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
}

function buildYearly(amount: number, r: number, emi: number, tenure: number) {
  let balance = amount;
  return Array.from({ length: tenure }, (_, i) => {
    let principal = 0, interest = 0;
    for (let m = 0; m < 12; m++) {
      const intPart = balance * r;
      const prinPart = emi - intPart;
      principal += prinPart;
      interest += intPart;
      balance -= prinPart;
    }
    return { year: `Y${i + 1}`, principal: Math.round(principal), interest: Math.round(interest) };
  });
}

function buildSchedule(amount: number, r: number, emi: number, months: number) {
  let outstanding = amount;
  return Array.from({ length: months }, (_, i) => {
    const interest = Math.round(outstanding * r);
    const principal = emi - interest;
    outstanding = Math.max(0, outstanding - principal);
    return { month: i + 1, principal, interest, outstanding };
  });
}

function fmtAmount(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(0)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(0)} L`;
  return String(v);
}

interface SliderRowProps {
  label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void;
}
function SliderRow({ label, value, min, max, step, display, onChange }: SliderRowProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">{display}</span>
      </div>
      <div className="relative h-2 w-full rounded-full bg-gray-100 overflow-visible">
        <div className="absolute left-0 top-0 h-2 rounded-full bg-gradient-to-r from-secondary/70 to-secondary" style={{ width: `${pct}%` }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer" style={{ WebkitAppearance: 'none' }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-secondary border-2 border-white shadow-md pointer-events-none" style={{ left: `calc(${pct}% - 8px)` }} />
      </div>
      <div className="flex justify-between text-[11px] text-gray-400">
        <span>{fmtAmount(min)}</span><span>{fmtAmount(max)}</span>
      </div>
    </div>
  );
}

interface StatCardProps { label: string; value: string; icon: React.ReactNode; gradient: string; textColor: string; }
function StatCard({ label, value, icon, gradient, textColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${gradient}`}>{icon}</div>
      <div className="min-w-0">
        <p className={`text-base font-bold leading-tight ${textColor}`}>{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

const RADIAN = Math.PI / 180;
function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>{`${(percent * 100).toFixed(0)}%`}</text>;
}

const CustomerEMI = () => {
  const [amount, setAmount] = useState(16500000);
  const [rate, setRate] = useState(8.65);
  const [tenure, setTenure] = useState(20);

  const r = rate / 12 / 100;
  const n = tenure * 12;
  const emi = calcEmi(amount, rate, tenure);
  const totalPayable = emi * n;
  const totalInterest = totalPayable - amount;
  const interestPct = ((totalInterest / totalPayable) * 100).toFixed(1);
  const principalPct = ((amount / totalPayable) * 100).toFixed(1);
  const yearlyData = buildYearly(amount, r, emi, tenure);
  const schedule = buildSchedule(amount, r, emi, n);
  const pieData = [{ name: 'Principal', value: amount }, { name: 'Interest', value: totalInterest }];

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-5xl mx-auto pb-8">
        <div className="pt-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
            <Calculator className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">EMI Calculator</h1>
            <p className="text-sm text-gray-500">Estimate your monthly home loan repayment</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Sliders */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Loan Parameters</h2>
            <SliderRow label="Loan Amount" value={amount} min={1000000} max={100000000} step={500000}
              display={amount >= 10000000 ? `₹${(amount / 10000000).toFixed(2)} Cr` : `₹${(amount / 100000).toFixed(0)} L`} onChange={setAmount} />
            <SliderRow label="Interest Rate (p.a.)" value={rate} min={7} max={15} step={0.05} display={`${rate.toFixed(2)}%`} onChange={setRate} />
            <SliderRow label="Loan Tenure" value={tenure} min={5} max={30} step={1} display={`${tenure} yr`} onChange={setTenure} />
            <div className="pt-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Loan Composition</p>
              <div className="flex items-center gap-4">
                <PieChart width={110} height={110}>
                  <Pie data={pieData} cx={50} cy={50} innerRadius={28} outerRadius={50} startAngle={90} endAngle={-270} dataKey="value" labelLine={false} label={renderCustomLabel}>
                    <Cell fill="#0A7E8C" /><Cell fill="#E87722" />
                  </Pie>
                </PieChart>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-secondary inline-block" /><span className="text-gray-500">Principal</span><span className="ml-auto font-semibold text-gray-900">{principalPct}%</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-accent inline-block" /><span className="text-gray-500">Interest</span><span className="ml-auto font-semibold text-gray-900">{interestPct}%</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats + Charts */}
          <div className="lg:col-span-3 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard label="Monthly EMI" value={formatCurrency(emi)} icon={<IndianRupee className="w-4 h-4 text-secondary" />} gradient="bg-secondary/10" textColor="text-secondary" />
              <StatCard label="Total Interest" value={formatCurrency(totalInterest)} icon={<TrendingDown className="w-4 h-4 text-accent" />} gradient="bg-accent/10" textColor="text-accent" />
              <StatCard label="Total Payable" value={formatCurrency(totalPayable)} icon={<Landmark className="w-4 h-4 text-gray-500" />} gradient="bg-gray-100" textColor="text-gray-900" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <Tabs defaultValue="chart">
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-sm">Repayment Breakdown</h3>
                  <TabsList className="h-8 text-xs">
                    <TabsTrigger value="chart" className="text-xs px-3">Chart</TabsTrigger>
                    <TabsTrigger value="schedule" className="text-xs px-3">Schedule</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="chart" className="p-5 pt-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={yearlyData} barCategoryGap="30%">
                      <XAxis dataKey="year" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} width={42} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="principal" name="Principal" stackId="a" fill="#0A7E8C" />
                      <Bar dataKey="interest" name="Interest" stackId="a" fill="#E87722" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="schedule" className="overflow-auto max-h-[260px]">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm">
                      <tr>
                        {['Month', 'EMI', 'Principal', 'Interest', 'Outstanding'].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 font-semibold text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((row, i) => (
                        <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2 text-gray-500">{row.month}</td>
                          <td className="px-4 py-2 font-medium text-gray-900">{formatCurrency(emi)}</td>
                          <td className="px-4 py-2 text-secondary font-medium">{formatCurrency(row.principal)}</td>
                          <td className="px-4 py-2 text-accent">{formatCurrency(row.interest)}</td>
                          <td className="px-4 py-2 text-gray-900">{formatCurrency(row.outstanding)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TabsContent>
              </Tabs>
            </div>

            <div className="bg-secondary/5 border border-secondary/15 rounded-xl px-5 py-3 flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <CalendarDays className="w-4 h-4 text-secondary" />
                <span>Loan closes in <span className="font-semibold text-gray-900">{tenure} years</span> ({n} EMIs)</span>
              </div>
              <div className="text-gray-500">
                Interest cost is <span className="font-semibold text-accent">{interestPct}%</span> of total outflow
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerEMI;