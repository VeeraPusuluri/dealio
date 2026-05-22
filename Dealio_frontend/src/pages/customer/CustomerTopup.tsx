import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { CheckCircle2, Info } from 'lucide-react';

const CustomerTopup = () => {
  const [outstanding, setOutstanding] = useState(15800000);
  const [propertyValue, setPropertyValue] = useState(25200000);
  const [yearsPaid, setYearsPaid] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState(180000);
  const [checked, setChecked] = useState(false);
  const [topupAmount, setTopupAmount] = useState(2000000);
  const [purpose, setPurpose] = useState('Home Renovation');
  const [showForm, setShowForm] = useState(false);

  const maxTopup = useMemo(() => Math.max(0, Math.round(propertyValue * 0.8 - outstanding)), [propertyValue, outstanding]);
  const isEligible = maxTopup > 0 && yearsPaid >= 1;
  const topupRate = 9.25;
  const remainingTenure = 19;
  const topupEmi = useMemo(() => {
    const r = topupRate / 1200;
    const n = remainingTenure * 12;
    return Math.round(topupAmount * r / (1 - Math.pow(1 + r, -n)));
  }, [topupAmount, remainingTenure]);

  const suggestions = [
    { text: 'Invest ₹10L in Solar Rooftop → earn ₹16,000/month → covers top-up EMI', color: '#16A34A' },
    { text: "Use ₹5L for kids' education → invest the rest, returns offset the EMI", color: '#6B3FA0' },
    { text: 'Invest top-up in EV Charging → 18% returns > 9.25% cost → net gain 8.75% per year', color: '#E87722' },
    { text: 'Prepay existing loan → reduce tenure by 3 years → save ₹12L in interest', color: '#0A7E8C' },
  ];

  const inp = 'w-full mt-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary focus:bg-white transition-all';

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8">
        <div className="pt-1">
          <h1 className="text-xl font-bold text-gray-900">Loan Top-up</h1>
          <p className="text-sm text-gray-500">Need more funds? Top up your existing home loan.</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
          <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold">What is a Top-up Loan?</p>
            <p className="mt-1 text-blue-700">A home loan top-up lets you borrow additional funds at attractive rates (8.5–9.5%). Use for: renovation, interior, education, medical, or personal needs. No new property documentation needed.</p>
          </div>
        </div>

        {/* Eligibility */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Check Your Eligibility</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-xs text-gray-400">Current Loan Outstanding (₹)</label><input type="number" value={outstanding} onChange={e => setOutstanding(Number(e.target.value))} className={inp} /></div>
            <div><label className="text-xs text-gray-400">Current Property Value (₹)</label><input type="number" value={propertyValue} onChange={e => setPropertyValue(Number(e.target.value))} className={inp} /></div>
            <div><label className="text-xs text-gray-400">Years of EMI Paid on Time</label><input type="number" value={yearsPaid} onChange={e => setYearsPaid(Number(e.target.value))} className={inp} /></div>
            <div><label className="text-xs text-gray-400">Monthly Income (₹)</label><input type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(Number(e.target.value))} className={inp} /></div>
          </div>
          <button onClick={() => setChecked(true)} className="px-6 py-2.5 rounded-xl text-white font-medium text-sm hover:opacity-90" style={{ background: 'linear-gradient(135deg, #16A34A, #14B040)' }}>
            Check My Eligibility
          </button>
        </div>

        {checked && (
          <div className={`rounded-2xl p-5 border ${isEligible ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            {isEligible ? (
              <>
                <p className="text-lg font-bold text-emerald-700">Great news! You're eligible for a Top-up of up to ₹{(maxTopup / 100000).toFixed(1)}L</p>
                <p className="text-sm text-emerald-600 mt-1">(₹{(propertyValue / 10000000).toFixed(2)}Cr × 80%) − ₹{(outstanding / 10000000).toFixed(2)}Cr = ₹{(maxTopup / 100000).toFixed(1)}L</p>
                <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
                  <div><p className="text-xs text-gray-500">Interest Rate</p><p className="font-semibold text-gray-900">{topupRate}% p.a.</p></div>
                  <div><p className="text-xs text-gray-500">Max Tenure</p><p className="font-semibold text-gray-900">{remainingTenure} years</p></div>
                  <div><p className="text-xs text-gray-500">EMI on ₹20L</p><p className="font-semibold text-gray-900">₹{topupEmi.toLocaleString('en-IN')}/month</p></div>
                </div>
                <button onClick={() => setShowForm(true)} className="mt-4 px-6 py-2.5 rounded-xl text-white font-medium text-sm hover:opacity-90" style={{ background: 'linear-gradient(135deg, #16A34A, #14B040)' }}>Apply for Top-up</button>
              </>
            ) : (
              <p className="text-red-700 font-medium">Not eligible yet. You need at least 1 year of timely EMI payments and positive equity.</p>
            )}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Top-up Application</h3>
            <div>
              <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-400">Amount Required</span><span className="font-semibold text-gray-900">₹{topupAmount.toLocaleString('en-IN')}</span></div>
              <input type="range" min={100000} max={maxTopup} step={100000} value={topupAmount} onChange={e => setTopupAmount(Number(e.target.value))} className="w-full accent-emerald-600" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Purpose</label>
              <select value={purpose} onChange={e => setPurpose(e.target.value)} className={inp}>
                {['Home Renovation', 'Education', 'Medical', 'Personal', 'Business', 'Repay Other Loan', 'Investment'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-700">
              EMI for ₹{(topupAmount / 100000).toFixed(0)}L: <strong>₹{topupEmi.toLocaleString('en-IN')}/month</strong> at {topupRate}% for {remainingTenure} years
            </div>
            <div className="text-sm">
              <p className="font-semibold text-gray-900 mb-2">Documents needed:</p>
              {['Latest salary slips', 'Last 6 months bank statement', 'Property documents (already with bank)'].map(d => (
                <div key={d} className="flex items-center gap-2 py-1"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /><span className="text-gray-600">{d}</span></div>
              ))}
            </div>
            <button onClick={() => toast.success('Application submitted to HDFC Bank. Ramesh Babu will contact you within 48 hours.')} className="w-full py-2.5 rounded-xl text-white font-medium text-sm hover:opacity-90" style={{ background: 'linear-gradient(135deg, #16A34A, #14B040)' }}>
              Apply for Top-up
            </button>
          </div>
        )}

        {/* Suggestions */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-3">Smart Ways to Use Your Top-up</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-sm text-gray-700" style={{ borderLeftWidth: 3, borderLeftColor: s.color }}>
                {s.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerTopup;