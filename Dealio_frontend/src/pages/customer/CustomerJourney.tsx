import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import JourneyTimeline from '@/components/shared/JourneyTimeline';
import { useAuthStore } from '@/stores/useAuthStore';
import { portalApi } from '@/lib/api';
import { Loader2, AlertCircle, ListChecks } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerDeal {
  dealId: number; projectId: number; projectName: string; unitType?: string;
  dealStatus: string; createdAt: string; loanCaseId?: number; loanAmount?: number;
  loanStatus?: string; tenureMonths?: number; interestRate?: number;
}
interface ApiMeeting {
  id: number; projectId: number; projectName: string; preferredDate: string;
  confirmedDate?: string; status: string; createdAt: string;
}
type JourneyStep = { label: string; date?: string; status: 'completed' | 'in-progress' | 'upcoming'; notes?: string; };

function toDateLabel(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const DEAL_ORDER = ['MEETING_COMPLETED', 'NEGOTIATION', 'INTERESTED_LOAN_REQUIRED', 'BOOKED', 'LOAN_SANCTIONED', 'CLOSED'];
const LOAN_ORDER = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED'];

function buildJourney(deals: CustomerDeal[], meetings: ApiMeeting[]): JourneyStep[] {
  const steps: JourneyStep[] = [];
  const sortedMeetings = [...meetings].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  sortedMeetings.forEach(m => {
    const done = ['Completed', 'COMPLETED'].includes(m.status);
    const cancelled = ['Cancelled', 'CANCELLED'].includes(m.status);
    if (cancelled) return; // don't show cancelled visits in timeline
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
    steps.push({ label: 'Possession', status: 'upcoming' });
    return steps;
  }
  const deal = deals[0];
  const dealIdx = DEAL_ORDER.indexOf(deal.dealStatus);
  const dealDate = toDateLabel(deal.createdAt);
  const projectSuffix = deal.projectName ? ` — ${deal.projectName}` : '';
  if (dealIdx >= DEAL_ORDER.indexOf('NEGOTIATION')) steps.push({ label: `Negotiation${projectSuffix}`, date: dealDate, status: 'completed' });
  if (dealIdx >= DEAL_ORDER.indexOf('BOOKED')) steps.push({ label: `Unit Booked${projectSuffix}`, date: dealDate, status: 'completed', notes: deal.unitType || undefined });
  if (deal.loanCaseId) {
    const loanIdx = deal.loanStatus ? LOAN_ORDER.indexOf(deal.loanStatus) : -1;
    steps.push({ label: 'Home Loan Applied', status: loanIdx >= 0 ? 'completed' : 'in-progress' });
    if (loanIdx >= LOAN_ORDER.indexOf('APPROVED')) steps.push({ label: `Loan Approved${deal.loanAmount ? ` ₹${(deal.loanAmount / 10_000_000).toFixed(2)}Cr` : ''}`, status: 'completed', notes: deal.interestRate && deal.tenureMonths ? `${deal.interestRate}% · ${Math.round(deal.tenureMonths / 12)} yrs` : undefined });
    if (loanIdx >= LOAN_ORDER.indexOf('DISBURSED')) steps.push({ label: 'Loan Disbursed', status: 'completed' });
  }
  if (dealIdx >= DEAL_ORDER.indexOf('LOAN_SANCTIONED') || dealIdx >= DEAL_ORDER.indexOf('CLOSED')) {
    steps.push({ label: 'Registration Pending', status: 'in-progress', notes: 'Documents being prepared' });
    steps.push({ label: 'Possession', status: 'upcoming' });
  } else {
    steps.push({ label: 'Registration', status: 'upcoming' });
    steps.push({ label: 'Possession', status: 'upcoming' });
  }
  return steps;
}

const CustomerJourney = () => {
  const { user } = useAuthStore();
  const [steps, setSteps] = useState<JourneyStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    const phone = user?.phone;
    if (!phone) { setLoading(false); setEmpty(true); return; }
    Promise.all([portalApi.getMyDeals(phone), portalApi.getMyMeetings(phone)])
      .then(([dealsData, meetingsData]) => {
        const deals = (dealsData as CustomerDeal[]) || [];
        const meetings = (meetingsData as ApiMeeting[]) || [];
        const journey = buildJourney(deals, meetings);
        setSteps(journey);
        setEmpty(journey.length === 0);
      })
      .catch(() => toast.error('Could not load journey'))
      .finally(() => setLoading(false));
  }, [user?.phone]);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <div className="pt-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #6366F1, #818CF8)' }}>
            <ListChecks size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Property Journey</h1>
            <p className="text-sm text-gray-500">Track every milestone from visit to possession</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-secondary" /></div>
          ) : empty ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} className="text-gray-300" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">No journey data yet</h3>
              <p className="text-sm text-gray-500">Schedule a site visit or book a unit to get started.</p>
            </div>
          ) : (
            <JourneyTimeline steps={steps} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerJourney;