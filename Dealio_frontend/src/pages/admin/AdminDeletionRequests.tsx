import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserX, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface DeletionRequest {
  id: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt: string | null;
  user: { id: number; fullName: string | null; phone: string; email: string | null; role: string; createdAt: string };
}

const STATUS_BADGE: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-slate-100 text-slate-500',
};

const AdminDeletionRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getDeletionRequests() as DeletionRequest[];
      setRequests(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load deletion requests'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const review = async (id: number, action: 'approve' | 'reject') => {
    if (action === 'approve' && !window.confirm(
      'Approve this deletion? The account will be anonymized and disabled (name, email and phone scrubbed, all sessions revoked). Financial records are kept. This cannot be undone.',
    )) return;
    setActing(id);
    try {
      await adminApi.reviewDeletionRequest(id, action);
      toast.success(action === 'approve' ? 'Account anonymized and disabled' : 'Request rejected');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActing(null);
    }
  };

  const pending = requests.filter(r => r.status === 'pending').length;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="la-banner px-5 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0" title="Back to Overview">
            <ArrowLeft size={15} className="text-slate-500" />
          </button>
          <UserX size={16} className="text-rose-500" />
          <div className="flex-1">
            <h2 className="text-[15px] font-bold text-slate-800">Account Deletion Requests</h2>
            <p className="text-xs text-slate-400 mt-0.5">Review and action user requests to delete their account</p>
          </div>
          {pending > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11px] font-bold">{pending} pending</span>
          )}
        </div>

        {/* Table */}
        <div className="la-card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
          ) : requests.length === 0 ? (
            <p className="text-center text-[12px] text-slate-400 py-12">No deletion requests.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-[10px] uppercase border-b border-slate-100 bg-slate-50/60">
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Reason</th>
                    <th className="px-4 py-3 font-semibold">Requested</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-[12px] font-semibold text-slate-800">{r.user.fullName ?? '—'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{r.user.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">{r.user.role}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-600 max-w-xs truncate" title={r.reason ?? ''}>{r.reason ?? '—'}</td>
                      <td className="px-4 py-3 text-[11px] text-slate-400">
                        {new Date(r.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${STATUS_BADGE[r.status]}`}>
                          {r.status === 'pending' ? <Clock size={9} /> : r.status === 'approved' ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.status === 'pending' ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => review(r.id, 'approve')}
                              disabled={acting === r.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-colors">
                              {acting === r.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />} Approve
                            </button>
                            <button
                              onClick={() => review(r.id, 'reject')}
                              disabled={acting === r.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors">
                              <XCircle size={11} /> Reject
                            </button>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-300 text-right">
                            {r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDeletionRequests;
