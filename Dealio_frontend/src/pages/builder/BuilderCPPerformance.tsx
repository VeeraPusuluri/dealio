import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { builderApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  Users, TrendingUp, IndianRupee, Clock, CheckCircle2,
  Loader2, AlertCircle, Building2, X, ChevronRight,
} from 'lucide-react';

type CardKey = 'active-cps' | 'closed-deals' | 'total-commission' | 'pending-payouts';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Lead {
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

interface CPStats {
  cpId: string;
  cpName: string;
  totalLeads: number;
  closedDeals: number;
  totalDealValue: number;
  totalCommission: number;
  pendingCommission: number;
  releasedCommission: number;
  conversionRate: number;
  projects: Set<string>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtCr = (n: number) => {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const CLOSED_STAGES = new Set(['Booked', 'Closed', 'Negotiation']);

const tierColor = (i: number) =>
  i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#a16207' : '#64748b';

// ── Component ─────────────────────────────────────────────────────────────────
const BuilderCPPerformance = () => {
  const { user } = useAuthStore();
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [activeCard, setActiveCard] = useState<CardKey | null>(null);

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
        const data = await builderApi.getBuilderLeads(bid) as Lead[];
        setLeads(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Aggregate by CP ─────────────────────────────────────────────────────────
  const cpMap = new Map<string, CPStats>();

  leads.filter(l => l.cpId).forEach(l => {
    if (!cpMap.has(l.cpId)) {
      cpMap.set(l.cpId, {
        cpId: l.cpId, cpName: l.cpName || `CP ${l.cpId}`,
        totalLeads: 0, closedDeals: 0,
        totalDealValue: 0, totalCommission: 0,
        pendingCommission: 0, releasedCommission: 0,
        conversionRate: 0, projects: new Set(),
      });
    }
    const s = cpMap.get(l.cpId)!;
    s.totalLeads++;
    s.projects.add(l.projectName);
    if (CLOSED_STAGES.has(l.stage)) {
      s.closedDeals++;
      s.totalDealValue   += l.dealValue        ?? 0;
      s.totalCommission  += l.commissionAmount ?? 0;
      if (l.commissionStatus === 'Released') s.releasedCommission += l.commissionAmount ?? 0;
      else                                   s.pendingCommission  += l.commissionAmount ?? 0;
    }
  });

  const cpList = Array.from(cpMap.values())
    .map(s => ({ ...s, conversionRate: s.totalLeads ? Math.round((s.closedDeals / s.totalLeads) * 100) : 0 }))
    .sort((a, b) => b.closedDeals - a.closedDeals);

  const totalLeads      = leads.filter(l => l.cpId).length;
  const totalClosed     = cpList.reduce((s, c) => s + c.closedDeals, 0);
  const totalCommission = cpList.reduce((s, c) => s + c.totalCommission, 0);
  const totalPending    = cpList.reduce((s, c) => s + c.pendingCommission, 0);

  const chartData = cpList.slice(0, 8).map(c => ({
    name:   c.cpName.split(' ')[0],
    deals:  c.closedDeals,
    leads:  c.totalLeads,
    amount: c.totalCommission,
  }));

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-teal-500" />
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout>
      <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-6 mx-8 mt-8 text-red-600">
        <AlertCircle size={20} /> {error}
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="px-8 py-8 max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">CP Performance</h1>
          <p className="text-sm text-gray-400">
            {cpList.length} active channel partner{cpList.length !== 1 ? 's' : ''} · {totalLeads} total leads via CP
          </p>
        </div>

        {/* ── Summary cards (clickable) ── */}
        <div className="grid grid-cols-4 gap-4">
          {([
            { key: 'active-cps'        as CardKey, icon: <Users size={18} className="text-teal-600"/>,        bg: 'bg-teal-50',   label: 'Active CPs',          value: String(cpList.length) },
            { key: 'closed-deals'      as CardKey, icon: <TrendingUp size={18} className="text-blue-600"/>,   bg: 'bg-blue-50',   label: 'Closed via CPs',      value: String(totalClosed) },
            { key: 'total-commission'  as CardKey, icon: <IndianRupee size={18} className="text-amber-600"/>, bg: 'bg-amber-50',  label: 'Total CP Commission', value: fmtCr(totalCommission) },
            { key: 'pending-payouts'   as CardKey, icon: <Clock size={18} className="text-orange-600"/>,      bg: 'bg-orange-50', label: 'Pending Payouts',     value: fmtCr(totalPending) },
          ] as const).map(c => (
            <button key={c.key} type="button" onClick={() => setActiveCard(c.key)}
              className={`bg-white rounded-2xl border p-5 shadow-sm text-left transition-all cursor-pointer group hover:shadow-md hover:border-gray-200 ${activeCard === c.key ? 'border-teal-300 ring-2 ring-teal-100' : 'border-gray-100'}`}>
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>{c.icon}</div>
              <div className="text-xl font-bold text-gray-900">{c.value}</div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs text-gray-400">{c.label}</span>
                <ChevronRight size={12} className="text-gray-300 group-hover:text-gray-400 transition-colors"/>
              </div>
            </button>
          ))}
        </div>

        {cpList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Building2 size={28} className="text-gray-400"/>
            </div>
            <h3 className="font-semibold text-gray-700 mb-1">No CP activity yet</h3>
            <p className="text-sm text-gray-400">Channel partner leads will appear here once CPs share your projects.</p>
          </div>
        ) : (<>

          {/* ── Bar chart ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4 text-sm">Closed Deals by CP</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barGap={4}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }}/>
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: '#94a3b8' }}/>
                <Tooltip
                  formatter={(v: number, name: string) => [
                    name === 'amount' ? fmtCr(v) : v,
                    name === 'deals' ? 'Closed deals' : name === 'leads' ? 'Total leads' : 'Commission',
                  ]}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                />
                <Bar dataKey="deals" radius={[6,6,0,0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={i < 3 ? '#0A7E8C' : '#94a3b8'}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Leaderboard table ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 text-sm">CP Leaderboard</h2>
              <span className="text-xs text-gray-400">{cpList.length} partners</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs border-b border-gray-100 bg-gray-50/60">
                    <th className="px-6 py-3 font-semibold">#</th>
                    <th className="px-6 py-3 font-semibold">CP Name</th>
                    <th className="px-6 py-3 font-semibold text-center">Total Leads</th>
                    <th className="px-6 py-3 font-semibold text-center">Closed Deals</th>
                    <th className="px-6 py-3 font-semibold text-center">Conversion</th>
                    <th className="px-6 py-3 font-semibold text-right">Deal Value</th>
                    <th className="px-6 py-3 font-semibold text-right">Commission</th>
                    <th className="px-6 py-3 font-semibold text-right">Pending</th>
                    <th className="px-6 py-3 font-semibold text-center">Projects</th>
                  </tr>
                </thead>
                <tbody>
                  {cpList.map((cp, i) => (
                    <tr key={cp.cpId} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: tierColor(i) }}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-gray-800">{cp.cpName}</td>
                      <td className="px-6 py-3.5 text-center text-gray-600">{cp.totalLeads}</td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="font-bold text-gray-900">{cp.closedDeals}</span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${cp.conversionRate}%` }}/>
                          </div>
                          <span className="text-xs text-gray-500 tabular-nums">{cp.conversionRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right text-gray-700">{cp.totalDealValue ? fmtCr(cp.totalDealValue) : '—'}</td>
                      <td className="px-6 py-3.5 text-right font-semibold text-gray-800">{cp.totalCommission ? fmtCr(cp.totalCommission) : '—'}</td>
                      <td className="px-6 py-3.5 text-right">
                        {cp.pendingCommission > 0
                          ? <span className="text-amber-600 font-medium">{fmtCr(cp.pendingCommission)}</span>
                          : cp.releasedCommission > 0
                            ? <span className="flex items-center justify-end gap-1 text-emerald-600 text-xs"><CheckCircle2 size={11}/>Cleared</span>
                            : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-6 py-3.5 text-center text-xs text-gray-400">{cp.projects.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </>)}
      </div>

      {/* ── Detail Drawer ── */}
      {activeCard && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={() => setActiveCard(null)}/>
          {/* Panel */}
          <div className="fixed right-0 top-0 h-full w-[480px] bg-white z-50 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-[15px]">
                {activeCard === 'active-cps'       && 'Active Channel Partners'}
                {activeCard === 'closed-deals'     && 'Closed Deals via CPs'}
                {activeCard === 'total-commission' && 'CP Commission Breakdown'}
                {activeCard === 'pending-payouts'  && 'Pending Payout Deals'}
              </h2>
              <button type="button" onClick={() => setActiveCard(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <X size={14}/>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">

              {/* ── Active CPs ── */}
              {activeCard === 'active-cps' && (
                cpList.length === 0
                  ? <p className="text-sm text-gray-400 text-center py-12">No CP activity yet.</p>
                  : cpList.map((cp, i) => (
                    <div key={cp.cpId} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                            style={{ background: tierColor(i) }}>{i + 1}</span>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{cp.cpName}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{cp.projects.size} project{cp.projects.size !== 1 ? 's' : ''} · {cp.totalLeads} lead{cp.totalLeads !== 1 ? 's' : ''}</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-gray-900">{cp.closedDeals} closed</div>
                          <div className="text-xs text-teal-600">{cp.conversionRate}% conversion</div>
                        </div>
                      </div>
                      {cp.projects.size > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {Array.from(cp.projects).map(p => (
                            <span key={p} className="text-[10px] bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">{p}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
              )}

              {/* ── Closed Deals ── */}
              {activeCard === 'closed-deals' && (() => {
                const closed = leads.filter(l => l.cpId && CLOSED_STAGES.has(l.stage));
                return closed.length === 0
                  ? <p className="text-sm text-gray-400 text-center py-12">No closed CP deals yet.</p>
                  : closed.map(l => (
                    <div key={l.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{l.projectName || '—'}</div>
                          <div className="text-xs text-gray-400 mt-0.5">via {l.cpName || 'CP'} · {l.createdAt}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-gray-800">{l.dealValue ? fmtCr(l.dealValue) : '—'}</div>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">{l.stage}</span>
                        </div>
                      </div>
                    </div>
                  ));
              })()}

              {/* ── Total Commission ── */}
              {activeCard === 'total-commission' && (() => {
                const commissioned = leads.filter(l => l.cpId && l.commissionAmount > 0);
                if (commissioned.length === 0)
                  return <p className="text-sm text-gray-400 text-center py-12">No commission data yet.</p>;
                return (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1">Released</div>
                        <div className="text-lg font-bold text-emerald-700">{fmtCr(cpList.reduce((s,c) => s + c.releasedCommission, 0))}</div>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                        <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">Pending</div>
                        <div className="text-lg font-bold text-amber-700">{fmtCr(totalPending)}</div>
                      </div>
                    </div>
                    {commissioned.map(l => (
                      <div key={l.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{l.cpName || 'CP'}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{l.projectName} · {l.commissionPercent}%</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-bold text-gray-800">{fmtCr(l.commissionAmount)}</div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${l.commissionStatus === 'Released' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                              {l.commissionStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                );
              })()}

              {/* ── Pending Payouts ── */}
              {activeCard === 'pending-payouts' && (() => {
                const pending = leads.filter(l => l.cpId && l.commissionAmount > 0 && l.commissionStatus !== 'Released');
                return pending.length === 0
                  ? <p className="text-sm text-gray-400 text-center py-12">No pending payouts. All commissions are cleared!</p>
                  : (
                    <>
                      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700 font-medium mb-2">
                        {pending.length} deal{pending.length !== 1 ? 's' : ''} · {fmtCr(pending.reduce((s,l) => s + l.commissionAmount, 0))} total pending
                      </div>
                      {pending.map(l => (
                        <div key={l.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{l.cpName || 'CP'}</div>
                              <div className="text-xs text-gray-400 mt-0.5">{l.projectName} · {l.stage} · {l.createdAt}</div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-sm font-bold text-amber-700">{fmtCr(l.commissionAmount)}</div>
                              <div className="text-[10px] text-gray-400">{l.commissionPercent}% of {fmtCr(l.dealValue)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  );
              })()}

            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default BuilderCPPerformance;
