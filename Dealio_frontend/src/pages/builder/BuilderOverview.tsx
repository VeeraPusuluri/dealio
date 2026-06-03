import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore, roleColors } from '@/stores/useAuthStore';
import { builderApi } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import {
  Building2, TrendingUp, DollarSign, Users, Plus, Loader2,
  Sun, Sunset, Moon, ArrowUpRight, Layers, Briefcase,
  BarChart3, Calendar, Shield, FileText, Megaphone,
  ChevronRight, Sparkles, Target,
} from 'lucide-react';

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', Icon: Sun };
  if (h < 17) return { text: 'Good afternoon', Icon: Sunset };
  return { text: 'Good evening', Icon: Moon };
}

function formatDate() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

interface ApiDeal { id: number; status: string; dealValue: number | null; }

const QUICK_ACTIONS = [
  { label: 'New Project',    path: '/builder/projects/new',    icon: Plus,        color: '#0A7E8C' },
  { label: 'Unit Matrix',    path: '/builder/units',            icon: Layers,      color: '#7C3AED' },
  { label: 'View Leads',     path: '/builder/leads',            icon: Users,       color: '#2563EB' },
  { label: 'CP Performance', path: '/builder/cp-performance',  icon: BarChart3,   color: '#0A7E8C' },
  { label: 'Analytics',      path: '/builder/analytics',        icon: BarChart3,   color: '#D97706' },
  { label: 'Broadcast',      path: '/builder/broadcast',        icon: Megaphone,   color: '#E87722' },
  { label: 'RERA',           path: '/builder/rera',             icon: Shield,      color: '#16A34A' },
];

const BuilderOverview = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ projects: 0, deals: 0, booked: 0, revenue: 0, leads: 0 });
  const greeting = timeGreeting();
  const displayName = user?.name?.split(' ')[0] || 'Builder';
  const color = user ? roleColors[user.role] || '#0A7E8C' : '#0A7E8C';
  const initials = (user?.name || 'B').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const email = user.email || `uid${user.id}@dealio.builder`;
        const builderData = await builderApi.ensureBuilder(user.name, email, user.phone, user.id) as { builderId: number };
        const builderId = String(builderData.builderId);
        builderApi.setCachedBuilderId(builderId);
        const [projects, leads, deals] = await Promise.all([
          builderApi.getProjects(builderId) as Promise<unknown[]>,
          builderApi.getBuilderLeads(builderId) as Promise<unknown[]>,
          builderApi.getBuilderDeals(builderId) as Promise<ApiDeal[]>,
        ]);
        const bookedDeals = (deals || []).filter(d =>
          ['BOOKED', 'CLOSED', 'Booked', 'Closed'].includes(d.status),
        );
        setStats({
          projects: (projects || []).length,
          deals: (deals || []).length,
          booked: bookedDeals.length,
          revenue: bookedDeals.reduce((s, d) => s + (Number(d.dealValue) || 0), 0),
          leads: (leads || []).length,
        });
      } catch { /* stats stay at 0 */ }
      finally { setLoading(false); }
    })();
  }, [user?.id]);

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center py-24">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-4">

        {/* ── Hero banner ── */}
        <div
          className="relative rounded-2xl overflow-hidden border border-border"
          style={{ background: `linear-gradient(135deg, ${color}18 0%, ${color}06 60%, transparent 100%)` }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-[0.06]" style={{ backgroundColor: color }} />
          <div className="absolute -bottom-12 right-24 w-56 h-56 rounded-full opacity-[0.04]" style={{ backgroundColor: color }} />

          <div className="relative px-6 py-5 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${color}, ${color}bb)`,
                  boxShadow: `0 4px 16px ${color}40`,
                }}
              >
                {initials}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] flex items-center gap-1.5"
                   style={{ color }}>
                  <greeting.Icon size={11} /> {greeting.text}
                </p>
                <h1 className="text-xl font-bold text-foreground mt-0.5">{displayName}</h1>
                <p className="text-[12px] text-muted-foreground mt-0.5">{formatDate()}</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => navigate('/builder/projects')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold border border-border bg-card text-foreground hover:bg-muted transition-colors"
              >
                <Building2 size={13} /> Projects
              </button>
              <button
                onClick={() => navigate('/builder/projects/new')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-all"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
              >
                <Plus size={13} /> New Project
              </button>
            </div>
          </div>
        </div>

        {stats.projects === 0 ? (
          /* ── Empty state ── */
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-16 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                 style={{ backgroundColor: `${color}15` }}>
              <Building2 size={28} style={{ color }} />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">Add your first project</h2>
            <p className="text-[13px] text-muted-foreground mb-6 max-w-sm mx-auto">
              Units, leads, and revenue will appear here once you've added your first project.
            </p>
            <button
              onClick={() => navigate('/builder/projects/new')}
              className="px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white inline-flex items-center gap-2 hover:opacity-90 transition-all"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
            >
              <Plus size={15} /> Add your first project
            </button>
          </div>
        ) : (
          <>
            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  label: 'Active Projects',
                  value: stats.projects,
                  icon: Building2,
                  color: '#0A7E8C',
                  bg: '#F0FDFA',
                  path: '/builder/projects',
                },
                {
                  label: 'Total Leads',
                  value: stats.leads,
                  icon: Users,
                  color: '#2563EB',
                  bg: '#EFF6FF',
                  path: '/builder/leads',
                },
                {
                  label: 'Deals Booked',
                  value: stats.booked,
                  icon: Briefcase,
                  color: '#16A34A',
                  bg: '#F0FDF4',
                  path: '/builder/deals',
                },
                {
                  label: 'Revenue Booked',
                  value: formatCurrency(stats.revenue),
                  icon: DollarSign,
                  color: '#D97706',
                  bg: '#FFFBEB',
                  path: undefined,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  onClick={stat.path ? () => navigate(stat.path!) : undefined}
                  className={`group rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 transition-all ${
                    stat.path ? 'cursor-pointer hover:shadow-sm hover:border-border/80' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: stat.bg, color: stat.color }}
                    >
                      <stat.icon size={16} />
                    </div>
                    {stat.path && (
                      <ArrowUpRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-0.5 leading-tight">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Pipeline health ── */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                    <Target size={14} style={{ color }} />
                  </div>
                  <h3 className="text-[13px] font-semibold text-foreground">Pipeline Health</h3>
                </div>
                <button
                  onClick={() => navigate('/builder/deals')}
                  className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  View all <ChevronRight size={13} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Open Deals', value: stats.deals - stats.booked, color: '#2563EB', desc: 'in progress' },
                  { label: 'Booked',     value: stats.booked,                color: '#16A34A', desc: 'confirmed' },
                  { label: 'Conversion', value: stats.deals > 0 ? `${Math.round((stats.booked / stats.deals) * 100)}%` : '—', color, desc: 'book rate' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-muted/40 p-3.5 text-center">
                    <p className="text-xl font-black leading-none" style={{ color: item.color }}>{item.value}</p>
                    <p className="text-[11px] font-medium text-foreground mt-1">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>

              {stats.deals > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-muted-foreground">Booking rate</span>
                    <span className="text-[11px] font-semibold text-foreground">
                      {stats.booked}/{stats.deals} deals
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.round((stats.booked / stats.deals) * 100)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Quick actions ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={13} className="text-muted-foreground" />
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 hover:shadow-sm hover:border-border/80 transition-all"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${action.color}12`, color: action.color }}
                    >
                      <action.icon size={16} />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Info strip ── */}
            <div className="rounded-2xl border border-border bg-muted/20 px-5 py-3.5 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
                <TrendingUp size={13} style={{ color }} />
              </div>
              <p className="text-[13px] text-muted-foreground flex-1">
                <span className="font-semibold text-foreground">{stats.projects} project{stats.projects !== 1 ? 's' : ''}</span> active
                {stats.leads > 0 && <> · <span className="font-semibold text-foreground">{stats.leads} lead{stats.leads !== 1 ? 's' : ''}</span> across all projects</>}
                {stats.revenue > 0 && <> · <span className="font-semibold text-foreground">{formatCurrency(stats.revenue)}</span> revenue booked</>}
              </p>
              <button
                onClick={() => navigate('/builder/analytics')}
                className="flex items-center gap-1 text-[12px] font-medium hover:text-foreground transition-colors flex-shrink-0"
                style={{ color }}
              >
                Full analytics <ChevronRight size={12} />
              </button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BuilderOverview;