import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/format';
import { Calculator, TrendingDown, Landmark, CalendarDays, IndianRupee, Info } from 'lucide-react';

const TEAL = '#0A7E8C';
const ORANGE = '#E87722';

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
  return `₹${v}`;
}

function fmtDisplay(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(0)} L`;
  return `₹${v}`;
}

interface SliderRowProps {
  label: string; value: number; min: number; max: number; step: number;
  display: string; onChange: (v: number) => void;
}
function SliderRow({ label, value, min, max, step, display, onChange }: SliderRowProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2.5">
      <div className="flex justify-between items-center">
        <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
        <span
          className="text-[13px] font-bold px-3 py-1 rounded-lg border border-border bg-muted/40 text-foreground"
        >
          {display}
        </span>
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-muted overflow-visible">
        <div
          className="absolute left-0 top-0 h-1.5 rounded-full"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${TEAL}aa, ${TEAL})` }}
        />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(+e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-card shadow-md pointer-events-none"
          style={{ left: `calc(${pct}% - 8px)`, backgroundColor: TEAL }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{fmtAmount(min)}</span>
        <span>{fmtAmount(max)}</span>
      </div>
    </div>
  );
}

const RADIAN = Math.PI / 180;
function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

type ActiveTab = 'chart' | 'schedule';

const CustomerEMI = () => {
  const [amount, setAmount] = useState(16500000);
  const [rate, setRate] = useState(8.65);
  const [tenure, setTenure] = useState(20);
  const [tab, setTab] = useState<ActiveTab>('chart');

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

        {/* ── Header ── */}
        <div className="flex items-center gap-3.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${TEAL}, #0d9488)` }}
          >
            <Calculator size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-foreground">EMI Calculator</h1>
            <p className="text-[12px] text-muted-foreground">Estimate your monthly home loan repayment</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* ── Left: Inputs ── */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 space-y-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Loan Parameters</p>

            <SliderRow
              label="Loan Amount" value={amount}
              min={1000000} max={100000000} step={500000}
              display={fmtDisplay(amount)}
              onChange={setAmount}
            />
            <SliderRow
              label="Interest Rate (p.a.)" value={rate}
              min={7} max={15} step={0.05}
              display={`${rate.toFixed(2)}%`}
              onChange={setRate}
            />
            <SliderRow
              label="Loan Tenure" value={tenure}
              min={5} max={30} step={1}
              display={`${tenure} yr`}
              onChange={setTenure}
            />

            {/* Composition donut */}
            <div className="pt-1 border-t border-border">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
                Loan Composition
              </p>
              <div className="flex items-center gap-4">
                <PieChart width={110} height={110}>
                  <Pie
                    data={pieData} cx={50} cy={50}
                    innerRadius={28} outerRadius={50}
                    startAngle={90} endAngle={-270}
                    dataKey="value" labelLine={false}
                    label={renderCustomLabel}
                  >
                    <Cell fill={TEAL} />
                    <Cell fill={ORANGE} />
                  </Pie>
                </PieChart>
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: TEAL }} />
                    <span className="text-[12px] text-muted-foreground flex-1">Principal</span>
                    <span className="text-[12px] font-bold text-foreground">{principalPct}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: ORANGE }} />
                    <span className="text-[12px] text-muted-foreground flex-1">Interest</span>
                    <span className="text-[12px] font-bold text-foreground">{interestPct}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Results ── */}
          <div className="lg:col-span-3 space-y-4">

            {/* EMI hero */}
            <div
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${TEAL}18 0%, ${TEAL}06 60%, transparent 100%)`, border: `1px solid ${TEAL}30` }}
            >
              <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-[0.06]" style={{ backgroundColor: TEAL }} />
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: TEAL }}>Monthly EMI</p>
              <p className="text-4xl font-black text-foreground leading-none">
                {formatCurrency(emi)}
              </p>
              <p className="text-[12px] text-muted-foreground mt-1.5">per month for {tenure} years</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Payable',  value: formatCurrency(totalPayable),  icon: Landmark,    color: TEAL   },
                { label: 'Total Interest', value: formatCurrency(totalInterest), icon: TrendingDown, color: ORANGE },
              ].map(s => (
                <div key={s.label} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${s.color}12`, color: s.color }}
                  >
                    <s.icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                    <p className="text-[14px] font-bold text-foreground truncate">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Repayment breakdown */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
                <p className="text-[13px] font-semibold text-foreground">Repayment Breakdown</p>
                <div className="flex gap-1 bg-muted/60 rounded-lg p-0.5">
                  {(['chart', 'schedule'] as ActiveTab[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`px-3 py-1 rounded-md text-[12px] font-medium transition-all capitalize ${
                        tab === t
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {tab === 'chart' && (
                <div className="p-5 pt-4">
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={yearlyData} barCategoryGap="30%">
                      <XAxis dataKey="year" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)' }} />
                      <YAxis
                        fontSize={10} tickLine={false} axisLine={false} width={40}
                        tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`}
                        tick={{ fill: 'var(--muted-foreground)' }}
                      />
                      <Tooltip
                        formatter={(v: number) => formatCurrency(v)}
                        contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
                        labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                      />
                      <Bar dataKey="principal" name="Principal" stackId="a" fill={TEAL} />
                      <Bar dataKey="interest" name="Interest" stackId="a" fill={ORANGE} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 mt-2 justify-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-2 rounded-sm" style={{ backgroundColor: TEAL }} />
                      <span className="text-[11px] text-muted-foreground">Principal</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-2 rounded-sm" style={{ backgroundColor: ORANGE }} />
                      <span className="text-[11px] text-muted-foreground">Interest</span>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'schedule' && (
                <div className="overflow-auto max-h-[260px]">
                  <table className="w-full text-[12px]">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                      <tr>
                        {['Month', 'EMI', 'Principal', 'Interest', 'Outstanding'].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((row, i) => (
                        <tr key={i} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2 text-muted-foreground">{row.month}</td>
                          <td className="px-4 py-2 font-semibold text-foreground">{formatCurrency(emi)}</td>
                          <td className="px-4 py-2 font-medium" style={{ color: TEAL }}>{formatCurrency(row.principal)}</td>
                          <td className="px-4 py-2 font-medium" style={{ color: ORANGE }}>{formatCurrency(row.interest)}</td>
                          <td className="px-4 py-2 text-foreground">{formatCurrency(row.outstanding)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Info strip */}
            <div
              className="rounded-xl px-4 py-3 flex flex-wrap gap-x-6 gap-y-2 items-center"
              style={{ backgroundColor: `${TEAL}0a`, border: `1px solid ${TEAL}20` }}
            >
              <div className="flex items-center gap-2">
                <CalendarDays size={13} style={{ color: TEAL }} />
                <span className="text-[12px] text-muted-foreground">
                  Loan closes in{' '}
                  <span className="font-semibold text-foreground">{tenure} years</span>
                  {' '}({n} EMIs)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Info size={13} style={{ color: ORANGE }} />
                <span className="text-[12px] text-muted-foreground">
                  Interest is{' '}
                  <span className="font-semibold" style={{ color: ORANGE }}>{interestPct}%</span>
                  {' '}of total outflow
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerEMI;