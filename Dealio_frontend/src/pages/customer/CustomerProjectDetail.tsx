import {useEffect, useState, useRef, useMemo, useCallback} from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
gsap.registerPlugin(ScrollTrigger);
// Prevent resize/mutation-triggered refreshes from resetting scrollTop to 0.
// Only refresh on explicit navigation events.
ScrollTrigger.config({ autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load' });
import {useParams, useNavigate, useLocation, useSearchParams} from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {builderApi, customerApi} from '@/lib/api';
import GoogleMapsLocationField from '@/components/shared/GoogleMapsLocationField';
import type * as LeafletType from 'leaflet';
import {
    Building2, MapPin, Calendar, CheckCircle2,
    Loader2, ExternalLink, Shield, Star, Clock,
    FileText, Download, Play, Navigation, Globe,
    School, Hospital, ShoppingBag, Trees, ShoppingCart, Train,
    Waves, Activity, Zap, Droplets, Bell, Coffee, Wifi, Trophy,
    Sparkles, BookOpen, Heart, Flame, Users, Bookmark, Share2,
    ChevronDown, ChevronLeft, ChevronRight, Info, Home, Newspaper,
    Phone, MessageCircle, Layers, LayoutGrid, Maximize2, Minimize2,
} from 'lucide-react';

// ── Design tokens (navy + gold luxury palette) ─────────────────────────────────
const T = {
    ink: '#0B1929',
    ink2: '#1E3347',
    muted: '#7A8899',
    line: '#DDD8CE',
    bg: '#FFFFFF',
    bg2: '#F9F6F2',
    bg3: '#F2EBE1',
    bgCream: '#F5F0E8',
    accent: '#C9A86C',
    aInk: '#A07840',
    aDeep: '#0B1929',
    aTint: '#FAF4E6',
    sand: '#F1E9DA',
    sandInk: '#7A5E2F',
    serif: '"Fraunces", "Georgia", "Times New Roman", serif',
    sans: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    mono: '"Geist Mono", ui-monospace, monospace',
    gold: '#C9A86C',
    goldLight: '#E8D5A3',
};

// ── Types ─────────────────────────────────────────────────────────────────────
type LeafletModule = typeof LeafletType;

interface Coords { lat: number; lng: number; }

interface NearbyPlace {
    id: string; name: string;
    category: 'hospital' | 'school' | 'transit' | 'mall' | 'park' | 'supermarket';
    lat: number; lng: number; distanceKm: number;
}

interface LocAdv { category: string; name: string; distanceKm: string; driveMinutes: string; }
interface PayPlan { name: string; description: string; }
interface Specs {
    structure?: string; flooring?: string; doors?: string; windows?: string;
    electrical?: string; plumbing?: string; kitchen?: string; bathrooms?: string; painting?: string;
}

interface ProjectDetail {
    id: number; builderId?: number; builderName?: string;
    name: string; projectType: string | null; status: string;
    description: string | null; address: string | null; city: string | null;
    locality: string | null; pincode: string | null; landmark: string | null;
    googleMapsLink: string | null; reraNumber: string | null; reraState?: string | null;
    reraExpiry: string | null; totalUnits: number | null; towers: number | null;
    floorsPerTower: number | null; configurations: string[] | null; amenities: string[] | null;
    nearbyHighlights: string[] | null; priceMin: number | null; priceMax: number | null;
    pricePerSqftMin: number | null; pricePerSqftMax: number | null;
    maintenanceCharges: number | null; floorRiseCharges: number | null;
    possessionDate: string | null; featured: boolean; closingSoon: boolean;
    videoUrl: string | null; imageUrl: string | null; availableUnits: number | null;
    bookedUnits: number | null; soldUnits: number | null;
    landArea?: string | null; buildingPermitNumber?: string | null;
    clubhouseAreaSqft?: number | null; specifications?: Specs | null;
    paymentPlans?: PayPlan[] | null; locationAdvantages?: LocAdv[] | null;
    builderAbout?: string | null; builderYearEstablished?: number | null;
    builderDeliveredProjects?: number | null; builderWebsite?: string | null;
    builderContactPhone?: string | null; builderContactEmail?: string | null;
}

interface ProjectDocument {
    id: number; docType: string; fileName: string; fileUrl: string; uploadedAt: string;
}

interface NewsArticle {
    title: string;
    description: string | null;
    url: string;
    source: { name: string; url: string };
    publishedAt: string;
    image: string | null;
}

// ── News fetch — GNews API primary, Google News RSS fallback ─────────────────

// GNews API (VITE_GNEWS_API_KEY) — https://gnews.io, free 100 req/day
interface GNewsArticle {
    title: string; description: string; url: string;
    image: string | null; publishedAt: string;
    source: { name: string; url: string };
}

async function fetchGNews(query: string, signal?: AbortSignal): Promise<NewsArticle[]> {
    const key = (import.meta.env.VITE_GNEWS_API_KEY as string)?.trim();
    if (!key) return [];
    try {
        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&country=in&max=10&sortby=publishedAt&apikey=${key}`;
        const res = await fetch(url, { signal });
        if (!res.ok) return [];
        const data = await res.json() as { articles?: GNewsArticle[] };
        return (data.articles ?? []).map(a => ({
            title: a.title,
            description: a.description?.slice(0, 120) ?? null,
            url: a.url,
            source: a.source,
            publishedAt: a.publishedAt,
            image: a.image,
        }));
    } catch { return []; }
}

// Fallback: Google News RSS via CORS proxy
type RssItem = { title: string; link: string; pubDate: string; description: string; thumbnail?: string };

const RSS_TOPICS: { label: string; emoji: string; query: (c: string) => string }[] = [
    { label: 'Real Estate',    emoji: '🏠', query: c => `${c} real estate property market launch 2025` },
    { label: 'Development',    emoji: '🏗️', query: c => `${c} HMDA development project construction approval` },
    { label: 'Infrastructure', emoji: '🚇', query: c => `${c} metro ORR flyover road connectivity infrastructure` },
    { label: 'Investment',     emoji: '💹', query: c => `${c} property investment IT corridor zone growth` },
];

async function fetchRssNews(query: string, count: number, signal?: AbortSignal): Promise<RssItem[]> {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
    try {
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`, { signal });
        if (!res.ok) return [];
        const { contents } = await res.json() as { contents?: string };
        if (!contents) return [];
        const doc = new DOMParser().parseFromString(contents, 'text/xml');
        return Array.from(doc.querySelectorAll('item')).slice(0, count).map(item => ({
            title: item.querySelector('title')?.textContent ?? '',
            link: item.getElementsByTagName('link')[0]?.textContent ?? '',
            pubDate: item.querySelector('pubDate')?.textContent ?? '',
            description: item.querySelector('description')?.textContent ?? '',
            thumbnail: item.querySelector('media\\:content, enclosure')?.getAttribute('url') ?? undefined,
        }));
    } catch { return []; }
}

async function fetchProjectNews(city: string, _locality?: string | null, signal?: AbortSignal): Promise<NewsArticle[]> {
    const effectiveCity = city || 'Hyderabad';

    // Primary: GNews API — structured JSON, India-filtered, sorted by recency
    const gnewsQuery = `${effectiveCity} real estate development infrastructure HMDA construction`;
    const gnews = await fetchGNews(gnewsQuery, signal);
    if (gnews.length > 0) return gnews;

    // Fallback: Google News RSS (4 topic queries × 3 articles = up to 12 results)
    const batches = await Promise.all(
        RSS_TOPICS.map(t =>
            fetchRssNews(t.query(effectiveCity), 3, signal).then(items =>
                items.map(i => ({
                    title: i.title.replace(/ - [^-]+$/, ''),
                    description: i.description?.replace(/<[^>]+>/g, '').slice(0, 120) ?? null,
                    url: i.link,
                    source: { name: `${t.emoji} ${t.label}`, url: '' },
                    publishedAt: i.pubDate,
                    image: i.thumbnail ?? null,
                } as NewsArticle)),
            ),
        ),
    );
    const result: NewsArticle[] = [];
    const maxLen = Math.max(...batches.map(b => b.length));
    for (let i = 0; i < maxLen; i++) {
        for (const batch of batches) { if (batch[i]) result.push(batch[i]); }
    }
    return result;
}

// ── Nearby category metadata ──────────────────────────────────────────────────
const NEARBY_CAT: Record<NearbyPlace['category'], { label: string; hex: string; letter: string }> = {
    hospital: {label: 'Healthcare', hex: '#DC2626', letter: 'H'},
    school:   {label: 'Education',  hex: '#2563EB', letter: 'S'},
    transit:  {label: 'Transport',  hex: '#7C3AED', letter: 'M'},
    mall:     {label: 'Shopping',   hex: '#9333EA', letter: 'G'},
    park:     {label: 'Parks',      hex: '#059669', letter: 'P'},
    supermarket: {label: 'Markets', hex: '#D97706', letter: 'G'},
};

const NEARBY_ORDER: NearbyPlace['category'][] = ['hospital','school','transit','mall','park','supermarket'];

function getCatIcon(cat: NearbyPlace['category'], size = 14) {
    switch (cat) {
        case 'hospital':    return <Hospital size={size}/>;
        case 'school':      return <School size={size}/>;
        case 'transit':     return <Train size={size}/>;
        case 'mall':        return <ShoppingBag size={size}/>;
        case 'park':        return <Trees size={size}/>;
        case 'supermarket': return <ShoppingCart size={size}/>;
    }
}

// ── Amenity icon helper ───────────────────────────────────────────────────────
function AmenityIllustration({ name }: { name: string }) {
    const n = name.toLowerCase();
    const p = { stroke: 'rgba(62,205,226,0.72)', strokeWidth: 1.3, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    const base = { style: { width: '100%', height: '100%' } };

    if (n.includes('lobby') || n.includes('entrance') || n.includes('reception'))
        return <svg viewBox="0 0 80 64" {...base}><rect x="8" y="42" width="64" height="14" rx="2" {...p}/><rect x="22" y="20" width="8" height="22" {...p}/><rect x="50" y="20" width="8" height="22" {...p}/><path d="M18,20 Q40,6 62,20" {...p}/><line x1="8" y1="56" x2="72" y2="56" {...p} strokeOpacity="0.3"/></svg>;

    if (n.includes('amphitheatre') || n.includes('amphitheater') || n.includes('theatre'))
        return <svg viewBox="0 0 80 64" {...base}><path d="M8,52 Q40,6 72,52" {...p}/><path d="M14,52 Q40,14 66,52" {...p}/><path d="M20,52 Q40,22 60,52" {...p}/><path d="M26,52 Q40,30 54,52" {...p}/><line x1="8" y1="52" x2="72" y2="52" {...p}/></svg>;

    if (n.includes('basketball') || n.includes('court'))
        return <svg viewBox="0 0 80 64" {...base}><rect x="8" y="10" width="64" height="44" rx="2" {...p}/><line x1="40" y1="10" x2="40" y2="54" {...p}/><ellipse cx="40" cy="32" rx="10" ry="10" {...p}/><path d="M8,22 Q20,22 20,10" {...p} strokeOpacity="0.5"/><path d="M72,22 Q60,22 60,10" {...p} strokeOpacity="0.5"/></svg>;

    if (n.includes('banquet') || n.includes('hall') || n.includes('party'))
        return <svg viewBox="0 0 80 64" {...base}><rect x="10" y="16" width="26" height="14" rx="3" {...p}/><rect x="44" y="16" width="26" height="14" rx="3" {...p}/><rect x="10" y="36" width="26" height="14" rx="3" {...p}/><rect x="44" y="36" width="26" height="14" rx="3" {...p}/><line x1="23" y1="30" x2="23" y2="36" {...p}/><line x1="57" y1="30" x2="57" y2="36" {...p}/></svg>;

    if (n.includes('badminton') || n.includes('indoor'))
        return <svg viewBox="0 0 80 64" {...base}><rect x="8" y="12" width="64" height="40" rx="2" {...p}/><line x1="40" y1="12" x2="40" y2="52" {...p}/><line x1="8" y1="32" x2="72" y2="32" {...p} strokeOpacity="0.4"/><circle cx="20" cy="22" r="3" {...p}/><circle cx="60" cy="22" r="3" {...p}/></svg>;

    if (n.includes('gym') || n.includes('gymnasium') || n.includes('fitness'))
        return <svg viewBox="0 0 80 64" {...base}><rect x="6" y="24" width="8" height="16" rx="2" {...p}/><rect x="66" y="24" width="8" height="16" rx="2" {...p}/><rect x="14" y="28" width="12" height="8" rx="2" {...p}/><rect x="54" y="28" width="12" height="8" rx="2" {...p}/><line x1="26" y1="32" x2="54" y2="32" {...p}/></svg>;

    if (n.includes('table tennis') || n.includes('ping pong'))
        return <svg viewBox="0 0 80 64" {...base}><rect x="8" y="22" width="64" height="20" rx="3" {...p}/><line x1="40" y1="22" x2="40" y2="42" {...p}/><rect x="38" y="16" width="4" height="8" rx="1" {...p}/><circle cx="14" cy="18" r="5" {...p}/></svg>;

    if (n.includes('swim') || n.includes('pool'))
        return <svg viewBox="0 0 80 64" {...base}><rect x="8" y="14" width="64" height="28" rx="14" {...p}/><line x1="8" y1="28" x2="72" y2="28" {...p}/><line x1="10" y1="21" x2="70" y2="21" {...p}/><line x1="10" y1="35" x2="70" y2="35" {...p}/><path d="M4,48 Q20,42 40,48 Q60,54 76,48" {...p} strokeOpacity="0.5"/></svg>;

    if (n.includes('spa') || n.includes('wellness') || n.includes('sauna'))
        return <svg viewBox="0 0 80 64" {...base}><ellipse cx="40" cy="36" rx="26" ry="18" {...p}/><path d="M24,28 Q32,12 40,18 Q48,24 56,12" {...p} strokeOpacity="0.6"/><circle cx="40" cy="38" r="6" {...p}/></svg>;

    if (n.includes('garden') || n.includes('lawn') || n.includes('park') || n.includes('green'))
        return <svg viewBox="0 0 80 64" {...base}><path d="M40,50 L40,20" {...p}/><path d="M40,20 Q24,14 20,28 Q28,24 40,28" {...p}/><path d="M40,28 Q56,22 60,36 Q52,32 40,36" {...p}/><line x1="10" y1="50" x2="70" y2="50" {...p} strokeOpacity="0.4"/></svg>;

    if (n.includes('security') || n.includes('cctv'))
        return <svg viewBox="0 0 80 64" {...base}><path d="M40,8 L58,20 L54,50 L40,56 L26,50 L22,20 Z" {...p}/><circle cx="40" cy="34" r="8" {...p}/><line x1="40" y1="8" x2="40" y2="26" {...p}/></svg>;

    if (n.includes('parking') || n.includes('ev') || n.includes('charging'))
        return <svg viewBox="0 0 80 64" {...base}><rect x="10" y="22" width="44" height="22" rx="6" {...p}/><ellipse cx="20" cy="44" rx="6" ry="5" {...p}/><ellipse cx="44" cy="44" rx="6" ry="5" {...p}/><path d="M54,28 L66,32 L66,40 L54,40" {...p}/><line x1="62" y1="34" x2="72" y2="30" {...p} strokeOpacity="0.5"/></svg>;

    if (n.includes('kids') || n.includes('children') || n.includes('play'))
        return <svg viewBox="0 0 80 64" {...base}><path d="M16,50 L24,28 L32,42 L40,18 L48,42 L56,28 L64,50" {...p}/><circle cx="40" cy="14" r="5" {...p}/><line x1="8" y1="50" x2="72" y2="50" {...p}/></svg>;

    if (n.includes('tennis'))
        return <svg viewBox="0 0 80 64" {...base}><rect x="8" y="12" width="64" height="40" rx="2" {...p}/><line x1="40" y1="12" x2="40" y2="52" {...p}/><line x1="8" y1="32" x2="72" y2="32" {...p}/><path d="M8,20 Q20,32 8,44" {...p} strokeOpacity="0.5"/><path d="M72,20 Q60,32 72,44" {...p} strokeOpacity="0.5"/></svg>;

    if (n.includes('cricket'))
        return <svg viewBox="0 0 80 64" {...base}><ellipse cx="40" cy="32" rx="28" ry="22" {...p}/><ellipse cx="40" cy="32" rx="8" ry="6" {...p}/><line x1="40" y1="10" x2="40" y2="54" {...p} strokeOpacity="0.4"/><line x1="12" y1="32" x2="68" y2="32" {...p} strokeOpacity="0.4"/></svg>;

    if (n.includes('yoga') || n.includes('aerobic') || n.includes('meditation'))
        return <svg viewBox="0 0 80 64" {...base}><circle cx="40" cy="12" r="5" {...p}/><line x1="40" y1="17" x2="40" y2="40" {...p}/><path d="M40,24 L20,32" {...p}/><path d="M40,24 L60,32" {...p}/><path d="M40,40 L28,54" {...p}/><path d="M40,40 L52,54" {...p}/></svg>;

    if (n.includes('library') || n.includes('book') || n.includes('reading'))
        return <svg viewBox="0 0 80 64" {...base}><rect x="10" y="12" width="10" height="40" rx="2" {...p}/><rect x="24" y="18" width="10" height="34" rx="2" {...p}/><rect x="38" y="8" width="10" height="44" rx="2" {...p}/><rect x="52" y="14" width="10" height="38" rx="2" {...p}/><line x1="8" y1="52" x2="64" y2="52" {...p}/></svg>;

    if (n.includes('atm') || n.includes('supermarket') || n.includes('convenience'))
        return <svg viewBox="0 0 80 64" {...base}><rect x="14" y="20" width="52" height="34" rx="3" {...p}/><rect x="24" y="10" width="32" height="12" rx="2" {...p}/><rect x="22" y="30" width="14" height="16" rx="2" {...p}/><rect x="44" y="30" width="14" height="10" rx="2" {...p}/></svg>;

    if (n.includes('jogging') || n.includes('track') || n.includes('running'))
        return <svg viewBox="0 0 80 64" {...base}><rect x="8" y="12" width="64" height="40" rx="20" {...p}/><rect x="16" y="20" width="48" height="24" rx="12" {...p}/><circle cx="40" cy="10" r="4" {...p}/><path d="M36,14 L28,28" {...p}/><path d="M36,14 L44,22" {...p}/></svg>;

    if (n.includes('café') || n.includes('cafe') || n.includes('lounge') || n.includes('bar'))
        return <svg viewBox="0 0 80 64" {...base}><path d="M16,48 L20,20 L52,20 L56,48 Z" {...p}/><path d="M52,28 Q64,28 64,36 Q64,44 52,40" {...p}/><line x1="10" y1="48" x2="70" y2="48" {...p}/><path d="M30,20 Q30,10 36,10 Q42,10 42,20" {...p} strokeOpacity="0.5"/></svg>;

    return <svg viewBox="0 0 80 64" {...base}><rect x="10" y="16" width="60" height="32" rx="4" {...p}/><line x1="10" y1="28" x2="70" y2="28" {...p}/><rect x="22" y="32" width="10" height="10" rx="1" {...p}/><rect x="40" y="32" width="18" height="10" rx="1" {...p}/><circle cx="40" cy="10" r="5" {...p} strokeOpacity="0.4"/></svg>;
}

function getAmenityMeta(name: string, sz = 18): { node: JSX.Element } {
    const n = name.toLowerCase();
    if (n.includes('pool') || n.includes('swim')) return {node: <Waves size={sz}/>};
    if (n.includes('gym') || n.includes('fitness')) return {node: <Activity size={sz}/>};
    if (n.includes('club')) return {node: <Building2 size={sz}/>};
    if (n.includes('garden') || n.includes('lawn')) return {node: <Trees size={sz}/>};
    if (n.includes('terrace') || n.includes('rooftop')) return {node: <Globe size={sz}/>};
    if (n.includes('park') && !n.includes('parking')) return {node: <Trees size={sz}/>};
    if (n.includes('security') || n.includes('cctv')) return {node: <Shield size={sz}/>};
    if (n.includes('ev') || n.includes('charging')) return {node: <Zap size={sz}/>};
    if (n.includes('parking')) return {node: <Navigation size={sz}/>};
    if (n.includes('smart') || n.includes('home tech')) return {node: <Home size={sz}/>};
    if (n.includes('power') || n.includes('backup')) return {node: <Zap size={sz}/>};
    if (n.includes('water') || n.includes('ro')) return {node: <Droplets size={sz}/>};
    if (n.includes('lift') || n.includes('elevator')) return {node: <Building2 size={sz}/>};
    if (n.includes('tennis') || n.includes('sport')) return {node: <Trophy size={sz}/>};
    if (n.includes('children') || n.includes('kids')) return {node: <Heart size={sz}/>};
    if (n.includes('library')) return {node: <BookOpen size={sz}/>};
    if (n.includes('spa') || n.includes('wellness')) return {node: <Sparkles size={sz}/>};
    if (n.includes('jogging') || n.includes('track')) return {node: <Activity size={sz}/>};
    if (n.includes('wifi') || n.includes('internet')) return {node: <Wifi size={sz}/>};
    if (n.includes('concierge') || n.includes('lobby')) return {node: <Bell size={sz}/>};
    if (n.includes('café') || n.includes('cafe') || n.includes('coffee')) return {node: <Coffee size={sz}/>};
    if (n.includes('gas') || n.includes('png')) return {node: <Flame size={sz}/>};
    if (n.includes('staff') || n.includes('maintenance')) return {node: <Users size={sz}/>};
    if (n.includes('badminton') || n.includes('basketball') || n.includes('squash')) return {node: <Trophy size={sz}/>};
    return {node: <CheckCircle2 size={sz}/>};
}

// ── Amenity categorization ────────────────────────────────────────────────────
const AMENITY_CATS = [
    { key: 'fitness',     label: 'Fitness',     keywords: ['pool','swim','gym','fitness','yoga','spa','wellness','aerobic','jogging','track'] },
    { key: 'recreation',  label: 'Recreation',  keywords: ['club','lounge','amphitheatre','banquet','party','garden','terrace','rooftop','café','cafe','library','bar'] },
    { key: 'sports',      label: 'Sports',      keywords: ['tennis','badminton','basketball','squash','cricket','chess','sport','court'] },
    { key: 'convenience', label: 'Convenience', keywords: ['security','cctv','ev','charging','parking','power','backup','water','ro','lift','elevator','wifi','wi-fi','internet','gas','png','staff','maintenance','concierge'] },
    { key: 'family',      label: 'Family',      keywords: ['children','kids','play','pet','senior','family'] },
];

function categorizeAmenities(amenities: string[]): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    const used = new Set<string>();
    for (const cat of AMENITY_CATS) {
        for (const a of amenities) {
            const lower = a.toLowerCase();
            if (!used.has(a) && cat.keywords.some(kw => lower.includes(kw))) {
                if (!result[cat.key]) result[cat.key] = [];
                result[cat.key].push(a);
                used.add(a);
            }
        }
    }
    const other = amenities.filter(a => !used.has(a));
    if (other.length) result['other'] = other;
    return result;
}

// ── Leaflet pin factories ─────────────────────────────────────────────────────
function makeCatEmoji(cat: NearbyPlace['category']): string {
    switch (cat) {
        case 'hospital':    return '🏥';
        case 'school':      return '🎓';
        case 'transit':     return '🚉';
        case 'mall':        return '🛍';
        case 'park':        return '🌳';
        case 'supermarket': return '🛒';
    }
}

function makeNearbyPin(L: LeafletModule, _color: string, name: string, distKm: number, cat?: NearbyPlace['category']): LeafletType.DivIcon {
    const label = name.length > 22 ? name.slice(0, 20) + '…' : name;
    const emoji = cat ? makeCatEmoji(cat) : '📍';
    return L.divIcon({
        html: `<div style="display:inline-flex;align-items:center;gap:5px;background:rgba(245,240,232,0.97);border-radius:24px;padding:5px 11px 5px 8px;box-shadow:0 2px 12px rgba(0,0,0,0.15),0 1px 3px rgba(0,0,0,0.08);white-space:nowrap;border:1px solid rgba(0,0,0,0.07);pointer-events:auto;backdrop-filter:blur(4px);">
      <span style="font-size:12px;line-height:1;">${emoji}</span>
      <span style="font-size:11px;font-weight:700;color:#1C2B3A;font-family:'Plus Jakarta Sans',-apple-system,sans-serif;line-height:1.2;">${label}</span>
      <span style="font-size:10px;color:#9A8F80;font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-weight:500;margin-left:2px;">${distKm.toFixed(1)} km</span>
    </div>`,
        iconAnchor: [8, 13], popupAnchor: [80, -10], className: '',
    });
}

function makeProjectPin(L: LeafletModule): LeafletType.DivIcon {
    return L.divIcon({
        html: `<div style="position:relative;width:24px;height:24px;">
      <div style="width:24px;height:24px;border-radius:50%;background:#C9A86C;border:3px solid white;box-shadow:0 3px 12px rgba(201,168,108,0.6),0 1px 4px rgba(0,0,0,0.2);"></div>
      <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid #C9A86C;"></div>
    </div>`,
        iconSize: [24, 30], iconAnchor: [12, 30], popupAnchor: [0, -32], className: '',
    });
}

function makeAddressControl(L: LeafletModule, address: string, coords: Coords, mapsUrl: string | null, projectName: string): LeafletType.Control {
    const ctrl = new L.Control({ position: 'bottomleft' });
    ctrl.onAdd = () => {
        const div = L.DomUtil.create('div');
        L.DomEvent.disableClickPropagation(div);
        div.innerHTML = `
          <div style="background:white;border-radius:18px;padding:18px 20px 14px;box-shadow:0 8px 32px rgba(0,0,0,0.16),0 2px 8px rgba(0,0,0,0.08);max-width:260px;font-family:'Plus Jakarta Sans',-apple-system,sans-serif;">
            <div style="font-size:9px;font-weight:800;letter-spacing:0.14em;color:#9A8F80;text-transform:uppercase;margin-bottom:6px;">Address</div>
            <div style="font-size:16px;font-weight:700;color:#1C2B3A;line-height:1.35;margin-bottom:4px;">${projectName}</div>
            <div style="font-size:12px;color:#5A6672;line-height:1.5;margin-bottom:4px;">${address}</div>
            <div style="font-size:10px;color:#9A8F80;margin-bottom:12px;">${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E</div>
            <div style="display:flex;gap:8px;">
              ${mapsUrl ? `<a href="${mapsUrl}" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;gap:4px;padding:7px 14px;border-radius:99px;border:1px solid #E5E0D8;background:#FAFAF8;font-size:12px;font-weight:600;color:#1C2B3A;text-decoration:none;cursor:pointer;">&#x276F; Directions</a>` : ''}
              <button onclick="navigator.clipboard?.writeText('${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}')" style="display:inline-flex;align-items:center;gap:4px;padding:7px 14px;border-radius:99px;border:1px solid #E5E0D8;background:#FAFAF8;font-size:12px;font-weight:600;color:#1C2B3A;cursor:pointer;">&#x2756; Share pin</button>
            </div>
          </div>`;
        return div;
    };
    return ctrl;
}

// ── Geo utilities ─────────────────────────────────────────────────────────────
function extractCoords(url: string): Coords | null {
    if (!url) return null;
    const pin = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (pin) return {lat: parseFloat(pin[1]), lng: parseFloat(pin[2])};
    const at = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (at) return {lat: parseFloat(at[1]), lng: parseFloat(at[2])};
    return null;
}

function haversineKm(a: Coords, b: Coords): number {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

async function fetchNearbyPlaces(center: Coords, signal: AbortSignal): Promise<NearbyPlace[]> {
    const r = 5000;
    const {lat, lng} = center;
    const query = `[out:json][timeout:15];(
    nwr["amenity"="hospital"](around:${r},${lat},${lng});
    nwr["amenity"="school"](around:${r},${lat},${lng});
    nwr["railway"="station"]["name"](around:${r},${lat},${lng});
    nwr["shop"="mall"](around:${r},${lat},${lng});
    nwr["leisure"~"^(park|garden)$"](around:${r},${lat},${lng});
    nwr["shop"="supermarket"](around:${r},${lat},${lng});
  );out center 100;`;
    const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST', body: 'data=' + encodeURIComponent(query), signal,
    });
    if (!res.ok) throw new Error('Overpass failed');
    const json = await res.json() as {
        elements: Array<{
            type: string; id: number; lat?: number; lon?: number;
            center?: { lat: number; lon: number }; tags?: Record<string, string>;
        }>;
    };
    const places: NearbyPlace[] = [];
    for (const e of json.elements) {
        const tags = e.tags ?? {};
        const name = tags.name;
        if (!name) continue;
        const elat = e.lat ?? e.center?.lat;
        const elng = e.lon ?? e.center?.lon;
        if (elat == null || elng == null) continue;
        let category: NearbyPlace['category'] | null = null;
        if (tags.amenity === 'hospital') category = 'hospital';
        else if (tags.amenity === 'school') category = 'school';
        else if (tags.railway === 'station') category = 'transit';
        else if (tags.shop === 'mall') category = 'mall';
        else if (tags.leisure === 'park' || tags.leisure === 'garden') category = 'park';
        else if (tags.shop === 'supermarket') category = 'supermarket';
        if (!category) continue;
        places.push({
            id: `${e.type}/${e.id}`, name, category,
            lat: elat, lng: elng,
            distanceKm: haversineKm(center, {lat: elat, lng: elng}),
        });
    }
    return places.sort((a, b) => a.distanceKm - b.distanceKm);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
    PRE_LAUNCH: 'Pre-Launch', LAUNCHED: 'Launched',
    UNDER_CONSTRUCTION: 'Under Construction', READY_TO_MOVE: 'Ready to Move',
    NEW_LAUNCH: 'New Launch', ACTIVE: 'Active', CLOSING_SOON: 'Closing Soon',
};

const fmtPrice = (n?: number | null) => {
    if (!n) return '—';
    if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
    if (n >= 100_000) return `₹${(n / 100_000).toFixed(0)} L`;
    return `₹${n.toLocaleString('en-IN')}`;
};

interface TourLink { label: string; url: string; }

function parseTours(videoUrl: string | null): TourLink[] {
    if (!videoUrl) return [];
    try {
        const parsed = JSON.parse(videoUrl);
        if (Array.isArray(parsed)) return parsed as TourLink[];
    } catch { /* plain URL */ }
    return [{label: 'Project Tour', url: videoUrl}];
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
        u.searchParams.delete('usp');
        return u.toString();
    } catch { return null; }
}

// ── Unit matrix ───────────────────────────────────────────────────────────────
type UnitStatus = 'available' | 'booked' | 'sold' | 'hold';
interface MatrixUnit { id: string; floor: number; unit: number; bhk: string; status: UnitStatus; }
interface TowerData { tower: string; floors: { floor: number; units: MatrixUnit[] }[]; }

function buildUnitMatrix(project: ProjectDetail): TowerData[] {
    const numTowers = Math.max(1, project.towers ?? 1);
    const total = Math.max(0, project.totalUnits ?? 0);
    if (total === 0) return [];
    const numFloors = Math.max(1, project.floorsPerTower ?? Math.min(Math.ceil(total / (numTowers * 4)), 20));
    const perFloor = Math.max(1, Math.ceil(total / (numTowers * numFloors)));
    const configs = project.configurations?.length ? project.configurations : ['—'];
    const soldCount = Math.min(project.soldUnits ?? 0, total);
    const bookedCount = Math.min(project.bookedUnits ?? 0, total - soldCount);
    const holdCount = Math.max(0, total - soldCount - bookedCount - Math.max(0, project.availableUnits ?? (total - soldCount - bookedCount)));
    const statuses: UnitStatus[] = [];
    let s = soldCount, b = bookedCount, h = holdCount;
    for (let i = 0; i < total; i++) {
        if (s > 0) { statuses.push('sold'); s--; }
        else if (b > 0) { statuses.push('booked'); b--; }
        else if (h > 0) { statuses.push('hold'); h--; }
        else { statuses.push('available'); }
    }
    const towers: TowerData[] = [];
    for (let t = 0; t < numTowers; t++) {
        const floorRows: TowerData['floors'] = [];
        for (let f = numFloors; f >= 1; f--) {
            const units: MatrixUnit[] = [];
            for (let u = 1; u <= perFloor; u++) {
                const idx = t * numFloors * perFloor + (numFloors - f) * perFloor + (u - 1);
                if (idx < total) units.push({
                    id: `${String.fromCharCode(65 + t)}-${f}0${u}`, floor: f, unit: u,
                    bhk: configs[(u - 1) % configs.length], status: statuses[idx],
                });
            }
            if (units.length) floorRows.push({floor: f, units});
        }
        towers.push({tower: String.fromCharCode(65 + t), floors: floorRows});
    }
    return towers;
}

// ── Floor plan placeholder SVG ────────────────────────────────────────────────
function FloorPlanSVG({bhk, locality}: { bhk: string; locality?: string | null }) {
    const is4 = bhk.includes('4');
    const is3 = bhk.includes('3');
    return (
        <svg viewBox="0 0 400 320" style={{width: '100%', height: '100%', display: 'block'}}>
            <rect width="400" height="320" fill="#FAFAF8"/>
            <rect x="20" y="20" width="360" height="32" fill="rgba(201,168,108,0.08)"/>
            <rect x="20" y="20" width="360" height="280" fill="none" stroke={T.ink} strokeWidth="2.5"/>
            <line x1="20" y1="52" x2="380" y2="52" stroke={T.ink} strokeWidth="1.5"/>
            <text x="200" y="38" textAnchor="middle" fontFamily="Georgia, serif" fontSize="9" fill={T.aInk} fontStyle="italic">
                Balcony · {locality ?? 'city view'}
            </text>
            {is4 ? (
                <>
                    <line x1="150" y1="52" x2="150" y2="180" stroke={T.ink} strokeWidth="1.2"/>
                    <line x1="270" y1="52" x2="270" y2="180" stroke={T.ink} strokeWidth="1.2"/>
                    <line x1="20" y1="180" x2="380" y2="180" stroke={T.ink} strokeWidth="1.2"/>
                    <line x1="120" y1="180" x2="120" y2="300" stroke={T.ink} strokeWidth="1.2"/>
                    <line x1="220" y1="180" x2="220" y2="300" stroke={T.ink} strokeWidth="1.2"/>
                    <line x1="310" y1="180" x2="310" y2="300" stroke={T.ink} strokeWidth="1.2"/>
                    {[
                        {x:85,y:116,l:'MASTER SUITE',d:"16'×13'"},{x:210,y:116,l:'GREAT ROOM',d:"24'×16'"},
                        {x:325,y:116,l:'STUDY',d:"12'×10'"},{x:70,y:244,l:'BED 2',d:"12'×11'"},
                        {x:170,y:244,l:'BED 3',d:"11'×11'"},{x:265,y:244,l:'KITCHEN',d:"12'×9'"},
                        {x:345,y:244,l:'UTIL',d:"8'×9'"},
                    ].map(r => (
                        <g key={r.l}>
                            <text x={r.x} y={r.y} textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="9" fill={T.ink2}>{r.l}</text>
                            <text x={r.x} y={r.y+13} textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="8" fill={T.muted}>{r.d}</text>
                        </g>
                    ))}
                </>
            ) : is3 ? (
                <>
                    <line x1="180" y1="52" x2="180" y2="180" stroke={T.ink} strokeWidth="1.2"/>
                    <line x1="20" y1="180" x2="380" y2="180" stroke={T.ink} strokeWidth="1.2"/>
                    <line x1="120" y1="180" x2="120" y2="300" stroke={T.ink} strokeWidth="1.2"/>
                    <line x1="270" y1="180" x2="270" y2="300" stroke={T.ink} strokeWidth="1.2"/>
                    {[
                        {x:100,y:120,l:'MASTER BED',d:"13'×12'"},{x:280,y:120,l:'LIVING',d:"18'×12'"},
                        {x:70,y:244,l:'BED 2',d:"11'×12'"},{x:195,y:244,l:'BED 3',d:"10'×12'"},
                        {x:325,y:244,l:'KITCHEN',d:"11'×8'"},
                    ].map(r => (
                        <g key={r.l}>
                            <text x={r.x} y={r.y} textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="9" fill={T.ink2}>{r.l}</text>
                            <text x={r.x} y={r.y+13} textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="8" fill={T.muted}>{r.d}</text>
                        </g>
                    ))}
                </>
            ) : (
                <>
                    <line x1="200" y1="52" x2="200" y2="300" stroke={T.ink} strokeWidth="1.2"/>
                    <line x1="20" y1="190" x2="200" y2="190" stroke={T.ink} strokeWidth="1.2"/>
                    {[
                        {x:110,y:120,l:'MASTER BED',d:"14'×13'"},{x:300,y:170,l:'LIVING',d:"18'×14'"},
                        {x:110,y:248,l:'BED 2',d:"12'×11'"},
                    ].map(r => (
                        <g key={r.l}>
                            <text x={r.x} y={r.y} textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="9" fill={T.ink2}>{r.l}</text>
                            <text x={r.x} y={r.y+13} textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="8" fill={T.muted}>{r.d}</text>
                        </g>
                    ))}
                </>
            )}
            <g transform="translate(370,295)" opacity="0.4">
                <circle cx="0" cy="0" r="9" fill="none" stroke={T.muted}/>
                <path d="M0,-6 L2.5,0 L0,1.5 L-2.5,0Z" fill={T.ink}/>
                <text x="0" y="-12" textAnchor="middle" fontFamily="monospace" fontSize="7" fill={T.muted}>N</text>
            </g>
        </svg>
    );
}

function getConfigSpecs(bhk: string): {carpet:string;superBuiltUp:string;rooms:{name:string;size:string}[]}{
    if (bhk.includes('4') || bhk.includes('5')) return {
        carpet:'1,950 – 2,200',superBuiltUp:'2,450 – 2,750',
        rooms:[{name:'Master Bedroom',size:"16' × 14'"},{name:'Bedroom 2',size:"13' × 12'"},
            {name:'Bedroom 3',size:"12' × 11'"},{name:'Bedroom 4',size:"11' × 10'"},
            {name:'Living / Dining',size:"22' × 16'"},{name:'Kitchen',size:"13' × 10'"},
            {name:'Balcony',size:"10' × 5'"},{name:'Utility',size:"7' × 5'"}],
    };
    if (bhk.includes('3')) return {
        carpet:'1,350 – 1,580',superBuiltUp:'1,700 – 1,980',
        rooms:[{name:'Master Bedroom',size:"14' × 13'"},{name:'Bedroom 2',size:"12' × 11'"},
            {name:'Bedroom 3',size:"11' × 10'"},{name:'Living / Dining',size:"18' × 14'"},
            {name:'Kitchen',size:"11' × 9'"},{name:'Balcony',size:"9' × 5'"}],
    };
    if (bhk.includes('2')) return {
        carpet:'970 – 1,150',superBuiltUp:'1,220 – 1,450',
        rooms:[{name:'Master Bedroom',size:"13' × 12'"},{name:'Bedroom 2',size:"11' × 11'"},
            {name:'Living / Dining',size:"16' × 12'"},{name:'Kitchen',size:"10' × 8'"},
            {name:'Balcony',size:"8' × 5'"}],
    };
    if (bhk.includes('1')) return {
        carpet:'550 – 680',superBuiltUp:'700 – 870',
        rooms:[{name:'Bedroom',size:"13' × 12'"},{name:'Living / Dining',size:"14' × 11'"},
            {name:'Kitchen',size:"9' × 8'"},{name:'Balcony',size:"7' × 5'"}],
    };
    return {
        carpet:'380 – 480',superBuiltUp:'490 – 620',
        rooms:[{name:'Studio Room',size:"16' × 14'"},{name:'Kitchen',size:"9' × 7'"},
            {name:'Balcony',size:"6' × 4'"}],
    };
}

function buildFaq(p: ProjectDetail) {
    return [
        {
            q:`What configurations are available in ${p.name}?`,
            a:p.configurations?.length
                ?`${p.name} offers ${p.configurations.join(', ')} configurations${p.totalUnits?` across ${p.totalUnits} homes`:''}.`
                :'Please contact us for configuration details.',
        },
        {
            q:'When is the expected possession date?',
            a:p.possessionDate
                ?`The expected possession date is ${new Date(p.possessionDate).toLocaleDateString('en-IN',{month:'long',year:'numeric'})}. Construction is progressing as per RERA timelines.`
                :'Possession timelines are available on request. Please schedule a site visit for the latest update.',
        },
        {
            q:'What is the RERA registration status?',
            a:p.reraNumber
                ?`${p.name} is registered under RERA with number ${p.reraNumber}${p.reraState?` (${p.reraState})`:''}. You can verify this on the official RERA portal.`
                :'RERA registration details are available on request.',
        },
        {
            q:'What are the payment plan options?',
            a:`Standard payment plans include 20:80 (20% on booking, 80% on possession), construction-linked plans, and bank-assisted pre-EMI plans. Contact our team for a personalised payment structure.`,
        },
        {
            q:'What amenities are included?',
            a:p.amenities?.length
                ?`${p.name} features ${p.amenities.slice(0,5).join(', ')}${p.amenities.length>5?` and ${p.amenities.length-5} more lifestyle amenities`:''}.`
                :'A full list of amenities is available on request.',
        },
        {
            q:'Can NRIs invest in this project?',
            a:'Yes, NRI investments are fully compliant with FEMA regulations. We provide dedicated NRI desk support for documentation, home loans, and repatriation.',
        },
    ];
}

// ── Scroll container helper ───────────────────────────────────────────────────
function getScrollContainer(el: HTMLElement): HTMLElement | null {
    let p = el.parentElement;
    while (p && p !== document.documentElement) {
        const ov = getComputedStyle(p).overflowY;
        if ((ov === 'auto' || ov === 'scroll') && p.scrollHeight > p.clientHeight) return p;
        p = p.parentElement;
    }
    return null;
}

// ── GSAP scroll-reveal component (matches EIPL: y:30, power2.out, 0.6s) ──────
function AnimateIn({
    children, delay = 0, direction = 'up', style,
}: {
    children: React.ReactNode;
    delay?: number;
    direction?: 'up' | 'left' | 'right';
    style?: React.CSSProperties;
}) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const fromY = direction === 'up' ? 30 : 0;
        const fromX = direction === 'left' ? -30 : direction === 'right' ? 30 : 0;
        gsap.set(el, { opacity: 0, y: fromY, x: fromX });
        const scroller = getScrollContainer(el) ?? window;
        // Save and restore scroll position around ScrollTrigger.create() to prevent
        // the internal refresh() call from visibly snapping the page to scrollTop 0.
        const scrollEl = scroller === window ? document.documentElement : (scroller as HTMLElement);
        const savedScroll = scrollEl.scrollTop;
        const st = ScrollTrigger.create({
            trigger: el,
            scroller,
            start: 'top 85%',
            once: true,
            onEnter: () => gsap.to(el, {
                opacity: 1, y: 0, x: 0,
                duration: 0.6,
                delay: delay / 1000,
                ease: 'power2.out',
                clearProps: 'transform',
            }),
        });
        if (scrollEl.scrollTop !== savedScroll) scrollEl.scrollTop = savedScroll;
        return () => { st.kill(); gsap.set(el, { clearProps: 'all' }); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return <div ref={ref} style={style}>{children}</div>;
}

// ── Word-by-word heading reveal (matches EIPL SplitText) ─────────────────────
// Words are pre-rendered as React elements — no innerHTML mutation, React-safe.
// `hasAnimated` ref ensures the animation fires exactly once regardless of re-renders.
function SplitHeading({ text, style, immediate = false }: {
    text: string;
    style?: React.CSSProperties;
    immediate?: boolean;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;
        const el = ref.current;
        if (!el) return;
        const spans = el.querySelectorAll<HTMLElement>('.sw-inner');
        if (immediate) {
            gsap.fromTo(spans,
                { y: '110%' },
                { y: 0, duration: 1, stagger: 0.06, ease: 'power3.out', delay: 0.3 },
            );
        } else {
            const scroller = getScrollContainer(el) ?? window;
            const scrollEl = scroller === window ? document.documentElement : (scroller as HTMLElement);
            const savedScroll = scrollEl.scrollTop;
            const st = ScrollTrigger.create({
                trigger: el, scroller, start: 'top 88%', once: true,
                onEnter: () => gsap.fromTo(spans,
                    { y: '110%' },
                    { y: 0, duration: 0.75, stagger: 0.07, ease: 'power3.out' },
                ),
            });
            if (scrollEl.scrollTop !== savedScroll) scrollEl.scrollTop = savedScroll;
            return () => st.kill();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div ref={ref} style={style}>
            {String(text).split(' ').map((word, i, arr) => (
                <span key={i} style={{display:'inline-block',overflow:'hidden',verticalAlign:'bottom'}}>
                    <span className="sw-inner" style={{display:'inline-block'}}>
                        {word}{i < arr.length - 1 ? ' ' : ''}
                    </span>
                </span>
            ))}
        </div>
    );
}

// ── Hero Carousel — isolated component so auto-advance never re-renders the page ──
interface HeroCarouselProps {
    images: { fileUrl: string }[];
    projectName: string;
    builderName?: string | null;
    reraNumber?: string | null;
    featured?: boolean;
    closingSoon?: boolean;
    locality?: string | null;
    city?: string | null;
    priceMin?: number | null;
    priceMax?: number | null;
    statusLbl: string;
    configs: string[];
    tours: { label: string; url: string }[];
    shortlisted: boolean;
    isStandalone: boolean;
    onBack: () => void;
    onToggleShortlist: () => void;
    onShare: () => void;
    onOpenFullscreen: () => void;
    fmtPrice: (n?: number | null) => string;
    accent: string;
    ink: string;
    sans: string;
    serif: string;
    mono: string;
}

const HeroCarousel = ({
    images, projectName, builderName, reraNumber, featured, closingSoon,
    locality, city, priceMin, priceMax, statusLbl, configs, tours,
    shortlisted, isStandalone, onBack, onToggleShortlist, onShare, onOpenFullscreen,
    fmtPrice, accent, ink, sans, serif, mono,
}: HeroCarouselProps) => {
    const [idx, setIdx]       = useState(0);
    const [tick, setTick]     = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const INTERVAL = 5000;

    const startTimer = useCallback((total: number) => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (total > 1) timerRef.current = setInterval(() => {
            setIdx(p => (p + 1) % total);
            setTick(t => t + 1);
        }, INTERVAL);
    }, []);

    const goTo = useCallback((i: number) => {
        setIdx(i);
        setTick(t => t + 1);
        startTimer(images.length);
    }, [images.length, startTimer]);

    const goPrev = () => goTo((idx - 1 + images.length) % images.length);
    const goNext = () => goTo((idx + 1) % images.length);

    useEffect(() => {
        startTimer(images.length);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [images.length, startTimer]);

    const btnStyle: React.CSSProperties = {
        display:'flex', alignItems:'center', gap:6,
        background:'rgba(11,25,41,0.45)', backdropFilter:'blur(16px)',
        border:'1px solid rgba(255,255,255,0.14)', color:'rgba(255,255,255,0.9)',
        padding:'9px 18px', borderRadius:999, cursor:'pointer',
        fontFamily:sans, fontSize:13, fontWeight:600, transition:'all .18s',
    };

    return (
        <section style={{position:'relative', height:'100vh', minHeight:580, display:'flex', flexDirection:'column', justifyContent:'flex-end', overflow:'hidden'}}>
            <style>{`
                @keyframes kenBurns  { 0%{transform:scale(1) translate(0,0)} 100%{transform:scale(1.08) translate(-0.5%,-0.5%)} }
                @keyframes kenBurns2 { 0%{transform:scale(1.06) translate(0.5%,0.3%)} 100%{transform:scale(1) translate(0,0)} }
                @keyframes hcFadeIn  { from{opacity:0} to{opacity:1} }
                @keyframes progressW { from{width:0%} to{width:100%} }
                .hc-nav-btn:hover { background:rgba(255,255,255,0.14) !important; border-color:rgba(255,255,255,0.28) !important; }
                .hc-arrow:hover   { background:rgba(255,255,255,0.18) !important; transform:translateY(-50%) scale(1.08) !important; }
                .hc-thumb:hover   { opacity:1 !important; transform:scale(1.04) !important; }
            `}</style>

            {/* ── Background images — cross-fade with Ken Burns ── */}
            <div style={{position:'absolute', inset:0}}>
                {images.length > 0 ? images.map((img, i) => (
                    <div key={i} style={{
                        position:'absolute', inset:0, overflow:'hidden',
                        opacity: i === idx ? 1 : 0,
                        transition: 'opacity 1.1s cubic-bezier(0.4,0,0.2,1)',
                        zIndex: i === idx ? 1 : 0,
                    }}>
                        <img
                            key={`${i}-${tick}`}
                            src={img.fileUrl} alt=""
                            style={{
                                width:'100%', height:'100%', objectFit:'cover',
                                objectPosition:'center', display:'block',
                                animation: i === idx
                                    ? `${i % 2 === 0 ? 'kenBurns' : 'kenBurns2'} ${INTERVAL}ms ease-out forwards`
                                    : 'none',
                            }}
                        />
                    </div>
                )) : (
                    <div style={{position:'absolute',inset:0,background:`linear-gradient(155deg,${ink} 0%,#122840 50%,#1E3A5F 100%)`}}/>
                )}

                {/* Multi-layer overlays for depth */}
                <div style={{position:'absolute',inset:0,zIndex:2,pointerEvents:'none',
                    background:'linear-gradient(to right, rgba(11,25,41,0.72) 0%, rgba(11,25,41,0.18) 55%, transparent 100%)'}}/>
                <div style={{position:'absolute',inset:0,zIndex:2,pointerEvents:'none',
                    background:'linear-gradient(to bottom, rgba(11,25,41,0.22) 0%, transparent 28%, transparent 52%, rgba(11,25,41,0.75) 75%, rgba(11,25,41,0.98) 100%)'}}/>
                <div style={{position:'absolute',inset:0,zIndex:2,pointerEvents:'none',
                    background:'radial-gradient(ellipse at center, transparent 40%, rgba(11,25,41,0.35) 100%)'}}/>
            </div>

            {/* ── Top nav ── */}
            <div style={{position:'absolute',top:0,left:0,right:0,padding:'24px 40px',display:'flex',alignItems:'center',justifyContent:'space-between',zIndex:10}}>
                <button onClick={onBack} className="hc-nav-btn" style={{...btnStyle}}>
                    <ChevronLeft size={14}/> All Projects
                </button>

                {/* Image counter */}
                {images.length > 1 && (
                    <div style={{fontFamily:mono,fontSize:11,letterSpacing:'0.14em',color:'rgba(255,255,255,0.5)',
                        background:'rgba(11,25,41,0.5)',backdropFilter:'blur(12px)',
                        border:'1px solid rgba(255,255,255,0.1)',borderRadius:999,padding:'6px 14px'}}>
                        {String(idx+1).padStart(2,'0')} / {String(images.length).padStart(2,'0')}
                    </div>
                )}

                <div style={{display:'flex',gap:8}}>
                    {reraNumber && (
                        <span style={{...btnStyle, padding:'8px 14px', cursor:'default',
                            color:accent, borderColor:'rgba(201,168,108,0.35)', display:'flex', alignItems:'center', gap:5}}>
                            <Shield size={10}/> RERA
                        </span>
                    )}
                    <button onClick={onToggleShortlist} className="hc-nav-btn" style={{...btnStyle,
                        borderColor: shortlisted ? accent : 'rgba(255,255,255,0.14)',
                        color: shortlisted ? accent : 'rgba(255,255,255,0.85)'}}>
                        <Bookmark size={14} fill={shortlisted ? accent : 'none'}/> {shortlisted ? 'Saved' : 'Save'}
                    </button>
                    <button onClick={onShare} className="hc-nav-btn" style={{...btnStyle, padding:'9px 14px'}}>
                        <Share2 size={14}/>
                    </button>
                    {!isStandalone && (
                        <button onClick={onOpenFullscreen} className="hc-nav-btn" style={{...btnStyle, padding:'9px 14px'}}>
                            <Maximize2 size={14}/>
                        </button>
                    )}
                </div>
            </div>

            {/* ── Left / Right nav arrows ── */}
            {images.length > 1 && (<>
                <button onClick={goPrev} className="hc-arrow" style={{
                    position:'absolute', left:20, top:'50%', transform:'translateY(-50%)', zIndex:10,
                    width:48, height:48, borderRadius:'50%',
                    background:'rgba(11,25,41,0.45)', backdropFilter:'blur(16px)',
                    border:'1px solid rgba(255,255,255,0.14)', color:'#fff',
                    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all .18s',
                }}>
                    <ChevronLeft size={22}/>
                </button>
                <button onClick={goNext} className="hc-arrow" style={{
                    position:'absolute', right:20, top:'50%', transform:'translateY(-50%)', zIndex:10,
                    width:48, height:48, borderRadius:'50%',
                    background:'rgba(11,25,41,0.45)', backdropFilter:'blur(16px)',
                    border:'1px solid rgba(255,255,255,0.14)', color:'#fff',
                    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all .18s',
                }}>
                    <ChevronRight size={22}/>
                </button>
            </>)}

            {/* ── Hero content ── */}
            <div style={{position:'relative',zIndex:5,padding:'0 40px 32px',maxWidth:1280,width:'100%'}}>
                <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:16,flexWrap:'wrap' as const}}>
                    {builderName && (
                        <span style={{fontFamily:mono,fontSize:10.5,letterSpacing:'0.2em',color:accent,textTransform:'uppercase' as const}}>
                            {builderName}
                        </span>
                    )}
                    {featured && (
                        <span style={{fontFamily:mono,fontSize:10,letterSpacing:'0.1em',color:accent,display:'flex',alignItems:'center',gap:4}}>
                            <Star size={9} fill="currentColor"/> FEATURED
                        </span>
                    )}
                    {closingSoon && (
                        <span style={{fontFamily:mono,fontSize:10,letterSpacing:'0.1em',color:'#FCA5A5',
                            background:'rgba(252,165,165,0.1)',border:'1px solid rgba(252,165,165,0.25)',
                            borderRadius:999,padding:'3px 10px'}}>
                            CLOSING SOON
                        </span>
                    )}
                </div>

                <div style={{fontFamily:serif,fontSize:'clamp(48px,8vw,110px)',fontWeight:300,lineHeight:0.92,
                    letterSpacing:'-0.03em',color:'#FFFFFF',margin:'0 0 24px',maxWidth:1040,
                    textShadow:'0 2px 32px rgba(11,25,41,0.4)'}}>
                    {projectName}
                </div>

                <div style={{display:'flex',flexWrap:'wrap' as const,gap:'8px 20px',alignItems:'center'}}>
                    {(locality||city) && (
                        <div style={{display:'flex',alignItems:'center',gap:7,color:'rgba(255,255,255,0.78)',fontSize:14,fontFamily:sans,fontWeight:500}}>
                            <MapPin size={13} style={{color:accent}}/>{[locality,city].filter(Boolean).join(', ')}
                        </div>
                    )}
                    {priceMin && (<>
                        <div style={{width:1,height:14,background:'rgba(255,255,255,0.2)'}}/>
                        <div style={{color:accent,fontFamily:serif,fontStyle:'italic',fontSize:22,fontWeight:300}}>
                            {fmtPrice(priceMin)}{priceMax && priceMax!==priceMin &&
                                <span style={{fontSize:14,opacity:0.55,fontFamily:sans,fontStyle:'normal'}}> – {fmtPrice(priceMax)}</span>}
                        </div>
                    </>)}
                    {statusLbl && (<>
                        <div style={{width:1,height:14,background:'rgba(255,255,255,0.2)'}}/>
                        <span style={{fontFamily:mono,fontSize:10,letterSpacing:'0.1em',color:'rgba(255,255,255,0.5)',
                            border:'1px solid rgba(255,255,255,0.15)',padding:'4px 12px',borderRadius:999,
                            background:'rgba(11,25,41,0.4)',backdropFilter:'blur(8px)'}}>
                            {statusLbl.toUpperCase()}
                        </span>
                    </>)}
                    {configs.length > 0 && (<>
                        <div style={{width:1,height:14,background:'rgba(255,255,255,0.2)'}}/>
                        <span style={{color:'rgba(255,255,255,0.55)',fontSize:13,fontFamily:sans}}>{configs.join(' · ')}</span>
                    </>)}
                </div>
            </div>

            {/* ── Thumbnail strip + progress bar ── */}
            {images.length > 1 && (
                <div style={{position:'relative',zIndex:5,padding:'0 40px 0'}}>
                    {/* Thumbnails */}
                    <div style={{display:'flex',gap:8,overflowX:'auto',scrollbarWidth:'none' as const,paddingBottom:20,alignItems:'flex-end'}}>
                        {images.slice(0,8).map((img,i) => (
                            <div key={i} onClick={() => goTo(i)} className="hc-thumb"
                                style={{
                                    flexShrink:0, width:i===idx?130:110, height:i===idx?80:68,
                                    borderRadius:10, overflow:'hidden', cursor:'pointer',
                                    border:`2px solid ${i===idx ? accent : 'rgba(255,255,255,0.1)'}`,
                                    opacity: i===idx ? 1 : 0.48,
                                    transition:'all .25s ease',
                                    boxShadow: i===idx ? `0 4px 20px rgba(201,168,108,0.35)` : 'none',
                                }}>
                                <img src={img.fileUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                            </div>
                        ))}
                        {images.length > 8 && (
                            <div onClick={() => goTo(8)}
                                style={{flexShrink:0,width:110,height:68,borderRadius:10,
                                    background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',
                                    display:'flex',flexDirection:'column' as const,alignItems:'center',justifyContent:'center',
                                    gap:4,cursor:'pointer',color:'rgba(255,255,255,0.65)',fontSize:14,fontWeight:700,fontFamily:sans}}>
                                +{images.length-8}
                                <span style={{fontSize:10,fontFamily:mono,letterSpacing:'0.08em',color:'rgba(255,255,255,0.35)'}}>MORE</span>
                            </div>
                        )}
                        {tours.length > 0 && (
                            <div onClick={() => document.getElementById('sec-floorplans')?.scrollIntoView({behavior:'smooth'})}
                                style={{flexShrink:0,width:110,height:68,borderRadius:10,
                                    background:`rgba(201,168,108,0.08)`,border:`1px solid rgba(201,168,108,0.28)`,
                                    display:'flex',flexDirection:'column' as const,alignItems:'center',
                                    justifyContent:'center',gap:5,cursor:'pointer'}}>
                                <Play size={18} style={{color:accent}} fill={accent}/>
                                <span style={{fontFamily:mono,fontSize:9,letterSpacing:'0.12em',color:accent,fontWeight:700}}>TOUR</span>
                            </div>
                        )}
                    </div>

                    {/* Animated progress bar */}
                    <div style={{height:2,background:'rgba(255,255,255,0.1)',margin:'0 0 0',overflow:'hidden'}}>
                        <div key={`${idx}-${tick}`} style={{
                            height:'100%', background:accent, borderRadius:999,
                            animation: `progressW ${INTERVAL}ms linear forwards`,
                        }}/>
                    </div>
                </div>
            )}
        </section>
    );
};

// ── Component ─────────────────────────────────────────────────────────────────
const CustomerProjectDetail = () => {
    const {id} = useParams<{id: string}>();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const isStandalone = searchParams.get('standalone') === '1';

    // ── Lenis smooth scroll (dashboard mode only) ────────────────────────────
    // In standalone/new-tab mode the browser handles scrolling natively —
    // adding Lenis on top of window makes scrolling feel sluggish.
    useEffect(() => {
        if (isStandalone) {
            return () => { ScrollTrigger.getAll().forEach(t => t.kill()); };
        }
        const mainEl = document.querySelector('main.flex-1') as HTMLElement | null ?? document.documentElement;
        const lenis = new Lenis({
            wrapper: mainEl,
            content: mainEl.firstElementChild as HTMLElement,
            lerp: 0.1,
            wheelMultiplier: 0.7,
            smoothTouch: false,
        });
        let rafId: number;
        const raf = (time: number) => { lenis.raf(time); rafId = requestAnimationFrame(raf); };
        rafId = requestAnimationFrame(raf);
        return () => {
            cancelAnimationFrame(rafId);
            lenis.destroy();
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, [isStandalone]);

    const [project, setProject] = useState<ProjectDetail | null>(location.state?.project || null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [documents, setDocuments] = useState<ProjectDocument[]>([]);
    const [shortlisted, setShortlisted] = useState(false);
    const [activeConfig, setActiveConfig] = useState(0);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [activeAmenityCat, setActiveAmenityCat] = useState<string>('all');
    const [activeTower, setActiveTower] = useState(0);
    const [activeFacing, setActiveFacing] = useState('East');
    // Price calculator
    const [calcConfig,  setCalcConfig]  = useState(0);
    const [calcFloor,   setCalcFloor]   = useState(5);
    const [calcDownPct, setCalcDownPct] = useState(20);
    const [calcTenure,  setCalcTenure]  = useState(20);
    const [calcRate,    setCalcRate]    = useState(8.5);
    const [isFullscreen, setIsFullscreen] = useState(false);
    // City news (location section)
    const [newsItems, setNewsItems] = useState<NewsArticle[]>([]);
    const [newsLoading, setNewsLoading] = useState(false);
    // Enquiry form
    const [enquiryName,     setEnquiryName]     = useState('');
    const [enquiryPhone,    setEnquiryPhone]    = useState('');
    const [enquiryBhk,      setEnquiryBhk]      = useState('');
    const [enquiryBudget,   setEnquiryBudget]   = useState('');
    const [enquiryTimeline, setEnquiryTimeline] = useState('');
    const [enquiryMessage,  setEnquiryMessage]  = useState('');
    const [enquirySent,     setEnquirySent]     = useState(false);
    // Location advantages expand
    const [showAllAdvantages, setShowAllAdvantages] = useState(false);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);



    // Load project — handle preview mode (data from sessionStorage)
    useEffect(() => {
        if (!id) return;
        // Preview mode: id === 'preview', data in sessionStorage
        if (id === 'preview') {
            try {
                const raw = sessionStorage.getItem('dealio_project_preview');
                if (raw) {
                    const p = JSON.parse(raw) as ProjectDetail;
                    setProject(p);
                    if (p.imageUrl) {
                        setDocuments([{ id: 0, docType: 'image', fileName: 'preview', fileUrl: p.imageUrl, uploadedAt: '' }]);
                    }
                }
            } catch { /* ignore */ }
            setLoading(false);
            return;
        }
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
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!project) return;
        try {
            const sl = JSON.parse(localStorage.getItem('dealio_customer_shortlist') || '[]') as number[];
            setShortlisted(sl.includes(project.id));
        } catch { /* noop */ }
    }, [project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch city news for the location section panel
    useEffect(() => {
        const city = project?.city;
        if (!city) return;
        const ctrl = new AbortController();
        setNewsLoading(true);
        setNewsItems([]);
        fetchProjectNews(city, project?.locality, ctrl.signal)
            .then(items => { if (!ctrl.signal.aborted) setNewsItems(items); })
            .catch(() => {})
            .finally(() => { if (!ctrl.signal.aborted) setNewsLoading(false); });
        return () => ctrl.abort();
    }, [project?.city, project?.locality]); // eslint-disable-line react-hooks/exhaustive-deps





    const toggleShortlist = () => {
        if (!project) return;
        try {
            const sl = JSON.parse(localStorage.getItem('dealio_customer_shortlist') || '[]') as number[];
            const next = shortlisted ? sl.filter(x => x !== project.id) : [...sl, project.id];
            localStorage.setItem('dealio_customer_shortlist', JSON.stringify(next));
            setShortlisted(!shortlisted);
        } catch { /* noop */ }
    };

    const Wrapper = ({children}: {children: React.ReactNode}) => isStandalone
        ? <div style={{background:T.bg, minHeight:'100vh', fontFamily:T.sans}}>{children}</div>
        : <DashboardLayout>{children}</DashboardLayout>;

    if (loading && !project) return (
        <Wrapper>
            <div className="flex justify-center py-24">
                <Loader2 className="animate-spin" size={32} style={{color:T.aInk}}/>
            </div>
        </Wrapper>
    );

    if (notFound || !project) return (
        <Wrapper>
            <div className="text-center py-24 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{background:T.bg2}}>
                    <Building2 size={28} style={{color:T.muted}}/>
                </div>
                <h3 style={{fontFamily:T.serif,fontSize:28,fontWeight:300,letterSpacing:'-0.02em',color:T.ink,margin:'0 0 8px'}}>
                    Project not found.
                </h3>
                <p style={{color:T.muted,fontSize:14,marginBottom:28}}>This project may have been removed or is not yet published.</p>
                <button onClick={() => navigate('/customer')}
                    style={{background:T.aInk,color:'#fff',border:'none',padding:'12px 28px',borderRadius:12,cursor:'pointer',fontSize:14,fontWeight:600}}>
                    Back to Projects
                </button>
            </div>
        </Wrapper>
    );

    // ── Derived data ────────────────────────────────────────────────────────────
    const total    = project.totalUnits ?? 0;
    const sold     = Math.min(project.soldUnits ?? 0, total);
    const booked   = Math.min(project.bookedUnits ?? 0, Math.max(0, total - sold));
    const available = project.availableUnits != null
        ? Math.min(project.availableUnits, Math.max(0, total - sold - booked))
        : Math.max(0, total - sold - booked);

    const isImageUrl = (url: string) => /\.(jpe?g|png|webp|gif|bmp|svg)(\?|$)/i.test(url);
    const docImages = documents.filter(d => isImageUrl(d.fileUrl) || d.docType?.toLowerCase().includes('image') || d.docType?.toLowerCase().includes('photo'));
    const heroImg = project.imageUrl ? [{id:0,docType:'image',fileName:project.name,fileUrl:project.imageUrl,uploadedAt:''}] : [];
    const imagesDocs = [...heroImg, ...docImages.filter(d => d.fileUrl !== project.imageUrl)];
    const floorPlanDocs = documents.filter(d =>
        (d.docType?.toLowerCase().includes('floor') || d.docType?.toLowerCase().includes('layout')) && isImageUrl(d.fileUrl),
    );
    const towerPlanDocs = documents.filter(d =>
        d.docType?.toLowerCase().includes('tower') && d.docType?.toLowerCase().includes('plan') && isImageUrl(d.fileUrl),
    );
    const tours = parseTours(project.videoUrl);
    const matrix = total > 0 ? buildUnitMatrix(project) : [];

    const configs = project.configurations ?? [];
    const activeConfigName = configs[activeConfig] ?? '';
    const specs = getConfigSpecs(activeConfigName);

    // Resolve best floor plan doc for current config + facing
    const activeFloorPlanDoc: ProjectDocument | null =
        floorPlanDocs.find(d => activeConfigName && activeFacing && d.docType?.includes(activeConfigName) && d.docType?.includes(activeFacing))
        ?? floorPlanDocs.find(d => activeConfigName && d.docType?.includes(activeConfigName))
        ?? floorPlanDocs[activeConfig]
        ?? floorPlanDocs[0]
        ?? null;

    // Resolve best tower plan doc for current tower
    const activeTowerPlanDoc: ProjectDocument | null =
        towerPlanDocs.find(d => d.docType?.includes(String(activeTower + 1)))
        ?? towerPlanDocs[activeTower]
        ?? towerPlanDocs[0]
        ?? null;

    // Detect which facings have actual floor plan docs for the active BHK
    const availableFacings = ['East', 'West', 'North', 'South'].filter(f =>
        floorPlanDocs.some(d => (!activeConfigName || d.docType?.includes(activeConfigName)) && d.docType?.includes(f))
    );

    const faq = buildFaq(project);
    const statusLbl = STATUS_LABELS[project.status] || project.status;
    const emiMonthly = project.priceMin ? Math.round(project.priceMin * 0.00873) : null;

    // Amenity categories
    const amenityCats = project.amenities ? categorizeAmenities(project.amenities) : {};
    const amenityCatKeys = Object.keys(amenityCats);
    const displayedAmenities = activeAmenityCat === 'all'
        ? (project.amenities ?? [])
        : (amenityCats[activeAmenityCat] ?? []);


    // Quick stats
    const quickStats = [
        project.towers      && {icon:<Building2 size={20}/>, label:'Towers',      value:String(project.towers),                         sub:project.floorsPerTower?`G+${project.floorsPerTower} floors`:undefined},
        total > 0           && {icon:<LayoutGrid size={20}/>, label:'Total Homes', value:total.toLocaleString('en-IN'),                  sub:available>0?`${available} available`:undefined},
        project.landArea    && {icon:<Layers size={20}/>,     label:'Land Area',   value:project.landArea,                               sub:undefined},
        configs.length > 0  && {icon:<Home size={20}/>,       label:'Types',       value:configs.join(' · '),                            sub:`${configs.length} configuration${configs.length>1?'s':''}`},
        project.pricePerSqftMin && {icon:<Star size={20}/>,   label:'Price/sqft',  value:`₹${project.pricePerSqftMin.toLocaleString('en-IN')}`, sub:'onwards'},
        project.possessionDate  && {icon:<Calendar size={20}/>,label:'Possession', value:new Date(project.possessionDate).toLocaleDateString('en-IN',{month:'short',year:'numeric'}), sub:statusLbl},
    ].filter(Boolean) as {icon:JSX.Element;label:string;value:string;sub?:string}[];

    const sk = {fontFamily:T.sans, fontSize:'10px', letterSpacing:'0.18em', color:T.muted, textTransform:'uppercase' as const, fontWeight:700};

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <Wrapper>
            {/* Floating fullscreen button — only in standalone/new-tab mode */}
            {isStandalone && (
                <button
                    onClick={() => isFullscreen ? document.exitFullscreen?.() : document.documentElement.requestFullscreen?.()}
                    title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    style={{position:'fixed',bottom:28,right:28,zIndex:9999,display:'flex',alignItems:'center',gap:8,background:T.ink,color:'#fff',border:`1px solid rgba(201,168,108,0.3)`,padding:'11px 20px',borderRadius:999,cursor:'pointer',fontFamily:T.sans,fontSize:13,fontWeight:600,boxShadow:'0 8px 32px rgba(0,0,0,0.32)',backdropFilter:'blur(8px)',transition:'all .2s'}}>
                    {isFullscreen
                        ? <><Minimize2 size={14} style={{color:T.accent}}/> Exit Fullscreen</>
                        : <><Maximize2 size={14} style={{color:T.accent}}/> Enter Fullscreen</>
                    }
                </button>
            )}
            <div style={{overflow:'hidden', margin: isStandalone ? 0 : '-24px -24px 0'}}>
            <div style={{background:T.bg, minHeight:'100vh', fontFamily:T.sans, zoom:1}}>

                {/* ══ HERO ════════════════════════════════════════════════════════ */}
                <HeroCarousel
                    images={imagesDocs}
                    projectName={project.name}
                    builderName={project.builderName}
                    reraNumber={project.reraNumber}
                    featured={project.featured}
                    closingSoon={project.closingSoon}
                    locality={project.locality}
                    city={project.city}
                    priceMin={project.priceMin}
                    priceMax={project.priceMax}
                    statusLbl={statusLbl}
                    configs={configs}
                    tours={tours}
                    shortlisted={shortlisted}
                    isStandalone={isStandalone}
                    onBack={() => navigate('/customer')}
                    onToggleShortlist={toggleShortlist}
                    onShare={() => navigator.share?.({title:project.name, url:window.location.href}).catch(()=>{})}
                    onOpenFullscreen={() => window.open(`${window.location.pathname}?standalone=1`, '_blank')}
                    fmtPrice={fmtPrice}
                    accent={T.accent}
                    ink={T.ink}
                    sans={T.sans}
                    serif={T.serif}
                    mono={T.mono}
                />

                {/* content below the hero */}
                <div>



                {/* ══ PROJECT SPEC STRIP (isometric icon + value layout) ═════════ */}
                {(() => {
                    const IC = '#1a2e42'; // dark navy stroke colour
                    const specs = [
                        total > 0 && {
                            icon: <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                                {/* isometric apartment block */}
                                <path d="M28 8L46 18V38L28 48L10 38V18L28 8Z" stroke={IC} strokeWidth="1.3" fill="none"/>
                                <path d="M28 8V48" stroke={IC} strokeWidth="0.8" strokeDasharray="3 2.5"/>
                                <path d="M10 18L46 18" stroke={IC} strokeWidth="0.8" strokeDasharray="3 2.5"/>
                                <path d="M10 28L46 28" stroke={IC} strokeWidth="0.8" strokeDasharray="3 2.5"/>
                                <path d="M10 38L46 38" stroke={IC} strokeWidth="0.8" strokeDasharray="3 2.5"/>
                            </svg>,
                            value: total.toLocaleString('en-IN'), label: 'Flats'
                        },
                        project.towers && {
                            icon: <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                                {/* isometric towers */}
                                <rect x="16" y="14" width="10" height="30" rx="1" stroke={IC} strokeWidth="1.3" fill="none"/>
                                <rect x="29" y="20" width="10" height="24" rx="1" stroke={IC} strokeWidth="1.3" fill="none"/>
                                <line x1="18" y1="19" x2="24" y2="19" stroke={IC} strokeWidth="0.9"/>
                                <line x1="18" y1="24" x2="24" y2="24" stroke={IC} strokeWidth="0.9"/>
                                <line x1="18" y1="29" x2="24" y2="29" stroke={IC} strokeWidth="0.9"/>
                                <line x1="31" y1="25" x2="37" y2="25" stroke={IC} strokeWidth="0.9"/>
                                <line x1="31" y1="30" x2="37" y2="30" stroke={IC} strokeWidth="0.9"/>
                                <line x1="10" y1="44" x2="46" y2="44" stroke={IC} strokeWidth="1.3"/>
                            </svg>,
                            value: String(project.towers), label: 'Towers'
                        },
                        configs.length > 0 && {
                            icon: <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                                {/* stacked floor layers (isometric) */}
                                <path d="M28 10L44 19L28 28L12 19L28 10Z" stroke={IC} strokeWidth="1.3" fill="none"/>
                                <path d="M12 26L28 35L44 26" stroke={IC} strokeWidth="1.3" fill="none"/>
                                <path d="M12 19V26M28 28V35M44 19V26" stroke={IC} strokeWidth="1.3"/>
                                <path d="M12 33L28 42L44 33" stroke={IC} strokeWidth="1" strokeOpacity="0.45"/>
                                <path d="M12 26V33M28 35V42M44 26V33" stroke={IC} strokeWidth="1" strokeOpacity="0.45"/>
                            </svg>,
                            value: configs.join(' & '), label: 'Homes'
                        },
                        project.landArea && {
                            icon: <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                                {/* land plot isometric */}
                                <path d="M10 38L28 28L46 38L28 48L10 38Z" stroke={IC} strokeWidth="1.3" fill="none"/>
                                <path d="M28 28V18" stroke={IC} strokeWidth="1.3"/>
                                <path d="M10 38V28L28 18L46 28V38" stroke={IC} strokeWidth="1" strokeDasharray="3 2.5" strokeOpacity="0.5"/>
                                <circle cx="28" cy="18" r="2.5" fill={IC} fillOpacity="0.2" stroke={IC} strokeWidth="1"/>
                            </svg>,
                            value: project.landArea, label: 'Total Area'
                        },
                        (project.pricePerSqftMin && project.pricePerSqftMax) ? {
                            icon: <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                                {/* apartment block with dimensions */}
                                <rect x="14" y="14" width="28" height="30" rx="1.5" stroke={IC} strokeWidth="1.3" fill="none"/>
                                <line x1="14" y1="22" x2="42" y2="22" stroke={IC} strokeWidth="0.9"/>
                                <line x1="14" y1="30" x2="42" y2="30" stroke={IC} strokeWidth="0.9"/>
                                <line x1="14" y1="38" x2="42" y2="38" stroke={IC} strokeWidth="0.9"/>
                                <line x1="28" y1="14" x2="28" y2="44" stroke={IC} strokeWidth="0.9"/>
                                <line x1="7" y1="14" x2="7" y2="44" stroke={IC} strokeWidth="1" strokeOpacity="0.5"/>
                                <path d="M7 14L10 17M7 44L10 41" stroke={IC} strokeWidth="1" strokeOpacity="0.5"/>
                            </svg>,
                            value: `${(project.pricePerSqftMin/1).toLocaleString('en-IN')}–${(project.pricePerSqftMax/1).toLocaleString('en-IN')} Sqft`,
                            label: 'Range'
                        } : (project.priceMin && project.priceMax && project.priceMin !== project.priceMax) ? {
                            icon: <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                                <rect x="14" y="14" width="28" height="30" rx="1.5" stroke={IC} strokeWidth="1.3" fill="none"/>
                                <line x1="14" y1="22" x2="42" y2="22" stroke={IC} strokeWidth="0.9"/>
                                <line x1="14" y1="30" x2="42" y2="30" stroke={IC} strokeWidth="0.9"/>
                                <line x1="28" y1="14" x2="28" y2="44" stroke={IC} strokeWidth="0.9"/>
                            </svg>,
                            value: configs.length > 1 ? `${configs[0]}–${configs[configs.length-1]}` : configs[0] || '—',
                            label: 'Range'
                        } : null,
                        project.floorsPerTower && {
                            icon: <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                                {[10,18,26,34].map((y,i) => (
                                    <g key={i}><rect x="14" y={y} width="28" height="6" rx="1" stroke={IC} strokeWidth="1.2" fill="none" fillOpacity="0"/></g>
                                ))}
                                <path d="M28 8L28 10M28 46L28 48" stroke={IC} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.5"/>
                            </svg>,
                            value: `G+${project.floorsPerTower}`, label: 'Floors'
                        },
                        project.possessionDate && {
                            icon: <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                                <rect x="10" y="14" width="36" height="30" rx="3" stroke={IC} strokeWidth="1.3" fill="none"/>
                                <line x1="10" y1="22" x2="46" y2="22" stroke={IC} strokeWidth="1"/>
                                <line x1="20" y1="8" x2="20" y2="18" stroke={IC} strokeWidth="1.3" strokeLinecap="round"/>
                                <line x1="36" y1="8" x2="36" y2="18" stroke={IC} strokeWidth="1.3" strokeLinecap="round"/>
                                <rect x="18" y="27" width="8" height="7" rx="1" stroke={IC} strokeWidth="1" fill="none" fillOpacity="0.2"/>
                                <rect x="30" y="27" width="8" height="7" rx="1" stroke={IC} strokeWidth="1" fill="none" fillOpacity="0.2"/>
                            </svg>,
                            value: new Date(project.possessionDate).toLocaleDateString('en-IN',{month:'short',year:'numeric'}),
                            label: 'Possession'
                        },
                    ].filter(Boolean) as {icon:JSX.Element;value:string;label:string}[];

                    if (specs.length < 2) return null;

                    const rows: typeof specs[] = [];
                    for (let i = 0; i < specs.length; i += 3) rows.push(specs.slice(i, i + 3));

                    return (
                        <section style={{background:'#fff',borderTop:`1px solid ${T.line}`,borderBottom:`1px solid ${T.line}`,padding:'48px 0'}}>
                            <div style={{maxWidth:1280,margin:'0 auto',padding:'0 48px'}}>
                                {rows.map((row, ri) => (
                                    <div key={ri} style={{
                                        display:'grid',
                                        gridTemplateColumns:`repeat(${row.length},1fr)`,
                                        borderTop: ri > 0 ? `1px dashed ${T.line}` : 'none',
                                    }}>
                                        {row.map((s, ci) => (
                                            <div key={ci} style={{
                                                display:'flex',
                                                alignItems:'center',
                                                gap:20,
                                                padding:'24px 40px',
                                                borderLeft: ci > 0 ? `1px dashed ${T.line}` : 'none',
                                            }}>
                                                <div style={{flexShrink:0,opacity:0.82}}>{s.icon}</div>
                                                <div>
                                                    <div style={{fontFamily:T.sans,fontSize:20,fontWeight:700,color:T.ink,lineHeight:1.1,marginBottom:5,letterSpacing:'-0.01em'}}>
                                                        {s.value}
                                                    </div>
                                                    <div style={{fontFamily:T.sans,fontSize:13,color:T.muted,fontWeight:500}}>
                                                        {s.label}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </section>
                    );
                })()}

                {/* ══ 01 · OVERVIEW ══════════════════════════════════════════════ */}
                <section id="sec-overview" style={{margin:'0',position:'relative' as const,overflow:'hidden',minHeight:680}}>
                <AnimateIn>
                    {/* Background image — use second gallery image if available, else first */}
                    {imagesDocs.length > 0 && (
                        <>
                            <div style={{position:'absolute' as const,inset:0}}>
                                <img
                                    src={imagesDocs[0].fileUrl}
                                    alt=""
                                    style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center 30%',display:'block'}}
                                />
                            </div>
                            {/* Left-to-right gradient: dark left (text), lighter right */}
                            <div style={{position:'absolute' as const,inset:0,background:'linear-gradient(to right, rgba(11,25,41,0.92) 0%, rgba(11,25,41,0.78) 40%, rgba(11,25,41,0.35) 70%, rgba(11,25,41,0.10) 100%)'}}/>
                        </>
                    )}
                    {/* No image fallback */}
                    {imagesDocs.length === 0 && (
                        <div style={{position:'absolute' as const,inset:0,background:`linear-gradient(135deg, ${T.ink} 0%, #122840 100%)`}}/>
                    )}

                    {/* Content layer */}
                    <div style={{position:'relative' as const,zIndex:2,maxWidth:1280,margin:'0 auto',padding:'88px 48px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:48,alignItems:'center',minHeight:680}}>

                        {/* Left — text */}
                        <div>
                            <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:28}}>
                                <span style={{fontFamily:T.mono,fontSize:10,letterSpacing:'0.22em',color:'rgba(201,168,108,0.7)',fontWeight:700}}>01</span>
                                <div style={{height:1,background:'rgba(201,168,108,0.35)',width:48}}/>
                                <span style={{fontFamily:T.mono,fontSize:10,letterSpacing:'0.14em',color:'rgba(255,255,255,0.35)',fontWeight:700,textTransform:'uppercase' as const}}>Overview</span>
                            </div>
                            <h2 style={{fontFamily:T.serif,fontSize:'clamp(28px,3.5vw,48px)',fontWeight:300,lineHeight:1.08,letterSpacing:'-0.025em',color:'#fff',margin:'0 0 20px'}}>
                                {project.description
                                    ? <>{project.description.slice(0,80)}{project.description.length>80?'…':''}</>
                                    : <>A landmark in <em style={{fontStyle:'italic',color:T.accent}}>{project.city||'the city'}</em>.</>
                                }
                            </h2>
                            {project.description && (
                                <p style={{fontFamily:T.sans,fontSize:14,color:'rgba(255,255,255,0.55)',lineHeight:1.8,margin:'0 0 36px',maxWidth:460}}>
                                    {project.description.length > 80 ? project.description.slice(80,340) : project.description}
                                    {project.description.length > 340 ? '…' : ''}
                                </p>
                            )}
                            <button onClick={() => navigate('/customer/meeting',{state:{projectId:project.id,builderId:project.builderId,projectName:project.name,city:project.city}})}
                                style={{display:'inline-flex',alignItems:'center',gap:10,padding:'13px 28px',borderRadius:999,background:T.accent,color:T.ink,border:'none',cursor:'pointer',fontFamily:T.sans,fontWeight:800,fontSize:13}}>
                                Book a Site Visit
                            </button>
                        </div>

                        {/* Right — key stats grid */}
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                            {[
                                total>0       && {label:'Total Homes', value:total.toLocaleString('en-IN'), sub:`${available} available`},
                                project.towers && {label:'Towers', value:String(project.towers), sub:project.floorsPerTower?`G+${project.floorsPerTower} floors`:undefined},
                                available>0   && {label:'Available', value:String(available), sub:'ready to book'},
                                sold>0        && {label:'Sold', value:String(sold), sub:'units closed'},
                                booked>0      && {label:'Booked', value:String(booked), sub:'under process'},
                                project.possessionDate && {label:'Possession', value:new Date(project.possessionDate).toLocaleDateString('en-IN',{month:'short',year:'numeric'}), sub:statusLbl},
                            ].filter(Boolean).slice(0,6).map((h:any,i) => (
                                <div key={i} style={{padding:'20px 22px',background:'rgba(255,255,255,0.07)',borderRadius:16,border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(8px)'}}>
                                    <div style={{fontFamily:T.mono,fontSize:9,letterSpacing:'0.14em',textTransform:'uppercase' as const,color:'rgba(255,255,255,0.38)',fontWeight:700,marginBottom:6}}>{h.label}</div>
                                    <div style={{fontFamily:T.serif,fontSize:32,fontWeight:300,letterSpacing:'-0.02em',color:'#fff',lineHeight:1,marginBottom:4}}>
                                        <em style={{fontStyle:'italic',color:T.accent}}>{h.value}</em>
                                    </div>
                                    {h.sub && <div style={{fontFamily:T.sans,fontSize:11.5,color:'rgba(255,255,255,0.45)',fontWeight:500}}>{h.sub}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </AnimateIn>
                </section>

                {/* ══ CONSTRUCTION SPECIFICATIONS ════════════════════════════════ */}
                {project.specifications && Object.values(project.specifications).some(Boolean) && (
                <section style={{maxWidth:1280,margin:'160px auto 0',padding:'0 40px'}}>
                <AnimateIn>
                    <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:32}}>
                        <div style={{height:1,background:`linear-gradient(to right, ${T.accent}, transparent)`,width:64}}/>
                        <span style={sk}>Construction Specifications</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:T.line,borderRadius:16,overflow:'hidden',border:`1px solid ${T.line}`}}>
                        {Object.entries(project.specifications).filter(([,v]) => v).map(([key,val]) => (
                            <div key={key} style={{padding:'20px 24px',background:'#fff'}}>
                                <div style={{fontFamily:T.mono,fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase' as const,color:T.muted,fontWeight:700,marginBottom:6}}>{key}</div>
                                <div style={{fontFamily:T.sans,fontSize:13,fontWeight:600,color:T.ink,lineHeight:1.4}}>{val as string}</div>
                            </div>
                        ))}
                        {project.clubhouseAreaSqft && (
                            <div style={{padding:'20px 24px',background:'#fff'}}>
                                <div style={{fontFamily:T.mono,fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase' as const,color:T.muted,fontWeight:700,marginBottom:6}}>Clubhouse Area</div>
                                <div style={{fontFamily:T.sans,fontSize:13,fontWeight:600,color:T.ink}}>{project.clubhouseAreaSqft.toLocaleString('en-IN')} sqft</div>
                            </div>
                        )}
                        {/* Fill trailing cells so the last row doesn't expose the brown grid background */}
                        {(() => {
                            const total = Object.entries(project.specifications).filter(([,v]) => v).length + (project.clubhouseAreaSqft ? 1 : 0);
                            const rem = total % 3;
                            if (rem === 0) return null;
                            return Array.from({ length: 3 - rem }).map((_, i) => (
                                <div key={`fill${i}`} style={{padding:'20px 24px',background:'#fff'}} />
                            ));
                        })()}
                    </div>
                </AnimateIn>
                </section>
                )}

                {/* ── Full-width gallery above pricing ───────────────────────── */}
                {imagesDocs.length >= 2 && (
                    <div style={{margin:'0',display:'flex',flexDirection:'column' as const,gap:0,lineHeight:0,fontSize:0,paddingTop:200,background:'#ffffff'}}>
                        {[
                            imagesDocs[Math.min(2, imagesDocs.length - 1)],
                            imagesDocs[Math.min(3, imagesDocs.length - 1)],
                        ].filter((img, i, arr) => img && arr.indexOf(img) === i).map((img, i, arr) => (
                            <div key={i} style={{width:'100%',overflow:'hidden',aspectRatio:'21/8',position:'relative' as const,background:T.ink,display:'block'}}>
                                <img src={img.fileUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center',display:'block',transition:'transform .7s ease',opacity:0.88}}
                                    onMouseEnter={e => { e.currentTarget.style.transform='scale(1.02)'; e.currentTarget.style.opacity='1'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.opacity='0.88'; }}/>
                                <div style={{position:'absolute' as const,inset:0,background:'linear-gradient(to bottom, rgba(11,25,41,0.28) 0%, transparent 35%, transparent 65%, rgba(11,25,41,0.38) 100%)',pointerEvents:'none'}}/>
                                <div style={{position:'absolute' as const,inset:0,background:'linear-gradient(to right, rgba(11,25,41,0.18) 0%, transparent 40%)',pointerEvents:'none'}}/>
                                {/* Gold accent divider between images */}
                                {i < arr.length - 1 && (
                                    <div style={{position:'absolute' as const,bottom:0,left:0,right:0,height:3,background:`linear-gradient(to right, transparent 0%, ${T.accent} 30%, ${T.accent} 70%, transparent 100%)`,opacity:0.6}}/>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ══ 02 · PRICING ═══════════════════════════════════════════════ */}
                {(configs.length > 0 || project.priceMin) && (
                    <section id="sec-pricing" style={{maxWidth:1280,margin:'96px auto 0',padding:'0 40px'}}>
                    <AnimateIn>
                        <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:40}}>
                            <span style={{fontFamily:T.mono,fontSize:10,letterSpacing:'0.22em',color:T.accent,fontWeight:700}}>02</span>
                            <div style={{height:1,background:`linear-gradient(to right, ${T.accent}, transparent)`,width:64}}/>
                            <span style={sk}>Pricing</span>
                        </div>
                        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:24,marginBottom:32}}>
                            <h2 style={{fontFamily:T.serif,fontSize:'clamp(28px,3.5vw,46px)',fontWeight:300,lineHeight:1,letterSpacing:'-0.025em',color:T.ink,margin:0}}>
                                {configs.length > 0
                                    ? <>{configs.length} configuration{configs.length>1?'s':''},<br/><em style={{fontStyle:'italic',color:T.aInk}}>each priced for value.</em></>
                                    : <><em style={{fontStyle:'italic',color:T.aInk}}>Pricing</em> at a glance.</>
                                }
                            </h2>
                            <p style={{fontFamily:T.sans,color:T.muted,fontSize:13,maxWidth:320,textAlign:'right' as const,lineHeight:1.7,margin:0}}>
                                Pricing is indicative. Final pricing subject to floor, facing, and booking date.
                            </p>
                        </div>

                        {configs.length > 0 ? (
                        <div style={{background:'#fff',border:`1px solid ${T.line}`,borderRadius:20,overflow:'hidden'}}>
                            {/* Table header */}
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1.2fr 1fr 1fr 1fr auto',padding:'14px 28px',background:T.ink,gap:16}}>
                                {['Type','Super Built-up','Carpet Area','Starting Price','Price / sqft',''].map((h,i) => (
                                    <div key={i} style={{fontFamily:T.mono,fontSize:10,letterSpacing:'0.14em',color:'rgba(255,255,255,0.4)',fontWeight:600,textTransform:'uppercase' as const,textAlign:i===5?'center' as const:'left' as const}}>
                                        {h}
                                    </div>
                                ))}
                            </div>
                            {/* Config rows */}
                            {configs.map((cfg, i) => {
                                const s = getConfigSpecs(cfg);
                                const priceFactor = configs.length > 1 ? 0.75 + (i / (configs.length - 1)) * 0.5 : 1;
                                const rowPrice = project.priceMin ? Math.round(project.priceMin * priceFactor) : null;
                                const sqftNum = project.pricePerSqftMin ? project.pricePerSqftMin + i * 50 : null;
                                return (
                                    <div key={cfg} style={{display:'grid',gridTemplateColumns:'1fr 1.2fr 1fr 1fr 1fr auto',padding:'20px 28px',gap:16,borderTop:i>0?`1px solid ${T.line}`:'none',alignItems:'center',background:activeConfig===i?T.aTint:'#fff',transition:'background .15s',cursor:'pointer'}}
                                        onClick={() => setActiveConfig(i)}>
                                        <div>
                                            <div style={{fontFamily:T.serif,fontSize:20,fontWeight:300,color:T.ink,letterSpacing:'-0.01em'}}>{cfg}</div>
                                            <div style={{fontFamily:T.sans,fontSize:11,color:T.muted,marginTop:2,fontWeight:500}}>{project.towers?`${project.towers} towers`:'Multiple towers'}</div>
                                        </div>
                                        <div style={{fontFamily:T.mono,fontSize:13,color:T.ink2}}>{s.superBuiltUp} <span style={{fontSize:10,color:T.muted}}>sqft</span></div>
                                        <div style={{fontFamily:T.mono,fontSize:13,color:T.ink2}}>{s.carpet} <span style={{fontSize:10,color:T.muted}}>sqft</span></div>
                                        <div style={{fontFamily:T.serif,fontSize:20,fontWeight:300,color:rowPrice?T.ink:T.muted,letterSpacing:'-0.01em'}}>
                                            {rowPrice ? fmtPrice(rowPrice) : '—'}
                                        </div>
                                        <div style={{fontFamily:T.sans,fontSize:13,fontWeight:600,color:T.ink2}}>
                                            {sqftNum ? `₹${sqftNum.toLocaleString('en-IN')}` : '—'}
                                        </div>
                                        <button onClick={(e) => {e.stopPropagation(); navigate('/customer/meeting',{state:{projectId:project.id,builderId:project.builderId,projectName:project.name,city:project.city}});}}
                                            style={{background:T.accent,color:T.ink,border:'none',padding:'9px 20px',borderRadius:8,cursor:'pointer',fontFamily:T.sans,fontWeight:800,fontSize:12,whiteSpace:'nowrap' as const}}>
                                            Enquire
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        ) : (
                        /* No config data — show price card fallback */
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
                            {[
                                {label:'Starting Price', value:fmtPrice(project.priceMin), sub:'onwards'},
                                {label:'Up To',          value:fmtPrice(project.priceMax), sub:'all-inclusive'},
                                {label:'Price / sqft',   value:project.pricePerSqftMin?`₹${project.pricePerSqftMin.toLocaleString('en-IN')}`:'On Request', sub:'base rate'},
                            ].map(card => (
                                <div key={card.label} style={{padding:'28px 28px',background:'#fff',border:`1px solid ${T.line}`,borderRadius:18}}>
                                    <div style={{fontFamily:T.sans,fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase' as const,color:T.muted,fontWeight:700,marginBottom:8}}>{card.label}</div>
                                    <div style={{fontFamily:T.serif,fontSize:32,fontWeight:300,color:T.ink,letterSpacing:'-0.02em',lineHeight:1}}>{card.value}</div>
                                    <div style={{fontFamily:T.sans,fontSize:12,color:T.muted,marginTop:6,fontWeight:500}}>{card.sub}</div>
                                </div>
                            ))}
                        </div>
                        )}

                        {/* Payment plans note */}
                        <div style={{marginTop:16,display:'flex',gap:16,flexWrap:'wrap' as const}}>
                            {['20:80 Plan','Construction Linked','Pre-EMI Plan','Bank Tie-ups Available'].map(plan => (
                                <span key={plan} style={{fontFamily:T.sans,fontSize:12,padding:'6px 14px',borderRadius:999,background:T.bg2,color:T.ink2,border:`1px solid ${T.line}`,fontWeight:600}}>
                                    {plan}
                                </span>
                            ))}
                        </div>
                    </AnimateIn>
                    </section>
                )}

                {/* ══ PRICE CALCULATOR ══════════════════════════════════════════ */}
                {(project.priceMin || configs.length > 0) && (
                <section style={{maxWidth:1280,margin:'48px auto 0',padding:'0 40px'}}>
                <AnimateIn>
                    <div style={{background:T.ink,borderRadius:24,overflow:'hidden'}}>
                        {/* Header bar */}
                        <div style={{padding:'28px 40px',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:24}}>
                            <div>
                                <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:'0.18em',color:'rgba(201,168,108,0.6)',fontWeight:700,textTransform:'uppercase' as const,marginBottom:6}}>Price Calculator</div>
                                <h3 style={{fontFamily:T.serif,fontSize:'clamp(20px,2vw,28px)',fontWeight:300,color:'#fff',margin:0,letterSpacing:'-0.01em'}}>
                                    Estimate your <em style={{fontStyle:'italic',color:T.accent}}>investment</em>
                                </h3>
                            </div>
                            <div style={{fontFamily:T.sans,fontSize:12,color:'rgba(255,255,255,0.35)',maxWidth:260,textAlign:'right' as const,lineHeight:1.6}}>
                                Adjust configuration, floor & financing to see a personalised estimate.
                            </div>
                        </div>

                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0}}>
                            {/* Left — inputs */}
                            <div style={{padding:'36px 40px',borderRight:'1px solid rgba(255,255,255,0.07)',display:'flex',flexDirection:'column' as const,gap:28}}>

                                {/* BHK config selector */}
                                {configs.length > 0 && (
                                    <div>
                                        <label style={{fontFamily:T.mono,fontSize:9,letterSpacing:'0.16em',color:'rgba(255,255,255,0.35)',textTransform:'uppercase' as const,display:'block',marginBottom:12}}>Configuration</label>
                                        <div style={{display:'flex',gap:8,flexWrap:'wrap' as const}}>
                                            {configs.map((c,i) => (
                                                <button key={c} type="button" onClick={() => setCalcConfig(i)}
                                                    style={{padding:'8px 18px',borderRadius:999,border:`1px solid ${calcConfig===i?T.accent:'rgba(255,255,255,0.15)'}`,background:calcConfig===i?T.accent:'transparent',color:calcConfig===i?T.ink:'rgba(255,255,255,0.65)',cursor:'pointer',fontFamily:T.sans,fontSize:13,fontWeight:600,transition:'all .15s'}}>
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Floor */}
                                <div>
                                    <label style={{fontFamily:T.mono,fontSize:9,letterSpacing:'0.16em',color:'rgba(255,255,255,0.35)',textTransform:'uppercase' as const,display:'block',marginBottom:12}}>
                                        Floor — <span style={{color:'rgba(255,255,255,0.65)',fontFamily:T.sans,fontSize:13,letterSpacing:0,textTransform:'none' as const}}>{calcFloor}{calcFloor===1?'st':calcFloor===2?'nd':calcFloor===3?'rd':'th'} floor</span>
                                    </label>
                                    <input type="range" min={1} max={project.floorsPerTower||20} value={calcFloor} onChange={e => setCalcFloor(Number(e.target.value))}
                                        style={{width:'100%',accentColor:T.accent,cursor:'pointer'}}/>
                                    <div style={{display:'flex',justifyContent:'space-between',fontFamily:T.mono,fontSize:10,color:'rgba(255,255,255,0.25)',marginTop:4}}>
                                        <span>Ground</span><span>Floor {project.floorsPerTower||20}</span>
                                    </div>
                                </div>

                                {/* Down payment */}
                                <div>
                                    <label style={{fontFamily:T.mono,fontSize:9,letterSpacing:'0.16em',color:'rgba(255,255,255,0.35)',textTransform:'uppercase' as const,display:'block',marginBottom:12}}>
                                        Down Payment — <span style={{color:'rgba(255,255,255,0.65)',fontFamily:T.sans,fontSize:13,letterSpacing:0,textTransform:'none' as const}}>{calcDownPct}%</span>
                                    </label>
                                    <input type="range" min={10} max={50} step={5} value={calcDownPct} onChange={e => setCalcDownPct(Number(e.target.value))}
                                        style={{width:'100%',accentColor:T.accent,cursor:'pointer'}}/>
                                    <div style={{display:'flex',justifyContent:'space-between',fontFamily:T.mono,fontSize:10,color:'rgba(255,255,255,0.25)',marginTop:4}}>
                                        <span>10%</span><span>50%</span>
                                    </div>
                                </div>

                                {/* Tenure & rate */}
                                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                                    <div>
                                        <label style={{fontFamily:T.mono,fontSize:9,letterSpacing:'0.16em',color:'rgba(255,255,255,0.35)',textTransform:'uppercase' as const,display:'block',marginBottom:8}}>Loan Tenure (yrs)</label>
                                        <div style={{display:'flex',gap:6,flexWrap:'wrap' as const}}>
                                            {[10,15,20,25,30].map(y => (
                                                <button key={y} type="button" onClick={() => setCalcTenure(y)}
                                                    style={{padding:'5px 12px',borderRadius:8,border:`1px solid ${calcTenure===y?T.accent:'rgba(255,255,255,0.12)'}`,background:calcTenure===y?T.accent:'transparent',color:calcTenure===y?T.ink:'rgba(255,255,255,0.55)',cursor:'pointer',fontFamily:T.mono,fontSize:11,fontWeight:600,transition:'all .15s'}}>
                                                    {y}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{fontFamily:T.mono,fontSize:9,letterSpacing:'0.16em',color:'rgba(255,255,255,0.35)',textTransform:'uppercase' as const,display:'block',marginBottom:8}}>Interest Rate (%)</label>
                                        <div style={{display:'flex',gap:6,flexWrap:'wrap' as const}}>
                                            {[7.5,8.0,8.5,9.0,9.5].map(r => (
                                                <button key={r} type="button" onClick={() => setCalcRate(r)}
                                                    style={{padding:'5px 10px',borderRadius:8,border:`1px solid ${calcRate===r?T.accent:'rgba(255,255,255,0.12)'}`,background:calcRate===r?T.accent:'transparent',color:calcRate===r?T.ink:'rgba(255,255,255,0.55)',cursor:'pointer',fontFamily:T.mono,fontSize:11,fontWeight:600,transition:'all .15s'}}>
                                                    {r}%
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right — results */}
                            {(() => {
                                const cfgName = configs[calcConfig] ?? '';
                                const calcSpecs = getConfigSpecs(cfgName);
                                // Base price: priceMin scaled per config tier
                                const priceTierFactor = configs.length > 1
                                    ? 0.85 + (calcConfig / Math.max(configs.length - 1, 1)) * 0.3
                                    : 1;
                                const basePrice = Math.round((project.priceMin ?? 0) * priceTierFactor);
                                // Floor rise — stored as total rupees per floor (not per sqft)
                                // Fallback: 0.3% of base price per floor
                                const floorRisePerFloor = project.floorRiseCharges && project.floorRiseCharges > 100
                                    ? project.floorRiseCharges
                                    : basePrice > 0 ? Math.round(basePrice * 0.003) : 0;
                                const floorRise = Math.round(floorRisePerFloor * Math.max(0, calcFloor - 1));
                                const totalCost   = basePrice + floorRise;
                                const downPayment = Math.round(totalCost * calcDownPct / 100);
                                const loanAmount  = totalCost - downPayment;
                                // Monthly maintenance (shown separately, not in loan)
                                const maintenanceMonthly = project.maintenanceCharges && project.maintenanceCharges > 0
                                    ? Math.round(project.maintenanceCharges)
                                    : 0;
                                // EMI: P × r(1+r)^n / ((1+r)^n − 1)
                                const monthlyRate = calcRate / 100 / 12;
                                const months      = calcTenure * 12;
                                const emi = loanAmount > 0 && monthlyRate > 0
                                    ? Math.round(loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1))
                                    : 0;
                                const totalInterest = Math.max(0, emi * months - loanAmount);

                                const fmt = (n: number) => {
                                    if (n >= 10_000_000) return `₹${(n/10_000_000).toFixed(2)} Cr`;
                                    if (n >= 100_000)    return `₹${(n/100_000).toFixed(1)} L`;
                                    return `₹${n.toLocaleString('en-IN')}`;
                                };

                                return (
                                    <div style={{padding:'36px 40px',display:'flex',flexDirection:'column' as const,gap:16}}>

                                        {basePrice === 0 && (
                                            <div style={{padding:'24px 28px',background:'rgba(255,255,255,0.04)',borderRadius:16,border:'1px solid rgba(255,255,255,0.08)',textAlign:'center' as const}}>
                                                <div style={{fontFamily:T.sans,fontSize:13,color:'rgba(255,255,255,0.3)'}}>Add project pricing to use the calculator</div>
                                            </div>
                                        )}

                                        {/* Two live hero cards — both change with down payment */}
                                        {basePrice > 0 && (
                                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                                            <div style={{padding:'20px 22px',background:'rgba(201,168,108,0.1)',borderRadius:14,border:'1px solid rgba(201,168,108,0.2)'}}>
                                                <div style={{fontFamily:T.mono,fontSize:8.5,letterSpacing:'0.14em',color:'rgba(201,168,108,0.6)',textTransform:'uppercase' as const,marginBottom:6}}>Down Payment</div>
                                                <div style={{fontFamily:T.serif,fontSize:24,fontWeight:300,color:T.accent,letterSpacing:'-0.02em',lineHeight:1}}>{fmt(downPayment)}</div>
                                                <div style={{fontFamily:T.mono,fontSize:10,color:'rgba(255,255,255,0.25)',marginTop:4}}>{calcDownPct}% of total</div>
                                            </div>
                                            <div style={{padding:'20px 22px',background:'rgba(255,255,255,0.05)',borderRadius:14,border:'1px solid rgba(255,255,255,0.08)'}}>
                                                <div style={{fontFamily:T.mono,fontSize:8.5,letterSpacing:'0.14em',color:'rgba(255,255,255,0.3)',textTransform:'uppercase' as const,marginBottom:6}}>Loan Amount</div>
                                                <div style={{fontFamily:T.serif,fontSize:24,fontWeight:300,color:'#fff',letterSpacing:'-0.02em',lineHeight:1}}>{fmt(loanAmount)}</div>
                                                <div style={{fontFamily:T.mono,fontSize:10,color:'rgba(255,255,255,0.25)',marginTop:4}}>{100-calcDownPct}% financed</div>
                                            </div>
                                        </div>
                                        )}

                                        {/* Property cost reference + config info */}
                                        {basePrice > 0 && (
                                        <div style={{padding:'14px 18px',background:'rgba(255,255,255,0.03)',borderRadius:12,border:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                            <span style={{fontFamily:T.sans,fontSize:12,color:'rgba(255,255,255,0.4)'}}>Total Property Cost</span>
                                            <div style={{textAlign:'right' as const}}>
                                                <span style={{fontFamily:T.mono,fontSize:13,color:'rgba(255,255,255,0.65)',fontWeight:600}}>{fmt(totalCost)}</span>
                                                {cfgName && <div style={{fontFamily:T.sans,fontSize:10,color:'rgba(255,255,255,0.25)',marginTop:2}}>{cfgName} · Flr {calcFloor} · {calcSpecs.superBuiltUp} sqft</div>}
                                            </div>
                                        </div>
                                        )}

                                        {/* Breakdown */}
                                        {basePrice > 0 && (
                                        <div style={{display:'flex',flexDirection:'column' as const,gap:0,borderRadius:14,overflow:'hidden',border:'1px solid rgba(255,255,255,0.07)'}}>
                                            {[
                                                {label:'Base Price',              value:fmt(basePrice),   note:''},
                                                {label:`Floor Rise (Flr ${calcFloor})`, value:fmt(floorRise), note:''},
                                                ...(maintenanceMonthly > 0 ? [{label:'Maint. (monthly)', value:fmt(maintenanceMonthly), note:'est.', accent:false}] : []),
                                            ].map((r,i) => (
                                                <div key={r.label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 18px',background:'transparent',borderTop:i>0?'1px solid rgba(255,255,255,0.06)':'none'}}>
                                                    <span style={{fontFamily:T.sans,fontSize:12.5,color:'rgba(255,255,255,0.55)',fontWeight:500}}>{r.label}</span>
                                                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                                                        {(r as any).note && <span style={{fontFamily:T.mono,fontSize:9,color:'rgba(255,255,255,0.25)',letterSpacing:'0.08em'}}>{(r as any).note}</span>}
                                                        <span style={{fontFamily:T.mono,fontSize:13,color:'rgba(255,255,255,0.82)',fontWeight:600}}>{r.value}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        )}

                                        {/* EMI */}
                                        {emi > 0 && (
                                        <div style={{padding:'20px 24px',background:'rgba(255,255,255,0.05)',borderRadius:14,border:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}>
                                            <div>
                                                <div style={{fontFamily:T.mono,fontSize:9,letterSpacing:'0.14em',color:'rgba(255,255,255,0.3)',textTransform:'uppercase' as const,marginBottom:4}}>Monthly EMI</div>
                                                <div style={{fontFamily:T.serif,fontSize:28,fontWeight:300,color:'#fff',letterSpacing:'-0.01em',lineHeight:1}}>{fmt(emi)}</div>
                                                <div style={{fontFamily:T.sans,fontSize:11,color:'rgba(255,255,255,0.3)',marginTop:4}}>{calcRate}% · {calcTenure} yrs · {fmt(totalInterest)} interest</div>
                                            </div>
                                            <button onClick={() => navigate('/customer/meeting',{state:{projectId:project.id,builderId:project.builderId,projectName:project.name,city:project.city}})}
                                                style={{flexShrink:0,background:T.accent,color:T.ink,border:'none',padding:'12px 22px',borderRadius:12,cursor:'pointer',fontFamily:T.sans,fontWeight:800,fontSize:13,whiteSpace:'nowrap' as const}}>
                                                Book Visit
                                            </button>
                                        </div>
                                        )}

                                        <p style={{fontFamily:T.sans,fontSize:10.5,color:'rgba(255,255,255,0.2)',lineHeight:1.6,margin:0}}>
                                            * Estimates only. Actual pricing, charges and EMI may vary based on bank policy, floor, facing and booking date. Contact the builder for final quote.
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </AnimateIn>
                </section>
                )}

                {/* ── Full-width gallery after pricing ───────────────────────── */}
                {imagesDocs.length >= 2 && (
                    <div style={{margin:'0',display:'flex',flexDirection:'column' as const,gap:0,lineHeight:0,fontSize:0,paddingTop:160,background:'#ffffff'}}>
                        {[
                            imagesDocs[Math.min(4, imagesDocs.length - 1)],
                            imagesDocs[Math.min(5, imagesDocs.length - 1)],
                        ].filter((img, i, arr) => img && arr.indexOf(img) === i).map((img, i, arr) => (
                            <div key={i} style={{width:'100%',overflow:'hidden',aspectRatio:'21/8',position:'relative' as const,background:T.ink,display:'block'}}>
                                <img src={img.fileUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center',display:'block',transition:'transform .7s ease',opacity:0.88}}
                                    onMouseEnter={e => { e.currentTarget.style.transform='scale(1.02)'; e.currentTarget.style.opacity='1'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.opacity='0.88'; }}/>
                                <div style={{position:'absolute' as const,inset:0,background:'linear-gradient(to bottom, rgba(11,25,41,0.28) 0%, transparent 35%, transparent 65%, rgba(11,25,41,0.38) 100%)',pointerEvents:'none'}}/>
                                <div style={{position:'absolute' as const,inset:0,background:'linear-gradient(to right, rgba(11,25,41,0.18) 0%, transparent 40%)',pointerEvents:'none'}}/>
                                {i < arr.length - 1 && (
                                    <div style={{position:'absolute' as const,bottom:0,left:0,right:0,height:3,background:`linear-gradient(to right, transparent 0%, ${T.accent} 30%, ${T.accent} 70%, transparent 100%)`,opacity:0.6}}/>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ══ 03 · FLOOR PLANS ═══════════════════════════════════════════ */}
                <section id="sec-floorplans" style={{margin:'160px 0 0',background:T.ink,padding:'72px 0',position:'relative' as const,overflow:'hidden'}}>
                    {/* Decorative radial glow */}
                    <div style={{position:'absolute' as const,top:'-20%',right:'-5%',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle, rgba(201,168,108,0.06), transparent 65%)',pointerEvents:'none'}}/>
                <AnimateIn>
                    <div style={{maxWidth:1280,margin:'0 auto',padding:'0 48px'}}>
                        {/* Section header */}
                        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:24,marginBottom:40}}>
                            <div>
                                <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:12}}>
                                    <span style={{fontFamily:T.mono,fontSize:10,letterSpacing:'0.22em',color:T.accent,fontWeight:700}}>03</span>
                                    <div style={{height:1,background:`linear-gradient(to right, ${T.accent}, transparent)`,width:64}}/>
                                    <span style={{...sk,color:'rgba(255,255,255,0.35)'}}>Floor Plans</span>
                                </div>
                                <h2 style={{fontFamily:T.serif,fontSize:'clamp(28px,3vw,44px)',fontWeight:300,color:'#fff',margin:0,letterSpacing:'-0.025em',lineHeight:1}}>
                                    Every sq ft <em style={{fontStyle:'italic',color:T.accent}}>purposefully designed.</em>
                                </h2>
                            </div>
                            {activeFloorPlanDoc && (
                                <a href={activeFloorPlanDoc.fileUrl} download target="_blank" rel="noreferrer"
                                    style={{display:'flex',alignItems:'center',gap:6,padding:'10px 20px',borderRadius:999,border:'1px solid rgba(201,168,108,0.35)',background:'rgba(201,168,108,0.08)',color:T.accent,textDecoration:'none',fontFamily:T.sans,fontSize:12,fontWeight:600,flexShrink:0}}>
                                    <Download size={12}/> Download Plan
                                </a>
                            )}
                        </div>

                        {/* Config + facing chips */}
                        <div style={{display:'flex',gap:24,alignItems:'flex-start',marginBottom:32,flexWrap:'wrap' as const}}>
                            {configs.length > 0 && (
                                <div>
                                    <div style={{fontFamily:T.mono,fontSize:8.5,letterSpacing:'0.16em',color:'rgba(255,255,255,0.3)',textTransform:'uppercase' as const,marginBottom:8}}>BHK Type</div>
                                    <div style={{display:'flex',gap:6,flexWrap:'wrap' as const}}>
                                        {configs.map((c,i) => (
                                            <button key={c} onClick={() => setActiveConfig(i)}
                                                style={{padding:'7px 18px',borderRadius:999,border:`1px solid ${activeConfig===i?T.accent:'rgba(255,255,255,0.14)'}`,background:activeConfig===i?T.accent:'rgba(255,255,255,0.04)',color:activeConfig===i?T.ink:'rgba(255,255,255,0.65)',cursor:'pointer',fontFamily:T.sans,fontSize:12,fontWeight:600,transition:'all .15s'}}>
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {availableFacings.length > 0 && (
                                <div>
                                    <div style={{fontFamily:T.mono,fontSize:8.5,letterSpacing:'0.16em',color:'rgba(255,255,255,0.3)',textTransform:'uppercase' as const,marginBottom:8}}>Facing</div>
                                    <div style={{display:'flex',gap:6,flexWrap:'wrap' as const}}>
                                        {availableFacings.map(f => (
                                            <button key={f} onClick={() => setActiveFacing(f)}
                                                style={{padding:'7px 18px',borderRadius:999,border:`1px solid ${activeFacing===f?T.accent:'rgba(255,255,255,0.14)'}`,background:activeFacing===f?T.accent:'rgba(255,255,255,0.04)',color:activeFacing===f?T.ink:'rgba(255,255,255,0.65)',cursor:'pointer',fontFamily:T.sans,fontSize:12,fontWeight:600,transition:'all .15s'}}>
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Main layout: image left, specs right */}
                        <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:32,alignItems:'stretch'}}>
                            {/* Floor plan image */}
                            <div style={{borderRadius:20,overflow:'hidden',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px',minHeight:440,position:'relative' as const}}>
                                {activeFloorPlanDoc ? (
                                    <img src={activeFloorPlanDoc.fileUrl} alt={`${activeConfigName} floor plan`}
                                        style={{maxWidth:'100%',maxHeight:400,objectFit:'contain',display:'block'}}/>
                                ) : (
                                    <div style={{width:'100%',maxWidth:420,aspectRatio:'4/3'}}>
                                        <FloorPlanSVG bhk={activeConfigName || configs[0] || '2 BHK'} locality={project.locality}/>
                                    </div>
                                )}
                                {!activeFloorPlanDoc && (
                                    <span style={{position:'absolute' as const,top:14,right:14,fontFamily:T.mono,fontSize:9,letterSpacing:'0.12em',color:'rgba(255,255,255,0.25)',background:'rgba(255,255,255,0.06)',padding:'4px 10px',borderRadius:999}}>INDICATIVE</span>
                                )}
                            </div>

                            {/* Specs panel */}
                            <div style={{display:'flex',flexDirection:'column' as const,gap:16}}>
                                {/* Config title */}
                                <div style={{padding:'24px 28px',borderRadius:16,background:'rgba(201,168,108,0.08)',border:'1px solid rgba(201,168,108,0.18)'}}>
                                    <div style={{fontFamily:T.mono,fontSize:9,letterSpacing:'0.14em',color:'rgba(201,168,108,0.6)',textTransform:'uppercase' as const,marginBottom:6}}>Selected</div>
                                    <div style={{fontFamily:T.serif,fontSize:28,fontWeight:300,color:'#fff',letterSpacing:'-0.01em'}}>{activeConfigName || configs[0] || '—'}</div>
                                    <div style={{fontFamily:T.sans,fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:4}}>{specs.superBuiltUp} sqft built-up · {specs.carpet} sqft carpet</div>
                                </div>

                                {/* Room breakdown */}
                                <div style={{flex:1,borderRadius:16,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',overflow:'hidden'}}>
                                    {specs.rooms.map((r,i) => (
                                        <div key={r.name} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 20px',borderTop:i>0?'1px solid rgba(255,255,255,0.05)':'none'}}>
                                            <span style={{fontFamily:T.sans,fontSize:13,color:'rgba(255,255,255,0.6)',fontWeight:500}}>{r.name}</span>
                                            <span style={{fontFamily:T.mono,fontSize:11,color:'rgba(255,255,255,0.35)'}}>{r.size}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Key stats */}
                                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                                    {[
                                        {l:'Towers', v:project.towers?String(project.towers):'—'},
                                        {l:'Floors',  v:project.floorsPerTower?`G+${project.floorsPerTower}`:'—'},
                                        {l:'Starting From', v:project.priceMin?fmtPrice(project.priceMin):'—'},
                                        {l:'Possession', v:project.possessionDate?new Date(project.possessionDate).toLocaleDateString('en-IN',{month:'short',year:'numeric'}):'—'},
                                    ].map(s => (
                                        <div key={s.l} style={{padding:'14px 16px',background:'rgba(255,255,255,0.04)',borderRadius:12,border:'1px solid rgba(255,255,255,0.07)'}}>
                                            <div style={{fontFamily:T.mono,fontSize:8,letterSpacing:'0.12em',textTransform:'uppercase' as const,color:'rgba(255,255,255,0.28)',marginBottom:4}}>{s.l}</div>
                                            <div style={{fontFamily:T.serif,fontSize:16,fontWeight:300,color:'#fff',letterSpacing:'-0.01em'}}>{s.v}</div>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={() => navigate('/customer/meeting',{state:{projectId:project.id,builderId:project.builderId,projectName:project.name,city:project.city}})}
                                    style={{padding:'14px 24px',borderRadius:12,background:T.accent,color:T.ink,border:'none',cursor:'pointer',fontFamily:T.sans,fontWeight:800,fontSize:13}}>
                                    Book a Site Visit
                                </button>
                            </div>
                        </div>
                    </div>
                </AnimateIn>
                </section>

                {/* ══ TOWER PLANS ═══════════════════════════════════════════════ */}
                <section style={{margin:'0',background:'#F5F0E8',padding:'72px 0',position:'relative' as const,overflow:'hidden'}}>
                    <div style={{position:'absolute' as const,bottom:'-15%',left:'-5%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle, rgba(201,168,108,0.12), transparent 65%)',pointerEvents:'none'}}/>
                <AnimateIn>
                    <div style={{maxWidth:1280,margin:'0 auto',padding:'0 48px'}}>
                        {/* Header */}
                        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:24,marginBottom:36}}>
                            <div>
                                <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:12}}>
                                    <span style={{fontFamily:T.mono,fontSize:10,letterSpacing:'0.22em',color:T.aInk,fontWeight:700}}>→</span>
                                    <span style={sk}>Tower Plans</span>
                                </div>
                                <h2 style={{fontFamily:T.serif,fontSize:'clamp(28px,3vw,44px)',fontWeight:300,color:T.ink,margin:0,letterSpacing:'-0.025em',lineHeight:1}}>
                                    View your <em style={{fontStyle:'italic',color:T.aInk}}>tower layout.</em>
                                </h2>
                            </div>
                            {activeTowerPlanDoc && (
                                <a href={activeTowerPlanDoc.fileUrl} download target="_blank" rel="noreferrer"
                                    style={{display:'flex',alignItems:'center',gap:6,fontFamily:T.sans,fontSize:12,fontWeight:600,color:T.aInk,textDecoration:'none',border:`1px solid ${T.accent}`,borderRadius:999,padding:'9px 20px',background:T.aTint,flexShrink:0}}>
                                    <Download size={12}/> Download Plan
                                </a>
                            )}
                        </div>

                        {/* Tower tabs */}
                        <div style={{display:'flex',gap:8,overflowX:'auto',scrollbarWidth:'none' as const,marginBottom:24,paddingBottom:4}}>
                            {Array.from({length: Math.max(1, project.towers ?? 1)}).map((_,i) => (
                                <button key={i} onClick={() => setActiveTower(i)}
                                    style={{flexShrink:0,padding:'10px 24px',borderRadius:999,border:`1px solid ${activeTower===i?T.aInk:T.line}`,background:activeTower===i?T.ink:'#fff',color:activeTower===i?'#fff':T.ink2,cursor:'pointer',fontFamily:T.sans,fontSize:13,fontWeight:activeTower===i?700:500,transition:'all .15s',whiteSpace:'nowrap' as const,boxShadow:activeTower===i?'0 4px 16px rgba(11,25,41,0.2)':'none'}}>
                                    Tower {String(i+1).padStart(2,'0')}
                                </button>
                            ))}
                        </div>

                        {/* Plan card */}
                        <div style={{background:'#fff',borderRadius:24,overflow:'hidden',boxShadow:'0 8px 40px rgba(11,25,41,0.08)',border:`1px solid ${T.line}`,minHeight:460,display:'flex',alignItems:'center',justifyContent:'center',padding:'52px'}}>
                            {activeTowerPlanDoc ? (
                                <img src={activeTowerPlanDoc.fileUrl} alt={`Tower ${activeTower+1} plan`}
                                    style={{maxWidth:'100%',maxHeight:560,objectFit:'contain',display:'block'}}/>
                            ) : (
                                <div style={{width:'100%',maxWidth:560,textAlign:'center' as const}}>
                                    <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:'0.12em',textTransform:'uppercase' as const,color:T.muted,marginBottom:20}}>Tower {activeTower+1}</div>
                                    <div style={{aspectRatio:'4/3'}}>
                                        <FloorPlanSVG bhk={configs[0] ?? '2 BHK'} locality={project.locality}/>
                                    </div>
                                    <div style={{fontFamily:T.sans,fontSize:12,color:T.muted,marginTop:16,lineHeight:1.6}}>
                                        Indicative layout — builder plans available on request
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </AnimateIn>
                </section>

                {/* ══ 04 · AMENITIES ════════════════════════════════════════════ */}
                <section id="sec-amenities" style={{margin:'160px 0 0',background:'#0A1628',position:'relative' as const,overflow:'hidden'}}>
                    {/* Grid texture */}
                    <div style={{position:'absolute' as const,inset:0,pointerEvents:'none',backgroundImage:'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)',backgroundSize:'52px 52px'}}/>
                    {/* Ambient glows */}
                    <div style={{position:'absolute' as const,top:'-15%',right:'-8%',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(10,126,140,0.12) 0%,transparent 65%)',pointerEvents:'none'}}/>
                    <div style={{position:'absolute' as const,bottom:'-15%',left:'-5%',width:480,height:480,borderRadius:'50%',background:'radial-gradient(circle,rgba(201,168,108,0.08) 0%,transparent 65%)',pointerEvents:'none'}}/>
                <AnimateIn>
                {(() => {
                    const amenityList = Array.isArray(project.amenities)
                        ? project.amenities.map(String).filter(Boolean)
                        : [];
                    const featured = amenityList.slice(0, 9);
                    const rest     = amenityList.slice(9);
                    return (
                        <>
                        {/* ── Header ── */}
                        <div style={{maxWidth:1280,margin:'0 auto',padding:'80px 48px 64px',display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:32}}>
                            <div>
                                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                                    <span style={{fontFamily:T.mono,fontSize:10,letterSpacing:'0.22em',color:'rgba(10,126,140,0.8)',fontWeight:700,textTransform:'uppercase' as const}}>04 · Amenities</span>
                                    {amenityList.length > 0 && (
                                        <span style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:'#0A7E8C',background:'rgba(10,126,140,0.15)',border:'1px solid rgba(10,126,140,0.25)',borderRadius:999,padding:'2px 10px'}}>
                                            {amenityList.length} total
                                        </span>
                                    )}
                                </div>
                                <h2 style={{fontFamily:T.serif,fontSize:'clamp(28px,3.5vw,48px)',fontWeight:300,color:'#fff',margin:0,letterSpacing:'-0.025em',lineHeight:1}}>
                                    Crafted for <em style={{fontStyle:'italic',color:T.accent}}>modern living.</em>
                                </h2>
                            </div>
                            <p style={{fontFamily:T.sans,fontSize:13,color:'rgba(255,255,255,0.32)',maxWidth:280,textAlign:'right' as const,lineHeight:1.8,margin:0,flexShrink:0}}>
                                Leisure, wellness, convenience and community — all within your community.
                            </p>
                        </div>

                        {/* ── Featured amenities — 3-col card grid ── */}
                        {featured.length > 0 && (
                            <div style={{maxWidth:1280,margin:'0 auto',padding:'0 48px 0'}}>
                                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'rgba(255,255,255,0.06)',borderRadius:20,overflow:'hidden',border:'1px solid rgba(255,255,255,0.06)'}}>
                                    {featured.map((amenity, i) => (
                                        <div key={amenity}
                                            style={{padding:'36px 32px',display:'flex',alignItems:'center',gap:20,background:'rgba(255,255,255,0.02)',transition:'background .2s,transform .2s',cursor:'default'}}
                                            onMouseEnter={e => { e.currentTarget.style.background='rgba(10,126,140,0.09)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.02)'; }}>
                                            {/* Illustration container */}
                                            <div style={{width:56,height:56,borderRadius:16,background:'rgba(10,126,140,0.14)',border:'1px solid rgba(10,126,140,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'rgba(255,255,255,0.8)'}}>
                                                <AmenityIllustration name={amenity}/>
                                            </div>
                                            {/* Text */}
                                            <div style={{flex:1,minWidth:0}}>
                                                <div style={{fontFamily:T.sans,fontSize:15,fontWeight:600,color:'rgba(255,255,255,0.88)',lineHeight:1.3,marginBottom:4}}>
                                                    {amenity}
                                                </div>
                                                <div style={{width:24,height:1.5,background:'rgba(10,126,140,0.5)',borderRadius:999}}/>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Secondary amenities — pill tags ── */}
                        {rest.length > 0 && (
                            <div style={{maxWidth:1280,margin:'0 auto',padding:'32px 48px 0'}}>
                                <div style={{fontFamily:T.mono,fontSize:9,letterSpacing:'0.14em',textTransform:'uppercase' as const,color:'rgba(255,255,255,0.22)',fontWeight:700,marginBottom:16}}>
                                    Additional amenities
                                </div>
                                <div style={{display:'flex',flexWrap:'wrap' as const,gap:8}}>
                                    {rest.map((amenity) => (
                                        <span key={amenity} style={{fontFamily:T.sans,fontSize:12,fontWeight:500,color:'rgba(255,255,255,0.55)',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:999,padding:'6px 14px',transition:'all .18s',cursor:'default'}}
                                            onMouseEnter={e => { e.currentTarget.style.color='rgba(255,255,255,0.85)'; e.currentTarget.style.background='rgba(10,126,140,0.12)'; e.currentTarget.style.borderColor='rgba(10,126,140,0.3)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.55)'; e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.09)'; }}>
                                            {amenity}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {amenityList.length === 0 && (
                            <div style={{padding:'60px 48px 72px',maxWidth:1280,margin:'0 auto'}}>
                                <p style={{fontFamily:T.sans,color:'rgba(255,255,255,0.3)',fontSize:14,margin:0,lineHeight:1.7}}>
                                    Amenity details will be shared upon enquiry.
                                </p>
                            </div>
                        )}
                        {/* Bottom spacer */}
                        <div style={{height:72}}/>
                        </>
                    );
                })()}
                </AnimateIn>
                </section>

                {/* ══ 05 · LOCATION ═════════════════════════════════════════════ */}
                <section id="sec-location" style={{margin:'160px 0 0',padding:0}}>
                <AnimateIn>
                    {/* Header — constrained */}
                    <div style={{maxWidth:1280,margin:'0 auto',padding:'0 40px'}}>
                        <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:40}}>
                            <span style={{fontFamily:T.mono,fontSize:10,letterSpacing:'0.22em',color:T.accent,fontWeight:700}}>05</span>
                            <div style={{height:1,background:`linear-gradient(to right, ${T.accent}, transparent)`,width:64}}/>
                            <span style={sk}>Location &amp; City News</span>
                        </div>
                        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:24,marginBottom:32}}>
                            <h2 style={{fontFamily:T.serif,fontSize:'clamp(28px,3.5vw,46px)',fontWeight:300,lineHeight:1,letterSpacing:'-0.025em',color:T.ink,margin:0}}>
                                Perfectly{' '}
                                <em style={{fontStyle:'italic',color:T.aInk}}>connected</em>.
                            </h2>
                            {(project.locality || project.city) && (
                                <div style={{display:'flex',alignItems:'center',gap:6,fontFamily:T.sans,color:T.muted,fontSize:13,fontWeight:500}}>
                                    <MapPin size={14} style={{color:T.accent}}/>
                                    {[project.landmark, project.locality, project.city, project.pincode].filter(Boolean).join(', ')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Map + News panel — full viewport width, side by side ── */}
                    <div style={{display:'flex',width:'100%',alignItems:'flex-start',marginBottom:20,padding:'0 40px 0 40px',gap:20}}>

                        {/* Map — fills all space to the left of the news panel */}
                        <div style={{flex:1,minWidth:0,borderRadius:16,overflow:'hidden'}}>
                            <GoogleMapsLocationField
                                readOnly
                                showMapLabel={false}
                                showNearby={false}
                                value={project.googleMapsLink ?? ''}
                                onChange={() => {}}
                                address={project.address ?? [project.locality, project.city].filter(Boolean).join(', ')}
                                city={project.city ?? ''}
                            />
                        </div>

                        {/* City news panel — right of map, right-padded from screen edge */}
                        <div style={{flexShrink:0,width:360,paddingTop:0}}>
                        <div style={{borderRadius:20,overflow:'hidden',background:'rgba(11,25,41,0.93)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 20px 56px rgba(0,0,0,0.28)',display:'flex',flexDirection:'column' as const,height:500}}>
                            {/* Header */}
                            <div style={{padding:'18px 20px 14px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
                                <div style={{width:30,height:30,borderRadius:8,background:'rgba(201,168,108,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                    <Newspaper size={14} style={{color:T.accent}}/>
                                </div>
                                <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontFamily:T.sans,fontSize:12,fontWeight:700,color:'#fff',letterSpacing:'0.01em'}}>
                                        {project.city || 'City'} Development News
                                    </div>
                                    <div style={{fontFamily:T.sans,fontSize:10,color:'rgba(255,255,255,0.35)',marginTop:1}}>Real Estate · Infrastructure · Investment</div>
                                </div>
                                {newsLoading && <Loader2 size={13} style={{color:T.accent,flexShrink:0}} className="animate-spin"/>}
                            </div>
                            {/* News list */}
                            <div style={{flex:1,overflowY:'auto' as const,padding:'6px 0',scrollbarWidth:'none' as const}}>
                                {!newsLoading && newsItems.length === 0 && (
                                    <div style={{display:'flex',flexDirection:'column' as const,alignItems:'center',justifyContent:'center',height:'100%',gap:10,padding:'32px 24px'}}>
                                        <Newspaper size={24} style={{color:'rgba(255,255,255,0.15)'}}/>
                                        <p style={{fontFamily:T.sans,fontSize:12,color:'rgba(255,255,255,0.28)',textAlign:'center' as const,lineHeight:1.6,margin:0}}>No recent news found for this area.</p>
                                    </div>
                                )}
                                {newsItems.map((article, i) => (
                                    <a key={i} href={article.url} target="_blank" rel="noreferrer"
                                        style={{display:'block',textDecoration:'none',padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,0.05)',transition:'background .12s'}}
                                        onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.05)')}
                                        onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                                        <div style={{display:'flex',gap:11,alignItems:'flex-start'}}>
                                            {article.image && (
                                                <div style={{width:52,height:38,borderRadius:6,overflow:'hidden',flexShrink:0,background:'rgba(255,255,255,0.06)'}}>
                                                    <img src={article.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}
                                                        onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display='none'; }}/>
                                                </div>
                                            )}
                                            <div style={{flex:1,minWidth:0}}>
                                                <p style={{fontFamily:T.sans,fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.88)',lineHeight:1.4,margin:'0 0 5px',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as const,overflow:'hidden'}}>
                                                    {article.title}
                                                </p>
                                                <div style={{display:'flex',alignItems:'center',gap:7}}>
                                                    <span style={{fontFamily:T.sans,fontSize:10,color:T.accent,fontWeight:700}}>{article.source.name}</span>
                                                    <span style={{width:2,height:2,borderRadius:'50%',background:'rgba(255,255,255,0.2)',flexShrink:0}}/>
                                                    <span style={{fontFamily:T.sans,fontSize:10,color:'rgba(255,255,255,0.3)'}}>
                                                        {(() => {
                                                            const d = new Date(article.publishedAt);
                                                            const diff = Math.floor((Date.now() - d.getTime()) / 60000);
                                                            if (diff < 60) return `${diff}m ago`;
                                                            if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
                                                            return `${Math.floor(diff/1440)}d ago`;
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                            <ExternalLink size={10} style={{color:'rgba(255,255,255,0.18)',flexShrink:0,marginTop:2}}/>
                                        </div>
                                    </a>
                                ))}
                            </div>
                            {/* Footer */}
                            {newsItems.length > 0 && (
                                <div style={{padding:'10px 18px',borderTop:'1px solid rgba(255,255,255,0.07)',flexShrink:0}}>
                                    <a href={`https://news.google.com/search?q=${encodeURIComponent(`${project.city || ''} real estate development`)}&hl=en-IN`}
                                        target="_blank" rel="noreferrer"
                                        style={{fontFamily:T.sans,fontSize:11,fontWeight:600,color:T.accent,textDecoration:'none',display:'flex',alignItems:'center',gap:4,justifyContent:'center' as const}}>
                                        View all development news <ExternalLink size={10}/>
                                    </a>
                                </div>
                            )}
                        </div>
                        </div>
                    </div>

                    {/* ── Location highlights from builder ── */}
                    {project.locationAdvantages && project.locationAdvantages.length > 0 && (
                        <div style={{padding:'20px 40px 0'}}>
                        <div style={{background:T.bg2,borderRadius:16,padding:'20px 24px',border:`1px solid ${T.line}`}}>
                            <div style={{fontFamily:T.sans,fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase' as const,color:T.muted,fontWeight:700,marginBottom:14}}>Location Highlights</div>
                            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
                                {(showAllAdvantages ? project.locationAdvantages : project.locationAdvantages.slice(0,6)).map((adv,i) => (
                                    <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:'#fff',borderRadius:12,border:`1px solid ${T.line}`}}>
                                        <div>
                                            <span style={{fontFamily:T.sans,fontSize:10,color:T.muted,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase' as const}}>{adv.category} · </span>
                                            <span style={{fontFamily:T.sans,fontSize:13,color:T.ink,fontWeight:600}}>{adv.name}</span>
                                        </div>
                                        <div style={{display:'flex',gap:6,fontFamily:T.sans,fontSize:11,color:T.muted,flexShrink:0,marginLeft:8}}>
                                            {adv.driveMinutes && <span style={{background:'#F0FDF4',color:'#15803D',padding:'2px 8px',borderRadius:999,fontWeight:700}}>{adv.driveMinutes} min</span>}
                                            <span>{adv.distanceKm} km</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {project.locationAdvantages.length > 6 && (
                                <button type="button" onClick={() => setShowAllAdvantages(p => !p)}
                                    style={{marginTop:12,fontFamily:T.sans,fontSize:12,fontWeight:600,color:T.aInk,background:'transparent',border:`1px solid ${T.accent}`,borderRadius:999,padding:'6px 16px',cursor:'pointer'}}>
                                    {showAllAdvantages ? 'Show less' : `View all ${project.locationAdvantages.length}`}
                                </button>
                            )}
                        </div>
                        </div>
                    )}
                </AnimateIn>
                </section>



                {/* ══ VIRTUAL TOURS ════════════════════════════════════════════ */}
                {tours.length > 0 && (
                <section style={{margin:'160px 0 0',background:'#0A1628',position:'relative' as const,overflow:'clip'}}>
                    {/* Grid texture */}
                    <div style={{position:'absolute' as const,inset:0,pointerEvents:'none',backgroundImage:'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)',backgroundSize:'52px 52px'}}/>
                    {/* Ambient glow */}
                    <div style={{position:'absolute' as const,top:'-20%',right:'-5%',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(10,126,140,0.12) 0%,transparent 65%)',pointerEvents:'none'}}/>
                    <div style={{position:'absolute' as const,bottom:'-20%',left:'-5%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(201,168,108,0.06) 0%,transparent 65%)',pointerEvents:'none'}}/>

                <AnimateIn>
                    {/* ── Header ── */}
                    <div style={{maxWidth:1280,margin:'0 auto',padding:'80px 48px 56px'}}>
                        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:32}}>
                            <div>
                                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                                    {/* 360 badge */}
                                    <div style={{width:34,height:34,borderRadius:10,background:'rgba(10,126,140,0.18)',border:'1px solid rgba(10,126,140,0.28)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                        <span style={{fontFamily:T.mono,fontSize:9,fontWeight:700,color:'#0DAABF',letterSpacing:'0.04em'}}>360°</span>
                                    </div>
                                    <span style={{fontFamily:T.mono,fontSize:10,letterSpacing:'0.22em',color:'rgba(10,126,140,0.8)',fontWeight:700,textTransform:'uppercase' as const}}>06 · Virtual Tours</span>
                                    {tours.length > 1 && (
                                        <span style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:'#0A7E8C',background:'rgba(10,126,140,0.15)',border:'1px solid rgba(10,126,140,0.25)',borderRadius:999,padding:'2px 10px'}}>
                                            {tours.length} tours
                                        </span>
                                    )}
                                </div>
                                <h2 style={{fontFamily:T.serif,fontSize:'clamp(28px,3vw,48px)',fontWeight:300,color:'#fff',margin:0,letterSpacing:'-0.025em',lineHeight:1}}>
                                    Explore <em style={{fontStyle:'italic',color:T.accent}}>every corner</em><br/>from your screen.
                                </h2>
                            </div>
                            <p style={{fontFamily:T.sans,fontSize:13,color:'rgba(255,255,255,0.32)',maxWidth:280,textAlign:'right' as const,lineHeight:1.8,margin:0,flexShrink:0}}>
                                Walk through the project in 360° — no site visit needed to get a feel of the space.
                            </p>
                        </div>
                    </div>
                </AnimateIn>

                {/* ── Tour frames ── */}
                <div style={{maxWidth:1280,margin:'0 auto',padding:'0 48px 80px',display:'flex',flexDirection:'column' as const,gap:20}}>
                    {tours.map((t, i) => {
                        const embed = toEmbedUrl(t.url);
                        return embed ? (
                            <div key={i} style={{borderRadius:20,overflow:'hidden',border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',boxShadow:'0 24px 64px rgba(0,0,0,0.32)'}}>
                                {/* Tour card header */}
                                <div style={{padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',gap:10,background:'rgba(255,255,255,0.03)'}}>
                                    <div style={{width:8,height:8,borderRadius:'50%',background:'#0A7E8C',flexShrink:0,boxShadow:'0 0 8px rgba(10,126,140,0.6)'}}/>
                                    <span style={{fontFamily:T.sans,fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.7)',flex:1}}>
                                        {t.label || `Virtual Tour ${tours.length > 1 ? i + 1 : ''}`}
                                    </span>
                                    <span style={{fontFamily:T.mono,fontSize:9,letterSpacing:'0.12em',color:'rgba(255,255,255,0.22)',fontWeight:700,textTransform:'uppercase' as const}}>360° Immersive</span>
                                </div>
                                {/* iframe — 16:9 responsive fill */}
                                <div style={{position:'relative' as const,paddingBottom:'56.25%',height:0,overflow:'hidden',background:'#000'}}>
                                    <iframe
                                        src={embed}
                                        style={{position:'absolute' as const,top:0,left:0,width:'100%',height:'100%',border:'none',display:'block'}}
                                        allowFullScreen
                                        title={t.label || `Virtual Tour ${i + 1}`}
                                    />
                                </div>
                            </div>
                        ) : null;
                    })}
                </div>
                </section>
                )}

                {/* ══ BUILDER PROFILE ═══════════════════════════════════════════ */}
                {(project.builderAbout || project.builderYearEstablished || project.builderDeliveredProjects || project.builderWebsite) && (
                <section style={{maxWidth:1280,margin:'160px auto 0',padding:'0 40px'}}>
                <AnimateIn>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:48,background:T.bg2,borderRadius:24,padding:'52px 52px',border:`1px solid ${T.line}`}}>
                        <div>
                            <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:24}}>
                                <div style={{width:40,height:40,borderRadius:10,background:T.ink,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                    <Building2 size={18} style={{color:T.accent}}/>
                                </div>
                                <div>
                                    <div style={{fontFamily:T.mono,fontSize:9,letterSpacing:'0.14em',color:T.muted,textTransform:'uppercase' as const,marginBottom:2}}>Developer</div>
                                    <div style={{fontFamily:T.sans,fontSize:16,fontWeight:700,color:T.ink}}>{project.builderName || 'Builder'}</div>
                                </div>
                            </div>
                            {project.builderAbout && (
                                <p style={{fontFamily:T.sans,fontSize:13.5,color:T.muted,lineHeight:1.8,margin:'0 0 24px'}}>{project.builderAbout}</p>
                            )}
                            {project.builderWebsite && (
                                <a href={project.builderWebsite} target="_blank" rel="noreferrer"
                                    style={{display:'inline-flex',alignItems:'center',gap:6,fontFamily:T.sans,fontSize:12,fontWeight:600,color:T.aInk,textDecoration:'none',border:`1px solid ${T.accent}`,borderRadius:999,padding:'6px 16px',background:T.aTint}}>
                                    <ExternalLink size={11}/> Visit Website
                                </a>
                            )}
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,alignContent:'start'}}>
                            {[
                                project.builderYearEstablished && {label:'Est. Year', value:String(project.builderYearEstablished)},
                                project.builderDeliveredProjects && {label:'Projects Delivered', value:`${project.builderDeliveredProjects}+`},
                                project.builderContactPhone && {label:'Contact', value:project.builderContactPhone},
                                project.builderContactEmail && {label:'Email', value:project.builderContactEmail},
                            ].filter(Boolean).map((s:any,i) => (
                                <div key={i} style={{padding:'16px 18px',background:'#fff',borderRadius:12,border:`1px solid ${T.line}`}}>
                                    <div style={{fontFamily:T.mono,fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase' as const,color:T.muted,fontWeight:700,marginBottom:4}}>{s.label}</div>
                                    <div style={{fontFamily:T.sans,fontSize:14,fontWeight:700,color:T.ink}}>{s.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </AnimateIn>
                </section>
                )}



                {/* ══ FAQ ═══════════════════════════════════════════════════════ */}
                <section id="sec-faq" style={{maxWidth:1280,margin:'160px auto 0',padding:'0 40px 128px'}}>
                <AnimateIn>
                    <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:40}}>
                        <span style={{fontFamily:T.mono,fontSize:10,letterSpacing:'0.22em',color:T.accent,fontWeight:700}}>07</span>
                        <div style={{height:1,background:`linear-gradient(to right, ${T.accent}, transparent)`,width:64}}/>
                        <span style={sk}>Frequently Asked</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1.4fr',gap:52,alignItems:'start'}}>
                        <div>
                            <h2 style={{fontFamily:T.serif,fontSize:'clamp(28px,3.5vw,46px)',fontWeight:300,lineHeight:1.05,letterSpacing:'-0.025em',color:T.ink,margin:'0 0 16px'}}>
                                Questions you <em style={{fontStyle:'italic',color:T.aInk}}>might have</em>.
                            </h2>
                            <p style={{fontFamily:T.sans,color:T.muted,fontSize:14,lineHeight:1.75,margin:'0 0 32px'}}>
                                Everything you need to know about {project.name}. Can't find an answer? Reach out to our team.
                            </p>
                            <div style={{display:'flex',flexDirection:'column' as const,gap:10}}>
                                <button onClick={() => navigate('/customer/meeting',{state:{projectId:project.id,builderId:project.builderId,projectName:project.name,city:project.city}})}
                                    style={{display:'flex',alignItems:'center',gap:10,padding:'14px 20px',background:T.ink,color:'#fff',border:'none',borderRadius:12,cursor:'pointer',fontFamily:T.sans,fontWeight:700,fontSize:13,textAlign:'left' as const}}>
                                    <Calendar size={16} style={{color:T.accent,flexShrink:0}}/> Schedule a Site Visit
                                </button>
                                <a href={`https://wa.me/${project.builderContactPhone ? project.builderContactPhone.replace(/\D/g,'') : ''}?text=${encodeURIComponent(`Hi, I'd like to know more about ${project.name}.`)}`}
                                    target="_blank" rel="noreferrer"
                                    style={{display:'flex',alignItems:'center',gap:10,padding:'14px 20px',background:'#25D36614',color:'#15803D',border:'1px solid #25D36630',borderRadius:12,cursor:'pointer',fontFamily:T.sans,fontWeight:700,fontSize:13,textDecoration:'none'}}>
                                    <MessageCircle size={16} style={{flexShrink:0}}/> Chat on WhatsApp
                                </a>
                                {project.builderContactPhone && (
                                    <a href={`tel:${project.builderContactPhone}`}
                                        style={{display:'flex',alignItems:'center',gap:10,padding:'14px 20px',background:T.bg2,color:T.ink,border:`1px solid ${T.line}`,borderRadius:12,cursor:'pointer',fontFamily:T.sans,fontWeight:700,fontSize:13,textDecoration:'none'}}>
                                        <Phone size={16} style={{flexShrink:0}}/> {project.builderContactPhone}
                                    </a>
                                )}
                            </div>
                        </div>
                        <div>
                            {faq.map((item, i) => (
                                <div key={i} style={{borderBottom:`1px solid ${T.line}`}}>
                                    <button onClick={() => setOpenFaq(openFaq===i?null:i)}
                                        style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 0',background:'transparent',border:'none',cursor:'pointer',textAlign:'left' as const,gap:16}}>
                                        <span style={{fontFamily:T.sans,fontSize:15,fontWeight:700,color:T.ink,lineHeight:1.4}}>{item.q}</span>
                                        <ChevronDown size={16} style={{color:T.muted,flexShrink:0,transform:openFaq===i?'rotate(180deg)':'none',transition:'transform .2s'}}/>
                                    </button>
                                    {openFaq===i && (
                                        <div style={{fontFamily:T.sans,padding:'0 0 20px',fontSize:14,color:T.muted,lineHeight:1.8}}>
                                            {item.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </AnimateIn>
                </section>

                {/* ══ ENQUIRY FORM ═════════════════════════════════════════════ */}
                <section style={{margin:'80px 0 0',background:T.bgCream,borderTop:`1px solid ${T.line}`,borderBottom:`1px solid ${T.line}`}}>
                <AnimateIn>
                <div style={{maxWidth:1280,margin:'0 auto',padding:'72px 48px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:56,alignItems:'start'}}>

                        {/* Left — copy */}
                        <div>
                            <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:20}}>
                                <div style={{width:36,height:36,borderRadius:9,background:T.ink,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                    <MessageCircle size={16} style={{color:T.accent}}/>
                                </div>
                                <span style={{fontFamily:T.mono,fontSize:10,letterSpacing:'0.18em',color:T.muted,fontWeight:700,textTransform:'uppercase' as const}}>Tell us what you want</span>
                            </div>
                            <h2 style={{fontFamily:T.serif,fontSize:'clamp(28px,3vw,44px)',fontWeight:300,lineHeight:1.05,letterSpacing:'-0.025em',color:T.ink,margin:'0 0 18px'}}>
                                Share your requirements —<br/>
                                <em style={{fontStyle:'italic',color:T.aInk}}>we'll find the perfect match.</em>
                            </h2>
                            <p style={{fontFamily:T.sans,fontSize:14,color:T.muted,lineHeight:1.75,margin:'0 0 36px',fontWeight:500}}>
                                Tell us your ideal configuration, budget, and timeline. Our team will reach out within 24 hours with personalised options for {project.name}.
                            </p>
                            <div style={{display:'flex',flexDirection:'column' as const,gap:14}}>
                                {[
                                    {icon:<Phone size={14}/>, label:'Direct call', sub:'Speak to a property advisor'},
                                    {icon:<MessageCircle size={14}/>, label:'WhatsApp chat', sub:'Get instant responses'},
                                    {icon:<Calendar size={14}/>, label:'Site visit', sub:'See the project in person'},
                                ].map(c => (
                                    <div key={c.label} style={{display:'flex',alignItems:'center',gap:12}}>
                                        <div style={{width:32,height:32,borderRadius:8,background:'rgba(201,168,108,0.12)',color:T.aInk,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                            {c.icon}
                                        </div>
                                        <div>
                                            <div style={{fontFamily:T.sans,fontSize:13,fontWeight:700,color:T.ink}}>{c.label}</div>
                                            <div style={{fontFamily:T.sans,fontSize:11.5,color:T.muted}}>{c.sub}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right — form */}
                        <div>
                            {enquirySent ? (
                                <div style={{display:'flex',flexDirection:'column' as const,alignItems:'center',justifyContent:'center',gap:16,padding:'48px 24px',textAlign:'center' as const}}>
                                    <div style={{width:56,height:56,borderRadius:16,background:'#F0FDF4',border:'1px solid #86EFAC',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                        <CheckCircle2 size={28} style={{color:'#16A34A'}}/>
                                    </div>
                                    <h3 style={{fontFamily:T.serif,fontSize:24,fontWeight:300,color:T.ink,margin:0,letterSpacing:'-0.01em'}}>
                                        Requirement received!
                                    </h3>
                                    <p style={{fontFamily:T.sans,fontSize:13.5,color:T.muted,lineHeight:1.7,margin:0}}>
                                        Our team will get back to you within 24 hours with options tailored to your needs.
                                    </p>
                                    <button type="button" onClick={() => setEnquirySent(false)}
                                        style={{fontFamily:T.sans,fontSize:12,fontWeight:600,color:T.aInk,background:'transparent',border:'none',cursor:'pointer',textDecoration:'underline',padding:0,marginTop:4}}>
                                        Submit another requirement
                                    </button>
                                </div>
                            ) : (
                                <div style={{display:'flex',flexDirection:'column' as const,gap:14}}>
                                    {/* Name + Phone */}
                                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                                        <div>
                                            <label style={{fontFamily:T.sans,fontSize:10.5,fontWeight:700,color:T.muted,letterSpacing:'0.07em',textTransform:'uppercase' as const,display:'block',marginBottom:6}}>Your Name</label>
                                            <input
                                                type="text" value={enquiryName} onChange={e => setEnquiryName(e.target.value)}
                                                placeholder="e.g. Ravi Kumar"
                                                style={{width:'100%',padding:'11px 14px',borderRadius:10,border:`1px solid ${T.line}`,background:'#fff',fontFamily:T.sans,fontSize:13,color:T.ink,outline:'none',boxSizing:'border-box' as const}}
                                            />
                                        </div>
                                        <div>
                                            <label style={{fontFamily:T.sans,fontSize:10.5,fontWeight:700,color:T.muted,letterSpacing:'0.07em',textTransform:'uppercase' as const,display:'block',marginBottom:6}}>Phone</label>
                                            <input
                                                type="tel" value={enquiryPhone} onChange={e => setEnquiryPhone(e.target.value)}
                                                placeholder="+91 98765 43210"
                                                style={{width:'100%',padding:'11px 14px',borderRadius:10,border:`1px solid ${T.line}`,background:'#fff',fontFamily:T.sans,fontSize:13,color:T.ink,outline:'none',boxSizing:'border-box' as const}}
                                            />
                                        </div>
                                    </div>

                                    {/* BHK preference */}
                                    <div>
                                        <label style={{fontFamily:T.sans,fontSize:10.5,fontWeight:700,color:T.muted,letterSpacing:'0.07em',textTransform:'uppercase' as const,display:'block',marginBottom:8}}>Preferred BHK</label>
                                        <div style={{display:'flex',gap:8,flexWrap:'wrap' as const}}>
                                            {(project.configurations?.length ? project.configurations : ['1BHK','2BHK','3BHK','4BHK']).map(bhk => (
                                                <button key={bhk} type="button" onClick={() => setEnquiryBhk(bhk)}
                                                    style={{padding:'7px 16px',borderRadius:999,border:`1px solid ${enquiryBhk===bhk?T.accent:T.line}`,background:enquiryBhk===bhk?T.ink:'#fff',color:enquiryBhk===bhk?'#fff':T.ink2,cursor:'pointer',fontFamily:T.sans,fontSize:12.5,fontWeight:600,transition:'all .15s'}}>
                                                    {bhk}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Budget + Timeline */}
                                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                                        <div>
                                            <label style={{fontFamily:T.sans,fontSize:10.5,fontWeight:700,color:T.muted,letterSpacing:'0.07em',textTransform:'uppercase' as const,display:'block',marginBottom:6}}>Budget</label>
                                            <select value={enquiryBudget} onChange={e => setEnquiryBudget(e.target.value)}
                                                style={{width:'100%',padding:'11px 14px',borderRadius:10,border:`1px solid ${T.line}`,background:'#fff',fontFamily:T.sans,fontSize:13,color:enquiryBudget?T.ink:T.muted,outline:'none',cursor:'pointer',appearance:'none' as const,boxSizing:'border-box' as const}}>
                                                <option value="">Select range</option>
                                                <option>Under ₹50 L</option>
                                                <option>₹50 L – ₹1 Cr</option>
                                                <option>₹1 Cr – ₹2 Cr</option>
                                                <option>₹2 Cr – ₹3 Cr</option>
                                                <option>Above ₹3 Cr</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{fontFamily:T.sans,fontSize:10.5,fontWeight:700,color:T.muted,letterSpacing:'0.07em',textTransform:'uppercase' as const,display:'block',marginBottom:6}}>Timeline</label>
                                            <select value={enquiryTimeline} onChange={e => setEnquiryTimeline(e.target.value)}
                                                style={{width:'100%',padding:'11px 14px',borderRadius:10,border:`1px solid ${T.line}`,background:'#fff',fontFamily:T.sans,fontSize:13,color:enquiryTimeline?T.ink:T.muted,outline:'none',cursor:'pointer',appearance:'none' as const,boxSizing:'border-box' as const}}>
                                                <option value="">When to buy?</option>
                                                <option>Immediately</option>
                                                <option>Within 3 months</option>
                                                <option>3 – 6 months</option>
                                                <option>6 – 12 months</option>
                                                <option>Just exploring</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label style={{fontFamily:T.sans,fontSize:10.5,fontWeight:700,color:T.muted,letterSpacing:'0.07em',textTransform:'uppercase' as const,display:'block',marginBottom:6}}>Additional Requirements</label>
                                        <textarea value={enquiryMessage} onChange={e => setEnquiryMessage(e.target.value)}
                                            rows={3} placeholder="e.g. East facing, corner unit, near school, loan assistance needed…"
                                            style={{width:'100%',padding:'11px 14px',borderRadius:10,border:`1px solid ${T.line}`,background:'#fff',fontFamily:T.sans,fontSize:13,color:T.ink,outline:'none',resize:'none' as const,lineHeight:1.6,boxSizing:'border-box' as const}}/>
                                    </div>

                                    {/* Actions */}
                                    <div style={{display:'flex',gap:10,marginTop:4}}>
                                        <button type="button"
                                            onClick={() => {
                                                const parts = [
                                                    `Hi, I'm interested in ${project.name}${project.city ? ` in ${project.city}` : ''}.`,
                                                    enquiryBhk     && `Looking for: ${enquiryBhk}`,
                                                    enquiryBudget  && `Budget: ${enquiryBudget}`,
                                                    enquiryTimeline && `Timeline: ${enquiryTimeline}`,
                                                    enquiryMessage && `Requirements: ${enquiryMessage}`,
                                                    enquiryName    && `Name: ${enquiryName}`,
                                                    enquiryPhone   && `Phone: ${enquiryPhone}`,
                                                ].filter(Boolean).join('\n');
                                                window.open(`https://wa.me/?text=${encodeURIComponent(parts)}`, '_blank');
                                                setEnquirySent(true);
                                            }}
                                            style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'13px 20px',background:'#25D366',color:'#fff',border:'none',borderRadius:12,cursor:'pointer',fontFamily:T.sans,fontWeight:800,fontSize:13.5}}>
                                            <MessageCircle size={15}/> Send via WhatsApp
                                        </button>
                                        <button type="button"
                                            onClick={() => navigate('/customer/meeting', {state:{projectId:project.id,builderId:project.builderId,projectName:project.name,city:project.city,bhk:enquiryBhk,message:enquiryMessage}})}
                                            style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'13px 18px',background:T.ink,color:'#fff',border:'none',borderRadius:12,cursor:'pointer',fontFamily:T.sans,fontWeight:700,fontSize:13}}>
                                            <Calendar size={15}/> Book Visit
                                        </button>
                                    </div>
                                    <p style={{fontFamily:T.sans,fontSize:11,color:T.muted,textAlign:'center' as const,margin:0}}>
                                        Your details are kept private and never shared with third parties.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </AnimateIn>
                </section>

                </div>{/* end content zoom wrapper */}

            </div>{/* end zoom div */}
            </div>{/* end overflow clip wrapper */}
        </Wrapper>
    );
};

export default CustomerProjectDetail;
