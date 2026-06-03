import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { builderApi } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import {
  Building2, MapPin, ArrowLeft, FileText, Loader2,
  Pencil, Upload, ExternalLink, Download, Eye, EyeOff,
  CheckCircle2, Star, Clock, Shield, Plus, Trash2, Edit2, X, Users,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import ProjectPlaceholder from '@/components/shared/ProjectPlaceholder';
import GoogleMapsLocationField from '@/components/shared/GoogleMapsLocationField';

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

const DOC_TYPES = ['RERA Certificate', 'Floor Plan', 'Brochure', 'Price List', 'Layout Plan', 'Agreement', 'Other'];

const STATUS_META: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  ACTIVE:             { bg: '#dcfce7', text: '#16a34a', dot: '#22c55e', label: 'Active' },
  LAUNCHED:           { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6', label: 'Launched' },
  READY_TO_MOVE:      { bg: '#dcfce7', text: '#16a34a', dot: '#22c55e', label: 'Ready to Move' },
  CLOSING_SOON:       { bg: '#fef3c7', text: '#d97706', dot: '#f59e0b', label: 'Closing Soon' },
  NEW_LAUNCH:         { bg: '#f3e8ff', text: '#7c3aed', dot: '#a855f7', label: 'New Launch' },
  PRE_LAUNCH:         { bg: '#f3e8ff', text: '#7c3aed', dot: '#8b5cf6', label: 'Pre-Launch' },
  UNDER_CONSTRUCTION: { bg: '#fef3c7', text: '#d97706', dot: '#f59e0b', label: 'Under Construction' },
  INACTIVE:           { bg: '#f1f5f9', text: '#94a3b8', dot: '#94a3b8', label: 'Inactive' },
};

const tabs = ['Overview', 'Units', 'Documents', 'Updates', 'Brochure'] as const;

interface ProjectUpdate {
  id: number; projectId: number; title: string; content: string;
  type: string; visibleTo: string; createdAt: string;
}

const UPDATE_TYPES = [
  { value: 'announcement', label: 'Announcement', emoji: '📢' },
  { value: 'milestone',    label: 'Milestone',    emoji: '🏆' },
  { value: 'construction', label: 'Construction', emoji: '🏗️' },
  { value: 'legal',        label: 'Legal',        emoji: '⚖️' },
  { value: 'price',        label: 'Price Update', emoji: '💰' },
];

const VISIBLE_OPTIONS = [
  { value: 'ALL',          label: 'Everyone (CP + Customer)' },
  { value: 'CP',           label: 'Channel Partners only' },
  { value: 'CUSTOMER',     label: 'Customers only' },
  { value: 'CP,CUSTOMER',  label: 'CP & Customers' },
  { value: 'BUILDER',      label: 'Internal only' },
];

function updateEmoji(type: string) {
  return UPDATE_TYPES.find(t => t.value === type)?.emoji ?? '📋';
}
function updateTypeLabel(type: string) {
  return UPDATE_TYPES.find(t => t.value === type)?.label ?? type;
}
function visibleLabel(v: string) {
  return VISIBLE_OPTIONS.find(o => o.value === v)?.label ?? v;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-700 leading-snug">{value}</p>
    </div>
  );
}

function FlagPill({ label, active, activeColor }: { label: string; active: boolean; activeColor: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
        style={active ? { backgroundColor: activeColor } : {}}>
        {active ? 'Yes' : 'No'}
      </span>
    </div>
  );
}

const BuilderProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Overview');

  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDocType, setUploadDocType] = useState(DOC_TYPES[0]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ── Project Updates state ─────────────────────────────────────────────────
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<ProjectUpdate | null>(null);
  const [uTitle, setUTitle] = useState('');
  const [uContent, setUContent] = useState('');
  const [uType, setUType] = useState('announcement');
  const [uVisibleTo, setUVisibleTo] = useState('ALL');
  const [uSubmitting, setUSubmitting] = useState(false);
  const [builderId, setBuilderId] = useState<string | null>(null);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [mapsLink, setMapsLink] = useState('');
  const [mapsSaving, setMapsSaving] = useState(false);
  const mapsLinkDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        const effectiveBid = data.builderId ? String(data.builderId) : bid;
        if (effectiveBid !== bid) builderApi.setCachedBuilderId(effectiveBid);
        setBuilderId(effectiveBid);
        setProject(data);
        if (data.googleMapsLink) {
          setMapsLink(data.googleMapsLink);
        } else {
          const parts = [data.address, data.locality, data.city, data.pincode].filter(Boolean);
          if (parts.length > 0) {
            setMapsLink(`https://maps.google.com/maps?q=${encodeURIComponent(parts.join(', '))}`);
          }
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, id]);

  const handleMapsLinkChange = useCallback((newLink: string) => {
    setMapsLink(newLink);
    if (mapsLinkDebounceRef.current) clearTimeout(mapsLinkDebounceRef.current);
    if (!builderId || !id) return;
    mapsLinkDebounceRef.current = setTimeout(async () => {
      setMapsSaving(true);
      try {
        await builderApi.updateProject(builderId, id, { googleMapsLink: newLink });
        setProject(prev => prev ? { ...prev, googleMapsLink: newLink } : prev);
      } catch { /* silent — link still usable without saving */ }
      finally { setMapsSaving(false); }
    }, 1200);
  }, [builderId, id]);

  useEffect(() => {
    if (activeTab !== 'Documents' || !builderId || !id) return;
    setDocsLoading(true);
    builderApi.getDocuments(builderId, id)
      .then(data => setDocuments((data as ProjectDocument[]) || []))
      .catch(() => setDocuments([]))
      .finally(() => setDocsLoading(false));
  }, [activeTab, builderId, id]);

  useEffect(() => {
    if (activeTab !== 'Updates' || !builderId || !id) return;
    setUpdatesLoading(true);
    builderApi.getProjectUpdates(builderId, id)
      .then(data => setUpdates((data as ProjectUpdate[]) || []))
      .catch(() => setUpdates([]))
      .finally(() => setUpdatesLoading(false));
  }, [activeTab, builderId, id]);

  const openUpdateForm = (u?: ProjectUpdate) => {
    setEditingUpdate(u ?? null);
    setUTitle(u?.title ?? '');
    setUContent(u?.content ?? '');
    setUType(u?.type ?? 'announcement');
    setUVisibleTo(u?.visibleTo ?? 'ALL');
    setShowUpdateForm(true);
  };

  const handleSaveUpdate = async () => {
    if (!uTitle.trim() || !uContent.trim() || !builderId || !id) return;
    setUSubmitting(true);
    try {
      if (editingUpdate) {
        const updated = await builderApi.editProjectUpdate(builderId, id, editingUpdate.id, {
          title: uTitle, content: uContent, type: uType, visibleTo: uVisibleTo,
        }) as ProjectUpdate;
        setUpdates(prev => prev.map(u => u.id === editingUpdate.id ? updated : u));
        toast.success('Update saved');
      } else {
        const created = await builderApi.createProjectUpdate(builderId, id, {
          title: uTitle, content: uContent, type: uType, visibleTo: uVisibleTo,
        }) as ProjectUpdate;
        setUpdates(prev => [created, ...prev]);
        toast.success('Update posted');
      }
      setShowUpdateForm(false);
    } catch { toast.error('Failed to save update'); }
    finally { setUSubmitting(false); }
  };

  const handleDeleteUpdate = async (updateId: number) => {
    if (!builderId || !id) return;
    try {
      await builderApi.deleteProjectUpdate(builderId, id, updateId);
      setUpdates(prev => prev.filter(u => u.id !== updateId));
      toast.success('Update deleted');
    } catch { toast.error('Failed to delete'); }
  };

  useEffect(() => {
    if (activeTab !== 'Brochure' || !builderId || !id) return;
    if (pdfUrl) return;
    setPdfLoading(true);
    setPdfError(null);
    builderApi.getProjectPdfUrl(builderId, id)
      .then(url => setPdfUrl(url))
      .catch(e => setPdfError(e instanceof Error ? e.message : 'Failed to generate PDF'))
      .finally(() => setPdfLoading(false));
  }, [activeTab, builderId, id, pdfUrl]);

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
      toast.success('Document uploaded');
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
        <div className="flex justify-center py-24"><Loader2 className="animate-spin text-teal-500" size={28} /></div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="px-8 py-10 max-w-7xl mx-auto space-y-4">
          <button onClick={() => navigate('/builder/projects')} className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={13} /> All projects
          </button>
          <p className="text-red-500">{error || 'Project not found.'}</p>
        </div>
      </DashboardLayout>
    );
  }

  const sm = STATUS_META[project.status] ?? { bg: '#f1f5f9', text: '#64748b', dot: '#94a3b8', label: project.status };
  const total = project.totalUnits ?? 0;
  const sold = project.soldUnits ?? 0;
  const booked = project.bookedUnits ?? 0;
  const available = project.availableUnits ?? Math.max(0, total - sold - booked);
  const hold = Math.max(0, total - sold - booked - available);
  const availPct = total > 0 ? Math.round((available / total) * 100) : 0;
  const priceMin = project.priceMin ?? 0;
  const priceMax = project.priceMax ?? priceMin;
  const avgPrice = (priceMin + priceMax) / 2;
  const revenue = (sold + booked) * avgPrice;
  const targetRevenue = total * avgPrice;

  // ── Design tokens (matches CustomerProjectDetail sage palette) ──────────────
  const T = {
    ink:     '#0E1411',
    ink2:    '#1F2925',
    muted:   '#8E948F',
    line:    '#ECECE7',
    bg:      '#FFFFFF',
    bg2:     '#FAFAF8',
    bg3:     '#F4F4EF',
    bgCream: '#F6F2EA',
    accent:  '#D8E5DA',
    aInk:    '#3C5A45',
    aDeep:   '#2B4232',
    aTint:   '#EEF3EF',
    sand:    '#F1E9DA',
    sandInk: '#7A5E2F',
    serif:   '"Fraunces", "Georgia", "Times New Roman", serif',
    mono:    '"Geist Mono", ui-monospace, monospace',
  };

  const sk = {
    fontFamily: T.mono, fontSize: '10.5px', letterSpacing: '0.16em',
    color: T.muted, textTransform: 'uppercase' as const, fontWeight: 500,
  };
  const secH2 = {
    margin: '8px 0 0', fontFamily: T.serif, fontSize: 'clamp(28px, 3.5vw, 42px)',
    fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.025em',
  };

  const fmtP = (n?: number | null) => {
    if (!n) return '—';
    if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
    if (n >= 100_000)    return `₹${(n / 100_000).toFixed(0)} L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  return (
    <DashboardLayout>
      <div style={{ background: T.bg, minHeight: '100vh' }}>

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 28px 0' }}>

          {/* Nav row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <button onClick={() => navigate('/builder/projects')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 13, padding: 0 }}>
              <ArrowLeft size={14} /> All projects
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigate('/builder/cp-performance')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, border: `1px solid ${T.line}`, background: T.bg, color: T.ink2, cursor: 'pointer' }}>
                CP Performance
              </button>
              <button onClick={() => navigate(`/builder/projects/${id}/edit`)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, border: `1px solid ${T.line}`, background: T.bg, color: T.ink2, cursor: 'pointer' }}>
                <Pencil size={11} /> Edit project
              </button>
            </div>
          </div>

          {/* Tag row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22, alignItems: 'center' }}>
            {project.reraNumber && (
              <span style={{ background: T.aTint, color: T.aInk, border: `1px solid ${T.accent}`, fontSize: 11.5, padding: '5px 12px', borderRadius: 999, fontWeight: 500, fontFamily: T.mono, letterSpacing: '0.04em' }}>
                RERA · {project.reraNumber.slice(0, 18)}{project.reraNumber.length > 18 ? '…' : ''}
              </span>
            )}
            <span style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 999, fontWeight: 500, background: sm.bg, color: sm.text, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: sm.dot, display: 'inline-block' }} />
              {sm.label}
            </span>
            <span style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 999, fontWeight: 500, background: project.published ? '#dcfce7' : '#fef3c7', color: project.published ? '#16a34a' : '#d97706', display: 'flex', alignItems: 'center', gap: 4 }}>
              {project.published ? <Eye size={10} /> : <EyeOff size={10} />}
              {project.published ? 'Live' : 'Draft'}
            </span>
            {project.featured && (
              <span style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 999, fontWeight: 500, background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={10} fill="currentColor" /> Featured
              </span>
            )}
            {project.closingSoon && (
              <span style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 999, fontWeight: 500, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={10} /> Closing Soon
              </span>
            )}
          </div>

          {/* Project title */}
          <h1 style={{ fontFamily: T.serif, fontSize: 'clamp(42px, 6vw, 84px)', fontWeight: 300, lineHeight: 0.96, letterSpacing: '-0.03em', color: T.ink, margin: '0 0 18px' }}>
            <em style={{ fontStyle: 'italic', color: T.aInk }}>{project.name}</em>
          </h1>

          {/* Description subtitle */}
          {project.description && (
            <p style={{ marginTop: 0, fontFamily: T.serif, fontSize: 'clamp(16px, 1.6vw, 20px)', fontWeight: 300, fontStyle: 'italic', color: T.ink2, lineHeight: 1.45, maxWidth: 680, marginBottom: 22 }}>
              {project.description.length > 200 ? project.description.slice(0, 200).replace(/\s\S+$/, '') + '…' : project.description}
            </p>
          )}

          {/* Meta row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, fontSize: 13.5, color: T.ink2, marginBottom: 28, alignItems: 'center' }}>
            {project.configurations && project.configurations.length > 0 && (
              <span><b>{project.configurations.join(', ')}</b></span>
            )}
            {project.locality && (
              <><span style={{ margin: '0 12px', color: T.line }}>|</span><span><b>{project.locality}</b>{project.city ? `, ${project.city}` : ''}</span></>
            )}
            {project.possessionDate && (
              <><span style={{ margin: '0 12px', color: T.line }}>|</span><span>Possession <b>{project.possessionDate.slice(0, 7)}</b></span></>
            )}
            {project.totalUnits != null && (
              <><span style={{ margin: '0 12px', color: T.line }}>|</span><span><b>{project.totalUnits}</b> total homes</span></>
            )}
          </div>

          {/* Hero image */}
          <div style={{ position: 'relative', height: 360, borderRadius: 24, overflow: 'hidden', background: `linear-gradient(160deg, ${T.aInk} 0%, #0f766e 40%, #134e4a 100%)` }}>
            {project.imageUrl ? (
              <img src={project.imageUrl} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <ProjectPlaceholder seed={project.id} name={project.name} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(14,20,17,0.5) 0%, transparent 55%)' }} />
            <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            <button onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}
              style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', color: '#fff', border: 'none', cursor: 'pointer', opacity: uploadingImage ? 0.6 : 1 }}>
              {uploadingImage ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={12} />}
              {project.imageUrl ? 'Change image' : 'Add image'}
            </button>
            {project.city && (
              <div style={{ position: 'absolute', bottom: 14, left: 14, background: 'rgba(14,20,17,0.6)', backdropFilter: 'blur(8px)', color: '#fff', padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500 }}>
                {project.locality ?? project.city}{project.floorsPerTower ? ` · ${project.floorsPerTower} floors` : ''}
              </div>
            )}
          </div>
        </section>

        {/* ── STICKY INFO BAR ───────────────────────────────────────────────── */}
        <div style={{ position: 'sticky', top: 0, zIndex: 30, maxWidth: 1280, margin: '18px auto 0', padding: '0 28px' }}>
          <div style={{ background: T.ink, color: '#fff', borderRadius: 16, padding: '14px 22px', display: 'grid', gridTemplateColumns: 'auto auto 1fr auto auto', gap: 20, alignItems: 'center', boxShadow: '0 8px 24px rgba(14,20,17,0.22)' }}>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Min Price</div>
              <div style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 300, letterSpacing: '-0.01em', marginTop: 2 }}>
                {fmtP(project.priceMin)}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: 20, lineHeight: 1.1 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Total Units</div>
              <div style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 300, marginTop: 2 }}>{project.totalUnits ?? '—'}</div>
            </div>
            {project.reraNumber && (
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: 20, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                RERA <b style={{ color: '#fff', fontFamily: T.mono, fontSize: 11 }}>{project.reraNumber.slice(0, 20)}</b>
              </div>
            )}
            <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: project.published ? T.accent : '#f59e0b' }}>
              {project.published ? <Eye size={12} /> : <EyeOff size={12} />}
              {project.published ? 'Live' : 'Draft'}
            </div>
            <button onClick={() => navigate(`/builder/projects/${id}/edit`)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: T.accent, color: T.aDeep, border: 'none', padding: '9px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>
              <Pencil size={11} /> Edit
            </button>
          </div>
        </div>

        {/* ── HIGHLIGHTS STRIP ──────────────────────────────────────────────── */}
        <section style={{ maxWidth: 1280, margin: '64px auto 0', padding: '0 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 22 }}>
            {[
              { lbl: 'Total Units',  val: String(total),     sub: `${booked + sold} claimed` },
              { lbl: 'Available',    val: String(available),  sub: `${availPct}% remaining` },
              { lbl: 'Revenue',      val: avgPrice > 0 && total > 0 ? fmtP(Math.round(revenue)) : '—', sub: targetRevenue > 0 ? `of ${fmtP(Math.round(targetRevenue))} target` : 'No price data' },
              { lbl: 'Possession',   val: project.possessionDate ? project.possessionDate.slice(0, 7) : '—', sub: project.status?.replace(/_/g, ' ') ?? '' },
            ].map(s => (
              <div key={s.lbl} style={{ borderTop: `2px solid ${T.ink}`, paddingTop: 14 }}>
                <div style={{ ...sk, marginBottom: 6 }}>{s.lbl}</div>
                <div style={{ fontFamily: T.serif, fontSize: 38, fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em', color: T.ink }}>{s.val}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 6, lineHeight: 1.4 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TAB BAR ───────────────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1280, margin: '40px auto 0', padding: '0 28px' }}>
          <div style={{ display: 'inline-flex', background: T.bg3, borderRadius: 999, padding: 4, gap: 2, border: `1px solid ${T.line}` }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ padding: '9px 20px', borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: activeTab === t ? T.ink : 'transparent', color: activeTab === t ? '#fff' : T.muted, transition: 'all .14s ease' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ══ OVERVIEW TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'Overview' && (
          <div style={{ maxWidth: 1280, margin: '40px auto 0', padding: '0 28px 80px' }}>

            {/* 4-col highlights */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
              {[
                { lbl: 'BOOKED',    val: booked, bg: '#fef3c7', fg: '#d97706' },
                { lbl: 'SOLD',      val: sold,   bg: '#fee2e2', fg: '#dc2626' },
                { lbl: 'HOLD',      val: Math.max(0, total - sold - booked - available), bg: '#f3f4f6', fg: '#6b7280' },
                { lbl: 'AVAILABLE', val: available, bg: T.aTint, fg: T.aInk },
              ].map(s => (
                <div key={s.lbl} style={{ padding: '20px 22px', borderRadius: 20, background: s.bg, border: `1px solid ${T.line}` }}>
                  <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', color: s.fg, textTransform: 'uppercase' as const, marginBottom: 8, fontWeight: 600 }}>{s.lbl}</div>
                  <div style={{ fontFamily: T.serif, fontSize: 36, fontWeight: 300, lineHeight: 1, color: T.ink }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Revenue progress */}
            {avgPrice > 0 && total > 0 && (
              <div style={{ background: T.bg2, borderRadius: 20, padding: '24px 28px', marginBottom: 32, border: `1px solid ${T.line}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                  <div style={{ ...sk }}>Revenue Progress</div>
                  <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600, color: T.ink }}>
                    {fmtP(Math.round(revenue))} <span style={{ color: T.muted, fontWeight: 400 }}>of {fmtP(Math.round(targetRevenue))}</span>
                  </span>
                </div>
                <div style={{ height: 8, background: T.line, borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${targetRevenue > 0 ? Math.min(100, (revenue / targetRevenue) * 100) : 0}%`, height: '100%', background: T.aDeep, borderRadius: 999, transition: 'width .4s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11.5, color: T.muted, fontFamily: T.mono }}>
                  <span>0</span>
                  <span>{Math.round(targetRevenue > 0 ? (revenue / targetRevenue) * 100 : 0)}% collected</span>
                  <span>{fmtP(Math.round(targetRevenue))}</span>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>

              {/* Left: Identity + Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 22, padding: '28px 30px' }}>
                  <div style={{ ...sk, marginBottom: 20 }}>Project Identity</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 28px' }}>
                    {[
                      { l: 'Type',          v: project.projectType?.replace(/_/g, ' ') },
                      { l: 'Configurations', v: project.configurations?.join(', ') },
                      { l: 'Total Units',   v: project.totalUnits != null ? String(project.totalUnits) : null },
                      { l: 'Towers',        v: project.towers != null ? String(project.towers) : null },
                      { l: 'Floors/Tower',  v: project.floorsPerTower != null ? String(project.floorsPerTower) : null },
                      { l: 'RERA Number',   v: project.reraNumber },
                      { l: 'RERA Expiry',   v: project.reraExpiry },
                      { l: 'Possession',    v: project.possessionDate },
                    ].filter(r => r.v).map(r => (
                      <div key={r.l}>
                        <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: T.muted, marginBottom: 3, fontWeight: 600 }}>{r.l}</div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: T.ink, lineHeight: 1.3 }}>{r.v}</div>
                      </div>
                    ))}
                  </div>
                  {project.description && (
                    <div style={{ marginTop: 22, paddingTop: 20, borderTop: `1px solid ${T.line}` }}>
                      <div style={{ ...sk, marginBottom: 8 }}>Description</div>
                      <p style={{ fontSize: 13.5, color: T.ink2, lineHeight: 1.6, margin: 0 }}>{project.description}</p>
                    </div>
                  )}
                </div>

                {/* Pricing card */}
                <div style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 22, padding: '28px 30px' }}>
                  <div style={{ ...sk, marginBottom: 20 }}>Pricing</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px 20px' }}>
                    {[
                      { l: 'Min Price',   v: project.priceMin ? fmtP(project.priceMin) : null },
                      { l: 'Max Price',   v: project.priceMax ? fmtP(project.priceMax) : null },
                      { l: '₹/sqft Min', v: project.pricePerSqftMin != null ? `₹${project.pricePerSqftMin.toLocaleString('en-IN')}` : null },
                      { l: '₹/sqft Max', v: project.pricePerSqftMax != null ? `₹${project.pricePerSqftMax.toLocaleString('en-IN')}` : null },
                      { l: 'Maintenance', v: project.maintenanceCharges != null ? `₹${project.maintenanceCharges}/sqft/mo` : null },
                      { l: 'Floor Rise',  v: project.floorRiseCharges != null ? `₹${project.floorRiseCharges}/floor` : null },
                    ].filter(r => r.v).map(r => (
                      <div key={r.l} style={{ padding: '14px 16px', background: T.bg2, borderRadius: 14, border: `1px solid ${T.line}` }}>
                        <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: T.muted, marginBottom: 5, fontWeight: 600 }}>{r.l}</div>
                        <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 300, color: T.ink }}>{r.v}</div>
                      </div>
                    ))}
                  </div>
                  {project.commissionValue != null && (
                    <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${T.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ ...sk, marginBottom: 3 }}>Commission</div>
                        <div style={{ fontSize: 14, color: T.ink, fontWeight: 500 }}>{project.commissionValue}%{project.commissionStructure ? ` · ${project.commissionStructure}` : ''}</div>
                      </div>
                      {project.videoUrl && (
                        <a href={project.videoUrl} target="_blank" rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.aInk, fontSize: 13, fontWeight: 600, textDecoration: 'none', padding: '7px 14px', borderRadius: 999, background: T.aTint, border: `1px solid ${T.accent}` }}>
                          <ExternalLink size={11} /> Watch video
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: flags + publish status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Status flags card */}
                <div style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 22, padding: '28px 30px' }}>
                  <div style={{ ...sk, marginBottom: 20 }}>Project Status</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      { label: 'Published (Live)', active: project.published, icon: project.published ? <Eye size={14} /> : <EyeOff size={14} />, activeColor: '#16a34a' },
                      { label: 'Featured',         active: project.featured,  icon: <Star size={14} fill={project.featured ? 'currentColor' : 'none'} />, activeColor: '#0d9488' },
                      { label: 'Closing Soon',     active: project.closingSoon, icon: <Clock size={14} />, activeColor: '#d97706' },
                    ].map(f => (
                      <div key={f.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 14, background: f.active ? `${f.activeColor}12` : T.bg2, border: `1px solid ${f.active ? f.activeColor + '30' : T.line}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 500, color: f.active ? f.activeColor : T.muted }}>
                          {f.icon} {f.label}
                        </div>
                        <span style={{ fontFamily: T.mono, fontSize: 10.5, fontWeight: 700, color: f.active ? f.activeColor : T.muted, letterSpacing: '0.08em' }}>
                          {f.active ? 'YES' : 'NO'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                {!!project.amenities?.length && (
                  <div style={{ background: T.ink, borderRadius: 22, padding: '28px 30px' }}>
                    <div style={{ ...sk, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>Amenities</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {project.amenities.map(a => (
                        <span key={a} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.1)' }}>{a}</span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Location */}
            <div style={{ marginTop: 32, background: T.bg, border: `1px solid ${T.line}`, borderRadius: 22 }}>
              <div style={{ padding: '28px 30px 20px', borderBottom: `1px solid ${T.line}` }}>
                <div style={{ ...sk, marginBottom: 16 }}>Location</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px 20px' }}>
                  {[
                    { l: 'Address',  v: project.address },
                    { l: 'City',     v: project.city },
                    { l: 'Locality', v: project.locality },
                    { l: 'Pincode',  v: project.pincode },
                    { l: 'Landmark', v: project.landmark ? `Near ${project.landmark}` : null },
                  ].filter(r => r.v).map(r => (
                    <div key={r.l}>
                      <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: T.muted, marginBottom: 3, fontWeight: 600 }}>{r.l}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: T.ink }}>{r.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: '24px 30px 30px' }}>
                {mapsSaving && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 11, color: T.muted }}>
                    <Loader2 size={11} className="animate-spin" /> Saving location link…
                  </div>
                )}
                <GoogleMapsLocationField
                  value={mapsLink}
                  onChange={handleMapsLinkChange}
                  address={[project.address, project.locality].filter(Boolean).join(', ')}
                  city={project.city ?? ''}
                />
              </div>
            </div>
          </div>
        )}

        {/* ══ UNITS TAB ═════════════════════════════════════════════════════════ */}
        {activeTab === 'Units' && (
          <div style={{ maxWidth: 1280, margin: '40px auto 0', padding: '0 28px 80px' }}>
            <div style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 22, padding: '32px 36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                  <div style={{ ...sk, marginBottom: 8 }}>Unit Inventory</div>
                  <h2 style={{ ...secH2, margin: 0 }}><em style={{ fontStyle: 'italic', color: T.aInk }}>{project.name}</em></h2>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { lbl: 'Available', val: available, color: '#16a34a', bg: '#dcfce7' },
                    { lbl: 'Booked',    val: booked,    color: '#d97706', bg: '#fef3c7' },
                    { lbl: 'Sold',      val: sold,      color: '#dc2626', bg: '#fee2e2' },
                  ].map(s => (
                    <div key={s.lbl} style={{ textAlign: 'center', padding: '10px 18px', borderRadius: 14, background: s.bg }}>
                      <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 300, color: T.ink }}>{s.val}</div>
                      <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: s.color, fontWeight: 600, marginTop: 2 }}>{s.lbl}</div>
                    </div>
                  ))}
                </div>
              </div>

              {total > 0 ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 8, marginBottom: 24 }}>
                    {Array.from({ length: Math.min(total, 60) }, (_, i) => {
                      const status = i < sold ? 'sold' : i < sold + booked ? 'booked' : 'available';
                      const colors: Record<string, string> = { sold: '#dc2626', booked: '#f59e0b', available: T.aInk };
                      const bgs:    Record<string, string> = { sold: '#fee2e2', booked: '#fef3c7', available: T.aTint };
                      return (
                        <div key={i} style={{ aspectRatio: '1', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontFamily: T.mono, fontWeight: 600, background: bgs[status], color: colors[status], border: `1px solid ${colors[status]}30` }}>
                          {i + 1}
                        </div>
                      );
                    })}
                  </div>
                  {total > 60 && (
                    <p style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Showing first 60 of {total} units</p>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <Building2 size={36} style={{ color: T.line, display: 'block', margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 13.5, color: T.muted }}>No unit data. Click "Edit project" to add unit counts.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ DOCUMENTS TAB ═════════════════════════════════════════════════════ */}
        {activeTab === 'Documents' && (
          <div style={{ maxWidth: 1280, margin: '40px auto 0', padding: '0 28px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Upload card */}
            <div style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 22, padding: '28px 30px' }}>
              <div style={{ ...sk, marginBottom: 18 }}>Upload Document</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, alignItems: 'center' }}>
                <select value={uploadDocType} onChange={e => setUploadDocType(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 12, border: `1px solid ${T.line}`, background: T.bg2, fontSize: 13, color: T.ink2, outline: 'none', cursor: 'pointer' }}>
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFileChange} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, background: T.aInk, color: '#fff', border: 'none', cursor: 'pointer', opacity: uploading ? 0.6 : 1 }}>
                  {uploading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={13} />}
                  {uploading ? 'Uploading…' : 'Choose & Upload'}
                </button>
              </div>
              <p style={{ fontSize: 11.5, color: T.muted, marginTop: 10 }}>Supported: PDF, DOC, JPG, PNG</p>
            </div>

            {/* Documents list */}
            <div style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 22, padding: '28px 30px' }}>
              <div style={{ ...sk, marginBottom: 20 }}>Project Documents</div>
              {docsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                  <Loader2 size={22} style={{ color: T.muted, animation: 'spin 1s linear infinite' }} />
                </div>
              ) : documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <FileText size={32} style={{ color: T.line, display: 'block', margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 13.5, color: T.muted }}>No documents uploaded yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {documents.map(doc => (
                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: T.bg2, borderRadius: 14, border: `1px solid ${T.line}` }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: T.aTint, color: T.aInk, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <FileText size={15} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{doc.fileName || doc.docType}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11.5, color: T.muted }}>
                          {doc.docType} · {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-IN') : ''}
                        </p>
                      </div>
                      {doc.fileUrl && (
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, border: `1px solid ${T.line}`, color: T.ink2, textDecoration: 'none', background: T.bg }}>
                            <ExternalLink size={11} /> View
                          </a>
                          <a href={doc.fileUrl} download
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, background: T.aTint, color: T.aInk, textDecoration: 'none', border: `1px solid ${T.accent}` }}>
                            <Download size={11} /> Download
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ UPDATES TAB ═══════════════════════════════════════════════════════ */}
        {activeTab === 'Updates' && (
          <div style={{ maxWidth: 900, margin: '40px auto 0', padding: '0 28px 80px' }}>

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ ...sk, marginBottom: 4 }}>Project Updates</div>
                <p style={{ fontSize: 13.5, color: T.muted, margin: 0 }}>
                  Post updates visible to CPs, customers, or internal team.
                </p>
              </div>
              <button onClick={() => openUpdateForm()}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 10, background: T.ink, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <Plus size={14} /> Post Update
              </button>
            </div>

            {/* Create / Edit form */}
            {showUpdateForm && (
              <div style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 16, padding: '24px', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: T.ink, margin: 0 }}>
                    {editingUpdate ? 'Edit Update' : 'New Project Update'}
                  </p>
                  <button onClick={() => setShowUpdateForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}>
                    <X size={16} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ ...sk, display: 'block', marginBottom: 6 }}>Update Type</label>
                    <select value={uType} onChange={e => setUType(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1px solid ${T.line}`, fontSize: 13, color: T.ink, background: T.bg }}>
                      {UPDATE_TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...sk, display: 'block', marginBottom: 6 }}>Visible To</label>
                    <select value={uVisibleTo} onChange={e => setUVisibleTo(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1px solid ${T.line}`, fontSize: 13, color: T.ink, background: T.bg }}>
                      {VISIBLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ ...sk, display: 'block', marginBottom: 6 }}>Title</label>
                  <input value={uTitle} onChange={e => setUTitle(e.target.value)}
                    placeholder="e.g. Slab casting completed for Tower A"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1px solid ${T.line}`, fontSize: 13, color: T.ink, background: T.bg, boxSizing: 'border-box' as const }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ ...sk, display: 'block', marginBottom: 6 }}>Content</label>
                  <textarea value={uContent} onChange={e => setUContent(e.target.value)} rows={3}
                    placeholder="Describe the update in detail…"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1px solid ${T.line}`, fontSize: 13, color: T.ink, background: T.bg, resize: 'vertical' as const, boxSizing: 'border-box' as const }} />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowUpdateForm(false)}
                    style={{ padding: '9px 20px', borderRadius: 10, border: `1px solid ${T.line}`, background: T.bg, color: T.muted, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                    Cancel
                  </button>
                  <button onClick={handleSaveUpdate} disabled={uSubmitting || !uTitle.trim() || !uContent.trim()}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 22px', borderRadius: 10, background: T.aInk, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: (uSubmitting || !uTitle.trim() || !uContent.trim()) ? 0.5 : 1 }}>
                    {uSubmitting ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                    {editingUpdate ? 'Save Changes' : 'Post Update'}
                  </button>
                </div>
              </div>
            )}

            {/* Updates table */}
            {updatesLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <Loader2 size={26} style={{ color: T.aInk, animation: 'spin 1s linear infinite' }} />
              </div>
            ) : updates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: T.muted }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <p style={{ fontWeight: 600, fontSize: 14, color: T.ink2, marginBottom: 6 }}>No updates posted yet</p>
                <p style={{ fontSize: 13, color: T.muted }}>Post your first update to keep CPs and customers informed.</p>
              </div>
            ) : (
              <div style={{ border: `1px solid ${T.line}`, borderRadius: 16, overflow: 'hidden' }}>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', padding: '11px 20px', background: T.ink, gap: 12 }}>
                  {['Title', 'Type', 'Visible To', 'Posted', ''].map((h, i) => (
                    <div key={i} style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.45)', textAlign: i === 4 ? 'right' as const : 'left' as const }}>
                      {h}
                    </div>
                  ))}
                </div>
                {/* Rows */}
                {updates.map((u, i) => (
                  <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', padding: '14px 20px', gap: 12, borderTop: i > 0 ? `1px solid ${T.line}` : 'none', alignItems: 'center', background: T.bg }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.ink, margin: '0 0 3px' }}>{u.title}</p>
                      <p style={{ fontSize: 11.5, color: T.muted, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{u.content}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 14 }}>{updateEmoji(u.type)}</span>
                      <span style={{ fontSize: 11.5, color: T.ink2, fontWeight: 500 }}>{updateTypeLabel(u.type)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Users size={11} style={{ color: T.accent, flexShrink: 0 }} />
                      <span style={{ fontSize: 11.5, color: T.ink2 }}>{visibleLabel(u.visibleTo)}</span>
                    </div>
                    <span style={{ fontSize: 11.5, color: T.muted }}>
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => openUpdateForm(u)}
                        style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${T.line}`, background: T.bg, cursor: 'pointer', color: T.muted, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 500 }}>
                        <Edit2 size={11} /> Edit
                      </button>
                      <button onClick={() => handleDeleteUpdate(u.id)}
                        style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 500 }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ BROCHURE TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'Brochure' && (
          <div style={{ maxWidth: 1280, margin: '40px auto 0', padding: '0 28px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ ...sk, marginBottom: 6 }}>Project Brochure PDF</div>
                <p style={{ fontSize: 13.5, color: T.muted, margin: 0 }}>Auto-generated from your project details</p>
              </div>
              {pdfUrl && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={pdfUrl} download={`${project.name}_brochure.pdf`}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, border: `1px solid ${T.line}`, color: T.ink2, textDecoration: 'none', background: T.bg }}>
                    <Download size={13} /> Download
                  </a>
                  <button onClick={() => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); setPdfUrl(null); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, border: `1px solid ${T.line}`, color: T.muted, background: T.bg, cursor: 'pointer' }}>
                    Regenerate
                  </button>
                </div>
              )}
            </div>

            {pdfLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 14 }}>
                <Loader2 size={26} style={{ color: T.aInk, animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: 13.5, color: T.muted }}>Generating PDF brochure…</p>
              </div>
            )}

            {pdfError && (
              <div style={{ textAlign: 'center', padding: '60px 0', border: `1px dashed ${T.line}`, borderRadius: 22 }}>
                <FileText size={34} style={{ color: T.line, display: 'block', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 13.5, color: '#dc2626', marginBottom: 16 }}>{pdfError}</p>
                <button onClick={() => { setPdfError(null); setPdfUrl(null); }}
                  style={{ padding: '10px 22px', borderRadius: 12, fontSize: 13, fontWeight: 600, background: T.aInk, color: '#fff', border: 'none', cursor: 'pointer' }}>
                  Try Again
                </button>
              </div>
            )}

            {pdfUrl && !pdfLoading && (
              <div style={{ borderRadius: 22, overflow: 'hidden', border: `1px solid ${T.line}`, height: '75vh' }}>
                <iframe src={pdfUrl} style={{ width: '100%', height: '100%', border: 0, display: 'block' }} title="Project Brochure" />
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default BuilderProjectDetail;