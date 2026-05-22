import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { builderApi } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { Building2, MapPin, Plus, Loader2, AlertCircle, RefreshCw, Eye, EyeOff, CheckCircle2, ArrowRight, Share2 } from 'lucide-react';
import { useNotificationStore } from '@/stores/useNotificationStore';

interface ProjectRow {
  id: number;
  name: string;
  city: string | null;
  locality: string | null;
  reraNumber: string | null;
  priceMin: number | null;
  priceMax: number | null;
  status: string;
  published: boolean | null;
  publishStatus: string | null;
  imageUrl: string | null;
  commissionValue: number | null;
  configurations: string[] | null;
  totalUnits: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:             'bg-green-100 text-green-700',
  NEW_LAUNCH:         'bg-purple-100 text-purple-700',
  CLOSING_SOON:       'bg-amber-100 text-amber-700',
  INACTIVE:           'bg-gray-100 text-gray-500',
  PRE_LAUNCH:         'bg-purple-100 text-purple-700',
  LAUNCHED:           'bg-blue-100 text-blue-700',
  UNDER_CONSTRUCTION: 'bg-amber-100 text-amber-700',
  READY_TO_MOVE:      'bg-green-100 text-green-700',
};
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active', NEW_LAUNCH: 'New Launch', CLOSING_SOON: 'Closing Soon',
  INACTIVE: 'Inactive', PRE_LAUNCH: 'Pre-Launch', LAUNCHED: 'Launched',
  UNDER_CONSTRUCTION: 'Under Construction', READY_TO_MOVE: 'Ready to Move',
};

const TABS = ['All', 'Published', 'Draft'] as const;
type Tab = typeof TABS[number];

const BuilderProjects = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('All');

  const loadProjects = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const email = user.email || `uid${user.id}@dealio.builder`;
      const builderData = await builderApi.ensureBuilder(
        user.name, email, user.phone, user.id,
      ) as { builderId: number };
      const builderId = String(builderData.builderId);
      builderApi.setCachedBuilderId(builderId);
      const data = await builderApi.getProjects(builderId);
      setRows((data as ProjectRow[]) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load projects';
      if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('expired')) {
        setError('Session expired. Please log out and log in again.');
      } else if (msg.includes('403') || msg.includes('Forbidden')) {
        setError('Access denied. Your account may not be linked to a builder profile.');
      } else if (msg.includes('server') || msg.includes('reach')) {
        setError('Cannot reach the server. Make sure backend services are running.');
      } else {
        setError(msg || 'Failed to load projects. Please try again.');
      }
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const isPublished = (p: ProjectRow) =>
    p.publishStatus === 'PUBLISHED' || p.published === true;

  const handleTogglePublish = async (e: React.MouseEvent, p: ProjectRow) => {
    e.stopPropagation();
    const builderId = builderApi.getCachedBuilderId();
    if (!builderId || publishingId !== null) return;
    setPublishingId(p.id);
    const currentlyPublished = isPublished(p);
    try {
      await builderApi.updateProject(builderId, p.id, {
        published: !currentlyPublished,
        publishStatus: currentlyPublished ? 'DRAFT' : 'PUBLISHED',
      });
      setRows(prev => prev.map(r =>
        r.id === p.id
          ? { ...r, publishStatus: currentlyPublished ? 'DRAFT' : 'PUBLISHED', published: !currentlyPublished }
          : r,
      ));
      addNotification({
        title: currentlyPublished ? 'Project unpublished' : 'Project published',
        message: currentlyPublished
          ? `"${p.name}" is now hidden from the marketplace.`
          : `"${p.name}" is now live on the marketplace.`,
        type: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update project visibility';
      addNotification({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setPublishingId(null);
    }
  };

  useEffect(() => { loadProjects(); }, [user?.id]);

  const filteredRows = rows.filter(p => {
    if (activeTab === 'Published') return isPublished(p);
    if (activeTab === 'Draft') return !isPublished(p);
    return true;
  });

  const configLabel = (p: ProjectRow) => {
    const cfgs = p.configurations?.slice(0, 2).join(' / ') ?? null;
    const units = p.totalUnits ? `${p.totalUnits} units` : null;
    return [cfgs, units].filter(Boolean).join(' · ');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Header banner ──────────────────────────────────────────────────── */}
        <div className="la-banner px-5 py-4 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">My Projects</h2>
            {rows.length > 0 && (
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {rows.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 bg-slate-100 rounded-xl p-1">
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    activeTab === tab
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}>
                  {tab}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate('/builder/projects/new')}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm"
              style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}
            >
              <Plus size={15} /> Add Project
            </button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="animate-spin text-teal-500" size={32} />
            <p className="text-sm text-slate-400">Loading your projects…</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
            <AlertCircle className="mx-auto mb-3 text-red-400" size={36} />
            <h3 className="font-semibold text-slate-700 mb-1">Could not load projects</h3>
            <p className="text-sm text-slate-400 mb-4 max-w-sm mx-auto">{error}</p>
            <button onClick={loadProjects}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-sm"
              style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-gradient-to-br from-teal-50 to-white border-2 border-dashed border-teal-100 rounded-3xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="text-teal-600" size={28} />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">No projects yet</h3>
            <p className="text-sm text-slate-400 mb-5">Create your first project to start receiving leads.</p>
            <button onClick={() => navigate('/builder/projects/new')}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>
              <Plus size={16} /> Add your first project
            </button>
          </div>
        ) : filteredRows.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-12">No {activeTab.toLowerCase()} projects.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredRows.map(p => (
              <div key={p.id} onClick={() => navigate(`/builder/projects/${p.id}`)}
                className="group bg-white rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-200 flex flex-col"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>

                {/* ── Image ────────────────────────────────────────────────── */}
                <div className="relative aspect-[3/4] overflow-hidden flex-shrink-0">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full relative overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, #0b2545 0%, #1a4a7a 30%, #0A7E8C 65%, #0eb89a 100%)' }}>
                      <div className="absolute inset-0 opacity-[0.06]"
                        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
                      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-0.5 px-3 opacity-20">
                        {[14, 22, 18, 32, 22, 38, 26, 20].map((h, i) => (
                          <div key={i} className="bg-white rounded-t-sm flex-1" style={{ height: `${h}px` }} />
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Building2 size={40} className="text-white/25" />
                      </div>
                    </div>
                  )}

                  {/* Top-left: commission + status badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                    {p.commissionValue != null && (
                      <span className="bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                        + {p.commissionValue}%
                      </span>
                    )}
                    {p.status === 'NEW_LAUNCH' && (
                      <span className="bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        NEW
                      </span>
                    )}
                    {p.status === 'CLOSING_SOON' && (
                      <span className="bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        HOT
                      </span>
                    )}
                  </div>

                  {/* Top-right: publish toggle */}
                  <button
                    onClick={(e) => handleTogglePublish(e, p)}
                    disabled={publishingId === p.id}
                    title={isPublished(p) ? 'Click to unpublish' : 'Click to publish'}
                    className={`absolute top-2.5 right-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm transition-opacity hover:opacity-80 disabled:opacity-50 ${isPublished(p) ? 'bg-green-400 text-green-900' : 'bg-amber-400 text-amber-900'}`}
                  >
                    {publishingId === p.id
                      ? <Loader2 size={9} className="animate-spin" />
                      : isPublished(p) ? <Eye size={9} /> : <EyeOff size={9} />}
                    {isPublished(p) ? 'Live' : 'Draft'}
                  </button>

                  {/* Bottom price overlay */}
                  {(p.priceMin || p.priceMax) && (
                    <div className="absolute bottom-0 left-0 right-0 px-3 py-3"
                      style={{ background: 'linear-gradient(to top, rgba(15,42,69,0.82) 0%, transparent 100%)' }}>
                      <p className="text-white/60 text-[9px] font-medium leading-none mb-0.5">From</p>
                      <p className="text-white font-black text-sm leading-none">
                        {p.priceMin ? formatCurrency(p.priceMin) : '—'}
                      </p>
                    </div>
                  )}
                </div>

                {/* ── Body ─────────────────────────────────────────────────── */}
                <div className="p-3.5 flex flex-col flex-1 gap-0.5">
                  <h3 className="font-bold text-slate-800 text-[13px] leading-snug line-clamp-1 group-hover:text-teal-600 transition-colors">
                    {p.name}
                  </h3>
                  <p className="flex items-center gap-1 text-[11px] text-slate-400 line-clamp-1">
                    <MapPin size={9} className="shrink-0 text-teal-500/70" />
                    {[p.locality, p.city].filter(Boolean).join(', ') || '—'}
                  </p>
                  {configLabel(p) && (
                    <p className="text-[10px] text-slate-400">{configLabel(p)}</p>
                  )}
                  {p.reraNumber && (
                    <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                      <CheckCircle2 size={9} /> RERA Registered
                    </p>
                  )}

                  {/* Action row */}
                  <div className="mt-auto pt-2.5 flex items-center gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/builder/projects/${p.id}`); }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-semibold text-teal-700 bg-teal-50 group-hover:bg-teal-100 transition-colors">
                      Manage <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard?.writeText(`${window.location.origin}/projects/${p.id}`);
                        addNotification({ title: 'Link copied', message: 'Project link copied to clipboard.', type: 'success' });
                      }}
                      className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                      <Share2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BuilderProjects;