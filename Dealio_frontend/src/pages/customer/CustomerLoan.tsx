import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { formatCurrency } from '@/lib/format';
import {
  Calculator, CheckCircle2, Clock, ChevronDown, ChevronUp,
  TrendingUp, Banknote, CalendarDays, Percent, FileText,
  Phone, MessageCircle, Building2, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

const STAGES = ['Applied', 'Documents Pending', 'Processing', 'Sanctioned', 'Disbursed'] as const;

const inp = 'w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all placeholder:text-muted-foreground';

export default function CustomerLoan() {
  // EMI Calculator state (always shown)
  const [calcAmount, setCalcAmount] = useState(5000000);
  const [calcRate, setCalcRate] = useState(8.5);
  const [calcTenure, setCalcTenure] = useState(20);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleRows, setScheduleRows] = useState(6);

  const r = calcRate / 1200;
  const n = calcTenure * 12;
  const emi = useMemo(() => {
    if (r === 0) return Math.round(calcAmount / n);
    return Math.round(calcAmount * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
  }, [calcAmount, r, n]);

  const schedule = useMemo(() => {
    let bal = calcAmount;
    return Array.from({ length: n }, (_, i) => {
      const interest = Math.round(bal * r);
      const principal = emi - interest;
      bal = Math.max(0, bal - principal);
      return { month: i + 1, emi, principal, interest, outstanding: bal };
    });
  }, [calcAmount, emi, r, n]);

  const totalPayable = emi * n;
  const totalInterest = totalPayable - calcAmount;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10 max-w-4xl">

        {/* ── Header ── */}
        <div>
          <h1 className="text-[18px] font-bold text-foreground">Home Loan</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Track your loan status, EMI schedule and documents</p>
        </div>

        {/* ── Empty state — no active loan ── */}
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#0A7E8C12' }}>
            <Banknote size={26} style={{ color: '#0A7E8C' }} />
          </div>
          <h3 className="text-[15px] font-bold text-foreground mb-1">No loan linked yet</h3>
          <p className="text-[13px] text-muted-foreground max-w-xs mb-5">
            Once your home loan is approved and linked by your bank, your full loan dashboard will appear here.
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={() => toast.info('Our loan advisor will contact you within 24 hours.')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}>
              <Phone size={13} /> Talk to a Loan Advisor
            </button>
            <button
              onClick={() => toast.info('WhatsApp support coming soon.')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: '#25D366' }}>
              <MessageCircle size={13} /> WhatsApp Us
            </button>
          </div>
        </div>

        {/* ── Journey timeline preview ── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={15} style={{ color: '#0A7E8C' }} />
            <h3 className="text-[13px] font-bold text-foreground uppercase tracking-[0.08em]">Loan Journey</h3>
          </div>
          <div className="flex items-center gap-0 overflow-x-auto pb-2">
            {STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                    <span className="text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">{stage}</span>
                </div>
                {i < STAGES.length - 1 && (
                  <div className="w-10 h-px bg-border flex-shrink-0 mx-1 mb-4" />
                )}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 border-t border-border pt-3">
            Your loan status will update automatically as your bank processes the application.
          </p>
        </div>

        {/* ── Document checklist preview ── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={15} style={{ color: '#0A7E8C' }} />
            <h3 className="text-[13px] font-bold text-foreground uppercase tracking-[0.08em]">Document Checklist</h3>
          </div>
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 size={28} className="text-muted-foreground mb-2 opacity-40" />
            <p className="text-[13px] text-muted-foreground">Document requirements will appear once your loan is linked.</p>
          </div>
        </div>

        {/* ── EMI Calculator ── */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2" style={{ background: '#0A7E8C08' }}>
            <Calculator size={16} style={{ color: '#0A7E8C' }} />
            <h3 className="text-[14px] font-bold text-foreground">EMI Calculator</h3>
          </div>
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] flex items-center gap-1.5">
                  <Banknote size={11} /> Loan Amount (₹)
                </label>
                <input type="number" value={calcAmount}
                  onChange={e => setCalcAmount(Math.max(100000, Number(e.target.value)))}
                  className={inp} placeholder="e.g. 50,00,000" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] flex items-center gap-1.5">
                  <Percent size={11} /> Interest Rate (% p.a.)
                </label>
                <input type="number" step="0.1" value={calcRate}
                  onChange={e => setCalcRate(Math.max(1, Math.min(20, Number(e.target.value))))}
                  className={inp} placeholder="e.g. 8.5" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] flex items-center gap-1.5">
                  <CalendarDays size={11} /> Tenure (years)
                </label>
                <input type="number" value={calcTenure}
                  onChange={e => setCalcTenure(Math.max(1, Math.min(30, Number(e.target.value))))}
                  className={inp} placeholder="e.g. 20" />
              </div>
            </div>

            {/* Result */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Monthly EMI', value: formatCurrency(emi), accent: true },
                { label: 'Total Interest', value: formatCurrency(totalInterest), accent: false },
                { label: 'Total Payable', value: formatCurrency(totalPayable), accent: false },
              ].map(({ label, value, accent }) => (
                <div key={label} className={`rounded-xl p-4 ${accent ? 'text-white' : 'bg-muted/40 border border-border'}`}
                  style={accent ? { background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' } : undefined}>
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.1em] mb-1 ${accent ? 'text-white/70' : 'text-muted-foreground'}`}>{label}</p>
                  <p className={`text-[18px] font-bold ${accent ? 'text-white' : 'text-foreground'}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Visual breakdown */}
            <div>
              <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                <span>Principal: {((calcAmount / totalPayable) * 100).toFixed(0)}%</span>
                <span>Interest: {((totalInterest / totalPayable) * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden flex">
                <div className="h-full transition-all" style={{ width: `${(calcAmount / totalPayable) * 100}%`, background: '#0A7E8C' }} />
                <div className="h-full flex-1 bg-amber-400" />
              </div>
            </div>

            {/* Schedule toggle */}
            <button onClick={() => setShowSchedule(!showSchedule)}
              className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              {showSchedule ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {showSchedule ? 'Hide' : 'View'} Amortisation Schedule ({n} months)
            </button>

            {showSchedule && (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      {['Month', 'EMI', 'Principal', 'Interest', 'Outstanding'].map(h => (
                        <th key={h} className={`px-4 py-2.5 font-semibold text-muted-foreground ${h !== 'Month' ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.slice(0, scheduleRows).map(row => (
                      <tr key={row.month} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2 text-foreground">{row.month}</td>
                        <td className="px-4 py-2 text-right font-semibold text-foreground">{formatCurrency(row.emi)}</td>
                        <td className="px-4 py-2 text-right text-muted-foreground">{formatCurrency(row.principal)}</td>
                        <td className="px-4 py-2 text-right text-amber-600">{formatCurrency(row.interest)}</td>
                        <td className="px-4 py-2 text-right text-foreground">{formatCurrency(row.outstanding)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {scheduleRows < n && (
                  <button onClick={() => setScheduleRows(r => Math.min(r + 12, n))}
                    className="w-full py-2.5 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t border-border flex items-center justify-center gap-1.5">
                    <ArrowRight size={12} /> Load 12 more months
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Bank partnership strip ── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={15} style={{ color: '#0A7E8C' }} />
            <h3 className="text-[13px] font-bold text-foreground uppercase tracking-[0.08em]">Partner Banks</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {['HDFC Bank', 'SBI', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'PNB Housing'].map(bank => (
              <span key={bank} className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-muted border border-border text-muted-foreground">{bank}</span>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">Dealio works with leading banks to offer pre-approved loan options for your property.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
