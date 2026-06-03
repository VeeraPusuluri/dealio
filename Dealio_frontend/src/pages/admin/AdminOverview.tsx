import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminApi } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, IndianRupee, TrendingUp, ShieldAlert, Loader2, Handshake, UserCheck, MessageCircle, Phone, MapPin, Clock, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';

interface ContactRequest {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  interest?: string | null;
  message?: string | null;
  status: string;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalBuilders: number;
  totalCPs: number;
  totalProjects: number;
  totalDeals: number;
  pendingDeals: number;
  gmv: number;
  pendingCommission: number;
  pendingDocVerifications: number;
}

const fmtCr = (n: number) => {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  new:         { label: 'New',         color: '#2563EB', bg: '#EFF6FF' },
  in_progress: { label: 'In Progress', color: '#D97706', bg: '#FFFBEB' },
  resolved:    { label: 'Resolved',    color: '#16A34A', bg: '#F0FDF4' },
};

const AdminOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<ContactRequest[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    adminApi.getStats().then(d => {
      setStats(d as Stats);
    }).catch(() => {}).finally(() => setLoading(false));

    adminApi.getContactRequests().then(d => {
      setContacts((d as ContactRequest[]) ?? []);
    }).catch(() => {}).finally(() => setContactsLoading(false));
  }, []);

  const handleStatusChange = async (id: number, status: 'new' | 'in_progress' | 'resolved') => {
    setUpdatingId(id);
    try {
      await adminApi.updateContactStatus(id, status);
      setContacts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    } catch { /* ignore */ } finally {
      setUpdatingId(null);
    }
  };

  const cards = stats ? [
    { label: 'Total Users',         value: stats.totalUsers.toLocaleString(), icon: Users,       color: '#6B3FA0', path: '/admin/users' },
    { label: 'Builders',            value: stats.totalBuilders,               icon: Building2,   color: '#0A7E8C', path: '/admin/builders' },
    { label: 'Channel Partners',    value: stats.totalCPs,                    icon: UserCheck,   color: '#E87722', path: '/admin/cps' },
    { label: 'Projects',            value: stats.totalProjects,               icon: Building2,   color: '#2E5D8E', path: '/admin/projects' },
    { label: 'Total Deals',         value: stats.totalDeals,                  icon: Handshake,   color: '#16A34A', path: '/admin/deals' },
    { label: 'GMV',                 value: fmtCr(stats.gmv),                  icon: IndianRupee, color: '#16A34A', path: '/admin/revenue' },
    { label: 'Pending Commission',  value: fmtCr(stats.pendingCommission),    icon: TrendingUp,  color: '#D97706', path: '/admin/commissions' },
    { label: 'Docs Pending Review', value: stats.pendingDocVerifications,     icon: ShieldAlert, color: '#DC2626', path: '/admin/cps' },
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="la-banner px-5 py-4">
          <h2 className="text-[15px] font-bold text-slate-800">Platform Overview</h2>
          <p className="text-xs text-slate-400 mt-0.5">Live metrics across the entire Dealio platform</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-slate-300" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(c => (
              <button
                key={c.label}
                onClick={() => navigate(c.path)}
                className="la-card p-4 flex items-center gap-3 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${c.color}18`, color: c.color }}>
                  <c.icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">{c.label}</p>
                  <p className="text-xl font-bold text-slate-800">{c.value}</p>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 flex-shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        )}

        {!loading && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Deal funnel summary */}
            <div className="la-card p-5 col-span-1">
              <h3 className="text-[13px] font-bold text-slate-700 mb-4">Deal Pipeline</h3>
              {[
                { label: 'Total Deals',   value: stats.totalDeals,   color: '#6B3FA0' },
                { label: 'Pending / Open',value: stats.pendingDeals, color: '#F59E0B' },
                { label: 'Closed',        value: stats.totalDeals - stats.pendingDeals, color: '#16A34A' },
              ].map(d => (
                <div key={d.label} className="mb-3">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600">{d.label}</span>
                    <span className="font-semibold text-slate-800">{d.value}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: stats.totalDeals > 0 ? `${(d.value / stats.totalDeals) * 100}%` : '0%',
                      backgroundColor: d.color,
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* CP verification summary */}
            <div className="la-card p-5 col-span-1">
              <h3 className="text-[13px] font-bold text-slate-700 mb-4">CP Verification</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-[12px] text-slate-600">Total CPs</span>
                  <span className="text-[14px] font-bold text-slate-800">{stats.totalCPs}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-[12px] text-slate-600">Pending Doc Review</span>
                  <span className="text-[14px] font-bold text-amber-600">{stats.pendingDocVerifications}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[12px] text-slate-600">Docs Cleared</span>
                  <span className="text-[14px] font-bold text-green-600">{stats.totalCPs - stats.pendingDocVerifications}</span>
                </div>
              </div>
            </div>

            {/* Platform composition */}
            <div className="la-card p-5 col-span-1">
              <h3 className="text-[13px] font-bold text-slate-700 mb-4">User Breakdown</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Builders',         value: stats.totalBuilders, color: '#0A7E8C' },
                  { label: 'Channel Partners', value: stats.totalCPs,      color: '#E87722' },
                  { label: 'Others',           value: stats.totalUsers - stats.totalBuilders - stats.totalCPs, color: '#6B7280' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600">{s.label}</span>
                      <span className="font-semibold text-slate-700">{s.value}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: stats.totalUsers > 0 ? `${(s.value / stats.totalUsers) * 100}%` : '0%',
                        backgroundColor: s.color,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Contact Requests ── */}
        <div className="la-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <MessageCircle size={15} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-slate-700">Contact Requests</h3>
                <p className="text-[10px] text-slate-400">Submitted from customer contact form</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {contacts.filter(c => c.status === 'new').length} new
            </span>
          </div>

          {contactsLoading ? (
            <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-slate-300" /></div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <CheckCircle2 size={28} className="text-slate-200" />
              <p className="text-[13px] text-slate-400">No contact requests yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {contacts.map(c => {
                const meta = STATUS_META[c.status] ?? STATUS_META.new;
                return (
                  <div key={c.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[13px] flex-shrink-0 mt-0.5">
                      {c.name[0]?.toUpperCase()}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-slate-800">{c.name}</span>
                        {c.interest && (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{c.interest}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Phone size={10} /> {c.phone}
                        </span>
                        {c.email && <span className="text-[11px] text-slate-400">{c.email}</span>}
                        {c.city && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <MapPin size={10} /> {c.city}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-slate-300">
                          <Clock size={9} /> {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {c.message && (
                        <p className="text-[11.5px] text-slate-500 mt-1.5 leading-relaxed line-clamp-2">{c.message}</p>
                      )}
                    </div>

                    {/* Status selector */}
                    <div className="flex-shrink-0 relative">
                      <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border transition-colors"
                        style={{ color: meta.color, background: meta.bg, borderColor: `${meta.color}30` }}>
                        <span>{meta.label}</span>
                        <ChevronDown size={10} />
                        <select
                          value={c.status}
                          disabled={updatingId === c.id}
                          onChange={e => handleStatusChange(c.id, e.target.value as 'new' | 'in_progress' | 'resolved')}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full"
                        >
                          <option value="new">New</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminOverview;
