import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatusBadge from '@/components/shared/StatusBadge';
import { Progress } from '@/components/ui/progress';
import { initialLoans } from '@/data/loans';
import { formatDate } from '@/lib/format';
import { FileText, Eye, CheckCircle, XCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

const fullChecklist = ['Aadhaar Card', 'PAN Card', 'Salary Slips (3 months)', 'Bank Statement (6 months)', 'Form 16', 'Property Agreement', 'Sale Deed', 'NOC from Builder'];

type DocStatus = 'Approved' | 'Pending Review' | 'Rejected' | 'Not Uploaded';

interface DocRow { name: string; status: DocStatus; uploadedBy: string; uploadDate: string; }

const buildDocsForLoan = (loan: typeof initialLoans[0]): DocRow[] => {
  return fullChecklist.map(name => {
    const found = loan.documents.find(d => d.name.toLowerCase().includes(name.split(' ')[0].toLowerCase()));
    if (!found) return { name, status: 'Not Uploaded' as DocStatus, uploadedBy: '-', uploadDate: '-' };
    if (found.uploaded) {
      if (loan.status === 'Disbursed' || loan.status === 'Sanctioned') return { name, status: 'Approved', uploadedBy: 'Customer', uploadDate: loan.appliedDate };
      return { name, status: 'Pending Review', uploadedBy: 'Customer', uploadDate: loan.appliedDate };
    }
    return { name, status: 'Not Uploaded' as DocStatus, uploadedBy: '-', uploadDate: '-' };
  });
};

const statusColors: Record<DocStatus, string> = { Approved: '#16A34A', 'Pending Review': '#F59E0B', Rejected: '#DC2626', 'Not Uploaded': '#94A3B8' };

const BankDocuments = () => {
  const [filter, setFilter] = useState('All');
  const [selectedLoan, setSelectedLoan] = useState(initialLoans[0].id);
  const [docs, setDocs] = useState<Record<string, DocRow[]>>(() => {
    const map: Record<string, DocRow[]> = {};
    initialLoans.forEach(l => { map[l.id] = buildDocsForLoan(l); });
    return map;
  });

  const currentDocs = docs[selectedLoan] || [];
  const loan = initialLoans.find(l => l.id === selectedLoan)!;
  const approved = currentDocs.filter(d => d.status === 'Approved').length;

  const filtered = filter === 'All' ? currentDocs : currentDocs.filter(d => d.status === filter as DocStatus);

  const handleApprove = (name: string) => {
    setDocs(prev => ({ ...prev, [selectedLoan]: prev[selectedLoan].map(d => d.name === name ? { ...d, status: 'Approved' as DocStatus } : d) }));
    toast.success(`${name} approved`);
  };
  const handleReject = (name: string) => {
    setDocs(prev => ({ ...prev, [selectedLoan]: prev[selectedLoan].map(d => d.name === name ? { ...d, status: 'Rejected' as DocStatus } : d) }));
    toast.error(`${name} rejected`);
  };

  const filters = ['All', 'Pending Review', 'Approved', 'Rejected'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Loan selector */}
        <div className="flex flex-wrap gap-3 items-center">
          <label className="text-sm font-medium text-card-foreground">Loan Application:</label>
          <select value={selectedLoan} onChange={e => setSelectedLoan(e.target.value)} className="px-3 py-2 rounded-lg bg-card border border-border text-sm text-card-foreground outline-none">
            {initialLoans.map(l => <option key={l.id} value={l.id}>{l.id} — {l.customerName} ({l.status})</option>)}
          </select>
        </div>

        {/* Progress */}
        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold text-card-foreground">{loan.customerName} — {loan.projectName}</h3>
              <p className="text-xs text-muted-foreground">{loan.unitType} · Bank: {loan.bank} · Applied: {formatDate(loan.appliedDate)}</p>
            </div>
            <span className="text-sm font-medium text-card-foreground">{approved}/{fullChecklist.length} verified</span>
          </div>
          <Progress value={(approved / fullChecklist.length) * 100} className="h-2" />
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'text-white' : 'bg-muted text-muted-foreground hover:text-card-foreground'}`}
              style={filter === f ? { backgroundColor: '#2E5D8E' } : {}}>
              {f}
            </button>
          ))}
        </div>

        {/* Document checklist */}
        <div className="bg-card rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border">
              <th className="px-4 py-3 font-medium">Document</th>
              <th className="px-4 py-3 font-medium">Uploaded By</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.name} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 text-card-foreground flex items-center gap-2"><FileText size={14} className="text-muted-foreground" /> {d.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.uploadedBy}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.uploadDate !== '-' ? formatDate(d.uploadDate) : '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} color={statusColors[d.status]} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {d.status !== 'Not Uploaded' && (
                        <button className="p-1.5 rounded hover:bg-muted" title="View"><Eye size={14} className="text-muted-foreground" /></button>
                      )}
                      {d.status === 'Pending Review' && (
                        <>
                          <button onClick={() => handleApprove(d.name)} className="p-1.5 rounded hover:bg-green-50" title="Approve"><CheckCircle size={14} className="text-green-600" /></button>
                          <button onClick={() => handleReject(d.name)} className="p-1.5 rounded hover:bg-red-50" title="Reject"><XCircle size={14} className="text-red-600" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={() => toast.success('Missing document request sent to customer')} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center gap-2" style={{ backgroundColor: '#2E5D8E' }}>
          <Send size={16} /> Request Missing Documents
        </button>
      </div>
    </DashboardLayout>
  );
};

export default BankDocuments;
