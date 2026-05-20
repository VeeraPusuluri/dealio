import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { platformUsers, PlatformUser, KYCStatus, UserStatus } from '@/data/users';
import { roleLabels, roleColors, UserRole } from '@/stores/useAuthStore';
import { formatDate } from '@/lib/format';
import { Users, ShieldCheck, Activity, Ban, Search, Download, MoreVertical, X, CheckCircle, XCircle, Bell } from 'lucide-react';
import { toast } from 'sonner';

const kycColors: Record<KYCStatus, string> = { Verified: '#16A34A', Pending: '#F59E0B', Rejected: '#DC2626' };
const statusColors: Record<UserStatus, string> = { Active: '#16A34A', 'Pending KYC': '#F59E0B', Suspended: '#DC2626' };

const AdminUsers = () => {
  const [users, setUsers] = useState<PlatformUser[]>(platformUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [kycReviewUser, setKycReviewUser] = useState<PlatformUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const filtered = users.filter(u => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase()) && !u.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== 'All' && roleLabels[u.role] !== roleFilter) return false;
    if (statusFilter !== 'All' && u.userStatus !== statusFilter) return false;
    return true;
  });

  const totalUsers = users.length;
  const pendingKyc = users.filter(u => u.kycStatus === 'Pending').length;
  const activeToday = users.filter(u => u.lastLogin === '2025-01-19').length;
  const suspended = users.filter(u => u.userStatus === 'Suspended').length;

  const handleApproveKyc = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, kycStatus: 'Verified' as KYCStatus, userStatus: 'Active' as UserStatus } : u));
    setKycReviewUser(null);
    toast.success('KYC approved successfully');
  };

  const handleRejectKyc = (userId: string) => {
    if (!rejectionReason.trim()) { toast.error('Please provide a rejection reason'); return; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, kycStatus: 'Rejected' as KYCStatus, userStatus: 'Suspended' as UserStatus } : u));
    setKycReviewUser(null);
    setRejectionReason('');
    toast.success('KYC rejected');
  };

  const handleToggleSuspend = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const newStatus: UserStatus = u.userStatus === 'Suspended' ? 'Active' : 'Suspended';
      return { ...u, userStatus: newStatus };
    }));
    setActionMenu(null);
    toast.success('Account status updated');
  };

  const exportCSV = () => {
    const headers = 'User ID,Name,Role,Email,Phone,City,Registered,KYC Status,Status,Last Login\n';
    const rows = filtered.map(u => `${u.id},${u.name},${roleLabels[u.role]},${u.email},${u.phone},${u.city},${u.registeredDate},${u.kycStatus},${u.userStatus},${u.lastLogin}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'users_export.csv'; a.click();
    toast.success('CSV exported');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={totalUsers} icon={Users} color="#6B3FA0" />
          <StatCard title="Pending KYC" value={pendingKyc} icon={ShieldCheck} color="#F59E0B" />
          <StatCard title="Active Today" value={activeToday} icon={Activity} color="#16A34A" />
          <StatCard title="Suspended" value={suspended} icon={Ban} color="#DC2626" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted text-sm outline-none text-foreground" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-muted text-sm text-foreground outline-none">
            <option>All</option>
            {Object.values(roleLabels).map(r => <option key={r}>{r}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-muted text-sm text-foreground outline-none">
            <option>All</option>
            <option>Active</option>
            <option>Pending KYC</option>
            <option>Suspended</option>
          </select>
          <button onClick={exportCSV} className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#6B3FA0] text-white hover:opacity-90 flex items-center gap-2">
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg card-shadow border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border">
              <th className="px-4 py-3 font-medium">User ID</th>
              <th className="px-4 py-3 font-medium">Full Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Registered</th>
              <th className="px-4 py-3 font-medium">KYC</th>
              <th className="px-4 py-3 font-medium">Last Login</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-card-foreground">{u.id}</td>
                  <td className="px-4 py-3 text-card-foreground">{u.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={roleLabels[u.role]} color={roleColors[u.role]} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.city}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(u.registeredDate)}</td>
                  <td className="px-4 py-3"><StatusBadge status={u.kycStatus} color={kycColors[u.kycStatus]} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(u.lastLogin)}</td>
                  <td className="px-4 py-3 relative">
                    <button onClick={() => setActionMenu(actionMenu === u.id ? null : u.id)} className="p-1 hover:bg-muted rounded">
                      <MoreVertical size={16} className="text-muted-foreground" />
                    </button>
                    {actionMenu === u.id && (
                      <div className="absolute right-4 top-10 bg-card border border-border rounded-lg shadow-lg z-20 py-1 w-48 animate-slide-up">
                        <button onClick={() => { setSelectedUser(u); setActionMenu(null); }} className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"><Users size={14} /> View Profile</button>
                        {u.kycStatus === 'Pending' && <button onClick={() => { setKycReviewUser(u); setActionMenu(null); }} className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"><ShieldCheck size={14} /> Review KYC</button>}
                        {u.kycStatus === 'Pending' && <button onClick={() => { handleApproveKyc(u.id); setActionMenu(null); }} className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-muted flex items-center gap-2"><CheckCircle size={14} /> Approve KYC</button>}
                        <button onClick={() => handleToggleSuspend(u.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2">
                          <Ban size={14} /> {u.userStatus === 'Suspended' ? 'Activate' : 'Suspend'}
                        </button>
                        <button onClick={() => { toast.success(`Notification sent to ${u.name}`); setActionMenu(null); }} className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"><Bell size={14} /> Send Notification</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedUser(null)} />
          <div className="relative w-full max-w-md bg-card h-full overflow-y-auto animate-slide-up shadow-xl">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-card-foreground">User Profile</h2>
                <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-muted rounded"><X size={20} /></button>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: roleColors[selectedUser.role] }}>{selectedUser.name[0]}</div>
                <div>
                  <h3 className="font-bold text-card-foreground text-lg">{selectedUser.name}</h3>
                  <StatusBadge status={roleLabels[selectedUser.role]} color={roleColors[selectedUser.role]} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">Email</p><p className="font-medium text-card-foreground">{selectedUser.email}</p></div>
                <div><p className="text-muted-foreground">Phone</p><p className="font-medium text-card-foreground">{selectedUser.phone}</p></div>
                <div><p className="text-muted-foreground">City</p><p className="font-medium text-card-foreground">{selectedUser.city}</p></div>
                <div><p className="text-muted-foreground">Registered</p><p className="font-medium text-card-foreground">{formatDate(selectedUser.registeredDate)}</p></div>
                <div><p className="text-muted-foreground">KYC Status</p><StatusBadge status={selectedUser.kycStatus} color={kycColors[selectedUser.kycStatus]} /></div>
                <div><p className="text-muted-foreground">Account Status</p><StatusBadge status={selectedUser.userStatus} color={statusColors[selectedUser.userStatus]} /></div>
              </div>
              <div>
                <h4 className="font-semibold text-card-foreground mb-3">Documents</h4>
                <div className="space-y-2">
                  {selectedUser.documents.map((d, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg">
                      <span className="text-sm text-card-foreground">{d.name}</span>
                      <span className="text-xs">{d.uploaded ? (d.verified ? '✅ Verified' : '⏳ Pending') : '❌ Not Uploaded'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-card-foreground mb-3">Activity Log</h4>
                <div className="space-y-2">
                  {selectedUser.activityLog.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground text-xs w-20">{formatDate(a.date)}</span>
                      <span className="text-card-foreground">{a.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KYC Review Drawer */}
      {kycReviewUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setKycReviewUser(null)} />
          <div className="relative w-full max-w-md bg-card h-full overflow-y-auto animate-slide-up shadow-xl">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-card-foreground">KYC Review — {kycReviewUser.name}</h2>
                <button onClick={() => setKycReviewUser(null)} className="p-1 hover:bg-muted rounded"><X size={20} /></button>
              </div>
              <div>
                <h4 className="font-semibold text-card-foreground mb-3">Uploaded Documents</h4>
                <div className="space-y-2">
                  {kycReviewUser.documents.map((d, i) => (
                    <div key={i} className="flex items-center justify-between py-3 px-3 bg-muted rounded-lg">
                      <span className="text-sm text-card-foreground">{d.name}</span>
                      <span className="text-xs">{d.uploaded ? '📄 Uploaded' : '❌ Missing'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleApproveKyc(kycReviewUser.id)} className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 text-white font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2">
                  <CheckCircle size={16} /> Approve
                </button>
                <button onClick={() => handleRejectKyc(kycReviewUser.id)} className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2">
                  <XCircle size={16} /> Reject
                </button>
              </div>
              <div>
                <label className="text-sm font-medium text-card-foreground">Rejection Reason (required for rejection)</label>
                <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-sm outline-none text-foreground min-h-[80px]" placeholder="Provide reason for rejection..." />
              </div>
            </div>
          </div>
        </div>
      )}

      {actionMenu && <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />}
    </DashboardLayout>
  );
};

export default AdminUsers;
