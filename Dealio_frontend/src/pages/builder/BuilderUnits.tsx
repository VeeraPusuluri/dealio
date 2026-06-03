import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { builderApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Loader2, Upload, Download, RefreshCw, Save, LayoutGrid, X,
  Table2, Plus, Trash2, Search, Filter, ChevronUp, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';
import * as XLSX from 'xlsx';

// ── Types ──────────────────────────────────────────────────────────────────────
type UnitStatus = 'Available' | 'Booked' | 'Sold' | 'Hold';
type ViewMode = 'grid' | 'table';
type SortField = keyof UnitRow;

interface UnitRow {
  id: string; tower: string; floor: number; unit: number;
  bhk: string; areaSqft: number; price: number;
  status: UnitStatus; facing?: string; parking?: string;
}

interface ApiProject {
  id: number; name: string;
  totalUnits?: number | null; availableUnits?: number | null;
  bookedUnits?: number | null; soldUnits?: number | null;
  towers?: number | null; floorsPerTower?: number | null;
  configurations?: string[] | null;
  priceMin?: number | null; priceMax?: number | null;
  unitMatrix?: UnitRow[] | null;
}

interface AddUnitForm {
  tower: string; floor: string; unit: string;
  bhk: string; areaSqft: string; price: string;
  status: UnitStatus; facing: string; parking: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<UnitStatus, { bg: string; fg: string }> = {
  Available: { bg: '#16A34A', fg: '#fff' },
  Booked:    { bg: '#F59E0B', fg: '#fff' },
  Sold:      { bg: '#DC2626', fg: '#fff' },
  Hold:      { bg: '#9CA3AF', fg: '#fff' },
};
const STATUS_OPTIONS: UnitStatus[] = ['Available', 'Booked', 'Sold', 'Hold'];
const FACING_OPTIONS = ['', 'East', 'West', 'North', 'South', 'Corner'];
const BHK_OPTIONS = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Studio', 'Duplex', 'Villa'];
const PARKING_OPTIONS = ['', '1 Car', '2 Car', '3 Car', 'Bike'];

const EMPTY_ADD_FORM: AddUnitForm = {
  tower: 'A', floor: '', unit: '', bhk: '2 BHK',
  areaSqft: '', price: '', status: 'Available', facing: '', parking: '',
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function generateMatrix(p: ApiProject): UnitRow[] {
  const total = Math.max(0, p.totalUnits ?? 0);
  if (!total) return [];
  const towers    = Math.max(1, p.towers ?? 1);
  const floors    = Math.max(1, p.floorsPerTower ?? Math.min(20, Math.ceil(total / (towers * 4))));
  const perFloor  = Math.max(1, Math.ceil(total / (towers * floors)));
  const configs   = p.configurations?.length ? p.configurations : ['2 BHK'];
  const basePrice = p.priceMin ?? 5_000_000;

  const sold   = Math.min(p.soldUnits   ?? 0, total);
  const booked = Math.min(p.bookedUnits ?? 0, total - sold);
  const avail  = Math.max(0, total - sold - booked);

  let pool: UnitStatus[] = [
    ...Array(sold).fill('Sold'),
    ...Array(booked).fill('Booked'),
    ...Array(0).fill('Hold'),
    ...Array(avail).fill('Available'),
  ];
  let seed = p.id;
  const rng = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const units: UnitRow[] = [];
  let idx = 0;
  for (let t = 0; t < towers; t++) {
    const tLetter = String.fromCharCode(65 + t);
    for (let f = floors; f >= 1; f--) {
      for (let u = 1; u <= perFloor; u++) {
        if (idx >= total) break;
        units.push({
          id: `${tLetter}-${f}-${u}`,
          tower: tLetter, floor: f, unit: u,
          bhk: configs[(u - 1) % configs.length],
          areaSqft: 900 + (u * 80) + (f * 15),
          price: basePrice + (f * 60000) + (u * 40000),
          status: pool[idx] ?? 'Available',
          facing: FACING_OPTIONS[1 + (u - 1) % 5],
          parking: u % 3 === 0 ? '2 Car' : '1 Car',
        });
        idx++;
      }
    }
  }
  return units;
}

function parseCSV(text: string): Partial<UnitRow>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ''; });
    return {
      id:       row.id,
      tower:    row.tower?.toUpperCase(),
      floor:    Number(row.floor)    || undefined,
      unit:     Number(row.unit)     || undefined,
      bhk:      row.bhk || row.type,
      areaSqft: Number(row.areasqft || row.area) || undefined,
      price:    Number(row.price)    || undefined,
      status:   STATUS_OPTIONS.includes(row.status as UnitStatus) ? (row.status as UnitStatus) : undefined,
      facing:   row.facing || undefined,
      parking:  row.parking || undefined,
    };
  }).filter(r => r.tower || r.floor);
}

function parseXLSX(buffer: ArrayBuffer): Partial<UnitRow>[] {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  return rows.map(row => {
    const key = (k: string) => {
      const found = Object.keys(row).find(r => r.trim().toLowerCase() === k);
      return found ? String(row[found] ?? '').trim() : '';
    };
    const tower = key('tower').toUpperCase() || undefined;
    const floor = Number(key('floor')) || undefined;
    const unit  = Number(key('unit'))  || undefined;
    const rawStatus = key('status');
    return {
      id:       key('id') || (tower && floor && unit ? `${tower}-${floor}-${unit}` : undefined),
      tower, floor, unit,
      bhk:      key('bhk') || key('type') || undefined,
      areaSqft: Number(key('areasqft') || key('area')) || undefined,
      price:    Number(key('price')) || undefined,
      status:   STATUS_OPTIONS.includes(rawStatus as UnitStatus) ? (rawStatus as UnitStatus) : undefined,
      facing:   key('facing') || undefined,
      parking:  key('parking') || undefined,
    };
  }).filter(r => r.tower || r.floor);
}

function toCSV(units: UnitRow[]): string {
  const hdr = 'id,tower,floor,unit,bhk,areaSqft,price,status,facing,parking';
  const rows = units.map(u =>
    [u.id, u.tower, u.floor, u.unit, u.bhk, u.areaSqft, u.price, u.status, u.facing ?? '', u.parking ?? ''].join(',')
  );
  return [hdr, ...rows].join('\n');
}

function toXLSX(units: UnitRow[]): Blob {
  const data = units.map(u => ({
    ID: u.id, Tower: u.tower, Floor: u.floor, Unit: u.unit,
    BHK: u.bhk, 'Area (sqft)': u.areaSqft, 'Price (₹)': u.price,
    Status: u.status, Facing: u.facing ?? '', Parking: u.parking ?? '',
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Unit Matrix');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// ── Component ──────────────────────────────────────────────────────────────────
const BuilderUnits = () => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [selectedId, setSelectedId]   = useState<number | null>(null);
  const [units, setUnits]             = useState<UnitRow[]>([]);
  const [dirty, setDirty]             = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitRow | null>(null);
  const [activeTower, setActiveTower]   = useState('A');
  const [viewMode, setViewMode]         = useState<ViewMode>('grid');
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState<UnitStatus | ''>('');
  const [filterTower, setFilterTower]   = useState('');
  const [sortField, setSortField]       = useState<SortField>('floor');
  const [sortAsc, setSortAsc]           = useState(true);
  const [showAddForm, setShowAddForm]   = useState(false);
  const [addForm, setAddForm]           = useState<AddUnitForm>(EMPTY_ADD_FORM);
  const fileRef = useRef<HTMLInputElement>(null);
  const builderId = useRef<string>('');

  // ── Load projects ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        let bid = builderApi.getCachedBuilderId();
        if (!bid && user?.id) {
          const email = user.email || `uid${user.id}@dealio.builder`;
          const res = await builderApi.ensureBuilder(user.name, email, user.phone, user.id) as { builderId: number };
          bid = String(res.builderId);
          builderApi.setCachedBuilderId(bid);
        }
        if (!bid) return;
        builderId.current = bid;
        const data = await builderApi.getProjects(bid) as ApiProject[];
        const list = data || [];
        setProjects(list);
        if (list.length > 0) selectProject(list[0], false);
      } catch { toast.error('Could not load projects'); }
      finally { setLoading(false); }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectProject = (p: ApiProject, resetDirty = true) => {
    setSelectedId(p.id);
    const matrix = Array.isArray(p.unitMatrix) && p.unitMatrix.length > 0
      ? (p.unitMatrix as UnitRow[])
      : generateMatrix(p);
    setUnits(matrix);
    if (resetDirty) setDirty(false);
    setSelectedUnit(null);
    setShowAddForm(false);
    setSearch(''); setFilterStatus(''); setFilterTower('');
    const towers = [...new Set(matrix.map(u => u.tower))].sort();
    setActiveTower(towers[0] ?? 'A');
  };

  // ── Save matrix ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedId || !builderId.current) return;
    setSaving(true);
    try {
      await builderApi.updateProject(builderId.current, selectedId, { unitMatrix: units });
      const avail  = units.filter(u => u.status === 'Available').length;
      const booked = units.filter(u => u.status === 'Booked').length;
      const sold   = units.filter(u => u.status === 'Sold').length;
      await builderApi.updateProject(builderId.current, selectedId, {
        availableUnits: avail, bookedUnits: booked, soldUnits: sold,
        totalUnits: units.length,
      });
      setDirty(false);
      toast.success('Unit matrix saved successfully');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  // ── Unit mutations ───────────────────────────────────────────────────────
  const updateUnit = (id: string, patch: Partial<UnitRow>) => {
    setUnits(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u));
    setSelectedUnit(prev => prev?.id === id ? { ...prev, ...patch } : prev);
    setDirty(true);
  };

  const deleteUnit = (id: string) => {
    setUnits(prev => prev.filter(u => u.id !== id));
    if (selectedUnit?.id === id) setSelectedUnit(null);
    setDirty(true);
    toast.success('Unit removed');
  };

  const addUnit = () => {
    const floor = Number(addForm.floor);
    const unit  = Number(addForm.unit);
    const tower = addForm.tower.toUpperCase();
    if (!tower || !floor || !unit) { toast.error('Tower, Floor, and Unit number are required'); return; }
    const id = `${tower}-${floor}-${unit}`;
    if (units.some(u => u.id === id)) { toast.error(`Unit ${id} already exists`); return; }
    const newUnit: UnitRow = {
      id, tower, floor, unit,
      bhk: addForm.bhk || '2 BHK',
      areaSqft: Number(addForm.areaSqft) || 0,
      price: Number(addForm.price) || 0,
      status: addForm.status,
      facing: addForm.facing || undefined,
      parking: addForm.parking || undefined,
    };
    setUnits(prev => [...prev, newUnit].sort((a, b) =>
      a.tower.localeCompare(b.tower) || b.floor - a.floor || a.unit - b.unit
    ));
    setDirty(true);
    setAddForm(EMPTY_ADD_FORM);
    setShowAddForm(false);
    toast.success(`Unit ${id} added`);
  };

  // ── File upload (CSV or XLSX) ────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isXLSX = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');

    const applyRows = (parsed: Partial<UnitRow>[]) => {
      if (!parsed.length) { toast.error('No valid rows found in file'); return; }
      let updated = 0;
      setUnits(prev => {
        const next = [...prev];
        for (const row of parsed) {
          const idx = next.findIndex(u =>
            u.tower === row.tower && u.floor === row.floor && u.unit === row.unit
          );
          if (idx >= 0) { Object.assign(next[idx], row); updated++; }
        }
        return next;
      });
      setDirty(true);
      toast.success(`${updated} of ${parsed.length} rows applied`);
    };

    if (isXLSX) {
      const reader = new FileReader();
      reader.onload = ev => {
        const parsed = parseXLSX(ev.target?.result as ArrayBuffer);
        applyRows(parsed);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = ev => {
        const parsed = parseCSV(ev.target?.result as string);
        applyRows(parsed);
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  // ── Exports ──────────────────────────────────────────────────────────────
  const downloadCSV = () => {
    const blob = new Blob([toCSV(units)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `unit-matrix-${selectedId}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadXLSX = () => {
    const blob = toXLSX(units);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `unit-matrix-${selectedId}.xlsx`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Regenerate ───────────────────────────────────────────────────────────
  const handleRegenerate = () => {
    const p = projects.find(x => x.id === selectedId);
    if (!p) return;
    setUnits(generateMatrix(p));
    setDirty(true);
    setSelectedUnit(null);
    toast.info('Matrix regenerated from project settings');
  };

  // ── Derived data ─────────────────────────────────────────────────────────
  const towers     = [...new Set(units.map(u => u.tower))].sort();
  const towerUnits = units.filter(u => u.tower === activeTower);
  const floors     = [...new Set(towerUnits.map(u => u.floor))].sort((a, b) => b - a);
  const maxUnit    = Math.max(...towerUnits.map(u => u.unit), 0);

  const counts = {
    Available: units.filter(u => u.status === 'Available').length,
    Booked:    units.filter(u => u.status === 'Booked').length,
    Sold:      units.filter(u => u.status === 'Sold').length,
    Hold:      units.filter(u => u.status === 'Hold').length,
  };

  // Table view filtered + sorted units
  const tableUnits = units
    .filter(u => {
      if (filterStatus && u.status !== filterStatus) return false;
      if (filterTower && u.tower !== filterTower) return false;
      if (search) {
        const q = search.toLowerCase();
        return u.id.toLowerCase().includes(q) || u.bhk.toLowerCase().includes(q) ||
          String(u.floor).includes(q) || String(u.unit).includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(p => !p);
    else { setSortField(field); setSortAsc(true); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp size={10} className="text-slate-300" />;
    return sortAsc
      ? <ChevronUp size={10} className="text-teal-600" />
      : <ChevronDown size={10} className="text-teal-600" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">

        {/* ── Header ── */}
        <div className="la-banner px-5 py-4 flex items-center gap-3 flex-wrap">
          <LayoutGrid size={16} className="text-slate-600" />
          <h2 className="text-[15px] font-bold text-slate-800 flex-1">Unit Matrix</h2>

          {loading ? <Loader2 size={16} className="animate-spin text-slate-400" /> : (
            <select value={selectedId ?? ''}
              onChange={e => { const p = projects.find(x => x.id === Number(e.target.value)); if (p) selectProject(p); }}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-700 shadow-sm">
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}

          {!loading && units.length > 0 && (
            <>
              {/* View toggle */}
              <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden">
                <button onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium transition-colors ${viewMode === 'grid' ? 'bg-teal-600 text-white' : 'text-slate-500 hover:text-teal-600'}`}>
                  <LayoutGrid size={13} /> Grid
                </button>
                <button onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium transition-colors ${viewMode === 'table' ? 'bg-teal-600 text-white' : 'text-slate-500 hover:text-teal-600'}`}>
                  <Table2 size={13} /> Table
                </button>
              </div>

              <button onClick={() => setShowAddForm(p => !p)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-teal-300 bg-teal-50 text-[12px] font-medium text-teal-700 hover:bg-teal-100 transition-colors">
                <Plus size={13} /> Add Unit
              </button>

              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-medium text-slate-600 hover:text-teal-700 hover:border-teal-300 transition-colors">
                <Upload size={13} /> Upload
              </button>

              {/* Download dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-medium text-slate-600 hover:text-teal-700 hover:border-teal-300 transition-colors">
                  <Download size={13} /> Download
                </button>
                <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button onClick={downloadCSV} className="w-full text-left px-3 py-2 text-[12px] text-slate-600 hover:bg-slate-50 hover:text-teal-700">
                    Download CSV
                  </button>
                  <button onClick={downloadXLSX} className="w-full text-left px-3 py-2 text-[12px] text-slate-600 hover:bg-slate-50 hover:text-teal-700">
                    Download Excel
                  </button>
                </div>
              </div>

              <button onClick={handleRegenerate}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-medium text-slate-600 hover:text-teal-700 hover:border-teal-300 transition-colors">
                <RefreshCw size={13} /> Regenerate
              </button>

              <button onClick={handleSave} disabled={!dirty || saving}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-all disabled:opacity-50 ${dirty ? 'shadow-sm' : ''}`}
                style={{ background: dirty ? 'linear-gradient(135deg, #0A7E8C, #0d9488)' : '#9ca3af' }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          )}
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-slate-300" /></div>
        ) : projects.length === 0 ? (
          <div className="la-card p-12 text-center">
            <p className="text-[13px] text-slate-400">No projects yet. Create a project to manage its unit matrix.</p>
          </div>
        ) : units.length === 0 ? (
          <div className="la-card p-10 text-center space-y-3">
            <p className="text-[14px] font-semibold text-slate-600">No unit data for this project</p>
            <p className="text-[12px] text-slate-400">Set <strong>Total Units</strong>, <strong>Towers</strong>, and <strong>Floors per Tower</strong> in the project editor, then click <em>Regenerate</em>.</p>
            <button onClick={handleRegenerate}
              className="mx-auto flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}>
              <RefreshCw size={13} /> Generate Matrix
            </button>
          </div>
        ) : (
          <>
            {/* ── Stats row ── */}
            <div className="flex items-center gap-3 flex-wrap">
              {(Object.entries(counts) as [UnitStatus, number][]).map(([s, n]) => (
                <span key={s} className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full text-white"
                  style={{ backgroundColor: STATUS_COLOR[s].bg }}>
                  {s} · {n}
                </span>
              ))}
              <span className="ml-auto text-[11px] text-slate-400 font-medium">
                {units.length} total · {towers.length} tower{towers.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* ── Add Unit Form ── */}
            {showAddForm && (
              <div className="la-card p-4 border border-teal-200 bg-teal-50/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-bold text-slate-700">Add New Unit</h3>
                  <button onClick={() => setShowAddForm(false)} className="text-slate-300 hover:text-slate-500"><X size={14} /></button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase">Tower</label>
                    <input value={addForm.tower} onChange={e => setAddForm(f => ({ ...f, tower: e.target.value.toUpperCase() }))}
                      placeholder="A"
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase">Floor</label>
                    <input type="number" value={addForm.floor} onChange={e => setAddForm(f => ({ ...f, floor: e.target.value }))}
                      placeholder="1"
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase">Unit #</label>
                    <input type="number" value={addForm.unit} onChange={e => setAddForm(f => ({ ...f, unit: e.target.value }))}
                      placeholder="1"
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase">BHK</label>
                    <select value={addForm.bhk} onChange={e => setAddForm(f => ({ ...f, bhk: e.target.value }))}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20">
                      {BHK_OPTIONS.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase">Area (sqft)</label>
                    <input type="number" value={addForm.areaSqft} onChange={e => setAddForm(f => ({ ...f, areaSqft: e.target.value }))}
                      placeholder="900"
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase">Price (₹)</label>
                    <input type="number" value={addForm.price} onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))}
                      placeholder="5000000"
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase">Status</label>
                    <select value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value as UnitStatus }))}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20">
                      {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase">Facing</label>
                    <select value={addForm.facing} onChange={e => setAddForm(f => ({ ...f, facing: e.target.value }))}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20">
                      {FACING_OPTIONS.map(f => <option key={f} value={f}>{f || '—'}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase">Parking</label>
                    <select value={addForm.parking} onChange={e => setAddForm(f => ({ ...f, parking: e.target.value }))}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20">
                      {PARKING_OPTIONS.map(p => <option key={p} value={p}>{p || '—'}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button onClick={addUnit}
                      className="w-full py-1.5 rounded-lg text-[12px] font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}>
                      Add Unit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'grid' ? (
              <>
                {/* ── Tower tabs ── */}
                {towers.length > 1 && (
                  <div className="flex gap-2">
                    {towers.map(t => (
                      <button key={t} onClick={() => { setActiveTower(t); setSelectedUnit(null); }}
                        className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all border ${activeTower === t ? 'text-white border-transparent shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'}`}
                        style={activeTower === t ? { background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' } : undefined}>
                        Tower {t}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-4">
                  {/* ── Heat map grid ── */}
                  <div className="flex-1 la-card p-4 overflow-auto">
                    <table className="border-collapse">
                      <thead>
                        <tr>
                          <th className="text-[10px] text-slate-400 font-medium px-2 py-1 text-left w-12">Floor</th>
                          {Array.from({ length: maxUnit }, (_, i) => (
                            <th key={i} className="text-[10px] text-slate-400 px-0.5 py-1 text-center w-20">Unit {i + 1}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {floors.map(floor => (
                          <tr key={floor}>
                            <td className="text-[11px] font-semibold text-slate-500 px-2 py-0.5 whitespace-nowrap">{floor}F</td>
                            {Array.from({ length: maxUnit }, (_, i) => {
                              const unit = towerUnits.find(u => u.floor === floor && u.unit === i + 1);
                              if (!unit) return <td key={i} className="px-0.5 py-0.5"><div className="w-20 h-14 rounded bg-slate-50/60" /></td>;
                              const c = STATUS_COLOR[unit.status];
                              const isSelected = selectedUnit?.id === unit.id;
                              return (
                                <td key={i} className="px-0.5 py-0.5">
                                  <button onClick={() => setSelectedUnit(isSelected ? null : unit)}
                                    className="w-20 h-14 rounded text-center flex flex-col items-center justify-center gap-0 transition-all hover:scale-105"
                                    style={{
                                      backgroundColor: c.bg, color: c.fg,
                                      opacity: isSelected ? 1 : 0.88,
                                      outline: isSelected ? `2.5px solid #0B1929` : 'none',
                                      outlineOffset: 1,
                                    }}>
                                    <p className="text-[10px] font-bold leading-tight">{unit.bhk}</p>
                                    <p className="text-[9px] leading-tight opacity-85">{unit.areaSqft} sqft</p>
                                    <p className="text-[9px] leading-tight">₹{(unit.price / 100000).toFixed(0)}L</p>
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Edit panel ── */}
                  {selectedUnit && (
                    <div className="w-64 la-card p-4 space-y-3 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[13px] font-bold text-slate-800">
                          Tower {selectedUnit.tower} · {selectedUnit.floor}F · U{selectedUnit.unit}
                        </h3>
                        <button onClick={() => setSelectedUnit(null)} className="text-slate-300 hover:text-slate-500"><X size={14} /></button>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Status</label>
                          <div className="grid grid-cols-2 gap-1.5 mt-1">
                            {STATUS_OPTIONS.map(s => (
                              <button key={s} onClick={() => updateUnit(selectedUnit.id, { status: s })}
                                className="py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all"
                                style={{
                                  backgroundColor: STATUS_COLOR[s].bg,
                                  opacity: selectedUnit.status === s ? 1 : 0.35,
                                  outline: selectedUnit.status === s ? `2px solid #0B1929` : 'none',
                                }}>
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Price (₹)</label>
                          <input type="number" value={selectedUnit.price}
                            onChange={e => updateUnit(selectedUnit.id, { price: Number(e.target.value) })}
                            className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400" />
                          <p className="text-[10px] text-slate-400 mt-0.5">{formatCurrency(selectedUnit.price)}</p>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">BHK Type</label>
                          <select value={selectedUnit.bhk}
                            onChange={e => updateUnit(selectedUnit.id, { bhk: e.target.value })}
                            className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20">
                            {BHK_OPTIONS.map(b => <option key={b}>{b}</option>)}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Area (sqft)</label>
                          <input type="number" value={selectedUnit.areaSqft}
                            onChange={e => updateUnit(selectedUnit.id, { areaSqft: Number(e.target.value) })}
                            className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20" />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Facing</label>
                          <select value={selectedUnit.facing ?? ''}
                            onChange={e => updateUnit(selectedUnit.id, { facing: e.target.value || undefined })}
                            className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20">
                            {FACING_OPTIONS.map(f => <option key={f} value={f}>{f || '—'}</option>)}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Parking</label>
                          <select value={selectedUnit.parking ?? ''}
                            onChange={e => updateUnit(selectedUnit.id, { parking: e.target.value || undefined })}
                            className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20">
                            {PARKING_OPTIONS.map(p => <option key={p} value={p}>{p || '—'}</option>)}
                          </select>
                        </div>

                        <button onClick={() => deleteUnit(selectedUnit.id)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-red-200 text-[11px] font-semibold text-red-500 hover:bg-red-50 transition-colors mt-1">
                          <Trash2 size={11} /> Delete Unit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* ── Table view ── */
              <div className="la-card overflow-hidden">
                {/* Filters row */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap bg-slate-50/50">
                  <div className="relative flex-1 min-w-48">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search unit ID, floor, BHK…"
                      className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-slate-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Filter size={12} className="text-slate-400" />
                    <select value={filterTower} onChange={e => setFilterTower(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12px] bg-white focus:outline-none">
                      <option value="">All Towers</option>
                      {towers.map(t => <option key={t} value={t}>Tower {t}</option>)}
                    </select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as UnitStatus | '')}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12px] bg-white focus:outline-none">
                      <option value="">All Status</option>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <span className="text-[11px] text-slate-400 ml-auto">{tableUnits.length} units</span>
                </div>

                <div className="overflow-auto max-h-[60vh]">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b border-slate-100">
                        {([
                          ['id', 'Unit ID'], ['tower', 'Tower'], ['floor', 'Floor'], ['unit', 'Unit #'],
                          ['bhk', 'BHK'], ['areaSqft', 'Area (sqft)'], ['price', 'Price'],
                          ['status', 'Status'], ['facing', 'Facing'], ['parking', 'Parking'],
                        ] as [SortField, string][]).map(([f, label]) => (
                          <th key={f} onClick={() => toggleSort(f)}
                            className="text-left px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase cursor-pointer hover:text-teal-600 whitespace-nowrap select-none">
                            <span className="flex items-center gap-1">{label}<SortIcon field={f} /></span>
                          </th>
                        ))}
                        <th className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableUnits.map((u, ri) => (
                        <tr key={u.id} className={`border-b border-slate-50 ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-teal-50/30 transition-colors`}>
                          <td className="px-3 py-2 text-[11px] font-mono font-medium text-slate-600">{u.id}</td>
                          <td className="px-3 py-2 text-[11px] text-slate-600">{u.tower}</td>
                          <td className="px-3 py-2 text-[11px] text-slate-600">{u.floor}</td>
                          <td className="px-3 py-2 text-[11px] text-slate-600">{u.unit}</td>
                          {/* Inline editable BHK */}
                          <td className="px-3 py-2">
                            <select value={u.bhk} onChange={e => updateUnit(u.id, { bhk: e.target.value })}
                              className="px-1.5 py-0.5 rounded border border-transparent hover:border-slate-200 text-[11px] text-slate-700 bg-transparent focus:outline-none focus:border-teal-400 focus:bg-white cursor-pointer">
                              {BHK_OPTIONS.map(b => <option key={b}>{b}</option>)}
                            </select>
                          </td>
                          {/* Inline editable area */}
                          <td className="px-3 py-2">
                            <input type="number" value={u.areaSqft}
                              onChange={e => updateUnit(u.id, { areaSqft: Number(e.target.value) })}
                              className="w-20 px-1.5 py-0.5 rounded border border-transparent hover:border-slate-200 text-[11px] text-slate-700 bg-transparent focus:outline-none focus:border-teal-400 focus:bg-white" />
                          </td>
                          {/* Inline editable price */}
                          <td className="px-3 py-2">
                            <input type="number" value={u.price}
                              onChange={e => updateUnit(u.id, { price: Number(e.target.value) })}
                              className="w-28 px-1.5 py-0.5 rounded border border-transparent hover:border-slate-200 text-[11px] text-slate-700 bg-transparent focus:outline-none focus:border-teal-400 focus:bg-white" />
                          </td>
                          {/* Inline editable status */}
                          <td className="px-3 py-2">
                            <select value={u.status} onChange={e => updateUnit(u.id, { status: e.target.value as UnitStatus })}
                              className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-white border-0 cursor-pointer focus:outline-none"
                              style={{ backgroundColor: STATUS_COLOR[u.status].bg }}>
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          {/* Inline editable facing */}
                          <td className="px-3 py-2">
                            <select value={u.facing ?? ''} onChange={e => updateUnit(u.id, { facing: e.target.value || undefined })}
                              className="px-1.5 py-0.5 rounded border border-transparent hover:border-slate-200 text-[11px] text-slate-600 bg-transparent focus:outline-none focus:border-teal-400 focus:bg-white cursor-pointer">
                              {FACING_OPTIONS.map(f => <option key={f} value={f}>{f || '—'}</option>)}
                            </select>
                          </td>
                          {/* Inline editable parking */}
                          <td className="px-3 py-2">
                            <select value={u.parking ?? ''} onChange={e => updateUnit(u.id, { parking: e.target.value || undefined })}
                              className="px-1.5 py-0.5 rounded border border-transparent hover:border-slate-200 text-[11px] text-slate-600 bg-transparent focus:outline-none focus:border-teal-400 focus:bg-white cursor-pointer">
                              {PARKING_OPTIONS.map(p => <option key={p} value={p}>{p || '—'}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <button onClick={() => deleteUnit(u.id)}
                              className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {tableUnits.length === 0 && (
                    <p className="text-center text-[12px] text-slate-400 py-8">No units match the current filters.</p>
                  )}
                </div>
              </div>
            )}

            {/* File format hint */}
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-[11px] text-slate-400">
              <strong className="text-slate-500">Upload formats:</strong> CSV or Excel (.xlsx) with columns{' '}
              <code>tower, floor, unit, bhk, areaSqft, price, status, facing, parking</code>.
              Rows are matched by tower+floor+unit. Only matching rows are updated.
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BuilderUnits;
