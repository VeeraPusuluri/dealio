import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import JourneyTimeline from '@/components/shared/JourneyTimeline';
import { useAuthStore } from '@/stores/useAuthStore';
import { portalApi } from '@/lib/api';
import {
  Loader2, AlertCircle, ListChecks, FileText, Clock, CheckCircle2,
  TrendingUp, Handshake, ExternalLink, MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DealDoc {
  id: number;
  name: string;
  docType: string;
  fileUrl?: string | null;
  createdAt: string;
}

interface DealMessage {
  id: number;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

interface CustomerDeal {
  dealId: number;
  projectId: number;
  projectName: string;
  unitType?: string;
  dealStatus: string;
  dealValue?: number | null;
  customerConfirmed?: boolean;
  cpAgreed?: boolean;
  createdAt: string;
  loanCaseId?: number;
  loanAmount?: number;
  loanStatus?: string;
  tenureMonths?: number;
  interestRate?: number;
  dealDocuments?: DealDoc[];
  messages?: DealMessage[];
}

interface ApiMeeting {
  id: number;
  projectId: number;
  projectName: string;
  preferredDate: string;
  confirmedDate?: string;
  status: string;
  createdAt: string;
}

type JourneyStep = {
  label: string;
  date?: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  notes?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateLabel(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtCrore(value: number): string {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2)} Cr`;
  if (value >= 100_000)    return `₹${(value / 100_000).toFixed(1)} L`;
  return `₹${value.toLocaleString('en-IN')}`;
}

// Deal statuses from backend are title-case: 'Negotiation', 'Agreement', 'Booked', etc.
// Journey order uses the actual backend strings (case-insensitive compare below)
const DEAL_STAGE_ORDER = [
  'meeting done',
  'negotiation',
  'agreement',
  'booked',
  'loan sanctioned',
  'closed',
];

const LOAN_ORDER = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED'];

function dealStageIndex(status: string): number {
  return DEAL_STAGE_ORDER.indexOf(status.toLowerCase());
}

function buildJourney(deals: CustomerDeal[], meetings: ApiMeeting[]): JourneyStep[] {
  const steps: JourneyStep[] = [];

  const sortedMeetings = [...meetings].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  sortedMeetings.forEach(m => {
    const done      = ['Completed', 'COMPLETED'].includes(m.status);
    const cancelled = ['Cancelled', 'CANCELLED'].includes(m.status);
    if (cancelled) return;
    steps.push({
      label: done
        ? `Site Visit Completed — ${m.projectName || 'Project'}`
        : `Site Visit Scheduled — ${m.projectName || 'Project'}`,
      date: toDateLabel(done ? (m.confirmedDate || m.preferredDate) : m.createdAt),
      status: done ? 'completed' : 'in-progress',
    });
  });

  if (deals.length === 0) {
    if (steps.length === 0) return [];
    steps.push({ label: 'Registration', status: 'upcoming' });
    steps.push({ label: 'Possession',   status: 'upcoming' });
    return steps;
  }

  const deal      = deals[0];
  const dealIdx   = dealStageIndex(deal.dealStatus);
  const dealDate  = toDateLabel(deal.createdAt);
  const suffix    = deal.projectName ? ` — ${deal.projectName}` : '';

  if (dealIdx >= dealStageIndex('negotiation'))
    steps.push({ label: `Negotiation${suffix}`, date: dealDate, status: 'completed' });

  if (dealIdx >= dealStageIndex('agreement'))
    steps.push({
      label: `Agreement${suffix}`,
      date: dealDate,
      status: deal.customerConfirmed ? 'completed' : 'in-progress',
      notes: deal.customerConfirmed ? 'Accepted by you' : 'Awaiting your acceptance',
    });

  if (dealIdx >= dealStageIndex('booked'))
    steps.push({
      label: `Unit Booked${suffix}`,
      date: dealDate,
      status: 'completed',
      notes: deal.unitType || undefined,
    });

  if (deal.loanCaseId) {
    const loanIdx = deal.loanStatus ? LOAN_ORDER.indexOf(deal.loanStatus) : -1;
    steps.push({ label: 'Home Loan Applied', status: loanIdx >= 0 ? 'completed' : 'in-progress' });
    if (loanIdx >= LOAN_ORDER.indexOf('APPROVED'))
      steps.push({
        label: `Loan Approved${deal.loanAmount ? ` ${fmtCrore(deal.loanAmount)}` : ''}`,
        status: 'completed',
        notes: deal.interestRate && deal.tenureMonths
          ? `${deal.interestRate}% · ${Math.round(deal.tenureMonths / 12)} yrs`
          : undefined,
      });
    if (loanIdx >= LOAN_ORDER.indexOf('DISBURSED'))
      steps.push({ label: 'Loan Disbursed', status: 'completed' });
  }

  if (dealIdx >= dealStageIndex('loan sanctioned') || dealIdx >= dealStageIndex('closed')) {
    steps.push({ label: 'Registration Pending', status: 'in-progress', notes: 'Documents being prepared' });
    steps.push({ label: 'Possession', status: 'upcoming' });
  } else {
    steps.push({ label: 'Registration', status: 'upcoming' });
    steps.push({ label: 'Possession',   status: 'upcoming' });
  }

  return steps;
}

// ─── Active Deal Card ─────────────────────────────────────────────────────────

function ActiveDealCard({
  deal,
  phone,
  onConfirmed,
}: {
  deal: CustomerDeal;
  phone: string;
  onConfirmed: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const isNegotiation = deal.dealStatus.toLowerCase() === 'negotiation';
  const isAgreement   = deal.dealStatus.toLowerCase() === 'agreement';

  const cardCls = isNegotiation
    ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
    : 'bg-gradient-to-br from-blue-50 to-teal-50 border-blue-200';

  const badgeCls = isNegotiation
    ? 'bg-amber-100 text-amber-800 border border-amber-300'
    : 'bg-blue-100 text-blue-800 border border-blue-300';

  const stageLabel  = isNegotiation ? 'Negotiation in progress' : 'Agreement reached';
  const stageNote   = isNegotiation
    ? 'Your channel partner is coordinating with the builder on pricing and terms.'
    : 'The builder has shared an agreement. Please review and confirm your acceptance.';

  async function handleConfirm() {
    setConfirming(true);
    try {
      await portalApi.confirmDeal(deal.dealId, phone);
      toast.success('Acceptance confirmed! The builder has been notified.');
      onConfirmed();
    } catch (err) {
      toast.error((err as Error).message || 'Could not confirm. Please try again.');
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${cardCls}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: isNegotiation
                ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                : 'linear-gradient(135deg,#0A7E8C,#0d9488)',
            }}
          >
            {isNegotiation ? (
              <TrendingUp size={18} className="text-white" />
            ) : (
              <Handshake size={18} className="text-white" />
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Deal</p>
            <h2 className="text-base font-bold text-gray-900 leading-tight">
              {deal.projectName || 'Your Property'}
            </h2>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${badgeCls}`}>
          {stageLabel}
        </span>
      </div>

      {/* Deal value */}
      {deal.dealValue ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Deal value:</span>
          <span className="text-sm font-semibold text-gray-900">{fmtCrore(deal.dealValue)}</span>
        </div>
      ) : null}

      {/* Stage explanation */}
      <p className="text-sm text-gray-600 leading-relaxed">{stageNote}</p>

      {/* Confirm button / confirmed badge — only shown at Agreement stage */}
      {isAgreement && (
        deal.customerConfirmed ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
            <CheckCircle2 size={17} className="text-teal-600" />
            You've confirmed acceptance
          </div>
        ) : (
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}
          >
            {confirming ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <CheckCircle2 size={15} />
            )}
            {confirming ? 'Confirming…' : 'Confirm Acceptance'}
          </button>
        )
      )}

      {/* Documents — shown for both negotiation and agreement stages */}
      <div className="space-y-2 pt-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {isNegotiation ? 'Pricing & Documents' : 'Documents from Builder'}
        </p>
        {(deal.dealDocuments && deal.dealDocuments.length > 0) ? (
          deal.dealDocuments.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 bg-white/70 border border-gray-200 rounded-xl px-4 py-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                doc.docType === 'Pricing Quote' ? 'bg-teal-50' : 'bg-blue-50'
              }`}>
                <FileText size={15} className={doc.docType === 'Pricing Quote' ? 'text-teal-500' : 'text-blue-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                <p className="text-xs text-gray-400">{doc.docType}</p>
              </div>
              {doc.fileUrl ? (
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 shrink-0">
                  <ExternalLink size={12} /> Open
                </a>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium shrink-0">
                  <Clock size={12} /> Pending
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400 italic bg-white/60 rounded-xl px-4 py-3 border border-dashed border-gray-200">
            {isNegotiation
              ? 'Your pricing quote will appear here once the builder shares it.'
              : 'Documents will appear here once the builder shares them.'}
          </p>
        )}
      </div>

      {/* Messages from builder/CP */}
      {deal.messages && deal.messages.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <MessageSquare size={11} /> Messages
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {deal.messages.map(msg => {
              const isBuilder = msg.senderRole === 'builder';
              const isCP      = msg.senderRole === 'cp';
              return (
                <div key={msg.id} className={`rounded-xl px-3.5 py-2.5 text-sm ${
                  isBuilder
                    ? 'bg-teal-50 border border-teal-100'
                    : isCP
                      ? 'bg-orange-50 border border-orange-100'
                      : 'bg-white/70 border border-gray-200'
                }`}>
                  <p className={`text-[10px] font-bold mb-0.5 ${
                    isBuilder ? 'text-teal-600' : isCP ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                    {msg.senderName} · {isBuilder ? 'Builder' : isCP ? 'Channel Partner' : msg.senderRole}
                  </p>
                  <p className="text-gray-800 leading-relaxed">{msg.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(msg.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const CustomerJourney = () => {
  const { user } = useAuthStore();
  const [steps,      setSteps]      = useState<JourneyStep[]>([]);
  const [activeDeal, setActiveDeal] = useState<CustomerDeal | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [empty,      setEmpty]      = useState(false);

  const phone = user?.phone ?? '';

  const load = useCallback(() => {
    if (!phone) { setLoading(false); setEmpty(true); return; }
    Promise.all([portalApi.getMyDeals(phone), portalApi.getMyMeetings(phone)])
      .then(([dealsData, meetingsData]) => {
        const deals    = (dealsData    as CustomerDeal[]) || [];
        const meetings = (meetingsData as ApiMeeting[])   || [];

        // Identify the first deal in an active negotiation / agreement stage
        const active = deals.find(d => {
          const s = d.dealStatus.toLowerCase();
          return s === 'negotiation' || s === 'agreement';
        }) ?? null;
        setActiveDeal(active);

        const journey = buildJourney(deals, meetings);
        setSteps(journey);
        setEmpty(journey.length === 0 && !active);
      })
      .catch(() => toast.error('Could not load journey'))
      .finally(() => setLoading(false));
  }, [phone]);

  useEffect(() => { load(); }, [load]);

  function handleConfirmed() {
    setActiveDeal(prev => prev ? { ...prev, customerConfirmed: true } : prev);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Page header */}
        <div className="pt-1 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366F1, #818CF8)' }}
          >
            <ListChecks size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Property Journey</h1>
            <p className="text-sm text-gray-500">Track every milestone from visit to possession</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="animate-spin text-secondary" />
          </div>
        ) : (
          <>
            {/* Active deal card — shown above timeline when in Negotiation / Agreement */}
            {activeDeal && (
              <ActiveDealCard
                deal={activeDeal}
                phone={phone}
                onConfirmed={handleConfirmed}
              />
            )}

            {/* Journey timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              {empty ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={28} className="text-gray-300" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">No journey data yet</h3>
                  <p className="text-sm text-gray-500">
                    Schedule a site visit or book a unit to get started.
                  </p>
                </div>
              ) : (
                <JourneyTimeline steps={steps} />
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CustomerJourney;
