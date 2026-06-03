import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { portalApi, customerApi } from '@/lib/api';
import {
  Building2, MapPin, Compass, Maximize, CheckCircle2,
  Loader2, Home, ArrowRight, Calendar, Phone, MessageCircle,
  BadgeCheck, Tag, Layers,
} from 'lucide-react';

interface Deal {
  dealId: number;
  projectId: number;
  projectName: string;
  unitType?: string;
  dealValue?: number;
  dealStatus: string;
  createdAt: string;
  builderName?: string;
}

interface ProjectDetail {
  id: number;
  name: string;
  address?: string | null;
  city?: string | null;
  locality?: string | null;
  configurations?: string[] | null;
  amenities?: string[] | null;
  imageUrl?: string | null;
  builderName?: string | null;
  builderContactPhone?: string | null;
  possessionDate?: string | null;
}

const BOOKED_STATUSES = new Set(['BOOKED', 'LOAN_SANCTIONED', 'CLOSED', 'POSSESSION']);

const STATUS_LABEL: Record<string, string> = {
  BOOKED: 'Booked',
  LOAN_SANCTIONED: 'Loan Sanctioned',
  CLOSED: 'Registered',
  POSSESSION: 'Possession Received',
};

const STATUS_COLOR: Record<string, string> = {
  BOOKED: 'bg-emerald-100 text-emerald-700',
  LOAN_SANCTIONED: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-violet-100 text-violet-700',
  POSSESSION: 'bg-teal-100 text-teal-700',
};

function fmtCurrency(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

/* ── Empty state ── */
function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}>
        <Home size={40} style={{ color: '#16a34a' }} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">No property booked yet</h2>
      <p className="text-gray-500 text-sm max-w-sm mb-8 leading-relaxed">
        Once you book a property, all your details — payment schedules, construction
        updates, and documents — will appear right here.
      </p>
      <button
        onClick={() => navigate('/customer')}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        style={{ background: 'linear-gradient(135deg,#16a34a,#14b040)' }}>
        Browse Properties <ArrowRight size={15} />
      </button>
    </div>
  );
}

/* ── Property card ── */
function PropertyCard({ deal, project }: { deal: Deal; project: ProjectDetail | null }) {
  const navigate = useNavigate();
  const label = STATUS_LABEL[deal.dealStatus] ?? deal.dealStatus;
  const badgeCls = STATUS_COLOR[deal.dealStatus] ?? 'bg-gray-100 text-gray-600';
  const amenities = project?.amenities?.slice(0, 10) ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {project?.imageUrl && (
          <div className="h-44 w-full overflow-hidden">
            <img src={project.imageUrl} alt={deal.projectName}
              className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{deal.projectName}</h1>
              {(project?.locality || project?.city) && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                  <MapPin size={13} className="text-emerald-600 shrink-0" />
                  {[project.locality, project.city].filter(Boolean).join(', ')}
                </div>
              )}
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                {deal.unitType && (
                  <span className="flex items-center gap-1.5">
                    <Maximize size={13} className="text-gray-400" /> {deal.unitType}
                  </span>
                )}
                {project?.builderName && (
                  <span className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-gray-400" /> {project.builderName}
                  </span>
                )}
                {project?.configurations && project.configurations.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Layers size={13} className="text-gray-400" /> {project.configurations.join(' · ')}
                  </span>
                )}
                {project?.possessionDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-gray-400" />
                    Possession: {new Date(project.possessionDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeCls}`}>{label}</span>
          </div>
        </div>
      </div>

      {/* Deal value */}
      {deal.dealValue && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Deal Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Tag size={11} /> Total Value</p>
              <p className="text-xl font-bold text-gray-900">{fmtCurrency(deal.dealValue)}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><BadgeCheck size={11} /> Status</p>
              <p className="text-sm font-semibold text-gray-900">{label}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Calendar size={11} /> Booked On</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(deal.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Amenities */}
      {amenities.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {amenities.map(a => (
              <span key={a} className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 border border-gray-100 text-gray-700 flex items-center gap-1">
                <CheckCircle2 size={11} style={{ color: '#16A34A' }} /> {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate('/customer/meeting', {
            state: { projectId: deal.projectId, projectName: deal.projectName },
          })}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg,#16a34a,#14b040)' }}>
          <Calendar size={15} /> Schedule a Visit
        </button>
        {project?.builderContactPhone && (
          <a href={`tel:${project.builderContactPhone}`}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            <Phone size={15} /> Call Builder
          </a>
        )}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Hi, I have a query about my property ${deal.projectName}.`)}`}
          target="_blank" rel="noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
          <MessageCircle size={15} /> WhatsApp Support
        </a>
        <button
          onClick={() => window.open(`/customer/projects/${deal.projectId}?standalone=1`, '_blank')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
          <Compass size={15} /> View Project Details
        </button>
      </div>
    </div>
  );
}

/* ── Main page ── */
const CustomerProperty = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [bookedDeals, setBookedDeals] = useState<Deal[]>([]);
  const [projects, setProjects] = useState<Record<number, ProjectDetail>>({});

  useEffect(() => {
    const phone = user?.phone;
    if (!phone) { setLoading(false); return; }

    portalApi.getMyDeals(phone)
      .then(async (data) => {
        const all = (data as Deal[]) || [];
        const booked = all.filter(d => BOOKED_STATUSES.has(d.dealStatus));
        setBookedDeals(booked);

        // Fetch project details for each booked deal
        const details: Record<number, ProjectDetail> = {};
        await Promise.allSettled(
          booked.map(d =>
            customerApi.getProject(d.projectId)
              .then(p => { details[d.projectId] = p as ProjectDetail; })
              .catch(() => {})
          )
        );
        setProjects(details);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.phone]);

  return (
    <DashboardLayout>
      <div className="pb-8">
        {loading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 size={32} className="animate-spin text-emerald-600" />
          </div>
        ) : bookedDeals.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-10">
            {bookedDeals.map(deal => (
              <PropertyCard key={deal.dealId} deal={deal} project={projects[deal.projectId] ?? null} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CustomerProperty;
