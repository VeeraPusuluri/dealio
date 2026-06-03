import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileText, Download, Upload, Eye, Shield, CheckCircle2, X, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

interface ReceivedDoc {
  id: string; name: string; issuedBy: string; dateIssued: string;
  status: 'Verified' | 'Pending Signature' | 'Action Required' | 'Signed';
}
interface RequiredDoc {
  id: string; name: string; requiredBy: string; deadline: string;
  status: 'Submitted' | 'Upload Required' | 'Under Review';
}

const statusPill: Record<string, string> = {
  Verified: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Pending Signature': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Action Required': 'bg-red-50 text-red-600 border border-red-200',
  Signed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Submitted: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Upload Required': 'bg-red-50 text-red-600 border border-red-200',
  'Under Review': 'bg-amber-50 text-amber-700 border border-amber-200',
};

const FILTERS = ['All', 'From Builder', 'From Bank', 'My Uploads', 'Action Required'];

export default function CustomerDocuments() {
  const [filter, setFilter] = useState('All');
  const [receivedDocs, setReceivedDocs] = useState<ReceivedDoc[]>([]);
  const [requiredDocs, setRequiredDocs] = useState<RequiredDoc[]>([]);
  const [showSignModal, setShowSignModal] = useState<string | null>(null);
  const [signStep, setSignStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [otp, setOtp] = useState('');

  const submitted = requiredDocs.filter(d => d.status === 'Submitted').length;

  const handleUpload = (id: string) => {
    setRequiredDocs(prev => prev.map(d => d.id === id ? { ...d, status: 'Under Review' as const } : d));
    toast.success('Document uploaded — it will be reviewed shortly.');
  };

  const completeSign = () => {
    setReceivedDocs(prev => prev.map(d => d.id === showSignModal ? { ...d, status: 'Signed' as const } : d));
    setShowSignModal(null);
    toast.success('Document signed successfully! Builder has been notified.');
  };

  const filteredReceived = receivedDocs.filter(d => {
    if (filter === 'From Builder') return !d.issuedBy.toLowerCase().includes('bank');
    if (filter === 'From Bank') return d.issuedBy.toLowerCase().includes('bank');
    if (filter === 'Action Required') return d.status === 'Action Required' || d.status === 'Pending Signature';
    if (filter === 'My Uploads') return false;
    return true;
  });

  const inp = 'w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all placeholder:text-muted-foreground';

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-10 max-w-5xl">

        {/* Header */}
        <div>
          <h1 className="text-[18px] font-bold text-foreground">Documents</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Manage your property and loan documents</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all ${filter === f ? 'text-white shadow-sm' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
              style={filter === f ? { background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' } : undefined}>
              {f}
            </button>
          ))}
        </div>

        {/* Documents Received */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold text-foreground">Documents Received</h2>
            <span className="text-[11px] text-muted-foreground">{filteredReceived.length} document{filteredReceived.length !== 1 ? 's' : ''}</span>
          </div>
          {filteredReceived.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <FolderOpen size={22} className="text-muted-foreground" />
              </div>
              <p className="text-[13px] font-semibold text-foreground mb-1">No documents received yet</p>
              <p className="text-[12px] text-muted-foreground max-w-xs">
                Documents shared by your builder, bank, or government authorities will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredReceived.map(d => (
                <div key={d.id} className="bg-muted/30 rounded-xl border border-border p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center shrink-0">
                      <FileText size={15} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{d.name}</p>
                      <p className="text-[11px] text-muted-foreground">{d.issuedBy} · {d.dateIssued}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full inline-block ${statusPill[d.status]}`}>{d.status}</span>
                  <div className="flex gap-2">
                    <button className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-card border border-border text-muted-foreground flex items-center justify-center gap-1 hover:text-foreground transition-colors">
                      <Eye size={10} /> View
                    </button>
                    {d.status === 'Pending Signature' ? (
                      <button onClick={() => { setShowSignModal(d.id); setSignStep(0); setAgreed(false); setOtp(''); }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white flex items-center justify-center gap-1"
                        style={{ backgroundColor: '#E87722' }}>
                        <Shield size={10} /> Sign
                      </button>
                    ) : (
                      <button className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center gap-1">
                        <Download size={10} /> Download
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents to Submit */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold text-foreground">Documents to Submit</h2>
            {requiredDocs.length > 0 && (
              <span className="text-[11px] text-muted-foreground">{submitted} of {requiredDocs.length} complete</span>
            )}
          </div>

          {requiredDocs.length > 0 && (
            <div className="mb-4">
              <div className="h-2 rounded-full overflow-hidden bg-muted">
                <div className="h-full rounded-full transition-all" style={{ width: `${(submitted / requiredDocs.length) * 100}%`, background: '#0A7E8C' }} />
              </div>
            </div>
          )}

          {requiredDocs.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <CheckCircle2 size={22} className="text-muted-foreground" />
              </div>
              <p className="text-[13px] font-semibold text-foreground mb-1">No documents required</p>
              <p className="text-[12px] text-muted-foreground max-w-xs">
                When your builder or bank requests documents, they'll appear here with upload options.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {requiredDocs.map(d => (
                <div key={d.id} className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-xl border border-border">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={14} className="text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{d.name}</p>
                      <p className="text-[11px] text-muted-foreground">Required by {d.requiredBy} · Deadline: {d.deadline}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${statusPill[d.status]}`}>{d.status}</span>
                    {d.status === 'Upload Required' && (
                      <button onClick={() => handleUpload(d.id)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white flex items-center gap-1 hover:opacity-90"
                        style={{ background: '#0A7E8C' }}>
                        <Upload size={10} /> Upload
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* E-Sign Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSignModal(null)} />
          <div className="relative bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-foreground">E-Sign Document</h3>
              <button onClick={() => setShowSignModal(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800">
              Demo mode — production integrates with Digio/LeegAlity for Aadhaar OTP e-sign.
            </div>
            {signStep === 0 && (
              <div className="space-y-4">
                <div className="bg-muted/40 rounded-xl border border-border p-4">
                  <p className="text-[13px] font-medium text-foreground">{receivedDocs.find(d => d.id === showSignModal)?.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{receivedDocs.find(d => d.id === showSignModal)?.issuedBy}</p>
                  <div className="mt-3 h-28 bg-card rounded-xl border border-border flex items-center justify-center text-muted-foreground text-[12px]">Document Preview</div>
                </div>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 accent-teal-600" />
                  <span className="text-[13px] text-foreground">I have read and agree to this document</span>
                </label>
                <button disabled={!agreed} onClick={() => setSignStep(1)}
                  className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
                  style={{ background: '#16A34A' }}>
                  Sign with Aadhaar OTP
                </button>
              </div>
            )}
            {signStep === 1 && (
              <div className="space-y-4">
                <p className="text-[13px] text-foreground">Enter the OTP sent to your registered mobile</p>
                <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit OTP" maxLength={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/40 text-foreground text-[14px] text-center tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-ring/20" />
                <p className="text-[11px] text-muted-foreground text-center">Demo: any 6 digits</p>
                <button disabled={otp.length < 6} onClick={completeSign}
                  className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  style={{ background: '#16A34A' }}>
                  <CheckCircle2 size={14} /> Verify &amp; Sign
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
