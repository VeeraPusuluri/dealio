import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { portalApi, customerApi } from '@/lib/api';
import {
  Building2, MapPin, Compass, Maximize, CheckCircle2,
  Loader2, Home, ArrowRight, Calendar, Phone, MessageCircle,
  BadgeCheck, Tag, Layers, Bookmark, CheckCircle, AlertCircle, RefreshCw,
  Handshake, FileSignature,
} from 'lucide-react';

interface UnitShortlist {
  id: number;
  projectId: number;
  projectName: string;
  projectCity: string;
  unitId: string;
  unitDetails: { bhk?: string; areaSqft?: number; price?: number; floor?: number; facing?: string; };
  status: 'Pending' | 'Accepted' | 'SuggestOther';
  builderNote: string | null;
  createdAt: string;
}

const SHORTLIST_STATUS: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  Pending:     { label: 'Awaiting Builder Review', icon: AlertCircle,   cls: 'bg-amber-50 border-amber-200 text-amber-700' },
  Accepted:    { label: 'Unit Accepted!',           icon: CheckCircle,  cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  SuggestOther:{ label: 'Builder Suggests Another', icon: RefreshCw,    cls: 'bg-blue-50 border-blue-200 text-blue-700' },
};

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

// Title-case to match DB values (normalised by backend)
const BOOKED_STATUSES = new Set(['Booked', 'Loan Sanctioned', 'Closed', 'Possession',
  // legacy uppercase fallback
  'BOOKED', 'LOAN_SANCTIONED', 'CLOSED', 'POSSESSION']);

const ACTIVE_DEAL_STATUSES = new Set(['Negotiation', 'Agreement', 'NEGOTIATION', 'AGREEMENT']);

const STATUS_LABEL: Record<string, string> = {
  // title-case (current)
  'Booked':          'Booked',
  'Loan Sanctioned': 'Loan Sanctioned',
  'Closed':          'Registered',
  'Possession':      'Possession Received',
  'Negotiation':     'Negotiation',
  'Agreement':       'Agreement Reached',
  // uppercase legacy
  BOOKED: 'Booked', LOAN_SANCTIONED: 'Loan Sanctioned',
  CLOSED: 'Registered', POSSESSION: 'Possession Received',
};

const STATUS_COLOR: Record<string, string> = {
  'Booked':          'bg-emerald-100 text-emerald-700',
  'Loan Sanctioned': 'bg-blue-100 text-blue-700',
  'Closed':          'bg-violet-100 text-violet-700',
  'Possession':      'bg-teal-100 text-teal-700',
  'Negotiation':     'bg-amber-100 text-amber-700',
  'Agreement':       'bg-blue-100 text-blue-700',
  // uppercase legacy
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookedDeals, setBookedDeals] = useState<Deal[]>([]);
  const [activeDeals, setActiveDeals] = useState<Deal[]>([]);
  const [projects, setProjects] = useState<Record<number, ProjectDetail>>({});
  const [shortlists, setShortlists] = useState<UnitShortlist[]>([]);

  useEffect(() => {
    const phone = user?.phone;
    if (!phone) { setLoading(false); return; }

    Promise.allSettled([
      portalApi.getMyDeals(phone),
      portalApi.getMyShortlists(phone),
    ]).then(async ([dealsResult, shortlistsResult]) => {
      if (dealsResult.status === 'fulfilled') {
        const all = (dealsResult.value as Deal[]) || [];
        const booked = all.filter(d => BOOKED_STATUSES.has(d.dealStatus));
        const active = all.filter(d => ACTIVE_DEAL_STATUSES.has(d.dealStatus));
        setBookedDeals(booked);
        setActiveDeals(active);
        const details: Record<number, ProjectDetail> = {};
        await Promise.allSettled(
          booked.map(d =>
            customerApi.getProject(d.projectId)
              .then(p => { details[d.projectId] = p as ProjectDetail; })
              .catch(() => {})
          )
        );
        setProjects(details);
      }
      if (shortlistsResult.status === 'fulfilled') {
        setShortlists((shortlistsResult.value as UnitShortlist[]) || []);
      }
    }).finally(() => setLoading(false));
  }, [user?.phone]);

  const fmtPrice = (p?: number) => {
    if (!p) return null;
    if (p >= 10_000_000) return `₹${(p/10_000_000).toFixed(1)}Cr`;
    if (p >= 100_000) return `₹${(p/100_000).toFixed(0)}L`;
    return `₹${p.toLocaleString('en-IN')}`;
  };

  return (
    <DashboardLayout>
      <div className="pb-8 space-y-8">
        {loading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 size={32} className="animate-spin text-emerald-600" />
          </div>
        ) : (
          <>
            {bookedDeals.length === 0 && activeDeals.length === 0 && shortlists.length === 0 && <EmptyState />}

            {/* Active Deals — Negotiation / Agreement stage */}
            {activeDeals.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)' }}>
                    <Handshake size={16} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold text-foreground">Active Deals</h2>
                    <p className="text-[11px] text-muted-foreground">Deals in progress — awaiting final confirmation</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeDeals.map(deal => {
                    const isAgreement = deal.dealStatus.toLowerCase() === 'agreement';
                    const label = STATUS_LABEL[deal.dealStatus] ?? deal.dealStatus;
                    const badgeCls = STATUS_COLOR[deal.dealStatus] ?? 'bg-gray-100 text-gray-600';
                    return (
                      <div key={deal.dealId}
                        className={`bg-card rounded-2xl border p-4 space-y-3 ${isAgreement ? 'border-blue-200' : 'border-amber-200'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[14px] font-bold text-foreground">{deal.projectName}</p>
                            {deal.unitType && <p className="text-[11px] text-muted-foreground mt-0.5">{deal.unitType}</p>}
                          </div>
                          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${badgeCls}`}>{label}</span>
                        </div>
                        {deal.dealValue && (
                          <p className="text-[13px] font-bold text-foreground">{fmtCurrency(deal.dealValue)}</p>
                        )}
                        {isAgreement && (
                          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-100">
                            <FileSignature size={13} className="text-blue-600 shrink-0" />
                            <p className="text-[12px] text-blue-700 font-medium">Agreement stage — check your Journey for documents & next steps.</p>
                          </div>
                        )}
                        <button
                          onClick={() => navigate('/customer/journey')}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold text-white hover:opacity-90 transition-opacity"
                          style={{ background: isAgreement ? 'linear-gradient(135deg,#1d4ed8,#2563eb)' : 'linear-gradient(135deg,#d97706,#f59e0b)' }}>
                          <ArrowRight size={13} /> View in Journey
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {bookedDeals.length > 0 && (
              <div className="space-y-10">
                {bookedDeals.map(deal => (
                  <PropertyCard key={deal.dealId} deal={deal} project={projects[deal.projectId] ?? null} />
                ))}
              </div>
            )}

            {shortlists.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
                    <Bookmark size={16} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold text-foreground">Shortlisted Units</h2>
                    <p className="text-[11px] text-muted-foreground">Units you've requested — awaiting builder response</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shortlists.map(s => {
                    const st = SHORTLIST_STATUS[s.status] ?? SHORTLIST_STATUS['Pending'];
                    const Icon = st.icon;
                    return (
                      <div key={s.id} className="bg-card rounded-2xl border border-border p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[14px] font-bold text-foreground">Unit {s.unitId}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{s.projectName}{s.projectCity ? ` · ${s.projectCity}` : ''}</p>
                          </div>
                          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-semibold shrink-0 ${st.cls}`}>
                            <Icon size={10} /> {st.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                          {s.unitDetails.bhk && <span className="px-2 py-0.5 rounded-full bg-muted border border-border">{s.unitDetails.bhk}</span>}
                          {s.unitDetails.areaSqft && <span className="px-2 py-0.5 rounded-full bg-muted border border-border">{s.unitDetails.areaSqft} sqft</span>}
                          {s.unitDetails.floor && <span className="px-2 py-0.5 rounded-full bg-muted border border-border">Floor {s.unitDetails.floor}</span>}
                          {s.unitDetails.facing && <span className="px-2 py-0.5 rounded-full bg-muted border border-border">{s.unitDetails.facing}</span>}
                          {fmtPrice(s.unitDetails.price) && <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 font-semibold">{fmtPrice(s.unitDetails.price)}</span>}
                        </div>

                        {s.status === 'Accepted' && (
                          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                            <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                            <p className="text-[12px] text-emerald-700 font-medium">Great news! The builder has accepted your unit request.</p>
                          </div>
                        )}

                        {s.status === 'SuggestOther' && (
                          <div className="space-y-2">
                            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-100">
                              <RefreshCw size={13} className="text-blue-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[11px] font-semibold text-blue-700">Builder's message:</p>
                                <p className="text-[12px] text-blue-800 mt-0.5">{s.builderNote || 'Please choose another unit from this project.'}</p>
                              </div>
                            </div>
                            <button onClick={() => navigate('/customer/meeting')}
                              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold border border-border text-foreground hover:bg-muted transition-colors">
                              <Bookmark size={12} /> Shortlist Another Unit
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CustomerProperty;
