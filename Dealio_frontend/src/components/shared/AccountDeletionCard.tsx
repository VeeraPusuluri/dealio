import { useState, useEffect } from 'react';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, Clock } from 'lucide-react';

interface DeletionRequest {
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

/**
 * Self-contained "Request account deletion" control for any role's settings page.
 * Submits a request the admin reviews; on approval the account is anonymized and
 * disabled. Reflects an existing pending request so users don't double-submit.
 */
const AccountDeletionCard = () => {
  const [existing, setExisting] = useState<DeletionRequest | null>(null);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [reason, setReason]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    authApi.getMyDeletionRequest()
      .then(d => setExisting(d as DeletionRequest | null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await authApi.requestAccountDeletion(reason.trim() || undefined) as DeletionRequest;
      setExisting(res ?? { status: 'pending', requestedAt: new Date().toISOString() });
      setOpen(false);
      setReason('');
      toast.success('Your account deletion request has been submitted for review.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const pending = existing?.status === 'pending';

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/40 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-[14px] font-bold text-slate-800">Delete account</h3>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Request permanent deletion of your account. An administrator will review your request.
            Once approved, your personal details are removed and you can no longer sign in.
          </p>

          {loading ? (
            <Loader2 size={16} className="animate-spin text-slate-300 mt-3" />
          ) : pending ? (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-[12px] font-semibold">
              <Clock size={13} /> Deletion request pending review
            </div>
          ) : open ? (
            <div className="mt-3 space-y-2">
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={2}
                placeholder="Reason (optional)…"
                className="w-full px-3 py-2 rounded-lg border border-red-200 text-[12px] bg-white resize-none focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <div className="flex gap-2">
                <button onClick={submit} disabled={submitting}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors">
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <AlertTriangle size={13} />} Confirm deletion request
                </button>
                <button onClick={() => { setOpen(false); setReason(''); }}
                  className="px-3 py-2 rounded-lg text-[12px] text-slate-500 border border-slate-200 hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setOpen(true)}
              className="mt-3 px-3 py-2 rounded-lg text-[12px] font-semibold text-red-600 border border-red-300 hover:bg-red-100 transition-colors">
              Request account deletion
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountDeletionCard;
