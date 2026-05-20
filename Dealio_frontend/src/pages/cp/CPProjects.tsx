import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { builderApi } from '@/lib/api';
import { Building2, MapPin, Share2, Loader2, CheckCircle2, Calendar } from 'lucide-react';
import FlyerModal from '@/components/shared/FlyerModal';

interface ProjectSummary {
  id: number;
  name: string;
  city: string;
  locality?: string;
  projectType: string;
  status: string;
  configurations?: string[];
  priceMin?: number;
  priceMax?: number;
  possessionDate?: string;
  featured?: boolean;
  closingSoon?: boolean;
  reraNumber?: string;
  description?: string;
}

const STATUS_COLORS: Record<string, string> = {
  PRE_LAUNCH: 'bg-purple-100 text-purple-700',
  LAUNCHED: 'bg-blue-100 text-blue-700',
  UNDER_CONSTRUCTION: 'bg-amber-100 text-amber-700',
  READY_TO_MOVE: 'bg-green-100 text-green-700',
  NEW_LAUNCH: 'bg-purple-100 text-purple-700',
  ACTIVE: 'bg-green-100 text-green-700',
  CLOSING_SOON: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  PRE_LAUNCH: 'Pre-Launch',
  LAUNCHED: 'Launched',
  UNDER_CONSTRUCTION: 'Under Construction',
  READY_TO_MOVE: 'Ready to Move',
  NEW_LAUNCH: 'New Launch',
  ACTIVE: 'Active',
  CLOSING_SOON: 'Closing Soon',
};

const fmtPrice = (min?: number, max?: number) => {
  if (!min && !max) return 'Price on request';
  const fmt = (n: number) => {
    if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`;
    if (n >= 100_000) return `₹${(n / 100_000).toFixed(0)} L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max || 0);
};

const CPProjects = () => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flyerProject, setFlyerProject] = useState<ProjectSummary | null>(null);

  useEffect(() => {
    builderApi.getPublicProjects()
      .then((data) => setProjects((data as ProjectSummary[]) || []))
      .catch(() => setError('Could not load projects. Make sure the backend is running.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout>
      <div className="text-center py-24">
        <Building2 className="mx-auto mb-3 text-muted-foreground" size={40} />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border rounded-xl">
            <Building2 className="mx-auto mb-3 text-muted-foreground" size={40} />
            <h3 className="font-semibold text-foreground mb-1">No projects available yet</h3>
            <p className="text-sm text-muted-foreground">Projects added by builders will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {projects.map(project => (
              <div key={project.id} className="bg-card rounded-lg card-shadow border border-border overflow-hidden">
                <div className="h-36 flex items-center justify-center relative"
                  style={{ background: 'linear-gradient(135deg, #0F2A4520, #0A7E8C20)' }}>
                  <Building2 size={48} className="text-secondary/30" />
                  <span className={`absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[project.status] || 'bg-muted text-muted-foreground'}`}>
                    {STATUS_LABELS[project.status] || project.status}
                  </span>
                </div>
                <div className="p-4 space-y-2.5">
                  <h3 className="font-bold text-card-foreground">{project.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin size={11} />
                    {project.locality ? `${project.locality}, ` : ''}{project.city}
                  </div>
                  {project.configurations && project.configurations.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.configurations.slice(0, 4).map((c) => (
                        <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{c}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-card-foreground">{fmtPrice(project.priceMin, project.priceMax)}</span>
                    {project.possessionDate && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar size={10} /> {project.possessionDate.slice(0, 7)}
                      </span>
                    )}
                  </div>
                  {project.reraNumber && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 size={10} className="text-green-500" /> RERA: {project.reraNumber}
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${project.name} - ${project.configurations?.join('/') || ''} at ${project.locality || ''}, ${project.city}. ${fmtPrice(project.priceMin, project.priceMax)}`)}`)}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90 flex items-center justify-center gap-1 bg-[#25D366]"
                    >
                      <Share2 size={12} /> Share
                    </button>
                    <button
                      onClick={() => setFlyerProject(project)}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold bg-secondary text-secondary-foreground hover:opacity-90"
                    >
                      Generate Flyer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {flyerProject && <FlyerModal project={flyerProject} onClose={() => setFlyerProject(null)} />}
    </DashboardLayout>
  );
};

export default CPProjects;