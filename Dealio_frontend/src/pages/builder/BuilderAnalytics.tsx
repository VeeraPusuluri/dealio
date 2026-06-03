import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { builderApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, IndianRupee, Building2, Download, Loader2 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ApiLead {
  id: string;
  cpId: string;
  cpName: string;
  projectName: string;
  stage: string;
  dealValue: number;
  commissionAmount: number;
  commissionStatus: string;
  createdAt: string;
}

interface ApiProject {
  id: number;
  name: string;
  totalUnits?: number | null;
  availableUnits?: number | null;
  bookedUnits?: number | null;
  soldUnits?: number | null;
}

type DateRange = 'week' | 'month' | 'quarter';

// ── Helpers ───────────────────────────────────────────────────────────────────
const BOOKING_STAGES = new Set(['Booked', 'Closed']);
const ENGAGED_STAGES = new Set(['Meeting Done', 'Negotiation', 'Booked', 'Closed']);

/**
 * Builds a bar-chart dataset of booking events grouped by time bucket.
 * week   → 7 daily   buckets (D1…D7)
 * month  → 4 weekly  buckets (W1…W4)
 * quarter→ 13 weekly buckets (W1…W13)
 */
function computeVelocity(
  leads: ApiLead[],
  projectName: string,
  range: DateRange,
): { label: string; units: number }[] {
  const now  = Date.now();
  const MS_D = 86_400_000;
  const MS_W = 7 * MS_D;

  const relevant = leads.filter(
    l => BOOKING_STAGES.has(l.stage) && l.projectName === projectName && l.createdAt,
  );

  if (range === 'week') {
    // daily buckets for the last 7 days
    return Array.from({ length: 7 }, (_, i) => {
      const dayStart = now - (6 - i) * MS_D;
      const dayEnd   = dayStart + MS_D;
      const d        = new Date(dayStart);
      return {
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        units: relevant.filter(l => {
          const t = new Date(l.createdAt).getTime();
          return t >= dayStart && t < dayEnd;
        }).length,
      };
    });
  }

  const weeks = range === 'month' ? 4 : 13;
  return Array.from({ length: weeks }, (_, i) => {
    const weekEnd   = now - (weeks - 1 - i) * MS_W;
    const weekStart = weekEnd - MS_W;
    return {
      label: `W${i + 1}`,
      units: relevant.filter(l => {
        const t = new Date(l.createdAt).getTime();
        return t >= weekStart && t < weekEnd;
      }).length,
    };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
const BuilderAnalytics = () => {
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [leads, setLeads]           = useState<ApiLead[]>([]);
  const [apiProjects, setApiProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading]       = useState(true);
  const [velocityProject, setVelocityProject] = useState('');
  const builderId = useRef('');

  // ── Fetch real data ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        let bid = builderApi.getCachedBuilderId();
        if (!bid) {
          const email = user.email || `uid${user.id}@dealio.builder`;
          const bd = await builderApi.ensureBuilder(user.name, email, user.phone, user.id) as { builderId: number };
          bid = String(bd.builderId);
          builderApi.setCachedBuilderId(bid);
        }
        builderId.current = bid;

        const [leadsData, projectsData] = await Promise.all([
          builderApi.getBuilderLeads(bid) as Promise<ApiLead[]>,
          builderApi.getProjects(bid)     as Promise<ApiProject[]>,
        ]);

        const ls = Array.isArray(leadsData)    ? leadsData    : [];
        const ps = Array.isArray(projectsData) ? projectsData : [];
        setLeads(ls);
        setApiProjects(ps);
        if (ps.length > 0) setVelocityProject(ps[0].name);
      } catch {
        // silently fall through — charts render empty state
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived metrics (real) ─────────────────────────────────────────────────
  const bookedLeads  = leads.filter(l => BOOKING_STAGES.has(l.stage));
  const totalBookings = bookedLeads.length;
  const totalRevenue  = bookedLeads.reduce((s, l) => s + (l.dealValue ?? 0), 0);
  const avgDeal       = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  const activeCPs     = new Set(leads.map(l => l.cpId).filter(Boolean)).size;

  const funnelData = [
    { name: 'Enquiries',    value: leads.length,                                                       fill: 'hsl(var(--primary))' },
    { name: 'Site Visits',  value: leads.filter(l => ENGAGED_STAGES.has(l.stage)).length,              fill: '#6366F1' },
    { name: 'Meetings Held',value: leads.filter(l => ENGAGED_STAGES.has(l.stage)).length,              fill: '#8B5CF6' },
    { name: 'Negotiations', value: leads.filter(l => new Set(['Negotiation','Booked','Closed']).has(l.stage)).length, fill: '#F59E0B' },
    { name: 'Bookings',     value: bookedLeads.length,                                                 fill: '#10B981' },
    { name: 'Registrations',value: leads.filter(l => l.stage === 'Closed').length,                     fill: '#16A34A' },
  ];

  // CP performance aggregated from real leads
  const cpMap = new Map<string, { name: string; leads: number; visits: number; bookings: number; commission: number }>();
  for (const l of leads) {
    if (!l.cpName) continue;
    const entry = cpMap.get(l.cpId) ?? { name: l.cpName, leads: 0, visits: 0, bookings: 0, commission: 0 };
    entry.leads++;
    if (ENGAGED_STAGES.has(l.stage)) entry.visits++;
    if (BOOKING_STAGES.has(l.stage)) { entry.bookings++; entry.commission += l.commissionAmount ?? 0; }
    cpMap.set(l.cpId, entry);
  }
  const cpPerf = [...cpMap.values()]
    .map(cp => ({ ...cp, conversion: cp.leads > 0 ? ((cp.bookings / cp.leads) * 100).toFixed(1) : '0' }))
    .sort((a, b) => b.bookings - a.bookings);

  // ── Unit velocity (real) ───────────────────────────────────────────────────
  const velocityData = computeVelocity(leads, velocityProject, dateRange);
  const totalVelocityUnits = velocityData.reduce((s, d) => s + d.units, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="la-banner px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Builder Analytics</h2>
          <div className="flex gap-1.5">
            {(['week', 'month', 'quarter'] as DateRange[]).map(r => (
              <button key={r} onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${dateRange === r ? 'bg-teal-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:border-teal-200'}`}>
                {r === 'week' ? 'This Week' : r === 'month' ? 'This Month' : 'This Quarter'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-slate-300" /></div>
        ) : (
          <>
            {/* ── KPI row ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Bookings', value: totalBookings,                                icon: Building2,   color: '#0A7E8C' },
                { label: 'Revenue Booked', value: `₹${(totalRevenue / 10_000_000).toFixed(1)}Cr`, icon: IndianRupee, color: '#16A34A' },
                { label: 'Avg Deal Value', value: `₹${(avgDeal / 100_000).toFixed(0)}L`,          icon: TrendingUp,  color: '#D97706' },
                { label: 'Active CPs',     value: activeCPs,                                   icon: Users,       color: '#2563EB' },
              ].map(s => (
                <div key={s.label} className="la-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}18`, color: s.color }}>
                      <s.icon size={15} />
                    </div>
                    <span className="text-xs text-slate-400">{s.label}</span>
                  </div>
                  <p className="text-xl font-bold text-slate-800">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ── Deal Funnel ── */}
              <div className="la-card p-5">
                <h3 className="font-semibold text-slate-700 mb-4">Deal Funnel</h3>
                <div className="space-y-2">
                  {funnelData.map((d, i) => {
                    const maxVal = funnelData[0].value || 1;
                    const pct     = ((d.value / maxVal) * 100).toFixed(0);
                    const convPct = i > 0 && funnelData[i - 1].value > 0 ? ((d.value / funnelData[i - 1].value) * 100).toFixed(0) : '100';
                    return (
                      <div key={d.name} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-24 text-right">{d.name}</span>
                        <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                          <div className="h-full rounded-lg transition-all" style={{ width: `${pct}%`, backgroundColor: d.fill }} />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-card-foreground">{d.value}</span>
                        </div>
                        {i > 0 && <span className="text-[10px] text-muted-foreground w-10">{convPct}%</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Unit Velocity ── */}
              <div className="la-card p-5">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h3 className="font-semibold text-slate-700">Unit Velocity</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {totalVelocityUnits} booking{totalVelocityUnits !== 1 ? 's' : ''} ·{' '}
                      {dateRange === 'week' ? 'last 7 days' : dateRange === 'month' ? 'last 4 weeks' : 'last 13 weeks'}
                    </p>
                  </div>
                  <select
                    value={velocityProject}
                    onChange={e => setVelocityProject(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm">
                    {apiProjects.length === 0
                      ? <option value="">No projects</option>
                      : apiProjects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)
                    }
                  </select>
                </div>

                {velocityData.every(d => d.units === 0) ? (
                  <div className="flex flex-col items-center justify-center h-[220px] text-slate-400">
                    <Building2 size={28} className="mb-2 text-slate-200" />
                    <p className="text-[12px]">No bookings recorded for this period</p>
                    <p className="text-[11px] mt-1 text-slate-300">Bookings will appear here as leads are converted</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={velocityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        formatter={(v: number) => [v, 'Bookings']}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                      />
                      <Bar dataKey="units" fill="#0d9488" radius={[4, 4, 0, 0]} name="Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── CP Performance ── */}
            <div className="la-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">CP Performance</h3>
                <button
                  onClick={() => {
                    const rows = ['CP Name,Leads,Visits,Bookings,Conv %,Commission', ...cpPerf.map(c =>
                      `${c.name},${c.leads},${c.visits},${c.bookings},${c.conversion}%,${c.commission}`)].join('\n');
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
                    a.download = 'cp-performance.csv'; a.click();
                  }}
                  className="text-xs text-teal-600 flex items-center gap-1 hover:underline">
                  <Download size={12} /> Export CSV
                </button>
              </div>
              {cpPerf.length === 0 ? (
                <p className="text-[12px] text-slate-400 py-4 text-center">No CP activity yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-slate-100 bg-slate-50/60">
                        <th className="px-3 py-2.5 font-medium rounded-tl-lg">CP Name</th>
                        <th className="px-3 py-2.5 font-medium text-right">Leads</th>
                        <th className="px-3 py-2.5 font-medium text-right">Visits</th>
                        <th className="px-3 py-2.5 font-medium text-right">Bookings</th>
                        <th className="px-3 py-2.5 font-medium text-right">Conv %</th>
                        <th className="px-3 py-2.5 font-medium text-right rounded-tr-lg">Commission (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cpPerf.map(cp => (
                        <tr key={cp.name} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                          <td className="px-3 py-2.5 font-medium text-slate-800">{cp.name}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600">{cp.leads}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600">{cp.visits}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600">{cp.bookings}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600">{cp.conversion}%</td>
                          <td className="px-3 py-2.5 text-right text-teal-600 font-medium">₹{cp.commission.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Project-wise Status ── */}
            <div className="la-card p-5">
              <h3 className="font-semibold text-slate-700 mb-4">Project-wise Status</h3>
              {apiProjects.length === 0 ? (
                <p className="text-[12px] text-slate-400 py-4 text-center">No projects found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-slate-100 bg-slate-50/60">
                        <th className="px-3 py-2.5 font-medium rounded-tl-lg">Project</th>
                        <th className="px-3 py-2.5 font-medium text-right">Total</th>
                        <th className="px-3 py-2.5 font-medium text-right">Available</th>
                        <th className="px-3 py-2.5 font-medium text-right">Booked</th>
                        <th className="px-3 py-2.5 font-medium text-right">Sold</th>
                        <th className="px-3 py-2.5 font-medium rounded-tr-lg">% Sold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiProjects.map(p => {
                        const total  = p.totalUnits     ?? 0;
                        const avail  = p.availableUnits ?? 0;
                        const booked = p.bookedUnits    ?? 0;
                        const sold   = p.soldUnits      ?? 0;
                        const pctSold = total > 0 ? ((sold / total) * 100).toFixed(0) : '0';
                        return (
                          <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                            <td className="px-3 py-2.5 font-medium text-slate-800">{p.name}</td>
                            <td className="px-3 py-2.5 text-right text-slate-600">{total || '—'}</td>
                            <td className="px-3 py-2.5 text-right text-emerald-600">{avail || '—'}</td>
                            <td className="px-3 py-2.5 text-right text-amber-600">{booked || '—'}</td>
                            <td className="px-3 py-2.5 text-right text-red-500">{sold || '—'}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pctSold}%` }} />
                                </div>
                                <span className="text-xs text-slate-400 w-8">{pctSold}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BuilderAnalytics;
