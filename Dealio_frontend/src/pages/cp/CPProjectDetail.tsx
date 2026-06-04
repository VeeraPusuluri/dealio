import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { builderApi, cpApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import FlyerModal from '@/components/shared/FlyerModal';
import ProjectPlaceholder from '@/components/shared/ProjectPlaceholder';
import {
  ArrowLeft, Share2, Building2, MapPin, Calendar, Shield,
  Percent, Home, Layers, FileText, Download, Video,
  ExternalLink, TrendingUp, Clock, Star, CheckCircle2,
  Calculator, IndianRupee, Bookmark, Link2, Loader2,
  Newspaper, LayoutGrid, Map as MapIcon, ImageIcon,
  MessageSquare, Copy, Phone, Eye, Flame,
} from 'lucide-react';
import { toast } from 'sonner';

/* ── Types ──────────────────────────────────────────────────────────── */
interface Project {
  id: number; builderId: number; name: string; city: string;
  locality?: string; address?: string | null; projectType?: string;
  status: string; configurations?: string[]; priceMin?: number | null;
  priceMax?: number | null; commissionValue?: number | null;
  totalUnits?: number | null; availableUnits?: number | null;
  bookedUnits?: number | null; soldUnits?: number | null;
  possessionDate?: string | null; featured?: boolean; closingSoon?: boolean;
  reraNumber?: string | null; reraExpiry?: string | null;
  description?: string | null; imageUrl?: string | null; videoUrl?: string | null;
  builderName?: string | null; builderContactPhone?: string | null;
  amenities?: string[]; createdAt?: string;
}
interface Doc { id: number; docType: string; fileName: string; fileUrl: string; uploadedAt?: string; }
interface Lead {
  id: number; projectId: number; customerName: string; customerPhone: string;
  dealValue?: number | null; status: string; commissionStatus: string;
  commissionPercent?: number | null; estimatedCommission?: number | null; createdAt: string;
}
interface Update { id: number; title: string; content: string; type: string; visibleTo: string; createdAt: string; }

/* ── Helpers ─────────────────────────────────────────────────────────── */
const fmt = (n: number) => {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(0)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};
const fmtPrice = (min?: number | null, max?: number | null) => {
  if (!min && !max) return 'Price on request';
  if (min && max)   return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min || max)!);
};

const STATUS_LABEL: Record<string, string> = {
  PRE_LAUNCH: 'Pre-Launch', NEW_LAUNCH: 'New Launch', LAUNCHED: 'Selling',
  ACTIVE: 'Active', UNDER_CONSTRUCTION: 'Under Construction',
  READY_TO_MOVE: 'Ready to Move', CLOSING_SOON: 'Closing Soon',
};
const STATUS_DOT: Record<string, string> = {
  PRE_LAUNCH: '#8B5CF6', NEW_LAUNCH: '#8B5CF6', LAUNCHED: '#22C55E',
  ACTIVE: '#22C55E', UNDER_CONSTRUCTION: '#F59E0B',
  READY_TO_MOVE: '#16A34A', CLOSING_SOON: '#EF4444',
};
const DOC_ICON: Record<string, string> = {
  BROCHURE: '📋', FLOOR_PLAN: '📐', RERA: '🛡️',
  APPROVAL: '✅', LEGAL: '⚖️', PRICE_LIST: '💰', OTHER: '📄',
};
const UPDATE_ICON: Record<string, string> = {
  milestone: '🏆', construction: '🏗️', legal: '⚖️', price: '💰', announcement: '📢',
};

function UnitBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-muted-foreground w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[12px] font-bold text-foreground tabular-nums w-8 text-right">{value}</span>
      <span className="text-[10px] text-muted-foreground w-7 text-right">{pct}%</span>
    </div>
  );
}

type Tab = 'overview' | 'pipeline' | 'floorplans' | 'location' | 'updates';

/* ── Page ────────────────────────────────────────────────────────────── */
const CPProjectDetail = () => {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const cpId      = user?.id;

  const [project,  setProject]  = useState<Project | null>(null);
  const [docs,     setDocs]     = useState<Doc[]>([]);
  const [leads,    setLeads]    = useState<Lead[]>([]);
  const [updates,  setUpdates]  = useState<Update[] | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<Tab>('overview');
  const [flyerOpen, setFlyerOpen] = useState(false);

  const [dealValue,    setDealValue]    = useState('');
  const [copyingLink,  setCopyingLink]  = useState(false);
  const [bookmarked,   setBookmarked]   = useState(false);

  // Load project + docs + leads in parallel
  useEffect(() => {
    if (!id) return;
    const numId = Number(id);

    Promise.all([
      builderApi.getPublicProjects(undefined).catch(() => []),
      cpId ? cpApi.getLeads(cpId).catch(() => []) : Promise.resolve([]),
    ]).then(([allProjects, allLeads]) => {
      const p = (allProjects as Project[]).find(x => x.id === numId) ?? null;
      setProject(p);
      setLeads((allLeads as Lead[]).filter(l => l.projectId === numId));

      if (p) {
        builderApi.getDocuments(p.builderId, numId)
          .then(d => setDocs((d as Doc[]) || []))
          .catch(() => setDocs([]));
      }

      // Restore bookmark state
      try {
        const saved = JSON.parse(localStorage.getItem('dealio_cp_bookmarks') ?? '[]') as number[];
        setBookmarked(saved.includes(numId));
      } catch { /* ignore */ }
    }).finally(() => setLoading(false));
  }, [id, cpId]);

  // Load updates lazily when tab opens
  useEffect(() => {
    if (tab !== 'updates' || updates !== null || !id) return;
    builderApi.getPublicProjectUpdates(Number(id), 'CP')
      .then(d => setUpdates((d as Update[]) || []))
      .catch(() => setUpdates([]));
  }, [tab, id, updates]);

  const handleCopyLink = async () => {
    if (!cpId || !id) return;
    setCopyingLink(true);
    try {
      const res = await cpApi.getOrCreateShareLink(cpId, Number(id)) as { token: string };
      const url = `${window.location.origin}/p/${res.token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied! 🔗');
    } catch { toast.error('Could not generate link'); }
    finally { setCopyingLink(false); }
  };

  const toggleBookmark = () => {
    if (!project) return;
    try {
      const saved = new Set(JSON.parse(localStorage.getItem('dealio_cp_bookmarks') ?? '[]') as number[]);
      if (bookmarked) { saved.delete(project.id); toast.success('Removed from bookmarks'); }
      else            { saved.add(project.id);    toast.success('Project bookmarked!'); }
      localStorage.setItem('dealio_cp_bookmarks', JSON.stringify([...saved]));
      setBookmarked(!bookmarked);
    } catch { /* ignore */ }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center items-center py-32">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    </DashboardLayout>
  );

  if (!project) return (
    <DashboardLayout>
      <div className="text-center py-24">
        <Building2 size={36} className="mx-auto mb-3 text-muted-foreground opacity-40" />
        <p className="text-[15px] font-semibold text-foreground mb-1">Project not found</p>
        <button onClick={() => navigate('/cp/projects')} className="mt-3 text-[13px] text-teal-600 hover:underline">← Back to Projects</button>
      </div>
    </DashboardLayout>
  );

  const commRate   = project.commissionValue ?? 0;
  const total      = project.totalUnits ?? 0;
  const avail      = project.availableUnits ?? 0;
  const booked     = project.bookedUnits ?? 0;
  const sold       = project.soldUnits ?? 0;
  const midPrice   = project.priceMin && project.priceMax ? (project.priceMin + project.priceMax) / 2 : (project.priceMin || project.priceMax || 0);
  const exComm     = midPrice && commRate ? Math.round(midPrice * commRate / 100) : 0;
  const dealNum    = parseFloat(dealValue.replace(/[^0-9.]/g, '')) || 0;
  const calcComm   = dealNum > 0 && commRate > 0 ? Math.round(dealNum * commRate / 100) : 0;
  const hasPrice   = project.priceMin != null || project.priceMax != null;
  const floorPlans = docs.filter(d => d.docType === 'FLOOR_PLAN');
  const otherDocs  = docs.filter(d => d.docType !== 'FLOOR_PLAN');
  const isHotVelo  = project.featured || (avail > 0 && total > 0 && avail / total < 0.25);

  const myComm  = leads.reduce((s, l) => s + (l.estimatedCommission ?? 0), 0);
  const myReleased = leads.filter(l => l.commissionStatus === 'Released').reduce((s, l) => s + (l.estimatedCommission ?? 0), 0);

  const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview',   label: 'Overview',    icon: LayoutGrid  },
    { id: 'pipeline',   label: 'My Pipeline', icon: TrendingUp, badge: leads.length },
    { id: 'floorplans', label: 'Floor Plans', icon: Layers,     badge: floorPlans.length },
    { id: 'location',   label: 'Location',    icon: MapIcon     },
    { id: 'updates',    label: 'Updates',     icon: Newspaper   },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-0 pb-10 -mt-2">

        {/* ══ HERO ══ */}
        <div className="relative rounded-2xl overflow-hidden mb-6" style={{ minHeight: 280 }}>
          {project.imageUrl
            ? <img src={project.imageUrl} alt={project.name} className="absolute inset-0 w-full h-full object-cover" />
            : <div className="absolute inset-0"><ProjectPlaceholder seed={project.id} /></div>
          }
          {/* gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

          {/* top bar */}
          <div className="relative z-10 flex items-center justify-between px-5 pt-4">
            <button onClick={() => navigate('/cp/projects')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-[13px] font-medium hover:bg-white/20 transition-colors">
              <ArrowLeft size={14} /> Projects
            </button>
            <div className="flex items-center gap-2">
              <button onClick={toggleBookmark}
                className={`p-2 rounded-xl backdrop-blur-sm border border-white/20 transition-colors ${bookmarked ? 'bg-amber-400/80 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
              </button>
              <a href={`/customer/projects/${project.id}?standalone=1`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-[12px] font-medium hover:bg-white/20 transition-colors">
                <Eye size={13} /> Customer View
              </a>
            </div>
          </div>

          {/* bottom content */}
          <div className="relative z-10 px-5 pb-5 pt-12">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Status */}
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_DOT[project.status] ?? '#94A3B8' }} />
                  <span className="text-white/70 text-[12px] font-medium">{STATUS_LABEL[project.status] ?? project.status}</span>
                  {project.featured && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/90 text-amber-900">
                      <Star size={8} fill="currentColor" /> Featured
                    </span>
                  )}
                  {isHotVelo && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/90 text-white">
                      <Flame size={8} /> Hot
                    </span>
                  )}
                </div>
                <h1 className="text-[28px] font-bold text-white leading-tight tracking-tight"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}>
                  {project.name}
                </h1>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {project.builderName && (
                    <span className="text-white/60 text-[12px] flex items-center gap-1">
                      <Building2 size={11} /> {project.builderName}
                    </span>
                  )}
                  <span className="text-white/60 text-[12px] flex items-center gap-1">
                    <MapPin size={11} /> {[project.locality, project.city].filter(Boolean).join(', ')}
                  </span>
                  {project.possessionDate && (
                    <span className="text-white/60 text-[12px] flex items-center gap-1">
                      <Calendar size={11} /> {project.possessionDate.slice(0, 7)}
                    </span>
                  )}
                </div>
              </div>

              {/* Commission pill */}
              {commRate > 0 && (
                <div className="shrink-0 text-center bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl px-4 py-3">
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Commission</p>
                  <p className="text-[28px] font-black text-white leading-none mt-0.5">{commRate}%</p>
                  {exComm > 0 && <p className="text-white/50 text-[10px] mt-0.5">~{fmt(exComm)}/deal</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ ACTION BAR ══ */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={handleCopyLink} disabled={copyingLink}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
            {copyingLink ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
            {copyingLink ? 'Generating…' : 'Copy Share Link'}
          </button>
          <button onClick={() => {
            if (!cpId) return;
            cpApi.getOrCreateShareLink(cpId, project.id)
              .then(r => {
                const token = (r as { token: string }).token;
                const link = `${window.location.origin}/p/${token}`;
                const msg = `Hi! 👋\n\n🏗️ *${project.name}*${project.city ? ` — ${project.city}` : ''}\n${hasPrice ? `💰 ${fmtPrice(project.priceMin, project.priceMax)}\n` : ''}${project.configurations?.length ? `🏠 ${project.configurations.slice(0,3).join(' / ')}\n` : ''}\n🔗 ${link}\n\nInterested? I'll arrange a FREE site visit! 🙏`;
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
              })
              .catch(() => toast.error('Could not generate link'));
          }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: '#25D366' }}>
            <Share2 size={13} /> Share via WhatsApp
          </button>
          <button onClick={() => setFlyerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold border border-border text-foreground hover:bg-muted transition-colors">
            <ImageIcon size={13} /> Generate Flyer
          </button>
          {project.builderContactPhone && (
            <a href={`tel:${project.builderContactPhone}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold border border-border text-foreground hover:bg-muted transition-colors">
              <Phone size={13} /> Call Builder
            </a>
          )}
        </div>

        {/* ══ TABS ══ */}
        <div className="flex border-b border-border mb-6 overflow-x-auto scrollbar-none">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold border-b-2 whitespace-nowrap transition-all ${
                tab === t.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              <t.icon size={13} /> {t.label}
              {typeof t.badge === 'number' && t.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-teal-100 text-teal-700' : 'bg-muted text-muted-foreground'}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW TAB ══ */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left column — 2/3 */}
            <div className="lg:col-span-2 space-y-5">

              {/* Key stats row */}
              <div className="grid grid-cols-3 gap-3">
                {commRate > 0 && (
                  <div className="rounded-2xl p-4 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Percent size={11} className="text-teal-600" />
                      <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wide">Commission</p>
                    </div>
                    <p className="text-[26px] font-black text-teal-700 leading-none">{commRate}%</p>
                    {exComm > 0 && <p className="text-[11px] text-teal-500 mt-0.5">~{fmt(exComm)}/deal</p>}
                  </div>
                )}
                {hasPrice && (
                  <div className="rounded-2xl p-4 bg-orange-50 border border-orange-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <IndianRupee size={11} className="text-orange-500" />
                      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wide">Price</p>
                    </div>
                    <p className="text-[15px] font-black text-slate-800 leading-snug">{fmtPrice(project.priceMin, project.priceMax)}</p>
                  </div>
                )}
                {avail > 0 && (
                  <div className="rounded-2xl p-4 bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Home size={11} className="text-emerald-600" />
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Available</p>
                    </div>
                    <p className="text-[26px] font-black text-emerald-700 leading-none">{avail}</p>
                    {total > 0 && <p className="text-[11px] text-emerald-500 mt-0.5">of {total} units</p>}
                  </div>
                )}
              </div>

              {/* Configurations */}
              {project.configurations && project.configurations.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers size={14} className="text-blue-600" />
                    <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">Configurations</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.configurations.map(c => (
                      <span key={c} className="text-[13px] font-bold px-4 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Unit availability */}
              {total > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Home size={14} className="text-teal-600" />
                    <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">Unit Inventory</p>
                    <span className="ml-auto text-[12px] font-bold text-foreground">{total} total</span>
                  </div>
                  <div className="space-y-3">
                    <UnitBar label="Available" value={avail}  total={total} color="#16A34A" />
                    <UnitBar label="Booked"    value={booked} total={total} color="#F59E0B" />
                    <UnitBar label="Sold"      value={sold}   total={total} color="#0A7E8C" />
                  </div>
                </div>
              )}

              {/* Description */}
              {project.description && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={14} className="text-slate-500" />
                    <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">About This Project</p>
                  </div>
                  <p className="text-[13px] text-foreground leading-relaxed">{project.description}</p>
                </div>
              )}

              {/* RERA */}
              {project.reraNumber && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield size={14} className="text-emerald-600" />
                    <p className="text-[12px] font-bold text-emerald-700 uppercase tracking-wide">RERA Compliance</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-emerald-500">Registration Number</p>
                      <p className="text-[14px] font-bold text-emerald-800 flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 size={13} /> {project.reraNumber}
                      </p>
                    </div>
                    {project.reraExpiry && (
                      <div className="text-right">
                        <p className="text-[11px] text-emerald-500">Valid Until</p>
                        <p className="text-[13px] font-semibold text-emerald-700">{project.reraExpiry.slice(0, 10)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Video */}
              {project.videoUrl && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Video size={14} className="text-violet-600" />
                    <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">Virtual Tour / Video</p>
                  </div>
                  <a href={project.videoUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-3.5 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                      <Video size={18} className="text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-violet-700">Watch Project Video</p>
                      <p className="text-[10px] text-violet-400 truncate">{project.videoUrl}</p>
                    </div>
                    <ExternalLink size={14} className="text-violet-400 shrink-0" />
                  </a>
                </div>
              )}

              {/* Documents */}
              {otherDocs.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Download size={14} className="text-teal-600" />
                    <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">Documents ({otherDocs.length})</p>
                  </div>
                  <div className="space-y-2">
                    {otherDocs.map(doc => (
                      <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-3 px-3.5 py-3 bg-muted/40 rounded-xl hover:bg-muted transition-colors group">
                        <span className="text-lg shrink-0">{DOC_ICON[doc.docType] ?? '📄'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-foreground truncate">{doc.fileName}</p>
                          <p className="text-[10px] text-muted-foreground">{doc.docType.replace(/_/g, ' ')}</p>
                        </div>
                        <Download size={14} className="text-muted-foreground group-hover:text-teal-600 transition-colors shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right column — 1/3 */}
            <div className="space-y-4">

              {/* Commission Calculator */}
              {commRate > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator size={14} className="text-violet-600" />
                    <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">Commission Calculator</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">Deal Value (₹)</label>
                      <input type="number" value={dealValue} onChange={e => setDealValue(e.target.value)}
                        placeholder="e.g. 85,00,000"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 placeholder:text-muted-foreground" />
                    </div>
                    <div className="rounded-xl bg-violet-50 border border-violet-100 p-4 text-center">
                      <p className="text-[11px] text-violet-500 font-medium">You Earn</p>
                      <p className="text-[28px] font-black text-violet-700 leading-none mt-0.5">
                        {calcComm > 0 ? fmt(calcComm) : '—'}
                      </p>
                      <p className="text-[10px] text-violet-400 mt-0.5">@ {commRate}% commission rate</p>
                    </div>
                  </div>
                </div>
              )}

              {/* My Pipeline Summary */}
              {leads.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={14} className="text-teal-600" />
                    <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">My Pipeline</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Total leads', value: String(leads.length), color: '#0A7E8C' },
                      { label: 'Est. commission', value: myComm > 0 ? fmt(myComm) : '—', color: '#7C3AED' },
                      { label: 'Released', value: myReleased > 0 ? fmt(myReleased) : '—', color: '#16A34A' },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <span className="text-[12px] text-muted-foreground">{s.label}</span>
                        <span className="text-[13px] font-bold" style={{ color: s.color }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setTab('pipeline')}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors border border-teal-100">
                    View All Leads →
                  </button>
                </div>
              )}

              {/* Project Details */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">Project Details</p>
                {[
                  project.city         && { icon: MapPin,    label: 'City',       value: project.city },
                  project.projectType  && { icon: Building2, label: 'Type',       value: project.projectType },
                  project.possessionDate && { icon: Calendar, label: 'Possession', value: project.possessionDate.slice(0, 7) },
                  project.createdAt    && { icon: Clock,     label: 'Listed',     value: new Date(project.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) },
                ].filter(Boolean).map((item: any) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <item.icon size={13} className="text-muted-foreground shrink-0" />
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className="text-[12px] text-muted-foreground">{item.label}</span>
                      <span className="text-[12px] font-semibold text-foreground truncate ml-2">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ PIPELINE TAB ══ */}
        {tab === 'pipeline' && (
          <div>
            {leads.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border border-dashed border-border">
                <TrendingUp size={32} className="mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-[15px] font-semibold text-foreground mb-1">No leads yet for this project</p>
                <p className="text-[13px] text-muted-foreground mb-4">Share your unique link to start building your pipeline</p>
                <button onClick={handleCopyLink} disabled={copyingLink}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white mx-auto hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
                  {copyingLink ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />}
                  {copyingLink ? 'Generating…' : 'Copy Share Link'}
                </button>
              </div>
            ) : (
              <div>
                {/* Pipeline stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Total Leads',        value: String(leads.length), color: '#0A7E8C', bg: 'bg-teal-50'   },
                    { label: 'Est. Commission',    value: myComm > 0 ? fmt(myComm) : '—', color: '#7C3AED', bg: 'bg-violet-50' },
                    { label: 'Commission Released', value: myReleased > 0 ? fmt(myReleased) : '—', color: '#16A34A', bg: 'bg-emerald-50' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-2xl p-4 ${s.bg} border border-border`}>
                      <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: s.color + 'CC' }}>{s.label}</p>
                      <p className="text-[22px] font-black leading-none" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {leads.map(lead => (
                    <div key={lead.id} className="bg-card rounded-2xl border border-border p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
                          style={{ background: 'linear-gradient(135deg,#0D9488,#0f766e)' }}>
                          {lead.customerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-foreground truncate">{lead.customerName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">{lead.status}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${lead.commissionStatus === 'Released' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{lead.commissionStatus}</span>
                          </div>
                        </div>
                      </div>
                      {(lead.dealValue || lead.estimatedCommission) && (
                        <div className="flex items-center gap-4 pt-2.5 border-t border-border">
                          {lead.dealValue && (
                            <div>
                              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Deal</p>
                              <p className="text-[13px] font-black text-foreground">{fmt(lead.dealValue)}</p>
                            </div>
                          )}
                          {lead.estimatedCommission && (
                            <div>
                              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">My commission</p>
                              <p className="text-[13px] font-black text-teal-700">{fmt(lead.estimatedCommission)}</p>
                            </div>
                          )}
                          <div className="ml-auto">
                            <a href={`https://wa.me/91${lead.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${lead.customerName.split(' ')[0]}! Following up on ${project.name}. 😊`)}`}
                              target="_blank" rel="noreferrer"
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white"
                              style={{ backgroundColor: '#25D366' }}>
                              <MessageSquare size={11} /> WA
                            </a>
                          </div>
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        Added {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ FLOOR PLANS TAB ══ */}
        {tab === 'floorplans' && (
          <div>
            {floorPlans.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border border-dashed border-border">
                <Layers size={32} className="mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-[15px] font-semibold text-foreground mb-1">No floor plans uploaded</p>
                <p className="text-[13px] text-muted-foreground">The builder hasn't uploaded floor plans yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {floorPlans.map(doc => {
                  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.fileUrl ?? '');
                  return (
                    <div key={doc.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                      {isImage ? (
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                          <img src={doc.fileUrl} alt={doc.fileName} className="w-full object-contain max-h-72 bg-muted hover:opacity-95 transition-opacity" />
                        </a>
                      ) : (
                        <div className="h-40 bg-muted flex items-center justify-center"><Layers size={40} className="text-muted-foreground opacity-30" /></div>
                      )}
                      <div className="p-4 flex items-center justify-between gap-3">
                        <p className="text-[13px] font-semibold text-foreground truncate">{doc.fileName}</p>
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-[12px] font-semibold transition-colors shrink-0">
                          <Download size={12} /> Download
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ LOCATION TAB ══ */}
        {tab === 'location' && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={14} className="text-blue-600" />
                <p className="text-[12px] font-bold text-blue-600 uppercase tracking-wide">Full Address</p>
              </div>
              <p className="text-[14px] font-semibold text-foreground leading-relaxed">
                {[project.address, project.locality, project.city].filter(Boolean).join(', ') || 'Address not available'}
              </p>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([project.address, project.locality, project.city].filter(Boolean).join(', '))}`}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 transition-colors">
                <ExternalLink size={11} /> Open in Google Maps
              </a>
            </div>
            {(project.address || project.city) && (
              <div className="rounded-2xl overflow-hidden border border-border shadow-sm" style={{ height: 360 }}>
                <iframe
                  title="Project Location"
                  width="100%" height="100%"
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent([project.address, project.locality, project.city].filter(Boolean).join(', '))}&output=embed`}
                  className="border-0 block"
                  referrerPolicy="no-referrer-when-downgrade" />
              </div>
            )}
          </div>
        )}

        {/* ══ UPDATES TAB ══ */}
        {tab === 'updates' && (
          <div>
            {updates === null ? (
              <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
            ) : updates.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border border-dashed border-border">
                <Newspaper size={32} className="mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-[15px] font-semibold text-foreground">No updates yet</p>
                <p className="text-[13px] text-muted-foreground mt-1">Builder hasn't posted any updates for this project</p>
              </div>
            ) : (
              <div className="relative max-w-2xl">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                {updates.map((u, i) => (
                  <div key={u.id} className="flex gap-4 mb-5 relative">
                    <div className="w-8 h-8 rounded-full bg-card border-2 border-border flex items-center justify-center shrink-0 z-10 text-base">
                      {UPDATE_ICON[u.type] ?? '📢'}
                    </div>
                    <div className="flex-1 bg-card border border-border rounded-2xl p-4 shadow-sm">
                      <p className="text-[14px] font-bold text-foreground leading-snug">{u.title}</p>
                      <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">{u.content}</p>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {flyerOpen && project && (
        <FlyerModal project={project as any} cpId={cpId} onClose={() => setFlyerOpen(false)} />
      )}
    </DashboardLayout>
  );
};

export default CPProjectDetail;
