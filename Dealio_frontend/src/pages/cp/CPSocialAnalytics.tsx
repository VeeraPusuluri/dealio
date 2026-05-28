import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { cpApi } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, CheckCircle2, Clock, Instagram, Linkedin, Facebook, MessageSquare, Loader2 } from 'lucide-react';

interface CPLead { id: number; status: string; createdAt: string; }

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildMonthlyTrend(leads: CPLead[]) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = MONTH_NAMES[d.getMonth()];
    const count = leads.filter(l => {
      const ld = new Date(l.createdAt);
      return ld.getFullYear() === d.getFullYear() && ld.getMonth() === d.getMonth();
    }).length;
    return { month: label, leads: count };
  });
}

export default function CPSocialAnalytics() {
  const { user } = useAuthStore();
  const cpUserId = user?.id ?? '';

  const [leads, setLeads]     = useState<CPLead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    if (!cpUserId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await cpApi.getLeads(cpUserId);
      setLeads((data as CPLead[]) || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [cpUserId]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const totalLeads   = leads.length;
  const booked       = leads.filter(l => l.status === 'Booked').length;
  const active       = leads.filter(l => !['Booked','Closed'].includes(l.status)).length;
  const convRate     = totalLeads > 0 ? ((booked / totalLeads) * 100).toFixed(1) : '0';
  const monthlyData  = buildMonthlyTrend(leads);
  const peakMonth    = monthlyData.reduce((a, b) => b.leads > a.leads ? b : a, { month: '—', leads: 0 });

  const platforms = [
    { name: 'WhatsApp',  Icon: MessageSquare, color: '#25D366', desc: 'Share projects directly with clients' },
    { name: 'Instagram', Icon: Instagram,     color: '#E4405F', desc: 'Reach home buyers through visual stories' },
    { name: 'Facebook',  Icon: Facebook,      color: '#1877F2', desc: 'Target audiences with property ads' },
    { name: 'LinkedIn',  Icon: Linkedin,      color: '#0A66C2', desc: 'Connect with investors and HNI buyers' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8">

        <div>
          <h1 className="text-[17px] font-bold text-foreground">Social Analytics</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Your lead generation performance</p>
        </div>

        {/* Key metrics */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Leads',     value: totalLeads, icon: Users,        color: 'text-foreground' },
                { label: 'Active Leads',    value: active,     icon: Clock,        color: 'text-amber-600' },
                { label: 'Deals Closed',    value: booked,     icon: CheckCircle2, color: 'text-emerald-600' },
                { label: 'Conversion Rate', value: `${convRate}%`, icon: TrendingUp, color: 'text-teal-600' },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon size={14} className={s.color} />
                      <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
                    </div>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Monthly trend */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[13px] font-bold text-foreground">Monthly Lead Trend</h3>
                  {peakMonth.leads > 0 && (
                    <span className="text-[11px] text-teal-600 font-medium">Peak: {peakMonth.month} ({peakMonth.leads})</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mb-4">Last 6 months</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Line type="monotone" dataKey="leads" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4, fill: '#0d9488' }} name="Leads" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Bar chart */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="text-[13px] font-bold text-foreground mb-1">Leads Per Month</h3>
                <p className="text-[11px] text-muted-foreground mb-4">Bar view for comparison</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="leads" fill="#0d9488" radius={[4,4,0,0]} name="Leads" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Social platforms — connect coming soon */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[13px] font-bold text-foreground">Social Platform Insights</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Connect your accounts to track reach and leads from each platform</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Coming Soon</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {platforms.map(p => {
              const Icon = p.Icon;
              return (
                <div key={p.name} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-muted/30 opacity-60">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: p.color }}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-foreground">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{p.desc}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5 shrink-0">Connect</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
