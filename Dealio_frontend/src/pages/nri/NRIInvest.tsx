import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import InvestmentCard from '@/components/shared/InvestmentCard';
import { investmentOpportunities } from '@/data/investments';

const NRIInvest = () => {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const toggleCompare = (id: string) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  const compared = investmentOpportunities.filter(o => compareIds.includes(o.id));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Investment Planner</h2>
          <p className="text-sm text-muted-foreground mt-1">Make your money work while you wait to buy</p>
        </div>

        <div className="rounded-xl p-4 border" style={{ backgroundColor: '#0F203510' }}>
          <p className="text-sm"><strong>Your home loan rate: 8.5% p.a.</strong> → If you invest idle savings at 15% ROI → Net benefit: 6.5% per year → Use returns to prepay loan → Save 3–5 years of EMIs</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {investmentOpportunities.map(o => (
            <InvestmentCard key={o.id} opportunity={o} showCompare isCompared={compareIds.includes(o.id)} onCompareToggle={toggleCompare} />
          ))}
        </div>

        {compareIds.length >= 2 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border rounded-xl shadow-lg px-6 py-3 flex items-center gap-4">
            <span className="text-sm font-medium">{compareIds.length} selected</span>
            <button onClick={() => setShowCompare(true)} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#0F2035]">Compare</button>
            <button onClick={() => setCompareIds([])} className="text-xs text-muted-foreground">Clear</button>
          </div>
        )}

        {showCompare && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCompare(false)}>
            <div className="bg-card rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-lg mb-4">Investment Comparison</h3>
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="p-2 text-left">Attribute</th>{compared.map(c => <th key={c.id} className="p-2 text-left">{c.name}</th>)}</tr></thead>
                <tbody>
                  <tr className="border-b"><td className="p-2 text-muted-foreground">Returns</td>{compared.map(c => <td key={c.id} className="p-2 font-medium text-teal-600">{c.returnMin}–{c.returnMax}%</td>)}</tr>
                  <tr className="border-b"><td className="p-2 text-muted-foreground">Lock-in</td>{compared.map(c => <td key={c.id} className="p-2">{c.lockInYears} yrs</td>)}</tr>
                  <tr className="border-b"><td className="p-2 text-muted-foreground">Min Amount</td>{compared.map(c => <td key={c.id} className="p-2">₹{c.minAmount.toLocaleString('en-IN')}</td>)}</tr>
                  <tr className="border-b"><td className="p-2 text-muted-foreground">Risk</td>{compared.map(c => <td key={c.id} className="p-2">{c.risk}</td>)}</tr>
                  <tr className="border-b"><td className="p-2 text-muted-foreground">Repatriable</td>{compared.map(c => <td key={c.id} className="p-2">{c.repatriable ? '✅ Yes' : 'No'}</td>)}</tr>
                  <tr><td className="p-2 text-muted-foreground">Tax-free</td>{compared.map(c => <td key={c.id} className="p-2">{c.taxFree ? '✅ Yes' : 'No'}</td>)}</tr>
                </tbody>
              </table>
              <button onClick={() => setShowCompare(false)} className="mt-4 px-4 py-2 rounded-lg text-sm border">Close</button>
            </div>
          </div>
        )}

        <div className="bg-card rounded-xl p-4 border" style={{ backgroundColor: '#F5A62308' }}>
          <p className="text-sm font-medium" style={{ color: '#F5A623' }}>💡 Combine strategies</p>
          <p className="text-xs text-muted-foreground mt-1">Invest ₹2L in EV Charging (18% return) + ₹1L in NRE FD (7.25%) = blended return of 14.5%. Use returns to prepay home loan EMI and close loan 4 years early.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NRIInvest;
