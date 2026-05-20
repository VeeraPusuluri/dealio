import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import { useAuthStore } from '@/stores/useAuthStore';
import { builderApi } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { Building2, TrendingUp, DollarSign, Users, Plus, Loader2, Sparkles, Sun, Sunset, Moon } from 'lucide-react';

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', Icon: Sun };
  if (h < 17) return { text: 'Good afternoon', Icon: Sunset };
  return { text: 'Good evening', Icon: Moon };
}

interface ApiDeal { id: number; status: string; dealValue: number | null; }

const BuilderOverview = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ projects: 0, deals: 0, booked: 0, revenue: 0, leads: 0 });
  const greeting = timeGreeting();
  const displayName = user?.name || 'Builder';

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

        const bookedDeals = (deals || []).filter(d => d.status === 'BOOKED' || d.status === 'CLOSED' || d.status === 'Booked' || d.status === 'Closed');
        const revenue = bookedDeals.reduce((s, d) => s + (Number(d.dealValue) || 0), 0);

        setStats({
          projects: (projects || []).length,
          deals: (deals || []).length,
          booked: bookedDeals.length,
          revenue,
          leads: (leads || []).length,
        });
      } catch {
        // stats stay at 0
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-teal-500" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Greeting ── */}
        <div className="pt-1 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary mb-1 flex items-center gap-1.5">
              <greeting.Icon size={12} /> {greeting.text}
            </p>
            <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Here's your business overview for today.</p>
          </div>
          <button
            onClick={() => navigate('/builder/projects/new')}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shadow-sm shrink-0"
            style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}
          >
            <Plus size={15} /> New Project
          </button>
        </div>

        {stats.projects === 0 ? (
          <div className="bg-gradient-to-br from-teal-50 to-white rounded-3xl p-14 text-center border-2 border-dashed border-teal-100">
            <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="text-teal-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Get started, {displayName}!
            </h2>
            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
              Get started by adding your first project. Once added, units, leads and revenue will show up here.
            </p>
            <button
              onClick={() => navigate('/builder/projects/new')}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-sm"
              style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}
            >
              <Plus size={16} /> Add your first project
            </button>
          </div>
        ) : (
          <>
            {/* Stats header banner */}
            <div className="la-banner px-5 py-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                <Sparkles size={15} className="text-teal-600" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Business at a glance</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Active Projects" value={stats.projects} icon={Building2} color="#0A7E8C" />
              <StatCard title="Total Leads" value={stats.leads} icon={Users} color="#2E5D8E" />
              <StatCard title="Deals Booked" value={stats.booked} icon={TrendingUp} color="#16A34A" />
              <StatCard title="Revenue Booked" value={formatCurrency(stats.revenue)} icon={DollarSign} color="#E87722" />
            </div>

            {/* Summary card */}
            <div className="la-card p-5 border border-gray-100">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                  <Users size={15} className="text-primary" />
                </div>
                <h3 className="font-semibold text-slate-700">Deals Summary</h3>
              </div>
              <p className="text-sm text-slate-500">
                {stats.deals} deal{stats.deals === 1 ? '' : 's'} across all projects
                <span className="mx-1.5 text-slate-300">·</span>
                <span className="font-medium text-slate-700">{stats.booked} booked</span>
              </p>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BuilderOverview;