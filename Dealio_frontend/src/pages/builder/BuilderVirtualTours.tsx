import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { builderApi } from '@/lib/api';
import { ExternalLink, Play, Copy, Loader2, Building2, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ApiProject { id: number; name: string; videoUrl?: string | null; [key: string]: unknown; }
interface TourLink   { label: string; url: string; }

// Convert any YouTube watch/short URL to an embeddable URL
function toEmbedUrl(raw: string): string {
  const yt = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  return raw;
}

// Parse a project's videoUrl field into an array of TourLink
function parseTours(videoUrl?: string | null): TourLink[] {
  if (!videoUrl) return [];
  try {
    const parsed = JSON.parse(videoUrl);
    if (Array.isArray(parsed)) return parsed as TourLink[];
  } catch { /* not JSON — treat as a plain URL */ }
  return [{ label: 'Project Video', url: videoUrl }];
}

const BuilderVirtualTours = () => {
  const [projects,        setProjects]        = useState<ApiProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedId,      setSelectedId]      = useState<number | null>(null);
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

  const selected    = projects.find(p => p.id === selectedId) ?? null;
  const projectTours: TourLink[] = parseTours(selected?.videoUrl);
  const previewEmbed = newUrl.trim() ? toEmbedUrl(newUrl.trim()) : null;

  const persistTours = async (updatedTours: TourLink[]) => {
    const builderId = builderApi.getCachedBuilderId();
    if (!builderId || !selectedId) return;
    const videoUrl = updatedTours.length > 0 ? JSON.stringify(updatedTours) : null;

    // Fetch the full project so we can send a complete payload (PUT requires all fields)
    const fullProject = await builderApi.getProject(builderId, String(selectedId)) as ApiProject;
    await builderApi.updateProject(builderId, selectedId, { ...fullProject, videoUrl });

    setProjects(prev =>
      prev.map(p => p.id === selectedId ? { ...p, videoUrl } : p)
    );
  };

  const handleAdd = async () => {
    if (!newLabel.trim() || !newUrl.trim()) { toast.error('Enter both a label and a URL'); return; }
    if (selectedId === null) return;
    const embedUrl   = toEmbedUrl(newUrl.trim());
    const updated    = [...projectTours, { label: newLabel.trim(), url: embedUrl }];
    setSaving(true);
    try {
      await persistTours(updated);
      setNewLabel(''); setNewUrl('');
      toast.success('Virtual tour saved!');
    } catch {
      toast.error('Failed to save tour — please try again');
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
      toast.success('Tour removed');
    } catch {
      toast.error('Failed to remove tour');
    } finally {
      setDeletingIdx(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="la-banner px-5 py-4">
          <h2 className="text-lg font-bold text-slate-800">Virtual Tours</h2>
          <p className="text-xs text-slate-400 mt-0.5">Attach YouTube or 360° tour links to your projects</p>
        </div>

        {loadingProjects ? (
          <div className="flex justify-center py-10">
            <Loader2 size={28} className="animate-spin text-teal-500" />
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-gradient-to-br from-teal-50 to-white border-2 border-dashed border-teal-100 rounded-3xl p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-4">
              <Building2 size={28} className="text-teal-600" />
            </div>
            <p className="font-semibold text-slate-700 mb-1">No projects found</p>
            <p className="text-sm text-slate-400">Add a project first, then come back to attach virtual tours.</p>
          </div>
        ) : (
          <>
            {/* Project selector */}
            <select
              value={selectedId ?? ''}
              onChange={e => setSelectedId(Number(e.target.value))}
              className="w-full max-w-md px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 transition-all"
            >
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            {/* Add tour form */}
            <div className="la-card p-5 space-y-4">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <Plus size={16} className="text-teal-500" /> Add Tour Link
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="Label (e.g. Tower A — 3BHK Sample Flat)"
                  className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 transition-all"
                />
                <input
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  placeholder="YouTube / Matterport / Realsee URL"
                  className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 transition-all"
                />
              </div>

              {/* Live preview while typing */}
              {previewEmbed && (
                <div className="rounded-2xl overflow-hidden border border-teal-100 shadow-sm">
                  <p className="text-xs text-slate-400 px-3 py-1.5 bg-teal-50/60 border-b border-slate-100">Preview</p>
                  <div className="aspect-video bg-slate-100">
                    <iframe
                      src={previewEmbed}
                      className="w-full h-full border-0"
                      allowFullScreen
                      title="Tour preview"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleAdd}
                disabled={saving || !newLabel.trim() || !newUrl.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90 transition-opacity shadow-sm"
                style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {saving ? 'Saving…' : 'Save Tour'}
              </button>
            </div>

            {/* Tour list */}
            {projectTours.length > 0 ? (
              <div className="space-y-4">
                {projectTours.map((tour, i) => (
                  <div key={i} className="la-card overflow-hidden">
                    <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/60">
                      <div className="flex items-center gap-2 min-w-0">
                        <Play size={15} className="text-teal-500 shrink-0" />
                        <span className="text-sm font-medium text-slate-700 truncate">{tour.label}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                        <button
                          onClick={() => { navigator.clipboard.writeText(tour.url); toast.success('URL copied!'); }}
                          className="text-xs text-slate-400 hover:text-teal-600 flex items-center gap-1 transition-colors"
                        >
                          <Copy size={12} /> Copy
                        </button>
                        <a
                          href={tour.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-teal-600 flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink size={12} /> Open
                        </a>
                        <button
                          onClick={() => handleDelete(i)}
                          disabled={deletingIdx === i}
                          className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          {deletingIdx === i
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Trash2 size={12} />}
                        </button>
                      </div>
                    </div>
                    <div className="aspect-video bg-slate-100">
                      <iframe
                        src={tour.url}
                        className="w-full h-full border-0"
                        allowFullScreen
                        title={tour.label}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-10 text-center">
                <Play size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">
                  No virtual tours added for <strong>{selected?.name}</strong> yet.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Paste a YouTube, Matterport, or Realsee link above to get started.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BuilderVirtualTours;