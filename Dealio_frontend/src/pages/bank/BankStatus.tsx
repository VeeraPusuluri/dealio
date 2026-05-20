import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatusBadge from '@/components/shared/StatusBadge';
import { useLoanStore } from '@/stores/useLoanStore';
import { Loan, LoanStatus, loanStatusColors } from '@/data/loans';
import { formatCurrency, formatDate } from '@/lib/format';
import { CheckCircle, Circle } from 'lucide-react';
import { toast } from 'sonner';

const statusFlow: LoanStatus[] = ['Applied', 'Documents Pending', 'Processing', 'Sanctioned', 'Disbursed'];
const docChecklist = ['Identity Proof', 'Income Proof', 'Property Documents', 'NOC from Builder', 'Valuation Report'];

const BankStatus = () => {
  const { loans, updateLoanStatus } = useLoanStore();
  const [selectedId, setSelectedId] = useState<string>(loans[0]?.id || '');
  const [newStatus, setNewStatus] = useState<LoanStatus | ''>('');
  const [note, setNote] = useState('');
  const [docState, setDocState] = useState<Record<string, Record<string, boolean>>>({});
  const [activityLog, setActivityLog] = useState<Record<string, { date: string; action: string; officer: string }[]>>({});

  const selected = loans.find(l => l.id === selectedId);

  const handleUpdateStatus = () => {
    if (!newStatus || !selected) return;
    if (!note.trim() && newStatus === 'Documents Pending') { /* note optional */ }
    updateLoanStatus(selected.id, newStatus);
    setActivityLog(prev => ({
      ...prev,
      [selected.id]: [...(prev[selected.id] || []), { date: new Date().toISOString().split('T')[0], action: `Status updated to ${newStatus}${note ? ` — ${note}` : ''}`, officer: 'Ramesh Babu' }],
    }));
    setNewStatus('');
    setNote('');
    toast.success(`Status updated to ${newStatus}. Customer notified.`);
  };

  const toggleDoc = (loanId: string, doc: string) => {
    setDocState(prev => ({
      ...prev,
      [loanId]: { ...(prev[loanId] || {}), [doc]: !(prev[loanId]?.[doc]) },
    }));
  };

  return (
    <DashboardLayout>
      <div className="flex gap-6 h-[calc(100vh-7rem)]">
        {/* Left panel */}
        <div className="w-80 flex-shrink-0 bg-card rounded-lg border border-border overflow-y-auto card-shadow">
          <div className="p-4 border-b border-border"><h3 className="font-semibold text-card-foreground">Active Loans</h3></div>
          {loans.map(l => (
            <button key={l.id} onClick={() => setSelectedId(l.id)} className={`w-full text-left p-4 border-b border-border hover:bg-muted/30 transition-colors ${selectedId === l.id ? 'bg-muted/50' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-card-foreground">{l.id}</span>
                <StatusBadge status={l.status} color={loanStatusColors[l.status]} size="sm" />
              </div>
              <p className="text-sm text-card-foreground">{l.customerName}</p>
              <p className="text-xs text-muted-foreground">{l.projectName} • {formatCurrency(l.loanAmount)}</p>
            </button>
          ))}
        </div>

        {/* Right panel */}
        {selected ? (
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Customer Info */}
            <div className="bg-card rounded-lg p-5 card-shadow border border-border">
              <h3 className="font-semibold text-card-foreground mb-4">Customer Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div><p className="text-muted-foreground">Name</p><p className="font-medium text-card-foreground">{selected.customerName}</p></div>
                <div><p className="text-muted-foreground">Phone</p><p className="font-medium text-card-foreground">{selected.phone}</p></div>
                <div><p className="text-muted-foreground">Project</p><p className="font-medium text-card-foreground">{selected.projectName}</p></div>
                <div><p className="text-muted-foreground">Unit</p><p className="font-medium text-card-foreground">{selected.unitType}</p></div>
                <div><p className="text-muted-foreground">Loan Amount</p><p className="font-medium text-card-foreground">{formatCurrency(selected.loanAmount)}</p></div>
                <div><p className="text-muted-foreground">Bank</p><p className="font-medium text-card-foreground">{selected.bank}</p></div>
              </div>
              <div className="mt-4"><StatusBadge status={selected.status} color={loanStatusColors[selected.status]} size="md" /></div>
            </div>

            {/* Status Update */}
            <div className="bg-card rounded-lg p-5 card-shadow border border-border">
              <h3 className="font-semibold text-card-foreground mb-4">Update Status</h3>
              <div className="flex flex-wrap gap-3">
                <select value={newStatus} onChange={e => setNewStatus(e.target.value as LoanStatus)} className="px-3 py-2 rounded-lg bg-muted text-sm text-foreground outline-none flex-1 min-w-[200px]">
                  <option value="">Select new status</option>
                  {statusFlow.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={handleUpdateStatus} disabled={!newStatus} className="px-6 py-2 rounded-lg bg-[#3B82F6] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  Update Status
                </button>
              </div>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Reason / Note (required for Rejected)" className="w-full mt-3 px-3 py-2 rounded-lg bg-muted text-sm outline-none text-foreground min-h-[60px]" />
            </div>

            {/* Document Checklist */}
            <div className="bg-card rounded-lg p-5 card-shadow border border-border">
              <h3 className="font-semibold text-card-foreground mb-4">Document Checklist</h3>
              <div className="space-y-2">
                {docChecklist.map(doc => {
                  const checked = docState[selected.id]?.[doc] || false;
                  return (
                    <div key={doc} className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleDoc(selected.id, doc)}>
                          {checked ? <CheckCircle size={18} className="text-green-500" /> : <Circle size={18} className="text-muted-foreground" />}
                        </button>
                        <span className="text-sm text-card-foreground">{doc}</span>
                      </div>
                      {!checked && (
                        <button onClick={() => toast.success(`Document request sent to customer`)} className="text-xs px-3 py-1 rounded bg-blue-500/10 text-blue-500 font-medium hover:opacity-80">
                          Request from Customer
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-card rounded-lg p-5 card-shadow border border-border">
              <h3 className="font-semibold text-card-foreground mb-4">Activity Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground w-24">{formatDate(selected.appliedDate)}</span>
                  <span className="text-card-foreground">Application submitted</span>
                </div>
                {selected.sanctionedDate && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-teal-500" />
                    <span className="text-muted-foreground w-24">{formatDate(selected.sanctionedDate)}</span>
                    <span className="text-card-foreground">Loan sanctioned</span>
                  </div>
                )}
                {selected.disbursedDate && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-muted-foreground w-24">{formatDate(selected.disbursedDate)}</span>
                    <span className="text-card-foreground">Loan disbursed</span>
                  </div>
                )}
                {(activityLog[selected.id] || []).map((a, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-muted-foreground w-24">{formatDate(a.date)}</span>
                    <span className="text-card-foreground">{a.action}</span>
                    <span className="text-xs text-muted-foreground">— {a.officer}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a loan to view details</div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BankStatus;
