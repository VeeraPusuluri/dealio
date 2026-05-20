import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { nriDocuments } from '@/data/nriData';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Upload, MessageCircle, Phone } from 'lucide-react';
import { toast } from 'sonner';

const NRILoan = () => {
  const [expandedCat, setExpandedCat] = useState<string | null>('Tax');
  const [prepayMonthly, setPrepayMonthly] = useState(5000);

  const loanDetails = { bank: 'HDFC Bank', amount: 16500000, rate: 8.65, emi: 138500, tenure: 20, officer: 'Ramesh Babu', officerPhone: '9800001234', outstanding: 15800000, yearsRemaining: 19 };

  const stages = ['Applied', 'Documents Submitted', 'Under Review', 'Sanctioned', 'Disbursed'];
  const currentStage = 3;

  const docCategories = [
    { name: 'KYC', docs: [{ name: 'Passport (UAE)', ok: true }, { name: 'Visa / Residence Permit', ok: true }, { name: 'Overseas Address Proof', ok: true }] },
    { name: 'Identity', docs: [{ name: 'PAN Card', ok: true }, { name: 'Aadhaar Card', ok: true }] },
    { name: 'Income', docs: [{ name: 'Salary Slips (3 months, AED)', ok: true }, { name: 'Employment Contract', ok: true }, { name: 'Overseas Bank Statement (6 months)', ok: true }] },
    { name: 'NRE Account', docs: [{ name: 'NRE Account Statement — 6 months', ok: true }, { name: 'NRE Passbook First Page', ok: true }] },
    { name: 'Property', docs: [{ name: 'Allotment Letter', ok: true }, { name: 'Builder-buyer Agreement', ok: true }, { name: 'RERA Certificate', ok: true }] },
    { name: 'Tax', docs: [{ name: 'Form 15CA / CB', ok: false }, { name: 'Employer NOC', ok: false }] },
  ];

  const prepayCalc = useMemo(() => {
    const r = loanDetails.rate / 1200;
    const n = loanDetails.yearsRemaining * 12;
    const totalInterestWithout = loanDetails.emi * n - loanDetails.outstanding;
    const newEmi = loanDetails.emi + prepayMonthly;
    const newMonths = prepayMonthly > 0 ? Math.ceil(Math.log(newEmi / (newEmi - loanDetails.outstanding * r)) / Math.log(1 + r)) : n;
    const totalInterestWith = newEmi * newMonths - loanDetails.outstanding;
    const monthsSaved = n - newMonths;
    const interestSaved = Math.max(0, totalInterestWithout - totalInterestWith);
    return { totalInterestWithout, totalInterestWith, monthsSaved, interestSaved, newMonths };
  }, [prepayMonthly, loanDetails]);

  const fmt = (v: number) => v >= 10000000 ? `₹${(v / 10000000).toFixed(2)}Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString('en-IN')}`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Status Stepper */}
        <div className="bg-card rounded-xl p-5 border">
          <h3 className="font-semibold mb-4">Loan Status</h3>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {stages.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-shrink-0">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${i < currentStage ? 'bg-green-100 text-green-800' : i === currentStage ? 'text-white' : 'bg-muted text-muted-foreground'}`} style={i === currentStage ? { backgroundColor: '#F5A623' } : {}}>
                  {i < currentStage ? <CheckCircle2 size={14} /> : null}{s}
                </div>
                {i < stages.length - 1 && <div className="w-6 h-px bg-border" />}
              </div>
            ))}
          </div>
        </div>

        {/* Loan Summary */}
        <div className="bg-card rounded-xl p-5 border">
          <h3 className="font-semibold mb-3">Loan Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Bank</p><p className="font-medium">{loanDetails.bank}</p></div>
            <div><p className="text-xs text-muted-foreground">Amount</p><p className="font-medium">{fmt(loanDetails.amount)}</p></div>
            <div><p className="text-xs text-muted-foreground">Rate</p><p className="font-medium">{loanDetails.rate}% p.a.</p></div>
            <div><p className="text-xs text-muted-foreground">EMI</p><p className="font-medium">{fmt(loanDetails.emi)}/month</p></div>
            <div><p className="text-xs text-muted-foreground">Tenure</p><p className="font-medium">{loanDetails.tenure} years</p></div>
            <div>
              <p className="text-xs text-muted-foreground">Officer</p><p className="font-medium">{loanDetails.officer}</p>
              <div className="flex gap-1 mt-1">
                <a href={`tel:${loanDetails.officerPhone}`} className="p-1 rounded hover:bg-muted"><Phone size={14} /></a>
                <a href={`https://wa.me/91${loanDetails.officerPhone}`} target="_blank" className="p-1 rounded hover:bg-muted"><MessageCircle size={14} className="text-green-500" /></a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Documents */}
          <div className="lg:col-span-2 bg-card rounded-xl p-5 border">
            <h3 className="font-semibold mb-4">NRI Loan Document Checklist</h3>
            <div className="space-y-2">
              {docCategories.map(cat => {
                const done = cat.docs.filter(d => d.ok).length;
                const isExpanded = expandedCat === cat.name;
                return (
                  <div key={cat.name} className="border rounded-lg">
                    <button onClick={() => setExpandedCat(isExpanded ? null : cat.name)} className="w-full flex items-center justify-between p-3 text-sm font-medium text-left">
                      <span>{cat.name}</span>
                      <Badge variant={done === cat.docs.length ? 'default' : 'destructive'} className={done === cat.docs.length ? 'bg-green-100 text-green-800' : ''}>{done}/{cat.docs.length}</Badge>
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2">
                        {cat.docs.map(d => (
                          <div key={d.name} className="flex items-center justify-between py-1.5">
                            <div className="flex items-center gap-2">{d.ok ? <CheckCircle2 size={14} className="text-green-500" /> : <AlertCircle size={14} className="text-red-500" />}<span className="text-sm">{d.name}</span></div>
                            {!d.ok && <button onClick={() => toast.success(`${d.name} uploaded`)} className="flex items-center gap-1 px-3 py-1 rounded text-xs font-medium text-white" style={{ backgroundColor: '#F5A623' }}><Upload size={12} /> Upload</button>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-card rounded-xl p-5 border">
            <h3 className="font-semibold mb-3">NRI Loan Tips</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>💡 Transfer payments via NRE account — tax-free and repatriable</p>
              <p>💰 Your EMI: {fmt(loanDetails.emi)}/month</p>
              <p>📋 Prepayment allowed with no penalty on floating rate loans</p>
              <p>🏛️ Section 24: Claim up to ₹2L interest deduction</p>
            </div>
          </div>
        </div>

        {/* Prepayment Impact Calculator */}
        <div className="bg-card rounded-xl p-5 border">
          <h3 className="font-semibold mb-1">Prepayment Impact Calculator</h3>
          <p className="text-xs text-muted-foreground mb-4">How investments can close your loan early</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="text-xs text-muted-foreground">Outstanding</p><p className="font-medium">{fmt(loanDetails.outstanding)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Current EMI</p><p className="font-medium">{fmt(loanDetails.emi)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Rate</p><p className="font-medium">{loanDetails.rate}%</p></div>
                  <div><p className="text-xs text-muted-foreground">Years Left</p><p className="font-medium">{loanDetails.yearsRemaining}</p></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Monthly Investment Returns (₹)</span><span className="font-medium">₹{prepayMonthly.toLocaleString('en-IN')}</span></div>
                <input type="range" min={0} max={50000} step={1000} value={prepayMonthly} onChange={e => setPrepayMonthly(Number(e.target.value))} className="w-full accent-[#F5A623]" />
                <p className="text-[10px] text-muted-foreground mt-1">Amount earned from investments each month, applied to loan</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted text-sm">
                <p className="text-xs text-muted-foreground">Without investing</p>
                <p>Loan closes in <strong>{loanDetails.yearsRemaining} years</strong>, total interest: <strong>{fmt(Math.round(prepayCalc.totalInterestWithout))}</strong></p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm">
                <p className="text-xs text-muted-foreground">With investment returns</p>
                <p>Loan closes in <strong>{(prepayCalc.newMonths / 12).toFixed(1)} years</strong> (saves <strong>{Math.floor(prepayCalc.monthsSaved / 12)} yrs {prepayCalc.monthsSaved % 12} mo</strong>)</p>
                <p className="text-green-700 font-semibold mt-1">Interest saved: {fmt(Math.round(prepayCalc.interestSaved))}</p>
              </div>
              {prepayMonthly > 0 && (
                <div className="p-3 rounded-lg text-sm font-medium text-center" style={{ backgroundColor: '#F5A62315', color: '#F5A623' }}>
                  You save {fmt(Math.round(prepayCalc.interestSaved))} by investing ₹{prepayMonthly.toLocaleString('en-IN')}/month
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NRILoan;
