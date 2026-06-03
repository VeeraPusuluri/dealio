import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminApi } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, Clock, BarChart3, Download, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { toast } from 'sonner';

const RANGE_OPTIONS = [
  { label: 'This Month',     value: 'this_month' },
  { label: 'Last 3 Months',  value: 'last_3_months' },
  { label: 'Last 6 Months',  value: 'last_6_months' },
  { label: 'This Year',      value: 'this_year' },
];

const fmtCr = (n: number) => {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

interface RevenueData {
  kpis: { totalGmv: number; totalDeals: number; pendingPayout: number; avgDealSize: number };
  trendData: { month: string; gmv: number; deals: number; revenue: number }[];
  revenueByCity: { city: string; revenue: number }[];
  revenueByTier: { name: string; value: number; color: string }[];
  topProjects: { name: string; revenue: number }[];
  funnel: { name: string; value: number; fill: string }[];
  breakdown: { builder: string; project: string; unitsSold: number; gmv: number; cpCommission: number; netRevenue: number; pendingPayout: number }[];
}

const AdminRevenue = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState('this_month');
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.getRevenueStats(range) as RevenueData;
      setData(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const exportCSV = () => {
    if (!data?.breakdown.length) return;
    const hdr = 'Builder,Project,Units Sold,GMV,CP Commission,Net Revenue\n';
    const rows = data.breakdown.map(r =>
      `"${r.builder}","${r.project}",${r.unitsSold},${r.gmv},${r.cpCommission},${r.netRevenue}`
    ).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([hdr + rows], { type: 'text/csv' }));
    a.download = `revenue-${range}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header / filter bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/admin')} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Back to Overview">
              <ArrowLeft size={15} className="text-muted-foreground" />
            </button>
            {RANGE_OPTIONS.map(r => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${range === r.value ? 'bg-[#6B3FA0] text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button onClick={load} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Refresh">
            <RefreshCw size={14} className={`text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-20">
            <p className="text-sm text-destructive">{error}</p>
            <button onClick={load} className="px-4 py-2 rounded-lg bg-muted text-sm hover:bg-muted/80">Retry</button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Total GMV',          value: fmtCr(data.kpis.totalGmv),      icon: DollarSign, color: '#6B3FA0' },
                { title: 'Total Deals',        value: data.kpis.totalDeals,            icon: TrendingUp, color: '#16A34A' },
                { title: 'Pending Payout',     value: fmtCr(data.kpis.pendingPayout),  icon: Clock,      color: '#F59E0B' },
                { title: 'Avg Deal Size',      value: fmtCr(data.kpis.avgDealSize),    icon: BarChart3,  color: '#0A7E8C' },
              ].map(c => (
                <div key={c.title} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${c.color}18`, color: c.color }}>
                    <c.icon size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium">{c.title}</p>
                    <p className="text-xl font-bold text-card-foreground">{c.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Row 1 — GMV trend + Revenue by City */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg p-5 border border-border">
                <h3 className="font-semibold text-card-foreground mb-4">GMV by Month (Cr)</h3>
                {data.trendData.length === 0 ? (
                  <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No data for this period</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.trendData}>
                      <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(v: number) => [`₹${v}Cr`, 'GMV']} />
                      <Bar dataKey="gmv" fill="#0D9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-card rounded-lg p-5 border border-border">
                <h3 className="font-semibold text-card-foreground mb-4">Revenue by City (Cr)</h3>
                {data.revenueByCity.length === 0 ? (
                  <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No data for this period</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.revenueByCity} layout="vertical">
                      <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="city" fontSize={11} tickLine={false} axisLine={false} width={80} />
                      <Tooltip formatter={(v: number) => [`₹${v}Cr`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#6B3FA0" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Charts Row 2 — CP Tier + Top Projects */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg p-5 border border-border">
                <h3 className="font-semibold text-card-foreground mb-4">Revenue by CP Tier</h3>
                {data.revenueByTier.length === 0 ? (
                  <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No data for this period</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={data.revenueByTier} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={2}>
                          {data.revenueByTier.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`${v}%`, 'Share']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-2 flex-wrap">
                      {data.revenueByTier.map(t => (
                        <span key={t.name} className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                          {t.name} ({t.value}%)
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="bg-card rounded-lg p-5 border border-border">
                <h3 className="font-semibold text-card-foreground mb-4">Top Projects by Revenue (Cr)</h3>
                {data.topProjects.length === 0 ? (
                  <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No data for this period</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.topProjects} layout="vertical">
                      <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" fontSize={10} tickLine={false} axisLine={false} width={120} />
                      <Tooltip formatter={(v: number) => [`₹${v}Cr`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#E87722" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Charts Row 3 — Deal Trend + Funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg p-5 border border-border">
                <h3 className="font-semibold text-card-foreground mb-4">Deal Volume vs Revenue Trend</h3>
                {data.trendData.length === 0 ? (
                  <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No data for this period</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={data.trendData}>
                        <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Line yAxisId="left" type="monotone" dataKey="deals" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} name="Deals" />
                        <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#6B3FA0" strokeWidth={2} dot={{ r: 3 }} name="Revenue (Cr)" />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Deals</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-600" />Revenue (Cr)</span>
                    </div>
                  </>
                )}
              </div>

              <div className="bg-card rounded-lg p-5 border border-border">
                <h3 className="font-semibold text-card-foreground mb-4">Conversion Funnel</h3>
                {data.funnel[0]?.value === 0 ? (
                  <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No data for this period</div>
                ) : (
                  <div className="space-y-3 mt-4">
                    {data.funnel.map((f, i) => (
                      <div key={f.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-card-foreground">{f.name}</span>
                          <span className="text-sm text-muted-foreground">{f.value.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-6">
                          <div
                            className="h-6 rounded-full flex items-center justify-end pr-2 min-w-[2rem]"
                            style={{ width: `${data.funnel[0].value > 0 ? Math.max((f.value / data.funnel[0].value) * 100, 4) : 4}%`, backgroundColor: f.fill }}
                          >
                            <span className="text-[10px] text-white font-semibold">
                              {data.funnel[0].value > 0 ? Math.round((f.value / data.funnel[0].value) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                        {i < data.funnel.length - 1 && f.value > 0 && (
                          <p className="text-[10px] text-muted-foreground text-right mt-0.5">
                            → {Math.round((data.funnel[i + 1].value / f.value) * 100)}% conversion
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Breakdown Table */}
            <div className="bg-card rounded-lg border border-border">
              <div className="p-5 flex items-center justify-between border-b border-border">
                <h3 className="font-semibold text-card-foreground">
                  Revenue Breakdown
                  <span className="ml-2 text-xs text-muted-foreground font-normal">{data.breakdown.length} projects</span>
                </h3>
                <button
                  onClick={exportCSV}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#6B3FA0] text-white flex items-center gap-2 hover:bg-[#5a3487] transition-colors"
                >
                  <Download size={14} /> Export CSV
                </button>
              </div>

              {data.breakdown.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                  No deals in the selected period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border">
                        <th className="px-4 py-3 font-medium">Builder</th>
                        <th className="px-4 py-3 font-medium">Project</th>
                        <th className="px-4 py-3 font-medium text-right">Units Sold</th>
                        <th className="px-4 py-3 font-medium text-right">GMV</th>
                        <th className="px-4 py-3 font-medium text-right">CP Commission</th>
                        <th className="px-4 py-3 font-medium text-right">Net Revenue</th>
                        <th className="px-4 py-3 font-medium text-right">Pending Payout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.breakdown.map((r, i) => (
                        <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 text-card-foreground font-medium">{r.builder}</td>
                          <td className="px-4 py-3 text-muted-foreground">{r.project}</td>
                          <td className="px-4 py-3 text-right text-card-foreground">{r.unitsSold}</td>
                          <td className="px-4 py-3 text-right text-card-foreground font-medium">{formatCurrency(r.gmv)}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(r.cpCommission)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-card-foreground">{formatCurrency(r.netRevenue)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={r.pendingPayout > 0 ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
                              {formatCurrency(r.pendingPayout)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {/* Totals row */}
                      <tr className="border-t-2 border-border bg-muted/20 font-semibold">
                        <td className="px-4 py-3 text-card-foreground" colSpan={2}>Total</td>
                        <td className="px-4 py-3 text-right text-card-foreground">{data.breakdown.reduce((s, r) => s + r.unitsSold, 0)}</td>
                        <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(data.kpis.totalGmv)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(data.breakdown.reduce((s, r) => s + r.cpCommission, 0))}</td>
                        <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(data.breakdown.reduce((s, r) => s + r.netRevenue, 0))}</td>
                        <td className="px-4 py-3 text-right text-amber-600">{formatCurrency(data.kpis.pendingPayout)}</td>
                      </tr>
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

export default AdminRevenue;
