import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminApi } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import {
  Loader2, CheckCircle2, Clock, XCircle, Banknote, RefreshCw,
  ArrowRight, X, User, Landmark,
} from 'lucide-react';
import { toast } from 'sonner';

// Forward milestones a banker moves a loan through. Mirrors the customer-side tracker
// (Application Received → Under Review → Sanctioned → Disbursed); 'Rejected' is terminal.
const STAGES = ['Applied', 'Under Review', 'Sanctioned', 'Disbursed'] as const;
const STAGE_LABEL: Record<string, string> = {
  'Applied': 'Application Received', 'Under Review': 'Under Review',
  'Sanctioned': 'Sanctioned', 'Disbursed': 'Disbursed', 'Rejected': 'Rejected',
};
const NEXT: Record<string, string | null> = {
  'Applied': 'Under Review', 'Under Review': 'Sanctioned',
  'Sanctioned': 'Disbursed', 'Disbursed': null, 'Rejected': null,
};
const STATUS_PILL: Record<string, string> = {
  'Applied': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
  'Sanctioned': 'bg-blue-50 text-blue-700 border-blue-200',
  'Disbursed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Rejected': 'bg-rose-50 text-rose-700 border-rose-200',
};

interface LoanCase {
  id: number; status: string; loanAmount: number; propertyValue: number;
  employmentType?: string | null; tenureMonths?: number | null;
  bank?: string | null; interestRate?: number | null; emi?: number | null;
  officerName?: string | null; submittedAt: string;
  customer?: { fullName?: string; phone?: string; email?: string };
  deal?: { id: number; project?: { name?: string; city?: string }; builder?: { companyName?: string } };
}

function fmtDate(s?: string) {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BankLoanCases() {
  const [cases, setCases]       = useState<LoanCase[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<string>('all');
  const [selected, setSelected] = useState<LoanCase | null>(null);
  const [updating, setUpdating] = useState(false);
  const [bank, setBank] = useState('');
  const [rate, setRate] = useState('');
  const [emi, setEmi]   = useState('');

  const load = useCallback(() => {
    setLoading(true);
    adminApi.getLoanCases()
      .then(d => setCases((d as LoanCase[]) || []))
      .catch(() => toast.error('Could not load loan cases'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? cases : cases.filter(c => c.status === filter);
  const next = selected ? NEXT[selected.status] : null;

  async function advance(c: LoanCase, to: string) {
    setUpdating(true);
    try {
      const extra = to === 'Sanctioned'
        ? { bank: bank || undefined, interestRate: rate ? Number(rate) : undefined, emi: emi ? Number(emi) : undefined }
        : {};
      await adminApi.updateLoanCaseStatus(c.id, { status: to, ...extra });
      toast.success(to === 'Rejected' ? 'Loan marked as rejected' : `Loan moved to ${STAGE_LABEL[to] ?? to}`);
      setBank(''); setRate(''); setEmi('');
      setSelected(prev => prev ? { ...prev, status: to } : prev);
      load();
    } catch (e) { toast.error((e as Error).message || 'Update failed'); }
    finally { setUpdating(false); }
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8">
        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-5 sm:px-6 py-5">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/25"
              style={{ background: 'linear-gradient(135deg,#2563EB,#3b82f6)' }}>
              <Landmark size={22} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-foreground tracking-tight leading-tight">Loan Cases</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Review applications and move each loan through to disbursement</p>
            </div>
            <button onClick={load} className="ml-auto flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Filter pills with counts */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', ...STAGES, 'Rejected'] as const).map(s => {
            const active = filter === s;
            const n = s === 'all' ? cases.length : cases.filter(c => c.status === s).length;
            return (
              <button key={s} onClick={() => setFilter(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${active ? 'bg-card text-foreground border-border shadow-sm' : 'bg-muted/40 text-muted-foreground border-transparent hover:text-foreground'}`}>
                {s === 'all' ? 'All' : STAGE_LABEL[s] ?? s}
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${active ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'}`}>{n}</span>
              </button>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-14 text-center">
            <Banknote size={28} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-[14px] font-bold text-foreground">No loan cases{filter !== 'all' ? ` in "${STAGE_LABEL[filter] ?? filter}"` : ''}</p>
            <p className="text-[13px] text-muted-foreground mt-1">Applications submitted by customers appear here.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(c => {
              const idx = STAGES.indexOf(c.status as typeof STAGES[number]);
              const pct = c.status === 'Rejected' ? 100 : ((idx + 1) / STAGES.length) * 100;
              return (
                <button key={c.id} onClick={() => setSelected(c)}
                  className="text-left bg-card rounded-2xl border border-border p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                  style={{ borderLeft: `3px solid ${c.status === 'Rejected' ? '#e11d48' : c.status === 'Disbursed' ? '#059669' : '#2563EB'}` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[14px] font-bold text-foreground truncate">{c.customer?.fullName ?? 'Customer'}</h3>
                      <p className="text-[12px] text-muted-foreground truncate mt-0.5">
                        {c.deal?.project?.name ?? 'Project'}{c.deal?.builder?.companyName ? ` · ${c.deal.builder.companyName}` : ''}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${STATUS_PILL[c.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
                      {STAGE_LABEL[c.status] ?? c.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3 text-[12px]">
                    <div><p className="text-[10px] text-muted-foreground">Loan</p><p className="font-bold text-foreground">{formatCurrency(c.loanAmount)}</p></div>
                    <div><p className="text-[10px] text-muted-foreground">Property</p><p className="font-semibold text-foreground">{formatCurrency(c.propertyValue)}</p></div>
                    <div><p className="text-[10px] text-muted-foreground">Employment</p><p className="font-medium text-foreground">{c.employmentType ?? '—'}</p></div>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.status === 'Rejected' ? '#e11d48' : 'linear-gradient(90deg,#2563EB,#3b82f6)' }} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20" style={{ background: 'linear-gradient(135deg,#2563EB,#3b82f6)' }}>
                  <User size={16} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold text-foreground truncate">{selected.customer?.fullName ?? 'Customer'}</h3>
                  <p className="text-[11px] text-muted-foreground truncate">{selected.deal?.project?.name ?? 'Project'}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Key figures */}
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  ['Loan amount', formatCurrency(selected.loanAmount)],
                  ['Property value', formatCurrency(selected.propertyValue)],
                  ['Employment', selected.employmentType ?? '—'],
                  ['Tenure', selected.tenureMonths ? `${Math.round(selected.tenureMonths / 12)} yrs` : '—'],
                  ['Phone', selected.customer?.phone ?? '—'],
                  ['Submitted', fmtDate(selected.submittedAt)],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-muted/40 border border-border px-3 py-2.5">
                    <p className="text-[10px] text-muted-foreground">{k}</p>
                    <p className="text-[13px] font-semibold text-foreground truncate">{v}</p>
                  </div>
                ))}
              </div>

              {/* Milestone stepper */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3">Milestone</p>
                <div className="space-y-2.5">
                  {STAGES.map((s, i) => {
                    const cur = STAGES.indexOf(selected.status as typeof STAGES[number]);
                    const done = (i < cur) || selected.status === 'Disbursed';
                    const active = i === cur && selected.status !== 'Rejected';
                    return (
                      <div key={s} className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {done ? <CheckCircle2 size={14} /> : active ? <Clock size={14} /> : <span className="text-[11px]">{i + 1}</span>}
                        </div>
                        <span className={`text-[13px] ${active ? 'font-bold text-foreground' : done ? 'text-foreground' : 'text-muted-foreground'}`}>{STAGE_LABEL[s]}</span>
                      </div>
                    );
                  })}
                  {selected.status === 'Rejected' && (
                    <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center"><XCircle size={14} /></div><span className="text-[13px] font-bold text-rose-600">Rejected</span></div>
                  )}
                </div>
              </div>

              {/* Sanction inputs (only when the next move is Sanctioned) */}
              {next === 'Sanctioned' && (
                <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                  <p className="text-[11px] font-semibold text-foreground">Sanction details (optional)</p>
                  <input value={bank} onChange={e => setBank(e.target.value)} placeholder="Bank name (e.g. HDFC)" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[12px] text-foreground" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={rate} onChange={e => setRate(e.target.value)} placeholder="Rate %" type="number" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[12px] text-foreground" />
                    <input value={emi} onChange={e => setEmi(e.target.value)} placeholder="EMI ₹" type="number" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[12px] text-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-border p-4 flex gap-2">
              {next ? (
                <button onClick={() => advance(selected, next)} disabled={updating}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#2563EB,#3b82f6)' }}>
                  {updating ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                  Move to {STAGE_LABEL[next]}
                </button>
              ) : (
                <div className="flex-1 text-center text-[12px] text-muted-foreground py-2.5">{selected.status === 'Disbursed' ? 'Loan fully disbursed ✓' : 'No further action'}</div>
              )}
              {selected.status !== 'Disbursed' && selected.status !== 'Rejected' && (
                <button onClick={() => advance(selected, 'Rejected')} disabled={updating}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50 disabled:opacity-50">
                  Reject
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
