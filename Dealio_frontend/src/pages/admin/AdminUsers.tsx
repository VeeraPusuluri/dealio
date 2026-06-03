import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Download, Loader2, Ban, CheckCircle, X, Shield, ArrowLeft } from 'lucide-react';

interface ApiUser {
  id: number;
  phone: string;
  fullName: string | null;
  email: string | null;
  role: string;
  preferredCity: string | null;
  createdAt: string;
  channelPartner?: {
    id: number; tier: string;
    aadhaarVerified: boolean; panVerified: boolean; reraVerified: boolean;
    aadhaarUrl: string | null; panUrl: string | null; reraUrl: string | null;
  } | null;
  builder?: { id: number; companyName: string | null } | null;
}

const ROLE_COLOR: Record<string, string> = {
  BUILDER: '#0A7E8C', CP: '#E87722', CUSTOMER: '#16A34A',
  BANK: '#2E5D8E', ADMIN: '#6B3FA0', NRI: '#7B5E3A',
};

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers]           = useState<ApiUser[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selected, setSelected]     = useState<ApiUser | null>(null);
  const [suspending, setSuspending] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers({
        role:   roleFilter !== 'ALL' ? roleFilter : undefined,
        search: search || undefined,
      }) as ApiUser[];
      setUsers(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load users'); }
    finally  { setLoading(false); }
  }, [roleFilter, search]);

  useEffect(() => { load(); }, [load]);

  const isSuspended = (u: ApiUser) => u.role.startsWith('SUSPENDED_');
  const displayRole = (role: string) => role.replace('SUSPENDED_', '');

  const handleToggleSuspend = async (u: ApiUser) => {
    setSuspending(u.id);
    try {
      await adminApi.suspendUser(u.id, !isSuspended(u));
      toast.success(isSuspended(u) ? 'User reactivated' : 'User suspended');
      await load();
    } catch { toast.error('Action failed'); }
    finally  { setSuspending(null); }
  };

  const exportCSV = () => {
    const hdr  = 'ID,Name,Role,Phone,Email,City,Joined\n';
    const rows = users.map(u =>
      `${u.id},${u.fullName ?? ''},${displayRole(u.role)},${u.phone},${u.email ?? ''},${u.preferredCity ?? ''},${new Date(u.createdAt).toLocaleDateString('en-IN')}`
    ).join('\n');
    const a = document.createElement('a');
    a.href     = URL.createObjectURL(new Blob([hdr + rows], { type: 'text/csv' }));
    a.download = 'users.csv'; a.click();
  };

  const kycSummary = (u: ApiUser) => {
    if (!u.channelPartner) return null;
    const cp = u.channelPartner;
    const pending = [cp.aadhaarUrl && !cp.aadhaarVerified, cp.panUrl && !cp.panVerified, cp.reraUrl && !cp.reraVerified].filter(Boolean).length;
    return { pending, allOk: cp.aadhaarVerified && cp.panVerified };
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="la-banner px-5 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0" title="Back to Overview">
            <ArrowLeft size={15} className="text-slate-500" />
          </button>
          <Users size={16} className="text-purple-500" />
          <div className="flex-1">
            <h2 className="text-[15px] font-bold text-slate-800">User Management</h2>
            <p className="text-xs text-slate-400 mt-0.5">{users.length} users · all roles</p>
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-medium text-slate-600 hover:border-purple-300 hover:text-purple-700 transition-colors">
            <Download size={13} /> Export CSV
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, email…"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-purple-100" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-[12px] text-slate-700 focus:outline-none">
            <option value="ALL">All Roles</option>
            {['BUILDER', 'CP', 'CUSTOMER', 'BANK', 'NRI', 'ADMIN'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="la-card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-[10px] uppercase border-b border-slate-100 bg-slate-50/60">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">City</th>
                    <th className="px-4 py-3 font-semibold">KYC</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const role = displayRole(u.role);
                    const susp = isSuspended(u);
                    const kyc  = kycSummary(u);
                    return (
                      <tr key={u.id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/40 transition-colors ${susp ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelected(u)} className="text-left">
                            <p className="text-[12px] font-semibold text-slate-800 hover:text-purple-700">{u.fullName ?? '—'}</p>
                            <p className="text-[10px] text-slate-400">ID: {u.id}</p>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: ROLE_COLOR[role] ?? '#6B7280' }}>{role}</span>
                          {susp && <span className="ml-1 text-[9px] text-red-500 font-bold">SUSPENDED</span>}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-slate-600 font-mono">{u.phone}</td>
                        <td className="px-4 py-3 text-[11px] text-slate-500">{u.email ?? '—'}</td>
                        <td className="px-4 py-3 text-[12px] text-slate-600">{u.preferredCity ?? '—'}</td>
                        <td className="px-4 py-3">
                          {kyc ? (
                            <span className={`flex items-center gap-1 text-[10px] font-semibold ${kyc.pending > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                              {kyc.pending > 0 ? <Shield size={10} /> : <CheckCircle size={10} />}
                              {kyc.pending > 0 ? `${kyc.pending} pending` : 'Clear'}
                            </span>
                          ) : <span className="text-[10px] text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleToggleSuspend(u)} disabled={suspending === u.id}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                              susp ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-red-500 bg-red-50 hover:bg-red-100'
                            }`}>
                            {suspending === u.id ? <Loader2 size={10} className="animate-spin" /> : susp ? <CheckCircle size={10} /> : <Ban size={10} />}
                            {susp ? 'Reactivate' : 'Suspend'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {users.length === 0 && !loading && (
                <p className="text-center text-[12px] text-slate-400 py-10">No users found.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-slate-800">User Profile</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: ROLE_COLOR[displayRole(selected.role)] ?? '#6B7280' }}>
              {(selected.fullName ?? selected.phone)[0].toUpperCase()}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Full Name', value: selected.fullName ?? '—' },
                { label: 'Phone',     value: selected.phone },
                { label: 'Email',     value: selected.email ?? '—' },
                { label: 'City',      value: selected.preferredCity ?? '—' },
                { label: 'Role',      value: displayRole(selected.role) },
                { label: 'Joined',    value: new Date(selected.createdAt).toLocaleDateString('en-IN') },
                ...(selected.builder ? [{ label: 'Company', value: selected.builder.companyName ?? '—' }] : []),
                ...(selected.channelPartner ? [
                  { label: 'CP Tier', value: selected.channelPartner.tier },
                  { label: 'Aadhaar', value: selected.channelPartner.aadhaarVerified ? '✓ Verified' : selected.channelPartner.aadhaarUrl ? '⏳ Pending' : '❌ Missing' },
                  { label: 'PAN',     value: selected.channelPartner.panVerified     ? '✓ Verified' : selected.channelPartner.panUrl     ? '⏳ Pending' : '❌ Missing' },
                  { label: 'RERA',    value: selected.channelPartner.reraVerified    ? '✓ Verified' : selected.channelPartner.reraUrl    ? '⏳ Pending' : '❌ Missing' },
                ] : []),
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl px-3 py-2.5">
                  <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
                  <p className="text-[12px] font-semibold text-slate-800 mt-0.5 break-all">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminUsers;
