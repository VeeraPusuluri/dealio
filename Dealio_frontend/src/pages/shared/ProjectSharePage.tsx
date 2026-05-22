import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { builderApi } from '@/lib/api';
import {
  Building2, MapPin, Calendar, Shield, MessageSquare,
  Loader2, Home, CheckCircle2, Star, Clock,
} from 'lucide-react';

interface ProjectDetail {
  id: number;
  name: string;
  city: string;
  locality?: string;
  address?: string | null;
  status: string;
  configurations?: string[];
  priceMin?: number | null;
  priceMax?: number | null;
  possessionDate?: string | null;
  reraNumber?: string | null;
  reraExpiry?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  builderName?: string | null;
  totalUnits?: number | null;
  availableUnits?: number | null;
  featured?: boolean;
  closingSoon?: boolean;
}

const fmt = (n: number) => {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(0)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const STATUS_LABEL: Record<string, string> = {
  PRE_LAUNCH: 'Pre-Launch', LAUNCHED: 'Launched',
  UNDER_CONSTRUCTION: 'Under Construction', READY_TO_MOVE: 'Ready to Move',
  NEW_LAUNCH: 'New Launch', ACTIVE: 'Active', CLOSING_SOON: 'Closing Soon',
};

const ProjectSharePage = () => {
  const { token } = useParams<{ token: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  let projectId: string | null = null;
  try {
    if (token) projectId = atob(token).split(':')[0];
  } catch { /* invalid token */ }

  useEffect(() => {
    if (!projectId) {
      setError('Invalid share link');
      setLoading(false);
      return;
    }
    builderApi.getPublicProject(projectId)
      .then(d => setProject(d as ProjectDetail))
      .catch(() => setError('Project not found or unavailable'))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">
      <div className="text-center">
        <Loader2 className="animate-spin text-[#E87722] mx-auto mb-3" size={36} />
        <p className="text-sm text-gray-500">Loading project details…</p>
      </div>
    </div>
  );

  if (error || !project) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center p-8">
      <div>
        <Building2 size={52} className="mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Link Unavailable</h2>
        <p className="text-sm text-gray-500">{error || 'This share link is invalid or has expired.'}</p>
      </div>
    </div>
  );

  const priceStr = project.priceMin && project.priceMax
    ? `${fmt(project.priceMin)} – ${fmt(project.priceMax)}`
    : project.priceMin ? `Starting ${fmt(project.priceMin)}`
    : project.priceMax ? `Up to ${fmt(project.priceMax)}`
    : 'Price on request';

  const waMsg =
    `Hi! 👋\n\nI'm interested in *${project.name}*${project.city ? ` in ${project.city}` : ''}.\n\n` +
    `Could you please share more details and arrange a site visit?\n\nThank you! 🙏`;

  const fullAddress = [project.address, project.locality, project.city].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top brand bar */}
      <div className="bg-[#E87722] text-white text-center py-2.5 text-xs font-semibold tracking-wide">
        Shared by your trusted Channel Partner · <span className="font-black">Dealio</span>
      </div>

      <div className="max-w-lg mx-auto pb-10">

        {/* Hero image */}
        <div className="relative h-60 bg-gradient-to-br from-orange-50 to-slate-100">
          {project.imageUrl
            ? <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Building2 size={72} className="text-slate-200" /></div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/90 text-slate-700">
              {STATUS_LABEL[project.status] ?? project.status}
            </span>
            {project.featured && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                <Star size={8} fill="currentColor" /> Featured
              </span>
            )}
            {project.closingSoon && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                <Clock size={8} /> Closing Soon
              </span>
            )}
          </div>
          <div className="absolute bottom-4 left-5 right-5">
            <h1 className="text-2xl font-black text-white leading-tight">{project.name}</h1>
            {project.builderName && (
              <p className="text-white/75 text-sm mt-0.5 flex items-center gap-1">
                <Building2 size={11} /> {project.builderName}
              </p>
            )}
          </div>
        </div>

        <div className="p-5 space-y-4">

          {/* Price card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Price Range</p>
            <div className="text-3xl font-black text-[#E87722] mb-2">{priceStr}</div>
            {fullAddress && (
              <div className="flex items-start gap-1.5 text-sm text-gray-500">
                <MapPin size={13} className="mt-0.5 shrink-0" /> {fullAddress}
              </div>
            )}
          </div>

          {/* Configurations */}
          {project.configurations && project.configurations.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Home size={11} /> Available Configurations
              </p>
              <div className="flex flex-wrap gap-2">
                {project.configurations.map(c => (
                  <span key={c}
                    className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm border border-blue-100">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key details */}
          <div className="grid grid-cols-2 gap-3">
            {project.possessionDate && (
              <div className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1.5"><Calendar size={12} /> Possession</div>
                <div className="font-black text-gray-800">{project.possessionDate.slice(0, 7)}</div>
              </div>
            )}
            {project.availableUnits != null && (
              <div className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1.5"><Home size={12} /> Available Units</div>
                <div className="font-black text-emerald-600">{project.availableUnits}</div>
              </div>
            )}
            {project.reraNumber && (
              <div className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm col-span-2">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1.5"><Shield size={12} /> RERA Registration</div>
                <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> {project.reraNumber}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {project.description && (
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>
            </div>
          )}

          {/* CTA */}
          <div className="pt-2 space-y-3">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(waMsg)}`}
              target="_blank" rel="noreferrer"
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-black text-base shadow-lg"
              style={{ backgroundColor: '#25D366' }}>
              <MessageSquare size={20} /> Enquire on WhatsApp
            </a>
            <p className="text-center text-xs text-gray-400 pb-4">
              Powered by <span className="font-bold text-[#E87722]">Dealio</span> · India's Real Estate Platform
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProjectSharePage;
