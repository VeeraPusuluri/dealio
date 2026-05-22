import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { builderApi, cpApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import FlyerModal from '@/components/shared/FlyerModal';
import {
  Building2, MapPin, Share2, Loader2, CheckCircle2, Calendar,
  X, ChevronRight, Home, TrendingUp,
  MessageSquare, FileText, Layers, Download,
  Copy, IndianRupee, Calculator, Star, Clock, Shield,
  Image as ImageIcon, Video, Bookmark,
  Map, Newspaper, LayoutGrid, Link2, ExternalLink,
  Users, Search, Check, SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Types ─────────────────────────────────────────────────────── */
interface ProjectSummary {
  id: number;
  builderId: number;
  builderName?: string | null;
  name: string;
  city: string;
  locality?: string;
  address?: string | null;
  projectType?: string;
  status: string;
  configurations?: string[];
  priceMin?: number | null;
  priceMax?: number | null;
  commissionValue?: number | null;
  totalUnits?: number | null;
  availableUnits?: number | null;
  bookedUnits?: number | null;
  soldUnits?: number | null;
  possessionDate?: string | null;
  featured?: boolean;
  closingSoon?: boolean;
  reraNumber?: string | null;
  reraExpiry?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  createdAt?: string;
}

interface ProjectDoc {
  id: number;
  docType: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

interface Contact {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  bhkPreference?: string | null;
  tags?: string | null;
  notes?: string | null;
}

/* ─── Bookmark helpers ───────────────────────────────────────────── */
const BOOKMARK_KEY = 'dealio_cp_bookmarks';
function loadBookmarks(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(BOOKMARK_KEY) ?? '[]') as number[]); }
  catch { return new Set(); }
}
function saveBookmarks(s: Set<number>) {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...s]));
}

/* ─── News-feed derivation ───────────────────────────────────────── */
interface NewsItem { date: string; headline: string; icon: string; color: string; }
function deriveNewsFeed(project: ProjectSummary): NewsItem[] {
  const items: NewsItem[] = [];
  if (project.createdAt) {
    const d = new Date(project.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    items.push({ date: d, headline: `${project.name} listed on Dealio`, icon: '🏗️', color: '#E87722' });
  }
  if (project.reraNumber) {
    items.push({ date: 'RERA', headline: `RERA Approved — ${project.reraNumber}`, icon: '✅', color: '#16A34A' });
  }
  if (project.featured) {
    items.push({ date: 'Featured', headline: 'Marked as Featured Project by builder', icon: '⭐', color: '#D97706' });
  }
  const avail = project.availableUnits ?? 0;
  const total = project.totalUnits ?? 0;
  if (total > 0 && avail > 0 && avail / total < 0.25) {
    items.push({ date: 'Inventory', headline: `Only ${avail} of ${total} units remaining — selling fast!`, icon: '🔥', color: '#DC2626' });
  }
  if (project.possessionDate) {
    const diff = new Date(project.possessionDate).getTime() - Date.now();
    const months = Math.round(diff / (30 * 24 * 60 * 60 * 1000));
    if (months >= 0 && months <= 18) {
      items.push({ date: 'Possession', headline: `Possession in ${months} month${months !== 1 ? 's' : ''}`, icon: '📅', color: '#7C3AED' });
    }
  }
  if (project.closingSoon) {
    items.push({ date: 'Alert', headline: 'Project closing soon — last chance to register!', icon: '⏰', color: '#DC2626' });
  }
  return items;
}

/* ─── Helpers ────────────────────────────────────────────────────── */
const STATUS_COLOR: Record<string, string> = {
  PRE_LAUNCH: 'bg-purple-100 text-purple-700',
  LAUNCHED: 'bg-blue-100 text-blue-700',
  UNDER_CONSTRUCTION: 'bg-amber-100 text-amber-700',
  READY_TO_MOVE: 'bg-green-100 text-green-700',
  NEW_LAUNCH: 'bg-purple-100 text-purple-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CLOSING_SOON: 'bg-red-100 text-red-700',
};
const STATUS_LABEL: Record<string, string> = {
  PRE_LAUNCH: 'Pre-Launch', LAUNCHED: 'Launched',
  UNDER_CONSTRUCTION: 'Under Construction', READY_TO_MOVE: 'Ready to Move',
  NEW_LAUNCH: 'New Launch', ACTIVE: 'Active', CLOSING_SOON: 'Closing Soon',
};

const fmt = (n: number) => {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(0)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};
const fmtPrice = (min?: number | null, max?: number | null) => {
  if (!min && !max) return 'Price on request';
  if (min && max)   return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max || 0);
};

const DOC_ICON: Record<string, string> = {
  BROCHURE: '📋', FLOOR_PLAN: '📐', RERA: '🛡️', APPROVAL: '✅',
  LEGAL: '⚖️', PRICE_LIST: '💰', OTHER: '📄',
};

/* ─── Sub-components ─────────────────────────────────────────────── */
function SectionHead({ icon: Icon, label, color = '#64748b' }: { icon: React.ElementType; label: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + '18' }}>
        <Icon size={12} style={{ color }} />
      </div>
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-slate-50 my-5" />;
}

function UnitBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-xs text-slate-500 shrink-0">{label}</div>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="text-xs font-bold text-slate-700 w-8 text-right tabular-nums">{value}</div>
      <div className="text-[10px] text-slate-400 w-8 text-right tabular-nums">{pct}%</div>
    </div>
  );
}

/* ─── BHK matching ───────────────────────────────────────────────── */
function normBhk(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '').replace('bhk', 'bhk');
}
function bhkMatches(contactBhk: string | null | undefined, configs: string[] | undefined): boolean {
  if (!contactBhk || !configs?.length) return false;
  const n = normBhk(contactBhk);
  return configs.some(c => normBhk(c).includes(n) || n.includes(normBhk(c)));
}
function cityMatches(contact: Contact, city: string): boolean {
  const hay = `${contact.notes ?? ''} ${contact.tags ?? ''}`.toLowerCase();
  return hay.includes(city.toLowerCase());
}
function matchScore(contact: Contact, project: ProjectSummary): number {
  let score = 0;
  if (bhkMatches(contact.bhkPreference, project.configurations)) score += 2;
  if (cityMatches(contact, project.city)) score += 1;
  return score;
}

/* ─── Personalized share message ────────────────────────────────── */
function buildShareMsg(contact: Contact, project: ProjectSummary, shareLink: string): string {
  const firstName = contact.name.split(' ')[0];
  const hasBhkMatch = bhkMatches(contact.bhkPreference, project.configurations);
  const priceStr = fmtPrice(project.priceMin, project.priceMax);

  return (
    `Hi ${firstName}! 👋\n\n` +
    (hasBhkMatch
      ? `I found a project that matches your *${contact.bhkPreference}* requirement!\n\n`
      : `I thought you'd be interested in this property:\n\n`) +
    `🏗️ *${project.name}*${project.city ? ` — ${project.city}` : ''}\n` +
    (priceStr !== 'Price on request' ? `💰 ${priceStr}\n` : '') +
    (project.configurations?.length ? `🏠 ${project.configurations.slice(0, 3).join(' / ')}\n` : '') +
    (project.possessionDate ? `📅 Possession: ${project.possessionDate.slice(0, 7)}\n` : '') +
    (project.reraNumber ? `✅ RERA: ${project.reraNumber}\n` : '') +
    `\n🔗 Full details: ${shareLink}\n\n` +
    `Interested? I'll arrange a FREE site visit! 🙏`
  );
}

/* ─── Share-to-Contacts Modal ────────────────────────────────────── */
type MatchFilter = 'best' | 'all';

function ShareToContactsModal({
  project, cpId, onClose,
}: {
  project: ProjectSummary;
  cpId?: string | number | null;
  onClose: () => void;
}) {
  const [contacts, setContacts]           = useState<Contact[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [matchFilter, setMatchFilter]     = useState<MatchFilter>('best');
  const [selectedIds, setSelectedIds]     = useState<Set<number>>(new Set());
  const [sending, setSending]             = useState(false);

  const shareLink = `${window.location.origin}/p/${btoa(`${project.id}:${cpId ?? 'guest'}`)}`;

  useEffect(() => {
    if (!cpId) { setLoading(false); return; }
    cpApi.getContacts(cpId)
      .then(d => {
        const list = (d as Contact[]) ?? [];
        setContacts(list);
        // Auto-select best-match contacts
        const autoSelected = new Set(
          list.filter(c => matchScore(c, project) >= 2).map(c => c.id)
        );
        setSelectedIds(autoSelected);
      })
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, [cpId, project.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const scored = contacts
    .map(c => ({ ...c, score: matchScore(c, project) }))
    .sort((a, b) => b.score - a.score);

  const filtered = scored.filter(c => {
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchesFilter = matchFilter === 'all' || c.score > 0;
    return matchesSearch && matchesFilter;
  });

  const allVisible = filtered.length > 0 && filtered.every(c => selectedIds.has(c.id));

  const toggleAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allVisible) filtered.forEach(c => next.delete(c.id));
      else filtered.forEach(c => next.add(c.id));
      return next;
    });
  };

  const toggle = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSend = () => {
    const targets = contacts.filter(c => selectedIds.has(c.id));
    if (!targets.length) return;
    setSending(true);
    targets.forEach((contact, i) => {
      setTimeout(() => {
        const msg = buildShareMsg(contact, project, shareLink);
        window.open(`https://wa.me/91${contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
        if (i === targets.length - 1) {
          toast.success(`Shared with ${targets.length} contact${targets.length !== 1 ? 's' : ''}!`);
          setSending(false);
          onClose();
        }
      }, i * 700);
    });
  };

  const bestCount = scored.filter(c => c.score > 0).length;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px]" style={{ zIndex: 60 }} onClick={onClose} />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ zIndex: 70 }}>
        <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">

          {/* Header */}
          <div className="flex items-start gap-3 p-5 border-b border-slate-100 shrink-0">
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <Users size={20} className="text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900">Share with My Contacts</h3>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {project.name} · {project.city}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg shrink-0">
              <X size={17} className="text-slate-500" />
            </button>
          </div>

          {/* Project mini-card */}
          <div className="mx-5 mt-4 p-3.5 bg-orange-50 rounded-xl border border-orange-100 flex items-center gap-3 shrink-0">
            {project.imageUrl
              ? <img src={project.imageUrl} className="w-12 h-12 rounded-lg object-cover shrink-0" alt="" />
              : <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center shrink-0"><Building2 size={20} className="text-orange-400" /></div>
            }
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm truncate">{project.name}</p>
              <p className="text-xs text-slate-500 truncate">
                {project.city}{project.configurations?.length ? ` · ${project.configurations.slice(0,3).join(', ')}` : ''}
              </p>
              <p className="text-xs font-semibold text-[#E87722]">{fmtPrice(project.priceMin, project.priceMax)}</p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1.5 mx-5 mt-4 shrink-0">
            {([
              ['best', `Best Match${bestCount > 0 ? ` (${bestCount})` : ''}`, '✦'],
              ['all', `All (${contacts.length})`, '≡'],
            ] as [MatchFilter, string, string][]).map(([id, label, icon]) => (
              <button key={id} onClick={() => setMatchFilter(id)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                  matchFilter === id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="mx-5 mt-3 relative shrink-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or phone…"
              className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#E87722]/20 focus:border-[#E87722]" />
          </div>

          {/* Contact list */}
          <div className="flex-1 overflow-y-auto mx-5 mt-3 mb-1">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-slate-300" /></div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Users size={36} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium text-sm">No contacts yet</p>
                <p className="text-xs mt-1">Add contacts in "My Contacts" to share projects</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No contacts match {matchFilter === 'best' ? 'this project' : 'your search'}
              </div>
            ) : (
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                {/* Select all */}
                <label className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    allVisible ? 'bg-[#E87722] border-[#E87722]' : 'border-slate-300 bg-white'
                  }`} onClick={toggleAll}>
                    {allVisible && <Check size={10} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-xs font-semibold text-slate-500 select-none" onClick={toggleAll}>
                    {allVisible ? 'Deselect all' : `Select all visible (${filtered.length})`}
                  </span>
                </label>

                {/* Contact rows */}
                {filtered.map(contact => {
                  const isSel = selectedIds.has(contact.id);
                  const hasBhk = bhkMatches(contact.bhkPreference, project.configurations);
                  const hasCity = cityMatches(contact, project.city);
                  return (
                    <label key={contact.id}
                      onClick={() => toggle(contact.id)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${
                        isSel ? 'bg-green-50/60' : 'hover:bg-slate-50'
                      }`}>
                      {/* Checkbox */}
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSel ? 'bg-green-600 border-green-600' : 'border-slate-300 bg-white'
                      }`}>
                        {isSel && <Check size={10} className="text-white" strokeWidth={3} />}
                      </div>

                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: 'linear-gradient(135deg,#E87722,#D4691C)' }}>
                        {contact.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800">{contact.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-slate-400">{contact.phone}</span>
                          {contact.bhkPreference && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5 ${
                              hasBhk ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <Home size={8} /> {contact.bhkPreference}
                              {hasBhk && <Check size={8} strokeWidth={3} />}
                            </span>
                          )}
                          {hasCity && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold flex items-center gap-0.5">
                              <MapPin size={8} /> City match
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Match score */}
                      {contact.score > 0 && (
                        <div className="shrink-0 text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            contact.score >= 2 ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {contact.score >= 2 ? '★★ Top match' : '★ Match'}
                          </span>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-100 space-y-2.5 shrink-0">
            <button
              onClick={handleSend}
              disabled={selectedIds.size === 0 || sending}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#25D366' }}>
              {sending
                ? <><Loader2 size={16} className="animate-spin" /> Opening WhatsApp…</>
                : <><MessageSquare size={17} /> Send to {selectedIds.size} contact{selectedIds.size !== 1 ? 's' : ''} via WhatsApp</>
              }
            </button>
            <p className="text-center text-[11px] text-slate-400">
              Each contact gets a personalised message · WhatsApp opens per contact
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function StarButton({ projectId, bookmarks, onToggle }: {
  projectId: number; bookmarks: Set<number>; onToggle: (id: number, e: React.MouseEvent) => void;
}) {
  const starred = bookmarks.has(projectId);
  return (
    <button
      onClick={e => onToggle(projectId, e)}
      title={starred ? 'Remove bookmark' : 'Bookmark project'}
      className={`p-1.5 rounded-lg transition-colors ${starred ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-400 hover:bg-amber-50'}`}>
      <Bookmark size={16} fill={starred ? 'currentColor' : 'none'} />
    </button>
  );
}

/* ─── Drawer Tabs ────────────────────────────────────────────────── */
type DrawerTab = 'overview' | 'floorplans' | 'location' | 'news';

const DRAWER_TABS: { id: DrawerTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview',   label: 'Overview',    icon: LayoutGrid },
  { id: 'floorplans', label: 'Floor Plans', icon: Layers },
  { id: 'location',   label: 'Location',    icon: Map },
  { id: 'news',       label: 'Updates',     icon: Newspaper },
];

/* ─── Detail Drawer ──────────────────────────────────────────────── */
function ProjectDetailDrawer({
  project, onClose, onFlyer, onShare, bookmarks, onToggleBookmark, cpId,
}: {
  project: ProjectSummary;
  onClose: () => void;
  onFlyer: () => void;
  onShare: () => void;
  bookmarks: Set<number>;
  onToggleBookmark: (id: number, e: React.MouseEvent) => void;
  cpId?: string | number | null;
}) {
  const [docs, setDocs]               = useState<ProjectDoc[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [activeTab, setActiveTab]     = useState<DrawerTab>('overview');
  const [dealValue, setDealValue]     = useState('');
  const [copied, setCopied]           = useState(false);
  const [linkCopied, setLinkCopied]   = useState(false);

  const total    = project.totalUnits    ?? 0;
  const avail    = project.availableUnits ?? 0;
  const booked   = project.bookedUnits   ?? 0;
  const sold     = project.soldUnits     ?? 0;
  const commRate = project.commissionValue ?? 0;

  const dealNum     = parseFloat(dealValue.replace(/[^0-9.]/g, '')) || 0;
  const commEarning = dealNum > 0 && commRate > 0 ? (dealNum * commRate) / 100 : 0;
  const midPrice    = project.priceMin && project.priceMax
    ? (project.priceMin + project.priceMax) / 2
    : project.priceMin || project.priceMax || 0;
  const exampleComm = midPrice && commRate ? (midPrice * commRate) / 100 : 0;

  const shareMsg =
    `🏗️ *${project.name}*\n` +
    (project.builderName ? `🏢 ${project.builderName}\n` : '') +
    `📍 ${[project.address, project.city].filter(Boolean).join(', ')}\n` +
    `💰 ${fmtPrice(project.priceMin, project.priceMax)}\n` +
    (project.configurations?.length ? `🏠 ${project.configurations.join(' / ')}\n` : '') +
    (project.possessionDate ? `📅 Possession: ${project.possessionDate}\n` : '') +
    (project.reraNumber ? `✅ RERA: ${project.reraNumber}\n` : '') +
    `\nInterested? Let me arrange a site visit! 🙏`;

  const shareLink = `${window.location.origin}/p/${btoa(`${project.id}:${cpId ?? 'guest'}`)}`;
  const shareMsgWithLink = shareMsg + `\n\n🔗 View details: ${shareLink}`;

  const floorPlans = docs.filter(d => d.docType === 'FLOOR_PLAN');
  const otherDocs  = docs.filter(d => d.docType !== 'FLOOR_PLAN');
  const newsFeed   = deriveNewsFeed(project);

  const copyShareMsg = () => {
    navigator.clipboard.writeText(shareMsg).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setLinkCopied(true);
      toast.success('Share link copied!');
      setTimeout(() => setLinkCopied(false), 2500);
    });
  };

  useEffect(() => {
    builderApi.getDocuments(project.builderId, project.id)
      .then(d => setDocs((d as ProjectDoc[]) ?? []))
      .catch(() => setDocs([]))
      .finally(() => setDocsLoading(false));
  }, [project.id, project.builderId]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]" onClick={onClose} />

      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:max-w-[540px] bg-white shadow-2xl flex flex-col">

        {/* ── Hero image ── */}
        <div className="relative h-48 shrink-0 overflow-hidden bg-gradient-to-br from-slate-100 to-orange-50">
          {project.imageUrl
            ? <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Building2 size={56} className="text-slate-200" /></div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
            <div className="flex gap-1.5 flex-wrap">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLOR[project.status] ?? 'bg-white/90 text-slate-700'}`}>
                {STATUS_LABEL[project.status] ?? project.status}
              </span>
              {project.featured && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                  <Star size={8} fill="currentColor" /> Featured
                </span>
              )}
              {project.closingSoon && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                  <Clock size={8} /> Closing Soon
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <div onClick={e => e.stopPropagation()}>
                <StarButton projectId={project.id} bookmarks={bookmarks} onToggle={onToggleBookmark} />
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow transition-colors">
                <X size={15} className="text-slate-600" />
              </button>
            </div>
          </div>

          <div className="absolute bottom-4 left-5 right-5">
            <h2 className="text-xl font-black text-white leading-tight">{project.name}</h2>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {project.builderName && (
                <span className="text-xs text-white/80 flex items-center gap-1">
                  <Building2 size={10} /> {project.builderName}
                </span>
              )}
              {project.builderName && (project.address || project.city) && <span className="text-white/50">·</span>}
              <span className="text-xs text-white/80 flex items-center gap-1">
                <MapPin size={10} /> {[project.address, project.city].filter(Boolean).join(', ')}
              </span>
            </div>
          </div>
        </div>

        {/* ── Tab navigation ── */}
        <div className="flex border-b border-slate-100 shrink-0 bg-white">
          {DRAWER_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-3 text-[11px] font-semibold transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-[#E87722] border-[#E87722]'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}>
              <tab.icon size={11} /> {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ══ OVERVIEW TAB ══ */}
          {activeTab === 'overview' && (
            <div>
              {/* Commission highlight */}
              <div className="mx-5 mt-5 rounded-2xl p-4 flex items-center gap-4"
                style={{ background: 'linear-gradient(135deg,#fff7ed,#ffedd5)' }}>
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                  <IndianRupee size={20} className="text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Your Commission</p>
                  <p className="text-2xl font-black text-orange-700">{commRate > 0 ? `${commRate}%` : '—'}</p>
                  {exampleComm > 0 && (
                    <p className="text-xs text-orange-500 mt-0.5">Est. {fmt(exampleComm)} on avg. deal</p>
                  )}
                </div>
                {avail > 0 && (
                  <div className="text-right">
                    <p className="text-2xl font-black text-emerald-600">{avail}</p>
                    <p className="text-xs text-emerald-500 font-medium">units left</p>
                  </div>
                )}
              </div>

              <div className="p-5 space-y-0">
                {/* Price */}
                <Divider />
                <SectionHead icon={IndianRupee} label="Pricing" color="#E87722" />
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="bg-slate-50 rounded-xl p-3.5">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Starting from</p>
                    <p className="text-base font-black text-slate-800">{project.priceMin ? fmt(project.priceMin) : '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3.5">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Up to</p>
                    <p className="text-base font-black text-slate-800">{project.priceMax ? fmt(project.priceMax) : '—'}</p>
                  </div>
                </div>

                {/* Commission Calculator */}
                <Divider />
                <SectionHead icon={Calculator} label="Commission Calculator" color="#7C3AED" />
                <div className="bg-violet-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1">
                      <p className="text-[10px] text-violet-500 font-semibold uppercase tracking-wide mb-1">Deal value (₹)</p>
                      <input type="number" placeholder="e.g. 8500000" value={dealValue}
                        onChange={e => setDealValue(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-violet-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300" />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-violet-500 font-semibold uppercase tracking-wide mb-1">You earn</p>
                      <p className="text-xl font-black text-violet-700">{commEarning > 0 ? fmt(commEarning) : '—'}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-violet-400">
                    @ {commRate > 0 ? `${commRate}% commission rate` : 'Commission rate not set'}
                  </p>
                </div>

                {/* Unit availability */}
                {total > 0 && (
                  <>
                    <Divider />
                    <SectionHead icon={Home} label="Unit Availability" color="#0D9488" />
                    <div className="space-y-2.5 mb-1">
                      <UnitBar label="Available" value={avail}  total={total} color="#16A34A" />
                      <UnitBar label="Booked"    value={booked} total={total} color="#E87722" />
                      <UnitBar label="Sold"      value={sold}   total={total} color="#0D9488" />
                    </div>
                    <div className="flex items-center justify-between mt-3 px-1">
                      <span className="text-xs text-slate-400">Total units</span>
                      <span className="text-sm font-black text-slate-700">{total}</span>
                    </div>
                  </>
                )}

                {/* Configurations */}
                {project.configurations && project.configurations.length > 0 && (
                  <>
                    <Divider />
                    <SectionHead icon={Layers} label="Configurations" color="#2563EB" />
                    <div className="flex flex-wrap gap-2">
                      {project.configurations.map(c => (
                        <span key={c} className="text-sm font-bold px-4 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">{c}</span>
                      ))}
                    </div>
                  </>
                )}

                {/* Key info grid */}
                <Divider />
                <SectionHead icon={FileText} label="Project Details" color="#64748b" />
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Possession', value: project.possessionDate?.slice(0,7) ?? '—', icon: Calendar,    color: '#7C3AED', bg: '#F5F3FF' },
                    { label: 'Status',     value: STATUS_LABEL[project.status] ?? project.status, icon: TrendingUp, color: '#0D9488', bg: '#F0FDFA' },
                    { label: 'City',       value: project.city || '—',           icon: MapPin,      color: '#2563EB', bg: '#EFF6FF' },
                    { label: 'Listed',     value: project.createdAt ? new Date(project.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—', icon: Clock, color: '#64748b', bg: '#F8FAFC' },
                  ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: bg }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '20' }}>
                        <Icon size={13} style={{ color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-medium leading-none mb-0.5">{label}</p>
                        <p className="text-xs font-bold text-slate-700 truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Description */}
                {project.description && (
                  <>
                    <Divider />
                    <SectionHead icon={FileText} label="About This Project" color="#64748b" />
                    <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
                  </>
                )}

                {/* RERA */}
                {project.reraNumber && (
                  <>
                    <Divider />
                    <SectionHead icon={Shield} label="RERA Compliance" color="#16A34A" />
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Registration Number</span>
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 size={12} /> {project.reraNumber}
                        </span>
                      </div>
                      {project.reraExpiry && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">Valid Until</span>
                          <span className="text-xs font-bold text-slate-700">{project.reraExpiry.slice(0,10)}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Video */}
                {project.videoUrl && (
                  <>
                    <Divider />
                    <SectionHead icon={Video} label="Virtual Tour / Video" color="#7C3AED" />
                    <a href={project.videoUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 bg-violet-50 rounded-xl p-3.5 hover:bg-violet-100 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                        <Video size={16} className="text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-violet-700 truncate">Watch Project Video</p>
                        <p className="text-[10px] text-violet-400 truncate">{project.videoUrl}</p>
                      </div>
                      <ExternalLink size={14} className="text-violet-400 shrink-0" />
                    </a>
                  </>
                )}

                {/* Other documents */}
                <Divider />
                <SectionHead icon={Download} label="Documents" color="#0D9488" />
                {docsLoading ? (
                  <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-slate-300" /></div>
                ) : otherDocs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">No documents uploaded yet</p>
                ) : (
                  <div className="space-y-2">
                    {otherDocs.map(doc => (
                      <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-3 bg-slate-50 rounded-xl px-3.5 py-3 hover:bg-slate-100 transition-colors group">
                        <span className="text-lg">{DOC_ICON[doc.docType] ?? '📄'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-700 truncate">{doc.fileName}</p>
                          <p className="text-[10px] text-slate-400">
                            {doc.docType.replace(/_/g, ' ')} · {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <Download size={14} className="text-slate-400 group-hover:text-teal-600 transition-colors shrink-0" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Unique Share Link */}
                <Divider />
                <SectionHead icon={Link2} label="Your Unique Share Link" color="#2563EB" />
                <div className="bg-blue-50 rounded-xl p-3.5 mb-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-blue-500 font-semibold mb-0.5">Trackable link for prospects</p>
                    <p className="text-xs font-mono text-blue-700 truncate">{shareLink}</p>
                  </div>
                  <button onClick={copyShareLink}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      linkCopied ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}>
                    <Copy size={11} /> {linkCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                {/* Share section */}
                <Divider />
                <SectionHead icon={Share2} label="Share with Prospects" color="#25D366" />

                {/* Primary CTA — share to contacts */}
                <button
                  onClick={onShare}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-white font-bold text-sm mb-3 hover:opacity-90 transition-opacity shadow-md"
                  style={{ background: 'linear-gradient(135deg,#25D366,#1da851)' }}>
                  <Users size={16} /> Share to My Contacts (with filters)
                </button>

                <div className="bg-slate-50 rounded-xl p-3.5 mb-3">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Or share manually</p>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-mono line-clamp-4">{shareMsg}</p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareMsgWithLink)}`, '_blank')}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#25D366' }}>
                    <MessageSquare size={15} /> WhatsApp
                  </button>
                  <button onClick={copyShareMsg}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors border ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                    <Copy size={15} /> {copied ? 'Copied!' : 'Copy Text'}
                  </button>
                </div>

                <div className="pb-6" />
              </div>
            </div>
          )}

          {/* ══ FLOOR PLANS TAB ══ */}
          {activeTab === 'floorplans' && (
            <div className="p-5">
              {docsLoading ? (
                <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
              ) : floorPlans.length === 0 ? (
                <div className="text-center py-16">
                  <Layers size={40} className="mx-auto mb-3 text-slate-200" />
                  <p className="font-semibold text-slate-500 mb-1">No floor plans uploaded</p>
                  <p className="text-xs text-slate-400">The builder hasn't uploaded floor plans yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{floorPlans.length} Floor Plan{floorPlans.length !== 1 ? 's' : ''}</p>
                  {floorPlans.map(doc => {
                    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.fileUrl ?? '');
                    return (
                      <div key={doc.id} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        {isImage ? (
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                            <img src={doc.fileUrl} alt={doc.fileName}
                              className="w-full object-contain max-h-64 bg-slate-50 hover:opacity-95 transition-opacity" />
                          </a>
                        ) : (
                          <div className="h-32 bg-slate-50 flex items-center justify-center">
                            <Layers size={36} className="text-slate-200" />
                          </div>
                        )}
                        <div className="p-3.5 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-700 truncate max-w-[220px]">{doc.fileName}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-semibold transition-colors">
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
          {activeTab === 'location' && (
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 rounded-2xl p-4">
                <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <MapPin size={11} /> Full Address
                </p>
                <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                  {[project.address, project.locality, project.city].filter(Boolean).join(', ') || 'Address not available'}
                </p>
              </div>

              {/* Map embed */}
              {(project.address || project.city) && (
                <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                  <iframe
                    title="Project Location Map"
                    width="100%"
                    height="220"
                    loading="lazy"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent([project.address, project.locality, project.city].filter(Boolean).join(', '))}&output=embed`}
                    className="border-0 block"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}

              {/* Map action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([project.address, project.locality, project.city].filter(Boolean).join(', '))}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors">
                  <ExternalLink size={14} /> Google Maps
                </a>
                <a
                  href={`https://maps.apple.com/?q=${encodeURIComponent([project.address, project.locality, project.city].filter(Boolean).join(', '))}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-700 transition-colors">
                  <Map size={14} /> Apple Maps
                </a>
              </div>

              {/* Share location on WhatsApp */}
              <button
                onClick={() => {
                  const addr = [project.address, project.locality, project.city].filter(Boolean).join(', ');
                  const msg = `📍 *${project.name}* is located at:\n${addr}\n\nhttps://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#25D366' }}>
                <MessageSquare size={15} /> Share Location on WhatsApp
              </button>
            </div>
          )}

          {/* ══ NEWS / UPDATES TAB ══ */}
          {activeTab === 'news' && (
            <div className="p-5">
              {newsFeed.length === 0 ? (
                <div className="text-center py-16">
                  <Newspaper size={40} className="mx-auto mb-3 text-slate-200" />
                  <p className="font-semibold text-slate-500 mb-1">No updates yet</p>
                  <p className="text-xs text-slate-400">Project news and milestones will appear here</p>
                </div>
              ) : (
                <div className="space-y-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Project Updates & Milestones</p>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />
                    {newsFeed.map((item, i) => (
                      <div key={i} className="flex gap-4 mb-5 relative">
                        <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center shrink-0 z-10 text-base">
                          {item.icon}
                        </div>
                        <div className="flex-1 bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
                          <p className="text-sm font-semibold text-slate-800 leading-snug">{item.headline}</p>
                          <p className="text-[10px] font-medium mt-1" style={{ color: item.color }}>{item.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sticky footer ── */}
        <div className="shrink-0 border-t border-slate-100 bg-white p-4 flex gap-2.5">
          <button onClick={onShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#25D366' }}>
            <Users size={15} /> Share to Contacts
          </button>
          <button onClick={onFlyer}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors border border-orange-100">
            <ImageIcon size={15} /> Generate Flyer
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Main page ──────────────────────────────────────────────────── */
type FilterTab = 'all' | 'starred';

const CPProjects = () => {
  const { user } = useAuthStore();
  const [projects, setProjects]             = useState<ProjectSummary[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [flyerProject, setFlyerProject]     = useState<ProjectSummary | null>(null);
  const [selected, setSelected]             = useState<ProjectSummary | null>(null);
  const [bookmarks, setBookmarks]           = useState<Set<number>>(loadBookmarks);
  const [filterTab, setFilterTab]           = useState<FilterTab>('all');
  const [shareModalProject, setShareModalProject] = useState<ProjectSummary | null>(null);

  useEffect(() => {
    builderApi.getPublicProjects()
      .then(data => setProjects((data as ProjectSummary[]) || []))
      .catch(() => setError('Could not load projects. Make sure the backend is running.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleBookmark = useCallback((id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast.success('Removed from bookmarks'); }
      else { next.add(id); toast.success('Project bookmarked!'); }
      saveBookmarks(next);
      return next;
    });
  }, []);

  const displayed = filterTab === 'starred'
    ? projects.filter(p => bookmarks.has(p.id))
    : projects;

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center py-24"><Loader2 className="animate-spin text-muted-foreground" size={32} /></div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout>
      <div className="text-center py-24">
        <Building2 className="mx-auto mb-3 text-muted-foreground" size={40} />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-4">

        {/* Filter tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {([['all', 'All Projects'], ['starred', 'Bookmarked']] as [FilterTab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setFilterTab(id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                filterTab === id
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}>
              {id === 'starred' && <Bookmark size={12} className="inline mr-1.5 mb-0.5" />}{label}
              {id === 'starred' && bookmarks.size > 0 && (
                <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">{bookmarks.size}</span>
              )}
            </button>
          ))}
        </div>

        {displayed.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border rounded-xl">
            <Bookmark className="mx-auto mb-3 text-muted-foreground" size={36} />
            <h3 className="font-semibold text-foreground mb-1">
              {filterTab === 'starred' ? 'No bookmarked projects' : 'No projects available yet'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {filterTab === 'starred' ? 'Star projects you like to see them here' : 'Projects added by builders will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayed.map(project => (
              <div key={project.id}
                onClick={() => setSelected(project)}
                className="group bg-white rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-200 flex flex-col"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>

                {/* ── Image ──────────────────────────────────────────────── */}
                <div className="relative aspect-[3/4] overflow-hidden flex-shrink-0">
                  {project.imageUrl ? (
                    <img src={project.imageUrl} alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full relative overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, #0b2545 0%, #1a4a7a 30%, #0A7E8C 65%, #0eb89a 100%)' }}>
                      <div className="absolute inset-0 opacity-[0.06]"
                        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
                      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-0.5 px-3 opacity-20">
                        {[14, 22, 18, 32, 22, 38, 26, 20].map((h, i) => (
                          <div key={i} className="bg-white rounded-t-sm flex-1" style={{ height: `${h}px` }} />
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Building2 size={40} className="text-white/25" />
                      </div>
                    </div>
                  )}

                  {/* Top-left: commission + status badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                    {project.commissionValue != null && (
                      <span className="bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                        + {project.commissionValue}%
                      </span>
                    )}
                    {(project.status === 'NEW_LAUNCH' || project.status === 'PRE_LAUNCH') && (
                      <span className="bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        NEW
                      </span>
                    )}
                    {project.closingSoon && (
                      <span className="bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        HOT
                      </span>
                    )}
                  </div>

                  {/* Top-right: bookmark */}
                  <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
                    <StarButton projectId={project.id} bookmarks={bookmarks} onToggle={toggleBookmark} />
                  </div>

                  {/* Bottom: price overlay */}
                  {(project.priceMin || project.priceMax) && (
                    <div className="absolute bottom-0 left-0 right-0 px-3 py-3"
                      style={{ background: 'linear-gradient(to top, rgba(15,42,69,0.82) 0%, transparent 100%)' }}>
                      <p className="text-white/60 text-[9px] font-medium leading-none mb-0.5">From</p>
                      <p className="text-white font-black text-sm leading-none">
                        {project.priceMin ? fmt(project.priceMin) : fmt(project.priceMax!)}
                      </p>
                    </div>
                  )}
                </div>

                {/* ── Body ───────────────────────────────────────────────── */}
                <div className="p-3.5 flex flex-col flex-1 gap-0.5">
                  <h3 className="font-bold text-slate-800 text-[13px] leading-snug line-clamp-1 group-hover:text-teal-600 transition-colors">
                    {project.name}
                  </h3>
                  <p className="flex items-center gap-1 text-[11px] text-slate-400 line-clamp-1">
                    <MapPin size={9} className="shrink-0 text-teal-500/70" />
                    {[project.locality, project.city].filter(Boolean).join(', ') || '—'}
                  </p>
                  {project.configurations && project.configurations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {project.configurations.slice(0, 3).map(c => (
                        <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{c}</span>
                      ))}
                    </div>
                  )}
                  {project.reraNumber && (
                    <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                      <CheckCircle2 size={9} /> RERA Registered
                    </p>
                  )}

                  {/* Action row */}
                  <div className="mt-auto pt-2.5 flex gap-1.5" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setShareModalProject(project)}
                      className="flex-1 py-1.5 rounded-xl text-[11px] font-semibold text-white hover:opacity-90 flex items-center justify-center gap-1 transition-opacity"
                      style={{ backgroundColor: '#25D366' }}>
                      <Users size={10} /> Share
                    </button>
                    <button
                      onClick={() => setFlyerProject(project)}
                      className="flex-1 py-1.5 rounded-xl text-[11px] font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors flex items-center justify-center">
                      Flyer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <ProjectDetailDrawer
          project={selected}
          onClose={() => setSelected(null)}
          onFlyer={() => { setFlyerProject(selected); setSelected(null); }}
          onShare={() => { setShareModalProject(selected); setSelected(null); }}
          bookmarks={bookmarks}
          onToggleBookmark={toggleBookmark}
          cpId={user?.id}
        />
      )}

      {shareModalProject && (
        <ShareToContactsModal
          project={shareModalProject}
          cpId={user?.id}
          onClose={() => setShareModalProject(null)}
        />
      )}

      {flyerProject && <FlyerModal project={flyerProject} onClose={() => setFlyerProject(null)} />}
    </DashboardLayout>
  );
};

export default CPProjects;
