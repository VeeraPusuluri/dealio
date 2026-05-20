import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { builderApi } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { Building2, MapPin, Plus, Loader2, AlertCircle, RefreshCw, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
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
  published: boolean | null;       // legacy field (Dealio_Backend)
  publishStatus: string | null;    // Node backend field
  imageUrl: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  NEW_LAUNCH: 'bg-purple-100 text-purple-700',
  CLOSING_SOON: 'bg-amber-100 text-amber-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  NEW_LAUNCH: 'New Launch',
  CLOSING_SOON: 'Closing Soon',
  INACTIVE: 'Inactive',
};

const BuilderProjects = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishingId, setPublishingId] = useState<number | null>(null);

  const loadProjects = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');

    try {
      // Always resolve the builder entity ID using the auth user's ID
      // This ensures we always get the right builder, even after re-login
      const email = user.email || `uid${user.id}@dealio.builder`;
      const builderData = await builderApi.ensureBuilder(
        user.name, email, user.phone, user.id
      ) as { builderId: number };

      const builderId = String(builderData.builderId);
      // Cache for other pages (e.g., AddProjectWizard)
      builderApi.setCachedBuilderId(builderId);

      const data = await builderApi.getProjects(builderId);
      setRows((data as ProjectRow[]) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load projects';
      // Distinguish auth errors from other errors
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

  const isPublished = (project: ProjectRow) =>
    project.publishStatus === 'PUBLISHED' || project.published === true;

  const handleTogglePublish = async (e: React.MouseEvent, project: ProjectRow) => {
    e.stopPropagation();
    const builderId = builderApi.getCachedBuilderId();
    if (!builderId || publishingId !== null) return;
    setPublishingId(project.id);
    const currentlyPublished = isPublished(project);
    try {
      await builderApi.updateProject(builderId, project.id, {
        published: !currentlyPublished,
        publishStatus: currentlyPublished ? 'DRAFT' : 'PUBLISHED',
      });
      setRows(prev => prev.map(p =>
        p.id === project.id
          ? { ...p, publishStatus: currentlyPublished ? 'DRAFT' : 'PUBLISHED', published: !currentlyPublished }
          : p
      ));
      addNotification({
        title: currentlyPublished ? 'Project unpublished' : 'Project published',
        message: currentlyPublished
          ? `"${project.name}" is now hidden from the marketplace.`
          : `"${project.name}" is now live on the marketplace.`,
        type: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update project visibility';
      addNotification({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setPublishingId(null);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [user?.id]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="la-banner px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">My Projects</h2>
          <button
            onClick={() => navigate('/builder/projects/new')}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm"
            style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}
          >
            <Plus size={16} /> Add Project
          </button>
        </div>

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
            <button
              onClick={loadProjects}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-sm"
              style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-gradient-to-br from-teal-50 to-white border-2 border-dashed border-teal-100 rounded-3xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="text-teal-600" size={28} />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">No projects yet</h3>
            <p className="text-sm text-slate-400 mb-5">
              Create your first project to start receiving leads.
            </p>
            <button
              onClick={() => navigate('/builder/projects/new')}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}
            >
              <Plus size={16} /> Add your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {rows.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/builder/projects/${p.id}`)}
                className="group bg-white rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
              >
                {/* Hero */}
                <div className="relative h-44 overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center relative overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, #0b2545 0%, #1a4a7a 30%, #0A7E8C 65%, #0eb89a 100%)' }}>
                      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-15"
                        style={{ background: 'radial-gradient(circle, #7dd3fc, transparent)' }} />
                      <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-10"
                        style={{ background: 'radial-gradient(circle, #34d399, transparent)' }} />
                      <div className="absolute inset-0 opacity-[0.06]"
                        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1 px-4 opacity-20">
                        {[14,22,18,32,22,38,26,20,30,16,28,13].map((h, i) => (
                          <div key={i} className="bg-white rounded-t-sm flex-1" style={{ height: `${h}px` }} />
                        ))}
                      </div>
                      <div className="relative flex flex-col items-center gap-2">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
                          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                          <Building2 size={28} className="text-white" />
                        </div>
                        <span className="text-[10px] font-semibold text-white/60 tracking-widest uppercase">Property</span>
                      </div>
                    </div>
                  )}

                  {/* Publish toggle */}
                  <button
                    onClick={(e) => handleTogglePublish(e, p)}
                    disabled={publishingId === p.id}
                    title={isPublished(p) ? 'Click to unpublish' : 'Click to publish'}
                    className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm transition-opacity hover:opacity-80 disabled:opacity-50 ${isPublished(p) ? 'bg-green-400 text-green-900' : 'bg-amber-400 text-amber-900'}`}
                  >
                    {publishingId === p.id
                      ? <Loader2 size={9} className="animate-spin" />
                      : isPublished(p) ? <Eye size={9} /> : <EyeOff size={9} />}
                    {isPublished(p) ? 'Live' : 'Draft'}
                  </button>

                  <span className={`absolute top-3 right-3 text-[10px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[p.status] || 'bg-white/20 text-white'}`}>
                    {STATUS_LABELS[p.status] || p.status}
                  </span>

                  {(p.priceMin || p.priceMax) && (
                    <div className="absolute bottom-0 left-0 right-0 px-4 py-3"
                      style={{ background: 'linear-gradient(to top, rgba(15,42,69,0.85) 0%, transparent 100%)' }}>
                      <p className="text-white font-black text-lg leading-none">
                        {p.priceMin ? formatCurrency(p.priceMin) : '—'}
                        {p.priceMax ? ` – ${formatCurrency(p.priceMax)}` : ''}
                      </p>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-4">
                  <h3 className="font-bold text-slate-800 text-[15px] leading-snug group-hover:text-teal-600 transition-colors mb-1">
                    {p.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
                    <MapPin size={11} className="shrink-0 text-teal-500/70" />
                    {p.locality || '—'}{p.city && `, ${p.city}`}
                  </div>
                  {p.reraNumber && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                      <CheckCircle2 size={10} /> RERA Registered
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50 group-hover:bg-teal-100 transition-colors">
                    Manage Project <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
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
