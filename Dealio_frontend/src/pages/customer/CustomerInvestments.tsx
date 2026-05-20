import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import InvestmentCard from '@/components/shared/InvestmentCard';
import { investmentOpportunities, customerInvestments } from '@/data/investments';
import { toast } from 'sonner';
import StatCard from '@/components/shared/StatCard';
import { TrendingUp, Wallet, CreditCard, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CustomerInvestments = () => {
  const [monthlyInvest, setMonthlyInvest] = useState(50000);
  const [expectedReturn, setExpectedReturn] = useState(15);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const monthlyReturn = Math.round(monthlyInvest * expectedReturn / 100 / 12);
  const loanOutstanding = 15800000;
  const yearsRemaining = 19;
  const monthlyEmi = 138500;

  const interestSaved = useMemo(() => {
    const totalAdditional = monthlyReturn * 12 * yearsRemaining;
    return Math.round(totalAdditional * 0.45);
  }, [monthlyReturn, yearsRemaining]);

  const yearsSaved = useMemo(() => {
    if (monthlyReturn <= 0) return 0;
    return parseFloat((monthlyReturn / monthlyEmi * yearsRemaining * 0.8).toFixed(1));
  }, [monthlyReturn, monthlyEmi, yearsRemaining]);

  const toggleCompare = (id: string) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  };
  const compared = investmentOpportunities.filter(o => compareIds.includes(o.id));

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8">
        <div className="pt-1">
          <h1 className="text-xl font-bold text-gray-900">Investments</h1>
          <p className="text-sm text-gray-500">Your money doesn't have to wait — invest while you live in your new home</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard title="Total Invested" value="₹2,00,000" icon={Wallet} color="#0A7E8C" />
          <StatCard title="Monthly Returns" value="₹2,800" icon={TrendingUp} color="#16A34A" />
          <StatCard title="Used for Prepayment" value="₹5,600" icon={CreditCard} color="#E87722" />
          <StatCard title="Next Payout" value="Feb 1, 2025" icon={Calendar} color="#6B3FA0" />
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">Active Investments</TabsTrigger>
            <TabsTrigger value="planner">Investment Planner</TabsTrigger>
            <TabsTrigger value="calculator">Loan Offset Calculator</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-2">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Active Investments</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400">
                    <th className="p-3 text-left font-medium">Name</th>
                    <th className="p-3 text-left font-medium">Invested</th>
                    <th className="p-3 text-left font-medium">Monthly Return</th>
                    <th className="p-3 text-left font-medium">Total Earned</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium">Maturity</th>
                  </tr></thead>
                  <tbody>
                    {customerInvestments.map(inv => (
                      <tr key={inv.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">{inv.name}</td>
                        <td className="p-3 text-gray-700">₹{inv.amountInvested.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-emerald-600 font-medium">₹{inv.monthlyReturn.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-gray-700">₹{inv.totalEarned.toLocaleString('en-IN')}</td>
                        <td className="p-3"><span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">{inv.status}</span></td>
                        <td className="p-3 text-gray-500">{inv.maturityDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="planner" className="space-y-4 mt-2">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-sm text-gray-700"><strong>Your home loan rate: 8.5% p.a.</strong> → If you invest idle savings at 15% ROI → Net benefit: 6.5% per year → Use returns to prepay loan → Save 3–5 years of EMIs</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {investmentOpportunities.map(o => (
                <InvestmentCard key={o.id} opportunity={o} showCompare isCompared={compareIds.includes(o.id)} onCompareToggle={toggleCompare} />
              ))}
            </div>
            {compareIds.length >= 2 && (
              <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl px-6 py-3 flex items-center gap-4">
                <span className="text-sm font-medium text-gray-900">{compareIds.length} selected</span>
                <button onClick={() => setShowCompare(true)} className="px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90" style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>Compare</button>
                <button onClick={() => setCompareIds([])} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
              </div>
            )}
            {showCompare && (
              <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setShowCompare(false)}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
                  <h3 className="font-bold text-lg mb-4 text-gray-900">Investment Comparison</h3>
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="p-3 text-left text-gray-500 font-medium">Attribute</th>{compared.map(c => <th key={c.id} className="p-3 text-left font-semibold text-gray-900">{c.name}</th>)}</tr></thead>
                      <tbody>
                        <tr className="border-b border-gray-50"><td className="p-3 text-gray-400">Returns</td>{compared.map(c => <td key={c.id} className="p-3 font-medium text-teal-600">{c.returnMin}–{c.returnMax}%</td>)}</tr>
                        <tr className="border-b border-gray-50"><td className="p-3 text-gray-400">Lock-in</td>{compared.map(c => <td key={c.id} className="p-3 text-gray-700">{c.lockInYears} yrs</td>)}</tr>
                        <tr className="border-b border-gray-50"><td className="p-3 text-gray-400">Min Amount</td>{compared.map(c => <td key={c.id} className="p-3 text-gray-700">₹{c.minAmount.toLocaleString('en-IN')}</td>)}</tr>
                        <tr className="border-b border-gray-50"><td className="p-3 text-gray-400">Risk</td>{compared.map(c => <td key={c.id} className="p-3 text-gray-700">{c.risk}</td>)}</tr>
                        <tr className="border-b border-gray-50"><td className="p-3 text-gray-400">Repatriable</td>{compared.map(c => <td key={c.id} className="p-3 text-gray-700">{c.repatriable ? '✅ Yes' : 'No'}</td>)}</tr>
                        <tr><td className="p-3 text-gray-400">Tax-free</td>{compared.map(c => <td key={c.id} className="p-3 text-gray-700">{c.taxFree ? '✅ Yes' : 'No'}</td>)}</tr>
                      </tbody>
                    </table>
                  </div>
                  <button onClick={() => setShowCompare(false)} className="mt-4 px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">Close</button>
                </div>
              </div>
            )}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-700">💡 Combine strategies</p>
              <p className="text-xs text-gray-600 mt-1">Invest ₹2L in EV Charging (18% return) + ₹1L in NRE FD (7.25%) = blended return of 14.5%. Use returns to prepay home loan EMI and close loan 4 years early.</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="font-semibold text-gray-900 mb-3">Ready to start investing?</p>
              <button onClick={() => toast.success('Our investment advisor will call you within 24 hours')} className="px-6 py-2.5 rounded-xl text-white font-medium text-sm hover:opacity-90" style={{ background: 'linear-gradient(135deg, #16A34A, #14B040)' }}>
                I want to start investing
              </button>
            </div>
          </TabsContent>

          <TabsContent value="calculator" className="mt-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Loan Offset Calculator</h3>
              <p className="text-xs text-gray-400 mb-5">Your home loan is at 8.5%. Invest idle savings at 15%+ and use returns to prepay your EMI.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-400">Monthly Investment</span><span className="font-semibold text-gray-900">₹{monthlyInvest.toLocaleString('en-IN')}</span></div>
                    <input type="range" min={5000} max={200000} step={5000} value={monthlyInvest} onChange={e => setMonthlyInvest(Number(e.target.value))} className="w-full accent-teal-600" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-400">Expected Return %</span><span className="font-semibold text-gray-900">{expectedReturn}%</span></div>
                    <input type="range" min={8} max={22} step={1} value={expectedReturn} onChange={e => setExpectedReturn(Number(e.target.value))} className="w-full accent-teal-600" />
                    <div className="flex gap-3 mt-1 text-[10px] text-gray-400"><span>FD=7.5%</span><span>Solar=16%</span><span>EV=18%</span></div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-sm text-gray-700">At {expectedReturn}% returns on ₹{monthlyInvest.toLocaleString('en-IN')}/month</p>
                  <p className="text-lg font-bold text-emerald-700 mt-1">→ ₹{monthlyReturn.toLocaleString('en-IN')} returns/month</p>
                  <p className="text-sm mt-2 text-gray-700">Applied to EMI → Loan closes <strong>{yearsSaved} years early</strong></p>
                  <p className="text-sm text-emerald-700 font-semibold">You save ₹{(interestSaved / 100000).toFixed(1)}L in interest</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CustomerInvestments;