import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { builderApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type UnitStatus = 'available' | 'on_hold' | 'booked' | 'sold';

interface Unit {
  id: string; floor: number; unitNum: number; bhk: string;
  areaSqft: number; price: number; status: UnitStatus;
  facing?: string; parking?: string;
}

interface ApiProject {
  id: number; name: string; totalUnits?: number | null;
  availableUnits?: number | null; bookedUnits?: number | null; soldUnits?: number | null;
  configurations?: string[] | null; towers?: number | null; floorsPerTower?: number | null;
  priceMin?: number | null; priceMax?: number | null;
  pricePerSqftMin?: number | null;
}

const STATUS_STYLES: Record<UnitStatus, { bg: string; text: string; label: string }> = {
  available: { bg: '#E1F5EE', text: '#0F6E56', label: 'Available' },
  on_hold:   { bg: '#FAEEDA', text: '#633806', label: 'On Hold'   },
  booked:    { bg: '#E6F1FB', text: '#0C447C', label: 'Booked'    },
  sold:      { bg: '#FCEBEB', text: '#A32D2D', label: 'Sold'      },
};

const FACINGS = ['East', 'West', 'North', 'South'];

/** Build a unit grid from real project aggregate counts. */
function buildUnits(p: ApiProject): Unit[] {
  const total     = Math.max(1, p.totalUnits ?? 0);
  if (total === 0) return [];

  const towers     = Math.max(1, p.towers ?? 1);
  const floors     = Math.max(1, p.floorsPerTower ?? Math.min(20, Math.ceil(total / (towers * 4))));
  const perFloor   = Math.max(1, Math.ceil(total / (towers * floors)));
  const configs    = p.configurations?.length ? p.configurations : ['2 BHK'];
  const basePrice  = p.priceMin ?? 5_000_000;
  const priceStep  = p.pricePerSqftMin ?? 6000;

  // Determine real status counts
  const soldCount  = Math.min(p.soldUnits   ?? 0, total);
  const bookedCount= Math.min(p.bookedUnits ?? 0, total - soldCount);
  const avail      = Math.max(0, p.availableUnits != null
    ? Math.min(p.availableUnits, total - soldCount - bookedCount)
    : total - soldCount - bookedCount);
  const holdCount  = Math.max(0, total - soldCount - bookedCount - avail);

  // Build a shuffled status pool matching real counts
  const pool: UnitStatus[] = [
    ...Array(soldCount).fill('sold'),
    ...Array(bookedCount).fill('booked'),
    ...Array(holdCount).fill('on_hold'),
    ...Array(avail).fill('available'),
  ];
  // Deterministic shuffle (seeded by project id)
  let seed = p.id;
  const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const units: Unit[] = [];
  let idx = 0;
  for (let f = floors; f >= 1; f--) {
    for (let u = 1; u <= perFloor; u++) {
      if (idx >= total) break;
      const carpetSqft = 900 + (u * 80) + (f * 15);
      units.push({
        id: `${p.id}-${f}-${u}`, floor: f, unitNum: u,
        bhk: configs[(u - 1) % configs.length],
        areaSqft: carpetSqft,
        price: basePrice + (f * priceStep * 10) + (u * priceStep * 5),
        status: pool[idx] ?? 'available',
        facing: FACINGS[(u - 1) % 4],
        parking: u % 3 === 0 ? '2 Car' : '1 Car',
      });
      idx++;
    }
  }
  return units;
}

const BuilderInventory = () => {
  const { user } = useAuthStore();
  const [apiProjects, setApiProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

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
        const data = await builderApi.getProjects(bid) as ApiProject[];
        const list = data || [];
        setApiProjects(list);
        if (list.length > 0) {
          setSelectedProjectId(list[0].id);
          setUnits(buildUnits(list[0]));
        }
      } catch {
        toast.error('Could not load projects');
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleProjectChange = (id: number) => {
    setSelectedProjectId(id);
    const p = apiProjects.find(x => x.id === id);
    setUnits(p ? buildUnits(p) : []);
    setSelectedUnit(null);
  };

  const handleStatusChange = (unitId: string, newStatus: UnitStatus) => {
    setUnits(prev => prev.map(u => u.id === unitId ? { ...u, status: newStatus } : u));
    if (selectedUnit?.id === unitId) setSelectedUnit(prev => prev ? { ...prev, status: newStatus } : null);
    toast.success(`Unit marked as ${STATUS_STYLES[newStatus].label}`);
  };

  const project   = apiProjects.find(p => p.id === selectedProjectId);
  const floors    = [...new Set(units.map(u => u.floor))].sort((a, b) => b - a);
  const maxUnitNo = Math.max(...units.map(u => u.unitNum), 0);

  const counts = {
    available: units.filter(u => u.status === 'available').length,
    on_hold:   units.filter(u => u.status === 'on_hold').length,
    booked:    units.filter(u => u.status === 'booked').length,
    sold:      units.filter(u => u.status === 'sold').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">

        {/* Header */}
        <div className="la-banner px-5 py-4 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-bold text-slate-800">Inventory Heat Map</h2>
          {loading ? (
            <Loader2 size={18} className="animate-spin text-slate-400" />
          ) : (
            <select
              value={selectedProjectId ?? ''}
              onChange={e => handleProjectChange(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm"
            >
              {apiProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-slate-300" /></div>
        ) : apiProjects.length === 0 ? (
          <div className="la-card p-12 text-center">
            <p className="text-sm text-slate-400">No projects found. Add a project to see the inventory heat map.</p>
          </div>
        ) : (
          <>
            {/* Legend + stats */}
            <div className="flex items-center gap-3 flex-wrap">
              {(Object.entries(STATUS_STYLES) as [UnitStatus, typeof STATUS_STYLES[UnitStatus]][]).map(([k, v]) => (
                <span key={k} className="text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                  style={{ backgroundColor: v.bg, color: v.text }}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: v.text }} />
                  {v.label} <span className="opacity-60">({counts[k]})</span>
                </span>
              ))}
              {project && (
                <span className="ml-auto text-[11px] text-slate-400 font-medium">
                  {units.length} units · {project.towers ?? 1} tower{(project.towers ?? 1) > 1 ? 's' : ''} · G+{project.floorsPerTower ?? floors.length}
                </span>
              )}
            </div>

            <div className="flex gap-4">
              {/* Grid */}
              <div className="flex-1 la-card p-4 overflow-auto">
                {units.length === 0 ? (
                  <p className="text-sm text-center text-slate-400 py-8">No unit data. Set total units in the project editor to see the heat map.</p>
                ) : (
                  <table className="border-collapse">
                    <thead>
                      <tr>
                        <th className="text-[11px] text-slate-400 px-2 py-1 text-left w-12">Floor</th>
                        {Array.from({ length: maxUnitNo }, (_, i) => (
                          <th key={i} className="text-[11px] text-slate-400 px-0.5 py-1 text-center w-16">U{i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {floors.map(floor => (
                        <tr key={floor}>
                          <td className="text-[11px] font-semibold text-slate-500 px-2 py-0.5">{floor}F</td>
                          {Array.from({ length: maxUnitNo }, (_, i) => {
                            const unit = units.find(u => u.floor === floor && u.unitNum === i + 1);
                            if (!unit) return <td key={i} className="px-0.5 py-0.5"><div className="w-16 h-14 rounded bg-slate-50" /></td>;
                            const s = STATUS_STYLES[unit.status];
                            const isSelected = selectedUnit?.id === unit.id;
                            return (
                              <td key={i} className="px-0.5 py-0.5">
                                <button
                                  onClick={() => setSelectedUnit(isSelected ? null : unit)}
                                  className="w-16 h-14 rounded transition-all hover:scale-105 text-center flex flex-col items-center justify-center gap-0"
                                  style={{
                                    backgroundColor: s.bg, color: s.text,
                                    outline: isSelected ? `2px solid ${s.text}` : 'none',
                                    outlineOffset: 1,
                                  }}>
                                  <p className="text-[10px] font-bold leading-tight">{unit.bhk}</p>
                                  <p className="text-[9px] leading-tight opacity-80">{unit.areaSqft} sqft</p>
                                  <p className="text-[9px] leading-tight">₹{(unit.price / 100000).toFixed(0)}L</p>
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Detail panel */}
              {selectedUnit && (
                <div className="w-64 la-card p-4 space-y-3 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-bold text-slate-800">Unit {selectedUnit.floor}F-U{selectedUnit.unitNum}</h3>
                    <button onClick={() => setSelectedUnit(null)} className="text-slate-300 hover:text-slate-500 text-xs">✕</button>
                  </div>
                  <div className="space-y-1.5 text-[12px]">
                    {[
                      { label: 'Type',    value: selectedUnit.bhk },
                      { label: 'Area',    value: `${selectedUnit.areaSqft} sqft` },
                      { label: 'Price',   value: `₹${selectedUnit.price.toLocaleString('en-IN')}` },
                      { label: 'Facing',  value: selectedUnit.facing ?? '—' },
                      { label: 'Parking', value: selectedUnit.parking ?? '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-slate-400">{label}</span>
                        <span className="font-semibold text-slate-700">{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-1 border-t border-slate-100">
                      <span className="text-slate-400">Status</span>
                      <span className="font-bold text-[11px] px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: STATUS_STYLES[selectedUnit.status].bg, color: STATUS_STYLES[selectedUnit.status].text }}>
                        {STATUS_STYLES[selectedUnit.status].label}
                      </span>
                    </div>
                  </div>
                  <select
                    value={selectedUnit.status}
                    onChange={e => handleStatusChange(selectedUnit.id, e.target.value as UnitStatus)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[12px] text-slate-700"
                  >
                    <option value="available">Available</option>
                    <option value="on_hold">On Hold</option>
                    <option value="booked">Booked</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BuilderInventory;
