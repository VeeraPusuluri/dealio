import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalApi } from '@/lib/api';
import {
  Search, Bookmark, CalendarDays, MapPin, TrendingUp, FileText,
  CheckCircle2, CreditCard, ShieldCheck, Key, ChevronRight, X, ChevronDown, ChevronUp,
  Route,
} from 'lucide-react';

const HIDDEN_KEY = 'dealio_journey_hidden';

/* ── Pipeline stage definitions ───────────────────────────────────────── */
interface PipelineStage {
  id: string;
  label: string;
  icon: React.ElementType;
  nextStep: string | null;
  nextHow: string | null;
  nextLink: string;
  nextLabel: string;
  color: string;
}

const STAGES: PipelineStage[] = [
  {
    id: 'browsing',
    label: 'Browsing',
    icon: Search,
    nextStep: 'Shortlist a project you like',
    nextHow: 'Tap the bookmark icon on any project card to save it for comparison.',
    nextLink: '/',
    nextLabel: 'Browse Projects',
    color: '#6B7280',
  },
  {
    id: 'shortlisted',
    label: 'Shortlisted',
    icon: Bookmark,
    nextStep: 'Schedule a site visit',
    nextHow: 'Open a saved project → tap "Book a Site Visit" to request a visit with the builder.',
    nextLink: '/customer',
    nextLabel: 'View Shortlist',
    color: '#8B5CF6',
  },
  {
    id: 'visit_requested',
    label: 'Visit Requested',
    icon: CalendarDays,
    nextStep: 'Attend your site visit',
    nextHow: 'The builder will confirm a date. Check Meetings for the confirmed time.',
    nextLink: '/customer/meeting',
    nextLabel: 'View Meeting',
    color: '#3B82F6',
  },
  {
    id: 'visit_done',
    label: 'Visit Done',
    icon: MapPin,
    nextStep: 'Discuss pricing & unit preference',
    nextHow: 'Contact your builder or channel partner to share your budget and preferred unit.',
    nextLink: '/customer/conversations',
    nextLabel: 'Contact Builder',
    color: '#0A7E8C',
  },
  {
    id: 'negotiation',
    label: 'Negotiating',
    icon: TrendingUp,
    nextStep: 'Wait for your agreement',
    nextHow: 'Your CP is negotiating on your behalf. You will be notified when an agreement is ready.',
    nextLink: '/customer/journey',
    nextLabel: 'Track Journey',
    color: '#F59E0B',
  },
  {
    id: 'agreement',
    label: 'Agreement Ready',
    icon: FileText,
    nextStep: 'Confirm your acceptance',
    nextHow: 'Go to Journey → review the agreement → tap "Confirm Acceptance" to proceed to booking.',
    nextLink: '/customer/journey',
    nextLabel: 'Confirm Agreement',
    color: '#E87722',
  },
  {
    id: 'booked',
    label: 'Unit Booked',
    icon: CheckCircle2,
    nextStep: 'Apply for a home loan',
    nextHow: 'Visit the Loan section and submit a loan application with your property and income details.',
    nextLink: '/customer/loan',
    nextLabel: 'Apply for Loan',
    color: '#16A34A',
  },
  {
    id: 'loan_applied',
    label: 'Loan Applied',
    icon: CreditCard,
    nextStep: 'Awaiting bank sanction',
    nextHow: 'Track your loan status under the Loan Status page. The bank will notify you on any updates.',
    nextLink: '/customer/loan-status',
    nextLabel: 'Track Loan',
    color: '#0A7E8C',
  },
  {
    id: 'loan_sanctioned',
    label: 'Loan Approved',
    icon: ShieldCheck,
    nextStep: 'Schedule property registration',
    nextHow: 'Contact your builder to arrange the registration date. Carry your original ID and payment.',
    nextLink: '/customer/conversations',
    nextLabel: 'Contact Builder',
    color: '#16A34A',
  },
  {
    id: 'possession',
    label: 'Possession',
    icon: Key,
    nextStep: null,
    nextHow: null,
    nextLink: '/customer/property',
    nextLabel: 'View My Property',
    color: '#6B3FA0',
  },
];

/* ── Helpers ──────────────────────────────────────────────────────────── */
interface DealData {
  dealId?: number;
  dealStatus: string;
  loanStatus?: string;
  loanCaseId?: number;
}
interface MeetingData {
  status: string;
}

function resolveStage(
  deals: DealData[],
  meetings: MeetingData[],
  shortlistCount: number,
): string {
  const deal = deals[0];

  if (deal) {
    const s = deal.dealStatus.toLowerCase();
    if (['possession given', 'registration done'].includes(s)) return 'possession';
    if (deal.loanCaseId) {
      const ls = (deal.loanStatus || '').toLowerCase();
      if (['sanctioned', 'approved', 'disbursed'].includes(ls)) return 'loan_sanctioned';
      return 'loan_applied';
    }
    if (s === 'booked' || s === 'loan application created' || s === 'loan sanctioned' || s === 'loan disbursed') return 'booked';
    if (s === 'agreement') return 'agreement';
    if (s === 'negotiation') return 'negotiation';
    if (['meeting done', 'profile created'].includes(s)) return 'visit_done';
  }

  const confirmedMeeting = meetings.find(m => ['Completed', 'COMPLETED', 'Confirmed', 'CONFIRMED'].includes(m.status));
  if (confirmedMeeting) return 'visit_done';

  const pendingMeeting = meetings.find(m => ['Pending', 'PENDING', 'Requested', 'REQUESTED'].includes(m.status));
  if (pendingMeeting) return 'visit_requested';

  if (shortlistCount > 0) return 'shortlisted';
  return 'browsing';
}

/* ── Component ─────────────────────────────────────────────────────────── */
export default function CustomerPipelineWidget({ phone }: { phone: string }) {
  const navigate = useNavigate();
  const [stageId, setStageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(true);
  const [hidden, setHidden] = useState(() => localStorage.getItem(HIDDEN_KEY) === 'true');
  const [dealId, setDealId] = useState<number | null>(null);

  const shortlistCount = (() => {
    try { return (JSON.parse(localStorage.getItem('dealio_customer_shortlist') ?? '[]') as number[]).length; }
    catch { return 0; }
  })();

  const load = useCallback(() => {
    if (!phone) { setStageId('browsing'); setLoading(false); return; }
    Promise.all([portalApi.getMyDeals(phone), portalApi.getMyMeetings(phone)])
      .then(([deals, meetings]) => {
        const dealList = (deals as DealData[]) || [];
        const stage = resolveStage(
          dealList,
          (meetings as MeetingData[]) || [],
          shortlistCount,
        );
        setStageId(stage);
        setDealId(dealList[0]?.dealId ?? null);
      })
      .catch(() => setStageId('browsing'))
      .finally(() => setLoading(false));
  }, [phone, shortlistCount]);

  useEffect(() => { load(); }, [load]);

  const hide = () => { setHidden(true);  localStorage.setItem(HIDDEN_KEY, 'true');  };
  const show = () => { setHidden(false); localStorage.removeItem(HIDDEN_KEY); };

  if (loading || !stageId) return null;

  if (hidden) {
    return (
      <button
        onClick={show}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-border bg-card text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-muted/40 transition-all text-[12px] font-medium w-full mb-1"
      >
        <Route size={13} />
        Show property journey tracker
      </button>
    );
  }

  const currentIndex = STAGES.findIndex(s => s.id === stageId);
  const current = STAGES[currentIndex];
  const isComplete = stageId === 'possession';

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden mb-1">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: current.color + '20' }}
          >
            <current.icon size={14} style={{ color: current.color }} />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-foreground leading-none">
              Your Purchase Journey
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isComplete ? 'Congratulations — keys handed over!' : `Step ${currentIndex + 1} of ${STAGES.length} · ${current.label}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button
            onClick={hide}
            title="Hide journey tracker"
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Progress stepper */}
          <div className="px-4 py-3 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-0 min-w-max">
              {STAGES.map((stage, i) => {
                const isDone    = i < currentIndex;
                const isCurrent = i === currentIndex;
                const Icon      = stage.icon;
                return (
                  <div key={stage.id} className="flex items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                        style={{
                          backgroundColor: isDone ? stage.color : isCurrent ? stage.color : 'transparent',
                          border: `2px solid ${isDone || isCurrent ? stage.color : '#E2E8F0'}`,
                        }}
                      >
                        <Icon
                          size={12}
                          style={{ color: isDone || isCurrent ? '#fff' : '#94A3B8' }}
                        />
                      </div>
                      <span
                        className="text-[9px] font-medium whitespace-nowrap leading-none"
                        style={{ color: isCurrent ? stage.color : isDone ? '#64748B' : '#94A3B8' }}
                      >
                        {stage.label}
                      </span>
                    </div>
                    {i < STAGES.length - 1 && (
                      <div
                        className="w-8 h-px mx-1 mb-3 rounded-full"
                        style={{ backgroundColor: i < currentIndex ? current.color : '#E2E8F0' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next step card */}
          {!isComplete && current.nextStep ? (
            <div
              className="mx-4 mb-4 rounded-xl p-3.5 flex items-start gap-3"
              style={{ backgroundColor: current.color + '10', border: `1px solid ${current.color}30` }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: current.color }}
              >
                <ChevronRight size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-foreground leading-snug">
                  Next: {current.nextStep}
                </p>
                {current.nextHow && (
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    {current.nextHow}
                  </p>
                )}
                <button
                  onClick={() => navigate(
                    current.nextLink === '/customer/conversations' && dealId != null
                      ? `/customer/conversations?dealId=${dealId}&with=builder`
                      : current.nextLink,
                  )}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: current.color }}
                >
                  {current.nextLabel}
                  <ChevronRight size={11} />
                </button>
              </div>
            </div>
          ) : isComplete ? (
            <div className="mx-4 mb-4 rounded-xl p-3.5 bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                <Key size={14} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-bold text-emerald-800">Congratulations!</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Your property journey is complete. Welcome home!</p>
              </div>
              <button
                onClick={() => navigate('/customer/property')}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-600 text-white hover:opacity-90 shrink-0"
              >
                View Property
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
