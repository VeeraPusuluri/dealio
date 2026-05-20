import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import { useAuthStore } from '@/stores/useAuthStore';
import { builderApi } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import {
  Building2, Home, MapPin, ArrowLeft, FileText, Loader2,
  Pencil, Save, X, Upload, ExternalLink, Download, Eye, EyeOff,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface ProjectDetail {
  id: number;
  builderId?: number;
  name: string;
  projectType: string | null;
  status: string;
  description: string | null;
  address: string | null;
  city: string | null;
  locality: string | null;
  pincode: string | null;
  landmark: string | null;
  googleMapsLink: string | null;
  reraNumber: string | null;
  reraExpiry: string | null;
  totalUnits: number | null;
  towers: number | null;
  floorsPerTower: number | null;
  configurations: string[] | null;
  amenities: string[] | null;
  nearbyHighlights: string[] | null;
  priceMin: number | null;
  priceMax: number | null;
  pricePerSqftMin: number | null;
  pricePerSqftMax: number | null;
  maintenanceCharges: number | null;
  floorRiseCharges: number | null;
  commissionStructure: string | null;
  commissionValue: number | null;
  possessionDate: string | null;
  closingSoon: boolean;
  featured: boolean;
  published: boolean;
  videoUrl: string | null;
  imageUrl: string | null;
  availableUnits: number | null;
  bookedUnits: number | null;
  soldUnits: number | null;
}

interface ProjectDocument {
  id: number;
  docType: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

interface EditForm {
  description: string;
  priceMin: string;
  priceMax: string;
  possessionDate: string;
  totalUnits: string;
  availableUnits: string;
  bookedUnits: string;
  soldUnits: string;
  status: string;
  commissionValue: string;
  featured: boolean;
  closingSoon: boolean;
  published: boolean;
}

const tabs = ['Overview', 'Units', 'Documents', 'Settings'] as const;
const DOC_TYPES = ['RERA Certificate', 'Floor Plan', 'Brochure', 'Price List', 'Layout Plan', 'Agreement', 'Other'];
const STATUS_OPTIONS = [
  { value: 'PRE_LAUNCH', label: 'Pre Launch' },
  { value: 'LAUNCHED', label: 'Launched' },
  { value: 'UNDER_CONSTRUCTION', label: 'Under Construction' },
  { value: 'READY_TO_MOVE', label: 'Ready to Move' },
];

function formatStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary';

const BuilderProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Overview');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDocType, setUploadDocType] = useState(DOC_TYPES[0]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [builderId, setBuilderId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !id) return;
    (async () => {
      try {
        let bid = builderApi.getCachedBuilderId();
        if (!bid) {
          const email = user.email || `uid${user.id}@dealio.builder`;
          const builderData = await builderApi.ensureBuilder(user.name, email, user.phone, user.id) as { builderId: number };
          bid = String(builderData.builderId);
          builderApi.setCachedBuilderId(bid);
        }
        const raw = await builderApi.getProject(bid, id) as ProjectDetail & { coverUrl?: string };
        const data: ProjectDetail = { ...raw, imageUrl: raw.imageUrl ?? raw.coverUrl ?? null };
        // Prefer the builderId from the project response if available
        const effectiveBid = data.builderId ? String(data.builderId) : bid;
        if (effectiveBid !== bid) builderApi.setCachedBuilderId(effectiveBid);
        setBuilderId(effectiveBid);
        setProject(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, id]);

  useEffect(() => {
    if (activeTab !== 'Documents' || !builderId || !id) return;
    setDocsLoading(true);
    builderApi.getDocuments(builderId, id)
      .then(data => setDocuments((data as ProjectDocument[]) || []))
      .catch(() => setDocuments([]))
      .finally(() => setDocsLoading(false));
  }, [activeTab, builderId, id]);

  const enterEdit = () => {
    if (!project) return;
    setEditForm({
      description: project.description || '',
      priceMin: project.priceMin != null ? String(project.priceMin) : '',
      priceMax: project.priceMax != null ? String(project.priceMax) : '',
      possessionDate: project.possessionDate || '',
      totalUnits: project.totalUnits != null ? String(project.totalUnits) : '',
      availableUnits: project.availableUnits != null ? String(project.availableUnits) : '',
      bookedUnits: project.bookedUnits != null ? String(project.bookedUnits) : '',
      soldUnits: project.soldUnits != null ? String(project.soldUnits) : '',
      status: project.status,
      commissionValue: project.commissionValue != null ? String(project.commissionValue) : '',
      featured: project.featured,
      closingSoon: project.closingSoon,
      published: project.published,
    });
    setEditMode(true);
  };

  const cancelEdit = () => { setEditMode(false); setEditForm(null); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !builderId || !id) return;
    setUploadingImage(true);
    try {
      const coverUrl = await builderApi.uploadProjectImage(builderId, id, file);
      await builderApi.updateProject(builderId, id, { coverUrl });
      setProject(prev => prev ? { ...prev, imageUrl: coverUrl } : prev);
      toast.success('Cover image updated');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const setField = (field: keyof EditForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setEditForm(prev => prev ? { ...prev, [field]: e.target.value } : prev);

  const toggleFlag = (field: 'featured' | 'closingSoon' | 'published') => () =>
    setEditForm(prev => prev ? { ...prev, [field]: !prev[field] } : prev);

  const handleSave = async () => {
    if (!editForm || !builderId || !id) return;
    setSaving(true);
    try {
      const payload = {
        description: editForm.description || null,
        priceMin: editForm.priceMin ? Number(editForm.priceMin) : null,
        priceMax: editForm.priceMax ? Number(editForm.priceMax) : null,
        possessionDate: editForm.possessionDate || null,
        totalUnits: editForm.totalUnits ? Number(editForm.totalUnits) : null,
        availableUnits: editForm.availableUnits ? Number(editForm.availableUnits) : null,
        bookedUnits: editForm.bookedUnits ? Number(editForm.bookedUnits) : null,
        soldUnits: editForm.soldUnits ? Number(editForm.soldUnits) : null,
        status: editForm.status,
        commissionValue: editForm.commissionValue ? Number(editForm.commissionValue) : null,
        featured: editForm.featured,
        closingSoon: editForm.closingSoon,
        published: editForm.published,
      };
      const updated = await builderApi.updateProject(builderId, id, payload) as ProjectDetail;
      setProject(updated);
      setEditMode(false);
      setEditForm(null);
      toast.success('Project updated successfully');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    if (!builderId || !id) return;
    setUploading(true);
    try {
      const doc = await builderApi.uploadDocument(builderId, id, file, uploadDocType) as ProjectDocument;
      setDocuments(prev => [doc, ...prev]);
      toast.success('Document uploaded successfully');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-24"><Loader2 className="animate-spin text-muted-foreground" size={32} /></div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <button onClick={() => navigate('/builder/projects')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Back</button>
          <p className="text-destructive">{error || 'Project not found.'}</p>
        </div>
      </DashboardLayout>
    );
  }

  const total = editMode && editForm ? (Number(editForm.totalUnits) || 0) : (project.totalUnits ?? 0);
  const sold = editMode && editForm ? (Number(editForm.soldUnits) || 0) : (project.soldUnits ?? 0);
  const booked = editMode && editForm ? (Number(editForm.bookedUnits) || 0) : (project.bookedUnits ?? 0);
  const available = editMode && editForm
    ? (Number(editForm.availableUnits) || 0)
    : (project.availableUnits ?? Math.max(0, total - sold - booked));
  const hold = Math.max(0, total - sold - booked - available);

  const priceMin = (editMode && editForm?.priceMin) ? Number(editForm.priceMin) : (project.priceMin ?? 0);
  const priceMax = (editMode && editForm?.priceMax) ? Number(editForm.priceMax) : (project.priceMax ?? priceMin);
  const avgPrice = (priceMin + priceMax) / 2;
  const revenue = sold * avgPrice;
  const targetRevenue = total * avgPrice;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <button onClick={() => navigate('/builder/projects')} className="p-2 hover:bg-slate-100 rounded-xl mt-1 text-slate-500 transition-colors"><ArrowLeft size={20} /></button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 className="text-xl font-bold text-slate-800">{project.name}</h2>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">
                {formatStatus(editMode && editForm ? editForm.status : project.status)}
              </span>
              {(editMode ? editForm?.closingSoon : project.closingSoon) && (
                <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">Closing Soon</span>
              )}
              {(editMode ? editForm?.featured : project.featured) && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">Featured</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {[project.locality, project.city].filter(Boolean).join(', ')}
              {project.reraNumber && ` • RERA: ${project.reraNumber}`}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 items-center">
            {/* Published status indicator */}
            {!editMode && (
              <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${project.published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {project.published ? <Eye size={12} /> : <EyeOff size={12} />}
                {project.published ? 'Live' : 'Draft'}
              </span>
            )}
            {editMode ? (
              <>
                <button onClick={cancelEdit} className="px-3 py-1.5 rounded-xl text-sm border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center gap-1.5 transition-colors">
                  <X size={14} /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 rounded-xl text-sm text-white flex items-center gap-1.5 disabled:opacity-50 hover:opacity-90 transition-opacity shadow-sm" style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                </button>
              </>
            ) : (
              <button onClick={enterEdit} className="px-3 py-1.5 rounded-xl text-sm border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center gap-1.5 transition-colors">
                <Pencil size={14} /> Edit
              </button>
            )}
          </div>
        </div>

        {/* Cover image */}
        <div className="relative h-52 rounded-2xl overflow-hidden border border-border">
          {project.imageUrl ? (
            <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0F2A45 0%, #1B3A5C 55%, #0A7E8C 100%)' }}>
              <Building2 size={56} className="text-white/20" />
            </div>
          )}
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={uploadingImage}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-black/60 text-white hover:bg-black/75 transition-colors disabled:opacity-50"
          >
            {uploadingImage ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {project.imageUrl ? 'Change Image' : 'Add Cover Image'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === t ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Total Units" value={total} icon={Building2} color="#0A7E8C" />
              <StatCard title="Available" value={available} icon={Home} color="#16A34A" />
              <StatCard title="Booked" value={booked} icon={Home} color="#F59E0B" />
              <StatCard title="Sold" value={sold} icon={Home} color="#DC2626" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {avgPrice > 0 && total > 0 && (
                <div className="bg-card rounded-lg p-5 card-shadow border border-border space-y-4">
                  <h3 className="font-semibold text-card-foreground">Revenue Progress</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Revenue so far</span>
                    <span className="font-bold text-card-foreground">{formatCurrency(revenue)}</span>
                  </div>
                  <Progress value={targetRevenue > 0 ? (revenue / targetRevenue) * 100 : 0} className="h-3" />
                  <p className="text-xs text-muted-foreground">Target: {formatCurrency(targetRevenue)}</p>
                </div>
              )}

              <div className="bg-card rounded-lg p-5 card-shadow border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-card-foreground">Project Details</h3>
                </div>

                {editMode && editForm ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                      <textarea value={editForm.description} onChange={setField('description')} rows={3} className={inputCls} placeholder="Project description..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Price Min (₹)</label>
                        <input type="number" value={editForm.priceMin} onChange={setField('priceMin')} className={inputCls} placeholder="0" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Price Max (₹)</label>
                        <input type="number" value={editForm.priceMax} onChange={setField('priceMax')} className={inputCls} placeholder="0" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Possession Date</label>
                      <input type="date" value={editForm.possessionDate} onChange={setField('possessionDate')} className={inputCls} />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {project.possessionDate && (
                      <div><p className="text-muted-foreground">Possession</p><p className="font-medium text-card-foreground">{project.possessionDate}</p></div>
                    )}
                    {project.projectType && (
                      <div><p className="text-muted-foreground">Type</p><p className="font-medium text-card-foreground">{formatStatus(project.projectType)}</p></div>
                    )}
                    {project.configurations?.length ? (
                      <div><p className="text-muted-foreground">Configurations</p><p className="font-medium text-card-foreground">{project.configurations.join(', ')}</p></div>
                    ) : null}
                    {project.commissionValue != null && (
                      <div><p className="text-muted-foreground">Commission</p><p className="font-medium text-card-foreground">{project.commissionValue}%</p></div>
                    )}
                    {project.towers ? (
                      <div><p className="text-muted-foreground">Towers</p><p className="font-medium text-card-foreground">{project.towers}</p></div>
                    ) : null}
                    {project.floorsPerTower ? (
                      <div><p className="text-muted-foreground">Floors/Tower</p><p className="font-medium text-card-foreground">{project.floorsPerTower}</p></div>
                    ) : null}
                    {project.priceMin != null && (
                      <div><p className="text-muted-foreground">Price Range</p><p className="font-medium text-card-foreground">{formatCurrency(project.priceMin)}{project.priceMax ? ` – ${formatCurrency(project.priceMax)}` : ''}</p></div>
                    )}
                    {project.reraExpiry && (
                      <div><p className="text-muted-foreground">RERA Expiry</p><p className="font-medium text-card-foreground">{project.reraExpiry}</p></div>
                    )}
                    {project.description && (
                      <div className="col-span-2"><p className="text-muted-foreground">Description</p><p className="font-medium text-card-foreground text-sm mt-0.5">{project.description}</p></div>
                    )}
                  </div>
                )}

                {!editMode && project.amenities?.length ? (
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {project.amenities.map(a => (
                        <span key={a} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{a}</span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {!editMode && project.nearbyHighlights?.length ? (
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Nearby</p>
                    <div className="flex flex-wrap gap-1.5">
                      {project.nearbyHighlights.map(n => (
                        <span key={n} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{n}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {(project.address || project.googleMapsLink) && (
              <div className="bg-card rounded-lg p-5 card-shadow border border-border space-y-2">
                <h3 className="font-semibold text-card-foreground flex items-center gap-2"><MapPin size={16} /> Location</h3>
                {project.address && <p className="text-sm text-muted-foreground">{project.address}</p>}
                {project.landmark && <p className="text-xs text-muted-foreground">Near: {project.landmark}</p>}
                {project.googleMapsLink && (
                  <a href={project.googleMapsLink} target="_blank" rel="noopener noreferrer" className="text-xs text-secondary hover:underline flex items-center gap-1">
                    <ExternalLink size={11} /> View on Google Maps
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Units Tab */}
        {activeTab === 'Units' && (
          <div className="bg-card rounded-lg p-5 card-shadow border border-border space-y-5">
            <h3 className="font-semibold text-card-foreground">Unit Inventory — {project.name}</h3>

            {editMode && editForm ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(
                  [
                    { field: 'totalUnits', label: 'Total Units', color: '#0A7E8C' },
                    { field: 'availableUnits', label: 'Available', color: '#16A34A' },
                    { field: 'bookedUnits', label: 'Booked', color: '#F59E0B' },
                    { field: 'soldUnits', label: 'Sold', color: '#DC2626' },
                  ] as const
                ).map(({ field, label, color }) => (
                  <div key={field} className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">{label}</label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" style={{ backgroundColor: color }} />
                      <input
                        type="number"
                        min={0}
                        value={editForm[field]}
                        onChange={setField(field)}
                        className="w-full pl-4 pr-3 py-2.5 rounded-lg border border-input bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-secondary/30"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : total > 0 ? (
              <>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {Array.from({ length: Math.min(total, 50) }, (_, i) => {
                    const status = i < sold ? 'Sold' : i < sold + booked ? 'Booked' : 'Available';
                    const colors: Record<string, string> = { Sold: '#DC2626', Booked: '#F59E0B', Available: '#16A34A' };
                    return (
                      <div key={i} className="aspect-square rounded flex items-center justify-center text-[10px] text-white font-medium" style={{ backgroundColor: colors[status] }}>
                        {i + 1}
                      </div>
                    );
                  })}
                </div>
                {total > 50 && <p className="text-xs text-muted-foreground">Showing first 50 of {total} units</p>}
                <div className="flex gap-4">
                  <span className="text-xs flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#16A34A' }} /> Available ({available})</span>
                  <span className="text-xs flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#F59E0B' }} /> Booked ({booked})</span>
                  <span className="text-xs flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#DC2626' }} /> Sold ({sold})</span>
                  {hold > 0 && <span className="text-xs flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted-foreground" /> Hold ({hold})</span>}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No unit data available. Click Edit to add unit counts.</p>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'Documents' && (
          <div className="space-y-4">
            {/* Upload Section */}
            <div className="bg-card rounded-lg p-5 card-shadow border border-border">
              <h3 className="font-semibold text-card-foreground mb-4">Upload Document</h3>
              <div className="flex gap-3 flex-wrap">
                <select
                  value={uploadDocType}
                  onChange={e => setUploadDocType(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30"
                >
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  {uploading ? 'Uploading…' : 'Choose File & Upload'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Supported: PDF, DOC, JPG, PNG</p>
            </div>

            {/* Documents List */}
            <div className="bg-card rounded-lg p-5 card-shadow border border-border">
              <h3 className="font-semibold text-card-foreground mb-4 flex items-center gap-2"><FileText size={16} /> Project Documents</h3>
              {docsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto mb-2 text-muted-foreground" size={32} />
                  <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Use the form above to upload your first document.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between py-3 px-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText size={16} className="text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-card-foreground font-medium truncate">{doc.fileName || doc.docType}</p>
                          <p className="text-xs text-muted-foreground">{doc.docType} • {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-IN') : ''}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {doc.fileUrl && (
                          <>
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                              className="px-3 py-1 rounded text-xs font-medium bg-card border border-border hover:bg-muted transition-colors flex items-center gap-1">
                              <ExternalLink size={11} /> View
                            </a>
                            <a href={doc.fileUrl} download
                              className="px-3 py-1 rounded text-xs font-medium bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors flex items-center gap-1">
                              <Download size={11} /> Download
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'Settings' && (
          <div className="bg-card rounded-lg p-5 card-shadow border border-border space-y-6">
            <h3 className="font-semibold text-card-foreground">Project Settings</h3>

            {editMode && editForm ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-card-foreground block mb-1.5">Project Status</label>
                    <select value={editForm.status} onChange={setField('status')} className={inputCls}>
                      {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-card-foreground block mb-1.5">Commission Value (%)</label>
                    <input type="number" step="0.1" min="0" max="100" value={editForm.commissionValue} onChange={setField('commissionValue')} className={inputCls} placeholder="e.g. 2.5" />
                  </div>
                </div>
                {/* Publish toggle — most important flag */}
                <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${editForm.published ? 'border-green-500/40 bg-green-50 dark:bg-green-950/20' : 'border-amber-500/40 bg-amber-50 dark:bg-amber-950/20'}`}>
                  <div>
                    <p className="text-sm font-semibold text-card-foreground flex items-center gap-1.5">
                      {editForm.published ? <Eye size={15} className="text-green-600" /> : <EyeOff size={15} className="text-amber-600" />}
                      {editForm.published ? 'Published — visible to customers & CPs' : 'Draft — not visible to customers'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Toggle to make this project live on the marketplace</p>
                  </div>
                  <div
                    onClick={toggleFlag('published')}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${editForm.published ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${editForm.published ? 'translate-x-7' : 'translate-x-1'}`} />
                  </div>
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={toggleFlag('featured')}
                      className={`w-10 h-5 rounded-full transition-colors relative ${editForm.featured ? 'bg-secondary' : 'bg-muted-foreground/30'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editForm.featured ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-sm text-card-foreground">Featured Project</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={toggleFlag('closingSoon')}
                      className={`w-10 h-5 rounded-full transition-colors relative ${editForm.closingSoon ? 'bg-amber-500' : 'bg-muted-foreground/30'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editForm.closingSoon ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-sm text-card-foreground">Closing Soon</span>
                  </label>
                </div>
              </div>
            ) : (
              <>
                {project.commissionStructure && (
                  <div>
                    <h4 className="text-sm font-medium text-card-foreground mb-3">Commission Structure</h4>
                    <p className="text-sm text-muted-foreground mb-2">Type: <span className="font-medium text-card-foreground">{formatStatus(project.commissionStructure)}</span></p>
                    {project.commissionValue != null && (
                      <div className="bg-muted rounded-lg p-3 inline-block text-center min-w-24">
                        <p className="text-sm font-medium text-card-foreground">Flat Rate</p>
                        <p className="text-lg font-bold text-card-foreground">{project.commissionValue}%</p>
                      </div>
                    )}
                  </div>
                )}
                {/* Visibility status */}
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${project.published ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 'border-amber-200 bg-amber-50 dark:bg-amber-950/20'}`}>
                  {project.published ? <Eye size={18} className="text-green-600 flex-shrink-0" /> : <EyeOff size={18} className="text-amber-600 flex-shrink-0" />}
                  <div>
                    <p className={`text-sm font-semibold ${project.published ? 'text-green-700' : 'text-amber-700'}`}>
                      {project.published ? 'Published — visible on the marketplace' : 'Draft — not visible to customers yet'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Go to Edit → Settings to change visibility</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-card-foreground">Project Status</label>
                    <div className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-sm text-foreground">{formatStatus(project.status)}</div>
                  </div>
                  {project.possessionDate && (
                    <div>
                      <label className="text-sm font-medium text-card-foreground">Possession Date</label>
                      <div className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-sm text-foreground">{project.possessionDate}</div>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-card-foreground">Featured</label>
                    <div className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-sm text-foreground">{project.featured ? 'Yes' : 'No'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-card-foreground">Closing Soon</label>
                    <div className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-sm text-foreground">{project.closingSoon ? 'Yes' : 'No'}</div>
                  </div>
                </div>
                {project.description && (
                  <div>
                    <label className="text-sm font-medium text-card-foreground">Description</label>
                    <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BuilderProjectDetail;