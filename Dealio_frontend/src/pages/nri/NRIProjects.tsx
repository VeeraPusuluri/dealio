import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useNRIStore } from '@/stores/useNRIStore';
import { builderApi } from '@/lib/api';
import { formatDualPrice } from '@/lib/nriUtils';
import { Heart, Video, Calendar, Eye, Loader2, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ProjectSummary {
  id: number;
  name: string;
  city: string;
  locality?: string;
  projectType: string;
  status: string;
  configurations?: string[];
  priceMin?: number;
  priceMax?: number;
  possessionDate?: string;
  featured?: boolean;
  closingSoon?: boolean;
  reraNumber?: string;
  description?: string;
}

const STATUS_BADGE_COLORS: Record<string, string> = {
  PRE_LAUNCH: '#7C3AED',
  LAUNCHED: '#2563EB',
  UNDER_CONSTRUCTION: '#D97706',
  READY_TO_MOVE: '#16A34A',
  NEW_LAUNCH: '#0D9488',
  ACTIVE: '#3B82F6',
  CLOSING_SOON: '#F59E0B',
};

const STATUS_LABELS: Record<string, string> = {
  PRE_LAUNCH: 'Pre-Launch',
  LAUNCHED: 'Launched',
  UNDER_CONSTRUCTION: 'Under Construction',
  READY_TO_MOVE: 'Ready to Move',
  NEW_LAUNCH: 'New Launch',
  ACTIVE: 'Active',
  CLOSING_SOON: 'Closing Soon',
};

const NRIProjects = () => {
  const { currency, shortlisted, toggleShortlist } = useNRIStore();
  const navigate = useNavigate();

  const [allProjects, setAllProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [cityFilter, setCityFilter] = useState<string[]>([]);
  const [configFilter, setConfigFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('priceLow');
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    builderApi.getPublicProjects()
      .then((data) => setAllProjects((data as ProjectSummary[]) || []))
      .catch(() => toast.error('Could not load projects'))
      .finally(() => setLoading(false));
  }, []);

  const cities = [...new Set(allProjects.map(p => p.city))].slice(0, 6);

  let filtered = allProjects.filter(p => {
    if (cityFilter.length && !cityFilter.includes(p.city)) return false;
    if (configFilter && !p.configurations?.some(c => c.toLowerCase().includes(configFilter.toLowerCase()))) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });

  if (sortBy === 'priceLow') filtered = [...filtered].sort((a, b) => (a.priceMin || 0) - (b.priceMin || 0));
  else if (sortBy === 'priceHigh') filtered = [...filtered].sort((a, b) => (b.priceMin || 0) - (a.priceMin || 0));

  const shortlistedCount = shortlisted.length;
  const shortlistedProjects = allProjects.filter(p => shortlisted.includes(String(p.id)));

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2 flex-wrap">
            {cities.map(c => (
              <button key={c} onClick={() => setCityFilter(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${cityFilter.includes(c) ? 'border-[#F5A623] bg-[#F5A623]/10 text-[#F5A623]' : 'border-border text-muted-foreground'}`}>
                {c}
              </button>
            ))}
          </div>
          <input
            value={configFilter}
            onChange={e => setConfigFilter(e.target.value)}
            placeholder="Config (e.g. 3BHK)"
            className="px-3 py-1.5 rounded-lg border border-input bg-card text-sm w-36"
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-1.5 rounded-lg border border-input bg-card text-sm">
            <option value="">All Status</option>
            <option value="UNDER_CONSTRUCTION">Under Construction</option>
            <option value="READY_TO_MOVE">Ready to Move</option>
            <option value="NEW_LAUNCH">New Launch</option>
            <option value="PRE_LAUNCH">Pre-Launch</option>
            <option value="LAUNCHED">Launched</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="ml-auto px-3 py-1.5 rounded-lg border border-input bg-card text-sm">
            <option value="priceLow">Price Low–High</option>
            <option value="priceHigh">Price High–Low</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border rounded-xl">
            <Building2 className="mx-auto mb-3 text-muted-foreground" size={40} />
            <h3 className="font-semibold text-foreground mb-1">No projects found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(p => {
              const isShortlisted = shortlisted.includes(String(p.id));
              return (
                <div key={p.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative h-40 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #0F2A4530, #0A7E8C30)' }}>
                    {p.featured && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold text-[#0F2035]" style={{ backgroundColor: '#F5A623' }}>
                        NRI Recommended
                      </span>
                    )}
                    <Building2 size={48} className="text-secondary/30" />
                    <button
                      onClick={() => { toggleShortlist(String(p.id)); toast(isShortlisted ? 'Removed from shortlist' : 'Added to shortlist'); }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center"
                    >
                      <Heart size={16} fill={isShortlisted ? '#F5A623' : 'none'} color={isShortlisted ? '#F5A623' : '#666'} />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-card-foreground">{p.name}</h3>
                        <p className="text-xs text-muted-foreground">{p.locality ? `${p.locality}, ` : ''}{p.city}</p>
                      </div>
                      <Badge className="text-[10px]" style={{ backgroundColor: STATUS_BADGE_COLORS[p.status] || '#6B7280', color: 'white' }}>
                        {STATUS_LABELS[p.status] || p.status}
                      </Badge>
                    </div>
                    {p.reraNumber && <p className="text-xs text-muted-foreground mt-1">RERA: {p.reraNumber}</p>}
                    {p.featured && <Badge variant="outline" className="text-[10px] mt-1 border-teal-300 text-teal-600">Virtual Tour Available</Badge>}

                    <p className="text-sm font-bold mt-3" style={{ color: '#F5A623' }}>
                      {p.priceMin ? formatDualPrice(p.priceMin, currency) : 'Price on request'}
                      {p.priceMax && p.priceMin !== p.priceMax ? ` – ${formatDualPrice(p.priceMax, currency)}` : ''}
                    </p>
                    {p.possessionDate && <p className="text-xs text-muted-foreground mt-0.5">Possession: {p.possessionDate.slice(0, 7)}</p>}
                    {p.configurations && p.configurations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.configurations.slice(0, 3).map(c => (
                          <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{c}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      {p.featured && (
                        <button className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-muted">
                          <Video size={14} /> 360° Tour
                        </button>
                      )}
                      <button onClick={() => navigate('/nri/consultation')}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium text-white"
                        style={{ backgroundColor: '#0D9488' }}>
                        <Calendar size={14} /> Consult
                      </button>
                      <button onClick={() => navigate(`/nri/project/${p.id}`)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium text-white"
                        style={{ backgroundColor: '#F5A623' }}>
                        <Eye size={14} /> Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {shortlistedCount >= 2 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-3 flex items-center justify-center gap-3 shadow-lg">
            <span className="text-sm font-medium text-card-foreground">Compare {shortlistedCount} shortlisted properties</span>
            <button onClick={() => setShowCompare(true)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#F5A623' }}>Compare Now</button>
          </div>
        )}

        {showCompare && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCompare(false)}>
            <div className="bg-card rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">Compare Properties</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left text-muted-foreground">Feature</th>
                      {shortlistedProjects.map(p => <th key={p.id} className="p-2 text-left font-semibold">{p.name}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {['Location', 'Price', 'Configurations', 'Possession', 'Status', 'RERA'].map(feat => (
                      <tr key={feat} className="border-b">
                        <td className="p-2 text-muted-foreground">{feat}</td>
                        {shortlistedProjects.map(p => (
                          <td key={p.id} className="p-2">
                            {feat === 'Location' && `${p.locality ? p.locality + ', ' : ''}${p.city}`}
                            {feat === 'Price' && (p.priceMin ? formatDualPrice(p.priceMin, currency) : '—')}
                            {feat === 'Configurations' && (p.configurations?.join(', ') || '—')}
                            {feat === 'Possession' && (p.possessionDate?.slice(0, 7) || '—')}
                            {feat === 'Status' && (STATUS_LABELS[p.status] || p.status)}
                            {feat === 'RERA' && (p.reraNumber || '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => setShowCompare(false)} className="mt-4 px-4 py-2 rounded-lg border border-border text-sm">Close</button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NRIProjects;