import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { formatCurrency } from '@/lib/format';
import { cpApi } from '@/lib/api';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useCommissionStore } from '@/stores/useCommissionStore';

interface CPLead {
  id: number;
  projectId: number;
  projectName: string;
  builderId?: number | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  dealValue?: number | null;
  status: string;
  commissionStatus: string;
  commissionPercent?: number | null;
  estimatedCommission?: number | null;
  createdAt: string;
}
import {
  Users, Calendar, Handshake, TrendingUp,
  Phone, MessageSquare, Clock, Flame,
  ArrowRight, Sparkles, Plus, Send,
  FileText, Star, ChevronRight, Activity,
  CheckCircle2, AlertCircle, Zap,
} from 'lucide-react';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:       '#0F1117',
  bg2:      '#1A1D27',
  surface:  '#22263A',
  border:   '#2E3248',
  orange:   '#F5821F',
  orangeL:  '#FFA552',
  teal:     '#0EA5E9',
  green:    '#22C55E',
  violet:   '#A78BFA',
  amber:    '#FBBF24',
  ink:      '#F1F5F9',
  ink2:     '#CBD5E1',
  muted:    '#64748B',
};

const TIER_META: Record<string, { label: string; color: string; glow: string; icon: string }> = {
  Platinum: { label: 'Platinum',  color: '#A78BFA', glow: 'rgba(167,139,250,0.25)', icon: '◈' },
  Gold:     { label: 'Gold',      color: '#FBBF24', glow: 'rgba(251,191,36,0.25)',  icon: '◆' },
  Silver:   { label: 'Silver',    color: '#94A3B8', glow: 'rgba(148,163,184,0.2)',  icon: '◇' },
};

const FUNNEL_COLORS = ['#F5821F', '#FB923C', '#FCA663', '#FCD19C', '#FDEECB'];

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function Avatar({ name, size = 44, color = C.orange }: { name: string; size?: number; color?: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: `linear-gradient(135deg, ${color} 0%, ${color}aa 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: size * 0.38, flexShrink: 0, boxShadow: `0 4px 14px ${color}44` }}>
      {name?.[0]?.toUpperCase() ?? 'C'}
    </div>
  );
}

function Pill({ children, color = C.orange }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 999, padding: '3px 10px' }}>
      {children}
    </span>
  );
}

function Card({ children, style = {}, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 18, border: '1px solid #F1F5F9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.15s, transform 0.15s', ...style }}
      onMouseEnter={e => { if (onClick) { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; } }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>
      {children}
    </div>
  );
}

function CardHeader({ icon, title, sub, accent = '#F5821F' }: { icon: React.ReactNode; title: string; sub?: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 20px 14px' }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: `${accent}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
const CPOverview = () => {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [leads, setLeads] = useState<CPLead[]>([]);
  const [todayTasks, setTodayTasks] = useState<{ name: string; project: string; note: string; time?: string; type: 'followup' | 'call' }[]>([]);
  const { commissions } = useCommissionStore();
  const { addNotification } = useNotificationStore();

  const [tier, setTier] = useState<string>('Silver');

  useEffect(() => {
    if (!user?.id) return;
    cpApi.getLeads(user.id)
      .then((data: any) => setLeads((data as CPLead[]) ?? []))
      .catch(() => {});
    cpApi.getProfile(user.id)
      .then((data: any) => { if (data?.cp?.tier) setTier(data.cp.tier); })
      .catch(() => {});
    cpApi.getNotifications()
      .then((data: any) => {
        (data as { title: string; message: string; type: string; link?: string }[] || [])
          .forEach(n => addNotification({ type: n.type as 'info' | 'success' | 'error' | 'warning', title: n.title, message: n.message, link: n.link }));
      })
      .catch(() => {});
    cpApi.getDueToday(user.id)
      .then((data: any) => {
        const { followUps = [], callLogs = [] } = data as {
          followUps: { customerName: string; projectName: string; reason: string; dueTime?: string }[];
          callLogs:  { customerName: string; projectName: string; outcome: string }[];
        };
        setTodayTasks([
          ...followUps.map(f => ({
            name:    f.customerName,
            project: f.projectName,
            note:    f.reason,
            time:    f.dueTime ?? undefined,
            type:    'followup' as const,
          })),
          ...callLogs.map(c => ({
            name:    c.customerName,
            project: c.projectName,
            note:    c.outcome ? `Last call: ${c.outcome}` : c.projectName,
            type:    'call' as const,
          })),
        ].slice(0, 5));
      })
      .catch(() => {});
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived metrics ────────────────────────────────────────────────────────
  const meetingStatuses = ['Meeting Requested', 'Meeting Confirmed', 'Meeting Done'];
  const activeLeads   = leads.filter(l => !['Booked', 'Closed'].includes(l.status)).length;
  const meetingsCount = leads.filter(l => meetingStatuses.includes(l.status)).length;
  const closedCount   = leads.filter(l => l.status === 'Closed').length;

  const hotLeads = leads
    .filter(l => ['Agreement', 'Negotiation', 'Meeting Done', 'Booked'].includes(l.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const funnelData = [
    { stage: 'New',          count: leads.filter(l => l.status === 'New Lead').length },
    { stage: 'Meetings',     count: leads.filter(l => meetingStatuses.includes(l.status)).length },
    { stage: 'Negotiation',  count: leads.filter(l => l.status === 'Negotiation').length },
    { stage: 'Booked',       count: leads.filter(l => l.status === 'Booked').length },
    { stage: 'Closed',       count: leads.filter(l => l.status === 'Closed').length },
  ];

  const earnedCommissions = commissions.filter(c => c.status === 'Released');
  const totalEarned = earnedCommissions.reduce((s, c) => s + (c.amount ?? 0), 0);
  const pendingCommissions = commissions.filter(c => c.status === 'Pending' || c.status === 'Processing');
  const totalPending = pendingCommissions.reduce((s, c) => s + (c.amount ?? 0), 0);

  const tierMeta = TIER_META[tier] ?? TIER_META.Silver;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const conversionRate = leads.length > 0 ? Math.round((closedCount / leads.length) * 100) : 0;

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>

        {/* ══ HERO BANNER ═══════════════════════════════════════════════════════ */}
        <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F2027 100%)', borderRadius: 24, overflow: 'hidden', position: 'relative' }}>
          {/* Decorative glows */}
          <div style={{ position: 'absolute', top: -60, right: -40, width: 260, height: 260, borderRadius: '50%', background: `radial-gradient(circle, ${tierMeta.glow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: '30%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,130,31,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', padding: '28px 28px 0' }}>
            {/* Top row: greeting */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar name={user?.name ?? 'C'} size={52} color={tierMeta.color} />
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Sparkles size={10} style={{ color: C.orange }} /> {greeting}
                  </p>
                  <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F1F5F9', lineHeight: 1.1, margin: 0 }}>
                    {user?.name ?? 'Channel Partner'}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <Pill color={tierMeta.color}>
                      <span>{tierMeta.icon}</span> {tierMeta.label} Partner
                    </Pill>
                    {conversionRate > 0 && (
                      <Pill color={C.green}>
                        <Activity size={9} /> {conversionRate}% close rate
                      </Pill>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick actions — top right */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => navigate('/cp/leads')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.orange, color: '#fff', border: 'none', borderRadius: 12, padding: '9px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 14px ${C.orange}50`, whiteSpace: 'nowrap' }}>
                  <Plus size={13} /> Add Lead
                </button>
                <button onClick={() => navigate('/cp/whatsapp-broadcast')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', color: '#CBD5E1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '9px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <Send size={12} /> Broadcast
                </button>
              </div>
            </div>

            {/* KPI strip — dark tiles inside banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, background: 'rgba(255,255,255,0.06)', borderRadius: '14px 14px 0 0', overflow: 'hidden' }}>
              {[
                { label: 'Active Leads',    value: activeLeads,            fmt: String,          icon: <Users size={14} style={{ color: C.orange }} />,   accent: C.orange,  path: '/cp/leads'       },
                { label: 'Meetings',        value: meetingsCount,           fmt: String,          icon: <Calendar size={14} style={{ color: C.teal }} />,   accent: C.teal,    path: '/cp/leads'       },
                { label: 'Deals Closed',    value: closedCount,             fmt: String,          icon: <Handshake size={14} style={{ color: C.green }} />, accent: C.green,   path: '/cp/commissions' },
                { label: 'Earned',          value: totalEarned,             fmt: formatCurrency,  icon: <Star size={14} style={{ color: C.amber }} />,      accent: C.amber,   path: '/cp/commissions' },
                { label: 'Pending',         value: totalPending,            fmt: formatCurrency,  icon: <Clock size={14} style={{ color: C.violet }} />,    accent: C.violet,  path: '/cp/commissions' },
              ].map(({ label, value, fmt, icon, accent, path }) => (
                <button key={label} onClick={() => navigate(path)}
                  style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '16px 18px', background: 'rgba(255,255,255,0.04)', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {icon}
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {fmt === formatCurrency ? (value > 0 ? formatCurrency(value as number) : '—') : String(value)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ══ QUICK ACTION TILES ════════════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'My Leads',       icon: <Users size={18} />,       color: '#F5821F', bg: '#FFF7ED', path: '/cp/leads'       },
            { label: 'Projects',       icon: <FileText size={18} />,    color: '#0EA5E9', bg: '#F0F9FF', path: '/cp/projects'    },
            { label: 'Commissions',    icon: <TrendingUp size={18} />,  color: '#22C55E', bg: '#F0FDF4', path: '/cp/commissions' },
            { label: 'Follow-ups',     icon: <Zap size={18} />,         color: '#A78BFA', bg: '#F5F3FF', path: '/cp/followups'  },
          ].map(({ label, icon, color, bg, path }) => (
            <button key={label} onClick={() => navigate(path)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = color + '60'; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 14px ${color}18`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#F1F5F9'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                {icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{label}</div>
              </div>
              <ChevronRight size={14} style={{ color: '#CBD5E1', flexShrink: 0 }} />
            </button>
          ))}
        </div>

        {/* ══ HOT LEADS + TODAY'S TASKS ════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Hot Leads */}
          <Card>
            <CardHeader
              icon={<Flame size={15} style={{ color: '#EF4444' }} />}
              title="Hot Leads"
              sub={`${hotLeads.length} warm lead${hotLeads.length !== 1 ? 's' : ''}`}
              accent="#EF4444"
            />
            <div style={{ borderTop: '1px solid #F8FAFC' }}>
              {hotLeads.length === 0 ? (
                <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <Flame size={18} style={{ color: '#F97316' }} />
                  </div>
                  <p style={{ fontSize: 12.5, color: '#94A3B8', margin: 0 }}>No hot leads right now</p>
                  <p style={{ fontSize: 11, color: '#CBD5E1', margin: '4px 0 0' }}>Engage leads to raise their score</p>
                </div>
              ) : (
                <div>
                  {hotLeads.map((lead, i) => (
                    <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: i < hotLeads.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #FFF7ED, #FED7AA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#C2410C', flexShrink: 0 }}>
                        {lead.customerName[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.customerName}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{lead.projectName}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#F5821F', background: '#FFF7ED', borderRadius: 6, padding: '3px 8px', flexShrink: 0 }}>{lead.status}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => window.open(`tel:+91${lead.customerPhone}`, '_blank')}
                          style={{ width: 30, height: 30, borderRadius: 8, background: '#F0FDF4', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Phone size={12} style={{ color: '#16A34A' }} />
                        </button>
                        <button onClick={() => window.open(`https://wa.me/91${lead.customerPhone}`, '_blank')}
                          style={{ width: 30, height: 30, borderRadius: 8, background: '#F0FDF4', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <MessageSquare size={12} style={{ color: '#16A34A' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #F8FAFC' }}>
              <button onClick={() => navigate('/cp/leads')}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#F5821F', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                All leads <ArrowRight size={12} />
              </button>
            </div>
          </Card>

          {/* Today's Tasks */}
          <Card>
            <CardHeader
              icon={<Clock size={15} style={{ color: '#F59E0B' }} />}
              title="Due Today"
              sub={`${todayTasks.length} action${todayTasks.length !== 1 ? 's' : ''} pending`}
              accent="#F59E0B"
            />
            <div style={{ borderTop: '1px solid #F8FAFC' }}>
              {todayTasks.length === 0 ? (
                <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <CheckCircle2 size={18} style={{ color: '#22C55E' }} />
                  </div>
                  <p style={{ fontSize: 12.5, color: '#94A3B8', margin: 0 }}>All clear for today</p>
                  <p style={{ fontSize: 11, color: '#CBD5E1', margin: '4px 0 0' }}>No follow-ups due right now</p>
                </div>
              ) : (
                <div>
                  {todayTasks.map((task, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: i < todayTasks.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: task.type === 'call' ? '#F5821F' : '#A78BFA', flexShrink: 0, marginLeft: 4 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</div>
                          {task.time && (
                            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#F5821F', background: '#FFF7ED', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>{task.time}</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                          {task.project && <span style={{ fontWeight: 600 }}>{task.project}</span>}
                          {task.project && task.note ? ' · ' : ''}
                          {task.note}
                        </div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: task.type === 'call' ? '#F5821F' : '#A78BFA', background: task.type === 'call' ? '#FFF7ED' : '#F5F3FF', borderRadius: 6, padding: '3px 8px', flexShrink: 0 }}>
                        {task.type === 'call' ? 'Callback' : 'Follow-up'}
                      </span>
                      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Hi ${task.name}, just checking in!`)}`, '_blank')}
                        style={{ width: 30, height: 30, borderRadius: 8, background: '#F0FDF4', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MessageSquare size={12} style={{ color: '#16A34A' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #F8FAFC' }}>
              <button onClick={() => navigate('/cp/followups')}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#F5821F', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Manage follow-ups <ArrowRight size={12} />
              </button>
            </div>
          </Card>
        </div>

        {/* ══ PIPELINE + COMMISSION ════════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>

          {/* Pipeline funnel */}
          <Card>
            <CardHeader
              icon={<TrendingUp size={15} style={{ color: '#F5821F' }} />}
              title="Lead Pipeline"
              sub="Your current deal flow"
              accent="#F5821F"
            />
            <div style={{ borderTop: '1px solid #F8FAFC', padding: '8px 20px 20px' }}>
              {leads.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <AlertCircle size={28} style={{ color: '#E2E8F0', margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ fontSize: 12.5, color: '#94A3B8', margin: 0 }}>No leads yet — add your first lead to see pipeline</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={funnelData} layout="vertical" barCategoryGap="30%" margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                      <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8' }} allowDecimals={false} />
                      <YAxis type="category" dataKey="stage" fontSize={12} tickLine={false} axisLine={false} width={80} tick={{ fill: '#475569', fontWeight: 500 }} />
                      <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontSize: 12 }}
                        cursor={{ fill: '#F8FAFC' }}
                        formatter={(v: number) => [v, 'Leads']}
                      />
                      <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={20}>
                        {funnelData.map((_, i) => (
                          <Cell key={i} fill={FUNNEL_COLORS[i] ?? '#F5821F'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Mini legend */}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px solid #F8FAFC' }}>
                    {funnelData.filter(d => d.count > 0).map((d, i) => (
                      <div key={d.stage} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: FUNNEL_COLORS[i], flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: '#64748B' }}>{d.stage} <b style={{ color: '#0F172A' }}>{d.count}</b></span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Commission snapshot */}
          <Card>
            <CardHeader
              icon={<Star size={15} style={{ color: '#FBBF24' }} />}
              title="Commissions"
              sub="Earnings overview"
              accent="#FBBF24"
            />
            <div style={{ borderTop: '1px solid #F8FAFC' }}>
              {/* Earned */}
              <div style={{ padding: '18px 20px', borderBottom: '1px solid #F8FAFC' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 6 }}>Total Earned</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {totalEarned > 0 ? formatCurrency(totalEarned) : '—'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
                  <span style={{ fontSize: 11.5, color: '#64748B' }}>{earnedCommissions.length} released</span>
                </div>
              </div>

              {/* Pending */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F8FAFC' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 6 }}>Pending</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#F59E0B', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {totalPending > 0 ? formatCurrency(totalPending) : '—'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B' }} />
                  <span style={{ fontSize: 11.5, color: '#64748B' }}>{pendingCommissions.length} in progress</span>
                </div>
              </div>

              {/* Tier progress */}
              <div style={{ padding: '14px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#475569' }}>Tier: {tier}</span>
                  <span style={{ fontSize: 10.5, color: '#94A3B8' }}>{closedCount} deals closed</span>
                </div>
                <div style={{ height: 6, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (closedCount / (tier === 'Platinum' ? 50 : tier === 'Gold' ? 20 : 10)) * 100)}%`, background: `linear-gradient(90deg, ${tierMeta.color}, ${tierMeta.color}bb)`, borderRadius: 999, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 5 }}>
                  {tier === 'Platinum' ? 'Top tier — keep going!' : `${tier === 'Gold' ? 50 - closedCount : tier === 'Silver' ? 20 - closedCount : 10 - closedCount} more deals to next tier`}
                </div>
              </div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #F8FAFC' }}>
              <button onClick={() => navigate('/cp/commissions')}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#F5821F', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                View all commissions <ArrowRight size={12} />
              </button>
            </div>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default CPOverview;
