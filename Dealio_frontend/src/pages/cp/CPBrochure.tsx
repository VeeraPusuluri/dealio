import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { projects } from '@/data/projects';
import { Download, Share2 } from 'lucide-react';

const CPBrochure = () => {
  const [selectedProject, setSelectedProject] = useState(projects[0].id);
  const project = projects.find(p => p.id === selectedProject)!;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">Brochure Generator</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Select Project</label>
              <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm text-card-foreground">
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Your Photo</label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <p className="text-sm text-muted-foreground">Drop your photo here or click to upload</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-secondary text-secondary-foreground flex items-center justify-center gap-1.5"><Download size={14} /> Download PDF</button>
              <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${project.name} - ${project.bhkTypes.join('/')} at ${project.location}. Contact Ravi Kumar: 9800012345`)}`)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-available text-white flex items-center justify-center gap-1.5"><Share2 size={14} /> WhatsApp</button>
            </div>
          </div>
          {/* Preview */}
          <div className="bg-card rounded-lg card-shadow border border-border overflow-hidden">
            <img src={project.image} alt={project.name} className="w-full h-48 object-cover" />
            <div className="p-5 space-y-3">
              <h3 className="text-xl font-bold text-card-foreground">{project.name}</h3>
              <p className="text-sm text-muted-foreground">{project.location}, {project.city}</p>
              <div className="flex gap-2 flex-wrap">
                {project.bhkTypes.map(b => <span key={b} className="text-xs px-2.5 py-1 rounded-pill bg-muted text-muted-foreground font-medium">{b}</span>)}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm text-muted-foreground">Starting {`₹${(project.priceRange[0]/100000).toFixed(0)}L`}</span>
                <span className="text-sm font-bold text-accent">{project.commissionPercent}% Commission</span>
              </div>
              <div className="bg-muted rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold">R</div>
                <div>
                  <p className="font-semibold text-sm text-card-foreground">Ravi Kumar</p>
                  <p className="text-xs text-muted-foreground">9800012345</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CPBrochure;
