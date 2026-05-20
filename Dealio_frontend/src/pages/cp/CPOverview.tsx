import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import MilestoneChip from '@/components/shared/MilestoneChip';
import LeadScoreBadge from '@/components/shared/LeadScoreBadge';
import { formatCurrency } from '@/lib/format';
import { useAuthStore } from '@/stores/useAuthStore';
import { channelPartners } from '@/data/channelPartners';
import { projects } from '@/data/projects';
import { useLeadStore } from '@/stores/useLeadStore';
import { useFollowUpStore } from '@/stores/useFollowUpStore';
import { calculateLeadScore } from '@/lib/leadScoring';
import { Users, Calendar, Handshake, DollarSign, Gift, Share2, Phone, MessageSquare, Clock, Flame } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const funnelData = [
  { stage: 'New Leads', count: 24 }, { stage: 'Meetings', count: 18 },
  { stage: 'Negotiation', count: 10 }, { stage: 'Booked', count: 6 }, { stage: 'Closed', count: 4 },
];
const commTrend = [
  { month: 'Aug', amount: 85000 }, { month: 'Sep', amount: 120000 }, { month: 'Oct', amount: 95000 },
  { month: 'Nov', amount: 145000 }, { month: 'Dec', amount: 110000 }, { month: 'Jan', amount: 124000 },
];

const CPOverview = () => {
  const user = useAuthStore(s => s.user);
  const cp = channelPartners.find(c => c.id === 'CP001')!;
  const newProjects = projects.filter(p => p.status === 'New Launch' || p.status === 'Active').slice(0, 3);
  const { leads } = useLeadStore();
  const { followUps, callLogs } = useFollowUpStore();
  const today = new Date().toISOString().split('T')[0];

  // Hot leads (score >= 75)
  const hotLeads = leads
    .map((l) => ({ ...l, score: calculateLeadScore(l) }))
    .filter((l) => l.score.total >= 75)
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 3);

  // Follow-ups due today
  const todayFollowUps = followUps.filter((f) => f.dueDate === today && !f.done).slice(0, 3);

  // Calls due today
  const callsDueToday = callLogs
    .filter((c) => c.nextFollowUp === today)
    .slice(0, 3);

  // Leaderboard
  const ranked = [...channelPartners].sort((a, b) => b.dealsThisMonth - a.dealsThisMonth).slice(0, 3);
  const myRank = [...channelPartners].sort((a, b) => b.dealsThisMonth - a.dealsThisMonth).findIndex((c) => c.id === 'CP001') + 1;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-card rounded-lg p-5 card-shadow border border-border flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-xl">R</div>
          <div>
            <h2 className="text-xl font-bold text-card-foreground">Good morning, {cp.name}! 🏆</h2>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={cp.tier} size="md" />
              <span className="text-sm text-muted-foreground">Partner</span>
              <span className="text-xs text-muted-foreground">• Rank #{myRank} this month</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Active Leads" value={12} icon={Users} color="#E87722" />
          <StatCard title="Meetings This Week" value={5} icon={Calendar} color="#8B5CF6" />
          <StatCard title="Deals (Month)" value={cp.dealsThisMonth} icon={Handshake} color="#16A34A" />
          <StatCard title="Earnings" value={formatCurrency(124000)} icon={DollarSign} color="#0A7E8C" />
          <StatCard title="Referral Bonus" value={formatCurrency(8500)} icon={Gift} color="#F59E0B" />
        </div>

        {/* Hot Leads + Follow-ups + Calls Due */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Today's Hot Leads */}
          <div className="bg-card rounded-lg p-5 card-shadow border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={16} className="text-red-500" />
              <h3 className="font-semibold text-card-foreground text-sm">Today's Hot Leads</h3>
            </div>
            {hotLeads.length === 0 && <p className="text-xs text-muted-foreground">No hot leads right now</p>}
            {hotLeads.map((lead) => (
              <div key={lead.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">{lead.customerName}</p>
                  <p className="text-[10px] text-muted-foreground">{lead.projectName}</p>
                </div>
                <LeadScoreBadge score={lead.score} showTooltip={false} />
                <button onClick={() => window.open(`tel:+91${lead.phone}`, '_blank')}
                  className="p-1.5 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 transition-colors">
                  <Phone size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Follow-up Due */}
          <div className="bg-card rounded-lg p-5 card-shadow border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-amber-500" />
              <h3 className="font-semibold text-card-foreground text-sm">Follow-up Due</h3>
            </div>
            {todayFollowUps.length === 0 && <p className="text-xs text-muted-foreground">All clear for today!</p>}
            {todayFollowUps.map((fu) => (
              <div key={fu.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">{fu.customerName}</p>
                  <p className="text-[10px] text-muted-foreground">{fu.reason}</p>
                </div>
                <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Hi ${fu.customerName}, just checking in on ${fu.projectName}!`)}`, '_blank')}
                  className="p-1.5 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  <MessageSquare size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Mini Leaderboard */}
          <div className="bg-card rounded-lg p-5 card-shadow border border-border">
            <h3 className="font-semibold text-card-foreground text-sm mb-3">Leaderboard</h3>
            {ranked.map((c, i) => (
              <div key={c.id} className={`flex items-center gap-3 py-2 border-b border-border last:border-0 ${c.id === 'CP001' ? 'bg-primary/5 -mx-2 px-2 rounded' : ''}`}>
                <span className={`text-xs font-bold w-5 ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : 'text-orange-600'}`}>#{i + 1}</span>
                <div className="flex-1"><p className="text-sm font-medium text-card-foreground">{c.name}</p></div>
                <span className="text-xs font-bold text-card-foreground">{c.dealsThisMonth} deals</span>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground mt-2 text-center">Your rank: #{myRank}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg p-5 card-shadow border border-border">
            <h3 className="font-semibold text-card-foreground mb-4">Lead Funnel</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnelData} layout="vertical">
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="stage" fontSize={11} tickLine={false} axisLine={false} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#E87722" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-lg p-5 card-shadow border border-border">
            <h3 className="font-semibold text-card-foreground mb-4">Commission Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={commTrend}>
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="amount" stroke="#0A7E8C" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-lg p-5 card-shadow border border-border">
          <h3 className="font-semibold text-card-foreground mb-4">New in Network</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {newProjects.map(p => (
              <div key={p.id} className="min-w-[240px] bg-muted rounded-lg p-3 flex-shrink-0">
                <img src={p.image} alt={p.name} className="w-full h-28 object-cover rounded-md mb-2" />
                <h4 className="font-semibold text-sm text-card-foreground">{p.name}</h4>
                <p className="text-xs text-muted-foreground">{p.location} · {p.bhkTypes.join('/')}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-semibold text-accent">{p.commissionPercent}%</span>
                  <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out ${p.name} at ${p.location}! ${p.bhkTypes.join('/')} starting ₹${(p.priceRange[0]/100000).toFixed(0)}L. Commission: ${p.commissionPercent}%`)}`)} className="text-xs px-2.5 py-1 rounded-full bg-green-600 text-white font-medium">
                    <Share2 size={10} className="inline mr-1" />WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CPOverview;
