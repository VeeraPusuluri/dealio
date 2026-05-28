import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { cpApi } from '@/lib/api';
import { Copy, Share2, Users, Gift, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CPProfile {
  id: number;
  fullName: string;
  cp?: { reraNumber?: string | null; city?: string | null } | null;
}

function makeReferralCode(profile: CPProfile): string {
  const first = profile.fullName.split(' ')[0].toUpperCase().slice(0, 6);
  return `CP-${first}-${profile.id}`;
}

export default function CPReferral() {
  const { user } = useAuthStore();
  const cpUserId = user?.id ?? '';

  const [profile, setProfile] = useState<CPProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!cpUserId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await cpApi.getProfile(cpUserId);
      setProfile(data as CPProfile);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [cpUserId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const referralCode = profile ? makeReferralCode(profile) : '—';
  const origin = window.location.origin;
  const referralLink = profile ? `${origin}/login?ref=${referralCode}` : '';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied!');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  const handleShareWA = () => {
    const msg = `Join Dealio as a Channel Partner using my referral code: *${referralCode}*\n\nEarn commissions on real estate deals across India.\n\nSign up here: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8 max-w-2xl">

        <div>
          <h1 className="text-[17px] font-bold text-foreground">Referral Tree</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Invite fellow agents and earn bonuses on their deals</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-14"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {/* Referral code card */}
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-3">Your Referral Code</p>
              <div className="inline-flex items-center gap-3 bg-muted rounded-2xl px-6 py-3.5 mb-4">
                <span className="text-[22px] font-extrabold text-foreground tracking-wider">{referralCode}</span>
                <button onClick={handleCopyCode}
                  className="p-1.5 hover:bg-card rounded-xl transition-colors text-muted-foreground hover:text-foreground">
                  <Copy size={16} />
                </button>
              </div>
              <div className="flex justify-center gap-2.5">
                <button onClick={handleShareWA}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:opacity-90 transition-all"
                  style={{ backgroundColor: '#25D366' }}>
                  <Share2 size={13} /> Share via WhatsApp
                </button>
                <button onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold border border-border text-foreground hover:bg-muted transition-colors">
                  <Copy size={13} /> Copy Link
                </button>
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-[13px] font-bold text-foreground mb-4">How Referrals Work</h3>
              <div className="space-y-3">
                {[
                  { step: '1', title: 'Share your code',   desc: 'Share your referral code or link with fellow real estate agents.' },
                  { step: '2', title: 'They sign up',      desc: 'When they register on Dealio using your code, they become your Level 1 referral.' },
                  { step: '3', title: 'Earn bonuses',      desc: 'You earn ₹500 for each deal they close, and ₹200 for their referrals\' deals (Level 2).' },
                  { step: '4', title: 'Track earnings',    desc: 'Your referral earnings appear in your commissions dashboard once payouts are processed.' },
                ].map(s => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 text-[12px] font-bold flex items-center justify-center shrink-0">
                      {s.step}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-foreground">{s.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Earnings structure */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-card p-4 text-center">
                <Gift size={18} className="text-teal-600 mx-auto mb-2" />
                <p className="text-[20px] font-bold text-teal-600">₹500</p>
                <p className="text-[11px] text-muted-foreground">Per deal from Level 1 referral</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 text-center">
                <Users size={18} className="text-indigo-500 mx-auto mb-2" />
                <p className="text-[20px] font-bold text-indigo-500">₹200</p>
                <p className="text-[11px] text-muted-foreground">Per deal from Level 2 referral</p>
              </div>
            </div>

            {/* Referral tree — empty state */}
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center">
              <Users size={28} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-[13px] font-semibold text-foreground">No referrals yet</p>
              <p className="text-[12px] text-muted-foreground mt-1 max-w-xs mx-auto">
                Share your referral code above with other agents. Once they join and add deals, your referral tree will appear here.
              </p>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
