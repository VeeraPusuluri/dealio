import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import InvestmentCard from '@/components/shared/InvestmentCard';
import { investmentOpportunities } from '@/data/investments';
import { toast } from 'sonner';
import { TrendingUp, Wallet, Zap, BarChart3, X } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

const TAB_OPTIONS = [
  { id: 'active',     label: 'Active Investments' },
  { id: 'planner',    label: 'Investment Planner' },
  { id: 'calculator', label: 'Loan Offset Calculator' },
];

export default function CustomerInvestments() {
  const [tab, setTab] = useState('active');
  const [monthlyInvest, setMonthlyInvest] = useState(50000);
  const [expectedReturn, setExpectedReturn] = useState(15);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // Calculator constants (not dummy data — represents plausible example values)
  const loanOutstanding = 15800000;
  const yearsRemaining  = 19;
  const monthlyEmi      = 138500;

  const monthlyReturn = Math.round(monthlyInvest * expectedReturn / 100 / 12);
  const interestSaved = useMemo(() => Math.round(monthlyReturn * 12 * yearsRemaining * 0.45), [monthlyReturn, yearsRemaining]);
  const yearsSaved    = useMemo(() => monthlyReturn > 0 ? parseFloat((monthlyReturn / monthlyEmi * yearsRemaining * 0.8).toFixed(1)) : 0, [monthlyReturn, monthlyEmi, yearsRemaining]);

  const toggleCompare = (id: string) =>
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  const compared = investmentOpportunities.filter(o => compareIds.includes(o.id));

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-10 max-w-5xl">

        {/* Header */}
        <div>
          <h1 className="text-[18px] font-bold text-foreground">Investments</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Your money doesn't have to wait — invest while you live in your new home</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {TAB_OPTIONS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-[13px] font-semibold transition-all border-b-2 -mb-px ${
                tab === t.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Active Investments ── */}
        {tab === 'active' && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#0A7E8C12' }}>
              <Wallet size={24} style={{ color: '#0A7E8C' }} />
            </div>
            <h3 className="text-[14px] font-bold text-foreground mb-1">No active investments yet</h3>
            <p className="text-[12px] text-muted-foreground max-w-xs mb-5">
              Once you start investing, your portfolio and returns will appear here.
              Explore the Investment Planner to get started.
            </p>
            <button onClick={() => setTab('planner')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}>
              <TrendingUp size={13} /> Explore Investment Planner
            </button>
          </div>
        )}

        {/* ── Investment Planner ── */}
        {tab === 'planner' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/40 border border-border p-4">
              <p className="text-[13px] text-foreground">
                <strong>Your home loan rate: 8.5% p.a.</strong> → Invest idle savings at 15% ROI → Net benefit: 6.5% per year →
                Use returns to prepay loan → Save 3–5 years of EMIs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {investmentOpportunities.map(o => (
                <InvestmentCard key={o.id} opportunity={o} showCompare
                  isCompared={compareIds.includes(o.id)} onCompareToggle={toggleCompare} />
              ))}
            </div>

            {compareIds.length >= 2 && (
              <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-2xl shadow-xl px-6 py-3 flex items-center gap-4">
                <span className="text-[13px] font-medium text-foreground">{compareIds.length} selected</span>
                <button onClick={() => setShowCompare(true)}
                  className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}>Compare</button>
                <button onClick={() => setCompareIds([])} className="text-[12px] text-muted-foreground hover:text-foreground">Clear</button>
              </div>
            )}

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-[13px] font-semibold text-amber-700 mb-1">💡 Combine strategies</p>
              <p className="text-[12px] text-foreground">
                Invest ₹2L in EV Charging (18% return) + ₹1L in NRE FD (7.25%) = blended return of 14.5%.
                Use returns to prepay home loan EMI and close loan 4 years early.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <p className="text-[14px] font-bold text-foreground mb-3">Ready to start investing?</p>
              <button onClick={() => toast.success('Our investment advisor will call you within 24 hours.')}
                className="px-6 py-2.5 rounded-xl text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #16A34A, #14B040)' }}>
                Talk to an Investment Advisor
              </button>
            </div>
          </div>
        )}

        {/* ── Loan Offset Calculator ── */}
        {tab === 'calculator' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 size={15} style={{ color: '#0A7E8C' }} />
                <h3 className="text-[14px] font-bold text-foreground">Loan Offset Calculator</h3>
              </div>
              <p className="text-[12px] text-muted-foreground mb-5">
                Your home loan is at 8.5%. Invest idle savings at 15%+ and use returns to prepay your EMI.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-[12px] mb-2">
                      <span className="text-muted-foreground">Monthly Investment</span>
                      <span className="font-bold text-foreground">{formatCurrency(monthlyInvest)}</span>
                    </div>
                    <input type="range" min={5000} max={200000} step={5000} value={monthlyInvest}
                      onChange={e => setMonthlyInvest(Number(e.target.value))} className="w-full accent-teal-600" />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>₹5K</span><span>₹2L</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[12px] mb-2">
                      <span className="text-muted-foreground">Expected Return</span>
                      <span className="font-bold text-foreground">{expectedReturn}% p.a.</span>
                    </div>
                    <input type="range" min={8} max={22} step={1} value={expectedReturn}
                      onChange={e => setExpectedReturn(Number(e.target.value))} className="w-full accent-teal-600" />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>FD 7.5%</span><span>Solar 16%</span><span>EV 18%</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted/40 border border-border p-3 text-[12px] text-muted-foreground space-y-0.5">
                    <div className="flex justify-between"><span>Loan Outstanding</span><span className="font-medium text-foreground">{formatCurrency(loanOutstanding)}</span></div>
                    <div className="flex justify-between"><span>Years Remaining</span><span className="font-medium text-foreground">{yearsRemaining} yrs</span></div>
                    <div className="flex justify-between"><span>Monthly EMI</span><span className="font-medium text-foreground">{formatCurrency(monthlyEmi)}</span></div>
                  </div>
                </div>

                <div className="rounded-xl p-5 flex flex-col justify-center gap-3" style={{ background: 'linear-gradient(135deg, #0A7E8C0d, #16A34A0d)', border: '1px solid #0A7E8C20' }}>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-[0.08em] mb-1">Monthly Investment Returns</p>
                    <p className="text-[26px] font-bold" style={{ color: '#0A7E8C' }}>{formatCurrency(monthlyReturn)}/mo</p>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Zap size={13} className="text-amber-500" />
                      <p className="text-[13px] text-foreground">Loan closes <strong>{yearsSaved} years early</strong></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp size={13} className="text-emerald-600" />
                      <p className="text-[13px] text-foreground">Save <strong>{formatCurrency(interestSaved)}</strong> in interest</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      {showCompare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowCompare(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-foreground">Investment Comparison</h3>
              <button onClick={() => setShowCompare(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><X size={15} /></button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="p-3 text-left text-muted-foreground font-medium">Attribute</th>
                    {compared.map(c => <th key={c.id} className="p-3 text-left font-bold text-foreground">{c.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'Returns', render: (c: typeof compared[0]) => <span className="font-medium text-teal-600">{c.returnMin}–{c.returnMax}%</span> },
                    { key: 'Lock-in', render: (c: typeof compared[0]) => `${c.lockInYears} yrs` },
                    { key: 'Min Amount', render: (c: typeof compared[0]) => `₹${c.minAmount.toLocaleString('en-IN')}` },
                    { key: 'Risk', render: (c: typeof compared[0]) => c.risk },
                    { key: 'Repatriable', render: (c: typeof compared[0]) => c.repatriable ? '✅ Yes' : 'No' },
                    { key: 'Tax-free', render: (c: typeof compared[0]) => c.taxFree ? '✅ Yes' : 'No' },
                  ].map(row => (
                    <tr key={row.key} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                      <td className="p-3 text-muted-foreground">{row.key}</td>
                      {compared.map(c => <td key={c.id} className="p-3 text-foreground">{row.render(c)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
