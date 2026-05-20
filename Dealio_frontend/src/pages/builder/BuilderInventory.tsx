import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { projects } from '@/data/projects';
import { toast } from 'sonner';

type UnitStatus = 'available' | 'on_hold' | 'booked' | 'sold';

interface Unit {
  id: string; floor: number; unitNum: number; bhk: string; areaSqft: number; price: number;
  status: UnitStatus; holdCp?: string; holdClient?: string; holdExpiry?: string; facing?: string; parking?: string;
}

const statusStyles: Record<UnitStatus, { bg: string; text: string; label: string }> = {
  available: { bg: '#E1F5EE', text: '#0F6E56', label: 'Available' },
  on_hold: { bg: '#FAEEDA', text: '#633806', label: 'On Hold' },
  booked: { bg: '#E6F1FB', text: '#0C447C', label: 'Booked' },
  sold: { bg: '#FCEBEB', text: '#A32D2D', label: 'Sold' },
};

const generateUnits = (projectId: string): Unit[] => {
  const p = projects.find(x => x.id === projectId);
  if (!p) return [];
  const floors = Math.min(Math.ceil(p.totalUnits / 4), 20);
  const unitsPerFloor = 4;
  const units: Unit[] = [];
  const bhkOptions = p.bhkTypes;
  let soldCount = 0;
  for (let f = 1; f <= floors; f++) {
    for (let u = 1; u <= unitsPerFloor; u++) {
      const idx = (f - 1) * unitsPerFloor + u;
      let status: UnitStatus = 'available';
      if (soldCount < p.sold && Math.random() < 0.55) { status = 'sold'; soldCount++; }
      else if (idx % 7 === 0) status = 'booked';
      else if (idx % 11 === 0) { status = 'on_hold'; }
      units.push({
        id: `${projectId}-${f}-${u}`, floor: f, unitNum: u,
        bhk: bhkOptions[u % bhkOptions.length], areaSqft: 1200 + (u * 100) + (f * 20),
        price: p.priceRange[0] + (f * 50000) + (u * 100000), status,
        facing: ['East', 'West', 'North', 'South'][u % 4],
        parking: u % 3 === 0 ? '2 Car' : '1 Car',
        ...(status === 'on_hold' ? { holdCp: 'Ravi Kumar', holdClient: 'Vijay Anand', holdExpiry: new Date(Date.now() + 12 * 3600000).toISOString() } : {}),
      });
    }
  }
  return units;
};

const BuilderInventory = () => {
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || '');
  const [units, setUnits] = useState<Unit[]>(() => generateUnits(projects[0]?.id || ''));
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const handleProjectChange = (pid: string) => { setSelectedProject(pid); setUnits(generateUnits(pid)); setSelectedUnit(null); };

  const handleStatusChange = (unitId: string, newStatus: UnitStatus) => {
    setUnits(prev => prev.map(u => u.id === unitId ? { ...u, status: newStatus, holdCp: undefined, holdClient: undefined, holdExpiry: undefined } : u));
    toast.success(`Unit status changed to ${statusStyles[newStatus].label}`);
  };

  const floors = [...new Set(units.map(u => u.floor))].sort((a, b) => b - a);
  const maxUnit = Math.max(...units.map(u => u.unitNum), 0);

  const project = projects.find(p => p.id === selectedProject);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="la-banner px-5 py-4 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-bold text-slate-800">Inventory Heat Map</h2>
          <select value={selectedProject} onChange={e => handleProjectChange(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm">
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="flex gap-2.5 flex-wrap">
          {Object.entries(statusStyles).map(([k, v]) => (
            <span key={k} className="text-[11px] font-medium px-3 py-1.5 rounded-full" style={{ backgroundColor: v.bg, color: v.text }}>● {v.label}</span>
          ))}
        </div>

        <div className="flex gap-4">
          <div className="flex-1 la-card p-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-xs text-muted-foreground px-2 py-1 text-left">Floor</th>
                  {Array.from({ length: maxUnit }, (_, i) => <th key={i} className="text-xs text-muted-foreground px-1 py-1 text-center">U{i + 1}</th>)}
                </tr>
              </thead>
              <tbody>
                {floors.map(floor => (
                  <tr key={floor}>
                    <td className="text-xs font-medium text-card-foreground px-2 py-1">{floor}F</td>
                    {Array.from({ length: maxUnit }, (_, i) => {
                      const unit = units.find(u => u.floor === floor && u.unitNum === i + 1);
                      if (!unit) return <td key={i} />;
                      const style = statusStyles[unit.status];
                      return (
                        <td key={i} className="px-0.5 py-0.5">
                          <button onClick={() => setSelectedUnit(unit)} className="w-full rounded p-1.5 text-center transition-transform hover:scale-105 cursor-pointer" style={{ backgroundColor: style.bg, color: style.text, minWidth: 60 }}>
                            <p className="text-[10px] font-bold">{unit.bhk}</p>
                            <p className="text-[9px]">{unit.areaSqft} sqft</p>
                            <p className="text-[9px]">₹{(unit.price / 100000).toFixed(0)}L</p>
                            {unit.status === 'on_hold' && <p className="text-[8px] mt-0.5">⏰ {unit.holdCp}</p>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedUnit && (
            <div className="w-72 la-card p-4 space-y-3 flex-shrink-0">
              <h3 className="font-semibold text-slate-800">Unit Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-slate-400">Floor:</span> <span className="text-slate-700 font-medium">{selectedUnit.floor}F</span></p>
                <p><span className="text-slate-400">Unit:</span> <span className="text-slate-700 font-medium">U{selectedUnit.unitNum}</span></p>
                <p><span className="text-slate-400">Type:</span> <span className="text-slate-700 font-medium">{selectedUnit.bhk}</span></p>
                <p><span className="text-slate-400">Area:</span> <span className="text-slate-700 font-medium">{selectedUnit.areaSqft} sqft</span></p>
                <p><span className="text-slate-400">Price:</span> <span className="text-slate-700 font-medium">₹{selectedUnit.price.toLocaleString('en-IN')}</span></p>
                <p><span className="text-slate-400">Facing:</span> <span className="text-slate-700 font-medium">{selectedUnit.facing}</span></p>
                <p><span className="text-slate-400">Parking:</span> <span className="text-slate-700 font-medium">{selectedUnit.parking}</span></p>
                <p><span className="text-slate-400">Status:</span> <span className="font-bold" style={{ color: statusStyles[selectedUnit.status].text }}>{statusStyles[selectedUnit.status].label}</span></p>
                {selectedUnit.holdCp && <p className="text-xs text-slate-400">Held by: {selectedUnit.holdCp} for {selectedUnit.holdClient}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <select value={selectedUnit.status} onChange={e => { handleStatusChange(selectedUnit.id, e.target.value as UnitStatus); setSelectedUnit({ ...selectedUnit, status: e.target.value as UnitStatus }); }} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 shadow-sm">
                  <option value="available">Available</option><option value="on_hold">On Hold</option>
                  <option value="booked">Booked</option><option value="sold">Sold</option>
                </select>
              </div>
              <button onClick={() => setSelectedUnit(null)} className="w-full text-xs text-slate-400 hover:text-teal-600">Close</button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BuilderInventory;
