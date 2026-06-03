import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Search, Loader2, Shield, CheckCircle2, XCircle, Eye,
  FileText, AlertTriangle, ChevronDown, Users, Star, ArrowLeft,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CP {
  id: number;
  userId: number;
  city: string | null;
  tier: string;
  totalDeals: number;
  totalEarnings: number;
  aadhaarUrl: string | null;
  aadhaarVerified: boolean;
  panUrl: string | null;
  panVerified: boolean;
  reraUrl: string | null;
  reraVerified: boolean;
  reraNumber: string | null;
  createdAt: string;
  user: { id: number; fullName: string | null; phone: string; email: string | null; createdAt: string };
  _count: { deals: number };
}

type DocType = 'aadhaar' | 'pan' | 'rera';

const TIER_COLOR: Record<string, string> = {
  Platinum: '#8B5CF6',
  Gold:     '#F59E0B',
  Silver:   '#6B7280',
};

const DOC_LABELS: Record<DocType, string> = {
  aadhaar: 'Aadhaar',
  pan:     'PAN',
  rera:    'RERA',
};

// ── Component ─────────────────────────────────────────────────────────────────
const AdminCPs = () => {
  const navigate = useNavigate();
  const [cps, setCPs]                   = useState<CP[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [tierFilter, setTierFilter]     = useState('ALL');
  const [docFilter, setDocFilter]       = useState('all');
  const [selectedCP, setSelectedCP]     = useState<CP | null>(null);
  const [verifying, setVerifying]       = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [pendingAction, setPendingAction] = useState<{ cpId: number; docType: DocType; approved: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCPs({
        tier:      tierFilter !== 'ALL' ? tierFilter : undefined,
        docStatus: docFilter !== 'all'  ? docFilter  : undefined,
        search:    search || undefined,
      }) as CP[];
      setCPs(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load channel partners'); }
    finally  { setLoading(false); }
  }, [tierFilter, docFilter, search]);

  useEffect(() => { load(); }, [load]);

  // Sync selectedCP when CPs refresh
  useEffect(() => {
    if (selectedCP) setSelectedCP(cps.find(c => c.id === selectedCP.id) ?? null);
  }, [cps]); // eslint-disable-line react-hooks/exhaustive-deps

  const docStatus = (cp: CP) => {
    const docs: { type: DocType; url: string | null; verified: boolean }[] = [
      { type: 'aadhaar', url: cp.aadhaarUrl, verified: cp.aadhaarVerified },
      { type: 'pan',     url: cp.panUrl,     verified: cp.panVerified     },
      { type: 'rera',    url: cp.reraUrl,    verified: cp.reraVerified    },
    ];
    const uploaded = docs.filter(d => d.url);
    const pending  = uploaded.filter(d => !d.verified).length;
    const verified = uploaded.filter(d => d.verified).length;
    return { docs, uploaded: uploaded.length, pending, verified };
  };

  const handleVerify = async (cpId: number, docType: DocType, approved: boolean) => {
    if (!approved && !rejectionNote.trim()) {
      toast.error('Please enter a rejection note before rejecting');
      return;
    }
    setVerifying(`${cpId}-${docType}`);
    try {
      await adminApi.verifyDocument(cpId, docType, approved, rejectionNote || undefined);
      toast.success(`${DOC_LABELS[docType]} ${approved ? 'approved' : 'rejected'}`);
      setRejectionNote('');
      setPendingAction(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setVerifying(null);
    }
  };

  const handleTierChange = async (cp: CP, tier: string) => {
    try {
      await adminApi.updateCPTier(cp.id, tier);
      toast.success(`${cp.user.fullName ?? cp.user.phone} upgraded to ${tier}`);
      await load();
    } catch { toast.error('Failed to update tier'); }
  };

  const stats = {
    total:    cps.length,
    pending:  cps.filter(c => docStatus(c).pending > 0).length,
    verified: cps.filter(c => docStatus(c).uploaded > 0 && docStatus(c).pending === 0).length,
    noDoc:    cps.filter(c => docStatus(c).uploaded === 0).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="la-banner px-5 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0" title="Back to Overview">
            <ArrowLeft size={15} className="text-slate-500" />
          </button>
          <Shield size={16} className="text-purple-500" />
          <div className="flex-1">
            <h2 className="text-[15px] font-bold text-slate-800">Channel Partner Management</h2>
            <p className="text-xs text-slate-400 mt-0.5">Verify documents, manage tiers, oversee CP activity</p>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total CPs',          value: stats.total,    color: '#6B3FA0', icon: Users },
            { label: 'Pending Verification',value: stats.pending,  color: '#F59E0B', icon: AlertTriangle },
            { label: 'Fully Verified',      value: stats.verified, color: '#16A34A', icon: CheckCircle2 },
            { label: 'No Docs Uploaded',    value: stats.noDoc,    color: '#6B7280', icon: FileText },
          ].map(s => (
            <div key={s.label} className="la-card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18`, color: s.color }}>
                <s.icon size={16} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium">{s.label}</p>
                <p className="text-xl font-bold text-slate-800">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search CPs by name, phone, email…"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300" />
          </div>
          <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-[12px] text-slate-700 focus:outline-none">
            <option value="ALL">All Tiers</option>
            {['Silver', 'Gold', 'Platinum'].map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={docFilter} onChange={e => setDocFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-[12px] text-slate-700 focus:outline-none">
            <option value="all">All Doc Status</option>
            <option value="pending">Pending Verification</option>
            <option value="verified">Fully Verified</option>
            <option value="missing">No Docs</option>
          </select>
        </div>

        {/* ── Table ── */}
        <div className="la-card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
          ) : cps.length === 0 ? (
            <p className="text-center text-[12px] text-slate-400 py-12">No channel partners found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-[10px] uppercase border-b border-slate-100 bg-slate-50/60">
                    <th className="px-4 py-3 font-semibold">CP Name</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">City</th>
                    <th className="px-4 py-3 font-semibold">Tier</th>
                    <th className="px-4 py-3 font-semibold">Deals</th>
                    <th className="px-4 py-3 font-semibold">Documents</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cps.map(cp => {
                    const { docs, pending } = docStatus(cp);
                    return (
                      <tr key={cp.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-[12px] font-semibold text-slate-800">{cp.user.fullName ?? '—'}</p>
                          <p className="text-[10px] text-slate-400">{cp.user.email ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-slate-600 font-mono">{cp.user.phone}</td>
                        <td className="px-4 py-3 text-[12px] text-slate-600">{cp.city ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="relative group inline-block">
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white cursor-pointer select-none"
                              style={{ backgroundColor: TIER_COLOR[cp.tier] ?? '#6B7280' }}>
                              <Star size={9} /> {cp.tier} <ChevronDown size={9} />
                            </span>
                            <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-28">
                              {['Silver', 'Gold', 'Platinum'].map(t => (
                                <button key={t} onClick={() => handleTierChange(cp, t)}
                                  className="w-full text-left px-3 py-1.5 text-[11px] font-medium hover:bg-slate-50"
                                  style={{ color: TIER_COLOR[t] }}>
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-slate-600">{cp._count.deals}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            {docs.map(d => (
                              <span key={d.type} className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                                !d.url
                                  ? 'bg-slate-100 text-slate-400'
                                  : d.verified
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-amber-100 text-amber-700'
                              }`}>
                                {DOC_LABELS[d.type]}
                              </span>
                            ))}
                            {pending > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold">{pending}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-400">
                          {new Date(cp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelectedCP(cp)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors">
                            <Eye size={12} /> Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── CP Detail + Document Verification Drawer ── */}
      {selectedCP && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => { setSelectedCP(null); setPendingAction(null); setRejectionNote(''); }} />
          <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">

            {/* Drawer header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-[14px] font-bold text-slate-800">{selectedCP.user.fullName ?? selectedCP.user.phone}</h3>
                <p className="text-[11px] text-slate-400">{selectedCP.user.email ?? selectedCP.user.phone}</p>
              </div>
              <button onClick={() => { setSelectedCP(null); setPendingAction(null); setRejectionNote(''); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <XCircle size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">

              {/* Basic info */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Phone',   value: selectedCP.user.phone },
                  { label: 'City',    value: selectedCP.city ?? '—' },
                  { label: 'Tier',    value: selectedCP.tier },
                  { label: 'Deals',   value: String(selectedCP._count.deals) },
                  { label: 'Earnings',value: `₹${(selectedCP.totalEarnings / 100000).toFixed(1)}L` },
                  { label: 'RERA #',  value: selectedCP.reraNumber ?? '—' },
                  { label: 'Joined',  value: new Date(selectedCP.createdAt).toLocaleDateString('en-IN') },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl px-3 py-2.5">
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
                    <p className="text-[13px] font-semibold text-slate-800 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {/* Document verification */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Document Verification</h4>
                <div className="space-y-3">
                  {(['aadhaar', 'pan', 'rera'] as DocType[]).map(type => {
                    const url      = type === 'aadhaar' ? selectedCP.aadhaarUrl : type === 'pan' ? selectedCP.panUrl : selectedCP.reraUrl;
                    const verified = type === 'aadhaar' ? selectedCP.aadhaarVerified : type === 'pan' ? selectedCP.panVerified : selectedCP.reraVerified;
                    const isPending = pendingAction?.cpId === selectedCP.id && pendingAction.docType === type;
                    const key       = `${selectedCP.id}-${type}`;

                    return (
                      <div key={type} className={`rounded-xl border p-4 ${
                        !url        ? 'border-slate-200 bg-slate-50/50'
                        : verified  ? 'border-green-200 bg-green-50/40'
                        : 'border-amber-200 bg-amber-50/40'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className={!url ? 'text-slate-300' : verified ? 'text-green-600' : 'text-amber-600'} />
                            <span className="text-[13px] font-semibold text-slate-700">{DOC_LABELS[type]}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            !url        ? 'bg-slate-100 text-slate-400'
                            : verified  ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                          }`}>
                            {!url ? 'Not Uploaded' : verified ? '✓ Verified' : '⏳ Pending'}
                          </span>
                        </div>

                        {url && (
                          <>
                            <a href={url} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1.5 text-[11px] text-blue-600 hover:underline mb-3">
                              <Eye size={11} /> View uploaded document
                            </a>

                            {!verified && !isPending && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleVerify(selectedCP.id, type, true)}
                                  disabled={verifying === key}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors">
                                  {verifying === key ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                                  Approve
                                </button>
                                <button
                                  onClick={() => setPendingAction({ cpId: selectedCP.id, docType: type, approved: false })}
                                  disabled={verifying === key}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors">
                                  <XCircle size={11} /> Reject
                                </button>
                              </div>
                            )}

                            {/* Rejection note input */}
                            {isPending && !pendingAction?.approved && (
                              <div className="space-y-2 mt-1">
                                <textarea
                                  value={rejectionNote}
                                  onChange={e => setRejectionNote(e.target.value)}
                                  placeholder="Enter rejection reason (required)…"
                                  rows={2}
                                  className="w-full px-3 py-2 rounded-lg border border-red-200 text-[12px] bg-white resize-none focus:outline-none focus:ring-2 focus:ring-red-200"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleVerify(selectedCP.id, type, false)}
                                    disabled={!rejectionNote.trim() || verifying === key}
                                    className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-red-500 disabled:opacity-50 hover:bg-red-600 transition-colors">
                                    {verifying === key ? 'Rejecting…' : 'Confirm Rejection'}
                                  </button>
                                  <button onClick={() => { setPendingAction(null); setRejectionNote(''); }}
                                    className="px-3 py-1.5 rounded-lg text-[11px] text-slate-500 border border-slate-200 hover:bg-slate-50">
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {verified && (
                              <button
                                onClick={() => setPendingAction({ cpId: selectedCP.id, docType: type, approved: false })}
                                className="text-[10px] text-red-400 hover:underline mt-1">
                                Revoke verification
                              </button>
                            )}
                          </>
                        )}

                        {!url && (
                          <p className="text-[11px] text-slate-400 italic">No document uploaded by the CP yet.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tier management */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Change Tier</h4>
                <div className="flex gap-2">
                  {['Silver', 'Gold', 'Platinum'].map(t => (
                    <button key={t} onClick={() => handleTierChange(selectedCP, t)}
                      disabled={selectedCP.tier === t}
                      className="flex-1 py-2 rounded-xl text-[12px] font-bold text-white disabled:opacity-40 transition-all"
                      style={{ backgroundColor: TIER_COLOR[t] }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminCPs;
