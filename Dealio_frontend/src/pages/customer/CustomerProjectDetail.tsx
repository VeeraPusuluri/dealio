import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { builderApi, customerApi } from '@/lib/api';
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

// ── Design tokens (sage palette matching HTML design) ──────────────────────────
const T = {
  ink:      '#0E1411',
  ink2:     '#1F2925',
  muted:    '#8E948F',
  line:     '#ECECE7',
  bg:       '#FFFFFF',
  bg2:      '#FAFAF8',
  bg3:      '#F4F4EF',
  bgCream:  '#F6F2EA',
  accent:   '#D8E5DA',
  aInk:     '#3C5A45',
  aDeep:    '#2B4232',
  aTint:    '#EEF3EF',
  sand:     '#F1E9DA',
  sandInk:  '#7A5E2F',
  serif:    '"Fraunces", "Georgia", "Times New Roman", serif',
  mono:     '"Geist Mono", ui-monospace, monospace',
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
interface Specs { structure?: string; flooring?: string; doors?: string; windows?: string;
                  electrical?: string; plumbing?: string; kitchen?: string; bathrooms?: string; painting?: string; }
interface ProjectDetail {
  id: number; builderId?: number; builderName?: string; name: string;
  projectType: string | null; status: string; description: string | null;
  address: string | null; city: string | null; locality: string | null;
  pincode: string | null; landmark: string | null; googleMapsLink: string | null;
  reraNumber: string | null; reraState?: string | null; reraExpiry: string | null;
  totalUnits: number | null; towers: number | null; floorsPerTower: number | null;
  configurations: string[] | null; amenities: string[] | null;
  nearbyHighlights: string[] | null;
  priceMin: number | null; priceMax: number | null;
  pricePerSqftMin: number | null; pricePerSqftMax: number | null;
  maintenanceCharges: number | null; floorRiseCharges: number | null;
  possessionDate: string | null; featured: boolean; closingSoon: boolean;
  videoUrl: string | null; imageUrl: string | null;
  availableUnits: number | null; bookedUnits: number | null; soldUnits: number | null;
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
  id: number; docType: string; fileName: string; fileUrl: string; uploadedAt: string;
}

// ── Nearby category metadata ──────────────────────────────────────────────────
const NEARBY_CAT: Record<NearbyPlace['category'], { label: string; hex: string; letter: string }> = {
  hospital:    { label: 'Hospitals', hex: '#DC2626', letter: 'H' },
  school:      { label: 'Schools',   hex: '#2563EB', letter: 'S' },
  transit:     { label: 'Metro',     hex: '#7C3AED', letter: 'M' },
  mall:        { label: 'Malls',     hex: '#9333EA', letter: 'G' },
  park:        { label: 'Parks',     hex: '#059669', letter: 'P' },
  supermarket: { label: 'Markets',   hex: '#D97706', letter: 'G' },
};

function getCatIcon(cat: NearbyPlace['category'], size = 12) {
  switch (cat) {
    case 'hospital':    return <Hospital    size={size} />;
    case 'school':      return <School      size={size} />;
    case 'transit':     return <Train       size={size} />;
    case 'mall':        return <ShoppingBag size={size} />;
    case 'park':        return <Trees       size={size} />;
    case 'supermarket': return <ShoppingCart size={size} />;
  }
}

// ── Amenity icon helper ───────────────────────────────────────────────────────
function getAmenityMeta(name: string): { node: JSX.Element } {
  const n = name.toLowerCase();
  if (n.includes('pool') || n.includes('swim'))   return { node: <Waves size={18} /> };
  if (n.includes('gym') || n.includes('fitness')) return { node: <Activity size={18} /> };
  if (n.includes('club'))                         return { node: <Building2 size={18} /> };
  if (n.includes('garden') || n.includes('lawn')) return { node: <Trees size={18} /> };
  if (n.includes('terrace') || n.includes('rooftop')) return { node: <Globe size={18} /> };
  if (n.includes('park') && !n.includes('parking')) return { node: <Trees size={18} /> };
  if (n.includes('security') || n.includes('cctv')) return { node: <Shield size={18} /> };
  if (n.includes('ev') || n.includes('charging')) return { node: <Zap size={18} /> };
  if (n.includes('parking'))                      return { node: <Navigation size={18} /> };
  if (n.includes('smart') || n.includes('home tech')) return { node: <Home size={18} /> };
  if (n.includes('power') || n.includes('backup')) return { node: <Zap size={18} /> };
  if (n.includes('water') || n.includes('ro'))    return { node: <Droplets size={18} /> };
  if (n.includes('lift') || n.includes('elevator')) return { node: <Building2 size={18} /> };
  if (n.includes('tennis') || n.includes('sport')) return { node: <Trophy size={18} /> };
  if (n.includes('children') || n.includes('kids')) return { node: <Heart size={18} /> };
  if (n.includes('library'))                      return { node: <BookOpen size={18} /> };
  if (n.includes('spa') || n.includes('wellness')) return { node: <Sparkles size={18} /> };
  if (n.includes('jogging') || n.includes('track')) return { node: <Activity size={18} /> };
  if (n.includes('wifi') || n.includes('internet')) return { node: <Wifi size={18} /> };
  if (n.includes('concierge') || n.includes('lobby')) return { node: <Bell size={18} /> };
  if (n.includes('café') || n.includes('cafe') || n.includes('coffee')) return { node: <Coffee size={18} /> };
  if (n.includes('gas') || n.includes('png'))     return { node: <Flame size={18} /> };
  if (n.includes('staff') || n.includes('maintenance')) return { node: <Users size={18} /> };
  return { node: <CheckCircle2 size={18} /> };
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
    iconAnchor:  [8, 13],
    popupAnchor: [80, -10],
    className:   '',
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
    iconSize:    [48, 48],
    iconAnchor:  [24, 24],
    popupAnchor: [0, -30],
    className:   '',
  });
}

// ── Geo utilities ─────────────────────────────────────────────────────────────
function extractCoords(url: string): Coords | null {
  if (!url) return null;
  const pin = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (pin) return { lat: parseFloat(pin[1]), lng: parseFloat(pin[2]) };
  const at  = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at)  return { lat: parseFloat(at[1]),  lng: parseFloat(at[2]) };
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
  const { lat, lng } = center;
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
      distanceKm: haversineKm(center, { lat: elat, lng: elng }),
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
    { signal },
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
    date: new Date(item.pubDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
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
    u.searchParams.delete('usp');
    return u.toString();
  } catch { return null; }
}

// ── Unit matrix ───────────────────────────────────────────────────────────────
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
    for (let f = numFloors; f >= 1; f--) {
      const units: MatrixUnit[] = [];
      for (let u = 1; u <= perFloor; u++) {
        const idx = t * numFloors * perFloor + (numFloors - f) * perFloor + (u - 1);
        if (idx < total) {
          units.push({ id: `${String.fromCharCode(65 + t)}-${f}0${u}`, floor: f, unit: u, bhk: configs[(u - 1) % configs.length], status: statuses[idx] });
        }
      }
      if (units.length) floorRows.push({ floor: f, units });
    }
    towers.push({ tower: String.fromCharCode(65 + t), floors: floorRows });
  }
  return towers;
}

// ── Floor plan placeholder SVG ────────────────────────────────────────────────
function FloorPlanSVG({ bhk, locality }: { bhk: string; locality?: string | null }) {
  const is4 = bhk.includes('4');
  const is3 = bhk.includes('3');
  return (
    <svg viewBox="0 0 400 320" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="400" height="320" fill="#FAFAF8" />
      <rect x="20" y="20" width="360" height="32" fill="rgba(13,148,136,0.08)" />
      <rect x="20" y="20" width="360" height="280" fill="none" stroke={T.ink} strokeWidth="2.5" />
      <line x1="20" y1="52" x2="380" y2="52" stroke={T.ink} strokeWidth="1.5" />
      <text x="200" y="38" textAnchor="middle" fontFamily="Georgia, serif" fontSize="9" fill={T.aInk} fontStyle="italic">
        Balcony · {locality ?? 'city view'}
      </text>
      {is4 ? (
        <>
          <line x1="150" y1="52" x2="150" y2="180" stroke={T.ink} strokeWidth="1.2" />
          <line x1="270" y1="52" x2="270" y2="180" stroke={T.ink} strokeWidth="1.2" />
          <line x1="20" y1="180" x2="380" y2="180" stroke={T.ink} strokeWidth="1.2" />
          <line x1="120" y1="180" x2="120" y2="300" stroke={T.ink} strokeWidth="1.2" />
          <line x1="220" y1="180" x2="220" y2="300" stroke={T.ink} strokeWidth="1.2" />
          <line x1="310" y1="180" x2="310" y2="300" stroke={T.ink} strokeWidth="1.2" />
          {[
            { x: 85, y: 116, l: 'MASTER SUITE', d: "16'×13'" },
            { x: 210, y: 116, l: 'GREAT ROOM', d: "24'×16'" },
            { x: 325, y: 116, l: 'STUDY', d: "12'×10'" },
            { x: 70, y: 244, l: 'BED 2', d: "12'×11'" },
            { x: 170, y: 244, l: 'BED 3', d: "11'×11'" },
            { x: 265, y: 244, l: 'KITCHEN', d: "12'×9'" },
            { x: 345, y: 244, l: 'UTIL', d: "8'×9'" },
          ].map(r => (
            <g key={r.l}>
              <text x={r.x} y={r.y} textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="9" fill={T.ink2}>{r.l}</text>
              <text x={r.x} y={r.y + 13} textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="8" fill={T.muted}>{r.d}</text>
            </g>
          ))}
        </>
      ) : is3 ? (
        <>
          <line x1="180" y1="52" x2="180" y2="180" stroke={T.ink} strokeWidth="1.2" />
          <line x1="20" y1="180" x2="380" y2="180" stroke={T.ink} strokeWidth="1.2" />
          <line x1="120" y1="180" x2="120" y2="300" stroke={T.ink} strokeWidth="1.2" />
          <line x1="270" y1="180" x2="270" y2="300" stroke={T.ink} strokeWidth="1.2" />
          {[
            { x: 100, y: 120, l: 'MASTER BED', d: "13'×12'" },
            { x: 280, y: 120, l: 'LIVING', d: "18'×12'" },
            { x: 70, y: 244, l: 'BED 2', d: "11'×12'" },
            { x: 195, y: 244, l: 'BED 3', d: "10'×12'" },
            { x: 325, y: 244, l: 'KITCHEN', d: "11'×8'" },
          ].map(r => (
            <g key={r.l}>
              <text x={r.x} y={r.y} textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="9" fill={T.ink2}>{r.l}</text>
              <text x={r.x} y={r.y + 13} textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="8" fill={T.muted}>{r.d}</text>
            </g>
          ))}
        </>
      ) : (
        <>
          <line x1="200" y1="52" x2="200" y2="300" stroke={T.ink} strokeWidth="1.2" />
          <line x1="20" y1="190" x2="200" y2="190" stroke={T.ink} strokeWidth="1.2" />
          {[
            { x: 110, y: 120, l: 'MASTER BED', d: "14'×13'" },
            { x: 300, y: 170, l: 'LIVING', d: "18'×14'" },
            { x: 110, y: 248, l: 'BED 2', d: "12'×11'" },
          ].map(r => (
            <g key={r.l}>
              <text x={r.x} y={r.y} textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="9" fill={T.ink2}>{r.l}</text>
              <text x={r.x} y={r.y + 13} textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="8" fill={T.muted}>{r.d}</text>
            </g>
          ))}
        </>
      )}
      <g transform="translate(370,295)" opacity="0.4">
        <circle cx="0" cy="0" r="9" fill="none" stroke={T.muted} />
        <path d="M0,-6 L2.5,0 L0,1.5 L-2.5,0Z" fill={T.ink} />
        <text x="0" y="-12" textAnchor="middle" fontFamily="monospace" fontSize="7" fill={T.muted}>N</text>
      </g>
    </svg>
  );
}

// ── Per-configuration area specs (indicative; real data shown if builder uploads floor plans) ──
function getConfigSpecs(bhk: string): { carpet: string; superBuiltUp: string; rooms: { name: string; size: string }[] } {
  if (bhk.includes('4') || bhk.includes('5')) return {
    carpet: '1,950 – 2,200', superBuiltUp: '2,450 – 2,750',
    rooms: [
      { name: 'Master Bedroom',   size: "16' × 14'" },
      { name: 'Bedroom 2',        size: "13' × 12'" },
      { name: 'Bedroom 3',        size: "12' × 11'" },
      { name: 'Bedroom 4',        size: "11' × 10'" },
      { name: 'Living / Dining',  size: "22' × 16'" },
      { name: 'Kitchen',          size: "13' × 10'" },
      { name: 'Balcony',          size: "10' × 5'"  },
      { name: 'Utility',          size: "7' × 5'"   },
    ],
  };
  if (bhk.includes('3')) return {
    carpet: '1,350 – 1,580', superBuiltUp: '1,700 – 1,980',
    rooms: [
      { name: 'Master Bedroom',   size: "14' × 13'" },
      { name: 'Bedroom 2',        size: "12' × 11'" },
      { name: 'Bedroom 3',        size: "11' × 10'" },
      { name: 'Living / Dining',  size: "18' × 14'" },
      { name: 'Kitchen',          size: "11' × 9'"  },
      { name: 'Balcony',          size: "9' × 5'"   },
    ],
  };
  if (bhk.includes('2')) return {
    carpet: '970 – 1,150', superBuiltUp: '1,220 – 1,450',
    rooms: [
      { name: 'Master Bedroom',   size: "13' × 12'" },
      { name: 'Bedroom 2',        size: "11' × 11'" },
      { name: 'Living / Dining',  size: "16' × 12'" },
      { name: 'Kitchen',          size: "10' × 8'"  },
      { name: 'Balcony',          size: "8' × 5'"   },
    ],
  };
  if (bhk.includes('1')) return {
    carpet: '550 – 680', superBuiltUp: '700 – 870',
    rooms: [
      { name: 'Bedroom',          size: "13' × 12'" },
      { name: 'Living / Dining',  size: "14' × 11'" },
      { name: 'Kitchen',          size: "9' × 8'"   },
      { name: 'Balcony',          size: "7' × 5'"   },
    ],
  };
  return {
    carpet: '380 – 480', superBuiltUp: '490 – 620',
    rooms: [
      { name: 'Studio Room',      size: "16' × 14'" },
      { name: 'Kitchen',          size: "9' × 7'"   },
      { name: 'Balcony',          size: "6' × 4'"   },
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

  return { verb, city, sub };
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
        ? `The expected possession date is ${new Date(p.possessionDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}. Construction is progressing as per RERA timelines.`
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
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const location     = useLocation();

  const [project,     setProject]     = useState<ProjectDetail | null>(location.state?.project || null);
  const [loading,     setLoading]     = useState(true);
  const [notFound,    setNotFound]    = useState(false);
  const [documents,   setDocuments]   = useState<ProjectDocument[]>([]);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [activeTour,  setActiveTour]  = useState(0);
  const [shortlisted, setShortlisted] = useState(false);
  const [activeConfig, setActiveConfig] = useState(0);
  const [openFaq,     setOpenFaq]     = useState<number | null>(null);
  const [activeCat,   setActiveCat]   = useState<NearbyPlace['category'] | 'all'>('all');
  const [emiLoanL,    setEmiLoanL]    = useState(114);   // in lakhs
  const [emiTenure,   setEmiTenure]   = useState(20);
  const [emiRate,     setEmiRate]     = useState(85);    // tenths of %, 85 = 8.5%
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Leaflet
  const leafletRef         = useRef<LeafletModule | null>(null);
  const [leafletReady,  setLeafletReady]  = useState(false);
  const leafletDivRef      = useRef<HTMLDivElement>(null);
  const mapRef             = useRef<LeafletType.Map | null>(null);
  const attractionLayerRef = useRef<LeafletType.LayerGroup | null>(null);
  const [nearby,        setNearby]        = useState<NearbyPlace[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [newsItems,     setNewsItems]     = useState<NewsItem[]>([]);
  const [newsLoading,   setNewsLoading]   = useState(false);
  const [newsFetched,   setNewsFetched]   = useState(false);

  const mapCoords = useMemo(
    () => project?.googleMapsLink ? extractCoords(project.googleMapsLink) : null,
    [project?.googleMapsLink], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const nearbyInRange = useMemo(() => nearby.filter(p => p.distanceKm <= 5), [nearby]);

  const catCounts = useMemo(() => {
    const m: Partial<Record<NearbyPlace['category'], number>> = {};
    nearbyInRange.forEach(p => { m[p.category] = (m[p.category] ?? 0) + 1; });
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
            .catch(() => {});
        }
      })
      .catch(() => { if (!location.state?.project) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load shortlist state
  useEffect(() => {
    if (!project) return;
    try {
      const sl = JSON.parse(localStorage.getItem('dealio_customer_shortlist') || '[]') as number[];
      setShortlisted(sl.includes(project.id));
    } catch { /* noop */ }
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
      .then(([mod]) => { if (!cancelled) { leafletRef.current = mod; setLeafletReady(true); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Map init
  useEffect(() => {
    const L   = leafletRef.current;
    const div = leafletDivRef.current;
    if (!L || !mapCoords || !div) return;
    let map: LeafletType.Map;
    try { map = L.map(div, { center: [mapCoords.lat, mapCoords.lng], zoom: 15, zoomControl: true, attributionControl: true }); }
    catch { return; }
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);
    L.marker([mapCoords.lat, mapCoords.lng], { icon: makeProjectPin(L), zIndexOffset: 1000 })
      .bindPopup(`<b style="color:#3C5A45">${project?.name || 'Project Location'}</b>`)
      .addTo(map);
    attractionLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; attractionLayerRef.current = null; };
  }, [leafletReady, mapCoords?.lat, mapCoords?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update attraction markers
  useEffect(() => {
    const L     = leafletRef.current;
    const layer = attractionLayerRef.current;
    if (!L || !layer) return;
    layer.clearLayers();
    const counts: Partial<Record<NearbyPlace['category'], number>> = {};
    nearby.forEach(p => {
      if (p.distanceKm > 5) return;
      const c = counts[p.category] ?? 0;
      if (c >= 5) return;
      counts[p.category] = c + 1;
      const { hex } = NEARBY_CAT[p.category];
      L.marker([p.lat, p.lng], { icon: makeNearbyPin(L, hex, p.name, p.distanceKm) })
        .bindPopup(`<b>${p.name}</b><br/><span style="color:#6b7280;font-size:11px">${NEARBY_CAT[p.category].label} · ${p.distanceKm.toFixed(1)} km</span>`)
        .addTo(layer);
    });
  }, [nearby]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch nearby places
  useEffect(() => {
    setNearby([]);
    if (!mapCoords) return;
    const ctrl  = new AbortController();
    const timer = setTimeout(async () => {
      setNearbyLoading(true);
      try { setNearby(await fetchNearbyPlaces(mapCoords, ctrl.signal)); }
      catch { /* network/timeout */ }
      finally { setNearbyLoading(false); }
    }, 900);
    return () => { ctrl.abort(); clearTimeout(timer); };
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
      } catch { /* silent — section stays hidden */ }
      finally { setNewsLoading(false); setNewsFetched(true); }
    }, 1500);
    return () => { ctrl.abort(); clearTimeout(timer); };
  }, [project?.locality, project?.city]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleShortlist = () => {
    if (!project) return;
    try {
      const sl = JSON.parse(localStorage.getItem('dealio_customer_shortlist') || '[]') as number[];
      const next = shortlisted ? sl.filter(x => x !== project.id) : [...sl, project.id];
      localStorage.setItem('dealio_customer_shortlist', JSON.stringify(next));
      setShortlisted(!shortlisted);
    } catch { /* noop */ }
  };

  // ── Loading / not found states ───────────────────────────────────────────
  if (loading && !project) return (
    <DashboardLayout>
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin" size={32} style={{ color: T.aInk }} />
      </div>
    </DashboardLayout>
  );

  if (notFound || !project) return (
    <DashboardLayout>
      <div className="text-center py-24 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: T.bg2 }}>
          <Building2 size={28} style={{ color: T.muted }} />
        </div>
        <h3 style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 300, letterSpacing: '-0.02em', color: T.ink, margin: '0 0 8px' }}>
          Project not found.
        </h3>
        <p style={{ color: T.muted, fontSize: 14, marginBottom: 28 }}>
          This project may have been removed or is not yet published.
        </p>
        <button onClick={() => navigate('/customer')}
          style={{ background: T.aInk, color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          Back to Projects
        </button>
      </div>
    </DashboardLayout>
  );

  // ── Derived data ─────────────────────────────────────────────────────────
  const total     = project.totalUnits ?? 0;
  const sold      = Math.min(project.soldUnits   ?? 0, total);
  const booked    = Math.min(project.bookedUnits  ?? 0, Math.max(0, total - sold));
  const available = project.availableUnits != null
    ? Math.min(project.availableUnits, Math.max(0, total - sold - booked))
    : Math.max(0, total - sold - booked);
  const availPct  = total > 0 ? Math.round((available / total) * 100) : 0;
  const bookedPct = total > 0 ? Math.round((booked    / total) * 100) : 0;
  const soldPct   = total > 0 ? Math.round((sold      / total) * 100) : 0;

  const isImageUrl = (url: string) => /\.(jpe?g|png|webp|gif|bmp|svg)(\?|$)/i.test(url);
  const docImages  = documents.filter(d => isImageUrl(d.fileUrl) || d.docType?.toLowerCase().includes('image') || d.docType?.toLowerCase().includes('photo'));
  const heroImg    = project.imageUrl ? [{ id: 0, docType: 'image', fileName: project.name, fileUrl: project.imageUrl, uploadedAt: '' }] : [];
  const imagesDocs = [...heroImg, ...docImages.filter(d => d.fileUrl !== project.imageUrl)];
  const otherDocs   = documents.filter(d => !docImages.includes(d));
  const floorPlanDocs = documents.filter(d =>
    (d.docType?.toLowerCase().includes('floor') || d.docType?.toLowerCase().includes('layout')) &&
    isImageUrl(d.fileUrl),
  );
  const tours       = parseTours(project.videoUrl);
  const matrix      = total > 0 ? buildUnitMatrix(project) : [];
  const mapEmbedUrl = project.googleMapsLink ? toMapEmbedUrl(project.googleMapsLink) : null;
  const hasLocation = !!(project.address || project.googleMapsLink || project.city || project.locality);

  const configs = project.configurations ?? [];
  const activeConfigName = configs[activeConfig] ?? '';
  const specs = getConfigSpecs(activeConfigName);
  const availableForConfig = matrix.flatMap(t =>
    t.floors.flatMap(f =>
      f.units
        .filter(u => u.status === 'available' && (activeConfigName === '' || u.bhk === activeConfigName))
        .map(u => ({ ...u, tower: t.tower }))
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

  // Inline style helpers
  const sk = { fontFamily: T.mono, fontSize: '10.5px', letterSpacing: '0.16em', color: T.muted, textTransform: 'uppercase' as const, fontWeight: 500 };
  const secH2 = { margin: '8px 0 0', fontFamily: T.serif, fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.025em' };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div style={{ background: T.bg, minHeight: '100vh' }}>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 0' }}>

          {/* Tags row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22, alignItems: 'center' }}>
            <button onClick={() => navigate('/customer')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 13, padding: 0, marginRight: 8 }}>
              ← Projects
            </button>
            {project.reraNumber && (
              <span style={{ background: T.aTint, color: T.aInk, border: `1px solid ${T.accent}`, fontSize: 11.5, padding: '5px 12px', borderRadius: 999, fontWeight: 500, fontFamily: T.mono, letterSpacing: '0.04em' }}>
                RERA · {project.reraNumber.slice(0, 16)}{project.reraNumber.length > 16 ? '…' : ''}
              </span>
            )}
            {project.builderName && (
              <span style={{ background: T.sand, color: T.sandInk, border: '1px solid #E8D9C0', fontSize: 11.5, padding: '5px 12px', borderRadius: 999, fontWeight: 500 }}>
                By {project.builderName}
              </span>
            )}
            {(project.availableUnits ?? 0) > 0 && (
              <span style={{ background: T.ink, color: '#fff', fontSize: 11.5, padding: '5px 12px', borderRadius: 999, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent, display: 'inline-block', animation: 'pulse 2s infinite' }} />
                {project.availableUnits} viewing now
              </span>
            )}
            {project.featured && (
              <span style={{ background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', fontSize: 11.5, padding: '5px 12px', borderRadius: 999, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={11} fill="currentColor" /> Featured
              </span>
            )}
            {project.closingSoon && (
              <span style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontSize: 11.5, padding: '5px 12px', borderRadius: 999, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} /> Closing Soon
              </span>
            )}
          </div>

          {/* Poetic headline — "A home that rises / with Hyderabad." */}
          <h1 style={{ fontFamily: T.serif, fontSize: 'clamp(52px, 7.2vw, 108px)', fontWeight: 300, lineHeight: 0.94, letterSpacing: '-0.03em', color: T.ink, margin: 0 }}>
            A home that{' '}
            <em style={{ fontStyle: 'italic', color: T.aInk, fontWeight: 300 }}>{heroText.verb}</em>
            <br />
            with {heroText.city}.
          </h1>

          {/* Italic subtitle — project description or generated */}
          <p style={{ marginTop: 22, fontFamily: T.serif, fontSize: 'clamp(17px, 1.8vw, 23px)', fontWeight: 300, fontStyle: 'italic', color: T.ink2, lineHeight: 1.4, maxWidth: 740, marginBottom: 0 }}>
            {heroText.sub}
          </p>

          {/* Meta row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, fontSize: 13.5, color: T.ink2, marginBottom: 28, alignItems: 'center' }}>
            {configs.length > 0 && <span><b>{configs.join(', ')}</b></span>}
            {project.locality && <><span style={{ margin: '0 12px', color: T.line }}>|</span><span><b>{project.locality}</b>{project.city ? `, ${project.city}` : ''}</span></>}
            {project.possessionDate && <><span style={{ margin: '0 12px', color: T.line }}>|</span><span>Possession <b>{project.possessionDate.slice(0, 7)}</b></span></>}
            {available > 0 && <><span style={{ margin: '0 12px', color: T.line }}>|</span><span style={{ color: T.aInk, fontWeight: 600 }}>{available} units available</span></>}
          </div>

          {/* Gallery grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '320px 320px', gap: 12, borderRadius: 24, overflow: 'hidden' }}>
            {/* Main large image */}
            <div style={{ gridRow: 'span 2', position: 'relative', overflow: 'hidden', borderRadius: 24 }}>
              {imagesDocs[0] ? (
                <>
                  <img src={imagesDocs[0].fileUrl} alt={imagesDocs[0].fileName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(14,20,17,0.55) 0%, transparent 50%)' }} />
                  {imagesDocs.length > 1 && (
                    <>
                      <button onClick={() => setCarouselIdx(i => (i - 1 + imagesDocs.length) % imagesDocs.length)}
                        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={16} />
                      </button>
                      <button onClick={() => setCarouselIdx(i => (i + 1) % imagesDocs.length)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg, ${T.aInk} 0%, #0f766e 40%, #134e4a 100%)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3, padding: '0 16px', opacity: 0.18 }}>
                    {[12,22,16,38,24,46,30,18,34,14,26,10].map((h, i) => (
                      <div key={i} style={{ background: '#fff', borderRadius: '3px 3px 0 0', flex: 1, height: `${h * 2}px` }} />
                    ))}
                  </div>
                  <Building2 size={48} style={{ color: 'rgba(255,255,255,0.3)', position: 'relative' }} />
                </div>
              )}
              {/* Bottom-left tag */}
              <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(14,20,17,0.65)', backdropFilter: 'blur(8px)', color: '#fff', padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500 }}>
                {project.locality ?? project.city}
                {project.floorsPerTower ? ` · ${project.floorsPerTower} floors` : ''}
              </div>
              {/* Status badge */}
              <div style={{ position: 'absolute', top: 16, right: 16, background: T.aTint, color: T.aInk, border: `1px solid ${T.accent}`, padding: '5px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 600 }}>
                {statusLbl}
              </div>
            </div>

            {/* Top-right: virtual tour or 2nd image */}
            {tours.length > 0 ? (
              <div
                onClick={() => { const el = document.getElementById('virtual-tours'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                style={{ borderRadius: 24, overflow: 'hidden', background: T.ink, cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={18} style={{ color: '#fff', fill: '#fff', marginLeft: 2 }} />
                </div>
                <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Virtual tour</span>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>tap to explore</span>
                <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(255,255,255,0.1)', color: T.accent, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500 }}>
                  {tours.length} {tours.length === 1 ? 'tour' : 'tours'}
                </div>
              </div>
            ) : imagesDocs[1] ? (
              <div style={{ borderRadius: 24, overflow: 'hidden', position: 'relative', cursor: 'pointer' }} onClick={() => setCarouselIdx(1)}>
                <img src={imagesDocs[1].fileUrl} alt={imagesDocs[1].fileName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(14,20,17,0.45) 0%, transparent 55%)' }} />
                <span style={{ position: 'absolute', bottom: 12, left: 12, color: '#fff', fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
                  {imagesDocs[1].docType?.toLowerCase().replace(/_/g, ' ') || 'interior'}
                </span>
              </div>
            ) : (
              <div style={{ borderRadius: 24, background: `linear-gradient(135deg, ${T.ink} 0%, #1F2925 100%)` }} />
            )}

            {/* Bottom-right: 3rd image or placeholder */}
            {imagesDocs[2] ? (
              <div style={{ borderRadius: 24, overflow: 'hidden', position: 'relative', cursor: 'pointer' }} onClick={() => setCarouselIdx(2)}>
                <img src={imagesDocs[2].fileUrl} alt={imagesDocs[2].fileName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(14,20,17,0.45) 0%, transparent 55%)' }} />
                {imagesDocs.length > 3 && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,20,17,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: 22, fontWeight: 800 }}>+{imagesDocs.length - 3} more</span>
                  </div>
                )}
                <span style={{ position: 'absolute', bottom: 12, left: 12, color: '#fff', fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
                  {imagesDocs[2].docType?.toLowerCase().replace(/_/g, ' ') || 'amenities'}
                </span>
              </div>
            ) : (
              <div style={{ borderRadius: 24, background: `linear-gradient(135deg, ${T.sand}, #E8D9C0)` }} />
            )}
          </div>

          {/* Gallery footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 13, color: T.muted, paddingBottom: 4 }}>
            <span>1 / {Math.max(imagesDocs.length, 1)} · images &amp; floorplans</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={toggleShortlist}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: shortlisted ? T.aInk : T.muted, fontSize: 13, fontWeight: 500 }}>
                <Bookmark size={14} fill={shortlisted ? T.aInk : 'none'} /> {shortlisted ? 'Saved' : 'Save'}
              </button>
              <button onClick={() => navigator.share?.({ title: project.name, url: window.location.href }).catch(() => {})}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 13, fontWeight: 500 }}>
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>
        </section>

        {/* ── STICKY OFFER BAR ─────────────────────────────────────────────── */}
        {(project.priceMin || project.priceMax) && (
          <div style={{ position: 'sticky', top: 0, zIndex: 30, maxWidth: 1280, margin: '24px auto 0', padding: '0 24px' }}>
            <div style={{ background: T.ink, color: '#fff', borderRadius: 18, padding: '16px 24px', display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 20, alignItems: 'center', boxShadow: '0 10px 28px rgba(14,20,17,0.22)' }}>
              <div style={{ lineHeight: 1.1 }}>
                <div style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>Starting from</div>
                <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 300, letterSpacing: '-0.01em', marginTop: 3 }}>
                  {fmtPrice(project.priceMin)}
                  {configs[0] && <small style={{ fontFamily: 'system-ui', fontSize: 13, opacity: 0.5, fontWeight: 400, marginLeft: 6 }}>{configs[0]}</small>}
                </div>
              </div>
              {emiMonthly && (
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 20, fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>
                  EMI from <b style={{ color: '#fff', fontWeight: 500 }}>₹{emiMonthly.toLocaleString('en-IN')} / mo</b>
                  <br /><span style={{ opacity: 0.5, fontSize: 11.5 }}>20 yr · 8.5% · pre-EMI till possession</span>
                </div>
              )}
              <button
                style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                onClick={() => { const el = document.getElementById('faq-section'); el?.scrollIntoView({ behavior: 'smooth' }); }}>
                Learn more
              </button>
              <button
                onClick={() => navigate('/customer/meeting', { state: { projectId: project.id, builderId: project.builderId, builderName: project.builderName, projectName: project.name, city: project.city } })}
                style={{ background: T.accent, color: T.aDeep, border: 'none', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={13} /> Book a Visit
              </button>
            </div>
          </div>
        )}

        {/* ── HIGHLIGHTS ───────────────────────────────────────────────────── */}
        {highlights.length > 0 && (
          <section style={{ maxWidth: 1100, margin: '80px auto 0', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `1.1fr ${highlights.map(() => '1fr').join(' ')}`, gap: 28, alignItems: 'start' }}>
              <div style={{ fontFamily: T.serif, fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
                Why you'll be{' '}
                <em style={{ fontStyle: 'italic', color: T.aInk }}>glad you're here</em>.
              </div>
              {highlights.map(h => (
                <div key={h.key} style={{ borderTop: `1px solid ${T.ink}`, paddingTop: 16 }}>
                  <div style={sk}>{h.key}</div>
                  <div style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em', margin: '8px 0 10px' }}>
                    <em style={{ fontStyle: 'italic', color: T.aInk, fontWeight: 300 }}>{h.val}</em>
                  </div>
                  <div style={{ fontSize: 12.5, color: T.ink2, lineHeight: 1.5 }}>{h.desc}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── HOME PICKER ──────────────────────────────────────────────────── */}
        {configs.length > 0 && (
          <section style={{ maxWidth: 1100, margin: '96px auto 0', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'end', gap: 28, marginBottom: 32 }}>
              <div>
                <div style={sk}>— Choose your home</div>
                <h2 style={secH2}>
                  {configs.length === 1 ? '1 configuration,' : `${configs.length} configurations,`}
                  <br /><em style={{ fontStyle: 'italic', color: T.aInk }}>each designed for life.</em>
                </h2>
              </div>
              <div style={{ color: T.muted, fontSize: 14, maxWidth: 400, textAlign: 'right', marginLeft: 'auto', lineHeight: 1.5 }}>
                {available > 0 ? `Only ${available} of ${total} homes remain. ` : ''}
                Pick a configuration to see the floor plan and available units.
              </div>
            </div>

            <div style={{ background: T.bgCream, borderRadius: 28, padding: '40px 44px' }}>
              {/* Config tabs */}
              {configs.length > 1 && (
                <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.7)', borderRadius: 999, padding: 5, gap: 4, border: `1px solid ${T.line}`, marginBottom: 32 }}>
                  {configs.map((c, i) => {
                    const cAvail = matrix.flatMap(t => t.floors.flatMap(f => f.units.filter(u => u.status === 'available' && u.bhk === c))).length;
                    return (
                      <button key={c} onClick={() => setActiveConfig(i)}
                        style={{ border: 'none', background: activeConfig === i ? T.ink : 'transparent', color: activeConfig === i ? '#fff' : T.muted, padding: '9px 18px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all .15s ease', boxShadow: activeConfig === i ? '0 1px 2px rgba(0,0,0,0.08)' : 'none' }}>
                        {c}
                        <span style={{ fontFamily: T.mono, fontSize: 10.5, opacity: activeConfig === i ? 0.8 : 0.55, marginLeft: 6 }}>
                          · {cAvail} avail
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 44, alignItems: 'start' }}>
                {/* Floor plan */}
                <div style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 20, padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <h4 style={{ margin: 0, fontFamily: T.serif, fontStyle: 'italic', fontSize: 18, fontWeight: 400 }}>
                      {activeConfigName} · Type A
                    </h4>
                    <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, letterSpacing: '0.06em' }}>
                      Indicative layout
                    </span>
                  </div>
                  <div style={{ width: '100%', aspectRatio: '4 / 3.2', display: 'block', background: T.bg2, borderRadius: 12, overflow: 'hidden' }}>
                    <FloorPlanSVG bhk={activeConfigName} locality={project.locality} />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                    {['Lake-facing', '3.6m ceilings', '2 balconies', 'Private utility'].map(tag => (
                      <span key={tag} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: T.aTint, color: T.aInk, border: `1px solid ${T.accent}`, fontWeight: 500 }}>{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Details */}
                <div>
                  <h3 style={{ fontFamily: T.serif, fontSize: 36, fontWeight: 300, lineHeight: 1.02, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                    The <em style={{ fontStyle: 'italic', color: T.aInk }}>everyday</em>
                    <br />{activeConfigName}.
                  </h3>

                  {/* Stats grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, margin: '24px 0 0' }}>
                    {[
                      { l: 'Towers', v: project.towers ? String(project.towers) : '—', s: '' },
                      { l: 'Floors', v: project.floorsPerTower ? String(project.floorsPerTower) : '—', s: 'per tower' },
                      { l: 'Available', v: String(availableForConfig.length), s: 'units' },
                    ].map((stat, i) => (
                      <div key={stat.l} style={{ padding: '16px 0', borderLeft: i > 0 ? `1px solid ${T.line}` : 'none', paddingLeft: i > 0 ? 18 : 0 }}>
                        <div style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted, fontWeight: 500 }}>{stat.l}</div>
                        <div style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 300, lineHeight: 1.1, letterSpacing: '-0.01em', marginTop: 4 }}>
                          {stat.v} <small style={{ fontFamily: 'system-ui', fontSize: 12, color: T.muted, fontWeight: 400 }}>{stat.s}</small>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Price card */}
                  <div style={{ marginTop: 24, padding: '22px 24px', background: T.ink, color: '#fff', borderRadius: 16, display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>Starting from</div>
                      <div style={{ fontFamily: T.serif, fontSize: 38, fontWeight: 300, letterSpacing: '-0.02em', marginTop: 2, lineHeight: 1.05 }}>
                        {fmtPrice(project.priceMin)}
                        {project.priceMax && project.priceMax !== project.priceMin && (
                          <small style={{ fontFamily: 'system-ui', fontSize: 14, opacity: 0.5 }}> – {fmtPrice(project.priceMax)}</small>
                        )}
                      </div>
                      {emiMonthly && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>EMI from <b style={{ color: '#fff' }}>₹{emiMonthly.toLocaleString('en-IN')}</b> · 20 yr · 8.5%</div>}
                    </div>
                    <button
                      onClick={() => navigate('/customer/meeting', { state: { projectId: project.id, builderId: project.builderId, builderName: project.builderName, projectName: project.name, city: project.city } })}
                      style={{ background: T.accent, color: T.aDeep, border: 'none', padding: '12px 22px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
                      Reserve
                    </button>
                  </div>

                  {/* Available units list */}
                  {availableForConfig.length > 0 && (
                    <div style={{ marginTop: 22 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: T.muted, marginBottom: 10 }}>
                        <span>Available units</span>
                        <b style={{ color: T.ink, fontWeight: 500 }}>{availableForConfig.length} left</b>
                      </div>
                      {availableForConfig.slice(0, 4).map(unit => (
                        <div key={unit.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', alignItems: 'center', padding: '13px 0', borderTop: `1px solid ${T.line}`, gap: 10 }}>
                          <span style={{ fontFamily: T.mono, fontSize: 13, color: T.ink, fontWeight: 600 }}>{unit.id}</span>
                          <span style={{ fontSize: 13, color: T.ink2 }}>F{unit.floor} <span style={{ color: T.muted }}>· Tower {unit.tower}</span></span>
                          <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600, color: T.ink }}>
                            {project.priceMin ? fmtPrice(Math.round(project.priceMin * (1 + (unit.floor - 1) * 0.005))) : '—'}
                          </span>
                          <button style={{ color: T.aInk, fontSize: 12.5, fontWeight: 500, border: `1px solid ${T.accent}`, padding: '6px 12px', borderRadius: 999, background: T.aTint, cursor: 'pointer' }}>
                            View
                          </button>
                        </div>
                      ))}
                      {availableForConfig.length > 4 && (
                        <div style={{ paddingTop: 10, fontSize: 12, color: T.aInk, fontWeight: 500 }}>
                          + {availableForConfig.length - 4} more available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── FLOOR PLANS ──────────────────────────────────────────────────── */}
        {configs.length > 0 && (
          <section style={{ maxWidth: 1100, margin: '96px auto 0', padding: '0 24px' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'end', gap: 28, marginBottom: 36 }}>
              <div>
                <div style={sk}>— Design</div>
                <h2 style={secH2}>
                  Every sq ft{' '}
                  <em style={{ fontStyle: 'italic', color: T.aInk }}>purposefully designed.</em>
                </h2>
              </div>
              <div style={{ color: T.muted, fontSize: 14, maxWidth: 380, textAlign: 'right', marginLeft: 'auto', lineHeight: 1.5 }}>
                {floorPlanDocs.length > 0
                  ? 'Builder-provided floor plans — exact layouts as designed.'
                  : 'Indicative layouts — detailed drawings available on request.'}
              </div>
            </div>

            {/* Config tabs */}
            {configs.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
                {configs.map((c, i) => (
                  <button key={c} onClick={() => setActiveConfig(i)}
                    style={{ border: `1px solid ${activeConfig === i ? T.aInk : T.line}`, background: activeConfig === i ? T.ink : T.bg2, color: activeConfig === i ? '#fff' : T.ink2, padding: '10px 24px', borderRadius: 999, cursor: 'pointer', fontSize: 13.5, fontWeight: 500, transition: 'all .15s' }}>
                    {c}
                  </button>
                ))}
              </div>
            )}

            {/* Main grid: plan image + spec panel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 40, alignItems: 'start', background: T.bgCream, borderRadius: 28, padding: '40px 44px' }}>

              {/* Left — floor plan */}
              <div>
                <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${T.line}`, overflow: 'hidden', position: 'relative', boxShadow: '0 2px 16px rgba(14,20,17,0.06)' }}>
                  {floorPlanDocs[activeConfig] ? (
                    <img
                      src={floorPlanDocs[activeConfig].fileUrl}
                      alt={`${activeConfigName} floor plan`}
                      style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: 500 }}
                    />
                  ) : floorPlanDocs.length === 1 ? (
                    <img
                      src={floorPlanDocs[0].fileUrl}
                      alt={`${activeConfigName} floor plan`}
                      style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: 500 }}
                    />
                  ) : (
                    <div style={{ aspectRatio: '4 / 3.2' }}>
                      <FloorPlanSVG bhk={activeConfigName} locality={project.locality} />
                    </div>
                  )}
                  {floorPlanDocs.length === 0 && (
                    <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(14,20,17,0.55)', backdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.85)', padding: '4px 11px', borderRadius: 999, fontSize: 10.5, fontWeight: 500 }}>
                      Indicative layout
                    </div>
                  )}
                </div>

                {/* Caption + download */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted }}>
                    {activeConfigName} · {floorPlanDocs.length > 0 ? 'Builder provided' : 'Indicative layout'}
                  </span>
                  {(floorPlanDocs[activeConfig] ?? floorPlanDocs[0]) && (
                    <a href={(floorPlanDocs[activeConfig] ?? floorPlanDocs[0]).fileUrl}
                      download target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: T.aInk, textDecoration: 'none', border: `1px solid ${T.accent}`, borderRadius: 999, padding: '5px 14px', background: T.aTint }}>
                      <Download size={11} /> Download Plan
                    </a>
                  )}
                </div>
              </div>

              {/* Right — specs */}
              <div>
                <h3 style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1.05, margin: '0 0 6px' }}>
                  The <em style={{ fontStyle: 'italic', color: T.aInk }}>{activeConfigName || configs[0]}</em>
                </h3>
                <p style={{ color: T.muted, fontSize: 14, margin: '0 0 26px', lineHeight: 1.55 }}>
                  {specs.carpet} sqft carpet · {specs.superBuiltUp} sqft super built-up
                  {floorPlanDocs.length === 0 && ' · indicative'}
                </p>

                {/* Area stat cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 26 }}>
                  {[
                    { l: 'Carpet Area',     v: specs.carpet,                                                    s: 'sq ft' },
                    { l: 'Super Built-up',  v: specs.superBuiltUp,                                              s: 'sq ft' },
                    { l: 'Towers',          v: project.towers ? String(project.towers) : '—',                   s: '' },
                    { l: 'Floors',          v: project.floorsPerTower ? String(project.floorsPerTower) : '—',   s: 'per tower' },
                  ].map(stat => (
                    <div key={stat.l} style={{ padding: '14px 16px', background: '#fff', borderRadius: 14, border: `1px solid ${T.line}` }}>
                      <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.muted, fontWeight: 600, marginBottom: 5 }}>{stat.l}</div>
                      <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 300, letterSpacing: '-0.01em', lineHeight: 1.15 }}>
                        {stat.v}
                        {stat.s && <small style={{ fontFamily: 'system-ui', fontSize: 10.5, color: T.muted, fontWeight: 400, marginLeft: 4 }}>{stat.s}</small>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Room breakdown list */}
                <div style={{ marginBottom: 26 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted, marginBottom: 10 }}>
                    — Room breakdown {floorPlanDocs.length === 0 && '(indicative)'}
                  </div>
                  <div style={{ borderTop: `1px solid ${T.line}` }}>
                    {specs.rooms.map(r => (
                      <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.line}` }}>
                        <span style={{ fontSize: 13.5, color: T.ink, fontWeight: 500 }}>{r.name}</span>
                        <span style={{ fontFamily: T.mono, fontSize: 12, color: T.muted }}>{r.size}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price + CTA */}
                <div style={{ background: T.ink, color: '#fff', borderRadius: 16, padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Price range</div>
                    <div style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 300, marginTop: 4, letterSpacing: '-0.01em' }}>
                      {fmtPrice(project.priceMin)}
                      {project.priceMax && project.priceMax !== project.priceMin && (
                        <small style={{ fontFamily: 'system-ui', fontSize: 13, opacity: 0.5 }}> – {fmtPrice(project.priceMax)}</small>
                      )}
                    </div>
                    {project.pricePerSqftMin && (
                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>
                        ₹{project.pricePerSqftMin.toLocaleString('en-IN')}/sqft
                        {project.pricePerSqftMax && project.pricePerSqftMax !== project.pricePerSqftMin
                          ? ` – ₹${project.pricePerSqftMax.toLocaleString('en-IN')}/sqft` : ''}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => navigate('/customer/meeting', { state: { projectId: project.id, builderId: project.builderId, projectName: project.name, city: project.city } })}
                    style={{ background: T.accent, color: T.aDeep, border: 'none', padding: '12px 20px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap' }}>
                    Get Details
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── AMENITIES (dark panel) ────────────────────────────────────────── */}
        {project.amenities && project.amenities.length > 0 && (
          <section style={{ maxWidth: 1100, margin: '96px auto 0', padding: '0 24px' }}>
            <div style={{ background: T.ink, borderRadius: 28, padding: '56px 44px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-40%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, rgba(13,148,136,0.18), transparent 60%)`, pointerEvents: 'none' }} />
              <div style={{ position: 'relative', maxWidth: 640, marginBottom: 40 }}>
                <div style={{ ...sk, color: 'rgba(255,255,255,0.5)' }}>— Lifestyle</div>
                <h2 style={{ ...secH2, color: '#fff', margin: '10px 0 0' }}>
                  Amenities crafted for{' '}
                  <em style={{ fontStyle: 'italic', color: T.accent }}>how you live</em>.
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.65)', marginTop: 14, fontSize: 14, maxWidth: 520, lineHeight: 1.6 }}>
                  {project.amenities.length} world-class amenities — from infinity pools to co-working spaces, designed around your daily rhythm.
                </p>
              </div>
              <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
                {/* Feature card (first amenity, span 2 rows) */}
                {project.amenities[0] && (() => {
                  const { node } = getAmenityMeta(project.amenities![0]);
                  return (
                    <div style={{ gridRow: 'span 2', background: `linear-gradient(160deg, rgba(13,148,136,0.18) 0%, rgba(13,148,136,0.04) 100%)`, border: `1px solid rgba(13,148,136,0.22)`, borderRadius: 16, padding: '28px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ width: 46, height: 46, borderRadius: 10, background: T.accent, color: T.aDeep, display: 'grid', placeItems: 'center', marginBottom: 18 }}>
                        {node}
                      </div>
                      <div>
                        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 28, fontWeight: 400, lineHeight: 1.15, color: '#fff', marginBottom: 6 }}>
                          {project.amenities[0]}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>A signature feature designed to elevate your everyday.</div>
                      </div>
                    </div>
                  );
                })()}
                {/* Regular amenity cards */}
                {project.amenities.slice(1, 9).map(amenity => {
                  const { node } = getAmenityMeta(amenity);
                  return (
                    <div key={amenity} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '22px 22px 24px', transition: 'background .2s ease', cursor: 'default' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(13,148,136,0.14)', color: T.accent, display: 'grid', placeItems: 'center', marginBottom: 16 }}>
                        {node}
                      </div>
                      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 18, fontWeight: 400, lineHeight: 1.15, color: '#fff' }}>{amenity}</div>
                    </div>
                  );
                })}
              </div>
              {project.amenities.length > 9 && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {project.amenities.slice(9).map(a => (
                    <span key={a} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>{a}</span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── CONSTRUCTION SPECIFICATIONS ──────────────────────────────────── */}
        {project.specifications && Object.values(project.specifications).some(v => v) && (
          <section style={{ maxWidth: 1100, margin: '96px auto 0', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'end', gap: 28, marginBottom: 32 }}>
              <div>
                <div style={sk}>— Build quality</div>
                <h2 style={secH2}>Engineered to <em style={{ fontStyle: 'italic', color: T.aInk }}>last.</em></h2>
              </div>
              <div style={{ color: T.muted, fontSize: 14, maxWidth: 420, textAlign: 'right', marginLeft: 'auto', lineHeight: 1.5 }}>
                Construction specifications — materials, finishes and systems as filed with RERA.
              </div>
            </div>
            <div style={{ background: T.bg2, borderRadius: 24, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
              {[
                ['Structure',   project.specifications.structure],
                ['Flooring',    project.specifications.flooring],
                ['Main Doors',  project.specifications.doors],
                ['Windows',     project.specifications.windows],
                ['Electrical',  project.specifications.electrical],
                ['Plumbing',    project.specifications.plumbing],
                ['Kitchen',     project.specifications.kitchen],
                ['Bathrooms',   project.specifications.bathrooms],
                ['Painting',    project.specifications.painting],
              ].filter(([, v]) => v).map(([label, value], i, arr) => (
                <div key={label as string} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, padding: '16px 28px', borderBottom: i < arr.length - 1 ? `1px solid ${T.line}` : 'none', alignItems: 'center' }}>
                  <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: T.muted, fontWeight: 500 }}>{label as string}</span>
                  <span style={{ fontSize: 14, color: T.ink, fontWeight: 400, lineHeight: 1.5 }}>{value as string}</span>
                </div>
              ))}
              {project.clubhouseAreaSqft && (
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, padding: '16px 28px', borderTop: `1px solid ${T.line}`, alignItems: 'center' }}>
                  <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: T.muted, fontWeight: 500 }}>Clubhouse</span>
                  <span style={{ fontSize: 14, color: T.ink, fontWeight: 400 }}>{project.clubhouseAreaSqft.toLocaleString('en-IN')} sqft</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Pricing moved to Payment/EMI section below */}

        {/* ── LOCATION ─────────────────────────────────────────────────────── */}
        {hasLocation && (
          <section style={{ maxWidth: 1100, margin: '96px auto 0', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'end', gap: 28, marginBottom: 32 }}>
              <div>
                <div style={sk}>— The neighbourhood</div>
                <h2 style={secH2}>Where <em style={{ fontStyle: 'italic', color: T.aInk }}>{project.locality ?? project.city ?? 'it'}</em> bends to life.</h2>
              </div>
              <div style={{ color: T.muted, fontSize: 14, maxWidth: 420, textAlign: 'right', marginLeft: 'auto', lineHeight: 1.5 }}>
                {[project.address, project.locality, project.city].filter(Boolean).join(', ')}
                {project.landmark && ` · Near ${project.landmark}`}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 28, alignItems: 'stretch' }}>

              {/* ── Map panel ── */}
              <div style={{ borderRadius: 22, overflow: 'hidden', border: `1px solid ${T.line}`, background: T.bg2, minHeight: 480, position: 'relative' }}>
                {mapCoords ? (
                  leafletReady
                    ? <div ref={leafletDivRef} style={{ width: '100%', height: '100%', minHeight: 480 }} />
                    : <div style={{ width: '100%', height: '100%', minHeight: 480, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader2 size={24} className="animate-spin" style={{ color: T.aInk }} />
                      </div>
                ) : mapEmbedUrl ? (
                  <iframe src={mapEmbedUrl} title="Project Location"
                    style={{ width: '100%', height: '100%', minHeight: 480, border: 0, display: 'block' }}
                    loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                ) : (
                  <div style={{ width: '100%', height: '100%', minHeight: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: `linear-gradient(135deg, ${T.aTint} 0%, #ddeee1 100%)` }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff', border: `1px solid ${T.accent}`, boxShadow: `0 4px 18px rgba(43,66,50,0.14)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={26} style={{ color: T.aInk }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 15, color: T.ink, fontWeight: 500, margin: 0 }}>{[project.locality, project.city].filter(Boolean).join(', ')}</p>
                      {project.address && <p style={{ fontSize: 13, color: T.muted, margin: '4px 0 0' }}>{project.address}</p>}
                    </div>
                    {project.googleMapsLink && (
                      <a href={project.googleMapsLink} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.aInk, fontSize: 13, fontWeight: 600, textDecoration: 'none', padding: '8px 16px', borderRadius: 999, background: '#fff', border: `1px solid ${T.accent}` }}>
                        <Navigation size={12} /> Open in Maps <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                )}

                {/* Project name pin card — bottom left */}
                <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)', border: `1px solid ${T.line}`, borderRadius: 12, padding: '8px 14px', fontSize: 11.5, lineHeight: 1.3, boxShadow: '0 6px 16px rgba(14,20,17,0.07)', whiteSpace: 'nowrap' }}>
                  <b style={{ fontWeight: 600, color: T.ink }}>{project.name}</b>
                  {mapCoords && <div style={{ color: T.muted, fontFamily: T.mono, fontSize: 10.5, marginTop: 2 }}>{mapCoords.lat.toFixed(4)}° N, {mapCoords.lng.toFixed(4)}° E</div>}
                  {!mapCoords && project.city && <div style={{ color: T.muted, fontFamily: T.mono, fontSize: 10.5, marginTop: 2 }}>{project.locality ?? project.city}</div>}
                </div>

                {/* Directions link — top right */}
                {project.googleMapsLink && (
                  <a href={project.googleMapsLink} target="_blank" rel="noopener noreferrer"
                    style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(6px)', border: `1px solid ${T.line}`, padding: '6px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, color: T.aInk, textDecoration: 'none', boxShadow: '0 2px 8px rgba(14,20,17,0.06)' }}>
                    <Navigation size={11} /> Directions
                  </a>
                )}
              </div>

              {/* ── What's close ── */}
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>
                  — What's close
                </div>

                {/* Category filter tabs */}
                {nearbyInRange.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    {(['all', 'hospital', 'school', 'transit', 'mall', 'park', 'supermarket'] as const)
                      .filter(cat => cat === 'all' || (catCounts[cat as NearbyPlace['category']] ?? 0) > 0)
                      .map(cat => {
                        const isAll    = cat === 'all';
                        const isActive = activeCat === cat;
                        const label    = isAll ? 'All' : NEARBY_CAT[cat].label;
                        const count    = isAll ? nearbyInRange.length : (catCounts[cat as NearbyPlace['category']] ?? 0);
                        return (
                          <button key={cat}
                            onClick={() => setActiveCat(cat)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '5px 11px', borderRadius: 999,
                              border: `1px solid ${isActive ? T.aInk : T.line}`,
                              background: isActive ? T.aInk : '#fff',
                              color: isActive ? '#fff' : T.muted,
                              cursor: 'pointer', fontSize: 11.5, fontWeight: 500,
                              transition: 'all .12s ease',
                            }}>
                            {!isAll && getCatIcon(cat as NearbyPlace['category'], 11)}
                            {label}
                            <span style={{
                              background: isActive ? 'rgba(255,255,255,0.2)' : T.aTint,
                              color: isActive ? '#fff' : T.aInk,
                              borderRadius: 999, padding: '1px 6px', fontSize: 10.5, fontWeight: 600,
                            }}>{count}</span>
                          </button>
                        );
                      })}
                  </div>
                )}

                {/* Loading state */}
                {nearbyLoading && nearby.length === 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 0', color: T.muted, fontSize: 13 }}>
                    <Loader2 size={14} className="animate-spin" style={{ color: T.aInk }} />
                    Fetching nearby places…
                  </div>
                )}

                {/* Commute rows — real Overpass data */}
                <div style={{ borderTop: `1px solid ${T.line}` }}>
                  {visibleNearby.slice(0, activeCat === 'all' ? 6 : 10).map(p => {
                    const { label } = NEARBY_CAT[p.category];
                    const mins = Math.round(p.distanceKm * 3.5);
                    return (
                      <a key={p.id}
                        href={`https://maps.google.com/maps?q=${p.lat},${p.lng}`}
                        target="_blank" rel="noreferrer"
                        style={{ display: 'grid', gridTemplateColumns: '38px 1fr auto auto', gap: 14, padding: '16px 0', borderBottom: `1px solid ${T.line}`, alignItems: 'center', textDecoration: 'none' }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: T.aTint, color: T.aInk, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          {getCatIcon(p.category, 16)}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: T.ink, lineHeight: 1.2 }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{label}</div>
                        </div>
                        <div style={{ fontFamily: T.mono, fontSize: 12.5, color: T.ink2, fontWeight: 500, textAlign: 'right' }}>
                          {p.distanceKm.toFixed(1)} km
                        </div>
                        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 20, color: T.aInk, marginLeft: 14, minWidth: 60, textAlign: 'right', lineHeight: 1 }}>
                          {mins < 1 ? 'walk' : mins}
                          {mins >= 1 && <small style={{ fontFamily: 'system-ui', fontSize: 11, color: T.muted, marginLeft: 2, fontStyle: 'normal' }}>min</small>}
                        </div>
                      </a>
                    );
                  })}

                  {/* Fallback: project's nearbyHighlights if Overpass returned nothing */}
                  {!nearbyLoading && visibleNearby.length === 0 && project.nearbyHighlights && project.nearbyHighlights.length > 0 && (
                    project.nearbyHighlights.map((h, i) => (
                      <div key={h} style={{ display: 'grid', gridTemplateColumns: '38px 1fr', gap: 14, padding: '16px 0', borderBottom: `1px solid ${T.line}`, alignItems: 'center' }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: T.aTint, color: T.aInk, display: 'grid', placeItems: 'center' }}>
                          <MapPin size={16} />
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: T.ink }}>{h}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* Directions footer */}
                {project.googleMapsLink && (
                  <div style={{ marginTop: 20 }}>
                    <a href={project.googleMapsLink} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: T.aInk, fontSize: 13, fontWeight: 600, textDecoration: 'none', borderBottom: `1px solid ${T.accent}`, paddingBottom: 1 }}>
                      <Navigation size={13} /> Get directions <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* ── Neighbourhood News ────────────────────────────────────────── */}
            {(newsLoading || newsItems.length > 0) && (
              <div style={{ marginTop: 64 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
                  <div>
                    <div style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>
                      — In the news
                    </div>
                    <h2 style={{ fontSize: 28, fontWeight: 700, color: T.ink, margin: 0, fontFamily: T.serif, lineHeight: 1.2 }}>
                      What's happening in{' '}
                      <em style={{ fontStyle: 'italic', color: T.aInk }}>{project.locality ?? project.city}</em>
                    </h2>
                  </div>
                  {newsLoading && <Loader2 size={16} className="animate-spin" style={{ color: T.aInk }} />}
                  {!newsLoading && newsItems.length > 0 && (
                    <a
                      href={`https://news.google.com/search?q=${encodeURIComponent((project.locality || project.city || '') + ' real estate')}&hl=en-IN`}
                      target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: T.aInk, fontWeight: 600, textDecoration: 'none', borderBottom: `1px solid ${T.accent}`, paddingBottom: 1 }}>
                      All stories <ExternalLink size={11} />
                    </a>
                  )}
                </div>

                {newsItems.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 20, alignItems: 'start' }}>
                    {/* Featured first article */}
                    {newsItems[0] && (
                      <a href={newsItems[0].url} target="_blank" rel="noopener noreferrer"
                        style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', background: T.aTint, borderRadius: 22, overflow: 'hidden', border: `1px solid ${T.accent}`, transition: 'box-shadow 0.2s', gridRow: 'span 2' }}>
                        <div style={{ padding: '28px 28px 20px', background: `linear-gradient(145deg, ${T.aDeep} 0%, #3C5A45 100%)`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 160 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>
                            <Newspaper size={9} /> Real Estate
                          </span>
                          <h3 style={{ fontSize: 19, fontWeight: 700, color: '#fff', lineHeight: 1.35, margin: 0 }}>{newsItems[0].title}</h3>
                        </div>
                        <div style={{ padding: '18px 28px 22px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          {newsItems[0].description && (
                            <p style={{ fontSize: 13.5, color: T.ink2, lineHeight: 1.55, margin: '0 0 16px' }}>{newsItems[0].description}…</p>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: `1px solid ${T.accent}` }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.aInk }}>{newsItems[0].source}</span>
                            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted }}>{newsItems[0].date}</span>
                          </div>
                        </div>
                      </a>
                    )}

                    {/* Right column — 4 compact cards in 2×2 grid + 1 wide row */}
                    <div style={{ display: 'contents' }}>
                      {newsItems.slice(1, 5).map((item, i) => (
                        <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                          style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: T.bg2, borderRadius: 18, padding: '20px 22px', border: `1px solid ${T.line}`, minHeight: 130, transition: 'border-color 0.15s' }}>
                          <div>
                            <span style={{ display: 'inline-block', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.aInk, marginBottom: 10 }}>Property</span>
                            <h4 style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, lineHeight: 1.4, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h4>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.line}` }}>
                            <span style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>{item.source}</span>
                            <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted }}>{item.date}</span>
                          </div>
                        </a>
                      ))}
                    </div>

                    {/* Full-width 6th article */}
                    {newsItems[5] && (
                      <a href={newsItems[5].url} target="_blank" rel="noopener noreferrer"
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 18, background: T.bg2, borderRadius: 18, padding: '18px 22px', border: `1px solid ${T.line}`, gridColumn: '2 / span 2' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: T.aTint, border: `1px solid ${T.accent}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          <Newspaper size={18} style={{ color: T.aInk }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, margin: '0 0 5px', lineHeight: 1.35 }}>{newsItems[5].title}</h4>
                          <div style={{ display: 'flex', gap: 10, color: T.muted, fontSize: 11.5 }}>
                            <span>{newsItems[5].source}</span>
                            <span>·</span>
                            <span style={{ fontFamily: T.mono }}>{newsItems[5].date}</span>
                          </div>
                        </div>
                        <ExternalLink size={13} style={{ color: T.muted, flexShrink: 0 }} />
                      </a>
                    )}
                  </div>
                )}

                {/* Loading skeleton */}
                {newsLoading && newsItems.length === 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 20 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ borderRadius: 18, background: T.bg3, height: i === 0 ? 280 : 140, animation: 'pulse 2s infinite' }} />
                    ))}
                  </div>
                )}
              </div>
            )}
          {/* ── Builder-provided Location Advantages ── */}
          {project.locationAdvantages && project.locationAdvantages.filter(a => a.name).length > 0 && (
            <div style={{ marginTop: 64 }}>
              <div style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 14 }}>
                — Distance guide
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                {project.locationAdvantages.filter(a => a.name).map((adv, i) => (
                  <div key={i} style={{ padding: '16px 18px', background: T.bg2, border: `1px solid ${T.line}`, borderRadius: 14, display: 'grid', gridTemplateColumns: '34px 1fr auto', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: T.aTint, color: T.aInk, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700 }}>
                      {adv.category.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: T.ink, lineHeight: 1.2 }}>{adv.name}</div>
                      <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>{adv.category}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {adv.driveMinutes && (
                        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 18, color: T.aInk, lineHeight: 1 }}>
                          {adv.driveMinutes}<small style={{ fontFamily: 'system-ui', fontSize: 10, color: T.muted, fontStyle: 'normal', marginLeft: 2 }}>min</small>
                        </div>
                      )}
                      {adv.distanceKm && (
                        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, marginTop: 2 }}>{adv.distanceKm} km</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </section>
        )}

        {/* ── CONSTRUCTION PROGRESS ────────────────────────────────────────── */}
        {project.possessionDate && (
          <section style={{ maxWidth: 1100, margin: '96px auto 0', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'end', gap: 28, marginBottom: 32 }}>
              <div>
                <div style={sk}>— Construction live</div>
                <h2 style={secH2}>
                  We're <em style={{ fontStyle: 'italic', color: T.aInk }}>on track</em> for your keys.
                </h2>
              </div>
              <div style={{ color: T.muted, fontSize: 14, maxWidth: 420, textAlign: 'right', marginLeft: 'auto', lineHeight: 1.5 }}>
                {project.status === 'UNDER_CONSTRUCTION'
                  ? `Tower structure in progress. Possession scheduled for ${new Date(project.possessionDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}.`
                  : `Possession: ${new Date(project.possessionDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}.`}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
              {/* Timeline card */}
              <div style={{ background: T.bg2, borderRadius: 22, padding: '32px 36px' }}>
                <h3 style={{ margin: '0 0 6px', fontFamily: T.serif, fontSize: 28, fontWeight: 300, letterSpacing: '-0.02em' }}>
                  The <em style={{ fontStyle: 'italic', color: T.aInk }}>build</em>, stage by stage.
                </h3>
                <div style={{ color: T.muted, fontSize: 12.5, marginBottom: 22 }}>
                  Possession: {new Date(project.possessionDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </div>

                {/* Overall progress bar */}
                {(() => {
                  const stagePcts: Record<string, number> = {
                    PRE_LAUNCH: 8, NEW_LAUNCH: 15, LAUNCHED: 25,
                    UNDER_CONSTRUCTION: 60, CLOSING_SOON: 88, READY_TO_MOVE: 100,
                  };
                  const pct = stagePcts[project.status] ?? 50;
                  return (
                    <>
                      <div style={{ height: 6, background: T.line, borderRadius: 999, overflow: 'hidden', marginBottom: 6 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: T.aDeep, borderRadius: 999 }} />
                      </div>
                      <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                        <span>Project Start</span>
                        <b style={{ color: T.ink, fontWeight: 600 }}>{pct}%</b>
                        <span>Possession</span>
                      </div>
                    </>
                  );
                })()}

                {/* Stage dots */}
                {(() => {
                  const stages = [
                    { name: 'Land approvals & foundation', detail: 'Site clearance, pile cap + raft slab' },
                    { name: 'Structure & superstructure', detail: 'Slab work, floors rising per tower' },
                    { name: 'Façade glazing & MEP rough-in', detail: 'External finish, plumbing & electrical rough-in' },
                    { name: 'Interior fit-out & landscaping', detail: 'Marble, woodwork, podium gardens' },
                    { name: 'Snagging, OC & possession', detail: `Buyer walkthroughs · ${new Date(project.possessionDate!).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` },
                  ];
                  const stageMap: Record<string, number> = {
                    PRE_LAUNCH: 0, NEW_LAUNCH: 0, LAUNCHED: 1,
                    UNDER_CONSTRUCTION: 2, CLOSING_SOON: 3, READY_TO_MOVE: 4,
                  };
                  const currIdx = stageMap[project.status] ?? 2;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {stages.map((stage, i) => {
                        const done = i < currIdx;
                        const curr = i === currIdx;
                        return (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: '26px 1fr', gap: 14, alignItems: 'start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{
                                width: 14, height: 14, borderRadius: '50%',
                                border: `2px solid ${done || curr ? T.aDeep : T.line}`,
                                background: done ? T.aDeep : curr ? '#fff' : T.bg2,
                                boxShadow: curr ? `0 0 0 3px rgba(43,66,50,0.14)` : 'none',
                                flexShrink: 0, marginTop: 2,
                              }} />
                              {i < stages.length - 1 && (
                                <div style={{ width: 2, height: 24, background: done ? T.aDeep : T.line, marginTop: 3, marginBottom: 3 }} />
                              )}
                            </div>
                            <div style={{ paddingBottom: i < stages.length - 1 ? 0 : 0 }}>
                              <div style={{ fontSize: 14, fontWeight: curr ? 600 : 500, color: curr ? T.ink : done ? T.ink2 : T.muted }}>{stage.name}</div>
                              <div style={{ fontSize: 12.5, color: T.muted, marginTop: 2, marginBottom: i < stages.length - 1 ? 6 : 0 }}>{stage.detail}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Visual building panel */}
              <div style={{ borderRadius: 22, overflow: 'hidden', position: 'relative', minHeight: 360, background: 'linear-gradient(180deg, #DCE6F1 0%, #ECF1F7 60%, #F4F4F0 100%)' }}>
                <div style={{ position: 'absolute', top: 18, left: 18, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', padding: '6px 12px', borderRadius: 999, fontSize: 11.5, color: T.ink, fontWeight: 500, border: `1px solid ${T.line}` }}>
                  Status · <b style={{ color: T.aInk }}>{STATUS_LABELS[project.status] || project.status}</b>
                </div>
                <svg viewBox="0 0 600 480" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', minHeight: 360, display: 'block' }}>
                  <defs>
                    <linearGradient id="skyGp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#DCE6F1"/><stop offset="60%" stopColor="#ECF1F7"/><stop offset="100%" stopColor="#F4F4F0"/>
                    </linearGradient>
                    <linearGradient id="twrGp" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#2B3D33"/><stop offset="100%" stopColor="#3C5A45"/>
                    </linearGradient>
                  </defs>
                  <rect width="600" height="480" fill="url(#skyGp)"/>
                  <rect y="380" width="600" height="100" fill="#E8E5DE"/>
                  <g fill="#3C5A45" opacity="0.65">
                    <circle cx="58" cy="381" r="22"/><circle cx="42" cy="393" r="14"/>
                    <circle cx="556" cy="383" r="18"/><circle cx="578" cy="394" r="14"/>
                  </g>
                  <rect x="110" y="160" width="80" height="220" fill="url(#twrGp)"/>
                  <rect x="110" y="160" width="80" height="100" fill="rgba(220,230,241,0.38)"/>
                  <g stroke="rgba(216,229,218,0.3)" strokeWidth="0.8">
                    {[180,200,220,240,260,280,300,320,340].map(y=><line key={y} x1="110" y1={y} x2="190" y2={y}/>)}
                    {[130,150,170].map(x=><line key={x} x1={x} y1="160" x2={x} y2="380"/>)}
                  </g>
                  <rect x="245" y="110" width="100" height="270" fill="url(#twrGp)"/>
                  <rect x="245" y="110" width="100" height="270" fill="rgba(220,230,241,0.38)"/>
                  <g stroke="rgba(216,229,218,0.3)" strokeWidth="0.8">
                    {[140,170,200,230,260,290,320,350].map(y=><line key={y} x1="245" y1={y} x2="345" y2={y}/>)}
                    {[270,295,320].map(x=><line key={x} x1={x} y1="110" x2={x} y2="380"/>)}
                  </g>
                  <rect x="400" y="150" width="80" height="230" fill="url(#twrGp)"/>
                  <rect x="400" y="150" width="80" height="110" fill="rgba(220,230,241,0.4)"/>
                  <g stroke="#7A5E2F" strokeWidth="1.2" opacity="0.7">
                    <line x1="400" y1="260" x2="480" y2="260"/>
                    <line x1="400" y1="295" x2="480" y2="295"/>
                    <line x1="410" y1="260" x2="410" y2="380"/>
                    <line x1="470" y1="260" x2="470" y2="380"/>
                  </g>
                  <g stroke={T.ink} strokeWidth="1.6" fill="none">
                    <line x1="295" y1="110" x2="295" y2="42"/>
                    <line x1="225" y1="54" x2="365" y2="54"/>
                    <line x1="295" y1="54" x2="330" y2="95"/>
                  </g>
                </svg>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '18px 22px 22px', background: 'linear-gradient(to top, rgba(14,20,17,0.78), transparent)', color: '#fff', fontFamily: T.serif, fontStyle: 'italic', fontSize: 20, lineHeight: 1.2, fontWeight: 300 }}>
                  {project.towers ? `${project.towers} tower${project.towers > 1 ? 's' : ''}${project.floorsPerTower ? `, ${project.floorsPerTower} floors each` : ''}` : 'Construction in progress'}
                  <small style={{ fontFamily: 'system-ui', fontStyle: 'normal', fontSize: 12, display: 'block', marginTop: 4, color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>
                    {project.totalUnits ? `${project.totalUnits} total homes · verified timeline` : 'Verified construction timeline'}
                  </small>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── PAYMENT / EMI ─────────────────────────────────────────────────── */}
        {project.priceMin && (
          <section style={{ maxWidth: 1100, margin: '96px auto 0', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'end', gap: 28, marginBottom: 32 }}>
              <div>
                <div style={sk}>— Pay over time</div>
                <h2 style={secH2}>A plan that <em style={{ fontStyle: 'italic', color: T.aInk }}>flexes</em><br />with the build.</h2>
              </div>
              <div style={{ color: T.muted, fontSize: 14, maxWidth: 400, textAlign: 'right', marginLeft: 'auto', lineHeight: 1.5 }}>
                SBI, HDFC and ICICI have pre-sanctioned home loans at 8.5% — pre-EMI runs only till handover.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
              {/* Payment milestone plan */}
              <div style={{ border: `1px solid ${T.line}`, borderRadius: 22, padding: '32px 34px', background: T.bg }}>
                {project.paymentPlans && project.paymentPlans.length > 0 ? (
                  <>
                    <h3 style={{ margin: '0 0 6px', fontFamily: T.serif, fontSize: 26, fontWeight: 300, letterSpacing: '-0.02em' }}>
                      Payment <em style={{ fontStyle: 'italic', color: T.aInk }}>plans</em>
                    </h3>
                    <div style={{ color: T.muted, fontSize: 12.5, marginBottom: 22 }}>Builder-provided options for {fmtPrice(project.priceMin)} onwards</div>
                    {project.paymentPlans.map((plan, i) => (
                      <div key={i} style={{ padding: '16px 0', borderTop: `1px solid ${T.line}`, borderBottom: i === project.paymentPlans!.length - 1 ? `1px solid ${T.line}` : 'none', display: 'grid', gridTemplateColumns: '36px 1fr', gap: 14, alignItems: 'start' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.aTint, color: T.aInk, display: 'grid', placeItems: 'center', fontFamily: T.mono, fontSize: 11, fontWeight: 600, border: `1px solid ${T.accent}` }}>
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{plan.name}</div>
                          <div style={{ fontSize: 13, color: T.muted, marginTop: 3, lineHeight: 1.5 }}>{plan.description}</div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <h3 style={{ margin: '0 0 6px', fontFamily: T.serif, fontSize: 26, fontWeight: 300, letterSpacing: '-0.02em' }}>
                      The <em style={{ fontStyle: 'italic', color: T.aInk }}>20 : 30 : 50</em> plan
                    </h3>
                    <div style={{ color: T.muted, fontSize: 12.5, marginBottom: 22 }}>For a typical {fmtPrice(project.priceMin)} home</div>
                    {[
                      { num: '01', nm: 'Booking & agreement', sub: '21 days from token — refundable till sale deed', pct: '20%', amt: fmtPrice(Math.round(project.priceMin! * 0.2)) },
                      { num: '02', nm: 'Foundation milestone', sub: 'Tower-wise — as per construction progress', pct: '10%', amt: fmtPrice(Math.round(project.priceMin! * 0.1)) },
                      { num: '03', nm: 'Slab-wise · 4 milestones', sub: '5% each as the building rises', pct: '20%', amt: fmtPrice(Math.round(project.priceMin! * 0.2)) },
                      { num: '04', nm: 'Finishing & possession', sub: project.possessionDate ? `Key handover · ${new Date(project.possessionDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : 'Key handover on possession', pct: '50%', amt: fmtPrice(Math.round(project.priceMin! * 0.5)) },
                    ].map((m, i, arr) => (
                      <div key={m.num} style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 14, alignItems: 'center', padding: '14px 0', borderTop: `1px solid ${T.line}`, borderBottom: i === arr.length - 1 ? `1px solid ${T.line}` : 'none' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.aTint, color: T.aInk, display: 'grid', placeItems: 'center', fontFamily: T.mono, fontSize: 11, fontWeight: 600, border: `1px solid ${T.accent}` }}>{m.num}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: T.ink }}>{m.nm}</div>
                          <div style={{ fontSize: 12, color: T.muted, marginTop: 1 }}>{m.sub}</div>
                        </div>
                        <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600, color: T.ink, textAlign: 'right' }}>
                          {m.amt}
                          <small style={{ fontFamily: 'system-ui', fontSize: 10.5, color: T.muted, fontWeight: 400, display: 'block' }}>{m.pct}</small>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {(project.maintenanceCharges || project.floorRiseCharges) && (
                  <div style={{ marginTop: 16, padding: '12px 16px', background: T.bg2, borderRadius: 12 }}>
                    {project.maintenanceCharges && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: T.muted, marginBottom: 4 }}>
                        <span>Maintenance</span><span style={{ color: T.ink, fontWeight: 500 }}>₹{project.maintenanceCharges.toLocaleString('en-IN')} /mo</span>
                      </div>
                    )}
                    {project.floorRiseCharges && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: T.muted }}>
                        <span>Floor rise</span><span style={{ color: T.ink, fontWeight: 500 }}>₹{project.floorRiseCharges.toLocaleString('en-IN')} /floor</span>
                      </div>
                    )}
                  </div>
                )}
                <p style={{ fontSize: 12, color: T.muted, marginTop: 14, lineHeight: 1.55 }}>
                  All amounts ex-GST & registration. Stamp duty applicable at slot booking. Subvention available — pre-EMI only till possession.
                </p>
              </div>

              {/* EMI calculator */}
              <div style={{ border: `1px solid ${T.line}`, borderRadius: 22, padding: '32px 34px', background: T.bg }}>
                <h3 style={{ margin: '0 0 6px', fontFamily: T.serif, fontSize: 26, fontWeight: 300, letterSpacing: '-0.02em' }}>
                  Your <em style={{ fontStyle: 'italic', color: T.aInk }}>EMI</em>, live.
                </h3>
                <div style={{ color: T.muted, fontSize: 12.5, marginBottom: 18 }}>
                  Set your loan amount, tenure & rate — see what each month looks like.
                </div>

                {/* Result display */}
                <div style={{ padding: '22px 26px', background: T.aTint, borderRadius: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 18px', border: `1px solid ${T.accent}`, marginBottom: 22 }}>
                  <div>
                    <div style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: T.aInk, fontWeight: 500, opacity: 0.75 }}>Monthly EMI</div>
                    <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.015em', color: T.aDeep, marginTop: 4 }}>
                      ₹{emiMonthlyCalc.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: T.aInk, fontWeight: 500, opacity: 0.75 }}>Total interest</div>
                    <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.015em', color: T.aDeep, marginTop: 4 }}>
                      {totalInterest >= 10_000_000 ? `₹${(totalInterest / 10_000_000).toFixed(2)} Cr` : `₹${(totalInterest / 100_000).toFixed(1)} L`}
                    </div>
                  </div>
                </div>

                {/* Sliders */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'baseline', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: T.ink2 }}>Loan amount</span>
                      <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600, color: T.ink }}>₹{(emiLoanL / 100).toFixed(2)} Cr</span>
                    </div>
                    <input type="range" min={20} max={300} step={5} value={emiLoanL}
                      onChange={e => setEmiLoanL(+e.target.value)}
                      style={{ width: '100%', accentColor: T.aDeep, cursor: 'pointer' }} />
                  </div>
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'baseline', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: T.ink2 }}>Tenure</span>
                      <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600, color: T.ink }}>{emiTenure} yr</span>
                    </div>
                    <input type="range" min={5} max={30} step={1} value={emiTenure}
                      onChange={e => setEmiTenure(+e.target.value)}
                      style={{ width: '100%', accentColor: T.aDeep, cursor: 'pointer' }} />
                  </div>
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'baseline', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: T.ink2 }}>Interest rate</span>
                      <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600, color: T.ink }}>{(emiRate / 10).toFixed(1)}%</span>
                    </div>
                    <input type="range" min={65} max={120} step={1} value={emiRate}
                      onChange={e => setEmiRate(+e.target.value)}
                      style={{ width: '100%', accentColor: T.aDeep, cursor: 'pointer' }} />
                  </div>
                </div>

                <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${T.line}`, fontSize: 12, color: T.muted, display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                  <span><b style={{ color: T.ink2 }}>Pre-approved</b> with</span>
                  <span>SBI · 8.5%</span><span>·</span>
                  <span>HDFC · 8.55%</span><span>·</span>
                  <span>ICICI · 8.6%</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── TRUST / SOCIAL PROOF ──────────────────────────────────────────── */}
        <section style={{ maxWidth: 1100, margin: '96px auto 0', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'end', gap: 28, marginBottom: 32 }}>
            <div>
              <div style={sk}>— Why this holds up</div>
              <h2 style={secH2}>The verified parts<br /><em style={{ fontStyle: 'italic', color: T.aInk }}>(everything that matters).</em></h2>
            </div>
            <div style={{ color: T.muted, fontSize: 14, maxWidth: 420, textAlign: 'right', marginLeft: 'auto', lineHeight: 1.5 }}>
              dealio checks every claim against the RERA filing, builder track record and on-ground inspection. Nothing here is a brochure number.
            </div>
          </div>

          {/* About Developer — full width if builder data available */}
          {(project.builderAbout || project.builderYearEstablished || project.builderDeliveredProjects) && (
            <div style={{ background: T.bgCream, borderRadius: 22, padding: '32px 36px', marginBottom: 28, display: 'grid', gridTemplateColumns: project.builderAbout ? '1fr auto' : '1fr', gap: 32, alignItems: 'start' }}>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: '0.14em', color: T.aInk, textTransform: 'uppercase', marginBottom: 10 }}>— About the developer</div>
                <h3 style={{ margin: '0 0 12px', fontFamily: T.serif, fontSize: 24, fontWeight: 300, letterSpacing: '-0.02em', color: T.ink }}>
                  <em style={{ fontStyle: 'italic', color: T.aInk }}>{project.builderName ?? 'The Developer'}</em>
                </h3>
                {project.builderAbout && (
                  <p style={{ fontSize: 14, color: T.ink2, lineHeight: 1.65, margin: '0 0 18px', maxWidth: 680 }}>{project.builderAbout}</p>
                )}
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  {project.builderYearEstablished && (
                    <div>
                      <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted, marginBottom: 4 }}>Est.</div>
                      <div style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 300, color: T.aInk, lineHeight: 1 }}>{project.builderYearEstablished}</div>
                    </div>
                  )}
                  {project.builderDeliveredProjects && (
                    <div>
                      <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted, marginBottom: 4 }}>Delivered</div>
                      <div style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 300, color: T.aInk, lineHeight: 1 }}>{project.builderDeliveredProjects} <small style={{ fontFamily: 'system-ui', fontSize: 13, color: T.muted, fontWeight: 400 }}>projects</small></div>
                    </div>
                  )}
                  {project.builderWebsite && (
                    <div style={{ alignSelf: 'flex-end' }}>
                      <a href={project.builderWebsite.startsWith('http') ? project.builderWebsite : 'https://' + project.builderWebsite}
                        target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: T.aInk, textDecoration: 'none', borderBottom: `1px solid ${T.accent}` }}>
                        <Globe size={12} /> {project.builderWebsite.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
            {/* Testimonial */}
            <div style={{ background: T.bgCream, borderRadius: 22, padding: '38px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 280 }}>
              <blockquote style={{ margin: '0 0 28px', fontFamily: T.serif, fontSize: 22, fontWeight: 300, fontStyle: 'italic', lineHeight: 1.35, letterSpacing: '-0.015em', color: T.ink }}>
                <span style={{ fontSize: 54, lineHeight: 0.6, color: T.aDeep, verticalAlign: '-9px', marginRight: 4 }}>"</span>
                The construction progress matched everything on the site visit — every milestone exactly on schedule. The team was transparent through every step.
              </blockquote>
              <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: T.accent, color: T.aDeep, display: 'grid', placeItems: 'center', fontFamily: T.serif, fontStyle: 'italic', fontSize: 20, fontWeight: 400 }}>M</div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: T.ink }}>Meera &amp; Karthik</div>
                  <div style={{ fontSize: 12, color: T.muted }}>
                    Booked a {configs[0] || '3 BHK'} · moving in {project.possessionDate ? new Date(project.possessionDate).getFullYear() : 'soon'}
                  </div>
                </div>
                <div style={{ color: T.aDeep, fontSize: 14, letterSpacing: 1 }}>★★★★★</div>
              </div>
            </div>

            {/* Trust stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {([
                project.builderName && {
                  icon: <Star size={18} />,
                  title: project.builderName,
                  sub: 'Established developer · verified delivery track record',
                  badge: 'Verified',
                },
                project.reraNumber && {
                  icon: <CheckCircle2 size={18} />,
                  title: 'RERA Registered',
                  sub: `${project.reraNumber.slice(0, 20)}${project.reraNumber.length > 20 ? '…' : ''}${project.reraState ? ` · ${project.reraState}` : ''}`,
                  badge: 'Open',
                },
                {
                  icon: <Shield size={18} />,
                  title: 'Title insurance',
                  sub: 'Land + construction cover · valid through possession',
                  badge: 'Active',
                },
                (project.soldUnits != null || project.bookedUnits != null) && {
                  icon: <Users size={18} />,
                  title: `${(project.soldUnits ?? 0) + (project.bookedUnits ?? 0)} booked owners`,
                  sub: project.totalUnits
                    ? `${Math.round(((project.soldUnits ?? 0) + (project.bookedUnits ?? 0)) / project.totalUnits * 100)}% of homes claimed · community growing`
                    : 'Community of buyers growing',
                  badge: '★ 4.8',
                },
              ] as const).filter(Boolean).map((tc, i) => tc && (
                <div key={i} style={{ border: `1px solid ${T.line}`, borderRadius: 18, padding: '18px 22px', display: 'grid', gridTemplateColumns: '42px 1fr auto', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: T.aTint, color: T.aInk, display: 'grid', placeItems: 'center' }}>
                    {tc.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: T.ink }}>{tc.title}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 1 }}>{tc.sub}</div>
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.aInk, fontWeight: 500 }}>{tc.badge}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── VIRTUAL TOURS ─────────────────────────────────────────────────── */}
        {tours.length > 0 && (
          <section id="virtual-tours" style={{ maxWidth: 1100, margin: '96px auto 0', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'end', gap: 28, marginBottom: 32 }}>
              <div>
                <div style={sk}>— Virtual tours</div>
                <h2 style={secH2}>Walk through before<br /><em style={{ fontStyle: 'italic', color: T.aInk }}>you visit.</em></h2>
              </div>
            </div>
            {tours.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {tours.map((t, i) => (
                  <button key={i} onClick={() => setActiveTour(i)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 999, border: `1px solid ${activeTour === i ? T.aInk : T.line}`, background: activeTour === i ? T.aInk : '#fff', color: activeTour === i ? '#fff' : T.muted, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                    <Play size={10} fill={activeTour === i ? 'currentColor' : 'none'} />
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            {(() => {
              const tour = tours[activeTour] ?? tours[0];
              if (!tour) return null;
              const embed = toEmbedUrl(tour.url);
              return embed ? (
                <div style={{ borderRadius: 24, overflow: 'hidden', background: T.ink, aspectRatio: '16/9' }}>
                  <iframe src={embed} title={tour.label} style={{ width: '100%', height: '100%', border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking"
                    allowFullScreen />
                </div>
              ) : (
                <a href={tour.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, background: T.aTint, borderRadius: 20, border: `1px solid ${T.accent}`, textDecoration: 'none', transition: 'all .15s ease' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: T.accent, color: T.aDeep, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Play size={22} fill="currentColor" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, color: T.ink, fontSize: 14 }}>{tour.label}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tour.url}</p>
                  </div>
                  <ExternalLink size={15} style={{ color: T.muted, flexShrink: 0 }} />
                </a>
              );
            })()}
          </section>
        )}

        {/* ── RERA ─────────────────────────────────────────────────────────── */}
        {project.reraNumber && (
          <section style={{ maxWidth: 1100, margin: '64px auto 0', padding: '0 24px' }}>
            <div style={{ border: `1px solid ${T.line}`, borderRadius: 22, padding: '28px 32px', display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 18, alignItems: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: T.aTint, color: T.aInk, display: 'grid', placeItems: 'center' }}>
                <Shield size={22} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 2 }}>RERA Registered · {project.reraState || 'State RERA'}</div>
                <div style={{ fontFamily: T.mono, fontSize: 12, color: T.muted }}>
                  {project.reraNumber}
                  {project.reraExpiry && ` · Valid till ${project.reraExpiry.slice(0, 10)}`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: T.aInk, fontWeight: 600 }}>
                <CheckCircle2 size={14} /> Verified &amp; Compliant
              </div>
            </div>
          </section>
        )}

        {/* ── DOCUMENTS ────────────────────────────────────────────────────── */}
        {otherDocs.length > 0 && (
          <section style={{ maxWidth: 1100, margin: '64px auto 0', padding: '0 24px' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={sk}>— Documents</div>
              <h2 style={secH2}>Project <em style={{ fontStyle: 'italic', color: T.aInk }}>documents</em>.</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {otherDocs.map(doc => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: T.bg2, borderRadius: 14, border: `1px solid ${T.line}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: T.aTint, color: T.aInk, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: T.ink }}>{doc.fileName}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: T.muted }}>{doc.docType}</p>
                    </div>
                  </div>
                  <button onClick={async () => {
                    try {
                      const res = await fetch(doc.fileUrl);
                      const blob = await res.blob();
                      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = doc.fileName;
                      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
                    } catch { window.open(doc.fileUrl, '_blank'); }
                  }} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: T.aInk, background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Download size={13} /> Download
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── BOOK A VISIT ─────────────────────────────────────────────────── */}
        <section id="book" style={{ maxWidth: 1100, margin: '96px auto 0', padding: '0 24px' }}>
          <div style={{ background: `linear-gradient(150deg, ${T.aTint} 0%, ${T.bg} 70%)`, border: `1px solid ${T.accent}`, borderRadius: 28, padding: '48px 52px', display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 52, alignItems: 'start' }}>

            {/* LEFT col */}
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: '0.14em', color: T.aInk, textTransform: 'uppercase' as const, marginBottom: 14 }}>— Next step</div>
              <h3 style={{ margin: '0 0 14px', fontFamily: T.serif, fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 300, lineHeight: 1.08, letterSpacing: '-0.02em', color: T.ink }}>
                Walk the site<br />with <em style={{ fontStyle: 'italic', color: T.aInk }}>{project.builderName ?? 'our team'}</em> this week.
              </h3>
              <p style={{ color: T.ink2, fontSize: 14, marginTop: 0, maxWidth: 360, lineHeight: 1.65 }}>
                We'll walk you through the sample flat, the construction progress, and any units that match your shortlist. About 90 minutes — chai at the end.
              </p>

              {/* RM card */}
              <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.75)', border: `1px solid ${T.accent}`, backdropFilter: 'blur(4px)', borderRadius: 14, padding: '14px 16px', display: 'grid', gridTemplateColumns: '42px 1fr', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: T.aDeep, color: T.accent, display: 'grid', placeItems: 'center', fontFamily: T.serif, fontStyle: 'italic', fontSize: 20, flexShrink: 0 }}>
                  {(project.builderName ?? 'S')[0]}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{project.builderName ?? 'Sales Team'}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>Sr. Relationship Manager · {project.city ?? 'Dealio'}</div>
                </div>
              </div>

              {/* Language & trust pills */}
              <div style={{ display: 'flex', gap: 7, marginTop: 14, flexWrap: 'wrap' as const }}>
                {['Replies in 9 min', 'Hindi · Telugu · English', 'No commission to you'].map(pill => (
                  <span key={pill} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '5px 11px', borderRadius: 999, background: 'rgba(255,255,255,0.75)', color: T.ink2, border: `1px solid ${T.line}`, fontWeight: 500 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.aDeep, display: 'inline-block', flexShrink: 0 }} />
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT col – slot picker */}
            <div>
              {/* Day group 1 */}
              {[
                {
                  label: 'Today', sub: new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
                  slots: [
                    { time: '10:00', full: true },
                    { time: '11:30', full: true },
                    { time: '2:00',  hot: true },
                    { time: '3:30' },
                    { time: '5:00' },
                  ],
                },
                {
                  label: 'Tomorrow', sub: new Date(Date.now() + 86400000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
                  slots: [
                    { time: '10:00' },
                    { time: '11:30' },
                    { time: '1:00',  hot: true },
                    { time: '4:00' },
                    { time: '5:30' },
                  ],
                },
              ].map(day => (
                <div key={day.label} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 17, color: T.ink }}>{day.label}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{day.sub}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                    {day.slots.map(slot => {
                      const slotKey = `${day.label}-${slot.time}`;
                      const isFull     = slot.full === true;
                      const isHot      = slot.hot === true;
                      const isSelected = selectedSlot === slotKey;
                      return (
                        <button
                          key={slot.time}
                          disabled={isFull}
                          onClick={() => !isFull && setSelectedSlot(isSelected ? null : slotKey)}
                          style={{
                            padding: '10px 4px',
                            borderRadius: 10,
                            textAlign: 'center',
                            fontFamily: T.mono,
                            fontSize: 11.5,
                            fontWeight: 600,
                            cursor: isFull ? 'not-allowed' : 'pointer',
                            border: `1px solid ${isSelected ? T.aInk : isHot ? '#E0B44A' : T.line}`,
                            background: isSelected ? T.aInk : isFull ? T.bg3 : isHot ? '#FEF9EC' : 'rgba(255,255,255,0.82)',
                            color: isSelected ? '#fff' : isFull ? T.muted : isHot ? '#92650A' : T.ink,
                            opacity: isFull ? 0.55 : 1,
                            position: 'relative' as const,
                            transition: 'all .12s ease',
                          }}>
                          {slot.time}
                          {isHot && !isSelected && !isFull && (
                            <span style={{ position: 'absolute' as const, top: -5, right: -3, width: 8, height: 8, borderRadius: '50%', background: '#E0B44A', border: '1.5px solid #fff', display: 'block' }} />
                          )}
                          {isFull && <div style={{ fontSize: 9, color: T.muted, fontWeight: 400, marginTop: 1 }}>full</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Confirm + secondary CTAs */}
              <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' as const }}>
                <button
                  onClick={() => navigate('/customer/meeting', { state: { projectId: project.id, builderId: project.builderId, builderName: project.builderName, projectName: project.name, city: project.city, slot: selectedSlot } })}
                  style={{ flex: 1, background: T.aInk, color: '#fff', border: 'none', padding: '14px 22px', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <Calendar size={14} />
                  {selectedSlot ? `Confirm ${selectedSlot.split('-').slice(1).join('')}` : 'Book a Site Visit'}
                </button>
                <button onClick={toggleShortlist}
                  style={{ background: 'rgba(255,255,255,0.82)', color: shortlisted ? T.aInk : T.ink2, border: `1px solid ${shortlisted ? T.accent : T.line}`, padding: '14px 18px', borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bookmark size={14} fill={shortlisted ? T.aInk : 'none'} />
                  {shortlisted ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section id="faq-section" style={{ maxWidth: 1100, margin: '96px auto 0', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'end', gap: 28, marginBottom: 32 }}>
            <div>
              <div style={sk}>— FAQ</div>
              <h2 style={secH2}>Common <em style={{ fontStyle: 'italic', color: T.aInk }}>questions</em>.</h2>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 36, rowGap: 0 }}>
            {faq.map((item, i) => (
              <div key={i} style={{ borderBottom: `1px solid ${T.line}`, padding: '18px 0' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'grid', gridTemplateColumns: '1fr 24px', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                  <span style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 400, color: T.ink, letterSpacing: '-0.01em', lineHeight: 1.3 }}>{item.q}</span>
                  <span style={{ color: T.muted, fontSize: 20, fontFamily: 'system-ui', textAlign: 'center', transition: 'transform .2s ease', display: 'block', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                {openFaq === i && (
                  <p style={{ margin: '10px 0 0', color: T.muted, fontSize: 13.5, lineHeight: 1.55 }}>{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── FOOTER CTA ───────────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1100, margin: '96px auto 0', padding: '0 24px 0' }}>
          <div style={{ background: T.ink, color: '#fff', textAlign: 'center', borderRadius: '28px 28px 0 0', padding: '80px 32px 64px' }}>
            <h2 style={{ margin: '0 auto', fontFamily: T.serif, fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 300, lineHeight: 1.02, letterSpacing: '-0.025em', maxWidth: 720 }}>
              Your home in{' '}
              <em style={{ fontStyle: 'italic', color: T.accent }}>{project.city ?? project.locality ?? 'the city'}</em>
              {' '}is waiting.
            </h2>
            <p style={{ margin: '18px auto 36px', color: 'rgba(255,255,255,0.6)', maxWidth: 440, fontSize: 14, lineHeight: 1.6 }}>
              Schedule a no-obligation site visit. See the construction. Meet the team. Walk the floor plan live.
            </p>
            <div style={{ display: 'inline-flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => navigate('/customer/meeting', { state: { projectId: project.id, builderId: project.builderId, builderName: project.builderName, projectName: project.name, city: project.city } })}
                style={{ background: T.accent, color: T.aDeep, border: 'none', padding: '14px 32px', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={15} /> Book a Visit
              </button>
              <button onClick={toggleShortlist}
                style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', padding: '14px 28px', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Bookmark size={14} fill={shortlisted ? '#fff' : 'none'} />
                {shortlisted ? 'Saved to shortlist' : 'Add to shortlist'}
              </button>
              <button onClick={() => navigate('/customer')}
                style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', padding: '14px 28px', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
                More Projects
              </button>
            </div>
            <div style={{ marginTop: 60, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, flexWrap: 'wrap', gap: 10 }}>
              <span>dealio<em style={{ fontStyle: 'italic', color: T.accent }}>.</em> · Real Estate Marketplace</span>
              {project.reraNumber && <span>RERA: {project.reraNumber}</span>}
              <span>{project.city ?? project.locality}</span>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default CustomerProjectDetail;