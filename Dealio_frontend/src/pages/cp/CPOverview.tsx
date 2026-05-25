import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadScoreBadge from '@/components/shared/LeadScoreBadge';
import { formatCurrency } from '@/lib/format';
import { cpApi } from '@/lib/api';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useLeadStore } from '@/stores/useLeadStore';
import { useFollowUpStore } from '@/stores/useFollowUpStore';
import { calculateLeadScore } from '@/lib/leadScoring';
import {
  Users, Calendar, Handshake, DollarSign,
  Phone, MessageSquare, Clock, Flame,
  TrendingUp, ArrowRight, Sparkles,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TIER_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  Platinum: { bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-400'  },
  Gold:     { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  Silver:   { bg: 'bg-slate-100',  text: 'text-slate-600',   dot: 'bg-slate-400'   },
};

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

const CPOverview = () => {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const { leads } = useLeadStore();
  const { followUps, callLogs } = useFollowUpStore();
  const { addNotification } = useNotificationStore();
  const today = new Date().toISOString().split('T')[0];

  const [tier, setTier] = useState<string>('Silver');

  useEffect(() => {
    if (!user?.id) return;
    cpApi.getProfile(user.id)
      .then((data: any) => { if (data?.cp?.tier) setTier(data.cp.tier); })
      .catch(() => {});

    // Drain any unread DB notifications on mount (catch-up for offline periods)
    cpApi.getNotifications()
      .then((data: any) => {
        (data as { title: string; message: string; type: string; link?: string }[] || [])
          .forEach(n => addNotification({ type: n.type as 'info' | 'success' | 'error' | 'warning', title: n.title, message: n.message, link: n.link }));
      })
      .catch(() => {});
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived lead metrics
  const meetingStages = ['Meeting Requested', 'Meeting Confirmed', 'Meeting Done'];
  const activeLeads     = leads.filter(l => l.stage !== 'Closed').length;
  const meetingsCount   = leads.filter(l => meetingStages.includes(l.stage)).length;
  const closedCount     = leads.filter(l => l.stage === 'Closed').length;

  const hotLeads = leads
    .map(l => ({ ...l, score: calculateLeadScore(l) }))
    .filter(l => l.score.total >= 75)
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 3);

  const todayFollowUps = followUps.filter(f => f.dueDate === today && !f.done).slice(0, 3);
  const callsDueToday  = callLogs.filter(c => c.nextFollowUp === today).slice(0, 3);

  // Funnel derived from real leads
  const funnelData = [
    { stage: 'New Leads',   count: leads.filter(l => l.stage === 'New Lead').length },
    { stage: 'Meetings',    count: leads.filter(l => meetingStages.includes(l.stage)).length },
    { stage: 'Negotiation', count: leads.filter(l => l.stage === 'Negotiation').length },
    { stage: 'Booked',      count: leads.filter(l => l.stage === 'Booked').length },
    { stage: 'Closed',      count: leads.filter(l => l.stage === 'Closed').length },
  ];

  const tierStyle = TIER_STYLE[tier] ?? TIER_STYLE.Silver;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-6">

        {/* ── Hero greeting ── */}
        <div className="relative overflow-hidden rounded-2xl px-7 py-6"
          style={{ background: 'linear-gradient(130deg, #fff7f0 0%, #fff 50%, #f0f9ff 100%)' }}>
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #E87722 0%, transparent 70%)' }} />
          <div className="absolute -bottom-8 left-1/3 w-32 h-32 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #0A7E8C 0%, transparent 70%)' }} />

          <div className="relative flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl flex-shrink-0 shadow-md"
              style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #E87722 60%, #D4691C 100%)' }}>
              {user?.name?.[0]?.toUpperCase() ?? 'C'}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                <Sparkles size={10} style={{ color: '#E87722' }} /> {greeting}
              </p>
              <h1 className="text-2xl font-black text-slate-800 leading-tight">
                {user?.name ?? 'Channel Partner'}
              </h1>
              <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${tierStyle.bg} ${tierStyle.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${tierStyle.dot}`} />
                  {tier} Partner
                </span>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end gap-1">
              <span className="text-2xl font-black text-slate-800">{closedCount}</span>
              <span className="text-xs text-slate-400 font-medium">Deals closed</span>
            </div>
          </div>
        </div>

        {/* ── KPI strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { label: 'Active Leads',  value: String(activeLeads),   sub: 'in pipeline',    icon: Users,     from: '#FFF7ED', gradTo: '#FED7AA', accent: '#E87722', path: '/cp/leads'      },
            { label: 'Meetings',      value: String(meetingsCount),  sub: 'in progress',    icon: Calendar,  from: '#F5F3FF', gradTo: '#DDD6FE', accent: '#7C3AED', path: '/cp/leads'      },
            { label: 'Deals Closed',  value: String(closedCount),    sub: 'total',          icon: Handshake, from: '#F0FDF4', gradTo: '#BBF7D0', accent: '#16A34A', path: '/cp/commissions'},
            { label: 'Follow-ups Due',value: String(todayFollowUps.length + callsDueToday.length), sub: 'today', icon: DollarSign, from: '#F0FDFA', gradTo: '#99F6E4', accent: '#0D9488', path: '/cp/followups' },
          ].map(({ label, value, sub, icon: Icon, from, gradTo, accent, path }) => (
            <button key={label} onClick={() => navigate(path)}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2 text-left hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-150 group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${from} 0%, ${gradTo} 100%)` }}>
                <Icon size={16} style={{ color: accent }} />
              </div>
              <div>
                <div className="text-xl font-black text-slate-800">{value}</div>
                <div className="text-[11px] font-medium text-slate-500 leading-tight group-hover:text-slate-700 transition-colors">{label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>
              </div>
            </button>
          ))}
        </div>

        {/* ── Hot leads · Follow-ups ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Hot leads */}
          <Section>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center">
                  <Flame size={13} className="text-red-500" />
                </div>
                <span className="text-sm font-bold text-slate-700">Hot Leads</span>
              </div>
              <span className="text-xs text-slate-400">Score ≥ 75</span>
            </div>
            <div className="px-5 pb-4 space-y-1">
              {hotLeads.length === 0
                ? <p className="text-xs text-slate-400 py-3 text-center">No hot leads right now</p>
                : hotLeads.map(lead => (
                  <div key={lead.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                    <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center text-xs font-bold text-orange-600 flex-shrink-0">
                      {lead.customerName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{lead.customerName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{lead.projectName}</p>
                    </div>
                    <LeadScoreBadge score={lead.score} showTooltip={false} />
                    <button onClick={() => window.open(`tel:+91${lead.phone}`, '_blank')}
                      className="w-7 h-7 rounded-full bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors">
                      <Phone size={12} className="text-green-600" />
                    </button>
                  </div>
                ))
              }
            </div>
          </Section>

          {/* Follow-ups */}
          <Section>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Clock size={13} className="text-amber-500" />
                </div>
                <span className="text-sm font-bold text-slate-700">Due Today</span>
              </div>
              <span className="text-xs text-slate-400">{todayFollowUps.length + callsDueToday.length} pending</span>
            </div>
            <div className="px-5 pb-4 space-y-1">
              {todayFollowUps.length === 0 && callsDueToday.length === 0
                ? <p className="text-xs text-slate-400 py-3 text-center">All clear for today 🎉</p>
                : [...todayFollowUps.map(fu => ({ name: fu.customerName, note: fu.reason, type: 'followup' })),
                   ...callsDueToday.map(cl => ({ name: cl.customerName, note: cl.projectName, type: 'call' }))
                  ].slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                    <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-xs font-bold text-amber-600 flex-shrink-0">
                      {item.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{item.note}</p>
                    </div>
                    <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Hi ${item.name}, just checking in!`)}`, '_blank')}
                      className="w-7 h-7 rounded-full bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors">
                      <MessageSquare size={12} className="text-green-600" />
                    </button>
                  </div>
                ))
              }
            </div>
          </Section>
        </div>

        {/* ── Lead Funnel chart ── */}
        <Section className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center">
              <TrendingUp size={13} className="text-orange-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Lead Funnel</h3>
            <button className="ml-auto text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={11} />
            </button>
          </div>
          {leads.length === 0
            ? <p className="text-xs text-slate-400 py-8 text-center">No leads yet — add leads to see your funnel</p>
            : (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={funnelData} layout="vertical" barCategoryGap="35%">
                  <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="stage" fontSize={11} tickLine={false} axisLine={false} width={88} tick={{ fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: 12 }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="count" fill="#E87722" radius={[0, 6, 6, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </Section>

      </div>
    </DashboardLayout>
  );
};

export default CPOverview;