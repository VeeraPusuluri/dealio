import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, Loader2, X, ArrowLeft } from 'lucide-react';

interface ApiBuilder {
  id: number;
  companyName: string | null;
  about: string | null;
  website: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  yearEstablished: number | null;
  deliveredProjects: number | null;
  user: { id: number; fullName: string | null; phone: string; email: string | null; createdAt: string };
  _count: { projects: number; deals: number };
}

const AdminBuilders = () => {
  const navigate = useNavigate();
  const [builders, setBuilders] = useState<ApiBuilder[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState<ApiBuilder | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getBuilders(search || undefined) as ApiBuilder[];
      setBuilders(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load builders'); }
    finally  { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="la-banner px-5 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0" title="Back to Overview">
            <ArrowLeft size={15} className="text-slate-500" />
          </button>
          <Building2 size={16} className="text-teal-600" />
          <div className="flex-1">
            <h2 className="text-[15px] font-bold text-slate-800">Builder Management</h2>
            <p className="text-xs text-slate-400 mt-0.5">{builders.length} registered builders</p>
          </div>
        </div>

        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by company name or user name…"
            className="w-full max-w-sm pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-teal-100" />
        </div>

        <div className="la-card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-[10px] uppercase border-b border-slate-100 bg-slate-50/60">
                    <th className="px-4 py-3 font-semibold">Company</th>
                    <th className="px-4 py-3 font-semibold">Contact</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Projects</th>
                    <th className="px-4 py-3 font-semibold">Deals</th>
                    <th className="px-4 py-3 font-semibold">Est.</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {builders.map(b => (
                    <tr key={b.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-[12px] font-semibold text-slate-800">{b.companyName ?? '—'}</p>
                        <p className="text-[10px] text-slate-400">{b.website ?? ''}</p>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-slate-600">{b.user.fullName ?? '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-600 font-mono">{b.contactPhone ?? b.user.phone}</td>
                      <td className="px-4 py-3 text-[12px] font-semibold text-teal-700">{b._count.projects}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-600">{b._count.deals}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-500">{b.yearEstablished ?? '—'}</td>
                      <td className="px-4 py-3 text-[11px] text-slate-400">
                        {new Date(b.user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelected(b)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 transition-colors">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {builders.length === 0 && !loading && (
                <p className="text-center text-[12px] text-slate-400 py-10">No builders found.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-slate-800">{selected.companyName ?? 'Builder'}</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Company',    value: selected.companyName ?? '—' },
                { label: 'Contact',    value: selected.user.fullName ?? '—' },
                { label: 'Phone',      value: selected.contactPhone ?? selected.user.phone },
                { label: 'Email',      value: selected.contactEmail ?? selected.user.email ?? '—' },
                { label: 'Website',    value: selected.website ?? '—' },
                { label: 'Est. Year',  value: selected.yearEstablished ? String(selected.yearEstablished) : '—' },
                { label: 'Projects',   value: String(selected._count.projects) },
                { label: 'Deals',      value: String(selected._count.deals) },
                { label: 'Delivered',  value: selected.deliveredProjects ? String(selected.deliveredProjects) : '—' },
                { label: 'Joined',     value: new Date(selected.user.createdAt).toLocaleDateString('en-IN') },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl px-3 py-2.5">
                  <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
                  <p className="text-[12px] font-semibold text-slate-800 mt-0.5 break-all">{value}</p>
                </div>
              ))}
            </div>
            {selected.about && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide mb-1">About</p>
                <p className="text-[12px] text-slate-700 leading-relaxed">{selected.about}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminBuilders;
