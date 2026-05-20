import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { projects } from '@/data/projects';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import StatusBadge from '@/components/shared/StatusBadge';

const AdminProjects = () => {
  const [projectList, setProjectList] = useState(projects.map(p => ({ ...p, approved: true, featured: false })));

  const toggleFeatured = (id: string) => {
    setProjectList(prev => prev.map(p => p.id === id ? { ...p, featured: !p.featured } : p));
    toast.success('Project featured status updated');
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Project Management</h2>
          <button className="px-4 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground">Export CSV</button>
        </div>
        <div className="bg-card rounded-lg card-shadow border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Project</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Builder</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">City</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Units</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Commission</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Featured</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>
              {projectList.map(p => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span className="font-medium text-card-foreground">{p.name}</span>
                    <p className="text-[10px] text-muted-foreground">RERA: {p.rera}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.builder}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.city}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.sold}/{p.totalUnits}</td>
                  <td className="px-4 py-3 font-medium text-secondary">{p.commissionPercent}%</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleFeatured(p.id)} className={`w-8 h-4 rounded-full transition-colors ${p.featured ? 'bg-secondary' : 'bg-muted'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${p.featured ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-secondary hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminProjects;
