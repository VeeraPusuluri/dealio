import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { projects } from '@/data/projects';

type UnitStatus = 'Available' | 'Booked' | 'Sold' | 'Hold';
const statusColors: Record<UnitStatus, string> = { Available: '#16A34A', Booked: '#F59E0B', Sold: '#DC2626', Hold: '#9CA3AF' };

interface Unit { id: string; tower: string; floor: number; unit: number; bhk: string; status: UnitStatus; price: number; }

const generateUnits = (projectId: string): Unit[] => {
  const project = projects.find(p => p.id === projectId);
  if (!project) return [];
  const units: Unit[] = [];
  const towers = ['A', 'B', 'C'];
  const floors = 15;
  const perFloor = Math.ceil(project.totalUnits / (towers.length * floors));
  let avail = project.available, booked = project.booked, sold = project.sold;
  for (const tower of towers) {
    for (let floor = 1; floor <= floors; floor++) {
      for (let u = 1; u <= perFloor; u++) {
        let status: UnitStatus = 'Available';
        if (sold > 0) { status = 'Sold'; sold--; }
        else if (booked > 0) { status = 'Booked'; booked--; }
        else if (avail > 0) { status = 'Available'; avail--; }
        else { status = 'Hold'; }
        units.push({ id: `${tower}-${floor}${String(u).padStart(2, '0')}`, tower, floor, unit: u, bhk: project.bhkTypes[u % project.bhkTypes.length], status, price: project.priceRange[0] + Math.random() * (project.priceRange[1] - project.priceRange[0]) });
      }
    }
  }
  return units.slice(0, project.totalUnits);
};

const BuilderUnits = () => {
  const [selectedProject, setSelectedProject] = useState(projects[0].id);
  const units = generateUnits(selectedProject);
  const towers = [...new Set(units.map(u => u.tower))];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="la-banner px-5 py-4 flex items-center gap-4 flex-wrap">
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm">
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex gap-3 ml-auto">
            {Object.entries(statusColors).map(([s, c]) => (
              <div key={s} className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} /> {s}
              </div>
            ))}
          </div>
        </div>
        {towers.map(tower => (
          <div key={tower} className="la-card p-5">
            <h3 className="font-semibold text-slate-700 mb-3">Tower {tower}</h3>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5">
              {units.filter(u => u.tower === tower).map(u => (
                <button
                  key={u.id}
                  className="aspect-square rounded text-[10px] font-semibold flex items-center justify-center hover:opacity-80 transition-opacity text-white"
                  style={{ backgroundColor: statusColors[u.status] }}
                  title={`${u.id} | ${u.bhk} | ${u.status}`}
                >
                  {u.floor}{String(u.unit).padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default BuilderUnits;
