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
  | 'Possession Given'
  | 'Interior Referred'
  | 'Interior In Progress'
  | 'Interior Completed';

export const milestoneStages: MilestoneStage[] = [
  'Enquiry', 'Site Visit Scheduled', 'Site Visit Done', 'Negotiation', 'Booked',
  'Loan Application Created', 'Loan Sanctioned', 'Loan Disbursed',
  'Registration Done', 'Possession Given', 'Interior Referred',
  'Interior In Progress', 'Interior Completed',
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
  'Interior Referred': '#E87722',
  'Interior In Progress': '#D97706',
  'Interior Completed': '#15803D',
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
  interiorThreadId?: string;
  currentStage: MilestoneStage;
  stageHistory: { stage: MilestoneStage; date: string; updatedBy: string }[];
  lastActivityDate: string;
  daysInCurrentStage: number;
  notes?: string;
}

const initialMilestones: CustomerMilestone[] = [
  {
    id: 'CM001', customerId: 'C001', customerName: 'Rahul Singh', phone: '9800111222', email: 'rahul@email.com',
    projectId: 'P003', projectName: 'My Home Avatar', unitType: '4BHK', unit: '1204', tower: 'C', sqft: 2800, price: 22000000,
    bookingDate: '2024-12-15', cpId: 'CP001', cpName: 'Ravi Kumar', builderId: 'B001', builderName: 'My Home Group',
    loanThreadId: 'LT001', currentStage: 'Loan Disbursed',
    stageHistory: [
      { stage: 'Enquiry', date: '2024-11-20', updatedBy: 'Ravi Kumar (CP)' },
      { stage: 'Site Visit Scheduled', date: '2024-11-25', updatedBy: 'Ravi Kumar (CP)' },
      { stage: 'Site Visit Done', date: '2024-11-28', updatedBy: 'System' },
      { stage: 'Negotiation', date: '2024-12-01', updatedBy: 'Ravi Kumar (CP)' },
      { stage: 'Booked', date: '2024-12-15', updatedBy: 'My Home Group (Builder)' },
      { stage: 'Loan Application Created', date: '2024-12-22', updatedBy: 'System' },
      { stage: 'Loan Sanctioned', date: '2025-01-02', updatedBy: 'Ramesh Babu (Bank)' },
      { stage: 'Loan Disbursed', date: '2025-01-10', updatedBy: 'Ramesh Babu (Bank)' },
    ],
    lastActivityDate: '2025-01-10', daysInCurrentStage: 9,
  },
  {
    id: 'CM002', customerId: 'C002', customerName: 'Vijay Anand', phone: '9876543210', email: 'vijay@email.com',
    projectId: 'P001', projectName: 'Prestige Skyline', unitType: '3BHK', unit: '1504', tower: 'A', sqft: 1850, price: 11000000,
    bookingDate: '2025-01-05', cpId: 'CP001', cpName: 'Ravi Kumar', builderId: 'B001', builderName: 'Prestige Group',
    currentStage: 'Negotiation',
    stageHistory: [
      { stage: 'Enquiry', date: '2024-12-28', updatedBy: 'Ravi Kumar (CP)' },
      { stage: 'Site Visit Scheduled', date: '2025-01-02', updatedBy: 'Ravi Kumar (CP)' },
      { stage: 'Site Visit Done', date: '2025-01-05', updatedBy: 'System' },
      { stage: 'Negotiation', date: '2025-01-10', updatedBy: 'Ravi Kumar (CP)' },
    ],
    lastActivityDate: '2025-01-15', daysInCurrentStage: 5,
  },
  {
    id: 'CM003', customerId: 'C003', customerName: 'Sneha Patel', phone: '9876543211', email: 'sneha@email.com',
    projectId: 'P002', projectName: 'Sobha Meridian', unitType: '2BHK', cpId: 'CP002', cpName: 'Priya Sharma',
    builderId: 'B002', builderName: 'Sobha Ltd', currentStage: 'Negotiation',
    stageHistory: [
      { stage: 'Enquiry', date: '2025-01-02', updatedBy: 'Priya Sharma (CP)' },
      { stage: 'Negotiation', date: '2025-01-10', updatedBy: 'Priya Sharma (CP)' },
    ],
    lastActivityDate: '2025-01-14', daysInCurrentStage: 5,
  },
  {
    id: 'CM004', customerId: 'C004', customerName: 'Arjun Reddy', phone: '9876543212', email: 'arjun@email.com',
    projectId: 'P003', projectName: 'My Home Avatar', unitType: '4BHK', unit: '1204', tower: 'C', sqft: 2800, price: 22000000,
    bookingDate: '2024-12-20', cpId: 'CP001', cpName: 'Ravi Kumar', builderId: 'B001', builderName: 'My Home Group',
    interiorThreadId: 'IT001', currentStage: 'Interior Referred',
    stageHistory: [
      { stage: 'Enquiry', date: '2024-11-15', updatedBy: 'Ravi Kumar (CP)' },
      { stage: 'Booked', date: '2024-12-20', updatedBy: 'My Home Group (Builder)' },
      { stage: 'Loan Application Created', date: '2024-12-25', updatedBy: 'System' },
      { stage: 'Loan Sanctioned', date: '2025-01-05', updatedBy: 'Bank' },
      { stage: 'Loan Disbursed', date: '2025-01-12', updatedBy: 'Bank' },
      { stage: 'Registration Done', date: '2025-01-15', updatedBy: 'Admin' },
      { stage: 'Possession Given', date: '2025-01-18', updatedBy: 'My Home Group (Builder)' },
      { stage: 'Interior Referred', date: '2025-01-19', updatedBy: 'Ravi Kumar (CP)' },
    ],
    lastActivityDate: '2025-01-19', daysInCurrentStage: 0,
  },
  {
    id: 'CM005', customerId: 'C005', customerName: 'Kavitha Rao', phone: '9876543215', email: 'kavitha@email.com',
    projectId: 'P006', projectName: 'Mahindra Happinest', unitType: '2BHK', cpId: 'CP004', cpName: 'Lakshmi Reddy',
    builderId: 'B006', builderName: 'Mahindra Lifespaces', currentStage: 'Site Visit Scheduled',
    stageHistory: [
      { stage: 'Enquiry', date: '2025-01-08', updatedBy: 'Lakshmi Reddy (CP)' },
      { stage: 'Site Visit Scheduled', date: '2025-01-15', updatedBy: 'Lakshmi Reddy (CP)' },
    ],
    lastActivityDate: '2025-01-15', daysInCurrentStage: 4,
  },
  {
    id: 'CM006', customerId: 'C006', customerName: 'Naresh Kumar', phone: '9876543216', email: 'naresh@email.com',
    projectId: 'P002', projectName: 'Sobha Meridian', unitType: '3BHK', unit: 'B-804', tower: 'B', sqft: 1650, price: 8800000,
    bookingDate: '2024-12-15', cpId: 'CP007', cpName: 'Kiran Naidu', builderId: 'B002', builderName: 'Sobha Ltd',
    currentStage: 'Possession Given',
    stageHistory: [
      { stage: 'Enquiry', date: '2024-11-01', updatedBy: 'Kiran Naidu (CP)' },
      { stage: 'Booked', date: '2024-12-15', updatedBy: 'Sobha Ltd (Builder)' },
      { stage: 'Loan Disbursed', date: '2025-01-05', updatedBy: 'Bank' },
      { stage: 'Registration Done', date: '2025-01-10', updatedBy: 'Admin' },
      { stage: 'Possession Given', date: '2025-01-15', updatedBy: 'Sobha Ltd (Builder)' },
    ],
    lastActivityDate: '2025-01-15', daysInCurrentStage: 4,
  },
  {
    id: 'CM007', customerId: 'C007', customerName: 'Meera Krishnan', phone: '9876543213', email: 'meera@email.com',
    projectId: 'P001', projectName: 'Prestige Skyline', unitType: '4BHK', cpId: 'CP003', cpName: 'Mohammed Salim',
    currentStage: 'Enquiry',
    stageHistory: [
      { stage: 'Enquiry', date: '2025-01-18', updatedBy: 'Mohammed Salim (CP)' },
    ],
    lastActivityDate: '2025-01-18', daysInCurrentStage: 1,
  },
  {
    id: 'CM008', customerId: 'C008', customerName: 'Ramesh Goud', phone: '9876543214', email: 'ramesh.g@email.com',
    projectId: 'P005', projectName: 'Incor Carmel Heights', unitType: '3BHK', cpId: 'CP005', cpName: 'Suresh Babu',
    currentStage: 'Site Visit Scheduled',
    stageHistory: [
      { stage: 'Enquiry', date: '2025-01-12', updatedBy: 'Suresh Babu (CP)' },
      { stage: 'Site Visit Scheduled', date: '2025-01-16', updatedBy: 'Suresh Babu (CP)' },
    ],
    lastActivityDate: '2025-01-16', daysInCurrentStage: 3,
  },
];

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
