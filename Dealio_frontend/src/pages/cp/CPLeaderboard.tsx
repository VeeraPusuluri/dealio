import DashboardLayout from '@/components/layout/DashboardLayout';
import { channelPartners } from '@/data/channelPartners';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency } from '@/lib/format';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

const CPLeaderboard = () => {
  const user = useAuthStore((s) => s.user);
  const ranked = [...channelPartners]
    .sort((a, b) => b.dealsThisMonth - a.dealsThisMonth || b.totalEarnings - a.totalEarnings)
    .map((cp, i) => ({ ...cp, rank: i + 1 }));

  const currentCP = ranked.find((cp) => cp.id === 'CP001');
  const medalIcons = [Trophy, Medal, Award];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">CP Leaderboard</h2>

        {/* Monthly Challenge */}
        <div className="bg-card rounded-lg p-5 card-shadow border border-border">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp size={20} className="text-amber-500" />
            <h3 className="font-semibold text-card-foreground">Monthly Challenge</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Close 5 deals this month to earn Gold tier + ₹10,000 bonus</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-muted rounded-full h-3">
              <div className="h-3 rounded-full bg-amber-500 transition-all" style={{ width: `${((currentCP?.dealsThisMonth || 0) / 5) * 100}%` }} />
            </div>
            <span className="text-sm font-bold text-card-foreground">{currentCP?.dealsThisMonth || 0}/5</span>
          </div>
        </div>

        {/* Top 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ranked.slice(0, 3).map((cp, i) => {
            const MedalIcon = medalIcons[i];
            const colors = ['text-amber-500', 'text-gray-400', 'text-orange-600'];
            return (
              <div key={cp.id} className={`bg-card rounded-lg p-5 card-shadow border border-border text-center ${cp.id === 'CP001' ? 'ring-2 ring-primary/30' : ''}`}>
                <MedalIcon size={28} className={`${colors[i]} mx-auto mb-2`} />
                <p className="font-bold text-card-foreground">{cp.name}</p>
                <p className="text-xs text-muted-foreground">{cp.city}</p>
                <StatusBadge status={cp.tier} size="md" />
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div><p className="text-lg font-bold text-card-foreground">{cp.dealsThisMonth}</p><p className="text-[10px] text-muted-foreground">Deals</p></div>
                  <div><p className="text-lg font-bold text-card-foreground">{formatCurrency(cp.totalEarnings)}</p><p className="text-[10px] text-muted-foreground">Revenue</p></div>
                </div>
                {cp.id === 'CP001' && <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">You</span>}
              </div>
            );
          })}
        </div>

        {/* Full table */}
        <div className="bg-card rounded-lg card-shadow border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border bg-muted/50">
                  <th className="p-3 font-medium">Rank</th>
                  <th className="p-3 font-medium">CP Name</th>
                  <th className="p-3 font-medium">City</th>
                  <th className="p-3 font-medium">Tier</th>
                  <th className="p-3 font-medium text-right">Deals</th>
                  <th className="p-3 font-medium text-right">Revenue</th>
                  <th className="p-3 font-medium text-right">Active Leads</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((cp) => (
                  <tr key={cp.id} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${cp.id === 'CP001' ? 'bg-primary/5' : ''}`}>
                    <td className="p-3 font-bold text-card-foreground">
                      {cp.rank <= 3 ? (
                        <span className={`${cp.rank === 1 ? 'text-amber-500' : cp.rank === 2 ? 'text-gray-400' : 'text-orange-600'}`}>
                          #{cp.rank}
                        </span>
                      ) : `#${cp.rank}`}
                    </td>
                    <td className="p-3 text-card-foreground font-medium">
                      {cp.name}
                      {cp.id === 'CP001' && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">You</span>}
                      {cp.rank <= 3 && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium">Top Performer</span>}
                    </td>
                    <td className="p-3 text-muted-foreground">{cp.city}</td>
                    <td className="p-3"><StatusBadge status={cp.tier} /></td>
                    <td className="p-3 text-right font-semibold text-card-foreground">{cp.dealsThisMonth}</td>
                    <td className="p-3 text-right text-card-foreground">{formatCurrency(cp.totalEarnings)}</td>
                    <td className="p-3 text-right text-muted-foreground">{cp.referrals.length + 3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CPLeaderboard;
