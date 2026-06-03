import { create } from 'zustand';
import { portalApi } from '@/lib/api';

export type MilestoneStage =
  | 'Enquiry'
  | 'Site Visit Scheduled'
  | 'Site Visit Done'
  | 'Negotiation'
  | 'Booked'
  | 'Loan Application Created'
  | 'Loan Sanctioned'
  | 'Loan Disbursed'
  | 'Registration Done'
  | 'Possession Given';

export const milestoneStages: MilestoneStage[] = [
  'Enquiry', 'Site Visit Scheduled', 'Site Visit Done', 'Negotiation', 'Booked',
  'Loan Application Created', 'Loan Sanctioned', 'Loan Disbursed',
  'Registration Done', 'Possession Given',
];

export const milestoneColors: Record<MilestoneStage, string> = {
  'Enquiry': '#0EA5E9',
  'Site Visit Scheduled': '#6366F1',
  'Site Visit Done': '#8B5CF6',
  'Negotiation': '#F59E0B',
  'Booked': '#10B981',
  'Loan Application Created': '#3B82F6',
  'Loan Sanctioned': '#0A7E8C',
  'Loan Disbursed': '#16A34A',
  'Registration Done': '#059669',
  'Possession Given': '#047857',
};

export interface CustomerMilestone {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  email: string;
  projectId: string;
  projectName: string;
  unitType: string;
  unit?: string;
  tower?: string;
  sqft?: number;
  price?: number;
  bookingDate?: string;
  cpId?: string;
  cpName?: string;
  builderId?: string;
  builderName?: string;
  loanThreadId?: string;
  currentStage: MilestoneStage;
  stageHistory: { stage: MilestoneStage; date: string; updatedBy: string }[];
  lastActivityDate: string;
  daysInCurrentStage: number;
  notes?: string;
}

const initialMilestones: CustomerMilestone[] = [];

// Maps backend DealStatus + LoanCaseStatus → MilestoneStage
function deriveMilestoneStage(dealStatus: string, loanStatus?: string): MilestoneStage {
  if (dealStatus === 'CLOSED') return 'Registration Done';
  if (dealStatus === 'LOAN_SANCTIONED') return 'Loan Disbursed';
  if (loanStatus === 'DISBURSED') return 'Loan Disbursed';
  if (loanStatus === 'APPROVED') return 'Loan Sanctioned';
  if (loanStatus === 'UNDER_REVIEW' || loanStatus === 'SUBMITTED') return 'Loan Application Created';
  if (dealStatus === 'INTERESTED_LOAN_REQUIRED') return 'Loan Application Created';
  if (dealStatus === 'BOOKED') return 'Booked';
  if (dealStatus === 'NEGOTIATION') return 'Negotiation';
  if (dealStatus === 'MEETING_COMPLETED') return 'Site Visit Done';
  return 'Enquiry';
}

interface CustomerMilestoneState {
  milestones: CustomerMilestone[];
  updateStage: (id: string, newStage: MilestoneStage, updatedBy: string) => void;
  addMilestone: (milestone: CustomerMilestone) => void;
  getMilestonesByStage: (stage: MilestoneStage) => CustomerMilestone[];
  fetchFromApi: (phone: string, userName: string) => Promise<void>;
}

export const useCustomerMilestoneStore = create<CustomerMilestoneState>((set, get) => ({
  milestones: initialMilestones,
  updateStage: (id, newStage, updatedBy) =>
    set((state) => ({
      milestones: state.milestones.map((m) =>
        m.id === id
          ? {
              ...m,
              currentStage: newStage,
              stageHistory: [...m.stageHistory, { stage: newStage, date: new Date().toISOString().split('T')[0], updatedBy }],
              lastActivityDate: new Date().toISOString().split('T')[0],
              daysInCurrentStage: 0,
            }
          : m
      ),
    })),
  addMilestone: (milestone) => set((state) => ({ milestones: [...state.milestones, milestone] })),
  getMilestonesByStage: (stage) => get().milestones.filter((m) => m.currentStage === stage),
  fetchFromApi: async (phone, userName) => {
    try {
      const data = await portalApi.getMyDeals(phone) as Array<{
        dealId: number; projectId: number; projectName: string; unitType?: string;
        dealValue?: number; dealStatus: string; createdAt: string;
        loanCaseId?: number; loanAmount?: number; loanStatus?: string;
      }>;
      if (!data?.length) return;

      const apiMilestones: CustomerMilestone[] = data.map((d) => {
        const stage = deriveMilestoneStage(d.dealStatus, d.loanStatus);
        return {
          id: `api-${d.dealId}`,
          customerId: phone,
          customerName: userName,
          phone,
          email: '',
          projectId: String(d.projectId),
          projectName: d.projectName || '',
          unitType: d.unitType || '',
          price: d.dealValue,
          currentStage: stage,
          stageHistory: [{ stage, date: d.createdAt?.split('T')[0] ?? '', updatedBy: 'System' }],
          lastActivityDate: d.createdAt?.split('T')[0] ?? '',
          daysInCurrentStage: 0,
        };
      });

      set((state) => {
        // Replace any existing api-sourced milestones for this phone, keep mock ones
        const filtered = state.milestones.filter(
          (m) => !m.id.startsWith('api-') || m.customerId !== phone
        );
        return { milestones: [...apiMilestones, ...filtered] };
      });
    } catch { /* fail silently — store retains existing data */ }
  },
}));
