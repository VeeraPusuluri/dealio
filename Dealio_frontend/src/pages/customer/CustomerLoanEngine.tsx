import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Calculator, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';

const bankProducts = [
  { name: 'HDFC Bank', rate: 8.50, maxTenure: 30, processingFee: 0.5, scheme: 'Special NRI rates available' },
  { name: 'SBI Home Loans', rate: 8.25, maxTenure: 30, processingFee: 0.35, scheme: 'Women borrowers get 0.05% concession' },
  { name: 'ICICI Bank', rate: 8.90, maxTenure: 25, processingFee: 0.5, scheme: null },
  { name: 'Axis Bank', rate: 8.75, maxTenure: 30, processingFee: 0.5, scheme: 'Pre-approved for salaried' },
  { name: 'Kotak Mahindra', rate: 8.65, maxTenure: 25, processingFee: 1.0, scheme: 'Balance transfer at 8.5%' },
];

const inp = 'w-full mt-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary focus:bg-white transition-all';

const CustomerLoanEngine = () => {
  const [income, setIncome] = useState(0);
  const [existingEmi, setExistingEmi] = useState(0);
  const [propertyValue, setPropertyValue] = useState(0);
  const [tenure, setTenure] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [showDigilocker, setShowDigilocker] = useState(false);
  const [digiDone, setDigiDone] = useState(false);

  const netAvailable = income * 0.5 - existingEmi;
  const r = rate / 100 / 12;
  const n = tenure * 12;
  const maxLoanByIncome = netAvailable > 0 ? (netAvailable * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n)) : 0;
  const maxLoanByLTV = propertyValue * 0.8;
  const eligibleLoan = Math.min(maxLoanByIncome, maxLoanByLTV);
  const emi = eligibleLoan > 0 ? (eligibleLoan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : 0;

  const handleDigilocker = () => {
    setShowDigilocker(true);
    setTimeout(() => { setDigiDone(true); setShowDigilocker(false); }, 2000);
  };

  const eligibilityColor = eligibleLoan > 5000000 ? 'bg-emerald-50 border-emerald-200' : eligibleLoan > 2000000 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
  const eligibilityTextColor = eligibleLoan > 5000000 ? 'text-emerald-700' : eligibleLoan > 2000000 ? 'text-amber-700' : 'text-red-700';

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8">
        <div className="pt-1">
          <h1 className="text-xl font-bold text-gray-900">Home Loan</h1>
          <p className="text-sm text-gray-500">Check eligibility, compare banks, and apply</p>
        </div>

        {/* Eligibility Calculator */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Calculator size={16} className="text-secondary" /> Check Eligibility
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs text-gray-400">Gross Monthly Income (₹)</label><input type="number" value={income || ''} onChange={e => setIncome(Number(e.target.value))} placeholder="e.g. 1,50,000" className={inp} /></div>
            <div><label className="text-xs text-gray-400">Existing EMI (₹)</label><input type="number" value={existingEmi || ''} onChange={e => setExistingEmi(Number(e.target.value))} placeholder="0 if none" className={inp} /></div>
            <div><label className="text-xs text-gray-400">Property Value (₹)</label><input type="number" value={propertyValue || ''} onChange={e => setPropertyValue(Number(e.target.value))} placeholder="e.g. 1,00,00,000" className={inp} /></div>
            <div><label className="text-xs text-gray-400">Interest Rate (%)</label><input type="number" step="0.05" value={rate} onChange={e => setRate(Number(e.target.value))} className={inp} /></div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-400">Tenure: {tenure} years</label>
              <input type="range" min={5} max={30} value={tenure} onChange={e => setTenure(Number(e.target.value))} className="w-full mt-1.5 accent-teal-600" />
            </div>
          </div>
          <div className={`p-4 rounded-xl border ${eligibilityColor}`}>
            <p className="text-sm font-semibold text-gray-900">You are eligible for a home loan up to</p>
            <p className={`text-2xl font-bold mt-1 ${eligibilityTextColor}`}>₹{Math.round(eligibleLoan).toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-1">Estimated EMI: ₹{Math.round(emi).toLocaleString('en-IN')}/month for {tenure} years at {rate}%</p>
          </div>
        </div>

        {/* DigiLocker */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h3 className="text-base font-semibold text-gray-900">Fetch Documents from DigiLocker</h3>
          {digiDone ? (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 flex items-center gap-1"><AlertCircle size={12} /> Demo mode — production integrates with the real DigiLocker API</p>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Documents connected successfully</p>
                  <p className="text-xs text-emerald-700 mt-0.5">Your KYC documents have been fetched from DigiLocker. A loan advisor will verify them shortly.</p>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={handleDigilocker} disabled={showDigilocker} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90" style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>
              {showDigilocker ? 'Connecting…' : 'Connect DigiLocker'}
            </button>
          )}
        </div>

        {/* Compare Banks */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 size={15} className="text-secondary" /> Compare Banks
          </h3>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-3 py-2.5 font-medium">Bank</th>
                  <th className="px-3 py-2.5 font-medium">Rate</th>
                  <th className="px-3 py-2.5 font-medium">Max Tenure</th>
                  <th className="px-3 py-2.5 font-medium">Processing Fee</th>
                  <th className="px-3 py-2.5 font-medium">Special</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {bankProducts.map(bp => (
                  <tr key={bp.name} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-gray-900">{bp.name}</td>
                    <td className="px-3 py-2.5 font-bold text-gray-900">{bp.rate}%</td>
                    <td className="px-3 py-2.5 text-gray-700">{bp.maxTenure} yrs</td>
                    <td className="px-3 py-2.5 text-gray-700">{bp.processingFee}%</td>
                    <td className="px-3 py-2.5 text-xs text-gray-400">{bp.scheme || '—'}</td>
                    <td className="px-3 py-2.5"><button onClick={() => setRate(bp.rate)} className="text-xs text-secondary font-medium hover:underline">Apply via Dealio</button></td>
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

export default CustomerLoanEngine;