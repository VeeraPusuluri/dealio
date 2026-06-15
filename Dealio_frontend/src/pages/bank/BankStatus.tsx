import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatCurrency } from '@/lib/format';
import { Loader2, FileText, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const STATUSES = ['Applied', 'Under Review', 'Sanctioned', 'Disbursed', 'Rejected'] as const;

const STATUS_PILL: Record<string, string> = {
  'Applied': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
  'Sanctioned': 'bg-blue-50 text-blue-700 border-blue-200',
  'Disbursed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Rejected': 'bg-rose-50 text-rose-700 border-rose-200',
};

const NOTE_DOT: Record<string, string> = {
  status_update: 'bg-purple-500',
  document: 'bg-amber-500',
  loan_initiated: 'bg-blue-500',
  note: 'bg-slate-400',
};

interface LoanNote {
  id: number; type: string; sender: string; senderRole: string; content: string; createdAt: string;
}
interface DealDocument {
  id: number; name: string; docType: string; fileUrl?: string | null; uploadedByRole: string; createdAt: string;
}
interface LoanCase {
  id: number; status: string; loanAmount: number; propertyValue: number;
  employmentType?: string | null; tenureMonths?: number | null;
  bank?: string | null; interestRate?: number | null; emi?: number | null;
  officerName?: string | null; submittedAt: string;
  customer?: { fullName?: string; phone?: string; email?: string };
  deal?: { id: number; project?: { name?: string; city?: string }; builder?: { companyName?: string } };
}
interface LoanCaseDetail extends LoanCase {
  notes?: LoanNote[];
  deal?: LoanCase['deal'] & { dealDocuments?: DealDocument[] };
}

function fmtDate(s?: string) {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_PILL[status] ?? 'bg-muted text-muted-foreground border-border'}`}>
      {status}
    </span>
  );
}

const BankStatus = () => {
  const authUser = useAuthStore((s) => s.user);
  const [cases, setCases] = useState<LoanCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<LoanCaseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadCases = useCallback(() => {
    setLoading(true);
    adminApi.getLoanCases()
      .then(d => {
        const list = (d as LoanCase[]) || [];
        setCases(list);
        setSelectedId(prev => prev ?? list[0]?.id ?? null);
      })
      .catch(() => toast.error('Could not load loan cases'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { loadCases(); }, [loadCases]);

  const loadDetail = useCallback((id: number) => {
    setDetailLoading(true);
    adminApi.getLoanCase(id)
      .then(d => setDetail(d as LoanCaseDetail))
      .catch(() => toast.error('Could not load loan details'))
      .finally(() => setDetailLoading(false));
  }, []);
  useEffect(() => { if (selectedId != null) loadDetail(selectedId); }, [selectedId, loadDetail]);

  const handleUpdateStatus = async () => {
    if (!newStatus || selectedId == null) return;
    if (newStatus === 'Rejected' && !note.trim()) {
      toast.error('A note is required when rejecting a loan');
      return;
    }
    setUpdating(true);
    try {
      await adminApi.updateLoanCaseStatus(selectedId, {
        status: newStatus,
        note: note.trim() || undefined,
        officerName: authUser?.name || undefined,
      });
      toast.success(`Status updated to ${newStatus}. Customer notified.`);
      setNewStatus('');
      setNote('');
      loadCases();
      loadDetail(selectedId);
    } catch (e) {
      toast.error((e as Error).message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const documents = detail?.deal?.dealDocuments ?? [];

  return (
    <DashboardLayout>
      <div className="flex gap-6 h-[calc(100vh-7rem)]">
        {/* Left panel — real loan cases */}
        <div className="w-80 flex-shrink-0 bg-card rounded-lg border border-border overflow-y-auto card-shadow">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-card-foreground">Active Loans</h3>
            <button onClick={loadCases} className="p-1.5 rounded hover:bg-muted" title="Refresh">
              <RefreshCw size={14} className="text-muted-foreground" />
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
          ) : cases.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No loan applications yet.</p>
          ) : cases.map(c => (
            <button key={c.id} onClick={() => setSelectedId(c.id)}
              className={`w-full text-left p-4 border-b border-border hover:bg-muted/30 transition-colors ${selectedId === c.id ? 'bg-muted/50' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-card-foreground">LC-{c.id}</span>
                <StatusPill status={c.status} />
              </div>
              <p className="text-sm text-card-foreground">{c.customer?.fullName || 'Customer'}</p>
              <p className="text-xs text-muted-foreground">{c.deal?.project?.name || '—'} • {formatCurrency(c.loanAmount)}</p>
            </button>
          ))}
        </div>

        {/* Right panel */}
        {detailLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
        ) : detail ? (
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Customer Info */}
            <div className="bg-card rounded-lg p-5 card-shadow border border-border">
              <h3 className="font-semibold text-card-foreground mb-4">Customer Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div><p className="text-muted-foreground">Name</p><p className="font-medium text-card-foreground">{detail.customer?.fullName || '—'}</p></div>
                <div><p className="text-muted-foreground">Phone</p><p className="font-medium text-card-foreground">{detail.customer?.phone || '—'}</p></div>
                <div><p className="text-muted-foreground">Project</p><p className="font-medium text-card-foreground">{detail.deal?.project?.name || '—'}{detail.deal?.project?.city ? ` · ${detail.deal.project.city}` : ''}</p></div>
                <div><p className="text-muted-foreground">Builder</p><p className="font-medium text-card-foreground">{detail.deal?.builder?.companyName || '—'}</p></div>
                <div><p className="text-muted-foreground">Loan Amount</p><p className="font-medium text-card-foreground">{formatCurrency(detail.loanAmount)}</p></div>
                <div><p className="text-muted-foreground">Property Value</p><p className="font-medium text-card-foreground">{formatCurrency(detail.propertyValue)}</p></div>
                <div><p className="text-muted-foreground">Tenure</p><p className="font-medium text-card-foreground">{detail.tenureMonths ? `${Math.round(detail.tenureMonths / 12)} years` : '—'}</p></div>
                <div><p className="text-muted-foreground">Bank</p><p className="font-medium text-card-foreground">{detail.bank || 'Not assigned'}</p></div>
                <div><p className="text-muted-foreground">Interest / EMI</p><p className="font-medium text-card-foreground">{detail.interestRate ? `${detail.interestRate}%` : '—'}{detail.emi ? ` · ${formatCurrency(detail.emi)}/mo` : ''}</p></div>
              </div>
              <div className="mt-4"><StatusPill status={detail.status} /></div>
            </div>

            {/* Status Update */}
            <div className="bg-card rounded-lg p-5 card-shadow border border-border">
              <h3 className="font-semibold text-card-foreground mb-4">Update Status</h3>
              <div className="flex flex-wrap gap-3">
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-muted text-sm text-foreground outline-none flex-1 min-w-[200px]">
                  <option value="">Select new status</option>
                  {STATUSES.filter(s => s !== detail.status).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={handleUpdateStatus} disabled={!newStatus || updating}
                  className="px-6 py-2 rounded-lg bg-[#3B82F6] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                  {updating && <Loader2 size={13} className="animate-spin" />}
                  Update Status
                </button>
              </div>
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Reason / Note (required for Rejected)"
                className="w-full mt-3 px-3 py-2 rounded-lg bg-muted text-sm outline-none text-foreground min-h-[60px]" />
            </div>

            {/* Documents received on the deal */}
            <div className="bg-card rounded-lg p-5 card-shadow border border-border">
              <h3 className="font-semibold text-card-foreground mb-4">Documents Received</h3>
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents on this deal yet. Use the Documents page to request them from the customer.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText size={15} className="text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-card-foreground truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.docType} · by {doc.uploadedByRole} · {fmtDate(doc.createdAt)}</p>
                        </div>
                      </div>
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                          className="text-xs px-3 py-1 rounded bg-blue-500/10 text-blue-500 font-medium hover:opacity-80 flex items-center gap-1 shrink-0">
                          <ExternalLink size={11} /> View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Timeline — real loan notes */}
            <div className="bg-card rounded-lg p-5 card-shadow border border-border">
              <h3 className="font-semibold text-card-foreground mb-4">Activity Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span className="text-muted-foreground w-24 shrink-0">{fmtDate(detail.submittedAt)}</span>
                  <span className="text-card-foreground">Application submitted</span>
                </div>
                {(detail.notes ?? []).map(n => (
                  <div key={n.id} className="flex items-start gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${NOTE_DOT[n.type] ?? 'bg-slate-400'}`} />
                    <span className="text-muted-foreground w-24 shrink-0">{fmtDate(n.createdAt)}</span>
                    <span className="text-card-foreground">{n.content} <span className="text-xs text-muted-foreground">— {n.sender}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            {loading ? '' : cases.length === 0 ? 'Loan applications will appear here once customers apply.' : 'Select a loan to view details'}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BankStatus;
