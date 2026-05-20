import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { builderApi, customerApi } from '@/lib/api';
import {
  ArrowLeft, Building2, MapPin, Calendar, CheckCircle2,
  Loader2, ExternalLink, Shield, Home, Layers, Star, Clock,
  FileText, Download, IndianRupee, Paintbrush,
  ChevronLeft, ChevronRight, Info, Play, Navigation, Globe,
} from 'lucide-react';

interface ProjectDetail {
  id: number;
  builderId?: number;
  builderName?: string;
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
  reraState?: string | null;
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
  possessionDate: string | null;
  featured: boolean;
  closingSoon: boolean;
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

const STATUS_LABELS: Record<string, string> = {
  PRE_LAUNCH: 'Pre-Launch', LAUNCHED: 'Launched',
  UNDER_CONSTRUCTION: 'Under Construction', READY_TO_MOVE: 'Ready to Move',
  NEW_LAUNCH: 'New Launch', ACTIVE: 'Active', CLOSING_SOON: 'Closing Soon',
  'Pre-Launch': 'Pre-Launch', 'Under Construction': 'Under Construction', 'Ready to Move': 'Ready to Move',
};

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  PRE_LAUNCH:         { bg: '#7C3AED20', text: '#7C3AED' },
  LAUNCHED:           { bg: '#2563EB20', text: '#2563EB' },
  UNDER_CONSTRUCTION: { bg: '#D9770620', text: '#D97706' },
  READY_TO_MOVE:      { bg: '#16A34A20', text: '#16A34A' },
  NEW_LAUNCH:         { bg: '#7C3AED20', text: '#7C3AED' },
  ACTIVE:             { bg: '#16A34A20', text: '#16A34A' },
};

const fmtPrice = (n?: number | null) => {
  if (!n) return '—';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(0)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-[15px]">
      {icon}{title}
    </h2>
    {children}
  </div>
);

const InfoRow = ({ label, value }: { label: string; value?: string | number | null }) =>
  value ? (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
    </div>
  ) : null;

interface TourLink { label: string; url: string; }

function parseTours(videoUrl: string | null): TourLink[] {
  if (!videoUrl) return [];
  try {
    const parsed = JSON.parse(videoUrl);
    if (Array.isArray(parsed)) return parsed as TourLink[];
  } catch { /* plain URL */ }
  return [{ label: 'Project Tour', url: videoUrl }];
}

function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`;
  if (url.includes('matterport.com') || url.includes('realsee.com')) return url;
  if (url.startsWith('https://') && !url.includes('google.com/maps')) return url;
  return null;
}

function toMapEmbedUrl(url: string): string | null {
  try {
    if (!url.includes('google.com/maps') && !url.includes('maps.google.com')) return null;
    const u = new URL(url);
    u.searchParams.set('output', 'embed');
    // strip any existing embed params that break it
    u.searchParams.delete('usp');
    return u.toString();
  } catch { return null; }
}

// ── Unit matrix generator ──────────────────────────────────────────────────────
type UnitStatus = 'available' | 'booked' | 'sold' | 'hold';
interface MatrixUnit { id: string; floor: number; unit: number; bhk: string; status: UnitStatus; }
interface TowerData  { tower: string; floors: { floor: number; units: MatrixUnit[] }[]; }

function buildUnitMatrix(project: ProjectDetail): TowerData[] {
  const numTowers = Math.max(1, project.towers ?? 1);
  const total     = Math.max(0, project.totalUnits ?? 0);
  if (total === 0) return [];

  const numFloors   = Math.max(1, project.floorsPerTower ?? Math.min(Math.ceil(total / (numTowers * 4)), 20));
  const perFloor    = Math.max(1, Math.ceil(total / (numTowers * numFloors)));
  const configs     = project.configurations?.length ? project.configurations : ['—'];

  const soldCount   = Math.min(project.soldUnits   ?? 0, total);
  const bookedCount = Math.min(project.bookedUnits  ?? 0, total - soldCount);
  const holdCount   = Math.max(0, total - soldCount - bookedCount - Math.max(0, project.availableUnits ?? (total - soldCount - bookedCount)));

  // Build flat status list: sold fills from bottom floors, booked next, hold sprinkled, rest available
  const statuses: UnitStatus[] = [];
  let s = soldCount, b = bookedCount, h = holdCount;
  for (let i = 0; i < total; i++) {
    if (s > 0)      { statuses.push('sold');      s--; }
    else if (b > 0) { statuses.push('booked');    b--; }
    else if (h > 0) { statuses.push('hold');      h--; }
    else            { statuses.push('available'); }
  }

  const towers: TowerData[] = [];
  for (let t = 0; t < numTowers; t++) {
    const floorRows: TowerData['floors'] = [];
    for (let f = numFloors; f >= 1; f--) {           // top floor first (visual top = highest)
      const units: MatrixUnit[] = [];
      for (let u = 1; u <= perFloor; u++) {
        const idx = t * numFloors * perFloor + (numFloors - f) * perFloor + (u - 1);
        if (idx < total) {
          units.push({
            id: `${t}-${f}-${u}`,
            floor: f, unit: u,
            bhk: configs[(u - 1) % configs.length],
            status: statuses[idx],
          });
        }
      }
      if (units.length) floorRows.push({ floor: f, units });
    }
    towers.push({ tower: String.fromCharCode(65 + t), floors: floorRows });
  }
  return towers;
}

const STATUS_CELL: Record<UnitStatus, { bg: string; text: string; border: string; label: string }> = {
  available: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', label: 'Available' },
  booked:    { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', label: 'Booked' },
  sold:      { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', label: 'Sold' },
  hold:      { bg: '#F8FAFC', text: '#94A3B8', border: '#E2E8F0', label: 'On Hold' },
};

// ── Component ──────────────────────────────────────────────────────────────────
const CustomerProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [project, setProject] = useState<ProjectDetail | null>(location.state?.project || null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [activeTower, setActiveTower] = useState(0);
  const [hoveredUnit, setHoveredUnit] = useState<MatrixUnit | null>(null);
  const [activeTour,  setActiveTour]  = useState(0);

  // Reset carousel when documents load so index stays in bounds
  useEffect(() => { setCarouselIdx(0); }, [documents.length]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    customerApi.getProject(id)
      .then((data) => {
        const p = data as ProjectDetail;
        setProject(p);
        if (p.builderId) {
          builderApi.getDocuments(p.builderId, id)
            .then(d => setDocuments((d as ProjectDocument[]) || []))
            .catch(() => {});
        }
      })
      .catch(() => { if (!location.state?.project) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, '_blank');
    }
  };

  if (loading && !project) return (
    <DashboardLayout>
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-secondary" size={36} />
      </div>
    </DashboardLayout>
  );

  if (notFound || !project) return (
    <DashboardLayout>
      <div className="text-center py-24">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building2 size={32} className="text-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Project not found</h3>
        <p className="text-sm text-gray-500 mb-6">This project may have been removed or is not yet published.</p>
        <button onClick={() => navigate('/customer')} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>
          Back to Projects
        </button>
      </div>
    </DashboardLayout>
  );

  const statusStyle = STATUS_STYLE[project.status] || { bg: '#6B728018', text: '#6B7280' };
  const total     = project.totalUnits ?? 0;
  // Cap counts so they never exceed total and always add up
  const sold      = Math.min(project.soldUnits   ?? 0, total);
  const booked    = Math.min(project.bookedUnits  ?? 0, Math.max(0, total - sold));
  const available = project.availableUnits != null
    ? Math.min(project.availableUnits, Math.max(0, total - sold - booked))
    : Math.max(0, total - sold - booked);
  const availablePct = total > 0 ? Math.round((available / total) * 100) : 0;
  const bookedPct    = total > 0 ? Math.round((booked    / total) * 100) : 0;
  const soldPct      = total > 0 ? Math.round((sold      / total) * 100) : 0;

  const isImageUrl = (url: string) => /\.(jpe?g|png|webp|gif|bmp|svg)(\?|$)/i.test(url);
  const docImages  = documents.filter(d => isImageUrl(d.fileUrl) || d.docType?.toLowerCase().includes('image') || d.docType?.toLowerCase().includes('photo'));
  // Always include the project hero image first (if set), then document images
  const heroImg    = project.imageUrl ? [{ id: 0, docType: 'image', fileName: project.name, fileUrl: project.imageUrl, uploadedAt: '' }] : [];
  const imagesDocs = [...heroImg, ...docImages.filter(d => d.fileUrl !== project.imageUrl)];
  const otherDocs  = documents.filter(d => !docImages.includes(d));
  const matrix        = total > 0 ? buildUnitMatrix(project) : [];
  const tours         = parseTours(project.videoUrl);
  const mapEmbedUrl   = project.googleMapsLink ? toMapEmbedUrl(project.googleMapsLink) : null;
  const hasLocation   = !!(project.address || project.googleMapsLink || project.city || project.locality);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-5 pb-8">

        {/* Back */}
        <button onClick={() => navigate('/customer')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors pt-1">
          <ArrowLeft size={15} /> Back to Projects
        </button>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          <div className="relative h-64 overflow-hidden">
            {imagesDocs.length > 0 ? (
              <>
                <img src={imagesDocs[carouselIdx].fileUrl} alt={imagesDocs[carouselIdx].fileName} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)' }} />
                {imagesDocs.length > 1 && (
                  <>
                    <button onClick={() => setCarouselIdx(i => (i - 1 + imagesDocs.length) % imagesDocs.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors">
                      <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => setCarouselIdx(i => (i + 1) % imagesDocs.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors">
                      <ChevronRight size={16} />
                    </button>
                    <div className="absolute bottom-14 left-0 right-0 flex justify-center gap-1.5">
                      {imagesDocs.map((_, i) => (
                        <button key={i} onClick={() => setCarouselIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === carouselIdx ? 'bg-white scale-110' : 'bg-white/50'}`} />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0b2545 0%, #1a4a7a 30%, #0A7E8C 65%, #0eb89a 100%)' }}>
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-15"
                  style={{ background: 'radial-gradient(circle, #7dd3fc, transparent)' }} />
                <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-10"
                  style={{ background: 'radial-gradient(circle, #34d399, transparent)' }} />
                <div className="absolute inset-0 opacity-[0.06]"
                  style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '22px 22px' }} />
                <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1 px-4 opacity-20">
                  {[14,22,18,38,26,48,32,20,36,16,28,12].map((h, i) => (
                    <div key={i} className="bg-white rounded-t-sm flex-1" style={{ height: `${h}px` }} />
                  ))}
                </div>
                <div className="relative flex flex-col items-center gap-2.5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <Building2 size={32} className="text-white" />
                  </div>
                  <span className="text-[10px] font-semibold text-white/60 tracking-widest uppercase">Property</span>
                </div>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,42,69,0.85) 0%, transparent 55%)' }} />
              </div>
            )}

            <div className="absolute top-4 left-4 flex gap-2">
              {project.featured && (
                <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400 text-amber-900 shadow">
                  <Star size={11} fill="currentColor" /> Featured
                </span>
              )}
              {project.closingSoon && (
                <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-500 text-white shadow">
                  <Clock size={11} /> Closing Soon
                </span>
              )}
            </div>
            <span className="absolute top-4 right-4 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}>
              {STATUS_LABELS[project.status] || project.status}
            </span>
            <div className="absolute bottom-0 left-0 right-0 px-6 py-4">
              <h1 className="text-2xl font-black text-white leading-tight">{project.name}</h1>
              <p className="text-white/70 text-sm flex items-center gap-1.5 mt-1">
                <MapPin size={13} />
                {[project.locality, project.city, project.pincode].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>

          {/* Quick stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100 bg-gray-50">
            {[
              { label: 'Starting From', value: fmtPrice(project.priceMin) },
              { label: 'Total Units',   value: total > 0 ? String(total) : '—' },
              { label: 'Towers',        value: project.towers ? String(project.towers) : '—' },
              { label: 'Possession',    value: project.possessionDate?.slice(0, 7) || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="px-4 py-3 text-center">
                <p className="text-base font-black text-gray-900">{value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Description ──────────────────────────────────────────────────── */}
        {project.description && (
          <Section title="About the Project" icon={<Building2 size={17} className="text-secondary" />}>
            <p className="text-sm text-gray-500 leading-relaxed">{project.description}</p>
          </Section>
        )}

        {/* ── Pricing ──────────────────────────────────────────────────────── */}
        <Section title="Pricing" icon={<IndianRupee size={17} className="text-secondary" />}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-secondary/5 border border-secondary/15 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Starting From</p>
              <p className="text-lg font-black text-secondary">{fmtPrice(project.priceMin)}</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Up To</p>
              <p className="text-lg font-black text-gray-900">{fmtPrice(project.priceMax)}</p>
            </div>
            {project.pricePerSqftMin && (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">₹/sqft (min)</p>
                <p className="text-lg font-black text-gray-900">₹{project.pricePerSqftMin.toLocaleString('en-IN')}</p>
              </div>
            )}
            {project.pricePerSqftMax && (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">₹/sqft (max)</p>
                <p className="text-lg font-black text-gray-900">₹{project.pricePerSqftMax.toLocaleString('en-IN')}</p>
              </div>
            )}
          </div>
          <InfoRow label="Maintenance Charges" value={project.maintenanceCharges ? `₹${project.maintenanceCharges.toLocaleString('en-IN')} / month` : null} />
          <InfoRow label="Floor Rise Charges"  value={project.floorRiseCharges  ? `₹${project.floorRiseCharges.toLocaleString('en-IN')} / floor` : null} />
          <InfoRow label="Possession Date"     value={project.possessionDate?.slice(0, 7)} />
        </Section>

        {/* ── Project Overview ─────────────────────────────────────────────── */}
        <Section title="Project Overview" icon={<Layers size={17} className="text-secondary" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <div>
              <InfoRow label="Developer / Builder" value={project.builderName} />
              <InfoRow label="Project Type"        value={project.projectType?.replace(/_/g, ' ')} />
              <InfoRow label="Total Units"         value={project.totalUnits} />
              <InfoRow label="Towers"              value={project.towers} />
              <InfoRow label="Floors per Tower"    value={project.floorsPerTower} />
            </div>
            <div>
              <InfoRow label="City"     value={project.city} />
              <InfoRow label="Locality" value={project.locality} />
              <InfoRow label="Landmark" value={project.landmark} />
              <InfoRow label="Pincode"  value={project.pincode} />
              {/* Map link moved to the dedicated Location & Map section below */}
            </div>
          </div>

          {project.configurations && project.configurations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Configurations</p>
              <div className="flex flex-wrap gap-2">
                {project.configurations.map(c => (
                  <span key={c} className="px-3 py-1.5 rounded-full text-sm font-semibold bg-secondary/10 text-secondary border border-secondary/15">{c}</span>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* ── Unit Availability + Matrix ────────────────────────────────────── */}
        {total > 0 && (
          <Section title="Unit Availability" icon={<Home size={17} className="text-secondary" />}>

            {/* Summary tiles */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Available', value: available, pct: availablePct, bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', sub: 'text-emerald-600' },
                { label: 'Booked',    value: booked,    pct: bookedPct,    bg: 'bg-amber-50',   border: 'border-amber-100',   text: 'text-amber-700',   sub: 'text-amber-600' },
                { label: 'Sold',      value: sold,      pct: soldPct,      bg: 'bg-red-50',     border: 'border-red-100',     text: 'text-red-600',     sub: 'text-red-500' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-3 text-center`}>
                  <p className={`text-2xl font-black ${s.text}`}>{s.value}</p>
                  <p className={`text-xs ${s.sub} mt-0.5`}>{s.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.pct}%</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="h-2.5 rounded-full overflow-hidden flex bg-gray-100 mb-5">
              <div className="bg-emerald-500 h-full" style={{ width: `${availablePct}%` }} />
              <div className="bg-amber-400 h-full"   style={{ width: `${bookedPct}%` }} />
              <div className="bg-red-400 h-full"     style={{ width: `${soldPct}%` }} />
            </div>

            {/* Unit Matrix */}
            {matrix.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Unit Matrix</p>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Info size={11} /> Indicative layout
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {Object.entries(STATUS_CELL).map(([key, s]) => (
                    <span key={key} className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
                      <span className="w-3 h-3 rounded-sm border inline-block" style={{ backgroundColor: s.bg, borderColor: s.border }} />
                      {s.label}
                    </span>
                  ))}
                </div>

                {/* Tower tabs (only shown when > 1 tower) */}
                {matrix.length > 1 && (
                  <div className="flex gap-1.5 mb-4 overflow-x-auto">
                    {matrix.map((t, i) => (
                      <button key={t.tower} onClick={() => setActiveTower(i)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                          activeTower === i ? 'bg-secondary text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}>
                        Tower {t.tower}
                      </button>
                    ))}
                  </div>
                )}

                {/* Grid */}
                {matrix[activeTower] && (
                  <div className="overflow-x-auto rounded-xl border border-gray-100 bg-gray-50/60">
                    <div className="min-w-0 p-3">
                      {/* Column headers */}
                      <div className="flex gap-1.5 mb-2 pl-10">
                        {matrix[activeTower].floors[0]?.units.map((_, ui) => (
                          <div key={ui} className="w-12 text-center text-[9px] font-semibold text-gray-400 uppercase">
                            Unit {ui + 1}
                          </div>
                        ))}
                      </div>

                      {/* Floor rows */}
                      <div className="space-y-1.5">
                        {matrix[activeTower].floors.map(({ floor, units }) => (
                          <div key={floor} className="flex items-center gap-1.5">
                            {/* Floor label */}
                            <div className="w-8 shrink-0 text-right text-[10px] font-semibold text-gray-400">
                              F{floor}
                            </div>
                            {/* Unit cells */}
                            {units.map(unit => {
                              const s = STATUS_CELL[unit.status];
                              return (
                                <div
                                  key={unit.id}
                                  className="relative w-12 h-11 rounded-lg border flex flex-col items-center justify-center cursor-default transition-transform hover:scale-105 hover:z-10"
                                  style={{ backgroundColor: s.bg, borderColor: s.border }}
                                  onMouseEnter={() => setHoveredUnit(unit)}
                                  onMouseLeave={() => setHoveredUnit(null)}
                                >
                                  <span className="text-[9px] font-bold leading-none" style={{ color: s.text }}>
                                    {unit.bhk}
                                  </span>
                                  <span className="text-[8px] mt-0.5 leading-none" style={{ color: s.text, opacity: 0.7 }}>
                                    {s.label.slice(0, 4)}
                                  </span>

                                  {/* Hover tooltip */}
                                  {hoveredUnit?.id === unit.id && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 bg-gray-900 text-white text-[10px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg pointer-events-none">
                                      <p className="font-semibold">{unit.bhk} — Floor {unit.floor}</p>
                                      <p style={{ color: s.bg }}>{s.label}</p>
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>

                      {/* Ground floor label */}
                      <div className="mt-2 pl-10 text-[9px] text-gray-300 font-medium uppercase tracking-wide">
                        ↑ Higher floors above
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-gray-400 mt-3 flex items-start gap-1">
                  <Info size={10} className="mt-0.5 shrink-0" />
                  Unit layout is indicative. Exact availability subject to change. Contact builder for confirmed unit details.
                </p>
              </div>
            )}
          </Section>
        )}

        {/* ── Amenities ────────────────────────────────────────────────────── */}
        {project.amenities && project.amenities.length > 0 && (
          <Section title="Amenities" icon={<Paintbrush size={17} className="text-secondary" />}>
            <div className="flex flex-wrap gap-2">
              {project.amenities.map(a => (
                <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 border border-gray-100 text-gray-700">
                  <CheckCircle2 size={11} className="text-emerald-500 shrink-0" /> {a}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* ── Nearby Highlights ────────────────────────────────────────────── */}
        {project.nearbyHighlights && project.nearbyHighlights.length > 0 && (
          <Section title="Nearby Highlights" icon={<MapPin size={17} className="text-secondary" />}>
            <div className="flex flex-wrap gap-2">
              {project.nearbyHighlights.map(h => (
                <span key={h} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 border border-gray-100 text-gray-700">
                  <MapPin size={11} className="text-secondary shrink-0" /> {h}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* ── RERA ─────────────────────────────────────────────────────────── */}
        {project.reraNumber && (
          <Section title="RERA Details" icon={<Shield size={17} className="text-emerald-600" />}>
            <InfoRow label="RERA Number" value={project.reraNumber} />
            <InfoRow label="State"       value={project.reraState} />
            <InfoRow label="Expiry"      value={project.reraExpiry?.slice(0, 10)} />
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 font-medium">
              <CheckCircle2 size={13} className="text-emerald-500" /> RERA Registered Project — Verified &amp; Compliant
            </div>
          </Section>
        )}

        {/* ── Documents ────────────────────────────────────────────────────── */}
        {otherDocs.length > 0 && (
          <Section title="Documents" icon={<FileText size={17} className="text-secondary" />}>
            <div className="space-y-2">
              {otherDocs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <FileText size={15} className="text-secondary shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                      <p className="text-xs text-gray-400">{doc.docType}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(doc.fileUrl, doc.fileName)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline"
                  >
                    <Download size={12} /> Download
                  </button>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Virtual Tours ─────────────────────────────────────────────────── */}
        {tours.length > 0 && (
          <Section title="Virtual Tours" icon={<Play size={17} className="text-secondary" />}>

            {/* Tour tabs — only when multiple tours */}
            {tours.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tours.map((t, i) => (
                  <button key={i} onClick={() => setActiveTour(i)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      activeTour === i
                        ? 'bg-secondary text-white shadow-sm'
                        : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-secondary hover:text-secondary'
                    }`}>
                    <Play size={10} fill={activeTour === i ? 'currentColor' : 'none'} />
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* Active tour embed or link */}
            {(() => {
              const tour = tours[activeTour] ?? tours[0];
              if (!tour) return null;
              const embed = toEmbedUrl(tour.url);
              return embed ? (
                <div className="rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
                  <iframe
                    src={embed}
                    title={tour.label}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a href={tour.url} target="_blank" rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 bg-gradient-to-r from-teal-50 to-white rounded-2xl border border-teal-100 hover:border-teal-300 hover:shadow-sm transition-all">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                    <Play size={20} className="text-teal-600 fill-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">{tour.label}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{tour.url}</p>
                  </div>
                  <ExternalLink size={15} className="text-gray-300 group-hover:text-teal-500 transition-colors shrink-0" />
                </a>
              );
            })()}
          </Section>
        )}

        {/* ── Location & Map ────────────────────────────────────────────────── */}
        {hasLocation && (
          <Section title="Location & Map" icon={<Navigation size={17} className="text-secondary" />}>

            {/* Address card */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 mb-4">
              <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={16} className="text-secondary" />
              </div>
              <div className="space-y-0.5">
                {project.address && (
                  <p className="text-sm font-medium text-gray-800">{project.address}</p>
                )}
                {(project.locality || project.city) && (
                  <p className="text-sm text-gray-500">
                    {[project.locality, project.city, project.pincode].filter(Boolean).join(', ')}
                  </p>
                )}
                {project.landmark && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                    <span className="font-medium">Near:</span> {project.landmark}
                  </p>
                )}
              </div>
            </div>

            {/* Embedded map or prominent open-maps button */}
            {mapEmbedUrl ? (
              <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ height: 280 }}>
                <iframe
                  src={mapEmbedUrl}
                  title="Project Location"
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-gray-100 bg-gray-50" style={{ height: 200 }}>
                {/* Static map placeholder */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                    <MapPin size={22} className="text-secondary" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">
                    {[project.locality, project.city].filter(Boolean).join(', ')}
                  </p>
                </div>
                {/* Decorative grid */}
                <div className="absolute inset-0 opacity-[0.04]"
                  style={{ backgroundImage: 'linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
              </div>
            )}

            {/* Open in Maps CTA */}
            {project.googleMapsLink && (
              <a
                href={project.googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-secondary hover:text-white hover:border-secondary transition-all"
              >
                <Globe size={14} /> Open in Google Maps
                <ExternalLink size={12} />
              </a>
            )}
          </Section>
        )}

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-900">Interested in {project.name}?</p>
            <p className="text-sm text-gray-500 mt-0.5">Schedule a site visit or talk to a channel partner.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => navigate('/customer/meeting', { state: { projectId: project.id, builderId: project.builderId, builderName: project.builderName, projectName: project.name, city: project.city } })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}
            >
              <Calendar size={14} /> Schedule Visit
            </button>
            <button onClick={() => navigate('/customer')} className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              More Projects
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default CustomerProjectDetail;