import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { builderApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { FileText, Shield, Scroll, LayoutPanelLeft, Upload, Download, Trash2, ChevronDown, FolderOpen, Image, File } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/format';

interface Project { id: number; name: string; city: string; status: string; }
interface Document {
  id: number;
  docType: string;
  fileUrl: string;
  originalName?: string;
  createdAt: string;
  size?: number;
}

const DOC_TYPES = ['RERA Certificate', 'Title Deed', 'Floor Plan', 'Brochure', 'Legal Opinion', 'NOC', 'Completion Certificate', 'Other'];

const typeIcon = (docType: string) => {
  if (docType.toLowerCase().includes('rera') || docType.toLowerCase().includes('legal')) return Shield;
  if (docType.toLowerCase().includes('deed') || docType.toLowerCase().includes('agreement')) return Scroll;
  if (docType.toLowerCase().includes('plan') || docType.toLowerCase().includes('floor')) return LayoutPanelLeft;
  if (docType.toLowerCase().includes('image') || docType.toLowerCase().includes('photo')) return Image;
  return FileText;
};

const typeColor: Record<string, string> = {
  'RERA Certificate': 'bg-emerald-100 text-emerald-700',
  'Title Deed': 'bg-blue-100 text-blue-700',
  'Floor Plan': 'bg-purple-100 text-purple-700',
  'Brochure': 'bg-orange-100 text-orange-700',
  'Legal Opinion': 'bg-teal-100 text-teal-700',
  'NOC': 'bg-amber-100 text-amber-700',
};

const BuilderDocuments = () => {
  const { user } = useAuthStore();
  const builderId = builderApi.getCachedBuilderId() || user?.id;

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!builderId) return;
    builderApi.getProjects(builderId).then(data => {
      const list = (data as Project[]) || [];
      setProjects(list);
      if (list.length > 0) setSelectedProject(list[0]);
    }).catch(() => toast.error('Failed to load projects')).finally(() => setLoadingProjects(false));
  }, [builderId]);

  useEffect(() => {
    if (!builderId || !selectedProject) return;
    setLoadingDocs(true);
    builderApi.getDocuments(builderId, selectedProject.id).then(data => {
      setDocuments((data as Document[]) || []);
    }).catch(() => {
      setDocuments([]);
    }).finally(() => setLoadingDocs(false));
  }, [builderId, selectedProject]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !builderId || !selectedProject) return;
    if (file.size > 20 * 1024 * 1024) { toast.error('File must be under 20 MB'); return; }

    setUploading(true);
    try {
      const uploaded = await builderApi.uploadDocument(builderId, selectedProject.id, file, docType);
      setDocuments(prev => [uploaded as Document, ...prev]);
      toast.success(`"${file.name}" uploaded successfully`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredDocs = documents;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="la-banner px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Document Vault</h2>
            <p className="text-xs text-slate-500 mt-0.5">Upload and manage project documents</p>
          </div>

          {/* Project Selector */}
          {!loadingProjects && projects.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowProjectMenu(p => !p)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <FolderOpen size={14} className="text-teal-600" />
                {selectedProject?.name || 'Select Project'}
                <ChevronDown size={12} className="text-slate-400" />
              </button>
              {showProjectMenu && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-lg border border-slate-100 z-20 overflow-hidden">
                  {projects.map(p => (
                    <button key={p.id} onClick={() => { setSelectedProject(p); setShowProjectMenu(false); }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors ${selectedProject?.id === p.id ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-700'}`}>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.city}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upload bar */}
        {selectedProject && (
          <div className="la-card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[180px]">
                <label className="text-xs text-slate-500 font-medium block mb-1">Document Type</label>
                <select value={docType} onChange={e => setDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300">
                  {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex-shrink-0 self-end">
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleUpload} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>
                  {uploading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload size={14} /> Upload Document</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Documents List */}
        {loadingProjects ? (
          <div className="la-card p-10 text-center text-slate-400 text-sm animate-pulse">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="la-card p-12 text-center">
            <FolderOpen size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No projects yet</p>
            <p className="text-xs text-slate-400 mt-1">Create a project first to manage its documents</p>
          </div>
        ) : loadingDocs ? (
          <div className="la-card p-10 text-center text-slate-400 text-sm animate-pulse">Loading documents...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="la-card p-12 text-center">
            <File size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No documents uploaded yet</p>
            <p className="text-xs text-slate-400 mt-1">Upload RERA certificates, title deeds, floor plans, and more for <strong>{selectedProject?.name}</strong></p>
          </div>
        ) : (
          <div className="la-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">{selectedProject?.name}</span>
              <span className="text-xs text-slate-400">{filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3.5 font-medium">Document</th>
                  <th className="px-5 py-3.5 font-medium">Type</th>
                  <th className="px-5 py-3.5 font-medium">Uploaded</th>
                  <th className="px-5 py-3.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map(doc => {
                  const Icon = typeIcon(doc.docType);
                  const colorClass = typeColor[doc.docType] || 'bg-slate-100 text-slate-600';
                  const fileName = doc.originalName || doc.fileUrl?.split('/').pop() || `Document-${doc.id}`;
                  return (
                    <tr key={doc.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <Icon size={16} className="text-slate-500" />
                          </div>
                          <div>
                            <span className="text-slate-700 font-medium text-sm">{fileName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colorClass}`}>{doc.docType}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{formatDate(doc.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {doc.fileUrl && (
                            <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-teal-600 transition-colors" title="Download">
                              <Download size={14} />
                            </a>
                          )}
                          <button
                            onClick={() => setDocuments(prev => prev.filter(d => d.id !== doc.id))}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Remove">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Click-outside handler for project menu */}
      {showProjectMenu && <div className="fixed inset-0 z-10" onClick={() => setShowProjectMenu(false)} />}
    </DashboardLayout>
  );
};

export default BuilderDocuments;
