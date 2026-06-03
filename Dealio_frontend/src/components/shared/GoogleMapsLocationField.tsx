import { useEffect, useMemo, useRef, useState } from 'react';
import type * as LeafletType from 'leaflet';
import { MapPin, ExternalLink, Loader2, School, Hospital, Plane, ShoppingBag, ShoppingCart, Train, Newspaper } from 'lucide-react';
import { builderApi } from '@/lib/api';

type LeafletModule = typeof LeafletType;

interface Props {
  value: string;
  onChange: (v: string) => void;
  address: string;
  city: string;
  readOnly?: boolean;
  showMapLabel?: boolean;
  showNearby?: boolean;
}

interface Coords { lat: number; lng: number; }

interface NearbyPlace {
  id: string;
  name: string;
  category: 'hospital' | 'school' | 'airport' | 'mall' | 'supermarket' | 'metro';
  lat: number;
  lng: number;
  distanceKm: number;
}

interface NewsItem {
  title: string;
  source: string;
  date: string;
  url?: string;
}

const CATEGORY_META: Record<NearbyPlace['category'], { label: string; icon: typeof School; color: string }> = {
  metro:       { label: 'Metro',        icon: Train,        color: 'text-violet-600 bg-violet-50 border-violet-100' },
  hospital:    { label: 'Hospitals',    icon: Hospital,     color: 'text-red-600 bg-red-50 border-red-100' },
  school:      { label: 'Schools',      icon: School,       color: 'text-blue-600 bg-blue-50 border-blue-100' },
  airport:     { label: 'Airports',     icon: Plane,        color: 'text-sky-600 bg-sky-50 border-sky-100' },
  mall:        { label: 'Malls',        icon: ShoppingBag,  color: 'text-purple-600 bg-purple-50 border-purple-100' },
  supermarket: { label: 'Supermarkets', icon: ShoppingCart, color: 'text-amber-600 bg-amber-50 border-amber-100' },
};

const CATEGORY_HEX: Record<NearbyPlace['category'], string> = {
  metro:       '#7c3aed',
  hospital:    '#dc2626',
  school:      '#b45309',
  airport:     '#0284c7',
  mall:        '#6d28d9',
  supermarket: '#d97706',
};

// Pastel background + matching text per category (matches screenshot style)
const CATEGORY_PILL: Record<NearbyPlace['category'], { bg: string; border: string; text: string; dot: string }> = {
  metro:       { bg: '#fde8d8', border: '#f9b48a', text: '#c2410c', dot: '#f97316' },
  hospital:    { bg: '#fee2e2', border: '#fca5a5', text: '#b91c1c', dot: '#ef4444' },
  school:      { bg: '#fef3e2', border: '#fcd34d', text: '#92400e', dot: '#d97706' },
  airport:     { bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8', dot: '#3b82f6' },
  mall:        { bg: '#ede9fe', border: '#c4b5fd', text: '#5b21b6', dot: '#8b5cf6' },
  supermarket: { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46', dot: '#10b981' },
};

// SVG icon path per category (12×12 viewBox, matches screenshot style)
const CATEGORY_SVG: Record<NearbyPlace['category'], string> = {
  metro:       `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="4" width="10" height="6" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M3 4V3a3 3 0 016 0v1" stroke="currentColor" stroke-width="1.2"/><circle cx="4" cy="7.5" r="0.8" fill="currentColor"/><circle cx="8" cy="7.5" r="0.8" fill="currentColor"/></svg>`,
  hospital:    `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="1.5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M6 3.5v5M3.5 6h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  school:      `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1.5L11 4.5v1L6 3 1 5.5v-1L6 1.5z" fill="currentColor" opacity="0.5"/><rect x="2.5" y="5.5" width="7" height="5" rx="0.8" stroke="currentColor" stroke-width="1.2"/><rect x="4.5" y="7.5" width="3" height="3" rx="0.5" stroke="currentColor" stroke-width="1"/></svg>`,
  airport:     `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1.5v9M2 8.5l4-1.5 4 1.5M3.5 10.5h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M1.5 5L6 3.5 10.5 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  mall:        `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="4.5" width="9" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M4 4.5V3.5a2 2 0 014 0v1" stroke="currentColor" stroke-width="1.2"/><rect x="4.5" y="6.5" width="3" height="4" rx="0.5" stroke="currentColor" stroke-width="1"/></svg>`,
  supermarket: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 2h1.5l1.5 6h5l1.5-4H4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5.5" cy="9.5" r="0.8" fill="currentColor"/><circle cx="8.5" cy="9.5" r="0.8" fill="currentColor"/></svg>`,
};

// ── Leaflet custom icons ───────────────────────────────────────────────────────

// Pill label — matches the screenshot: pastel bg, bold name, lighter distance, small icon, pin dot below
function makePillIcon(L: LeafletModule, _color: string, name: string, distKm: number, category?: NearbyPlace['category']): LeafletType.DivIcon {
  const label  = name.length > 22 ? name.slice(0, 20) + '…' : name;
  const dist   = distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`;
  const style  = category ? CATEGORY_PILL[category] : { bg: '#f3f4f6', border: '#d1d5db', text: '#374151', dot: '#6b7280' };
  const icon   = category ? CATEGORY_SVG[category] : '';
  return L.divIcon({
    html: `
      <div style="display:inline-flex;flex-direction:column;align-items:center;pointer-events:auto;">
        <div style="display:inline-flex;align-items:center;gap:5px;background:${style.bg};border:1.5px solid ${style.border};border-radius:20px;padding:5px 11px 5px 8px;box-shadow:0 2px 12px rgba(0,0,0,0.13),0 1px 3px rgba(0,0,0,0.08);white-space:nowrap;">
          <span style="color:${style.text};display:flex;align-items:center;flex-shrink:0;">${icon}</span>
          <span style="font-size:12px;font-weight:700;color:${style.text};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:-0.01em;">${label}</span>
          <span style="font-size:10.5px;font-weight:400;color:${style.text};opacity:0.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin-left:2px;">${dist}</span>
        </div>
        <div style="width:6px;height:6px;border-radius:50%;background:${style.dot};margin-top:3px;box-shadow:0 0 0 2px ${style.bg};"></div>
      </div>`,
    iconAnchor:  [0, 36],
    popupAnchor: [60, -36],
    className:   '',
  });
}

// Dark grid-square — matches the building marker in the screenshot
function makeProjectIcon(L: LeafletModule): LeafletType.DivIcon {
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

const lbl = 'text-xs font-semibold text-gray-500 mb-1.5 block';
const ic  = 'w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all outline-none bg-white text-gray-800 placeholder:text-gray-500 border-gray-300 focus:ring-2 focus:ring-teal-500/15 focus:border-teal-400';

// ── URL → coords extraction ───────────────────────────────────────────────────
function extractCoords(url: string): Coords | null {
  if (!url) return null;
  const pin = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (pin) return { lat: parseFloat(pin[1]), lng: parseFloat(pin[2]) };
  const at  = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at)  return { lat: parseFloat(at[1]),  lng: parseFloat(at[2])  };
  return null;
}

// ── URL → embed src (used only when coords are unavailable) ──────────────────
function resolveMapEmbed(mapsLink: string, address: string, city: string, forceAddressFallback = false): string | null {
  const gmEmbed    = (q: string) => `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
  const coordEmbed = (lat: string, lng: string) => `https://maps.google.com/maps?q=${lat},${lng}&z=17&output=embed`;

  if (!mapsLink) {
    if (!forceAddressFallback) return null; // no link → no preview in edit mode
    const q = [address, city].filter(Boolean).join(', ');
    return q.length > 3 ? gmEmbed(q) : null;
  }

  if (!mapsLink.includes('maps.app.goo.gl')) {
    const pin = mapsLink.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (pin) return coordEmbed(pin[1], pin[2]);
    const at  = mapsLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (at)  return coordEmbed(at[1], at[2]);
    const q = mapsLink.match(/[?&]q=([^&]+)/);
    if (q) return `https://maps.google.com/maps?q=${q[1]}&output=embed`;
    if (mapsLink.includes('google.com/maps') || mapsLink.includes('maps.google.com')) {
      const place = mapsLink.match(/\/maps\/(?:place|search)\/([^/@?#]+)/);
      if (place) return gmEmbed(decodeURIComponent(place[1].replace(/\+/g, ' ')));
    }
    if (!mapsLink.startsWith('http') && mapsLink.trim().length > 3) return gmEmbed(mapsLink.trim());
  }

  // Short link fallback: use address only if a link was actually provided
  const q = [address, city].filter(Boolean).join(', ');
  if (q.length > 3) return gmEmbed(q);
  return null;
}

// ── Forward geocode address → coords (Nominatim, no API key) ─────────────────
async function forwardGeocode(address: string, city: string, signal: AbortSignal): Promise<Coords | null> {
  const q = encodeURIComponent([address, city].filter(Boolean).join(', '));
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
    { signal, headers: { 'Accept-Language': 'en' } },
  );
  if (!res.ok) return null;
  const data = await res.json() as Array<{ lat: string; lon: string }>;
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

// ── Reverse geocode coords → locality/suburb name (Nominatim, no API key) ────
async function reverseGeocode(coords: Coords, signal: AbortSignal): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json&zoom=16&addressdetails=1`;
  const res = await fetch(url, { signal, headers: { 'Accept-Language': 'en' } });
  if (!res.ok) return null;
  const data = await res.json() as { address?: Record<string, string> };
  const a = data.address ?? {};
  return a.suburb || a.neighbourhood || a.quarter || a.city_district || a.village || null;
}

// ── Haversine distance (km) ───────────────────────────────────────────────────
function distanceKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const x = sinDLat * sinDLat + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// ── Overpass query for nearby POIs ────────────────────────────────────────────
async function fetchNearby(center: Coords, signal: AbortSignal): Promise<NearbyPlace[]> {
  const r = 5000;          // 5 km
  const airportR = 25000;  // 25 km for airports
  const { lat, lng } = center;

  const query = `[out:json][timeout:20];(
    nwr["amenity"="hospital"](around:${r},${lat},${lng});
    nwr["amenity"="school"](around:${r},${lat},${lng});
    nwr["aeroway"~"^(aerodrome|terminal)$"](around:${airportR},${lat},${lng});
    nwr["shop"="mall"](around:${r},${lat},${lng});
    nwr["shop"="supermarket"](around:${r},${lat},${lng});
    nwr["railway"="station"](around:${r},${lat},${lng});
    nwr["railway"="halt"](around:${r},${lat},${lng});
  );out center 100;`;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: 'data=' + encodeURIComponent(query),
    signal,
  });
  if (!res.ok) throw new Error('Overpass query failed');
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
    else if (tags.aeroway === 'aerodrome' || tags.aeroway === 'terminal') category = 'airport';
    else if (tags.shop === 'mall') category = 'mall';
    else if (tags.shop === 'supermarket') category = 'supermarket';
    else if (tags.railway === 'station' || tags.railway === 'halt') category = 'metro';
    if (!category) continue;

    places.push({
      id: `${e.type}/${e.id}`,
      name,
      category,
      lat: elat,
      lng: elng,
      distanceKm: distanceKm(center, { lat: elat, lng: elng }),
    });
  }
  return places.sort((a, b) => a.distanceKm - b.distanceKm);
}

// ── Overpass query for nearby real estate developments ────────────────────────
// ── Fetch local real-estate news (Google News RSS via rss2json) ───────────────
async function fetchLocalNews(locality: string, signal: AbortSignal): Promise<NewsItem[]> {
  const q = encodeURIComponent(`${locality} real estate`);
  const rssUrl = encodeURIComponent(`https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`);
  const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}&count=3`, { signal });
  if (!res.ok) throw new Error('fetch failed');
  const data = await res.json() as {
    status: string;
    items?: Array<{ title: string; author: string; pubDate: string; link: string }>;
  };
  if (data.status !== 'ok' || !data.items?.length) throw new Error('no items');
  return data.items.map(item => ({
    title: item.title,
    source: item.author || 'News',
    date: new Date(item.pubDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    url: item.link,
  }));
}

// ── Component ─────────────────────────────────────────────────────────────────
const GoogleMapsLocationField = ({ value, onChange, address, city, readOnly = false, showMapLabel = true, showNearby = true }: Props) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [resolving, setResolving]     = useState(false);
  const [resolveError, setResolveError] = useState(false);

  const [nearby, setNearby]           = useState<NearbyPlace[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NearbyPlace['category'] | 'all'>('all');

  const [nearbyLocality, setNearbyLocality]       = useState<string | null>(null);

  const [newsItems, setNewsItems]   = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsFetched, setNewsFetched] = useState(false);
  const [geocodedCoords, setGeocodedCoords] = useState<Coords | null>(null);

  // ── Leaflet — loaded dynamically so a load failure never crashes the page ──
  const leafletRef         = useRef<LeafletModule | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const leafletDivRef      = useRef<HTMLDivElement>(null);
  const mapRef             = useRef<LeafletType.Map | null>(null);
  const attractionLayerRef = useRef<LeafletType.LayerGroup | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css' as string),
    ]).then(([mod]) => {
      if (!cancelled) { leafletRef.current = mod; setLeafletReady(true); }
    }).catch(() => { /* Leaflet unavailable — map section will not show */ });
    return () => { cancelled = true; };
  }, []);

  const isShortLink   = !!value && (value.includes('maps.app.goo.gl') || value.startsWith('https://goo.gl/maps/'));
  const effectiveUrl  = (isShortLink && resolvedUrl) ? resolvedUrl : value;
  const mapEmbedSrc   = useMemo(() => resolveMapEmbed(effectiveUrl, address, city, readOnly), [effectiveUrl, address, city, readOnly]);
  const urlCoords     = useMemo(() => extractCoords(effectiveUrl), [effectiveUrl]);
  const coords        = urlCoords ?? geocodedCoords;

  // ── Resolve short links via backend ──────────────────────────────────────
  useEffect(() => {
    setResolvedUrl(null);
    setResolveError(false);
    if (!isShortLink) return;
    const link = value;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setResolving(true);
      try {
        const { resolvedUrl: r } = await builderApi.resolveMapsLink(link);
        if (!cancelled) setResolvedUrl(r);
      } catch {
        if (!cancelled) setResolveError(true);
      } finally {
        if (!cancelled) setResolving(false);
      }
    }, 600);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [value, isShortLink]);

  // ── Forward geocode when URL has no extractable coords ───────────────────────
  useEffect(() => {
    setGeocodedCoords(null);
    if (urlCoords || (!address.trim() && !city.trim())) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setGeocodedCoords(await forwardGeocode(address, city, controller.signal));
      } catch { /* ignore */ }
    }, 900);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [effectiveUrl, address, city]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Create / re-create Leaflet map when coordinates become available ────────
  useEffect(() => {
    const L   = leafletRef.current;
    const div = leafletDivRef.current;
    if (!L || !coords || !div) return;

    let map: LeafletType.Map;
    try {
      map = L.map(div, { center: [coords.lat, coords.lng], zoom: 15, zoomControl: true, attributionControl: true });
    } catch {
      return; // container already initialised (React StrictMode double-mount)
    }

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    L.marker([coords.lat, coords.lng], { icon: makeProjectIcon(L), zIndexOffset: 1000 })
      .bindPopup('<b style="color:#0A7E8C">Project Location</b>')
      .addTo(map);

    attractionLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      attractionLayerRef.current = null;
    };
  }, [leafletReady, coords?.lat, coords?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const MAX_RADIUS_KM = 3;
  const MAX_PER_CATEGORY = 4;

  const categorized = useMemo(() => {
    const grouped: Record<NearbyPlace['category'], NearbyPlace[]> = {
      metro: [], hospital: [], school: [], airport: [], mall: [], supermarket: [],
    };
    for (const p of nearby) {
      if (p.distanceKm > MAX_RADIUS_KM) continue;
      const bucket = grouped[p.category];
      if (bucket.length < MAX_PER_CATEGORY) bucket.push(p);
    }
    return grouped;
  }, [nearby]);

  // ── Update attraction markers whenever category filter or data changes ───────
  useEffect(() => {
    const L     = leafletRef.current;
    const layer = attractionLayerRef.current;
    if (!L || !layer) return;
    layer.clearLayers();

    const placesToShow = activeCategory === 'all'
      ? (Object.keys(CATEGORY_META) as NearbyPlace['category'][]).flatMap(cat => categorized[cat])
      : categorized[activeCategory] ?? [];

    placesToShow.forEach(p => {
      L.marker([p.lat, p.lng], {
        icon: makePillIcon(L, CATEGORY_HEX[p.category], p.name, p.distanceKm, p.category),
      })
        .bindPopup(
          `<b style="font-size:12px">${p.name}</b><br/>` +
          `<span style="color:#6b7280;font-size:11px">${CATEGORY_META[p.category].label} · ${p.distanceKm.toFixed(1)} km</span>`,
        )
        .addTo(layer);
    });
  }, [categorized, activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch nearby attractions ──────────────────────────────────────────────
  useEffect(() => {
    setNearby([]);
    if (!coords) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setNearbyLoading(true);
      try {
        const list = await fetchNearby(coords, controller.signal);
        setNearby(list);
      } catch {
        /* network/timeout */
      } finally {
        setNearbyLoading(false);
      }
    }, 800);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [coords?.lat, coords?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reverse-geocode coords → locality ────────────────────────────────────
  useEffect(() => {
    setNearbyLocality(null);
    if (!coords) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setNearbyLocality(await reverseGeocode(coords, controller.signal));
      } catch { /* ignore */ }
    }, 800);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [coords?.lat, coords?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch local news once locality is known ───────────────────────────────
  useEffect(() => {
    const area = nearbyLocality || city;
    if (!area || newsFetched) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setNewsLoading(true);
      try {
        const items = await fetchLocalNews(area, controller.signal);
        setNewsItems(items);
      } catch {
        /* network/CORS — leave empty */
      } finally {
        setNewsLoading(false);
        setNewsFetched(true);
      }
    }, 1200);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [nearbyLocality, city]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset news when coords change
  useEffect(() => {
    setNewsItems([]);
    setNewsFetched(false);
  }, [coords?.lat, coords?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived data ──────────────────────────────────────────────────────────
  const totalNearby = useMemo(
    () => (Object.values(categorized) as NearbyPlace[][]).reduce((s, a) => s + a.length, 0),
    [categorized],
  );

  const visiblePlaces = useMemo(() => {
    if (activeCategory === 'all') {
      return (Object.keys(CATEGORY_META) as NearbyPlace['category'][])
        .flatMap(cat => categorized[cat]);
    }
    return categorized[activeCategory];
  }, [categorized, activeCategory]);

  // Show when a link is entered, when geocoding produced coords, or always in readOnly mode
  const showPreview = readOnly
    ? (!!coords || !!mapEmbedSrc || !!value || !!(address || city))
    : (!!coords || !!mapEmbedSrc || (!!value && (isShortLink || resolving)));

  return (
    <>
      {/* ── Input (hidden in readOnly / view mode) ────────────────────────── */}
      {!readOnly && (
        <div className="col-span-2">
          <label className={lbl}>Google Maps Link</label>
          <input type="url" value={value} onChange={e => onChange(e.target.value)}
            className={ic} placeholder="https://maps.google.com/… or maps.app.goo.gl/…" />
          <p className="text-[11px] text-gray-400 mt-1">
            Paste a Google Maps share link — the interactive map preview updates automatically.
          </p>
        </div>
      )}

      {/* ── Map preview ───────────────────────────────────────────────────── */}
      {showPreview && (
        <div className="col-span-2">
          {showMapLabel && <label className={lbl}>Map Preview</label>}
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">

            {/* Resolving short link */}
            {resolving && !coords && (
              <div className="h-52 bg-gradient-to-br from-slate-50 to-teal-50/40 flex flex-col items-center justify-center gap-2.5">
                <Loader2 size={22} className="text-teal-500 animate-spin" />
                <p className="text-sm font-medium text-gray-700">Resolving short link…</p>
                <p className="text-[11px] text-gray-400">Fetching exact pin from Google Maps</p>
              </div>
            )}

            {/* Short link unresolvable */}
            {!resolving && !coords && isShortLink && (
              <div className="h-52 bg-gradient-to-br from-slate-50 to-teal-50/40 flex flex-col items-center justify-center gap-2.5 relative">
                <div className="absolute inset-0 opacity-[0.04]"
                  style={{ backgroundImage: 'linear-gradient(#0A7E8C 1px,transparent 1px),linear-gradient(90deg,#0A7E8C 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="w-12 h-12 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center shadow-sm relative z-10">
                  <MapPin size={20} className="text-teal-600" />
                </div>
                <p className="text-sm font-medium text-gray-700 relative z-10">
                  {resolveError ? "Couldn't resolve short link" : 'Location link detected'}
                </p>
                <p className="text-[11px] text-gray-400 relative z-10">
                  {resolveError
                    ? 'Open it in Maps and paste the full URL, or add an address above'
                    : 'Add an address above to see the approximate area'}
                </p>
              </div>
            )}

            {/* ── Filter tabs row — above the map ─────────────────────────── */}
            {coords && (
              <div className="px-3 py-2 bg-white border-b border-gray-100 flex items-center gap-3 flex-wrap">
                <button type="button" onClick={() => setActiveCategory('all')}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-semibold transition-colors ${
                    activeCategory === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}>
                  All {totalNearby > 0 ? totalNearby : ''}
                </button>
                {(Object.keys(CATEGORY_META) as NearbyPlace['category'][]).map(cat => {
                  const count = categorized[cat].length;
                  if (!count) return null;
                  const { label } = CATEGORY_META[cat];
                  return (
                    <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
                      className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                        activeCategory === cat ? 'text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-700'
                      }`}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CATEGORY_HEX[cat] }} />
                      {label}
                    </button>
                  );
                })}
                <button type="button"
                  className="ml-auto flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-700">
                  <Newspaper size={11} /> News
                </button>
              </div>
            )}

            {/* ── Full-width map with overlays ─────────────────────────────── */}
            {coords && (
              <div className="relative">
                <div ref={leafletDivRef} style={{ height: 380, width: '100%', zIndex: 0 }} />

                {/* IN THE NEWS overlay — bottom-left */}
                <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 1000, width: 280 }}
                  className="bg-white/96 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                  <div className="px-3.5 py-2.5 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-gray-600 flex items-center gap-1.5">
                      <Newspaper size={10} className="text-teal-500" /> In The News
                    </span>
                    {newsLoading && <Loader2 size={10} className="text-teal-500 animate-spin" />}
                  </div>
                  <div className="overflow-y-auto" style={{ maxHeight: 180 }}>
                    {!newsLoading && newsItems.length === 0 && newsFetched && (
                      <p className="text-[11px] text-gray-400 px-3.5 py-3">No local news found.</p>
                    )}
                    {!newsLoading && newsItems.length === 0 && !newsFetched && (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 size={13} className="text-gray-300 animate-spin" />
                      </div>
                    )}
                    {newsItems.map((item, i) => (
                      <a key={i}
                        href={item.url || `https://news.google.com/search?q=${encodeURIComponent((nearbyLocality || city || '') + ' real estate')}`}
                        target="_blank" rel="noreferrer"
                        className="flex gap-2.5 px-3.5 py-2.5 border-b border-gray-50 hover:bg-teal-50/50 transition-colors group">
                        <span className="text-[10px] font-bold text-gray-300 shrink-0 mt-0.5 w-4">{String(i + 1).padStart(2, '0')}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-gray-800 leading-snug line-clamp-2 group-hover:text-teal-700">{item.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{item.source} · {item.date}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Address overlay — bottom-right */}
                <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 1000, maxWidth: 220 }}
                  className="bg-white/96 backdrop-blur-sm rounded-2xl shadow-xl px-3.5 py-3 border border-gray-100">
                  <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-1">Address</p>
                  {(address || city) && (
                    <p className="text-[11px] font-semibold text-gray-800 leading-snug">
                      {[address, city].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <p className="text-[9px] text-gray-400 mt-0.5 font-mono">
                    {Math.abs(coords.lat).toFixed(4)}° {coords.lat >= 0 ? 'N' : 'S'},{' '}
                    {Math.abs(coords.lng).toFixed(4)}° {coords.lng >= 0 ? 'E' : 'W'}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`}
                      target="_blank" rel="noreferrer"
                      className="text-[10px] text-teal-600 font-semibold hover:underline">
                      Directions
                    </a>
                    <span className="text-gray-300">·</span>
                    <button type="button"
                      onClick={() => navigator.clipboard?.writeText(value)}
                      className="text-[10px] text-teal-600 font-semibold hover:underline">
                      Share pin
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Google Maps iframe fallback — address-only, no coordinates extracted */}
            {!coords && mapEmbedSrc && (
              <iframe
                key={mapEmbedSrc}
                src={mapEmbedSrc}
                width="100%"
                height="260"
                loading="lazy"
                className="border-0 block"
                title="Location Map Preview"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}

            {/* Footer */}
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <MapPin size={11} />
                {coords
                  ? nearbyLoading
                    ? 'Loading nearby attractions…'
                    : totalNearby > 0
                      ? `${totalNearby} attractions within 3 km`
                      : 'Exact location pinned'
                  : isShortLink
                    ? resolvedUrl
                      ? 'Exact pin resolved from your short link'
                      : resolving
                        ? 'Resolving…'
                        : mapEmbedSrc
                          ? 'Approximate area — open Maps for the exact pin'
                          : 'Short link saved — open Maps to verify the exact location'
                    : value
                      ? 'Showing location from your Google Maps link'
                      : 'Showing estimated location from address (paste a Maps link for exact pin)'}
              </span>
              {value && (
                <a href={value} target="_blank" rel="noreferrer"
                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium">
                  Open in Google Maps <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Nearby attractions list ───────────────────────────────────────── */}
      {showNearby && coords && (
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-3">
            <label className={`${lbl} mb-0`}>Nearby Attractions</label>
            {nearbyLoading && <Loader2 size={12} className="text-teal-500 animate-spin" />}
          </div>

          {!nearbyLoading && nearby.length === 0 && (
            <p className="text-[11px] text-gray-400 py-1">No notable points of interest found nearby.</p>
          )}

          {totalNearby > 0 && (
            <div className="space-y-4">
              {(Object.keys(CATEGORY_META) as NearbyPlace['category'][]).map(cat => {
                const places = categorized[cat];
                if (!places.length) return null;
                const { label, icon: CatIcon, color } = CATEGORY_META[cat];
                return (
                  <div key={cat}>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border mb-2 ${color}`}>
                      <CatIcon size={11} className="shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
                      <span className="text-[10px] opacity-60 font-normal">· {places.length}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {places.map(p => (
                        <a key={p.id}
                          href={`https://maps.google.com/maps?q=${p.lat},${p.lng}`}
                          target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-300 hover:bg-white transition-all text-[11px] group">
                          <span className="font-medium text-gray-700 truncate flex-1 group-hover:text-teal-700">{p.name}</span>
                          <span className="text-[10px] text-gray-400 shrink-0 tabular-nums">{p.distanceKm.toFixed(1)} km</span>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </>
  );
};

export default GoogleMapsLocationField;