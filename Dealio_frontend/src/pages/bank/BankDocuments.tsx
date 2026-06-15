import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { Progress } from '@/components/ui/progress';
import { FileText, Eye, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DealDocument {
  id: number; name: string; docType: string; fileUrl?: string | null; uploadedByRole: string; createdAt: string;
}
interface LoanCase {
  id: number; status: string; loanAmount: number; submittedAt: string;
  bank?: string | null;
  customer?: { fullName?: string; phone?: string };
  deal?: { id: number; project?: { name?: string; city?: string }; builder?: { companyName?: string }; dealDocuments?: DealDocument[] };
}

function fmtDate(s?: string) {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ROLE_FILTERS = ['All', 'builder', 'customer', 'cp'] as const;
const ROLE_LABEL: Record<string, string> = { All: 'All', builder: 'From Builder', customer: 'From Customer', cp: 'From CP' };

const BankDocuments = () => {
  const authUser = useAuthStore((s) => s.user);
  const [cases, setCases] = useState<LoanCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<LoanCase | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState<string>('All');

  const [requestText, setRequestText] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    adminApi.getLoanCases()
      .then(d => {
        const list = (d as LoanCase[]) || [];
        setCases(list);
        setSelectedId(prev => prev ?? list[0]?.id ?? null);
      })
      .catch(() => toast.error('Could not load loan cases'))
      .finally(() => setLoading(false));
  }, []);

  const loadDetail = useCallback((id: number) => {
    setDetailLoading(true);
    adminApi.getLoanCase(id)
      .then(d => setDetail(d as LoanCase))
      .catch(() => toast.error('Could not load documents'))
      .finally(() => setDetailLoading(false));
  }, []);
  useEffect(() => { if (selectedId != null) loadDetail(selectedId); }, [selectedId, loadDetail]);

  const documents = detail?.deal?.dealDocuments ?? [];
  const withFile = documents.filter(d => d.fileUrl).length;
  const filtered = filter === 'All' ? documents : documents.filter(d => d.uploadedByRole === filter);

  const handleRequestDocs = async () => {
    if (selectedId == null) return;
    if (!requestText.trim()) {
      toast.error('Describe which documents you need');
      return;
    }
    setRequesting(true);
    try {
      await adminApi.addLoanCaseNote(selectedId, {
        content: `Bank requested documents: ${requestText.trim()}`,
        type: 'document',
        sender: authUser?.name || detail?.bank || 'Bank',
        notifyCustomer: true,
      });
      toast.success('Document request sent to customer');
      setRequestText('');
    } catch (e) {
      toast.error((e as Error).message || 'Could not send request');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-48"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      </DashboardLayout>
    );
  }

  if (cases.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <FileText size={28} className="text-muted-foreground mb-3" />
          <p className="font-medium text-card-foreground">No loan applications yet</p>
          <p className="text-sm text-muted-foreground mt-1">Documents will appear here once customers apply for loans.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Loan selector — real cases */}
        <div className="flex flex-wrap gap-3 items-center">
          <label className="text-sm font-medium text-card-foreground">Loan Application:</label>
          <select value={selectedId ?? ''} onChange={e => setSelectedId(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-card border border-border text-sm text-card-foreground outline-none">
            {cases.map(c => (
              <option key={c.id} value={c.id}>LC-{c.id} — {c.customer?.fullName || 'Customer'} ({c.status})</option>
            ))}
          </select>
        </div>

        {detailLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
        ) : detail && (
          <>
            {/* Progress */}
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-card-foreground">{detail.customer?.fullName || 'Customer'} — {detail.deal?.project?.name || '—'}</h3>
                  <p className="text-xs text-muted-foreground">
                    {detail.deal?.builder?.companyName || '—'} · Bank: {detail.bank || 'Not assigned'} · Applied: {fmtDate(detail.submittedAt)}
                  </p>
                </div>
                <span className="text-sm font-medium text-card-foreground">{withFile}/{documents.length || 0} files received</span>
              </div>
              <Progress value={documents.length ? (withFile / documents.length) * 100 : 0} className="h-2" />
            </div>

            {/* Filters by uploader */}
            <div className="flex gap-2 flex-wrap">
              {ROLE_FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'text-white' : 'bg-muted text-muted-foreground hover:text-card-foreground'}`}
                  style={filter === f ? { backgroundColor: '#2E5D8E' } : {}}>
                  {ROLE_LABEL[f]}
                </button>
              ))}
            </div>

            {/* Real deal documents */}
            <div className="bg-card rounded-lg border border-border overflow-x-auto">
              {filtered.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">
                  {documents.length === 0 ? 'No documents on this deal yet — request them from the customer below.' : 'No documents match this filter.'}
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-muted-foreground border-b border-border">
                    <th className="px-4 py-3 font-medium">Document</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Uploaded By</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(d => (
                      <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 text-card-foreground"><span className="flex items-center gap-2"><FileText size={14} className="text-muted-foreground" /> {d.name}</span></td>
                        <td className="px-4 py-3 text-muted-foreground">{d.docType}</td>
                        <td className="px-4 py-3 text-muted-foreground capitalize">{d.uploadedByRole}</td>
                        <td className="px-4 py-3 text-muted-foreground">{fmtDate(d.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          {d.fileUrl ? (
                            <a href={d.fileUrl} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded bg-blue-500/10 text-blue-500 font-medium hover:opacity-80">
                              <Eye size={12} /> View
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">No file</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Request missing documents — real notification to customer */}
            <div className="bg-card rounded-lg p-5 border border-border space-y-3">
              <h3 className="font-semibold text-card-foreground">Request Missing Documents</h3>
              <p className="text-xs text-muted-foreground">The customer gets a notification and the request is logged on the loan timeline.</p>
              <div className="flex flex-wrap gap-3">
                <input value={requestText} onChange={e => setRequestText(e.target.value)}
                  placeholder="e.g. Salary slips (3 months), Form 16, Bank statement"
                  className="flex-1 min-w-[240px] px-3 py-2 rounded-lg bg-muted text-sm text-foreground outline-none" />
                <button onClick={handleRequestDocs} disabled={requesting || !requestText.trim()}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: '#2E5D8E' }}>
                  {requesting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send Request
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BankDocuments;
