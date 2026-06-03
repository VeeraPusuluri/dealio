import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { builderApi } from '@/lib/api';
import {
  ExternalLink, Play, Copy, Loader2, Building2, Trash2,
  Plus, Video, ChevronDown, X,
} from 'lucide-react';
import { toast } from 'sonner';

interface ApiProject { id: number; name: string; videoUrl?: string | null; [key: string]: unknown; }
interface TourLink   { label: string; url: string; }

function toEmbedUrl(raw: string): string {
  const yt = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`;
  const shorts = raw.match(/youtube\.com\/shorts\/([^?/\s]+)/);
  if (shorts) return `https://www.youtube.com/embed/${shorts[1]}?rel=0`;
  return raw;
}

function parseTours(videoUrl?: string | null): TourLink[] {
  if (!videoUrl) return [];
  try {
    const parsed = JSON.parse(videoUrl);
    if (Array.isArray(parsed)) return parsed as TourLink[];
  } catch { /* not JSON */ }
  return [{ label: 'Project Video', url: videoUrl }];
}

function getThumbnail(url: string): string | null {
  const yt = url.match(/youtube\.com\/embed\/([^?/\s]+)/);
  if (yt) return `https://img.youtube.com/vi/${yt[1]}/mqdefault.jpg`;
  return null;
}

const BuilderVirtualTours = () => {
  const [projects,        setProjects]        = useState<ApiProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedId,      setSelectedId]      = useState<number | null>(null);
  const [activeTourIdx,   setActiveTourIdx]   = useState<number | null>(null);
  const [showAddForm,     setShowAddForm]      = useState(false);
  const [newLabel,        setNewLabel]        = useState('');
  const [newUrl,          setNewUrl]          = useState('');
  const [saving,          setSaving]          = useState(false);
  const [deletingIdx,     setDeletingIdx]     = useState<number | null>(null);

  useEffect(() => {
    const builderId = builderApi.getCachedBuilderId();
    if (!builderId) { setLoadingProjects(false); return; }
    builderApi.getProjects(builderId)
      .then(data => {
        const list = (data as ApiProject[]) || [];
        setProjects(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => toast.error('Could not load projects'))
      .finally(() => setLoadingProjects(false));
  }, []);

  useEffect(() => { setActiveTourIdx(null); setShowAddForm(false); }, [selectedId]);

  const selected     = projects.find(p => p.id === selectedId) ?? null;
  const projectTours = parseTours(selected?.videoUrl);
  const activeTour   = activeTourIdx !== null ? (projectTours[activeTourIdx] ?? null) : null;
  const previewEmbed = newUrl.trim() ? toEmbedUrl(newUrl.trim()) : null;

  const persistTours = async (updatedTours: TourLink[]) => {
    const builderId = builderApi.getCachedBuilderId();
    if (!builderId || !selectedId) return;
    const videoUrl = updatedTours.length > 0 ? JSON.stringify(updatedTours) : null;
    const fullProject = await builderApi.getProject(builderId, String(selectedId)) as ApiProject;
    await builderApi.updateProject(builderId, selectedId, { ...fullProject, videoUrl });
    setProjects(prev => prev.map(p => p.id === selectedId ? { ...p, videoUrl } : p));
  };

  const handleAdd = async () => {
    if (!newLabel.trim() || !newUrl.trim()) { toast.error('Enter both a label and a URL'); return; }
    if (selectedId === null) return;
    const embedUrl = toEmbedUrl(newUrl.trim());
    const updated  = [...projectTours, { label: newLabel.trim(), url: embedUrl }];
    setSaving(true);
    try {
      await persistTours(updated);
      setNewLabel(''); setNewUrl('');
      setShowAddForm(false);
      setActiveTourIdx(updated.length - 1);
      toast.success('Tour saved!');
    } catch {
      toast.error('Failed to save — please try again');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (idx: number) => {
    if (selectedId === null) return;
    setDeletingIdx(idx);
    try {
      const updated = projectTours.filter((_, i) => i !== idx);
      await persistTours(updated);
      if (activeTourIdx === idx) setActiveTourIdx(updated.length > 0 ? 0 : null);
      else if (activeTourIdx !== null && activeTourIdx > idx) setActiveTourIdx(activeTourIdx - 1);
      toast.success('Tour removed');
    } catch {
      toast.error('Failed to remove tour');
    } finally {
      setDeletingIdx(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="la-banner px-5 py-4">
          <h2 className="text-[15px] font-bold text-slate-800">Virtual Tours</h2>
          <p className="text-xs text-slate-400 mt-0.5">Attach YouTube or 360° tour links to your projects</p>
        </div>

        {loadingProjects && (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-teal-500" />
          </div>
        )}

        {!loadingProjects && projects.length === 0 && (
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Building2 size={26} className="text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700 mb-1">No projects yet</p>
            <p className="text-sm text-slate-400">Add a project first, then attach virtual tours here.</p>
          </div>
        )}

        {!loadingProjects && projects.length > 0 && (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <select
                  value={selectedId ?? ''}
                  onChange={e => setSelectedId(Number(e.target.value))}
                  className="pl-3 pr-8 py-2 rounded-lg border border-input bg-card text-sm text-card-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-teal-200 min-w-[220px]"
                >
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <span className="text-sm text-muted-foreground">
                {projectTours.length} tour{projectTours.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => { setShowAddForm(v => !v); setNewLabel(''); setNewUrl(''); }}
                className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}
              >
                <Plus size={14} /> Add Tour
              </button>
            </div>

            {/* Add form */}
            {showAddForm && (
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                    <Plus size={14} className="text-teal-500" /> New Tour Link
                  </h3>
                  <button onClick={() => setShowAddForm(false)} className="p-1 rounded hover:bg-muted transition-colors">
                    <X size={14} className="text-muted-foreground" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    placeholder="Label  (e.g. Tower A — 3BHK)"
                    className="px-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-200"
                  />
                  <input
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    placeholder="YouTube / Matterport / Realsee URL"
                    className="px-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-200"
                  />
                </div>

                {previewEmbed && (
                  <div className="rounded-xl overflow-hidden border border-border">
                    <p className="text-[11px] text-muted-foreground px-3 py-1.5 bg-muted border-b border-border">Preview</p>
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        src={previewEmbed}
                        className="absolute inset-0 w-full h-full border-0"
                        allowFullScreen
                        title="Tour preview"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAdd}
                    disabled={saving || !newLabel.trim() || !newUrl.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    {saving ? 'Saving…' : 'Save Tour'}
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Player + list */}
            {projectTours.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                <Video size={32} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-600 mb-1">No virtual tours yet</p>
                <p className="text-xs text-slate-400">
                  Click <strong>Add Tour</strong> to attach a YouTube, Matterport, or Realsee link.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">

                {/* Active player */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  {activeTour ? (
                    <>
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-2 min-w-0">
                          <Play size={13} className="text-teal-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-card-foreground truncate">{activeTour.label}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          <button
                            onClick={() => { navigator.clipboard.writeText(activeTour.url); toast.success('Copied!'); }}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-teal-600 transition-colors"
                          >
                            <Copy size={11} /> Copy
                          </button>
                          <a
                            href={activeTour.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-teal-600 hover:underline"
                          >
                            <ExternalLink size={11} /> Open
                          </a>
                        </div>
                      </div>
                      <div className="relative w-full bg-slate-900" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          key={activeTour.url}
                          src={activeTour.url}
                          className="absolute inset-0 w-full h-full border-0"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          title={activeTour.label}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                      <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center mb-4">
                        <Play size={26} className="text-teal-400 ml-1" />
                      </div>
                      <p className="text-sm font-medium text-card-foreground mb-1">Select a tour to play</p>
                      <p className="text-xs text-muted-foreground">Choose from the list on the right</p>
                    </div>
                  )}
                </div>

                {/* Tour thumbnail list */}
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-0.5 mb-1">
                    Tours · {projectTours.length}
                  </p>
                  {projectTours.map((tour, i) => {
                    const thumb    = getThumbnail(tour.url);
                    const isActive = activeTourIdx === i;
                    return (
                      <div
                        key={i}
                        onClick={() => setActiveTourIdx(i)}
                        className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all duration-150 select-none ${
                          isActive
                            ? 'border-teal-400 ring-2 ring-teal-100 dark:ring-teal-900/30'
                            : 'border-border hover:border-teal-300'
                        }`}
                      >
                        {/* Thumbnail strip */}
                        <div className="relative w-full bg-slate-800" style={{ paddingBottom: '56.25%' }}>
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={tour.label}
                              className="absolute inset-0 w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-teal-900/70 to-slate-900">
                              <Video size={22} className="text-teal-300 opacity-50" />
                            </div>
                          )}

                          {/* Hover / active play overlay */}
                          <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity ${
                            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}>
                            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow">
                              <Play size={12} className="text-teal-600 ml-0.5" fill="currentColor" />
                            </div>
                          </div>

                          {isActive && (
                            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-500 text-white">
                              NOW PLAYING
                            </span>
                          )}
                        </div>

                        {/* Label row */}
                        <div className="flex items-center gap-2 px-2.5 py-2 bg-card">
                          <span className="text-[12px] font-medium text-card-foreground truncate flex-1 leading-tight">
                            {tour.label}
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(i); }}
                            disabled={deletingIdx === i}
                            className="flex-shrink-0 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-40"
                            title="Remove"
                          >
                            {deletingIdx === i
                              ? <Loader2 size={11} className="animate-spin" />
                              : <Trash2 size={11} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BuilderVirtualTours;
