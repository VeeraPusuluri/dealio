import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { portalApi } from '@/lib/api';
import { toast } from 'sonner';

interface CustomerDeal {
  dealId: number; projectId: number; projectName: string; unitType?: string; dealValue?: number;
  dealStatus: string; createdAt: string; loanCaseId?: number; loanAmount?: number;
  propertyValue?: number; employmentType?: string; tenureMonths?: number; interestRate?: number; loanStatus?: string;
}

const LOAN_MILESTONES = [
  { key: 'SUBMITTED', label: 'Application Submitted' },
  { key: 'UNDER_REVIEW', label: 'Documents Under Review' },
  { key: 'APPROVED', label: 'Loan Approved' },
  { key: 'DISBURSED', label: 'Disbursed' },
];
const LOAN_ORDER = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED'];

function getMilestones(loanStatus?: string) {
  const idx = loanStatus ? LOAN_ORDER.indexOf(loanStatus) : -1;
  return LOAN_MILESTONES.map((m, i) => ({
    label: m.label,
    status: (i < idx ? 'Completed' : i === idx ? 'In Progress' : 'Pending') as 'Completed' | 'In Progress' | 'Pending',
  }));
}

const DEAL_LABEL: Record<string, string> = {
  MEETING_COMPLETED: 'Meeting Done', NEGOTIATION: 'In Negotiation',
  INTERESTED_LOAN_REQUIRED: 'Loan Pending', BOOKED: 'Booked',
  LOAN_SANCTIONED: 'Loan Sanctioned', CLOSED: 'Closed',
};

const CustomerLoanStatus = () => {
  const { user } = useAuthStore();
  const [deals, setDeals] = useState<CustomerDeal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeals = async () => {
    const phone = user?.phone;
    if (!phone) { setLoading(false); return; }
    setLoading(true);
    try { const data = await portalApi.getMyDeals(phone); setDeals((data as CustomerDeal[]) || []); }
    catch { toast.error('Could not load loan status'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDeals(); }, [user?.phone]);

  const loansWithCase = deals.filter(d => d.loanCaseId);

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8">
        <div className="pt-1 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Loan Status</h1>
            <p className="text-sm text-gray-500">Track your home loan application progress</p>
          </div>
          <button onClick={fetchDeals} disabled={loading} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1.5 transition-colors">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={36} className="animate-spin text-secondary" /></div>
        ) : loansWithCase.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">No Active Loan</h2>
            <p className="text-sm text-gray-500">You don't have an active loan application yet.</p>
          </div>
        ) : (
          loansWithCase.map(deal => {
            const milestones = getMilestones(deal.loanStatus);
            const completed = milestones.filter(m => m.status === 'Completed').length;
            const progress = (completed / milestones.length) * 100;
            return (
              <div key={deal.dealId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{deal.projectName || 'My Property'}</h3>
                    <p className="text-sm text-gray-500">{deal.unitType ? `${deal.unitType} · ` : ''}{deal.loanAmount ? `Loan ₹${(deal.loanAmount / 100000).toFixed(0)}L` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Deal Status</p>
                    <p className="text-sm font-semibold text-secondary">{DEAL_LABEL[deal.dealStatus] || deal.dealStatus}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <Progress value={progress} className="h-2 flex-1" />
                  <span className="text-sm font-semibold text-gray-900">{Math.round(progress)}%</span>
                </div>

                <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-2">
                  {milestones.map((m, i) => (
                    <div key={m.label} className="flex items-center">
                      <div className="flex flex-col items-center min-w-[90px]">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${m.status === 'Completed' ? 'bg-emerald-500 text-white' : m.status === 'In Progress' ? 'bg-amber-500 text-white animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
                          {m.status === 'Completed' ? <CheckCircle2 size={16} /> : m.status === 'In Progress' ? <Clock size={16} /> : <span className="text-xs">{i + 1}</span>}
                        </div>
                        <p className={`text-[10px] text-center mt-1 max-w-[90px] font-medium ${m.status === 'Completed' ? 'text-emerald-600' : m.status === 'In Progress' ? 'text-amber-600' : 'text-gray-400'}`}>{m.label}</p>
                      </div>
                      {i < milestones.length - 1 && <div className={`h-0.5 w-8 ${m.status === 'Completed' ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  {milestones.map(m => (
                    <div key={m.label} className={`flex items-center gap-3 p-3 rounded-xl ${m.status === 'Completed' ? 'bg-emerald-50 border border-emerald-100' : m.status === 'In Progress' ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-100'}`}>
                      {m.status === 'Completed' ? <CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> : m.status === 'In Progress' ? <Clock size={15} className="text-amber-500 shrink-0" /> : <AlertCircle size={15} className="text-gray-300 shrink-0" />}
                      <p className="text-sm font-medium text-gray-900">{m.label}</p>
                    </div>
                  ))}
                  {deal.loanStatus === 'REJECTED' && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                      <p className="text-sm font-medium text-red-600">Application Rejected — contact your builder</p>
                    </div>
                  )}
                  {(deal.interestRate || deal.tenureMonths || deal.employmentType) && (
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
                      {deal.interestRate && <span>Rate: {deal.interestRate}%</span>}
                      {deal.tenureMonths && <span>Tenure: {deal.tenureMonths} months ({Math.round(deal.tenureMonths / 12)} yrs)</span>}
                      {deal.employmentType && <span>Employment: {deal.employmentType}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
};

export default CustomerLoanStatus;