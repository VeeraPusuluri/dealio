import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { cpApi } from '@/lib/api';
import { Trophy, TrendingUp, CheckCircle2, Clock, Target, Loader2 } from 'lucide-react';

interface CPLead { id: number; status: string; estimatedCommission: number | null; createdAt: string; }
interface CPProfile { fullName: string; cp?: { city?: string | null; reraNumber?: string | null } | null; }

const MONTHLY_GOAL = 5;

export default function CPLeaderboard() {
  const { user } = useAuthStore();
  const cpUserId = user?.id ?? '';

  const [leads, setLeads]     = useState<CPLead[]>([]);
  const [profile, setProfile] = useState<CPProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!cpUserId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [leadsData, profileData] = await Promise.all([
        cpApi.getLeads(cpUserId),
        cpApi.getProfile(cpUserId),
      ]);
      setLeads((leadsData as CPLead[]) || []);
      setProfile(profileData as CPProfile);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [cpUserId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const now = new Date();
  const thisMonth = leads.filter(l => {
    const d = new Date(l.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const bookedTotal   = leads.filter(l => l.status === 'Booked').length;
  const bookedMonth   = thisMonth.filter(l => l.status === 'Booked').length;
  const activeLeads   = leads.filter(l => !['Booked','Closed'].includes(l.status)).length;
  const totalEarnings = leads
    .filter(l => l.status === 'Booked')
    .reduce((sum, l) => sum + (l.estimatedCommission ?? 0), 0);
  const goalPct = Math.min((bookedMonth / MONTHLY_GOAL) * 100, 100);

  const tier = bookedTotal >= 20 ? 'Platinum' : bookedTotal >= 10 ? 'Gold' : bookedTotal >= 5 ? 'Silver' : 'Bronze';
  const tierColors: Record<string, { bg: string; text: string; border: string }> = {
    Platinum: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
    Gold:     { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-200' },
    Silver:   { bg: 'bg-slate-100',  text: 'text-slate-600',  border: 'border-slate-200' },
    Bronze:   { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  };
  const tc = tierColors[tier];

  const initials = (profile?.fullName ?? user?.name ?? 'U')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8">
        <div>
          <h1 className="text-[17px] font-bold text-foreground">Leaderboard</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Your performance and ranking</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-14"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {/* My performance card */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg,#0A7E8C0d 0%,transparent 100%)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-[17px] font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-foreground">{profile?.fullName ?? user?.name}</p>
                    <p className="text-[12px] text-muted-foreground">{profile?.cp?.city ?? 'Channel Partner'}</p>
                    <span className={`inline-block mt-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${tc.bg} ${tc.text} ${tc.border}`}>
                      {tier} Tier
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-muted-foreground">Total Earnings</p>
                    <p className="text-[17px] font-bold text-teal-600">
                      ₹{totalEarnings >= 100000
                        ? `${(totalEarnings / 100000).toFixed(1)}L`
                        : totalEarnings.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
                {[
                  { label: 'Total Deals',   value: bookedTotal,  icon: CheckCircle2, color: 'text-emerald-600' },
                  { label: 'This Month',    value: bookedMonth,  icon: Target,       color: 'text-teal-600' },
                  { label: 'Active Leads',  value: activeLeads,  icon: Clock,        color: 'text-amber-600' },
                ].map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="flex flex-col items-center py-4">
                      <Icon size={14} className={s.color} />
                      <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly challenge */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp size={16} className="text-amber-500" />
                <h3 className="text-[13px] font-bold text-foreground">Monthly Challenge</h3>
              </div>
              <p className="text-[12px] text-muted-foreground mb-3">
                Close {MONTHLY_GOAL} deals this month to unlock the next tier and earn a bonus.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${goalPct}%` }} />
                </div>
                <span className="text-[12px] font-bold text-foreground shrink-0">{bookedMonth}/{MONTHLY_GOAL}</span>
              </div>
              {bookedMonth >= MONTHLY_GOAL && (
                <p className="text-[12px] font-semibold text-emerald-600 mt-2 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Goal achieved this month! 🎉
                </p>
              )}
            </div>

            {/* Tier guide */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-[13px] font-bold text-foreground mb-3">Tier Requirements</h3>
              <div className="space-y-2.5">
                {[
                  { tier: 'Bronze',   deals: '0–4',  color: tierColors.Bronze },
                  { tier: 'Silver',   deals: '5–9',  color: tierColors.Silver },
                  { tier: 'Gold',     deals: '10–19', color: tierColors.Gold },
                  { tier: 'Platinum', deals: '20+',  color: tierColors.Platinum },
                ].map(t => (
                  <div key={t.tier}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${t.color.border} ${t.color.bg} ${tier === t.tier ? 'ring-2 ring-teal-400/30' : ''}`}>
                    <span className={`text-[12px] font-semibold ${t.color.text}`}>{t.tier}</span>
                    <span className={`text-[11px] ${t.color.text}`}>{t.deals} deals</span>
                    {tier === t.tier && <span className="text-[10px] font-bold text-teal-600">Current</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Platform leaderboard placeholder */}
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <Trophy size={28} className="text-amber-400 mx-auto mb-3" />
              <p className="text-[13px] font-semibold text-foreground">Platform Leaderboard</p>
              <p className="text-[12px] text-muted-foreground mt-1">
                Rankings across all channel partners are coming soon. Your real-time rank will appear here.
              </p>
              <span className="inline-block mt-3 text-[10px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700">Coming Soon</span>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
