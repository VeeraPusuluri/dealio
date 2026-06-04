import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { builderApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import DatePickerField from '@/components/shared/DatePickerField';
import {
  Building2, User, CreditCard, FileText, MessageSquare, ChevronRight, X,
  Upload, Plus, Clock, CheckCircle2, AlertCircle, Send, ArrowLeft, Loader2, RefreshCw,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type LoanStatus = 'Applied' | 'Documents Submitted' | 'Under Review' | 'Sanctioned' | 'Disbursed' | 'Rejected';

interface LoanNote {
  id: number;
  type: string;
  sender: string;
  senderRole: string;
  content: string;
  createdAt: string;
}

interface LoanThread {
  id: number;
  dealId: number;
  projectId: number;
  projectName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  employmentType: string | null;
  loanAmount: number;
  propertyValue: number;
  tenureMonths: number | null;
  bank: string | null;
  interestRate: number | null;
  emi: number | null;
  officerName: string | null;
  officerPhone: string | null;
  cpName: string | null;
  status: LoanStatus;
  submittedAt: string;
  notes: LoanNote[];
}

interface ApiProject { id: number; name: string; }

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_STEPS: LoanStatus[] = ['Applied', 'Documents Submitted', 'Under Review', 'Sanctioned', 'Disbursed'];

const STATUS_COLORS: Record<string, string> = {
  'Applied':             '#3B82F6',
  'Documents Submitted': '#6366F1',
  'Under Review':        '#F59E0B',
  'Sanctioned':          '#0A7E8C',
  'Disbursed':           '#16A34A',
  'Rejected':            '#DC2626',
};

const eventTypeIcon = (type: string) => {
  switch (type) {
    case 'loan_initiated':   return '🏦';
    case 'document':         return '📄';
    case 'status_update':    return '✅';
    case 'note':             return '💬';
    default:                 return '📌';
  }
};

function getDocumentsForType(empType: string | null) {
  const kyc = [
    { name: 'Aadhaar Card', required: true, category: 'KYC' },
    { name: 'PAN Card', required: true, category: 'KYC' },
    { name: 'Passport-size Photographs', required: true, category: 'KYC' },
  ];
  const property = [
    { name: 'Allotment Letter', required: true, category: 'Property' },
    { name: 'Builder-Buyer Agreement', required: true, category: 'Property' },
    { name: 'NOC from Builder', required: true, category: 'Property' },
    { name: 'RERA Certificate', required: true, category: 'Property' },
    { name: 'Approved Floor Plan', required: true, category: 'Property' },
  ];
  if (empType === 'Self-Employed' || empType === 'Business Owner') {
    return [
      ...kyc,
      { name: 'ITR with computation (3 years)', required: true, category: 'Income' },
      { name: 'Balance Sheet & P&L (3 years)', required: true, category: 'Income' },
      { name: 'Bank Statement (6 months)', required: true, category: 'Income' },
      { name: 'GST Certificate', required: true, category: 'Income' },
      ...property,
    ];
  }
  return [
    ...kyc,
    { name: 'Salary Slips (3 months)', required: true, category: 'Income' },
    { name: 'Bank Statement (6 months)', required: true, category: 'Income' },
    { name: 'Form 16 (2 years)', required: true, category: 'Income' },
    { name: 'ITR (2 years)', required: true, category: 'Income' },
    ...property,
  ];
}

// ── Component ──────────────────────────────────────────────────────────────────

const LoanPortal = () => {
  const { user } = useAuthStore();
  const [builderId, setBuilderId] = useState<string | null>(null);

  const [threads, setThreads]         = useState<LoanThread[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedId, setSelectedId]   = useState<number | null>(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [createStep, setCreateStep]   = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm]   = useState('');

  // Thread detail state
  const [noteText, setNoteText]       = useState('');
  const [noteType, setNoteType]       = useState('note');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Projects for create form
  const [apiProjects, setApiProjects] = useState<ApiProject[]>([]);

  // Create form state
  const [form, setForm] = useState({
    projectId: '', customerName: '', customerPhone: '', customerEmail: '',
    employmentType: 'Salaried' as string,
    loanAmount: 0, propertyValue: 0, tenureMonths: 20 * 12,
    bank: 'HDFC', interestRate: 8.65,
    officerName: '', officerPhone: '',
  });

  // Resolve builderId on mount
  useEffect(() => {
    (async () => {
      let bid = builderApi.getCachedBuilderId();
      if (!bid && user?.id) {
        try {
          const email = user.email || `uid${user.id}@dealio.builder`;
          const res = await builderApi.ensureBuilder(user.name || '', email, user.phone, user.id) as { builderId: number };
          bid = String(res.builderId);
          builderApi.setCachedBuilderId(bid);
        } catch { /* ignore */ }
      }
      setBuilderId(bid);
    })();
  }, [user]);

  const loadLoans = useCallback(async () => {
    if (!builderId) return;
    setLoading(true);
    try {
      const data = await builderApi.getBuilderLoans(builderId);
      setThreads((data as LoanThread[]) || []);
    } catch { toast.error('Failed to load loan applications'); }
    finally { setLoading(false); }
  }, [builderId]);

  useEffect(() => { if (builderId) loadLoans(); }, [builderId, loadLoans]);

  useEffect(() => {
    if (!builderId || !showCreate) return;
    builderApi.getProjects(builderId)
      .then(d => setApiProjects((d as ApiProject[]) || []))
      .catch(() => {});
  }, [builderId, showCreate]);

  const activeThread = threads.find(t => t.id === selectedId) ?? null;

  const filtered = threads.filter(t => {
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    if (searchTerm && !t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) && !t.projectName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const estimatedEmi = form.loanAmount > 0
    ? Math.round(form.loanAmount * (form.interestRate / 1200) / (1 - Math.pow(1 + form.interestRate / 1200, -form.tenureMonths)))
    : 0;

  const handleSubmit = async () => {
    if (!builderId || !form.projectId || !form.customerPhone || !form.loanAmount) {
      toast.error('Project, customer phone and loan amount are required');
      return;
    }
    try {
      await builderApi.createBuilderLoan(builderId, {
        customerPhone: form.customerPhone,
        customerName: form.customerName,
        customerEmail: form.customerEmail || undefined,
        projectId: Number(form.projectId),
        employmentType: form.employmentType,
        loanAmount: form.loanAmount,
        propertyValue: form.propertyValue || form.loanAmount,
        tenureMonths: form.tenureMonths,
        bank: form.bank,
        interestRate: form.interestRate,
        emi: estimatedEmi,
        officerName: form.officerName || undefined,
        officerPhone: form.officerPhone || undefined,
      });
      toast.success('Loan application created!');
      setShowCreate(false);
      setCreateStep(1);
      setForm({ projectId: '', customerName: '', customerPhone: '', customerEmail: '', employmentType: 'Salaried', loanAmount: 0, propertyValue: 0, tenureMonths: 240, bank: 'HDFC', interestRate: 8.65, officerName: '', officerPhone: '' });
      loadLoans();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create loan application');
    }
  };

  const handleAddNote = async () => {
    if (!activeThread || !noteText.trim() || !builderId) return;
    setSubmittingNote(true);
    try {
      const note = await builderApi.addLoanNote(builderId, activeThread.id, noteType, noteText, user?.name ?? 'Builder', user?.role ?? 'builder') as LoanNote;
      setThreads(prev => prev.map(t => t.id === activeThread.id ? { ...t, notes: [...t.notes, note] } : t));
      setNoteText('');
      toast.success('Update added');
    } catch { toast.error('Failed to add note'); }
    finally { setSubmittingNote(false); }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!activeThread || !builderId) return;
    setUpdatingStatus(true);
    try {
      await builderApi.updateLoanStatus(builderId, activeThread.id, newStatus, undefined, user?.name ?? 'Builder', user?.role ?? 'builder');
      setThreads(prev => prev.map(t => {
        if (t.id !== activeThread.id) return t;
        const note: LoanNote = { id: Date.now(), type: 'status_update', sender: user?.name ?? 'Builder', senderRole: user?.role ?? 'builder', content: `Status updated: ${t.status} → ${newStatus}`, createdAt: new Date().toISOString() };
        return { ...t, status: newStatus as LoanStatus, notes: [...t.notes, note] };
      }));
      toast.success(`Status updated to ${newStatus}`);
    } catch { toast.error('Failed to update status'); }
    finally { setUpdatingStatus(false); }
  };

  // ── Create form ──────────────────────────────────────────────────────────────

  if (showCreate) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <button onClick={() => { setShowCreate(false); setCreateStep(1); }} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
            <ArrowLeft size={16} /> Back to Loans
          </button>
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-bold text-card-foreground mb-1">New Loan Application</h2>
            <p className="text-sm text-muted-foreground mb-6">Step {createStep} of 3</p>
            <div className="flex gap-1 mb-8">
              {[1,2,3].map(s => (
                <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= createStep ? 'bg-secondary' : 'bg-muted'}`} />
              ))}
            </div>

            {createStep === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-card-foreground">Property & Customer</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-foreground mb-1 block">Project <span className="text-destructive">*</span></label>
                    <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm">
                      <option value="">Select Project</option>
                      {apiProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Customer Name</label>
                    <input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" placeholder="Full name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Customer Phone <span className="text-destructive">*</span></label>
                    <input value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" placeholder="10-digit mobile" maxLength={10} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Customer Email</label>
                    <input type="email" value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Employment Type</label>
                    <div className="flex flex-wrap gap-2">
                      {['Salaried', 'Self-Employed', 'Business Owner', 'Retired', 'NRI'].map(t => (
                        <button key={t} type="button" onClick={() => setForm({ ...form, employmentType: t })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${form.employmentType === t ? 'border-secondary bg-secondary/10 text-secondary' : 'border-input text-muted-foreground'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {createStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-card-foreground">Loan Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Loan Amount (₹) <span className="text-destructive">*</span></label>
                    <input type="number" value={form.loanAmount || ''} onChange={e => setForm({ ...form, loanAmount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Property Value (₹)</label>
                    <input type="number" value={form.propertyValue || ''} onChange={e => setForm({ ...form, propertyValue: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Bank</label>
                    <select value={form.bank} onChange={e => setForm({ ...form, bank: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm">
                      {['HDFC','SBI','ICICI','Axis','Kotak','PNB','BoB','Other'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Interest Rate (%)</label>
                    <input type="number" step="0.05" value={form.interestRate} onChange={e => setForm({ ...form, interestRate: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-foreground mb-1 block">Tenure: {Math.round(form.tenureMonths / 12)} years</label>
                    <input type="range" min={60} max={360} step={12} value={form.tenureMonths} onChange={e => setForm({ ...form, tenureMonths: Number(e.target.value) })} className="w-full accent-secondary" />
                    <div className="flex justify-between text-xs text-muted-foreground"><span>5 yrs</span><span>30 yrs</span></div>
                  </div>
                  {estimatedEmi > 0 && (
                    <div className="col-span-2 bg-muted/50 rounded-lg p-4">
                      <p className="text-sm font-medium text-foreground">Estimated EMI</p>
                      <p className="text-2xl font-bold text-secondary mt-1">{formatCurrency(estimatedEmi)}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {createStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-card-foreground">Bank Officer (Optional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Officer Name</label>
                    <input value={form.officerName} onChange={e => setForm({ ...form, officerName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Officer Phone</label>
                    <input value={form.officerPhone} onChange={e => setForm({ ...form, officerPhone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-foreground mb-3">Document Checklist ({form.employmentType})</p>
                  {getDocumentsForType(form.employmentType).map((doc, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <FileText size={13} className="text-muted-foreground" />
                        <span className="text-sm text-foreground">{doc.name}</span>
                        {doc.required && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">Required</span>}
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-3">Documents can be uploaded after the application is created.</p>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              {createStep > 1
                ? <button onClick={() => setCreateStep(createStep - 1)} className="px-4 py-2 rounded-lg text-sm font-medium border border-input text-foreground">Previous</button>
                : <div />
              }
              {createStep < 3
                ? <button onClick={() => setCreateStep(createStep + 1)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-secondary text-secondary-foreground">Next</button>
                : <button onClick={handleSubmit} className="px-6 py-2 rounded-lg text-sm font-semibold bg-secondary text-secondary-foreground">Submit Application</button>
              }
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Thread detail ────────────────────────────────────────────────────────────

  if (activeThread) {
    const currentStepIdx = STATUS_STEPS.indexOf(activeThread.status);
    const docs = getDocumentsForType(activeThread.employmentType);

    return (
      <DashboardLayout>
        <div>
          <button onClick={() => setSelectedId(null)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
            <ArrowLeft size={16} /> Back to Loans
          </button>
          <div className="flex gap-6">
            {/* Left — Timeline */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="bg-card rounded-lg border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-card-foreground">{activeThread.customerName}</h2>
                    <p className="text-sm text-muted-foreground">{activeThread.projectName}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: STATUS_COLORS[activeThread.status] ?? '#6B7280' }}>
                    {activeThread.status}
                  </span>
                </div>
                {/* Stepper */}
                <div className="flex items-center gap-1 mb-1">
                  {STATUS_STEPS.map((step, i) => {
                    const done = i <= currentStepIdx;
                    return (
                      <div key={step} className="flex items-center flex-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${done ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {done ? <CheckCircle2 size={13} /> : i + 1}
                        </div>
                        {i < STATUS_STEPS.length - 1 && <div className={`h-0.5 flex-1 ${i < currentStepIdx ? 'bg-secondary' : 'bg-muted'}`} />}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1 text-[9px] text-muted-foreground mt-1">
                  {STATUS_STEPS.map(s => <span key={s} className="flex-1 text-center leading-tight">{s}</span>)}
                </div>
              </div>

              {/* Notes / Timeline */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="font-semibold text-card-foreground mb-4">Thread Timeline</h3>
                {activeThread.notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No timeline events yet.</p>
                ) : (
                  <div className="space-y-4">
                    {activeThread.notes.map(n => (
                      <div key={n.id} className="flex gap-3">
                        <div className="text-lg mt-0.5">{eventTypeIcon(n.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-card-foreground">{n.sender}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">{n.senderRole}</span>
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{n.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add note / status update */}
                <div className="mt-6 pt-4 border-t border-border space-y-2">
                  <div className="flex gap-2">
                    <select value={noteType} onChange={e => setNoteType(e.target.value)} className="px-2 py-1.5 rounded border border-input bg-card text-xs">
                      <option value="note">Note</option>
                      <option value="document">Document</option>
                    </select>
                    <select
                      onChange={e => { if (e.target.value) { handleStatusUpdate(e.target.value); e.target.value = ''; } }}
                      disabled={updatingStatus}
                      className="px-2 py-1.5 rounded border border-input bg-card text-xs">
                      <option value="">Update Status…</option>
                      {STATUS_STEPS.filter(s => s !== activeThread.status).map(s => <option key={s} value={s}>{s}</option>)}
                      {activeThread.status !== 'Rejected' && <option value="Rejected">Rejected</option>}
                    </select>
                    {updatingStatus && <Loader2 size={14} className="animate-spin self-center text-muted-foreground" />}
                  </div>
                  <div className="flex gap-2">
                    <input value={noteText} onChange={e => setNoteText(e.target.value)}
                      placeholder="Type your update…"
                      className="flex-1 px-3 py-2 rounded-lg border border-input bg-card text-sm"
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddNote()} />
                    <button onClick={handleAddNote} disabled={submittingNote || !noteText.trim()} className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground disabled:opacity-50">
                      {submittingNote ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Summary panels */}
            <div className="w-72 flex-shrink-0 space-y-4">
              <div className="bg-card rounded-lg border border-border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Customer</h4>
                <div className="space-y-2 text-sm">
                  <Row label="Name" value={activeThread.customerName} />
                  <Row label="Phone" value={activeThread.customerPhone} />
                  {activeThread.customerEmail && <Row label="Email" value={activeThread.customerEmail} />}
                  {activeThread.employmentType && <Row label="Employment" value={activeThread.employmentType} />}
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Loan</h4>
                <div className="space-y-2 text-sm">
                  <Row label="Amount" value={formatCurrency(activeThread.loanAmount)} />
                  {activeThread.bank && <Row label="Bank" value={activeThread.bank} />}
                  {activeThread.tenureMonths && <Row label="Tenure" value={`${Math.round(activeThread.tenureMonths / 12)} years`} />}
                  {activeThread.interestRate && <Row label="Rate" value={`${activeThread.interestRate}%`} />}
                  {activeThread.emi && <Row label="EMI" value={formatCurrency(activeThread.emi)} highlight />}
                  {activeThread.officerName && <Row label="Officer" value={activeThread.officerName} />}
                </div>
              </div>

              {activeThread.cpName && (
                <div className="bg-card rounded-lg border border-border p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">CP</h4>
                  <Row label="Name" value={activeThread.cpName} />
                </div>
              )}

              <div className="bg-card rounded-lg border border-border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Documents</h4>
                <div className="space-y-1.5">
                  {docs.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertCircle size={11} className="text-amber-400 shrink-0" />
                      {doc.name}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Document tracking coming soon.</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-bold text-foreground">Loan Applications</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search customer or project…"
              className="px-3 py-2 rounded-lg border border-input bg-card text-sm w-52" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-input bg-card text-sm">
              <option value="All">All Status</option>
              {STATUS_STEPS.map(s => <option key={s} value={s}>{s}</option>)}
              <option value="Rejected">Rejected</option>
            </select>
            <button onClick={loadLoans} disabled={loading} className="p-2 rounded-lg border border-input text-muted-foreground hover:bg-muted transition-colors">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowCreate(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-secondary text-secondary-foreground flex items-center gap-1.5">
              <Plus size={15} /> New Application
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center border border-dashed border-border rounded-2xl">
            <CreditCard size={28} className="text-muted-foreground mb-3" />
            <p className="text-[14px] font-semibold text-foreground">No loan applications yet</p>
            <p className="text-[12px] text-muted-foreground mt-1">Create a new application to get started.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(t => (
              <div key={t.id} onClick={() => setSelectedId(t.id)}
                className="bg-card rounded-lg border border-border p-4 cursor-pointer hover:border-secondary/40 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-sm flex-shrink-0">
                    {t.customerName[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-card-foreground">{t.customerName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ml-auto"
                        style={{ backgroundColor: STATUS_COLORS[t.status] ?? '#6B7280' }}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{t.projectName}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                      <span className="font-medium text-card-foreground">{formatCurrency(t.loanAmount)}</span>
                      {t.bank && <><span>·</span><span>{t.bank}</span></>}
                      <span>·</span>
                      <span>{new Date(t.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {t.cpName && <><span>·</span><span>via {t.cpName}</span></>}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground mt-3 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${highlight ? 'text-secondary font-bold' : 'text-card-foreground'}`}>{value}</span>
    </div>
  );
}

export default LoanPortal;
