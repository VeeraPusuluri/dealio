import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { builderApi } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import {
  Building2, MapPin, ArrowLeft, FileText, Loader2,
  Pencil, Upload, ExternalLink, Download, Eye, EyeOff,
  CheckCircle2, Star, Clock, Shield,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import ProjectPlaceholder from '@/components/shared/ProjectPlaceholder';

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

const tabs = ['Overview', 'Units', 'Documents', 'Brochure'] as const;

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
  const [builderId, setBuilderId] = useState<string | null>(null);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

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
  const priceMin = project.priceMin ?? 0;
  const priceMax = project.priceMax ?? priceMin;
  const avgPrice = (priceMin + priceMax) / 2;
  const revenue = sold * avgPrice;
  const targetRevenue = total * avgPrice;

  return (
    <DashboardLayout>
      <div className="px-8 py-10 max-w-7xl mx-auto space-y-7">

        {/* ── Nav bar ── */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/builder/projects')}
            className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft size={13} /> All projects
          </button>
          <button onClick={() => navigate(`/builder/projects/${id}/edit`)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            <Pencil size={11} /> Edit project
          </button>
        </div>

        {/* ── Editorial header ── */}
        <div>
          <h1 className="text-[36px] font-bold text-gray-900 leading-[1.05] mb-3">
            <em style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', color: '#0d9488', fontWeight: 400 }}>
              {project.name}
            </em>
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
              style={{ backgroundColor: sm.bg, color: sm.text }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sm.dot }} />
              {sm.label}
            </span>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${project.published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {project.published ? <Eye size={10} /> : <EyeOff size={10} />}
              {project.published ? 'Live' : 'Draft'}
            </span>
            {project.reraNumber && (
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 size={11} /> RERA {project.reraNumber}
              </span>
            )}
            {project.featured && (
              <span className="text-[11px] bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                <Star size={10} fill="currentColor" /> Featured
              </span>
            )}
            {project.closingSoon && (
              <span className="text-[11px] bg-red-100 text-red-700 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                <Clock size={10} /> Closing Soon
              </span>
            )}
          </div>
        </div>

        {/* ── Hero image ── */}
        <div className="relative h-72 rounded-3xl overflow-hidden bg-gray-100">
          {project.imageUrl ? (
            <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover" />
          ) : (
            <ProjectPlaceholder seed={project.id} name={project.name} />
          )}
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <button onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-black/60 text-white hover:bg-black/75 transition-colors disabled:opacity-50">
            {uploadingImage ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {project.imageUrl ? 'Change image' : 'Add image'}
          </button>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'TOTAL UNITS', value: total,     dot: '#0d9488' },
            { label: 'AVAILABLE',   value: available,  dot: '#16a34a' },
            { label: 'BOOKED',      value: booked,     dot: '#f59e0b' },
            { label: 'SOLD',        value: sold,       dot: '#dc2626' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-3xl border border-gray-100/80 p-5"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{s.label}</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Tab bar ── */}
        <div className="flex items-center gap-0.5">
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                activeTab === t ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW TAB ══ */}
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-3 gap-5">

            {/* Project Identity */}
            <div className="col-span-2 bg-white rounded-3xl border border-gray-100/80 p-7"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-5">Project Identity</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <InfoRow label="Project Type" value={project.projectType?.replace(/_/g, ' ')} />
                <InfoRow label="Configurations" value={project.configurations?.join(', ')} />
                <InfoRow label="Total Units" value={project.totalUnits} />
                <InfoRow label="Towers" value={project.towers} />
                <InfoRow label="Floors per Tower" value={project.floorsPerTower} />
                <InfoRow label="RERA Number" value={project.reraNumber} />
                <InfoRow label="RERA Expiry" value={project.reraExpiry} />
              </div>
              {project.description && (
                <div className="mt-6 pt-5 border-t border-gray-50">
                  <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-2">Description</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{project.description}</p>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Key dates & commission */}
              <div className="bg-white rounded-3xl border border-gray-100/80 p-6"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-4">Key Info</p>
                <div className="space-y-4">
                  <InfoRow label="Possession Date" value={project.possessionDate} />
                  {project.commissionValue != null && (
                    <InfoRow label="Commission" value={`${project.commissionValue}%`} />
                  )}
                  {project.commissionStructure && (
                    <InfoRow label="Commission Type" value={project.commissionStructure} />
                  )}
                  {project.videoUrl && (
                    <div>
                      <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-0.5">Video</p>
                      <a href={project.videoUrl} target="_blank" rel="noreferrer"
                        className="text-sm text-teal-600 font-semibold hover:underline flex items-center gap-1">
                        <ExternalLink size={11} /> Watch video
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Flags */}
              <div className="bg-white rounded-3xl border border-gray-100/80 p-6"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-3">Flags</p>
                <div className="divide-y divide-gray-50">
                  <FlagPill label="Published (Live)" active={project.published} activeColor="#16a34a" />
                  <FlagPill label="Featured" active={project.featured} activeColor="#0d9488" />
                  <FlagPill label="Closing Soon" active={project.closingSoon} activeColor="#d97706" />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="col-span-3 bg-white rounded-3xl border border-gray-100/80 p-7"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-5">Pricing</p>
              <div className="grid grid-cols-6 gap-6">
                <InfoRow label="Min Price" value={project.priceMin ? formatCurrency(project.priceMin) : '—'} />
                <InfoRow label="Max Price" value={project.priceMax ? formatCurrency(project.priceMax) : '—'} />
                {project.pricePerSqftMin != null && (
                  <InfoRow label="₹/sqft (min)" value={`₹${project.pricePerSqftMin.toLocaleString('en-IN')}`} />
                )}
                {project.pricePerSqftMax != null && (
                  <InfoRow label="₹/sqft (max)" value={`₹${project.pricePerSqftMax.toLocaleString('en-IN')}`} />
                )}
                {project.maintenanceCharges != null && (
                  <InfoRow label="Maintenance" value={`₹${project.maintenanceCharges}/sqft/mo`} />
                )}
                {project.floorRiseCharges != null && (
                  <InfoRow label="Floor Rise" value={`₹${project.floorRiseCharges}/floor`} />
                )}
              </div>

              {avgPrice > 0 && total > 0 && (
                <div className="mt-6 pt-5 border-t border-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Revenue Progress</span>
                    <span className="text-sm font-bold text-gray-700">
                      {formatCurrency(revenue)} of {formatCurrency(targetRevenue)}
                    </span>
                  </div>
                  <Progress value={targetRevenue > 0 ? (revenue / targetRevenue) * 100 : 0} className="h-2" />
                </div>
              )}
            </div>

            {/* Location */}
              file:///Users/veerapusuluru/Downloads/Prestige%20Skyline%20·%20Gachibowli,%20Hyderabad.html            <div className="col-span-3 bg-white rounded-3xl border border-gray-100/80 overflow-hidden"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div className="p-7 pb-5">
                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-5">Location</p>
                <div className="grid grid-cols-4 gap-6">
                  <InfoRow label="Address" value={project.address} />
                  <InfoRow label="City" value={project.city} />
                  <InfoRow label="Locality" value={project.locality} />
                  <InfoRow label="Pincode" value={project.pincode} />
                  {project.landmark && <InfoRow label="Landmark" value={`Near ${project.landmark}`} />}
                </div>
              </div>
              {/* Map preview */}
              {(project.googleMapsLink || (project.address && project.city)) && (() => {
                const link = project.googleMapsLink ?? '';
                const pin  = link.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
                const at   = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                const q    = [project.address, project.locality, project.city].filter(Boolean).join(', ');
                const src  = pin
                  ? `https://maps.google.com/maps?q=${pin[1]},${pin[2]}&z=17&output=embed`
                  : at
                    ? `https://maps.google.com/maps?q=${at[1]},${at[2]}&z=17&output=embed`
                    : `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
                return (
                  <>
                    <iframe
                      title="Project Location"
                      width="100%"
                      height="300"
                      loading="lazy"
                      src={src}
                      className="border-0 block"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                    <div className="px-7 py-3 flex items-center gap-3 bg-gray-50 border-t border-gray-100">
                      <MapPin size={11} className="text-teal-500 shrink-0" />
                      <span className="text-[11px] text-gray-500 flex-1 truncate">
                        {[project.address, project.city].filter(Boolean).join(', ')}
                      </span>
                      {project.googleMapsLink && (
                        <a href={project.googleMapsLink} target="_blank" rel="noreferrer"
                          className="shrink-0 text-[11px] text-teal-600 font-semibold hover:underline flex items-center gap-1">
                          <ExternalLink size={10} /> Open in Maps
                        </a>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Amenities */}
            {!!project.amenities?.length && (
              <div className={`${project.nearbyHighlights?.length ? 'col-span-2' : 'col-span-3'} bg-white rounded-3xl border border-gray-100/80 p-7`}
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-4">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {project.amenities.map(a => (
                    <span key={a} className="text-xs px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 border border-gray-100 font-medium">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby Highlights */}
            {!!project.nearbyHighlights?.length && (
              <div className="col-span-1 bg-white rounded-3xl border border-gray-100/80 p-7"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-4">Nearby</p>
                <div className="flex flex-wrap gap-2">
                  {project.nearbyHighlights.map(n => (
                    <span key={n} className="text-xs px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100 font-medium flex items-center gap-1">
                      <MapPin size={9} /> {n}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ UNITS TAB ══ */}
        {activeTab === 'Units' && (
          <div className="bg-white rounded-3xl border border-gray-100/80 p-7"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-5">Unit Inventory — {project.name}</p>
            {total > 0 ? (
              <>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-5">
                  {Array.from({ length: Math.min(total, 50) }, (_, i) => {
                    const status = i < sold ? 'Sold' : i < sold + booked ? 'Booked' : 'Available';
                    const colors: Record<string, string> = { Sold: '#dc2626', Booked: '#f59e0b', Available: '#16a34a' };
                    return (
                      <div key={i} className="aspect-square rounded-xl flex items-center justify-center text-[10px] text-white font-bold"
                        style={{ backgroundColor: colors[status] }}>
                        {i + 1}
                      </div>
                    );
                  })}
                </div>
                {total > 50 && <p className="text-xs text-gray-400 mb-4">Showing first 50 of {total} units</p>}
                <div className="flex gap-5">
                  <span className="text-xs flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: '#16a34a' }} /> Available ({available})
                  </span>
                  <span className="text-xs flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }} /> Booked ({booked})
                  </span>
                  <span className="text-xs flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: '#dc2626' }} /> Sold ({sold})
                  </span>
                  {hold > 0 && (
                    <span className="text-xs flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-gray-400" /> Hold ({hold})
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Building2 size={36} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm text-gray-400">No unit data. Click "Edit project" to add unit counts.</p>
              </div>
            )}
          </div>
        )}

        {/* ══ DOCUMENTS TAB ══ */}
        {activeTab === 'Documents' && (
          <div className="space-y-5">
            <div className="bg-white rounded-3xl border border-gray-100/80 p-7"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-5">Upload Document</p>
              <div className="flex gap-3 flex-wrap">
                <select value={uploadDocType} onChange={e => setUploadDocType(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/15 focus:border-teal-400">
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
                  style={{ background: '#0d9488' }}>
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploading ? 'Uploading…' : 'Choose & Upload'}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">Supported: PDF, DOC, JPG, PNG</p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100/80 p-7"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-5">Project Documents</p>
              {docsLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-300" size={24} /></div>
              ) : documents.length === 0 ? (
                <div className="text-center py-10">
                  <FileText size={32} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-sm text-gray-400">No documents uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center gap-4 py-3 px-4 bg-gray-50 rounded-2xl">
                      <FileText size={16} className="text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-semibold truncate">{doc.fileName || doc.docType}</p>
                        <p className="text-[11px] text-gray-400">
                          {doc.docType} · {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-IN') : ''}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {doc.fileUrl && (
                          <>
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-white transition-colors flex items-center gap-1">
                              <ExternalLink size={11} /> View
                            </a>
                            <a href={doc.fileUrl} download
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors flex items-center gap-1">
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

        {/* ══ BROCHURE TAB ══ */}
        {activeTab === 'Brochure' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-1">Project Brochure PDF</p>
                <p className="text-sm text-gray-500">Auto-generated from your project details</p>
              </div>
              {pdfUrl && (
                <div className="flex gap-2">
                  <a href={pdfUrl} download={`${project.name}_brochure.pdf`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                    <Download size={13} /> Download
                  </a>
                  <button onClick={() => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); setPdfUrl(null); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                    Regenerate
                  </button>
                </div>
              )}
            </div>

            {pdfLoading && (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="animate-spin text-teal-500" size={28} />
                <p className="text-sm text-gray-400">Generating PDF brochure…</p>
              </div>
            )}

            {pdfError && (
              <div className="text-center py-16 border border-dashed border-gray-200 rounded-3xl">
                <FileText className="mx-auto mb-3 text-gray-300" size={36} />
                <p className="text-sm text-red-400 mb-3">{pdfError}</p>
                <button onClick={() => { setPdfError(null); setPdfUrl(null); }}
                  className="px-5 py-2 rounded-full text-sm font-semibold text-white"
                  style={{ background: '#0d9488' }}>
                  Try Again
                </button>
              </div>
            )}

            {pdfUrl && !pdfLoading && (
              <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm" style={{ height: '75vh' }}>
                <iframe src={pdfUrl} className="w-full h-full" title="Project Brochure" />
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default BuilderProjectDetail;