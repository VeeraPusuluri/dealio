import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, Loader2, Star, ArrowLeft, Plus } from 'lucide-react';

interface ApiProject {
  id: number;
  name: string;
  city: string | null;
  status: string;
  featured: boolean;
  totalUnits: number | null;
  availableUnits: number | null;
  soldUnits: number | null;
  commissionValue: number | null;
  createdAt: string;
  builder: {
    id: number;
    companyName: string | null;
    user: { fullName: string | null };
  };
  _count: { deals: number };
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:    '#16A34A',
  INACTIVE:  '#6B7280',
  SOLD_OUT:  '#DC2626',
};

const AdminProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects]     = useState<ApiProject[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toggling, setToggling]     = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getProjects({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search || undefined,
      }) as ApiProject[];
      setProjects(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load projects'); }
    finally  { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const handleToggleFeatured = async (p: ApiProject) => {
    setToggling(p.id);
    try {
      await adminApi.toggleProjectFeatured(p.id);
      toast.success(p.featured ? 'Removed from featured' : 'Marked as featured');
      setProjects(prev => prev.map(x => x.id === p.id ? { ...x, featured: !x.featured } : x));
    } catch { toast.error('Failed to update'); }
    finally  { setToggling(null); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="la-banner px-5 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0" title="Back to Overview">
            <ArrowLeft size={15} className="text-slate-500" />
          </button>
          <Building2 size={16} className="text-teal-600" />
          <div className="flex-1">
            <h2 className="text-[15px] font-bold text-slate-800">Project Management</h2>
            <p className="text-xs text-slate-400 mt-0.5">{projects.length} projects across all builders</p>
          </div>
          <button
            onClick={() => navigate('/admin/projects/new')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:opacity-90 transition-opacity shrink-0"
            style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
            <Plus size={13} /> Add Project
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or city…"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-teal-100" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-[12px] text-slate-700 focus:outline-none">
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
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
                    <th className="px-4 py-3 font-semibold">Project</th>
                    <th className="px-4 py-3 font-semibold">Builder</th>
                    <th className="px-4 py-3 font-semibold">City</th>
                    <th className="px-4 py-3 font-semibold">Units</th>
                    <th className="px-4 py-3 font-semibold">Deals</th>
                    <th className="px-4 py-3 font-semibold">Comm %</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Featured</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(p => {
                    const pctSold = p.totalUnits && p.soldUnits
                      ? Math.round((p.soldUnits / p.totalUnits) * 100) : 0;
                    return (
                      <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-[12px] font-semibold text-slate-800">{p.name}</p>
                          <p className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleDateString('en-IN')}</p>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-slate-600">{p.builder.companyName ?? p.builder.user.fullName ?? '—'}</td>
                        <td className="px-4 py-3 text-[12px] text-slate-600">{p.city ?? '—'}</td>
                        <td className="px-4 py-3">
                          <p className="text-[12px] text-slate-700">{p.soldUnits ?? 0} / {p.totalUnits ?? '—'}</p>
                          {p.totalUnits ? (
                            <div className="h-1 w-16 bg-slate-100 rounded-full mt-1 overflow-hidden">
                              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pctSold}%` }} />
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-slate-600">{p._count.deals}</td>
                        <td className="px-4 py-3 text-[12px] text-teal-600 font-semibold">
                          {p.commissionValue != null ? `${p.commissionValue}%` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: STATUS_COLOR[p.status] ?? '#6B7280' }}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleToggleFeatured(p)} disabled={toggling === p.id}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                              p.featured
                                ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                                : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                            }`}>
                            {toggling === p.id
                              ? <Loader2 size={10} className="animate-spin" />
                              : <Star size={10} className={p.featured ? 'fill-amber-500 text-amber-500' : ''} />}
                            {p.featured ? 'Featured' : 'Feature'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {projects.length === 0 && !loading && (
                <p className="text-center text-[12px] text-slate-400 py-10">No projects found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminProjects;
