import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, Upload, Eye, Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  id: string; name: string; issuedBy: string; dateIssued: string;
  status: 'Verified' | 'Pending Signature' | 'Action Required' | 'Signed'; type: 'received';
}
interface RequiredDoc {
  id: string; name: string; requiredBy: string; deadline: string;
  status: 'Submitted' | 'Upload Required' | 'Under Review';
}

const initialReceivedDocs: Document[] = [
  { id: 'D001', name: 'Allotment Letter', issuedBy: 'My Home Group', dateIssued: '2024-12-28', status: 'Verified', type: 'received' },
  { id: 'D002', name: 'Sale Agreement', issuedBy: 'My Home Group', dateIssued: '2025-01-05', status: 'Pending Signature', type: 'received' },
  { id: 'D003', name: 'Loan Sanction Letter', issuedBy: 'HDFC Bank', dateIssued: '2025-01-02', status: 'Verified', type: 'received' },
  { id: 'D004', name: 'Disbursement Letter', issuedBy: 'HDFC Bank', dateIssued: '2025-01-10', status: 'Verified', type: 'received' },
  { id: 'D005', name: 'Payment Receipt', issuedBy: 'My Home Group', dateIssued: '2025-01-12', status: 'Verified', type: 'received' },
  { id: 'D006', name: 'NOC Certificate', issuedBy: 'Government', dateIssued: '2025-01-18', status: 'Action Required', type: 'received' },
];
const initialRequiredDocs: RequiredDoc[] = [
  { id: 'RD001', name: 'Aadhaar Card', requiredBy: 'Bank', deadline: '2025-01-20', status: 'Submitted' },
  { id: 'RD002', name: 'PAN Card', requiredBy: 'Bank', deadline: '2025-01-20', status: 'Submitted' },
  { id: 'RD003', name: 'Salary Slips (3 months)', requiredBy: 'Bank', deadline: '2025-01-22', status: 'Submitted' },
  { id: 'RD004', name: 'Bank Statements (6 months)', requiredBy: 'Bank', deadline: '2025-01-22', status: 'Submitted' },
  { id: 'RD005', name: 'Form 16', requiredBy: 'Bank', deadline: '2025-01-25', status: 'Submitted' },
  { id: 'RD006', name: 'Property Documents', requiredBy: 'Bank', deadline: '2025-01-25', status: 'Submitted' },
  { id: 'RD007', name: 'Passport Photos', requiredBy: 'Builder', deadline: '2025-01-28', status: 'Submitted' },
  { id: 'RD008', name: 'Signed Agreement', requiredBy: 'Builder', deadline: '2025-02-01', status: 'Upload Required' },
  { id: 'RD009', name: 'Stamp Duty Receipt', requiredBy: 'Builder', deadline: '2025-02-05', status: 'Under Review' },
  { id: 'RD010', name: 'Registration Fee Receipt', requiredBy: 'Builder', deadline: '2025-02-10', status: 'Upload Required' },
];
const docStatusColors: Record<string, string> = {
  Verified: '#16A34A', 'Pending Signature': '#F59E0B', 'Action Required': '#DC2626',
  Signed: '#16A34A', Submitted: '#16A34A', 'Upload Required': '#DC2626', 'Under Review': '#F59E0B',
};

const CustomerDocuments = () => {
  const [filter, setFilter] = useState('All');
  const [requiredDocs, setRequiredDocs] = useState(initialRequiredDocs);
  const [receivedDocs, setReceivedDocs] = useState(initialReceivedDocs);
  const [showSignModal, setShowSignModal] = useState<string | null>(null);
  const [signStep, setSignStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [otp, setOtp] = useState('');

  const submitted = requiredDocs.filter(d => d.status === 'Submitted').length;
  const total = requiredDocs.length;

  const handleUpload = (id: string) => {
    setRequiredDocs(prev => prev.map(d => d.id === id ? { ...d, status: 'Under Review' as const } : d));
    toast.success('Document uploaded successfully');
  };
  const handleSign = (docId: string) => { setShowSignModal(docId); setSignStep(0); setAgreed(false); setOtp(''); };
  const completeSign = () => {
    setReceivedDocs(prev => prev.map(d => d.id === showSignModal ? { ...d, status: 'Signed' as const } : d));
    setShowSignModal(null);
    toast.success('Document signed successfully! Builder has been notified.');
  };

  const filters = ['All', 'From Builder', 'From Bank', 'My Uploads', 'Action Required'];
  const filteredReceived = receivedDocs.filter(d => {
    if (filter === 'From Builder') return d.issuedBy.includes('Home') || d.issuedBy === 'Government';
    if (filter === 'From Bank') return d.issuedBy.includes('Bank');
    if (filter === 'Action Required') return d.status === 'Action Required' || d.status === 'Pending Signature';
    if (filter === 'My Uploads') return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8">
        <div className="pt-1">
          <h1 className="text-xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500">Manage your property and loan documents</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? 'text-white shadow-sm' : 'bg-white border border-gray-100 text-gray-500 hover:text-gray-700'}`}
              style={filter === f ? { background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' } : {}}>
              {f}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">Documents Received</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReceived.map(d => (
              <div key={d.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{d.name}</p>
                    <p className="text-xs text-gray-400">{d.issuedBy} · {formatDate(d.dateIssued)}</p>
                  </div>
                </div>
                <StatusBadge status={d.status === 'Signed' ? '✅ Signed' : d.status} color={docStatusColors[d.status]} />
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-100 text-gray-600 flex items-center justify-center gap-1 hover:bg-gray-50">
                    <Eye size={11} /> View
                  </button>
                  {d.status === 'Pending Signature' ? (
                    <button onClick={() => handleSign(d.id)} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center justify-center gap-1" style={{ backgroundColor: '#E87722' }}>
                      <Shield size={11} /> Sign Now
                    </button>
                  ) : (
                    <button className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center gap-1">
                      <Download size={11} /> Download
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Documents to Submit</h2>
            <span className="text-sm text-gray-400">{submitted} of {total} complete</span>
          </div>
          <Progress value={(submitted / total) * 100} className="h-2 mb-4" />
          <div className="space-y-2">
            {requiredDocs.map(d => (
              <div key={d.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <FileText size={15} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{d.name}</p>
                    <p className="text-xs text-gray-400">Required by {d.requiredBy} · Deadline: {formatDate(d.deadline)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={d.status} color={docStatusColors[d.status]} />
                  {d.status === 'Upload Required' && (
                    <button onClick={() => handleUpload(d.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white flex items-center gap-1 hover:bg-emerald-700">
                      <Upload size={11} /> Upload
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowSignModal(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">E-Sign Document</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              ⚠️ Demo mode — In production, this integrates with Digio or LeegAlity for Aadhaar OTP e-sign.
            </div>
            {signStep === 0 && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                  <p className="text-sm font-medium text-gray-900">{receivedDocs.find(d => d.id === showSignModal)?.name}</p>
                  <p className="text-xs text-gray-400 mt-1">Issued by {receivedDocs.find(d => d.id === showSignModal)?.issuedBy}</p>
                  <div className="mt-3 h-32 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 text-sm">Document Preview</div>
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1 accent-secondary" />
                  <span className="text-sm text-gray-700">I have read and agree to this document</span>
                </label>
                <button disabled={!agreed} onClick={() => setSignStep(1)} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#16A34A' }}>
                  Sign with Aadhaar OTP
                </button>
              </div>
            )}
            {signStep === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-700">Enter the OTP sent to your registered mobile number</p>
                <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter 6-digit OTP" maxLength={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-secondary/20" />
                <p className="text-xs text-gray-400 text-center">Demo: Enter any 6 digits</p>
                <button disabled={otp.length < 6} onClick={completeSign} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#16A34A' }}>
                  <CheckCircle size={14} className="inline mr-1" /> Verify & Sign
                </button>
              </div>
            )}
            <button onClick={() => setShowSignModal(null)} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerDocuments;