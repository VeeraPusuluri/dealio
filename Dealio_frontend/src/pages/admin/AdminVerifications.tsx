import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Loader2, CheckCircle2, XCircle, Eye, FileText } from 'lucide-react';

type DocType = 'aadhaar' | 'pan' | 'rera';

interface CP {
  id: number;
  city: string | null;
  reraNumber: string | null;
  aadhaarUrl: string | null; aadhaarVerified: boolean;
  panUrl: string | null;     panVerified: boolean;
  reraUrl: string | null;    reraVerified: boolean;
  user: { id: number; fullName: string | null; phone: string; email: string | null };
}

interface PendingDoc {
  cp: CP;
  type: DocType;
  url: string;
}

const DOC_LABELS: Record<DocType, string> = { aadhaar: 'Aadhaar', pan: 'PAN', rera: 'RERA' };

// A focused queue of CP documents awaiting verification. Full CP management
// (tiers, history, revoke) lives on the Channel Partners page; this is the
// review-and-clear surface. Both share the same /admin/cps + verify-doc API.
const AdminVerifications = () => {
  const navigate = useNavigate();
  const [docs, setDocs]       = useState<PendingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cps = await adminApi.getCPs({ docStatus: 'pending' }) as CP[];
      const flat: PendingDoc[] = [];
      (Array.isArray(cps) ? cps : []).forEach(cp => {
        if (cp.aadhaarUrl && !cp.aadhaarVerified) flat.push({ cp, type: 'aadhaar', url: cp.aadhaarUrl });
        if (cp.panUrl && !cp.panVerified)         flat.push({ cp, type: 'pan',     url: cp.panUrl });
        if (cp.reraUrl && !cp.reraVerified)       flat.push({ cp, type: 'rera',    url: cp.reraUrl });
      });
      setDocs(flat);
    } catch { toast.error('Failed to load pending verifications'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (cpId: number, type: DocType, approved: boolean) => {
    let note: string | undefined;
    if (!approved) {
      note = window.prompt('Rejection reason (shown to the CP):') ?? undefined;
      if (!note || !note.trim()) { toast.error('A rejection reason is required'); return; }
    }
    setActing(`${cpId}-${type}`);
    try {
      await adminApi.verifyDocument(cpId, type, approved, note);
      toast.success(`${DOC_LABELS[type]} ${approved ? 'approved' : 'rejected'}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActing(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="la-banner px-5 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0" title="Back to Overview">
            <ArrowLeft size={15} className="text-slate-500" />
          </button>
          <ShieldCheck size={16} className="text-emerald-500" />
          <div className="flex-1">
            <h2 className="text-[15px] font-bold text-slate-800">Document Verification Queue</h2>
            <p className="text-xs text-slate-400 mt-0.5">Approve or reject channel-partner KYC documents awaiting review</p>
          </div>
          {docs.length > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11px] font-bold">{docs.length} pending</span>
          )}
        </div>

        {loading ? (
          <div className="la-card flex justify-center py-12"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
        ) : docs.length === 0 ? (
          <div className="la-card py-12 text-center">
            <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-[13px] font-semibold text-slate-600">All caught up</p>
            <p className="text-[11px] text-slate-400 mt-0.5">No documents are awaiting verification.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map(({ cp, type, url }) => {
              const key = `${cp.id}-${type}`;
              return (
                <div key={key} className="la-card p-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-100 text-amber-600">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800">
                      {cp.user.fullName ?? cp.user.phone}
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase">{DOC_LABELS[type]}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">{cp.user.phone}{cp.city ? ` · ${cp.city}` : ''}{type === 'rera' && cp.reraNumber ? ` · ${cp.reraNumber}` : ''}</p>
                  </div>
                  <a href={url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-[11px] text-blue-600 hover:underline flex-shrink-0">
                    <Eye size={12} /> View
                  </a>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => act(cp.id, type, true)} disabled={acting === key}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors">
                      {acting === key ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />} Approve
                    </button>
                    <button onClick={() => act(cp.id, type, false)} disabled={acting === key}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors">
                      <XCircle size={11} /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminVerifications;
