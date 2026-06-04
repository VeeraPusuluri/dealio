import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { formatCurrency } from '@/lib/format';
import { portalApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';
import {
  CheckCircle2, Info, TrendingUp, Home, GraduationCap,
  Sparkles, Banknote, Calculator, ChevronRight, Loader2,
} from 'lucide-react';

const PURPOSES = ['Home Renovation', 'Education', 'Medical', 'Personal', 'Business', 'Repay Other Loan', 'Investment'];

const SMART_USES = [
  { icon: TrendingUp, text: 'Invest ₹10L in Solar Rooftop → earn ₹16,000/month → covers top-up EMI', color: '#16A34A' },
  { icon: GraduationCap, text: "Use ₹5L for education → invest the rest, returns offset the EMI", color: '#6B3FA0' },
  { icon: Banknote, text: 'Invest in EV Charging → 18% returns > 9.25% cost → net gain 8.75% p.a.', color: '#E87722' },
  { icon: Home, text: 'Prepay existing loan → reduce tenure by 3 years → save ₹12L in interest', color: '#0A7E8C' },
];

const inp = 'w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all placeholder:text-muted-foreground';

export default function CustomerTopup() {
  const { user }                              = useAuthStore();
  const [outstanding, setOutstanding]         = useState('');
  const [propertyValue, setPropertyValue]     = useState('');
  const [yearsPaid, setYearsPaid]             = useState('');
  const [monthlyIncome, setMonthlyIncome]     = useState('');
  const [checked, setChecked]                 = useState(false);
  const [topupAmount, setTopupAmount]         = useState(2000000);
  const [purpose, setPurpose]                 = useState('Home Renovation');
  const [showForm, setShowForm]               = useState(false);
  const [submitting, setSubmitting]           = useState(false);
  const [submitted, setSubmitted]             = useState(false);

  const outstandingNum    = Number(outstanding) || 0;
  const propertyValueNum  = Number(propertyValue) || 0;
  const yearsPaidNum      = Number(yearsPaid) || 0;

  const maxTopup = useMemo(() => Math.max(0, Math.round(propertyValueNum * 0.8 - outstandingNum)), [propertyValueNum, outstandingNum]);
  const isEligible = maxTopup > 0 && yearsPaidNum >= 1;

  const topupRate = 9.25;
  const remainingTenure = 19;
  const topupEmi = useMemo(() => {
    const r = topupRate / 1200;
    const n = remainingTenure * 12;
    if (topupAmount <= 0) return 0;
    return Math.round(topupAmount * r / (1 - Math.pow(1 + r, -n)));
  }, [topupAmount]);

  const handleCheck = () => {
    if (!outstanding || !propertyValue || !yearsPaid || !monthlyIncome) {
      toast.error('Please fill in all fields to check eligibility');
      return;
    }
    setChecked(true);
    if (isEligible) {
      setTopupAmount(Math.min(maxTopup, 2000000));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10 max-w-3xl">

        {/* Header */}
        <div>
          <h1 className="text-[18px] font-bold text-foreground">Loan Top-up</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Need more funds? Top up your existing home loan at attractive rates.</p>
        </div>

        {/* Info banner */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 flex gap-3">
          <Info size={17} className="text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-blue-900 mb-1">What is a Top-up Loan?</p>
            <p className="text-[12px] text-blue-800 leading-relaxed">
              A home loan top-up lets you borrow additional funds at attractive rates (8.5–9.5%). Use for: renovation, interior,
              education, medical, or personal needs. No new property documentation needed.
            </p>
          </div>
        </div>

        {/* Eligibility checker */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Calculator size={15} style={{ color: '#0A7E8C' }} />
            <h3 className="text-[14px] font-bold text-foreground">Check Your Eligibility</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">Current Loan Outstanding (₹)</label>
              <input type="number" value={outstanding} onChange={e => { setOutstanding(e.target.value); setChecked(false); }}
                className={inp} placeholder="e.g. 1,58,00,000" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">Current Property Value (₹)</label>
              <input type="number" value={propertyValue} onChange={e => { setPropertyValue(e.target.value); setChecked(false); }}
                className={inp} placeholder="e.g. 2,52,00,000" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">Years of EMI Paid on Time</label>
              <input type="number" value={yearsPaid} onChange={e => { setYearsPaid(e.target.value); setChecked(false); }}
                className={inp} placeholder="e.g. 2" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">Monthly Income (₹)</label>
              <input type="number" value={monthlyIncome} onChange={e => { setMonthlyIncome(e.target.value); setChecked(false); }}
                className={inp} placeholder="e.g. 1,80,000" />
            </div>
          </div>
          <button onClick={handleCheck}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}>
            Check My Eligibility <ChevronRight size={14} />
          </button>
        </div>

        {/* Eligibility result */}
        {checked && (
          <div className={`rounded-2xl p-5 border ${isEligible ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            {isEligible ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <p className="text-[15px] font-bold text-emerald-800">You're eligible!</p>
                </div>
                <p className="text-[13px] text-emerald-700 mb-1">
                  Maximum top-up: <strong>{formatCurrency(maxTopup)}</strong>
                </p>
                <p className="text-[11px] text-emerald-600 mb-4">
                  ({formatCurrency(propertyValueNum)} × 80%) − {formatCurrency(outstandingNum)} = {formatCurrency(maxTopup)}
                </p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Interest Rate', value: `${topupRate}% p.a.` },
                    { label: 'Max Tenure', value: `${remainingTenure} years` },
                    { label: 'EMI on ₹20L', value: formatCurrency(topupEmi) + '/mo' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/70 rounded-xl p-3 border border-emerald-200">
                      <p className="text-[10px] text-emerald-600 font-medium mb-0.5">{label}</p>
                      <p className="text-[13px] font-bold text-emerald-900">{value}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowForm(true)}
                  className="px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #16A34A, #14B040)' }}>
                  Apply for Top-up
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <Info size={17} className="text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-red-700 mb-1">Not eligible yet</p>
                  <p className="text-[12px] text-red-600">
                    You need at least 1 year of timely EMI payments and positive equity (property value must be &gt; 125% of outstanding loan).
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Application form */}
        {showForm && isEligible && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
            <div className="flex items-center gap-2">
              <Sparkles size={15} style={{ color: '#0A7E8C' }} />
              <h3 className="text-[14px] font-bold text-foreground">Top-up Application</h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-muted-foreground">Amount Required</span>
                <span className="font-bold text-foreground">{formatCurrency(topupAmount)}</span>
              </div>
              <input type="range" min={100000} max={maxTopup} step={100000} value={topupAmount}
                onChange={e => setTopupAmount(Number(e.target.value))} className="w-full accent-teal-600" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>₹1L</span><span>{formatCurrency(maxTopup)} (max)</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">Purpose</label>
              <select value={purpose} onChange={e => setPurpose(e.target.value)} className={inp}>
                {PURPOSES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div className="rounded-xl bg-muted/40 border border-border p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground">Monthly EMI</p>
                <p className="text-[18px] font-bold text-foreground">{formatCurrency(topupEmi)}/month</p>
              </div>
              <div className="text-right text-[11px] text-muted-foreground">
                <p>{formatCurrency(topupAmount)} at {topupRate}%</p>
                <p>{remainingTenure} year tenure</p>
              </div>
            </div>

            <div>
              <p className="text-[12px] font-semibold text-foreground mb-2">Documents needed:</p>
              <div className="space-y-1.5">
                {['Latest salary slips (3 months)', 'Bank statements (6 months)', 'Property documents (already with bank)'].map(d => (
                  <div key={d} className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span className="text-[12px] text-muted-foreground">{d}</span>
                  </div>
                ))}
              </div>
            </div>

            {submitted ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[13px] font-bold text-emerald-800">Application submitted!</p>
                  <p className="text-[12px] text-emerald-700 mt-0.5">Your bank will contact you within 48 hours to process your top-up request.</p>
                </div>
              </div>
            ) : (
              <button
                disabled={submitting}
                onClick={async () => {
                  if (!user?.name || !user?.phone) { toast.error('Please complete your profile first'); return; }
                  setSubmitting(true);
                  try {
                    await portalApi.submitLoanApplication({
                      builderId: 1, // placeholder — top-up isn't project-specific
                      customerName: user.name,
                      customerPhone: user.phone,
                      customerEmail: user.email,
                      loanAmount: topupAmount,
                      propertyValue: Number(propertyValue),
                      employmentType: 'Salaried',
                      tenureMonths: remainingTenure * 12,
                    });
                    setSubmitted(true);
                    setShowForm(false);
                    toast.success('Top-up application submitted! Your bank will contact you within 48 hours.');
                  } catch (e: unknown) {
                    toast.error(e instanceof Error ? e.message : 'Submission failed — please try again');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #16A34A, #14B040)' }}>
                {submitting ? <><Loader2 size={13} className="animate-spin" /> Submitting…</> : 'Submit Application'}
              </button>
            )}
          </div>
        )}

        {/* Smart suggestions */}
        <div>
          <h3 className="text-[14px] font-bold text-foreground mb-3">Smart Ways to Use Your Top-up</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SMART_USES.map(({ icon: Icon, text, color }, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 flex items-start gap-3"
                style={{ borderLeftWidth: 3, borderLeftColor: color }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${color}15` }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <p className="text-[12px] text-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[14px] font-bold text-foreground">Have questions about top-up loans?</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Our loan experts can guide you through the process.</p>
          </div>
          <button onClick={() => toast.info('A loan advisor will call you within 24 hours.')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white shrink-0 hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}>
            Talk to an Advisor <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
