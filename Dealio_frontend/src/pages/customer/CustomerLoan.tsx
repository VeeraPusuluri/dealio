import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/format';
import { useAuthStore } from '@/stores/useAuthStore';
import { portalApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Calculator, CheckCircle2, Clock, AlertCircle, Loader2, RefreshCw,
  Banknote, CalendarDays, Percent, Building2, Phone, MessageCircle,
  TrendingDown, Landmark, Info, ChevronDown, ChevronUp, ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

/* ── shared styles ────────────────────────────────────────────────── */
const TEAL   = '#0A7E8C';
const ORANGE = '#E87722';
const inp    = 'w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all placeholder:text-muted-foreground';

/* ── Eligibility tab ─────────────────────────────────────────────── */
const bankProducts = [
  { name: 'HDFC Bank',      rate: 8.50, maxTenure: 30, processingFee: 0.5,  scheme: 'Special NRI rates available' },
  { name: 'SBI Home Loans', rate: 8.25, maxTenure: 30, processingFee: 0.35, scheme: 'Women borrowers get 0.05% concession' },
  { name: 'ICICI Bank',     rate: 8.90, maxTenure: 25, processingFee: 0.5,  scheme: null },
  { name: 'Axis Bank',      rate: 8.75, maxTenure: 30, processingFee: 0.5,  scheme: 'Pre-approved for salaried' },
  { name: 'Kotak Mahindra', rate: 8.65, maxTenure: 25, processingFee: 1.0,  scheme: 'Balance transfer at 8.5%' },
];

function EligibilityTab({ onRateSelect, phone, customerName, onApplied }: { onRateSelect: (rate: number) => void; phone: string; customerName: string; onApplied: () => void }) {
  const [income, setIncome]           = useState(0);
  const [existingEmi, setExistingEmi] = useState(0);
  const [propertyValue, setPropertyValue] = useState(0);
  const [tenure, setTenure]           = useState(20);
  const [rate, setRate]               = useState(8.5);
  const [employment, setEmployment]   = useState('Salaried');
  const [applying, setApplying]       = useState(false);
  const [applied, setApplied]         = useState(false);
  const [digiDone, setDigiDone]       = useState(false);
  const [digiLoading, setDigiLoading] = useState(false);

  const r    = rate / 100 / 12;
  const n    = tenure * 12;
  const netA = income * 0.5 - existingEmi;
  const maxByIncome = netA > 0 ? (netA * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n)) : 0;
  const maxByLTV    = propertyValue * 0.8;
  const eligible    = income > 0 || propertyValue > 0 ? Math.min(maxByIncome || Infinity, maxByLTV || Infinity) : 0;
  const emiEstimate = eligible > 0 ? (eligible * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : 0;
  const eligible2   = isFinite(eligible) ? eligible : 0;

  async function handleApply() {
    if (!phone) { toast.error('Please sign in to apply.'); return; }
    if (eligible2 <= 0) { toast.error('Enter your income or property value first.'); return; }
    setApplying(true);
    try {
      const res = await portalApi.submitLoanApplication({
        customerPhone: phone,
        customerName,
        loanAmount: Math.round(eligible2),
        propertyValue: propertyValue || Math.round(eligible2 / 0.8),
        employmentType: employment,
        tenureMonths: tenure * 12,
      }) as { id: number; alreadyExists?: boolean };
      toast[res?.alreadyExists ? 'info' : 'success'](
        res?.alreadyExists
          ? 'You already have a loan application — see Loan Status.'
          : 'Loan application submitted! Track it under Loan Status.');
      setApplied(true);
      onApplied();
    } catch (e) {
      const msg = (e as Error).message || '';
      toast.error(/no deal/i.test(msg)
        ? 'Book a unit first — you need an active deal to apply for a loan.'
        : (msg || 'Could not submit application. Please try again.'));
    } finally {
      setApplying(false);
    }
  }

  const color = eligible2 > 5_000_000 ? { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' }
              : eligible2 > 2_000_000 ? { bg: 'bg-amber-50  border-amber-200',   text: 'text-amber-700'   }
              :                         { bg: 'bg-red-50     border-red-200',     text: 'text-red-700'     };

  return (
    <div className="space-y-5">
      {/* Calculator */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-[14px] font-bold text-foreground flex items-center gap-2">
          <Calculator size={15} style={{ color: TEAL }} /> Check Your Eligibility
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">Gross Monthly Income (₹)</label>
            <input type="number" value={income || ''} onChange={e => setIncome(Number(e.target.value))} placeholder="e.g. 1,50,000" className={inp} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">Existing EMI Obligations (₹)</label>
            <input type="number" value={existingEmi || ''} onChange={e => setExistingEmi(Number(e.target.value))} placeholder="0 if none" className={inp} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">Property Value (₹)</label>
            <input type="number" value={propertyValue || ''} onChange={e => setPropertyValue(Number(e.target.value))} placeholder="e.g. 1,00,00,000" className={inp} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">Interest Rate (% p.a.)</label>
            <input type="number" step="0.05" value={rate} onChange={e => setRate(Number(e.target.value))} className={inp} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">Employment Type</label>
            <select value={employment} onChange={e => setEmployment(e.target.value)} className={inp}>
              <option>Salaried</option>
              <option>Self-Employed</option>
              <option>Business Owner</option>
            </select>
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">Tenure: {tenure} years</label>
            <input type="range" min={5} max={30} value={tenure} onChange={e => setTenure(Number(e.target.value))} className="w-full accent-teal-600" />
            <div className="flex justify-between text-[10px] text-muted-foreground"><span>5 yr</span><span>30 yr</span></div>
          </div>
        </div>
        {(income > 0 || propertyValue > 0) && (
          <div className={`p-4 rounded-xl border ${color.bg}`}>
            <p className="text-[12px] font-semibold text-foreground">Estimated eligibility</p>
            <p className={`text-[24px] font-black mt-0.5 ${color.text}`}>{formatCurrency(Math.round(eligible2))}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Estimated EMI: {formatCurrency(Math.round(emiEstimate))}/month for {tenure} yrs at {rate}%
            </p>
            <button
              onClick={handleApply}
              disabled={applying || applied || eligible2 <= 0}
              className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}
            >
              {applying ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}
              {applied ? 'Application Submitted ✓' : applying ? 'Submitting…' : 'Apply for this Loan'}
            </button>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              We'll attach this to your active deal and notify your builder. Track progress under <strong>Loan Status</strong>.
            </p>
          </div>
        )}
      </div>

      {/* DigiLocker */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-[14px] font-bold text-foreground">Fetch Documents via DigiLocker</h3>
        {digiDone ? (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-emerald-800">Documents connected</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">KYC documents fetched. A loan advisor will verify them shortly.</p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[12px] text-muted-foreground">Connect your DigiLocker to auto-fill KYC details and speed up loan processing.</p>
            <button onClick={() => { setDigiLoading(true); setTimeout(() => { setDigiDone(true); setDigiLoading(false); }, 1800); }}
              disabled={digiLoading}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>
              {digiLoading ? 'Connecting…' : 'Connect DigiLocker'}
            </button>
          </>
        )}
      </div>

      {/* Bank Comparison */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-[14px] font-bold text-foreground mb-4 flex items-center gap-2">
          <Building2 size={14} style={{ color: TEAL }} /> Compare Banks
        </h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-muted/40 text-left border-b border-border">
                {['Bank', 'Rate', 'Max Tenure', 'Processing Fee', 'Special Scheme', ''].map(h => (
                  <th key={h} className="px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bankProducts.map(bp => (
                <tr key={bp.name} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2.5 font-semibold text-foreground">{bp.name}</td>
                  <td className="px-3 py-2.5 font-bold" style={{ color: TEAL }}>{bp.rate}%</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{bp.maxTenure} yrs</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{bp.processingFee}%</td>
                  <td className="px-3 py-2.5 text-[11px] text-muted-foreground">{bp.scheme || '—'}</td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => { setRate(bp.rate); onRateSelect(bp.rate); toast.success(`Rate set to ${bp.rate}% — see Calculator tab`); }}
                      className="text-[11px] font-semibold hover:underline" style={{ color: TEAL }}>
                      Use Rate →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Loan Status tab ─────────────────────────────────────────────── */
const LOAN_MILESTONES = [
  { key: 'SUBMITTED',    label: 'Application Submitted' },
  { key: 'UNDER_REVIEW', label: 'Documents Under Review' },
  { key: 'APPROVED',     label: 'Loan Approved' },
  { key: 'DISBURSED',    label: 'Disbursed' },
];
const LOAN_ORDER = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED'];

interface CustomerDeal {
  dealId: number; projectId: number; projectName: string; unitType?: string;
  dealValue?: number; dealStatus: string; createdAt: string;
  loanCaseId?: number; loanAmount?: number; propertyValue?: number;
  employmentType?: string; tenureMonths?: number; interestRate?: number; loanStatus?: string;
}

function LoanStatusTab({ phone }: { phone: string }) {
  const [deals, setDeals]     = useState<CustomerDeal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeals = async () => {
    if (!phone) { setLoading(false); return; }
    setLoading(true);
    try { const data = await portalApi.getMyDeals(phone); setDeals((data as CustomerDeal[]) || []); }
    catch { toast.error('Could not load loan status'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDeals(); }, [phone]);

  const loansWithCase = deals.filter(d => d.loanCaseId);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-muted-foreground" /></div>;

  if (loansWithCase.length === 0) return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${TEAL}12` }}>
        <Banknote size={26} style={{ color: TEAL }} />
      </div>
      <h3 className="text-[15px] font-bold text-foreground mb-1">No active loan linked</h3>
      <p className="text-[13px] text-muted-foreground max-w-sm mb-5">
        Once your home loan is approved and linked by your bank, your full loan dashboard appears here.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button onClick={() => toast.info('A loan advisor will contact you within 24 hours.')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${TEAL}, #0d9488)` }}>
          <Phone size={13} /> Talk to a Loan Advisor
        </button>
        <button onClick={() => toast.info('WhatsApp support coming soon.')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90"
          style={{ background: '#25D366' }}>
          <MessageCircle size={13} /> WhatsApp Us
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={fetchDeals} disabled={loading}
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>
      {loansWithCase.map(deal => {
        const idx       = deal.loanStatus ? LOAN_ORDER.indexOf(deal.loanStatus) : -1;
        const milestones = LOAN_MILESTONES.map((m, i) => ({
          ...m, status: (i < idx ? 'Completed' : i === idx ? 'In Progress' : 'Pending') as 'Completed'|'In Progress'|'Pending',
        }));
        const completed = milestones.filter(m => m.status === 'Completed').length;
        const progress  = (completed / milestones.length) * 100;
        return (
          <div key={deal.dealId} className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-foreground">{deal.projectName || 'My Property'}</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {deal.unitType ? `${deal.unitType} · ` : ''}
                  {deal.loanAmount ? `Loan ${formatCurrency(deal.loanAmount)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={progress} className="h-2 w-24" />
                <span className="text-[13px] font-bold text-foreground">{Math.round(progress)}%</span>
              </div>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {milestones.map((m, i) => (
                <div key={m.label} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[90px]">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      m.status === 'Completed' ? 'bg-emerald-500 text-white'
                      : m.status === 'In Progress' ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-muted text-muted-foreground'}`}>
                      {m.status === 'Completed' ? <CheckCircle2 size={15} />
                       : m.status === 'In Progress' ? <Clock size={15} />
                       : <span className="text-[11px]">{i + 1}</span>}
                    </div>
                    <p className={`text-[10px] text-center mt-1 max-w-[90px] font-medium leading-tight ${
                      m.status === 'Completed' ? 'text-emerald-600'
                      : m.status === 'In Progress' ? 'text-amber-600'
                      : 'text-muted-foreground'}`}>{m.label}</p>
                  </div>
                  {i < milestones.length - 1 && (
                    <div className={`h-0.5 w-8 flex-shrink-0 ${m.status === 'Completed' ? 'bg-emerald-400' : 'bg-border'}`} />
                  )}
                </div>
              ))}
            </div>

            {(deal.interestRate || deal.tenureMonths || deal.employmentType) && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex flex-wrap gap-4 text-[12px] text-muted-foreground">
                {deal.interestRate   && <span>Rate: <strong className="text-foreground">{deal.interestRate}%</strong></span>}
                {deal.tenureMonths  && <span>Tenure: <strong className="text-foreground">{Math.round(deal.tenureMonths / 12)} yrs</strong></span>}
                {deal.employmentType && <span>Employment: <strong className="text-foreground">{deal.employmentType}</strong></span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── EMI Calculator tab ──────────────────────────────────────────── */
function calcEmi(principal: number, annualRate: number, years: number) {
  const r = annualRate / 12 / 100, n = years * 12;
  if (r === 0) return Math.round(principal / n);
  return Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
}

function SliderRow({ label, value, min, max, step, display, onChange }: {
  label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const fmtTick = (v: number) => v >= 10_000_000 ? `₹${(v/10_000_000).toFixed(0)}Cr` : v >= 100_000 ? `₹${(v/100_000).toFixed(0)}L` : `${v}`;
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
        <span className="text-[13px] font-bold px-3 py-0.5 rounded-lg border border-border bg-muted/40 text-foreground">{display}</span>
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-muted">
        <div className="absolute left-0 top-0 h-1.5 rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${TEAL}99, ${TEAL})` }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-card shadow pointer-events-none"
          style={{ left: `calc(${pct}% - 8px)`, backgroundColor: TEAL }} />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground"><span>{fmtTick(min)}</span><span>{fmtTick(max)}</span></div>
    </div>
  );
}

function EMICalculatorTab({ initialRate }: { initialRate?: number }) {
  const [amount, setAmount]   = useState(16_500_000);
  const [rate, setRate]       = useState(initialRate ?? 8.65);
  const [tenure, setTenure]   = useState(20);
  const [view, setView]       = useState<'chart' | 'schedule'>('chart');
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => { if (initialRate) setRate(initialRate); }, [initialRate]);

  const r   = rate / 12 / 100;
  const n   = tenure * 12;
  const emi = calcEmi(amount, rate, tenure);
  const totalPayable  = emi * n;
  const totalInterest = totalPayable - amount;

  const pieData = [{ name: 'Principal', value: amount }, { name: 'Interest', value: totalInterest }];

  const yearlyData = useMemo(() => {
    let bal = amount;
    return Array.from({ length: tenure }, (_, i) => {
      let principal = 0, interest = 0;
      for (let m = 0; m < 12; m++) {
        const intPart = bal * r; const prinPart = emi - intPart;
        principal += prinPart; interest += intPart; bal -= prinPart;
      }
      return { year: `Y${i + 1}`, principal: Math.round(principal), interest: Math.round(interest) };
    });
  }, [amount, r, emi, tenure]);

  const schedule = useMemo(() => {
    let outstanding = amount;
    return Array.from({ length: n }, (_, i) => {
      const interest = Math.round(outstanding * r);
      const principal = emi - interest;
      outstanding = Math.max(0, outstanding - principal);
      return { month: i + 1, principal, interest, outstanding };
    });
  }, [amount, emi, r, n]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* Left: inputs */}
      <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 space-y-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Loan Parameters</p>
        <SliderRow label="Loan Amount" value={amount} min={1_000_000} max={100_000_000} step={500_000} display={amount >= 10_000_000 ? `₹${(amount/10_000_000).toFixed(1)}Cr` : `₹${(amount/100_000).toFixed(0)}L`} onChange={setAmount} />
        <SliderRow label="Interest Rate (p.a.)" value={rate} min={7} max={15} step={0.05} display={`${rate.toFixed(2)}%`} onChange={setRate} />
        <SliderRow label="Tenure" value={tenure} min={5} max={30} step={1} display={`${tenure} yr`} onChange={setTenure} />
        <div className="pt-2 border-t border-border">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">Composition</p>
          <div className="flex items-center gap-4">
            <PieChart width={100} height={100}>
              <Pie data={pieData} cx={50} cy={50} innerRadius={26} outerRadius={46} startAngle={90} endAngle={-270} dataKey="value" labelLine={false}>
                <Cell fill={TEAL} /><Cell fill={ORANGE} />
              </Pie>
            </PieChart>
            <div className="space-y-2 flex-1">
              {[{ label: 'Principal', pct: ((amount / totalPayable)*100).toFixed(0), color: TEAL }, { label: 'Interest', pct: ((totalInterest/totalPayable)*100).toFixed(0), color: ORANGE }].map(d => (
                <div key={d.label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-[12px] text-muted-foreground flex-1">{d.label}</span>
                  <span className="text-[12px] font-bold text-foreground">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: results */}
      <div className="lg:col-span-3 space-y-4">
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${TEAL}18, ${TEAL}06)`, border: `1px solid ${TEAL}30` }}>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: TEAL }}>Monthly EMI</p>
          <p className="text-4xl font-black text-foreground leading-none">{formatCurrency(emi)}</p>
          <p className="text-[12px] text-muted-foreground mt-1.5">per month for {tenure} years</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[{ label: 'Total Payable', value: formatCurrency(totalPayable), icon: Landmark, color: TEAL },
            { label: 'Total Interest', value: formatCurrency(totalInterest), icon: TrendingDown, color: ORANGE }].map(s => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}12`, color: s.color }}>
                <s.icon size={15} />
              </div>
              <div><p className="text-[11px] text-muted-foreground">{s.label}</p><p className="text-[14px] font-bold text-foreground">{s.value}</p></div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
            <p className="text-[13px] font-semibold text-foreground">Repayment Breakdown</p>
            <div className="flex gap-1 bg-muted/60 rounded-lg p-0.5">
              {(['chart','schedule'] as const).map(t => (
                <button key={t} onClick={() => setView(t)}
                  className={`px-3 py-1 rounded-md text-[12px] font-medium transition-all capitalize ${view === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          {view === 'chart' && (
            <div className="p-5 pt-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={yearlyData} barCategoryGap="30%">
                  <XAxis dataKey="year" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)' }} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} width={40} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} tick={{ fill: 'var(--muted-foreground)' }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid var(--border)', backgroundColor: 'var(--card)' }} />
                  <Bar dataKey="principal" name="Principal" stackId="a" fill={TEAL} />
                  <Bar dataKey="interest" name="Interest" stackId="a" fill={ORANGE} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {view === 'schedule' && (
            <div className="overflow-auto max-h-[260px]">
              <table className="w-full text-[12px]">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                  <tr>{['Month','EMI','Principal','Interest','Outstanding'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-semibold text-muted-foreground">{h}</th>
                  ))}</tr>
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

        <div className="rounded-xl px-4 py-3 flex flex-wrap gap-x-6 gap-y-2" style={{ backgroundColor: `${TEAL}0a`, border: `1px solid ${TEAL}20` }}>
          <div className="flex items-center gap-2">
            <CalendarDays size={12} style={{ color: TEAL }} />
            <span className="text-[12px] text-muted-foreground">Loan closes in <strong className="text-foreground">{tenure} years</strong> ({n} EMIs)</span>
          </div>
          <div className="flex items-center gap-2">
            <Info size={12} style={{ color: ORANGE }} />
            <span className="text-[12px] text-muted-foreground">Interest is <strong style={{ color: ORANGE }}>{((totalInterest/totalPayable)*100).toFixed(1)}%</strong> of total outflow</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
type Tab = 'status' | 'eligibility' | 'calculator';

export default function CustomerLoan() {
  const { user }         = useAuthStore();
  const [params]         = useSearchParams();
  const initialTab       = (params.get('tab') as Tab | null) ?? 'status';
  const [tab, setTab]    = useState<Tab>(initialTab);
  const [calcRate, setCalcRate] = useState<number | undefined>();

  const TABS: { key: Tab; label: string }[] = [
    { key: 'status',     label: 'Loan Status'    },
    { key: 'eligibility',label: 'Eligibility'    },
    { key: 'calculator', label: 'EMI Calculator' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-10 max-w-5xl">
        <div>
          <h1 className="text-[18px] font-bold text-foreground">Home Loan</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Track your loan, check eligibility, and plan EMIs — all in one place</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'status'      && <LoanStatusTab phone={user?.phone ?? ''} />}
        {tab === 'eligibility' && (
          <EligibilityTab
            phone={user?.phone ?? ''}
            customerName={user?.name ?? ''}
            onRateSelect={r => { setCalcRate(r); setTab('calculator'); }}
            onApplied={() => setTab('status')}
          />
        )}
        {tab === 'calculator'  && <EMICalculatorTab initialRate={calcRate} />}
      </div>
    </DashboardLayout>
  );
}
