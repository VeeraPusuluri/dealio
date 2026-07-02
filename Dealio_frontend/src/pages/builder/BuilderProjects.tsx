import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { builderApi } from '@/lib/api';
import {
  Plus, Loader2, AlertCircle, RefreshCw,
  FileEdit, Trash2, CheckCircle2, Building2, Eye, EyeOff, ArrowRight,
} from 'lucide-react';
import { useNotificationStore } from '@/stores/useNotificationStore';
import ProjectPlaceholder from '@/components/shared/ProjectPlaceholder';

/* ── Wizard draft ── */
const WIZARD_DRAFT_KEY = 'dealio_new_project_draft';
interface WizardDraft {
  projectName?: string; city?: string; locality?: string;
  configurations?: string[]; totalUnits?: number;
  priceFrom?: number; priceTo?: number;
}
function readWizardDraft(): WizardDraft | null {
  try {
    const raw = localStorage.getItem(WIZARD_DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as WizardDraft;
    if (!d.projectName && !d.city) return null;
    return d;
  } catch { return null; }
}

interface ProjectRow {
  id: number; name: string;
  city: string | null; locality: string | null;
  reraNumber: string | null;
  priceMin: number | null; priceMax: number | null;
  status: string;
  published: boolean | null; publishStatus: string | null;
  imageUrl: string | null;
  commissionValue: number | null;
  configurations: string[] | null;
  totalUnits: number | null;
}

/* ── Status meta ── */
const STATUS_META: Record<string, { dot: string; label: string }> = {
  ACTIVE:             { dot: '#22c55e', label: 'Selling' },
  LAUNCHED:           { dot: '#22c55e', label: 'Selling' },
  READY_TO_MOVE:      { dot: '#22c55e', label: 'Ready to move' },
  CLOSING_SOON:       { dot: '#f59e0b', label: 'Closing soon' },
  NEW_LAUNCH:         { dot: '#a855f7', label: 'New launch' },
  PRE_LAUNCH:         { dot: '#8b5cf6', label: 'Pre-launch' },
  UNDER_CONSTRUCTION: { dot: '#f59e0b', label: 'Under const.' },
  INACTIVE:           { dot: '#94a3b8', label: 'Inactive' },
};

/* ── Filter tabs ── */
const FILTER_TABS = ['All projects', 'Selling', 'Under const.', 'Pre-launch', 'High velocity'] as const;
type FilterTab = typeof FILTER_TABS[number];
const SELLING_SET = new Set(['ACTIVE', 'LAUNCHED', 'READY_TO_MOVE', 'CLOSING_SOON', 'NEW_LAUNCH']);

/* ── Helpers ── */
function fmtPrice(n: number | null | undefined): string {
  if (!n) return '—';
  if (n >= 10000000) return `₹${+(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000)   return `₹${+(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}
const NUM_WORDS = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten'];
function nWord(n: number) { return n < NUM_WORDS.length ? NUM_WORDS[n] : String(n); }

/* ── Component ── */
const BuilderProjects = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [rows, setRows]           = useState<ProjectRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('All projects');
  const [wizardDraft, setWizardDraft] = useState<WizardDraft | null>(() => readWizardDraft());

  useEffect(() => {
    const refresh = () => setWizardDraft(readWizardDraft());
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const discardWizardDraft = () => {
    localStorage.removeItem(WIZARD_DRAFT_KEY);
    setWizardDraft(null);
    addNotification({ title: 'Draft discarded', message: 'Your unsaved draft was removed.', type: 'success' });
  };

  const loadProjects = async () => {
    if (!user?.id) return;
    setLoading(true); setError('');
    try {
      const email = user.email || `uid${user.id}@dealio.builder`;
      const bd = await builderApi.ensureBuilder(user.name, email, user.phone, user.id) as { builderId: number };
      builderApi.setCachedBuilderId(String(bd.builderId));
      const data = await builderApi.getProjects(String(bd.builderId));
      setRows(((data as ProjectRow[]) || []).slice().sort((a, b) => b.id - a.id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load projects';
      setError(msg);
      setRows([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadProjects(); }, [user?.id]);

  const isPublished = (p: ProjectRow) => p.publishStatus === 'PUBLISHED' || p.published === true;

  const handleTogglePublish = async (e: React.MouseEvent, p: ProjectRow) => {
    e.stopPropagation();
    const builderId = builderApi.getCachedBuilderId();
    if (!builderId || publishingId !== null) return;
    setPublishingId(p.id);
    const pub = isPublished(p);
    try {
      await builderApi.updateProject(builderId, p.id, {
        published: !pub, publishStatus: pub ? 'DRAFT' : 'PUBLISHED',
      });
      setRows(prev => prev.map(r =>
        r.id === p.id ? { ...r, publishStatus: pub ? 'DRAFT' : 'PUBLISHED', published: !pub } : r
      ));
      addNotification({
        title: pub ? 'Project unpublished' : 'Project published',
        message: pub ? `"${p.name}" is now hidden.` : `"${p.name}" is now live.`,
        type: 'success',
      });
    } catch (err: unknown) {
      addNotification({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', type: 'error' });
    } finally { setPublishingId(null); }
  };

  /* ── Derived ── */
  const filteredRows = useMemo(() => {
    if (activeTab === 'All projects')  return rows;
    if (activeTab === 'Selling')       return rows.filter(r => SELLING_SET.has(r.status));
    if (activeTab === 'Under const.')  return rows.filter(r => r.status === 'UNDER_CONSTRUCTION');
    if (activeTab === 'Pre-launch')    return rows.filter(r => r.status === 'PRE_LAUNCH');
    if (activeTab === 'High velocity') return rows.filter(r => (r.commissionValue ?? 0) >= 3);
    return rows;
  }, [rows, activeTab]);

  const filterCounts = useMemo((): Record<FilterTab, number> => ({
    'All projects':  rows.length,
    'Selling':       rows.filter(r => SELLING_SET.has(r.status)).length,
    'Under const.':  rows.filter(r => r.status === 'UNDER_CONSTRUCTION').length,
    'Pre-launch':    rows.filter(r => r.status === 'PRE_LAUNCH').length,
    'High velocity': rows.filter(r => (r.commissionValue ?? 0) >= 3).length,
  }), [rows]);

  const totalUnits = rows.reduce((s, r) => s + (r.totalUnits ?? 0), 0);
  const cityName   = rows.find(r => r.city)?.city ?? 'your city';
  const n          = rows.length;

  /* ── Card renderer ── */
  const renderCard = (p: ProjectRow, featured = false) => {
    const meta = STATUS_META[p.status] ?? { dot: '#94a3b8', label: p.status };
    const pub  = isPublished(p);
    const cfgs = p.configurations?.slice(0, 3).join(' · ') ?? '';
    const loc  = [p.locality, p.city].filter(Boolean).join(', ');
    const locLine = [loc, cfgs, p.reraNumber ? 'RERA' : ''].filter(Boolean).join(' · ');

    return (
      <div
        key={p.id}
        onClick={() => navigate(`/builder/projects/${p.id}`)}
        className={`group bg-white rounded-3xl overflow-hidden cursor-pointer flex flex-col border border-gray-100/80
          transition-all duration-200 hover:shadow-2xl hover:shadow-gray-200/60 hover:border-gray-200
          ${featured ? 'sm:col-span-2' : ''}`}
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)' }}
      >
        {/* ── Status header strip ── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50/80">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: meta.dot }} />
            <span className="text-[11px] font-semibold text-gray-500">{meta.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {p.totalUnits != null && (
              <span className="text-[11px] text-gray-400">
                {p.totalUnits.toLocaleString('en-IN')} units
              </span>
            )}
            <button
              onClick={e => handleTogglePublish(e, p)}
              disabled={publishingId === p.id}
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 transition-opacity hover:opacity-80 disabled:opacity-50
                ${pub ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
            >
              {publishingId === p.id
                ? <Loader2 size={8} className="animate-spin" />
                : pub ? <Eye size={8} /> : <EyeOff size={8} />}
              {pub ? 'Live' : 'Draft'}
            </button>
          </div>
        </div>

        {/* ── Image / placeholder ── */}
        <div className={`relative overflow-hidden flex-shrink-0 ${featured ? 'h-72' : 'h-48'}`}>
          {p.imageUrl ? (
            <img src={p.imageUrl} alt={p.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <ProjectPlaceholder seed={p.id} name={p.name} />
          )}
          {p.commissionValue != null && (
            <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-600 px-2 py-1 rounded-full shadow-sm">
              {p.commissionValue}% CP
            </span>
          )}
        </div>

        {/* ── Body ── */}
        <div className={`flex flex-col gap-1 flex-1 ${featured ? 'p-5' : 'p-4'}`}>
          <h3 className={`font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-teal-700 transition-colors ${featured ? 'text-[20px]' : 'text-[14px]'}`}>
            {p.name}
          </h3>
          {locLine && (
            <p className="text-[11px] text-gray-400 line-clamp-1">{locLine}</p>
          )}
          {(p.priceMin || p.priceMax) && (
            <p className={`font-semibold text-gray-800 mt-0.5 ${featured ? 'text-[15px]' : 'text-[12px]'}`}>
              <span className="text-[10px] font-normal text-gray-400 mr-1">FROM</span>
              {fmtPrice(p.priceMin)}
            </p>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-50">
            {(['SOLD', 'VELOCITY', 'REALISED'] as const).map(label => (
              <div key={label}>
                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-0.5">{label}</p>
                <p className={`font-bold text-gray-600 ${featured ? 'text-[13px]' : 'text-[11px]'}`}>—</p>
              </div>
            ))}
          </div>

          {/* Availability / RERA line */}
          <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1.5">
            {p.totalUnits != null && `${p.totalUnits.toLocaleString('en-IN')} total units`}
            {p.reraNumber && (
              <span className="text-emerald-500 font-semibold flex items-center gap-0.5">
                <CheckCircle2 size={9} />RERA
              </span>
            )}
          </p>
        </div>
      </div>
    );
  };

  /* ── Render ── */
  return (
    <DashboardLayout>
      <div className="px-3 sm:px-6 py-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-4 sm:px-8 py-6 sm:py-8">

        {/* ── Editorial header ── */}
        <div className="mb-8">
          <h1 className="text-[28px] sm:text-[42px] font-bold text-gray-900 leading-[1.1] mb-2.5">
            <em style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', color: '#0d9488', fontWeight: 400 }}>
              {nWord(n)} {n === 1 ? 'project,' : 'projects,'}
            </em>
            <br />
            one pipeline.
          </h1>
          <p className="text-[13px] text-gray-500 leading-relaxed">
            Across{' '}
            <strong className="text-gray-700 font-semibold">
              {totalUnits.toLocaleString('en-IN')} unit{totalUnits !== 1 ? 's' : ''}
            </strong>
            {n > 0 && ` in ${cityName}`}
            {' '}— track inventory, velocity and realised revenue at a glance.
          </p>
        </div>

        {/* ── Filter + actions bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none -mx-1 px-1 sm:mx-0 sm:px-0">
            {FILTER_TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}>
                {tab}
                {filterCounts[tab] > 0 && (
                  <span className={`ml-1 text-[10px] ${activeTab === tab ? 'text-white/60' : 'text-gray-400'}`}>
                    {filterCounts[tab]}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/builder/projects/new')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#0d9488' }}>
              <Plus size={11} /> Launch new project
            </button>
          </div>
        </div>

        {/* ── States ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-teal-500" size={28} />
            <p className="text-sm text-gray-400">Loading your projects…</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-10 text-center">
            <AlertCircle className="mx-auto mb-3 text-red-400" size={32} />
            <h3 className="font-semibold text-gray-700 mb-1">Could not load projects</h3>
            <p className="text-sm text-gray-400 mb-4 max-w-sm mx-auto">{error}</p>
            <button onClick={loadProjects}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white"
              style={{ background: '#0d9488' }}>
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        ) : rows.length === 0 && !wizardDraft ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-3xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
              <Building2 className="text-teal-500" size={28} />
            </div>
            <h3 className="font-semibold text-gray-700 mb-1">No projects yet</h3>
            <p className="text-sm text-gray-400 mb-5">Create your first project to start receiving leads.</p>
            <button onClick={() => navigate('/builder/projects/new')}
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-white inline-flex items-center gap-1.5"
              style={{ background: '#0d9488' }}>
              <Plus size={14} /> Launch new project
            </button>
          </div>
        ) : (
          <div className="space-y-5">

            {/* Draft card */}
            {wizardDraft && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div
                  onClick={() => navigate('/builder/projects/new')}
                  className="bg-amber-50/60 border-2 border-dashed border-amber-200 rounded-3xl p-5 cursor-pointer
                    hover:border-amber-400 hover:bg-amber-50 transition-all flex flex-col gap-3 group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Unsaved Draft</span>
                    <button
                      onClick={e => { e.stopPropagation(); discardWizardDraft(); }}
                      className="p-1 rounded-full hover:bg-red-100 text-amber-400 hover:text-red-500 transition-colors">
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-amber-200/60 flex items-center justify-center">
                    <FileEdit size={18} className="text-amber-700" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-[13px] line-clamp-1">
                      {wizardDraft.projectName || 'Untitled draft'}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {[wizardDraft.locality, wizardDraft.city].filter(Boolean).join(', ') || 'Location not set'}
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); navigate('/builder/projects/new'); }}
                    className="mt-auto text-[11px] font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 transition-colors">
                    Continue editing <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            )}

            {/* Filter empty state */}
            {filteredRows.length === 0 && (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Building2 className="text-gray-400" size={24} />
                </div>
                <h3 className="font-semibold text-gray-700 mb-1">No {activeTab.toLowerCase()} projects</h3>
                <p className="text-sm text-gray-400">Try a different filter above.</p>
              </div>
            )}

            {/* Row 1: featured (col-span-2) + first small */}
            {filteredRows.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">
                {renderCard(filteredRows[0], true)}
                {filteredRows[1] && renderCard(filteredRows[1])}
              </div>
            )}

            {/* Remaining rows: 3-col equal */}
            {filteredRows.length > 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {filteredRows.slice(2).map(p => renderCard(p))}
              </div>
            )}

          </div>
        )}

        </div>
      </div>
    </DashboardLayout>
  );
};

export default BuilderProjects;