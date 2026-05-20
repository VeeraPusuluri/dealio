import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { customerApi, builderApi } from '@/lib/api';
import {
  Building2, MapPin, Calendar, Search,
  Loader2, ArrowRight, Star, Clock, CheckCircle2, X, Bookmark, BookmarkCheck,
  ListChecks, CreditCard, FileText, ChevronRight,
  SlidersHorizontal, ArrowUpDown, Sparkles, ChevronDown,
} from 'lucide-react';

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
}

type SortOption = 'default' | 'price-asc' | 'price-desc';
const NEW_PROJECT_STATUSES = new Set(['NEW_LAUNCH', 'PRE_LAUNCH']);


interface ProjectAnnouncement {
  projectId: number;
  projectName: string;
  city: string;
  locality: string | null;
  createdAt: string;
}

const PREF_KEY    = 'dealio_customer_prefs';
const ANNOUNCE_KEY = 'dealio_project_announcements';
const SEEN_KEY    = 'dealio_seen_project_ids';

const STATUS_LABELS: Record<string, string> = {
  PRE_LAUNCH: 'Pre-Launch', LAUNCHED: 'Launched',
  UNDER_CONSTRUCTION: 'Under Construction', READY_TO_MOVE: 'Ready to Move',
  NEW_LAUNCH: 'New Launch', ACTIVE: 'Active', CLOSING_SOON: 'Closing Soon',
};

const STATUS_COLORS: Record<string, string> = {
  PRE_LAUNCH: 'bg-violet-100 text-violet-700',
  LAUNCHED: 'bg-blue-100 text-blue-700',
  UNDER_CONSTRUCTION: 'bg-amber-100 text-amber-700',
  READY_TO_MOVE: 'bg-emerald-100 text-emerald-700',
  NEW_LAUNCH: 'bg-violet-100 text-violet-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CLOSING_SOON: 'bg-red-100 text-red-700',
};

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

function getPrefs(): { preferredCity?: string } {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); } catch { return {}; }
}
function savePrefs(prefs: { preferredCity?: string }) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
}
function getSeenIds(): number[] {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch { return []; }
}
function markSeen(ids: number[]) {
  try {
    const merged = [...new Set([...getSeenIds(), ...ids])];
    localStorage.setItem(SEEN_KEY, JSON.stringify(merged.slice(-200)));
  } catch { /* ignore */ }
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const quickLinks = [
  { label: 'My Property',  sub: 'Track your home',   path: '/customer/property',    icon: Building2,  from: '#0A7E8C', to: '#0E9BAA' },
  { label: 'Journey',      sub: 'View milestones',    path: '/customer/journey',     icon: ListChecks, from: '#6366F1', to: '#818CF8' },
  { label: 'Loan Status',  sub: 'Check progress',     path: '/customer/loan-status', icon: CreditCard, from: '#F59E0B', to: '#FBBF24' },
  { label: 'Documents',    sub: 'My files',           path: '/customer/documents',   icon: FileText,   from: '#16A34A', to: '#22C55E' },
  { label: 'Meetings',     sub: 'Schedule a visit',   path: '/customer/meeting',     icon: Calendar,   from: '#E87722', to: '#F97316' },
];

const CustomerHome = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { addNotification } = useNotificationStore();
  const firstName = user?.name?.split(' ')[0] || 'there';
  const inputRef = useRef<HTMLInputElement>(null);

  const [cities,          setCities]          = useState<string[]>([]);
  const [inputValue,      setInputValue]      = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [projects,        setProjects]        = useState<ProjectSummary[]>([]);
  const [loadingCities,   setLoadingCities]   = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [searched,        setSearched]        = useState(false);
  const [searchedCity,    setSearchedCity]    = useState('');
  const [error,           setError]           = useState('');
  const [preferredCity,   setPreferredCity]   = useState<string | undefined>(getPrefs().preferredCity);
  const [sortBy,          setSortBy]          = useState<SortOption>('default');
  const [filterNew,       setFilterNew]       = useState(false);
  const [filterBuilder,   setFilterBuilder]   = useState('');

  const suggestions = cities.filter(c =>
    c.toLowerCase().includes(inputValue.toLowerCase()) && inputValue.length > 0
  );

  const builderOptions = useMemo(() =>
    [...new Set(projects.map(p => p.builderName).filter(Boolean))] as string[],
  [projects]);

  const displayedProjects = useMemo(() => {
    let result = [...projects];
    if (filterNew) result = result.filter(p => NEW_PROJECT_STATUSES.has(p.status));
    if (filterBuilder) result = result.filter(p => p.builderName === filterBuilder);
    if (sortBy === 'price-asc') result.sort((a, b) => (a.priceMin ?? 0) - (b.priceMin ?? 0));
    else if (sortBy === 'price-desc') result.sort((a, b) => (b.priceMin ?? 0) - (a.priceMin ?? 0));
    return result;
  }, [projects, sortBy, filterNew, filterBuilder]);

  const checkAnnouncements = (city: string) => {
    try {
      const all: ProjectAnnouncement[] = JSON.parse(localStorage.getItem(ANNOUNCE_KEY) || '[]');
      const seenIds = getSeenIds();
      const fresh = all.filter(a => a.city.toLowerCase() === city.toLowerCase() && !seenIds.includes(a.projectId));
      fresh.forEach(a => addNotification({
        type: 'info', title: 'New Project in Your City',
        message: `${a.projectName}${a.locality ? ` in ${a.locality}` : ''}, ${a.city} is now available!`,
        role: 'customer',
      }));
      if (fresh.length) markSeen(fresh.map(a => a.projectId));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    const fallback = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Pune', 'Delhi NCR', 'Chennai'];
    customerApi.getCities()
      .then(data => setCities((data as string[])?.length ? data as string[] : fallback))
      .catch(() => setCities(fallback))
      .finally(() => setLoadingCities(false));

    customerApi.getNotifications()
      .then(data => {
        (data as { title: string; message: string; type: string }[] || [])
          .forEach(n => addNotification({ type: n.type as 'info' | 'success' | 'error', title: n.title, message: n.message, role: 'customer' }));
      })
      .catch(() => {});

  }, []);

  useEffect(() => {
    if (!loadingCities && preferredCity) {
      setInputValue(preferredCity);
      handleSearch(preferredCity, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingCities]);

  const handleSearch = async (city?: string, silent = false) => {
    const q = city || inputValue.trim();
    if (!q) { setError('Please enter a city name'); inputRef.current?.focus(); return; }
    setError(''); setShowSuggestions(false); setLoadingProjects(true); setSearched(true); setSearchedCity(q);
    setSortBy('default'); setFilterNew(false); setFilterBuilder('');
    try {
      const data = await builderApi.getPublicProjects(q);
      setProjects((data as ProjectSummary[]) || []);
      checkAnnouncements(q);
    } catch {
      if (!silent) { setProjects([]); setError('Could not load projects. Please try again.'); }
    } finally { setLoadingProjects(false); }
  };

  const handleClear = () => { setInputValue(''); setSearched(false); setProjects([]); setError(''); inputRef.current?.focus(); };

  const handleSavePreference = () => {
    if (!searchedCity) return;
    savePrefs({ preferredCity: searchedCity });
    setPreferredCity(searchedCity);
    customerApi.setPreferredCity(searchedCity)
      .then(() => window.dispatchEvent(new CustomEvent('dealio:city-changed')))
      .catch(() => {});
  };

  const handleClearPreference = () => {
    savePrefs({ preferredCity: undefined });
    setPreferredCity(undefined);
    customerApi.setPreferredCity(null)
      .then(() => window.dispatchEvent(new CustomEvent('dealio:city-changed')))
      .catch(() => {});
  };

  const isPreferred = preferredCity && preferredCity.toLowerCase() === searchedCity.toLowerCase();

  return (
    <DashboardLayout>
      <div className="space-y-7 pb-8">

        {/* ── Greeting ─────────────────────────────────────────────────── */}
        <div className="pt-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary mb-1">
            {timeGreeting()} ☀️
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {preferredCity
              ? `Showing verified projects in ${preferredCity}`
              : 'Find your perfect home — search by city below.'}
          </p>
        </div>

        {/* ── Quick-access cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickLinks.map(({ label, sub, path, icon: Icon, from, to }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="group relative flex flex-col gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left overflow-hidden"
            >
              <div
                className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ background: `radial-gradient(circle, ${to}, ${from})` }}
              />
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
              >
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-none mb-0.5">{label}</p>
                <p className="text-[11px] text-muted-foreground">{sub}</p>
              </div>
              <ChevronRight size={13} className="absolute bottom-3.5 right-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </button>
          ))}
        </div>

        {/* ── Search ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Search size={15} className="text-secondary" /> Explore Projects by City
          </p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none z-10" />
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => { setInputValue(e.target.value); setShowSuggestions(true); setError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); if (e.key === 'Escape') setShowSuggestions(false); }}
                onFocus={() => setShowSuggestions(inputValue.length > 0 || cities.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder={loadingCities ? 'Loading cities…' : 'Hyderabad, Bengaluru, Mumbai…'}
                disabled={loadingCities}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary focus:bg-white transition-all disabled:opacity-60"
              />
              {inputValue && (
                <button onClick={handleClear} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={13} />
                </button>
              )}

              {showSuggestions && (suggestions.length > 0 || (inputValue.length === 0 && cities.length > 0)) && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                  {inputValue.length === 0 && (
                    <p className="px-4 py-2 text-[11px] text-gray-400 font-semibold uppercase tracking-wide border-b border-gray-50">
                      Available cities
                    </p>
                  )}
                  {(inputValue.length > 0 ? suggestions : cities).map(c => (
                    <button key={c} onMouseDown={() => { setInputValue(c); setShowSuggestions(false); handleSearch(c); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                      <MapPin size={12} className="text-secondary shrink-0" /> {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => handleSearch()}
              disabled={!inputValue.trim() || loadingProjects || loadingCities}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50 transition-all hover:opacity-90 active:scale-95 shrink-0"
              style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}
            >
              {loadingProjects ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Search
            </button>
          </div>

          {error && <p className="text-xs text-destructive flex items-center gap-1"><X size={11} /> {error}</p>}

          {!loadingCities && cities.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-0.5">
              {cities.map(c => (
                <button key={c} onClick={() => { setInputValue(c); handleSearch(c); }}
                  className={`text-xs px-3.5 py-1.5 rounded-full border font-medium transition-all ${
                    searchedCity === c
                      ? 'bg-secondary text-white border-secondary shadow-sm'
                      : 'border-gray-200 text-gray-500 hover:border-secondary hover:text-secondary bg-white'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          )}

          {preferredCity && (
            <div className="flex items-center justify-between bg-secondary/5 border border-secondary/15 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs text-secondary font-medium">
                <BookmarkCheck size={13} />
                Preferred city: <strong>{preferredCity}</strong>
              </div>
              <button onClick={handleClearPreference}
                className="text-[11px] text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
                <X size={11} /> Remove
              </button>
            </div>
          )}
        </div>

        {/* ── Results ──────────────────────────────────────────────────── */}
        {searched && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base font-bold text-foreground">
                {loadingProjects ? 'Searching…' : `${displayedProjects.length}${displayedProjects.length !== projects.length ? ` of ${projects.length}` : ''} project${projects.length !== 1 ? 's' : ''} in ${searchedCity}`}
              </h2>
              {!loadingProjects && searchedCity && (
                <button
                  onClick={isPreferred ? handleClearPreference : handleSavePreference}
                  className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full border font-medium transition-all ${
                    isPreferred
                      ? 'bg-secondary/10 text-secondary border-secondary/30'
                      : 'border-gray-200 text-gray-500 hover:border-secondary hover:text-secondary'
                  }`}>
                  {isPreferred ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
                  {isPreferred ? 'Saved as preferred' : 'Save as preferred city'}
                </button>
              )}
            </div>

            {/* ── Filter / Sort bar ── */}
            {!loadingProjects && projects.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 shrink-0">
                  <SlidersHorizontal size={12} /> Filters
                </span>
                <div className="w-px h-4 bg-gray-200 shrink-0" />

                {/* Price sort */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSortBy(s => s === 'price-asc' ? 'default' : 'price-asc')}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      sortBy === 'price-asc'
                        ? 'bg-secondary text-white border-secondary shadow-sm'
                        : 'border-gray-200 text-gray-500 hover:border-secondary hover:text-secondary bg-white'
                    }`}>
                    <ArrowUpDown size={10} /> Price: Low → High
                  </button>
                  <button
                    onClick={() => setSortBy(s => s === 'price-desc' ? 'default' : 'price-desc')}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      sortBy === 'price-desc'
                        ? 'bg-secondary text-white border-secondary shadow-sm'
                        : 'border-gray-200 text-gray-500 hover:border-secondary hover:text-secondary bg-white'
                    }`}>
                    <ArrowUpDown size={10} /> Price: High → Low
                  </button>
                </div>

                {/* New projects */}
                <button
                  onClick={() => setFilterNew(v => !v)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    filterNew
                      ? 'bg-violet-500 text-white border-violet-500 shadow-sm'
                      : 'border-gray-200 text-gray-500 hover:border-violet-400 hover:text-violet-500 bg-white'
                  }`}>
                  <Sparkles size={10} /> New Launch
                </button>

                {/* Builder filter — only shown when API returns builderName */}
                {builderOptions.length > 0 && (
                  <div className="relative">
                    <select
                      value={filterBuilder}
                      onChange={e => setFilterBuilder(e.target.value)}
                      className={`appearance-none text-xs pl-3 pr-7 py-1.5 rounded-full border font-medium transition-all cursor-pointer focus:outline-none ${
                        filterBuilder
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'border-gray-200 text-gray-500 hover:border-amber-400 hover:text-amber-600 bg-white'
                      }`}>
                      <option value="">All Builders</option>
                      {builderOptions.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <ChevronDown size={10} className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${filterBuilder ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                )}

                {/* Clear all */}
                {(sortBy !== 'default' || filterNew || filterBuilder) && (
                  <button
                    onClick={() => { setSortBy('default'); setFilterNew(false); setFilterBuilder(''); }}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 transition-colors ml-auto">
                    <X size={10} /> Clear
                  </button>
                )}
              </div>
            )}

            {loadingProjects ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-secondary" size={32} />
              </div>
            ) : projects.length === 0 ? (
              <div className="bg-gradient-to-br from-teal-50/60 to-white border-2 border-dashed border-teal-100 rounded-3xl p-14 text-center">
                <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-4">
                  <Building2 size={30} className="text-teal-500" />
                </div>
                <h3 className="font-bold text-slate-700 mb-1">No projects found in {searchedCity}</h3>
                <p className="text-sm text-slate-400">Try a different city from the quick picks above.</p>
              </div>
            ) : displayedProjects.length === 0 ? (
              <div className="bg-gradient-to-br from-violet-50/60 to-white border-2 border-dashed border-violet-100 rounded-3xl p-14 text-center">
                <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                  <SlidersHorizontal size={28} className="text-violet-500" />
                </div>
                <h3 className="font-bold text-slate-700 mb-1">No projects match your filters</h3>
                <p className="text-sm text-slate-400 mb-3">Try adjusting or clearing the active filters.</p>
                <button
                  onClick={() => { setSortBy('default'); setFilterNew(false); setFilterBuilder(''); }}
                  className="text-xs px-4 py-2 rounded-full bg-violet-100 text-violet-600 font-semibold hover:bg-violet-200 transition-colors">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {displayedProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/customer/projects/${p.id}`, { state: { project: p } })}
                    className="group bg-white rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.05)' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10), 0 20px 48px rgba(0,0,0,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.05)')}
                  >
                    {/* ── Hero ── */}
                    <div className="relative h-52 overflow-hidden">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl} alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center relative overflow-hidden"
                          style={{ background: 'linear-gradient(135deg, #0b2545 0%, #1a4a7a 30%, #0A7E8C 65%, #0eb89a 100%)' }}>
                          {/* Decorative circles */}
                          <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-15"
                            style={{ background: 'radial-gradient(circle, #7dd3fc, transparent)' }} />
                          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-10"
                            style={{ background: 'radial-gradient(circle, #34d399, transparent)' }} />
                          {/* Grid pattern */}
                          <div className="absolute inset-0 opacity-[0.06]"
                            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                          {/* Skyline silhouette bars */}
                          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1 px-4 opacity-20">
                            {[18,28,22,38,26,44,30,24,36,20,32,16].map((h, i) => (
                              <div key={i} className="bg-white rounded-t-sm flex-1" style={{ height: `${h}px` }} />
                            ))}
                          </div>
                          {/* Icon card */}
                          <div className="relative flex flex-col items-center gap-2.5">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                              <Building2 size={32} className="text-white" />
                            </div>
                            <span className="text-[10px] font-semibold text-white/60 tracking-widest uppercase">Property</span>
                          </div>
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.10) 50%, transparent 100%)' }} />

                      {/* Top badges */}
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        {p.featured && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-400 text-amber-900 shadow-md">
                            <Star size={9} fill="currentColor" /> Featured
                          </span>
                        )}
                        {p.closingSoon && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500 text-white shadow-md">
                            <Clock size={9} /> Closing Soon
                          </span>
                        )}
                      </div>
                      <span className={`absolute top-3 right-3 text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm ${STATUS_COLORS[p.status] || 'bg-white/25 text-white backdrop-blur-sm'}`}>
                        {STATUS_LABELS[p.status] || p.status}
                      </span>

                      {/* Price overlay at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 px-4 py-3.5">
                        <p className="text-white font-extrabold text-xl leading-none tracking-tight drop-shadow">
                          {fmtPrice(p.priceMin, p.priceMax)}
                        </p>
                      </div>
                    </div>

                    {/* ── Body ── */}
                    <div className="p-4 pb-3 space-y-3">
                      {/* Name + location */}
                      <div>
                        <h4 className="font-bold text-[15px] text-slate-800 leading-snug group-hover:text-teal-600 transition-colors line-clamp-1">
                          {p.name}
                        </h4>
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                          <MapPin size={11} className="text-teal-500/70 shrink-0" />
                          <span className="truncate">{[p.locality, p.city].filter(Boolean).join(', ')}</span>
                        </div>
                      </div>

                      {/* Configs + possession row */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {p.configurations && p.configurations.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {p.configurations.slice(0, 3).map(c => (
                              <span key={c} className="text-[10px] px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 font-semibold border border-teal-100">
                                {c}
                              </span>
                            ))}
                            {p.configurations.length > 3 && (
                              <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-400">
                                +{p.configurations.length - 3}
                              </span>
                            )}
                          </div>
                        ) : <div />}

                        {p.possessionDate && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium whitespace-nowrap">
                            <Calendar size={9} /> {p.possessionDate.slice(0, 7)}
                          </span>
                        )}
                      </div>

                      {/* RERA */}
                      {p.reraNumber && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                          <CheckCircle2 size={11} className="shrink-0" /> RERA Registered
                        </div>
                      )}
                    </div>

                    {/* ── Footer CTA ── */}
                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 text-slate-500 group-hover:bg-teal-600 group-hover:text-white transition-all duration-200">
                        <span>View Details</span>
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CustomerHome;