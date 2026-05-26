import { useEffect, useMemo, useRef, useState } from 'react';
import type * as LeafletType from 'leaflet';
import { MapPin, ExternalLink, Loader2, School, Hospital, Plane, ShoppingBag, ShoppingCart, Building2, Train, Newspaper } from 'lucide-react';
import { builderApi } from '@/lib/api';

type LeafletModule = typeof LeafletType;

interface Props {
  value: string;
  onChange: (v: string) => void;
  address: string;
  city: string;
  readOnly?: boolean;
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

interface OsmDevelopment {
  id: string;
  name: string;
  type: 'construction' | 'apartments' | 'residential' | 'mixed' | 'estate_agent';
  lat: number;
  lng: number;
  distanceKm: number;
  openingDate?: string;
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
  school:      '#2563eb',
  airport:     '#0284c7',
  mall:        '#9333ea',
  supermarket: '#d97706',
};

// ── Leaflet custom icons ───────────────────────────────────────────────────────

// Pill label — matches the Google Maps floating chip style in the screenshot
function makePillIcon(L: LeafletModule, color: string, name: string, distKm: number): LeafletType.DivIcon {
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

const OSM_DEV_TYPE_META: Record<OsmDevelopment['type'], { label: string; color: string }> = {
  construction:  { label: 'Under Construction', color: 'bg-amber-100 text-amber-700' },
  apartments:    { label: 'Apartments',         color: 'bg-blue-100 text-blue-700'   },
  residential:   { label: 'Residential',        color: 'bg-teal-100 text-teal-700'   },
  mixed:         { label: 'Mixed Use',          color: 'bg-purple-100 text-purple-700' },
  estate_agent:  { label: 'Real Estate Office', color: 'bg-gray-100 text-gray-600'   },
};

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
async function fetchNearbyDevelopments(center: Coords, signal: AbortSignal): Promise<OsmDevelopment[]> {
  const r = 5000; // 5 km
  const { lat, lng } = center;

  const query = `[out:json][timeout:15];(
    nwr["landuse"="construction"]["name"](around:${r},${lat},${lng});
    nwr["building"~"^(apartments|residential|condominium)$"]["name"](around:${r},${lat},${lng});
    nwr["building"~"^(commercial|mixed_use|retail)$"]["name"](around:${r},${lat},${lng});
    nwr["amenity"="real_estate_agent"]["name"](around:${r},${lat},${lng});
  );out center 40;`;

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

  const seen = new Set<string>();
  const devs: OsmDevelopment[] = [];
  for (const e of json.elements) {
    const tags = e.tags ?? {};
    const name = tags.name;
    if (!name) continue;
    const key = name.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);

    const elat = e.lat ?? e.center?.lat;
    const elng = e.lon ?? e.center?.lon;
    if (elat == null || elng == null) continue;

    let type: OsmDevelopment['type'] = 'residential';
    if (tags.landuse === 'construction') type = 'construction';
    else if (tags.building === 'apartments' || tags.building === 'condominium') type = 'apartments';
    else if (tags.building === 'commercial' || tags.building === 'mixed_use' || tags.building === 'retail') type = 'mixed';
    else if (tags.amenity === 'real_estate_agent') type = 'estate_agent';

    devs.push({
      id: `${e.type}/${e.id}`,
      name,
      type,
      lat: elat,
      lng: elng,
      distanceKm: distanceKm(center, { lat: elat, lng: elng }),
      openingDate: tags['opening_date'] || tags['start_date'] || undefined,
    });
  }
  return devs.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 12);
}

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
const GoogleMapsLocationField = ({ value, onChange, address, city, readOnly = false }: Props) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [resolving, setResolving]     = useState(false);
  const [resolveError, setResolveError] = useState(false);

  const [nearby, setNearby]           = useState<NearbyPlace[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NearbyPlace['category'] | 'all'>('all');

  const [osmDevs, setOsmDevs]                     = useState<OsmDevelopment[]>([]);
  const [osmDevsLoading, setOsmDevsLoading]       = useState(false);
  const [osmDevsFetched, setOsmDevsFetched]       = useState(false);
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
        icon: makePillIcon(L, CATEGORY_HEX[p.category], p.name, p.distanceKm),
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

  // ── Fetch nearby real-world developments from Overpass (OSM) ────────────
  useEffect(() => {
    setOsmDevs([]);
    setOsmDevsFetched(false);
    if (!coords) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setOsmDevsLoading(true);
      try {
        const list = await fetchNearbyDevelopments(coords, controller.signal);
        setOsmDevs(list);
      } catch {
        /* network/timeout — leave empty */
      } finally {
        setOsmDevsLoading(false);
        setOsmDevsFetched(true);
      }
    }, 1000);
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
          <label className={lbl}>Map Preview</label>
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
      {coords && (
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className={`${lbl} mb-0`}>Nearby Attractions</label>
            {nearbyLoading && <Loader2 size={12} className="text-teal-500 animate-spin" />}
          </div>


          {!nearbyLoading && nearby.length === 0 && (
            <p className="text-[11px] text-gray-400">No notable points of interest found nearby.</p>
          )}

          {visiblePlaces.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {visiblePlaces.map(p => {
                const { icon: Icon, color } = CATEGORY_META[p.category];
                return (
                  <a key={p.id}
                    href={`https://maps.google.com/maps?q=${p.lat},${p.lng}`}
                    target="_blank" rel="noreferrer"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] hover:shadow-sm transition-shadow ${color}`}>
                    <Icon size={12} className="shrink-0" />
                    <span className="font-medium truncate flex-1">{p.name}</span>
                    <span className="text-[10px] opacity-70 shrink-0">{p.distanceKm.toFixed(1)} km</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Nearby Developments (from OpenStreetMap via Overpass) ────────── */}
      {coords && (osmDevsLoading || osmDevsFetched) && (
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className={`${lbl} mb-0 flex items-center gap-1.5`}>
              <Building2 size={11} className="text-teal-500" />
              Nearby Developments {nearbyLocality ? `near ${nearbyLocality}` : city ? `in ${city}` : ''}
              <span className="text-[9px] font-medium text-gray-400 ml-1">(OpenStreetMap)</span>
            </label>
            {osmDevsLoading && <Loader2 size={12} className="text-teal-500 animate-spin" />}
          </div>

          {osmDevs.length === 0 && !osmDevsLoading && (
            <p className="text-[11px] text-gray-400">No mapped construction or housing projects found within 3 km.</p>
          )}

          {osmDevs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {osmDevs.map(d => {
                const meta = OSM_DEV_TYPE_META[d.type];
                return (
                  <a
                    key={d.id}
                    href={`https://maps.google.com/maps?q=${d.lat},${d.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 p-2 rounded-lg border border-gray-200 bg-white hover:border-teal-300 hover:shadow-sm transition-all"
                  >
                    <div className="w-10 h-10 rounded-md bg-teal-50 flex items-center justify-center shrink-0">
                      <Building2 size={14} className="text-teal-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-gray-800 truncate">{d.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${meta.color}`}>
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-gray-400">{d.distanceKm.toFixed(1)} km away</span>
                        {d.openingDate && (
                          <span className="text-[10px] text-gray-400">· {d.openingDate}</span>
                        )}
                      </div>
                    </div>
                    <ExternalLink size={11} className="text-gray-300 shrink-0" />
                  </a>
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