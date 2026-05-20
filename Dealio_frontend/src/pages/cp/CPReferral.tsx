import DashboardLayout from '@/components/layout/DashboardLayout';
import StatusBadge from '@/components/shared/StatusBadge';
import { channelPartners } from '@/data/channelPartners';
import { Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const CPReferral = () => {
  const me = channelPartners.find(c => c.id === 'CP001')!;
  const myReferrals = channelPartners.filter(c => me.referrals.includes(c.id));
  const level2 = channelPartners.filter(c => myReferrals.some(r => r.referrals.includes(c.id)));
  const totalBonus = myReferrals.reduce((s, r) => s + r.dealsThisMonth * 500, 0) + level2.reduce((s, r) => s + r.dealsThisMonth * 200, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-card rounded-lg p-6 card-shadow border border-border text-center">
          <p className="text-sm text-muted-foreground mb-2">My Referral Code</p>
          <div className="inline-flex items-center gap-3 bg-muted rounded-lg px-6 py-3">
            <span className="text-2xl font-extrabold text-card-foreground tracking-wider">CP-RAVI-4821</span>
            <button onClick={() => { navigator.clipboard.writeText('CP-RAVI-4821'); toast.success('Copied!'); }} className="p-1.5 hover:bg-card rounded"><Copy size={18} className="text-muted-foreground" /></button>
          </div>
          <div className="flex justify-center gap-3 mt-4">
            <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Join CPConnect with my referral code: CP-RAVI-4821. Earn commissions on real estate deals!')}`)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-available text-white flex items-center gap-1.5"><Share2 size={14} /> WhatsApp</button>
            <button onClick={() => { navigator.clipboard.writeText('https://cpconnect.in/join?ref=CP-RAVI-4821'); toast.success('Link copied!'); }} className="px-4 py-2 rounded-lg text-sm font-semibold bg-secondary text-secondary-foreground">Copy Link</button>
          </div>
        </div>

        {/* Tree visualization */}
        <div className="bg-card rounded-lg p-5 card-shadow border border-border">
          <h3 className="font-semibold text-card-foreground mb-6">My Referral Tree</h3>
          <div className="flex flex-col items-center gap-6">
            {/* Level 0 - Me */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-accent mx-auto flex items-center justify-center text-accent-foreground font-bold text-xl">R</div>
              <p className="font-semibold text-card-foreground mt-2">{me.name}</p>
              <StatusBadge status={me.tier} />
              <p className="text-xs text-muted-foreground mt-1">{me.dealsThisMonth} deals this month</p>
            </div>
            {/* Connector */}
            <div className="w-0.5 h-6 bg-border" />
            {/* Level 1 */}
            <div className="flex gap-8 flex-wrap justify-center">
              {myReferrals.map(r => (
                <div key={r.id} className="text-center">
                  <div className="w-0.5 h-4 bg-border mx-auto mb-2" />
                  <div className="w-12 h-12 rounded-full bg-secondary mx-auto flex items-center justify-center text-secondary-foreground font-bold">{r.name[0]}</div>
                  <p className="font-medium text-sm text-card-foreground mt-1">{r.name}</p>
                  <StatusBadge status={r.tier} />
                  <p className="text-xs text-muted-foreground">{r.dealsThisMonth} deals · ₹{(r.dealsThisMonth * 500).toLocaleString('en-IN')} bonus</p>
                  {/* Level 2 */}
                  {channelPartners.filter(c => r.referrals.includes(c.id)).map(l2 => (
                    <div key={l2.id} className="mt-3">
                      <div className="w-0.5 h-3 bg-border mx-auto mb-1" />
                      <div className="w-8 h-8 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground text-xs font-bold">{l2.name[0]}</div>
                      <p className="text-xs text-card-foreground mt-1">{l2.name}</p>
                      <StatusBadge status={l2.tier} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg p-4 card-shadow border border-border text-center">
            <p className="text-2xl font-bold text-card-foreground">{myReferrals.length + level2.length}</p>
            <p className="text-sm text-muted-foreground">Total in Tree</p>
          </div>
          <div className="bg-card rounded-lg p-4 card-shadow border border-border text-center">
            <p className="text-2xl font-bold text-accent">₹{totalBonus.toLocaleString('en-IN')}</p>
            <p className="text-sm text-muted-foreground">Total Bonus Earned</p>
          </div>
          <div className="bg-card rounded-lg p-4 card-shadow border border-border text-center">
            <p className="text-2xl font-bold text-booked">₹{(totalBonus * 0.3).toLocaleString('en-IN')}</p>
            <p className="text-sm text-muted-foreground">Pending Bonus</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CPReferral;
