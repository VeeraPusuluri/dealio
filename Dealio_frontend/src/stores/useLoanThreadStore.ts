import { create } from 'zustand';

export type LoanThreadStatus = 'Applied' | 'Documents Submitted' | 'Under Review' | 'Sanctioned' | 'Disbursed' | 'Rejected';

export const loanThreadStatusColors: Record<LoanThreadStatus, string> = {
  'Applied': '#3B82F6',
  'Documents Submitted': '#6366F1',
  'Under Review': '#F59E0B',
  'Sanctioned': '#0A7E8C',
  'Disbursed': '#16A34A',
  'Rejected': '#DC2626',
};

export interface LoanThreadEvent {
  id: string;
  type: 'property' | 'cp_joined' | 'customer_profile' | 'loan_initiated' | 'document' | 'status_update' | 'note';
  sender: string;
  senderRole: 'builder' | 'cp' | 'customer' | 'bank' | 'system';
  content: string;
  timestamp: string;
  attachment?: string;
}

export interface LoanThread {
  id: string;
  // Property
  projectId: string;
  projectName: string;
  tower: string;
  unit: string;
  floor: number;
  unitType: string;
  carpetArea?: number;
  saleValue: number;
  bookingAmount?: number;
  possessionDate?: string;
  // Customer
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerDob?: string;
  panNumber?: string;
  aadhaarLast4?: string;
  employmentType?: 'Salaried' | 'Self-Employed' | 'Business Owner' | 'Retired' | 'NRI';
  company?: string;
  monthlyIncome?: number;
  experience?: number;
  existingEmis?: number;
  cibilScore?: number;
  // CP
  cpId?: string;
  cpName?: string;
  cpTier?: string;
  cpCommission?: number;
  // Builder
  builderId?: string;
  builderName?: string;
  // Bank & Loan
  bank: string;
  loanAmount: number;
  tenure: number;
  loanType: 'Home Purchase' | 'Construction' | 'Plot + Construction' | 'Balance Transfer';
  interestRate?: number;
  emi?: number;
  officerName?: string;
  officerPhone?: string;
  // Status
  status: LoanThreadStatus;
  createdBy: string;
  createdByRole: string;
  createdAt: string;
  unreadUpdates: number;
  // Documents
  documents: { name: string; uploaded: boolean; required: boolean; category: string }[];
  // Timeline
  events: LoanThreadEvent[];
}


interface LoanThreadState {
  threads: LoanThread[];
  addThread: (thread: LoanThread) => void;
  updateStatus: (id: string, status: LoanThreadStatus, note?: string, updatedBy?: string) => void;
  addEvent: (threadId: string, event: LoanThreadEvent) => void;
  uploadDocument: (threadId: string, docName: string) => void;
}

export const useLoanThreadStore = create<LoanThreadState>((set) => ({
  threads: [],
  addThread: (thread) => set((state) => ({ threads: [...state.threads, thread] })),
  updateStatus: (id, status, note, updatedBy) =>
    set((state) => ({
      threads: state.threads.map((t) => {
        if (t.id !== id) return t;
        const event: LoanThreadEvent = {
          id: `LE${Date.now()}`,
          type: 'status_update',
          sender: updatedBy || 'System',
          senderRole: 'bank',
          content: `Status: ${t.status} → ${status}${note ? `. ${note}` : ''}`,
          timestamp: new Date().toISOString(),
        };
        return { ...t, status, events: [...t.events, event] };
      }),
    })),
  addEvent: (threadId, event) =>
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId ? { ...t, events: [...t.events, event] } : t
      ),
    })),
  uploadDocument: (threadId, docName) =>
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId
          ? { ...t, documents: t.documents.map((d) => (d.name === docName ? { ...d, uploaded: true } : d)) }
          : t
      ),
    })),
}));
