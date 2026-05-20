import { create } from 'zustand';
import {
  Deal, DealStatus, DealMessage, DealDocument, DealActivity,
  MeetingRequest, LoanCase, ShareEvent, ProjectPublishStatus,
  loanMilestoneStages,
} from '@/data/deals';
import { builderApi } from '@/lib/api';
import { useNotificationStore } from '@/stores/useNotificationStore';

interface ProjectPublishState {
  [projectId: string]: {
    status: ProjectPublishStatus;
    commissionType: 'fixed' | 'percent';
    commissionValue: number;
    publishedAt?: string;
  };
}

interface DealState {
  deals: Deal[];
  meetingRequests: MeetingRequest[];
  loanCases: LoanCase[];
  shareEvents: ShareEvent[];
  projectPublishStates: ProjectPublishState;
  loading: boolean;
  builderId: string | null;

  // Data loading
  fetchDeals: (builderId: string) => Promise<void>;

  // Project publish
  publishProject: (projectId: string, commissionType: 'fixed' | 'percent', commissionValue: number) => void;
  updateProjectPublishStatus: (projectId: string, status: ProjectPublishStatus) => void;
  updateProjectCommission: (projectId: string, commissionType: 'fixed' | 'percent', commissionValue: number) => void;

  // Deals
  updateDealStatus: (dealId: string, status: DealStatus) => void;
  setDealCommission: (dealId: string, type: 'fixed' | 'percent', value: number, status: 'Pending' | 'Approved' | 'Paid') => void;
  addDealMessage: (dealId: string, message: Omit<DealMessage, 'id' | 'timestamp'>) => void;
  addDealDocument: (dealId: string, doc: Omit<DealDocument, 'id' | 'uploadedAt'>) => void;
  addDealActivity: (dealId: string, activity: Omit<DealActivity, 'id' | 'timestamp'>) => void;

  // Meeting requests
  createMeetingRequest: (req: Omit<MeetingRequest, 'id' | 'createdAt' | 'status'>) => void;
  updateMeetingStatus: (id: string, status: MeetingRequest['status'], notes?: string, date?: string, time?: string) => void;

  // Loan cases
  createLoanCase: (lc: Omit<LoanCase, 'id' | 'milestones' | 'submittedAt' | 'status'>) => void;
  updateLoanMilestone: (caseId: string, milestoneStage: string, status: 'Completed' | 'In Progress', notes?: string) => void;

  // Share events
  addShareEvent: (event: Omit<ShareEvent, 'id' | 'timestamp'>) => void;
}

export const useDealStore = create<DealState>((set, get) => ({
  deals: [],
  meetingRequests: [],
  loanCases: [],
  shareEvents: [],
  projectPublishStates: {},
  loading: false,
  builderId: null,

  fetchDeals: async (builderId) => {
    set({ loading: true, builderId });
    try {
      const data = await builderApi.getBuilderDeals(builderId) as any[];
      const normalized: Deal[] = (data || []).map((d: any) => ({
        ...d,
        messages:   Array.isArray(d.messages)   ? d.messages   : [],
        documents:  Array.isArray(d.documents)  ? d.documents  : [],
        activities: Array.isArray(d.activities) ? d.activities : [],
      }));
      set({ deals: normalized });
    } catch {
      set({ deals: [] });
    } finally {
      set({ loading: false });
    }
  },

  publishProject: (projectId, commissionType, commissionValue) => {
    set((s) => ({
      projectPublishStates: {
        ...s.projectPublishStates,
        [projectId]: { status: 'Published', commissionType, commissionValue, publishedAt: new Date().toISOString() },
      },
    }));
    useNotificationStore.getState().addNotification({ type: 'info', title: 'Project Published', message: `New project listing is now live for all CPs`, role: 'cp' });
  },

  updateProjectPublishStatus: (projectId, status) =>
    set((s) => ({
      projectPublishStates: {
        ...s.projectPublishStates,
        [projectId]: { ...s.projectPublishStates[projectId], status },
      },
    })),

  updateProjectCommission: (projectId, commissionType, commissionValue) =>
    set((s) => ({
      projectPublishStates: {
        ...s.projectPublishStates,
        [projectId]: { ...s.projectPublishStates[projectId], commissionType, commissionValue },
      },
    })),

  updateDealStatus: (dealId, status) => {
    set((s) => ({
      deals: s.deals.map((d) => d.id === dealId ? { ...d, status, updatedAt: new Date().toISOString().split('T')[0] } : d),
    }));
    const { builderId } = get();
    if (builderId) builderApi.updateBuilderDealStatus(builderId, dealId, status).catch(() => {});
  },

  setDealCommission: (dealId, type, value, status) =>
    set((s) => ({
      deals: s.deals.map((d) => d.id === dealId ? { ...d, commissionType: type, commissionValue: value, commissionStatus: status } : d),
    })),

  addDealMessage: (dealId, msg) =>
    set((s) => ({
      deals: s.deals.map((d) => d.id === dealId ? {
        ...d,
        messages: [...(d.messages || []), { ...msg, id: `MSG${Date.now()}`, timestamp: new Date().toISOString() }],
      } : d),
    })),

  addDealDocument: (dealId, doc) =>
    set((s) => ({
      deals: s.deals.map((d) => d.id === dealId ? {
        ...d,
        documents: [...(d.documents || []), { ...doc, id: `DD${Date.now()}`, uploadedAt: new Date().toISOString().split('T')[0] }],
      } : d),
    })),

  addDealActivity: (dealId, activity) =>
    set((s) => ({
      deals: s.deals.map((d) => d.id === dealId ? {
        ...d,
        activities: [...(d.activities || []), { ...activity, id: `DA${Date.now()}`, timestamp: new Date().toISOString() }],
      } : d),
    })),

  createMeetingRequest: (req) => {
    const id = `MR${Date.now()}`;
    set((s) => ({
      meetingRequests: [...s.meetingRequests, { ...req, id, status: 'Pending', createdAt: new Date().toISOString() }],
    }));
    const requester = req.cpName || req.customerName || 'A customer';
    useNotificationStore.getState().addNotification({
      type: 'info',
      title: 'Meeting Requested',
      message: `${requester} requested a meeting for ${req.customerName} at ${req.projectName}`,
      role: 'builder',
    });
  },

  updateMeetingStatus: (id, status, notes, date, time) => {
    set((s) => ({
      meetingRequests: s.meetingRequests.map((m) => m.id === id ? {
        ...m, status, builderNotes: notes || m.builderNotes,
        confirmedDate: date || m.confirmedDate, confirmedTime: time || m.confirmedTime,
      } : m),
    }));
    const mr = get().meetingRequests.find((m) => m.id === id);
    if (mr) {
      useNotificationStore.getState().addNotification({ type: 'success', title: `Meeting ${status}`, message: `Meeting for ${mr.customerName} at ${mr.projectName} is now ${status}`, role: 'cp' });
    }
  },

  createLoanCase: (lc) => {
    const id = `LC${Date.now()}`;
    const milestones = loanMilestoneStages.map((stage, i) => ({
      id: `LM${Date.now()}_${i}`, stage, status: i === 0 ? 'In Progress' as const : 'Pending' as const,
    }));
    set((s) => ({
      loanCases: [...s.loanCases, { ...lc, id, milestones, status: 'Active', submittedAt: new Date().toISOString().split('T')[0] }],
      deals: s.deals.map((d) => d.id === lc.dealId ? { ...d, loanCaseId: id, status: 'Loan Applied' } : d),
    }));
    useNotificationStore.getState().addNotification({ type: 'info', title: 'New Loan Case', message: `Loan application for ${lc.customerName} — ₹${(lc.loanAmount / 100000).toFixed(0)}L`, role: 'bank' });
  },

  updateLoanMilestone: (caseId, milestoneStage, status, notes) => {
    set((s) => ({
      loanCases: s.loanCases.map((lc) => lc.id === caseId ? {
        ...lc,
        milestones: lc.milestones.map((m) => m.stage === milestoneStage ? {
          ...m, status, completedDate: status === 'Completed' ? new Date().toISOString().split('T')[0] : undefined, notes,
        } : m),
      } : lc),
    }));
    const lc = get().loanCases.find((c) => c.id === caseId);
    if (lc) {
      useNotificationStore.getState().addNotification({ type: 'success', title: 'Loan Milestone Updated', message: `${milestoneStage} — ${status} for ${lc.customerName}`, role: 'builder' });
      useNotificationStore.getState().addNotification({ type: 'success', title: 'Loan Update', message: `${milestoneStage} is now ${status}`, role: lc.isNRI ? 'nri' : 'customer' });
    }
  },

  addShareEvent: (event) =>
    set((s) => ({
      shareEvents: [...s.shareEvents, { ...event, id: `SE${Date.now()}`, timestamp: new Date().toISOString() }],
    })),
}));