import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { customerApi, builderApi } from '@/lib/api';
import {
  Building2, MapPin, Search, Loader2, X, Bookmark,
  SlidersHorizontal, ArrowUpDown, ChevronDown, Check, Wifi, Car,
  Dumbbell, TreePine, Shield, Waves, Coffee, UtensilsCrossed,
  Navigation, LocateFixed, CheckCircle2,
} from 'lucide-react';
import ProjectPlaceholder from '@/components/shared/ProjectPlaceholder';
import CustomerPipelineWidget from '@/components/shared/CustomerPipelineWidget';

/* ─── Types ──────────────────────────────────────────────────────── */
interface ProjectSummary {
  id: number;
  name: string;
  city: string;
  locality?: string;
  projectType: string;
  status: string;
  configurations?: string[];
  priceMin?: number;
  priceMax?: number;
  possessionDate?: string;
  featured?: boolean;
  closingSoon?: boolean;
  reraNumber?: string;
  description?: string;
  imageUrl?: string | null;
  builderName?: string;
  amenities?: string[];
  soldUnits?: number;
  totalUnits?: number;
}

type FilterTab = 'all' | 'saved' | 'ready2027' | 'under1cr' | 'nearme';
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'distance' | 'popularity';
type GeoStatus = 'idle' | 'locating' | 'done' | 'denied' | 'error';

/* ─── Constants ──────────────────────────────────────────────────── */
const SHORTLIST_KEY = 'dealio_customer_shortlist';
const PREF_KEY      = 'dealio_customer_prefs';

const STATUS_LABEL: Record<string, string> = {
  PRE_LAUNCH:         'Pre-launch',
  NEW_LAUNCH:         'New launch',
  LAUNCHED:           'Selling',
  ACTIVE:             'Selling',
  UNDER_CONSTRUCTION: 'Under constr.',
  READY_TO_MOVE:      'Ready to move',
  CLOSING_SOON:       'Closing soon',
};

const STATUS_BADGE: Record<string, string> = {
  PRE_LAUNCH:         'bg-violet-50 text-violet-600 border-violet-100',
  NEW_LAUNCH:         'bg-violet-50 text-violet-600 border-violet-100',
  LAUNCHED:           'bg-sky-50 text-sky-600 border-sky-100',
  ACTIVE:             'bg-emerald-50 text-emerald-700 border-emerald-100',
  UNDER_CONSTRUCTION: 'bg-amber-50 text-amber-700 border-amber-100',
  READY_TO_MOVE:      'bg-green-50 text-green-700 border-green-100',
  CLOSING_SOON:       'bg-red-50 text-red-600 border-red-100',
};

/* ─── Amenity icon map ───────────────────────────────────────────── */
const AMENITY_ICONS: Record<string, React.ElementType> = {
  'gym':        Dumbbell,
  'pool':       Waves,
  'parking':    Car,
  'wifi':       Wifi,
  'garden':     TreePine,
  'security':   Shield,
  'cafe':       Coffee,
  'restaurant': UtensilsCrossed,
};

function getAmenityIcon(amenity: string): React.ElementType {
  const key = amenity.toLowerCase();
  for (const [k, Icon] of Object.entries(AMENITY_ICONS)) {
    if (key.includes(k)) return Icon;
  }
  return Building2;
}

/* ─── Helpers ────────────────────────────────────────────────────── */
function loadShortlist(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(SHORTLIST_KEY) ?? '[]') as number[]); }
  catch { return new Set(); }
}
function saveShortlist(s: Set<number>) {
  localStorage.setItem(SHORTLIST_KEY, JSON.stringify([...s]));
}

function getPrefs(): { preferredCity?: string } {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); } catch { return {}; }
}

const fmtPrice = (min?: number, max?: number) => {
  if (!min && !max) return 'Price on request';
  const fmt = (n: number) => {
    if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`;
    if (n >= 100_000)    return `₹${(n / 100_000).toFixed(0)} L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max || 0);
};

/* ─── Simulated "others saved" count (deterministic from id) ─────── */
function othersSaved(id: number): number {
  return 12 + (id * 7 + 3) % 60;
}

/* ─── Project Card ───────────────────────────────────────────────── */
/* ─── Project card (matches builder project view style) ─────────── */
function ProjectGridCard({
  project, shortlist, onToggleShortlist, onClick, featured = false,
}: {
  project: ProjectSummary;
  shortlist: Set<number>;
  onToggleShortlist: (id: number, e: React.MouseEvent) => void;
  onClick: () => void;
  featured?: boolean;
}) {
  const isSaved = shortlist.has(project.id);
  const loc = [project.locality, project.city].filter(Boolean).join(', ');
  const cfgs = project.configurations?.slice(0, 3).join(' · ') ?? '';
  const locLine = [loc, cfgs].filter(Boolean).join(' · ');
  const hasPrice = project.priceMin != null || project.priceMax != null;
  const startPrice = project.priceMin ?? project.priceMax ?? 0;
  const statusMeta: Record<string, { dot: string; label: string }> = {
    ACTIVE:             { dot: '#22c55e', label: 'Selling'        },
    LAUNCHED:           { dot: '#22c55e', label: 'Selling'        },
    READY_TO_MOVE:      { dot: '#22c55e', label: 'Ready to move'  },
    CLOSING_SOON:       { dot: '#f59e0b', label: 'Closing soon'   },
    NEW_LAUNCH:         { dot: '#a855f7', label: 'New launch'     },
    PRE_LAUNCH:         { dot: '#8b5cf6', label: 'Pre-launch'     },
    UNDER_CONSTRUCTION: { dot: '#3b82f6', label: 'Under const.'   },
  };
  const meta = statusMeta[project.status] ?? { dot: '#94a3b8', label: project.status };

  return (
    <div
      onClick={onClick}
      className={`group bg-white rounded-3xl overflow-hidden cursor-pointer flex flex-col border border-gray-100/80
        transition-all duration-200 hover:shadow-2xl hover:shadow-gray-200/60 hover:border-gray-200
        ${featured ? 'sm:col-span-2' : ''}`}
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)' }}
    >
      {/* Status header strip */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50/80">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: meta.dot }} />
          <span className="text-[11px] font-semibold text-gray-500">{meta.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {project.reraNumber && (
            <span className="text-emerald-500 text-[10px] font-bold flex items-center gap-0.5">
              <CheckCircle2 size={9} /> RERA
            </span>
          )}
          <div onClick={e => { e.stopPropagation(); onToggleShortlist(project.id, e); }}>
            <button className={`w-6 h-6 rounded-full flex items-center justify-center transition-all
              ${isSaved ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400 hover:text-teal-600'}`}>
              <Bookmark size={11} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>

      {/* Image */}
      <div className={`relative overflow-hidden flex-shrink-0 ${featured ? 'h-80' : 'h-56'}`}>
        {project.imageUrl ? (
          <img src={project.imageUrl} alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <ProjectPlaceholder seed={project.id} />
        )}
        {project.featured && (
          <span className="absolute top-2.5 left-2.5 bg-amber-400 text-amber-900 text-[9px] font-bold px-2 py-0.5 rounded-full">
            FEATURED
          </span>
        )}
        {project.closingSoon && (
          <span className="absolute top-2.5 right-2.5 bg-red-100 text-red-600 text-[9px] font-bold px-2 py-0.5 rounded-full">
            CLOSING SOON
          </span>
        )}
      </div>

      {/* Body */}
      <div className={`flex flex-col gap-1 flex-1 ${featured ? 'p-5' : 'p-4'}`}>
        <h3 className={`font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-teal-700 transition-colors ${featured ? 'text-[18px]' : 'text-[14px]'}`}>
          {project.name}
        </h3>
        {locLine && <p className="text-[11px] text-gray-400 line-clamp-1">{locLine}</p>}
        {hasPrice && (
          <p className={`font-semibold text-gray-800 mt-0.5 ${featured ? 'text-[15px]' : 'text-[12px]'}`}>
            <span className="text-[10px] font-normal text-gray-400 mr-1">FROM</span>
            {fmtPrice(startPrice, undefined)}
          </p>
        )}

        {/* Configs row */}
        {project.configurations && project.configurations.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {project.configurations.slice(0, 4).map(c => (
              <span key={c} className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-50 text-slate-500 border border-gray-100">{c}</span>
            ))}
          </div>
        )}

        {/* Possession */}
        {project.possessionDate && (
          <p className="text-[10px] text-gray-400 mt-1">
            Possession: {new Date(project.possessionDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Builder-style grid renderer ───────────────────────────────── */
function ProjectGrid({
  projects, shortlist, onToggleShortlist, onOpen,
}: {
  projects: ProjectSummary[];
  shortlist: Set<number>;
  onToggleShortlist: (id: number, e: React.MouseEvent) => void;
  onOpen: (p: ProjectSummary) => void;
}) {
  if (!projects.length) return null;
  const card = (p: ProjectSummary, featured = false) => (
    <ProjectGridCard key={p.id} project={p} shortlist={shortlist}
      onToggleShortlist={onToggleShortlist} onClick={() => onOpen(p)} featured={featured}/>
  );
  return (
    <div className="space-y-5">
      {/* Row 1: featured (col-span-2) + first small */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">
        {card(projects[0], true)}
        {projects[1] && card(projects[1])}
      </div>
      {/* Remaining: 3-col equal */}
      {projects.length > 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {projects.slice(2).map(p => card(p))}
        </div>
      )}
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────── */

/* ─── Haversine distance (km) ────────────────────────────────────── */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ─── Reverse geocode lat/lon → city name via BigDataCloud ───────── */
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('geocode failed');
  const data = await res.json();
  // city is a top-level field — correctly returns "Hyderabad" for Rangareddy-district locations
  return data.city || data.locality || data.principalSubdivision || '';
}

/* ─── Forward geocode a locality name → {lat, lon} ──────────────── */
async function forwardGeocode(place: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data[0]) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

/* ─── Main component ─────────────────────────────────────────────── */
const CustomerHome = () => {
  const navigate   = useNavigate();
  const user       = useAuthStore((s) => s.user);
  const firstName  = user?.name?.split(' ')[0] || 'there';

  const [projects,    setProjects]    = useState<ProjectSummary[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [shortlist,   setShortlist]   = useState<Set<number>>(loadShortlist);
  const [filterTab,   setFilterTab]   = useState<FilterTab>('all');
  const [sortBy,      setSortBy]      = useState<SortOption>('default');
  const [sortOpen,    setSortOpen]    = useState(false);
  const [search,      setSearch]      = useState('');
  const [showFilters,   setShowFilters]   = useState(false);
  const [statusFilter,  setStatusFilter]  = useState<string[]>([]);
  const [typeFilter,    setTypeFilter]    = useState<string[]>([]);
  const [cityFilter,    setCityFilter]    = useState<string[]>([]);
  const [locationOpen,  setLocationOpen]  = useState(false);

  /* ── Location state ── */
  const [geoCity,        setGeoCity]        = useState<string>('');
  const [geoStatus,      setGeoStatus]      = useState<GeoStatus>('idle');
  const [userCoords,     setUserCoords]     = useState<{ lat: number; lon: number } | null>(null);
  const [localityCoords, setLocalityCoords] = useState<Map<string, { lat: number; lon: number }>>(new Map());
  const geocodingRef = useRef<Set<string>>(new Set()); // tracks in-flight geocode requests

  const preferredCity = getPrefs().preferredCity;
  // effective city: saved pref wins, then geo-detected, then all
  const activeCity = preferredCity || geoCity;

  /* ── Load projects whenever activeCity changes ── */
  const loadProjects = useCallback((city: string) => {
    setLoading(true);
    setError('');
    builderApi.getPublicProjects(city || undefined)
      .then(async (data) => {
        const list = (data as ProjectSummary[]) || [];
        // If city filter returned nothing, fall back to all projects so the
        // page never goes blank due to a geo-detected city with no listings yet
        if (list.length === 0 && city) {
          const fallback = await builderApi.getPublicProjects(undefined).catch(() => []);
          setProjects((fallback as ProjectSummary[]) || []);
        } else {
          setProjects(list);
        }
      })
      .catch(() => setError('Could not load projects. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadProjects(activeCity); }, [activeCity, loadProjects]);

  /* ── Listen for preferred-city changes from Settings page ── */
  useEffect(() => {
    const handler = () => loadProjects(getPrefs().preferredCity || geoCity);
    window.addEventListener('dealio:city-changed', handler);
    return () => window.removeEventListener('dealio:city-changed', handler);
  }, [geoCity, loadProjects]);

  /* ── Auto-detect location on mount (only if no preferred city) ── */
  useEffect(() => {
    if (preferredCity || !navigator.geolocation) return;
    setGeoStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setUserCoords({ lat, lon });
        try {
          const city = await reverseGeocode(lat, lon);
          if (city) { setGeoCity(city); setGeoStatus('done'); }
          else       { setGeoStatus('idle'); }
        } catch {
          setGeoStatus('error');
        }
      },
      () => setGeoStatus('denied'),
      { timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Manual re-detect ── */
  const requestLocation = () => {
    if (!navigator.geolocation) return;
    setGeoStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setUserCoords({ lat, lon });
        try {
          const city = await reverseGeocode(lat, lon);
          if (city) { setGeoCity(city); setGeoStatus('done'); }
          else       { setGeoStatus('idle'); }
        } catch { setGeoStatus('error'); }
      },
      () => setGeoStatus('denied'),
      { timeout: 8000 },
    );
  };

  const clearGeoCity = () => { setGeoCity(''); setGeoStatus('idle'); };

  /* ── Geocode project localities when distance sort is active ── */
  useEffect(() => {
    if (sortBy !== 'distance' || !userCoords || !projects.length) return;
    const unique = [...new Set(projects.map(p => p.locality || p.city).filter(Boolean) as string[])]
      .filter(loc => !localityCoords.has(loc) && !geocodingRef.current.has(loc));
    if (!unique.length) return;

    unique.forEach(loc => geocodingRef.current.add(loc));

    (async () => {
      const updates = new Map<string, { lat: number; lon: number }>();
      for (const loc of unique) {
        const coords = await forwardGeocode(loc);
        if (coords) updates.set(loc, coords);
        await new Promise(r => setTimeout(r, 600)); // Nominatim 1 req/s policy
      }
      if (updates.size > 0) {
        setLocalityCoords(prev => new Map([...prev, ...updates]));
      }
      unique.forEach(loc => geocodingRef.current.delete(loc));
    })();
  }, [sortBy, userCoords, projects]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleShortlist = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setShortlist(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveShortlist(next);
      return next;
    });
  };

  /* ── Tab counts ── */
  const tabCounts = useMemo(() => ({
    all:      projects.length,
    saved:    shortlist.size,
    ready2027: projects.filter(p => {
      if (!p.possessionDate) return false;
      const yr = new Date(p.possessionDate).getFullYear();
      return yr <= 2027;
    }).length,
    under1cr: projects.filter(p => (p.priceMin ?? 0) < 10_000_000).length,
    nearme:   projects.filter(p => p.locality).length,
  }), [projects, shortlist]);

  /* ── Filtered + sorted list ── */
  const displayed = useMemo(() => {
    let list = [...projects];

    if (filterTab === 'saved')     list = list.filter(p => shortlist.has(p.id));
    if (filterTab === 'ready2027') list = list.filter(p => p.possessionDate && new Date(p.possessionDate).getFullYear() <= 2027);
    if (filterTab === 'under1cr')  list = list.filter(p => (p.priceMin ?? 0) < 10_000_000);
    if (filterTab === 'nearme')    list = list.filter(p => !!p.locality);

    if (statusFilter.length > 0)
      list = list.filter(p => statusFilter.includes(p.status));

    if (typeFilter.length > 0)
      list = list.filter(p => typeFilter.some(t => p.projectType?.toLowerCase().includes(t.toLowerCase())));

    if (cityFilter.length > 0)
      list = list.filter(p => cityFilter.includes(p.city));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.builderName?.toLowerCase().includes(q) ||
        p.locality?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q),
      );
    }

    if (sortBy === 'price-asc')   list.sort((a, b) => (a.priceMin ?? 0) - (b.priceMin ?? 0));
    if (sortBy === 'price-desc')  list.sort((a, b) => (b.priceMin ?? 0) - (a.priceMin ?? 0));
    if (sortBy === 'popularity')  list.sort((a, b) => {
      // Primary: soldUnits descending; secondary: soldUnits as % of totalUnits (sell-through rate)
      const soldA = a.soldUnits ?? 0;
      const soldB = b.soldUnits ?? 0;
      if (soldB !== soldA) return soldB - soldA;
      const rateA = a.totalUnits ? soldA / a.totalUnits : 0;
      const rateB = b.totalUnits ? soldB / b.totalUnits : 0;
      return rateB - rateA;
    });
    if (sortBy === 'distance' && userCoords) {
      const getKm = (p: ProjectSummary) => {
        const key = p.locality || p.city || '';
        const c = localityCoords.get(key);
        return c ? haversine(userCoords.lat, userCoords.lon, c.lat, c.lon) : Infinity;
      };
      list.sort((a, b) => getKm(a) - getKm(b));
    }

    return list;
  }, [projects, filterTab, shortlist, search, sortBy, statusFilter, typeFilter, cityFilter, userCoords, localityCoords]);

  const TABS: { id: FilterTab; label: string }[] = [
    { id: 'all',       label: 'All' },
    { id: 'saved',     label: 'Saved' },
    { id: 'ready2027', label: 'Ready by 2027' },
    { id: 'under1cr',  label: 'Under ₹1 Cr' },
    { id: 'nearme',    label: 'Near me' },
  ];

  const SORT_OPTIONS: [SortOption, string, boolean?][] = [
    ['default',    'Default'],
    ['price-asc',  'Price: Low → High'],
    ['price-desc', 'Price: High → Low'],
    ['popularity', 'Most Popular'],
    ['distance',   'Nearest first', !userCoords],
  ];

  const sortLabel = SORT_OPTIONS.find(([k]) => k === sortBy)?.[1] ?? 'Sort';

  return (
    <DashboardLayout>
      <div className="space-y-0 pb-8" style={{zoom:0.9}}>

        {/* ══ HEADER ══ */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pt-1 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 leading-tight tracking-tight">
              Find your{' '}
              <em style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', fontWeight: 400 }}>
                home,
              </em>
              <br />
              at your{' '}
              <em style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', fontWeight: 400 }}>
                pace.
              </em>
            </h1>

            {/* Location line */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {preferredCity ? (
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full">
                  <MapPin size={10} className="shrink-0" /> {preferredCity}
                  <span className="text-[10px] text-teal-500 ml-0.5">(from preferences)</span>
                </span>
              ) : geoStatus === 'locating' ? (
                <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground bg-muted/60 border border-border px-2.5 py-1 rounded-full">
                  <Loader2 size={10} className="animate-spin shrink-0" /> Detecting location…
                </span>
              ) : geoCity ? (
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full">
                  <Navigation size={10} className="shrink-0" /> {geoCity}
                  <button onClick={clearGeoCity} className="ml-0.5 text-teal-400 hover:text-teal-700 transition-colors">
                    <X size={10} />
                  </button>
                </span>
              ) : geoStatus === 'denied' ? (
                <button
                  onClick={requestLocation}
                  className="flex items-center gap-1.5 text-[12px] text-muted-foreground border border-dashed border-border px-2.5 py-1 rounded-full hover:bg-muted/40 transition-colors">
                  <LocateFixed size={10} className="shrink-0" /> Enable location for nearby projects
                </button>
              ) : geoStatus === 'idle' ? (
                <button
                  onClick={requestLocation}
                  className="flex items-center gap-1.5 text-[12px] text-muted-foreground border border-dashed border-border px-2.5 py-1 rounded-full hover:bg-muted/40 transition-colors">
                  <LocateFixed size={10} className="shrink-0" /> Use my location
                </button>
              ) : null}

              <p className="text-[12px] text-slate-500">
                {activeCity
                  ? <><strong className="text-slate-700">{projects.length} project{projects.length !== 1 ? 's' : ''}</strong> in {activeCity} · <strong className="text-slate-700">{shortlist.size} shortlisted</strong></>
                  : <>Hi <strong className="text-slate-700">{firstName}</strong>! Discover verified projects — shortlist and compare.</>
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 mt-1 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {/* Filters button */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-medium transition-colors ${showFilters ? 'bg-teal-50 border-teal-200 text-teal-700' : 'border-gray-200 text-slate-600 hover:bg-gray-50'}`}>
              <SlidersHorizontal size={13} />
              Filters
              {(statusFilter.length > 0 || typeFilter.length > 0) && (
                <span className="ml-0.5 min-w-[16px] h-4 px-1 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {statusFilter.length + typeFilter.length}
                </span>
              )}
            </button>

            {/* Location pill */}
            {(() => {
              const cities = [...new Set(projects.map(p => p.city).filter(Boolean))].sort() as string[];
              const label = cityFilter.length === 0 ? 'All Cities' : cityFilter.length === 1 ? cityFilter[0] : `${cityFilter.length} Cities`;
              return (
                <div className="relative">
                  <button
                    onClick={() => setLocationOpen(o => !o)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-medium transition-colors ${cityFilter.length > 0 ? 'bg-teal-50 border-teal-200 text-teal-700' : 'border-gray-200 text-slate-600 hover:bg-gray-50'}`}>
                    <MapPin size={13} />
                    {label}
                    <ChevronDown size={11} className={`transition-transform ${locationOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {locationOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setLocationOpen(false)} />
                      <div className="absolute z-40 right-0 mt-1.5 min-w-[160px] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                        <button
                          onClick={() => { setCityFilter([]); setLocationOpen(false); }}
                          className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between transition-colors ${cityFilter.length === 0 ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-gray-50'}`}>
                          All Cities
                          {cityFilter.length === 0 && <Check size={11} strokeWidth={3} />}
                        </button>
                        {cities.map(city => (
                          <button
                            key={city}
                            onClick={() => {
                              setCityFilter(prev =>
                                prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
                              );
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between transition-colors ${cityFilter.includes(city) ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-gray-50'}`}>
                            {city}
                            {cityFilter.includes(city) && <Check size={11} strokeWidth={3} />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            <button
              onClick={() => setFilterTab('saved')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
              <Bookmark size={13} /> Shortlisted Places
            </button>
          </div>
        </div>

        {/* ══ PIPELINE WIDGET ══ */}
        {user?.phone && (
          <CustomerPipelineWidget phone={user.phone} />
        )}

        {/* ══ TABS + SEARCH ══ */}
        {/* Search + sort sit outside the scrollable tabs row so the dropdown is never clipped */}
        <div className="flex items-center gap-2 border-b border-gray-200">
          {/* Tabs — scrollable independently */}
          <div className="flex-1 overflow-x-auto scrollbar-none min-w-0">
            <div className="flex items-center">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setFilterTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    filterTab === tab.id
                      ? 'border-teal-600 text-teal-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}>
                  {tab.label}
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                    filterTab === tab.id ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-slate-500'
                  }`}>
                    {tabCounts[tab.id]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search + sort — shrink-0, no overflow, so absolute dropdown works */}
          <div className="flex items-center gap-2 pb-1 shrink-0">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search projects, locality…"
                className="pl-7 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 w-44 focus:outline-none focus:ring-1 focus:ring-teal-300 focus:border-teal-300 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={10} />
                </button>
              )}
            </div>
            <div className="relative">
              <button onClick={() => setSortOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-slate-600 hover:bg-gray-50 transition-colors whitespace-nowrap">
                <ArrowUpDown size={11} /> {sortLabel}
                <ChevronDown size={10} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
              </button>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
                  <div className="absolute z-40 right-0 mt-1.5 min-w-[190px] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                    {SORT_OPTIONS.map(([k, label, disabled]) => (
                      <button key={k}
                        disabled={!!disabled}
                        onClick={() => { if (!disabled) { setSortBy(k); setSortOpen(false); } }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between transition-colors ${
                          disabled
                            ? 'text-slate-300 cursor-not-allowed'
                            : sortBy === k
                              ? 'bg-teal-50 text-teal-700'
                              : 'text-slate-600 hover:bg-gray-50'
                        }`}>
                        <span>{label}</span>
                        <span className="flex items-center gap-1">
                          {disabled && <span className="text-[10px] text-slate-300">no location</span>}
                          {sortBy === k && !disabled && <Check size={11} strokeWidth={3} />}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ══ FILTER PANEL ══ */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mt-3 overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-teal-600" />
                <span className="text-xs font-semibold text-slate-700">Filters</span>
                {(statusFilter.length > 0 || typeFilter.length > 0) && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-100">
                    {statusFilter.length + typeFilter.length} active
                  </span>
                )}
              </div>
              {(statusFilter.length > 0 || typeFilter.length > 0) && (
                <button
                  onClick={() => { setStatusFilter([]); setTypeFilter([]); }}
                  className="text-[11px] text-red-500 hover:text-red-700 font-medium transition-colors flex items-center gap-1">
                  <X size={10} /> Clear all
                </button>
              )}
            </div>

            <div className="px-4 py-4 space-y-4">
              {/* Status filter */}
              <div className="flex items-start gap-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-1 w-20 shrink-0">Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'All',           keys: [] as string[],                        color: '' },
                    { label: 'Pre-launch',    keys: ['PRE_LAUNCH', 'NEW_LAUNCH'],           color: 'violet' },
                    { label: 'Selling',       keys: ['LAUNCHED', 'ACTIVE'],                color: 'sky' },
                    { label: 'Under constr.', keys: ['UNDER_CONSTRUCTION'],                color: 'amber' },
                    { label: 'Ready to move', keys: ['READY_TO_MOVE'],                     color: 'emerald' },
                    { label: 'Closing soon',  keys: ['CLOSING_SOON'],                      color: 'red' },
                  ].map(({ label, keys }) => {
                    const isActive = keys.length === 0
                      ? statusFilter.length === 0
                      : keys.every(k => statusFilter.includes(k));
                    return (
                      <button
                        key={label}
                        onClick={() => setStatusFilter(keys.length === 0 ? [] : keys)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isActive
                            ? 'text-white border-transparent shadow-sm'
                            : 'bg-gray-50 border-gray-200 text-slate-600 hover:border-teal-200 hover:text-teal-700 hover:bg-teal-50'
                        }`}
                        style={isActive ? { background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' } : {}}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Type filter */}
              <div className="flex items-start gap-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-1 w-20 shrink-0">Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'All',        key: '',           emoji: '🏘' },
                    { label: 'Apartment',  key: 'apartment',  emoji: '🏢' },
                    { label: 'Villa',      key: 'villa',      emoji: '🏡' },
                    { label: 'Plot',       key: 'plot',       emoji: '📐' },
                    { label: 'Commercial', key: 'commercial', emoji: '🏬' },
                  ].map(({ label, key, emoji }) => {
                    const isActive = key === '' ? typeFilter.length === 0 : typeFilter.includes(key);
                    return (
                      <button
                        key={label}
                        onClick={() => {
                          if (key === '') { setTypeFilter([]); return; }
                          setTypeFilter(prev =>
                            prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key],
                          );
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isActive
                            ? 'text-white border-transparent shadow-sm'
                            : 'bg-gray-50 border-gray-200 text-slate-600 hover:border-teal-200 hover:text-teal-700 hover:bg-teal-50'
                        }`}
                        style={isActive ? { background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' } : {}}>
                        <span>{emoji}</span> {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ GRID ══ */}
        <div className="pt-10 px-4 sm:px-10 lg:px-20">
          {error ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <Building2 size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : loading ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="sm:col-span-2 h-80 bg-gray-100 rounded-3xl animate-pulse"/>
                <div className="h-80 bg-gray-100 rounded-3xl animate-pulse"/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {[1,2,3].map(i => <div key={i} className="h-56 bg-gray-100 rounded-3xl animate-pulse"/>)}
              </div>
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                {filterTab === 'saved'
                  ? <Bookmark size={26} className="text-gray-400" />
                  : <Building2 size={26} className="text-gray-400" />}
              </div>
              <h3 className="font-bold text-slate-700 mb-1">
                {filterTab === 'saved' ? 'No shortlisted projects yet' : 'No projects found'}
              </h3>
              <p className="text-sm text-slate-400">
                {filterTab === 'saved'
                  ? 'Tap the bookmark icon on any project to shortlist it.'
                  : search
                    ? 'Try a different search term.'
                    : 'Try a different filter.'}
              </p>
              {(filterTab !== 'all' || search) && (
                <button onClick={() => { setFilterTab('all'); setSearch(''); }}
                  className="mt-3 px-4 py-1.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors">
                  View all
                </button>
              )}
            </div>
          ) : (
            <ProjectGrid
              projects={displayed}
              shortlist={shortlist}
              onToggleShortlist={toggleShortlist}
              onOpen={p => window.open(`/customer/projects/${p.id}?standalone=1`, '_blank')}
            />
          )}
        </div>

      </div>

      {/* ── Footer: Tell Us What You're Looking For ─────────────────── */}
      <footer style={{background:'#0B2237',flexShrink:0,marginTop:'48px',position:'relative',overflow:'hidden',borderRadius:'24px 24px 0 0'}}>
        <div className="max-w-7xl mx-auto px-12 py-16 flex items-center justify-between gap-12">

          {/* Left — copy */}
          <div style={{maxWidth:420}}>
            <h2 style={{fontFamily:'Georgia,"Times New Roman",serif',fontSize:'clamp(32px,4vw,52px)',fontWeight:700,lineHeight:1.1,color:'#fff',margin:'0 0 4px'}}>
              Tell Us What You're
            </h2>
            <h2 style={{fontFamily:'Georgia,"Times New Roman",serif',fontSize:'clamp(32px,4vw,52px)',fontWeight:700,lineHeight:1.1,color:'#4ADE80',margin:'0 0 24px'}}>
              Looking For!
            </h2>
            <p style={{fontFamily:'system-ui,sans-serif',fontSize:14,color:'rgba(255,255,255,0.55)',lineHeight:1.75,margin:'0 0 36px',maxWidth:340}}>
              Have a home in mind? Or do you like something we built? Get in touch with us and we'll help you get closer to your dream home.
            </p>
            <button
              onClick={() => navigate('/customer/contact')}
              style={{display:'inline-flex',alignItems:'center',gap:12,padding:'12px 24px',borderRadius:999,border:'1.5px solid rgba(255,255,255,0.5)',background:'transparent',color:'#fff',fontFamily:'system-ui,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer',transition:'all .2s'}}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background='transparent'; }}
            >
              Contact Us
              <span style={{width:28,height:28,borderRadius:'50%',background:'#4ADE80',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="#0B2237" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </button>

            {/* Copyright */}
            <p style={{fontFamily:'system-ui,sans-serif',fontSize:11,color:'rgba(255,255,255,0.2)',marginTop:48}}>
              © {new Date().getFullYear()} Dealio · Real Estate Platform
            </p>
          </div>

          {/* Right — geometric SVG illustration */}
          <div style={{flexShrink:0,width:380,height:300,position:'relative',opacity:0.85}}>
            <svg viewBox="0 0 380 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
              {/* Stacked layered diamond wireframe — 5 nested diamonds offset */}
              {[0,1,2,3,4].map(i => {
                const scale = 1 - i * 0.13;
                const yShift = i * 22;
                const cx = 190, cy = 150 - yShift * 0.5;
                const rx = 130 * scale, ry = 75 * scale;
                const opacity = 0.18 + i * 0.07;
                const pts = [
                  [cx, cy - ry],
                  [cx + rx, cy],
                  [cx, cy + ry],
                  [cx - rx, cy],
                ].map(p => p.join(',')).join(' ');
                return (
                  <g key={i}>
                    <polygon points={pts} stroke="rgba(74,222,128,0.6)" strokeWidth="1" fill="none" opacity={opacity + 0.3}/>
                    {/* Vertical connecting lines on sides */}
                    {i < 4 && (() => {
                      const nScale = 1 - (i+1) * 0.13;
                      const nYShift = (i+1) * 22;
                      const nCx = 190, nCy = 150 - nYShift * 0.5;
                      const nRx = 130 * nScale, nRy = 75 * nScale;
                      return (
                        <>
                          <line x1={cx} y1={cy - ry} x2={nCx} y2={nCy - nRy} stroke="rgba(74,222,128,0.25)" strokeWidth="1"/>
                          <line x1={cx + rx} y1={cy} x2={nCx + nRx} y2={nCy} stroke="rgba(74,222,128,0.25)" strokeWidth="1"/>
                          <line x1={cx} y1={cy + ry} x2={nCx} y2={nCy + nRy} stroke="rgba(74,222,128,0.25)" strokeWidth="1"/>
                          <line x1={cx - rx} y1={cy} x2={nCx - nRx} y2={nCy} stroke="rgba(74,222,128,0.25)" strokeWidth="1"/>
                        </>
                      );
                    })()}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </footer>
    </DashboardLayout>
  );
};

export default CustomerHome;