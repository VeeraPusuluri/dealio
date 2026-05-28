import {useEffect, useState, useRef, useMemo} from 'react';
import {useParams, useNavigate, useLocation} from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {builderApi, customerApi} from '@/lib/api';
import type * as LeafletType from 'leaflet';
import {
    Building2, MapPin, Calendar, CheckCircle2,
    Loader2, ExternalLink, Shield, Star, Clock,
    FileText, Download, Play, Navigation, Globe,
    School, Hospital, ShoppingBag, Trees, ShoppingCart, Train,
    Waves, Activity, Zap, Droplets, Bell, Coffee, Wifi, Trophy,
    Sparkles, BookOpen, Heart, Flame, Users, Bookmark, Share2,
    ChevronDown, ChevronLeft, ChevronRight, Info, Home, Newspaper,
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
    mono: '"Geist Mono", ui-monospace, monospace',
    gold: '#C9A86C',
    goldLight: '#E8D5A3',
};

// ── Types ─────────────────────────────────────────────────────────────────────
type LeafletModule = typeof LeafletType;

interface Coords {
    lat: number;
    lng: number;
}

interface NearbyPlace {
    id: string;
    name: string;
    category: 'hospital' | 'school' | 'transit' | 'mall' | 'park' | 'supermarket';
    lat: number;
    lng: number;
    distanceKm: number;
}

interface LocAdv {
    category: string;
    name: string;
    distanceKm: string;
    driveMinutes: string;
}

interface PayPlan {
    name: string;
    description: string;
}

interface Specs {
    structure?: string;
    flooring?: string;
    doors?: string;
    windows?: string;
    electrical?: string;
    plumbing?: string;
    kitchen?: string;
    bathrooms?: string;
    painting?: string;
}

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
    // Rich detail fields
    landArea?: string | null;
    buildingPermitNumber?: string | null;
    clubhouseAreaSqft?: number | null;
    specifications?: Specs | null;
    paymentPlans?: PayPlan[] | null;
    locationAdvantages?: LocAdv[] | null;
    builderAbout?: string | null;
    builderYearEstablished?: number | null;
    builderDeliveredProjects?: number | null;
    builderWebsite?: string | null;
    builderContactPhone?: string | null;
    builderContactEmail?: string | null;
}

interface ProjectDocument {
    id: number;
    docType: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
}

// ── Nearby category metadata ──────────────────────────────────────────────────
const NEARBY_CAT: Record<NearbyPlace['category'], { label: string; hex: string; letter: string }> = {
    hospital: {label: 'Hospitals', hex: '#DC2626', letter: 'H'},
    school: {label: 'Schools', hex: '#2563EB', letter: 'S'},
    transit: {label: 'Metro', hex: '#7C3AED', letter: 'M'},
    mall: {label: 'Malls', hex: '#9333EA', letter: 'G'},
    park: {label: 'Parks', hex: '#059669', letter: 'P'},
    supermarket: {label: 'Markets', hex: '#D97706', letter: 'G'},
};

function getCatIcon(cat: NearbyPlace['category'], size = 12) {
    switch (cat) {
        case 'hospital':
            return <Hospital size={size}/>;
        case 'school':
            return <School size={size}/>;
        case 'transit':
            return <Train size={size}/>;
        case 'mall':
            return <ShoppingBag size={size}/>;
        case 'park':
            return <Trees size={size}/>;
        case 'supermarket':
            return <ShoppingCart size={size}/>;
    }
}

// ── Amenity icon helper ───────────────────────────────────────────────────────
function getAmenityMeta(name: string): { node: JSX.Element } {
    const n = name.toLowerCase();
    if (n.includes('pool') || n.includes('swim')) return {node: <Waves size={18}/>};
    if (n.includes('gym') || n.includes('fitness')) return {node: <Activity size={18}/>};
    if (n.includes('club')) return {node: <Building2 size={18}/>};
    if (n.includes('garden') || n.includes('lawn')) return {node: <Trees size={18}/>};
    if (n.includes('terrace') || n.includes('rooftop')) return {node: <Globe size={18}/>};
    if (n.includes('park') && !n.includes('parking')) return {node: <Trees size={18}/>};
    if (n.includes('security') || n.includes('cctv')) return {node: <Shield size={18}/>};
    if (n.includes('ev') || n.includes('charging')) return {node: <Zap size={18}/>};
    if (n.includes('parking')) return {node: <Navigation size={18}/>};
    if (n.includes('smart') || n.includes('home tech')) return {node: <Home size={18}/>};
    if (n.includes('power') || n.includes('backup')) return {node: <Zap size={18}/>};
    if (n.includes('water') || n.includes('ro')) return {node: <Droplets size={18}/>};
    if (n.includes('lift') || n.includes('elevator')) return {node: <Building2 size={18}/>};
    if (n.includes('tennis') || n.includes('sport')) return {node: <Trophy size={18}/>};
    if (n.includes('children') || n.includes('kids')) return {node: <Heart size={18}/>};
    if (n.includes('library')) return {node: <BookOpen size={18}/>};
    if (n.includes('spa') || n.includes('wellness')) return {node: <Sparkles size={18}/>};
    if (n.includes('jogging') || n.includes('track')) return {node: <Activity size={18}/>};
    if (n.includes('wifi') || n.includes('internet')) return {node: <Wifi size={18}/>};
    if (n.includes('concierge') || n.includes('lobby')) return {node: <Bell size={18}/>};
    if (n.includes('café') || n.includes('cafe') || n.includes('coffee')) return {node: <Coffee size={18}/>};
    if (n.includes('gas') || n.includes('png')) return {node: <Flame size={18}/>};
    if (n.includes('staff') || n.includes('maintenance')) return {node: <Users size={18}/>};
    return {node: <CheckCircle2 size={18}/>};
}

// ── Leaflet pin factories ─────────────────────────────────────────────────────
function makeNearbyPin(L: LeafletModule, color: string, name: string, distKm: number): LeafletType.DivIcon {
    const label = name.length > 20 ? name.slice(0, 18) + '…' : name;
    return L.divIcon({
        html: `<div style="display:inline-flex;align-items:center;gap:5px;background:white;border-radius:20px;padding:4px 10px 4px 7px;box-shadow:0 2px 10px rgba(0,0,0,0.18);white-space:nowrap;border:1px solid rgba(0,0,0,0.06);pointer-events:auto;">
      <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;display:block;box-shadow:0 0 0 2.5px ${color}28;"></span>
      <span style="font-size:11.5px;font-weight:600;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.2;">${label}</span>
      <span style="font-size:10px;color:#9ca3af;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.2;">${distKm.toFixed(1)} km</span>
    </div>`,
        iconAnchor: [8, 13],
        popupAnchor: [80, -10],
        className: '',
    });
}

function makeProjectPin(L: LeafletModule): LeafletType.DivIcon {
    return L.divIcon({
        html: `<div style="width:48px;height:48px;background:#0F172A;border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(0,0,0,0.42),0 2px 6px rgba(0,0,0,0.22);">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2"  y="2"  width="10" height="10" rx="2.5" fill="white"/>
        <rect x="14" y="2"  width="10" height="10" rx="2.5" fill="white"/>
        <rect x="2"  y="14" width="10" height="10" rx="2.5" fill="white"/>
        <rect x="14" y="14" width="10" height="10" rx="2.5" fill="white"/>
      </svg>
    </div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -30],
        className: '',
    });
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
    const h = Math.sin(dLat / 2) ** 2 +
        Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
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
            type: string; id: number;
            lat?: number; lon?: number;
            center?: { lat: number; lon: number };
            tags?: Record<string, string>;
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

// ── Neighbourhood news ────────────────────────────────────────────────────────
interface NewsItem {
    title: string;
    source: string;
    date: string;
    url: string;
    description?: string;
}

async function fetchNeighbourhoodNews(locality: string, city: string, signal: AbortSignal): Promise<NewsItem[]> {
    const area = locality || city;
    if (!area) return [];
    const q = encodeURIComponent(`"${area}" real estate property`);
    const rssUrl = encodeURIComponent(`https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`);
    const res = await fetch(
        `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}&count=6`,
        {signal},
    );
    if (!res.ok) throw new Error('news fetch failed');
    const data = await res.json() as {
        status: string;
        items?: Array<{ title: string; author: string; pubDate: string; link: string; description?: string }>;
    };
    if (data.status !== 'ok' || !data.items?.length) throw new Error('no items');
    return data.items.map(item => ({
        title: item.title.replace(/<[^>]+>/g, '').replace(/\s*-\s*[^-]*$/, '').trim(),
        source: item.author || 'News',
        date: new Date(item.pubDate).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'}),
        url: item.link,
        description: item.description
            ? item.description.replace(/<[^>]+>/g, '').trim().slice(0, 130)
            : undefined,
    }));
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

interface TourLink {
    label: string;
    url: string;
}

function parseTours(videoUrl: string | null): TourLink[] {
    if (!videoUrl) return [];
    try {
        const parsed = JSON.parse(videoUrl);
        if (Array.isArray(parsed)) return parsed as TourLink[];
    } catch { /* plain URL */
    }
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
    } catch {
        return null;
    }
}

// ── Unit matrix ───────────────────────────────────────────────────────────────
type UnitStatus = 'available' | 'booked' | 'sold' | 'hold';

interface MatrixUnit {
    id: string;
    floor: number;
    unit: number;
    bhk: string;
    status: UnitStatus;
}

interface TowerData {
    tower: string;
    floors: { floor: number; units: MatrixUnit[] }[];
}

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
        if (s > 0) {
            statuses.push('sold');
            s--;
        } else if (b > 0) {
            statuses.push('booked');
            b--;
        } else if (h > 0) {
            statuses.push('hold');
            h--;
        } else {
            statuses.push('available');
        }
    }
    const towers: TowerData[] = [];
    for (let t = 0; t < numTowers; t++) {
        const floorRows: TowerData['floors'] = [];
        for (let f = numFloors; f >= 1; f--) {
            const units: MatrixUnit[] = [];
            for (let u = 1; u <= perFloor; u++) {
                const idx = t * numFloors * perFloor + (numFloors - f) * perFloor + (u - 1);
                if (idx < total) {
                    units.push({
                        id: `${String.fromCharCode(65 + t)}-${f}0${u}`,
                        floor: f,
                        unit: u,
                        bhk: configs[(u - 1) % configs.length],
                        status: statuses[idx]
                    });
                }
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
            <text x="200" y="38" textAnchor="middle" fontFamily="Georgia, serif" fontSize="9" fill={T.aInk}
                  fontStyle="italic">
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
                        {x: 85, y: 116, l: 'MASTER SUITE', d: "16'×13'"},
                        {x: 210, y: 116, l: 'GREAT ROOM', d: "24'×16'"},
                        {x: 325, y: 116, l: 'STUDY', d: "12'×10'"},
                        {x: 70, y: 244, l: 'BED 2', d: "12'×11'"},
                        {x: 170, y: 244, l: 'BED 3', d: "11'×11'"},
                        {x: 265, y: 244, l: 'KITCHEN', d: "12'×9'"},
                        {x: 345, y: 244, l: 'UTIL', d: "8'×9'"},
                    ].map(r => (
                        <g key={r.l}>
                            <text x={r.x} y={r.y} textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="9"
                                  fill={T.ink2}>{r.l}</text>
                            <text x={r.x} y={r.y + 13} textAnchor="middle" fontFamily="system-ui,sans-serif"
                                  fontSize="8" fill={T.muted}>{r.d}</text>
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
                        {x: 100, y: 120, l: 'MASTER BED', d: "13'×12'"},
                        {x: 280, y: 120, l: 'LIVING', d: "18'×12'"},
                        {x: 70, y: 244, l: 'BED 2', d: "11'×12'"},
                        {x: 195, y: 244, l: 'BED 3', d: "10'×12'"},
                        {x: 325, y: 244, l: 'KITCHEN', d: "11'×8'"},
                    ].map(r => (
                        <g key={r.l}>
                            <text x={r.x} y={r.y} textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="9"
                                  fill={T.ink2}>{r.l}</text>
                            <text x={r.x} y={r.y + 13} textAnchor="middle" fontFamily="system-ui,sans-serif"
                                  fontSize="8" fill={T.muted}>{r.d}</text>
                        </g>
                    ))}
                </>
            ) : (
                <>
                    <line x1="200" y1="52" x2="200" y2="300" stroke={T.ink} strokeWidth="1.2"/>
                    <line x1="20" y1="190" x2="200" y2="190" stroke={T.ink} strokeWidth="1.2"/>
                    {[
                        {x: 110, y: 120, l: 'MASTER BED', d: "14'×13'"},
                        {x: 300, y: 170, l: 'LIVING', d: "18'×14'"},
                        {x: 110, y: 248, l: 'BED 2', d: "12'×11'"},
                    ].map(r => (
                        <g key={r.l}>
                            <text x={r.x} y={r.y} textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="9"
                                  fill={T.ink2}>{r.l}</text>
                            <text x={r.x} y={r.y + 13} textAnchor="middle" fontFamily="system-ui,sans-serif"
                                  fontSize="8" fill={T.muted}>{r.d}</text>
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

// ── Per-configuration area specs (indicative; real data shown if builder uploads floor plans) ──
function getConfigSpecs(bhk: string): {
    carpet: string;
    superBuiltUp: string;
    rooms: { name: string; size: string }[]
} {
    if (bhk.includes('4') || bhk.includes('5')) return {
        carpet: '1,950 – 2,200', superBuiltUp: '2,450 – 2,750',
        rooms: [
            {name: 'Master Bedroom', size: "16' × 14'"},
            {name: 'Bedroom 2', size: "13' × 12'"},
            {name: 'Bedroom 3', size: "12' × 11'"},
            {name: 'Bedroom 4', size: "11' × 10'"},
            {name: 'Living / Dining', size: "22' × 16'"},
            {name: 'Kitchen', size: "13' × 10'"},
            {name: 'Balcony', size: "10' × 5'"},
            {name: 'Utility', size: "7' × 5'"},
        ],
    };
    if (bhk.includes('3')) return {
        carpet: '1,350 – 1,580', superBuiltUp: '1,700 – 1,980',
        rooms: [
            {name: 'Master Bedroom', size: "14' × 13'"},
            {name: 'Bedroom 2', size: "12' × 11'"},
            {name: 'Bedroom 3', size: "11' × 10'"},
            {name: 'Living / Dining', size: "18' × 14'"},
            {name: 'Kitchen', size: "11' × 9'"},
            {name: 'Balcony', size: "9' × 5'"},
        ],
    };
    if (bhk.includes('2')) return {
        carpet: '970 – 1,150', superBuiltUp: '1,220 – 1,450',
        rooms: [
            {name: 'Master Bedroom', size: "13' × 12'"},
            {name: 'Bedroom 2', size: "11' × 11'"},
            {name: 'Living / Dining', size: "16' × 12'"},
            {name: 'Kitchen', size: "10' × 8'"},
            {name: 'Balcony', size: "8' × 5'"},
        ],
    };
    if (bhk.includes('1')) return {
        carpet: '550 – 680', superBuiltUp: '700 – 870',
        rooms: [
            {name: 'Bedroom', size: "13' × 12'"},
            {name: 'Living / Dining', size: "14' × 11'"},
            {name: 'Kitchen', size: "9' × 8'"},
            {name: 'Balcony', size: "7' × 5'"},
        ],
    };
    return {
        carpet: '380 – 480', superBuiltUp: '490 – 620',
        rooms: [
            {name: 'Studio Room', size: "16' × 14'"},
            {name: 'Kitchen', size: "9' × 7'"},
            {name: 'Balcony', size: "6' × 4'"},
        ],
    };
}

// ── Hero headline generator ───────────────────────────────────────────────────
function buildHeroText(p: ProjectDetail) {
    const verbMap: Record<string, string> = {
        PRE_LAUNCH: 'begins', NEW_LAUNCH: 'rises', LAUNCHED: 'arrives',
        UNDER_CONSTRUCTION: 'rises', ACTIVE: 'rises',
        CLOSING_SOON: 'remains', READY_TO_MOVE: 'awaits',
    };
    const verb = verbMap[p.status] ?? 'rises';
    const city = p.city || p.locality || 'the city';

    // Subtitle: use description if long enough, else build from data
    const sub = (p.description && p.description.trim().length > 60)
        ? (p.description.length > 210
            ? p.description.slice(0, 210).replace(/\s\S+$/, '') + '…'
            : p.description.trim())
        : (() => {
            const loc = [p.locality, p.city].filter(Boolean).join(', ') || city;
            const units = p.totalUnits ? `${p.totalUnits}` : '';
            const configs = p.configurations?.join(' & ') ?? '';
            const floors = p.floorsPerTower ? `, rising ${p.floorsPerTower} floors` : '';
            const towers = p.towers ? ` across ${p.towers} tower${p.towers > 1 ? 's' : ''}` : '';
            return `${p.name} stands where ${loc} meets exceptional living — ${units ? units + ' ' : ''}${configs ? configs + ' ' : ''}homes shaped for the way you live${towers}${floors}.`;
        })();

    return {verb, city, sub};
}

// ── FAQ data ──────────────────────────────────────────────────────────────────
function buildFaq(p: ProjectDetail) {
    return [
        {
            q: `What configurations are available in ${p.name}?`,
            a: p.configurations?.length
                ? `${p.name} offers ${p.configurations.join(', ')} configurations${p.totalUnits ? ` across ${p.totalUnits} homes` : ''}.`
                : 'Please contact us for configuration details.',
        },
        {
            q: 'When is the expected possession date?',
            a: p.possessionDate
                ? `The expected possession date is ${new Date(p.possessionDate).toLocaleDateString('en-IN', {
                    month: 'long',
                    year: 'numeric'
                })}. Construction is progressing as per RERA timelines.`
                : 'Possession timelines are available on request. Please schedule a site visit for the latest update.',
        },
        {
            q: 'What is the RERA registration status?',
            a: p.reraNumber
                ? `${p.name} is registered under RERA with number ${p.reraNumber}${p.reraState ? ` (${p.reraState})` : ''}. You can verify this on the official RERA portal.`
                : 'RERA registration details are available on request.',
        },
        {
            q: 'What are the payment plan options?',
            a: `Standard payment plans include 20:80 (20% on booking, 80% on possession), construction-linked plans, and bank-assisted pre-EMI plans. Contact our team for a personalised payment structure.`,
        },
        {
            q: `What amenities are included?`,
            a: p.amenities?.length
                ? `${p.name} features ${p.amenities.slice(0, 5).join(', ')}${p.amenities.length > 5 ? ` and ${p.amenities.length - 5} more lifestyle amenities` : ''}.`
                : 'A full list of amenities is available on request.',
        },
        {
            q: 'Can NRIs invest in this project?',
            a: 'Yes, NRI investments are fully compliant with FEMA regulations. We provide dedicated NRI desk support for documentation, home loans, and repatriation.',
        },
    ];
}

// ── Component ─────────────────────────────────────────────────────────────────
const CustomerProjectDetail = () => {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [project, setProject] = useState<ProjectDetail | null>(location.state?.project || null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [documents, setDocuments] = useState<ProjectDocument[]>([]);
    const [carouselIdx, setCarouselIdx] = useState(0);
    const [activeTour, setActiveTour] = useState(0);
    const [shortlisted, setShortlisted] = useState(false);
    const [activeConfig, setActiveConfig] = useState(0);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [activeCat, setActiveCat] = useState<NearbyPlace['category'] | 'all'>('all');
    const [emiLoanL, setEmiLoanL] = useState(114);   // in lakhs
    const [emiTenure, setEmiTenure] = useState(20);
    const [emiRate, setEmiRate] = useState(85);    // tenths of %, 85 = 8.5%
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    // Leaflet
    const leafletRef = useRef<LeafletModule | null>(null);
    const [leafletReady, setLeafletReady] = useState(false);
    const leafletDivRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<LeafletType.Map | null>(null);
    const attractionLayerRef = useRef<LeafletType.LayerGroup | null>(null);
    const [nearby, setNearby] = useState<NearbyPlace[]>([]);
    const [nearbyLoading, setNearbyLoading] = useState(false);
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [newsLoading, setNewsLoading] = useState(false);
    const [newsFetched, setNewsFetched] = useState(false);

    const mapCoords = useMemo(
        () => project?.googleMapsLink ? extractCoords(project.googleMapsLink) : null,
        [project?.googleMapsLink], // eslint-disable-line react-hooks/exhaustive-deps
    );

    const nearbyInRange = useMemo(() => nearby.filter(p => p.distanceKm <= 5), [nearby]);

    const catCounts = useMemo(() => {
        const m: Partial<Record<NearbyPlace['category'], number>> = {};
        nearbyInRange.forEach(p => {
            m[p.category] = (m[p.category] ?? 0) + 1;
        });
        return m;
    }, [nearbyInRange]);

    const visibleNearby = useMemo(
        () => activeCat === 'all' ? nearbyInRange : nearbyInRange.filter(p => p.category === activeCat),
        [nearbyInRange, activeCat],
    );

    // Load project
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
                        .catch(() => {
                        });
                }
            })
            .catch(() => {
                if (!location.state?.project) setNotFound(true);
            })
            .finally(() => setLoading(false));
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Load shortlist state
    useEffect(() => {
        if (!project) return;
        try {
            const sl = JSON.parse(localStorage.getItem('dealio_customer_shortlist') || '[]') as number[];
            setShortlisted(sl.includes(project.id));
        } catch { /* noop */
        }
    }, [project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Init EMI loan from project price
    useEffect(() => {
        if (!project?.priceMin) return;
        setEmiLoanL(Math.min(300, Math.max(20, Math.round(project.priceMin * 0.8 / 100000))));
    }, [project?.priceMin]); // eslint-disable-line react-hooks/exhaustive-deps

    // Leaflet dynamic import
    useEffect(() => {
        let cancelled = false;
        Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css' as string)])
            .then(([mod]) => {
                if (!cancelled) {
                    leafletRef.current = mod;
                    setLeafletReady(true);
                }
            })
            .catch(() => {
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Map init
    useEffect(() => {
        const L = leafletRef.current;
        const div = leafletDivRef.current;
        if (!L || !mapCoords || !div) return;
        let map: LeafletType.Map;
        try {
            map = L.map(div, {
                center: [mapCoords.lat, mapCoords.lng],
                zoom: 15,
                zoomControl: true,
                attributionControl: true
            });
        } catch {
            return;
        }
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20,
        }).addTo(map);
        L.marker([mapCoords.lat, mapCoords.lng], {icon: makeProjectPin(L), zIndexOffset: 1000})
            .bindPopup(`<b style="color:#3C5A45">${project?.name || 'Project Location'}</b>`)
            .addTo(map);
        attractionLayerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        return () => {
            map.remove();
            mapRef.current = null;
            attractionLayerRef.current = null;
        };
    }, [leafletReady, mapCoords?.lat, mapCoords?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

    // Update attraction markers
    useEffect(() => {
        const L = leafletRef.current;
        const layer = attractionLayerRef.current;
        if (!L || !layer) return;
        layer.clearLayers();
        const counts: Partial<Record<NearbyPlace['category'], number>> = {};
        nearby.forEach(p => {
            if (p.distanceKm > 5) return;
            const c = counts[p.category] ?? 0;
            if (c >= 5) return;
            counts[p.category] = c + 1;
            const {hex} = NEARBY_CAT[p.category];
            L.marker([p.lat, p.lng], {icon: makeNearbyPin(L, hex, p.name, p.distanceKm)})
                .bindPopup(`<b>${p.name}</b><br/><span style="color:#6b7280;font-size:11px">${NEARBY_CAT[p.category].label} · ${p.distanceKm.toFixed(1)} km</span>`)
                .addTo(layer);
        });
    }, [nearby]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch nearby places
    useEffect(() => {
        setNearby([]);
        if (!mapCoords) return;
        const ctrl = new AbortController();
        const timer = setTimeout(async () => {
            setNearbyLoading(true);
            try {
                setNearby(await fetchNearbyPlaces(mapCoords, ctrl.signal));
            } catch { /* network/timeout */
            } finally {
                setNearbyLoading(false);
            }
        }, 900);
        return () => {
            ctrl.abort();
            clearTimeout(timer);
        };
    }, [mapCoords?.lat, mapCoords?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch neighbourhood news
    useEffect(() => {
        if (!project || newsFetched) return;
        const area = project.locality || project.city;
        if (!area) return;
        const ctrl = new AbortController();
        const timer = setTimeout(async () => {
            setNewsLoading(true);
            try {
                const items = await fetchNeighbourhoodNews(area, project.city || '', ctrl.signal);
                setNewsItems(items);
            } catch { /* silent — section stays hidden */
            } finally {
                setNewsLoading(false);
                setNewsFetched(true);
            }
        }, 1500);
        return () => {
            ctrl.abort();
            clearTimeout(timer);
        };
    }, [project?.locality, project?.city]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleShortlist = () => {
        if (!project) return;
        try {
            const sl = JSON.parse(localStorage.getItem('dealio_customer_shortlist') || '[]') as number[];
            const next = shortlisted ? sl.filter(x => x !== project.id) : [...sl, project.id];
            localStorage.setItem('dealio_customer_shortlist', JSON.stringify(next));
            setShortlisted(!shortlisted);
        } catch { /* noop */
        }
    };

    // ── Loading / not found states ───────────────────────────────────────────
    if (loading && !project) return (
        <DashboardLayout>
            <div className="flex justify-center py-24">
                <Loader2 className="animate-spin" size={32} style={{color: T.aInk}}/>
            </div>
        </DashboardLayout>
    );

    if (notFound || !project) return (
        <DashboardLayout>
            <div className="text-center py-24 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                     style={{background: T.bg2}}>
                    <Building2 size={28} style={{color: T.muted}}/>
                </div>
                <h3 style={{
                    fontFamily: T.serif,
                    fontSize: 28,
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                    color: T.ink,
                    margin: '0 0 8px'
                }}>
                    Project not found.
                </h3>
                <p style={{color: T.muted, fontSize: 14, marginBottom: 28}}>
                    This project may have been removed or is not yet published.
                </p>
                <button onClick={() => navigate('/customer')}
                        style={{
                            background: T.aInk,
                            color: '#fff',
                            border: 'none',
                            padding: '12px 28px',
                            borderRadius: 12,
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 600
                        }}>
                    Back to Projects
                </button>
            </div>
        </DashboardLayout>
    );

    // ── Derived data ─────────────────────────────────────────────────────────
    const total = project.totalUnits ?? 0;
    const sold = Math.min(project.soldUnits ?? 0, total);
    const booked = Math.min(project.bookedUnits ?? 0, Math.max(0, total - sold));
    const available = project.availableUnits != null
        ? Math.min(project.availableUnits, Math.max(0, total - sold - booked))
        : Math.max(0, total - sold - booked);
    const availPct = total > 0 ? Math.round((available / total) * 100) : 0;
    const bookedPct = total > 0 ? Math.round((booked / total) * 100) : 0;
    const soldPct = total > 0 ? Math.round((sold / total) * 100) : 0;

    const isImageUrl = (url: string) => /\.(jpe?g|png|webp|gif|bmp|svg)(\?|$)/i.test(url);
    const docImages = documents.filter(d => isImageUrl(d.fileUrl) || d.docType?.toLowerCase().includes('image') || d.docType?.toLowerCase().includes('photo'));
    const heroImg = project.imageUrl ? [{
        id: 0,
        docType: 'image',
        fileName: project.name,
        fileUrl: project.imageUrl,
        uploadedAt: ''
    }] : [];
    const imagesDocs = [...heroImg, ...docImages.filter(d => d.fileUrl !== project.imageUrl)];
    const otherDocs = documents.filter(d => !docImages.includes(d));
    const floorPlanDocs = documents.filter(d =>
        (d.docType?.toLowerCase().includes('floor') || d.docType?.toLowerCase().includes('layout')) &&
        isImageUrl(d.fileUrl),
    );
    const tours = parseTours(project.videoUrl);
    const matrix = total > 0 ? buildUnitMatrix(project) : [];
    const mapEmbedUrl = project.googleMapsLink ? toMapEmbedUrl(project.googleMapsLink) : null;
    const hasLocation = !!(project.address || project.googleMapsLink || project.city || project.locality);

    const configs = project.configurations ?? [];
    const activeConfigName = configs[activeConfig] ?? '';
    const specs = getConfigSpecs(activeConfigName);
    const availableForConfig = matrix.flatMap(t =>
        t.floors.flatMap(f =>
            f.units
                .filter(u => u.status === 'available' && (activeConfigName === '' || u.bhk === activeConfigName))
                .map(u => ({...u, tower: t.tower}))
        )
    );

    const emiMonthly = project.priceMin ? Math.round(project.priceMin * 0.00873) : null;

    // EMI calculator derived values
    const emiLoanAmt = emiLoanL * 100_000;
    const emiMonthlyCalc = (() => {
        const P = emiLoanAmt;
        const r = (emiRate / 10) / 100 / 12;
        const n = emiTenure * 12;
        if (r === 0 || P === 0) return 0;
        return Math.round(P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
    })();
    const totalInterest = Math.max(0, emiMonthlyCalc * emiTenure * 12 - emiLoanAmt);

    const highlights = [
        configs.length > 0 && {
            key: 'Configurations',
            val: configs.join(' & '),
            desc: `${total || 'Select'} curated homes across ${project.towers || 'multiple'} towers.`,
        },
        project.possessionDate && {
            key: 'Possession',
            val: project.possessionDate.slice(0, 7).replace('-', ' · '),
            desc: `On track — possession as per RERA-filed timelines.`,
        },
        project.pricePerSqftMin && {
            key: '₹ / sqft',
            val: `${Math.round(project.pricePerSqftMin / 1000)}k`,
            desc: `Starting at ₹${project.pricePerSqftMin.toLocaleString('en-IN')} with floor-rise advantage.`,
        },
    ].filter(Boolean) as { key: string; val: string; desc: string }[];

    const faq = buildFaq(project);
    const heroText = buildHeroText(project);

    const statusLbl = STATUS_LABELS[project.status] || project.status;

    // ── Style helpers ──────────────────────────────────────────────────────────
    const sk = {
        fontFamily: T.mono,
        fontSize: '10.5px',
        letterSpacing: '0.16em',
        color: T.muted,
        textTransform: 'uppercase' as const,
        fontWeight: 500
    };
    const secH2 = {
        margin: '8px 0 0',
        fontFamily: T.serif,
        fontSize: 'clamp(32px, 4vw, 48px)',
        fontWeight: 300,
        lineHeight: 1,
        letterSpacing: '-0.025em'
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <DashboardLayout>
            <div style={{background: T.bg, minHeight: '100vh'}}>

                {/* ══ HERO ═══════════════════════════════════════════════════════════ */}
                <section style={{
                    position: 'relative',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    overflow: 'hidden'
                }}>

                    {/* Background */}
                    <div style={{position: 'absolute', inset: 0}}>
                        {imagesDocs[0] ? (
                            <img src={imagesDocs[carouselIdx] ? imagesDocs[carouselIdx].fileUrl : imagesDocs[0].fileUrl}
                                 alt={project.name}
                                 style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}/>
                        ) : (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                background: `linear-gradient(155deg, ${T.ink} 0%, #122840 50%, #1E3A5F 100%)`
                            }}/>
                        )}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to bottom, rgba(11,25,41,0.3) 0%, rgba(11,25,41,0.5) 40%, rgba(11,25,41,0.94) 82%, rgba(11,25,41,1) 100%)'
                        }}/>
                    </div>

                    {/* Top nav */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        padding: '24px 40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        zIndex: 10
                    }}>
                        <button onClick={() => navigate('/customer')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: 'rgba(255,255,255,0.08)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    color: 'rgba(255,255,255,0.85)',
                                    padding: '9px 18px',
                                    borderRadius: 999,
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 500
                                }}>
                            <ChevronLeft size={14}/> All Projects
                        </button>
                        <div style={{display: 'flex', gap: 8}}>
                            {project.reraNumber && (
                                <span style={{
                                    fontFamily: T.mono,
                                    fontSize: 10,
                                    letterSpacing: '0.14em',
                                    color: T.accent,
                                    border: '1px solid rgba(201,168,108,0.3)',
                                    padding: '6px 14px',
                                    borderRadius: 999,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5
                                }}>
                  <Shield size={10}/> RERA
                </span>
                            )}
                            <button onClick={toggleShortlist}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        background: 'rgba(255,255,255,0.08)',
                                        backdropFilter: 'blur(12px)',
                                        border: `1px solid ${shortlisted ? T.accent : 'rgba(255,255,255,0.12)'}`,
                                        color: shortlisted ? T.accent : 'rgba(255,255,255,0.8)',
                                        padding: '9px 18px',
                                        borderRadius: 999,
                                        cursor: 'pointer',
                                        fontSize: 13,
                                        fontWeight: 500
                                    }}>
                                <Bookmark size={14}
                                          fill={shortlisted ? T.accent : 'none'}/> {shortlisted ? 'Saved' : 'Save'}
                            </button>
                            <button onClick={() => navigator.share?.({
                                title: project.name,
                                url: window.location.href
                            }).catch(() => {
                            })}
                                    style={{
                                        background: 'rgba(255,255,255,0.08)',
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        color: 'rgba(255,255,255,0.75)',
                                        padding: '9px 14px',
                                        borderRadius: 999,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                <Share2 size={14}/>
                            </button>
                        </div>
                    </div>

                    {/* Hero content */}
                    <div style={{
                        position: 'relative',
                        zIndex: 5,
                        padding: '0 40px 44px',
                        maxWidth: 1280,
                        width: '100%'
                    }}>
                        <div style={{
                            display: 'flex',
                            gap: 10,
                            alignItems: 'center',
                            marginBottom: 18,
                            flexWrap: 'wrap' as const
                        }}>
                            {project.builderName && (
                                <span style={{
                                    fontFamily: T.mono,
                                    fontSize: 10.5,
                                    letterSpacing: '0.2em',
                                    color: T.accent,
                                    textTransform: 'uppercase' as const
                                }}>
                  {project.builderName}
                </span>
                            )}
                            {project.featured && (
                                <span style={{
                                    fontFamily: T.mono,
                                    fontSize: 10,
                                    letterSpacing: '0.1em',
                                    color: T.accent,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4
                                }}>
                  <Star size={9} fill="currentColor"/> FEATURED
                </span>
                            )}
                            {project.closingSoon && (
                                <span style={{
                                    fontFamily: T.mono,
                                    fontSize: 10,
                                    letterSpacing: '0.1em',
                                    color: '#FCA5A5'
                                }}>CLOSING SOON</span>
                            )}
                        </div>

                        <h1 style={{
                            fontFamily: T.serif,
                            fontSize: 'clamp(52px, 9vw, 120px)',
                            fontWeight: 300,
                            lineHeight: 0.9,
                            letterSpacing: '-0.03em',
                            color: '#FFFFFF',
                            margin: '0 0 28px',
                            maxWidth: 1040
                        }}>
                            {project.name}
                        </h1>

                        <div
                            style={{display: 'flex', flexWrap: 'wrap' as const, gap: '8px 24px', alignItems: 'center'}}>
                            {(project.locality || project.city) && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    color: 'rgba(255,255,255,0.65)',
                                    fontSize: 14
                                }}>
                                    <MapPin size={13} style={{color: T.accent}}/>
                                    {[project.locality, project.city].filter(Boolean).join(', ')}
                                </div>
                            )}
                            {project.priceMin && (
                                <>
                                    <div style={{width: 1, height: 14, background: 'rgba(255,255,255,0.18)'}}/>
                                    <div style={{
                                        color: T.accent,
                                        fontFamily: T.serif,
                                        fontStyle: 'italic',
                                        fontSize: 22,
                                        fontWeight: 300,
                                        letterSpacing: '-0.01em'
                                    }}>
                                        {fmtPrice(project.priceMin)}
                                        {project.priceMax && project.priceMax !== project.priceMin && (
                                            <span style={{
                                                fontSize: 14,
                                                opacity: 0.5,
                                                fontFamily: 'system-ui',
                                                fontStyle: 'normal'
                                            }}> – {fmtPrice(project.priceMax)}</span>
                                        )}
                                    </div>
                                </>
                            )}
                            {statusLbl && (
                                <>
                                    <div style={{width: 1, height: 14, background: 'rgba(255,255,255,0.18)'}}/>
                                    <span style={{
                                        fontFamily: T.mono,
                                        fontSize: 10,
                                        letterSpacing: '0.1em',
                                        color: 'rgba(255,255,255,0.45)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        padding: '4px 12px',
                                        borderRadius: 999
                                    }}>
                    {statusLbl.toUpperCase()}
                  </span>
                                </>
                            )}
                            {configs.length > 0 && (
                                <>
                                    <div style={{width: 1, height: 14, background: 'rgba(255,255,255,0.18)'}}/>
                                    <span style={{
                                        color: 'rgba(255,255,255,0.55)',
                                        fontSize: 13
                                    }}>{configs.join(' · ')}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Thumbnail strip */}
                    {imagesDocs.length > 1 && (
                        <div style={{
                            position: 'relative',
                            zIndex: 5,
                            padding: '0 40px 28px',
                            display: 'flex',
                            gap: 8,
                            overflowX: 'auto',
                            scrollbarWidth: 'none' as const
                        }}>
                            {imagesDocs.slice(0, 7).map((img, i) => (
                                <div key={i} onClick={() => setCarouselIdx(i)}
                                     style={{
                                         flexShrink: 0,
                                         width: 110,
                                         height: 66,
                                         borderRadius: 8,
                                         overflow: 'hidden',
                                         cursor: 'pointer',
                                         border: `2px solid ${carouselIdx === i ? T.accent : 'rgba(255,255,255,0.08)'}`,
                                         opacity: carouselIdx === i ? 1 : 0.5,
                                         transition: 'all .15s ease'
                                     }}>
                                    <img src={img.fileUrl} alt=""
                                         style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
                                </div>
                            ))}
                            {imagesDocs.length > 7 && (
                                <div style={{
                                    flexShrink: 0,
                                    width: 110,
                                    height: 66,
                                    borderRadius: 8,
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'rgba(255,255,255,0.6)',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}>
                                    +{imagesDocs.length - 7}
                                </div>
                            )}
                            {tours.length > 0 && (
                                <div onClick={() => {
                                    const el = document.getElementById('virtual-tours');
                                    el?.scrollIntoView({behavior: 'smooth'});
                                }}
                                     style={{
                                         flexShrink: 0,
                                         width: 110,
                                         height: 66,
                                         borderRadius: 8,
                                         background: 'rgba(255,255,255,0.06)',
                                         border: `1px solid rgba(201,168,108,0.3)`,
                                         display: 'flex',
                                         flexDirection: 'column',
                                         alignItems: 'center',
                                         justifyContent: 'center',
                                         gap: 4,
                                         cursor: 'pointer'
                                     }}>
                                    <Play size={16} style={{color: T.accent}} fill={T.accent}/>
                                    <span style={{
                                        fontFamily: T.mono,
                                        fontSize: 9,
                                        letterSpacing: '0.1em',
                                        color: T.accent
                                    }}>TOUR</span>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* ══ STICKY BAR ════════════════════════════════════════════════════ */}
                {(project.priceMin || project.priceMax) && (
                    <div style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 30,
                        background: T.ink,
                        borderBottom: '1px solid rgba(201,168,108,0.15)'
                    }}>
                        <div style={{
                            maxWidth: 1280,
                            margin: '0 auto',
                            padding: '0 40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 20,
                            height: 60
                        }}>
                            <div style={{display: 'flex', alignItems: 'center', gap: 0}}>
                                <div style={{paddingRight: 24}}>
                                    <div style={{
                                        fontFamily: T.mono,
                                        fontSize: 9,
                                        letterSpacing: '0.18em',
                                        color: 'rgba(255,255,255,0.3)',
                                        textTransform: 'uppercase' as const
                                    }}>From
                                    </div>
                                    <div style={{
                                        fontFamily: T.serif,
                                        fontSize: 19,
                                        fontWeight: 300,
                                        color: '#fff',
                                        letterSpacing: '-0.01em',
                                        lineHeight: 1.1,
                                        marginTop: 1
                                    }}>
                                        {fmtPrice(project.priceMin)}
                                        {configs[0] && <span style={{
                                            fontFamily: 'system-ui',
                                            fontSize: 12,
                                            opacity: 0.35,
                                            marginLeft: 6
                                        }}>{configs[0]}</span>}
                                    </div>
                                </div>
                                {emiMonthly && (
                                    <div style={{
                                        borderLeft: '1px solid rgba(255,255,255,0.07)',
                                        paddingLeft: 24,
                                        fontSize: 11.5,
                                        color: 'rgba(255,255,255,0.35)'
                                    }}>
                                        EMI from <span style={{
                                        color: T.accent,
                                        fontWeight: 600
                                    }}>₹{emiMonthly.toLocaleString('en-IN')}</span>/mo
                                    </div>
                                )}
                                {(project.locality || project.city) && (
                                    <div style={{
                                        borderLeft: '1px solid rgba(255,255,255,0.07)',
                                        paddingLeft: 24,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        fontSize: 12,
                                        color: 'rgba(255,255,255,0.35)'
                                    }}>
                                        <MapPin size={10} style={{color: T.accent}}/>
                                        {[project.locality, project.city].filter(Boolean).join(', ')}
                                    </div>
                                )}
                            </div>
                            <div style={{display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0}}>
                                <button onClick={() => {
                                    const el = document.getElementById('faq-section');
                                    el?.scrollIntoView({behavior: 'smooth'});
                                }}
                                        style={{
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'transparent',
                                            color: 'rgba(255,255,255,0.55)',
                                            padding: '7px 16px',
                                            borderRadius: 7,
                                            cursor: 'pointer',
                                            fontSize: 12,
                                            fontWeight: 500
                                        }}>
                                    FAQs
                                </button>
                                <button
                                    onClick={() => navigate('/customer/meeting', {
                                        state: {
                                            projectId: project.id,
                                            builderId: project.builderId,
                                            builderName: project.builderName,
                                            projectName: project.name,
                                            city: project.city
                                        }
                                    })}
                                    style={{
                                        background: T.accent,
                                        color: T.ink,
                                        border: 'none',
                                        padding: '8px 22px',
                                        borderRadius: 7,
                                        cursor: 'pointer',
                                        fontSize: 12.5,
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6
                                    }}>
                                    <Calendar size={13}/> Book a Visit
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ 01 · OVERVIEW ═════════════════════════════════════════════════ */}
                {highlights.length > 0 && (
                    <section style={{maxWidth: 1280, margin: '0 auto', padding: '96px 40px 0'}}>
                        <div style={{display: 'flex', gap: 12, alignItems: 'center', marginBottom: 44}}>
                            <span style={{
                                fontFamily: T.mono,
                                fontSize: 10,
                                letterSpacing: '0.22em',
                                color: T.accent,
                                fontWeight: 700
                            }}>01</span>
                            <div style={{
                                height: 1,
                                background: `linear-gradient(to right, ${T.accent}, transparent)`,
                                width: 64
                            }}/>
                            <span style={sk}>Overview</span>
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: `1.2fr ${highlights.map(() => '1fr').join(' ')}`,
                            gap: 36,
                            alignItems: 'start'
                        }}>
                            <div>
                                <h2 style={{
                                    fontFamily: T.serif,
                                    fontSize: 'clamp(30px, 4vw, 50px)',
                                    fontWeight: 300,
                                    lineHeight: 1.02,
                                    letterSpacing: '-0.025em',
                                    color: T.ink,
                                    margin: 0
                                }}>
                                    Why you'll be{' '}
                                    <em style={{fontStyle: 'italic', color: T.aInk}}>glad you're here</em>.
                                </h2>
                                {project.description && (
                                    <p style={{
                                        marginTop: 18,
                                        fontSize: 14,
                                        color: T.muted,
                                        lineHeight: 1.7,
                                        maxWidth: 320
                                    }}>
                                        {project.description.slice(0, 160)}{project.description.length > 160 ? '…' : ''}
                                    </p>
                                )}
                            </div>
                            {highlights.map(h => (
                                <div key={h.key} style={{borderTop: `2px solid ${T.ink}`, paddingTop: 18}}>
                                    <div style={sk}>{h.key}</div>
                                    <div style={{
                                        fontFamily: T.serif,
                                        fontSize: 44,
                                        fontWeight: 300,
                                        lineHeight: 1,
                                        letterSpacing: '-0.02em',
                                        margin: '10px 0 12px'
                                    }}>
                                        <em style={{fontStyle: 'italic', color: T.aInk}}>{h.val}</em>
                                    </div>
                                    <div style={{fontSize: 12.5, color: T.ink2, lineHeight: 1.55}}>{h.desc}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ══ 02 · HOME PICKER ══════════════════════════════════════════════ */}
                {configs.length > 0 && (
                    <section style={{maxWidth: 1280, margin: '96px auto 0', padding: '0 40px'}}>
                        <div style={{display: 'flex', gap: 12, alignItems: 'center', marginBottom: 44}}>
                            <span style={{
                                fontFamily: T.mono,
                                fontSize: 10,
                                letterSpacing: '0.22em',
                                color: T.accent,
                                fontWeight: 700
                            }}>02</span>
                            <div style={{
                                height: 1,
                                background: `linear-gradient(to right, ${T.accent}, transparent)`,
                                width: 64
                            }}/>
                            <span style={sk}>Choose your home</span>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'auto 1fr',
                            alignItems: 'end',
                            gap: 28,
                            marginBottom: 36
                        }}>
                            <h2 style={{
                                ...{margin: 0},
                                fontFamily: T.serif,
                                fontSize: 'clamp(30px, 4vw, 48px)',
                                fontWeight: 300,
                                lineHeight: 1,
                                letterSpacing: '-0.025em',
                                color: T.ink
                            }}>
                                {configs.length === 1 ? '1 configuration,' : `${configs.length} configurations,`}
                                <br/><em style={{fontStyle: 'italic', color: T.aInk}}>each designed for life.</em>
                            </h2>
                            <div style={{
                                color: T.muted,
                                fontSize: 14,
                                maxWidth: 400,
                                textAlign: 'right' as const,
                                marginLeft: 'auto',
                                lineHeight: 1.6
                            }}>
                                {available > 0 ? `Only ${available} of ${total} homes remain. ` : ''}
                                Pick a configuration to see the floor plan.
                            </div>
                        </div>

                        <div style={{
                            background: T.bgCream,
                            borderRadius: 28,
                            padding: '44px 48px',
                            border: `1px solid ${T.line}`
                        }}>
                            {configs.length > 1 && (
                                <div style={{
                                    display: 'inline-flex',
                                    background: 'rgba(255,255,255,0.7)',
                                    borderRadius: 999,
                                    padding: 5,
                                    gap: 4,
                                    border: `1px solid ${T.line}`,
                                    marginBottom: 36
                                }}>
                                    {configs.map((c, i) => {
                                        const cAvail = matrix.flatMap(t => t.floors.flatMap(f => f.units.filter(u => u.status === 'available' && u.bhk === c))).length;
                                        return (
                                            <button key={c} onClick={() => setActiveConfig(i)}
                                                    style={{
                                                        border: 'none',
                                                        background: activeConfig === i ? T.ink : 'transparent',
                                                        color: activeConfig === i ? '#fff' : T.muted,
                                                        padding: '9px 20px',
                                                        borderRadius: 999,
                                                        cursor: 'pointer',
                                                        fontSize: 13,
                                                        fontWeight: 500,
                                                        transition: 'all .15s'
                                                    }}>
                                                {c}
                                                <span style={{
                                                    fontFamily: T.mono,
                                                    fontSize: 10,
                                                    opacity: activeConfig === i ? 0.7 : 0.5,
                                                    marginLeft: 6
                                                }}>· {cAvail}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1.05fr 1fr',
                                gap: 48,
                                alignItems: 'start'
                            }}>
                                <div style={{
                                    background: '#fff',
                                    border: `1px solid ${T.line}`,
                                    borderRadius: 20,
                                    padding: 24
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: 16
                                    }}>
                                        <h4 style={{
                                            margin: 0,
                                            fontFamily: T.serif,
                                            fontStyle: 'italic',
                                            fontSize: 19,
                                            fontWeight: 400,
                                            color: T.ink
                                        }}>{activeConfigName} · Type A</h4>
                                        <span style={{fontFamily: T.mono, fontSize: 10.5, color: T.muted}}>Indicative layout</span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        aspectRatio: '4 / 3.2',
                                        background: T.bg2,
                                        borderRadius: 12,
                                        overflow: 'hidden'
                                    }}>
                                        {floorPlanDocs[activeConfig] ? (
                                            <img src={floorPlanDocs[activeConfig].fileUrl}
                                                 alt={`${activeConfigName} floor plan`}
                                                 style={{width: '100%', height: '100%', objectFit: 'contain'}}/>
                                        ) : (
                                            <FloorPlanSVG bhk={activeConfigName} locality={project.locality}/>
                                        )}
                                    </div>
                                    <div style={{display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginTop: 14}}>
                                        {['Lake-facing', '3.6m ceilings', '2 balconies', 'Private utility'].map(tag => (
                                            <span key={tag} style={{
                                                fontSize: 11,
                                                padding: '4px 10px',
                                                borderRadius: 999,
                                                background: T.aTint,
                                                color: T.aInk,
                                                border: `1px solid ${T.accent}`,
                                                fontWeight: 500
                                            }}>{tag}</span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{
                                        fontFamily: T.serif,
                                        fontSize: 36,
                                        fontWeight: 300,
                                        lineHeight: 1.02,
                                        letterSpacing: '-0.02em',
                                        margin: '0 0 8px',
                                        color: T.ink
                                    }}>
                                        The <em style={{
                                        fontStyle: 'italic',
                                        color: T.aInk
                                    }}>everyday</em><br/>{activeConfigName}.
                                    </h3>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        borderTop: `1px solid ${T.line}`,
                                        borderBottom: `1px solid ${T.line}`,
                                        margin: '24px 0'
                                    }}>
                                        {[
                                            {l: 'Towers', v: project.towers ? String(project.towers) : '—', s: ''},
                                            {
                                                l: 'Floors',
                                                v: project.floorsPerTower ? String(project.floorsPerTower) : '—',
                                                s: 'per tower'
                                            },
                                            {l: 'Available', v: String(availableForConfig.length), s: 'units'},
                                        ].map((stat, i) => (
                                            <div key={stat.l} style={{
                                                padding: '16px 0',
                                                borderLeft: i > 0 ? `1px solid ${T.line}` : 'none',
                                                paddingLeft: i > 0 ? 18 : 0
                                            }}>
                                                <div style={sk}>{stat.l}</div>
                                                <div style={{
                                                    fontFamily: T.serif,
                                                    fontSize: 26,
                                                    fontWeight: 300,
                                                    lineHeight: 1.1,
                                                    marginTop: 4,
                                                    color: T.ink
                                                }}>
                                                    {stat.v} <small style={{
                                                    fontFamily: 'system-ui',
                                                    fontSize: 12,
                                                    color: T.muted,
                                                    fontWeight: 400
                                                }}>{stat.s}</small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{
                                        padding: '22px 24px',
                                        background: T.ink,
                                        color: '#fff',
                                        borderRadius: 16,
                                        display: 'grid',
                                        gridTemplateColumns: '1fr auto',
                                        alignItems: 'center',
                                        gap: 16
                                    }}>
                                        <div>
                                            <div style={{
                                                fontSize: 10.5,
                                                letterSpacing: '0.12em',
                                                textTransform: 'uppercase' as const,
                                                color: 'rgba(255,255,255,0.4)',
                                                fontWeight: 500
                                            }}>Starting from
                                            </div>
                                            <div style={{
                                                fontFamily: T.serif,
                                                fontSize: 36,
                                                fontWeight: 300,
                                                letterSpacing: '-0.02em',
                                                marginTop: 2,
                                                lineHeight: 1.05
                                            }}>
                                                {fmtPrice(project.priceMin)}
                                            </div>
                                            {emiMonthly && <div style={{
                                                color: 'rgba(255,255,255,0.45)',
                                                fontSize: 12,
                                                marginTop: 2
                                            }}>EMI from <b
                                                style={{color: T.accent}}>₹{emiMonthly.toLocaleString('en-IN')}</b>/mo
                                            </div>}
                                        </div>
                                        <button onClick={() => navigate('/customer/meeting', {
                                            state: {
                                                projectId: project.id,
                                                builderId: project.builderId,
                                                builderName: project.builderName,
                                                projectName: project.name,
                                                city: project.city
                                            }
                                        })}
                                                style={{
                                                    background: T.accent,
                                                    color: T.ink,
                                                    border: 'none',
                                                    padding: '12px 22px',
                                                    borderRadius: 12,
                                                    cursor: 'pointer',
                                                    fontWeight: 700,
                                                    fontSize: 14,
                                                    whiteSpace: 'nowrap' as const
                                                }}>
                                            Reserve
                                        </button>
                                    </div>
                                    {availableForConfig.length > 0 && (
                                        <div style={{marginTop: 22}}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontSize: 12,
                                                color: T.muted,
                                                marginBottom: 10
                                            }}>
                                                <span>Available units</span><b
                                                style={{color: T.ink}}>{availableForConfig.length} left</b>
                                            </div>
                                            {availableForConfig.slice(0, 4).map(unit => (
                                                <div key={unit.id} style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '1fr 1fr 1fr auto',
                                                    alignItems: 'center',
                                                    padding: '12px 0',
                                                    borderTop: `1px solid ${T.line}`,
                                                    gap: 10
                                                }}>
                                                    <span style={{
                                                        fontFamily: T.mono,
                                                        fontSize: 13,
                                                        color: T.ink,
                                                        fontWeight: 600
                                                    }}>{unit.id}</span>
                                                    <span style={{fontSize: 13, color: T.ink2}}>F{unit.floor} <span
                                                        style={{color: T.muted}}>· Twr {unit.tower}</span></span>
                                                    <span style={{
                                                        fontFamily: T.mono,
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        color: T.ink
                                                    }}>
                            {project.priceMin ? fmtPrice(Math.round(project.priceMin * (1 + (unit.floor - 1) * 0.005))) : '—'}
                          </span>
                                                    <button style={{
                                                        color: T.aInk,
                                                        fontSize: 12,
                                                        fontWeight: 500,
                                                        border: `1px solid ${T.accent}`,
                                                        padding: '5px 12px',
                                                        borderRadius: 999,
                                                        background: T.aTint,
                                                        cursor: 'pointer'
                                                    }}>View
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ══ 03 · AMENITIES (dark panel) ══════════════════════════════════ */}
                {project.amenities && project.amenities.length > 0 && (
                    <section style={{maxWidth: 1280, margin: '96px auto 0', padding: '0 40px'}}>
                        <div style={{
                            background: T.ink,
                            borderRadius: 28,
                            padding: '60px 52px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '-30%',
                                right: '-5%',
                                width: 560,
                                height: 560,
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(201,168,108,0.08), transparent 60%)',
                                pointerEvents: 'none'
                            }}/>
                            <div style={{display: 'flex', gap: 12, alignItems: 'center', marginBottom: 36}}>
                                <span style={{
                                    fontFamily: T.mono,
                                    fontSize: 10,
                                    letterSpacing: '0.22em',
                                    color: T.accent,
                                    fontWeight: 700
                                }}>03</span>
                                <div style={{
                                    height: 1,
                                    background: `linear-gradient(to right, ${T.accent}, transparent)`,
                                    width: 64
                                }}/>
                                <span style={{...sk, color: 'rgba(255,255,255,0.35)'}}>Lifestyle</span>
                            </div>
                            <div style={{maxWidth: 640, marginBottom: 44}}>
                                <h2 style={{
                                    fontFamily: T.serif,
                                    fontSize: 'clamp(30px, 4vw, 48px)',
                                    fontWeight: 300,
                                    lineHeight: 1,
                                    letterSpacing: '-0.025em',
                                    color: '#fff',
                                    margin: 0
                                }}>
                                    Amenities crafted for{' '}
                                    <em style={{fontStyle: 'italic', color: T.accent}}>how you live</em>.
                                </h2>
                                <p style={{
                                    color: 'rgba(255,255,255,0.5)',
                                    marginTop: 14,
                                    fontSize: 14,
                                    lineHeight: 1.65
                                }}>
                                    {project.amenities.length} world-class amenities designed around your daily rhythm.
                                </p>
                            </div>
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 16}}>
                                {project.amenities[0] && (() => {
                                    const {node} = getAmenityMeta(project.amenities![0]);
                                    return (
                                        <div style={{
                                            gridRow: 'span 2',
                                            background: 'rgba(201,168,108,0.08)',
                                            border: '1px solid rgba(201,168,108,0.18)',
                                            borderRadius: 18,
                                            padding: '28px 26px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div style={{
                                                width: 46,
                                                height: 46,
                                                borderRadius: 10,
                                                background: T.accent,
                                                color: T.ink,
                                                display: 'grid',
                                                placeItems: 'center',
                                                marginBottom: 18
                                            }}>{node}</div>
                                            <div>
                                                <div style={{
                                                    fontFamily: T.serif,
                                                    fontStyle: 'italic',
                                                    fontSize: 26,
                                                    fontWeight: 400,
                                                    lineHeight: 1.2,
                                                    color: '#fff',
                                                    marginBottom: 6
                                                }}>{project.amenities[0]}</div>
                                                <div style={{color: 'rgba(255,255,255,0.45)', fontSize: 12.5}}>A
                                                    signature feature designed to elevate your every day.
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                                {project.amenities.slice(1, 9).map(amenity => {
                                    const {node} = getAmenityMeta(amenity);
                                    return (
                                        <div key={amenity} style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            borderRadius: 18,
                                            padding: '22px 22px 24px'
                                        }}>
                                            <div style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 9,
                                                background: 'rgba(201,168,108,0.12)',
                                                color: T.accent,
                                                display: 'grid',
                                                placeItems: 'center',
                                                marginBottom: 14
                                            }}>{node}</div>
                                            <div style={{
                                                fontFamily: T.serif,
                                                fontStyle: 'italic',
                                                fontSize: 17,
                                                fontWeight: 400,
                                                lineHeight: 1.2,
                                                color: '#fff'
                                            }}>{amenity}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            {project.amenities.length > 9 && (
                                <div style={{
                                    marginTop: 20,
                                    paddingTop: 20,
                                    borderTop: '1px solid rgba(255,255,255,0.07)',
                                    display: 'flex',
                                    gap: 8,
                                    flexWrap: 'wrap' as const
                                }}>
                                    {project.amenities.slice(9).map(a => (
                                        <span key={a} style={{
                                            fontSize: 11.5,
                                            padding: '5px 12px',
                                            borderRadius: 999,
                                            background: 'rgba(255,255,255,0.04)',
                                            color: 'rgba(255,255,255,0.55)',
                                            border: '1px solid rgba(255,255,255,0.08)'
                                        }}>{a}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ══ 04 · FLOOR PLANS ══════════════════════════════════════════════ */}
                {configs.length > 0 && (
                    <section style={{maxWidth: 1280, margin: '96px auto 0', padding: '0 40px'}}>
                        <div style={{display: 'flex', gap: 12, alignItems: 'center', marginBottom: 44}}>
                            <span style={{
                                fontFamily: T.mono,
                                fontSize: 10,
                                letterSpacing: '0.22em',
                                color: T.accent,
                                fontWeight: 700
                            }}>04</span>
                            <div style={{
                                height: 1,
                                background: `linear-gradient(to right, ${T.accent}, transparent)`,
                                width: 64
                            }}/>
                            <span style={sk}>Design</span>
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'auto 1fr',
                            alignItems: 'end',
                            gap: 28,
                            marginBottom: 36
                        }}>
                            <h2 style={{
                                ...{margin: 0},
                                fontFamily: T.serif,
                                fontSize: 'clamp(30px, 4vw, 48px)',
                                fontWeight: 300,
                                lineHeight: 1,
                                letterSpacing: '-0.025em',
                                color: T.ink
                            }}>
                                Every sq ft <em style={{fontStyle: 'italic', color: T.aInk}}>purposefully designed.</em>
                            </h2>
                            <div style={{
                                color: T.muted,
                                fontSize: 14,
                                maxWidth: 380,
                                textAlign: 'right' as const,
                                marginLeft: 'auto',
                                lineHeight: 1.5
                            }}>
                                {floorPlanDocs.length > 0 ? 'Builder-provided floor plans — exact layouts as designed.' : 'Indicative layouts — detailed drawings available on request.'}
                            </div>
                        </div>
                        {configs.length > 1 && (
                            <div style={{display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' as const}}>
                                {configs.map((c, i) => (
                                    <button key={c} onClick={() => setActiveConfig(i)}
                                            style={{
                                                border: `1px solid ${activeConfig === i ? T.accent : T.line}`,
                                                background: activeConfig === i ? T.ink : T.bg2,
                                                color: activeConfig === i ? '#fff' : T.ink2,
                                                padding: '10px 24px',
                                                borderRadius: 999,
                                                cursor: 'pointer',
                                                fontSize: 13.5,
                                                fontWeight: 500,
                                                transition: 'all .15s'
                                            }}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1.15fr 1fr',
                            gap: 44,
                            alignItems: 'start',
                            background: T.bgCream,
                            borderRadius: 28,
                            padding: '44px 48px',
                            border: `1px solid ${T.line}`
                        }}>
                            <div>
                                <div style={{
                                    background: '#fff',
                                    borderRadius: 20,
                                    border: `1px solid ${T.line}`,
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}>
                                    {floorPlanDocs[activeConfig] ? (
                                        <img src={floorPlanDocs[activeConfig].fileUrl}
                                             alt={`${activeConfigName} floor plan`} style={{
                                            width: '100%',
                                            display: 'block',
                                            objectFit: 'contain',
                                            maxHeight: 500
                                        }}/>
                                    ) : floorPlanDocs.length === 1 ? (
                                        <img src={floorPlanDocs[0].fileUrl} alt={`${activeConfigName} floor plan`}
                                             style={{
                                                 width: '100%',
                                                 display: 'block',
                                                 objectFit: 'contain',
                                                 maxHeight: 500
                                             }}/>
                                    ) : (
                                        <div style={{aspectRatio: '4 / 3.2'}}><FloorPlanSVG bhk={activeConfigName}
                                                                                            locality={project.locality}/>
                                        </div>
                                    )}
                                    {floorPlanDocs.length === 0 && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 12,
                                            right: 12,
                                            background: 'rgba(11,25,41,0.6)',
                                            backdropFilter: 'blur(6px)',
                                            color: 'rgba(255,255,255,0.8)',
                                            padding: '4px 11px',
                                            borderRadius: 999,
                                            fontSize: 10.5
                                        }}>Indicative</div>
                                    )}
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginTop: 14
                                }}>
                                    <span style={{
                                        fontFamily: T.mono,
                                        fontSize: 11,
                                        color: T.muted
                                    }}>{activeConfigName} · {floorPlanDocs.length > 0 ? 'Builder provided' : 'Indicative'}</span>
                                    {(floorPlanDocs[activeConfig] ?? floorPlanDocs[0]) && (
                                        <a href={(floorPlanDocs[activeConfig] ?? floorPlanDocs[0]).fileUrl} download
                                           target="_blank" rel="noreferrer"
                                           style={{
                                               display: 'flex',
                                               alignItems: 'center',
                                               gap: 5,
                                               fontSize: 12,
                                               fontWeight: 600,
                                               color: T.aInk,
                                               textDecoration: 'none',
                                               border: `1px solid ${T.accent}`,
                                               borderRadius: 999,
                                               padding: '5px 14px',
                                               background: T.aTint
                                           }}>
                                            <Download size={11}/> Download Plan
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h3 style={{
                                    fontFamily: T.serif,
                                    fontSize: 34,
                                    fontWeight: 300,
                                    letterSpacing: '-0.02em',
                                    lineHeight: 1.05,
                                    margin: '0 0 6px',
                                    color: T.ink
                                }}>
                                    The <em
                                    style={{fontStyle: 'italic', color: T.aInk}}>{activeConfigName || configs[0]}</em>
                                </h3>
                                <p style={{color: T.muted, fontSize: 14, margin: '0 0 26px', lineHeight: 1.55}}>
                                    {specs.carpet} sqft carpet · {specs.superBuiltUp} sqft super
                                    built-up{floorPlanDocs.length === 0 && ' · indicative'}
                                </p>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 10,
                                    marginBottom: 26
                                }}>
                                    {[
                                        {l: 'Carpet Area', v: specs.carpet, s: 'sq ft'},
                                        {l: 'Super Built-up', v: specs.superBuiltUp, s: 'sq ft'},
                                        {l: 'Towers', v: project.towers ? String(project.towers) : '—', s: ''},
                                        {
                                            l: 'Floors',
                                            v: project.floorsPerTower ? String(project.floorsPerTower) : '—',
                                            s: 'per tower'
                                        },
                                    ].map(stat => (
                                        <div key={stat.l} style={{
                                            padding: '14px 16px',
                                            background: '#fff',
                                            borderRadius: 14,
                                            border: `1px solid ${T.line}`
                                        }}>
                                            <div style={{
                                                fontSize: 10,
                                                letterSpacing: '0.12em',
                                                textTransform: 'uppercase' as const,
                                                color: T.muted,
                                                fontWeight: 600,
                                                marginBottom: 5
                                            }}>{stat.l}</div>
                                            <div style={{
                                                fontFamily: T.serif,
                                                fontSize: 20,
                                                fontWeight: 300,
                                                letterSpacing: '-0.01em',
                                                lineHeight: 1.15,
                                                color: T.ink
                                            }}>
                                                {stat.v}{stat.s && <small style={{
                                                fontFamily: 'system-ui',
                                                fontSize: 10.5,
                                                color: T.muted,
                                                fontWeight: 400,
                                                marginLeft: 4
                                            }}>{stat.s}</small>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{marginBottom: 26, borderTop: `1px solid ${T.line}`}}>
                                    {specs.rooms.map(r => (
                                        <div key={r.name} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px 0',
                                            borderBottom: `1px solid ${T.line}`
                                        }}>
                                            <span
                                                style={{fontSize: 13.5, color: T.ink, fontWeight: 500}}>{r.name}</span>
                                            <span style={{
                                                fontFamily: T.mono,
                                                fontSize: 12,
                                                color: T.muted
                                            }}>{r.size}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{
                                    background: T.ink,
                                    color: '#fff',
                                    borderRadius: 16,
                                    padding: '20px 22px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 16
                                }}>
                                    <div>
                                        <div style={{
                                            fontSize: 10,
                                            letterSpacing: '0.12em',
                                            textTransform: 'uppercase' as const,
                                            color: 'rgba(255,255,255,0.4)',
                                            fontWeight: 600
                                        }}>Price range
                                        </div>
                                        <div style={{
                                            fontFamily: T.serif,
                                            fontSize: 24,
                                            fontWeight: 300,
                                            marginTop: 4,
                                            letterSpacing: '-0.01em'
                                        }}>
                                            {fmtPrice(project.priceMin)}
                                            {project.priceMax && project.priceMax !== project.priceMin && <small
                                                style={{
                                                    fontFamily: 'system-ui',
                                                    fontSize: 13,
                                                    opacity: 0.4
                                                }}> – {fmtPrice(project.priceMax)}</small>}
                                        </div>
                                    </div>
                                    <button onClick={() => navigate('/customer/meeting', {
                                        state: {
                                            projectId: project.id,
                                            builderId: project.builderId,
                                            projectName: project.name,
                                            city: project.city
                                        }
                                    })}
                                            style={{
                                                background: T.accent,
                                                color: T.ink,
                                                border: 'none',
                                                padding: '12px 20px',
                                                borderRadius: 12,
                                                cursor: 'pointer',
                                                fontWeight: 700,
                                                fontSize: 13.5,
                                                whiteSpace: 'nowrap' as const
                                            }}>
                                        Get Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </DashboardLayout>
    )
};

export default CustomerProjectDetail;
